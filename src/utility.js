const crypto = require('crypto')
const xpath = require('xpath')
const { DOMParser } = require('@xmldom/xmldom')
const { OpenApiClientError } = require('./open-api-error')
const { CUSTOM_PREFIX, QUERY_KEYS, DEFAULT_EXPIRES } = require('./constants')

/**
 * 从map中获取以prefix的值为开头的项
 *
 * @param {Map<string, string | string[]>} map
 * @returns {NodeJS.Dict<string | string[]>}
 */
function getCustomMap (map) {
  /** @type {NodeJS.Dict<string | string[]>} */
  const iwopValues = {}
  for (const [name, value] of map.entries()) {
    const lowerCaseName = name.toLowerCase()
    if (lowerCaseName.startsWith(CUSTOM_PREFIX)) {
      iwopValues[lowerCaseName] = value
    }
  }
  return iwopValues
}
/**
 *
 * @param {URL} uri
 */
function getResource (uri) {
  let resourceUrl = new URL(uri)
  const [...names] = uri.searchParams.keys()

  for (const name of names) {
    // 排除掉表用于认证的固定参数
    if (QUERY_KEYS.includes(name)) {
      resourceUrl.searchParams.delete(name)
      continue
    }

    // 排除掉特定前缀的参数，例如 'x-iwop-'
    if (name.toLowerCase().startsWith(CUSTOM_PREFIX)) {
      resourceUrl.searchParams.delete(name)
    }
  }
  resourceUrl.searchParams.sort()
  return resourceUrl.toString()
}

/**
 * @param {SignatureMode} mode
 * @param {SignatureOption} option
 * @param {string} time
 * @returns {SignedData}
 */
function computeSignature (mode, option, time) {
  const signableItems = [option.method.toUpperCase()]
  if (option.contentType) {
    signableItems.push(option.contentType)
  }
  signableItems.push(time)
  /** @type {NodeJS.Dict<string | string[]>} */
  let customMap
  if (mode === 'header' && option.headers) {
    customMap = getCustomMap(new Map(Object.entries(option.headers)))
  } else if (mode === 'query') {
    customMap = getCustomMap(new Map(option.resourceUrl.searchParams.entries()))
  }

  if (customMap) {
    Object.keys(customMap)
      .sort()
      .forEach(key => {
        const item = `${key}:${customMap[key]}`
        signableItems.push(item)
      })
  }
  const canonicalizedResource = getResource(option.resourceUrl)
  signableItems.push(canonicalizedResource)

  const signable = signableItems.join('\n')
  const signature = hmacSha1(signable, option.secret)
  return { signable, signature }
}

/**
 *
 * @param {string} content
 * @param {string} key
 * @param {'base64' | 'hex'} encoding
 * @returns
 */
function hmacSha1 (content, key, encoding = 'base64') {
  const hmac = crypto.createHmac('sha1', key)
  const digest = hmac.update(content).digest()
  return digest.toString(encoding)
}

/**
 * @param {string} xml
 * @returns {ApiGatewayErrorData}
 */
function resolveError (xml) {
  // xml格式
  const doc = new DOMParser().parseFromString(xml)
  const rawError = /** @type {ApiGatewayErrorData} */ ({})

  /** @type {Element[]} */
  // @ts-ignore
  const nodes = xpath.select('/Error/*', doc)
  for (const node of nodes) {
    rawError[node.localName] = node.textContent
  }
  return rawError
}

/**
 * @param {SignatureMode} mode
 * @param {SignatureOption} option
 * @param {number} [duration]
 * @returns {QuerySignedInfo | HeaderSignedInfo}
 */
function generateSignature (mode, option, duration) {
  if (!option.accessId) {
    throw new OpenApiClientError('accessId不能为null或empty')
  }
  if (!option.secret) {
    throw new OpenApiClientError('secret不能为null或empty')
  }
  switch (mode) {
    case 'header':
    case 'query':
      break
    case undefined:
    case null:
      mode = 'header'
      break
    default:
      throw new OpenApiClientError("mode可选值只能是'header'和'query'")
  }

  const method = option.method.toUpperCase()
  switch (method) {
    case 'POST':
    case 'PUT':
    case 'PATCH':
      if (!option.contentType) {
        throw new OpenApiClientError(
          `http请求缺少'content-type'头。请求方式为[${method}]时，需要在RpcInvoker的headers属性上设置'content-type'`
        )
      }
  }
  /** @type {string} */
  let time
  /** @type {QuerySignedInfo['query']} */
  let query
  /** @type {HeaderSignedInfo['headers']} */
  let headers
  if (mode === 'query') {
    const d = duration || DEFAULT_EXPIRES
    const expires = Math.round(d + Date.now() / 1000)
    query = { AccessId: option.accessId, Expires: expires, Signature: null }
    time = String(expires)
  } else {
    time = new Date().toUTCString()
    headers = { Date: time, Authorization: null }
  }
  const signed = computeSignature(mode, option, time)
  if (process.env.DEBUG === 'true') {
    console.log(signed)
  }

  if (query) {
    query.Signature = signed.signature
    return { mode: 'query', signed, query }
  } else {
    headers.Authorization = `IWOP ${option.accessId}:${signed.signature}`
    return { mode: 'header', signed, headers }
  }
}

module.exports = {
  resolveError,
  generateSignature
}

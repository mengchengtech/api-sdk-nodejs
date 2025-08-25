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
    const locacaseName = name.toLowerCase()
    if (locacaseName.startsWith(CUSTOM_PREFIX)) {
      resourceUrl.searchParams.delete(name)
    }
  }
  resourceUrl.searchParams.sort()
  return resourceUrl.toString()
}

/**
 * @param {keyof SignedInfoTypeMap} mode
 * @param {SignatureOption} option
 * @param {string} time
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
    const keys = Object.keys(customMap).sort()
    for (const key of keys) {
      signableItems.push(`${key}:${customMap[key]}`)
    }
  }
  const canonicalizedResource = getResource(option.resourceUrl)
  signableItems.push(canonicalizedResource.toString())
  const signable = signableItems.join('\n')
  return {
    signable,
    signature: hmacSha1(signable, option.secret)
  }
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
  const rawError = {}

  /** @type {Element[]} */
  // @ts-ignore
  const nodes = xpath.select('/Error/*', doc)
  for (const node of nodes) {
    rawError[node.localName] = node.textContent
  }
  return rawError
}

/**
 * @template {keyof SignedInfoTypeMap} M
 *
 * @param {M} mode
 * @param {SignatureOption} option
 * @param {number} [duration]
 * @returns {SignedInfoTypeMap[M]}
 */
function generateSignature (mode, option, duration) {
  if (!option.accessId) {
    throw new OpenApiClientError('accessId不能为null或empty')
  }
  if (!option.secret) {
    throw new OpenApiClientError('secret不能为null或empty')
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
  let query = null
  let headers = null
  if (mode === 'query') {
    const d = duration || DEFAULT_EXPIRES
    const expires = Math.round(d + Date.now() / 1000)
    query = { Expires: expires }
    time = String(expires)
  } else {
    time = new Date().toUTCString()
    headers = { Date: time }
  }
  const signed = computeSignature(mode, option, time)

  if (mode === 'query') {
    query.AccessId = option.accessId
    query.Signature = signed.signature
    return { signed, query }
  } else {
    headers.Authorization = `IWOP ${option.accessId}:${signed.signature}`
    return { signed, headers }
  }
}

module.exports = {
  resolveError,
  /**
   *
   * @param {SignatureOption} option
   * @param {number} [duration]
   */
  generateQuerySignature (option, duration) {
    return generateSignature('query', option, duration)
  },
  /**
   *
   * @param {SignatureOption} option
   */
  generateHeaderSignature (option) {
    return generateSignature('header', option)
  }
}

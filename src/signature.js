const CryptoJS = require('crypto-js')

/**
   *
   * @param {SignatureOption} option
   */
module.exports = function generateSignatureInfo (option) {
  let method = option.method.toUpperCase()
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    if (!option.contentType) {
      throw new Error(`http请求缺少'content-type'头。请求方式为[${method}]时，需要在RpcInvoker的headers属性上设置'content-type'`)
    }
  }
  let date = new Date().toGMTString()
  let signature = computeSignature(option, date)

  return {
    authorization: `IWOP ${option.accessId}:${signature}`,
    date
  }
}

function computeSignature (option, date) {
  let policyItems = [option.method.toUpperCase()]
  if (option.contentType) {
    policyItems.push(option.contentType)
  }
  policyItems.push(date)
  let keys = Object.keys(option.headers)
  keys = keys.sort()

  for (let key of keys) {
    if (key.startsWith('x-iwop-')) {
      policyItems.push(`${key}:${option.headers[key]}`)
    }
  }

  let resourceUrl = option.resourceUrl
  resourceUrl.searchParams.sort()
  policyItems.push(option.resourceUrl.toString())
  let policy = policyItems.join('\n')
  return hmacSha1(policy, option.secret)
}

function hmacSha1 (content, key, encoding = 'base64') {
  let data = CryptoJS.HmacSHA1(content, key)
  let enc = encoding === 'base64' ? CryptoJS.enc.Base64 : CryptoJS.enc.Hex
  return data.toString(enc)
}

/**
 * @typedef {object} SignatureOption
 * @property {string} accessId
 * @property {string} secret
 * @property {string} method 设置REST调用签名中的method信息
 * @property {string} contentType 设置REST调用中的content-type头
 * @property {string} resourceUrl 设置REST调用签名中的url路径信息
 * @property {{[name:string]: string}} 自定义的headers头
 */

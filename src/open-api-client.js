const generateSignatureInfo = require('./signature')
const { URL } = require('url')
const xpath = require('xpath')
const { DOMParser } = require('xmldom')
const asyncRequest = require('request-promise-native')

class OpenApiClient {
  /**
   *
   * @param {string | URL} baseUri
   * @param {*} accessId
   * @param {*} secretKey
   */
  constructor (baseUri, accessId, secretKey) {
    this._baseUri = typeof baseUri === 'string' ? new URL(baseUri) : baseUri
    this._accessId = accessId
    this._secretKey = secretKey
  }

  /**
   * @param {string} apiUrl
   * @param {TUriUrlOptions & TOptions} [option = null]  ‘request’模块对应的参数，详细信息参见request模块的描述
   */
  async get (apiUrl, option) {
    const result = await this._invoke(apiUrl, 'GET', option)
    return result
  }

  /**
   * @param {string} apiUrl
   * @param {TUriUrlOptions & TOptions} [option = null]  ‘request’模块对应的参数，详细信息参见request模块的描述
   */
  async post (apiUrl, option) {
    const result = await this._invoke(apiUrl, 'POST', option)
    return result
  }

  /**
   * @param {string} apiUrl
   * @param {TUriUrlOptions & TOptions} [option = null]  ‘request’模块对应的参数，详细信息参见request模块的描述
   */
  async delete (apiUrl, option) {
    const result = await this._invoke(apiUrl, 'DELETE', option)
    return result
  }

  /**
   * @param {string} apiUrl
   * @param {TUriUrlOptions & TOptions} [option = null]  ‘request’模块对应的参数，详细信息参见request模块的描述
   */
  async patch (apiUrl, option) {
    const result = await this._invoke(apiUrl, 'PATCH', option)
    return result
  }

  /**
   * @param {string} apiUrl
   * @param {TUriUrlOptions & TOptions} [option = null] ‘request’模块对应的参数，详细信息参见request模块的描述
   */
  async put (apiUrl, option) {
    const result = await this._invoke(apiUrl, 'PUT', option)
    return result
  }

  async _invoke (apiUrl, method, option = {}) {
    option.url = new URL(apiUrl, this._baseUri)
    let signatureInfo = generateSignatureInfo({
      accessId: this._accessId,
      secret: this._secretKey,
      method,
      contentType: option.headers ? option.headers['content-type'] : undefined,
      resourceUrl: option.url,
      headers: option.headers || {}
    })

    option.json = true
    option.method = method
    option.headers = Object.assign({}, option.headers, signatureInfo)
    try {
      const result = await asyncRequest(option)
      return result
    } catch (err) {
      resolveError(err)
      throw err
    }
  }
}

/**
 * @param {Error} err
 */
function resolveError (err) {
  let body = err.response.body
  if (!body) {
    return
  }

  // xml格式
  const doc = new DOMParser().parseFromString(body)
  const rawError = {}

  /** @type {Element[]} */
  // @ts-ignore
  const nodes = xpath.select('/Error/*', doc)
  for (const node of nodes) {
    rawError[node.localName] = node.textContent
  }
  err.code = rawError.Code
  err.desc = rawError.Message
  err.handled = true
}

module.exports = { OpenApiClient }

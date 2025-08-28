const { URL } = require('url')
const { AxiosHeaders } = require('axios')
const defaultAxios = require('axios').default
const utility = require('./utility')
const { OpenApiClientError, OpenApiResponseError } = require('./open-api-error')
const { StreamResult, TypedResult } = require('./request-result')

const CONTENT_TYPE_VALUE = 'application/json; charset=UTF-8'
const ACCEPT_VALUE = 'application/json, application/xml, */*'

class OpenApiClient {
  /**
   *
   * @param {string | URL} baseUri
   * @param {string} accessId
   * @param {string} secretKey
   */
  constructor (baseUri, accessId, secretKey) {
    this._baseUri = typeof baseUri === 'string' ? new URL(baseUri) : baseUri
    if (!accessId) {
      throw new OpenApiClientError('accessId不能为null或empty')
    }
    if (!secretKey) {
      throw new OpenApiClientError('secret不能为null或empty')
    }

    this._accessId = accessId
    this._secretKey = secretKey
    this._httpClient = defaultAxios.create({
      headers: {
        Accept: ACCEPT_VALUE,
        'Accept-Language': 'zh-CN',
        'Accept-Encoding': 'gzip,deflate'
      },
      decompress: true,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    })
  }

  /**
   * @template {keyof ResponseTypeMap} T
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async get (apiPath, option) {
    return this.request({ method: 'GET' }, apiPath, option)
  }

  /**
   * @template {keyof ResponseTypeMap} T
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async post (apiPath, option) {
    return this.request({ method: 'POST' }, apiPath, option)
  }

  /**
   * @template {keyof ResponseTypeMap} T
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async delete (apiPath, option) {
    return this.request({ method: 'DELETE' }, apiPath, option)
  }

  /**
   * @template {keyof ResponseTypeMap} T
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async patch (apiPath, option) {
    return this.request({ method: 'PATCH' }, apiPath, option)
  }

  /**
   * @template {keyof ResponseTypeMap} T
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async put (apiPath, option) {
    return this.request({ method: 'PUT' }, apiPath, option)
  }

  /**
   * @template {keyof ResponseTypeMap} T
   *
   * @param {import('axios').AxiosRequestConfig} req
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async request (req, apiPath, option) {
    req = { ...req }
    if (!(req.headers instanceof AxiosHeaders)) {
      req.headers = new AxiosHeaders(req.headers)
    }
    option = option || {}

    if (option.body) {
      req.data = option.body
      req.headers.set('Content-Type', option.contentType || CONTENT_TYPE_VALUE)
    }

    const apiUrl = new URL(apiPath, this._baseUri)
    if (option.query) {
      for (const key in option.query) {
        apiUrl.searchParams.set(key, option.query[key])
      }
    }
    req.url = apiUrl.toString()
    if (option.headers) {
      req.headers.set(option.headers)
    }

    this.makeSignature(req, option.signedBy)
    req.timeout = option.timeout
    try {
      switch (option.responseType) {
        case 'buffer':
          req.responseType = 'arraybuffer'
          break
        case 'stream':
          req.responseType = 'stream'
          break
        case 'json':
        case undefined:
        case null:
          req.responseType = 'json'
          break
        case 'string':
        default:
          req.responseType = 'text'
          break
      }
      const response = await this._httpClient.request(req)
      return /** @type {ResponseTypeMap[T]} */ /** @type {any} */ (
        req.responseType === 'stream'
          ? new StreamResult(response)
          : new TypedResult(response)
      )
    } catch (err) {
      if (!defaultAxios.isAxiosError(err)) {
        throw err
      }
      const res = err.response
      if (res) {
        let xml = ''
        if (req.responseType === 'stream') {
          const result = new StreamResult(res)
          xml = await result.getString()
        } else {
          const result = new TypedResult(res)
          xml = result.getString()
        }
        const errorData = utility.resolveError(xml)
        throw new OpenApiResponseError(err.message, res.status, err, errorData)
      }
      throw err
    }
  }

  /**
   * @private
   *
   * @param {import('axios').AxiosRequestConfig} req
   * @param {SignatureMode | SignedBy} [signedBy]
   */
  makeSignature (req, signedBy) {
    const reqHeaders = /** @type {AxiosHeaders} */ (req.headers)
    /** @type {SignatureOption} */
    const option = {
      accessId: this._accessId,
      secret: this._secretKey,
      resourceUrl: new URL(req.url),
      method: req.method,
      contentType: /** @type {string} */ (reqHeaders.get('Content-Type')),
      headers: req.headers
    }
    if (!signedBy) {
      signedBy = /** @type {SignedByHeader} */ ({ mode: 'header' })
    }
    const signedInfo = utility.generateSignature(signedBy, option)
    if ('headers' in signedInfo) {
      reqHeaders.set(signedInfo.headers)
    }
    if ('query' in signedInfo) {
      const targetURL = new URL(req.url)
      for (const key in signedInfo.query) {
        targetURL.searchParams.set(key, signedInfo.query[key])
      }
      req.url = targetURL.toString()
    }
  }
}

module.exports = { OpenApiClient }

const { URL } = require('url')
const { AxiosHeaders } = require('axios')
const defaultAxios = require('axios').default
const { IncomingMessage } = require('http')
const utility = require('./utility')
const { OpenApiClientError, OpenApiResponseError } = require('./open-api-error')

const CONTENT_TYPE_VALUE = 'application/json; charset=UTF-8'
const ACCEPT_VALUE = 'application/json, application/xml, */*'

/**
 *
 * @param {import('axios').AxiosResponse<any, any>} res
 */
async function tryResolveError (res) {
  if (!res) {
    return
  }

  if (typeof res.data === 'string') {
    return
  }

  if (res.data instanceof Buffer) {
    res.data = res.data.toString('utf-8')
    return
  }

  if (res.data instanceof IncomingMessage) {
    /** @type {Buffer} */
    const data = await new Promise((resolve, reject) => {
      /** @type {IncomingMessage} */
      const httpRes = res.data
      const buffers = []
      httpRes
        .on('data', chunk => {
          buffers.push(chunk)
        })
        .on('end', () => {
          return resolve(Buffer.concat(buffers))
        })
        .on('error', reject)
    })
    res.data = data.toString('utf-8')
  }
}

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
    return this._invoke('GET', apiPath, option)
  }

  /**
   * @template {keyof ResponseTypeMap} T
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async post (apiPath, option) {
    return this._invoke('POST', apiPath, option)
  }

  /**
   * @template {keyof ResponseTypeMap} T
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async delete (apiPath, option) {
    return this._invoke('DELETE', apiPath, option)
  }

  /**
   * @template {keyof ResponseTypeMap} T
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async patch (apiPath, option) {
    return this._invoke('PATCH', apiPath, option)
  }

  /**
   * @template {keyof ResponseTypeMap} T
   * @param {string} apiPath
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async put (apiPath, option) {
    return this._invoke('PUT', apiPath, option)
  }

  /**
   * @private
   * @template {keyof ResponseTypeMap} T
   *
   * @param {'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT'} method
   * @param {string} apiPath
   * @param {RequestOption<T>} option
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async _invoke (method, apiPath, option) {
    try {
      const result = await this.request({ method }, apiPath, option)
      return result.data
    } catch (err) {
      if (err instanceof OpenApiResponseError) {
        const o = /** @type {any} */ (err)
        o.code = err.data.Code
        o.desc = err.data.Message
        o.handled = true
      }
      throw err
    }
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
      if (option.responseType) {
        switch (option.responseType) {
          case 'buffer':
            req.responseType = 'arraybuffer'
            break
          case 'json':
          case 'text':
          case 'stream':
            req.responseType = option.responseType
            break
        }
      }
      const result = await this._httpClient.request(req)
      return result
    } catch (err) {
      if (!defaultAxios.isAxiosError(err)) {
        throw err
      }
      const res = err.response
      if (res) {
        await tryResolveError(res)
        const data = res.data
        const errorData = utility.resolveError(data)
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

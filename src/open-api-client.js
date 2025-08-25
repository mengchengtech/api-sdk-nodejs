const { URL } = require('url')
const defaultAxios = require('axios').default
const { IncomingMessage } = require('http')
const $axios = defaultAxios.create({
  headers: {
    Accept: 'application/json,application/xml,*/*',
    'Accept-Encoding': 'gzip,deflate',
    'Accept-Language': 'zh-CN'
  },
  decompress: true,
  maxContentLength: Infinity,
  maxBodyLength: Infinity
})
const utility = require('./utility')
const { OpenApiRequestError } = require('./open-api-error')

const CONTENT_TYPE_VALUE = 'application/json; charset=UTF-8'

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
    this._accessId = accessId
    this._secretKey = secretKey
  }

  /**
   * @private
   * @template {keyof ResponseTypeMap} T
   *
   * @param {string} method
   * @param {string} apiPath
   * @param {RequestOption<T>} option
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async _invoke (method, apiPath, option) {
    try {
      const result = await this.request({ method }, apiPath, option)
      return result.data
    } catch (err) {
      if (err instanceof OpenApiRequestError) {
        err.code = err.data.Code
        err.desc = err.data.Message
        err.handled = true
      }
      throw err
    }
  }

  /**
   * @template {keyof ResponseTypeMap} T
   *
   * @param {import('axios').AxiosRequestConfig} req
   * @param {RequestOption<T>} [option]
   * @returns {Promise<ResponseTypeMap[T]>}
   */
  async request (req, apiPath, option) {
    req.headers = req.headers || {}
    option = option || {}

    if (option.body) {
      req.data = option.body
      req.headers['Content-Type'] = option.contentType || CONTENT_TYPE_VALUE
    }

    req.url = new URL(apiPath, this._baseUri)
    if (option.query) {
      for (const key in option.query) {
        req.url.searchParams.set(key, option.query[key])
      }
    }

    req.headers = {
      ...req.headers,
      ...option.headers
    }

    this._makeSignature(req, option.headers)
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

    req.timeout = option.timeout
    try {
      const result = await $axios.request(req)
      return result
    } catch (err) {
      await tryResolveError(err)
      const axiosError = /** @type {import('axios').AxiosError} */ (err)
      const data = axiosError.response?.data
      const errorData = utility.resolveError(data)
      throw new OpenApiRequestError(err.message, err, errorData)
      throw err
    }
  }

  /**
   * @private
   *
   * @param {import('axios').AxiosRequestConfig} req
   * @param {Record<string, string>} headers
   */
  _makeSignature (req, headers) {
    req.headers = { ...req.headers, ...headers }
    /** @type {SignatureOption} */
    const option = {
      accessId: this._accessId,
      secret: this._secretKey,
      resourceUrl: req.url,
      method: req.method,
      contentType: req.headers['Content-Type'],
      headers: req.headers
    }
    const signedInfo = utility.generateHeaderSignature(option)
    req.headers = { ...req.headers, ...signedInfo.headers }
  }
}

for (const funcName of ['get', 'post', 'delete', 'patch', 'put']) {
  const methodName = funcName.toUpperCase()

  /** @this {OpenApiClient} */
  OpenApiClient.prototype[funcName] = async function (apiPath, option) {
    return this._invoke(methodName, apiPath, option)
  }
}

module.exports = { OpenApiClient }

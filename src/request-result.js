const { IncomingMessage } = require('http')

class RequestResult {
  /**
   *
   * @param {import('axios').AxiosResponse} response
   */
  constructor (response) {
    /** @protected */
    this._response = response
  }

  /**
   * @private
   */
  get headers () {
    return /** @type {import('axios').AxiosResponseHeaders} */ (
      this._response.headers
    )
  }

  get status () {
    return this._response.status
  }

  get contentType () {
    return /** @type {string} */ (this.headers.get('Content-Type'))
  }
}

/**
 * @implements {TypedRequestResult}
 */
class TypedResult extends RequestResult {
  /**
   *
   * @returns {string}
   */
  getString () {
    const data = this._response.data
    if (typeof data === 'string') {
      // 返回纯文本
      return data
    }
    throw new Error('[getString] opeartion not supported')
  }

  /**
   *
   * @returns {Buffer}
   */
  getBuffer () {
    const data = this._response.data
    if (data instanceof Buffer) {
      return data
    }
    throw new Error('[getBuffer] opeartion not supported')
  }

  /**
   * @template T
   * @returns {T}
   */
  getJson () {
    const resType = this._response.config.responseType ?? 'json'
    if (resType === 'json') {
      const data = this._response.data
      if (typeof data !== 'string' && !(data instanceof Buffer)) {
        return data
      }
    }
    throw new Error('[getJson] opeartion not supported')
  }

  /**
   *
   * @returns {any}
   */
  getRaw () {
    return this._response.data
  }
}

/**
 * @implements {StreamRequestResult}
 */
class StreamResult extends RequestResult {
  /**
   * 以字符串方式获取返回的文本内容
   *
   * @returns {Promise<string>}
   */
  async getString () {
    const data = await this.getBuffer()
    return data.toString('utf-8')
  }
  /**
   * @returns {Promise<Buffer>}
   */
  async getBuffer () {
    /** @type {Buffer} */
    const data = await new Promise((resolve, reject) => {
      /** @type {IncomingMessage} */
      const httpRes = this._response.data
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
    return data
  }
  /**
   * @template T
   * @returns {Promise<T>}
   */
  async getJson () {
    const data = await this.getString()
    return JSON.parse(data)
  }

  /**
   * @returns {NodeJS.ReadableStream} 获取一个用于读返回结果的流
   */
  openRead () {
    return this._response.data
  }
}

module.exports = { StreamResult, TypedResult }

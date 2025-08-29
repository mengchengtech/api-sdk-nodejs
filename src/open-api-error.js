class OpenApiResponseError extends Error {
  /**
   *
   * @param {string} message
   * @param {number} status
   * @param {Error} rawError
   * @param {ApiGatewayErrorData} data
   */
  constructor (message, status, rawError, data) {
    super(message)
    this.name = 'OpenApiResponseError'
    this.status = status
    this.rawError = rawError
    this.data = data
  }
}

class OpenApiClientError extends Error {
  /**
   *
   * @param {string} message
   */
  constructor (message) {
    super(message)
    this.name = 'OpenApiClientError'
  }
}

module.exports = {
  OpenApiResponseError,
  OpenApiClientError
}

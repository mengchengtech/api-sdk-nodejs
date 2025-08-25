class OpenApiRequestError extends Error {
  /**
   *
   * @param {string} message
   * @param {Error} rawError
   * @param {ApiGatewayErrorData} data
   */
  constructor (message, rawError, data) {
    super(message)
    this.name = 'OpenApiRequestError'
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
  OpenApiRequestError,
  OpenApiClientError
}

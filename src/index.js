const { OpenApiRequestError, OpenApiClientError } = require('./open-api-error')
const { OpenApiClient } = require('./open-api-client')
const {
  generateHeaderSignature,
  generateQuerySignature,
  resolveError
} = require('./utility')

module.exports = {
  OpenApiClient,
  OpenApiClientError,
  OpenApiRequestError,
  utility: {
    generateHeaderSignature,
    generateQuerySignature,
    resolveError
  }
}

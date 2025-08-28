const chaiAsPromised = require('chai-as-promised')
// @ts-ignore
require('chai').use(chaiAsPromised)

const config = require('./config')
const { OpenApiClient } = require('../src')
/** @type {import('../types').OpenApiClient} */
const client = new OpenApiClient(
  config.baseUrl,
  config.credential.accessId,
  config.credential.secretKey
)

module.exports = { client, config }

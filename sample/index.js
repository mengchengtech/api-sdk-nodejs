const config = require('./config')
const { OpenApiClient, OpenApiResponseError } = require('../src')

/** @type {import('../types').OpenApiClient} */
const client = new OpenApiClient(
  config.baseUrl,
  config.credential.accessId,
  config.credential.secretKey
)

async function testGetByHeader () {
  try {
    const data = await client.get(config.apiPath, {
      query: { integratedProjectId: config.integrationId },
      headers: {
        'X-iwop-before': 'wq666',
        'x-iwop-integration-id': config.integrationId,
        'x-IWOP-after': 'wq666'
      }
    })
    console.log(data)
  } catch (err) {
    if (err instanceof OpenApiResponseError) {
      // TODO: 处理api网关返回的异常
      const error = err.data
      console.error(JSON.stringify(error))
    } else {
      // TODO: 处理异常
      console.error(err)
    }
  }
}

async function testGetByQuery () {
  try {
    const data = await client.get(config.apiPath, {
      signedBy: 'query',
      query: {
        integratedProjectId: config.integrationId,
        'X-iwop-before': 'wq666',
        'x-iwop-integration-id': config.integrationId,
        'x-IWOP-after': 'wq666'
      }
    })
    console.log(data)
  } catch (err) {
    if (err instanceof OpenApiResponseError) {
      // TODO: 处理api网关返回的异常
      const error = err.data
      console.error(JSON.stringify(error))
    } else {
      // TODO: 处理异常
      console.error(err)
    }
  }
}

async function testPostByHeader () {
  try {
    const data = await client.post(config.apiPath, {
      query: { integratedProjectId: config.integrationId },
      contentType: 'application/xml',
      headers: { 'x-iwop-integration-id': config.integrationId },
      body: '<demo></demo>'
    })
    console.log(data)
  } catch (err) {
    if (err instanceof OpenApiResponseError) {
      // TODO: 处理api网关返回的异常
      const error = err.data
      console.error(JSON.stringify(error))
    } else {
      // TODO: 处理异常
      console.error(err)
    }
  }
}

async function main () {
  try {
    await testGetByHeader()
    await testGetByQuery()
    await testPostByHeader()
  } catch (ex) {
    console.log(ex.data || ex.message)
  }
}

main()

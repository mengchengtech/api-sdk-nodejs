const fs = require('fs')
const { OpenApiClient } = require('../src')

const credential = {
  accessId: '{accessId}',
  secretKey: '{secretKey}'
}
const baseUrl = 'https://test.mctech.vip/api-ex/-itg-/'
const apiPath = 'cb/project-wbs/items'
const integrationId = '{integrationId}'

async function testGet () {
  const client = new OpenApiClient(
    baseUrl,
    credential.accessId,
    credential.secretKey
  )
  const data = await client.get(apiPath, {
    query: { integratedProjectId: integrationId },
    headers: {
      'X-iwop-before': 'wq666',
      'x-iwop-integration-id': integrationId,
      'x-IWOP-after': 'wq666'
    }
  })
  console.log(data)
}

async function testPost () {
  const client = new OpenApiClient(
    baseUrl,
    credential.accessId,
    credential.secretKey
  )
  const data = await client.post(apiPath, {
    query: { integratedProjectId: integrationId },
    contentType: 'application/xml',
    headers: { 'x-iwop-integration-id': integrationId },
    body: '<demo></demo>'
  })
  console.log(data)
}

async function main () {
  try {
    await testGet()
    await testPost()
  } catch (ex) {
    console.log(ex.data)
  }
}

main()

const { assert, expect } = require('chai')
const $ = require('./test-global')

// 调试，输出客户端生成签名信息
// 用于返回签名不匹配异常时，与服务端签名的信息比对，找出生成签名原始数据的差异
// process.env.DEBUG = 'true'

describe('api client test suite', async function () {
  describe('typed result test', async function () {
    it('GET by HEADER and return [string] result', async function () {
      const result = await $.client.get($.config.apiPath, {
        query: { integratedProjectId: $.config.integrationId },
        headers: {
          'X-iwop-before': 'wq666',
          'x-iwop-integration-id': $.config.integrationId,
          'x-IWOP-after': 'wq666'
        }
      })
      assert.equal(result.status, 200)
      assert.equal(result.contentType.split(';')[0], 'application/json')
      const data = result.getJson()
      assert.property(data, 'updateAt')
      assert.property(data, 'data')
    })

    it('GET by HEADER and return [json] result', async function () {
      const result = await $.client.get($.config.apiPath, {
        signedBy: 'header',
        query: {
          integratedProjectId: $.config.integrationId
        },
        headers: {
          'X-iwop-before': 'wq666',
          'x-iwop-integration-id': $.config.integrationId,
          'x-IWOP-after': 'wq666'
        }
      })
      assert.equal(result.status, 200)
      assert.equal(result.contentType.split(';')[0], 'application/json')
      const data = result.getJson()
      assert.property(data, 'updateAt')
      assert.property(data, 'data')
    })

    it('GET by QUERY and return [buffer] result', async function () {
      const result = await $.client.get($.config.apiPath, {
        signedBy: {
          mode: 'query',
          parameters: { duration: 3600 }
        },
        query: {
          integratedProjectId: $.config.integrationId,
          'X-iwop-before': 'wq666',
          'x-iwop-integration-id': $.config.integrationId,
          'x-IWOP-after': 'wq666'
        }
      })
      assert.equal(result.status, 200)
      assert.equal(result.contentType.split(';')[0], 'application/json')
      const data = result.getJson()
      assert.property(data, 'updateAt')
      assert.property(data, 'data')
    })

    it('GET by QUERY and return [stream] result', async function () {
      const result = await $.client.get($.config.apiPath, {
        responseType: 'stream',
        signedBy: 'query',
        query: {
          integratedProjectId: $.config.integrationId,
          'X-iwop-before': 'wq666',
          'x-iwop-integration-id': $.config.integrationId,
          'x-IWOP-after': 'wq666'
        }
      })
      assert.equal(result.status, 200)
      assert.equal(result.contentType.split(';')[0], 'application/json')
      const data = await result.getJson()
      assert.property(data, 'updateAt')
      assert.property(data, 'data')
    })
  })

  describe('stream result test', async function () {
    it('POST by HEADER and return [stream] result. api not exists', async function () {
      try {
        await $.client.post($.config.apiPath, {
          responseType: 'stream',
          query: { integratedProjectId: $.config.integrationId },
          contentType: 'application/xml',
          headers: {
            'x-iwop-integration-id': $.config.integrationId,
            'x-forwarded-for': '192.168.1.1'
          },
          body: '<demo></demo>'
        })
        assert.fail()
      } catch (ex) {
        assert.equal(ex.name, 'OpenApiResponseError')
        assert.equal(ex.status, 404)
        assert.deepEqual(ex.data, {
          ClientIP: '192.168.1.1',
          Code: 'SERVICE_NOT_FOUND',
          Message:
            "'POST /api-ex/-itg-/cb/project-wbs/items' 对应的服务不存在。请检查rest请求中的method, path是否与相应api文档中的完全一致"
        })
      }
    })

    it('POST by QUERY and return [typed] result. api not exists', async function () {
      try {
        await $.client.post($.config.apiPath, {
          responseType: 'string',
          signedBy: 'query',
          query: {
            integratedProjectId: $.config.integrationId,
            'x-iwop-integration-id': $.config.integrationId
          },
          headers: {
            'x-forwarded-for': '192.168.1.110'
          },
          contentType: 'application/xml',
          body: '<demo></demo>'
        })
        assert.fail()
      } catch (ex) {
        assert.deepEqual(ex.data, {
          ClientIP: '192.168.1.110',
          Code: 'SERVICE_NOT_FOUND',
          Message:
            "'POST /api-ex/-itg-/cb/project-wbs/items' 对应的服务不存在。请检查rest请求中的method, path是否与相应api文档中的完全一致"
        })
      }
    })
  })
})

const fs = require('fs')
const path = require('path')

// 调试，输出客户端生成签名信息
// 用于返回签名不匹配异常时，与服务端签名的信息比对，找出生成签名原始数据的差异
process.env.DEBUG = 'true'

const config = {
  credential: {
    accessId: '{accessId}',
    secretKey: '{secretKey}'
  },
  baseUrl: '{baseUrl}',
  apiPath: '{apiPath}',
  integrationId: '{integrationId}'
}

const configPath = path.join(__dirname, 'config.yaml')
if (fs.existsSync(configPath)) {
  const content = fs.readFileSync(configPath, 'utf-8')
  const yaml = require('js-yaml')
  const json = yaml.load(content)

  Object.assign(config, json)
}

module.exports = config

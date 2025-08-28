const fs = require('fs')
const path = require('path')

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

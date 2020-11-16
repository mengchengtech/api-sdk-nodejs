const log4js = require('log4js')
const fs = require('fs')
const { OpenApiClient } = require('../src')

const log4jsConfig = {
  appenders: {
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['console'], level: 'INFO' }
  }
}
log4js.configure(log4jsConfig)

const accessId = 'accessId'
const secretKey = 'secretKey'
const baseUri = 'https://api.mctech.vip'

const logger = log4js.getLogger('logger')
const outputFile = 'project-construction-record.txt'
const client = new OpenApiClient(baseUri, accessId, secretKey)

let totalCount = 0

doRun()

async function doRun () {
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile)
  }
  const projectIds = await getProjects()

  await getBiz('projectSpot')

  for (const projId of projectIds) {
    await getPcr(projId)
  }

  process.exit(0)
}

/**
 * @returns {number[]}
 */
async function getProjects () {
  /**
   * @type {number[]}
   */
  const projectIds = []
  let startId = 0
  let pageSize = 200
  while (true) {
    const apiUrl = `/org-api/projects?start=${startId}&limit=${pageSize}`
    /**
       * @type {any[]}
       */
    const projects = await client.get(apiUrl)
    for (const proj of projects) {
      projectIds.push(proj.id)
    }
    if (projects.length < pageSize) {
      break
    }
    startId = projects[projects.length - 1].version
  }
  return projectIds
}

/**
 *
 * @param {string} table
 */
async function getBiz (table) {
  const apiUrl = `/v2/biz-data`
  try {
    const arr = await client.post(apiUrl, {
      body: {
        tableName: table
      },
      headers: { 'content-type': 'application/json' }
    })
    logger.info('get %d records on table %s', arr.length, table)
  } catch (ex) {
    logger.error('call api error:  %s', ex.message)
  }
}

/**
 *
 * @param {number} orgId
 */
async function getPcr (orgId) {
  let startId = 0
  let startVersion = 0
  const pageSize = 50
  while (true) {
    const apiUrl = `/external/project-construction-record?startId=${startId}&startVersion=${startVersion}&limit=${pageSize}&orgId=${orgId}`
    try {
      const arr = await client.get(apiUrl)
      const count = arr.length
      totalCount += count
      writePcrFile(arr)
      logger.info('get %d records on project %d', totalCount, orgId)
      if (count < pageSize) {
        break
      }
      startId = arr[arr.length - 1].id
      startVersion = arr[arr.length - 1].version
    } catch (ex) {
      logger.error('call api error:  %s', ex.message)
    }
  }
}

function writePcrFile (arr) {
  fs.appendFileSync(outputFile, JSON.stringify(arr), { encoding: 'utf8' })
}

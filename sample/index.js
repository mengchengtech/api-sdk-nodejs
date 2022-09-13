const fs = require('fs')
const { OpenApiClient } = require('../src')

const accessId = 'accessId'
const secretKey = 'secretKey'
const baseUri = 'https://api.mctech.vip'

const outputFile = 'project-construction-record.txt'
const client = new OpenApiClient(baseUri, accessId, secretKey)

let totalCount = 0

doRun()

async function doRun () {
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile)
  }
  try {
    const projectIds = await getProjects()
    await getBiz('projectSpot')
    for (const projId of projectIds) {
      await getPcr(projId)
    }
  } catch (ex) {
    console.log(ex)
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
  const arr = await client.post(apiUrl, {
    body: {
      tableName: table
    },
    headers: { 'content-type': 'application/json' }
  })
  console.log(`get ${arr.length} records on table ${table}`)
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
    const arr = await client.get(apiUrl)
    const count = arr.length
    totalCount += count
    writePcrFile(arr)
    console.log(`get ${totalCount} records on project ${orgId}`)
    if (count < pageSize) {
      break
    }
    startId = arr[arr.length - 1].id
    startVersion = arr[arr.length - 1].version
  }
}

function writePcrFile (arr) {
  fs.appendFileSync(outputFile, JSON.stringify(arr), { encoding: 'utf8' })
}

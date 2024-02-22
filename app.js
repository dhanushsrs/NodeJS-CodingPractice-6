const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const convertDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

// API 1 GET METHOD
app.get('/states/', async (request, response) => {
  const getStates = `
    SELECT * 
    FROM state
    ORDER BY 
    state_id`
  const stateList = await db.all(getStates)

  response.send(
    stateList.map(eachState => {
      return convertDbObjectToResponseObject(eachState)
    }),
  )
})

// API 2 GET METHOD
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getParticularState = `
    SELECT * 
    FROM state
    WHERE
    state_id = ${stateId}`
  const particularState = await db.get(getParticularState)

  response.send(convertDbObjectToResponseObject(particularState))
})

// API 3 POST METHOD
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrict = `
  INSERT INTO 
    district(district_name, state_id, cases, cured, active, deaths)
  VALUES(
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths});`
  const newDistrict = await db.run(addDistrict)
  response.send('District Successfully Added')
})

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

// API 4 GET METHOD
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getParticularDistrict = `
    SELECT * 
    FROM district
    WHERE
    district_id = ${districtId}`
  const particularDistrict = await db.get(getParticularDistrict)

  response.send(convertDistrictDbObjectToResponseObject(particularDistrict))
})

// API 5 DELETE METHOD
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const deleteDistrict = `
  DELETE FROM
   district
  WHERE 
    district_id = ${districtId}`

  const deletedDistrict = await db.run(deleteDistrict)
  response.send('District Removed')
})

// API 6 PUT METHOD
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrict = `
  UPDATE
    district
  SET 
   district_name = '${districtName}',
   state_id =  ${stateId},
   cases = ${cases},
   cured =  ${cured},
   active =  ${active},
   deaths =  ${deaths};
  WHERE 
    district_id = ${districtId}`

  const UpdatedDistrict = await db.run(updateDistrict)
  response.send('District Details Updated')
})

// API 7 GET METHOD
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStats = `
    SELECT 
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths) 
    FROM district
    WHERE
    state_id = ${stateId};`
  const stats = await db.get(getStateStats)

  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

//API 8 GET METHOD:
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
SELECT state_id 
FROM district
WHERE district_id = ${districtId};`
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)

  console.log(getDistrictIdQueryResponse)

  const getStateNameQuery = `
SELECT state_name  as stateName
FROM state
WHERE state_id = ${getDistrictIdQueryResponse.state_id};`
  const getStateNameQueryResponse = await db.get(getStateNameQuery)

  response.send(getStateNameQueryResponse)

  console.log(getStateNameQueryResponse)
})

module.exports = app

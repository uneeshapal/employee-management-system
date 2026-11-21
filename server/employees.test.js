import { strict as assert } from 'node:assert'
import { after, before, test } from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import { app } from './app.js'
import { databaseUri, Employee } from './employee.js'

let server
let baseUrl
const record = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  phone: '+1 202 555 0100',
  department: 'Engineering',
  designation: 'Software Engineer',
  joiningDate: '2025-02-28',
  status: 'Active'
}

before(async () => {
  await mongoose.connect(process.env.TEST_MONGODB_URI || databaseUri, {
    dbName: `peopleops_test_${randomUUID().replaceAll('-', '')}`,
    serverSelectionTimeoutMS: 5000
  })
  await Employee.init()
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${server.address().port}/api/employees`
})

after(async () => {
  try {
    if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase()
  } finally {
    await mongoose.disconnect()
  }
})

async function call(method = 'GET', suffix = '', body) {
  const response = await fetch(baseUrl + suffix, {
    method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body)
  })
  return { status: response.status, body: response.status === 204 ? null : await response.json() }
}

test('creates, lists, reads, updates, and deletes an employee in MongoDB', async () => {
  assert.deepEqual(await call(), { status: 200, body: [] })
  const created = await call('POST', '', record)
  assert.equal(created.status, 201)
  const path = '/' + created.body._id
  assert.equal(created.body.joiningDate, '2025-02-28T00:00:00.000Z')
  assert.equal((await call()).body[0]._id, created.body._id)
  assert.deepEqual((await call('GET', path)).body, created.body)
  const changed = await call('PUT', path, { ...record, designation: 'Senior Engineer', status: 'Inactive' })
  assert.equal(changed.status, 200)
  assert.equal(changed.body.designation, 'Senior Engineer')
  assert.equal((await call('GET', path)).body.status, 'Inactive')
  assert.equal((await call('DELETE', path)).status, 204)
  assert.equal((await call('GET', path)).status, 404)
  assert.equal((await call('PUT', path, record)).status, 404)
  assert.equal((await call('DELETE', path)).status, 404)
})

test('returns field errors, rejects duplicate emails, and reports malformed requests', async () => {
  const invalid = await call('POST', '', { ...record, name: '  ', email: 'wrong', phone: '-------', joiningDate: '2025-02-30', status: 'Unknown' })
  assert.equal(invalid.status, 400)
  assert.deepEqual(Object.keys(invalid.body.errors).sort(), ['email', 'joiningDate', 'name', 'phone', 'status'])
  assert.equal((await call('POST', '', record)).status, 201)
  const duplicate = await call('POST', '', { ...record, email: 'ALEX@EXAMPLE.COM' })
  assert.equal(duplicate.status, 409)
  assert.ok(duplicate.body.errors.email)
  assert.equal((await call('GET', '/invalid')).status, 400)
  const malformed = await fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })
  assert.equal(malformed.status, 400)
})

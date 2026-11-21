import express from 'express'
import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'
import { Employee, validateEmployee } from './employee.js'

export const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '16kb' }))

const employees = express.Router()
employees.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({ message: 'Invalid employee ID.' })
  next()
})

function validateBody(req, res, next) {
  const { data, errors } = validateEmployee(req.body)
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Check the highlighted fields.', errors })
  }
  req.employeeData = data
  next()
}

employees.get('/', async (_req, res) => {
  res.json(await Employee.find().sort({ name: 1, _id: 1 }))
})

employees.post('/', validateBody, async (req, res) => {
  const employee = await Employee.create(req.employeeData)
  res.location(`/api/employees/${employee.id}`).status(201).json(employee)
})

employees.get('/:id', async (req, res) => {
  const employee = await Employee.findById(req.params.id)
  if (!employee) return res.status(404).json({ message: 'Employee not found.' })
  res.json(employee)
})

employees.put('/:id', validateBody, async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.employeeData, {
    returnDocument: 'after', runValidators: true
  })
  if (!employee) return res.status(404).json({ message: 'Employee not found.' })
  res.json(employee)
})

employees.delete('/:id', async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id)
  if (!employee) return res.status(404).json({ message: 'Employee not found.' })
  res.sendStatus(204)
})

app.use('/api/employees', employees)
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }))
app.use(express.static(fileURLToPath(new URL('../dist/', import.meta.url))))

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.code === 11000) {
    return res.status(409).json({
      message: 'An employee already uses this email address.',
      errors: { email: 'This email address is already in use.' }
    })
  }
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON request.' })
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' })
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Invalid employee data.' })
  console.error(error)
  res.status(500).json({ message: 'The server could not complete your request. Try again.' })
})

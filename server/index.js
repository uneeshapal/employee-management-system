import mongoose from 'mongoose'
import { app } from './app.js'
import { databaseUri, Employee } from './employee.js'

try {
  await mongoose.connect(databaseUri, { serverSelectionTimeoutMS: 5000 })
  await Employee.init()
  const port = Number(process.env.PORT || 3001)
  const host = process.env.HOST || '127.0.0.1'
  const server = app.listen(port, host, () => console.log(`PeopleOps listening at http://${host}:${port}`))
  server.on('error', async error => {
    console.error(error.message)
    await mongoose.disconnect()
    process.exitCode = 1
  })
} catch (error) {
  console.error(`Startup failed: ${error.message}`)
  await mongoose.disconnect()
  process.exitCode = 1
}

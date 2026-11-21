import mongoose from 'mongoose'
import { databaseUri, Employee } from './employee.js'

const rows = [
  ['Amara Okafor', 'Design', 'Senior Product Designer', '2024-01-15'],
  ['Ben Carter', 'Engineering', 'Frontend Engineer', '2023-09-04'],
  ['Chloe Martin', 'People', 'People Operations Lead', '2023-06-12'],
  ['Daniel Kim', 'Product', 'Product Manager', '2024-03-18'],
  ['Elena Rossi', 'Marketing', 'Brand Strategist', '2024-05-06', 'Inactive'],
  ['Farah Ali', 'Engineering', 'Backend Engineer', '2024-07-22'],
  ['Gabriel Silva', 'Design', 'Design Researcher', '2024-08-05'],
  ['Hannah Lee', 'Product', 'Product Analyst', '2024-09-09'],
  ['Ishaan Mehta', 'Engineering', 'QA Engineer', '2024-10-21'],
  ['Julia Nguyen', 'Marketing', 'Content Specialist', '2024-11-11', 'Inactive'],
  ['Leo Johnson', 'People', 'Recruiter', '2025-01-13'],
  ['Maya Patel', 'Design', 'Product Designer', '2025-02-24']
]

try {
  await mongoose.connect(databaseUri, { serverSelectionTimeoutMS: 5000 })
  await Employee.init()
  for (const [index, [name, department, designation, joiningDate, status = 'Active']] of rows.entries()) {
    const email = `${name.toLowerCase().replace(' ', '.')}@example.com`
    await Employee.updateOne({ email }, {
      $setOnInsert: { name, email, phone: `+1 202 555 ${String(100 + index).padStart(4, '0')}`, department, designation, joiningDate, status }
    }, { upsert: true, runValidators: true })
  }
  console.log('Sample employees are ready.')
} finally {
  await mongoose.disconnect()
}

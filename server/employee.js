import mongoose from 'mongoose'

const requiredText = { type: String, required: true, trim: true, maxlength: 100 }
export const statuses = ['Active', 'Inactive']
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const phonePattern = /^\+?[\d(). -]{7,30}$/

const schema = new mongoose.Schema({
  name: requiredText,
  email: { ...requiredText, maxlength: 254, lowercase: true, unique: true, match: emailPattern },
  phone: { ...requiredText, validate: value => phonePattern.test(value) && value.replace(/\D/g, '').length >= 7 },
  department: requiredText,
  designation: requiredText,
  joiningDate: { type: Date, required: true },
  status: { type: String, required: true, enum: statuses }
}, { timestamps: true, versionKey: false })

export const Employee = mongoose.model('Employee', schema)
export const databaseUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleops'

export function validateEmployee(body) {
  const data = {}
  const errors = {}
  for (const field of ['name', 'email', 'phone', 'department', 'designation', 'joiningDate', 'status']) {
    const value = typeof body?.[field] === 'string' ? body[field].trim() : ''
    if (!value) errors[field] = 'This field is required.'
    else if (value.length > (field === 'email' ? 254 : 100)) errors[field] = 'This value is too long.'
    else data[field] = value
  }
  if (data.email && !emailPattern.test(data.email)) errors.email = 'Enter a valid email address.'
  if (data.phone && (!phonePattern.test(data.phone) || data.phone.replace(/\D/g, '').length < 7)) {
    errors.phone = 'Enter a valid phone number with at least seven digits.'
  }
  if (data.status && !statuses.includes(data.status)) errors.status = 'Select Active or Inactive.'
  if (data.joiningDate) {
    const date = new Date(data.joiningDate)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.joiningDate) ||
        Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.joiningDate) {
      errors.joiningDate = 'Enter a valid calendar date.'
    }
  }
  return { data, errors }
}

import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const emptyEmployee = {
  name: '', email: '', phone: '', department: '', designation: '', joiningDate: '', status: 'Active'
}
const fields = [
  ['name', 'Employee name', 'text'],
  ['email', 'Email', 'email'],
  ['phone', 'Phone number', 'tel'],
  ['department', 'Department', 'text'],
  ['designation', 'Designation', 'text'],
  ['joiningDate', 'Joining date', 'date']
]

async function employeeRequest(path = '', method = 'GET', data) {
  const response = await fetch('/api/employees' + path, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined
  })
  if (response.status === 204) return
  const result = await response.json().catch(() => null)
  if (!response.ok || !result) {
    const fieldError = Object.entries(result?.errors || {})[0]
    const label = fields.find(([name]) => name === fieldError?.[0])?.[1] || 'Status'
    throw new Error(fieldError ? `${label} — ${fieldError[1]}` : result?.message || 'Employee service is unavailable.')
  }
  return result
}

function App() {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(emptyEmployee)
  const [editId, setEditId] = useState(null)
  const [details, setDetails] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadEmployees() {
    setLoading(true)
    setListError('')
    try {
      setEmployees(await employeeRequest())
    } catch (error) {
      setListError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEmployees() }, [])

  function startEdit(employee) {
    setEditId(employee._id)
    setForm({ ...employee, joiningDate: employee.joiningDate.slice(0, 10) })
    setDetails(null)
    setMessage('')
    setError('')
    document.getElementById('name').focus()
  }

  function resetForm() {
    setEditId(null)
    setForm(emptyEmployee)
    setError('')
  }

  async function saveEmployee(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const saved = await employeeRequest(editId ? '/' + editId : '', editId ? 'PUT' : 'POST', form)
      setEmployees(previous => [...previous.filter(employee => employee._id !== saved._id), saved])
      if (details?._id === saved._id) setDetails(saved)
      setMessage(editId ? 'Employee updated.' : 'Employee added.')
      resetForm()
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteEmployee(employee) {
    if (!window.confirm(`Delete ${employee.name}?`)) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await employeeRequest('/' + employee._id, 'DELETE')
      setEmployees(previous => previous.filter(item => item._id !== employee._id))
      if (details?._id === employee._id) setDetails(null)
      if (editId === employee._id) resetForm()
      setMessage('Employee deleted.')
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  const searchText = search.trim().toLowerCase()
  const filteredEmployees = employees.filter(employee =>
    (!status || employee.status === status) &&
    [employee.name, employee.email, employee.department].some(value => value.toLowerCase().includes(searchText))
  ).sort((first, second) => first.name.localeCompare(second.name))

  return <main>
    <h1>Employee Management</h1>
    <p className="intro">Add employees and manage their records.</p>

    <section>
      <h2>{editId ? 'Edit employee' : 'Add employee'}</h2>
      <form onSubmit={saveEmployee}>
        <fieldset disabled={busy}>
          {fields.map(([name, label, type]) => <label key={name} htmlFor={name}>
            {label}
            <input id={name} type={type} value={form[name]} required
              onChange={event => setForm({ ...form, [name]: event.target.value })}/>
          </label>)}
          <label htmlFor="status">Status
            <select id="status" value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}>
              <option>Active</option><option>Inactive</option>
            </select>
          </label>
        </fieldset>
        <div className="buttons">
          <button disabled={busy || loading || Boolean(listError)}>{busy ? 'Please wait…' : editId ? 'Save changes' : 'Add employee'}</button>
          {editId && <button type="button" className="secondary" disabled={busy} onClick={resetForm}>Cancel</button>}
        </div>
      </form>
      {message && <p role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>

    {details && <section aria-labelledby="details-title">
      <div className="section-heading">
        <h2 id="details-title">{details.name}</h2>
        <button className="secondary" onClick={() => setDetails(null)}>Close details</button>
      </div>
      <dl>
        {fields.slice(1).map(([name, label]) => <div key={name}>
          <dt>{label}</dt>
          <dd>{name === 'joiningDate' ? details[name].slice(0, 10) : details[name]}</dd>
        </div>)}
        <div><dt>Status</dt><dd>{details.status}</dd></div>
      </dl>
    </section>}

    <section>
      <h2>Employee list</h2>
      <div className="filters">
        <label htmlFor="search">Search
          <input id="search" type="search" placeholder="Name, email or department" value={search} onChange={event => setSearch(event.target.value)}/>
        </label>
        <label htmlFor="filter">Filter by status
          <select id="filter" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="">All statuses</option><option>Active</option><option>Inactive</option>
          </select>
        </label>
      </div>
      {loading ? <p role="status">Loading employees…</p> : listError ? <>
        <p className="error" role="alert">{listError}</p>
        <button className="secondary" onClick={loadEmployees}>Retry</button>
      </> : filteredEmployees.length ? <div className="table-wrap" tabIndex={0} aria-label="Employee records">
        <table>
          <thead><tr>{['Name', 'Department', 'Status', 'Actions'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>{filteredEmployees.map(employee => <tr key={employee._id}>
            <td><strong>{employee.name}</strong><small>{employee.email}</small></td>
            <td>{employee.department}</td>
            <td>{employee.status}</td>
            <td><div className="buttons">
              <button className="secondary" onClick={() => setDetails(employee)}>View</button>
              <button className="secondary" disabled={busy} onClick={() => startEdit(employee)}>Edit</button>
              <button className="delete" disabled={busy} onClick={() => deleteEmployee(employee)}>Delete</button>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div> : <p>No employees found.</p>}
    </section>
  </main>
}

createRoot(document.getElementById('root')).render(<App/>)

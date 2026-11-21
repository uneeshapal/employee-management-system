# Employee Management System

A small MERN student project. Add, view, edit, and delete employees. Search by name, email, or department and filter by Active or Inactive.

## Run locally

Install Node.js 22.12 or later and MongoDB. Start MongoDB, then open a terminal in the project folder.

```bash
npm ci
npm run seed
npm run build
npm start
```

Open http://127.0.0.1:3001 in your browser. The optional seed command adds 12 sample employees. To use a different MongoDB connection, copy `.env.example` to `.env` and set `MONGODB_URI`.

## How it works

1. The React form and table are in `src/main.jsx`.
2. React sends requests to the Express routes in `server/app.js`.
3. The employee model in `server/employee.js` validates fields and stores records in MongoDB.

| Method | Route | Action |
| --- | --- | --- |
| GET | `/api/employees` | List employees |
| GET | `/api/employees/:id` | Read one employee |
| POST | `/api/employees` | Add an employee |
| PUT | `/api/employees/:id` | Update an employee |
| DELETE | `/api/employees/:id` | Delete an employee |

Run `npm test` with MongoDB running to check the API. Tests create and remove a separate database.

## Screenshots

- [Dashboard](docs/dashboard.png)
- [Employee details](docs/employee-details.png)
- [Mobile layout](docs/mobile.png)

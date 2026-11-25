# TripPocket

TripPocket is a travel budget planner project for managing trips, recording expenses and viewing budget summaries. All monetary amounts use LKR.

## Technology

- Frontend: React and Vite
- Backend: Node.js and Express
- Database: MongoDB and Mongoose

The frontend and backend are separate projects, each with its own dependencies and environment file.

## Project status

This is a starter project. The React layout, Express server, database connection and API helper are included. Trip and expense models still need to be implemented, and feature controllers currently return `501 Not Implemented`.

The planned features are:

- Create, view, edit and delete trips with a destination, dates and budget.
- Record expenses for a selected trip using Food, Transport, Accommodation, Activities or Other categories.
- Display total spending, remaining balance, category totals and an over-budget warning.

## Folder structure

```text
TripPocket-Basic/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

Backend requests pass through routes and controllers, which use models to access MongoDB. Frontend components use `services/api.js` to call the backend.

## Prerequisites

- Node.js 22.12 or newer and npm
- A running local MongoDB instance or an accessible MongoDB Atlas database

## Backend setup

Open a terminal in the project folder:

```sh
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env` and configure:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/trippocket
```

For MongoDB Atlas, replace `MONGODB_URI` with your connection string.

From the `backend` folder, run:

```sh
npm run dev
```

The backend connects to MongoDB before listening at `http://localhost:5000`. Check the API and database status at `http://localhost:5000/api/health`.

If startup fails, check that MongoDB is running and that the connection string and database network access are correct.

## Frontend setup

Open a second terminal in the project folder:

```sh
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env` and configure:

```env
VITE_API_URL=http://localhost:5000/api
```

From the `frontend` folder, run:

```sh
npm run dev
```

Open `http://localhost:5173`. The starter screen displays the connection status and placeholders for trips, expenses and the budget summary.

## API routes

All routes use the `/api` prefix. Feature routes are placeholders until their controllers are implemented.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API and database status |
| GET, POST | `/trips` | List or create trips |
| GET, PUT, DELETE | `/trips/:id` | View, update or delete a trip |
| GET, POST | `/trips/:tripId/expenses` | List or create trip expenses |
| PUT, DELETE | `/expenses/:id` | Update or delete an expense |
| GET | `/trips/:tripId/summary` | Budget and spending totals |
| GET | `/trips/:tripId/category-summary` | Spending by category |

Response format: `{ "data": ... }` for success and `{ "error": { "message": "..." } }` for errors.

## Build and deployment

Run `npm run build` inside `frontend` to generate the production files in `frontend/dist`.

- **Frontend hosting:** use `frontend` as the project root, install with `npm ci`, build with `npm run build`, and publish `dist`. Set `VITE_API_URL` to the hosted backend URL ending in `/api` before building.
- **Backend hosting:** use `backend` as the project root, install with `npm ci`, and start with `npm start`. Set `MONGODB_URI` and `CLIENT_URL` to the database URI and exact hosted frontend origin, without a trailing slash. The backend uses the hosting service's `PORT` when supplied.

Keep `.env` files and credentials out of version control. Frontend `VITE_` variables are public and must not contain secrets. Commit both package lockfiles to keep dependency installations consistent.

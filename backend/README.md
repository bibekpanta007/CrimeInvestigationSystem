# Crime Investigation System Backend

This is the backend for the Crime Investigation System, built with Node.js, Express, and SQLite.

## Features

- User authentication (register/login)
- JWT-based authorization
- CRUD operations for cases, suspects, evidence, officers
- File uploads for images
- Dashboard statistics

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The server will run on http://localhost:3000

## API Endpoints

### Authentication
- POST /api/register - Register a new agent
- POST /api/login - Login

### Protected Routes (require JWT token)
- GET /api/dashboard - Get dashboard stats
- GET /api/cases/recent - Get recent cases
- POST /api/cases - Add new case
- GET /api/cases - Get all cases
- POST /api/suspects - Add suspect
- GET /api/suspects - Get all suspects
- POST /api/evidence - Add evidence
- GET /api/evidence - Get all evidence
- POST /api/officers - Add officer
- GET /api/officers - Get all officers


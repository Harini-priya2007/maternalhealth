# Maternal Health Backend

Backend server for the Maternal Health Portal application.

## Project Structure

```
Backend/
├── server.js           # Main server file
├── db.js              # Database initialization and setup
├── package.json       # Dependencies
├── maternal_health.db # SQLite database (created on first run)
└── routes/
    ├── login.js       # Authentication routes (register/login)
    ├── home.js        # Home dashboard routes
    ├── anemia.js      # Anemia tracking routes
    ├── cardio.js      # Cardiovascular tracking routes
    ├── jaundice.js    # Jaundice tracking routes
    ├── mentalhealth.js # Mental health tracking routes
    └── landing.js     # Landing page routes
```

## Database Schema

### Users Table
- `id` - User ID
- `fullName` - Full name of user
- `email` - Email (unique)
- `password` - Hashed password
- `role` - User role (Mother/Government/Doctor)
- `createdAt` - Account creation timestamp

### Condition-Specific Tables
- `anemia_data` - Hemoglobin tracking
- `cardio_data` - Blood pressure and heart rate tracking
- `jaundice_data` - Bilirubin level tracking
- `mentalhealth_data` - Mood and stress tracking
- `loginHistory` - Login attempt tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user/:id` - Get user profile

### Health Data
- `GET /api/anemia/data/:userId` - Get anemia records
- `POST /api/anemia/data` - Save anemia record
- `GET /api/cardio/data/:userId` - Get cardio records
- `POST /api/cardio/data` - Save cardio record
- `GET /api/jaundice/data/:userId` - Get jaundice records
- `POST /api/jaundice/data` - Save jaundice record
- `GET /api/mentalhealth/data/:userId` - Get mental health records
- `POST /api/mentalhealth/data` - Save mental health record

## Installation

1. Navigate to Backend folder:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

Server will run on `http://localhost:5000`

## Usage Example

### Register User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "Mother"
}
```

### Login User
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "password123"
}
```

### Save Anemia Data
```bash
POST http://localhost:5000/api/anemia/data
Content-Type: application/json

{
  "userId": 1,
  "hemoglobinLevel": 11.5,
  "notes": "Check-up appointment"
}
```

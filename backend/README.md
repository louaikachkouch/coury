# Coury Backend

Express.js + MongoDB backend for the Coury learning platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coury
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d
```

3. Make sure MongoDB is running locally, or update `MONGODB_URI` to point to your MongoDB Atlas cluster.

4. Start the server:
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user (requires auth)

### Users
- `PUT /api/users/profile` - Update user profile (requires auth)
- `GET /api/users/:id` - Get user by ID (requires auth)

### Health
- `GET /api/health` - Server health check

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/coury |
| JWT_SECRET | Secret key for JWT tokens | - |
| JWT_EXPIRE | JWT token expiration | 7d |

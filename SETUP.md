# Quick Setup Guide

## 1. Install Dependencies
```bash
cd apps/api
pnpm install
```

## 2. Setup Database
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Run seed data
pnpm db:seed
```

## 3. Test Login
```bash
# Start API server
pnpm dev

# Test login (use Postman/curl)
POST http://localhost:3001/auth/login
{
  "email": "admin@greenvalley.edu",
  "password": "admin123"
}
```

## 4. Test CRUD Operations

### Get Students (requires JWT token)
```bash
GET http://localhost:3001/students
Authorization: Bearer <your-jwt-token>
```

### Create Student
```bash
POST http://localhost:3001/students
Authorization: Bearer <your-jwt-token>
{
  "userId": "<user-id>",
  "branchId": "<branch-id>",
  "rollNumber": "2024001",
  "admissionNo": "ADM001"
}
```

## Seed Data Created:
- **School**: Green Valley School (GVS001)
- **Branch**: Main Campus
- **Super Admin**: admin@greenvalley.edu / admin123
- **School Admin**: school@greenvalley.edu / school123

## Available Endpoints:
- `/auth/login` - Login
- `/auth/refresh` - Refresh token
- `/users` - User CRUD
- `/students` - Student CRUD  
- `/classes` - Class CRUD
- `/attendance` - Attendance CRUD

All endpoints are protected with JWT + RBAC + Multi-tenant filtering.

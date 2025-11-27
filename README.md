# 🎓 School Management System

A comprehensive multi-tenant, AI-powered School Management System built with modern technologies.

## 🏗️ Architecture

This is a monorepo built with Turborepo containing:

- **Frontend**: Next.js 16 + Tailwind CSS + Shadcn/ui
- **Backend**: NestJS + Prisma(v5) + PostgreSQL
- **Database**: PostgreSQL with Prisma ORM
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## 📁 Project Structure

```
school-saas/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── api/                 # NestJS backend API
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── eslint-config/       # Shared ESLint configurations
│   ├── typescript-config/   # Shared TypeScript configurations
│   ├── config/              # Shared configurations
│   └── shared/              # Shared utilities and types
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

## 🚀 Features

### Core Modules

- **👥 User Management**: Multi-role system (Super Admin, School Admin, Branch Admin, Teacher, Student, Parent)
- **🏫 Multi-Tenant Architecture**: Support for multiple schools with multiple branches
- **📚 Academic Management**: Classes, subjects, timetables, and curriculum management
- **📊 Attendance System**: Digital attendance tracking with real-time updates
- **📝 Examination System**: Exam scheduling, result management, and analytics
- **💬 Communication**: Notice board, messaging system between stakeholders

### Upcoming Features

- **💳 Fee Management**: Payment processing and financial tracking
- **🌐 School Website Builder**: Custom website creation for schools
- **🤖 AI Integration**:
  - AI Student Assistant (step-by-step explanations)
  - AI Teacher Assistant (question paper generation, lesson plans)
  - AI Admin Assistant (analytics, predictions)

## 🛠️ Tech Stack

### Frontend (Next.js)

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React Context/Zustand (to be implemented)
- **Form Handling**: React Hook Form + Zod validation

### Backend (NestJS)

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Class Validator
- **Documentation**: Swagger/OpenAPI

### Database Schema

- Multi-tenant architecture with school isolation
- Role-based access control
- Comprehensive academic data modeling
- Audit trails and soft deletes

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v9.0.0 or higher)
- **PostgreSQL** (v14 or higher)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd school-saas
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

#### Backend Environment (.env)

```bash
# Copy the example environment file
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/school_saas_db?schema=public"

# Application
PORT=3001
NODE_ENV=development

# JWT - Change this in production!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment (.env.local)

```bash
# Copy the example environment file
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001

# Application
NEXT_PUBLIC_APP_NAME="School Management System"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### 4. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE school_saas_db;

# Exit PostgreSQL
\q
```

#### Run Database Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push
```

### 5. Start Development Servers

#### Option 1: Start All Services

```bash
pnpm dev
```

#### Option 2: Start Services Individually

**Terminal 1 - API Server:**

```bash
pnpm dev:api
```

**Terminal 2 - Web Application:**

```bash
pnpm dev:web
```

### 6. Access the Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health
- **Database Studio**: `pnpm db:studio` (opens Prisma Studio)

## 📝 Available Scripts

### Root Level Scripts

```bash
# Development
pnpm dev              # Start all applications
pnpm dev:web          # Start only web application
pnpm dev:api          # Start only API server

# Building
pnpm build            # Build all applications
pnpm lint             # Lint all applications
pnpm format           # Format code with Prettier
pnpm check-types      # Type check all applications

# Database Operations
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Prisma Studio
```

### Application-Specific Scripts

#### API (apps/api)

```bash
cd apps/api

# Development
pnpm dev              # Start with hot reload
pnpm start            # Start production build
pnpm build            # Build for production

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run e2e tests
pnpm test:cov         # Run tests with coverage
```

#### Web (apps/web)

```bash
cd apps/web

# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Lint the application
```

## 🗄️ Database Schema

The system uses a comprehensive PostgreSQL schema with the following main entities:

- **Schools**: Multi-tenant root entities
- **Branches**: School locations/campuses
- **Users**: All system users with role-based access
- **Classes**: Academic classes/grades
- **Subjects**: Course subjects
- **Timetable**: Class scheduling
- **Attendance**: Student attendance tracking
- **Exams & Results**: Assessment management

### Key Features:

- Multi-tenant architecture with school isolation
- Role-based access control (RBAC)
- Soft deletes and audit trails
- Optimized indexes for performance

## 🔐 Authentication & Authorization

The system implements a comprehensive role-based access control:

### User Roles:

1. **SUPER_ADMIN**: Platform-wide administration
2. **SCHOOL_ADMIN**: School-level management
3. **BRANCH_ADMIN**: Branch-level management
4. **TEACHER**: Teaching and class management
5. **STUDENT**: Student portal access
6. **PARENT**: Parent portal access

### Security Features:

- JWT-based authentication
- Role-based route protection
- API endpoint authorization
- Secure password hashing

## 🚀 Deployment

### Development Deployment

The applications are configured for easy deployment on:

- **Frontend**: Vercel (recommended)
- **Backend**: Railway, Render, or Heroku
- **Database**: Neon, Supabase, or managed PostgreSQL

### Environment Variables for Production

#### API Production Environment

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
NODE_ENV=production
PORT=3001
FRONTEND_URL="https://your-frontend-domain.com"
```

#### Web Production Environment

```env
NEXT_PUBLIC_API_URL="https://your-api-domain.com"
API_URL="https://your-api-domain.com"
NEXT_PUBLIC_APP_NAME="School Management System"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines:

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📚 API Documentation

Once the API server is running, you can access:

- **Health Check**: `GET /api/health`
- **API Documentation**: Coming soon (Swagger/OpenAPI)

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes: `lsof -ti:3001 | xargs kill -9`

3. **Prisma Client Issues**
   - Regenerate client: `pnpm db:generate`
   - Reset database: `pnpm db:push --force-reset`

4. **CORS Issues**
   - Verify FRONTEND_URL in API .env
   - Check NEXT_PUBLIC_API_URL in web .env.local

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Turborepo](https://turborepo.com/) for monorepo management
- [Next.js](https://nextjs.org/) for the frontend framework
- [NestJS](https://nestjs.com/) for the backend framework
- [Prisma](https://prisma.io/) for database management
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Shadcn/ui](https://ui.shadcn.com/) for UI components

---

**Happy Coding! 🎓✨**

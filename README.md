# DotCampus Discussion API

A secure RESTful API for a discussion platform built for the Dot Campus learning community.  
Includes authentication, role-based authorization (Learner / Mentor / Admin), discussions, and comments.

## Tech Stack

- Node.js + Express
- PostgreSQL + Prisma
- JWT Authentication
- Zod validation
- Jest + Supertest (integration tests)
- Swagger (OpenAPI docs)

## Features

### Authentication

- Register a user
- Login and receive JWT token

### Roles & Permissions

- **Learner**
  - View discussions
  - View a single discussion + comments
  - Create discussion
  - Update own discussion
  - Delete own discussion
  - Comment on a discussion
- **Mentor**
  - Everything learner can do
  - Update any discussion
- **Admin**
  - Everything mentor can do
  - Delete any discussion
  - Delete any comment
  - Change user roles
  - Delete user accounts

## Database Design

DB Diagram:
https://dbdiagram.io/d/697fe6dfbd82f5fce247cdae

## API Documentation (Swagger)

Swagger UI:

- Local: http://localhost:4000/api-docs
- Production: https://dotcampus-discussion-api.onrender.com/api-docs

## Setup

### 1) Clone & install

```bash
git clone https://github.com/iibrahimx/dotcampus-discussion-api.git
cd dotcampus-discussion-api
npm install
```

### 2) Environment variables

Create a .env file in the root:

```bash
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/dotcampus_discussion?schema=public
JWT_SECRET=your_super_secret_key
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
```

### 3) Database & migrations

Make sure PostgreSQL is running, then:

```bash
npx prisma migrate dev
```

### 4) Run the API

```bash
npm run dev
```

Health check:

- GET /api/v1/health

## Testing

Run tests:

```bash
npm test
```

Run coverage:

```bash
npm run test:coverage
```

## Deployment

Live API Base URL:
https://dotcampus-discussion-api.onrender.com

Health check:
https://dotcampus-discussion-api.onrender.com/api/v1/health

Swagger Docs:
https://dotcampus-discussion-api.onrender.com/api-docs

# School ERP System

A modern, full-stack School ERP (Enterprise Resource Planning) system built with React, Node.js, Express, and PostgreSQL.

## Features

- **User Management**
  - Role-based authentication (Admin, Teacher, Student, Parent, Accountant, Librarian, HRM)
  - Secure login and registration
  - Profile management
  - Password management

- **Academic Management**
  - Class and section management
  - Subject management
  - Timetable management
  - Attendance tracking
  - Exam management
  - Grade management

- **Student Management**
  - Student profiles
  - Attendance records
  - Academic performance
  - Parent communication

- **Teacher Management**
  - Teacher profiles
  - Class assignments
  - Attendance management
  - Performance tracking

- **Financial Management**
  - Fee management
  - Expense tracking
  - Salary management
  - Financial reports

- **Library Management**
  - Book inventory
  - Issue/return system
  - Fine management
  - Library cards

## Tech Stack

### Frontend
- React 18
- React Router v6
- React Query
- Tailwind CSS
- Headless UI
- Heroicons

### Backend
- Node.js
- Express.js
- PostgreSQL
- JSON Web Tokens (JWT)
- bcrypt

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd school-erp
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   ```

4. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE school_erp;
   ```

5. Set up environment variables:
   Create a `.env` file in the server directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   DB_USER=your_db_user
   DB_HOST=localhost
   DB_NAME=school_erp
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=24h
   ```

6. Run database migrations:
   ```bash
   cd server
   node src/db/schema.sql
   ```

## Running the Application

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd client
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Documentation

The API documentation is available at `/api-docs` when running the server in development mode.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original PHP ERP system that served as inspiration
- The open-source community for the amazing tools and libraries
- Contributors who helped improve the system 
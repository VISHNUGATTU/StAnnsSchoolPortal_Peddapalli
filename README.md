# 🏫 St. Ann's School Management System (Saints High School Portal)

A comprehensive, full-stack enterprise School Management System (ERP) designed for educational institutions. The platform provides secure, role-based portals for **Administrators**, **Teachers**, and **Students/Parents**, equipped with fee management, staff payroll, academic schedules, exam grade processing, report exports (PDF & Excel), audit logging, and an automated **WhatsApp Notification Service** for instant parent alerts.

---

## 📋 Table of Contents

- [Features](#-features)
  - [Admin Portal](#-administrator-portal)
  - [Teacher Portal](#-teacher-portal)
  - [Student & Parent Portal](#-student--parent-portal)
  - [WhatsApp Alert Microservice](#-whatsapp-notification-microservice)
- [Tech Stack](#-tech-stack)
- [System Architecture & Directory Structure](#-system-architecture--directory-structure)
- [API Endpoints](#-api-endpoints)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Backend Setup](#3-backend-setup)
  - [4. Frontend Setup](#4-frontend-setup)
  - [5. WhatsApp Microservice Setup](#5-whatsapp-microservice-setup)
- [Running the Application](#-running-the-application)
- [License](#-license)

---

## ✨ Features

### 🛡️ Administrator Portal
- **Dashboard & Analytics**: Real-time overview of active student counts, teacher statistics, fee collections, and system metrics.
- **Student Management**: Full CRUD operations to add, view, update, search, and delete student records, including parent contact info and academic details.
- **Teacher Management**: Complete teacher profile management, subject assignments, active status controls, and contact management.
- **Class Teacher Allocation**: Assign class teachers to specific grades and sections.
- **Timetable & Schedule Management**: Create and manage weekly class schedules and period allocations.
- **Exam Schedule Management**: Configure examination timetables, subject schedules, and passing criteria.
- **Batch Promotion**: Automated end-of-year batch promotion tool to advance students to the next academic grade seamlessly.
- **Fee Management**:
  - Define custom fee structures per grade/class.
  - Collect fee payments, track installments, calculate pending dues, and issue receipts.
- **Staff Payroll Management**: Manage teacher salary records, track disbursement history, and manage payroll status.
- **Staff Attendance Tracking**: Record and monitor daily attendance records and leave tracking for teachers.
- **System Audit Logs**: Detailed audit trail logging administrative actions, security events, and data changes.
- **Notices & Broadcasts**: Publish school-wide announcements and targeted notifications.
- **Reporting & Data Export**: Generate comprehensive PDF report cards and export student/financial data in Excel formats.

### 👨‍🏫 Teacher Portal
- **Teacher Dashboard**: Personalized view of daily period schedules, assigned classes, recent announcements, and quick actions.
- **Student Attendance Marking**: Mark period-wise student attendance (Present/Absent/Late). Marking a student absent automatically triggers the WhatsApp notification pipeline to notify parents.
- **Class Results & Marks Upload**: Upload student marks for exams, view class performance metrics, and automatically compute totals and grades.
- **Personal Attendance History**: View self-attendance records and monthly presence stats.
- **My Schedule**: View interactive weekly teaching timetables and class assignments.
- **Exam Invigilation Schedule**: Access upcoming examination duties and subject schedules.
- **Study Material Upload**: Share learning resources, study guides, and assignment files with students.
- **School Notices**: Stay updated with administrative announcements and school events.
- **Profile Management**: View and edit personal profile information and credentials.

### 🎓 Student & Parent Portal
- **Student Dashboard**: Concise overview of overall attendance percentage, upcoming exams, fee payment status, and notices.
- **Attendance Tracker**: Interactive attendance history breakdown with subject-wise percentages and monthly attendance logs.
- **Academic Results & Marksheet**: View term exam results, marks breakdown, subject grades, and download official report cards.
- **Class Schedule**: Access daily class timetables, period timings, and subject teachers.
- **Exam Timetable**: Detailed schedule of upcoming examinations, room allocations, and exam timings.
- **Fee Details**: Clear breakdown of annual fees, paid installments, remaining balance, and payment receipts.
- **Study Materials**: Browse and download study guides, lecture notes, and assignments uploaded by teachers.
- **Notice Board**: Real-time access to official school notices and announcements.
- **Profile & Settings**: View student profile details, guardian contact info, and update account settings.

### 📱 WhatsApp Notification Microservice
- **Automated Parent Alerts**: Dedicated Python microservice running FastAPI and UI automation (PyAutoGUI / Desktop WhatsApp handler) to send instant WhatsApp messages to parents whenever a student is marked absent.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Core Framework**: React 19, Vite 7
- **Styling**: Tailwind CSS v4, PostCSS
- **Animations & UI**: Framer Motion, Lucide React, React Icons, Three.js
- **Data Visualization**: Recharts
- **Document & Data Export**: `jspdf`, `jspdf-autotable`, `xlsx` (SheetJS)
- **HTTP Client & Routing**: Axios, React Router DOM v7
- **Notifications**: React Hot Toast

### Backend (`/server`)
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JWT (JSON Web Tokens), Cookie-Parser, `bcrypt` / `bcryptjs`
- **File & Media Storage**: Cloudinary API, Multer
- **Security & Utilities**: Express Rate Limit, CORS, Nodemailer

### WhatsApp Service (`/whatsapp_service`)
- **Language & Engine**: Python 3.x, FastAPI, Uvicorn
- **Automation**: PyAutoGUI, Subprocess desktop URI handler (`whatsapp://send`), Pydantic

---

## 📁 System Architecture & Directory Structure

```
Saint-school-System/
├── client/                     # Frontend React Application
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── assets/             # Logos, images, global graphics
│   │   ├── components/         # Shared UI components & layouts (AdminLayout, TeacherLayout, StudentLayout)
│   │   ├── context/            # React Context (AppContext for auth & application state)
│   │   ├── pages/              # Role-based pages
│   │   │   ├── admin/          # Admin management screens (24+ modules)
│   │   │   ├── teacher/        # Teacher portal screens (12+ modules)
│   │   │   └── student/        # Student portal screens (12+ modules)
│   │   ├── App.jsx             # Route definitions & security guards
│   │   ├── index.css           # Global CSS & Tailwind rules
│   │   └── main.jsx            # React root renderer
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Express API
│   ├── configs/                # MongoDB & Cloudinary integrations
│   ├── controllers/            # Controllers handling business logic
│   ├── middlewares/            # Auth verification, multer uploads, error handling
│   ├── models/                 # 15 Mongoose database models (Student, Teacher, Admin, Attendance, FeeStructure, etc.)
│   ├── routes/                 # API endpoint routers (adminRoute, teacherRoute, studentRoute, reportRoute, logRoute)
│   ├── server.js               # Main Express application server
│   └── package.json
│
├── whatsapp_service/           # Python WhatsApp Automation Microservice
│   ├── main.py                 # FastAPI service listening on port 8000
│   ├── requirements.txt        # Python dependency manifest
│   └── whatsapp_profile/       # Chrome / WhatsApp desktop automation profile
│
├── .gitignore
└── README.md
```

---

## 🔗 API Endpoints

### 🔑 Authentication
- `POST /api/admin/login` - Admin authentication
- `POST /api/teacher/login` - Teacher authentication
- `POST /api/student/login` - Student authentication

### 🛡️ Admin Routes (`/api/admin`)
- `POST /add-student` | `PUT /update-student/:id` | `DELETE /delete-student/:id` | `GET /search-student` - Student management
- `POST /add-teacher` | `PUT /update-teacher/:id` | `DELETE /delete-teacher/:id` | `GET /search-teacher` - Teacher management
- `POST /class-teachers` - Assign class teacher mappings
- `POST /promote-year` - Execute batch year promotion
- `POST /schedule` - Save class timetables
- `POST /exams` - Manage examination schedules
- `POST /fees/structure` | `POST /fees/collect` - Fee configuration and payment recording
- `GET /salaries` | `POST /salaries` - Teacher payroll records
- `GET /teacher-attendance` | `POST /teacher-attendance` - Staff attendance tracking
- `GET /notices` | `POST /notices` - School notice board updates

### 👨‍🏫 Teacher Routes (`/api/teacher`)
- `POST /mark-attendance` - Mark daily student attendance & trigger WhatsApp alert
- `GET /my-schedule` - View period timetable
- `POST /marks-upload` - Upload exam marks for assigned class
- `GET /my-class` - View assigned class roster and result statistics
- `GET /my-attendance` - View teacher's own attendance record
- `POST /materials` - Upload learning resources

### 🎓 Student Routes (`/api/student`)
- `GET /my-schedule` - View personal timetable
- `GET /attendance` - Access personal attendance stats & logs
- `GET /exam-schedule` - View exam schedules
- `GET /results` - View exam performance & report cards
- `GET /fees` - View fee status, balance, and payment history
- `GET /materials` - Access uploaded study materials

### 📊 Reports & Logs (`/api/reports` & `/api/logs`)
- `GET /api/reports/` - Aggregate reports data
- `GET /api/logs/` - Fetch system activity audit logs

### 📱 WhatsApp Service (`http://localhost:8000`)
- `GET /` - Health check endpoint
- `POST /api/whatsapp/send` - Send batch WhatsApp notification alerts

---

## ⚡ Prerequisites

Ensure you have the following installed on your system before running the project:

- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **Python**: `v3.9` or higher (for WhatsApp service)
- **MongoDB**: Local MongoDB instance or a cloud cluster (e.g., MongoDB Atlas)
- **WhatsApp Desktop App**: (Required if using the automated WhatsApp parent notification service on Windows)

---

## 🚀 Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/VISHNUGATTU/StAnnsSchoolPortal_Peddapalli.git
cd StAnnsSchoolPortal_Peddapalli
```

### 2. Environment Configuration

Create `.env` files in both `server/` and `client/` directories.

#### **Backend (`server/.env`)**
```env
PORT=6446
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/saint_school_db
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173

# Nodemailer Config
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### **Frontend (`client/.env`)**
```env
VITE_BACKEND_URL=http://localhost:6446
```

---

### 3. Backend Setup

```bash
cd server
npm install
```

---

### 4. Frontend Setup

```bash
cd client
npm install
```

---

### 5. WhatsApp Microservice Setup

```bash
cd whatsapp_service
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

---

## 🏃 Running the Application

### 1. Start Backend Server
```bash
cd server
npm run server
```
*The Express server will start on port `6446` (or configured `PORT`).*

### 2. Start Frontend App
```bash
cd client
npm run dev
```
*The Vite dev server will start on `http://localhost:5173`.*

### 3. Start WhatsApp Alert Service (Optional)
```bash
cd whatsapp_service
python main.py
```
*The FastAPI service will run on `http://localhost:8000`.*

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🤝 Support & Acknowledgments

- Developed for **St. Ann's High School**.
- Icons provided by [Lucide React](https://lucide.dev/) and [React Icons](https://react-icons.github.io/react-icons/).
- Built with React, Express, MongoDB, and Python.

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

Yes! I've already created the API endpoints for assigning custom permissions. Here's how to use them:

## **API Endpoints for Permission Management:**

### **1. Assign Custom Permissions to User**

bash
POST /admin/permissions/:userId
Authorization: Bearer <your-access-token>

Request Body:
json
{
"resource": "STUDENTS",
"actions": ["CREATE", "READ", "UPDATE"],
"conditions": {
"own_branch_only": true
}
}

### **2. Get User's Current Permissions**

bash
GET /admin/permissions/:userId
Authorization: Bearer <your-access-token>

### **3. List All Users (to see who to assign permissions to)**

bash
GET /admin/users?role=BRANCH_ADMIN&schoolId=school-123
Authorization: Bearer <your-access-token>

## **Real-World Examples:**

### **Example 1: Give Branch Admin Limited User Creation**

json
POST /admin/permissions/branch-admin-user-id

{
"resource": "USERS",
"actions": ["CREATE", "READ"],
"conditions": {
"own_branch_only": true,
"roles_allowed": ["TEACHER", "STUDENT"]
}
}

### **Example 2: Give Sub-Branch Admin Report Access**

json
POST /admin/permissions/sub-branch-admin-id

{
"resource": "REPORTS",
"actions": ["READ", "CREATE"],
"conditions": {
"own_branch_only": true
}
}

### **Example 3: Give Teacher Student Management**

json
POST /admin/permissions/teacher-user-id

{
"resource": "STUDENTS",
"actions": ["READ", "UPDATE"],
"conditions": {
"own_classes_only": true
}
}

## **Permission Resources Available:**

• USERS - User management
• SCHOOLS - School management  
• BRANCHES - Branch management
• STUDENTS - Student management
• TEACHERS - Teacher management
• PARENTS - Parent management
• CLASSES - Class management
• ATTENDANCE - Attendance management
• EXAMS - Exam management
• REPORTS - Report access
• SETTINGS - System settings
• SUBSCRIPTIONS - Subscription management
• PAYMENTS - Payment management
• ANALYTICS - Analytics access

## **Permission Actions:**

• CREATE - Can create new records
• READ - Can view records
• UPDATE - Can modify records  
• DELETE - Can delete records
• MANAGE - Full control (all actions)
• VIEW_ONLY - Read-only access

## **Workflow:**

1. Login as Master/Super Admin
2. Get list of users → GET /admin/users
3. Assign custom permissions → POST /admin/permissions/:userId
4. Verify permissions → GET /admin/permissions/:userId

The system automatically validates that you can only assign permissions you have access to!

explain me how permisiion template work and working flow of permission stiil not clear to me let i am super admin how let i am branch admin or scool amdin how and i am not workg for each bracn all studne and prent will ahve same permisiion to liek to view this this mode or to edit thsi modelue like this

> Let me explain the permission system with clear examples:

## **🏗️ Permission System Flow**

### **1. Default Role Permissions (Built-in)**

Every role has default permissions automatically:

javascript
// SCHOOL_ADMIN gets these by default:

- BRANCHES: [MANAGE] // Can create/edit/delete branches
- USERS: [CREATE, READ, UPDATE] // Can manage users
- STUDENTS: [MANAGE] // Full student control
- TEACHERS: [MANAGE] // Full teacher control

// BRANCH_ADMIN gets these by default:

- STUDENTS: [MANAGE] // Only in their branch
- TEACHERS: [MANAGE] // Only in their branch
- ATTENDANCE: [READ] // Can view attendance

// TEACHER gets these by default:

- STUDENTS: [READ] // Can only view students
- ATTENDANCE: [CREATE, READ, UPDATE] // Can mark attendance
- EXAMS: [MANAGE] // Can create/grade exams

### **2. Custom Permissions (Override Defaults)**

You can give additional or restricted permissions:

## **📋 Real-World Examples:**

### **Example 1: You are SUPER_ADMIN**

bash

# You want to give a School Admin limited access

POST /admin/permissions/school-admin-id
{
"resource": "ANALYTICS",
"actions": ["READ"], // Only view, not manage
"conditions": {
"own_school_only": true // Only their school's data
}
}

### **Example 2: You are SCHOOL_ADMIN**

bash

# Give Branch Admin permission to create teachers

POST /admin/permissions/branch-admin-id
{
"resource": "TEACHERS",
"actions": ["CREATE", "READ", "UPDATE"], // Can't delete
"conditions": {
"own_branch_only": true // Only in their branch
}

# Give specific teacher report access

POST /admin/permissions/teacher-id
{
"resource": "REPORTS",
"actions": ["READ", "CREATE"],
"conditions": {
"own_classes_only": true // Only their classes
}
}

### **Example 3: You are BRANCH_ADMIN**

bash

# Give sub-branch admin limited student access

POST /admin/permissions/sub-branch-admin-id
{
"resource": "STUDENTS",
"actions": ["READ", "UPDATE"], // Can't create/delete
"conditions": {
"own_branch_only": true
}
}

## **🎯 Permission Templates (Reusable Sets)**

Templates are pre-made permission packages you can apply to multiple users:

### **Create Template:**

bash
POST /admin/permission-templates
{
"name": "Limited Teacher Access",
"role": "TEACHER",
"resource": "STUDENTS",
"actions": ["READ"], // Only view students
"conditions": {
"own_classes_only": true
}
}

### **Apply Template to Multiple Teachers:**

bash

# Apply same template to 10 teachers

for each teacher:
POST /admin/permissions/teacher-id
{
"resource": "STUDENTS",
"actions": ["READ"],
"conditions": {"own_classes_only": true}
}

## **🔄 How It Works in Practice:**

### **Scenario: School with Multiple Branches**

ABC School
├── Main Branch (Branch Admin: John)
│ ├── Teachers: Alice, Bob
│ └── Students: 100 students
├── North Branch (Branch Admin: Mary)
│ ├── Teachers: Carol, Dave
│ └── Students: 80 students
└── South Branch (Branch Admin: Peter)
├── Teachers: Eve, Frank
└── Students: 120 students

### **Default Permissions:**

• **John (Branch Admin)**: Can manage Main Branch students/teachers only
• **Alice (Teacher)**: Can view Main Branch students, mark attendance
• **Carol (Teacher)**: Can view North Branch students, mark attendance

### **Custom Permissions You Can Add:**

bash

# Give John (Main Branch Admin) access to view North Branch reports

POST /admin/permissions/john-id
{
"resource": "REPORTS",
"actions": ["READ"],
"conditions": {
"branches_allowed": ["main-branch-id", "north-branch-id"]
}
}

# Give Alice (Teacher) permission to create exams for other teachers

POST /admin/permissions/alice-id  
{
"resource": "EXAMS",
"actions": ["CREATE", "READ", "UPDATE", "DELETE"],
"conditions": {
"own_branch_only": true
}
}

## **🎮 Step-by-Step Workflow:**

### **1. As MASTER_SUPER_ADMIN (You):**

bash

# Login

POST /auth/login {"identifier": "master@schoolsaas.com", "password": "..."}

# See all users

GET /admin/users

# Give Super Admin limited school creation

POST /admin/permissions/super-admin-id
{
"resource": "SCHOOLS",
"actions": ["CREATE", "READ"], // Can't delete schools
}

### **2. As SCHOOL_ADMIN:**

bash

# See branch admins in your school

GET /admin/users?role=BRANCH_ADMIN&schoolId=your-school-id

# Give branch admin teacher creation rights

POST /admin/permissions/branch-admin-id
{
"resource": "TEACHERS",
"actions": ["CREATE", "READ", "UPDATE"]
}

### **3. As BRANCH_ADMIN:**

bash

# Give teacher extended student access

POST /admin/permissions/teacher-id
{
"resource": "STUDENTS",
"actions": ["READ", "UPDATE"], // Can edit student info
"conditions": {
"own_classes_only": true
}
}

## **🔍 Key Points:**

1. Default permissions = What role gets automatically
2. Custom permissions = Additional/restricted access you assign
3. Templates = Reusable permission sets for multiple users
4. Conditions = Limits like "own_branch_only", "own_classes_only"
5. Hierarchy = You can only assign permissions you have

The system ensures you can't give permissions you don't have yourself!

>

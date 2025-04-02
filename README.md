# Teacher's AI Attendance System

## Overview

The **Teacher's AI Attendance System** or **TeachAI** in short is a web application that ensures an **anti-proxy attendance mechanism** using **GPS validation** and allows teachers to view attendance records, including the most recent previous session.

## Features

### 1. Face Recognition

- Detects and verifies student faces.
- Captures live images for attendance verification.

### 2. Database

- Stores **user data** (teachers and students), attendance records, and session details in a **JSON-based storage system**.
- Ensures **no duplicate email IDs** during signup.

### 3. GPS-Based Anti-Proxy System

- Students must enable **GPS** when marking attendance.
- If a student is outside the **teacher-defined distance**, they are marked **absent**.

### 4. Camera Integration

- Uses the **device’s camera** to capture student images for face verification.

### 5. Attendance Persistence

- Attendance data remains **after logout** using cookies or similar mechanisms.
- The teacher’s dashboard displays **previous session records** alongside the current session.

## User Interfaces

### Login & Signup Pages

#### **Login Page:**

- Separate login for **teachers** and **students**.
- Fields: `Email`, `Password`, `Login Button`.

#### **Signup Page:**

- **Students:** Email (unique), password, upload face image (mandatory).
- **Teachers:** Email (unique), password (no image required).

### Student Dashboard

- Displays **attendance history** (date, present/absent status).
- Allows students to **mark attendance** by clicking a photo.
- Attendance validation:
  - **Face matches** with the signup image.
  - **GPS location** is within the teacher-set distance.
  - **Session code** provided by the teacher is valid.

### Teacher Dashboard

- View **attendance records** for the **current and previous session**.
- Modify attendance manually (**change absent to present** or vice versa).
- Set **allowed GPS distance** for attendance verification.
- Generate **session codes** (valid for a limited time, e.g., 1 hour).
- View students who attempted attendance **outside the allowed GPS range**.
- Export attendance data as an **Excel file**.
- Open/close attendance **within a specific time window**.

## Attendance Marking Process

1. Student clicks a **photo** using the system's camera.
2. The system verifies the **face** with the stored signup image.
3. **GPS validation** checks if the student is within the allowed distance.
4. If **both conditions** (face match + GPS) pass and the **session code** is valid → Mark **Present**.
5. Otherwise → Mark **Absent**.

## Technical Details

- **Storage:** Student face images stored in a folder, linked via JSON-based storage.
- **Backend & Frontend:** Built using **TypeScript**.
- **Persistence:** Uses **cookies** or similar storage to retain attendance records after logout.

## Notes

- Ensure **no duplicate email IDs** in the database.
- Variable names and logic should be **simple and easy to follow**.
- Only **the most recent previous session** should persist in the teacher’s dashboard.

---

### Future Improvements

- Improve UI/UX design.
- Implement **automated email notifications** for attendance reports.
- Enhance **face recognition accuracy** with advanced models.
- Add **multi-class session support** for teachers managing multiple batches.
- Improve **GPS accuracy** by refining location validation methods, reducing errors in student positioning.

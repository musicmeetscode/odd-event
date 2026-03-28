# Blue Ox Events Platform

Welcome to the **Blue Ox Events** platform — a comprehensive, real-time event management system designed for hackathons, conferences, and community meetups.

## 🚀 Key Features

### 📅 Event Management
- **Recurring Events**: Easily create and manage series (daily, weekly, monthly).
- **Flexible Types**: Specialized support for Hackathons, Competitions, Workshops, and more.
- **Agenda & Speakers**: Structured schedules with multi-speaker support.

### 🏆 Competition & Judging
- **Team Submissions**: Support for individual or team-based project entries.
- **Custom Criteria**: Admins can define weighted judging criteria per event.
- **Real-time Leaderboards**: Live scoring updates for high-stakes competitions.

### 💬 Real-time Q&A
- **Interactive Sessions**: Attendees can submit questions in real-time.
- **Moderation**: Speakers and admins can answer and manage live Q&A boards.

### 🔐 Security & Management
- **Smart Flagging**: Automatic detection and flagging (🚩) of non-conventional usernames to help admins identify suspicious registrations.
- **Soft Delete**: Securely deactivate accounts while preserving historical data and audit trails.
- **Admin Dashboard**: Real-time platform engagement analytics and user management.

### 📱 Attendee Experience
- **Easy Check-in**: Instant QR code generation for event detail and check-in pages.
- **User Profiles**: Personalized profiles for attendees and speakers to showcase bios and professions.
- **Certificates**: Automatic certificate generation for attendees and participants.

---

## 📂 Project Structure

| Component | Directory | Description | Tech Stack |
| :--- | :--- | :--- | :--- |
| **Backend** | [`/backend`](./backend) | Core API and business logic. | Django, DRF, PostgreSQL |
| **Frontend** | [`/frontend`](./frontend) | High-performance admin and attendee portal. | React, Vite, Tailwind CSS, Shadcn/UI |

---

## 🚀 Getting Started

To get the entire system running locally:

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🛠️ Architecture

- **Backend**: Python/Django with REST Framework.
- **Frontend**: React with TypeScript, Vite, and Tailwind CSS.
- **Real-time**: Leverages TanStack Query for efficient data fetching and state management.
- **Security**: Built-in regex validation, name sanitation, and role-based access control (RBAC).

## 📄 License

This project is licensed under the MIT License.

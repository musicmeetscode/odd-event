# DevFest Mbarara 2025 Monorepo

Welcome to the central repository for the **DevFest Mbarara 2025** event tools. This monorepo contains the community-driven applications designed to enhance the attendee experience, including a real-time Q&A system and a custom DP generator.

## 📂 Project Structure

This repository is organized into three main components:

| Component | Directory | Description | Tech Stack |
| :--- | :--- | :--- | :--- |
| **Backend** | [`/backend`](./backend) | Real-time Q&A engine and API server. | Django, WebSockets, DRF |
| **Frontend** | [`/frontend`](./frontend) | Public-facing Q&A client for attendees. | React, Vite, Tailwind CSS |
| **DP Generator** | [`/bethere`](./bethere) | Tool for generating event-themed profile pictures. | React, Tailwind v4, html2canvas |

---

## 🚀 Getting Started

To get the entire system running locally, follow the setup instructions for each component.

### 1. Backend Setup (Q&A API)
The backend manages sessions, questions, and real-time WebSocket updates.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata sample.json
# Run with Daphne for WebSocket support
daphne -b 0.0.0.0 -p 8000 devfest_qna.asgi:application
```
*Detailed guide: [`backend/README.md`](./backend/README.md)*

### 2. Frontend Setup (Q&A Client)
The attendee-facing application for submitting and viewing questions.

```bash
cd frontend
npm install
npm run dev
```
*Detailed guide: [`frontend/README.md`](./frontend/README.md)*

### 3. DP Generator Setup (Be There)
A standalone tool for attendees to generate custom "Be There" social media DPs.

```bash
cd bethere
npm install
npm run dev
```
*Detailed guide: [`bethere/README.md`](./bethere/README.md)*

---

## 🛠️ Architecture Overview

The system is designed to handle high-concurrency event interactions:

- **Real-time Communication**: Uses Django Channels (WebSockets) for instant question broadcasting.
- **Micro-frontend Ready**: The frontend and DP generator are independent Vite applications, allowing for separate deployment.
- **Data Persistence**: Managed via Django ORM (SQLite for dev, PostgreSQL recommended for prod).

## 🤝 Contributing

We welcome contributions! Please refer to the individual component directories for specific contribution guidelines and feature requests.

## 📄 License

This project is licensed under the MIT License.

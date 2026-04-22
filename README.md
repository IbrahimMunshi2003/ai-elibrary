# 📚 AI E-Library

A modern, AI-powered digital library platform built with **React + Django**, enabling users to explore, read, and interact with books through an intelligent AI assistant.

---

## 🚀 Overview

**AI E-Library** is a full-stack web application that provides a seamless digital reading experience. Users can browse books, read PDFs, bookmark favorites, leave reviews, and interact with an AI-powered virtual librarian for recommendations and queries.

The platform combines **real-time AI interaction**, **analytics tracking**, and a **modern UI** to deliver a next-generation e-library experience.

---

## 🧠 Key Features

- 📖 **Book Management** – Browse, view, and read books (PDF support)
- 🔍 **Search & Filtering** – Find books by title, author, or category
- 🔖 **Bookmarks** – Save books for later reading
- ⭐ **Comments & Ratings** – Community-driven feedback system
- 🤖 **AI Chatbot (Groq)** – Ask anything + get smart book recommendations
- 📊 **Analytics Dashboard** – Visual insights (charts, activity tracking)
- 🛠️ **Admin Panel** – Manage books, users, and content via Django Admin
- ⚡ **Offline Fallback** – UI works even if backend is down

---

## 🏗️ Tech Stack

### Frontend
- ⚛️ React 19 (Vite)
- 🎨 Tailwind CSS v4 (Dark Mode)
- 🧠 Zustand (State Management)
- 🔀 React Router DOM
- 📡 Axios (API calls)
- 📊 Recharts (Analytics)
- 🎬 Framer Motion (Animations)
- 🧩 React Icons
- 📝 React Markdown
- 🎮 React Three Fiber (3D UI)

### Backend
- 🐍 Django + Django REST Framework
- 🗄️ PostgreSQL / MongoDB (Djongo)
- 🔐 JWT Authentication (SimpleJWT)
- 🤖 Groq API (LLaMA 3 models)
- 🖼️ Pillow (Image handling)
- 📦 WhiteNoise (Static files)

---

## 🔌 API Endpoints

### 🔐 Authentication
- `POST /api/login/`
- `POST /api/signup/`

### 📚 Books & Categories
- `GET /api/books/`
- `GET /api/books/<id>/`
- `GET /api/categories/`
- `GET /api/search/?q=`

### 💬 Comments
- `GET/POST /api/books/<id>/comments/`
- `DELETE /api/comments/<id>/`

### 🔖 Bookmarks
- `GET/POST /api/bookmarks/`
- `DELETE /api/bookmarks/<id>/`

### 🤖 AI & Analytics
- `GET/POST /api/ask-ai/?question=`
- `POST /api/activity/track/`
- `GET /api/dashboard/`

---

## 📁 Project Structure


AI-ELibrary/
│
├── client/ # React Frontend
│ ├── public/
│ ├── src/
│ │ ├── components/ # UI Components
│ │ ├── pages/ # Pages (Home, Dashboard, etc.)
│ │ ├── services/ # API layer
│ │ ├── store/ # Zustand state
│ │ ├── utils/
│ │ ├── App.jsx
│ │ └── main.jsx
│ └── package.json
│
├── server/ # Django Backend
│ ├── config/
│ ├── library/
│ │ ├── models.py
│ │ ├── views.py
│ │ ├── serializers.py
│ │ ├── admin.py
│ │ ├── groq_service.py
│ │ ├── management/
│ │ └── urls.py
│ ├── media/ # PDFs & Covers
│ ├── requirements.txt
│ └── manage.py
│
└── render.yaml # Deployment config


---

## ⚙️ Environment Variables

### Frontend (`client/.env`)

VITE_API_URL=https://ai-elibrary-backend.onrender.com


### Backend (`server/.env`)

GROQ_API_KEY=your_groq_api_key
DJANGO_SECRET_KEY=your_secret_key
DEBUG=True
MONGODB_URI=your_db_uri


---

## 🛠️ Installation

### 🔹 Backend Setup

```bash
cd server
python -m venv venv
# Activate venv
venv\Scripts\activate   # Windows
# OR
source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
🔹 Frontend Setup
cd client
npm install
npm run dev
📊 Analytics Dashboard
📈 Activity tracking (PDF opens, AI queries, bookmarks)
📊 Charts:
Bar Chart (Books per category)
Line Chart (Activity trends)
Pie Chart (Category distribution)
🔥 Top books & recent activity
🤖 AI Chatbot (Groq)
Powered by LLaMA 3 via Groq
Answers general questions
Recommends books dynamically from database
Context-aware responses
🌟 Special Features
⚡ Offline-safe frontend (mock fallback)
🧠 AI + database hybrid responses
📊 Real-time analytics tracking
🎬 Smooth animations & modern UI
📱 Fully responsive design
🚀 Future Improvements
👤 User-specific analytics
📥 Book upload via frontend
🔎 Advanced AI semantic search
🌐 Deployment (Vercel + Render)
👨‍💻 Author

Munshi

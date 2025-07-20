<h1 align="center">
  🎥 Node YouTube Clone – Backend API
</h1>

<p align="center">
  <b>A powerful backend REST API for a YouTube-like video sharing platform. Built using Node.js, Express, MongoDB, and Cloudinary.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success.svg" />
  <img src="https://img.shields.io/github/license/sameTurmux/Node-Youtube-Project.svg" />
  <img src="https://img.shields.io/github/last-commit/sameTurmux/Node-Youtube-Project.svg" />
</p>

---

## 🚀 Features

- 🔐 JWT-based User Authentication
- 📤 Cloudinary Video Upload via Multer
- ⚙️ Centralized AsyncHandler (no repetitive try/catch)
- 🧯 Global Error Handler (server crash prevention)
- 📊 Aggregation Pipelines for video stats
- 👁️ View Tracking
- 👍 Like/Unlike Videos
- 👤 Subscribe/Unsubscribe Channels
- 🔍 Search Videos by Title/Tags/Categories
- 🧾 Category-Based Video Filtering
- 📁 Playlist: Create / Edit / Delete
- ✏️ Rename Videos
- 📦 Modular Structure: Separate Routes, Controllers, Models, Middleware
- 🧪 RESTful Endpoints for all features

> 📌 **Note:** This is a backend-only API project. Frontend (e.g. React, Next.js, etc.) can be developed separately.

---

## 🧰 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Storage:** Cloudinary (via Multer middleware)
- **Error Handling:** Central async handler + global error middleware

---

## 🛠️ Getting Started

```bash
git clone https://github.com/sameTurmux/Node-Youtube-Project.git
cd Node-Youtube-Project
npm install

# 🎓 Educational Game Hub by Golan Galant

---

## 🌟 Project Overview

The **Educational Game Hub** is a comprehensive full-stack application designed to boost children's development through interactive play. The platform focuses on three core pillars: **coordination**, **mathematical logic**, and **creative expression**.

The project features a secure user authentication system, a centralized database for progress tracking, and an AI-augmented introductory experience.

---

## 🕹️ The Games

| Category | Game | Description |
| --- | --- | --- |
| **Coordination** | 🎯 **Snake, Whack-A-Mole** | Classic coordination and reflex-building games. |
| **Mathematics** | 🔢 **Math Suite** | Includes *Balloon, Caterpillar, Blackjack,* and *Crawler* to sharpen arithmetic skills. |
| **Creativity** | 🎨 **Pencil Game** | A dedicated space for honing creational and artistic skills. |

---

## 🛠️ Tech Stack

### **Core Infrastructure**

* **Frontend:** React (Modern, component-based UI)
* **Backend:** Django (Robust API & User Management)
* **Database:** SQLite (Relational data storage)
* **GUI:** Tkinter (Desktop-based game interfaces)

### **AI & Multimedia**

* **Game AI:** `EasyAI` (Implementing Negamax algorithms, TwoPlayerGame, and AI_Player logic)
* **Engines:** `Pygame Zero` (Pyzero) for fluid game mechanics.
* **Introduction:** `HeyGen` AI-generated video spokesperson.

---

## 🚀 Getting Started

### **Prerequisites**

* **Python:** v3.13.x (Recommended)
* **Node.js:** Latest LTS
* **Docker:** (Optional, for Method #2)

---

### **Method 1: Manual Execution (Development)**

Follow these steps to launch the backend, frontend, and GUI components separately.

#### **1. Backend Setup (Django)**

```bash
python -m venv venv
venv\Scripts\activate
cd backend
pip install -r requirements.txt
python manage.py runserver
```

#### **2. Frontend Setup (React)**

```bash
cd frontend
npm install
npm run dev
```

#### **3. GUI Games (Optional)**

```bash
cd "GUI/[name_of_game]"
python "[name_of_game].py"
```

---

### **Method 2: Docker Deployment (Recommended)**

If you have Docker Desktop running, you can launch the entire ecosystem with a single command:

```bash
docker-compose up -d --build
```

---

> [!NOTE]
> **Compatibility Tip:** This project is optimized for **Python 3.13**. If you encounter issues with newer versions, ensure your virtual environment is explicitly using 3.13.


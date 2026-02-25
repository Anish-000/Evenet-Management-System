🎉 Event Management System

A full-stack web application built using Flask, SQLite, HTML, CSS, and JavaScript.
Designed with role-based architecture and a modern, responsive UI.

🚀 Project Overview

The Event Management System is a complete role-based platform that allows:

👑 Admin to manage users, vendors, memberships, and orders

🏪 Vendors to manage products and update order statuses

👤 Users to browse products, manage cart, place orders, and maintain guest lists

It simulates a real-world event service workflow with clean architecture and secure authentication.


🛠 Core Features


🔐 Authentication & Security

Role-based login system (Admin / Vendor / User)

Secure password hashing

Session management

Client-side & server-side validations


👑 Admin Panel

Manage Users

Manage Vendors

Add / Update / Cancel Membership

View & Update All Orders


🏪 Vendor Panel

Add Products (with image upload)

View & Delete Products

Manage Orders

Update Order Status


👤 User Panel

Browse Vendors

View Products

Add to Cart

Checkout (Cash / UPI)

Track Order Status

Manage Guest List (Add / Update / Delete)


🧰 Tech Stack

Backend: Flask (Python)

Database: SQLite

Frontend: HTML, CSS, JavaScript

Authentication: Werkzeug Security


📂 Project Structure

Event-Management-System/
│
├── app.py
├── database.db
│
├── static/
│   ├── css/style.css
│   ├── js/main.js
│   └── uploads/
│
└── templates/
    ├── admin/
    ├── vendor/
    └── user/


⚙️ Installation & Setup

1️⃣ Clone Repository
git clone https://github.com/Anish-000/Evenet-Management-System.git
cd Evenet-Management-System

2️⃣ Install Dependencies
pip install flask

3️⃣ Run the Application
python app.py

Open in browser:
http://127.0.0.1:5000/


✨ UI Highlights

Gradient-based modern design

Soft shadows & rounded cards

Responsive layout

Styled tables & buttons

Clean dashboard layout


🎯 Purpose

This project was developed as an academic full-stack application to demonstrate:

Backend logic using Flask

Database management with SQLite

Frontend styling & layout design

Role-based system architecture


🌟 Developed with dedication and attention to structure.
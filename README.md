🎉 Event Management System

A full-stack Event Management System built using Flask, SQLite, HTML, CSS, and JavaScript.
This project implements role-based access for Admin, Vendor, and User with complete event workflow management.

🚀 Features
👤 Authentication & Security

Role-based login system (Admin, Vendor, User)

Secure password hashing

Session-based authentication

Client-side & server-side form validation

🛠 Admin Module

Maintain Users (view & delete)

Maintain Vendors (view & delete)

Add Membership

Update / Cancel Membership

Manage all Orders

Update Order Status

🏪 Vendor Module

Add Products (with image upload)

View & Delete Products

Manage Orders

Update Order Status (Received → Ready → Out for Delivery)

👥 User Module

View Vendors

View Vendor Products

Add to Cart

Remove from Cart

Checkout (Cash / UPI)

Order Status Tracking

Guest List Management (Add / Update / Delete)

🖼 Product Image Upload

Vendors can upload product images

Images stored in static/uploads

Displayed in product list & cart

🗂 Project Structure

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

🧰 Tech Stack

Backend: Flask (Python)

Database: SQLite

Frontend: HTML, CSS

Client-side Validation: JavaScript

Authentication: Werkzeug password hashing

⚙️ Installation & Setup

1️⃣ Clone Repository

git clone https://github.com/your-username/event-management-system.git
cd event-management-system

2️⃣ Create Virtual Environment (Optional but Recommended)

python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows

3️⃣ Install Dependencies

pip install flask

4️⃣ Run Application

python app.py

Application will run at:

http://127.0.0.1:5000/


🔐 Default Flow

User → Vendors → Products → Cart → Checkout → Order Status

Admin → Manage Users, Vendors, Membership, Orders

Vendor → Add Products → Manage Orders

📌 Key Highlights

✔ Role-based dashboards
✔ Professional UI
✔ Image upload support
✔ Guest list management
✔ Secure authentication
✔ Structured project architecture

📄 License

This project is developed for academic and learning purposes.
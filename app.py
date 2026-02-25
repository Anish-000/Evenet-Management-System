import sqlite3
from flask import Flask, render_template, request, redirect, session, url_for
from flask import Flask
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "super_secret_key"



# Database Connection


def get_db_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn



# Initialize Database


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # USERS TABLE
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'vendor', 'user'))
        )
    """)

    # PRODUCTS TABLE
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT,
            FOREIGN KEY (vendor_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)

    # CART TABLE
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        )
    """)

    # ORDERS TABLE
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Received',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)

    # ORDER ITEMS TABLE
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        )
    """)

    # MEMBERSHIP TABLE
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS membership (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('6_months', '1_year', '2_years')),
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)

  
    # Guest List Table
 
    conn.execute("""
        CREATE TABLE IF NOT EXISTS guest_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            guest_name TEXT NOT NULL,
            guest_email TEXT,
            guest_phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()



# Signup


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        password = request.form["password"]
        role = request.form["role"]

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                (name, email, password, role),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            conn.close()
            return "Email already exists."

        conn.close()
        return redirect("/login")

    return render_template("auth/signup.html")



# Login


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE email = ? AND password = ?",
            (email, password),
        ).fetchone()
        conn.close()

        if user:
            session["user_id"] = user["id"]
            session["role"] = user["role"]

            if user["role"] == "admin":
                return redirect("/admin/dashboard")
            elif user["role"] == "vendor":
                return redirect("/vendor/dashboard")
            else:
                return redirect("/user/dashboard")

        return "Invalid credentials."

    return render_template("auth/login.html")



# Logout


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")


# Role Protection Helper


def login_required(role):
    def decorator(func):
        def wrapper(*args, **kwargs):
            if "user_id" not in session:
                return redirect("/login")

            if session["role"] != role:
                return "Unauthorized Access"

            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator



# Admin Dashboard


@app.route("/admin/dashboard")
@login_required("admin")
def admin_dashboard():
    return render_template("admin/dashboard.html")



# Vendor Dashboard


@app.route("/vendor/dashboard")
@login_required("vendor")
def vendor_dashboard():
    return render_template("vendor/dashboard.html")



# User Dashboard


@app.route("/user/dashboard")
@login_required("user")
def user_dashboard():
    return render_template("user/dashboard.html")


# Vendor - Add Product


@app.route("/vendor/add_product", methods=["GET", "POST"])
@login_required("vendor")
def add_product():
    if request.method == "POST":
        name = request.form["name"]
        price = request.form["price"]

        conn = get_db_connection()
        conn.execute(
            "INSERT INTO products (vendor_id, name, price) VALUES (?, ?, ?)",
            (session["user_id"], name, price),
        )
        conn.commit()
        conn.close()

        return redirect("/vendor/products")

    return render_template("vendor/add_product.html")



# Vendor - View Products


@app.route("/vendor/products")
@login_required("vendor")
def vendor_products():
    conn = get_db_connection()
    products = conn.execute(
        "SELECT * FROM products WHERE vendor_id = ?",
        (session["user_id"],),
    ).fetchall()
    conn.close()

    return render_template("vendor/product_list.html", products=products)



# Vendor - Delete Product


@app.route("/vendor/delete_product/<int:id>")
@login_required("vendor")
def delete_product(id):
    conn = get_db_connection()
    conn.execute(
        "DELETE FROM products WHERE id = ? AND vendor_id = ?",
        (id, session["user_id"]),
    )
    conn.commit()
    conn.close()

    return redirect("/vendor/products")


# User - View All Products


@app.route("/user/products")
@login_required("user")
def user_products():
    conn = get_db_connection()
    products = conn.execute("""
        SELECT products.*, users.name AS vendor_name
        FROM products
        JOIN users ON products.vendor_id = users.id
    """).fetchall()
    conn.close()

    return render_template("user/product_list.html", products=products)



# User - Add To Cart


@app.route("/user/add_to_cart/<int:product_id>")
@login_required("user")
def add_to_cart(product_id):
    conn = get_db_connection()

    existing = conn.execute(
        "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
        (session["user_id"], product_id)
    ).fetchone()

    if existing:
        conn.execute(
            "UPDATE cart SET quantity = quantity + 1 WHERE id = ?",
            (existing["id"],)
        )
    else:
        conn.execute(
            "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)",
            (session["user_id"], product_id)
        )

    conn.commit()
    conn.close()

    return redirect("/user/products")


# User - View Cart


@app.route("/user/cart")
@login_required("user")
def view_cart():
    conn = get_db_connection()

    cart_items = conn.execute("""
        SELECT cart.id, products.name, products.price, cart.quantity
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = ?
    """, (session["user_id"],)).fetchall()

    total = 0
    for item in cart_items:
        total += item["price"] * item["quantity"]

    conn.close()

    return render_template("user/cart.html", cart_items=cart_items, total=total)



# User - Remove From Cart


@app.route("/user/remove_from_cart/<int:id>")
@login_required("user")
def remove_from_cart(id):
    conn = get_db_connection()
    conn.execute(
        "DELETE FROM cart WHERE id = ? AND user_id = ?",
        (id, session["user_id"])
    )
    conn.commit()
    conn.close()

    return redirect("/user/cart")


# User - Checkout


@app.route("/user/checkout", methods=["GET", "POST"])
@login_required("user")
def checkout():
    conn = get_db_connection()

    cart_items = conn.execute("""
        SELECT cart.*, products.price
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = ?
    """, (session["user_id"],)).fetchall()

    if not cart_items:
        conn.close()
        return "Cart is empty."

    total = 0
    for item in cart_items:
        total += item["price"] * item["quantity"]

    if request.method == "POST":
        payment_method = request.form["payment_method"]

        # Insert into orders
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO orders (user_id, total_amount, payment_method) VALUES (?, ?, ?)",
            (session["user_id"], total, payment_method)
        )
        order_id = cursor.lastrowid

        # Insert into order_items
        for item in cart_items:
            cursor.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                (order_id, item["product_id"], item["quantity"], item["price"])
            )

        # Clear cart
        cursor.execute(
            "DELETE FROM cart WHERE user_id = ?",
            (session["user_id"],)
        )

        conn.commit()
        conn.close()

        return redirect("/user/orders")

    conn.close()
    return render_template("user/checkout.html", total=total)


# User - View Orders


@app.route("/user/orders")
@login_required("user")
def user_orders():
    conn = get_db_connection()

    orders = conn.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        (session["user_id"],)
    ).fetchall()

    conn.close()

    return render_template("user/order_status.html", orders=orders)


# Vendor - View Orders


@app.route("/vendor/orders")
@login_required("vendor")
def vendor_orders():
    conn = get_db_connection()

    orders = conn.execute("""
        SELECT DISTINCT orders.*
        FROM orders
        JOIN order_items ON orders.id = order_items.order_id
        JOIN products ON order_items.product_id = products.id
        WHERE products.vendor_id = ?
        ORDER BY orders.created_at DESC
    """, (session["user_id"],)).fetchall()

    conn.close()

    return render_template("vendor/update_status.html", orders=orders)


# Vendor - Update Order Status


@app.route("/vendor/update_status/<int:order_id>", methods=["POST"])
@login_required("vendor")
def update_status(order_id):
    new_status = request.form["status"]

    conn = get_db_connection()
    conn.execute(
        "UPDATE orders SET status = ? WHERE id = ?",
        (new_status, order_id)
    )
    conn.commit()
    conn.close()

    return redirect("/vendor/orders")


# Admin - View All Orders


@app.route("/admin/orders")
@login_required("admin")
def admin_orders():
    conn = get_db_connection()
    orders = conn.execute(
        "SELECT * FROM orders ORDER BY created_at DESC"
    ).fetchall()
    conn.close()

    return render_template("admin/orders.html", orders=orders)



# Admin - Update Order Status


@app.route("/admin/update_status/<int:order_id>", methods=["POST"])
@login_required("admin")
def admin_update_status(order_id):
    new_status = request.form["status"]

    conn = get_db_connection()
    conn.execute(
        "UPDATE orders SET status = ? WHERE id = ?",
        (new_status, order_id)
    )
    conn.commit()
    conn.close()

    return redirect("/admin/orders")


# Admin - Maintain Users


@app.route("/admin/maintain_users")
@login_required("admin")
def maintain_users():
    conn = get_db_connection()
    users = conn.execute(
        "SELECT * FROM users WHERE role = 'user'"
    ).fetchall()
    conn.close()
    return render_template("admin/maintain_user.html", users=users)


@app.route("/admin/delete_user/<int:id>")
@login_required("admin")
def delete_user(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM users WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect("/admin/maintain_users")


# Admin - Maintain Vendors


@app.route("/admin/maintain_vendors")
@login_required("admin")
def maintain_vendors():
    conn = get_db_connection()
    vendors = conn.execute(
        "SELECT * FROM users WHERE role = 'vendor'"
    ).fetchall()
    conn.close()
    return render_template("admin/maintain_vendor.html", vendors=vendors)


@app.route("/admin/delete_vendor/<int:id>")
@login_required("admin")
def delete_vendor(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM users WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect("/admin/maintain_vendors")


# Admin - Add Membership


@app.route("/admin/membership_add", methods=["GET", "POST"])
@login_required("admin")
def membership_add():
    conn = get_db_connection()
    users = conn.execute(
        "SELECT * FROM users WHERE role = 'user'"
    ).fetchall()

    if request.method == "POST":
        user_id = request.form["user_id"]
        membership_type = request.form["type"]

        start_date = datetime.now()

        if membership_type == "6_months":
            end_date = start_date + timedelta(days=180)
        elif membership_type == "1_year":
            end_date = start_date + timedelta(days=365)
        else:
            end_date = start_date + timedelta(days=730)

        conn.execute("""
            INSERT INTO membership (user_id, type, start_date, end_date)
            VALUES (?, ?, ?, ?)
        """, (user_id, membership_type,
              start_date.strftime("%Y-%m-%d"),
              end_date.strftime("%Y-%m-%d")))

        conn.commit()
        conn.close()
        return redirect("/admin/dashboard")

    conn.close()
    return render_template("admin/membership_add.html", users=users)


# Admin - Update Membership

@app.route("/admin/membership_update", methods=["GET", "POST"])
@login_required("admin")
def membership_update():
    conn = get_db_connection()

    if request.method == "POST":
        membership_id = request.form["membership_id"]
        action = request.form["action"]

        membership = conn.execute(
            "SELECT * FROM membership WHERE id = ?",
            (membership_id,)
        ).fetchone()

        if membership:
            # Extend only if membership is NOT cancelled
            if action == "extend" and membership["status"] != "cancelled":
                new_end = datetime.strptime(
                    membership["end_date"], "%Y-%m-%d"
                ) + timedelta(days=180)

                conn.execute("""
                    UPDATE membership
                    SET end_date = ?
                    WHERE id = ?
                """, (new_end.strftime("%Y-%m-%d"), membership_id))

            # Cancel membership
            elif action == "cancel":
                conn.execute("""
                    UPDATE membership
                    SET status = 'cancelled'
                    WHERE id = ?
                """, (membership_id,))

            conn.commit()

    memberships = conn.execute("""
        SELECT membership.*, users.name
        FROM membership
        JOIN users ON membership.user_id = users.id
    """).fetchall()

    conn.close()
    return render_template("admin/membership_update.html", memberships=memberships)


# User - View Vendors


@app.route("/user/vendors")
@login_required("user")
def user_vendors():
    conn = get_db_connection()
    vendors = conn.execute(
        "SELECT id, name FROM users WHERE role = 'vendor'"
    ).fetchall()
    conn.close()

    return render_template("user/vendor_list.html", vendors=vendors)


# User - View Products by Vendor


@app.route("/user/vendor_products/<int:vendor_id>")
@login_required("user")
def vendor_products_for_user(vendor_id):
    conn = get_db_connection()
    products = conn.execute("""
        SELECT * FROM products
        WHERE vendor_id = ?
    """, (vendor_id,)).fetchall()
    conn.close()

    return render_template("user/product_list.html", products=products)


# User - View Guest List

@app.route("/user/guestlist")
@login_required("user")
def view_guestlist():
    conn = get_db_connection()
    guests = conn.execute("""
        SELECT * FROM guest_list
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (session["user_id"],)).fetchall()
    conn.close()

    return render_template("user/guest_list.html", guests=guests)


# User - Add Guest

@app.route("/user/add_guest", methods=["GET", "POST"])
@login_required("user")
def add_guest():
    if request.method == "POST":
        name = request.form["guest_name"]
        email = request.form["guest_email"]
        phone = request.form["guest_phone"]

        conn = get_db_connection()
        conn.execute("""
            INSERT INTO guest_list (user_id, guest_name, guest_email, guest_phone)
            VALUES (?, ?, ?, ?)
        """, (session["user_id"], name, email, phone))
        conn.commit()
        conn.close()

        return redirect("/user/guestlist")

    return render_template("user/add_guest.html")


# User - Update Guest

@app.route("/user/update_guest/<int:id>", methods=["GET", "POST"])
@login_required("user")
def update_guest(id):
    conn = get_db_connection()

    if request.method == "POST":
        name = request.form["guest_name"]
        email = request.form["guest_email"]
        phone = request.form["guest_phone"]

        conn.execute("""
            UPDATE guest_list
            SET guest_name = ?, guest_email = ?, guest_phone = ?
            WHERE id = ? AND user_id = ?
        """, (name, email, phone, id, session["user_id"]))
        conn.commit()
        conn.close()

        return redirect("/user/guestlist")

    guest = conn.execute("""
        SELECT * FROM guest_list
        WHERE id = ? AND user_id = ?
    """, (id, session["user_id"])).fetchone()

    conn.close()
    return render_template("user/update_guest.html", guest=guest)


# User - Delete Guest

@app.route("/user/delete_guest/<int:id>")
@login_required("user")
def delete_guest(id):
    conn = get_db_connection()
    conn.execute("""
        DELETE FROM guest_list
        WHERE id = ? AND user_id = ?
    """, (id, session["user_id"]))
    conn.commit()
    conn.close()

    return redirect("/user/guestlist")



# Test Route


@app.route("/")
def home():
    if "user_id" in session:
        role = session.get("role")

        if role == "admin":
            return redirect("/admin/dashboard")
        elif role == "vendor":
            return redirect("/vendor/dashboard")
        else:
            return redirect("/user/dashboard")

    return redirect("/login")



# Run App


if __name__ == "__main__":
    init_db()
    app.run(debug=True)

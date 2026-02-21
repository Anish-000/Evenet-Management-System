// Run after page loads
document.addEventListener("DOMContentLoaded", function () {

    // ==========================
    // Signup Validation
    // ==========================
    const signupForm = document.querySelector("form[action='']") || document.querySelector("form");

    if (signupForm && window.location.pathname.includes("signup")) {
        signupForm.addEventListener("submit", function (e) {
            const name = document.querySelector("input[name='name']");
            const email = document.querySelector("input[name='email']");
            const password = document.querySelector("input[name='password']");

            if (name.value.trim().length < 3) {
                alert("Name must be at least 3 characters long.");
                e.preventDefault();
            }

            if (!validateEmail(email.value)) {
                alert("Enter a valid email address.");
                e.preventDefault();
            }

            if (password.value.length < 6) {
                alert("Password must be at least 6 characters.");
                e.preventDefault();
            }
        });
    }

    // ==========================
    // Login Validation
    // ==========================
    if (window.location.pathname.includes("login")) {
        const loginForm = document.querySelector("form");
        loginForm.addEventListener("submit", function (e) {
            const email = document.querySelector("input[name='email']");
            const password = document.querySelector("input[name='password']");

            if (!validateEmail(email.value)) {
                alert("Enter a valid email address.");
                e.preventDefault();
            }

            if (password.value.trim() === "") {
                alert("Password cannot be empty.");
                e.preventDefault();
            }
        });
    }

    // ==========================
    // Add Product Validation
    // ==========================
    if (window.location.pathname.includes("add_product")) {
        const productForm = document.querySelector("form");
        productForm.addEventListener("submit", function (e) {
            const name = document.querySelector("input[name='name']");
            const price = document.querySelector("input[name='price']");

            if (name.value.trim().length < 2) {
                alert("Product name must be at least 2 characters.");
                e.preventDefault();
            }

            if (price.value <= 0) {
                alert("Price must be greater than 0.");
                e.preventDefault();
            }
        });
    }

    // ==========================
    // Email Validation Function
    // ==========================
    function validateEmail(email) {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

});
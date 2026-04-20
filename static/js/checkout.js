/* ============================================================
   checkout.js — Event Management System
   Handles: form validation, payment method selection,
            loading state, flash auto-dismiss, nav toggle
   ============================================================ */

(function () {
    'use strict';

    /* ── Helpers ──────────────────────────────────────────── */
    function $(id)     { return document.getElementById(id); }
    function $all(sel) { return document.querySelectorAll(sel); }

    function setError(inputEl, errorEl, msg) {
        if (inputEl) inputEl.classList.add('is-error');
        if (errorEl) errorEl.textContent = msg;
    }

    function clearError(inputEl, errorEl) {
        if (inputEl) inputEl.classList.remove('is-error');
        if (errorEl) errorEl.textContent = '';
    }

    function setLoading(btn, active) {
        if (!btn) return;
        btn.disabled = active;
        btn.classList.toggle('loading', active);
    }

    /* ── Flash auto-dismiss ───────────────────────────────── */
    function initFlash() {
        $all('.flash').forEach(flash => {
            setTimeout(() => flash.remove(), 5000);
            const btn = flash.querySelector('.flash-close');
            if (btn) btn.addEventListener('click', () => flash.remove());
        });
    }

    /* ── Mobile nav toggle ────────────────────────────────── */
    function initNav() {
        const toggle = $('nav-toggle');
        const links  = $('nav-links');
        if (toggle && links) {
            toggle.addEventListener('click', () => links.classList.toggle('open'));
        }
    }

    /* ── Field Validators ─────────────────────────────────── */
    const validators = {
        name(val) {
            if (!val.trim())        return 'Full name is required.';
            if (val.trim().length < 2) return 'Name must be at least 2 characters.';
            return null;
        },
        email(val) {
            if (!val.trim())            return 'Email address is required.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
            return null;
        },
        address(val) {
            if (!val.trim()) return 'Address is required.';
            return null;
        },
        city(val) {
            if (!val.trim()) return 'City is required.';
            return null;
        },
        state(val) {
            if (!val.trim()) return 'State is required.';
            return null;
        },
        pincode(val) {
            if (!val.trim())            return 'Pin code is required.';
            if (!/^\d{6}$/.test(val.trim())) return 'Enter a valid 6-digit pin code.';
            return null;
        },
        phone(val) {
            if (!val) return null; /* optional */
            if (!/^\d{10}$/.test(val.trim())) return 'Enter a valid 10-digit phone number.';
            return null;
        }
    };

    /* ── Checkout Form ────────────────────────────────────── */
    function initCheckoutForm() {
        const form = $('checkout-form');
        if (!form) return;

        /* Field config: [inputId, errorId, validatorKey] */
        const fields = [
            ['checkout-name',    'name-error',    'name'],
            ['checkout-email',   'email-error',   'email'],
            ['checkout-address', 'address-error', 'address'],
            ['checkout-city',    'city-error',    'city'],
            ['checkout-state',   'state-error',   'state'],
            ['checkout-pincode', 'pincode-error', 'pincode'],
        ];

        /* Attach live blur + input listeners */
        fields.forEach(([inputId, errorId, key]) => {
            const input = $(inputId);
            const error = $(errorId);
            if (!input) return;

            input.addEventListener('blur', () => {
                const err = validators[key](input.value);
                err ? setError(input, error, err) : clearError(input, error);
            });

            input.addEventListener('input', () => clearError(input, error));
        });

        /* Pincode — numbers only */
        const pincodeInput = $('checkout-pincode');
        if (pincodeInput) {
            pincodeInput.addEventListener('keydown', (e) => {
                if (
                    !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key) &&
                    !/^\d$/.test(e.key)
                ) e.preventDefault();
            });
        }

        /* Submit */
        const submitBtn = $('checkout-submit');
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            let valid = true;

            fields.forEach(([inputId, errorId, key]) => {
                const input = $(inputId);
                const error = $(errorId);
                if (!input) return;

                const err = validators[key](input.value);
                if (err) {
                    setError(input, error, err);
                    valid = false;
                } else {
                    clearError(input, error);
                }
            });

            /* Check payment method selected */
            const paymentSelected = document.querySelector('input[name="payment_method"]:checked');
            const paymentError    = $('payment-error');
            if (!paymentSelected) {
                if (paymentError) paymentError.textContent = 'Please select a payment method.';
                valid = false;
            } else {
                if (paymentError) paymentError.textContent = '';
            }

            if (!valid) {
                /* Scroll to first error */
                const firstError = form.querySelector('.is-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            setLoading(submitBtn, true);
            this.submit();
        });
    }

    /* ── Payment Method Visual Feedback ───────────────────── */
    function initPaymentSelector() {
        const paymentInputs = $all('input[name="payment_method"]');
        paymentInputs.forEach(input => {
            /* Set initial state */
            if (input.checked) {
                input.closest('.payment-option')?.classList.add('selected');
            }

            input.addEventListener('change', () => {
                /* Remove selected from all */
                $all('.payment-option').forEach(opt => opt.classList.remove('selected'));
                /* Add to checked */
                input.closest('.payment-option')?.classList.add('selected');

                /* Clear payment error if shown */
                const paymentError = $('payment-error');
                if (paymentError) paymentError.textContent = '';
            });
        });
    }

    /* ── Order Summary Accordion (mobile) ─────────────────── */
    function initSummaryToggle() {
        const toggleBtn = $('summary-toggle');
        const summary   = $('checkout-summary-items');
        if (!toggleBtn || !summary) return;

        toggleBtn.addEventListener('click', () => {
            const isOpen = summary.classList.toggle('open');
            toggleBtn.setAttribute('aria-expanded', isOpen);
            const icon = toggleBtn.querySelector('.toggle-icon');
            if (icon) icon.style.transform = isOpen ? 'rotate(180deg)' : '';
        });
    }

    /* ── Auto-fill name & email from session (if available) ── */
    function initAutoFill() {
        const nameInput  = $('checkout-name');
        const emailInput = $('checkout-email');
        const sessionName  = document.body.dataset.userName;
        const sessionEmail = document.body.dataset.userEmail;

        if (nameInput  && sessionName  && !nameInput.value)  nameInput.value  = sessionName;
        if (emailInput && sessionEmail && !emailInput.value) emailInput.value = sessionEmail;
    }

    /* ── Init ─────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', () => {
        initFlash();
        initNav();
        initCheckoutForm();
        initPaymentSelector();
        initSummaryToggle();
        initAutoFill();
    });

})();
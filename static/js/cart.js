/* ============================================================
   cart.js — Event Management System
   Handles: quantity +/- controls, live total update,
            delete all confirmation, flash auto-dismiss
   ============================================================ */

(function () {
    'use strict';

    /* ── Helpers ──────────────────────────────────────────── */
    function $(id)    { return document.getElementById(id); }
    function $all(sel){ return document.querySelectorAll(sel); }

    function formatPrice(amount) {
        return '₹' + parseFloat(amount).toFixed(2);
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

    /* ── Quantity Controls ────────────────────────────────── */
    function initQuantityControls() {
        $all('.qty-control').forEach(control => {
            const input   = control.querySelector('.qty-input');
            const minusBtn = control.querySelector('.qty-btn[data-action="minus"]');
            const plusBtn  = control.querySelector('.qty-btn[data-action="plus"]');

            if (!input) return;

            /* Plus button */
            if (plusBtn) {
                plusBtn.addEventListener('click', () => {
                    const current = parseInt(input.value) || 1;
                    input.value = current + 1;
                    triggerUpdate(input);
                });
            }

            /* Minus button */
            if (minusBtn) {
                minusBtn.addEventListener('click', () => {
                    const current = parseInt(input.value) || 1;
                    if (current > 1) {
                        input.value = current - 1;
                        triggerUpdate(input);
                    } else {
                        /* Quantity reaching 0 — confirm remove */
                        const cartItem = input.closest('.cart-item');
                        const name = cartItem ? cartItem.querySelector('.cart-item-name')?.textContent : 'this item';
                        showRemoveConfirm(name, () => {
                            input.value = 0;
                            triggerUpdate(input);
                        });
                    }
                });
            }

            /* Manual input */
            input.addEventListener('change', () => {
                let val = parseInt(input.value);
                if (isNaN(val) || val < 1) {
                    val = 1;
                    input.value = 1;
                }
                if (val > 99) {
                    val = 99;
                    input.value = 99;
                }
                triggerUpdate(input);
            });

            /* Prevent non-numeric keys */
            input.addEventListener('keydown', (e) => {
                if (
                    !['Backspace','Delete','ArrowUp','ArrowDown','Tab'].includes(e.key) &&
                    !/^\d$/.test(e.key)
                ) {
                    e.preventDefault();
                }
            });
        });
    }

    /* Submit the hidden update form for a cart item */
    function triggerUpdate(input) {
        const cartItem = input.closest('.cart-item');
        if (!cartItem) return;

        const form = cartItem.querySelector('.qty-update-form');
        if (form) {
            const hiddenQty = form.querySelector('input[name="quantity"]');
            if (hiddenQty) hiddenQty.value = input.value;
            form.submit();
        }
    }

    /* ── Live Total Calculation (optimistic UI) ───────────── */
    function initLiveTotals() {
        /* Re-calculate totals whenever any qty input changes */
        $all('.qty-input').forEach(input => {
            input.addEventListener('input', recalcTotals);
        });
    }

    function recalcTotals() {
        let grandTotal = 0;

        $all('.cart-item').forEach(item => {
            const qtyInput  = item.querySelector('.qty-input');
            const unitEl    = item.querySelector('[data-unit-price]');
            const totalEl   = item.querySelector('.cart-item-total');

            if (!qtyInput || !unitEl) return;

            const qty       = parseInt(qtyInput.value) || 1;
            const unitPrice = parseFloat(unitEl.dataset.unitPrice) || 0;
            const itemTotal = qty * unitPrice;

            if (totalEl) totalEl.textContent = formatPrice(itemTotal);
            grandTotal += itemTotal;
        });

        /* Update summary */
        const grandTotalEl = $('grand-total');
        if (grandTotalEl) grandTotalEl.textContent = formatPrice(grandTotal);

        /* Update item count */
        const countEl = $('cart-count');
        if (countEl) {
            const total = Array.from($all('.qty-input'))
                .reduce((sum, i) => sum + (parseInt(i.value) || 0), 0);
            countEl.textContent = total + (total === 1 ? ' item' : ' items');
        }
    }

    /* ── Remove Item Confirmation ─────────────────────────── */
    function initRemoveButtons() {
        $all('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const cartItem = this.closest('.cart-item');
                const name = cartItem?.querySelector('.cart-item-name')?.textContent || 'this item';
                const href = this.dataset.href || this.getAttribute('href');

                showRemoveConfirm(name, () => {
                    if (href) window.location.href = href;
                });
            });
        });
    }

    /* ── Delete All Confirmation ──────────────────────────── */
    function initDeleteAll() {
        const deleteAllBtn = $('delete-all-btn');
        if (!deleteAllBtn) return;

        deleteAllBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.dataset.href || this.getAttribute('href');

            showDeleteAllConfirm(() => {
                if (href) window.location.href = href;
            });
        });
    }

    /* ── Confirm Modals ───────────────────────────────────── */
    function showRemoveConfirm(itemName, onConfirm) {
        const modal = createModal({
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                     <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                     <path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                     <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                     <path d="M9 6V4h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                   </svg>`,
            title: 'Remove Item',
            message: `Remove <strong>${itemName}</strong> from your cart?`,
            confirmText: 'Remove',
            confirmClass: 'btn btn-danger',
            onConfirm
        });
        document.body.appendChild(modal);
    }

    function showDeleteAllConfirm(onConfirm) {
        const modal = createModal({
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                     <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                     <path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                     <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                     <path d="M9 6V4h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                   </svg>`,
            title: 'Clear Cart',
            message: 'Are you sure you want to remove <strong>all items</strong> from your cart?',
            confirmText: 'Clear Cart',
            confirmClass: 'btn btn-danger',
            onConfirm
        });
        document.body.appendChild(modal);
    }

    function createModal({ icon, title, message, confirmText, confirmClass, onConfirm }) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay open';
        overlay.innerHTML = `
            <div class="confirm-modal" role="dialog" aria-modal="true">
                <div class="confirm-modal-icon">${icon}</div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="confirm-modal-actions">
                    <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
                    <button class="${confirmClass}" id="modal-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        /* Cancel */
        overlay.querySelector('#modal-cancel').addEventListener('click', () => {
            overlay.remove();
        });

        /* Confirm */
        overlay.querySelector('#modal-confirm').addEventListener('click', () => {
            overlay.remove();
            onConfirm();
        });

        /* Click outside */
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        /* Escape key */
        const onKey = (e) => {
            if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); }
        };
        document.addEventListener('keydown', onKey);

        return overlay;
    }

    /* ── Init ─────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', () => {
        initFlash();
        initNav();
        initQuantityControls();
        initLiveTotals();
        initRemoveButtons();
        initDeleteAll();
    });

})();
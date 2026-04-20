/* ============================================================
   admin.js — Event Management System
   Handles: membership type selection & date preview,
            membership lookup & detail population,
            delete confirmation modals, search/filter,
            flash auto-dismiss, nav toggle
   ============================================================ */

(function () {
    'use strict';

    /* ── Helpers ──────────────────────────────────────────── */
    function $(id)     { return document.getElementById(id); }
    function $all(sel) { return document.querySelectorAll(sel); }

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

    /* ══════════════════════════════════════════════════════
       MEMBERSHIP ADD PAGE
       ══════════════════════════════════════════════════════ */
    function initMembershipAdd() {
        const typeInputs   = $all('input[name="type"]');
        const startDateEl  = $('preview-start-date');
        const endDateEl    = $('preview-end-date');

        if (!typeInputs.length) return;

        const durationDays = {
            '6_months': 180,
            '1_year'  : 365,
            '2_years' : 730
        };

        function updateDatePreview(type) {
            if (!startDateEl || !endDateEl) return;

            const start   = new Date();
            const days    = durationDays[type] || 180;
            const end     = new Date(start);
            end.setDate(end.getDate() + days);

            const fmt = (d) => d.toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            startDateEl.textContent = fmt(start);
            endDateEl.textContent   = fmt(end);
        }

        /* Init with default selected */
        const checkedType = document.querySelector('input[name="type"]:checked');
        if (checkedType) updateDatePreview(checkedType.value);

        /* Update on change */
        typeInputs.forEach(input => {
            input.addEventListener('change', () => updateDatePreview(input.value));
        });
    }

    /* ══════════════════════════════════════════════════════
       MEMBERSHIP UPDATE PAGE
       ══════════════════════════════════════════════════════ */
    function initMembershipUpdate() {
        const lookupInput  = $('membership-id-input');
        const lookupBtn    = $('membership-lookup-btn');
        const detailPanel  = $('membership-detail-panel');

        if (!lookupInput || !lookupBtn) return;

        /* Membership data is embedded in the page as JSON */
        const dataEl = $('memberships-data');
        if (!dataEl) return;

        let memberships = [];
        try {
            memberships = JSON.parse(dataEl.textContent);
        } catch (e) {
            console.error('[admin.js] Failed to parse memberships data:', e);
            return;
        }

        /* Lookup handler */
        lookupBtn.addEventListener('click', () => {
            const id = lookupInput.value.trim();
            if (!id) {
                showLookupError('Please enter a membership number.');
                return;
            }

            const membership = memberships.find(m => String(m.id) === String(id));
            if (!membership) {
                showLookupError('Membership #' + id + ' not found.');
                hideMembershipDetail();
                return;
            }

            clearLookupError();
            populateMembershipDetail(membership);
        });

        /* Also trigger on Enter key */
        lookupInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                lookupBtn.click();
            }
        });

        function showLookupError(msg) {
            const errEl = $('lookup-error');
            if (errEl) errEl.textContent = msg;
        }

        function clearLookupError() {
            const errEl = $('lookup-error');
            if (errEl) errEl.textContent = '';
        }

        function hideMembershipDetail() {
            if (detailPanel) detailPanel.classList.remove('visible');
        }

        function populateMembershipDetail(m) {
            /* Populate hidden form field */
            const hiddenId = $('hidden-membership-id');
            if (hiddenId) hiddenId.value = m.id;

            /* Populate display fields */
            const fields = {
                'detail-member-name'  : m.user_name || '—',
                'detail-membership-id': '#' + m.id,
                'detail-type'         : formatType(m.type),
                'detail-start'        : m.start_date,
                'detail-end'          : m.end_date,
                'detail-status'       : m.status.charAt(0).toUpperCase() + m.status.slice(1),
            };

            Object.entries(fields).forEach(([id, val]) => {
                const el = $(id);
                if (el) el.textContent = val;
            });

            /* Status badge colour */
            const statusEl = $('detail-status');
            if (statusEl) {
                statusEl.className = 'membership-detail-value badge';
                if (m.status === 'active')    statusEl.classList.add('badge-active');
                if (m.status === 'cancelled') statusEl.classList.add('badge-cancelled');
            }

            /* Show panel */
            if (detailPanel) detailPanel.classList.add('visible');

            /* Pre-select extend if not cancelled, else cancel */
            const defaultAction = m.status === 'cancelled' ? 'cancel' : 'extend';
            const defaultRadio  = document.querySelector(`input[name="action"][value="${defaultAction}"]`);
            if (defaultRadio) defaultRadio.checked = true;
        }

        function formatType(type) {
            const map = { '6_months': '6 Months', '1_year': '1 Year', '2_years': '2 Years' };
            return map[type] || type;
        }
    }

    /* ══════════════════════════════════════════════════════
       MAINTAIN USERS / VENDORS — search & delete modal
       ══════════════════════════════════════════════════════ */
    function initMaintainTable() {
        initTableSearch();
        initDeleteModals();
    }

    /* Live search filter */
    function initTableSearch() {
        const searchInput = $('maintain-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const rows  = $all('tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });

            /* Show empty message if all rows hidden */
            const visibleRows = Array.from(rows).filter(r => r.style.display !== 'none');
            let noResultsEl = $('no-results-row');

            if (visibleRows.length === 0 && !noResultsEl) {
                const tbody = document.querySelector('tbody');
                if (tbody) {
                    const colCount = document.querySelector('thead tr')?.children.length || 4;
                    const tr = document.createElement('tr');
                    tr.id = 'no-results-row';
                    tr.innerHTML = `<td colspan="${colCount}" style="text-align:center;padding:32px;color:var(--text-muted);font-size:0.875rem;">
                        No results found for "<strong style="color:var(--text-secondary)">${escapeHtml(searchInput.value)}</strong>"
                    </td>`;
                    tbody.appendChild(tr);
                }
            } else if (visibleRows.length > 0 && noResultsEl) {
                noResultsEl.remove();
            }
        });
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, c => ({
            '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
        }[c]));
    }

    /* Delete confirmation modals */
    function initDeleteModals() {
        $all('.delete-trigger').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                const name = this.dataset.name   || 'this record';
                const href = this.dataset.href   || this.getAttribute('href');
                const type = this.dataset.type   || 'record';

                showDeleteConfirm(name, type, () => {
                    if (href) window.location.href = href;
                });
            });
        });
    }

    function showDeleteConfirm(name, type, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay open';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.innerHTML = `
            <div class="confirm-modal">
                <div class="confirm-modal-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M9 6V4h6v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </div>
                <h3>Delete ${capitalise(type)}</h3>
                <p>Are you sure you want to delete <strong>${escapeHtml(name)}</strong>?
                   This action <strong>cannot be undone</strong> and will remove all
                   associated data.</p>
                <div class="confirm-modal-actions">
                    <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
                    <button class="btn btn-danger"    id="modal-confirm">Delete</button>
                </div>
            </div>
        `;

        overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#modal-confirm').addEventListener('click', () => {
            overlay.remove();
            onConfirm();
        });

        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

        const onKey = (e) => {
            if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); }
        };
        document.addEventListener('keydown', onKey);

        document.body.appendChild(overlay);
    }

    function capitalise(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /* ══════════════════════════════════════════════════════
       MEMBERSHIP SEARCH (update page table)
       ══════════════════════════════════════════════════════ */
    function initMembershipSearch() {
        const searchInput = $('membership-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const rows  = $all('.membership-row');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    /* ══════════════════════════════════════════════════════
       ADD / UPDATE USER & VENDOR FORMS — basic validation
       ══════════════════════════════════════════════════════ */
    function initAdminForms() {
        const form = $('admin-user-form') || $('admin-vendor-form');
        if (!form) return;

        const nameInput  = $('admin-name');
        const emailInput = $('admin-email');
        const nameErr    = $('admin-name-error');
        const emailErr   = $('admin-email-error');
        const submitBtn  = $('admin-submit-btn');

        function validateName(val) {
            if (!val.trim())          return 'Name is required.';
            if (val.trim().length < 2) return 'Name must be at least 2 characters.';
            return null;
        }

        function validateEmail(val) {
            if (!val.trim())                              return 'Email is required.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email.';
            return null;
        }

        if (nameInput) {
            nameInput.addEventListener('blur', () => {
                const err = validateName(nameInput.value);
                err ? (nameInput.classList.add('is-error'), nameErr && (nameErr.textContent = err))
                    : (nameInput.classList.remove('is-error'), nameErr && (nameErr.textContent = ''));
            });
            nameInput.addEventListener('input', () => {
                nameInput.classList.remove('is-error');
                if (nameErr) nameErr.textContent = '';
            });
        }

        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const err = validateEmail(emailInput.value);
                err ? (emailInput.classList.add('is-error'), emailErr && (emailErr.textContent = err))
                    : (emailInput.classList.remove('is-error'), emailErr && (emailErr.textContent = ''));
            });
            emailInput.addEventListener('input', () => {
                emailInput.classList.remove('is-error');
                if (emailErr) emailErr.textContent = '';
            });
        }

        form.addEventListener('submit', function (e) {
            let valid = true;

            if (nameInput) {
                const err = validateName(nameInput.value);
                if (err) {
                    nameInput.classList.add('is-error');
                    if (nameErr) nameErr.textContent = err;
                    valid = false;
                }
            }

            if (emailInput) {
                const err = validateEmail(emailInput.value);
                if (err) {
                    emailInput.classList.add('is-error');
                    if (emailErr) emailErr.textContent = err;
                    valid = false;
                }
            }

            if (!valid) {
                e.preventDefault();
                const firstError = form.querySelector('.is-error');
                if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
            }
        });
    }

    /* ── Init ─────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', () => {
        initFlash();
        initNav();
        initMembershipAdd();
        initMembershipUpdate();
        initMaintainTable();
        initMembershipSearch();
        initAdminForms();
    });

})();
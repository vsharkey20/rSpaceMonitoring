import { getMonitoringRecords, deleteMonitoringRecord } from "../lib/api.js";
import { openMonitoringModal } from "../components/monitoringModal.js";
import { renderMaintenance } from "../components/maintenance.js";
import { formatCurrency, formatDate, getTodayDate } from "../lib/billing.js";
import { toast } from "../components/toast.js";

const NAV = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "monitoring", icon: "📋", label: "Monitoring" },
  { id: "shift", icon: "🔄", label: "Shift Report" },
  { id: "maintenance", icon: "⚙️", label: "Maintenance" },
];

export function renderAdminApp(app, onSwitchRole) {
  let activePage = "dashboard";

  app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="wordmark"><span class="r">r</span><span class="s">Space</span></div>
          <div class="sub">Client Tracker</div>
        </div>
        <nav class="sidebar-nav" id="sidebar-nav">
          <div class="nav-section-label">Navigation</div>
          ${NAV.map(n => `
            <div class="nav-item ${n.id === activePage ? 'active' : ''}" data-page="${n.id}">
              <span class="icon">${n.icon}</span>${n.label}
            </div>
          `).join('')}
        </nav>
        <div class="sidebar-footer">
          <button class="switch-role-btn" id="switch-role">⇆ Switch to Customer View</button>
        </div>
      </aside>

      <div class="main-content">
        <header class="topbar">
          <div class="topbar-title" id="topbar-title">Dashboard</div>
          <div class="topbar-right">
            <span class="badge admin">Admin</span>
            <span id="topbar-date" style="font-size:0.78rem;color:var(--gray-500)"></span>
          </div>
        </header>
        <div class="page-body" id="page-body"></div>
      </div>
    </div>
  `;

  // Date in topbar
  const d = new Date();
  document.getElementById("topbar-date").textContent = d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });

  // Nav
  document.getElementById("sidebar-nav").addEventListener("click", e => {
    const item = e.target.closest(".nav-item");
    if (!item) return;
    activePage = item.dataset.page;
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    item.classList.add("active");
    document.getElementById("topbar-title").textContent = NAV.find(n => n.id === activePage)?.label || "";
    loadPage(activePage);
  });

  document.getElementById("switch-role").addEventListener("click", () => onSwitchRole());

  function loadPage(page) {
    const body = document.getElementById("page-body");
    body.innerHTML = "";
    if (page === "dashboard") renderDashboard(body);
    else if (page === "monitoring") renderMonitoringPage(body);
    else if (page === "maintenance") renderMaintenance(body);
    else if (page === "shift") renderShiftPage(body);
  }

  loadPage(activePage);
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function renderDashboard(body) {
  body.innerHTML = `<div style="color:var(--gray-400);text-align:center;padding:40px">Loading stats...</div>`;
  try {
    const today = getTodayDate();
    const all = await getMonitoringRecords({ date: today });
    const docs = all.documents;
    const total = docs.reduce((s, d) => s + (d.Bill || 0), 0);
    const paid = docs.reduce((s, d) => s + (d.AmountPaid || 0), 0);
    const firstTime = docs.filter(d => d.FirstTime === "Yes").length;

    body.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Today's Clients</div>
          <div class="stat-value">${docs.length}</div>
          <div class="stat-sub">${today}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Bill</div>
          <div class="stat-value" style="font-size:1.3rem">${formatCurrency(total)}</div>
          <div class="stat-sub">Expected revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Amount Collected</div>
          <div class="stat-value" style="font-size:1.3rem">${formatCurrency(paid)}</div>
          <div class="stat-sub">Actual payments</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">First-Timers</div>
          <div class="stat-value">${firstTime}</div>
          <div class="stat-sub">New clients today</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Today's Entries</div>
            <div class="card-subtitle">${today}</div>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Client</th><th>Time In</th><th>Time Out</th>
              <th>Hours</th><th>Service</th><th>Type</th><th>Bill</th><th>Payment</th>
            </tr></thead>
            <tbody>
              ${docs.length ? docs.map(d => `
                <tr>
                  <td class="bold">${d.ClientName || '—'}</td>
                  <td>${d.TimeIn || '—'}</td>
                  <td>${d.TimeOut || '—'}</td>
                  <td>${formatHours(d.Hours)}</td>
                  <td>${d.Service || '—'}</td>
                  <td>${d.ClientType || '—'}</td>
                  <td class="bold">${formatCurrency(d.Bill || 0)}</td>
                  <td>${paymentPill(d.PaymentMethod)}</td>
                </tr>
              `).join('') : `<tr class="empty-row"><td colspan="8">No entries for today</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    body.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
  }
}

// ─── MONITORING PAGE ──────────────────────────────────────────────────────────
async function renderMonitoringPage(body) {
  body.innerHTML = `
    <div class="filter-bar">
      <input type="date" id="filter-date" value="${getTodayDate()}" />
      <input type="text" id="filter-name" placeholder="Search client..." />
      <button class="btn btn-ghost" id="filter-clear">✕ Clear</button>
      <button class="btn btn-primary" id="add-btn">➕ New Entry</button>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Client Monitoring Log</div>
        <span id="record-count" style="font-size:0.78rem;color:var(--gray-500)"></span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Date</th><th>Client</th><th>Time In</th><th>Time Out</th>
            <th>Hours</th><th>Service</th><th>Type</th><th>Billing</th>
            <th>Bill</th><th>Paid</th><th>Payment</th><th>First?</th><th>Notes</th><th>Actions</th>
          </tr></thead>
          <tbody id="mon-tbody">
            <tr class="loading-row"><td colspan="14">
              <div class="loading-dots"><span></span><span></span><span></span></div>
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  async function load() {
    const date = document.getElementById("filter-date")?.value;
    const name = document.getElementById("filter-name")?.value;
    const tbody = document.getElementById("mon-tbody");
    if (!tbody) return;
    tbody.innerHTML = `<tr class="loading-row"><td colspan="14"><div class="loading-dots"><span></span><span></span><span></span></div></td></tr>`;

    try {
      const res = await getMonitoringRecords({ date: date || undefined, clientName: name || undefined });
      const docs = res.documents;
      document.getElementById("record-count").textContent = `${docs.length} records`;

      tbody.innerHTML = docs.length ? docs.map(d => `
        <tr data-id="${d.$id}">
          <td>${d.Date || '—'}</td>
          <td class="bold">${d.ClientName || '—'}</td>
          <td>${d.TimeIn || '—'}</td>
          <td>${d.TimeOut || '—'}</td>
          <td>${formatHours(d.Hours)}</td>
          <td>${d.Service || '—'}</td>
          <td>${d.ClientType || '—'}</td>
          <td>${d.BillingType || '—'}</td>
          <td class="bold">${formatCurrency(d.Bill || 0)}</td>
          <td>${formatCurrency(d.AmountPaid || 0)}</td>
          <td>${paymentPill(d.PaymentMethod)}</td>
          <td>${firstTimePill(d.FirstTime)}</td>
          <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis" title="${d.Notes || ''}">${d.Notes || '—'}</td>
          <td>
            <span style="display:flex;gap:4px">
              <button class="btn btn-sm btn-ghost edit-row" data-id="${d.$id}">✏️</button>
              <button class="btn btn-sm btn-danger del-row" data-id="${d.$id}">🗑️</button>
            </span>
          </td>
        </tr>
      `).join('') : `<tr class="empty-row"><td colspan="14">No records found</td></tr>`;

      // Edit/delete events
      tbody.querySelectorAll(".edit-row").forEach(btn => {
        btn.addEventListener("click", () => {
          const doc = docs.find(d => d.$id === btn.dataset.id);
          if (doc) openMonitoringModal(document.getElementById("app"), doc, load);
        });
      });
      tbody.querySelectorAll(".del-row").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this record?")) return;
          try {
            await deleteMonitoringRecord(btn.dataset.id);
            toast("Deleted!", "success"); load();
          } catch (e) { toast("Error: " + e.message, "error"); }
        });
      });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="14" style="color:var(--danger);text-align:center">Error: ${e.message}</td></tr>`;
    }
  }

  body.querySelector("#add-btn")?.addEventListener("click", () => {
    openMonitoringModal(document.getElementById("app"), null, load);
  });
  body.querySelector("#filter-date")?.addEventListener("change", load);
  body.querySelector("#filter-name")?.addEventListener("input", debounce(load, 400));
  body.querySelector("#filter-clear")?.addEventListener("click", () => {
    body.querySelector("#filter-date").value = getTodayDate();
    body.querySelector("#filter-name").value = "";
    load();
  });

  load();
}

// ─── SHIFT PAGE ───────────────────────────────────────────────────────────────
function renderShiftPage(body) {
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px">
      <div class="shift-card">
        <div class="card-header"><div class="card-title">📅 Shift Info</div></div>
        <div class="shift-field">
          <label>Start Shift</label>
          <input type="text" id="shift-start" placeholder="e.g. 8:00 AM — Staff name" />
        </div>
        <div class="shift-field">
          <label>End Shift</label>
          <input type="text" id="shift-end" placeholder="e.g. 8:00 PM — Closing remarks" />
        </div>
        <div class="shift-field">
          <label>Expenses / Notes</label>
          <textarea id="shift-expense" rows="4" placeholder="List any expenses or shift notes..."></textarea>
        </div>
        <button class="btn btn-primary" id="shift-save">💾 Save Shift Report</button>
      </div>

      <div class="shift-card" id="shift-summary-card">
        <div class="card-header"><div class="card-title">📊 Today's Summary</div></div>
        <div id="shift-summary-body">
          <div style="color:var(--gray-300);text-align:center;padding:24px">Loading...</div>
        </div>
      </div>
    </div>
  `;

  // Load saved shift data from localStorage
  const saved = JSON.parse(localStorage.getItem("rspace_shift") || "{}");
  if (saved.start) document.getElementById("shift-start").value = saved.start;
  if (saved.end) document.getElementById("shift-end").value = saved.end;
  if (saved.expense) document.getElementById("shift-expense").value = saved.expense;

  document.getElementById("shift-save").addEventListener("click", () => {
    localStorage.setItem("rspace_shift", JSON.stringify({
      start: document.getElementById("shift-start").value,
      end: document.getElementById("shift-end").value,
      expense: document.getElementById("shift-expense").value,
    }));
    toast("Shift report saved!", "success");
  });

  // Load today's summary
  loadShiftSummary();
}

async function loadShiftSummary() {
  const body = document.getElementById("shift-summary-body");
  if (!body) return;
  try {
    const res = await getMonitoringRecords({ date: getTodayDate() });
    const docs = res.documents;
    const totalBill = docs.reduce((s, d) => s + (d.Bill || 0), 0);
    const totalPaid = docs.reduce((s, d) => s + (d.AmountPaid || 0), 0);
    const byPayment = {};
    docs.forEach(d => { if (d.PaymentMethod) byPayment[d.PaymentMethod] = (byPayment[d.PaymentMethod] || 0) + (d.AmountPaid || 0); });

    body.innerHTML = `
      <div style="display:grid;gap:10px">
        <div style="display:flex;justify-content:space-between;padding:10px;background:var(--gray-100);border-radius:6px">
          <span style="font-size:0.82rem;color:var(--gray-500)">Total Clients</span>
          <span style="font-weight:700">${docs.length}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px;background:var(--gray-100);border-radius:6px">
          <span style="font-size:0.82rem;color:var(--gray-500)">Expected Revenue</span>
          <span style="font-weight:700">${formatCurrency(totalBill)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px;background:var(--yellow-light);border-radius:6px;border:1px solid var(--yellow)">
          <span style="font-size:0.82rem;color:var(--gray-700);font-weight:600">Total Collected</span>
          <span style="font-weight:800;font-family:var(--font-display)">${formatCurrency(totalPaid)}</span>
        </div>
        ${Object.entries(byPayment).map(([method, amount]) => `
          <div style="display:flex;justify-content:space-between;padding:8px 10px;border-radius:6px;background:var(--gray-100)">
            <span style="font-size:0.78rem;color:var(--gray-500)">${method}</span>
            <span style="font-weight:600;font-size:0.85rem">${formatCurrency(amount)}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    body.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatHours(h) {
  const map = { hourly: "1 hr", "4hours": "4 hrs", "8hours": "8 hrs", "12hours": "12 hrs" };
  return map[h] || h || "—";
}

function paymentPill(method) {
  if (!method) return "—";
  const cls = { Cash: "cash", GCash: "gcash", Maya: "maya", "Bank Transfer": "bank" }[method] || "";
  return `<span class="pill ${cls}">${method}</span>`;
}

function firstTimePill(val) {
  if (!val) return "—";
  return `<span class="pill ${val === 'Yes' ? 'yes' : 'no'}">${val}</span>`;
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

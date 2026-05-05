import { createMonitoringRecord, updateMonitoringRecord, searchClientNames, getServices, getClientTypes, getBillingTypes } from "../lib/api.js";
import { calculateBill, computeHours, mapHoursToBillingTier, HOUR_OPTIONS, PAYMENT_METHODS, getTodayDate, getCurrentTime, formatCurrency } from "../lib/billing.js";
import { toast } from "./toast.js";

export async function openMonitoringModal(app, existing = null, onSaved) {
  let services = [], clientTypes = [], billingTypes = [];
  try {
    [services, clientTypes, billingTypes] = await Promise.all([
      getServices().then(r => r.documents),
      getClientTypes().then(r => r.documents),
      getBillingTypes().then(r => r.documents),
    ]);
  } catch (e) {
    toast("Could not load reference data", "error");
  }

  const isEdit = !!existing;
  const d = existing || {};

  // Determine if saved Hours value is a preset or custom
  const presetValues = HOUR_OPTIONS.map(h => h.value);
  const savedHours = d.Hours || "hourly";
  const isCustomHours = savedHours && !presetValues.includes(savedHours);

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? "✏️ Edit Record" : "➕ New Client Entry"}</div>
        <button class="modal-close">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">

          <div class="form-group">
            <label>Date</label>
            <input type="date" id="mf-date" value="${d.Date || getTodayDate()}" />
          </div>

          <div class="form-group">
            <label>Client Name</label>
            <div class="autocomplete-wrap">
              <input type="text" id="mf-client" placeholder="Type name..." value="${d.ClientName || ''}" autocomplete="off" />
              <div class="autocomplete-list" id="mf-ac-list" style="display:none"></div>
            </div>
          </div>

          <div class="form-group">
            <label>Time In</label>
            <input type="time" id="mf-timein" value="${d.TimeIn || getCurrentTime()}" />
          </div>

          <div class="form-group">
            <label>Time Out</label>
            <input type="time" id="mf-timeout" value="${d.TimeOut || ''}" />
          </div>

          <div class="form-group">
            <label>Service</label>
            <select id="mf-service">
              <option value="">— Select Service —</option>
              ${services.map(s => `<option value="${s.Name}" ${d.Service === s.Name ? 'selected' : ''}>${s.Name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Hours</label>
            <div style="display:flex;gap:8px;align-items:center">
              <select id="mf-hours-select" style="flex:1">
                ${HOUR_OPTIONS.map(h => `<option value="${h.value}" ${(!isCustomHours && savedHours === h.value) ? 'selected' : ''}>${h.label}</option>`).join('')}
                <option value="custom" ${isCustomHours ? 'selected' : ''}>✏️ Custom...</option>
              </select>
              <input
                type="number"
                id="mf-hours-custom"
                min="1" max="24"
                placeholder="hrs"
                value="${isCustomHours ? savedHours : ''}"
                style="width:70px;display:${isCustomHours ? 'block' : 'none'}"
              />
              <span style="font-size:0.72rem;color:var(--gray-500);white-space:nowrap" id="mf-hours-hint"></span>
            </div>
            <div style="font-size:0.7rem;color:var(--gray-400);margin-top:3px">Auto-filled from Time In/Out · Select <em>Custom</em> to type any value</div>
          </div>

          <div class="form-group">
            <label>Client Type</label>
            <select id="mf-clienttype">
              <option value="">— Select Type —</option>
              ${clientTypes.map(c => `<option value="${c.Name}" ${d.ClientType === c.Name ? 'selected' : ''}>${c.Name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Billing Type</label>
            <select id="mf-billingtype">
              <option value="">— Select Billing —</option>
              ${billingTypes.map(b => `<option value="${b.Name}" ${d.BillingType === b.Name ? 'selected' : ''}>${b.Name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Bill (Auto-calculated)</label>
            <input type="number" id="mf-bill" placeholder="0.00" value="${d.Bill || ''}" />
          </div>

          <div class="form-group">
            <label>Payment Method</label>
            <select id="mf-payment">
              <option value="">— Select —</option>
              ${PAYMENT_METHODS.map(p => `<option value="${p}" ${d.PaymentMethod === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>First Time?</label>
            <select id="mf-firsttime">
            <option value="false" ${d.FirstTime === "false" ? "selected" : ""}>No</option>
            <option value="true" ${d.FirstTime === "true" ? "selected" : ""}>Yes</option>
          </select>
          </div>

          <div class="form-group">
            <label>Amount Paid</label>
            <input type="number" id="mf-amountpaid" placeholder="0.00" value="${d.AmountPaid || ''}" />
          </div>

          <div class="form-group full">
            <label>Notes</label>
            <textarea id="mf-notes" rows="2">${d.Notes || ''}</textarea>
          </div>

        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="mf-cancel">Cancel</button>
        <button class="btn btn-primary" id="mf-save">💾 Save Record</button>
      </div>
    </div>
  `;

  app.appendChild(overlay);

  const hoursSelect = overlay.querySelector("#mf-hours-select");
  const hoursCustom = overlay.querySelector("#mf-hours-custom");
  const hoursHint   = overlay.querySelector("#mf-hours-hint");

  // Show/hide custom input when "Custom..." is selected
  hoursSelect.addEventListener("change", () => {
    if (hoursSelect.value === "custom") {
      hoursCustom.style.display = "block";
      hoursCustom.focus();
    } else {
      hoursCustom.style.display = "none";
      hoursCustom.value = "";
    }
    recalcBill();
  });

  // ─── AUTOCOMPLETE ────────────────────────────────────────────────
  const clientInput = overlay.querySelector("#mf-client");
  const acList = overlay.querySelector("#mf-ac-list");
  let acTimeout;
  clientInput.addEventListener("input", () => {
    clearTimeout(acTimeout);
    const val = clientInput.value.trim();
    if (val.length < 1) { acList.style.display = "none"; return; }
    acTimeout = setTimeout(async () => {
      const results = await searchClientNames(val);
      if (!results.length) { acList.style.display = "none"; return; }
      acList.innerHTML = results.map(r => `<div class="autocomplete-item" data-name="${r.ClientName}" data-type="${r.ClientType || ''}">${r.ClientName}<span class="type-tag">${r.ClientType || ''}</span></div>`).join('');
      acList.style.display = "block";
      acList.querySelectorAll(".autocomplete-item").forEach(item => {
        item.addEventListener("click", () => {
          clientInput.value = item.dataset.name;
          const ct = item.dataset.type;
          if (ct) {
            const sel = overlay.querySelector("#mf-clienttype");
            const opt = [...sel.options].find(o => o.value === ct);
            if (opt) sel.value = ct;
          }
          acList.style.display = "none";
          recalcBill();
        });
      });
    }, 220);
  });
  document.addEventListener("click", () => { acList.style.display = "none"; });

  // ─── GET CURRENT HOURS VALUE ──────────────────────────────────────
  function getHoursValue() {
    if (hoursSelect.value === "custom") {
      return hoursCustom.value.trim() || "";
    }
    return hoursSelect.value;
  }

  // ─── AUTO-CALCULATE BILL ─────────────────────────────────────────
  function recalcBill() {
    const ctVal = overlay.querySelector("#mf-clienttype").value;
    const hoursVal = getHoursValue();
    // Only auto-calc for preset tiers
    if (presetValues.includes(hoursVal)) {
      const bill = calculateBill(ctVal, hoursVal);
      if (bill > 0) overlay.querySelector("#mf-bill").value = bill;
    }
  }

  // Auto-suggest hours from time in/out
  function updateHoursFromTime() {
    const ti = overlay.querySelector("#mf-timein").value;
    const to = overlay.querySelector("#mf-timeout").value;
    if (ti && to) {
      const computed = computeHours(ti, to);
      if (computed) {
        const tier = mapHoursToBillingTier(computed);
        hoursSelect.value = tier;
        hoursCustom.style.display = "none";
        hoursHint.textContent = `(${computed}h actual)`;
        recalcBill();
      }
    }
  }

  overlay.querySelector("#mf-timein").addEventListener("change", updateHoursFromTime);
  overlay.querySelector("#mf-timeout").addEventListener("change", updateHoursFromTime);
  overlay.querySelector("#mf-clienttype").addEventListener("change", recalcBill);
  hoursCustom.addEventListener("input", recalcBill);

  if (isEdit) recalcBill();

  // ─── CLOSE ───────────────────────────────────────────────────────
  overlay.querySelector(".modal-close").addEventListener("click", () => overlay.remove());
  overlay.querySelector("#mf-cancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

  // ─── SAVE ────────────────────────────────────────────────────────
  overlay.querySelector("#mf-save").addEventListener("click", async () => {
    const btn = overlay.querySelector("#mf-save");
    btn.disabled = true; btn.textContent = "Saving...";

    const hoursVal = getHoursValue();

    const payload = {
      Date: overlay.querySelector("#mf-date").value,
      ClientName: overlay.querySelector("#mf-client").value.trim(),
      TimeIn: overlay.querySelector("#mf-timein").value,
      TimeOut: overlay.querySelector("#mf-timeout").value,
      Service: overlay.querySelector("#mf-service").value,
      Hours: hoursVal,
      ClientType: overlay.querySelector("#mf-clienttype").value,
      BillingType: overlay.querySelector("#mf-billingtype").value,
      Bill: parseFloat(overlay.querySelector("#mf-bill").value) || 0,
      PaymentMethod: overlay.querySelector("#mf-payment").value,
      FirstTime: overlay.querySelector("#mf-firsttime").value,
      AmountPaid: parseFloat(overlay.querySelector("#mf-amountpaid").value) || 0,
      Notes: overlay.querySelector("#mf-notes").value.trim(),
    };

    if (!payload.ClientName) { toast("Client name is required", "error"); btn.disabled = false; btn.textContent = "💾 Save Record"; return; }
    if (!payload.Hours) { toast("Please set the hours", "error"); btn.disabled = false; btn.textContent = "💾 Save Record"; return; }

    try {
      if (isEdit) {
        await updateMonitoringRecord(existing.$id, payload);
        toast("Record updated!", "success");
      } else {
        await createMonitoringRecord(payload);
        toast("Record saved!", "success");
      }
      overlay.remove();
      onSaved();
    } catch (e) {
      toast("Error saving: " + e.message, "error");
      btn.disabled = false; btn.textContent = "💾 Save Record";
    }

    const firstTime = document.getElementById("mf-firsttime").value === "true";
  });
}

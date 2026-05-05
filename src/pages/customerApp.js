import { searchClientNames, getClientTypes } from "../lib/api.js";
import { calculateBill, RATES, HOUR_OPTIONS, formatCurrency, getTodayDate } from "../lib/billing.js";

export function renderCustomerApp(app, onSwitchRole) {
  app.innerHTML = `
    <div class="customer-screen">
      <div class="customer-card">
        <div class="customer-header">
          <div class="customer-logo">rSpace</div>
          <div class="customer-tagline">Co-working Space · Rate Checker</div>
        </div>
        <div class="customer-body">
          <div class="form-group" style="margin-bottom:16px">
            <label>Your Name</label>
            <div class="autocomplete-wrap">
              <input type="text" id="cust-name" placeholder="Start typing your name..." autocomplete="off" />
              <div class="autocomplete-list" id="cust-ac" style="display:none"></div>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:16px">
            <label>Date</label>
            <input type="date" id="cust-date" value="${getTodayDate()}" readonly />
          </div>

          <div id="cust-result" style="display:none"></div>

          <div style="margin-top:20px;text-align:center">
            <button style="
              background:none;border:none;cursor:pointer;
              font-size:0.72rem;color:var(--gray-400);
              text-decoration:underline
            " id="cust-switch">Switch to Admin View</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const nameInput = app.querySelector("#cust-name");
  const acList = app.querySelector("#cust-ac");
  const result = app.querySelector("#cust-result");

  let selectedClientType = null;
  let acTimeout;

  nameInput.addEventListener("input", () => {
    clearTimeout(acTimeout);
    const val = nameInput.value.trim();
    result.style.display = "none";
    selectedClientType = null;

    if (val.length < 1) { acList.style.display = "none"; return; }

    acTimeout = setTimeout(async () => {
      const clients = await searchClientNames(val);
      if (!clients.length) { acList.style.display = "none"; return; }
      acList.innerHTML = clients.map(c => `
        <div class="autocomplete-item" data-name="${c.ClientName}" data-type="${c.ClientType || ''}">
          ${c.ClientName}
          <span class="type-tag">${c.ClientType || 'Unknown type'}</span>
        </div>
      `).join('');
      acList.style.display = "block";

      acList.querySelectorAll(".autocomplete-item").forEach(item => {
        item.addEventListener("click", () => {
          nameInput.value = item.dataset.name;
          selectedClientType = item.dataset.type;
          acList.style.display = "none";
          showRates(selectedClientType, result);
        });
      });
    }, 200);
  });

  // Also allow manual type — if no match, show generic rates
  nameInput.addEventListener("blur", () => {
    setTimeout(() => { acList.style.display = "none"; }, 200);
  });

  app.querySelector("#cust-switch").addEventListener("click", onSwitchRole);
}

async function showRates(clientTypeStr, resultEl) {
  const isStudent = clientTypeStr?.toLowerCase() === "student";
  const rates = isStudent ? RATES.student : RATES.regular;
  const typeLabel = clientTypeStr || "Regular";

  resultEl.style.display = "block";
  resultEl.innerHTML = `
    <div class="customer-result">
      <div class="type-display">${typeLabel} Member</div>
      <div style="font-size:0.8rem;color:var(--gray-500);margin-bottom:12px">Available Rates</div>
      <div class="rate-breakdown">
        <div class="rate-item">
          <div class="ri-label">1 Hour</div>
          <div class="ri-value">${formatCurrency(rates.hourly)}</div>
        </div>
        <div class="rate-item">
          <div class="ri-label">4 Hours</div>
          <div class="ri-value">${formatCurrency(rates["4hours"])}</div>
        </div>
        <div class="rate-item">
          <div class="ri-label">8 Hours</div>
          <div class="ri-value">${formatCurrency(rates["8hours"])}</div>
        </div>
        <div class="rate-item">
          <div class="ri-label">12 Hours</div>
          <div class="ri-value">${formatCurrency(rates["12hours"])}</div>
        </div>
      </div>
      <div style="margin-top:16px;font-size:0.72rem;color:var(--gray-400)">
        * Rates apply to ${typeLabel.toLowerCase()} accounts<br/>
        * Exceeding 20 minutes counts as the next hour
      </div>
    </div>
  `;
}

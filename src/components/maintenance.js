import {
  getServices, createService, updateService, deleteService,
  getClientTypes, createClientType, updateClientType, deleteClientType,
  getBillingTypes, createBillingType, updateBillingType, deleteBillingType,
} from "../lib/api.js";
import { toast } from "./toast.js";

export async function renderMaintenance(container) {
  container.innerHTML = `
    <div class="maint-grid" id="maint-grid">
      <div style="text-align:center;padding:40px;color:var(--gray-300)">Loading...</div>
    </div>
  `;
  await loadAll(container.querySelector("#maint-grid"));
}

async function loadAll(grid) {
  try {
    const [services, clientTypes, billingTypes] = await Promise.all([
      getServices().then(r => r.documents),
      getClientTypes().then(r => r.documents),
      getBillingTypes().then(r => r.documents),
    ]);
    grid.innerHTML = `
      ${buildTable("Services", "tblServices", services, "service")}
      ${buildTable("Client Types", "tblClientTypes", clientTypes, "clienttype")}
      ${buildTable("Billing Types", "tblBillingTypes", billingTypes, "billingtype")}
    `;
    bindEvents(grid, () => loadAll(grid));
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--danger)">Error loading: ${e.message}</p>`;
  }
}

function buildTable(title, tableName, items, key) {
  return `
    <div class="maint-card">
      <div class="maint-card-header">
        <span>${title}</span>
        <span style="font-size:0.68rem;opacity:0.6;font-weight:400">${tableName}</span>
      </div>
      <ul class="maint-list" data-key="${key}">
        ${items.length ? items.map(item => `
          <li class="maint-item" data-id="${item.$id}">
            <span class="maint-item-name" id="name-${item.$id}">${item.Name}</span>
            <span style="display:flex;gap:6px">
              <button class="btn btn-sm btn-ghost edit-btn" data-key="${key}" data-id="${item.$id}" data-name="${item.Name}">✏️</button>
              <button class="btn btn-sm btn-danger del-btn" data-key="${key}" data-id="${item.$id}">🗑️</button>
            </span>
          </li>
        `).join('') : `<li class="maint-item" style="color:var(--gray-300);justify-content:center">No items yet</li>`}
      </ul>
      <div class="maint-add-row">
        <input type="text" class="add-input" data-key="${key}" placeholder="Add new ${title.slice(0,-1).toLowerCase()}..." />
        <button class="btn btn-primary btn-sm add-btn" data-key="${key}">Add</button>
      </div>
    </div>
  `;
}

function bindEvents(grid, refresh) {
  // ADD
  grid.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.key;
      const input = grid.querySelector(`.add-input[data-key="${key}"]`);
      const name = input.value.trim();
      if (!name) return;
      btn.disabled = true;
      try {
        await getCreateFn(key)(name);
        toast("Added!", "success");
        input.value = "";
        refresh();
      } catch (e) { toast("Error: " + e.message, "error"); btn.disabled = false; }
    });
    // Enter key on input
    const input = grid.querySelector(`.add-input[data-key="${btn.dataset.key}"]`);
    input?.addEventListener("keydown", e => { if (e.key === "Enter") btn.click(); });
  });

  // EDIT
  grid.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const { key, id, name } = btn.dataset;
      const newName = prompt("Edit name:", name);
      if (!newName || newName.trim() === name) return;
      try {
        await getUpdateFn(key)(id, newName.trim());
        toast("Updated!", "success");
        refresh();
      } catch (e) { toast("Error: " + e.message, "error"); }
    });
  });

  // DELETE
  grid.querySelectorAll(".del-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const { key, id } = btn.dataset;
      if (!confirm("Delete this item?")) return;
      try {
        await getDeleteFn(key)(id);
        toast("Deleted!", "success");
        refresh();
      } catch (e) { toast("Error: " + e.message, "error"); }
    });
  });
}

function getCreateFn(key) {
  return { service: createService, clienttype: createClientType, billingtype: createBillingType }[key];
}
function getUpdateFn(key) {
  return { service: updateService, clienttype: updateClientType, billingtype: updateBillingType }[key];
}
function getDeleteFn(key) {
  return { service: deleteService, clienttype: deleteClientType, billingtype: deleteBillingType }[key];
}

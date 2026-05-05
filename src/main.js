import { pingAppwrite } from "./lib/appwrite.js";
import { renderRoleSelector } from "./pages/roleSelector.js";
import { renderAdminApp } from "./pages/adminApp.js";
import { renderCustomerApp } from "./pages/customerApp.js";
import { initToasts } from "./components/toast.js";

// ─── BOOT ─────────────────────────────────────────────────────────────────
async function boot() {
  initToasts();

  // Ping Appwrite on load (as required)
  pingAppwrite();

  const app = document.getElementById("app");

  // Hide boot screen after brief moment
  await delay(800);
  const boot = document.querySelector(".boot-screen");
  if (boot) { boot.style.opacity = "0"; await delay(500); boot.remove(); }

  startApp(app);
}

function startApp(app) {
  renderRoleSelector(app, (role) => {
    if (role === "admin") renderAdminApp(app, () => startApp(app));
    else renderCustomerApp(app, () => startApp(app));
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

boot();

let container;

export function initToasts() {
  container = document.createElement("div");
  container.className = "toast-container";
  document.body.appendChild(container);
}

export function toast(message, type = "info", duration = 3000) {
  if (!container) return;
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity 0.3s"; setTimeout(() => t.remove(), 300); }, duration);
}

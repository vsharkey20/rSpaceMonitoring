export function renderRoleSelector(app, onSelect) {
  app.innerHTML = `
    <div class="role-screen">
      <div class="role-card">
        <div class="role-logo"><span class="r">r</span><span class="s">Space</span></div>
        <div class="role-tagline">Co-working Client Tracker</div>
        <div class="role-title">Who are you?</div>
        <div class="role-buttons">
          <button class="role-btn admin" data-role="admin">
            <span class="role-icon">🛠️</span>
            Admin
          </button>
          <button class="role-btn customer" data-role="customer">
            <span class="role-icon">👤</span>
            Customer
          </button>
        </div>
        <div id="pwd-area" style="display:none;margin-top:24px">
          <div style="position:relative">
            <input
              type="password"
              id="admin-pwd"
              placeholder="Enter admin password..."
              style="width:100%;padding:10px 40px 10px 12px;border-radius:6px;border:2px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;font-size:0.9rem;outline:none;font-family:inherit"
            />
            <span id="pwd-toggle" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:1rem;user-select:none">👁️</span>
          </div>
          <div id="pwd-error" style="color:#ff5252;font-size:0.75rem;margin-top:6px;display:none">❌ Incorrect password. Try again.</div>
          <button id="pwd-confirm" style="
            margin-top:12px;width:100%;padding:11px;
            background:var(--yellow);color:var(--black);
            border:none;border-radius:6px;
            font-family:var(--font-display);font-weight:700;font-size:0.9rem;
            cursor:pointer;transition:background 0.15s
          ">Confirm →</button>
        </div>
      </div>
    </div>
  `;

  const pwdArea = app.querySelector("#pwd-area");
  const pwdInput = app.querySelector("#admin-pwd");
  const pwdError = app.querySelector("#pwd-error");
  const pwdConfirm = app.querySelector("#pwd-confirm");
  const pwdToggle = app.querySelector("#pwd-toggle");

  app.querySelectorAll(".role-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.role === "customer") {
        onSelect("customer");
        return;
      }
      // Admin — show password field
      app.querySelectorAll(".role-btn").forEach(b => b.style.opacity = "0.5");
      btn.style.opacity = "1";
      pwdArea.style.display = "block";
      pwdInput.focus();
    });
  });

  // Toggle password visibility
  pwdToggle.addEventListener("click", () => {
    const isHidden = pwdInput.type === "password";
    pwdInput.type = isHidden ? "text" : "password";
    pwdToggle.textContent = isHidden ? "🙈" : "👁️";
  });

  function tryLogin() {
    if (pwdInput.value === "rSpace@2024") {
      pwdError.style.display = "none";
      onSelect("admin");
    } else {
      pwdError.style.display = "block";
      pwdInput.value = "";
      pwdInput.focus();
      pwdInput.style.borderColor = "#ff5252";
      setTimeout(() => { pwdInput.style.borderColor = "rgba(255,255,255,0.15)"; }, 1500);
    }
  }

  pwdConfirm.addEventListener("click", tryLogin);
  pwdInput.addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
}

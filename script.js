// ===== LOGIN =====
  function handleLogin() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    const err = document.getElementById('login-error');
    if (u === 'admin' && p === 'admin123') {
      err.style.display = 'none';
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('main-page').style.display = 'block';
      loadAllIssues();
    } else {
      err.style.display = 'block';
    }
  }

  // Allow Enter key on login
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('login-page').style.display !== 'none') {
      handleLogin();
    }
  });

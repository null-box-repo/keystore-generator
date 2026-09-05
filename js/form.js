// .. form handling and UI updates
import { generateKeyStore, escapeHtml } from './api.js';

const form = document.querySelector('#keystore-form');
const output = document.querySelector('#output-area');
const btn = document.querySelector('#generate-btn');
const dialog = document.querySelector('#error-dialog');
const errorMsg = document.querySelector('#error-msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  btn.disabled = true;
  btn.textContent = 'Generating...';
  output.innerHTML = '';

  const data = Object.fromEntries(new FormData(form));

  try {
    const result = await generateKeyStore(data);

    if (result.success) {
      output.innerHTML = `
        <div class="ks-result ks-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <strong>KeyStore created successfully</strong>
          <span>File: <code>${escapeHtml(result.file)}</code></span>
          <span>Password: <code>${escapeHtml(result.password)}</code></span>
        </div>`;
    } else {
      output.innerHTML = `
        <div class="ks-result ks-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <strong>Generation failed</strong>
          <pre>${escapeHtml(result.output)}</pre>
        </div>`;
    }
  } catch (err) {
    errorMsg.textContent = err.message;
    dialog.showModal();
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Generate KeyStore`;
  }
});

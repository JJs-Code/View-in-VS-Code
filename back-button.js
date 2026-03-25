/**
 * Injects the "Back to GitHub" button only after the window has fully loaded.
 */
window.onload = () => {
  // Prevents duplicate buttons if the script runs twice
  if (document.getElementById('github-back-button')) return;

  const btn = document.createElement('button');
  btn.id = 'github-back-button';
  btn.innerText = '← Back to GitHub';

  btn.onclick = () => {
    chrome.runtime.sendMessage({ action: "goBackToGithub" });
  };

  document.body.appendChild(btn);
};
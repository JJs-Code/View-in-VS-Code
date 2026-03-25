/*checks browser theme and sets GitHub Light/Dark icon appropriately*/
const notifyTheme = () => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  chrome.runtime.sendMessage({ theme: isDark ? 'dark' : 'light' });
};
notifyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', notifyTheme);
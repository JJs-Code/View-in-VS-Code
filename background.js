/* --- CONFIGURATION --- */
const MENU_ID = "viewInVSCode";
let currentTheme = 'light';

/* --- CORE TOGGLE LOGIC --- */


async function toggleView(tab) {
  if (!tab?.url) return;

  //GitHub --> VS Code
  if (tab.url.includes("github.com")) {
    chrome.tabs.create({ url: tab.url.replace("github.com", "github.dev") });
  } 
  //VS Code --> GitHub
  else if (tab.url.includes("github.dev")) {
    const targetUrl = tab.url.replace("github.dev", "github.com");
    const existing = await chrome.tabs.query({ url: targetUrl });

    //If existing GitHub tab exists switch to that and close current tab
    if (existing.length > 0) {
      chrome.tabs.update(existing[0].id, { active: true });
      chrome.tabs.remove(tab.id);
    // If no existing tab found just redirects current tab
    } else {
      chrome.tabs.update(tab.id, { url: targetUrl });
    }
  }
}

/* --- UI & STATE MANAGEMENT --- */

/* Updates the extension icon, enabled state, and tooltip based on the URL */
function updateState(tab) {
  if (!tab?.url) return;

  const isGitHubCom = tab.url.includes("github.com");
  const isGitHubDev = tab.url.includes("github.dev");

  // Enable extension on GitHub pages and set appropriate icon
  if (isGitHubCom || isGitHubDev) {
    chrome.action.enable(tab.id);
    chrome.action.setTitle({ tabId: tab.id, title: "View in VS Code" });
    updateToolbarIcon(tab);
  // Gray out extension on other webpages and set "Not Supported" message
  } else {
    chrome.action.disable(tab.id);
    chrome.action.setTitle({ 
      tabId: tab.id, 
      title: "Go to GitHub to use this extension" 
    });
    
    // Set default icon (Browser will apply a grayscale filter since it is disabled)
    chrome.action.setIcon({
      tabId: tab.id,
      path: {
        "16": "icons/VS Code 16x16.png",
        "32": "icons/VS Code 32x32.png"
      }
    });
  }
}

/* Specifically handles the logic for which icon to show (GitHub vs VS Code) */
function updateToolbarIcon(tab) {
  const isDev = tab.url.includes("github.dev");
  const themeSuffix = currentTheme === 'dark' ? " Dark" : " Light";
  
  // Show GitHub (Light/Dark) on .dev | Show VS Code on .com
  const iconBase = isDev ? `GitHub${themeSuffix}` : "VS Code";

  chrome.action.setIcon({
    tabId: tab.id,
    path: {
      "16": `icons/${iconBase} 16x16.png`,
      "32": `icons/${iconBase} 32x32.png`
    }
  });
}

/* --- LISTENERS --- */

// Listen for messages from Content Scripts (Theme and Injected Button)
chrome.runtime.onMessage.addListener((request, sender) => {
  // Update local theme state from theme-detector.js
  if (request.theme) {
    currentTheme = request.theme;
    if (sender.tab) updateToolbarIcon(sender.tab);
  }
  // Handle "Back" button from back-button.js
  if (request.action === "goBackToGithub") {
    toggleView(sender.tab);
  }
});

// Toolbar Icon Click
chrome.action.onClicked.addListener((tab) => toggleView(tab));

// Tab Updates (URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateState(tab);
  }
});

// Tab Switches (User clicks a different tab)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateState(tab);
  });
});

// Right-Click Context Menu Selection
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID) toggleView(tab);
});


/* --- ON INSTALL --- */

chrome.runtime.onInstalled.addListener(() => {
  // Clean start for context menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id:                  MENU_ID,
      title:               "View in VS Code",
      contexts:            ["page"],
      // Chrome automatically handles visibility based on this pattern
      documentUrlPatterns: ["https://github.com/*"]
    });
  });
});
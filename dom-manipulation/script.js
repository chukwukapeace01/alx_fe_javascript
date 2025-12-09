// Storage keys
const LOCAL_STORAGE_KEY = "dynamicQuoteGeneratorQuotes";
const FILTER_STORAGE_KEY = "selectedCategoryFilter";

// Fake server endpoint (mock API)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Default quotes
const defaultQuotes = [
  { text: "The future depends on what you do today.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" }
];

let quotes = [];

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const addQuoteButton = document.getElementById("addQuoteButton");
const newQuoteTextInput = document.getElementById("newQuoteText");
const newQuoteCategoryInput = document.getElementById("newQuoteCategory");
const newQuoteBtn = document.getElementById("newQuote");
const syncButton = document.getElementById("syncButton");
const syncStatus = document.getElementById("syncStatus");
const notification = document.getElementById("notification");

// ----------------- Notification helpers -----------------

function showNotification(message, isError = false) {
  if (!notification) return;
  notification.textContent = message;
  notification.style.color = isError ? "red" : "blue";
  notification.style.padding = "6px 8px";
  notification.style.border = "1px solid #ccc";
}

// ----------------- Local storage helpers -----------------

function saveQuotes() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    quotes = [...defaultQuotes];
    saveQuotes();
  } else {
    try {
      const parsed = JSON.parse(saved);
      quotes = Array.isArray(parsed) ? parsed : [...defaultQuotes];
    } catch (e) {
      quotes = [...defaultQuotes];
      saveQuotes();
    }
  }
}

// ----------------- Category handling -----------------

function populateCategories() {
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function restoreFilter() {
  const saved = localStorage.getItem(FILTER_STORAGE_KEY);
  const categories = [...new Set(quotes.map(q => q.category))];

  if (saved && (saved === "all" || categories.includes(saved))) {
    categoryFilter.value = saved;
  } else {
    categoryFilter.value = "all";
  }
}

// ----------------- Filter + display quote -----------------

function filterQuote() {
  const selected = categoryFilter.value;

  // remember selection
  localStorage.setItem(FILTER_STORAGE_KEY, selected);

  let filtered =
    selected === "all"
      ? quotes
      : quotes.filter(q => q.category === selected);

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];

  quoteDisplay.innerHTML = `"${quote.text}" — <strong>${quote.category}</strong>`;
}

// ----------------- Add new quote -----------------

async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
  } catch (e) {
    // ignore errors for mock
  }
}

function addQuote() {
  const text = newQuoteTextInput.value.trim();
  const category = newQuoteCategoryInput.value.trim();

  if (!text || !category) {
    alert("Enter both quote and category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  categoryFilter.value = category;
  localStorage.setItem(FILTER_STORAGE_KEY, category);
  filterQuote();

  postQuoteToServer(newQuote);

  newQuoteTextInput.value = "";
  newQuoteCategoryInput.value = "";

  showNotification("New quote added locally and sent to server.");
}

// ----------------- Server sync + conflicts -----------------

function showSyncStatus(message, isError = false) {
  syncStatus.textContent = message;
  syncStatus.style.color = isError ? "red" : "green";
}

// REQUIRED NAME: fetchQuotesFromServer
async function fetchQuotesFromServer() {
  try {
    const res = await fetch(SERVER_URL);
    const data = await res.json();

    const serverQuotes = data.slice(0, 10).map(post => ({
      text: post.title,
      category: "Server-" + post.userId
    }));

    return serverQuotes;
  } catch (e) {
    showSyncStatus("Failed to fetch from server.", true);
    showNotification("Error fetching data from server.", true);
    return [];
  }
}

// merge local + server, server wins on conflict
function mergeQuotes(localQuotes, serverQuotes) {
  const merged = [...localQuotes];
  let conflicts = 0;

  serverQuotes.forEach(sq => {
    const index = merged.findIndex(lq => lq.text === sq.text);
    if (index === -1) {
      merged.push(sq);
    } else {
      if (merged[index].category !== sq.category) {
        conflicts++;
      }
      merged[index] = sq;
    }
  });

  return { merged, conflicts };
}

// REQUIRED NAME: syncQuotes
async function syncQuotes(manual = false) {
  showSyncStatus("Syncing with server...");
  showNotification("Sync in progress...");

  const serverQuotes = await fetchQuotesFromServer();
  if (serverQuotes.length === 0) {
    showSyncStatus("No server updates.");
    showNotification("No new data from server.");
    return;
  }

  const { merged, conflicts } = mergeQuotes(quotes, serverQuotes);

  if (conflicts > 0 && manual) {
    const useServer = confirm(
      `${conflicts} conflicts found.\nOK = use server data\nCancel = keep local data`
    );
    if (!useServer) {
      showSyncStatus("Sync canceled. Kept local data.");
      showNotification("Conflicts detected. You chose to keep local data.");
      return;
    }
  }

  quotes = merged;
  saveQuotes();
  populateCategories();
  restoreFilter();
  filterQuote();

  if (conflicts > 0) {
    showSyncStatus(
      `Sync complete. ${conflicts} conflicts resolved (server version used).`
    );
    showNotification(
      `${conflicts} conflicts resolved using server data.`
    );
    alert(`${conflicts} conflicts were resolved using server data.`);
  } else {
    showSyncStatus("Sync complete. No conflicts.");
    showNotification("Data synced with server. No conflicts detected.");
  }
}

// ----------------- Setup -----------------

document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategories();
  restoreFilter();
  filterQuote();

  addQuoteButton.addEventListener("click", addQuote);
  categoryFilter.addEventListener("change", filterQuote);
  newQuoteBtn.addEventListener("click", filterQuote);

  if (syncButton) {
    syncButton.addEventListener("click", () => syncQuotes(true));
  }

  setInterval(() => {
    syncQuotes(false);
  }, 60000);
});


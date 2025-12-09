// Storage keys
const LOCAL_STORAGE_KEY = "dynamicQuoteGeneratorQuotes";
const FILTER_STORAGE_KEY = "selectedCategoryFilter";

// Fake server endpoint (JSONPlaceholder)
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
    } catch {
      quotes = [...defaultQuotes];
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

// ----------------- Quote display + filter -----------------

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

// ----------------- Add quote -----------------

function addQuote() {
  const text = newQuoteTextInput.value.trim();
  const category = newQuoteCategoryInput.value.trim();

  if (!text || !category) {
    alert("Enter both quote and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  categoryFilter.value = category;
  localStorage.setItem(FILTER_STORAGE_KEY, category);
  filterQuote();

  newQuoteTextInput.value = "";
  newQuoteCategoryInput.value = "";
}

// ----------------- Server sync helpers -----------------

function showSyncStatus(message, isError = false) {
  syncStatus.textContent = message;
  syncStatus.style.color = isError ? "red" : "green";
}

// Fetch quotes from the "server"
async function fetchServerQuotes() {
  try {
    const res = await fetch(SERVER_URL);
    const data = await res.json();

    // Use first 10 posts and map them to quotes
    const serverQuotes = data.slice(0, 10).map(post => ({
      text: post.title,
      // group by userId as fake category
      category: "Server-" + post.userId
    }));

    return serverQuotes;
  } catch (err) {
    showSyncStatus("Failed to fetch from server.", true);
    return [];
  }
}

// Merge local + server quotes.
// If same text appears with different category, server wins.
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
      // server takes precedence
      merged[index] = sq;
    }
  });

  return { merged, conflicts };
}

// Sync with server. If manual = true, give user choice on conflicts.
async function syncQuotesWithServer(manual = false) {
  showSyncStatus("Syncing with server...");

  const serverQuotes = await fetchServerQuotes();
  if (serverQuotes.length === 0) {
    showSyncStatus("No server updates.");
    return;
  }

  const { merged, conflicts } = mergeQuotes(quotes, serverQuotes);

  if (conflicts > 0 && manual) {
    const useServer = confirm(
      `${conflicts} conflicts found.\nOK = keep server changes\nCancel = keep your local quotes`
    );
    if (!useServer) {
      showSyncStatus("Sync canceled. Kept local quotes.");
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
  } else {
    showSyncStatus("Sync complete. No conflicts.");
  }
}

// ----------------- Setup -----------------

document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategories();
  restoreFilter();
  filterQuote();

  addQuoteButton.addEventListener("click", addQuote);
  newQuoteBtn.addEventListener("click", filterQuote);
  categoryFilter.addEventListener("change", filterQuote);
  syncButton.addEventListener("click", () => syncQuotesWithServer(true));

  // Periodic auto sync every 60 seconds (server wins silently)
  setInterval(() => {
    syncQuotesWithServer(false);
  }, 60000);
});


// Keys for web storage
const LOCAL_STORAGE_KEY = "dynamicQuoteGeneratorQuotes";
const FILTER_STORAGE_KEY = "selectedCategoryFilter";

// Default quotes
const defaultQuotes = [
  { text: "The future depends on what you do today.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" }
];

let quotes = [];

const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");

// ---------- LOAD + SAVE ----------
function saveQuotes() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  quotes = saved ? JSON.parse(saved) : [...defaultQuotes];
}

// ---------- CATEGORY POPULATION ----------
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

// ---------- FILTER FUNCTION (REQUIRED NAME) ----------
function filterQuote() {
  const selected = categoryFilter.value;

  // Save selected category
  localStorage.setItem(FILTER_STORAGE_KEY, selected);

  // Filter quotes
  let filtered = selected === "all"
      ? quotes
      : quotes.filter(q => q.category === selected);

  // Show one quote
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];

  quoteDisplay.innerHTML = `"${quote.text}" — <strong>${quote.category}</strong>`;
}

// ---------- RESTORE SAVED FILTER ----------
function restoreFilter() {
  const saved = localStorage.getItem(FILTER_STORAGE_KEY);

  if (saved) {
    categoryFilter.value = saved;
  } else {
    categoryFilter.value = "all";
  }
}

// ---------- ADD QUOTE ----------
document.getElementById("addQuoteButton").addEventListener("click", () => {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Enter both quote and category");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
});

// ---------- SETUP ----------
document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategories();
  restoreFilter();
  filterQuote();
});


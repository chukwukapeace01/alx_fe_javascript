// Keys for web storage
const LOCAL_STORAGE_KEY = "dynamicQuoteGeneratorQuotes";
const SESSION_LAST_QUOTE_KEY = "dynamicQuoteGeneratorLastQuote";

// Default quotes (used only on first load or if storage is empty/broken)
const defaultQuotes = [
  { text: "The future depends on what you do today.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" },
  { text: "Action is the foundational key to all success.", category: "Motivation" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" },
  { text: "The only way to learn a new programming language is by writing programs in it.", category: "Programming" }
];

// This will hold the current quotes in memory
let quotes = [];

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");

const newQuoteTextInput = document.getElementById("newQuoteText");
const newQuoteCategoryInput = document.getElementById("newQuoteCategory");
const addQuoteButton = document.getElementById("addQuoteButton");

const exportQuotesBtn = document.getElementById("exportQuotesBtn");
const importFileInput = document.getElementById("importFile");

// ----- Storage helpers -----

function saveQuotes() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    quotes = [...defaultQuotes];
    saveQuotes();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      quotes = parsed;
    } else {
      quotes = [...defaultQuotes];
      saveQuotes();
    }
  } catch (error) {
    quotes = [...defaultQuotes];
    saveQuotes();
  }
}

function saveLastQuote(quote) {
  try {
    sessionStorage.setItem(SESSION_LAST_QUOTE_KEY, JSON.stringify(quote));
  } catch (error) {
    // ignore session storage errors
  }
}

function loadLastQuoteFromSession() {
  const saved = sessionStorage.getItem(SESSION_LAST_QUOTE_KEY);
  if (!saved) return false;

  try {
    const quote = JSON.parse(saved);
    if (!quote || !quote.text || !quote.category) return false;

    // Set category dropdown if category exists
    const categories = getCategories();
    if (categories.includes(quote.category)) {
      categoryFilter.value = quote.category;
    } else {
      categoryFilter.value = "all";
    }

    quoteDisplay.innerHTML = `
      <p>"${quote.text}"</p>
      <p><strong>Category:</strong> ${quote.category}</p>
    `;

    return true;
  } catch (error) {
    return false;
  }
}

// ----- Category handling -----

function getCategories() {
  const categories = new Set();
  quotes.forEach((quote) => categories.add(quote.category));
  return Array.from(categories);
}

function populateCategoryFilter() {
  categoryFilter.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All";
  categoryFilter.appendChild(allOption);

  const categories = getCategories();
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// ----- Quote display -----

function showRandomQuote() {
  const selectedCategory = categoryFilter.value;

  let availableQuotes;
  if (selectedCategory === "all") {
    availableQuotes = quotes;
  } else {
    availableQuotes = quotes.filter(
      (quote) => quote.category === selectedCategory
    );
  }

  if (availableQuotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes in this category yet.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableQuotes.length);
  const quote = availableQuotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <p><strong>Category:</strong> ${quote.category}</p>
  `;

  // Save last viewed quote to sessionStorage
  saveLastQuote(quote);
}

// ----- Add quote -----

function addQuote() {
  const text = newQuoteTextInput.value.trim();
  const category = newQuoteCategoryInput.value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);

  // Persist to localStorage
  saveQuotes();

  // Update category dropdown
  populateCategoryFilter();

  // Select the new category
  categoryFilter.value = category;

  // Show the new quote
  quoteDisplay.innerHTML = `
    <p>"${newQuote.text}"</p>
    <p><strong>Category:</strong> ${newQuote.category}</p>
  `;

  // Save last viewed quote in session
  saveLastQuote(newQuote);

  // Clear inputs
  newQuoteTextInput.value = "";
  newQuoteCategoryInput.value = "";
}

// ----- JSON export -----

function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// ----- JSON import -----

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();

  fileReader.onload = function (loadEvent) {
    try {
      const importedQuotes = JSON.parse(loadEvent.target.result);

      if (!Array.isArray(importedQuotes)) {
        alert("Invalid JSON format. Expected an array of quotes.");
        return;
      }

      const validQuotes = importedQuotes.filter(
        (q) => q && typeof q.text === "string" && typeof q.category === "string"
      );

      if (validQuotes.length === 0) {
        alert("No valid quotes found in file.");
        return;
      }

      quotes.push(...validQuotes);

      // Persist to localStorage
      saveQuotes();

      // Refresh categories
      populateCategoryFilter();

      alert("Quotes imported successfully!");

      categoryFilter.value = "all";
      showRandomQuote();
    } catch (error) {
      alert("Error reading JSON file.");
    } finally {
      // Allow selecting same file again if needed
      importFileInput.value = "";
    }
  };

  fileReader.readAsText(file);
}

// ----- Setup -----

function createAddQuoteForm() {
  newQuoteBtn.addEventListener("click", showRandomQuote);
  addQuoteButton.addEventListener("click", addQuote);
  categoryFilter.addEventListener("change", showRandomQuote);
  exportQuotesBtn.addEventListener("click", exportToJsonFile);
  importFileInput.addEventListener("change", importFromJsonFile);
}

document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategoryFilter();
  createAddQuoteForm();

  const restored = loadLastQuoteFromSession();

  if (!restored) {
    showRandomQuote();
  }
});


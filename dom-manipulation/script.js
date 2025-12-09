// Array of quote objects: { text: "...", category: "..." }
const quotes = [
  { text: "The future depends on what you do today.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" },
  { text: "Action is the foundational key to all success.", category: "Motivation" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" },
  { text: "The only way to learn a new programming language is by writing programs in it.", category: "Programming" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");

const newQuoteTextInput = document.getElementById("newQuoteText");
const newQuoteCategoryInput = document.getElementById("newQuoteCategory");
const addQuoteButton = document.getElementById("addQuoteButton");

// Get unique categories from the quotes array
function getCategories() {
  const categories = new Set();
  quotes.forEach((quote) => categories.add(quote.category));
  return Array.from(categories);
}

// Fill the select element with categories
function populateCategoryFilter() {
  // Clear all except "All"
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

// Show a random quote (filtered by selected category if not "all")
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
}

// Add a new quote from the form inputs
function addQuote() {
  const text = newQuoteTextInput.value.trim();
  const category = newQuoteCategoryInput.value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  // Add to array
  const newQuote = { text, category };
  quotes.push(newQuote);

  // If category is new, update the dropdown
  populateCategoryFilter();

  // Optionally auto-select the new category
  categoryFilter.value = category;

  // Show the new quote
  quoteDisplay.innerHTML = `
    <p>"${newQuote.text}"</p>
    <p><strong>Category:</strong> ${newQuote.category}</p>
  `;

  // Clear inputs
  newQuoteTextInput.value = "";
  newQuoteCategoryInput.value = "";
}

// Set up event listeners and initial state
function createAddQuoteForm() {
  // Button to show a new quote
  newQuoteBtn.addEventListener("click", showRandomQuote);

  // Button to add a new quote
  addQuoteButton.addEventListener("click", addQuote);

  // When category changes, show a quote from that category
  categoryFilter.addEventListener("change", showRandomQuote);
}

document.addEventListener("DOMContentLoaded", () => {
  populateCategoryFilter();
  createAddQuoteForm();
  showRandomQuote(); // show one on load
});


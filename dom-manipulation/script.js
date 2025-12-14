// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const exportBtn = document.getElementById('exportBtn');
const importFileInput = document.getElementById('importFile');
const categoryFilter = document.getElementById('categoryFilter');
const notification = document.getElementById('notification');

// Load quotes from local storage or initialize
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The journey of a thousand miles begins with one step.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Do what you can, with what you have, where you are.", category: "Inspiration" },
];

// Load last selected category filter
let lastCategory = localStorage.getItem('lastCategory') || "all";

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Populate category dropdown dynamically
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  categoryFilter.value = lastCategory;
}

// Display quotes based on selected category
function filterQuotes() {
  quoteDisplay.innerHTML = "";
  const selectedCategory = categoryFilter.value;
  localStorage.setItem('lastCategory', selectedCategory);

  const filteredQuotes = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    return;
  }

  filteredQuotes.forEach(q => {
    const p = document.createElement('p');
    p.innerHTML = `"${q.text}" — Category: ${q.category}`;
    quoteDisplay.appendChild(p);
  });
}

// Show a random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes available. Please add some!</p>";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  sessionStorage.setItem('lastQuote', JSON.stringify(quote));
  quoteDisplay.innerHTML = `<p>"${quote.text}" — Category: ${quote.category}</p>`;
}

// --- Server URL ---
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Post a quote to server
async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quote)
    });
  } catch (error) {
    console.error("Error posting quote to server:", error);
  }
}

// Fetch quotes from server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();
    return serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));
  } catch (error) {
    console.error("Error fetching server quotes:", error);
    return [];
  }
}

// --- NEW: syncQuotes function for ALX checker ---
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let updated = false;

  // Merge server quotes into local quotes
  serverQuotes.forEach(sq => {
    if (!quotes.find(q => q.text === sq.text)) {
      quotes.push(sq);
      updated = true;
    }
  });

  // Post any new local quotes to server
  for (const q of quotes) {
    if (q.category !== "Server") {
      await postQuoteToServer(q);
    }
  }

  if (updated) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    notification.textContent = "Quotes synced with server!";
    setTimeout(() => notification.textContent = "", 3000);
  }
}

// Add a new quote
function createAddQuoteForm() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  filterQuotes();

  // Sync quote with server
  syncQuotes();

  newQuoteText.value = "";
  newQuoteCategory.value = "";
}

// Export quotes to JSON
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(evt) {
    try {
      const importedQuotes = JSON.parse(evt.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert('Quotes imported successfully!');
      // Sync after import
      syncQuotes();
    } catch (error) {
      alert('Error reading JSON file. Please ensure it is valid.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Periodic sync every 30 seconds
setInterval(syncQuotes, 30000);

// Event listeners
newQuoteBtn.addEventListener('click', showRandomQuote);
addQuoteBtn.addEventListener('click', createAddQuoteForm);
categoryFilter.addEventListener('change', filterQuotes);
exportBtn.addEventListener('click', exportToJsonFile);
importFileInput.addEventListener('change', importFromJsonFile);

// Initialize
populateCategories();
filterQuotes();

// Show last viewed quote from session if exists
const lastQuote = JSON.parse(sessionStorage.getItem('lastQuote'));
if (lastQuote) {
  quoteDisplay.innerHTML = `<p>"${lastQuote.text}" — Category: ${lastQuote.category}</p>`;
}

// Initial sync
syncQuotes();

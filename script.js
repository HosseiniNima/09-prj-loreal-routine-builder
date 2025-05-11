/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

const workerURL = "https://loral-worker.nima-hosseini.workers.dev/";

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's input from the chat form
  const userInput = e.target.elements["userInput"].value;

  // Display the user's message in the chat window
  chatWindow.innerHTML += `
    <div class="chat-message user-message">
      ${userInput}
    </div>
  `;

  // Clear the input field
  e.target.elements["userInput"].value = "";

  // Show a loading message while waiting for the API response
  chatWindow.innerHTML += `
    <div class="chat-message bot-message">
      Thinking...
    </div>
  `;

  try {
    // Make a POST request to the workerURL
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o", // Specify the OpenAI model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userInput },
        ],
      }),
    });

    // Parse the JSON response
    const data = await response.json();

    // Display the assistant's response in the chat window
    chatWindow.innerHTML += `
      <div class="chat-message bot-message">
        ${data.choices[0].message.content}
      </div>
    `;
  } catch (error) {
    // Handle errors (e.g., network issues or API errors)
    chatWindow.innerHTML += `
      <div class="chat-message bot-message">
        Sorry, something went wrong. Please try again later.
      </div>
    `;
    console.error("Error:", error);
  }
});

/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

const workerURL = "https://loral-worker.nima-hosseini.workers.dev/";

const selectedProducts = [];

function addProductToSelection(productId) {
  // Load products and find the selected product
  loadProducts().then((products) => {
    const product = products.find((p) => p.id == productId);

    // Avoid duplicates
    if (!selectedProducts.some((p) => p.id == productId)) {
      selectedProducts.push(product);

      // Update the selected products list
      const selectedProductsList = document.getElementById("selectedProductsList");
      selectedProductsList.innerHTML += `
        <div class="selected-product">
          <img src="${product.image}" alt="${product.name}">
          <div>
            <h4>${product.name}</h4>
            <p>${product.brand}</p>
          </div>
        </div>
      `;
    }
  });
}

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
        <button class="select-product-btn" data-id="${product.id}">Select</button>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners to "Select" buttons
  const selectButtons = document.querySelectorAll(".select-product-btn");
  selectButtons.forEach((button) =>
    button.addEventListener("click", (e) => {
      const productId = e.target.dataset.id;
      addProductToSelection(productId);
    })
  );
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

  const userInput = e.target.elements["userInput"].value;

  // Display the user's message
  chatWindow.innerHTML += `
    <div class="chat-message user-message">
      ${userInput}
    </div>
  `;

  // Scroll to the bottom of the chat window
  chatWindow.scrollTop = chatWindow.scrollHeight;

  e.target.elements["userInput"].value = "";

  chatWindow.innerHTML += `
    <div class="chat-message bot-message">
      Thinking...
    </div>
  `;

  // Scroll to the bottom of the chat window
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const systemMessage = `
      You are a helpful assistant. Only provide recommendations based on the following products:
      ${selectedProducts.map((p) => `${p.name}: ${p.description}`).join("\n")}
    `;

    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userInput },
        ],
      }),
    });

    const data = await response.json();

    // Display the assistant's response
    chatWindow.innerHTML += `
      <div class="chat-message bot-message">
        ${data.choices[0].message.content}
      </div>
    `;

    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    chatWindow.innerHTML += `
      <div class="chat-message bot-message">
        Sorry, something went wrong. Please try again later.
      </div>
    `;

    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;

    console.error("Error:", error);
  }
});

document.getElementById("generateRoutine").addEventListener("click", () => {
  if (selectedProducts.length === 0) {
    alert("Please select at least one product to generate a routine.");
    return;
  }

  // Generate a routine based on the selected products
  const routine = selectedProducts.map(
    (product) => `
      <div class="routine-step">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
      </div>
    `
  );

  // Display the routine in the chat window
  chatWindow.innerHTML += `
    <div class="chat-message bot-message">
      <h3>Your Personalized Routine:</h3>
      ${routine.join("")}
    </div>
  `;
});

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

  // Display the user's message as a chat bubble
  chatWindow.innerHTML += `
    <div class="chat-message user-message">
      ${userInput}
    </div>
  `;

  // Scroll to the bottom of the chat window
  chatWindow.scrollTop = chatWindow.scrollHeight;

  e.target.elements["userInput"].value = "";

  // Display a "Thinking..." message from the bot
  const thinkingMessage = document.createElement("div");
  thinkingMessage.classList.add("chat-message", "bot-message");
  thinkingMessage.textContent = "Thinking...";
  chatWindow.appendChild(thinkingMessage);

  // Scroll to the bottom of the chat window
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Load all products from the JSON file
    const allProducts = await loadProducts();

    // Create a system message based on the selected products and all products
    let systemMessage;
    if (selectedProducts.length > 0) {
      // If products are selected, include them in the system message
      systemMessage = `
        You are a helpful assistant. The user has selected the following products:
        ${selectedProducts.map((p) => `${p.name}: ${p.description}`).join("\n")}

        Additionally, you can recommend other products from the following list if they match the user's request:
        ${allProducts.map((p) => `${p.name}: ${p.description}`).join("\n")}
      `;
    } else {
      // If no products are selected, use all products
      systemMessage = `
        You are a helpful assistant. Recommend products based on the following list:
        ${allProducts.map((p) => `${p.name}: ${p.description}`).join("\n")}
      `;
    }

    // Make a request to the workerURL
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

    // Remove the "Thinking..." message
    thinkingMessage.remove();

    // Format the assistant's response with line breaks for readability
    const botResponse = data.choices[0].message.content
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");

    // Display the assistant's response as a chat bubble
    chatWindow.innerHTML += `
      <div class="chat-message bot-message">
        ${botResponse}
        <button class="add-recommended-btn">Add Recommended Products</button>
      </div>
    `;

    // Add event listener to the "Add Recommended Products" button
    const addRecommendedBtn = document.querySelector(".add-recommended-btn");
    addRecommendedBtn.addEventListener("click", () => {
      // Extract product names from the response and add them to the selected products
      const recommendedProducts = allProducts.filter((product) =>
        botResponse.includes(product.name)
      );

      recommendedProducts.forEach((product) => {
        if (!selectedProducts.some((p) => p.id === product.id)) {
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

      alert("Recommended products have been added to your selection!");
    });

    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    // Remove the "Thinking..." message
    thinkingMessage.remove();

    // Display an error message as a chat bubble
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

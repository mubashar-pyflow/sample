(async function () {
    document.head.insertAdjacentHTML(
      "beforeend",
      '<link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.16/tailwind.min.css" rel="stylesheet">',
      ""
    );
    // Inject the CSS
    const style = document.createElement("style");
    style.innerHTML = `
      .hidden {
        display: none;
      }
      #chat-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        flex-direction: column;
      }
      #chat-popup {
        height: 70vh;
        max-height: 70vh;
        transition: all 0.3s;
        overflow: hidden;
      }
      @media (max-width: 768px) {
        #chat-popup {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          max-height: 100%;
          border-radius: 0;
        }
      }
      `;
    document.head.appendChild(style);
    // Create chat widget container
    const chatWidgetContainer = document.createElement("div");
    chatWidgetContainer.id = "chat-widget-container";
    document.body.appendChild(chatWidgetContainer);
  
    // Inject the HTML
    chatWidgetContainer.innerHTML = `
        <div id="chat-bubble" class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer text-3xl">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div id="chat-popup" class="hidden absolute bottom-20 right-0 w-96 bg-white rounded-md shadow-md flex flex-col transition-all text-sm">
          <div id="chat-header" class="flex justify-between items-center p-4 bg-gray-800 text-white rounded-t-md">
            <h3 class="m-0 text-lg">Chat Assistant</h3>
            <button id="close-popup" class="bg-transparent border-none text-white cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div id="chat-messages" class="flex-1 p-4 overflow-y-auto"></div>
          <div id="chat-input-container" class="p-4 border-t border-gray-200">
            <div class="flex space-x-4 items-center">
              <input type="text" id="chat-input" class="flex-1 text-black border border-gray-300 rounded-md px-4 py-2 outline-none w-3/4" placeholder="Type your message...">
              <button id="chat-submit" class="bg-gray-800 text-white rounded-md px-4 py-2 cursor-pointer">Send</button>
            </div>
          </div>
        </div>
      `;
    // Add event listeners
    const chatInput = document.getElementById("chat-input");
    const chatSubmit = document.getElementById("chat-submit");
    const chatMessages = document.getElementById("chat-messages");
    const chatBubble = document.getElementById("chat-bubble");
    const chatPopup = document.getElementById("chat-popup");
    const closePopup = document.getElementById("close-popup");
    let domain = localStorage.getItem("domain") || "software";
  
    // setup env variable in chat.js
    // we will get the secret key from env variables and then decrypt the script key and apply some validations
    const cipher = document.currentScript.getAttribute("keyscript");
    console.log(cipher);
  
    fetch("http://localhost:5000/get_decrypted/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cipher: cipher,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.text();
      })
      .then((decryptedData) => {
        const currentOrigin =
          window.location.protocol + "//" + window.location.hostname;
        const obj = JSON.parse(decryptedData);
        const decrypted_url = obj.url;
        domain = obj.domain;
        console.log(obj, decrypted_url, domain);
  
        if (currentOrigin !== decrypted_url) {
          return;
        } else {
          console.log("waoo");
        }
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
        return;
      });
  
    chatSubmit.addEventListener("click", function () {
      const message = chatInput.value.trim();
      if (!message) return;
  
      chatMessages.scrollTop = chatMessages.scrollHeight;
  
      chatInput.value = "";
      console.log("I am domain name ", domain);
      onUserRequest(message);
    });
  
    chatInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        chatSubmit.click();
      }
    });
  
    chatBubble.addEventListener("click", function () {
      togglePopup();
    });
  
    closePopup.addEventListener("click", function () {
      togglePopup();
    });
  
    function togglePopup() {
      const chatPopup = document.getElementById("chat-popup");
      chatPopup.classList.toggle("hidden");
      if (!chatPopup.classList.contains("hidden")) {
        document.getElementById("chat-input").focus();
      }
    }
  
    function onUserRequest(message) {
      // Handle user request here
      console.log("User request:", message, domain);
  
      // Display user message
      const messageElement = document.createElement("div");
      messageElement.className = "flex justify-end mb-3";
      messageElement.innerHTML = `
          <div class="bg-gray-800 text-white rounded-lg py-2 px-4 max-w-[70%]">
            ${message}
          </div>
        `;
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
  
      chatInput.value = "";
      fetch(`http://127.0.0.1:4000/api/${domain}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Success:", data.response);
          reply(data.response?.content);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  
    function reply(message) {
      const chatMessages = document.getElementById("chat-messages");
      const replyElement = document.createElement("div");
      replyElement.className = "flex mb-3";
      replyElement.innerHTML = `
          <div class="bg-gray-200 text-black rounded-lg py-2 px-4 max-w-[70%]">
            ${message}
          </div>
        `;
      chatMessages.appendChild(replyElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  })();
  
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAWqGX8sW1M5fA5HA9rIfvAP4j8jkFUnbI",
    authDomain: "bd-messages.firebaseapp.com",
    databaseURL: "https://bd-messages-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bd-messages",
    storageBucket: "bd-messages.appspot.com",
    messagingSenderId: "801818692598",
    appId: "1:801818692598:web:340f91e0dca55d05cad5d7",
    measurementId: "G-5YXWYT5L9F"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js';
import { getDatabase, ref, onValue, update, push, set } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-storage.js';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

// Function to remove colons from names in Firebase
function removeColonFromMessages() {
    const messagesRef = ref(database, 'messages');

    onValue(messagesRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const messageKey = childSnapshot.key;
            const messageData = childSnapshot.val();

            if (messageData.name && messageData.name.includes(':')) {
                const updatedName = messageData.name.replace(/:/g, '');

                // Update the data in the database
                update(ref(database, `messages/${messageKey}`), {
                    name: updatedName
                });
            }
        });
    });
}

// Call function to update data
removeColonFromMessages();

// Handle form submission
document.getElementById('messageForm')?.addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent page refresh

    // Get form values
    const name = document.getElementById('name').value;
    const message = document.getElementById('message').value;
    const imageUpload = document.getElementById('imageUpload').files[0];
    const fileSizeError = document.getElementById('fileSizeError'); // Get the file size error element

    // Clear any previous error message
    fileSizeError.textContent = '';

    // Check if name and message are provided
    if (name.trim() && message.trim()) {
        // Check file size if an image is provided
        if (imageUpload && imageUpload.size > 2 * 1024 * 1024) { // 2 MB
            fileSizeError.textContent = 'File size exceeds 2 MB. Please choose a smaller file.';
            return; // Exit function if file size exceeds limit
        }

        console.log("File size is within limit."); // Debugging

        // Save message to Firebase
        try {
            await saveMessage(name, message, imageUpload);

            // Reset form
            document.getElementById('messageForm').reset();

            // Redirect after a delay
            setTimeout(function() {
                window.location.href = 'index.html';
            }, 1000); // 1000 ms = 1 second
        } catch (error) {
            console.error("Error saving message:", error); // Log any errors
        }
    }
});

// Function to save message to Firebase
async function saveMessage(name, message, imageFile) {
    const messagesRef = ref(database, 'messages');
    const newMessageRef = push(messagesRef);

    let imageUrl = '';
    if (imageFile) {
        const imageRef = storageRef(storage, 'images/' + imageFile.name);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
    }

    await set(newMessageRef, {
        name: name,
        message: message,
        timestamp: Date.now(),
        imageUrl: imageUrl // Corrected from image to imageUrl
    });
}

// Load messages from Firebase
document.addEventListener('DOMContentLoaded', function() {
    // Function to apply font to Thai text
    function applyFontToThaiText() {
        const elements = document.querySelectorAll('p, span, div'); // Select tags you want
        elements.forEach(element => {
            if (element.innerText.match(/[\u0E00-\u0E7F]/)) { // Check for Thai text
                element.classList.add('lang-th');
            }
        });
    }

    applyFontToThaiText(); // Call function

    // Load messages from Firebase
    const messagesRef = ref(database, 'messages');
    onValue(messagesRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.innerHTML = `
                <p><strong>${message.name}</strong>: ${message.message} <br><small>${new Date(message.timestamp).toLocaleString()}</small></p>
                ${message.imageUrl ? `<img src="${message.imageUrl}" alt="Image">` : ''}
            `;
            document.getElementById('messages').appendChild(messageElement);
        });
        scrollToBottom(); // Scroll to the bottom after adding new messages
        applyFontToThaiText(); // Apply font after adding new messages
    });

    // Function to scroll to the bottom of the messages container
    function scrollToBottom() {
        const messagesContainer = document.getElementById('messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});
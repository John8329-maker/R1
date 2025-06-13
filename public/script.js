document.addEventListener('DOMContentLoaded', function() {
  const chatContainer = document.getElementById('chat-container');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const loadingIndicator = document.getElementById('loading');

  // Функція додавання повідомлення
  function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'bot-message';
    messageDiv.textContent = text;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Функція відправки повідомлення
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Додаємо повідомлення користувача
    addMessage(message, true);
    messageInput.value = '';
    
    // Показуємо індикатор завантаження
    loadingIndicator.classList.remove('hidden');
    
    try {
      // Використовуємо прямий шлях до функції
      const response = await fetch('/.netlify/functions/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: message 
        })
      });

      if (!response.ok) {
        throw new Error('Помилка сервера: ' + response.status);
      }

      const data = await response.json();
      addMessage(data.answer, false);
    } catch (error) {
      addMessage('Помилка: ' + error.message, false);
      console.error('Помилка запиту:', error);
    } finally {
      // Ховаємо індикатор завантаження
      loadingIndicator.classList.add('hidden');
    }
  }

  // Обробники подій
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
  });
  
  // Фокусуємося на полі вводу при завантаженні
  messageInput.focus();
});

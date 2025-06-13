document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const clearBtn = document.getElementById('clear-btn');
  const loadingIndicator = document.getElementById('loading');
  
  // Завантажити історію з localStorage
  function loadHistory() {
    const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatContainer.innerHTML = '';
    
    // Додати стартове повідомлення
    addMessage('Привіт! Я Virum, ваш AI помічник. Чим можу допомогти?', false);
    
    // Додати історію
    history.forEach(item => {
      addMessage(item.prompt, true);
      addMessage(item.answer, false);
    });
    
    scrollToBottom();
  }
  
  // Додати повідомлення до чату
  function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message p-3 mb-3 ml-10' : 'bot-message p-3 mb-3 mr-10';
    
    const senderDiv = document.createElement('div');
    senderDiv.className = 'font-semibold flex items-center';
    senderDiv.innerHTML = isUser 
      ? '<i class="fas fa-user mr-2"></i> Ви' 
      : '<i class="fas fa-robot mr-2"></i> Virum';
    
    const textDiv = document.createElement('div');
    textDiv.textContent = text;
    
    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(textDiv);
    chatContainer.appendChild(messageDiv);
    
    scrollToBottom();
  }
  
  // Прокрутити до низу
  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  // Надіслати повідомлення
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Додати повідомлення користувача
    addMessage(message, true);
    messageInput.value = '';
    
    // Показати індикатор завантаження
    loadingIndicator.classList.remove('hidden');
    
    try {
      // Виконати запит до сервера
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: message })
      });
      
      // Перевірити статус відповіді
      if (!response.ok) {
        let errorMsg = `HTTP помилка: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      addMessage(data.answer, false);
      
      // Зберегти в історію
      const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
      history.push({
        prompt: message,
        answer: data.answer
      });
      localStorage.setItem('chatHistory', JSON.stringify(history));
      
    } catch (error) {
      addMessage(`Помилка: ${error.message}`, false);
      console.error('Помилка запиту:', error);
    } finally {
      // Сховати індикатор завантаження
      loadingIndicator.classList.add('hidden');
      scrollToBottom();
    }
  }
  
  // Очистити історію
  function clearHistory() {
    if (confirm('Ви впевнені, що хочете очистити історію чату?')) {
      localStorage.removeItem('chatHistory');
      loadHistory();
    }
  }
  
  // Обробники подій
  sendBtn.addEventListener('click', sendMessage);
  clearBtn.addEventListener('click', clearHistory);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  // Ініціалізація
  loadHistory();
});

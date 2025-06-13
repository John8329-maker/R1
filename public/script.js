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
    addMessage('Привіт! Я ваш AI помічник. Чим можу допомогти?', false, 'system');
    
    // Додати історію збережених повідомлень
    history.forEach(msg => {
      addMessage(msg.content, msg.role === 'user', msg.model);
    });
    
    scrollToBottom();
  }
  
  // Додати повідомлення до чату
  function addMessage(text, isUser, model = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser 
      ? 'user-message p-3 mb-3 ml-10' 
      : 'bot-message p-3 mb-3 mr-10';
    
    const senderDiv = document.createElement('div');
    senderDiv.className = 'font-semibold flex items-center';
    
    if (isUser) {
      senderDiv.innerHTML = '<i class="fas fa-user mr-2"></i> Ви';
    } else {
      let icon = '<i class="fas fa-robot mr-2"></i>';
      let name = 'AI';
      
      if (model) {
        if (model.includes('DeepSeek')) {
          icon = '<i class="fas fa-star mr-2 text-yellow-500"></i>';
          name = 'DeepSeek-R1';
        } else if (model.includes('Together')) {
          icon = '<i class="fas fa-shield-alt mr-2 text-blue-500"></i>';
          name = 'Llama 3.3';
        }
      }
      
      senderDiv.innerHTML = `${icon} ${name}`;
    }
    
    const textDiv = document.createElement('div');
    textDiv.textContent = text;
    
    // Додати індикатор моделі (для AI повідомлень)
    if (!isUser && model) {
      const modelDiv = document.createElement('div');
      modelDiv.className = 'model-indicator';
      modelDiv.textContent = `Модель: ${model}`;
      messageDiv.appendChild(modelDiv);
    }
    
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
      // Отримати всю історію діалогу
      const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
      
      // Створити масив повідомлень для AI
      const messages = history
        .filter(msg => msg.content)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Додати нове повідомлення користувача
      messages.push({
        role: 'user',
        content: message
      });
      
      // Виконати запит до сервера
      const response = await fetch('/.netlify/functions/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP помилка: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Додати відповідь асистента
      addMessage(data.answer, false, data.model);
      
      // Оновити історію
      const newHistory = [
        ...history,
        {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: data.answer,
          model: data.model,
          timestamp: new Date().toISOString()
        }
      ];
      
      // Зберегти історію (обмежити до останніх 20 повідомлень)
      localStorage.setItem('chatHistory', JSON.stringify(newHistory.slice(-20)));
      
    } catch (error) {
      addMessage(`Помилка: ${error.message}`, false);
      console.error('Помилка запиту:', error);
    } finally {
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

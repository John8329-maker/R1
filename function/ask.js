exports.handler = async function(event) {
  // Налаштування CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Обробка OPTIONS запиту
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Перевірка методу
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Метод не підтримується' })
    };
  }

  try {
    // Парсимо тіло запиту
    const { message } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Порожнє повідомлення' })
      };
    }

    // Отримуємо API ключ
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Відсутній API ключ' })
      };
    }

    // Виклик DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: message }],
        max_tokens: 1024,
        temperature: 0.7,
        stream: false
      })
    });

    // Обробка відповіді
    if (!response.ok) {
      const errorData = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Помилка DeepSeek API: ${response.status}` })
      };
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ answer })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Внутрішня помилка сервера: ' + error.message })
    };
  }
};

exports.handler = async (event) => {
  // Налаштування CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Обробка OPTIONS запиту
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Перевірка методу
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Метод не дозволений' })
    };
  }

  // Перевірка тіла запиту
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Відсутнє тіло запиту' })
    };
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Некоректний JSON у тілі запиту' })
    };
  }

  const { prompt } = parsedBody;
  
  // Перевірка prompt
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Будь ласка, введіть коректний запит' })
    };
  }

  try {
    // Виклик DeepSeek API (моя модель!)
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
        stream: false
      })
    });

    // Обробка відповіді API
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = response.statusText;
      }
      
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: `Помилка DeepSeek API: ${response.status} - ${errorText.slice(0, 100)}` 
        })
      };
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    if (!answer) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Не вдалося отримати відповідь' 
        })
      };
    }

    // Успішна відповідь
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ answer })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: `Помилка сервера: ${error.message}` 
      })
    };
  }
};

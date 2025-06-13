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

  const { messages } = parsedBody;
  
  // Перевірка messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Будь ласка, надайте історію діалогу' })
    };
  }

  // Конфігурація моделей
  const AI_PROVIDERS = [
    {
      name: "DeepSeek-R1",
      url: "https://api.deepseek.com/v1/chat/completions",
      apiKey: process.env.DEEPSEEK_API_KEY,
      requestBody: {
        model: "deepseek-chat",
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: false
      }
    },
    {
      name: "TogetherAI-Llama3.3",
      url: "https://api.together.xyz/v1/chat/completions",
      apiKey: process.env.TOGETHER_API_KEY,
      requestBody: {
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      }
    }
  ];

  // Спроба відправити запит через доступних провайдерів
  for (const provider of AI_PROVIDERS) {
    if (!provider.apiKey) {
      console.log(`Пропускаємо ${provider.name} - відсутній API ключ`);
      continue;
    }

    try {
      console.log(`Спроба використати ${provider.name}...`);
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(provider.requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Помилка ${provider.name}: ${response.status} - ${errorText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const answer = provider.name.includes("DeepSeek") 
        ? data.choices[0].message.content
        : data.choices?.[0]?.message?.content;

      if (!answer) {
        console.error(`Пуста відповідь від ${provider.name}`);
        continue;
      }

      console.log(`Успішно отримано відповідь від ${provider.name}`);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          answer,
          model: provider.name 
        })
      };
      
    } catch (error) {
      console.error(`Помилка з ${provider.name}:`, error.message);
    }
  }

  // Якщо всі спроби не вдалися
  return {
    statusCode: 503,
    headers: corsHeaders,
    body: JSON.stringify({ 
      error: 'Усі сервіси AI тимчасово недоступні. Спробуйте пізніше.' 
    })
  };
};

const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_BOT_TOKEN;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const bot = new TelegramBot(token, { polling: true });

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    `👋 Hello! I'm your Code Assistant Bot!
    
    💻 Send me any programming question or code, and I'll help you!
    
    📋 Commands:
    /start - Show this message
    /help - Get help
    /clear - Clear conversation history
    /explain <code> - Explain code
    /debug <code> - Debug code
    /optimize <code> - Optimize code
    
    🚀 Powered by OpenAI`
  );
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `📖 Help Menu:
    
    /explain <code> - Explain what the code does
    /debug <code> - Find bugs and fix them
    /optimize <code> - Suggest optimizations
    /convert <code> to <language> - Convert code between languages
    /test <code> - Write unit tests
    
    Just send any code or question directly!`
  );
});

// Handle all messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Ignore commands (already handled)
  if (!text || text.startsWith('/')) return;
  
  try {
    // Show typing indicator
    bot.sendChatAction(chatId, 'typing');
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert coding assistant. Help users with programming questions, debug code, explain concepts, and provide code examples. Be concise and practical."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const reply = response.choices[0].message.content;
    
    // Split long messages if needed
    if (reply.length > 4000) {
      const chunks = reply.match(/.{1,4000}/g);
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
      }
    } else {
      await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    }
    
  } catch (error) {
    console.error('Error:', error);
    bot.sendMessage(chatId, 
      `❌ Error: ${error.message}\n\nPlease try again later.`
    );
  }
});

// Command handlers
bot.onText(/\/explain (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1];
  await handleCodeCommand(chatId, code, 'Explain this code:', 'explain');
});

bot.onText(/\/debug (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1];
  await handleCodeCommand(chatId, code, 'Debug this code and fix any issues:', 'debug');
});

bot.onText(/\/optimize (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1];
  await handleCodeCommand(chatId, code, 'Optimize this code:', 'optimize');
});

async function handleCodeCommand(chatId, code, instruction, type) {
  try {
    bot.sendChatAction(chatId, 'typing');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert coding assistant. ${instruction} Provide clear, practical solutions.`
        },
        {
          role: "user",
          content: code
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });
    
    const reply = response.choices[0].message.content;
    await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    
  } catch (error) {
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

console.log('Code Assistant Bot is running...');

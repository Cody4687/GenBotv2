const Bot = require('./Bot').Bot
const ChatBot = require('./ChatBot')
const readJson = require('./Bot').readJson
const config = readJson('./config.json')

const bots = []

for (const botConfig of config.bots) {
  const options = {
    host: '0b0t.org',
    port: 25565,
    username: botConfig.email,
    version: '1.12.2',
    verbose: 'true',
    password: botConfig.password
  }
  console.log(`Mineflayer Options: ${JSON.stringify(options)}, Bot Config: ${JSON.stringify(botConfig)}`)

  if (botConfig.type === 'chatbot') {
    bots.push(new ChatBot(botConfig.name, options))
  } else {
    bots.push(new Bot(botConfig.name, options))
  }
}

process.on('uncaughtException', console.log) // without this the app crashes => all of them shuts down

const mineflayer = require('mineflayer')
const navigatePlugin = require('mineflayer-navigate')(mineflayer)
const fs = require('fs')

function readJson (file) {
  return JSON.parse(fs.readFileSync(file).toString())
}

const TpEventTag = 'tpRequest'

class Bot {
  constructor (name, config) {
    this.name = name
    this.config = config
    this.prefix = config.prefix
    this.initBot()
  }

  initBot () {
    this.bot = mineflayer.createBot(this.config)
    this.setup()
  }

  setup () {
    navigatePlugin(this.bot)
    this.bot.chatAddPattern(/^([a-zA-Z0-9_]{3,16}) wants to teleport to you\.$/, TpEventTag, 'tpa request') // this line didnt work for me, it threw TypeError: index.chatAddPattern is not a function

    this.bot.on(TpEventTag, (username) => {
      if (this.isAllowed(username)) {
        return this.bot.chat(`/tpy ${username}`)
      }
    })

    this.bot.on('login', () => console.log(`${this.name} Online!`))

    this.bot.on('error', (err) => {
      console.log('Error attempting to reconnect: ' + JSON.stringify(err) + '.')
      if (!err.code) {
        console.log('Invalid credentials OR index needs to wait because it relogged too quickly.')
        console.log('Will retry to connect in 30 seconds. ')
        this.relog()
      }
    })

    this.bot.on('end', () => this.end())
  }

  end () {
    console.log(`${this.name} ended`)
    this.relog()
  }

  relog () {
    console.log('Attempting to reconnect...')
    setTimeout(() => this.initBot(), 30000)
  }

  isAllowed (username) {
    const array = readJson('./allowed.json').allowed
    if (array.includes(username)) {
      this.chat(`> Accepted tpa for ${username}.`, `Accepted tpa for ${username}.`)
      return true
    }

    this.chat(`< ${username} is not on the list!`, `${username} attempted to tpa.`)
    return false
  }

  chat (b, c) {
    this.bot.chat(b)
    console.log(c)
  }
}

module.exports.Bot = Bot
module.exports.readJson = readJson

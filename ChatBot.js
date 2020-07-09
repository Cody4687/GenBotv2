const Discord = require('discord.js')
const Bot = require('./Bot').Bot
const readJson = require('./Bot').readJson
const fs = require('fs')

/*
0b0t Chat Colors (ignore)
! yellow, # pink, > green, < red, , orange, ; dark blue, : light blue, [ gray, ] black
*/

class ChatBot extends Bot {
  initDiscord () {
    this.discord = new Discord.Client({
      disableEveryone: true
    })
    this.discord.commands = new Discord.Collection()

    this.discord.on('ready', () => console.log('Bridge online!'))
    this.discord.on('message', message => {
      if (message.author.id === this.config.botId) return
      if (message.channel.id !== this.config.channelId) return
      console.log(`[${message.author.tag}] ${message}`)
      this.bot.chat(`[${message.author.tag}] ${message}`)
    })

    this.discord.on('message', message => {
      const messageArray = message.content.split(' ')
      const cmd = messageArray[0]
      const args = messageArray
      if (message.author.id === this.config.botId) return
      if (message.channel.id !== this.config.controlChannelId) return
      if (cmd === `${this.prefix}list`) {
        const allowed = readJson('./allowed.json')
        return message.channel.send(allowed.allowed.join(', '))
      }
      if (cmd === `${this.prefix}remove` && args[1]) {
        const user = args[1]
        const allowedUsers = readJson('./allowed.json')
        if (!allowedUsers.allowed.includes(user)) {
          return message.channel.send(user + ' is not on the list.')
        }

        allowedUsers.allowed = allowedUsers.allowed.filter(u => u !== user)
        fs.writeFileSync('./allowed.json', JSON.stringify(allowedUsers))
        message.channel.send('Removed ' + user + ' from list.')
      }

      if (cmd === `${this.prefix}add` && args[1]) {
        const user = args[1]
        const allowedUsers = readJson('./allowed.json')
        if (allowedUsers.allowed.includes(user)) {
          return message.channel.send(user + ' is already on list.')
        }
        allowedUsers.allowed.push(user)
        message.channel.send('Added ' + user + ' to list.')
        fs.writeFileSync('./allowed.json', JSON.stringify(allowedUsers))
      }
      if (cmd === `${this.prefix}ignore` && args[1]) {
        this.bot.chat(`/ignore ${args[1]}`)
        message.channel.send(`Ignored ${args[1]}.`)
      }

      if (cmd === `${this.prefix}tpa` && args[1]) {
        this.bot.chat(`/tpa ${args[1]}`)
        message.channel.send(`Sent request to ${args[1]}.`)
      }
    })

    this.discord.login(this.config.token)
  }

  setup () {
    super.setup()
    this.initDiscord()
    this.startSpam()

    this.bot.on('chat', (username, message) => {
      if (message.includes('@everyone')) return
      if (message.includes('@here')) return
      this.discord.channels.cache.get(this.config.channelId).send(`<${username}> ${message}`)
    })

    this.bot.on('playerJoined', p => console.log(JSON.stringify(p))) // todo
    this.bot.on('playerLeft', p => console.log(JSON.stringify(p))) // todo
    this.bot.on('chat', this.onChat)
  }

  startSpam () {
    const loadArray = fs.readFileSync('./spam.txt').toString()
    const phrases = loadArray.split('\n')

    this.startTimeout =
      setTimeout(() => {
        this.spammer = setInterval(() => {
          const phrase = phrases[Math.floor(Math.random() * phrases.length)]
          this.chat(`[Ad] ${phrase}`, `[Ad] ${phrase}`, `[Ad] ${phrase}`)
        }, this.config.spamDelay)
      }, 30000)
  }

  stopSpam () {
    clearTimeout(this.startTimeout)
    if (this.spammer !== undefined) {
      clearInterval(this.spammer)
    }
  }

  chat (b, c) {
    super.chat(b, c)
    this.discord.channels.cache.get(this.config.logChannelId).send(c)
  }

  end () {
    super.end()
    this.discord.destroy()
    this.stopSpam()
  }

  onChat (username, message) {
    const cmd = message.split(' ')[0]

    if (cmd === `${this.prefix}accept` && this.isAllowed(username)) {
      this.bot.chat(`/tpy ${username}`)
    }

    if (cmd === `${this.prefix}a` && this.isAllowed(username)) {
      this.bot.chat(`/tpy ${username}`)
    }

    if (cmd === `${this.prefix}help`) {
      this.chat(`/w ${username} tiny.cc/CCorpHelp`, `${username} used ${this.prefix}help.`)
    }

    if (cmd === '!endtest') {
      this.bot.end()
    }

    if (cmd === `${this.prefix}russianroulette`) {
      this.chat(`${this.russianRoulette()}`, `${username} used ${this.prefix}russianroulette.`)
    }

    if (cmd === `${this.prefix}8ball`) {
      this.chat(`${this.ball()}`, `${username} used ${this.prefix}8ball.`)
    }

    if (cmd === `${this.prefix}tpa`) {
      this.bot.chat(`/tpa ${this.config.botOwner}`)
    }

    if (cmd === `${this.prefix}test`) {
      console.log(this.bot.players)
    }

    if (cmd === `${this.prefix}uuid`) {
      this.chat(this.uuid(username), `${username} used ${this.prefix}uuid.`)
    }

    if (cmd === `${this.prefix}ping`) {
      this.chat(this.ping(username), `${username} used ${this.prefix}ping.`)
    }

    if (cmd === `${this.prefix}coinflip`) {
      this.chat(`, ${this.coinflip()}`, `${username} used ${this.prefix}coinflip.`)
    }
  }

  russianRoulette () {
    const math = Math.floor(Math.random() * 7)
    if (math < 1) {
      return ('< You died!')
    } else {
      return ('> You lived!')
    }
  }

  ball () {
    const responses = ['# Yes.', '# No.', '# Not Likely.', '# Very Likely.', '# Unsure.', '# It is certain.']
    const math = Math.floor(Math.random() * responses.length)
    return (responses[math])
  }

  ping (username) { // this might solve the problem
    const player = this.bot.players[username]
    if (!player) return ''
    const ping = player.ping
    if (!ping && ping !== 0) return ''
    return `, Your ping is ${ping}!`
  }

  uuid (username) {
    const player = this.bot.players[username]
    if (!player) return ''
    const uuid = player.uuid
    if (!uuid) return ''
    return `, Your uuid is ${uuid}!`
  }

  coinflip () {
    const math = Math.random()
    if (math < 0.5) {
      return ('Heads!')
    }
    if (math > 0.5) {
      return ('Tails!')
    }
  }
}

module.exports = ChatBot

const mineflayer = require('mineflayer')
const navigatePlugin = require('mineflayer-navigate')(mineflayer)
const fs = require('fs')

const config = readJson('./config.json')
const prefix = config.prefix
const Discord = require('discord.js')

/*
0b0t Chat Colors (ignore)
! yellow, # pink, > green, < red, , orange, ; dark blue, : light blue, [ gray, ] black
*/
function readJson (file) {
  return JSON.parse(fs.readFileSync(file).toString())
}

const options = {
  host: '0b0t.org',
  port: 25565,
  username: config.email,
  version: '1.12.2',
  verbose: 'true',
  password: config.password
}

const bot = mineflayer.createBot(options)
bindEvents(bot)

function bindEvents (bot) {
  navigatePlugin(bot)
  bot.chatAddPattern(/^([a-zA-Z0-9_]{3,16}) wants to teleport to you\.$/, 'tpRequest', 'tpa request') // this line didnt work for me, it threw TypeError: bot.chatAddPattern is not a function

  const discord = new Discord.Client({
    disableEveryone: true
  })
  discord.commands = new Discord.Collection()
  discord.on('ready', () => {
    console.log('Bridge online!')
  })
  discord.on('message', message => {
    if (message.author.id === config.botId) return
    if (message.channel.id !== config.channelId) return
    console.log(`[${message.author.tag}] ${message}`)
    bot.chat(`[${message.author.tag}] ${message}`)
  })

  discord.on('message', message => {
    const messageArray = message.content.split(' ')
    const cmd = messageArray[0]
    const args = messageArray
    if (message.author.id === config.botId) return
    if (message.channel.id !== config.controlChannelId) return
    if (cmd === `${prefix}list`) {
      const allowed = readJson('./allowed.json')
      return message.channel.send(allowed.allowed.join(', '))
    }
    if (cmd === `${prefix}remove` && args[1]) {
      const user = args[1]
      const allowedUsers = readJson('./allowed.json')
      if (!allowedUsers.allowed.includes(user)) {
        return message.channel.send(user + ' is not on the list.')
      }

      allowedUsers.allowed = allowedUsers.allowed.filter(u => u !== user)
      fs.writeFileSync('./allowed.json', JSON.stringify(allowedUsers))
      message.channel.send('Removed ' + user + ' from list.')
    }

    if (cmd === `${prefix}add` && args[1]) {
      const user = args[1]
      const allowedUsers = readJson('./allowed.json')
      if (allowedUsers.allowed.includes(user)) {
        return message.channel.send(user + ' is already on list.')
      }
      allowedUsers.allowed.push(user)
      message.channel.send('Added ' + user + ' to list.')
      fs.writeFileSync('./allowed.json', JSON.stringify(allowedUsers))
    }
    if (cmd === `${prefix}ignore` && args[1]) {
      bot.chat(`/ignore ${args[1]}`)
      message.channel.send(`Ignored ${args[1]}.`)
    }

    if (cmd === `${prefix}tpa` && args[1]) {
      bot.chat(`/tpa ${args[1]}`)
      message.channel.send(`Sent request to ${args[1]}.`)
    }
  })

  bot.on('chat', (username, message) => {
    if (message.includes('@everyone')) return
    if (message.includes('@here')) return
    discord.channels.cache.get(config.channelId).send(`<${username}> ${message}`)
  })
  discord.login(config.token)

  bot.on('playerJoined', p => console.log(JSON.stringify(p)))
  bot.on('playerLeft', p => console.log(JSON.stringify(p)))

  /*
          client.on('add', (x) => {
              let msg = JSON.stringify(x.name)
              let arra = requireUncached('./allowed.json')
              if (arra.allowed.includes(msg.slice(1, -1))) {
                  return console.log('Already on list.')
              } else {
                  console.log("Added " + msg.slice(1, -1) + " to list.")
                  fs.writeFileSync(`./allowed.json`, `{"allowed":${JSON.stringify(arra.allowed).slice(0,-1)},${msg}]}`)
              }

          })

          client.on('remove', (x) => {
              let msg = JSON.stringify(x.name)
              let array = requireUncached('./allowed.json')
              if (!array.allowed.includes(msg.slice(1, -1))) {
                  return console.log('Not on the list.')
              } else {
                  let index = array.allowed.indexOf(msg.slice(1, -1));
                  if (index > -1) {
                      let arr = array.allowed.splice(index, 1);
                      fs.writeFileSync(`./allowed.json`, JSON.stringify(array))
                      console.log("Removed " + msg.slice(1, -1) + " from list.")

  */

  function RussianRoulette () {
    const math = Math.floor(Math.random() * 7)
    if (math < 1) {
      return ('< You died!')
    } else {
      return ('> You lived!')
    }
  }

  const responses = ['# Yes.', '# No.', '# Not Likely.', '# Very Likely.', '# Unsure.', '# It is certain.']

  function Ball () {
    const math = Math.floor(Math.random() * responses.length)
    return (responses[math])
  }

  function chat (b, c, a) {
    bot.chat(b)
    console.log(arguments)
    discord.channels.cache.get(config.logChannelId).send(a)
  }

  function isAllowed (username) {
    const array = readJson('./allowed.json').allowed
    if (array.includes(username)) {
      chat(`> Accepted tpa for ${username}.`, `Accepted tpa for ${username}.`, `Accepted tpa for ${username}`)
      return true
    }

    chat(`< ${username} is not on the list!`, `${username} attempted to tpa.`, `${username} attempted to tpa.`)
    return false
  }

  bot.on('tpRequest', (username) => {
    if (isAllowed(username)) {
      return bot.chat(`/tpy ${username}`)
    }
  })

  bot.on('login', function () {
    console.log('Minecraft Bot Online!')
  })

  const loadArray = fs.readFileSync('./spam.txt').toString()
  const phrases = loadArray.split('\n')

  let spammer =
    setTimeout(() => {
      spammer = setInterval(spam, config.spamDelay)
    }, 30000)

  function spam () {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)]
    chat(`[Ad] ${phrase}`, `[Ad] ${phrase}`, `[Ad] ${phrase}`)
  }

  function stopSpam () {
    clearInterval(spammer)
  }

  bot.on('error', function (err) {
    console.log('Error attempting to reconnect: ' + JSON.stringify(err) + '.')
    if (!err.code) {
      console.log('Invalid credentials OR bot needs to wait because it relogged too quickly.')
      console.log('Will retry to connect in 30 seconds. ')
      setTimeout(relog, 30000)
    }
  })

  bot.on('end', function () {
    console.log('Bot has ended')
    discord.destroy()
    stopSpam()
    setTimeout(relog, 30000)
  })

  function relog () {
    console.log('Attempting to reconnect...')
    bot = mineflayer.createBot(options)
    bindEvents(bot)
  }

  bot.on('chat', (username, message) => {
    const cmd = message.split(' ')[0]

    if (cmd === `${prefix}accept` && isAllowed(username)) {
      bot.chat(`/tpy ${username}`)
    }

    if (cmd === `${prefix}a` && isAllowed(username)) {
      bot.chat(`/tpy ${username}`)
    }

    if (cmd === `${prefix}help`) {
      chat(`/w ${username} tiny.cc/CCorpHelp`, `${username} used ${prefix}help.`, `${username} used ${prefix}help.`)
    }

    if (cmd === '!endtest') {
      bot.end()
    }

    if (cmd === `${prefix}russianroulette`) {
      chat(`${RussianRoulette()}`, `${username} used ${prefix}russianroulette.`, `${username} used ${prefix}russianroulette.`)
    }

    if (cmd === `${prefix}8ball`) {
      chat(`${Ball()}`, `${username} used ${prefix}8ball.`, `${username} used ${prefix}8ball.`)
    }

    if (cmd === `${prefix}tpa`) {
      bot.chat(`/tpa ${config.botOwner}`)
    }

    if (cmd === `${prefix}test`) {
      console.log(bot.players)
    }

    if (cmd === `${prefix}uuid`) {
      chat(uuid(username), `${username} used ${prefix}uuid.`, `${username} used ${prefix}uuid.`)
    }

    if (cmd === `${prefix}ping`) {
      chat(ping(username), `${username} used ${prefix}ping.`, `${username} used ${prefix}ping.`)
    }

    if (cmd === `${prefix}coinflip`) {
      return (chat(`, ${coinflip()}`, `${username} used ${prefix}coinflip.`, `${username} used ${prefix}coinflip.`))
    }
  })
}

function ping (username) { // this might solve the problem
  const player = bot.players[username]
  if (!player) return ''
  const ping = player.ping
  if (!ping && ping !== 0) return ''
  return `, Your ping is ${ping}!`
}

function uuid (username) {
  const player = bot.players[username]
  if (!player) return ''
  const uuid = player.uuid
  if (!uuid) return ''
  return `, Your uuid is ${uuid}!`
}

function coinflip () {
  const math = Math.random()
  if (math < 0.5) {
    return ('Heads!')
  }
  if (math > 0.5) {
    return ('Tails!')
  }
}

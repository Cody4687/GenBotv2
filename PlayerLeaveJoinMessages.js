const baseUrl = 'https://sessionserver.mojang.com/session/minecraft/profile/'
const sharp = require('sharp')
const fetch = require('node-fetch')

// This has a much stricter rate limit: You can request the same profile once per minute, however you can send as many unique requests as you like. see: https://wiki.vg/Mojang_API#UUID_-.3E_Profile_.2B_Skin.2FCape
async function getPlayerSkin (uuid) {
  const image = await fetchSkin(uuid)
  if (!image) return null
  const croppedImage = cropImage(image)
  return croppedImage.toBuffer()
}

function cropImage (image) {
  return sharp(Buffer.from(image)).extract({ left: 8, top: 8, width: 8, height: 8 }).png()
}

async function fetchSkin (uuid) {
  try {
    const response = await fetch(baseUrl + uuid)
    const json = await response.json()
    const encodedJson = Buffer.from(json.properties[0].value, 'base64').toString()
    const playerData = JSON.parse(encodedJson)

    const skinUrl = playerData.textures.SKIN.url
    const imageResponse = await fetch(skinUrl)
    return imageResponse.arrayBuffer()
  } catch (e) {
    console.log(e)
    return null
  }
}

module.exports = getPlayerSkin

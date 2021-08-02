import crypto from 'crypto-js'
// import forge from 'node-forge'
import { CipherOption, makeBufferChunks, wordArrayToUint8Array } from './utils'

export const encryptAES = (
  buffer: Buffer,
  secret: string | crypto.lib.WordArray,
  config?: CipherOption
) => {
  let newBuf = buffer
  if (!buffer) {
    console.log('encryptAES exception!')
    newBuf = Buffer.from('')
  }
  const wordArray = crypto.lib.WordArray.create(newBuf as unknown as number[])
  const encrypted = crypto.AES.encrypt(wordArray, secret, config)
  return Buffer.from(encrypted.toString())
}

export const decryptAES = (
  buffer: Buffer,
  secret: string | crypto.lib.WordArray,
  config?: CipherOption
) => {
  if (!buffer) {
    console.log('decryptAES exception!')
    return Buffer.from('')
  }
  const wordArray = crypto.AES.decrypt(String(buffer), secret, config)
  return Buffer.from(wordArrayToUint8Array(wordArray))
}

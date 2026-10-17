import bcrypt from 'bcryptjs'
import { stdin, stdout } from 'node:process'

if (!stdin.isTTY || !stdin.setRawMode) {
  console.error('Run this command in an interactive terminal so the password can be entered without echoing.')
  process.exit(1)
}

stdout.write('Administrator password (minimum 12 characters; input hidden): ')
stdin.setRawMode(true)
stdin.resume()
stdin.setEncoding('utf8')

let password = ''
stdin.on('data', async key => {
  if (key === '\u0003') {
    stdin.setRawMode(false)
    stdout.write('\nCancelled.\n')
    process.exit(1)
  }
  if (key === '\r' || key === '\n') {
    stdin.setRawMode(false)
    stdin.pause()
    stdout.write('\n')
    if (password.length < 12) {
      console.error('Password must contain at least 12 characters.')
      process.exitCode = 1
      return
    }
    console.log(`ADMIN_PASSWORD_HASH=${await bcrypt.hash(password, 12)}`)
    password = ''
    return
  }
  if (key === '\u007f' || key === '\b') {
    password = password.slice(0, -1)
    return
  }
  if (!key.startsWith('\u001b')) password += key
})

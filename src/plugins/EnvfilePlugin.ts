import { resolve } from 'path'
import * as dotenv from 'dotenv'

const load = (path: string) => {
  try {
    dotenv.config({ path, debug: process.env.DEBUG })
  } catch (err) {
    if (err.toString().indexOf('ENOENT') < 0) {
      throw err
    }
  }
}

const EnvfilePlugin = {
  async apply () {
    const env = process.env.NODE_ENV || 'development'
    const cwd = process.cwd()

    // defined env vars will not be overwritten
    const pathes = new Set([
      resolve(cwd, `.env.${env}.local`),
      resolve(cwd, `.env.${env}`),
      resolve(cwd, `.env.local`),
      resolve(cwd, `.env`),
    ])

    for (let path of pathes) {
      load(path)
    }
  },
}

export default EnvfilePlugin

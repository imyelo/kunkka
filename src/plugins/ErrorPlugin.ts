import { BuiltinPlugin } from '../Plugin'

const ErrorPlugin = {
  async apply (api) {
    api.hook('error', (error: Error) => {
      process.stderr.write(`Error: ${error.message}`)
    })
  },
} as BuiltinPlugin

export default ErrorPlugin

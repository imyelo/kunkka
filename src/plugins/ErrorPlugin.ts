import PluginAPI from '../PluginAPI';

const ErrorPlugin = {
  async apply (api: PluginAPI) {
    api.hook('error', (error: Error) => {
      process.stderr.write(`Error: ${error.message}`)
    })
  },
}

export default ErrorPlugin

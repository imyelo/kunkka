import PluginAPI from './PluginAPI'

export default interface Plugin {
  apply (api: PluginAPI, options: object): void
}

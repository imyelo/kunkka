import PluginAPI from './PluginAPI'
import KunkkaSignal from './Signal'

export default interface Plugin<CustomSignal> {
  apply (api: PluginAPI<CustomSignal | KunkkaSignal>, options: object): void
}

export interface BuiltinPlugin extends Plugin<never> {}

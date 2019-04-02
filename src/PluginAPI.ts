import Hooks from './Hooks'
import { ICommandConstructor } from './Command'
import KunkkaSignal from './Signal'

export default class PluginAPI<CustomSignal> {
  private hooks: Hooks<CustomSignal | KunkkaSignal>
  private Commands: Map<string, ICommandConstructor<CustomSignal>>

  constructor ({ hooks, Commands }: { hooks: Hooks<CustomSignal | KunkkaSignal>, Commands: Map<string, ICommandConstructor<CustomSignal>> }) {
    this.hooks = hooks
    this.Commands = Commands
  }

  hook (name: CustomSignal | KunkkaSignal, fn: Function) {
    this.hooks.add(name, fn)
  }

  registerCommand (name: string, Command: ICommandConstructor<CustomSignal>) {
    if (this.Commands.has(name)) {
      throw new Error(`Command "${name}" has been registered twice, please check for conflicting plugins.`)
    }
    this.Commands.set(name, Command)
  }
}

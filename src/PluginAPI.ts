import Hooks from './Hooks'
import { ICommandConstructor } from './Command'

export default class PluginAPI {
  private hooks: Hooks
  private Commands: Map<string, ICommandConstructor>

  constructor ({ hooks, Commands }: { hooks: Hooks, Commands: Map<string, ICommandConstructor> }) {
    this.hooks = hooks
    this.Commands = Commands
  }

  hook (name: string, fn: Function) {
    this.hooks.add(name, fn)
  }

  registerCommand (name: string, Command: ICommandConstructor) {
    if (this.Commands.has(name)) {
      throw new Error(`Command "${name}" has been registered twice, please check for conflicting plugins.`)
    }
    this.Commands.set(name, Command)
  }
}

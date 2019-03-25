import Hooks from './Hooks'
import Command from './Command'

export default class PluginAPI {
  private hooks: Hooks
  private Commands: Map<string, typeof Command>

  constructor ({ hooks, Commands }: { hooks: Hooks, Commands: Map<string, typeof Command> }) {
    this.hooks = hooks
    this.Commands = Commands
  }

  hook (name: string, fn: Function) {
    this.hooks.add(name, fn)
  }

  registerCommand (name: string, theCommand: typeof Command) {
    if (this.Commands.has(name)) {
      throw new Error(`Command "${name}" has been registered twice, please check for conflicting plugins.`)
    }
    this.Commands.set(name, theCommand)
  }
}

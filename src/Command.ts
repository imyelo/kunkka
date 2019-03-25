import * as minimist from 'minimist'

import Cli from './Cli'
import Hooks from './Hooks'

export default class Command {
  static hidden: boolean = false
  static description: string = ''
  static usage: string = ''
  static examples: string[] = []
  static args: any = {} // rule of minimist options

  rawArgs: any[]
  config: any
  hooks: Hooks
  presets: any[]
  cli: Cli

  constructor ({ rawArgs, config, hooks, presets, cli }: { rawArgs: any[], config: any, hooks: Hooks, presets: any[], cli: Cli }) {
    this.rawArgs = rawArgs
    this.config = config
    this.hooks = hooks
    this.presets = presets
    this.cli = cli
  }

  parse ({ args }: { args: minimist.Opts }) {
    return minimist(this.rawArgs, args)
  }

  async run () {
    throw new Error('You need to implement it')
  }
}

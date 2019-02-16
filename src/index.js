const minimist = require('minimist')
const cosmiconfig = require('cosmiconfig')

class PluginAPI {
  constructor ({ hooks, commands }) {
    this.hooks = hooks
    this.commands = commands
  }

  hook (name, fn) {
    this.hooks.add(name, fn)
  }

  registerCommand (name, Command) {
    if (this.commands.has(name)) {
      throw new Error(`Command "${name}" has been registered twice, please check for conflicting plugins.`)
    }
    this.commands.set(name, Command)
  }
}

class Command {
  static hidden = false
  static description = ''
  static usage = ''
  static examples = []
  static args = {} // minimist options

  constructor ({ rawArgs }) {
    this.rawArgs = rawArgs
  }

  parse ({ args }) {
    return minimist(this.rawArgs, args)
  }

  async run () {
    throw new Error('You need to implement it')
  }
}

class Hooks {
  constructor() {
    this.hooks = new Map()
  }

  add(name, fn) {
    const hooks = this.get(name)
    hooks.add(fn)
    this.hooks.set(name, hooks)
  }

  get(name) {
    return this.hooks.get(name) || new Set()
  }

  async invoke(name, ...args) {
    for (const hook of this.get(name)) {
      await hook(...args)
    }
  }
}

class VCli {
  static app = 'vcli'
  static PluginAPI = PluginAPI

  args = []
  config = {}
  commands = new Map()
  hooks = new Hooks()
  plugins = new Set()

  constructor () {
    this.init()
  }

  async init() {
    const Cli = this.constructor

    const rawArgs = process.argv.slice(2)
    const args = minimist(rawArgs)
    const commandName = args._[0]

    const rc = await cosmiconfig(Cli.app).search()
    if (rc && rc.config) {
      this.config = rc.config
    }

    const { hooks, commands, plugins } = this
    const api = new Cli.PluginAPI({ hooks, commands })

    ;(this.config.plugins || []).forEach((plugin) => plugins.add(plugin))

    for (let plugin of this.plugins) {
      // TODO: resolve plugin
      // TODO: read options
      // plugin.apply(api, options)
      plugin.apply(api, {})
    }

    await hooks.invoke('prerun')
    await this.run(commandName, rawArgs)
    await hooks.invoke('exit')
  }

  async run(name, rawArgs) {
    if (!this.commands.has(name)) {
      throw new Error(`Command "${name}" has not been registered.`)
    }
    const Command = this.commands.get(name)
    const command = new Command({ rawArgs })
    await command.run()
  }
}

exports.PluginAPI = PluginAPI
exports.Command = Command
exports.VCli = VCli

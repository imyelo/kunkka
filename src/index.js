const minimist = require('minimist')
const cosmiconfig = require('cosmiconfig')
const importCwd = require('import-cwd')

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

  constructor ({ rawArgs, config, hooks }) {
    this.rawArgs = rawArgs
    this.config = config
    this.hooks = hooks
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
    let config = {}
    if (rc && rc.config) {
      config = rc.config
    }

    const { hooks, commands, plugins } = this
    const api = new Cli.PluginAPI({ hooks, commands })

    ;(config.plugins || []).forEach((plugin) => {
      let options
      if (Array.isArray(plugin)) {
        [plugin, options] = plugin
      }
      plugins.add([importCwd(plugin), options])
    })

    for (let [plugin, options] of this.plugins) {
      plugin.apply(api, options)
    }

    await hooks.invoke('prerun')
    await this.run(commandName, { rawArgs, config })
    await hooks.invoke('exit')
  }

  async run(name, { rawArgs, config }) {
    if (!this.commands.has(name)) {
      throw new Error(`Command "${name}" has not been registered.`)
    }
    const Command = this.commands.get(name)
    const command = new Command({ rawArgs, config, hooks: this.hooks })
    await command.run()
  }
}

exports.PluginAPI = PluginAPI
exports.Command = Command
exports.VCli = VCli

const minimist = require('minimist')
const cosmiconfig = require('cosmiconfig')

class VCli {
  static app = 'vcli'

  args = []
  config = {}

  constructor () {
    this.init()
  }

  async init() {
    this.args = minimist(process.argv.slice(2))

    const commandName = this.args._[0]

    const rc = await cosmiconfig(this.constructor.app).search()
    if (rc && rc.config) {
      this.config = rc.config
    }

    const commands = new Map()
    const hooks = new Hooks()
    const api = new PluginAPI({ hooks, commands })

    for (let plugin of this.config.plugins) {
      // TODO: resolve plugin
      // TODO: read options
      // plugin.apply(api, options)
      plugin.apply(api, {})
    }

    await hooks.invoke('prerun')
    await this.run(commandName, this.args)
  }

  async run(name, args) {

  }
}

class Command {
  static hidden = false
  static description = ''
  static usage = ''
  static examples = []
  static args = []
  static flags = {}

  parse ({ args, flags }) {
    // TODO
  }

  async run () {
    throw new Error('You need to implement it')
  }
}

class PluginAPI {
  constructor ({ hooks, commands }) {
    this.hooks = hooks
    this.commands = commands
  }

  hook (name, fn) {
    this.hooks.add(name, fn)
  }

  registerCommand (Command) {
    const { name } = Command
    if (Map.has(name)) {
      throw new Error(`Command "${name}" has been registered twice, please check for conflicting plugins.`)
    }
    this.commands.set(name, Command)
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

exports.VCli = VCli
exports.Command = Command

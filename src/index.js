const minimist = require('minimist')
const cosmiconfig = require('cosmiconfig')
const importCwd = require('import-cwd')
const omit = require('omit')
const foreach = require('foreach')

const parseShortcut = function (line) {
  let module, options
  if (Array.isArray(line)) {
    [module, options] = line
  } else {
    module = line
  }
  return [importCwd(module), options]
}

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

class PresetAPI {}

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
  static PresetAPI = PresetAPI

  commands = new Map()
  hooks = new Hooks()
  plugins = []

  constructor () {
    this._init()
  }

  async init () {}

  async _init() {
    const Cli = this.constructor

    /**
     * apply custom init fn
     */
    await this.init()

    /**
     * parsing command name
     */
    const rawArgs = process.argv.slice(2)
    const args = minimist(rawArgs)
    const commandName = args._[0]

    /**
     * load config
     */
    const rc = await cosmiconfig(Cli.app).search()

    const { hooks, commands, plugins } = this
    const pluginApi = new Cli.PluginAPI({ hooks, commands })
    const presetApi = new Cli.PresetAPI()

    /**
     * apply presets
     *
     * Step:
     *
     *  1. lookup presets (including the local config)
     *  2. merged plugins
     *  3. merged pure configs
     *
     */
    let presets = ((local) => {
      let presets = []
      function lookup (config) {
        if (Array.isArray(config.presets)) {
          foreach(config.presets, (p) => {
            let [module, options] = parseShortcut(p)
            let preset = module.apply(presetApi, options)
            lookup(preset)
          })
        }
        presets.push(config)
      }
      lookup(local)
      return presets
    })(rc && rc.config ? rc.config : {})

    foreach(presets, (preset) => {
      foreach(preset.plugins || [], (line) => {
        plugins.push(parseShortcut(line))
      })
    })

    const pure = omit(['presets', 'plugins'])
    const config = presets.reduce((memo, next) => {
      return {
        ...pure(memo),
        ...pure(next),
      }
    }, {})

    /**
     * apply plugins
     */
    for (let [plugin, options] of new Set(this.plugins)) {
      plugin.apply(pluginApi, options)
    }

    /**
     * run
     */
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
exports.PresetAPI = PresetAPI
exports.Command = Command
exports.VCli = VCli

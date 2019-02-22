import * as minimist from 'minimist'
import * as cosmiconfig from 'cosmiconfig'
import * as importCwd from 'import-cwd'
import * as omit from 'omit'
import * as foreach from 'foreach'
import * as merge from 'merge-deep'
import EnvfilePlugin from './EnvfilePlugin'

const parseShortcut = function (line: string | [string] | [string, any]) {
  let name, options
  if (Array.isArray(line)) {
    [name, options] = line
  } else {
    name = line
  }
  return {
    module: importCwd(name),
    name,
    options,
  }
}

const BUILTIN_PLUGINS = [
  [EnvfilePlugin],
]

class Hooks {
  hooks: Map<string, Set<Function>>

  constructor() {
    this.hooks = new Map()
  }

  add(name: string, fn: Function) {
    const hooks = this.get(name)
    hooks.add(fn)
    this.hooks.set(name, hooks)
  }

  get(name: string) {
    return this.hooks.get(name) || new Set()
  }

  async invoke(name: string, ...args: any[]) {
    for (const hook of this.get(name)) {
      await hook(...args)
    }
  }
}

export class PluginAPI {
  hooks: Hooks
  commands: Map<string, Command>

  constructor ({ hooks, commands }: { hooks: Hooks, commands: Map<string, Command> }) {
    this.hooks = hooks
    this.commands = commands
  }

  hook (name: string, fn: Function) {
    this.hooks.add(name, fn)
  }

  registerCommand (name: string, Command: Command) {
    if (this.commands.has(name)) {
      throw new Error(`Command "${name}" has been registered twice, please check for conflicting plugins.`)
    }
    this.commands.set(name, Command)
  }
}

export class PresetAPI {}

export class Command {
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

export class Cli {
  static app: string = 'kunkka'
  static PluginAPI: typeof PluginAPI = PluginAPI
  static PresetAPI: typeof PresetAPI = PresetAPI
  static builtinPlugins: Array<any> = BUILTIN_PLUGINS

  commands = new Map()
  hooks = new Hooks()
  plugins = new Map()
  presets: any[] = []

  constructor () {
    this._init()
  }

  async init () {}

  async _init() {
    const constructor = this.constructor as typeof Cli

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
    const rc = await cosmiconfig(constructor.app).search()

    const { hooks, commands } = this
    const pluginApi = new constructor.PluginAPI({ hooks, commands })
    const presetApi = new constructor.PresetAPI()

    /**
     * insert built-in plugins
     */
    constructor.builtinPlugins.forEach(([plugin, options]) => {
      this.plugins.set(plugin, options)
    })

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
    this.presets = ((local: any) => {
      let presets: any[] = []
      function lookup (config: { presets: any[] }) {
        if (Array.isArray(config.presets)) {
          foreach(config.presets, (p: any) => {
            let { module, options } = parseShortcut(p)
            let preset = module.apply(presetApi, options)
            lookup(preset)
          })
        }
        presets.push(config)
      }
      lookup(local)
      return presets
    })(rc && rc.config ? rc.config : {})

    foreach(this.presets, (preset: { plugins: any[]}) => {
      foreach(preset.plugins || [], (line: string | [string] | [string, any]) => {
        let { module, options } = parseShortcut(line)
        this.plugins.set(module, options)
      })
    })

    const purify = omit(['presets', 'plugins'])
    const config = this.presets.reduce((memo, next) => {
      return merge(purify(memo),purify(next))
    }, {})

    /**
     * apply plugins
     */
    for (let [plugin, options] of this.plugins) {
      await plugin.apply(pluginApi, options)
    }

    /**
     * run
     */
    await hooks.invoke('prerun')
    await this.run(commandName, { rawArgs, config })
    await hooks.invoke('exit')
  }

  async run(name: string, { rawArgs, config }: {rawArgs: any, config: any}) {
    if (!this.commands.has(name)) {
      throw new Error(`Command "${name}" has not been registered.`)
    }
    const Command = this.commands.get(name)
    const command = new Command({
      rawArgs,
      config,
      hooks: this.hooks,
      presets: this.presets,
      cli: this,
    })
    await command.run()
  }
}

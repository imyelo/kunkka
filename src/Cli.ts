import * as minimist from 'minimist'
import * as cosmiconfig from 'cosmiconfig'
import * as foreach from 'foreach'
import * as omit from 'omit'
import * as merge from 'merge-deep'

import Hooks from './Hooks'
import Command from './Command'
import PluginAPI from './PluginAPI'
import PresetAPI from './PresetAPI'
import { parseShortcut } from './utils'

import EnvfilePlugin from './plugins/EnvfilePlugin'

const BUILTIN_PLUGINS = [
  [EnvfilePlugin],
]

export default class Cli {
  static app: string = 'kunkka'
  static PluginAPI: typeof PluginAPI = PluginAPI
  static PresetAPI: typeof PresetAPI = PresetAPI
  static builtinPlugins: Array<any> = BUILTIN_PLUGINS

  Commands: Map<string, typeof Command> = new Map()
  hooks: Hooks = new Hooks()
  plugins: Map<Function, any> = new Map()
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

    const { hooks, Commands } = this
    const pluginApi = new constructor.PluginAPI({ hooks, Commands })
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

    foreach(this.presets, (preset: { plugins: any[] }) => {
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

  async run(name: string, { rawArgs, config }: { rawArgs: any, config: any }) {
    if (!this.Commands.has(name)) {
      throw new Error(`Command "${name}" has not been registered.`)
    }
    const theCommand = this.Commands.get(name) as typeof Command
    const command = new theCommand({
      rawArgs,
      config,
      hooks: this.hooks,
      presets: this.presets,
      cli: this,
    })
    await command.run()
  }
}

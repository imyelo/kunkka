const minimist = require('minimist')
const cosmiconfig = require('cosmiconfig')

class VCli {
  static app = 'vcli'

  constructor () {
    this.init()
  }

  async init() {
    this.args = minimist(process.argv.slice(2))

    const command = this.args._[0]

    const rc = await cosmiconfig(this.constructor.app).search()
    if (rc && rc.config) {
      this.config = rc.config
    }

    for (let plugin of this.config.plugins) {
      // plugin.apply(api, options)
    }

    this.run(command, this.args)
  }

  async run(name, args) {

  }
}

class Command {

}

class PluginAPI {
  registerCommand () {

  }
  hook () {

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

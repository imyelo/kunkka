export default class Hooks {
  private hooks: Map<string, Set<Function>>

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

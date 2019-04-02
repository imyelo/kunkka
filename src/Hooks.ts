export default class Hooks<Signal> {
  private hooks: Map<Signal, Set<Function>>

  constructor() {
    this.hooks = new Map()
  }

  add(name: Signal, fn: Function) {
    const hooks = this.get(name)
    hooks.add(fn)
    this.hooks.set(name, hooks)
  }

  get(name: Signal) {
    return this.hooks.get(name) || new Set()
  }

  async invoke(name: Signal, ...args: any[]) {
    for (const hook of this.get(name)) {
      await hook(...args)
    }
  }
}

import test from 'ava'
import * as fs from 'fs-extra'
import * as sinon from 'sinon'
import { Cli, Command } from '../lib'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

async function macro (t: any, setup: Function, testing: Function) {
  type Signal = 'foo'

  const spy = sinon.spy()

  await setup(t)

  class BuildCommand extends Command<Signal> {
    async run () {
      this.hooks.invoke('foo', spy)
    }
  }

  class MyCli extends Cli<never> {
    static app = 'cli'
  }

  await run(t, MyCli, BuildCommand, 'build')

  await testing(t, spy)

  t.pass()
}

test.serial('load plugins alone', macro, async (t: any) => {
  const { cwd } = t.context
  await fs.writeFile(`${cwd}/.clirc`, `{
    "plugins": [
      "./plugin.js"
    ]
  }`)
  await fs.writeFile(`${cwd}/plugin.js`, `module.exports = {
    apply (api, options) {
      api.hook('foo', (fn) => {
        fn('bar', options)
      })
    },
  }`)
}, async (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledOnceWithExactly('bar', void 0), 'plugin should be applied with options')
})

test.serial('load plugins with empty options', macro, async (t: any) => {
  const { cwd } = t.context
  await fs.writeFile(`${cwd}/.clirc`, `{
    "plugins": [
      ["./plugin.js"]
    ]
  }`)
  await fs.writeFile(`${cwd}/plugin.js`, `module.exports = {
    apply (api, options) {
      api.hook('foo', (fn) => {
        fn('bar', options)
      })
    },
  }`)
}, (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledOnceWithExactly('bar', void 0), 'plugin should be applied with options')
})

test.serial('load plugins with options', macro, async (t: any) => {
  const { cwd } = t.context
  await fs.writeFile(`${cwd}/.clirc`, `{
    "plugins": [
      ["./plugin.js", {
        "foo": "bar"
      }]
    ]
  }`)
  await fs.writeFile(`${cwd}/plugin.js`, `module.exports = {
    apply (api, options) {
      api.hook('foo', (fn) => {
        fn('bar', options)
      })
    },
  }`)
}, (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledOnceWith('bar', { foo: 'bar' }), 'plugin should be applied with options')
})

test.serial('load multiple plugins', macro, async (t: any) => {
  const { cwd } = t.context
  await fs.writeFile(`${cwd}/.clirc`, `{
    "plugins": [
      "./plugin-a.js",
      "./plugin-b.js"
    ]
  }`)
  await fs.writeFile(`${cwd}/plugin-a.js`, `module.exports = {
    apply (api, options) {
      api.hook('foo', (fn) => {
        fn('bar', options)
      })
    },
  }`)
  await fs.writeFile(`${cwd}/plugin-b.js`, `module.exports = {
    apply (api, options) {
      api.hook('foo', (fn) => {
        fn('baz', options)
      })
    },
  }`)
}, (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledTwice)
  t.true(spy.calledWithExactly('bar', void 0), 'plugin should be applied with options')
  t.true(spy.calledWithExactly('baz', void 0), 'plugin should be applied with options')
})

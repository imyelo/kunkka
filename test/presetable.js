import fs from 'fs-extra'
import test from 'ava'
import sinon from 'sinon'
import { VCli, Command } from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

async function macro (t, setup, testing) {
  const spy = sinon.spy()

  await setup(t)

  class BuildCommand extends Command {
    run () {
      spy(this.config)
    }
  }

  class Cli extends VCli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build')
  await testing(t, spy)

  t.pass()
}

test.serial('load presets alone', macro, async (t) => {
  const { cwd } = t.context
  await fs.writeFile(`${cwd}/.clirc`, `{
    "presets": [
      "./preset.js"
    ],
    "plugins": [
      "./plugin-a.js"
    ]
  }`)
  await fs.writeFile(`${cwd}/preset.js`, `module.exports = {
    apply (api) {
      return {
        foo: 'bar',
        plugins: [
          './plugin-b.js',
        ],
      }
    },
  }`)
  await fs.writeFile(`${cwd}/plugin-a.js`, `module.exports = {
    apply () {}
  }`)
  await fs.writeFile(`${cwd}/plugin-b.js`, `module.exports = {
    apply () {}
  }`)
}, async (t, spy) => {
  t.true(spy.calledWithMatch({ foo: 'bar' }))
  t.true(spy.calledWithMatch({ presets: ['./preset.js'] }))
  t.true(spy.calledWithMatch({ plugins: ['./plugin-a.js', './plugin-b.js'] }))
})

// test.serial('load plugins with empty options', macro, async (t) => {
//   const { cwd } = t.context
//   await fs.writeFile(`${cwd}/.clirc`, `{
//     "plugins": [
//       ["./plugin.js"]
//     ]
//   }`)
//   await fs.writeFile(`${cwd}/plugin.js`, `module.exports = {
//     apply (api, options) {
//       api.hook('foo', (fn) => {
//         fn('bar', options)
//       })
//     },
//   }`)
// }, (t, spy) => {
//   t.true(spy.calledOnceWithExactly('bar', void 0), 'plugin should be applied with options')
// })

// test.serial('load plugins with options', macro, async (t) => {
//   const { cwd } = t.context
//   await fs.writeFile(`${cwd}/.clirc`, `{
//     "plugins": [
//       ["./plugin.js", {
//         "foo": "bar"
//       }]
//     ]
//   }`)
//   await fs.writeFile(`${cwd}/plugin.js`, `module.exports = {
//     apply (api, options) {
//       api.hook('foo', (fn) => {
//         fn('bar', options)
//       })
//     },
//   }`)
// }, (t, spy) => {
//   t.true(spy.calledOnceWith('bar', { foo: 'bar' }), 'plugin should be applied with options')
// })

// test.serial('load multiple plugins', macro, async (t) => {
//   const { cwd } = t.context
//   await fs.writeFile(`${cwd}/.clirc`, `{
//     "plugins": [
//       "./plugin-a.js",
//       "./plugin-b.js"
//     ]
//   }`)
//   await fs.writeFile(`${cwd}/plugin-a.js`, `module.exports = {
//     apply (api, options) {
//       api.hook('foo', (fn) => {
//         fn('bar', options)
//       })
//     },
//   }`)
//   await fs.writeFile(`${cwd}/plugin-b.js`, `module.exports = {
//     apply (api, options) {
//       api.hook('foo', (fn) => {
//         fn('baz', options)
//       })
//     },
//   }`)
// }, (t, spy) => {
//   t.true(spy.calledTwice)
//   t.true(spy.calledWithExactly('bar', void 0), 'plugin should be applied with options')
//   t.true(spy.calledWithExactly('baz', void 0), 'plugin should be applied with options')
// })

import test from 'ava'
import * as fs from 'fs-extra'
import * as sinon from 'sinon'
import { Cli, Command } from '../lib'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

interface MacroSpy {
  config: sinon.SinonSpy
  presets: sinon.SinonSpy
  plugins: sinon.SinonSpy
}

async function macro (t: any, setup: Function, testing: Function) {
  const spy: MacroSpy = {
    config: sinon.spy(),
    presets: sinon.spy(),
    plugins: sinon.spy(),
  }

  await setup(t)

  class BuildCommand extends Command {
    async run () {
      await this.hooks.invoke('spy', spy.plugins)
      spy.config(this.config)
      spy.presets(this.presets)
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await run(t, MyCli, BuildCommand, 'build')
  await testing(t, spy)

  t.pass()
}

test.serial('load presets alone', macro, async (t: any) => {
  const { cwd } = t.context
  await fs.writeFile(`${cwd}/.clirc`, `{
    "presets": [
      "./preset-a.js",
      "./preset-b.js"
    ],
    "plugins": [
      "./plugin-a.js",
      "./plugin-b.js"
    ]
  }`)
  await fs.writeFile(`${cwd}/preset-a.js`, `module.exports = {
    apply: (api) => ({
      foo: 'baz',
      qux: 'nyc',
      presets: [
        './preset-c.js',
        './preset-d.js',
      ],
      plugins: [
        './plugin-c.js',
        './plugin-d.js',
      ],
    }),
  }`)
  await fs.writeFile(`${cwd}/preset-b.js`, `module.exports = {
    apply: (api) => ({
      foo: 'bar',
      plugins: [
        './plugin-e.js',
      ],
    }),
  }`)
  await fs.writeFile(`${cwd}/preset-c.js`, `module.exports = {
    apply: (api) => ({
      plugins: [
        './plugin-f.js',
      ],
    }),
  }`)
  await fs.writeFile(`${cwd}/preset-d.js`, `module.exports = {
    apply: (api) => ({
      plugins: [
        './plugin-g.js',
      ],
    }),
  }`)
  await fs.writeFile(`${cwd}/plugin-a.js`, `module.exports = {
    apply: (api) => api.hook('spy', spy => spy('a')),
  }`)
  await fs.writeFile(`${cwd}/plugin-b.js`, `module.exports = {
    apply: (api) => api.hook('spy', spy => spy('b')),
  }`)
  await fs.writeFile(`${cwd}/plugin-c.js`, `module.exports = {
    apply: (api) => api.hook('spy', spy => spy('c')),
  }`)
  await fs.writeFile(`${cwd}/plugin-d.js`, `module.exports = {
    apply: (api) => api.hook('spy', spy => spy('d')),
  }`)
  await fs.writeFile(`${cwd}/plugin-e.js`, `module.exports = {
    apply: (api) => api.hook('spy', spy => spy('e')),
  }`)
  await fs.writeFile(`${cwd}/plugin-f.js`, `module.exports = {
    apply: (api) => api.hook('spy', spy => spy('f')),
  }`)
  await fs.writeFile(`${cwd}/plugin-g.js`, `module.exports = {
    apply: (api) => api.hook('spy', spy => spy('g')),
  }`)
}, async (t: any, spy: MacroSpy) => {
  t.true(spy.config.calledWithMatch({ foo: 'bar', qux: 'nyc' }))
  t.deepEqual(spy.presets.getCall(0).args[0], [
    {
      plugins: ['./plugin-f.js'],
    },
    {
      plugins: ['./plugin-g.js'],
    },
    {
      foo: 'baz',
      qux: 'nyc',
      presets: ['./preset-c.js', './preset-d.js'],
      plugins: ['./plugin-c.js', './plugin-d.js'],
    },
    {
      foo: 'bar',
      plugins: ['./plugin-e.js'],
    },
    {
      presets: ['./preset-a.js', './preset-b.js'],
      plugins: ['./plugin-a.js', './plugin-b.js'],
    },
  ])
  t.deepEqual(spy.plugins.args, [['f'], ['g'], ['c'], ['d'], ['e'], ['a'], ['b']])
})

test.serial('load presets with deep objects', macro, async (t: any) => {
  const { cwd } = t.context
  await fs.writeFile(`${cwd}/.clirc`, `{
    "foo": {
      "b": "baz",
      "qux": {
        "a": "corge"
      }
    },
    "presets": [
      "./preset-a.js"
    ]
  }`)
  await fs.writeFile(`${cwd}/preset-a.js`, `module.exports = {
    apply: (api) => ({
      foo: {
        a: 'baz',
      },
      presets: [
        './preset-b.js',
      ],
    }),
  }`)
  await fs.writeFile(`${cwd}/preset-b.js`, `module.exports = {
    apply: (api) => ({
      foo: {
        a: 'bar',
        b: 'bar',
        c: 'bar',
        qux: {
          a: 'nyc',
          b: 'nyc',
        },
      },
    }),
  }`)
}, async (t: any, spy: MacroSpy) => {
  t.deepEqual(spy.config.getCall(0).args[0], {
    foo: {
      a: 'baz',
      b: 'baz',
      c: 'bar',
      qux: {
        a: 'corge',
        b: 'nyc',
      },
    },
  })
})

test.serial('load presets with duplicated plugins', macro, async (t: any) => {
  const { cwd } = t.context
  await fs.writeFile(`${cwd}/.clirc`, `{
    "presets": [
      "./preset-a.js"
    ],
    "plugins": [
      ["./plugin-a.js", { "id": 1 }],
      ["./plugin-c.js", { "id": 1 }],
    ]
  }`)
  await fs.writeFile(`${cwd}/preset-a.js`, `module.exports = {
    apply: (api) => ({
      "plugins": [
        ["./plugin-a.js", { id: 2 }],
        ["./plugin-b.js", { id: 2 }],
      ],
    }),
  }`)
  await fs.writeFile(`${cwd}/plugin-a.js`, `module.exports = {
    apply: (api, options) => api.hook('spy', spy => spy('a', options)),
  }`)
  await fs.writeFile(`${cwd}/plugin-b.js`, `module.exports = {
    apply: (api, options) => api.hook('spy', spy => spy('b', options)),
  }`)
  await fs.writeFile(`${cwd}/plugin-c.js`, `module.exports = {
    apply: (api, options) => api.hook('spy', spy => spy('c', options)),
  }`)
}, async (t: any, spy: MacroSpy) => {
  t.deepEqual(spy.plugins.args, [['a', { id: 1 }], ['b', { id: 2 }], ['c', { id: 1 }]])
})

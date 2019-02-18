import fs from 'fs-extra'
import test from 'ava'
import sinon from 'sinon'
import { VCli, Command } from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

async function macro (t, setup, testing) {
  const spy = {
    config: sinon.spy(),
    hook: sinon.spy(),
  }

  await setup(t)

  class BuildCommand extends Command {
    async run () {
      await this.hooks.invoke('spy', spy.hook)
      spy.config(this.config)
    }
  }

  class Cli extends VCli {
    static app = 'cli'

    init () {
      this.hooks.add('foobar', (message) => spy.hook(message))
    }
  }

  await run(t, Cli, BuildCommand, 'build')
  await testing(t, spy)

  t.pass()
}

test.serial('load presets alone', macro, async (t) => {
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
    name: 'a',
    apply: (api) => api.hook('spy', spy => spy('a')),
  }`)
  await fs.writeFile(`${cwd}/plugin-b.js`, `module.exports = {
    name: 'b',
    apply: (api) => api.hook('spy', spy => spy('b')),
  }`)
  await fs.writeFile(`${cwd}/plugin-c.js`, `module.exports = {
    name: 'c',
    apply: (api) => api.hook('spy', spy => spy('c')),
  }`)
  await fs.writeFile(`${cwd}/plugin-d.js`, `module.exports = {
    name: 'd',
    apply: (api) => api.hook('spy', spy => spy('d')),
  }`)
  await fs.writeFile(`${cwd}/plugin-e.js`, `module.exports = {
    name: 'e',
    apply: (api) => api.hook('spy', spy => spy('e')),
  }`)
  await fs.writeFile(`${cwd}/plugin-f.js`, `module.exports = {
    name: 'f',
    apply: (api) => api.hook('spy', spy => spy('f')),
  }`)
  await fs.writeFile(`${cwd}/plugin-g.js`, `module.exports = {
    name: 'g',
    apply: (api) => api.hook('spy', spy => spy('g')),
  }`)
}, async (t, spy) => {
  t.true(spy.config.calledWithMatch({ foo: 'bar', qux: 'nyc' }))
  t.deepEqual(spy.hook.args, [['f'], ['g'], ['c'], ['d'], ['e'], ['a'], ['b']])
})

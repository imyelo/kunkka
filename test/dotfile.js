import fs from 'fs-extra'
import test from 'ava'
import sinon from 'sinon'
import { VCli, Command } from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(async (t) => {
  await teardown(t)

  ;['AA', 'BB', 'CC', 'DD'].forEach((name) => {
    delete process.env[name]
  })
})

async function macro (t, setup, testing) {
  const spy = sinon.spy()

  await setup(t)

  class BuildCommand extends Command {
    run () {
      spy([
        process.env.AA,
        process.env.BB,
        process.env.CC,
        process.env.DD,
      ])
    }
  }

  class Cli extends VCli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build')

  await testing(t, spy)

  t.pass()
}

test.serial('load env files by default', macro, async (t) => {
  const { cwd } = t.context
  process.env.NODE_ENV = ''
  await fs.writeFile(`${cwd}/.env`, `
  AA = 1
  BB = 1
  CC = 1
  DD = 1
  `)
  await fs.writeFile(`${cwd}/.env.local`, `
  BB = 2
  CC = 2
  DD = 2
  `)
  await fs.writeFile(`${cwd}/.env.development`, `
  CC = 3
  DD = 3
  `)
  await fs.writeFile(`${cwd}/.env.development.local`, `
  DD = 4
  `)
}, async (t, spy) => {
  t.deepEqual(spy.getCall(0).args[0], ['1', '2', '3', '4'])
})

test.serial('load env files with specify env', macro, async (t) => {
  const { cwd } = t.context
  process.env.NODE_ENV = 'production'
  await fs.writeFile(`${cwd}/.env`, `
  AA = 1
  `)
  await fs.writeFile(`${cwd}/.env.local`, `
  BB = 2
  `)
  await fs.writeFile(`${cwd}/.env.production`, `
  CC = 3
  `)
  await fs.writeFile(`${cwd}/.env.production.local`, `
  DD = 4
  `)
}, async (t, spy) => {
  t.deepEqual(spy.getCall(0).args[0], ['1', '2', '3', '4'])
})

test.serial('load env files without `.env`', macro, async (t) => {
  const { cwd } = t.context
  process.env.NODE_ENV = ''
  await fs.writeFile(`${cwd}/.env.local`, `
  BB = 2
  CC = 2
  DD = 2
  `)
  await fs.writeFile(`${cwd}/.env.development`, `
  CC = 3
  DD = 3
  `)
  await fs.writeFile(`${cwd}/.env.development.local`, `
  DD = 4
  `)
}, async (t, spy) => {
  t.deepEqual(spy.getCall(0).args[0], [void 0, '2', '3', '4'])
})

test.serial('load env files without `.env.local`', macro, async (t) => {
  const { cwd } = t.context
  process.env.NODE_ENV = ''
  await fs.writeFile(`${cwd}/.env`, `
  AA = 1
  BB = 1
  CC = 1
  DD = 1
  `)
  await fs.writeFile(`${cwd}/.env.development`, `
  CC = 3
  DD = 3
  `)
  await fs.writeFile(`${cwd}/.env.development.local`, `
  DD = 4
  `)
}, async (t, spy) => {
  t.deepEqual(spy.getCall(0).args[0], ['1', '1', '3', '4'])
})

test.serial('load env files without `.env.{NODE_ENV}`', macro, async (t) => {
  const { cwd } = t.context
  process.env.NODE_ENV = ''
  await fs.writeFile(`${cwd}/.env`, `
  AA = 1
  BB = 1
  CC = 1
  DD = 1
  `)
  await fs.writeFile(`${cwd}/.env.local`, `
  BB = 2
  CC = 2
  DD = 2
  `)
  await fs.writeFile(`${cwd}/.env.development.local`, `
  DD = 4
  `)
}, async (t, spy) => {
  t.deepEqual(spy.getCall(0).args[0], ['1', '2', '2', '4'])
})

test.serial('load env files without `.env.{NODE_ENV}.local`', macro, async (t) => {
  const { cwd } = t.context
  process.env.NODE_ENV = ''
  await fs.writeFile(`${cwd}/.env`, `
  AA = 1
  BB = 1
  CC = 1
  DD = 1
  `)
  await fs.writeFile(`${cwd}/.env.local`, `
  BB = 2
  CC = 2
  DD = 2
  `)
  await fs.writeFile(`${cwd}/.env.development`, `
  CC = 3
  DD = 3
  `)
}, async (t, spy) => {
  t.deepEqual(spy.getCall(0).args[0], ['1', '2', '3', '3'])
})

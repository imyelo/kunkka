import fs from 'fs-extra'
import test from 'ava'
import sinon from 'sinon'
import { VCli, Command } from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

async function macro (t, [filename, content, expected]) {
  const { cwd } = t.context
  const spy = sinon.spy()

  fs.writeFileSync(`${cwd}/${filename}`, content)

  class BuildCommand extends Command {
    run () {
      spy(this.config)
    }
  }

  class Cli extends VCli {
    static app = 'cli'
  }

  await run(t, Cli, BuildCommand, 'build')

  t.true(spy.calledWith(expected), 'config should be parsed')

  t.pass()
}

test.serial('parse .{appname}rc using json', macro, [
  '.clirc',
  '{ "name": "hi" }',
  { name: 'hi' },
])

test.serial('parse .{appname}rc using yaml', macro, [
  '.clirc',
  'name: hi\n',
  { name: 'hi' },
])

test.serial('parse .{appname}rc.json', macro, [
  '.clirc.json',
  '{ "name": "hi" }',
  { name: 'hi' },
])

test.serial('parse .{appname}rc.yaml', macro, [
  '.clirc.yaml',
  'name: hi\n',
  { name: 'hi' },
])

test.serial('parse .{appname}rc.yml', macro, [
  '.clirc.yml',
  'name: hi\n',
  { name: 'hi' },
])

test.serial('parse .{appname}rc.js', macro, [
  '.clirc.js',
  'module.exports = { "name": "hi" }',
  { name: 'hi' },
])

test.serial('parse {appname}.config.js', macro, [
  'cli.config.js',
  'module.exports = { name: "hi" }',
  { name: 'hi' },
])

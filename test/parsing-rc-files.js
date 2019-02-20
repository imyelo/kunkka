import fs from 'fs-extra'
import test from 'ava'
import sinon from 'sinon'
import { Cli, Command } from '..'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

async function macro (t, [filename, content], verify) {
  const { cwd } = t.context
  const spy = sinon.spy()

  await fs.writeFile(`${cwd}/${filename}`, content)

  class BuildCommand extends Command {
    run () {
      spy(this.config)
    }
  }

  class MyCli extends Cli {
    static app = 'cli'
  }

  await run(t, MyCli, BuildCommand, 'build')

  await verify(t, spy)

  t.pass()
}

test.serial('parse .{appname}rc using json', macro, [
  '.clirc',
  '{ "name": "hi" }',
], (t, spy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc using yaml', macro, [
  '.clirc',
  'name: hi\n',
], (t, spy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc.json', macro, [
  '.clirc.json',
  '{ "name": "hi" }',
], (t, spy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc.yaml', macro, [
  '.clirc.yaml',
  'name: hi\n',
], (t, spy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc.yml', macro, [
  '.clirc.yml',
  'name: hi\n',
], (t, spy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc.js', macro, [
  '.clirc.js',
  'module.exports = { "name": "hi", "foo": function () { return "bar" } }',
], (t, spy) => {
  t.true(spy.calledWithMatch({ name: 'hi' }), 'config should be parsed')
  t.is(spy.lastCall.lastArg.foo(), 'bar')
})

test.serial('parse {appname}.config.js', macro, [
  'cli.config.js',
  'module.exports = { "name": "hi", "foo": function () { return "bar" } }',
], (t, spy) => {
  t.true(spy.calledWithMatch({ name: 'hi' }), 'config should be parsed')
  t.is(spy.lastCall.lastArg.foo(), 'bar')
})

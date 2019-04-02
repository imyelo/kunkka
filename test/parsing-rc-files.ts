import test from 'ava'
import * as fs from 'fs-extra'
import * as sinon from 'sinon'
import { Cli, Command } from '../lib'
import { setup, teardown, run } from './helpers/common'

test.beforeEach(setup)

test.afterEach.always(teardown)

async function macro (t: any, [filename, content]: [string, string], verify: Function) {
  const { cwd } = t.context
  const spy = sinon.spy()

  await fs.writeFile(`${cwd}/${filename}`, content)

  class BuildCommand extends Command<never> {
    async run () {
      spy(this.config)
    }
  }

  class MyCli extends Cli<never> {
    static app = 'cli'
  }

  await run(t, MyCli, BuildCommand, 'build')

  await verify(t, spy)

  t.pass()
}

test.serial('parse .{appname}rc using json', macro, [
  '.clirc',
  '{ "name": "hi" }',
], (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc using yaml', macro, [
  '.clirc',
  'name: hi\n',
], (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc.json', macro, [
  '.clirc.json',
  '{ "name": "hi" }',
], (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc.yaml', macro, [
  '.clirc.yaml',
  'name: hi\n',
], (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc.yml', macro, [
  '.clirc.yml',
  'name: hi\n',
], (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledWith({ name: 'hi' }), 'config should be parsed')
})

test.serial('parse .{appname}rc.js', macro, [
  '.clirc.js',
  'module.exports = { "name": "hi", "foo": function () { return "bar" } }',
], (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledWithMatch({ name: 'hi' }), 'config should be parsed')
  t.is(spy.lastCall.lastArg.foo(), 'bar')
})

test.serial('parse {appname}.config.js', macro, [
  'cli.config.js',
  'module.exports = { "name": "hi", "foo": function () { return "bar" } }',
], (t: any, spy: sinon.SinonSpy) => {
  t.true(spy.calledWithMatch({ name: 'hi' }), 'config should be parsed')
  t.is(spy.lastCall.lastArg.foo(), 'bar')
})

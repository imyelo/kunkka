import test from 'ava'
import sinon from 'sinon'
import { VCli, PluginAPI, Command } from '..'

test('base', (t) => {
  class Cli extends VCli {
    static app = 'cli'
  }

  sinon.stub(process, 'cwd').returns('/')

  console.log(process.cwd())


})

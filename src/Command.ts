import * as parser from 'yargs-parser'
import * as foreach from 'foreach'

import Cli from './Cli'
import Hooks from './Hooks'

export enum FlagType {
  'string',
  'number',
  'boolean',
  'array<string>',
  'array<number>',
  'array<boolean>' ,
}

interface FlagSchema {
  type: FlagType,
  multiple?: boolean,
  default?: any,
  alias?: string | string[],
  validate?: (input: any) => boolean,
  filter?: (input: any) => any,
}

interface CommandConstructorOptions {
  rawArgs: any[],
  config: any,
  hooks: Hooks,
  presets: any[],
  cli: Cli,
}

export interface ICommandConstructor {
  hidden: boolean,
  description: string,
  usage: string,
  examples: string[],
  flags: { [key: string]: FlagSchema },

  new ({ rawArgs, config, hooks, presets, cli }: CommandConstructorOptions): BaseCommand,
}

export default abstract class BaseCommand {
  static hidden: boolean = false
  static description: string = ''
  static usage: string = ''
  static examples: string[] = []
  static flags: { [key: string]: FlagSchema } = {}

  rawArgs: any[]
  flags: { [key: string]: any } = {}
  config: any
  hooks: Hooks
  presets: any[]
  cli: Cli

  constructor ({ rawArgs, config, hooks, presets, cli }: CommandConstructorOptions) {
    this.rawArgs = rawArgs
    this.config = config
    this.hooks = hooks
    this.presets = presets
    this.cli = cli
    this.flags = this.parse()
  }

  private parse () {
    const constructor = this.constructor as ICommandConstructor
    const flags: { [key: string]: any } = {}

    let options: {
      string: string[],
      number: string[],
      boolean: string[],
      array: { key: string, boolean?: boolean, number?: boolean, string?: boolean }[],
      alias: { [key: string]: string[] },
      default: { [key: string]: any },
    } = {
      string: [],
      number: [],
      boolean: [],
      array: [],
      alias: {},
      default: {},
    }

    foreach(constructor.flags, (schema: FlagSchema, key: string) => {
      /**
       * type
       */
      switch (schema.type) {
        case FlagType.string: {
          options.string.push(key)
          break
        }
        case FlagType.number: {
          options.number.push(key)
          break
        }
        case FlagType.boolean: {
          options.boolean.push(key)
          break
        }
        case FlagType["array<string>"]: {
          options.array.push({ key, string: true })
          break
        }
        case FlagType["array<number>"]: {
          options.array.push({ key, number: true })
          break
        }
        case FlagType["array<boolean>"]: {
          options.array.push({ key, boolean: true })
          break
        }
      }

      /**
       * alias
       */
      if (typeof schema.alias === 'string') {
        schema.alias = [schema.alias]
      }
      if (Array.isArray(schema.alias)) {
        options.alias[key] = schema.alias
      }

      /**
       * default
       */
      if (schema.default) {
        options.default[key] = schema.default
      }
    })

    /**
     * parse argv via yargs-parser
     */
    const argv = parser(this.rawArgs, options)

    /**
     * validate and filter
     */
    foreach(constructor.flags, (schema: FlagSchema, key: string) => {
      let value = argv[key]
      if (schema.validate) {
        if (schema.validate(value)) {
          throw new Error(`The value of flag "${key}" is invalid.`)
        }
      }
      if (schema.filter) {
        value = schema.filter(value)
      }
      flags[key] = value
    })

    return flags
  }

  abstract run(): void
}

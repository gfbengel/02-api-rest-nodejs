import { Knex, knex as setupKnex } from 'knex'
import { env } from './env'

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL env var.')
}

export const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: env.DATABASE_URL,
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
}

export const knex = setupKnex(config)

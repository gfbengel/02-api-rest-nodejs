/* eslint-disable no-unused-vars */

import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    transactions: {
      id: string
      sessionId: string
      title: string
      amount: number
      createdAt: Date
    }
  }
}

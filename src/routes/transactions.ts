import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    console.log(`[${request.method}] ${request.url}`)
  })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      if (!sessionId) {
        return reply.status(401).send({
          error: 'Unauthorized',
        })
      }

      const transactions = await knex('transactions')
        .where('sessionId', sessionId)
        .select()

      const balance = await knex('transactions')
        .where('sessionId', sessionId)
        .sum('amount as total')
        .first()

      return reply.status(200).send({
        transactions,
        balance,
      })
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const { sessionId } = request.cookies

      const { id } = getTransactionParamsSchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({ sessionId, id })
        .select()
        .first()

      if (!transaction) {
        return reply.status(404).send()
      }

      return reply.status(200).send({ transaction })
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const summary = await knex('transactions')
        .where('sessionId', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return reply.status(200).send({
        summary,
      })
    },
  )

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['income', 'outcome']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions')
      .insert({
        id: randomUUID(),
        sessionId,
        title,
        amount: type === 'outcome' ? amount * -1 : amount,
      })
      .returning('*')

    return reply.status(201).send()
  })
}

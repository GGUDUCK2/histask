import Dexie from 'dexie'
import type { HistaskDatabase } from '@/db/database'
import { HistaskTransactionRunner } from '@/repositories/transactions'
import type { Card, WorkLog } from '@/types/domain'
import { DomainError } from './domain-errors'
import {
  defaultServiceContext,
  timestampNow,
  type ServiceContext,
} from './service-context'
import { parseWorkLogInput, requireText } from './validation'

export interface WorkLogSummary {
  latest?: WorkLog
  count: number
}

export function compareWorkLogsNewestFirst(
  left: WorkLog,
  right: WorkLog,
): number {
  return (
    right.createdAt.localeCompare(left.createdAt) ||
    right.id.localeCompare(left.id)
  )
}

export class WorkLogService {
  private readonly database: HistaskDatabase
  private readonly transactions: HistaskTransactionRunner
  private readonly context: ServiceContext

  constructor(
    database: HistaskDatabase,
    context: ServiceContext = defaultServiceContext,
  ) {
    this.database = database
    this.transactions = new HistaskTransactionRunner(database)
    this.context = context
  }

  async create(input: unknown): Promise<WorkLog> {
    const parsed = parseWorkLogInput(input)
    return this.transactions.write(['cards', 'workLogs'], async () => {
      const card = await this.requireCard(parsed.cardId)
      const timestamp = timestampNow(this.context)
      const workLog: WorkLog = {
        id: this.context.createId(),
        cardId: parsed.cardId,
        content: parsed.content,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      await this.database.workLogs.add(workLog)
      await this.touchCard(card, timestamp)
      return workLog
    })
  }

  async update(workLogId: string, content: unknown): Promise<WorkLog> {
    const validatedContent = requireText(content, 'content')
    return this.transactions.write(['cards', 'workLogs'], async () => {
      const current = await this.requireWorkLog(workLogId)
      const card = await this.requireCard(current.cardId)
      const timestamp = timestampNow(this.context)
      const updated: WorkLog = {
        ...current,
        content: validatedContent,
        updatedAt: timestamp,
      }
      await this.database.workLogs.put(updated)
      await this.touchCard(card, timestamp)
      return updated
    })
  }

  async delete(workLogId: string): Promise<void> {
    await this.transactions.write(['cards', 'workLogs'], async () => {
      const current = await this.requireWorkLog(workLogId)
      const card = await this.requireCard(current.cardId)
      const timestamp = timestampNow(this.context)
      await this.database.workLogs.delete(workLogId)
      await this.touchCard(card, timestamp)
    })
  }

  async listForCard(cardId: string): Promise<WorkLog[]> {
    return this.transactions.read(['workLogs'], async () => {
      const logs = await this.database.workLogs
        .where('[cardId+createdAt]')
        .between([cardId, Dexie.minKey], [cardId, Dexie.maxKey])
        .toArray()
      return logs.sort(compareWorkLogsNewestFirst)
    })
  }

  async getSummary(cardId: string): Promise<WorkLogSummary> {
    const logs = await this.listForCard(cardId)
    return { latest: logs[0], count: logs.length }
  }

  private async requireCard(cardId: string): Promise<Card> {
    const card = await this.database.cards.get(cardId)
    if (!card) throw new DomainError('NOT_FOUND', 'Card', cardId)
    return card
  }

  private async requireWorkLog(workLogId: string): Promise<WorkLog> {
    const workLog = await this.database.workLogs.get(workLogId)
    if (!workLog) throw new DomainError('NOT_FOUND', 'WorkLog', workLogId)
    return workLog
  }

  private async touchCard(card: Card, updatedAt: string): Promise<void> {
    await this.database.cards.put({ ...card, updatedAt })
  }
}

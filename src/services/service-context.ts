import { requireTimestamp } from './validation'

export interface ServiceContext {
  now(): Date
  createId(): string
}

export const defaultServiceContext: ServiceContext = {
  now: () => new Date(),
  createId: () => crypto.randomUUID(),
}

export function timestampNow(context: Pick<ServiceContext, 'now'>): string {
  const timestamp = context.now().toISOString()
  return requireTimestamp(timestamp, 'timestamp')
}

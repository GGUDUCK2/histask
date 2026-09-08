import type { ServiceContext } from '@/services/service-context'

export class TestServiceContext implements ServiceContext {
  private timestamp: string
  private readonly ids: string[]

  constructor(timestamp: string, ids: string[] = []) {
    this.timestamp = timestamp
    this.ids = [...ids]
  }

  now(): Date {
    return new Date(this.timestamp)
  }

  createId(): string {
    const id = this.ids.shift()
    if (id === undefined) throw new Error('No test ID remains.')
    return id
  }

  setNow(timestamp: string): void {
    this.timestamp = timestamp
  }
}

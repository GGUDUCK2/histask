export type DomainErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_REFERENCE'
  | 'DUPLICATE_RELATION'

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly entity: string
  readonly entityId: string

  constructor(code: DomainErrorCode, entity: string, entityId: string) {
    const messages: Record<DomainErrorCode, string> = {
      NOT_FOUND: `${entity} was not found.`,
      INVALID_REFERENCE: `The selected ${entity} no longer exists.`,
      DUPLICATE_RELATION: `This ${entity} is already connected.`,
    }
    super(messages[code])
    this.name = 'DomainError'
    this.code = code
    this.entity = entity
    this.entityId = entityId
  }
}

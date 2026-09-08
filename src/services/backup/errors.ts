export type BackupErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_FORMAT'
  | 'UNSUPPORTED_APP'
  | 'UNSUPPORTED_VERSION'
  | 'INVALID_FIELD'
  | 'INVALID_STATE'
  | 'DUPLICATE_ID'
  | 'DUPLICATE_RELATION'
  | 'INVALID_REFERENCE'

const messages: Record<BackupErrorCode, string> = {
  INVALID_JSON: 'This backup is not valid JSON.',
  INVALID_FORMAT: 'This backup does not have the expected structure.',
  UNSUPPORTED_APP: 'This file is not a Histask backup.',
  UNSUPPORTED_VERSION: 'This Histask backup version is not supported.',
  INVALID_FIELD: 'This backup contains an invalid field.',
  INVALID_STATE: 'This backup contains an inconsistent task state.',
  DUPLICATE_ID: 'This backup contains duplicate records.',
  DUPLICATE_RELATION: 'This backup contains a duplicate relationship.',
  INVALID_REFERENCE: 'This backup contains a broken relationship.',
}

export class BackupValidationError extends Error {
  readonly code: BackupErrorCode
  readonly path: string

  constructor(code: BackupErrorCode, path = '$', cause?: unknown) {
    super(messages[code], { cause })
    this.name = 'BackupValidationError'
    this.code = code
    this.path = path
  }
}

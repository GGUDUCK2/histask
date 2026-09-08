import type { HistaskDatabase } from '@/db/database'
import { BoardQueryService } from './board-query'
import { CardService } from './cards'
import { ClassificationService } from './classification'
import { DashboardService } from './dashboard'
import { WorkLogService } from './worklogs'
import { BackupExportService } from './backup/export'
import { BackupImportService } from './backup/import'
import { DeleteAllDataService } from './delete-all-data'
export * from './backup'
export { DeleteAllDataService } from './delete-all-data'

export function createDomainServices(database: HistaskDatabase) {
  return {
    cards: new CardService(database),
    workLogs: new WorkLogService(database),
    classification: new ClassificationService(database),
    board: new BoardQueryService(database),
    dashboard: new DashboardService(database),
    backupExport: new BackupExportService(database),
    backupImport: new BackupImportService(database),
    deleteAllData: new DeleteAllDataService(database),
  }
}

export type HistaskDomainServices = ReturnType<typeof createDomainServices>

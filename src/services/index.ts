import type { HistaskDatabase } from '@/db/database'
import { BoardQueryService } from './board-query'
import { CardOrderService } from './card-order'
import { CardService } from './cards'
import { ClassificationService } from './classification'
import { DashboardService } from './dashboard'
import { DateWorkService } from './date-work'
import { WorkLogService } from './worklogs'
import { BackupExportService } from './backup/export'
import { BackupImportService } from './backup/import'
import { DeleteAllDataService } from './delete-all-data'
export * from './backup'
export { DeleteAllDataService } from './delete-all-data'

export function createDomainServices(database: HistaskDatabase) {
  return {
    cards: new CardService(database),
    cardOrder: new CardOrderService(database),
    workLogs: new WorkLogService(database),
    classification: new ClassificationService(database),
    board: new BoardQueryService(database),
    dashboard: new DashboardService(database),
    dateWork: new DateWorkService(database),
    backupExport: new BackupExportService(database),
    backupImport: new BackupImportService(database),
    deleteAllData: new DeleteAllDataService(database),
  }
}

export type HistaskDomainServices = ReturnType<typeof createDomainServices>

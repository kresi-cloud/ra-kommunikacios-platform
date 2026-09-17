// private.write_audit megfelelője: append-only naplóbejegyzés minden
// üzleti állapotváltozáshoz. A route rétegnek minden sikeres írás után
// hívnia kell, ugyanabban a service-hívásban, mint a Postgres-verzióban a
// tranzakción belül.
import type { AppDatabase } from './db/client'
import { auditLog } from './db/schema'

export type AuditInput = {
  actorUserId: string | null
  actorType: 'user' | 'system' | 'service'
  action: string
  entityType: string
  entityId?: string | null
  projectId?: string | null
  oldValues?: unknown
  newValues?: unknown
  reason?: string | null
}

export async function writeAudit(db: AppDatabase, input: AuditInput): Promise<string> {
  const id = crypto.randomUUID()
  await db.insert(auditLog).values({
    id,
    occurredAt: new Date().toISOString(),
    actorUserId: input.actorUserId,
    actorType: input.actorType,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    projectId: input.projectId ?? null,
    oldValues: input.oldValues ?? null,
    newValues: input.newValues ?? null,
    reason: input.reason ?? null
  })
  return id
}

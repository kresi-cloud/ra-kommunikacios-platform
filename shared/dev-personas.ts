// Fejlesztői demó-fiókok, szerepkörönként egy. Ezt a fájlt a szerver
// (server/dev-seed.ts, a fiókok idempotens létrehozásához) és a felület
// (src/pages/LoginPage.tsx, a gyorsbelépő gombokhoz) is importálja.
// SOSEM kerül éles buildbe: a szerveroldalon NODE_ENV=production, a
// kliensoldalon import.meta.env.DEV=false zárja ki a hozzá tartozó kódot
// (Vite ez utóbbit a minifikált buildből ki is dobja).
export type DevPersonaRole = 'communication_lead' | 'technical_admin' | 'project_owner' | 'staff_member'

export type DevPersona = {
  email: string
  password: string
  displayName: string
  roleCode: DevPersonaRole
  roleLabel: string
}

export const DEV_PERSONAS: DevPersona[] = [
  {
    email: 'lead@dev.local', password: 'fejleszto1234',
    displayName: 'Teszt Vezető', roleCode: 'communication_lead', roleLabel: 'Kommunikációs vezető'
  },
  {
    email: 'owner@dev.local', password: 'fejleszto1234',
    displayName: 'Teszt Projektgazda', roleCode: 'project_owner', roleLabel: 'Projektgazda'
  },
  {
    email: 'staff@dev.local', password: 'fejleszto1234',
    displayName: 'Teszt Munkatárs', roleCode: 'staff_member', roleLabel: 'Munkatárs'
  },
  {
    email: 'admin@dev.local', password: 'fejleszto1234',
    displayName: 'Teszt Technikai Admin', roleCode: 'technical_admin', roleLabel: 'Technikai admin'
  }
]

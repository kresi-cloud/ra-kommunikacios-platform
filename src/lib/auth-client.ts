// A korábbi Supabase Auth klienst váltja ki. Fejlesztésben és élesben is
// ugyanarról az originről szolgálja ki a Hono szerver az /api/auth/*
// végpontokat (lásd server/index.ts, vite.config.ts), ezért nincs szükség
// külön baseURL megadására – a kliens az aktuális oldal origójára hívja a
// kéréseket, és a munkamenet-süti azonos origós, sima cookie-alapú.
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient()

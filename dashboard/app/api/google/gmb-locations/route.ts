import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/dal'
import { listGmbLocations } from '@/lib/google'

export async function GET() {
  await requireUser()

  try {
    const locations = await listGmbLocations()
    return NextResponse.json({ locations })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/dal'
import { listGscSites } from '@/lib/google'

export async function GET() {
  await requireUser()

  try {
    const sites = await listGscSites()
    return NextResponse.json({ sites })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}

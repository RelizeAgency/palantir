import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/dal'
import { listGa4Properties } from '@/lib/google'

export async function GET() {
  await requireUser()

  try {
    const properties = await listGa4Properties()
    return NextResponse.json({ properties })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}

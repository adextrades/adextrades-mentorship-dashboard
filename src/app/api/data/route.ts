import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const DATA_KEY = 'adextrades:mentorship:data'

export async function GET() {
  try {
    const data = await redis.get(DATA_KEY)
    return NextResponse.json({ data: data || { mentees: {} } })
  } catch (error) {
    console.error('Redis GET error:', error)
    return NextResponse.json({ data: { mentees: {} } }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await redis.set(DATA_KEY, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Redis POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const AGENT_REPO = join(process.cwd(), '..')

export async function GET(
  request: Request,
  { params }: { params: Promise<{ zone: string }> }
) {
  const { zone } = await params

  const outputsDir = join(AGENT_REPO, '.outputs')
  const logsDir = join(AGENT_REPO, 'memory', 'logs')

  const data: Record<string, unknown> = { zone, source: 'live' }

  const skillMap: Record<string, string[]> = {
    signals: ['token-movers', 'token-alert', 'token-pick', 'token-report'],
    market: ['defi-monitor', 'on-chain-monitor', 'market-context-refresh'],
    research: ['paper-digest', 'hacker-news-digest', 'rss-digest'],
    intel: ['deep-research', 'narrative-tracker'],
    creator: ['article', 'digest', 'technical-explainer'],
    control: ['heartbeat', 'skill-health'],
  }

  const skills = skillMap[zone] || []
  const outputs: Record<string, string> = {}

  for (const skill of skills) {
    const path = join(outputsDir, `${skill}.md`)
    if (existsSync(path)) {
      outputs[skill] = readFileSync(path, 'utf-8')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const logPath = join(logsDir, `${today}.md`)
  let todayLog = ''
  if (existsSync(logPath)) {
    todayLog = readFileSync(logPath, 'utf-8')
  }

  data.outputs = outputs
  data.todayLog = todayLog

  return NextResponse.json(data)
}

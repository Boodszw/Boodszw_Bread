import * as THREE from 'three'

export interface Zone {
  id: string
  name: string
  color: string
  position: THREE.Vector3
  skills: string[]
  description: string
  icon: string
}

export const ZONES: Zone[] = [
  {
    id: 'home',
    name: 'HOME',
    color: '#ffffff',
    position: new THREE.Vector3(0, 0, 0),
    skills: [],
    description: 'Overview & status',
    icon: '⬡',
  },
  {
    id: 'signals',
    name: 'SIGNALS',
    color: '#00ff88',
    position: new THREE.Vector3(8, 2, -6),
    skills: ['token-alert', 'token-movers', 'token-pick', 'token-report'],
    description: 'Price alerts & token picks',
    icon: '◈',
  },
  {
    id: 'market',
    name: 'MARKET',
    color: '#ff6600',
    position: new THREE.Vector3(14, -1, -14),
    skills: ['defi-monitor', 'on-chain-monitor', 'market-context-refresh', 'defi-overview'],
    description: 'DeFi & on-chain activity',
    icon: '◉',
  },
  {
    id: 'research',
    name: 'RESEARCH',
    color: '#4488ff',
    position: new THREE.Vector3(6, 3, -22),
    skills: ['paper-digest', 'hacker-news-digest', 'rss-digest', 'research-brief'],
    description: 'Papers, news & digests',
    icon: '◎',
  },
  {
    id: 'intel',
    name: 'INTEL',
    color: '#aa44ff',
    position: new THREE.Vector3(-4, 1, -30),
    skills: ['deep-research', 'narrative-tracker', 'monitor-polymarket', 'monitor-kalshi'],
    description: 'Deep research & predictions',
    icon: '◇',
  },
  {
    id: 'creator',
    name: 'CREATOR',
    color: '#ff4488',
    position: new THREE.Vector3(-12, -2, -24),
    skills: ['article', 'digest', 'technical-explainer', 'syndicate-article'],
    description: 'Content generation',
    icon: '△',
  },
  {
    id: 'comms',
    name: 'COMMS',
    color: '#44ddff',
    position: new THREE.Vector3(-14, 2, -14),
    skills: ['telegram', 'discord', 'slack'],
    description: 'Messaging & voice',
    icon: '◆',
  },
  {
    id: 'control',
    name: 'CONTROL',
    color: '#ffdd00',
    position: new THREE.Vector3(-8, -1, -6),
    skills: ['heartbeat', 'skill-health', 'self-improve', 'cost-report'],
    description: 'Agent health & config',
    icon: '⬢',
  },
]

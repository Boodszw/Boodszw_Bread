import { create } from 'zustand'

interface ZoneData {
  title: string
  items: string[]
  lastUpdated: string
}

interface AeonState {
  currentZone: number
  targetZone: number
  inTransit: boolean
  transitProgress: number
  agentVoice: string
  zoneData: Record<string, ZoneData>

  navigateTo: (index: number) => void
  setTransitProgress: (p: number) => void
  finishTransit: () => void
  setAgentVoice: (text: string) => void
  setZoneData: (zoneId: string, data: ZoneData) => void
}

export const useAeonStore = create<AeonState>((set) => ({
  currentZone: 0,
  targetZone: 0,
  inTransit: false,
  transitProgress: 0,
  agentVoice: 'Welcome to Aeon. Select a zone to begin.',
  zoneData: {
    signals: {
      title: 'Token Movers',
      items: ['XEC +33.1%', 'JASMY +13.4%', 'LAB +11.1%', 'UNI +8.8%'],
      lastUpdated: new Date().toISOString(),
    },
    market: {
      title: 'DeFi Activity',
      items: ['TVL $48.2B (+1.2%)', 'DEX Vol $3.1B', 'Active wallets 1.2M'],
      lastUpdated: new Date().toISOString(),
    },
    research: {
      title: 'Latest Papers',
      items: ['Attention Is All You Need v2', 'Scaling Laws Revisited'],
      lastUpdated: new Date().toISOString(),
    },
    intel: {
      title: 'Narratives',
      items: ['AI agents rising', 'RWA consolidating', 'L2 wars fading'],
      lastUpdated: new Date().toISOString(),
    },
    creator: {
      title: 'Content Queue',
      items: ['Draft: Weekly Digest', 'Scheduled: Market Brief'],
      lastUpdated: new Date().toISOString(),
    },
    comms: {
      title: 'Messages',
      items: ['Telegram: 3 unread', 'Discord: active'],
      lastUpdated: new Date().toISOString(),
    },
    control: {
      title: 'System Health',
      items: ['Heartbeat: OK', 'Skills: 12 active', 'Cost: $0.42 today'],
      lastUpdated: new Date().toISOString(),
    },
  },

  navigateTo: (index) =>
    set((state) => {
      if (state.inTransit || index === state.currentZone) return state
      return { targetZone: index, inTransit: true, transitProgress: 0 }
    }),

  setTransitProgress: (p) => set({ transitProgress: p }),

  finishTransit: () =>
    set((state) => ({
      currentZone: state.targetZone,
      inTransit: false,
      transitProgress: 1,
    })),

  setAgentVoice: (text) => set({ agentVoice: text }),

  setZoneData: (zoneId, data) =>
    set((state) => ({
      zoneData: { ...state.zoneData, [zoneId]: data },
    })),
}))

#!/usr/bin/env python3
import json

with open('/home/runner/work/aeon/aeon/.tmp_markets.json') as f:
    markets = json.load(f)
with open('/home/runner/work/aeon/aeon/.tmp_trending.json') as f:
    trending_raw = json.load(f)

if not isinstance(markets, list):
    print("MARKETS_ERROR:", json.dumps(markets)[:300])
    raise SystemExit(1)

# Stablecoin/peg exclusion list
STABLE_IDS = {
    'tether','usd-coin','dai','first-digital-usd','ethena-usde','true-usd',
    'usdd','paypal-usd','frax','frxusd','tusd','fdusd','pyusd','usde','paxg',
    'usds','sky-dollar','blackrock-usd-institutional-digital-liquidity-fund',
    'binance-usd','gemini-dollar','susds','ethena-staked-usde',
    'falcon-finance','usdtb','usd1-wlfi','usual-usd','crypto-com-staked-eth',
    'mantle-staked-ether','rocket-pool-eth','staked-frax-ether','wrapped-steth',
    'wrapped-eeth','renzo-restaked-eth','kelp-dao-restaked-eth','liquid-staked-ethereum',
}
STABLE_NAME_HINTS = ('stablecoin','tokenized treasury','tokenized treasuries','t-bill')
STABLE_SYM_PREFIX = ('USD','EUR','GBP','EURC','EURT','XEUR')

def is_stable(c):
    cid = (c.get('id') or '').lower()
    name = (c.get('name') or '').lower()
    sym = (c.get('symbol') or '').upper()
    if cid in STABLE_IDS:
        return True
    if any(h in name for h in STABLE_NAME_HINTS):
        return True
    if any(sym.startswith(p) for p in STABLE_SYM_PREFIX):
        return True
    # additional: pegged near $1 with very low vol-to-mcap
    return False

# Wrapped/derivative dupes — keep one
WRAPPED_DROP = {'wrapped-bitcoin','weth','wrapped-eth','wrapped-beacon-eth','staked-ether','lido-staked-ether','binance-bridged-usdt-bnb-smart-chain','coinbase-wrapped-btc','wrapped-bnb','wrapped-tron','wrapped-solana','jito-staked-sol','tbtc','jupiter-staked-sol','marinade-staked-sol'}

def fmt_price(p):
    if p is None: return "-"
    if p >= 100: return f"${p:,.2f}"
    if p >= 1: return f"${p:.3f}"
    if p >= 0.01: return f"${p:.4f}"
    if p >= 0.0001: return f"${p:.6f}"
    return f"${p:.8f}"

def fmt_money(m):
    if m is None: return "-"
    if m >= 1e9: return f"${m/1e9:.2f}B"
    if m >= 1e6: return f"${m/1e6:.1f}M"
    if m >= 1e3: return f"${m/1e3:.0f}K"
    return f"${m:.0f}"

def fmt_pct(p):
    if p is None: return "-"
    sign = "+" if p >= 0 else ""
    return f"{sign}{p:.1f}%"

# Filter
filtered = []
for c in markets:
    if is_stable(c):
        continue
    if c.get('id') in WRAPPED_DROP:
        continue
    vol = c.get('total_volume') or 0
    if vol < 1_000_000:
        continue
    if c.get('price_change_percentage_24h_in_currency') is None:
        continue
    filtered.append(c)

# Trending IDs/symbols
trending_items = []
for item in trending_raw.get('coins', [])[:7]:
    coin = item.get('item', {})
    trending_items.append({
        'id': coin.get('id'),
        'name': coin.get('name'),
        'symbol': (coin.get('symbol') or '').upper(),
        'rank': coin.get('market_cap_rank'),
        'price': (coin.get('data') or {}).get('price'),
        'pct24': (coin.get('data') or {}).get('price_change_percentage_24h', {}).get('usd'),
    })
trending_ids = {t['id'] for t in trending_items}
trending_syms = {t['symbol'] for t in trending_items}

# Sort
by_24h = sorted(filtered, key=lambda c: c.get('price_change_percentage_24h_in_currency') or 0)
losers = by_24h[:10]
winners = list(reversed(by_24h[-10:]))

def make_tags(c):
    tags = []
    cid = c.get('id')
    sym = (c.get('symbol') or '').upper()
    p24 = c.get('price_change_percentage_24h_in_currency') or 0
    p7 = c.get('price_change_percentage_7d_in_currency') or 0
    rank = c.get('market_cap_rank') or 9999
    mcap = c.get('market_cap') or 0
    vol = c.get('total_volume') or 0
    vol_to_mcap = (vol / mcap) if mcap else 0
    in_trending = cid in trending_ids or sym in trending_syms

    if in_trending and p24 > 5:
        tags.append("TRENDING+UP")
    if in_trending and p24 < -5:
        tags.append("TRENDING+DOWN")
    if p24 > 15 and p7 > 25:
        tags.append("BREAKOUT")
    if p24 > 20 and p7 < 0:
        tags.append("FADE")
    if p24 < -10 and vol_to_mcap > 0.25:
        tags.append("CAPITULATION")
    if rank > 150 and p24 > 30:
        tags.append("PUMP-RISK")
    if mcap < 50_000_000:
        tags.append("MICROCAP")
    if rank <= 20:
        tags.append("MAJOR")
    return tags[:2]

def render_row(i, c):
    sym = (c.get('symbol') or '').upper()
    name = c.get('name')
    price = fmt_price(c.get('current_price'))
    p1 = fmt_pct(c.get('price_change_percentage_1h_in_currency'))
    p24 = fmt_pct(c.get('price_change_percentage_24h_in_currency'))
    p7 = fmt_pct(c.get('price_change_percentage_7d_in_currency'))
    vol = fmt_money(c.get('total_volume'))
    rank = c.get('market_cap_rank') or '?'
    tags = make_tags(c)
    tagstr = f"  [{', '.join(tags)}]" if tags else ""
    return f"{i}. {sym} ({name}) — {price}  {p24} / 7d {p7} / 1h {p1}  •  {vol} / #{rank}{tagstr}"

# Market pulse: top 100 (after filters), green fraction + median
top100 = filtered[:100]
greens = sum(1 for c in top100 if (c.get('price_change_percentage_24h_in_currency') or 0) > 0)
top50 = filtered[:50]
ch50 = sorted([(c.get('price_change_percentage_24h_in_currency') or 0) for c in top50])
median50 = ch50[len(ch50)//2] if ch50 else 0

# Output assembled lists for use by Claude
out = {
    'pulse': {
        'green_top100': greens,
        'total_top100': len(top100),
        'median_top50_pct': median50,
    },
    'winners': [{
        'sym': (c.get('symbol') or '').upper(),
        'name': c.get('name'),
        'id': c.get('id'),
        'price': c.get('current_price'),
        'p1h': c.get('price_change_percentage_1h_in_currency'),
        'p24h': c.get('price_change_percentage_24h_in_currency'),
        'p7d': c.get('price_change_percentage_7d_in_currency'),
        'vol': c.get('total_volume'),
        'mcap': c.get('market_cap'),
        'rank': c.get('market_cap_rank'),
        'tags': make_tags(c),
        'rendered': render_row(i+1, c),
    } for i, c in enumerate(winners)],
    'losers': [{
        'sym': (c.get('symbol') or '').upper(),
        'name': c.get('name'),
        'id': c.get('id'),
        'price': c.get('current_price'),
        'p1h': c.get('price_change_percentage_1h_in_currency'),
        'p24h': c.get('price_change_percentage_24h_in_currency'),
        'p7d': c.get('price_change_percentage_7d_in_currency'),
        'vol': c.get('total_volume'),
        'mcap': c.get('market_cap'),
        'rank': c.get('market_cap_rank'),
        'tags': make_tags(c),
        'rendered': render_row(i+1, c),
    } for i, c in enumerate(losers)],
    'trending': trending_items,
    'trending_ids': list(trending_ids),
}

# Render trending rows: tag with TRENDING+UP/DOWN if applicable based on its 24h
trend_rendered = []
for i, t in enumerate(trending_items):
    sym = t['symbol']
    name = t['name']
    rank = t['rank'] if t['rank'] is not None else '?'
    price = fmt_price(t['price']) if t['price'] is not None else '-'
    p24 = fmt_pct(t['pct24']) if t['pct24'] is not None else '-'
    tags = []
    p24v = t['pct24'] or 0
    if p24v > 15:
        tags.append("HOT")
    elif p24v < -10:
        tags.append("BLEEDING")
    tagstr = f"  [{', '.join(tags)}]" if tags else ""
    trend_rendered.append(f"{i+1}. {name} ({sym}) — #{rank}, {price}, 24h {p24}{tagstr}")
out['trending_rendered'] = trend_rendered

with open('/home/runner/work/aeon/aeon/.tmp_processed.json', 'w') as f:
    json.dump(out, f, indent=2, default=str)
print("OK")

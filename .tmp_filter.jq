def stable_ids:
  ["tether","usd-coin","dai","first-digital-usd","ethena-usde","true-usd",
   "usdd","paypal-usd","frax","frxusd","tusd","fdusd","pyusd","usde","paxg",
   "usds","sky-dollar","blackrock-usd-institutional-digital-liquidity-fund",
   "binance-usd","gemini-dollar","susds","ethena-staked-usde","usdtb",
   "usd1-wlfi","usual-usd","resolv-rlp","resolv-usr",
   "crypto-com-staked-eth","mantle-staked-ether","rocket-pool-eth",
   "staked-frax-ether","wrapped-steth","wrapped-eeth","renzo-restaked-eth",
   "kelp-dao-restaked-eth","liquid-staked-ethereum","staked-ether",
   "lido-staked-ether","wrapped-bitcoin","weth","wrapped-eth",
   "binance-bridged-usdt-bnb-smart-chain","coinbase-wrapped-btc",
   "wrapped-bnb","wrapped-tron","wrapped-solana","jito-staked-sol","tbtc",
   "jupiter-staked-sol","marinade-staked-sol","wbeth","susde","msol",
   "jitosol","cbbtc","binance-bridged-usdc-bnb-smart-chain"];

def is_excluded:
  . as $c
  | (stable_ids | index($c.id)) != null
    or (($c.symbol|ascii_upcase)|startswith("USD"))
    or (($c.symbol|ascii_upcase)|startswith("EUR"))
    or (($c.name|ascii_downcase)|contains("stablecoin"))
    or (($c.name|ascii_downcase)|contains("tokenized treasury"));

[.[]
  | select((.total_volume // 0) >= 1000000)
  | select(is_excluded | not)
  | select(.price_change_percentage_24h_in_currency != null)
  | {
      sym: (.symbol|ascii_upcase),
      name: .name,
      id: .id,
      price: .current_price,
      p1: .price_change_percentage_1h_in_currency,
      p24: .price_change_percentage_24h_in_currency,
      p7: .price_change_percentage_7d_in_currency,
      vol: .total_volume,
      mcap: .market_cap,
      rank: .market_cap_rank
    }
] | sort_by(.p24) as $sorted
| {
    top_winners: ($sorted | reverse | .[:10]),
    top_losers: ($sorted | .[:10]),
    top100_green: ([$sorted | reverse | .[:100][] | select(.p24 > 0)] | length),
    top100_count: ([$sorted | reverse | .[:100][]] | length),
    median_top50: ($sorted | reverse | .[:50] | sort_by(.p24) | .[(length/2 | floor)].p24),
    full_count: ($sorted | length)
  }

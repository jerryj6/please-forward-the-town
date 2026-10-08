# PFT Refinement Audit — Pass 16

1. **distinctByLen coverage** — multiset tables by length now in
   LEVELS.md for all 12 (enumerator gains distinctByLen). Named
   families: pft-05 has 2 optimal-13 families (direct + role-swap);
   pft-06's two raw optima collapse to 1 family; pft-12's four raw
   optima = 1 family (finale optimum single-valued).
2. **Deny-chain on tolerated verbs** — pft-02 `drop`: 15/17 plans
   survive w/o it, including the optimum → structural optional idiom.
   pft-06 `load_ferry`: identical 20 plans w/o it (never appears ≤21)
   → structurally redundant idiom; `hand_over_ferry` carries the order.
   Both documented, neither a bound artifact.
3. **Save/restore probe** — `audit/probe-save.mts`: mid-trace
   serialize → restore into fresh engine → double round-trip → finish.
   12/12 levels hash-match the uninterrupted baseline + complete.
   Byte-exact mid-board persistence verified.
4. **Research** — `audit/DESIGN-RESEARCH-PFT10.md`: puzzle-fairness
   / signposted-solvability (Baba, PPP, Parabox) → 5 spec inputs for
   hint tiers that prove solvability (constraint visibility, witness
   tiers, plan-space bound display, A/B certificates, superseded
   honesty).

## Commands + exit codes

- `npx vitest run` → 107 passed, exit 0
- `npx tsc --noEmit` → exit 0
- `npx tsx scripts/card-vs-engine.mts` → 33/33, exit 0
- `npx tsx scripts/coop-necessity.mts` → 52/52, exit 0
- `npx tsx audit/probe-save.mts` → 12/12, exit 0
- `npx tsx audit/probe-undo-all.mts` → 12/12, exit 0
- DENY/enum runs per LEVELS.md tables

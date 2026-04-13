# When I'm Broke

A personal finance tool that projects how long you can live off your savings — and identifies the optimal point in time to stop relying on income and start drawing them down.

## What It Does

Most budgeting apps tell you where your money went. This tool tells you **how long you have left**.

- **Savings runway projection** — calculates exactly how many months your savings will last based on your current balance and monthly burn rate
- **Last safe point detection** — identifies the optimal date to transition from income-dependent to savings-only living
- **Phase timeline** — breaks your financial future into clear stages (comfortable → caution → critical)
- **What-if scenarios** — adjust inputs and see the runway update in real time

## Getting Started

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173

## Importing Bank Data

Export a CSV from your bank and upload it. The app auto-categorises transactions.

**Supported banks:**
- Monzo
- Starling
- Lloyds
- HSBC
- Snoop (aggregates multiple accounts)

Or use manual entry for all fields.

## How the Projection Works

1. Monthly surplus/deficit calculated from income minus expenses and debt repayments
2. Savings balance projected forward month by month
3. **Last safe point** identified as latest date you could stop income and maintain 6+ months runway
4. Phase timeline generated showing comfortable → caution → critical transitions

## Tech Stack

- React 19 + TypeScript
- Vite
- TailwindCSS
- Lucide icons

## License

Apache 2.0

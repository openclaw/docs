---
read_when:
    - Debuggen van ontwikkelscripts die alleen op Node draaien of fouten in watch-modus
    - Onderzoek naar crashes van de tsx/esbuild-loader in OpenClaw
summary: 'Node + tsx: notities en tijdelijke oplossingen voor de crash "__name is not a function"'
title: Node + tsx-crash
x-i18n:
    generated_at: "2026-04-29T22:42:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx "\_\_name is not a function"-crash

## Samenvatting

OpenClaw uitvoeren via Node met `tsx` mislukt bij het opstarten met:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Dit begon na het overschakelen van dev-scripts van Bun naar `tsx` (commit `2871657e`, 2026-01-06). Hetzelfde runtimepad werkte met Bun.

## Omgeving

- Node: v25.x (waargenomen op v25.3.0)
- tsx: 4.21.0
- OS: macOS (repro is waarschijnlijk ook mogelijk op andere platforms waarop Node 25 draait)

## Repro (alleen Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Minimale repro in repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Controle van Node-versie

- Node 25.3.0: mislukt
- Node 22.22.0 (Homebrew `node@22`): mislukt
- Node 24: hier nog niet geinstalleerd; verificatie nodig

## Opmerkingen / hypothese

- `tsx` gebruikt esbuild om TS/ESM te transformeren. esbuilds `keepNames` geeft een `__name`-helper uit en omwikkelt functiedefinities met `__name(...)`.
- De crash geeft aan dat `__name` bestaat, maar tijdens runtime geen functie is, wat impliceert dat de helper voor deze module in het Node 25-loaderpad ontbreekt of wordt overschreven.
- Vergelijkbare problemen met de `__name`-helper zijn gemeld in andere esbuild-consumenten wanneer de helper ontbreekt of wordt herschreven.

## Regressiegeschiedenis

- `2871657e` (2026-01-06): scripts gewijzigd van Bun naar tsx om Bun optioneel te maken.
- Daarvoor (Bun-pad) werkten `openclaw status` en `gateway:watch`.

## Workarounds

- Gebruik Bun voor dev-scripts (huidige tijdelijke terugdraaiing).
- Gebruik `tsgo` voor typecontrole van de repo en voer daarna de gebouwde uitvoer uit:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Historische opmerking: `tsc` werd hier gebruikt tijdens het debuggen van dit Node/tsx-probleem, maar de typecontrolelanen van de repo gebruiken nu `tsgo`.
- Schakel esbuild keepNames uit in de TS-loader als dat mogelijk is (voorkomt invoeging van de `__name`-helper); tsx biedt dit momenteel niet aan.
- Test Node LTS (22/24) met `tsx` om te zien of het probleem specifiek is voor Node 25.

## Referenties

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Volgende stappen

- Repro op Node 22/24 om de Node 25-regressie te bevestigen.
- Test `tsx` nightly of pin naar een eerdere versie als er een bekende regressie bestaat.
- Als dit op Node LTS reproduceert, dien dan upstream een minimale repro in met de `__name`-stacktrace.

## Gerelateerd

- [Node.js-installatie](/nl/install/node)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)

---
read_when:
    - Debuggen van ontwikkelscripts die alleen met Node werken of fouten in watch-modus
    - Onderzoek naar crashes van het tsx/esbuild-laadprogramma in OpenClaw
summary: 'Node + tsx: crashnotities en tijdelijke oplossingen voor "__name is not a function"'
title: Node + tsx loopt vast
x-i18n:
    generated_at: "2026-05-06T17:55:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Node + tsx "\_\_name is not a function"-crash

## Samenvatting

OpenClaw uitvoeren via Node met `tsx` mislukt bij het opstarten met:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Dit begon nadat dev-scripts waren overgezet van Bun naar `tsx` (commit `2871657e`, 2026-01-06). Hetzelfde runtime-pad werkte met Bun.

## Omgeving

- Node: v25.x (waargenomen op v25.3.0)
- tsx: 4.21.0
- OS: macOS (reproductie waarschijnlijk ook op andere platforms die Node 25 uitvoeren)

## Reproductie (alleen Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Minimale reproductie in repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node-versiecontrole

- Node 25.3.0: mislukt
- Node 22.22.0 (Homebrew `node@22`): mislukt
- Node 24: hier nog niet geïnstalleerd; vereist verificatie

## Opmerkingen / hypothese

- `tsx` gebruikt esbuild om TS/ESM te transformeren. esbuilds `keepNames` emit een `__name`-helper en wikkelt functiedefinities met `__name(...)`.
- De crash geeft aan dat `__name` tijdens runtime bestaat maar geen functie is, wat impliceert dat de helper ontbreekt of voor deze module in het Node 25-loaderpad is overschreven.
- Vergelijkbare problemen met de `__name`-helper zijn gemeld in andere esbuild-gebruikers wanneer de helper ontbreekt of herschreven wordt.

## Regressiegeschiedenis

- `2871657e` (2026-01-06): scripts gewijzigd van Bun naar tsx om Bun optioneel te maken.
- Daarvoor (Bun-pad) werkten `openclaw status` en `gateway:watch`.

## Tijdelijke oplossingen

- Gebruik Bun voor dev-scripts (huidige tijdelijke revert).
- Gebruik `tsgo` voor repo-typecontrole en voer daarna de gebouwde output uit:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Historische opmerking: `tsc` werd hier gebruikt tijdens het debuggen van dit Node/tsx-probleem, maar repo-typecontrolelanes gebruiken nu `tsgo`.
- Schakel esbuild keepNames in de TS-loader uit als dat mogelijk is (voorkomt invoeging van de `__name`-helper); tsx biedt dit momenteel niet aan.
- Test Node LTS (22/24) met `tsx` om te zien of het probleem specifiek is voor Node 25.

## Referenties

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Volgende stappen

- Reproduceer op Node 22/24 om de Node 25-regressie te bevestigen.
- Test `tsx` nightly of pin op een eerdere versie als er een bekende regressie bestaat.
- Als dit reproduceert op Node LTS, dien dan upstream een minimale reproductie in met de `__name`-stacktrace.

## Gerelateerd

- [Node.js installeren](/nl/install/node)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)

---
read_when:
    - Je moet de ruwe modeluitvoer inspecteren op redeneringslekkage
    - Je wilt de Gateway in watch-modus uitvoeren terwijl je itereert
    - Je hebt een herhaalbare debuggingworkflow nodig
summary: 'Foutopsporingstools: watchmodus, ruwe modelstreams en redeneerlekkage traceren'
title: Debuggen
x-i18n:
    generated_at: "2026-05-02T22:19:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

Foutopsporingshelpers voor streaminguitvoer, vooral wanneer een provider redenering mengt met normale tekst.

## Runtime-debug-overschrijvingen

Gebruik `/debug` in chat om **alleen-runtime** configuratie-overschrijvingen in te stellen (geheugen, niet schijf).
`/debug` is standaard uitgeschakeld; schakel dit in met `commands.debug: true`.
Dit is handig wanneer je obscure instellingen moet omschakelen zonder `openclaw.json` te bewerken.

Voorbeelden:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` wist alle overschrijvingen en keert terug naar de configuratie op schijf.

## Sessie-trace-uitvoer

Gebruik `/trace` wanneer je Plugin-beheerde trace-/debugregels in één sessie wilt zien
zonder de volledige uitgebreide modus in te schakelen.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Gebruik `/trace` voor Plugin-diagnostiek, zoals Active Memory-debugsamenvattingen.
Blijf `/verbose` gebruiken voor normale uitgebreide status-/tooluitvoer en blijf
`/debug` gebruiken voor alleen-runtime configuratie-overschrijvingen.

## Plugin-levenscyclus-trace

Gebruik `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` wanneer Plugin-levenscycluscommando's traag aanvoelen
en je een ingebouwde fase-uitsplitsing nodig hebt voor Plugin-metadata, ontdekking, registry,
runtime-mirror, configuratiemutatie en vernieuwingswerk. De trace is opt-in en schrijft
naar stderr, zodat JSON-commando-uitvoer parseerbaar blijft.

Voorbeeld:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Voorbeelduitvoer:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Gebruik dit voor onderzoek naar de Plugin-levenscyclus voordat je naar een CPU-profiler grijpt.
Als het commando vanuit een source-checkout draait, meet dan bij voorkeur de gebouwde
runtime met `node dist/entry.js ...` na `pnpm build`; `pnpm openclaw ...`
meet ook overhead van de source-runner.

## CLI-opstart en commandoprofilering

Gebruik de ingecheckte opstartbenchmark wanneer een commando traag aanvoelt:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Stel voor eenmalige profilering via de normale source-runner
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` in:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

De source-runner voegt Node-CPU-profielflags toe en schrijft een `.cpuprofile` voor het
commando. Gebruik dit voordat je tijdelijke instrumentatie aan commandocode toevoegt.

## Gateway-watchmodus

Voer de Gateway voor snelle iteratie uit onder de bestandswatcher:

```bash
pnpm gateway:watch
```

Standaard start of herstart dit een tmux-sessie met de naam
`openclaw-gateway-watch-main` (of een profiel-/poortspecifieke variant zoals
`openclaw-gateway-watch-dev-19001`) en koppelt automatisch aan vanuit interactieve terminals.
Niet-interactieve shells, CI en agent-exec-aanroepen blijven losgekoppeld en drukken in plaats daarvan
koppelinstructies af. Koppel handmatig wanneer nodig:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Het tmux-paneel voert de ruwe watcher uit:

```bash
node scripts/watch-node.mjs gateway --force
```

Gebruik voorgrondmodus wanneer tmux niet gewenst is:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Schakel automatisch koppelen uit terwijl tmux-beheer behouden blijft:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profileer bekeken Gateway-CPU-tijd bij het debuggen van opstart-/runtime-hotspots:

```bash
pnpm gateway:watch --benchmark
```

De watch-wrapper verwerkt `--benchmark` voordat de Gateway wordt aangeroepen en schrijft
één V8 `.cpuprofile` per afsluiting van een Gateway-child onder
`.artifacts/gateway-watch-profiles/`. Stop of herstart de bekeken gateway om
het huidige profiel weg te schrijven, en open het daarna met Chrome DevTools of Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gebruik `--benchmark-dir <path>` wanneer je profielen ergens anders wilt hebben.

De tmux-wrapper neemt gangbare niet-geheime runtime-selectors zoals
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` en `OPENCLAW_SKIP_CHANNELS` mee naar het paneel. Zet
providerreferenties in je normale profiel/configuratie, of gebruik ruwe voorgrondmodus
voor eenmalige tijdelijke geheimen.
Het beheerde tmux-paneel gebruikt ook standaard gekleurde Gateway-logs voor leesbaarheid;
stel `FORCE_COLOR=0` in bij het starten van `pnpm gateway:watch` om ANSI-uitvoer uit te schakelen.

De watcher herstart bij build-relevante bestanden onder `src/`, bronbestanden van extensies,
extensie-`package.json` en `openclaw.plugin.json`-metadata, `tsconfig.json`,
`package.json` en `tsdown.config.ts`. Wijzigingen in extensiemetadata herstarten de
gateway zonder een `tsdown`-rebuild af te dwingen; bron- en configuratiewijzigingen bouwen nog steeds
eerst `dist` opnieuw.

Voeg eventuele Gateway-CLI-flags toe na `gateway:watch` en ze worden bij elke
herstart doorgegeven. Het opnieuw uitvoeren van hetzelfde watchcommando spawnt het genoemde tmux-paneel opnieuw, en
de ruwe watcher behoudt nog steeds zijn single-watcher-lock zodat dubbele watcher-parents
worden vervangen in plaats van op te stapelen.

## Dev-profiel + dev-gateway (--dev)

Gebruik het dev-profiel om state te isoleren en een veilige, wegwerpbare setup te starten voor
debugging. Er zijn **twee** `--dev`-flags:

- **Globale `--dev` (profiel):** isoleert state onder `~/.openclaw-dev` en
  stelt de standaard Gateway-poort in op `19001` (afgeleide poorten schuiven mee).
- **`gateway --dev`: vertelt de Gateway om automatisch een standaardconfiguratie +
  workspace te maken** wanneer die ontbreekt (en BOOTSTRAP.md over te slaan).

Aanbevolen flow (dev-profiel + dev-bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Als je nog geen globale installatie hebt, voer de CLI dan uit via `pnpm openclaw ...`.

Wat dit doet:

1. **Profielisolatie** (globale `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas schuiven overeenkomstig mee)

2. **Dev-bootstrap** (`gateway --dev`)
   - Schrijft een minimale configuratie als die ontbreekt (`gateway.mode=local`, bind loopback).
   - Stelt `agent.workspace` in op de dev-workspace.
   - Stelt `agent.skipBootstrap=true` in (geen BOOTSTRAP.md).
   - Seedt de workspacebestanden als die ontbreken:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standaardidentiteit: **C3‑PO** (protocoldroid).
   - Slaat kanaalproviders over in dev-modus (`OPENCLAW_SKIP_CHANNELS=1`).

Resetflow (frisse start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` is een **globale** profielflag en wordt door sommige runners opgegeten. Als je dit expliciet moet uitschrijven, gebruik dan de env-var-vorm:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` wist configuratie, referenties, sessies en de dev-workspace (met
`trash`, niet `rm`), en maakt daarna de standaard dev-setup opnieuw aan.

<Tip>
Als er al een niet-dev-gateway draait (launchd of systemd), stop die dan eerst:

```bash
openclaw gateway stop
```

</Tip>

## Ruwe streamlogging (OpenClaw)

OpenClaw kan de **ruwe assistant-stream** loggen vóór filtering/opmaak.
Dit is de beste manier om te zien of redenering binnenkomt als plattetekst-delta's
(of als afzonderlijke denkblokken).

Schakel dit in via CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionele padoverschrijving:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Equivalent env-vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standaardbestand:

`~/.openclaw/logs/raw-stream.jsonl`

## Ruwe chunklogging (pi-mono)

Om **ruwe OpenAI-compat chunks** vast te leggen voordat ze naar blokken worden geparsed,
biedt pi-mono een aparte logger:

```bash
PI_RAW_STREAM=1
```

Optioneel pad:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Standaardbestand:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Opmerking: dit wordt alleen uitgezonden door processen die pi-mono's
> `openai-completions`-provider gebruiken.

## Veiligheidsopmerkingen

- Ruwe streamlogs kunnen volledige prompts, tooluitvoer en gebruikersgegevens bevatten.
- Houd logs lokaal en verwijder ze na het debuggen.
- Als je logs deelt, verwijder dan eerst geheimen en PII.

## Gerelateerd

- [Probleemoplossing](/nl/help/troubleshooting)
- [FAQ](/nl/help/faq)

---
read_when:
    - U moet de ruwe modeluitvoer inspecteren op redeneerlekkage
    - Je wilt de Gateway in watch-modus uitvoeren terwijl je iteratief werkt
    - Je hebt een herhaalbare foutopsporingsworkflow nodig
summary: 'Debuggingtools: watch-modus, ruwe modelstreams en het traceren van redeneringslekkage'
title: Debuggen
x-i18n:
    generated_at: "2026-05-05T01:47:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Foutopsporingshulpen voor streaminguitvoer, vooral wanneer een provider redeneringen mengt in normale tekst.

## Runtime-debug-overschrijvingen

Gebruik `/debug` in de chat om **alleen-runtime** config-overschrijvingen in te stellen (geheugen, niet schijf).
`/debug` is standaard uitgeschakeld; schakel het in met `commands.debug: true`.
Dit is handig wanneer je obscure instellingen moet omschakelen zonder `openclaw.json` te bewerken.

Voorbeelden:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` wist alle overschrijvingen en keert terug naar de config op schijf.

## Sessietrace-uitvoer

Gebruik `/trace` wanneer je in één sessie trace-/debugregels van plugins wilt zien
zonder de volledige uitgebreide modus in te schakelen.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Gebruik `/trace` voor plugin-diagnostiek zoals debug-samenvattingen van Active Memory.
Blijf `/verbose` gebruiken voor normale uitgebreide status-/tooluitvoer, en blijf
`/debug` gebruiken voor alleen-runtime config-overschrijvingen.

## Trace van Plugin-levenscyclus

Gebruik `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` wanneer plugin-levenscycluscommando's traag aanvoelen
en je een ingebouwde fase-uitsplitsing nodig hebt voor pluginmetadata, discovery, register,
runtimespiegel, config-mutatie en vernieuwingswerk. De trace is opt-in en schrijft
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

Gebruik dit voor onderzoek naar de plugin-levenscyclus voordat je naar een CPU-profiler grijpt.
Als het commando vanuit een source-checkout draait, meet dan bij voorkeur de gebouwde
runtime met `node dist/entry.js ...` na `pnpm build`; `pnpm openclaw ...`
meet ook overhead van de source-runner.

## CLI-opstarten en commandoprofilering

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

De source-runner voegt Node CPU-profielvlaggen toe en schrijft een `.cpuprofile` voor het
commando. Gebruik dit voordat je tijdelijke instrumentatie aan commandocode toevoegt.

Voor opstartblokkades die lijken op synchroon bestandssysteem- of module-loaderwerk,
voeg je Node's tracevlag voor synchrone I/O toe via de source-runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` schakelt deze vlag standaard in voor het bewaakte Gateway-kindproces.
Stel `OPENCLAW_TRACE_SYNC_IO=0` in om Node-trace-uitvoer voor synchrone I/O in watchmodus
te onderdrukken.

## Gateway-watchmodus

Voor snelle iteratie voer je de Gateway uit onder de bestandswatcher:

```bash
pnpm gateway:watch
```

Standaard start of herstart dit een tmux-sessie met de naam
`openclaw-gateway-watch-main` (of een profiel-/poortspecifieke variant zoals
`openclaw-gateway-watch-dev-19001`) en koppelt automatisch aan vanuit interactieve terminals.
Niet-interactieve shells, CI en agent-exec-aanroepen blijven losgekoppeld en tonen in plaats daarvan
koppelinstructies. Koppel handmatig wanneer nodig:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Het tmux-paneel voert de ruwe watcher uit:

```bash
node scripts/watch-node.mjs gateway --force
```

Gebruik foregroundmodus wanneer tmux niet gewenst is:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Schakel automatisch koppelen uit terwijl tmux-beheer behouden blijft:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profileer bewaakte Gateway-CPU-tijd bij het debuggen van opstart-/runtime-hotspots:

```bash
pnpm gateway:watch --benchmark
```

De watch-wrapper verwerkt `--benchmark` voordat de Gateway wordt aangeroepen en schrijft
één V8 `.cpuprofile` per exit van een Gateway-kindproces onder
`.artifacts/gateway-watch-profiles/`. Stop of herstart de bewaakte gateway om
het huidige profiel weg te schrijven en open het daarna met Chrome DevTools of Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gebruik `--benchmark-dir <path>` wanneer je profielen ergens anders wilt hebben.
Gebruik `--benchmark-no-force` wanneer je wilt dat het gebenchmarkte kindproces de
standaard `--force`-poortopschoning overslaat en snel faalt als de Gateway-poort al in
gebruik is.
Benchmarkmodus onderdrukt standaard sync-I/O-tracespam. Stel
`OPENCLAW_TRACE_SYNC_IO=1` in met `--benchmark` wanneer je expliciet zowel CPU-profielen
als Node sync-I/O-stacktraces wilt. In benchmarkmodus worden die traceblokken
geschreven naar `gateway-watch-output.log` onder de benchmarkdirectory en
uit het terminalpaneel gefilterd; normale Gateway-logs blijven zichtbaar.

De tmux-wrapper neemt gangbare niet-geheime runtimeselectors zoals
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` en `OPENCLAW_SKIP_CHANNELS` mee het paneel in. Plaats
providerreferenties in je normale profiel/config, of gebruik de ruwe foregroundmodus
voor eenmalige vluchtige geheimen.
Als de bewaakte Gateway tijdens het opstarten afsluit, voert de watcher
`openclaw doctor --fix --non-interactive` eenmaal uit en herstart het Gateway-kindproces.
Gebruik `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` wanneer je de oorspronkelijke opstartfout
wilt zonder de alleen-voor-dev reparatiepassage.
Het beheerde tmux-paneel gebruikt ook standaard gekleurde Gateway-logs voor leesbaarheid;
stel `FORCE_COLOR=0` in bij het starten van `pnpm gateway:watch` om ANSI-uitvoer uit te schakelen.

De watcher herstart bij build-relevante bestanden onder `src/`, bronbestanden van extensies,
extensie-`package.json` en `openclaw.plugin.json`-metadata, `tsconfig.json`,
`package.json` en `tsdown.config.ts`. Wijzigingen in extensiemetadata herstarten de
gateway zonder een `tsdown`-rebuild te forceren; bron- en config-wijzigingen bouwen nog steeds
eerst `dist` opnieuw.

Voeg eventuele Gateway-CLI-vlaggen toe na `gateway:watch` en ze worden bij
elke herstart doorgegeven. Het opnieuw uitvoeren van hetzelfde watchcommando spawnt het benoemde tmux-paneel opnieuw, en
de ruwe watcher behoudt nog steeds zijn single-watcher-lock, zodat dubbele watcher-ouders
worden vervangen in plaats van zich op te stapelen.

## Dev-profiel + dev-Gateway (--dev)

Gebruik het dev-profiel om state te isoleren en een veilige, wegwerpbare setup op te starten voor
debugging. Er zijn **twee** `--dev`-vlaggen:

- **Globale `--dev` (profiel):** isoleert state onder `~/.openclaw-dev` en
  stelt de gatewaypoort standaard in op `19001` (afgeleide poorten schuiven mee).
- **`gateway --dev`: vertelt de Gateway om automatisch een standaardconfig +
  workspace aan te maken** wanneer die ontbreekt (en BOOTSTRAP.md over te slaan).

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
   - Schrijft een minimale config als die ontbreekt (`gateway.mode=local`, bind loopback).
   - Stelt `agent.workspace` in op de dev-workspace.
   - Stelt `agent.skipBootstrap=true` in (geen BOOTSTRAP.md).
   - Seedt de workspacebestanden als die ontbreken:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standaardidentiteit: **C3‑PO** (protocol-droid).
   - Slaat kanaalproviders over in devmodus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-flow (frisse start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` is een **globale** profielvlag en wordt door sommige runners opgegeten. Als je het expliciet moet uitschrijven, gebruik dan de env-var-vorm:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` wist config, referenties, sessies en de dev-workspace (met
`trash`, niet `rm`) en maakt daarna de standaard dev-setup opnieuw aan.

<Tip>
Als er al een niet-dev-gateway draait (launchd of systemd), stop die dan eerst:

```bash
openclaw gateway stop
```

</Tip>

## Ruwe streamlogging (OpenClaw)

OpenClaw kan de **ruwe assistant-stream** loggen vóór filtering/formattering.
Dit is de beste manier om te zien of redenering binnenkomt als platte tekstdelta's
(of als afzonderlijke denkblokken).

Schakel dit in via de CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionele padoverschrijving:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Equivalentie env-vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standaardbestand:

`~/.openclaw/logs/raw-stream.jsonl`

## Ruwe chunklogging (pi-mono)

Om **ruwe OpenAI-compat chunks** vast te leggen voordat ze in blokken worden geparseerd,
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

> Opmerking: dit wordt alleen uitgezonden door processen die de
> `openai-completions`-provider van pi-mono gebruiken.

## Veiligheidsnotities

- Ruwe streamlogs kunnen volledige prompts, tooluitvoer en gebruikersdata bevatten.
- Houd logs lokaal en verwijder ze na het debuggen.
- Als je logs deelt, verwijder dan eerst geheimen en PII.

## Gerelateerd

- [Probleemoplossing](/nl/help/troubleshooting)
- [FAQ](/nl/help/faq)

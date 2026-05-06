---
read_when:
    - Je moet de ruwe modeluitvoer inspecteren op lekkage van redeneringen
    - Je wilt de Gateway in watch-modus uitvoeren terwijl je iteratief werkt
    - Je hebt een herhaalbare workflow voor foutopsporing nodig
summary: 'Debuggingtools: watch-modus, ruwe modelstreams en het traceren van redeneringslekkage'
title: Foutopsporing
x-i18n:
    generated_at: "2026-05-06T09:16:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Debughulpmiddelen voor streaminguitvoer, vooral wanneer een provider redenering mengt in normale tekst.

## Runtime-debugoverschrijvingen

Gebruik `/debug` in chat om **alleen-runtime** configuratieoverschrijvingen in te stellen (geheugen, niet schijf).
`/debug` is standaard uitgeschakeld; schakel dit in met `commands.debug: true`.
Dit is handig wanneer je obscure instellingen moet schakelen zonder `openclaw.json` te bewerken.

Voorbeelden:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` wist alle overschrijvingen en keert terug naar de configuratie op schijf.

## Sessietrace-uitvoer

Gebruik `/trace` wanneer je Plugin-eigen trace-/debugregels in één sessie wilt zien
zonder de volledige uitgebreide modus in te schakelen.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Gebruik `/trace` voor Plugin-diagnostiek zoals Active Memory-debugsamenvattingen.
Blijf `/verbose` gebruiken voor normale uitgebreide status-/tooluitvoer, en blijf
`/debug` gebruiken voor alleen-runtime configuratieoverschrijvingen.

## Plugin-lifecycletrace

Gebruik `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` wanneer Plugin-lifecyclecommando's traag aanvoelen
en je een ingebouwde fase-uitsplitsing nodig hebt voor Plugin-metadata, detectie, registry,
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

Gebruik dit voor onderzoek naar de Plugin-lifecycle voordat je naar een CPU-profiler grijpt.
Als het commando wordt uitgevoerd vanuit een source-checkout, meet dan bij voorkeur de gebouwde
runtime met `node dist/entry.js ...` na `pnpm build`; `pnpm openclaw ...`
meet ook overhead van de source-runner.

## CLI-opstart en commandoprofilering

Gebruik de ingecheckte opstartbenchmark wanneer een commando traag aanvoelt:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Voor eenmalige profilering via de normale source-runner stel je
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` in:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

De source-runner voegt Node CPU-profielvlaggen toe en schrijft een `.cpuprofile` voor het
commando. Gebruik dit voordat je tijdelijke instrumentatie toevoegt aan commandocode.

Voor opstartvertragingen die lijken op synchroon bestandssysteem- of module-loaderwerk,
voeg je Node's tracevlag voor synchrone I/O toe via de source-runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` schakelt deze vlag standaard in voor het bewaakte Gateway-kindproces.
Stel `OPENCLAW_TRACE_SYNC_IO=0` in om Node-trace-uitvoer voor synchrone I/O in watchmodus
te onderdrukken.

## Gateway-watchmodus

Voor snelle iteratie voer je de gateway uit onder de file watcher:

```bash
pnpm gateway:watch
```

Standaard start of herstart dit een tmux-sessie met de naam
`openclaw-gateway-watch-main` (of een profiel-/poortspecifieke variant zoals
`openclaw-gateway-watch-dev-19001`) en hecht automatisch aan vanuit interactieve terminals.
Niet-interactieve shells, CI en agent-exec-aanroepen blijven losgekoppeld en drukken in plaats daarvan
instructies voor aanhechten af. Hecht handmatig aan wanneer nodig:

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

Schakel automatisch aanhechten uit terwijl tmux-beheer behouden blijft:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profileer bewaakte Gateway-CPU-tijd bij het debuggen van opstart-/runtimehotspots:

```bash
pnpm gateway:watch --benchmark
```

De watch-wrapper verbruikt `--benchmark` voordat de Gateway wordt aangeroepen en schrijft
één V8 `.cpuprofile` per afsluiting van een Gateway-kindproces onder
`.artifacts/gateway-watch-profiles/`. Stop of herstart de bewaakte gateway om
het huidige profiel weg te schrijven, en open het daarna met Chrome DevTools of Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gebruik `--benchmark-dir <path>` wanneer je profielen ergens anders wilt.
Gebruik `--benchmark-no-force` wanneer je wilt dat het gebenchmarkte kindproces de
standaard `--force`-poortopruiming overslaat en snel faalt als de Gateway-poort al in
gebruik is.
Benchmarkmodus onderdrukt standaard sync-I/O-tracespam. Stel
`OPENCLAW_TRACE_SYNC_IO=1` in met `--benchmark` wanneer je expliciet zowel CPU-profielen
als Node-stacktraces voor synchrone I/O wilt. In benchmarkmodus worden die traceblokken
geschreven naar `gateway-watch-output.log` onder de benchmarkdirectory en
uit het terminalpaneel gefilterd; normale Gateway-logs blijven zichtbaar.

De tmux-wrapper geeft gangbare niet-geheime runtime-selectors zoals
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` en `OPENCLAW_SKIP_CHANNELS` door aan het paneel. Zet
providerreferenties in je normale profiel/configuratie, of gebruik ruwe foregroundmodus
voor eenmalige vluchtige geheimen.
Als de bewaakte Gateway tijdens het opstarten afsluit, voert de watcher
`openclaw doctor --fix --non-interactive` één keer uit en herstart het Gateway-kindproces.
Gebruik `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` wanneer je de oorspronkelijke opstartfout
wilt zonder de alleen-voor-ontwikkeling reparatiestap.
Het beheerde tmux-paneel gebruikt ook standaard gekleurde Gateway-logs voor leesbaarheid;
stel `FORCE_COLOR=0` in bij het starten van `pnpm gateway:watch` om ANSI-uitvoer uit te schakelen.

De watcher herstart bij build-relevante bestanden onder `src/`, bronbestanden van plugins,
Plugin-`package.json` en `openclaw.plugin.json`-metadata, `tsconfig.json`,
`package.json` en `tsdown.config.ts`. Wijzigingen in Plugin-metadata herstarten de
gateway zonder een `tsdown`-rebuild af te dwingen; bron- en configuratiewijzigingen bouwen nog steeds
eerst `dist` opnieuw.

Voeg eventuele gateway-CLI-vlaggen toe na `gateway:watch` en ze worden bij elke
herstart doorgegeven. Het opnieuw uitvoeren van hetzelfde watchcommando spawnt het genoemde tmux-paneel opnieuw, en
de ruwe watcher behoudt nog steeds zijn single-watcher-lock zodat dubbele watcher-ouders
worden vervangen in plaats van zich op te stapelen.

## Ontwikkelprofiel + ontwikkelgateway (--dev)

Gebruik het ontwikkelprofiel om state te isoleren en een veilige, wegwerpbare setup op te starten voor
debugging. Er zijn **twee** `--dev`-vlaggen:

- **Globale `--dev` (profiel):** isoleert state onder `~/.openclaw-dev` en
  stelt de gateway-poort standaard in op `19001` (afgeleide poorten verschuiven mee).
- **`gateway --dev`: vertelt de Gateway om automatisch een standaardconfiguratie +
  workspace aan te maken** wanneer die ontbreekt (en BOOTSTRAP.md over te slaan).

Aanbevolen flow (ontwikkelprofiel + ontwikkelbootstrap):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas verschuiven overeenkomstig)

2. **Ontwikkelbootstrap** (`gateway --dev`)
   - Schrijft een minimale configuratie als die ontbreekt (`gateway.mode=local`, bind loopback).
   - Stelt `agent.workspace` in op de ontwikkelworkspace.
   - Stelt `agent.skipBootstrap=true` in (geen BOOTSTRAP.md).
   - Seedt de workspacebestanden als die ontbreken:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standaardidentiteit: **C3-PO** (protocoldroid).
   - Slaat kanaalproviders over in ontwikkelmodus (`OPENCLAW_SKIP_CHANNELS=1`).

Resetflow (frisse start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` is een **globale** profielvlag en wordt door sommige runners opgeslokt. Als je het expliciet moet uitschrijven, gebruik dan de env-var-vorm:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` wist configuratie, referenties, sessies en de ontwikkelworkspace (met
`trash`, niet `rm`), en maakt daarna de standaard ontwikkelsetup opnieuw aan.

<Tip>
Als er al een niet-ontwikkelgateway draait (launchd of systemd), stop die dan eerst:

```bash
openclaw gateway stop
```

</Tip>

## Ruwe streamlogging (OpenClaw)

OpenClaw kan de **ruwe assistentstream** loggen vóór filtering/formattering.
Dit is de beste manier om te zien of redenering binnenkomt als plattetekstdelta's
(of als afzonderlijke thinking-blokken).

Schakel dit in via CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionele padoverschrijving:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Equivalente env-vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standaardbestand:

`~/.openclaw/logs/raw-stream.jsonl`

## Ruwe chunklogging (pi-mono)

Om **ruwe OpenAI-compat chunks** vast te leggen voordat ze in blokken worden geparsed,
biedt pi-mono een afzonderlijke logger:

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

## Veiligheidsnotities

- Ruwe streamlogs kunnen volledige prompts, tooluitvoer en gebruikersgegevens bevatten.
- Houd logs lokaal en verwijder ze na het debuggen.
- Als je logs deelt, scrub dan eerst geheimen en PII.

## Debuggen in VSCode

Source maps zijn vereist om debuggen in VSCode-gebaseerde IDE's mogelijk te maken, omdat veel van de gegenereerde bestanden als onderdeel van het buildproces gehashte namen krijgen. De meegeleverde `launch.json`-configuraties richten zich op de Gateway-service, maar kunnen snel worden aangepast voor andere doeleinden:

1. **Gateway opnieuw bouwen en debuggen** - Debugt de Gateway-service na het maken van een nieuwe build
2. **Gateway debuggen** - Debugt de Gateway-service van een al bestaande build

### Setup

De standaardconfiguratie **Gateway opnieuw bouwen en debuggen** is volledig uitgerust; deze verwijdert automatisch de map `/dist` en bouwt het project opnieuw met debugging ingeschakeld:

1. Open het paneel **Uitvoeren en debuggen** vanuit de Activity Bar of druk op `Ctrl`+`Shift`+`D`
2. Zorg er in de IDE voor dat **Gateway opnieuw bouwen en debuggen** is geselecteerd in de configuratie-dropdown en druk daarna op de knop **Debuggen starten**

Als alternatief - als je het build- en debugproces liever handmatig beheert:

1. Open een terminal en schakel source maps in:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Bouw in dezelfde terminal het project opnieuw: `pnpm clean:dist && pnpm build`
3. Selecteer in de IDE de optie **Gateway debuggen** in de configuratie-dropdown **Uitvoeren en debuggen** en druk daarna op de knop **Debuggen starten**

Je kunt nu breakpoints zetten in je TypeScript-bronbestanden (directory `src/`) en de debugger zal breakpoints correct koppelen aan de gecompileerde JavaScript via source maps. Je kunt variabelen inspecteren, stap voor stap door code gaan en call stacks bekijken zoals verwacht.

### Notities

- Bij gebruik van de optie **"Gateway opnieuw bouwen en debuggen"** wordt telkens wanneer de debugger wordt gestart de map `/dist` volledig verwijderd en wordt een volledige `pnpm build` met source maps ingeschakeld uitgevoerd voordat de Gateway start
- Bij gebruik van de optie **"Gateway debuggen"** kunnen debugsessies op elk moment worden gestart en gestopt zonder de map `/dist` te beïnvloeden, maar je moet een afzonderlijk terminalproces gebruiken om zowel debugging in te schakelen als de buildcyclus te beheren
- Wijzig de `launch.json`-instellingen voor `args` om andere delen van het project te debuggen
- Als je de gebouwde OpenClaw CLI voor andere taken moet gebruiken (d.w.z. `dashboard --no-open` als je debugsessie een nieuw auth-token spawnt), kun je deze in een andere terminal uitvoeren als `node ./openclaw.mjs` of een shellalias maken zoals `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Gerelateerd

- [Probleemoplossing](/nl/help/troubleshooting)
- [FAQ](/nl/help/faq)

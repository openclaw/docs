---
read_when:
    - Je moet de ruwe modeluitvoer inspecteren op het lekken van redeneringen
    - U wilt de Gateway in watch-modus uitvoeren terwijl u itereert
    - Je hebt een herhaalbare foutopsporingsworkflow nodig
summary: 'Debugginghulpmiddelen: watchmodus, ruwe modelstreams en traceren van reasoning leakage'
title: Debuggen
x-i18n:
    generated_at: "2026-05-11T20:33:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

Debughulpen voor streaminguitvoer, vooral wanneer een provider redenering mengt in normale tekst.

## Runtime-debug-overschrijvingen

Gebruik `/debug` in chat om **alleen-runtime** config-overschrijvingen in te stellen (geheugen, niet schijf).
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

Gebruik `/trace` wanneer je Plugin-eigen trace-/debugregels in één sessie wilt zien
zonder de volledige verbose-modus in te schakelen.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Gebruik `/trace` voor Plugin-diagnostiek zoals Active Memory-debugsamenvattingen.
Blijf `/verbose` gebruiken voor normale verbose-status-/tooluitvoer, en blijf
`/debug` gebruiken voor alleen-runtime config-overschrijvingen.

## Trace van Plugin-levenscyclus

Gebruik `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` wanneer Plugin-levenscycluscommando's traag aanvoelen
en je een ingebouwde fase-uitsplitsing nodig hebt voor Plugin-metadata, ontdekking, register,
runtime-mirror, config-mutatie en refresh-werk. De trace is opt-in en schrijft
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

Gebruik dit voor onderzoek naar de Plugin-levenscyclus voordat je een CPU-profiler gebruikt.
Als het commando vanuit een source-checkout wordt uitgevoerd, meet dan bij voorkeur de gebouwde
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
voeg je Node's tracevlag voor sync-I/O toe via de source-runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` laat deze vlag standaard uitgeschakeld voor het bewaakte
Gateway-childproces. Stel `OPENCLAW_TRACE_SYNC_IO=1` in wanneer je expliciet Node
sync-I/O-trace-uitvoer wilt in watch-modus.

## Gateway-watchmodus

Voor snelle iteratie draai je de gateway onder de file watcher:

```bash
pnpm gateway:watch
```

Standaard start of herstart dit een tmux-sessie met de naam
`openclaw-gateway-watch-main` (of een profiel-/poortspecifieke variant zoals
`openclaw-gateway-watch-dev-19001`) en koppelt het automatisch aan vanuit interactieve terminals.
Niet-interactieve shells, CI en agent-exec-aanroepen blijven losgekoppeld en drukken in plaats daarvan
koppelingsinstructies af. Koppel handmatig wanneer nodig:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Het tmux-paneel voert de ruwe watcher uit:

```bash
node scripts/watch-node.mjs gateway --force
```

Gebruik foreground-modus wanneer tmux niet gewenst is:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Schakel automatisch koppelen uit terwijl tmux-beheer behouden blijft:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profileer bewaakte Gateway-CPU-tijd wanneer je opstart-/runtime-hotspots debugt:

```bash
pnpm gateway:watch --benchmark
```

De watch-wrapper verbruikt `--benchmark` voordat de Gateway wordt aangeroepen en schrijft
één V8 `.cpuprofile` per beëindiging van een Gateway-childproces onder
`.artifacts/gateway-watch-profiles/`. Stop of herstart de bewaakte gateway om
het huidige profiel weg te schrijven, en open het daarna met Chrome DevTools of Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gebruik `--benchmark-dir <path>` wanneer je profielen ergens anders wilt hebben.
Gebruik `--benchmark-no-force` wanneer je wilt dat het gebenchmarkte childproces de
standaard `--force`-poortopruiming overslaat en snel faalt als de Gateway-poort al in
gebruik is.
Benchmarkmodus onderdrukt standaard sync-I/O-trace-spam. Stel
`OPENCLAW_TRACE_SYNC_IO=1` in met `--benchmark` wanneer je expliciet zowel CPU-
profielen als Node sync-I/O-stacktraces wilt. In benchmarkmodus worden die traceblokken
geschreven naar `gateway-watch-output.log` onder de benchmarkdirectory en
uit het terminalpaneel gefilterd; normale Gateway-logs blijven zichtbaar.

De tmux-wrapper neemt algemene niet-geheime runtime-selectors zoals
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` en `OPENCLAW_SKIP_CHANNELS` mee naar het paneel. Zet
providerreferenties in je normale profiel/config, of gebruik ruwe foreground-modus
voor eenmalige vluchtige secrets.
Als de bewaakte Gateway tijdens het opstarten afsluit, voert de watcher
`openclaw doctor --fix --non-interactive` één keer uit en herstart het Gateway-childproces.
Gebruik `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` wanneer je de oorspronkelijke opstartfout
wilt zonder de alleen-voor-dev reparatiepass.
Het beheerde tmux-paneel gebruikt ook standaard gekleurde Gateway-logs voor leesbaarheid;
stel `FORCE_COLOR=0` in bij het starten van `pnpm gateway:watch` om ANSI-uitvoer uit te schakelen.

De watcher herstart bij build-relevante bestanden onder `src/`, extension-bronbestanden,
extension-`package.json` en `openclaw.plugin.json`-metadata, `tsconfig.json`,
`package.json` en `tsdown.config.ts`. Wijzigingen in extension-metadata herstarten de
gateway zonder een `tsdown`-rebuild te forceren; bron- en configwijzigingen bouwen nog steeds
eerst `dist` opnieuw.

Voeg eventuele gateway-CLI-vlaggen toe na `gateway:watch` en ze worden bij
elke herstart doorgegeven. Het opnieuw uitvoeren van hetzelfde watch-commando respawnt het genoemde tmux-paneel, en
de ruwe watcher behoudt nog steeds zijn single-watcher-lock zodat dubbele watcher-parents
worden vervangen in plaats van zich op te stapelen.

## Dev-profiel + dev-gateway (--dev)

Gebruik het dev-profiel om state te isoleren en een veilige, wegwerpbare setup op te zetten voor
debuggen. Er zijn **twee** `--dev`-vlaggen:

- **Globale `--dev` (profiel):** isoleert state onder `~/.openclaw-dev` en
  stelt de gateway-poort standaard in op `19001` (afgeleide poorten verschuiven mee).
- **`gateway --dev`: vertelt de Gateway om automatisch een standaardconfiguratie +
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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas verschuiven overeenkomstig)

2. **Dev-bootstrap** (`gateway --dev`)
   - Schrijft een minimale config als die ontbreekt (`gateway.mode=local`, bind loopback).
   - Stelt `agent.workspace` in op de dev-workspace.
   - Stelt `agent.skipBootstrap=true` in (geen BOOTSTRAP.md).
   - Seedt de workspacebestanden als die ontbreken:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standaardidentiteit: **C3-PO** (protocol-droid).
   - Slaat kanaalproviders over in dev-modus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-flow (verse start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` is een **globale** profielvlag en wordt door sommige runners opgeslokt. Als je die expliciet moet uitschrijven, gebruik dan de env-var-vorm:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` wist config, credentials, sessies en de dev-workspace (met
`trash`, niet `rm`) en maakt daarna de standaard dev-setup opnieuw aan.

<Tip>
Als er al een niet-dev-gateway draait (launchd of systemd), stop die dan eerst:

```bash
openclaw gateway stop
```

</Tip>

## Ruwe streamlogging (OpenClaw)

OpenClaw kan de **ruwe assistant-stream** loggen vóór filtering/opmaak.
Dit is de beste manier om te zien of redenering binnenkomt als platte tekstdelta's
(of als afzonderlijke thinking-blokken).

Schakel dit in via de CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionele padoverschrijving:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Equivalente env vars:

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

> Opmerking: dit wordt alleen uitgegeven door processen die pi-mono's
> `openai-completions`-provider gebruiken.

## Veiligheidsnotities

- Ruwe streamlogs kunnen volledige prompts, tooluitvoer en gebruikersgegevens bevatten.
- Houd logs lokaal en verwijder ze na het debuggen.
- Als je logs deelt, verwijder dan eerst secrets en PII.

## Debuggen in VSCode

Sourcemaps zijn vereist om debuggen in VSCode-gebaseerde IDE's mogelijk te maken, omdat veel van de gegenereerde bestanden als onderdeel van het buildproces gehashte namen krijgen. De meegeleverde `launch.json`-configuraties richten zich op de Gateway-service, maar kunnen snel voor andere doeleinden worden aangepast:

1. **Gateway opnieuw bouwen en debuggen** - Debugt de Gateway-service na het maken van een nieuwe build
2. **Gateway debuggen** - Debugt de Gateway-service van een bestaande build

### Setup

De standaardconfiguratie **Gateway opnieuw bouwen en debuggen** is compleet uitgerust; deze verwijdert automatisch de map `/dist` en bouwt het project opnieuw met debuggen ingeschakeld:

1. Open het paneel **Uitvoeren en debuggen** vanuit de Activity Bar of druk op `Ctrl`+`Shift`+`D`
2. Zorg er in de IDE voor dat **Gateway opnieuw bouwen en debuggen** is geselecteerd in de configuratiekeuzelijst en druk daarna op de knop **Debuggen starten**

Als alternatief - als je de build- en debugprocessen liever handmatig beheert:

1. Open een terminal en schakel sourcemaps in:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Bouw in dezelfde terminal het project opnieuw: `pnpm clean:dist && pnpm build`
3. Selecteer in de IDE de optie **Gateway debuggen** in de configuratiekeuzelijst **Uitvoeren en debuggen** en druk daarna op de knop **Debuggen starten**

Je kunt nu breakpoints zetten in je TypeScript-bronbestanden (`src/`-directory) en de debugger zal breakpoints correct via sourcemaps koppelen aan de gecompileerde JavaScript. Je kunt variabelen inspecteren, stap voor stap door code gaan en call stacks bekijken zoals verwacht.

### Notities

- Als je de optie **"Gateway opnieuw bouwen en debuggen"** gebruikt: elke keer dat de debugger wordt gestart, wordt de map `/dist` volledig verwijderd en wordt een volledige `pnpm build` uitgevoerd met sourcemaps ingeschakeld voordat de Gateway start
- Als je de optie **"Gateway debuggen"** gebruikt: debugsessies kunnen op elk moment worden gestart en gestopt zonder de map `/dist` te beïnvloeden, maar je moet een apart terminalproces gebruiken om zowel debuggen in te schakelen als de buildcyclus te beheren
- Pas de `launch.json`-instellingen voor `args` aan om andere delen van het project te debuggen
- Als je de gebouwde OpenClaw-CLI voor andere taken moet gebruiken (bijv. `dashboard --no-open` als je debugsessie een nieuw auth-token spawnt), kun je die in een andere terminal uitvoeren als `node ./openclaw.mjs` of een shellalias maken zoals `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Gerelateerd

- [Probleemoplossing](/nl/help/troubleshooting)
- [FAQ](/nl/help/faq)

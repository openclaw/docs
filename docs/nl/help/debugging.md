---
read_when:
    - Je moet onbewerkte modeluitvoer inspecteren op reasoning-lekkage
    - Je wilt de Gateway in watch-modus uitvoeren tijdens het itereren
    - Je hebt een herhaalbare debuggingworkflow nodig
summary: 'Debuggingtools: watchmodus, ruwe modelstreams en het traceren van redeneerlekkage'
title: Debuggen
x-i18n:
    generated_at: "2026-06-27T17:38:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

Debughulpmiddelen voor streaminguitvoer, vooral wanneer een provider redenering mengt met normale tekst.

## Runtime-debugoverschrijvingen

Gebruik `/debug` in chat om **alleen-runtime** configuratieoverschrijvingen in te stellen (geheugen, niet schijf).
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

## Sessietrace-uitvoer

Gebruik `/trace` wanneer je door Plugin beheerde trace-/debugregels in één sessie wilt zien
zonder de volledige uitgebreide modus in te schakelen.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Gebruik `/trace` voor Plugin-diagnostiek zoals Active Memory-debugsamenvattingen.
Blijf `/verbose` gebruiken voor normale uitgebreide status-/tooluitvoer en blijf
`/debug` gebruiken voor configuratieoverschrijvingen die alleen voor runtime gelden.

## Plugin-levenscyclus-trace

Gebruik `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` wanneer Plugin-levenscyclusopdrachten traag aanvoelen
en je een ingebouwde fase-uitsplitsing nodig hebt voor Plugin-metadata, ontdekking, register,
runtime-spiegel, configuratiemutatie en vernieuwingswerk. De trace is opt-in en schrijft
naar stderr, zodat JSON-opdrachtuitvoer parseerbaar blijft.

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
Als de opdracht vanuit een source-checkout wordt uitgevoerd, meet dan bij voorkeur de gebouwde
runtime met `node dist/entry.js ...` na `pnpm build`; `pnpm openclaw ...`
meet ook overhead van de source-runner.

## CLI-opstart en opdrachtprofilering

Gebruik de ingecheckte opstartbenchmark wanneer een opdracht traag aanvoelt:

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

De source-runner voegt Node CPU-profielvlaggen toe en schrijft een `.cpuprofile` voor de
opdracht. Gebruik dit voordat je tijdelijke instrumentatie aan opdrachtcode toevoegt.

Voeg voor opstartvertragingen die lijken op synchroon bestandssysteem- of module-loaderwerk
Node's sync-I/O-tracevlag toe via de source-runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` laat deze vlag standaard uitgeschakeld voor het bewaakte
Gateway-child. Stel `OPENCLAW_TRACE_SYNC_IO=1` in wanneer je expliciet Node
sync-I/O-trace-uitvoer in watch-modus wilt.

## Gateway-watchmodus

Voer de Gateway onder de file watcher uit voor snelle iteratie:

```bash
pnpm gateway:watch
```

Standaard start of herstart dit een tmux-sessie met de naam
`openclaw-gateway-watch-main` (of een profiel-/poortspecifieke variant zoals
`openclaw-gateway-watch-dev-19001`) en koppelt het automatisch vanuit interactieve terminals.
Niet-interactieve shells, CI en agent-exec-aanroepen blijven losgekoppeld en drukken in plaats daarvan
koppelinstructies af. Koppel handmatig wanneer nodig:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Het tmux-paneel voert de raw watcher uit:

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
één V8 `.cpuprofile` per Gateway-child-exit onder
`.artifacts/gateway-watch-profiles/`. Stop of herstart de bewaakte gateway om
het huidige profiel weg te schrijven en open het daarna met Chrome DevTools of Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gebruik `--benchmark-dir <path>` wanneer je profielen ergens anders wilt.
Gebruik `--benchmark-no-force` wanneer je wilt dat het gebenchmarkte child de
standaard `--force`-poortopschoning overslaat en snel faalt als de Gateway-poort al in
gebruik is.
Benchmarkmodus onderdrukt standaard sync-I/O-trace-spam. Stel
`OPENCLAW_TRACE_SYNC_IO=1` in met `--benchmark` wanneer je expliciet zowel CPU-
profielen als Node sync-I/O-stacktraces wilt. In benchmarkmodus worden die traceblokken
geschreven naar `gateway-watch-output.log` onder de benchmarkmap en
uit het terminalpaneel gefilterd; normale Gateway-logs blijven zichtbaar.

De tmux-wrapper neemt veelgebruikte niet-geheime runtime-selectors zoals
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` en `OPENCLAW_SKIP_CHANNELS` mee het paneel in. Zet
providerreferenties in je normale profiel/configuratie, of gebruik raw foregroundmodus
voor eenmalige vluchtige geheimen.
Als de bewaakte Gateway tijdens het opstarten afsluit, voert de watcher
`openclaw doctor --fix --non-interactive` één keer uit en herstart het Gateway-child.
Gebruik `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` wanneer je de oorspronkelijke opstartfout
wilt zonder de alleen-voor-dev reparatiepass.
Het beheerde tmux-paneel gebruikt ook standaard gekleurde Gateway-logs voor leesbaarheid;
stel `FORCE_COLOR=0` in bij het starten van `pnpm gateway:watch` om ANSI-uitvoer uit te schakelen.

De watcher herstart bij build-relevante bestanden onder `src/`, extensiebronbestanden,
extensie-`package.json`- en `openclaw.plugin.json`-metadata, `tsconfig.json`,
`package.json` en `tsdown.config.ts`. Wijzigingen in extensiemetadata herstarten de
gateway zonder een `tsdown`-rebuild af te dwingen; bron- en configuratiewijzigingen
bouwen nog steeds eerst `dist`.

Voeg eventuele gateway-CLI-vlaggen toe na `gateway:watch` en ze worden bij
elke herstart doorgegeven. Het opnieuw uitvoeren van dezelfde watch-opdracht respawnt het genoemde tmux-paneel, en
de raw watcher behoudt nog steeds zijn single-watcher-lock zodat dubbele watcher-parents
worden vervangen in plaats van zich op te stapelen.

## Dev-profiel + dev-gateway (--dev)

Gebruik het dev-profiel om state te isoleren en een veilige, wegwerpbare setup op te starten voor
debugging. Er zijn **twee** `--dev`-vlaggen:

- **Globale `--dev` (profiel):** isoleert state onder `~/.openclaw-dev` en
  zet de standaardgatewaypoort op `19001` (afgeleide poorten schuiven mee).
- **`gateway --dev`: vertelt de Gateway dat deze automatisch een standaardconfiguratie +
  workspace moet aanmaken** wanneer die ontbreken (en BOOTSTRAP.md moet overslaan).

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
   - Zet `agent.workspace` op de dev-workspace.
   - Zet `agent.skipBootstrap=true` (geen BOOTSTRAP.md).
   - Seedt de workspacebestanden als ze ontbreken:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standaardidentiteit: **C3-PO** (protocoldroïde).
   - Slaat kanaalproviders over in dev-modus (`OPENCLAW_SKIP_CHANNELS=1`).

Resetflow (frisse start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` is een **globale** profielvlag en wordt door sommige runners opgeslokt. Als je dit expliciet moet uitschrijven, gebruik dan de env-var-vorm:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` wist configuratie, referenties, sessies en de dev-workspace (met
`trash`, niet `rm`) en maakt daarna de standaard dev-setup opnieuw aan.

<Tip>
Als er al een niet-dev-gateway draait (launchd of systemd), stop die dan eerst:

```bash
openclaw gateway stop
```

</Tip>

## Raw stream-logging (OpenClaw)

OpenClaw kan de **raw assistentstream** loggen vóór filtering/opmaak.
Dit is de beste manier om te zien of redenering als platte tekstdelta's aankomt
(of als afzonderlijke denkblokken).

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

## Raw OpenAI-compatibele chunk-logging

Schakel de transportlogger in om **raw OpenAI-compat chunks** vast te leggen voordat ze naar blokken worden geparsed:

```bash
OPENCLAW_RAW_STREAM=1
```

Optioneel pad:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

Standaardbestand:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## Veiligheidsnotities

- Raw stream-logs kunnen volledige prompts, tooluitvoer en gebruikersgegevens bevatten.
- Houd logs lokaal en verwijder ze na het debuggen.
- Als je logs deelt, verwijder dan eerst geheimen en PII.

## Debuggen in VSCode

Source maps zijn vereist om debugging in VSCode-gebaseerde IDE's mogelijk te maken, omdat veel van de gegenereerde bestanden als onderdeel van het buildproces gehashte namen krijgen. De meegeleverde `launch.json`-configuraties richten zich op de Gateway-service, maar kunnen snel voor andere doeleinden worden aangepast:

1. **Rebuild and Debug Gateway** - Debugt de Gateway-service na het maken van een nieuwe build
2. **Debug Gateway** - Debugt de Gateway-service van een al bestaande build

### Setup

De standaardconfiguratie **Rebuild and Debug Gateway** is volledig uitgerust; deze verwijdert automatisch de map `/dist` en bouwt het project opnieuw met debugging ingeschakeld:

1. Open het paneel **Run and Debug** vanuit de Activity Bar of druk op `Ctrl`+`Shift`+`D`
2. Zorg er in de IDE voor dat **Rebuild and Debug Gateway** is geselecteerd in de configuratiedropdown en druk daarna op de knop **Start Debugging**

Als alternatief - als je de build- en debugprocessen liever handmatig beheert:

1. Open een terminal en schakel source maps in:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Bouw het project in dezelfde terminal opnieuw: `pnpm clean:dist && pnpm build`
3. Selecteer in de IDE de optie **Debug Gateway** in de configuratiedropdown **Run and Debug** en druk daarna op de knop **Start Debugging**

Je kunt nu breakpoints instellen in je TypeScript-bronbestanden (`src/`-map) en de debugger koppelt breakpoints correct aan de gecompileerde JavaScript via source maps. Je kunt variabelen inspecteren, stap voor stap door code gaan en call stacks onderzoeken zoals verwacht.

### Notities

- Bij gebruik van de optie **"Rebuild and Debug Gateway"** wordt telkens wanneer de debugger wordt gestart de map `/dist` volledig verwijderd en wordt een volledige `pnpm build` met source maps ingeschakeld uitgevoerd voordat de Gateway start
- Bij gebruik van de optie **"Debug Gateway"** kunnen debugsessies op elk moment worden gestart en gestopt zonder de map `/dist` te beïnvloeden, maar je moet een afzonderlijk terminalproces gebruiken om zowel debugging in te schakelen als de buildcyclus te beheren
- Pas de `launch.json`-instellingen voor `args` aan om andere delen van het project te debuggen
- Als je de gebouwde OpenClaw CLI voor andere taken moet gebruiken (bijv. `dashboard --no-open` als je debugsessie een nieuw auth-token spawnt), kun je deze in een andere terminal uitvoeren als `node ./openclaw.mjs` of een shellalias maken zoals `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Gerelateerd

- [Probleemoplossing](/nl/help/troubleshooting)
- [FAQ](/nl/help/faq)

---
read_when:
    - U moet de onbewerkte modeluitvoer controleren op het uitlekken van redeneringen
    - Je wilt de Gateway in watch-modus uitvoeren terwijl je wijzigingen aanbrengt
    - Je hebt een herhaalbare workflow voor foutopsporing nodig
summary: 'Debuggingtools: bewakingsmodus, onbewerkte modelstreams en het traceren van weggelekte redeneringen'
title: Foutopsporing
x-i18n:
    generated_at: "2026-07-12T08:53:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Hulpmiddelen voor foutopsporing bij streaminguitvoer, Gateway-iteratie en profilering van het opstarten.

## Overschrijvingen voor runtimefoutopsporing

`/debug` stelt **uitsluitend voor de runtime geldende** configuratieoverschrijvingen in (in het geheugen, niet op schijf). Standaard uitgeschakeld; schakel dit in met `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` wist alle overschrijvingen en keert terug naar de configuratie op schijf.

## Uitvoer van sessietraces

`/trace` toont trace-/foutopsporingsregels die eigendom zijn van een plugin voor één sessie, zonder de volledig uitgebreide modus in te schakelen. Gebruik dit voor plugindiagnostiek, zoals foutopsporingsoverzichten van Active Memory; gebruik `/verbose` voor normale status-/tooluitvoer.

```text
/trace
/trace on
/trace off
```

## Trace van de levenscyclus van plugins

Stel `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` in voor een uitsplitsing per fase van pluginmetadata, detectie, register, runtimespiegeling, configuratiewijziging en vernieuwingswerk. Schrijft naar stderr, zodat JSON-opdrachtuitvoer parseerbaar blijft.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Gebruik dit voordat u naar een CPU-profiler grijpt. Meet vanuit een broncodecheckout de gebouwde runtime met `node dist/entry.js ...` na `pnpm build`; `pnpm openclaw ...` meet ook de overhead van de broncoderunner.

## Profilering van CLI-opstart en opdrachten

In de repository opgenomen opstartbenchmarks:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Stel voor eenmalige profilering via de normale broncoderunner `OPENCLAW_RUN_NODE_CPU_PROF_DIR` in:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

De broncoderunner voegt CPU-profielvlaggen van Node toe en schrijft een `.cpuprofile` voor de opdracht. Gebruik dit voordat u tijdelijke instrumentatie aan opdrachtcode toevoegt.

Voeg bij vastlopers tijdens het opstarten die op synchrone bestandssysteem- of moduleloaderactiviteit lijken, de traceringsvlag voor synchrone I/O van Node toe via de broncoderunner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` laat deze vlag standaard uitgeschakeld voor het bewaakte onderliggende Gateway-proces; stel `OPENCLAW_TRACE_SYNC_IO=1` in als u ook in de bewakingsmodus trace-uitvoer voor synchrone I/O wilt.

## Gateway-bewakingsmodus

```bash
pnpm gateway:watch
```

Standaard start of herstart dit een tmux-sessie met de naam `openclaw-gateway-watch-<profile>` (bijvoorbeeld `openclaw-gateway-watch-main`), waarbij alleen een poortsuffix zoals `openclaw-gateway-watch-dev-19001` wordt toegevoegd als `OPENCLAW_GATEWAY_PORT` afwijkt van de standaardpoort `18789`. Vanuit interactieve terminals wordt automatisch verbinding gemaakt; niet-interactieve shells, CI en agent-uitvoeraanroepen blijven losgekoppeld en tonen in plaats daarvan instructies om verbinding te maken:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Het tmux-deelvenster voert de onbewerkte watcher uit:

```bash
node scripts/watch-node.mjs gateway --force
```

Stop een geïnstalleerde Gateway-service voordat u dezelfde poort bewaakt:

```bash
pnpm openclaw gateway stop
```

De `--force` van de watcher ruimt de huidige luisterende instantie op, maar schakelt een bewaakte service niet uit. Een launchd-, systemd- of Scheduled Task-service kan anders opnieuw worden gestart en de bewaakte Gateway vervangen.

Voorgrondmodus zonder tmux:

```bash
pnpm gateway:watch:raw
# of
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Behoud tmux-beheer, maar schakel automatisch verbinden uit:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profileer de CPU-tijd van de bewaakte Gateway bij het opsporen van knelpunten tijdens het opstarten of uitvoeren:

```bash
pnpm gateway:watch --benchmark
```

De bewakingswrapper verwerkt `--benchmark` voordat de Gateway wordt aangeroepen en schrijft bij elke afsluiting van een onderliggend Gateway-proces één V8-`.cpuprofile` onder `.artifacts/gateway-watch-profiles/`. Stop of herstart de bewaakte Gateway om het huidige profiel weg te schrijven en open het daarna met Chrome DevTools of Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: schrijf profielen naar een andere locatie.
- `--benchmark-no-force`: sla de standaardopschoning van de poort met `--force` over en stop direct met een fout als de Gateway-poort al in gebruik is.

De benchmarkmodus onderdrukt standaard de overvloedige trace-uitvoer voor synchrone I/O. Stel `OPENCLAW_TRACE_SYNC_IO=1` in met `--benchmark` om zowel CPU-profielen als stacktraces voor synchrone I/O te krijgen; in de benchmarkmodus worden die traceblokken naar `gateway-watch-output.log` in de benchmarkmap geschreven (en uit het terminalvenster gefilterd), terwijl normale Gateway-logboeken zichtbaar blijven.

De tmux-wrapper geeft veelgebruikte niet-geheime runtimeselectoren door aan het deelvenster, waaronder `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` en `OPENCLAW_SKIP_CHANNELS`. Plaats providerreferenties in uw normale profiel/configuratie, of gebruik de onbewerkte voorgrondmodus voor eenmalige tijdelijke geheimen.

Als de bewaakte Gateway tijdens het opstarten afsluit, voert de watcher eenmaal `openclaw doctor --fix --non-interactive` uit en herstart deze het onderliggende Gateway-proces. Stel `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` in om de oorspronkelijke opstartfout te zien zonder de uitsluitend voor ontwikkeling bedoelde herstelstap.

Het beheerde tmux-deelvenster gebruikt standaard gekleurde Gateway-logboeken; stel `FORCE_COLOR=0` in wanneer u `pnpm gateway:watch` start om ANSI-uitvoer uit te schakelen.

De watcher herstart bij wijzigingen in buildrelevante bestanden onder `src/`, bronbestanden van extensies, de metadata in `package.json` en `openclaw.plugin.json` van extensies, `tsconfig.json`, `package.json` en `tsdown.config.ts`. Wijzigingen in extensiemetadata herstarten de Gateway zonder een rebuild af te dwingen; wijzigingen in broncode en configuratie bouwen nog steeds eerst `dist` opnieuw.

Voeg CLI-vlaggen voor de Gateway toe na `gateway:watch`; ze worden bij elke herstart doorgegeven. Als dezelfde bewakingsopdracht opnieuw wordt uitgevoerd, wordt het tmux-deelvenster met die naam opnieuw gestart; de onbewerkte watcher gebruikt een vergrendeling voor één watcher, zodat dubbele bovenliggende watcherprocessen worden vervangen in plaats van zich op te stapelen.

## Ontwikkelprofiel + ontwikkel-Gateway (--dev)

Twee **afzonderlijke** `--dev`-vlaggen:

- **Globale `--dev` (profiel):** isoleert statusgegevens onder `~/.openclaw-dev` en stelt de Gateway-poort standaard in op `19001` (afgeleide poorten verschuiven mee).
- **`gateway --dev`:** geeft de Gateway opdracht automatisch een standaardconfiguratie en werkruimte aan te maken wanneer deze ontbreken (en bootstrap over te slaan).

Aanbevolen werkwijze (ontwikkelprofiel + ontwikkelbootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Voer zonder globale installatie de CLI uit via `pnpm openclaw ...`.

Wat dit doet:

1. **Profielisolatie** (globale `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser-/canvaspoorten verschuiven overeenkomstig)

2. **Ontwikkelbootstrap** (`gateway --dev`)
   - Schrijft een minimale configuratie als die ontbreekt (`gateway.mode=local`, binding aan local loopback).
   - Stelt `agents.defaults.workspace` in op de ontwikkelwerkruimte en `agents.defaults.skipBootstrap=true`.
   - Maakt ontbrekende werkruimtebestanden aan: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Standaardidentiteit: **C3-PO** (protocol-droid).
   - `pnpm gateway:dev` stelt ook `OPENCLAW_SKIP_CHANNELS=1` in om kanaalproviders over te slaan.

Herstelprocedure (schone start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` is een **globale** profielvlag en wordt door sommige runners onderschept. Gebruik de vorm met een omgevingsvariabele als u deze expliciet moet opgeven:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` wist configuratie, referenties, sessies en de ontwikkelwerkruimte (verplaatst naar de prullenbak, niet verwijderd) en maakt daarna de standaardontwikkelomgeving opnieuw aan.

<Tip>
Als er al een niet-ontwikkel-Gateway actief is (launchd of systemd), stop deze dan eerst:

```bash
openclaw gateway stop
```

</Tip>

## Logboekregistratie van de onbewerkte stream

OpenClaw kan de **onbewerkte assistentstream** vastleggen voordat filtering of opmaak plaatsvindt. Dit is de beste manier om te zien of redeneringen binnenkomen als plattetekstdelta's (of als afzonderlijke denkblokken).

Schakel dit in via de CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionele overschrijving van het pad:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Overeenkomstige omgevingsvariabelen:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standaardbestand: `~/.openclaw/logs/raw-stream.jsonl`

## Veiligheidsopmerkingen

- Logboeken van onbewerkte streams kunnen volledige prompts, tooluitvoer en gebruikersgegevens bevatten.
- Bewaar logboeken lokaal en verwijder ze na het foutopsporen.
- Verwijder eerst geheimen en persoonsgegevens als u logboeken deelt.

## Foutopsporing in VSCode

Bronmappen zijn vereist omdat de build gegenereerde bestandsnamen hasht. De meegeleverde `launch.json` is gericht op de Gateway-service:

1. **Rebuild and Debug Gateway** - verwijdert `/dist` en bouwt opnieuw met foutopsporing ingeschakeld voordat de Gateway wordt gestart.
2. **Debug Gateway** - spoort fouten op in een bestaande build zonder `/dist` te wijzigen.

### Instellen

1. Open **Run and Debug** (Activity Bar of `Ctrl`+`Shift`+`D`).
2. Selecteer **Rebuild and Debug Gateway** en druk op **Start Debugging**.

U kunt de build-/foutopsporingscyclus ook als volgt handmatig beheren:

1. Schakel bronmappen in een terminal in:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Bouw opnieuw: `pnpm clean:dist && pnpm build`
3. Selecteer **Debug Gateway** en druk op **Start Debugging**.

Stel breekpunten in TypeScript-bestanden onder `src/` in; de debugger koppelt ze via bronmappen aan de gecompileerde JavaScript-code.

### Opmerkingen

- **Rebuild and Debug Gateway** verwijdert `/dist` en voert bij elke start een volledige `pnpm build` uit met bronmappen.
- **Debug Gateway** kan starten en stoppen zonder `/dist` te beïnvloeden, maar u beheert de buildcyclus in een afzonderlijke terminal.
- Bewerk de `args` in `launch.json` om andere CLI-subopdrachten te debuggen.
- Als u de gebouwde CLI voor andere taken wilt gebruiken (bijvoorbeeld `dashboard --no-open` als uw foutopsporingssessie een nieuw authenticatietoken aanmaakt), voert u deze uit vanuit een andere terminal: `node ./openclaw.mjs` of een alias zoals `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Gerelateerd

- [Probleemoplossing](/nl/help/troubleshooting)
- [Veelgestelde vragen](/nl/help/faq)

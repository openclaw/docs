---
read_when:
    - Je moet de ruwe modeluitvoer inspecteren op lekkage van redeneerinformatie
    - Je wilt de Gateway in watch-modus uitvoeren tijdens het itereren
    - Je hebt een herhaalbare workflow voor foutopsporing nodig
summary: 'Foutopsporingshulpmiddelen: watchmodus, onbewerkte modelstreams en het traceren van redeneerlekkage'
title: Foutopsporing
x-i18n:
    generated_at: "2026-05-03T21:34:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Hulpmiddelen voor debugging van streaming-uitvoer, vooral wanneer een provider redeneringen mengt met normale tekst.

## Runtime-debugoverschrijvingen

Gebruik `/debug` in chat om **runtime-only** configuratieoverschrijvingen in te stellen (geheugen, niet schijf).
`/debug` is standaard uitgeschakeld; schakel het in met `commands.debug: true`.
Dit is handig wanneer je obscure instellingen moet omschakelen zonder `openclaw.json` te bewerken.

Voorbeelden:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` wist alle overschrijvingen en keert terug naar de configuratie op schijf.

## Uitvoer van sessietraces

Gebruik `/trace` wanneer je door Plugins beheerde trace-/debugregels in één sessie wilt zien
zonder de volledige verbose-modus in te schakelen.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Gebruik `/trace` voor Plugin-diagnostiek zoals Active Memory-debugsamenvattingen.
Blijf `/verbose` gebruiken voor normale verbose status-/tooluitvoer, en blijf
`/debug` gebruiken voor runtime-only configuratieoverschrijvingen.

## Plugin-lifecycletrace

Gebruik `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` wanneer Plugin-lifecyclecommando's traag aanvoelen
en je een ingebouwde fase-uitsplitsing nodig hebt voor Plugin-metadata, ontdekking, registry,
runtime-mirror, configuratiemutatie en verversingswerk. De trace is opt-in en schrijft
naar stderr, zodat JSON-commandouitvoer parsebaar blijft.

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
Als het commando vanuit een source-checkout wordt uitgevoerd, meet dan bij voorkeur de gebouwde
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

De source-runner voegt Node CPU-profielflags toe en schrijft een `.cpuprofile` voor het
commando. Gebruik dit voordat je tijdelijke instrumentatie aan commandocode toevoegt.

## Gateway-watchmodus

Voer de Gateway voor snelle iteratie uit onder de file watcher:

```bash
pnpm gateway:watch
```

Standaard start of herstart dit een tmux-sessie met de naam
`openclaw-gateway-watch-main` (of een profiel-/poortspecifieke variant zoals
`openclaw-gateway-watch-dev-19001`) en koppelt het automatisch aan vanuit interactieve terminals.
Niet-interactieve shells, CI en agent-exec-aanroepen blijven losgekoppeld en drukken in plaats daarvan
instructies voor aankoppelen af. Koppel handmatig aan wanneer nodig:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Het tmux-pane voert de raw watcher uit:

```bash
node scripts/watch-node.mjs gateway --force
```

Gebruik foreground-modus wanneer tmux niet gewenst is:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Schakel automatisch aankoppelen uit terwijl tmux-beheer behouden blijft:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profile Gateway-CPU-tijd onder watch wanneer je opstart-/runtimehotspots debugt:

```bash
pnpm gateway:watch --benchmark
```

De watch-wrapper verwerkt `--benchmark` voordat de Gateway wordt aangeroepen en schrijft
één V8-`.cpuprofile` per afsluiting van een Gateway-child onder
`.artifacts/gateway-watch-profiles/`. Stop of herstart de bewaakte gateway om
het huidige profiel weg te schrijven, en open het daarna met Chrome DevTools of Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gebruik `--benchmark-dir <path>` wanneer je profielen ergens anders wilt hebben.
Gebruik `--benchmark-no-force` wanneer je wilt dat de gebenchmarkte child de
standaard `--force`-poortopruiming overslaat en snel faalt als de Gateway-poort al in
gebruik is.

De tmux-wrapper neemt gangbare niet-geheime runtime-selectors zoals
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` en `OPENCLAW_SKIP_CHANNELS` mee naar het pane. Zet
providerreferenties in je normale profiel/configuratie, of gebruik raw foreground-modus
voor eenmalige vluchtige secrets.
Als de bewaakte Gateway tijdens het opstarten afsluit, voert de watcher
`openclaw doctor --fix --non-interactive` één keer uit en herstart daarna de Gateway-child.
Gebruik `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` wanneer je de oorspronkelijke opstartfout
wilt zonder de repair-pass die alleen voor ontwikkeling is bedoeld.
Het beheerde tmux-pane gebruikt ook standaard gekleurde Gateway-logs voor leesbaarheid;
stel `FORCE_COLOR=0` in bij het starten van `pnpm gateway:watch` om ANSI-uitvoer uit te schakelen.

De watcher herstart bij build-relevante bestanden onder `src/`, extensiebronbestanden,
extensie-`package.json`- en `openclaw.plugin.json`-metadata, `tsconfig.json`,
`package.json` en `tsdown.config.ts`. Wijzigingen in extensiemetadata herstarten de
gateway zonder een `tsdown`-rebuild te forceren; bron- en configuratiewijzigingen
bouwen nog steeds eerst `dist` opnieuw.

Voeg Gateway-CLI-flags toe na `gateway:watch` en ze worden bij elke herstart doorgegeven.
Het opnieuw uitvoeren van hetzelfde watchcommando start het benoemde tmux-pane opnieuw, en
de raw watcher behoudt nog steeds zijn single-watcher-lock zodat dubbele watcher-parents
worden vervangen in plaats van zich op te stapelen.

## Dev-profiel + dev-gateway (--dev)

Gebruik het dev-profiel om state te isoleren en een veilige, wegwerpbare setup op te starten voor
debugging. Er zijn **twee** `--dev`-flags:

- **Globale `--dev` (profiel):** isoleert state onder `~/.openclaw-dev` en
  zet de standaard Gateway-poort op `19001` (afgeleide poorten schuiven mee).
- **`gateway --dev`: vertelt de Gateway om automatisch een standaardconfiguratie +
  workspace aan te maken** wanneer die ontbreken (en BOOTSTRAP.md over te slaan).

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
   - Seedt de workspacebestanden als die ontbreken:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standaardidentiteit: **C3‑PO** (protocoldroid).
   - Slaat channelproviders over in dev-modus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-flow (frisse start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` is een **globale** profielflag en wordt door sommige runners opgeslokt. Als je hem expliciet moet uitschrijven, gebruik dan de env-var-vorm:

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

OpenClaw kan de **raw assistentstream** loggen vóór filtering/formattering.
Dit is de beste manier om te zien of redenering als plattetekst-delta's aankomt
(of als afzonderlijke thinking blocks).

Schakel dit in via de CLI:

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

## Raw chunk-logging (pi-mono)

Om **raw OpenAI-compat chunks** vast te leggen voordat ze in blokken worden geparseerd,
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

- Raw stream-logs kunnen volledige prompts, tooluitvoer en gebruikersgegevens bevatten.
- Houd logs lokaal en verwijder ze na het debuggen.
- Als je logs deelt, verwijder dan eerst secrets en PII.

## Gerelateerd

- [Probleemoplossing](/nl/help/troubleshooting)
- [FAQ](/nl/help/faq)

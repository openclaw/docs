---
read_when:
    - Je moet de ruwe modeluitvoer inspecteren op redeneringslekkage
    - Je wilt de Gateway in watch-modus uitvoeren terwijl je itereert
    - Je hebt een herhaalbare foutopsporingsworkflow nodig
summary: 'Foutopsporingshulpmiddelen: observatiemodus, onbewerkte modelstromen en het traceren van redeneerlekkage'
title: Debuggen
x-i18n:
    generated_at: "2026-05-02T11:18:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7e28dd5f352abd8d751def61bb56acb6f22663600effdada14bf4a40214f62b
    source_path: help/debugging.md
    workflow: 16
---

Foutopsporingshulpmiddelen voor streaminguitvoer, vooral wanneer een provider redeneringen mengt in normale tekst.

## Runtime-debug-overschrijvingen

Gebruik `/debug` in de chat om **alleen-runtime** configuratie-overschrijvingen in te stellen (geheugen, niet schijf).
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

## Sessietrace-uitvoer

Gebruik `/trace` wanneer je Plugin-eigen trace-/debugregels in één sessie wilt zien
zonder volledige verbose-modus in te schakelen.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Gebruik `/trace` voor Plugin-diagnostiek zoals Active Memory-debugsamenvattingen.
Blijf `/verbose` gebruiken voor normale verbose status-/tooluitvoer, en blijf
`/debug` gebruiken voor alleen-runtime configuratie-overschrijvingen.

## Plugin-levenscyclus-trace

Gebruik `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` wanneer Plugin-levenscycluscommando's traag aanvoelen
en je een ingebouwde fase-uitsplitsing nodig hebt voor Plugin-metadata, discovery, registry,
runtime-mirror, configuratiemutatie en refreshwerk. De trace is opt-in en schrijft
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
Als het commando wordt uitgevoerd vanuit een source checkout, meet dan bij voorkeur de gebouwde
runtime met `node dist/entry.js ...` na `pnpm build`; `pnpm openclaw ...`
meet ook overhead van de source-runner.

## Tijdelijke CLI-debugtiming

OpenClaw houdt `src/cli/debug-timing.ts` bij als een klein hulpmiddel voor lokaal
onderzoek. Het is opzettelijk standaard niet gekoppeld aan CLI-opstart, commandorouting
of enig commando. Gebruik het alleen tijdens het debuggen van een traag commando, en
verwijder daarna de import en spans voordat je de gedragswijziging landt.

Gebruik dit wanneer een commando traag is en je een snelle fase-uitsplitsing nodig hebt voordat
je beslist of je een CPU-profiler moet gebruiken of een specifiek subsysteem moet repareren.

### Tijdelijke spans toevoegen

Voeg het hulpmiddel toe nabij de code die je onderzoekt. Bijvoorbeeld, tijdens het debuggen
van `openclaw models list` kan een tijdelijke patch in
`src/commands/models/list.list-command.ts` er zo uitzien:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Richtlijnen:

- Prefix tijdelijke fasenamen met `debug:`.
- Voeg slechts enkele spans toe rond vermoedelijk trage secties.
- Geef de voorkeur aan brede fasen zoals `registry`, `auth_store` of `rows` boven helpernamen.
- Gebruik `time()` voor synchroon werk en `timeAsync()` voor promises.
- Houd stdout schoon. Het hulpmiddel schrijft naar stderr, zodat JSON-commando-uitvoer
  parseerbaar blijft.
- Verwijder tijdelijke imports en spans voordat je de uiteindelijke fix-PR opent.
- Neem de timinguitvoer of een korte samenvatting op in het issue of de PR die de
  optimalisatie uitlegt.

### Uitvoeren met leesbare uitvoer

Leesbare modus is het beste voor live-debugging:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Voorbeelduitvoer van een tijdelijk `models list`-onderzoek:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Bevindingen uit deze uitvoer:

| Fase                                     |       Tijd | Wat het betekent                                                                                         |
| ---------------------------------------- | ---------: | -------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Het laden van de auth-profielstore is de grootste kostenpost en moet eerst worden onderzocht.            |
| `debug:models:list:ensure_models_json`   |       5.0s | Het synchroniseren van `models.json` is duur genoeg om te inspecteren op caching of oversla-condities.   |
| `debug:models:list:load_model_registry`  |       5.9s | Registry-opbouw en provider-beschikbaarheidswerk zijn ook betekenisvolle kostenposten.                   |
| `debug:models:list:read_registry_models` |       2.4s | Het lezen van alle registry-modellen is niet gratis en kan relevant zijn voor `--all`.                   |
| row-toevoegfasen                         | 3.2s totaal | Vijf weergegeven rijen bouwen duurt nog steeds meerdere seconden, dus het filterpad verdient nadere blik. |
| `debug:models:list:print_model_table`    |        0ms | Rendering is niet de bottleneck.                                                                         |

Die bevindingen zijn genoeg om de volgende patch te sturen zonder timingcode in
productiepaden te houden.

### Uitvoeren met JSON-uitvoer

Gebruik JSON-modus wanneer je timingdata wilt opslaan of vergelijken:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Elke stderr-regel is één JSON-object:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Opruimen vóór landing

Voordat je de uiteindelijke PR opent:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Het commando zou geen tijdelijke instrumentatie-call-sites moeten teruggeven tenzij de PR
expliciet een permanent diagnostiekoppervlak toevoegt. Houd voor normale prestatie-
fixes alleen de gedragswijziging, tests en een korte notitie met timingbewijs over.

Gebruik voor diepere CPU-hotspots Node-profiling (`--cpu-prof`) of een externe
profiler in plaats van meer timingwrappers toe te voegen.

## Gateway-watchmodus

Voor snelle iteratie voer je de Gateway uit onder de bestandswatcher:

```bash
pnpm gateway:watch
```

Standaard start of herstart dit een tmux-sessie met de naam
`openclaw-gateway-watch-main` (of een profiel-/poortspecificieke variant zoals
`openclaw-gateway-watch-dev-19001`) en wordt automatisch gekoppeld vanuit interactieve terminals.
Niet-interactieve shells, CI en agent-exec-calls blijven detached en printen in plaats daarvan
koppelinstructies. Koppel handmatig wanneer nodig:

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

Schakel automatisch koppelen uit terwijl tmux-beheer behouden blijft:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

De tmux-wrapper neemt algemene niet-geheime runtimeselectors zoals
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` en `OPENCLAW_SKIP_CHANNELS` mee naar het pane. Plaats
providerreferenties in je normale profiel/configuratie, of gebruik raw foreground-modus
voor eenmalige tijdelijke geheimen.
Het beheerde tmux-pane gebruikt ook standaard gekleurde Gateway-logs voor leesbaarheid;
stel `FORCE_COLOR=0` in bij het starten van `pnpm gateway:watch` om ANSI-uitvoer uit te schakelen.

De watcher herstart op build-relevante bestanden onder `src/`, extensiebronbestanden,
extensie-`package.json` en `openclaw.plugin.json`-metadata, `tsconfig.json`,
`package.json` en `tsdown.config.ts`. Wijzigingen in extensiemetadata herstarten de
Gateway zonder een `tsdown`-rebuild af te dwingen; bron- en configuratiewijzigingen
bouwen nog steeds eerst `dist`.

Voeg eventuele Gateway-CLI-flags toe na `gateway:watch` en ze worden bij elke herstart
doorgegeven. Hetzelfde watchcommando opnieuw uitvoeren spawnt het genoemde tmux-pane opnieuw, en
de raw watcher behoudt nog steeds zijn single-watcher-lock zodat dubbele watcher-parents
worden vervangen in plaats van zich op te stapelen.

## Dev-profiel + dev-Gateway (--dev)

Gebruik het dev-profiel om state te isoleren en een veilige, wegwerpbare setup te starten voor
debugging. Er zijn **twee** `--dev`-flags:

- **Globale `--dev` (profiel):** isoleert state onder `~/.openclaw-dev` en
  zet de standaard-Gateway-poort op `19001` (afgeleide poorten schuiven mee).
- **`gateway --dev`: vertelt de Gateway om automatisch een standaardconfiguratie +
  workspace** aan te maken wanneer die ontbreekt (en BOOTSTRAP.md over te slaan).

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
   - Standaardidentiteit: **C3‑PO** (protocol droid).
   - Slaat kanaalproviders over in dev-modus (`OPENCLAW_SKIP_CHANNELS=1`).

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
`trash`, niet `rm`), en maakt daarna de standaard-dev-setup opnieuw aan.

<Tip>
Als er al een niet-dev-Gateway draait (launchd of systemd), stop die dan eerst:

```bash
openclaw gateway stop
```

</Tip>

## Raw-streamlogging (OpenClaw)

OpenClaw kan de **ruwe assistentstream** loggen voordat filtering/opmaak plaatsvindt.
Dit is de beste manier om te zien of redenering binnenkomt als plattetekst-delta's
(of als afzonderlijke denkblokken).

Schakel dit in via de CLI:

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

> Opmerking: dit wordt alleen uitgezonden door processen die de
> `openai-completions`-provider van pi-mono gebruiken.

## Veiligheidsopmerkingen

- Ruwe streamlogs kunnen volledige prompts, tooluitvoer en gebruikersgegevens bevatten.
- Houd logs lokaal en verwijder ze na het debuggen.
- Als je logs deelt, verwijder dan eerst geheimen en PII.

## Gerelateerd

- [Probleemoplossing](/nl/help/troubleshooting)
- [FAQ](/nl/help/faq)

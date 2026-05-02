---
read_when:
    - Je moet ruwe modeluitvoer inspecteren op lekkage van redeneringen
    - Je wilt de Gateway in watch-modus uitvoeren terwijl je iteratief werkt
    - Je hebt een herhaalbare workflow voor foutopsporing nodig
summary: 'Debugtools: watch-modus, ruwe modelstreams en het traceren van redeneerlekkage'
title: Debuggen
x-i18n:
    generated_at: "2026-05-02T20:45:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

Foutopsporingshelpers voor streaming-uitvoer, vooral wanneer een provider reasoning in normale tekst mengt.

## Runtime debug-overschrijvingen

Gebruik `/debug` in chat om **alleen-runtime** configuratie-overschrijvingen in te stellen (geheugen, niet schijf).
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
zonder volledige uitgebreide modus in te schakelen.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Gebruik `/trace` voor Plugin-diagnostiek zoals Active Memory debug-samenvattingen.
Blijf `/verbose` gebruiken voor normale uitgebreide status-/tooluitvoer, en blijf
`/debug` gebruiken voor alleen-runtime configuratie-overschrijvingen.

## Plugin-levenscyclustrace

Gebruik `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` wanneer Plugin-levenscycluscommando's traag aanvoelen
en je een ingebouwde fase-uitsplitsing nodig hebt voor Plugin-metadata, discovery, registry,
runtime-mirror, configuratiemutatie en refresh-werk. De trace is opt-in en schrijft
naar stderr, zodat JSON-commando-uitvoer parsebaar blijft.

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
Als het commando vanuit een source-checkout wordt uitgevoerd, meet dan bij voorkeur de gebouwde
runtime met `node dist/entry.js ...` na `pnpm build`; `pnpm openclaw ...`
meet ook overhead van de source-runner.

## Tijdelijke CLI-debugtiming

OpenClaw behoudt `src/cli/debug-timing.ts` als kleine helper voor lokaal
onderzoek. Deze is bewust standaard niet gekoppeld aan CLI-opstart, commandorouting
of enig commando. Gebruik deze alleen tijdens het debuggen van een traag commando, en
verwijder daarna de import en spans voordat je de gedragswijziging landt.

Gebruik dit wanneer een commando traag is en je een snelle fase-uitsplitsing nodig hebt voordat
je beslist of je een CPU-profiler gebruikt of een specifiek subsysteem repareert.

### Tijdelijke spans toevoegen

Voeg de helper toe dicht bij de code die je onderzoekt. Bijvoorbeeld, tijdens het debuggen van
`openclaw models list`, kan een tijdelijke patch in
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
- Houd stdout schoon. De helper schrijft naar stderr, zodat JSON-commando-uitvoer
  parsebaar blijft.
- Verwijder tijdelijke imports en spans voordat je de uiteindelijke fix-PR opent.
- Neem de timinguitvoer of een korte samenvatting op in het issue of de PR waarin
  de optimalisatie wordt uitgelegd.

### Uitvoeren met leesbare uitvoer

Leesbare modus is het beste voor live debuggen:

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
| `debug:models:list:auth_store`           |      20.3s | Het laden van de auth-profile-store is de grootste kostenpost en moet als eerste worden onderzocht.      |
| `debug:models:list:ensure_models_json`   |       5.0s | Het synchroniseren van `models.json` is duur genoeg om te onderzoeken op caching of skip-voorwaarden.    |
| `debug:models:list:load_model_registry`  |       5.9s | Registry-opbouw en provider-availability-werk zijn ook betekenisvolle kosten.                           |
| `debug:models:list:read_registry_models` |       2.4s | Alle registry-modellen lezen is niet gratis en kan belangrijk zijn voor `--all`.                         |
| row-append-fasen                         | 3.2s totaal | Vijf weergegeven rijen bouwen duurt nog steeds meerdere seconden, dus het filterpad verdient nader onderzoek. |
| `debug:models:list:print_model_table`    |        0ms | Rendering is niet de bottleneck.                                                                         |

Deze bevindingen zijn genoeg om de volgende patch te sturen zonder timingcode in
productiepaden te houden.

### Uitvoeren met JSON-uitvoer

Gebruik JSON-modus wanneer je timinggegevens wilt opslaan of vergelijken:

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

### Opruimen voor landing

Voordat je de uiteindelijke PR opent:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Het commando mag geen tijdelijke instrumentatie-call-sites retourneren, tenzij de PR
expliciet een permanent diagnostisch oppervlak toevoegt. Voor normale performance-
fixes behoud je alleen de gedragswijziging, tests en een korte notitie met het timingbewijs.

Voor diepere CPU-hotspots gebruik je Node-profiling (`--cpu-prof`) of een externe
profiler in plaats van meer timing-wrappers toe te voegen.

## Gateway-watchmodus

Voor snelle iteratie voer je de Gateway uit onder de file watcher:

```bash
pnpm gateway:watch
```

Standaard start of herstart dit een tmux-sessie met de naam
`openclaw-gateway-watch-main` (of een profiel-/poortspecifieke variant zoals
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

Schakel auto-attach uit terwijl tmux-beheer behouden blijft:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profile de bekeken Gateway-CPU-tijd bij het debuggen van startup-/runtime-hotspots:

```bash
pnpm gateway:watch --benchmark
```

De watch-wrapper consumeert `--benchmark` voordat de Gateway wordt aangeroepen en schrijft
één V8 `.cpuprofile` per Gateway-child-exit onder
`.artifacts/gateway-watch-profiles/`. Stop of herstart de bekeken gateway om
het huidige profiel te flushen, en open het daarna met Chrome DevTools of Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gebruik `--benchmark-dir <path>` wanneer je profielen ergens anders wilt hebben.

De tmux-wrapper draagt algemene niet-geheime runtime-selectors zoals
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` en `OPENCLAW_SKIP_CHANNELS` over naar het pane. Plaats
providerreferenties in je normale profiel/configuratie, of gebruik raw foreground-modus
voor eenmalige vluchtige secrets.
Het beheerde tmux-pane gebruikt ook standaard gekleurde Gateway-logs voor leesbaarheid;
stel `FORCE_COLOR=0` in bij het starten van `pnpm gateway:watch` om ANSI-uitvoer uit te schakelen.

De watcher herstart bij build-relevante bestanden onder `src/`, bronbestanden van Plugins,
Plugin-`package.json`- en `openclaw.plugin.json`-metadata, `tsconfig.json`,
`package.json` en `tsdown.config.ts`. Wijzigingen in Plugin-metadata herstarten de
gateway zonder een `tsdown`-rebuild te forceren; bron- en configuratiewijzigingen
bouwen nog steeds eerst `dist`.

Voeg eventuele Gateway-CLI-vlaggen toe na `gateway:watch` en ze worden bij
elke herstart doorgegeven. Het opnieuw uitvoeren van hetzelfde watch-commando respawnt het genoemde tmux-pane, en
de raw watcher behoudt nog steeds zijn single-watcher-lock zodat dubbele watcher-parents
worden vervangen in plaats van zich op te stapelen.

## Dev-profiel + dev-gateway (--dev)

Gebruik het dev-profiel om state te isoleren en een veilige, wegwerpbare setup op te starten voor
debuggen. Er zijn **twee** `--dev`-vlaggen:

- **Globale `--dev` (profiel):** isoleert state onder `~/.openclaw-dev` en
  stelt de Gateway-poort standaard in op `19001` (afgeleide poorten schuiven mee).
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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas schuiven overeenkomstig)

2. **Dev-bootstrap** (`gateway --dev`)
   - Schrijft een minimale configuratie als die ontbreekt (`gateway.mode=local`, bind loopback).
   - Stelt `agent.workspace` in op de dev-workspace.
   - Stelt `agent.skipBootstrap=true` in (geen BOOTSTRAP.md).
   - Seedt de workspace-bestanden als ze ontbreken:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standaardidentiteit: **C3‑PO** (protocoldroid).
   - Slaat kanaalproviders over in dev-modus (`OPENCLAW_SKIP_CHANNELS=1`).

Resetflow (frisse start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` is een **globale** profielvlag en wordt door sommige uitvoerders opgeslokt. Als je het expliciet moet uitschrijven, gebruik dan de vorm met een omgevingsvariabele:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` wist configuratie, inloggegevens, sessies en de dev-werkruimte (met
`trash`, niet `rm`) en maakt daarna de standaard dev-configuratie opnieuw aan.

<Tip>
Als er al een niet-dev-Gateway actief is (launchd of systemd), stop die dan eerst:

```bash
openclaw gateway stop
```

</Tip>

## Ruwe streamlogging (OpenClaw)

OpenClaw kan de **ruwe assistentstream** loggen voordat er filtering/opmaak wordt toegepast.
Dit is de beste manier om te zien of redenering binnenkomt als delta's in platte tekst
(of als afzonderlijke denkblokken).

Schakel dit in via de CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionele padoverschrijving:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Gelijkwaardige omgevingsvariabelen:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standaardbestand:

`~/.openclaw/logs/raw-stream.jsonl`

## Ruwe chunklogging (pi-mono)

Om **ruwe OpenAI-compatibele chunks** vast te leggen voordat ze naar blokken worden geparseerd,
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

> Opmerking: dit wordt alleen uitgegeven door processen die de
> `openai-completions`-provider van pi-mono gebruiken.

## Veiligheidsopmerkingen

- Ruwe streamlogs kunnen volledige prompts, tooluitvoer en gebruikersgegevens bevatten.
- Houd logs lokaal en verwijder ze na het debuggen.
- Als je logs deelt, verwijder dan eerst geheimen en PII.

## Gerelateerd

- [Probleemoplossing](/nl/help/troubleshooting)
- [FAQ](/nl/help/faq)

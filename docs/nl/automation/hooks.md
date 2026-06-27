---
read_when:
    - U wilt gebeurtenisgestuurde automatisering voor /new, /reset, /stop en gebeurtenissen in de agentlevenscyclus
    - Je wilt hooks bouwen, installeren of debuggen
summary: 'Hooks: gebeurtenisgestuurde automatisering voor opdrachten en levenscyclusgebeurtenissen'
title: Hook-functies
x-i18n:
    generated_at: "2026-06-27T17:09:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hooks zijn kleine scripts die worden uitgevoerd wanneer er iets gebeurt binnen de Gateway. Ze kunnen vanuit mappen worden ontdekt en met `openclaw hooks` worden geïnspecteerd. De Gateway laadt interne hooks pas nadat je hooks hebt ingeschakeld of ten minste één hookvermelding, hookpack, legacy-handler of extra hookmap hebt geconfigureerd.

Er zijn twee soorten hooks in OpenClaw:

- **Interne hooks** (deze pagina): worden uitgevoerd binnen de Gateway wanneer agentevents plaatsvinden, zoals `/new`, `/reset`, `/stop` of lifecycle-events.
- **Webhooks**: externe HTTP-eindpunten waarmee andere systemen werk in OpenClaw kunnen starten. Zie [Webhooks](/nl/automation/cron-jobs#webhooks).

Hooks kunnen ook in plugins worden gebundeld. `openclaw hooks list` toont zowel zelfstandige hooks als door plugins beheerde hooks.

## Kies het juiste oppervlak

OpenClaw heeft meerdere uitbreidingsoppervlakken die op elkaar lijken, maar verschillende problemen oplossen:

| Als je het volgende wilt...                                                                                          | Gebruik...                                  | Waarom                                                                                             |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Een snapshot opslaan bij `/new`, `/reset` loggen, een externe API aanroepen na `message:sent`, of grove operatorautomatisering toevoegen | Interne hooks (`HOOK.md`, deze pagina)      | Bestandsgebaseerde hooks zijn bedoeld voor door operators beheerde neveneffecten en command-/lifecycle-automatisering |
| Prompts herschrijven, tools blokkeren, uitgaande berichten annuleren, of geordende middleware/policy toevoegen          | Getypeerde plugin-hooks via `api.on(...)`   | Getypeerde hooks hebben expliciete contracten, prioriteiten, samenvoegregels en blokkeer-/annuleersemantiek |
| Alleen telemetry-export of observeerbaarheid toevoegen                                                                 | Diagnostische events                        | Observeerbaarheid is een aparte eventbus, geen policy-hookoppervlak                               |

Gebruik interne hooks wanneer je automatisering wilt die zich gedraagt als een kleine geïnstalleerde integratie. Gebruik getypeerde plugin-hooks wanneer je runtime-lifecyclebeheer nodig hebt.

## Snelstart

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Eventtypen

| Event                    | Wanneer het wordt geactiveerd                             |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new`-commando uitgegeven                                 |
| `command:reset`          | `/reset`-commando uitgegeven                               |
| `command:stop`           | `/stop`-commando uitgegeven                                |
| `command`                | Elk command-event (algemene listener)                      |
| `session:compact:before` | Voordat Compaction de geschiedenis samenvat                |
| `session:compact:after`  | Nadat Compaction is voltooid                               |
| `session:patch`          | Wanneer sessie-eigenschappen worden gewijzigd              |
| `agent:bootstrap`        | Voordat workspace-bootstrapbestanden worden geïnjecteerd   |
| `gateway:startup`        | Nadat kanalen starten en hooks zijn geladen                |
| `gateway:shutdown`       | Wanneer het afsluiten van de Gateway begint                |
| `gateway:pre-restart`    | Vóór een verwachte Gateway-herstart                        |
| `message:received`       | Inkomend bericht vanaf elk kanaal                          |
| `message:transcribed`    | Nadat audiotranscriptie is voltooid                        |
| `message:preprocessed`   | Nadat media- en linkvoorverwerking is voltooid of overgeslagen |
| `message:sent`           | Uitgaand bericht afgeleverd                                |

## Hooks schrijven

### Hookstructuur

Elke hook is een map met twee bestanden:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### HOOK.md-indeling

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Metadatavelden** (`metadata.openclaw`):

| Veld       | Beschrijving                                         |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Weergave-emoji voor CLI                              |
| `events`   | Array met events om naar te luisteren                |
| `export`   | Benoemde export om te gebruiken (standaard `"default"`) |
| `os`       | Vereiste platformen (bijv. `["darwin", "linux"]`)    |
| `requires` | Vereiste `bins`-, `anyBins`-, `env`- of `config`-paden |
| `always`   | Geschiktheidscontroles overslaan (boolean)           |
| `install`  | Installatiemethoden                                  |

### Handlerimplementatie

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Elk event bevat: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push antwoorden hier alleen op oppervlakken die antwoorden ondersteunen), en `context` (eventspecifieke data). Agent- en tool-plugin-hookcontexten kunnen ook `trace` bevatten, een alleen-lezen W3C-compatibele diagnostische tracecontext die plugins kunnen doorgeven aan gestructureerde logs voor OTEL-correlatie.

`event.messages` wordt alleen automatisch afgeleverd op oppervlakken die antwoorden ondersteunen, zoals
`command:*` en `message:received`. Events die alleen voor lifecycle zijn, zoals
`agent:bootstrap`, `session:*`, `gateway:*` of `message:sent`, hebben geen
antwoordkanaal en negeren gepushte berichten.

### Belangrijke eventcontexten

**Command-events** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Berichtevents** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (providerspecifieke data waaronder `senderId`, `senderName`, `guildId`). `context.content` geeft de voorkeur aan een niet-lege commandbody voor command-achtige berichten, en valt daarna terug op de ruwe inkomende body en generieke body; het bevat geen alleen-agentverrijking zoals threadgeschiedenis of linksamenvattingen.

**Berichtevents** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Berichtevents** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Berichtevents** (`message:preprocessed`): `context.bodyForAgent` (uiteindelijke verrijkte body), `context.from`, `context.channelId`.

**Bootstrap-events** (`agent:bootstrap`): `context.bootstrapFiles` (wijzigbare array), `context.agentId`.

**Sessiepatch-events** (`session:patch`): `context.sessionEntry`, `context.patch` (alleen gewijzigde velden), `context.cfg`. Alleen bevoorrechte clients kunnen patch-events starten.

**Compaction-events**: `session:compact:before` bevat `messageCount`, `tokenCount`. `session:compact:after` voegt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` toe.

`command:stop` observeert dat de gebruiker `/stop` uitgeeft; het is cancellation-/command-lifecycle,
geen agent-finalisatiepoort. Plugins die een
natuurlijk eindantwoord moeten inspecteren en de agent om nog één extra ronde moeten vragen, moeten in plaats daarvan de getypeerde
plugin-hook `before_agent_finalize` gebruiken. Zie [Plugin-hooks](/nl/plugins/hooks).

**Gateway-lifecycle-events**: `gateway:shutdown` bevat `reason` en `restartExpectedMs` en wordt geactiveerd wanneer het afsluiten van de Gateway begint. `gateway:pre-restart` bevat dezelfde context, maar wordt alleen geactiveerd wanneer afsluiten deel is van een verwachte herstart en een eindige `restartExpectedMs`-waarde is opgegeven. Tijdens het afsluiten is het wachten op elke lifecycle-hook best-effort en begrensd, zodat het afsluiten doorgaat als een handler vastloopt. Het standaard wachtbudget is 5 seconden voor `gateway:shutdown` en 10 seconden voor `gateway:pre-restart`.

Gebruik `gateway:pre-restart` voor korte herstartmeldingen terwijl kanalen nog beschikbaar zijn:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Tussen het `gateway:shutdown`-event (of `gateway:pre-restart`-event) en de rest van de afsluitsequentie activeert de gateway ook een getypeerde `session_end`-plugin-hook voor elke sessie die nog actief was toen het proces stopte. De `reason` van het event is `shutdown` voor een gewone SIGTERM/SIGINT-stop en `restart` wanneer het sluiten was gepland als onderdeel van een verwachte herstart. Deze drain is begrensd, zodat een trage `session_end`-handler het beëindigen van het proces niet kan blokkeren, en sessies die al zijn gefinaliseerd via replace / reset / delete / compaction worden overgeslagen om dubbele activering te voorkomen.

## Hookdetectie

Hooks worden ontdekt vanuit deze mappen, in volgorde van toenemende override-voorrang:

1. **Gebundelde hooks**: meegeleverd met OpenClaw
2. **Plugin-hooks**: hooks gebundeld binnen geïnstalleerde plugins
3. **Beheerde hooks**: `~/.openclaw/hooks/` (door de gebruiker geïnstalleerd, gedeeld tussen workspaces). Extra mappen uit `hooks.internal.load.extraDirs` delen deze voorrang.
4. **Workspace-hooks**: `<workspace>/hooks/` (per agent, standaard uitgeschakeld totdat ze expliciet worden ingeschakeld)

Workspace-hooks kunnen nieuwe hooknamen toevoegen, maar kunnen geen gebundelde, beheerde of door plugins geleverde hooks met dezelfde naam overschrijven.

De Gateway slaat interne hookdetectie bij het opstarten over totdat interne hooks zijn geconfigureerd. Schakel een gebundelde of beheerde hook in met `openclaw hooks enable <name>`, installeer een hookpack, of stel `hooks.internal.enabled=true` in om je aan te melden. Wanneer je één benoemde hook inschakelt, laadt de Gateway alleen de handler van die hook; `hooks.internal.enabled=true`, extra hookmappen en legacy-handlers melden zich aan voor brede detectie.

### Hookpacks

Hookpacks zijn npm-pakketten die hooks exporteren via `openclaw.hooks` in `package.json`. Installeer met:

```bash
openclaw plugins install <path-or-spec>
```

Npm-specs zijn uitsluitend registry-only (pakketnaam + optionele exacte versie of dist-tag). Git-/URL-/bestandsspecs en semver-ranges worden geweigerd.

## Gebundelde hooks

| Hook                  | Gebeurtenissen                                    | Wat het doet                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Slaat sessiecontext op in `<workspace>/memory/`                |
| bootstrap-extra-files | `agent:bootstrap`                                 | Voegt extra bootstrapbestanden in vanuit glob-patronen         |
| command-logger        | `command`                                         | Logt alle opdrachten naar `~/.openclaw/logs/commands.log`      |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Stuurt zichtbare chatmeldingen wanneer sessiecompactie start/eindigt |
| boot-md               | `gateway:startup`                                 | Voert `BOOT.md` uit wanneer de gateway start                   |

Schakel een meegeleverde hook in:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details van session-memory

Extraheert de laatste 15 gebruikers-/assistentberichten en slaat deze op in `<workspace>/memory/YYYY-MM-DD-HHMM.md` met de lokale datum van de host. Geheugenvastlegging wordt op de achtergrond uitgevoerd, zodat bevestigingen voor `/new` en `/reset` niet worden vertraagd door transcriptlezingen of optionele slug-generatie. Stel `hooks.internal.entries.session-memory.llmSlug: true` in om beschrijvende bestandsnaam-slugs te genereren met het geconfigureerde model. Vereist dat `workspace.dir` is geconfigureerd.

<a id="bootstrap-extra-files"></a>

### Configuratie van bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Paden worden relatief aan de werkruimte opgelost. Alleen herkende bootstrap-basisnamen worden geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Details van command-logger

Logt elke slash-opdracht naar `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Details van compaction-notifier

Stuurt korte statusberichten naar het huidige gesprek wanneer OpenClaw begint en klaar is met het compacten van het sessietranscript. Dit maakt lange beurten minder verwarrend op chatoppervlakken, omdat de gebruiker kan zien dat de assistent context samenvat en na Compaction doorgaat.

<a id="boot-md"></a>

### Details van boot-md

Voert `BOOT.md` uit vanuit de actieve werkruimte wanneer de gateway start.

## Plugin-hooks

Plugins kunnen getypte hooks registreren via de Plugin SDK voor diepere integratie:
tool-aanroepen onderscheppen, prompts wijzigen, berichtenstromen beheren en meer.
Gebruik plugin-hooks wanneer je `before_tool_call`, `before_agent_reply`,
`before_install` of andere in-proces lifecycle-hooks nodig hebt.

Door plugins beheerde interne hooks zijn anders: ze nemen deel aan het grove
opdracht-/lifecycle-gebeurtenissysteem van deze pagina en verschijnen in `openclaw hooks list` als
`plugin:<id>`. Gebruik deze voor neveneffecten en compatibiliteit met hookpakketten, niet
voor geordende middleware of beleidscontroles.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de volledige referentie van plugin-hooks.

## Configuratie

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Omgevingsvariabelen per hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Extra hookmappen:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
De verouderde configuratie-indeling met de array `hooks.internal.handlers` wordt nog steeds ondersteund voor achterwaartse compatibiliteit, maar nieuwe hooks moeten het discovery-gebaseerde systeem gebruiken.
</Note>

## CLI-referentie

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Best practices

- **Houd handlers snel.** Hooks worden uitgevoerd tijdens opdrachtverwerking. Start zwaar werk zonder erop te wachten met `void processInBackground(event)`.
- **Handel fouten netjes af.** Verpak risicovolle bewerkingen in try/catch; gooi geen fouten, zodat andere handlers kunnen worden uitgevoerd.
- **Filter gebeurtenissen vroeg.** Keer onmiddellijk terug als het gebeurtenistype of de actie niet relevant is.
- **Gebruik specifieke gebeurtenissleutels.** Geef de voorkeur aan `"events": ["command:new"]` boven `"events": ["command"]` om overhead te verminderen.

## Probleemoplossing

### Hook niet gevonden

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook niet geschikt

```bash
openclaw hooks info my-hook
```

Controleer op ontbrekende binaries (PATH), omgevingsvariabelen, configuratiewaarden of OS-compatibiliteit.

### Hook wordt niet uitgevoerd

1. Controleer of de hook is ingeschakeld: `openclaw hooks list`
2. Herstart je Gateway-proces zodat hooks opnieuw worden geladen.
3. Controleer Gateway-logs: `./scripts/clawlog.sh | grep hook`

## Gerelateerd

- [CLI-referentie: hooks](/nl/cli/hooks)
- [Webhooks](/nl/automation/cron-jobs#webhooks)
- [Plugin-hooks](/nl/plugins/hooks) — in-proces plugin-lifecycle-hooks
- [Configuratie](/nl/gateway/configuration-reference#hooks)

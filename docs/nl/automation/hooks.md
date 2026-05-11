---
read_when:
    - Je wilt gebeurtenisgestuurde automatisering voor /new, /reset, /stop en agentlevenscyclusgebeurtenissen
    - Je wilt hooks bouwen, installeren of debuggen
summary: 'Hooks: gebeurtenisgestuurde automatisering voor commando''s en levenscyclusgebeurtenissen'
title: Hookfuncties
x-i18n:
    generated_at: "2026-05-11T20:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Hooks zijn kleine scripts die worden uitgevoerd wanneer er iets gebeurt binnen de Gateway. Ze kunnen worden ontdekt vanuit mappen en worden geïnspecteerd met `openclaw hooks`. De Gateway laadt interne hooks pas nadat je hooks inschakelt of ten minste één hook-vermelding, hook-pack, legacy handler of extra hook-map configureert.

Er zijn twee soorten hooks in OpenClaw:

- **Interne hooks** (deze pagina): worden binnen de Gateway uitgevoerd wanneer agent-events afgaan, zoals `/new`, `/reset`, `/stop` of lifecycle-events.
- **Webhooks**: externe HTTP-eindpunten waarmee andere systemen werk in OpenClaw kunnen triggeren. Zie [Webhooks](/nl/automation/cron-jobs#webhooks).

Hooks kunnen ook in plugins worden gebundeld. `openclaw hooks list` toont zowel zelfstandige hooks als door plugins beheerde hooks.

## Snel aan de slag

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

| Event                    | Wanneer het afgaat                                        |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | `/new`-commando uitgegeven                                |
| `command:reset`          | `/reset`-commando uitgegeven                              |
| `command:stop`           | `/stop`-commando uitgegeven                               |
| `command`                | Elk command-event (algemene listener)                     |
| `session:compact:before` | Voordat Compaction de geschiedenis samenvat               |
| `session:compact:after`  | Nadat Compaction is voltooid                              |
| `session:patch`          | Wanneer sessie-eigenschappen worden gewijzigd             |
| `agent:bootstrap`        | Voordat workspace-bootstrapbestanden worden geïnjecteerd  |
| `gateway:startup`        | Nadat kanalen starten en hooks zijn geladen               |
| `gateway:shutdown`       | Wanneer het afsluiten van de gateway begint               |
| `gateway:pre-restart`    | Voor een verwachte gateway-herstart                       |
| `message:received`       | Inkomend bericht van elk kanaal                           |
| `message:transcribed`    | Nadat audiotranscriptie is voltooid                       |
| `message:preprocessed`   | Nadat media- en linkvoorverwerking is voltooid of overgeslagen |
| `message:sent`           | Uitgaand bericht afgeleverd                               |

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
| `export`   | Named export om te gebruiken (standaard `"default"`) |
| `os`       | Vereiste platformen (bijv. `["darwin", "linux"]`)    |
| `requires` | Vereiste `bins`-, `anyBins`-, `env`- of `config`-paden |
| `always`   | Geschiktheidscontroles overslaan (boolean)           |
| `install`  | Installatiemethoden                                  |

### Handler-implementatie

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Elk event bevat: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push om naar de gebruiker te sturen) en `context` (eventspecifieke data). Agent- en tool-plugin-hookcontexten kunnen ook `trace` bevatten, een alleen-lezen W3C-compatibele diagnostische tracecontext die plugins kunnen doorgeven aan gestructureerde logs voor OTEL-correlatie.

### Belangrijkste eventcontext

**Command-events** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Berichtevents** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (providerspecifieke data inclusief `senderId`, `senderName`, `guildId`). `context.content` geeft de voorkeur aan een niet-lege commandobody voor commando-achtige berichten, en valt daarna terug op de ruwe inkomende body en generieke body; het bevat geen verrijking die alleen voor agents is bedoeld, zoals threadgeschiedenis of linksamenvattingen.

**Berichtevents** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Berichtevents** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Berichtevents** (`message:preprocessed`): `context.bodyForAgent` (uiteindelijke verrijkte body), `context.from`, `context.channelId`.

**Bootstrap-events** (`agent:bootstrap`): `context.bootstrapFiles` (muteerbare array), `context.agentId`.

**Sessiepatch-events** (`session:patch`): `context.sessionEntry`, `context.patch` (alleen gewijzigde velden), `context.cfg`. Alleen bevoorrechte clients kunnen patch-events triggeren.

**Compaction-events**: `session:compact:before` bevat `messageCount`, `tokenCount`. `session:compact:after` voegt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` toe.

`command:stop` observeert dat de gebruiker `/stop` uitgeeft; het is een annulerings-/commandolifecycle, geen gate voor agent-finalisatie. Plugins die een natuurlijk definitief antwoord moeten inspecteren en de agent om nog één pass moeten vragen, moeten in plaats daarvan de getypeerde plugin-hook `before_agent_finalize` gebruiken. Zie [Plugin-hooks](/nl/plugins/hooks).

**Gateway-lifecycle-events**: `gateway:shutdown` bevat `reason` en `restartExpectedMs` en gaat af wanneer het afsluiten van de gateway begint. `gateway:pre-restart` bevat dezelfde context, maar gaat alleen af wanneer afsluiten onderdeel is van een verwachte herstart en een eindige `restartExpectedMs`-waarde is opgegeven. Tijdens het afsluiten is elke wachttijd voor lifecycle-hooks best-effort en begrensd, zodat het afsluiten doorgaat als een handler blijft hangen.

Tussen het `gateway:shutdown`-event (of `gateway:pre-restart`-event) en de rest van de afsluitreeks vuurt de gateway ook een getypeerde `session_end`-plugin-hook af voor elke sessie die nog actief was toen het proces stopte. De `reason` van het event is `shutdown` voor een gewone SIGTERM/SIGINT-stop en `restart` wanneer het sluiten was gepland als onderdeel van een verwachte herstart. Deze drain is begrensd, zodat een trage `session_end`-handler het beëindigen van het proces niet kan blokkeren, en sessies die al zijn afgerond via vervangen / resetten / verwijderen / Compaction worden overgeslagen om dubbel afvuren te voorkomen.

## Hookdetectie

Hooks worden ontdekt vanuit deze mappen, in volgorde van toenemende override-prioriteit:

1. **Gebundelde hooks**: meegeleverd met OpenClaw
2. **Plugin-hooks**: hooks gebundeld binnen geïnstalleerde plugins
3. **Beheerde hooks**: `~/.openclaw/hooks/` (door de gebruiker geïnstalleerd, gedeeld tussen workspaces). Extra mappen uit `hooks.internal.load.extraDirs` delen deze prioriteit.
4. **Workspace-hooks**: `<workspace>/hooks/` (per agent, standaard uitgeschakeld tot expliciet ingeschakeld)

Workspace-hooks kunnen nieuwe hooknamen toevoegen, maar kunnen geen gebundelde, beheerde of door plugins geleverde hooks met dezelfde naam overschrijven.

De Gateway slaat interne hookdetectie bij het opstarten over totdat interne hooks zijn geconfigureerd. Schakel een gebundelde of beheerde hook in met `openclaw hooks enable <name>`, installeer een hook-pack of stel `hooks.internal.enabled=true` in om je aan te melden. Wanneer je één benoemde hook inschakelt, laadt de Gateway alleen de handler van die hook; `hooks.internal.enabled=true`, extra hook-mappen en legacy handlers melden zich aan voor brede detectie.

### Hook-packs

Hook-packs zijn npm-pakketten die hooks exporteren via `openclaw.hooks` in `package.json`. Installeer met:

```bash
openclaw plugins install <path-or-spec>
```

Npm-specificaties zijn alleen registry-specificaties (pakketnaam + optionele exacte versie of dist-tag). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd.

## Gebundelde hooks

| Hook                  | Events                                            | Wat het doet                                                 |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | Slaat sessiecontext op in `<workspace>/memory/`              |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injecteert aanvullende bootstrapbestanden vanuit globpatronen |
| command-logger        | `command`                                         | Logt alle commando's naar `~/.openclaw/logs/commands.log`    |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Stuurt zichtbare chatmeldingen wanneer sessie-Compaction begint/eindigt |
| boot-md               | `gateway:startup`                                 | Voert `BOOT.md` uit wanneer de gateway start                 |

Schakel elke gebundelde hook in:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details van session-memory

Extraheert de laatste 15 gebruikers-/assistentberichten en slaat ze op in `<workspace>/memory/YYYY-MM-DD-HHMM.md` met de lokale datum van de host. Geheugenvastlegging draait op de achtergrond, zodat `/new`- en `/reset`-bevestigingen niet worden vertraagd door transcriptlezingen of optionele sluggeneratie. Stel `hooks.internal.entries.session-memory.llmSlug: true` in om beschrijvende bestandsnaam-slugs te genereren met het geconfigureerde model. Vereist dat `workspace.dir` is geconfigureerd.

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

Paden worden relatief aan de workspace opgelost. Alleen herkende bootstrap-basenamen worden geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Details van command-logger

Logt elk slashcommando naar `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Details van compaction-notifier

Stuurt korte statusberichten naar het huidige gesprek wanneer OpenClaw begint en klaar is met het compact maken van het sessietranscript. Dit maakt lange beurten minder verwarrend op chatoppervlakken, omdat de gebruiker kan zien dat de assistent context samenvat en na Compaction doorgaat.

<a id="boot-md"></a>

### Details van boot-md

Voert `BOOT.md` uit vanuit de actieve workspace wanneer de gateway start.

## Plugin-hooks

Plugins kunnen getypeerde hooks registreren via de Plugin SDK voor diepere integratie:
toolaanroepen onderscheppen, prompts wijzigen, berichtenstroom beheren en meer.
Gebruik plugin-hooks wanneer je `before_tool_call`, `before_agent_reply`, `before_install` of andere in-process lifecycle-hooks nodig hebt.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de volledige plugin-hookreferentie.

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

Extra hook-mappen:

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
De verouderde configuratie-indeling met de array `hooks.internal.handlers` wordt nog steeds ondersteund voor achterwaartse compatibiliteit, maar nieuwe hooks moeten het op detectie gebaseerde systeem gebruiken.
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

## Aanbevolen werkwijzen

- **Houd handlers snel.** Hooks worden uitgevoerd tijdens opdrachtverwerking. Start zwaar werk zonder erop te wachten met `void processInBackground(event)`.
- **Handel fouten netjes af.** Wikkel risicovolle bewerkingen in try/catch; gooi geen fouten, zodat andere handlers kunnen worden uitgevoerd.
- **Filter gebeurtenissen vroeg.** Keer direct terug als het gebeurtenistype of de actie niet relevant is.
- **Gebruik specifieke gebeurtenissleutels.** Geef de voorkeur aan `"events": ["command:new"]` boven `"events": ["command"]` om overhead te beperken.

## Probleemoplossing

### Hook niet ontdekt

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook komt niet in aanmerking

```bash
openclaw hooks info my-hook
```

Controleer op ontbrekende binaries (PATH), omgevingsvariabelen, configuratiewaarden of OS-compatibiliteit.

### Hook wordt niet uitgevoerd

1. Controleer of de hook is ingeschakeld: `openclaw hooks list`
2. Start je gatewayproces opnieuw zodat hooks opnieuw worden geladen.
3. Controleer gatewaylogs: `./scripts/clawlog.sh | grep hook`

## Gerelateerd

- [CLI-referentie: hooks](/nl/cli/hooks)
- [Webhooks](/nl/automation/cron-jobs#webhooks)
- [Plugin-hooks](/nl/plugins/hooks) — in-process levenscyclus-hooks voor plugins
- [Configuratie](/nl/gateway/configuration-reference#hooks)

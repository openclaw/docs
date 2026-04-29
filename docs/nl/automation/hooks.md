---
read_when:
    - Je wilt gebeurtenisgestuurde automatisering voor /new, /reset, /stop en gebeurtenissen in de levenscyclus van agents
    - Je wilt hooks bouwen, installeren of debuggen
summary: 'Hooks: gebeurtenisgestuurde automatisering voor commando''s en levenscyclusgebeurtenissen'
title: Haken
x-i18n:
    generated_at: "2026-04-29T22:23:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

Hooks zijn kleine scripts die worden uitgevoerd wanneer er iets gebeurt binnen de Gateway. Ze kunnen worden ontdekt vanuit directories en worden geïnspecteerd met `openclaw hooks`. De Gateway laadt interne hooks pas nadat je hooks inschakelt of ten minste één hook-entry, hook-pack, legacy-handler of extra hook-directory configureert.

Er zijn twee soorten hooks in OpenClaw:

- **Interne hooks** (deze pagina): draaien binnen de Gateway wanneer agent-events worden geactiveerd, zoals `/new`, `/reset`, `/stop` of lifecycle-events.
- **Webhooks**: externe HTTP-endpoints waarmee andere systemen werk in OpenClaw kunnen triggeren. Zie [Webhooks](/nl/automation/cron-jobs#webhooks).

Hooks kunnen ook binnen plugins worden gebundeld. `openclaw hooks list` toont zowel zelfstandige hooks als door plugins beheerde hooks.

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

| Event                    | Wanneer het wordt geactiveerd                             |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new`-opdracht uitgevoerd                                 |
| `command:reset`          | `/reset`-opdracht uitgevoerd                               |
| `command:stop`           | `/stop`-opdracht uitgevoerd                                |
| `command`                | Elk command-event (algemene listener)                      |
| `session:compact:before` | Voordat Compaction de geschiedenis samenvat                |
| `session:compact:after`  | Nadat Compaction is voltooid                               |
| `session:patch`          | Wanneer sessie-eigenschappen worden gewijzigd              |
| `agent:bootstrap`        | Voordat workspace-bootstrapbestanden worden geïnjecteerd   |
| `gateway:startup`        | Nadat kanalen starten en hooks zijn geladen                |
| `gateway:shutdown`       | Wanneer het afsluiten van de Gateway begint                |
| `gateway:pre-restart`    | Voor een verwachte herstart van de Gateway                 |
| `message:received`       | Inkomend bericht van elk kanaal                            |
| `message:transcribed`    | Nadat audiotranscriptie is voltooid                        |
| `message:preprocessed`   | Nadat media- en linkvoorverwerking is voltooid of overgeslagen |
| `message:sent`           | Uitgaand bericht afgeleverd                                |

## Hooks schrijven

### Hookstructuur

Elke hook is een directory met twee bestanden:

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
| `events`   | Array van events om naar te luisteren                |
| `export`   | Named export om te gebruiken (standaard `"default"`) |
| `os`       | Vereiste platforms (bijv. `["darwin", "linux"]`)     |
| `requires` | Vereiste paden voor `bins`, `anyBins`, `env` of `config` |
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

Elk event bevat: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push om naar de gebruiker te sturen) en `context` (eventspecifieke data). Hook-contexten van agent- en tool-plugins kunnen ook `trace` bevatten, een read-only W3C-compatibele diagnostische trace-context die plugins kunnen doorgeven aan gestructureerde logs voor OTEL-correlatie.

### Hoogtepunten van event-context

**Command-events** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Bericht-events** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (providerspecifieke data inclusief `senderId`, `senderName`, `guildId`).

**Bericht-events** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Bericht-events** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Bericht-events** (`message:preprocessed`): `context.bodyForAgent` (uiteindelijke verrijkte body), `context.from`, `context.channelId`.

**Bootstrap-events** (`agent:bootstrap`): `context.bootstrapFiles` (mutable array), `context.agentId`.

**Sessiepatch-events** (`session:patch`): `context.sessionEntry`, `context.patch` (alleen gewijzigde velden), `context.cfg`. Alleen bevoegde clients kunnen patch-events triggeren.

**Compaction-events**: `session:compact:before` bevat `messageCount`, `tokenCount`. `session:compact:after` voegt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` toe.

`command:stop` observeert dat de gebruiker `/stop` uitvoert; het is onderdeel van de annulering/opdracht-lifecycle, geen gate voor agent-finalisatie. Plugins die een natuurlijk eindantwoord moeten inspecteren en de agent om nog één extra ronde moeten vragen, moeten in plaats daarvan de getypeerde plugin-hook `before_agent_finalize` gebruiken. Zie [Plugin-hooks](/nl/plugins/hooks).

**Gateway-lifecycle-events**: `gateway:shutdown` bevat `reason` en `restartExpectedMs` en wordt geactiveerd wanneer het afsluiten van de Gateway begint. `gateway:pre-restart` bevat dezelfde context, maar wordt alleen geactiveerd wanneer het afsluiten deel uitmaakt van een verwachte herstart en een eindige waarde voor `restartExpectedMs` is opgegeven. Tijdens het afsluiten is het wachten op elke lifecycle-hook best-effort en begrensd, zodat het afsluiten doorgaat als een handler vastloopt.

## Hook-discovery

Hooks worden ontdekt vanuit deze directories, in volgorde van toenemende override-prioriteit:

1. **Gebundelde hooks**: meegeleverd met OpenClaw
2. **Plugin-hooks**: hooks gebundeld binnen geïnstalleerde plugins
3. **Beheerde hooks**: `~/.openclaw/hooks/` (door gebruiker geïnstalleerd, gedeeld tussen workspaces). Extra directories uit `hooks.internal.load.extraDirs` delen deze prioriteit.
4. **Workspace-hooks**: `<workspace>/hooks/` (per agent, standaard uitgeschakeld totdat ze expliciet zijn ingeschakeld)

Workspace-hooks kunnen nieuwe hook-namen toevoegen, maar kunnen geen gebundelde, beheerde of door plugins geleverde hooks met dezelfde naam overriden.

De Gateway slaat interne hook-discovery bij het opstarten over totdat interne hooks zijn geconfigureerd. Schakel een gebundelde of beheerde hook in met `openclaw hooks enable <name>`, installeer een hook-pack of stel `hooks.internal.enabled=true` in om je aan te melden. Wanneer je één benoemde hook inschakelt, laadt de Gateway alleen de handler van die hook; `hooks.internal.enabled=true`, extra hook-directories en legacy-handlers melden zich aan voor brede discovery.

### Hook-packs

Hook-packs zijn npm-packages die hooks exporteren via `openclaw.hooks` in `package.json`. Installeer met:

```bash
openclaw plugins install <path-or-spec>
```

Npm-specificaties zijn alleen registry-specs (packagenaam + optionele exacte versie of dist-tag). Git/URL/file-specificaties en semver-ranges worden geweigerd.

## Gebundelde hooks

| Hook                  | Events                         | Wat deze doet                                         |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Slaat sessiecontext op in `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`              | Injecteert extra bootstrapbestanden uit glob-patronen |
| command-logger        | `command`                      | Logt alle opdrachten naar `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Voert `BOOT.md` uit wanneer de Gateway start          |

Schakel een gebundelde hook in:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details van session-memory

Extraheert de laatste 15 gebruikers-/assistentberichten, genereert via LLM een beschrijvende bestandsnaam-slug en slaat op naar `<workspace>/memory/YYYY-MM-DD-slug.md` met de lokale datum van de host. Vereist dat `workspace.dir` is geconfigureerd.

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

Logt elke slash-opdracht naar `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Details van boot-md

Voert `BOOT.md` uit vanuit de actieve workspace wanneer de Gateway start.

## Plugin-hooks

Plugins kunnen getypeerde hooks registreren via de Plugin SDK voor diepere integratie:
tool-calls onderscheppen, prompts wijzigen, berichtstroom beheren en meer.
Gebruik plugin-hooks wanneer je `before_tool_call`, `before_agent_reply`, `before_install` of andere in-process lifecycle-hooks nodig hebt.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de volledige referentie voor plugin-hooks.

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

Extra hook-directories:

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
De legacy `hooks.internal.handlers` array-configuratie-indeling wordt nog steeds ondersteund voor achterwaartse compatibiliteit, maar nieuwe hooks moeten het discovery-gebaseerde systeem gebruiken.
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

- **Houd handlers snel.** Hooks draaien tijdens opdrachtverwerking. Start zwaar werk fire-and-forget met `void processInBackground(event)`.
- **Handel fouten netjes af.** Wikkel risicovolle bewerkingen in try/catch; gooi geen fout zodat andere handlers kunnen draaien.
- **Filter events vroeg.** Return onmiddellijk als het eventtype/de actie niet relevant is.
- **Gebruik specifieke event-keys.** Geef de voorkeur aan `"events": ["command:new"]` boven `"events": ["command"]` om overhead te verminderen.

## Probleemoplossing

### Hook niet ontdekt

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
- [Plugin-hooks](/nl/plugins/hooks) — in-process Plugin-levenscyclus-hooks
- [Configuratie](/nl/gateway/configuration-reference#hooks)

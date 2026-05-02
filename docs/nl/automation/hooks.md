---
read_when:
    - Je wilt gebeurtenisgestuurde automatisering voor /new, /reset, /stop en agentlevenscyclusgebeurtenissen
    - Je wilt haakpunten bouwen, installeren of fouten erin opsporen
summary: 'Haakpunten: gebeurtenisgestuurde automatisering voor commando''s en levenscyclusgebeurtenissen'
title: Hooks
x-i18n:
    generated_at: "2026-05-02T11:08:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hooks zijn kleine scripts die worden uitgevoerd wanneer er iets gebeurt binnen de Gateway. Ze kunnen vanuit directory's worden ontdekt en geïnspecteerd met `openclaw hooks`. De Gateway laadt interne hooks pas nadat je hooks inschakelt of ten minste één hook-entry, hookpakket, legacy-handler of extra hookdirectory configureert.

Er zijn twee soorten hooks in OpenClaw:

- **Interne hooks** (deze pagina): worden uitgevoerd binnen de Gateway wanneer agentgebeurtenissen plaatsvinden, zoals `/new`, `/reset`, `/stop` of levenscyclusgebeurtenissen.
- **Webhooks**: externe HTTP-eindpunten waarmee andere systemen werk in OpenClaw kunnen starten. Zie [Webhooks](/nl/automation/cron-jobs#webhooks).

Hooks kunnen ook worden gebundeld in plugins. `openclaw hooks list` toont zowel zelfstandige hooks als door plugins beheerde hooks.

## Snel starten

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

## Gebeurtenistypen

| Gebeurtenis              | Wanneer deze wordt geactiveerd                                |
| ------------------------ | ------------------------------------------------------------- |
| `command:new`            | opdracht `/new` uitgegeven                                    |
| `command:reset`          | opdracht `/reset` uitgegeven                                  |
| `command:stop`           | opdracht `/stop` uitgegeven                                   |
| `command`                | Elke opdrachtgebeurtenis (algemene listener)                  |
| `session:compact:before` | Voordat Compaction de geschiedenis samenvat                   |
| `session:compact:after`  | Nadat Compaction is voltooid                                  |
| `session:patch`          | Wanneer sessie-eigenschappen worden gewijzigd                 |
| `agent:bootstrap`        | Voordat bootstrapbestanden voor de werkruimte worden geïnjecteerd |
| `gateway:startup`        | Nadat kanalen starten en hooks zijn geladen                   |
| `gateway:shutdown`       | Wanneer het afsluiten van de gateway begint                   |
| `gateway:pre-restart`    | Vóór een verwachte herstart van de gateway                    |
| `message:received`       | Inkomend bericht van een willekeurig kanaal                   |
| `message:transcribed`    | Nadat audiotranscriptie is voltooid                           |
| `message:preprocessed`   | Nadat media- en linkvoorverwerking is voltooid of overgeslagen |
| `message:sent`           | Uitgaand bericht afgeleverd                                   |

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
| `events`   | Array met gebeurtenissen om naar te luisteren        |
| `export`   | Benoemde export om te gebruiken (standaard `"default"`) |
| `os`       | Vereiste platforms (bijv. `["darwin", "linux"]`)     |
| `requires` | Vereiste paden voor `bins`, `anyBins`, `env` of `config` |
| `always`   | Geschiktheidscontroles omzeilen (boolean)            |
| `install`  | Installatiemethoden                                  |

### Handlerimplementatie

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

Elke gebeurtenis bevat: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push om naar de gebruiker te verzenden) en `context` (gebeurtenisspecifieke gegevens). Hookcontexten voor agent- en toolplugins kunnen ook `trace` bevatten, een alleen-lezen W3C-compatibele diagnostische tracecontext die plugins kunnen doorgeven aan gestructureerde logs voor OTEL-correlatie.

### Hoogtepunten van gebeurteniscontext

**Opdrachtgebeurtenissen** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Berichtgebeurtenissen** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (providerspecifieke gegevens, waaronder `senderId`, `senderName`, `guildId`). `context.content` geeft de voorkeur aan een niet-lege opdrachtbody voor opdrachtachtige berichten, valt daarna terug op de ruwe inkomende body en generieke body; het bevat geen verrijking die alleen voor de agent is bedoeld, zoals threadgeschiedenis of linksamenvattingen.

**Berichtgebeurtenissen** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Berichtgebeurtenissen** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Berichtgebeurtenissen** (`message:preprocessed`): `context.bodyForAgent` (definitieve verrijkte body), `context.from`, `context.channelId`.

**Bootstrapgebeurtenissen** (`agent:bootstrap`): `context.bootstrapFiles` (muteerbare array), `context.agentId`.

**Sessiepatchgebeurtenissen** (`session:patch`): `context.sessionEntry`, `context.patch` (alleen gewijzigde velden), `context.cfg`. Alleen bevoorrechte clients kunnen patchgebeurtenissen activeren.

**Compaction-gebeurtenissen**: `session:compact:before` bevat `messageCount`, `tokenCount`. `session:compact:after` voegt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` toe.

`command:stop` observeert dat de gebruiker `/stop` uitgeeft; het is annulering/opdrachtlevenscyclus, geen gate voor agentfinalisatie. Plugins die een natuurlijk definitief antwoord moeten inspecteren en de agent om nog een extra ronde moeten vragen, moeten in plaats daarvan de getypeerde pluginhook `before_agent_finalize` gebruiken. Zie [Plugin-hooks](/nl/plugins/hooks).

**Gateway-levenscyclusgebeurtenissen**: `gateway:shutdown` bevat `reason` en `restartExpectedMs` en wordt geactiveerd wanneer het afsluiten van de gateway begint. `gateway:pre-restart` bevat dezelfde context, maar wordt alleen geactiveerd wanneer afsluiten deel uitmaakt van een verwachte herstart en een eindige waarde voor `restartExpectedMs` is opgegeven. Tijdens het afsluiten is elke wachttijd voor een levenscyclushook best-effort en begrensd, zodat afsluiten doorgaat als een handler blijft hangen.

## Hookdetectie

Hooks worden ontdekt vanuit deze directory's, in volgorde van toenemende overrideprioriteit:

1. **Gebundelde hooks**: meegeleverd met OpenClaw
2. **Plugin-hooks**: hooks die zijn gebundeld in geïnstalleerde plugins
3. **Beheerde hooks**: `~/.openclaw/hooks/` (door de gebruiker geïnstalleerd, gedeeld tussen werkruimten). Extra directory's uit `hooks.internal.load.extraDirs` delen deze prioriteit.
4. **Werkruimtehooks**: `<workspace>/hooks/` (per agent, standaard uitgeschakeld totdat ze expliciet worden ingeschakeld)

Werkruimtehooks kunnen nieuwe hooknamen toevoegen, maar kunnen geen gebundelde, beheerde of door plugins geleverde hooks met dezelfde naam overschrijven.

De Gateway slaat interne hookdetectie bij het opstarten over totdat interne hooks zijn geconfigureerd. Schakel een gebundelde of beheerde hook in met `openclaw hooks enable <name>`, installeer een hookpakket of stel `hooks.internal.enabled=true` in om je aan te melden. Wanneer je één benoemde hook inschakelt, laadt de Gateway alleen de handler van die hook; `hooks.internal.enabled=true`, extra hookdirectory's en legacy-handlers melden zich aan voor brede detectie.

### Hookpakketten

Hookpakketten zijn npm-pakketten die hooks exporteren via `openclaw.hooks` in `package.json`. Installeer met:

```bash
openclaw plugins install <path-or-spec>
```

Npm-specificaties zijn uitsluitend registry-specificaties (pakketnaam + optionele exacte versie of dist-tag). Git-/URL-/file-specificaties en semver-bereiken worden geweigerd.

## Gebundelde hooks

| Hook                  | Gebeurtenissen                 | Wat het doet                                          |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Slaat sessiecontext op in `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`              | Injecteert extra bootstrap-bestanden uit glob-patronen |
| command-logger        | `command`                      | Logt alle opdrachten naar `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Voert `BOOT.md` uit wanneer de gateway start          |

Schakel een gebundelde hook in:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details van session-memory

Extraheert de laatste 15 gebruikers-/assistentberichten, genereert via LLM een beschrijvende bestandsnaam-slug en slaat deze op naar `<workspace>/memory/YYYY-MM-DD-slug.md` met de lokale datum van de host. Vereist dat `workspace.dir` is geconfigureerd.

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

Paden worden relatief aan de workspace opgelost. Alleen herkende bootstrap-basisnamen worden geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Details van command-logger

Logt elke slash-opdracht naar `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Details van boot-md

Voert `BOOT.md` uit vanuit de actieve workspace wanneer de gateway start.

## Plugin hooks

Plugins kunnen getypeerde hooks registreren via de Plugin SDK voor diepere integratie:
toolaanroepen onderscheppen, prompts wijzigen, berichtenstroom beheren en meer.
Gebruik plugin-hooks wanneer je `before_tool_call`, `before_agent_reply`,
`before_install` of andere in-process lifecycle hooks nodig hebt.

Zie [Plugin hooks](/nl/plugins/hooks) voor de volledige referentie voor plugin-hooks.

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

- **Houd handlers snel.** Hooks worden uitgevoerd tijdens opdrachtverwerking. Start zwaar werk fire-and-forget met `void processInBackground(event)`.
- **Handel fouten netjes af.** Wikkel risicovolle bewerkingen in try/catch; throw niet, zodat andere handlers kunnen worden uitgevoerd.
- **Filter gebeurtenissen vroeg.** Return onmiddellijk als het gebeurtenistype of de actie niet relevant is.
- **Gebruik specifieke gebeurtenissleutels.** Geef de voorkeur aan `"events": ["command:new"]` boven `"events": ["command"]` om overhead te verminderen.

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
3. Controleer Gateway-logboeken: `./scripts/clawlog.sh | grep hook`

## Gerelateerd

- [CLI-referentie: hooks](/nl/cli/hooks)
- [Webhooks](/nl/automation/cron-jobs#webhooks)
- [Plugin-hooks](/nl/plugins/hooks) — in-process Plugin-levenscyclushooks
- [Configuratie](/nl/gateway/configuration-reference#hooks)

---
read_when:
    - Je wilt gebeurtenisgestuurde automatisering voor /new, /reset, /stop en gebeurtenissen in de levenscyclus van agents
    - Je wilt inhaakpunten bouwen, installeren of debuggen
summary: 'Hooks: gebeurtenisgestuurde automatisering voor commando''s en levenscyclusgebeurtenissen'
title: Inhaakpunten
x-i18n:
    generated_at: "2026-05-03T21:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooks zijn kleine scripts die worden uitgevoerd wanneer er iets gebeurt binnen de Gateway. Ze kunnen uit mappen worden ontdekt en met `openclaw hooks` worden geïnspecteerd. De Gateway laadt interne hooks pas nadat je hooks inschakelt of ten minste één hook-entry, hookpack, legacy-handler of extra hookmap configureert.

Er zijn twee soorten hooks in OpenClaw:

- **Interne hooks** (deze pagina): worden uitgevoerd binnen de Gateway wanneer agent-events plaatsvinden, zoals `/new`, `/reset`, `/stop` of lifecycle-events.
- **Webhooks**: externe HTTP-eindpunten waarmee andere systemen werk in OpenClaw kunnen activeren. Zie [Webhooks](/nl/automation/cron-jobs#webhooks).

Hooks kunnen ook in plugins worden gebundeld. `openclaw hooks list` toont zowel zelfstandige hooks als hooks die door plugins worden beheerd.

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

| Event                    | Wanneer het wordt geactiveerd                              |
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
| `gateway:shutdown`       | Wanneer het afsluiten van de gateway begint                |
| `gateway:pre-restart`    | Vóór een verwachte gateway-herstart                        |
| `message:received`       | Inkomend bericht van een kanaal                            |
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
| `os`       | Vereiste platforms (bijv. `["darwin", "linux"]`)     |
| `requires` | Vereiste `bins`-, `anyBins`-, `env`- of `config`-paden |
| `always`   | Geschiktheidscontroles omzeilen (boolean)            |
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

Elk event bevat: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push om naar de gebruiker te sturen) en `context` (eventspecifieke gegevens). Agent- en tool-plugin-hookcontexten kunnen ook `trace` bevatten, een alleen-lezen W3C-compatibele diagnostische trace-context die plugins kunnen doorgeven aan gestructureerde logs voor OTEL-correlatie.

### Hoogtepunten van eventcontext

**Command-events** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Message-events** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (providerspecifieke gegevens inclusief `senderId`, `senderName`, `guildId`). `context.content` geeft de voorkeur aan een niet-lege commandobody voor commandoachtige berichten, en valt daarna terug op de ruwe inkomende body en generieke body; het bevat geen agent-only verrijking zoals threadgeschiedenis of linksamenvattingen.

**Message-events** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Message-events** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Message-events** (`message:preprocessed`): `context.bodyForAgent` (uiteindelijke verrijkte body), `context.from`, `context.channelId`.

**Bootstrap-events** (`agent:bootstrap`): `context.bootstrapFiles` (wijzigbare array), `context.agentId`.

**Sessiepatch-events** (`session:patch`): `context.sessionEntry`, `context.patch` (alleen gewijzigde velden), `context.cfg`. Alleen geprivilegieerde clients kunnen patch-events activeren.

**Compaction-events**: `session:compact:before` bevat `messageCount`, `tokenCount`. `session:compact:after` voegt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` toe.

`command:stop` observeert dat de gebruiker `/stop` uitgeeft; het is onderdeel van de lifecycle voor annulering/commando's, geen gate voor agentfinalisatie. Plugins die een natuurlijk eindantwoord moeten inspecteren en de agent om nog één pass willen vragen, moeten in plaats daarvan de getypeerde plugin-hook `before_agent_finalize` gebruiken. Zie [Plugin-hooks](/nl/plugins/hooks).

**Gateway-lifecycle-events**: `gateway:shutdown` bevat `reason` en `restartExpectedMs` en wordt geactiveerd wanneer het afsluiten van de gateway begint. `gateway:pre-restart` bevat dezelfde context, maar wordt alleen geactiveerd wanneer afsluiten onderdeel is van een verwachte herstart en een eindige `restartExpectedMs`-waarde is opgegeven. Tijdens het afsluiten is het wachten op elke lifecycle-hook best-effort en begrensd, zodat het afsluiten doorgaat als een handler vastloopt.

## Hook-detectie

Hooks worden ontdekt vanuit deze mappen, in volgorde van oplopende override-voorrang:

1. **Gebundelde hooks**: meegeleverd met OpenClaw
2. **Plugin-hooks**: hooks die zijn gebundeld in geïnstalleerde plugins
3. **Beheerde hooks**: `~/.openclaw/hooks/` (door de gebruiker geïnstalleerd, gedeeld over workspaces). Extra mappen uit `hooks.internal.load.extraDirs` delen deze voorrang.
4. **Workspace-hooks**: `<workspace>/hooks/` (per agent, standaard uitgeschakeld totdat ze expliciet worden ingeschakeld)

Workspace-hooks kunnen nieuwe hooknamen toevoegen, maar kunnen geen gebundelde, beheerde of door plugins geleverde hooks met dezelfde naam overschrijven.

De Gateway slaat interne hook-detectie bij het opstarten over totdat interne hooks zijn geconfigureerd. Schakel een gebundelde of beheerde hook in met `openclaw hooks enable <name>`, installeer een hookpack of stel `hooks.internal.enabled=true` in om je aan te melden. Wanneer je één benoemde hook inschakelt, laadt de Gateway alleen de handler van die hook; `hooks.internal.enabled=true`, extra hookmappen en legacy-handlers melden zich aan voor brede detectie.

### Hookpacks

Hookpacks zijn npm-pakketten die hooks exporteren via `openclaw.hooks` in `package.json`. Installeer met:

```bash
openclaw plugins install <path-or-spec>
```

Npm-specificaties zijn alleen registry-gebaseerd (pakketnaam + optionele exacte versie of dist-tag). Git-/URL-/bestandsspecificaties en semver-ranges worden geweigerd.

## Gebundelde hooks

| Hook                  | Events                                            | Wat het doet                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Slaat sessiecontext op in `<workspace>/memory/`                |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injecteert extra bootstrapbestanden vanuit globpatronen        |
| command-logger        | `command`                                         | Logt alle commando's naar `~/.openclaw/logs/commands.log`      |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Stuurt zichtbare chatmeldingen wanneer sessie-Compaction start/eindigt |
| boot-md               | `gateway:startup`                                 | Voert `BOOT.md` uit wanneer de gateway start                   |

Schakel een gebundelde hook in:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details van session-memory

Extraheert de laatste 15 gebruiker-/assistant-berichten, genereert via een LLM een beschrijvende bestandsnaamslug en slaat op naar `<workspace>/memory/YYYY-MM-DD-slug.md` met de lokale datum van de host. Vereist dat `workspace.dir` is geconfigureerd.

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

Logt elk slash-commando naar `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Details van compaction-notifier

Stuurt korte statusberichten naar het huidige gesprek wanneer OpenClaw begint en klaar is met het compacten van het sessietranscript. Dit maakt lange turns minder verwarrend op chatoppervlakken, omdat de gebruiker kan zien dat de assistant context samenvat en na Compaction doorgaat.

<a id="boot-md"></a>

### Details van boot-md

Voert `BOOT.md` uit vanuit de actieve workspace wanneer de gateway start.

## Plugin-hooks

Plugins kunnen getypeerde hooks registreren via de Plugin SDK voor diepere integratie:
tool-calls onderscheppen, prompts wijzigen, berichtstroom beheren en meer.
Gebruik plugin-hooks wanneer je `before_tool_call`, `before_agent_reply`,
`before_install` of andere in-process lifecycle-hooks nodig hebt.

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
De legacy `hooks.internal.handlers`-arrayconfiguratie-indeling wordt nog steeds ondersteund voor achterwaartse compatibiliteit, maar nieuwe hooks moeten het op detectie gebaseerde systeem gebruiken.
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
- **Verwerk fouten netjes.** Omhul risicovolle bewerkingen met try/catch; gooi geen errors, zodat andere handlers kunnen worden uitgevoerd.
- **Filter events vroeg.** Keer onmiddellijk terug als het eventtype of de eventactie niet relevant is.
- **Gebruik specifieke event-sleutels.** Geef de voorkeur aan `"events": ["command:new"]` boven `"events": ["command"]` om overhead te verminderen.

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
2. Herstart je gatewayproces zodat hooks opnieuw worden geladen.
3. Controleer Gateway-logs: `./scripts/clawlog.sh | grep hook`

## Gerelateerd

- [CLI-referentie: hooks](/nl/cli/hooks)
- [Webhooks](/nl/automation/cron-jobs#webhooks)
- [Plugin-hooks](/nl/plugins/hooks) — in-process Plugin-levenscyclushooks
- [Configuratie](/nl/gateway/configuration-reference#hooks)

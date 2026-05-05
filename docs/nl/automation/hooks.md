---
read_when:
    - Je wilt eventgestuurde automatisering voor /new, /reset, /stop en gebeurtenissen in de agentlevenscyclus
    - Je wilt hooks bouwen, installeren of debuggen
summary: 'Hooks: gebeurtenisgestuurde automatisering voor commando''s en levenscyclusgebeurtenissen'
title: Haakpunten
x-i18n:
    generated_at: "2026-05-05T08:25:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Hooks zijn kleine scripts die worden uitgevoerd wanneer er iets gebeurt binnen de Gateway. Ze kunnen uit directories worden ontdekt en met `openclaw hooks` worden geinspecteerd. De Gateway laadt interne hooks pas nadat je hooks inschakelt of ten minste een hookvermelding, hookpack, legacy-handler of extra hookdirectory configureert.

Er zijn twee soorten hooks in OpenClaw:

- **Interne hooks** (deze pagina): worden binnen de Gateway uitgevoerd wanneer agentgebeurtenissen plaatsvinden, zoals `/new`, `/reset`, `/stop` of lifecycle-gebeurtenissen.
- **Webhooks**: externe HTTP-eindpunten waarmee andere systemen werk in OpenClaw kunnen starten. Zie [Webhooks](/nl/automation/cron-jobs#webhooks).

Hooks kunnen ook in plugins worden gebundeld. `openclaw hooks list` toont zowel zelfstandige hooks als door plugins beheerde hooks.

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

| Gebeurtenis              | Wanneer deze plaatsvindt                                       |
| ------------------------ | -------------------------------------------------------------- |
| `command:new`            | `/new`-opdracht uitgegeven                                     |
| `command:reset`          | `/reset`-opdracht uitgegeven                                   |
| `command:stop`           | `/stop`-opdracht uitgegeven                                    |
| `command`                | Elke opdrachtgebeurtenis (algemene listener)                   |
| `session:compact:before` | Voordat Compaction de geschiedenis samenvat                    |
| `session:compact:after`  | Nadat Compaction is voltooid                                   |
| `session:patch`          | Wanneer sessie-eigenschappen worden gewijzigd                  |
| `agent:bootstrap`        | Voordat workspace-bootstrapbestanden worden geinjecteerd       |
| `gateway:startup`        | Nadat kanalen zijn gestart en hooks zijn geladen               |
| `gateway:shutdown`       | Wanneer het afsluiten van de gateway begint                    |
| `gateway:pre-restart`    | Voor een verwachte gateway-herstart                            |
| `message:received`       | Inkomend bericht van een kanaal                                |
| `message:transcribed`    | Nadat audiotranscriptie is voltooid                            |
| `message:preprocessed`   | Nadat media- en linkvoorverwerking is voltooid of overgeslagen |
| `message:sent`           | Uitgaand bericht afgeleverd                                    |

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

| Veld       | Beschrijving                                                   |
| ---------- | -------------------------------------------------------------- |
| `emoji`    | Weergave-emoji voor CLI                                        |
| `events`   | Array met gebeurtenissen om naar te luisteren                  |
| `export`   | Benoemde export om te gebruiken (standaard `"default"`)        |
| `os`       | Vereiste platforms (bijv. `["darwin", "linux"]`)               |
| `requires` | Vereiste paden voor `bins`, `anyBins`, `env` of `config`       |
| `always`   | Geschiktheidscontroles omzeilen (booleaanse waarde)            |
| `install`  | Installatiemethoden                                            |

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

Elke gebeurtenis bevat: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push om naar de gebruiker te sturen) en `context` (gebeurtenisspecifieke gegevens). Hookcontexten van agent- en toolplugins kunnen ook `trace` bevatten, een alleen-lezen W3C-compatibele diagnostische tracecontext die plugins kunnen doorgeven aan gestructureerde logs voor OTEL-correlatie.

### Belangrijke punten over gebeurteniscontext

**Opdrachtgebeurtenissen** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Berichtgebeurtenissen** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (providerspecifieke gegevens inclusief `senderId`, `senderName`, `guildId`). `context.content` geeft de voorkeur aan een niet-lege opdrachtbody voor opdrachtachtige berichten, valt daarna terug op de ruwe inkomende body en algemene body; het bevat geen agent-only verrijking zoals threadgeschiedenis of linksamenvattingen.

**Berichtgebeurtenissen** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Berichtgebeurtenissen** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Berichtgebeurtenissen** (`message:preprocessed`): `context.bodyForAgent` (uiteindelijke verrijkte body), `context.from`, `context.channelId`.

**Bootstrap-gebeurtenissen** (`agent:bootstrap`): `context.bootstrapFiles` (muteerbare array), `context.agentId`.

**Sessiepatchgebeurtenissen** (`session:patch`): `context.sessionEntry`, `context.patch` (alleen gewijzigde velden), `context.cfg`. Alleen geprivilegieerde clients kunnen patchgebeurtenissen starten.

**Compaction-gebeurtenissen**: `session:compact:before` bevat `messageCount`, `tokenCount`. `session:compact:after` voegt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` toe.

`command:stop` observeert dat de gebruiker `/stop` uitgeeft; het is een annulering/opdracht-lifecycle, geen gate voor agent-finalisatie. Plugins die een natuurlijk eindantwoord moeten inspecteren en de agent om nog een extra passage moeten vragen, moeten in plaats daarvan de getypte plugin-hook `before_agent_finalize` gebruiken. Zie [Plugin-hooks](/nl/plugins/hooks).

**Gateway-lifecyclegebeurtenissen**: `gateway:shutdown` bevat `reason` en `restartExpectedMs` en vindt plaats wanneer het afsluiten van de gateway begint. `gateway:pre-restart` bevat dezelfde context, maar vindt alleen plaats wanneer afsluiten onderdeel is van een verwachte herstart en er een eindige waarde voor `restartExpectedMs` wordt opgegeven. Tijdens het afsluiten is elke lifecycle-hookwait best-effort en begrensd, zodat afsluiten doorgaat als een handler blijft hangen.

## Hookontdekking

Hooks worden ontdekt vanuit deze directories, in volgorde van oplopende override-prioriteit:

1. **Gebundelde hooks**: meegeleverd met OpenClaw
2. **Plugin-hooks**: hooks gebundeld in geinstalleerde plugins
3. **Beheerde hooks**: `~/.openclaw/hooks/` (door gebruiker geinstalleerd, gedeeld tussen workspaces). Extra directories uit `hooks.internal.load.extraDirs` delen deze prioriteit.
4. **Workspace-hooks**: `<workspace>/hooks/` (per agent, standaard uitgeschakeld tot expliciet ingeschakeld)

Workspace-hooks kunnen nieuwe hooknamen toevoegen, maar kunnen geen gebundelde, beheerde of door plugins geleverde hooks met dezelfde naam overschrijven.

De Gateway slaat interne hookontdekking bij het opstarten over totdat interne hooks zijn geconfigureerd. Schakel een gebundelde of beheerde hook in met `openclaw hooks enable <name>`, installeer een hookpack of stel `hooks.internal.enabled=true` in om je aan te melden. Wanneer je een benoemde hook inschakelt, laadt de Gateway alleen de handler van die hook; `hooks.internal.enabled=true`, extra hookdirectories en legacy-handlers melden zich aan voor brede ontdekking.

### Hookpacks

Hookpakketten zijn npm-pakketten die hooks exporteren via `openclaw.hooks` in `package.json`. Installeer met:

```bash
openclaw plugins install <path-or-spec>
```

Npm-specificaties zijn alleen voor het register (pakketnaam + optionele exacte versie of dist-tag). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd.

## Gebundelde hooks

| Hook                  | Gebeurtenissen                                   | Wat het doet                                                         |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Slaat sessiecontext op in `<workspace>/memory/`                      |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injecteert extra bootstrapbestanden uit globpatronen                 |
| command-logger        | `command`                                         | Registreert alle opdrachten in `~/.openclaw/logs/commands.log`       |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Stuurt zichtbare chatmeldingen wanneer Compaction start/eindigt      |
| boot-md               | `gateway:startup`                                 | Voert `BOOT.md` uit wanneer de Gateway start                         |

Schakel een gebundelde hook in:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details van session-memory

Extraheert de laatste 15 gebruikers-/assistentberichten en slaat ze op in `<workspace>/memory/YYYY-MM-DD-HHMM.md` met de lokale datum van de host. Het vastleggen van geheugen draait op de achtergrond, zodat bevestigingen voor `/new` en `/reset` niet worden vertraagd door transcriptlezingen of optionele sluggeneratie. Stel `hooks.internal.entries.session-memory.llmSlug: true` in om beschrijvende bestandsnaam-slugs te genereren met het geconfigureerde model. Vereist dat `workspace.dir` is geconfigureerd.

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

Paden worden relatief ten opzichte van de werkruimte opgelost. Alleen herkende bootstrap-basisnamen worden geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Details van command-logger

Registreert elke slash-opdracht in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Details van compaction-notifier

Stuurt korte statusberichten naar het huidige gesprek wanneer OpenClaw begint en klaar is met het compacten van het sessietranscript. Dit maakt lange beurten minder verwarrend op chatoppervlakken, omdat de gebruiker kan zien dat de assistent context samenvat en na Compaction doorgaat.

<a id="boot-md"></a>

### Details van boot-md

Voert `BOOT.md` uit vanuit de actieve werkruimte wanneer de Gateway start.

## Plugin-hooks

Plugins kunnen getypeerde hooks registreren via de Plugin SDK voor diepere integratie:
tool-aanroepen onderscheppen, prompts wijzigen, de berichtenstroom beheren en meer.
Gebruik Plugin-hooks wanneer je `before_tool_call`, `before_agent_reply`,
`before_install` of andere in-process levenscyclushooks nodig hebt.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de volledige referentie voor Plugin-hooks.

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
De verouderde arrayconfiguratie-indeling `hooks.internal.handlers` wordt nog steeds ondersteund voor achterwaartse compatibiliteit, maar nieuwe hooks moeten het op discovery gebaseerde systeem gebruiken.
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

- **Houd handlers snel.** Hooks draaien tijdens opdrachtverwerking. Start zwaar werk op de achtergrond zonder erop te wachten met `void processInBackground(event)`.
- **Handel fouten netjes af.** Wikkel risicovolle bewerkingen in try/catch; gooi geen fouten zodat andere handlers kunnen draaien.
- **Filter events vroeg.** Keer direct terug als het eventtype/de actie niet relevant is.
- **Gebruik specifieke eventsleutels.** Geef de voorkeur aan `"events": ["command:new"]` boven `"events": ["command"]` om overhead te verminderen.

## Probleemoplossing

### Hook niet gevonden

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
2. Herstart je Gateway-proces zodat hooks opnieuw worden geladen.
3. Controleer de Gateway-logboeken: `./scripts/clawlog.sh | grep hook`

## Gerelateerd

- [CLI-referentie: hooks](/nl/cli/hooks)
- [Webhooks](/nl/automation/cron-jobs#webhooks)
- [Plugin-hooks](/nl/plugins/hooks) — in-process hooks voor de levenscyclus van plugins
- [Configuratie](/nl/gateway/configuration-reference#hooks)

---
read_when:
    - De acpx-harness installeren of configureren voor Claude Code / Codex / Gemini CLI
    - De MCP-bridge voor plugin-tools of OpenClaw-tools inschakelen
    - ACP-machtigingsmodi configureren
summary: 'ACP-agents instellen: acpx-harnasconfiguratie, Plugin-installatie, machtigingen'
title: ACP-agents — installatie
x-i18n:
    generated_at: "2026-07-12T09:20:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Zie [ACP-agents](/nl/tools/acp-agents) voor het overzicht, het operationele draaiboek en de concepten.

Deze pagina behandelt de acpx-harnasconfiguratie, de Plugin-installatie voor de MCP-bruggen en de machtigingsconfiguratie.

Gebruik deze pagina alleen wanneer u de ACP/acpx-route instelt. Gebruik voor de runtimeconfiguratie van de native Codex-appserver [Codex-harnas](/nl/plugins/codex-harness). Gebruik voor OpenAI-API-sleutels of de configuratie van Codex OAuth als modelprovider [OpenAI](/nl/providers/openai).

Codex heeft twee OpenClaw-routes:

| Route                       | Configuratie/opdracht                                 | Installatiepagina                       |
| --------------------------- | ----------------------------------------------------- | --------------------------------------- |
| Native Codex-appserver      | `/codex ...`, `openai/gpt-*`-agentverwijzingen       | [Codex-harnas](/nl/plugins/codex-harness)  |
| Expliciete Codex ACP-adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Deze pagina                             |

Geef de voorkeur aan de native route, tenzij u expliciet ACP/acpx-gedrag nodig hebt.

## Ondersteuning voor acpx-harnassen (huidig)

Ingebouwde acpx-harnasaliassen (uit de vastgezette `acpx`-afhankelijkheid):

| Alias        | Omvat                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP-brug (native `openclaw acp`)                                                                       |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` en `factorydroid` worden eveneens omgezet naar de ingebouwde `droid`-adapter.

Wanneer OpenClaw de acpx-backend gebruikt, geeft u de voorkeur aan deze waarden voor `agentId`, tenzij uw acpx-configuratie aangepaste agentaliasen definieert.
Als uw lokale Cursor-installatie ACP nog steeds beschikbaar stelt als `agent acp`, overschrijft u de opdracht van de `cursor`-agent in uw acpx-configuratie in plaats van de ingebouwde standaardwaarde te wijzigen.

Bij rechtstreeks gebruik van de acpx-CLI kunnen ook willekeurige adapters worden aangestuurd via `--agent <command>`, maar deze onbewerkte uitweg is een functie van de acpx-CLI (niet het normale `agentId`-pad van OpenClaw).

Modelbeheer is afhankelijk van de mogelijkheden van de adapter. Codex ACP-modelverwijzingen worden vóór het opstarten door OpenClaw genormaliseerd. Andere harnassen hebben ACP-ondersteuning voor `models` en `session/set_model` nodig; als een harnas noch die ACP-mogelijkheid, noch een eigen opstartvlag voor het model beschikbaar stelt, kan OpenClaw/acpx geen modelselectie afdwingen.

## Vereiste configuratie

ACP-basisconfiguratie van de kern:

```json5
{
  acp: {
    enabled: true,
    // Optioneel. De standaardwaarde is true; stel in op false om ACP-verzending te pauzeren terwijl /acp-bediening beschikbaar blijft.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Standaardwaarden zijn coalesceIdleMs: 350, maxChunkChars: 1800; hier expliciet weergegeven.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

De configuratie voor threadkoppeling is specifiek voor de kanaaladapter. Voorbeeld voor Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        // De standaardwaarde is al true; hier expliciet weergegeven.
        spawnSessions: true,
      },
    },
  },
}
```

Als het starten van een threadgebonden ACP-sessie niet werkt, controleert u eerst de functievlag van de adapter:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Koppelingen aan het huidige gesprek vereisen geen aanmaak van een onderliggende thread. Ze vereisen een actieve gesprekscontext en een kanaaladapter die ACP-gesprekskoppelingen beschikbaar stelt.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference).

## Plugin-installatie voor de acpx-backend

Installaties uit pakketten gebruiken de officiële runtime-Plugin `@openclaw/acpx` voor ACP.
Installeer en activeer deze voordat u ACP-harnassessies gebruikt:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Uitcheckingen van de broncode kunnen na `pnpm install` ook de lokale werkruimte-Plugin gebruiken.

Begin met:

```text
/acp doctor
```

Als u `acpx` hebt uitgeschakeld, deze via `plugins.allow` / `plugins.deny` hebt geweigerd of wilt terugschakelen naar de Plugin uit het pakket, gebruikt u het expliciete pakketpad:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale werkruimte-installatie tijdens ontwikkeling:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Controleer vervolgens de status van de backend:

```text
/acp doctor
```

### Opstartcontrole van de acpx-runtime

De `acpx`-Plugin bevat de ACP-runtime rechtstreeks (er is geen afzonderlijk `acpx`-binair bestand of versie om te configureren). Standaard registreert de Plugin de ingebedde backend tijdens het opstarten van de Gateway en wacht deze op een opstartcontrole voordat de Gateway het signaal `ready` afgeeft. Stel `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` of `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` alleen in voor scripts of omgevingen waarin de opstartcontrole bewust uitgeschakeld blijft. Voer `/acp doctor` uit voor een expliciete controle op aanvraag.

Overschrijf de opdracht van een afzonderlijke ACP-agent met gestructureerde argumenten wanneer een pad of vlagwaarde één argv-token moet blijven:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` is het uitvoerbare bestand of de bestaande opdrachttekenreeks voor die ACP-agent.
- `agents.<id>.args` is optioneel. Elk array-item wordt voor de shell aangehaald voordat OpenClaw het doorgeeft via het huidige acpx-register voor opdrachttekenreeksen.

Zie [Plugins](/nl/tools/plugin).

### Automatisch downloaden van adapters

`acpx` downloadt ACP-adapters (bijvoorbeeld de ACP-bruggen voor Claude en Codex) bij het eerste gebruik automatisch via `npx`. U hoeft adapterpakketten niet handmatig te installeren en er is geen afzonderlijke stap na de installatie voor OpenClaw zelf. Als het downloaden of starten van een adapter mislukt, meldt `/acp doctor` de fout.

### MCP-brug voor Plugin-hulpmiddelen

Standaard stellen ACPX-sessies door OpenClaw-Plugins geregistreerde hulpmiddelen **niet** beschikbaar aan het ACP-harnas.

Als u wilt dat ACP-agents zoals Codex of Claude Code geïnstalleerde hulpmiddelen van OpenClaw-Plugins kunnen aanroepen, zoals geheugen ophalen/opslaan, activeert u de speciale brug:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Wat dit doet:

- Injecteert tijdens de initialisatie van de ACPX-sessie een ingebouwde MCP-server met de naam `openclaw-plugin-tools`.
- Stelt Plugin-hulpmiddelen beschikbaar die al zijn geregistreerd door geïnstalleerde en geactiveerde OpenClaw-Plugins.
- Houdt de functie expliciet en standaard uitgeschakeld.

Opmerkingen over beveiliging en vertrouwen:

- Dit breidt het hulpmiddelenoppervlak van het ACP-harnas uit.
- ACP-agents krijgen alleen toegang tot Plugin-hulpmiddelen die al actief zijn in de Gateway.
- Behandel dit als dezelfde vertrouwensgrens als wanneer u die Plugins in OpenClaw zelf laat uitvoeren.
- Controleer geïnstalleerde Plugins voordat u dit activeert.

Aangepaste `mcpServers` blijven zoals voorheen werken. De ingebouwde brug voor Plugin-hulpmiddelen is een aanvullend optioneel gemak, geen vervanging voor algemene MCP-serverconfiguratie.

### MCP-brug voor OpenClaw-hulpmiddelen

Standaard stellen ACPX-sessies ingebouwde OpenClaw-hulpmiddelen ook **niet** via MCP beschikbaar. Activeer de afzonderlijke brug voor kernhulpmiddelen wanneer een ACP-agent geselecteerde ingebouwde hulpmiddelen zoals `cron` nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Wat dit doet:

- Injecteert tijdens de initialisatie van de ACPX-sessie een ingebouwde MCP-server met de naam `openclaw-tools`.
- Stelt geselecteerde ingebouwde OpenClaw-hulpmiddelen beschikbaar. De eerste server stelt `cron` beschikbaar.
- Houdt de beschikbaarstelling van kernhulpmiddelen expliciet en standaard uitgeschakeld.

### Configuratie van de time-out voor runtimebewerkingen

De `acpx`-Plugin geeft het opstarten van de ingebedde runtime en besturingsbewerkingen standaard 120 seconden. Hierdoor hebben tragere harnassen zoals Gemini CLI voldoende tijd om het opstarten en initialiseren van ACP te voltooien. Overschrijf dit als uw host een andere bewerkingslimiet nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Runtimebeurten gebruiken de time-outs voor OpenClaw-agents/uitvoeringen, waaronder `/acp timeout`.
`sessions_spawn` accepteert geen time-outoverschrijvingen per aanroep; het operatorpad is `agents.defaults.subagents.runTimeoutSeconds`. Start de Gateway opnieuw nadat u `timeoutSeconds` hebt gewijzigd.

### Configuratie van de agent voor statuscontroles

Wanneer `/acp doctor` of de opstartcontrole de backend controleert, test de meegeleverde `acpx`-Plugin één harnasagent. Als `acp.allowedAgents` is ingesteld, wordt standaard de eerste toegestane agent gebruikt; anders is de standaardwaarde `codex`. Als uw implementatie een andere ACP-agent voor statuscontroles nodig heeft, stelt u de controleagent expliciet in:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Start de Gateway opnieuw nadat u deze waarde hebt gewijzigd.

## Machtigingsconfiguratie

ACP-sessies worden niet-interactief uitgevoerd — er is geen TTY om machtigingsvragen voor het schrijven van bestanden en het uitvoeren van shellopdrachten goed te keuren of te weigeren. De acpx-Plugin biedt twee configuratiesleutels waarmee wordt bepaald hoe machtigingen worden afgehandeld:

Deze ACPX-harnasmachtigingen staan los van OpenClaw-goedkeuringen voor uitvoering en van leveranciersspecifieke omzeilingsvlaggen voor CLI-backends, zoals Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` is de noodschakelaar op harnasniveau voor ACP-sessies.

Zie [Machtigingsmodi](/nl/tools/permission-modes) voor de bredere vergelijking tussen OpenClaw `tools.exec.mode`, Codex Guardian-goedkeuringen en ACPX-harnasmachtigingen.

### `permissionMode`

Bepaalt welke bewerkingen de harnasagent zonder bevestiging kan uitvoeren.

| Waarde          | Gedrag                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| `approve-all`   | Keur alle schrijfbewerkingen naar bestanden en shellopdrachten automatisch goed. |
| `approve-reads` | Keur alleen leesbewerkingen automatisch goed; voor schrijven en uitvoeren zijn prompts vereist. |
| `deny-all`      | Weiger alle toestemmingsprompts.                                       |

### `nonInteractivePermissions`

Bepaalt wat er gebeurt wanneer een toestemmingsprompt zou worden weergegeven, maar er geen interactieve TTY beschikbaar is (wat altijd het geval is voor ACP-sessies).

| Waarde | Gedrag                                                                    |
| ------ | ------------------------------------------------------------------------- |
| `fail` | Breek de sessie af met `PermissionPromptUnavailableError`. **(standaard)** |
| `deny` | Weiger de toestemming stilzwijgend en ga door (geleidelijke degradatie).   |

### Configuratie

Stel dit in via de Plugin-configuratie:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Start de Gateway opnieuw nadat u deze waarden hebt gewijzigd.

<Warning>
OpenClaw gebruikt standaard `permissionMode=approve-reads` en `nonInteractivePermissions=fail`. In niet-interactieve ACP-sessies kan elke schrijf- of uitvoerbewerking die een toestemmingsprompt activeert, mislukken met `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Als u toestemmingen moet beperken, stelt u `nonInteractivePermissions` in op `deny`, zodat sessies geleidelijk degraderen in plaats van vast te lopen.
</Warning>

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents) — overzicht, operationeel draaiboek, concepten
- [Subagents](/nl/tools/subagents)
- [Routering voor meerdere agents](/nl/concepts/multi-agent)

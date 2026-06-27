---
read_when:
    - De acpx-harness installeren of configureren voor Claude Code / Codex / Gemini CLI
    - De MCP-bridge voor plugin-tools of OpenClaw-tools inschakelen
    - ACP-machtigingsmodi configureren
summary: 'ACP-agenten instellen: acpx-harnessconfiguratie, Plugin-installatie, machtigingen'
title: ACP-agenten — installatie
x-i18n:
    generated_at: "2026-06-27T18:23:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Voor het overzicht, het operator-runbook en de concepten, zie [ACP-agents](/nl/tools/acp-agents).

De onderstaande secties behandelen acpx-harnessconfiguratie, Plugin-instelling voor de MCP-bruggen en permissieconfiguratie.

Gebruik deze pagina alleen wanneer je de ACP/acpx-route instelt. Voor native Codex
app-server-runtimeconfiguratie gebruik je [Codex-harness](/nl/plugins/codex-harness). Voor
OpenAI-API-sleutels of Codex OAuth-modelproviderconfiguratie gebruik je
[OpenAI](/nl/providers/openai).

Codex heeft twee OpenClaw-routes:

| Route                      | Configuratie/opdracht                                 | Instelpagina                            |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Native Codex app-server    | `/codex ...`, `openai/gpt-*`-agentverwijzingen         | [Codex-harness](/nl/plugins/codex-harness) |
| Expliciete Codex ACP-adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Deze pagina                             |

Geef de voorkeur aan de native route, tenzij je expliciet ACP/acpx-gedrag nodig hebt.

## acpx-harnessondersteuning (huidig)

Huidige ingebouwde acpx-harnassenaliassen:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `qwen`

Wanneer OpenClaw de acpx-backend gebruikt, geef je de voorkeur aan deze waarden voor `agentId`, tenzij je acpx-configuratie aangepaste agentaliasen definieert.
Als je lokale Cursor-installatie ACP nog steeds als `agent acp` aanbiedt, overschrijf dan de opdracht van de `cursor`-agent in je acpx-configuratie in plaats van de ingebouwde standaard te wijzigen.

Direct CLI-gebruik van acpx kan ook willekeurige adapters targeten via `--agent <command>`, maar die ruwe uitwijkmogelijkheid is een acpx CLI-functie (niet het normale OpenClaw-`agentId`-pad).

Modelbeheer hangt af van de adaptercapaciteit. Codex ACP-modelverwijzingen worden
door OpenClaw genormaliseerd vóór het opstarten. Andere harnassen hebben ACP `models` plus
`session/set_model`-ondersteuning nodig; als een harness noch die ACP-capaciteit
noch een eigen opstartmodelvlag aanbiedt, kan OpenClaw/acpx geen modelselectie afdwingen.

## Vereiste configuratie

Core ACP-baseline:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
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
      "openclaw",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Threadbindingsconfiguratie is specifiek voor de kanaaladapter. Voorbeeld voor Discord:

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
        spawnSessions: true,
      },
    },
  },
}
```

Als threadgebonden ACP-spawn niet werkt, controleer dan eerst de featureflag van de adapter:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Bindingen voor het huidige gesprek vereisen geen aanmaak van child-threads. Ze vereisen een actieve gesprekscontext en een kanaaladapter die ACP-gespreksbindingen aanbiedt.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference).

## Plugin-instelling voor acpx-backend

Gepackagede installaties gebruiken de officiële `@openclaw/acpx` runtime-Plugin voor ACP.
Installeer en schakel deze in voordat je ACP-harnassessies gebruikt:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-checkouts kunnen na `pnpm install` ook de lokale workspace-Plugin gebruiken.

Begin met:

```text
/acp doctor
```

Als je `acpx` hebt uitgeschakeld, het hebt geweigerd via `plugins.allow` / `plugins.deny`, of
terug wilt schakelen naar de gepackagede Plugin, gebruik dan het expliciete pakketpad:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale workspace-installatie tijdens ontwikkeling:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Controleer daarna de backendstatus:

```text
/acp doctor
```

### acpx-opdracht- en versieconfiguratie

Standaard registreert de `acpx`-Plugin de ingebedde ACP-backend tijdens het opstarten van de Gateway
en wacht deze op de startup-probe van de ingebedde runtime vóór het
`ready`-signaal van de Gateway. Stel `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` of
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` alleen in voor scripts of omgevingen die
de startup-probe bewust uitgeschakeld houden. Voer `/acp doctor` uit voor een expliciete
probe op aanvraag.

Overschrijf de opdracht of versie in de Plugin-configuratie:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` accepteert een absoluut pad, relatief pad (opgelost vanuit de OpenClaw-workspace), of opdrachtnaam.
- `expectedVersion: "any"` schakelt strikte versiematching uit.
- Aangepaste `command`-paden schakelen Plugin-lokale automatische installatie uit.

Overschrijf een afzonderlijke ACP-agentopdracht met gestructureerde argumenten wanneer een pad
of vlagwaarde één argv-token moet blijven:

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

- `agents.<id>.command` is het uitvoerbare bestand of de bestaande opdrachtstring voor die ACP-agent.
- `agents.<id>.args` is optioneel. Elk array-item wordt shell-gequote voordat OpenClaw het doorgeeft via het huidige acpx-opdrachtstringregister.

Zie [Plugins](/nl/tools/plugin).

### Automatische dependency-installatie

Wanneer je OpenClaw globaal installeert met `npm install -g openclaw`, worden de acpx
runtime-dependencies (platformspecifieke binaries) automatisch geïnstalleerd
via een postinstall-hook. Als de automatische installatie mislukt, start de Gateway nog steeds
normaal en meldt deze de ontbrekende dependency via `openclaw acp doctor`.

### MCP-brug voor Plugin-tools

Standaard stellen ACPX-sessies OpenClaw Plugin-geregistreerde tools **niet** bloot aan
het ACP-harnas.

Als je wilt dat ACP-agents zoals Codex of Claude Code geïnstalleerde
OpenClaw Plugin-tools zoals memory recall/store kunnen aanroepen, schakel dan de specifieke brug in:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Wat dit doet:

- Injecteert een ingebouwde MCP-server met de naam `openclaw-plugin-tools` in de bootstrap van ACPX-sessies.
- Stelt Plugin-tools beschikbaar die al zijn geregistreerd door geïnstalleerde en ingeschakelde OpenClaw
  Plugins.
- Houdt de functie expliciet en standaard uitgeschakeld.

Beveiligings- en vertrouwensnotities:

- Dit breidt het tooloppervlak van het ACP-harnas uit.
- ACP-agents krijgen alleen toegang tot Plugin-tools die al actief zijn in de Gateway.
- Behandel dit als dezelfde vertrouwensgrens als het toestaan dat die Plugins in
  OpenClaw zelf worden uitgevoerd.
- Controleer geïnstalleerde Plugins voordat je dit inschakelt.

Aangepaste `mcpServers` blijven werken zoals voorheen. De ingebouwde brug voor Plugin-tools is een
extra opt-in gemak, geen vervanging voor generieke MCP-serverconfiguratie.

### MCP-brug voor OpenClaw-tools

Standaard stellen ACPX-sessies ingebouwde OpenClaw-tools ook **niet** bloot via
MCP. Schakel de afzonderlijke core-tools-brug in wanneer een ACP-agent geselecteerde
ingebouwde tools zoals `cron` nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Wat dit doet:

- Injecteert een ingebouwde MCP-server met de naam `openclaw-tools` in de bootstrap van ACPX-sessies.
- Stelt geselecteerde ingebouwde OpenClaw-tools beschikbaar. De initiële server stelt `cron` beschikbaar.
- Houdt core-toolblootstelling expliciet en standaard uitgeschakeld.

### Configuratie van runtimebewerkingstime-out

De `acpx`-Plugin geeft ingebedde runtime-opstart en controlebewerkingen standaard 120
seconden. Dit geeft langzamere harnassen zoals Gemini CLI voldoende tijd
om ACP-opstart en -initialisatie te voltooien. Overschrijf dit als je host een
andere bewerkingslimiet nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Runtime-turns gebruiken OpenClaw-agent-/run-time-outs, inclusief `/acp timeout`.
`sessions_spawn` accepteert geen time-outoverschrijvingen per aanroep. Herstart de
Gateway nadat je deze waarde hebt gewijzigd.

### Configuratie van health-probe-agent

Wanneer `/acp doctor` of de startup-probe de backend controleert, proben de gebundelde `acpx`
Plugin één harness-agent. Als `acp.allowedAgents` is ingesteld, wordt standaard
de eerste toegestane agent gebruikt; anders is de standaard `codex`. Als je deployment
een andere ACP-agent voor health checks nodig heeft, stel de probe-agent dan expliciet in:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Herstart de Gateway nadat je deze waarde hebt gewijzigd.

## Permissieconfiguratie

ACP-sessies worden niet-interactief uitgevoerd: er is geen TTY om permissieprompts voor file-write en shell-exec goed te keuren of te weigeren. De acpx-Plugin biedt twee configuratiesleutels die bepalen hoe permissies worden afgehandeld:

Deze ACPX-harnesspermissies staan los van OpenClaw exec-goedkeuringen en los van bypassvlaggen van CLI-backendleveranciers zoals Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` is de break-glass-schakelaar op harnasniveau voor ACP-sessies.

Voor de bredere vergelijking tussen OpenClaw `tools.exec.mode`, Codex Guardian-
goedkeuringen en ACPX-harnesspermissies, zie
[Permissiemodi](/nl/tools/permission-modes).

### `permissionMode`

Bepaalt welke bewerkingen de harness-agent zonder prompt kan uitvoeren.

| Waarde          | Gedrag                                                    |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Keur alle bestandswrites en shell-opdrachten automatisch goed. |
| `approve-reads` | Keur alleen reads automatisch goed; writes en exec vereisen prompts. |
| `deny-all`      | Weiger alle permissieprompts.                             |

### `nonInteractivePermissions`

Bepaalt wat er gebeurt wanneer een permissieprompt zou worden getoond maar er geen interactieve TTY beschikbaar is (wat altijd het geval is voor ACP-sessies).

| Waarde | Gedrag                                                            |
| ------ | ----------------------------------------------------------------- |
| `fail` | Breek de sessie af met `AcpRuntimeError`. **(standaard)**         |
| `deny` | Weiger de permissie stilzwijgend en ga door (graceful degradation). |

### Configuratie

Stel in via Plugin-configuratie:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Herstart de Gateway nadat je deze waarden hebt gewijzigd.

<Warning>
OpenClaw gebruikt standaard `permissionMode=approve-reads` en `nonInteractivePermissions=fail`. In niet-interactieve ACP-sessies kan elke write of exec die een permissieprompt activeert mislukken met `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Als je permissies moet beperken, stel `nonInteractivePermissions` dan in op `deny`, zodat sessies graceful degraderen in plaats van crashen.
</Warning>

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents) — overzicht, operator-runbook, concepten
- [Subagents](/nl/tools/subagents)
- [Multi-agentrouting](/nl/concepts/multi-agent)

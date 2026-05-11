---
read_when:
    - Het acpx-harnas voor Claude Code / Codex / Gemini CLI installeren of configureren
    - De MCP-brug voor plugin-tools of OpenClaw-tools inschakelen
    - ACP-machtigingsmodi configureren
summary: 'ACP-agents instellen: acpx-harnessconfiguratie, Pluginconfiguratie, machtigingen'
title: ACP-agenten — installatie
x-i18n:
    generated_at: "2026-05-11T20:51:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Zie [ACP agents](/nl/tools/acp-agents) voor het overzicht, het operator-runbook en de concepten.

De onderstaande secties behandelen de acpx-harnessconfiguratie, Plugin-installatie voor de MCP-bridges en machtigingsconfiguratie.

Gebruik deze pagina alleen wanneer je de ACP/acpx-route instelt. Gebruik voor native Codex
app-serverruntimeconfiguratie [Codex harness](/nl/plugins/codex-harness). Gebruik voor
OpenAI API-sleutels of Codex OAuth-configuratie voor modelproviders
[OpenAI](/nl/providers/openai).

Codex heeft twee OpenClaw-routes:

| Route                      | Configuratie/opdracht                                 | Installatiepagina                       |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Native Codex app-server    | `/codex ...`, `openai/gpt-*` agent refs                | [Codex harness](/nl/plugins/codex-harness) |
| Expliciete Codex ACP-adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Deze pagina                             |

Geef de voorkeur aan de native route, tenzij je expliciet ACP/acpx-gedrag nodig hebt.

## Ondersteuning voor acpx-harness (huidig)

Huidige ingebouwde acpx-harnessaliassen:

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
- `pi`
- `qwen`

Wanneer OpenClaw de acpx-backend gebruikt, geef dan de voorkeur aan deze waarden voor `agentId`, tenzij je acpx-configuratie aangepaste agentaliasen definieert.
Als je lokale Cursor-installatie ACP nog steeds beschikbaar maakt als `agent acp`, overschrijf dan de agentopdracht `cursor` in je acpx-configuratie in plaats van de ingebouwde standaardwaarde te wijzigen.

Direct gebruik van de acpx CLI kan ook willekeurige adapters targeten via `--agent <command>`, maar die ruwe escape-hatch is een functie van de acpx CLI (niet het normale OpenClaw-pad met `agentId`).

Modelbesturing is afhankelijk van adaptercapaciteiten. Codex ACP-modelreferenties worden
door OpenClaw genormaliseerd vóór het opstarten. Andere harnesses hebben ACP `models` plus
ondersteuning voor `session/set_model` nodig; als een harness noch die ACP-capaciteit
noch een eigen opstartmodelvlag beschikbaar maakt, kan OpenClaw/acpx geen modelselectie afdwingen.

## Vereiste configuratie

Basisconfiguratie voor Core ACP:

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
      "pi",
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

Configuratie voor threadbinding is specifiek per kanaaladapter. Voorbeeld voor Discord:

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

Bindingen voor het huidige gesprek vereisen geen aanmaak van een child-thread. Ze vereisen een actieve gesprekscontext en een kanaaladapter die ACP-gespreksbindingen beschikbaar maakt.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference).

## Plugin-installatie voor acpx-backend

Gepackagede installaties gebruiken de officiële runtime-Plugin `@openclaw/acpx` voor ACP.
Installeer en schakel die in voordat je ACP-harnesssessies gebruikt:

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
terug wilt schakelen naar de gepackagede Plugin, gebruik dan het expliciete packagepad:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale workspace-installatie tijdens ontwikkeling:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Controleer daarna de backendgezondheid:

```text
/acp doctor
```

### acpx-opdracht- en versieconfiguratie

Standaard controleert de `acpx`-Plugin de ingebedde ACP-backend tijdens het opstarten van de Gateway
en wacht op die controle vóór het `ready`-signaal van de gateway. Stel
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` in om de opstartcontrole over te slaan en
de backend in plaats daarvan lazy te registreren. Voer `/acp doctor` uit voor een expliciete on-demand controle.

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

- `command` accepteert een absoluut pad, relatief pad (opgelost vanaf de OpenClaw-workspace) of opdrachtnaam.
- `expectedVersion: "any"` schakelt strikte versiematching uit.
- Aangepaste `command`-paden schakelen Plugin-lokale automatische installatie uit.

Overschrijf een individuele ACP-agentopdracht met gestructureerde argumenten wanneer een pad
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
- `agents.<id>.args` is optioneel. Elk array-item wordt shell-quoted voordat OpenClaw het doorgeeft via het huidige acpx-opdrachtstringregister.

Zie [Plugins](/nl/tools/plugin).

### Automatische installatie van afhankelijkheden

Wanneer je OpenClaw globaal installeert met `npm install -g openclaw`, worden de
runtime-afhankelijkheden van acpx (platformspecifieke binaries) automatisch geïnstalleerd
via een postinstall-hook. Als de automatische installatie mislukt, start de gateway nog steeds
normaal en rapporteert die de ontbrekende afhankelijkheid via `openclaw acp doctor`.

### MCP-bridge voor Plugin-tools

Standaard stellen ACPX-sessies OpenClaw Plugin-geregistreerde tools **niet** beschikbaar aan
de ACP-harness.

Als je wilt dat ACP-agents zoals Codex of Claude Code geïnstalleerde
OpenClaw Plugin-tools zoals memory recall/store aanroepen, schakel dan de speciale bridge in:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Wat dit doet:

- Injecteert een ingebouwde MCP-server met de naam `openclaw-plugin-tools` in de bootstrap van ACPX-sessies.
- Stelt Plugin-tools beschikbaar die al zijn geregistreerd door geïnstalleerde en ingeschakelde OpenClaw
  Plugins.
- Houdt de functie expliciet en standaard uitgeschakeld.

Opmerkingen over beveiliging en vertrouwen:

- Dit breidt het tooloppervlak van de ACP-harness uit.
- ACP-agents krijgen alleen toegang tot Plugin-tools die al actief zijn in de gateway.
- Behandel dit als dezelfde vertrouwensgrens als wanneer je die Plugins in
  OpenClaw zelf laat uitvoeren.
- Controleer geïnstalleerde Plugins voordat je dit inschakelt.

Aangepaste `mcpServers` blijven werken zoals voorheen. De ingebouwde bridge voor Plugin-tools is een
extra opt-in gemak, geen vervanging voor generieke MCP-serverconfiguratie.

### MCP-bridge voor OpenClaw-tools

Standaard stellen ACPX-sessies ook ingebouwde OpenClaw-tools **niet** beschikbaar via
MCP. Schakel de afzonderlijke bridge voor core-tools in wanneer een ACP-agent geselecteerde
ingebouwde tools zoals `cron` nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Wat dit doet:

- Injecteert een ingebouwde MCP-server met de naam `openclaw-tools` in de bootstrap van ACPX-sessies.
- Stelt geselecteerde ingebouwde OpenClaw-tools beschikbaar. De initiële server stelt `cron` beschikbaar.
- Houdt blootstelling van core-tools expliciet en standaard uitgeschakeld.

### Configuratie van runtimetime-out

De `acpx`-Plugin stelt ingebedde runtime-turns standaard in op een time-out van
120 seconden. Dit geeft tragere harnesses zoals Gemini CLI genoeg tijd om
ACP-opstart en initialisatie te voltooien. Overschrijf dit als je host een andere
runtimelimiet nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Herstart de gateway nadat je deze waarde hebt gewijzigd.

### Configuratie van health-probe-agent

Wanneer `/acp doctor` of de opstartcontrole de backend controleert, controleert de gebundelde `acpx`-
Plugin één harnessagent. Als `acp.allowedAgents` is ingesteld, gebruikt die standaard
de eerste toegestane agent; anders gebruikt die standaard `codex`. Als je deployment
een andere ACP-agent nodig heeft voor healthchecks, stel de probe-agent dan expliciet in:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Herstart de gateway nadat je deze waarde hebt gewijzigd.

## Machtigingsconfiguratie

ACP-sessies draaien niet-interactief — er is geen TTY om prompts voor machtigingen voor file-write en shell-exec goed te keuren of te weigeren. De acpx-Plugin biedt twee configuratiesleutels die bepalen hoe machtigingen worden afgehandeld:

Deze ACPX-harnessmachtigingen staan los van OpenClaw-exec-goedkeuringen en los van vendor-bypassvlaggen voor CLI-backends zoals Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` is de break-glass-schakelaar op harnessniveau voor ACP-sessies.

### `permissionMode`

Bepaalt welke bewerkingen de harnessagent zonder prompt mag uitvoeren.

| Waarde          | Gedrag                                                   |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Keur alle schrijfbewerkingen naar bestanden en shellopdrachten automatisch goed. |
| `approve-reads` | Keur alleen leesbewerkingen automatisch goed; schrijfbewerkingen en exec vereisen prompts. |
| `deny-all`      | Weiger alle machtigingsprompts.                          |

### `nonInteractivePermissions`

Bepaalt wat er gebeurt wanneer een machtigingsprompt zou worden getoond maar er geen interactieve TTY beschikbaar is (wat altijd het geval is voor ACP-sessies).

| Waarde | Gedrag                                                             |
| ------ | ------------------------------------------------------------------ |
| `fail` | Breek de sessie af met `AcpRuntimeError`. **(standaard)**          |
| `deny` | Weiger de machtiging stilzwijgend en ga door (graceful degradation). |

### Configuratie

Stel dit in via Plugin-configuratie:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Herstart de gateway nadat je deze waarden hebt gewijzigd.

<Warning>
OpenClaw gebruikt standaard `permissionMode=approve-reads` en `nonInteractivePermissions=fail`. In niet-interactieve ACP-sessies kan elke schrijfbewerking of exec die een machtigingsprompt triggert mislukken met `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Als je machtigingen moet beperken, stel `nonInteractivePermissions` dan in op `deny` zodat sessies graceful degraderen in plaats van te crashen.
</Warning>

## Gerelateerd

- [ACP agents](/nl/tools/acp-agents) — overzicht, operator-runbook, concepten
- [Sub-agents](/nl/tools/subagents)
- [Multi-agent routing](/nl/concepts/multi-agent)

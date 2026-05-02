---
read_when:
    - Het acpx-harnas voor Claude Code / Codex / Gemini CLI installeren of configureren
    - De MCP-brug voor plugin-tools of OpenClaw-tools inschakelen
    - ACP-machtigingsmodi configureren
summary: 'ACP-agenten instellen: acpx-harnasconfiguratie, Plugin-installatie, machtigingen'
title: ACP-agenten — instellen
x-i18n:
    generated_at: "2026-05-02T11:28:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Zie [ACP agents](/nl/tools/acp-agents) voor het overzicht, het runbook voor operators en de concepten.

De onderstaande secties behandelen de acpx-harnasconfiguratie, Plugin-installatie voor de MCP-bruggen en machtigingsconfiguratie.

Gebruik deze pagina alleen wanneer je de ACP/acpx-route instelt. Gebruik [Codex harness](/nl/plugins/codex-harness) voor native Codex-app-server-runtimeconfiguratie. Gebruik [OpenAI](/nl/providers/openai) voor OpenAI API-sleutels of Codex OAuth-modelproviderconfiguratie.

Codex heeft twee OpenClaw-routes:

| Route                      | Configuratie/opdracht                                  | Installatiepagina                       |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Native Codex-app-server    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/nl/plugins/codex-harness) |
| Expliciete Codex ACP-adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Deze pagina                             |

Geef de voorkeur aan de native route tenzij je expliciet ACP/acpx-gedrag nodig hebt.

## Ondersteuning voor acpx-harnas (huidig)

Huidige ingebouwde acpx-harnasaliassen:

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
Als je lokale Cursor-installatie ACP nog steeds als `agent acp` aanbiedt, overschrijf dan de opdracht voor de `cursor`-agent in je acpx-configuratie in plaats van de ingebouwde standaardwaarde te wijzigen.

Direct gebruik van de acpx CLI kan ook willekeurige adapters aanspreken via `--agent <command>`, maar die ruwe uitwijkmogelijkheid is een acpx CLI-functie (niet het normale OpenClaw-`agentId`-pad).

Modelbeheer hangt af van adaptermogelijkheden. Codex ACP-modelverwijzingen worden door OpenClaw vóór het opstarten genormaliseerd. Andere harnassen hebben ACP `models` plus ondersteuning voor `session/set_model` nodig; als een harnas noch die ACP-mogelijkheid noch een eigen opstartmodelvlag aanbiedt, kan OpenClaw/acpx geen modelselectie afdwingen.

## Vereiste configuratie

Core ACP-basislijn:

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

Threadbindingconfiguratie is kanaaladapter-specifiek. Voorbeeld voor Discord:

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

Als threadgebonden ACP-spawn niet werkt, controleer dan eerst de functievlag van de adapter:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Bindingen voor huidige gesprekken vereisen geen aanmaak van child-threads. Ze vereisen een actieve gesprekscontext en een kanaaladapter die ACP-gespreksbindingen aanbiedt.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference).

## Plugin-installatie voor acpx-backend

Verpakte installaties gebruiken de officiële `@openclaw/acpx`-runtime-Plugin voor ACP.
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

Als je `acpx` hebt uitgeschakeld, het via `plugins.allow` / `plugins.deny` hebt geweigerd, of wilt terugschakelen naar de verpakte Plugin, gebruik dan het expliciete pakketpad:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale workspace-installatie tijdens ontwikkeling:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Controleer daarna de gezondheid van de backend:

```text
/acp doctor
```

### acpx-opdracht- en versieconfiguratie

Standaard registreert de `acpx`-Plugin de ingebedde ACP-backend zonder een ACP-agent te starten tijdens het opstarten van de Gateway. Voer `/acp doctor` uit voor een expliciete live-probe. Stel `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` alleen in wanneer de Gateway de geconfigureerde agent bij het opstarten moet proben.

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

- `command` accepteert een absoluut pad, relatief pad (opgelost vanuit de OpenClaw-workspace) of opdrachtnaam.
- `expectedVersion: "any"` schakelt strikte versievergelijking uit.
- Aangepaste `command`-paden schakelen Plugin-lokale automatische installatie uit.

Zie [Plugins](/nl/tools/plugin).

### Automatische installatie van afhankelijkheden

Wanneer je OpenClaw globaal installeert met `npm install -g openclaw`, worden de acpx-runtimeafhankelijkheden (platformspecifieke binaries) automatisch geïnstalleerd via een postinstall-hook. Als de automatische installatie mislukt, start de Gateway nog steeds normaal en meldt deze de ontbrekende afhankelijkheid via `openclaw acp doctor`.

### MCP-brug voor Plugin-tools

Standaard stellen ACPX-sessies door OpenClaw Plugins geregistreerde tools **niet** beschikbaar aan het ACP-harnas.

Als je wilt dat ACP-agents zoals Codex of Claude Code geïnstalleerde OpenClaw Plugin-tools zoals memory recall/store aanroepen, schakel dan de speciale brug in:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Wat dit doet:

- Injecteert een ingebouwde MCP-server met de naam `openclaw-plugin-tools` in de bootstrap van ACPX-sessies.
- Stelt Plugin-tools beschikbaar die al zijn geregistreerd door geïnstalleerde en ingeschakelde OpenClaw Plugins.
- Houdt de functie expliciet en standaard uitgeschakeld.

Beveiligings- en vertrouwensopmerkingen:

- Dit breidt het tooloppervlak van het ACP-harnas uit.
- ACP-agents krijgen alleen toegang tot Plugin-tools die al actief zijn in de Gateway.
- Behandel dit als dezelfde vertrouwensgrens als het laten uitvoeren van die Plugins in OpenClaw zelf.
- Controleer geïnstalleerde Plugins voordat je dit inschakelt.

Aangepaste `mcpServers` blijven werken zoals voorheen. De ingebouwde brug voor Plugin-tools is een extra opt-in-gemak, geen vervanging voor generieke MCP-serverconfiguratie.

### MCP-brug voor OpenClaw-tools

Standaard stellen ACPX-sessies ook geen ingebouwde OpenClaw-tools beschikbaar via MCP. Schakel de afzonderlijke brug voor core-tools in wanneer een ACP-agent geselecteerde ingebouwde tools zoals `cron` nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Wat dit doet:

- Injecteert een ingebouwde MCP-server met de naam `openclaw-tools` in de bootstrap van ACPX-sessies.
- Stelt geselecteerde ingebouwde OpenClaw-tools beschikbaar. De eerste server biedt `cron` aan.
- Houdt blootstelling van core-tools expliciet en standaard uitgeschakeld.

### Runtime-time-outconfiguratie

De `acpx`-Plugin stelt ingebedde runtimeturns standaard in op een time-out van 120 seconden. Dit geeft langzamere harnassen zoals Gemini CLI genoeg tijd om ACP-opstart en initialisatie te voltooien. Overschrijf dit als je host een andere runtimelimiet nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Herstart de Gateway nadat je deze waarde hebt gewijzigd.

### Configuratie van health-probe-agent

Wanneer `/acp doctor` of de opt-in-opstartprobe de backend controleert, probet de gebundelde `acpx`-Plugin één harnasagent. Als `acp.allowedAgents` is ingesteld, wordt standaard de eerste toegestane agent gebruikt; anders is de standaard `codex`. Als je implementatie een andere ACP-agent nodig heeft voor health checks, stel dan de probe-agent expliciet in:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Herstart de Gateway nadat je deze waarde hebt gewijzigd.

## Machtigingsconfiguratie

ACP-sessies draaien niet-interactief: er is geen TTY om machtigingsprompts voor bestandsschrijfacties en shell-uitvoering goed te keuren of te weigeren. De acpx-Plugin biedt twee configuratiesleutels die bepalen hoe machtigingen worden afgehandeld:

Deze ACPX-harnasmachtigingen staan los van OpenClaw-uitvoeringsgoedkeuringen en los van omzeilingsvlaggen van CLI-backendleveranciers zoals Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` is de break-glass-schakelaar op harnasniveau voor ACP-sessies.

### `permissionMode`

Bepaalt welke bewerkingen de harnasagent zonder prompt kan uitvoeren.

| Waarde          | Gedrag                                                    |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Keur alle bestandsschrijfacties en shellopdrachten automatisch goed. |
| `approve-reads` | Keur alleen leesacties automatisch goed; schrijfacties en exec vereisen prompts. |
| `deny-all`      | Weiger alle machtigingsprompts.                           |

### `nonInteractivePermissions`

Bepaalt wat er gebeurt wanneer een machtigingsprompt zou worden getoond maar er geen interactieve TTY beschikbaar is (wat altijd het geval is voor ACP-sessies).

| Waarde | Gedrag                                                             |
| ------ | ------------------------------------------------------------------ |
| `fail` | Breek de sessie af met `AcpRuntimeError`. **(standaard)**          |
| `deny` | Weiger de machtiging stilzwijgend en ga door (gracieuze degradatie). |

### Configuratie

Stel dit in via Plugin-configuratie:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Herstart de Gateway nadat je deze waarden hebt gewijzigd.

<Warning>
OpenClaw gebruikt standaard `permissionMode=approve-reads` en `nonInteractivePermissions=fail`. In niet-interactieve ACP-sessies kan elke schrijf- of exec-actie die een machtigingsprompt triggert mislukken met `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Als je machtigingen moet beperken, stel `nonInteractivePermissions` dan in op `deny`, zodat sessies gracieus degraderen in plaats van te crashen.
</Warning>

## Gerelateerd

- [ACP agents](/nl/tools/acp-agents) — overzicht, runbook voor operators, concepten
- [Subagents](/nl/tools/subagents)
- [Multi-agentrouting](/nl/concepts/multi-agent)

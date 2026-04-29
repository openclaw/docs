---
read_when:
    - Het acpx-harnas voor Claude Code / Codex / Gemini CLI installeren of configureren
    - De MCP-brug plugin-tools of OpenClaw-tools inschakelen
    - ACP-machtigingsmodi configureren
summary: 'ACP-agents instellen: acpx-harnessconfiguratie, Plugin-installatie, machtigingen'
title: ACP-agenten — instellen
x-i18n:
    generated_at: "2026-04-29T23:20:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Zie [ACP agents](/nl/tools/acp-agents) voor het overzicht, het operatorsrunbook en de concepten.

De onderstaande secties behandelen acpx-harnasconfiguratie, pluginconfiguratie voor de MCP-bruggen en machtigingsconfiguratie.

Gebruik deze pagina alleen wanneer je de ACP/acpx-route instelt. Gebruik voor native Codex
app-server runtimeconfiguratie [Codex harness](/nl/plugins/codex-harness). Gebruik voor
OpenAI API-sleutels of Codex OAuth-modelproviderconfiguratie
[OpenAI](/nl/providers/openai).

Codex heeft twee OpenClaw-routes:

| Route                         | Configuratie/opdracht                                  | Configuratiepagina                     |
| ----------------------------- | ------------------------------------------------------ | -------------------------------------- |
| Native Codex app-server       | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/nl/plugins/codex-harness) |
| Expliciete Codex ACP-adapter  | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Deze pagina                            |

Geef de voorkeur aan de native route, tenzij je expliciet ACP/acpx-gedrag nodig hebt.

## acpx-harnasondersteuning (huidig)

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

Wanneer OpenClaw de acpx-backend gebruikt, geef dan de voorkeur aan deze waarden voor `agentId`, tenzij je acpx-configuratie aangepaste agentaliassen definieert.
Als je lokale Cursor-installatie ACP nog steeds beschikbaar maakt als `agent acp`, overschrijf dan de `cursor`-agentopdracht in je acpx-configuratie in plaats van de ingebouwde standaard te wijzigen.

Direct acpx CLI-gebruik kan ook willekeurige adapters targeten via `--agent <command>`, maar die ruwe uitwijkmogelijkheid is een acpx CLI-functie (niet het normale OpenClaw-`agentId`-pad).

Modelbeheer is afhankelijk van adaptermogelijkheden. Codex ACP-modelreferenties worden
door OpenClaw genormaliseerd vóór het opstarten. Andere harnassen hebben ACP `models` plus
`session/set_model`-ondersteuning nodig; als een harnas noch die ACP-mogelijkheid
noch een eigen modelvlag bij opstarten aanbiedt, kan OpenClaw/acpx geen modelselectie afdwingen.

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

Threadbindingconfiguratie is specifiek voor de kanaaladapter. Voorbeeld voor Discord:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Als thread-gebonden ACP-spawn niet werkt, controleer dan eerst de featurevlag van de adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Bindingen voor het huidige gesprek vereisen geen aanmaak van een child-thread. Ze vereisen een actieve gesprekscontext en een kanaaladapter die ACP-gespreksbindingen aanbiedt.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference).

## Pluginconfiguratie voor acpx-backend

Nieuwe installaties leveren de gebundelde `acpx`-runtimeplugin standaard ingeschakeld mee, dus ACP
werkt meestal zonder handmatige plugininstallatiestap.

Begin met:

```text
/acp doctor
```

Als je `acpx` hebt uitgeschakeld, via `plugins.allow` / `plugins.deny` hebt geweigerd, of wilt
overschakelen naar een lokale ontwikkelcheckout, gebruik dan het expliciete pluginpad:

```bash
openclaw plugins install acpx
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

Standaard registreert de gebundelde `acpx`-plugin de ingebedde ACP-backend zonder
een ACP-agent te starten tijdens het opstarten van de Gateway. Voer `/acp doctor` uit voor een expliciete
live-probe. Stel `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` alleen in wanneer je de
Gateway de geconfigureerde agent bij het opstarten wilt laten proben.

Overschrijf de opdracht of versie in pluginconfiguratie:

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
- `expectedVersion: "any"` schakelt strikte versievergelijking uit.
- Aangepaste `command`-paden schakelen pluginlokale automatische installatie uit.

Zie [Plugins](/nl/tools/plugin).

### Automatische afhankelijkheidsinstallatie

Wanneer je OpenClaw globaal installeert met `npm install -g openclaw`, worden de acpx
runtimeafhankelijkheden (platformspecifieke binaries) automatisch geïnstalleerd
via een postinstall-hook. Als de automatische installatie mislukt, start de gateway nog steeds
normaal en meldt de ontbrekende afhankelijkheid via `openclaw acp doctor`.

### MCP-brug voor plugintools

Standaard stellen ACPX-sessies OpenClaw-plugin-geregistreerde tools **niet** beschikbaar aan
het ACP-harnas.

Als je wilt dat ACP-agents zoals Codex of Claude Code geïnstalleerde
OpenClaw-plugintools zoals geheugen ophalen/opslaan kunnen aanroepen, schakel dan de speciale brug in:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Wat dit doet:

- Injecteert een ingebouwde MCP-server met de naam `openclaw-plugin-tools` in de ACPX-sessie
  bootstrap.
- Stelt plugintools beschikbaar die al zijn geregistreerd door geïnstalleerde en ingeschakelde OpenClaw
  plugins.
- Houdt de functie expliciet en standaard uitgeschakeld.

Beveiligings- en vertrouwensnotities:

- Dit breidt het tooloppervlak van het ACP-harnas uit.
- ACP-agents krijgen alleen toegang tot plugintools die al actief zijn in de gateway.
- Behandel dit als dezelfde vertrouwensgrens als die plugins laten uitvoeren in
  OpenClaw zelf.
- Controleer geïnstalleerde plugins voordat je dit inschakelt.

Aangepaste `mcpServers` blijven werken zoals voorheen. De ingebouwde brug voor plugintools is een
extra opt-in gemak, geen vervanging voor generieke MCP-serverconfiguratie.

### MCP-brug voor OpenClaw-tools

Standaard stellen ACPX-sessies ingebouwde OpenClaw-tools ook **niet** beschikbaar via
MCP. Schakel de aparte core-toolsbrug in wanneer een ACP-agent geselecteerde
ingebouwde tools zoals `cron` nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Wat dit doet:

- Injecteert een ingebouwde MCP-server met de naam `openclaw-tools` in de ACPX-sessie
  bootstrap.
- Stelt geselecteerde ingebouwde OpenClaw-tools beschikbaar. De initiële server stelt `cron` beschikbaar.
- Houdt blootstelling van core-tools expliciet en standaard uitgeschakeld.

### Runtime-time-outconfiguratie

De gebundelde `acpx`-plugin geeft ingebedde runtimebeurten standaard een time-out van 120 seconden.
Dit geeft langzamere harnassen zoals Gemini CLI genoeg tijd om
ACP-opstart en initialisatie te voltooien. Overschrijf dit als je host een andere
runtimelimiet nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Herstart de gateway nadat je deze waarde hebt gewijzigd.

### Agentconfiguratie voor health-probe

Wanneer `/acp doctor` of de opt-in opstartprobe de backend controleert, probet de gebundelde
`acpx`-plugin één harnasagent. Als `acp.allowedAgents` is ingesteld, gebruikt deze
standaard de eerste toegestane agent; anders gebruikt deze standaard `codex`. Als je
deployment een andere ACP-agent nodig heeft voor healthchecks, stel de probe-agent dan
expliciet in:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Herstart de gateway nadat je deze waarde hebt gewijzigd.

## Machtigingsconfiguratie

ACP-sessies draaien niet-interactief — er is geen TTY om prompts voor bestandschrijfrechten en shell-exec-machtigingen goed te keuren of te weigeren. De acpx-plugin biedt twee configuratiesleutels die bepalen hoe machtigingen worden afgehandeld:

Deze ACPX-harnasmachtigingen staan los van OpenClaw-execgoedkeuringen en los van bypassvlaggen van CLI-backendleveranciers zoals Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` is de break-glass-schakelaar op harnasniveau voor ACP-sessies.

### `permissionMode`

Bepaalt welke bewerkingen de harnasagent zonder prompt kan uitvoeren.

| Waarde          | Gedrag                                                   |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Keur alle bestandswijzigingen en shellopdrachten automatisch goed. |
| `approve-reads` | Keur alleen leesbewerkingen automatisch goed; schrijfbewerkingen en exec vereisen prompts. |
| `deny-all`      | Weiger alle machtigingsprompts.                          |

### `nonInteractivePermissions`

Bepaalt wat er gebeurt wanneer een machtigingsprompt zou worden getoond maar er geen interactieve TTY beschikbaar is (wat altijd het geval is voor ACP-sessies).

| Waarde | Gedrag                                                           |
| ------ | ---------------------------------------------------------------- |
| `fail` | Breek de sessie af met `AcpRuntimeError`. **(standaard)**        |
| `deny` | Weiger de machtiging stilzwijgend en ga door (gracieuze degradatie). |

### Configuratie

Stel dit in via pluginconfiguratie:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Herstart de gateway nadat je deze waarden hebt gewijzigd.

<Warning>
OpenClaw gebruikt standaard `permissionMode=approve-reads` en `nonInteractivePermissions=fail`. In niet-interactieve ACP-sessies kan elke schrijf- of exec-bewerking die een machtigingsprompt triggert mislukken met `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Als je machtigingen moet beperken, stel `nonInteractivePermissions` dan in op `deny`, zodat sessies gracieus degraderen in plaats van te crashen.
</Warning>

## Gerelateerd

- [ACP agents](/nl/tools/acp-agents) — overzicht, operatorsrunbook, concepten
- [Subagents](/nl/tools/subagents)
- [Multi-agentrouting](/nl/concepts/multi-agent)

---
read_when:
    - De acpx-harness voor Claude Code / Codex / Gemini CLI installeren of configureren
    - De plugin-tools- of OpenClaw-tools-MCP-bridge inschakelen
    - ACP-machtigingsmodi configureren
summary: 'ACP-agents instellen: acpx-harnasconfiguratie, Plugin-installatie, machtigingen'
title: ACP-agents — configuratie
x-i18n:
    generated_at: "2026-07-16T16:29:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Voor het overzicht, het operatorrunbook en de concepten, zie [ACP-agents](/nl/tools/acp-agents).

Deze pagina behandelt de acpx-harnessconfiguratie, Plugin-installatie voor de MCP-bridges en machtigingsconfiguratie.

Gebruik deze pagina alleen wanneer je de ACP/acpx-route instelt. Gebruik voor de runtimeconfiguratie van de native Codex
app-server [Codex-harness](/nl/plugins/codex-harness). Gebruik voor
OpenAI API-sleutels of de modelproviderconfiguratie voor Codex OAuth
[OpenAI](/nl/providers/openai).

Codex heeft twee OpenClaw-routes:

| Route                         | Configuratie/opdracht                                  | Installatiepagina                       |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Native Codex app-server       | `/codex ...`, `openai/gpt-*`-agentreferenties          | [Codex-harness](/nl/plugins/codex-harness) |
| Expliciete Codex ACP-adapter  | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Deze pagina                             |

Geef de voorkeur aan de native route, tenzij je expliciet ACP/acpx-gedrag nodig hebt.

## Ondersteuning voor de acpx-harness (huidig)

Ingebouwde aliassen voor de acpx-harness (uit de vastgezette afhankelijkheid `acpx`):

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
| `openclaw`   | OpenClaw ACP-bridge (native `openclaw acp`)                                                                     |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` en `factorydroid` worden ook omgezet naar de ingebouwde adapter `droid`.

Wanneer OpenClaw de acpx-backend gebruikt, geef je de voorkeur aan deze waarden voor `agentId`, tenzij je acpx-configuratie aangepaste agentaliasen definieert.
Als je lokale Cursor-installatie ACP nog steeds beschikbaar stelt als `agent acp`, overschrijf je de agentopdracht `cursor` in je acpx-configuratie in plaats van de ingebouwde standaardwaarde te wijzigen.

Bij direct gebruik van de acpx-CLI kun je via `--agent <command>` ook willekeurige adapters kiezen, maar die directe uitweg is een functie van de acpx-CLI (niet het normale OpenClaw-pad `agentId`).

Modelbeheer is afhankelijk van de mogelijkheden van de adapter. Codex ACP-modelreferenties worden
vóór het opstarten door OpenClaw genormaliseerd. Andere harnesses vereisen ACP `models` plus
ondersteuning voor `session/set_model`; als een harness noch die ACP-mogelijkheid
noch een eigen opstartvlag voor het model beschikbaar stelt, kan OpenClaw/acpx geen modelselectie afdwingen.

## Vereiste configuratie

Basisconfiguratie voor ACP in de kern:

```json5
{
  acp: {
    enabled: true,
    // Optioneel. De standaardwaarde is true; stel in op false om ACP-dispatch te pauzeren terwijl /acp-bediening beschikbaar blijft.
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
      // De standaardwaarden zijn coalesceIdleMs: 350 en maxChunkChars: 1800; ze worden hier expliciet weergegeven.
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
        // De standaardwaarde is al true; deze wordt hier expliciet weergegeven.
        spawnSessions: true,
      },
    },
  },
}
```

Als het starten van aan een thread gebonden ACP niet werkt, controleer dan eerst de functievlag van de adapter:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Koppelingen aan het huidige gesprek vereisen geen aanmaak van een onderliggende thread. Ze vereisen een actieve gesprekscontext en een kanaaladapter die ACP-gesprekskoppelingen beschikbaar stelt.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference).

## Plugin-installatie voor de acpx-backend

Installaties uit een pakket gebruiken de officiële runtime-Plugin `@openclaw/acpx` voor ACP.
Installeer en activeer deze voordat je ACP-harnesssessies gebruikt:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Bij broncodecheck-outs kun je na `pnpm install` ook de lokale werkruimte-Plugin gebruiken.

Begin met:

```text
/acp doctor
```

Als je `acpx` hebt uitgeschakeld, deze via `plugins.allow` / `plugins.deny` hebt geweigerd of
terug wilt schakelen naar de Plugin uit het pakket, gebruik je het expliciete pakketpad:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installatie vanuit de lokale werkruimte tijdens de ontwikkeling:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Controleer daarna de status van de backend:

```text
/acp doctor
```

### Opstartcontrole van de acpx-runtime

De Plugin `acpx` bevat de ACP-runtime rechtstreeks (er is geen afzonderlijk binair bestand of
versie `acpx` om te configureren). Standaard registreert deze de ingebedde backend tijdens
het opstarten van de Gateway en wacht deze op een opstartcontrole vóór het signaal `ready`
van de gateway. Stel `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` of
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` alleen in voor scripts of omgevingen waarin
de opstartcontrole bewust uitgeschakeld blijft. Voer `/acp doctor` uit voor een expliciete
controle op aanvraag.

Overschrijf de opdracht van een afzonderlijke ACP-agent met gestructureerde argumenten wanneer een pad
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

- `agents.<id>.command` is het uitvoerbare bestand of de bestaande opdrachttekst voor die ACP-agent.
- `agents.<id>.args` is optioneel. Elk array-item wordt voor de shell geciteerd voordat OpenClaw het doorgeeft via het huidige register voor acpx-opdrachtteksten.

Zie [Plugins](/nl/tools/plugin).

### Automatisch downloaden van adapters

`acpx` downloadt ACP-adapters (bijvoorbeeld de ACP-bridges voor Claude en Codex)
bij het eerste gebruik automatisch via `npx`. Je hoeft adapterpakketten niet
handmatig te installeren en er is geen afzonderlijke postinstallatiestap voor OpenClaw zelf. Als het
downloaden of starten van een adapter mislukt, meldt `/acp doctor` de fout.

### MCP-bridge voor Plugin-tools

Standaard stellen ACPX-sessies door OpenClaw-Plugins geregistreerde tools **niet**
beschikbaar aan de ACP-harness.

Als je wilt dat ACP-agents zoals Codex of Claude Code geïnstalleerde
OpenClaw-Plugin-tools zoals geheugen ophalen/opslaan kunnen aanroepen, activeer je de specifieke bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Wat dit doet:

- Voegt tijdens de initialisatie van ACPX-sessies een ingebouwde MCP-server met de naam
  `openclaw-plugin-tools` toe.
- Stelt Plugin-tools beschikbaar die al zijn geregistreerd door geïnstalleerde en geactiveerde
  OpenClaw-Plugins.
- Geeft de identiteit van de actieve ACP-sessie door aan fabrieken voor Plugin-tools, zodat
  tools met een agentbereik binnen de naamruimte van die agent blijven.
- Houdt de functie expliciet en standaard uitgeschakeld.

Opmerkingen over beveiliging en vertrouwen:

- Dit breidt het tooloppervlak van de ACP-harness uit.
- ACP-agents krijgen alleen toegang tot Plugin-tools die al actief zijn in de gateway.
- Behandel dit als dezelfde vertrouwensgrens als wanneer je die Plugins in
  OpenClaw zelf laat uitvoeren.
- Controleer geïnstalleerde Plugins voordat je dit activeert.

Aangepaste `mcpServers` blijven werken zoals voorheen. De ingebouwde bridge voor Plugin-tools is een
aanvullend opt-in-gemak, geen vervanging voor algemene MCP-serverconfiguratie.

### MCP-bridge voor OpenClaw-tools

Standaard stellen ACPX-sessies ingebouwde OpenClaw-tools ook **niet** via
MCP beschikbaar. Activeer de afzonderlijke bridge voor kerntools wanneer een ACP-agent geselecteerde
ingebouwde tools zoals `cron` nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Wat dit doet:

- Voegt tijdens de initialisatie van ACPX-sessies een ingebouwde MCP-server met de naam
  `openclaw-tools` toe.
- Stelt geselecteerde ingebouwde OpenClaw-tools beschikbaar. De eerste server stelt `cron` beschikbaar.
- Houdt de beschikbaarstelling van kerntools expliciet en standaard uitgeschakeld.

### Configuratie van de time-out voor runtimebewerkingen

De Plugin `acpx` geeft het opstarten en de besturingsbewerkingen van de ingebedde runtime standaard 120
seconden. Hierdoor hebben tragere harnesses zoals Gemini CLI voldoende tijd
om het opstarten en initialiseren van ACP te voltooien. Overschrijf dit als je host een
andere bewerkingslimiet nodig heeft:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Runtimebeurten gebruiken de time-outs voor OpenClaw-agents/runs, waaronder `/acp timeout`.
`sessions_spawn` accepteert geen time-outoverschrijvingen per aanroep; het operatorpad
is `agents.defaults.subagents.runTimeoutSeconds`. Start de gateway opnieuw nadat je
`timeoutSeconds` hebt gewijzigd.

### Configuratie van de agent voor statuscontroles

Wanneer `/acp doctor` of de opstartcontrole de backend controleert, test de meegeleverde Plugin `acpx`
één harnessagent. Als `acp.allowedAgents` is ingesteld, wordt standaard
de eerste toegestane agent gebruikt; anders is de standaardwaarde `codex`. Als je implementatie
een andere ACP-agent voor statuscontroles nodig heeft, stel je de controleagent expliciet in:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Start de gateway opnieuw nadat je deze waarde hebt gewijzigd.

## Machtigingsconfiguratie

ACP-sessies worden niet-interactief uitgevoerd — er is geen TTY om prompts voor toestemming voor het schrijven van bestanden en het uitvoeren van shellopdrachten goed te keuren of te weigeren. De acpx-plugin biedt twee configuratiesleutels waarmee wordt bepaald hoe toestemmingen worden afgehandeld:

Deze ACPX-harnastoestemmingen staan los van OpenClaw-goedkeuringen voor uitvoering en van omzeilingsvlaggen van CLI-backendleveranciers, zoals Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` is de noodschakelaar op harnessniveau voor ACP-sessies.

Zie
[Toestemmingsmodi](/nl/tools/permission-modes) voor de bredere vergelijking tussen OpenClaw `tools.exec.mode`, goedkeuringen van Codex Guardian
en ACPX-harnastoestemmingen.

### `permissionMode`

Bepaalt welke bewerkingen de harnessagent zonder prompt kan uitvoeren.

| Waarde           | Gedrag                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Alle schrijfbewerkingen voor bestanden en shellopdrachten automatisch goedkeuren.          |
| `approve-reads` | Alleen leesbewerkingen automatisch goedkeuren; schrijfbewerkingen en uitvoering vereisen prompts. |
| `deny-all`      | Alle toestemmingsprompts weigeren.                              |

### `nonInteractivePermissions`

Bepaalt wat er gebeurt wanneer een toestemmingsprompt zou worden weergegeven, maar er geen interactieve TTY beschikbaar is (wat altijd het geval is voor ACP-sessies).

| Waarde  | Gedrag                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | De sessie afbreken met `PermissionPromptUnavailableError`. **(standaard)** |
| `deny` | De toestemming stilzwijgend weigeren en doorgaan (geleidelijke degradatie).        |

### Configuratie

Instellen via de pluginconfiguratie:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Start de Gateway opnieuw nadat je deze waarden hebt gewijzigd.

<Warning>
OpenClaw gebruikt standaard `permissionMode=approve-reads` en `nonInteractivePermissions=fail`. In niet-interactieve ACP-sessies kan elke schrijf- of uitvoeringsbewerking die een toestemmingsprompt activeert, mislukken met `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Als je toestemmingen moet beperken, stel je `nonInteractivePermissions` in op `deny`, zodat sessies geleidelijk degraderen in plaats van vastlopen.
</Warning>

## Gerelateerd

- [ACP-agenten](/nl/tools/acp-agents) — overzicht, operationeel draaiboek, concepten
- [Subagenten](/nl/tools/subagents)
- [Multi-agentrouting](/nl/concepts/multi-agent)

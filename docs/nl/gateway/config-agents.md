---
read_when:
    - Standaardinstellingen voor agents aanpassen (modellen, redeneren, werkruimte, Heartbeat, media, Skills)
    - Multi-agentroutering en bindingen configureren
    - Sessie-, berichtbezorgings- en praatmodusgedrag aanpassen
summary: Agentstandaarden, multi-agentroutering, sessie, berichten en talk-configuratie
title: Configuratie — agenten
x-i18n:
    generated_at: "2026-05-06T09:12:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b864cc3985db2f3ab2e82b18bcd1b1590a387d7474f5f0d0da3a1d36d9a276b9
    source_path: gateway/config-agents.md
    workflow: 16
---

Agent-gebonden configuratiesleutels onder `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` en `talk.*`. Voor kanalen, tools, Gateway-runtime en andere
sleutels op topniveau, zie [Configuratiereferentie](/nl/gateway/configuration-reference).

## Agentstandaarden

### `agents.defaults.workspace`

Standaard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionele repository-root die wordt weergegeven in de Runtime-regel van de systeemprompt. Als dit niet is ingesteld, detecteert OpenClaw deze automatisch door vanaf de workspace omhoog te lopen.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionele standaard-allowlist voor Skills voor agenten die
`agents.list[].skills` niet instellen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Laat `agents.defaults.skills` weg voor standaard onbeperkte Skills.
- Laat `agents.list[].skills` weg om de standaarden te erven.
- Stel `agents.list[].skills: []` in voor geen Skills.
- Een niet-lege lijst `agents.list[].skills` is de definitieve set voor die agent; deze
  wordt niet samengevoegd met standaarden.

### `agents.defaults.skipBootstrap`

Schakelt het automatisch aanmaken van workspace-bootstrapbestanden uit (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Slaat het aanmaken van geselecteerde optionele workspace-bestanden over, terwijl vereiste bootstrapbestanden nog steeds worden geschreven. Geldige waarden: `SOUL.md`, `USER.md`, `HEARTBEAT.md` en `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Bepaalt wanneer workspace-bootstrapbestanden in de systeemprompt worden geïnjecteerd. Standaard: `"always"`.

- `"continuation-skip"`: veilige vervolgbeurten (na een voltooide assistentreactie) slaan het opnieuw injecteren van workspace-bootstrap over, waardoor de promptgrootte afneemt. Heartbeat-runs en retries na Compaction bouwen de context nog steeds opnieuw op.
- `"never"`: schakel workspace-bootstrap en injectie van contextbestanden bij elke beurt uit. Gebruik dit alleen voor agenten die hun promptlevenscyclus volledig zelf beheren (aangepaste context-engines, native runtimes die hun eigen context bouwen, of gespecialiseerde workflows zonder bootstrap). Heartbeat- en Compaction-herstelbeurten slaan injectie ook over.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximaal aantal tekens per workspace-bootstrapbestand vóór afkapping. Standaard: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximaal totaal aantal tekens dat over alle workspace-bootstrapbestanden wordt geïnjecteerd. Standaard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bepaalt de agent-zichtbare melding in de systeemprompt wanneer bootstrapcontext wordt afgekapt.
Standaard: `"once"`.

- `"off"`: injecteer nooit meldingstekst over afkapping in de systeemprompt.
- `"once"`: injecteer één keer een beknopte melding per unieke afkappingshandtekening (aanbevolen).
- `"always"`: injecteer bij elke run een beknopte melding wanneer er afkapping is.

Gedetailleerde aantallen raw/geïnjecteerd en velden voor configuratieafstemming blijven in diagnostiek zoals context-/statusrapporten en logs; routinematige WebChat-gebruikers-/runtimecontext krijgt alleen de beknopte herstelmelding.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Eigendomskaart voor contextbudgetten

OpenClaw heeft meerdere prompt-/contextbudgetten met groot volume, en die zijn
bewust per subsysteem opgesplitst in plaats van allemaal via één generieke
knop te lopen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale workspace-bootstrapinjectie.
- `agents.defaults.startupContext.*`:
  eenmalige prelude voor reset-/opstartmodelruns, inclusief recente dagelijkse
  `memory/*.md`-bestanden. Kale chatopdrachten `/new` en `/reset` worden
  bevestigd zonder het model aan te roepen.
- `skills.limits.*`:
  de compacte Skills-lijst die in de systeemprompt wordt geïnjecteerd.
- `agents.defaults.contextLimits.*`:
  begrensde runtime-fragmenten en geïnjecteerde runtime-eigen blokken.
- `memory.qmd.limits.*`:
  snippet voor geïndexeerde memory-zoekopdrachten en injectiegrootte.

Gebruik de bijpassende override per agent alleen wanneer één agent een ander
budget nodig heeft:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Bepaalt de opstartprelude voor de eerste beurt die wordt geïnjecteerd bij reset-/opstartmodelruns.
Kale chatopdrachten `/new` en `/reset` bevestigen de reset zonder het model aan te roepen,
dus zij laden deze prelude niet.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Gedeelde standaarden voor begrensde runtime-contextoppervlakken.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: standaardlimiet voor `memory_get`-fragmenten voordat afkappingsmetadata en vervolgmailmelding worden toegevoegd.
- `memoryGetDefaultLines`: standaardregelvenster voor `memory_get` wanneer `lines` wordt weggelaten.
- `toolResultMaxChars`: limiet voor live toolresultaten die wordt gebruikt voor opgeslagen resultaten en overflow-herstel.
- `postCompactionMaxChars`: limiet voor AGENTS.md-fragmenten die wordt gebruikt tijdens refresh-injectie na Compaction.

#### `agents.list[].contextLimits`

Override per agent voor de gedeelde `contextLimits`-knoppen. Weggelaten velden erven
van `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globale limiet voor de compacte Skills-lijst die in de systeemprompt wordt geïnjecteerd. Dit
heeft geen invloed op het op aanvraag lezen van `SKILL.md`-bestanden.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Override per agent voor het Skills-promptbudget.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maximale pixelgrootte voor de langste zijde van afbeeldingen in transcript-/toolafbeeldingsblokken vóór provider-aanroepen.
Standaard: `1200`.

Lagere waarden verminderen doorgaans het gebruik van vision-tokens en de grootte van requestpayloads voor runs met veel screenshots.
Hogere waarden behouden meer visueel detail.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Tijdzone voor systeempromptcontext (niet voor berichttijdstempels). Valt terug op de tijdzone van de host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Tijdnotatie in systeemprompt. Standaard: `auto` (OS-voorkeur).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - De tekenreeksvorm stelt alleen het primaire model in.
  - De objectvorm stelt het primaire model plus geordende failovermodellen in.
- `imageModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt door het `image`-toolpad gebruikt als configuratie voor het vision-model.
  - Wordt ook gebruikt als fallback-routering wanneer het geselecteerde/standaardmodel geen afbeeldingsinvoer kan accepteren.
  - Geef de voorkeur aan expliciete `provider/model`-referenties. Kale ID's worden geaccepteerd voor compatibiliteit; als een kaal ID uniek overeenkomt met een geconfigureerde image-capable vermelding in `models.providers.*.models`, kwalificeert OpenClaw het naar die provider. Dubbelzinnige geconfigureerde overeenkomsten vereisen een expliciet providerprefix.
- `imageGenerationModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt gebruikt door de gedeelde mogelijkheid voor afbeeldingsgeneratie en elk toekomstig tool-/Plugin-oppervlak dat afbeeldingen genereert.
  - Typische waarden: `google/gemini-3.1-flash-image-preview` voor native Gemini-afbeeldingsgeneratie, `fal/fal-ai/flux/dev` voor fal, `openai/gpt-image-2` voor OpenAI Images, of `openai/gpt-image-1.5` voor OpenAI PNG-/WebP-uitvoer met transparante achtergrond.
  - Als je rechtstreeks een provider/model selecteert, configureer dan ook de bijpassende provider-authenticatie (bijvoorbeeld `GEMINI_API_KEY` of `GOOGLE_API_KEY` voor `google/*`, `OPENAI_API_KEY` of OpenAI Codex OAuth voor `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` voor `fal/*`).
  - Indien weggelaten kan `image_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider, daarna de resterende geregistreerde providers voor afbeeldingsgeneratie in provider-id-volgorde.
- `musicGenerationModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt gebruikt door de gedeelde mogelijkheid voor muziekgeneratie en de ingebouwde `music_generate`-tool.
  - Typische waarden: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, of `minimax/music-2.6`.
  - Indien weggelaten kan `music_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider, daarna de resterende geregistreerde providers voor muziekgeneratie in provider-id-volgorde.
  - Als je rechtstreeks een provider/model selecteert, configureer dan ook de bijpassende provider-authenticatie/API-sleutel.
- `videoGenerationModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt gebruikt door de gedeelde mogelijkheid voor videogeneratie en de ingebouwde `video_generate`-tool.
  - Typische waarden: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, of `qwen/wan2.7-r2v`.
  - Indien weggelaten kan `video_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider, daarna de resterende geregistreerde providers voor videogeneratie in provider-id-volgorde.
  - Als je rechtstreeks een provider/model selecteert, configureer dan ook de bijpassende provider-authenticatie/API-sleutel.
  - De meegeleverde Qwen-provider voor videogeneratie ondersteunt maximaal 1 uitvoervideo, 1 invoerafbeelding, 4 invoervideo's, 10 seconden duur, en provider-niveauopties `size`, `aspectRatio`, `resolution`, `audio` en `watermark`.
- `pdfModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt door de `pdf`-tool gebruikt voor modelroutering.
  - Indien weggelaten valt de PDF-tool terug op `imageModel`, daarna op het opgeloste sessie-/standaardmodel.
- `pdfMaxBytesMb`: standaardlimiet voor PDF-grootte voor de `pdf`-tool wanneer `maxBytesMb` niet wordt meegegeven tijdens de aanroep.
- `pdfMaxPages`: standaardmaximumaantal pagina's dat wordt meegenomen door de extractie-fallbackmodus in de `pdf`-tool.
- `verboseDefault`: standaard verbose-niveau voor agents. Waarden: `"off"`, `"on"`, `"full"`. Standaard: `"off"`.
- `toolProgressDetail`: detailmodus voor `/verbose`-toolsamenvattingen en toolregels voor voortgangsconcepten. Waarden: `"explain"` (standaard, compacte labels voor mensen) of `"raw"` (voeg onbewerkte opdracht/details toe wanneer beschikbaar). Per-agent `agents.list[].toolProgressDetail` overschrijft deze standaard.
- `reasoningDefault`: standaardzichtbaarheid van redenering voor agents. Waarden: `"off"`, `"on"`, `"stream"`. Per-agent `agents.list[].reasoningDefault` overschrijft deze standaard. Geconfigureerde redeneerstandaarden worden alleen toegepast voor eigenaren, geautoriseerde afzenders of operator-admin-Gateway-contexten wanneer er geen redeneeroverschrijving per bericht of sessie is ingesteld.
- `elevatedDefault`: standaardniveau voor verhoogde uitvoer voor agents. Waarden: `"off"`, `"on"`, `"ask"`, `"full"`. Standaard: `"on"`.
- `model.primary`: indeling `provider/model` (bijv. `openai/gpt-5.5` voor toegang met API-sleutel of `openai-codex/gpt-5.5` voor Codex OAuth). Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke geconfigureerde-provider-overeenkomst voor exact dat model-id, en valt pas daarna terug op de geconfigureerde standaardprovider (verouderd compatibiliteitsgedrag, dus geef de voorkeur aan expliciet `provider/model`). Als die provider het geconfigureerde standaardmodel niet langer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde provider/model in plaats van een verouderde standaard van een verwijderde provider te tonen.
- `models`: de geconfigureerde modelcatalogus en allowlist voor `/model`. Elke vermelding kan `alias` (snelkoppeling) en `params` bevatten (providerspecifiek, bijvoorbeeld `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Veilige bewerkingen: gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om vermeldingen toe te voegen. `config set` weigert vervangingen die bestaande allowlist-vermeldingen zouden verwijderen, tenzij je `--replace` meegeeft.
  - Provider-scoped configure-/onboardingstromen voegen geselecteerde providermodellen samen in deze map en behouden al geconfigureerde niet-gerelateerde providers.
  - Voor directe OpenAI Responses-modellen is server-side Compaction automatisch ingeschakeld. Gebruik `params.responsesServerCompaction: false` om te stoppen met het injecteren van `context_management`, of `params.responsesCompactThreshold` om de drempel te overschrijven. Zie [OpenAI server-side Compaction](/nl/providers/openai#server-side-compaction-responses-api).
- `params`: globale standaardproviderparameters die op alle modellen worden toegepast. Ingesteld op `agents.defaults.params` (bijv. `{ cacheRetention: "long" }`).
- Samenvoegingsprioriteit van `params` (configuratie): `agents.defaults.params` (globale basis) wordt overschreven door `agents.defaults.models["provider/model"].params` (per model), daarna overschrijft `agents.list[].params` (overeenkomend agent-id) per sleutel. Zie [Prompt Caching](/nl/reference/prompt-caching) voor details.
- `params.extra_body`/`params.extraBody`: geavanceerde pass-through-JSON die wordt samengevoegd in `api: "openai-completions"`-requestbody's voor OpenAI-compatibele proxy's. Als dit botst met gegenereerde requestsleutels, wint de extra body; niet-native completions-routes verwijderen daarna nog steeds OpenAI-only `store`.
- `params.chat_template_kwargs`: vLLM-/OpenAI-compatibele chat-template-argumenten die worden samengevoegd in top-level `api: "openai-completions"`-requestbody's. Voor `vllm/nemotron-3-*` met denken uit verzendt de meegeleverde vLLM-Plugin automatisch `enable_thinking: false` en `force_nonempty_content: true`; expliciete `chat_template_kwargs` overschrijven gegenereerde standaarden, en `extra_body.chat_template_kwargs` heeft nog steeds de uiteindelijke prioriteit. Voor vLLM Qwen-denkbesturingen stel je `params.qwenThinkingFormat` in op `"chat-template"` of `"top-level"` voor die modelvermelding.
- `compat.supportedReasoningEfforts`: OpenAI-compatibele lijst met redeneerinspanning per model. Neem `"xhigh"` op voor aangepaste endpoints die dit echt accepteren; OpenClaw toont dan `/think xhigh` in opdrachtmenu's, Gateway-sessierijen, validatie van sessiepatches, agent-CLI-validatie en `llm-task`-validatie voor die geconfigureerde provider/model. Gebruik `compat.reasoningEffortMap` wanneer de backend een providerspecifieke waarde verwacht voor een canoniek niveau.
- `params.preserveThinking`: Z.AI-only opt-in voor behouden denken. Wanneer ingeschakeld en denken aan staat, verzendt OpenClaw `thinking.clear_thinking: false` en speelt eerdere `reasoning_content` opnieuw af; zie [Z.AI-denken en behouden denken](/nl/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: standaard laag-niveau runtimebeleid voor agents. Weggelaten id gebruikt standaard OpenClaw Pi. Gebruik `id: "pi"` om het ingebouwde PI-harnas af te dwingen, `id: "auto"` om geregistreerde Plugin-harnassen ondersteunde modellen te laten claimen en PI te gebruiken wanneer geen overeenkomt, een geregistreerd harnas-id zoals `id: "codex"` om dat harnas te vereisen, of een ondersteunde CLI-backendalias zoals `id: "claude-cli"`. Expliciete Plugin-runtimes falen gesloten wanneer het harnas niet beschikbaar is of faalt. Houd modelreferenties canoniek als `provider/model`; selecteer Codex, Claude CLI, Gemini CLI en andere uitvoeringsbackends via runtimeconfiguratie in plaats van verouderde runtimeproviderprefixen. Zie [Agent-runtimes](/nl/concepts/agent-runtimes) voor hoe dit verschilt van provider/model-selectie.
- Configuratieschrijvers die deze velden wijzigen (bijvoorbeeld `/models set`, `/models set-image` en fallback-add/remove-opdrachten) slaan de canonieke objectvorm op en behouden bestaande fallbacklijsten waar mogelijk.
- `maxConcurrent`: maximaal aantal parallelle agentruns over sessies heen (elke sessie blijft geserialiseerd). Standaard: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` bepaalt welke laag-niveau executor agentbeurten uitvoert. De meeste
implementaties zouden de standaard OpenClaw Pi-runtime moeten behouden. Gebruik deze wanneer een vertrouwde
Plugin een native harnas levert, zoals het meegeleverde Codex app-server-harnas,
of wanneer je een ondersteunde CLI-backend zoals Claude CLI wilt. Voor het mentale
model, zie [Agent-runtimes](/nl/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, een geregistreerd Plugin-harnas-id, of een ondersteunde CLI-backendalias. De meegeleverde Codex-Plugin registreert `codex`; de meegeleverde Anthropic-Plugin biedt de `claude-cli` CLI-backend.
- `id: "auto"` laat geregistreerde Plugin-harnassen ondersteunde beurten claimen en gebruikt PI wanneer geen harnas overeenkomt. Een expliciete Plugin-runtime zoals `id: "codex"` vereist dat harnas en faalt gesloten als het niet beschikbaar is of faalt.
- Omgevingsoverschrijving: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` overschrijft `id` voor dat proces.
- Voor Codex-only implementaties stel je `model: "openai/gpt-5.5"` en `agentRuntime.id: "codex"` in.
- Voor Claude CLI-implementaties geef je de voorkeur aan `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Verouderde `claude-cli/claude-opus-4-7`-modelreferenties werken nog steeds voor compatibiliteit, maar nieuwe configuratie moet provider/model-selectie canoniek houden en de uitvoeringsbackend in `agentRuntime.id` plaatsen.
- Oudere runtimebeleidsleutels worden door `openclaw doctor --fix` herschreven naar `agentRuntime`.
- Harnaskieze wordt per sessie-id vastgezet na de eerste ingebedde run. Config-/env-wijzigingen beïnvloeden nieuwe of geresette sessies, niet een bestaand transcript. Verouderde sessies met transcriptgeschiedenis maar zonder geregistreerde pin worden behandeld als PI-vastgezet. `/status` rapporteert de effectieve runtime, bijvoorbeeld `Runtime: OpenClaw Pi Default` of `Runtime: OpenAI Codex`.
- Dit bestuurt alleen uitvoering van tekstagentbeurten. Mediageneratie, vision, PDF, muziek, video en TTS gebruiken nog steeds hun provider/model-instellingen.

**Ingebouwde aliasshorthands** (alleen van toepassing wanneer het model in `agents.defaults.models` staat):

| Alias               | Model                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` of `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Je geconfigureerde aliassen winnen altijd van standaarden.

Z.AI GLM-4.x-modellen schakelen automatisch de denkmodus in, tenzij je `--thinking off` instelt of `agents.defaults.models["zai/<model>"].params.thinking` zelf definieert.
Z.AI-modellen schakelen `tool_stream` standaard in voor het streamen van toolaanroepen. Stel `agents.defaults.models["zai/<model>"].params.tool_stream` in op `false` om dit uit te schakelen.
Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` denken wanneer er geen expliciet denkniveau is ingesteld.

### `agents.defaults.cliBackends`

Optionele CLI-backends voor tekst-only fallback-runs (geen toolaanroepen). Nuttig als back-up wanneer API-providers falen.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-backends zijn tekstgericht; tools zijn altijd uitgeschakeld.
- Sessies worden ondersteund wanneer `sessionArg` is ingesteld.
- Doorvoer van afbeeldingen wordt ondersteund wanneer `imageArg` bestandspaden accepteert.

### `agents.defaults.systemPromptOverride`

Vervang de volledige door OpenClaw samengestelde systeemprompt door een vaste tekenreeks. Stel dit in op standaardniveau (`agents.defaults.systemPromptOverride`) of per agent (`agents.list[].systemPromptOverride`). Waarden per agent hebben voorrang; een lege waarde of een waarde met alleen witruimte wordt genegeerd. Nuttig voor gecontroleerde prompt-experimenten.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Provider-onafhankelijke prompt-overlays toegepast per modelfamilie. Model-id's uit de GPT-5-familie krijgen het gedeelde gedragscontract over providers heen; `personality` beheert alleen de vriendelijke interactiestijllaag.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (standaard) en `"on"` schakelen de vriendelijke interactiestijllaag in.
- `"off"` schakelt alleen de vriendelijke laag uit; het getagde GPT-5-gedragscontract blijft ingeschakeld.
- Verouderde `plugins.entries.openai.config.personality` wordt nog steeds gelezen wanneer deze gedeelde instelling niet is ingesteld.

### `agents.defaults.heartbeat`

Periodieke Heartbeat-runs.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: duurtekenreeks (ms/s/m/h). Standaard: `30m` (API-key-authenticatie) of `1h` (OAuth-authenticatie). Stel in op `0m` om uit te schakelen.
- `includeSystemPromptSection`: wanneer false, laat de Heartbeat-sectie weg uit de systeemprompt en slaat injectie van `HEARTBEAT.md` in de bootstrapcontext over. Standaard: `true`.
- `suppressToolErrorWarnings`: wanneer true, onderdrukt toolfout-waarschuwingspayloads tijdens Heartbeat-runs.
- `timeoutSeconds`: maximale toegestane tijd in seconden voor een Heartbeat-agentbeurt voordat die wordt afgebroken. Laat oningesteld om `agents.defaults.timeoutSeconds` te gebruiken.
- `directPolicy`: afleverbeleid voor directe berichten/DM's. `allow` (standaard) staat aflevering aan een direct doel toe. `block` onderdrukt aflevering aan een direct doel en geeft `reason=dm-blocked` uit.
- `lightContext`: wanneer true, gebruiken Heartbeat-runs een lichte bootstrapcontext en behouden ze alleen `HEARTBEAT.md` uit de workspace-bootstrapbestanden.
- `isolatedSession`: wanneer true, draait elke Heartbeat in een nieuwe sessie zonder eerdere gespreksgeschiedenis. Hetzelfde isolatiepatroon als Cron `sessionTarget: "isolated"`. Verlaagt de tokenkosten per Heartbeat van ~100K naar ~2-5K tokens.
- `skipWhenBusy`: wanneer true, stellen Heartbeat-runs uit bij extra bezette banen: subagent- of genest commandowerk. Cron-banen stellen Heartbeats altijd uit, zelfs zonder deze vlag.
- Per agent: stel `agents.list[].heartbeat` in. Wanneer een agent `heartbeat` definieert, voeren **alleen die agents** Heartbeats uit.
- Heartbeats voeren volledige agentbeurten uit — kortere intervallen verbruiken meer tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` of `safeguard` (chunkgewijze samenvatting voor lange geschiedenissen). Zie [Compaction](/nl/concepts/compaction).
- `provider`: id van een geregistreerde Compaction-provider-Plugin. Wanneer ingesteld, wordt de `summarize()` van de provider aangeroepen in plaats van ingebouwde LLM-samenvatting. Valt terug op ingebouwd bij falen. Het instellen van een provider forceert `mode: "safeguard"`. Zie [Compaction](/nl/concepts/compaction).
- `timeoutSeconds`: maximaal aantal seconden dat is toegestaan voor één Compaction-bewerking voordat OpenClaw deze afbreekt. Standaard: `900`.
- `keepRecentTokens`: Pi-budget voor het knippunt om het meest recente transcriptstaartstuk letterlijk te behouden. Handmatige `/compact` respecteert dit wanneer het expliciet is ingesteld; anders is handmatige Compaction een hard controlepunt.
- `identifierPolicy`: `strict` (standaard), `off` of `custom`. `strict` voegt ingebouwde richtlijnen voor behoud van ondoorzichtige identificatoren toe vóór Compaction-samenvatting.
- `identifierInstructions`: optionele aangepaste tekst voor behoud van identificatoren die wordt gebruikt wanneer `identifierPolicy=custom`.
- `qualityGuard`: controles die opnieuw proberen bij misvormde uitvoer voor safeguard-samenvattingen. Standaard ingeschakeld in safeguard-modus; stel `enabled: false` in om de audit over te slaan.
- `midTurnPrecheck`: optionele Pi-tool-loop-drukcontrole. Wanneer `enabled: true`, controleert OpenClaw de contextdruk nadat toolresultaten zijn toegevoegd en vóór de volgende modelaanroep. Als de context niet meer past, wordt de huidige poging afgebroken voordat de prompt wordt ingediend en wordt het bestaande precheck-herstelpad hergebruikt om toolresultaten af te kappen of te compacten en opnieuw te proberen. Werkt met zowel `default`- als `safeguard`-Compaction-modi. Standaard: uitgeschakeld.
- `postCompactionSections`: optionele AGENTS.md H2/H3-sectienamen om opnieuw te injecteren na Compaction. Standaard `["Session Startup", "Red Lines"]`; stel `[]` in om herinjectie uit te schakelen. Wanneer oningesteld of expliciet ingesteld op dat standaardpaar, worden oudere koppen `Every Session`/`Safety` ook geaccepteerd als legacy fallback.
- `model`: optionele `provider/model-id`-override alleen voor Compaction-samenvatting. Gebruik dit wanneer de hoofdsessie één model moet behouden maar Compaction-samenvattingen op een ander model moeten draaien; wanneer oningesteld, gebruikt Compaction het primaire model van de sessie.
- `maxActiveTranscriptBytes`: optionele bytedrempel (`number` of tekenreeksen zoals `"20mb"`) die normale lokale Compaction activeert vóór een run wanneer de actieve JSONL boven de drempel groeit. Vereist `truncateAfterCompaction`, zodat succesvolle Compaction naar een kleiner opvolgend transcript kan roteren. Uitgeschakeld wanneer oningesteld of `0`.
- `notifyUser`: wanneer `true`, stuurt korte meldingen naar de gebruiker wanneer Compaction start en wanneer deze is voltooid (bijvoorbeeld "Context compacten..." en "Compaction voltooid"). Standaard uitgeschakeld om Compaction stil te houden.
- `memoryFlush`: stille agentische beurt vóór automatische Compaction om duurzame herinneringen op te slaan. Stel `model` in op een exacte provider/model zoals `ollama/qwen3:8b` wanneer deze onderhoudsbeurt op een lokaal model moet blijven; de override erft de fallback-keten van de actieve sessie niet. Wordt overgeslagen wanneer de workspace alleen-lezen is.

### `agents.defaults.contextPruning`

Snoeit **oude toolresultaten** uit de in-memory context voordat ze naar de LLM worden gestuurd. Wijzigt **niet** de sessiegeschiedenis op schijf.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="gedrag van cache-ttl-modus">

- `mode: "cache-ttl"` schakelt snoeipasses in.
- `ttl` bepaalt hoe vaak snoeien opnieuw kan worden uitgevoerd (na de laatste cache-aanraking).
- Snoeien kort eerst te grote toolresultaten zacht in en wist daarna, indien nodig, oudere toolresultaten hard.

**Zacht inkorten** behoudt begin + einde en voegt `...` in het midden in.

**Hard wissen** vervangt het volledige toolresultaat door de placeholder.

Opmerkingen:

- Afbeeldingsblokken worden nooit ingekort/gewist.
- Ratio's zijn gebaseerd op tekens (bij benadering), niet op exacte tokenaantallen.
- Als er minder dan `keepLastAssistants` assistant-berichten bestaan, wordt snoeien overgeslagen.

</Accordion>

Zie [Sessies snoeien](/nl/concepts/session-pruning) voor gedragsdetails.

### Blokstreaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Niet-Telegram-kanalen vereisen expliciet `*.blockStreaming: true` om blokantwoorden in te schakelen.
- Kanaaloverrides: `channels.<channel>.blockStreamingCoalesce` (en varianten per account). Signal/Slack/Discord/Google Chat gebruiken standaard `minChars: 1500`.
- `humanDelay`: willekeurige pauze tussen blokantwoorden. `natural` = 800-2500 ms. Override per agent: `agents.list[].humanDelay`.

Zie [Streaming](/nl/concepts/streaming) voor gedrag en chunkingdetails.

### Typindicatoren

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Standaarden: `instant` voor directe chats/vermeldingen, `message` voor groepschats zonder vermelding.
- Overrides per sessie: `session.typingMode`, `session.typingIntervalSeconds`.

Zie [Typindicatoren](/nl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionele sandboxing voor de ingebedde agent. Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige gids.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandboxdetails">

**Backend:**

- `docker`: lokale Docker-runtime (standaard)
- `ssh`: algemene remote runtime met SSH-backend
- `openshell`: OpenShell-runtime

Wanneer `backend: "openshell"` is geselecteerd, verplaatsen runtime-specifieke instellingen naar
`plugins.entries.openshell.config`.

**Configuratie van SSH-backend:**

- `target`: SSH-doel in de vorm `user@host[:port]`
- `command`: SSH-clientopdracht (standaard: `ssh`)
- `workspaceRoot`: absolute remote root die wordt gebruikt voor workspaces per scope
- `identityFile` / `certificateFile` / `knownHostsFile`: bestaande lokale bestanden die aan OpenSSH worden doorgegeven
- `identityData` / `certificateData` / `knownHostsData`: inline inhoud of SecretRefs die OpenClaw tijdens runtime omzet in tijdelijke bestanden
- `strictHostKeyChecking` / `updateHostKeys`: instellingen voor OpenSSH-hostsleutelbeleid

**Voorrang bij SSH-authenticatie:**

- `identityData` wint van `identityFile`
- `certificateData` wint van `certificateFile`
- `knownHostsData` wint van `knownHostsFile`
- Door SecretRef ondersteunde `*Data`-waarden worden opgelost vanuit de actieve secrets-runtime-snapshot voordat de sandboxsessie start

**Gedrag van SSH-backend:**

- seedt de remote workspace eenmalig na aanmaken of opnieuw aanmaken
- houdt daarna de remote SSH-workspace canoniek
- routeert `exec`, bestandstools en mediapaden via SSH
- synchroniseert remote wijzigingen niet automatisch terug naar de host
- ondersteunt geen sandbox-browsercontainers

**Workspacetoegang:**

- `none`: sandboxworkspace per scope onder `~/.openclaw/sandboxes`
- `ro`: sandboxworkspace op `/workspace`, agentworkspace read-only gemount op `/agent`
- `rw`: agentworkspace read/write gemount op `/workspace`

**Scope:**

- `session`: container + workspace per sessie
- `agent`: een container + workspace per agent (standaard)
- `shared`: gedeelde container en workspace (geen isolatie tussen sessies)

**OpenShell Plugin-configuratie:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell-modus:**

- `mirror`: seed remote vanuit lokaal vóór exec, synchroniseer terug na exec; lokale workspace blijft canoniek
- `remote`: seed remote eenmalig wanneer de sandbox wordt aangemaakt, houd daarna de remote workspace canoniek

In `remote`-modus worden host-lokale bewerkingen die buiten OpenClaw zijn gemaakt niet automatisch naar de sandbox gesynchroniseerd na de seedstap.
Transport is SSH naar de OpenShell-sandbox, maar de Plugin beheert de sandboxlevenscyclus en optionele mirrorsynchronisatie.

**`setupCommand`** wordt eenmaal uitgevoerd na het aanmaken van de container (via `sh -lc`). Vereist netwerkuitgang, schrijfbare root en rootgebruiker.

**Containers gebruiken standaard `network: "none"`** — stel dit in op `"bridge"` (of een aangepast bridge-netwerk) als de agent uitgaande toegang nodig heeft.
`"host"` is geblokkeerd. `"container:<id>"` is standaard geblokkeerd, tenzij je expliciet
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` instelt (break-glass).

**Inkomende bijlagen** worden klaargezet in `media/inbound/*` in de actieve workspace.

**`docker.binds`** mount extra hostdirectories; globale binds en binds per agent worden samengevoegd.

**Gesandboxte browser** (`sandbox.browser.enabled`): Chromium + CDP in een container. noVNC-URL wordt in de systeemprompt geïnjecteerd. Vereist geen `browser.enabled` in `openclaw.json`.
noVNC-observertoegang gebruikt standaard VNC-authenticatie en OpenClaw geeft een kortlevende token-URL uit (in plaats van het wachtwoord in de gedeelde URL bloot te leggen).

- `allowHostControl: false` (standaard) blokkeert gesandboxte sessies om de hostbrowser te targeten.
- `network` gebruikt standaard `openclaw-sandbox-browser` (dedicated bridge-netwerk). Stel dit alleen in op `bridge` wanneer je expliciet globale bridge-connectiviteit wilt.
- `cdpSourceRange` beperkt optioneel CDP-ingress aan de containerrand tot een CIDR-bereik (bijvoorbeeld `172.21.0.1/32`).
- `sandbox.browser.binds` mount extra hostdirectories alleen in de sandbox-browsercontainer. Wanneer ingesteld (inclusief `[]`), vervangt dit `docker.binds` voor de browsercontainer.
- Startstandaarden zijn gedefinieerd in `scripts/sandbox-browser-entrypoint.sh` en afgestemd op containerhosts:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (standaard ingeschakeld)
  - `--disable-3d-apis`, `--disable-software-rasterizer` en `--disable-gpu` zijn
    standaard ingeschakeld en kunnen worden uitgeschakeld met
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` als WebGL/3D-gebruik dit vereist.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` schakelt extensies opnieuw in als je workflow
    ervan afhankelijk is.
  - `--renderer-process-limit=2` kan worden gewijzigd met
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; stel `0` in om de
    standaard proceslimiet van Chromium te gebruiken.
  - plus `--no-sandbox` wanneer `noSandbox` is ingeschakeld.
  - Standaarden zijn de baseline van de containerimage; gebruik een aangepaste browserimage met een aangepast
    entrypoint om containerstandaarden te wijzigen.

</Accordion>

Browsersandboxing en `sandbox.docker.binds` zijn alleen voor Docker.

Build images (vanuit een source-checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Voor npm-installaties zonder source-checkout, zie [Sandboxing § Images en setup](/nl/gateway/sandboxing#images-and-setup) voor inline `docker build`-opdrachten.

### `agents.list` (overrides per agent)

Gebruik `agents.list[].tts` om een agent een eigen TTS-provider, stem, model,
stijl of automatische TTS-modus te geven. Het agentblok wordt diep samengevoegd over globale
`messages.tts`, zodat gedeelde credentials op één plek kunnen blijven terwijl individuele
agents alleen de stem- of providervelden overschrijven die ze nodig hebben. De override van de actieve agent
geldt voor automatische gesproken antwoorden, `/tts audio`, `/tts status` en
de agenttool `tts`. Zie [Tekst-naar-spraak](/nl/tools/tts#per-agent-voice-overrides)
voor providervoorbeelden en voorrang.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        agentRuntime: { id: "auto" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: stabiele agent-id (vereist).
- `default`: wanneer er meerdere zijn ingesteld, wint de eerste (waarschuwing wordt gelogd). Als er geen is ingesteld, is de eerste lijstvermelding de standaard.
- `model`: tekenreeksvorm stelt een strikte primaire waarde per agent in zonder model-fallback; objectvorm `{ primary }` is ook strikt tenzij je `fallbacks` toevoegt. Gebruik `{ primary, fallbacks: [...] }` om fallback voor die agent in te schakelen, of `{ primary, fallbacks: [] }` om strikt gedrag expliciet te maken. Cron-taken die alleen `primary` overschrijven, erven nog steeds standaardfallbacks tenzij je `fallbacks: []` instelt.
- `params`: streamparameters per agent die worden samengevoegd bovenop de geselecteerde modelvermelding in `agents.defaults.models`. Gebruik dit voor agentspecifieke overschrijvingen zoals `cacheRetention`, `temperature` of `maxTokens` zonder de volledige modelcatalogus te dupliceren.
- `tts`: optionele text-to-speech-overschrijvingen per agent. Het blok wordt diep samengevoegd bovenop `messages.tts`, dus bewaar gedeelde providerreferenties en fallbackbeleid in `messages.tts` en stel hier alleen personaspecifieke waarden in, zoals provider, stem, model, stijl of automatische modus.
- `skills`: optionele allowlist voor Skills per agent. Als dit wordt weggelaten, erft de agent `agents.defaults.skills` wanneer die is ingesteld; een expliciete lijst vervangt standaardwaarden in plaats van ermee samen te voegen, en `[]` betekent geen Skills.
- `thinkingDefault`: optioneel standaarddenkniveau per agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Overschrijft `agents.defaults.thinkingDefault` voor deze agent wanneer er geen overschrijving per bericht of sessie is ingesteld. Het geselecteerde provider-/modelprofiel bepaalt welke waarden geldig zijn; voor Google Gemini behoudt `adaptive` dynamisch denken dat door de provider wordt beheerd (`thinkingLevel` weggelaten op Gemini 3/3.1, `thinkingBudget: -1` op Gemini 2.5).
- `reasoningDefault`: optionele standaardzichtbaarheid voor redenering per agent (`on | off | stream`). Overschrijft `agents.defaults.reasoningDefault` voor deze agent wanneer er geen redeneringsoverschrijving per bericht of sessie is ingesteld.
- `fastModeDefault`: optionele standaardwaarde per agent voor snelle modus (`true | false`). Wordt toegepast wanneer er geen overschrijving per bericht of sessie voor snelle modus is ingesteld.
- `agentRuntime`: optionele laag-niveau runtimebeleid-overschrijving per agent. Gebruik `{ id: "codex" }` om één agent alleen Codex te laten gebruiken terwijl andere agents de standaard PI-fallback in `auto`-modus behouden.
- `runtime`: optionele runtimebeschrijving per agent. Gebruik `type: "acp"` met `runtime.acp`-standaardwaarden (`agent`, `backend`, `mode`, `cwd`) wanneer de agent standaard ACP-harness-sessies moet gebruiken.
- `identity.avatar`: werkruimte-relatief pad, `http(s)`-URL of `data:`-URI.
- `identity` leidt standaardwaarden af: `ackReaction` uit `emoji`, `mentionPatterns` uit `name`/`emoji`.
- `subagents.allowAgents`: allowlist van agent-id's voor expliciete `sessions_spawn.agentId`-doelen (`["*"]` = willekeurig; standaard: alleen dezelfde agent). Neem de requester-id op wanneer zelfgerichte `agentId`-aanroepen toegestaan moeten zijn.
- Sandbox-overervingsguard: als de requester-sessie in een sandbox draait, weigert `sessions_spawn` doelen die zonder sandbox zouden worden uitgevoerd.
- `subagents.requireAgentId`: wanneer true, blokkeert dit `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af; standaard: false).

---

## Multi-agent-routering

Voer meerdere geïsoleerde agents uit binnen één Gateway. Zie [Multi-Agent](/nl/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Velden voor bindingmatches

- `type` (optioneel): `route` voor normale routering (ontbrekend type gebruikt standaard route), `acp` voor persistente ACP-gespreksbindings.
- `match.channel` (vereist)
- `match.accountId` (optioneel; `*` = elk account; weggelaten = standaardaccount)
- `match.peer` (optioneel; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optioneel; kanaalspecifiek)
- `acp` (optioneel; alleen voor `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische matchvolgorde:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, geen peer/guild/team)
5. `match.accountId: "*"` (kanaalbreed)
6. Standaardagent

Binnen elke laag wint de eerste overeenkomende `bindings`-vermelding.

Voor `type: "acp"`-vermeldingen lost OpenClaw dit op via exacte gespreksidentiteit (`match.channel` + account + `match.peer.id`) en gebruikt het niet de laagvolgorde voor routebindings hierboven.

### Toegangsprofielen per agent

<Accordion title="Volledige toegang (geen sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Alleen-lezen tools + werkruimte">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Geen toegang tot het bestandssysteem (alleen berichten)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor details over prioriteit.

---

## Sessie

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details van sessievelden">

- **`scope`**: basisstrategie voor sessiegroepering in groepschatcontexten.
  - `per-sender` (standaard): elke afzender krijgt een geïsoleerde sessie binnen een kanaalcontext.
  - `global`: alle deelnemers in een kanaalcontext delen één sessie (alleen gebruiken wanneer gedeelde context bedoeld is).
- **`dmScope`**: hoe DM's worden gegroepeerd.
  - `main`: alle DM's delen de hoofdsessie.
  - `per-peer`: isoleren op afzender-id over kanalen heen.
  - `per-channel-peer`: isoleren per kanaal + afzender (aanbevolen voor inboxen met meerdere gebruikers).
  - `per-account-channel-peer`: isoleren per account + kanaal + afzender (aanbevolen voor meerdere accounts).
- **`identityLinks`**: koppel canonieke id's aan peers met providerprefix voor sessiedeling over kanalen heen. Dock-opdrachten zoals `/dock_discord` gebruiken dezelfde map om de antwoordroute van de actieve sessie naar een andere gekoppelde kanaalpeer te schakelen; zie [Kanaaldocking](/nl/concepts/channel-docking).
- **`reset`**: primair resetbeleid. `daily` reset om `atHour` lokale tijd; `idle` reset na `idleMinutes`. Wanneer beide zijn geconfigureerd, wint degene die het eerst verloopt. De versheid van dagelijkse resets gebruikt `sessionStartedAt` van de sessierij; de versheid van idle-resets gebruikt `lastInteractionAt`. Schrijfacties van achtergrond-/systeemgebeurtenissen zoals Heartbeat, Cron-wake-ups, exec-meldingen en Gateway-boekhouding kunnen `updatedAt` bijwerken, maar ze houden dagelijkse/idle-sessies niet vers.
- **`resetByType`**: overschrijvingen per type (`direct`, `group`, `thread`). Legacy `dm` wordt geaccepteerd als alias voor `direct`.
- **`mainKey`**: legacy veld. Runtime gebruikt altijd `"main"` voor de hoofd-bucket voor directe chats.
- **`agentToAgent.maxPingPongTurns`**: maximaal aantal terug-antwoordbeurten tussen agenten tijdens agent-naar-agent-uitwisselingen (integer, bereik: `0`-`5`). `0` schakelt pingpong-koppeling uit.
- **`sendPolicy`**: match op `channel`, `chatType` (`direct|group|channel`, met legacy alias `dm`), `keyPrefix` of `rawKeyPrefix`. De eerste deny wint.
- **`maintenance`**: opschonings- en retentie-instellingen voor de sessiestore.
  - `mode`: `warn` geeft alleen waarschuwingen; `enforce` past opschoning toe.
  - `pruneAfter`: leeftijdsgrens voor verouderde items (standaard `30d`).
  - `maxEntries`: maximaal aantal items in `sessions.json` (standaard `500`). Runtime schrijft batchopschoning met een kleine high-water-buffer voor productieachtige limieten; `openclaw sessions cleanup --enforce` past de limiet direct toe.
  - `rotateBytes`: verouderd en genegeerd; `openclaw doctor --fix` verwijdert dit uit oudere configuraties.
  - `resetArchiveRetention`: retentie voor `*.reset.<timestamp>`-transcriptarchieven. Standaard gelijk aan `pruneAfter`; stel in op `false` om uit te schakelen.
  - `maxDiskBytes`: optioneel schijfbudget voor de sessiedirectory. In `warn`-modus logt dit waarschuwingen; in `enforce`-modus verwijdert dit eerst de oudste artefacten/sessies.
  - `highWaterBytes`: optioneel doel na budgetopschoning. Standaard `80%` van `maxDiskBytes`.
- **`threadBindings`**: globale standaarden voor threadgebonden sessiefuncties.
  - `enabled`: algemene standaardschakelaar (providers kunnen dit overschrijven; Discord gebruikt `channels.discord.threadBindings.enabled`)
  - `idleHours`: standaard automatisch ontfocussen bij inactiviteit in uren (`0` schakelt uit; providers kunnen dit overschrijven)
  - `maxAgeHours`: standaard harde maximumleeftijd in uren (`0` schakelt uit; providers kunnen dit overschrijven)
  - `spawnSessions`: standaardgate voor het maken van threadgebonden werksessies vanuit `sessions_spawn` en ACP-threadspawns. Standaard `true` wanneer threadbindings zijn ingeschakeld; providers/accounts kunnen dit overschrijven.
  - `defaultSpawnContext`: standaard native subagentcontext voor threadgebonden spawns (`"fork"` of `"isolated"`). Standaard `"fork"`.

</Accordion>

---

## Berichten

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Antwoordprefix

Overschrijvingen per kanaal/account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolutie (meest specifieke wint): account → kanaal → globaal. `""` schakelt uit en stopt de cascade. `"auto"` leidt af van `[{identity.name}]`.

**Sjabloonvariabelen:**

| Variabele         | Beschrijving              | Voorbeeld                   |
| ----------------- | ------------------------- | --------------------------- |
| `{model}`         | Korte modelnaam           | `claude-opus-4-6`           |
| `{modelFull}`     | Volledige model-id        | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providernaam              | `anthropic`                 |
| `{thinkingLevel}` | Huidig denkniveau         | `high`, `low`, `off`        |
| `{identity.name}` | Naam van agentidentiteit  | (hetzelfde als `"auto"`)    |

Variabelen zijn niet hoofdlettergevoelig. `{think}` is een alias voor `{thinkingLevel}`.

### Ack-reactie

- Standaard ingesteld op `identity.emoji` van de actieve agent, anders `"👀"`. Stel in op `""` om uit te schakelen.
- Overschrijvingen per kanaal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Resolutievolgorde: account → kanaal → `messages.ackReaction` → terugval op identiteit.
- Bereik: `group-mentions` (standaard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: verwijdert de ack na een antwoord op kanalen met reactieondersteuning, zoals Slack, Discord, Telegram, WhatsApp en BlueBubbles.
- `messages.statusReactions.enabled`: schakelt levenscyclusstatusreacties in op Slack, Discord en Telegram.
  Op Slack en Discord blijven statusreacties ingeschakeld wanneer ack-reacties actief zijn als dit niet is ingesteld.
  Op Telegram moet je dit expliciet instellen op `true` om levenscyclusstatusreacties in te schakelen.

### Inkomende debounce

Bundelt snelle tekst-only berichten van dezelfde afzender in een enkele agentbeurt. Media/bijlagen worden direct doorgestuurd. Besturingsopdrachten omzeilen debouncing.

### TTS (tekst-naar-spraak)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` beheert de standaard automatische TTS-modus: `off`, `always`, `inbound` of `tagged`. `/tts on|off` kan lokale voorkeuren overschrijven, en `/tts status` toont de effectieve status.
- `summaryModel` overschrijft `agents.defaults.model.primary` voor automatische samenvatting.
- `modelOverrides` is standaard ingeschakeld; `modelOverrides.allowProvider` is standaard `false` (opt-in).
- API-sleutels vallen terug op `ELEVENLABS_API_KEY`/`XI_API_KEY` en `OPENAI_API_KEY`.
- Meegeleverde spraakproviders zijn eigendom van de Plugin. Als `plugins.allow` is ingesteld, neem dan elke TTS-provider-Plugin op die je wilt gebruiken, bijvoorbeeld `microsoft` voor Edge TTS. De verouderde provider-id `edge` wordt geaccepteerd als alias voor `microsoft`.
- `providers.openai.baseUrl` overschrijft het OpenAI TTS-eindpunt. De resolutievolgorde is configuratie, daarna `OPENAI_TTS_BASE_URL`, daarna `https://api.openai.com/v1`.
- Wanneer `providers.openai.baseUrl` naar een niet-OpenAI-eindpunt wijst, behandelt OpenClaw dit als een OpenAI-compatibele TTS-server en versoepelt het model-/spraakvalidatie.

---

## Talk

Standaardinstellingen voor Talk-modus (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` moet overeenkomen met een sleutel in `talk.providers` wanneer meerdere Talk-providers zijn geconfigureerd.
- Verouderde platte Talk-sleutels (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) zijn alleen voor compatibiliteit en worden automatisch gemigreerd naar `talk.providers.<provider>`.
- Spraak-ID's vallen terug op `ELEVENLABS_VOICE_ID` of `SAG_VOICE_ID`.
- `providers.*.apiKey` accepteert platte-tekststrings of SecretRef-objecten.
- De terugval op `ELEVENLABS_API_KEY` is alleen van toepassing wanneer er geen Talk-API-sleutel is geconfigureerd.
- Met `providers.*.voiceAliases` kunnen Talk-instructies vriendelijke namen gebruiken.
- `providers.mlx.modelId` selecteert de Hugging Face-repo die wordt gebruikt door de macOS lokale MLX-helper. Als dit wordt weggelaten, gebruikt macOS `mlx-community/Soprano-80M-bf16`.
- macOS MLX-weergave loopt via de meegeleverde `openclaw-mlx-tts`-helper wanneer aanwezig, of via een uitvoerbaar bestand op `PATH`; `OPENCLAW_MLX_TTS_BIN` overschrijft het helperpad voor ontwikkeling.
- `speechLocale` stelt de BCP 47 locale-id in die wordt gebruikt door iOS/macOS Talk-spraakherkenning. Laat dit niet ingesteld om de standaardwaarde van het apparaat te gebruiken.
- `silenceTimeoutMs` bepaalt hoe lang Talk-modus wacht na stilte van de gebruiker voordat het transcript wordt verzonden. Niet ingesteld behoudt het standaard pauzevenster van het platform (`700 ms op macOS en Android, 900 ms op iOS`).

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — alle andere configuratiesleutels
- [Configuratie](/nl/gateway/configuration) — algemene taken en snelle installatie
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)

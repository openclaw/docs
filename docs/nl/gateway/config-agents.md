---
read_when:
    - Standaardinstellingen voor agents afstemmen (modellen, denken, werkruimte, Heartbeat, media, Skills)
    - Routering en bindingen voor meerdere agenten configureren
    - Sessies, berichtbezorging en gedrag in gespreksmodus aanpassen
summary: Standaardinstellingen voor agents, multi-agentroutering, sessie, berichten en talk-configuratie
title: Configuratie — agenten
x-i18n:
    generated_at: "2026-05-07T13:17:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

Agentgebonden configuratiesleutels onder `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` en `talk.*`. Zie voor kanalen, tools, Gateway-runtime en andere
sleutels op het hoogste niveau de [Configuratiereferentie](/nl/gateway/configuration-reference).

## Agent-standaardwaarden

### `agents.defaults.workspace`

Standaard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionele repository-root die wordt weergegeven in de Runtime-regel van de systeemprompt. Als dit niet is ingesteld, detecteert OpenClaw dit automatisch door vanaf de werkruimte omhoog te lopen.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionele standaard-allowlist voor Skills voor agents die
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
- Laat `agents.list[].skills` weg om de standaardwaarden te erven.
- Stel `agents.list[].skills: []` in voor geen Skills.
- Een niet-lege lijst `agents.list[].skills` is de definitieve set voor die agent; deze
  wordt niet samengevoegd met standaardwaarden.

### `agents.defaults.skipBootstrap`

Schakelt het automatisch aanmaken van bootstrapbestanden voor de werkruimte uit (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Slaat het aanmaken van geselecteerde optionele werkruimtebestanden over, terwijl vereiste bootstrapbestanden nog steeds worden geschreven. Geldige waarden: `SOUL.md`, `USER.md`, `HEARTBEAT.md` en `IDENTITY.md`.

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

Bepaalt wanneer bootstrapbestanden van de werkruimte in de systeemprompt worden geïnjecteerd. Standaard: `"always"`.

- `"continuation-skip"`: veilige vervolgbeurten (na een voltooide assistentrespons) slaan herinjectie van werkruimte-bootstrap over, waardoor de promptgrootte kleiner wordt. Heartbeat-runs en nieuwe pogingen na Compaction bouwen de context nog steeds opnieuw op.
- `"never"`: schakel bootstrap van de werkruimte en injectie van contextbestanden bij elke beurt uit. Gebruik dit alleen voor agents die hun promptlevenscyclus volledig zelf beheren (aangepaste contextengines, native runtimes die hun eigen context bouwen, of gespecialiseerde workflows zonder bootstrap). Heartbeat- en Compaction-herstelbeurten slaan injectie ook over.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximaal aantal tekens per bootstrapbestand van de werkruimte vóór afkapping. Standaard: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximaal totaal aantal tekens dat over alle bootstrapbestanden van de werkruimte wordt geïnjecteerd. Standaard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bepaalt de voor de agent zichtbare melding in de systeemprompt wanneer bootstrapcontext wordt afgekapt.
Standaard: `"once"`.

- `"off"`: injecteer nooit meldingstekst over afkapping in de systeemprompt.
- `"once"`: injecteer eenmaal per unieke afkappingssignatuur een beknopte melding (aanbevolen).
- `"always"`: injecteer bij elke run een beknopte melding wanneer er afkapping is.

Gedetailleerde ruwe/geïnjecteerde aantallen en configuratievelden voor afstemming blijven in diagnostiek zoals context-/statusrapporten en logs; routinematige WebChat-gebruikers-/runtimecontext krijgt alleen de beknopte herstelmelding.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Eigendomskaart voor contextbudget

OpenClaw heeft meerdere prompt-/contextbudgetten met hoog volume, en deze worden
bewust per subsysteem gescheiden in plaats van allemaal via één generieke
knop te lopen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale injectie van werkruimte-bootstrap.
- `agents.defaults.startupContext.*`:
  eenmalige prelude voor modelruns bij reset/opstarten, inclusief recente dagelijkse
  `memory/*.md`-bestanden. Kale chatopdrachten `/new` en `/reset` worden
  bevestigd zonder het model aan te roepen.
- `skills.limits.*`:
  de compacte Skills-lijst die in de systeemprompt wordt geïnjecteerd.
- `agents.defaults.contextLimits.*`:
  begrensde runtimefragmenten en geïnjecteerde blokken die eigendom zijn van de runtime.
- `memory.qmd.limits.*`:
  fragmenten voor geïndexeerde geheugenzoekopdrachten en injectiegrootte.

Gebruik de overeenkomende overschrijving per agent alleen wanneer één agent een ander
budget nodig heeft:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Bepaalt de opstartprelude voor de eerste beurt die wordt geïnjecteerd bij modelruns voor reset/opstarten.
Kale chatopdrachten `/new` en `/reset` bevestigen de reset zonder het model
aan te roepen, dus ze laden deze prelude niet.

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

Gedeelde standaardwaarden voor begrensde runtimecontextoppervlakken.

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

- `memoryGetMaxChars`: standaardlimiet voor `memory_get`-fragmenten voordat afkappingsmetadata
  en vervolgmelding worden toegevoegd.
- `memoryGetDefaultLines`: standaardregelvenster voor `memory_get` wanneer `lines` wordt
  weggelaten.
- `toolResultMaxChars`: live limiet voor toolresultaten, gebruikt voor bewaarde resultaten en
  overloopherstel.
- `postCompactionMaxChars`: limiet voor AGENTS.md-fragmenten die wordt gebruikt tijdens verversingsinjectie
  na Compaction.

#### `agents.list[].contextLimits`

Overschrijving per agent voor de gedeelde `contextLimits`-knoppen. Weggelaten velden erven
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

Overschrijving per agent voor het Skills-promptbudget.

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

Maximale pixelgrootte voor de langste beeldzijde in transcript-/toolafbeeldingsblokken vóór provider-aanroepen.
Standaard: `1200`.

Lagere waarden verminderen meestal het gebruik van vision-tokens en de payloadgrootte van verzoeken voor runs met veel screenshots.
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

- `model`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - De stringvorm stelt alleen het primaire model in.
  - De objectvorm stelt het primaire model plus geordende failovermodellen in.
- `imageModel`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt door het `image`-toolpad gebruikt als configuratie voor het vision-model.
  - Wordt ook gebruikt als fallback-routering wanneer het geselecteerde/standaardmodel geen afbeeldingsinvoer kan accepteren.
  - Geef de voorkeur aan expliciete `provider/model`-refs. Kale ID's worden geaccepteerd voor compatibiliteit; als een kaal ID uniek overeenkomt met een geconfigureerde afbeeldingsgeschikte vermelding in `models.providers.*.models`, kwalificeert OpenClaw dit naar die provider. Ambigue geconfigureerde overeenkomsten vereisen een expliciet providerprefix.
- `imageGenerationModel`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt gebruikt door de gedeelde mogelijkheid voor afbeeldingsgeneratie en elk toekomstig tool-/Plugin-oppervlak dat afbeeldingen genereert.
  - Typische waarden: `google/gemini-3.1-flash-image-preview` voor native Gemini-afbeeldingsgeneratie, `fal/fal-ai/flux/dev` voor fal, `openai/gpt-image-2` voor OpenAI Images, of `openai/gpt-image-1.5` voor OpenAI PNG/WebP-uitvoer met transparante achtergrond.
  - Als je direct een provider/model selecteert, configureer dan ook de bijbehorende providerauthenticatie (bijvoorbeeld `GEMINI_API_KEY` of `GOOGLE_API_KEY` voor `google/*`, `OPENAI_API_KEY` of OpenAI Codex OAuth voor `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` voor `fal/*`).
  - Als dit wordt weggelaten, kan `image_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde afbeeldingsgeneratieproviders in provider-id-volgorde.
- `musicGenerationModel`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt gebruikt door de gedeelde mogelijkheid voor muziekgeneratie en de ingebouwde `music_generate`-tool.
  - Typische waarden: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, of `minimax/music-2.6`.
  - Als dit wordt weggelaten, kan `music_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde muziekgeneratieproviders in provider-id-volgorde.
  - Als je direct een provider/model selecteert, configureer dan ook de bijbehorende providerauthenticatie/API-sleutel.
- `videoGenerationModel`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt gebruikt door de gedeelde mogelijkheid voor videogeneratie en de ingebouwde `video_generate`-tool.
  - Typische waarden: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, of `qwen/wan2.7-r2v`.
  - Als dit wordt weggelaten, kan `video_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde videogeneratieproviders in provider-id-volgorde.
  - Als je direct een provider/model selecteert, configureer dan ook de bijbehorende providerauthenticatie/API-sleutel.
  - De gebundelde Qwen-videogeneratieprovider ondersteunt maximaal 1 uitvoervideo, 1 invoerafbeelding, 4 invoervideo's, een duur van 10 seconden, en provider-niveauopties `size`, `aspectRatio`, `resolution`, `audio` en `watermark`.
- `pdfModel`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt door de `pdf`-tool gebruikt voor modelroutering.
  - Als dit wordt weggelaten, valt de PDF-tool terug op `imageModel` en daarna op het opgeloste sessie-/standaardmodel.
- `pdfMaxBytesMb`: standaardgroottelimiet voor PDF's voor de `pdf`-tool wanneer `maxBytesMb` niet bij aanroep wordt doorgegeven.
- `pdfMaxPages`: standaard maximumaantal pagina's dat wordt meegenomen door de extractie-fallbackmodus in de `pdf`-tool.
- `verboseDefault`: standaard uitgebreidheidsniveau voor agents. Waarden: `"off"`, `"on"`, `"full"`. Standaard: `"off"`.
- `toolProgressDetail`: detailmodus voor `/verbose`-toolsamenvattingen en toolregels voor voortgangsconcepten. Waarden: `"explain"` (standaard, compacte menselijke labels) of `"raw"` (voeg ruwe opdracht/details toe wanneer beschikbaar). Per-agent `agents.list[].toolProgressDetail` overschrijft deze standaard.
- `reasoningDefault`: standaard zichtbaarheid van redenering voor agents. Waarden: `"off"`, `"on"`, `"stream"`. Per-agent `agents.list[].reasoningDefault` overschrijft deze standaard. Geconfigureerde redeneerstandaarden worden alleen toegepast voor eigenaren, geautoriseerde afzenders of operator-admin-Gateway-contexten wanneer er geen redeneeroverride per bericht of sessie is ingesteld.
- `elevatedDefault`: standaard niveau voor verhoogde uitvoer voor agents. Waarden: `"off"`, `"on"`, `"ask"`, `"full"`. Standaard: `"on"`.
- `model.primary`: formaat `provider/model` (bijv. `openai/gpt-5.5` voor OpenAI API-key of Codex OAuth-toegang). Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke geconfigureerde-provider-overeenkomst voor dat exacte model-id, en pas daarna valt het terug op de geconfigureerde standaardprovider (verouderd compatibiliteitsgedrag, dus geef de voorkeur aan expliciet `provider/model`). Als die provider het geconfigureerde standaardmodel niet langer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde provider/model in plaats van een verouderde verwijderde-provider-standaard te tonen.
- `models`: de geconfigureerde modelcatalogus en allowlist voor `/model`. Elke vermelding kan `alias` (snelkoppeling) en `params` bevatten (providerspecifiek, bijvoorbeeld `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Veilige bewerkingen: gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om vermeldingen toe te voegen. `config set` weigert vervangingen die bestaande allowlist-vermeldingen zouden verwijderen, tenzij je `--replace` doorgeeft.
  - Provider-gescopeerde configuratie-/onboardingflows voegen geselecteerde providermodellen samen in deze map en behouden niet-gerelateerde providers die al zijn geconfigureerd.
  - Voor directe OpenAI Responses-modellen wordt server-side Compaction automatisch ingeschakeld. Gebruik `params.responsesServerCompaction: false` om het injecteren van `context_management` te stoppen, of `params.responsesCompactThreshold` om de drempel te overschrijven. Zie [OpenAI server-side compaction](/nl/providers/openai#server-side-compaction-responses-api).
- `params`: globale standaardproviderparameters die op alle modellen worden toegepast. Ingesteld op `agents.defaults.params` (bijv. `{ cacheRetention: "long" }`).
- Samenvoegprioriteit van `params` (configuratie): `agents.defaults.params` (globale basis) wordt overschreven door `agents.defaults.models["provider/model"].params` (per model), waarna `agents.list[].params` (overeenkomend agent-id) per sleutel overschrijft. Zie [Prompt Caching](/nl/reference/prompt-caching) voor details.
- `params.extra_body`/`params.extraBody`: geavanceerde pass-through-JSON die wordt samengevoegd in `api: "openai-completions"`-request bodies voor OpenAI-compatibele proxy's. Als dit botst met gegenereerde requestsleutels, wint de extra body; niet-native completions-routes verwijderen daarna nog steeds OpenAI-only `store`.
- `params.chat_template_kwargs`: vLLM/OpenAI-compatibele chat-templateargumenten die worden samengevoegd in top-level `api: "openai-completions"`-request bodies. Voor `vllm/nemotron-3-*` met denken uit stuurt de gebundelde vLLM-Plugin automatisch `enable_thinking: false` en `force_nonempty_content: true`; expliciete `chat_template_kwargs` overschrijven gegenereerde standaarden, en `extra_body.chat_template_kwargs` heeft nog steeds de uiteindelijke prioriteit. Voor vLLM Qwen-denkbesturingen stel je `params.qwenThinkingFormat` in op `"chat-template"` of `"top-level"` op die modelvermelding.
- `compat.supportedReasoningEfforts`: OpenAI-compatibele lijst met redeneerinspanning per model. Neem `"xhigh"` op voor aangepaste endpoints die dit echt accepteren; OpenClaw toont dan `/think xhigh` in opdrachtmenu's, Gateway-sessierijen, validatie van sessiepatches, validatie van agent-CLI en `llm-task`-validatie voor die geconfigureerde provider/model. Gebruik `compat.reasoningEffortMap` wanneer de backend een providerspecifieke waarde wil voor een canoniek niveau.
- `params.preserveThinking`: Z.AI-only opt-in voor bewaard denken. Wanneer ingeschakeld en denken aan staat, stuurt OpenClaw `thinking.clear_thinking: false` en speelt eerdere `reasoning_content` opnieuw af; zie [Z.AI thinking and preserved thinking](/nl/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: standaard laag-niveau agentruntimebeleid. Een weggelaten id gebruikt standaard OpenClaw Pi. Gebruik `id: "pi"` om de ingebouwde PI-harness te forceren, `id: "auto"` om geregistreerde Plugin-harnassen ondersteunde modellen te laten claimen en PI te gebruiken wanneer niets overeenkomt, een geregistreerd harness-id zoals `id: "codex"` om die harness te vereisen, of een ondersteunde CLI-backendalias zoals `id: "claude-cli"`. Expliciete Plugin-runtimes falen gesloten wanneer de harness niet beschikbaar is of faalt. Houd modelrefs canoniek als `provider/model`; selecteer Codex, Claude CLI, Gemini CLI en andere uitvoeringsbackends via runtimeconfiguratie in plaats van verouderde runtimeproviderprefixen. Zie [Agentruntimes](/nl/concepts/agent-runtimes) voor hoe dit verschilt van provider/model-selectie.
- Configuratieschrijvers die deze velden muteren (bijvoorbeeld `/models set`, `/models set-image` en opdrachten voor toevoegen/verwijderen van fallbacks) slaan de canonieke objectvorm op en behouden bestaande fallbacklijsten waar mogelijk.
- `maxConcurrent`: maximaal aantal parallelle agentruns over sessies heen (elke sessie blijft geserialiseerd). Standaard: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` bepaalt welke laag-niveau executor agentbeurten uitvoert. De meeste
deployments zouden de standaard OpenClaw Pi-runtime moeten behouden. Gebruik deze wanneer een vertrouwde
Plugin een native harness biedt, zoals de gebundelde Codex app-server-harness,
of wanneer je een ondersteunde CLI-backend zoals Claude CLI wilt. Voor het mentale
model, zie [Agentruntimes](/nl/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, een geregistreerd Plugin-harness-id, of een ondersteunde CLI-backendalias. De gebundelde Codex-Plugin registreert `codex`; de gebundelde Anthropic-Plugin biedt de `claude-cli` CLI-backend.
- `id: "auto"` laat geregistreerde Plugin-harnassen ondersteunde beurten claimen en gebruikt PI wanneer geen harness overeenkomt. Een expliciete Plugin-runtime zoals `id: "codex"` vereist die harness en faalt gesloten als deze niet beschikbaar is of faalt.
- Omgevingsoverride: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` overschrijft `id` voor dat proces.
- OpenAI-agentmodellen gebruiken standaard de Codex-harness; `agentRuntime.id: "codex"` blijft geldig wanneer je dat expliciet wilt maken.
- Voor Claude CLI-deployments geef je de voorkeur aan `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Verouderde `claude-cli/claude-opus-4-7`-modelrefs blijven werken voor compatibiliteit, maar nieuwe configuratie moet provider/model-selectie canoniek houden en de uitvoeringsbackend in `agentRuntime.id` plaatsen.
- Oudere runtimebeleidssleutels worden door `openclaw doctor --fix` herschreven naar `agentRuntime`.
- De harnesskeuze wordt per sessie-id vastgezet na de eerste ingesloten run. Configuratie-/env-wijzigingen zijn van invloed op nieuwe of geresette sessies, niet op een bestaand transcript. Verouderde OpenAI-sessies met transcriptgeschiedenis maar zonder vastgelegde pin gebruiken Codex; verouderde OpenAI PI-pins kunnen worden gerepareerd met `openclaw doctor --fix`. `/status` rapporteert de effectieve runtime, bijvoorbeeld `Runtime: OpenClaw Pi Default` of `Runtime: OpenAI Codex`.
- Dit beheert alleen de uitvoering van tekstagentbeurten. Mediageneratie, vision, PDF, muziek, video en TTS gebruiken nog steeds hun provider/model-instellingen.

**Ingebouwde aliasverkortingen** (alleen van toepassing wanneer het model in `agents.defaults.models` staat):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Je geconfigureerde aliassen hebben altijd voorrang op standaarden.

Z.AI GLM-4.x-modellen schakelen automatisch de denkmodus in, tenzij je `--thinking off` instelt of zelf `agents.defaults.models["zai/<model>"].params.thinking` definieert.
Z.AI-modellen schakelen standaard `tool_stream` in voor streaming van toolaanroepen. Stel `agents.defaults.models["zai/<model>"].params.tool_stream` in op `false` om dit uit te schakelen.
Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` denken wanneer er geen expliciet denkniveau is ingesteld.

### `agents.defaults.cliBackends`

Optionele CLI-backends voor tekstuele fallback-runs (geen toolaanroepen). Handig als back-up wanneer API-providers falen.

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

Vervang de volledige door OpenClaw samengestelde systeemprompt door een vaste tekenreeks. Stel dit in op standaardniveau (`agents.defaults.systemPromptOverride`) of per agent (`agents.list[].systemPromptOverride`). Waarden per agent hebben voorrang; een lege waarde of een waarde met alleen witruimte wordt genegeerd. Handig voor gecontroleerde prompt-experimenten.

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

Provider-onafhankelijke prompt-overlays toegepast per modelfamilie. GPT-5-familie model-id's krijgen het gedeelde gedragscontract over providers heen; `personality` regelt alleen de vriendelijke laag voor interactiestijl.

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

- `"friendly"` (standaard) en `"on"` schakelen de vriendelijke laag voor interactiestijl in.
- `"off"` schakelt alleen de vriendelijke laag uit; het getagde GPT-5-gedragscontract blijft ingeschakeld.
- Legacy `plugins.entries.openai.config.personality` wordt nog steeds gelezen wanneer deze gedeelde instelling niet is ingesteld.

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

- `every`: duurtekenreeks (ms/s/m/u). Standaard: `30m` (API-key-authenticatie) of `1h` (OAuth-authenticatie). Stel in op `0m` om uit te schakelen.
- `includeSystemPromptSection`: wanneer false, wordt de Heartbeat-sectie weggelaten uit de systeemprompt en wordt injectie van `HEARTBEAT.md` in de bootstrapcontext overgeslagen. Standaard: `true`.
- `suppressToolErrorWarnings`: wanneer true, worden waarschuwingspayloads voor toolfouten tijdens Heartbeat-runs onderdrukt.
- `timeoutSeconds`: maximale tijd in seconden die is toegestaan voor een Heartbeat-agentbeurt voordat deze wordt afgebroken. Laat niet ingesteld om `agents.defaults.timeoutSeconds` te gebruiken.
- `directPolicy`: beleid voor directe/DM-bezorging. `allow` (standaard) staat bezorging aan directe doelen toe. `block` onderdrukt bezorging aan directe doelen en geeft `reason=dm-blocked` uit.
- `lightContext`: wanneer true, gebruiken Heartbeat-runs een lichtgewicht bootstrapcontext en behouden ze alleen `HEARTBEAT.md` uit workspace-bootstrapbestanden.
- `isolatedSession`: wanneer true, draait elke Heartbeat in een nieuwe sessie zonder eerdere gespreksgeschiedenis. Hetzelfde isolatiepatroon als Cron `sessionTarget: "isolated"`. Verlaagt de tokenkosten per Heartbeat van ongeveer 100K naar ongeveer 2-5K tokens.
- `skipWhenBusy`: wanneer true, stellen Heartbeat-runs uit bij extra bezette banen: subagent- of genest commandowerk. Cron-banen stellen Heartbeats altijd uit, zelfs zonder deze vlag.
- Per agent: stel `agents.list[].heartbeat` in. Wanneer een agent `heartbeat` definieert, draaien **alleen die agents** Heartbeats.
- Heartbeats draaien volledige agentbeurten — kortere intervallen verbruiken meer tokens.

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

- `mode`: `default` of `safeguard` (samenvatten in chunks voor lange geschiedenissen). Zie [Compaction](/nl/concepts/compaction).
- `provider`: id van een geregistreerde Compaction-provider-Plugin. Wanneer ingesteld, wordt de `summarize()` van de provider aangeroepen in plaats van de ingebouwde LLM-samenvatting. Valt terug op ingebouwd bij falen. Het instellen van een provider forceert `mode: "safeguard"`. Zie [Compaction](/nl/concepts/compaction).
- `timeoutSeconds`: maximaal aantal seconden toegestaan voor een enkele Compaction-bewerking voordat OpenClaw deze afbreekt. Standaard: `900`.
- `keepRecentTokens`: Pi-knippuntbudget om de meest recente transcriptstaart letterlijk te behouden. Handmatige `/compact` respecteert dit wanneer het expliciet is ingesteld; anders is handmatige Compaction een hard checkpoint.
- `identifierPolicy`: `strict` (standaard), `off` of `custom`. `strict` voegt ingebouwde richtlijnen voor behoud van ondoorzichtige identificatoren vooraf toe tijdens Compaction-samenvatting.
- `identifierInstructions`: optionele aangepaste tekst voor identifierbehoud die wordt gebruikt wanneer `identifierPolicy=custom`.
- `qualityGuard`: controles voor opnieuw proberen bij misvormde uitvoer voor safeguard-samenvattingen. Standaard ingeschakeld in safeguard-modus; stel `enabled: false` in om de audit over te slaan.
- `midTurnPrecheck`: optionele Pi tool-loop-drukcontrole. Wanneer `enabled: true`, controleert OpenClaw de contextdruk nadat toolresultaten zijn toegevoegd en vóór de volgende modelaanroep. Als de context niet meer past, wordt de huidige poging afgebroken voordat de prompt wordt ingediend en wordt het bestaande herstelpad voor prechecks hergebruikt om toolresultaten in te korten of te compacten en opnieuw te proberen. Werkt met zowel `default`- als `safeguard`-Compaction-modi. Standaard: uitgeschakeld.
- `postCompactionSections`: optionele AGENTS.md H2/H3-sectienamen om na Compaction opnieuw te injecteren. Standaard `["Session Startup", "Red Lines"]`; stel `[]` in om herinjectie uit te schakelen. Wanneer niet ingesteld of expliciet ingesteld op dat standaardpaar, worden oudere koppen `Every Session`/`Safety` ook geaccepteerd als legacy fallback.
- `model`: optionele `provider/model-id`-override alleen voor Compaction-samenvatting. Gebruik dit wanneer de hoofdsessie één model moet behouden maar Compaction-samenvattingen op een ander model moeten draaien; wanneer niet ingesteld, gebruikt Compaction het primaire model van de sessie.
- `maxActiveTranscriptBytes`: optionele byte-drempel (`number` of tekenreeksen zoals `"20mb"`) die normale lokale Compaction vóór een run triggert wanneer de actieve JSONL boven de drempel groeit. Vereist `truncateAfterCompaction` zodat geslaagde Compaction kan roteren naar een kleiner opvolgend transcript. Uitgeschakeld wanneer niet ingesteld of `0`.
- `notifyUser`: wanneer `true`, worden korte meldingen naar de gebruiker gestuurd wanneer Compaction start en wanneer deze is voltooid (bijvoorbeeld "Context compacten..." en "Compaction voltooid"). Standaard uitgeschakeld om Compaction stil te houden.
- `memoryFlush`: stille agentische beurt vóór automatische Compaction om duurzame herinneringen op te slaan. Stel `model` in op een exacte provider/model, zoals `ollama/qwen3:8b`, wanneer deze huishoudelijke beurt op een lokaal model moet blijven; de override erft de actieve fallback-keten van de sessie niet. Overgeslagen wanneer de workspace alleen-lezen is.

### `agents.defaults.contextPruning`

Snoeit **oude toolresultaten** uit de in-memory context voordat deze naar de LLM wordt gestuurd. Wijzigt de sessiegeschiedenis op schijf **niet**.

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

<Accordion title="Gedrag van cache-ttl-modus">

- `mode: "cache-ttl"` schakelt snoeipasses in.
- `ttl` bepaalt hoe vaak snoeien opnieuw kan draaien (na de laatste cache-aanraking).
- Snoeien voert eerst soft-trim uit op te grote toolresultaten en wist daarna, indien nodig, oudere toolresultaten hard.

**Soft-trim** behoudt begin + einde en voegt `...` in het midden in.

**Hard-clear** vervangt het volledige toolresultaat door de placeholder.

Opmerkingen:

- Afbeeldingsblokken worden nooit ingekort/gewist.
- Verhoudingen zijn gebaseerd op tekens (bij benadering), niet op exacte tokenaantallen.
- Als er minder dan `keepLastAssistants` assistant-berichten bestaan, wordt snoeien overgeslagen.

</Accordion>

Zie [Sessiesnoei](/nl/concepts/session-pruning) voor gedragsdetails.

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
- `humanDelay`: gerandomiseerde pauze tussen blokantwoorden. `natural` = 800-2500 ms. Override per agent: `agents.list[].humanDelay`.

Zie [Streaming](/nl/concepts/streaming) voor gedrag + details over chunks.

### Type-indicatoren

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

- Standaardwaarden: `instant` voor directe chats/vermeldingen, `message` voor niet-vermelde groepschats.
- Overrides per sessie: `session.typingMode`, `session.typingIntervalSeconds`.

Zie [Typindicatoren](/nl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionele sandboxing voor de ingebedde agent. Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige handleiding.

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

<Accordion title="Sandbox details">

**Backend:**

- `docker`: lokale Docker-runtime (standaard)
- `ssh`: generieke externe runtime ondersteund door SSH
- `openshell`: OpenShell-runtime

Wanneer `backend: "openshell"` is geselecteerd, verplaatsen runtime-specifieke instellingen naar
`plugins.entries.openshell.config`.

**SSH-backendconfiguratie:**

- `target`: SSH-doel in de vorm `user@host[:port]`
- `command`: SSH-clientopdracht (standaard: `ssh`)
- `workspaceRoot`: absolute externe root die wordt gebruikt voor werkruimten per bereik
- `identityFile` / `certificateFile` / `knownHostsFile`: bestaande lokale bestanden die aan OpenSSH worden doorgegeven
- `identityData` / `certificateData` / `knownHostsData`: inline-inhoud of SecretRefs die OpenClaw tijdens runtime in tijdelijke bestanden materialiseert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-hostkeybeleidsknoppen

**SSH-authenticatievolgorde:**

- `identityData` wint van `identityFile`
- `certificateData` wint van `certificateFile`
- `knownHostsData` wint van `knownHostsFile`
- Door SecretRef ondersteunde `*Data`-waarden worden opgelost vanuit de actieve secrets-runtime-snapshot voordat de sandboxsessie start

**Gedrag van de SSH-backend:**

- seedt de externe werkruimte eenmalig na aanmaken of opnieuw aanmaken
- houdt daarna de externe SSH-werkruimte canoniek
- routeert `exec`, bestandstools en mediapaden via SSH
- synchroniseert externe wijzigingen niet automatisch terug naar de host
- ondersteunt geen sandboxbrowsercontainers

**Werkruimtetoegang:**

- `none`: sandboxwerkruimte per bereik onder `~/.openclaw/sandboxes`
- `ro`: sandboxwerkruimte op `/workspace`, agentwerkruimte alleen-lezen gemount op `/agent`
- `rw`: agentwerkruimte lezen/schrijven gemount op `/workspace`

**Bereik:**

- `session`: container + werkruimte per sessie
- `agent`: één container + werkruimte per agent (standaard)
- `shared`: gedeelde container en werkruimte (geen isolatie tussen sessies)

**OpenShell-Plugin-configuratie:**

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

- `mirror`: seed extern vanaf lokaal vóór exec, synchroniseer terug na exec; lokale werkruimte blijft canoniek
- `remote`: seed extern één keer wanneer de sandbox wordt aangemaakt, houd daarna de externe werkruimte canoniek

In de modus `remote` worden host-lokale bewerkingen die buiten OpenClaw zijn gemaakt niet automatisch naar de sandbox gesynchroniseerd na de seedstap.
Transport is SSH naar de OpenShell-sandbox, maar de Plugin beheert de sandboxlevenscyclus en optionele mirrorsynchronisatie.

**`setupCommand`** wordt één keer uitgevoerd na het aanmaken van de container (via `sh -lc`). Vereist netwerkuitgaand verkeer, beschrijfbare root en rootgebruiker.

**Containers gebruiken standaard `network: "none"`** — stel in op `"bridge"` (of een aangepast bridge-netwerk) als de agent uitgaande toegang nodig heeft.
`"host"` is geblokkeerd. `"container:<id>"` is standaard geblokkeerd, tenzij je expliciet
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` instelt (noodprocedure).

**Inkomende bijlagen** worden gestaged naar `media/inbound/*` in de actieve werkruimte.

**`docker.binds`** mount extra hostmappen; globale binds en binds per agent worden samengevoegd.

**Sandboxbrowser** (`sandbox.browser.enabled`): Chromium + CDP in een container. noVNC-URL wordt geïnjecteerd in de systeemprompt. Vereist geen `browser.enabled` in `openclaw.json`.
noVNC-observertoegang gebruikt standaard VNC-authenticatie en OpenClaw geeft een kortlevende token-URL uit (in plaats van het wachtwoord in de gedeelde URL bloot te stellen).

- `allowHostControl: false` (standaard) blokkeert sandboxsessies om de hostbrowser te targeten.
- `network` gebruikt standaard `openclaw-sandbox-browser` (toegewezen bridge-netwerk). Stel alleen in op `bridge` wanneer je expliciet globale bridge-connectiviteit wilt.
- `cdpSourceRange` beperkt optioneel CDP-ingress aan de containerrand tot een CIDR-bereik (bijvoorbeeld `172.21.0.1/32`).
- `sandbox.browser.binds` mount extra hostmappen alleen in de sandboxbrowsercontainer. Wanneer ingesteld (inclusief `[]`), vervangt het `docker.binds` voor de browsercontainer.
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
    standaardproceslimiet van Chromium te gebruiken.
  - plus `--no-sandbox` wanneer `noSandbox` is ingeschakeld.
  - Standaarden zijn de basislijn van de containerimage; gebruik een aangepaste browserimage met een aangepast
    entrypoint om containerstandaarden te wijzigen.

</Accordion>

Browsersandboxing en `sandbox.docker.binds` zijn alleen voor Docker.

Bouw images (vanuit een source-checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Voor npm-installaties zonder source-checkout, zie [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup) voor inline `docker build`-opdrachten.

### `agents.list` (overrides per agent)

Gebruik `agents.list[].tts` om een agent een eigen TTS-provider, stem, model,
stijl of automatische TTS-modus te geven. Het agentblok deep-merget over globale
`messages.tts`, zodat gedeelde referenties op één plek kunnen blijven terwijl individuele
agents alleen de stem- of providervelden overschrijven die ze nodig hebben. De override van de actieve agent
geldt voor automatische gesproken antwoorden, `/tts audio`, `/tts status` en
de agenttool `tts`. Zie [Tekst-naar-spraak](/nl/tools/tts#per-agent-voice-overrides)
voor providervoorbeelden en volgorde.

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
- `default`: wanneer er meerdere zijn ingesteld, wint de eerste (waarschuwing gelogd). Als er geen is ingesteld, is het eerste item in de lijst de standaard.
- `model`: stringvorm stelt een strikte primaire per agent in zonder model-fallback; objectvorm `{ primary }` is ook strikt tenzij je `fallbacks` toevoegt. Gebruik `{ primary, fallbacks: [...] }` om die agent voor fallback te laten kiezen, of `{ primary, fallbacks: [] }` om strikt gedrag expliciet te maken. Cron-taken die alleen `primary` overschrijven, erven nog steeds standaard-fallbacks tenzij je `fallbacks: []` instelt.
- `params`: streamparameters per agent die worden samengevoegd over de geselecteerde modelvermelding in `agents.defaults.models`. Gebruik dit voor agentspecifieke overschrijvingen zoals `cacheRetention`, `temperature` of `maxTokens` zonder de hele modelcatalogus te dupliceren.
- `tts`: optionele text-to-speech-overschrijvingen per agent. Het blok wordt diep samengevoegd over `messages.tts`, dus bewaar gedeelde providerreferenties en fallbackbeleid in `messages.tts` en stel hier alleen personaspecifieke waarden in, zoals provider, stem, model, stijl of automatische modus.
- `skills`: optionele allowlist voor Skills per agent. Als dit wordt weggelaten, erft de agent `agents.defaults.skills` wanneer ingesteld; een expliciete lijst vervangt standaardwaarden in plaats van samen te voegen, en `[]` betekent geen Skills.
- `thinkingDefault`: optioneel standaarddenkniveau per agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Overschrijft `agents.defaults.thinkingDefault` voor deze agent wanneer er geen overschrijving per bericht of sessie is ingesteld. Het geselecteerde provider-/modelprofiel bepaalt welke waarden geldig zijn; voor Google Gemini behoudt `adaptive` het dynamische denken dat eigendom is van de provider (`thinkingLevel` weggelaten op Gemini 3/3.1, `thinkingBudget: -1` op Gemini 2.5).
- `reasoningDefault`: optionele standaardzichtbaarheid voor redeneren per agent (`on | off | stream`). Overschrijft `agents.defaults.reasoningDefault` voor deze agent wanneer er geen redeneeroverschrijving per bericht of sessie is ingesteld.
- `fastModeDefault`: optionele standaard voor snelle modus per agent (`true | false`). Van toepassing wanneer er geen overschrijving voor snelle modus per bericht of sessie is ingesteld.
- `agentRuntime`: optionele overschrijving van low-level runtimebeleid per agent. Gebruik `{ id: "codex" }` om één agent alleen Codex te laten gebruiken terwijl andere agents de standaard Pi-fallback in `auto`-modus behouden.
- `runtime`: optionele runtimebeschrijving per agent. Gebruik `type: "acp"` met `runtime.acp`-standaardwaarden (`agent`, `backend`, `mode`, `cwd`) wanneer de agent standaard ACP-harnessessies moet gebruiken.
- `identity.avatar`: werkruimterelatief pad, `http(s)`-URL of `data:`-URI.
- `identity` leidt standaardwaarden af: `ackReaction` uit `emoji`, `mentionPatterns` uit `name`/`emoji`.
- `subagents.allowAgents`: allowlist van agent-id's voor expliciete `sessions_spawn.agentId`-doelen (`["*"]` = willekeurig; standaard: alleen dezelfde agent). Neem de requester-id op wanneer zelfgerichte `agentId`-aanroepen toegestaan moeten zijn.
- Overervingsbewaking voor sandbox: als de requester-sessie in een sandbox draait, weigert `sessions_spawn` doelen die zonder sandbox zouden draaien.
- `subagents.requireAgentId`: wanneer true, blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af; standaard: false).

---

## Multi-agentroutering

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

### Binding-matchvelden

- `type` (optioneel): `route` voor normale routering (ontbrekend type wordt standaard route), `acp` voor persistente ACP-gespreksbindings.
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

Voor `type: "acp"`-vermeldingen lost OpenClaw op via exacte gespreksidentiteit (`match.channel` + account + `match.peer.id`) en gebruikt het de routebindinglaagvolgorde hierboven niet.

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

<Accordion title="Geen bestandssysteemtoegang (alleen berichten)">

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
  - `per-sender` (standaard): elke afzender krijgt een geisoleerde sessie binnen een kanaalcontext.
  - `global`: alle deelnemers in een kanaalcontext delen een enkele sessie (gebruik dit alleen wanneer gedeelde context bedoeld is).
- **`dmScope`**: hoe DM's worden gegroepeerd.
  - `main`: alle DM's delen de hoofdsessie.
  - `per-peer`: isoleer op afzender-id over kanalen heen.
  - `per-channel-peer`: isoleer per kanaal + afzender (aanbevolen voor inboxen met meerdere gebruikers).
  - `per-account-channel-peer`: isoleer per account + kanaal + afzender (aanbevolen voor meerdere accounts).
- **`identityLinks`**: koppel canonieke id's aan peers met providerprefix voor het delen van sessies tussen kanalen. Dock-opdrachten zoals `/dock_discord` gebruiken dezelfde mapping om de antwoordroute van de actieve sessie om te schakelen naar een andere gekoppelde kanaalpeer; zie [Kanaal-docking](/nl/concepts/channel-docking).
- **`reset`**: primair resetbeleid. `daily` reset om `atHour` lokale tijd; `idle` reset na `idleMinutes`. Wanneer beide zijn geconfigureerd, wint wat het eerst verloopt. Dagelijkse resetfrisheid gebruikt de `sessionStartedAt` van de sessierij; resetfrisheid bij inactiviteit gebruikt `lastInteractionAt`. Achtergrond-/systeemevent-schrijfacties zoals Heartbeat, Cron-wekoproepen, exec-meldingen en Gateway-boekhouding kunnen `updatedAt` bijwerken, maar ze houden dagelijkse/inactieve sessies niet fris.
- **`resetByType`**: overschrijvingen per type (`direct`, `group`, `thread`). Legacy `dm` wordt geaccepteerd als alias voor `direct`.
- **`mainKey`**: legacy veld. Runtime gebruikt altijd `"main"` voor de hoofd-bucket voor directe chats.
- **`agentToAgent.maxPingPongTurns`**: maximum aantal antwoord-terug-beurten tussen agents tijdens agent-naar-agent-uitwisselingen (integer, bereik: `0`-`5`). `0` schakelt pingpong-koppeling uit.
- **`sendPolicy`**: match op `channel`, `chatType` (`direct|group|channel`, met legacy alias `dm`), `keyPrefix` of `rawKeyPrefix`. De eerste weigering wint.
- **`maintenance`**: opschoning van sessiestore + retentie-instellingen.
  - `mode`: `warn` geeft alleen waarschuwingen; `enforce` past opschoning toe.
  - `pruneAfter`: leeftijdsgrens voor verouderde items (standaard `30d`).
  - `maxEntries`: maximum aantal items in `sessions.json` (standaard `500`). Runtime schrijft batchopschoning met een kleine high-waterbuffer voor limieten op productieschaal; `openclaw sessions cleanup --enforce` past de limiet onmiddellijk toe.
  - `rotateBytes`: verouderd en genegeerd; `openclaw doctor --fix` verwijdert dit uit oudere configuraties.
  - `resetArchiveRetention`: retentie voor transcriptarchieven met `*.reset.<timestamp>`. Standaard gelijk aan `pruneAfter`; stel in op `false` om uit te schakelen.
  - `maxDiskBytes`: optioneel schijfbudget voor de sessiemap. In `warn`-modus worden waarschuwingen gelogd; in `enforce`-modus worden oudste artefacten/sessies eerst verwijderd.
  - `highWaterBytes`: optioneel doel na budgetopschoning. Standaard `80%` van `maxDiskBytes`.
- **`threadBindings`**: globale standaardwaarden voor thread-gebonden sessiefuncties.
  - `enabled`: master-standaardschakelaar (providers kunnen overschrijven; Discord gebruikt `channels.discord.threadBindings.enabled`)
  - `idleHours`: standaard automatische ontfocus bij inactiviteit in uren (`0` schakelt uit; providers kunnen overschrijven)
  - `maxAgeHours`: standaard harde maximale leeftijd in uren (`0` schakelt uit; providers kunnen overschrijven)
  - `spawnSessions`: standaardpoort voor het aanmaken van thread-gebonden werksessies vanuit `sessions_spawn` en ACP-thread-spawns. Standaard `true` wanneer threadbindings zijn ingeschakeld; providers/accounts kunnen overschrijven.
  - `defaultSpawnContext`: standaard native subagentcontext voor thread-gebonden spawns (`"fork"` of `"isolated"`). Standaard `"fork"`.

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

Per-kanaal-/accountoverschrijvingen: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolutie (meest specifiek wint): account → kanaal → globaal. `""` schakelt uit en stopt de cascade. `"auto"` leidt `[{identity.name}]` af.

**Sjabloonvariabelen:**

| Variabele         | Beschrijving              | Voorbeeld                   |
| ----------------- | ------------------------- | --------------------------- |
| `{model}`         | Korte modelnaam           | `claude-opus-4-6`           |
| `{modelFull}`     | Volledige modelidentifier | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providernaam              | `anthropic`                 |
| `{thinkingLevel}` | Huidig denkniveau         | `high`, `low`, `off`        |
| `{identity.name}` | Naam van agentidentiteit  | (hetzelfde als `"auto"`)    |

Variabelen zijn niet hoofdlettergevoelig. `{think}` is een alias voor `{thinkingLevel}`.

### Ack-reactie

- Staat standaard op de `identity.emoji` van de actieve agent, anders `"👀"`. Stel in op `""` om uit te schakelen.
- Per-kanaaloverschrijvingen: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Resolutievolgorde: account → kanaal → `messages.ackReaction` → identiteitsfallback.
- Scope: `group-mentions` (standaard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: verwijdert de ack na een antwoord op kanalen met reactieondersteuning, zoals Slack, Discord, Telegram, WhatsApp en BlueBubbles.
- `messages.statusReactions.enabled`: schakelt levenscyclusstatusreacties in op Slack, Discord en Telegram.
  Op Slack en Discord blijven statusreacties ingeschakeld wanneer ack-reacties actief zijn als dit niet is ingesteld.
  Op Telegram moet je dit expliciet instellen op `true` om levenscyclusstatusreacties in te schakelen.

### Inkomende debounce

Bundelt snelle tekstberichten zonder media van dezelfde afzender in één agentbeurt. Media/bijlagen worden onmiddellijk geflusht. Besturingsopdrachten omzeilen debouncing.

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

- `auto` bepaalt de standaardmodus voor automatische TTS: `off`, `always`, `inbound` of `tagged`. `/tts on|off` kan lokale voorkeuren overschrijven, en `/tts status` toont de effectieve status.
- `summaryModel` overschrijft `agents.defaults.model.primary` voor automatische samenvatting.
- `modelOverrides` is standaard ingeschakeld; `modelOverrides.allowProvider` staat standaard op `false` (opt-in).
- API-sleutels vallen terug op `ELEVENLABS_API_KEY`/`XI_API_KEY` en `OPENAI_API_KEY`.
- Gebundelde spraakproviders zijn eigendom van Plugins. Als `plugins.allow` is ingesteld, neem dan elke TTS-provider-Plugin op die je wilt gebruiken, bijvoorbeeld `microsoft` voor Edge TTS. De verouderde provider-id `edge` wordt geaccepteerd als alias voor `microsoft`.
- `providers.openai.baseUrl` overschrijft het OpenAI TTS-eindpunt. De resolutievolgorde is configuratie, daarna `OPENAI_TTS_BASE_URL`, daarna `https://api.openai.com/v1`.
- Wanneer `providers.openai.baseUrl` naar een niet-OpenAI-eindpunt verwijst, behandelt OpenClaw dit als een OpenAI-compatibele TTS-server en versoepelt het model-/stemvalidatie.

---

## Talk

Standaardwaarden voor Talk-modus (macOS/iOS/Android).

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
- Verouderde platte Talk-sleutels (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) zijn alleen bedoeld voor compatibiliteit. Voer `openclaw doctor --fix` uit om blijvende configuratie te herschrijven naar `talk.providers.<provider>`.
- Stem-id's vallen terug op `ELEVENLABS_VOICE_ID` of `SAG_VOICE_ID`.
- `providers.*.apiKey` accepteert plattetekstreeksen of SecretRef-objecten.
- De fallback `ELEVENLABS_API_KEY` wordt alleen toegepast wanneer er geen Talk-API-sleutel is geconfigureerd.
- Met `providers.*.voiceAliases` kunnen Talk-richtlijnen vriendelijke namen gebruiken.
- `providers.mlx.modelId` selecteert de Hugging Face-repo die door de lokale MLX-helper op macOS wordt gebruikt. Als dit wordt weggelaten, gebruikt macOS `mlx-community/Soprano-80M-bf16`.
- MLX-afspelen op macOS verloopt via de gebundelde `openclaw-mlx-tts`-helper wanneer aanwezig, of via een uitvoerbaar bestand op `PATH`; `OPENCLAW_MLX_TTS_BIN` overschrijft het helperpad voor ontwikkeling.
- `speechLocale` stelt de BCP 47-locale-id in die door iOS/macOS Talk-spraakherkenning wordt gebruikt. Laat dit leeg om de apparaatstandaard te gebruiken.
- `silenceTimeoutMs` bepaalt hoelang de Talk-modus wacht na stilte van de gebruiker voordat het transcript wordt verzonden. Niet instellen behoudt het standaard pauzevenster van het platform (`700 ms op macOS en Android, 900 ms op iOS`).

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — alle andere configuratiesleutels
- [Configuratie](/nl/gateway/configuration) — veelvoorkomende taken en snelle configuratie
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)

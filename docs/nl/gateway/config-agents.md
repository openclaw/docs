---
read_when:
    - Standaardinstellingen voor agents afstemmen (modellen, denken, werkruimte, Heartbeat, media, Skills)
    - Routering en bindingen voor meerdere agents configureren
    - Sessie-, berichtbezorgings- en praatmodusgedrag aanpassen
summary: Standaardinstellingen voor agenten, multi-agentrouting, sessie, berichten en gespreksconfiguratie
title: Configuratie — agenten
x-i18n:
    generated_at: "2026-05-12T12:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 517aec30ff6c65a269c7e5c8baefb5dc371dabe52d4c38a47a41cae1a1a785e1
    source_path: gateway/config-agents.md
    workflow: 16
---

Agentgebonden configuratiesleutels onder `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` en `talk.*`. Zie voor kanalen, tools, Gateway-runtime en andere
sleutels op hoofdniveau de [Configuratiereferentie](/nl/gateway/configuration-reference).

## Agentstandaardinstellingen

### `agents.defaults.workspace`

Standaard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionele repository-root die wordt weergegeven in de Runtime-regel van de systeemprompt. Als deze niet is ingesteld, detecteert OpenClaw deze automatisch door vanaf de workspace omhoog te lopen.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionele standaard-allowlist voor Skills voor agents die geen
`agents.list[].skills` instellen.

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
- Laat `agents.list[].skills` weg om de standaardinstellingen te erven.
- Stel `agents.list[].skills: []` in voor geen Skills.
- Een niet-lege lijst `agents.list[].skills` is de definitieve set voor die agent; deze
  wordt niet samengevoegd met standaardinstellingen.

### `agents.defaults.skipBootstrap`

Schakelt automatische aanmaak van workspace-bootstrapbestanden uit (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Slaat de aanmaak van geselecteerde optionele workspace-bestanden over, terwijl vereiste bootstrapbestanden nog steeds worden geschreven. Geldige waarden: `SOUL.md`, `USER.md`, `HEARTBEAT.md` en `IDENTITY.md`.

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

Bepaalt wanneer workspace-bootstrapbestanden in de systeemprompt worden ingevoegd. Standaard: `"always"`.

- `"continuation-skip"`: veilige vervolgbeurten (na een voltooid assistentantwoord) slaan herinjectie van workspace-bootstrap over, waardoor de promptgrootte kleiner wordt. Heartbeat-runs en nieuwe pogingen na Compaction bouwen de context nog steeds opnieuw op.
- `"never"`: schakel workspace-bootstrap en injectie van contextbestanden bij elke beurt uit. Gebruik dit alleen voor agents die hun promptlevenscyclus volledig zelf beheren (aangepaste context-engines, native runtimes die hun eigen context bouwen, of gespecialiseerde workflows zonder bootstrap). Heartbeat- en Compaction-herstelbeurten slaan injectie ook over.

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

Maximaal totaal aantal tekens dat over alle workspace-bootstrapbestanden heen wordt geïnjecteerd. Standaard: `60000`.

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

Gedetailleerde ruwe/geïnjecteerde aantallen en configuratievelden voor afstemming blijven in diagnostiek, zoals context-/statusrapporten en logs; routinematige WebChat-gebruikers-/runtimecontext krijgt alleen de beknopte herstelmelding.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Eigendomskaart voor contextbudgetten

OpenClaw heeft meerdere prompt-/contextbudgetten met hoog volume, en deze zijn
bewust per subsysteem gescheiden in plaats van allemaal via één generieke
knop te lopen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale injectie van workspace-bootstrap.
- `agents.defaults.startupContext.*`:
  eenmalige reset-/opstartprelude voor modelruns, inclusief recente dagelijkse
  `memory/*.md`-bestanden. Kale chatopdrachten `/new` en `/reset` worden
  bevestigd zonder het model aan te roepen.
- `skills.limits.*`:
  de compacte lijst met Skills die in de systeemprompt wordt geïnjecteerd.
- `agents.defaults.contextLimits.*`:
  begrensde runtime-fragmenten en geïnjecteerde runtime-eigen blokken.
- `memory.qmd.limits.*`:
  grootte-instellingen voor geïndexeerde memory-zoekfragmenten en injectie.

Gebruik de bijpassende override per agent alleen wanneer één agent een ander
budget nodig heeft:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Bepaalt de opstartprelude voor de eerste beurt die wordt geïnjecteerd bij reset-/opstartmodelruns.
Kale chatopdrachten `/new` en `/reset` bevestigen de reset zonder het model
aan te roepen, dus laden ze deze prelude niet.

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

Gedeelde standaardinstellingen voor begrensde runtimecontextoppervlakken.

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
  en een vervolgmelding worden toegevoegd.
- `memoryGetDefaultLines`: standaardregelvenster voor `memory_get` wanneer `lines` is
  weggelaten.
- `toolResultMaxChars`: live limiet voor toolresultaten, gebruikt voor persistente resultaten en
  herstel bij overflow.
- `postCompactionMaxChars`: limiet voor AGENTS.md-fragmenten, gebruikt tijdens injectie voor
  vernieuwing na Compaction.

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

Globale limiet voor de compacte lijst met Skills die in de systeemprompt wordt geïnjecteerd. Dit
heeft geen invloed op het op verzoek lezen van `SKILL.md`-bestanden.

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

Maximale pixelgrootte voor de langste zijde van een afbeelding in transcript-/toolafbeeldingsblokken vóór provideraanroepen.
Standaard: `1200`.

Lagere waarden verminderen meestal het gebruik van vision-tokens en de grootte van requestpayloads voor runs met veel screenshots.
Hogere waarden behouden meer visueel detail.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Tijdzone voor systeempromptcontext (niet voor berichttijdstempels). Valt terug op de hosttijdzone.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Tijdnotatie in de systeemprompt. Standaard: `auto` (OS-voorkeur).

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
  - Gebruikt door het `image`-toolpad als de configuratie voor het vision-model.
  - Wordt ook gebruikt als fallbackroutering wanneer het geselecteerde/standaardmodel geen afbeeldingsinvoer kan accepteren.
  - Geef de voorkeur aan expliciete `provider/model`-refs. Kale ID's worden geaccepteerd voor compatibiliteit; als een kaal ID uniek overeenkomt met een geconfigureerd afbeeldingsgeschikt item in `models.providers.*.models`, kwalificeert OpenClaw het voor die provider. Ambigue geconfigureerde overeenkomsten vereisen een expliciet providerprefix.
- `imageGenerationModel`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Gebruikt door de gedeelde mogelijkheid voor afbeeldingsgeneratie en elk toekomstig tool-/Plugin-oppervlak dat afbeeldingen genereert.
  - Typische waarden: `google/gemini-3.1-flash-image-preview` voor native Gemini-afbeeldingsgeneratie, `fal/fal-ai/flux/dev` voor fal, `openai/gpt-image-2` voor OpenAI Images, of `openai/gpt-image-1.5` voor OpenAI PNG/WebP-uitvoer met transparante achtergrond.
  - Als je direct een provider/model selecteert, configureer dan ook de bijpassende providerauthenticatie (bijvoorbeeld `GEMINI_API_KEY` of `GOOGLE_API_KEY` voor `google/*`, `OPENAI_API_KEY` of OpenAI Codex OAuth voor `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` voor `fal/*`).
  - Als dit wordt weggelaten, kan `image_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde providers voor afbeeldingsgeneratie in volgorde van provider-ID.
- `musicGenerationModel`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Gebruikt door de gedeelde mogelijkheid voor muziekgeneratie en de ingebouwde `music_generate`-tool.
  - Typische waarden: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, of `minimax/music-2.6`.
  - Als dit wordt weggelaten, kan `music_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde providers voor muziekgeneratie in volgorde van provider-ID.
  - Als je direct een provider/model selecteert, configureer dan ook de bijpassende providerauthenticatie/API-sleutel.
- `videoGenerationModel`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Gebruikt door de gedeelde mogelijkheid voor videogeneratie en de ingebouwde `video_generate`-tool.
  - Typische waarden: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, of `qwen/wan2.7-r2v`.
  - Als dit wordt weggelaten, kan `video_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde providers voor videogeneratie in volgorde van provider-ID.
  - Als je direct een provider/model selecteert, configureer dan ook de bijpassende providerauthenticatie/API-sleutel.
  - De gebundelde Qwen-provider voor videogeneratie ondersteunt maximaal 1 uitvoervideo, 1 invoerafbeelding, 4 invoervideo's, 10 seconden duur, en opties op providerniveau `size`, `aspectRatio`, `resolution`, `audio` en `watermark`.
- `pdfModel`: accepteert een string (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Gebruikt door de `pdf`-tool voor modelroutering.
  - Als dit wordt weggelaten, valt de PDF-tool terug op `imageModel` en daarna op het opgeloste sessie-/standaardmodel.
- `pdfMaxBytesMb`: standaardlimiet voor PDF-grootte voor de `pdf`-tool wanneer `maxBytesMb` niet bij aanroeptijd wordt doorgegeven.
- `pdfMaxPages`: standaardmaximumaantal pagina's dat wordt meegenomen door de extractiefallbackmodus in de `pdf`-tool.
- `verboseDefault`: standaard verbose-niveau voor agents. Waarden: `"off"`, `"on"`, `"full"`. Standaard: `"off"`.
- `toolProgressDetail`: detailmodus voor `/verbose`-toolsamenvattingen en toolregels voor voortgangsconcepten. Waarden: `"explain"` (standaard, compacte menselijke labels) of `"raw"` (voeg ruwe opdracht/detail toe wanneer beschikbaar). Per-agent `agents.list[].toolProgressDetail` overschrijft deze standaard.
- `reasoningDefault`: standaardzichtbaarheid van redenering voor agents. Waarden: `"off"`, `"on"`, `"stream"`. Per-agent `agents.list[].reasoningDefault` overschrijft deze standaard. Geconfigureerde redeneringsstandaarden worden alleen toegepast voor eigenaars, geautoriseerde afzenders of operator-admin Gateway-contexten wanneer er geen redeneringsoverschrijving per bericht of sessie is ingesteld.
- `elevatedDefault`: standaardniveau voor verhoogde uitvoer voor agents. Waarden: `"off"`, `"on"`, `"ask"`, `"full"`. Standaard: `"on"`.
- `model.primary`: formaat `provider/model` (bijv. `openai/gpt-5.5` voor OpenAI API-sleutel- of Codex OAuth-toegang). Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke overeenkomst met een geconfigureerde provider voor dat exacte model-ID, en pas daarna valt het terug op de geconfigureerde standaardprovider (verouderd compatibiliteitsgedrag, dus geef de voorkeur aan expliciet `provider/model`). Als die provider het geconfigureerde standaardmodel niet langer aanbiedt, valt OpenClaw terug op de eerst geconfigureerde provider/model in plaats van een verouderde standaard van een verwijderde provider te tonen.
- `models`: de geconfigureerde modelcatalogus en allowlist voor `/model`. Elk item kan `alias` (snelkoppeling) en `params` bevatten (providerspecifiek, bijvoorbeeld `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Gebruik `provider/*`-items zoals `"openai-codex/*": {}` of `"vllm/*": {}` om alle ontdekte modellen voor geselecteerde providers te tonen zonder elke model-ID handmatig te vermelden.
  - Veilige bewerkingen: gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om items toe te voegen. `config set` weigert vervangingen die bestaande allowlist-items zouden verwijderen, tenzij je `--replace` doorgeeft.
  - Providergerichte configuratie-/onboardingstromen voegen geselecteerde providermodellen samen in deze map en behouden niet-gerelateerde providers die al zijn geconfigureerd.
  - Voor directe OpenAI Responses-modellen is server-side Compaction automatisch ingeschakeld. Gebruik `params.responsesServerCompaction: false` om het injecteren van `context_management` te stoppen, of `params.responsesCompactThreshold` om de drempel te overschrijven. Zie [OpenAI server-side Compaction](/nl/providers/openai#server-side-compaction-responses-api).
- `params`: globale standaardproviderparameters die op alle modellen worden toegepast. Stel in bij `agents.defaults.params` (bijv. `{ cacheRetention: "long" }`).
- Mergevolgorde van `params` (config): `agents.defaults.params` (globale basis) wordt overschreven door `agents.defaults.models["provider/model"].params` (per model), daarna overschrijft `agents.list[].params` (overeenkomende agent-ID) per sleutel. Zie [Prompt Caching](/nl/reference/prompt-caching) voor details.
- `params.extra_body`/`params.extraBody`: geavanceerde pass-through JSON die wordt samengevoegd in `api: "openai-completions"`-requestbody's voor OpenAI-compatibele proxies. Als dit botst met gegenereerde requestsleutels, wint de extra body; niet-native completionsroutes verwijderen daarna nog steeds OpenAI-only `store`.
- `params.chat_template_kwargs`: vLLM/OpenAI-compatibele chattemplate-argumenten die worden samengevoegd in top-level `api: "openai-completions"`-requestbody's. Voor `vllm/nemotron-3-*` met denken uit stuurt de gebundelde vLLM-Plugin automatisch `enable_thinking: false` en `force_nonempty_content: true`; expliciete `chat_template_kwargs` overschrijven gegenereerde standaarden, en `extra_body.chat_template_kwargs` heeft nog steeds de uiteindelijke prioriteit. Voor vLLM Qwen-denkbesturingen stel je `params.qwenThinkingFormat` in op `"chat-template"` of `"top-level"` op dat modelitem.
- `compat.thinkingFormat`: OpenAI-compatibele stijl voor denkpayloads. Gebruik `"qwen"` voor Qwen-stijl top-level `enable_thinking`, of `"qwen-chat-template"` voor `chat_template_kwargs.enable_thinking` op backends uit de Qwen-familie die chattemplate-kwargs op requestniveau ondersteunen, zoals vLLM. OpenClaw mapt uitgeschakeld denken naar `false` en ingeschakeld denken naar `true`.
- `compat.supportedReasoningEfforts`: per-model OpenAI-compatibele lijst met redeneerinspanning. Neem `"xhigh"` op voor aangepaste endpoints die dit echt accepteren; OpenClaw toont dan `/think xhigh` in opdrachtmenu's, Gateway-sessierijen, validatie van sessiepatches, validatie van agent-CLI en `llm-task`-validatie voor die geconfigureerde provider/model. Gebruik `compat.reasoningEffortMap` wanneer de backend een providerspecifieke waarde wil voor een canoniek niveau.
- `params.preserveThinking`: alleen voor Z.AI opt-in voor behouden denken. Wanneer dit is ingeschakeld en denken aan staat, stuurt OpenClaw `thinking.clear_thinking: false` en speelt eerdere `reasoning_content` opnieuw af; zie [Z.AI-denken en behouden denken](/nl/providers/zai#thinking-and-preserved-thinking).
- `localService`: optionele procesmanager op providerniveau voor lokale/zelfgehoste modelservers. Wanneer het geselecteerde model bij die provider hoort, peilt OpenClaw `healthUrl` (of `baseUrl + "/models"`), start `command` met `args` als het endpoint offline is, wacht tot maximaal `readyTimeoutMs`, en stuurt daarna de modelrequest. `command` moet een absoluut pad zijn. `idleStopMs: 0` houdt het proces actief totdat OpenClaw afsluit; een positieve waarde stopt het door OpenClaw gestarte proces na zoveel milliseconden inactiviteit. Zie [Lokale modelservices](/nl/gateway/local-model-services).
- Runtimebeleid hoort op providers of modellen, niet op `agents.defaults`. Gebruik `models.providers.<provider>.agentRuntime` voor providerbrede regels of `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` voor modelspecifieke regels. OpenAI-agentmodellen op de officiële OpenAI-provider selecteren standaard Codex.
- Configuratieschrijvers die deze velden wijzigen (bijvoorbeeld `/models set`, `/models set-image` en opdrachten voor fallback toevoegen/verwijderen) slaan de canonieke objectvorm op en behouden bestaande fallbacklijsten waar mogelijk.
- `maxConcurrent`: maximaal aantal parallelle agentruns over sessies heen (elke sessie blijft geserialiseerd). Standaard: 4.

### Runtimebeleid

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, een geregistreerde Plugin-harness-ID, of een ondersteunde CLI-backendalias. De gebundelde Codex-Plugin registreert `codex`; de gebundelde Anthropic-Plugin levert de `claude-cli` CLI-backend.
- `id: "auto"` laat geregistreerde Plugin-harnesses ondersteunde beurten claimen en gebruikt PI wanneer geen harness overeenkomt. Een expliciete Plugin-runtime zoals `id: "codex"` vereist die harness en faalt gesloten als deze niet beschikbaar is of faalt.
- Runtime-sleutels voor hele agents zijn legacy. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, runtimepinnen voor sessies en `OPENCLAW_AGENT_RUNTIME` worden genegeerd door runtimeselectie. Voer `openclaw doctor --fix` uit om verouderde waarden te verwijderen.
- OpenAI-agentmodellen gebruiken standaard de Codex-harness; provider/model `agentRuntime.id: "codex"` blijft geldig wanneer je dat expliciet wilt maken.
- Voor Claude CLI-implementaties geef je de voorkeur aan `model: "anthropic/claude-opus-4-7"` plus modelgerichte `agentRuntime.id: "claude-cli"`. Legacy `claude-cli/claude-opus-4-7`-modelrefs blijven werken voor compatibiliteit, maar nieuwe configuratie moet provider/model-selectie canoniek houden en de uitvoeringsbackend in provider/model-runtimebeleid plaatsen.
- Dit beheert alleen uitvoering van tekst-agentbeurten. Mediageneratie, vision, PDF, muziek, video en TTS blijven hun provider/model-instellingen gebruiken.

**Ingebouwde alias-snelkoppelingen** (alleen van toepassing wanneer het model in `agents.defaults.models` staat):

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

Je geconfigureerde aliassen hebben altijd voorrang op standaardwaarden.

Z.AI GLM-4.x-modellen schakelen automatisch de denkmodus in, tenzij je `--thinking off` instelt of zelf `agents.defaults.models["zai/<model>"].params.thinking` definieert.
Z.AI-modellen schakelen `tool_stream` standaard in voor streaming van toolaanroepen. Stel `agents.defaults.models["zai/<model>"].params.tool_stream` in op `false` om dit uit te schakelen.
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

- CLI-backends zijn tekst-eerst; tools zijn altijd uitgeschakeld.
- Sessies worden ondersteund wanneer `sessionArg` is ingesteld.
- Doorvoer van afbeeldingen wordt ondersteund wanneer `imageArg` bestandspaden accepteert.
- Met `reseedFromRawTranscriptWhenUncompacted: true` kan een backend veilige ongeldig gemaakte sessies herstellen uit een begrensde staart van een ruw OpenClaw-transcript voordat de eerste Compaction-samenvatting bestaat. Wijzigingen in auth-profiel of credential-epoch gebruiken nog steeds nooit raw-reseed.

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

Provider-onafhankelijke prompt-overlays die per modelfamilie worden toegepast. Model-id’s uit de GPT-5-familie ontvangen het gedeelde gedragscontract over providers heen; `personality` beheert alleen de vriendelijke laag voor interactiestijl.

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

- `every`: duurtekenreeks (ms/s/m/h). Standaard: `30m` (API-sleutel-auth) of `1h` (OAuth-auth). Stel in op `0m` om uit te schakelen.
- `includeSystemPromptSection`: laat, wanneer false, de Heartbeat-sectie uit de systeemprompt weg en slaat injectie van `HEARTBEAT.md` in de bootstrap-context over. Standaard: `true`.
- `suppressToolErrorWarnings`: onderdrukt, wanneer true, waarschuwingspayloads voor toolfouten tijdens Heartbeat-runs.
- `timeoutSeconds`: maximale tijd in seconden die is toegestaan voor een Heartbeat-agentbeurt voordat deze wordt afgebroken. Laat oningesteld om `agents.defaults.timeoutSeconds` te gebruiken.
- `directPolicy`: bezorgbeleid voor direct/DM. `allow` (standaard) staat bezorging naar directe doelen toe. `block` onderdrukt bezorging naar directe doelen en geeft `reason=dm-blocked` uit.
- `lightContext`: wanneer true, gebruiken Heartbeat-runs lichte bootstrap-context en behouden ze alleen `HEARTBEAT.md` uit workspace-bootstrapbestanden.
- `isolatedSession`: wanneer true, draait elke Heartbeat in een nieuwe sessie zonder eerdere gespreksgeschiedenis. Hetzelfde isolatiepatroon als Cron `sessionTarget: "isolated"`. Verlaagt de tokenkosten per Heartbeat van ~100K naar ~2-5K tokens.
- `skipWhenBusy`: wanneer true, stellen Heartbeat-runs uit bij extra drukke lanes: subagent- of genest commandowerk. Cron-lanes stellen Heartbeats altijd uit, zelfs zonder deze vlag.
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

- `mode`: `default` of `safeguard` (chunkgewijze samenvatting voor lange geschiedenissen). Zie [Compaction](/nl/concepts/compaction).
- `provider`: id van een geregistreerde Compaction-provider-Plugin. Wanneer ingesteld, wordt de `summarize()` van de provider aangeroepen in plaats van ingebouwde LLM-samenvatting. Valt bij falen terug op ingebouwd. Het instellen van een provider forceert `mode: "safeguard"`. Zie [Compaction](/nl/concepts/compaction).
- `timeoutSeconds`: maximaal aantal seconden dat is toegestaan voor één Compaction-bewerking voordat OpenClaw deze afbreekt. Standaard: `900`.
- `keepRecentTokens`: Pi-cutpointbudget om de meest recente transcriptstaart letterlijk te behouden. Handmatige `/compact` respecteert dit wanneer het expliciet is ingesteld; anders is handmatige Compaction een hard checkpoint.
- `identifierPolicy`: `strict` (standaard), `off` of `custom`. `strict` voegt ingebouwde richtlijnen voor behoud van ondoorzichtige identifiers toe tijdens Compaction-samenvatting.
- `identifierInstructions`: optionele aangepaste tekst voor identifierbehoud die wordt gebruikt wanneer `identifierPolicy=custom`.
- `qualityGuard`: controles met opnieuw proberen bij misvormde uitvoer voor safeguard-samenvattingen. Standaard ingeschakeld in safeguard-modus; stel `enabled: false` in om de audit over te slaan.
- `midTurnPrecheck`: optionele Pi-tool-loop-drukcontrole. Wanneer `enabled: true`, controleert OpenClaw de contextdruk nadat toolresultaten zijn toegevoegd en vóór de volgende modelaanroep. Als de context niet langer past, breekt het de huidige poging af voordat de prompt wordt ingediend en hergebruikt het het bestaande precheck-herstelpad om toolresultaten af te kappen of te compacten en opnieuw te proberen. Werkt met zowel `default`- als `safeguard`-Compaction-modi. Standaard: uitgeschakeld.
- `postCompactionSections`: optionele AGENTS.md H2/H3-sectienamen om opnieuw te injecteren na Compaction. Standaard ingesteld op `["Session Startup", "Red Lines"]`; stel `[]` in om herinjectie uit te schakelen. Wanneer niet ingesteld of expliciet ingesteld op dat standaardpaar, worden oudere koppen `Every Session`/`Safety` ook geaccepteerd als verouderde fallback.
- `model`: optionele `provider/model-id`-override alleen voor Compaction-samenvatting. Gebruik dit wanneer de hoofdsessie één model moet behouden, maar Compaction-samenvattingen op een ander model moeten draaien; wanneer niet ingesteld, gebruikt Compaction het primaire model van de sessie.
- `maxActiveTranscriptBytes`: optionele bytedrempel (`number` of tekenreeksen zoals `"20mb"`) die normale lokale Compaction triggert vóór een run wanneer de actieve JSONL groter wordt dan de drempel. Vereist `truncateAfterCompaction` zodat succesvolle Compaction kan roteren naar een kleiner opvolgend transcript. Uitgeschakeld wanneer niet ingesteld of `0`.
- `notifyUser`: stuurt, wanneer `true`, korte meldingen naar de gebruiker wanneer Compaction start en wanneer deze is voltooid (bijvoorbeeld: "Context compacten..." en "Compaction voltooid"). Standaard uitgeschakeld om Compaction stil te houden.
- `memoryFlush`: stille agentische beurt vóór automatische Compaction om duurzame herinneringen op te slaan. Stel `model` in op een exact provider/model zoals `ollama/qwen3:8b` wanneer deze huishoudelijke beurt op een lokaal model moet blijven; de override erft de fallbackketen van de actieve sessie niet. Overgeslagen wanneer de workspace alleen-lezen is.

### `agents.defaults.runRetries`

Buitengrenzen voor retry-iteraties van de run-loop voor de ingebedde Pi-runner om oneindige uitvoeringslussen tijdens foutherstel te voorkomen. Let op dat deze instelling momenteel alleen van toepassing is op de ingebedde agentruntime, niet op ACP- of CLI-runtimes.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: basisaantal retry-iteraties voor de buitenste run-loop. Standaard: `24`.
- `perProfile`: extra retry-iteraties voor run toegekend per kandidaat-fallbackprofiel. Standaard: `8`.
- `min`: minimale absolute limiet voor retry-iteraties voor run. Standaard: `32`.
- `max`: maximale absolute limiet voor retry-iteraties voor run om runaway-uitvoering te voorkomen. Standaard: `160`.

### `agents.defaults.contextPruning`

Snoeit **oude toolresultaten** uit de in-memory context voordat die naar de LLM wordt gestuurd. Wijzigt de sessiegeschiedenis op schijf **niet**.

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

- `mode: "cache-ttl"` schakelt opschoonpasses in.
- `ttl` bepaalt hoe vaak opschoning opnieuw kan worden uitgevoerd (na de laatste cache-aanraking).
- Opschoning kort te grote toolresultaten eerst zacht in en wist daarna, indien nodig, oudere toolresultaten volledig.

**Zacht inkorten** behoudt begin + einde en voegt `...` in het midden in.

**Volledig wissen** vervangt het volledige toolresultaat door de placeholder.

Opmerkingen:

- Afbeeldingsblokken worden nooit ingekort/gewist.
- Ratio's zijn gebaseerd op tekens (bij benadering), niet op exacte tokentellingen.
- Als er minder dan `keepLastAssistants` assistentberichten bestaan, wordt opschoning overgeslagen.

</Accordion>

Zie [Sessies opschonen](/nl/concepts/session-pruning) voor gedragsdetails.

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

Zie [Streaming](/nl/concepts/streaming) voor details over gedrag en opdeling.

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

- Standaardwaarden: `instant` voor directe chats/vermeldingen, `message` voor groepschats zonder vermelding.
- Overrides per sessie: `session.typingMode`, `session.typingIntervalSeconds`.

Zie [Typindicatoren](/nl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionele sandboxing voor de ingesloten agent. Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige gids.

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
- `ssh`: algemene SSH-gebaseerde externe runtime
- `openshell`: OpenShell-runtime

Wanneer `backend: "openshell"` is geselecteerd, verplaatsen runtime-specifieke instellingen naar
`plugins.entries.openshell.config`.

**SSH-backendconfiguratie:**

- `target`: SSH-doel in de vorm `user@host[:port]`
- `command`: SSH-clientopdracht (standaard: `ssh`)
- `workspaceRoot`: absolute externe root die wordt gebruikt voor werkruimten per scope
- `identityFile` / `certificateFile` / `knownHostsFile`: bestaande lokale bestanden die aan OpenSSH worden doorgegeven
- `identityData` / `certificateData` / `knownHostsData`: inline inhoud of SecretRefs die OpenClaw tijdens runtime in tijdelijke bestanden materialiseert
- `strictHostKeyChecking` / `updateHostKeys`: beleidsinstellingen voor OpenSSH-hostsleutels

**SSH-authenticatieprioriteit:**

- `identityData` heeft voorrang op `identityFile`
- `certificateData` heeft voorrang op `certificateFile`
- `knownHostsData` heeft voorrang op `knownHostsFile`
- Door SecretRef ondersteunde `*Data`-waarden worden opgelost uit de actieve runtime-snapshot met geheimen voordat de sandboxsessie start

**Gedrag van SSH-backend:**

- initialiseert de externe werkruimte eenmalig na aanmaken of opnieuw aanmaken
- houdt daarna de externe SSH-werkruimte canoniek
- routeert `exec`, bestandstools en mediapaden via SSH
- synchroniseert externe wijzigingen niet automatisch terug naar de host
- ondersteunt geen sandboxbrowsercontainers

**Werkruimtetoegang:**

- `none`: sandboxwerkruimte per scope onder `~/.openclaw/sandboxes`
- `ro`: sandboxwerkruimte op `/workspace`, agentwerkruimte alleen-lezen gekoppeld op `/agent`
- `rw`: agentwerkruimte lezen/schrijven gekoppeld op `/workspace`

**Scope:**

- `session`: container + werkruimte per sessie
- `agent`: één container + werkruimte per agent (standaard)
- `shared`: gedeelde container en werkruimte (geen isolatie tussen sessies)

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

- `mirror`: initialiseer extern vanuit lokaal vóór exec, synchroniseer terug na exec; lokale werkruimte blijft canoniek
- `remote`: initialiseer extern eenmalig wanneer de sandbox wordt aangemaakt en houd daarna de externe werkruimte canoniek

In `remote`-modus worden hostlokale bewerkingen die buiten OpenClaw zijn gemaakt niet automatisch na de initialisatiestap naar de sandbox gesynchroniseerd.
Transport is SSH naar de OpenShell-sandbox, maar de plugin beheert de sandboxlevenscyclus en optionele mirrorsynchronisatie.

**`setupCommand`** wordt één keer uitgevoerd na het aanmaken van de container (via `sh -lc`). Vereist uitgaand netwerkverkeer, beschrijfbare root, rootgebruiker.

**Containers gebruiken standaard `network: "none"`** - stel dit in op `"bridge"` (of een aangepast bridge-netwerk) als de agent uitgaande toegang nodig heeft.
`"host"` is geblokkeerd. `"container:<id>"` is standaard geblokkeerd, tenzij u expliciet
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` instelt (noodoptie).

**Inkomende bijlagen** worden klaargezet in `media/inbound/*` in de actieve werkruimte.

**`docker.binds`** koppelt aanvullende hostmappen; globale binds en binds per agent worden samengevoegd.

**Gesandboxte browser** (`sandbox.browser.enabled`): Chromium + CDP in een container. noVNC-URL geïnjecteerd in de systeemprompt. Vereist geen `browser.enabled` in `openclaw.json`.
noVNC-observatortoegang gebruikt standaard VNC-authenticatie en OpenClaw geeft een kortlevende token-URL uit (in plaats van het wachtwoord in de gedeelde URL bloot te stellen).

- `allowHostControl: false` (standaard) blokkeert dat gesandboxte sessies de hostbrowser als doel gebruiken.
- `network` is standaard `openclaw-sandbox-browser` (toegewezen bridge-netwerk). Stel dit alleen in op `bridge` wanneer u expliciet globale bridge-connectiviteit wilt.
- `cdpSourceRange` beperkt optioneel inkomend CDP-verkeer aan de containerrand tot een CIDR-bereik (bijvoorbeeld `172.21.0.1/32`).
- `sandbox.browser.binds` koppelt aanvullende hostmappen alleen in de sandboxbrowsercontainer. Wanneer ingesteld (inclusief `[]`), vervangt dit `docker.binds` voor de browsercontainer.
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` schakelt extensies weer in als de workflow
    ervan afhankelijk is.
  - `--renderer-process-limit=2` kan worden gewijzigd met
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; stel `0` in om Chromium's
    standaardproceslimiet te gebruiken.
  - plus `--no-sandbox` wanneer `noSandbox` is ingeschakeld.
  - Standaarden zijn de baseline van de containerimage; gebruik een aangepaste browserimage met een aangepast
    entrypoint om containerstandaarden te wijzigen.

</Accordion>

Browsersandboxing en `sandbox.docker.binds` zijn alleen voor Docker.

Bouw images (vanuit een broncheckout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Voor npm-installaties zonder broncheckout, zie [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup) voor inline `docker build`-opdrachten.

### `agents.list` (overrides per agent)

Gebruik `agents.list[].tts` om een agent een eigen TTS-provider, stem, model,
stijl of auto-TTS-modus te geven. Het agentblok wordt diep samengevoegd over globale
`messages.tts`, zodat gedeelde referenties op één plek kunnen blijven terwijl afzonderlijke
agents alleen de stem- of providervelden overschrijven die ze nodig hebben. De override van de actieve agent
is van toepassing op automatische gesproken antwoorden, `/tts audio`, `/tts status` en
de agenttool `tts`. Zie [Text-to-speech](/nl/tools/tts#per-agent-voice-overrides)
voor providervoorbeelden en prioriteit.

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
- `default`: wanneer er meerdere zijn ingesteld, wint de eerste (waarschuwing wordt gelogd). Als er geen is ingesteld, is het eerste item in de lijst de standaardwaarde.
- `model`: tekenreeksvorm stelt een strikte primaire waarde per agent in zonder model-fallback; objectvorm `{ primary }` is ook strikt tenzij je `fallbacks` toevoegt. Gebruik `{ primary, fallbacks: [...] }` om die agent voor fallback te laten kiezen, of `{ primary, fallbacks: [] }` om strikt gedrag expliciet te maken. Cron-taken die alleen `primary` overschrijven, erven nog steeds standaardfallbacks, tenzij je `fallbacks: []` instelt.
- `params`: streamparameters per agent die worden samengevoegd over de geselecteerde modelvermelding in `agents.defaults.models`. Gebruik dit voor agentspecifieke overrides zoals `cacheRetention`, `temperature` of `maxTokens` zonder de volledige modelcatalogus te dupliceren.
- `tts`: optionele tekst-naar-spraak-overrides per agent. Het blok wordt diep samengevoegd over `messages.tts`, dus bewaar gedeelde providerreferenties en fallbackbeleid in `messages.tts` en stel hier alleen personaspecifieke waarden in, zoals provider, stem, model, stijl of automatische modus.
- `skills`: optionele Skills-toelatingslijst per agent. Als dit is weggelaten, erft de agent `agents.defaults.skills` wanneer dat is ingesteld; een expliciete lijst vervangt de standaardwaarden in plaats van samen te voegen, en `[]` betekent geen Skills.
- `thinkingDefault`: optioneel standaarddenkniveau per agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Overschrijft `agents.defaults.thinkingDefault` voor deze agent wanneer er geen override per bericht of sessie is ingesteld. Het geselecteerde provider-/modelprofiel bepaalt welke waarden geldig zijn; voor Google Gemini behoudt `adaptive` het dynamische denken dat eigendom is van de provider (`thinkingLevel` weggelaten op Gemini 3/3.1, `thinkingBudget: -1` op Gemini 2.5).
- `reasoningDefault`: optionele standaardzichtbaarheid voor redenering per agent (`on | off | stream`). Overschrijft `agents.defaults.reasoningDefault` voor deze agent wanneer er geen redeneringsoverride per bericht of sessie is ingesteld.
- `fastModeDefault`: optionele standaardwaarde per agent voor snelle modus (`true | false`). Geldt wanneer er geen fast-mode-override per bericht of sessie is ingesteld.
- `models`: optionele modelcatalogus-/runtime-overrides per agent, gesleuteld op volledige `provider/model`-id's. Gebruik `models["provider/model"].agentRuntime` voor runtime-uitzonderingen per agent.
- `runtime`: optionele runtimebeschrijving per agent. Gebruik `type: "acp"` met `runtime.acp`-standaardwaarden (`agent`, `backend`, `mode`, `cwd`) wanneer de agent standaard ACP-harness-sessies moet gebruiken.
- `identity.avatar`: werkruimterelatief pad, `http(s)`-URL of `data:`-URI.
- `identity` leidt standaardwaarden af: `ackReaction` uit `emoji`, `mentionPatterns` uit `name`/`emoji`.
- `subagents.allowAgents`: toelatingslijst van agent-id's voor expliciete `sessions_spawn.agentId`-doelen (`["*"]` = elke; standaard: alleen dezelfde agent). Neem de requester-id op wanneer zelfgerichte `agentId`-aanroepen toegestaan moeten zijn.
- Sandbox-overervingsguard: als de requester-sessie in een sandbox draait, weigert `sessions_spawn` doelen die zonder sandbox zouden draaien.
- `subagents.requireAgentId`: wanneer true, blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af; standaard: false).

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

### Bindingsmatchvelden

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

Voor `type: "acp"`-vermeldingen lost OpenClaw op via exacte gespreksidentiteit (`match.channel` + account + `match.peer.id`) en gebruikt het niet de bovenstaande routebindingslaagvolgorde.

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

Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor prioriteitsdetails.

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
- **`identityLinks`**: koppel canonieke id's aan provider-geprefixte peers voor sessiedeling tussen kanalen. Dock-opdrachten zoals `/dock_discord` gebruiken dezelfde map om de antwoordroute van de actieve sessie over te schakelen naar een andere gekoppelde kanaalpeer; zie [Kanaal-docking](/nl/concepts/channel-docking).
- **`reset`**: primair resetbeleid. `daily` reset op lokale tijd `atHour`; `idle` reset na `idleMinutes`. Wanneer beide zijn geconfigureerd, wint degene die het eerst verloopt. Versheid van dagelijkse reset gebruikt `sessionStartedAt` van de sessierij; versheid van idle-reset gebruikt `lastInteractionAt`. Achtergrond-/systeemevent-writes zoals Heartbeat, Cron-wakeups, exec-meldingen en Gateway-boekhouding kunnen `updatedAt` bijwerken, maar houden dagelijkse/idle-sessies niet vers.
- **`resetByType`**: overrides per type (`direct`, `group`, `thread`). Legacy `dm` wordt geaccepteerd als alias voor `direct`.
- **`mainKey`**: legacy-veld. Runtime gebruikt altijd `"main"` voor de hoofd-bucket voor directe chats.
- **`agentToAgent.maxPingPongTurns`**: maximaal aantal antwoord-terug-beurten tussen agents tijdens agent-naar-agent-uitwisselingen (integer, bereik: `0`-`20`, standaard: `5`). `0` schakelt pingpong-ketening uit.
- **`sendPolicy`**: match op `channel`, `chatType` (`direct|group|channel`, met legacy `dm`-alias), `keyPrefix` of `rawKeyPrefix`. De eerste deny wint.
- **`maintenance`**: opschoning van sessieopslag + retentie-instellingen.
  - `mode`: `warn` geeft alleen waarschuwingen; `enforce` past opschoning toe.
  - `pruneAfter`: leeftijdsgrens voor verouderde entries (standaard `30d`).
  - `maxEntries`: maximaal aantal entries in `sessions.json` (standaard `500`). Runtime schrijft batchopschoning met een kleine high-water-buffer voor productiegrote limieten; `openclaw sessions cleanup --enforce` past de limiet onmiddellijk toe.
  - `rotateBytes`: verouderd en genegeerd; `openclaw doctor --fix` verwijdert dit uit oudere configuraties.
  - `resetArchiveRetention`: retentie voor `*.reset.<timestamp>`-transcriptarchieven. Staat standaard op `pruneAfter`; stel in op `false` om uit te schakelen.
  - `maxDiskBytes`: optioneel schijfbudget voor de sessiemap. In `warn`-modus logt dit waarschuwingen; in `enforce`-modus verwijdert dit eerst de oudste artefacten/sessies.
  - `highWaterBytes`: optioneel doel na budgetopschoning. Staat standaard op `80%` van `maxDiskBytes`.
- **`threadBindings`**: globale standaarden voor thread-gebonden sessiefuncties.
  - `enabled`: hoofdschakelaar voor de standaardinstelling (providers kunnen dit overschrijven; Discord gebruikt `channels.discord.threadBindings.enabled`)
  - `idleHours`: standaard automatische ontfocus bij inactiviteit in uren (`0` schakelt uit; providers kunnen dit overschrijven)
  - `maxAgeHours`: standaard harde maximumleeftijd in uren (`0` schakelt uit; providers kunnen dit overschrijven)
  - `spawnSessions`: standaardgate voor het maken van thread-gebonden werksessies vanuit `sessions_spawn` en ACP-thread-spawns. Staat standaard op `true` wanneer thread bindings zijn ingeschakeld; providers/accounts kunnen dit overschrijven.
  - `defaultSpawnContext`: standaard native subagent-context voor thread-gebonden spawns (`"fork"` of `"isolated"`). Staat standaard op `"fork"`.

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

Overrides per kanaal/account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolutie (meest specifiek wint): account → kanaal → globaal. `""` schakelt uit en stopt de cascade. `"auto"` leidt `[{identity.name}]` af.

**Templatevariabelen:**

| Variabele         | Beschrijving                 | Voorbeeld                   |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Korte modelnaam              | `claude-opus-4-6`           |
| `{modelFull}`     | Volledige model-ID           | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providernaam                 | `anthropic`                 |
| `{thinkingLevel}` | Huidig denkniveau            | `high`, `low`, `off`        |
| `{identity.name}` | Naam van agent-identiteit    | (hetzelfde als `"auto"`)    |

Variabelen zijn niet hoofdlettergevoelig. `{think}` is een alias voor `{thinkingLevel}`.

### Ack-reactie

- Staat standaard op `identity.emoji` van de actieve agent, anders `"👀"`. Stel in op `""` om uit te schakelen.
- Overrides per kanaal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Resolutievolgorde: account → kanaal → `messages.ackReaction` → identity-fallback.
- Scope: `group-mentions` (standaard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: verwijdert ack na antwoord op kanalen die reacties ondersteunen, zoals Slack, Discord, Telegram, WhatsApp en iMessage.
- `messages.statusReactions.enabled`: schakelt levenscyclusstatusreacties in op Slack, Discord en Telegram.
  Op Slack en Discord blijven statusreacties ingeschakeld wanneer ack-reacties actief zijn als dit niet is ingesteld.
  Stel dit op Telegram expliciet in op `true` om levenscyclusstatusreacties in te schakelen.

### Inkomende debounce

Bundelt snelle tekst-only berichten van dezelfde afzender in een enkele agent-beurt. Media/bijlagen flushen onmiddellijk. Besturingsopdrachten omzeilen debouncing.

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

- `auto` bepaalt de standaard auto-TTS-modus: `off`, `always`, `inbound` of `tagged`. `/tts on|off` kan lokale voorkeuren overschrijven, en `/tts status` toont de effectieve status.
- `summaryModel` overschrijft `agents.defaults.model.primary` voor automatische samenvatting.
- `modelOverrides` is standaard ingeschakeld; `modelOverrides.allowProvider` staat standaard op `false` (opt-in).
- API-sleutels vallen terug op `ELEVENLABS_API_KEY`/`XI_API_KEY` en `OPENAI_API_KEY`.
- Gebundelde spraakproviders zijn eigendom van plugins. Als `plugins.allow` is ingesteld, neem dan elke TTS-provider-plugin op die je wilt gebruiken, bijvoorbeeld `microsoft` voor Edge TTS. De legacy provider-id `edge` wordt geaccepteerd als alias voor `microsoft`.
- `providers.openai.baseUrl` overschrijft het OpenAI TTS-endpoint. De resolutievolgorde is configuratie, daarna `OPENAI_TTS_BASE_URL`, daarna `https://api.openai.com/v1`.
- Wanneer `providers.openai.baseUrl` naar een niet-OpenAI-endpoint wijst, behandelt OpenClaw dit als een OpenAI-compatibele TTS-server en versoepelt het model-/voice-validatie.

---

## Talk

Standaarden voor Talk-modus (macOS/iOS/Android).

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
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` moet overeenkomen met een sleutel in `talk.providers` wanneer meerdere Talk-providers zijn geconfigureerd.
- Legacy platte Talk-sleutels (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) zijn alleen voor compatibiliteit. Voer `openclaw doctor --fix` uit om opgeslagen configuratie te herschrijven naar `talk.providers.<provider>`.
- Voice-ID's vallen terug op `ELEVENLABS_VOICE_ID` of `SAG_VOICE_ID`.
- `providers.*.apiKey` accepteert platte-tekststrings of SecretRef-objecten.
- `ELEVENLABS_API_KEY`-fallback geldt alleen wanneer er geen Talk-API-sleutel is geconfigureerd.
- `providers.*.voiceAliases` laat Talk-directives gebruikmaken van vriendelijke namen.
- `providers.mlx.modelId` selecteert de Hugging Face-repo die wordt gebruikt door de lokale macOS MLX-helper. Als dit is weggelaten, gebruikt macOS `mlx-community/Soprano-80M-bf16`.
- macOS MLX-afspelen loopt via de gebundelde `openclaw-mlx-tts`-helper wanneer aanwezig, of via een uitvoerbaar bestand op `PATH`; `OPENCLAW_MLX_TTS_BIN` overschrijft het helperpad voor ontwikkeling.
- `consultThinkingLevel` bepaalt het denkniveau voor de volledige OpenClaw-agent-run achter Control UI Talk realtime `openclaw_agent_consult`-aanroepen. Laat dit niet ingesteld om normaal sessie-/modelgedrag te behouden.
- `consultFastMode` stelt een eenmalige fast-mode-override in voor Control UI Talk realtime-consults zonder de normale fast-mode-instelling van de sessie te wijzigen.
- `speechLocale` stelt de BCP 47-locale-id in die wordt gebruikt door iOS/macOS Talk-spraakherkenning. Laat dit niet ingesteld om de apparaatstandaard te gebruiken.
- `silenceTimeoutMs` bepaalt hoe lang Talk-modus wacht na stilte van de gebruiker voordat het transcript wordt verzonden. Niet ingesteld behoudt de standaard pauzeperiode van het platform (`700 ms op macOS en Android, 900 ms op iOS`).
- `realtime.instructions` voegt providergerichte systeeminstructies toe aan de ingebouwde realtime-prompt van OpenClaw, zodat de stemstijl kan worden geconfigureerd zonder standaard `openclaw_agent_consult`-begeleiding te verliezen.

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — alle andere configuratiesleutels
- [Configuratie](/nl/gateway/configuration) — algemene taken en snelle installatie
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)

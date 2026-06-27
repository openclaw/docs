---
read_when:
    - Agentstandaarden afstemmen (modellen, denken, werkruimte, heartbeat, media, skills)
    - Multi-agent-routering en bindings configureren
    - Sessies, berichtbezorging en talk-modusgedrag aanpassen
summary: Standaardwaarden voor agents, multi-agentrouting, sessie, berichten en praatconfiguratie
title: Configuratie — agenten
x-i18n:
    generated_at: "2026-06-27T17:31:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

Configuratiesleutels met agentscope onder `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` en `talk.*`. Zie voor kanalen, tools, Gateway-runtime en andere
sleutels op topniveau de [Configuratiereferentie](/nl/gateway/configuration-reference).

## Agentstandaarden

### `agents.defaults.workspace`

Standaard: `OPENCLAW_WORKSPACE_DIR` wanneer ingesteld, anders `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Een expliciete waarde voor `agents.defaults.workspace` heeft voorrang op
`OPENCLAW_WORKSPACE_DIR`. Gebruik de omgevingsvariabele om standaardagents naar
een gekoppelde werkruimte te laten wijzen wanneer je dat pad niet in de configuratie wilt schrijven.

### `agents.defaults.repoRoot`

Optionele repositoryroot die wordt getoond in de Runtime-regel van de systeemprompt. Als deze niet is ingesteld, detecteert OpenClaw dit automatisch door vanaf de werkruimte omhoog te lopen.

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

Schakelt automatische aanmaak uit van bootstrapbestanden voor de werkruimte (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Slaat het aanmaken van geselecteerde optionele werkruimtebestanden over terwijl vereiste bootstrapbestanden wel worden geschreven. Geldige waarden: `SOUL.md`, `USER.md`, `HEARTBEAT.md` en `IDENTITY.md`.

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

- `"continuation-skip"`: veilige vervolgrondes (na een voltooide assistentrespons) slaan herinjectie van de werkruimtebootstrap over, waardoor de promptgrootte afneemt. Heartbeat-runs en nieuwe pogingen na Compaction bouwen de context nog steeds opnieuw op.
- `"never"`: schakel injectie van werkruimtebootstrap en contextbestanden uit voor elke ronde. Gebruik dit alleen voor agents die hun promptlevenscyclus volledig zelf beheren (aangepaste contextengines, native runtimes die hun eigen context bouwen, of gespecialiseerde workflows zonder bootstrap). Heartbeat- en Compaction-herstelrondes slaan injectie ook over.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Override per agent: `agents.list[].contextInjection`. Weggelaten waarden erven
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Maximum aantal tekens per werkruimtebootstrapbestand vóór afkapping. Standaard: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Override per agent: `agents.list[].bootstrapMaxChars`. Weggelaten waarden erven
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Maximum totaal aantal tekens dat over alle werkruimtebootstrapbestanden wordt geïnjecteerd. Standaard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Override per agent: `agents.list[].bootstrapTotalMaxChars`. Weggelaten waarden
erven `agents.defaults.bootstrapTotalMaxChars`.

### Overrides voor bootstrapprofielen per agent

Gebruik overrides voor bootstrapprofielen per agent wanneer één agent ander
promptinjectiegedrag nodig heeft dan de gedeelde standaardwaarden. Weggelaten velden erven van
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bepaalt de agent-zichtbare melding in de systeemprompt wanneer bootstrapcontext wordt afgekapt.
Standaard: `"always"`.

- `"off"`: injecteer nooit meldingstekst over afkapping in de systeemprompt.
- `"once"`: injecteer één keer per unieke afkappingssignatuur een beknopte melding.
- `"always"`: injecteer bij elke run een beknopte melding wanneer er afkapping is (aanbevolen).

Gedetailleerde ruwe/geïnjecteerde tellingen en configuratievelden voor tuning blijven in diagnostiek zoals
context-/statusrapporten en logs; routinematige WebChat-gebruikers-/runtimecontext krijgt alleen
de beknopte herstelmelding.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Eigenaarschapskaart voor contextbudgetten

OpenClaw heeft meerdere prompt-/contextbudgetten met hoog volume, en deze zijn
bewust per subsysteem gesplitst in plaats van allemaal via één generieke
knop te lopen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale werkruimtebootstrapinjectie.
- `agents.defaults.startupContext.*`:
  eenmalige prelude voor reset-/opstartmodelruns, inclusief recente dagelijkse
  `memory/*.md`-bestanden. Kale chatopdrachten `/new` en `/reset` worden
  bevestigd zonder het model aan te roepen.
- `skills.limits.*`:
  de compacte lijst met Skills die in de systeemprompt wordt geïnjecteerd.
- `agents.defaults.contextLimits.*`:
  begrensde runtimefragmenten en geïnjecteerde blokken die eigendom zijn van de runtime.
- `memory.qmd.limits.*`:
  grootte voor geïndexeerde geheugenzoekfragmenten en injectie.

Gebruik de overeenkomende override per agent alleen wanneer één agent een ander
budget nodig heeft:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Bepaalt de opstartprelude voor de eerste ronde die wordt geïnjecteerd bij reset-/opstartmodelruns.
Kale chatopdrachten `/new` en `/reset` bevestigen de reset zonder
het model aan te roepen, dus ze laden deze prelude niet.

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: standaardlimiet voor `memory_get`-fragmenten voordat afkappingsmetadata
  en een vervolgbaarmelding worden toegevoegd.
- `memoryGetDefaultLines`: standaardregelvenster voor `memory_get` wanneer `lines` is
  weggelaten.
- `toolResultMaxChars`: geavanceerde live bovengrens voor toolresultaten die wordt gebruikt voor persistente
  resultaten en overloopherstel. Laat dit leeg voor de automatische modelcontextlimiet:
  `16000` tekens onder 100K tokens, `32000` tekens bij 100K+ tokens en `64000`
  tekens bij 200K+ tokens. Expliciete waarden tot `1000000` worden geaccepteerd voor
  long-context-modellen, maar de effectieve limiet blijft beperkt tot ongeveer 30% van
  het contextvenster van het model. `openclaw doctor --deep` drukt de effectieve limiet af,
  en doctor waarschuwt alleen wanneer een expliciete override verouderd is of geen effect heeft.
- `postCompactionMaxChars`: limiet voor AGENTS.md-fragmenten die wordt gebruikt tijdens vernieuwingsinjectie
  na Compaction.

#### `agents.list[].contextLimits`

Override per agent voor de gedeelde `contextLimits`-knoppen. Weggelaten velden erven
van `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globale limiet voor de compacte lijst met Skills die in de systeemprompt wordt geïnjecteerd. Dit
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

Override per agent voor het promptbudget voor Skills.

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

Maximale pixelgrootte voor de langste zijde van afbeeldingen in transcript-/toolafbeeldingsblokken vóór provideraanroepen.
Standaard: `1200`.

Lagere waarden verminderen meestal het gebruik van visiontokens en de grootte van de requestpayload voor runs met veel screenshots.
Hogere waarden behouden meer visueel detail.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Compressie-/detailvoorkeur van de afbeeldingstool voor afbeeldingen die zijn geladen uit bestandspaden, URL's en mediaverwijzingen.
Standaard: `auto`.

OpenClaw past de resize-ladder aan het geselecteerde afbeeldingsmodel aan. Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL en gehoste Llama 4-visionmodellen kunnen bijvoorbeeld grotere afbeeldingen gebruiken dan oudere/standaard high-detail visionpaden, terwijl rondes met meerdere afbeeldingen in `auto`-modus agressiever worden gecomprimeerd om token- en latentiekosten te beheersen.

Waarden:

- `auto`: pas aan modelgrenzen en aantal afbeeldingen aan.
- `efficient`: geef de voorkeur aan kleinere afbeeldingen voor lager token- en bytegebruik.
- `balanced`: gebruik de standaard middenweg-ladder.
- `high`: behoud meer detail voor screenshots, diagrammen en documentafbeeldingen.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
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

- `model`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - De tekenreeksvorm stelt alleen het primaire model in.
  - De objectvorm stelt het primaire model plus geordende failovermodellen in.
- `imageModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Gebruikt door het `image`-toolpad als configuratie voor het vision-model.
  - Ook gebruikt als fallback-routering wanneer het geselecteerde/standaardmodel geen afbeeldingsinvoer kan accepteren.
  - Geef de voorkeur aan expliciete `provider/model`-refs. Kale ID's worden geaccepteerd voor compatibiliteit; als een kaal ID uniek overeenkomt met een geconfigureerde image-geschikte vermelding in `models.providers.*.models`, kwalificeert OpenClaw het naar die provider. Ambigue geconfigureerde overeenkomsten vereisen een expliciet providerprefix.
- `imageGenerationModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Gebruikt door de gedeelde mogelijkheid voor image-generatie en elk toekomstig tool-/Plugin-oppervlak dat afbeeldingen genereert.
  - Typische waarden: `google/gemini-3.1-flash-image-preview` voor native Gemini-image-generatie, `fal/fal-ai/flux/dev` voor fal, `openai/gpt-image-2` voor OpenAI Images, of `openai/gpt-image-1.5` voor OpenAI PNG/WebP-uitvoer met transparante achtergrond.
  - Als je rechtstreeks een provider/model selecteert, configureer dan ook de bijpassende provider-authenticatie (bijvoorbeeld `GEMINI_API_KEY` of `GOOGLE_API_KEY` voor `google/*`, `OPENAI_API_KEY` of OpenAI Codex OAuth voor `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` voor `fal/*`).
  - Als dit wordt weggelaten, kan `image_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde image-generatieproviders in provider-id-volgorde.
- `musicGenerationModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Gebruikt door de gedeelde mogelijkheid voor muziekgeneratie en de ingebouwde `music_generate`-tool.
  - Typische waarden: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, of `minimax/music-2.6`.
  - Als dit wordt weggelaten, kan `music_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde muziekgeneratieproviders in provider-id-volgorde.
  - Als je rechtstreeks een provider/model selecteert, configureer dan ook de bijpassende provider-auth/API-sleutel.
- `videoGenerationModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Gebruikt door de gedeelde mogelijkheid voor videogeneratie en de ingebouwde `video_generate`-tool.
  - Typische waarden: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, of `qwen/wan2.7-r2v`.
  - Als dit wordt weggelaten, kan `video_generate` nog steeds een door authenticatie ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde videogeneratieproviders in provider-id-volgorde.
  - Als je rechtstreeks een provider/model selecteert, configureer dan ook de bijpassende provider-auth/API-sleutel.
  - De officiële Qwen-videogeneratie-Plugin ondersteunt maximaal 1 uitvoervideo, 1 invoerafbeelding, 4 invoervideo's, 10 seconden duur, en provider-niveauopties voor `size`, `aspectRatio`, `resolution`, `audio` en `watermark`.
- `pdfModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Gebruikt door de `pdf`-tool voor modelroutering.
  - Als dit wordt weggelaten, valt de PDF-tool terug op `imageModel` en daarna op het opgeloste sessie-/standaardmodel.
- `pdfMaxBytesMb`: standaardlimiet voor PDF-grootte voor de `pdf`-tool wanneer `maxBytesMb` niet bij de aanroep wordt doorgegeven.
- `pdfMaxPages`: standaard maximumaantal pagina's dat door de fallbackmodus voor extractie in de `pdf`-tool wordt meegenomen.
- `verboseDefault`: standaard verbose-niveau voor agents. Waarden: `"off"`, `"on"`, `"full"`. Standaard: `"off"`.
- `toolProgressDetail`: detailmodus voor `/verbose`-toolsamenvattingen en toolregels voor voortgangsconcepten. Waarden: `"explain"` (standaard, compacte menselijke labels) of `"raw"` (voeg de ruwe opdracht/details toe wanneer beschikbaar). Per-agent `agents.list[].toolProgressDetail` overschrijft deze standaard.
- `reasoningDefault`: standaard zichtbaarheid van redenering voor agents. Waarden: `"off"`, `"on"`, `"stream"`. Per-agent `agents.list[].reasoningDefault` overschrijft deze standaard. Geconfigureerde reasoning-standaarden worden alleen toegepast voor eigenaars, geautoriseerde afzenders of Gateway-contexten voor operator-admins wanneer er geen per-bericht- of sessie-override voor redenering is ingesteld.
- `elevatedDefault`: standaardniveau voor elevated-output voor agents. Waarden: `"off"`, `"on"`, `"ask"`, `"full"`. Standaard: `"on"`.
- `model.primary`: formaat `provider/model` (bijv. `openai/gpt-5.5` voor OpenAI API-sleutel of Codex OAuth-toegang). Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke overeenkomst met een geconfigureerde provider voor dat exacte model-id, en pas daarna valt het terug op de geconfigureerde standaardprovider (verouderd compatibiliteitsgedrag, dus geef de voorkeur aan expliciet `provider/model`). Als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde provider/model in plaats van een verouderde verwijderde-provider-standaard te tonen.
- `models`: de geconfigureerde modelcatalogus en allowlist voor `/model`. Elke vermelding kan `alias` (snelkoppeling) en `params` bevatten (provider-specifiek, bijvoorbeeld `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider`-routering, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Gebruik `provider/*`-vermeldingen zoals `"openai/*": {}` of `"vllm/*": {}` om alle ontdekte modellen voor geselecteerde providers te tonen zonder elk model-id handmatig op te sommen.
  - Voeg `agentRuntime` toe aan een `provider/*`-vermelding wanneer elk dynamisch ontdekt model voor die provider dezelfde runtime moet gebruiken. Exact `provider/model`-runtimebeleid wint nog steeds van de wildcard.
  - Veilige bewerkingen: gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om vermeldingen toe te voegen. `config set` weigert vervangingen die bestaande allowlist-vermeldingen zouden verwijderen, tenzij je `--replace` doorgeeft.
  - Provider-scoped configuratie-/onboardingflows voegen geselecteerde providermodellen samen in deze map en behouden niet-gerelateerde providers die al geconfigureerd zijn.
  - Voor directe OpenAI Responses-modellen is server-side compaction automatisch ingeschakeld. Gebruik `params.responsesServerCompaction: false` om te stoppen met het injecteren van `context_management`, of `params.responsesCompactThreshold` om de drempel te overschrijven. Zie [OpenAI server-side compaction](/nl/providers/openai#server-side-compaction-responses-api).
- `params`: globale standaardproviderparameters die op alle modellen worden toegepast. Ingesteld op `agents.defaults.params` (bijv. `{ cacheRetention: "long" }`).
- Mergeprioriteit voor `params` (configuratie): `agents.defaults.params` (globale basis) wordt overschreven door `agents.defaults.models["provider/model"].params` (per model), waarna `agents.list[].params` (overeenkomend agent-id) per sleutel overschrijft. Zie [Prompt Caching](/nl/reference/prompt-caching) voor details.
- `models.providers.openrouter.params.provider`: OpenRouter-breed standaard provider-routeringbeleid. OpenClaw stuurt dit door naar OpenRouter's aanvraagobject `provider`; per-model `agents.defaults.models["openrouter/<model>"].params.provider` en agentparams overschrijven per sleutel. Zie [OpenRouter provider routing](/nl/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: geavanceerde pass-through JSON die wordt samengevoegd in `api: "openai-completions"`-request bodies voor OpenAI-compatibele proxy's. Als dit botst met gegenereerde requestsleutels, wint de extra body; niet-native completions-routes strippen daarna nog steeds OpenAI-only `store`.
- `params.chat_template_kwargs`: vLLM/OpenAI-compatibele chat-template-argumenten die worden samengevoegd in top-level `api: "openai-completions"`-request bodies. Voor `vllm/nemotron-3-*` met thinking uit stuurt de gebundelde vLLM-Plugin automatisch `enable_thinking: false` en `force_nonempty_content: true`; expliciete `chat_template_kwargs` overschrijven gegenereerde standaarden, en `extra_body.chat_template_kwargs` heeft nog steeds de uiteindelijke prioriteit. Geconfigureerde vLLM Qwen- en Nemotron-thinking-modellen tonen binaire `/think`-keuzes (`off`, `on`) in plaats van de effort-ladder met meerdere niveaus.
- `compat.thinkingFormat`: OpenAI-compatibele payloadstijl voor thinking. Gebruik `"together"` voor Together-stijl `reasoning.enabled`, `"qwen"` voor Qwen-stijl top-level `enable_thinking`, of `"qwen-chat-template"` voor `chat_template_kwargs.enable_thinking` op Qwen-family backends die request-level chat-template kwargs ondersteunen, zoals vLLM. OpenClaw mapt uitgeschakelde thinking naar `false` en ingeschakelde thinking naar `true`, en geconfigureerde vLLM Qwen-modellen tonen binaire `/think`-keuzes voor deze formaten.
- `compat.supportedReasoningEfforts`: per-model OpenAI-compatibele lijst met reasoning-effort. Neem `"xhigh"` op voor aangepaste endpoints die het echt accepteren; OpenClaw toont dan `/think xhigh` in opdrachtmenu's, Gateway-sessierijen, sessiepatchvalidatie, agent-CLI-validatie en `llm-task`-validatie voor die geconfigureerde provider/model. Gebruik `compat.reasoningEffortMap` wanneer de backend een provider-specifieke waarde voor een canoniek niveau wil.
- `params.preserveThinking`: Z.AI-only opt-in voor bewaard thinking. Wanneer ingeschakeld en thinking aan staat, stuurt OpenClaw `thinking.clear_thinking: false` en speelt eerdere `reasoning_content` opnieuw af; zie [Z.AI thinking en bewaard thinking](/nl/providers/zai#thinking-and-preserved-thinking).
- `localService`: optionele procesmanager op provider-niveau voor lokale/zelf-gehoste modelservers. Wanneer het geselecteerde model bij die provider hoort, controleert OpenClaw `healthUrl` (of `baseUrl + "/models"`), start `command` met `args` als het endpoint down is, wacht maximaal `readyTimeoutMs`, en verstuurt daarna de modelaanvraag. `command` moet een absoluut pad zijn. `idleStopMs: 0` houdt het proces actief totdat OpenClaw afsluit; een positieve waarde stopt het door OpenClaw gestarte proces na zoveel milliseconden inactiviteit. Zie [Lokale modelservices](/nl/gateway/local-model-services).
- Runtimebeleid hoort op providers of modellen, niet op `agents.defaults`. Gebruik `models.providers.<provider>.agentRuntime` voor providerbrede regels of `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` voor modelspecifieke regels. OpenAI-agentmodellen op de officiële OpenAI-provider selecteren standaard Codex.
- Configuratieschrijvers die deze velden muteren (bijvoorbeeld `/models set`, `/models set-image` en opdrachten voor fallback toevoegen/verwijderen) slaan de canonieke objectvorm op en behouden bestaande fallbacklijsten waar mogelijk.
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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, een geregistreerde Plugin-harness-id of een ondersteunde CLI-backendalias. De meegeleverde Codex-Plugin registreert `codex`; de meegeleverde Anthropic-Plugin biedt de `claude-cli` CLI-backend.
- `id: "auto"` laat geregistreerde Plugin-harnesses ondersteunde beurten claimen en gebruikt OpenClaw wanneer geen harness overeenkomt. Een expliciete Plugin-runtime zoals `id: "codex"` vereist die harness en faalt gesloten als die niet beschikbaar is of faalt.
- `id: "pi"` wordt alleen geaccepteerd als verouderde alias voor `openclaw` om geleverde configuraties van v2026.5.22 en eerder te behouden. Nieuwe configuratie moet `openclaw` gebruiken.
- Runtimevoorrang is eerst exact modelbeleid (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` of `models.providers.<provider>.models[]`), daarna `agents.list[]` / `agents.defaults.models["provider/*"]`, daarna providerbreed beleid op `models.providers.<provider>.agentRuntime`.
- Runtime-sleutels voor de volledige agent zijn verouderd. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, runtime-pins voor sessies en `OPENCLAW_AGENT_RUNTIME` worden genegeerd door runtimeselectie. Voer `openclaw doctor --fix` uit om verouderde waarden te verwijderen.
- OpenAI-agentmodellen gebruiken standaard de Codex-harness; provider/model `agentRuntime.id: "codex"` blijft geldig wanneer je dat expliciet wilt maken.
- Voor Claude CLI-implementaties geef je de voorkeur aan `model: "anthropic/claude-opus-4-8"` plus modelgebonden `agentRuntime.id: "claude-cli"`. Verouderde `claude-cli/claude-opus-4-7`-modelverwijzingen blijven werken voor compatibiliteit, maar nieuwe configuratie moet provider/model-selectie canoniek houden en de uitvoeringsbackend in provider/model-runtimebeleid plaatsen.
- Dit regelt alleen de uitvoering van tekstuele agentbeurten. Mediageneratie, vision, PDF, muziek, video en TTS gebruiken nog steeds hun provider/model-instellingen.

**Ingebouwde aliassnelkoppelingen** (alleen van toepassing wanneer het model in `agents.defaults.models` staat):

| Alias               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Je geconfigureerde aliassen hebben altijd voorrang op standaardwaarden.

Z.AI GLM-4.x-modellen schakelen automatisch de denkmodus in, tenzij je `--thinking off` instelt of zelf `agents.defaults.models["zai/<model>"].params.thinking` definieert.
Z.AI-modellen schakelen standaard `tool_stream` in voor streaming van toolaanroepen. Stel `agents.defaults.models["zai/<model>"].params.tool_stream` in op `false` om dit uit te schakelen.
Anthropic Claude Opus 4.8 houdt denken standaard uit in OpenClaw; wanneer adaptief denken expliciet is ingeschakeld, is de provider-eigen inspanningsstandaard van Anthropic `high`. Claude 4.6-modellen gebruiken standaard `adaptive` wanneer geen expliciet denkniveau is ingesteld.

### `agents.defaults.cliBackends`

Optionele CLI-backends voor tekstuele terugvalruns (geen toolaanroepen). Handig als back-up wanneer API-providers falen.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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
- Doorgeven van afbeeldingen wordt ondersteund wanneer `imageArg` bestandspaden accepteert.
- `reseedFromRawTranscriptWhenUncompacted: true` laat een backend veilige
  ongeldig gemaakte sessies herstellen vanuit een begrensde ruwe OpenClaw-transcriptstaart voordat de
  eerste Compaction-samenvatting bestaat. Wijzigingen in auth-profiel of credential-epoch
  gebruiken nog steeds nooit raw-reseed.

### `agents.defaults.promptOverlays`

Provideronafhankelijke promptoverlays die per modelfamilie worden toegepast op door OpenClaw samengestelde promptoppervlakken. GPT-5-familie-model-id's ontvangen het gedeelde gedragscontract via OpenClaw/provider-routes; `personality` regelt alleen de vriendelijke laag voor interactiestijl. Native Codex-app-serverroutes behouden Codex-eigen basis-/modelinstructies in plaats van deze OpenClaw GPT-5-overlay, en OpenClaw schakelt de ingebouwde persoonlijkheid van Codex uit voor native threads.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

- `every`: duurtekenreeks (ms/s/m/h). Standaard: `30m` (API-key-auth) of `1h` (OAuth-auth). Stel in op `0m` om uit te schakelen.
- `includeSystemPromptSection`: wanneer false, laat dit de Heartbeat-sectie weg uit de systeemprompt en slaat het injectie van `HEARTBEAT.md` in de bootstrapcontext over. Standaard: `true`.
- `suppressToolErrorWarnings`: wanneer true, onderdrukt dit payloads met toolfoutwaarschuwingen tijdens Heartbeat-runs.
- `timeoutSeconds`: maximale tijd in seconden die is toegestaan voor een Heartbeat-agentbeurt voordat deze wordt afgebroken. Laat leeg om `agents.defaults.timeoutSeconds` te gebruiken wanneer ingesteld, anders de Heartbeat-cadans met een maximum van 600 seconden.
- `directPolicy`: beleid voor directe/DM-bezorging. `allow` (standaard) staat bezorging aan directe doelen toe. `block` onderdrukt bezorging aan directe doelen en geeft `reason=dm-blocked` uit.
- `lightContext`: wanneer true, gebruiken Heartbeat-runs lichte bootstrapcontext en behouden ze alleen `HEARTBEAT.md` uit workspace-bootstrapbestanden.
- `isolatedSession`: wanneer true, wordt elke Heartbeat uitgevoerd in een nieuwe sessie zonder eerdere gespreksgeschiedenis. Hetzelfde isolatiepatroon als Cron `sessionTarget: "isolated"`. Verlaagt de tokenkosten per Heartbeat van ~100K naar ~2-5K tokens.
- `skipWhenBusy`: wanneer true, stellen Heartbeat-runs uit op de extra bezette banen van die agent: het eigen sessiesleutelgebonden subagent- of geneste opdrachtwerk. Cron-banen stellen Heartbeats altijd uit, zelfs zonder deze vlag.
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
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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

- `mode`: `default` of `safeguard` (gechunkte samenvatting voor lange geschiedenissen). Zie [Compaction](/nl/concepts/compaction).
- `provider`: id van een geregistreerde compaction provider-plugin. Wanneer ingesteld, wordt de `summarize()` van de provider aangeroepen in plaats van de ingebouwde LLM-samenvatting. Valt bij een fout terug op de ingebouwde samenvatting. Het instellen van een provider dwingt `mode: "safeguard"` af. Zie [Compaction](/nl/concepts/compaction).
- `timeoutSeconds`: maximaal aantal seconden toegestaan voor één compaction-bewerking voordat OpenClaw deze afbreekt. Standaard: `180`.
- `keepRecentTokens`: agent-cut-pointbudget om de meest recente transcriptstaart letterlijk te behouden. Handmatige `/compact` respecteert dit wanneer het expliciet is ingesteld; anders is handmatige compaction een hard controlepunt.
- `identifierPolicy`: `strict` (standaard), `off` of `custom`. `strict` voegt ingebouwde richtlijnen voor behoud van ondoorzichtige identificatoren vooraan toe tijdens compaction-samenvatting.
- `identifierInstructions`: optionele aangepaste tekst voor identificatorbehoud die wordt gebruikt wanneer `identifierPolicy=custom`.
- `qualityGuard`: controles met opnieuw proberen bij onjuist gevormde uitvoer voor safeguard-samenvattingen. Standaard ingeschakeld in safeguard-modus; stel `enabled: false` in om de audit over te slaan.
- `midTurnPrecheck`: optionele drukcontrole voor de tool-lus. Wanneer `enabled: true`, controleert OpenClaw de contextdruk nadat toolresultaten zijn toegevoegd en vóór de volgende modelaanroep. Als de context niet meer past, breekt het de huidige poging af voordat de prompt wordt ingediend en hergebruikt het het bestaande precheck-herstelpad om toolresultaten in te korten of te compacten en opnieuw te proberen. Werkt met zowel `default`- als `safeguard`-compactionmodi. Standaard: uitgeschakeld.
- `postCompactionSections`: optionele AGENTS.md H2/H3-sectienamen om na compaction opnieuw in te voegen. Herinjectie is uitgeschakeld wanneer niet ingesteld of ingesteld op `[]`. Expliciet instellen op `["Session Startup", "Red Lines"]` schakelt dat paar in en behoudt de legacy fallback `Every Session`/`Safety`. Schakel dit alleen in wanneer de extra context het risico waard is dat projectrichtlijnen die al in de compaction-samenvatting zijn vastgelegd, worden gedupliceerd.
- `model`: optionele `provider/model-id` of kale alias uit `agents.defaults.models`, alleen voor compaction-samenvatting. Kale aliassen worden vóór dispatch opgelost; geconfigureerde letterlijke model-ID's behouden voorrang bij botsingen. Gebruik dit wanneer de hoofdsessie één model moet behouden maar compaction-samenvattingen op een ander model moeten draaien; wanneer niet ingesteld, gebruikt compaction het primaire model van de sessie.
- `maxActiveTranscriptBytes`: optionele bytedrempel (`number` of strings zoals `"20mb"`) die normale lokale compaction vóór een run activeert wanneer de actieve JSONL voorbij de drempel groeit. Vereist `truncateAfterCompaction`, zodat succesvolle compaction kan roteren naar een kleiner opvolgtranscript. Uitgeschakeld wanneer niet ingesteld of `0`.
- `notifyUser`: wanneer `true`, stuurt korte meldingen naar de gebruiker wanneer compaction start en wanneer deze is voltooid (bijvoorbeeld "Context compacten..." en "Compaction voltooid"). Standaard uitgeschakeld om compaction stil te houden.
- `memoryFlush`: stille agentische beurt vóór automatische compaction om duurzame herinneringen op te slaan. Stel `model` in op een exacte provider/model zoals `ollama/qwen3:8b` wanneer deze huishoudelijke beurt op een lokaal model moet blijven; de override erft de fallbackketen van de actieve sessie niet. Overgeslagen wanneer de werkruimte alleen-lezen is.

### `agents.defaults.runRetries`

Grenzen voor retry-iteraties van de buitenste run-lus voor de ingebedde agent-runtime om oneindige uitvoeringslussen tijdens foutherstel te voorkomen. Merk op dat deze instelling momenteel alleen van toepassing is op de ingebedde agent-runtime, niet op ACP- of CLI-runtimes.

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
        runRetries: { max: 50 }, // optionele overrides per agent
      },
    ],
  },
}
```

- `base`: basisaantal run-retry-iteraties voor de buitenste run-lus. Standaard: `24`.
- `perProfile`: extra run-retry-iteraties toegekend per kandidaat voor fallbackprofiel. Standaard: `8`.
- `min`: minimale absolute limiet voor run-retry-iteraties. Standaard: `32`.
- `max`: maximale absolute limiet voor run-retry-iteraties om uit de hand lopende uitvoering te voorkomen. Standaard: `160`.

### `agents.defaults.contextPruning`

Snoeit **oude toolresultaten** uit de in-memory context voordat deze naar de LLM wordt verzonden. Wijzigt **niet** de sessiegeschiedenis op schijf.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duur (ms/s/m/h), standaardeenheid: minuten
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Inhoud van oud toolresultaat gewist]" },
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
- `softTrimRatio` en `hardClearRatio` accepteren waarden van `0.0` tot en met `1.0`; configuratievalidatie weigert waarden buiten dat bereik.

**Zacht inkorten** behoudt begin + einde en voegt `...` in het midden in.

**Hard wissen** vervangt het volledige toolresultaat door de placeholder.

Opmerkingen:

- Afbeeldingsblokken worden nooit ingekort/gewist.
- Ratio's zijn gebaseerd op tekens (bij benadering), niet op exacte aantallen tokens.
- Als er minder dan `keepLastAssistants` assistentberichten bestaan, wordt snoeien overgeslagen.

</Accordion>

Zie [Sessie snoeien](/nl/concepts/session-pruning) voor gedragsdetails.

### Blokstreaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (gebruik minMs/maxMs)
    },
  },
}
```

- Niet-Telegram-kanalen vereisen expliciet `*.blockStreaming: true` om blokantwoorden in te schakelen.
- Kanaaloverrides: `channels.<channel>.blockStreamingCoalesce` (en varianten per account). Signal/Slack/Discord/Google Chat gebruiken standaard `minChars: 1500`.
- `humanDelay`: willekeurige pauze tussen blokantwoorden. `natural` = 800-2500 ms. Override per agent: `agents.list[].humanDelay`.

Zie [Streaming](/nl/concepts/streaming) voor gedrags- en chunkingdetails.

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
          // SecretRefs / inline inhoud ook ondersteund:
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
- `ssh`: generieke remote runtime met SSH-backend
- `openshell`: OpenShell-runtime

Wanneer `backend: "openshell"` is geselecteerd, verplaatsen runtime-specifieke instellingen naar
`plugins.entries.openshell.config`.

**SSH-backendconfiguratie:**

- `target`: SSH-doel in de vorm `user@host[:port]`
- `command`: SSH-clientopdracht (standaard: `ssh`)
- `workspaceRoot`: absolute remote root gebruikt voor werkruimten per scope
- `identityFile` / `certificateFile` / `knownHostsFile`: bestaande lokale bestanden die aan OpenSSH worden doorgegeven
- `identityData` / `certificateData` / `knownHostsData`: inline inhoud of SecretRefs die OpenClaw tijdens runtime materialiseert in tijdelijke bestanden
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host-key-beleidsknoppen

**SSH-authenticatievoorrang:**

- `identityData` wint van `identityFile`
- `certificateData` wint van `certificateFile`
- `knownHostsData` wint van `knownHostsFile`
- Door SecretRef ondersteunde `*Data`-waarden worden opgelost uit de actieve secrets-runtimesnapshot voordat de sandboxsessie start

**Gedrag van SSH-backend:**

- seedt de remote werkruimte eenmaal na aanmaken of opnieuw aanmaken
- houdt daarna de remote SSH-werkruimte canoniek
- routeert `exec`, bestandstools en mediapaden via SSH
- synchroniseert remote wijzigingen niet automatisch terug naar de host
- ondersteunt geen sandbox-browsercontainers

**Werkruimtetoegang:**

- `none`: sandboxwerkruimte per scope onder `~/.openclaw/sandboxes`
- `ro`: sandboxwerkruimte op `/workspace`, agentwerkruimte alleen-lezen gemount op `/agent`
- `rw`: agentwerkruimte lezen/schrijven gemount op `/workspace`

**Scope:**

- `session`: container + werkruimte per sessie
- `agent`: één container + werkruimte per agent (standaard)
- `shared`: gedeelde container en werkruimte (geen cross-sessie-isolatie)

**OpenShell-pluginconfiguratie:**

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

- `mirror`: seed de externe omgeving vanuit lokaal voor exec, synchroniseer terug na exec; de lokale werkruimte blijft canoniek
- `remote`: seed de externe omgeving eenmaal wanneer de sandbox wordt gemaakt, houd daarna de externe werkruimte canoniek

In `remote`-modus worden host-lokale bewerkingen die buiten OpenClaw zijn gemaakt niet automatisch naar de sandbox gesynchroniseerd na de seed-stap.
Transport is SSH naar de OpenShell-sandbox, maar de Plugin beheert de levenscyclus van de sandbox en optionele mirrorsynchronisatie.

**`setupCommand`** wordt eenmaal uitgevoerd na het maken van de container (via `sh -lc`). Vereist netwerk-egress, beschrijfbare root en rootgebruiker.

**Containers gebruiken standaard `network: "none"`** — stel dit in op `"bridge"` (of een aangepast bridge-netwerk) als de agent uitgaande toegang nodig heeft.
`"host"` wordt geblokkeerd. `"container:<id>"` wordt standaard geblokkeerd, tenzij je expliciet
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` instelt (noodoptie).
Codex-appserverbeurten in een actieve OpenClaw-sandbox gebruiken dezelfde egress-instelling voor hun native netwerktoegang in code-modus.

**Inkomende bijlagen** worden klaargezet in `media/inbound/*` in de actieve werkruimte.

**`docker.binds`** koppelt extra hostmappen; globale en agent-specifieke binds worden samengevoegd.

**Browser in sandbox** (`sandbox.browser.enabled`): Chromium + CDP in een container. noVNC-URL wordt in de systeemprompt geïnjecteerd. Vereist geen `browser.enabled` in `openclaw.json`.
noVNC-observertoegang gebruikt standaard VNC-authenticatie en OpenClaw geeft een kortlevende token-URL uit (in plaats van het wachtwoord in de gedeelde URL bloot te geven).

- `allowHostControl: false` (standaard) voorkomt dat sandboxsessies de hostbrowser aansturen.
- `network` gebruikt standaard `openclaw-sandbox-browser` (speciaal bridge-netwerk). Stel dit alleen in op `bridge` wanneer je expliciet globale bridge-connectiviteit wilt.
- `cdpSourceRange` beperkt optioneel CDP-ingress aan de containerrand tot een CIDR-bereik (bijvoorbeeld `172.21.0.1/32`).
- `sandbox.browser.binds` koppelt extra hostmappen alleen in de sandbox-browsercontainer. Wanneer dit is ingesteld (ook `[]`), vervangt het `docker.binds` voor de browsercontainer.
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
    ervan afhangt.
  - `--renderer-process-limit=2` kan worden gewijzigd met
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; stel `0` in om de standaardproceslimiet
    van Chromium te gebruiken.
  - plus `--no-sandbox` wanneer `noSandbox` is ingeschakeld.
  - Standaarden zijn de basislijn van de containerimage; gebruik een aangepaste browserimage met een aangepast
    entrypoint om containerstandaarden te wijzigen.

</Accordion>

Browser-sandboxing en `sandbox.docker.binds` zijn alleen voor Docker.

Images bouwen (vanuit een broncheckout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Voor npm-installaties zonder broncheckout, zie [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup) voor inline `docker build`-opdrachten.

### `agents.list` (agent-specifieke overrides)

Gebruik `agents.list[].tts` om een agent een eigen TTS-provider, stem, model,
stijl of automatische TTS-modus te geven. Het agentblok deep-merget over globale
`messages.tts`, zodat gedeelde aanmeldgegevens op één plek kunnen blijven terwijl afzonderlijke
agents alleen de stem- of providervelden overschrijven die ze nodig hebben. De override van de actieve agent
geldt voor automatische gesproken antwoorden, `/tts audio`, `/tts status` en
de `tts`-agenttool. Zie [Tekst-naar-spraak](/nl/tools/tts#per-agent-voice-overrides)
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
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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
- `default`: wanneer er meerdere zijn ingesteld, wint de eerste (waarschuwing gelogd). Als er geen is ingesteld, is het eerste lijstitem de standaard.
- `model`: stringvorm stelt een strikte agent-specifieke primaire waarde in zonder modelfallback; objectvorm `{ primary }` is ook strikt tenzij je `fallbacks` toevoegt. Gebruik `{ primary, fallbacks: [...] }` om die agent in fallback te laten deelnemen, of `{ primary, fallbacks: [] }` om strikt gedrag expliciet te maken. Cron-taken die alleen `primary` overschrijven, erven nog steeds standaardfallbacks tenzij je `fallbacks: []` instelt.
- `params`: agent-specifieke streamparameters samengevoegd over de geselecteerde modelvermelding in `agents.defaults.models`. Gebruik dit voor agent-specifieke overrides zoals `cacheRetention`, `temperature` of `maxTokens` zonder de hele modelcatalogus te dupliceren.
- `tts`: optionele agent-specifieke tekst-naar-spraak-overrides. Het blok deep-merget over `messages.tts`, dus bewaar gedeelde provideraanmeldgegevens en fallbackbeleid in `messages.tts` en stel hier alleen persona-specifieke waarden in, zoals provider, stem, model, stijl of automatische modus.
- `skills`: optionele agent-specifieke allowlist voor skills. Indien weggelaten, erft de agent `agents.defaults.skills` wanneer ingesteld; een expliciete lijst vervangt standaardwaarden in plaats van samen te voegen, en `[]` betekent geen Skills.
- `thinkingDefault`: optioneel standaard denkniveau per agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Overschrijft `agents.defaults.thinkingDefault` voor deze agent wanneer er geen override per bericht of sessie is ingesteld. Het geselecteerde provider-/modelprofiel bepaalt welke waarden geldig zijn; voor Google Gemini behoudt `adaptive` provider-eigen dynamisch denken (`thinkingLevel` weggelaten op Gemini 3/3.1, `thinkingBudget: -1` op Gemini 2.5).
- `reasoningDefault`: optionele agent-specifieke standaard voor redeneerzichtbaarheid (`on | off | stream`). Overschrijft `agents.defaults.reasoningDefault` voor deze agent wanneer er geen redeneer-override per bericht of sessie is ingesteld.
- `fastModeDefault`: optionele agent-specifieke standaard voor snelle modus (`"auto" | true | false`). Geldt wanneer er geen fast-mode-override per bericht of sessie is ingesteld.
- `models`: optionele agent-specifieke modelcatalogus-/runtime-overrides, gesleuteld op volledige `provider/model`-id's. Gebruik `models["provider/model"].agentRuntime` voor agent-specifieke runtime-uitzonderingen.
- `runtime`: optionele agent-specifieke runtimedescriptor. Gebruik `type: "acp"` met `runtime.acp`-standaarden (`agent`, `backend`, `mode`, `cwd`) wanneer de agent standaard ACP-harness-sessies moet gebruiken.
- `identity.avatar`: werkruimte-relatief pad, `http(s)`-URL of `data:`-URI.
- Lokale werkruimte-relatieve `identity.avatar`-afbeeldingsbestanden zijn beperkt tot 2 MB. `http(s)`-URL's en `data:`-URI's worden niet gecontroleerd met de lokale bestandsgroottelimiet.
- `identity` leidt standaardwaarden af: `ackReaction` uit `emoji`, `mentionPatterns` uit `name`/`emoji`.
- `subagents.allowAgents`: allowlist van geconfigureerde agent-id's voor expliciete `sessions_spawn.agentId`-doelen (`["*"]` = elk geconfigureerd doel; standaard: alleen dezelfde agent). Neem de requester-id op wanneer zelfgerichte `agentId`-aanroepen toegestaan moeten zijn. Verouderde vermeldingen waarvan de agentconfiguratie is verwijderd, worden door `sessions_spawn` geweigerd en weggelaten uit `agents_list`; voer `openclaw doctor --fix` uit om ze op te ruimen, of voeg een minimale `agents.list[]`-vermelding toe als dat doel spawnbaar moet blijven terwijl het standaardwaarden erft.
- Overervingsbescherming voor sandbox: als de requestersessie in een sandbox draait, weigert `sessions_spawn` doelen die zonder sandbox zouden draaien.
- `subagents.requireAgentId`: wanneer waar, blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af; standaard: false).

---

## Multi-agent-routering

Voer meerdere geïsoleerde agents uit binnen één Gateway. Zie [Multi-agent](/nl/concepts/multi-agent).

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

### Velden voor binding-match

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

Voor `type: "acp"`-vermeldingen lost OpenClaw op via exacte gespreksidentiteit (`match.channel` + account + `match.peer.id`) en gebruikt het de bovenstaande routeringsbindingslaagvolgorde niet.

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

Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor details over voorrang.

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
      mode: "enforce", // enforce (standaard) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duur of false
      maxDiskBytes: "500mb", // optioneel hard budget
      highWaterBytes: "400mb", // optioneel opschoondoel
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // standaard automatisch ontfocussen bij inactiviteit in uren (`0` schakelt uit)
      maxAgeHours: 0, // standaard harde maximumleeftijd in uren (`0` schakelt uit)
    },
    mainKey: "main", // verouderd (runtime gebruikt altijd "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details van sessievelden">

- **`scope`**: basissessie-groeperingsstrategie voor groepschatcontexten.
  - `per-sender` (standaard): elke afzender krijgt een geisoleerde sessie binnen een kanaalcontext.
  - `global`: alle deelnemers in een kanaalcontext delen een enkele sessie (gebruik dit alleen wanneer gedeelde context bedoeld is).
- **`dmScope`**: hoe DM's worden gegroepeerd.
  - `main`: alle DM's delen de hoofdsessie.
  - `per-peer`: isoleer op afzender-id over kanalen heen.
  - `per-channel-peer`: isoleer per kanaal + afzender (aanbevolen voor inboxen met meerdere gebruikers).
  - `per-account-channel-peer`: isoleer per account + kanaal + afzender (aanbevolen voor meerdere accounts).
- **`identityLinks`**: koppel canonieke id's aan peers met provider-prefix voor het delen van sessies tussen kanalen. Dock-opdrachten zoals `/dock_discord` gebruiken dezelfde kaart om de antwoordroute van de actieve sessie naar een andere gekoppelde kanaalpeer te schakelen; zie [Kanaaldocking](/nl/concepts/channel-docking).
- **`reset`**: primair resetbeleid. `daily` reset om lokale tijd `atHour`; `idle` reset na `idleMinutes`. Wanneer beide zijn geconfigureerd, wint wat het eerst verloopt. Dagelijkse resetversheid gebruikt `sessionStartedAt` van de sessierij; inactieve resetversheid gebruikt `lastInteractionAt`. Schrijfacties door achtergrond-/systeemevents zoals heartbeat, cron-wake-ups, exec-meldingen en gateway-boekhouding kunnen `updatedAt` bijwerken, maar houden dagelijkse/inactieve sessies niet vers.
- **`resetByType`**: overschrijvingen per type (`direct`, `group`, `thread`). Verouderde `dm` wordt geaccepteerd als alias voor `direct`.
- **`mainKey`**: verouderd veld. Runtime gebruikt altijd `"main"` voor de hoofd-bucket voor directe chats.
- **`agentToAgent.maxPingPongTurns`**: maximaal aantal antwoord-terug-beurten tussen agents tijdens agent-naar-agent-uitwisselingen (geheel getal, bereik: `0`-`20`, standaard: `5`). `0` schakelt pingpongketens uit.
- **`sendPolicy`**: match op `channel`, `chatType` (`direct|group|channel`, met verouderde `dm`-alias), `keyPrefix` of `rawKeyPrefix`. De eerste weigering wint.
- **`maintenance`**: opschonings- en retentie-instellingen voor session-store.
  - `mode`: `enforce` past opschoning toe en is de standaard; `warn` geeft alleen waarschuwingen.
  - `pruneAfter`: leeftijdsgrens voor verouderde items (standaard `30d`).
  - `maxEntries`: maximumaantal items in `sessions.json` (standaard `500`). Runtime schrijft batchopschoning met een kleine high-water-buffer voor productie-achtige limieten; `openclaw sessions cleanup --enforce` past de limiet direct toe.
  - Kortlevende Gateway-model-run-probesessies gebruiken vaste retentie van `24h`, maar opschoning is drukgestuurd: stale strikte model-run-proberijen worden alleen verwijderd wanneer onderhouds-/limietdruk voor sessie-items wordt bereikt. Alleen strikte expliciete probesleutels die overeenkomen met `agent:*:explicit:model-run-<uuid>` komen in aanmerking; normale directe, groeps-, thread-, cron-, hook-, heartbeat-, ACP- en sub-agentsessies erven deze 24u-retentie niet. Wanneer model-run-opschoning draait, draait die voor de bredere `pruneAfter`-opschoning van stale items en de `maxEntries`-limiet.
  - `rotateBytes`: verouderd en genegeerd; `openclaw doctor --fix` verwijdert dit uit oudere configuraties.
  - `resetArchiveRetention`: retentie voor `*.reset.<timestamp>`-transcriptarchieven. Standaard gelijk aan `pruneAfter`; stel in op `false` om uit te schakelen.
  - `maxDiskBytes`: optioneel schijfbudget voor de sessiemap. In `warn`-modus logt dit waarschuwingen; in `enforce`-modus verwijdert dit eerst de oudste artifacts/sessies.
  - `highWaterBytes`: optioneel doel na budgetopschoning. Standaard `80%` van `maxDiskBytes`.
- **`threadBindings`**: globale standaarden voor thread-gebonden sessiefuncties.
  - `enabled`: hoofdschakelaar voor de standaard (providers kunnen overschrijven; Discord gebruikt `channels.discord.threadBindings.enabled`)
  - `idleHours`: standaard automatisch ontfocussen bij inactiviteit in uren (`0` schakelt uit; providers kunnen overschrijven)
  - `maxAgeHours`: standaard harde maximumleeftijd in uren (`0` schakelt uit; providers kunnen overschrijven)
  - `spawnSessions`: standaardpoort voor het maken van thread-gebonden werksessies vanuit `sessions_spawn` en ACP-threadspawns. Standaard `true` wanneer thread bindings zijn ingeschakeld; providers/accounts kunnen overschrijven.
  - `defaultSpawnContext`: standaard native subagentcontext voor thread-gebonden spawns (`"fork"` of `"isolated"`). Standaard `"fork"`.

</Accordion>

---

## Berichten

```json5
{
  messages: {
    responsePrefix: "🦞", // of "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 schakelt uit
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

Resolutie (meest specifieke wint): account → kanaal → globaal. `""` schakelt uit en stopt de cascade. `"auto"` leidt `[{identity.name}]` af.

**Sjabloonvariabelen:**

| Variabele         | Beschrijving             | Voorbeeld                   |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Korte modelnaam          | `claude-opus-4-6`           |
| `{modelFull}`     | Volledige model-id       | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providernaam             | `anthropic`                 |
| `{thinkingLevel}` | Huidig denkniveau        | `high`, `low`, `off`        |
| `{identity.name}` | Naam van agentidentiteit | (hetzelfde als `"auto"`)    |

Variabelen zijn niet hoofdlettergevoelig. `{think}` is een alias voor `{thinkingLevel}`.

### Ack-reactie

- Standaard de `identity.emoji` van de actieve agent, anders `"👀"`. Stel in op `""` om uit te schakelen.
- Overschrijvingen per kanaal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Resolutievolgorde: account → kanaal → `messages.ackReaction` → identity-fallback.
- Scope: `group-mentions` (standaard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: verwijdert de ack na het antwoord op kanalen met reactie-ondersteuning, zoals Slack, Discord, Telegram, WhatsApp en iMessage.
- `messages.statusReactions.enabled`: schakelt levenscyclusstatusreacties in op Slack, Discord, Telegram en WhatsApp.
  Op Slack en Discord blijven niet-ingestelde statusreacties ingeschakeld wanneer ack-reacties actief zijn.
  Op Telegram en WhatsApp moet je dit expliciet op `true` zetten om levenscyclusstatusreacties in te schakelen.
- `messages.statusReactions.emojis`: overschrijft levenscyclus-emoji-sleutels:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` en `stallHard`.
  Telegram staat slechts een vaste reactieset toe, dus niet-ondersteunde geconfigureerde emoji vallen terug
  op de dichtstbijzijnde ondersteunde statusvariant voor die chat.

### Inbound-debounce

Bundelt snelle tekst-only berichten van dezelfde afzender in een enkele agentbeurt. Media/bijlagen flushen direct. Besturingsopdrachten omzeilen debouncing.

### TTS (tekst-naar-spraak)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` beheert de standaard auto-TTS-modus: `off`, `always`, `inbound` of `tagged`. `/tts on|off` kan lokale voorkeuren overschrijven, en `/tts status` toont de effectieve status.
- `summaryModel` overschrijft `agents.defaults.model.primary` voor automatische samenvattingen.
- `modelOverrides` is standaard ingeschakeld; `modelOverrides.allowProvider` staat standaard op `false` (opt-in).
- API-sleutels vallen terug op `ELEVENLABS_API_KEY`/`XI_API_KEY` en `OPENAI_API_KEY`.
- Meegeleverde spraakproviders zijn eigendom van plugins. Als `plugins.allow` is ingesteld, neem dan elke TTS-providerplugin op die je wilt gebruiken, bijvoorbeeld `microsoft` voor Edge TTS. De verouderde provider-id `edge` wordt geaccepteerd als alias voor `microsoft`.
- `providers.openai.baseUrl` overschrijft het OpenAI TTS-eindpunt. De volgorde voor resolutie is configuratie, daarna `OPENAI_TTS_BASE_URL`, daarna `https://api.openai.com/v1`.
- Wanneer `providers.openai.baseUrl` naar een niet-OpenAI-eindpunt verwijst, behandelt OpenClaw dit als een OpenAI-compatibele TTS-server en versoepelt het de validatie van model/stem.

---

## Talk

Standaarden voor de Talk-modus (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
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
          speakerVoice: "cedar",
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
- Verouderde platte Talk-sleutels (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) zijn alleen voor compatibiliteit. Voer `openclaw doctor --fix` uit om opgeslagen configuratie te herschrijven naar `talk.providers.<provider>`.
- Stem-id's vallen terug op `ELEVENLABS_VOICE_ID` of `SAG_VOICE_ID`.
- `providers.*.apiKey` accepteert plattetekstreeksen of SecretRef-objecten.
- De fallback `ELEVENLABS_API_KEY` geldt alleen wanneer er geen Talk-API-sleutel is geconfigureerd.
- Met `providers.*.voiceAliases` kunnen Talk-instructies vriendelijke namen gebruiken.
- `providers.mlx.modelId` selecteert de Hugging Face-repo die door de lokale macOS MLX-helper wordt gebruikt. Als dit is weggelaten, gebruikt macOS `mlx-community/Soprano-80M-bf16`.
- macOS MLX-weergave loopt via de meegeleverde `openclaw-mlx-tts`-helper wanneer die aanwezig is, of via een uitvoerbaar bestand op `PATH`; `OPENCLAW_MLX_TTS_BIN` overschrijft het helperpad voor ontwikkeling.
- `consultThinkingLevel` beheert het denkniveau voor de volledige OpenClaw-agentrun achter Control UI Talk realtime `openclaw_agent_consult`-aanroepen. Laat dit niet ingesteld om normaal sessie-/modelgedrag te behouden.
- `consultFastMode` stelt een eenmalige fast-mode-overschrijving in voor realtime consulten van Control UI Talk zonder de normale fast-mode-instelling van de sessie te wijzigen.
- `speechLocale` stelt de BCP 47-locale-id in die wordt gebruikt door iOS/macOS Talk-spraakherkenning. Laat dit niet ingesteld om de standaard van het apparaat te gebruiken.
- `silenceTimeoutMs` bepaalt hoe lang de Talk-modus wacht na stilte van de gebruiker voordat het transcript wordt verzonden. Niet ingesteld behoudt de standaard pauzeperiode van het platform (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` voegt providergerichte systeeminstructies toe aan de ingebouwde realtime prompt van OpenClaw, zodat de stemstijl kan worden geconfigureerd zonder de standaardbegeleiding voor `openclaw_agent_consult` te verliezen.
- `realtime.consultRouting` beheert de fallback van de Gateway-relay wanneer de realtime provider een definitief gebruikerstranscript produceert zonder `openclaw_agent_consult`: `provider-direct` behoudt directe providerantwoorden, terwijl `force-agent-consult` het afgeronde verzoek via OpenClaw routeert.

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — alle andere configuratiesleutels
- [Configuratie](/nl/gateway/configuration) — veelvoorkomende taken en snelle installatie
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)

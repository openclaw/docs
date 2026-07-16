---
read_when:
    - Standaardinstellingen voor agents afstemmen (modellen, denkproces, werkruimte, Heartbeat, media, Skills)
    - Routering en bindingen voor meerdere agents configureren
    - Sessies, berichtbezorging en gedrag van de praatmodus aanpassen
summary: Standaardinstellingen voor agents, multi-agentroutering, sessies, berichten en gespreksconfiguratie
title: Configuratie — agents
x-i18n:
    generated_at: "2026-07-16T15:35:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

Agentgebonden configuratiesleutels onder `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` en `talk.*`. Zie voor kanalen, tools, de Gateway-runtime en andere
sleutels op het hoogste niveau de [configuratiereferentie](/nl/gateway/configuration-reference).

## Standaardinstellingen voor agents

### `agents.defaults.workspace`

Standaard: `OPENCLAW_WORKSPACE_DIR` indien ingesteld, anders `~/.openclaw/workspace` (of `~/.openclaw/workspace-<profile>` wanneer `OPENCLAW_PROFILE` is ingesteld op een niet-standaardprofiel).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Een expliciete waarde voor `agents.defaults.workspace` heeft voorrang op
`OPENCLAW_WORKSPACE_DIR`. Gebruik de omgevingsvariabele om standaardagents
naar een aangekoppelde werkruimte te verwijzen wanneer je dat pad niet in de configuratie wilt opnemen.

### `agents.defaults.repoRoot`

Optionele hoofdmap van de repository die wordt weergegeven in de Runtime-regel van de systeemprompt. Indien niet ingesteld, detecteert OpenClaw deze automatisch door vanaf de werkruimte omhoog te lopen.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionele standaardtoelatingslijst voor Skills voor agents die
`agents.list[].skills` niet instellen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // neemt github en weather over
      { id: "docs", skills: ["docs-search"] }, // vervangt de standaardinstellingen
      { id: "locked-down", skills: [] }, // geen Skills
    ],
  },
}
```

- Laat `agents.defaults.skills` weg om standaard onbeperkte Skills toe te staan.
- Laat `agents.list[].skills` weg om de standaardinstellingen over te nemen.
- Stel `agents.list[].skills: []` in voor geen Skills.
- Een niet-lege lijst voor `agents.list[].skills` is de definitieve set voor die agent; deze
  wordt niet met de standaardinstellingen samengevoegd.

### `agents.defaults.skipBootstrap`

Schakelt het automatisch aanmaken van bootstrapbestanden voor de werkruimte uit (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Slaat het aanmaken van geselecteerde optionele werkruimtebestanden over, terwijl vereiste bootstrapbestanden (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`) nog steeds worden geschreven. Geldige waarden: `SOUL.md`, `USER.md`, `HEARTBEAT.md` en `IDENTITY.md`.

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

Bepaalt wanneer bootstrapbestanden van de werkruimte in de systeemprompt worden ingevoegd. Standaard: `"always"`.

- `"continuation-skip"`: bij veilige vervolgrondes (na een voltooid antwoord van de assistent) wordt het opnieuw invoegen van de werkruimtebootstrap overgeslagen, waardoor de prompt kleiner wordt. Heartbeat-uitvoeringen en nieuwe pogingen na Compaction bouwen de context nog steeds opnieuw op.
- `"never"`: schakel het invoegen van de werkruimtebootstrap en contextbestanden bij elke ronde uit. Gebruik dit alleen voor agents die hun promptlevenscyclus volledig zelf beheren (aangepaste contextengines, native runtimes die hun eigen context opbouwen of gespecialiseerde workflows zonder bootstrap). Ook bij Heartbeat- en herstelrondes na Compaction wordt het invoegen overgeslagen.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Overschrijving per agent: `agents.list[].contextInjection`. Weggelaten waarden nemen
`agents.defaults.contextInjection` over.

### `agents.defaults.bootstrapMaxChars`

Maximaal aantal tekens per bootstrapbestand van de werkruimte vóór afkapping. Standaard: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Overschrijving per agent: `agents.list[].bootstrapMaxChars`. Weggelaten waarden nemen
`agents.defaults.bootstrapMaxChars` over.

### `agents.defaults.bootstrapTotalMaxChars`

Maximaal totaal aantal tekens dat uit alle bootstrapbestanden van de werkruimte wordt ingevoegd. Standaard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Overschrijving per agent: `agents.list[].bootstrapTotalMaxChars`. Weggelaten waarden
nemen `agents.defaults.bootstrapTotalMaxChars` over.

### Overschrijvingen van bootstrapprofielen per agent

Gebruik overschrijvingen van bootstrapprofielen per agent wanneer één agent ander gedrag voor
promptinvoeging nodig heeft dan de gedeelde standaardinstellingen. Weggelaten velden nemen waarden over van
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

Bepaalt de voor de agent zichtbare melding in de systeemprompt wanneer de bootstrapcontext is afgekapt.
Standaard: `"always"`.

- `"off"`: voeg nooit tekst met een afkappingsmelding toe aan de systeemprompt.
- `"once"`: voeg eenmaal per unieke afkappingshandtekening een beknopte melding in.
- `"always"`: voeg bij elke uitvoering een beknopte melding in wanneer afkapping optreedt (aanbevolen).

Gedetailleerde aantallen voor onbewerkte en ingevoegde inhoud en velden voor configuratieafstemming blijven in diagnostische gegevens, zoals
context-/statusrapporten en logboeken; de normale gebruikers-/runtimecontext van WebChat krijgt alleen
de beknopte herstelmelding.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Eigendomskaart voor contextbudgetten

OpenClaw heeft meerdere omvangrijke prompt-/contextbudgetten, die
bewust per subsysteem zijn opgesplitst in plaats van allemaal via één algemene
instelling te lopen.

| Budget                                                         | Omvat                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Normale invoeging van de werkruimtebootstrap                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Eenmalige inleiding voor een modeluitvoering bij reset/opstart, inclusief recente dagelijkse `memory/*.md`-bestanden. Kale chatopdrachten `/new` en `/reset` worden bevestigd zonder het model aan te roepen |
| `skills.limits.*`                                              | De compacte lijst met Skills die in de systeemprompt wordt ingevoegd                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Begrensde runtimefragmenten en ingevoegde blokken die eigendom zijn van de runtime                                                                                                      |
| `memory.qmd.limits.*`                                          | Grootte van geïndexeerde fragmenten en invoegingen voor geheugenzoekopdrachten                                                                                                              |

Overeenkomende overschrijvingen per agent:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Bepaalt de opstartinleiding voor de eerste ronde die bij modeluitvoeringen tijdens reset/opstart wordt ingevoegd.
Kale chatopdrachten `/new` en `/reset` bevestigen de reset zonder
het model aan te roepen en laden deze inleiding dus niet.

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: standaardlimiet voor het `memory_get`-fragment voordat afkappingsmetadata
  en een vervolgmelding worden toegevoegd.
- `memoryGetDefaultLines`: standaardregelvenster voor `memory_get` wanneer `lines`
  is weggelaten.
- `toolResultMaxChars`: geavanceerde bovengrens voor live toolresultaten die wordt gebruikt voor opgeslagen
  resultaten en herstel bij overschrijding. Laat dit oningesteld voor de automatische limiet van de modelcontext:
  `16000` tekens onder 100K tokens, `32000` tekens bij 100K+ tokens en `64000`
  tekens bij 200K+ tokens. Expliciete waarden tot `1000000` worden geaccepteerd voor
  modellen met een lange context, maar de effectieve limiet blijft beperkt tot ongeveer 30% van
  het contextvenster van het model. `openclaw doctor --deep` toont de effectieve limiet
  en doctor waarschuwt alleen wanneer een expliciete overschrijving verouderd is of geen effect heeft.
- `postCompactionMaxChars`: limiet voor het AGENTS.md-fragment dat wordt gebruikt bij het opnieuw invoegen
  na Compaction.

#### `agents.list[].contextLimits`

Overschrijving per agent voor de gedeelde `contextLimits`-instellingen. Weggelaten velden nemen waarden over
van `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // geavanceerde bovengrens voor deze agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Algemene limiet voor de compacte lijst met Skills die in de systeemprompt wordt ingevoegd. Dit
heeft geen invloed op het naar behoefte lezen van `SKILL.md`-bestanden.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Overschrijving per agent voor het promptbudget voor Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maximale pixelgrootte voor de langste zijde van afbeeldingen in transcript-/toolafbeeldingsblokken vóór provideroproepen.
Standaard: `1200`.

Lagere waarden verminderen doorgaans het gebruik van vision-tokens en de grootte van aanvraagpayloads bij uitvoeringen met veel schermafbeeldingen.
Hogere waarden behouden meer visuele details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Voorkeur voor compressie/detail van de afbeeldingstool voor afbeeldingen die worden geladen vanuit bestandspaden, URL's en mediaverwijzingen.
Standaard: `auto`.

OpenClaw past de schaalverkleiningsreeks aan het geselecteerde afbeeldingsmodel aan. Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL en gehoste Llama 4-vision-modellen kunnen bijvoorbeeld grotere afbeeldingen gebruiken dan oudere/standaard vision-paden met veel details, terwijl rondes met meerdere afbeeldingen in de modus `auto` agressiever worden gecomprimeerd om token- en latentiekosten te beheersen.

Waarden:

- `auto`: aanpassen aan modellimieten en het aantal afbeeldingen.
- `efficient`: kleinere afbeeldingen verkiezen voor lager token- en bytegebruik.
- `balanced`: de standaard gebalanceerde reeks gebruiken.
- `high`: meer details behouden voor schermafbeeldingen, diagrammen en documentafbeeldingen.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Tijdzone voor de context van de systeemprompt (niet voor berichttijdstempels). Valt terug op de tijdzone van de host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Tijdnotatie in de systeemprompt. Standaard: `auto` (voorkeur van het besturingssysteem).

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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // algemene standaardparameters voor providers
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - De tekenreeksvorm stelt alleen het primaire model in.
  - De objectvorm stelt het primaire model plus geordende failovermodellen in.
- `utilityModel`: optionele `provider/model`-referentie of alias voor korte interne taken. Deze wordt momenteel gebruikt voor gegenereerde sessietitels in de Control UI, titels van Telegram-DM-onderwerpen, automatisch aangemaakte Discord-threadtitels en [vertelling bij voortgangsconcepten](/nl/concepts/progress-drafts#narrated-status). Wanneer deze niet is ingesteld, leidt OpenClaw waar beschikbaar de opgegeven standaard voor kleine modellen van de primaire provider af (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); anders vallen titeltaken terug op het primaire model van de agent en blijft vertelling uitgeschakeld. Stel `utilityModel: ""` in om routering van hulptaken volledig uit te schakelen. `agents.list[].utilityModel` overschrijft de standaard (een lege waarde per agent schakelt deze uit voor die agent), en een modelspecifieke overschrijving voor een bewerking heeft voorrang op beide. Hulptaken voeren afzonderlijke modelaanroepen uit en sturen taakspecifieke inhoud naar de geselecteerde modelprovider. Voor het genereren van dashboardtitels worden maximaal de eerste 1.000 tekens van het eerste bericht dat geen opdracht is verzonden; voor vertelling worden het inkomende verzoek plus compacte, geredigeerde samenvattingen van tools verzonden. Kies een provider die voldoet aan jouw vereisten voor kosten en gegevensverwerking.
- `imageModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt door het pad van de tool `image` gebruikt als configuratie voor het visiemodel wanneer het actieve model geen afbeeldingen kan verwerken. Modellen met ingebouwde visie ontvangen in plaats daarvan de geladen afbeeldingsbytes rechtstreeks.
  - Wordt ook gebruikt als terugvalroutering wanneer het geselecteerde/standaardmodel geen afbeeldingsinvoer kan verwerken.
  - Geef de voorkeur aan expliciete `provider/model`-referenties. Kale ID's worden voor compatibiliteit geaccepteerd; als een kale ID uniek overeenkomt met een geconfigureerde vermelding die afbeeldingen kan verwerken in `models.providers.*.models`, vult OpenClaw deze aan met die provider. Bij meerdere geconfigureerde overeenkomsten is een expliciet providervoorvoegsel vereist.
- `imageGenerationModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt gebruikt door de gedeelde mogelijkheid voor het genereren van afbeeldingen en elk toekomstig tool-/Plugin-oppervlak dat afbeeldingen genereert.
  - Gebruikelijke waarden: `google/gemini-3.1-flash-image-preview` voor ingebouwde Gemini-afbeeldingsgeneratie, `fal/fal-ai/flux/dev` voor fal, `openai/gpt-image-2` voor OpenAI Images of `openai/gpt-image-1.5` voor OpenAI-uitvoer als PNG/WebP met transparante achtergrond.
  - Als je rechtstreeks een provider/model selecteert, configureer dan ook de bijbehorende providerauthenticatie (bijvoorbeeld `GEMINI_API_KEY` of `GOOGLE_API_KEY` voor `google/*`, `OPENAI_API_KEY` of OpenAI Codex OAuth voor `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` voor `fal/*`).
  - Als dit wordt weggelaten, kan `image_generate` nog steeds een door authenticatie ondersteunde standaardprovider afleiden. Eerst wordt de huidige standaardprovider geprobeerd en daarna de overige geregistreerde providers voor afbeeldingsgeneratie, gesorteerd op provider-ID.
- `musicGenerationModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt gebruikt door de gedeelde mogelijkheid voor het genereren van muziek en de ingebouwde tool `music_generate`.
  - Gebruikelijke waarden: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` of `minimax/music-2.6`.
  - Als dit wordt weggelaten, kan `music_generate` nog steeds een door authenticatie ondersteunde standaardprovider afleiden. Eerst wordt de huidige standaardprovider geprobeerd en daarna de overige geregistreerde providers voor muziekgeneratie, gesorteerd op provider-ID.
  - Als je rechtstreeks een provider/model selecteert, configureer dan ook de bijbehorende providerauthenticatie/API-sleutel.
- `videoGenerationModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt gebruikt door de gedeelde mogelijkheid voor het genereren van video en de ingebouwde tool `video_generate`.
  - Gebruikelijke waarden: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` of `qwen/wan2.7-r2v`.
  - Als dit wordt weggelaten, kan `video_generate` nog steeds een door authenticatie ondersteunde standaardprovider afleiden. Eerst wordt de huidige standaardprovider geprobeerd en daarna de overige geregistreerde providers voor videogeneratie, gesorteerd op provider-ID.
  - Als je rechtstreeks een provider/model selecteert, configureer dan ook de bijbehorende providerauthenticatie/API-sleutel.
  - De officiële Qwen-Plugin voor videogeneratie ondersteunt maximaal 1 uitvoervideo, 1 invoerafbeelding, 4 invoervideo's, een duur van 10 seconden en de opties `size`, `aspectRatio`, `resolution`, `audio` en `watermark` op providerniveau.
- `pdfModel`: accepteert een tekenreeks (`"provider/model"`) of een object (`{ primary, fallbacks }`).
  - Wordt door de tool `pdf` gebruikt voor modelroutering.
  - Als dit wordt weggelaten, valt de PDF-tool terug op `imageModel` en vervolgens op het bepaalde sessie-/standaardmodel.
- `pdfMaxBytesMb`: standaardlimiet voor de PDF-grootte van de tool `pdf` wanneer `maxBytesMb` niet tijdens de aanroep wordt doorgegeven.
- `pdfMaxPages`: standaardmaximumaantal pagina's dat wordt meegenomen door de terugvalmodus voor extractie in de tool `pdf`.
- `verboseDefault`: standaardniveau voor uitgebreide uitvoer van agents. Waarden: `"off"`, `"on"`, `"full"`. Standaard: `"off"`.
- `toolProgressDetail`: detailmodus voor samenvattingen van de tool `/verbose` en toolregels in voortgangsconcepten. Waarden: `"explain"` (standaard, compacte voor mensen leesbare labels) of `"raw"` (voegt indien beschikbaar de onbewerkte opdracht/details toe). `agents.list[].toolProgressDetail` per agent overschrijft deze standaard.
- `reasoningDefault`: standaardzichtbaarheid van redeneringen voor agents. Waarden: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` per agent overschrijft deze standaard. Geconfigureerde standaardwaarden voor redeneringen worden alleen toegepast voor eigenaars, geautoriseerde afzenders of Gateway-contexten voor operatorbeheerders wanneer geen overschrijving voor redeneringen per bericht of sessie is ingesteld.
- `elevatedDefault`: standaardniveau voor uitvoer met verhoogde bevoegdheden voor agents. Waarden: `"off"`, `"on"`, `"ask"`, `"full"`. Standaard: `"on"`.
- `model.primary`: notatie `provider/model` (bijvoorbeeld `openai/gpt-5.6-sol` voor Codex OAuth-toegang). Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke overeenkomst met een geconfigureerde provider voor exact die model-ID, en valt pas daarna terug op de geconfigureerde standaardprovider (verouderd compatibiliteitsgedrag, dus geef de voorkeur aan een expliciete `provider/model`). Als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw terug op het eerste geconfigureerde provider/model in plaats van een verouderde standaardwaarde van een verwijderde provider te melden.
- `models`: de geconfigureerde modelcatalogus en acceptatielijst voor `/model`. Elke vermelding kan `alias` (snelkoppeling) en `params` (providerspecifiek, bijvoorbeeld `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter-routering via `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`) bevatten.
  - Gebruik `provider/*`-vermeldingen zoals `"openai/*": {}` of `"vllm/*": {}` om alle gevonden modellen voor geselecteerde providers weer te geven zonder elke model-ID handmatig te vermelden.
  - Voeg `agentRuntime` toe aan een `provider/*`-vermelding wanneer elk dynamisch gevonden model voor die provider dezelfde runtime moet gebruiken. Exact `provider/model`-runtimebeleid heeft nog steeds voorrang op het jokerteken.
  - Veilige bewerkingen: gebruik `openclaw config set agents.defaults.models '<json>' --strict-json --merge` om vermeldingen toe te voegen. `config set` weigert vervangingen die bestaande vermeldingen in de acceptatielijst zouden verwijderen, tenzij je `--replace` doorgeeft.
  - Providergebonden configuratie-/onboardingstromen voegen geselecteerde providermodellen samen in deze toewijzing en behouden reeds geconfigureerde, niet-gerelateerde providers.
  - Voor directe OpenAI Responses-modellen wordt Compaction aan de serverzijde automatisch ingeschakeld. Gebruik `params.responsesServerCompaction: false` om te stoppen met het invoegen van `context_management`, of `params.responsesCompactThreshold` om de drempelwaarde te overschrijven. Zie [Compaction aan de serverzijde van OpenAI](/nl/providers/openai#advanced-configuration).
- `params`: algemene standaardproviderparameters die op alle modellen worden toegepast. Stel deze in bij `agents.defaults.params` (bijvoorbeeld `{ cacheRetention: "long" }`).
- Samenvoegingsvolgorde van `params` (configuratie): `agents.defaults.params` (algemene basis) wordt overschreven door `agents.defaults.models["provider/model"].params` (per model), waarna `agents.list[].params` (overeenkomende agent-ID) per sleutel overschrijft. Zie [Promptcaching](/nl/reference/prompt-caching) voor details.
- `models.providers.openrouter.params.provider`: algemeen standaardbeleid voor providerroutering in OpenRouter. OpenClaw stuurt dit door naar het object `provider` van het OpenRouter-verzoek; `agents.defaults.models["openrouter/<model>"].params.provider` per model en agentparameters overschrijven per sleutel. Zie [Providerroutering van OpenRouter](/nl/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: geavanceerde rechtstreeks doorgegeven JSON die wordt samengevoegd in `api: "openai-completions"`-verzoekbody's voor OpenAI-compatibele proxy's. Bij een conflict met gegenereerde verzoeksleutels heeft de extra body voorrang; niet-ingebouwde completions-routes verwijderen daarna nog steeds `store`, dat uitsluitend voor OpenAI bestemd is.
- `params.chat_template_kwargs`: chattemplateargumenten voor vLLM/OpenAI-compatibele systemen die worden samengevoegd in `api: "openai-completions"`-verzoekbody's op het hoogste niveau. Voor `vllm/nemotron-3-*` met denken uitgeschakeld verzendt de meegeleverde vLLM-Plugin automatisch `enable_thinking: false` en `force_nonempty_content: true`; expliciete `chat_template_kwargs` overschrijven gegenereerde standaardwaarden en `extra_body.chat_template_kwargs` heeft nog steeds de uiteindelijke voorrang. Geconfigureerde denkmodellen van vLLM Qwen en Nemotron bieden binaire `/think`-keuzes (`off`, `on`) in plaats van de inspanningsladder met meerdere niveaus.
- `compat.thinkingFormat`: stijl van de OpenAI-compatibele payload voor denken. Gebruik `"together"` voor `reasoning.enabled` in Together-stijl, `"qwen"` voor `enable_thinking` op het hoogste niveau in Qwen-stijl, of `"qwen-chat-template"` voor `chat_template_kwargs.enable_thinking` op backends uit de Qwen-familie die chattemplate-kwargs op verzoekniveau ondersteunen, zoals vLLM. OpenClaw zet uitgeschakeld denken om in `false` en ingeschakeld denken in `true`; geconfigureerde vLLM Qwen-modellen bieden voor deze notaties binaire `/think`-keuzes.
- `compat.supportedReasoningEfforts`: lijst met OpenAI-compatibele redeneerinspanningen per model. Neem `"xhigh"` op voor aangepaste eindpunten die deze waarde daadwerkelijk accepteren; OpenClaw maakt `/think xhigh` vervolgens beschikbaar in opdrachtmenu's, Gateway-sessierijen, validatie van sessiepatches, validatie van de agent-CLI en `llm-task`-validatie voor die geconfigureerde provider/dat model. Gebruik `compat.reasoningEffortMap` wanneer de backend voor een canoniek niveau een providerspecifieke waarde verwacht.
- `params.preserveThinking`: uitsluitend voor Z.AI bedoelde opt-in voor behouden denkprocessen. Wanneer dit is ingeschakeld en denken aanstaat, verzendt OpenClaw `thinking.clear_thinking: false` en speelt het eerdere `reasoning_content` opnieuw af; zie [Denken en behouden denkprocessen in Z.AI](/nl/providers/zai#advanced-configuration).
- `localService`: optionele procesbeheerder op providerniveau voor lokale/zelfgehoste modelservers. Wanneer het geselecteerde model bij die provider hoort, test OpenClaw `healthUrl` (of `baseUrl + "/models"`), start het `command` met `args` als het eindpunt niet bereikbaar is, wacht het maximaal `readyTimeoutMs` en verzendt het daarna het modelverzoek. `command` moet een absoluut pad zijn. `idleStopMs: 0` houdt het proces actief totdat OpenClaw wordt afgesloten; een positieve waarde stopt het door OpenClaw gestarte proces na dat aantal milliseconden inactiviteit. Zie [Lokale modelservices](/nl/gateway/local-model-services).
- Runtimebeleid hoort bij providers of modellen, niet bij `agents.defaults`. Gebruik `models.providers.<provider>.agentRuntime` voor providerbrede regels of `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` voor modelspecifieke regels. Alleen een provider-/modelprefix selecteert nooit een harness. Als runtime niet is ingesteld of `auto` is, mag OpenAI Codex alleen impliciet selecteren voor een exacte officiële HTTPS-route voor Platform Responses of ChatGPT Responses zonder door de auteur opgegeven aanvraagoverride. Zie [Impliciete agentruntime van OpenAI](/nl/providers/openai#implicit-agent-runtime).
- Configuratieschrijvers die deze velden wijzigen (bijvoorbeeld `/models set`, `/models set-image` en fallback-opdrachten voor toevoegen/verwijderen), slaan de canonieke objectvorm op en behouden waar mogelijk bestaande fallbacklijsten.
- `maxConcurrent`: maximaal aantal parallelle agentuitvoeringen over sessies heen (elke sessie wordt nog steeds serieel uitgevoerd). Standaard: `4`.

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, een geregistreerde Plugin-harnas-id of een ondersteunde CLI-backendalias. De meegeleverde Codex-Plugin registreert `codex`; de meegeleverde Anthropic-Plugin biedt de CLI-backend `claude-cli`.
- `id: "auto"` laat geregistreerde Plugin-harnassen effectieve routes claimen die hun ondersteuningscontract declareren of er anderszins aan voldoen, en gebruikt OpenClaw wanneer geen harnas overeenkomt. Een expliciete Plugin-runtime zoals `id: "codex"` vereist dat harnas en een compatibele effectieve route; deze faalt gesloten als een van beide niet beschikbaar is of als de uitvoering mislukt.
- `id: "pi"` wordt alleen geaccepteerd als verouderde alias voor `openclaw` om uitgebrachte configuraties van v2026.5.22 en eerder te behouden. Nieuwe configuraties moeten `openclaw` gebruiken.
- De runtimeprioriteit is eerst exact modelbeleid (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` of `models.providers.<provider>.models[]`), daarna `agents.list[]` / `agents.defaults.models["provider/*"]` en vervolgens providerbreed beleid bij `models.providers.<provider>.agentRuntime`.
- Runtime-sleutels voor de volledige agent zijn verouderd. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, runtimevastleggingen voor sessies en `OPENCLAW_AGENT_RUNTIME` worden genegeerd bij de runtimeselectie. Voer `openclaw doctor --fix` uit om verouderde waarden te verwijderen.
- In aanmerking komende exacte officiële HTTPS-routes voor OpenAI Responses/ChatGPT zonder een zelf opgegeven aanvraagoverschrijving mogen impliciet het Codex-harnas gebruiken. Provider/model `agentRuntime.id: "codex"` maakt Codex een verplichting die gesloten faalt, maar maakt een incompatibele route niet compatibel.
- Geef voor Claude CLI-implementaties de voorkeur aan `model: "anthropic/claude-opus-4-8"` plus modelgebonden `agentRuntime.id: "claude-cli"`. Verouderde `claude-cli/<model>`-verwijzingen blijven werken voor compatibiliteit, maar nieuwe configuraties moeten de provider-/modelselectie canoniek houden en de uitvoeringsbackend in het runtimebeleid van de provider of het model plaatsen.
- Dit regelt alleen de uitvoering van tekstuele agentbeurten. Mediageneratie, beeldverwerking, PDF, muziek, video en TTS blijven hun provider-/modelinstellingen gebruiken.

**Ingebouwde verkorte aliassen** (alleen van toepassing wanneer het model in `agents.defaults.models` staat):

| Alias               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Jouw geconfigureerde aliassen hebben altijd voorrang op de standaardwaarden.

Z.AI GLM-4.x-modellen schakelen de denkmodus automatisch in, tenzij je `--thinking off` instelt of zelf `agents.defaults.models["zai/<model>"].params.thinking` definieert.
Z.AI-modellen schakelen `tool_stream` standaard in voor het streamen van toolaanroepen. Stel `agents.defaults.models["zai/<model>"].params.tool_stream` in op `false` om dit uit te schakelen.
Anthropic Claude Opus 4.8 laat denken standaard uitgeschakeld in OpenClaw; wanneer adaptief denken expliciet wordt ingeschakeld, is de inspanningsstandaard van de Anthropic-provider `high`. Claude 4.6-modellen gebruiken standaard `adaptive` wanneer geen expliciet denkniveau is ingesteld.

### `agents.defaults.cliBackends`

Optionele CLI-backends voor terugvaluitvoeringen met alleen tekst (geen toolaanroepen). Nuttig als reserve wanneer API-providers uitvallen.

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
          // Of gebruik systemPromptFileArg wanneer de CLI een vlag voor een promptbestand accepteert.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-backends zijn primair op tekst gericht; tools zijn altijd uitgeschakeld.
- Sessies worden ondersteund wanneer `sessionArg` is ingesteld.
- Het doorgeven van afbeeldingen wordt ondersteund wanneer `imageArg` bestandspaden accepteert.
- `reseedFromRawTranscriptWhenUncompacted: true` laat een backend veilig
  ongeldig gemaakte sessies herstellen vanuit een begrensde onbewerkte staart van het OpenClaw-transcript voordat de
  eerste Compaction-samenvatting bestaat. Wijzigingen aan het authenticatieprofiel of het referentie-epoch
  leiden nog steeds nooit tot opnieuw vullen met onbewerkte gegevens.

### `agents.defaults.promptOverlays`

Provideronafhankelijke promptoverlays die per modelfamilie worden toegepast op door OpenClaw samengestelde promptoppervlakken. Model-id's uit de GPT-5-familie ontvangen het gedeelde gedragscontract via OpenClaw-/providerroutes; `personality` regelt alleen de vriendelijke interactiestijllaag. Native Codex-app-serverroutes behouden de basis-/modelinstructies van Codex in plaats van deze GPT-5-overlay van OpenClaw, en OpenClaw schakelt de ingebouwde persoonlijkheid van Codex uit voor native threads.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // vriendelijk | aan | uit
        },
      },
    },
  },
}
```

- `"friendly"` (standaard) en `"on"` schakelen de vriendelijke interactiestijllaag in.
- `"off"` schakelt alleen de vriendelijke laag uit; het gelabelde GPT-5-gedragscontract blijft ingeschakeld.
- Verouderde `plugins.entries.openai.config.personality` wordt nog steeds gelezen wanneer deze gedeelde instelling niet is ingesteld.

### `agents.defaults.heartbeat`

Periodieke Heartbeat-uitvoeringen.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m schakelt uit
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // standaard: true; false laat de Heartbeat-sectie weg uit de systeemprompt
        lightContext: false, // standaard: false; true behoudt alleen HEARTBEAT.md uit de bootstrapbestanden van de werkruimte
        isolatedSession: false, // standaard: false; true voert elke heartbeat uit in een nieuwe sessie (zonder gespreksgeschiedenis)
        skipWhenBusy: false, // standaard: false; true wacht ook op de subagent-/geneste banen van deze agent
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (standaard) | block
        target: "none", // standaard: none | opties: last | whatsapp | telegram | discord | ...
        prompt: "Lees HEARTBEAT.md als het bestaat...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: duurtekenreeks (ms/s/m/h). Standaard: `30m` (authenticatie met API-sleutel) of `1h` (OAuth-authenticatie). Stel in op `0m` om uit te schakelen.
- `includeSystemPromptSection`: wanneer dit false is, wordt de Heartbeat-sectie weggelaten uit de systeemprompt en wordt de injectie van `HEARTBEAT.md` in de bootstrapcontext overgeslagen. Standaard: `true`.
- `suppressToolErrorWarnings`: wanneer dit true is, worden waarschuwingpayloads voor toolfouten tijdens Heartbeat-uitvoeringen onderdrukt.
- `timeoutSeconds`: de maximale toegestane tijd in seconden voor een Heartbeat-agentbeurt voordat deze wordt afgebroken. Laat dit oningesteld om `agents.defaults.timeoutSeconds` te gebruiken wanneer die is ingesteld; anders wordt het Heartbeat-interval gebruikt, begrensd op 600 seconden.
- `directPolicy`: beleid voor directe/DM-bezorging. `allow` (standaard) staat bezorging aan een direct doel toe. `block` onderdrukt bezorging aan een direct doel en genereert `reason=dm-blocked`.
- `lightContext`: wanneer dit true is, gebruiken Heartbeat-uitvoeringen een lichtgewicht bootstrapcontext en behouden ze alleen `HEARTBEAT.md` uit de bootstrapbestanden van de werkruimte.
- `isolatedSession`: wanneer dit true is, wordt elke Heartbeat uitgevoerd in een nieuwe sessie zonder eerdere gespreksgeschiedenis. Hetzelfde isolatiepatroon als Cron `sessionTarget: "isolated"`. Vermindert de tokenkosten per Heartbeat van ~100K naar ~2-5K tokens.
- `skipWhenBusy`: wanneer dit true is, worden Heartbeat-uitvoeringen uitgesteld bij extra bezette banen van die agent: het eigen sessiesleutelgebonden subagentwerk of geneste opdrachtwerk. Cron-banen stellen Heartbeats altijd uit, zelfs zonder deze vlag.
- Per agent: stel `agents.list[].heartbeat` in. Wanneer een agent `heartbeat` definieert, voeren **alleen die agents** Heartbeats uit.
- Heartbeats voeren volledige agentbeurten uit — kortere intervallen verbruiken meer tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id van een geregistreerde Plugin voor een Compaction-provider (optioneel)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Behoud implementatie-id's, ticket-id's en host:port-paren exact.", // gebruikt wanneer identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optionele controle van de druk op de toollus
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // kies voor herinjectie van AGENTS.md-secties
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionele modeloverschrijving uitsluitend voor Compaction
        truncateAfterCompaction: true, // roteer na Compaction naar een kleinere opvolgende JSONL
        maxActiveTranscriptBytes: "20mb", // optionele lokale Compaction-trigger tijdens de voorafgaande controle
        notifyUser: true, // meldingen wanneer Compaction start/voltooit en bij verslechtering van het wegschrijven van geheugen (standaard: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optionele modeloverschrijving uitsluitend voor het wegschrijven van geheugen
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "De sessie nadert Compaction. Sla duurzame herinneringen nu op.",
          prompt: "Schrijf blijvende notities naar memory/YYYY-MM-DD.md; antwoord met het exacte stille token NO_REPLY als er niets is om op te slaan.",
        },
      },
    },
  },
}
```

- `mode`: `default` of `safeguard` (samenvatting in delen voor lange geschiedenissen). Zie [Compaction](/nl/concepts/compaction).
- `provider`: id van een geregistreerde Plugin voor een Compaction-provider. Wanneer dit is ingesteld, wordt `summarize()` van de provider aangeroepen in plaats van de ingebouwde LLM-samenvatting. Bij een fout wordt teruggevallen op de ingebouwde functie. Het instellen van een provider dwingt `mode: "safeguard"` af. Zie [Compaction](/nl/concepts/compaction).
- `timeoutSeconds`: maximaal aantal seconden dat één Compaction-bewerking mag duren voordat OpenClaw deze afbreekt. Standaard: `180`.
- `reserveTokens`: tokenmarge die na Compaction beschikbaar blijft voor modeluitvoer en toekomstige toolresultaten. Wanneer het contextvenster van het model bekend is, begrenst OpenClaw de effectieve reserve zodat deze het promptbudget niet kan opgebruiken.
- `reserveTokensFloor`: minimale reserve die door de ingebedde runtime wordt afgedwongen. Stel `0` in om de ondergrens uit te schakelen. De ondergrens blijft onderworpen aan de actieve limiet van het contextvenster.
- `keepRecentTokens`: budget voor het afkappunt van de agent om het meest recente einde van het transcript letterlijk te behouden. Handmatige `/compact` houdt hiermee rekening wanneer dit expliciet is ingesteld; anders is handmatige Compaction een strikt controlepunt.
- `recentTurnsPreserve`: aantal meest recente beurten van gebruiker/assistent dat buiten de beveiligingssamenvatting letterlijk wordt behouden. Standaard: `3`.
- `maxHistoryShare`: maximale fractie van het totale contextbudget die na Compaction voor de behouden geschiedenis mag worden gebruikt (bereik `0.1`-`0.9`).
- `identifierPolicy`: `strict` (standaard), `off` of `custom`. `strict` voegt tijdens de Compaction-samenvatting ingebouwde richtlijnen voor het behoud van ondoorzichtige identificatoren vooraan toe.
- `identifierInstructions`: optionele aangepaste tekst voor het behoud van identificatoren die wordt gebruikt wanneer `identifierPolicy=custom`.
- `qualityGuard`: controles om bij onjuist gevormde uitvoer beveiligingssamenvattingen opnieuw te proberen. Standaard ingeschakeld in de beveiligingsmodus; stel `enabled: false` in om de controle over te slaan.
- `midTurnPrecheck`: optionele controle van de druk op de toollus. Wanneer `enabled: true`, controleert OpenClaw de contextdruk nadat toolresultaten zijn toegevoegd en vóór de volgende modelaanroep. Als de context niet meer past, breekt het de huidige poging af voordat de prompt wordt verzonden en gebruikt het het bestaande herstelpad van de voorafgaande controle opnieuw om toolresultaten af te kappen of Compaction uit te voeren en het opnieuw te proberen. Werkt met zowel de Compaction-modus `default` als `safeguard`. Standaard: uitgeschakeld.
- `postIndexSync`: modus voor het opnieuw indexeren van sessiegeheugen na Compaction. Standaard: `"async"`. Gebruik `"await"` voor de beste actualiteit, `"async"` voor een lagere Compaction-latentie of `"off"` alleen wanneer de synchronisatie van sessiegeheugen elders wordt afgehandeld.
- `postCompactionSections`: optionele namen van H2/H3-secties uit AGENTS.md die na Compaction opnieuw moeten worden ingevoegd. Opnieuw invoegen is uitgeschakeld wanneer dit niet is ingesteld of op `[]` is ingesteld. Door `["Session Startup", "Red Lines"]` expliciet in te stellen, wordt dat paar ingeschakeld en blijft de verouderde terugval op `Every Session`/`Safety` behouden. Schakel dit alleen in wanneer de extra context opweegt tegen het risico dat projectrichtlijnen worden gedupliceerd die al in de Compaction-samenvatting zijn opgenomen.
- `model`: optionele `provider/model-id` of kale alias uit `agents.defaults.models`, uitsluitend voor Compaction-samenvattingen. Kale aliassen worden vóór verzending omgezet; geconfigureerde letterlijke model-id's krijgen voorrang bij conflicten. Gebruik dit wanneer de hoofdsessie één model moet behouden, maar Compaction-samenvattingen op een ander model moeten worden uitgevoerd; wanneer dit niet is ingesteld, gebruikt Compaction het primaire model van de sessie.
- `truncateAfterCompaction`: roteert het actieve sessietranscript na Compaction, zodat toekomstige beurten alleen de samenvatting en het niet-samengevatte einde laden, terwijl het vorige volledige transcript gearchiveerd blijft. Voorkomt onbeperkte groei van het actieve transcript in langdurige sessies. Standaard: `false`.
- `maxActiveTranscriptBytes`: optionele drempelwaarde in bytes (`number` of tekenreeksen zoals `"20mb"`) die vóór een uitvoering normale lokale Compaction activeert wanneer de transcriptgeschiedenis de drempel overschrijdt. Vereist `truncateAfterCompaction`, zodat een geslaagde Compaction kan roteren naar een kleiner opvolgend transcript. Uitgeschakeld wanneer dit niet is ingesteld of `0` is.
- `notifyUser`: wanneer `true`, worden korte meldingen over contextonderhoud naar de gebruiker verzonden: wanneer Compaction begint en is voltooid (bijvoorbeeld "Context wordt gecomprimeerd..." en "Compaction voltooid"), en wanneer een geheugenopschoning vóór Compaction is uitgeput, zodat het antwoord in een beperkte toestand doorgaat (bijvoorbeeld "Geheugenonderhoud is tijdelijk mislukt; je antwoord wordt voortgezet."). Standaard uitgeschakeld om deze meldingen stil te houden.
- `memoryFlush`: stille agentische beurt vóór automatische Compaction om duurzame herinneringen op te slaan. Stel `model` in op een exacte provider/een exact model, zoals `ollama/qwen3:8b`, wanneer deze onderhoudsbeurt op een lokaal model moet blijven; de overschrijving neemt de actieve terugvalketen van de sessie niet over. `forceFlushTranscriptBytes` dwingt de opschoning af wanneer de transcriptgrootte de drempel bereikt, zelfs als tokentellers verouderd zijn. Wordt overgeslagen wanneer de werkruimte alleen-lezen is.

### `agents.defaults.runRetries`

Grenzen voor het aantal nieuwe pogingen van de buitenste uitvoeringslus voor de ingebedde agentruntime, om oneindige uitvoeringslussen tijdens foutherstel te voorkomen. Deze instelling is alleen van toepassing op de ingebedde agentruntime, niet op ACP- of CLI-runtimes.

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
        runRetries: { max: 50 }, // optionele overschrijvingen per agent
      },
    ],
  },
}
```

- `base`: basisaantal iteraties voor nieuwe uitvoeringspogingen in de buitenste uitvoeringslus. Standaard: `24`.
- `perProfile`: extra iteraties voor nieuwe uitvoeringspogingen die per kandidaat-terugvalprofiel worden toegekend. Standaard: `8`.
- `min`: minimale absolute limiet voor iteraties van nieuwe uitvoeringspogingen. Standaard: `32`.
- `max`: maximale absolute limiet voor iteraties van nieuwe uitvoeringspogingen om onbeheersbare uitvoering te voorkomen. Standaard: `160`.

### `agents.defaults.contextPruning`

Snoeit **oude toolresultaten** uit de context in het geheugen voordat deze naar de LLM wordt verzonden. Wijzigt de sessiegeschiedenis op schijf **niet**. Standaard uitgeschakeld; stel `mode: "cache-ttl"` in om dit in te schakelen.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (standaard) | cache-ttl
        ttl: "1h", // duur (ms/s/m/h), standaardeenheid: minuten; standaard: 5m
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

<Accordion title="gedrag van de modus cache-ttl">

- `mode: "cache-ttl"` schakelt snoeirondes in.
- `ttl` bepaalt hoe vaak opnieuw kan worden gesnoeid (na de laatste cache-aanraking). Standaard: `5m`.
- Bij het snoeien worden te grote toolresultaten eerst gedeeltelijk ingekort, waarna zo nodig oudere toolresultaten volledig worden gewist.
- `softTrimRatio` en `hardClearRatio` accepteren waarden van `0.0` tot en met `1.0`; configuratievalidatie wijst waarden buiten dat bereik af.

**Gedeeltelijk inkorten** behoudt het begin en einde en voegt `...` in het midden in.

**Volledig wissen** vervangt het volledige toolresultaat door de tijdelijke aanduiding.

Opmerkingen:

- Afbeeldingsblokken worden nooit ingekort/gewist.
- Verhoudingen zijn gebaseerd op tekens (bij benadering), niet op exacte aantallen tokens.
- Als er minder dan `keepLastAssistants` assistentberichten zijn, wordt het snoeien overgeslagen.

</Accordion>

Zie [Sessies snoeien](/nl/concepts/session-pruning) voor details over het gedrag.

### Bloksgewijs streamen

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (standaard) | natural | custom (gebruik minMs/maxMs)
    },
  },
}
```

- Voor andere kanalen dan Telegram is expliciete `*.streaming.block.enabled: true` vereist om blokantwoorden in te schakelen. QQ Bot is de uitzondering: deze heeft geen `streaming.block`-sleutels en streamt blokantwoorden, tenzij `channels.qqbot.streaming.mode` `"off"` is.
- Overschrijvingen per kanaal: `channels.<channel>.streaming.block.coalesce` (en varianten per account). Discord, Google Chat, Mattermost, MS Teams, Signal en Slack gebruiken standaard `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: voorkeursgrens voor blokken (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: willekeurige pauze tussen blokantwoorden. Standaard: `off`. `natural` = 800-2500ms. `custom` gebruikt `minMs`/`maxMs` (valt terug op het natuurlijke bereik voor elke niet-ingestelde grens). Overschrijving per agent: `agents.list[].humanDelay`.

Zie [Streamen](/nl/concepts/streaming) voor details over gedrag en opdeling in blokken.

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
- Standaardwaarde voor `typingIntervalSeconds`: `6`.
- Overschrijvingen per sessie: `session.typingMode`, `session.typingIntervalSeconds`.

Zie [Typindicatoren](/nl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionele sandboxing voor de ingebedde agent. Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige handleiding.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (standaard) | non-main | all
        backend: "docker", // docker (standaard) | ssh | openshell
        scope: "agent", // session | agent (standaard) | shared
        workspaceAccess: "none", // none (standaard) | ro | rw
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
          gpus: "all",
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
          // SecretRefs / inline-inhoud wordt ook ondersteund:
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

De hierboven getoonde standaardwaarden (`off`/`docker`/`agent`/`none`/`bookworm-slim`-image/`none`-netwerk/enz.) zijn de werkelijke standaardwaarden van OpenClaw, niet slechts illustratieve waarden.

<Accordion title="Sandboxdetails">

**Backend:**

- `docker`: lokale Docker-runtime (standaard)
- `ssh`: algemene externe runtime op basis van SSH
- `openshell`: OpenShell-runtime

Wanneer `backend: "openshell"` is geselecteerd, worden runtimespecifieke instellingen verplaatst naar
`plugins.entries.openshell.config`.

**Configuratie van de SSH-backend:**

- `target`: SSH-doel in de vorm `user@host[:port]`
- `command`: SSH-clientopdracht (standaard: `ssh`)
- `workspaceRoot`: absolute externe hoofdmap voor werkruimten per bereik (standaard: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: bestaande lokale bestanden die aan OpenSSH worden doorgegeven
- `identityData` / `certificateData` / `knownHostsData`: inline-inhoud of SecretRefs die OpenClaw tijdens runtime omzet in tijdelijke bestanden
- `strictHostKeyChecking` / `updateHostKeys`: instellingen voor het host-sleutelbeleid van OpenSSH (beide standaard `true`)

**Voorrangsvolgorde voor SSH-authenticatie:**

- `identityData` heeft voorrang op `identityFile`
- `certificateData` heeft voorrang op `certificateFile`
- `knownHostsData` heeft voorrang op `knownHostsFile`
- Door SecretRef ondersteunde `*Data`-waarden worden vanuit de actieve momentopname van de secrets-runtime opgehaald voordat de sandboxsessie start

**Gedrag van de SSH-backend:**

- vult de externe werkruimte eenmaal na het aanmaken of opnieuw aanmaken
- houdt daarna de externe SSH-werkruimte als canonieke werkruimte
- leidt `exec`, bestandstools en mediapaden via SSH
- synchroniseert externe wijzigingen niet automatisch terug naar de host
- ondersteunt geen sandboxbrowsercontainers

**Toegang tot de werkruimte:**

- `none`: sandboxwerkruimte per bereik onder `~/.openclaw/sandboxes` (standaard)
- `ro`: sandboxwerkruimte op `/workspace`, agentwerkruimte alleen-lezen gekoppeld op `/agent`
- `rw`: agentwerkruimte lezen/schrijven gekoppeld op `/workspace`

**Bereik:**

- `session`: container en werkruimte per sessie
- `agent`: één container en werkruimte per agent (standaard)
- `shared`: gedeelde container en werkruimte (geen isolatie tussen sessies)

**Configuratie van de OpenShell-plugin:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (standaard) | remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optioneel
          gatewayEndpoint: "https://lab.example", // optioneel
          policy: "strict", // optionele OpenShell-beleids-id
          providers: ["openai"], // optioneel
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell-modus:**

- `mirror`: vult extern vanuit lokaal vóór uitvoering en synchroniseert terug na uitvoering; de lokale werkruimte blijft canoniek
- `remote`: vult extern eenmaal wanneer de sandbox wordt aangemaakt en houdt daarna de externe werkruimte canoniek

In de modus `remote` worden lokale wijzigingen op de host die buiten OpenClaw zijn aangebracht, na de eerste vulling niet automatisch met de sandbox gesynchroniseerd.
Het transport verloopt via SSH naar de OpenShell-sandbox, maar de plugin beheert de levenscyclus van de sandbox en de optionele spiegelsynchronisatie.

**`setupCommand`** wordt eenmaal uitgevoerd nadat de container is aangemaakt (via `sh -lc`). Vereist uitgaand netwerkverkeer, een beschrijfbare hoofdmap en de rootgebruiker.

**Containers gebruiken standaard `network: "none"`** — stel dit in op `"bridge"` (of een aangepast bridgenetwerk) als de agent uitgaande toegang nodig heeft.
`"host"` wordt geblokkeerd. `"container:<id>"` wordt standaard geblokkeerd, tenzij je expliciet
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` instelt (noodtoegang).
Codex-app-serverbeurten in een actieve OpenClaw-sandbox gebruiken dezelfde instelling voor uitgaand verkeer voor hun eigen netwerktoegang in codemodus.

**Binnenkomende bijlagen** worden klaargezet in `media/inbound/*` in de actieve werkruimte.

**`docker.binds`** koppelt aanvullende hostmappen; globale koppelingen en koppelingen per agent worden samengevoegd.

**Sandboxbrowser** (`sandbox.browser.enabled`, standaard `false`): Chromium + CDP in een container. De noVNC-URL wordt in de systeemprompt ingevoegd. Vereist geen `browser.enabled` in `openclaw.json`.
Waarnemerstoegang via noVNC gebruikt standaard VNC-authenticatie en OpenClaw genereert een URL met een kortlevend token (in plaats van het wachtwoord in de gedeelde URL beschikbaar te stellen).

- `allowHostControl: false` (standaard) voorkomt dat sandboxsessies de hostbrowser als doel gebruiken.
- `network` is standaard ingesteld op `openclaw-sandbox-browser` (speciaal bridgenetwerk). Stel dit alleen in op `bridge` als je expliciet wereldwijde bridgeconnectiviteit wilt. `"host"` wordt hier ook geblokkeerd.
- `cdpSourceRange` beperkt optioneel de inkomende CDP-toegang aan de containerrand tot een CIDR-bereik (bijvoorbeeld `172.21.0.1/32`).
- `sandbox.browser.binds` koppelt aanvullende hostmappen uitsluitend in de sandboxbrowsercontainer. Wanneer dit is ingesteld (inclusief `[]`), vervangt het `docker.binds` voor de browsercontainer.
- Chromium in de sandboxbrowsercontainer wordt altijd gestart met `--no-sandbox --disable-setuid-sandbox` (containers beschikken niet over de kernelprimitieven die de eigen sandbox van Chrome vereist); hiervoor bestaat geen configuratieschakelaar.
- De standaardinstellingen voor het starten zijn gedefinieerd in `scripts/sandbox-browser-entrypoint.sh` en afgestemd op containerhosts:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` en `--disable-software-rasterizer` zijn
    standaard ingeschakeld en kunnen met
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` worden uitgeschakeld als gebruik van WebGL/3D dit vereist.
  - `--disable-extensions` (standaard ingeschakeld); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    schakelt extensies opnieuw in als je werkstroom ervan afhankelijk is.
  - standaard `--renderer-process-limit=2`; wijzig dit met
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, stel `0` in om de
    standaardproceslimiet van Chromium te gebruiken.
  - `--headless=new` alleen wanneer `headless` is ingeschakeld.
  - De standaardwaarden vormen de basislijn van de containerimage; gebruik een aangepaste browserimage met een aangepast
    ingangspunt om de standaardwaarden van de container te wijzigen.

</Accordion>

Browsersandboxing en `sandbox.docker.binds` werken alleen met Docker.

Images bouwen (vanuit een broncodecheckout):

```bash
scripts/sandbox-setup.sh           # hoofdimage voor de sandbox
scripts/sandbox-browser-setup.sh   # optionele browserimage
```

Zie voor npm-installaties zonder broncodecheckout [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup) voor inline `docker build`-opdrachten.

### `agents.list` (overschrijvingen per agent)

Gebruik `agents.list[].tts` om een agent een eigen TTS-provider, stem, model,
stijl of automatische TTS-modus te geven. Het agentblok wordt diep samengevoegd over de globale
`messages.tts`, zodat gedeelde aanmeldgegevens op één plaats kunnen blijven terwijl afzonderlijke
agents alleen de stem- of providervelden overschrijven die ze nodig hebben. De overschrijving van de actieve agent
is van toepassing op automatische gesproken antwoorden, `/tts audio`, `/tts status` en
de agenttool `tts`. Zie [Tekst-naar-spraak](/nl/tools/tts#per-agent-voice-overrides)
voor providervoorbeelden en de voorrangsvolgorde.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Hoofdagent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // of { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // overschrijving van denkniveau per agent
        reasoningDefault: "on", // overschrijving van zichtbaarheid van redenering per agent
        fastModeDefault: false, // overschrijving van snelle modus per agent
        params: { cacheRetention: "none" }, // overschrijft overeenkomende defaults.models-parameters per sleutel
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // vervangt agents.defaults.skills indien ingesteld
        identity: {
          name: "Samantha",
          theme: "behulpzame luiaard",
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
            mode: "persistent", // persistent | oneshot
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

- `id`: stabiele agent-id (verplicht).
- `default`: wanneer er meerdere zijn ingesteld, wint de eerste (waarschuwing wordt gelogd). Als er geen is ingesteld, is het eerste item in de lijst de standaard.
- `model`: de tekenreeksvorm stelt een strikte primaire optie per agent in zonder modelfallback; de objectvorm `{ primary }` is ook strikt, tenzij je `fallbacks` toevoegt. Gebruik `{ primary, fallbacks: [...] }` om fallback voor die agent in te schakelen, of `{ primary, fallbacks: [] }` om strikt gedrag expliciet te maken. Cron-taken die alleen `primary` overschrijven, nemen nog steeds de standaardfallbacks over, tenzij je `fallbacks: []` instelt.
- `utilityModel`: optionele overschrijving per agent voor korte interne taken, zoals gegenereerde sessie- en threadtitels. Valt terug op `agents.defaults.utilityModel`, daarna op het door de primaire provider opgegeven standaard kleine model en vervolgens op het primaire model van deze agent. Een lege tekenreeks schakelt utility-routering voor deze agent uit.
- `params`: streamparameters per agent die worden samengevoegd over het geselecteerde modelitem in `agents.defaults.models`. Gebruik dit voor agentspecifieke overschrijvingen zoals `cacheRetention`, `temperature` of `maxTokens`, zonder de volledige modelcatalogus te dupliceren.
- `tts`: optionele tekst-naar-spraakoverschrijvingen per agent. Het blok wordt diep samengevoegd over `messages.tts`; bewaar daarom gedeelde providerreferenties en fallbackbeleid in `messages.tts` en stel hier alleen personaspecifieke waarden in, zoals provider, stem, model, stijl of automatische modus.
- `skills`: optionele allowlist voor Skills per agent. Indien weggelaten, neemt de agent `agents.defaults.skills` over wanneer die is ingesteld; een expliciete lijst vervangt de standaardwaarden in plaats van ermee te worden samengevoegd, en `[]` betekent geen Skills.
- `thinkingDefault`: optioneel standaarddenkniveau per agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Overschrijft `agents.defaults.thinkingDefault` voor deze agent wanneer er geen overschrijving per bericht of sessie is ingesteld. Het geselecteerde provider-/modelprofiel bepaalt welke waarden geldig zijn; voor Google Gemini behoudt `adaptive` het door de provider beheerde dynamische denken (`thinkingLevel` weggelaten bij Gemini 3/3.1, `thinkingBudget: -1` bij Gemini 2.5).
- `reasoningDefault`: optionele standaardzichtbaarheid van redenering per agent (`on | off | stream`). Overschrijft `agents.defaults.reasoningDefault` voor deze agent wanneer er geen overschrijving van redenering per bericht of sessie is ingesteld.
- `fastModeDefault`: optionele standaardwaarde per agent voor de snelle modus (`"auto" | true | false`). Geldt wanneer er geen overschrijving van de snelle modus per bericht of sessie is ingesteld.
- `models`: optionele overschrijvingen per agent voor de modelcatalogus/runtime, geïndexeerd op volledige `provider/model`-id's. Gebruik `models["provider/model"].agentRuntime` voor runtime-uitzonderingen per agent.
- `runtime`: optionele runtimebeschrijving per agent. Gebruik `type: "acp"` met de standaardwaarden van `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) wanneer de agent standaard ACP-harnesssessies moet gebruiken.
- `identity.avatar`: werkruimte-relatief pad, `http(s)`-URL of `data:`-URI.
- Lokale werkruimte-relatieve `identity.avatar`-afbeeldingsbestanden zijn beperkt tot 2 MB. `http(s)`-URL's en `data:`-URI's worden niet getoetst aan de lokale bestandsgroottelimiet.
- `identity` leidt standaardwaarden af: `ackReaction` uit `emoji`, `mentionPatterns` uit `name`/`emoji`.
- `subagents.allowAgents`: allowlist van geconfigureerde agent-id's voor expliciete `sessions_spawn.agentId`-doelen (`["*"]` = elk geconfigureerd doel; standaard: alleen dezelfde agent). Neem de id van de aanvrager op wanneer op zichzelf gerichte `agentId`-aanroepen moeten zijn toegestaan. Verouderde items waarvan de agentconfiguratie is verwijderd, worden door `sessions_spawn` geweigerd en uit `agents_list` weggelaten; voer `openclaw doctor --fix` uit om ze op te ruimen, of voeg een minimale `agents.list[]`-vermelding toe als dat doel startbaar moet blijven terwijl het standaardwaarden overneemt.
- Beveiliging voor sandboxovername: als de sessie van de aanvrager in een sandbox draait, weigert `sessions_spawn` doelen die zonder sandbox zouden worden uitgevoerd.
- `subagents.requireAgentId`: blokkeer, indien waar, `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af; standaard: onwaar).
- `subagents.maxConcurrent`: maximaal aantal gelijktijdige uitvoeringen van onderliggende agents binnen de uitvoering van subagents. Standaard: `8`.
- `subagents.maxChildrenPerAgent`: maximaal aantal actieve onderliggende agents dat één agentsessie kan starten. Standaard: `5`.
- `subagents.maxSpawnDepth`: maximale nestingsdiepte voor het starten van subagents (`1`-`5`). Standaard: `1` (geen nesting).
- `subagents.archiveAfterMinutes`: tijd waarna de status van een voltooide subagent wordt gearchiveerd. Standaard: `60`.

---

## Routering met meerdere agents

Voer meerdere geïsoleerde agents uit binnen één Gateway. Zie [Meerdere agents](/nl/concepts/multi-agent).

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

### Overeenkomstvelden voor bindingen

- `type` (optioneel): `route` voor normale routering (een ontbrekend type gebruikt standaard route), `acp` voor permanente ACP-gespreksbindingen.
- `match.channel` (verplicht)
- `match.accountId` (optioneel; `*` = elk account; weggelaten = standaardaccount)
- `match.peer` (optioneel; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optioneel; kanaalspecifiek)
- `acp` (optioneel; alleen voor `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische overeenkomstvolgorde:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, zonder peer/guild/team)
5. `match.accountId: "*"` (voor het hele kanaal)
6. Standaardagent

Binnen elk niveau wint het eerste overeenkomende `bindings`-item.

Voor `type: "acp"`-items bepaalt OpenClaw de overeenkomst aan de hand van de exacte gespreksidentiteit (`match.channel` + account + `match.peer.id`) en gebruikt het niet de bovenstaande niveauvolgorde voor routeringsbindingen.

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

<Accordion title="Alleen-lezen-tools + werkruimte">

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

Zie [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools) voor details over de prioriteit.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
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
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // standaard automatisch niet meer focussen na inactiviteit in uren (`0` schakelt dit uit)
      maxAgeHours: 0, // standaard harde maximale leeftijd in uren (`0` schakelt dit uit)
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

- **`scope`**: basisstrategie voor het groeperen van sessies in groepschatcontexten.
  - `per-sender` (standaard): elke afzender krijgt een geïsoleerde sessie binnen een kanaalcontext.
  - `global`: alle deelnemers in een kanaalcontext delen één sessie (alleen gebruiken wanneer een gedeelde context bedoeld is).
- **`dmScope`**: hoe privéberichten worden gegroepeerd.
  - `main`: alle privéberichten delen de hoofdsessie.
  - `per-peer`: isoleren op afzender-id over alle kanalen heen.
  - `per-channel-peer`: isoleren per kanaal + afzender (aanbevolen voor inboxen met meerdere gebruikers).
  - `per-account-channel-peer`: isoleren per account + kanaal + afzender (aanbevolen voor meerdere accounts).
- **`identityLinks`**: canonieke id's koppelen aan peers met een providerprefix om sessies tussen kanalen te delen. Dockopdrachten zoals `/dock_discord` gebruiken dezelfde koppeling om de antwoordroute van de actieve sessie naar een andere gekoppelde kanaalpeer te schakelen; zie [Kanalen docken](/nl/concepts/channel-docking).
- **`reset`**: primair resetbeleid. `daily` reset om `atHour` lokale tijd; `idle` reset na `idleMinutes`. Wanneer beide zijn geconfigureerd, geldt degene die het eerst verloopt. De actualiteit voor dagelijkse resets gebruikt `sessionStartedAt` van de sessierij; de actualiteit voor inactiviteitsresets gebruikt `lastInteractionAt`. Schrijfbewerkingen door achtergrond-/systeemgebeurtenissen, zoals Heartbeat, Cron-wekacties, uitvoeringsmeldingen en Gateway-administratie, kunnen `updatedAt` bijwerken, maar houden dagelijkse/inactiviteitssessies niet actueel.
- **`resetByType`**: overschrijvingen per type (`direct`, `group`, `thread`). Verouderde `dm` wordt geaccepteerd als alias voor `direct`.
- **`resetByChannel`**: resetoverschrijvingen per kanaal, geïndexeerd op provider-/kanaal-id. Wanneer het kanaal van de sessie een overeenkomende vermelding heeft, heeft die voor die sessie onvoorwaardelijk voorrang op `resetByType`/`reset`. Alleen gebruiken wanneer één kanaal ander resetgedrag nodig heeft dan het beleid op typeniveau.
- **`mainKey`**: verouderd veld. De runtime gebruikt altijd `"main"` voor de hoofdbucket voor directe chats.
- **`agentToAgent.maxPingPongTurns`**: maximaal aantal beurten voor antwoorden tussen agents tijdens uitwisselingen van agent naar agent (geheel getal, bereik: `0`-`20`, standaard: `5`). `0` schakelt pingpongketens uit.
- **`sendPolicy`**: vergelijken op `channel`, `chatType` (`direct|group|channel`, met verouderde alias `dm`), `keyPrefix` of `rawKeyPrefix`. De eerste weigering geldt.
- **`maintenance`**: instellingen voor opschoning en bewaring van de sessieopslag.
  - `mode`: `enforce` voert opschoning uit en is de standaard; `warn` geeft alleen waarschuwingen.
  - `pruneAfter`: leeftijdsgrens voor verouderde vermeldingen (standaard `30d`).
  - `maxEntries`: maximaal aantal SQLite-sessievermeldingen (standaard `500`). De runtime schrijft batchopschoning met een kleine hoogwaterbuffer voor limieten van productieomvang; `openclaw sessions cleanup --enforce` past de limiet onmiddellijk toe.
  - Kortdurende Gateway-probesessies voor modelruns gebruiken een vaste bewaartermijn van `24h`, maar opschoning wordt alleen bij druk uitgevoerd: verouderde strikte proberijen voor modelruns worden alleen verwijderd wanneer onderhouds-/limietdruk voor sessievermeldingen wordt bereikt. Alleen strikte expliciete probesleutels die overeenkomen met `agent:*:explicit:model-run-<uuid>` komen in aanmerking; normale directe, groeps-, thread-, Cron-, hook-, Heartbeat-, ACP- en subagentsessies nemen deze bewaartermijn van 24 uur niet over. Wanneer opschoning van modelruns wordt uitgevoerd, gebeurt dit vóór de bredere opschoning van verouderde vermeldingen via `pruneAfter` en de limiet van `maxEntries`.
  - Verouderde `rotateBytes` wordt door het huidige schema geweigerd; `openclaw doctor --fix` verwijdert dit uit oudere configuraties.
  - `resetArchiveRetention`: leeftijdsgebonden bewaring voor geresette/verwijderde transcriptarchieven. Standaard blijven archieven behouden totdat ze vanwege het schijfquotum worden verwijderd; stel een duur in om verwijdering op basis van verstreken tijd in te schakelen, of `false` om dit expliciet uit te schakelen.
  - `maxDiskBytes`: optioneel schijfquotum voor de sessiemap. In de modus `warn` worden waarschuwingen gelogd; in de modus `enforce` worden de oudste artefacten/sessies eerst verwijderd.
  - `highWaterBytes`: optioneel doel na opschoning vanwege het quotum. Standaard `80%` van `maxDiskBytes`.
- **`writeLock`**: instellingen voor schrijfvergrendeling van sessietranscripten. Pas deze alleen aan wanneer legitieme voorbereiding, opschoning, Compaction of spiegeling van transcripten langer conflicteert dan het standaardbeleid toestaat.
  - `acquireTimeoutMs`: aantal milliseconden dat bij het verkrijgen van een vergrendeling wordt gewacht voordat de sessie als bezet wordt gemeld. Standaard: `60000`; omgevingsoverschrijving `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: aantal milliseconden waarna een bestaande vergrendeling als verouderd wordt beschouwd en opnieuw wordt opgeëist. Standaard: `1800000`; omgevingsoverschrijving `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: aantal milliseconden dat een binnen het proces vastgehouden vergrendeling vastgehouden mag blijven voordat de watchdog deze vrijgeeft. Standaard: `300000`; omgevingsoverschrijving `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: algemene standaardinstellingen voor threadgebonden sessiefuncties.
  - `enabled`: algemene standaardschakelaar (providers kunnen deze overschrijven; Discord gebruikt `channels.discord.threadBindings.enabled`)
  - `idleHours`: standaard automatisch opheffen van focus na inactiviteit, in uren (`0` schakelt dit uit; providers kunnen dit overschrijven)
  - `maxAgeHours`: standaard absolute maximale leeftijd in uren (`0` schakelt dit uit; providers kunnen dit overschrijven)
  - `spawnSessions`: standaardpoort voor het maken van threadgebonden werksessies vanuit `sessions_spawn` en het starten van ACP-threads. Standaard `true` wanneer threadbindingen zijn ingeschakeld; providers/accounts kunnen dit overschrijven.
  - `defaultSpawnContext`: standaardcontext van de systeemeigen subagent voor threadgebonden starts (`"fork"` of `"isolated"`). Standaard `"fork"`.

</Accordion>

---

## Berichten

```json5
{
  messages: {
    responsePrefix: "🦞", // of "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (standaard) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (standaard)
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

Resolutie (de meest specifieke geldt): account → kanaal → algemeen. `""` schakelt uit en stopt de cascade. `"auto"` leidt `[{identity.name}]` af.

**Sjabloonvariabelen:**

| Variabele          | Beschrijving            | Voorbeeld                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Korte modelnaam       | `claude-opus-4-6`           |
| `{modelFull}`     | Volledige model-id  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Providernaam          | `anthropic`                 |
| `{thinkingLevel}` | Huidig denkniveau | `high`, `low`, `off`        |
| `{identity.name}` | Naam van agentidentiteit    | (hetzelfde als `"auto"`)          |

Variabelen zijn niet hoofdlettergevoelig. `{think}` is een alias voor `{thinkingLevel}`.

### Bevestigingsreactie

- Standaard wordt `identity.emoji` van de actieve agent gebruikt, anders `"👀"`. Stel `""` in om dit uit te schakelen.
- Overschrijvingen per kanaal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Resolutievolgorde: account → kanaal → `messages.ackReaction` → terugval op identiteit.
- Bereik: `group-mentions` (standaard), `group-all`, `direct`, `all` of `off`/`none` (schakelt bevestigingsreacties volledig uit).
- `removeAckAfterReply`: verwijdert de bevestigingsreactie na het antwoord op kanalen die reacties ondersteunen, zoals Slack, Discord, Signal, Telegram, WhatsApp en iMessage.
- `messages.statusReactions.enabled`: schakelt levenscyclusstatusreacties in op Slack, Discord, Signal, Telegram en WhatsApp.
  Op Discord blijven statusreacties ingeschakeld als deze instelling niet is ingesteld en bevestigingsreacties actief zijn.
  Op Slack, Signal, Telegram en WhatsApp moet je deze expliciet instellen op `true` om levenscyclusstatusreacties in te schakelen.
  Slack gebruikt standaard de systeemeigen status van de assistentthread en afwisselende laadberichten voor de voortgang, terwijl de geconfigureerde bevestigingsreactie statisch blijft.
- `messages.statusReactions.emojis`: overschrijft emoji-sleutels voor de levenscyclus:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` en `stallHard`.
  Telegram staat alleen een vaste verzameling reacties toe, dus niet-ondersteunde geconfigureerde emoji vallen terug
  op de dichtstbijzijnde ondersteunde statusvariant voor die chat.

### Wachtrij

- `mode`: wachtrijstrategie voor inkomende berichten die binnenkomen terwijl een sessierun actief is. Standaard: `"steer"`.
  - `steer`: de nieuwe prompt in de actieve run invoegen.
  - `followup`: de nieuwe prompt uitvoeren nadat de actieve run is voltooid.
  - `collect`: compatibele berichten bundelen en later samen uitvoeren.
  - `interrupt`: de actieve run afbreken voordat de nieuwste prompt wordt gestart.
- `debounceMs`: vertraging voordat een bericht in de wachtrij of een bijgestuurd bericht wordt verzonden. Standaard: `500`.
- `cap`: maximaal aantal berichten in de wachtrij voordat het verwijderingsbeleid wordt toegepast. Standaard: `20`.
- `drop`: strategie wanneer de limiet wordt overschreden. `"summarize"` (standaard) verwijdert de oudste vermeldingen, maar behoudt compacte samenvattingen; `"old"` verwijdert de oudste zonder samenvattingen; `"new"` weigert het nieuwste item.
- `byChannel`: overschrijvingen per kanaal voor `mode`, geïndexeerd op provider-id.
- `debounceMsByChannel`: overschrijvingen per kanaal voor `debounceMs`, geïndexeerd op provider-id.

### Debounce voor inkomende berichten

Bundelt snel opeenvolgende berichten met alleen tekst van dezelfde afzender in één agentbeurt. Media/bijlagen worden onmiddellijk verwerkt. Besturingsopdrachten omzeilen debouncing. Standaard `debounceMs`: `2000`.

### Overige berichtsleutels

- `messages.messagePrefix`: prefixtekst die vóór inkomende gebruikersberichten wordt geplaatst voordat ze de runtime van de agent bereiken. Spaarzaam gebruiken voor kanaalcontextmarkeringen.
- `messages.visibleReplies`: bepaalt zichtbare bronantwoorden in directe, groeps- en kanaalgesprekken (`"message_tool"` vereist `message(action=send)` voor zichtbare uitvoer; `"automatic"` plaatst normale antwoorden zoals voorheen).
- `messages.usageTemplate` / `messages.responseUsage`: aangepaste `/usage`-voettekstsjabloon en standaardgebruiksmodus per antwoord (`off | tokens | full`, plus de verouderde alias `on` voor `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: triggers voor vermeldingen in groepsberichten en de grootte van het geschiedenisvenster.
- `messages.suppressToolErrors`: wanneer `true`, worden waarschuwingen over `⚠️`-toolfouten die aan de gebruiker worden getoond onderdrukt (de agent ziet de fouten nog steeds in de context en kan het opnieuw proberen). Standaard: `false`.

### TTS (tekst-naar-spraak)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (standaard) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` bepaalt de standaardmodus voor automatische TTS: `off`, `always`, `inbound` of `tagged`. `/tts on|off` kan lokale voorkeuren overschrijven en `/tts status` toont de effectieve status.
- `summaryModel` overschrijft `agents.defaults.model.primary` voor automatische samenvattingen.
- `modelOverrides` is standaard ingeschakeld (`enabled !== false`); `modelOverrides.allowProvider` moet expliciet worden ingeschakeld.
- API-sleutels vallen terug op `ELEVENLABS_API_KEY`/`XI_API_KEY` en `OPENAI_API_KEY`.
- De meegeleverde spraakproviders worden beheerd door plugins. Als `plugins.allow` is ingesteld, neem je elke TTS-providerplugin op die je wilt gebruiken, bijvoorbeeld `microsoft` voor Edge TTS. De verouderde provider-ID `edge` wordt geaccepteerd als alias voor `microsoft`.
- `providers.openai.baseUrl` overschrijft het OpenAI TTS-eindpunt. De volgorde van resolutie is configuratie, vervolgens `OPENAI_TTS_BASE_URL` en daarna `https://api.openai.com/v1`.
- Wanneer `providers.openai.baseUrl` naar een niet-OpenAI-eindpunt verwijst, behandelt OpenClaw dit als een OpenAI-compatibele TTS-server en versoepelt het de validatie van model en stem.

---

## Talk

Standaardinstellingen voor de Talk-modus (macOS/iOS/Android en de Control UI in de browser).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Spreek hartelijk en houd antwoorden kort.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` moet overeenkomen met een sleutel in `talk.providers` wanneer meerdere Talk-providers zijn geconfigureerd.
- Verouderde platte Talk-sleutels (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) zijn uitsluitend bedoeld voor compatibiliteit. Voer `openclaw doctor --fix` uit om de opgeslagen configuratie te herschrijven naar `talk.providers.<provider>`.
- Stem-ID's vallen terug op `ELEVENLABS_VOICE_ID` of `SAG_VOICE_ID` (gedrag van de macOS Talk-client).
- `providers.*.apiKey` accepteert tekenreeksen met platte tekst of SecretRef-objecten.
- Terugvallen op `ELEVENLABS_API_KEY` is alleen van toepassing wanneer er geen Talk-API-sleutel is geconfigureerd.
- `providers.*.voiceAliases` laat Talk-instructies gebruikmaken van begrijpelijke namen.
- `providers.mlx.modelId` selecteert de Hugging Face-repository die door de lokale MLX-helper van macOS wordt gebruikt. Als dit wordt weggelaten, gebruikt macOS `mlx-community/Soprano-80M-bf16`.
- Het afspelen met macOS MLX verloopt via de meegeleverde helper `openclaw-mlx-tts` wanneer deze aanwezig is, of via een uitvoerbaar bestand in `PATH`; `OPENCLAW_MLX_TTS_BIN` overschrijft het helperpad voor ontwikkeling.
- `consultThinkingLevel` bepaalt het denkniveau voor de volledige uitvoering van de OpenClaw-agent achter realtime `openclaw_agent_consult`-aanroepen van Control UI Talk. Laat dit oningesteld om het normale sessie- en modelgedrag te behouden.
- `consultFastMode` stelt een eenmalige overschrijving van de snelle modus in voor realtime raadplegingen van Control UI Talk, zonder de normale instelling voor de snelle modus van de sessie te wijzigen.
- `speechLocale` stelt de BCP 47-landinstellings-ID in die wordt gebruikt voor spraakherkenning van iOS/macOS Talk. Laat dit oningesteld om de standaardinstelling van het apparaat te gebruiken.
- `silenceTimeoutMs` bepaalt hoelang de Talk-modus na stilte van de gebruiker wacht voordat het transcript wordt verzonden. Als dit niet is ingesteld, blijft het standaardpauzevenster van het platform behouden (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` voegt systeeminstructies voor de provider toe aan de ingebouwde realtime-prompt van OpenClaw, zodat de stemstijl kan worden geconfigureerd zonder de standaardrichtlijnen van `openclaw_agent_consult` te verliezen.
- `realtime.vadThreshold` stelt de drempelwaarde voor spraakactiviteit van de provider in van `0` (meest gevoelig) tot `1` (minst gevoelig). Als dit niet is ingesteld, blijft de standaardinstelling van de provider behouden.
- `realtime.silenceDurationMs` stelt het positieve gehele stiltevenster in voordat de provider een realtime gebruikersbeurt vastlegt. Als dit niet is ingesteld, blijft de standaardinstelling van de provider behouden.
- `realtime.prefixPaddingMs` stelt de niet-negatieve gehele hoeveelheid audio in die behouden blijft voordat gedetecteerde spraak begint. Als dit niet is ingesteld, blijft de standaardinstelling van de provider behouden.
- `realtime.reasoningEffort` stelt het providerspecifieke redeneerniveau voor realtime sessies in. Als dit niet is ingesteld, blijft de standaardinstelling van de provider behouden.
- `realtime.consultRouting`: `"provider-direct"` (standaard) behoudt rechtstreekse antwoorden van de provider wanneer de realtime provider een definitief gebruikerstranscript produceert zonder `openclaw_agent_consult`. `"force-agent-consult"` leidt in plaats daarvan het voltooide verzoek via OpenClaw.

---

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference) — alle overige configuratiesleutels
- [Configuratie](/nl/gateway/configuration) — algemene taken en snelle installatie
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)

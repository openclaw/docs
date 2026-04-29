---
read_when:
    - Je wilt begrijpen welke functies betaalde API's kunnen aanroepen
    - U moet sleutels, kosten en inzicht in gebruik controleren
    - Je legt kostenrapportage voor /status of /usage uit
summary: Controleer wat kosten kan maken, welke sleutels worden gebruikt en hoe je het gebruik kunt bekijken
title: API-gebruik en kosten
x-i18n:
    generated_at: "2026-04-29T23:15:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# API-gebruik en kosten

Dit document vermeldt **functies die API-sleutels kunnen aanroepen** en waar hun kosten zichtbaar zijn. Het richt zich op
OpenClaw-functies die providergebruik of betaalde API-aanroepen kunnen genereren.

## Waar kosten zichtbaar zijn (chat + CLI)

**Kostensnapshot per sessie**

- `/status` toont het huidige sessiemodel, contextgebruik en tokens van het laatste antwoord.
- Als het model **API-sleutel-authenticatie** gebruikt, toont `/status` ook **geschatte kosten** voor het laatste antwoord.
- Als live sessiemetadata beperkt is, kan `/status` token-/cachetellers
  en het actieve runtime-modellabel herstellen uit het nieuwste gebruiksitem
  in het transcript. Bestaande niet-nul live waarden blijven voorrang houden, en promptgrote
  transcripttotalen kunnen winnen wanneer opgeslagen totalen ontbreken of kleiner zijn.

**Kostenvoetregel per bericht**

- `/usage full` voegt een gebruiksvoetregel toe aan elk antwoord, inclusief **geschatte kosten** (alleen API-sleutel).
- `/usage tokens` toont alleen tokens; abonnementsachtige OAuth-/token- en CLI-flows verbergen kosten in dollars.
- Gemini CLI-opmerking: wanneer de CLI JSON-uitvoer retourneert, leest OpenClaw gebruik uit
  `stats`, normaliseert `stats.cached` naar `cacheRead`, en leidt indien nodig invoertokens af
  uit `stats.input_tokens - stats.cached`.

Anthropic-opmerking: Anthropic-medewerkers hebben ons verteld dat Claude CLI-gebruik in OpenClaw-stijl
weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en `claude -p`-gebruik als
goedgekeurd voor deze integratie, tenzij Anthropic nieuw beleid publiceert.
Anthropic stelt nog steeds geen schatting van kosten in dollars per bericht beschikbaar die OpenClaw kan
tonen in `/usage full`.

**CLI-gebruiksvensters (providerquota)**

- `openclaw status --usage` en `openclaw channels list` tonen **gebruiksvensters** van providers
  (quotasnapshots, geen kosten per bericht).
- Menselijke uitvoer wordt genormaliseerd naar `X% left` voor alle providers.
- Huidige providers voor gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi en z.ai.
- MiniMax-opmerking: de ruwe velden `usage_percent` / `usagePercent` betekenen resterend
  quotum, dus OpenClaw keert ze om vóór weergave. Op aantallen gebaseerde velden winnen nog steeds
  wanneer ze aanwezig zijn. Als de provider `model_remains` retourneert, geeft OpenClaw de voorkeur aan het
  chatmodel-item, leidt het vensterlabel indien nodig af uit tijdstempels, en
  neemt de modelnaam op in het planlabel.
- Gebruiks-authenticatie voor die quotavensters komt uit providerspecifieke hooks wanneer
  beschikbaar; anders valt OpenClaw terug op overeenkomende OAuth-/API-sleutel-
  referenties uit authenticatieprofielen, env of config.

Zie [Tokengebruik en kosten](/nl/reference/token-use) voor details en voorbeelden.

## Hoe sleutels worden gevonden

OpenClaw kan referenties ophalen uit:

- **Authenticatieprofielen** (per agent, opgeslagen in `auth-profiles.json`).
- **Omgevingsvariabelen** (bijv. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) die sleutels kunnen exporteren naar de proces-env van de skill.

## Functies die sleutels kunnen uitgeven

### 1) Kernmodelantwoorden (chat + tools)

Elk antwoord of elke toolaanroep gebruikt de **huidige modelprovider** (OpenAI, Anthropic, enz.). Dit is de
primaire bron van gebruik en kosten.

Dit omvat ook abonnementsachtige gehoste providers die nog steeds buiten
de lokale UI van OpenClaw factureren, zoals **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, en
Anthropic's OpenClaw Claude-inlogpad met **Extra Usage** ingeschakeld.

Zie [Modellen](/nl/providers/models) voor prijsconfiguratie en [Tokengebruik en kosten](/nl/reference/token-use) voor weergave.

### 2) Mediabegrip (audio/afbeelding/video)

Inkomende media kunnen worden samengevat/getranscribeerd voordat het antwoord wordt uitgevoerd. Dit gebruikt model-/provider-API's.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Afbeelding: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Zie [Mediabegrip](/nl/nodes/media-understanding).

### 3) Afbeeldings- en videogeneratie

Gedeelde generatiemogelijkheden kunnen ook providersleutels uitgeven:

- Afbeeldingsgeneratie: OpenAI / Google / DeepInfra / fal / MiniMax
- Videogeneratie: DeepInfra / Qwen

Afbeeldingsgeneratie kan een door authenticatie ondersteunde providerstandaard afleiden wanneer
`agents.defaults.imageGenerationModel` niet is ingesteld. Videogeneratie vereist momenteel
een expliciete `agents.defaults.videoGenerationModel`, zoals
`qwen/wan2.6-t2v`.

Zie [Afbeeldingsgeneratie](/nl/tools/image-generation), [Qwen Cloud](/nl/providers/qwen),
en [Modellen](/nl/concepts/models).

### 4) Geheugenembeddings + semantisch zoeken

Semantisch geheugenzoeken gebruikt **embedding-API's** wanneer het is geconfigureerd voor externe providers:

- `memorySearch.provider = "openai"` → OpenAI-embeddings
- `memorySearch.provider = "gemini"` → Gemini-embeddings
- `memorySearch.provider = "voyage"` → Voyage-embeddings
- `memorySearch.provider = "mistral"` → Mistral-embeddings
- `memorySearch.provider = "deepinfra"` → DeepInfra-embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio-embeddings (lokaal/zelf gehost)
- `memorySearch.provider = "ollama"` → Ollama-embeddings (lokaal/zelf gehost; meestal geen gehoste API-facturering)
- Optionele fallback naar een externe provider als lokale embeddings mislukken

Je kunt het lokaal houden met `memorySearch.provider = "local"` (geen API-gebruik).

Zie [Geheugen](/nl/concepts/memory).

### 5) Webzoektool

`web_search` kan gebruikskosten veroorzaken, afhankelijk van je provider:

- **Brave Search API**: `BRAVE_API_KEY` of `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` of `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` of `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` of `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` of `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, of `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, of `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: zonder sleutel voor een bereikbare, lokaal aangemelde Ollama-host; direct zoeken via `https://ollama.com` gebruikt `OLLAMA_API_KEY`, en met authenticatie beschermde hosts kunnen normale bearer-authenticatie van de Ollama-provider hergebruiken
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, of `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` of `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback zonder sleutel (geen API-facturering, maar onofficieel en HTML-gebaseerd)
- **SearXNG**: `SEARXNG_BASE_URL` of `plugins.entries.searxng.config.webSearch.baseUrl` (zonder sleutel/zelf gehost; geen gehoste API-facturering)

Verouderde `tools.web.search.*`-providerpaden laden nog steeds via de tijdelijke compatibiliteitsshim, maar ze zijn niet langer het aanbevolen config-oppervlak.

**Gratis Brave Search-tegoed:** Elk Brave-plan bevat \$5/maand aan vernieuwend
gratis tegoed. Het Search-plan kost \$5 per 1.000 verzoeken, dus het tegoed dekt
1.000 verzoeken/maand zonder kosten. Stel je gebruikslimiet in het Brave-dashboard in
om onverwachte kosten te voorkomen.

Zie [Webtools](/nl/tools/web).

### 5) Webophaalttool (Firecrawl)

`web_fetch` kan **Firecrawl** aanroepen wanneer er een API-sleutel aanwezig is:

- `FIRECRAWL_API_KEY` of `plugins.entries.firecrawl.config.webFetch.apiKey`

Als Firecrawl niet is geconfigureerd, valt de tool terug op direct ophalen plus de gebundelde `web-readability`-Plugin (geen betaalde API). Schakel `plugins.entries.web-readability.enabled` uit om lokale Readability-extractie over te slaan.

Zie [Webtools](/nl/tools/web).

### 6) Providergebruikssnapshots (status/gezondheid)

Sommige statusopdrachten roepen **providergebruiks-eindpunten** aan om quotavensters of authenticatiegezondheid weer te geven.
Dit zijn doorgaans aanroepen met laag volume, maar ze raken nog steeds provider-API's:

- `openclaw status --usage`
- `openclaw models status --json`

Zie [Modellen-CLI](/nl/cli/models).

### 7) Samenvatting als Compaction-beveiliging

De Compaction-beveiliging kan sessiegeschiedenis samenvatten met het **huidige model**, wat
provider-API's aanroept wanneer het wordt uitgevoerd.

Zie [Sessiebeheer + Compaction](/nl/reference/session-management-compaction).

### 8) Modelscan / probe

`openclaw models scan` kan OpenRouter-modellen proben en gebruikt `OPENROUTER_API_KEY` wanneer
proben is ingeschakeld.

Zie [Modellen-CLI](/nl/cli/models).

### 9) Talk (spraak)

Talk-modus kan **ElevenLabs** aanroepen wanneer geconfigureerd:

- `ELEVENLABS_API_KEY` of `talk.providers.elevenlabs.apiKey`

Zie [Talk-modus](/nl/nodes/talk).

### 10) Skills (API's van derden)

Skills kunnen `apiKey` opslaan in `skills.entries.<name>.apiKey`. Als een skill die sleutel gebruikt voor externe
API's, kan dat kosten veroorzaken volgens de provider van de skill.

Zie [Skills](/nl/tools/skills).

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [Promptcaching](/nl/reference/prompt-caching)
- [Gebruikstracking](/nl/concepts/usage-tracking)

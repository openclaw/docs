---
read_when:
    - U wilt weten welke functies mogelijk betaalde API's aanroepen
    - Je moet sleutels, kosten en inzicht in het gebruik controleren
    - Je legt de kostenrapportage van /status of /usage uit
summary: Controleer wat geld kan kosten, welke sleutels worden gebruikt en hoe je het gebruik kunt bekijken
title: API-gebruik en kosten
x-i18n:
    generated_at: "2026-07-12T09:16:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Overzicht van OpenClaw-functies die betaalde provider-API's kunnen aanroepen, waar elke functie de referenties leest en waar de resulterende kosten worden weergegeven.

## Waar kosten worden weergegeven

**`/status`** (momentopname per sessie)

- Toont het huidige sessiemodel, contextgebruik en de tokens van het laatste antwoord.
- Voegt **geschatte kosten** voor het laatste antwoord toe wanneer OpenClaw over gebruiksmetadata en lokale prijsgegevens voor het actieve model beschikt, inclusief expliciet geprijsde providers zonder API-sleutel, zoals Bedrock-`aws-sdk`-modellen.
- Als de actuele sessiemomentopname weinig gegevens bevat, haalt `/status` de token-/cachetellers en het label van het actieve model op uit de nieuwste gebruiksvermelding in het transcript. Bestaande actuele waarden die niet nul zijn, krijgen voorrang op transcriptgegevens; een transcripttotaal ter grootte van de prompt kan alsnog voorrang krijgen wanneer het opgeslagen totaal ontbreekt of kleiner is.

**`/usage`** (voettekst per bericht)

- `/usage full` voegt aan elk antwoord een gebruiksvoettekst toe, inclusief **geschatte kosten** wanneer lokale prijsgegevens zijn geconfigureerd en gebruiksmetadata beschikbaar zijn.
- `/usage tokens` toont alleen tokens. OAuth-/token- en CLI-runtimes op abonnementsbasis tonen alleen tokens, tenzij ze compatibele gebruiksmetadata plus een expliciete lokale prijs leveren.
- `/usage cost` toont een lokaal kostenoverzicht; `/usage off` schakelt de voettekst uit.
- Opmerking over Gemini CLI: zowel `stream-json`- als verouderde `json`-uitvoer bevat gebruiksgegevens onder `stats`. OpenClaw normaliseert `stats.cached` naar `cacheRead` en leidt indien nodig invoertokens af uit `stats.input_tokens - stats.cached`.

**Control UI → Gebruik** (analyse over meerdere sessies)

- Toont uit transcripten afgeleide totalen voor tokens en geschatte kosten voor het geselecteerde datumbereik, uitgesplitst naar provider, model, agent, kanaal en tokentype.
- Vergelijkt kortere kalenderperioden die eindigen op de einddatum van het geselecteerde bereik. Ontbrekende datums tellen als kalenderdagen met nul gebruik; ze worden niet overgeslagen om een compactere periode te maken.
- Geeft de schaal van de dagelijkse grafiek rechtstreeks aan. Een `√`-badge betekent dat vierkantswortelcompressie dagen met weinig gebruik zichtbaar houdt.
- Deze totalen beschrijven de beschikbare lokale sessiegeschiedenis, niet een providerfactuur of een levenslang factureringsoverzicht. De UI waarschuwt wanneer prijsgegevens voor sommige vermeldingen ontbreken.

**CLI-gebruiksperioden** (providerquota, geen kosten per bericht)

- `openclaw status --usage` en `openclaw channels list` tonen **gebruiksperioden** van providers als `X% left`.
- Huidige providers met gebruiksperioden: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (omvat ChatGPT/Codex OAuth-/tokenverificatie), Xiaomi en z.ai. Zie [Modellen-CLI](/nl/cli/models) en [Kanalen-CLI](/nl/cli/channels) voor de volledige lijst met providers en vlaggen.
- De onbewerkte velden `usage_percent` / `usagePercent` van MiniMax geven het resterende quotum aan, dus OpenClaw keert deze waarden om; op aantallen gebaseerde velden krijgen voorrang wanneer ze aanwezig zijn. Als het antwoord een `model_remains`-array bevat, kiest OpenClaw de vermelding voor het chatmodel, leidt het indien nodig het label van de periode af uit tijdstempels en neemt het de modelnaam op in het abonnementslabel.
- Gebruiksverificatie komt uit providerspecifieke hooks wanneer die beschikbaar zijn; anders valt OpenClaw terug op overeenkomende OAuth-/API-sleutelreferenties uit verificatieprofielen, omgevingsvariabelen of configuratie.

Zie [Tokengebruik en kosten](/nl/reference/token-use) voor gedetailleerde voorbeelden.

<Note>
Anthropic heeft bevestigd dat hergebruik van Claude CLI (waaronder `claude -p`) een toegestane integratiemethode is, tenzij het bedrijf een nieuw beleid publiceert. Anthropic biedt geen schatting in dollars per bericht, waardoor `/usage full` geen kosten voor Claude CLI-gebruik kan tonen.
</Note>

## Hoe sleutels worden gevonden

- **Verificatieprofielen**: per agent, opgeslagen in `auth-profiles.json`.
- **Omgevingsvariabelen**: bijvoorbeeld `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Configuratie**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, waarmee de sleutel naar de procesomgeving van de Skill kan worden geëxporteerd.

## Functies die sleutels kunnen verbruiken

### Antwoorden van het kernmodel (chat + tools)

Elk antwoord en elke toolaanroep wordt uitgevoerd via de huidige modelprovider. Dit is de belangrijkste bron van gebruik en kosten, inclusief gehoste abonnementen die buiten de lokale UI van OpenClaw worden gefactureerd: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan en het Claude-aanmeldingstraject van Anthropic met Extra Usage ingeschakeld.

Zie [Modellen](/nl/providers/models) voor prijsconfiguratie en [Tokengebruik en kosten](/nl/reference/token-use) voor de weergave.

### Mediabegrip (audio/afbeeldingen/video)

Binnenkomende media kunnen via een provider-API worden samengevat of getranscribeerd voordat de antwoordpijplijn wordt uitgevoerd. Providerondersteuning wordt per Plugin geregistreerd en verandert wanneer Plugins worden toegevoegd; zie [Mediabegrip](/nl/nodes/media-understanding) voor de huidige lijst en configuratie.

### Afbeeldingen en video's genereren

`image_generate` en `video_generate` worden doorgestuurd naar een beschikbare geconfigureerde provider. Voor het genereren van afbeeldingen kan een standaardprovider met verificatie worden afgeleid wanneer `agents.defaults.imageGenerationModel` niet is ingesteld; voor het genereren van video's is een expliciet `agents.defaults.videoGenerationModel` vereist (bijvoorbeeld `qwen/wan2.6-t2v`).

Zie [Afbeeldingen genereren](/nl/tools/image-generation) en [Video's genereren](/nl/tools/video-generation) voor de huidige lijst met providers.

### Geheugenembeddings en semantisch zoeken

Semantisch zoeken in het geheugen gebruikt embedding-API's wanneer `agents.defaults.memorySearch.provider` een externe adapter benoemt (bijvoorbeeld `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memorySearch.provider = "lmstudio"` of `"ollama"` wordt uitgevoerd tegen een lokale/zelfgehoste server en brengt doorgaans geen kosten voor hosting met zich mee. `memorySearch.provider = "local"` houdt alles op het apparaat zonder API-gebruik. Een optionele provider voor `memorySearch.fallback` kan fouten bij lokale embeddings opvangen.

Zie [Geheugen](/nl/concepts/memory).

### Tool voor zoeken op het web

`web_search` kan gebruikskosten veroorzaken, afhankelijk van de geselecteerde provider. Elke provider leest de sleutel eerst uit een omgevingsvariabele en daarna uit `plugins.entries.<id>.config.webSearch.apiKey`:

| Provider               | Omgevingsvariabele(n)                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                              |
| DuckDuckGo             | zonder sleutel; onofficieel, gebaseerd op HTML, geen facturering                                                                                                             |
| Exa                    | `EXA_API_KEY`                                                                                                                                                                |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                          |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                             |
| Grok (xAI)             | xAI-OAuth-profiel of `XAI_API_KEY`                                                                                                                                           |
| Kimi (Moonshot)        | `KIMI_API_KEY` of `MOONSHOT_API_KEY`                                                                                                                                         |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` of `MINIMAX_API_KEY`                                                                                |
| Ollama Web Search      | zonder sleutel voor een bereikbare, aangemelde lokale host; rechtstreeks zoeken via `https://ollama.com` gebruikt `OLLAMA_API_KEY`; hosts met verificatie hergebruiken normale bearer-verificatie van de Ollama-provider |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                           |
| Perplexity Search API  | `PERPLEXITY_API_KEY` of `OPENROUTER_API_KEY`                                                                                                                                 |
| SearXNG                | `SEARXNG_BASE_URL`; zonder sleutel/zelfgehost, geen facturering voor hosting                                                                                                  |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                             |

Verouderde configuratiepaden onder `tools.web.search.*` worden nog steeds geladen via een compatibiliteitsshim, maar zijn niet langer de aanbevolen interface.

**Gratis tegoed van Brave Search**: elk abonnement omvat maandelijks $5 aan vernieuwend gratis tegoed. Het Search-abonnement kost $5 per 1.000 aanvragen, waardoor het tegoed 1.000 aanvragen per maand kosteloos dekt. Stel een gebruikslimiet in het Brave-dashboard in om onverwachte kosten te voorkomen.

Zie [Webtools](/nl/tools/web).

### Tool voor ophalen van het web (Firecrawl)

`web_fetch` kan Firecrawl aanroepen met sleutelvrije starterstoegang; voeg `FIRECRAWL_API_KEY` (of `plugins.entries.firecrawl.config.webFetch.apiKey`) toe voor hogere limieten. Als Firecrawl niet is geconfigureerd, valt de tool terug op rechtstreeks ophalen plus de meegeleverde Plugin `web-readability` (geen betaalde API). Schakel `plugins.entries.web-readability.enabled` uit om lokale Readability-extractie over te slaan.

Zie [Webtools](/nl/tools/web).

### Momentopnamen van providergebruik (status/gezondheid)

`openclaw status --usage` en `openclaw models status --json` roepen gebruikseindpunten van providers aan om quotaperioden of de status van verificatie te tonen. De aanroepen vinden niet vaak plaats, maar benaderen nog steeds provider-API's.

Zie [Modellen-CLI](/nl/cli/models).

### Beveiligde samenvatting bij Compaction

De beveiliging voor Compaction kan de sessiegeschiedenis samenvatten met het huidige model, waardoor provider-API's worden aangeroepen wanneer deze wordt uitgevoerd.

Zie [Sessiebeheer en Compaction](/nl/reference/session-management-compaction).

### Modellen scannen/testen

`openclaw models scan` kan OpenRouter-modellen testen en gebruikt `OPENROUTER_API_KEY` wanneer testen is ingeschakeld.

Zie [Modellen-CLI](/nl/cli/models).

### Spraakmodus

De spraakmodus kan ElevenLabs aanroepen wanneer dit is geconfigureerd: `ELEVENLABS_API_KEY` of `talk.providers.elevenlabs.apiKey`.

Zie [Spraakmodus](/nl/nodes/talk).

### Skills (API's van derden)

Skills kunnen `apiKey` opslaan in `skills.entries.<name>.apiKey`. Als een Skill die sleutel gebruikt voor een externe API, volgen de kosten de provider van de Skill.

Zie [Skills](/nl/tools/skills).

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [Promptcaching](/nl/reference/prompt-caching)
- [Gebruiksregistratie](/nl/concepts/usage-tracking)

---
read_when:
    - Je wilt prompttokenkosten verlagen met cachebehoud
    - Je hebt cachegedrag per agent nodig in multi-agent-opstellingen
    - Je stemt heartbeat- en cache-ttl-opschoning samen af
summary: Knoppen voor promptcaching, samenvoegvolgorde, providergedrag en afstemmingspatronen
title: Promptcaching
x-i18n:
    generated_at: "2026-07-01T18:17:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

Promptcaching betekent dat de modelprovider ongewijzigde promptvoorvoegsels (meestal systeem-/ontwikkelaarsinstructies en andere stabiele context) over beurten heen opnieuw kan gebruiken in plaats van ze elke keer opnieuw te verwerken. OpenClaw normaliseert providergebruik naar `cacheRead` en `cacheWrite` wanneer de upstream-API die tellers rechtstreeks beschikbaar stelt.

Statusoppervlakken kunnen cachetellers ook herstellen uit het meest recente transcriptgebruiklogboek wanneer ze ontbreken in de live sessiesnapshot, zodat `/status` een cacheregel kan blijven tonen na gedeeltelijk verlies van sessiemetadata. Bestaande niet-nul live cachewaarden blijven voorrang houden op transcriptfallbackwaarden.

Waarom dit ertoe doet: lagere tokenkosten, snellere antwoorden en voorspelbaardere prestaties voor langlopende sessies. Zonder caching betalen herhaalde prompts bij elke beurt de volledige promptkosten, zelfs wanneer de meeste invoer niet is gewijzigd.

De secties hieronder behandelen elke cachegerelateerde knop die invloed heeft op prompt-hergebruik en tokenkosten.

Providerreferenties:

- Anthropic promptcaching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI promptcaching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API-headers en aanvraag-ID's: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic aanvraag-ID's en fouten: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Primaire knoppen

### `cacheRetention` (globale standaard, model en per agent)

Stel cachebehoud in als globale standaard voor alle modellen:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Overschrijf per model:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Overschrijving per agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Volgorde voor configuratiesamenvoeging:

1. `agents.defaults.params` (globale standaard — geldt voor alle modellen)
2. `agents.defaults.models["provider/model"].params` (overschrijving per model)
3. `agents.list[].params` (overeenkomende agent-id; overschrijft per sleutel)

### `contextPruning.mode: "cache-ttl"`

Snoeit oude toolresultaatcontext na cache-TTL-vensters, zodat aanvragen na inactiviteit geen te grote geschiedenis opnieuw cachen.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Zie [Sessiesnoeiing](/nl/concepts/session-pruning) voor volledig gedrag.

### Heartbeat warm houden

Heartbeat kan cachevensters warm houden en herhaalde cachewrites na perioden van inactiviteit verminderen.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agent wordt ondersteund op `agents.list[].heartbeat`.

## Providergedrag

### Anthropic (directe API)

- `cacheRetention` wordt ondersteund.
- Met Anthropic API-sleutel-authprofielen stelt OpenClaw `cacheRetention: "short"` in voor Anthropic-modelrefs wanneer dit niet is ingesteld.
- Native Anthropic Messages-antwoorden stellen zowel `cache_read_input_tokens` als `cache_creation_input_tokens` beschikbaar, zodat OpenClaw zowel `cacheRead` als `cacheWrite` kan tonen.
- Voor native Anthropic-aanvragen wordt `cacheRetention: "short"` toegewezen aan de standaard 5-minuten tijdelijke cache, en `cacheRetention: "long"` upgrade alleen op directe `api.anthropic.com`-hosts naar de TTL van 1 uur.

### OpenAI (directe API)

- Promptcaching is automatisch op ondersteunde recente modellen. OpenClaw hoeft geen cachemarkeringen op blokniveau te injecteren.
- OpenClaw gebruikt `prompt_cache_key` om cacherouting over beurten heen stabiel te houden. Directe OpenAI-hosts gebruiken `prompt_cache_retention: "24h"` wanneer `cacheRetention: "long"` is geselecteerd.
- OpenAI-compatibele Completions-providers ontvangen `prompt_cache_key` alleen wanneer hun modelconfiguratie expliciet `compat.supportsPromptCacheKey: true` instelt. Doorsturen van lang behoud is een aparte mogelijkheid: expliciete `cacheRetention: "long"` verzendt `prompt_cache_retention: "24h"` alleen wanneer die compat-entry ook lang cachebehoud ondersteunt. Providers zoals Mistral kunnen zich aanmelden voor cachesleutels terwijl ze `compat.supportsLongCacheRetention: false` instellen om het veld voor lang behoud te onderdrukken. `cacheRetention: "none"` onderdrukt beide velden.
- OpenAI-antwoorden stellen gecachte prompttokens beschikbaar via `usage.prompt_tokens_details.cached_tokens` (of `input_tokens_details.cached_tokens` op Responses API-events). OpenClaw wijst dat toe aan `cacheRead`.
- GPT-5.6 Responses-gebruik kan ook `input_tokens_details.cache_write_tokens` beschikbaar stellen. OpenClaw wijst dat toe aan `cacheWrite` en prijst het tegen het cachewrite-tarief van het model; Responses die het veld weglaten houden `cacheWrite` op `0`.
- OpenAI retourneert nuttige traceer- en rate-limit-headers zoals `x-request-id`, `openai-processing-ms` en `x-ratelimit-*`, maar cache-hitboekhouding moet uit de gebruikspayload komen, niet uit headers.
- In de praktijk gedraagt OpenAI zich vaak als een initiële-voorvoegselcache in plaats van Anthropic-achtig bewegend volledig-geschiedenis-hergebruik. Stabiele tekstbeurten met lange voorvoegsels kunnen in huidige liveprobes dicht bij een plateau van `4864` gecachte tokens uitkomen, terwijl toolzware of MCP-achtige transcripten vaak rond `4608` gecachte tokens plateauën, zelfs bij exacte herhalingen.

### Anthropic Vertex

- Anthropic-modellen op Vertex AI (`anthropic-vertex/*`) ondersteunen `cacheRetention` op dezelfde manier als direct Anthropic.
- `cacheRetention: "long"` wordt toegewezen aan de echte promptcache-TTL van 1 uur op Vertex AI-eindpunten.
- Standaard cachebehoud voor `anthropic-vertex` komt overeen met directe Anthropic-standaarden.
- Vertex-aanvragen worden gerouteerd via grensbewuste cachevorming, zodat cachehergebruik afgestemd blijft op wat providers daadwerkelijk ontvangen.

### Amazon Bedrock

- Anthropic Claude-modelrefs (`amazon-bedrock/*anthropic.claude*`) ondersteunen expliciete `cacheRetention`-doorgifte.
- Niet-Anthropic Bedrock-modellen worden tijdens runtime geforceerd naar `cacheRetention: "none"`.

### OpenRouter-modellen

Voor `openrouter/anthropic/*`-modelrefs injecteert OpenClaw Anthropic
`cache_control` op systeem-/ontwikkelaarspromptblokken om promptcachehergebruik
te verbeteren, alleen wanneer de aanvraag nog steeds op een geverifieerde
OpenRouter-route is gericht (`openrouter` op het standaardeindpunt, of elke
provider/basis-URL die naar `openrouter.ai` resolveert).

Voor `openrouter/deepseek/*`, `openrouter/moonshot*/*` en `openrouter/zai/*`
-modelrefs is `contextPruning.mode: "cache-ttl"` toegestaan omdat OpenRouter
promptcaching aan providerzijde automatisch afhandelt. OpenClaw injecteert geen
Anthropic `cache_control`-markeringen in die aanvragen.

DeepSeek-cacheopbouw is best-effort en kan een paar seconden duren. Een
onmiddellijke vervolgaanvraag kan nog steeds `cached_tokens: 0` tonen; verifieer
met een herhaalde aanvraag met hetzelfde voorvoegsel na een korte vertraging en
gebruik `usage.prompt_tokens_details.cached_tokens` als cache-hit-signaal.

Als je het model naar een willekeurige OpenAI-compatibele proxy-URL laat wijzen,
stopt OpenClaw met het injecteren van die OpenRouter-specifieke Anthropic-cachemarkeringen.

### Andere providers

Als de provider deze cachemodus niet ondersteunt, heeft `cacheRetention` geen effect.

### Google Gemini directe API

- Direct Gemini-transport (`api: "google-generative-ai"`) rapporteert cachehits
  via upstream `cachedContentTokenCount`; OpenClaw wijst dat toe aan `cacheRead`.
- Wanneer `cacheRetention` is ingesteld op een direct Gemini-model, maakt,
  hergebruikt en vernieuwt OpenClaw automatisch `cachedContents`-resources voor
  systeemprompts op Google AI Studio-runs. Dit betekent dat je niet langer
  handmatig vooraf een cached-content-handle hoeft te maken.
- Je kunt nog steeds een vooraf bestaande Gemini cached-content-handle doorgeven
  als `params.cachedContent` (of legacy `params.cached_content`) op het geconfigureerde
  model.
- Dit staat los van Anthropic/OpenAI promptvoorvoegselcaching. Voor Gemini
  beheert OpenClaw een provider-native `cachedContents`-resource in plaats van
  cachemarkeringen in de aanvraag te injecteren.

### Gemini CLI-gebruik

- Gemini CLI `stream-json`-uitvoer kan cachehits via `stats.cached` tonen;
  OpenClaw wijst dat toe aan `cacheRead`. Legacy `--output-format json`-overschrijvingen
  gebruiken dezelfde gebruiksnormalisatie.
- Als de CLI een directe `stats.input`-waarde weglaat, leidt OpenClaw invoertokens
  af uit `stats.input_tokens - stats.cached`.
- Dit is alleen gebruiksnormalisatie. Het betekent niet dat OpenClaw Anthropic/OpenAI-achtige
  promptcachemarkeringen voor Gemini CLI maakt.

## Cachegrens voor systeemprompts

OpenClaw splitst de systeemprompt in een **stabiel voorvoegsel** en een **vluchtig
achtervoegsel**, gescheiden door een interne cachevoorvoegselgrens. Inhoud boven de
grens (tooldefinities, Skills-metadata, workspacebestanden en andere relatief
statische context) wordt geordend zodat die byte-identiek blijft over beurten heen.
Inhoud onder de grens (bijvoorbeeld `HEARTBEAT.md`, runtime-tijdstempels en
andere metadata per beurt) mag veranderen zonder het gecachte voorvoegsel ongeldig
te maken.

Belangrijke ontwerpkeuzes:

- Stabiele workspace projectcontextbestanden worden vóór `HEARTBEAT.md` geordend, zodat
  Heartbeat-wijzigingen het stabiele voorvoegsel niet breken.
- De grens wordt toegepast op Anthropic-familie-, OpenAI-familie-, Google- en
  CLI-transportvorming, zodat alle ondersteunde providers profiteren van dezelfde
  voorvoegselstabiliteit.
- Codex Responses- en Anthropic Vertex-aanvragen worden gerouteerd via
  grensbewuste cachevorming, zodat cachehergebruik afgestemd blijft op wat providers
  daadwerkelijk ontvangen.
- Systeempromptvingerafdrukken worden genormaliseerd (witruimte, regeleinden,
  door hooks toegevoegde context, ordening van runtimecapaciteiten), zodat semantisch
  ongewijzigde prompts KV/cache delen over beurten heen.

Als je onverwachte `cacheWrite`-pieken ziet na een configuratie- of workspacewijziging,
controleer dan of de wijziging boven of onder de cachegrens terechtkomt. Vluchtige
inhoud onder de grens plaatsen (of stabiliseren) lost het probleem vaak op.

## Cache-stabiliteitswaarborgen van OpenClaw

OpenClaw houdt ook verschillende cachegevoelige payloadvormen deterministisch voordat
de aanvraag de provider bereikt:

- Bundle MCP-toolcatalogi worden deterministisch gesorteerd vóór toolregistratie,
  zodat wijzigingen in `listTools()`-volgorde het toolsblok niet laten schommelen en
  promptcachevoorvoegsels breken.
- Legacy-sessies met persistente afbeeldingsblokken houden de **3 meest recente
  voltooide beurten** intact; oudere al verwerkte afbeeldingsblokken kunnen worden
  vervangen door een markering, zodat afbeeldingszware vervolgaanvragen niet steeds
  grote verouderde payloads opnieuw blijven verzenden.

## Afstemmingspatronen

### Gemengd verkeer (aanbevolen standaard)

Houd een langlevende baseline op je hoofdagent, schakel caching uit op bursty notificatieagents:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Kosten-eerst-baseline

- Stel baseline `cacheRetention: "short"` in.
- Schakel `contextPruning.mode: "cache-ttl"` in.
- Houd Heartbeat alleen onder je TTL voor agents die profiteren van warme caches.

## Cachediagnostiek

OpenClaw stelt speciale cachetrace-diagnostiek beschikbaar voor ingebedde agentruns.

Voor normale gebruikersgerichte diagnostiek kunnen `/status` en andere gebruikssamenvattingen
de nieuwste transcriptgebruikentry gebruiken als fallbackbron voor `cacheRead` /
`cacheWrite` wanneer de live sessie-entry die tellers niet heeft.

## Live regressietests

OpenClaw houdt één gecombineerde live cacheregressiegate bij voor herhaalde voorvoegsels, toolbeurten, afbeeldingsbeurten, MCP-achtige tooltranscripten en een Anthropic no-cache-controle.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Voer de smalle live gate uit met:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Het baselinebestand slaat de meest recent waargenomen live cijfers op, plus de providerspecifieke regressieondergrenzen die door de test worden gebruikt.
De runner gebruikt ook verse sessie-ID's en prompt-naamruimten per run, zodat eerdere cachetoestand de huidige regressiesteekproef niet vervuilt.

Deze tests gebruiken bewust niet dezelfde succescriteria voor alle providers.

### Anthropic-liveverwachtingen

- Verwacht expliciete warmup-schrijfbewerkingen via `cacheWrite`.
- Verwacht bijna volledig hergebruik van de geschiedenis bij herhaalde beurten, omdat Anthropic cache control het cachebreekpunt door het gesprek heen opschuift.
- Huidige live-assertions gebruiken nog steeds hoge drempels voor trefferpercentages voor stabiele, tool- en afbeeldingspaden.

### OpenAI-liveverwachtingen

- Verwacht alleen `cacheRead`. `cacheWrite` blijft `0`.
- Behandel cachehergebruik bij herhaalde beurten als een providerspecifiek plateau, niet als hergebruik van de volledige geschiedenis op de bewegende Anthropic-manier.
- Huidige live-assertions gebruiken conservatieve ondergrenscontroles die zijn afgeleid van waargenomen live gedrag op `gpt-5.4-mini`:
  - stabiel prefix: `cacheRead >= 4608`, trefferpercentage `>= 0.90`
  - tooltranscript: `cacheRead >= 4096`, trefferpercentage `>= 0.85`
  - afbeeldingstranscript: `cacheRead >= 3840`, trefferpercentage `>= 0.82`
  - MCP-achtig transcript: `cacheRead >= 4096`, trefferpercentage `>= 0.85`

Verse gecombineerde live verificatie op 2026-04-04 kwam uit op:

- stabiel prefix: `cacheRead=4864`, trefferpercentage `0.966`
- tooltranscript: `cacheRead=4608`, trefferpercentage `0.896`
- afbeeldingstranscript: `cacheRead=4864`, trefferpercentage `0.954`
- MCP-achtig transcript: `cacheRead=4608`, trefferpercentage `0.891`

Recente lokale kloktijd voor de gecombineerde gate was ongeveer `88s`.

Waarom de assertions verschillen:

- Anthropic stelt expliciete cachebreekpunten en bewegend hergebruik van gespreksgeschiedenis beschikbaar.
- OpenAI prompt caching blijft gevoelig voor exacte prefixes, maar het effectieve herbruikbare prefix in live Responses-verkeer kan eerder een plateau bereiken dan de volledige prompt.
- Daardoor veroorzaakt het vergelijken van Anthropic en OpenAI met één procentuele drempel voor alle providers valse regressies.

### `diagnostics.cacheTrace`-configuratie

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Standaardwaarden:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env-schakelaars (eenmalig debuggen)

- `OPENCLAW_CACHE_TRACE=1` schakelt cachetracing in.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` overschrijft het uitvoerpad.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` schakelt het vastleggen van de volledige berichtpayload om.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` schakelt het vastleggen van prompttekst om.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` schakelt het vastleggen van de systeemprompt om.

### Wat te inspecteren

- Cachetrace-events zijn JSONL en bevatten staged snapshots zoals `session:loaded`, `prompt:before`, `stream:context` en `session:after`.
- De impact van cachetokens per beurt is zichtbaar in normale gebruiksoppervlakken via `cacheRead` en `cacheWrite` (bijvoorbeeld `/usage tokens`, `/status`, sessiegebruiksamenvattingen en aangepaste `messages.usageTemplate`-layouts).
- Verwacht voor Anthropic zowel `cacheRead` als `cacheWrite` wanneer caching actief is.
- Verwacht voor OpenAI `cacheRead` bij cachetreffers. GPT-5.6 Responses kan ook `cacheWrite` rapporteren terwijl promptsegmenten worden geschreven; andere Responses-payloads die de schrijfteller weglaten, houden die op `0`.
- Als je requesttracing nodig hebt, log dan request-ID's en rate-limit-headers apart van cachemetrieken. De huidige cachetrace-uitvoer van OpenClaw is gericht op prompt-/sessievorm en genormaliseerd tokengebruik in plaats van ruwe provider-responseheaders.

## Snel problemen oplossen

- Hoge `cacheWrite` op de meeste beurten: controleer op vluchtige systeempromptinvoer en verifieer dat model/provider je cache-instellingen ondersteunt.
- Hoge `cacheWrite` op Anthropic: betekent vaak dat het cachebreekpunt terechtkomt op inhoud die bij elk request verandert.
- Lage OpenAI `cacheRead`: verifieer dat het stabiele prefix vooraan staat, dat het herhaalde prefix minstens 1024 tokens is en dat dezelfde `prompt_cache_key` wordt hergebruikt voor beurten die een cache zouden moeten delen.
- Geen effect van `cacheRetention`: bevestig dat de modelsleutel overeenkomt met `agents.defaults.models["provider/model"]`.
- Bedrock Nova/Mistral-requests met cache-instellingen: verwachte runtimeforce naar `none`.

Gerelateerde docs:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
- [Gateway-configuratiereferentie](/nl/gateway/configuration-reference)

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)

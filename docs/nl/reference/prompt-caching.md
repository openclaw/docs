---
read_when:
    - U wilt prompttokenkosten verlagen met cachebehoud
    - Je hebt cachegedrag per agent nodig in multi-agentopstellingen
    - Je stemt heartbeat en cache-ttl-pruning samen af
summary: Promptcacheknoppen, samenvoegvolgorde, providergedrag en afstemmingspatronen
title: Promptcaching
x-i18n:
    generated_at: "2026-06-27T18:18:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

Promptcaching betekent dat de modelaanbieder ongewijzigde promptvoorvoegsels (meestal systeem-/ontwikkelaarsinstructies en andere stabiele context) over beurten heen kan hergebruiken in plaats van ze telkens opnieuw te verwerken. OpenClaw normaliseert aanbiedersgebruik naar `cacheRead` en `cacheWrite` wanneer de bovenliggende API die tellers rechtstreeks aanbiedt.

Statusoppervlakken kunnen cachetellers ook herstellen uit het meest recente
gebruikslog in het transcript wanneer ze ontbreken in de live sessiesnapshot, zodat `/status` een cacheregel kan blijven
tonen na gedeeltelijk verlies van sessiemetadata. Bestaande niet-nul live
cachewaarden blijven voorrang houden boven transcriptfallbackwaarden.

Waarom dit belangrijk is: lagere tokenkosten, snellere antwoorden en voorspelbaardere prestaties voor langlopende sessies. Zonder caching betalen herhaalde prompts bij elke beurt de volledige promptkosten, ook wanneer de meeste invoer niet is gewijzigd.

De onderstaande secties behandelen elke cachegerelateerde instelling die invloed heeft op prompt-hergebruik en tokenkosten.

Aanbiedersreferenties:

- Anthropic-promptcaching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI-promptcaching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API-headers en aanvraag-ID's: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic-aanvraag-ID's en fouten: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Primaire instellingen

### `cacheRetention` (globale standaard, model en per agent)

Stel cacheretentie in als globale standaard voor alle modellen:

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

Samenvoegvolgorde van configuratie:

1. `agents.defaults.params` (globale standaard — geldt voor alle modellen)
2. `agents.defaults.models["provider/model"].params` (overschrijving per model)
3. `agents.list[].params` (overeenkomende agent-ID; overschrijft per sleutel)

### `contextPruning.mode: "cache-ttl"`

Snoeit oude toolresultaatcontext na cache-TTL-vensters, zodat aanvragen na inactiviteit geen te grote geschiedenis opnieuw cachen.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Zie [Sessiesnoei](/nl/concepts/session-pruning) voor het volledige gedrag.

### Heartbeat warm houden

Heartbeat kan cachevensters warm houden en herhaalde cachewrites na inactiviteitsgaten verminderen.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agent wordt ondersteund op `agents.list[].heartbeat`.

## Aanbiedergedrag

### Anthropic (directe API)

- `cacheRetention` wordt ondersteund.
- Met Anthropic API-sleutelauthenticatieprofielen vult OpenClaw `cacheRetention: "short"` in voor Anthropic-modelreferenties wanneer dit niet is ingesteld.
- Native Anthropic Messages-antwoorden bieden zowel `cache_read_input_tokens` als `cache_creation_input_tokens`, zodat OpenClaw zowel `cacheRead` als `cacheWrite` kan tonen.
- Voor native Anthropic-aanvragen komt `cacheRetention: "short"` overeen met de standaard efemere cache van 5 minuten, en `cacheRetention: "long"` schakelt alleen op directe `api.anthropic.com`-hosts over naar de TTL van 1 uur.

### OpenAI (directe API)

- Promptcaching is automatisch op ondersteunde recente modellen. OpenClaw hoeft geen cachemarkeringen op blokniveau in te voegen.
- OpenClaw gebruikt `prompt_cache_key` om cacherouting stabiel te houden over beurten heen. Directe OpenAI-hosts gebruiken `prompt_cache_retention: "24h"` wanneer `cacheRetention: "long"` is geselecteerd.
- OpenAI-compatibele Completions-aanbieders ontvangen `prompt_cache_key` alleen wanneer hun modelconfiguratie expliciet `compat.supportsPromptCacheKey: true` instelt. Doorsturen van lange retentie is een aparte mogelijkheid: expliciete `cacheRetention: "long"` verzendt `prompt_cache_retention: "24h"` alleen wanneer die compat-vermelding ook lange cacheretentie ondersteunt. Aanbieders zoals Mistral kunnen cachekeys inschakelen terwijl ze `compat.supportsLongCacheRetention: false` instellen om het veld voor lange retentie te onderdrukken. `cacheRetention: "none"` onderdrukt beide velden.
- OpenAI-antwoorden tonen gecachte prompttokens via `usage.prompt_tokens_details.cached_tokens` (of `input_tokens_details.cached_tokens` op Responses API-events). OpenClaw mapt dat naar `cacheRead`.
- OpenAI biedt geen aparte tokenteller voor cachewrites, dus `cacheWrite` blijft `0` op OpenAI-paden, zelfs wanneer de aanbieder een cache opwarmt.
- OpenAI retourneert nuttige tracing- en rate-limitheaders zoals `x-request-id`, `openai-processing-ms` en `x-ratelimit-*`, maar cachehitboekhouding moet uit de gebruikspayload komen, niet uit headers.
- In de praktijk gedraagt OpenAI zich vaak als een cache voor een eerste voorvoegsel in plaats van Anthropic-achtig hergebruik van bewegende volledige geschiedenis. Stabiele tekstbeurten met een lang voorvoegsel kunnen in huidige liveprobes uitkomen rond een plateau van `4864` gecachte tokens, terwijl toolzware of MCP-achtige transcripten vaak rond `4608` gecachte tokens blijven hangen, zelfs bij exacte herhalingen.

### Anthropic Vertex

- Anthropic-modellen op Vertex AI (`anthropic-vertex/*`) ondersteunen `cacheRetention` op dezelfde manier als direct Anthropic.
- `cacheRetention: "long"` komt overeen met de echte promptcache-TTL van 1 uur op Vertex AI-eindpunten.
- Standaard cacheretentie voor `anthropic-vertex` komt overeen met de directe Anthropic-standaarden.
- Vertex-aanvragen worden gerouteerd via grensbewuste cachevorming, zodat cachehergebruik afgestemd blijft op wat aanbieders daadwerkelijk ontvangen.

### Amazon Bedrock

- Anthropic Claude-modelreferenties (`amazon-bedrock/*anthropic.claude*`) ondersteunen expliciete doorvoer van `cacheRetention`.
- Niet-Anthropic Bedrock-modellen worden tijdens runtime gedwongen naar `cacheRetention: "none"`.

### OpenRouter-modellen

Voor `openrouter/anthropic/*`-modelreferenties voegt OpenClaw Anthropic
`cache_control` toe aan systeem-/ontwikkelaarspromptblokken om promptcache-
hergebruik te verbeteren, maar alleen wanneer de aanvraag nog steeds gericht is op een geverifieerde OpenRouter-route
(`openrouter` op het standaardeindpunt, of een aanbieder/basis-URL die wordt herleid
naar `openrouter.ai`).

Voor `openrouter/deepseek/*`, `openrouter/moonshot*/*` en `openrouter/zai/*`-
modelreferenties is `contextPruning.mode: "cache-ttl"` toegestaan omdat OpenRouter
promptcaching aan aanbiederszijde automatisch afhandelt. OpenClaw voegt geen
Anthropic `cache_control`-markeringen in die aanvragen in.

DeepSeek-cacheopbouw is naar beste vermogen en kan enkele seconden duren. Een
onmiddellijke vervolgactie kan nog steeds `cached_tokens: 0` tonen; verifieer met een herhaalde
aanvraag met hetzelfde voorvoegsel na een korte vertraging en gebruik `usage.prompt_tokens_details.cached_tokens`
als het cachehitsignaal.

Als je het model naar een willekeurige OpenAI-compatibele proxy-URL omleidt, stopt OpenClaw
met het invoegen van die OpenRouter-specifieke Anthropic-cachemarkeringen.

### Andere aanbieders

Als de aanbieder deze cachemodus niet ondersteunt, heeft `cacheRetention` geen effect.

### Google Gemini directe API

- Direct Gemini-transport (`api: "google-generative-ai"`) rapporteert cachehits
  via bovenliggend `cachedContentTokenCount`; OpenClaw mapt dat naar `cacheRead`.
- Wanneer `cacheRetention` is ingesteld op een direct Gemini-model, maakt OpenClaw automatisch
  `cachedContents`-resources aan, hergebruikt en ververst ze voor systeemprompts
  tijdens Google AI Studio-runs. Dit betekent dat je niet langer vooraf handmatig een
  cached-content-handle hoeft aan te maken.
- Je kunt nog steeds een bestaande Gemini cached-content-handle doorgeven als
  `params.cachedContent` (of verouderd `params.cached_content`) op het geconfigureerde
  model.
- Dit staat los van Anthropic/OpenAI-promptvoorvoegselcaching. Voor Gemini
  beheert OpenClaw een aanbieder-native `cachedContents`-resource in plaats van
  cachemarkeringen in de aanvraag in te voegen.

### Gemini CLI-gebruik

- Gemini CLI `stream-json`-uitvoer kan cachehits tonen via `stats.cached`;
  OpenClaw mapt dat naar `cacheRead`. Verouderde `--output-format json`-overschrijvingen gebruiken
  dezelfde gebruiksnormalisatie.
- Als de CLI een directe `stats.input`-waarde weglaat, leidt OpenClaw invoertokens af
  uit `stats.input_tokens - stats.cached`.
- Dit is alleen gebruiksnormalisatie. Het betekent niet dat OpenClaw
  Anthropic/OpenAI-achtige promptcachemarkeringen voor Gemini CLI maakt.

## Cachegrens voor systeemprompt

OpenClaw splitst de systeemprompt in een **stabiel voorvoegsel** en een **vluchtig
achtervoegsel**, gescheiden door een interne cachevoorvoegselgrens. Inhoud boven de
grens (tooldefinities, Skills-metadata, werkruimtebestanden en andere
relatief statische context) wordt zo geordend dat die over beurten heen byte-identiek blijft.
Inhoud onder de grens (bijvoorbeeld `HEARTBEAT.md`, runtimetijdstempels en
andere metadata per beurt) mag veranderen zonder het gecachte
voorvoegsel ongeldig te maken.

Belangrijke ontwerpkeuzes:

- Stabiele projectcontextbestanden uit de werkruimte worden vóór `HEARTBEAT.md` geordend, zodat
  Heartbeat-verloop het stabiele voorvoegsel niet verbreekt.
- De grens wordt toegepast op Anthropic-familie-, OpenAI-familie-, Google- en
  CLI-transportvorming, zodat alle ondersteunde aanbieders profiteren van dezelfde stabiliteit van het voorvoegsel.
- Codex Responses- en Anthropic Vertex-aanvragen worden gerouteerd via
  grensbewuste cachevorming, zodat cachehergebruik afgestemd blijft op wat aanbieders
  daadwerkelijk ontvangen.
- Systeempromptvingerafdrukken worden genormaliseerd (witruimte, regeleinden,
  door hooks toegevoegde context, ordening van runtimecapaciteiten), zodat semantisch ongewijzigde
  prompts KV/cache over beurten heen delen.

Als je onverwachte pieken in `cacheWrite` ziet na een configuratie- of werkruimtewijziging,
controleer dan of de wijziging boven of onder de cachegrens terechtkomt. Vluchtige
inhoud onder de grens plaatsen (of stabiliseren) lost het probleem vaak op.

## Cache-stabiliteitsbewakingen van OpenClaw

OpenClaw houdt ook meerdere cachegevoelige payloadvormen deterministisch voordat
de aanvraag de aanbieder bereikt:

- Bundel-MCP-toolcatalogi worden deterministisch gesorteerd vóór toolregistratie,
  zodat wijzigingen in de volgorde van `listTools()` het toolsblok niet laten schommelen en
  promptcachevoorvoegsels niet verbreken.
- Verouderde sessies met persistente afbeeldingsblokken houden de **3 meest recente
  voltooide beurten** intact; oudere al verwerkte afbeeldingsblokken kunnen worden
  vervangen door een markering, zodat vervolgen met veel afbeeldingen niet steeds grote
  verouderde payloads opnieuw blijven verzenden.

## Afstempatronen

### Gemengd verkeer (aanbevolen standaard)

Houd een langlevende basislijn op je hoofdagent en schakel caching uit op piekerige notifieragents:

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

### Kosten-eerst-basislijn

- Stel basislijn `cacheRetention: "short"` in.
- Schakel `contextPruning.mode: "cache-ttl"` in.
- Houd Heartbeat alleen onder je TTL voor agents die profiteren van warme caches.

## Cache-diagnostiek

OpenClaw biedt specifieke cachetrace-diagnostiek voor ingesloten agentruns.

Voor normale gebruikersgerichte diagnostiek kunnen `/status` en andere gebruikssamenvattingen
de nieuwste transcriptgebruiksvermelding gebruiken als fallbackbron voor `cacheRead` /
`cacheWrite` wanneer de live sessievermelding die tellers niet heeft.

## Live regressietests

OpenClaw onderhoudt één gecombineerde live cache-regressiegate voor herhaalde voorvoegsels, toolbeurten, afbeeldingsbeurten, MCP-achtige tooltranscripten en een Anthropic no-cache-controle.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Voer de smalle live gate uit met:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Het basislijnbestand slaat de meest recent waargenomen live cijfers op plus de aanbiederspecifieke regressievloeren die door de test worden gebruikt.
De runner gebruikt ook verse sessie-ID's en promptnamespaces per run, zodat eerdere cachestatus het huidige regressiemonster niet vervuilt.

Deze tests gebruiken bewust geen identieke succescriteria voor alle aanbieders.

### Anthropic-liveverwachtingen

- Verwacht expliciete warmup-schrijfacties via `cacheWrite`.
- Verwacht hergebruik van bijna de volledige geschiedenis bij herhaalde beurten, omdat Anthropic-cachebeheer het cachebreekpunt door het gesprek heen opschuift.
- Huidige live-asserties gebruiken nog steeds hoge drempels voor trefferratio's voor stabiele, tool- en afbeeldingspaden.

### OpenAI-liveverwachtingen

- Verwacht alleen `cacheRead`. `cacheWrite` blijft `0`.
- Behandel cachehergebruik bij herhaalde beurten als een aanbiederspecifiek plateau, niet als hergebruik van de volledige geschiedenis op de bewegende Anthropic-manier.
- Huidige live-asserties gebruiken conservatieve ondergrenscontroles die zijn afgeleid van waargenomen livegedrag op `gpt-5.4-mini`:
  - stabiel prefix: `cacheRead >= 4608`, trefferratio `>= 0.90`
  - tooltranscript: `cacheRead >= 4096`, trefferratio `>= 0.85`
  - afbeeldingstranscript: `cacheRead >= 3840`, trefferratio `>= 0.82`
  - MCP-stijl transcript: `cacheRead >= 4096`, trefferratio `>= 0.85`

Nieuwe gecombineerde liveverificatie op 2026-04-04 kwam uit op:

- stabiel prefix: `cacheRead=4864`, trefferratio `0.966`
- tooltranscript: `cacheRead=4608`, trefferratio `0.896`
- afbeeldingstranscript: `cacheRead=4864`, trefferratio `0.954`
- MCP-stijl transcript: `cacheRead=4608`, trefferratio `0.891`

Recente lokale wandkloktijd voor de gecombineerde gate was ongeveer `88s`.

Waarom de asserties verschillen:

- Anthropic biedt expliciete cachebreekpunten en bewegend hergebruik van gespreksgeschiedenis.
- OpenAI-promptcaching blijft gevoelig voor exacte prefixes, maar het effectieve herbruikbare prefix in live Responses-verkeer kan eerder een plateau bereiken dan de volledige prompt.
- Daarom veroorzaakt het vergelijken van Anthropic en OpenAI met één procentuele drempel voor alle aanbieders valse regressies.

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

### Omgevingsschakelaars (eenmalige debugging)

- `OPENCLAW_CACHE_TRACE=1` schakelt cachetracing in.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` overschrijft het uitvoerpad.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` schakelt vastleggen van de volledige berichtpayload.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` schakelt vastleggen van prompttekst.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` schakelt vastleggen van de systeemprompt.

### Wat te inspecteren

- Cachetrace-gebeurtenissen zijn JSONL en bevatten gefaseerde snapshots zoals `session:loaded`, `prompt:before`, `stream:context` en `session:after`.
- De impact van cachetokens per beurt is zichtbaar in normale gebruiksoppervlakken via `cacheRead` en `cacheWrite` (bijvoorbeeld `/usage full` en sessiegebruiksamenvattingen).
- Verwacht voor Anthropic zowel `cacheRead` als `cacheWrite` wanneer caching actief is.
- Verwacht voor OpenAI `cacheRead` bij cachetreffers en dat `cacheWrite` `0` blijft; OpenAI publiceert geen afzonderlijk tokenveld voor cache-schrijfacties.
- Als je requesttracing nodig hebt, log dan request-ID's en rate-limit-headers afzonderlijk van cachemetriek. De huidige cachetrace-uitvoer van OpenClaw is gericht op prompt-/sessievorm en genormaliseerd tokengebruik in plaats van ruwe antwoordheaders van aanbieders.

## Snelle probleemoplossing

- Hoge `cacheWrite` bij de meeste beurten: controleer op vluchtige invoer voor systeemprompts en verifieer dat model/aanbieder je cache-instellingen ondersteunt.
- Hoge `cacheWrite` op Anthropic: betekent vaak dat het cachebreekpunt terechtkomt op inhoud die bij elke request verandert.
- Lage OpenAI-`cacheRead`: verifieer dat het stabiele prefix vooraan staat, dat het herhaalde prefix minstens 1024 tokens bevat en dat dezelfde `prompt_cache_key` opnieuw wordt gebruikt voor beurten die een cache zouden moeten delen.
- Geen effect van `cacheRetention`: bevestig dat de modelsleutel overeenkomt met `agents.defaults.models["provider/model"]`.
- Bedrock Nova/Mistral-requests met cache-instellingen: verwachte runtime-force naar `none`.

Gerelateerde docs:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
- [Configuratiereferentie voor Gateway](/nl/gateway/configuration-reference)

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)

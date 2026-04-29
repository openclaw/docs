---
read_when:
    - Je wilt de kosten voor prompttokens verlagen met cachebehoud
    - Je hebt cachegedrag per agent nodig in multi-agentopstellingen
    - Je stemt Heartbeat en cache-ttl-opschoning op elkaar af
summary: Instellingen voor promptcaching, samenvoegvolgorde, providergedrag en optimalisatiepatronen
title: Promptcaching
x-i18n:
    generated_at: "2026-04-29T23:15:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 16
---

Promptcaching betekent dat de modelprovider ongewijzigde promptprefixen (meestal systeem-/ontwikkelaarsinstructies en andere stabiele context) over beurten heen kan hergebruiken in plaats van ze elke keer opnieuw te verwerken. OpenClaw normaliseert providergebruik naar `cacheRead` en `cacheWrite` wanneer de upstream-API die tellers rechtstreeks aanbiedt.

Statusweergaven kunnen cachetellers ook herstellen uit het meest recente transcript
gebruikerslog wanneer de live sessiesnapshot ze mist, zodat `/status` een cacheregel kan blijven
tonen na gedeeltelijk verlies van sessiemetadata. Bestaande niet-nul live
cachewaarden blijven voorrang houden op fallbackwaarden uit het transcript.

Waarom dit belangrijk is: lagere tokenkosten, snellere reacties en voorspelbaardere prestaties voor langlopende sessies. Zonder caching betalen herhaalde prompts bij elke beurt de volledige promptkosten, zelfs wanneer de meeste invoer niet is gewijzigd.

De onderstaande secties behandelen elke cachegerelateerde knop die invloed heeft op prompt-hergebruik en tokenkosten.

Providerreferenties:

- Anthropic-promptcaching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI-promptcaching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API-headers en request-ID's: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic request-ID's en fouten: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Primaire knoppen

### `cacheRetention` (globale standaardwaarde, model en per agent)

Stel cachebewaring in als globale standaardwaarde voor alle modellen:

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

1. `agents.defaults.params` (globale standaardwaarde — geldt voor alle modellen)
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

Zie [Sessiesnoei](/nl/concepts/session-pruning) voor het volledige gedrag.

### Heartbeat warm houden

Heartbeat kan cachevensters warm houden en herhaalde cachewrites na inactiviteitsperioden verminderen.

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
- Met Anthropic API-key-authprofielen vult OpenClaw `cacheRetention: "short"` in voor Anthropic-modelverwijzingen wanneer dit niet is ingesteld.
- Native Messages-responses van Anthropic geven zowel `cache_read_input_tokens` als `cache_creation_input_tokens` door, zodat OpenClaw zowel `cacheRead` als `cacheWrite` kan tonen.
- Voor native Anthropic-aanvragen wordt `cacheRetention: "short"` gekoppeld aan de standaard tijdelijke cache van 5 minuten, en `cacheRetention: "long"` wordt alleen op directe `api.anthropic.com`-hosts opgewaardeerd naar de TTL van 1 uur.

### OpenAI (directe API)

- Promptcaching is automatisch op ondersteunde recente modellen. OpenClaw hoeft geen cachemarkeringen op blokniveau te injecteren.
- OpenClaw gebruikt `prompt_cache_key` om cacherouting stabiel te houden over beurten heen en gebruikt `prompt_cache_retention: "24h"` alleen wanneer `cacheRetention: "long"` is geselecteerd op directe OpenAI-hosts.
- OpenAI-compatibele Completions-providers ontvangen `prompt_cache_key` alleen wanneer hun modelconfiguratie expliciet `compat.supportsPromptCacheKey: true` instelt; `cacheRetention: "none"` onderdrukt dit nog steeds.
- OpenAI-responses geven gecachte prompttokens door via `usage.prompt_tokens_details.cached_tokens` (of `input_tokens_details.cached_tokens` bij Responses API-events). OpenClaw koppelt dat aan `cacheRead`.
- OpenAI geeft geen aparte token teller voor cachewrites door, dus `cacheWrite` blijft `0` op OpenAI-paden, zelfs wanneer de provider een cache opwarmt.
- OpenAI retourneert nuttige tracing- en rate-limitheaders zoals `x-request-id`, `openai-processing-ms` en `x-ratelimit-*`, maar cache-hitadministratie moet uit de usage-payload komen, niet uit headers.
- In de praktijk gedraagt OpenAI zich vaak als een cache voor initiële prefixen in plaats van Anthropic-achtig hergebruik van volledige geschiedenis dat meebeweegt. Stabiele tekstbeurten met lange prefix kunnen in huidige liveprobes dicht bij een plateau van `4864` gecachte tokens uitkomen, terwijl toolzware of MCP-achtige transcripts vaak rond `4608` gecachte tokens plateauën, zelfs bij exacte herhalingen.

### Anthropic Vertex

- Anthropic-modellen op Vertex AI (`anthropic-vertex/*`) ondersteunen `cacheRetention` op dezelfde manier als directe Anthropic.
- `cacheRetention: "long"` wordt gekoppeld aan de echte promptcache-TTL van 1 uur op Vertex AI-endpoints.
- Standaard cachebewaring voor `anthropic-vertex` komt overeen met de standaardwaarden van directe Anthropic.
- Vertex-aanvragen worden gerouteerd via grensbewuste cachevorming, zodat cachehergebruik afgestemd blijft op wat providers daadwerkelijk ontvangen.

### Amazon Bedrock

- Anthropic Claude-modelverwijzingen (`amazon-bedrock/*anthropic.claude*`) ondersteunen expliciete doorgifte van `cacheRetention`.
- Niet-Anthropic Bedrock-modellen worden tijdens runtime gedwongen naar `cacheRetention: "none"`.

### OpenRouter-modellen

Voor `openrouter/anthropic/*`-modelverwijzingen injecteert OpenClaw Anthropic
`cache_control` op systeem-/ontwikkelaarspromptblokken om promptcache
hergebruik te verbeteren, alleen wanneer de aanvraag nog steeds gericht is op een geverifieerde OpenRouter-route
(`openrouter` op het standaardendpoint, of elke provider/basis-URL die resolveert
naar `openrouter.ai`).

Voor `openrouter/deepseek/*`, `openrouter/moonshot*/*` en `openrouter/zai/*`
modelverwijzingen is `contextPruning.mode: "cache-ttl"` toegestaan omdat OpenRouter
provider-side promptcaching automatisch afhandelt. OpenClaw injecteert geen
Anthropic `cache_control`-markeringen in die aanvragen.

DeepSeek-cacheconstructie is best-effort en kan enkele seconden duren. Een
direct vervolg kan nog steeds `cached_tokens: 0` tonen; verifieer met een herhaalde
aanvraag met dezelfde prefix na een korte vertraging en gebruik `usage.prompt_tokens_details.cached_tokens`
als cache-hit-signaal.

Als je het model naar een willekeurige OpenAI-compatibele proxy-URL omleidt, stopt OpenClaw
met het injecteren van die OpenRouter-specifieke Anthropic-cachemarkeringen.

### Andere providers

Als de provider deze cachemodus niet ondersteunt, heeft `cacheRetention` geen effect.

### Google Gemini directe API

- Direct Gemini-transport (`api: "google-generative-ai"`) rapporteert cachehits
  via upstream `cachedContentTokenCount`; OpenClaw koppelt dat aan `cacheRead`.
- Wanneer `cacheRetention` is ingesteld op een direct Gemini-model, maakt OpenClaw automatisch
  `cachedContents`-resources aan, hergebruikt en vernieuwt ze voor systeemprompts
  bij Google AI Studio-runs. Dit betekent dat je niet langer vooraf handmatig een
  cached-content-handle hoeft aan te maken.
- Je kunt nog steeds een bestaande Gemini cached-content-handle doorgeven als
  `params.cachedContent` (of legacy `params.cached_content`) op het geconfigureerde
  model.
- Dit staat los van Anthropic/OpenAI promptprefixcaching. Voor Gemini
  beheert OpenClaw een provider-native `cachedContents`-resource in plaats van
  cachemarkeringen in de aanvraag te injecteren.

### Gemini CLI JSON-gebruik

- Gemini CLI JSON-uitvoer kan cachehits ook tonen via `stats.cached`;
  OpenClaw koppelt dat aan `cacheRead`.
- Als de CLI een directe `stats.input`-waarde weglaat, leidt OpenClaw invoertokens af
  uit `stats.input_tokens - stats.cached`.
- Dit is alleen gebruiksnormalisatie. Het betekent niet dat OpenClaw
  Anthropic/OpenAI-achtige promptcachemarkeringen voor Gemini CLI aanmaakt.

## Systeemprompt-cachegrens

OpenClaw splitst de systeemprompt in een **stabiele prefix** en een **vluchtig
suffix**, gescheiden door een interne cacheprefixgrens. Inhoud boven de
grens (tooldefinities, Skills-metadata, workspacebestanden en andere
relatief statische context) wordt zo geordend dat die byte-identiek blijft over beurten heen.
Inhoud onder de grens (bijvoorbeeld `HEARTBEAT.md`, runtime-tijdstempels en
andere metadata per beurt) mag wijzigen zonder de gecachte
prefix ongeldig te maken.

Belangrijke ontwerpkeuzes:

- Stabiele projectcontextbestanden in de workspace worden vóór `HEARTBEAT.md` geordend, zodat
  Heartbeat-wijzigingen de stabiele prefix niet verbreken.
- De grens wordt toegepast op Anthropic-family, OpenAI-family, Google en
  CLI-transportvorming, zodat alle ondersteunde providers profiteren van dezelfde prefix
  stabiliteit.
- Codex Responses- en Anthropic Vertex-aanvragen worden gerouteerd via
  grensbewuste cachevorming, zodat cachehergebruik afgestemd blijft op wat providers
  daadwerkelijk ontvangen.
- Systeempromptvingerafdrukken worden genormaliseerd (witruimte, regeleinden,
  door hooks toegevoegde context, ordening van runtimecapaciteiten), zodat semantisch ongewijzigde
  prompts KV/cache delen over beurten heen.

Als je onverwachte `cacheWrite`-pieken ziet na een configuratie- of workspacewijziging,
controleer dan of de wijziging boven of onder de cachegrens terechtkomt. Vluchtige
inhoud onder de grens plaatsen (of stabiliseren) lost het probleem vaak op.

## Cache-stabiliteitsguards van OpenClaw

OpenClaw houdt ook meerdere cachegevoelige payloadvormen deterministisch voordat
de aanvraag de provider bereikt:

- Bundle MCP-toolcatalogi worden deterministisch gesorteerd vóór tool
  registratie, zodat wijzigingen in `listTools()`-volgorde het toolsblok niet wijzigen en
  promptcacheprefixen verbreken.
- Legacy-sessies met bewaarde afbeeldingsblokken houden de **3 meest recente
  voltooide beurten** intact; oudere al verwerkte afbeeldingsblokken kunnen worden
  vervangen door een markering, zodat afbeeldingszware vervolgen niet steeds grote
  verouderde payloads opnieuw verzenden.

## Afstempatronen

### Gemengd verkeer (aanbevolen standaard)

Houd een langlevende baseline op je hoofdagent, schakel caching uit op bursty notifier-agents:

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

### Kosten-eerst baseline

- Stel baseline `cacheRetention: "short"` in.
- Schakel `contextPruning.mode: "cache-ttl"` in.
- Houd Heartbeat alleen onder je TTL voor agents die profiteren van warme caches.

## Cache-diagnostiek

OpenClaw biedt speciale cache-trace-diagnostiek voor embedded agent-runs.

Voor normale gebruikersgerichte diagnostiek kunnen `/status` en andere gebruikssamenvattingen
de nieuwste transcript-gebruiksentry gebruiken als fallbackbron voor `cacheRead` /
`cacheWrite` wanneer de live sessie-entry die tellers niet heeft.

## Live-regressietests

OpenClaw onderhoudt één gecombineerde live cache-regressiegate voor herhaalde prefixen, toolbeurten, afbeeldingsbeurten, MCP-achtige tooltranscripts en een Anthropic no-cache-control.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Voer de smalle live-gate uit met:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Het baselinebestand slaat de meest recent waargenomen livecijfers op plus de providerspecifieke regressievloeren die door de test worden gebruikt.
De runner gebruikt ook verse sessie-ID's en promptnamespaces per run, zodat eerdere cachestatus de huidige regressiesample niet vervuilt.

Deze tests gebruiken bewust geen identieke succescriteria voor alle providers.

### Anthropic live verwachtingen

- Verwacht expliciete warmup-writes via `cacheWrite`.
- Verwacht bijna volledig geschiedenishergebruik bij herhaalde beurten, omdat Anthropic-cachecontrole het cachebreakpoint door het gesprek heen opschuift.
- Huidige live-assertions gebruiken nog steeds hoge hitratiedrempels voor stabiele, tool- en afbeeldingspaden.

### OpenAI live verwachtingen

- Verwacht alleen `cacheRead`. `cacheWrite` blijft `0`.
- Behandel cachehergebruik over herhaalde beurten als een providerspecifiek plateau, niet als Anthropic-achtig hergebruik van een bewegende volledige geschiedenis.
- Huidige live-asserties gebruiken conservatieve ondergrenscontroles, afgeleid van waargenomen livegedrag op `gpt-5.4-mini`:
  - stabiel voorvoegsel: `cacheRead >= 4608`, hitratio `>= 0.90`
  - tooltranscript: `cacheRead >= 4096`, hitratio `>= 0.85`
  - afbeeldingstranscript: `cacheRead >= 3840`, hitratio `>= 0.82`
  - MCP-achtig transcript: `cacheRead >= 4096`, hitratio `>= 0.85`

Nieuwe gecombineerde liveverificatie op 2026-04-04 kwam uit op:

- stabiel voorvoegsel: `cacheRead=4864`, hitratio `0.966`
- tooltranscript: `cacheRead=4608`, hitratio `0.896`
- afbeeldingstranscript: `cacheRead=4864`, hitratio `0.954`
- MCP-achtig transcript: `cacheRead=4608`, hitratio `0.891`

Recente lokale kloktijd voor de gecombineerde gate was ongeveer `88s`.

Waarom de asserties verschillen:

- Anthropic stelt expliciete cachebreekpunten en hergebruik van bewegende gespreksgeschiedenis beschikbaar.
- OpenAI-promptcaching blijft gevoelig voor exacte voorvoegsels, maar het effectieve herbruikbare voorvoegsel in live Responses-verkeer kan eerder een plateau bereiken dan de volledige prompt.
- Daardoor veroorzaakt het vergelijken van Anthropic en OpenAI met één drempelpercentage voor meerdere providers valse regressies.

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

Standaarden:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Omgevingsschakelaars (eenmalige debugging)

- `OPENCLAW_CACHE_TRACE=1` schakelt cachetracing in.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` overschrijft het uitvoerpad.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` schakelt het vastleggen van de volledige berichtpayload in of uit.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` schakelt het vastleggen van prompttekst in of uit.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` schakelt het vastleggen van de systeemprompt in of uit.

### Wat te inspecteren

- Cachetracegebeurtenissen zijn JSONL en bevatten gefaseerde momentopnamen zoals `session:loaded`, `prompt:before`, `stream:context` en `session:after`.
- De impact van cachetokens per beurt is zichtbaar in normale gebruiksweergaven via `cacheRead` en `cacheWrite` (bijvoorbeeld `/usage full` en samenvattingen van sessiegebruik).
- Verwacht bij Anthropic zowel `cacheRead` als `cacheWrite` wanneer caching actief is.
- Verwacht bij OpenAI `cacheRead` bij cachehits en dat `cacheWrite` `0` blijft; OpenAI publiceert geen apart tokenveld voor cachewrites.
- Als je aanvraagtracing nodig hebt, log dan aanvraag-ID's en rate-limit-headers afzonderlijk van cachemetrieken. De huidige cachetrace-uitvoer van OpenClaw is gericht op prompt-/sessievorm en genormaliseerd tokengebruik in plaats van ruwe antwoordheaders van providers.

## Snelle probleemoplossing

- Hoge `cacheWrite` bij de meeste beurten: controleer op vluchtige systeempromptinvoer en verifieer dat model/provider je cache-instellingen ondersteunt.
- Hoge `cacheWrite` bij Anthropic: betekent vaak dat het cachebreekpunt terechtkomt op inhoud die bij elke aanvraag verandert.
- Lage OpenAI `cacheRead`: verifieer dat het stabiele voorvoegsel vooraan staat, dat het herhaalde voorvoegsel minstens 1024 tokens lang is en dat dezelfde `prompt_cache_key` opnieuw wordt gebruikt voor beurten die een cache zouden moeten delen.
- Geen effect van `cacheRetention`: bevestig dat de modelsleutel overeenkomt met `agents.defaults.models["provider/model"]`.
- Bedrock Nova/Mistral-aanvragen met cache-instellingen: verwachte runtimeforcering naar `none`.

Gerelateerde documentatie:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Sessiesnoei](/nl/concepts/session-pruning)
- [Gateway-configuratiereferentie](/nl/gateway/configuration-reference)

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)

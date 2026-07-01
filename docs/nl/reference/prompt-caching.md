---
read_when:
    - Je wilt de kosten voor prompttokens verlagen met cachebehoud
    - Je hebt cachegedrag per agent nodig in opstellingen met meerdere agents
    - Je stemt Heartbeat en cache-ttl-opschoning op elkaar af
summary: Knoppen voor promptcaching, samenvoegvolgorde, providergedrag en afstemmingspatronen
title: Promptcaching
x-i18n:
    generated_at: "2026-07-01T08:18:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

Promptcaching betekent dat de modelprovider ongewijzigde promptvoorvoegsels (meestal systeem-/ontwikkelaarsinstructies en andere stabiele context) tussen beurten opnieuw kan gebruiken in plaats van ze elke keer opnieuw te verwerken. OpenClaw normaliseert providergebruik naar `cacheRead` en `cacheWrite` wanneer de upstream-API die tellers rechtstreeks beschikbaar maakt.

Statusoppervlakken kunnen cachetellers ook herstellen uit het meest recente transcriptgebruiklogboek wanneer ze ontbreken in de live sessiesnapshot, zodat `/status` een cacheregel kan blijven tonen na gedeeltelijk verlies van sessiemetadata. Bestaande live cachewaarden die niet nul zijn, blijven voorrang krijgen op transcriptfallbackwaarden.

Waarom dit belangrijk is: lagere tokenkosten, snellere antwoorden en voorspelbaardere prestaties voor langlopende sessies. Zonder caching betalen herhaalde prompts bij elke beurt de volledige promptkosten, zelfs wanneer de meeste invoer niet is gewijzigd.

De onderstaande secties behandelen elke cachegerelateerde instelling die invloed heeft op prompt-hergebruik en tokenkosten.

Providerreferenties:

- Anthropic-promptcaching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI-promptcaching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API-headers en aanvraag-ID's: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic-aanvraag-ID's en fouten: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Belangrijkste instellingen

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

Volgorde van configuratiesamenvoeging:

1. `agents.defaults.params` (globale standaard — geldt voor alle modellen)
2. `agents.defaults.models["provider/model"].params` (overschrijving per model)
3. `agents.list[].params` (overeenkomende agent-id; overschrijft per sleutel)

### `contextPruning.mode: "cache-ttl"`

Snoeit oude context met toolresultaten na cache-TTL-vensters, zodat aanvragen na inactiviteit geen te grote geschiedenis opnieuw cachen.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Zie [Sessiesnoei](/nl/concepts/session-pruning) voor het volledige gedrag.

### Heartbeat warm houden

Heartbeat kan cachevensters warm houden en herhaalde cacheschrijfbewerkingen na inactieve onderbrekingen verminderen.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agent wordt ondersteund via `agents.list[].heartbeat`.

## Providergedrag

### Anthropic (directe API)

- `cacheRetention` wordt ondersteund.
- Met Anthropic API-sleutel-authprofielen vult OpenClaw `cacheRetention: "short"` in voor Anthropic-modelrefs wanneer dit niet is ingesteld.
- Native Anthropic Messages-antwoorden stellen zowel `cache_read_input_tokens` als `cache_creation_input_tokens` beschikbaar, zodat OpenClaw zowel `cacheRead` als `cacheWrite` kan tonen.
- Voor native Anthropic-aanvragen wordt `cacheRetention: "short"` toegewezen aan de standaard tijdelijke cache van 5 minuten, en `cacheRetention: "long"` wordt alleen op directe `api.anthropic.com`-hosts opgewaardeerd naar de TTL van 1 uur.

### OpenAI (directe API)

- Promptcaching is automatisch op ondersteunde recente modellen. OpenClaw hoeft geen cachemarkeringen op blokniveau te injecteren.
- OpenClaw gebruikt `prompt_cache_key` om cacherouting tussen beurten stabiel te houden. Directe OpenAI-hosts gebruiken `prompt_cache_retention: "24h"` wanneer `cacheRetention: "long"` is geselecteerd.
- OpenAI-compatibele Completions-providers ontvangen `prompt_cache_key` alleen wanneer hun modelconfiguratie expliciet `compat.supportsPromptCacheKey: true` instelt. Doorsturen met lang behoud is een afzonderlijke mogelijkheid: expliciete `cacheRetention: "long"` verzendt `prompt_cache_retention: "24h"` alleen wanneer die compat-vermelding ook lang cachebehoud ondersteunt. Providers zoals Mistral kunnen cachekeys inschakelen terwijl ze `compat.supportsLongCacheRetention: false` instellen om het veld voor lang behoud te onderdrukken. `cacheRetention: "none"` onderdrukt beide velden.
- OpenAI-antwoorden stellen gecachte prompttokens beschikbaar via `usage.prompt_tokens_details.cached_tokens` (of `input_tokens_details.cached_tokens` op Responses API-gebeurtenissen). OpenClaw wijst dat toe aan `cacheRead`.
- GPT-5.6 Responses-gebruik kan ook `input_tokens_details.cache_write_tokens` beschikbaar maken. OpenClaw wijst dat toe aan `cacheWrite` en prijst het tegen het cache-schrijftarief van het model; Responses die het veld weglaten, houden `cacheWrite` op `0`.
- OpenAI retourneert nuttige tracing- en rate-limit-headers zoals `x-request-id`, `openai-processing-ms` en `x-ratelimit-*`, maar cache-hitadministratie moet uit de gebruikspayload komen, niet uit headers.
- In de praktijk gedraagt OpenAI zich vaak als een cache voor initiële voorvoegsels in plaats van Anthropic-achtig hergebruik van een verschuivende volledige geschiedenis. Stabiele tekstbeurten met lange voorvoegsels kunnen in huidige live probes uitkomen rond een plateau van `4864` gecachte tokens, terwijl toolzware of MCP-achtige transcripts vaak rond `4608` gecachte tokens plateaueren, zelfs bij exacte herhalingen.

### Anthropic Vertex

- Anthropic-modellen op Vertex AI (`anthropic-vertex/*`) ondersteunen `cacheRetention` op dezelfde manier als directe Anthropic.
- `cacheRetention: "long"` wordt toegewezen aan de echte promptcache-TTL van 1 uur op Vertex AI-eindpunten.
- Standaard cachebehoud voor `anthropic-vertex` komt overeen met directe Anthropic-standaarden.
- Vertex-aanvragen worden gerouteerd via grensbewuste cachevorming, zodat cachehergebruik afgestemd blijft op wat providers daadwerkelijk ontvangen.

### Amazon Bedrock

- Anthropic Claude-modelrefs (`amazon-bedrock/*anthropic.claude*`) ondersteunen expliciete doorvoer van `cacheRetention`.
- Niet-Anthropic Bedrock-modellen worden tijdens runtime geforceerd naar `cacheRetention: "none"`.

### OpenRouter-modellen

Voor `openrouter/anthropic/*`-modelrefs injecteert OpenClaw Anthropic `cache_control` in systeem-/ontwikkelaarspromptblokken om promptcachehergebruik te verbeteren, alleen wanneer de aanvraag nog steeds is gericht op een geverifieerde OpenRouter-route (`openrouter` op het standaardeindpunt, of een provider/basis-URL die naar `openrouter.ai` resolveert).

Voor `openrouter/deepseek/*`, `openrouter/moonshot*/*` en `openrouter/zai/*`-modelrefs is `contextPruning.mode: "cache-ttl"` toegestaan omdat OpenRouter provider-side promptcaching automatisch afhandelt. OpenClaw injecteert geen Anthropic `cache_control`-markeringen in die aanvragen.

DeepSeek-cacheconstructie is best effort en kan enkele seconden duren. Een onmiddellijke vervolgaanvraag kan nog steeds `cached_tokens: 0` tonen; verifieer met een herhaalde aanvraag met hetzelfde voorvoegsel na een korte vertraging en gebruik `usage.prompt_tokens_details.cached_tokens` als cache-hitsignaal.

Als je het model naar een willekeurige OpenAI-compatibele proxy-URL verwijst, stopt OpenClaw met het injecteren van die OpenRouter-specifieke Anthropic-cachemarkeringen.

### Andere providers

Als de provider deze cachemodus niet ondersteunt, heeft `cacheRetention` geen effect.

### Google Gemini directe API

- Direct Gemini-transport (`api: "google-generative-ai"`) rapporteert cachehits via upstream `cachedContentTokenCount`; OpenClaw wijst dat toe aan `cacheRead`.
- Wanneer `cacheRetention` is ingesteld op een direct Gemini-model, maakt OpenClaw automatisch `cachedContents`-resources voor systeemprompts op Google AI Studio-runs aan, hergebruikt ze en vernieuwt ze. Dit betekent dat je niet langer handmatig vooraf een cached-content-handle hoeft aan te maken.
- Je kunt nog steeds een bestaande Gemini cached-content-handle doorgeven als `params.cachedContent` (of legacy `params.cached_content`) op het geconfigureerde model.
- Dit staat los van Anthropic/OpenAI-promptprefixcaching. Voor Gemini beheert OpenClaw een provider-native `cachedContents`-resource in plaats van cachemarkeringen in de aanvraag te injecteren.

### Gemini CLI-gebruik

- Gemini CLI `stream-json`-uitvoer kan cachehits tonen via `stats.cached`; OpenClaw wijst dat toe aan `cacheRead`. Legacy `--output-format json`-overschrijvingen gebruiken dezelfde gebruiksnormalisatie.
- Als de CLI een directe `stats.input`-waarde weglaat, leidt OpenClaw invoertokens af uit `stats.input_tokens - stats.cached`.
- Dit is alleen gebruiksnormalisatie. Het betekent niet dat OpenClaw Anthropic/OpenAI-achtige promptcachemarkeringen voor Gemini CLI aanmaakt.

## Cachegrens van de systeemprompt

OpenClaw splitst de systeemprompt in een **stabiel voorvoegsel** en een **vluchtig achtervoegsel**, gescheiden door een interne cache-prefixgrens. Inhoud boven de grens (tooldefinities, Skills-metadata, werkruimtebestanden en andere relatief statische context) wordt zo geordend dat die byte-identiek blijft tussen beurten. Inhoud onder de grens (bijvoorbeeld `HEARTBEAT.md`, runtime-tijdstempels en andere metadata per beurt) mag veranderen zonder het gecachte voorvoegsel ongeldig te maken.

Belangrijkste ontwerpkeuzes:

- Stabiele projectcontextbestanden in de werkruimte worden vóór `HEARTBEAT.md` geordend, zodat Heartbeat-verloop het stabiele voorvoegsel niet verbreekt.
- De grens wordt toegepast op vormgeving voor Anthropic-familie, OpenAI-familie, Google en CLI-transport, zodat alle ondersteunde providers profiteren van dezelfde prefixstabiliteit.
- Codex Responses- en Anthropic Vertex-aanvragen worden gerouteerd via grensbewuste cachevorming, zodat cachehergebruik afgestemd blijft op wat providers daadwerkelijk ontvangen.
- Systeempromptvingerafdrukken worden genormaliseerd (witruimte, regeleinden, door hooks toegevoegde context, runtime-capabilityvolgorde), zodat semantisch ongewijzigde prompts KV/cache delen tussen beurten.

Als je onverwachte `cacheWrite`-pieken ziet na een configuratie- of werkruimtewijziging, controleer dan of de wijziging boven of onder de cachegrens terechtkomt. Het verplaatsen van vluchtige inhoud naar onder de grens (of het stabiliseren ervan) lost het probleem vaak op.

## Cache-stabiliteitsbeschermingen van OpenClaw

OpenClaw houdt ook verschillende cachegevoelige payloadvormen deterministisch voordat de aanvraag de provider bereikt:

- Bundle-MCP-toolcatalogi worden deterministisch gesorteerd vóór toolregistratie, zodat wijzigingen in `listTools()`-volgorde het toolsblok niet laten verlopen en promptcachevoorvoegsels niet verbreken.
- Legacy-sessies met persistente afbeeldingsblokken houden de **3 meest recente voltooide beurten** intact; oudere al verwerkte afbeeldingsblokken kunnen worden vervangen door een markering, zodat vervolgaanvragen met veel afbeeldingen niet steeds grote verouderde payloads opnieuw verzenden.

## Afstempatronen

### Gemengd verkeer (aanbevolen standaard)

Houd een langlevende basislijn op je hoofdagent, schakel caching uit op piekachtige notifier-agents:

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

OpenClaw biedt speciale cache-trace-diagnostiek voor ingebedde agent-runs.

Voor normale gebruikersgerichte diagnostiek kunnen `/status` en andere gebruikssamenvattingen de nieuwste transcriptgebruikvermelding gebruiken als fallbackbron voor `cacheRead` / `cacheWrite` wanneer de live sessievermelding die tellers niet heeft.

## Live regressietests

OpenClaw behoudt één gecombineerde live cache-regressiepoort voor herhaalde voorvoegsels, toolbeurten, afbeeldingsbeurten, MCP-achtige tooltranscripts en een Anthropic no-cache-control.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Voer de smalle live poort uit met:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Het baselinebestand slaat de meest recent waargenomen live-cijfers op, plus de providerspecifieke regressie-ondergrenzen die door de test worden gebruikt.
De runner gebruikt ook verse sessie-ID's en prompt-naamruimten per run, zodat eerdere cachestatus de huidige regressiesample niet vervuilt.

Deze tests gebruiken bewust niet dezelfde succescriteria voor alle providers.

### Live-verwachtingen voor Anthropic

- Verwacht expliciete warmup-schrijfacties via `cacheWrite`.
- Verwacht bijna volledig hergebruik van de geschiedenis bij herhaalde turns, omdat Anthropic-cachebeheer het cachebreekpunt door het gesprek heen verplaatst.
- De huidige live-asserties gebruiken nog steeds hoge drempels voor het hitpercentage voor stabiele, tool- en afbeeldingspaden.

### Live-verwachtingen voor OpenAI

- Verwacht alleen `cacheRead`. `cacheWrite` blijft `0`.
- Behandel cachehergebruik bij herhaalde turns als een providerspecifiek plateau, niet als hergebruik van de volledige geschiedenis dat in Anthropic-stijl meebeweegt.
- De huidige live-asserties gebruiken conservatieve ondergrenscontroles die zijn afgeleid van waargenomen live-gedrag op `gpt-5.4-mini`:
  - stabiel prefix: `cacheRead >= 4608`, hitpercentage `>= 0.90`
  - tooltranscript: `cacheRead >= 4096`, hitpercentage `>= 0.85`
  - afbeeldingstranscript: `cacheRead >= 3840`, hitpercentage `>= 0.82`
  - MCP-achtig transcript: `cacheRead >= 4096`, hitpercentage `>= 0.85`

Verse gecombineerde live-verificatie op 2026-04-04 kwam uit op:

- stabiel prefix: `cacheRead=4864`, hitpercentage `0.966`
- tooltranscript: `cacheRead=4608`, hitpercentage `0.896`
- afbeeldingstranscript: `cacheRead=4864`, hitpercentage `0.954`
- MCP-achtig transcript: `cacheRead=4608`, hitpercentage `0.891`

De recente lokale wandkloktijd voor de gecombineerde gate was ongeveer `88s`.

Waarom de asserties verschillen:

- Anthropic stelt expliciete cachebreekpunten en meebewegend hergebruik van gespreksgeschiedenis beschikbaar.
- OpenAI-promptcaching blijft gevoelig voor exact-prefixen, maar het effectief herbruikbare prefix in live Responses-verkeer kan eerder een plateau bereiken dan de volledige prompt.
- Daardoor veroorzaakt het vergelijken van Anthropic en OpenAI met één procentuele drempel voor alle providers valse regressies.

### Configuratie voor `diagnostics.cacheTrace`

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

### Env-toggles (eenmalige foutopsporing)

- `OPENCLAW_CACHE_TRACE=1` schakelt cachetracing in.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` overschrijft het uitvoerpad.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` schakelt vastleggen van de volledige berichtpayload om.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` schakelt vastleggen van prompttekst om.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` schakelt vastleggen van de systeemprompt om.

### Wat te inspecteren

- Cachetrace-events zijn JSONL en bevatten gefaseerde snapshots zoals `session:loaded`, `prompt:before`, `stream:context` en `session:after`.
- De impact van cachetokens per turn is zichtbaar in normale gebruiksoppervlakken via `cacheRead` en `cacheWrite` (bijvoorbeeld `/usage full` en gebruikssamenvattingen van sessies).
- Verwacht bij Anthropic zowel `cacheRead` als `cacheWrite` wanneer caching actief is.
- Verwacht bij OpenAI `cacheRead` bij cache-hits. GPT-5.6 Responses kan ook `cacheWrite` rapporteren terwijl promptsegmenten worden geschreven; andere Responses-payloads die de schrijfteller weglaten, houden deze op `0`.
- Als je requesttracing nodig hebt, log request-ID's en rate-limit-headers apart van cachemetrieken. De huidige cachetrace-uitvoer van OpenClaw is gericht op prompt-/sessievorm en genormaliseerd tokengebruik in plaats van ruwe provider-responsheaders.

## Snelle probleemoplossing

- Hoge `cacheWrite` bij de meeste turns: controleer op vluchtige systeempromptinvoer en verifieer dat het model/de provider je cache-instellingen ondersteunt.
- Hoge `cacheWrite` bij Anthropic: betekent vaak dat het cachebreekpunt terechtkomt op inhoud die bij elke request verandert.
- Lage OpenAI-`cacheRead`: verifieer dat het stabiele prefix vooraan staat, dat het herhaalde prefix minstens 1024 tokens is, en dat dezelfde `prompt_cache_key` wordt hergebruikt voor turns die een cache moeten delen.
- Geen effect van `cacheRetention`: bevestig dat de modelsleutel overeenkomt met `agents.defaults.models["provider/model"]`.
- Bedrock Nova/Mistral-requests met cache-instellingen: verwachte runtime-force naar `none`.

Gerelateerde docs:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
- [Gateway-configuratiereferentie](/nl/gateway/configuration-reference)

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)

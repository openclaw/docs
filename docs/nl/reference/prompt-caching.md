---
read_when:
    - Je wilt de tokenkosten voor prompts verlagen door de cache te behouden
    - Je hebt cachegedrag per agent nodig in configuraties met meerdere agents
    - Je stemt Heartbeat en opschoning op basis van cache-TTL samen af
summary: Instellingen voor promptcaching, samenvoegvolgorde, providergedrag en afstemmingspatronen
title: Promptcaching
x-i18n:
    generated_at: "2026-07-16T16:25:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

Promptcaching laat een modelprovider een ongewijzigd promptvoorvoegsel (systeem-/ontwikkelaarsinstructies, tooldefinities en andere stabiele context) tussen beurten hergebruiken, in plaats van het bij elke aanvraag opnieuw te verwerken. Dit verlaagt de tokenkosten en latentie bij langlopende sessies met herhaalde context.

OpenClaw normaliseert providergebruik naar `cacheRead` en `cacheWrite` waar de upstream-API deze tellers beschikbaar stelt. Gebruiksoverzichten (`/status` en vergelijkbare) vallen terug op de laatste gebruiksvermelding in het transcript wanneer de momentopname van de live sessie geen cachetellers bevat; een live waarde groter dan nul heeft altijd voorrang op de terugvalwaarde.

Providerreferenties:

- [Anthropic-promptcaching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI-promptcaching](https://developers.openai.com/api/docs/guides/prompt-caching)

## Primaire instellingen

### `cacheRetention`

Waarden: `"none" | "short" | "long"`. Configureerbaar als globale standaard, per model en per agent.
`"standard"` is geen alias; gebruik `"short"` voor het standaardcachevenster van de provider. Ongeldige waarden worden met een waarschuwing genegeerd.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # overschrijft de globale standaard voor dit model
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # overschrijft beide standaardwaarden voor deze agent
```

Samenvoegvolgorde (later heeft voorrang):

1. `agents.defaults.params` - globale standaard voor alle modellen
2. `agents.defaults.models["provider/model"].params` - overschrijving per model
3. `agents.list[].params` - overschrijving per agent, gekoppeld op agent-id

Bron: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Snoeit oude context met toolresultaten nadat het TTL-venster van de cache is verstreken, zodat een aanvraag na inactiviteit een te grote geschiedenis niet opnieuw in de cache opslaat.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Zie [Sessies snoeien](/nl/concepts/session-pruning) voor het volledige gedrag.

### Cache warm houden met Heartbeat

Heartbeat kan cachevensters warm houden en herhaalde cacheschrijfbewerkingen na perioden van inactiviteit verminderen. Globaal configureerbaar (`agents.defaults.heartbeat`) of per agent (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Providergedrag

### Anthropic (directe API en Vertex AI)

- `cacheRetention` wordt ondersteund voor providers `anthropic` en `anthropic-vertex`, en voor Claude-modellen op `amazon-bedrock` en aangepaste `anthropic-messages`-compatibele eindpunten wanneer `cacheRetention` expliciet is ingesteld.
- Wanneer dit niet is ingesteld, vult OpenClaw `cacheRetention: "short"` vooraf in voor directe Anthropic (alleen providers `anthropic` en `anthropic-vertex`; andere routes uit de Anthropic-familie vereisen een expliciete waarde).
- Native Anthropic Messages-antwoorden stellen `cache_read_input_tokens` en `cache_creation_input_tokens` beschikbaar, toegewezen aan `cacheRead` en `cacheWrite`.
- `cacheRetention: "short"` wordt toegewezen aan de standaard tijdelijke cache van 5 minuten. `cacheRetention: "long"` vraagt bij expliciete instelling de TTL van 1 uur (`cache_control: { type: "ephemeral", ttl: "1h" }`) aan. Een impliciete of door de omgeving aangestuurde lange bewaartermijn (`OPENCLAW_CACHE_RETENTION=long` zonder expliciete `cacheRetention`) wordt alleen opgewaardeerd naar de TTL van 1 uur op `api.anthropic.com`- of Vertex AI-hosts (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); andere hosts behouden de cache van 5 minuten.

Bron: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (directe API)

- Promptcaching verloopt automatisch op ondersteunde recente modellen; OpenClaw voegt geen cachemarkeringen op blokniveau toe.
- OpenClaw verzendt `prompt_cache_key` om cacheroutering tussen beurten stabiel te houden. Directe `api.openai.com`-hosts krijgen dit automatisch. OpenAI-compatibele proxy's (oMLX, llama.cpp, aangepaste eindpunten) moeten `compat.supportsPromptCacheKey: true` in de modelconfiguratie hebben om zich hiervoor aan te melden; dit wordt voor een proxy nooit automatisch gedetecteerd.
- `prompt_cache_retention: "24h"` wordt alleen toegevoegd wanneer `cacheRetention: "long"` is geselecteerd en het bepaalde eindpunt zowel de cachesleutel als lange bewaring ondersteunt (`compat.supportsLongCacheRetention`, standaard waar; compatibiliteitsprofielen van Together AI en Cloudflare schakelen dit uit). `cacheRetention: "none"` onderdrukt beide velden.
- Cachetreffers worden beschikbaar gesteld via `usage.prompt_tokens_details.cached_tokens` (Chat Completions) of `input_tokens_details.cached_tokens` (Responses API), toegewezen aan `cacheRead`.
- Payloads van de Responses API kunnen ook `input_tokens_details.cache_write_tokens` beschikbaar stellen, toegewezen aan `cacheWrite` en geprijsd volgens het cacheschrijftarief van het model; bij Responses-payloads die het veld weglaten, blijft `cacheWrite` op `0`. De Chat Completions API van OpenAI documenteert of retourneert geen `cache_write_tokens`-teller, maar OpenClaw leest daar toch `prompt_tokens_details.cache_write_tokens` voor OpenRouter-compatibele en DeepSeek-achtige proxy's die een afzonderlijk aantal schrijfbewerkingen rapporteren.
- In de praktijk gedraagt OpenAI zich meer als een cache voor het initiële voorvoegsel dan als het hergebruik van de voortschrijdende volledige geschiedenis door Anthropic; zie [verwachtingen voor live OpenAI](#openai-live-expectations) hieronder.

### Amazon Bedrock

- Anthropic Claude-modelreferenties (`amazon-bedrock/*anthropic.claude*`, plus AWS-voorvoegsels voor systeeminferentieprofielen `us.`/`eu.`/`global.anthropic.claude*`) ondersteunen het expliciet doorgeven van `cacheRetention`.
- Niet-Anthropic-modellen van Bedrock (bijvoorbeeld `amazon.nova-*`) worden tijdens runtime bepaald op geen cachebewaring, ongeacht een geconfigureerde waarde voor `cacheRetention`.
- Ondoorzichtige ARN's van Bedrock-toepassingsinferentieprofielen (profiel-id's die geen `claude` bevatten) worden eveneens bepaald op geen cachebewaring, tenzij `cacheRetention` expliciet is ingesteld, omdat de modelfamilie niet uitsluitend uit de ARN kan worden afgeleid.

### OpenRouter

Voor `openrouter/anthropic/*`-modelreferenties voegt OpenClaw Anthropic-markeringen voor `cache_control` toe aan systeem-/ontwikkelaarspromptblokken, maar alleen wanneer de aanvraag nog steeds op een geverifieerde OpenRouter-route is gericht (`openrouter` op het standaardeindpunt, of een provider/basis-URL die wordt herleid tot `openrouter.ai`). Als het model naar een willekeurige OpenAI-compatibele proxy-URL wordt omgeleid, stopt deze toevoeging.

`contextPruning.mode: "cache-ttl"` is toegestaan voor modelreferenties `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` en `openrouter/zai/*`, omdat deze routes promptcaching aan de providerzijde afhandelen zonder de door OpenClaw toegevoegde markeringen nodig te hebben.

Bron: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Het opbouwen van een DeepSeek-cache op OpenRouter gebeurt naar beste vermogen en kan enkele seconden duren; een onmiddellijke vervolgaanvraag kan nog steeds `cached_tokens: 0` tonen. Verifieer dit na een korte vertraging met een herhaalde aanvraag met hetzelfde voorvoegsel en gebruik `usage.prompt_tokens_details.cached_tokens` als signaal voor een cachetreffer.

### Google Gemini (directe API)

- Direct Gemini-transport (`api: "google-generative-ai"`) rapporteert cachetreffers via upstream `cachedContentTokenCount`, toegewezen aan `cacheRead`.
- Geschikte modelfamilies: `gemini-2.5*` en `gemini-3*` (Live-/previewvarianten buiten deze overeenkomst met het voorvoegsel zijn uitgesloten, bijvoorbeeld `gemini-live-2.5-flash-preview`).
- Wanneer `cacheRetention` op een geschikt model is ingesteld, maakt, hergebruikt en vernieuwt OpenClaw automatisch een `cachedContents`-resource voor de systeemprompt; er is geen handmatige ingang voor gecachete inhoud nodig. De TTL is `300s` voor `cacheRetention: "short"` en `3600s` voor `"long"`.
- Je kunt nog steeds een bestaande Gemini-ingang voor gecachete inhoud doorgeven als `params.cachedContent` (of de verouderde `params.cached_content`); een expliciete ingang slaat het automatische cachebeheerpad volledig over.
- Dit staat los van promptvoorvoegselcaching van Anthropic/OpenAI: OpenClaw beheert voor Gemini een provider-native `cachedContents`-resource in plaats van inline cachemarkeringen toe te voegen.

Bron: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### CLI-harnasproviders (Claude Code, Gemini CLI)

CLI-backends die JSONL-gebruiksgebeurtenissen (`jsonlDialect: "claude-stream-json"` of `"gemini-stream-json"`) uitsturen, lopen via een gedeelde gebruiksparser die verschillende veldnaamvarianten herkent, waaronder een gewone `cached`-teller die wordt toegewezen aan `cacheRead`. Wanneer de JSON-payload van de CLI geen rechtstreeks veld voor invoertokens bevat, leidt OpenClaw dit af als `input_tokens - cached`. Dit is alleen gebruiksnormalisatie; het maakt geen promptcachemarkeringen in Anthropic-/OpenAI-stijl voor deze door een CLI aangestuurde modellen.

Bron: `src/agents/cli-output.ts` (`toCliUsage`).

### Andere providers

Als een provider geen van de bovenstaande cachemodi ondersteunt, heeft `cacheRetention` geen effect.

## Cachegrens van de systeemprompt

OpenClaw splitst de systeemprompt bij een interne cachevoorvoegselgrens in een **stabiel voorvoegsel** en een **vluchtig achtervoegsel**. Inhoud boven de grens (tooldefinities, metadata van Skills en werkruimtebestanden) wordt zodanig geordend dat deze tussen beurten byte-identiek blijft. Inhoud onder de grens (bijvoorbeeld `HEARTBEAT.md`, runtimetijdstempels en andere metadata per beurt) kan veranderen zonder het gecachete voorvoegsel ongeldig te maken.

Belangrijke ontwerpkeuzes:

- Stabiele projectcontextbestanden in de werkruimte worden vóór `HEARTBEAT.md` geordend, zodat wijzigingen door Heartbeat het stabiele voorvoegsel niet ongeldig maken.
- De grens is van toepassing op de vormgeving van transport voor de Anthropic-familie, OpenAI-familie, Google en CLI, zodat alle ondersteunde providers profiteren van dezelfde voorvoegselstabiliteit.
- Aanvragen voor Codex Responses en Anthropic Vertex worden gerouteerd via grensbewuste cachevormgeving, zodat cachehergebruik afgestemd blijft op wat providers daadwerkelijk ontvangen.
- Vingerafdrukken van systeemprompts worden genormaliseerd (witruimte, regeleinden, door hooks toegevoegde context en de volgorde van runtimecapaciteiten), zodat semantisch ongewijzigde prompts tussen beurten dezelfde cache delen.

Als je na een wijziging in de configuratie of werkruimte onverwachte pieken in `cacheWrite` ziet, controleer dan of de wijziging boven of onder de cachegrens terechtkomt. Het probleem wordt meestal opgelost door vluchtige inhoud onder de grens te plaatsen (of deze te stabiliseren).

## OpenClaw-beschermingen voor cachestabiliteit

- Gebundelde MCP-toolcatalogi worden vóór toolregistratie deterministisch gesorteerd (eerst op servernaam, daarna op toolnaam), zodat wijzigingen in de volgorde van `listTools()` het toolblok niet telkens veranderen en promptcachevoorvoegsels ongeldig maken.
- In verouderde sessies met opgeslagen afbeeldingsblokken blijven de **3 meest recente voltooide beurten** intact (waarbij alle voltooide beurten meetellen, niet alleen beurten met afbeeldingen). Oudere, reeds verwerkte afbeeldingsblokken worden vervangen door een tekstmarkering, zodat bij vervolgaanvragen met veel afbeeldingen niet telkens grote, verouderde payloads opnieuw worden verzonden.

## Afstemmingspatronen

### Gemengd verkeer (aanbevolen standaard)

Behoud een langlopende basisinstelling voor je primaire agent en schakel caching uit voor agents die meldingen in pieken versturen:

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

### Basisinstelling gericht op kosten

- Stel `cacheRetention: "short"` als basiswaarde in.
- Schakel `contextPruning.mode: "cache-ttl"` in.
- Houd Heartbeat alleen voor agents die profiteren van warme caches onder je TTL.

## Live regressietests

OpenClaw voert één gecombineerde live regressiepoort voor caching uit die herhaalde voorvoegsels, toolbeurten, afbeeldingsbeurten, MCP-achtige tooltranscripten en een Anthropic-controle zonder cache omvat.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Voer deze uit met:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Het basislijnbestand slaat de meest recent waargenomen live cijfers op, plus de providerspecifieke regressieondergrenzen waartegen de test controleert. Elke uitvoering gebruikt nieuwe sessie-ID's en promptnaamruimten per uitvoering, zodat eerdere cachestatus de huidige steekproef niet beïnvloedt. Anthropic en OpenAI hanteren verschillende handhaving: het niet halen van een ondergrens bij Anthropic is een harde regressie (de test mislukt), terwijl het niet halen van een ondergrens bij OpenAI alleen ter observatie dient (wordt als waarschuwing vastgelegd en laat de uitvoering niet mislukken). Ze delen niet één drempelwaarde voor meerdere providers.

### Live verwachtingen voor Anthropic

- Verwacht expliciete warm-upschrijfbewerkingen via `cacheWrite`.
- Verwacht bij herhaalde beurten vrijwel volledig hergebruik van de geschiedenis, omdat het cachebeheer van Anthropic het cachebreekpunt door het gesprek heen verplaatst.
- Basislijnondergrenzen voor stabiele, tool-, afbeeldings- en MCP-achtige lanes zijn harde regressiepoorten.

### Live verwachtingen voor OpenAI

- Verwacht alleen `cacheRead`; `cacheWrite` blijft `0` bij Chat Completions.
- Behandel cachehergebruik bij herhaalde beurten als een providerspecifiek plateau, niet als bewegend hergebruik van de volledige geschiedenis zoals bij Anthropic.
- Ondergrenzen dienen alleen ter observatie (het niet halen wordt als waarschuwing geregistreerd en laat de test niet mislukken) en zijn afgeleid van waargenomen live gedrag op `gpt-5.4-mini`:

| Scenario             | Ondergrens voor `cacheRead` | Ondergrens voor trefratio |
| -------------------- | ----------------: | -------------: |
| Stabiel voorvoegsel        |             4,608 |           0.90 |
| Tooltranscript      |             4,096 |           0.85 |
| Afbeeldingstranscript     |             3,840 |           0.82 |
| MCP-achtig transcript |             4,096 |           0.85 |

De meest recent waargenomen basislijncijfers (uit `live-cache-regression-baseline.ts`) kwamen uit op: stabiel voorvoegsel `cacheRead=4864`, trefratio `0.966`; tooltranscript `cacheRead=4608`, trefratio `0.896`; afbeeldingstranscript `cacheRead=4864`, trefratio `0.954`; MCP-achtig transcript `cacheRead=4608`, trefratio `0.891`.

Waarom de controles verschillen: Anthropic stelt expliciete cachebreekpunten en bewegend hergebruik van de gespreksgeschiedenis beschikbaar, terwijl het effectief herbruikbare voorvoegsel van OpenAI in live verkeer eerder een plateau kan bereiken dan de volledige prompt. Wanneer beide providers met één percentagegrens voor meerdere providers worden vergeleken, ontstaan onterechte regressies.

## Configuratie van `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optioneel
    includeMessages: false # standaard true
    includePrompt: false # standaard true
    includeSystem: false # standaard true
```

Standaardwaarden:

| Sleutel               | Standaardwaarde                                      |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Omgevingsschakelaars (eenmalige foutopsporing)

| Variabele                             | Effect                               |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | Schakelt cachetracering in                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Overschrijft het uitvoerpad                |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Schakelt het vastleggen van de volledige berichtpayload in of uit |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Schakelt het vastleggen van prompttekst in of uit          |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Schakelt het vastleggen van de systeemprompt in of uit        |

### Wat je moet controleren

- Cachetracegebeurtenissen zijn JSONL met gefaseerde momentopnamen zoals `session:loaded`, `prompt:before`, `stream:context` en `session:after`.
- De invloed van cachetokens per beurt is zichtbaar in normale gebruiksinterfaces: `cacheRead` en `cacheWrite` verschijnen in `/usage tokens`, `/status`, gebruikssamenvattingen van sessies en aangepaste `messages.usageTemplate`-indelingen.
- Verwacht bij Anthropic zowel `cacheRead` als `cacheWrite` wanneer caching actief is.
- Verwacht bij OpenAI `cacheRead` bij cachetreffers; `cacheWrite` wordt alleen ingevuld voor payloads van de Responses API die dit bevatten (zie [OpenAI](#openai-direct-api) hierboven).
- OpenAI retourneert ook headers voor tracering en snelheidslimieten, zoals `x-request-id`, `openai-processing-ms` en `x-ratelimit-*`; gebruik deze om aanvragen te traceren, maar baseer de boekhouding van cachetreffers nog steeds op de gebruikspayload en niet op headers.

## Snelle probleemoplossing

- **Hoge `cacheWrite` bij de meeste beurten**: controleer op variabele invoer in de systeemprompt; verifieer dat het model/de provider je cache-instellingen ondersteunt.
- **Hoge `cacheWrite` bij Anthropic**: dit betekent vaak dat het cachebreekpunt terechtkomt op inhoud die bij elke aanvraag verandert.
- **Lage OpenAI-`cacheRead`**: verifieer dat het stabiele voorvoegsel vooraan staat, het herhaalde voorvoegsel minstens 1024 tokens bevat en dezelfde `prompt_cache_key` opnieuw wordt gebruikt voor beurten die een cache moeten delen.
- **Geen effect van `cacheRetention`**: bevestig dat de modelsleutel overeenkomt met `agents.defaults.models["provider/model"]`.
- **Bedrock Nova-aanvragen met cache-instellingen**: verwacht — deze worden tijdens runtime omgezet naar geen cachebehoud.

Gerelateerde documentatie:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Sessies opschonen](/nl/concepts/session-pruning)
- [Configuratiereferentie voor de Gateway](/nl/gateway/configuration-reference)

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)

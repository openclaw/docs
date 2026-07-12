---
read_when:
    - Je wilt de kosten voor prompttokens verlagen door de cache langer te bewaren
    - Je hebt cachegedrag per agent nodig in configuraties met meerdere agents
    - Je stemt Heartbeat en opschoning op basis van cache-TTL op elkaar af
summary: Instellingen voor promptcaching, samenvoegvolgorde, providergedrag en afstemmingspatronen
title: Promptcaching
x-i18n:
    generated_at: "2026-07-12T09:23:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

Promptcaching stelt een modelprovider in staat om een ongewijzigd promptprefix (systeem-/ontwikkelaarsinstructies, tooldefinities en andere stabiele context) over meerdere beurten te hergebruiken, in plaats van dit bij elke aanvraag opnieuw te verwerken. Dit verlaagt de tokenkosten en latentie voor langlopende sessies met herhaalde context.

OpenClaw normaliseert providergebruik naar `cacheRead` en `cacheWrite` wanneer de upstream-API deze tellers beschikbaar stelt. Gebruiksoverzichten (`/status` en vergelijkbare overzichten) vallen terug op de laatste gebruiksvermelding in het transcript wanneer de momentopname van de actieve sessie geen cachetellers bevat; een actieve waarde groter dan nul heeft altijd voorrang op de terugvalwaarde.

Providerreferenties:

- [Anthropic-promptcaching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI-promptcaching](https://developers.openai.com/api/docs/guides/prompt-caching)

## Primaire instellingen

### `cacheRetention`

Waarden: `"none" | "short" | "long"`. Configureerbaar als globale standaardwaarde, per model en per agent.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # overschrijft de globale standaardwaarde voor dit model
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # overschrijft beide standaardwaarden voor deze agent
```

Samenvoegvolgorde (later heeft voorrang):

1. `agents.defaults.params` - globale standaardwaarde voor alle modellen
2. `agents.defaults.models["provider/model"].params` - overschrijving per model
3. `agents.list[].params` - overschrijving per agent, gekoppeld op agent-id

Bron: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Snoeit oude context met toolresultaten nadat het TTL-venster van de cache is verstreken, zodat een aanvraag na een periode van inactiviteit een te grote geschiedenis niet opnieuw in de cache opslaat.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Zie [Sessies snoeien](/nl/concepts/session-pruning) voor het volledige gedrag.

### Cache warm houden met Heartbeat

Heartbeat kan cachevensters warm houden en herhaalde schrijfbewerkingen naar de cache na perioden van inactiviteit verminderen. Globaal configureerbaar (`agents.defaults.heartbeat`) of per agent (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Providergedrag

### Anthropic (directe API en Vertex AI)

- `cacheRetention` wordt ondersteund voor de providers `anthropic` en `anthropic-vertex`, en voor Claude-modellen op `amazon-bedrock` en aangepaste eindpunten die compatibel zijn met `anthropic-messages` wanneer `cacheRetention` expliciet is ingesteld.
- Wanneer de waarde niet is ingesteld, initialiseert OpenClaw `cacheRetention: "short"` voor directe Anthropic-verbindingen (alleen de providers `anthropic` en `anthropic-vertex`; andere routes uit de Anthropic-familie vereisen een expliciete waarde).
- Native antwoorden van Anthropic Messages stellen `cache_read_input_tokens` en `cache_creation_input_tokens` beschikbaar, toegewezen aan `cacheRead` en `cacheWrite`.
- `cacheRetention: "short"` wordt toegewezen aan de standaard tijdelijke cache van 5 minuten. `cacheRetention: "long"` vraagt expliciet om de TTL van 1 uur (`cache_control: { type: "ephemeral", ttl: "1h" }`). Een impliciete of door de omgeving aangestuurde lange bewaartijd (`OPENCLAW_CACHE_RETENTION=long` zonder expliciete `cacheRetention`) wordt alleen opgewaardeerd naar de TTL van 1 uur op hosts van `api.anthropic.com` of Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); andere hosts behouden de cache van 5 minuten.

Bron: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (directe API)

- Promptcaching verloopt automatisch op ondersteunde recente modellen; OpenClaw voegt geen cachemarkeringen op blokniveau toe.
- OpenClaw verzendt `prompt_cache_key` om de cacheroutering over meerdere beurten stabiel te houden. Directe hosts van `api.openai.com` krijgen dit automatisch. OpenAI-compatibele proxy's (oMLX, llama.cpp en aangepaste eindpunten) moeten zich hiervoor aanmelden met `compat.supportsPromptCacheKey: true` in de modelconfiguratie; dit wordt voor een proxy nooit automatisch gedetecteerd.
- `prompt_cache_retention: "24h"` wordt alleen toegevoegd wanneer `cacheRetention: "long"` is geselecteerd en het gevonden eindpunt zowel de cachesleutel als lange bewaring ondersteunt (`compat.supportsLongCacheRetention`, standaard `true`; compatibiliteitsprofielen van Together AI en Cloudflare schakelen dit uit). `cacheRetention: "none"` onderdrukt beide velden.
- Cachetreffers worden beschikbaar gesteld via `usage.prompt_tokens_details.cached_tokens` (Chat Completions) of `input_tokens_details.cached_tokens` (Responses API), toegewezen aan `cacheRead`.
- Payloads van de Responses API kunnen ook `input_tokens_details.cache_write_tokens` beschikbaar stellen, toegewezen aan `cacheWrite` en geprijsd volgens het tarief voor cacheschrijfbewerkingen van het model; bij Responses-payloads waarin het veld ontbreekt, blijft `cacheWrite` op `0`. De Chat Completions API van OpenAI documenteert of retourneert geen teller `cache_write_tokens`, maar OpenClaw leest daar toch `prompt_tokens_details.cache_write_tokens` voor OpenRouter-compatibele en DeepSeek-achtige proxy's die een afzonderlijk aantal schrijfbewerkingen rapporteren.
- In de praktijk gedraagt OpenAI zich meer als een cache voor het initiële prefix dan als Anthropic met hergebruik van de verschuivende volledige geschiedenis; zie [Verwachtingen voor livegebruik van OpenAI](#openai-live-expectations) hieronder.

### Amazon Bedrock

- Anthropic Claude-modelreferenties (`amazon-bedrock/*anthropic.claude*`, plus AWS-prefixen voor systeeminferentieprofielen `us.`/`eu.`/`global.anthropic.claude*`) ondersteunen expliciete doorgifte van `cacheRetention`.
- Niet-Anthropic-modellen van Bedrock (bijvoorbeeld `amazon.nova-*`) worden tijdens runtime omgezet naar geen cachebewaring, ongeacht een eventueel geconfigureerde waarde voor `cacheRetention`.
- Ondoorzichtige ARN's van Bedrock-toepassingsinferentieprofielen (profiel-id's die geen `claude` bevatten) worden eveneens omgezet naar geen cachebewaring, tenzij `cacheRetention` expliciet is ingesteld, omdat de modelfamilie niet uitsluitend uit de ARN kan worden afgeleid.

### OpenRouter

Voor modelreferenties van `openrouter/anthropic/*` voegt OpenClaw Anthropic-markeringen voor `cache_control` toe aan systeem-/ontwikkelaarspromptblokken, maar alleen wanneer de aanvraag nog steeds naar een geverifieerde OpenRouter-route gaat (`openrouter` op het standaardeindpunt, of een provider/basis-URL die naar `openrouter.ai` wordt omgezet). Als het model naar een willekeurige OpenAI-compatibele proxy-URL wordt omgeleid, stopt deze toevoeging.

`contextPruning.mode: "cache-ttl"` is toegestaan voor modelreferenties van `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` en `openrouter/zai/*`, omdat deze routes promptcaching aan de providerzijde afhandelen zonder dat door OpenClaw toegevoegde markeringen nodig zijn.

Bron: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Het opbouwen van de DeepSeek-cache op OpenRouter gebeurt op basis van beste inspanning en kan enkele seconden duren; een onmiddellijke vervolgaanvraag kan nog steeds `cached_tokens: 0` tonen. Verifieer dit na een korte vertraging met een herhaalde aanvraag met hetzelfde prefix en gebruik `usage.prompt_tokens_details.cached_tokens` als signaal voor een cachetreffer.

### Google Gemini (directe API)

- Direct Gemini-transport (`api: "google-generative-ai"`) rapporteert cachetreffers via upstream `cachedContentTokenCount`, toegewezen aan `cacheRead`.
- Geschikte modelfamilies: `gemini-2.5*` en `gemini-3*` (Live-/previewvarianten buiten deze prefixovereenkomst zijn uitgesloten, bijvoorbeeld `gemini-live-2.5-flash-preview`).
- Wanneer `cacheRetention` is ingesteld op een geschikt model, maakt, hergebruikt en vernieuwt OpenClaw automatisch een `cachedContents`-resource voor de systeemprompt; een handmatige verwijzing naar gecachte inhoud is niet nodig. De TTL is `300s` voor `cacheRetention: "short"` en `3600s` voor `"long"`.
- U kunt nog steeds een bestaande Gemini-verwijzing naar gecachte inhoud doorgeven als `params.cachedContent` (of de verouderde vorm `params.cached_content`); een expliciete verwijzing slaat het automatische cachebeheer volledig over.
- Dit staat los van promptprefixcaching van Anthropic/OpenAI: OpenClaw beheert voor Gemini een providereigen `cachedContents`-resource in plaats van inline cachemarkeringen toe te voegen.

Bron: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Providers met een CLI-harnas (Claude Code, Gemini CLI)

CLI-backends die JSONL-gebruiksgebeurtenissen produceren (`jsonlDialect: "claude-stream-json"` of `"gemini-stream-json"`) gebruiken een gedeelde gebruiksparser die meerdere veldnaamvarianten herkent, waaronder een gewone teller `cached` die aan `cacheRead` wordt toegewezen. Wanneer de JSON-payload van de CLI geen rechtstreeks veld voor invoertokens bevat, leidt OpenClaw dit af als `input_tokens - cached`. Dit is alleen normalisatie van gebruik; het maakt geen promptcachemarkeringen in Anthropic-/OpenAI-stijl voor deze via de CLI aangestuurde modellen.

Bron: `src/agents/cli-output.ts` (`toCliUsage`).

### Andere providers

Als een provider geen van de bovenstaande cachemodi ondersteunt, heeft `cacheRetention` geen effect.

## Cachegrens van de systeemprompt

OpenClaw splitst de systeemprompt bij een interne cacheprefixgrens in een **stabiel prefix** en een **vluchtig suffix**. Inhoud boven de grens (tooldefinities, metagegevens van Skills en werkruimtebestanden) wordt geordend om over meerdere beurten byte-identiek te blijven. Inhoud onder de grens (bijvoorbeeld `HEARTBEAT.md`, runtime-tijdstempels en andere metagegevens per beurt) kan veranderen zonder het gecachte prefix ongeldig te maken.

Belangrijke ontwerpkeuzes:

- Stabiele projectcontextbestanden van de werkruimte worden vóór `HEARTBEAT.md` geordend, zodat veranderingen door Heartbeat het stabiele prefix niet verbreken.
- De grens wordt toegepast bij de transportvormgeving voor de Anthropic-familie, OpenAI-familie, Google en CLI, zodat alle ondersteunde providers profiteren van dezelfde prefixstabiliteit.
- Codex Responses- en Anthropic Vertex-aanvragen worden verwerkt via grensbewuste cachevormgeving, zodat cachehergebruik afgestemd blijft op wat providers daadwerkelijk ontvangen.
- Vingerafdrukken van systeemprompts worden genormaliseerd (witruimte, regeleinden, door hooks toegevoegde context en ordening van runtimecapaciteiten), zodat semantisch ongewijzigde prompts over meerdere beurten dezelfde cache delen.

Als u onverwachte pieken in `cacheWrite` ziet na een wijziging in de configuratie of werkruimte, controleert u of de wijziging boven of onder de cachegrens terechtkomt. Het probleem wordt meestal opgelost door vluchtige inhoud onder de grens te plaatsen (of deze te stabiliseren).

## Beschermingsmechanismen voor cachestabiliteit van OpenClaw

- Meegeleverde MCP-toolcatalogi worden vóór toolregistratie deterministisch gesorteerd (eerst op servernaam, daarna op toolnaam), zodat wijzigingen in de volgorde van `listTools()` het toolblok niet voortdurend wijzigen en promptcacheprefixen niet verbreken.
- Bij verouderde sessies met opgeslagen afbeeldingsblokken blijven de **3 meest recente voltooide beurten** intact (waarbij alle voltooide beurten worden geteld, niet alleen die met afbeeldingen). Oudere, al verwerkte afbeeldingsblokken worden vervangen door een tekstmarkering, zodat bij vervolgaanvragen met veel afbeeldingen niet voortdurend grote, verouderde payloads opnieuw worden verzonden.

## Afstemmingspatronen

### Gemengd verkeer (aanbevolen standaardwaarde)

Gebruik een langlevende basisconfiguratie voor uw primaire agent en schakel caching uit voor agents die meldingen in pieken versturen:

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

### Basisconfiguratie met kosten als prioriteit

- Stel de basiswaarde `cacheRetention: "short"` in.
- Schakel `contextPruning.mode: "cache-ttl"` in.
- Houd Heartbeat alleen onder uw TTL voor agents die voordeel hebben van warme caches.

## Live-regressietests

OpenClaw voert één gecombineerde live-regressiecontrole voor caches uit, die herhaalde prefixen, toolbeurten, afbeeldingsbeurten, MCP-achtige tooltranscripten en een Anthropic-controle zonder cache omvat.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Voer deze als volgt uit:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Het basislijnbestand slaat de meest recent waargenomen livewaarden op, samen met de providerspecifieke regressieondergrenzen waaraan de test toetst. Elke uitvoering gebruikt nieuwe sessie-id's en promptnaamruimten per uitvoering, zodat eerdere cachestatus het huidige monster niet verstoort. Anthropic en OpenAI gebruiken verschillende handhaving: het niet halen van een Anthropic-ondergrens is een harde regressie (de test mislukt), terwijl het niet halen van een OpenAI-ondergrens alleen wordt bewaakt (vastgelegd als waarschuwing en de uitvoering mislukt niet). Ze delen niet één drempelwaarde voor alle providers.

### Verwachtingen voor livegebruik van Anthropic

- Verwacht expliciete opwarmwrites via `cacheWrite`.
- Verwacht bij herhaalde beurten dat vrijwel de volledige geschiedenis wordt hergebruikt, omdat Anthropic's cachebeheer het cachebreekpunt tijdens het gesprek steeds verder verplaatst.
- Ondergrenzen voor stabiele, tool-, afbeeldings- en MCP-achtige paden zijn strikte regressiepoorten.

### Verwachtingen voor livegebruik van OpenAI

- Verwacht alleen `cacheRead`; bij Chat Completions blijft `cacheWrite` `0`.
- Beschouw cachehergebruik bij herhaalde beurten als een providerspecifiek plateau, niet als met Anthropic vergelijkbaar voortschrijdend hergebruik van de volledige geschiedenis.
- Ondergrenzen dienen alleen voor bewaking (een gemiste ondergrens wordt als waarschuwing vastgelegd en laat de test niet mislukken) en zijn afgeleid van waargenomen livegedrag op `gpt-5.4-mini`:

| Scenario                | Ondergrens voor `cacheRead` | Ondergrens voor trefpercentage |
| ----------------------- | --------------------------: | -----------------------------: |
| Stabiel voorvoegsel     |                       4,608 |                           0.90 |
| Tooltranscript          |                       4,096 |                           0.85 |
| Afbeeldingstranscript   |                       3,840 |                           0.82 |
| MCP-achtig transcript   |                       4,096 |                           0.85 |

De laatst waargenomen basiswaarden (uit `live-cache-regression-baseline.ts`) waren: stabiel voorvoegsel `cacheRead=4864`, trefpercentage `0.966`; tooltranscript `cacheRead=4608`, trefpercentage `0.896`; afbeeldingstranscript `cacheRead=4864`, trefpercentage `0.954`; MCP-achtig transcript `cacheRead=4608`, trefpercentage `0.891`.

Waarom de controles verschillen: Anthropic biedt expliciete cachebreekpunten en voortschrijdend hergebruik van de gespreksgeschiedenis, terwijl het effectief herbruikbare voorvoegsel van OpenAI in liveverkeer eerder een plateau kan bereiken dan de volledige prompt. Vergelijking van beide providers met één providersoverschrijdende procentuele drempel leidt tot foutieve regressiemeldingen.

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

| Sleutel            | Standaardwaarde                              |
| ------------------ | -------------------------------------------- |
| `filePath`         | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages`  | `true`                                       |
| `includePrompt`    | `true`                                       |
| `includeSystem`    | `true`                                       |

### Omgevingsschakelaars (eenmalige foutopsporing)

| Variabele                            | Effect                                        |
| ------------------------------------ | --------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Schakelt cachetracering in                     |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Overschrijft het uitvoerpad                    |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Schakelt vastlegging van volledige berichten  |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Schakelt vastlegging van prompttekst           |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Schakelt vastlegging van de systeemprompt      |

### Wat te controleren

- Cachetraceringsgebeurtenissen zijn JSONL-records met gefaseerde momentopnamen zoals `session:loaded`, `prompt:before`, `stream:context` en `session:after`.
- De invloed van cachetokens per beurt is zichtbaar in de normale gebruiksoverzichten: `cacheRead` en `cacheWrite` verschijnen in `/usage tokens`, `/status`, gebruikssamenvattingen van sessies en aangepaste indelingen voor `messages.usageTemplate`.
- Verwacht bij Anthropic zowel `cacheRead` als `cacheWrite` wanneer caching actief is.
- Verwacht bij OpenAI `cacheRead` bij cachetreffers; `cacheWrite` wordt alleen ingevuld voor payloads van de Responses API waarin dit veld is opgenomen (zie [OpenAI](#openai-direct-api) hierboven).
- OpenAI retourneert ook tracerings- en snelheidslimietheaders zoals `x-request-id`, `openai-processing-ms` en `x-ratelimit-*`; gebruik deze voor het traceren van aanvragen, maar baseer de registratie van cachetreffers nog steeds op de gebruikspayload en niet op headers.

## Snelle probleemoplossing

- **Hoge `cacheWrite` bij de meeste beurten**: controleer op veranderlijke invoer voor de systeemprompt; verifieer dat het model/de provider uw cache-instellingen ondersteunt.
- **Hoge `cacheWrite` bij Anthropic**: betekent vaak dat het cachebreekpunt terechtkomt op inhoud die bij elke aanvraag verandert.
- **Lage `cacheRead` bij OpenAI**: verifieer dat het stabiele voorvoegsel vooraan staat, dat het herhaalde voorvoegsel minstens 1024 tokens bevat en dat dezelfde `prompt_cache_key` wordt hergebruikt voor beurten die een cache moeten delen.
- **Geen effect van `cacheRetention`**: controleer of de modelsleutel overeenkomt met `agents.defaults.models["provider/model"]`.
- **Bedrock Nova-aanvragen met cache-instellingen**: verwacht gedrag — deze worden tijdens runtime omgezet naar geen cachebewaring.

Gerelateerde documentatie:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Sessies opschonen](/nl/concepts/session-pruning)
- [Configuratiereferentie voor de Gateway](/nl/gateway/configuration-reference)

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)

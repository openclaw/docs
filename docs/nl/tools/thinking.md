---
read_when:
    - Parsing of standaardwaarden voor thinking-, fast-mode- of verbose-richtlijnen aanpassen
summary: Directievensyntaxis voor /think, /fast, /verbose, /trace en zichtbaarheid van redenering
title: Denkniveaus
x-i18n:
    generated_at: "2026-05-06T09:37:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19fed0d7d8499d177361d125027ca5001dfe73a4ea5bc7f7475faa10541c7a83
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inline directive in elke inkomende body: `/t <level>`, `/think:<level>` of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maximaal budget)
  - xhigh → "ultrathink+" (GPT-5.2+- en Codex-modellen, plus Anthropic Claude Opus 4.7-inspanning)
  - adaptive → door provider beheerd adaptief denken (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7 en dynamisch denken van Google Gemini)
  - max → maximale redenering van provider (Anthropic Claude Opus 4.7; Ollama koppelt dit aan zijn hoogste native `think`-inspanning)
  - `x-high`, `x_high`, `extra-high`, `extra high` en `extra_high` worden gekoppeld aan `xhigh`.
  - `highest` wordt gekoppeld aan `high`.
- Provider-opmerkingen:
  - Denkmenu's en keuzelijsten worden aangestuurd door het providerprofiel. Provider-Plugins declareren de exacte niveauset voor het geselecteerde model, inclusief labels zoals binair `on`.
  - `adaptive`, `xhigh` en `max` worden alleen getoond voor provider-/modelprofielen die ze ondersteunen. Getypte directives voor niet-ondersteunde niveaus worden geweigerd met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van de rangorde in het providerprofiel. `adaptive` valt terug op `medium` bij niet-adaptieve modellen, terwijl `xhigh` en `max` terugvallen op het grootste ondersteunde niet-uitgeschakelde niveau voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer er geen expliciet denkniveau is ingesteld.
  - Anthropic Claude Opus 4.7 gebruikt niet standaard adaptief denken. De standaardwaarde voor API-inspanning blijft eigendom van de provider, tenzij je expliciet een denkniveau instelt.
  - Anthropic Claude Opus 4.7 koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkdirective is en `xhigh` de inspanningsinstelling van Opus 4.7 is.
  - Anthropic Claude Opus 4.7 biedt ook `/think max`; dit wordt gekoppeld aan hetzelfde provider-eigen pad voor maximale inspanning.
  - Directe DeepSeek V4-modellen bieden `/think xhigh|max`; beide worden gekoppeld aan DeepSeek `reasoning_effort: "max"`, terwijl lagere niet-uitgeschakelde niveaus worden gekoppeld aan `high`.
  - Via OpenRouter gerouteerde DeepSeek V4-modellen bieden `/think xhigh` en verzenden door OpenRouter ondersteunde `reasoning_effort`-waarden. Opgeslagen `max`-overschrijvingen vallen terug op `xhigh`.
  - Ollama-modellen met denkondersteuning bieden `/think low|medium|high|max`; `max` wordt gekoppeld aan native `think: "high"` omdat Ollama's native API de inspanningsstrings `low`, `medium` en `high` accepteert.
  - OpenAI GPT-modellen koppelen `/think` via modelspecifieke inspanningsondersteuning van de Responses API. `/think off` verzendt `reasoning.effort: "none"` alleen wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde redeneringspayload weg in plaats van een niet-ondersteunde waarde te verzenden.
  - Aangepaste OpenAI-compatibele catalogusitems kunnen zich aanmelden voor `/think xhigh` door `models.providers.<provider>.models[].compat.supportedReasoningEfforts` zo in te stellen dat `"xhigh"` is opgenomen. Dit gebruikt dezelfde compat-metadata die uitgaande OpenAI-redeneringspayloads koppelt, zodat menu's, sessievalidering, agent-CLI en `llm-task` overeenkomen met het transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-referenties slaan proxy-redeneringsinjectie over omdat die ingetrokken route definitieve antwoordtekst via redeneringsvelden kon teruggeven.
  - Google Gemini koppelt `/think adaptive` aan Gemini's provider-eigen dynamisch denken. Gemini 3-verzoeken laten een vast `thinkingLevel` weg, terwijl Gemini 2.5-verzoeken `thinkingBudget: -1` verzenden; vaste niveaus worden nog steeds gekoppeld aan het dichtstbijzijnde Gemini-`thinkingLevel` of budget voor die modelfamilie.
  - MiniMax (`minimax/*`) op het Anthropic-compatibele streamingpad gebruikt standaard `thinking: { type: "disabled" }`, tenzij je expliciet denken instelt in modelparameters of aanvraagparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit MiniMax' niet-native Anthropic-streamformaat.
  - Z.AI (`zai/*`) ondersteunt alleen binair denken (`on`/`off`). Elk niet-`off`-niveau wordt behandeld als `on` (gekoppeld aan `low`).
  - Moonshot (`moonshot/*`) koppelt `/think off` aan `thinking: { type: "disabled" }` en elk niet-`off`-niveau aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot alleen `tool_choice` `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Resolutievolgorde

1. Inline directive op het bericht (geldt alleen voor dat bericht).
2. Sessie-overschrijving (ingesteld door een bericht met alleen een directive te sturen).
3. Standaardwaarde per agent (`agents.list[].thinkingDefault` in config).
4. Globale standaardwaarde (`agents.defaults.thinkingDefault` in config).
5. Terugval: door provider gedeclareerde standaardwaarde wanneer beschikbaar; anders worden modellen met redeneringsmogelijkheden opgelost naar `medium` of het dichtstbijzijnde ondersteunde niet-`off`-niveau voor dat model, en blijven modellen zonder redenering op `off`.

## Een sessiestandaard instellen

- Stuur een bericht dat **alleen** de directive bevat (witruimte toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Dat blijft actief voor de huidige sessie (standaard per afzender); gewist door `/think:off` of door reset na sessie-inactiviteit.
- Er wordt een bevestigingsantwoord verzonden (`Thinking level set to high.` / `Thinking disabled.`). Als het niveau ongeldig is (bijvoorbeeld `/thinking big`), wordt de opdracht geweigerd met een hint en blijft de sessiestatus ongewijzigd.
- Stuur `/think` (of `/think:`) zonder argument om het huidige denkniveau te bekijken.

## Toepassing per agent

- **Ingebouwde Pi**: het opgeloste niveau wordt doorgegeven aan de in-process Pi-agentruntime.
- **Claude CLI-backend**: niet-uitgeschakelde niveaus worden aan Claude Code doorgegeven als `--effort` wanneer `claude-cli` wordt gebruikt; zie [CLI-backends](/nl/gateway/cli-backends).

## Snelle modus (/fast)

- Niveaus: `on|off`.
- Een bericht met alleen een directive schakelt een sessie-overschrijving voor snelle modus in of uit en antwoordt `Fast mode enabled.` / `Fast mode disabled.`.
- Stuur `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van snelle modus te bekijken.
- OpenClaw lost snelle modus in deze volgorde op:
  1. Inline/alleen-directive `/fast on|off`
  2. Sessie-overschrijving
  3. Standaardwaarde per agent (`agents.list[].fastModeDefault`)
  4. Configuratie per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Terugval: `off`
- Voor `openai/*` wordt snelle modus gekoppeld aan OpenAI-prioriteitsverwerking door `service_tier=priority` te verzenden bij ondersteunde Responses-verzoeken.
- Voor `openai-codex/*` verzendt snelle modus dezelfde vlag `service_tier=priority` bij Codex Responses. OpenClaw behoudt één gedeelde `/fast`-schakelaar voor beide authenticatiepaden.
- Voor directe publieke `anthropic/*`-verzoeken, inclusief met OAuth geauthenticeerd verkeer dat naar `api.anthropic.com` wordt verzonden, wordt snelle modus gekoppeld aan Anthropic-serviceniveaus: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic-modelparameters `serviceTier` / `service_tier` overschrijven de standaardwaarde van snelle modus wanneer beide zijn ingesteld. OpenClaw slaat Anthropic-serviceniveau-injectie nog steeds over voor niet-Anthropic proxybasis-URL's.
- `/status` toont `Fast` alleen wanneer snelle modus is ingeschakeld.

## Uitgebreide directives (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht met alleen een directive schakelt uitgebreide sessielogging in of uit en antwoordt `Verbose logging enabled.` / `Verbose logging disabled.`; ongeldige niveaus geven een hint terug zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessie-overschrijving op; wis die via de sessie-UI door `inherit` te kiezen.
- Een inline directive beïnvloedt alleen dat bericht; anders gelden sessie-/globale standaardwaarden.
- Stuur `/verbose` (of `/verbose:`) zonder argument om het huidige uitgebreide niveau te bekijken.
- Wanneer uitgebreid aan staat, sturen agents die gestructureerde toolresultaten uitsturen (Pi, andere JSON-agents) elke toolaanroep terug als een eigen bericht met alleen metadata, voorafgegaan door `<emoji> <tool-name>: <arg>` wanneer beschikbaar. Deze toolsamenvattingen worden verzonden zodra elke tool start (afzonderlijke bubbels), niet als streamingdelta's.
- Samenvattingen van toolfouten blijven zichtbaar in normale modus, maar suffixen met ruwe foutdetails worden verborgen tenzij uitgebreid `on` of `full` is.
- Wanneer uitgebreid `full` is, worden tooloutputs ook na voltooiing doorgestuurd (afzonderlijke bubbel, ingekort tot een veilige lengte). Als je `/verbose on|full|off` schakelt terwijl een run bezig is, gebruiken latere toolbubbels de nieuwe instelling.
- `agents.defaults.toolProgressDetail` bepaalt de vorm van `/verbose`-toolsamenvattingen en toolregels in voortgangsconcepten. Gebruik `"explain"` (standaard) voor compacte menselijke labels zoals `🛠️ Exec: checking JS syntax`; gebruik `"raw"` wanneer je ook de ruwe opdracht/details wilt toevoegen voor debugging. Per-agent `agents.list[].toolProgressDetail` overschrijft de standaardwaarde.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-tracedirectives (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht met alleen een directive schakelt Plugin-trace-uitvoer voor de sessie in of uit en antwoordt `Plugin trace enabled.` / `Plugin trace disabled.`.
- Een inline directive beïnvloedt alleen dat bericht; anders gelden sessie-/globale standaardwaarden.
- Stuur `/trace` (of `/trace:`) zonder argument om het huidige traceniveau te bekijken.
- `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van de Plugin, zoals Active Memory-debugsamenvattingen.
- Traceregels kunnen verschijnen in `/status` en als diagnostisch vervolgbericht na het normale assistentantwoord.

## Zichtbaarheid van redenering (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht met alleen een directive schakelt of denkblokken in antwoorden worden getoond.
- Wanneer ingeschakeld, wordt redenering verzonden als een **afzonderlijk bericht** voorafgegaan door `Reasoning:`.
- `stream` (alleen Telegram): streamt redenering naar de Telegram-conceptbubbel terwijl het antwoord wordt gegenereerd, en verzendt daarna het definitieve antwoord zonder redenering.
- Alias: `/reason`.
- Stuur `/reasoning` (of `/reasoning:`) zonder argument om het huidige redeneringsniveau te bekijken.
- Resolutievolgorde: inline directive, daarna sessie-overschrijving, daarna standaardwaarde per agent (`agents.list[].reasoningDefault`), daarna terugval (`off`).

Misvormde redeneringstags van lokale modellen worden conservatief afgehandeld. Gesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-gesloten redenering na al zichtbare tekst wordt ook verborgen. Als een antwoord volledig is verpakt in één niet-gesloten openingstag en anders als lege tekst zou worden geleverd, verwijdert OpenClaw de misvormde openingstag en levert de resterende tekst.

## Gerelateerd

- Documentatie voor verhoogde modus staat in [Verhoogde modus](/nl/tools/elevated).

## Heartbeats

- De body van de Heartbeat-probe is de geconfigureerde heartbeatprompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline directives in een Heartbeat-bericht worden zoals gewoonlijk toegepast (maar vermijd het wijzigen van sessiestandaarden vanuit Heartbeats).
- Heartbeat-levering gebruikt standaard alleen de definitieve payload. Om ook het afzonderlijke `Reasoning:`-bericht te verzenden (wanneer beschikbaar), stel je `agents.defaults.heartbeat.includeReasoning: true` of per agent `agents.list[].heartbeat.includeReasoning: true` in.

## Webchat-UI

- De denkselector van de webchat spiegelt het opgeslagen niveau van de sessie uit de inkomende sessiestore/config wanneer de pagina laadt.
- Het kiezen van een ander niveau schrijft de sessie-overschrijving onmiddellijk via `sessions.patch`; het wacht niet op de volgende verzending en is geen eenmalige `thinkingOnce`-overschrijving.
- De eerste optie is altijd `Default (<resolved level>)`, waarbij de opgeloste standaardwaarde afkomstig is uit het providerdenkprofiel van het actieve sessiemodel plus dezelfde terugvallogica die `/status` en `session_status` gebruiken.
- De keuzelijst gebruikt `thinkingLevels` die worden teruggegeven door de Gateway-sessierij/-standaardwaarden, met `thinkingOptions` behouden als legacy labellijst. De browser-UI bewaart geen eigen provider-regexlijst; Plugins zijn eigenaar van modelspecifieke niveausets.
- `/think:<level>` blijft werken en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatdirectives en de keuzelijst synchroon blijven.

## Providerprofielen

- Provider-plugins kunnen `resolveThinkingProfile(ctx)` aanbieden om de ondersteunde niveaus en standaardwaarde van het model te definiëren.
- Provider-plugins die Claude-modellen proxen, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken zodat directe Anthropic- en proxycatalogi op elkaar afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` of `max`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Tool-plugins die een expliciete thinking-override moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze mogen geen eigen provider/model-niveaulijsten bijhouden.
- Tool-plugins met toegang tot geconfigureerde metadata van aangepaste modellen kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat opt-ins voor `compat.supportedReasoningEfforts` worden meegenomen in validatie aan de pluginzijde.
- Gepubliceerde verouderde hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven bestaan als compatibiliteitsadapters, maar nieuwe sets met aangepaste niveaus moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen/-standaardwaarden bieden `thinkingLevels`, `thinkingOptions` en `thinkingDefault`, zodat ACP-/chatclients dezelfde profiel-id's en labels renderen die runtimevalidatie gebruikt.

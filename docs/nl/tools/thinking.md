---
read_when:
    - Parsing of standaardinstellingen aanpassen voor denken, snelle modus of uitgebreide richtlijnen
summary: Directievesyntaxis voor /think, /fast, /verbose, /trace en zichtbaarheid van redenering
title: Denkniveaus
x-i18n:
    generated_at: "2026-04-30T16:31:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inline directive in elke inkomende body: `/t <level>`, `/think:<level>`, of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (maximaal budget)
  - xhigh → “ultrathink+” (GPT-5.2+ en Codex-modellen, plus Anthropic Claude Opus 4.7-inspanning)
  - adaptive → door de provider beheerd adaptief denken (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7 en dynamisch denken van Google Gemini)
  - max → maximale redenering van de provider (Anthropic Claude Opus 4.7; Ollama koppelt dit aan de hoogste native `think`-inspanning)
  - `x-high`, `x_high`, `extra-high`, `extra high` en `extra_high` verwijzen naar `xhigh`.
  - `highest` verwijst naar `high`.
- Providernotities:
  - Denkmenu's en -kiezers worden aangestuurd door providerprofielen. Providerplugins declareren de exacte niveauset voor het geselecteerde model, inclusief labels zoals binair `on`.
  - `adaptive`, `xhigh` en `max` worden alleen getoond voor provider-/modelprofielen die ze ondersteunen. Getypte directives voor niet-ondersteunde niveaus worden geweigerd met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van providerprofielrang. `adaptive` valt terug op `medium` bij niet-adaptieve modellen, terwijl `xhigh` en `max` terugvallen op het grootste ondersteunde niet-`off`-niveau voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer geen expliciet denkniveau is ingesteld.
  - Anthropic Claude Opus 4.7 gebruikt adaptief denken niet standaard. De standaard voor API-inspanning blijft eigendom van de provider, tenzij je expliciet een denkniveau instelt.
  - Anthropic Claude Opus 4.7 koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkdirective is en `xhigh` de Opus 4.7-inspanningsinstelling is.
  - Anthropic Claude Opus 4.7 biedt ook `/think max`; dit verwijst naar hetzelfde providerbeheerde pad voor maximale inspanning.
  - DeepSeek V4-modellen bieden `/think xhigh|max`; beide verwijzen naar DeepSeek `reasoning_effort: "max"`, terwijl lagere niet-`off`-niveaus naar `high` verwijzen.
  - Ollama-modellen met denkondersteuning bieden `/think low|medium|high|max`; `max` verwijst naar native `think: "high"`, omdat de native API van Ollama de inspanningsteksten `low`, `medium` en `high` accepteert.
  - OpenAI GPT-modellen koppelen `/think` via modelspecifieke ondersteuning voor Responses API-inspanning. `/think off` verzendt `reasoning.effort: "none"` alleen wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde redeneringspayload weg in plaats van een niet-ondersteunde waarde te verzenden.
  - Aangepaste OpenAI-compatibele catalogusvermeldingen kunnen `/think xhigh` inschakelen door `models.providers.<provider>.models[].compat.supportedReasoningEfforts` zo in te stellen dat `"xhigh"` is opgenomen. Dit gebruikt dezelfde compatmetadata die uitgaande OpenAI-redeneringsinspanningpayloads koppelt, zodat menu's, sessievalidering, agent-CLI en `llm-task` overeenkomen met transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-refs slaan proxyredeneringsinjectie over, omdat die ingetrokken route definitieve antwoordtekst via redeneringsvelden kon retourneren.
  - Google Gemini koppelt `/think adaptive` aan Gemini's providerbeheerde dynamische denken. Gemini 3-verzoeken laten een vaste `thinkingLevel` weg, terwijl Gemini 2.5-verzoeken `thinkingBudget: -1` verzenden; vaste niveaus verwijzen nog steeds naar de dichtstbijzijnde Gemini `thinkingLevel` of het dichtstbijzijnde budget voor die modelfamilie.
  - MiniMax (`minimax/*`) op het Anthropic-compatibele streamingpad gebruikt standaard `thinking: { type: "disabled" }`, tenzij je denken expliciet instelt in modelparameters of verzoekparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit MiniMax' niet-native Anthropic-streamformaat.
  - Z.AI (`zai/*`) ondersteunt alleen binair denken (`on`/`off`). Elk niet-`off`-niveau wordt behandeld als `on` (gekoppeld aan `low`).
  - Moonshot (`moonshot/*`) koppelt `/think off` aan `thinking: { type: "disabled" }` en elk niet-`off`-niveau aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot alleen `tool_choice` `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Oplossingsvolgorde

1. Inline directive in het bericht (geldt alleen voor dat bericht).
2. Sessie-override (ingesteld door een bericht te verzenden dat alleen een directive bevat).
3. Standaard per agent (`agents.list[].thinkingDefault` in config).
4. Globale standaard (`agents.defaults.thinkingDefault` in config).
5. Fallback: door de provider gedeclareerde standaard wanneer beschikbaar; anders lossen modellen met redeneervermogen op naar `medium` of het dichtstbijzijnde ondersteunde niet-`off`-niveau voor dat model, en modellen zonder redenering blijven `off`.

## Een sessiestandaard instellen

- Verzend een bericht dat **alleen** de directive bevat (witruimte toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Dit blijft gelden voor de huidige sessie (standaard per afzender); gewist door `/think:off` of een sessiereset na inactiviteit.
- Er wordt een bevestigingsantwoord verzonden (`Thinking level set to high.` / `Thinking disabled.`). Als het niveau ongeldig is (bijvoorbeeld `/thinking big`), wordt de opdracht geweigerd met een hint en blijft de sessiestatus ongewijzigd.
- Verzend `/think` (of `/think:`) zonder argument om het huidige denkniveau te zien.

## Toepassing per agent

- **Ingebedde Pi**: het opgeloste niveau wordt doorgegeven aan de in-process Pi-agentruntime.

## Snelle modus (/fast)

- Niveaus: `on|off`.
- Een bericht dat alleen de directive bevat, schakelt een sessie-override voor snelle modus om en antwoordt `Fast mode enabled.` / `Fast mode disabled.`.
- Verzend `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van snelle modus te zien.
- OpenClaw lost snelle modus in deze volgorde op:
  1. Inline/alleen-directive `/fast on|off`
  2. Sessie-override
  3. Standaard per agent (`agents.list[].fastModeDefault`)
  4. Config per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Voor `openai/*` wordt snelle modus gekoppeld aan OpenAI-prioriteitsverwerking door `service_tier=priority` te verzenden bij ondersteunde Responses-verzoeken.
- Voor `openai-codex/*` verzendt snelle modus dezelfde vlag `service_tier=priority` bij Codex Responses. OpenClaw behoudt één gedeelde `/fast`-schakelaar voor beide authenticatiepaden.
- Voor directe openbare `anthropic/*`-verzoeken, inclusief via OAuth geauthenticeerd verkeer dat naar `api.anthropic.com` wordt verzonden, wordt snelle modus gekoppeld aan Anthropic-serviceniveaus: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic `serviceTier` / `service_tier`-modelparameters overschrijven de standaard voor snelle modus wanneer beide zijn ingesteld. OpenClaw slaat nog steeds Anthropic-serviceniveau-injectie over voor niet-Anthropic proxybasis-URL's.
- `/status` toont `Fast` alleen wanneer snelle modus is ingeschakeld.

## Uitgebreide directives (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht dat alleen de directive bevat, schakelt uitgebreide sessielogging om en antwoordt `Verbose logging enabled.` / `Verbose logging disabled.`; ongeldige niveaus retourneren een hint zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessie-override op; wis die via de Sessions-UI door `inherit` te kiezen.
- Inline directive geldt alleen voor dat bericht; sessie-/globale standaarden gelden anders.
- Verzend `/verbose` (of `/verbose:`) zonder argument om het huidige uitgebreide niveau te zien.
- Wanneer uitgebreid aan staat, sturen agents die gestructureerde toolresultaten uitsturen (Pi, andere JSON-agents) elke toolaanroep terug als een eigen bericht met alleen metadata, voorafgegaan door `<emoji> <tool-name>: <arg>` wanneer beschikbaar (pad/opdracht). Deze toolsamenvattingen worden verzonden zodra elke tool start (afzonderlijke bubbels), niet als streamingdelta's.
- Samenvattingen van toolfouten blijven zichtbaar in normale modus, maar ruwe detailsuffixen voor fouten worden verborgen tenzij uitgebreid `on` of `full` is.
- Wanneer uitgebreid `full` is, worden tooluitvoerresultaten ook na voltooiing doorgestuurd (afzonderlijke bubbel, afgekapt tot een veilige lengte). Als je `/verbose on|full|off` omschakelt terwijl een run actief is, respecteren volgende toolbubbels de nieuwe instelling.

## Plugin-traceringsdirectives (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht dat alleen de directive bevat, schakelt Plugin-traceringsuitvoer voor de sessie om en antwoordt `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline directive geldt alleen voor dat bericht; sessie-/globale standaarden gelden anders.
- Verzend `/trace` (of `/trace:`) zonder argument om het huidige traceringsniveau te zien.
- `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van de Plugin, zoals Active Memory-debugsamenvattingen.
- Traceringsregels kunnen verschijnen in `/status` en als een volgend diagnostisch bericht na het normale assistentantwoord.

## Zichtbaarheid van redenering (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht dat alleen de directive bevat, schakelt om of denkblokken in antwoorden worden getoond.
- Wanneer ingeschakeld, wordt redenering verzonden als een **afzonderlijk bericht** voorafgegaan door `Reasoning:`.
- `stream` (alleen Telegram): streamt redenering naar de Telegram-conceptbubbel terwijl het antwoord wordt gegenereerd, en verzendt daarna het definitieve antwoord zonder redenering.
- Alias: `/reason`.
- Verzend `/reasoning` (of `/reasoning:`) zonder argument om het huidige redeneringsniveau te zien.
- Oplossingsvolgorde: inline directive, daarna sessie-override, daarna standaard per agent (`agents.list[].reasoningDefault`), daarna fallback (`off`).

Misvormde redeneringstags van lokale modellen worden conservatief afgehandeld. Gesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-gesloten redenering na tekst die al zichtbaar is, wordt ook verborgen. Als een antwoord volledig is omwikkeld met één niet-gesloten openingstag en anders als lege tekst zou worden geleverd, verwijdert OpenClaw de misvormde openingstag en levert de resterende tekst.

## Gerelateerd

- Documentatie voor verhoogde modus staat in [Verhoogde modus](/nl/tools/elevated).

## Heartbeats

- De body van de Heartbeat-probe is de geconfigureerde Heartbeat-prompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline directives in een Heartbeat-bericht gelden zoals gebruikelijk (maar vermijd het wijzigen van sessiestandaarden vanuit Heartbeats).
- Heartbeat-bezorging gebruikt standaard alleen de definitieve payload. Om ook het afzonderlijke `Reasoning:`-bericht te verzenden (wanneer beschikbaar), stel `agents.defaults.heartbeat.includeReasoning: true` of per agent `agents.list[].heartbeat.includeReasoning: true` in.

## Webchat-UI

- De denkkiezer in de webchat spiegelt het opgeslagen niveau van de sessie uit de inkomende sessiestore/config wanneer de pagina wordt geladen.
- Het kiezen van een ander niveau schrijft de sessie-override onmiddellijk via `sessions.patch`; het wacht niet op de volgende verzending en is geen eenmalige `thinkingOnce`-override.
- De eerste optie is altijd `Default (<resolved level>)`, waarbij de opgeloste standaard afkomstig is uit het providerdenkprofiel van het model van de actieve sessie plus dezelfde fallbacklogica die `/status` en `session_status` gebruiken.
- De kiezer gebruikt `thinkingLevels` die door de Gateway-sessierij/-standaarden worden geretourneerd, waarbij `thinkingOptions` behouden blijft als legacy labellijst. De browser-UI houdt geen eigen provider-regexlijst bij; plugins zijn eigenaar van modelspecifieke niveausets.
- `/think:<level>` werkt nog steeds en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatdirectives en de kiezer gesynchroniseerd blijven.

## Providerprofielen

- Provider-plugins kunnen `resolveThinkingProfile(ctx)` beschikbaar maken om de ondersteunde niveaus en standaardwaarde van het model te definiëren.
- Provider-plugins die Claude-modellen proxyen, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken, zodat directe Anthropic- en proxycatalogi afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` of `max`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Tool-plugins die een expliciete thinking-override moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze mogen geen eigen provider-/modelniveaulijsten bijhouden.
- Tool-plugins met toegang tot geconfigureerde metadata van aangepaste modellen kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat opt-ins voor `compat.supportedReasoningEfforts` worden meegenomen in validatie aan de pluginkant.
- Gepubliceerde legacy-hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven bestaan als compatibiliteitsadapters, maar nieuwe aangepaste niveausets moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen/-standaardwaarden stellen `thinkingLevels`, `thinkingOptions` en `thinkingDefault` beschikbaar, zodat ACP-/chatclients dezelfde profiel-id's en labels renderen die runtimevalidatie gebruikt.

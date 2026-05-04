---
read_when:
    - Parsing of standaardwaarden voor denk-, snelle-modus- of uitgebreide instructies aanpassen
summary: Directivesyntaxis voor /think, /fast, /verbose, /trace en zichtbaarheid van redenering
title: Denkniveaus
x-i18n:
    generated_at: "2026-05-04T07:09:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fa1b0a2b5f7b93a706488c3ad39dfe08c08eed0bdd30880eb4c07d730ee4d4f
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inline-instructie in elke inkomende body: `/t <level>`, `/think:<level>` of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “denk”
  - low → “denk hard”
  - medium → “denk harder”
  - high → “ultrathink” (maximaal budget)
  - xhigh → “ultrathink+” (GPT-5.2+ en Codex-modellen, plus Anthropic Claude Opus 4.7-inspanning)
  - adaptive → door provider beheerd adaptief denken (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7 en Google Gemini dynamisch denken)
  - max → maximale reasoning van de provider (Anthropic Claude Opus 4.7; Ollama koppelt dit aan de hoogste native `think`-inspanning)
  - `x-high`, `x_high`, `extra-high`, `extra high` en `extra_high` verwijzen naar `xhigh`.
  - `highest` verwijst naar `high`.
- Provider-opmerkingen:
  - Denkmenu's en keuzelijsten worden aangestuurd door het providerprofiel. Provider-plugins declareren de exacte niveauset voor het geselecteerde model, inclusief labels zoals binair `on`.
  - `adaptive`, `xhigh` en `max` worden alleen getoond voor provider-/modelprofielen die ze ondersteunen. Getypte instructies voor niet-ondersteunde niveaus worden geweigerd met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van providerrang in het profiel. `adaptive` valt terug op `medium` bij niet-adaptieve modellen, terwijl `xhigh` en `max` terugvallen op het grootste ondersteunde niet-`off`-niveau voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer er geen expliciet denkniveau is ingesteld.
  - Anthropic Claude Opus 4.7 gebruikt niet standaard adaptief denken. De standaard API-inspanning blijft eigendom van de provider, tenzij je expliciet een denkniveau instelt.
  - Anthropic Claude Opus 4.7 koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkinstructie is en `xhigh` de inspanningsinstelling van Opus 4.7 is.
  - Anthropic Claude Opus 4.7 biedt ook `/think max`; dit verwijst naar hetzelfde door de provider beheerde pad voor maximale inspanning.
  - DeepSeek V4-modellen bieden `/think xhigh|max`; beide verwijzen naar DeepSeek `reasoning_effort: "max"`, terwijl lagere niet-`off`-niveaus naar `high` verwijzen.
  - Ollama-modellen met denkcapaciteit bieden `/think low|medium|high|max`; `max` verwijst naar native `think: "high"` omdat de native API van Ollama `low`-, `medium`- en `high`-inspanningstrings accepteert.
  - OpenAI GPT-modellen koppelen `/think` via modelspecifieke ondersteuning voor inspanning in de Responses API. `/think off` verzendt `reasoning.effort: "none"` alleen wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde reasoning-payload weg in plaats van een niet-ondersteunde waarde te verzenden.
  - Aangepaste OpenAI-compatibele catalogusvermeldingen kunnen `/think xhigh` inschakelen door `models.providers.<provider>.models[].compat.supportedReasoningEfforts` zo in te stellen dat `"xhigh"` is opgenomen. Dit gebruikt dezelfde compat-metadata die uitgaande OpenAI reasoning-inspanningspayloads koppelt, zodat menu's, sessievalidering, agent-CLI en `llm-task` overeenkomen met transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-verwijzingen slaan proxy-reasoning-injectie over omdat die ingetrokken route uiteindelijke antwoordtekst via reasoning-velden kon teruggeven.
  - Google Gemini koppelt `/think adaptive` aan door Gemini's provider beheerd dynamisch denken. Gemini 3-verzoeken laten een vast `thinkingLevel` weg, terwijl Gemini 2.5-verzoeken `thinkingBudget: -1` verzenden; vaste niveaus worden nog steeds gekoppeld aan het dichtstbijzijnde Gemini `thinkingLevel` of budget voor die modelfamilie.
  - MiniMax (`minimax/*`) op het Anthropic-compatibele streamingpad gebruikt standaard `thinking: { type: "disabled" }`, tenzij je denken expliciet instelt in modelparameters of requestparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit MiniMax' niet-native Anthropic-streamindeling.
  - Z.AI (`zai/*`) ondersteunt alleen binair denken (`on`/`off`). Elk niet-`off`-niveau wordt behandeld als `on` (gekoppeld aan `low`).
  - Moonshot (`moonshot/*`) koppelt `/think off` aan `thinking: { type: "disabled" }` en elk niet-`off`-niveau aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot alleen `tool_choice` `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Resolutievolgorde

1. Inline-instructie op het bericht (geldt alleen voor dat bericht).
2. Sessie-override (ingesteld door een bericht te sturen dat alleen uit een instructie bestaat).
3. Standaard per agent (`agents.list[].thinkingDefault` in config).
4. Globale standaard (`agents.defaults.thinkingDefault` in config).
5. Terugval: door provider gedeclareerde standaard wanneer beschikbaar; anders lossen modellen met reasoning-capaciteit op naar `medium` of het dichtstbijzijnde ondersteunde niet-`off`-niveau voor dat model, en modellen zonder reasoning blijven `off`.

## Een sessiestandaard instellen

- Stuur een bericht dat **alleen** de instructie bevat (witruimte toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Dat blijft gelden voor de huidige sessie (standaard per afzender); gewist door `/think:off` of een sessie-idlereset.
- Er wordt een bevestigingsantwoord verzonden (`Thinking level set to high.` / `Thinking disabled.`). Als het niveau ongeldig is (bijvoorbeeld `/thinking big`), wordt de opdracht geweigerd met een hint en blijft de sessiestatus ongewijzigd.
- Stuur `/think` (of `/think:`) zonder argument om het huidige denkniveau te zien.

## Toepassing per agent

- **Embedded Pi**: het opgeloste niveau wordt doorgegeven aan de in-process Pi-agentruntime.

## Snelle modus (/fast)

- Niveaus: `on|off`.
- Een bericht dat alleen uit een instructie bestaat, schakelt een sessie-override voor snelle modus om en antwoordt `Fast mode enabled.` / `Fast mode disabled.`.
- Stuur `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van snelle modus te zien.
- OpenClaw lost snelle modus op in deze volgorde:
  1. Inline/alleen-instructie `/fast on|off`
  2. Sessie-override
  3. Standaard per agent (`agents.list[].fastModeDefault`)
  4. Config per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Terugval: `off`
- Voor `openai/*` wordt snelle modus gekoppeld aan OpenAI priority processing door `service_tier=priority` te verzenden bij ondersteunde Responses-verzoeken.
- Voor `openai-codex/*` verzendt snelle modus dezelfde `service_tier=priority`-vlag bij Codex Responses. OpenClaw behoudt één gedeelde `/fast`-schakelaar voor beide auth-paden.
- Voor directe openbare `anthropic/*`-verzoeken, inclusief OAuth-geauthenticeerd verkeer dat naar `api.anthropic.com` wordt gestuurd, wordt snelle modus gekoppeld aan Anthropic-serviceniveaus: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic `serviceTier` / `service_tier`-modelparameters overschrijven de standaard voor snelle modus wanneer beide zijn ingesteld. OpenClaw slaat Anthropic-serviceniveau-injectie nog steeds over voor niet-Anthropic proxybasis-URL's.
- `/status` toont `Fast` alleen wanneer snelle modus is ingeschakeld.

## Verbose-instructies (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht dat alleen uit een instructie bestaat, schakelt verbose voor de sessie om en antwoordt `Verbose logging enabled.` / `Verbose logging disabled.`; ongeldige niveaus geven een hint terug zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessie-override op; wis die via de Sessions-UI door `inherit` te kiezen.
- Inline-instructie geldt alleen voor dat bericht; sessie-/globale standaarden gelden anders.
- Stuur `/verbose` (of `/verbose:`) zonder argument om het huidige verbose-niveau te zien.
- Wanneer verbose aan staat, sturen agents die gestructureerde toolresultaten uitsturen (Pi, andere JSON-agents) elke toolaanroep terug als een eigen metadata-only bericht, voorafgegaan door `<emoji> <tool-name>: <arg>` wanneer beschikbaar. Deze toolsamenvattingen worden verzonden zodra elke tool start (aparte bubbels), niet als streaming-delta's.
- Samenvattingen van toolfouten blijven zichtbaar in normale modus, maar raw foutdetailsuffixen zijn verborgen tenzij verbose `on` of `full` is.
- Wanneer verbose `full` is, worden tooloutputs ook na voltooiing doorgestuurd (aparte bubbel, afgekapt tot een veilige lengte). Als je `/verbose on|full|off` omschakelt terwijl een run bezig is, volgen volgende toolbubbels de nieuwe instelling.
- `agents.defaults.toolProgressDetail` bepaalt de vorm van `/verbose`-toolsamenvattingen en toolregels in voortgangsconcepten. Gebruik `"explain"` (standaard) voor compacte menselijke labels zoals `🛠️ Exec: checking JS syntax`; gebruik `"raw"` wanneer je ook de raw opdracht/details wilt toevoegen voor debugging. Per-agent `agents.list[].toolProgressDetail` overschrijft de standaard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-trace-instructies (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht dat alleen uit een instructie bestaat, schakelt trace-uitvoer van sessie-Plugin om en antwoordt `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline-instructie geldt alleen voor dat bericht; sessie-/globale standaarden gelden anders.
- Stuur `/trace` (of `/trace:`) zonder argument om het huidige trace-niveau te zien.
- `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van Plugin, zoals debug-samenvattingen van Active Memory.
- Traceregels kunnen verschijnen in `/status` en als een aanvullend diagnostisch bericht na het normale assistentantwoord.

## Zichtbaarheid van reasoning (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht dat alleen uit een instructie bestaat, schakelt om of denkblokken in antwoorden worden getoond.
- Wanneer ingeschakeld, wordt reasoning verzonden als een **apart bericht** voorafgegaan door `Reasoning:`.
- `stream` (alleen Telegram): streamt reasoning naar de Telegram-conceptbubbel terwijl het antwoord wordt gegenereerd, en verzendt daarna het definitieve antwoord zonder reasoning.
- Alias: `/reason`.
- Stuur `/reasoning` (of `/reasoning:`) zonder argument om het huidige reasoning-niveau te zien.
- Resolutievolgorde: inline-instructie, daarna sessie-override, daarna standaard per agent (`agents.list[].reasoningDefault`), daarna terugval (`off`).

Misvormde reasoning-tags van lokale modellen worden conservatief afgehandeld. Gesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-gesloten reasoning na al zichtbare tekst wordt ook verborgen. Als een antwoord volledig is verpakt in één niet-gesloten openingstag en anders als lege tekst zou worden afgeleverd, verwijdert OpenClaw de misvormde openingstag en levert de resterende tekst af.

## Gerelateerd

- Documentatie over verhoogde modus staat in [Verhoogde modus](/nl/tools/elevated).

## Heartbeats

- De body van de Heartbeat-probe is de geconfigureerde Heartbeat-prompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-instructies in een Heartbeat-bericht gelden zoals gewoonlijk (maar vermijd het wijzigen van sessiestandaarden vanuit Heartbeats).
- Heartbeat-levering gebruikt standaard alleen de uiteindelijke payload. Om ook het afzonderlijke `Reasoning:`-bericht te verzenden (wanneer beschikbaar), stel je `agents.defaults.heartbeat.includeReasoning: true` of per-agent `agents.list[].heartbeat.includeReasoning: true` in.

## Webchat-UI

- De denkselector van de webchat weerspiegelt het opgeslagen niveau van de sessie uit de inkomende sessiestore/config wanneer de pagina wordt geladen.
- Het kiezen van een ander niveau schrijft de sessie-override onmiddellijk via `sessions.patch`; het wacht niet op de volgende verzending en is geen eenmalige `thinkingOnce`-override.
- De eerste optie is altijd `Default (<resolved level>)`, waarbij de opgeloste standaard afkomstig is van het providerdenkprofiel van het actieve sessiemodel plus dezelfde terugvallogica die `/status` en `session_status` gebruiken.
- De keuzelijst gebruikt `thinkingLevels` die worden teruggegeven door de Gateway-sessierij/-standaarden, waarbij `thinkingOptions` als legacy labellijst behouden blijft. De browser-UI houdt geen eigen provider-regexlijst bij; plugins zijn eigenaar van modelspecifieke niveausets.
- `/think:<level>` werkt nog steeds en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatinstructies en de keuzelijst gesynchroniseerd blijven.

## Providerprofielen

- Provider-plugins kunnen `resolveThinkingProfile(ctx)` beschikbaar maken om de ondersteunde niveaus en de standaardwaarde van het model te definiëren.
- Provider-plugins die als proxy voor Claude-modellen fungeren, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken, zodat directe Anthropic- en proxycatalogi afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` of `max`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Tool-plugins die een expliciete thinking-override moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze moeten geen eigen lijsten met provider-/modelniveaus bijhouden.
- Tool-plugins met toegang tot geconfigureerde metadata van aangepaste modellen kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat opt-ins voor `compat.supportedReasoningEfforts` worden meegenomen in validatie aan de pluginzijde.
- Gepubliceerde legacy hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven bestaan als compatibiliteitsadapters, maar nieuwe aangepaste niveausets moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen/-standaardwaarden bieden `thinkingLevels`, `thinkingOptions` en `thinkingDefault`, zodat ACP-/chatclients dezelfde profiel-id's en labels renderen als runtimevalidatie gebruikt.

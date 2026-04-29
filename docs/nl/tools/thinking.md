---
read_when:
    - Parsen of standaardwaarden aanpassen voor denken, snelle modus of uitgebreide richtlijnen
summary: Directievesyntaxis voor /think, /fast, /verbose, /trace en zichtbaarheid van redenering
title: Denkniveaus
x-i18n:
    generated_at: "2026-04-29T23:26:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inline-instructie in elke inkomende body: `/t <level>`, `/think:<level>`, of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (maximaal budget)
  - xhigh → “ultrathink+” (GPT-5.2+ en Codex-modellen, plus Anthropic Claude Opus 4.7 effort)
  - adaptive → door de provider beheerd adaptief denken (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7 en Google Gemini dynamisch denken)
  - max → maximale reasoning van provider (Anthropic Claude Opus 4.7; Ollama koppelt dit aan de hoogste native `think`-inspanning)
  - `x-high`, `x_high`, `extra-high`, `extra high` en `extra_high` worden gekoppeld aan `xhigh`.
  - `highest` wordt gekoppeld aan `high`.
- Provider-opmerkingen:
  - Denkmenu's en keuzelijsten worden aangestuurd door providerprofielen. Provider-Plugins declareren de exacte niveauset voor het geselecteerde model, inclusief labels zoals binair `on`.
  - `adaptive`, `xhigh` en `max` worden alleen aangeboden voor provider-/modelprofielen die ze ondersteunen. Getypte instructies voor niet-ondersteunde niveaus worden geweigerd met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van de rangorde in het providerprofiel. `adaptive` valt terug op `medium` bij niet-adaptieve modellen, terwijl `xhigh` en `max` terugvallen op het grootste ondersteunde niet-`off`-niveau voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer er geen expliciet denkniveau is ingesteld.
  - Anthropic Claude Opus 4.7 gebruikt niet standaard adaptief denken. De standaard API-effort blijft eigendom van de provider, tenzij je expliciet een denkniveau instelt.
  - Anthropic Claude Opus 4.7 koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkinstructie is en `xhigh` de effort-instelling van Opus 4.7 is.
  - Anthropic Claude Opus 4.7 biedt ook `/think max`; dit wordt gekoppeld aan hetzelfde door de provider beheerde pad voor maximale effort.
  - Ollama-modellen met denkondersteuning bieden `/think low|medium|high|max`; `max` wordt gekoppeld aan native `think: "high"` omdat de native API van Ollama de effort-strings `low`, `medium` en `high` accepteert.
  - OpenAI GPT-modellen koppelen `/think` via modelspecifieke effort-ondersteuning in de Responses API. `/think off` verzendt `reasoning.effort: "none"` alleen wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde reasoning-payload weg in plaats van een niet-ondersteunde waarde te verzenden.
  - Aangepaste OpenAI-compatibele catalogusingangen kunnen `/think xhigh` inschakelen door `models.providers.<provider>.models[].compat.supportedReasoningEfforts` zo in te stellen dat `"xhigh"` is opgenomen. Dit gebruikt dezelfde compat-metadata die uitgaande OpenAI-reasoning-effort-payloads koppelt, zodat menu's, sessievalidatie, agent-CLI en `llm-task` overeenkomen met het transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-referenties slaan proxy-reasoning-injectie over omdat die buiten gebruik gestelde route definitieve antwoordtekst via reasoningvelden kon retourneren.
  - Google Gemini koppelt `/think adaptive` aan het door Gemini's provider beheerde dynamische denken. Gemini 3-verzoeken laten een vaste `thinkingLevel` weg, terwijl Gemini 2.5-verzoeken `thinkingBudget: -1` verzenden; vaste niveaus worden nog steeds gekoppeld aan de dichtstbijzijnde Gemini-`thinkingLevel` of het dichtstbijzijnde budget voor die modelfamilie.
  - MiniMax (`minimax/*`) op het Anthropic-compatibele streamingpad gebruikt standaard `thinking: { type: "disabled" }`, tenzij je expliciet denken instelt in modelparameters of aanvraagparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit MiniMax' niet-native Anthropic-streamformaat.
  - Z.AI (`zai/*`) ondersteunt alleen binair denken (`on`/`off`). Elk niet-`off`-niveau wordt behandeld als `on` (gekoppeld aan `low`).
  - Moonshot (`moonshot/*`) koppelt `/think off` aan `thinking: { type: "disabled" }` en elk niet-`off`-niveau aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot alleen `tool_choice` `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Resolutievolgorde

1. Inline-instructie in het bericht (geldt alleen voor dat bericht).
2. Sessie-override (ingesteld door een bericht te verzenden dat alleen een instructie bevat).
3. Standaard per agent (`agents.list[].thinkingDefault` in configuratie).
4. Globale standaard (`agents.defaults.thinkingDefault` in configuratie).
5. Terugval: door provider gedeclareerde standaard wanneer beschikbaar; anders worden modellen met reasoning-mogelijkheid opgelost naar `medium` of het dichtstbijzijnde ondersteunde niet-`off`-niveau voor dat model, en modellen zonder reasoning blijven `off`.

## Een sessiestandaard instellen

- Verstuur een bericht dat **alleen** de instructie bevat (witruimte toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Dat blijft gelden voor de huidige sessie (standaard per afzender); gewist door `/think:off` of een reset na sessie-inactiviteit.
- Er wordt een bevestigingsantwoord verzonden (`Thinking level set to high.` / `Thinking disabled.`). Als het niveau ongeldig is (bijvoorbeeld `/thinking big`), wordt de opdracht geweigerd met een hint en blijft de sessiestatus ongewijzigd.
- Verstuur `/think` (of `/think:`) zonder argument om het huidige denkniveau te zien.

## Toepassing per agent

- **Embedded Pi**: het opgeloste niveau wordt doorgegeven aan de in-process Pi-agentruntime.

## Snelle modus (/fast)

- Niveaus: `on|off`.
- Een bericht dat alleen een instructie bevat, schakelt een sessie-override voor snelle modus om en antwoordt `Fast mode enabled.` / `Fast mode disabled.`.
- Verstuur `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van snelle modus te zien.
- OpenClaw lost snelle modus in deze volgorde op:
  1. Inline/alleen-instructie `/fast on|off`
  2. Sessie-override
  3. Standaard per agent (`agents.list[].fastModeDefault`)
  4. Configuratie per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Terugval: `off`
- Voor `openai/*` wordt snelle modus gekoppeld aan OpenAI-prioriteitsverwerking door `service_tier=priority` te verzenden bij ondersteunde Responses-verzoeken.
- Voor `openai-codex/*` verzendt snelle modus dezelfde `service_tier=priority`-vlag bij Codex Responses. OpenClaw behoudt een gedeelde `/fast`-schakelaar voor beide auth-paden.
- Voor directe publieke `anthropic/*`-verzoeken, inclusief via OAuth geauthenticeerd verkeer dat naar `api.anthropic.com` wordt verzonden, wordt snelle modus gekoppeld aan Anthropic-servicelagen: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic-`serviceTier` / `service_tier`-modelparameters overschrijven de standaard van snelle modus wanneer beide zijn ingesteld. OpenClaw slaat Anthropic-service-tier-injectie nog steeds over voor niet-Anthropic proxybasis-URL's.
- `/status` toont `Fast` alleen wanneer snelle modus is ingeschakeld.

## Uitgebreide instructies (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht dat alleen een instructie bevat, schakelt uitgebreide logging voor de sessie om en antwoordt `Verbose logging enabled.` / `Verbose logging disabled.`; ongeldige niveaus retourneren een hint zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessie-override op; wis deze via de Sessions UI door `inherit` te kiezen.
- Inline-instructie beïnvloedt alleen dat bericht; sessie-/globale standaarden gelden anders.
- Verstuur `/verbose` (of `/verbose:`) zonder argument om het huidige verbose-niveau te zien.
- Wanneer verbose is ingeschakeld, sturen agents die gestructureerde toolresultaten uitzenden (Pi, andere JSON-agents) elke toolaanroep terug als een eigen bericht met alleen metadata, voorafgegaan door `<emoji> <tool-name>: <arg>` wanneer beschikbaar (pad/opdracht). Deze toolsamenvattingen worden verzonden zodra elke tool start (aparte bubbels), niet als streaming-delta's.
- Samenvattingen van toolfouten blijven zichtbaar in normale modus, maar ruwe foutdetailsuffixen worden verborgen tenzij verbose `on` of `full` is.
- Wanneer verbose `full` is, worden tooluitvoeren na voltooiing ook doorgestuurd (aparte bubbel, afgekapt tot een veilige lengte). Als je `/verbose on|full|off` omschakelt terwijl een run bezig is, respecteren latere toolbubbels de nieuwe instelling.

## Plugin-trace-instructies (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht dat alleen een instructie bevat, schakelt sessie-Plugin-trace-uitvoer om en antwoordt `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline-instructie beïnvloedt alleen dat bericht; sessie-/globale standaarden gelden anders.
- Verstuur `/trace` (of `/trace:`) zonder argument om het huidige traceniveau te zien.
- `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van Plugins, zoals Active Memory-debugsamenvattingen.
- Traceregels kunnen verschijnen in `/status` en als een diagnostisch vervolgbericht na het normale assistentantwoord.

## Zichtbaarheid van reasoning (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht dat alleen een instructie bevat, schakelt om of denkblokken in antwoorden worden weergegeven.
- Wanneer ingeschakeld, wordt reasoning verzonden als een **apart bericht** met het voorvoegsel `Reasoning:`.
- `stream` (alleen Telegram): streamt reasoning naar de Telegram-conceptbubbel terwijl het antwoord wordt gegenereerd, en verzendt daarna het definitieve antwoord zonder reasoning.
- Alias: `/reason`.
- Verstuur `/reasoning` (of `/reasoning:`) zonder argument om het huidige reasoningniveau te zien.
- Resolutievolgorde: inline-instructie, daarna sessie-override, daarna standaard per agent (`agents.list[].reasoningDefault`), daarna terugval (`off`).

Misvormde reasoningtags van lokale modellen worden conservatief afgehandeld. Gesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-gesloten reasoning na tekst die al zichtbaar is, wordt ook verborgen. Als een antwoord volledig is verpakt in een enkele niet-gesloten openingstag en anders als lege tekst zou worden afgeleverd, verwijdert OpenClaw de misvormde openingstag en levert de resterende tekst af.

## Gerelateerd

- Documentatie voor verhoogde modus staat in [Verhoogde modus](/nl/tools/elevated).

## Heartbeats

- De Heartbeat-probebody is de geconfigureerde Heartbeat-prompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-instructies in een Heartbeat-bericht gelden zoals gebruikelijk (maar vermijd het wijzigen van sessiestandaarden vanuit Heartbeats).
- Heartbeat-bezorging gebruikt standaard alleen de definitieve payload. Om ook het aparte `Reasoning:`-bericht te verzenden (wanneer beschikbaar), stel je `agents.defaults.heartbeat.includeReasoning: true` of per agent `agents.list[].heartbeat.includeReasoning: true` in.

## Webchat-UI

- De denkselector van de webchat weerspiegelt het opgeslagen niveau van de sessie uit de inkomende sessiestore/configuratie wanneer de pagina wordt geladen.
- Een ander niveau kiezen schrijft de sessie-override onmiddellijk weg via `sessions.patch`; dit wacht niet op de volgende verzending en is geen eenmalige `thinkingOnce`-override.
- De eerste optie is altijd `Default (<resolved level>)`, waarbij de opgeloste standaard afkomstig is van het provider-denkprofiel van het actieve sessiemodel plus dezelfde terugvallogica die `/status` en `session_status` gebruiken.
- De keuzelijst gebruikt `thinkingLevels` die worden geretourneerd door de Gateway-sessierij/standaarden, waarbij `thinkingOptions` behouden blijft als legacy labellijst. De browser-UI behoudt geen eigen provider-regexlijst; Plugins zijn eigenaar van modelspecifieke niveausets.
- `/think:<level>` werkt nog steeds en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatinstructies en de keuzelijst gesynchroniseerd blijven.

## Providerprofielen

- Provider-plugins kunnen `resolveThinkingProfile(ctx)` beschikbaar stellen om de ondersteunde niveaus en standaardwaarde van het model te definiëren.
- Provider-plugins die Claude-modellen proxyen, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken, zodat directe Anthropic-catalogi en proxycatalogi op elkaar afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` of `max`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Tool-plugins die een expliciete thinking-override moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze mogen geen eigen lijsten met provider-/modelniveaus bijhouden.
- Tool-plugins met toegang tot geconfigureerde aangepaste modelmetadata kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat opt-ins voor `compat.supportedReasoningEfforts` worden weerspiegeld in validatie aan de Plugin-kant.
- Gepubliceerde legacy hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven beschikbaar als compatibiliteitsadapters, maar nieuwe aangepaste niveausets moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen/-standaardwaarden stellen `thinkingLevels`, `thinkingOptions` en `thinkingDefault` beschikbaar, zodat ACP-/chatclients dezelfde profiel-id's en labels weergeven die runtimevalidatie gebruikt.

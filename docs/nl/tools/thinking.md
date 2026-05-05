---
read_when:
    - Denken, snelle modus of parsing of standaardinstellingen voor verbose-richtlijnen aanpassen
summary: Directievesyntaxis voor /think, /fast, /verbose, /trace en zichtbaarheid van redenering
title: Denkniveaus
x-i18n:
    generated_at: "2026-05-05T01:51:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inline directive in een willekeurige inkomende body: `/t <level>`, `/think:<level>` of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (maximaal budget)
  - xhigh → “ultrathink+” (GPT-5.2+ en Codex-modellen, plus Anthropic Claude Opus 4.7 effort)
  - adaptive → door de provider beheerd adaptief denken (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7 en dynamisch denken van Google Gemini)
  - max → maximale redenering van de provider (Anthropic Claude Opus 4.7; Ollama koppelt dit aan de hoogste native `think`-effort)
  - `x-high`, `x_high`, `extra-high`, `extra high` en `extra_high` worden gekoppeld aan `xhigh`.
  - `highest` wordt gekoppeld aan `high`.
- Providernotities:
  - Denkmenu's en keuzelijsten worden gestuurd door providerprofielen. Providerplugins declareren de exacte niveauset voor het geselecteerde model, inclusief labels zoals binair `on`.
  - `adaptive`, `xhigh` en `max` worden alleen getoond voor provider-/modelprofielen die ze ondersteunen. Getypte directives voor niet-ondersteunde niveaus worden geweigerd met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van de providerprofielrang. `adaptive` valt terug op `medium` bij niet-adaptieve modellen, terwijl `xhigh` en `max` terugvallen op het grootste ondersteunde niet-`off`-niveau voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer er geen expliciet denkniveau is ingesteld.
  - Anthropic Claude Opus 4.7 gebruikt adaptief denken niet standaard. De standaardwaarde voor API-effort blijft eigendom van de provider, tenzij je expliciet een denkniveau instelt.
  - Anthropic Claude Opus 4.7 koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkdirective is en `xhigh` de Opus 4.7-effortinstelling is.
  - Anthropic Claude Opus 4.7 biedt ook `/think max`; dit wordt gekoppeld aan hetzelfde door de provider beheerde pad voor maximale effort.
  - Directe DeepSeek V4-modellen bieden `/think xhigh|max`; beide worden gekoppeld aan DeepSeek `reasoning_effort: "max"`, terwijl lagere niet-`off`-niveaus worden gekoppeld aan `high`.
  - Via OpenRouter gerouteerde DeepSeek V4-modellen bieden `/think xhigh` en sturen door OpenRouter ondersteunde `reasoning_effort`-waarden. Opgeslagen `max`-overrides vallen terug op `xhigh`.
  - Ollama-modellen met denkondersteuning bieden `/think low|medium|high|max`; `max` wordt gekoppeld aan native `think: "high"` omdat de native API van Ollama de effortstrings `low`, `medium` en `high` accepteert.
  - OpenAI GPT-modellen koppelen `/think` via modelspecifieke ondersteuning voor effort in de Responses API. `/think off` stuurt `reasoning.effort: "none"` alleen wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde redeneringspayload weg in plaats van een niet-ondersteunde waarde te sturen.
  - Aangepaste OpenAI-compatibele catalogusitems kunnen `/think xhigh` inschakelen door `models.providers.<provider>.models[].compat.supportedReasoningEfforts` zo in te stellen dat `"xhigh"` is opgenomen. Dit gebruikt dezelfde compat-metadata die uitgaande OpenAI-payloads voor redeneringseffort koppelt, zodat menu's, sessievalidering, agent-CLI en `llm-task` overeenkomen met het transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-verwijzingen slaan proxy-redeneringsinjectie over, omdat die uitgefaseerde route definitieve antwoordtekst via redeneringsvelden kon teruggeven.
  - Google Gemini koppelt `/think adaptive` aan Gemini's door de provider beheerde dynamische denken. Gemini 3-verzoeken laten een vaste `thinkingLevel` weg, terwijl Gemini 2.5-verzoeken `thinkingBudget: -1` sturen; vaste niveaus worden nog steeds gekoppeld aan de dichtstbijzijnde Gemini `thinkingLevel` of het dichtstbijzijnde budget voor die modelfamilie.
  - MiniMax (`minimax/*`) op het Anthropic-compatibele streamingpad gebruikt standaard `thinking: { type: "disabled" }`, tenzij je expliciet denken instelt in modelparameters of verzoekparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit MiniMax' niet-native Anthropic-streamindeling.
  - Z.AI (`zai/*`) ondersteunt alleen binair denken (`on`/`off`). Elk niet-`off`-niveau wordt behandeld als `on` (gekoppeld aan `low`).
  - Moonshot (`moonshot/*`) koppelt `/think off` aan `thinking: { type: "disabled" }` en elk niet-`off`-niveau aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot alleen `tool_choice` `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Resolutievolgorde

1. Inline directive in het bericht (geldt alleen voor dat bericht).
2. Sessie-override (ingesteld door een bericht te sturen dat alleen een directive bevat).
3. Standaard per agent (`agents.list[].thinkingDefault` in configuratie).
4. Globale standaard (`agents.defaults.thinkingDefault` in configuratie).
5. Terugval: door de provider gedeclareerde standaard wanneer beschikbaar; anders komen modellen met redeneringsondersteuning uit op `medium` of het dichtstbijzijnde ondersteunde niet-`off`-niveau voor dat model, en blijven modellen zonder redeneringsondersteuning op `off`.

## Een sessiestandaard instellen

- Stuur een bericht dat **alleen** de directive is (spaties toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Dat blijft gelden voor de huidige sessie (standaard per afzender); gewist door `/think:off` of een reset na sessie-inactiviteit.
- Er wordt een bevestigingsantwoord gestuurd (`Thinking level set to high.` / `Thinking disabled.`). Als het niveau ongeldig is (bijvoorbeeld `/thinking big`), wordt de opdracht geweigerd met een hint en blijft de sessiestatus ongewijzigd.
- Stuur `/think` (of `/think:`) zonder argument om het huidige denkniveau te zien.

## Toepassing per agent

- **Embedded Pi**: het opgeloste niveau wordt doorgegeven aan de in-process Pi-agentruntime.
- **Claude CLI-backend**: niet-off-niveaus worden aan Claude Code doorgegeven als `--effort` wanneer `claude-cli` wordt gebruikt; zie [CLI-backends](/nl/gateway/cli-backends).

## Snelle modus (/fast)

- Niveaus: `on|off`.
- Een bericht dat alleen een directive bevat, schakelt een sessie-override voor snelle modus om en antwoordt `Fast mode enabled.` / `Fast mode disabled.`.
- Stuur `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van de snelle modus te zien.
- OpenClaw lost snelle modus in deze volgorde op:
  1. Inline/directive-only `/fast on|off`
  2. Sessie-override
  3. Standaard per agent (`agents.list[].fastModeDefault`)
  4. Configuratie per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Terugval: `off`
- Voor `openai/*` wordt snelle modus gekoppeld aan OpenAI-prioriteitsverwerking door `service_tier=priority` te sturen bij ondersteunde Responses-verzoeken.
- Voor `openai-codex/*` stuurt snelle modus dezelfde vlag `service_tier=priority` bij Codex Responses. OpenClaw behoudt één gedeelde `/fast`-schakelaar voor beide autorisatiepaden.
- Voor directe openbare `anthropic/*`-verzoeken, inclusief OAuth-geauthenticeerd verkeer naar `api.anthropic.com`, wordt snelle modus gekoppeld aan Anthropic-servicetiers: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic `serviceTier` / `service_tier`-modelparameters overschrijven de standaard voor snelle modus wanneer beide zijn ingesteld. OpenClaw slaat Anthropic-servicetierinjectie nog steeds over voor niet-Anthropic proxybasis-URL's.
- `/status` toont `Fast` alleen wanneer snelle modus is ingeschakeld.

## Uitgebreide directives (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht dat alleen een directive bevat, schakelt uitgebreide sessielogging om en antwoordt `Verbose logging enabled.` / `Verbose logging disabled.`; ongeldige niveaus geven een hint terug zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessie-override op; wis deze via de Sessions-UI door `inherit` te kiezen.
- Inline directive geldt alleen voor dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/verbose` (of `/verbose:`) zonder argument om het huidige uitgebreide niveau te zien.
- Wanneer uitgebreid aan staat, sturen agents die gestructureerde toolresultaten uitvoeren (Pi, andere JSON-agents) elke toolaanroep terug als een eigen bericht met alleen metadata, voorafgegaan door `<emoji> <tool-name>: <arg>` wanneer beschikbaar. Deze toolsamenvattingen worden verzonden zodra elke tool start (afzonderlijke bubbels), niet als streamingdelta's.
- Samenvattingen van toolfouten blijven zichtbaar in normale modus, maar ruwe suffixen met foutdetails zijn verborgen tenzij uitgebreid `on` of `full` is.
- Wanneer uitgebreid `full` is, worden tooloutputs na voltooiing ook doorgestuurd (afzonderlijke bubbel, afgekapt tot een veilige lengte). Als je `/verbose on|full|off` omschakelt terwijl een run bezig is, respecteren volgende toolbubbels de nieuwe instelling.
- `agents.defaults.toolProgressDetail` bepaalt de vorm van `/verbose`-toolsamenvattingen en toolregels in voortgangsconcepten. Gebruik `"explain"` (standaard) voor compacte menselijke labels zoals `🛠️ Exec: checking JS syntax`; gebruik `"raw"` wanneer je ook wilt dat de ruwe opdracht/details worden toegevoegd voor debugging. Per-agent `agents.list[].toolProgressDetail` overschrijft de standaard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-tracedirectives (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht dat alleen een directive bevat, schakelt sessieoutput voor Plugin-tracing om en antwoordt `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline directive geldt alleen voor dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/trace` (of `/trace:`) zonder argument om het huidige traceerniveau te zien.
- `/trace` is smaller dan `/verbose`: het toont alleen traceer-/debugregels die eigendom zijn van plugins, zoals debug-samenvattingen van Active Memory.
- Traceerregels kunnen verschijnen in `/status` en als opvolgend diagnostisch bericht na het normale assistentantwoord.

## Zichtbaarheid van redenering (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht dat alleen een directive bevat, schakelt om of denkblokken in antwoorden worden getoond.
- Wanneer ingeschakeld, wordt redenering verzonden als een **afzonderlijk bericht** voorafgegaan door `Reasoning:`.
- `stream` (alleen Telegram): streamt redenering naar de Telegram-conceptbubbel terwijl het antwoord wordt gegenereerd en stuurt daarna het definitieve antwoord zonder redenering.
- Alias: `/reason`.
- Stuur `/reasoning` (of `/reasoning:`) zonder argument om het huidige redeneringsniveau te zien.
- Resolutievolgorde: inline directive, daarna sessie-override, daarna standaard per agent (`agents.list[].reasoningDefault`), daarna terugval (`off`).

Misvormde redeneringstags van lokale modellen worden conservatief behandeld. Gesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-gesloten redenering na al zichtbare tekst wordt ook verborgen. Als een antwoord volledig is verpakt in één niet-gesloten openingstag en anders als lege tekst zou worden afgeleverd, verwijdert OpenClaw de misvormde openingstag en levert de resterende tekst.

## Gerelateerd

- Documentatie over verhoogde modus staat in [Verhoogde modus](/nl/tools/elevated).

## Heartbeats

- De Heartbeat-probebody is de geconfigureerde Heartbeat-prompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline directives in een Heartbeat-bericht gelden zoals gebruikelijk (maar vermijd het wijzigen van sessiestandaarden vanuit Heartbeats).
- Heartbeat-levering gebruikt standaard alleen de definitieve payload. Om ook het afzonderlijke `Reasoning:`-bericht te sturen (wanneer beschikbaar), stel je `agents.defaults.heartbeat.includeReasoning: true` of per agent `agents.list[].heartbeat.includeReasoning: true` in.

## Webchat-UI

- De denkniveaukiezer in de webchat weerspiegelt het opgeslagen niveau van de sessie uit de inkomende sessiestore/configuratie wanneer de pagina wordt geladen.
- Een ander niveau kiezen schrijft de sessie-override onmiddellijk weg via `sessions.patch`; het wacht niet op de volgende verzending en is geen eenmalige `thinkingOnce`-override.
- De eerste optie is altijd `Default (<resolved level>)`, waarbij de opgeloste standaard afkomstig is uit het providerdenktprofiel van het actieve sessiemodel plus dezelfde terugvallogica die `/status` en `session_status` gebruiken.
- De kiezer gebruikt `thinkingLevels` die worden teruggegeven door de Gateway-sessierij/-standaarden, waarbij `thinkingOptions` behouden blijft als verouderde labellijst. De browser-UI houdt geen eigen provider-regexlijst bij; plugins zijn eigenaar van modelspecifieke niveausets.
- `/think:<level>` werkt nog steeds en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatdirectives en de kiezer synchroon blijven.

## Providerprofielen

- Provider-plugins kunnen `resolveThinkingProfile(ctx)` beschikbaar maken om de ondersteunde niveaus en de standaardwaarde van het model te definiëren.
- Provider-plugins die Claude-modellen proxyen, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken, zodat directe Anthropic-catalogi en proxycatalogi op elkaar afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` of `max`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Tool-plugins die een expliciete thinking-override moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze moeten niet hun eigen lijsten met provider-/modelniveaus bijhouden.
- Tool-plugins met toegang tot geconfigureerde metadata van aangepaste modellen kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat opt-ins voor `compat.supportedReasoningEfforts` worden weerspiegeld in validatie aan de pluginzijde.
- Gepubliceerde legacy-hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven bestaan als compatibiliteitsadapters, maar nieuwe aangepaste niveausets moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen/standaardwaarden stellen `thinkingLevels`, `thinkingOptions` en `thinkingDefault` beschikbaar, zodat ACP-/chatclients dezelfde profiel-id's en labels renderen die runtimevalidatie gebruikt.

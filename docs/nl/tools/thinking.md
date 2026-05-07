---
read_when:
    - Aanpassen van de parsering of standaardinstellingen voor thinking-, fast-mode- of verbose-directieven
summary: Directiefsyntaxis voor /think, /fast, /verbose, /trace en zichtbaarheid van redenering
title: Denkniveaus
x-i18n:
    generated_at: "2026-05-07T13:27:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inline richtlijn in elke inkomende body: `/t <level>`, `/think:<level>`, of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maximaal budget)
  - xhigh → "ultrathink+" (GPT-5.2+ en Codex-modellen, plus Anthropic Claude Opus 4.7-inspanning)
  - adaptive → door de provider beheerd adaptief denken (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7, en dynamisch denken van Google Gemini)
  - max → maximale provider-redenering (Anthropic Claude Opus 4.7; Ollama koppelt dit aan de hoogste native `think`-inspanning)
  - `x-high`, `x_high`, `extra-high`, `extra high`, en `extra_high` worden gekoppeld aan `xhigh`.
  - `highest` wordt gekoppeld aan `high`.
- Provider-opmerkingen:
  - Denkmenu's en keuzelijsten worden aangestuurd door provider-profielen. Provider-Plugins declareren de exacte niveauset voor het geselecteerde model, inclusief labels zoals binair `on`.
  - `adaptive`, `xhigh`, en `max` worden alleen getoond voor provider-/modelprofielen die ze ondersteunen. Getypte richtlijnen voor niet-ondersteunde niveaus worden afgewezen met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van de rangorde van het provider-profiel. `adaptive` valt terug op `medium` bij niet-adaptieve modellen, terwijl `xhigh` en `max` terugvallen op het grootste ondersteunde niet-`off`-niveau voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer er geen expliciet denkniveau is ingesteld.
  - Anthropic Claude Opus 4.7 gebruikt niet standaard adaptief denken. De standaard API-inspanning blijft eigendom van de provider, tenzij je expliciet een denkniveau instelt.
  - Anthropic Claude Opus 4.7 koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkrichtlijn is en `xhigh` de inspanningsinstelling van Opus 4.7 is.
  - Anthropic Claude Opus 4.7 biedt ook `/think max`; dit wordt gekoppeld aan hetzelfde door de provider beheerde pad voor maximale inspanning.
  - Directe DeepSeek V4-modellen bieden `/think xhigh|max`; beide worden gekoppeld aan DeepSeek `reasoning_effort: "max"`, terwijl lagere niet-`off`-niveaus aan `high` worden gekoppeld.
  - Via OpenRouter gerouteerde DeepSeek V4-modellen bieden `/think xhigh` en sturen door OpenRouter ondersteunde `reasoning_effort`-waarden. Opgeslagen `max`-overrides vallen terug op `xhigh`.
  - Ollama-modellen met denkondersteuning bieden `/think low|medium|high|max`; `max` wordt gekoppeld aan native `think: "high"` omdat Ollama's native API de inspanningsstrings `low`, `medium`, en `high` accepteert.
  - OpenAI GPT-modellen koppelen `/think` via modelspecifieke inspanningsondersteuning van de Responses API. `/think off` stuurt `reasoning.effort: "none"` alleen wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde redeneerpayload weg in plaats van een niet-ondersteunde waarde te sturen.
  - Aangepaste OpenAI-compatibele catalogusitems kunnen `/think xhigh` inschakelen door `models.providers.<provider>.models[].compat.supportedReasoningEfforts` zo in te stellen dat `"xhigh"` is opgenomen. Dit gebruikt dezelfde compat-metadata die uitgaande OpenAI-payloads voor redeneerinspanning koppelt, zodat menu's, sessievalidering, agent-CLI en `llm-task` overeenkomen met het transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-verwijzingen slaan proxy-redeneringsinjectie over, omdat die uitgefaseerde route definitieve antwoordtekst via redeneervelden kon teruggeven.
  - Google Gemini koppelt `/think adaptive` aan Gemini's door de provider beheerde dynamische denken. Gemini 3-aanvragen laten een vast `thinkingLevel` weg, terwijl Gemini 2.5-aanvragen `thinkingBudget: -1` sturen; vaste niveaus worden nog steeds gekoppeld aan het dichtstbijzijnde Gemini `thinkingLevel` of budget voor die modelfamilie.
  - MiniMax (`minimax/*`) op het Anthropic-compatibele streamingpad gebruikt standaard `thinking: { type: "disabled" }`, tenzij je denken expliciet instelt in modelparameters of aanvraagparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit MiniMax' niet-native Anthropic-streamformaat.
  - Z.AI (`zai/*`) ondersteunt alleen binair denken (`on`/`off`). Elk niet-`off`-niveau wordt behandeld als `on` (gekoppeld aan `low`).
  - Moonshot (`moonshot/*`) koppelt `/think off` aan `thinking: { type: "disabled" }` en elk niet-`off`-niveau aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot alleen `tool_choice` `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Oplosvolgorde

1. Inline richtlijn in het bericht (geldt alleen voor dat bericht).
2. Sessie-override (ingesteld door een bericht te sturen dat alleen een richtlijn bevat).
3. Standaard per agent (`agents.list[].thinkingDefault` in de configuratie).
4. Globale standaard (`agents.defaults.thinkingDefault` in de configuratie).
5. Terugval: door provider gedeclareerde standaard wanneer beschikbaar; anders lossen redeneercapabele modellen op naar `medium` of het dichtstbijzijnde ondersteunde niet-`off`-niveau voor dat model, en blijven niet-redenerende modellen `off`.

## Een sessiestandaard instellen

- Stuur een bericht dat **alleen** de richtlijn bevat (witruimte toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Dat blijft gelden voor de huidige sessie (standaard per afzender); gewist door `/think:off` of een reset na sessie-inactiviteit.
- Er wordt een bevestigingsantwoord gestuurd (`Thinking level set to high.` / `Thinking disabled.`). Als het niveau ongeldig is (bijvoorbeeld `/thinking big`), wordt de opdracht afgewezen met een hint en blijft de sessiestatus ongewijzigd.
- Stuur `/think` (of `/think:`) zonder argument om het huidige denkniveau te zien.

## Toepassing per agent

- **Ingebedde Pi**: het opgeloste niveau wordt doorgegeven aan de in-proces Pi-agentruntime.
- **Claude CLI-backend**: niet-off-niveaus worden aan Claude Code doorgegeven als `--effort` bij gebruik van `claude-cli`; zie [CLI-backends](/nl/gateway/cli-backends).

## Snelle modus (/fast)

- Niveaus: `on|off`.
- Een bericht dat alleen een richtlijn bevat, schakelt een sessie-override voor snelle modus om en antwoordt met `Fast mode enabled.` / `Fast mode disabled.`.
- Stuur `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van snelle modus te zien.
- OpenClaw lost snelle modus in deze volgorde op:
  1. Inline/richtlijn-alleen `/fast on|off`
  2. Sessie-override
  3. Standaard per agent (`agents.list[].fastModeDefault`)
  4. Configuratie per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Terugval: `off`
- Voor `openai/*` wordt snelle modus gekoppeld aan prioriteitsverwerking van OpenAI door `service_tier=priority` te sturen bij ondersteunde Responses-aanvragen.
- Voor `openai-codex/*` stuurt snelle modus dezelfde `service_tier=priority`-vlag bij Codex Responses. OpenClaw behoudt één gedeelde `/fast`-schakelaar voor beide authenticatiepaden.
- Voor directe openbare `anthropic/*`-aanvragen, inclusief OAuth-geauthenticeerd verkeer dat naar `api.anthropic.com` wordt gestuurd, wordt snelle modus gekoppeld aan Anthropic-serviceniveaus: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic-`serviceTier` / `service_tier`-modelparameters overschrijven de standaard van snelle modus wanneer beide zijn ingesteld. OpenClaw slaat nog steeds Anthropic-serviceniveau-injectie over voor niet-Anthropic proxy-basis-URL's.
- `/status` toont `Fast` alleen wanneer snelle modus is ingeschakeld.

## Uitgebreide richtlijnen (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht dat alleen een richtlijn bevat, schakelt uitgebreide sessielogging om en antwoordt met `Verbose logging enabled.` / `Verbose logging disabled.`; ongeldige niveaus geven een hint terug zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessie-override op; wis deze via de Sessions-UI door `inherit` te kiezen.
- Inline richtlijn beïnvloedt alleen dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/verbose` (of `/verbose:`) zonder argument om het huidige uitgebreide niveau te zien.
- Wanneer uitgebreid is ingeschakeld, sturen agents die gestructureerde toolresultaten uitstoten (Pi, andere JSON-agents) elke toolaanroep terug als een eigen bericht met alleen metadata, voorafgegaan door `<emoji> <tool-name>: <arg>` wanneer beschikbaar. Deze toolsamenvattingen worden verzonden zodra elke tool start (afzonderlijke bubbels), niet als streamingdelta's.
- Samenvattingen van toolfouten blijven zichtbaar in normale modus, maar ruwe foutdetailsuffixen zijn verborgen tenzij uitgebreid `on` of `full` is.
- Wanneer uitgebreid `full` is, worden tooluitvoeren na voltooiing ook doorgestuurd (afzonderlijke bubbel, afgekapt tot een veilige lengte). Als je `/verbose on|full|off` omschakelt terwijl een run bezig is, respecteren daaropvolgende toolbubbels de nieuwe instelling.
- `agents.defaults.toolProgressDetail` bepaalt de vorm van `/verbose`-toolsamenvattingen en toolregels in voortgangsconcepten. Gebruik `"explain"` (standaard) voor compacte menselijke labels zoals `🛠️ Exec: checking JS syntax`; gebruik `"raw"` wanneer je ook de ruwe opdracht/details wilt toevoegen voor debugging. Per-agent `agents.list[].toolProgressDetail` overschrijft de standaard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-tracerichtlijnen (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht dat alleen een richtlijn bevat, schakelt Plugin-trace-uitvoer voor de sessie om en antwoordt met `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline richtlijn beïnvloedt alleen dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/trace` (of `/trace:`) zonder argument om het huidige traceniveau te zien.
- `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van de Plugin, zoals Active Memory-debugsamenvattingen.
- Traceregels kunnen verschijnen in `/status` en als een aanvullend diagnostisch bericht na het normale assistentantwoord.

## Zichtbaarheid van redenering (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht dat alleen een richtlijn bevat, schakelt om of denkblokken in antwoorden worden getoond.
- Wanneer ingeschakeld, wordt redenering verzonden als een **afzonderlijk bericht** voorafgegaan door `Reasoning:`.
- `stream` (alleen Telegram): streamt redenering naar de Telegram-conceptbubbel terwijl het antwoord wordt gegenereerd, en stuurt daarna het definitieve antwoord zonder redenering.
- Alias: `/reason`.
- Stuur `/reasoning` (of `/reasoning:`) zonder argument om het huidige redeneerniveau te zien.
- Oplosvolgorde: inline richtlijn, daarna sessie-override, daarna standaard per agent (`agents.list[].reasoningDefault`), daarna terugval (`off`).

Misvormde redeneertags van lokale modellen worden conservatief afgehandeld. Gesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-gesloten redenering na al zichtbare tekst wordt ook verborgen. Als een antwoord volledig is verpakt in één niet-gesloten openingstag en anders als lege tekst zou worden geleverd, verwijdert OpenClaw de misvormde openingstag en levert het de resterende tekst.

## Gerelateerd

- Documentatie voor verhoogde modus staat in [Verhoogde modus](/nl/tools/elevated).

## Heartbeats

- Heartbeat-probebody is de geconfigureerde Heartbeat-prompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline richtlijnen in een Heartbeat-bericht gelden zoals gebruikelijk (maar vermijd het wijzigen van sessiestandaarden vanuit Heartbeats).
- Heartbeat-levering gebruikt standaard alleen de definitieve payload. Om ook het afzonderlijke `Reasoning:`-bericht te sturen (wanneer beschikbaar), stel je `agents.defaults.heartbeat.includeReasoning: true` of per agent `agents.list[].heartbeat.includeReasoning: true` in.

## Webchat-UI

- De denkselector van de webchat spiegelt bij het laden van de pagina het opgeslagen niveau van de sessie uit de inkomende sessieopslag/-configuratie.
- Het kiezen van een ander niveau schrijft de sessie-override onmiddellijk weg via `sessions.patch`; het wacht niet op de volgende verzending en is geen eenmalige `thinkingOnce`-override.
- De eerste optie is altijd de keuze om de override te wissen. Deze toont `Overgenomen: <resolved level>` wanneer de sessie een niet-uit effectieve standaard overneemt, of `Uit` wanneer overgenomen denken is uitgeschakeld.
- Expliciete pickerkeuzes worden gelabeld als overrides, terwijl providerlabels behouden blijven wanneer die aanwezig zijn (bijvoorbeeld `Override: maximum` voor een door de provider gelabelde optie `max`).
- De picker gebruikt `thinkingLevels` die worden geretourneerd door de Gateway-sessierij/standaarden, waarbij `thinkingOptions` behouden blijft als verouderde labellijst. De browser-UI houdt geen eigen regexlijst voor providers bij; plugins beheren modelspecifieke niveausets.
- `/think:<level>` blijft werken en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatdirectieven en de picker synchroon blijven.

## Providerprofielen

- Providerplugins kunnen `resolveThinkingProfile(ctx)` beschikbaar stellen om de ondersteunde niveaus en standaardwaarde van het model te definiëren.
- Providerplugins die Claude-modellen proxyen, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken, zodat directe Anthropic- en proxycatalogi op elkaar afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` of `max`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Toolplugins die een expliciete thinking-override moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze moeten geen eigen niveau-overzichten per provider/model bijhouden.
- Toolplugins met toegang tot geconfigureerde aangepaste modelmetadata kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat opt-ins voor `compat.supportedReasoningEfforts` worden meegenomen in pluginzijdige validatie.
- Gepubliceerde verouderde hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven bestaan als compatibiliteitsadapters, maar nieuwe aangepaste niveausets moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen/-standaarden stellen `thinkingLevels`, `thinkingOptions` en `thinkingDefault` beschikbaar, zodat ACP-/chatclients dezelfde profiel-id's en labels weergeven die de runtimevalidatie gebruikt.

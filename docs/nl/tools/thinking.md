---
read_when:
    - Aanpassen van het parsen van richtlijnen of standaardwaarden voor redeneren, snelle modus of uitgebreide uitvoer
summary: Directievesyntaxis voor /think, /fast, /verbose, /trace en zichtbaarheid van redenering
title: Denkniveaus
x-i18n:
    generated_at: "2026-05-11T20:55:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inline richtlijn in elke inkomende body: `/t <level>`, `/think:<level>` of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maximaal budget)
  - xhigh → "ultrathink+" (GPT-5.2+ en Codex-modellen, plus Anthropic Claude Opus 4.7-inspanning)
  - adaptive → door provider beheerd adaptief denken (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7 en Google Gemini dynamisch denken)
  - max → maximale reasoning van provider (Anthropic Claude Opus 4.7; Ollama koppelt dit aan de hoogste native `think`-inspanning)
  - `x-high`, `x_high`, `extra-high`, `extra high` en `extra_high` worden gekoppeld aan `xhigh`.
  - `highest` wordt gekoppeld aan `high`.
- Provider-notities:
  - Denkmenu's en keuzelijsten worden aangestuurd door providerprofielen. Providerplugins declareren de exacte niveauset voor het geselecteerde model, inclusief labels zoals binair `on`.
  - `adaptive`, `xhigh` en `max` worden alleen getoond voor provider-/modelprofielen die ze ondersteunen. Getypte richtlijnen voor niet-ondersteunde niveaus worden geweigerd met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van providerprofielrang. `adaptive` valt terug op `medium` op niet-adaptieve modellen, terwijl `xhigh` en `max` terugvallen op het grootste ondersteunde niet-`off`-niveau voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer er geen expliciet denkniveau is ingesteld.
  - Anthropic Claude Opus 4.7 gebruikt niet standaard adaptief denken. De standaard API-inspanning blijft eigendom van de provider, tenzij je expliciet een denkniveau instelt.
  - Anthropic Claude Opus 4.7 koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkrichtlijn is en `xhigh` de Opus 4.7-inspanningsinstelling is.
  - Anthropic Claude Opus 4.7 biedt ook `/think max`; dit wordt gekoppeld aan hetzelfde door de provider beheerde pad voor maximale inspanning.
  - Directe DeepSeek V4-modellen bieden `/think xhigh|max`; beide worden gekoppeld aan DeepSeek `reasoning_effort: "max"`, terwijl lagere niet-`off`-niveaus aan `high` worden gekoppeld.
  - Via OpenRouter gerouteerde DeepSeek V4-modellen bieden `/think xhigh` en verzenden door OpenRouter ondersteunde `reasoning_effort`-waarden. Opgeslagen `max`-overrides vallen terug op `xhigh`.
  - Ollama-modellen met denkondersteuning bieden `/think low|medium|high|max`; `max` wordt gekoppeld aan native `think: "high"` omdat de native API van Ollama de inspanningsstrings `low`, `medium` en `high` accepteert.
  - OpenAI GPT-modellen koppelen `/think` via modelspecifieke Responses API-inspanningsondersteuning. `/think off` verzendt `reasoning.effort: "none"` alleen wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde reasoning-payload weg in plaats van een niet-ondersteunde waarde te verzenden.
  - Aangepaste OpenAI-compatibele catalogusitems kunnen `/think xhigh` inschakelen door `models.providers.<provider>.models[].compat.supportedReasoningEfforts` zo in te stellen dat `"xhigh"` is inbegrepen. Dit gebruikt dezelfde compat-metadata die uitgaande OpenAI-reasoning-inspanningspayloads koppelt, zodat menu's, sessievalidering, agent-CLI en `llm-task` overeenkomen met transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-verwijzingen slaan proxy-reasoning-injectie over, omdat die uitgefaseerde route definitieve antwoordtekst via reasoningvelden kon retourneren.
  - Google Gemini koppelt `/think adaptive` aan door Gemini's provider beheerd dynamisch denken. Gemini 3-aanvragen laten een vaste `thinkingLevel` weg, terwijl Gemini 2.5-aanvragen `thinkingBudget: -1` verzenden; vaste niveaus worden nog steeds gekoppeld aan het dichtstbijzijnde Gemini-`thinkingLevel` of budget voor die modelfamilie.
  - MiniMax (`minimax/*`) op het Anthropic-compatibele streamingpad gebruikt standaard `thinking: { type: "disabled" }`, tenzij je denken expliciet instelt in modelparameters of aanvraagparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit MiniMax' niet-native Anthropic-streamindeling.
  - Z.AI (`zai/*`) ondersteunt alleen binair denken (`on`/`off`). Elk niet-`off`-niveau wordt behandeld als `on` (gekoppeld aan `low`).
  - Moonshot (`moonshot/*`) koppelt `/think off` aan `thinking: { type: "disabled" }` en elk niet-`off`-niveau aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot alleen `tool_choice` `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Resolutievolgorde

1. Inline richtlijn in het bericht (geldt alleen voor dat bericht).
2. Sessie-override (ingesteld door een bericht te sturen dat alleen een richtlijn bevat).
3. Standaard per agent (`agents.list[].thinkingDefault` in config).
4. Globale standaard (`agents.defaults.thinkingDefault` in config).
5. Terugval: door provider gedeclareerde standaard wanneer beschikbaar; anders lossen modellen met reasoning-mogelijkheden op naar `medium` of het dichtstbijzijnde ondersteunde niet-`off`-niveau voor dat model, en modellen zonder reasoning blijven `off`.

## Een sessiestandaard instellen

- Stuur een bericht dat **alleen** de richtlijn is (witruimte toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Dat blijft gelden voor de huidige sessie (standaard per afzender). Gebruik `/think default` om de sessie-override te wissen en de geconfigureerde/providerstandaard te erven; aliassen zijn `inherit`, `clear`, `reset` en `unpin`.
- `/think off` slaat een expliciete uit-override op. Dit schakelt denken uit totdat je de sessie-override wijzigt of wist.
- Er wordt een bevestigingsantwoord verzonden (`Thinking level set to high.` / `Thinking disabled.`). Als het niveau ongeldig is (bijvoorbeeld `/thinking big`), wordt de opdracht geweigerd met een hint en blijft de sessiestatus ongewijzigd.
- Stuur `/think` (of `/think:`) zonder argument om het huidige denkniveau te zien.

## Toepassing per agent

- **Ingebedde Pi**: het opgeloste niveau wordt doorgegeven aan de in-process Pi-agentruntime.
- **Claude CLI-backend**: niet-uit-niveaus worden aan Claude Code doorgegeven als `--effort` wanneer `claude-cli` wordt gebruikt; zie [CLI-backends](/nl/gateway/cli-backends).

## Snelle modus (/fast)

- Niveaus: `on|off|default`.
- Een bericht met alleen een richtlijn schakelt een sessie-override voor snelle modus in of uit en antwoordt met `Fast mode enabled.` / `Fast mode disabled.`. Gebruik `/fast default` om de sessie-override te wissen en de geconfigureerde standaard te erven; aliassen zijn `inherit`, `clear`, `reset` en `unpin`.
- Stuur `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van snelle modus te zien.
- OpenClaw lost snelle modus in deze volgorde op:
  1. Inline-/richtlijn-only `/fast on|off`-override (`/fast default` wist deze laag)
  2. Sessie-override
  3. Standaard per agent (`agents.list[].fastModeDefault`)
  4. Config per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Terugval: `off`
- Voor `openai/*` wordt snelle modus gekoppeld aan OpenAI-prioriteitsverwerking door `service_tier=priority` te verzenden bij ondersteunde Responses-aanvragen.
- Voor `openai-codex/*` verzendt snelle modus dezelfde `service_tier=priority`-vlag bij Codex Responses. OpenClaw houdt één gedeelde `/fast`-schakelaar aan voor beide authenticatiepaden.
- Voor directe publieke `anthropic/*`-aanvragen, inclusief met OAuth geauthenticeerd verkeer dat naar `api.anthropic.com` wordt verzonden, wordt snelle modus gekoppeld aan Anthropic-servicelagen: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic-`serviceTier`- / `service_tier`-modelparameters overschrijven de standaard van snelle modus wanneer beide zijn ingesteld. OpenClaw slaat nog steeds Anthropic-servicelaaginjectie over voor niet-Anthropic proxy-basis-URL's.
- `/status` toont `Fast` alleen wanneer snelle modus is ingeschakeld.

## Uitgebreide richtlijnen (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht met alleen een richtlijn schakelt uitgebreide sessielogging in of uit en antwoordt met `Verbose logging enabled.` / `Verbose logging disabled.`; ongeldige niveaus retourneren een hint zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessie-override op; wis deze via de Sessions-UI door `inherit` te kiezen.
- Een inline richtlijn beïnvloedt alleen dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/verbose` (of `/verbose:`) zonder argument om het huidige uitgebreide niveau te zien.
- Wanneer uitgebreid is ingeschakeld, sturen agents die gestructureerde toolresultaten uitstoten (Pi, andere JSON-agents) elke toolaanroep terug als een eigen metadata-only bericht, voorafgegaan door `<emoji> <tool-name>: <arg>` wanneer beschikbaar. Deze toolsamenvattingen worden verzonden zodra elke tool start (afzonderlijke bubbels), niet als streamingdelta's.
- Samenvattingen van toolfouten blijven zichtbaar in normale modus, maar suffixen met ruwe foutdetails worden verborgen, tenzij uitgebreid `on` of `full` is.
- Wanneer uitgebreid `full` is, worden tooluitvoeren ook doorgestuurd na voltooiing (afzonderlijke bubbel, afgekapt tot een veilige lengte). Als je `/verbose on|full|off` schakelt terwijl een run bezig is, respecteren daaropvolgende toolbubbels de nieuwe instelling.
- `agents.defaults.toolProgressDetail` bepaalt de vorm van `/verbose`-toolsamenvattingen en toolregels in voortgangsconcepten. Gebruik `"explain"` (standaard) voor compacte menselijke labels zoals `🛠️ Exec: checking JS syntax`; gebruik `"raw"` wanneer je ook de ruwe opdracht/details wilt toevoegen voor debugging. Per-agent `agents.list[].toolProgressDetail` overschrijft de standaard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-traceringsrichtlijnen (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht met alleen een richtlijn schakelt Plugin-traceringsuitvoer voor de sessie in of uit en antwoordt met `Plugin trace enabled.` / `Plugin trace disabled.`.
- Een inline richtlijn beïnvloedt alleen dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/trace` (of `/trace:`) zonder argument om het huidige traceringsniveau te zien.
- `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van Plugins, zoals Active Memory-debugsamenvattingen.
- Traceringsregels kunnen verschijnen in `/status` en als diagnostisch vervolgbericht na het normale assistentantwoord.

## Zichtbaarheid van reasoning (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht met alleen een richtlijn schakelt of denkblokken in antwoorden worden getoond.
- Wanneer ingeschakeld, wordt reasoning verzonden als een **afzonderlijk bericht** voorafgegaan door `Reasoning:`.
- `stream` (alleen Telegram): streamt reasoning naar de Telegram-conceptbubbel terwijl het antwoord wordt gegenereerd, en verzendt daarna het definitieve antwoord zonder reasoning.
- Alias: `/reason`.
- Stuur `/reasoning` (of `/reasoning:`) zonder argument om het huidige reasoning-niveau te zien.
- Resolutievolgorde: inline richtlijn, daarna sessie-override, daarna standaard per agent (`agents.list[].reasoningDefault`), daarna globale standaard (`agents.defaults.reasoningDefault`), daarna terugval (`off`).

Misvormde reasoningtags van lokale modellen worden conservatief afgehandeld. Gesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-gesloten reasoning na al zichtbare tekst wordt ook verborgen. Als een antwoord volledig is verpakt in één niet-gesloten openingstag en anders als lege tekst zou worden geleverd, verwijdert OpenClaw de misvormde openingstag en levert de resterende tekst.

## Gerelateerd

- Documentatie voor verhoogde modus staat in [Verhoogde modus](/nl/tools/elevated).

## Heartbeats

- De Heartbeat-probe-body is de geconfigureerde Heartbeat-prompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline richtlijnen in een Heartbeat-bericht gelden zoals gebruikelijk (maar vermijd het wijzigen van sessiestandaarden vanuit Heartbeats).
- Heartbeat-levering gebruikt standaard alleen de definitieve payload. Om ook het afzonderlijke `Reasoning:`-bericht te verzenden (wanneer beschikbaar), stel je `agents.defaults.heartbeat.includeReasoning: true` of per-agent `agents.list[].heartbeat.includeReasoning: true` in.

## Webchat-UI

- De thinking-selector van de webchat weerspiegelt bij het laden van de pagina het opgeslagen niveau van de sessie uit de inkomende sessieopslag/configuratie.
- Als je een ander niveau kiest, wordt de sessie-override direct weggeschreven via `sessions.patch`; dit wacht niet op de volgende verzending en is geen eenmalige `thinkingOnce`-override.
- De eerste optie is altijd de keuze om de override te wissen. Deze toont `Overgenomen: <opgelost niveau>` wanneer de sessie een effectieve standaardwaarde overneemt die niet uit staat, of `Uit` wanneer overgenomen thinking is uitgeschakeld.
- Expliciete keuzes in de keuzelijst worden gelabeld als overrides, terwijl providerlabels behouden blijven wanneer die aanwezig zijn (bijvoorbeeld `Override: maximum` voor een door de provider gelabelde `max`-optie).
- De keuzelijst gebruikt `thinkingLevels` die worden geretourneerd door de Gateway-sessierij/standaardwaarden, waarbij `thinkingOptions` behouden blijft als verouderde labellijst. De browser-UI houdt geen eigen provider-regexlijst bij; plugins beheren modelspecifieke niveausets.
- `/think:<level>` blijft werken en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatinstructies en de keuzelijst gesynchroniseerd blijven.

## Providerprofielen

- Providerplugins kunnen `resolveThinkingProfile(ctx)` beschikbaar maken om de ondersteunde niveaus en standaardwaarde van het model te definiëren.
- Providerplugins die Claude-modellen proxyen, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken, zodat directe Anthropic- en proxycatalogi afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` of `max`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Toolplugins die een expliciete thinking-override moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze mogen geen eigen provider-/modelniveaulijsten bijhouden.
- Toolplugins met toegang tot geconfigureerde aangepaste modelmetadata kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat opt-ins voor `compat.supportedReasoningEfforts` worden meegenomen in validatie aan pluginzijde.
- Gepubliceerde verouderde hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven beschikbaar als compatibiliteitsadapters, maar nieuwe aangepaste niveausets moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen/standaardwaarden stellen `thinkingLevels`, `thinkingOptions` en `thinkingDefault` beschikbaar, zodat ACP-/chatclients dezelfde profiel-id's en labels renderen die runtimevalidatie gebruikt.

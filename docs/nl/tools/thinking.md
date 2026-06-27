---
read_when:
    - Aanpassen van het parsen of de standaardwaarden voor thinking-, fast-mode- of verbose-richtlijnen
summary: Directiefsyntax voor /think, /fast, /verbose, /trace en zichtbaarheid van redenering
title: Denkniveaus
x-i18n:
    generated_at: "2026-06-27T18:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inline-instructie in elke binnenkomende tekst: `/t <level>`, `/think:<level>`, of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "denken"
  - low → "hard denken"
  - medium → "harder denken"
  - high → "ultradenken" (maximaal budget)
  - xhigh → "ultradenken+" (GPT-5.2+ en Codex-modellen, plus Anthropic Claude Opus 4.7+-inspanning)
  - adaptive → door provider beheerd adaptief denken (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7+, en Google Gemini dynamisch denken)
  - max → maximale redenering van provider (Anthropic Claude Opus 4.7+; Ollama koppelt dit aan de hoogste native `think`-inspanning)
  - `x-high`, `x_high`, `extra-high`, `extra high`, en `extra_high` worden gekoppeld aan `xhigh`.
  - `highest` wordt gekoppeld aan `high`.
- Provider-opmerkingen:
  - Denkmenus en kiezers worden aangestuurd door providerprofielen. Provider-plugins declareren de exacte niveauset voor het geselecteerde model, inclusief labels zoals binair `on`.
  - `adaptive`, `xhigh`, en `max` worden alleen getoond voor provider-/modelprofielen die ze ondersteunen. Getypte instructies voor niet-ondersteunde niveaus worden geweigerd met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van de rangorde van het providerprofiel. `adaptive` valt terug op `medium` bij niet-adaptieve modellen, terwijl `xhigh` en `max` terugvallen op het grootste ondersteunde niet-`off`-niveau voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer er geen expliciet denkniveau is ingesteld.
  - Anthropic Claude Opus 4.8 en Opus 4.7 houden denken uitgeschakeld tenzij je expliciet een denkniveau instelt. De provider-eigen standaardinspanning van Opus 4.8 is `high` nadat adaptief denken is ingeschakeld.
  - Anthropic Claude Opus 4.7+ koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkinstructie is en `xhigh` de Opus-inspanningsinstelling is.
  - Anthropic Claude Opus 4.7+ biedt ook `/think max`; dit wordt gekoppeld aan hetzelfde provider-eigen pad voor maximale inspanning.
  - Directe DeepSeek V4-modellen bieden `/think xhigh|max`; beide worden gekoppeld aan DeepSeek `reasoning_effort: "max"`, terwijl lagere niet-uitgeschakelde niveaus worden gekoppeld aan `high`.
  - Via OpenRouter gerouteerde DeepSeek V4-modellen bieden `/think xhigh` en sturen door OpenRouter ondersteunde `reasoning_effort`-waarden. Opgeslagen `max`-overschrijvingen vallen terug op `xhigh`.
  - Ollama-modellen met denkondersteuning bieden `/think low|medium|high|max`; `max` wordt gekoppeld aan native `think: "high"` omdat de native API van Ollama de inspanningsteksten `low`, `medium`, en `high` accepteert.
  - OpenAI GPT-modellen koppelen `/think` via modelspecifieke ondersteuning voor Responses API-inspanning. `/think off` stuurt `reasoning.effort: "none"` alleen wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde redeneringspayload weg in plaats van een niet-ondersteunde waarde te sturen.
  - Aangepaste OpenAI-compatibele catalogusitems kunnen `/think xhigh` inschakelen door `models.providers.<provider>.models[].compat.supportedReasoningEfforts` zo in te stellen dat `"xhigh"` is opgenomen. Dit gebruikt dezelfde compat-metadata die uitgaande OpenAI-redeneringsinspanningpayloads koppelt, zodat menus, sessievalidering, agent-CLI en `llm-task` overeenkomen met transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-verwijzingen slaan proxy-redeneringsinjectie over omdat die buiten gebruik gestelde route definitieve antwoordtekst via redeneringsvelden kon retourneren.
  - Google Gemini koppelt `/think adaptive` aan Gemini's provider-eigen dynamische denken. Gemini 3-aanvragen laten een vaste `thinkingLevel` weg, terwijl Gemini 2.5-aanvragen `thinkingBudget: -1` sturen; vaste niveaus worden nog steeds gekoppeld aan de dichtstbijzijnde Gemini `thinkingLevel` of het dichtstbijzijnde budget voor die modelfamilie.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) op het Anthropic-compatibele streamingpad gebruikt standaard `thinking: { type: "disabled" }` tenzij je denken expliciet instelt in modelparameters of aanvraagparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit het niet-native Anthropic-streamformaat van M2.x. MiniMax-M3 (en M3.x) is uitgezonderd: M3 zendt correcte Anthropic-denkblokken uit en retourneert lege inhoud wanneer denken is uitgeschakeld, dus OpenClaw houdt M3 op het door de provider weggelaten/adaptieve denkpad.
  - Z.AI (`zai/*`) is binair (`on`/`off`) voor de meeste GLM-modellen. GLM-5.2 is de uitzondering: het biedt `/think off|low|high|max`, koppelt `low` en `high` aan Z.AI `reasoning_effort: "high"`, en koppelt `max` aan `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) denkt altijd. Het profiel biedt alleen `on`, en OpenClaw laat het uitgaande veld `thinking` weg zoals vereist door Moonshot. Andere `moonshot/*`-modellen koppelen `/think off` aan `thinking: { type: "disabled" }` en elk niet-`off`-niveau aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot alleen `tool_choice` `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Oplossingsvolgorde

1. Inline-instructie in het bericht (geldt alleen voor dat bericht).
2. Sessie-overschrijving (ingesteld door een bericht te sturen dat alleen uit een instructie bestaat).
3. Standaard per agent (`agents.list[].thinkingDefault` in configuratie).
4. Globale standaard (`agents.defaults.thinkingDefault` in configuratie).
5. Terugval: door provider gedeclareerde standaard wanneer beschikbaar; anders worden modellen met redeneringsmogelijkheden opgelost naar `medium` of het dichtstbijzijnde ondersteunde niet-`off`-niveau voor dat model, en blijven modellen zonder redeneringsmogelijkheden `off`.

## Een sessiestandaard instellen

- Stuur een bericht dat **alleen** de instructie bevat (witruimte toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Dat blijft gelden voor de huidige sessie (standaard per afzender). Gebruik `/think default` om de sessie-overschrijving te wissen en de geconfigureerde/providerstandaard te erven; aliassen zijn onder meer `inherit`, `clear`, `reset`, en `unpin`.
- `/think off` slaat een expliciete uit-overschrijving op. Dit schakelt denken uit totdat je de sessie-overschrijving wijzigt of wist.
- Er wordt een bevestigingsantwoord gestuurd (`Thinking level set to high.` / `Thinking disabled.`). Als het niveau ongeldig is (bijv. `/thinking big`), wordt de opdracht geweigerd met een hint en blijft de sessiestatus ongewijzigd.
- Stuur `/think` (of `/think:`) zonder argument om het huidige denkniveau te zien.

## Toepassing per agent

- **Ingebedde OpenClaw**: het opgeloste niveau wordt doorgegeven aan de in-process OpenClaw-agentruntime.
- **Claude CLI-backend**: niet-uitgeschakelde niveaus worden aan Claude Code doorgegeven als `--effort` bij gebruik van `claude-cli`; zie [CLI-backends](/nl/gateway/cli-backends).

## Snelle modus (/fast)

- Niveaus: `auto|on|off|default`.
- Een bericht dat alleen uit een instructie bestaat schakelt een sessie-overschrijving voor snelle modus om en antwoordt `Fast mode set to auto.`, `Fast mode enabled.`, of `Fast mode disabled.`. Gebruik `/fast default` om de sessie-overschrijving te wissen en de geconfigureerde standaard te erven; aliassen zijn onder meer `inherit`, `clear`, `reset`, en `unpin`.
- Stuur `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van snelle modus te zien.
- OpenClaw lost snelle modus in deze volgorde op:
  1. Inline-/alleen-instructie-overschrijving `/fast auto|on|off` (`/fast default` wist deze laag)
  2. Sessie-overschrijving
  3. Standaard per agent (`agents.list[].fastModeDefault`)
  4. Configuratie per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Terugval: `off`
- `auto` houdt de sessie-/configuratiemodus op auto, maar lost elke nieuwe modelaanroep onafhankelijk op. Aanroepen die vóór de automatische afkapgrens starten, hebben snelle modus ingeschakeld; latere retry-, fallback-, toolresultaat- of vervolgaanroepen starten met snelle modus uitgeschakeld. De afkapgrens is standaard 60 seconden; stel `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` in op het actieve model om dit te wijzigen.
- Voor `openai/*` wordt snelle modus gekoppeld aan OpenAI-prioriteitsverwerking door `service_tier=priority` te sturen bij ondersteunde Responses-aanvragen.
- Voor door Codex ondersteunde `openai/*` / `openai-codex/*`-modellen stuurt snelle modus dezelfde vlag `service_tier=priority` bij Codex Responses. Native Codex-appserverbeurten ontvangen de tier alleen bij `turn/start` of het starten/hervatten van een thread, dus `auto` kan een al lopende appserverbeurt niet opnieuw tier-en; het geldt voor de volgende modelbeurt die OpenClaw start.
- Voor directe publieke `anthropic/*`-aanvragen, inclusief OAuth-geauthenticeerd verkeer dat naar `api.anthropic.com` wordt gestuurd, wordt snelle modus gekoppeld aan Anthropic-servicetiers: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic `serviceTier` / `service_tier`-modelparameters overschrijven de standaard van snelle modus wanneer beide zijn ingesteld. OpenClaw slaat Anthropic-servicetierinjectie nog steeds over voor niet-Anthropic proxybasis-URL's.
- `/status` toont `Fast` wanneer snelle modus is ingeschakeld en `Fast:auto` wanneer de geconfigureerde modus auto is.

## Uitgebreide instructies (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht dat alleen uit een instructie bestaat schakelt uitgebreide sessielogging om en antwoordt `Verbose logging enabled.` / `Verbose logging disabled.`; ongeldige niveaus retourneren een hint zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessie-overschrijving op; wis deze via de Sessions-UI door `inherit` te kiezen.
- Geautoriseerde externe kanaalafzenders kunnen de uitgebreide sessie-overschrijving persistent maken. Interne gateway-/webchatclients hebben `operator.admin` nodig om deze persistent te maken.
- Inline-instructie beïnvloedt alleen dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/verbose` (of `/verbose:`) zonder argument om het huidige uitgebreide niveau te zien.
- Wanneer uitgebreid aan staat, sturen agents die gestructureerde toolresultaten uitzenden elke toolaanroep terug als een eigen bericht met alleen metadata, voorafgegaan door `<emoji> <tool-name>: <arg>` wanneer beschikbaar. Deze toolsamenvattingen worden gestuurd zodra elke tool start (aparte bubbels), niet als streamingdelta's.
- Samenvattingen van toolfouten blijven zichtbaar in normale modus, maar ruwe foutdetailsuffixen worden verborgen tenzij uitgebreid `full` is.
- Wanneer uitgebreid `full` is, worden tooluitvoeren na voltooiing ook doorgestuurd (aparte bubbel, afgekapt tot een veilige lengte). Als je `/verbose on|full|off` omschakelt terwijl een run bezig is, volgen latere toolbubbels de nieuwe instelling.
- `agents.defaults.toolProgressDetail` bepaalt de vorm van `/verbose`-toolsamenvattingen en toolregels in voortgangsconcepten. Gebruik `"explain"` (standaard) voor compacte menselijke labels zoals `🛠️ Exec: checking JS syntax`; gebruik `"raw"` wanneer je ook de ruwe opdracht/details toegevoegd wilt hebben voor debugging. Per-agent `agents.list[].toolProgressDetail` overschrijft de standaard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-trace-instructies (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht dat alleen uit een instructie bestaat schakelt Plugin-trace-uitvoer voor de sessie om en antwoordt `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline-instructie beïnvloedt alleen dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/trace` (of `/trace:`) zonder argument om het huidige traceniveau te zien.
- `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van plugins, zoals Active Memory-debugsamenvattingen.
- Traceregels kunnen verschijnen in `/status` en als een diagnostisch vervolgbericht na het normale assistentantwoord.

## Zichtbaarheid van redenering (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht dat alleen uit een instructie bestaat schakelt om of denkblokken in antwoorden worden getoond.
- Wanneer ingeschakeld, wordt redenering gestuurd als een **apart bericht** voorafgegaan door `Thinking`.
- `stream`: streamt redenering terwijl het antwoord wordt gegenereerd wanneer het actieve kanaal redeneringsvoorvertoningen ondersteunt, en stuurt daarna het definitieve antwoord zonder redenering.
- Alias: `/reason`.
- Stuur `/reasoning` (of `/reasoning:`) zonder argument om het huidige redeneringsniveau te zien.
- Oplossingsvolgorde: inline-instructie, daarna sessie-overschrijving, daarna standaard per agent (`agents.list[].reasoningDefault`), daarna globale standaard (`agents.defaults.reasoningDefault`), daarna terugval (`off`).

Misvormde reasoning-tags voor lokale modellen worden conservatief afgehandeld. Gesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-afgesloten reasoning na al zichtbare tekst wordt ook verborgen. Als een antwoord volledig is ingesloten in één niet-afgesloten openingstag en anders als lege tekst zou worden geleverd, verwijdert OpenClaw de misvormde openingstag en levert het de resterende tekst.

## Gerelateerd

- Documentatie voor verhoogde modus staat in [Verhoogde modus](/nl/tools/elevated).

## Heartbeats

- De body van de Heartbeat-probe is de geconfigureerde heartbeatprompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline instructies in een Heartbeat-bericht zijn zoals gebruikelijk van toepassing (maar vermijd het wijzigen van sessiestandaarden vanuit Heartbeats).
- Heartbeat-bezorging gebruikt standaard alleen de uiteindelijke payload. Stel `agents.defaults.heartbeat.includeReasoning: true` of per agent `agents.list[].heartbeat.includeReasoning: true` in om ook het afzonderlijke `Thinking`-bericht te verzenden (wanneer beschikbaar).

## Webchat-UI

- De denkniveauselector in de webchat weerspiegelt het opgeslagen niveau van de sessie uit de inkomende sessiestore/config wanneer de pagina wordt geladen.
- Het kiezen van een ander niveau schrijft de sessie-override onmiddellijk via `sessions.patch`; het wacht niet op de volgende verzending en is geen eenmalige `thinkingOnce`-override.
- De eerste optie is altijd de keuze om de override te wissen. Deze toont `Inherited: <resolved level>`, inclusief `Inherited: Off` wanneer overgenomen denken is uitgeschakeld.
- Expliciete keuzes in de selector gebruiken hun directe niveaulabels, terwijl providerlabels behouden blijven wanneer aanwezig (bijvoorbeeld `Maximum` voor een door de provider gelabelde `max`-optie).
- De selector gebruikt `thinkingLevels` die door de Gateway-sessierij/standaarden worden geretourneerd, waarbij `thinkingOptions` als legacy labellijst behouden blijft. De browser-UI houdt geen eigen provider-regexlijst bij; plugins beheren modelspecifieke niveausets.
- `/think:<level>` blijft werken en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatinstructies en de selector gesynchroniseerd blijven.

## Providerprofielen

- Provider-plugins kunnen `resolveThinkingProfile(ctx)` blootstellen om de ondersteunde niveaus en standaardwaarde van het model te definiëren.
- Provider-plugins die Claude-modellen proxyen, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken, zodat directe Anthropic-catalogi en proxycatalogi op elkaar afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` of `max`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Profielhooks ontvangen samengevoegde catalogusfeiten wanneer beschikbaar, waaronder `reasoning`, `compat.thinkingFormat` en `compat.supportedReasoningEfforts`. Gebruik die feiten om binaire of aangepaste profielen alleen bloot te stellen wanneer het geconfigureerde requestcontract de bijbehorende payload ondersteunt.
- Tool-plugins die een expliciete thinking-override moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze moeten geen eigen provider-/modelniveaulijsten bijhouden.
- Tool-plugins met toegang tot geconfigureerde metadata voor aangepaste modellen kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat opt-ins voor `compat.supportedReasoningEfforts` worden weerspiegeld in plugin-side validatie.
- Gepubliceerde legacy hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven bestaan als compatibiliteitsadapters, maar nieuwe aangepaste niveausets moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen/standaarden stellen `thinkingLevels`, `thinkingOptions` en `thinkingDefault` bloot, zodat ACP-/chatclients dezelfde profiel-id's en labels renderen als runtimevalidatie gebruikt.

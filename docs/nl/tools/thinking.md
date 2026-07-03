---
read_when:
    - Aanpassen van het parsen of de standaardwaarden voor thinking-, fast-mode- of verbose-richtlijnen
summary: Directivesyntaxis voor /think, /fast, /verbose, /trace en zichtbaarheid van redenering
title: Denkniveaus
x-i18n:
    generated_at: "2026-07-03T09:47:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inline directive in elke binnenkomende body: `/t <level>`, `/think:<level>`, of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maximaal budget)
  - xhigh → "ultrathink+" (GPT-5.2+ en Codex-modellen, plus Anthropic Claude Opus 4.7+ effort)
  - adaptive → door de provider beheerd adaptief denken (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7+, en dynamisch denken van Google Gemini)
  - max → maximale reasoning van de provider (Anthropic Claude Opus 4.7+; Ollama koppelt dit aan de hoogste native `think`-inspanning)
  - `x-high`, `x_high`, `extra-high`, `extra high`, en `extra_high` worden gekoppeld aan `xhigh`.
  - `highest` wordt gekoppeld aan `high`.
- Provider-opmerkingen:
  - Denkmenu's en keuzelijsten worden gestuurd door providerprofielen. Provider-plugins declareren de exacte niveauset voor het geselecteerde model, inclusief labels zoals binair `on`.
  - `adaptive`, `xhigh`, en `max` worden alleen getoond voor provider-/modelprofielen die ze ondersteunen. Getypte directives voor niet-ondersteunde niveaus worden geweigerd met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van de rangorde van het providerprofiel. `adaptive` valt terug op `medium` bij niet-adaptieve modellen, terwijl `xhigh` en `max` terugvallen op het grootste ondersteunde niet-`off`-niveau voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer er geen expliciet denkniveau is ingesteld.
  - Anthropic Claude Opus 4.8 en Opus 4.7 houden denken uitgeschakeld, tenzij je expliciet een denkniveau instelt. De provider-eigen effort-standaard van Opus 4.8 is `high` nadat adaptief denken is ingeschakeld.
  - Anthropic Claude Opus 4.7+ koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkdirective is en `xhigh` de Opus effort-instelling is.
  - Anthropic Claude Opus 4.7+ biedt ook `/think max`; dit wordt gekoppeld aan hetzelfde provider-eigen pad voor maximale effort.
  - Directe DeepSeek V4-modellen bieden `/think xhigh|max`; beide worden gekoppeld aan DeepSeek `reasoning_effort: "max"`, terwijl lagere niet-uit-niveaus worden gekoppeld aan `high`.
  - Via OpenRouter gerouteerde DeepSeek V4-modellen bieden `/think xhigh` en sturen door OpenRouter ondersteunde `reasoning.effort`-waarden in plaats van DeepSeek-native top-level `reasoning_effort`. Lagere niet-uit-niveaus worden gekoppeld aan `high`, en opgeslagen `max`-overrides vallen terug op `xhigh`.
  - Ollama-modellen met denkfunctionaliteit bieden `/think low|medium|high|max`; `max` wordt gekoppeld aan native `think: "high"` omdat Ollama's native API de effort-strings `low`, `medium`, en `high` accepteert.
  - OpenAI GPT-modellen koppelen `/think` via modelspecifieke ondersteuning voor Responses API-effort. `/think off` stuurt `reasoning.effort: "none"` alleen wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde reasoning-payload weg in plaats van een niet-ondersteunde waarde te sturen.
  - Aangepaste OpenAI-compatibele catalogusitems kunnen `/think xhigh` inschakelen door `models.providers.<provider>.models[].compat.supportedReasoningEfforts` zo in te stellen dat `"xhigh"` is opgenomen. Dit gebruikt dezelfde compat-metadata die uitgaande OpenAI reasoning effort-payloads koppelt, zodat menu's, sessievalidering, agent-CLI, en `llm-task` overeenkomen met transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-referenties slaan proxy-reasoninginjectie over omdat die gepensioneerde route uiteindelijke antwoordtekst via reasoningvelden kon teruggeven.
  - Google Gemini koppelt `/think adaptive` aan Gemini's provider-eigen dynamische denken. Gemini 3-verzoeken laten een vaste `thinkingLevel` weg, terwijl Gemini 2.5-verzoeken `thinkingBudget: -1` sturen; vaste niveaus worden nog steeds gekoppeld aan de dichtstbijzijnde Gemini `thinkingLevel` of het dichtstbijzijnde budget voor die modelfamilie.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) op het Anthropic-compatibele streamingpad gebruikt standaard `thinking: { type: "disabled" }`, tenzij je denken expliciet instelt in modelparameters of aanvraagparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit het niet-native Anthropic-streamformaat van M2.x. MiniMax-M3 (en M3.x) is uitgezonderd: M3 zendt correcte Anthropic-denkblokken uit en retourneert lege content wanneer denken is uitgeschakeld, dus OpenClaw houdt M3 op het door de provider weggelaten/adaptieve denkpad.
  - Z.AI (`zai/*`) is binair (`on`/`off`) voor de meeste GLM-modellen. GLM-5.2 is de uitzondering: het biedt `/think off|low|high|max`, koppelt `low` en `high` aan Z.AI `reasoning_effort: "high"`, en koppelt `max` aan `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) denkt altijd. Het profiel biedt alleen `on`, en OpenClaw laat het uitgaande veld `thinking` weg zoals vereist door Moonshot. Andere `moonshot/*`-modellen koppelen `/think off` aan `thinking: { type: "disabled" }` en elk niet-`off`-niveau aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot alleen `tool_choice` `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Oplosvolgorde

1. Inline directive in het bericht (geldt alleen voor dat bericht).
2. Sessie-override (ingesteld door een bericht te sturen dat alleen een directive bevat).
3. Standaard per agent (`agents.list[].thinkingDefault` in de configuratie).
4. Globale standaard (`agents.defaults.thinkingDefault` in de configuratie).
5. Terugval: door de provider gedeclareerde standaard wanneer beschikbaar; anders worden modellen met reasoningfunctionaliteit opgelost naar `medium` of het dichtstbijzijnde ondersteunde niet-`off`-niveau voor dat model, en blijven modellen zonder reasoning op `off`.

## Een sessiestandaard instellen

- Stuur een bericht dat **alleen** de directive bevat (witruimte toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Dit blijft gelden voor de huidige sessie (standaard per afzender). Gebruik `/think default` om de sessie-override te wissen en de geconfigureerde/providerstandaard te erven; aliassen zijn onder meer `inherit`, `clear`, `reset`, en `unpin`.
- `/think off` slaat een expliciete uit-override op. Dit schakelt denken uit totdat je de sessie-override wijzigt of wist.
- Er wordt een bevestigingsantwoord gestuurd (`Thinking level set to high.` / `Thinking disabled.`). Als het niveau ongeldig is (bijvoorbeeld `/thinking big`), wordt de opdracht geweigerd met een hint en blijft de sessiestatus ongewijzigd.
- Stuur `/think` (of `/think:`) zonder argument om het huidige denkniveau te zien.

## Toepassing per agent

- **Ingebedde OpenClaw**: het opgeloste niveau wordt doorgegeven aan de in-process OpenClaw-agentruntime.
- **Claude CLI-backend**: niet-uit-niveaus worden doorgegeven aan Claude Code als `--effort` bij gebruik van `claude-cli`; zie [CLI-backends](/nl/gateway/cli-backends).

## Snelle modus (/fast)

- Niveaus: `auto|on|off|default`.
- Een bericht dat alleen een directive bevat schakelt een sessie-override voor snelle modus om en antwoordt met `Fast mode set to auto.`, `Fast mode enabled.`, of `Fast mode disabled.`. Gebruik `/fast default` om de sessie-override te wissen en de geconfigureerde standaard te erven; aliassen zijn onder meer `inherit`, `clear`, `reset`, en `unpin`.
- Stuur `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van snelle modus te zien.
- OpenClaw lost snelle modus in deze volgorde op:
  1. Inline/directive-only `/fast auto|on|off`-override (`/fast default` wist deze laag)
  2. Sessie-override
  3. Standaard per agent (`agents.list[].fastModeDefault`)
  4. Configuratie per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Terugval: `off`
- `auto` houdt de sessie-/configuratiemodus op auto maar lost elke nieuwe modelaanroep onafhankelijk op. Aanroepen die starten vóór de auto-afkap hebben snelle modus ingeschakeld; latere retry-, fallback-, toolresultaat- of vervolgaanroepen starten met snelle modus uitgeschakeld. De afkap is standaard 60 seconden; stel `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` in op het actieve model om dit te wijzigen.
- Voor `openai/*` wordt snelle modus gekoppeld aan OpenAI-prioriteitsverwerking door `service_tier=priority` te sturen bij ondersteunde Responses-verzoeken.
- Voor door Codex ondersteunde `openai/*` / `openai-codex/*`-modellen stuurt snelle modus dezelfde `service_tier=priority`-vlag bij Codex Responses. Native Codex app-serverbeurten ontvangen de tier alleen bij `turn/start` of thread start/resume, dus `auto` kan een al actieve app-serverbeurt niet opnieuw tier-en; het geldt voor de volgende modelbeurt die OpenClaw start.
- Voor directe publieke `anthropic/*`-verzoeken, inclusief via OAuth geauthenticeerd verkeer naar `api.anthropic.com`, wordt snelle modus gekoppeld aan Anthropic-servicetiers: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic-modelparameters `serviceTier` / `service_tier` overschrijven de standaard van snelle modus wanneer beide zijn ingesteld. OpenClaw slaat Anthropic-servicetierinjectie nog steeds over voor niet-Anthropic proxy-base-URL's.
- `/status` toont `Fast` wanneer snelle modus is ingeschakeld en `Fast:auto` wanneer de geconfigureerde modus auto is.

## Uitgebreide directives (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht dat alleen een directive bevat schakelt uitgebreide sessielogging om en antwoordt `Verbose logging enabled.` / `Verbose logging disabled.`; ongeldige niveaus geven een hint terug zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessie-override op; wis deze via de Sessions UI door `inherit` te kiezen.
- Geautoriseerde afzenders van externe kanalen mogen de uitgebreide sessie-override persistent maken. Interne gateway-/webchatclients hebben `operator.admin` nodig om deze persistent te maken.
- Inline directive geldt alleen voor dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/verbose` (of `/verbose:`) zonder argument om het huidige uitgebreide niveau te zien.
- Wanneer uitgebreide logging aan staat, sturen agents die gestructureerde toolresultaten uitzenden elke toolaanroep terug als een eigen bericht met alleen metadata, voorafgegaan door `<emoji> <tool-name>: <arg>` wanneer beschikbaar. Deze toolsamenvattingen worden gestuurd zodra elke tool start (aparte berichten), niet als streamingdelta's.
- Samenvattingen van toolfouten blijven zichtbaar in normale modus, maar suffixen met ruwe foutdetails zijn verborgen tenzij uitgebreide logging `full` is.
- Wanneer uitgebreide logging `full` is, worden tooloutputs ook na voltooiing doorgestuurd (apart bericht, afgekapt tot een veilige lengte). Als je `/verbose on|full|off` omschakelt terwijl een run bezig is, respecteren volgende toolberichten de nieuwe instelling.
- `agents.defaults.toolProgressDetail` bepaalt de vorm van `/verbose`-toolsamenvattingen en toolregels in voortgangsconcepten. Gebruik `"explain"` (standaard) voor compacte menselijke labels zoals `🛠️ Exec: checking JS syntax`; gebruik `"raw"` wanneer je ook de ruwe opdracht/details toegevoegd wilt hebben voor debugging. Per-agent `agents.list[].toolProgressDetail` overschrijft de standaard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-tracedirectives (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht dat alleen een directive bevat schakelt plugin-trace-uitvoer voor de sessie om en antwoordt `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline directive geldt alleen voor dat bericht; anders gelden sessie-/globale standaarden.
- Stuur `/trace` (of `/trace:`) zonder argument om het huidige traceniveau te zien.
- `/trace` is smaller dan `/verbose`: het toont alleen plugin-eigen trace-/debugregels zoals debug-samenvattingen van Active Memory.
- Traceregels kunnen verschijnen in `/status` en als diagnostisch vervolgbericht na het normale assistentantwoord.

## Zichtbaarheid van reasoning (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht dat alleen een directive bevat schakelt om of denkblokken in antwoorden worden getoond.
- Wanneer ingeschakeld, wordt reasoning gestuurd als een **apart bericht** voorafgegaan door `Thinking`.
- `stream`: streamt reasoning terwijl het antwoord wordt gegenereerd wanneer het actieve kanaal reasoningvoorbeelden ondersteunt, en stuurt daarna het definitieve antwoord zonder reasoning.
- Alias: `/reason`.
- Stuur `/reasoning` (of `/reasoning:`) zonder argument om het huidige reasoningniveau te zien.
- Oplosvolgorde: inline directive, daarna sessie-override, daarna standaard per agent (`agents.list[].reasoningDefault`), daarna globale standaard (`agents.defaults.reasoningDefault`), daarna terugval (`off`).

Misvormde reasoning-tags voor lokale modellen worden conservatief afgehandeld. Gesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-gesloten reasoning na tekst die al zichtbaar is, wordt ook verborgen. Als een antwoord volledig is omwikkeld met één niet-gesloten openingstag en anders als lege tekst zou worden geleverd, verwijdert OpenClaw de misvormde openingstag en levert het de resterende tekst.

## Gerelateerd

- Documentatie voor verhoogde modus staat in [Verhoogde modus](/nl/tools/elevated).

## Heartbeats

- De body van de Heartbeat-probe is de geconfigureerde Heartbeat-prompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline instructies in een Heartbeat-bericht zijn zoals gebruikelijk van toepassing (maar vermijd het wijzigen van sessiestandaarden vanuit Heartbeats).
- Heartbeat-aflevering gebruikt standaard alleen de uiteindelijke payload. Stel `agents.defaults.heartbeat.includeReasoning: true` of per agent `agents.list[].heartbeat.includeReasoning: true` in om ook het afzonderlijke `Thinking`-bericht te verzenden (wanneer beschikbaar).

## Webchat-UI

- De denkselector van de webchat spiegelt bij het laden van de pagina het opgeslagen niveau van de sessie uit de inkomende sessieopslag/configuratie.
- Een ander niveau kiezen schrijft de sessie-override onmiddellijk weg via `sessions.patch`; dit wacht niet op de volgende verzending en is geen eenmalige `thinkingOnce`-override.
- De eerste optie is altijd de keuze om de override te wissen. Deze toont `Inherited: <resolved level>`, inclusief `Inherited: Off` wanneer overgenomen denken is uitgeschakeld.
- Expliciete keuzes in de selector gebruiken hun directe niveaulabels, terwijl providerlabels behouden blijven wanneer die aanwezig zijn (bijvoorbeeld `Maximum` voor een door de provider gelabelde `max`-optie).
- De selector gebruikt `thinkingLevels` die door de Gateway-sessierij/standaarden worden teruggegeven, waarbij `thinkingOptions` behouden blijft als verouderde labellijst. De browser-UI houdt geen eigen provider-regexlijst bij; plugins beheren modelspecifieke niveausets.
- `/think:<level>` werkt nog steeds en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatinstructies en de selector gesynchroniseerd blijven.

## Providerprofielen

- Providerplugins kunnen `resolveThinkingProfile(ctx)` beschikbaar maken om de ondersteunde niveaus en standaardwaarde van het model te definiëren.
- Providerplugins die Claude-modellen proxyen, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken, zodat directe Anthropic- en proxycatalogi op elkaar afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` of `max`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Profielhooks ontvangen samengevoegde catalogusfeiten wanneer beschikbaar, waaronder `reasoning`, `compat.thinkingFormat` en `compat.supportedReasoningEfforts`. Gebruik die feiten om binaire of aangepaste profielen alleen beschikbaar te maken wanneer het geconfigureerde aanvraagcontract de bijbehorende payload ondersteunt.
- Toolplugins die een expliciete denk-override moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze moeten geen eigen niveauoverzichten per provider/model bijhouden.
- Toolplugins met toegang tot geconfigureerde metadata voor aangepaste modellen kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat opt-ins via `compat.supportedReasoningEfforts` worden weerspiegeld in plugin-side validatie.
- Gepubliceerde verouderde hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven bestaan als compatibiliteitsadapters, maar nieuwe aangepaste niveausets moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen/standaarden stellen `thinkingLevels`, `thinkingOptions` en `thinkingDefault` beschikbaar, zodat ACP-/chatclients dezelfde profiel-id's en labels renderen die runtimevalidatie gebruikt.

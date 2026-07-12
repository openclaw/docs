---
read_when:
    - Aanpassen van de verwerking of standaardwaarden van richtlijnen voor denkniveau, snelle modus of uitgebreide uitvoer
summary: Richtlijnsyntaxis voor /think, /fast, /verbose, /trace en zichtbaarheid van redeneerstappen
title: Denkniveaus
x-i18n:
    generated_at: "2026-07-12T09:31:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Wat het doet

- Inlininstructie in elke binnenkomende berichttekst: `/t <level>`, `/think:<level>` of `/thinking <level>`.
- Niveaus (aliassen): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, grofweg overeenkomend met Anthropics klassieke reeks magische woorden "think" < "think hard" < "think harder" < "ultrathink":
  - minimal ~ "denk na"
  - low ~ "denk goed na"
  - medium ~ "denk nog beter na"
  - high ~ "denk uiterst grondig na" (maximaal budget)
  - xhigh ~ "denk uiterst grondig na+" (GPT-5.2+- en Codex-modellen, plus het inspanningsniveau van Anthropic Claude Opus 4.7+)
  - adaptive → adaptief denken dat door de provider wordt beheerd (ondersteund voor Claude 4.6 op Anthropic/Bedrock, Anthropic Claude Opus 4.7+ en dynamisch denken van Google Gemini)
  - max → maximale redeneerinspanning van de provider (Anthropic Claude Opus 4.7+; Ollama koppelt dit aan zijn hoogste systeemeigen `think`-inspanning)
  - ultra → maximale redeneerinspanning van de provider plus proactieve orkestratie van subagents wanneer het geselecteerde model/de geselecteerde runtime dit ondersteunt
  - `x-high`, `x_high`, `extra-high`, `extra high` en `extra_high` worden gekoppeld aan `xhigh`.
  - `highest` wordt gekoppeld aan `high`.
- Opmerkingen over providers:
  - Denkmenu's en keuzelijsten worden aangestuurd door het providerprofiel. Providerplugins declareren de exacte reeks niveaus voor het geselecteerde model, inclusief labels zoals het binaire `on`.
  - `adaptive`, `xhigh`, `max` en `ultra` worden alleen aangeboden voor provider-/model-/runtimeprofielen die deze ondersteunen. Getypte instructies voor niet-ondersteunde niveaus worden afgewezen met de geldige opties van dat model.
  - Bestaande opgeslagen niet-ondersteunde niveaus worden opnieuw gekoppeld op basis van de rangorde in het providerprofiel. `adaptive` valt bij niet-adaptieve modellen terug op `medium`, terwijl `xhigh` en `max` terugvallen op het hoogste ondersteunde niveau anders dan `off` voor het geselecteerde model.
  - Anthropic Claude 4.6-modellen gebruiken standaard `adaptive` wanneer geen expliciet denkniveau is ingesteld.
  - Bij Anthropic Claude Opus 4.8 en Opus 4.7 blijft denken uitgeschakeld, tenzij je expliciet een denkniveau instelt. De door de provider beheerde standaardinspanning van Opus 4.8 is `high` nadat adaptief denken is ingeschakeld.
  - Anthropic Claude Opus 4.7+ koppelt `/think xhigh` aan adaptief denken plus `output_config.effort: "xhigh"`, omdat `/think` een denkinstructie is en `xhigh` de inspanningsinstelling van Opus is.
  - Anthropic Claude Opus 4.7+ biedt ook `/think max`; dit wordt aan hetzelfde door de provider beheerde pad voor maximale inspanning gekoppeld.
  - Rechtstreekse DeepSeek V4-modellen bieden `/think xhigh|max`; beide worden gekoppeld aan DeepSeek `reasoning_effort: "max"`, terwijl lagere niveaus anders dan `off` aan `high` worden gekoppeld.
  - Via OpenRouter gerouteerde DeepSeek V4-modellen bieden `/think xhigh` en verzenden door OpenRouter ondersteunde waarden voor `reasoning.effort` in plaats van DeepSeeks systeemeigen `reasoning_effort` op het hoogste niveau. Lagere niveaus anders dan `off` worden gekoppeld aan `high` en opgeslagen `max`-overschrijvingen vallen terug op `xhigh`.
  - Ollama-modellen die denken ondersteunen, bieden `/think low|medium|high|max`; `max` wordt gekoppeld aan het systeemeigen `think: "high"`, omdat de systeemeigen API van Ollama de inspanningswaarden `low`, `medium` en `high` accepteert.
  - OpenAI GPT-modellen koppelen `/think` via de modelspecifieke ondersteuning voor inspanningsniveaus van de Responses API. `/think off` verzendt alleen `reasoning.effort: "none"` wanneer het doelmodel dit ondersteunt; anders laat OpenClaw de uitgeschakelde redeneerpayload weg in plaats van een niet-ondersteunde waarde te verzenden.
  - GPT-5.6 Sol en Terra bieden systeemeigen `/think ultra` via de Codex-runtime. GPT-5.6 Luna biedt niveaus tot en met `max`, omdat de Codex-catalogus ervan Ultra niet vermeldt.
  - De ingebedde OpenClaw-runtime biedt logisch `/think ultra` voor GPT-5.6 Sol, Terra en Luna. Deze verzendt de maximale inspanning van de provider en voegt richtlijnen toe voor proactieve, tot de uitvoering beperkte orkestratie van subagents.
  - Aangepaste OpenAI-compatibele catalogusvermeldingen kunnen `/think xhigh` inschakelen door `"xhigh"` op te nemen in `models.providers.<provider>.models[].compat.supportedReasoningEfforts`. Hiervoor worden dezelfde compatibiliteitsmetadata gebruikt die uitgaande payloads voor OpenAI-redeneerinspanning koppelen, zodat menu's, sessievalidatie, de agent-CLI en `llm-task` overeenkomen met het transportgedrag.
  - Verouderde geconfigureerde OpenRouter Hunter Alpha-verwijzingen slaan de injectie van proxyredenering over, omdat die buiten gebruik gestelde route definitieve antwoordtekst via redeneervelden kon retourneren.
  - Google Gemini koppelt `/think adaptive` aan het door de provider beheerde dynamische denken van Gemini. Gemini 3-aanvragen laten een vast `thinkingLevel` weg, terwijl Gemini 2.5-aanvragen `thinkingBudget: -1` verzenden; vaste niveaus worden nog steeds gekoppeld aan het dichtstbijzijnde Gemini-`thinkingLevel` of -budget voor die modelfamilie.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) gebruikt op het Anthropic-compatibele streamingpad standaard `thinking: { type: "disabled" }`, tenzij je denken expliciet instelt in model- of aanvraagparameters. Dit voorkomt gelekte `reasoning_content`-delta's uit de niet-systeemeigen Anthropic-streamindeling van M2.x. MiniMax-M3 (en M3.x) is uitgezonderd: M3 genereert correcte Anthropic-denkblokken en retourneert lege inhoud wanneer denken is uitgeschakeld, dus OpenClaw houdt M3 op het pad van de provider waarbij denken wordt weggelaten of adaptief is.
  - Z.AI (`zai/*`) is voor de meeste GLM-modellen binair (`on`/`off`). GLM-5.2 is de uitzondering: dit model biedt `/think off|low|high|max`, koppelt `low` en `high` aan Z.AI `reasoning_effort: "high"` en koppelt `max` aan `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) denkt altijd. Het profiel biedt alleen `on` en OpenClaw laat het uitgaande veld `thinking` weg zoals Moonshot vereist. Andere `moonshot/*`-modellen koppelen `/think off` aan `thinking: { type: "disabled" }` en elk niveau anders dan `off` aan `thinking: { type: "enabled" }`. Wanneer denken is ingeschakeld, accepteert Moonshot voor `tool_choice` alleen `auto|none`; OpenClaw normaliseert incompatibele waarden naar `auto`.

## Volgorde van bepaling

1. Inlininstructie in het bericht (geldt alleen voor dat bericht).
2. Sessieoverschrijving (ingesteld door een bericht te verzenden dat alleen een instructie bevat).
3. Standaard per agent (`agents.list[].thinkingDefault` in de configuratie).
4. Globale standaard (`agents.defaults.thinkingDefault` in de configuratie).
5. Terugval: de door de provider gedeclareerde standaard indien beschikbaar; anders worden modellen die redeneren ondersteunen ingesteld op `medium` of het dichtstbijzijnde ondersteunde niveau anders dan `off` voor dat model, en blijven modellen zonder redeneervermogen op `off`.

## Een sessiestandaard instellen

- Verzend een bericht dat **alleen** de instructie bevat (witruimte is toegestaan), bijvoorbeeld `/think:medium` of `/t high`.
- Deze instelling blijft voor de huidige sessie gelden (standaard per afzender). Gebruik `/think default` om de sessieoverschrijving te wissen en de geconfigureerde standaard of providerstandaard over te nemen; aliassen zijn onder meer `inherit`, `clear`, `reset` en `unpin`.
- `/think off` slaat een expliciete overschrijving voor uitschakeling op. Hiermee blijft denken uitgeschakeld totdat je de sessieoverschrijving wijzigt of wist.
- Er wordt een bevestigingsantwoord verzonden (`Denkniveau ingesteld op hoog.` / `Denken uitgeschakeld.`). Als het niveau ongeldig is (bijvoorbeeld `/thinking big`), wordt de opdracht met een aanwijzing afgewezen en blijft de sessiestatus ongewijzigd.
- Verzend `/think` (of `/think:`) zonder argument om het huidige denkniveau te bekijken.

## Toepassing per agent

- **Ingebedde OpenClaw**: het bepaalde niveau wordt doorgegeven aan de OpenClaw-agentruntime binnen het proces.
- **Claude CLI-backend**: concrete niveaus anders dan `off` worden bij gebruik van `claude-cli` als `--effort` aan Claude Code doorgegeven; `adaptive` verwijdert geconfigureerde inspanningsvlaggen en delegeert de effectieve inspanning aan de omgeving, instellingen en modelstandaarden van Claude Code. Zie [CLI-backends](/nl/gateway/cli-backends).

## Snelle modus (/fast)

- Niveaus: `auto|on|off|default`.
- Een bericht dat alleen de instructie bevat, schakelt een sessieoverschrijving voor de snelle modus om en antwoordt met `Snelle modus ingesteld op automatisch.`, `Snelle modus ingeschakeld.` of `Snelle modus uitgeschakeld.`. Gebruik `/fast default` om de sessieoverschrijving te wissen en de geconfigureerde standaard over te nemen; aliassen zijn onder meer `inherit`, `clear`, `reset` en `unpin`.
- Verzend `/fast` (of `/fast status`) zonder modus om de huidige effectieve status van de snelle modus te bekijken.
- OpenClaw bepaalt de snelle modus in deze volgorde:
  1. Inlineoverschrijving of bericht met alleen de instructie `/fast auto|on|off` (`/fast default` wist deze laag)
  2. Sessieoverschrijving
  3. Standaard per agent (`agents.list[].fastModeDefault`)
  4. Configuratie per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Terugval: `off`
- `auto` behoudt automatisch als sessie-/configuratiemodus, maar bepaalt elke nieuwe modelaanroep afzonderlijk. Voor aanroepen die vóór de automatische afsluitgrens beginnen, is de snelle modus ingeschakeld; latere herhalings-, terugval-, toolresultaat- of vervolgaanroepen beginnen met uitgeschakelde snelle modus. De afsluitgrens is standaard 60 seconden; stel `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` voor het actieve model in om deze te wijzigen.
- Voor `openai/*` wordt de snelle modus gekoppeld aan prioriteitsverwerking van OpenAI door `service_tier=priority` te verzenden bij ondersteunde Responses-aanvragen.
- Voor door Codex ondersteunde `openai/*`- / `openai-codex/*`-modellen verzendt de snelle modus dezelfde vlag `service_tier=priority` bij Codex Responses. Systeemeigen beurten van de Codex-appserver ontvangen het niveau alleen bij `turn/start` of bij het starten/hervatten van een thread, zodat `auto` het niveau van een reeds actieve appserverbeurt niet kan wijzigen; het wordt toegepast op de volgende modelbeurt die OpenClaw start.
- Voor rechtstreekse openbare `anthropic/*`-aanvragen, waaronder met OAuth geverifieerd verkeer dat naar `api.anthropic.com` wordt verzonden, wordt de snelle modus gekoppeld aan Anthropic-serviceniveaus: `/fast on` stelt `service_tier=auto` in, `/fast off` stelt `service_tier=standard_only` in.
- Voor `minimax/*` op het Anthropic-compatibele pad herschrijft `/fast on` (of `params.fastMode: true`) `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
- Expliciete Anthropic-modelparameters `serviceTier` / `service_tier` overschrijven de standaard van de snelle modus wanneer beide zijn ingesteld. OpenClaw slaat de injectie van het Anthropic-serviceniveau nog steeds over voor niet-Anthropic proxy-basis-URL's.
- `/status` toont `Fast` wanneer de snelle modus is ingeschakeld en `Fast:auto` wanneer de geconfigureerde modus automatisch is.

## Uitgebreide instructies (/verbose of /v)

- Niveaus: `on` (minimaal) | `full` | `off` (standaard).
- Een bericht dat alleen de instructie bevat, schakelt uitgebreide sessielogboekregistratie om en antwoordt met `Uitgebreide logboekregistratie ingeschakeld.` / `Uitgebreide logboekregistratie uitgeschakeld.`; ongeldige niveaus retourneren een aanwijzing zonder de status te wijzigen.
- `/verbose off` slaat een expliciete sessieoverschrijving op; wis deze via de sessie-interface door `inherit` te kiezen.
- Geautoriseerde afzenders van externe kanalen mogen de uitgebreide sessieoverschrijving permanent opslaan. Interne Gateway-/webchatclients hebben `operator.admin` nodig om deze permanent op te slaan.
- Een inlininstructie geldt alleen voor dat bericht; anders gelden de sessie-/globale standaarden.
- Verzend `/verbose` (of `/verbose:`) zonder argument om het huidige uitgebreide niveau te bekijken.
- Wanneer de uitgebreide modus is ingeschakeld, sturen agents die gestructureerde toolresultaten genereren elke toolaanroep terug als een afzonderlijk bericht met alleen metadata, indien beschikbaar voorafgegaan door `<emoji> <tool-name>: <arg>`. Deze toolsamenvattingen worden verzonden zodra elke tool start (afzonderlijke tekstballonnen), niet als streamingdelta's.
- Samenvattingen van toolfouten blijven zichtbaar in de normale modus, maar achtervoegsels met onbewerkte foutdetails worden verborgen tenzij de uitgebreide modus `full` is.
- Wanneer de uitgebreide modus `full` is, wordt tooluitvoer na voltooiing ook doorgestuurd (afzonderlijke tekstballon, ingekort tot een veilige lengte). Als je `/verbose on|full|off` omschakelt terwijl een uitvoering actief is, gebruiken volgende tooltekstballonnen de nieuwe instelling.
- `agents.defaults.toolProgressDetail` bepaalt de vorm van `/verbose`-toolsamenvattingen en toolregels in voortgangsconcepten. Gebruik `"explain"` (standaard) voor compacte, voor mensen leesbare labels zoals `🛠️ Uitvoeren: JS-syntaxis controleren`; gebruik `"raw"` wanneer je voor foutopsporing ook de onbewerkte opdracht/details wilt toevoegen. `agents.list[].toolProgressDetail` per agent overschrijft de standaard.
  - `explain`: `🛠️ Uitvoeren: JS-syntaxis voor /tmp/app.js controleren`
  - `raw`: `🛠️ Uitvoeren: JS-syntaxis voor /tmp/app.js controleren, node --check /tmp/app.js`

## Plugin-traceerinstructies (/trace)

- Niveaus: `on` | `off` (standaard).
- Een bericht dat alleen de instructie bevat, schakelt de traceeruitvoer van de sessieplugin om en antwoordt met `Plugin-tracering ingeschakeld.` / `Plugin-tracering uitgeschakeld.`.
- Een inlininstructie geldt alleen voor dat bericht; anders gelden de sessie-/globale standaarden.
- Verzend `/trace` (of `/trace:`) zonder argument om het huidige traceerniveau te bekijken.
- `/trace` is beperkter dan `/verbose`: het toont alleen traceer-/foutopsporingsregels die eigendom zijn van de plugin, zoals foutopsporingssamenvattingen van Active Memory.
- Traceerregels kunnen in `/status` en als diagnostisch vervolgbericht na het normale assistentantwoord verschijnen.

## Zichtbaarheid van redeneringen (/reasoning)

- Niveaus: `on|off|stream`.
- Een bericht met alleen de instructie schakelt in of denkblokken in antwoorden worden weergegeven.
- Wanneer dit is ingeschakeld, wordt de redenering verzonden als een **afzonderlijk bericht** met het voorvoegsel `Thinking`.
- `stream`: streamt de redenering terwijl het antwoord wordt gegenereerd wanneer het actieve kanaal voorbeelden van de redenering ondersteunt, en verzendt vervolgens het definitieve antwoord zonder redenering.
- Alias: `/reason`.
- Verzend `/reasoning` (of `/reasoning:`) zonder argument om het huidige redeneerniveau te bekijken.
- Volgorde van bepaling: inline-instructie, daarna sessieoverschrijving, vervolgens de standaardwaarde per agent (`agents.list[].reasoningDefault`), daarna de globale standaardwaarde (`agents.defaults.reasoningDefault`) en ten slotte de terugvalwaarde (`off`).

Onjuist gevormde redeneringstags van lokale modellen worden voorzichtig verwerkt. Afgesloten `<think>...</think>`-blokken blijven verborgen in normale antwoorden, en niet-afgesloten redeneringen na reeds zichtbare tekst worden eveneens verborgen. Als een antwoord volledig is omsloten door één niet-afgesloten openingstag en anders als lege tekst zou worden afgeleverd, verwijdert OpenClaw de onjuist gevormde openingstag en levert het de resterende tekst af.

## Gerelateerd

- Documentatie over de modus met verhoogde bevoegdheden staat in [Modus met verhoogde bevoegdheden](/nl/tools/elevated).

## Heartbeats

- De inhoud van de Heartbeat-controle is de geconfigureerde Heartbeat-prompt (standaard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-instructies in een Heartbeat-bericht worden zoals gebruikelijk toegepast (maar vermijd het wijzigen van sessiestandaardwaarden vanuit Heartbeats).
- Heartbeat-aflevering verzendt standaard alleen de definitieve payload. Stel `agents.defaults.heartbeat.includeReasoning: true` of per agent `agents.list[].heartbeat.includeReasoning: true` in om ook het afzonderlijke `Thinking`-bericht te verzenden (indien beschikbaar).

## Webchatinterface

- Wanneer de pagina wordt geladen, weerspiegelt de denkniveaukiezer van de webchat het opgeslagen niveau van de sessie uit het inkomende sessiearchief of de configuratie.
- Als een ander niveau wordt gekozen, wordt de sessieoverschrijving onmiddellijk via `sessions.patch` opgeslagen; er wordt niet gewacht op de volgende verzending en het is geen eenmalige `thinkingOnce`-overschrijving.
- Als een bericht wordt verzonden terwijl wijzigingen in de model-, redeneer- of snelheidskiezer nog worden toegepast, wordt gewacht op elke wachtende kiezerpatch; als een wijziging mislukt, blijft het bericht onverzonden zodat het kan worden gecontroleerd.
- De eerste optie is altijd de keuze om de overschrijving te wissen. Deze toont `Overgenomen: <bepaald niveau>`, waaronder `Overgenomen: Uit` wanneer overgenomen denken is uitgeschakeld.
- Expliciete keuzes in de kiezer gebruiken hun directe niveaulabels en behouden eventuele providerlabels (bijvoorbeeld `Maximum` voor een door de provider gelabelde optie `max`).
- De kiezer gebruikt `thinkingLevels` die door de Gateway-sessierij of -standaardwaarden worden geretourneerd, waarbij `thinkingOptions` als verouderde lijst met labels behouden blijft. De browserinterface houdt geen eigen lijst met reguliere expressies voor providers bij; plugins beheren modelspecifieke niveausets.
- `/think:<level>` blijft werken en werkt hetzelfde opgeslagen sessieniveau bij, zodat chatinstructies en de kiezer gesynchroniseerd blijven.

## Providerprofielen

- Providerplugins kunnen `resolveThinkingProfile(ctx)` beschikbaar stellen om de ondersteunde niveaus en standaardwaarde van het model te definiëren.
- Providerplugins die Claude-modellen als proxy doorgeven, moeten `resolveClaudeThinkingProfile(modelId)` uit `openclaw/plugin-sdk/provider-model-shared` hergebruiken, zodat rechtstreekse Anthropic-catalogi en proxycatalogi op elkaar afgestemd blijven.
- Elk profielniveau heeft een opgeslagen canonieke `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` of `ultra`) en kan een weergave-`label` bevatten. Binaire providers gebruiken `{ id: "low", label: "on" }`.
- Profielhooks ontvangen, indien beschikbaar, samengevoegde catalogusgegevens, waaronder `reasoning`, `compat.thinkingFormat` en `compat.supportedReasoningEfforts`. Gebruik deze gegevens om binaire of aangepaste profielen alleen beschikbaar te stellen wanneer het geconfigureerde aanvraagcontract de bijbehorende payload ondersteunt.
- Toolplugins die een expliciete overschrijving van het denkniveau moeten valideren, moeten `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` samen met `api.runtime.agent.normalizeThinkingLevel(...)` gebruiken; ze mogen geen eigen lijsten met niveaus per provider of model bijhouden. Geef `agentRuntime` door wanneer de tool het uitvoeringspad beheert, zoals bij een uitvoering die altijd is ingebed.
- Toolplugins met toegang tot geconfigureerde aangepaste modelmetadata kunnen `catalog` doorgeven aan `resolveThinkingPolicy`, zodat aanmeldingen via `compat.supportedReasoningEfforts` worden weerspiegeld in validatie aan de pluginzijde.
- Gepubliceerde verouderde hooks (`supportsXHighThinking`, `isBinaryThinking` en `resolveDefaultThinkingLevel`) blijven beschikbaar als compatibiliteitsadapters, maar nieuwe aangepaste niveausets moeten `resolveThinkingProfile` gebruiken.
- Gateway-rijen en -standaardwaarden stellen `thinkingLevels`, `thinkingOptions` en `thinkingDefault` beschikbaar, zodat ACP- en chatclients dezelfde profiel-ID's en labels weergeven als die door runtimevalidatie worden gebruikt.

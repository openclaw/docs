---
read_when:
    - Je wilt weten welke sessietools de agent heeft
    - Je wilt toegang tussen sessies of het starten van subagents configureren
    - Je wilt de status van gestarte subagents controleren
summary: Agenttools voor sessieoverstijgende status, herinnering, berichtenuitwisseling en subagentorkestratie
title: Sessietools
x-i18n:
    generated_at: "2026-07-16T15:45:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw biedt agents hulpmiddelen om sessieoverschrijdend te werken, de status te inspecteren en sub-agents te orkestreren.

## Beschikbare hulpmiddelen

| Hulpmiddel            | Wat het doet                                                                 |
| --------------------- | ---------------------------------------------------------------------------- |
| `sessions_list`    | Sessies weergeven met optionele filters (soort, label, agent, archief, voorbeeld) |
| `sessions_history` | Het transcript van een specifieke sessie lezen                               |
| `sessions_send`    | Een bericht naar een andere sessie sturen en optioneel wachten                |
| `sessions_spawn`   | Een geïsoleerde sub-agentsessie starten voor achtergrondwerk                  |
| `sessions_yield`   | De huidige beurt beëindigen en wachten op vervolgresultaten van sub-agents    |
| `subagents`        | De status van voor deze sessie gestarte sub-agents weergeven                  |
| `session_status`   | Een kaart in `/status`-stijl weergeven en optioneel een modeloverschrijving per sessie instellen |

Deze hulpmiddelen zijn nog steeds onderworpen aan het actieve hulpmiddelenprofiel en het beleid voor toestaan/weigeren. `tools.profile: "coding"` bevat de volledige set voor sessieorkestratie, inclusief `sessions_spawn`, `sessions_yield` en `subagents`. `tools.profile: "messaging"` bevat hulpmiddelen voor berichten tussen sessies (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), maar niet voor het starten van sub-agents. Voeg het volgende toe om een berichtenprofiel te behouden en toch native delegatie toe te staan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Beleid voor groepen, providers, sandboxen en afzonderlijke agents kan deze hulpmiddelen na de profielfase alsnog verwijderen. Gebruik `/tools` vanuit de betreffende sessie om de effectieve lijst met hulpmiddelen te inspecteren.

## Sessies weergeven en lezen

`sessions_list` retourneert sessies met hun sleutel, agentId, soort, kanaal, model, aantallen tokens en tijdstempels. Filter op `kinds` (array; geaccepteerde waarden: `main`, `group`, `cron`, `hook`, `node`, `other`), exacte `label`, exacte `agentId`, tekst in `search` of recentheid (`activeMinutes`). Standaard worden actieve sessies geretourneerd; geef `archived: true` door om in plaats daarvan gearchiveerde sessies te inspecteren. Rijen bevatten de status van `pinned` en `archived`. Stel `includeDerivedTitles`, `includeLastMessage` of `messageLimit` (maximaal 20) in wanneer je triage in postvakstijl nodig hebt: een afgeleide titel binnen het zichtbaarheidsscope, een voorbeeldfragment van het laatste bericht of een begrensde reeks recente berichten per rij. Afgeleide titels en voorbeelden worden alleen gemaakt voor sessies die de aanroeper volgens het geconfigureerde zichtbaarheidsbeleid voor sessiehulpmiddelen al kan zien, zodat niet-gerelateerde sessies verborgen blijven. Wanneer de zichtbaarheid beperkt is, retourneert `sessions_list` optionele `visibility`-metadata die de effectieve modus toont en waarschuwt dat resultaten mogelijk tot de scope beperkt zijn.

`sessions_history` haalt het gesprekstranscript van een specifieke sessie op. Standaard worden hulpmiddelresultaten uitgesloten; geef `includeTools: true` door om ze te bekijken. Gebruik `limit` voor het nieuwste begrensde einde. Geef `offset: 0` door wanneer je pagineringsmetadata nodig hebt en geef vervolgens geretourneerde `nextOffset`-waarden door om achterwaarts door oudere transcriptvensters van OpenClaw te bladeren zonder onbewerkte transcriptbestanden te lezen. Expliciete offsetpagina's voegen geen fallback-imports van externe CLI's samen; gebruik de standaardweergave van het nieuwste einde (zonder `offset`) wanneer je die samengevoegde weergavegeschiedenis nodig hebt.

De geretourneerde weergave is bewust begrensd en op veiligheid gefilterd:

- assistenttekst wordt vóór het ophalen genormaliseerd:
  - thinking-tags worden verwijderd
  - structuurblokken van `<relevant-memories>` / `<relevant_memories>` worden verwijderd
  - XML-payloadblokken voor hulpmiddelaanroepen in platte tekst, zoals `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` en `<function_calls>...</function_calls>`, worden verwijderd, inclusief afgekorte payloads die nooit correct worden afgesloten
  - gedegradeerde structuur voor hulpmiddelaanroepen/-resultaten, zoals `[Tool Call: ...]`, `[Tool Result ...]` en `[Historical context ...]`, wordt verwijderd
  - gelekte modelbesturingstokens, zoals `<|assistant|>`, andere ASCII-`<|...|>`-tokens en varianten van `<｜...｜>` met volledige tekenbreedte, worden verwijderd
  - ongeldige MiniMax-XML voor hulpmiddelaanroepen, zoals `<invoke ...>` / `</minimax:tool_call>`, wordt verwijderd
- tekst die op aanmeldgegevens/tokens lijkt, wordt vóór retournering geredigeerd
- lange tekstblokken worden afgekapt
- bij zeer grote geschiedenissen kunnen oudere rijen worden weggelaten of kan een te grote rij worden vervangen door `[sessions_history omitted: message too large]`
- het hulpmiddel rapporteert samenvattingsvlaggen zoals `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` en pagineringsmetadata

Beide hulpmiddelen accepteren een **sessiesleutel** (zoals `"main"`) of een **sessie-ID** uit een eerdere weergaveaanroep.

Als je het exacte onbewerkte transcript nodig hebt, inspecteer dan de SQLite-transcriptrijen binnen de scope in plaats van `sessions_history` als een ongefilterde dump te beschouwen.

## Berichten tussen sessies sturen

`sessions_send` bezorgt een bericht aan een andere sessie en wacht optioneel op het antwoord:

- **Versturen zonder wachten:** stel `timeoutSeconds: 0` in om het bericht in de wachtrij te plaatsen en onmiddellijk terug te keren.
- **Op antwoord wachten:** stel een time-out in en ontvang het antwoord inline.

Chatsessies die tot een thread zijn beperkt, zoals sleutels die eindigen op `:thread:<id>`, zijn geen geldige doelen voor `sessions_send`. Gebruik de sessiesleutel van het bovenliggende kanaal voor coördinatie tussen agents, zodat via hulpmiddelen gerouteerde berichten niet in een actieve, voor mensen zichtbare thread verschijnen.

Berichten en A2A-vervolgantwoorden worden in de ontvangende prompt (`[Inter-session message ... isUser=false]`) en in de herkomstgegevens van het transcript gemarkeerd als gegevens tussen sessies. De ontvangende agent moet ze behandelen als via hulpmiddelen gerouteerde gegevens, niet als een rechtstreeks door de eindgebruiker geschreven instructie.

Nadat het doel heeft geantwoord, kan OpenClaw een **terugantwoordlus** uitvoeren waarin de agents om beurten berichten sturen (maximaal `session.agentToAgent.maxPingPongTurns`, bereik 0-20, standaard 5). De doelagent kan antwoorden met `REPLY_SKIP` om vroegtijdig te stoppen.

Geef `watch: true` door om de afzender ook te registreren als bewaker van statuswijzigingen van het doel: wanneer een andere actor later een rechtstreeks menselijk bericht naar het doel stuurt of het doel ervan wijzigt, ontvangt de afzender een systeemmelding die verwijst naar `session_status` `changesSince`. Registratie vindt plaats na succesvolle verzending, is gericht op de sessie die het bericht daadwerkelijk heeft ontvangen en begint bij de huidige statusversie, zodat alleen latere wijzigingen meldingen opleveren. Het resultaat rapporteert `watched: true` wanneer de registratie is geslaagd. Zie [Bewustzijn van sessiestatus](/concepts/session-state).

## Helpers voor status en orkestratie

`session_status` is het lichtgewicht hulpmiddel dat overeenkomt met `/status` voor de huidige of een andere zichtbare sessie. Het rapporteert gebruik, tijd, model-/runtimestatus en, indien aanwezig, context van gekoppelde achtergrondtaken. Net als `/status` kan het ontbrekende token-/cachetellers aanvullen vanuit de nieuwste gebruiksvermelding in het transcript, en `model=default` wist een overschrijving per sessie. Gebruik `sessionKey="current"` voor de huidige sessie van de aanroeper; zichtbare clientlabels zoals `openclaw-tui` zijn geen sessiesleutels.

Wanneer routeringsmetadata beschikbaar zijn, bevat `session_status` ook een zichtbaar JSON-blok van `Route context` en overeenkomende gestructureerde `details`-velden. Deze velden onderscheiden de sessiesleutel van de route die momenteel de actieve uitvoering afhandelt:

- `origin` geeft aan waar de sessie is gemaakt, of welke provider is afgeleid uit een prefix van een bezorgbare sessiesleutel wanneer oudere status geen opgeslagen herkomstmetadata bevat.
- `active` is de huidige route van de actieve uitvoering. Deze wordt alleen gerapporteerd voor de live of huidige sessie die nu wordt afgehandeld.
- `deliveryContext` is de permanente bezorgroute die bij de sessie is opgeslagen en die OpenClaw opnieuw kan gebruiken voor latere bezorging, zelfs wanneer het actieve oppervlak anders is.

## Wijzigingen van sessiestatus

OpenClaw houdt een duurzaam signaallogboek bij van wezenlijke wijzigingen in de sessiestatus (rechtstreekse menselijke berichten aan bewaakte sessies, resultaten van onderliggende uitvoeringen, doelwijzigingen, Compaction). Rijen van `sessions_list` en `session_status` stellen de `stateVersion` van de sessie beschikbaar, en `session_status` accepteert `changesSince: <version>` om de getypeerde gebeurtenissen na die versie te retourneren, waarbij `historyGap` exact aangeeft wanneer de aangevraagde versie ouder is dan de bewaarde geschiedenis. Bewakers — automatisch bovenliggende agents bij het starten, expliciet via `sessions_send watch: true` — ontvangen één samengevoegde melding van verouderde status wanneer een andere actor een bewaakte sessie wijzigt.

Zie [Bewustzijn van sessiestatus](/concepts/session-state) voor het volledige model: soorten gebeurtenissen, registratie van bewakers, het antispamprotocol voor meldingen, de reconciliatiestroom en de huidige beperkingen.

`sessions_yield` beëindigt bewust de huidige beurt, zodat het volgende bericht de vervolggebeurtenis kan zijn waarop je wacht. Gebruik dit na het starten van sub-agents wanneer je wilt dat voltooiingsresultaten als het volgende bericht binnenkomen, in plaats van pollinglussen te bouwen.

`subagents` is de zichtbaarheidshulp voor reeds gestarte OpenClaw-sub-agents. Het ondersteunt `action: "list"` om actieve/recente uitvoeringen te inspecteren.

## Sub-agents starten

`sessions_spawn` maakt standaard een geïsoleerde sessie voor een achtergrondtaak. Het blokkeert nooit; het retourneert onmiddellijk met een `runId` en `childSessionKey`. Native sub-agentuitvoeringen ontvangen de gedelegeerde taak in het eerste zichtbare `[Subagent Task]`-bericht van de onderliggende sessie, terwijl de systeemprompt alleen runtimeregels voor sub-agents en routeringscontext bevat.

Belangrijkste opties:

- `runtime: "subagent"` (standaard) of `"acp"` voor agents van externe harnassen.
- Overschrijvingen voor `model` en `thinking` voor de onderliggende sessie.
- `thread: true` om het starten aan een chatthread te binden (Discord, Slack enzovoort).
- `sandbox: "require"` om sandboxing af te dwingen voor de onderliggende sessie.
- `context: "fork"` voor native sub-agents wanneer het onderliggende proces het transcript van de huidige aanvrager nodig heeft; laat dit weg of gebruik `context: "isolated"` voor een schoon onderliggend proces. `context: "fork"` is alleen geldig met `runtime: "subagent"`. Aan threads gebonden native sub-agents gebruiken standaard `context: "fork"`, tenzij `threadBindings.defaultSpawnContext` anders aangeeft.

Standaard krijgen sub-agents op het laagste niveau geen sessiehulpmiddelen. Wanneer `maxSpawnDepth >= 2`, ontvangen orkestrerende sub-agents op diepte 1 bovendien `sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze hun eigen onderliggende agents kunnen beheren. Uitvoeringen op het laagste niveau krijgen nog steeds geen hulpmiddelen voor recursieve orkestratie.

Na voltooiing plaatst een aankondigingsstap het resultaat in het kanaal van de aanvrager. De bezorging van de voltooiing behoudt waar mogelijk de routering van de gebonden thread/het gebonden onderwerp. Als de herkomst van de voltooiing alleen een kanaal identificeert, kan OpenClaw nog steeds de opgeslagen route van de sessie van de aanvrager (`lastChannel` / `lastTo`) opnieuw gebruiken voor rechtstreekse bezorging.

Zie [ACP-agents](/nl/tools/acp-agents) voor gedrag dat specifiek is voor ACP.

## Zichtbaarheid

Sessiehulpmiddelen zijn beperkt tot een scope om te begrenzen wat de agent kan zien:

| Niveau   | Scope                                    |
| -------- | ---------------------------------------- |
| `self`  | Alleen de huidige sessie                 |
| `tree`  | Huidige sessie + gestarte sub-agents     |
| `agent` | Alle sessies voor deze agent             |
| `all`   | Alle sessies (agentoverschrijdend indien geconfigureerd) |

De standaardwaarde is `tree`. Sessies in een sandbox worden ongeacht de configuratie beperkt tot `tree`.

## Verder lezen

- [Sessiebeheer](/nl/concepts/session): routering, levenscyclus, onderhoud
- [Subagenten](/nl/tools/subagents): levenscyclus en aflevering van onderliggende sessies
- [ACP-agenten](/nl/tools/acp-agents): starten via een externe harness
- [Multi-agent](/nl/concepts/multi-agent): multi-agentarchitectuur
- [Gateway-configuratie](/nl/gateway/configuration): configuratieopties voor sessietools

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessies opschonen](/nl/concepts/session-pruning)

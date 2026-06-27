---
read_when:
    - Je wilt begrijpen over welke sessietools de agent beschikt
    - Je wilt toegang tussen sessies of het starten van subagenten configureren
    - Je wilt de status van gestarte subagents inspecteren
summary: Agenttools voor sessie-overstijgende status, herinnering, berichten en subagentorkestratie
title: Sessietools
x-i18n:
    generated_at: "2026-06-27T17:29:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw geeft agents tools om over sessies heen te werken, status te inspecteren en
subagenten te orkestreren.

## Beschikbare tools

| Tool               | Wat het doet                                                                 |
| ------------------ | ---------------------------------------------------------------------------- |
| `sessions_list`    | Sessies weergeven met optionele filters (soort, label, agent, recentheid, voorbeeldweergave) |
| `sessions_history` | Het transcript van een specifieke sessie lezen                                |
| `sessions_send`    | Een bericht naar een andere sessie sturen en optioneel wachten                |
| `sessions_spawn`   | Een geïsoleerde subagentsessie starten voor achtergrondwerk                    |
| `sessions_yield`   | De huidige beurt beëindigen en wachten op vervolgresultaten van subagenten    |
| `subagents`        | De status van gestarte subagenten voor deze sessie weergeven                  |
| `session_status`   | Een kaart in `/status`-stijl tonen en optioneel een modelspecifieke overschrijving per sessie instellen |

Deze tools vallen nog steeds onder het actieve toolprofiel en het allow/deny-
beleid. `tools.profile: "coding"` bevat de volledige set voor sessieorkestratie,
inclusief `sessions_spawn`, `sessions_yield` en `subagents`.
`tools.profile: "messaging"` bevat tools voor berichten tussen sessies
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), maar
bevat geen mogelijkheid om subagenten te starten. Als je een messaging-profiel wilt behouden en toch
native delegatie wilt toestaan, voeg dan toe:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Groeps-, provider-, sandbox- en agentspecifiek beleid kan die tools nog steeds verwijderen
na de profielfase. Gebruik `/tools` vanuit de betreffende sessie om de
effectieve toollijst te inspecteren.

## Sessies weergeven en lezen

`sessions_list` retourneert sessies met hun sleutel, agentId, soort, kanaal, model,
tokentellingen en tijdstempels. Filter op soort (`main`, `group`, `cron`, `hook`,
`node`), exacte `label`, exacte `agentId`, zoektekst of recentheid
(`activeMinutes`). Wanneer je triage in mailboxstijl nodig hebt, kan het ook vragen om een
zichtbaarheidsgescopeerde afgeleide titel, een voorbeeldfragment van het laatste bericht of begrensde recente
berichten op elke rij. Afgeleide titels en voorbeelden worden alleen geproduceerd voor sessies
die de aanroeper al kan zien onder het geconfigureerde zichtbaarheidsbeleid voor sessietools, zodat
ongerelateerde sessies verborgen blijven. Wanneer zichtbaarheid beperkt is, retourneert `sessions_list`
optionele `visibility`-metadata die de effectieve modus toont en waarschuwt dat
resultaten mogelijk scopebeperkt zijn.

`sessions_history` haalt het gesprekstranscript op voor een specifieke sessie.
Standaard worden toolresultaten uitgesloten -- geef `includeTools: true` door om ze te zien.
De geretourneerde weergave is bewust begrensd en veiligheidsgefilterd:

- assistenttekst wordt genormaliseerd vóór herinnering:
  - thinking-tags worden verwijderd
  - scaffoldblokken van `<relevant-memories>` / `<relevant_memories>` worden verwijderd
  - XML-payloadblokken voor toolaanroepen in platte tekst, zoals `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` en
    `<function_calls>...</function_calls>`, worden verwijderd, inclusief afgekorte
    payloads die nooit netjes sluiten
  - gedegradeerde scaffolding voor toolaanroepen/resultaten, zoals `[Tool Call: ...]`,
    `[Tool Result ...]` en `[Historical context ...]`, wordt verwijderd
  - gelekte modelbesturingstokens, zoals `<|assistant|>`, andere ASCII-
    `<|...|>`-tokens en full-width varianten van `<｜...｜>`, worden verwijderd
  - misvormde MiniMax-toolaanroep-XML, zoals `<invoke ...>` /
    `</minimax:tool_call>`, wordt verwijderd
- tekst die lijkt op referenties/tokens wordt geredigeerd voordat deze wordt geretourneerd
- lange tekstblokken worden afgekort
- zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door
  `[sessions_history omitted: message too large]`
- de tool rapporteert samenvattingsvlaggen zoals `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` en `bytes`

Beide tools accepteren een **sessiesleutel** (zoals `"main"`) of een **sessie-ID**
uit een eerdere lijstaanroep.

Als je het exacte byte-voor-byte transcript nodig hebt, inspecteer dan het transcriptbestand op
schijf in plaats van `sessions_history` als ruwe dump te behandelen.

## Berichten tussen sessies sturen

`sessions_send` levert een bericht af bij een andere sessie en wacht optioneel op
het antwoord:

- **Versturen en vergeten:** stel `timeoutSeconds: 0` in om in de wachtrij te plaatsen en
  onmiddellijk terug te keren.
- **Wachten op antwoord:** stel een timeout in en ontvang het antwoord inline.

Thread-gescopeerde chatsessies, zoals Slack- of Discord-sleutels die eindigen op
`:thread:<id>`, zijn geen geldige doelen voor `sessions_send`. Gebruik de sessiesleutel van het bovenliggende kanaal
voor coördinatie tussen agents, zodat via tools gerouteerde berichten niet verschijnen
binnen een actieve mensgerichte thread.

Berichten en A2A-vervolgantwoorden worden gemarkeerd als intersessiegegevens in de
ontvangende prompt (`[Inter-session message ... isUser=false]`) en in transcript-
herkomst. De ontvangende agent moet ze behandelen als via tools gerouteerde gegevens, niet als een
directe instructie die door een eindgebruiker is geschreven.

Nadat het doel antwoordt, kan OpenClaw een **reply-back-lus** uitvoeren waarin de
agents om en om berichten sturen (tot `session.agentToAgent.maxPingPongTurns`, bereik
0-20, standaard 5). De doelagent kan antwoorden met
`REPLY_SKIP` om vroegtijdig te stoppen.

## Status- en orkestratiehelpers

`session_status` is de lichtgewicht `/status`-equivalente tool voor de huidige
of een andere zichtbare sessie. Deze rapporteert gebruik, tijd, model-/runtimestatus en
gekoppelde context voor achtergrondtaken wanneer aanwezig. Net als `/status` kan deze
schaarse token-/cachetellers aanvullen vanuit het nieuwste transcriptgebruik, en
`model=default` wist een modelspecifieke overschrijving per sessie. Gebruik `sessionKey="current"` voor
de huidige sessie van de aanroeper; zichtbare clientlabels zoals `openclaw-tui` zijn
geen sessiesleutels.

Wanneer routemetadata beschikbaar is, bevat `session_status` ook een zichtbaar
JSON-blok `Route context` en overeenkomende gestructureerde `details`-velden. Deze
velden maken onderscheid tussen de sessiesleutel en de route die momenteel
de live run afhandelt:

- `origin` is waar de sessie is aangemaakt, of de provider die is afgeleid uit een
  afleverbare sessiesleutelprefix wanneer oudere status opgeslagen oorsprongsmetadata mist.
- `active` is de huidige live-run-route. Deze wordt alleen gerapporteerd voor de live of
  huidige sessie die nu wordt afgehandeld.
- `deliveryContext` is de gepersisteerde afleverroute die op de sessie is opgeslagen,
  die OpenClaw kan hergebruiken voor latere aflevering, zelfs wanneer het actieve oppervlak
  verschilt.

`sessions_yield` beëindigt opzettelijk de huidige beurt, zodat het volgende bericht de
vervolggebeurtenis kan zijn waarop je wacht. Gebruik dit na het starten van subagenten wanneer
je voltooiingsresultaten als het volgende bericht wilt ontvangen in plaats van
poll-lussen te bouwen.

`subagents` is de zichtbaarheidshelper voor al gestarte OpenClaw-
subagenten. Deze ondersteunt `action: "list"` om actieve/recente runs te inspecteren.

## Subagenten starten

`sessions_spawn` maakt standaard een geïsoleerde sessie voor een achtergrondtaak.
Deze is altijd niet-blokkerend -- hij retourneert onmiddellijk met een `runId` en
`childSessionKey`. Native subagentruns ontvangen de gedelegeerde taak in het
eerste zichtbare `[Subagent Task]`-bericht van de child-sessie, terwijl de systeem-
prompt alleen runtime-regels en routeringscontext voor subagenten bevat.

Belangrijke opties:

- `runtime: "subagent"` (standaard) of `"acp"` voor externe harness-agents.
- `model`- en `thinking`-overschrijvingen voor de child-sessie.
- `thread: true` om de spawn aan een chatthread te binden (Discord, Slack, enz.).
- `sandbox: "require"` om sandboxing op de child af te dwingen.
- `context: "fork"` voor native subagenten wanneer de child het huidige
  requestertranscript nodig heeft; laat het weg of gebruik `context: "isolated"` voor een schone child.
  Thread-gebonden native subagenten gebruiken standaard `context: "fork"`, tenzij
  `threadBindings.defaultSpawnContext` anders aangeeft.

Standaard leaf-subagenten krijgen geen sessietools. Wanneer
`maxSpawnDepth >= 2`, ontvangen depth-1 orkestrator-subagenten daarnaast
`sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze
hun eigen children kunnen beheren. Leaf-runs krijgen nog steeds geen recursieve
orkestratietools.

Na voltooiing plaatst een aankondigingsstap het resultaat in het kanaal van de requester.
Voltooiingsaflevering behoudt gebonden thread-/topicroutering wanneer beschikbaar, en als
de voltooiingsoorsprong alleen een kanaal identificeert, kan OpenClaw nog steeds de
opgeslagen route (`lastChannel` / `lastTo`) van de requestersessie hergebruiken voor directe
aflevering.

Zie [ACP Agents](/nl/tools/acp-agents) voor ACP-specifiek gedrag.

## Zichtbaarheid

Sessietools zijn gescopeerd om te beperken wat de agent kan zien:

| Niveau  | Scope                                    |
| ------- | ---------------------------------------- |
| `self`  | Alleen de huidige sessie                 |
| `tree`  | Huidige sessie + gestarte subagenten     |
| `agent` | Alle sessies voor deze agent             |
| `all`   | Alle sessies (agentoverschrijdend indien geconfigureerd) |

Standaard is `tree`. Gesandboxte sessies worden vastgezet op `tree`, ongeacht de
configuratie.

## Verder lezen

- [Sessiebeheer](/nl/concepts/session) -- routering, levenscyclus, onderhoud
- [ACP Agents](/nl/tools/acp-agents) -- externe harness-spawning
- [Multi-agent](/nl/concepts/multi-agent) -- multi-agentarchitectuur
- [Gateway-configuratie](/nl/gateway/configuration) -- configuratieknoppen voor sessietools

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessie-opschoning](/nl/concepts/session-pruning)

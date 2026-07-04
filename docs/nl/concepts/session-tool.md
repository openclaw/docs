---
read_when:
    - Je wilt begrijpen welke sessietools de agent heeft
    - Je wilt sessie-overstijgende toegang of het starten van subagenten configureren
    - Je wilt de status van gestarte subagenten inspecteren
summary: Agenttools voor cross-sessiestatus, herinnering, berichten en sub-agentorkestratie
title: Sessiehulpmiddelen
x-i18n:
    generated_at: "2026-07-04T20:38:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw geeft agents tools om over sessies heen te werken, status te inspecteren en
subagents te orkestreren.

## Beschikbare tools

| Tool               | Wat het doet                                                               |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Sessies weergeven met optionele filters (soort, label, agent, archief, voorbeeldweergave) |
| `sessions_history` | Het transcript van een specifieke sessie lezen                             |
| `sessions_send`    | Een bericht naar een andere sessie sturen en optioneel wachten             |
| `sessions_spawn`   | Een geïsoleerde subagentsessie starten voor achtergrondwerk                |
| `sessions_yield`   | De huidige beurt beëindigen en wachten op vervolgresulaten van subagents   |
| `subagents`        | De status van gestarte subagents voor deze sessie weergeven                |
| `session_status`   | Een `/status`-achtige kaart tonen en optioneel een modelspecifieke overschrijving per sessie instellen |

Deze tools blijven onderhevig aan het actieve toolprofiel en het toestaan/weigeren-
beleid. `tools.profile: "coding"` bevat de volledige set voor sessieorkestratie,
inclusief `sessions_spawn`, `sessions_yield` en `subagents`.
`tools.profile: "messaging"` bevat messagingtools tussen sessies
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), maar
bevat geen starten van subagents. Voeg het volgende toe om een messagingprofiel
te behouden en toch native delegatie toe te staan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Groeps-, provider-, sandbox- en per-agentbeleid kunnen die tools na de
profielfase nog steeds verwijderen. Gebruik `/tools` vanuit de betreffende
sessie om de effectieve toollijst te inspecteren.

## Sessies weergeven en lezen

`sessions_list` retourneert sessies met hun sleutel, agentId, soort, kanaal, model,
tokentellingen en tijdstempels. Filter op soort (`main`, `group`, `cron`, `hook`,
`node`), exact `label`, exact `agentId`, zoektekst of recentheid
(`activeMinutes`). Actieve sessies worden standaard geretourneerd; geef
`archived: true` mee om gearchiveerde sessies te inspecteren. Rijen bevatten hun
vastgezette en gearchiveerde status. Wanneer je triage in mailboxstijl nodig hebt,
kan de tool ook vragen om een van zichtbaarheid afgeleide titel, een
voorbeeldfragment van het laatste bericht of begrensde recente berichten op elke rij.
Afgeleide titels en voorbeeldweergaven worden alleen geproduceerd voor sessies die
de aanroeper al mag zien onder het geconfigureerde zichtbaarheidsbeleid voor
sessietools, zodat niet-gerelateerde sessies verborgen blijven. Wanneer zichtbaarheid
beperkt is, retourneert `sessions_list` optionele `visibility`-metadata die de
effectieve modus tonen en een waarschuwing dat resultaten mogelijk in bereik beperkt zijn.

`sessions_history` haalt het gesprekstranscript op voor een specifieke sessie.
Standaard worden toolresultaten uitgesloten -- geef `includeTools: true` mee om ze
te zien. Gebruik `limit` voor de nieuwste begrensde staart. Geef `offset: 0` mee
wanneer je pagineringsmetadata nodig hebt, en geef daarna de geretourneerde
`nextOffset`-waarden mee om achteruit te bladeren door oudere
OpenClaw-transcriptvensters zonder ruwe transcriptbestanden te lezen.
Expliciete offsetpagina's voegen geen externe CLI-fallbackimports samen; gebruik
de standaardweergave met nieuwste staart wanneer je die samengevoegde
weergavegeschiedenis nodig hebt.
De geretourneerde weergave is bewust begrensd en veiligheidsgefilterd:

- assistenttekst wordt genormaliseerd vóór herinnering:
  - denktags worden verwijderd
  - `<relevant-memories>`- / `<relevant_memories>`-steigerblokken worden verwijderd
  - XML-payloadblokken voor toolaanroepen in platte tekst, zoals `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` en
    `<function_calls>...</function_calls>`, worden verwijderd, inclusief afgebroken
    payloads die nooit netjes sluiten
  - gedegradeerde steigertekst voor toolaanroepen/-resultaten zoals `[Tool Call: ...]`,
    `[Tool Result ...]` en `[Historical context ...]` wordt verwijderd
  - gelekte modelcontroletokens zoals `<|assistant|>`, andere ASCII-
    `<|...|>`-tokens en full-width `<｜...｜>`-varianten worden verwijderd
  - misvormde MiniMax-toolaanroep-XML zoals `<invoke ...>` /
    `</minimax:tool_call>` wordt verwijderd
- credential-/tokenachtige tekst wordt geredigeerd voordat die wordt geretourneerd
- lange tekstblokken worden afgekapt
- zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door
  `[sessions_history omitted: message too large]`
- de tool rapporteert samenvattingsvlaggen zoals `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` en pagineringsmetadata

Beide tools accepteren een **sessiesleutel** (zoals `"main"`) of een **sessie-ID**
uit een eerdere lijstaanroep.

Als je het exacte byte-voor-byte transcript nodig hebt, inspecteer dan het
transcriptbestand op schijf in plaats van `sessions_history` als ruwe dump te behandelen.

## Berichten tussen sessies verzenden

`sessions_send` levert een bericht af bij een andere sessie en wacht optioneel op
het antwoord:

- **Verzenden zonder te wachten:** stel `timeoutSeconds: 0` in om in de wachtrij te plaatsen en
  onmiddellijk terug te keren.
- **Wachten op antwoord:** stel een time-out in en ontvang het antwoord inline.

Threadgebonden chatsessies, zoals Slack- of Discord-sleutels die eindigen op
`:thread:<id>`, zijn geen geldige `sessions_send`-doelen. Gebruik de sessiesleutel
van het bovenliggende kanaal voor coördinatie tussen agents, zodat via tools gerouteerde
berichten niet verschijnen binnen een actieve mensgerichte thread.

Berichten en A2A-vervolgantwoorden worden gemarkeerd als gegevens tussen sessies in de
ontvangende prompt (`[Inter-session message ... isUser=false]`) en in de
transcriptherkomst. De ontvangende agent moet ze behandelen als via tools gerouteerde
gegevens, niet als een directe instructie die door een eindgebruiker is geschreven.

Nadat het doel antwoordt, kan OpenClaw een **antwoord-terug-lus** uitvoeren waarbij de
agents afwisselend berichten sturen (tot `session.agentToAgent.maxPingPongTurns`, bereik
0-20, standaard 5). De doelagent kan antwoorden met
`REPLY_SKIP` om vroegtijdig te stoppen.

## Status- en orkestratiehelpers

`session_status` is de lichte `/status`-equivalente tool voor de huidige of een
andere zichtbare sessie. De tool rapporteert gebruik, tijd, model-/runtimestatus en
gekoppelde achtergrondtaakcontext wanneer aanwezig. Net als `/status` kan de tool
schaarse token-/cachetellers aanvullen vanuit de nieuwste transcriptgebruiksvermelding, en
`model=default` wist een overschrijving per sessie. Gebruik `sessionKey="current"` voor
de huidige sessie van de aanroeper; zichtbare clientlabels zoals `openclaw-tui` zijn
geen sessiesleutels.

Wanneer routemetadata beschikbaar zijn, bevat `session_status` ook een zichtbaar
`Route context`-JSON-blok en overeenkomende gestructureerde `details`-velden. Deze
velden onderscheiden de sessiesleutel van de route die momenteel de live uitvoering
afhandelt:

- `origin` is waar de sessie is gemaakt, of de provider die is afgeleid uit een
  afleverbare sessiesleutelprefix wanneer oudere status geen opgeslagen oorsprongsmetadata heeft.
- `active` is de huidige live-uitvoeringsroute. Dit wordt alleen gerapporteerd voor de live of
  huidige sessie die nu wordt afgehandeld.
- `deliveryContext` is de persistente afleverroute die op de sessie is opgeslagen,
  die OpenClaw opnieuw kan gebruiken voor latere aflevering, zelfs wanneer het actieve oppervlak
  verschilt.

`sessions_yield` beëindigt bewust de huidige beurt zodat het volgende bericht de
vervolggebeurtenis kan zijn waarop je wacht. Gebruik dit na het starten van subagents
wanneer je wilt dat voltooiingsresultaten als het volgende bericht binnenkomen in plaats van
poll-lussen te bouwen.

`subagents` is de zichtbaarheidshelper voor al gestarte OpenClaw-
subagents. De tool ondersteunt `action: "list"` om actieve/recente uitvoeringen te inspecteren.

## Subagents starten

`sessions_spawn` maakt standaard een geïsoleerde sessie voor een achtergrondtaak.
De tool is altijd niet-blokkerend -- hij retourneert onmiddellijk met een `runId` en
`childSessionKey`. Native subagentuitvoeringen ontvangen de gedelegeerde taak in het
eerste zichtbare `[Subagent Task]`-bericht van de kindsessie, terwijl de systeemprompt
alleen runtime-regels voor subagents en routeringscontext bevat.

Belangrijke opties:

- `runtime: "subagent"` (standaard) of `"acp"` voor externe harnessagents.
- `model`- en `thinking`-overschrijvingen voor de kindsessie.
- `thread: true` om de spawn aan een chatthread te binden (Discord, Slack, enz.).
- `sandbox: "require"` om sandboxing op het kind af te dwingen.
- `context: "fork"` voor native subagents wanneer het kind het huidige
  aanvragerstranscript nodig heeft; laat dit weg of gebruik `context: "isolated"` voor een schoon kind.
  Threadgebonden native subagents gebruiken standaard `context: "fork"`, tenzij
  `threadBindings.defaultSpawnContext` anders aangeeft.

Standaard leaf-subagents krijgen geen sessietools. Wanneer
`maxSpawnDepth >= 2`, ontvangen depth-1-orkestrator-subagents daarnaast
`sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze
hun eigen kinderen kunnen beheren. Leaf-uitvoeringen krijgen nog steeds geen recursieve
orkestratietools.

Na voltooiing plaatst een aankondigingsstap het resultaat in het kanaal van de aanvrager.
Voltooiingsaflevering behoudt gebonden thread-/topicroutering wanneer beschikbaar, en als
de voltooiingsoorsprong alleen een kanaal identificeert, kan OpenClaw nog steeds de
opgeslagen route van de aanvragersessie (`lastChannel` / `lastTo`) opnieuw gebruiken voor directe
aflevering.

Zie [ACP Agents](/nl/tools/acp-agents) voor ACP-specifiek gedrag.

## Zichtbaarheid

Sessietools zijn begrensd om te beperken wat de agent kan zien:

| Niveau  | Bereik                                   |
| ------- | ---------------------------------------- |
| `self`  | Alleen de huidige sessie                 |
| `tree`  | Huidige sessie + gestarte subagents      |
| `agent` | Alle sessies voor deze agent             |
| `all`   | Alle sessies (over agents heen indien geconfigureerd) |

Standaard is `tree`. Gesandboxte sessies worden beperkt tot `tree`, ongeacht de
configuratie.

## Verder lezen

- [Sessiebeheer](/nl/concepts/session) -- routering, levenscyclus, onderhoud
- [ACP Agents](/nl/tools/acp-agents) -- externe harness-start
- [Multi-agent](/nl/concepts/multi-agent) -- multi-agentarchitectuur
- [Gateway-configuratie](/nl/gateway/configuration) -- configuratieknoppen voor sessietools

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessies opschonen](/nl/concepts/session-pruning)

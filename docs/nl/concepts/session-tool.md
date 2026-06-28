---
read_when:
    - Je wilt begrijpen welke sessietools de agent heeft
    - Je wilt sessie-overstijgende toegang of het starten van subagents configureren
    - Je wilt de status van voortgebrachte sub-agenten inspecteren
summary: Agenttools voor sessieoverstijgende status, herinnering, berichten en sub-agentorkestratie
title: Sessietools
x-i18n:
    generated_at: "2026-06-28T00:12:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffc7edf68e4510ea6a5fe93238be32e9d7eacf8e7b49e58f63536c14bbe2da80
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw geeft agents hulpmiddelen om over sessies heen te werken, status te inspecteren en
subagents te orkestreren.

## Beschikbare hulpmiddelen

| Hulpmiddel         | Wat het doet                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Sessies tonen met optionele filters (soort, label, agent, recentheid, voorbeeldweergave) |
| `sessions_history` | Het transcript van een specifieke sessie lezen                              |
| `sessions_send`    | Een bericht naar een andere sessie sturen en optioneel wachten              |
| `sessions_spawn`   | Een geïsoleerde subagentsessie starten voor achtergrondwerk                 |
| `sessions_yield`   | De huidige beurt beëindigen en wachten op vervolgresulaten van subagents    |
| `subagents`        | De status van gestarte subagents voor deze sessie tonen                     |
| `session_status`   | Een kaart in `/status`-stijl tonen en optioneel een modelspecifieke overschrijving per sessie instellen |

Deze hulpmiddelen vallen nog steeds onder het actieve hulpmiddelprofiel en het
toestaan/weigeren-beleid. `tools.profile: "coding"` bevat de volledige set voor
sessieorkestratie, inclusief `sessions_spawn`, `sessions_yield` en `subagents`.
`tools.profile: "messaging"` bevat hulpmiddelen voor berichten tussen sessies
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), maar
bevat geen starten van subagents. Om een berichtenprofiel te behouden en toch
native delegatie toe te staan, voeg je toe:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Groeps-, provider-, sandbox- en per-agentbeleid kunnen deze hulpmiddelen na de
profielfase nog steeds verwijderen. Gebruik `/tools` vanuit de betrokken sessie
om de effectieve hulpmiddelenlijst te inspecteren.

## Sessies tonen en lezen

`sessions_list` retourneert sessies met hun sleutel, agentId, soort, kanaal, model,
tokentellingen en tijdstempels. Filter op soort (`main`, `group`, `cron`, `hook`,
`node`), exacte `label`, exacte `agentId`, zoektekst of recentheid
(`activeMinutes`). Wanneer je mailboxachtige triage nodig hebt, kan het ook vragen
om een uit zichtbaarheid afgeleide titel, een voorbeeldfragment van het laatste
bericht of begrensde recente berichten per rij. Afgeleide titels en voorbeelden
worden alleen geproduceerd voor sessies die de aanroeper al kan zien onder het
geconfigureerde zichtbaarheidsbeleid voor sessiehulpmiddelen, zodat niet-gerelateerde
sessies verborgen blijven. Wanneer zichtbaarheid beperkt is, retourneert
`sessions_list` optionele `visibility`-metadata die de effectieve modus toont en
waarschuwt dat resultaten mogelijk tot de scope beperkt zijn.

`sessions_history` haalt het gesprekstranscript op voor een specifieke sessie.
Standaard worden hulpmiddelresultaten uitgesloten -- geef `includeTools: true` door
om ze te zien. Gebruik `limit` voor de nieuwste begrensde staart. Geef `offset: 0`
door wanneer je pagineringsmetadata nodig hebt, en geef daarna geretourneerde
`nextOffset`-waarden door om achteruit door oudere OpenClaw-transcriptvensters te
bladeren zonder ruwe transcriptbestanden te lezen. Expliciete offsetpagina's voegen
geen externe CLI-fallbackimports samen; gebruik de standaard nieuwste-staartweergave
wanneer je die samengevoegde weergavegeschiedenis nodig hebt.
De geretourneerde weergave is opzettelijk begrensd en veiligheidsgefilterd:

- assistenttekst wordt genormaliseerd vóór herinnering:
  - thinking-tags worden verwijderd
  - `<relevant-memories>`- / `<relevant_memories>`-scaffoldingblokken worden verwijderd
  - XML-payloadblokken voor tool-calls in platte tekst, zoals `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` en
    `<function_calls>...</function_calls>` worden verwijderd, inclusief afgekorte
    payloads die nooit netjes sluiten
  - gedegradeerde tool-call-/resultaat-scaffolding zoals `[Tool Call: ...]`,
    `[Tool Result ...]` en `[Historical context ...]` wordt verwijderd
  - gelekte modelbesturingstokens zoals `<|assistant|>`, andere ASCII
    `<|...|>`-tokens en varianten over de volle breedte `<｜...｜>` worden verwijderd
  - misvormde MiniMax-tool-call-XML zoals `<invoke ...>` /
    `</minimax:tool_call>` wordt verwijderd
- tekst die op referenties/tokens lijkt, wordt geredigeerd voordat deze wordt geretourneerd
- lange tekstblokken worden afgekapt
- zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door
  `[sessions_history omitted: message too large]`
- het hulpmiddel rapporteert samenvattingsvlaggen zoals `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` en pagineringsmetadata

Beide hulpmiddelen accepteren een **sessiesleutel** (zoals `"main"`) of een **sessie-ID**
uit een eerdere lijstaanroep.

Als je het exacte byte-voor-byte-transcript nodig hebt, inspecteer dan het transcriptbestand
op schijf in plaats van `sessions_history` als ruwe dump te behandelen.

## Berichten tussen sessies sturen

`sessions_send` levert een bericht af bij een andere sessie en wacht optioneel op
het antwoord:

- **Fire-and-forget:** stel `timeoutSeconds: 0` in om in de wachtrij te plaatsen en
  onmiddellijk terug te keren.
- **Wachten op antwoord:** stel een time-out in en ontvang het antwoord inline.

Thread-scoped chatsessies, zoals Slack- of Discord-sleutels die eindigen op
`:thread:<id>`, zijn geen geldige doelen voor `sessions_send`. Gebruik de
sessiesleutel van het bovenliggende kanaal voor coördinatie tussen agents, zodat
via hulpmiddelen gerouteerde berichten niet verschijnen in een actieve, op mensen
gerichte thread.

Berichten en A2A-vervolgantwoorden worden gemarkeerd als intersessiegegevens in de
ontvangende prompt (`[Inter-session message ... isUser=false]`) en in transcriptprovenance.
De ontvangende agent moet ze behandelen als via hulpmiddelen gerouteerde gegevens,
niet als een directe instructie die door een eindgebruiker is geschreven.

Nadat het doel heeft geantwoord, kan OpenClaw een **antwoord-terug-lus** uitvoeren
waarin de agents berichten afwisselen (tot `session.agentToAgent.maxPingPongTurns`,
bereik 0-20, standaard 5). De doelagent kan antwoorden met
`REPLY_SKIP` om vroegtijdig te stoppen.

## Status- en orkestratiehelpers

`session_status` is het lichte `/status`-equivalente hulpmiddel voor de huidige
of een andere zichtbare sessie. Het rapporteert gebruik, tijd, model-/runtimestatus
en gekoppelde achtergrondtaakcontext wanneer aanwezig. Net als `/status` kan het
schaarse token-/cachetellers aanvullen vanuit de nieuwste transcriptgebruiksvermelding,
en `model=default` wist een overschrijving per sessie. Gebruik `sessionKey="current"`
voor de huidige sessie van de aanroeper; zichtbare clientlabels zoals `openclaw-tui`
zijn geen sessiesleutels.

Wanneer routemetadata beschikbaar is, bevat `session_status` ook een zichtbaar
`Route context`-JSON-blok en overeenkomende gestructureerde `details`-velden. Deze
velden onderscheiden de sessiesleutel van de route die momenteel de live run afhandelt:

- `origin` is waar de sessie is gemaakt, of de provider die is afgeleid uit een
  afleverbare sessiesleutelprefix wanneer oudere status opgeslagen oorsprongsmetadata mist.
- `active` is de huidige live-runroute. Deze wordt alleen gerapporteerd voor de live of
  huidige sessie die nu wordt afgehandeld.
- `deliveryContext` is de opgeslagen afleverroute die op de sessie is vastgelegd,
  die OpenClaw kan hergebruiken voor latere aflevering, zelfs wanneer het actieve oppervlak
  verschilt.

`sessions_yield` beëindigt opzettelijk de huidige beurt, zodat het volgende bericht
de vervolggebeurtenis kan zijn waarop je wacht. Gebruik dit na het starten van subagents
wanneer je wilt dat voltooiingsresultaten als het volgende bericht binnenkomen in plaats
van poll-lussen te bouwen.

`subagents` is de zichtbaarheidshelper voor al gestarte OpenClaw-subagents.
Het ondersteunt `action: "list"` om actieve/recente runs te inspecteren.

## Subagents starten

`sessions_spawn` maakt standaard een geïsoleerde sessie voor een achtergrondtaak.
Het is altijd niet-blokkerend -- het retourneert onmiddellijk met een `runId` en
`childSessionKey`. Native subagent-runs ontvangen de gedelegeerde taak in het eerste
zichtbare `[Subagent Task]`-bericht van de kindsessie, terwijl de systeemprompt alleen
runtime-regels voor subagents en routeringscontext bevat.

Belangrijke opties:

- `runtime: "subagent"` (standaard) of `"acp"` voor externe harness-agents.
- `model`- en `thinking`-overschrijvingen voor de kindsessie.
- `thread: true` om de spawn aan een chatthread te binden (Discord, Slack, enzovoort).
- `sandbox: "require"` om sandboxing voor het kind af te dwingen.
- `context: "fork"` voor native subagents wanneer het kind het huidige
  aanvragerstranscript nodig heeft; laat dit weg of gebruik `context: "isolated"` voor een schoon kind.
  Thread-gebonden native subagents gebruiken standaard `context: "fork"`, tenzij
  `threadBindings.defaultSpawnContext` iets anders aangeeft.

Standaard leaf-subagents krijgen geen sessiehulpmiddelen. Wanneer
`maxSpawnDepth >= 2`, ontvangen orchestrator-subagents op diepte 1 bovendien
`sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze
hun eigen kinderen kunnen beheren. Leaf-runs krijgen nog steeds geen recursieve
orkestratiehulpmiddelen.

Na voltooiing plaatst een aankondigingsstap het resultaat in het kanaal van de aanvrager.
Voltooiingsaflevering behoudt gebonden thread-/topicroutering wanneer beschikbaar, en als
de voltooiingsoorsprong alleen een kanaal identificeert, kan OpenClaw nog steeds de opgeslagen
route van de aanvragersessie (`lastChannel` / `lastTo`) hergebruiken voor directe aflevering.

Voor ACP-specifiek gedrag, zie [ACP Agents](/nl/tools/acp-agents).

## Zichtbaarheid

Sessiehulpmiddelen zijn gescoped om te beperken wat de agent kan zien:

| Niveau  | Scope                                    |
| ------- | ---------------------------------------- |
| `self`  | Alleen de huidige sessie                 |
| `tree`  | Huidige sessie + gestarte subagents      |
| `agent` | Alle sessies voor deze agent             |
| `all`   | Alle sessies (cross-agent indien geconfigureerd) |

Standaard is `tree`. Gesandboxte sessies worden beperkt tot `tree`, ongeacht de
configuratie.

## Verder lezen

- [Sessiebeheer](/nl/concepts/session) -- routering, lifecycle, onderhoud
- [ACP Agents](/nl/tools/acp-agents) -- externe harness-spawning
- [Multi-agent](/nl/concepts/multi-agent) -- multi-agentarchitectuur
- [Gateway-configuratie](/nl/gateway/configuration) -- configuratieknoppen voor sessiehulpmiddelen

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiesnoeiing](/nl/concepts/session-pruning)

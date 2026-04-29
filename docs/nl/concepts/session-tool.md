---
read_when:
    - Je wilt begrijpen over welke sessietools de agent beschikt
    - Je wilt sessieoverschrijdende toegang of het starten van sub-agenten configureren
    - Je wilt de status bekijken of gestarte subagenten beheren
summary: Agenttools voor sessieoverstijgende status, herinnering, berichtenuitwisseling en orkestratie van sub-agenten
title: Sessietools
x-i18n:
    generated_at: "2026-04-29T22:41:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw geeft agenten hulpmiddelen om sessies heen te werken, status te inspecteren en subagenten te orkestreren.

## Beschikbare hulpmiddelen

| Hulpmiddel         | Wat het doet                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Sessies weergeven met optionele filters (soort, label, agent, recentheid, voorbeeld) |
| `sessions_history` | Het transcript van een specifieke sessie lezen                              |
| `sessions_send`    | Een bericht naar een andere sessie sturen en optioneel wachten              |
| `sessions_spawn`   | Een geïsoleerde subagentsessie starten voor achtergrondwerk                 |
| `sessions_yield`   | De huidige beurt beëindigen en wachten op vervolgresultaten van subagenten  |
| `subagents`        | Gestarte subagenten voor deze sessie weergeven, bijsturen of stoppen        |
| `session_status`   | Een kaart in `/status`-stijl tonen en optioneel een modelspecifieke overschrijving per sessie instellen |

Deze hulpmiddelen blijven onderworpen aan het actieve hulpmiddelenprofiel en het toestaan/weigeren-beleid. `tools.profile: "coding"` bevat de volledige set voor sessieorkestratie, inclusief `sessions_spawn`, `sessions_yield` en `subagents`.
`tools.profile: "messaging"` bevat hulpmiddelen voor berichten tussen sessies (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), maar bevat geen mogelijkheid om subagenten te starten. Voeg het volgende toe om een berichtenprofiel te behouden en toch native delegatie toe te staan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Groeps-, provider-, sandbox- en per-agentbeleid kunnen die hulpmiddelen na de profielfase nog steeds verwijderen. Gebruik `/tools` vanuit de betrokken sessie om de effectieve lijst met hulpmiddelen te inspecteren.

## Sessies weergeven en lezen

`sessions_list` retourneert sessies met hun sleutel, agentId, soort, kanaal, model, tokentellingen en tijdstempels. Filter op soort (`main`, `group`, `cron`, `hook`, `node`), exacte `label`, exacte `agentId`, zoektekst of recentheid (`activeMinutes`). Wanneer je triage in mailboxstijl nodig hebt, kan het ook vragen om een zichtbaarheidsgescopeerde afgeleide titel, een voorbeeldfragment van het laatste bericht of begrensde recente berichten op elke rij. Afgeleide titels en voorbeelden worden alleen geproduceerd voor sessies die de aanroeper al kan zien onder het geconfigureerde zichtbaarheidsbeleid voor sessiehulpmiddelen, zodat ongerelateerde sessies verborgen blijven.

`sessions_history` haalt het gesprekstranscript op voor een specifieke sessie. Standaard worden hulpmiddelresultaten uitgesloten -- geef `includeTools: true` door om ze te zien. De geretourneerde weergave is bewust begrensd en veiligheidsgefilterd:

- assistenttekst wordt vóór het terughalen genormaliseerd:
  - denktags worden verwijderd
  - `<relevant-memories>` / `<relevant_memories>`-scaffoldingblokken worden verwijderd
  - plattetekstblokken met XML-payloads voor hulpmiddelaanroepen, zoals `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` en `<function_calls>...</function_calls>`, worden verwijderd, inclusief afgekorte payloads die nooit netjes sluiten
  - gedegradeerde scaffolding voor hulpmiddelaanroepen/-resultaten, zoals `[Tool Call: ...]`, `[Tool Result ...]` en `[Historical context ...]`, wordt verwijderd
  - gelekte modelbesturingstokens zoals `<|assistant|>`, andere ASCII-tokens `<|...|>` en full-widthvarianten `<｜...｜>` worden verwijderd
  - misvormde MiniMax-XML voor hulpmiddelaanroepen, zoals `<invoke ...>` / `</minimax:tool_call>`, wordt verwijderd
- tekst die op inloggegevens/tokens lijkt, wordt geredigeerd voordat deze wordt geretourneerd
- lange tekstblokken worden afgekapt
- zeer grote geschiedenissen kunnen oudere rijen laten vervallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`
- het hulpmiddel rapporteert samenvattingsvlaggen zoals `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted` en `bytes`

Beide hulpmiddelen accepteren een **sessiesleutel** (zoals `"main"`) of een **sessie-ID** uit een eerdere lijstaanroep.

Als je het exacte byte-voor-byte transcript nodig hebt, inspecteer dan het transcriptbestand op schijf in plaats van `sessions_history` als ruwe dump te behandelen.

## Berichten tussen sessies sturen

`sessions_send` levert een bericht af bij een andere sessie en wacht optioneel op het antwoord:

- **Versturen zonder wachten:** stel `timeoutSeconds: 0` in om in de wachtrij te plaatsen en direct terug te keren.
- **Wachten op antwoord:** stel een time-out in en ontvang het antwoord inline.

Berichten en A2A-vervolgantwoorden worden gemarkeerd als gegevens tussen sessies in de ontvangende prompt (`[Inter-session message ... isUser=false]`) en in transcriptprovenance. De ontvangende agent moet ze behandelen als door hulpmiddelen gerouteerde gegevens, niet als een directe instructie die door de eindgebruiker is geschreven.

Nadat het doel heeft geantwoord, kan OpenClaw een **terugantwoordlus** uitvoeren waarin de agenten afwisselend berichten sturen (maximaal 5 beurten). De doelagent kan antwoorden met `REPLY_SKIP` om vroegtijdig te stoppen.

## Status- en orkestratiehulpen

`session_status` is het lichtgewicht hulpmiddel equivalent aan `/status` voor de huidige of een andere zichtbare sessie. Het rapporteert gebruik, tijd, model-/runtime-status en gekoppelde context voor achtergrondtaken wanneer aanwezig. Net als `/status` kan het schaarse token-/cachetellers aanvullen vanuit de nieuwste gebruiksvermelding in het transcript, en `model=default` wist een overschrijving per sessie. Gebruik `sessionKey="current"` voor de huidige sessie van de aanroeper; zichtbare clientlabels zoals `openclaw-tui` zijn geen sessiesleutels.

`sessions_yield` beëindigt bewust de huidige beurt, zodat het volgende bericht de vervolggebeurtenis kan zijn waarop je wacht. Gebruik dit na het starten van subagenten wanneer je wilt dat voltooiingsresultaten als het volgende bericht binnenkomen in plaats van pollinglussen te bouwen.

`subagents` is de besturingsvlak-helper voor al gestarte OpenClaw-subagenten. Het ondersteunt:

- `action: "list"` om actieve/recente uitvoeringen te inspecteren
- `action: "steer"` om vervolgbegeleiding naar een draaiend kind te sturen
- `action: "kill"` om één kind of `all` te stoppen

## Subagenten starten

`sessions_spawn` maakt standaard een geïsoleerde sessie voor een achtergrondtaak. Het is altijd niet-blokkerend -- het retourneert direct met een `runId` en `childSessionKey`.

Belangrijke opties:

- `runtime: "subagent"` (standaard) of `"acp"` voor externe harness-agenten.
- `model`- en `thinking`-overschrijvingen voor de kindsessie.
- `thread: true` om de start aan een chatthread te binden (Discord, Slack, enz.).
- `sandbox: "require"` om sandboxing voor het kind af te dwingen.
- `context: "fork"` voor native subagenten wanneer het kind het huidige aanvragerstranscript nodig heeft; laat dit weg of gebruik `context: "isolated"` voor een schoon kind.

Standaard krijgen leaf-subagenten geen sessiehulpmiddelen. Wanneer `maxSpawnDepth >= 2`, ontvangen orchestrator-subagenten op diepte 1 bovendien `sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze hun eigen kinderen kunnen beheren. Leaf-uitvoeringen krijgen nog steeds geen recursieve orkestratiehulpmiddelen.

Na voltooiing plaatst een aankondigingsstap het resultaat in het kanaal van de aanvrager. Aflevering van voltooiing behoudt gebonden thread-/topicroutering wanneer beschikbaar, en als de voltooiingsoorsprong alleen een kanaal identificeert, kan OpenClaw nog steeds de opgeslagen route van de aanvragersessie (`lastChannel` / `lastTo`) hergebruiken voor directe aflevering.

Zie [ACP-agenten](/nl/tools/acp-agents) voor ACP-specifiek gedrag.

## Zichtbaarheid

Sessiehulpmiddelen zijn gescopeerd om te beperken wat de agent kan zien:

| Niveau  | Scope                                    |
| ------- | ---------------------------------------- |
| `self`  | Alleen de huidige sessie                 |
| `tree`  | Huidige sessie + gestarte subagenten     |
| `agent` | Alle sessies voor deze agent             |
| `all`   | Alle sessies (agentoverschrijdend indien geconfigureerd) |

Standaard is `tree`. Gesandboxte sessies worden begrensd tot `tree`, ongeacht de configuratie.

## Verder lezen

- [Sessiebeheer](/nl/concepts/session) -- routering, levenscyclus, onderhoud
- [ACP-agenten](/nl/tools/acp-agents) -- externe harness-start
- [Multi-agent](/nl/concepts/multi-agent) -- multi-agentarchitectuur
- [Gateway-configuratie](/nl/gateway/configuration) -- configuratieknoppen voor sessiehulpmiddelen

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessie-opschoning](/nl/concepts/session-pruning)

---
read_when:
    - Je wilt begrijpen welke sessietools de agent heeft
    - U wilt sessie-overstijgende toegang of het starten van subagents configureren
    - Je wilt de status inspecteren of gestarte subagenten beheren
summary: Agenttools voor sessieoverstijgende status, het terughalen van informatie, berichtenuitwisseling en subagentorkestratie
title: Sessietools
x-i18n:
    generated_at: "2026-05-02T11:14:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb8a3ab7fd1036ccd97940fc9824684d7b27ded0136f6a69416eb144bbfc64be
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw geeft agents tools om tussen sessies te werken, status te inspecteren en
subagents te orkestreren.

## Beschikbare tools

| Tool               | Wat het doet                                                               |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Sessies weergeven met optionele filters (soort, label, agent, recentheid, preview) |
| `sessions_history` | Het transcript van een specifieke sessie lezen                             |
| `sessions_send`    | Een bericht naar een andere sessie sturen en optioneel wachten             |
| `sessions_spawn`   | Een geisoleerde subagentsessie starten voor achtergrondwerk                |
| `sessions_yield`   | De huidige beurt beeindigen en wachten op vervolgresultaten van subagents  |
| `subagents`        | Gestarte subagents voor deze sessie weergeven, bijsturen of stoppen        |
| `session_status`   | Een kaart in `/status`-stijl tonen en optioneel een modelspecifieke override per sessie instellen |

Deze tools vallen nog steeds onder het actieve toolprofiel en het toestaan/weigeren-
beleid. `tools.profile: "coding"` bevat de volledige set voor sessie-orkestratie,
inclusief `sessions_spawn`, `sessions_yield` en `subagents`.
`tools.profile: "messaging"` bevat tools voor berichten tussen sessies
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), maar
bevat geen starten van subagents. Voeg het volgende toe om een messaging-profiel te behouden en toch
native delegatie toe te staan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Groeps-, provider-, sandbox- en per-agentbeleid kunnen die tools na de
profielstap nog steeds verwijderen. Gebruik `/tools` vanuit de betrokken sessie
om de effectieve toollijst te inspecteren.

## Sessies weergeven en lezen

`sessions_list` retourneert sessies met hun key, agentId, soort, kanaal, model,
tokentellingen en tijdstempels. Filter op soort (`main`, `group`, `cron`, `hook`,
`node`), exacte `label`, exacte `agentId`, zoektekst of recentheid
(`activeMinutes`). Wanneer je mailboxachtige triage nodig hebt, kan het ook vragen om een
zichtbaarheidsgebonden afgeleide titel, een previewfragment van het laatste bericht of begrensde
recente berichten voor elke rij. Afgeleide titels en previews worden alleen gemaakt voor
sessies die de aanroeper al kan zien volgens het geconfigureerde zichtbaarheidbeleid voor sessietools,
zodat niet-gerelateerde sessies verborgen blijven.

`sessions_history` haalt het conversatietranscript op voor een specifieke sessie.
Standaard worden toolresultaten uitgesloten -- geef `includeTools: true` door om ze te zien.
De geretourneerde weergave is bewust begrensd en op veiligheid gefilterd:

- assistenttekst wordt genormaliseerd voordat deze wordt opgehaald:
  - thinking-tags worden verwijderd
  - `<relevant-memories>` / `<relevant_memories>`-scaffoldingblokken worden verwijderd
  - tool-call-XML-payloadblokken in platte tekst, zoals `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` en
    `<function_calls>...</function_calls>` worden verwijderd, inclusief afgekorte
    payloads die nooit netjes sluiten
  - gedegradeerde tool-call/result-scaffolding zoals `[Tool Call: ...]`,
    `[Tool Result ...]` en `[Historical context ...]` wordt verwijderd
  - gelekte modelcontroletokens zoals `<|assistant|>`, andere ASCII-
    `<|...|>`-tokens en full-width `<｜...｜>`-varianten worden verwijderd
  - ongeldige MiniMax-tool-call-XML zoals `<invoke ...>` /
    `</minimax:tool_call>` wordt verwijderd
- tekst die op inloggegevens/tokens lijkt, wordt geredigeerd voordat die wordt geretourneerd
- lange tekstblokken worden afgekapt
- zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door
  `[sessions_history omitted: message too large]`
- de tool rapporteert samenvattingsvlaggen zoals `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` en `bytes`

Beide tools accepteren een **session key** (zoals `"main"`) of een **sessie-ID**
uit een eerdere lijstaanroep.

Als je het exacte byte-voor-byte transcript nodig hebt, inspecteer dan het transcriptbestand op
schijf in plaats van `sessions_history` als ruwe dump te behandelen.

## Berichten tussen sessies sturen

`sessions_send` levert een bericht af bij een andere sessie en wacht optioneel op
het antwoord:

- **Fire-and-forget:** stel `timeoutSeconds: 0` in om in de wachtrij te plaatsen en
  direct terug te keren.
- **Wachten op antwoord:** stel een timeout in en krijg het antwoord inline.

Thread-gebonden chatsessies, zoals Slack- of Discord-keys die eindigen op
`:thread:<id>`, zijn geen geldige doelen voor `sessions_send`. Gebruik de key van de bovenliggende
kanaalsessie voor coordinatie tussen agents, zodat via tools gerouteerde berichten niet verschijnen
in een actieve mensgerichte thread.

Berichten en A2A-vervolgantwoorden worden gemarkeerd als intersessiegegevens in de
ontvangende prompt (`[Inter-session message ... isUser=false]`) en in transcript-
provenance. De ontvangende agent moet ze behandelen als via tools gerouteerde gegevens, niet als een
directe instructie die door de eindgebruiker is geschreven.

Nadat het doel heeft gereageerd, kan OpenClaw een **reply-back-loop** uitvoeren waarbij de
agents beurtelings berichten sturen (tot 5 beurten). De doelagent kan antwoorden met
`REPLY_SKIP` om vroegtijdig te stoppen.

## Status- en orkestratiehelpers

`session_status` is de lichtgewicht `/status`-equivalente tool voor de huidige
of een andere zichtbare sessie. De tool rapporteert gebruik, tijd, model-/runtimestatus en
gekoppelde context voor achtergrondtaken wanneer aanwezig. Net als `/status` kan de tool
schaarse token-/cachetellers aanvullen vanuit de nieuwste transcriptgebruikentry, en
`model=default` wist een override per sessie. Gebruik `sessionKey="current"` voor
de huidige sessie van de aanroeper; zichtbare clientlabels zoals `openclaw-tui` zijn
geen sessiekeys.

`sessions_yield` beeindigt bewust de huidige beurt, zodat het volgende bericht de
vervolgevent kan zijn waarop je wacht. Gebruik dit na het starten van subagents wanneer
je wilt dat voltooiingsresultaten als het volgende bericht aankomen in plaats van
poll-lussen te bouwen.

`subagents` is de control-plane-helper voor reeds gestarte OpenClaw-
subagents. Deze ondersteunt:

- `action: "list"` om actieve/recente runs te inspecteren
- `action: "steer"` om vervolginstructies naar een draaiend kind te sturen
- `action: "kill"` om een kind of `all` te stoppen

## Subagents starten

`sessions_spawn` maakt standaard een geisoleerde sessie voor een achtergrondtaak.
De tool is altijd niet-blokkerend -- hij retourneert direct met een `runId` en
`childSessionKey`.

Belangrijke opties:

- `runtime: "subagent"` (standaard) of `"acp"` voor externe harness-agents.
- `model`- en `thinking`-overrides voor de kindsessie.
- `thread: true` om de spawn aan een chatthread te binden (Discord, Slack, enzovoort).
- `sandbox: "require"` om sandboxing voor het kind af te dwingen.
- `context: "fork"` voor native subagents wanneer het kind het huidige
  aanvraagtranscript nodig heeft; laat dit weg of gebruik `context: "isolated"` voor een schoon kind.
  Thread-gebonden native subagents gebruiken standaard `context: "fork"` tenzij
  `threadBindings.defaultSpawnContext` anders aangeeft.

Standaard leaf-subagents krijgen geen sessietools. Wanneer
`maxSpawnDepth >= 2`, ontvangen diepte-1-orkestrator-subagents daarnaast
`sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze
hun eigen kinderen kunnen beheren. Leaf-runs krijgen nog steeds geen recursieve
orkestratietools.

Na voltooiing plaatst een aankondigingsstap het resultaat in het kanaal van de aanvrager.
Voltooiingslevering behoudt gebonden thread-/topic-routing wanneer beschikbaar, en als
de voltooiingsoorsprong alleen een kanaal identificeert, kan OpenClaw nog steeds de
opgeslagen route (`lastChannel` / `lastTo`) van de aanvraagsessie opnieuw gebruiken voor directe
levering.

Zie [ACP Agents](/nl/tools/acp-agents) voor ACP-specifiek gedrag.

## Zichtbaarheid

Sessietools zijn scoped om te beperken wat de agent kan zien:

| Niveau  | Scope                                    |
| ------- | ---------------------------------------- |
| `self`  | Alleen de huidige sessie                 |
| `tree`  | Huidige sessie + gestarte subagents      |
| `agent` | Alle sessies voor deze agent             |
| `all`   | Alle sessies (cross-agent indien geconfigureerd) |

Standaard is `tree`. Gesandboxte sessies worden tot `tree` begrensd, ongeacht
de configuratie.

## Verder lezen

- [Sessiebeheer](/nl/concepts/session) -- routing, lifecycle, onderhoud
- [ACP Agents](/nl/tools/acp-agents) -- starten van externe harnesses
- [Multi-agent](/nl/concepts/multi-agent) -- multi-agentarchitectuur
- [Gateway-configuratie](/nl/gateway/configuration) -- configuratieknoppen voor sessietools

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiepruning](/nl/concepts/session-pruning)

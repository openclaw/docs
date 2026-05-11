---
read_when:
    - Je wilt begrijpen welke sessietools de agent heeft
    - Je wilt sessieoverschrijdende toegang of het starten van subagenten configureren
    - Je wilt de status bekijken of gestarte subagenten beheren
summary: Agenttools voor sessie-overstijgende status, geheugenoproep, berichtenuitwisseling en orchestratie van subagents
title: Sessietools
x-i18n:
    generated_at: "2026-05-11T20:28:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e91f1f956ff882cabf7df51bd8c08836398decfb185c56c42db4052f24b3f716
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw geeft agents tools om tussen sessies te werken, status te inspecteren en
sub-agents te orkestreren.

## Beschikbare tools

| Tool               | Wat deze doet                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Sessies weergeven met optionele filters (soort, label, agent, recentheid, voorbeeld) |
| `sessions_history` | Het transcript van een specifieke sessie lezen                             |
| `sessions_send`    | Een bericht naar een andere sessie sturen en optioneel wachten             |
| `sessions_spawn`   | Een geïsoleerde sub-agent-sessie starten voor achtergrondwerk              |
| `sessions_yield`   | De huidige beurt beëindigen en wachten op vervolgresulaten van sub-agents  |
| `subagents`        | Gestarte sub-agents voor deze sessie weergeven, bijsturen of stoppen       |
| `session_status`   | Een kaart in `/status`-stijl tonen en optioneel een modelspecifieke override per sessie instellen |

Deze tools blijven onderworpen aan het actieve toolprofiel en het toestaan/weigeren-beleid. `tools.profile: "coding"` bevat de volledige set voor sessieorkestratie, inclusief `sessions_spawn`, `sessions_yield` en `subagents`. `tools.profile: "messaging"` bevat tools voor berichten tussen sessies (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), maar bevat geen spawning van sub-agents. Voeg dit toe om een messaging-profiel te behouden en toch native delegatie toe te staan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Groeps-, provider-, sandbox- en per-agent-beleid kunnen die tools na de profielfase nog steeds verwijderen. Gebruik `/tools` vanuit de betrokken sessie om de effectieve toollijst te inspecteren.

## Sessies weergeven en lezen

`sessions_list` retourneert sessies met hun sleutel, agentId, soort, kanaal, model, tokenaantallen en tijdstempels. Filter op soort (`main`, `group`, `cron`, `hook`, `node`), exact `label`, exact `agentId`, zoektekst of recentheid (`activeMinutes`). Wanneer je mailboxachtige triage nodig hebt, kan het ook vragen om een zichtbaarheidsgebonden afgeleide titel, een voorbeeldfragment van het laatste bericht of begrensde recente berichten op elke rij. Afgeleide titels en voorbeelden worden alleen geproduceerd voor sessies die de aanroeper al kan zien onder het geconfigureerde zichtbaarheidsbeleid voor sessietools, zodat niet-gerelateerde sessies verborgen blijven.

`sessions_history` haalt het gesprekstranscript op voor een specifieke sessie. Standaard worden toolresultaten uitgesloten -- geef `includeTools: true` door om ze te zien. De geretourneerde weergave is bewust begrensd en veiligheid-gefilterd:

- assistenttekst wordt vóór herinnering genormaliseerd:
  - thinking-tags worden verwijderd
  - `<relevant-memories>` / `<relevant_memories>`-scaffoldingblokken worden verwijderd
  - XML-payloadblokken van tool-calls in platte tekst, zoals `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` en
    `<function_calls>...</function_calls>`, worden verwijderd, inclusief afgebroken
    payloads die nooit netjes sluiten
  - gedegradeerde tool-call/result-scaffolding zoals `[Tool Call: ...]`,
    `[Tool Result ...]` en `[Historical context ...]` wordt verwijderd
  - gelekte modelbesturingstokens zoals `<|assistant|>`, andere ASCII
    `<|...|>`-tokens en full-width `<｜...｜>`-varianten worden verwijderd
  - misvormde MiniMax-tool-call-XML zoals `<invoke ...>` /
    `</minimax:tool_call>` wordt verwijderd
- credential-/tokenachtige tekst wordt geredigeerd voordat deze wordt geretourneerd
- lange tekstblokken worden afgekapt
- zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door
  `[sessions_history omitted: message too large]`
- de tool rapporteert samenvattingsvlaggen zoals `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` en `bytes`

Beide tools accepteren een **sessiesleutel** (zoals `"main"`) of een **sessie-ID** uit een eerdere list-aanroep.

Als je het exacte byte-voor-byte transcript nodig hebt, inspecteer dan het transcriptbestand op schijf in plaats van `sessions_history` als een ruwe dump te behandelen.

## Berichten tussen sessies sturen

`sessions_send` levert een bericht af bij een andere sessie en wacht optioneel op het antwoord:

- **Fire-and-forget:** stel `timeoutSeconds: 0` in om in de wachtrij te zetten en
  onmiddellijk terug te keren.
- **Wachten op antwoord:** stel een timeout in en ontvang het antwoord inline.

Threadgebonden chatsessies, zoals Slack- of Discord-sleutels die eindigen op
`:thread:<id>`, zijn geen geldige `sessions_send`-doelen. Gebruik de sessiesleutel van het bovenliggende kanaal voor coördinatie tussen agents, zodat via tools gerouteerde berichten niet binnen een actieve mensgerichte thread verschijnen.

Berichten en A2A-vervolgantwoorden worden in de ontvangende prompt (`[Inter-session message ... isUser=false]`) en in transcriptprovenance gemarkeerd als intersessiedata. De ontvangende agent moet ze behandelen als via tools gerouteerde data, niet als een directe instructie die door een eindgebruiker is geschreven.

Nadat het doel antwoordt, kan OpenClaw een **reply-back loop** uitvoeren waarin de agents om de beurt berichten sturen (tot `session.agentToAgent.maxPingPongTurns`, bereik 0-20, standaard 5). De doelagent kan antwoorden met `REPLY_SKIP` om vroegtijdig te stoppen.

## Status- en orkestratiehelpers

`session_status` is de lichte `/status`-equivalente tool voor de huidige of een andere zichtbare sessie. Deze rapporteert gebruik, tijd, model-/runtime-status en gekoppelde achtergrondtaakcontext wanneer aanwezig. Net als `/status` kan deze schaarse token-/cachetellers aanvullen vanuit de nieuwste transcriptgebruikvermelding, en `model=default` wist een override per sessie. Gebruik `sessionKey="current"` voor de huidige sessie van de aanroeper; zichtbare clientlabels zoals `openclaw-tui` zijn geen sessiesleutels.

`sessions_yield` beëindigt bewust de huidige beurt zodat het volgende bericht het vervolgevent kan zijn waarop je wacht. Gebruik dit na het starten van sub-agents wanneer je wilt dat voltooiingsresultaten als het volgende bericht binnenkomen in plaats van poll-loops te bouwen.

`subagents` is de control-plane-helper voor al gestarte OpenClaw-sub-agents. Deze ondersteunt:

- `action: "list"` om actieve/recente runs te inspecteren
- `action: "steer"` om vervolgrichtlijnen naar een draaiend child te sturen
- `action: "kill"` om één child of `all` te stoppen

## Sub-agents starten

`sessions_spawn` maakt standaard een geïsoleerde sessie voor een achtergrondtaak. Dit is altijd niet-blokkerend -- het retourneert onmiddellijk met een `runId` en `childSessionKey`.

Belangrijke opties:

- `runtime: "subagent"` (standaard) of `"acp"` voor externe harness-agents.
- `model`- en `thinking`-overrides voor de child-sessie.
- `thread: true` om de spawn aan een chatthread te binden (Discord, Slack, enzovoort).
- `sandbox: "require"` om sandboxing op het child af te dwingen.
- `context: "fork"` voor native sub-agents wanneer het child het huidige
  requester-transcript nodig heeft; laat dit weg of gebruik `context: "isolated"` voor een schoon child.
  Threadgebonden native sub-agents gebruiken standaard `context: "fork"`, tenzij
  `threadBindings.defaultSpawnContext` anders aangeeft.

Standaard leaf-sub-agents krijgen geen sessietools. Wanneer
`maxSpawnDepth >= 2`, krijgen depth-1 orchestrator-sub-agents daarnaast
`sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze
hun eigen children kunnen beheren. Leaf-runs krijgen nog steeds geen recursieve
orkestratietools.

Na voltooiing plaatst een aankondigingsstap het resultaat in het kanaal van de requester.
Voltooiingslevering behoudt gebonden thread-/topic-routering wanneer beschikbaar, en als
de voltooiingsoorsprong alleen een kanaal identificeert, kan OpenClaw nog steeds de
opgeslagen route van de requester-sessie (`lastChannel` / `lastTo`) hergebruiken voor directe
levering.

Zie [ACP Agents](/nl/tools/acp-agents) voor ACP-specifiek gedrag.

## Zichtbaarheid

Sessietools zijn afgebakend om te beperken wat de agent kan zien:

| Niveau  | Bereik                                   |
| ------- | ---------------------------------------- |
| `self`  | Alleen de huidige sessie                 |
| `tree`  | Huidige sessie + gestarte sub-agents     |
| `agent` | Alle sessies voor deze agent             |
| `all`   | Alle sessies (cross-agent indien geconfigureerd) |

Standaard is `tree`. Sandboxsessies worden begrensd tot `tree`, ongeacht de configuratie.

## Verder lezen

- [Sessiebeheer](/nl/concepts/session) -- routering, levenscyclus, onderhoud
- [ACP Agents](/nl/tools/acp-agents) -- spawning van externe harnesses
- [Multi-agent](/nl/concepts/multi-agent) -- multi-agent-architectuur
- [Gateway-configuratie](/nl/gateway/configuration) -- configuratieknoppen voor sessietools

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessie-opschoning](/nl/concepts/session-pruning)

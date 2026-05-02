---
read_when:
    - Je hebt een exacte stapsgewijze uitleg van de agentlus of levenscyclusgebeurtenissen nodig
    - Je wijzigt wachtrijvorming voor sessies, transcript-schrijfbewerkingen of het gedrag van de schrijfvergrendeling voor sessies
summary: Levenscyclus van de agentlus, streams en wachtsemantiek
title: Agentlus
x-i18n:
    generated_at: "2026-05-02T20:42:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Een agentische loop is de volledige “echte” uitvoering van een agent: invoer → contextopbouw → modelinferentie →
tooluitvoering → streaming-antwoorden → persistentie. Het is het gezaghebbende pad dat een bericht
omzet in acties en een definitief antwoord, terwijl de sessiestatus consistent blijft.

In OpenClaw is een loop een enkele, geserialiseerde uitvoering per sessie die lifecycle- en streamevents uitzendt
terwijl het model nadenkt, tools aanroept en uitvoer streamt. Dit document legt uit hoe die authentieke loop
end-to-end is bedraad.

## Invoerpunten

- Gateway RPC: `agent` en `agent.wait`.
- CLI: opdracht `agent`.

## Hoe het werkt (op hoog niveau)

1. `agent` RPC valideert parameters, lost de sessie op (sessionKey/sessionId), bewaart sessiemetadata en retourneert onmiddellijk `{ runId, acceptedAt }`.
2. `agentCommand` voert de agent uit:
   - lost standaardwaarden voor model + thinking/verbose/trace op
   - laadt Skills-snapshot
   - roept `runEmbeddedPiAgent` aan (pi-agent-core runtime)
   - zendt **lifecycle end/error** uit als de embedded loop er geen uitzendt
3. `runEmbeddedPiAgent`:
   - serialiseert uitvoeringen via per-sessie- en globale wachtrijen
   - lost model + auth-profiel op en bouwt de pi-sessie
   - abonneert zich op pi-events en streamt assistant/tool-delta’s
   - handhaaft timeout -> breekt uitvoering af als die wordt overschreden
   - breekt voor Codex app-server-beurten een geaccepteerde beurt af die stopt met het produceren van app-server-voortgang vóór een terminaal event
   - retourneert payloads + gebruiksmetadata
4. `subscribeEmbeddedPiSession` overbrugt pi-agent-core-events naar de OpenClaw `agent`-stream:
   - tool-events => `stream: "tool"`
   - assistant-delta’s => `stream: "assistant"`
   - lifecycle-events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` gebruikt `waitForAgentRun`:
   - wacht op **lifecycle end/error** voor `runId`
   - retourneert `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Wachtrijen + gelijktijdigheid

- Uitvoeringen worden geserialiseerd per sessiesleutel (sessielane) en optioneel via een globale lane.
- Dit voorkomt tool-/sessieraces en houdt de sessiegeschiedenis consistent.
- Berichtkanalen kunnen wachtrijmodi kiezen (collect/steer/followup) die dit lanesysteem voeden.
  Zie [Opdrachtwachtrij](/nl/concepts/queue).
- Transcriptwrites worden ook beschermd door een sessiewritelock op het sessiebestand. De lock is
  procesbewust en bestandsgebaseerd, zodat hij schrijvers opvangt die de in-process-wachtrij omzeilen of uit
  een ander proces komen. Sessietranscriptschrijvers wachten maximaal `session.writeLock.acquireTimeoutMs`
  voordat ze de sessie als bezet rapporteren; de standaardwaarde is `60000` ms.
- Sessiewritelocks zijn standaard niet-herintredend. Als een helper bewust het verkrijgen van
  dezelfde lock nest terwijl één logische schrijver behouden blijft, moet die expliciet inschrijven met
  `allowReentrant: true`.

## Sessie- + workspace-voorbereiding

- Workspace wordt opgelost en aangemaakt; sandboxed uitvoeringen kunnen omleiden naar een sandbox-workspaceroot.
- Skills worden geladen (of hergebruikt vanuit een snapshot) en geïnjecteerd in env en prompt.
- Bootstrap-/contextbestanden worden opgelost en geïnjecteerd in het systeempromptrapport.
- Een sessiewritelock wordt verkregen; `SessionManager` wordt geopend en voorbereid vóór streaming. Elk
  later transcript-herschrijf-, Compaction- of truncatiepad moet dezelfde lock nemen voordat het transcriptbestand wordt geopend of
  gewijzigd.

## Promptopbouw + systeemprompt

- De systeemprompt wordt gebouwd uit OpenClaw’s basisprompt, Skills-prompt, bootstrapcontext en per-uitvoering-overrides.
- Modelspecifieke limieten en Compaction-reservetokens worden gehandhaafd.
- Zie [Systeemprompt](/nl/concepts/system-prompt) voor wat het model ziet.

## Hookpunten (waar je kunt onderscheppen)

OpenClaw heeft twee hooksystemen:

- **Interne hooks** (Gateway-hooks): eventgedreven scripts voor opdrachten en lifecycle-events.
- **Plugin-hooks**: uitbreidingspunten binnen de agent-/tool-lifecycle en Gateway-pijplijn.

### Interne hooks (Gateway-hooks)

- **`agent:bootstrap`**: draait tijdens het bouwen van bootstrapbestanden voordat de systeemprompt definitief wordt gemaakt.
  Gebruik dit om bootstrapcontextbestanden toe te voegen of te verwijderen.
- **Opdrachthooks**: `/new`, `/reset`, `/stop` en andere opdrachtevents (zie Hooks-document).

Zie [Hooks](/nl/automation/hooks) voor configuratie en voorbeelden.

### Plugin-hooks (agent- + gateway-lifecycle)

Deze draaien binnen de agentloop of Gateway-pijplijn:

- **`before_model_resolve`**: draait pre-sessie (geen `messages`) om provider/model deterministisch te overschrijven vóór modelresolutie.
- **`before_prompt_build`**: draait na sessieladen (met `messages`) om `prependContext`, `systemPrompt`, `prependSystemContext` of `appendSystemContext` te injecteren vóór promptverzending. Gebruik `prependContext` voor dynamische tekst per beurt en systeemcontextvelden voor stabiele richtlijnen die in systeempromptruimte moeten staan.
- **`before_agent_start`**: legacy compatibiliteitshook die in beide fasen kan draaien; geef de voorkeur aan de expliciete hooks hierboven.
- **`before_agent_reply`**: draait na inline-acties en vóór de LLM-aanroep, zodat een plugin de beurt kan claimen en een synthetisch antwoord kan retourneren of de beurt volledig kan dempen.
- **`agent_end`**: inspecteer de definitieve berichtenlijst en uitvoeringsmetadata na voltooiing.
- **`before_compaction` / `after_compaction`**: observeer of annoteer Compaction-cycli.
- **`before_tool_call` / `after_tool_call`**: onderschep toolparameters/-resultaten.
- **`before_install`**: inspecteer ingebouwde scanbevindingen en blokkeer optioneel skill- of plugin-installaties.
- **`tool_result_persist`**: transformeer toolresultaten synchroon voordat ze naar een sessietranscript in eigendom van OpenClaw worden geschreven.
- **`message_received` / `message_sending` / `message_sent`**: inkomende + uitgaande berichthooks.
- **`session_start` / `session_end`**: sessie-lifecyclegrenzen.
- **`gateway_start` / `gateway_stop`**: Gateway-lifecycle-events.

Beslissingsregels voor hooks voor uitgaande/toolguards:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkering niet.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkering niet.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de hook-API en registratiedetails.

Harnesses kunnen deze hooks anders aanpassen. De Codex app-server-harness houdt
OpenClaw Plugin-hooks aan als compatibiliteitscontract voor gedocumenteerde gespiegeld
oppervlakken, terwijl native Codex-hooks een afzonderlijk lager-niveau Codex-mechanisme blijven.

## Streaming + gedeeltelijke antwoorden

- Assistant-delta’s worden vanuit pi-agent-core gestreamd en uitgezonden als `assistant`-events.
- Blokstreaming kan gedeeltelijke antwoorden uitzenden op `text_end` of `message_end`.
- Reasoning-streaming kan worden uitgezonden als een afzonderlijke stream of als blokantwoorden.
- Zie [Streaming](/nl/concepts/streaming) voor chunking en gedrag van blokantwoorden.

## Tooluitvoering + berichtentools

- Tool start/update/end-events worden uitgezonden op de `tool`-stream.
- Toolresultaten worden gesaneerd op grootte en afbeeldingspayloads voordat ze worden gelogd/uitgezonden.
- Verzendingen via berichtentools worden gevolgd om dubbele assistant-bevestigingen te onderdrukken.

## Antwoordvorming + onderdrukking

- Definitieve payloads worden samengesteld uit:
  - assistant-tekst (en optioneel reasoning)
  - inline toolsamenvattingen (wanneer verbose + toegestaan)
  - assistant-fouttekst wanneer het model een fout geeft
- De exacte stille token `NO_REPLY` / `no_reply` wordt gefilterd uit uitgaande
  payloads.
- Duplicaten van berichtentools worden verwijderd uit de definitieve payloadlijst.
- Als er geen renderbare payloads overblijven en een tool een fout gaf, wordt een fallback-toolfoutantwoord uitgezonden
  (tenzij een berichtentool al een voor de gebruiker zichtbaar antwoord heeft verzonden).

## Compaction + nieuwe pogingen

- Auto-Compaction zendt `compaction`-streamevents uit en kan een nieuwe poging triggeren.
- Bij een nieuwe poging worden in-memory buffers en toolsamenvattingen gereset om dubbele uitvoer te voorkomen.
- Zie [Compaction](/nl/concepts/compaction) voor de Compaction-pijplijn.

## Eventstreams (vandaag)

- `lifecycle`: uitgezonden door `subscribeEmbeddedPiSession` (en als fallback door `agentCommand`)
- `assistant`: gestreamde delta’s van pi-agent-core
- `tool`: gestreamde tool-events van pi-agent-core

## Chatkanaalafhandeling

- Assistant-delta’s worden gebufferd in chat-`delta`-berichten.
- Een chat-`final` wordt uitgezonden bij **lifecycle end/error**.

## Timeouts

- `agent.wait` standaard: 30s (alleen het wachten). Parameter `timeoutMs` overschrijft dit.
- Agent-runtime: `agents.defaults.timeoutSeconds` standaard 172800s (48 uur); gehandhaafd in de aborttimer van `runEmbeddedPiAgent`.
- Cron-runtime: geïsoleerde agent-turn `timeoutSeconds` is eigendom van Cron. De scheduler start die timer wanneer uitvoering begint, breekt de onderliggende uitvoering af op de geconfigureerde deadline en voert daarna begrensde opschoning uit voordat de timeout wordt vastgelegd, zodat een verouderde child-sessie de lane niet vast kan houden.
- Sessielivenessdiagnostiek: met diagnostiek ingeschakeld classificeert `diagnostics.stuckSessionWarnMs` langdurige `processing`-sessies zonder waargenomen antwoord, tool, status, blok of ACP-voortgang. Actieve embedded uitvoeringen, modelaanroepen en toolaanroepen rapporteren als `session.long_running`; actief werk zonder recente voortgang rapporteert als `session.stalled`; `session.stuck` is gereserveerd voor verouderde sessieboekhouding zonder actief werk, en alleen dat pad geeft de getroffen sessielane vrij zodat opstartwerk in de wachtrij kan leeglopen. Herhaalde `session.stuck`-diagnostiek past back-off toe zolang de sessie ongewijzigd blijft.
- Model-idletimeout: OpenClaw breekt een modelverzoek af wanneer er geen responsechunks arriveren vóór het idle-venster. `models.providers.<id>.timeoutSeconds` verlengt deze idle-watchdog voor trage lokale/zelfgehoste providers; anders gebruikt OpenClaw `agents.defaults.timeoutSeconds` wanneer geconfigureerd, standaard afgetopt op 120s. Door Cron getriggerde uitvoeringen zonder expliciete model- of agenttimeout schakelen de idle-watchdog uit en vertrouwen op de buitenste Cron-timeout.
- Provider-HTTP-aanvraagtimeout: `models.providers.<id>.timeoutSeconds` is van toepassing op de model-HTTP-fetches van die provider, inclusief connect, headers, body, SDK-aanvraagtimeout, totale guarded-fetch-abortafhandeling en modelstream-idle-watchdog. Gebruik dit voor trage lokale/zelfgehoste providers zoals Ollama voordat je de volledige agent-runtime-timeout verhoogt.

## Waar dingen vroegtijdig kunnen eindigen

- Agenttimeout (abort)
- AbortSignal (annuleren)
- Gateway-verbinding verbroken of RPC-timeout
- `agent.wait`-timeout (alleen wachten, stopt de agent niet)

## Gerelateerd

- [Tools](/nl/tools) — beschikbare agenttools
- [Hooks](/nl/automation/hooks) — eventgedreven scripts getriggerd door agent-lifecycle-events
- [Compaction](/nl/concepts/compaction) — hoe lange gesprekken worden samengevat
- [Exec Approvals](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Thinking](/nl/tools/thinking) — configuratie van denk-/reasoningniveau

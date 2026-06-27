---
read_when:
    - U hebt een exacte walkthrough van de agentlus of lifecyclegebeurtenissen nodig
    - Je wijzigt sessie-wachtrijen, transcript-schrijfbewerkingen of het gedrag van sessie-schrijfvergrendeling
summary: Levenscyclus van de agentlus, streams en wachtsemantiek
title: Agentlus
x-i18n:
    generated_at: "2026-06-27T17:24:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Een agentische loop is de volledige "echte" run van een agent: intake → contextassemblage → modelinferentie →
tooluitvoering → streamende antwoorden → persistentie. Het is het gezaghebbende pad dat een bericht
omzet in acties en een definitief antwoord, terwijl de sessiestatus consistent blijft.

In OpenClaw is een loop een enkele, geserialiseerde run per sessie die lifecycle- en streamevents uitzendt
terwijl het model nadenkt, tools aanroept en uitvoer streamt. Dit document legt uit hoe die authentieke loop
end-to-end is bedraad.

## Invoerpunten

- Gateway-RPC: `agent` en `agent.wait`.
- CLI: `agent`-commando.

## Hoe het werkt (op hoofdlijnen)

1. `agent`-RPC valideert parameters, resolveert de sessie (sessionKey/sessionId), bewaart sessiemetadata en retourneert onmiddellijk `{ runId, acceptedAt }`.
2. `agentCommand` voert de agent uit:
   - resolveert model + standaardwaarden voor denken/uitgebreid/trace
   - laadt Skills-snapshot
   - roept `runEmbeddedAgent` aan (OpenClaw-agentruntime)
   - zendt **lifecycle end/error** uit als de embedded loop er zelf geen uitzendt
3. `runEmbeddedAgent`:
   - serialiseert runs via per-sessie- en globale wachtrijen
   - resolveert model + auth-profiel en bouwt de OpenClaw-sessie
   - abonneert zich op runtime-events en streamt assistant/tool-delta's
   - dwingt timeout af -> breekt de run af als die wordt overschreden
   - breekt voor Codex app-server-beurten een geaccepteerde beurt af die geen app-servervoortgang meer produceert vóór een terminaal event
   - retourneert payloads + gebruiksmetadata
4. `subscribeEmbeddedAgentSession` overbrugt agentruntime-events naar de OpenClaw-`agent`-stream:
   - tool-events => `stream: "tool"`
   - assistant-delta's => `stream: "assistant"`
   - lifecycle-events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` gebruikt `waitForAgentRun`:
   - wacht op **lifecycle end/error** voor `runId`
   - retourneert `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Wachtrijen + gelijktijdigheid

- Runs worden geserialiseerd per sessiesleutel (sessielane) en optioneel via een globale lane.
- Dit voorkomt tool-/sessieraces en houdt sessiegeschiedenis consistent.
- Berichtkanalen kunnen wachtrijmodi kiezen (steer/followup/collect/interrupt) die dit lanesysteem voeden.
  Zie [Commandowachtrij](/nl/concepts/queue).
- Transcript-schrijfacties worden ook beschermd door een sessie-schrijflock op het sessiebestand. De lock is
  procesbewust en bestandsgebaseerd, zodat die schrijvers detecteert die de in-process-wachtrij omzeilen of uit
  een ander proces komen. Sessietranscriptschrijvers wachten maximaal `session.writeLock.acquireTimeoutMs`
  voordat ze de sessie als bezet rapporteren; de standaardwaarde is `60000` ms.
- Sessie-schrijflocks zijn standaard niet-reentrant. Als een helper bewust het verkrijgen van
  dezelfde lock nest terwijl één logische schrijver behouden blijft, moet die expliciet kiezen voor
  `allowReentrant: true`.

## Sessie- + workspacevoorbereiding

- Workspace wordt geresolved en aangemaakt; gesandboxte runs kunnen omleiden naar een sandbox-workspaceroot.
- Skills worden geladen (of hergebruikt uit een snapshot) en geïnjecteerd in env en prompt.
- Bootstrap-/contextbestanden worden geresolved en geïnjecteerd in het systeemprompt-rapport.
- Een sessie-schrijflock wordt verkregen; `SessionManager` wordt geopend en voorbereid vóór het streamen. Elk
  later pad voor transcriptherschrijving, Compaction of truncatie moet dezelfde lock nemen voordat het
  transcriptbestand wordt geopend of gewijzigd.

## Promptassemblage + systeemprompt

- De systeemprompt wordt opgebouwd uit de basisprompt van OpenClaw, Skills-prompt, bootstrapcontext en per-run-overrides.
- Modelspecifieke limieten en gereserveerde tokens voor Compaction worden afgedwongen.
- Zie [Systeemprompt](/nl/concepts/system-prompt) voor wat het model ziet.

## Haakpunten (waar je kunt ingrijpen)

OpenClaw heeft twee hooksystemen:

- **Interne haakpunten** (Gateway-haakpunten): eventgestuurde scripts voor commando's en lifecycle-events.
- **Plugin-haakpunten**: uitbreidingspunten binnen de lifecycle van agent/tools en de gateway-pipeline.

### Interne haakpunten (Gateway-haakpunten)

- **`agent:bootstrap`**: draait tijdens het bouwen van bootstrapbestanden voordat de systeemprompt definitief wordt gemaakt.
  Gebruik dit om bootstrapcontextbestanden toe te voegen of te verwijderen.
- **Commandohaakpunten**: `/new`, `/reset`, `/stop` en andere commando-events (zie Hooks-document).

Zie [Haakpunten](/nl/automation/hooks) voor configuratie en voorbeelden.

### Plugin-haakpunten (agent- + gateway-lifecycle)

Deze draaien binnen de agentloop of gateway-pipeline:

- **`before_model_resolve`**: draait pre-sessie (geen `messages`) om provider/model deterministisch te overschrijven vóór modelresolutie.
- **`before_prompt_build`**: draait na sessielading (met `messages`) om `prependContext`, `systemPrompt`, `prependSystemContext` of `appendSystemContext` te injecteren vóór promptinzending. Gebruik `prependContext` voor dynamische tekst per beurt en system-contextvelden voor stabiele sturing die in de systeemprompt-ruimte hoort te staan.
- **`before_agent_start`**: legacy-compatibiliteitshaakpunt dat in beide fasen kan draaien; geef de voorkeur aan de expliciete haakpunten hierboven.
- **`before_agent_reply`**: draait na inline acties en vóór de LLM-aanroep, zodat een Plugin de beurt kan claimen en een synthetisch antwoord kan retourneren of de beurt volledig kan dempen.
- **`agent_end`**: inspecteer de uiteindelijke berichtenlijst en runmetadata na voltooiing.
- **`before_compaction` / `after_compaction`**: observeer of annoteer Compaction-cycli.
- **`before_tool_call` / `after_tool_call`**: onderschep toolparameters/-resultaten.
- **`before_install`**: inspecteer gestaged installatiemateriaal voor Skills of Plugin nadat het installatiebeleid van de operator is uitgevoerd, wanneer Plugin-haakpunten in het huidige OpenClaw-proces zijn geladen.
- **`tool_result_persist`**: transformeer toolresultaten synchroon voordat ze naar een door OpenClaw beheerd sessietranscript worden geschreven.
- **`message_received` / `message_sending` / `message_sent`**: haakpunten voor inkomende + uitgaande berichten.
- **`session_start` / `session_end`**: grenzen van de sessielifecycle.
- **`gateway_start` / `gateway_stop`**: gateway-lifecycle-events.

Beslisregels voor haakpunten bij uitgaande berichten/tool-guards:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- Gebruik `security.installPolicy`, niet `before_install`, voor door de operator beheerde installatiebeslissingen voor toestaan/blokkeren die CLI-installatie- en updatepaden moeten dekken.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` is een no-op en wist geen eerdere annulering.

Zie [Plugin-haakpunten](/nl/plugins/hooks) voor de hook-API en registratiedetails.

Harnesses kunnen deze haakpunten anders aanpassen. De Codex app-server-harness behoudt
OpenClaw Plugin-haakpunten als het compatibiliteitscontract voor gedocumenteerde gespiegelde
oppervlakken, terwijl Codex-native haakpunten een afzonderlijk lager niveau Codex-mechanisme blijven.

## Streaming + gedeeltelijke antwoorden

- Assistant-delta's worden vanuit de agentruntime gestreamd en als `assistant`-events uitgezonden.
- Blokstreaming kan gedeeltelijke antwoorden uitzenden op `text_end` of `message_end`.
- Reasoning-streaming kan worden uitgezonden als een afzonderlijke stream of als blokantwoorden.
- Zie [Streaming](/nl/concepts/streaming) voor chunking en gedrag van blokantwoorden.

## Tooluitvoering + berichtentools

- Tool-start/update/end-events worden uitgezonden op de `tool`-stream.
- Toolresultaten worden gesaneerd voor grootte en afbeeldingspayloads voordat ze worden gelogd/uitgezonden.
- Verzendingen via berichtentools worden bijgehouden om dubbele assistant-bevestigingen te onderdrukken.

## Antwoordvorming + onderdrukking

- Definitieve payloads worden samengesteld uit:
  - assistant-tekst (en optionele reasoning)
  - inline toolsamenvattingen (wanneer uitgebreid + toegestaan)
  - assistant-fouttekst wanneer het model een fout geeft
- Het exacte stille token `NO_REPLY` / `no_reply` wordt uit uitgaande
  payloads gefilterd.
- Duplicaten van berichtentools worden uit de definitieve payloadlijst verwijderd.
- Als er geen renderbare payloads overblijven en een tool een fout gaf, wordt een fallback-toolfoutantwoord uitgezonden
  (tenzij een berichtentool al een voor de gebruiker zichtbaar antwoord heeft verzonden).

## Compaction + nieuwe pogingen

- Auto-Compaction zendt `compaction`-streamevents uit en kan een nieuwe poging triggeren.
- Bij een nieuwe poging worden in-memory buffers en toolsamenvattingen gereset om dubbele uitvoer te voorkomen.
- Zie [Compaction](/nl/concepts/compaction) voor de Compaction-pipeline.

## Eventstreams (vandaag)

- `lifecycle`: uitgezonden door `subscribeEmbeddedAgentSession` (en als fallback door `agentCommand`)
- `assistant`: gestreamde delta's vanuit de agentruntime
- `tool`: gestreamde tool-events vanuit de agentruntime

## Afhandeling van chatkanalen

- Assistant-delta's worden gebufferd in chat-`delta`-berichten.
- Een chat-`final` wordt uitgezonden bij **lifecycle end/error**.

## Timeouts

- `agent.wait` standaard: 30 s (alleen het wachten). `timeoutMs`-parameter overschrijft dit.
- Agentruntime: `agents.defaults.timeoutSeconds` standaard 172800 s (48 uur); afgedwongen in de afbreektimer van `runEmbeddedAgent`.
- Cron-runtime: geïsoleerde agentbeurt-`timeoutSeconds` is eigendom van Cron. De scheduler start die timer wanneer uitvoering begint, breekt de onderliggende run af op de geconfigureerde deadline en voert daarna begrensde opschoning uit voordat de timeout wordt geregistreerd, zodat een verouderde childsessie de lane niet vast kan houden.
- Diagnostiek voor sessie-liveness: met diagnostiek ingeschakeld classificeert `diagnostics.stuckSessionWarnMs` lange `processing`-sessies zonder waargenomen antwoord-, tool-, status-, blok- of ACP-voortgang. Actieve embedded runs, modelaanroepen en toolaanroepen worden gerapporteerd als `session.long_running`; eigen stille modelaanroepen blijven ook `session.long_running` tot `diagnostics.stuckSessionAbortMs`, zodat trage of niet-streamende providers niet te vroeg als vastgelopen worden gerapporteerd. Actief werk zonder recente voortgang wordt gerapporteerd als `session.stalled`; eigen modelaanroepen schakelen over naar `session.stalled` op of na de afbreekdrempel, en eigenaarloze verouderde model-/toolactiviteit wordt niet verborgen als long-running. `session.stuck` is gereserveerd voor herstelbare verouderde sessieboekhouding, inclusief inactieve wachtrijsessies met verouderde eigenaarloze model-/toolactiviteit. Verouderde sessieboekhouding geeft de betrokken sessielane onmiddellijk vrij nadat herstelgates slagen; vastgelopen embedded runs worden pas abort-drained na `diagnostics.stuckSessionAbortMs` (standaard: minstens 5 minuten en 3x de waarschuwingsdrempel), zodat werk in de wachtrij kan worden hervat zonder alleen maar trage runs af te kappen. Herstel zendt gestructureerde aangevraagde/voltooide uitkomsten uit, en diagnostische status wordt alleen als idle gemarkeerd als dezelfde verwerkingsgeneratie nog actueel is. Herhaalde `session.stuck`-diagnostiek past backoff toe zolang de sessie ongewijzigd blijft.
- Model-idle-timeout: OpenClaw breekt een modelrequest af wanneer er geen responschunks binnenkomen vóór het idle-venster. `models.providers.<id>.timeoutSeconds` verlengt deze idle-watchdog voor trage lokale/zelfgehoste providers, maar wordt nog steeds begrensd door een lagere `agents.defaults.timeoutSeconds` of run-specifieke timeout, omdat die de volledige agentrun beheren. Anders gebruikt OpenClaw `agents.defaults.timeoutSeconds` wanneer geconfigureerd, standaard afgetopt op 120 s. Door Cron getriggerde cloudmodelruns zonder expliciete model- of agenttimeout gebruiken dezelfde standaard idle-watchdog; met een expliciete cron-run-timeout worden vastlopende cloudmodelstreams afgetopt op 60 s, zodat geconfigureerde modelfallbacks kunnen draaien vóór de buitenste cron-deadline. Door Cron getriggerde lokale of zelfgehoste modelruns schakelen de impliciete watchdog uit tenzij een expliciete timeout is geconfigureerd, en expliciete cron-run-timeouts blijven het idle-venster voor lokale/zelfgehoste providers, dus trage lokale providers moeten `models.providers.<id>.timeoutSeconds` instellen.
- HTTP-requesttimeout van provider: `models.providers.<id>.timeoutSeconds` geldt voor de model-HTTP-fetches van die provider, inclusief connect, headers, body, SDK-requesttimeout, totale guarded-fetch-afbreekafhandeling en idle-watchdog voor modelstreams. Gebruik dit voor trage lokale/zelfgehoste providers zoals Ollama voordat je de volledige agentruntime-timeout verhoogt, en houd de agent-/runtime-timeout minstens even hoog wanneer het modelrequest langer moet kunnen draaien.

## Waar dingen vroeg kunnen eindigen

- Agent-time-out (afbreken)
- AbortSignal (annuleren)
- Gateway-verbinding verbroken of RPC-time-out
- `agent.wait`-time-out (alleen wachten, stopt de agent niet)

## Gerelateerd

- [Tools](/nl/tools) — beschikbare agenttools
- [Hooks](/nl/automation/hooks) — gebeurtenisgestuurde scripts die worden geactiveerd door levenscyclusgebeurtenissen van agents
- [Compaction](/nl/concepts/compaction) — hoe lange gesprekken worden samengevat
- [Exec Approvals](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Thinking](/nl/tools/thinking) — configuratie van denk-/redeneerniveau

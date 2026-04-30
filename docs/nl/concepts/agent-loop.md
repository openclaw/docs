---
read_when:
    - Je hebt een nauwkeurige stapsgewijze uitleg van de agentlus of levenscyclusgebeurtenissen nodig
    - U wijzigt sessiewachtrijen, transcript-schrijfbewerkingen of het gedrag van de schrijflock voor sessies.
summary: Levenscyclus van de agentlus, stromen en wachtsemantiek
title: Agentlus
x-i18n:
    generated_at: "2026-04-30T18:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

Een agentische loop is de volledige “echte” uitvoering van een agent: intake → contextassemblage → modelinferentie →
tooluitvoering → streamingantwoorden → persistentie. Het is het gezaghebbende pad dat een bericht
omzet in acties en een definitief antwoord, terwijl de sessiestatus consistent blijft.

In OpenClaw is een loop een enkele, geserialiseerde uitvoering per sessie die lifecycle- en stream-events uitzendt
terwijl het model denkt, tools aanroept en uitvoer streamt. Dit document legt uit hoe die authentieke loop
end-to-end is bedraad.

## Ingangspunten

- Gateway-RPC: `agent` en `agent.wait`.
- CLI: opdracht `agent`.

## Hoe het werkt (op hoog niveau)

1. `agent`-RPC valideert parameters, lost de sessie op (sessionKey/sessionId), bewaart sessiemetadata en retourneert meteen `{ runId, acceptedAt }`.
2. `agentCommand` voert de agent uit:
   - lost model- en thinking/verbose/trace-standaardwaarden op
   - laadt Skills-snapshot
   - roept `runEmbeddedPiAgent` aan (pi-agent-core runtime)
   - zendt **lifecycle end/error** uit als de embedded loop er geen uitzendt
3. `runEmbeddedPiAgent`:
   - serialiseert uitvoeringen via wachtrijen per sessie en globale wachtrijen
   - lost model en auth-profiel op en bouwt de Pi-sessie
   - abonneert zich op Pi-events en streamt assistant/tool-delta’s
   - dwingt timeout af -> breekt uitvoering af als deze wordt overschreden
   - breekt voor Codex app-server-beurten een geaccepteerde beurt af die geen app-server-voortgang meer produceert vóór een terminal event
   - retourneert payloads en gebruiksmetadata
4. `subscribeEmbeddedPiSession` overbrugt pi-agent-core-events naar de OpenClaw `agent`-stream:
   - tool-events => `stream: "tool"`
   - assistant-delta’s => `stream: "assistant"`
   - lifecycle-events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` gebruikt `waitForAgentRun`:
   - wacht op **lifecycle end/error** voor `runId`
   - retourneert `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Wachtrijen + gelijktijdigheid

- Uitvoeringen worden per sessiesleutel (sessielaan) geserialiseerd en optioneel via een globale laan geleid.
- Dit voorkomt tool-/sessieraces en houdt de sessiegeschiedenis consistent.
- Berichtkanalen kunnen wachtrijmodi kiezen (collect/steer/followup) die dit laansysteem voeden.
  Zie [Opdrachtwachtrij](/nl/concepts/queue).
- Transcriptwrites worden ook beschermd door een sessieschrijflock op het sessiebestand. De lock is
  procesbewust en bestandsgebaseerd, zodat schrijvers worden opgemerkt die de in-process-wachtrij omzeilen of uit
  een ander proces komen.
- Sessieschrijflocks zijn standaard niet-reentrant. Als een helper bewust het verkrijgen van
  dezelfde lock nest terwijl één logische schrijver behouden blijft, moet die expliciet opt-innen met
  `allowReentrant: true`.

## Sessie- en werkruimtevoorbereiding

- De werkruimte wordt opgelost en aangemaakt; sandboxed uitvoeringen kunnen omleiden naar een sandbox-werkruimteroot.
- Skills worden geladen (of hergebruikt vanuit een snapshot) en geïnjecteerd in env en prompt.
- Bootstrap-/contextbestanden worden opgelost en geïnjecteerd in het systeemprompt-rapport.
- Er wordt een sessieschrijflock verkregen; `SessionManager` wordt geopend en voorbereid vóór streaming. Elk
  later pad voor transcriptherschrijven, Compaction of afkapping moet dezelfde lock nemen voordat het transcriptbestand wordt geopend of
  gemuteerd.

## Promptassemblage + systeemprompt

- De systeemprompt wordt gebouwd uit de basisprompt van OpenClaw, de Skills-prompt, bootstrapcontext en overrides per uitvoering.
- Modelspecifieke limieten en gereserveerde tokens voor Compaction worden afgedwongen.
- Zie [Systeemprompt](/nl/concepts/system-prompt) voor wat het model ziet.

## Hookpunten (waar je kunt onderscheppen)

OpenClaw heeft twee hooksystemen:

- **Interne hooks** (Gateway-hooks): eventgedreven scripts voor opdrachten en lifecycle-events.
- **Plugin-hooks**: uitbreidingspunten binnen de agent-/tool-lifecycle en Gateway-pipeline.

### Interne hooks (Gateway-hooks)

- **`agent:bootstrap`**: draait tijdens het bouwen van bootstrapbestanden voordat de systeemprompt definitief wordt gemaakt.
  Gebruik dit om bootstrapcontextbestanden toe te voegen of te verwijderen.
- **Opdrachthooks**: `/new`, `/reset`, `/stop` en andere opdracht-events (zie het Hooks-document).

Zie [Hooks](/nl/automation/hooks) voor configuratie en voorbeelden.

### Plugin-hooks (agent- + Gateway-lifecycle)

Deze draaien binnen de agentloop of Gateway-pipeline:

- **`before_model_resolve`**: draait pre-sessie (geen `messages`) om provider/model deterministisch te overschrijven vóór modelresolutie.
- **`before_prompt_build`**: draait na sessielading (met `messages`) om `prependContext`, `systemPrompt`, `prependSystemContext` of `appendSystemContext` te injecteren vóór promptindiening. Gebruik `prependContext` voor dynamische tekst per beurt en systeemcontextvelden voor stabiele richtlijnen die in systeempromptruimte moeten staan.
- **`before_agent_start`**: legacy-compatibiliteitshook die in beide fasen kan draaien; geef de voorkeur aan de expliciete hooks hierboven.
- **`before_agent_reply`**: draait na inline acties en vóór de LLM-aanroep, zodat een Plugin de beurt kan claimen en een synthetisch antwoord kan retourneren of de beurt volledig kan stilhouden.
- **`agent_end`**: inspecteer de definitieve berichtenlijst en uitvoeringsmetadata na voltooiing.
- **`before_compaction` / `after_compaction`**: observeer of annoteer Compaction-cycli.
- **`before_tool_call` / `after_tool_call`**: onderschep toolparameters/-resultaten.
- **`before_install`**: inspecteer ingebouwde scanbevindingen en blokkeer optioneel Skill- of Plugin-installaties.
- **`tool_result_persist`**: transformeer toolresultaten synchroon voordat ze naar een door OpenClaw beheerd sessietranscript worden geschreven.
- **`message_received` / `message_sending` / `message_sent`**: hooks voor inkomende en uitgaande berichten.
- **`session_start` / `session_end`**: sessie-lifecyclegrenzen.
- **`gateway_start` / `gateway_stop`**: Gateway-lifecycle-events.

Beslisregels voor hooks voor uitgaande/tool-guards:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de hook-API en registratiedetails.

Harnesses kunnen deze hooks anders aanpassen. De Codex app-server-harness behoudt
OpenClaw Plugin-hooks als het compatibiliteitscontract voor gedocumenteerde gespiegeld
oppervlakken, terwijl native Codex-hooks een apart lager niveau Codex-mechanisme blijven.

## Streaming + gedeeltelijke antwoorden

- Assistant-delta’s worden vanuit pi-agent-core gestreamd en als `assistant`-events uitgezonden.
- Block-streaming kan gedeeltelijke antwoorden uitzenden op `text_end` of `message_end`.
- Reasoning-streaming kan worden uitgezonden als een aparte stream of als blokantwoorden.
- Zie [Streaming](/nl/concepts/streaming) voor chunking en blokantwoordgedrag.

## Tooluitvoering + berichttools

- Events voor tool-start/update/end worden uitgezonden op de `tool`-stream.
- Toolresultaten worden gesanitized voor grootte en image-payloads voordat ze worden gelogd/uitgezonden.
- Verzendingen met berichttools worden bijgehouden om dubbele assistant-bevestigingen te onderdrukken.

## Antwoordvorming + onderdrukking

- Definitieve payloads worden samengesteld uit:
  - assistant-tekst (en optionele reasoning)
  - inline toolsamenvattingen (wanneer verbose + toegestaan)
  - assistant-fouttekst wanneer het model fouten geeft
- Het exacte stille token `NO_REPLY` / `no_reply` wordt uit uitgaande
  payloads gefilterd.
- Duplicaten van berichttools worden uit de definitieve payloadlijst verwijderd.
- Als er geen renderbare payloads overblijven en een tool een fout gaf, wordt een fallback-toolfoutantwoord uitgezonden
  (tenzij een berichttool al een voor de gebruiker zichtbaar antwoord heeft verzonden).

## Compaction + nieuwe pogingen

- Auto-Compaction zendt `compaction`-streamevents uit en kan een nieuwe poging triggeren.
- Bij een nieuwe poging worden in-memory buffers en toolsamenvattingen gereset om dubbele uitvoer te voorkomen.
- Zie [Compaction](/nl/concepts/compaction) voor de Compaction-pipeline.

## Eventstreams (vandaag)

- `lifecycle`: uitgezonden door `subscribeEmbeddedPiSession` (en als fallback door `agentCommand`)
- `assistant`: gestreamde delta’s vanuit pi-agent-core
- `tool`: gestreamde tool-events vanuit pi-agent-core

## Chatkanaalafhandeling

- Assistant-delta’s worden gebufferd in chat-`delta`-berichten.
- Een chat-`final` wordt uitgezonden bij **lifecycle end/error**.

## Timeouts

- Standaard voor `agent.wait`: 30s (alleen het wachten). Parameter `timeoutMs` overschrijft dit.
- Agent-runtime: `agents.defaults.timeoutSeconds` standaard 172800s (48 uur); afgedwongen in de afbreektimer van `runEmbeddedPiAgent`.
- Cron-runtime: geïsoleerde agent-turn `timeoutSeconds` is eigendom van Cron. De scheduler start die timer wanneer de uitvoering begint, breekt de onderliggende uitvoering af op de geconfigureerde deadline en voert daarna begrensde opschoning uit voordat de timeout wordt vastgelegd, zodat een verouderde child-sessie de laan niet vast kan houden.
- Herstel van vastgelopen sessies: met diagnostiek ingeschakeld detecteert `diagnostics.stuckSessionWarnMs` langdurige `processing`-sessies. Actieve embedded uitvoeringen, actieve antwoordoperaties en actieve sessielaan-taken blijven standaard alleen waarschuwingen; als diagnostiek geen actief werk voor de sessie toont, geeft de watchdog de betrokken sessielaan vrij zodat werk in de opstartwachtrij kan doorstromen.
- Model-inactiviteitstimeout: OpenClaw breekt een modelrequest af wanneer er geen responsechunks arriveren vóór het inactiviteitsvenster. `models.providers.<id>.timeoutSeconds` verlengt deze inactiviteitswatchdog voor trage local loopback/zelfgehoste providers; anders gebruikt OpenClaw `agents.defaults.timeoutSeconds` wanneer geconfigureerd, standaard afgetopt op 120s. Door Cron getriggerde uitvoeringen zonder expliciete model- of agenttimeout schakelen de inactiviteitswatchdog uit en vertrouwen op de buitenste Cron-timeout.
- Timeout voor provider-HTTP-request: `models.providers.<id>.timeoutSeconds` geldt voor de model-HTTP-fetches van die provider, inclusief connect, headers, body, SDK-requesttimeout, totale guarded-fetch-afbreekafhandeling en modelstream-inactiviteitswatchdog. Gebruik dit voor trage local loopback/zelfgehoste providers zoals Ollama voordat je de runtime-timeout van de hele agent verhoogt.

## Waar dingen vroeg kunnen eindigen

- Agenttimeout (afbreken)
- AbortSignal (annuleren)
- Gateway-verbinding verbroken of RPC-timeout
- `agent.wait`-timeout (alleen wachten, stopt agent niet)

## Gerelateerd

- [Tools](/nl/tools) — beschikbare agenttools
- [Hooks](/nl/automation/hooks) — eventgedreven scripts getriggerd door agent-lifecycle-events
- [Compaction](/nl/concepts/compaction) — hoe lange gesprekken worden samengevat
- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Thinking](/nl/tools/thinking) — configuratie van thinking-/reasoning-niveau

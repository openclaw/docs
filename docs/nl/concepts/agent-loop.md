---
read_when:
    - Je hebt een exacte stapsgewijze uitleg nodig van de agentlus of de levenscyclusgebeurtenissen
    - Je wijzigt de wachtrijverwerking van sessies, het schrijven van transcripties of het gedrag van de schrijfvergrendeling voor sessies
summary: Levenscyclus van de agentloop, gegevensstromen en wachtsemantiek
title: Agentlus
x-i18n:
    generated_at: "2026-05-05T06:16:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Een agentische loop is de volledige “echte” uitvoering van een agent: intake → contextsamenstelling → modelinferentie →
tooluitvoering → streamende antwoorden → persistentie. Dit is het gezaghebbende pad dat een bericht
omzet in acties en een definitief antwoord, terwijl de sessiestatus consistent blijft.

In OpenClaw is een loop één geserialiseerde run per sessie die lifecycle- en streamevents uitzendt
terwijl het model denkt, tools aanroept en uitvoer streamt. Dit document legt uit hoe die authentieke loop
end-to-end is verbonden.

## Ingangspunten

- Gateway RPC: `agent` en `agent.wait`.
- CLI: opdracht `agent`.

## Hoe het werkt (op hoofdlijnen)

1. `agent` RPC valideert parameters, resolveert de sessie (sessionKey/sessionId), bewaart sessiemetagegevens persistent en retourneert direct `{ runId, acceptedAt }`.
2. `agentCommand` voert de agent uit:
   - resolveert model + thinking/verbose/trace-standaardwaarden
   - laadt Skills-snapshot
   - roept `runEmbeddedPiAgent` aan (pi-agent-core runtime)
   - zendt **lifecycle end/error** uit als de embedded loop er geen uitzendt
3. `runEmbeddedPiAgent`:
   - serialiseert runs via wachtrijen per sessie + globale wachtrijen
   - resolveert model + auth-profiel en bouwt de Pi-sessie
   - abonneert zich op Pi-events en streamt assistant/tool-delta’s
   - dwingt timeout af -> breekt run af als die wordt overschreden
   - breekt voor Codex app-server-beurten een geaccepteerde beurt af die geen app-server-voortgang meer produceert vóór een terminaal event
   - retourneert payloads + gebruiksmetagegevens
4. `subscribeEmbeddedPiSession` overbrugt pi-agent-core-events naar de OpenClaw `agent`-stream:
   - tool-events => `stream: "tool"`
   - assistant-delta’s => `stream: "assistant"`
   - lifecycle-events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` gebruikt `waitForAgentRun`:
   - wacht op **lifecycle end/error** voor `runId`
   - retourneert `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Wachtrijen + gelijktijdigheid

- Runs worden per sessiesleutel geserialiseerd (sessielaan) en optioneel via een globale laan.
- Dit voorkomt tool-/sessieraces en houdt de sessiegeschiedenis consistent.
- Berichtenkanalen kunnen wachtrijmodi kiezen (collect/steer/followup) die dit laansysteem voeden.
  Zie [Opdrachtwachtrij](/nl/concepts/queue).
- Transcriptwrites worden ook beschermd door een sessie-writelock op het sessiebestand. De lock is
  procesbewust en bestandsgebaseerd, zodat hij schrijvers opvangt die de in-process-wachtrij omzeilen of uit
  een ander proces komen. Schrijvers van sessietranscripten wachten maximaal `session.writeLock.acquireTimeoutMs`
  voordat ze de sessie als bezet rapporteren; de standaardwaarde is `60000` ms.
- Sessie-writelocks zijn standaard niet-herintredend. Als een helper bewust verwerving van
  dezelfde lock nest terwijl één logische schrijver behouden blijft, moet die zich expliciet aanmelden met
  `allowReentrant: true`.

## Sessie- + werkruimtevoorbereiding

- De werkruimte wordt resolved en aangemaakt; sandboxed runs kunnen worden omgeleid naar een sandbox-werkruimteroot.
- Skills worden geladen (of hergebruikt uit een snapshot) en geïnjecteerd in env en prompt.
- Bootstrap-/contextbestanden worden resolved en geïnjecteerd in het systeempromptrapport.
- Er wordt een sessie-writelock verkregen; `SessionManager` wordt geopend en voorbereid vóór het streamen. Elk
  later pad voor transcript-herschrijving, Compaction of truncatie moet dezelfde lock nemen voordat het transcriptbestand wordt geopend of
  gemuteerd.

## Promptsamenstelling + systeemprompt

- De systeemprompt wordt opgebouwd uit de basisprompt van OpenClaw, Skills-prompt, bootstrapcontext en overrides per run.
- Modelspecifieke limieten en gereserveerde tokens voor Compaction worden afgedwongen.
- Zie [Systeemprompt](/nl/concepts/system-prompt) voor wat het model ziet.

## Hookpunten (waar je kunt onderscheppen)

OpenClaw heeft twee hooksystemen:

- **Interne hooks** (Gateway-hooks): eventgedreven scripts voor opdrachten en lifecycle-events.
- **Plugin hooks**: extensiepunten binnen de agent-/tool-lifecycle en Gateway-pipeline.

### Interne hooks (Gateway-hooks)

- **`agent:bootstrap`**: wordt uitgevoerd tijdens het bouwen van bootstrapbestanden voordat de systeemprompt wordt afgerond.
  Gebruik dit om bootstrapcontextbestanden toe te voegen of te verwijderen.
- **Opdrachthooks**: `/new`, `/reset`, `/stop` en andere opdrachtevents (zie de Hooks-documentatie).

Zie [Hooks](/nl/automation/hooks) voor installatie en voorbeelden.

### Plugin hooks (agent- + Gateway-lifecycle)

Deze worden uitgevoerd binnen de agent-loop of Gateway-pipeline:

- **`before_model_resolve`**: wordt pre-session uitgevoerd (geen `messages`) om provider/model deterministisch te overriden vóór modelresolutie.
- **`before_prompt_build`**: wordt uitgevoerd na het laden van de sessie (met `messages`) om `prependContext`, `systemPrompt`, `prependSystemContext` of `appendSystemContext` te injecteren vóór promptindiening. Gebruik `prependContext` voor dynamische tekst per beurt en systeemcontextvelden voor stabiele richtlijnen die in de systeempromptruimte moeten staan.
- **`before_agent_start`**: legacy-compatibiliteitshook die in beide fasen kan worden uitgevoerd; geef de voorkeur aan de expliciete hooks hierboven.
- **`before_agent_reply`**: wordt uitgevoerd na inline acties en vóór de LLM-aanroep, zodat een Plugin de beurt kan claimen en een synthetisch antwoord kan retourneren of de beurt volledig kan stilleggen.
- **`agent_end`**: inspecteer de uiteindelijke berichtenlijst en runmetagegevens na voltooiing.
- **`before_compaction` / `after_compaction`**: observeer of annoteer Compaction-cycli.
- **`before_tool_call` / `after_tool_call`**: onderschep toolparameters/-resultaten.
- **`before_install`**: inspecteer ingebouwde scanbevindingen en blokkeer optioneel Skills- of Plugin-installaties.
- **`tool_result_persist`**: transformeer toolresultaten synchroon voordat ze naar een door OpenClaw beheerd sessietranscript worden geschreven.
- **`message_received` / `message_sending` / `message_sent`**: hooks voor inkomende + uitgaande berichten.
- **`session_start` / `session_end`**: grenzen van de sessie-lifecycle.
- **`gateway_start` / `gateway_stop`**: Gateway-lifecycle-events.

Beslisregels voor hooks voor uitgaande/toolguards:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` is een no-op en wist geen eerdere blokkering.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` is een no-op en wist geen eerdere blokkering.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` is een no-op en wist geen eerdere annulering.

Zie [Plugin hooks](/nl/plugins/hooks) voor de hook-API en registratiedetails.

Harnesses kunnen deze hooks anders aanpassen. De Codex app-server-harness houdt
OpenClaw Plugin hooks als het compatibiliteitscontract voor gedocumenteerde gespiegeld
oppervlakken, terwijl Codex native hooks een afzonderlijk, lager niveau Codex-mechanisme blijven.

## Streaming + gedeeltelijke antwoorden

- Assistant-delta’s worden gestreamd vanuit pi-agent-core en uitgezonden als `assistant`-events.
- Blokstreaming kan gedeeltelijke antwoorden uitzenden op `text_end` of `message_end`.
- Reasoning-streaming kan als afzonderlijke stream of als blokantwoorden worden uitgezonden.
- Zie [Streaming](/nl/concepts/streaming) voor chunking- en blokantwoordgedrag.

## Tooluitvoering + berichtentools

- Tool start/update/end-events worden uitgezonden op de `tool`-stream.
- Toolresultaten worden gesaneerd op grootte en afbeeldingspayloads voordat ze worden gelogd/uitgezonden.
- Verzendingen via berichtentools worden bijgehouden om dubbele assistantbevestigingen te onderdrukken.

## Antwoordvormgeving + onderdrukking

- Definitieve payloads worden samengesteld uit:
  - assistant-tekst (en optionele reasoning)
  - inline toolsamenvattingen (wanneer verbose + toegestaan)
  - assistant-fouttekst wanneer het model fouten geeft
- Het exacte stille token `NO_REPLY` / `no_reply` wordt gefilterd uit uitgaande
  payloads.
- Duplicaten van berichtentools worden verwijderd uit de definitieve payloadlijst.
- Als er geen renderbare payloads overblijven en een tool een fout heeft gegeven, wordt een fallback-toolfoutantwoord uitgezonden
  (tenzij een berichtentool al een gebruikerszichtbaar antwoord heeft verzonden).

## Compaction + retries

- Auto-Compaction zendt `compaction`-streamevents uit en kan een retry triggeren.
- Bij retry worden in-memory buffers en toolsamenvattingen gereset om dubbele uitvoer te voorkomen.
- Zie [Compaction](/nl/concepts/compaction) voor de Compaction-pipeline.

## Eventstreams (vandaag)

- `lifecycle`: uitgezonden door `subscribeEmbeddedPiSession` (en als fallback door `agentCommand`)
- `assistant`: gestreamde delta’s vanuit pi-agent-core
- `tool`: gestreamde tool-events vanuit pi-agent-core

## Afhandeling van chatkanalen

- Assistant-delta’s worden gebufferd in chat-`delta`-berichten.
- Een chat-`final` wordt uitgezonden bij **lifecycle end/error**.

## Timeouts

- `agent.wait` standaard: 30s (alleen het wachten). Parameter `timeoutMs` overridet.
- Agent-runtime: `agents.defaults.timeoutSeconds` standaard 172800s (48 uur); afgedwongen in de afbreektimer van `runEmbeddedPiAgent`.
- Cron-runtime: geïsoleerde agent-turn `timeoutSeconds` is eigendom van cron. De scheduler start die timer wanneer uitvoering begint, breekt de onderliggende run af op de geconfigureerde deadline en voert daarna begrensde cleanup uit voordat de timeout wordt vastgelegd, zodat een verouderde child-sessie de laan niet vast kan houden.
- Diagnostiek voor sessielevendigheid: met diagnostiek ingeschakeld classificeert `diagnostics.stuckSessionWarnMs` lange `processing`-sessies die geen waargenomen antwoord-, tool-, status-, blok- of ACP-voortgang hebben. Actieve embedded runs, modelaanroepen en toolaanroepen worden gerapporteerd als `session.long_running`; actief werk zonder recente voortgang wordt gerapporteerd als `session.stalled`; `session.stuck` is gereserveerd voor verouderde sessieboekhouding zonder actief werk. Verouderde sessieboekhouding geeft de getroffen sessielaan direct vrij; vastgelopen embedded runs worden pas abort-drained na `diagnostics.stuckSessionAbortMs` (standaard: minstens 10 minuten en 5x de waarschuwingsdrempel), zodat werk in de wachtrij kan worden hervat zonder alleen trage runs af te kappen. Herstel zendt gestructureerde requested/completed-uitkomsten uit, en diagnostische status wordt alleen als idle gemarkeerd als dezelfde processing-generatie nog actueel is. Herhaalde `session.stuck`-diagnostiek past backoff toe zolang de sessie ongewijzigd blijft.
- Model-idletimeout: OpenClaw breekt een modelrequest af wanneer er geen response-chunks arriveren vóór het idle-venster. `models.providers.<id>.timeoutSeconds` verlengt deze idle-watchdog voor trage lokale/self-hosted providers; anders gebruikt OpenClaw `agents.defaults.timeoutSeconds` wanneer geconfigureerd, standaard afgetopt op 120s. Door Cron getriggerde runs zonder expliciete model- of agenttimeout schakelen de idle-watchdog uit en vertrouwen op de buitenste Cron-timeout.
- Provider-HTTP-requesttimeout: `models.providers.<id>.timeoutSeconds` is van toepassing op de model-HTTP-fetches van die provider, inclusief connect, headers, body, SDK-requesttimeout, totale guarded-fetch-afbreekafhandeling en idle-watchdog voor modelstream. Gebruik dit voor trage lokale/self-hosted providers zoals Ollama voordat je de volledige agent-runtime-timeout verhoogt.

## Waar dingen vroeg kunnen eindigen

- Agenttimeout (abort)
- AbortSignal (cancel)
- Gateway-disconnect of RPC-timeout
- `agent.wait`-timeout (alleen wachten, stopt agent niet)

## Gerelateerd

- [Tools](/nl/tools) — beschikbare agenttools
- [Hooks](/nl/automation/hooks) — eventgedreven scripts getriggerd door agent-lifecycle-events
- [Compaction](/nl/concepts/compaction) — hoe lange gesprekken worden samengevat
- [Exec Approvals](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Thinking](/nl/tools/thinking) — configuratie van thinking-/reasoning-niveau

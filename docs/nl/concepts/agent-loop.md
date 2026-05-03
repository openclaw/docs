---
read_when:
    - Je hebt een precieze stapsgewijze uitleg nodig van de agentlus of levenscyclusgebeurtenissen
    - Je wijzigt sessiewachtrijen, transcriptieschrijfacties of het gedrag van de sessieschrijfvergrendeling
summary: Levenscyclus van de agentlus, gegevensstromen en wachtsemantiek
title: Agentlus
x-i18n:
    generated_at: "2026-05-03T21:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

Een agentische loop is de volledige “echte” uitvoering van een agent: intake → contextopbouw → modelinferentie →
tooluitvoering → streamende antwoorden → persistentie. Het is het gezaghebbende pad dat een bericht
omzet in acties en een definitief antwoord, terwijl de sessiestatus consistent blijft.

In OpenClaw is een loop een enkele, geserialiseerde uitvoering per sessie die lifecycle- en streamevents emitteert
terwijl het model nadenkt, tools aanroept en uitvoer streamt. Dit document legt uit hoe die authentieke loop
end-to-end is bedraad.

## Invoerpunten

- Gateway RPC: `agent` en `agent.wait`.
- CLI: opdracht `agent`.

## Hoe het werkt (op hoofdlijnen)

1. `agent` RPC valideert parameters, resolveert de sessie (sessionKey/sessionId), bewaart sessiemetadata en retourneert direct `{ runId, acceptedAt }`.
2. `agentCommand` voert de agent uit:
   - resolveert standaardwaarden voor model + thinking/verbose/trace
   - laadt Skills-snapshot
   - roept `runEmbeddedPiAgent` aan (pi-agent-core-runtime)
   - emitteert **lifecycle end/error** als de embedded loop er geen emitteert
3. `runEmbeddedPiAgent`:
   - serialiseert uitvoeringen via per-sessie- en globale wachtrijen
   - resolveert model + auth-profiel en bouwt de Pi-sessie
   - abonneert zich op Pi-events en streamt assistant/tool-delta's
   - handhaaft timeout -> breekt uitvoering af als die wordt overschreden
   - breekt voor Codex app-server-beurten een geaccepteerde beurt af die geen app-server-voortgang meer produceert vóór een terminaal event
   - retourneert payloads + gebruiksmetadata
4. `subscribeEmbeddedPiSession` overbrugt pi-agent-core-events naar OpenClaw `agent`-stream:
   - tool-events => `stream: "tool"`
   - assistant-delta's => `stream: "assistant"`
   - lifecycle-events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` gebruikt `waitForAgentRun`:
   - wacht op **lifecycle end/error** voor `runId`
   - retourneert `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Wachtrijvorming + gelijktijdigheid

- Uitvoeringen worden geserialiseerd per sessiesleutel (sessielane) en optioneel via een globale lane.
- Dit voorkomt tool-/sessieraces en houdt de sessiegeschiedenis consistent.
- Berichtenkanalen kunnen wachtrijmodi kiezen (collect/steer/followup) die dit lanesysteem voeden.
  Zie [Opdrachtwachtrij](/nl/concepts/queue).
- Transcriptwrites worden ook beschermd door een sessiewritelock op het sessiebestand. De lock is
  procesbewust en bestandsgebaseerd, waardoor hij schrijvers detecteert die de in-process-wachtrij omzeilen of uit
  een ander proces komen. Schrijvers van sessietranscripten wachten maximaal `session.writeLock.acquireTimeoutMs`
  voordat ze de sessie als bezet rapporteren; de standaardwaarde is `60000` ms.
- Sessiewritelocks zijn standaard niet-reentrant. Als een helper opzettelijk acquisitie van
  dezelfde lock nest terwijl één logische schrijver behouden blijft, moet die expliciet opt-innen met
  `allowReentrant: true`.

## Sessie- + workspacevoorbereiding

- Workspace wordt geresolveerd en gemaakt; sandboxed uitvoeringen kunnen doorverwijzen naar een sandbox-workspaceroot.
- Skills worden geladen (of hergebruikt vanuit een snapshot) en in env en prompt geïnjecteerd.
- Bootstrap-/contextbestanden worden geresolveerd en in het systeempromptrapport geïnjecteerd.
- Een sessiewritelock wordt verkregen; `SessionManager` wordt geopend en voorbereid vóór streaming. Elk
  later pad voor transcriptrewrite, Compaction of truncation moet dezelfde lock nemen voordat het transcriptbestand wordt geopend of
  gemuteerd.

## Promptopbouw + systeemprompt

- De systeemprompt wordt opgebouwd uit de basisprompt van OpenClaw, Skills-prompt, bootstrapcontext en per-uitvoering-overrides.
- Modelspecifieke limieten en gereserveerde tokens voor Compaction worden gehandhaafd.
- Zie [Systeemprompt](/nl/concepts/system-prompt) voor wat het model ziet.

## Hookpunten (waar je kunt ingrijpen)

OpenClaw heeft twee hooksystemen:

- **Interne hooks** (Gateway-hooks): eventgestuurde scripts voor opdrachten en lifecycle-events.
- **Plugin-hooks**: extensiepunten binnen de agent-/tool-lifecycle en Gateway-pipeline.

### Interne hooks (Gateway-hooks)

- **`agent:bootstrap`**: draait tijdens het bouwen van bootstrapbestanden voordat de systeemprompt wordt afgerond.
  Gebruik dit om bootstrapcontextbestanden toe te voegen of te verwijderen.
- **Opdrachthooks**: `/new`, `/reset`, `/stop` en andere opdrachtevents (zie Hooks-document).

Zie [Hooks](/nl/automation/hooks) voor installatie en voorbeelden.

### Plugin-hooks (agent- + Gateway-lifecycle)

Deze draaien binnen de agentloop of Gateway-pipeline:

- **`before_model_resolve`**: draait pre-sessie (geen `messages`) om provider/model deterministisch te overschrijven vóór modelresolutie.
- **`before_prompt_build`**: draait na sessielaad (met `messages`) om `prependContext`, `systemPrompt`, `prependSystemContext` of `appendSystemContext` te injecteren vóór promptinzending. Gebruik `prependContext` voor dynamische tekst per beurt en systeemcontextvelden voor stabiele sturing die in systeempromptruimte hoort.
- **`before_agent_start`**: legacy-compatibiliteitshook die in beide fasen kan draaien; geef de voorkeur aan de expliciete hooks hierboven.
- **`before_agent_reply`**: draait na inline acties en vóór de LLM-aanroep, zodat een Plugin de beurt kan claimen en een synthetisch antwoord kan retourneren of de beurt volledig kan dempen.
- **`agent_end`**: inspecteer de definitieve berichtenlijst en uitvoeringsmetadata na voltooiing.
- **`before_compaction` / `after_compaction`**: observeer of annoteer Compaction-cycli.
- **`before_tool_call` / `after_tool_call`**: onderschep toolparameters/-resultaten.
- **`before_install`**: inspecteer ingebouwde scanbevindingen en blokkeer optioneel Skill- of Plugin-installaties.
- **`tool_result_persist`**: transformeer toolresultaten synchroon voordat ze naar een door OpenClaw beheerd sessietranscript worden geschreven.
- **`message_received` / `message_sending` / `message_sent`**: inkomende + uitgaande berichthooks.
- **`session_start` / `session_end`**: sessielifecyclegrenzen.
- **`gateway_start` / `gateway_stop`**: Gateway-lifecycle-events.

Beslisregels voor hooks voor uitgaande/toolguards:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` is een no-op en wist geen eerdere annulering.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de hook-API en registratiedetails.

Harnesses kunnen deze hooks anders adapteren. De Codex app-server-harness houdt
OpenClaw Plugin-hooks aan als het compatibiliteitscontract voor gedocumenteerde gespiegeld
oppervlakken, terwijl native Codex-hooks een apart lagerliggend Codex-mechanisme blijven.

## Streaming + gedeeltelijke antwoorden

- Assistant-delta's worden vanuit pi-agent-core gestreamd en als `assistant`-events geëmitteerd.
- Blokstreaming kan gedeeltelijke antwoorden emitten op `text_end` of `message_end`.
- Reasoning-streaming kan worden geëmitteerd als aparte stream of als blokantwoorden.
- Zie [Streaming](/nl/concepts/streaming) voor chunking en gedrag van blokantwoorden.

## Tooluitvoering + berichtentools

- Tool start/update/end-events worden geëmitteerd op de `tool`-stream.
- Toolresultaten worden gesaneerd op grootte en image-payloads voordat ze worden gelogd/geëmitteerd.
- Verzendingen met berichtentools worden gevolgd om dubbele assistant-bevestigingen te onderdrukken.

## Antwoordvorming + onderdrukking

- Definitieve payloads worden samengesteld uit:
  - assistant-tekst (en optionele reasoning)
  - inline toolsamenvattingen (wanneer verbose + toegestaan)
  - assistant-fouttekst wanneer het model faalt
- Het exacte stille token `NO_REPLY` / `no_reply` wordt uit uitgaande
  payloads gefilterd.
- Duplicaten van berichtentools worden uit de definitieve payloadlijst verwijderd.
- Als er geen renderbare payloads overblijven en een tool een fout gaf, wordt een fallback-toolfoutantwoord geëmitteerd
  (tenzij een berichtentool al een voor de gebruiker zichtbaar antwoord heeft verzonden).

## Compaction + nieuwe pogingen

- Auto-Compaction emitteert `compaction`-streamevents en kan een nieuwe poging triggeren.
- Bij een nieuwe poging worden in-memory buffers en toolsamenvattingen gereset om dubbele uitvoer te voorkomen.
- Zie [Compaction](/nl/concepts/compaction) voor de Compaction-pipeline.

## Eventstreams (vandaag)

- `lifecycle`: geëmitteerd door `subscribeEmbeddedPiSession` (en als fallback door `agentCommand`)
- `assistant`: gestreamde delta's vanuit pi-agent-core
- `tool`: gestreamde tool-events vanuit pi-agent-core

## Afhandeling van chatkanalen

- Assistant-delta's worden gebufferd in chat-`delta`-berichten.
- Een chat-`final` wordt geëmitteerd bij **lifecycle end/error**.

## Timeouts

- `agent.wait` standaard: 30s (alleen de wacht). Parameter `timeoutMs` overschrijft dit.
- Agentruntime: `agents.defaults.timeoutSeconds` standaard 172800s (48 uur); gehandhaafd in de afbreektimer van `runEmbeddedPiAgent`.
- Cron-runtime: geïsoleerde agent-turn `timeoutSeconds` is eigendom van Cron. De scheduler start die timer wanneer uitvoering begint, breekt de onderliggende uitvoering af op de geconfigureerde deadline en voert daarna begrensde cleanup uit voordat de timeout wordt geregistreerd, zodat een verouderde kindsessie de lane niet vast kan houden.
- Diagnostiek voor sessieliveness: met diagnostiek ingeschakeld classificeert `diagnostics.stuckSessionWarnMs` lange `processing`-sessies zonder geobserveerd antwoord, tool, status, blok of ACP-voortgang. Actieve embedded uitvoeringen, modelaanroepen en toolaanroepen rapporteren als `session.long_running`; actief werk zonder recente voortgang rapporteert als `session.stalled`; `session.stuck` is gereserveerd voor verouderde sessieboekhouding zonder actief werk. Verouderde sessieboekhouding geeft de getroffen sessielane direct vrij; vastgelopen embedded uitvoeringen worden pas abort-drained na een verlengd venster zonder voortgang (minstens 10 minuten en 5x de waarschuwingsdrempel), zodat werk in de wachtrij kan hervatten zonder alleen maar trage uitvoeringen af te kappen. Herhaalde `session.stuck`-diagnostiek gebruikt back-off zolang de sessie ongewijzigd blijft.
- Idle-timeout van model: OpenClaw breekt een modelrequest af wanneer er geen response chunks binnenkomen vóór het idle-venster. `models.providers.<id>.timeoutSeconds` verlengt deze idle-watchdog voor trage lokale/self-hosted providers; anders gebruikt OpenClaw `agents.defaults.timeoutSeconds` wanneer geconfigureerd, standaard begrensd op 120s. Door Cron getriggerde uitvoeringen zonder expliciete model- of agenttimeout schakelen de idle-watchdog uit en vertrouwen op de buitenste Cron-timeout.
- HTTP-requesttimeout van provider: `models.providers.<id>.timeoutSeconds` geldt voor de model-HTTP-fetches van die provider, inclusief verbinden, headers, body, SDK-requesttimeout, totale guarded-fetch-abortafhandeling en idle-watchdog voor modelstream. Gebruik dit voor trage lokale/self-hosted providers zoals Ollama voordat je de volledige agentruntime-timeout verhoogt.

## Waar dingen vroeg kunnen eindigen

- Agenttimeout (abort)
- AbortSignal (annuleren)
- Gateway-verbreking of RPC-timeout
- `agent.wait`-timeout (alleen wachten, stopt de agent niet)

## Gerelateerd

- [Tools](/nl/tools) — beschikbare agenttools
- [Hooks](/nl/automation/hooks) — eventgestuurde scripts getriggerd door agent-lifecycle-events
- [Compaction](/nl/concepts/compaction) — hoe lange gesprekken worden samengevat
- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Thinking](/nl/tools/thinking) — configuratie van thinking-/reasoningniveau

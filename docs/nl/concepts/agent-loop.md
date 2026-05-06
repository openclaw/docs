---
read_when:
    - Je hebt een exacte stapsgewijze uitleg van de agentlus of levenscyclusgebeurtenissen nodig
    - Je wijzigt het in de wachtrij plaatsen van sessies, schrijfbewerkingen naar transcripten of het gedrag van de schrijfvergrendeling voor sessies
summary: Levenscyclus van de agentlus, stromen en wachtsemantiek
title: Agentlus
x-i18n:
    generated_at: "2026-05-06T09:07:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

Een agentische lus is de volledige "echte" uitvoering van een agent: intake → contextassemblage → modelinferentie →
tooluitvoering → streaming antwoorden → persistentie. Dit is het gezaghebbende pad dat een bericht
omzet in acties en een definitief antwoord, terwijl de sessiestatus consistent blijft.

In OpenClaw is een lus één enkele, geserialiseerde uitvoering per sessie die lifecycle- en streamevents uitstoot
terwijl het model nadenkt, tools aanroept en uitvoer streamt. Dit document legt uit hoe die authentieke lus
van begin tot eind is bedraad.

## Invoerpunten

- Gateway RPC: `agent` en `agent.wait`.
- CLI: opdracht `agent`.

## Hoe het werkt (op hoofdlijnen)

1. `agent` RPC valideert parameters, lost de sessie op (sessionKey/sessionId), persisteert sessiemetadata en retourneert onmiddellijk `{ runId, acceptedAt }`.
2. `agentCommand` voert de agent uit:
   - lost model- en thinking/verbose/trace-standaardwaarden op
   - laadt Skills-snapshot
   - roept `runEmbeddedPiAgent` aan (pi-agent-core runtime)
   - stoot **lifecycle einde/fout** uit als de ingebedde lus er geen uitstoot
3. `runEmbeddedPiAgent`:
   - serialiseert uitvoeringen via wachtrijen per sessie en globale wachtrijen
   - lost model + auth-profiel op en bouwt de pi-sessie
   - abonneert zich op pi-events en streamt assistant/tool-delta's
   - handhaaft time-out -> breekt uitvoering af als deze wordt overschreden
   - breekt voor Codex app-server-beurten een geaccepteerde beurt af die geen app-server-voortgang meer produceert vóór een terminaal event
   - retourneert payloads + gebruiksmetadata
4. `subscribeEmbeddedPiSession` overbrugt pi-agent-core-events naar de OpenClaw `agent`-stream:
   - tool-events => `stream: "tool"`
   - assistant-delta's => `stream: "assistant"`
   - lifecycle-events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` gebruikt `waitForAgentRun`:
   - wacht op **lifecycle einde/fout** voor `runId`
   - retourneert `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Wachtrijen + gelijktijdigheid

- Uitvoeringen worden per sessiesleutel (sessielane) en optioneel via een globale lane geserialiseerd.
- Dit voorkomt tool-/sessieraces en houdt de sessiegeschiedenis consistent.
- Berichtkanalen kunnen wachtrijmodi kiezen (collect/steer/followup) die dit lanesysteem voeden.
  Zie [Opdrachtwachtrij](/nl/concepts/queue).
- Transcriptwrites worden ook beschermd door een sessieschrijflock op het sessiebestand. De lock is
  procesbewust en bestandsgebaseerd, zodat deze schrijvers opvangt die de in-process-wachtrij omzeilen of uit
  een ander proces komen. Sessie-transcriptschrijvers wachten maximaal `session.writeLock.acquireTimeoutMs`
  voordat ze de sessie als bezet rapporteren; de standaardwaarde is `60000` ms.
- Sessie-schrijflocks zijn standaard niet re-entrant. Als een helper bewust het verwerven van
  dezelfde lock nest terwijl er één logische schrijver behouden blijft, moet die expliciet opt-innen met
  `allowReentrant: true`.

## Sessie- + werkruimtevoorbereiding

- De werkruimte wordt opgelost en aangemaakt; sandbox-uitvoeringen kunnen omleiden naar een sandbox-werkruimteroot.
- Skills worden geladen (of hergebruikt vanuit een snapshot) en in env en prompt geïnjecteerd.
- Bootstrap-/contextbestanden worden opgelost en in het systeempromptrapport geïnjecteerd.
- Er wordt een sessieschrijflock verworven; `SessionManager` wordt geopend en voorbereid vóór streaming. Elk
  later pad voor transcriptherschrijving, Compaction of inkorting moet dezelfde lock nemen vóór het openen of
  muteren van het transcriptbestand.

## Promptassemblage + systeemprompt

- De systeemprompt wordt opgebouwd uit de basisprompt van OpenClaw, de Skills-prompt, bootstrapcontext en overrides per uitvoering.
- Modelspecifieke limieten en gereserveerde Compaction-tokens worden afgedwongen.
- Zie [Systeemprompt](/nl/concepts/system-prompt) voor wat het model ziet.

## Hookpunten (waar je kunt onderscheppen)

OpenClaw heeft twee hooksystemen:

- **Interne hooks** (Gateway-hooks): eventgestuurde scripts voor opdrachten en lifecycle-events.
- **Plugin-hooks**: uitbreidingspunten binnen de agent-/tool-lifecycle en Gateway-pijplijn.

### Interne hooks (Gateway-hooks)

- **`agent:bootstrap`**: wordt uitgevoerd tijdens het bouwen van bootstrapbestanden voordat de systeemprompt definitief wordt.
  Gebruik dit om bootstrapcontextbestanden toe te voegen of te verwijderen.
- **Opdrachthooks**: `/new`, `/reset`, `/stop` en andere opdrachtevents (zie Hooks-document).

Zie [Hooks](/nl/automation/hooks) voor installatie en voorbeelden.

### Plugin-hooks (agent- + Gateway-lifecycle)

Deze draaien binnen de agentlus of Gateway-pijplijn:

- **`before_model_resolve`**: draait vóór de sessie (geen `messages`) om provider/model deterministisch te overriden vóór modelresolutie.
- **`before_prompt_build`**: draait na het laden van de sessie (met `messages`) om `prependContext`, `systemPrompt`, `prependSystemContext` of `appendSystemContext` te injecteren vóór promptinzending. Gebruik `prependContext` voor dynamische tekst per beurt en system-context-velden voor stabiele begeleiding die in de systeempromptruimte hoort te staan.
- **`before_agent_start`**: legacy-compatibiliteitshook die in beide fasen kan draaien; geef de voorkeur aan de expliciete hooks hierboven.
- **`before_agent_reply`**: draait na inline acties en vóór de LLM-aanroep, zodat een Plugin de beurt kan claimen en een synthetisch antwoord kan retourneren of de beurt volledig kan dempen.
- **`agent_end`**: inspecteer de definitieve berichtenlijst en uitvoeringsmetadata na voltooiing.
- **`before_compaction` / `after_compaction`**: observeer of annoteer Compaction-cycli.
- **`before_tool_call` / `after_tool_call`**: onderschep toolparameters/-resultaten.
- **`before_install`**: inspecteer ingebouwde scanbevindingen en blokkeer optioneel Skill- of Plugin-installaties.
- **`tool_result_persist`**: transformeer toolresultaten synchroon voordat ze naar een door OpenClaw beheerd sessietranscript worden geschreven.
- **`message_received` / `message_sending` / `message_sent`**: inkomende + uitgaande berichthooks.
- **`session_start` / `session_end`**: grenzen van de sessie-lifecycle.
- **`gateway_start` / `gateway_stop`**: Gateway-lifecycle-events.

Beslissingsregels voor hooks voor uitgaande/toolguards:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de hook-API en registratiedetails.

Harnesses kunnen deze hooks anders aanpassen. De Codex app-server-harness behoudt
OpenClaw Plugin-hooks als het compatibiliteitscontract voor gedocumenteerde gespiegeld
oppervlakken, terwijl native Codex-hooks een afzonderlijk lager-niveau Codex-mechanisme blijven.

## Streaming + gedeeltelijke antwoorden

- Assistant-delta's worden vanuit pi-agent-core gestreamd en als `assistant`-events uitgestoten.
- Blokstreaming kan gedeeltelijke antwoorden uitstoten op `text_end` of `message_end`.
- Redeneringsstreaming kan als afzonderlijke stream of als blokantwoorden worden uitgestoten.
- Zie [Streaming](/nl/concepts/streaming) voor chunking en gedrag van blokantwoorden.

## Tooluitvoering + berichttools

- Tool-start/update/end-events worden op de `tool`-stream uitgestoten.
- Toolresultaten worden gesaneerd op grootte en afbeeldingspayloads voordat ze worden gelogd/uitgestoten.
- Verzendingen van berichttools worden gevolgd om dubbele assistant-bevestigingen te onderdrukken.

## Antwoordvorming + onderdrukking

- Definitieve payloads worden samengesteld uit:
  - assistant-tekst (en optioneel redenering)
  - inline toolsamenvattingen (wanneer verbose + toegestaan)
  - assistant-fouttekst wanneer het model fouten geeft
- Het exacte stille token `NO_REPLY` / `no_reply` wordt uit uitgaande
  payloads gefilterd.
- Duplicaten van berichttools worden uit de definitieve payloadlijst verwijderd.
- Als er geen renderbare payloads overblijven en een tool een fout gaf, wordt een fallback-toolfoutantwoord uitgestoten
  (tenzij een berichttool al een voor de gebruiker zichtbaar antwoord heeft verzonden).

## Compaction + nieuwe pogingen

- Auto-Compaction stoot `compaction`-streamevents uit en kan een nieuwe poging activeren.
- Bij een nieuwe poging worden in-memory buffers en toolsamenvattingen gereset om dubbele uitvoer te voorkomen.
- Zie [Compaction](/nl/concepts/compaction) voor de Compaction-pijplijn.

## Eventstreams (vandaag)

- `lifecycle`: uitgestoten door `subscribeEmbeddedPiSession` (en als fallback door `agentCommand`)
- `assistant`: gestreamde delta's vanuit pi-agent-core
- `tool`: gestreamde tool-events vanuit pi-agent-core

## Afhandeling van chatkanalen

- Assistant-delta's worden gebufferd in chat-`delta`-berichten.
- Een chat-`final` wordt uitgestoten bij **lifecycle einde/fout**.

## Time-outs

- Standaardwaarde voor `agent.wait`: 30s (alleen het wachten). Parameter `timeoutMs` overschrijft dit.
- Agentruntime: standaardwaarde voor `agents.defaults.timeoutSeconds` is 172800s (48 uur); afgedwongen in de afbreektimer van `runEmbeddedPiAgent`.
- Cron-runtime: `timeoutSeconds` voor geïsoleerde agentbeurten is eigendom van Cron. De scheduler start die timer wanneer uitvoering begint, breekt de onderliggende uitvoering af op de geconfigureerde deadline en voert daarna begrensde cleanup uit voordat de time-out wordt geregistreerd, zodat een verouderde child-sessie de lane niet vast kan houden.
- Diagnostiek voor sessielevendigheid: met diagnostiek ingeschakeld classificeert `diagnostics.stuckSessionWarnMs` langdurige `processing`-sessies zonder waargenomen antwoord-, tool-, status-, blok- of ACP-voortgang. Actieve ingebedde uitvoeringen, modelaanroepen en toolaanroepen worden gerapporteerd als `session.long_running`; actief werk zonder recente voortgang wordt gerapporteerd als `session.stalled`; `session.stuck` is gereserveerd voor verouderde sessieboekhouding zonder actief werk. Verouderde sessieboekhouding geeft de getroffen sessielane onmiddellijk vrij; vastgelopen ingebedde uitvoeringen worden pas na `diagnostics.stuckSessionAbortMs` abort-gedraind (standaard: ten minste 10 minuten en 5x de waarschuwingsdrempel), zodat werk in de wachtrij kan worden hervat zonder louter trage uitvoeringen af te kappen. Herstel stoot gestructureerde aangevraagde/voltooide uitkomsten uit, en diagnostische status wordt alleen als idle gemarkeerd als dezelfde verwerkingsgeneratie nog steeds actueel is. Herhaalde `session.stuck`-diagnostiek past back-off toe zolang de sessie ongewijzigd blijft.
- Time-out voor modelidle: OpenClaw breekt een modelrequest af wanneer er vóór het idle-venster geen antwoordchunks binnenkomen. `models.providers.<id>.timeoutSeconds` verlengt deze idle-watchdog voor trage lokale/self-hosted providers; anders gebruikt OpenClaw `agents.defaults.timeoutSeconds` wanneer geconfigureerd, standaard begrensd op 120s. Door Cron getriggerde uitvoeringen zonder expliciete model- of agenttime-out schakelen de idle-watchdog uit en vertrouwen op de buitenste Cron-time-out.
- Time-out voor provider-HTTP-request: `models.providers.<id>.timeoutSeconds` geldt voor de model-HTTP-fetches van die provider, inclusief verbinding, headers, body, SDK-requesttime-out, totale guarded-fetch-afbreekafhandeling en de idle-watchdog van de modelstream. Gebruik dit voor trage lokale/self-hosted providers zoals Ollama voordat je de time-out van de volledige agentruntime verhoogt.

## Waar dingen vroeg kunnen eindigen

- Agenttime-out (afbreken)
- AbortSignal (annuleren)
- Gateway-verbinding verbreekt of RPC-time-out
- `agent.wait`-time-out (alleen wachten, stopt agent niet)

## Gerelateerd

- [Tools](/nl/tools) — beschikbare agenttools
- [Hooks](/nl/automation/hooks) — eventgestuurde scripts die worden getriggerd door agent-lifecycle-events
- [Compaction](/nl/concepts/compaction) — hoe lange gesprekken worden samengevat
- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Thinking](/nl/tools/thinking) — configuratie van denk-/redeneringsniveau

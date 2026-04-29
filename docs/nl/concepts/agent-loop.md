---
read_when:
    - Je hebt een exacte doorloop van de agentlus of levenscyclusgebeurtenissen nodig
    - Je wijzigt sessiewachtrijen, transcript-schrijfbewerkingen of het gedrag van sessieschrijfvergrendelingen
summary: Levenscyclus van de agentloop, streams en wachtsemantiek
title: Agentlus
x-i18n:
    generated_at: "2026-04-29T22:36:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Een agentic loop is de volledige “echte” uitvoering van een agent: intake → contextassemblage → modelinferentie →
tooluitvoering → streaming-antwoorden → persistentie. Dit is het gezaghebbende pad dat een bericht
omzet in acties en een definitief antwoord, terwijl de sessiestatus consistent blijft.

In OpenClaw is een loop één enkele, geserialiseerde uitvoering per sessie die lifecycle- en stream-events emit
terwijl het model denkt, tools aanroept en uitvoer streamt. Dit document legt uit hoe die authentieke loop
end-to-end is bedraad.

## Entry points

- Gateway-RPC: `agent` en `agent.wait`.
- CLI: opdracht `agent`.

## Hoe het werkt (op hoofdlijnen)

1. `agent` RPC valideert parameters, lost de sessie op (sessionKey/sessionId), persisteert sessiemetadata en retourneert direct `{ runId, acceptedAt }`.
2. `agentCommand` voert de agent uit:
   - lost model + standaardwaarden voor thinking/verbose/trace op
   - laadt Skills-snapshot
   - roept `runEmbeddedPiAgent` aan (pi-agent-core-runtime)
   - emit **lifecycle end/error** als de embedded loop er geen emit
3. `runEmbeddedPiAgent`:
   - serialiseert uitvoeringen via per-sessie- en globale wachtrijen
   - lost model + auth-profiel op en bouwt de Pi-sessie
   - abonneert zich op Pi-events en streamt assistant/tool-delta's
   - handhaaft timeout -> breekt uitvoering af als die wordt overschreden
   - retourneert payloads + gebruiksmetadata
4. `subscribeEmbeddedPiSession` brugt pi-agent-core-events naar de OpenClaw-`agent`-stream:
   - tool-events => `stream: "tool"`
   - assistant-delta's => `stream: "assistant"`
   - lifecycle-events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` gebruikt `waitForAgentRun`:
   - wacht op **lifecycle end/error** voor `runId`
   - retourneert `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Wachtrijen + concurrency

- Uitvoeringen worden per sessiesleutel (sessielane) geserialiseerd en optioneel via een globale lane.
- Dit voorkomt tool-/sessieraces en houdt de sessiegeschiedenis consistent.
- Berichtkanalen kunnen wachtrijmodi kiezen (collect/steer/followup) die dit lanesysteem voeden.
  Zie [Opdrachtwachtrij](/nl/concepts/queue).
- Transcriptwrites worden ook beschermd door een sessie-writelock op het sessiebestand. De lock is
  procesbewust en bestandsgebaseerd, zodat die writers opvangt die de in-process wachtrij omzeilen of uit
  een ander proces komen.
- Sessie-writelocks zijn standaard niet-reentrant. Als een helper bewust het verkrijgen van
  dezelfde lock nest terwijl één logische writer behouden blijft, moet die daar expliciet voor kiezen met
  `allowReentrant: true`.

## Sessie- + werkruimtevoorbereiding

- De werkruimte wordt opgelost en aangemaakt; sandboxed uitvoeringen kunnen worden omgeleid naar een sandbox-werkruimteroot.
- Skills worden geladen (of hergebruikt uit een snapshot) en geïnjecteerd in env en prompt.
- Bootstrap-/contextbestanden worden opgelost en geïnjecteerd in het systeempromptrapport.
- Er wordt een sessie-writelock verkregen; `SessionManager` wordt geopend en voorbereid vóór streaming. Elk
  later pad voor transcript rewrite, Compaction of truncatie moet dezelfde lock nemen voordat het transcriptbestand wordt geopend of
  gemuteerd.

## Promptassemblage + systeemprompt

- De systeemprompt wordt opgebouwd uit de basisprompt van OpenClaw, Skills-prompt, bootstrapcontext en per-uitvoering-overrides.
- Modelspecifieke limieten en Compaction-reservetokens worden afgedwongen.
- Zie [Systeemprompt](/nl/concepts/system-prompt) voor wat het model ziet.

## Hookpunten (waar je kunt onderscheppen)

OpenClaw heeft twee hooksystemen:

- **Interne hooks** (Gateway-hooks): eventgestuurde scripts voor opdrachten en lifecycle-events.
- **Plugin-hooks**: uitbreidingspunten binnen de agent-/tool-lifecycle en Gateway-pipeline.

### Interne hooks (Gateway-hooks)

- **`agent:bootstrap`**: draait tijdens het bouwen van bootstrapbestanden voordat de systeemprompt definitief wordt gemaakt.
  Gebruik dit om bootstrapcontextbestanden toe te voegen of te verwijderen.
- **Opdrachthooks**: `/new`, `/reset`, `/stop` en andere opdrachtevents (zie Hooks-documentatie).

Zie [Hooks](/nl/automation/hooks) voor setup en voorbeelden.

### Plugin-hooks (agent- + Gateway-lifecycle)

Deze draaien binnen de agent-loop of Gateway-pipeline:

- **`before_model_resolve`**: draait pre-sessie (geen `messages`) om provider/model deterministisch te overschrijven vóór modelresolutie.
- **`before_prompt_build`**: draait na sessielaadstap (met `messages`) om `prependContext`, `systemPrompt`, `prependSystemContext` of `appendSystemContext` te injecteren vóór promptinzending. Gebruik `prependContext` voor dynamische tekst per beurt en system-context-velden voor stabiele richtlijnen die in de systeempromptruimte moeten staan.
- **`before_agent_start`**: legacy-compatibiliteitshook die in beide fasen kan draaien; geef de voorkeur aan de expliciete hooks hierboven.
- **`before_agent_reply`**: draait na inline acties en vóór de LLM-aanroep, zodat een Plugin de beurt kan claimen en een synthetisch antwoord kan retourneren of de beurt volledig kan dempen.
- **`agent_end`**: inspecteer de uiteindelijke berichtenlijst en uitvoeringsmetadata na voltooiing.
- **`before_compaction` / `after_compaction`**: observeer of annoteer Compaction-cycli.
- **`before_tool_call` / `after_tool_call`**: onderschep toolparameters/-resultaten.
- **`before_install`**: inspecteer ingebouwde scanbevindingen en blokkeer optioneel installatie van Skills of Plugins.
- **`tool_result_persist`**: transformeer toolresultaten synchroon voordat ze worden weggeschreven naar een sessietranscript dat eigendom is van OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: inbound + outbound berichthooks.
- **`session_start` / `session_end`**: grenzen van de sessie-lifecycle.
- **`gateway_start` / `gateway_stop`**: Gateway-lifecycle-events.

Beslisregels voor hooks voor outbound/tool-guards:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` is een no-op en heft een eerdere blokkade niet op.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` is een no-op en heft een eerdere blokkade niet op.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` is een no-op en heft een eerdere annulering niet op.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de hook-API en registratiedetails.

Harnesses kunnen deze hooks anders adapteren. De Codex app-server-harness behoudt
OpenClaw Plugin-hooks als het compatibiliteitscontract voor gedocumenteerde gespiegeld
oppervlakken, terwijl native Codex-hooks een afzonderlijk Codex-mechanisme op lager niveau blijven.

## Streaming + gedeeltelijke antwoorden

- Assistant-delta's worden gestreamd vanuit pi-agent-core en als `assistant`-events geëmit.
- Blokstreaming kan gedeeltelijke antwoorden emitten op `text_end` of `message_end`.
- Reasoning-streaming kan worden geëmit als een afzonderlijke stream of als blokantwoorden.
- Zie [Streaming](/nl/concepts/streaming) voor chunking- en blokantwoordgedrag.

## Tooluitvoering + berichtentools

- Toolstart-/update-/end-events worden geëmit op de `tool`-stream.
- Toolresultaten worden gesanitized voor grootte en afbeeldingspayloads voordat ze worden gelogd/geëmit.
- Verzendingen door berichtentools worden bijgehouden om dubbele assistant-bevestigingen te onderdrukken.

## Antwoordvorming + onderdrukking

- Definitieve payloads worden samengesteld uit:
  - assistant-tekst (en optioneel reasoning)
  - inline toolsamenvattingen (wanneer verbose + toegestaan)
  - assistant-fouttekst wanneer het model een fout geeft
- Het exacte stille token `NO_REPLY` / `no_reply` wordt uit outgoing
  payloads gefilterd.
- Duplicaten van berichtentools worden verwijderd uit de definitieve payloadlijst.
- Als er geen renderbare payloads overblijven en een tool een fout gaf, wordt een fallback-toolfoutantwoord geëmit
  (tenzij een berichtentool al een voor de gebruiker zichtbaar antwoord heeft verzonden).

## Compaction + retries

- Auto-Compaction emit `compaction`-streamevents en kan een retry triggeren.
- Bij een retry worden in-memory buffers en toolsamenvattingen gereset om dubbele uitvoer te voorkomen.
- Zie [Compaction](/nl/concepts/compaction) voor de Compaction-pipeline.

## Eventstreams (vandaag)

- `lifecycle`: geëmit door `subscribeEmbeddedPiSession` (en als fallback door `agentCommand`)
- `assistant`: gestreamde delta's vanuit pi-agent-core
- `tool`: gestreamde tool-events vanuit pi-agent-core

## Chatkanaalafhandeling

- Assistant-delta's worden gebufferd in chat-`delta`-berichten.
- Een chat-`final` wordt geëmit bij **lifecycle end/error**.

## Timeouts

- Standaard voor `agent.wait`: 30s (alleen het wachten). Parameter `timeoutMs` overschrijft dit.
- Agentruntime: `agents.defaults.timeoutSeconds` standaard 172800s (48 uur); afgedwongen in de aborttimer van `runEmbeddedPiAgent`.
- Cron-runtime: geïsoleerde agent-turn `timeoutSeconds` is eigendom van Cron. De scheduler start die timer wanneer uitvoering begint, breekt de onderliggende uitvoering af op de geconfigureerde deadline en voert daarna begrensde cleanup uit voordat de timeout wordt vastgelegd, zodat een verouderde child-sessie de lane niet vast kan houden.
- Herstel van vastgelopen sessie: met diagnostics ingeschakeld detecteert `diagnostics.stuckSessionWarnMs` lange `processing`-sessies. Actieve embedded uitvoeringen, actieve antwoordoperaties en actieve sessie-lane-taken blijven standaard alleen waarschuwingen; als diagnostics geen actief werk voor de sessie tonen, geeft de watchdog de getroffen sessielane vrij zodat queued opstartwerk kan leeglopen.
- Model-idletimeout: OpenClaw breekt een modelrequest af wanneer er geen response chunks binnenkomen vóór het idle-venster. `models.providers.<id>.timeoutSeconds` verlengt deze idle-watchdog voor trage lokale/self-hosted providers; anders gebruikt OpenClaw `agents.defaults.timeoutSeconds` wanneer geconfigureerd, standaard begrensd op 120s. Door Cron getriggerde uitvoeringen zonder expliciete model- of agenttimeout schakelen de idle-watchdog uit en vertrouwen op de buitenste Cron-timeout.
- Provider-HTTP-requesttimeout: `models.providers.<id>.timeoutSeconds` is van toepassing op de model-HTTP-fetches van die provider, inclusief connect, headers, body, SDK-requesttimeout, totale guarded-fetch-aborthandling en modelstream-idle-watchdog. Gebruik dit voor trage lokale/self-hosted providers zoals Ollama voordat je de volledige agentruntime-timeout verhoogt.

## Waar dingen vroeg kunnen eindigen

- Agenttimeout (abort)
- AbortSignal (cancel)
- Gateway-disconnect of RPC-timeout
- `agent.wait`-timeout (alleen wachten, stopt agent niet)

## Gerelateerd

- [Tools](/nl/tools) — beschikbare agenttools
- [Hooks](/nl/automation/hooks) — eventgestuurde scripts die worden getriggerd door agent-lifecycle-events
- [Compaction](/nl/concepts/compaction) — hoe lange gesprekken worden samengevat
- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Thinking](/nl/tools/thinking) — configuratie van thinking-/reasoningniveau

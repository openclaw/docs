---
read_when:
    - Je hebt een exacte stapsgewijze uitleg nodig van de agentlus of levenscyclusgebeurtenissen
    - Je wijzigt het in de wachtrij plaatsen van sessies, schrijfbewerkingen naar transcripties of het gedrag van de schrijflock voor sessies
summary: Levenscyclus van de agentlus, stromen en wachtsemantiek
title: Agentlus
x-i18n:
    generated_at: "2026-05-02T11:13:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Een agentische loop is de volledige “echte” run van een agent: intake → contextopbouw → modelinferentie →
tooluitvoering → streamingantwoorden → persistentie. Het is het gezaghebbende pad dat een bericht
omzet in acties en een definitief antwoord, terwijl de sessiestatus consistent blijft.

In OpenClaw is een loop een enkele, geserialiseerde run per sessie die lifecycle- en streamevents uitzendt
terwijl het model denkt, tools aanroept en uitvoer streamt. Dit document legt uit hoe die authentieke loop
end-to-end is verbonden.

## Entry points

- Gateway-RPC: `agent` en `agent.wait`.
- CLI: opdracht `agent`.

## Hoe het werkt (op hoog niveau)

1. `agent`-RPC valideert parameters, lost de sessie op (sessionKey/sessionId), bewaart sessiemetadata en retourneert onmiddellijk `{ runId, acceptedAt }`.
2. `agentCommand` voert de agent uit:
   - lost model- en standaardwaarden voor thinking/verbose/trace op
   - laadt Skills-snapshot
   - roept `runEmbeddedPiAgent` aan (pi-agent-core-runtime)
   - zendt **lifecycle end/error** uit als de ingebedde loop er geen uitzendt
3. `runEmbeddedPiAgent`:
   - serialiseert runs via wachtrijen per sessie en globale wachtrijen
   - lost model en auth-profiel op en bouwt de Pi-sessie
   - abonneert zich op Pi-events en streamt assistant-/tool-delta's
   - dwingt timeout af -> breekt run af als die wordt overschreden
   - breekt voor Codex app-server-turns een geaccepteerde turn af die geen app-server-voortgang meer produceert vóór een terminaal event
   - retourneert payloads en gebruiksmetadata
4. `subscribeEmbeddedPiSession` overbrugt pi-agent-core-events naar de OpenClaw `agent`-stream:
   - tool-events => `stream: "tool"`
   - assistant-delta's => `stream: "assistant"`
   - lifecycle-events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` gebruikt `waitForAgentRun`:
   - wacht op **lifecycle end/error** voor `runId`
   - retourneert `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Wachtrijen + concurrency

- Runs worden geserialiseerd per sessiesleutel (sessiebaan) en optioneel via een globale baan.
- Dit voorkomt tool-/sessieraces en houdt sessiegeschiedenis consistent.
- Berichtenkanalen kunnen wachtrijmodi kiezen (collect/steer/followup) die dit baansysteem voeden.
  Zie [Command Queue](/nl/concepts/queue).
- Transcriptwrites worden ook beschermd door een sessiewritelock op het sessiebestand. De lock is
  procesbewust en bestandsgebaseerd, zodat hij writers opvangt die de in-process-wachtrij omzeilen of uit
  een ander proces komen.
- Sessiewritelocks zijn standaard niet-reentrant. Als een helper opzettelijk verwerving van
  dezelfde lock nestelt terwijl één logische writer behouden blijft, moet hij expliciet opt-innen met
  `allowReentrant: true`.

## Sessie- en workspace-voorbereiding

- Workspace wordt opgelost en aangemaakt; gesandboxte runs kunnen worden omgeleid naar een sandbox-workspace-root.
- Skills worden geladen (of hergebruikt uit een snapshot) en geïnjecteerd in env en prompt.
- Bootstrap-/contextbestanden worden opgelost en geïnjecteerd in het systeem-prompt-rapport.
- Er wordt een sessiewritelock verkregen; `SessionManager` wordt geopend en voorbereid vóór streaming. Elk
  later pad voor transcript-herschrijving, Compaction of afkapping moet dezelfde lock nemen voordat het transcriptbestand wordt geopend of
  gemuteerd.

## Promptopbouw + systeemprompt

- De systeemprompt wordt opgebouwd uit OpenClaw’s basisprompt, Skills-prompt, bootstrapcontext en overrides per run.
- Modelspecifieke limieten en gereserveerde tokens voor Compaction worden afgedwongen.
- Zie [Systeemprompt](/nl/concepts/system-prompt) voor wat het model ziet.

## Hookpunten (waar je kunt ingrijpen)

OpenClaw heeft twee hook-systemen:

- **Interne hooks** (Gateway-hooks): eventgedreven scripts voor opdrachten en lifecycle-events.
- **Plugin-hooks**: extensiepunten binnen de agent-/tool-lifecycle en gateway-pijplijn.

### Interne hooks (Gateway-hooks)

- **`agent:bootstrap`**: draait tijdens het bouwen van bootstrapbestanden voordat de systeemprompt definitief wordt gemaakt.
  Gebruik dit om bootstrap-contextbestanden toe te voegen of te verwijderen.
- **Opdrachthooks**: `/new`, `/reset`, `/stop` en andere opdrachtevents (zie Hooks-document).

Zie [Hooks](/nl/automation/hooks) voor installatie en voorbeelden.

### Plugin-hooks (agent- + gateway-lifecycle)

Deze draaien binnen de agent-loop of gateway-pijplijn:

- **`before_model_resolve`**: draait vóór de sessie (geen `messages`) om provider/model deterministisch te overriden vóór modelresolutie.
- **`before_prompt_build`**: draait na het laden van de sessie (met `messages`) om `prependContext`, `systemPrompt`, `prependSystemContext` of `appendSystemContext` te injecteren vóór promptinzending. Gebruik `prependContext` voor dynamische tekst per turn en systeemcontextvelden voor stabiele begeleiding die in systeempromptruimte moet staan.
- **`before_agent_start`**: legacy-compatibiliteitshook die in beide fasen kan draaien; geef de voorkeur aan de expliciete hooks hierboven.
- **`before_agent_reply`**: draait na inline acties en vóór de LLM-aanroep, zodat een Plugin de turn kan claimen en een synthetisch antwoord kan retourneren of de turn volledig kan dempen.
- **`agent_end`**: inspecteer de uiteindelijke berichtenlijst en runmetadata na voltooiing.
- **`before_compaction` / `after_compaction`**: observeer of annoteer Compaction-cycli.
- **`before_tool_call` / `after_tool_call`**: onderschep toolparameters/-resultaten.
- **`before_install`**: inspecteer ingebouwde scanbevindingen en blokkeer optioneel Skill- of Plugin-installaties.
- **`tool_result_persist`**: transformeer toolresultaten synchroon voordat ze naar een door OpenClaw beheerd sessietranscript worden geschreven.
- **`message_received` / `message_sending` / `message_sent`**: inkomende en uitgaande berichthooks.
- **`session_start` / `session_end`**: grenzen van de sessie-lifecycle.
- **`gateway_start` / `gateway_stop`**: gateway-lifecycle-events.

Beslisregels voor hooks voor uitgaande/toolguards:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de hook-API en registratiedetails.

Harnesses kunnen deze hooks anders aanpassen. De Codex app-server-harness houdt
OpenClaw Plugin-hooks aan als het compatibiliteitscontract voor gedocumenteerde gespiegeld
oppervlakken, terwijl Codex native hooks een afzonderlijk lager-niveau Codex-mechanisme blijven.

## Streaming + gedeeltelijke antwoorden

- Assistant-delta's worden gestreamd vanuit pi-agent-core en uitgezonden als `assistant`-events.
- Blokstreaming kan gedeeltelijke antwoorden uitzenden op `text_end` of `message_end`.
- Reasoning-streaming kan worden uitgezonden als aparte stream of als blokantwoorden.
- Zie [Streaming](/nl/concepts/streaming) voor chunking- en blokantwoordgedrag.

## Tooluitvoering + berichtentools

- Tool-start/update/end-events worden uitgezonden op de `tool`-stream.
- Toolresultaten worden gesanitized op grootte en afbeeldingspayloads voordat ze worden gelogd/uitgezonden.
- Verzendingen via berichtentools worden gevolgd om dubbele assistant-bevestigingen te onderdrukken.

## Antwoordvorming + onderdrukking

- Definitieve payloads worden samengesteld uit:
  - assistant-tekst (en optioneel reasoning)
  - inline toolsamenvattingen (wanneer verbose + toegestaan)
  - assistant-fouttekst wanneer het model fouten geeft
- De exacte stille token `NO_REPLY` / `no_reply` wordt uit uitgaande
  payloads gefilterd.
- Duplicaten van berichtentools worden uit de definitieve payloadlijst verwijderd.
- Als er geen renderbare payloads overblijven en een tool een fout gaf, wordt een fallback-toolfoutantwoord uitgezonden
  (tenzij een berichtentool al een gebruikerszichtbaar antwoord heeft verzonden).

## Compaction + retries

- Auto-Compaction zendt `compaction`-streamevents uit en kan een retry triggeren.
- Bij retry worden in-memory buffers en toolsamenvattingen gereset om dubbele uitvoer te voorkomen.
- Zie [Compaction](/nl/concepts/compaction) voor de Compaction-pijplijn.

## Eventstreams (vandaag)

- `lifecycle`: uitgezonden door `subscribeEmbeddedPiSession` (en als fallback door `agentCommand`)
- `assistant`: gestreamde delta's vanuit pi-agent-core
- `tool`: gestreamde tool-events vanuit pi-agent-core

## Afhandeling van chatkanalen

- Assistant-delta's worden gebufferd in chat-`delta`-berichten.
- Een chat-`final` wordt uitgezonden bij **lifecycle end/error**.

## Timeouts

- `agent.wait` standaard: 30s (alleen het wachten). Parameter `timeoutMs` overschrijft dit.
- Agent-runtime: `agents.defaults.timeoutSeconds` standaard 172800s (48 uur); afgedwongen in de aborttimer van `runEmbeddedPiAgent`.
- Cron-runtime: geïsoleerde agent-turn `timeoutSeconds` is eigendom van Cron. De scheduler start die timer wanneer uitvoering begint, breekt de onderliggende run af op de geconfigureerde deadline en voert daarna begrensde cleanup uit voordat de timeout wordt vastgelegd, zodat een verouderde onderliggende sessie de baan niet vast kan houden.
- Diagnostiek voor sessie-liveness: met diagnostiek ingeschakeld classificeert `diagnostics.stuckSessionWarnMs` langdurige `processing`-sessies die geen waargenomen antwoord-, tool-, status-, blok- of ACP-voortgang hebben. Actieve ingebedde runs, modelaanroepen en toolaanroepen rapporteren als `session.long_running`; actief werk zonder recente voortgang rapporteert als `session.stalled`; `session.stuck` is gereserveerd voor verouderde sessieboekhouding zonder actief werk, en alleen dat pad geeft de betrokken sessiebaan vrij zodat in wachtrij staand opstartwerk kan doorstromen. Herhaalde `session.stuck`-diagnostiek past backoff toe zolang de sessie ongewijzigd blijft.
- Model-idletimeout: OpenClaw breekt een modelrequest af wanneer er geen responsechunks binnenkomen vóór het idle-venster. `models.providers.<id>.timeoutSeconds` verlengt deze idle-watchdog voor trage lokale/self-hosted providers; anders gebruikt OpenClaw `agents.defaults.timeoutSeconds` wanneer geconfigureerd, standaard afgetopt op 120s. Door Cron getriggerde runs zonder expliciete model- of agenttimeout schakelen de idle-watchdog uit en vertrouwen op de buitenste Cron-timeout.
- HTTP-requesttimeout voor provider: `models.providers.<id>.timeoutSeconds` geldt voor de model-HTTP-fetches van die provider, inclusief connect, headers, body, SDK-requesttimeout, totale guarded-fetch-abortafhandeling en modelstream-idle-watchdog. Gebruik dit voor trage lokale/self-hosted providers zoals Ollama voordat je de hele agent-runtime-timeout verhoogt.

## Waar dingen vroegtijdig kunnen eindigen

- Agenttimeout (abort)
- AbortSignal (annuleren)
- Gateway-disconnect of RPC-timeout
- `agent.wait`-timeout (alleen wachten, stopt de agent niet)

## Gerelateerd

- [Tools](/nl/tools) — beschikbare agenttools
- [Hooks](/nl/automation/hooks) — eventgedreven scripts die worden getriggerd door agent-lifecycle-events
- [Compaction](/nl/concepts/compaction) — hoe lange gesprekken worden samengevat
- [Exec Approvals](/nl/tools/exec-approvals) — goedkeuringspoorten voor shellopdrachten
- [Thinking](/nl/tools/thinking) — configuratie van thinking-/reasoning-niveau

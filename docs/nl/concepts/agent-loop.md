---
read_when:
    - Je hebt een exacte stapsgewijze uitleg van de agentlus of levenscyclusgebeurtenissen nodig
    - Je wijzigt het in de wachtrij plaatsen van sessies, het schrijven van transcripten of het gedrag van schrijfvergrendelingen voor sessies
summary: Levenscyclus van de agentlus, streams en wachtsemantiek
title: Agentlus
x-i18n:
    generated_at: "2026-07-16T15:27:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3793a2c765c72f7f4bb8e790ce4d61abc279cf3a8a7367ecf8759428d0192279
    source_path: concepts/agent-loop.md
    workflow: 16
---

De agentlus is de geserialiseerde uitvoering per sessie die een bericht omzet in
acties en een antwoord: ontvangst, contextopbouw, modelinferentie, tooluitvoering,
streaming en persistentie.

## Toegangspunten

- Gateway-RPC: `agent` en `agent.wait`.
- CLI: `openclaw agent`.

## Uitvoeringsvolgorde

1. `agent`-RPC valideert parameters, herleidt de sessie (`sessionKey`/`sessionId`), slaat sessiemetadata persistent op en retourneert onmiddellijk `{ runId, acceptedAt }`.
2. `agentCommand` voert de beurt uit: bepaalt de standaardwaarden voor model + denken/uitgebreid/trace, laadt de Skills-snapshot, roept `runEmbeddedAgent` aan en verzendt een terugvalgebeurtenis **levenscycluseinde/-fout** als de ingebedde lus er nog geen heeft verzonden.
3. `runEmbeddedAgent`: serialiseert uitvoeringen via wachtrijen per sessie en globale wachtrijen, bepaalt model + authenticatieprofiel, bouwt de OpenClaw-sessie, abonneert zich op runtimegebeurtenissen, streamt assistent-/tooldelta's, handhaaft de uitvoeringstime-out (en breekt af wanneer deze verstrijkt) en retourneert payloads plus gebruiksmetadata. Voor beurten van de Codex-appserver breekt dit ook een geaccepteerde beurt af die vóór een eindgebeurtenis geen appservervoortgang meer produceert.
4. `subscribeEmbeddedAgentSession` koppelt runtimegebeurtenissen aan de `agent`-stream: toolgebeurtenissen aan `stream: "tool"`, assistentdelta's aan `stream: "assistant"`, levenscyclusgebeurtenissen aan `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) wacht op **levenscycluseinde/-fout** op een `runId` en retourneert `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Wachtrijen en gelijktijdigheid

Uitvoeringen worden per sessiesleutel (sessiebaan) geserialiseerd en optioneel via een globale baan geleid, waardoor conflicten tussen tools en sessies worden voorkomen. Berichtenkanalen kiezen een wachtrijmodus (steer/followup/collect/interrupt) die dit baansysteem voedt; zie [Opdrachtwachtrij](/nl/concepts/queue).

Het schrijven van transcripten wordt bovendien beschermd door een schrijfvergrendeling voor het sessiebestand. De vergrendeling is procesbewust en bestandsgebaseerd, zodat schrijvers worden onderschept die de wachtrij binnen het proces omzeilen of vanuit een ander proces komen. Schrijvers wachten maximaal `session.writeLock.acquireTimeoutMs` (standaard `60000` ms; omgevingsoverschrijving `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`) voordat ze melden dat de sessie bezet is.

Sessieschrijfvergrendelingen zijn standaard niet-herintreedbaar. Een helper die opzettelijk het verkrijgen van dezelfde vergrendeling nestelt en daarbij één logische schrijver behoudt, moet dit inschakelen met `allowReentrant: true`.

## Sessie- en werkruimtevoorbereiding

- De werkruimte wordt bepaald en aangemaakt; uitvoeringen in een sandbox kunnen worden omgeleid naar de hoofdmap van een sandboxwerkruimte.
- Skills worden geladen (of hergebruikt vanuit een snapshot) en in de omgeving en prompt geïnjecteerd.
- Bootstrap-/contextbestanden worden bepaald en in de systeemprompt geïnjecteerd.
- Een sessieschrijfvergrendeling wordt verkregen en het doel voor het sessietranscript wordt voorbereid voordat het streamen begint. Elk later pad voor het herschrijven, comprimeren of afkappen van het transcript moet dezelfde vergrendeling verkrijgen voordat de SQLite-transcriptrijen worden gewijzigd.

## Promptopbouw

De systeemprompt wordt opgebouwd uit de basisprompt van OpenClaw, de Skills-prompt, bootstrapcontext en overschrijvingen per uitvoering. Modelspecifieke limieten en gereserveerde tokens voor Compaction worden gehandhaafd. Zie [Systeemprompt](/nl/concepts/system-prompt) voor wat het model ziet.

## Hooks

OpenClaw heeft twee hooksystemen:

- **Interne hooks** (Gateway-hooks): gebeurtenisgestuurde scripts voor opdrachten en levenscyclusgebeurtenissen.
- **Plugin-hooks**: uitbreidingspunten binnen de levenscyclus van de agent/tools en de Gateway-pijplijn.

### Interne hooks (Gateway-hooks)

- **`agent:bootstrap`**: wordt uitgevoerd tijdens het opbouwen van bootstrapbestanden, voordat de systeemprompt definitief wordt gemaakt. Gebruik dit om bootstrapcontextbestanden toe te voegen of te verwijderen.
- **Opdrachthooks**: `/new`, `/reset`, `/stop` en andere opdrachtgebeurtenissen (zie de documentatie over hooks).

Zie [Hooks](/nl/automation/hooks) voor configuratie en voorbeelden.

### Plugin-hooks

Deze worden uitgevoerd binnen de agentlus of Gateway-pijplijn:

| Hook                                                    | Wordt uitgevoerd                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Vóór de sessie (zonder `messages`), om de provider/het model vóór de bepaling deterministisch te overschrijven.                                                                                                                                                                         |
| `before_prompt_build`                                   | Na het laden van de sessie (met `messages`), om vóór verzending `prependContext`, `systemPrompt`, `prependSystemContext` of `appendSystemContext` te injecteren. Gebruik `prependContext` voor dynamische tekst per beurt en de systeemcontextvelden voor stabiele richtlijnen die in de systeemprompt thuishoren. |
| `before_agent_start`                                    | Verouderde compatibiliteitshook die in beide fasen kan worden uitgevoerd; geef de voorkeur aan de expliciete hooks hierboven.                                                                                                                                                                  |
| `before_agent_reply`                                    | Na inline-acties, vóór de LLM-aanroep. Hiermee kan een Plugin de beurt claimen en een synthetisch antwoord retourneren of de beurt volledig stilhouden.                                                                                                                                        |
| `agent_end`                                             | Na voltooiing, met de definitieve berichtenlijst en uitvoeringsmetadata.                                                                                                                                                                                                                      |
| `before_compaction` / `after_compaction`                | Observeert of annoteert Compaction-cycli.                                                                                                                                                                                                                                                     |
| `before_tool_call` / `after_tool_call`                  | Onderschept toolparameters/-resultaten.                                                                                                                                                                                                                                                       |
| `before_install`                                        | Nadat het installatiebeleid van de operator is uitgevoerd, op klaargezet installatiebestand voor Skills/Plugins, wanneer Plugin-hooks in het huidige proces zijn geladen.                                                                                                                     |
| `tool_result_persist`                                   | Transformeert toolresultaten synchroon voordat ze naar een sessietranscript van OpenClaw worden geschreven.                                                                                                                                                                                   |
| `message_received` / `message_sending` / `message_sent` | Hooks voor inkomende en uitgaande berichten.                                                                                                                                                                                                                                                  |
| `session_start` / `session_end`                         | Grenzen van de sessielevenscyclus.                                                                                                                                                                                                                                                            |
| `gateway_start` / `gateway_stop`                        | Levenscyclusgebeurtenissen van de Gateway.                                                                                                                                                                                                                                                    |

Beslisregels voor hooks voor uitgaande berichten/tools:

- `before_tool_call`: `{ block: true }` is definitief en stopt handlers met een lagere prioriteit. `{ block: false }` doet niets en heft een eerdere blokkering niet op.
- `before_install`: dezelfde definitieve/geen-actie-semantiek als hierboven. Gebruik `security.installPolicy`, niet `before_install`, voor installatiebeslissingen van de operator over toestaan/blokkeren die installatie- en updatepaden via de CLI moeten omvatten.
- `message_sending`: `{ cancel: true }` is definitief en stopt handlers met een lagere prioriteit. `{ cancel: false }` doet niets en heft een eerdere annulering niet op.

Zie [Plugin-hooks](/nl/plugins/hooks) voor de hook-API en registratiedetails.

Harnassen kunnen deze hooks aanpassen. Het harnas voor de Codex-appserver behoudt OpenClaw-Plugin-hooks als het compatibiliteitscontract voor gedocumenteerde gespiegelde oppervlakken; systeemeigen Codex-hooks vormen een afzonderlijk Codex-mechanisme op lager niveau.

## Streaming

- Assistentdelta's worden vanuit de agentruntime gestreamd als `assistant`-gebeurtenissen.
- Blokstreaming kan gedeeltelijke antwoorden verzenden bij `text_end` of `message_end`.
- Streaming van redeneringen kan een afzonderlijke stream vormen of antwoorden blokkeren.
- Zie [Streaming](/nl/concepts/streaming) voor het opdelen in stukken en het gedrag van blokantwoorden.

## Tooluitvoering

- Gebeurtenissen voor het starten/bijwerken/beëindigen van tools worden op de `tool`-stream verzonden.
- Toolresultaten worden vóór logboekregistratie/verzending opgeschoond op grootte en afbeeldingspayloads.
- Verzendingen via berichtentools worden bijgehouden om dubbele bevestigingen van de assistent te onderdrukken.

## Antwoordvorming

Definitieve payloads worden samengesteld uit assistenttekst (plus optionele redenering), inline-toolsamenvattingen (indien uitgebreid en toegestaan) en assistentfouttekst wanneer het model een fout retourneert.

- Het exacte stilte-token `NO_REPLY` wordt uit uitgaande payloads gefilterd.
- Duplicaten van berichtentools worden uit de definitieve payloadlijst verwijderd.
- Als er geen weergeefbare payloads overblijven en een tool een fout heeft geretourneerd, wordt een terugvalantwoord voor de toolfout verzonden, tenzij een berichtentool al een voor de gebruiker zichtbaar antwoord heeft verzonden.

## Compaction en nieuwe pogingen

Automatische Compaction verzendt `compaction`-streamgebeurtenissen en kan een nieuwe poging activeren. Bij een nieuwe poging worden buffers in het geheugen en toolsamenvattingen opnieuw ingesteld om dubbele uitvoer te voorkomen. Zie [Compaction](/nl/concepts/compaction).

## Gebeurtenisstreams

- `lifecycle`: verzonden door `subscribeEmbeddedAgentSession` (en als terugval door `agentCommand`).
- `assistant`: gestreamde delta's vanuit de agentruntime.
- `tool`: gestreamde toolgebeurtenissen vanuit de agentruntime.

De Gateway projecteert levenscyclus- en toolstart-/eindgebeurtenissen naar het begrensde,
uitsluitend metadata bevattende [auditlogboek](/nl/cli/audit). Deze projectie registreert herkomst en
resultaatcodes zonder prompts, berichten, toolargumenten, toolresultaten
of onbewerkte fouten uit het transcript-/runtimepad te kopiëren.

## Afhandeling van chatkanalen

Assistentdelta's worden gebufferd in chatberichten van het type `delta`. Een chatbericht van het type `final` wordt verzonden bij **levenscycluseinde/-fout**.

## Time-outs

| Time-out                                          | Standaard                                | Opmerkingen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Alleen wachten; de parameter `timeoutMs` overschrijft dit. Stopt de onderliggende uitvoering niet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Agent-runtime (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Afgedwongen door de afbreektimer van `runEmbeddedAgent`. Stel `0` in voor een onbeperkt uitvoeringsbudget; bewaking van de activiteit van de modelstream blijft van toepassing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Geïsoleerde agentbeurt van Cron                         | beheerd door Cron                          | De planner start een eigen timer wanneer de uitvoering begint, breekt de uitvoering af op de geconfigureerde deadline en voert vervolgens begrensde opschoning uit voordat de time-out wordt geregistreerd, zodat een verouderde kindsessie de uitvoeringsbaan niet geblokkeerd kan houden.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Time-out bij inactiviteit van model                               | Cloud 120s; zelfgehost 300s           | OpenClaw breekt een modelaanvraag af wanneer vóór het verstrijken van het inactiviteitsvenster geen antwoordfragmenten binnenkomen. `models.providers.<id>.timeoutSeconds` verlengt deze inactiviteitsbewaking voor trage lokale/zelfgehoste providers, maar blijft begrensd door een eventuele lagere eindige `agents.defaults.timeoutSeconds` of uitvoeringsspecifieke time-out, omdat die de volledige agentuitvoering bepalen. Bij onbeperkte uitvoeringsbudgetten blijft de inactiviteitsbewaking voor de providerklasse actief. Door Cron geactiveerde uitvoeringen van cloudmodellen zonder expliciete time-out voor het model/de agent gebruiken dezelfde standaardwaarde; met een expliciete time-out voor de Cron-uitvoering worden vastgelopen cloudmodelstreams begrensd op 60s, zodat geconfigureerde model-fallbacks nog vóór de buitenste Cron-deadline kunnen worden uitgevoerd. Door Cron geactiveerde uitvoeringen op daadwerkelijk lokale eindpunten (loopback/privé-baseUrl) behouden de lokale mogelijkheid om de inactiviteitsbewaking uit te schakelen; zelfgehoste providers op netwerk-baseUrls krijgen de impliciete bewaking van 300s. Met een expliciete time-out voor de Cron-uitvoering worden vastgelopen lokale/zelfgehoste processen begrensd op die time-out. Stel `models.providers.<id>.timeoutSeconds` in voor trage lokale providers. |
| Time-out voor HTTP-aanvraag aan provider                    | `models.providers.<id>.timeoutSeconds` | Omvat verbinding, headers, body, time-out voor SDK-aanvragen, afbreekafhandeling van guarded-fetch en de inactiviteitsbewaking van de modelstream voor die provider. Gebruik dit voor trage lokale/zelfgehoste providers (bijvoorbeeld Ollama) voordat je de time-out voor de volledige agent-runtime verhoogt; houd de time-out voor de agent/runtime minstens even hoog wanneer de modelaanvraag langer moet kunnen worden uitgevoerd.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Diagnose van vastgelopen sessies

Als diagnostiek is ingeschakeld, classificeert `diagnostics.stuckSessionWarnMs` (standaard `120000` ms) langdurige `processing`-sessies zonder waargenomen voortgang in antwoorden, tools, statussen, blokkeringen of ACP:

- Actieve ingebedde uitvoeringen, modelaanroepen en toolaanroepen worden gerapporteerd als `session.long_running`. Beheerde stille modelaanroepen blijven `session.long_running` tot `diagnostics.stuckSessionAbortMs`, zodat trage of niet-streamende providers niet te vroeg als vastgelopen worden gemarkeerd.
- Actief werk zonder recente voortgang wordt gerapporteerd als `session.stalled`. Beheerde modelaanroepen schakelen op of na de afbreekdrempel over naar `session.stalled`; verouderde model-/toolactiviteit zonder eigenaar wordt niet verborgen als langdurig actief.
- `session.stuck` is gereserveerd voor herstelbare verouderde sessieboekhouding, waaronder inactieve sessies in de wachtrij met verouderde model-/toolactiviteit zonder eigenaar.

`diagnostics.stuckSessionAbortMs` is standaard minstens 5 minuten en 3x de waarschuwingsdrempel. Verouderde sessieboekhouding geeft de betreffende sessiebaan onmiddellijk vrij nadat de herstelcontroles zijn geslaagd; vastgelopen ingebedde uitvoeringen worden pas na de afbreekdrempel afgebroken en leeggemaakt, zodat werk in de wachtrij wordt hervat zonder uitvoeringen af te breken die alleen maar traag zijn. Herstel genereert gestructureerde aangevraagde/voltooide resultaten; de diagnostische status wordt alleen als inactief gemarkeerd als dezelfde verwerkingsgeneratie nog steeds actueel is, en herhaalde `session.stuck`-diagnostiek past exponentiële vertraging toe zolang de sessie ongewijzigd blijft.

## Waar processen voortijdig kunnen eindigen

- Time-out van agent (afbreken)
- AbortSignal (annuleren)
- Verbinding met Gateway verbroken of RPC-time-out
- Time-out van `agent.wait` (alleen wachten, stopt de agent niet)

## Gerelateerd

- [Tools](/nl/tools) - beschikbare tools voor agents
- [Hooks](/nl/automation/hooks) - gebeurtenisgestuurde scripts die worden geactiveerd door levenscyclusgebeurtenissen van agents
- [Compaction](/nl/concepts/compaction) - hoe lange gesprekken worden samengevat
- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals) - goedkeuringspoorten voor shellopdrachten
- [Denken](/nl/tools/thinking) - configuratie van het denk-/redeneerniveau

---
read_when:
    - Cloudworkers bedienen of fouten opsporen die door de Gateway zijn gestart
    - Toelating van workers, sessietoewijzing of isolatie van lokale tools verifiëren
summary: Interne operatorreferentie voor de beperkte cloudworker-runtime
title: Werker
x-i18n:
    generated_at: "2026-07-16T15:40:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` is het beperkte runtime-ingangspunt dat een cloudworker-
orchestrator binnen een voorbereide workeromgeving kan starten. Het is geen
algemene opdracht voor handmatige workerregistratie.

De Gateway installeert de bijpassende OpenClaw-bundel en opent de omgekeerde
SSH-tunnel met vastgezette hostsleutel. Het workerstartprogramma start deze
opdracht met een voorbereide toewijzing. De opdracht maakt via de door de tunnel
doorgestuurde lokale socket verbinding en wordt toegelaten met de specifieke rol
`worker`.

## Startcontract

De opdracht leest precies één begrensde JSON-startenvelop van standaardinvoer.
De envelop bevat de locatie van de lokale socket, de aangemaakte
workerreferentie, de bundel- en protocolidentiteit, de eigenaarsepoch en de ene
toegewezen sessie en beurt. De referentie wordt nooit geaccepteerd via
opdrachtregelargumenten en deze pagina bevat opzettelijk geen voorbeeld van een
referentie of handmatig opgestelde envelop.

Toelating wordt veilig geweigerd als de envelop ongeldig is, de referentie wordt
afgewezen, de bundel- of protocolfuncties niet overeenkomen, of de sessie en
eigenaarsepoch niet meer actueel zijn. Operators moeten workers starten via de
cloudworker-orchestrator in plaats van dit ingangspunt rechtstreeks aan te
roepen.

## Runtimegrens

Het proces voert de normale ingebedde agentlus uit met een beperkte backend:

- De codeertools `read`, `write`, `edit`, `apply_patch`, `exec` en `process`
  worden lokaal uitgevoerd in de workerwerkruimte.
- Modelaanroepen gebruiken de inferentieproxy van de Gateway. Er wordt geen lokaal
  modelauthenticatieprofiel geladen.
- Transcripties worden geschreven via de transcript-commit-RPC van de Gateway.
- Streaming- en levenscyclusupdates van tools gebruiken de live-event-RPC van de Gateway.
- Alleen de toegewezen sessie en beurt worden geaccepteerd.

De workermodus start geen kanalen, HTTP-oppervlakken van de Gateway of
automatisch gestarte plugins buiten de toolset van de toegewezen sessie. Deze
modus gebruikt een tijdelijke statusmap en heeft geen permanente provider- of
forge-referenties.

Het doorsturen van sessies van worker naar worker is in deze modus niet
beschikbaar. Plaatsing en doorsturen blijven eigendom van de Gateway: een
operator kan een bestaande lokale sessie met een beheerde worktree via de
Gateway doorsturen, terwijl een workerproces zichzelf of een andere worker niet
kan doorsturen.

De voorbereide toewijzing bevat de transcriptcontext, het geaccepteerde
basisblad, de commitreeks en de live-eventcursor. Wanneer de tunnel opnieuw
verbinding maakt, wordt het proces opnieuw toegelaten met dezelfde referentie en
eigenaarsepoch, behoudt het de geaccepteerde transcriptbasis, speelt het de niet-
bevestigde staart van live-events opnieuw af en koppelt het een lopende
inferentiebeurt opnieuw met dezelfde identiteit. Het afsluitende inferentiebericht
is gezaghebbend als gestreamde delta's zijn gemist. Een vervangende
eigenaarsepoch schermt het proces af en zorgt voor een nette afsluiting.

Een transcriptweigering van `stale-base-leaf` stopt de huidige uitvoering
onmiddellijk. De workermodus probeert de geweigerde reeks niet opnieuw tegen een
ander blad, zodat geen dubbele commit wordt geproduceerd; een nog niet
vastgelegde staart in het geheugen van die uitvoering gaat verloren. Opnieuw
starten behoort toe aan de plaatsingseigenaar van mijlpaal 3, die een nieuwe
toewijzing moet maken op basis van het gezaghebbende transcript en
commitregister van de Gateway. Ook beëindigt een herstart van het Gateway-proces
een wachtende inferentiebeurt met een providerfout; alleen een herverbinding van
de tunnel of de worker-WebSocket kan zich opnieuw koppelen aan een actieve
inferentiestroom binnen hetzelfde proces.

Zie [Gateway-protocol](/nl/gateway/protocol#worker-role-and-closed-protocol) voor het
gesloten worker-RPC-oppervlak en [Plan voor cloudworkers](/nl/plan/cloud-workers)
voor het architectuur- en beveiligingsmodel.

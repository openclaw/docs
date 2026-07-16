---
read_when:
    - Je moet kunnen beantwoorden wie een agent of tool heeft uitgevoerd, wanneer die is uitgevoerd en hoe de uitvoering is geëindigd.
    - Je hebt inhoudsvrije levenscyclusmetadata voor inkomende of uitgaande berichten nodig
    - Je hebt een begrensde, veilig geanonimiseerde activiteitsexport nodig
summary: CLI-referentie voor auditrecords van de levenscyclus van uitvoeringen, tools en berichten met alleen metadata
title: Auditrecords
x-i18n:
    generated_at: "2026-07-16T15:18:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Doorzoek het uitsluitend uit metadata bestaande auditlogboek van de Gateway voor agentruns, toolacties en
optionele records over de levenscyclus van berichten.

Het logboek is standaard ingeschakeld voor run- en toolgebeurtenissen. Stel
[`audit.enabled: false`](/nl/gateway/configuration-reference#audit) in en herstart de
Gateway om alle nieuwe gebeurtenisrecords te stoppen. Berichtrecords zijn afzonderlijk standaard
uitgeschakeld; stel `audit.messages` in op `direct` of `all` en herstart de Gateway om
ze vast te leggen. Bestaande records blijven doorzoekbaar totdat ze verlopen (30 dagen).

Het logboek staat los van gesprekstranscripten: het legt identiteit,
volgorde, herkomst, actie, status en genormaliseerde resultaatcodes vast, maar slaat nooit
inhoud op, en bericht-ID's verschijnen alleen als installatiegebonden
gepseudonimiseerde waarden met sleutel. [Auditgeschiedenis](/gateway/audit) beheert het volledige gegevensmodel,
de privacysemantiek, opslag- en bewaarlimieten en dekkingsbeperkingen; deze pagina
behandelt de opdrachtinterface.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## Filters

- `--agent <id>`: exacte agent-ID
- `--session <key>`: exacte sessiesleutel
- `--run <id>`: exacte run-ID
- `--kind <kind>`: `agent_run`, `tool_action` of `message`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` of `unknown`
- `--direction <direction>`: berichtrichting, `inbound` of `outbound`
- `--channel <channel>`: exact berichtkanaal
- `--after <timestamp>` / `--before <timestamp>`: inclusief ISO-tijdstempel of
  Unix-milliseconden
- `--limit <count>`: paginagrootte van 1 tot 500; standaard `100`
- `--cursor <sequence>`: ga verder met een eerdere zoekopdracht met nieuwste eerst
- `--json`: druk de begrensde pagina af als JSON

De CLI doorzoekt de geversioneerde activiteits-RPC, zodat één opdracht het volledige
geconfigureerde logboek toont. Tekstuitvoer toont tijd, soort, richting, kanaal, status,
agent, run en actie. Ontbrekende berichtherkomst wordt weergegeven als `-`; OpenClaw
verzint geen agent- of run-ID's. Toolacties tonen ook de toolnaam. JSON-
uitvoer bevat `nextCursor` wanneer er nog een pagina bestaat. Geef die waarde door aan
`--cursor` om door te gaan zonder records die tijdens het pagineren binnenkomen opnieuw te ordenen.

Deze exports blijven gevoelige operationele metadata, ook al ontbreken berichtteksten
en onbewerkte velden voor berichtidentiteit. Agent-, sessie- en run-ID's, tijdstippen,
kanalen, resultaten en stabiele HMAC-verwijzingen kunnen activiteiten correleren. Bescherm
ze met dezelfde toegangscontroles en bewaarmethoden als andere
operatorrecords.

## Vastgelegde gebeurtenissen

De Gateway projecteert vertrouwde levenscyclusstromen in zes acties:

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

Elk geretourneerd record heeft een stabiele gebeurtenis-ID, een monotoon oplopend
logboekvolgnummer, een levenscyclustijdstempel, actor, actie, status, een
`schemaVersion: 1`-markering, bronvolgnummer en `redaction: "metadata_only"`.
Herkomstgegevens van agent/sessie/run en gebeurtenisspecifieke velden zijn alleen aanwezig wanneer
de vertrouwde bron ze aanlevert. Berichtrecords laten bewust
`sessionKey` en `sessionId` weg, waardoor `--session` alleen run- en toolrecords filtert.

Afgesloten run- en toolrecords onderscheiden succes, mislukking, annulering,
time-out en beleidsblokkeringen met afgesloten status- en foutcodes. `unknown` is een
expliciet niet-succesvol resultaat wanneer een bovenliggende runtime geen
gezaghebbend eindresultaat beschikbaar stelt. Toolaanroep-ID's worden alleen als stabiele
vingerafdrukken geëxporteerd. Toolnamen moeten overeenkomen met het contract voor compacte
modelgerichte namen; andere waarden worden `unknown`.

Berichtrecords voegen richting, kanaal, gesprekstype, resultaat en
optioneel leveringstype, mislukkingsfase, duur, resultaataantal, genormaliseerde
redencode en gepseudonimiseerde account-/gespreks-/bericht-/doelwaarden met sleutel toe. De
huidige grens voor inkomende berichten omvat geaccepteerde berichten die de kerndispatch bereiken,
inclusief dubbele kernverwerking en definitieve verwerkingsresultaten. De grens voor uitgaande
berichten schrijft één definitieve rij per oorspronkelijke logische antwoordpayload die
gedeelde duurzame levering bereikt; opsplitsing in delen en adapterfan-out worden samengevoegd in
`resultCount`. Herhaalbare of ambigue verzendingen in de wachtrij worden pas vastgelegd nadat een
bevestiging, dead letter of reconciliatie het resultaat definitief maakt.
Plugin-lokale en directe verzendpaden die deze gedeelde grenzen omzeilen, worden nog
niet gedekt; het ontbreken van een rij bewijst niet dat er geen bericht bestond.

Het auditlogboek vervangt geen transcripten, taakgeschiedenis, Cron-rungeschiedenis
of logbestanden. Het biedt een kleine index over meerdere runs voor vragen van operators zonder
gespreksinhoud naar een andere opslag te kopiëren.

Voor inkomende rijen meet `durationMs` de kerndispatch en telt `resultCount`
definitief verwerkte tool-, blokkerings- en antwoordpayloads in de wachtrij. Voor uitgaande rijen
omvat `durationMs` het eigenaarschap van de levering tot aan het definitieve resultaat (en dus
de wachttijd in de wachtrij), terwijl `resultCount` geïdentificeerde fysieke verzendingen via het platform
telt. `deliveryKind` beschrijft, indien aanwezig, de effectieve payload na hooks en
rendering; onderdrukte rijen en rijen met een ambigu resultaat door een crash laten dit weg.

## Gateway-RPC

`audit.activity.list` vereist `operator.read` en accepteert dezelfde filters. Deze
retourneert de benoemde V1-unie van activiteitsgebeurtenissen, inclusief records voor runs, tools, inkomende berichten
en uitgaande berichten.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

Het resultaat is `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.
Resultaten staan met de nieuwste eerst en zijn beperkt tot 500 records per aanvraag.

De meegeleverde `audit.list`-RPC blijft ongewijzigd voor oudere run-/toolclients. Wanneer
`audit.activity.list` niet beschikbaar is op een oudere Gateway, probeert de CLI
`audit.list` alleen opnieuw als elk aangevraagd filter door die verouderde methode wordt ondersteund. `--kind message`,
`--direction` en `--channel` mislukken op een oudere Gateway met een upgrademelding
in plaats van stilzwijgend te worden genegeerd.

## Gerelateerd

- [Auditgeschiedenis](/gateway/audit)
- [Gateway-protocol](/nl/gateway/protocol#audit-ledger-rpc)
- [Sessies](/nl/cli/sessions)
- [Taken](/nl/cli/tasks)
- [Cron-taken](/nl/automation/cron-jobs)

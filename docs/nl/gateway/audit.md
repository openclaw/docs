---
read_when:
    - Je hebt een duurzaam logboek nodig van wat de Gateway heeft gedaan, zonder inhoud op te slaan
    - Je beslist of je auditing van de berichtlevenscyclus wilt inschakelen
    - Je moet uitleggen wat auditrecords wel en niet bewijzen
summary: Auditgeschiedenis met alleen metadata voor agentruns, toolacties en optionele berichtlevenscycli
title: Auditgeschiedenis
x-i18n:
    generated_at: "2026-07-16T15:47:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Auditgeschiedenis

De Gateway houdt een begrensd auditlogboek met uitsluitend metadata bij in de gedeelde OpenClaw-
statusdatabase. Het beantwoordt operationele vragen zoals "welke agent is uitgevoerd,
wanneer, en hoe is de uitvoering geëindigd", "welke toolacties heeft een uitvoering uitgevoerd" en, wanneer
berichtauditing is ingeschakeld, "heeft een geaccepteerd inkomend bericht de dispatch bereikt"
en "heeft een uitgaand bericht een definitieve afleveringsstatus bereikt".

Het logboek slaat identiteit, volgorde, herkomst, actie, status en
genormaliseerde resultaatcodes op. Het slaat nooit prompts, berichtinhoud, tool-
argumenten, toolresultaten, bijlagen, bestandsnamen, URL's, opdrachtuitvoer of onbewerkte
fouttekst op.

## Recordfamilies

Uitvoerings- en toolgebeurtenissen worden vastgelegd wanneer auditing is ingeschakeld (de standaardinstelling).
Gebeurtenissen in de levenscyclus van berichten zijn optioneel en standaard uitgeschakeld.

| Familie      | Acties                                                   | Standaard |
| ------------ | -------------------------------------------------------- | --------- |
| Agentuitvoeringen | `agent.run.started`, `agent.run.finished`                | aan       |
| Toolacties   | `tool.action.started`, `tool.action.finished`            | aan       |
| Berichten    | `message.inbound.processed`, `message.outbound.finished` | uit       |

Elk record bevat een stabiele gebeurtenis-id, een monotone logboekvolgorde, een
tijdstempel van de levenscyclus, actor, actie, status, `schemaVersion: 1` en
`redaction: "metadata_only"`. Zie [Auditrecords](/cli/audit) voor het volledige
veldenoverzicht en de queryfilters.

## Gebeurtenissen in de berichtlevenscyclus

Stel [`audit.messages`](/nl/gateway/configuration-reference#audit) in om te kiezen wat
wordt vastgelegd en start daarna de Gateway opnieuw:

- `off` (standaard): geen berichtrecords.
- `direct`: alleen berichten in directe gesprekken.
- `all`: directe, groeps- en kanaalberichten.

Twee gezaghebbende grenzen produceren berichtrecords:

- **Inkomende** rijen worden geschreven wanneer een geaccepteerd bericht de kerndispatch bereikt,
  inclusief dubbele en definitieve verwerkingsresultaten.
- **Uitgaande** rijen worden geschreven wanneer gedeelde duurzame aflevering een
  definitief resultaat bereikt: verzonden, onderdrukt, mislukt of een expliciete `unknown` voor
  verzendingen met een door een crash veroorzaakte onduidelijke status. Wachtrijherstel en dead-letter-resultaten zijn inbegrepen.
  Elke oorspronkelijke logische antwoordpayload krijgt één definitieve rij; opdeling in segmenten en
  adapterfan-out worden samengevoegd in `resultCount`.

### Classificatie van gesprekstype

De modus `direct` vormt een privacygrens, dus een bericht wordt alleen als een direct
gesprek geclassificeerd wanneer bestemmingsgegevens dit bewijzen: het verzendpad heeft
het gesprekstype van de bestemming opgegeven, of de routespecificatie van de afleveringssessie noemt exact
het kanaal en de peer waaraan wordt afgeleverd. Zwakkere signalen, zoals beleidsstatus
of het oorspronkelijke gesprek, kunnen een bericht classificeren als `group` (waardoor
het van `direct`-verzameling wordt uitgesloten), maar kunnen nooit `direct` claimen. Berichten waarvan
niet kan worden bewezen dat ze direct zijn, worden geclassificeerd als `unknown` en niet vastgelegd in
de modus `direct`. Kanalen die geen chattypen opgeven, kunnen daarom
minder rijen vastleggen in de modus `direct` dan in de modus `all`.

## Privacymodel

Berichtrijen slaan nooit onbewerkte platform-id's op. Account-, gespreks-,
bericht- en doel-id's worden, wanneer correlatie beschikbaar is, alleen geëxporteerd
als installatielokale pseudoniemen met een sleutel
(`hmac-sha256:v1:<keyId>:<digest>`):

- De HMAC-sleutel wordt bij het eerste gebruik gegenereerd, wordt per id-
  type domeingescheiden en bevindt zich in dezelfde statusdatabase als het logboek.
- Pseudoniemen zijn stabiel binnen één installatie, zodat rijen over hetzelfde
  gesprek kunnen worden gecorreleerd zonder de platform-id prijs te geven.
- Dit is **correlatie, geen anonimisering**: iedereen met leestoegang tot de
  statusdatabase heeft ook de sleutel en kan mogelijke onbewerkte id's
  toetsen aan de pseudoniemen. RPC- en CLI-exports bevatten de sleutel nooit.
- Als het sleutelmateriaal ontbreekt of beschadigd is terwijl berichtrijen worden bewaard,
  weigert de Gateway veilig verder te werken en verwijdert deze nieuwe berichtrecords in plaats van stilzwijgend
  over te schakelen op een nieuwe sleutel, wat de correlatie zou opsplitsen.

Uitvoerings- en toolrecords behouden `sessionKey` en `sessionId` voor correlatie;
canonieke sessiesleutels kunnen zelf platformaccount- of peer-id's bevatten.
Berichtrecords laten beide bewust weg.

Auditexports blijven gevoelige operationele metadata, zelfs zonder inhoud:
tijdstippen, kanalen, resultaten en stabiele pseudoniemen kunnen activiteit correleren.
Bescherm exports met dezelfde toegangscontroles en bewaarmethoden als andere
operatorrecords.

## Dekkings- en bewijslimieten

Het logboek werkt naar beste vermogen en is bewust begrensd. Beschouw het als bewijs van
wat is vastgelegd, niet als bewijs van wat is gebeurd:

- **Het ontbreken van een rij bewijst niets.** Vóór toelating geweigerde inkomende berichten, verzendingen vanuit
  CLI-processen zonder actieve Gateway-recorder en plugin-lokale of
  directe verzendpaden die gedeelde duurzame aflevering omzeilen, laten geen record achter.
- Schrijfbewerkingen lopen via een begrensde achtergrondworker; bij uitval van de worker of verzadiging van de
  wachtrij worden records verwijderd en wordt één operationele waarschuwing vastgelegd.
- Uitgaande verzendingen met een door een crash veroorzaakte onduidelijke status worden vastgelegd als `unknown` in plaats van
  verzonnen resultaten.

Dit logboek ondersteunt foutopsporing en operationele controle. Het is geen verliesvrij
compliancearchief; als je dat nodig hebt, gebruik dan een extern systeem dat wordt gevoed door
[OpenTelemetry](/nl/gateway/opentelemetry) of tooling op kanaalniveau.

## Opslag, bewaring en migratie

Records bevinden zich in de gedeelde statusdatabase (`state/openclaw.sqlite`) en worden
buiten het kritieke afleveringspad geschreven. Query's retourneren nooit records ouder dan 30
dagen en het logboek is begrensd op 100,000 rijen; verlopen rijen worden verwijderd tijdens
het opstarten, elk uur uitgevoerd onderhoud en latere schrijfbewerkingen. Bewaaronderhoud blijft
actief, zelfs wanneer verzameling is uitgeschakeld.

Bij een upgrade vanaf een Gateway met het eerdere logboek dat alleen uitvoerings- en toolrecords bevatte, wordt het
schema automatisch gemigreerd tijdens het opstarten (of via `openclaw doctor --fix`); bestaande
rijen en hun logboekvolgorden blijven behouden.

## Query's uitvoeren

- CLI: [`openclaw audit`](/cli/audit) met filters voor agent, sessie, uitvoering,
  type, status, richting, kanaal, tijdsgrenzen en cursorpaginering.
- Gateway-RPC: `audit.activity.list` (vereist `operator.read`) retourneert de
  geversioneerde V1-unie van activiteitsgebeurtenissen; de uitgebrachte RPC `audit.list` blijft ongewijzigd
  voor oudere uitvoerings-/toolclients. Zie
  [Gateway-protocol](/nl/gateway/protocol#audit-ledger-rpc).

## Gerelateerd

- [CLI voor auditrecords](/cli/audit)
- [Configuratiereferentie](/nl/gateway/configuration-reference#audit)
- [Gateway-protocol](/nl/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/nl/gateway/opentelemetry)

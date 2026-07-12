---
read_when:
    - Een gebruiker meldt dat agents vastlopen en toolaanroepen blijven herhalen
    - Je moet de beveiliging tegen herhaalde aanroepen afstemmen
    - Je bewerkt beleid voor agenttools en runtimeomgevingen
    - Je krijgt te maken met `compaction_loop_persisted` afbrekingen na een nieuwe poging wegens contextoverschrijding
summary: Guardrails inschakelen en afstemmen die repetitieve lussen van toolaanroepen detecteren
title: Detectie van tool-lussen
x-i18n:
    generated_at: "2026-07-12T09:30:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw heeft twee samenwerkende beveiligingen tegen herhalende patronen van toolaanroepen,
beide geconfigureerd onder `tools.loopDetection`:

1. **Lusdetectie** (`enabled`) - standaard uitgeschakeld. Bewaakt de voortschrijdende
   geschiedenis van toolaanroepen op herhalende patronen en nieuwe pogingen met onbekende tools.
2. **Beveiliging na Compaction** (`postCompactionGuard`) - ingeschakeld zolang
   `enabled` niet expliciet `false` is. Wordt na elke nieuwe poging na Compaction geactiveerd en
   breekt de uitvoering af als de agent binnen het venster hetzelfde drietal `(tool, args, result)`
   herhaalt.

Stel `tools.loopDetection.enabled: false` in om beide beveiligingen uit te schakelen.

## Waarom dit bestaat

- Herhalende reeksen detecteren die geen voortgang boeken.
- Hoogfrequente lussen zonder resultaat detecteren (dezelfde tool, dezelfde invoer, herhaalde
  fouten).
- Specifieke patronen van herhaalde aanroepen voor bekende pollingtools detecteren.
- Cycli van contextoverschrijding -> Compaction -> dezelfde lus doorbreken in plaats van ze
  onbeperkt te laten doorgaan.

## Configuratieblok

Globale standaardwaarden, met elk gedocumenteerd veld weergegeven:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // hoofdschakelaar voor de detectoren met voortschrijdende geschiedenis
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // geactiveerd na een nieuwe poging na Compaction; actief tenzij enabled expliciet false is
      },
    },
  },
}
```

Overschrijving per agent (optioneel, bij `agents.list[].tools.loopDetection`):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

Instellingen per agent worden veld voor veld over het globale blok heen gelegd (inclusief geneste
`detectors` en `postCompactionGuard`), zodat een agent alleen de velden hoeft in te stellen
die moeten worden gewijzigd.

### Gedrag van velden

| Veld                             | Standaard | Effect                                                                                                                                                                                        |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`   | Hoofdschakelaar voor de detectoren met voortschrijdende geschiedenis. `false` schakelt ook de beveiliging na Compaction uit.                                                                    |
| `historySize`                    | `30`      | Aantal recente toolaanroepen dat voor analyse wordt bewaard.                                                                                                                                  |
| `warningThreshold`               | `10`      | Aantal herhalingen voordat een patroon als alleen een waarschuwing wordt geclassificeerd.                                                                                                      |
| `criticalThreshold`              | `20`      | Aantal herhalingen waarbij een luspatroon zonder voortgang wordt geblokkeerd. De runtime begrenst dit boven `warningThreshold` als het verkeerd is geconfigureerd.                              |
| `unknownToolThreshold`           | `10`      | Blokkeert na dit aantal mislukte pogingen herhaalde aanroepen van dezelfde niet-beschikbare tool. Niet afhankelijk van `detectors`.                                                            |
| `globalCircuitBreakerThreshold`  | `30`      | Globale onderbreker voor ontbrekende voortgang over alle detectoren heen. De runtime begrenst dit boven `criticalThreshold` als het verkeerd is geconfigureerd. Niet afhankelijk van `detectors`. |
| `detectors.genericRepeat`        | `true`    | Waarschuwt bij herhaalde aanroepen met dezelfde tool en dezelfde argumenten; blokkeert zodra die aanroepen ook identieke resultaten retourneren.                                               |
| `detectors.knownPollNoProgress`  | `true`    | Detecteert bekende pollingpatronen zonder voortgang (`process` met `action: "poll"`/`"log"`, `command_status`).                                                                                |
| `detectors.pingPong`             | `true`    | Detecteert afwisselende pingpongpatronen zonder voortgang tussen twee aanroepen.                                                                                                               |
| `postCompactionGuard.windowSize` | `3`       | Aantal pogingen waarvoor de beveiliging na Compaction actief blijft, en het aantal identieke drietallen waarna de uitvoering wordt afgebroken.                                                 |

Voor `exec` vergelijkt de hashing voor ontbrekende voortgang stabiele opdrachtresultaten (status,
afsluitcode, time-outvlag, uitvoer) en negeert deze vluchtige runtimemetadata zoals
duur, PID, sessie-id en werkmap. Resultaten van uitgaande berichtverzendingen
worden gehasht zonder vluchtige id's per aanroep (bericht-id, bestands-id, tijdstempel),
zodat een resultaat "verzonden" niet identiek lijkt aan een ander resultaat "verzonden".
Wanneer een uitvoerings-id beschikbaar is, wordt de geschiedenis alleen binnen die uitvoering geëvalueerd,
zodat geplande Heartbeat-cycli en nieuwe uitvoeringen geen verouderde lustellingen
van eerdere uitvoeringen overnemen.

## Aanbevolen configuratie

- Stel voor kleinere modellen `enabled: true` in en laat de drempelwaarden op hun
  standaardwaarden staan. Toonaangevende modellen hebben detectie via voortschrijdende geschiedenis zelden nodig en kunnen
  de hoofdschakelaar op `false` laten staan, terwijl ze nog steeds profiteren van de
  beveiliging na Compaction.
- Houd de drempelwaarden in de volgorde `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`; de runtime verhoogt `criticalThreshold` en
  `globalCircuitBreakerThreshold` als u ze instelt op of onder de
  drempelwaarde die ze moeten overschrijden.
- Als er fout-positieven optreden:
  - Verhoog `warningThreshold` en/of `criticalThreshold`.
  - Verhoog eventueel `globalCircuitBreakerThreshold`.
  - Schakel alleen de specifieke detector uit die problemen veroorzaakt (`detectors.<name>: false`).
  - Verlaag `historySize` voor een korter historisch venster.
- Stel expliciet `tools.loopDetection.enabled: false` in om alles uit te schakelen,
  inclusief de beveiliging na Compaction.

## Beveiliging na Compaction

Na een nieuwe poging met Compaction na een contextoverschrijding activeert de uitvoerder een
beveiliging met een kort venster voor de eerstvolgende toolaanroepen. Als de agent hetzelfde
drietal `(toolName, argsHash, resultHash)` binnen dat venster
`postCompactionGuard.windowSize` keer uitvoert, concludeert de beveiliging dat Compaction de
lus niet heeft doorbroken en breekt deze de uitvoering af met een fout `compaction_loop_persisted`.

De beveiliging wordt aangestuurd door de hoofdvlag `tools.loopDetection.enabled`, met één
bijzonderheid: deze blijft **ingeschakeld wanneer de vlag niet is ingesteld of `true` is**, en wordt alleen
uitgeschakeld wanneer de vlag expliciet `false` is. Dit is opzettelijk: de beveiliging
bestaat om aan Compaction-lussen te ontsnappen die anders onbeperkt tokens zouden verbruiken,
zodat een gebruiker zonder configuratie toch wordt beschermd.

```json5
{
  tools: {
    loopDetection: {
      // hoofdschakelaar; stel in op false om de beveiliging samen met de voortschrijdende detectoren uit te schakelen
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // standaard
      },
    },
  },
}
```

- Een lagere `windowSize` is strenger (minder pogingen vóór afbreken).
- Een hogere `windowSize` geeft de agent meer herstelpogingen.
- De beveiliging breekt nooit af zolang resultaten veranderen; alleen byte-identieke
  resultaten binnen het venster activeren deze.
- De beveiliging wordt alleen direct na een nieuwe poging met Compaction geactiveerd, niet op andere
  momenten tijdens een uitvoering.

<Note>
  De beveiliging na Compaction wordt uitgevoerd zolang de hoofdvlag niet expliciet `false` is, zelfs als u nooit een blok `tools.loopDetection` hebt geschreven. Zoek ter controle direct na een Compaction-gebeurtenis naar `post-compaction guard armed for N attempts` in het Gateway-logboek.
</Note>

## Logboeken en verwacht gedrag

Wanneer een lus wordt gedetecteerd, registreert OpenClaw een lusgebeurtenis en waarschuwt of blokkeert het
de volgende toolcyclus, afhankelijk van de ernst. Dit beschermt tegen ongecontroleerd
tokenverbruik en vastlopers, terwijl normale toegang tot tools behouden blijft.

- Waarschuwingen komen eerst.
- Er wordt geblokkeerd zodra een patroon na de waarschuwingsdrempel blijft voortduren.
- Kritieke drempelwaarden blokkeren de volgende toolcyclus en tonen een duidelijke
  reden voor de lusdetectie in het uitvoeringsrecord.
- De beveiliging na Compaction genereert fouten `compaction_loop_persisted` die
  de betreffende tool en het aantal identieke aanroepen vermelden.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Goedkeuringen voor Exec" href="/nl/tools/exec-approvals" icon="shield">
    Toestaan/weigeren-beleid voor shelluitvoering.
  </Card>
  <Card title="Denkniveaus" href="/nl/tools/thinking" icon="brain">
    Niveaus voor redeneerinspanning en de wisselwerking met providerbeleid.
  </Card>
  <Card title="Subagenten" href="/nl/tools/subagents" icon="users">
    Geïsoleerde agents starten om ongecontroleerd gedrag te begrenzen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-tools#toolsloopdetection" icon="gear">
    Volledig schema voor `tools.loopDetection` en samenvoegingssemantiek.
  </Card>
</CardGroup>

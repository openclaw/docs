---
read_when:
    - Een gebruiker meldt dat agenten vastlopen doordat ze toolaanroepen blijven herhalen
    - U moet de bescherming tegen herhaalde aanroepen afstemmen
    - Je bewerkt beleid voor agenttools en de uitvoeringsomgeving
    - Je krijgt `compaction_loop_persisted`-afbrekingen na een nieuwe poging vanwege context-overflow
summary: Beveiligingsmaatregelen inschakelen en afstemmen die herhalende lussen met toolaanroepen detecteren
title: Detectie van hulpmiddellussen
x-i18n:
    generated_at: "2026-05-06T09:37:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw heeft twee samenwerkende vangrails voor repetitieve toolaanroeppatronen:

1. **Lusdetectie** (`tools.loopDetection.enabled`) — standaard uitgeschakeld. Bewaakt de doorlopende toolaanroepgeschiedenis op herhaalde patronen en pogingen met onbekende tools.
2. **Post-Compaction-bewaking** (`tools.loopDetection.postCompactionGuard`) — standaard ingeschakeld, tenzij `tools.loopDetection.enabled` expliciet `false` is. Wordt geactiveerd na elke Compaction-retry en breekt de run af wanneer de agent binnen het venster dezelfde `(tool, args, result)`-triple uitzendt.

Beide worden geconfigureerd onder hetzelfde `tools.loopDetection`-blok, maar de post-Compaction-bewaking draait wanneer de hoofdschakelaar niet expliciet uitstaat. Stel `tools.loopDetection.enabled: false` in om beide oppervlakken uit te schakelen.

## Waarom dit bestaat

- Repetitieve reeksen detecteren die geen voortgang boeken.
- Hoogfrequente lussen zonder resultaat detecteren (dezelfde tool, dezelfde invoer, herhaalde fouten).
- Specifieke herhaalde-aanroeppatronen detecteren voor bekende pollingtools.
- Voorkomen dat cycli van contextoverloop, daarna Compaction en daarna dezelfde lus eindeloos blijven draaien.

## Configuratieblok

Globale standaardwaarden, met elk gedocumenteerd veld weergegeven:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
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
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
      },
    },
  },
}
```

Override per agent (optioneel):

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

### Veldgedrag

| Veld                             | Standaard | Effect                                                                                                                                    |
| -------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`   | Hoofdschakelaar voor de rolling-history-detectors. Instellen op `false` schakelt ook de post-Compaction-bewaking uit.                    |
| `historySize`                    | `30`      | Aantal recente toolaanroepen dat voor analyse wordt bewaard.                                                                              |
| `warningThreshold`               | `10`      | Drempel voordat een patroon alleen als waarschuwing wordt geclassificeerd.                                                                |
| `criticalThreshold`              | `20`      | Drempel voor het blokkeren van repetitieve luspatronen.                                                                                   |
| `unknownToolThreshold`           | `10`      | Blokkeer herhaalde aanroepen naar dezelfde niet-beschikbare tool na zoveel missers.                                                       |
| `globalCircuitBreakerThreshold`  | `30`      | Globale no-progress-breakerdrempel over alle detectors heen.                                                                              |
| `detectors.genericRepeat`        | `true`    | Detecteert herhaalde patronen met dezelfde tool en dezelfde parameters.                                                                   |
| `detectors.knownPollNoProgress`  | `true`    | Detecteert bekende pollingachtige patronen zonder statuswijziging.                                                                        |
| `detectors.pingPong`             | `true`    | Detecteert afwisselende pingpongpatronen.                                                                                                 |
| `postCompactionGuard.windowSize` | `3`       | Aantal post-Compaction-toolaanroepen waarin de bewaking actief blijft en het aantal identieke triples dat de run afbreekt.                |

Voor `exec` vergelijken no-progress-controles stabiele commandouitkomsten en negeren ze vluchtige runtime-metadata zoals duur, PID, sessie-ID en werkdirectory. Wanneer een run-ID beschikbaar is, wordt recente toolaanroepgeschiedenis alleen binnen die run geëvalueerd, zodat geplande Heartbeat-cycli en nieuwe runs geen verouderde lustellingen van eerdere runs erven.

## Aanbevolen configuratie

- Stel voor kleinere modellen `enabled: true` in en laat de drempels op hun standaardwaarden staan. Topmodellen hebben rolling-history-detectie zelden nodig en kunnen de hoofdschakelaar op `false` laten staan terwijl ze nog steeds profiteren van de post-Compaction-bewaking.
- Houd drempels geordend als `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Als er fout-positieven optreden:
  - Verhoog `warningThreshold` en/of `criticalThreshold`.
  - Verhoog eventueel `globalCircuitBreakerThreshold`.
  - Schakel alleen de specifieke detector uit die problemen veroorzaakt (`detectors.<name>: false`).
  - Verlaag `historySize` voor minder strikte historische context.
- Om alles uit te schakelen (inclusief de post-Compaction-bewaking), stel je `tools.loopDetection.enabled: false` expliciet in.

## Post-Compaction-bewaking

Wanneer de runner na een contextoverloop een Compaction-retry voltooit, activeert hij een kort-vensterbewaking die de volgende paar toolaanroepen bewaakt. Als de agent binnen het venster meerdere keren dezelfde `(toolName, argsHash, resultHash)`-triple uitzendt, concludeert de bewaking dat Compaction de lus niet heeft doorbroken en breekt hij de run af met een `compaction_loop_persisted`-fout.

De bewaking wordt afgeschermd door de hoofdvlag `tools.loopDetection.enabled`, met één nuance: hij blijft **ingeschakeld wanneer de vlag niet is ingesteld of `true` is** en wordt alleen gedeactiveerd wanneer de vlag expliciet `false` is. Dit is opzettelijk. De bewaking bestaat om uit Compaction-lussen te komen die anders onbeperkt tokens zouden verbruiken, zodat een gebruiker zonder configuratie nog steeds beschermd is.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- Een lagere `windowSize` is strikter (minder pogingen vóór afbreken).
- Een hogere `windowSize` geeft de agent meer herstelpogingen.
- De bewaking breekt nooit af wanneer resultaten veranderen, alleen wanneer resultaten byte-identiek zijn over het venster.
- De bewaking is opzettelijk smal: hij vuurt alleen direct na een Compaction-retry.

<Note>
  De post-Compaction-bewaking draait wanneer de hoofdvlag niet expliciet `false` is, zelfs als je nooit een `tools.loopDetection`-blok hebt geschreven. Controleer dit door direct na een Compaction-gebeurtenis in het Gateway-log naar `post-compaction guard armed for N attempts` te zoeken.
</Note>

## Logs en verwacht gedrag

Wanneer een lus wordt gedetecteerd, rapporteert OpenClaw een lusgebeurtenis en dempt of blokkeert het de volgende toolcyclus, afhankelijk van de ernst. Dit beschermt gebruikers tegen op hol geslagen tokenverbruik en vastlopers, terwijl normale tooltoegang behouden blijft.

- Waarschuwingen komen eerst.
- Onderdrukking volgt wanneer patronen voorbij de waarschuwingsdrempel blijven bestaan.
- Kritieke drempels blokkeren de volgende toolcyclus en tonen een duidelijke lusdetectiereden in het runrecord.
- De post-Compaction-bewaking emitteert `compaction_loop_persisted`-fouten met de naam van de overtredende tool en het aantal identieke aanroepen.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/nl/tools/exec-approvals" icon="shield">
    Beleid voor toestaan/weigeren van shelluitvoering.
  </Card>
  <Card title="Thinking levels" href="/nl/tools/thinking" icon="brain">
    Niveaus voor redeneerinspanning en interactie met providerbeleid.
  </Card>
  <Card title="Sub-agents" href="/nl/tools/subagents" icon="users">
    Geïsoleerde agents starten om op hol geslagen gedrag te begrenzen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig `tools.loopDetection`-schema en samenvoegsemantiek.
  </Card>
</CardGroup>

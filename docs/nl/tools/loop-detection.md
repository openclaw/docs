---
read_when:
    - Een gebruiker meldt dat agenten vastlopen doordat ze tool-aanroepen blijven herhalen
    - Je moet de bescherming tegen herhaalde aanroepen afstemmen
    - Je bewerkt agenttool-/runtimebeleid
summary: Beveiligingsrails inschakelen en afstemmen die repetitieve toolaanroeplussen detecteren
title: Detectie van hulpmiddellussen
x-i18n:
    generated_at: "2026-05-05T01:50:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw kan voorkomen dat agents vastlopen in herhaalde tool-call-patronen.
De bewaking is **standaard uitgeschakeld**.

Schakel deze alleen in waar nodig, omdat strikte instellingen legitieme herhaalde calls kunnen blokkeren.

## Waarom dit bestaat

- Detecteer repetitieve reeksen die geen voortgang maken.
- Detecteer hoogfrequente lussen zonder resultaat (dezelfde tool, dezelfde invoer, herhaalde fouten).
- Detecteer specifieke patronen van herhaalde calls voor bekende pollingtools.

## Configuratieblok

Globale standaardwaarden:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Per-agent override (optioneel):

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

- `enabled`: Hoofdschakelaar. `false` betekent dat er geen lusdetectie wordt uitgevoerd.
- `historySize`: aantal recente tool-calls dat voor analyse wordt bewaard.
- `warningThreshold`: drempel voordat een patroon als alleen-waarschuwing wordt geclassificeerd.
- `criticalThreshold`: drempel voor het blokkeren van repetitieve luspatronen.
- `globalCircuitBreakerThreshold`: globale breaker-drempel voor geen voortgang.
- `detectors.genericRepeat`: detecteert herhaalde patronen met dezelfde tool + dezelfde parameters.
- `detectors.knownPollNoProgress`: detecteert bekende pollingachtige patronen zonder statuswijziging.
- `detectors.pingPong`: detecteert afwisselende pingpongpatronen.

Voor `exec` vergelijken controles op geen voortgang stabiele opdrachtresultaten en negeren ze vluchtige runtime-metadata zoals duur, PID, sessie-ID en werkmap.
Wanneer een run-id beschikbaar is, wordt de recente tool-call-geschiedenis alleen binnen die run geëvalueerd, zodat geplande Heartbeat-cycli en nieuwe runs geen verouderde lustellingen van eerdere runs overnemen.

## Aanbevolen instelling

- Begin voor kleinere modellen met `enabled: true`, met ongewijzigde standaardwaarden. Flagship-modellen hebben zelden lusdetectie nodig en kunnen deze uitgeschakeld laten.
- Houd drempels geordend als `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Als fout-positieven optreden:
  - verhoog `warningThreshold` en/of `criticalThreshold`
  - verhoog (optioneel) `globalCircuitBreakerThreshold`
  - schakel alleen de detector uit die problemen veroorzaakt
  - verlaag `historySize` voor een minder strikte historische context

## Post-Compaction-bewaking

Wanneer de runner een automatische Compaction-herhaalpoging voltooit (na een context-overflow), activeert deze een bewaking met een kort venster die de volgende paar tool-calls controleert. Als de agent meerdere keren binnen dat venster dezelfde `(toolName, args, result)`-triple uitzendt, concludeert de bewaking dat Compaction de lus niet heeft doorbroken en breekt deze de run af met een `compaction_loop_persisted`-fout.

Dit is een afzonderlijk codepad naast de globale `tools.loopDetection`-detectoren. Het is onafhankelijk configureerbaar:

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: aantal tool-calls na Compaction waarin de bewaking actief blijft _en_ het aantal identieke (tool, args, result)-triples dat een afbreking triggert.

De bewaking breekt nooit af wanneer resultaten veranderen, alleen wanneer resultaten byte-identiek zijn binnen het venster. Deze is bewust smal: hij gaat alleen af direct na een Compaction-herhaalpoging.

## Logs en verwacht gedrag

Wanneer een lus wordt gedetecteerd, rapporteert OpenClaw een lusgebeurtenis en blokkeert of dempt het de volgende tool-cyclus, afhankelijk van de ernst.
Dit beschermt gebruikers tegen onbeheersbare tokenkosten en vastlopers, terwijl normale tooltoegang behouden blijft.

- Geef eerst de voorkeur aan waarschuwing en tijdelijke onderdrukking.
- Escaleer alleen wanneer herhaald bewijs zich opstapelt.

## Opmerkingen

- `tools.loopDetection` wordt samengevoegd met overrides op agentniveau.
- Per-agent configuratie overschrijft globale waarden volledig of breidt ze uit.
- Als er geen configuratie bestaat, blijven guardrails uitgeschakeld.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [Denkniveaus](/nl/tools/thinking)
- [Subagents](/nl/tools/subagents)

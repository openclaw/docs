---
read_when:
    - Een gebruiker meldt dat agenten vastlopen doordat ze toolaanroepen blijven herhalen
    - Je moet de bescherming tegen herhaalde aanroepen afstemmen
    - Je bewerkt beleid voor agenthulpmiddelen en de uitvoeringsomgeving
summary: Hoe u beveiligingen inschakelt en afstemt die herhalende lussen van toolaanroepen detecteren
title: Tool-loopdetectie
x-i18n:
    generated_at: "2026-04-29T23:25:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw kan voorkomen dat agents vastlopen in herhaalde tool-call-patronen.
De guard is **standaard uitgeschakeld**.

Schakel deze alleen in waar nodig, omdat strikte instellingen legitieme herhaalde calls kunnen blokkeren.

## Waarom dit bestaat

- Detecteer repetitieve reeksen die geen voortgang maken.
- Detecteer hoogfrequente no-result-loops (dezelfde tool, dezelfde invoer, herhaalde fouten).
- Detecteer specifieke repeated-call-patronen voor bekende pollingtools.

## Configuratieblok

Globale standaardinstellingen:

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

Per-agent-override (optioneel):

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

### Gedrag van velden

- `enabled`: Hoofdschakelaar. `false` betekent dat er geen loopdetectie wordt uitgevoerd.
- `historySize`: aantal recente tool-calls dat voor analyse wordt bewaard.
- `warningThreshold`: drempel voordat een patroon als alleen-waarschuwing wordt geclassificeerd.
- `criticalThreshold`: drempel voor het blokkeren van repetitieve looppatronen.
- `globalCircuitBreakerThreshold`: globale no-progress-breakerdrempel.
- `detectors.genericRepeat`: detecteert herhaalde patronen met dezelfde tool + dezelfde parameters.
- `detectors.knownPollNoProgress`: detecteert bekende pollingachtige patronen zonder statuswijziging.
- `detectors.pingPong`: detecteert afwisselende pingpongpatronen.

Voor `exec` vergelijken no-progress-controles stabiele opdrachtresultaten en negeren ze vluchtige runtimemetadata zoals duur, PID, sessie-ID en werkdirectory.
Wanneer een run-id beschikbaar is, wordt recente tool-call-geschiedenis alleen binnen die run geëvalueerd, zodat geplande Heartbeat-cycli en nieuwe runs geen verouderde looptellingen uit eerdere runs erven.

## Aanbevolen instelling

- Begin met `enabled: true`, standaardinstellingen ongewijzigd.
- Houd drempels geordend als `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Als er false positives optreden:
  - verhoog `warningThreshold` en/of `criticalThreshold`
  - verhoog (optioneel) `globalCircuitBreakerThreshold`
  - schakel alleen de detector uit die problemen veroorzaakt
  - verlaag `historySize` voor minder strikte historische context

## Logs en verwacht gedrag

Wanneer een loop wordt gedetecteerd, meldt OpenClaw een loopevent en blokkeert of dempt het de volgende toolcyclus, afhankelijk van de ernst.
Dit beschermt gebruikers tegen uit de hand lopende tokenkosten en vastlopers, terwijl normale tooltoegang behouden blijft.

- Geef eerst de voorkeur aan waarschuwingen en tijdelijke onderdrukking.
- Escaleer alleen wanneer herhaald bewijs zich opstapelt.

## Opmerkingen

- `tools.loopDetection` wordt samengevoegd met overrides op agentniveau.
- Per-agent-configuratie overschrijft of breidt globale waarden volledig uit.
- Als er geen configuratie bestaat, blijven guardrails uit.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [Denkniveaus](/nl/tools/thinking)
- [Sub-agents](/nl/tools/subagents)

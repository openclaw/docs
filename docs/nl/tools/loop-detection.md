---
read_when:
    - Een gebruiker meldt dat agents vastlopen doordat ze toolaanroepen blijven herhalen
    - Je moet de bescherming tegen herhaalde aanroepen bijstellen
    - Je bewerkt beleid voor agenttools/runtime
summary: Hoe u beveiligingsmechanismen inschakelt en afstemt die herhalende lussen van toolaanroepen detecteren
title: Detectie van tool-lussen
x-i18n:
    generated_at: "2026-05-03T21:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw kan voorkomen dat agents vastlopen in herhaalde toolaanroeppatronen.
De beveiliging is **standaard uitgeschakeld**.

Schakel deze alleen in waar nodig, omdat strikte instellingen legitieme herhaalde aanroepen kunnen blokkeren.

## Waarom dit bestaat

- Detecteer repetitieve reeksen die geen voortgang boeken.
- Detecteer hoogfrequente lussen zonder resultaat (dezelfde tool, dezelfde invoer, herhaalde fouten).
- Detecteer specifieke patronen met herhaalde aanroepen voor bekende polling-tools.

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

### Gedrag van velden

- `enabled`: Hoofdschakelaar. `false` betekent dat er geen lusdetectie wordt uitgevoerd.
- `historySize`: aantal recente toolaanroepen dat voor analyse wordt bewaard.
- `warningThreshold`: drempel voordat een patroon alleen als waarschuwing wordt geclassificeerd.
- `criticalThreshold`: drempel voor het blokkeren van repetitieve luspatronen.
- `globalCircuitBreakerThreshold`: globale drempel voor de onderbreker bij geen voortgang.
- `detectors.genericRepeat`: detecteert herhaalde patronen met dezelfde tool + dezelfde parameters.
- `detectors.knownPollNoProgress`: detecteert bekende polling-achtige patronen zonder statuswijziging.
- `detectors.pingPong`: detecteert afwisselende pingpongpatronen.

Voor `exec` vergelijken controles op geen voortgang stabiele opdrachtresultaten en negeren ze vluchtige runtime-metadata zoals duur, PID, sessie-ID en werkmap.
Wanneer een run-ID beschikbaar is, wordt recente geschiedenis van toolaanroepen alleen binnen die run geëvalueerd, zodat geplande Heartbeat-cycli en nieuwe runs geen verouderde lustellingen uit eerdere runs overnemen.

## Aanbevolen instelling

- Begin voor kleinere modellen met `enabled: true`, met de standaardwaarden ongewijzigd. Flagship-modellen hebben lusdetectie zelden nodig en kunnen deze uitgeschakeld laten.
- Houd drempels geordend als `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Als er fout-positieven optreden:
  - verhoog `warningThreshold` en/of `criticalThreshold`
  - verhoog (optioneel) `globalCircuitBreakerThreshold`
  - schakel alleen de detector uit die problemen veroorzaakt
  - verlaag `historySize` voor minder strikte historische context

## Logs en verwacht gedrag

Wanneer een lus wordt gedetecteerd, rapporteert OpenClaw een lusgebeurtenis en blokkeert of dempt het de volgende toolcyclus, afhankelijk van de ernst.
Dit beschermt gebruikers tegen ontsporend tokenverbruik en blokkades, terwijl normale tooltoegang behouden blijft.

- Geef eerst de voorkeur aan waarschuwingen en tijdelijke onderdrukking.
- Escaleer alleen wanneer herhaald bewijs zich opstapelt.

## Opmerkingen

- `tools.loopDetection` wordt samengevoegd met overrides op agentniveau.
- Configuratie per agent overschrijft globale waarden volledig of breidt deze uit.
- Als er geen configuratie bestaat, blijven guardrails uitgeschakeld.

## Gerelateerd

- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [Denkniveaus](/nl/tools/thinking)
- [Subagents](/nl/tools/subagents)

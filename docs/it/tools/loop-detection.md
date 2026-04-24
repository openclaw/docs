---
read_when:
    - Un utente segnala che gli agenti si bloccano ripetendo chiamate agli strumenti
    - |-
      Hai bisogno di ottimizzare la protezione contro le chiamate ripetitive օգտ to=final code```
      Hai bisogno di ottimizzare la protezione contro le chiamate ripetitive
      ```
    - |-
      Stai modificando le policy runtime/strumenti dell’agente】【：】【“】【 to=final code```
      Stai modificando le policy runtime/strumenti dell’agente
      ```
summary: Come abilitare e ottimizzare i guardrail che rilevano loop ripetitivi di chiamate agli strumenti
title: Rilevamento dei loop degli strumenti
x-i18n:
    generated_at: "2026-04-24T09:06:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw può impedire agli agenti di bloccarsi in pattern ripetitivi di chiamate agli strumenti.
La protezione è **disabilitata per impostazione predefinita**.

Abilitala solo dove serve, perché con impostazioni rigide può bloccare chiamate ripetute legittime.

## Perché esiste

- Rilevare sequenze ripetitive che non fanno progressi.
- Rilevare loop ad alta frequenza senza risultato (stesso strumento, stessi input, errori ripetuti).
- Rilevare pattern specifici di chiamate ripetute per strumenti di polling noti.

## Blocco di configurazione

Valori predefiniti globali:

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

Override per agente (opzionale):

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

### Comportamento dei campi

- `enabled`: interruttore principale. `false` significa che non viene eseguito alcun rilevamento di loop.
- `historySize`: numero di chiamate agli strumenti recenti mantenute per l’analisi.
- `warningThreshold`: soglia prima di classificare un pattern come solo avviso.
- `criticalThreshold`: soglia per bloccare pattern di loop ripetitivi.
- `globalCircuitBreakerThreshold`: soglia globale dell’interruttore di emergenza no-progress.
- `detectors.genericRepeat`: rileva pattern ripetuti stesso strumento + stessi parametri.
- `detectors.knownPollNoProgress`: rileva pattern tipo polling noti senza cambiamento di stato.
- `detectors.pingPong`: rileva pattern alternati di ping-pong.

## Configurazione consigliata

- Inizia con `enabled: true`, lasciando invariati i valori predefiniti.
- Mantieni le soglie ordinate come `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se si verificano falsi positivi:
  - aumenta `warningThreshold` e/o `criticalThreshold`
  - (facoltativamente) aumenta `globalCircuitBreakerThreshold`
  - disabilita solo il detector che causa problemi
  - riduci `historySize` per un contesto storico meno rigido

## Log e comportamento atteso

Quando viene rilevato un loop, OpenClaw segnala un evento di loop e blocca o attenua il successivo ciclo di strumenti a seconda della gravità.
Questo protegge gli utenti da spesa token fuori controllo e blocchi, preservando al tempo stesso il normale accesso agli strumenti.

- Preferisci prima avvisi e soppressione temporanea.
- Escala solo quando si accumulano prove ripetute.

## Note

- `tools.loopDetection` viene unito con gli override a livello agente.
- La configurazione per agente sostituisce completamente o estende i valori globali.
- Se non esiste alcuna configurazione, i guardrail restano disattivati.

## Correlati

- [Approvazioni Exec](/it/tools/exec-approvals)
- [Livelli di thinking](/it/tools/thinking)
- [Sub-agenti](/it/tools/subagents)

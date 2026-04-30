---
read_when:
    - Un utente segnala che gli agenti rimangono bloccati ripetendo chiamate agli strumenti
    - È necessario calibrare la protezione contro le chiamate ripetitive
    - Stai modificando i criteri degli strumenti e dell'ambiente di esecuzione dell'agente
summary: Come abilitare e regolare le misure di protezione che rilevano cicli ripetitivi di chiamate agli strumenti
title: Rilevamento dei cicli degli strumenti
x-i18n:
    generated_at: "2026-04-30T09:17:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw può impedire agli agenti di bloccarsi in schemi ripetuti di chiamate agli strumenti.
La protezione è **disabilitata per impostazione predefinita**.

Abilitala solo dove necessario, perché con impostazioni rigide può bloccare chiamate ripetute legittime.

## Perché esiste

- Rileva sequenze ripetitive che non producono progressi.
- Rileva cicli ad alta frequenza senza risultato (stesso strumento, stessi input, errori ripetuti).
- Rileva schemi specifici di chiamate ripetute per strumenti di polling noti.

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

Sovrascrittura per agente (facoltativa):

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

- `enabled`: interruttore principale. `false` significa che non viene eseguito alcun rilevamento dei cicli.
- `historySize`: numero di chiamate recenti agli strumenti mantenute per l'analisi.
- `warningThreshold`: soglia prima di classificare uno schema come solo avviso.
- `criticalThreshold`: soglia per bloccare schemi di cicli ripetitivi.
- `globalCircuitBreakerThreshold`: soglia globale dell'interruttore per assenza di progressi.
- `detectors.genericRepeat`: rileva schemi ripetuti con stesso strumento + stessi parametri.
- `detectors.knownPollNoProgress`: rileva schemi noti simili al polling senza cambiamento di stato.
- `detectors.pingPong`: rileva schemi ping-pong alternati.

Per `exec`, i controlli di assenza di progressi confrontano risultati stabili dei comandi e ignorano i metadati di runtime volatili come durata, PID, ID sessione e directory di lavoro.
Quando è disponibile un ID di esecuzione, la cronologia recente delle chiamate agli strumenti viene valutata solo all'interno di tale esecuzione, così i cicli Heartbeat pianificati e le nuove esecuzioni non ereditano conteggi di cicli obsoleti da esecuzioni precedenti.

## Configurazione consigliata

- Inizia con `enabled: true`, lasciando invariati i valori predefiniti.
- Mantieni le soglie ordinate come `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se si verificano falsi positivi:
  - aumenta `warningThreshold` e/o `criticalThreshold`
  - (facoltativamente) aumenta `globalCircuitBreakerThreshold`
  - disabilita solo il rilevatore che causa problemi
  - riduci `historySize` per un contesto storico meno rigido

## Log e comportamento previsto

Quando viene rilevato un ciclo, OpenClaw segnala un evento di ciclo e blocca o attenua il ciclo successivo dello strumento in base alla gravità.
Questo protegge gli utenti da consumi incontrollati di token e blocchi, preservando al contempo il normale accesso agli strumenti.

- Preferisci prima avvisi e soppressione temporanea.
- Escala solo quando si accumulano prove ripetute.

## Note

- `tools.loopDetection` viene unito con le sovrascritture a livello di agente.
- La configurazione per agente sovrascrive o estende completamente i valori globali.
- Se non esiste alcuna configurazione, le protezioni restano disattivate.

## Correlati

- [Approvazioni Exec](/it/tools/exec-approvals)
- [Livelli di ragionamento](/it/tools/thinking)
- [Sotto-agenti](/it/tools/subagents)

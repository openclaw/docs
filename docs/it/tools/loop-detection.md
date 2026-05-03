---
read_when:
    - Un utente segnala che gli agenti restano bloccati ripetendo le chiamate agli strumenti
    - Devi regolare la protezione dalle chiamate ripetitive
    - Stai modificando le policy degli strumenti/runtime degli agenti
summary: Come abilitare e calibrare le barriere di protezione che rilevano cicli ripetitivi di chiamate agli strumenti
title: Rilevamento dei cicli degli strumenti
x-i18n:
    generated_at: "2026-05-03T21:44:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw può impedire agli agenti di bloccarsi in schemi ripetuti di chiamate agli strumenti.
La protezione è **disabilitata per impostazione predefinita**.

Abilitala solo dove necessario, perché con impostazioni rigide può bloccare chiamate ripetute legittime.

## Perché esiste

- Rilevare sequenze ripetitive che non fanno progressi.
- Rilevare loop ad alta frequenza senza risultati (stesso strumento, stessi input, errori ripetuti).
- Rilevare schemi specifici di chiamate ripetute per strumenti di polling noti.

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

- `enabled`: interruttore principale. `false` significa che non viene eseguito alcun rilevamento dei loop.
- `historySize`: numero di chiamate recenti agli strumenti conservate per l'analisi.
- `warningThreshold`: soglia prima di classificare uno schema come solo avviso.
- `criticalThreshold`: soglia per bloccare schemi di loop ripetitivi.
- `globalCircuitBreakerThreshold`: soglia globale dell'interruttore per assenza di progressi.
- `detectors.genericRepeat`: rileva schemi ripetuti con stesso strumento + stessi parametri.
- `detectors.knownPollNoProgress`: rileva schemi noti simili al polling senza cambiamenti di stato.
- `detectors.pingPong`: rileva schemi ping-pong alternati.

Per `exec`, i controlli di assenza di progressi confrontano risultati stabili dei comandi e ignorano metadati di runtime volatili come durata, PID, ID sessione e directory di lavoro.
Quando è disponibile un ID di esecuzione, la cronologia recente delle chiamate agli strumenti viene valutata solo all'interno di quell'esecuzione, in modo che i cicli di Heartbeat pianificati e le nuove esecuzioni non ereditino conteggi di loop obsoleti da esecuzioni precedenti.

## Configurazione consigliata

- Per i modelli più piccoli, inizia con `enabled: true`, lasciando invariati i valori predefiniti. I modelli di punta raramente richiedono il rilevamento dei loop e possono lasciarlo disabilitato.
- Mantieni le soglie ordinate come `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se si verificano falsi positivi:
  - aumenta `warningThreshold` e/o `criticalThreshold`
  - (opzionalmente) aumenta `globalCircuitBreakerThreshold`
  - disabilita solo il rilevatore che causa problemi
  - riduci `historySize` per un contesto storico meno rigido

## Log e comportamento previsto

Quando viene rilevato un loop, OpenClaw segnala un evento di loop e blocca o attenua il ciclo successivo dello strumento in base alla gravità.
Questo protegge gli utenti da consumi incontrollati di token e blocchi, preservando al contempo il normale accesso agli strumenti.

- Preferisci prima avvisi e soppressione temporanea.
- Escala solo quando si accumulano prove ripetute.

## Note

- `tools.loopDetection` viene unito agli override a livello di agente.
- La configurazione per agente sovrascrive o estende completamente i valori globali.
- Se non esiste alcuna configurazione, le protezioni restano disattivate.

## Correlati

- [Approvazioni Exec](/it/tools/exec-approvals)
- [Livelli di ragionamento](/it/tools/thinking)
- [Sotto-agenti](/it/tools/subagents)

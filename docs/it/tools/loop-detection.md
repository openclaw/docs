---
read_when:
    - Un utente segnala che gli agenti rimangono bloccati ripetendo chiamate agli strumenti
    - È necessario ottimizzare la protezione contro le chiamate ripetitive
    - Stai modificando le policy degli strumenti e del runtime dell'agente
summary: Come abilitare e configurare le protezioni che rilevano cicli ripetitivi di chiamate agli strumenti
title: Rilevamento dei cicli di strumenti
x-i18n:
    generated_at: "2026-05-05T01:49:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw può impedire agli agenti di bloccarsi in schemi ripetuti di chiamate agli strumenti.
La protezione è **disabilitata per impostazione predefinita**.

Abilitala solo dove necessario, perché con impostazioni rigorose può bloccare chiamate ripetute legittime.

## Perché esiste

- Rilevare sequenze ripetitive che non fanno progressi.
- Rilevare cicli ad alta frequenza senza risultati (stesso strumento, stessi input, errori ripetuti).
- Rilevare schemi specifici di chiamate ripetute per strumenti di polling noti.

## Blocco di configurazione

Impostazioni predefinite globali:

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

- `enabled`: interruttore principale. `false` significa che non viene eseguito alcun rilevamento dei cicli.
- `historySize`: numero di chiamate recenti agli strumenti conservate per l'analisi.
- `warningThreshold`: soglia prima di classificare uno schema come solo avviso.
- `criticalThreshold`: soglia per bloccare schemi di ciclo ripetitivi.
- `globalCircuitBreakerThreshold`: soglia globale dell'interruttore di sicurezza per assenza di progressi.
- `detectors.genericRepeat`: rileva schemi ripetuti con stesso strumento + stessi parametri.
- `detectors.knownPollNoProgress`: rileva schemi noti simili a polling senza cambiamento di stato.
- `detectors.pingPong`: rileva schemi ping-pong alternati.

Per `exec`, i controlli di assenza di progressi confrontano esiti stabili dei comandi e ignorano metadati di runtime volatili come durata, PID, ID sessione e directory di lavoro.
Quando è disponibile un ID esecuzione, la cronologia recente delle chiamate agli strumenti viene valutata solo all'interno di quell'esecuzione, così i cicli Heartbeat pianificati e le nuove esecuzioni non ereditano conteggi obsoleti dei cicli da esecuzioni precedenti.

## Configurazione consigliata

- Per i modelli più piccoli, inizia con `enabled: true`, lasciando invariate le impostazioni predefinite. I modelli di punta raramente hanno bisogno del rilevamento dei cicli e possono lasciarlo disabilitato.
- Mantieni le soglie ordinate come `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se si verificano falsi positivi:
  - aumenta `warningThreshold` e/o `criticalThreshold`
  - (facoltativamente) aumenta `globalCircuitBreakerThreshold`
  - disabilita solo il rilevatore che causa problemi
  - riduci `historySize` per un contesto storico meno rigoroso

## Protezione post-Compaction

Quando il runner completa un nuovo tentativo di Compaction automatica (dopo un overflow del contesto), attiva una protezione a finestra breve che osserva le chiamate successive agli strumenti. Se l'agente emette la _stessa_ tripla `(toolName, args, result)` più volte all'interno di quella finestra, la protezione conclude che la Compaction non ha interrotto il ciclo e interrompe l'esecuzione con un errore `compaction_loop_persisted`.

Questo è un percorso di codice separato rispetto ai rilevatori globali `tools.loopDetection`. È configurabile in modo indipendente:

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

- `windowSize`: numero di chiamate agli strumenti post-Compaction durante le quali la protezione resta armata _e_ conteggio di triple identiche (strumento, argomenti, risultato) che attiva un'interruzione.

La protezione non interrompe mai quando i risultati cambiano, ma solo quando i risultati sono identici byte per byte nell'intera finestra. È intenzionalmente circoscritta: si attiva solo subito dopo un nuovo tentativo di Compaction.

## Log e comportamento previsto

Quando viene rilevato un ciclo, OpenClaw segnala un evento di ciclo e blocca o attenua il ciclo successivo dello strumento in base alla gravità.
Questo protegge gli utenti da consumi incontrollati di token e blocchi, preservando al tempo stesso il normale accesso agli strumenti.

- Preferisci prima avvisi e soppressione temporanea.
- Scala solo quando si accumulano prove ripetute.

## Note

- `tools.loopDetection` viene unito agli override a livello di agente.
- La configurazione per agente sovrascrive o estende completamente i valori globali.
- Se non esiste alcuna configurazione, le protezioni restano disattivate.

## Correlati

- [Approvazioni di exec](/it/tools/exec-approvals)
- [Livelli di ragionamento](/it/tools/thinking)
- [Sotto-agenti](/it/tools/subagents)

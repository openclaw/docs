---
read_when:
    - Un utente segnala che gli agenti restano bloccati ripetendo chiamate agli strumenti
    - È necessario regolare la protezione contro le chiamate ripetitive
    - Stai modificando le policy di strumenti/runtime degli agenti
    - Riscontri interruzioni `compaction_loop_persisted` dopo un nuovo tentativo per overflow del contesto
summary: Come abilitare e regolare le protezioni che rilevano cicli ripetitivi di chiamate agli strumenti
title: Rilevamento dei loop degli strumenti
x-i18n:
    generated_at: "2026-05-06T09:13:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw dispone di due meccanismi di protezione cooperanti per gli schemi ripetitivi di chiamata agli strumenti:

1. **Rilevamento dei loop** (`tools.loopDetection.enabled`) — disabilitato per impostazione predefinita. Monitora la cronologia mobile delle chiamate agli strumenti per individuare schemi ripetuti e nuovi tentativi con strumenti sconosciuti.
2. **Protezione post-compaction** (`tools.loopDetection.postCompactionGuard`) — abilitata per impostazione predefinita, salvo che `tools.loopDetection.enabled` sia esplicitamente `false`. Si arma dopo ogni nuovo tentativo di compaction e interrompe l'esecuzione quando l'agente emette la stessa tripla `(tool, args, result)` all'interno della finestra.

Entrambi sono configurati nello stesso blocco `tools.loopDetection`, ma la protezione post-compaction viene eseguita ogni volta che l'interruttore principale non è esplicitamente disattivato. Imposta `tools.loopDetection.enabled: false` per silenziare entrambe le superfici.

## Perché esiste

- Rilevare sequenze ripetitive che non producono avanzamento.
- Rilevare loop ad alta frequenza senza risultato (stesso strumento, stessi input, errori ripetuti).
- Rilevare schemi specifici di chiamate ripetute per strumenti di polling noti.
- Impedire che cicli di overflow del contesto, quindi compaction, quindi stesso loop continuino indefinitamente.

## Blocco di configurazione

Valori predefiniti globali, con ogni campo documentato mostrato:

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

Override per agente (facoltativo):

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

| Campo                            | Predefinito | Effetto                                                                                                                          |
| -------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`     | Interruttore principale per i rilevatori della cronologia mobile. Impostare `false` disabilita anche la protezione post-compaction. |
| `historySize`                    | `30`        | Numero di chiamate recenti agli strumenti conservate per l'analisi.                                                              |
| `warningThreshold`               | `10`        | Soglia prima che uno schema sia classificato come solo avviso.                                                                   |
| `criticalThreshold`              | `20`        | Soglia per bloccare schemi di loop ripetitivi.                                                                                   |
| `unknownToolThreshold`           | `10`        | Blocca le chiamate ripetute allo stesso strumento non disponibile dopo questo numero di mancati riscontri.                       |
| `globalCircuitBreakerThreshold`  | `30`        | Soglia dell'interruttore globale senza avanzamento su tutti i rilevatori.                                                        |
| `detectors.genericRepeat`        | `true`      | Rileva schemi ripetuti con stesso strumento + stessi parametri.                                                                  |
| `detectors.knownPollNoProgress`  | `true`      | Rileva schemi noti simili al polling senza cambiamento di stato.                                                                 |
| `detectors.pingPong`             | `true`      | Rileva schemi alternati ping-pong.                                                                                               |
| `postCompactionGuard.windowSize` | `3`         | Numero di chiamate agli strumenti post-compaction durante le quali la protezione resta armata e conteggio di triple identiche che interrompe l'esecuzione. |

Per `exec`, i controlli senza avanzamento confrontano esiti stabili dei comandi e ignorano metadati di runtime volatili come durata, PID, ID sessione e directory di lavoro. Quando è disponibile un ID di esecuzione, la cronologia recente delle chiamate agli strumenti viene valutata solo all'interno di quell'esecuzione, così i cicli di heartbeat pianificati e le nuove esecuzioni non ereditano conteggi di loop obsoleti da esecuzioni precedenti.

## Configurazione consigliata

- Per i modelli più piccoli, imposta `enabled: true` e lascia le soglie ai valori predefiniti. I modelli di punta raramente richiedono il rilevamento basato sulla cronologia mobile e possono lasciare l'interruttore principale su `false` continuando comunque a beneficiare della protezione post-compaction.
- Mantieni le soglie ordinate come `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se si verificano falsi positivi:
  - Aumenta `warningThreshold` e/o `criticalThreshold`.
  - Facoltativamente aumenta `globalCircuitBreakerThreshold`.
  - Disabilita solo il rilevatore specifico che causa problemi (`detectors.<name>: false`).
  - Riduci `historySize` per un contesto storico meno rigido.
- Per disabilitare tutto (inclusa la protezione post-compaction), imposta esplicitamente `tools.loopDetection.enabled: false`.

## Protezione post-compaction

Quando il runner completa un nuovo tentativo di compaction dopo un overflow del contesto, arma una protezione con finestra breve che monitora le successive chiamate agli strumenti. Se l'agente emette più volte la stessa tripla `(toolName, argsHash, resultHash)` all'interno della finestra, la protezione conclude che la compaction non ha interrotto il loop e interrompe l'esecuzione con un errore `compaction_loop_persisted`.

La protezione è regolata dal flag principale `tools.loopDetection.enabled` con una particolarità: resta **abilitata quando il flag non è impostato o è `true`** e si disattiva solo quando il flag è esplicitamente `false`. Questo è intenzionale. La protezione esiste per uscire dai loop di compaction che altrimenti consumerebbero token senza limiti, quindi anche un utente senza configurazione ottiene comunque la protezione.

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

- Un `windowSize` più basso è più restrittivo (meno tentativi prima dell'interruzione).
- Un `windowSize` più alto concede all'agente più tentativi di recupero.
- La protezione non interrompe mai quando i risultati cambiano, ma solo quando i risultati sono identici byte per byte nella finestra.
- È intenzionalmente ristretta: si attiva solo subito dopo un nuovo tentativo di compaction.

<Note>
  La protezione post-compaction viene eseguita ogni volta che il flag principale non è esplicitamente `false`, anche se non hai mai scritto un blocco `tools.loopDetection`. Per verificarlo, cerca `post-compaction guard armed for N attempts` nel log del gateway subito dopo un evento di compaction.
</Note>

## Log e comportamento previsto

Quando viene rilevato un loop, OpenClaw segnala un evento di loop e attenua o blocca il ciclo successivo degli strumenti in base alla gravità. Questo protegge gli utenti da spese incontrollate di token e blocchi, preservando al tempo stesso il normale accesso agli strumenti.

- Gli avvisi arrivano per primi.
- La soppressione segue quando gli schemi persistono oltre la soglia di avviso.
- Le soglie critiche bloccano il ciclo successivo degli strumenti e mostrano un motivo chiaro di rilevamento del loop nel record dell'esecuzione.
- La protezione post-compaction emette errori `compaction_loop_persisted` con il nome dello strumento responsabile e il conteggio delle chiamate identiche.

## Correlati

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/it/tools/exec-approvals" icon="shield">
    Criterio di autorizzazione/negazione per l'esecuzione della shell.
  </Card>
  <Card title="Thinking levels" href="/it/tools/thinking" icon="brain">
    Livelli di sforzo di ragionamento e interazione con i criteri del provider.
  </Card>
  <Card title="Sub-agents" href="/it/tools/subagents" icon="users">
    Generazione di agenti isolati per limitare comportamenti incontrollati.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo di `tools.loopDetection` e semantica di unione.
  </Card>
</CardGroup>

---
read_when:
    - Un utente segnala che gli agenti restano bloccati ripetendo chiamate agli strumenti
    - È necessario regolare la protezione dalle chiamate ripetute
    - Stai modificando le policy degli strumenti/runtime dell'agente
    - Si verificano interruzioni `compaction_loop_persisted` dopo un ritentativo dovuto al superamento del limite del contesto
summary: Come abilitare e configurare le barriere di protezione che rilevano loop ripetitivi di chiamate agli strumenti
title: Rilevamento dei cicli degli strumenti
x-i18n:
    generated_at: "2026-05-11T20:38:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw dispone di due meccanismi di protezione cooperanti per i pattern ripetitivi di chiamate agli strumenti:

1. **Rilevamento dei loop** (`tools.loopDetection.enabled`) — disabilitato per impostazione predefinita. Monitora la cronologia scorrevole delle chiamate agli strumenti per individuare pattern ripetuti e ritentativi con strumenti sconosciuti.
2. **Protezione post-Compaction** (`tools.loopDetection.postCompactionGuard`) — abilitata per impostazione predefinita, a meno che `tools.loopDetection.enabled` non sia esplicitamente `false`. Si attiva dopo ogni ritentativo di Compaction e interrompe l'esecuzione quando l'agente emette la stessa tripla `(tool, args, result)` all'interno della finestra.

Entrambi sono configurati nello stesso blocco `tools.loopDetection`, ma la protezione post-Compaction viene eseguita ogni volta che l'interruttore principale non è esplicitamente disattivato. Imposta `tools.loopDetection.enabled: false` per disattivare entrambe le superfici.

## Perché esiste

- Rilevare sequenze ripetitive che non producono avanzamento.
- Rilevare loop ad alta frequenza senza risultati (stesso strumento, stessi input, errori ripetuti).
- Rilevare specifici pattern di chiamate ripetute per strumenti di polling noti.
- Impedire che cicli di overflow del contesto, poi Compaction, poi stesso loop continuino indefinitamente.

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
| `enabled`                        | `false`     | Interruttore principale per i rilevatori basati sulla cronologia scorrevole. Impostarlo a `false` disabilita anche la protezione post-Compaction. |
| `historySize`                    | `30`        | Numero di chiamate recenti agli strumenti mantenute per l'analisi.                                                               |
| `warningThreshold`               | `10`        | Soglia prima che un pattern venga classificato solo come avviso.                                                                 |
| `criticalThreshold`              | `20`        | Soglia per bloccare pattern di loop ripetitivi senza avanzamento.                                                                |
| `unknownToolThreshold`           | `10`        | Blocca le chiamate ripetute allo stesso strumento non disponibile dopo questo numero di mancate corrispondenze.                  |
| `globalCircuitBreakerThreshold`  | `30`        | Soglia globale del circuit breaker senza avanzamento su tutti i rilevatori.                                                      |
| `detectors.genericRepeat`        | `true`      | Avvisa sui pattern ripetuti stesso strumento + stessi parametri e blocca quando le stesse chiamate restituiscono anche esiti identici. |
| `detectors.knownPollNoProgress`  | `true`      | Rileva pattern noti simili al polling senza cambiamento di stato.                                                                |
| `detectors.pingPong`             | `true`      | Rileva pattern alternati di ping-pong.                                                                                           |
| `postCompactionGuard.windowSize` | `3`         | Numero di chiamate agli strumenti post-Compaction durante le quali la protezione rimane attiva e conteggio di triple identiche che interrompe l'esecuzione. |

Per `exec`, i controlli senza avanzamento confrontano esiti stabili dei comandi e ignorano metadati di runtime volatili come durata, PID, ID sessione e directory di lavoro. Quando è disponibile un ID di esecuzione, la cronologia recente delle chiamate agli strumenti viene valutata solo all'interno di quell'esecuzione, così i cicli Heartbeat pianificati e le nuove esecuzioni non ereditano conteggi di loop obsoleti da esecuzioni precedenti.

## Configurazione consigliata

- Per i modelli più piccoli, imposta `enabled: true` e lascia le soglie ai valori predefiniti. I modelli di punta raramente hanno bisogno del rilevamento basato sulla cronologia scorrevole e possono lasciare l'interruttore principale a `false` continuando comunque a beneficiare della protezione post-Compaction.
- Mantieni le soglie ordinate come `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Se si verificano falsi positivi:
  - Aumenta `warningThreshold` e/o `criticalThreshold`.
  - Facoltativamente aumenta `globalCircuitBreakerThreshold`.
  - Disabilita solo il rilevatore specifico che causa problemi (`detectors.<name>: false`).
  - Riduci `historySize` per un contesto storico meno rigoroso.
- Per disabilitare tutto (inclusa la protezione post-Compaction), imposta esplicitamente `tools.loopDetection.enabled: false`.

## Protezione post-Compaction

Quando il runner completa un ritentativo di Compaction dopo un overflow del contesto, attiva una protezione a finestra breve che monitora le successive chiamate agli strumenti. Se l'agente emette più volte la stessa tripla `(toolName, argsHash, resultHash)` all'interno della finestra, la protezione conclude che la Compaction non ha interrotto il loop e interrompe l'esecuzione con un errore `compaction_loop_persisted`.

La protezione è controllata dal flag principale `tools.loopDetection.enabled` con una particolarità: rimane **abilitata quando il flag non è impostato o è `true`** e si disattiva solo quando il flag è esplicitamente `false`. Questo è intenzionale. La protezione esiste per uscire dai loop di Compaction che altrimenti consumerebbero token senza limiti, quindi anche un utente senza configurazione ottiene comunque la protezione.

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

- Un `windowSize` più basso è più rigoroso (meno tentativi prima dell'interruzione).
- Un `windowSize` più alto concede all'agente più tentativi di recupero.
- La protezione non interrompe mai quando i risultati stanno cambiando, ma solo quando i risultati sono byte-identici nell'intera finestra.
- È intenzionalmente circoscritta: si attiva solo nell'immediata conseguenza di un ritentativo di Compaction.

<Note>
  La protezione post-Compaction viene eseguita ogni volta che il flag principale non è esplicitamente `false`, anche se non hai mai scritto un blocco `tools.loopDetection`. Per verificarlo, cerca `post-compaction guard armed for N attempts` nel log del gateway subito dopo un evento di Compaction.
</Note>

## Log e comportamento previsto

Quando viene rilevato un loop, OpenClaw segnala un evento di loop e attenua o blocca il ciclo successivo dello strumento in base alla gravità. Questo protegge gli utenti da spese di token fuori controllo e blocchi, preservando al tempo stesso il normale accesso agli strumenti.

- Gli avvisi arrivano per primi.
- La soppressione segue quando i pattern persistono oltre la soglia di avviso.
- Le soglie critiche bloccano il ciclo successivo dello strumento ed espongono nel record dell'esecuzione un motivo chiaro di rilevamento del loop.
- La protezione post-Compaction emette errori `compaction_loop_persisted` con il nome dello strumento responsabile e il conteggio delle chiamate identiche.

## Correlati

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/it/tools/exec-approvals" icon="shield">
    Criteri di autorizzazione/negazione per l'esecuzione della shell.
  </Card>
  <Card title="Thinking levels" href="/it/tools/thinking" icon="brain">
    Livelli di impegno di ragionamento e interazione con i criteri del provider.
  </Card>
  <Card title="Sub-agents" href="/it/tools/subagents" icon="users">
    Generazione di agenti isolati per limitare comportamenti fuori controllo.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo di `tools.loopDetection` e semantica di unione.
  </Card>
</CardGroup>

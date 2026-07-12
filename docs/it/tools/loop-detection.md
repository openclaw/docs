---
read_when:
    - Un utente segnala che gli agenti rimangono bloccati ripetendo le chiamate agli strumenti
    - Devi configurare la protezione contro le chiamate ripetitive
    - Stai modificando i criteri degli strumenti e del runtime dell'agente
    - Si verificano interruzioni `compaction_loop_persisted` dopo un nuovo tentativo dovuto al superamento del limite del contesto
summary: Come abilitare e configurare i meccanismi di protezione che rilevano i cicli ripetitivi di chiamate agli strumenti
title: Rilevamento dei cicli degli strumenti
x-i18n:
    generated_at: "2026-07-12T07:37:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw dispone di due meccanismi di protezione cooperanti contro gli schemi ripetitivi di chiamate agli strumenti,
entrambi configurati in `tools.loopDetection`:

1. **Rilevamento dei cicli** (`enabled`) - disabilitato per impostazione predefinita. Monitora la cronologia mobile
   delle chiamate agli strumenti per individuare schemi ripetuti e nuovi tentativi con strumenti sconosciuti.
2. **Protezione post-Compaction** (`postCompactionGuard`) - abilitata ogni volta che
   `enabled` non è esplicitamente `false`. Si attiva dopo ogni nuovo tentativo successivo alla Compaction e
   interrompe l'esecuzione se l'agente ripete la stessa terna `(tool, args, result)`
   entro la finestra.

Imposta `tools.loopDetection.enabled: false` per disattivare entrambi i meccanismi di protezione.

## Perché esiste

- Rilevare sequenze ripetitive che non producono progressi.
- Rilevare cicli ad alta frequenza senza risultati (stesso strumento, stessi input, errori
  ripetuti).
- Rilevare specifici schemi di chiamate ripetute per strumenti di polling noti.
- Interrompere i cicli overflow del contesto -> Compaction -> stesso ciclo, invece di lasciarli
  proseguire indefinitamente.

## Blocco di configurazione

Valori predefiniti globali, con tutti i campi documentati:

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

Sostituzione per singolo agente (facoltativa, in `agents.list[].tools.loopDetection`):

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

Le impostazioni per singolo agente si sovrappongono al blocco globale campo per campo (inclusi
`detectors` e `postCompactionGuard` annidati), quindi un agente deve impostare solo i
campi che desidera modificare.

### Comportamento dei campi

| Campo                            | Valore predefinito | Effetto                                                                                                                                     |
| -------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false`            | Interruttore principale per i rilevatori basati sulla cronologia mobile. `false` disabilita anche la protezione post-Compaction.             |
| `historySize`                    | `30`               | Numero di chiamate recenti agli strumenti conservate per l'analisi.                                                                         |
| `warningThreshold`               | `10`               | Numero di ripetizioni dopo il quale uno schema viene classificato come semplice avviso.                                                     |
| `criticalThreshold`              | `20`               | Numero di ripetizioni che determina il blocco di uno schema ciclico senza progressi. In caso di configurazione errata, il runtime lo limita a un valore superiore a `warningThreshold`. |
| `unknownToolThreshold`           | `10`               | Blocca le chiamate ripetute allo stesso strumento non disponibile dopo questo numero di tentativi falliti. Non è controllato da `detectors`. |
| `globalCircuitBreakerThreshold`  | `30`               | Interruttore globale per l'assenza di progressi, applicato a tutti i rilevatori. In caso di configurazione errata, il runtime lo limita a un valore superiore a `criticalThreshold`. Non è controllato da `detectors`. |
| `detectors.genericRepeat`        | `true`             | Avvisa in caso di chiamate ripetute con lo stesso strumento e gli stessi argomenti; le blocca quando restituiscono anche risultati identici. |
| `detectors.knownPollNoProgress`  | `true`             | Rileva schemi noti di polling senza progressi (`process` con `action: "poll"`/`"log"`, `command_status`).                                    |
| `detectors.pingPong`             | `true`             | Rileva schemi ping-pong alternati senza progressi tra due chiamate.                                                                          |
| `postCompactionGuard.windowSize` | `3`                | Numero di tentativi per cui la protezione resta attiva dopo la Compaction e numero di terne identiche che interrompe l'esecuzione.           |

Per `exec`, l'hashing dell'assenza di progressi confronta risultati stabili dei comandi (stato,
codice di uscita, indicatore di timeout, output) e ignora metadati volatili del runtime come
durata, PID, ID sessione e directory di lavoro. L'hashing dei risultati dell'invio di messaggi
in uscita rimuove gli ID volatili specifici di ogni chiamata (ID messaggio, ID file, timestamp),
affinché un risultato "inviato" non appaia identico a un altro risultato "inviato".
Quando è disponibile un ID esecuzione, la cronologia viene valutata solo all'interno di tale esecuzione,
quindi i cicli Heartbeat pianificati e le nuove esecuzioni non ereditano conteggi obsoleti dei cicli
dalle esecuzioni precedenti.

## Configurazione consigliata

- Per i modelli più piccoli, imposta `enabled: true` e lascia le soglie ai
  valori predefiniti. I modelli di punta raramente necessitano del rilevamento basato sulla cronologia mobile e possono
  lasciare l'interruttore principale su `false`, continuando comunque a beneficiare della
  protezione post-Compaction.
- Mantieni le soglie nell'ordine `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`; il runtime aumenta `criticalThreshold` e
  `globalCircuitBreakerThreshold` se vengono impostate a un valore uguale o inferiore alla
  soglia che devono superare.
- Se si verificano falsi positivi:
  - Aumenta `warningThreshold` e/o `criticalThreshold`.
  - Facoltativamente, aumenta `globalCircuitBreakerThreshold`.
  - Disabilita solo il rilevatore specifico che causa problemi (`detectors.<name>: false`).
  - Riduci `historySize` per ottenere una finestra cronologica più breve.
- Per disabilitare tutto, inclusa la protezione post-Compaction, imposta
  esplicitamente `tools.loopDetection.enabled: false`.

## Protezione post-Compaction

Dopo un nuovo tentativo di Compaction successivo a un overflow del contesto, l'esecutore attiva una
protezione a finestra breve per le chiamate agli strumenti immediatamente successive. Se l'agente emette la stessa
terna `(toolName, argsHash, resultHash)` per `postCompactionGuard.windowSize`
volte entro tale finestra, la protezione conclude che la Compaction non ha interrotto il
ciclo e termina l'esecuzione con un errore `compaction_loop_persisted`.

La protezione è controllata dal flag principale `tools.loopDetection.enabled`, con una
particolarità: rimane **abilitata quando il flag non è impostato o è `true`** e viene
disattivata solo quando il flag è esplicitamente `false`. Questo comportamento è intenzionale: la protezione
serve a interrompere i cicli di Compaction che altrimenti consumerebbero una quantità illimitata di token,
quindi anche un utente senza configurazione beneficia della protezione.

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

- Un valore `windowSize` inferiore è più restrittivo (meno tentativi prima dell'interruzione).
- Un valore `windowSize` superiore concede all'agente più tentativi di recupero.
- La protezione non interrompe mai l'esecuzione finché i risultati cambiano; si attiva solo con risultati
  identici byte per byte nell'intera finestra.
- Si attiva esclusivamente subito dopo un nuovo tentativo di Compaction, non in altri
  momenti dell'esecuzione.

<Note>
  La protezione post-Compaction viene eseguita ogni volta che il flag principale non è esplicitamente `false`, anche se non hai mai scritto un blocco `tools.loopDetection`. Per verificarlo, cerca `post-compaction guard armed for N attempts` nel log del Gateway subito dopo un evento di Compaction.
</Note>

## Log e comportamento previsto

Quando viene rilevato un ciclo, OpenClaw registra un evento di ciclo e genera un avviso oppure blocca
il ciclo successivo dello strumento in base alla gravità, proteggendo dal consumo incontrollato di token
e dai blocchi, senza compromettere il normale accesso agli strumenti.

- Gli avvisi vengono emessi per primi.
- Il blocco avviene quando uno schema persiste oltre la soglia di avviso.
- Le soglie critiche bloccano il ciclo successivo dello strumento e mostrano chiaramente
  il motivo del rilevamento del ciclo nel record dell'esecuzione.
- La protezione post-Compaction genera errori `compaction_loop_persisted` che indicano
  lo strumento responsabile e il numero di chiamate identiche.

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Approvazioni di Exec" href="/it/tools/exec-approvals" icon="shield">
    Criteri di autorizzazione e rifiuto per l'esecuzione nella shell.
  </Card>
  <Card title="Livelli di ragionamento" href="/it/tools/thinking" icon="brain">
    Livelli di impegno del ragionamento e interazione con i criteri del provider.
  </Card>
  <Card title="Sottoagenti" href="/it/tools/subagents" icon="users">
    Creazione di agenti isolati per limitare comportamenti incontrollati.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/config-tools#toolsloopdetection" icon="gear">
    Schema completo di `tools.loopDetection` e semantica dell'unione.
  </Card>
</CardGroup>

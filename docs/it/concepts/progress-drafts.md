---
read_when:
    - Configurare aggiornamenti visibili sullo stato di avanzamento per turni di chat di lunga durata
    - Scegliere tra le modalità di streaming parziale, a blocchi e di avanzamento
    - Spiegazione di come OpenClaw aggiorna un messaggio del canale mentre il lavoro è in corso
    - Risoluzione dei problemi relativi alle bozze di avanzamento, ai messaggi di avanzamento autonomi o al meccanismo di ripiego della finalizzazione
summary: 'Bozze di avanzamento: un unico messaggio visibile di lavoro in corso che si aggiorna mentre un agente è in esecuzione'
title: Bozze di avanzamento
x-i18n:
    generated_at: "2026-05-04T02:23:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Le bozze di avanzamento fanno sembrare vivi in chat i turni degli agenti di lunga durata senza trasformare
la conversazione in una pila di risposte di stato temporanee.

Quando le bozze di avanzamento sono abilitate, OpenClaw crea un solo messaggio visibile
di lavoro in corso solo dopo che il turno dimostra che sta svolgendo lavoro reale, lo aggiorna mentre
l'agente legge, pianifica, chiama strumenti o attende approvazione, e poi trasforma quella bozza
nella risposta finale quando il canale può farlo in sicurezza.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Usa le bozze di avanzamento quando vuoi un solo messaggio di stato ordinato durante lavori intensivi
con gli strumenti e la risposta finale quando il turno è completato.

## Avvio rapido

Abilita le bozze di avanzamento per canale con `streaming.mode: "progress"`:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

Di solito è sufficiente. OpenClaw sceglierà automaticamente un'etichetta di una parola, attenderà
finché il lavoro dura almeno cinque secondi o emette un secondo evento di lavoro, aggiungerà righe
di avanzamento compatte mentre avviene lavoro utile e sopprimerà le chiacchiere di avanzamento
autonome duplicate per quel turno.

## Cosa vedono gli utenti

Una bozza di avanzamento ha due parti:

| Parte                  | Scopo                                                                            |
| ---------------------- | -------------------------------------------------------------------------------- |
| Etichetta              | Un breve titolo come `Thinking...` o `Shelling...`.                              |
| Righe di avanzamento   | Aggiornamenti di esecuzione compatti usando le stesse etichette e icone degli strumenti dell'output dettagliato. |

L'etichetta appare dopo che l'agente avvia un lavoro significativo e rimane occupato
per cinque secondi o emette un secondo evento di lavoro. Le risposte di solo testo normale non
mostrano una bozza di avanzamento. Le righe di avanzamento vengono aggiunte solo quando l'agente emette aggiornamenti
di lavoro utili, per esempio `🛠️ Exec`, `🔎 Web Search` o `✍️ Write: to /tmp/file`.
Per impostazione predefinita usano la stessa modalità di spiegazione compatta di `/verbose`; imposta
`agents.defaults.toolProgressDetail: "raw"` durante il debug se vuoi anche comandi/dettagli grezzi
aggiunti.
La risposta finale sostituisce la bozza quando possibile; altrimenti
OpenClaw invia normalmente la risposta finale e ripulisce o smette di aggiornare la
bozza in base al trasporto del canale.

## Scegliere una modalità

`channels.<channel>.streaming.mode` controlla il comportamento visibile in corso:

| Modalità   | Ideale per                         | Cosa appare in chat                                      |
| ---------- | ---------------------------------- | -------------------------------------------------------- |
| `off`      | Canali silenziosi                  | Solo la risposta finale.                                 |
| `partial`  | Osservare apparire il testo della risposta | Una bozza modificata con il testo più recente della risposta. |
| `block`    | Blocchi più grandi di anteprima della risposta | Un'anteprima aggiornata o aggiunta in blocchi più grandi. |
| `progress` | Turni intensivi con strumenti o di lunga durata | Una bozza di stato, poi la risposta finale.              |

Scegli `progress` quando agli utenti interessa più "cosa sta succedendo" che vedere
il testo della risposta scorrere token per token.

Scegli `partial` quando la risposta stessa è il segnale di avanzamento.

Scegli `block` quando vuoi aggiornamenti della bozza di anteprima in blocchi di testo più grandi. Su
Discord e Telegram, `streaming.mode: "block"` è ancora streaming di anteprima, non
consegna normale a blocchi. Usa `streaming.block.enabled` o il legacy
`blockStreaming` quando vuoi risposte normali a blocchi.

## Configurare le etichette

Le etichette di avanzamento si trovano sotto `channels.<channel>.streaming.progress`.

L'etichetta predefinita è `auto`, che sceglie dal pool integrato di OpenClaw
di etichette composte da una sola parola con puntini di sospensione:

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
```

Usa un'etichetta fissa:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Usa il tuo pool di etichette automatiche:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Nascondi l'etichetta e mostra solo le righe di avanzamento:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## Controllare le righe di avanzamento

Le righe di avanzamento sono abilitate per impostazione predefinita in modalità di avanzamento. Provengono da eventi
di esecuzione reali: avvii di strumenti, aggiornamenti di elementi, piani di attività, approvazioni, output di comandi, riepiloghi
di patch e attività simili dell'agente.

OpenClaw usa lo stesso formattatore per le bozze di avanzamento e `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` è il valore predefinito e mantiene le bozze stabili con etichette concise come
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` aggiunge il comando/dettaglio sottostante
quando disponibile, utile durante il debug ma più rumoroso in chat.

Per esempio, lo stesso comando appare in modo diverso a seconda della modalità di dettaglio:

| Modalità  | Riga di avanzamento                                                 |
| --------- | ------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

Limita quante righe restano visibili:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

Mantieni la singola bozza di avanzamento ma nascondi le righe di strumenti e attività:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Con `toolProgress: false`, OpenClaw sopprime comunque i precedenti messaggi autonomi
di avanzamento degli strumenti per quel turno. Il canale rimane visivamente silenzioso fino alla
risposta finale, tranne per l'etichetta se configurata.

## Comportamento del canale

Ogni canale usa il trasporto più pulito che supporta:

| Canale          | Trasporto dell'avanzamento             | Note                                                                  |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Invia un messaggio, poi lo modifica.   | Il testo finale viene modificato sul posto quando rientra in un solo messaggio di anteprima sicuro. |
| Matrix          | Invia un evento, poi lo modifica.      | La configurazione dello streaming a livello di account controlla le bozze a livello di account. |
| Microsoft Teams | Stream nativo di Teams nelle chat personali. | `streaming.mode: "block"` mappa alla consegna a blocchi di Teams. |
| Slack           | Stream nativo o post bozza modificabile. | La disponibilità del thread influisce sulla possibilità di usare lo streaming nativo. |
| Telegram        | Invia un messaggio, poi lo modifica.   | Le bozze visibili più vecchie possono essere sostituite così i timestamp finali restano utili. |
| Mattermost      | Post bozza modificabile.               | L'attività degli strumenti viene incorporata nello stesso post in stile bozza. |

I canali senza supporto sicuro alla modifica di solito ripiegano sugli indicatori di digitazione o
sulla consegna solo finale.

## Finalizzazione

Quando la risposta finale è pronta, OpenClaw cerca di mantenere pulita la chat:

- Se la bozza può diventare in sicurezza la risposta finale, OpenClaw la modifica sul posto.
- Se il canale usa lo streaming di avanzamento nativo, OpenClaw finalizza quello stream
  quando il trasporto nativo accetta il testo finale.
- Se la risposta finale contiene contenuti multimediali, una richiesta di approvazione, un destinatario di risposta esplicito,
  troppi blocchi o una modifica/invio non riusciti, OpenClaw invia la risposta finale tramite
  il normale percorso di consegna del canale.

Il percorso di fallback è intenzionale. È meglio inviare una nuova risposta finale che
perdere testo, collocare una risposta nel thread sbagliato o sovrascrivere una bozza con un payload che il canale
non può rappresentare in sicurezza.

## Risoluzione dei problemi

**Vedo solo la risposta finale.**

Controlla che `channels.<channel>.streaming.mode` sia impostato su `progress` per
l'account o il canale che ha gestito il messaggio. Alcuni percorsi di gruppo o di risposta citata possono
disabilitare le anteprime bozza per un turno quando il canale non può modificare in sicurezza il messaggio
corretto.

**Vedo l'etichetta ma nessuna riga degli strumenti.**

Controlla `streaming.progress.toolProgress`. Se è `false`, OpenClaw mantiene il
comportamento a bozza singola ma nasconde le righe di avanzamento di strumenti e attività.

**Vedo un nuovo messaggio finale invece di una bozza modificata.**

È un fallback di sicurezza. Può succedere con risposte multimediali, risposte lunghe,
destinatari di risposta espliciti, vecchie bozze Telegram, target di thread Slack mancanti,
messaggi di anteprima eliminati o finalizzazione non riuscita di stream nativi.

**Vedo ancora messaggi di avanzamento autonomi.**

La modalità di avanzamento sopprime i messaggi predefiniti autonomi di avanzamento degli strumenti quando una bozza
è attiva. Se i messaggi autonomi compaiono ancora, verifica che il turno stia effettivamente
usando la modalità di avanzamento e non `streaming.mode: "off"` o un percorso di canale che
non può creare una bozza per quel messaggio.

**Teams si comporta in modo diverso da Discord o Telegram.**

Microsoft Teams usa uno stream nativo nelle chat personali invece del trasporto generico
di anteprima invia-e-modifica. Teams tratta anche `streaming.mode: "block"` come
consegna a blocchi di Teams perché non dispone della stessa modalità a blocchi di anteprima bozza
usata da Discord e Telegram.

## Correlati

- [Streaming e suddivisione in blocchi](/it/concepts/streaming)
- [Messaggi](/it/concepts/messages)
- [Configurazione dei canali](/it/gateway/config-channels)
- [Discord](/it/channels/discord)
- [Matrix](/it/channels/matrix)
- [Microsoft Teams](/it/channels/msteams)
- [Slack](/it/channels/slack)
- [Telegram](/it/channels/telegram)

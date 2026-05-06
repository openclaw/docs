---
read_when:
    - Configurare aggiornamenti di avanzamento visibili per turni di chat di lunga durata
    - Scegliere tra le modalità di streaming parziale, a blocchi e di avanzamento
    - Spiegazione di come OpenClaw aggiorna un messaggio di canale mentre il lavoro è in corso
    - Risoluzione dei problemi relativi alle bozze di avanzamento, ai messaggi di avanzamento autonomi o al fallback di finalizzazione
summary: 'Bozze di avanzamento: un unico messaggio visibile di lavoro in corso che si aggiorna mentre un agente è in esecuzione'
title: Bozze di avanzamento
x-i18n:
    generated_at: "2026-05-06T08:47:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Le bozze di avanzamento rendono vivi nelle chat i turni dell’agente di lunga durata senza trasformare
la conversazione in una pila di risposte di stato temporanee.

Quando le bozze di avanzamento sono abilitate, OpenClaw crea un solo messaggio
visibile di lavoro in corso solo dopo che il turno dimostra che sta svolgendo lavoro reale, lo aggiorna mentre
l’agente legge, pianifica, chiama strumenti o attende approvazione, e poi trasforma quella bozza
nella risposta finale quando il canale può farlo in sicurezza.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Usa le bozze di avanzamento quando vuoi un unico messaggio di stato ordinato durante lavori
intensivi sugli strumenti e la risposta finale quando il turno è completato.

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

Di solito è sufficiente. OpenClaw sceglierà un’etichetta automatica di una parola, attenderà
finché il lavoro dura almeno cinque secondi o emette un secondo evento di lavoro, aggiungerà righe
di avanzamento compatte mentre avviene lavoro utile e sopprimerà il chiacchiericcio di avanzamento
autonomo duplicato per quel turno.

## Cosa vedono gli utenti

Una bozza di avanzamento ha due parti:

| Parte              | Scopo                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| Etichetta          | Un titolo breve come `Thinking...` o `Shelling...`.                           |
| Righe di avanzamento | Aggiornamenti di esecuzione compatti che usano le stesse etichette e icone degli strumenti dell’output dettagliato. |

L’etichetta appare dopo che l’agente avvia lavoro significativo e resta occupato
per cinque secondi oppure emette un secondo evento di lavoro. Le risposte di solo testo semplice non
mostrano una bozza di avanzamento. Le righe di avanzamento vengono aggiunte solo quando l’agente emette aggiornamenti
di lavoro utili, per esempio `🛠️ Exec`, `🔎 Web Search` o `✍️ Write: to /tmp/file`.
Per impostazione predefinita usano la stessa modalità di spiegazione compatta di `/verbose`; imposta
`agents.defaults.toolProgressDetail: "raw"` durante il debug se vuoi anche comandi/dettagli grezzi
aggiunti.
La risposta finale sostituisce la bozza quando possibile; altrimenti
OpenClaw invia normalmente la risposta finale e pulisce o smette di aggiornare la
bozza in base al trasporto del canale.

## Scegliere una modalità

`channels.<channel>.streaming.mode` controlla il comportamento visibile in corso:

| Modalità  | Ideale per                        | Cosa appare in chat                               |
| --------- | --------------------------------- | ------------------------------------------------- |
| `off`     | Canali silenziosi                 | Solo la risposta finale.                          |
| `partial` | Vedere apparire il testo della risposta | Una bozza modificata con il testo più recente della risposta. |
| `block`   | Blocchi più grandi di anteprima della risposta | Un’anteprima aggiornata o aggiunta in blocchi più grandi. |
| `progress` | Turni intensivi sugli strumenti o di lunga durata | Una bozza di stato, poi la risposta finale.       |

Scegli `progress` quando agli utenti interessa più "cosa sta succedendo" che vedere
il testo della risposta scorrere token per token.

Scegli `partial` quando la risposta stessa è il segnale di avanzamento.

Scegli `block` quando vuoi aggiornamenti di anteprima della bozza in blocchi di testo più grandi. Su
Discord e Telegram, `streaming.mode: "block"` è ancora streaming di anteprima, non
normale consegna a blocchi. Usa `streaming.block.enabled` o il legacy
`blockStreaming` quando vuoi risposte a blocchi normali.

## Configurare le etichette

Le etichette di avanzamento sono sotto `channels.<channel>.streaming.progress`.

L’etichetta predefinita è `auto`, che sceglie dal pool integrato di OpenClaw
di etichette a parola singola con puntini di sospensione:

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

Usa un’etichetta fissa:

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

Nascondi l’etichetta e mostra solo le righe di avanzamento:

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

Le righe di avanzamento sono abilitate per impostazione predefinita in modalità progress. Derivano da eventi
reali di esecuzione: avvii di strumenti, aggiornamenti di elementi, piani di attività, approvazioni, output dei comandi,
riepiloghi delle patch e attività simili dell’agente.

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

`"explain"` è l’impostazione predefinita e mantiene stabili le bozze con etichette concise come
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` aggiunge il comando/dettaglio
sottostante quando disponibile, utile durante il debug ma più rumoroso in
chat.

Per esempio, lo stesso comando appare in modo diverso a seconda della modalità di dettaglio:

| Modalità  | Riga di avanzamento                                                 |
| --------- | ------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                          |
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

Le righe di avanzamento vengono compattate automaticamente per ridurre il riadattamento della bolla di chat mentre la bozza viene modificata.

OpenClaw tronca per impostazione predefinita le righe di avanzamento lunghe, così le modifiche ripetute della bozza non
vanno a capo in modo diverso a ogni aggiornamento. Il prefisso resta leggibile e i dettagli lunghi
come percorsi o comandi grezzi vengono abbreviati con puntini di sospensione.

Slack può renderizzare le righe di avanzamento come campi strutturati Block Kit invece che come
un singolo corpo di testo:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

La renderizzazione ricca mantiene lo stesso fallback in testo semplice, così i canali e i client che
non supportano la forma più ricca possono comunque mostrare il testo di avanzamento compatto.

Mantieni la singola bozza di avanzamento ma nascondi le righe degli strumenti e delle attività:

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

Con `toolProgress: false`, OpenClaw sopprime comunque i vecchi messaggi autonomi
di avanzamento degli strumenti per quel turno. Il canale resta visivamente silenzioso fino alla
risposta finale, tranne per l’etichetta se ne è configurata una.

## Comportamento dei canali

Ogni canale usa il trasporto più pulito che supporta:

| Canale          | Trasporto di avanzamento                 | Note                                                                  |
| --------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Invia un messaggio, poi lo modifica.     | Il testo finale viene modificato sul posto quando entra in un unico messaggio di anteprima sicuro. |
| Matrix          | Invia un evento, poi lo modifica.        | La configurazione di streaming a livello account controlla le bozze a livello account. |
| Microsoft Teams | Stream nativo di Teams nelle chat personali. | `streaming.mode: "block"` viene mappato alla consegna a blocchi di Teams. |
| Slack           | Stream nativo o post bozza modificabile. | La disponibilità dei thread influisce sulla possibilità di usare lo streaming nativo. |
| Telegram        | Invia un messaggio, poi lo modifica.     | Le bozze visibili più vecchie possono essere sostituite così i timestamp finali restano utili. |
| Mattermost      | Post bozza modificabile.                 | L’attività degli strumenti viene integrata nello stesso post in stile bozza. |

I canali senza supporto sicuro alla modifica di solito ripiegano su indicatori di digitazione o
consegna solo finale.

## Finalizzazione

Quando la risposta finale è pronta, OpenClaw cerca di mantenere pulita la chat:

- Se la bozza può diventare in sicurezza la risposta finale, OpenClaw la modifica sul posto.
- Se il canale usa streaming di avanzamento nativo, OpenClaw finalizza quello stream
  quando il trasporto nativo accetta il testo finale.
- Se la risposta finale contiene media, una richiesta di approvazione, una destinazione di risposta esplicita,
  troppi blocchi o una modifica/un invio non riusciti, OpenClaw invia la risposta finale tramite
  il normale percorso di consegna del canale.

Il percorso di fallback è intenzionale. È meglio inviare una nuova risposta finale che
perdere testo, inserire una risposta nel thread sbagliato o sovrascrivere una bozza con un payload che il canale
non può rappresentare in sicurezza.

## Risoluzione dei problemi

**Vedo solo la risposta finale.**

Verifica che `channels.<channel>.streaming.mode` sia impostato su `progress` per
l’account o il canale che ha gestito il messaggio. Alcuni percorsi di gruppo o di risposta con citazione possono
disabilitare le anteprime bozza per un turno quando il canale non può modificare in sicurezza il messaggio
giusto.

**Vedo l’etichetta ma non le righe degli strumenti.**

Controlla `streaming.progress.toolProgress`. Se è `false`, OpenClaw mantiene il
comportamento della singola bozza ma nasconde le righe di avanzamento degli strumenti e delle attività.

**Vedo un nuovo messaggio finale invece di una bozza modificata.**

È un fallback di sicurezza. Può succedere per risposte con media, risposte lunghe,
destinazioni di risposta esplicite, vecchie bozze Telegram, destinazioni di thread Slack mancanti,
messaggi di anteprima eliminati o finalizzazione non riuscita dello stream nativo.

**Vedo ancora messaggi di avanzamento autonomi.**

La modalità progress sopprime i messaggi predefiniti autonomi di avanzamento degli strumenti quando una bozza
è attiva. Se i messaggi autonomi compaiono ancora, verifica che il turno stia effettivamente
usando la modalità progress e non `streaming.mode: "off"` o un percorso di canale che
non può creare una bozza per quel messaggio.

**Teams si comporta diversamente da Discord o Telegram.**

Microsoft Teams usa uno stream nativo nelle chat personali invece del trasporto generico
di anteprima invia-e-modifica. Teams tratta anche `streaming.mode: "block"` come
consegna a blocchi di Teams perché non ha la stessa modalità a blocchi di anteprima bozza
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

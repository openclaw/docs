---
read_when:
    - Configurazione degli aggiornamenti di avanzamento visibili per i turni di chat di lunga durata
    - Scegliere tra le modalità di streaming parziale, a blocchi e di avanzamento
    - Spiegare come OpenClaw aggiorna un messaggio di canale mentre il lavoro è in corso
    - Risoluzione dei problemi relativi a bozze di avanzamento, messaggi di avanzamento autonomi o fallback di finalizzazione
summary: 'Bozze di avanzamento: un unico messaggio visibile di lavoro in corso che si aggiorna mentre un agente è in esecuzione'
title: Bozze di avanzamento
x-i18n:
    generated_at: "2026-06-27T17:27:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Le bozze di avanzamento fanno sembrare vivi in chat i turni dell'agente di lunga durata senza trasformare la conversazione in una pila di risposte di stato temporanee.

Quando le bozze di avanzamento sono abilitate, OpenClaw crea un solo messaggio visibile di lavoro in corso solo dopo che il turno dimostra che sta svolgendo lavoro reale, lo aggiorna mentre l'agente legge, pianifica, chiama strumenti o attende approvazione, quindi trasforma quella bozza nella risposta finale quando il canale può farlo in modo sicuro.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Usa le bozze di avanzamento quando vuoi un solo messaggio di stato ordinato durante attività con molti strumenti e la risposta finale al termine del turno.

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

Di solito basta questo. OpenClaw sceglierà un'etichetta automatica di una parola, attenderà finché il lavoro dura almeno cinque secondi o emette un secondo evento di lavoro, aggiungerà righe di avanzamento compatte mentre avviene lavoro utile e sopprimerà il chiacchiericcio di avanzamento autonomo duplicato per quel turno.

## Cosa vedono gli utenti

Una bozza di avanzamento ha due parti:

| Parte                  | Scopo                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| Etichetta              | Una breve riga iniziale/di stato come `Working` o `Shelling`.                                      |
| Righe di avanzamento   | Aggiornamenti compatti dell'esecuzione con le stesse icone degli strumenti e lo stesso formattatore dei dettagli dell'output dettagliato. |

L'etichetta appare dopo che l'agente avvia lavoro significativo e rimane occupato per cinque secondi oppure emette un secondo evento di lavoro. Fa parte dell'elenco scorrevole delle righe di avanzamento, quindi lo stato iniziale scorre via quando compaiono abbastanza attività concrete. Le risposte di solo testo semplice non mostrano una bozza di avanzamento. Le righe di avanzamento vengono aggiunte solo quando l'agente emette aggiornamenti utili sul lavoro, per esempio `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"` o `✍️ Write: to /tmp/file`.
Per impostazione predefinita usano la stessa modalità di spiegazione compatta di `/verbose`; imposta `agents.defaults.toolProgressDetail: "raw"` durante il debug se vuoi anche comandi/dettagli grezzi aggiunti.
La risposta finale sostituisce la bozza quando possibile; altrimenti OpenClaw invia normalmente la risposta finale e ripulisce o smette di aggiornare la bozza in base al trasporto del canale.

## Scegliere una modalità

`channels.<channel>.streaming.mode` controlla il comportamento visibile durante il lavoro:

| Modalità   | Ideale per                                | Cosa appare in chat                                  |
| ---------- | ----------------------------------------- | ---------------------------------------------------- |
| `off`      | Canali silenziosi                         | Solo la risposta finale.                             |
| `partial`  | Osservare apparire il testo della risposta | Una bozza modificata con il testo più recente della risposta. |
| `block`    | Blocchi più grandi di anteprima risposta  | Un'anteprima aggiornata o aggiunta in blocchi più grandi. |
| `progress` | Turni con molti strumenti o di lunga durata | Una bozza di stato, poi la risposta finale.          |

Scegli `progress` quando agli utenti interessa di più "cosa sta succedendo" che guardare il testo della risposta scorrere token per token.

Scegli `partial` quando la risposta stessa è il segnale di avanzamento.

Scegli `block` quando vuoi aggiornamenti di anteprima della bozza in blocchi di testo più grandi. Su Discord e Telegram, `streaming.mode: "block"` è comunque streaming di anteprima, non normale consegna a blocchi. Usa `streaming.block.enabled` o il legacy `blockStreaming` quando vuoi normali risposte a blocchi.

## Configurare le etichette

Le etichette di avanzamento si trovano in `channels.<channel>.streaming.progress`.

L'etichetta predefinita è `auto`, che sceglie dal pool integrato di etichette di una parola di OpenClaw:

```text
Working
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
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

Le righe di avanzamento sono abilitate per impostazione predefinita in modalità progress. Provengono da eventi reali dell'esecuzione: avvii di strumenti, aggiornamenti di elementi, piani di attività, approvazioni, output di comandi, riepiloghi di patch e attività simili dell'agente.

Gli strumenti possono anche emettere avanzamento tipizzato mentre una singola chiamata allo strumento è ancora in esecuzione. È così che un recupero o una ricerca lenta può aggiornare la bozza visibile prima che lo strumento restituisca il risultato finale. L'aggiornamento di avanzamento è un risultato parziale dello strumento con contenuto del modello vuoto e metadati espliciti del canale pubblico:

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw renderizza solo `progress.text` nell'interfaccia di avanzamento del canale. Il normale risultato dello strumento arriva comunque più tardi come `content` e `details`, ed è l'unica parte restituita al modello.

Quando aggiungi avanzamento a uno strumento, usa un messaggio breve e generico e ritardalo finché l'operazione è rimasta in sospeso abbastanza a lungo da essere utile:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Questo schema significa che le chiamate rapide non mostrano una riga di avanzamento, le chiamate lunghe ne mostrano una mentre sono ancora in sospeso e le chiamate annullate cancellano il timer prima che possa apparire avanzamento obsoleto. Il testo di avanzamento è un canale laterale pubblico dell'interfaccia utente, quindi non deve includere segreti, argomenti grezzi, contenuti recuperati, output di comandi o testo di pagine.

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

`"explain"` è il valore predefinito e mantiene stabili le bozze con etichette concise come `🛠️ check JS syntax for /tmp/app.js`. `"raw"` aggiunge il comando/dettaglio sottostante quando disponibile, il che è utile durante il debug ma più rumoroso in chat.

Per esempio, lo stesso comando appare in modo diverso a seconda della modalità di dettaglio:

| Modalità  | Riga di avanzamento                                           |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Le righe di avanzamento vengono compattate automaticamente per ridurre il ridisposizionamento del fumetto della chat mentre la bozza viene modificata.

OpenClaw tronca per impostazione predefinita le righe di avanzamento lunghe, così le modifiche ripetute alla bozza non vanno a capo in modo diverso a ogni aggiornamento. Il budget predefinito per riga è di 120 caratteri. La prosa viene tagliata al confine di una parola, mentre dettagli lunghi come percorsi o comandi grezzi vengono abbreviati con puntini di sospensione centrali, così il suffisso resta visibile.

Regola il budget per riga:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

Slack può renderizzare le righe di avanzamento come campi strutturati Block Kit invece che come un unico corpo di testo:

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

La renderizzazione ricca mantiene lo stesso fallback in testo semplice, così i canali e i client che non supportano la forma più ricca possono comunque mostrare il testo di avanzamento compatto.

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

Con `toolProgress: false`, OpenClaw sopprime comunque i vecchi messaggi autonomi di avanzamento strumenti per quel turno. Il canale resta visivamente silenzioso fino alla risposta finale, tranne per l'etichetta se ne è configurata una.

## Comportamento dei canali

Ogni canale usa il trasporto più pulito che supporta:

| Canale          | Trasporto dell'avanzamento             | Note                                                                  |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Invia un messaggio, poi lo modifica.   | Il testo finale viene modificato sul posto quando rientra in un messaggio di anteprima sicuro. |
| Matrix          | Invia un evento, poi lo modifica.      | La configurazione di streaming a livello account controlla le bozze a livello account. |
| Microsoft Teams | Stream Teams nativo nelle chat personali. | `streaming.mode: "block"` si mappa alla consegna a blocchi di Teams. |
| Slack           | Stream nativo o post bozza modificabile. | La disponibilità del thread influisce sulla possibilità di usare lo streaming nativo. |
| Telegram        | Invia un messaggio, poi lo modifica.   | Le bozze visibili più vecchie possono essere sostituite affinché i timestamp finali restino utili. |
| Mattermost      | Post bozza modificabile.               | L'attività degli strumenti viene incorporata nello stesso post in stile bozza. |

I canali senza supporto sicuro alla modifica di solito ripiegano sugli indicatori di digitazione o sulla consegna solo finale.

## Finalizzazione

Quando la risposta finale è pronta, OpenClaw prova a mantenere pulita la chat:

- Se la bozza può diventare in modo sicuro la risposta finale, OpenClaw la modifica sul posto.
- Se il canale usa streaming di avanzamento nativo, OpenClaw finalizza quello stream quando il trasporto nativo accetta il testo finale.
- Se la risposta finale contiene media, una richiesta di approvazione, un destinatario di risposta esplicito, troppi blocchi o una modifica/invio non riusciti, OpenClaw invia la risposta finale tramite il normale percorso di consegna del canale.

Il percorso di fallback è intenzionale. È meglio inviare una nuova risposta finale che perdere testo, inserire una risposta nel thread sbagliato o sovrascrivere una bozza con un payload che il canale non può rappresentare in modo sicuro.

## Risoluzione dei problemi

**Vedo solo la risposta finale.**

Verifica che `channels.<channel>.streaming.mode` sia impostato su `progress` per l'account o il canale che ha gestito il messaggio. Alcuni percorsi di gruppo o di risposta con citazione possono disabilitare le anteprime bozza per un turno quando il canale non può modificare in modo sicuro il messaggio corretto.

**Vedo l'etichetta ma nessuna riga degli strumenti.**

Verifica `streaming.progress.toolProgress`. Se è `false`, OpenClaw mantiene il comportamento a bozza singola ma nasconde le righe di avanzamento di strumenti e attività.

**Vedo un nuovo messaggio finale invece di una bozza modificata.**

È un fallback di sicurezza. Può accadere per risposte con media, risposte lunghe, destinatari di risposta espliciti, vecchie bozze Telegram, target di thread Slack mancanti, messaggi di anteprima eliminati o finalizzazione non riuscita dello stream nativo.

**Vedo ancora messaggi di avanzamento autonomi.**

La modalità progress sopprime i messaggi autonomi predefiniti di avanzamento strumenti quando una bozza è attiva. Se i messaggi autonomi appaiono comunque, verifica che il turno stia effettivamente usando la modalità progress e non `streaming.mode: "off"` o un percorso del canale che non può creare una bozza per quel messaggio.

**Teams si comporta diversamente da Discord o Telegram.**

Microsoft Teams usa uno stream nativo nelle chat personali invece del trasporto generico
di anteprima con invio e modifica. Teams tratta anche `streaming.mode: "block"` come
consegna a blocchi di Teams perché non dispone della stessa modalità a blocchi con anteprima bozza
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

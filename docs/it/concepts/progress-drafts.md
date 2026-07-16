---
read_when:
    - Configurazione degli aggiornamenti visibili sullo stato di avanzamento per turni di chat di lunga durata
    - Scegliere tra le modalità di streaming parziale, a blocchi e di avanzamento
    - Spiegazione di come OpenClaw aggiorna un singolo messaggio del canale mentre il lavoro è in corso
    - Risoluzione dei problemi relativi alle bozze di avanzamento, ai messaggi di avanzamento autonomi o al fallback di finalizzazione
summary: 'Bozze di avanzamento: un unico messaggio visibile sui lavori in corso che si aggiorna durante l''esecuzione di un agente'
title: Bozze in corso
x-i18n:
    generated_at: "2026-07-16T14:17:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Le bozze di avanzamento trasformano un messaggio del canale in una riga di stato in tempo reale mentre un
agente lavora, anziché creare una serie di risposte temporanee "ancora in elaborazione". Impostando
`channels.<channel>.streaming.mode: "progress"`, OpenClaw crea il
messaggio quando inizia il lavoro effettivo, lo modifica mentre l'agente legge, pianifica, chiama
strumenti o attende un'approvazione, quindi lo trasforma nella risposta finale.

```text
Elaborazione in corso...
📖 da docs/concepts/progress-drafts.md
🔎 Ricerca Web: per "discord edit message"
🛠️ Bash: esecuzione dei test
```

<Note>
  Discord usa già `streaming.mode: "progress"` come valore predefinito quando
  `channels.discord.streaming` non è impostato, quindi le bozze di avanzamento
  vengono visualizzate senza alcuna configurazione. Ogni altro canale usa come valore predefinito `partial`
  o `off`; consultare [Streaming e suddivisione in blocchi](/it/concepts/streaming#channel-mapping)
  per la tabella completa dei valori predefiniti di ciascun canale.
</Note>

## Avvio rapido

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

Da questo punto si applicano i seguenti valori predefiniti: un ritardo iniziale di 5 secondi, righe di avanzamento compatte mentre
viene svolto lavoro utile e la soppressione dei precedenti messaggi di avanzamento autonomi
per quel turno. Le bozze delle righe non elaborate degli strumenti usano
un'etichetta automatica di una sola parola; un'intestazione di stato omette tale titolo ridondante,
a meno che non ne venga configurato esplicitamente uno.

Questa pagina descrive l'esperienza delle bozze di avanzamento e le relative opzioni di configurazione. Per la
matrice completa delle modalità di streaming, le note di runtime specifiche per canale e la migrazione
delle chiavi legacy, consultare [Streaming e suddivisione in blocchi](/it/concepts/streaming).

## Cosa vedono gli utenti

| Parte                | Scopo                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Intestazione di stato | Su Discord e Telegram, il preambolo del modello; Discord aggiunge un testo riempitivo di utilità. |
| Etichetta            | Riga iniziale/di stato facoltativa, come `Working`.                                  |
| Righe di avanzamento | Aggiornamenti compatti dell'esecuzione che usano le stesse icone degli strumenti e lo stesso formattatore dei dettagli di `/verbose`. |

Per l'avanzamento non elaborato degli strumenti, l'etichetta appare quando l'agente inizia un lavoro significativo
e rimane occupato per tutta la durata del ritardo iniziale.
Si trova nella parte superiore dell'elenco scorrevole delle righe di avanzamento, quindi scorre fuori dalla vista quando
appaiono abbastanza righe di lavoro concreto. Un'intestazione di stato mostra solo lo stato
dell'agente in linguaggio semplice, a meno che non venga configurata esplicitamente un'etichetta. Le risposte costituite
esclusivamente da testo normale non mostrano mai una bozza di avanzamento; una riga appare solo per aggiornamenti di lavoro effettivi,
ad esempio `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`
o `✍️ Write: to /tmp/file`.

La risposta finale sostituisce la bozza sul posto quando il canale può farlo in modo
sicuro; altrimenti OpenClaw invia la risposta finale tramite il normale recapito e
ripulisce la bozza o smette di aggiornarla (consultare [Finalizzazione](#finalization)).

## Scelta di una modalità

`channels.<channel>.streaming.mode` controlla il comportamento visibile durante l'elaborazione:

| Modalità          | Ideale per                              | Cosa appare nella chat                                  |
| ----------------- | --------------------------------------- | ------------------------------------------------------- |
| `off` | Canali silenziosi                       | Solo la risposta finale.                                |
| `partial` | Osservare la comparsa del testo della risposta | Una bozza modificata con il testo più recente della risposta. |
| `block` | Blocchi più grandi di anteprima della risposta | Un'anteprima aggiornata o ampliata in blocchi più grandi. |
| `progress` | Turni con molti strumenti o di lunga durata | Una bozza di stato, quindi la risposta finale.           |

Scegliere `progress` quando per gli utenti è più importante sapere "cosa sta succedendo" che osservare
lo streaming del testo della risposta token per token; `partial` quando il testo stesso della risposta è
il segnale di avanzamento; `block` per blocchi di anteprima più grandi. Su Discord e
Telegram, `streaming.mode: "block"` rimane uno streaming dell'anteprima, non il normale
recapito delle risposte in blocchi: usare `streaming.block.enabled` per quest'ultimo.

## Configurazione delle etichette

Le etichette di avanzamento si trovano in `channels.<channel>.streaming.progress`. L'etichetta predefinita
per le righe non elaborate degli strumenti è `"auto"`, che usa la semplice etichetta integrata `Working`.
Un'intestazione di stato nasconde tale etichetta implicita; impostare
esplicitamente `label: "auto"` se si desidera visualizzare un'etichetta anche sopra di essa:

```text
Elaborazione in corso
```

Usare un'etichetta fissa:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Analisi in corso",
        },
      },
    },
  },
}
```

Usare un insieme personalizzato di etichette (la selezione avviene comunque in modo casuale/in base al seed quando `label: "auto"`):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Verifica", "Lettura", "Test", "Completamento"],
        },
      },
    },
  },
}
```

Nascondere l'etichetta e mostrare solo le righe di avanzamento:

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

## Controllo delle righe di avanzamento

Le righe di avanzamento derivano da eventi di esecuzione reali: avvio di strumenti, aggiornamenti di elementi, piani
delle attività, approvazioni, output dei comandi, riepiloghi delle patch e attività simili dell'agente.
Sono abilitate per impostazione predefinita (`progress.toolProgress`, valore predefinito `true`).

Gli strumenti possono inoltre emettere aggiornamenti di avanzamento tipizzati mentre una singola chiamata è ancora in esecuzione. In questo
modo, un recupero o una ricerca lenta aggiorna la bozza visibile prima che lo strumento
restituisca il risultato finale. L'aggiornamento di avanzamento è un risultato parziale dello strumento con
contenuto del modello vuoto e metadati pubblici espliciti del canale:

```json
{
  "content": [],
  "progress": {
    "text": "Recupero del contenuto della pagina...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw visualizza solo `progress.text` nell'interfaccia di avanzamento del canale. Il normale
risultato dello strumento arriva comunque in seguito come `content`/`details` ed è l'unica parte
restituita al modello.

Quando si aggiunge l'avanzamento a uno strumento, emettere un messaggio breve e generico e ritardarlo
finché l'operazione non è rimasta in sospeso abbastanza a lungo da renderlo utile. `web_fetch`
esegue esattamente questa operazione con un ritardo di 5 secondi:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Recupero del contenuto della pagina...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Le chiamate rapide non mostrano alcuna riga di avanzamento; quelle lunghe ne mostrano una mentre sono ancora in sospeso;
le chiamate annullate cancellano il timer prima che possa apparire un aggiornamento obsoleto. Il testo di avanzamento
è un canale laterale pubblico dell'interfaccia utente, quindi non deve mai includere segreti, argomenti non elaborati,
contenuto recuperato, output dei comandi o testo delle pagine.

### Modalità dei dettagli

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

`"explain"` è il valore predefinito e mantiene stabili le bozze mediante etichette concise.
`"raw"` aggiunge il comando sottostante quando disponibile, risultando utile durante
il debug ma più invasivo nella chat. Ad esempio, una chiamata `node --check /tmp/app.js`
viene visualizzata diversamente in base alla modalità:

| Modalità          | Riga di avanzamento                                              |
| ----------------- | ---------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                                               |
| `raw` | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js`                                               |

### Testo dei comandi/exec

`streaming.progress.commandText` (valore predefinito `"raw"`) controlla la quantità di dettagli del comando
mostrati accanto alle righe di avanzamento exec/bash, indipendentemente dalla modalità dei dettagli
indicata sopra. Impostarlo su `"status"` per mantenere visibile una riga di avanzamento dello strumento nascondendo
completamente il testo del comando:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Corsia dei commenti

`streaming.progress.commentary` (valore predefinito `false`) alterna la narrazione dei commenti/preamboli
del modello prima degli strumenti (💬, ad esempio "Verificherò... quindi
...") con le righe degli strumenti nella bozza. Consultare
[Streaming e suddivisione in blocchi](/it/concepts/streaming#commentary-progress-lane) per la
struttura di configurazione condivisa tra i canali.

Quando la corsia dei commenti è abilitata, i preamboli vengono visualizzati solo come queste righe 💬
alternate; l'intestazione di stato descritta di seguito non viene mostrata, affinché la corsia mantenga la
struttura documentata.

### Intestazione di stato

Su Discord e Telegram in modalità di avanzamento, il preambolo tipizzato del modello prima degli strumenti
diventa l'intestazione di stato della bozza quando è disponibile. Gli altri
canali in modalità di avanzamento mantengono il comportamento di stato esistente. L'intestazione è attiva
per impostazione predefinita e non aggira il normale criterio di attività per i turni brevi;
l'abilitazione di `streaming.progress.commentary` inoltra invece i preamboli alla corsia
dei commenti alternati.

Su Discord, quando viene risolto un modello di utilità per l'agente, ovvero un
[`utilityModel`](/it/gateway/config-agents#utilitymodel) esplicito o il valore predefinito
del modello piccolo dichiarato dal provider principale (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`), questo fornisce un breve testo riempitivo in linguaggio semplice
quando il modello non emette alcun preambolo o rimane inattivo per circa 20 secondi
(attualmente l'intestazione di Telegram usa solo il preambolo):

```text
Aggiornamento del modello predefinito nella configurazione, quindi riavvio del gateway per
applicarlo. Una chiamata per elencare gli agenti non è riuscita ed è in corso un nuovo tentativo.
```

La narrazione di utilità è attiva per impostazione predefinita (`streaming.progress.narration`, valore predefinito
`true`) e non ricorre mai al modello principale: viene eseguita solo con un
`utilityModel` esplicito o un valore predefinito dichiarato dal provider per il provider
principale dell'agente. Impostare `utilityModel: ""` per disabilitare completamente l'instradamento di utilità. Le righe degli strumenti
continuano ad accumularsi sotto e ricompaiono se entrambe le fonti di stato si interrompono. Le modifiche
della bozza continuano ad attendere il normale criterio di attività e un'effettiva
variazione del testo, evitando brevi apparizioni nei turni rapidi e riducendo il numero di modifiche nei canali
molto attivi. Impostare `narration: false` per disabilitare solo il testo riempitivo del modello di utilità; le intestazioni
dei preamboli del modello rimangono abilitate:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

L'input della narrazione è limitato e oscurato: il modello di utilità riceve il
testo della richiesta in ingresso insieme agli stessi riepiloghi compatti e oscurati degli strumenti che la bozza
visualizzerebbe, mai l'output non elaborato dei comandi o i risultati degli strumenti. Con
`commandText: "status"`, l'input della narrazione omette anche il testo dei comandi exec/bash,
in modo coerente con quanto mostrato dalla bozza.

### Limiti delle righe

Limitare il numero di righe che rimangono visibili (valore predefinito 8):

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

Le righe di avanzamento vengono compattate automaticamente per ridurre il riadattamento delle bolle della chat mentre
la bozza viene modificata e OpenClaw tronca le righe lunghe affinché le modifiche ripetute della bozza
non vadano a capo in modo diverso a ogni aggiornamento. Il limite predefinito per riga è di 120
caratteri; il testo viene tagliato in corrispondenza del confine di una parola, mentre i dettagli lunghi, come percorsi o
comandi non elaborati, vengono abbreviati con puntini di sospensione centrali affinché il suffisso rimanga visibile.

Regolare il limite per riga:

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

### Rendering avanzato (Slack)

Slack può visualizzare le righe di avanzamento come campi strutturati di Block Kit anziché
come testo normale:

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

Il rendering avanzato invia sempre lo stesso corpo di testo normale insieme ai campi di Block Kit,
così i client che non possono visualizzare la struttura più ricca continuano a mostrare il testo
compatto dell'avanzamento.

### Nascondere le righe di strumenti/attività

Mantenere la singola bozza di avanzamento ma nascondere le righe di strumenti e attività:

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

Con `toolProgress: false`, OpenClaw continua a sopprimere i precedenti messaggi autonomi
sull'avanzamento degli strumenti per quel turno: il canale rimane visivamente silenzioso fino
alla risposta finale, ad eccezione dell'etichetta, se ne è configurata una.

## Comportamento del canale

| Canale          | Trasporto dell'avanzamento                  | Note                                                                                                                                                                                                  |
| --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Invia un messaggio, quindi lo modifica.     | Per impostazione predefinita usa la modalità `progress`; la risposta finale include una ricevuta di attività `-#` e la bozza di stato viene eliminata dopo la consegna della risposta. |
| Matrix          | Invia un evento, quindi lo modifica.        | La configurazione dello streaming a livello di account controlla le bozze a livello di account.                                                                                                       |
| Microsoft Teams | Stream nativo di Teams nelle chat personali. | `streaming.mode: "block"` viene invece associato alla consegna a blocchi di Teams.                                                                                                                            |
| Slack           | Stream nativo o post di bozza modificabile. | Richiede una destinazione in un thread di risposta; i messaggi diretti di primo livello senza una destinazione continuano a ricevere post di anteprima della bozza e relative modifiche.                |
| Telegram        | Invia un messaggio, quindi lo modifica.     | Se arriva un messaggio tra la bozza di avanzamento e la risposta, la bozza viene ripubblicata sotto di esso (prima pubblica il nuovo, poi elimina il vecchio), invece di far saltare lo scorrimento del client. |
| Mattermost      | Post di bozza modificabile.                 | La modalità `block` alterna il testo completato e i post sull'attività degli strumenti; le altre modalità incorporano l'attività degli strumenti nello stesso post in stile bozza.          |

I canali che non supportano modifiche sicure ripiegano sugli indicatori di digitazione o
sulla consegna della sola risposta finale. Consultare [Streaming e suddivisione in blocchi](/it/concepts/streaming) per la
descrizione completa del comportamento di runtime per ciascun canale.

## Finalizzazione

Quando la risposta finale è pronta, OpenClaw tenta di mantenere ordinata la chat:

- Nella modalità `progress` su Discord, la risposta finale viene inviata come nuovo messaggio
  con una piccola ricevuta di attività `-#` aggiunta (ad esempio
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`) e la bozza di stato viene
  eliminata dopo la consegna della risposta. Nei canali molto attivi non rimangono registri orfani degli strumenti
  sopra la risposta; in caso di errore finale, la bozza viene mantenuta come traccia visibile del
  turno non riuscito.
- Se la bozza può diventare in sicurezza la risposta finale (modalità `partial`/`block`),
  OpenClaw la modifica direttamente.
- Se il canale utilizza lo streaming nativo dell'avanzamento, OpenClaw finalizza tale
  stream quando il trasporto nativo accetta il testo finale.
- Altrimenti (contenuti multimediali, una richiesta di approvazione, una destinazione di risposta esplicita, troppi
  blocchi o una modifica/un invio non riusciti), OpenClaw invia la risposta finale tramite il
  normale percorso di consegna del canale anziché sovrascrivere la bozza.

Il ripiego è intenzionale: inviare una nuova risposta finale è preferibile a perdere testo,
associare la risposta al thread errato o sovrascrivere una bozza con un payload che il canale
non può rappresentare in sicurezza.

## Risoluzione dei problemi

**Viene visualizzata solo la risposta finale.**

Verificare che `channels.<channel>.streaming.mode` sia `progress` per l'account
o il canale che ha gestito il messaggio. Alcuni percorsi di gruppo o di risposta con citazione disabilitano
le anteprime delle bozze per un turno quando il canale non può modificare in sicurezza il
messaggio corretto.

**Viene visualizzata l'etichetta, ma non le righe degli strumenti.**

Verificare `streaming.progress.toolProgress`. Se è `false`, OpenClaw mantiene il
comportamento con una singola bozza, ma nasconde le righe di avanzamento degli strumenti e delle attività.

**Viene visualizzato un nuovo messaggio finale anziché una bozza modificata.**

Si tratta del ripiego di sicurezza descritto in [Finalizzazione](#finalization). Può
verificarsi per risposte con contenuti multimediali, risposte lunghe, destinazioni di risposta esplicite, vecchie bozze di Telegram,
destinazioni di thread Slack mancanti, messaggi di anteprima eliminati o una
finalizzazione dello stream nativo non riuscita.

**Vengono ancora visualizzati messaggi autonomi sull'avanzamento.**

La modalità di avanzamento sopprime i messaggi autonomi predefiniti sull'avanzamento degli strumenti ogni volta che è
attiva una bozza. Se vengono ancora visualizzati messaggi autonomi, verificare che il turno stia
effettivamente utilizzando la modalità `progress` e non `streaming.mode: "off"` o un percorso del canale
che non può creare una bozza per quel messaggio.

**Teams si comporta diversamente da Discord o Telegram.**

Microsoft Teams utilizza uno stream nativo nelle chat personali anziché il trasporto generico
di anteprima basato su invio e modifica e associa `streaming.mode: "block"` alla
consegna a blocchi di Teams, poiché non dispone di una modalità a blocchi per l'anteprima delle bozze come Discord e
Telegram.

## Argomenti correlati

- [Streaming e suddivisione in blocchi](/it/concepts/streaming)
- [Messaggi](/it/concepts/messages)
- [Configurazione dei canali](/it/gateway/config-channels)
- [Discord](/it/channels/discord)
- [Matrix](/it/channels/matrix)
- [Microsoft Teams](/it/channels/msteams)
- [Slack](/it/channels/slack)
- [Telegram](/it/channels/telegram)
- [Mattermost](/it/channels/mattermost)

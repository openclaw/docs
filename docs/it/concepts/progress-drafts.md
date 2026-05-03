---
read_when:
    - Configurare gli aggiornamenti di avanzamento visibili per turni di chat a lunga esecuzione
    - Scelta tra le modalità di streaming parziale, a blocchi e di avanzamento
    - Spiegazione di come OpenClaw aggiorna un messaggio di canale mentre il lavoro è in corso
    - Risoluzione dei problemi relativi alle bozze di avanzamento, ai messaggi di avanzamento autonomi o al meccanismo di ripiego della finalizzazione
summary: 'Bozze di avanzamento: un unico messaggio visibile di lavoro in corso che si aggiorna mentre un agente è in esecuzione'
title: Bozze di avanzamento
x-i18n:
    generated_at: "2026-05-03T21:31:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Le bozze di avanzamento rendono vivi in chat i turni agent di lunga durata senza trasformare
la conversazione in una pila di risposte di stato temporanee.

Quando le bozze di avanzamento sono abilitate, OpenClaw crea un unico messaggio
visibile di lavoro in corso, lo aggiorna mentre l’agent legge, pianifica,
chiama strumenti o attende l’approvazione, e poi trasforma quella bozza nella
risposta finale quando il canale può farlo in sicurezza.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Usa le bozze di avanzamento quando vuoi un unico messaggio di stato ordinato durante
lavori intensivi con strumenti e la risposta finale quando il turno è concluso.

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

Di solito basta questo. OpenClaw sceglierà un’etichetta automatica di una parola,
aggiungerà righe di avanzamento compatte mentre avviene lavoro utile e sopprimerà
il chiacchiericcio di avanzamento autonomo duplicato per quel turno.

## Cosa vedono gli utenti

Una bozza di avanzamento ha due parti:

| Parte                 | Scopo                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Etichetta             | Un titolo breve come `Thinking` o `Shelling`.                          |
| Righe di avanzamento  | Aggiornamenti di esecuzione compatti come chiamate a strumenti, passaggi di attività o approvazioni. |

L’etichetta appare immediatamente quando l’agent inizia a rispondere. Le righe di
avanzamento vengono aggiunte solo quando l’agent emette aggiornamenti di lavoro
utili. La risposta finale sostituisce la bozza quando possibile; altrimenti
OpenClaw invia normalmente la risposta finale e ripulisce o smette di aggiornare
la bozza in base al trasporto del canale.

## Scegli una modalità

`channels.<channel>.streaming.mode` controlla il comportamento visibile in corso:

| Modalità   | Ideale per                         | Cosa appare in chat                               |
| ---------- | ---------------------------------- | ------------------------------------------------- |
| `off`      | Canali silenziosi                  | Solo la risposta finale.                          |
| `partial`  | Vedere apparire il testo della risposta | Una bozza modificata con il testo più recente della risposta. |
| `block`    | Blocchi di anteprima risposta più grandi | Un’anteprima aggiornata o aggiunta in blocchi più grandi. |
| `progress` | Turni intensivi con strumenti o di lunga durata | Una bozza di stato, poi la risposta finale.       |

Scegli `progress` quando agli utenti interessa più "cosa sta succedendo" che
vedere il testo della risposta scorrere token per token.

Scegli `partial` quando la risposta stessa è il segnale di avanzamento.

Scegli `block` quando vuoi aggiornamenti della bozza di anteprima in blocchi di
testo più grandi. Su Discord e Telegram, `streaming.mode: "block"` è ancora
streaming di anteprima, non normale consegna a blocchi. Usa
`streaming.block.enabled` o il legacy `blockStreaming` quando vuoi risposte
normali a blocchi.

## Configura le etichette

Le etichette di avanzamento si trovano in `channels.<channel>.streaming.progress`.

L’etichetta predefinita è `auto`, che sceglie dal pool integrato di etichette di
una parola di OpenClaw:

```text
Thinking
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

## Controlla le righe di avanzamento

Le righe di avanzamento sono abilitate per impostazione predefinita in modalità
progress. Provengono da eventi di esecuzione reali: avvii di strumenti,
aggiornamenti di elementi, piani di attività, approvazioni, output dei comandi,
riepiloghi delle patch e attività agent simili.

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

Con `toolProgress: false`, OpenClaw sopprime comunque i vecchi messaggi autonomi
di avanzamento strumenti per quel turno. Il canale resta visivamente silenzioso
fino alla risposta finale, tranne per l’etichetta se ne è configurata una.

## Comportamento dei canali

Ogni canale usa il trasporto più pulito che supporta:

| Canale          | Trasporto di avanzamento             | Note                                                                  |
| --------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Discord         | Invia un messaggio, poi lo modifica. | Il testo finale viene modificato sul posto quando rientra in un messaggio di anteprima sicuro. |
| Matrix          | Invia un evento, poi lo modifica.    | La configurazione dello streaming a livello di account controlla le bozze a livello di account. |
| Microsoft Teams | Stream Teams nativo nelle chat personali. | `streaming.mode: "block"` corrisponde alla consegna a blocchi di Teams. |
| Slack           | Stream nativo o post bozza modificabile. | La disponibilità dei thread influisce sulla possibilità di usare lo streaming nativo. |
| Telegram        | Invia un messaggio, poi lo modifica. | Le bozze visibili più vecchie possono essere sostituite così i timestamp finali restano utili. |
| Mattermost      | Post bozza modificabile.             | L’attività degli strumenti viene incorporata nello stesso post in stile bozza. |

I canali senza supporto sicuro alla modifica di solito ripiegano sugli
indicatori di digitazione o sulla consegna solo finale.

## Finalizzazione

Quando la risposta finale è pronta, OpenClaw prova a mantenere pulita la chat:

- Se la bozza può diventare in sicurezza la risposta finale, OpenClaw la modifica sul posto.
- Se il canale usa lo streaming di avanzamento nativo, OpenClaw finalizza quello stream
  quando il trasporto nativo accetta il testo finale.
- Se la risposta finale contiene media, una richiesta di approvazione, un target di risposta esplicito,
  troppi blocchi, o una modifica/un invio non riusciti, OpenClaw invia la risposta finale tramite
  il normale percorso di consegna del canale.

Il percorso di fallback è intenzionale. È meglio inviare una nuova risposta finale
che perdere testo, inserire una risposta nel thread sbagliato o sovrascrivere una
bozza con un payload che il canale non può rappresentare in sicurezza.

## Risoluzione dei problemi

**Vedo solo la risposta finale.**

Controlla che `channels.<channel>.streaming.mode` sia impostato su `progress` per
l’account o il canale che ha gestito il messaggio. Alcuni percorsi di gruppo o di
risposta con citazione possono disabilitare le anteprime bozza per un turno
quando il canale non può modificare in sicurezza il messaggio giusto.

**Vedo l’etichetta ma nessuna riga di strumenti.**

Controlla `streaming.progress.toolProgress`. Se è `false`, OpenClaw mantiene il
comportamento a bozza singola ma nasconde le righe di avanzamento di strumenti e
attività.

**Vedo un nuovo messaggio finale invece di una bozza modificata.**

È un fallback di sicurezza. Può succedere per risposte con media, risposte lunghe,
target di risposta espliciti, vecchie bozze Telegram, target di thread Slack
mancanti, messaggi di anteprima eliminati o finalizzazione dello stream nativo
non riuscita.

**Vedo ancora messaggi di avanzamento autonomi.**

La modalità progress sopprime i messaggi predefiniti autonomi di avanzamento
strumenti quando una bozza è attiva. Se i messaggi autonomi appaiono ancora,
verifica che il turno stia effettivamente usando la modalità progress e non
`streaming.mode: "off"` o un percorso di canale che non può creare una bozza per
quel messaggio.

**Teams si comporta diversamente da Discord o Telegram.**

Microsoft Teams usa uno stream nativo nelle chat personali invece del trasporto
generico di anteprima invia-e-modifica. Teams tratta anche
`streaming.mode: "block"` come consegna a blocchi di Teams perché non ha la stessa
modalità di blocchi di anteprima bozza usata da Discord e Telegram.

## Correlati

- [Streaming e suddivisione in blocchi](/it/concepts/streaming)
- [Messaggi](/it/concepts/messages)
- [Configurazione dei canali](/it/gateway/config-channels)
- [Discord](/it/channels/discord)
- [Matrix](/it/channels/matrix)
- [Microsoft Teams](/it/channels/msteams)
- [Slack](/it/channels/slack)
- [Telegram](/it/channels/telegram)

---
read_when:
    - Creazione di client Matrix che visualizzano risposte ricche di OpenClaw
    - Debug del contenuto dell'evento com.openclaw.presentation
summary: Metadati MessagePresentation di Matrix per client compatibili con OpenClaw
title: Metadati di presentazione di Matrix
x-i18n:
    generated_at: "2026-05-10T19:22:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw può allegare metadati `MessagePresentation` normalizzati agli eventi Matrix `m.room.message` in uscita sotto `com.openclaw.presentation`.

I client Matrix standard continuano a renderizzare il testo semplice `body`. I client compatibili con OpenClaw possono leggere i metadati strutturati e renderizzare UI native come pulsanti, menu di selezione, righe di contesto e divisori.

## Contenuto dell'evento

I metadati sono archiviati nel contenuto dell'evento Matrix:

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

`version` è la versione dello schema dei metadati di presentazione Matrix. `type` è un discriminatore stabile per i client compatibili con OpenClaw. I client dovrebbero ignorare i valori `type` sconosciuti, le versioni sconosciute che non possono interpretare in modo sicuro e i tipi di blocco sconosciuti.

## Comportamento di fallback

OpenClaw renderizza sempre un fallback in testo semplice leggibile in `body`. I metadati strutturati sono aggiuntivi e non devono essere necessari per l'interoperabilità Matrix di base.

I client non supportati dovrebbero continuare a mostrare il testo di fallback. I client compatibili con OpenClaw possono preferire i metadati strutturati per la visualizzazione, preservando al contempo il testo di fallback per copia, ricerca, notifiche e accessibilità.

## Blocchi supportati

L'adattatore Matrix in uscita dichiara il supporto per:

- `buttons`
- `select`
- `context`
- `divider`

I client dovrebbero trattare questi blocchi come suggerimenti di presentazione best-effort. I campi sconosciuti e i tipi di blocco sconosciuti dovrebbero essere ignorati invece di causare il mancato rendering dell'intero messaggio.

## Interazioni

Questi metadati non aggiungono semantiche di callback Matrix. I valori dei pulsanti e delle opzioni di selezione sono payload di interazione di fallback, di solito comandi slash o comandi testuali. Un client Matrix che vuole supportare l'interazione può inviare il valore selezionato alla stanza come messaggio normale.

Ad esempio, un pulsante con valore `/model deepseek/deepseek-chat` può essere gestito inviando quel valore come messaggio di testo Matrix crittografato nella stessa stanza.

## Relazione con i metadati di approvazione

`com.openclaw.presentation` serve per la presentazione generale di messaggi avanzati.

Le richieste di approvazione usano i metadati dedicati `com.openclaw.approval` perché le approvazioni trasportano stato, decisioni e dettagli di exec/Plugin sensibili per la sicurezza. Se entrambe le chiavi di metadati sono presenti nello stesso evento, i client dovrebbero preferire il renderer di approvazione dedicato.

## Messaggi multimediali

Quando una risposta contiene più URL multimediali, OpenClaw invia un evento Matrix per ogni URL multimediale. I metadati di presentazione vengono allegati solo al primo evento multimediale, così i client hanno un payload strutturato stabile ed evitano renderer duplicati.

Mantieni compatti i metadati di presentazione. Il testo esteso visibile all'utente dovrebbe rimanere in `body` e usare il normale percorso di suddivisione del testo di Matrix.

---
read_when:
    - Creazione di client Matrix che visualizzano le risposte avanzate di OpenClaw
    - Debug del contenuto degli eventi com.openclaw.presentation
summary: Metadati MessagePresentation di Matrix per client compatibili con OpenClaw
title: Metadati di presentazione di Matrix
x-i18n:
    generated_at: "2026-07-12T06:50:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw associa metadati `MessagePresentation` normalizzati agli eventi Matrix `m.room.message` in uscita, sotto la chiave di contenuto `com.openclaw.presentation`.

I client Matrix standard continuano a visualizzare il testo normale di `body`. I client compatibili con OpenClaw possono leggere i metadati strutturati e visualizzare un'interfaccia utente nativa, ad esempio pulsanti, selettori, righe di contesto e divisori.

## Contenuto dell'evento

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
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

- `version` è la versione dello schema dei metadati; la versione attuale è `1`. `type` è un discriminatore stabile, sempre `"message.presentation"`. L'adattatore Matrix emette solo payload con esattamente questa versione e questo tipo; analogamente, i client dovrebbero ignorare le versioni sconosciute che non possono interpretare in modo sicuro, i valori `type` sconosciuti e i tipi di blocco sconosciuti.
- `title` e `tone` (`info`, `success`, `warning`, `danger`, `neutral`) sono indicazioni facoltative.
- I pulsanti e le opzioni di selezione possono includere un'`action` tipizzata (`{ "type": "command", "command": "/..." }` oppure `{ "type": "callback", "value": "..." }`) insieme alla stringa legacy `value`. Quando sono presenti entrambe, preferire `action`.

## Comportamento di fallback

OpenClaw genera sempre in `body` un fallback di testo normale leggibile. I metadati strutturati sono aggiuntivi e non devono essere necessari per l'interoperabilità di base con Matrix.

Regole di visualizzazione del fallback:

- I contenuti `title`, `text` e `context` vengono visualizzati come righe di testo normale.
- I pulsanti con un'azione `command` vengono visualizzati come ``etichetta: `/comando` ``, affinché il comando resti copiabile. I pulsanti con un'azione `callback` o con il solo `value` legacy mostrano soltanto l'etichetta, affinché i valori di callback opachi restino privati; i pulsanti disabilitati mostrano sempre soltanto l'etichetta. I pulsanti URL e delle app web vengono visualizzati come `etichetta: URL`.
- I blocchi di selezione visualizzano il segnaposto (oppure `Opzioni:`) come intestazione, seguito da righe contenenti soltanto le etichette delle opzioni.
- Se non viene visualizzato nulla, ad esempio in una presentazione contenente solo un divisore, il corpo usa `---` come fallback.

I client non supportati continuano a mostrare il testo di fallback. I client compatibili con OpenClaw possono preferire i metadati strutturati per la visualizzazione, mantenendo il fallback per copia, ricerca, notifiche e accessibilità.

## Blocchi supportati

L'adattatore Matrix in uscita dichiara il supporto nativo per:

- `buttons`
- `select`
- `context`
- `divider`

I blocchi `text` sono sempre supportati tramite il corpo di fallback. Considerare tutti i blocchi come indicazioni di presentazione basate sul massimo impegno possibile; ignorare i campi e i tipi di blocco sconosciuti anziché causare il fallimento dell'intero messaggio.

## Interazioni

Questi metadati non aggiungono una semantica di callback a Matrix. I valori dei pulsanti e delle selezioni sono payload di interazione di fallback, in genere comandi slash o comandi testuali. Un client Matrix che desidera supportare l'interazione risolve il valore del controllo (`action.command`, quindi `action.value`, quindi `value`) e lo invia nuovamente alla stanza come messaggio normale.

Ad esempio, un pulsante con valore `/model deepseek/deepseek-chat` può essere gestito inviando tale valore come messaggio di testo Matrix crittografato nella stessa stanza.

## Relazione con i metadati di approvazione

`com.openclaw.presentation` serve per la presentazione generale di messaggi avanzati.

Le richieste di approvazione usano i metadati dedicati `com.openclaw.approval`, poiché le approvazioni includono stato sensibile per la sicurezza, decisioni e dettagli di esecuzione/Plugin. Se entrambe le chiavi di metadati sono presenti nello stesso evento, i client dovrebbero preferire il visualizzatore dedicato alle approvazioni.

## Messaggi multimediali

Quando una risposta contiene più URL multimediali, OpenClaw invia un evento Matrix per ogni URL multimediale. Il testo della didascalia e i metadati di presentazione vengono associati soltanto al primo evento, così i client ricevono un unico payload strutturato stabile senza visualizzatori duplicati. La stessa regola si applica quando un testo lungo viene suddiviso tra più eventi: i metadati vengono inclusi soltanto nel primo evento.

Mantenere compatti i metadati di presentazione. Il testo esteso visibile all'utente deve rimanere in `body` e usare il normale percorso di suddivisione del testo di Matrix.

---
read_when:
    - Modifica del rendering dell'output dell'assistente nella Control UI
    - Debug delle direttive di presentazione `[embed ...]`, dei contenuti multimediali strutturati, delle risposte o dell'audio
summary: Protocollo di output avanzato per contenuti multimediali strutturati, incorporamenti, suggerimenti audio e risposte
title: Protocollo di output avanzato
x-i18n:
    generated_at: "2026-06-27T18:13:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

L'output dell'assistente può contenere un piccolo insieme di direttive di consegna/rendering:

- campi strutturati `mediaUrl` / `mediaUrls` per la consegna degli allegati
- `[[audio_as_voice]]` per suggerimenti di presentazione audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` per i metadati di risposta
- `[embed ...]` per il rendering avanzato nella Control UI

Gli allegati multimediali remoti devono essere URL `https:` pubblici. `http:` semplice,
loopback, link-local, nomi host privati e interni vengono ignorati come direttive
per gli allegati; i fetcher multimediali lato server applicano comunque le proprie protezioni di rete.

Gli allegati multimediali locali possono usare percorsi assoluti, percorsi relativi al workspace o
percorsi relativi alla home `~/`. Passano comunque attraverso la policy di lettura file dell'agente e
i controlli del tipo di media prima della consegna.

<Warning>
Non emettere comandi di testo per gli allegati da strumenti, plugin, blocchi di streaming,
output del browser o azioni dei messaggi. Usa invece campi multimediali strutturati.

Payload valido per lo strumento di messaggistica:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Il testo legacy della risposta finale dell'assistente può ancora essere normalizzato per compatibilità, ma
non è un protocollo generale per plugin/strumenti.
</Warning>

La sintassi Markdown semplice per le immagini resta testo per impostazione predefinita. I canali che mappano intenzionalmente
le risposte immagine Markdown ad allegati multimediali lo abilitano nel proprio
adattatore in uscita; Telegram lo fa affinché `![alt](url)` possa ancora diventare una risposta multimediale.

Queste direttive sono separate. I campi multimediali strutturati e i tag di risposta/voce sono
metadati di consegna; `[embed ...]` è il percorso di rendering avanzato solo web.

Quando lo streaming a blocchi è abilitato, i media devono essere trasportati in campi di payload
strutturati. Se lo stesso URL multimediale viene inviato in un blocco in streaming e ripetuto nel
payload finale dell'assistente, OpenClaw consegna l'allegato una sola volta e rimuove
il duplicato dal payload finale.

## `[embed ...]`

`[embed ...]` è l'unica sintassi di rendering avanzato esposta agli agenti per la Control UI.

Esempio autochiudente:

```text
[embed ref="cv_123" title="Status" /]
```

Regole:

- `[view ...]` non è più valido per il nuovo output.
- Gli shortcode embed vengono renderizzati solo nella superficie del messaggio dell'assistente.
- Vengono renderizzati solo gli embed basati su URL. Usa `ref="..."` o `url="..."`.
- Gli shortcode embed HTML inline in forma di blocco non vengono renderizzati.
- L'interfaccia web rimuove lo shortcode dal testo visibile e renderizza l'embed inline.
- I media strutturati non sono un alias di embed e non devono essere usati per il rendering di embed avanzati.

## Forma di rendering memorizzata

Il blocco di contenuto normalizzato/memorizzato dell'assistente è un elemento `canvas` strutturato:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

I blocchi avanzati memorizzati/renderizzati usano direttamente questa forma `canvas`. `present_view` non viene riconosciuto.

## Correlati

- [Adattatori RPC](/it/reference/rpc)
- [Typebox](/it/concepts/typebox)

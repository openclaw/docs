---
read_when:
    - Modifica del rendering dell'output dell'assistente nella Control UI
    - Debug delle direttive di presentazione `[embed ...]`, `MEDIA:`, risposta o audio
summary: Protocollo dei codici brevi per output ricco per contenuti incorporati, media, suggerimenti audio e risposte
title: Protocollo di output avanzato
x-i18n:
    generated_at: "2026-04-30T09:11:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

L'output dell'assistente può contenere un piccolo insieme di direttive di consegna/rendering:

- `MEDIA:` per la consegna degli allegati
- `[[audio_as_voice]]` per suggerimenti di presentazione audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` per i metadati di risposta
- `[embed ...]` per il rendering avanzato nella Control UI

Gli allegati `MEDIA:` remoti devono essere URL `https:` pubblici. `http:` semplice,
loopback, link-local, privati e nomi host interni vengono ignorati come direttive
di allegato; i recuperatori di contenuti multimediali lato server applicano comunque le proprie protezioni di rete.

La sintassi Markdown semplice per le immagini rimane testo per impostazione predefinita. I canali che mappano intenzionalmente
le risposte immagine Markdown ad allegati multimediali effettuano l'opt-in nel proprio
adattatore in uscita; Telegram lo fa, quindi `![alt](url)` può comunque diventare una risposta multimediale.

Queste direttive sono separate. `MEDIA:` e i tag di risposta/voce rimangono metadati di consegna; `[embed ...]` è il percorso di rendering avanzato solo per il web.
I contenuti multimediali attendibili dei risultati degli strumenti usano lo stesso parser `MEDIA:` / `[[audio_as_voice]]` prima della consegna, quindi gli output testuali degli strumenti possono comunque contrassegnare un allegato audio come nota vocale.

Quando lo streaming a blocchi è abilitato, `MEDIA:` rimane un metadato di consegna singola per un
turno. Se lo stesso URL multimediale viene inviato in un blocco in streaming e ripetuto nel payload finale
dell'assistente, OpenClaw consegna l'allegato una sola volta e rimuove il duplicato
dal payload finale.

## `[embed ...]`

`[embed ...]` è l'unica sintassi di rendering avanzato esposta all'agente per la Control UI.

Esempio autochiudente:

```text
[embed ref="cv_123" title="Status" /]
```

Regole:

- `[view ...]` non è più valido per i nuovi output.
- Gli shortcode embed vengono renderizzati solo nella superficie del messaggio dell'assistente.
- Vengono renderizzati solo embed basati su URL. Usa `ref="..."` o `url="..."`.
- Gli shortcode embed HTML inline in forma di blocco non vengono renderizzati.
- L'interfaccia utente web rimuove lo shortcode dal testo visibile e renderizza l'embed inline.
- `MEDIA:` non è un alias di embed e non deve essere usato per il rendering avanzato degli embed.

## Forma di rendering archiviata

Il blocco di contenuto dell'assistente normalizzato/archiviato è un elemento `canvas` strutturato:

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

I blocchi avanzati archiviati/renderizzati usano direttamente questa forma `canvas`. `present_view` non viene riconosciuto.

## Correlati

- [Adattatori RPC](/it/reference/rpc)
- [Typebox](/it/concepts/typebox)

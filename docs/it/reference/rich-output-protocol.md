---
read_when:
    - Modifica del rendering dell'output dell'assistente nella Control UI
    - Debug delle direttive di presentazione `[embed ...]`, `MEDIA:`, reply o audio
summary: Protocollo shortcode di output avanzato per embed, contenuti multimediali, suggerimenti audio e risposte
title: Protocollo di output avanzato
x-i18n:
    generated_at: "2026-04-25T18:22:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e01037a8cb80c9de36effd4642701dcc86131a2b8fb236d61c687845e64189
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

L'output dell'assistente può contenere un piccolo insieme di direttive di consegna/rendering:

- `MEDIA:` per la consegna di allegati
- `[[audio_as_voice]]` per suggerimenti di presentazione audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` per metadati di risposta
- `[embed ...]` per il rendering avanzato della Control UI

Queste direttive sono separate. `MEDIA:` e i tag reply/voice restano metadati di consegna; `[embed ...]` è il percorso di rendering avanzato solo web.
I contenuti multimediali affidabili dei risultati degli strumenti usano lo stesso parser `MEDIA:` / `[[audio_as_voice]]` prima della consegna, quindi gli output testuali degli strumenti possono comunque contrassegnare un allegato audio come nota vocale.

Quando lo streaming a blocchi è abilitato, `MEDIA:` resta un metadato di consegna singola per un turno. Se lo stesso URL multimediale viene inviato in un blocco in streaming e ripetuto nel payload finale dell'assistente, OpenClaw consegna l'allegato una sola volta e rimuove il duplicato dal payload finale.

## `[embed ...]`

`[embed ...]` è l'unica sintassi di rendering avanzato esposta all'agente per la Control UI.

Esempio autochiudente:

```text
[embed ref="cv_123" title="Status" /]
```

Regole:

- `[view ...]` non è più valido per il nuovo output.
- Gli shortcode embed vengono renderizzati solo nella superficie dei messaggi dell'assistente.
- Vengono renderizzati solo gli embed supportati da URL. Usa `ref="..."` oppure `url="..."`.
- Gli shortcode embed in HTML inline in forma a blocco non vengono renderizzati.
- L'interfaccia web rimuove lo shortcode dal testo visibile e renderizza l'embed inline.
- `MEDIA:` non è un alias di embed e non deve essere usato per il rendering avanzato di embed.

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

I blocchi avanzati archiviati/renderizzati usano direttamente questa forma `canvas`. `present_view` non è riconosciuto.

## Correlati

- [Adattatori RPC](/it/reference/rpc)
- [Typebox](/it/concepts/typebox)

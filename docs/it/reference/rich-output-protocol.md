---
read_when:
    - Modificare il rendering dell'output dell'assistente nella Control UI
    - Debug di `[embed ...]`, `MEDIA:`, delle direttive di risposta o di presentazione audio
summary: Protocollo shortcode per output avanzato per embed, media, suggerimenti audio e risposte
title: Protocollo di output avanzato
x-i18n:
    generated_at: "2026-04-24T09:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

L'output dell'assistente può trasportare un piccolo insieme di direttive di recapito/rendering:

- `MEDIA:` per il recapito degli allegati
- `[[audio_as_voice]]` per suggerimenti di presentazione audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` per metadati di risposta
- `[embed ...]` per il rendering avanzato della Control UI

Queste direttive sono separate. `MEDIA:` e i tag di risposta/voce restano metadati di recapito; `[embed ...]` è il percorso di rendering avanzato solo web.

## `[embed ...]`

`[embed ...]` è l'unica sintassi di rendering avanzato lato agente per la Control UI.

Esempio self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

Regole:

- `[view ...]` non è più valido per nuovo output.
- Gli shortcode embed vengono renderizzati solo nella superficie dei messaggi dell'assistente.
- Vengono renderizzati solo embed supportati da URL. Usa `ref="..."` o `url="..."`.
- Gli shortcode embed in forma di blocco con HTML inline non vengono renderizzati.
- La web UI rimuove lo shortcode dal testo visibile e renderizza l'embed inline.
- `MEDIA:` non è un alias di embed e non deve essere usato per il rendering di embed avanzati.

## Forma di rendering memorizzata

Il blocco di contenuto dell'assistente normalizzato/memorizzato è un elemento `canvas` strutturato:

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

- [Adapter RPC](/it/reference/rpc)
- [Typebox](/it/concepts/typebox)

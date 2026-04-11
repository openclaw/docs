---
x-i18n:
    generated_at: "2026-04-11T15:15:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a8884fc2c304bf96d4675f0c1d1ff781d6dc1ae8c49d92ce08040c9c7709035
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Protocollo di output avanzato

L'output dell'assistente può includere un piccolo insieme di direttive di consegna/rendering:

- `MEDIA:` per la consegna degli allegati
- `[[audio_as_voice]]` per i suggerimenti di presentazione audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` per i metadati di risposta
- `[embed ...]` per il rendering avanzato nella Control UI

Queste direttive sono separate. `MEDIA:` e i tag reply/voice restano metadati di consegna; `[embed ...]` è il percorso di rendering avanzato solo per il web.

## `[embed ...]`

`[embed ...]` è l'unica sintassi di rendering avanzato rivolta agli agenti per la Control UI.

Esempio autochiudente:

```text
[embed ref="cv_123" title="Status" /]
```

Regole:

- `[view ...]` non è più valido per i nuovi output.
- Gli shortcode embed vengono renderizzati solo nella superficie dei messaggi dell'assistente.
- Vengono renderizzati solo gli embed supportati da URL. Usa `ref="..."` o `url="..."`.
- Gli shortcode embed in HTML inline in forma di blocco non vengono renderizzati.
- L'interfaccia web rimuove lo shortcode dal testo visibile e renderizza l'embed inline.
- `MEDIA:` non è un alias di embed e non deve essere usato per il rendering avanzato degli embed.

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

I blocchi avanzati memorizzati/renderizzati usano direttamente questa forma `canvas`. `present_view` non è riconosciuto.

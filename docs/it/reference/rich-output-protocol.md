---
read_when:
    - Modifica del rendering dell'output dell'assistente nella Control UI
    - Debug di `[embed ...]`, `MEDIA:`, delle direttive di risposta o di presentazione audio
summary: Protocollo shortcode di output avanzato per embed, media, suggerimenti audio e risposte
title: Protocollo di output avanzato
x-i18n:
    generated_at: "2026-04-23T08:36:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Protocollo di output avanzato

L'output dell'assistente può includere un piccolo insieme di direttive di consegna/rendering:

- `MEDIA:` per la consegna degli allegati
- `[[audio_as_voice]]` per suggerimenti di presentazione audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` per metadati di risposta
- `[embed ...]` per il rendering avanzato della Control UI

Queste direttive sono separate. `MEDIA:` e i tag di risposta/voce restano metadati di consegna; `[embed ...]` è il percorso di rendering avanzato solo web.

## `[embed ...]`

`[embed ...]` è l'unica sintassi di rendering avanzato rivolta all'agente per la Control UI.

Esempio autochiudente:

```text
[embed ref="cv_123" title="Status" /]
```

Regole:

- `[view ...]` non è più valido per i nuovi output.
- Gli shortcode embed vengono renderizzati solo nella superficie del messaggio dell'assistente.
- Vengono renderizzati solo embed supportati da URL. Usa `ref="..."` o `url="..."`.
- Gli shortcode embed HTML inline in forma di blocco non vengono renderizzati.
- L'interfaccia web rimuove lo shortcode dal testo visibile e renderizza l'embed inline.
- `MEDIA:` non è un alias di embed e non deve essere usato per il rendering avanzato di embed.

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

I blocchi avanzati memorizzati/renderizzati usano direttamente questa forma `canvas`. `present_view` non è riconosciuto.

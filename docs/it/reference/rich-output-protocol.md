---
read_when:
    - Modificare la visualizzazione dell'output dell'assistente nell'interfaccia di controllo
    - Debug delle direttive di presentazione `[embed ...]`, `MEDIA:`, reply o audio
summary: Protocollo shortcode per output avanzato per incorporamenti, media, suggerimenti audio e risposte
title: Protocollo di output avanzato
x-i18n:
    generated_at: "2026-05-02T22:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

L'output dell'assistente può contenere un piccolo insieme di direttive di consegna/rendering:

- `MEDIA:` per la consegna degli allegati
- `[[audio_as_voice]]` per suggerimenti di presentazione audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` per metadati di risposta
- `[embed ...]` per il rendering avanzato della Control UI

Gli allegati `MEDIA:` remoti devono essere URL `https:` pubblici. `http:` semplice,
loopback, link-local, privati e nomi host interni vengono ignorati come direttive
di allegato; i recuperatori di media lato server applicano comunque le proprie protezioni di rete.

Gli allegati `MEDIA:` locali possono usare percorsi assoluti, percorsi relativi al workspace o
percorsi `~/` relativi alla home. Passano comunque attraverso i criteri di lettura file dell'agente e
i controlli del tipo di media prima della consegna.

La normale sintassi Markdown per le immagini rimane testo per impostazione predefinita. I canali che intenzionalmente
mappano le risposte immagine Markdown ad allegati media fanno opt-in nel proprio
adattatore in uscita; Telegram lo fa, quindi `![alt](url)` può comunque diventare una risposta media.

Queste direttive sono separate. `MEDIA:` e i tag di risposta/voce rimangono metadati di consegna; `[embed ...]` è il percorso di rendering avanzato solo web.
I media dei risultati di tool attendibili usano lo stesso parser `MEDIA:` / `[[audio_as_voice]]` prima della consegna, quindi gli output testuali dei tool possono comunque contrassegnare un allegato audio come nota vocale.

Quando lo streaming a blocchi è abilitato, `MEDIA:` rimane un metadato a consegna singola per un
turno. Se lo stesso URL media viene inviato in un blocco in streaming e ripetuto nel payload finale
dell'assistente, OpenClaw consegna l'allegato una sola volta e rimuove il duplicato
dal payload finale.

## `[embed ...]`

`[embed ...]` è l'unica sintassi di rendering avanzato esposta all'agente per la Control UI.

Esempio autochiudente:

```text
[embed ref="cv_123" title="Status" /]
```

Regole:

- `[view ...]` non è più valido per il nuovo output.
- Gli shortcode embed vengono renderizzati solo sulla superficie del messaggio dell'assistente.
- Vengono renderizzati solo embed basati su URL. Usa `ref="..."` o `url="..."`.
- Gli shortcode embed HTML inline in forma di blocco non vengono renderizzati.
- L'interfaccia web rimuove lo shortcode dal testo visibile e renderizza l'embed inline.
- `MEDIA:` non è un alias embed e non deve essere usato per il rendering avanzato degli embed.

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

- [adattatori RPC](/it/reference/rpc)
- [Typebox](/it/concepts/typebox)

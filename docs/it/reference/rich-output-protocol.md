---
read_when:
    - Modifica della visualizzazione dell'output dell'assistente nell'interfaccia di controllo
    - Debug delle direttive di presentazione `[embed ...]` per contenuti multimediali strutturati, risposte o audio
summary: Protocollo di output avanzato per contenuti multimediali strutturati, incorporamenti, indicazioni audio e risposte
title: Protocollo di output avanzato
x-i18n:
    generated_at: "2026-07-12T07:28:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

L'output dell'assistente trasporta le direttive di consegna/rendering attraverso alcuni canali dedicati:

- Campi strutturati `mediaUrl` / `mediaUrls` per la consegna degli allegati.
- `[[audio_as_voice]]` per indicazioni sulla presentazione dell'audio.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` per i metadati della risposta.
- `[embed ...]` per il rendering avanzato nella Control UI.

I campi multimediali strutturati e i tag `[[...]]` sono metadati di consegna. `[embed ...]` è il percorso separato di rendering avanzato esclusivo del web; non è un alias per i contenuti multimediali.

## Allegati multimediali

Gli allegati remoti devono essere URL pubblici `https:`. `http:`, local loopback, link-local e i nomi host privati e interni vengono rifiutati come direttive per gli allegati; i recuperatori multimediali lato server applicano inoltre le proprie protezioni di rete.

Gli allegati locali accettano percorsi assoluti, percorsi relativi allo spazio di lavoro o percorsi `~/` relativi alla directory home. Prima della consegna, sono comunque sottoposti ai criteri di lettura dei file dell'agente e ai controlli del tipo di contenuto multimediale.

<Warning>
Non generare comandi testuali per gli allegati da strumenti, plugin, blocchi in streaming, output del browser o azioni sui messaggi. Usa invece i campi multimediali strutturati:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Il testo legacy della risposta finale può ancora essere normalizzato per compatibilità, ma questo non costituisce un protocollo generale per plugin/strumenti.
</Warning>

La semplice sintassi Markdown per le immagini (`![alt](url)`) rimane testo per impostazione predefinita. I canali che desiderano trattare le immagini Markdown come risposte multimediali abilitano questa funzione nel proprio adattatore in uscita; Telegram lo fa, quindi `![alt](url)` diventa un allegato multimediale.

Quando lo streaming a blocchi è abilitato, i contenuti multimediali devono essere trasportati nei campi strutturati del payload. Se lo stesso URL multimediale compare in un blocco trasmesso in streaming e nuovamente nel payload finale dell'assistente, OpenClaw lo consegna una sola volta e rimuove il duplicato dal payload finale.

## `[embed ...]`

`[embed ...]` è l'unica sintassi di rendering avanzato rivolta all'agente per la Control UI. Esempio con chiusura automatica:

```text
[embed ref="cv_123" title="Status" /]
```

Regole:

- `[view ...]` non è più valido per i nuovi output.
- Gli shortcode di incorporamento vengono renderizzati solo nell'area dei messaggi dell'assistente.
- Vengono renderizzati solo gli incorporamenti basati su URL; usa `ref="..."` o `url="..."`.
- Gli shortcode di incorporamento HTML inline in forma di blocco non vengono renderizzati.
- L'interfaccia web rimuove lo shortcode dal testo visibile e renderizza l'incorporamento in linea.

## Struttura di rendering memorizzata

Il blocco di contenuto normalizzato/memorizzato dell'assistente è un elemento strutturato `canvas`:

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

`present_view` non viene riconosciuto; i blocchi avanzati memorizzati/renderizzati usano sempre questa struttura `canvas`.

## Argomenti correlati

- [Adattatori RPC](/it/reference/rpc)
- [Typebox](/it/concepts/typebox)

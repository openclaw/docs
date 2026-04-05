---
read_when:
    - Vuoi spiegare come funzionano lo streaming o il chunking nei canali
    - Stai modificando il comportamento dello streaming a blocchi o del chunking nei canali
    - Stai eseguendo il debug di risposte a blocchi duplicate/anticipate o del preview streaming nei canali
summary: Comportamento di streaming + chunking (risposte a blocchi, preview streaming nei canali, mappatura delle modalità)
title: Streaming e Chunking
x-i18n:
    generated_at: "2026-04-05T13:50:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw ha due livelli di streaming separati:

- **Streaming a blocchi (canali):** emette **blocchi** completati mentre l'assistente scrive. Si tratta di normali messaggi del canale (non delta di token).
- **Preview streaming (Telegram/Discord/Slack):** aggiorna un **messaggio di anteprima** temporaneo durante la generazione.

Oggi **non esiste un vero streaming a delta di token** verso i messaggi del canale. Il preview streaming è basato sui messaggi (invio + modifiche/aggiunte).

## Streaming a blocchi (messaggi del canale)

Lo streaming a blocchi invia l'output dell'assistente in blocchi grossolani man mano che diventa disponibile.

```
Output del modello
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ il chunker emette blocchi man mano che il buffer cresce
       └─ (blockStreamingBreak=message_end)
            └─ il chunker svuota il buffer a message_end
                   └─ invio al canale (risposte a blocchi)
```

Legenda:

- `text_delta/events`: eventi di streaming del modello (possono essere radi per i modelli non streaming).
- `chunker`: `EmbeddedBlockChunker` che applica limiti min/max + preferenza di interruzione.
- `channel send`: messaggi effettivi in uscita (risposte a blocchi).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito off).
- Override per canale: `*.blockStreaming` (e varianti per account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi in streaming prima dell'invio).
- Limite rigido del canale: `*.textChunkLimit` (ad esempio `channels.whatsapp.textChunkLimit`).
- Modalità chunk del canale: `*.chunkMode` (`length` predefinito, `newline` divide sulle righe vuote, cioè ai confini dei paragrafi, prima del chunking per lunghezza).
- Limite morbido Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte alte per evitare il clipping nell'interfaccia.

**Semantica dei confini:**

- `text_end`: trasmette i blocchi non appena il chunker li emette; svuota il buffer a ogni `text_end`.
- `message_end`: attende che il messaggio dell'assistente termini, poi svuota l'output bufferizzato.

`message_end` usa comunque il chunker se il testo bufferizzato supera `maxChars`, quindi può emettere più chunk alla fine.

## Algoritmo di chunking (limiti basso/alto)

Il chunking a blocchi è implementato da `EmbeddedBlockChunker`:

- **Limite basso:** non emette finché il buffer non è >= `minChars` (a meno che non sia forzato).
- **Limite alto:** preferisce divisioni prima di `maxChars`; se forzato, divide a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Code fence:** non divide mai all'interno delle fence; quando è forzato a `maxChars`, chiude e riapre la fence per mantenere valido il Markdown.

`maxChars` è vincolato al `textChunkLimit` del canale, quindi non puoi superare i limiti per canale.

## Coalescenza (unione dei blocchi in streaming)

Quando lo streaming a blocchi è abilitato, OpenClaw può **unire chunk di blocchi consecutivi**
prima di inviarli. Questo riduce lo “spam di singole righe” pur continuando a fornire
un output progressivo.

- La coalescenza attende **intervalli di inattività** (`idleMs`) prima di svuotare il buffer.
- I buffer sono limitati da `maxChars` e vengono svuotati se lo superano.
- `minChars` impedisce l'invio di frammenti minuscoli finché non si accumula abbastanza testo
  (lo svuotamento finale invia sempre il testo rimanente).
- Il separatore deriva da `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Sono disponibili override per canale tramite `*.blockStreamingCoalesce` (incluse le configurazioni per account).
- Il valore predefinito di coalescenza `minChars` viene portato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo umano tra i blocchi

Quando lo streaming a blocchi è abilitato, puoi aggiungere una **pausa casuale** tra
le risposte a blocchi (dopo il primo blocco). Questo rende le risposte multi-bolla
più naturali.

- Configurazione: `agents.defaults.humanDelay` (override per agente tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinita), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte a blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Trasmettere i chunk o tutto"

Questo corrisponde a:

- **Trasmettere i chunk:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emette man mano). I canali non Telegram richiedono anche `*.blockStreaming: true`.
- **Trasmettere tutto alla fine:** `blockStreamingBreak: "message_end"` (svuota una volta sola, eventualmente in più chunk se è molto lungo).
- **Nessuno streaming a blocchi:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sui canali:** Lo streaming a blocchi è **disattivato a meno che**
`*.blockStreaming` non sia esplicitamente impostato su `true`. I canali possono trasmettere una preview live
(`channels.<channel>.streaming`) senza risposte a blocchi.

Promemoria sulla posizione della configurazione: i valori predefiniti `blockStreaming*` si trovano in
`agents.defaults`, non nella configurazione root.

## Modalità di preview streaming

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita il preview streaming.
- `partial`: singola anteprima che viene sostituita con il testo più recente.
- `block`: l'anteprima si aggiorna in passaggi suddivisi in chunk/aggiunti.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

### Mappatura per canale

| Canale   | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | corrisponde a `partial` |
| Discord  | ✅    | ✅        | ✅      | corrisponde a `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Solo Slack:

- `channels.slack.nativeStreaming` abilita/disabilita le chiamate API di streaming nativo di Slack quando `streaming=partial` (predefinito: `true`).

Migrazione delle chiavi legacy:

- Telegram: `streamMode` + booleano `streaming` vengono migrati automaticamente all'enum `streaming`.
- Discord: `streamMode` + booleano `streaming` vengono migrati automaticamente all'enum `streaming`.
- Slack: `streamMode` viene migrato automaticamente all'enum `streaming`; il booleano `streaming` viene migrato automaticamente a `nativeStreaming`.

### Comportamento a runtime

Telegram:

- Usa gli aggiornamenti di anteprima `sendMessage` + `editMessageText` tra DM e gruppi/topic.
- Il preview streaming viene saltato quando lo streaming a blocchi di Telegram è esplicitamente abilitato (per evitare doppio streaming).
- `/reasoning stream` può scrivere il ragionamento nell'anteprima.

Discord:

- Usa messaggi di anteprima con invio + modifica.
- La modalità `block` usa il chunking delle bozze (`draftChunk`).
- Il preview streaming viene saltato quando lo streaming a blocchi di Discord è esplicitamente abilitato.

Slack:

- `partial` può usare lo streaming nativo di Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime bozza in stile append.
- `progress` usa testo di anteprima dello stato, poi la risposta finale.

## Correlati

- [Messaggi](/concepts/messages) — ciclo di vita e consegna dei messaggi
- [Retry](/concepts/retry) — comportamento di retry in caso di errore di consegna
- [Canali](/it/channels) — supporto dello streaming per canale

---
read_when:
    - Spiegazione di come funzionano streaming o chunking sui canali
    - Modifica del comportamento dello streaming a blocchi o del chunking del canale
    - Debug di risposte a blocchi duplicate/anticipate o dello streaming di anteprima del canale
summary: Comportamento di streaming + chunking (risposte a blocchi, streaming di anteprima del canale, mappatura delle modalità)
title: Streaming e chunking
x-i18n:
    generated_at: "2026-04-24T08:38:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw ha due livelli di streaming separati:

- **Block streaming (canali):** emette **blocchi** completati mentre l'assistente scrive. Si tratta di normali messaggi del canale (non delta di token).
- **Preview streaming (Telegram/Discord/Slack):** aggiorna un **messaggio di anteprima** temporaneo durante la generazione.

Oggi non esiste **vero streaming token-delta** verso i messaggi del canale. Il preview streaming è basato sui messaggi (invio + modifiche/append).

## Block streaming (messaggi del canale)

Il block streaming invia l'output dell'assistente in chunk grossolani man mano che diventano disponibili.

```
Output del modello
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ il chunker emette blocchi man mano che il buffer cresce
       └─ (blockStreamingBreak=message_end)
            └─ il chunker scarica a message_end
                   └─ invio al canale (risposte a blocchi)
```

Legenda:

- `text_delta/events`: eventi di streaming del modello (possono essere radi per i modelli non-streaming).
- `chunker`: `EmbeddedBlockChunker` che applica limiti min/max + preferenza di interruzione.
- `channel send`: effettivi messaggi in uscita (risposte a blocchi).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito off).
- Override per canale: `*.blockStreaming` (e varianti per account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oppure `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi streammati prima dell'invio).
- Limite rigido del canale: `*.textChunkLimit` (ad es. `channels.whatsapp.textChunkLimit`).
- Modalità chunk del canale: `*.chunkMode` (`length` predefinito, `newline` divide su righe vuote (confini di paragrafo) prima del chunking per lunghezza).
- Limite morbido di Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte troppo alte per evitare il clipping dell'interfaccia.

**Semantica dei confini:**

- `text_end`: trasmette i blocchi non appena il chunker li emette; scarica a ogni `text_end`.
- `message_end`: aspetta che il messaggio dell'assistente finisca, poi scarica l'output bufferizzato.

`message_end` usa comunque il chunker se il testo bufferizzato supera `maxChars`, quindi può emettere più chunk alla fine.

## Algoritmo di chunking (limiti bassi/alti)

Il block chunking è implementato da `EmbeddedBlockChunker`:

- **Limite basso:** non emettere finché il buffer non è >= `minChars` (a meno che non sia forzato).
- **Limite alto:** preferisce divisioni prima di `maxChars`; se forzato, divide a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Blocchi di codice:** non dividere mai all'interno dei fence; quando è forzato a `maxChars`, chiude e riapre il fence per mantenere valido il Markdown.

`maxChars` viene limitato da `textChunkLimit` del canale, quindi non puoi superare i limiti per canale.

## Coalescenza (unione dei blocchi streammati)

Quando il block streaming è abilitato, OpenClaw può **unire chunk di blocchi consecutivi**
prima di inviarli. Questo riduce lo “spam di righe singole” pur fornendo
output progressivo.

- La coalescenza aspetta **gap di inattività** (`idleMs`) prima di scaricare.
- I buffer sono limitati da `maxChars` e verranno scaricati se li superano.
- `minChars` impedisce l'invio di frammenti minuscoli finché non si accumula abbastanza testo
  (lo scarico finale invia sempre il testo rimanente).
- Il joiner deriva da `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Sono disponibili override per canale tramite `*.blockStreamingCoalesce` (incluse le configurazioni per account).
- Il valore predefinito di coalescenza `minChars` viene aumentato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo umano tra i blocchi

Quando il block streaming è abilitato, puoi aggiungere una **pausa casuale** tra
le risposte a blocchi (dopo il primo blocco). Questo rende le risposte multi-bolla
più naturali.

- Configurazione: `agents.defaults.humanDelay` (override per agente tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinito), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte a blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Trasmettere chunk o tutto"

Questo corrisponde a:

- **Trasmettere chunk:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emette man mano). I canali non Telegram richiedono anche `*.blockStreaming: true`.
- **Trasmettere tutto alla fine:** `blockStreamingBreak: "message_end"` (scarica una sola volta, eventualmente in più chunk se è molto lungo).
- **Nessun block streaming:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sul canale:** il block streaming è **disattivato a meno che**
`*.blockStreaming` non sia esplicitamente impostato su `true`. I canali possono trasmettere un'anteprima live
(`channels.<channel>.streaming`) senza risposte a blocchi.

Promemoria sulla posizione della configurazione: i valori predefiniti `blockStreaming*` si trovano in
`agents.defaults`, non nella configurazione radice.

## Modalità preview streaming

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita il preview streaming.
- `partial`: singola anteprima sostituita con il testo più recente.
- `block`: l'anteprima si aggiorna in passaggi chunked/appended.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

### Mappatura dei canali

| Canale     | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | mappa a `partial`   |
| Discord    | ✅    | ✅        | ✅      | mappa a `partial`   |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Solo Slack:

- `channels.slack.streaming.nativeTransport` attiva/disattiva le chiamate API di streaming native di Slack quando `channels.slack.streaming.mode="partial"` (predefinito: `true`).
- Lo streaming nativo di Slack e lo stato del thread assistant di Slack richiedono una destinazione di thread di risposta; i DM di livello superiore non mostrano quell'anteprima in stile thread.

Migrazione delle chiavi legacy:

- Telegram: `streamMode` + booleano `streaming` vengono migrati automaticamente all'enum `streaming`.
- Discord: `streamMode` + booleano `streaming` vengono migrati automaticamente all'enum `streaming`.
- Slack: `streamMode` viene migrato automaticamente a `streaming.mode`; il booleano `streaming` viene migrato automaticamente a `streaming.mode` più `streaming.nativeTransport`; il legacy `nativeStreaming` viene migrato automaticamente a `streaming.nativeTransport`.

### Comportamento a runtime

Telegram:

- Usa aggiornamenti di anteprima `sendMessage` + `editMessageText` in DM e gruppi/topic.
- Il preview streaming viene saltato quando il block streaming di Telegram è esplicitamente abilitato (per evitare doppio streaming).
- `/reasoning stream` può scrivere il ragionamento nell'anteprima.

Discord:

- Usa messaggi di anteprima con invio + modifica.
- La modalità `block` usa chunking bozza (`draftChunk`).
- Il preview streaming viene saltato quando il block streaming di Discord è esplicitamente abilitato.
- I payload finali di media, errore e risposta esplicita annullano le anteprime in sospeso senza scaricare una nuova bozza, poi usano la consegna normale.

Slack:

- `partial` può usare lo streaming nativo di Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime bozza in stile append.
- `progress` usa testo di anteprima di stato, poi la risposta finale.
- I payload finali media/errore e i finali progress non creano messaggi bozza usa e getta; solo i finali testo/blocco che possono modificare l'anteprima scaricano il testo della bozza in sospeso.

Mattermost:

- Trasmette pensieri, attività degli strumenti e testo parziale della risposta in un unico post di anteprima bozza che viene finalizzato sul posto quando la risposta finale è sicura da inviare.
- Usa il fallback inviando un nuovo post finale se il post di anteprima è stato eliminato o non è altrimenti disponibile al momento della finalizzazione.
- I payload finali media/errore annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale invece di scaricare un post di anteprima temporaneo.

Matrix:

- Le anteprime bozza vengono finalizzate sul posto quando il testo finale può riutilizzare l'evento di anteprima.
- I finali solo media, errore e mancata corrispondenza della destinazione di risposta annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale; un'anteprima obsoleta già visibile viene redatta.

### Aggiornamenti di anteprima dell'avanzamento degli strumenti

Il preview streaming può includere anche aggiornamenti di **avanzamento degli strumenti** — brevi righe di stato come "ricerca sul web", "lettura file" o "chiamata dello strumento" — che compaiono nello stesso messaggio di anteprima mentre gli strumenti sono in esecuzione, prima della risposta finale. Questo mantiene i turni multi-step degli strumenti visivamente attivi invece che silenziosi tra la prima anteprima di ragionamento e la risposta finale.

Superfici supportate:

- **Discord**, **Slack** e **Telegram** trasmettono l'avanzamento degli strumenti nella modifica dell'anteprima live.
- **Mattermost** incorpora già l'attività degli strumenti nel suo singolo post di anteprima bozza (vedi sopra).
- Le modifiche di avanzamento degli strumenti seguono la modalità attiva di preview streaming; vengono saltate quando il preview streaming è `off` o quando il block streaming ha preso il controllo del messaggio.

## Correlati

- [Messaggi](/it/concepts/messages) — ciclo di vita e consegna dei messaggi
- [Retry](/it/concepts/retry) — comportamento di retry in caso di errore di consegna
- [Canali](/it/channels) — supporto allo streaming per canale

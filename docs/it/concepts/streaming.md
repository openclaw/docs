---
read_when:
    - Spiegazione del funzionamento dello streaming o della suddivisione in chunk sui canali
    - Modifica del comportamento dello streaming a blocchi o della suddivisione in segmenti del canale
    - Debug delle risposte a blocchi duplicate/anticipate o dello streaming dell’anteprima del canale
summary: Comportamento di streaming e suddivisione in segmenti (risposte a blocchi, streaming dell'anteprima del canale, mappatura delle modalità)
title: Streaming e suddivisione in blocchi
x-i18n:
    generated_at: "2026-04-30T08:49:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ha due livelli di streaming separati:

- **Streaming dei blocchi (canali):** emette **blocchi** completati mentre l'assistente scrive. Questi sono normali messaggi del canale (non delta di token).
- **Streaming dell'anteprima (Telegram/Discord/Slack):** aggiorna un **messaggio di anteprima** temporaneo durante la generazione.

Oggi non esiste **un vero streaming di delta di token** verso i messaggi dei canali. Lo streaming dell'anteprima è basato sui messaggi (invio + modifiche/aggiunte).

## Streaming dei blocchi (messaggi dei canali)

Lo streaming dei blocchi invia l'output dell'assistente in blocchi grossolani man mano che diventa disponibile.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legenda:

- `text_delta/events`: eventi di streaming del modello (possono essere sporadici per modelli non in streaming).
- `chunker`: `EmbeddedBlockChunker` applica limiti min/max + preferenza di interruzione.
- `channel send`: messaggi in uscita effettivi (risposte a blocchi).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito off).
- Override dei canali: `*.blockStreaming` (e varianti per account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi in streaming prima dell'invio).
- Limite massimo del canale: `*.textChunkLimit` (ad esempio, `channels.whatsapp.textChunkLimit`).
- Modalità di suddivisione del canale: `*.chunkMode` (`length` predefinito, `newline` divide su righe vuote (confini di paragrafo) prima della suddivisione per lunghezza).
- Limite flessibile di Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte alte per evitare tagli nell'interfaccia utente.

**Semantica dei confini:**

- `text_end`: esegue lo streaming dei blocchi non appena il chunker li emette; svuota a ogni `text_end`.
- `message_end`: attende la fine del messaggio dell'assistente, poi svuota l'output bufferizzato.

`message_end` usa comunque il chunker se il testo bufferizzato supera `maxChars`, quindi può emettere più blocchi alla fine.

### Consegna dei media con lo streaming dei blocchi

Le direttive `MEDIA:` sono normali metadati di consegna. Quando lo streaming dei blocchi invia in anticipo un blocco media, OpenClaw ricorda quella consegna per il turno. Se il payload finale dell'assistente ripete lo stesso URL del media, la consegna finale rimuove il media duplicato invece di inviare di nuovo l'allegato.

I payload finali duplicati esatti vengono soppressi. Se il payload finale aggiunge testo distinto attorno a media già inviati in streaming, OpenClaw invia comunque il nuovo testo mantenendo il media a consegna singola. Questo evita note vocali o file duplicati su canali come Telegram quando un agente emette `MEDIA:` durante lo streaming e il provider lo include anche nella risposta completata.

## Algoritmo di suddivisione (limiti basso/alto)

La suddivisione in blocchi è implementata da `EmbeddedBlockChunker`:

- **Limite basso:** non emettere finché il buffer >= `minChars` (a meno che non sia forzato).
- **Limite alto:** preferisce dividere prima di `maxChars`; se forzato, divide a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Code fence:** non divide mai all'interno dei fence; quando è forzato a `maxChars`, chiude + riapre il fence per mantenere valido il Markdown.

`maxChars` viene limitato a `textChunkLimit` del canale, quindi non puoi superare i limiti per canale.

## Coalescenza (unione dei blocchi in streaming)

Quando lo streaming dei blocchi è abilitato, OpenClaw può **unire blocchi consecutivi**
prima di inviarli. Questo riduce lo “spam a riga singola” pur fornendo
un output progressivo.

- La coalescenza attende **intervalli di inattività** (`idleMs`) prima di svuotare.
- I buffer sono limitati da `maxChars` e verranno svuotati se lo superano.
- `minChars` impedisce l'invio di frammenti minuscoli finché non si accumula abbastanza testo
  (lo svuotamento finale invia sempre il testo rimanente).
- Il separatore deriva da `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Gli override dei canali sono disponibili tramite `*.blockStreamingCoalesce` (incluse le configurazioni per account).
- Il valore predefinito di coalescenza `minChars` viene aumentato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo simile a quello umano tra i blocchi

Quando lo streaming dei blocchi è abilitato, puoi aggiungere una **pausa casuale** tra
le risposte a blocchi (dopo il primo blocco). Questo rende più naturali le risposte
a più bolle.

- Configurazione: `agents.defaults.humanDelay` (override per agente tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinita), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte a blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Streaming dei blocchi o di tutto"

Questo corrisponde a:

- **Streaming dei blocchi:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emette man mano). Anche i canali non Telegram richiedono `*.blockStreaming: true`.
- **Streaming di tutto alla fine:** `blockStreamingBreak: "message_end"` (svuota una volta, eventualmente in più blocchi se molto lungo).
- **Nessuno streaming dei blocchi:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sul canale:** lo streaming dei blocchi è **disattivato a meno che**
`*.blockStreaming` non sia impostato esplicitamente su `true`. I canali possono trasmettere un'anteprima in tempo reale
(`channels.<channel>.streaming`) senza risposte a blocchi.

Promemoria sulla posizione della configurazione: i valori predefiniti `blockStreaming*` si trovano in
`agents.defaults`, non nella configurazione radice.

## Modalità di streaming dell'anteprima

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita lo streaming dell'anteprima.
- `partial`: singola anteprima che viene sostituita con il testo più recente.
- `block`: aggiornamenti dell'anteprima in passaggi suddivisi/aggiunti.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

### Mappatura dei canali

| Canale     | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | corrisponde a `partial` |
| Discord    | ✅    | ✅        | ✅      | corrisponde a `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |

Solo Slack:

- `channels.slack.streaming.nativeTransport` attiva/disattiva le chiamate API di streaming native di Slack quando `channels.slack.streaming.mode="partial"` (predefinito: `true`).
- Lo streaming nativo di Slack e lo stato del thread dell'assistente Slack richiedono un target di thread di risposta; i DM di primo livello non mostrano quell'anteprima in stile thread.

Migrazione delle chiavi legacy:

- Telegram: i valori legacy `streamMode` e `streaming` scalari/booleani vengono rilevati e migrati dai percorsi di compatibilità doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migrano automaticamente all'enum `streaming`.
- Slack: `streamMode` migra automaticamente a `streaming.mode`; `streaming` booleano migra automaticamente a `streaming.mode` più `streaming.nativeTransport`; `nativeStreaming` legacy migra automaticamente a `streaming.nativeTransport`.

### Comportamento a runtime

Telegram:

- Usa `sendMessage` + `editMessageText` per gli aggiornamenti dell'anteprima su DM e gruppi/topic.
- Invia un nuovo messaggio finale invece di modificarlo sul posto quando un'anteprima è stata visibile per circa un minuto, poi ripulisce l'anteprima in modo che il timestamp di Telegram rifletta il completamento della risposta.
- Lo streaming dell'anteprima viene saltato quando lo streaming dei blocchi di Telegram è esplicitamente abilitato (per evitare doppio streaming).
- `/reasoning stream` può scrivere il ragionamento nell'anteprima.

Discord:

- Usa messaggi di anteprima inviati + modificati.
- La modalità `block` usa la suddivisione delle bozze (`draftChunk`).
- Lo streaming dell'anteprima viene saltato quando lo streaming dei blocchi di Discord è esplicitamente abilitato.
- Media finali, errori e payload di risposta esplicita annullano le anteprime in sospeso senza svuotare una nuova bozza, poi usano la consegna normale.

Slack:

- `partial` può usare lo streaming nativo di Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime bozza in stile append.
- `progress` usa testo di anteprima dello stato, poi la risposta finale.
- Lo streaming nativo e quello delle anteprime bozza sopprimono le risposte a blocchi per quel turno, quindi una risposta Slack viene trasmessa da un solo percorso di consegna.
- Payload finali di media/errore e finali di avanzamento non creano messaggi bozza usa e getta; solo i finali testuali/a blocchi che possono modificare l'anteprima svuotano il testo bozza in sospeso.

Mattermost:

- Trasmette pensiero, attività degli strumenti e testo parziale della risposta in un singolo post bozza di anteprima che viene finalizzato sul posto quando la risposta finale può essere inviata in sicurezza.
- Ripiega sull'invio di un nuovo post finale se il post di anteprima è stato eliminato o non è altrimenti disponibile al momento della finalizzazione.
- Payload finali di media/errore annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale invece di svuotare un post di anteprima temporaneo.

Matrix:

- Le anteprime bozza vengono finalizzate sul posto quando il testo finale può riutilizzare l'evento di anteprima.
- Finali solo-media, di errore e con mancata corrispondenza del target di risposta annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale; un'anteprima obsoleta già visibile viene redatta.

### Aggiornamenti di anteprima dell'avanzamento degli strumenti

Lo streaming dell'anteprima può includere anche aggiornamenti di **avanzamento degli strumenti**: brevi righe di stato come "ricerca sul web", "lettura file" o "chiamata strumento", che compaiono nello stesso messaggio di anteprima mentre gli strumenti sono in esecuzione, prima della risposta finale. Questo mantiene visivamente vivi i turni con strumenti a più passaggi, invece di lasciarli silenziosi tra la prima anteprima di pensiero e la risposta finale.

Superfici supportate:

- **Discord**, **Slack**, **Telegram** e **Matrix** trasmettono l'avanzamento degli strumenti nella modifica dell'anteprima live per impostazione predefinita quando lo streaming dell'anteprima è attivo.
- Telegram è stato distribuito con gli aggiornamenti di anteprima dell'avanzamento degli strumenti abilitati da `v2026.4.22`; mantenerli abilitati preserva quel comportamento rilasciato.
- **Mattermost** integra già l'attività degli strumenti nel suo singolo post bozza di anteprima (vedi sopra).
- Le modifiche di avanzamento degli strumenti seguono la modalità di streaming dell'anteprima attiva; vengono saltate quando lo streaming dell'anteprima è `off` o quando lo streaming dei blocchi ha preso il controllo del messaggio. Su Telegram, `streaming.mode: "off"` significa solo finale: anche il chiacchiericcio generico di avanzamento viene soppresso invece di essere consegnato come messaggi autonomi "In lavorazione...", mentre prompt di approvazione, payload media ed errori continuano a essere instradati normalmente.
- Per mantenere lo streaming dell'anteprima ma nascondere le righe di avanzamento degli strumenti, imposta `streaming.preview.toolProgress` su `false` per quel canale. Per disabilitare completamente le modifiche dell'anteprima, imposta `streaming.mode` su `off`.

Esempio:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Correlati

- [Messaggi](/it/concepts/messages) — ciclo di vita e consegna dei messaggi
- [Riprova](/it/concepts/retry) — comportamento di riprova in caso di errore di consegna
- [Canali](/it/channels) — supporto dello streaming per canale

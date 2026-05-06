---
read_when:
    - Spiegazione del funzionamento dello streaming o della suddivisione in blocchi nei canali
    - Modifica del comportamento dello streaming a blocchi o della suddivisione in segmenti del canale
    - Debug delle risposte a blocchi duplicate/premature o dello streaming dell'anteprima del canale
summary: Comportamento di streaming + segmentazione (risposte a blocchi, streaming dell'anteprima del canale, mappatura delle modalità)
title: Trasmissione in flusso e suddivisione in blocchi
x-i18n:
    generated_at: "2026-05-06T08:48:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ha due livelli di streaming separati:

- **Streaming a blocchi (canali):** emette **blocchi** completati mentre l’assistente scrive. Sono normali messaggi di canale (non delta di token).
- **Streaming di anteprima (Telegram/Discord/Slack):** aggiorna un **messaggio di anteprima** temporaneo durante la generazione.

Oggi **non esiste un vero streaming con delta di token** verso i messaggi di canale. Lo streaming di anteprima è basato sui messaggi (invio + modifiche/aggiunte).

## Streaming a blocchi (messaggi di canale)

Lo streaming a blocchi invia l’output dell’assistente in segmenti grossolani man mano che diventa disponibile.

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

- `text_delta/events`: eventi di stream del modello (possono essere sporadici per i modelli non in streaming).
- `chunker`: `EmbeddedBlockChunker` che applica limiti min/max + preferenza di interruzione.
- `channel send`: messaggi effettivi in uscita (risposte a blocchi).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito off).
- Override di canale: `*.blockStreaming` (e varianti per account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi in streaming prima dell’invio).
- Limite rigido del canale: `*.textChunkLimit` (ad esempio, `channels.whatsapp.textChunkLimit`).
- Modalità di suddivisione del canale: `*.chunkMode` (`length` predefinito, `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza).
- Limite morbido di Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte alte per evitare tagli nell’interfaccia utente.

**Semantica dei confini:**

- `text_end`: trasmette i blocchi non appena il chunker li emette; svuota a ogni `text_end`.
- `message_end`: attende che il messaggio dell’assistente finisca, poi svuota l’output bufferizzato.

`message_end` usa comunque il chunker se il testo bufferizzato supera `maxChars`, quindi può emettere più segmenti alla fine.

### Consegna dei media con lo streaming a blocchi

Le direttive `MEDIA:` sono normali metadati di consegna. Quando lo streaming a blocchi invia in anticipo un blocco multimediale, OpenClaw ricorda quella consegna per il turno. Se il payload finale dell’assistente ripete lo stesso URL multimediale, la consegna finale rimuove il media duplicato invece di inviare di nuovo l’allegato.

I payload finali esattamente duplicati vengono soppressi. Se il payload finale aggiunge testo distinto intorno a un media già trasmesso in streaming, OpenClaw invia comunque il nuovo testo mantenendo la consegna singola del media. Questo evita note vocali o file duplicati su canali come Telegram quando un agente emette `MEDIA:` durante lo streaming e anche il provider lo include nella risposta completata.

## Algoritmo di suddivisione (limiti basso/alto)

La suddivisione in blocchi è implementata da `EmbeddedBlockChunker`:

- **Limite basso:** non emettere finché il buffer >= `minChars` (a meno che non sia forzato).
- **Limite alto:** preferisce divisioni prima di `maxChars`; se forzato, divide a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Blocchi di codice:** non divide mai all’interno dei blocchi; quando è forzato a `maxChars`, chiude + riapre il blocco per mantenere valido il Markdown.

`maxChars` viene limitato al `textChunkLimit` del canale, quindi non puoi superare i limiti per canale.

## Coalescenza (unione dei blocchi in streaming)

Quando lo streaming a blocchi è abilitato, OpenClaw può **unire segmenti di blocchi consecutivi** prima di inviarli. Questo riduce lo “spam da singola riga” pur fornendo comunque output progressivo.

- La coalescenza attende **intervalli di inattività** (`idleMs`) prima di svuotare.
- I buffer sono limitati da `maxChars` e verranno svuotati se lo superano.
- `minChars` impedisce l’invio di frammenti minuscoli finché non si accumula abbastanza testo (lo svuotamento finale invia sempre il testo rimanente).
- Il separatore è derivato da `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Gli override di canale sono disponibili tramite `*.blockStreamingCoalesce` (incluse le configurazioni per account).
- Il `minChars` predefinito per la coalescenza viene aumentato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo simile a quello umano tra i blocchi

Quando lo streaming a blocchi è abilitato, puoi aggiungere una **pausa randomizzata** tra le risposte a blocchi (dopo il primo blocco). Questo rende più naturali le risposte a più bolle.

- Configurazione: `agents.defaults.humanDelay` (override per agente tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinita), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte a blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## “Trasmettere i segmenti o tutto”

Questo corrisponde a:

- **Trasmettere i segmenti:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emetti man mano). I canali non Telegram richiedono anche `*.blockStreaming: true`.
- **Trasmettere tutto alla fine:** `blockStreamingBreak: "message_end"` (svuota una volta, possibilmente in più segmenti se molto lungo).
- **Nessuno streaming a blocchi:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sul canale:** lo streaming a blocchi è **disattivato salvo che**
`*.blockStreaming` sia impostato esplicitamente su `true`. I canali possono trasmettere un’anteprima dal vivo
(`channels.<channel>.streaming`) senza risposte a blocchi.

Promemoria sulla posizione della configurazione: i valori predefiniti `blockStreaming*` si trovano sotto
`agents.defaults`, non nella configurazione radice.

## Modalità di streaming di anteprima

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita lo streaming di anteprima.
- `partial`: singola anteprima sostituita con il testo più recente.
- `block`: aggiornamenti dell’anteprima in passaggi segmentati/aggiunti.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

`streaming.mode: "block"` è una modalità di streaming di anteprima per canali modificabili
come Discord e Telegram. Non abilita lì la consegna a blocchi del canale.
Usa `streaming.block.enabled` o la chiave di canale legacy `blockStreaming` quando
vuoi normali risposte a blocchi. Microsoft Teams è l’eccezione: non dispone di un
trasporto di blocchi per bozze di anteprima, quindi `streaming.mode: "block"` viene mappato alla consegna a blocchi di Teams
invece dello streaming parziale/di avanzamento nativo.

### Mappatura dei canali

| Canale     | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | bozza di avanzamento modificabile |
| Discord    | ✅    | ✅        | ✅      | bozza di avanzamento modificabile |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream di avanzamento nativo  |

Solo Slack:

- `channels.slack.streaming.nativeTransport` attiva/disattiva le chiamate all’API di streaming nativa di Slack quando `channels.slack.streaming.mode="partial"` (predefinito: `true`).
- Lo streaming nativo di Slack e lo stato del thread dell’assistente Slack richiedono una destinazione thread di risposta. I DM di primo livello non mostrano quell’anteprima in stile thread, ma possono comunque usare post e modifiche di anteprime bozza di Slack.

Migrazione delle chiavi legacy:

- Telegram: i valori legacy `streamMode` e `streaming` scalari/booleani vengono rilevati e migrati dai percorsi di compatibilità doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migrano automaticamente all’enum `streaming`.
- Slack: `streamMode` migra automaticamente a `streaming.mode`; `streaming` booleano migra automaticamente a `streaming.mode` più `streaming.nativeTransport`; `nativeStreaming` legacy migra automaticamente a `streaming.nativeTransport`.

### Comportamento runtime

Telegram:

- Usa aggiornamenti di anteprima `sendMessage` + `editMessageText` in DM e gruppi/topic.
- Il testo finale modifica l’anteprima attiva sul posto; i finali lunghi riutilizzano quel messaggio per il primo segmento e inviano solo i segmenti rimanenti.
- La modalità `progress` mantiene l’avanzamento degli strumenti in una bozza di stato modificabile, cancella quella bozza al completamento e invia la risposta finale tramite la consegna normale.
- Se la modifica finale non riesce prima che il testo completato sia confermato, OpenClaw usa la consegna finale normale e ripulisce l’anteprima obsoleta.
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi di Telegram è abilitato esplicitamente (per evitare il doppio streaming).
- `/reasoning stream` può scrivere il ragionamento in un’anteprima transitoria che viene eliminata dopo la consegna finale.

Discord:

- Usa l’invio + modifica dei messaggi di anteprima.
- La modalità `block` usa la suddivisione delle bozze (`draftChunk`).
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi di Discord è abilitato esplicitamente.
- I payload finali con media, errori e risposte esplicite annullano le anteprime in sospeso senza svuotare una nuova bozza, poi usano la consegna normale.

Slack:

- `partial` può usare lo streaming nativo di Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime bozza in stile append.
- `progress` usa il testo di anteprima dello stato, poi la risposta finale.
- I DM di primo livello senza un thread di risposta usano post e modifiche di anteprima bozza invece dello streaming nativo di Slack.
- Lo streaming di anteprima nativo e bozza sopprime le risposte a blocchi per quel turno, quindi una risposta Slack viene trasmessa da un solo percorso di consegna.
- I payload finali con media/errori e i finali di avanzamento non creano messaggi bozza usa e getta; solo i finali di testo/blocco che possono modificare l’anteprima svuotano il testo bozza in sospeso.

Mattermost:

- Trasmette pensiero, attività degli strumenti e testo di risposta parziale in un unico post di anteprima bozza che viene finalizzato sul posto quando la risposta finale può essere inviata in sicurezza.
- Ripiega sull’invio di un nuovo post finale se il post di anteprima è stato eliminato o è altrimenti non disponibile al momento della finalizzazione.
- I payload finali con media/errori annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale invece di svuotare un post di anteprima temporaneo.

Matrix:

- Le anteprime bozza vengono finalizzate sul posto quando il testo finale può riutilizzare l’evento di anteprima.
- I finali solo media, errore e con destinazione di risposta non corrispondente annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale; un’anteprima obsoleta già visibile viene redatta.

### Aggiornamenti di anteprima dell’avanzamento degli strumenti

Lo streaming di anteprima può includere anche aggiornamenti di **avanzamento degli strumenti**: brevi righe di stato come “ricerca sul web”, “lettura del file” o “chiamata dello strumento”, che appaiono nello stesso messaggio di anteprima mentre gli strumenti sono in esecuzione, prima della risposta finale. Questo mantiene visivamente attivi i turni degli strumenti a più passaggi invece che silenziosi tra la prima anteprima di ragionamento e la risposta finale.

Superfici supportate:

- **Discord**, **Slack**, **Telegram** e **Matrix** trasmettono l'avanzamento degli strumenti nella modifica dell'anteprima live per impostazione predefinita quando lo streaming dell'anteprima è attivo. Microsoft Teams usa il proprio flusso di avanzamento nativo nelle chat personali.
- Telegram viene distribuito con gli aggiornamenti dell'anteprima dell'avanzamento degli strumenti abilitati da `v2026.4.22`; mantenerli abilitati preserva quel comportamento rilasciato.
- **Mattermost** incorpora già l'attività degli strumenti nel suo singolo post di anteprima bozza (vedi sopra).
- Le modifiche dell'avanzamento degli strumenti seguono la modalità di streaming dell'anteprima attiva; vengono saltate quando lo streaming dell'anteprima è `off` o quando lo streaming a blocchi ha preso il controllo del messaggio. Su Telegram, `streaming.mode: "off"` è solo finale: anche le comunicazioni generiche di avanzamento vengono soppresse invece di essere consegnate come messaggi di stato autonomi, mentre le richieste di approvazione, i payload multimediali e gli errori continuano a essere instradati normalmente.
- Per mantenere lo streaming dell'anteprima ma nascondere le righe di avanzamento degli strumenti, imposta `streaming.preview.toolProgress` su `false` per quel canale. Per mantenere visibili le righe di avanzamento degli strumenti nascondendo il testo dei comandi/exec, imposta `streaming.preview.commandText` su `"status"` o `streaming.progress.commandText` su `"status"`; il valore predefinito è `"raw"` per preservare il comportamento rilasciato. Questa policy è condivisa dai canali bozza/avanzamento che usano il renderer di avanzamento compatto di OpenClaw, inclusi Discord, Matrix, Microsoft Teams, Mattermost, le anteprime bozza di Slack e Telegram. Per disabilitare completamente le modifiche dell'anteprima, imposta `streaming.mode` su `off`.
- Le risposte con citazione selezionata di Telegram sono un'eccezione: quando `replyToMode` non è `"off"` ed è presente testo di citazione selezionato, OpenClaw salta lo streaming dell'anteprima della risposta per quel turno, quindi le righe di anteprima dell'avanzamento degli strumenti non possono essere renderizzate. Le risposte al messaggio corrente senza testo di citazione selezionato mantengono comunque lo streaming dell'anteprima. Vedi la [documentazione del canale Telegram](/it/channels/telegram) per i dettagli.

Mantieni visibili le righe di avanzamento ma nascondi il testo grezzo dei comandi/exec:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Usa la stessa struttura sotto un'altra chiave di canale con avanzamento compatto, per esempio `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` o le anteprime bozza di Slack. Per la modalità bozza di avanzamento, inserisci la stessa policy sotto `streaming.progress`:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Correlati

- [Refactor del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) - progettazione condivisa di anteprima, modifica, flusso e finalizzazione di destinazione
- [Bozze di avanzamento](/it/concepts/progress-drafts) - messaggi visibili di lavoro in corso che si aggiornano durante i turni lunghi
- [Messaggi](/it/concepts/messages) - ciclo di vita e consegna dei messaggi
- [Riprova](/it/concepts/retry) - comportamento di riprova in caso di mancata consegna
- [Canali](/it/channels) - supporto dello streaming per canale

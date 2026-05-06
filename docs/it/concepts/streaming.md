---
read_when:
    - Spiegazione di come funzionano lo streaming o la suddivisione in blocchi nei canali
    - Modifica del comportamento dello streaming a blocchi o della suddivisione in blocchi dei canali
    - Debug delle risposte di blocco duplicate/anticipate o dello streaming di anteprima del canale
summary: Comportamento di streaming e segmentazione (risposte a blocchi, streaming dell’anteprima del canale, mappatura delle modalità)
title: Streaming e suddivisione in blocchi
x-i18n:
    generated_at: "2026-05-06T17:55:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ha due livelli di streaming separati:

- **Streaming a blocchi (canali):** emette **blocchi** completati mentre l'assistant scrive. Sono normali messaggi di canale (non delta di token).
- **Streaming di anteprima (Telegram/Discord/Slack):** aggiorna un **messaggio di anteprima** temporaneo durante la generazione.

Oggi non esiste **vero streaming token-delta** verso i messaggi di canale. Lo streaming di anteprima è basato su messaggi (invio + modifiche/append).

## Streaming a blocchi (messaggi di canale)

Lo streaming a blocchi invia l'output dell'assistant in blocchi grossolani man mano che diventa disponibile.

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

- `text_delta/events`: eventi dello stream del modello (possono essere sporadici per modelli non in streaming).
- `chunker`: `EmbeddedBlockChunker` che applica limiti min/max + preferenza di interruzione.
- `channel send`: messaggi in uscita effettivi (risposte a blocchi).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito off).
- Override di canale: `*.blockStreaming` (e varianti per account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisci i blocchi in streaming prima dell'invio).
- Limite rigido del canale: `*.textChunkLimit` (ad esempio `channels.whatsapp.textChunkLimit`).
- Modalità di suddivisione del canale: `*.chunkMode` (`length` predefinito, `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza).
- Limite morbido Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte alte per evitare tagli nell'UI.

**Semantica dei confini:**

- `text_end`: trasmette blocchi non appena il chunker li emette; flush a ogni `text_end`.
- `message_end`: attende la fine del messaggio dell'assistant, poi esegue il flush dell'output bufferizzato.

`message_end` usa comunque il chunker se il testo bufferizzato supera `maxChars`, quindi può emettere più chunk alla fine.

### Consegna dei media con lo streaming a blocchi

Le direttive `MEDIA:` sono normali metadati di consegna. Quando lo streaming a blocchi invia in anticipo un blocco multimediale, OpenClaw ricorda quella consegna per il turno. Se il payload finale dell'assistant ripete lo stesso URL multimediale, la consegna finale rimuove il media duplicato invece di inviare di nuovo l'allegato.

I payload finali duplicati esatti vengono soppressi. Se il payload finale aggiunge testo distinto attorno a media già trasmessi in streaming, OpenClaw invia comunque il nuovo testo mantenendo la consegna singola del media. Questo evita note vocali o file duplicati su canali come Telegram quando un agent emette `MEDIA:` durante lo streaming e il provider lo include anche nella risposta completata.

## Algoritmo di suddivisione (limiti basso/alto)

La suddivisione in blocchi è implementata da `EmbeddedBlockChunker`:

- **Limite basso:** non emettere finché il buffer >= `minChars` (a meno che non sia forzato).
- **Limite alto:** preferisci divisioni prima di `maxChars`; se forzato, dividi a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Code fence:** non dividere mai all'interno dei fence; quando forzato a `maxChars`, chiudi + riapri il fence per mantenere valido il Markdown.

`maxChars` viene limitato al `textChunkLimit` del canale, quindi non puoi superare i limiti per canale.

## Coalescenza (unione dei blocchi in streaming)

Quando lo streaming a blocchi è abilitato, OpenClaw può **unire chunk di blocchi consecutivi** prima di inviarli. Questo riduce lo "spam a riga singola" pur fornendo output progressivo.

- La coalescenza attende **intervalli di inattività** (`idleMs`) prima del flush.
- I buffer sono limitati da `maxChars` e verranno inviati se lo superano.
- `minChars` impedisce l'invio di frammenti minuscoli finché non si accumula abbastanza testo (il flush finale invia sempre il testo rimanente).
- Il separatore deriva da `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Gli override di canale sono disponibili tramite `*.blockStreamingCoalesce` (incluse le configurazioni per account).
- Il `minChars` predefinito della coalescenza viene aumentato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo simile a quello umano tra blocchi

Quando lo streaming a blocchi è abilitato, puoi aggiungere una **pausa casuale** tra le risposte a blocchi (dopo il primo blocco). Questo rende le risposte multi-bolla più naturali.

- Configurazione: `agents.defaults.humanDelay` (override per agent tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinita), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte a blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Stream chunks or everything"

Questo corrisponde a:

- **Trasmetti chunk in streaming:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emetti man mano). I canali non Telegram richiedono anche `*.blockStreaming: true`.
- **Trasmetti tutto in streaming alla fine:** `blockStreamingBreak: "message_end"` (flush una volta, eventualmente più chunk se molto lungo).
- **Nessuno streaming a blocchi:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sui canali:** lo streaming a blocchi è **disattivato a meno che**
`*.blockStreaming` non sia impostato esplicitamente su `true`. I canali possono trasmettere un'anteprima live (`channels.<channel>.streaming`) senza risposte a blocchi.

Promemoria sulla posizione della configurazione: i valori predefiniti `blockStreaming*` si trovano sotto `agents.defaults`, non nella configurazione radice.

## Modalità di streaming di anteprima

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita lo streaming di anteprima.
- `partial`: singola anteprima sostituita con il testo più recente.
- `block`: aggiornamenti di anteprima in passaggi suddivisi/aggiunti.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

`streaming.mode: "block"` è una modalità di streaming di anteprima per canali modificabili come Discord e Telegram. Non abilita lì la consegna a blocchi del canale. Usa `streaming.block.enabled` o la chiave di canale legacy `blockStreaming` quando vuoi normali risposte a blocchi. Microsoft Teams è l'eccezione: non ha un trasporto a blocchi per anteprime bozza, quindi `streaming.mode: "block"` viene mappato alla consegna a blocchi di Teams invece che allo streaming parziale/di avanzamento nativo.

### Mappatura dei canali

| Canale     | `off` | `partial` | `block` | `progress`                    |
| ---------- | ----- | --------- | ------- | ----------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bozza di avanzamento modificabile |
| Discord    | ✅    | ✅        | ✅      | bozza di avanzamento modificabile |
| Slack      | ✅    | ✅        | ✅      | ✅                            |
| Mattermost | ✅    | ✅        | ✅      | ✅                            |
| MS Teams   | ✅    | ✅        | ✅      | stream di avanzamento nativo  |

Solo Slack:

- `channels.slack.streaming.nativeTransport` attiva/disattiva le chiamate all'API di streaming nativa di Slack quando `channels.slack.streaming.mode="partial"` (predefinito: `true`).
- Lo streaming nativo Slack e lo stato dei thread dell'assistant Slack richiedono un target di thread di risposta. I DM di livello superiore non mostrano quell'anteprima in stile thread, ma possono comunque usare post e modifiche di anteprima bozza Slack.

Migrazione delle chiavi legacy:

- Telegram: i valori legacy `streamMode` e i valori scalari/booleani `streaming` vengono rilevati e migrati dai percorsi di compatibilità doctor/config a `streaming.mode`.
- Discord: `streamMode` + booleano `streaming` restano alias runtime per l'enum `streaming`; esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.
- Slack: `streamMode` resta un alias runtime per `streaming.mode`; il booleano `streaming` resta un alias runtime per `streaming.mode` più `streaming.nativeTransport`; il legacy `nativeStreaming` resta un alias runtime per `streaming.nativeTransport`. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.

### Comportamento runtime

Telegram:

- Usa `sendMessage` + aggiornamenti di anteprima `editMessageText` su DM e gruppi/topic.
- Il testo finale modifica in loco l'anteprima attiva; i finali lunghi riusano quel messaggio per il primo chunk e inviano solo i chunk rimanenti.
- La modalità `progress` mantiene l'avanzamento degli strumenti in una bozza di stato modificabile, cancella quella bozza al completamento e invia la risposta finale tramite consegna normale.
- Se la modifica finale fallisce prima che il testo completato sia confermato, OpenClaw usa la normale consegna finale e pulisce l'anteprima obsoleta.
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi Telegram è abilitato esplicitamente (per evitare doppio streaming).
- `/reasoning stream` può scrivere il ragionamento in un'anteprima transitoria che viene eliminata dopo la consegna finale.

Discord:

- Usa messaggi di anteprima inviati + modificati.
- La modalità `block` usa la suddivisione della bozza (`draftChunk`).
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi Discord è abilitato esplicitamente.
- I payload finali con media, errore e risposta esplicita annullano le anteprime in sospeso senza inviare una nuova bozza, poi usano la consegna normale.

Slack:

- `partial` può usare lo streaming nativo Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime bozza in stile append.
- `progress` usa testo di anteprima dello stato, poi la risposta finale.
- I DM di livello superiore senza un thread di risposta usano post e modifiche di anteprima bozza invece dello streaming nativo Slack.
- Lo streaming di anteprima nativo e bozza sopprime le risposte a blocchi per quel turno, quindi una risposta Slack viene trasmessa da un solo percorso di consegna.
- I payload finali media/errore e i finali di avanzamento non creano messaggi bozza usa e getta; solo i finali testo/blocco che possono modificare l'anteprima eseguono il flush del testo bozza in sospeso.

Mattermost:

- Trasmette pensiero, attività degli strumenti e testo parziale della risposta in un singolo post di anteprima bozza che viene finalizzato in loco quando la risposta finale è sicura da inviare.
- Ripiega sull'invio di un nuovo post finale se il post di anteprima è stato eliminato o è altrimenti non disponibile al momento della finalizzazione.
- I payload finali media/errore annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale invece di eseguire il flush di un post di anteprima temporaneo.

Matrix:

- Le anteprime bozza vengono finalizzate in loco quando il testo finale può riusare l'evento di anteprima.
- I finali solo media, errore e con mismatch del target di risposta annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale; un'anteprima obsoleta già visibile viene redatta.

### Aggiornamenti di anteprima dell'avanzamento degli strumenti

Lo streaming di anteprima può includere anche aggiornamenti di **avanzamento degli strumenti**: brevi righe di stato come "ricerca sul web", "lettura file" o "chiamata strumento", che appaiono nello stesso messaggio di anteprima mentre gli strumenti sono in esecuzione, prima della risposta finale. Questo mantiene i turni multi-step con strumenti visivamente attivi invece che silenziosi tra la prima anteprima del pensiero e la risposta finale.

Superfici supportate:

- **Discord**, **Slack**, **Telegram** e **Matrix** trasmettono per impostazione predefinita l'avanzamento degli strumenti nella modifica dell'anteprima live quando lo streaming dell'anteprima è attivo. Microsoft Teams usa il proprio stream di avanzamento nativo nelle chat personali.
- Telegram viene distribuito con gli aggiornamenti di anteprima dell'avanzamento degli strumenti abilitati da `v2026.4.22`; mantenerli abilitati preserva quel comportamento rilasciato.
- **Mattermost** integra già l'attività degli strumenti nel suo unico post di anteprima bozza (vedi sopra).
- Le modifiche dell'avanzamento degli strumenti seguono la modalità di streaming dell'anteprima attiva; vengono ignorate quando lo streaming dell'anteprima è `off` o quando lo streaming a blocchi ha preso il controllo del messaggio. Su Telegram, `streaming.mode: "off"` è solo finale: anche il rumore di avanzamento generico viene soppresso invece di essere consegnato come messaggi di stato autonomi, mentre richieste di approvazione, payload multimediali ed errori continuano a seguire il normale percorso.
- Per mantenere lo streaming dell'anteprima ma nascondere le righe di avanzamento degli strumenti, imposta `streaming.preview.toolProgress` su `false` per quel canale. Per mantenere visibili le righe di avanzamento degli strumenti nascondendo il testo grezzo di command/exec, imposta `streaming.preview.commandText` su `"status"` oppure `streaming.progress.commandText` su `"status"`; il valore predefinito è `"raw"` per preservare il comportamento rilasciato. Questa policy è condivisa dai canali di bozza/avanzamento che usano il renderer compatto di avanzamento di OpenClaw, inclusi Discord, Matrix, Microsoft Teams, Mattermost, anteprime bozza di Slack e Telegram. Per disabilitare completamente le modifiche dell'anteprima, imposta `streaming.mode` su `off`.
- Le risposte con citazione selezionata di Telegram sono un'eccezione: quando `replyToMode` non è `"off"` ed è presente testo di citazione selezionato, OpenClaw salta lo stream di anteprima della risposta per quel turno, quindi le righe di anteprima dell'avanzamento degli strumenti non possono essere renderizzate. Le risposte al messaggio corrente senza testo di citazione selezionato mantengono comunque lo streaming dell'anteprima. Consulta la [documentazione del canale Telegram](/it/channels/telegram) per i dettagli.

Mantieni visibili le righe di avanzamento ma nascondi il testo grezzo di command/exec:

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

- [Refactor del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) - progettazione target condivisa per anteprima, modifica, stream e finalizzazione
- [Bozze di avanzamento](/it/concepts/progress-drafts) - messaggi di lavoro in corso visibili che si aggiornano durante i turni lunghi
- [Messaggi](/it/concepts/messages) - ciclo di vita e consegna dei messaggi
- [Riprova](/it/concepts/retry) - comportamento di riprova in caso di errore di consegna
- [Canali](/it/channels) - supporto dello streaming per canale

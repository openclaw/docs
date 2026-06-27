---
read_when:
    - Spiegazione del funzionamento dello streaming o del chunking sui canali
    - Modifica del comportamento dello streaming a blocchi o della suddivisione in blocchi del canale
    - Debug delle risposte di blocco duplicate/anticipate o dello streaming dell'anteprima del canale
summary: Comportamento di streaming + suddivisione in chunk (risposte a blocchi, streaming dell’anteprima del canale, mappatura delle modalità)
title: Streaming e suddivisione in chunk
x-i18n:
    generated_at: "2026-06-27T17:28:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ha due livelli di streaming separati:

- **Streaming a blocchi (canali):** emette **blocchi** completati mentre l'assistente scrive. Sono normali messaggi di canale (non delta di token).
- **Streaming di anteprima (Telegram/Discord/Slack):** aggiorna un **messaggio di anteprima** temporaneo durante la generazione.

Oggi **non esiste un vero streaming di delta di token** verso i messaggi di canale. Lo streaming di anteprima è basato su messaggi (invio + modifiche/aggiunte).

## Streaming a blocchi (messaggi di canale)

Lo streaming a blocchi invia l'output dell'assistente in blocchi grossolani man mano che diventa disponibile.

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
- `channel send`: messaggi in uscita effettivi (risposte a blocchi).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito off).
- Override dei canali: `*.blockStreaming` (e varianti per account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi in streaming prima dell'invio).
- Limite rigido del canale: `*.textChunkLimit` (ad es. `channels.whatsapp.textChunkLimit`).
- Modalità di suddivisione del canale: `*.chunkMode` (`length` predefinito, `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza).
- Limite morbido di Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte alte per evitare tagli nell'interfaccia.

**Semantica dei confini:**

- `text_end`: trasmette i blocchi appena il chunker li emette; svuota a ogni `text_end`.
- `message_end`: attende la fine del messaggio dell'assistente, poi svuota l'output bufferizzato.

`message_end` usa comunque il chunker se il testo bufferizzato supera `maxChars`, quindi può emettere più blocchi alla fine.

### Consegna dei media con streaming a blocchi

I media in streaming devono usare campi di payload strutturati come `mediaUrl` o
`mediaUrls`; il testo in streaming non viene analizzato come comando di allegato. Quando lo streaming a blocchi
invia media in anticipo, OpenClaw memorizza quella consegna per il turno. Se
il payload finale dell'assistente ripete lo stesso URL del media, la consegna finale
rimuove il media duplicato invece di inviare di nuovo l'allegato.

I payload finali duplicati esatti vengono soppressi. Se il payload finale aggiunge
testo distinto attorno a media già trasmessi, OpenClaw invia comunque il
nuovo testo mantenendo la consegna singola del media. Questo evita note vocali
o file duplicati su canali come Telegram.

## Algoritmo di suddivisione (limiti basso/alto)

La suddivisione in blocchi è implementata da `EmbeddedBlockChunker`:

- **Limite basso:** non emettere finché il buffer >= `minChars` (a meno che non sia forzato).
- **Limite alto:** preferisce le divisioni prima di `maxChars`; se forzato, divide a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Code fence:** non divide mai all'interno dei fence; quando è forzato a `maxChars`, chiude + riapre il fence per mantenere Markdown valido.

`maxChars` viene limitato al `textChunkLimit` del canale, quindi non puoi superare i limiti per canale.

## Coalescenza (unione dei blocchi in streaming)

Quando lo streaming a blocchi è abilitato, OpenClaw può **unire blocchi consecutivi**
prima di inviarli. Questo riduce lo "spam di singole righe" pur fornendo
output progressivo.

- La coalescenza attende **intervalli di inattività** (`idleMs`) prima di svuotare.
- I buffer sono limitati da `maxChars` e vengono svuotati se lo superano.
- `minChars` impedisce l'invio di frammenti minuscoli finché non si accumula abbastanza testo
  (lo svuotamento finale invia sempre il testo rimanente).
- Il separatore deriva da `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Gli override dei canali sono disponibili tramite `*.blockStreamingCoalesce` (incluse le configurazioni per account).
- Il `minChars` predefinito della coalescenza viene aumentato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo umano tra i blocchi

Quando lo streaming a blocchi è abilitato, puoi aggiungere una **pausa casuale** tra
le risposte a blocchi (dopo il primo blocco). Questo rende le risposte multi-bolla
più naturali.

- Configurazione: `agents.defaults.humanDelay` (override per agente tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinita), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte a blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Trasmetti blocchi o tutto"

Questo corrisponde a:

- **Trasmetti blocchi:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emette man mano). I canali non Telegram richiedono anche `*.blockStreaming: true`.
- **Trasmetti tutto alla fine:** `blockStreamingBreak: "message_end"` (svuota una volta, eventualmente in più blocchi se molto lungo).
- **Nessuno streaming a blocchi:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sul canale:** lo streaming a blocchi è **disattivato a meno che**
`*.blockStreaming` non sia impostato esplicitamente su `true`. I canali possono trasmettere un'anteprima live
(`channels.<channel>.streaming`) senza risposte a blocchi.

Promemoria sulla posizione della configurazione: i valori predefiniti `blockStreaming*` si trovano sotto
`agents.defaults`, non nella configurazione radice.

## Modalità di streaming di anteprima

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita lo streaming di anteprima.
- `partial`: singola anteprima sostituita con il testo più recente.
- `block`: anteprima aggiornata in passaggi suddivisi/aggiunti.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

`streaming.mode: "block"` è una modalità di streaming di anteprima per canali modificabili
come Discord e Telegram. Non abilita lì la consegna di blocchi del canale.
Usa `streaming.block.enabled` o la chiave legacy del canale `blockStreaming` quando
vuoi normali risposte a blocchi. Microsoft Teams è l'eccezione: non ha un
trasporto di blocchi per anteprima bozza, quindi `streaming.mode: "block"` corrisponde alla consegna a blocchi di Teams
invece dello streaming nativo parziale/di avanzamento.

### Mappatura dei canali

| Canale     | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | bozza di avanzamento modificabile |
| Discord    | ✅    | ✅        | ✅      | bozza di avanzamento modificabile |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream di avanzamento nativo |

Solo Slack:

- `channels.slack.streaming.nativeTransport` attiva/disattiva le chiamate API di streaming native di Slack quando `channels.slack.streaming.mode="partial"` (predefinito: `true`).
- Lo streaming nativo di Slack e lo stato del thread dell'assistente Slack richiedono una destinazione di thread di risposta. I DM di primo livello non mostrano quell'anteprima in stile thread, ma possono comunque usare post e modifiche di anteprima bozza di Slack.

Migrazione delle chiavi legacy:

- Telegram: i valori legacy `streamMode` e scalari/booleani `streaming` vengono rilevati e migrati dai percorsi di compatibilità doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano rimangono alias runtime per l'enum `streaming`; esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.
- Slack: `streamMode` rimane un alias runtime per `streaming.mode`; `streaming` booleano rimane un alias runtime per `streaming.mode` più `streaming.nativeTransport`; `nativeStreaming` legacy rimane un alias runtime per `streaming.nativeTransport`. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.

### Comportamento runtime

Telegram:

- Usa `sendMessage` + aggiornamenti di anteprima `editMessageText` in DM e gruppi/topic.
- Le anteprime iniziali brevi sono ancora sottoposte a debounce per l'esperienza delle notifiche push, ma Telegram ora le materializza dopo un ritardo limitato in modo che le esecuzioni attive non restino visivamente silenziose.
- Il testo finale modifica l'anteprima attiva sul posto; i finali lunghi riutilizzano quel messaggio per il primo blocco e inviano solo i blocchi rimanenti.
- La modalità `block` ruota l'anteprima in un nuovo messaggio a `streaming.preview.chunk.maxChars` (predefinito 800, limitato al limite di modifica di Telegram di 4096); le altre modalità fanno crescere una singola anteprima fino a 4096 caratteri.
- La modalità `progress` mantiene l'avanzamento degli strumenti in una bozza di stato modificabile, materializza l'etichetta di stato quando lo streaming della risposta è attivo ma non è ancora disponibile alcuna riga di strumento, cancella quella bozza al completamento e invia la risposta finale tramite la consegna normale.
- Se la modifica finale fallisce prima che il testo completato sia confermato, OpenClaw usa la consegna finale normale e pulisce l'anteprima obsoleta.
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi di Telegram è abilitato esplicitamente (per evitare doppio streaming).
- `/reasoning stream` può scrivere il ragionamento in un'anteprima transitoria che viene eliminata dopo la consegna finale.

Discord:

- Usa invio + modifica dei messaggi di anteprima.
- La modalità `block` usa la suddivisione delle bozze (`draftChunk`).
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi di Discord è abilitato esplicitamente.
- I payload finali di media, errore e risposta esplicita annullano le anteprime in sospeso senza svuotare una nuova bozza, poi usano la consegna normale.

Slack:

- `partial` può usare lo streaming nativo di Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime bozza in stile append.
- `progress` usa testo di anteprima di stato, poi la risposta finale.
- I DM di primo livello senza un thread di risposta usano post e modifiche di anteprima bozza invece dello streaming nativo di Slack.
- Lo streaming di anteprima nativo e bozza sopprime le risposte a blocchi per quel turno, quindi una risposta Slack viene trasmessa tramite un solo percorso di consegna.
- I payload finali di media/errore e i finali di avanzamento non creano messaggi bozza usa e getta; solo i finali testo/blocco che possono modificare l'anteprima svuotano il testo bozza in sospeso.

Mattermost:

- Trasmette pensiero, attività degli strumenti e testo parziale della risposta in un singolo post di anteprima bozza che viene finalizzato sul posto quando è sicuro inviare la risposta finale.
- Ripiega sull'invio di un nuovo post finale se il post di anteprima è stato eliminato o non è altrimenti disponibile al momento della finalizzazione.
- I payload finali di media/errore annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale invece di svuotare un post di anteprima temporaneo.

Matrix:

- Le anteprime bozza vengono finalizzate sul posto quando il testo finale può riutilizzare l'evento di anteprima.
- I finali solo media, errore e con mancata corrispondenza della destinazione di risposta annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale; un'anteprima obsoleta già visibile viene redatta.

### Aggiornamenti di anteprima dell'avanzamento degli strumenti

Lo streaming di anteprima può includere anche aggiornamenti di **avanzamento degli strumenti** - brevi righe di stato come "ricerca sul web", "lettura del file" o "chiamata dello strumento" - che appaiono nello stesso messaggio di anteprima mentre gli strumenti sono in esecuzione, prima della risposta finale. In modalità app-server di Codex, i messaggi di preambolo/commentary di Codex usano questo stesso percorso di anteprima, quindi brevi note di avanzamento "Sto controllando..." possono essere trasmesse nella bozza modificabile senza diventare parte della risposta finale. Questo mantiene visivamente vivi i turni con strumenti in più passaggi invece che silenziosi tra la prima anteprima del pensiero e la risposta finale.

Gli strumenti a lunga esecuzione possono emettere avanzamento tipizzato prima di restituire. Per esempio,
`web_fetch` arma un timer di cinque secondi quando si avvia: se il recupero è ancora
in sospeso, l'anteprima può mostrare `Fetching page content...`; se il recupero termina
o viene annullato prima di allora, non viene emessa alcuna riga di avanzamento. Il successivo risultato finale dello strumento
viene comunque consegnato normalmente al modello.

Superfici supportate:

- **Discord**, **Slack**, **Telegram** e **Matrix** trasmettono per impostazione predefinita l'avanzamento degli strumenti e gli aggiornamenti del preambolo di Codex nella modifica dell'anteprima live quando lo streaming dell'anteprima è attivo. Microsoft Teams usa il proprio flusso di avanzamento nativo nelle chat personali.
- Telegram viene distribuito con gli aggiornamenti dell'anteprima dell'avanzamento degli strumenti abilitati da `v2026.4.22`; mantenerli abilitati preserva quel comportamento rilasciato.
- **Mattermost** integra già l'attività degli strumenti nel suo singolo post di anteprima bozza (vedi sopra).
- Le modifiche dell'avanzamento degli strumenti seguono la modalità di streaming dell'anteprima attiva; vengono saltate quando lo streaming dell'anteprima è `off` o quando lo streaming a blocchi ha preso il controllo del messaggio. Su Telegram, `streaming.mode: "off"` è solo finale: anche il rumore generico di avanzamento viene soppresso invece di essere consegnato come messaggi di stato autonomi, mentre le richieste di approvazione, i payload multimediali e gli errori continuano a essere instradati normalmente.
- Per mantenere lo streaming dell'anteprima ma nascondere le righe di avanzamento degli strumenti, imposta `streaming.preview.toolProgress` su `false` per quel canale. Per mantenere visibili le righe di avanzamento degli strumenti nascondendo al tempo stesso il testo di comandi/esecuzioni, imposta `streaming.preview.commandText` su `"status"` o `streaming.progress.commandText` su `"status"`; il valore predefinito è `"raw"` per preservare il comportamento rilasciato. Questa policy è condivisa dai canali bozza/avanzamento che usano il renderer compatto di avanzamento di OpenClaw, inclusi Discord, Matrix, Microsoft Teams, Mattermost, le anteprime bozza di Slack e Telegram. Per disabilitare completamente le modifiche dell'anteprima, imposta `streaming.mode` su `off`.
- Le risposte con citazione selezionata di Telegram sono un'eccezione: quando `replyToMode` non è `"off"` ed è presente testo di citazione selezionato, OpenClaw salta lo streaming dell'anteprima della risposta per quel turno, quindi le righe di anteprima dell'avanzamento degli strumenti non possono essere renderizzate. Le risposte al messaggio corrente senza testo di citazione selezionato mantengono comunque lo streaming dell'anteprima. Consulta la [documentazione del canale Telegram](/it/channels/telegram) per i dettagli.

Mantieni visibili le righe di avanzamento ma nascondi il testo grezzo di comandi/esecuzioni:

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

Usa la stessa struttura sotto un'altra chiave di canale con avanzamento compatto, ad esempio `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` o le anteprime bozza di Slack. Per la modalità bozza di avanzamento, inserisci la stessa policy sotto `streaming.progress`:

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

- [Refactor del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) - progettazione condivisa di anteprima, modifica, stream e finalizzazione di destinazione
- [Bozze di avanzamento](/it/concepts/progress-drafts) - messaggi visibili di lavoro in corso che si aggiornano durante turni lunghi
- [Messaggi](/it/concepts/messages) - ciclo di vita e consegna dei messaggi
- [Riprova](/it/concepts/retry) - comportamento di riprova in caso di errore di consegna
- [Canali](/it/channels) - supporto allo streaming per canale

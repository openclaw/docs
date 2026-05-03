---
read_when:
    - Spiegazione del funzionamento dello streaming o della suddivisione in blocchi sui canali
    - Modifica del comportamento dello streaming a blocchi o della suddivisione in chunk dei canali
    - Risoluzione dei problemi delle risposte a blocchi duplicate/premature o dello streaming dell'anteprima del canale
summary: Comportamento di streaming e suddivisione in segmenti (risposte a blocchi, streaming dell'anteprima del canale, mappatura delle modalità)
title: Streaming e suddivisione in blocchi
x-i18n:
    generated_at: "2026-05-03T21:31:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
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
- `chunker`: `EmbeddedBlockChunker` che applica limiti minimi/massimi + preferenza di interruzione.
- `channel send`: messaggi in uscita effettivi (risposte a blocchi).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito off).
- Override di canale: `*.blockStreaming` (e varianti per account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi in streaming prima dell'invio).
- Limite massimo rigido del canale: `*.textChunkLimit` (ad esempio, `channels.whatsapp.textChunkLimit`).
- Modalità di suddivisione del canale: `*.chunkMode` (`length` predefinito, `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza).
- Limite morbido Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte alte per evitare tagli nell'interfaccia.

**Semantica dei confini:**

- `text_end`: trasmette i blocchi appena il chunker li emette; svuota a ogni `text_end`.
- `message_end`: attende il completamento del messaggio dell'assistente, poi svuota l'output in buffer.

`message_end` usa comunque il chunker se il testo in buffer supera `maxChars`, quindi può emettere più blocchi alla fine.

### Consegna dei media con lo streaming a blocchi

Le direttive `MEDIA:` sono normali metadati di consegna. Quando lo streaming a blocchi invia in anticipo un blocco multimediale, OpenClaw ricorda quella consegna per il turno. Se il payload finale dell'assistente ripete lo stesso URL multimediale, la consegna finale rimuove il media duplicato invece di inviare di nuovo l'allegato.

I payload finali duplicati esatti vengono soppressi. Se il payload finale aggiunge testo distinto attorno a media che erano già stati trasmessi, OpenClaw invia comunque il nuovo testo mantenendo il media a consegna singola. Questo evita note vocali o file duplicati su canali come Telegram quando un agent emette `MEDIA:` durante lo streaming e il provider lo include anche nella risposta completata.

## Algoritmo di suddivisione (limiti basso/alto)

La suddivisione in blocchi è implementata da `EmbeddedBlockChunker`:

- **Limite basso:** non emettere finché il buffer >= `minChars` (salvo forzatura).
- **Limite alto:** preferisci divisioni prima di `maxChars`; se forzato, dividi a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Blocchi di codice:** non dividere mai all'interno dei blocchi; quando forzato a `maxChars`, chiudi + riapri il blocco per mantenere valido il Markdown.

`maxChars` viene limitato al `textChunkLimit` del canale, quindi non puoi superare i limiti per canale.

## Coalescenza (unione dei blocchi in streaming)

Quando lo streaming a blocchi è abilitato, OpenClaw può **unire blocchi consecutivi**
prima di inviarli. Questo riduce lo “spam su singola riga” pur fornendo
output progressivo.

- La coalescenza attende **intervalli di inattività** (`idleMs`) prima di svuotare.
- I buffer sono limitati da `maxChars` e verranno svuotati se lo superano.
- `minChars` impedisce l'invio di frammenti minuscoli finché non si accumula abbastanza testo
  (lo svuotamento finale invia sempre il testo rimanente).
- Il separatore è derivato da `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Gli override di canale sono disponibili tramite `*.blockStreamingCoalesce` (incluse le configurazioni per account).
- Il `minChars` predefinito della coalescenza viene aumentato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo umano tra i blocchi

Quando lo streaming a blocchi è abilitato, puoi aggiungere una **pausa casuale** tra
le risposte a blocchi (dopo il primo blocco). Questo rende le risposte a più bolle
più naturali.

- Configurazione: `agents.defaults.humanDelay` (override per agent tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinito), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte a blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Trasmetti blocchi o tutto"

Questo corrisponde a:

- **Trasmetti blocchi:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emette man mano). I canali non Telegram richiedono anche `*.blockStreaming: true`.
- **Trasmetti tutto alla fine:** `blockStreamingBreak: "message_end"` (svuota una volta, eventualmente in più blocchi se molto lungo).
- **Nessuno streaming a blocchi:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sul canale:** lo streaming a blocchi è **disattivato salvo che**
`*.blockStreaming` sia impostato esplicitamente su `true`. I canali possono trasmettere un'anteprima live
(`channels.<channel>.streaming`) senza risposte a blocchi.

Promemoria sulla posizione della configurazione: i valori predefiniti `blockStreaming*` si trovano sotto
`agents.defaults`, non nella configurazione root.

## Modalità di streaming di anteprima

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita lo streaming di anteprima.
- `partial`: singola anteprima sostituita con il testo più recente.
- `block`: l'anteprima si aggiorna in passaggi a blocchi/aggiunti.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

`streaming.mode: "block"` è una modalità di streaming di anteprima per canali
modificabili come Discord e Telegram. Non abilita lì la consegna a blocchi del canale.
Usa `streaming.block.enabled` o la chiave di canale legacy `blockStreaming` quando
vuoi normali risposte a blocchi. Microsoft Teams è l'eccezione: non ha un
trasporto di blocchi per anteprime bozza, quindi `streaming.mode: "block"` viene mappato alla consegna a blocchi di Teams
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

- `channels.slack.streaming.nativeTransport` attiva/disattiva le chiamate all'API di streaming nativa di Slack quando `channels.slack.streaming.mode="partial"` (predefinito: `true`).
- Lo streaming nativo di Slack e lo stato del thread dell'assistente Slack richiedono una destinazione di thread di risposta. I DM di primo livello non mostrano quell'anteprima in stile thread, ma possono comunque usare post di anteprima bozza Slack e modifiche.

Migrazione delle chiavi legacy:

- Telegram: i valori legacy `streamMode` e scalari/booleani `streaming` vengono rilevati e migrati dai percorsi di compatibilità doctor/config a `streaming.mode`.
- Discord: `streamMode` + booleano `streaming` migrano automaticamente all'enum `streaming`.
- Slack: `streamMode` migra automaticamente a `streaming.mode`; il booleano `streaming` migra automaticamente a `streaming.mode` più `streaming.nativeTransport`; il legacy `nativeStreaming` migra automaticamente a `streaming.nativeTransport`.

### Comportamento runtime

Telegram:

- Usa aggiornamenti di anteprima `sendMessage` + `editMessageText` in DM e gruppi/argomenti.
- Invia un nuovo messaggio finale invece di modificare sul posto quando un'anteprima è rimasta visibile per circa un minuto, poi pulisce l'anteprima in modo che il timestamp di Telegram rifletta il completamento della risposta.
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi di Telegram è abilitato esplicitamente (per evitare doppio streaming).
- `/reasoning stream` può scrivere il ragionamento nell'anteprima.

Discord:

- Usa messaggi di anteprima con invio + modifica.
- La modalità `block` usa la suddivisione in bozze (`draftChunk`).
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi di Discord è abilitato esplicitamente.
- I payload finali di media, errori e risposte esplicite annullano le anteprime in sospeso senza svuotare una nuova bozza, poi usano la consegna normale.

Slack:

- `partial` può usare lo streaming nativo di Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime bozza in stile append.
- `progress` usa testo di anteprima di stato, poi la risposta finale.
- I DM di primo livello senza un thread di risposta usano post di anteprima bozza e modifiche invece dello streaming nativo di Slack.
- Lo streaming di anteprima nativo e bozza sopprime le risposte a blocchi per quel turno, quindi una risposta Slack viene trasmessa da un solo percorso di consegna.
- I payload finali di media/errori e i finali di avanzamento non creano messaggi bozza usa e getta; solo i finali di testo/blocco che possono modificare l'anteprima svuotano il testo bozza in sospeso.

Mattermost:

- Trasmette pensiero, attività degli strumenti e testo parziale della risposta in un singolo post di anteprima bozza che viene finalizzato sul posto quando la risposta finale può essere inviata in sicurezza.
- Ripiega sull'invio di un nuovo post finale se il post di anteprima è stato eliminato o non è altrimenti disponibile al momento della finalizzazione.
- I payload finali di media/errori annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale invece di svuotare un post di anteprima temporaneo.

Matrix:

- Le anteprime bozza vengono finalizzate sul posto quando il testo finale può riutilizzare l'evento di anteprima.
- I finali solo media, errore e con mancata corrispondenza del target di risposta annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale; un'anteprima obsoleta già visibile viene oscurata.

### Aggiornamenti di anteprima dell'avanzamento degli strumenti

Lo streaming di anteprima può includere anche aggiornamenti di **avanzamento degli strumenti** — brevi righe di stato come "ricerca sul web", "lettura file" o "chiamata strumento" — che appaiono nello stesso messaggio di anteprima mentre gli strumenti sono in esecuzione, prima della risposta finale. Questo mantiene visivamente vivi i turni con strumenti a più passaggi invece di lasciarli silenziosi tra la prima anteprima di pensiero e la risposta finale.

Superfici supportate:

- **Discord**, **Slack**, **Telegram** e **Matrix** trasmettono per impostazione predefinita l'avanzamento degli strumenti nella modifica dell'anteprima live quando lo streaming di anteprima è attivo. Microsoft Teams usa il suo stream di avanzamento nativo nelle chat personali.
- Telegram viene fornito con gli aggiornamenti di anteprima dell'avanzamento degli strumenti abilitati da `v2026.4.22`; mantenerli abilitati preserva quel comportamento rilasciato.
- **Mattermost** incorpora già l'attività degli strumenti nel suo singolo post di anteprima bozza (vedi sopra).
- Le modifiche di avanzamento degli strumenti seguono la modalità di streaming di anteprima attiva; vengono saltate quando lo streaming di anteprima è `off` o quando lo streaming a blocchi ha preso il controllo del messaggio. Su Telegram, `streaming.mode: "off"` è solo finale: anche il chiacchiericcio generico di avanzamento viene soppresso invece di essere consegnato come messaggi di stato autonomi, mentre prompt di approvazione, payload multimediali ed errori seguono comunque il routing normale.
- Per mantenere lo streaming di anteprima ma nascondere le righe di avanzamento degli strumenti, imposta `streaming.preview.toolProgress` su `false` per quel canale. Per disabilitare completamente le modifiche di anteprima, imposta `streaming.mode` su `off`.
- Le risposte a citazioni selezionate Telegram sono un'eccezione: quando `replyToMode` non è `"off"` ed è presente testo di citazione selezionato, OpenClaw salta lo stream di anteprima della risposta per quel turno, quindi le righe di anteprima di avanzamento degli strumenti non possono essere renderizzate. Le risposte al messaggio corrente senza testo di citazione selezionato mantengono comunque lo streaming di anteprima. Consulta la [documentazione del canale Telegram](/it/channels/telegram) per i dettagli.

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

- [Bozze di avanzamento](/it/concepts/progress-drafts) — messaggi visibili di lavoro in corso che si aggiornano durante turni lunghi
- [Messaggi](/it/concepts/messages) — ciclo di vita e consegna dei messaggi
- [Riprova](/it/concepts/retry) — comportamento di riprova in caso di errore di consegna
- [Canali](/it/channels) — supporto allo streaming per canale

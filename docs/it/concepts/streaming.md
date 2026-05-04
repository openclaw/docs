---
read_when:
    - Spiegazione del funzionamento dello streaming o della suddivisione in blocchi nei canali
    - Modificare il comportamento dello streaming a blocchi o della suddivisione in chunk del canale
    - Risoluzione dei problemi relativi a risposte duplicate/anticipate dei blocchi o allo streaming di anteprima del canale
summary: Comportamento di streaming + suddivisione in chunk (risposte a blocchi, streaming dell'anteprima del canale, mappatura delle modalità)
title: Trasmissione in streaming e suddivisione in blocchi
x-i18n:
    generated_at: "2026-05-04T07:05:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ha due livelli di streaming separati:

- **Streaming dei blocchi (canali):** emette **blocchi** completati mentre l'assistente scrive. Questi sono normali messaggi del canale (non delta di token).
- **Streaming dell'anteprima (Telegram/Discord/Slack):** aggiorna un **messaggio di anteprima** temporaneo durante la generazione.

Oggi non esiste un **vero streaming con delta di token** verso i messaggi del canale. Lo streaming dell'anteprima è basato sui messaggi (invio + modifiche/aggiunte).

## Streaming dei blocchi (messaggi del canale)

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

- `text_delta/events`: eventi dello stream del modello (possono essere radi per i modelli non in streaming).
- `chunker`: `EmbeddedBlockChunker` applica limiti min/max + preferenza di interruzione.
- `channel send`: messaggi in uscita effettivi (risposte a blocchi).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito disattivato).
- Override dei canali: `*.blockStreaming` (e varianti per account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi in streaming prima dell'invio).
- Limite rigido del canale: `*.textChunkLimit` (ad esempio, `channels.whatsapp.textChunkLimit`).
- Modalità di suddivisione del canale: `*.chunkMode` (`length` predefinito, `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza).
- Limite flessibile di Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte alte per evitare tagli dell'interfaccia utente.

**Semantica dei confini:**

- `text_end`: trasmette i blocchi non appena il chunker li emette; esegue il flush a ogni `text_end`.
- `message_end`: attende il completamento del messaggio dell'assistente, quindi esegue il flush dell'output nel buffer.

`message_end` usa comunque il chunker se il testo nel buffer supera `maxChars`, quindi può emettere più blocchi alla fine.

### Consegna dei media con streaming dei blocchi

Le direttive `MEDIA:` sono normali metadati di consegna. Quando lo streaming dei blocchi invia in anticipo un blocco multimediale, OpenClaw ricorda quella consegna per il turno. Se il payload finale dell'assistente ripete lo stesso URL multimediale, la consegna finale rimuove il media duplicato invece di inviare di nuovo l'allegato.

I payload finali duplicati esatti vengono soppressi. Se il payload finale aggiunge testo distinto attorno a media già trasmessi in streaming, OpenClaw invia comunque il nuovo testo mantenendo il media in consegna singola. Questo evita note vocali o file duplicati su canali come Telegram quando un agente emette `MEDIA:` durante lo streaming e anche il provider lo include nella risposta completata.

## Algoritmo di suddivisione (limiti basso/alto)

La suddivisione in blocchi è implementata da `EmbeddedBlockChunker`:

- **Limite basso:** non emettere finché il buffer >= `minChars` (salvo forzatura).
- **Limite alto:** preferisci divisioni prima di `maxChars`; se forzato, dividi a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Blocchi di codice:** non dividere mai all'interno dei fence; quando si forza a `maxChars`, chiudi + riapri il fence per mantenere Markdown valido.

`maxChars` è limitato al `textChunkLimit` del canale, quindi non puoi superare i limiti per canale.

## Coalescenza (unione dei blocchi in streaming)

Quando lo streaming dei blocchi è abilitato, OpenClaw può **unire blocchi consecutivi**
prima di inviarli. Questo riduce lo “spam a riga singola” pur fornendo comunque
un output progressivo.

- La coalescenza attende **intervalli di inattività** (`idleMs`) prima del flush.
- I buffer sono limitati da `maxChars` ed eseguiranno il flush se lo superano.
- `minChars` impedisce l'invio di frammenti minuscoli finché non si accumula testo sufficiente
  (il flush finale invia sempre il testo rimanente).
- Il separatore è derivato da `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Gli override dei canali sono disponibili tramite `*.blockStreamingCoalesce` (incluse le configurazioni per account).
- Il `minChars` predefinito della coalescenza viene aumentato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo simile a quello umano tra blocchi

Quando lo streaming dei blocchi è abilitato, puoi aggiungere una **pausa casuale** tra le
risposte a blocchi (dopo il primo blocco). Questo rende più naturali le risposte con
più bolle.

- Configurazione: `agents.defaults.humanDelay` (override per agente tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinita), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte a blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Trasmettere blocchi o tutto"

Questo corrisponde a:

- **Trasmettere blocchi:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emetti man mano). I canali non Telegram richiedono anche `*.blockStreaming: true`.
- **Trasmettere tutto alla fine:** `blockStreamingBreak: "message_end"` (flush una volta, eventualmente più blocchi se molto lungo).
- **Nessuno streaming dei blocchi:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sul canale:** lo streaming dei blocchi è **disattivato salvo che**
`*.blockStreaming` sia impostato esplicitamente su `true`. I canali possono trasmettere un'anteprima live
(`channels.<channel>.streaming`) senza risposte a blocchi.

Promemoria sulla posizione della configurazione: i valori predefiniti `blockStreaming*` si trovano sotto
`agents.defaults`, non nella configurazione radice.

## Modalità di streaming dell'anteprima

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita lo streaming dell'anteprima.
- `partial`: anteprima singola sostituita con il testo più recente.
- `block`: l'anteprima si aggiorna in passaggi suddivisi/aggiunti.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

`streaming.mode: "block"` è una modalità di streaming dell'anteprima per canali
modificabili come Discord e Telegram. Non abilita lì la consegna a blocchi del canale.
Usa `streaming.block.enabled` o la chiave legacy del canale `blockStreaming` quando
vuoi normali risposte a blocchi. Microsoft Teams è l'eccezione: non ha un trasporto
di blocchi per anteprime bozza, quindi `streaming.mode: "block"` corrisponde alla consegna a blocchi
di Teams invece dello streaming parziale/di avanzamento nativo.

### Mappatura dei canali

| Canale     | `off` | `partial` | `block` | `progress`                     |
| ---------- | ----- | --------- | ------- | ------------------------------ |
| Telegram   | ✅    | ✅        | ✅      | bozza di avanzamento modificabile |
| Discord    | ✅    | ✅        | ✅      | bozza di avanzamento modificabile |
| Slack      | ✅    | ✅        | ✅      | ✅                             |
| Mattermost | ✅    | ✅        | ✅      | ✅                             |
| MS Teams   | ✅    | ✅        | ✅      | stream di avanzamento nativo   |

Solo Slack:

- `channels.slack.streaming.nativeTransport` attiva/disattiva le chiamate API di streaming nativo di Slack quando `channels.slack.streaming.mode="partial"` (predefinito: `true`).
- Lo streaming nativo di Slack e lo stato del thread dell'assistente Slack richiedono un thread di risposta di destinazione. I DM di primo livello non mostrano quell'anteprima in stile thread, ma possono comunque usare post e modifiche di anteprime bozza Slack.

Migrazione delle chiavi legacy:

- Telegram: i valori legacy `streamMode` e `streaming` scalari/booleani sono rilevati e migrati dai percorsi di compatibilità doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migrano automaticamente all'enum `streaming`.
- Slack: `streamMode` migra automaticamente a `streaming.mode`; `streaming` booleano migra automaticamente a `streaming.mode` più `streaming.nativeTransport`; `nativeStreaming` legacy migra automaticamente a `streaming.nativeTransport`.

### Comportamento a runtime

Telegram:

- Usa `sendMessage` + aggiornamenti di anteprima `editMessageText` in DM e gruppi/topic.
- Invia un nuovo messaggio finale invece di modificarlo sul posto quando un'anteprima è rimasta visibile per circa un minuto, quindi pulisce l'anteprima in modo che il timestamp di Telegram rifletta il completamento della risposta.
- Lo streaming dell'anteprima viene saltato quando lo streaming dei blocchi di Telegram è abilitato esplicitamente (per evitare doppio streaming).
- `/reasoning stream` può scrivere il ragionamento in un'anteprima temporanea eliminata dopo la consegna finale.

Discord:

- Usa messaggi di anteprima con invio + modifica.
- La modalità `block` usa la suddivisione in bozze (`draftChunk`).
- Lo streaming dell'anteprima viene saltato quando lo streaming dei blocchi di Discord è abilitato esplicitamente.
- I payload finali con media, errori e risposte esplicite annullano le anteprime in sospeso senza eseguire il flush di una nuova bozza, quindi usano la consegna normale.

Slack:

- `partial` può usare lo streaming nativo di Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime bozza in stile append.
- `progress` usa testo di anteprima dello stato, poi la risposta finale.
- I DM di primo livello senza un thread di risposta usano post e modifiche di anteprime bozza invece dello streaming nativo di Slack.
- Lo streaming dell'anteprima nativo e bozza sopprime le risposte a blocchi per quel turno, quindi una risposta Slack viene trasmessa da un solo percorso di consegna.
- I payload finali con media/errori e i finali di avanzamento non creano messaggi bozza usa e getta; solo i finali di testo/blocco che possono modificare l'anteprima eseguono il flush del testo bozza in sospeso.

Mattermost:

- Trasmette pensiero, attività degli strumenti e testo parziale della risposta in un singolo post di anteprima bozza che viene finalizzato sul posto quando la risposta finale può essere inviata in sicurezza.
- Ripiega sull'invio di un nuovo post finale se il post di anteprima è stato eliminato o è altrimenti non disponibile al momento della finalizzazione.
- I payload finali con media/errori annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale invece di eseguire il flush di un post di anteprima temporaneo.

Matrix:

- Le anteprime bozza vengono finalizzate sul posto quando il testo finale può riutilizzare l'evento di anteprima.
- I finali solo media, errore e con mancata corrispondenza del destinatario della risposta annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale; un'anteprima obsoleta già visibile viene redatta.

### Aggiornamenti dell'anteprima di avanzamento strumenti

Lo streaming dell'anteprima può includere anche aggiornamenti di **avanzamento strumenti**: brevi righe di stato come "ricerca sul web", "lettura del file" o "chiamata allo strumento", che appaiono nello stesso messaggio di anteprima mentre gli strumenti sono in esecuzione, prima della risposta finale. Questo mantiene i turni con strumenti a più passaggi visivamente attivi invece che silenziosi tra la prima anteprima di ragionamento e la risposta finale.

Superfici supportate:

- **Discord**, **Slack**, **Telegram** e **Matrix** trasmettono l'avanzamento strumenti nella modifica dell'anteprima live per impostazione predefinita quando lo streaming dell'anteprima è attivo. Microsoft Teams usa il suo stream di avanzamento nativo nelle chat personali.
- Telegram è stato rilasciato con gli aggiornamenti dell'anteprima di avanzamento strumenti abilitati da `v2026.4.22`; mantenerli abilitati preserva quel comportamento rilasciato.
- **Mattermost** integra già l'attività degli strumenti nel suo singolo post di anteprima bozza (vedi sopra).
- Le modifiche di avanzamento strumenti seguono la modalità di streaming dell'anteprima attiva; vengono saltate quando lo streaming dell'anteprima è `off` o quando lo streaming dei blocchi ha preso il controllo del messaggio. Su Telegram, `streaming.mode: "off"` è solo finale: anche le comunicazioni generiche di avanzamento vengono soppresse invece di essere consegnate come messaggi di stato autonomi, mentre richieste di approvazione, payload multimediali ed errori seguono comunque il normale routing.
- Per mantenere lo streaming dell'anteprima ma nascondere le righe di avanzamento strumenti, imposta `streaming.preview.toolProgress` su `false` per quel canale. Per mantenere visibili le righe di avanzamento strumenti nascondendo il testo di comando/exec, imposta `streaming.preview.commandText` su `"status"` o `streaming.progress.commandText` su `"status"`; il valore predefinito è `"raw"` per preservare il comportamento rilasciato. Questa policy è condivisa dai canali bozza/avanzamento che usano il renderer di avanzamento compatto di OpenClaw, inclusi Discord, Matrix, Microsoft Teams, Mattermost, anteprime bozza Slack e Telegram. Per disabilitare completamente le modifiche dell'anteprima, imposta `streaming.mode` su `off`.
- Le risposte con citazione selezionata di Telegram sono un'eccezione: quando `replyToMode` non è `"off"` ed è presente testo di citazione selezionato, OpenClaw salta lo stream di anteprima della risposta per quel turno, quindi le righe di anteprima di avanzamento strumenti non possono essere renderizzate. Le risposte al messaggio corrente senza testo di citazione selezionato mantengono comunque lo streaming dell'anteprima. Consulta la [documentazione del canale Telegram](/it/channels/telegram) per i dettagli.

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

Usa la stessa struttura sotto un'altra chiave di canale di avanzamento compatto, ad esempio `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` o le anteprime delle bozze Slack. Per la modalità di bozza di avanzamento, inserisci la stessa policy sotto `streaming.progress`:

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

- [Bozze di avanzamento](/it/concepts/progress-drafts) — messaggi visibili di lavoro in corso che si aggiornano durante i turni lunghi
- [Messaggi](/it/concepts/messages) — ciclo di vita e recapito dei messaggi
- [Nuovo tentativo](/it/concepts/retry) — comportamento di nuovo tentativo in caso di errore di recapito
- [Canali](/it/channels) — supporto allo streaming per canale

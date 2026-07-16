---
read_when:
    - Spiegazione del funzionamento dello streaming o della suddivisione in blocchi nei canali
    - Modifica del comportamento dello streaming a blocchi o della suddivisione in parti del canale
    - Debug delle risposte a blocchi duplicate/anticipate o dello streaming dell'anteprima del canale
summary: Comportamento di streaming + suddivisione in blocchi (risposte a blocchi, streaming dell'anteprima del canale, mappatura delle modalità)
title: Streaming e suddivisione in blocchi
x-i18n:
    generated_at: "2026-07-16T14:18:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw dispone di due livelli di streaming indipendenti e attualmente **non esiste un vero
streaming dei delta dei token** nei messaggi dei canali:

- **Streaming a blocchi (canali):** emette **blocchi** completati man mano che l'assistente
  scrive. Si tratta di normali messaggi del canale, non di delta dei token.
- **Streaming dell'anteprima (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  aggiorna un **messaggio di anteprima** temporaneo durante la generazione (invio + modifiche/aggiunte).

## Streaming a blocchi (messaggi dei canali)

Lo streaming a blocchi invia l'output dell'assistente in segmenti di grandi dimensioni non appena diventano disponibili.

```text
Output del modello
  └─ text_delta/eventi
       ├─ (blockStreamingBreak=text_end)
       │    └─ il segmentatore emette blocchi con l'aumentare del buffer
       └─ (blockStreamingBreak=message_end)
            └─ il segmentatore svuota il buffer a message_end
                   └─ invio al canale (risposte a blocchi)
```

- `text_delta/events`: eventi del flusso del modello (possono essere sporadici per i modelli senza streaming).
- `chunker`: `EmbeddedBlockChunker` applicando i limiti minimo/massimo e la preferenza di interruzione.
- `channel send`: messaggi effettivamente inviati (risposte a blocchi).

**Controlli** (tutti sotto `agents.defaults`, salvo diversa indicazione):

| Chiave                                                          | Valori / struttura                                                          | Valore predefinito    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi trasmessi prima dell'invio) | -          |
| `*.streaming.block.enabled` (sostituzione per il canale)               | `true` / `false`, forza lo streaming a blocchi per canale (e per account)  | -          |
| `*.textChunkLimit` (ad es. `channels.whatsapp.textChunkLimit`) | numero, limite massimo assoluto                                                        | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | numero, limite non rigido di righe che divide le risposte lunghe per evitare il taglio nell'interfaccia utente     | 17         |

`streaming.chunkMode: "newline"` divide in corrispondenza delle righe vuote (confini dei paragrafi),
non a ogni nuova riga, per poi ricorrere alla suddivisione in base alla lunghezza quando il testo
supera il limite.

I canali inclusi esprimono queste sostituzioni come
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. Le forme piatte
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` sono
obsolete in tutti i canali inclusi: `openclaw doctor --fix` le migra nella
struttura nidificata e gli schemi dei canali le rifiutano. Le configurazioni dei Plugin
SDK esterni che usano ancora le forme piatte continuano a funzionare tramite una soluzione
di ripiego deprecata (con un avviso in fase di esecuzione) fino al prossimo ciclo di rilascio.

**Semantica dei confini** per `blockStreamingBreak`:

- `text_end`: trasmette i blocchi non appena il segmentatore li emette; svuota il buffer a ogni `text_end`.
- `message_end`: attende il completamento del messaggio dell'assistente, quindi svuota l'output
  memorizzato nel buffer. Usa comunque il segmentatore se il testo nel buffer supera `maxChars`, quindi
  può emettere più segmenti alla fine.

### Consegna dei contenuti multimediali con lo streaming a blocchi

I contenuti multimediali in streaming devono usare campi del payload strutturati come `mediaUrl` o
`mediaUrls`; il testo trasmesso non viene interpretato come comando per un allegato. Quando lo streaming a
blocchi invia anticipatamente contenuti multimediali, OpenClaw memorizza tale consegna per il turno. Se
il payload finale dell'assistente ripete lo stesso URL del contenuto multimediale, la consegna finale rimuove
il contenuto duplicato anziché inviare nuovamente l'allegato.

I payload finali esattamente duplicati vengono eliminati. Se il payload finale aggiunge
testo distinto attorno a contenuti multimediali già trasmessi, OpenClaw invia comunque il
nuovo testo, mantenendo la consegna singola dei contenuti multimediali. Ciò evita la duplicazione di messaggi
vocali o file su canali come Telegram.

## Algoritmo di segmentazione (limiti inferiore/superiore)

La segmentazione in blocchi è implementata da `EmbeddedBlockChunker`:

- **Limite inferiore:** non emette finché il buffer non raggiunge almeno `minChars` (salvo forzatura).
- **Limite superiore:** preferisce le divisioni prima di `maxChars`; se forzato, divide a `maxChars`.
- **Sequenza delle preferenze di interruzione:** `paragraph` -> `newline` -> `sentence` ->
  spazio vuoto -> interruzione forzata.
- **Blocchi di codice:** non divide mai all'interno dei blocchi; quando viene forzato a `maxChars`, chiude
  e riapre il blocco per mantenere valido il Markdown.

`maxChars` è limitato al valore `textChunkLimit` del canale, quindi non è possibile superare
i limiti specifici del canale.

## Aggregazione (unione dei blocchi trasmessi)

Quando lo streaming a blocchi è abilitato, OpenClaw può **unire segmenti di blocchi
consecutivi** prima di inviarli, riducendo l'accumulo di messaggi su singola riga e fornendo comunque
un output progressivo.

- L'aggregazione attende **intervalli di inattività** (`idleMs`) prima di svuotare il buffer.
- I buffer sono limitati da `maxChars` e vengono svuotati se lo superano.
- `minChars` impedisce l'invio di frammenti troppo piccoli finché non si accumula testo sufficiente
  (lo svuotamento finale invia sempre il testo rimanente).
- Il separatore deriva da `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> spazio.
- Le sostituzioni per i canali sono disponibili tramite `*.streaming.block.coalesce` (incluse
  le configurazioni per account).
- Per Discord, Signal e Slack l'aggregazione predefinita è `{ minChars: 1500, idleMs: 1000 }`,
  salvo sostituzione.

## Ritmo simile a quello umano tra i blocchi

Quando lo streaming a blocchi è abilitato, viene aggiunta una **pausa casuale** tra le risposte
a blocchi, dopo il primo blocco, per rendere più naturali le risposte suddivise in più messaggi.

| `agents.defaults.humanDelay.mode` | Comportamento                |
| --------------------------------- | ----------------------- |
| `off` (predefinito)                   | Nessuna pausa                |
| `natural`                         | Pausa casuale di 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Sostituibile per agente tramite `agents.list[].humanDelay`. Si applica solo alle **risposte a
blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Trasmettere i segmenti o tutto"

- **Trasmettere i segmenti:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (emissione progressiva). I canali diversi da Telegram richiedono anche
  `*.streaming.block.enabled: true`.
- **Trasmettere tutto alla fine:** `blockStreamingBreak: "message_end"` (un unico svuotamento,
  eventualmente in più segmenti se il contenuto è molto lungo).
- **Nessuno streaming a blocchi:** `blockStreamingDefault: "off"` (solo risposta finale).

Lo streaming a blocchi è **disattivato a meno che** `*.streaming.block.enabled` non sia impostato esplicitamente
su `true` (eccezione: QQ Bot non dispone di chiavi `streaming.block` e trasmette
le risposte a blocchi a meno che `channels.qqbot.streaming.mode` non sia `"off"`). I canali possono
trasmettere un'anteprima in tempo reale (`channels.<channel>.streaming.mode`) senza risposte
a blocchi. I valori predefiniti di `blockStreaming*` si trovano sotto `agents.defaults`, non nella
radice della configurazione.

## Modalità di streaming dell'anteprima

Chiave canonica: `channels.<channel>.streaming` (`{ mode, ... }` nidificato; le forme booleane/stringa
di primo livello obsolete vengono riscritte da `openclaw doctor --fix`).

| Modalità       | Comportamento                                                              |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Disabilita lo streaming dell'anteprima                                             |
| `partial`  | Singola anteprima sostituita con il testo più recente                              |
| `block`    | Aggiornamenti dell'anteprima in passaggi segmentati/aggiunti                             |
| `progress` | Anteprima di avanzamento/stato durante la generazione, risposta finale al completamento |

`streaming.mode: "block"` è una modalità di streaming dell'anteprima per i canali che supportano
la modifica, come Discord e Telegram; da sola non abilita la consegna a blocchi
del canale. Usare `streaming.block.enabled` per le normali risposte a blocchi.
Microsoft Teams costituisce
un'eccezione: non dispone di un trasporto a blocchi per l'anteprima della bozza, quindi `streaming.mode:
"block"` disabilita completamente lo streaming nativo e la risposta viene recapitata come normale
consegna a blocchi anziché tramite streaming nativo parziale/di avanzamento. Anche Mattermost
si comporta diversamente: in modalità `block` alterna l'anteprima tra testo completato e
blocchi di attività degli strumenti, quindi i blocchi precedenti rimangono visibili come post separati
anziché essere sovrascritti in un'unica bozza modificabile.

### Mappatura dei canali

| Canale    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Sì   | Sì       | Sì     | bozza di avanzamento modificabile |
| Discord    | Sì   | Sì       | Sì     | bozza di avanzamento modificabile |
| Slack      | Sì   | Sì       | Sì     | Sì                     |
| Mattermost | Sì   | Sì       | Sì     | Sì                     |
| MS Teams   | Sì   | Sì       | Sì     | flusso di avanzamento nativo  |

La configurazione dei segmenti dell'anteprima (`streaming.preview.chunk.*`, ad esempio sotto
`channels.discord.streaming` o `channels.telegram.streaming`) usa come valori predefiniti
`minChars: 200`, `maxChars: 800` (limitato al valore `textChunkLimit` del canale) e
`breakPreference: "paragraph"`.

Solo per Slack:

- `channels.slack.streaming.nativeTransport` attiva o disattiva le chiamate API di streaming native di Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) quando
  `channels.slack.streaming.mode="partial"` (valore predefinito: `true`).
- Lo streaming nativo di Slack e lo stato del thread dell'assistente Slack richiedono una destinazione
  nel thread di risposta. I messaggi diretti di primo livello non mostrano tale anteprima in stile thread, ma possono
  comunque usare post di anteprima della bozza di Slack e relative modifiche.

### Migrazione delle chiavi obsolete

| Canale  | Chiavi obsolete                                                 | Stato                                                                                                                                               |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` scalare/booleano                    | Riscritte in `streaming.mode` da `openclaw doctor --fix`; non vengono lette in fase di esecuzione                                                                        |
| Discord  | `streamMode`, `streaming` booleano                           | Riscritte in `streaming.mode` da `openclaw doctor --fix`; non vengono lette in fase di esecuzione                                                                        |
| Slack    | `streamMode`; `streaming` booleano; `nativeStreaming` obsoleto | Riscritte in `streaming.mode` (e `streaming.nativeTransport` per le forme booleane/obsolete) da `openclaw doctor --fix`; non vengono lette in fase di esecuzione         |
| Matrix   | `streaming` scalare/booleano                                  | Riscritte in `streaming.mode` (inclusa la modalità `"quiet"` di Matrix) da `openclaw doctor --fix`; non vengono lette in fase di esecuzione                                    |
| Feishu   | `streaming` booleano                                         | Riscritta in `streaming.mode` da `openclaw doctor --fix`; non viene letta in fase di esecuzione                                                                        |
| QQ Bot   | `streaming` booleano; `streaming.c2cStreamApi`               | Riscritte in `streaming.mode` (e `streaming.nativeTransport` per le forme booleane/`c2cStreamApi`) da `openclaw doctor --fix`; non vengono lette in fase di esecuzione |

## Comportamento in fase di esecuzione

### Telegram

- Utilizza gli aggiornamenti di anteprima `sendMessage` + `editMessageText` nei messaggi diretti e
  nei gruppi/argomenti; il testo finale modifica sul posto l'anteprima attiva. Le bozze
  effimere di «digitazione» di 30 secondi di Telegram (`sendMessageDraft`) non vengono utilizzate per
  lo streaming delle risposte.
- Le brevi anteprime iniziali sono comunque sottoposte a debounce per l'esperienza utente delle notifiche push, ma
  vengono visualizzate dopo un ritardo limitato, affinché le esecuzioni attive non rimangano visivamente silenziose.
- Le risposte finali lunghe riutilizzano il messaggio di anteprima per il primo blocco e inviano solo
  i blocchi rimanenti.
- La modalità `block` trasferisce l'anteprima in un nuovo messaggio al raggiungimento di
  `streaming.preview.chunk.maxChars` (valore predefinito 800, limitato al limite di modifica di 4096
  di Telegram); le altre modalità estendono un'unica anteprima fino a 4096 caratteri.
- La modalità `progress` mantiene l'avanzamento degli strumenti in una bozza di stato modificabile, visualizza
  l'etichetta di stato quando lo streaming della risposta è attivo ma non è ancora
  disponibile alcuna riga relativa agli strumenti, cancella la bozza al completamento e invia la risposta finale
  tramite il recapito normale.
- Se la modifica finale non riesce prima che il testo completato sia confermato, OpenClaw utilizza
  il normale recapito finale ed elimina l'anteprima obsoleta.
- Lo streaming dell'anteprima viene ignorato quando lo streaming a blocchi di Telegram è esplicitamente
  abilitato, per evitare un doppio streaming.
- `/reasoning stream` può scrivere il ragionamento in un'anteprima transitoria che viene
  eliminata dopo il recapito finale.
- Le risposte di Telegram con citazione selezionata costituiscono un'eccezione: quando `replyToMode` non è
  `"off"` ed è presente il testo della citazione selezionata, OpenClaw ignora lo streaming dell'anteprima
  della risposta per quel turno (la risposta finale deve seguire il percorso nativo di risposta con citazione),
  pertanto le righe di anteprima dell'avanzamento degli strumenti non possono essere visualizzate. Le risposte
  al messaggio corrente senza testo di citazione selezionato mantengono invece lo streaming dell'anteprima. Per i dettagli, consultare
  la [documentazione del canale Telegram](/it/channels/telegram).

### Discord

- Utilizza l'invio e la modifica dei messaggi di anteprima.
- La modalità `block` utilizza la suddivisione della bozza in blocchi (`draftChunk`).
- Lo streaming dell'anteprima viene ignorato quando lo streaming a blocchi di Discord è esplicitamente
  abilitato.
- La modalità `progress` aggiunge alla risposta finale una piccola ricevuta di attività `-#` (conteggi
  dei pensieri/delle chiamate agli strumenti e tempo trascorso) ed elimina la bozza di stato
  una volta recapitata la risposta, affinché nei canali molto attivi non rimangano registri degli strumenti orfani
  sopra la risposta. In caso di errore finale, la bozza viene conservata come registrazione del turno
  non riuscito.
- I payload finali con contenuti multimediali, errori e risposte esplicite annullano le anteprime in sospeso
  senza pubblicare una nuova bozza, quindi utilizzano il recapito normale.

### Slack

- `partial` può utilizzare lo streaming nativo di Slack (`chat.startStream`/`append`/`stop`)
  quando disponibile.
- `block` utilizza anteprime di bozza con aggiunta progressiva.
- `progress` utilizza il testo dell'anteprima di stato, seguito dalla risposta finale.
- I messaggi diretti di primo livello senza un thread di risposta utilizzano la pubblicazione e la modifica di anteprime
  di bozza anziché lo streaming nativo di Slack.
- Lo streaming nativo e quello delle anteprime di bozza sopprimono le risposte a blocchi per quel turno, affinché una
  risposta di Slack venga trasmessa in streaming tramite un solo percorso di recapito.
- I payload finali con contenuti multimediali/errori e le risposte finali di avanzamento non creano messaggi di bozza
  usa e getta; solo le risposte finali testuali/a blocchi che possono modificare l'anteprima pubblicano il testo
  di bozza in sospeso.

### Mattermost

- In modalità `partial`, trasmette in streaming il ragionamento e il testo parziale della risposta in un unico post
  di anteprima della bozza, che viene finalizzato sul posto quando è sicuro inviare la risposta finale.
- In modalità `progress`, trasmette in streaming il ragionamento e l'attività degli strumenti in un'unica anteprima
  di stato, che viene finalizzata sul posto quando è sicuro inviare la risposta finale.
- In modalità `block`, alterna post di testo completato e di attività degli strumenti;
  gli aggiornamenti paralleli e consecutivi degli strumenti condividono il post corrente relativo all'attività degli strumenti.
- Ripiega sull'invio di un nuovo post finale se il post di anteprima è stato eliminato o
  non è altrimenti disponibile al momento della finalizzazione.
- I payload finali con contenuti multimediali/errori annullano gli aggiornamenti dell'anteprima in sospeso prima del normale
  recapito, anziché pubblicare un post di anteprima temporaneo.

### Matrix

- Le anteprime di bozza vengono finalizzate sul posto quando il testo finale può riutilizzare l'evento
  di anteprima.
- Le risposte finali contenenti solo contenuti multimediali, errori o una destinazione di risposta non corrispondente annullano gli aggiornamenti dell'anteprima
  in sospeso prima del normale recapito; un'anteprima obsoleta già visibile viene oscurata.

## Aggiornamenti dell'anteprima sull'avanzamento degli strumenti

Lo streaming dell'anteprima può includere anche aggiornamenti sull'**avanzamento degli strumenti**: brevi righe
di stato come «ricerca sul Web», «lettura del file» o «chiamata dello strumento», che compaiono
nello stesso messaggio di anteprima durante l'esecuzione degli strumenti, prima della risposta finale.
In modalità app-server di Codex, i messaggi di preambolo/commento di Codex utilizzano lo stesso
percorso di anteprima, pertanto brevi note di avanzamento come «Sto verificando...» possono essere trasmesse in streaming nella
bozza modificabile senza diventare parte della risposta finale. In questo modo,
i turni con strumenti composti da più passaggi rimangono visivamente attivi anziché silenziosi tra la prima
anteprima del ragionamento e la risposta finale.

Gli strumenti a esecuzione prolungata possono emettere aggiornamenti di avanzamento tipizzati prima di restituire il risultato. Ad esempio,
`web_fetch` attiva un timer di cinque secondi all'avvio: se il recupero è ancora
in sospeso, l'anteprima mostra `Fetching page content...`; se il recupero termina o
viene annullato prima, non viene emessa alcuna riga di avanzamento. Il successivo risultato finale dello strumento
viene comunque recapitato normalmente al modello.

Superfici supportate:

- **Discord**, **Slack**, **Telegram** e **Matrix** trasmettono in streaming l'avanzamento degli strumenti e
  gli aggiornamenti del preambolo di Codex nella modifica dell'anteprima in tempo reale per impostazione predefinita quando lo streaming
  dell'anteprima è attivo. Microsoft Teams utilizza il proprio flusso di avanzamento nativo nelle
  chat personali.
- Telegram viene distribuito con gli aggiornamenti dell'anteprima sull'avanzamento degli strumenti abilitati a partire da
  `v2026.4.22`; mantenerli abilitati preserva tale comportamento rilasciato.
- **Mattermost** integra l'attività degli strumenti in un singolo post di anteprima nelle modalità `partial` e
  `progress`, oppure in un singolo post di attività degli strumenti tra blocchi di testo nella modalità `block`
  (vedere sopra).
- Le modifiche relative all'avanzamento degli strumenti seguono la modalità di streaming dell'anteprima attiva; vengono
  ignorate quando lo streaming dell'anteprima è `off` o quando lo streaming a blocchi ha assunto
  il controllo del messaggio. In Telegram, `streaming.mode: "off"` riguarda solo il risultato finale: anche
  le comunicazioni generiche sull'avanzamento vengono soppresse anziché recapitate come messaggi di stato
  autonomi, mentre le richieste di approvazione, i payload multimediali e gli errori seguono comunque
  il normale percorso.
- Per mantenere lo streaming dell'anteprima ma nascondere le righe sull'avanzamento degli strumenti, impostare
  `streaming.preview.toolProgress` su `false` per il canale interessato (valore predefinito
  `true`). Per mantenere visibili le righe sull'avanzamento degli strumenti nascondendo al contempo il testo dei comandi/delle esecuzioni,
  impostare `streaming.preview.commandText` su `"status"` oppure
  `streaming.progress.commandText` su `"status"`; il valore predefinito è `"raw"` per
  preservare il comportamento rilasciato. Questo criterio è condiviso dai canali di bozza/avanzamento
  che utilizzano il renderer compatto dell'avanzamento di OpenClaw, inclusi Discord, Matrix,
  Microsoft Teams, Mattermost, le anteprime di bozza di Slack e Telegram. Per disabilitare
  completamente le modifiche dell'anteprima, impostare `streaming.mode` su `off`.

## Rendering delle bozze di avanzamento

Le bozze in modalità avanzamento (`streaming.progress.*`) sono limitate e configurabili per
canale:

| Chiave                            | Valore predefinito | Comportamento                                                               |
| --------------------------------- | ------------------ | --------------------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Numero massimo di righe compatte di avanzamento mantenute sotto l'etichetta della bozza |
| `streaming.progress.maxLineChars` | `120`         | Numero massimo di caratteri per riga compatta prima del troncamento (rispetta le parole) |
| `streaming.progress.label`        | `"auto"`      | Titolo della bozza; una stringa personalizzata oppure `false` per nasconderlo |
| `streaming.progress.labels`       | pool integrato | Etichette candidate utilizzate quando `label: "auto"`                     |

### Canale di avanzamento dei commenti

Oltre all'avanzamento degli strumenti, il renderer compatto dell'avanzamento può mostrare un ulteriore canale
nella bozza:

- **`streaming.progress.commentary`** - visualizza i **commenti** del modello precedenti all'uso degli strumenti
  (una breve narrazione come «Verificherò... poi...»), alternandoli alle
  righe degli strumenti nella bozza di avanzamento. Su Discord e Telegram in modalità avanzamento,
  lo stesso preambolo fornisce il titolo dello stato anche quando questo canale facoltativo
  è disattivato; gli altri canali mantengono il comportamento di avanzamento esistente. Consultare
  [Bozze di avanzamento](/it/concepts/progress-drafts#status-headline).

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Mantenere visibili le righe di avanzamento, ma nascondere il testo grezzo dei comandi/delle esecuzioni:

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

Utilizzare la stessa struttura sotto un'altra chiave di canale con avanzamento compatto, ad esempio
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` o nelle anteprime di bozza di Slack. Per la modalità bozza di avanzamento, inserire
lo stesso criterio sotto `streaming.progress`:

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

## Contenuti correlati

- [Refactoring del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) - progettazione condivisa di anteprima, modifica, streaming e finalizzazione
- [Bozze di avanzamento](/it/concepts/progress-drafts) - messaggi visibili sui lavori in corso che vengono aggiornati durante i turni lunghi
- [Messaggi](/it/concepts/messages) - ciclo di vita e recapito dei messaggi
- [Nuovo tentativo](/it/concepts/retry) - comportamento dei nuovi tentativi in caso di errore di recapito
- [Canali](/it/channels) - supporto dello streaming per ciascun canale

---
read_when:
    - Spiegazione di come i messaggi in entrata diventano risposte
    - Chiarimenti su sessioni, modalità di accodamento o comportamento dello streaming
    - Documentazione della visibilità del ragionamento e delle implicazioni per l'utilizzo
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-07-16T14:16:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

I messaggi in entrata passano attraverso instradamento, deduplicazione/debounce, un'esecuzione dell'agente e la consegna in uscita:

```text
Messaggio in entrata
  -> instradamento/binding -> chiave di sessione
  -> deduplicazione + debounce
  -> coda (se un'esecuzione è già attiva)
  -> esecuzione dell'agente (streaming + strumenti)
  -> risposte in uscita (limiti del canale + suddivisione)
```

Principali superfici di configurazione:

- `messages.*` per prefissi, accodamento, debounce in entrata e comportamento dei gruppi.
- `agents.defaults.*` per streaming a blocchi, suddivisione e valori predefiniti delle risposte silenziose.
- Override dei canali (`channels.telegram.*`, `channels.whatsapp.*`, ecc.) per limiti e opzioni di streaming specifici per canale.

Per lo schema completo, consultare [Configurazione](/it/gateway/configuration).

## Deduplicazione in entrata

I canali possono riconsegnare lo stesso messaggio dopo una riconnessione. OpenClaw mantiene una cache in memoria indicizzata per ambito dell'agente, percorso del canale (canale + interlocutore + account + thread) e ID del messaggio, in modo che un messaggio riconsegnato non attivi una seconda esecuzione dell'agente. La voce della cache scade dopo 20 minuti o quando vengono registrate 5000 voci, a seconda di quale evento si verifichi per primo.

## Debounce in entrata

I messaggi di testo consecutivi inviati rapidamente dallo stesso mittente possono essere raggruppati in un singolo turno dell'agente tramite `messages.inbound`. Il debounce è circoscritto per canale + conversazione e utilizza il messaggio più recente per il threading e gli ID della risposta.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- Il debounce si applica ai soli messaggi di testo; contenuti multimediali e allegati vengono inoltrati immediatamente.
- I comandi di controllo (arresto/interruzione/stato, ecc.) ignorano il debounce e vengono quindi inviati immediatamente.
- Disabilitato per impostazione predefinita: `messages.inbound.debounceMs` non ha un valore predefinito integrato, quindi il debounce si attiva solo dopo averlo impostato (globalmente o per canale).
- L'abilitazione esplicita tramite `coalesceSameSenderDms` di iMessage è l'unica eccezione: trattiene tutti i messaggi di testo dei messaggi diretti provenienti dallo stesso mittente (comandi inclusi) abbastanza a lungo da consentire all'invio separato di comando+URL di Apple di arrivare come un unico turno. Le chat di gruppo vengono sempre inviate istantaneamente, indipendentemente da questa impostazione.

## Sessioni e dispositivi

Le sessioni appartengono al Gateway, non ai client.

- Le chat dirette confluiscono nella chiave della sessione principale dell'agente.
- I gruppi/canali ricevono chiavi di sessione proprie.
- L'archivio delle sessioni e le trascrizioni risiedono sull'host del Gateway.

Più dispositivi/canali possono essere associati alla stessa sessione, ma la cronologia non viene sincronizzata completamente con ogni client. Per le conversazioni lunghe, utilizzare un unico dispositivo principale per evitare contesti divergenti. L'interfaccia di controllo e la TUI mostrano sempre la trascrizione della sessione gestita dal Gateway e costituiscono quindi la fonte attendibile.

Dettagli: [Gestione delle sessioni](/it/concepts/session).

## Corpi dei prompt e contesto della cronologia

I Plugin dei canali compilano diversi campi di testo nel contesto in entrata, elencati dal più al meno preferibile:

| Campo             | Scopo                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Testo destinato al modello per il turno corrente. Se non impostato, utilizza `CommandBody` / `RawBody` / `Body`.        |
| `BodyForCommands` | Testo pulito utilizzato per l'analisi di direttive/comandi. Se non impostato, utilizza `CommandBody` / `RawBody` / `Body`. |
| `CommandBody`     | Corpo intermedio precedente; preferire `BodyForCommands`.                                                         |
| `RawBody`         | Alias deprecato di `CommandBody`.                                                                         |
| `Body`            | Corpo del prompt precedente; può includere involucri del canale e wrapper della cronologia.                                     |

Quando un canale fornisce la cronologia, la racchiude con:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le chat non dirette (gruppi/canali/stanze), al corpo del messaggio corrente viene anteposta l'etichetta del mittente, seguendo lo stile utilizzato per le voci della cronologia. La rimozione delle direttive si applica solo alla sezione del messaggio corrente, quindi la cronologia rimane intatta. I canali che racchiudono la cronologia devono impostare `BodyForCommands` (oppure i precedenti `CommandBody` / `RawBody`) sul testo originale del messaggio e mantenere `Body` come prompt combinato.

I buffer della cronologia contengono solo elementi in sospeso: includono i messaggi di gruppo che non hanno attivato un'esecuzione (ad esempio, messaggi soggetti all'obbligo di menzione) ed escludono i messaggi già presenti nella trascrizione della sessione. Durante la composizione del prompt, cronologia strutturata, risposte, inoltri e metadati del canale vengono visualizzati come blocchi di contesto del ruolo utente non attendibili.

Configurare le dimensioni della cronologia con `messages.groupChat.historyLimit` (valore predefinito globale) o con override specifici per canale, come `channels.slack.historyLimit` e `channels.telegram.accounts.<id>.historyLimit` (impostare `0` per disabilitarla).

## Metadati dei risultati degli strumenti

Il `content` del risultato dello strumento è il risultato visibile al modello; `details` contiene i metadati di runtime per la visualizzazione nell'interfaccia, la diagnostica, la consegna dei contenuti multimediali e i Plugin.

- `toolResult.details` viene rimosso prima della riproduzione da parte del provider e prima dell'input di Compaction.
- Le trascrizioni persistenti delle sessioni conservano solo `details` di dimensioni limitate; i metadati troppo grandi vengono sostituiti da un riepilogo compatto contrassegnato con `persistedDetailsTruncated: true`.
- I Plugin e gli strumenti devono inserire in `content` il testo che il modello deve leggere, non soltanto in `details`.

## Accodamento e follow-up

Quando un'esecuzione è già attiva, per impostazione predefinita i messaggi in entrata vengono indirizzati al suo interno. `messages.queue` controlla la modalità:

| Modalità              | Comportamento                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (predefinita) | Inserisce il nuovo prompt nell'esecuzione attiva.          |
| `followup`        | Esegue il messaggio al termine dell'esecuzione attiva.      |
| `collect`         | Raggruppa i messaggi compatibili in un unico turno successivo.      |
| `interrupt`       | Interrompe l'esecuzione attiva, quindi avvia il prompt più recente. |

Valori predefiniti: `messages.queue.debounceMs` è 500ms (si applica allo stesso modo ai raggruppamenti di indirizzamento, follow-up e raccolta), `messages.queue.cap` è 20 messaggi in coda e `messages.queue.drop` è `summarize` (sono disponibili anche `old` e `new`). Configurare gli override specifici per canale tramite `messages.queue.byChannel` e `messages.queue.debounceMsByChannel`.

Dettagli: [Coda dei comandi](/it/concepts/queue) e [Coda di indirizzamento](/it/concepts/queue-steering).

## Proprietà dell'esecuzione del canale

I Plugin dei canali possono preservare l'ordine, applicare il debounce all'input e gestire la contropressione del trasporto prima che un messaggio entri nella coda della sessione. Non devono imporre un timeout separato intorno al turno dell'agente. Una volta instradato un messaggio verso una sessione, il ciclo di vita della sessione, degli strumenti e del runtime governa le operazioni di lunga durata, affinché tutti i canali segnalino e gestiscano in modo coerente i turni lenti.

## Streaming, suddivisione e raggruppamento

Lo streaming a blocchi invia risposte parziali mentre il modello produce blocchi di testo; la suddivisione rispetta i limiti testuali del canale ed evita di separare il codice delimitato.

- `agents.defaults.blockStreamingDefault` (`on|off`, valore predefinito `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (raggruppamento basato sull'inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra le risposte a blocchi)
- Override dei canali: `*.streaming.block.enabled` e `*.streaming.block.coalesce` sui canali inclusi; le chiavi piatte obsolete vengono migrate da `openclaw doctor --fix`. Lo streaming a blocchi è disattivato salvo abilitazione esplicita, su ogni canale, incluso Telegram. QQ Bot costituisce l'eccezione: non dispone di chiavi `streaming.block` e trasmette le risposte a blocchi in streaming, salvo quando `channels.qqbot.streaming.mode` è `"off"`.

Dettagli: [Streaming + suddivisione](/it/concepts/streaming).

## Visibilità del ragionamento e token

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento viene comunque conteggiato nell'utilizzo dei token quando il modello lo produce.
- Telegram supporta lo streaming del ragionamento in una bozza temporanea che viene eliminata dopo la consegna finale; utilizzare `/reasoning on` per un output persistente del ragionamento.

Dettagli: [Direttive per pensiero + ragionamento](/it/tools/thinking) e [Utilizzo dei token](/it/reference/token-use).

## Prefissi, threading e risposte

- Cascata dei prefissi in uscita: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp dispone inoltre di `channels.whatsapp.messagePrefix` per un prefisso in entrata.
- Threading delle risposte tramite `replyToMode` e valori predefiniti specifici per canale.

Dettagli: [Configurazione](/it/gateway/config-agents#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso `NO_REPLY` (senza distinzione tra maiuscole e minuscole, quindi corrisponde anche `no_reply`) significa "non consegnare una risposta visibile all'utente". Quando un turno contiene anche contenuti multimediali in sospeso provenienti dagli strumenti, come audio TTS generato, OpenClaw rimuove il testo silenzioso ma consegna comunque l'allegato multimediale.

La politica del silenzio viene determinata in base al tipo di conversazione:

- Le conversazioni dirette non ricevono mai indicazioni del prompt `NO_REPLY`. Se un'esecuzione diretta restituisce accidentalmente un token silenzioso isolato, OpenClaw lo elimina anziché riscriverlo o consegnarlo.
- I gruppi/canali consentono il silenzio per impostazione predefinita. Nella modalità di risposta visibile `message_tool`, il silenzio indica che il modello non chiama `message(action=send)`.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

I valori predefiniti si trovano in `agents.defaults.silentReply`; `surfaces.<id>.silentReply` può sostituire la politica di gruppo/interna per ciascuna superficie.

OpenClaw utilizza inoltre le risposte silenziose per gli errori generici del runner interno nelle chat non dirette, in modo che gruppi/canali non visualizzino il testo standard degli errori del Gateway. Gli errori classificati con testo di ripristino destinato all'utente, come notifiche di autenticazione mancante, limite di frequenza o sovraccarico, possono comunque essere consegnati. Per impostazione predefinita, le chat dirette mostrano un testo di errore conciso; i dettagli grezzi del runner vengono mostrati solo quando `/verbose full` è abilitato.

Le risposte silenziose isolate vengono eliminate su tutte le superfici, così le sessioni principali rimangono silenziose anziché riscrivere il testo sentinella come messaggio di ripiego.

## Correlati

- [Refactoring del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) - progettazione di riferimento per l'invio e la ricezione durevoli
- [Streaming](/it/concepts/streaming) - consegna dei messaggi in tempo reale
- [Nuovo tentativo](/it/concepts/retry) - comportamento dei nuovi tentativi di consegna dei messaggi
- [Coda](/it/concepts/queue) - coda di elaborazione dei messaggi
- [Canali](/it/channels) - integrazioni con piattaforme di messaggistica

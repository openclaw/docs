---
read_when:
    - Spiegazione di come i messaggi in ingresso diventano risposte
    - Chiarimento su sessioni, modalità di accodamento o comportamento di streaming
    - Documentare la visibilità del ragionamento e le implicazioni d'uso
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-05-04T07:03:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gestisce i messaggi in ingresso tramite una pipeline di risoluzione della sessione, accodamento, streaming, esecuzione degli strumenti e visibilità del ragionamento. Questa pagina illustra il percorso dal messaggio in ingresso alla risposta.

## Flusso dei messaggi (alto livello)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Le impostazioni chiave si trovano nella configurazione:

- `messages.*` per prefissi, accodamento e comportamento dei gruppi.
- `agents.defaults.*` per impostazioni predefinite di block streaming e suddivisione in blocchi.
- Override dei canali (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e opzioni di streaming.

Consulta [Configurazione](/it/gateway/configuration) per lo schema completo.

## Deduplicazione in ingresso

I canali possono riconsegnare lo stesso messaggio dopo le riconnessioni. OpenClaw mantiene una
cache di breve durata indicizzata per canale/account/interlocutore/sessione/id messaggio, così le consegne
duplicate non attivano un'altra esecuzione dell'agente.

## Debouncing in ingresso

Messaggi rapidi e consecutivi dallo **stesso mittente** possono essere raggruppati in un singolo
turno dell'agente tramite `messages.inbound`. Il debouncing è circoscritto per canale + conversazione
e usa il messaggio più recente per il threading/gli ID della risposta.

Configurazione (impostazione predefinita globale + override per canale):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Note:

- Il debounce si applica ai messaggi **solo testo**; media/allegati vengono inviati immediatamente.
- I comandi di controllo ignorano il debouncing, quindi restano autonomi — **tranne** quando un canale aderisce esplicitamente alla coalescenza dei DM dello stesso mittente (ad es. [BlueBubbles `coalesceSameSenderDms`](/it/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), in cui i comandi DM attendono all'interno della finestra di debounce, così un payload inviato a pezzi può unirsi allo stesso turno dell'agente.

## Sessioni e dispositivi

Le sessioni sono di proprietà del Gateway, non dei client.

- Le chat dirette confluiscono nella chiave della sessione principale dell'agente.
- Gruppi/canali ottengono le proprie chiavi di sessione.
- L'archivio delle sessioni e le trascrizioni risiedono sull'host del Gateway.

Più dispositivi/canali possono mappare alla stessa sessione, ma la cronologia non viene
sincronizzata completamente su ogni client. Raccomandazione: usa un dispositivo principale per le conversazioni
lunghe per evitare contesti divergenti. La Control UI e la TUI mostrano sempre la
trascrizione della sessione supportata dal Gateway, quindi sono la fonte di verità.

Dettagli: [Gestione delle sessioni](/it/concepts/session).

## Metadati dei risultati degli strumenti

Il `content` del risultato di uno strumento è il risultato visibile al modello. I `details` del risultato di uno strumento sono
metadati di runtime per rendering dell'interfaccia, diagnostica, consegna dei media e Plugin.

OpenClaw mantiene esplicito questo confine:

- `toolResult.details` viene rimosso prima della riproduzione del provider e dell'input di Compaction.
- Le trascrizioni di sessione persistite mantengono solo `details` limitati; i metadati sovradimensionati
  vengono sostituiti con un riepilogo compatto contrassegnato da `persistedDetailsTruncated: true`.
- Plugin e strumenti dovrebbero inserire il testo che il modello deve leggere in `content`, non solo
  in `details`.

## Corpi in ingresso e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `BodyForAgent`: testo principale rivolto al modello per il messaggio corrente. I Plugin dei canali
  dovrebbero mantenerlo concentrato sul testo corrente del mittente che contiene il prompt.
- `Body`: fallback legacy del prompt. Può includere envelope del canale e
  wrapper opzionali della cronologia, ma i canali attuali non dovrebbero fare affidamento su di esso come
  input principale del modello quando `BodyForAgent` è disponibile.
- `CommandBody`: testo utente grezzo per il parsing di direttive/comandi.
- `RawBody`: alias legacy di `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce la cronologia, usa un wrapper condiviso:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le **chat non dirette** (gruppi/canali/stanze), il **corpo del messaggio corrente** viene prefissato con
l'etichetta del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti i messaggi
in tempo reale e quelli accodati/della cronologia nel prompt dell'agente.

I buffer della cronologia sono **solo pending**: includono messaggi di gruppo che _non_
hanno attivato un'esecuzione (ad esempio, messaggi filtrati da menzione) ed **escludono** i messaggi
già presenti nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione **messaggio corrente**, così la cronologia
rimane intatta. I canali che avvolgono la cronologia dovrebbero impostare `CommandBody` (o
`RawBody`) sul testo originale del messaggio e mantenere `Body` come prompt combinato.
Cronologia strutturata, risposte, messaggi inoltrati e metadati del canale sono renderizzati come
blocchi di contesto non attendibile con ruolo utente durante l'assemblaggio del prompt.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (impostazione predefinita
globale) e override per canale come `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e follow-up

Se un'esecuzione è già attiva, i messaggi in ingresso possono essere accodati, indirizzati
nell'esecuzione corrente o raccolti per un turno di follow-up.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- La modalità predefinita è `steer`, con un debounce di follow-up di 500 ms quando lo steering ricade
  sulla consegna di follow-up accodata.
- Modalità: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` e la modalità
  legacy uno-alla-volta `queue`.

Dettagli: [Coda dei comandi](/it/concepts/queue) e [Coda di steering](/it/concepts/queue-steering).

## Proprietà dell'esecuzione del canale

I Plugin dei canali possono preservare l'ordinamento, applicare il debounce all'input e applicare backpressure
di trasporto prima che un messaggio entri nella coda della sessione. Non dovrebbero imporre un
timeout separato attorno al turno dell'agente stesso. Una volta che un messaggio viene instradato a una
sessione, il lavoro di lunga durata è governato dal ciclo di vita della sessione, dello strumento e del runtime,
così tutti i canali segnalano e recuperano dai turni lenti in modo coerente.

## Streaming, suddivisione in blocchi e batching

Il block streaming invia risposte parziali mentre il modello produce blocchi di testo.
La suddivisione in blocchi rispetta i limiti di testo del canale ed evita di dividere codice recintato.

Impostazioni chiave:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato sull'inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra risposte a blocchi)
- Override dei canali: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + suddivisione in blocchi](/it/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può esporre o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento conta comunque nell'uso dei token quando viene prodotto dal modello.
- Telegram supporta lo streaming del ragionamento in una bozza transitoria che viene eliminata dopo la consegna finale; usa `/reasoning on` per un output di ragionamento persistente.

Dettagli: [Direttive di pensiero + ragionamento](/it/tools/thinking) e [Uso dei token](/it/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata dei prefissi in uscita), più `channels.whatsapp.messagePrefix` (prefisso in ingresso di WhatsApp)
- Threading delle risposte tramite `replyToMode` e impostazioni predefinite per canale

Dettagli: [Configurazione](/it/gateway/config-agents#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa “non consegnare una risposta visibile all'utente”.
Quando un turno ha anche media degli strumenti in sospeso, come audio TTS generato, OpenClaw
rimuove il testo silenzioso ma consegna comunque l'allegato multimediale.
OpenClaw risolve quel comportamento in base al tipo di conversazione:

- Le conversazioni dirette non consentono il silenzio per impostazione predefinita e riscrivono una risposta
  silenziosa nuda in un breve fallback visibile.
- Gruppi/canali consentono il silenzio per impostazione predefinita.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

OpenClaw usa anche risposte silenziose per errori interni del runner che avvengono
prima di qualsiasi risposta dell'assistente nelle chat non dirette, così gruppi/canali non vedono
testi standard di errore del Gateway. Le chat dirette mostrano una copia compatta dell'errore per impostazione predefinita;
i dettagli grezzi del runner vengono mostrati solo quando `/verbose` è `on` o `full`.

Le impostazioni predefinite si trovano sotto `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` possono sovrascriverle per superficie.

Quando la sessione padre ha una o più esecuzioni di sottoagenti generati in sospeso, le risposte
silenziose nude vengono eliminate su tutte le superfici invece di essere riscritte, così il
padre resta silenzioso finché l'evento di completamento del figlio consegna la vera risposta.

## Correlati

- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Riprova](/it/concepts/retry) — comportamento di ritentativo della consegna dei messaggi
- [Coda](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Canali](/it/channels) — integrazioni con piattaforme di messaggistica

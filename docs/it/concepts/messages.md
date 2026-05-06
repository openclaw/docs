---
read_when:
    - Spiegazione di come i messaggi in ingresso diventano risposte
    - Chiarire le sessioni, le modalità di accodamento o il comportamento dello streaming
    - Documentazione della visibilità del ragionamento e delle implicazioni d'uso
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-05-06T08:46:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gestisce i messaggi in ingresso attraverso una pipeline di risoluzione della sessione, accodamento, streaming, esecuzione degli strumenti e visibilità del ragionamento. Questa pagina mappa il percorso dal messaggio in ingresso alla risposta.

## Flusso dei messaggi (alto livello)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Le impostazioni principali si trovano nella configurazione:

- `messages.*` per prefissi, accodamento e comportamento dei gruppi.
- `agents.defaults.*` per impostazioni predefinite di block streaming e suddivisione in blocchi.
- Override dei canali (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e toggle dello streaming.

Consulta [Configurazione](/it/gateway/configuration) per lo schema completo.

## Deduplicazione in ingresso

I canali possono riconsegnare lo stesso messaggio dopo una riconnessione. OpenClaw mantiene una cache di breve durata indicizzata per canale/account/peer/sessione/id messaggio, così le consegne duplicate non attivano un'altra esecuzione dell'agente.

## Debouncing in ingresso

Messaggi consecutivi rapidi dallo **stesso mittente** possono essere raggruppati in un unico turno dell'agente tramite `messages.inbound`. Il debouncing è limitato per canale + conversazione e usa il messaggio più recente per threading/ID della risposta.

Configurazione (predefinita globale + override per canale):

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
- I comandi di controllo bypassano il debouncing così restano autonomi — **tranne** quando un canale abilita esplicitamente la coalescenza dei DM dello stesso mittente (ad esempio [BlueBubbles `coalesceSameSenderDms`](/it/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), dove i comandi DM attendono dentro la finestra di debounce così un payload inviato in parti può unirsi allo stesso turno dell'agente.

## Sessioni e dispositivi

Le sessioni sono possedute dal Gateway, non dai client.

- Le chat dirette confluiscono nella chiave della sessione principale dell'agente.
- Gruppi/canali ottengono le proprie chiavi di sessione.
- Lo store delle sessioni e le trascrizioni risiedono sull'host del Gateway.

Più dispositivi/canali possono mappare alla stessa sessione, ma la cronologia non viene sincronizzata completamente verso ogni client. Raccomandazione: usa un dispositivo principale per conversazioni lunghe, per evitare contesto divergente. La Control UI e la TUI mostrano sempre la trascrizione della sessione supportata dal Gateway, quindi sono la fonte di verità.

Dettagli: [Gestione delle sessioni](/it/concepts/session).

## Metadati dei risultati degli strumenti

Il `content` del risultato dello strumento è il risultato visibile al modello. I `details` del risultato dello strumento sono metadati di runtime per rendering dell'interfaccia, diagnostica, consegna dei media e Plugin.

OpenClaw mantiene esplicito questo confine:

- `toolResult.details` viene rimosso prima del replay del provider e dell'input di Compaction.
- Le trascrizioni di sessione persistite mantengono solo `details` limitati; i metadati sovradimensionati vengono sostituiti con un riepilogo compatto marcato `persistedDetailsTruncated: true`.
- Plugin e strumenti dovrebbero inserire in `content` il testo che il modello deve leggere, non solo in `details`.

## Corpi in ingresso e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `BodyForAgent`: testo principale rivolto al modello per il messaggio corrente. I Plugin di canale dovrebbero mantenerlo focalizzato sul testo attuale del mittente che contiene il prompt.
- `Body`: fallback del prompt legacy. Può includere envelope del canale e wrapper opzionali della cronologia, ma i canali attuali non dovrebbero usarlo come input principale del modello quando `BodyForAgent` è disponibile.
- `CommandBody`: testo utente grezzo per il parsing di direttive/comandi.
- `RawBody`: alias legacy di `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce cronologia, usa un wrapper condiviso:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le **chat non dirette** (gruppi/canali/stanze), il **corpo del messaggio corrente** è prefissato con l'etichetta del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti nel prompt dell'agente i messaggi in tempo reale e quelli accodati/di cronologia.

I buffer della cronologia sono **solo pendenti**: includono i messaggi di gruppo che _non_ hanno attivato un'esecuzione (ad esempio messaggi filtrati da menzione) ed **escludono** i messaggi già nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione del **messaggio corrente**, così la cronologia resta intatta. I canali che racchiudono la cronologia dovrebbero impostare `CommandBody` (o `RawBody`) sul testo originale del messaggio e mantenere `Body` come prompt combinato. Cronologia strutturata, risposte, inoltri e metadati del canale sono resi come blocchi di contesto non attendibile con ruolo utente durante l'assemblaggio del prompt.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (predefinito globale) e override per canale come `channels.slack.historyLimit` o `channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e follow-up

Se un'esecuzione è già attiva, i messaggi in ingresso possono essere accodati, indirizzati nell'esecuzione corrente o raccolti per un turno di follow-up.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- La modalità predefinita è `steer`, con un debounce di follow-up di 500 ms quando lo steering ripiega sulla consegna di follow-up accodata.
- Modalità: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` e la modalità legacy uno-alla-volta `queue`.

Dettagli: [Coda dei comandi](/it/concepts/queue) e [Coda di steering](/it/concepts/queue-steering).

## Proprietà dell'esecuzione del canale

I Plugin di canale possono preservare l'ordine, applicare debounce all'input e applicare backpressure di trasporto prima che un messaggio entri nella coda della sessione. Non dovrebbero imporre un timeout separato attorno al turno dell'agente stesso. Una volta che un messaggio è instradato a una sessione, il lavoro di lunga durata è governato dal ciclo di vita di sessione, strumenti e runtime, così tutti i canali riportano e recuperano dai turni lenti in modo coerente.

## Streaming, suddivisione in blocchi e batching

Il block streaming invia risposte parziali mentre il modello produce blocchi di testo.
La suddivisione in blocchi rispetta i limiti di testo del canale ed evita di dividere blocchi di codice recintati.

Impostazioni chiave:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato su inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra risposte a blocchi)
- Override dei canali: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + suddivisione in blocchi](/it/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può esporre o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento conta comunque nell'uso dei token quando prodotto dal modello.
- Telegram supporta lo stream del ragionamento in una bolla bozza temporanea che viene eliminata dopo la consegna finale; usa `/reasoning on` per un output di ragionamento persistente.

Dettagli: [Direttive di pensiero + ragionamento](/it/tools/thinking) e [Uso dei token](/it/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata dei prefissi in uscita), più `channels.whatsapp.messagePrefix` (prefisso in ingresso WhatsApp)
- Threading delle risposte tramite `replyToMode` e impostazioni predefinite per canale

Dettagli: [Configurazione](/it/gateway/config-agents#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa "non consegnare una risposta visibile all'utente".
Quando un turno ha anche media di strumenti pendenti, come audio TTS generato, OpenClaw rimuove il testo silenzioso ma consegna comunque l'allegato multimediale.
OpenClaw risolve quel comportamento in base al tipo di conversazione:

- Le conversazioni dirette disabilitano il silenzio per impostazione predefinita e riscrivono una risposta silenziosa nuda in un breve fallback visibile.
- Gruppi/canali consentono il silenzio per impostazione predefinita.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

OpenClaw usa anche risposte silenziose per errori interni del runner che avvengono prima di qualsiasi risposta dell'assistente nelle chat non dirette, così gruppi/canali non vedono testo generico di errore del Gateway. Le chat dirette mostrano per impostazione predefinita una copia di errore compatta; i dettagli grezzi del runner sono mostrati solo quando `/verbose` è `on` o `full`.

Le impostazioni predefinite risiedono sotto `agents.defaults.silentReply` e `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e `surfaces.<id>.silentReplyRewrite` possono sovrascriverle per superficie.

Quando la sessione padre ha una o più esecuzioni di subagenti generati pendenti, le risposte silenziose nude vengono eliminate su tutte le superfici invece di essere riscritte, così il padre resta silenzioso finché l'evento di completamento del figlio consegna la risposta reale.

## Correlati

- [Refactor del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) - design target durevole di invio e ricezione
- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Retry](/it/concepts/retry) — comportamento di retry della consegna dei messaggi
- [Coda](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Canali](/it/channels) — integrazioni con piattaforme di messaggistica

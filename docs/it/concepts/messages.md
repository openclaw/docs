---
read_when:
    - Spiegazione di come i messaggi in ingresso diventano risposte
    - Chiarire sessioni, modalità di accodamento o comportamento di streaming
    - Documentare la visibilità del ragionamento e le implicazioni d’uso
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-06-27T17:25:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gestisce i messaggi in ingresso tramite una pipeline di risoluzione della sessione, accodamento, streaming, esecuzione degli strumenti e visibilità del ragionamento. Questa pagina mappa il percorso dal messaggio in ingresso alla risposta.

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
- `agents.defaults.*` per le impostazioni predefinite di streaming a blocchi e suddivisione in chunk.
- Override dei canali (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e toggle di streaming.

Vedi [Configurazione](/it/gateway/configuration) per lo schema completo.

## Deduplicazione in ingresso

I canali possono riconsegnare lo stesso messaggio dopo le riconnessioni. OpenClaw mantiene una
cache di breve durata con chiave per canale/account/peer/sessione/id messaggio, così le consegne
duplicate non avviano un'altra esecuzione dell'agente.

## Debouncing in ingresso

Messaggi consecutivi rapidi dallo **stesso mittente** possono essere raggruppati in un singolo
turno dell'agente tramite `messages.inbound`. Il debouncing ha ambito per canale + conversazione
e usa il messaggio più recente per threading/ID della risposta.

Configurazione (predefinito globale + override per canale):

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

- Il debounce si applica ai messaggi **solo testo**; media/allegati svuotano subito il buffer.
- I comandi di controllo aggirano il debouncing, così restano autonomi. I canali che aderiscono esplicitamente alla coalescenza DM dello stesso mittente possono mantenere i comandi DM dentro la finestra di debounce, così un payload inviato a pezzi può unirsi allo stesso turno dell'agente.

## Sessioni e dispositivi

Le sessioni sono di proprietà del Gateway, non dei client.

- Le chat dirette confluiscono nella chiave di sessione principale dell'agente.
- Gruppi/canali ottengono chiavi di sessione proprie.
- Lo store delle sessioni e le trascrizioni vivono sull'host del Gateway.

Più dispositivi/canali possono mappare alla stessa sessione, ma la cronologia non viene
sincronizzata completamente verso ogni client. Raccomandazione: usa un dispositivo primario per le
conversazioni lunghe, per evitare contesti divergenti. La Control UI e la TUI mostrano sempre la
trascrizione della sessione supportata dal Gateway, quindi sono la fonte autorevole.

Dettagli: [Gestione delle sessioni](/it/concepts/session).

## Metadati dei risultati degli strumenti

Il `content` del risultato di uno strumento è il risultato visibile al modello. I `details` del risultato di uno strumento sono
metadati runtime per rendering UI, diagnostica, consegna di media e Plugin.

OpenClaw mantiene esplicito questo confine:

- `toolResult.details` viene rimosso prima del replay del provider e dell'input di Compaction.
- Le trascrizioni di sessione persistite mantengono solo `details` limitati; i metadati sovradimensionati
  vengono sostituiti con un riepilogo compatto marcato `persistedDetailsTruncated: true`.
- Plugin e strumenti devono mettere il testo che il modello deve leggere in `content`, non solo
  in `details`.

## Corpi in ingresso e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `BodyForAgent`: testo primario rivolto al modello per il messaggio corrente. I Plugin di canale
  devono mantenerlo focalizzato sul testo corrente del mittente che contiene il prompt.
- `Body`: fallback legacy del prompt. Può includere envelope del canale e
  wrapper opzionali della cronologia, ma i canali correnti non devono affidarsi a questo come
  input primario del modello quando `BodyForAgent` è disponibile.
- `CommandBody`: testo utente grezzo per il parsing di direttive/comandi.
- `RawBody`: alias legacy per `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce cronologia, usa un wrapper condiviso:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le **chat non dirette** (gruppi/canali/stanze), il **corpo del messaggio corrente** è prefissato con
l'etichetta del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti
i messaggi in tempo reale e quelli accodati/di cronologia nel prompt dell'agente.

I buffer della cronologia sono **solo pendenti**: includono messaggi di gruppo che _non_
hanno attivato un'esecuzione (per esempio, messaggi filtrati da mention) ed **escludono** i messaggi
già nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione del **messaggio corrente**, così la cronologia
resta intatta. I canali che avvolgono la cronologia devono impostare `CommandBody` (o
`RawBody`) sul testo originale del messaggio e mantenere `Body` come prompt combinato.
Cronologia strutturata, risposte, messaggi inoltrati e metadati di canale vengono renderizzati come
blocchi di contesto non attendibili con ruolo utente durante l'assemblaggio del prompt.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (predefinito
globale) e override per canale come `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e follow-up

Se un'esecuzione è già attiva, i messaggi in ingresso vengono indirizzati nell'esecuzione corrente per
impostazione predefinita. `messages.queue` seleziona se i messaggi durante un'esecuzione attiva devono indirizzare, accodarsi per
dopo, raccogliersi in un turno successivo unico oppure interrompere l'esecuzione attiva.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- La modalità predefinita è `steer`, con un debounce di 500 ms per batch di indirizzamento Codex e
  code follow-up/collect.
- Modalità: `steer`, `followup`, `collect` e `interrupt`.

Dettagli: [Coda dei comandi](/it/concepts/queue) e [Coda di indirizzamento](/it/concepts/queue-steering).

## Proprietà dell'esecuzione del canale

I Plugin di canale possono preservare l'ordinamento, applicare debounce all'input e applicare backpressure del trasporto
prima che un messaggio entri nella coda della sessione. Non devono imporre un
timeout separato intorno al turno dell'agente stesso. Una volta instradato un messaggio a una
sessione, il lavoro a lunga esecuzione è governato dal ciclo di vita della sessione, dello strumento e del runtime,
così tutti i canali segnalano e recuperano dai turni lenti in modo coerente.

## Streaming, suddivisione in chunk e batching

Lo streaming a blocchi invia risposte parziali mentre il modello produce blocchi di testo.
La suddivisione in chunk rispetta i limiti di testo del canale ed evita di spezzare codice fenced.

Impostazioni principali:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato su inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra risposte a blocchi)
- Override dei canali: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + suddivisione in chunk](/it/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può esporre o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto di ragionamento conta comunque nell'uso dei token quando viene prodotto dal modello.
- Telegram supporta lo streaming del ragionamento in una bolla di bozza transitoria che viene eliminata dopo la consegna finale; usa `/reasoning on` per output di ragionamento persistente.

Dettagli: [Direttive di pensiero + ragionamento](/it/tools/thinking) e [Uso dei token](/it/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata dei prefissi in uscita), più `channels.whatsapp.messagePrefix` (prefisso in ingresso WhatsApp)
- Threading delle risposte tramite `replyToMode` e predefiniti per canale

Dettagli: [Configurazione](/it/gateway/config-agents#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa "non consegnare una risposta visibile all'utente".
Quando un turno ha anche media di strumenti in sospeso, come audio TTS generato, OpenClaw
rimuove il testo silenzioso ma consegna comunque l'allegato media.
OpenClaw risolve quel comportamento in base al tipo di conversazione:

- Le conversazioni dirette non ricevono mai istruzioni di prompt `NO_REPLY`. Se un'esecuzione
  diretta restituisce accidentalmente un token silenzioso nudo, OpenClaw lo sopprime invece
  di riscriverlo o consegnarlo.
- Gruppi/canali consentono il silenzio per impostazione predefinita solo per risposte automatiche di gruppo.
  In modalità di risposta visibile `message_tool`, silenzio significa che il modello non chiama
  `message(action=send)`.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

OpenClaw usa anche risposte silenziose per errori generici interni del runner nelle
chat non dirette, così gruppi/canali non vedono testo boilerplate di errore del Gateway.
Gli errori classificati con testo di recupero rivolto all'utente, come autenticazione mancante,
rate limit o avvisi di sovraccarico, possono comunque essere consegnati. Le chat dirette mostrano
testo di errore compatto per impostazione predefinita; i dettagli grezzi del runner vengono mostrati solo quando
`/verbose full` è abilitato.

I predefiniti vivono sotto `agents.defaults.silentReply`; `surfaces.<id>.silentReply`
può sovrascrivere la policy di gruppo/interna per superficie.

Le risposte silenziose nude vengono scartate su tutte le superfici, così le sessioni padre restano silenziose
invece di riscrivere testo sentinella in chiacchiericcio di fallback.

## Correlati

- [Refactor del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) - design target durevole per invio e ricezione
- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Retry](/it/concepts/retry) — comportamento di nuovo tentativo della consegna dei messaggi
- [Coda](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Canali](/it/channels) — integrazioni con piattaforme di messaggistica

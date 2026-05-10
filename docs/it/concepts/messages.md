---
read_when:
    - Spiegazione di come i messaggi in ingresso diventano risposte
    - Chiarimento di sessioni, modalità di accodamento o comportamento dello streaming
    - Documentare la visibilità del ragionamento e le implicazioni d'uso
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-05-10T19:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gestisce i messaggi in ingresso tramite una pipeline di risoluzione della sessione, accodamento, streaming, esecuzione degli strumenti e visibilità del ragionamento. Questa pagina mappa il percorso dal messaggio in ingresso alla risposta.

## Flusso dei messaggi (alto livello)

```
Messaggio in ingresso
  -> routing/bindings -> chiave di sessione
  -> coda (se un'esecuzione è attiva)
  -> esecuzione dell'agente (streaming + strumenti)
  -> risposte in uscita (limiti del canale + suddivisione in chunk)
```

Le opzioni principali sono nella configurazione:

- `messages.*` per prefissi, accodamento e comportamento dei gruppi.
- `agents.defaults.*` per valori predefiniti di streaming a blocchi e suddivisione in chunk.
- Override dei canali (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e opzioni di streaming.

Vedi [Configurazione](/it/gateway/configuration) per lo schema completo.

## Deduplicazione in ingresso

I canali possono riconsegnare lo stesso messaggio dopo le riconnessioni. OpenClaw mantiene una
cache di breve durata indicizzata per canale/account/peer/sessione/id messaggio, in modo che le consegne
duplicate non attivino un'altra esecuzione dell'agente.

## Debouncing in ingresso

Messaggi rapidi consecutivi dallo **stesso mittente** possono essere raggruppati in un singolo
turno dell'agente tramite `messages.inbound`. Il debouncing è limitato per canale + conversazione
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

- Il debounce si applica ai messaggi **solo testo**; media/allegati vengono scaricati immediatamente.
- I comandi di controllo bypassano il debouncing, così rimangono autonomi. I canali che scelgono esplicitamente di aggregare i DM dello stesso mittente possono mantenere i comandi DM dentro la finestra di debounce, in modo che un payload inviato in più parti possa unirsi allo stesso turno dell'agente.

## Sessioni e dispositivi

Le sessioni sono di proprietà del Gateway, non dei client.

- Le chat dirette convergono nella chiave di sessione principale dell'agente.
- Gruppi/canali ottengono le proprie chiavi di sessione.
- L'archivio delle sessioni e le trascrizioni risiedono sull'host del Gateway.

Più dispositivi/canali possono mappare alla stessa sessione, ma la cronologia non viene
sincronizzata completamente su ogni client. Raccomandazione: usa un dispositivo principale per le conversazioni
lunghe, per evitare contesti divergenti. La Control UI e la TUI mostrano sempre la
trascrizione della sessione supportata dal Gateway, quindi sono la fonte di verità.

Dettagli: [Gestione delle sessioni](/it/concepts/session).

## Metadati dei risultati degli strumenti

`content` del risultato dello strumento è il risultato visibile al modello. `details` del risultato dello strumento è
metadato di runtime per rendering dell'interfaccia, diagnostica, consegna dei media e Plugin.

OpenClaw mantiene esplicito questo confine:

- `toolResult.details` viene rimosso prima della riproduzione del provider e dell'input di Compaction.
- Le trascrizioni persistite delle sessioni conservano solo `details` limitati; i metadati sovradimensionati
  vengono sostituiti con un riepilogo compatto marcato `persistedDetailsTruncated: true`.
- Plugin e strumenti dovrebbero inserire il testo che il modello deve leggere in `content`, non solo
  in `details`.

## Corpi in ingresso e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `BodyForAgent`: testo principale rivolto al modello per il messaggio corrente. I Plugin dei canali
  dovrebbero mantenerlo focalizzato sul testo corrente del mittente che contiene il prompt.
- `Body`: fallback legacy del prompt. Può includere involucri del canale e
  wrapper opzionali della cronologia, ma i canali correnti non dovrebbero fare affidamento su di esso come
  input principale del modello quando `BodyForAgent` è disponibile.
- `CommandBody`: testo utente grezzo per parsing di direttive/comandi.
- `RawBody`: alias legacy di `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce la cronologia, usa un wrapper condiviso:

- `[Messaggi della chat dalla tua ultima risposta - per contesto]`
- `[Messaggio corrente - rispondi a questo]`

Per le **chat non dirette** (gruppi/canali/stanze), il **corpo del messaggio corrente** è prefissato con
l'etichetta del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti nel prompt dell'agente
i messaggi in tempo reale e quelli accodati/di cronologia.

I buffer della cronologia sono **solo in sospeso**: includono i messaggi di gruppo che _non_
hanno attivato un'esecuzione (per esempio, messaggi filtrati da menzione) ed **escludono** i messaggi
già nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione del **messaggio corrente**, quindi la cronologia
rimane intatta. I canali che avvolgono la cronologia dovrebbero impostare `CommandBody` (o
`RawBody`) sul testo originale del messaggio e mantenere `Body` come prompt combinato.
Cronologia strutturata, risposta, inoltro e metadati del canale vengono renderizzati come
blocchi di contesto non attendibili con ruolo utente durante l'assemblaggio del prompt.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (predefinito
globale) e override per canale come `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e follow-up

Se un'esecuzione è già attiva, i messaggi in ingresso possono essere accodati, indirizzati
nell'esecuzione corrente o raccolti per un turno di follow-up.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- La modalità predefinita è `steer`, con un debounce di follow-up di 500 ms quando l'indirizzamento ricade
  sulla consegna di follow-up accodata.
- Modalità: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` e la modalità legacy
  uno alla volta `queue`.

Dettagli: [Coda dei comandi](/it/concepts/queue) e [Coda di indirizzamento](/it/concepts/queue-steering).

## Proprietà dell'esecuzione del canale

I Plugin dei canali possono preservare l'ordinamento, applicare debounce all'input e applicare backpressure
di trasporto prima che un messaggio entri nella coda della sessione. Non dovrebbero imporre un
timeout separato attorno al turno dell'agente stesso. Una volta che un messaggio viene instradato a una
sessione, il lavoro di lunga durata è governato dal ciclo di vita della sessione, degli strumenti e del runtime,
così tutti i canali segnalano e recuperano dai turni lenti in modo coerente.

## Streaming, suddivisione in chunk e batching

Lo streaming a blocchi invia risposte parziali mentre il modello produce blocchi di testo.
La suddivisione in chunk rispetta i limiti di testo dei canali ed evita di spezzare blocchi di codice recintati.

Impostazioni principali:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato sull'inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra risposte a blocchi)
- Override dei canali: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + suddivisione in chunk](/it/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può esporre o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento conta comunque nell'uso dei token quando viene prodotto dal modello.
- Telegram supporta lo stream del ragionamento in una bolla bozza transitoria che viene eliminata dopo la consegna finale; usa `/reasoning on` per un output di ragionamento persistente.

Dettagli: [Direttive di pensiero + ragionamento](/it/tools/thinking) e [Uso dei token](/it/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata dei prefissi in uscita), più `channels.whatsapp.messagePrefix` (prefisso in ingresso WhatsApp)
- Threading delle risposte tramite `replyToMode` e valori predefiniti per canale

Dettagli: [Configurazione](/it/gateway/config-agents#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa "non consegnare una risposta visibile all'utente".
Quando un turno ha anche media di strumenti in sospeso, come audio TTS generato, OpenClaw
rimuove il testo silenzioso ma consegna comunque l'allegato multimediale.
OpenClaw risolve quel comportamento per tipo di conversazione:

- Le conversazioni dirette non consentono il silenzio per impostazione predefinita e riscrivono una risposta
  silenziosa isolata in un breve fallback visibile.
- Gruppi/canali consentono il silenzio per impostazione predefinita.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

OpenClaw usa anche risposte silenziose per errori interni del runner che avvengono
prima di qualsiasi risposta dell'assistente nelle chat non dirette, così gruppi/canali non vedono
testi standard di errore del Gateway. Le chat dirette mostrano per impostazione predefinita un testo di errore compatto;
i dettagli grezzi del runner vengono mostrati solo quando `/verbose` è `on` o `full`.

I valori predefiniti risiedono sotto `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` possono sovrascriverli per superficie.

Quando la sessione padre ha una o più esecuzioni di subagenti generati in sospeso, le risposte
silenziose isolate vengono scartate su tutte le superfici invece di essere riscritte, così il
padre rimane silenzioso finché l'evento di completamento del figlio consegna la risposta reale.

## Correlati

- [Refactoring del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) - progettazione target di invio e ricezione durevoli
- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Riprova](/it/concepts/retry) — comportamento di riprova della consegna dei messaggi
- [Coda](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Canali](/it/channels) — integrazioni con piattaforme di messaggistica

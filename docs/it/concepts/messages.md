---
read_when:
    - Spiegazione di come i messaggi in entrata diventano risposte
    - Chiarimento di sessioni, modalità di accodamento o comportamento dello streaming
    - Documentazione sulla visibilità del ragionamento e sulle implicazioni d'uso
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-04-25T18:18:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e085e778b10f9fbf3ccc8fb2939667b3c2b2bc88f5dc0be6c5c4fc1fc96e9d0
    source_path: concepts/messages.md
    workflow: 15
---

Questa pagina riunisce il modo in cui OpenClaw gestisce i messaggi in entrata, le sessioni, l'accodamento,
lo streaming e la visibilità del ragionamento.

## Flusso dei messaggi (panoramica generale)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

I controlli principali si trovano nella configurazione:

- `messages.*` per prefissi, accodamento e comportamento dei gruppi.
- `agents.defaults.*` per i valori predefiniti di block streaming e chunking.
- Override per canale (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e opzioni di streaming.

Vedi [Configuration](/it/gateway/configuration) per lo schema completo.

## Deduplicazione in entrata

I canali possono riconsegnare lo stesso messaggio dopo una riconnessione. OpenClaw mantiene una
cache a breve durata indicizzata per canale/account/peer/session/message id, così le consegne duplicate
non attivano un'altra esecuzione dell'agente.

## Debouncing in entrata

Messaggi rapidi e consecutivi dallo **stesso mittente** possono essere raggruppati in un singolo
turno dell'agente tramite `messages.inbound`. Il debouncing è applicato per canale + conversazione
e usa il messaggio più recente per il threading della risposta/gli ID.

Configurazione (valore predefinito globale + override per canale):

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

- Il debounce si applica ai messaggi **solo testo**; file multimediali/allegati vengono inviati immediatamente.
- I comandi di controllo aggirano il debouncing, così restano autonomi — **tranne** quando un canale aderisce esplicitamente al coalescing dei DM dello stesso mittente (ad esempio [BlueBubbles `coalesceSameSenderDms`](/it/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), dove i comandi nei DM attendono all'interno della finestra di debounce affinché un payload split-send possa unirsi allo stesso turno dell'agente.

## Sessioni e dispositivi

Le sessioni appartengono al Gateway, non ai client.

- Le chat dirette confluiscono nella chiave di sessione principale dell'agente.
- Gruppi/canali ottengono ciascuno la propria chiave di sessione.
- L'archivio delle sessioni e le trascrizioni risiedono sull'host del Gateway.

Più dispositivi/canali possono mappare sulla stessa sessione, ma la cronologia non viene
sincronizzata completamente su ogni client. Raccomandazione: usa un dispositivo principale per le conversazioni
lunghe per evitare contesti divergenti. La UI di controllo e la TUI mostrano sempre la
trascrizione della sessione supportata dal Gateway, quindi sono la fonte di verità.

Dettagli: [Session management](/it/concepts/session).

## Corpi in entrata e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `Body`: testo del prompt inviato all'agente. Può includere envelope del canale e
  wrapper della cronologia facoltativi.
- `CommandBody`: testo utente grezzo per il parsing di direttive/comandi.
- `RawBody`: alias legacy di `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce la cronologia, usa un wrapper condiviso:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le **chat non dirette** (gruppi/canali/stanze), il **corpo del messaggio corrente** è preceduto
dall'etichetta del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti
i messaggi in tempo reale e i messaggi accodati/di cronologia nel prompt dell'agente.

I buffer della cronologia sono **solo pending**: includono i messaggi di gruppo che _non_
hanno attivato un'esecuzione (per esempio, messaggi soggetti a gating per menzione) ed **escludono** i messaggi
già presenti nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione del **messaggio corrente**, così la cronologia
rimane intatta. I canali che racchiudono la cronologia dovrebbero impostare `CommandBody` (o
`RawBody`) sul testo originale del messaggio e mantenere `Body` come prompt combinato.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (valore
predefinito globale) e override per canale come `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e follow-up

Se un'esecuzione è già attiva, i messaggi in entrata possono essere accodati, indirizzati verso
l'esecuzione corrente oppure raccolti per un turno di follow-up.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- Modalità: `interrupt`, `steer`, `followup`, `collect`, più varianti di backlog.

Dettagli: [Queueing](/it/concepts/queue).

## Streaming, chunking e batching

Il block streaming invia risposte parziali mentre il modello produce blocchi di testo.
Il chunking rispetta i limiti di testo del canale ed evita di spezzare codice fenced.

Impostazioni principali:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato sull'inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra risposte a blocchi)
- Override per canale: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + chunking](/it/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può esporre o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento conta comunque nel consumo di token quando viene prodotto dal modello.
- Telegram supporta lo stream del ragionamento nella bozza.

Dettagli: [Thinking + reasoning directives](/it/tools/thinking) e [Token use](/it/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata dei prefissi in uscita), più `channels.whatsapp.messagePrefix` (prefisso in entrata di WhatsApp)
- Reply threading tramite `replyToMode` e valori predefiniti per canale

Dettagli: [Configuration](/it/gateway/config-agents#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa “non inviare una risposta visibile all'utente”.
Quando un turno ha anche elementi multimediali di strumenti in attesa, come audio TTS generato, OpenClaw
rimuove il testo silenzioso ma continua comunque a consegnare l'allegato multimediale.
OpenClaw determina questo comportamento in base al tipo di conversazione:

- Le conversazioni dirette non consentono il silenzio per impostazione predefinita e riscrivono una risposta
  solo silenziosa in un breve fallback visibile.
- I gruppi/canali consentono il silenzio per impostazione predefinita.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

I valori predefiniti si trovano sotto `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` possono sostituirli per singola surface.

Quando la sessione padre ha una o più esecuzioni di subagent generate in attesa, le
risposte solo silenziose vengono eliminate su tutte le surface invece di essere riscritte, così la
sessione padre resta silenziosa finché l'evento di completamento del figlio non consegna la risposta reale.

## Correlati

- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Retry](/it/concepts/retry) — comportamento di ritentativo nella consegna dei messaggi
- [Queue](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Channels](/it/channels) — integrazioni con piattaforme di messaggistica

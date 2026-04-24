---
read_when:
    - Spiegare come i messaggi in ingresso diventano risposte
    - Chiarire sessioni, modalità di accodamento o comportamento dello streaming
    - Documentare la visibilità del ragionamento e le implicazioni sull’utilizzo
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-04-24T08:37:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

Questa pagina collega tra loro il modo in cui OpenClaw gestisce messaggi in ingresso, sessioni, accodamento,
streaming e visibilità del ragionamento.

## Flusso dei messaggi (panoramica)

```
Messaggio in ingresso
  -> instradamento/bindings -> chiave di sessione
  -> coda (se un'esecuzione è attiva)
  -> esecuzione dell'agente (streaming + strumenti)
  -> risposte in uscita (limiti del canale + suddivisione in blocchi)
```

Le impostazioni principali si trovano nella configurazione:

- `messages.*` per prefissi, accodamento e comportamento dei gruppi.
- `agents.defaults.*` per i valori predefiniti di block streaming e chunking.
- Override dei canali (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e toggle dello streaming.

Vedi [Configuration](/it/gateway/configuration) per lo schema completo.

## Deduplicazione in ingresso

I canali possono riconsegnare lo stesso messaggio dopo le riconnessioni. OpenClaw mantiene una
cache di breve durata con chiave channel/account/peer/session/message id, così le consegne duplicate
non attivano un’altra esecuzione dell’agente.

## Debouncing in ingresso

Messaggi rapidi consecutivi dallo **stesso mittente** possono essere raggruppati in un singolo
turno dell’agente tramite `messages.inbound`. Il debouncing ha ambito per canale + conversazione
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

- Il debounce si applica ai messaggi **solo testo**; media/allegati vengono svuotati immediatamente.
- I comandi di controllo bypassano il debounce così restano autonomi — **tranne** quando un canale abilita esplicitamente la coalescenza DM dello stesso mittente (es. [BlueBubbles `coalesceSameSenderDms`](/it/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), dove i comandi DM aspettano dentro la finestra di debounce così un payload inviato in più parti può unirsi allo stesso turno dell’agente.

## Sessioni e dispositivi

Le sessioni appartengono al gateway, non ai client.

- Le chat dirette confluiscono nella chiave di sessione principale dell’agente.
- Gruppi/canali ottengono le proprie chiavi di sessione.
- L’archivio sessioni e le trascrizioni si trovano sull’host del gateway.

Più dispositivi/canali possono essere mappati alla stessa sessione, ma la cronologia non viene completamente
risincronizzata su ogni client. Raccomandazione: usa un dispositivo primario per le
conversazioni lunghe per evitare contesti divergenti. La Control UI e la TUI mostrano sempre la
trascrizione della sessione supportata dal gateway, quindi sono la fonte di verità.

Dettagli: [Gestione delle sessioni](/it/concepts/session).

## Body in ingresso e contesto della cronologia

OpenClaw separa il **body del prompt** dal **body del comando**:

- `Body`: testo del prompt inviato all’agente. Può includere envelope del canale e
  wrapper facoltativi della cronologia.
- `CommandBody`: testo utente grezzo per l’analisi di direttive/comandi.
- `RawBody`: alias legacy di `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce la cronologia, usa un wrapper condiviso:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le **chat non dirette** (gruppi/canali/stanze), il **body del messaggio corrente** viene prefissato con l’etichetta
del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti nel prompt dell’agente
messaggi in tempo reale e messaggi accodati/di cronologia.

I buffer della cronologia sono **solo pending**: includono messaggi di gruppo che _non_
hanno attivato un’esecuzione (per esempio, messaggi soggetti a gating per menzione) ed **escludono** i messaggi
già presenti nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione del **messaggio corrente** così la cronologia
resta intatta. I canali che incapsulano la cronologia dovrebbero impostare `CommandBody` (oppure
`RawBody`) al testo originale del messaggio e mantenere `Body` come prompt combinato.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (predefinito globale)
e override per canale come `channels.slack.historyLimit` oppure
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e followup

Se un’esecuzione è già attiva, i messaggi in ingresso possono essere accodati, instradati verso
l’esecuzione corrente o raccolti per un turno di followup.

- Configurazione tramite `messages.queue` (e `messages.queue.byChannel`).
- Modalità: `interrupt`, `steer`, `followup`, `collect`, più varianti backlog.

Dettagli: [Queueing](/it/concepts/queue).

## Streaming, chunking e batching

Il block streaming invia risposte parziali mentre il modello produce blocchi di testo.
Il chunking rispetta i limiti di testo del canale ed evita di spezzare codice racchiuso da fence.

Impostazioni principali:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato su inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra risposte a blocchi)
- Override del canale: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + chunking](/it/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può esporre o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento conta comunque nell’uso dei token quando viene prodotto dal modello.
- Telegram supporta lo streaming del ragionamento nella bolla della bozza.

Dettagli: [Direttive di pensiero + ragionamento](/it/tools/thinking) e [Uso dei token](/it/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata dei prefissi in uscita), più `channels.whatsapp.messagePrefix` (prefisso in ingresso per WhatsApp)
- Threading delle risposte tramite `replyToMode` e valori predefiniti per canale

Dettagli: [Configuration](/it/gateway/config-agents#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa “non inviare una risposta visibile all’utente”.
OpenClaw risolve questo comportamento in base al tipo di conversazione:

- Le conversazioni dirette non consentono il silenzio per impostazione predefinita e riscrivono una risposta
  silenziosa semplice in un breve fallback visibile.
- Gruppi/canali consentono il silenzio per impostazione predefinita.
- L’orchestrazione interna consente il silenzio per impostazione predefinita.

I valori predefiniti si trovano in `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` possono sostituirli per singola superficie.

Quando la sessione padre ha una o più esecuzioni di subagenti generate in sospeso, le
risposte silenziose semplici vengono scartate su tutte le superfici invece di essere riscritte, così la
sessione padre resta silenziosa finché l’evento di completamento del figlio non consegna la risposta reale.

## Correlati

- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Retry](/it/concepts/retry) — comportamento di retry nella consegna dei messaggi
- [Queue](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Channels](/it/channels) — integrazioni con piattaforme di messaggistica

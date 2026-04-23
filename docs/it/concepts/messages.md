---
read_when:
    - Spiegare come i messaggi in ingresso diventano risposte
    - Chiarire sessioni, modalità di accodamento o comportamento dello streaming
    - Documentare la visibilità del ragionamento e le implicazioni d'uso
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-04-23T08:27:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# Messaggi

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

Le principali impostazioni si trovano nella configurazione:

- `messages.*` per prefissi, accodamento e comportamento dei gruppi.
- `agents.defaults.*` per i valori predefiniti di block streaming e suddivisione in blocchi.
- Override del canale (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e attivazione/disattivazione dello streaming.

Vedi [Configuration](/it/gateway/configuration) per lo schema completo.

## Deduplicazione in ingresso

I canali possono riconsegnare lo stesso messaggio dopo riconnessioni. OpenClaw mantiene una
cache di breve durata indicizzata per channel/account/peer/session/message id, così le consegne duplicate
non attivano un'altra esecuzione dell'agente.

## Debounce in ingresso

Messaggi rapidi consecutivi dello **stesso mittente** possono essere raggruppati in un unico
turno dell'agente tramite `messages.inbound`. Il debounce è limitato per canale + conversazione
e usa il messaggio più recente per il threading/le ID della risposta.

Config (valore predefinito globale + override per canale):

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
- I comandi di controllo bypassano il debounce così da restare autonomi — **tranne** quando un canale abilita esplicitamente la coalescenza delle DM dello stesso mittente (ad esempio [BlueBubbles `coalesceSameSenderDms`](/it/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), dove i comandi DM attendono entro la finestra di debounce così che un payload inviato in parti possa unirsi allo stesso turno dell'agente.

## Sessioni e dispositivi

Le sessioni sono gestite dal gateway, non dai client.

- Le chat dirette confluiscono nella chiave di sessione principale dell'agente.
- Gruppi/canali ottengono chiavi di sessione proprie.
- L'archivio delle sessioni e le trascrizioni si trovano sull'host del gateway.

Più dispositivi/canali possono mappare alla stessa sessione, ma la cronologia non viene
risincronizzata completamente su ogni client. Raccomandazione: usa un dispositivo principale per le conversazioni lunghe
per evitare divergenze di contesto. La Control UI e la TUI mostrano sempre la trascrizione della sessione
supportata dal gateway, quindi sono la fonte di verità.

Dettagli: [Session management](/it/concepts/session).

## Corpi in ingresso e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `Body`: testo del prompt inviato all'agente. Può includere envelope del canale e
  wrapper di cronologia facoltativi.
- `CommandBody`: testo utente raw per il parsing di direttive/comandi.
- `RawBody`: alias legacy di `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce cronologia, usa un wrapper condiviso:

- `[Messaggi della chat dal tuo ultimo reply - per contesto]`
- `[Messaggio corrente - rispondi a questo]`

Per le **chat non dirette** (gruppi/canali/stanze), al **corpo del messaggio corrente** viene prefissata
l'etichetta del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti
i messaggi in tempo reale e quelli accodati/di cronologia nel prompt dell'agente.

I buffer della cronologia sono **solo pending**: includono messaggi di gruppo che _non_
hanno attivato un'esecuzione (ad esempio messaggi vincolati alla menzione) ed **escludono** i messaggi
già presenti nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione **messaggio corrente** così che la cronologia
resti intatta. I canali che incapsulano la cronologia dovrebbero impostare `CommandBody` (o
`RawBody`) sul testo originale del messaggio e mantenere `Body` come prompt combinato.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (valore
predefinito globale) e override per canale come `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e follow-up

Se un'esecuzione è già attiva, i messaggi in ingresso possono essere accodati, indirizzati
all'esecuzione corrente o raccolti per un turno di follow-up.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- Modalità: `interrupt`, `steer`, `followup`, `collect`, più varianti backlog.

Dettagli: [Queueing](/it/concepts/queue).

## Streaming, suddivisione in blocchi e batching

Il block streaming invia risposte parziali mentre il modello produce blocchi di testo.
La suddivisione in blocchi rispetta i limiti di testo del canale ed evita di spezzare codice delimitato.

Impostazioni chiave:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato sull'inattività)
- `agents.defaults.humanDelay` (pausa in stile umano tra risposte a blocchi)
- Override del canale: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + chunking](/it/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può esporre o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento conta comunque nell'uso dei token quando viene prodotto dal modello.
- Telegram supporta lo stream del ragionamento nella bolla di bozza.

Dettagli: [Thinking + reasoning directives](/it/tools/thinking) e [Token use](/it/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata del prefisso in uscita), più `channels.whatsapp.messagePrefix` (prefisso in ingresso di WhatsApp)
- Threading delle risposte tramite `replyToMode` e valori predefiniti per canale

Dettagli: [Configuration](/it/gateway/configuration-reference#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa “non inviare una risposta visibile all'utente”.
OpenClaw risolve questo comportamento in base al tipo di conversazione:

- Le conversazioni dirette non consentono il silenzio per impostazione predefinita e riscrivono una risposta
  solo silenziosa in un breve fallback visibile.
- Gruppi/canali consentono il silenzio per impostazione predefinita.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

I valori predefiniti si trovano in `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` possono sovrascriverli per singola surface.

Quando la sessione padre ha una o più esecuzioni pending di subagenti generati, le
risposte solo silenziose vengono scartate su tutte le surface invece di essere riscritte, così il
padre resta silenzioso finché l'evento di completamento del figlio non consegna la risposta reale.

## Correlati

- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Retry](/it/concepts/retry) — comportamento di retry della consegna dei messaggi
- [Queue](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Channels](/it/channels) — integrazioni con piattaforme di messaggistica

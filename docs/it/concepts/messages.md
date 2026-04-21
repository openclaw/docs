---
read_when:
    - Spiegare come i messaggi in ingresso diventano risposte
    - Chiarire sessioni, modalità di accodamento o comportamento dello streaming
    - Documentare la visibilità del ragionamento e le implicazioni d'uso
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-04-21T08:22:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf88b91f3489bfdfb4a84f8a287a1ec0b0d71a765dfe27c666c6f43d0145022
    source_path: concepts/messages.md
    workflow: 15
---

# Messaggi

Questa pagina collega il modo in cui OpenClaw gestisce i messaggi in ingresso, le sessioni, l'accodamento,
lo streaming e la visibilità del ragionamento.

## Flusso dei messaggi (alto livello)

```
Messaggio in ingresso
  -> routing/binding -> chiave di sessione
  -> coda (se un'esecuzione è attiva)
  -> esecuzione dell'agente (streaming + strumenti)
  -> risposte in uscita (limiti del canale + suddivisione in blocchi)
```

Le impostazioni principali si trovano nella configurazione:

- `messages.*` per prefissi, accodamento e comportamento nei gruppi.
- `agents.defaults.*` per i valori predefiniti di block streaming e chunking.
- Override di canale (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e toggle dello streaming.

Vedi [Configuration](/it/gateway/configuration) per lo schema completo.

## Deduplica in ingresso

I canali possono riconsegnare lo stesso messaggio dopo le riconnessioni. OpenClaw mantiene una
cache di breve durata indicizzata per canale/account/peer/sessione/id messaggio in modo che le consegne
duplicate non attivino un'altra esecuzione dell'agente.

## Debouncing in ingresso

Messaggi rapidi e consecutivi dello **stesso mittente** possono essere raggruppati in un singolo
turno dell'agente tramite `messages.inbound`. Il debouncing è applicato per canale + conversazione
e usa il messaggio più recente per il threading/le ID della risposta.

Config (valore globale predefinito + override per canale):

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
- I comandi di controllo bypassano il debouncing così restano autonomi.

## Sessioni e dispositivi

Le sessioni sono di proprietà del Gateway, non dei client.

- Le chat dirette confluiscono nella chiave di sessione principale dell'agente.
- Gruppi/canali ottengono le proprie chiavi di sessione.
- L'archivio delle sessioni e le trascrizioni si trovano sull'host del Gateway.

Più dispositivi/canali possono mappare alla stessa sessione, ma la cronologia non viene
sincronizzata completamente su tutti i client. Raccomandazione: usa un dispositivo primario
per le conversazioni lunghe per evitare contesti divergenti. La Control UI e la TUI mostrano sempre
la trascrizione della sessione supportata dal Gateway, quindi sono la fonte di verità.

Dettagli: [Session management](/it/concepts/session).

## Corpi in ingresso e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `Body`: testo del prompt inviato all'agente. Può includere envelope del canale e
  wrapper facoltativi della cronologia.
- `CommandBody`: testo utente grezzo per l'analisi di direttive/comandi.
- `RawBody`: alias legacy per `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce cronologia, usa un wrapper condiviso:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le **chat non dirette** (gruppi/canali/stanze), il **corpo del messaggio corrente** viene prefissato con
l'etichetta del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti
nel prompt dell'agente i messaggi in tempo reale e quelli in coda/cronologia.

I buffer della cronologia sono **solo pending**: includono i messaggi di gruppo che _non_ hanno
attivato un'esecuzione (per esempio, messaggi soggetti al gating delle menzioni) ed **escludono** i messaggi
già presenti nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione del **messaggio corrente** così la cronologia
resta intatta. I canali che avvolgono la cronologia dovrebbero impostare `CommandBody` (o
`RawBody`) sul testo originale del messaggio e mantenere `Body` come prompt combinato.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (valore
globale predefinito) e override per canale come `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e followup

Se un'esecuzione è già attiva, i messaggi in ingresso possono essere accodati, indirizzati
all'esecuzione corrente oppure raccolti per un turno di followup.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- Modalità: `interrupt`, `steer`, `followup`, `collect`, più le varianti backlog.

Dettagli: [Queueing](/it/concepts/queue).

## Streaming, chunking e batching

Il block streaming invia risposte parziali mentre il modello produce blocchi di testo.
Il chunking rispetta i limiti di testo del canale ed evita di dividere codice racchiuso da fence.

Impostazioni chiave:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato sull'inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra le risposte a blocchi)
- Override di canale: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

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
- Threading della risposta tramite `replyToMode` e valori predefiniti per canale

Dettagli: [Configuration](/it/gateway/configuration-reference#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa “non consegnare una risposta visibile all'utente”.
OpenClaw risolve questo comportamento in base al tipo di conversazione:

- Le conversazioni dirette non consentono il silenzio per impostazione predefinita e riscrivono una
  risposta silenziosa pura in un breve fallback visibile.
- Gruppi/canali consentono il silenzio per impostazione predefinita.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

I valori predefiniti si trovano in `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` possono sostituirli per superficie.

## Correlati

- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Retry](/it/concepts/retry) — comportamento di nuovo tentativo nella consegna dei messaggi
- [Queue](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Channels](/it/channels) — integrazioni con le piattaforme di messaggistica

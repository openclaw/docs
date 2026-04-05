---
read_when:
    - Spiegare come i messaggi in entrata diventano risposte
    - Chiarire sessioni, modalità di accodamento o comportamento dello streaming
    - Documentare la visibilità del ragionamento e le implicazioni sull'utilizzo
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-04-05T13:50:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475f892bd534fdb10a2ee5d3c57a3d4a7fb8e1ab68d695189ba186004713f6f3
    source_path: concepts/messages.md
    workflow: 15
---

# Messaggi

Questa pagina riunisce il modo in cui OpenClaw gestisce i messaggi in entrata, le sessioni, l'accodamento,
lo streaming e la visibilità del ragionamento.

## Flusso dei messaggi (panoramica)

```
Messaggio in entrata
  -> instradamento/associazioni -> chiave di sessione
  -> coda (se un'esecuzione è attiva)
  -> esecuzione dell'agente (streaming + strumenti)
  -> risposte in uscita (limiti del canale + chunking)
```

I controlli principali si trovano nella configurazione:

- `messages.*` per prefissi, accodamento e comportamento dei gruppi.
- `agents.defaults.*` per i valori predefiniti di streaming a blocchi e chunking.
- Override del canale (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e opzioni di streaming.

Vedi [Configurazione](/gateway/configuration) per lo schema completo.

## Deduplicazione in entrata

I canali possono riconsegnare lo stesso messaggio dopo una riconnessione. OpenClaw mantiene una
cache di breve durata con chiave channel/account/peer/session/message id, così le consegne duplicate
non attivano un'altra esecuzione dell'agente.

## Debouncing in entrata

Messaggi rapidi e consecutivi provenienti dallo **stesso mittente** possono essere raggruppati in un singolo
turno dell'agente tramite `messages.inbound`. Il debouncing è limitato a canale + conversazione
e usa il messaggio più recente per il threading/le identificazioni della risposta.

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

- Il debounce si applica ai messaggi **solo testo**; i contenuti multimediali/gli allegati vengono inviati immediatamente.
- I comandi di controllo bypassano il debounce, così rimangono autonomi.

## Sessioni e dispositivi

Le sessioni appartengono al gateway, non ai client.

- Le chat dirette confluiscono nella chiave di sessione principale dell'agente.
- Gruppi/canali ottengono le proprie chiavi di sessione.
- L'archivio delle sessioni e le trascrizioni risiedono sull'host del gateway.

Più dispositivi/canali possono mappare alla stessa sessione, ma la cronologia non viene
sincronizzata completamente su tutti i client. Raccomandazione: usa un solo dispositivo principale per le conversazioni lunghe
per evitare contesti divergenti. La Control UI e la TUI mostrano sempre la
trascrizione della sessione supportata dal gateway, quindi sono la fonte di verità.

Dettagli: [Gestione delle sessioni](/concepts/session).

## Corpi dei messaggi in entrata e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `Body`: testo del prompt inviato all'agente. Può includere envelope del canale e
  wrapper facoltativi della cronologia.
- `CommandBody`: testo grezzo dell'utente per l'analisi di direttive/comandi.
- `RawBody`: alias legacy per `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce la cronologia, usa un wrapper condiviso:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le **chat non dirette** (gruppi/canali/stanze), il **corpo del messaggio corrente** è preceduto dall'etichetta del
mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti
i messaggi in tempo reale e quelli accodati/di cronologia nel prompt dell'agente.

I buffer della cronologia sono **solo pending**: includono i messaggi di gruppo che _non_ hanno
attivato un'esecuzione (ad esempio, messaggi vincolati a menzioni) ed **escludono** i messaggi
già presenti nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione del **messaggio corrente**, così la cronologia
rimane intatta. I canali che racchiudono la cronologia dovrebbero impostare `CommandBody` (o
`RawBody`) al testo originale del messaggio e mantenere `Body` come prompt combinato.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (valore
predefinito globale) e override per canale come `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e followup

Se un'esecuzione è già attiva, i messaggi in entrata possono essere accodati, indirizzati nell'esecuzione
corrente o raccolti per un turno di followup.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- Modalità: `interrupt`, `steer`, `followup`, `collect`, più le varianti backlog.

Dettagli: [Accodamento](/concepts/queue).

## Streaming, chunking e batching

Lo streaming a blocchi invia risposte parziali mentre il modello produce blocchi di testo.
Il chunking rispetta i limiti di testo del canale ed evita di suddividere blocchi di codice delimitati.

Impostazioni principali:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato su inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra le risposte a blocchi)
- Override del canale: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + chunking](/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può mostrare o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento conta comunque ai fini dell'utilizzo dei token quando viene prodotto dal modello.
- Telegram supporta lo stream del ragionamento nella bolla di bozza.

Dettagli: [Direttive Thinking + reasoning](/tools/thinking) e [Utilizzo dei token](/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata dei prefissi in uscita), più `channels.whatsapp.messagePrefix` (prefisso in entrata di WhatsApp)
- Threading delle risposte tramite `replyToMode` e valori predefiniti per canale

Dettagli: [Configurazione](/gateway/configuration-reference#messages) e documentazione dei canali.

## Correlati

- [Streaming](/concepts/streaming) — consegna dei messaggi in tempo reale
- [Retry](/concepts/retry) — comportamento di nuovo tentativo nella consegna dei messaggi
- [Queue](/concepts/queue) — coda di elaborazione dei messaggi
- [Channels](/it/channels) — integrazioni con piattaforme di messaggistica

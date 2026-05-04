---
read_when:
    - Debug o configurazione dell'accesso a WebChat
summary: Host statico WebChat in loopback e uso di WS del Gateway per l'interfaccia utente della chat
title: Chat web
x-i18n:
    generated_at: "2026-05-04T07:10:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Stato: l’interfaccia chat SwiftUI per macOS/iOS comunica direttamente con il WebSocket del Gateway.

## Che cos’è

- Un’interfaccia chat nativa per il gateway (nessun browser incorporato e nessun server statico locale).
- Usa le stesse sessioni e regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il gateway.
2. Apri l’interfaccia WebChat (app macOS/iOS) o la scheda chat della Control UI.
3. Assicurati che sia configurato un percorso di autenticazione gateway valido (shared-secret per impostazione predefinita,
   anche su loopback).

## Come funziona (comportamento)

- L’interfaccia si connette al WebSocket del Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` è limitato per stabilità: il Gateway può troncare i campi di testo lunghi, omettere metadati pesanti e sostituire le voci troppo grandi con `[chat.history omitted: message too large]`.
- `chat.history` segue il ramo di trascrizione attivo per i file di sessione moderni solo in append, quindi i rami di riscrittura abbandonati e le copie di prompt superate non vengono visualizzati in WebChat.
- Le voci di Compaction vengono visualizzate come un separatore esplicito di cronologia compattata. Il separatore spiega che i turni precedenti sono conservati in un checkpoint e rimanda ai controlli checkpoint delle Sessioni, dove gli operatori possono creare un ramo o ripristinare la vista precedente alla compattazione quando le loro autorizzazioni lo consentono.
- La Control UI ricorda il `sessionId` del Gateway sottostante restituito da `chat.history` e lo include nelle chiamate `chat.send` successive, quindi riconnessioni e aggiornamenti della pagina continuano la stessa conversazione salvata a meno che l’utente non avvii o reimposti una sessione.
- La Control UI accorpa gli invii duplicati in corso per la stessa sessione, lo stesso messaggio e gli stessi allegati prima di generare un nuovo id di esecuzione `chat.send`; il Gateway continua comunque a deduplicare le richieste ripetute che riutilizzano la stessa chiave di idempotenza.
- I file di avvio dell’area di lavoro e le istruzioni `BOOTSTRAP.md` in sospeso vengono forniti tramite il Project Context del prompt di sistema dell’agente, non copiati nel messaggio utente di WebChat. Il troncamento del bootstrap aggiunge solo un avviso conciso di recupero nel prompt di sistema; conteggi dettagliati e impostazioni di configurazione restano nelle superfici diagnostiche.
- `chat.history` è anche normalizzato per la visualizzazione: il contesto OpenClaw solo runtime,
  i wrapper di busta in ingresso, i tag inline delle direttive di consegna
  come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML in testo semplice delle chiamate agli strumenti
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e i blocchi di chiamata agli strumenti troncati), e
  i token di controllo del modello ASCII/a larghezza piena trapelati vengono rimossi dal testo visibile,
  e le voci dell’assistente il cui intero testo visibile è solo il token silenzioso esatto
  `NO_REPLY` / `no_reply` vengono omesse.
- I payload di risposta contrassegnati come ragionamento (`isReasoning: true`) sono esclusi dal contenuto dell’assistente in WebChat, dal testo di replay della trascrizione e dai blocchi di contenuto audio, quindi i payload solo di pensiero non emergono come messaggi dell’assistente visibili o audio riproducibile.
- `chat.inject` aggiunge una nota dell’assistente direttamente alla trascrizione e la trasmette all’interfaccia (nessuna esecuzione dell’agente).
- Le esecuzioni interrotte possono mantenere visibile nell’interfaccia l’output parziale dell’assistente.
- Il Gateway persiste nella cronologia della trascrizione il testo parziale interrotto dell’assistente quando esiste output nel buffer, e contrassegna tali voci con metadati di interruzione.
- La cronologia viene sempre recuperata dal gateway (nessun monitoraggio di file locali).
- Se il gateway non è raggiungibile, WebChat è in sola lettura.

### Modello di trascrizione e consegna

WebChat ha due percorsi dati separati:

- Il file JSONL di sessione è la trascrizione durevole del modello/runtime. Per le normali esecuzioni dell’agente, Pi persiste i messaggi `user`, `assistant` e `toolResult` visibili al modello tramite il suo gestore di sessione. WebChat non scrive testo arbitrario di consegna, stato o supporto in quella trascrizione.
- Gli eventi `ReplyPayload` del Gateway sono la proiezione di consegna live. Possono essere normalizzati per la visualizzazione WebChat/canale, lo streaming a blocchi, i tag di direttiva, l’incorporamento dei media, i flag TTS/audio e il comportamento di fallback dell’interfaccia. Non sono essi stessi il log canonico della sessione.
- WebChat inietta voci di trascrizione dell’assistente solo quando il Gateway possiede un messaggio visualizzato al di fuori di un normale turno dell’assistente Pi: `chat.inject`, risposte a comandi non agente, output parziale interrotto e supplementi di trascrizione multimediale gestiti da WebChat.
- `chat.history` legge la trascrizione della sessione salvata e applica la proiezione di visualizzazione di WebChat. Se durante un’esecuzione compare testo live dell’assistente ma scompare dopo il ricaricamento della cronologia, controlla prima se il JSONL grezzo contiene il testo dell’assistente, poi se la proiezione `chat.history` lo ha rimosso, quindi se l’unione optimistic-tail della Control UI ha sostituito lo stato di consegna locale con lo snapshot persistito.

Le risposte finali delle normali esecuzioni dell’agente devono essere durevoli perché Pi scrive `message_end` dell’assistente. Qualsiasi fallback che rispecchi nella trascrizione un payload finale consegnato deve prima evitare di duplicare un turno dell’assistente che Pi ha già scritto.

## Pannello strumenti degli agenti nella Control UI

- Il pannello Tools della Control UI `/agents` ha due viste separate:
  - **Disponibili ora** usa `tools.effective(sessionKey=...)` e mostra ciò che la sessione corrente
    può effettivamente usare a runtime, inclusi strumenti core, Plugin e di proprietà del canale.
  - **Configurazione strumenti** usa `tools.catalog` e resta focalizzato su profili, override e
    semantica del catalogo.
- La disponibilità runtime è legata alla sessione. Cambiare sessione sullo stesso agente può modificare
  l’elenco **Disponibili ora**.
- L’editor di configurazione non implica disponibilità runtime; l’accesso effettivo segue comunque la precedenza delle policy
  (`allow`/`deny`, override per agente e provider/canale).

## Uso remoto

- La modalità remota incanala il WebSocket del gateway su SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni WebChat:

- `gateway.webchat.chatHistoryMaxChars`: numero massimo di caratteri per i campi di testo nelle risposte `chat.history`. Quando una voce di trascrizione supera questo limite, il Gateway tronca i campi di testo lunghi e può sostituire i messaggi troppo grandi con un segnaposto. Anche `maxChars` per richiesta può essere inviato dal client per sovrascrivere questo valore predefinito per una singola chiamata `chat.history`.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket shared-secret.
- `gateway.auth.allowTailscale`: la scheda chat della Control UI nel browser può usare gli header di identità Tailscale
  Serve quando abilitati.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse-proxy per client browser dietro una sorgente proxy **non-loopback** consapevole dell’identità (vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione gateway remota.
- `session.*`: archiviazione sessione e valori predefiniti della chiave principale.

## Correlati

- [Control UI](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)

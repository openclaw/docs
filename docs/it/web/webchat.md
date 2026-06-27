---
read_when:
    - Debug o configurazione dell'accesso WebChat
summary: Host statico WebChat loopback e utilizzo del WS Gateway per l'interfaccia utente della chat
title: WebChat
x-i18n:
    generated_at: "2026-06-27T18:25:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

Status: l'interfaccia chat SwiftUI per macOS/iOS comunica direttamente con il WebSocket del Gateway.

## Che cos'è

- Un'interfaccia chat nativa per il Gateway (nessun browser incorporato e nessun server statico locale).
- Usa le stesse sessioni e regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il Gateway.
2. Apri l'interfaccia WebChat (app macOS/iOS) o la scheda chat della Control UI.
3. Assicurati che sia configurato un percorso di autenticazione Gateway valido (shared-secret per impostazione predefinita,
   anche su loopback).

## Come funziona (comportamento)

- L'interfaccia si connette al WebSocket del Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` è limitato per stabilità: Gateway può troncare campi di testo lunghi, omettere metadati pesanti e sostituire voci troppo grandi con `[chat.history omitted: message too large]`.
- Quando un messaggio visibile dell'assistente è stato troncato in `chat.history`, Control UI può aprire un lettore laterale e recuperare su richiesta l'intera voce normalizzata per la visualizzazione tramite `chat.message.get`, senza aumentare il payload predefinito della cronologia.
- `chat.history` segue il ramo attivo della trascrizione per i file di sessione moderni append-only, quindi i rami di riscrittura abbandonati e le copie dei prompt sostituite non vengono renderizzati in WebChat.
- Le voci di Compaction vengono renderizzate come un separatore esplicito di cronologia compattata. Il separatore spiega che la trascrizione compattata è conservata come checkpoint e rimanda ai controlli checkpoint delle Sessioni, dove gli operatori possono creare un ramo o ripristinare da quella vista compattata quando le loro autorizzazioni lo consentono.
- Control UI ricorda il `sessionId` del Gateway sottostante restituito da `chat.history` e lo include nelle chiamate successive a `chat.send`, quindi le riconnessioni e gli aggiornamenti della pagina continuano la stessa conversazione archiviata, a meno che l'utente non avvii o reimposti una sessione.
- Control UI aggrega gli invii duplicati in corso per la stessa sessione, lo stesso messaggio e gli stessi allegati prima di generare un nuovo ID di esecuzione `chat.send`; il Gateway continua comunque a deduplicare le richieste ripetute che riutilizzano la stessa chiave di idempotenza.
- I file di avvio del workspace e le istruzioni `BOOTSTRAP.md` in sospeso vengono forniti tramite Project Context del prompt di sistema dell'agente, non copiati nel messaggio utente di WebChat. Il troncamento del bootstrap aggiunge solo un avviso conciso di ripristino nel prompt di sistema; conteggi dettagliati e opzioni di configurazione restano sulle superfici diagnostiche.
- Anche `chat.history` è normalizzato per la visualizzazione: il contesto OpenClaw solo runtime,
  i wrapper di envelope in ingresso, i tag inline delle direttive di consegna
  come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML in testo semplice delle chiamate tool
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e i blocchi di chiamata tool troncati), e
  i token di controllo del modello ASCII/full-width trapelati vengono rimossi dal testo visibile,
  e le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto
  `NO_REPLY` / `no_reply` vengono omesse.
- I payload di risposta contrassegnati come ragionamento (`isReasoning: true`) sono esclusi dal contenuto assistente di WebChat, dal testo di replay della trascrizione e dai blocchi di contenuto audio, quindi i payload solo di pensiero non compaiono come messaggi visibili dell'assistente o audio riproducibile.
- `chat.inject` aggiunge una nota dell'assistente direttamente alla trascrizione e la trasmette all'interfaccia (nessuna esecuzione dell'agente).
- Le esecuzioni interrotte possono mantenere visibile nell'interfaccia l'output parziale dell'assistente.
- Gateway persiste il testo parziale interrotto dell'assistente nella cronologia della trascrizione quando esiste output nel buffer e contrassegna quelle voci con metadati di interruzione.
- La cronologia viene sempre recuperata dal Gateway (nessun monitoraggio di file locali).
- Se il Gateway non è raggiungibile, WebChat è in sola lettura.

### Modello di trascrizione e consegna

WebChat ha due percorsi dati separati:

- Il file JSONL della sessione è la trascrizione durevole del modello/runtime. Per le normali esecuzioni dell'agente, il runtime OpenClaw incorporato persiste i messaggi visibili al modello `user`, `assistant` e `toolResult` tramite il proprio gestore di sessione. WebChat non scrive testo arbitrario di consegna, stato o supporto in quella trascrizione.
- Gli eventi Gateway `ReplyPayload` sono la proiezione di consegna live. Possono essere normalizzati per la visualizzazione WebChat/canale, lo streaming a blocchi, i tag direttiva, l'incorporamento dei media, i flag TTS/audio e il comportamento di fallback dell'interfaccia. Non sono essi stessi il log di sessione canonico.
- Gli harness che richiedono risposte visibili tramite `tools.message` continuano a usare WebChat come sink interno di risposte sorgente per l'esecuzione corrente. Un `message.send` senza destinazione da quell'esecuzione WebChat attiva viene proiettato nella stessa chat e rispecchiato nella trascrizione della sessione; WebChat non diventa un canale in uscita riutilizzabile e non eredita mai `lastChannel`.
- WebChat inserisce voci di trascrizione dell'assistente solo quando il Gateway possiede un messaggio visualizzato al di fuori di un normale turno di agente incorporato: `chat.inject`, risposte a comandi non agente, output parziale interrotto e supplementi di trascrizione multimediale gestiti da WebChat.
- `chat.history` legge la trascrizione di sessione archiviata e applica la proiezione di visualizzazione WebChat. Se durante un'esecuzione compare testo live dell'assistente ma scompare dopo il ricaricamento della cronologia, verifica prima se il JSONL grezzo contiene il testo dell'assistente, poi se la proiezione di `chat.history` lo ha rimosso, quindi se l'unione optimistic-tail della Control UI ha sostituito lo stato di consegna locale con lo snapshot persistito.
- `chat.message.get` usa lo stesso ramo di trascrizione e le stesse regole di proiezione della visualizzazione di `chat.history`, incluso lo scoping dell'agente attivo, ma mira a una singola voce di trascrizione tramite `messageId` e restituisce un motivo di indisponibilità onesto quando il contenuto completo non può più essere restituito.

Le risposte finali delle normali esecuzioni dell'agente dovrebbero essere durevoli perché il runtime incorporato scrive il `message_end` dell'assistente. Qualsiasi fallback che rispecchia nella trascrizione un payload finale consegnato deve prima evitare di duplicare un turno dell'assistente che il runtime incorporato ha già scritto.

## Pannello strumenti agenti della Control UI

- Il pannello Tools di `/agents` nella Control UI ha due viste separate:
  - **Disponibili subito** usa `tools.effective(sessionKey=...)` e mostra una proiezione
    di sola lettura derivata dal server dell'inventario della sessione corrente, inclusi strumenti core, di Plugin, di proprietà del canale
    e strumenti server MCP già scoperti.
  - **Configurazione strumenti** usa `tools.catalog` e resta focalizzata su profili, override e
    semantica del catalogo.
- La disponibilità runtime ha ambito di sessione. Cambiare sessione sullo stesso agente può modificare l'elenco
  **Disponibili subito**. Se i server MCP configurati non sono stati connessi o sono stati modificati
  dall'ultima discovery, il pannello mostra un avviso invece di avviare silenziosamente i trasporti MCP
  dal percorso di lettura.
- L'editor di configurazione non implica disponibilità runtime; l'accesso effettivo continua a seguire la precedenza delle policy
  (`allow`/`deny`, override per agente e provider/canale).

## Uso remoto

- La modalità remota incanala il WebSocket del Gateway tramite SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

WebChat non ha una sezione di configurazione persistita. Gateway usa il limite di visualizzazione `chat.history` integrato; i client API possono inviare `maxChars` per richiesta per sovrascriverlo per una singola chiamata `chat.history`. La configurazione legacy `channels.webchat` e `gateway.webchat` è ritirata; esegui `openclaw doctor --fix` per rimuoverla.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket shared-secret.
- `gateway.auth.allowTailscale`: la scheda chat della Control UI nel browser può usare gli header di identità Tailscale
  Serve quando abilitata.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse-proxy per client browser dietro una sorgente proxy **non-loopback** con identità consapevole (vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione Gateway remota.
- `session.*`: archiviazione della sessione e impostazioni predefinite della chiave principale.

## Correlati

- [Control UI](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)

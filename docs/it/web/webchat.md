---
read_when:
    - Diagnostica o configurazione dell'accesso a WebChat
summary: Host statico WebChat loopback e uso del WS del Gateway per l'interfaccia utente di chat
title: Chat web
x-i18n:
    generated_at: "2026-05-03T21:45:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Stato: l'interfaccia chat SwiftUI per macOS/iOS comunica direttamente con il WebSocket del Gateway.

## Che cos'è

- Un'interfaccia chat nativa per il gateway (senza browser incorporato e senza server statico locale).
- Usa le stesse sessioni e regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il gateway.
2. Apri l'interfaccia WebChat (app macOS/iOS) o la scheda chat della Control UI.
3. Assicurati che sia configurato un percorso di autenticazione gateway valido (shared-secret per impostazione predefinita,
   anche su loopback).

## Come funziona (comportamento)

- L'interfaccia si connette al WebSocket del Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` è limitato per stabilità: Gateway può troncare campi di testo lunghi, omettere metadati pesanti e sostituire voci sovradimensionate con `[chat.history omitted: message too large]`.
- `chat.history` segue il ramo della trascrizione attivo per i file di sessione moderni append-only, quindi i rami di riscrittura abbandonati e le copie dei prompt sostituite non vengono visualizzati in WebChat.
- Le voci di Compaction vengono visualizzate come un divisore esplicito di cronologia compattata. Il divisore spiega che i turni precedenti sono conservati in un checkpoint e rimanda ai controlli dei checkpoint delle Sessioni, dove gli operatori possono creare un ramo o ripristinare la vista pre-compaction quando le loro autorizzazioni lo consentono.
- Control UI ricorda il `sessionId` del Gateway sottostante restituito da `chat.history` e lo include nelle successive chiamate `chat.send`, quindi le riconnessioni e gli aggiornamenti della pagina continuano la stessa conversazione archiviata, a meno che l'utente non avvii o reimposti una sessione.
- Control UI aggrega gli invii duplicati in corso per la stessa sessione, lo stesso messaggio e gli stessi allegati prima di generare un nuovo ID di esecuzione `chat.send`; il Gateway continua comunque a deduplicare le richieste ripetute che riutilizzano la stessa chiave di idempotenza.
- `chat.history` viene anche normalizzato per la visualizzazione: il contesto OpenClaw solo runtime,
  i wrapper di envelope in ingresso, i tag inline delle direttive di consegna
  come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML in testo semplice delle chiamate agli strumenti
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocchi di chiamata agli strumenti troncati) e
  i token di controllo del modello ASCII/full-width trapelati vengono rimossi dal testo visibile,
  e le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto
  `NO_REPLY` / `no_reply` vengono omesse.
- I payload di risposta contrassegnati come ragionamento (`isReasoning: true`) sono esclusi dal contenuto dell'assistente in WebChat, dal testo di riproduzione della trascrizione e dai blocchi di contenuto audio, quindi i payload solo di pensiero non emergono come messaggi visibili dell'assistente o audio riproducibile.
- `chat.inject` aggiunge una nota dell'assistente direttamente alla trascrizione e la trasmette all'interfaccia (nessuna esecuzione dell'agente).
- Le esecuzioni interrotte possono mantenere visibile nell'interfaccia l'output parziale dell'assistente.
- Gateway persiste nella cronologia della trascrizione il testo parziale interrotto dell'assistente quando esiste output nel buffer e contrassegna tali voci con metadati di interruzione.
- La cronologia viene sempre recuperata dal gateway (nessun monitoraggio di file locali).
- Se il gateway non è raggiungibile, WebChat è in sola lettura.

## Pannello degli strumenti degli agenti della Control UI

- Il pannello Strumenti `/agents` della Control UI ha due viste separate:
  - **Disponibili adesso** usa `tools.effective(sessionKey=...)` e mostra ciò che la sessione corrente
    può effettivamente usare a runtime, inclusi strumenti core, Plugin e di proprietà dei canali.
  - **Configurazione strumenti** usa `tools.catalog` e resta focalizzata su profili, override e
    semantica del catalogo.
- La disponibilità a runtime è limitata alla sessione. Cambiare sessione sullo stesso agente può modificare
  l'elenco **Disponibili adesso**.
- L'editor di configurazione non implica disponibilità a runtime; l'accesso effettivo segue comunque la precedenza
  delle policy (`allow`/`deny`, override per agente e provider/canale).

## Uso remoto

- La modalità remota incanala il WebSocket del gateway su SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni WebChat:

- `gateway.webchat.chatHistoryMaxChars`: numero massimo di caratteri per i campi di testo nelle risposte `chat.history`. Quando una voce della trascrizione supera questo limite, Gateway tronca i campi di testo lunghi e può sostituire i messaggi sovradimensionati con un segnaposto. Il client può anche inviare `maxChars` per richiesta per sovrascrivere questo valore predefinito per una singola chiamata `chat.history`.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket shared-secret.
- `gateway.auth.allowTailscale`: la scheda chat della Control UI nel browser può usare gli header di identità Tailscale
  Serve quando abilitata.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse-proxy per client browser dietro una sorgente proxy **non-loopback** con consapevolezza dell'identità (vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione del gateway remoto.
- `session.*`: archiviazione delle sessioni e valori predefiniti della chiave principale.

## Correlati

- [Control UI](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)

---
read_when:
    - Debug o configurazione dell'accesso a WebChat
summary: Host statico WebChat Loopback e uso del WS del Gateway per l'interfaccia utente della chat
title: WebChat
x-i18n:
    generated_at: "2026-04-30T09:20:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

Stato: l'interfaccia utente della chat SwiftUI per macOS/iOS comunica direttamente con il WebSocket del Gateway.

## Che cos'è

- Un'interfaccia utente di chat nativa per il Gateway (senza browser incorporato e senza server statico locale).
- Usa le stesse sessioni e regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il Gateway.
2. Apri l'interfaccia WebChat (app macOS/iOS) o la scheda chat della Control UI.
3. Assicurati che sia configurato un percorso di autenticazione valido per il Gateway (shared-secret per impostazione predefinita,
   anche su loopback).

## Come funziona (comportamento)

- L'interfaccia si connette al WebSocket del Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` è limitato per stabilità: il Gateway può troncare campi di testo lunghi, omettere metadati pesanti e sostituire voci troppo grandi con `[chat.history omitted: message too large]`.
- `chat.history` segue il ramo della trascrizione attiva per i file di sessione moderni append-only, quindi i rami di riscrittura abbandonati e le copie di prompt superate non vengono renderizzati in WebChat.
- La Control UI accorpa gli invii duplicati in corso per la stessa sessione, lo stesso messaggio e gli stessi allegati prima di generare un nuovo ID di esecuzione `chat.send`; il Gateway deduplica comunque le richieste ripetute che riutilizzano la stessa chiave di idempotenza.
- `chat.history` è anche normalizzato per la visualizzazione: il contesto OpenClaw solo runtime,
  i wrapper degli envelope in ingresso, i tag inline delle direttive di consegna
  come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML in testo semplice delle chiamate agli strumenti
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocchi di chiamate agli strumenti troncati), e
  i token di controllo del modello ASCII/a larghezza intera trapelati vengono rimossi dal testo visibile,
  e le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto
  `NO_REPLY` / `no_reply` vengono omesse.
- I payload di risposta contrassegnati come ragionamento (`isReasoning: true`) sono esclusi dal contenuto assistente di WebChat, dal testo di replay della trascrizione e dai blocchi di contenuto audio, quindi i payload di solo ragionamento non emergono come messaggi assistente visibili o audio riproducibile.
- `chat.inject` aggiunge una nota dell'assistente direttamente alla trascrizione e la trasmette all'interfaccia (nessuna esecuzione dell'agente).
- Le esecuzioni interrotte possono mantenere visibile nell'interfaccia l'output parziale dell'assistente.
- Il Gateway persiste il testo parziale interrotto dell'assistente nella cronologia della trascrizione quando esiste output nel buffer e contrassegna tali voci con metadati di interruzione.
- La cronologia viene sempre recuperata dal Gateway (nessun monitoraggio di file locali).
- Se il Gateway non è raggiungibile, WebChat è in sola lettura.

## Pannello degli strumenti degli agenti della Control UI

- Il pannello Strumenti `/agents` della Control UI ha due viste separate:
  - **Disponibili ora** usa `tools.effective(sessionKey=...)` e mostra ciò che la sessione corrente
    può effettivamente usare a runtime, inclusi strumenti core, Plugin e di proprietà del canale.
  - **Configurazione strumenti** usa `tools.catalog` e resta focalizzata su profili, override e
    semantica del catalogo.
- La disponibilità a runtime è limitata alla sessione. Cambiare sessione sullo stesso agente può modificare l'elenco
  **Disponibili ora**.
- L'editor di configurazione non implica disponibilità a runtime; l'accesso effettivo segue comunque la precedenza delle policy
  (`allow`/`deny`, override per agente e per provider/canale).

## Uso remoto

- La modalità remota instrada il WebSocket del Gateway tramite SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento di configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni WebChat:

- `gateway.webchat.chatHistoryMaxChars`: numero massimo di caratteri per i campi di testo nelle risposte `chat.history`. Quando una voce di trascrizione supera questo limite, il Gateway tronca i campi di testo lunghi e può sostituire i messaggi troppo grandi con un segnaposto. Anche `maxChars` per richiesta può essere inviato dal client per sovrascrivere questa impostazione predefinita per una singola chiamata `chat.history`.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket shared-secret.
- `gateway.auth.allowTailscale`: la scheda chat della Control UI nel browser può usare le intestazioni di identità di Tailscale
  Serve quando abilitate.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse-proxy per client browser dietro una sorgente proxy **non-loopback** consapevole dell'identità (vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione Gateway remota.
- `session.*`: archiviazione delle sessioni e impostazioni predefinite della chiave principale.

## Correlati

- [Control UI](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)

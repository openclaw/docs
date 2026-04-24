---
read_when:
    - Debug o configurazione dell'accesso WebChat
summary: Host statico loopback WebChat e uso del Gateway WS per l'interfaccia chat
title: WebChat
x-i18n:
    generated_at: "2026-04-24T09:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

Stato: l'interfaccia chat SwiftUI macOS/iOS comunica direttamente con il Gateway WebSocket.

## Cos'è

- Un'interfaccia chat nativa per il gateway (nessun browser incorporato e nessun server statico locale).
- Usa le stesse sessioni e regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il gateway.
2. Apri l'interfaccia WebChat (app macOS/iOS) oppure la scheda chat della UI di controllo.
3. Assicurati che sia configurato un percorso di autenticazione gateway valido (segreto condiviso per impostazione predefinita,
   anche su loopback).

## Come funziona (comportamento)

- L'interfaccia si connette al Gateway WebSocket e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` è limitato per stabilità: il Gateway può troncare i campi di testo lunghi, omettere metadati pesanti e sostituire le voci troppo grandi con `[chat.history omitted: message too large]`.
- `chat.history` è anche normalizzato per la visualizzazione: i tag inline delle direttive di consegna
  come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML delle chiamate agli strumenti in testo semplice
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocchi di chiamata agli strumenti troncati), e
  i token di controllo del modello ASCII/a larghezza piena trapelati vengono rimossi dal testo visibile,
  e le voci assistant il cui intero testo visibile è solo l'esatto token silenzioso
  `NO_REPLY` / `no_reply` vengono omesse.
- `chat.inject` aggiunge direttamente una nota assistant alla trascrizione e la trasmette all'interfaccia (nessuna esecuzione dell'agente).
- Le esecuzioni interrotte possono mantenere visibile nell'interfaccia un output assistant parziale.
- Il Gateway rende persistente nella cronologia della trascrizione il testo assistant parziale interrotto quando esiste output bufferizzato, e contrassegna quelle voci con metadati di interruzione.
- La cronologia viene sempre recuperata dal gateway (nessun monitoraggio di file locali).
- Se il gateway non è raggiungibile, WebChat è di sola lettura.

## Pannello strumenti degli agenti nella UI di controllo

- Il pannello Tools di `/agents` nella UI di controllo ha due viste separate:
  - **Disponibili in questo momento** usa `tools.effective(sessionKey=...)` e mostra ciò che la sessione corrente
    può effettivamente usare a runtime, inclusi strumenti core, plugin e posseduti dal canale.
  - **Configurazione strumento** usa `tools.catalog` e resta focalizzato su profili, override e
    semantica del catalogo.
- La disponibilità runtime è delimitata alla sessione. Cambiare sessione sullo stesso agente può modificare l'elenco
  **Disponibili in questo momento**.
- L'editor di configurazione non implica disponibilità runtime; l'accesso effettivo continua a seguire la precedenza
  della policy (`allow`/`deny`, override per-agente e per provider/canale).

## Uso remoto

- La modalità remota incanala il Gateway WebSocket tramite SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni WebChat:

- `gateway.webchat.chatHistoryMaxChars`: numero massimo di caratteri per i campi di testo nelle risposte `chat.history`. Quando una voce della trascrizione supera questo limite, il Gateway tronca i campi di testo lunghi e può sostituire i messaggi troppo grandi con un segnaposto. Il client può anche inviare `maxChars` per richiesta per sovrascrivere questo valore predefinito per una singola chiamata `chat.history`.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket con segreto condiviso.
- `gateway.auth.allowTailscale`: la scheda chat della UI di controllo nel browser può usare gli header di identità Tailscale
  Serve quando abilitato.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse-proxy per client browser dietro una sorgente proxy **non-loopback** consapevole dell'identità (vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target del gateway remoto.
- `session.*`: archiviazione della sessione e valori predefiniti della chiave principale.

## Correlati

- [UI di controllo](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)

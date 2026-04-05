---
read_when:
    - Eseguire il debug o configurare l'accesso a WebChat
summary: Host statico WebChat loopback e uso del Gateway WS per l'interfaccia chat
title: WebChat
x-i18n:
    generated_at: "2026-04-05T14:08:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2588be04e9ae38149bdf284bf4d75b6784d63899026d2351c4e0e7efdf05ff39
    source_path: web/webchat.md
    workflow: 15
---

# WebChat (interfaccia Gateway WebSocket)

Stato: l'interfaccia chat SwiftUI di macOS/iOS comunica direttamente con il Gateway WebSocket.

## Che cos'è

- Un'interfaccia chat nativa per il gateway (senza browser incorporato e senza server statico locale).
- Usa le stesse sessioni e regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il gateway.
2. Apri l'interfaccia WebChat (app macOS/iOS) o la scheda chat della Control UI.
3. Assicurati che sia configurato un percorso di autenticazione del gateway valido (segreto condiviso per default,
   anche su local loopback).

## Come funziona (comportamento)

- L'interfaccia si connette al Gateway WebSocket e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` è limitato per stabilità: il Gateway può troncare campi di testo lunghi, omettere metadati pesanti e sostituire voci troppo grandi con `[chat.history omitted: message too large]`.
- `chat.history` è anche normalizzato per la visualizzazione: i tag inline delle direttive di consegna
  come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML delle chiamate agli strumenti in testo semplice
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e i blocchi di chiamata agli strumenti troncati), e
  i token di controllo del modello ASCII/a larghezza piena trapelati vengono rimossi dal testo visibile,
  e le voci dell'assistente il cui intero testo visibile è solo l'esatto
  token silenzioso `NO_REPLY` / `no_reply` vengono omesse.
- `chat.inject` aggiunge direttamente una nota dell'assistente alla trascrizione e la trasmette all'interfaccia (senza esecuzione dell'agente).
- Le esecuzioni interrotte possono lasciare visibile output parziale dell'assistente nell'interfaccia.
- Il Gateway rende persistente nella cronologia della trascrizione il testo parziale dell'assistente interrotto quando esiste output nel buffer e contrassegna quelle voci con metadati di interruzione.
- La cronologia viene sempre recuperata dal gateway (senza monitoraggio di file locali).
- Se il gateway non è raggiungibile, WebChat è in sola lettura.

## Pannello Tools degli agenti nella Control UI

- Il pannello Tools di `/agents` nella Control UI ha due viste separate:
  - **Disponibili in questo momento** usa `tools.effective(sessionKey=...)` e mostra ciò che la sessione corrente
    può realmente usare a runtime, inclusi strumenti core, plugin e di proprietà del canale.
  - **Configurazione strumenti** usa `tools.catalog` e resta focalizzato su profili, sovrascritture e
    semantica del catalogo.
- La disponibilità runtime ha ambito di sessione. Cambiare sessione sullo stesso agente può cambiare
  l'elenco **Disponibili in questo momento**.
- L'editor di configurazione non implica disponibilità runtime; l'accesso effettivo continua a seguire la precedenza
  delle policy (`allow`/`deny`, sovrascritture per agente e per provider/canale).

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
  autenticazione WebSocket tramite segreto condiviso.
- `gateway.auth.allowTailscale`: la scheda chat della Control UI nel browser può usare gli header di identità Tailscale
  Serve quando abilitato.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse proxy per client browser dietro una sorgente proxy **non-loopback** consapevole dell'identità (vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione del gateway remoto.
- `session.*`: archiviazione delle sessioni e valori predefiniti della chiave principale.

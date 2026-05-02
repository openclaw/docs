---
read_when:
    - Debug o configurazione dell'accesso a WebChat
summary: Host statico WebChat in loopback e utilizzo di WS del Gateway per l'interfaccia utente della chat
title: Chat web
x-i18n:
    generated_at: "2026-05-02T08:37:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Stato: l'interfaccia chat SwiftUI macOS/iOS comunica direttamente con il WebSocket del Gateway.

## Cos'è

- Un'interfaccia chat nativa per il Gateway (nessun browser incorporato e nessun server statico locale).
- Usa le stesse sessioni e regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il Gateway.
2. Apri l'interfaccia WebChat (app macOS/iOS) o la scheda chat della Control UI.
3. Assicurati che sia configurato un percorso di autenticazione Gateway valido (`shared-secret` per impostazione predefinita,
   anche su loopback).

## Come funziona (comportamento)

- L'interfaccia si connette al WebSocket del Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` è limitato per stabilità: il Gateway può troncare i campi di testo lunghi, omettere metadati pesanti e sostituire voci sovradimensionate con `[chat.history omitted: message too large]`.
- `chat.history` segue il ramo attivo della trascrizione per i file di sessione moderni solo in append, quindi i rami di riscrittura abbandonati e le copie di prompt superate non vengono renderizzati in WebChat.
- La Control UI ricorda il `sessionId` del Gateway sottostante restituito da `chat.history` e lo include nelle chiamate successive a `chat.send`, quindi riconnessioni e aggiornamenti della pagina continuano la stessa conversazione archiviata, a meno che l'utente non avvii o reimposti una sessione.
- La Control UI accorpa gli invii in corso duplicati per la stessa sessione, messaggio e allegati prima di generare un nuovo id di esecuzione `chat.send`; il Gateway deduplica comunque le richieste ripetute che riutilizzano la stessa chiave di idempotenza.
- `chat.history` è anche normalizzato per la visualizzazione: il contesto OpenClaw solo runtime,
  i wrapper delle buste in ingresso, i tag inline delle direttive di consegna
  come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML in testo semplice delle chiamate agli strumenti
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocchi di chiamate agli strumenti troncati), e
  i token di controllo del modello ASCII/a larghezza intera trapelati vengono rimossi dal testo visibile,
  e le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto
  `NO_REPLY` / `no_reply` vengono omesse.
- I payload di risposta contrassegnati come ragionamento (`isReasoning: true`) sono esclusi dal contenuto dell'assistente WebChat, dal testo di replay della trascrizione e dai blocchi di contenuto audio, quindi i payload solo di ragionamento non emergono come messaggi assistente visibili o audio riproducibile.
- `chat.inject` aggiunge una nota dell'assistente direttamente alla trascrizione e la trasmette all'interfaccia (nessuna esecuzione dell'agente).
- Le esecuzioni interrotte possono mantenere visibile nell'interfaccia l'output parziale dell'assistente.
- Il Gateway mantiene nella cronologia della trascrizione il testo parziale interrotto dell'assistente quando esiste output bufferizzato, e contrassegna tali voci con metadati di interruzione.
- La cronologia viene sempre recuperata dal Gateway (nessun monitoraggio dei file locali).
- Se il Gateway non è raggiungibile, WebChat è in sola lettura.

## Pannello strumenti degli agenti della Control UI

- Il pannello Strumenti `/agents` della Control UI ha due viste separate:
  - **Disponibili in questo momento** usa `tools.effective(sessionKey=...)` e mostra cosa la sessione corrente
    può effettivamente usare a runtime, inclusi strumenti core, Plugin e di proprietà del canale.
  - **Configurazione strumenti** usa `tools.catalog` e resta concentrata su profili, override e
    semantica del catalogo.
- La disponibilità a runtime è legata alla sessione. Cambiare sessione sullo stesso agente può modificare l'elenco
  **Disponibili in questo momento**.
- L'editor di configurazione non implica disponibilità a runtime; l'accesso effettivo segue comunque la precedenza delle policy
  (`allow`/`deny`, override per agente e provider/canale).

## Uso remoto

- La modalità remota incapsula il WebSocket del Gateway tramite SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento di configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni WebChat:

- `gateway.webchat.chatHistoryMaxChars`: numero massimo di caratteri per i campi di testo nelle risposte `chat.history`. Quando una voce della trascrizione supera questo limite, il Gateway tronca i campi di testo lunghi e può sostituire i messaggi sovradimensionati con un segnaposto. Il client può anche inviare `maxChars` per richiesta per sovrascrivere questa impostazione predefinita per una singola chiamata `chat.history`.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket con shared-secret.
- `gateway.auth.allowTailscale`: la scheda chat della Control UI nel browser può usare le intestazioni di identità Tailscale
  Serve quando abilitate.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione tramite proxy inverso per client browser dietro un'origine proxy **non-loopback** consapevole dell'identità (vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione Gateway remota.
- `session.*`: archiviazione delle sessioni e impostazioni predefinite della chiave principale.

## Correlati

- [Control UI](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)

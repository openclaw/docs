---
read_when:
    - Debug o configurazione dell'accesso a WebChat
summary: Host statico WebChat di loopback e uso di WS del Gateway per l'interfaccia utente della chat
title: Chat web
x-i18n:
    generated_at: "2026-05-02T23:39:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

Stato: l’interfaccia chat SwiftUI macOS/iOS comunica direttamente con il WebSocket del Gateway.

## Che cos’è

- Un’interfaccia chat nativa per il gateway (senza browser incorporato e senza server statico locale).
- Usa le stesse sessioni e regole di routing degli altri canali.
- Routing deterministico: le risposte tornano sempre a WebChat.

## Avvio rapido

1. Avvia il gateway.
2. Apri l’interfaccia WebChat (app macOS/iOS) o la scheda chat della Control UI.
3. Assicurati che sia configurato un percorso di autenticazione gateway valido (shared-secret per impostazione predefinita,
   anche su loopback).

## Come funziona (comportamento)

- L’interfaccia si connette al WebSocket del Gateway e usa `chat.history`, `chat.send`, `chat.inject` e `chat.transcribeAudio`.
- `chat.history` è limitato per stabilità: il Gateway può troncare campi di testo lunghi, omettere metadati pesanti e sostituire voci sovradimensionate con `[chat.history omitted: message too large]`.
- `chat.history` segue il ramo della trascrizione attiva per i file di sessione moderni in sola append, quindi i rami di riscrittura abbandonati e le copie di prompt sostituite non vengono renderizzati in WebChat.
- La Control UI ricorda il `sessionId` del Gateway sottostante restituito da `chat.history` e lo include nelle successive chiamate `chat.send`, quindi le riconnessioni e gli aggiornamenti della pagina continuano la stessa conversazione memorizzata, a meno che l’utente non avvii o reimposti una sessione.
- La Control UI accorpa gli invii duplicati in corso per la stessa sessione, lo stesso messaggio e gli stessi allegati prima di generare un nuovo id di esecuzione `chat.send`; il Gateway deduplica comunque le richieste ripetute che riutilizzano la stessa chiave di idempotenza.
- `chat.history` è anche normalizzato per la visualizzazione: il contesto OpenClaw solo runtime,
  i wrapper degli envelope in ingresso, i tag inline delle direttive di consegna
  come `[[reply_to_*]]` e `[[audio_as_voice]]`, i payload XML in testo semplice delle chiamate agli strumenti
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e i blocchi di chiamata agli strumenti troncati), e
  i token di controllo del modello ASCII/full-width trapelati vengono rimossi dal testo visibile,
  e le voci dell’assistente il cui intero testo visibile è solo il token silenzioso esatto
  `NO_REPLY` / `no_reply` vengono omesse.
- I payload di risposta contrassegnati come ragionamento (`isReasoning: true`) sono esclusi dal contenuto dell’assistente in WebChat, dal testo di replay della trascrizione e dai blocchi di contenuto audio, quindi i payload di solo ragionamento non emergono come messaggi visibili dell’assistente o audio riproducibile.
- `chat.transcribeAudio` alimenta la dettatura lato server nel compositore chat della Control UI. Il browser registra l’audio del microfono, lo invia al Gateway in base64 e il Gateway esegue la pipeline `tools.media.audio` configurata. La trascrizione restituita viene inserita nella bozza; nessuna esecuzione dell’agente viene avviata finché l’utente non la invia.
- `chat.inject` aggiunge una nota dell’assistente direttamente alla trascrizione e la trasmette all’interfaccia (nessuna esecuzione dell’agente).
- Le esecuzioni interrotte possono mantenere visibile nell’interfaccia l’output parziale dell’assistente.
- Il Gateway persiste il testo parziale interrotto dell’assistente nella cronologia della trascrizione quando esiste output bufferizzato, e contrassegna tali voci con metadati di interruzione.
- La cronologia viene sempre recuperata dal gateway (nessun monitoraggio di file locali).
- Se il gateway non è raggiungibile, WebChat è in sola lettura.

## Pannello strumenti degli agenti della Control UI

- Il pannello Strumenti `/agents` della Control UI ha due viste separate:
  - **Disponibili ora** usa `tools.effective(sessionKey=...)` e mostra ciò che la sessione corrente
    può effettivamente usare a runtime, inclusi strumenti core, Plugin e di proprietà del canale.
  - **Configurazione strumenti** usa `tools.catalog` e resta focalizzato su profili, override e
    semantica del catalogo.
- La disponibilità runtime è limitata alla sessione. Cambiare sessione sullo stesso agente può modificare l’elenco
  **Disponibili ora**.
- L’editor di configurazione non implica disponibilità runtime; l’accesso effettivo segue comunque la precedenza delle policy
  (`allow`/`deny`, override per agente e provider/canale).

## Uso remoto

- La modalità remota esegue il tunneling del WebSocket del gateway tramite SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento di configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni WebChat:

- `gateway.webchat.chatHistoryMaxChars`: numero massimo di caratteri per i campi di testo nelle risposte `chat.history`. Quando una voce di trascrizione supera questo limite, il Gateway tronca i campi di testo lunghi e può sostituire i messaggi sovradimensionati con un segnaposto. Anche `maxChars` per richiesta può essere inviato dal client per sovrascrivere questo valore predefinito per una singola chiamata `chat.history`.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket shared-secret.
- `gateway.auth.allowTailscale`: la scheda chat della Control UI nel browser può usare le intestazioni di identità Tailscale
  Serve quando abilitate.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse-proxy per client browser dietro una sorgente proxy **non-loopback** consapevole dell’identità (vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione del gateway remoto.
- `session.*`: archiviazione delle sessioni e valori predefiniti della chiave principale.

## Correlati

- [Control UI](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)

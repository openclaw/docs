---
read_when:
    - Debug o configurazione dell'accesso a WebChat
summary: Host statico WebChat su loopback e utilizzo del WebSocket del Gateway per l'interfaccia di chat
title: WebChat
x-i18n:
    generated_at: "2026-07-16T15:03:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Stato: l'interfaccia chat SwiftUI per macOS/iOS comunica direttamente con il WebSocket del Gateway. Nessun browser incorporato, nessun server statico locale.

## Che cos'è

- Un'interfaccia chat nativa per il Gateway.
- Utilizza le stesse sessioni e regole di instradamento degli altri canali.
- Instradamento deterministico: le risposte tornano sempre a WebChat.
- La cronologia viene sempre recuperata dal Gateway (senza monitoraggio dei file locali). Se il Gateway non è raggiungibile, WebChat è in sola lettura.

## Avvio rapido

1. Avviare il Gateway.
2. Aprire l'interfaccia WebChat (app macOS/iOS) o la scheda della chat dell'interfaccia di controllo.
3. Assicurarsi che sia configurato un percorso di autenticazione valido per il Gateway (per impostazione predefinita con segreto condiviso, anche su loopback).

## Funzionamento

- L'interfaccia si connette al WebSocket del Gateway e utilizza i metodi RPC `chat.history`, `chat.send`, `chat.inject` e `chat.message.get`.
- `chat.history` è limitato per garantire la stabilità: il Gateway può troncare i campi di testo lunghi, omettere metadati pesanti e sostituire le voci sovradimensionate con `[chat.history omitted: message too large]`. I client API possono inviare un valore `maxChars` per ogni richiesta per sostituire il limite predefinito per una singola chiamata.
- Quando un messaggio visibile dell'assistente è stato troncato in `chat.history`, l'interfaccia di controllo può aprire un lettore laterale e recuperare su richiesta la voce completa normalizzata per la visualizzazione tramite `chat.message.get`, senza aumentare il payload predefinito della cronologia. `chat.message.get` utilizza lo stesso ramo della trascrizione e le stesse regole di visualizzazione di `chat.history`, ma seleziona una singola voce tramite `messageId` e restituisce una motivazione veritiera di indisponibilità quando non è più possibile restituire il contenuto completo.
- `chat.history` segue il ramo attivo della trascrizione per i file di sessione di sola aggiunta, quindi i rami di riscrittura abbandonati e le copie sostituite dei prompt non vengono visualizzati in WebChat.
- Le voci di Compaction vengono visualizzate come un divisore "Cronologia compattata" che spiega che la trascrizione compattata viene conservata come checkpoint, con un'azione per aprire i checkpoint della sessione (creazione di un ramo o ripristino, se le autorizzazioni lo consentono).
- L'interfaccia di controllo memorizza il valore `sessionId` del Gateway sottostante restituito da `chat.history` e lo include nelle chiamate successive a `chat.send`, affinché le riconnessioni e gli aggiornamenti della pagina continuino la stessa conversazione archiviata, a meno che non venga avviata o reimpostata una sessione.
- `chat.send` accetta una chiave di idempotenza (l'interfaccia di controllo utilizza l'ID dell'esecuzione); il Gateway deduplica le richieste ripetute che riutilizzano la stessa chiave, quindi i nuovi tentativi o gli invii duplicati in corso per la stessa sessione, lo stesso messaggio e gli stessi allegati non creano una seconda esecuzione.
- I file di avvio dell'area di lavoro e le istruzioni `BOOTSTRAP.md` in sospeso vengono forniti tramite la sezione `# Project Context` del prompt di sistema dell'agente, anziché essere copiati nel messaggio utente di WebChat. Se il contenuto di bootstrap viene troncato, il prompt di sistema riceve invece un breve "Avviso sul contesto di bootstrap"; i conteggi dettagliati e le opzioni di configurazione rimangono nelle superfici diagnostiche.
- La normalizzazione della visualizzazione su `chat.history` rimuove: il contesto OpenClaw destinato esclusivamente al runtime, i wrapper delle buste in ingresso, i tag delle direttive di consegna incorporati come `[[reply_to_current]]`, `[[reply_to:<id>]]` e `[[audio_as_voice]]`, i payload XML in testo normale delle chiamate agli strumenti (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, inclusi i blocchi troncati) e i token di controllo del modello ASCII/a larghezza intera trapelati. Le voci dell'assistente il cui intero testo visibile è costituito esclusivamente dal token silenzioso `NO_REPLY` (senza distinzione tra maiuscole e minuscole) vengono omesse.
- I payload di risposta contrassegnati come ragionamento (`isReasoning: true`) vengono esclusi dal contenuto dell'assistente di WebChat, dal testo di riproduzione della trascrizione e dai blocchi di contenuto audio, affinché i payload contenenti solo il ragionamento non vengano presentati come messaggi visibili dell'assistente o audio riproducibile.
- `chat.inject` aggiunge una nota dell'assistente direttamente alla trascrizione e la trasmette all'interfaccia (senza esecuzione dell'agente).
- Le esecuzioni interrotte possono mantenere visibile nell'interfaccia l'output parziale dell'assistente. Quando esiste un output nel buffer, il Gateway conserva il testo parziale nella cronologia della trascrizione e contrassegna la voce con metadati di interruzione.

### Modello di trascrizione e consegna

WebChat dispone di due percorsi dati separati:

- Le righe della trascrizione SQLite costituiscono la trascrizione persistente del modello/runtime. Per le normali esecuzioni dell'agente, il runtime OpenClaw incorporato conserva i messaggi `user`, `assistant` e `toolResult` visibili al modello tramite la funzione di accesso alla sessione. WebChat non scrive in tale trascrizione testi arbitrari relativi alla consegna, allo stato o alle funzioni ausiliarie.
- Gli eventi `ReplyPayload` del Gateway costituiscono la proiezione di consegna in tempo reale: normalizzata per la visualizzazione in WebChat/nel canale, lo streaming a blocchi, i tag delle direttive, l'incorporamento dei contenuti multimediali, i flag TTS/audio e il comportamento di ripiego dell'interfaccia. Non costituiscono di per sé il registro canonico della sessione.
- Gli harness che richiedono risposte visibili tramite `tools.message` continuano a utilizzare WebChat come destinazione interna delle risposte di origine per l'esecuzione corrente. Un `message.send` senza destinazione proveniente da tale esecuzione WebChat attiva viene proiettato nella stessa chat e replicato nella trascrizione della sessione; WebChat non diventa un canale di uscita riutilizzabile e non eredita mai `lastChannel`.
- WebChat inserisce le voci dell'assistente nella trascrizione soltanto quando il Gateway gestisce un messaggio visualizzato al di fuori di un normale turno dell'agente incorporato: `chat.inject`, risposte a comandi non gestite dall'agente, output parziale interrotto e integrazioni multimediali della trascrizione gestite da WebChat.
- Se il testo dell'assistente appare in tempo reale durante un'esecuzione ma scompare dopo il ricaricamento della cronologia, verificare nell'ordine: se la trascrizione SQLite contiene il testo dell'assistente, se la proiezione di visualizzazione `chat.history` lo ha rimosso e quindi se l'unione ottimistica della parte finale dell'interfaccia di controllo ha sostituito lo stato di consegna locale con l'istantanea persistente.

Le risposte finali delle normali esecuzioni dell'agente dovrebbero essere persistenti perché il runtime incorporato scrive il valore `message_end` dell'assistente. Qualsiasi meccanismo di ripiego che replica nella trascrizione un payload finale consegnato deve innanzitutto evitare di duplicare un turno dell'assistente già scritto dal runtime incorporato.

## Pannello degli strumenti degli agenti dell'interfaccia di controllo

- Il pannello Strumenti `/agents` dell'interfaccia di controllo presenta una vista "Disponibili in questo momento" basata su `tools.effective(sessionKey=...)`: una proiezione di sola lettura, derivata dal server, dell'inventario degli strumenti della sessione corrente, inclusi quelli principali, dei Plugin, appartenenti ai canali e dei server MCP già rilevati.
- Una vista separata per la modifica della configurazione (basata su `tools.catalog`) comprende i profili, le sostituzioni specifiche per agente e la semantica del catalogo.
- La disponibilità del runtime è limitata alla sessione. Cambiare sessione sullo stesso agente può modificare l'elenco "Disponibili in questo momento". Se i server MCP configurati non sono stati connessi o sono stati modificati dopo l'ultimo rilevamento, il pannello mostra un avviso anziché avviare silenziosamente i trasporti MCP dal percorso di lettura.
- L'editor di configurazione non implica la disponibilità nel runtime; l'accesso effettivo continua a seguire la precedenza dei criteri (`allow`/`deny`, sostituzioni specifiche per agente, provider e canale).

## Utilizzo remoto

- La modalità remota incanala il WebSocket del Gateway tramite SSH/Tailscale.
- Non è necessario eseguire un server WebChat separato.

## Riferimento di configurazione (WebChat)

Configurazione completa: [Configurazione](/it/gateway/configuration)

WebChat non dispone di una sezione di configurazione persistente. Il Gateway utilizza il limite di visualizzazione `chat.history` integrato; i client API possono inviare `maxChars` per ogni richiesta per sostituirlo per una singola chiamata. La configurazione precedente `channels.webchat` e `gateway.webchat` è stata ritirata; eseguire `openclaw doctor --fix` per rimuoverla.

Opzioni globali correlate:

- `gateway.port`, `gateway.bind`: host/porta WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticazione WebSocket con segreto condiviso.
- `gateway.auth.allowTailscale`: la scheda della chat dell'interfaccia di controllo nel browser può utilizzare le intestazioni di identità
  di Tailscale Serve quando abilitate.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione tramite proxy inverso per i client browser dietro un'origine proxy **non-loopback** che riconosce l'identità (consultare [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destinazione del Gateway remoto.
- `session.*`: archiviazione delle sessioni e valori predefiniti della chiave principale.

## Argomenti correlati

- [Interfaccia di controllo](/it/web/control-ui)
- [Dashboard](/it/web/dashboard)

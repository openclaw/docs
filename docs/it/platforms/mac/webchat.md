---
read_when:
    - Debug della vista WebChat su Mac o della porta local loopback
summary: Come l'app per Mac integra la WebChat del Gateway e come eseguirne il debug
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T07:14:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

L'app della barra dei menu di macOS incorpora l'interfaccia WebChat come vista SwiftUI nativa. Si connette al Gateway e usa per impostazione predefinita la sessione principale dell'agente selezionato (`main` oppure `global` quando `session.scope` è `global`).

La finestra di chat completa è una vista divisa nativa:

- **Barra laterale delle sessioni**: elenco ricercabile delle sessioni con sezioni per quelle fissate e recenti, indicatori dei messaggi non letti e menu contestuali per fissare/rimuovere, copiare la chiave di sessione ed eliminare. Un pulsante della barra degli strumenti (o Cmd-N) crea una nuova sessione effettiva tramite `sessions.create`.
- **Barra degli strumenti della finestra**: indicatore circolare dell'utilizzo del contesto (token e costo della sessione, con un'azione compatta), selettore del livello di ragionamento, selettore del modello e menu delle azioni della sessione (nuova sessione, aggiorna, copia la chiave di sessione, esporta la trascrizione, esegui la Compaction, cancella la cronologia).
- **Trascrizione e campo di composizione**: i messaggi dell'assistente vengono visualizzati come testo semplice con un avatar, mentre quelli dell'utente come fumetti con colore in risalto. Digitando `/` si apre il completamento automatico dei comandi slash basato su `commands.list`, con navigazione da tastiera tramite frecce/Tab/Invio/Esc. Fai clic con il pulsante destro su un messaggio per copiarlo.

Il pannello di chat rapida ancorato alla barra dei menu mantiene il layout compatto a colonna singola con selettori incorporati.

- **Modalità locale**: si connette direttamente al WebSocket del Gateway locale.
- **Modalità remota**: inoltra la porta di controllo del Gateway tramite SSH e utilizza questo tunnel come piano dati.

## Avvio e debug

- Manuale: menu Lobster -> "Open Chat".
- Apertura automatica per i test:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` è accettato come alias legacy.)

- Log: `./scripts/clawlog.sh` (sottosistema `ai.openclaw`, categoria `WebChatSwiftUI`).

## Come è collegato

- Piano dati: metodi WS del Gateway `chat.history`, `chat.send`, `chat.abort`, `chat.inject` ed eventi `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` restituisce una trascrizione normalizzata per la visualizzazione: i tag delle direttive incorporate vengono rimossi dal testo visibile; i payload XML delle chiamate agli strumenti in testo semplice (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, inclusi i blocchi troncati) e i token di controllo del modello fuoriusciti vengono rimossi; le righe dell'assistente contenenti esclusivamente token silenziosi, come esattamente `NO_REPLY`/`no_reply`, vengono omesse; le righe di dimensioni eccessive possono essere sostituite con un segnaposto troncato.
- Sessione: per impostazione predefinita usa la sessione principale come indicato sopra; l'interfaccia può passare da una sessione all'altra.
- La procedura di configurazione iniziale usa una sessione dedicata per mantenere separata la configurazione del primo avvio.
- Cache offline: l'app conserva una piccola cache di sola lettura delle sessioni di chat e delle trascrizioni recenti per ciascun Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): all'avvio a freddo mostra immediatamente l'ultima trascrizione nota e la aggiorna non appena il Gateway risponde; inoltre, le chat recenti restano consultabili mentre non è disponibile una connessione (l'invio rimane disabilitato finché la connessione non viene ripristinata).

## Superficie di sicurezza

- La modalità remota inoltra tramite SSH solo la porta di controllo WebSocket del Gateway.

## Limitazioni note

- L'interfaccia è ottimizzata per le sessioni di chat, non come ambiente sandbox completo per browser.

## Pagine correlate

- [WebChat](/it/web/webchat)
- [App macOS](/it/platforms/macos)

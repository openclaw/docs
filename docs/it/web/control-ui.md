---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi l'accesso Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia utente di controllo basata su browser per il Gateway (chat, attività, nodi, configurazione)
title: Interfaccia utente di controllo
x-i18n:
    generated_at: "2026-07-04T18:04:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

La Control UI è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

<Note>
Nei binding LAN nativi di Windows, Windows Firewall o i Criteri di gruppo gestiti dall'organizzazione possono comunque bloccare l'URL LAN annunciato anche quando `127.0.0.1` funziona sull'host del Gateway. Esegui `openclaw gateway status --deep` sull'host Windows; segnala porte probabilmente bloccate, profili non corrispondenti e regole firewall locali che i criteri potrebbero ignorare.
</Note>

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- intestazioni di identità di Tailscale Serve quando `gateway.auth.allowTailscale: true`
- intestazioni di identità del proxy attendibile quando `gateway.auth.mode: "trusted-proxy"`

Il pannello impostazioni della dashboard conserva un token per la sessione corrente della scheda del browser e per l'URL del gateway selezionato; le password non vengono persistite. L'onboarding di solito genera un token gateway per l'autenticazione con segreto condiviso alla prima connessione, ma anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti alla Control UI da un nuovo browser o dispositivo, il Gateway di solito richiede un'**approvazione di associazione una tantum**. È una misura di sicurezza per impedire accessi non autorizzati.

**Cosa vedrai:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Elenca le richieste in sospeso">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approva tramite ID richiesta">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Se il browser ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo modifichi da accesso in lettura ad accesso in scrittura/admin, questo viene trattato come un upgrade dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI dispositivi](/it/cli/devices) per la rotazione e la revoca dei token.

Gli agenti Paperclip che si connettono tramite l'adapter `openclaw_gateway` usano lo stesso flusso di approvazione al primo avvio. Dopo il tentativo di connessione iniziale, esegui `openclaw devices approve --latest` per visualizzare in anteprima la richiesta in sospeso, quindi riesegui il comando `openclaw devices approve <requestId>` stampato per approvarla. Passa valori espliciti `--url` e `--token` per un gateway remoto. Per mantenere stabili le approvazioni tra i riavvii, configura in Paperclip un `adapterConfig.devicePrivateKeyPem` persistente invece di lasciare che generi una nuova identità dispositivo effimera a ogni esecuzione.

<Note>
- Le connessioni browser dirette tramite local loopback (`127.0.0.1` / `localhost`) sono approvate automaticamente.
- Tailscale Serve può saltare il round trip di associazione per le sessioni operatore della Control UI quando `gateway.auth.allowTailscale: true`, l'identità Tailscale è verificata e il browser presenta la propria identità dispositivo.
- I binding Tailnet diretti, le connessioni browser LAN e i profili browser senza identità dispositivo richiedono comunque un'approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Associare un dispositivo mobile

Un amministratore già associato può creare il QR di connessione iOS/Android senza
aprire un terminale:

<Steps>
  <Step title="Apri associazione mobile">
    Seleziona **Nodi**, quindi fai clic su **Associa dispositivo mobile** nella scheda **Dispositivi**.
  </Step>
  <Step title="Connetti il telefono">
    Nell'app mobile OpenClaw, apri **Impostazioni** → **Gateway** e scansiona il codice QR
    code. In alternativa puoi copiare e incollare il codice di configurazione.
  </Step>
  <Step title="Conferma la connessione">
    L'app ufficiale iOS/Android si connette automaticamente. Se **Dispositivi** mostra una
    richiesta in sospeso, rivedine ruolo e ambiti prima di approvarla.
  </Step>
</Steps>

La creazione di un codice di configurazione richiede `operator.admin`; il pulsante è disabilitato per
le sessioni che ne sono prive. Un codice di configurazione contiene una credenziale bootstrap di breve durata,
quindi tratta il QR e il codice copiato come una password finché sono validi. Per l'associazione remota,
il Gateway deve risolversi in `wss://` (ad esempio, tramite Tailscale
Serve/Funnel); `ws://` semplice è limitato al loopback e agli indirizzi LAN privati.
Consulta [Associazione](/it/channels/pairing#pair-from-the-control-ui-recommended) per i
dettagli completi su sicurezza e fallback.

## Identità personale (locale al browser)

La Control UI supporta un'identità personale per browser (nome visualizzato e avatar) allegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Risiede nello storage del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né persistita lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuoto.

Lo stesso pattern locale al browser si applica alla sostituzione dell'avatar dell'assistente. Gli avatar dell'assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non effettuano mai un round trip tramite `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per i client non UI che scrivono direttamente il campo (come gateway con script o dashboard personalizzate).

## Endpoint di configurazione runtime

La Control UI recupera le proprie impostazioni runtime da `/control-ui-config.json`, risolto rispetto al percorso base della Control UI del gateway (ad esempio `/__openclaw__/control-ui-config.json` quando l'interfaccia è servita sotto `/__openclaw__/`). L'endpoint è protetto dalla stessa autenticazione del gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo, e un recupero riuscito richiede un token/password del gateway già valido, l'identità Tailscale Serve o un'identità proxy attendibile.

## Supporto linguistico

La Control UI può localizzarsi al primo caricamento in base alla lingua del browser. Per sovrascriverla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il selettore della lingua si trova nella scheda Accesso Gateway, non in Aspetto.

- Locali supportati: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ricadono sull'inglese.

Le traduzioni della documentazione vengono generate per lo stesso insieme di locali non inglesi, ma il selettore lingua Mintlify integrato del sito della documentazione è limitato ai codici locale accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repo di pubblicazione; potrebbe non apparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi di aspetto

Il pannello Aspetto mantiene i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

Aspetto include anche un'impostazione locale al browser per la dimensione del testo. L'impostazione viene archiviata con il resto delle preferenze della Control UI, si applica al testo della chat, al testo del compositore, alle schede degli strumenti e alle barre laterali della chat, e mantiene gli input di testo ad almeno 16px così Safari mobile non esegue lo zoom automatico al focus.

I temi importati vengono archiviati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e Talk">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Gli aggiornamenti della cronologia chat richiedono una finestra recente limitata con limiti di testo per messaggio, così le sessioni grandi non costringono il browser a renderizzare un payload completo della trascrizione prima che la chat diventi utilizzabile.
    - Parla tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser monouso vincolato su WebSocket, e i Plugin vocali realtime solo backend usano il trasporto relay del Gateway. Le sessioni provider possedute dal client iniziano con `talk.client.create`; le sessioni relay del Gateway iniziano con `talk.session.create`. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM del microfono tramite `talk.session.appendAudio`, inoltra le chiamate strumento del provider `openclaw_agent_consult` tramite `talk.client.toolCall` per la policy del Gateway e il modello OpenClaw configurato più grande, e instrada la guida vocale dell'esecuzione attiva tramite `talk.client.steer` o `talk.session.steer`.
    - Trasmetti chiamate strumento + schede output strumento live in Chat (eventi agente).
    - Scheda Attività con riepiloghi locali al browser, redatti prima di tutto, dell'attività live degli strumenti dalla consegna esistente di eventi `session.tool` / strumento.

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: stato dei canali integrati più Plugin in bundle/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Gli aggiornamenti delle sonde dei canali mantengono visibile lo snapshot precedente mentre i controlli lenti dei provider terminano, e gli snapshot parziali vengono etichettati quando una sonda o un audit supera il suo budget UI.
    - Istanze: elenco presenze + aggiornamento (`system-presence`).
    - Sessioni: elenca per impostazione predefinita le sessioni degli agenti configurati, esegue il fallback dalle chiavi di sessione agenti non configurati obsolete e applica override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sogni: stato di dreaming, interruttore abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodi, approvazioni exec">
    - Job Cron: elenca/aggiungi/modifica/esegui/abilita/disabilita + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti chiave API (`skills.*`).
    - Nodi: elenco + capacità (`node.list`), crea codici di configurazione mobile e approva l'associazione dispositivo (`device.pair.*`).
    - Approvazioni exec: modifica allowlist gateway o nodo + criterio di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP ha una pagina delle impostazioni dedicata per server configurati, abilitazione, riepiloghi OAuth/filtro/paralleli, comandi operatore comuni e l'editor di configurazione `mcp` con ambito.
    - Applica + riavvia con validazione (`config.apply`) e riattiva l'ultima sessione attiva.
    - Le scritture includono una protezione con hash di base per evitare di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) eseguono un controllo preliminare della risoluzione SecretRef attiva per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - I salvataggi del modulo scartano i placeholder redatti obsoleti che non possono essere ripristinati dalla configurazione salvata, preservando i valori redatti che corrispondono ancora ai segreti salvati.
    - Rendering dello schema + modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` dei campi, suggerimenti UI corrispondenti, riepiloghi dei figli immediati, metadati della documentazione sui nodi oggetto nidificato/jolly/array/composizione, oltre agli schemi Plugin + canale quando disponibili); l'editor JSON grezzo è disponibile solo quando lo snapshot ha un round trip grezzo sicuro.
    - Se uno snapshot non può eseguire in sicurezza il round trip del testo grezzo, Control UI forza la modalità Modulo e disabilita la modalità Grezza per quello snapshot.
    - Nell'editor JSON grezzo, "Ripristina salvato" preserva la forma scritta in grezzo (formattazione, commenti, layout `$include`) invece di rieseguire il rendering di uno snapshot appiattito, quindi le modifiche esterne sopravvivono a un ripristino quando lo snapshot può eseguire in sicurezza il round trip.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per prevenire corruzioni accidentali da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot di stato/integrità/modelli + registro eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il registro eventi include tempi di refresh/RPC della Control UI, tempi di rendering lento di chat/configurazione e voci di reattività del browser per frame di animazione lunghi o attività lunghe quando il browser espone quei tipi di voci PerformanceObserver.
    - Log: tail live dei log file del Gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio, poi interroga `update.status` dopo la riconnessione per verificare la versione del Gateway in esecuzione.

  </Accordion>
  <Accordion title="Note del pannello dei processi Cron">
    - Per processi isolati, la consegna predefinita annuncia il riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/destinazione appaiono quando annuncio è selezionato.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL Webhook HTTP(S) valido.
    - Per processi della sessione principale, sono disponibili le modalità di consegna Webhook e nessuna.
    - I controlli di modifica avanzati includono elimina dopo l'esecuzione, cancella override agente, opzioni cron esatto/scaglionato, override del modello/thinking dell'agente e toggle di consegna best-effort.
    - La validazione del modulo è inline con errori a livello di campo; i valori non validi disabilitano il pulsante Salva finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il webhook viene inviato senza header di autenticazione.
    - Fallback deprecato: esegui `openclaw doctor --fix` per migrare i processi legacy archiviati con `notify: true` da `cron.webhook` a webhook esplicito per processo o consegna al completamento.

  </Accordion>
</AccordionGroup>

## Pagina MCP

La pagina MCP dedicata è una vista operatore per i server MCP gestiti da OpenClaw sotto `mcp.servers`. Non avvia i trasporti MCP da sola; usala per ispezionare e modificare la configurazione salvata, poi usa `openclaw mcp doctor --probe` quando hai bisogno di una prova live del server.

Flusso di lavoro tipico:

1. Apri **MCP** dalla barra laterale.
2. Controlla le schede di riepilogo per i conteggi totali, abilitati, OAuth e server filtrati.
3. Rivedi ogni riga del server per trasporto, abilitazione, autenticazione, filtri, timeout e suggerimenti di comando.
4. Attiva/disattiva l'abilitazione quando un server deve rimanere configurato ma restare fuori dal rilevamento runtime.
5. Modifica la sezione di configurazione `mcp` con ambito per definizioni server, header, percorsi TLS/mTLS, metadati OAuth, filtri degli strumenti e metadati di proiezione Codex.
6. Usa **Salva** per una scrittura di configurazione, oppure **Salva e pubblica** quando il Gateway in esecuzione deve applicare la configurazione modificata.
7. Esegui `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` da un terminale quando il processo modificato richiede diagnostica statica, prova live o eliminazione del runtime memorizzato nella cache.

La pagina redige i valori simili a URL che contengono credenziali prima del rendering e mette tra virgolette i nomi dei server negli snippet di comando, così i comandi copiati continuano a funzionare con spazi o metacaratteri della shell. Il riferimento completo di CLI e configurazione si trova in [MCP](/it/cli/mcp).

## Scheda Attività

La scheda Attività è un osservatore effimero locale del browser per l'attività live degli strumenti. Deriva dallo stesso flusso di eventi `session.tool` / strumento del Gateway che alimenta le schede strumenti della Chat; non aggiunge un'altra famiglia di eventi del Gateway, endpoint, archivio attività durevole, feed di metriche o flusso osservatore esterno.

Le voci Attività conservano solo riepiloghi sanificati e anteprime di output redatte e troncate. I valori degli argomenti degli strumenti non vengono archiviati nello stato Attività; la UI mostra che gli argomenti sono nascosti e registra solo il conteggio dei campi argomento. L'elenco in memoria segue la scheda corrente del browser, sopravvive alla navigazione dentro la Control UI e si reimposta al ricaricamento della pagina, al cambio sessione o con **Cancella**.

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`. I client Control UI attendibili possono anche ricevere metadati opzionali sui tempi di ACK per la diagnostica locale.
    - I caricamenti chat accettano immagini più file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link allegati.
    - Reinviare con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
    - Le risposte `chat.history` sono limitate in dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire messaggi sovradimensionati con un placeholder (`[chat.history omitted: message too large]`).
    - Quando un messaggio assistente visibile è stato troncato in `chat.history`, il lettore laterale può recuperare su richiesta l'intera voce della trascrizione normalizzata per la visualizzazione tramite `chat.message.get` usando `sessionKey`, `agentId` attivo quando necessario e `messageId` della trascrizione. Se il Gateway continua a non poter restituire altro, il lettore mostra uno stato esplicito non disponibile invece di ripetere silenziosamente l'anteprima troncata.
    - Le immagini assistente/generate vengono persistite come riferimenti a media gestiti e servite di nuovo tramite URL media autenticati del Gateway, quindi i ricaricamenti non dipendono dal fatto che i payload immagine base64 grezzi restino nella risposta della cronologia chat.
    - Durante il rendering di `chat.history`, la Control UI rimuove dal testo visibile dell'assistente i tag direttiva inline solo di visualizzazione (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata strumento in testo normale (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati) e i token di controllo modello ASCII/a larghezza piena trapelati, e omette le voci assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply` o il token di conferma Heartbeat `HEARTBEAT_OK`.
    - Durante un invio attivo e il refresh finale della cronologia, la vista chat mantiene visibili i messaggi locali ottimistici utente/assistente se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia del Gateway si aggiorna.
    - Gli eventi live `chat` sono stato di consegna, mentre `chat.history` viene ricostruita dalla trascrizione durevole della sessione. Dopo gli eventi finali degli strumenti, la Control UI ricarica la cronologia e unisce solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessuna consegna canale).
    - La barra laterale elenca le sessioni recenti con un'azione Nuova sessione, un link Tutte le sessioni e un pulsante di ricerca sessione che apre il selettore completo delle sessioni (con ambito sull'agente selezionato, ricerca e paginazione). Cambiare agente mostra solo le sessioni associate a quell'agente e ripiega sulla sessione principale di quell'agente quando non ha ancora sessioni dashboard salvate.
    - Su larghezze desktop, i controlli chat restano su una riga compatta e si comprimono durante lo scorrimento verso il basso nella trascrizione; scorrere verso l'alto, tornare in cima o raggiungere il fondo ripristina i controlli.
    - I messaggi consecutivi duplicati di solo testo vengono renderizzati come una singola bolla con badge di conteggio. I messaggi che contengono immagini, allegati, output di strumenti o anteprime canvas restano non compressi.
    - I selettori di modello e thinking dell'intestazione chat applicano immediatamente una patch alla sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide per un solo turno.
    - Se invii un messaggio mentre una modifica del selettore di modello per la stessa sessione è ancora in salvataggio, il composer attende quella patch di sessione prima di chiamare `chat.send`, così l'invio usa il modello selezionato.
    - Digitare `/new` nella Control UI crea e passa alla stessa nuova sessione dashboard di Nuova chat, tranne quando `session.dmScope: "main"` è configurato e il parent corrente è la sessione principale dell'agente; in quel caso reimposta la sessione principale sul posto. Digitare `/reset` mantiene il reset esplicito sul posto del Gateway per la sessione corrente.
    - Il selettore modello della chat richiede la vista modelli configurata del Gateway. Se `agents.defaults.models` è presente, quell'allowlist guida il selettore, incluse le voci `provider/*` che mantengono dinamici i cataloghi con ambito provider. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite l'RPC di debug `models.list` con `view: "all"`.
    - Quando i report freschi sull'uso della sessione del Gateway includono i token di contesto correnti, la barra strumenti del composer chat mostra un piccolo anello di utilizzo del contesto con la percentuale usata; il dettaglio completo dei token si trova nel suo tooltip. L'anello passa allo stile di avviso con alta pressione di contesto e, ai livelli di Compaction raccomandati, mostra un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot token obsoleti sono nascosti finché il Gateway non segnala di nuovo un utilizzo fresco.

  </Accordion>
  <Accordion title="Modalità conversazione (realtime del browser)">
    La modalità conversazione usa un provider voce realtime registrato. Configura OpenAI con `talk.realtime.provider: "openai"` più un profilo di autenticazione con chiave API `openai`, `talk.realtime.providers.openai.apiKey` o `OPENAI_API_KEY`; i profili OAuth OpenAI non configurano la voce Realtime. Configura Google con `talk.realtime.provider: "google"` più `talk.realtime.providers.google.apiKey`. Il browser non riceve mai una chiave API provider standard. OpenAI riceve un segreto client Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay del Gateway, quindi credenziali e socket del fornitore restano lato server mentre l'audio del browser passa tramite RPC autenticati del Gateway. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.client.create` non accetta override delle istruzioni forniti dal chiamante.

    Il compositore Chat include un pulsante di opzioni Talk accanto al pulsante di avvio/arresto Talk. Le opzioni si applicano alla sessione Talk successiva e possono sovrascrivere provider, trasporto, modello, voce, reasoning effort, soglia VAD, durata del silenzio e padding del prefisso. Quando un'opzione è vuota, il Gateway usa i valori predefiniti configurati dove disponibili o il valore predefinito del provider. Selezionare il relay Gateway forza il percorso relay del backend; selezionare WebRTC mantiene la sessione di proprietà del client e la fa fallire invece di passare silenziosamente al relay se il provider non può creare una sessione browser.

    Nel compositore Chat, il controllo Talk è il pulsante a onde accanto al pulsante del microfono per la dettatura. Quando Talk si avvia, la riga di stato del compositore mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata tool in tempo reale consulta il modello più grande configurato tramite `talk.client.toolCall`.

    Smoke live manutentore: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica il bridge WebSocket backend OpenAI, lo scambio SDP WebRTC browser OpenAI, la configurazione WebSocket browser Google Live con token vincolati e l'adattatore browser relay del Gateway con media microfono finti. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Interrompere e annullare">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i normali follow-up vengono accodati. Fai clic su **Steer** su un messaggio accodato per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di annullamento come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per annullare fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per annullare tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale dopo annullamento">
    - Quando un'esecuzione viene annullata, il testo parziale dell'assistente può comunque essere mostrato nell'interfaccia utente.
    - Il Gateway persiste il testo parziale annullato dell'assistente nella cronologia della trascrizione quando esiste output bufferizzato.
    - Le voci persistite includono metadati di annullamento, così i consumatori della trascrizione possono distinguere i parziali annullati dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e web push

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

Se la pagina mostra **Protocol mismatch** subito dopo un aggiornamento di OpenClaw, prima riapri la dashboard con `openclaw dashboard` ed esegui un aggiornamento completo della pagina. Se il problema persiste, cancella i dati del sito per l'origine della dashboard oppure prova in una finestra di navigazione privata; una vecchia scheda o la cache del service worker del browser può continuare a eseguire un bundle Control UI precedente all'aggiornamento contro il Gateway più nuovo.

| Superficie                                             | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (sotto la dir di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare i payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione browser persistiti.                     |

Sovrascrivi la coppia di chiavi VAPID tramite variabili d'ambiente sul processo Gateway quando vuoi fissare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito: `https://openclaw.ai`)

La Control UI usa questi metodi Gateway limitati per ambito per registrare e testare le sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay APNS iOS (vedi [Configurazione](/it/gateway/configuration) per il push con relay) e dal metodo `push.test` esistente, che ha come destinazione l'associazione mobile nativa.
</Note>

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuto web ospitato inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script all'interno degli embed ospitati.
  </Tab>
  <Tab title="scripts (predefinito)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; è il valore predefinito e di solito è sufficiente per giochi/widget browser autonomi.
  </Tab>
  <Tab title="trusted">
    Aggiunge `allow-same-origin` sopra `allow-scripts` per documenti dello stesso sito che richiedono intenzionalmente privilegi più forti.
  </Tab>
</Tabs>

Esempio:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Usa `trusted` solo quando il documento incorporato ha davvero bisogno del comportamento same-origin. Per la maggior parte dei giochi generati dagli agenti e delle canvas interattive, `scripts` è la scelta più sicura.
</Warning>

Gli URL embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Larghezza dei messaggi chat

I messaggi chat raggruppati usano una larghezza massima predefinita leggibile. Le distribuzioni con monitor larghi possono sovrascriverla senza modificare il CSS in bundle impostando `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Il valore viene convalidato prima di raggiungere il browser. I valori supportati includono lunghezze e percentuali semplici come `960px` o `82%`, oltre a espressioni di larghezza vincolate `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Accesso tailnet (consigliato)

<Tabs>
  <Tab title="Tailscale Serve integrato (preferito)">
    Mantieni il Gateway su loopback e lascia che Tailscale Serve lo proxizzi con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Serve Control UI/WebSocket possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e le accetta solo quando la richiesta raggiunge loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore Control UI con identità dispositivo browser, questo percorso Serve verificato salta anche il round trip di associazione dispositivo; i browser senza dispositivo e le connessioni con ruolo nodo seguono comunque i normali controlli dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client e ambito auth vengono serializzati prima delle scritture del rate limit. Di conseguenza, retry errati simultanei dallo stesso browser possono mostrare `retry later` sulla seconda richiesta invece di due semplici mismatch in corsa parallela.

    <Warning>
    L'autenticazione Serve senza token presuppone che l'host gateway sia attendibile. Se codice locale non attendibile può essere eseguito su quell'host, richiedi l'autenticazione token/password.
    </Warning>

  </Tab>
  <Tab title="Bind a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Poi apri:

    - `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

    Incolla il segreto condiviso corrispondente nelle impostazioni dell'interfaccia utente (inviato come `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sicuro

Se apri la dashboard su HTTP semplice (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni Control UI senza identità dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicura solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione Control UI operatore riuscita tramite `gateway.auth.mode: "trusted-proxy"`
- interruttore di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri l'interfaccia utente localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host gateway)

<AccordionGroup>
  <Accordion title="Comportamento del toggle auth non sicura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` è solo un toggle di compatibilità locale:

    - Consente alle sessioni Control UI localhost di procedere senza identità dispositivo in contesti HTTP non sicuri.
    - Non bypassa i controlli di associazione.
    - Non allenta i requisiti di identità dispositivo remoti (non localhost).

  </Accordion>
  <Accordion title="Solo emergenza">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità dispositivo della Control UI ed è un grave downgrade di sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Nota trusted-proxy">
    - Un'autenticazione trusted-proxy riuscita può ammettere sessioni Control UI **operatore** senza identità dispositivo.
    - Questo **non** si estende alle sessioni Control UI con ruolo nodo.
    - I proxy inversi loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Vedi [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Policy di sicurezza dei contenuti

La Control UI viene distribuita con una policy `img-src` rigorosa: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL immagine remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non avviano fetch di rete.

Cosa significa in pratica:

- Avatar e immagini serviti sotto percorsi relativi (per esempio `/avatars/<id>`) continuano a essere renderizzati, incluse le route avatar autenticate che l'interfaccia utente recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` continuano a essere renderizzati (utili per payload nel protocollo).
- Gli URL `blob:` locali creati dalla Control UI continuano a essere renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della Control UI e sostituiti con il logo/badge integrato, quindi un canale compromesso o malevolo non può forzare fetch arbitrari di immagini remote da un browser operatore.

Non devi modificare nulla per ottenere questo comportamento — è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione gateway è configurata, l'endpoint avatar della Control UI richiede lo stesso token gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati avatar secondo la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route sibling assistant-media). Questo impedisce alla route avatar di rivelare l'identità dell'agente su host che sono altrimenti protetti.
- La Control UI stessa inoltra il token gateway come header bearer quando recupera gli avatar e usa URL blob autenticati, così l'immagine viene comunque renderizzata nelle dashboard.

Se disabiliti l'autenticazione del Gateway (sconsigliato sugli host condivisi), anche la route dell'avatar diventa non autenticata, in linea con il resto del Gateway.

## Autenticazione della route multimediale dell'assistente

Quando l'autenticazione del Gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione dell'operatore della Control UI. Il browser invia il token del Gateway come header bearer quando verifica la disponibilità.
- Le risposte dei metadati riuscite includono un `mediaTicket` di breve durata limitato a quello specifico percorso sorgente.
- Gli URL di immagini, audio, video e documenti renderizzati dal browser usano `mediaTicket=<ticket>` invece del token o della password attivi del Gateway. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi multimediali nativi del browser senza inserire credenziali riutilizzabili del Gateway negli URL dei media visibili.

## Creazione della UI

Il Gateway serve file statici da `dist/control-ui`. Creali con:

```bash
pnpm ui:build
```

Base assoluta opzionale (quando vuoi URL degli asset fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server di sviluppo separato):

```bash
pnpm ui:dev
```

Poi punta la UI all'URL WS del tuo Gateway (ad esempio `ws://127.0.0.1:18789`).

## Pagina vuota della Control UI

Se il browser carica una dashboard vuota e DevTools non mostra errori utili, un'estensione o uno script di contenuto iniziale potrebbe aver impedito la valutazione dell'app del modulo JavaScript. La pagina statica include un pannello di ripristino in HTML semplice che appare quando `<openclaw-app>` non viene registrato dopo l'avvio.

Usa l'azione **Riprova** del pannello dopo aver modificato l'ambiente del browser, oppure ricarica manualmente dopo queste verifiche:

- Disabilita le estensioni che iniettano contenuti in tutte le pagine, soprattutto le estensioni con script di contenuto `<all_urls>`.
- Prova una finestra privata, un profilo browser pulito o un altro browser.
- Mantieni il Gateway in esecuzione e verifica lo stesso URL della dashboard dopo il cambio del browser.

## Debug/test: server di sviluppo + Gateway remoto

La Control UI è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. Questo è utile quando vuoi usare localmente il server di sviluppo Vite ma il Gateway è in esecuzione altrove.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Autenticazione monouso opzionale (se necessaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` viene salvato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint completo `ws://` o `wss://` tramite `gatewayUrl`, codifica per URL il valore di `gatewayUrl` in modo che il browser analizzi correttamente la stringa di query.
    - `token` dovrebbe essere passato tramite il frammento dell'URL (`#token=...`) ogni volta che è possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene mantenuta solo in memoria.
    - Quando `gatewayUrl` è impostato, la UI non ripiega sulle credenziali di configurazione o di ambiente. Fornisci esplicitamente `token` (o `password`). La mancanza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni pubbliche non-loopback della Control UI devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). I caricamenti LAN/Tailnet privati stessa origine da loopback, RFC1918/link-local, `.local`, `.ts.net` o host Tailscale CGNAT sono accettati senza abilitare il fallback dell'header Host.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta effettivi del runtime, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non "corrispondi a qualunque host io stia usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la modalità di fallback dell'origine basata sull'header Host, ma è una modalità di sicurezza pericolosa.

  </Accordion>
</AccordionGroup>

Esempio:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Dettagli sulla configurazione dell'accesso remoto: [Accesso remoto](/it/gateway/remote).

## Correlati

- [Dashboard](/it/web/dashboard) — dashboard del Gateway
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del Gateway
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser

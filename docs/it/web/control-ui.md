---
read_when:
    - Vuoi utilizzare il Gateway da un browser
    - Vuoi l'accesso Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia di controllo basata su browser per il Gateway (chat, attività, nodi, configurazione)
title: Interfaccia utente di controllo
x-i18n:
    generated_at: "2026-07-03T09:41:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

La Control UI è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad esempio `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non viene caricata, avvia prima il Gateway: `openclaw gateway`.

<Note>
Nei bind LAN nativi di Windows, Windows Firewall o Criteri di gruppo gestiti dall'organizzazione possono comunque bloccare l'URL LAN annunciato anche quando `127.0.0.1` funziona sull'host del Gateway. Esegui `openclaw gateway status --deep` sull'host Windows; segnala porte probabilmente bloccate, profili non corrispondenti e regole firewall locali che i criteri potrebbero ignorare.
</Note>

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- intestazioni di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- intestazioni di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione della scheda del browser corrente e l'URL del gateway selezionato; le password non vengono persistite. L'onboarding di solito genera un token gateway per l'autenticazione shared-secret alla prima connessione, ma anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti alla Control UI da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di associazione una tantum**. È una misura di sicurezza per impedire accessi non autorizzati.

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

Se il browser ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Riesegui `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo cambi dall'accesso in lettura all'accesso in scrittura/admin, questo viene trattato come un aggiornamento dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI Dispositivi](/it/cli/devices) per rotazione e revoca dei token.

Gli agenti Paperclip che si connettono tramite l'adattatore `openclaw_gateway` usano lo stesso flusso di approvazione al primo avvio. Dopo il tentativo di connessione iniziale, esegui `openclaw devices approve --latest` per visualizzare in anteprima la richiesta in sospeso, quindi riesegui il comando stampato `openclaw devices approve <requestId>` per approvarla. Passa valori espliciti `--url` e `--token` per un gateway remoto. Per mantenere stabili le approvazioni tra riavvii, configura in Paperclip un `adapterConfig.devicePrivateKeyPem` persistente invece di lasciare che generi una nuova identità dispositivo effimera a ogni esecuzione.

<Note>
- Le connessioni browser dirette tramite local loopback (`127.0.0.1` / `localhost`) sono approvate automaticamente.
- Tailscale Serve può saltare il giro di associazione per le sessioni operatore della Control UI quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità dispositivo.
- I bind Tailnet diretti, le connessioni browser LAN e i profili browser senza identità dispositivo richiedono comunque approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Identità personale (locale al browser)

La Control UI supporta un'identità personale per browser (nome visualizzato e avatar) collegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Vive nello storage del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né persistita lato server oltre ai normali metadati di autorialità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuota.

Lo stesso schema locale al browser si applica all'override dell'avatar dell'assistente. Gli avatar dell'assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non fanno mai un round trip tramite `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per client non UI che scrivono direttamente il campo (come gateway scriptati o dashboard personalizzate).

## Endpoint della configurazione runtime

La Control UI recupera le proprie impostazioni runtime da `/control-ui-config.json`, risolto relativamente al percorso base della Control UI del gateway (ad esempio `/__openclaw__/control-ui-config.json` quando la UI è servita sotto `/__openclaw__/`). Quell'endpoint è protetto dalla stessa autenticazione del gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo, e un recupero riuscito richiede un token/password gateway già valido, un'identità Tailscale Serve o un'identità trusted-proxy.

## Supporto linguistico

La Control UI può localizzarsi al primo caricamento in base alla lingua del browser. Per sovrascriverla in seguito, apri **Panoramica -> Accesso al Gateway -> Lingua**. Il selettore della lingua si trova nella scheda Accesso al Gateway, non sotto Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ricadono sull'inglese.

Le traduzioni della documentazione vengono generate per lo stesso insieme di lingue non inglesi, ma il selettore lingua integrato del sito docs di Mintlify è limitato ai codici lingua accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repo di pubblicazione; potrebbe non apparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi di aspetto

Il pannello Aspetto conserva i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

Aspetto include anche un'impostazione Dimensione testo locale al browser. L'impostazione viene archiviata con il resto delle preferenze della Control UI, si applica al testo della chat, al testo del compositore, alle schede degli strumenti e alle barre laterali della chat, e mantiene gli input di testo ad almeno 16px in modo che Safari mobile non esegua lo zoom automatico al focus.

I temi importati vengono archiviati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e conversazione vocale">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Gli aggiornamenti della cronologia chat richiedono una finestra recente limitata con cap di testo per messaggio, così le sessioni grandi non costringono il browser a renderizzare un payload di trascrizione completo prima che la chat diventi utilizzabile.
    - Conversa tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser monouso vincolato su WebSocket, e i plugin vocali realtime solo backend usano il trasporto relay del Gateway. Le sessioni provider possedute dal client iniziano con `talk.client.create`; le sessioni relay del Gateway iniziano con `talk.session.create`. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM dal microfono tramite `talk.session.appendAudio`, inoltra le chiamate tool provider `openclaw_agent_consult` tramite `talk.client.toolCall` per le policy del Gateway e il modello OpenClaw configurato più grande, e instrada lo steering vocale dell'esecuzione attiva tramite `talk.client.steer` o `talk.session.steer`.
    - Streaming delle chiamate tool + schede di output tool live nella Chat (eventi agente).
    - Scheda Attività con riepiloghi locali al browser, orientati alla redazione, dell'attività tool live dalla consegna esistente di eventi `session.tool` / tool.

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: stato dei canali integrati più quelli dei plugin bundled/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Gli aggiornamenti delle sonde dei canali mantengono visibile lo snapshot precedente mentre terminano i controlli lenti dei provider, e gli snapshot parziali vengono etichettati quando una sonda o un audit supera il budget UI.
    - Istanze: elenco presenze + aggiornamento (`system-presence`).
    - Sessioni: elenca per impostazione predefinita le sessioni degli agenti configurati, effettua fallback dalle chiavi di sessione agente non configurate obsolete e applica override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sogni: stato del dreaming, toggle abilita/disabilita e lettore del Diario dei sogni (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodi, approvazioni exec">
    - Job Cron: elenca/aggiungi/modifica/esegui/abilita/disabilita + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti chiavi API (`skills.*`).
    - Nodi: elenco + cap (`node.list`).
    - Approvazioni exec: modifica allowlist gateway o nodo + policy di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP ha una pagina impostazioni dedicata per server configurati, abilitazione, riepiloghi OAuth/filtro/paralleli, comandi operatore comuni e l'editor di configurazione `mcp` con ambito.
    - Applica + riavvia con validazione (`config.apply`) e riattiva l'ultima sessione attiva.
    - Le scritture includono una guardia base-hash per impedire di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) eseguono un preflight della risoluzione SecretRef attiva per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - I salvataggi dei moduli scartano placeholder redatti obsoleti che non possono essere ripristinati dalla configurazione salvata, preservando al contempo i valori redatti che corrispondono ancora a segreti salvati.
    - Schema + rendering del modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` dei campi, suggerimenti UI corrispondenti, riepiloghi dei figli immediati, metadati docs sui nodi oggetto nidificato/wildcard/array/composizione, più schemi plugin + canale quando disponibili); l'editor JSON grezzo è disponibile solo quando lo snapshot ha un round trip grezzo sicuro.
    - Se uno snapshot non può eseguire in sicurezza il round trip del testo grezzo, la Control UI forza la modalità Modulo e disabilita la modalità Grezza per quello snapshot.
    - L'editor JSON grezzo "Ripristina al salvato" preserva la forma scritta in modo grezzo (formattazione, commenti, layout `$include`) invece di renderizzare di nuovo uno snapshot appiattito, quindi le modifiche esterne sopravvivono a un ripristino quando lo snapshot può eseguire in sicurezza il round trip.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per prevenire corruzioni accidentali da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot di stato/salute/modelli + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il log eventi include tempi di aggiornamento/RPC della Control UI, tempi di rendering lenti di chat/configurazione e voci di reattività del browser per frame di animazione lunghi o task lunghi quando il browser espone quei tipi di entry PerformanceObserver.
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio, quindi esegui il polling di `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Note del pannello dei job Cron">
    - Per i job isolati, la consegna predefinita annuncia il riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/destinazione appaiono quando è selezionato l'annuncio.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
    - Per i job della sessione principale, sono disponibili le modalità di consegna webhook e nessuna.
    - I controlli di modifica avanzati includono elimina-dopo-esecuzione, cancellazione dell'override agente, opzioni cron esatte/scaglionate, override del modello/ragionamento dell'agente e toggle di consegna best-effort.
    - La convalida del modulo è inline con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un token bearer dedicato; se omesso, il webhook viene inviato senza header di autenticazione.
    - Fallback deprecato: esegui `openclaw doctor --fix` per migrare i job legacy memorizzati con `notify: true` da `cron.webhook` a webhook esplicito per job o consegna al completamento.

  </Accordion>
</AccordionGroup>

## Pagina MCP

La pagina MCP dedicata è una vista operatore per i server MCP gestiti da OpenClaw sotto `mcp.servers`. Non avvia da sola i trasporti MCP; usala per ispezionare e modificare la configurazione salvata, quindi usa `openclaw mcp doctor --probe` quando ti serve una prova live del server.

Workflow tipico:

1. Apri **MCP** dalla barra laterale.
2. Controlla le schede riepilogative per il conteggio totale, abilitati, OAuth e server filtrati.
3. Esamina ogni riga server per trasporto, abilitazione, autenticazione, filtri, timeout e suggerimenti di comando.
4. Attiva o disattiva l'abilitazione quando un server deve restare configurato ma fuori dal rilevamento runtime.
5. Modifica la sezione di configurazione `mcp` con ambito per definizioni dei server, header, percorsi TLS/mTLS, metadati OAuth, filtri strumenti e metadati di proiezione Codex.
6. Usa **Salva** per scrivere la configurazione, oppure **Salva e pubblica** quando il Gateway in esecuzione deve applicare la configurazione modificata.
7. Esegui `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` da un terminale quando il processo modificato richiede diagnostica statica, prova live o eliminazione della runtime cache.

La pagina oscura i valori simili a URL che contengono credenziali prima del rendering e mette tra virgolette i nomi dei server negli snippet di comando, così i comandi copiati funzionano anche con spazi o metacaratteri della shell. Il riferimento completo di CLI e configurazione si trova in [MCP](/it/cli/mcp).

## Scheda Attività

La scheda Attività è un osservatore effimero locale al browser per l'attività live degli strumenti. È derivata dallo stesso flusso di eventi `session.tool` / strumenti del Gateway che alimenta le schede strumenti della Chat; non aggiunge un'altra famiglia di eventi Gateway, endpoint, archivio attività durevole, feed metriche o flusso osservatore esterno.

Le voci di Attività conservano solo riepiloghi sanificati e anteprime di output oscurate e troncate. I valori degli argomenti degli strumenti non vengono memorizzati nello stato di Attività; l'interfaccia mostra che gli argomenti sono nascosti e registra solo il numero di campi argomento. L'elenco in memoria segue la scheda corrente del browser, sopravvive alla navigazione all'interno della Control UI e si reimposta al ricaricamento della pagina, al cambio sessione o con **Cancella**.

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma subito con `{ runId, status: "started" }` e la risposta viene trasmessa in streaming tramite eventi `chat`. I client Control UI attendibili possono anche ricevere metadati opzionali sui tempi di ACK per la diagnostica locale.
    - I caricamenti in chat accettano immagini più file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link allegati.
    - Reinviare con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
    - Le risposte `chat.history` sono limitate in dimensione per la sicurezza dell'interfaccia. Quando le voci della trascrizione sono troppo grandi, Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire messaggi troppo grandi con un placeholder (`[chat.history omitted: message too large]`).
    - Quando un messaggio assistente visibile è stato troncato in `chat.history`, il lettore laterale può recuperare su richiesta la voce completa della trascrizione normalizzata per la visualizzazione tramite `chat.message.get` usando `sessionKey`, `agentId` attivo quando necessario e `messageId` della trascrizione. Se il Gateway non riesce comunque a restituire altro, il lettore mostra uno stato esplicito di non disponibilità invece di ripetere silenziosamente l'anteprima troncata.
    - Le immagini assistente/generate vengono persistite come riferimenti a media gestiti e servite tramite URL media Gateway autenticati, quindi i ricaricamenti non dipendono dalla permanenza dei payload immagine raw base64 nella risposta della cronologia chat.
    - Durante il rendering di `chat.history`, la Control UI rimuove dal testo assistente visibile i tag direttiva inline solo di visualizzazione (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamate strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate strumento troncati), i token di controllo modello ASCII/full-width trapelati, e omette le voci assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply` o il token di conferma Heartbeat `HEARTBEAT_OK`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi utente/assistente ottimistici locali se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia Gateway si aggiorna.
    - Gli eventi live `chat` sono stato di consegna, mentre `chat.history` viene ricostruito dalla trascrizione durevole della sessione. Dopo gli eventi finali degli strumenti, la Control UI ricarica la cronologia e unisce solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessuna consegna canale).
    - La barra laterale elenca le sessioni recenti con un'azione Nuova sessione, un link Tutte le sessioni e un pulsante di ricerca sessione che apre il selettore sessioni completo (con ambito all'agente selezionato, con ricerca e paginazione). Cambiare agente mostra solo le sessioni legate a quell'agente e ripiega sulla sessione principale di quell'agente quando non ha ancora sessioni dashboard salvate.
    - Su larghezze desktop, i controlli chat restano su una riga compatta e si comprimono mentre si scorre verso il basso nella trascrizione; scorrere verso l'alto, tornare in cima o raggiungere il fondo ripristina i controlli.
    - Messaggi consecutivi duplicati solo testo vengono renderizzati come una sola bolla con un badge conteggio. I messaggi che contengono immagini, allegati, output di strumenti o anteprime canvas non vengono compressi.
    - I selettori modello e ragionamento nell'header chat aggiornano immediatamente la sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide per un solo turno.
    - Se invii un messaggio mentre una modifica del selettore modello per la stessa sessione è ancora in salvataggio, il composer attende quella patch di sessione prima di chiamare `chat.send`, così l'invio usa il modello selezionato.
    - Digitare `/new` nella Control UI crea e passa alla stessa nuova sessione dashboard di Nuova chat, tranne quando `session.dmScope: "main"` è configurato e il genitore corrente è la sessione principale dell'agente; in quel caso reimposta la sessione principale sul posto. Digitare `/reset` mantiene il reset esplicito sul posto del Gateway per la sessione corrente.
    - Il selettore modello della chat richiede la vista modelli configurata del Gateway. Se `agents.defaults.models` è presente, quell'allowlist guida il selettore, incluse le voci `provider/*` che mantengono dinamici i cataloghi con ambito provider. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite l'RPC di debug `models.list` con `view: "all"`.
    - Quando i report di utilizzo sessione freschi del Gateway includono i token di contesto correnti, la toolbar del composer chat mostra un piccolo anello di utilizzo del contesto con la percentuale usata; il dettaglio completo dei token è nel relativo tooltip. L'anello passa allo stile di avviso con alta pressione del contesto e, ai livelli di Compaction consigliati, mostra un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot dei token obsoleti restano nascosti finché il Gateway non segnala di nuovo un utilizzo fresco.

  </Accordion>
  <Accordion title="Modalità Talk (realtime browser)">
    La modalità Talk usa un provider voce realtime registrato. Configura OpenAI con `talk.realtime.provider: "openai"` più un profilo di autenticazione con chiave API `openai`, `talk.realtime.providers.openai.apiKey` o `OPENAI_API_KEY`; i profili OAuth OpenAI non configurano la voce Realtime. Configura Google con `talk.realtime.provider: "google"` più `talk.realtime.providers.google.apiKey`. Il browser non riceve mai una chiave API provider standard. OpenAI riceve un segreto client Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato e monouso per una sessione WebSocket browser, con istruzioni e dichiarazioni strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay del Gateway, quindi credenziali e socket vendor restano lato server mentre l'audio del browser passa attraverso RPC Gateway autenticate. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.client.create` non accetta override di istruzioni forniti dal chiamante.

    Il composer della Chat include un pulsante opzioni Talk accanto al pulsante di avvio/arresto Talk. Le opzioni si applicano alla sessione Talk successiva e possono sovrascrivere provider, trasporto, modello, voce, effort di ragionamento, soglia VAD, durata del silenzio e padding del prefisso. Quando un'opzione è vuota, il Gateway usa i predefiniti configurati dove disponibili o il predefinito del provider. Selezionare relay Gateway forza il percorso relay backend; selezionare WebRTC mantiene la sessione di proprietà del client e fallisce invece di ripiegare silenziosamente su relay se il provider non può creare una sessione browser.

    Nel composer della Chat, il controllo Talk è il pulsante onde accanto al pulsante di dettatura microfono. Quando Talk parte, la riga di stato del composer mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata strumento realtime consulta il modello più grande configurato tramite `talk.client.toolCall`.

    Smoke live maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica il bridge WebSocket backend OpenAI, lo scambio SDP WebRTC browser OpenAI, la configurazione WebSocket browser con token vincolato Google Live e l'adapter browser relay del Gateway con media microfono fittizi. Il comando stampa solo lo stato provider e non registra segreti.

  </Accordion>
  <Accordion title="Stop e interruzione">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i normali follow-up vengono messi in coda. Fai clic su **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di interruzione come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale all'interruzione">
    - Quando un'esecuzione viene interrotta, il testo assistente parziale può comunque essere mostrato nell'interfaccia.
    - Gateway persiste il testo assistente parziale interrotto nella cronologia della trascrizione quando esiste output bufferizzato.
    - Le voci persistite includono metadati di interruzione, così i consumatori della trascrizione possono distinguere le parti parziali interrotte dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e web push

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

Se la pagina mostra **Protocollo non corrispondente** subito dopo un aggiornamento di OpenClaw, per prima cosa riapri la dashboard con `openclaw dashboard` e ricarica forzatamente la pagina. Se continua a non funzionare, cancella i dati del sito per l'origine della dashboard oppure prova in una finestra del browser privata; una vecchia scheda o la cache del service worker del browser può continuare a eseguire un bundle dell'interfaccia di controllo precedente all'aggiornamento contro il Gateway più recente.

| Superficie                                            | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce gli eventi `push` e i clic sulle notifiche. |
| `push/vapid-keys.json` (nella directory di stato di OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare i payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione del browser persistiti.                 |

Sovrascrivi la coppia di chiavi VAPID tramite variabili d'ambiente sul processo Gateway quando vuoi bloccare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito: `https://openclaw.ai`)

L'interfaccia di controllo usa questi metodi Gateway vincolati all'ambito per registrare e testare le sottoscrizioni del browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay APNS di iOS (vedi [Configurazione](/it/gateway/configuration) per il push basato su relay) e dal metodo `push.test` esistente, che riguarda l'abbinamento mobile nativo.
</Note>

## Incorporamenti ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script all'interno degli incorporamenti ospitati.
  </Tab>
  <Tab title="scripts (default)">
    Consente incorporamenti interattivi mantenendo l'isolamento dell'origine; questo è il valore predefinito e di solito basta per giochi/widget browser autonomi.
  </Tab>
  <Tab title="trusted">
    Aggiunge `allow-same-origin` oltre a `allow-scripts` per documenti dello stesso sito che richiedono intenzionalmente privilegi più elevati.
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
Usa `trusted` solo quando il documento incorporato necessita davvero del comportamento same-origin. Per la maggior parte dei giochi generati da agenti e delle canvas interattive, `scripts` è la scelta più sicura.
</Warning>

Gli URL di incorporamento esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Larghezza dei messaggi di chat

I messaggi di chat raggruppati usano una larghezza massima predefinita leggibile. Le distribuzioni su monitor ampi possono sovrascriverla senza modificare il CSS incluso impostando `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Il valore viene validato prima di arrivare al browser. I valori supportati includono lunghezze e percentuali semplici come `960px` o `82%`, più espressioni di larghezza vincolate `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Accesso tailnet (consigliato)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Mantieni il Gateway su loopback e lascia che Tailscale Serve lo proxifichi con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Serve dell'interfaccia di controllo/WebSocket possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e li accetta solo quando la richiesta arriva a loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore dell'interfaccia di controllo con identità dispositivo del browser, questo percorso Serve verificato salta anche il round trip di abbinamento del dispositivo; i browser senza dispositivo e le connessioni con ruolo nodo seguono comunque i normali controlli del dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client e ambito di autenticazione vengono serializzati prima delle scritture del rate limit. Tentativi errati concorrenti dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta invece di due semplici mancate corrispondenze in competizione parallela.

    <Warning>
    L'autenticazione Serve senza token presuppone che l'host del gateway sia attendibile. Se sull'host può essere eseguito codice locale non attendibile, richiedi autenticazione con token/password.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Poi apri:

    - `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

    Incolla il segreto condiviso corrispondente nelle impostazioni dell'interfaccia (inviato come `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sicuro

Se apri la dashboard tramite HTTP semplice (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser opera in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni dell'interfaccia di controllo senza identità dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicura solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione operatore dell'interfaccia di controllo riuscita tramite `gateway.auth.mode: "trusted-proxy"`
- opzione di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri l'interfaccia localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host gateway)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` è solo un interruttore di compatibilità locale:

    - Consente alle sessioni localhost dell'interfaccia di controllo di procedere senza identità dispositivo in contesti HTTP non sicuri.
    - Non aggira i controlli di abbinamento.
    - Non allenta i requisiti di identità dispositivo remoti (non localhost).

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth` disabilita i controlli dell'identità dispositivo dell'interfaccia di controllo ed è un grave indebolimento della sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Un'autenticazione trusted-proxy riuscita può ammettere sessioni **operatore** dell'interfaccia di controllo senza identità dispositivo.
    - Questo **non** si estende alle sessioni dell'interfaccia di controllo con ruolo nodo.
    - I reverse proxy loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Vedi [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Policy di sicurezza dei contenuti

L'interfaccia di controllo viene distribuita con una policy `img-src` restrittiva: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL immagine remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Avatar e immagini serviti sotto percorsi relativi (per esempio `/avatars/<id>`) vengono comunque renderizzati, incluse le route avatar autenticate che l'interfaccia recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` vengono comunque renderizzati (utile per payload nel protocollo).
- Gli URL `blob:` locali creati dall'interfaccia di controllo vengono comunque renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar dell'interfaccia di controllo e sostituiti con il logo/badge integrato, quindi un canale compromesso o malevolo non può forzare recuperi arbitrari di immagini remote dal browser di un operatore.

Non devi cambiare nulla per ottenere questo comportamento — è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del gateway è configurata, l'endpoint avatar dell'interfaccia di controllo richiede lo stesso token gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route assistant-media adiacente). Questo impedisce alla route avatar di esporre l'identità dell'agente su host altrimenti protetti.
- L'interfaccia di controllo inoltra il token gateway come header bearer quando recupera gli avatar e usa URL blob autenticati, così l'immagine continua a renderizzarsi nelle dashboard.

Se disabiliti l'autenticazione gateway (non consigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del gateway.

## Autenticazione della route media assistente

Quando l'autenticazione gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione operatore dell'interfaccia di controllo. Il browser invia il token gateway come header bearer quando controlla la disponibilità.
- Le risposte di metadati riuscite includono un `mediaTicket` di breve durata vincolato a quello specifico percorso sorgente.
- Gli URL di immagini, audio, video e documenti renderizzati dal browser usano `mediaTicket=<ticket>` invece del token gateway attivo o della password. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi multimediali nativi del browser senza inserire credenziali gateway riutilizzabili negli URL media visibili.

## Creazione dell'interfaccia

Il Gateway serve file statici da `dist/control-ui`. Creali con:

```bash
pnpm ui:build
```

Base assoluta opzionale (quando vuoi URL asset fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server dev separato):

```bash
pnpm ui:dev
```

Poi punta l'interfaccia al tuo URL WS del Gateway (per esempio `ws://127.0.0.1:18789`).

## Pagina vuota dell'interfaccia di controllo

Se il browser carica una dashboard vuota e DevTools non mostra errori utili, un'estensione o uno script di contenuto iniziale potrebbe aver impedito la valutazione dell'app modulo JavaScript. La pagina statica include un pannello di recupero HTML semplice che appare quando `<openclaw-app>` non è registrato dopo l'avvio.

Usa l'azione **Riprova** del pannello dopo aver cambiato l'ambiente del browser, oppure ricarica manualmente dopo questi controlli:

- Disabilita le estensioni che iniettano codice in tutte le pagine, in particolare estensioni con script di contenuto `<all_urls>`.
- Prova una finestra privata, un profilo browser pulito o un altro browser.
- Mantieni il Gateway in esecuzione e verifica lo stesso URL della dashboard dopo il cambio del browser.

## Debug/test: server dev + Gateway remoto

L'interfaccia di controllo è composta da file statici; il target WebSocket è configurabile e può essere diverso dall'origine HTTP. Questo è utile quando vuoi il server dev Vite in locale ma il Gateway è in esecuzione altrove.

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

    Autenticazione una tantum opzionale (se necessaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Note">
    - `gatewayUrl` viene memorizzato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint `ws://` o `wss://` completo tramite `gatewayUrl`, codifica per URL il valore di `gatewayUrl` in modo che il browser analizzi correttamente la stringa di query.
    - `token` deve essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene mantenuto solo in memoria.
    - Quando `gatewayUrl` è impostato, l'interfaccia utente non ricorre alle credenziali di configurazione o di ambiente. Fornisci esplicitamente `token` (o `password`). La mancanza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni pubbliche non-loopback della Control UI devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). I caricamenti LAN/Tailnet privati same-origin da loopback, RFC1918/link-local, `.local`, `.ts.net` o host CGNAT Tailscale sono accettati senza abilitare il fallback dell'header Host.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta effettivi del runtime, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non "corrispondi a qualunque host io stia usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la modalità di fallback dell'origine dell'header Host, ma è una modalità di sicurezza pericolosa.

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

Dettagli di configurazione dell'accesso remoto: [Accesso remoto](/it/gateway/remote).

## Correlati

- [Dashboard](/it/web/dashboard) — dashboard del Gateway
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del Gateway
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [WebChat](/it/web/webchat) — interfaccia di chat basata su browser

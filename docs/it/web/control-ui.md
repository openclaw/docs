---
read_when:
    - Vuoi utilizzare il Gateway da un browser
    - Vuoi l'accesso a Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: UI di controllo basata su browser per il Gateway (chat, attività, nodi, configurazione)
title: Interfaccia di controllo
x-i18n:
    generated_at: "2026-07-02T01:00:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

La Control UI è una piccola applicazione a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

<Note>
Sui bind LAN nativi di Windows, Windows Firewall o una Group Policy gestita dall'organizzazione possono comunque bloccare l'URL LAN annunciato anche quando `127.0.0.1` funziona sull'host del Gateway. Esegui `openclaw gateway status --deep` sull'host Windows; segnala porte probabilmente bloccate, profili non corrispondenti e regole del firewall locale che la policy potrebbe ignorare.
</Note>

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- intestazioni di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- intestazioni di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione della scheda del browser corrente e l'URL del gateway selezionato; le password non vengono mantenute. L'onboarding di solito genera un token gateway per l'autenticazione a segreto condiviso alla prima connessione, ma anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti alla Control UI da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di associazione una tantum**. È una misura di sicurezza per impedire accessi non autorizzati.

**Cosa vedrai:** "disconnected (1008): pairing required"

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Se il browser riprova l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo cambi da accesso in lettura ad accesso in scrittura/amministratore, questa operazione viene trattata come un upgrade dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione con privilegi più ampi e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Dopo l'approvazione, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI dispositivi](/it/cli/devices) per rotazione e revoca dei token.

Gli agenti Paperclip che si connettono tramite l'adapter `openclaw_gateway` usano lo stesso flusso di approvazione al primo avvio. Dopo il tentativo di connessione iniziale, esegui `openclaw devices approve --latest` per visualizzare in anteprima la richiesta in sospeso, quindi esegui di nuovo il comando stampato `openclaw devices approve <requestId>` per approvarla. Passa valori espliciti `--url` e `--token` per un gateway remoto. Per mantenere stabili le approvazioni tra i riavvii, configura in Paperclip un `adapterConfig.devicePrivateKeyPem` persistente invece di lasciare che generi una nuova identità dispositivo effimera a ogni esecuzione.

<Note>
- Le connessioni browser dirette tramite local loopback (`127.0.0.1` / `localhost`) sono approvate automaticamente.
- Tailscale Serve può saltare il round trip di associazione per le sessioni operatore della Control UI quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità dispositivo.
- I bind Tailnet diretti, le connessioni browser LAN e i profili browser senza identità dispositivo richiedono comunque approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Identità personale (locale al browser)

La Control UI supporta un'identità personale per browser (nome visualizzato e avatar) associata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Vive nello storage del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né mantenuta lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuota.

Lo stesso modello locale al browser si applica all'override dell'avatar dell'assistente. Gli avatar dell'assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non passano mai tramite `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` rimane disponibile per client non UI che scrivono direttamente il campo (come gateway scriptati o dashboard personalizzate).

## Endpoint di configurazione runtime

La Control UI recupera le proprie impostazioni runtime da `/control-ui-config.json`, risolto relativamente al percorso base della Control UI del gateway (per esempio `/__openclaw__/control-ui-config.json` quando la UI è servita sotto `/__openclaw__/`). Questo endpoint è protetto dalla stessa autenticazione del gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo, e un recupero riuscito richiede un token/password gateway già valido, l'identità Tailscale Serve oppure un'identità trusted-proxy.

## Supporto linguistico

La Control UI può localizzarsi al primo caricamento in base alla locale del browser. Per sovrascriverla in seguito, apri **Panoramica -> Accesso al Gateway -> Lingua**. Il selettore della locale si trova nella scheda Accesso al Gateway, non sotto Aspetto.

- Locali supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate pigramente nel browser.
- La locale selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti usano l'inglese come fallback.

Le traduzioni della documentazione vengono generate per lo stesso insieme di locali non inglesi, ma il selettore lingua Mintlify integrato nel sito della documentazione è limitato ai codici locale accettati da Mintlify. La documentazione in tailandese (`th`) e persiano (`fa`) viene comunque generata nel repository di pubblicazione; potrebbe non apparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi di aspetto

Il pannello Aspetto conserva i temi integrati Claw, Knot e Dash, più uno slot di import tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

Aspetto include anche un'impostazione Dimensione testo locale al browser. L'impostazione viene archiviata con il resto delle preferenze della Control UI, si applica al testo della chat, al testo del composer, alle schede degli strumenti e alle barre laterali della chat, e mantiene gli input di testo ad almeno 16px così Safari mobile non applica lo zoom automatico al focus.

I temi importati vengono archiviati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Gli aggiornamenti della cronologia chat richiedono una finestra recente limitata con tetti di testo per messaggio, così le sessioni grandi non costringono il browser a renderizzare un payload completo di trascrizione prima che la chat diventi utilizzabile.
    - Parla tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser monouso vincolato su WebSocket, e i plugin vocali realtime solo backend usano il trasporto relay del Gateway. Le sessioni provider possedute dal client iniziano con `talk.client.create`; le sessioni relay del Gateway iniziano con `talk.session.create`. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM del microfono tramite `talk.session.appendAudio`, inoltra le chiamate tool provider `openclaw_agent_consult` tramite `talk.client.toolCall` per la policy del Gateway e il modello OpenClaw configurato più grande, e instrada il controllo vocale delle esecuzioni attive tramite `talk.client.steer` o `talk.session.steer`.
    - Esegui lo streaming delle chiamate tool + schede di output tool live in Chat (eventi agente).
    - Scheda Attività con riepiloghi locali al browser e orientati alla redazione dell'attività tool live dalla consegna esistente di `session.tool` / eventi tool.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Canali: stato dei canali integrati più plugin in bundle/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Gli aggiornamenti dei probe dei canali mantengono visibile lo snapshot precedente mentre terminano i controlli lenti dei provider, e gli snapshot parziali sono etichettati quando un probe o un audit supera il budget UI.
    - Istanze: elenco presenza + aggiornamento (`system-presence`).
    - Sessioni: elenca per impostazione predefinita le sessioni configurate dell'agente, ripiega dalle chiavi di sessione agente non configurate obsolete e applica override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Dreams: stato del dreaming, toggle abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti chiave API (`skills.*`).
    - Nodi: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica allowlist del gateway o del nodo + policy di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP ha una pagina impostazioni dedicata per server configurati, abilitazione, riepiloghi OAuth/filtro/paralleli, comandi operatore comuni e l'editor di configurazione `mcp` con ambito.
    - Applica + riavvia con validazione (`config.apply`) e riattiva l'ultima sessione attiva.
    - Le scritture includono una protezione base-hash per impedire di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) preflightano la risoluzione attiva SecretRef per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - I salvataggi dei moduli scartano segnaposto redatti obsoleti che non possono essere ripristinati dalla configurazione salvata, preservando i valori redatti che corrispondono ancora a segreti salvati.
    - Rendering di schema + modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` del campo, suggerimenti UI corrispondenti, riepiloghi immediati dei figli, metadati documentazione sui nodi annidati object/wildcard/array/composition, più schemi plugin + canale quando disponibili); l'editor JSON grezzo è disponibile solo quando lo snapshot ha un round trip grezzo sicuro.
    - Se uno snapshot non può fare round trip del testo grezzo in modo sicuro, la Control UI forza la modalità Modulo e disabilita la modalità Grezzo per quello snapshot.
    - "Reset to saved" dell'editor JSON grezzo preserva la forma scritta nel grezzo (formattazione, commenti, layout `$include`) invece di renderizzare di nuovo uno snapshot appiattito, così le modifiche esterne sopravvivono a un reset quando lo snapshot può fare round trip in modo sicuro.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per impedire corruzioni accidentali da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: snapshot di stato/salute/modelli + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il log eventi include tempi di aggiornamento/RPC della Control UI, tempi di rendering lento chat/config e voci di reattività del browser per frame di animazione lunghi o task lunghi quando il browser espone quei tipi di entry PerformanceObserver.
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio, quindi esegui il polling di `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Note del pannello dei processi Cron">
    - Per i processi isolati, la consegna usa per impostazione predefinita il riepilogo di annuncio. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/destinazione compaiono quando è selezionato l'annuncio.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL Webhook HTTP(S) valido.
    - Per i processi della sessione principale, sono disponibili le modalità di consegna Webhook e nessuna.
    - I controlli di modifica avanzati includono elimina dopo l'esecuzione, cancella override dell'agente, opzioni Cron esatto/scaglionato, override di modello/thinking dell'agente e interruttori di consegna best-effort.
    - La validazione del modulo è in linea con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il Webhook viene inviato senza header di autenticazione.
    - Fallback deprecato: esegui `openclaw doctor --fix` per migrare i processi legacy salvati con `notify: true` da `cron.webhook` a Webhook esplicito per processo o consegna al completamento.

  </Accordion>
</AccordionGroup>

## Pagina MCP

La pagina MCP dedicata è una vista operatore per i server MCP gestiti da OpenClaw sotto `mcp.servers`. Non avvia autonomamente i trasporti MCP; usala per ispezionare e modificare la configurazione salvata, poi usa `openclaw mcp doctor --probe` quando ti serve una prova live del server.

Flusso tipico:

1. Apri **MCP** dalla barra laterale.
2. Controlla le schede riepilogative per il totale e i conteggi dei server abilitati, OAuth e filtrati.
3. Esamina ogni riga del server per trasporto, abilitazione, autenticazione, filtri, timeout e suggerimenti di comando.
4. Attiva o disattiva l'abilitazione quando un server deve restare configurato ma rimanere fuori dalla discovery runtime.
5. Modifica la sezione di configurazione `mcp` con scope per definizioni dei server, header, percorsi TLS/mTLS, metadati OAuth, filtri degli strumenti e metadati di proiezione Codex.
6. Usa **Salva** per scrivere la configurazione, oppure **Salva e pubblica** quando il Gateway in esecuzione deve applicare la configurazione modificata.
7. Esegui `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` da un terminale quando il processo modificato necessita di diagnostica statica, prova live o smaltimento del runtime in cache.

La pagina oscura i valori simili a URL che contengono credenziali prima del rendering e racchiude tra virgolette i nomi dei server negli snippet di comando, così i comandi copiati funzionano ancora con spazi o metacaratteri della shell. Il riferimento completo per CLI e configurazione si trova in [MCP](/it/cli/mcp).

## Scheda Attività

La scheda Attività è un osservatore effimero locale al browser per l'attività live degli strumenti. Deriva dallo stesso stream di eventi Gateway `session.tool` / strumento che alimenta le schede strumenti della Chat; non aggiunge un'altra famiglia di eventi Gateway, endpoint, archivio attività duraturo, feed di metriche o stream osservatore esterno.

Le voci di Attività conservano solo riepiloghi sanificati e anteprime di output oscurate e troncate. I valori degli argomenti degli strumenti non vengono memorizzati nello stato di Attività; la UI mostra che gli argomenti sono nascosti e registra solo il conteggio dei campi argomento. L'elenco in memoria segue la scheda corrente del browser, sopravvive alla navigazione all'interno della Control UI e si reimposta al ricaricamento della pagina, al cambio di sessione o con **Cancella**.

## Comportamento della Chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`. I client Control UI fidati possono anche ricevere metadati opzionali sui tempi dell'ACK per la diagnostica locale.
    - I caricamenti in Chat accettano immagini più file non video. Le immagini mantengono il percorso immagine nativo; gli altri file sono archiviati come media gestiti e mostrati nella cronologia come link ad allegati.
    - Il reinvio con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
    - Le risposte `chat.history` hanno limiti di dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire i messaggi sovradimensionati con un segnaposto (`[chat.history omitted: message too large]`).
    - Quando un messaggio visibile dell'assistente è stato troncato in `chat.history`, il lettore laterale può recuperare su richiesta la voce completa della trascrizione normalizzata per la visualizzazione tramite `chat.message.get` usando `sessionKey`, l'`agentId` attivo quando necessario e il `messageId` della trascrizione. Se il Gateway continua a non poter restituire altro, il lettore mostra uno stato esplicito di non disponibilità invece di ripetere silenziosamente l'anteprima troncata.
    - Le immagini generate dall'assistente sono persistite come riferimenti a media gestiti e servite di nuovo tramite URL media Gateway autenticati, quindi i ricaricamenti non dipendono dalla permanenza dei payload immagine raw base64 nella risposta della cronologia della chat.
    - Durante il rendering di `chat.history`, la Control UI rimuove dal testo visibile dell'assistente i tag direttiva inline solo per la visualizzazione (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati), e i token di controllo modello ASCII/a larghezza piena trapelati, e omette le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply` o il token di conferma Heartbeat `HEARTBEAT_OK`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi locali ottimistici di utente/assistente se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia del Gateway si riallinea.
    - Gli eventi live `chat` sono stato di consegna, mentre `chat.history` viene ricostruito dalla trascrizione duratura della sessione. Dopo gli eventi finali degli strumenti, la Control UI ricarica la cronologia e fonde solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione dell'agente, nessuna consegna al canale).
    - L'intestazione della chat mostra il filtro agente prima del selettore sessione, e il selettore sessione è limitato all'agente selezionato. Il cambio di agente mostra solo le sessioni legate a quell'agente e ripiega sulla sessione principale di quell'agente quando non ha ancora sessioni dashboard salvate.
    - Su larghezze desktop, i controlli della chat restano su una singola riga compatta e collassano durante lo scorrimento verso il basso della trascrizione; scorrere verso l'alto, tornare in cima o raggiungere il fondo ripristina i controlli.
    - I messaggi consecutivi duplicati di solo testo vengono renderizzati come un'unica bolla con un badge di conteggio. I messaggi che contengono immagini, allegati, output strumenti o anteprime canvas non vengono collassati.
    - I selettori di modello e thinking nell'intestazione della chat aggiornano immediatamente la sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide solo per un turno.
    - Se invii un messaggio mentre una modifica del selettore modello per la stessa sessione è ancora in salvataggio, il compositore attende quella patch della sessione prima di chiamare `chat.send`, così l'invio usa il modello selezionato.
    - Digitare `/new` nella Control UI crea e passa alla stessa sessione dashboard nuova di Nuova chat, tranne quando `session.dmScope: "main"` è configurato e il genitore corrente è la sessione principale dell'agente; in quel caso reimposta la sessione principale sul posto. Digitare `/reset` mantiene il reset esplicito sul posto del Gateway per la sessione corrente.
    - Il selettore modello della chat richiede la vista modello configurata del Gateway. Se `agents.defaults.models` è presente, quella allowlist guida il selettore, incluse le voci `provider/*` che mantengono dinamici i cataloghi con scope provider. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite l'RPC di debug `models.list` con `view: "all"`.
    - Quando i report freschi sull'utilizzo della sessione Gateway includono i token di contesto correnti, l'area del compositore chat mostra un indicatore compatto di utilizzo del contesto. Passa allo stile di avviso con pressione del contesto elevata e, ai livelli di Compaction consigliati, mostra un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot token obsoleti sono nascosti finché il Gateway non riporta di nuovo un utilizzo fresco.

  </Accordion>
  <Accordion title="Modalità Talk (realtime nel browser)">
    La modalità Talk usa un provider voce realtime registrato. Configura OpenAI con `talk.realtime.provider: "openai"` più un profilo di autenticazione con chiave API `openai`, `talk.realtime.providers.openai.apiKey` o `OPENAI_API_KEY`; i profili OAuth OpenAI non configurano la voce Realtime. Configura Google con `talk.realtime.provider: "google"` più `talk.realtime.providers.google.apiKey`. Il browser non riceve mai una chiave API provider standard. OpenAI riceve un segreto client Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay del Gateway, così credenziali e socket del vendor restano lato server mentre l'audio del browser passa tramite RPC Gateway autenticati. Il prompt della sessione Realtime è assemblato dal Gateway; `talk.client.create` non accetta override delle istruzioni forniti dal chiamante.

    Il compositore Chat include un pulsante opzioni Talk accanto al pulsante di avvio/arresto Talk. Le opzioni si applicano alla sessione Talk successiva e possono sovrascrivere provider, trasporto, modello, voce, effort di ragionamento, soglia VAD, durata del silenzio e padding del prefisso. Quando un'opzione è vuota, il Gateway usa i valori predefiniti configurati quando disponibili o il valore predefinito del provider. La selezione del relay Gateway forza il percorso relay backend; la selezione di WebRTC mantiene la sessione di proprietà del client e fallisce invece di ripiegare silenziosamente su relay se il provider non può creare una sessione browser.

    Nel compositore Chat, il controllo Talk è il pulsante a onde accanto al pulsante di dettatura microfono. Quando Talk si avvia, la riga di stato del compositore mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata strumento realtime consulta il modello più grande configurato tramite `talk.client.toolCall`.

    Smoke live per maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica il bridge WebSocket backend OpenAI, lo scambio SDP WebRTC browser OpenAI, la configurazione WebSocket browser Google Live con token vincolato e l'adattatore browser relay del Gateway con media microfono finti. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Interruzione e annullamento">
    - Fai clic su **Interrompi** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i follow-up normali vengono messi in coda. Fai clic su **Guida** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di annullamento come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per annullare fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per annullare tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale dopo annullamento">
    - Quando un'esecuzione viene annullata, il testo parziale dell'assistente può ancora essere mostrato nella UI.
    - Il Gateway persiste il testo parziale annullato dell'assistente nella cronologia della trascrizione quando esiste output bufferizzato.
    - Le voci persistite includono metadati di annullamento, così i consumatori della trascrizione possono distinguere i parziali annullati dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e push web

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

Se la pagina mostra **Mancata corrispondenza del protocollo** subito dopo un aggiornamento di OpenClaw, prima riapri la dashboard con `openclaw dashboard` ed esegui un aggiornamento forzato della pagina. Se continua a non funzionare, cancella i dati del sito per l'origine della dashboard o prova in una finestra privata del browser; una vecchia scheda o la cache del service worker del browser può continuare a eseguire un bundle Control UI precedente all'aggiornamento contro il Gateway più recente.

| Superficie                                            | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce gli eventi `push` e i clic sulle notifiche. |
| `push/vapid-keys.json` (nella directory di stato di OpenClaw) | Coppia di chiavi VAPID generata automaticamente, usata per firmare i payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione del browser persistiti.                 |

Sovrascrivi la coppia di chiavi VAPID tramite variabili d'ambiente sul processo Gateway quando vuoi fissare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (valore predefinito: `https://openclaw.ai`)

La UI di controllo usa questi metodi Gateway limitati per scope per registrare e testare le sottoscrizioni del browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay APNS di iOS (vedi [Configurazione](/it/gateway/configuration) per il push basato su relay) e dal metodo `push.test` esistente, che prendono di mira il pairing mobile nativo.
</Note>

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script negli embed ospitati.
  </Tab>
  <Tab title="scripts (default)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; questo è il valore predefinito e di solito è sufficiente per giochi/widget browser autonomi.
  </Tab>
  <Tab title="trusted">
    Aggiunge `allow-same-origin` sopra `allow-scripts` per documenti nello stesso sito che necessitano intenzionalmente di privilegi più forti.
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

Il valore viene validato prima di raggiungere il browser. I valori supportati includono lunghezze semplici e percentuali come `960px` o `82%`, oltre a espressioni di larghezza vincolate `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Accesso tailnet (consigliato)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Mantieni il Gateway su loopback e lascia che Tailscale Serve lo proxy con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Serve della UI di controllo/WebSocket possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e accetta queste richieste solo quando arrivano su loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore della UI di controllo con identità del dispositivo browser, questo percorso Serve verificato salta anche il round trip di pairing del dispositivo; i browser senza dispositivo e le connessioni con ruolo di nodo seguono comunque i normali controlli del dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client e scope di autenticazione vengono serializzati prima delle scritture del rate limit. I retry errati concorrenti dallo stesso browser possono quindi mostrare `retry later` alla seconda richiesta invece di due semplici mismatch in competizione in parallelo.

    <Warning>
    L'autenticazione Serve senza token presuppone che l'host del gateway sia attendibile. Se codice locale non attendibile può essere eseguito su quell'host, richiedi l'autenticazione con token/password.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Poi apri:

    - `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

    Incolla il segreto condiviso corrispondente nelle impostazioni della UI (inviato come `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sicuro

Se apri la dashboard su HTTP semplice (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni della UI di controllo senza identità del dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicura solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione operatore della UI di controllo riuscita tramite `gateway.auth.mode: "trusted-proxy"`
- emergenza break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host del gateway)

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

    `allowInsecureAuth` è solo un toggle di compatibilità locale:

    - Consente alle sessioni localhost della UI di controllo di procedere senza identità del dispositivo in contesti HTTP non sicuri.
    - Non aggira i controlli di pairing.
    - Non allenta i requisiti di identità del dispositivo remoto (non localhost).

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
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della UI di controllo ed è un grave downgrade di sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Un'autenticazione trusted-proxy riuscita può ammettere sessioni **operatore** della UI di controllo senza identità del dispositivo.
    - Questo **non** si estende alle sessioni della UI di controllo con ruolo di nodo.
    - I reverse proxy loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Vedi [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Policy di sicurezza dei contenuti

La UI di controllo viene fornita con una policy `img-src` stretta: sono consentiti solo asset della **stessa origine**, URL `data:` e URL `blob:` generati localmente. Gli URL immagine remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non avviano fetch di rete.

Cosa significa in pratica:

- Avatar e immagini serviti sotto percorsi relativi (per esempio `/avatars/<id>`) continuano a renderizzare, incluse le route avatar autenticate che la UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` continuano a renderizzare (utile per payload nel protocollo).
- Gli URL `blob:` locali creati dalla UI di controllo continuano a renderizzare.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della UI di controllo e sostituiti con il logo/badge integrato, quindi un canale compromesso o malevolo non può forzare fetch arbitrari di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del gateway è configurata, l'endpoint avatar della UI di controllo richiede lo stesso token gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati dell'avatar secondo la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route sorella assistant-media). Questo impedisce alla route avatar di rivelare l'identità dell'agente su host altrimenti protetti.
- La UI di controllo stessa inoltra il token gateway come header bearer quando recupera avatar, e usa URL blob autenticati così l'immagine continua a renderizzare nelle dashboard.

Se disabiliti l'autenticazione del gateway (sconsigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del gateway.

## Autenticazione della route media dell'assistente

Quando l'autenticazione del gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione operatore della UI di controllo. Il browser invia il token gateway come header bearer quando controlla la disponibilità.
- Le risposte di metadati riuscite includono un `mediaTicket` di breve durata limitato a quel percorso sorgente esatto.
- Gli URL di immagini, audio, video e documenti renderizzati dal browser usano `mediaTicket=<ticket>` invece del token gateway o della password attivi. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi media nativi del browser senza inserire credenziali gateway riutilizzabili negli URL media visibili.

## Compilare la UI

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

```bash
pnpm ui:build
```

Base assoluta opzionale (quando vuoi URL asset fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server di sviluppo separato):

```bash
pnpm ui:dev
```

Poi punta la UI all'URL WS del tuo Gateway (ad es. `ws://127.0.0.1:18789`).

## Pagina vuota della UI di controllo

Se il browser carica una dashboard vuota e DevTools non mostra errori utili, un'estensione o uno script di contenuto iniziale potrebbe aver impedito la valutazione dell'app modulo JavaScript. La pagina statica include un pannello di ripristino HTML semplice che appare quando `<openclaw-app>` non viene registrato dopo l'avvio.

Usa l'azione **Riprova** del pannello dopo aver modificato l'ambiente del browser, oppure ricarica manualmente dopo questi controlli:

- Disabilita le estensioni che iniettano contenuto in tutte le pagine, soprattutto le estensioni con script di contenuto `<all_urls>`.
- Prova una finestra privata, un profilo browser pulito o un altro browser.
- Mantieni il Gateway in esecuzione e verifica lo stesso URL della dashboard dopo la modifica del browser.

## Debug/test: server di sviluppo + Gateway remoto

La UI di controllo è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. Questo è utile quando vuoi il server di sviluppo Vite in locale ma il Gateway viene eseguito altrove.

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
    - `gatewayUrl` viene archiviato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint completo `ws://` o `wss://` tramite `gatewayUrl`, codifica per URL il valore di `gatewayUrl` in modo che il browser analizzi correttamente la stringa di query.
    - `token` deve essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene mantenuto solo in memoria.
    - Quando `gatewayUrl` è impostato, l'UI non ripiega sulle credenziali di configurazione o di ambiente. Fornisci `token` (o `password`) esplicitamente. La mancanza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` viene accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni pubbliche non loopback della UI di controllo devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). I caricamenti LAN/Tailnet privati con la stessa origine da host loopback, RFC1918/link-local, `.local`, `.ts.net` o Tailscale CGNAT sono accettati senza abilitare il fallback dell'header Host.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta effettivi del runtime, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` se non per test locali strettamente controllati. Significa consentire qualsiasi origine del browser, non "corrispondi a qualunque host io stia usando."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la modalità di fallback dell'origine tramite header Host, ma è una modalità di sicurezza pericolosa.

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

Dettagli della configurazione dell'accesso remoto: [Accesso remoto](/it/gateway/remote).

## Correlati

- [Dashboard](/it/web/dashboard) — dashboard del Gateway
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del Gateway
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [WebChat](/it/web/webchat) — interfaccia di chat basata su browser

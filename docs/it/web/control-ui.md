---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi l'accesso a Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia di controllo basata su browser per il Gateway (chat, attività, nodi, configurazione)
title: Interfaccia utente di controllo
x-i18n:
    generated_at: "2026-07-04T20:34:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

La UI di controllo è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

<Note>
Nei bind LAN nativi di Windows, Windows Firewall o i Criteri di gruppo gestiti dall'organizzazione possono comunque bloccare l'URL LAN pubblicizzato anche quando `127.0.0.1` funziona sull'host del Gateway. Esegui `openclaw gateway status --deep` sull'host Windows; segnala porte probabilmente bloccate, mancate corrispondenze del profilo e regole del firewall locale che i criteri potrebbero ignorare.
</Note>

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione corrente della scheda del browser e per l'URL del gateway selezionato; le password non vengono persistite. L'onboarding di solito genera un token gateway per l'autenticazione con segreto condiviso alla prima connessione, ma anche l'autenticazione tramite password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti alla UI di controllo da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di associazione una tantum**. È una misura di sicurezza per impedire accessi non autorizzati.

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

Se il browser è già associato e lo cambi dall'accesso in lettura all'accesso in scrittura/admin, l'operazione viene trattata come un upgrade dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI dei dispositivi](/it/cli/devices) per rotazione e revoca dei token.

Gli agenti Paperclip che si connettono tramite l'adapter `openclaw_gateway` usano lo stesso flusso di approvazione al primo avvio. Dopo il tentativo di connessione iniziale, esegui `openclaw devices approve --latest` per visualizzare in anteprima la richiesta in sospeso, poi riesegui il comando `openclaw devices approve <requestId>` stampato per approvarla. Passa valori espliciti `--url` e `--token` per un gateway remoto. Per mantenere stabili le approvazioni tra i riavvii, configura una `adapterConfig.devicePrivateKeyPem` persistente in Paperclip invece di lasciare che generi una nuova identità dispositivo effimera a ogni esecuzione.

<Note>
- Le connessioni browser dirette local loopback (`127.0.0.1` / `localhost`) vengono approvate automaticamente.
- Tailscale Serve può saltare il round trip di associazione per le sessioni operatore della UI di controllo quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità dispositivo.
- I bind diretti Tailnet, le connessioni browser LAN e i profili browser senza identità dispositivo richiedono comunque approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Abbina un dispositivo mobile

Un amministratore già abbinato può creare il QR di connessione iOS/Android senza
aprire un terminale:

<Steps>
  <Step title="Apri l'abbinamento mobile">
    Seleziona **Nodi**, quindi fai clic su **Abbina dispositivo mobile** nella scheda **Dispositivi**.
  </Step>
  <Step title="Connetti il telefono">
    Nell'app mobile OpenClaw, apri **Impostazioni** → **Gateway** e scansiona il codice
    QR. In alternativa, puoi copiare e incollare il codice di configurazione.
  </Step>
  <Step title="Conferma la connessione">
    L'app ufficiale iOS/Android si connette automaticamente. Se **Dispositivi** mostra una
    richiesta in sospeso, esaminane il ruolo e gli ambiti prima di approvarla.
  </Step>
</Steps>

La creazione di un codice di configurazione richiede `operator.admin`; il pulsante è disabilitato per
le sessioni che non lo hanno. Un codice di configurazione contiene una credenziale di bootstrap di breve durata,
quindi tratta il QR e il codice copiato come una password finché sono validi. Per l'abbinamento remoto,
il Gateway deve risolversi in `wss://` (ad esempio tramite Tailscale
Serve/Funnel); il semplice `ws://` è limitato a loopback e indirizzi LAN privati.
Vedi [Abbinamento](/it/channels/pairing#pair-from-the-control-ui-recommended) per i
dettagli completi su sicurezza e fallback.

## Identità personale (locale al browser)

La Control UI supporta un'identità personale per browser (nome visualizzato e avatar) associata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Risiede nell'archiviazione del browser, è limitata al profilo del browser corrente e non viene sincronizzata con altri dispositivi né salvata lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuota.

Lo stesso modello locale al browser si applica alla sostituzione dell'avatar dell'assistente. Gli avatar dell'assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non fanno mai un round-trip tramite `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per i client non UI che scrivono direttamente il campo (come gateway tramite script o dashboard personalizzate).

## Endpoint di configurazione runtime

La Control UI recupera le proprie impostazioni runtime da `/control-ui-config.json`, risolto relativamente al percorso base della Control UI del gateway (ad esempio `/__openclaw__/control-ui-config.json` quando l'UI è servita sotto `/__openclaw__/`). Quell'endpoint è protetto dalla stessa autenticazione del gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo, e un recupero riuscito richiede un token/password del gateway già valido, un'identità Tailscale Serve o un'identità proxy attendibile.

## Supporto lingue

La Control UI può localizzarsi al primo caricamento in base alla lingua del browser. Per modificarla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il selettore della lingua si trova nella scheda Accesso Gateway, non sotto Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nell'archiviazione del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti usano l'inglese come fallback.

Le traduzioni della documentazione vengono generate per lo stesso insieme di lingue non inglesi, ma il selettore di lingua Mintlify integrato nel sito della documentazione è limitato ai codici lingua accettati da Mintlify. La documentazione in thai (`th`) e persiano (`fa`) viene comunque generata nel repository di pubblicazione; potrebbe non apparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi di aspetto

Il pannello Aspetto mantiene i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

Aspetto include anche un'impostazione Dimensione testo locale al browser. L'impostazione viene archiviata insieme al resto delle preferenze della Control UI, si applica al testo della chat, al testo del compositore, alle schede degli strumenti e alle barre laterali della chat, e mantiene gli input di testo ad almeno 16px in modo che Safari mobile non applichi lo zoom automatico al focus.

I temi importati vengono archiviati solo nel profilo del browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e conversazione vocale">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Gli aggiornamenti della cronologia chat richiedono una finestra recente limitata con limiti di testo per messaggio, così le sessioni grandi non costringono il browser a renderizzare un payload completo della trascrizione prima che la chat diventi utilizzabile.
    - Conversa tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser monouso vincolato tramite WebSocket, e i plugin vocali realtime solo backend usano il trasporto relay del Gateway. Le sessioni provider possedute dal client iniziano con `talk.client.create`; le sessioni relay del Gateway iniziano con `talk.session.create`. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM dal microfono tramite `talk.session.appendAudio`, inoltra le chiamate agli strumenti del provider `openclaw_agent_consult` tramite `talk.client.toolCall` per la policy del Gateway e il modello OpenClaw configurato più grande, e instrada la guida vocale dell'esecuzione attiva tramite `talk.client.steer` o `talk.session.steer`.
    - Esegue lo streaming delle chiamate agli strumenti + schede di output strumenti live in Chat (eventi agente).
    - Scheda Attività con riepiloghi locali al browser, orientati alla redazione, dell'attività strumenti live dalla consegna esistente di eventi `session.tool` / strumenti.

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: integrati più stato dei canali plugin in bundle/esterni, accesso tramite QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Gli aggiornamenti delle sonde dei canali mantengono visibile lo snapshot precedente mentre terminano i controlli lenti dei provider, e gli snapshot parziali sono etichettati quando una sonda o un audit supera il budget UI.
    - Istanze: elenco presenza + aggiornamento (`system-presence`).
    - Sessioni: elenca per impostazione predefinita le sessioni degli agenti configurati, fissa le sessioni frequenti, rinominale, archivia o ripristina le sessioni inattive, usa fallback da chiavi di sessione agente non configurate obsolete e applica override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`). Le sessioni fissate sono ordinate sopra le sessioni recenti non fissate; le sessioni archiviate si trovano nella vista archiviata della pagina Sessioni e conservano le loro trascrizioni.
    - Sogni: stato del dreaming, interruttore abilita/disabilita e lettore del Diario dei sogni (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodi, approvazioni exec">
    - Processi Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilitazione/disabilitazione, installazione, aggiornamenti chiave API (`skills.*`).
    - Nodi: elenco + capacità (`node.list`), creazione di codici di configurazione mobile e approvazione dell'abbinamento dispositivi (`device.pair.*`).
    - Approvazioni exec: modifica allowlist gateway o nodi + policy di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP ha una pagina impostazioni dedicata per server configurati, abilitazione, riepiloghi OAuth/filtro/paralleli, comandi operatore comuni e l'editor di configurazione `mcp` con ambito.
    - Applica e riavvia con convalida (`config.apply`) e risveglia l'ultima sessione attiva.
    - Le scritture includono una protezione con hash di base per evitare di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) verificano in preflight la risoluzione dei SecretRef attivi per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - I salvataggi dei moduli scartano i segnaposto redatti obsoleti che non possono essere ripristinati dalla configurazione salvata, preservando i valori redatti che mappano ancora a segreti salvati.
    - Rendering di schema e modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` del campo, suggerimenti UI corrispondenti, riepiloghi dei figli immediati, metadati della documentazione sui nodi oggetto annidato/wildcard/array/composizione, più schemi di Plugin e canale quando disponibili); l'editor JSON non elaborato è disponibile solo quando lo snapshot consente un round trip non elaborato sicuro.
    - Se uno snapshot non può eseguire in sicurezza il round trip del testo non elaborato, Control UI forza la modalità Modulo e disabilita la modalità Non elaborata per quello snapshot.
    - Nell'editor JSON non elaborato, "Reimposta ai salvati" preserva la forma scritta in modalità non elaborata (formattazione, commenti, layout `$include`) invece di rieseguire il rendering di uno snapshot appiattito, così le modifiche esterne sopravvivono a una reimpostazione quando lo snapshot consente un round trip sicuro.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per evitare corruzioni accidentali da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot di stato/integrità/modelli + registro eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il registro eventi include tempi di aggiornamento/RPC di Control UI, tempi di rendering lenti di chat/configurazione e voci di reattività del browser per frame di animazione lunghi o attività lunghe quando il browser espone questi tipi di voce PerformanceObserver.
    - Log: tail live dei log file del Gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio, poi esegui polling di `update.status` dopo la riconnessione per verificare la versione del Gateway in esecuzione.

  </Accordion>
  <Accordion title="Note del pannello dei job Cron">
    - Per i job isolati, la consegna predefinita è annunciare il riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/target appaiono quando è selezionato annuncia.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
    - Per i job della sessione principale, sono disponibili le modalità di consegna webhook e nessuna.
    - I controlli di modifica avanzata includono elimina-dopo-esecuzione, cancella override agente, opzioni cron esatto/scaglionato, override modello/thinking dell'agente e toggle di consegna best-effort.
    - La convalida del modulo è inline con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un token bearer dedicato; se omesso, il webhook viene inviato senza header di autenticazione.
    - Fallback deprecato: esegui `openclaw doctor --fix` per migrare i job legacy archiviati con `notify: true` da `cron.webhook` a una consegna webhook per-job esplicita o di completamento.

  </Accordion>
</AccordionGroup>

## Pagina MCP

La pagina MCP dedicata è una vista operatore per i server MCP gestiti da OpenClaw sotto `mcp.servers`. Non avvia autonomamente i trasporti MCP; usala per ispezionare e modificare la configurazione salvata, poi usa `openclaw mcp doctor --probe` quando ti serve una prova live del server.

Workflow tipico:

1. Apri **MCP** dalla barra laterale.
2. Controlla le schede di riepilogo per il conteggio totale, abilitati, OAuth e server filtrati.
3. Esamina ogni riga server per trasporto, abilitazione, auth, filtri, timeout e suggerimenti di comando.
4. Attiva/disattiva l'abilitazione quando un server deve restare configurato ma rimanere fuori dalla discovery runtime.
5. Modifica la sezione di configurazione `mcp` con ambito per definizioni dei server, header, percorsi TLS/mTLS, metadati OAuth, filtri degli strumenti e metadati di proiezione Codex.
6. Usa **Salva** per una scrittura della configurazione, oppure **Salva e pubblica** quando il Gateway in esecuzione deve applicare la configurazione modificata.
7. Esegui `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` o `openclaw mcp reload` da un terminale quando il processo modificato richiede diagnostica statica, prova live o eliminazione del runtime in cache.

La pagina redige i valori simili a URL che contengono credenziali prima del rendering e mette tra virgolette i nomi dei server negli snippet di comando, così i comandi copiati funzionano ancora con spazi o metacaratteri della shell. Il riferimento completo a CLI e configurazione si trova in [MCP](/it/cli/mcp).

## Scheda Attività

La scheda Attività è un osservatore effimero locale al browser per l'attività live degli strumenti. Deriva dallo stesso stream eventi `session.tool` / strumento del Gateway che alimenta le schede strumenti della Chat; non aggiunge un'altra famiglia di eventi Gateway, endpoint, archivio attività duraturo, feed di metriche o stream osservatore esterno.

Le voci di Attività conservano solo riepiloghi sanificati e anteprime di output redatte e troncate. I valori degli argomenti degli strumenti non vengono archiviati nello stato di Attività; la UI mostra che gli argomenti sono nascosti e registra solo il conteggio dei campi argomento. L'elenco in memoria segue la scheda corrente del browser, sopravvive alla navigazione dentro la Control UI e si reimposta al ricaricamento della pagina, al cambio sessione o con **Cancella**.

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma subito con `{ runId, status: "started" }` e la risposta arriva in streaming tramite eventi `chat`. I client Control UI attendibili possono ricevere anche metadati facoltativi sui tempi di ACK per diagnostica locale.
    - I caricamenti in chat accettano immagini più file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link allegato.
    - Reinviare con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
    - Le risposte `chat.history` sono limitate in dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire messaggi sovradimensionati con un segnaposto (`[chat.history omitted: message too large]`).
    - Quando un messaggio assistente visibile è stato troncato in `chat.history`, il lettore laterale può recuperare su richiesta la voce completa della trascrizione normalizzata per la visualizzazione tramite `chat.message.get` usando `sessionKey`, `agentId` attivo quando necessario e `messageId` della trascrizione. Se il Gateway non può ancora restituire altro, il lettore mostra uno stato esplicito di indisponibilità invece di ripetere silenziosamente l'anteprima troncata.
    - Le immagini assistente/generate vengono persistite come riferimenti a media gestiti e servite di nuovo tramite URL media Gateway autenticati, così i ricaricamenti non dipendono dalla permanenza di payload immagine base64 grezzi nella risposta della cronologia chat.
    - Durante il rendering di `chat.history`, la Control UI rimuove dal testo visibile dell'assistente i tag direttiva inline solo di visualizzazione (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati) e i token di controllo modello ASCII/full-width trapelati, e omette le voci assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply` o il token di riconoscimento Heartbeat `HEARTBEAT_OK`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi utente/assistente ottimistici locali se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia del Gateway si riallinea.
    - Gli eventi live `chat` sono stato di consegna, mentre `chat.history` viene ricostruito dalla trascrizione duratura della sessione. Dopo gli eventi finali degli strumenti, la Control UI ricarica la cronologia e fonde solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessuna consegna canale).
    - La barra laterale elenca le sessioni recenti con un'azione Nuova sessione, un link Tutte le sessioni e un pulsante di ricerca sessione che apre il selettore completo delle sessioni (con ambito sull'agente selezionato, con ricerca e paginazione). Cambiare agente mostra solo le sessioni legate a quell'agente e ripiega sulla sessione principale di quell'agente quando non ha ancora sessioni dashboard salvate.
    - Ogni riga del selettore sessione può rinominare, fissare o archiviare la sessione. Un'esecuzione attiva e la sessione principale di un agente non possono essere archiviate. Archiviare la sessione attualmente selezionata riporta Chat alla sessione principale di quell'agente.
    - Su larghezze desktop, i controlli chat restano su una riga compatta e si comprimono durante lo scorrimento verso il basso nella trascrizione; scorrere verso l'alto, tornare all'inizio o raggiungere il fondo ripristina i controlli.
    - I messaggi consecutivi duplicati di solo testo vengono renderizzati come una bolla con un badge di conteggio. I messaggi che contengono immagini, allegati, output di strumenti o anteprime canvas non vengono compressi.
    - I selettori modello e thinking nell'intestazione della chat applicano immediatamente una patch alla sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide solo per un turno.
    - Se invii un messaggio mentre una modifica del selettore modello per la stessa sessione è ancora in salvataggio, il composer attende quella patch di sessione prima di chiamare `chat.send`, così l'invio usa il modello selezionato.
    - Digitare `/new` nella Control UI crea e passa alla stessa nuova sessione dashboard di Nuova chat, tranne quando `session.dmScope: "main"` è configurato e il parent corrente è la sessione principale dell'agente; in quel caso reimposta la sessione principale sul posto. Digitare `/reset` mantiene il reset esplicito sul posto del Gateway per la sessione corrente.
    - Il selettore modello della chat richiede la vista modelli configurata del Gateway. Se `agents.defaults.models` è presente, quella allowlist guida il selettore, incluse le voci `provider/*` che mantengono dinamici i cataloghi con ambito provider. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con auth utilizzabile. Il catalogo completo resta disponibile tramite la RPC di debug `models.list` con `view: "all"`.
    - Quando i report freschi di utilizzo sessione del Gateway includono i token di contesto correnti, la barra degli strumenti del composer chat mostra un piccolo anello di utilizzo contesto con la percentuale usata; il dettaglio completo dei token si trova nel tooltip. L'anello passa allo stile di avviso ad alta pressione del contesto e, ai livelli consigliati di Compaction, mostra un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot obsoleti dei token sono nascosti finché il Gateway non segnala di nuovo un utilizzo fresco.

  </Accordion>
  <Accordion title="Modalità conversazione (realtime nel browser)">
    La modalità conversazione usa un provider vocale realtime registrato. Configura OpenAI con `talk.realtime.provider: "openai"` più un profilo auth con chiave API `openai`, `talk.realtime.providers.openai.apiKey` o `OPENAI_API_KEY`; i profili OAuth OpenAI non configurano la voce Realtime. Configura Google con `talk.realtime.provider: "google"` più `talk.realtime.providers.google.apiKey`. Il browser non riceve mai una chiave API standard del provider. OpenAI riceve un client secret Realtime effimero per WebRTC. Google Live riceve un token auth Live API vincolato monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay del Gateway, così credenziali e socket dei vendor restano lato server mentre l'audio del browser passa tramite RPC Gateway autenticate. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.client.create` non accetta override delle istruzioni forniti dal chiamante.

    Il compositore Chat include un pulsante delle opzioni Talk accanto al pulsante di avvio/arresto Talk. Le opzioni si applicano alla sessione Talk successiva e possono sovrascrivere provider, trasporto, modello, voce, sforzo di ragionamento, soglia VAD, durata del silenzio e padding del prefisso. Quando un'opzione è vuota, il Gateway usa i valori predefiniti configurati dove disponibili o il valore predefinito del provider. Selezionare il relay Gateway forza il percorso di relay del backend; selezionare WebRTC mantiene la sessione di proprietà del client e fallisce invece di ripiegare silenziosamente sul relay se il provider non può creare una sessione browser.

    Nel compositore Chat, il controllo Talk è il pulsante con le onde accanto al pulsante del microfono per la dettatura. Quando Talk si avvia, la riga di stato del compositore mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata tool realtime consulta il modello più grande configurato tramite `talk.client.toolCall`.

    Smoke test live per maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica il bridge WebSocket del backend OpenAI, lo scambio SDP WebRTC browser di OpenAI, la configurazione WebSocket browser con token vincolati di Google Live e l'adapter browser relay del Gateway con media microfono finti. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Arresto e interruzione">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i normali follow-up vengono accodati. Fai clic su **Steer** su un messaggio accodato per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di interruzione come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale dopo interruzione">
    - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nell'interfaccia utente.
    - Il Gateway conserva il testo parziale dell'assistente interrotto nella cronologia della trascrizione quando esiste output bufferizzato.
    - Le voci conservate includono metadati di interruzione, così i consumer della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e push web

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

Se la pagina mostra **Protocol mismatch** subito dopo un aggiornamento di OpenClaw, per prima cosa riapri la dashboard con `openclaw dashboard` ed esegui un hard refresh della pagina. Se continua a non funzionare, cancella i dati del sito per l'origine della dashboard o prova in una finestra del browser privata; una vecchia scheda o la cache del service worker del browser può continuare a eseguire un bundle Control UI precedente all'aggiornamento contro il Gateway più recente.

| Superficie                                             | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (sotto la dir di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare i payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione browser persistiti.                    |

Sovrascrivi la coppia di chiavi VAPID tramite variabili d'ambiente nel processo Gateway quando vuoi fissare le chiavi (per deployment multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito a `https://openclaw.ai`)

La Control UI usa questi metodi Gateway vincolati allo scope per registrare e testare le sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay APNS iOS (vedi [Configurazione](/it/gateway/configuration) per il push supportato da relay) e dal metodo `push.test` esistente, che hanno come target l'abbinamento mobile nativo.
</Note>

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script all'interno degli embed ospitati.
  </Tab>
  <Tab title="scripts (default)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; è il valore predefinito e di solito è sufficiente per giochi/widget browser autonomi.
  </Tab>
  <Tab title="trusted">
    Aggiunge `allow-same-origin` oltre ad `allow-scripts` per documenti same-site che hanno intenzionalmente bisogno di privilegi più forti.
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

## Larghezza dei messaggi Chat

I messaggi Chat raggruppati usano una max-width predefinita leggibile. I deployment su monitor ampi possono sovrascriverla senza applicare patch al CSS in bundle impostando `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Il valore viene validato prima di raggiungere il browser. I valori supportati includono lunghezze e percentuali semplici come `960px` o `82%`, più espressioni di larghezza vincolate `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Accesso tailnet (consigliato)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Mantieni il Gateway su local loopback e lascia che Tailscale Serve lo instradi tramite proxy con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Serve di Control UI/WebSocket possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e le accetta solo quando la richiesta raggiunge il local loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore della Control UI con identità dispositivo browser, questo percorso Serve verificato salta anche il round trip di abbinamento del dispositivo; i browser senza dispositivo e le connessioni con ruolo nodo seguono comunque i normali controlli del dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso di identità Serve asincrono, i tentativi di autenticazione falliti per lo stesso IP client e scope di autenticazione vengono serializzati prima delle scritture del rate limit. Retry errati concorrenti dallo stesso browser possono quindi mostrare `retry later` alla seconda richiesta invece di due semplici mismatch in corsa in parallelo.

    <Warning>
    L'autenticazione Serve senza token presuppone che l'host del gateway sia attendibile. Se su quell'host può essere eseguito codice locale non attendibile, richiedi l'autenticazione con token/password.
    </Warning>

  </Tab>
  <Tab title="Associa a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Poi apri:

    - `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

    Incolla il segreto condiviso corrispondente nelle impostazioni dell'interfaccia utente (inviato come `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sicuro

Se apri la dashboard su semplice HTTP (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni Control UI senza identità del dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicura solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione operatore Control UI riuscita tramite `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri l'interfaccia utente localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host del gateway)

<AccordionGroup>
  <Accordion title="Comportamento del toggle di autenticazione non sicura">
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

    - Consente alle sessioni Control UI localhost di procedere senza identità del dispositivo in contesti HTTP non sicuri.
    - Non bypassa i controlli di abbinamento.
    - Non allenta i requisiti di identità del dispositivo remoto (non localhost).

  </Accordion>
  <Accordion title="Solo break-glass">
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
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo Control UI ed è un grave downgrade della sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Nota sul trusted-proxy">
    - Un'autenticazione trusted-proxy riuscita può ammettere sessioni Control UI **operatore** senza identità del dispositivo.
    - Questo **non** si estende alle sessioni Control UI con ruolo nodo.
    - I reverse proxy local loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Vedi [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Policy di sicurezza dei contenuti

La Control UI include una policy `img-src` rigorosa: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL immagine remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non effettuano fetch di rete.

Cosa significa in pratica:

- Avatar e immagini serviti sotto percorsi relativi (per esempio `/avatars/<id>`) vengono comunque renderizzati, incluse le route avatar autenticate che l'interfaccia utente recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` vengono comunque renderizzati (utile per payload in-protocol).
- Gli URL `blob:` locali creati dalla Control UI vengono comunque renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della Control UI e sostituiti con il logo/badge integrato, quindi un canale compromesso o malevolo non può forzare fetch di immagini remote arbitrarie da un browser operatore.

Non devi modificare nulla per ottenere questo comportamento — è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del gateway è configurata, l'endpoint avatar della Control UI richiede lo stesso token gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati dell'avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route sorella assistant-media). Questo impedisce alla route avatar di divulgare l'identità dell'agente su host che altrimenti sono protetti.
- La Control UI stessa inoltra il token gateway come header bearer quando recupera gli avatar e usa URL blob autenticati, così l'immagine viene comunque renderizzata nelle dashboard.

Se disabiliti l'autenticazione del gateway (non consigliato sugli host condivisi), anche la route dell'avatar diventa non autenticata, in linea con il resto del gateway.

## Autenticazione della route dei media dell'assistente

Quando l'autenticazione del gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione dell'operatore della UI di controllo. Il browser invia il token del gateway come intestazione bearer quando verifica la disponibilità.
- Le risposte dei metadati riuscite includono un `mediaTicket` di breve durata limitato a quell'esatto percorso sorgente.
- Gli URL di immagini, audio, video e documenti visualizzati dal browser usano `mediaTicket=<ticket>` invece del token o della password del gateway attivi. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi media nativi del browser senza inserire credenziali riutilizzabili del gateway negli URL dei media visibili.

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

Poi indirizza la UI all'URL WS del tuo Gateway (ad esempio `ws://127.0.0.1:18789`).

## Pagina vuota della UI di controllo

Se il browser carica una dashboard vuota e DevTools non mostra errori utili, un'estensione o uno script di contenuto anticipato potrebbe aver impedito la valutazione dell'app del modulo JavaScript. La pagina statica include un pannello di ripristino in HTML semplice che appare quando `<openclaw-app>` non è registrato dopo l'avvio.

Usa l'azione **Riprova** del pannello dopo aver modificato l'ambiente del browser, oppure ricarica manualmente dopo questi controlli:

- Disabilita le estensioni che iniettano contenuti in tutte le pagine, in particolare le estensioni con script di contenuto `<all_urls>`.
- Prova una finestra privata, un profilo browser pulito o un altro browser.
- Mantieni il Gateway in esecuzione e verifica lo stesso URL della dashboard dopo la modifica del browser.

## Debug/test: server di sviluppo + Gateway remoto

La UI di controllo è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. Questo è utile quando vuoi usare il server di sviluppo Vite in locale ma il Gateway è in esecuzione altrove.

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
  <Accordion title="Notes">
    - `gatewayUrl` viene archiviato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint `ws://` o `wss://` completo tramite `gatewayUrl`, codifica per URL il valore `gatewayUrl` in modo che il browser analizzi correttamente la stringa di query.
    - `token` deve essere passato tramite il frammento dell'URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene mantenuto solo in memoria.
    - Quando `gatewayUrl` è impostato, la UI non ripiega sulle credenziali della configurazione o dell'ambiente. Fornisci esplicitamente `token` (o `password`). La mancanza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni pubbliche non-loopback della UI di controllo devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). I caricamenti LAN/Tailnet privati con stessa origine da loopback, RFC1918/link-local, `.local`, `.ts.net` o host Tailscale CGNAT sono accettati senza abilitare il fallback dell'intestazione Host.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta effettivi del runtime, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` se non per test locali strettamente controllati. Significa consentire qualsiasi origine del browser, non "corrispondi a qualsiasi host stia usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la modalità di fallback dell'origine basata sull'intestazione Host, ma è una modalità di sicurezza pericolosa.

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

- [Dashboard](/it/web/dashboard) — dashboard del gateway
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del gateway
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser

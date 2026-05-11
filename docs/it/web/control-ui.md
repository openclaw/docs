---
read_when:
    - Vuoi utilizzare il Gateway da un browser
    - Vuoi accedere alla Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia utente di controllo basata su browser per il Gateway (chat, nodi, configurazione)
title: UI di controllo
x-i18n:
    generated_at: "2026-05-11T20:41:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

La UI di controllo è una piccola applicazione a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con il Gateway WebSocket** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità del proxy attendibile quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione della scheda corrente del browser e l'URL del gateway selezionato; le password non vengono mantenute. L'onboarding di solito genera un token del gateway per l'autenticazione a segreto condiviso alla prima connessione, ma anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti alla UI di controllo da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di associazione una tantum**. È una misura di sicurezza per impedire accessi non autorizzati.

**Cosa vedrai:** "disconnesso (1008): associazione richiesta"

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

Se il browser ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Riesegui `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo passi dall'accesso in lettura all'accesso in scrittura/admin, questa operazione viene trattata come un upgrade dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi [CLI dispositivi](/it/cli/devices) per la rotazione e la revoca dei token.

<Note>
- Le connessioni browser dirette tramite local loopback (`127.0.0.1` / `localhost`) vengono approvate automaticamente.
- Tailscale Serve può saltare il passaggio di associazione per le sessioni operatore della UI di controllo quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità del dispositivo.
- I bind diretti Tailnet, le connessioni browser LAN e i profili browser senza identità del dispositivo richiedono comunque un'approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Identità personale (locale al browser)

La UI di controllo supporta un'identità personale per browser (nome visualizzato e avatar) allegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Risiede nello spazio di archiviazione del browser, è limitata al profilo browser corrente e non viene sincronizzata su altri dispositivi né mantenuta lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuota.

Lo stesso modello locale al browser si applica alla sostituzione dell'avatar dell'assistente. Gli avatar assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non passano mai attraverso `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per i client non UI che scrivono direttamente il campo (come gateway scriptati o dashboard personalizzate).

## Endpoint di configurazione runtime

La UI di controllo recupera le proprie impostazioni runtime da `/__openclaw/control-ui-config.json`. Quell'endpoint è protetto dalla stessa autenticazione del gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo e un recupero riuscito richiede un token/password del gateway già valido, un'identità Tailscale Serve oppure un'identità di proxy attendibile.

## Supporto linguistico

La UI di controllo può localizzarsi al primo caricamento in base alla locale del browser. Per sovrascriverla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il selettore della locale si trova nella scheda Accesso Gateway, non sotto Aspetto.

- Locali supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La locale selezionata viene salvata nello spazio di archiviazione del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti usano l'inglese come fallback.

Le traduzioni della documentazione vengono generate per lo stesso insieme di locali non inglesi, ma il selettore lingua Mintlify integrato nel sito della documentazione è limitato ai codici locale accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repository di pubblicazione; potrebbe non apparire in quel selettore finché Mintlify non supporta quei codici.

## Temi di aspetto

Il pannello Aspetto mantiene i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

I temi importati vengono memorizzati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Gli aggiornamenti della cronologia chat richiedono una finestra recente limitata con limiti di testo per messaggio, così le sessioni grandi non costringono il browser a renderizzare un payload di trascrizione completo prima che la chat diventi utilizzabile.
    - Parla tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser monouso vincolato su WebSocket e i plugin vocali realtime solo backend usano il trasporto relay del Gateway. Le sessioni provider possedute dal client iniziano con `talk.client.create`; le sessioni relay Gateway iniziano con `talk.session.create`. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM dal microfono tramite `talk.session.appendAudio` e inoltra le chiamate agli strumenti provider `openclaw_agent_consult` tramite `talk.client.toolCall` per la policy del Gateway e il modello OpenClaw configurato più ampio.
    - Trasmetti chiamate agli strumenti + schede di output live degli strumenti nella chat (eventi agente).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Canali: stato dei canali integrati più plugin in bundle/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Gli aggiornamenti dei probe dei canali mantengono visibile lo snapshot precedente mentre i controlli lenti del provider terminano, e gli snapshot parziali vengono etichettati quando un probe o audit supera il proprio budget UI.
    - Istanze: elenco presenza + aggiornamento (`system-presence`).
    - Sessioni: elenca per impostazione predefinita le sessioni degli agenti configurati, usa come fallback chiavi di sessione obsolete di agenti non configurati e applica override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Dreams: stato dreaming, toggle abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti delle chiavi API (`skills.*`).
    - Nodi: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica allowlist di gateway o nodo + policy di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Applica + riavvia con validazione (`config.apply`) e risveglia l'ultima sessione attiva.
    - Le scritture includono una protezione con hash di base per evitare di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) eseguono un preflight della risoluzione SecretRef attiva per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - Rendering di schema + modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` dei campi, suggerimenti UI corrispondenti, riepiloghi dei figli immediati, metadati docs sui nodi oggetto annidato/wildcard/array/composizione, più schemi di plugin + canale quando disponibili); l'editor JSON grezzo è disponibile solo quando lo snapshot ha un round-trip grezzo sicuro.
    - Se uno snapshot non può eseguire in sicurezza il round-trip del testo grezzo, la UI di controllo forza la modalità Modulo e disabilita la modalità Grezzo per quello snapshot.
    - "Ripristina salvato" dell'editor JSON grezzo preserva la forma creata in grezzo (formattazione, commenti, layout `$include`) invece di renderizzare di nuovo uno snapshot appiattito, così le modifiche esterne sopravvivono a un ripristino quando lo snapshot può eseguire in sicurezza il round-trip.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per prevenire la corruzione accidentale da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: snapshot di stato/salute/modelli + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il log eventi include tempi di aggiornamento/RPC della UI di controllo, tempi di rendering lenti di chat/config e voci di reattività del browser per frame di animazione lunghi o task lunghi quando il browser espone quei tipi di voce PerformanceObserver.
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio, poi interroga `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Per i job isolati, la consegna predefinita annuncia un riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/target appaiono quando annuncio è selezionato.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
    - Per i job della sessione principale, sono disponibili le modalità di consegna webhook e nessuna.
    - I controlli di modifica avanzata includono elimina-dopo-esecuzione, cancella override agente, opzioni cron esatto/scaglionato, override modello/thinking agente e toggle di consegna best-effort.
    - La validazione del modulo è inline con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un token bearer dedicato; se omesso, il webhook viene inviato senza un header di autenticazione.
    - Fallback deprecato: i job legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

  </Accordion>
</AccordionGroup>

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa in streaming tramite eventi `chat`.
    - I caricamenti in chat accettano immagini e file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link agli allegati.
    - Il reinvio con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
    - Le risposte di `chat.history` hanno limiti di dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire messaggi sovradimensionati con un segnaposto (`[chat.history omitted: message too large]`).
    - Le immagini dell'assistente/generate vengono mantenute come riferimenti a media gestiti e restituite tramite URL media Gateway autenticati, quindi i ricaricamenti non dipendono dalla permanenza dei payload immagine base64 grezzi nella risposta della cronologia chat.
    - Durante il rendering di `chat.history`, la UI di controllo rimuove dal testo visibile dell'assistente i tag di direttiva inline solo per visualizzazione (ad esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML delle chiamate a strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate a strumenti troncati) e i token di controllo modello trapelati ASCII/a larghezza intera, e omette le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply` o il token di conferma Heartbeat `HEARTBEAT_OK`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi locali ottimistici di utente/assistente se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia del Gateway si aggiorna.
    - Gli eventi live `chat` sono stato di consegna, mentre `chat.history` viene ricostruito dalla trascrizione durevole della sessione. Dopo gli eventi finali degli strumenti, la UI di controllo ricarica la cronologia e unisce solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione dell'agente, nessuna consegna al canale).
    - L'intestazione della chat mostra il filtro agente prima del selettore di sessione, e il selettore di sessione è limitato all'agente selezionato. Cambiando agente vengono mostrate solo le sessioni legate a quell'agente e, se non ha ancora sessioni dashboard salvate, viene usata come fallback la sessione principale di quell'agente.
    - Su larghezze desktop, i controlli chat restano su una riga compatta e si comprimono durante lo scorrimento verso il basso della trascrizione; scorrere verso l'alto, tornare in cima o raggiungere il fondo ripristina i controlli.
    - I messaggi consecutivi duplicati solo testo vengono visualizzati come una singola bolla con un badge di conteggio. I messaggi che contengono immagini, allegati, output di strumenti o anteprime canvas non vengono compressi.
    - I selettori del modello chat e del thinking aggiornano immediatamente la sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide solo per un turno.
    - Se invii un messaggio mentre una modifica del selettore modello per la stessa sessione è ancora in salvataggio, il composer attende quella patch di sessione prima di chiamare `chat.send`, così l'invio usa il modello selezionato.
    - Digitare `/new` nella UI di controllo crea e passa alla stessa nuova sessione dashboard di Nuova chat, tranne quando è configurato `session.dmScope: "main"` e il genitore corrente è la sessione principale dell'agente; in quel caso reimposta la sessione principale sul posto. Digitare `/reset` mantiene il reset esplicito sul posto del Gateway per la sessione corrente.
    - Il selettore del modello chat richiede la vista modello configurata del Gateway. Se `agents.defaults.models` è presente, quella lista consentita guida il selettore, incluse le voci `provider/*` che mantengono dinamici i cataloghi con ambito provider. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite la RPC di debug `models.list` con `view: "all"`.
    - Quando i report di utilizzo sessione freschi del Gateway includono i token di contesto correnti, l'area del composer chat mostra un indicatore compatto dell'utilizzo del contesto. Passa a uno stile di avviso quando la pressione sul contesto è alta e, ai livelli di Compaction consigliati, mostra un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot dei token non aggiornati vengono nascosti finché il Gateway non segnala di nuovo un utilizzo fresco.

  </Accordion>
  <Accordion title="Modalità conversazione (realtime nel browser)">
    La modalità conversazione usa un provider voce realtime registrato. Configura OpenAI con `talk.realtime.provider: "openai"` più `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` oppure un profilo OAuth `openai-codex`; configura Google con `talk.realtime.provider: "google"` più `talk.realtime.providers.google.apiKey`. Il browser non riceve mai una chiave API standard del provider. OpenAI riceve un client secret Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay del Gateway, quindi credenziali e socket del vendor restano lato server mentre l'audio del browser passa attraverso RPC Gateway autenticate. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.client.create` non accetta override delle istruzioni forniti dal chiamante.

    Il composer Chat include un pulsante opzioni di conversazione accanto al pulsante avvia/interrompi conversazione. Le opzioni si applicano alla sessione di conversazione successiva e possono sovrascrivere provider, trasporto, modello, voce, reasoning effort, soglia VAD, durata del silenzio e padding del prefisso. Quando un'opzione è vuota, il Gateway usa i valori predefiniti configurati dove disponibili o il valore predefinito del provider. Selezionare il relay Gateway forza il percorso relay backend; selezionare WebRTC mantiene la sessione di proprietà del client e fallisce invece di ripiegare silenziosamente sul relay se il provider non può creare una sessione browser.

    Nel composer Chat, il controllo conversazione è il pulsante a onde accanto al pulsante di dettatura con microfono. Quando la conversazione parte, la riga di stato del composer mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata a strumento realtime consulta il modello più grande configurato tramite `talk.client.toolCall`.

    Smoke live per maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica il bridge WebSocket backend OpenAI, lo scambio SDP WebRTC browser OpenAI, la configurazione WebSocket browser con token vincolato Google Live e l'adattatore browser relay Gateway con media microfono fittizi. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Stop e interruzione">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i normali follow-up vengono messi in coda. Fai clic su **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di interruzione come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione dei parziali interrotti">
    - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nella UI.
    - Il Gateway mantiene il testo parziale interrotto dell'assistente nella cronologia della trascrizione quando esiste output bufferizzato.
    - Le voci mantenute includono metadati di interruzione così i consumatori della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e web push

La UI di controllo distribuisce un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

| Superficie                                             | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (sotto la directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare i payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione browser mantenuti.                      |

Sovrascrivi la coppia di chiavi VAPID tramite variabili d'ambiente sul processo Gateway quando vuoi bloccare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito a `mailto:openclaw@localhost`)

La UI di controllo usa questi metodi Gateway limitati per ambito per registrare e testare sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay APNS iOS (vedi [Configurazione](/it/gateway/configuration) per il push basato su relay) e dal metodo `push.test` esistente, che ha come target l'associazione mobile nativa.
</Note>

## Embed ospitati

I messaggi dell'assistente possono visualizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script dentro gli embed ospitati.
  </Tab>
  <Tab title="scripts (default)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; questa è l'impostazione predefinita e di solito basta per giochi/widget browser autonomi.
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
Usa `trusted` solo quando il documento incorporato ha realmente bisogno del comportamento same-origin. Per la maggior parte dei giochi generati da agenti e dei canvas interattivi, `scripts` è la scelta più sicura.
</Warning>

Gli URL embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Larghezza dei messaggi chat

I messaggi chat raggruppati usano una max-width predefinita leggibile. Le distribuzioni su monitor ampi possono sovrascriverla senza modificare il CSS in bundle impostando `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Il valore viene validato prima di raggiungere il browser. I valori supportati includono lunghezze semplici e percentuali come `960px` o `82%`, più espressioni di larghezza vincolate `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Accesso tailnet (consigliato)

<Tabs>
  <Tab title="Tailscale Serve integrato (preferito)">
    Mantieni il Gateway su loopback e lascia che Tailscale Serve faccia da proxy con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Control UI/WebSocket Serve possono autenticarsi tramite le intestazioni di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'intestazione, e accetta queste richieste solo quando arrivano sul loopback con le intestazioni `x-forwarded-*` di Tailscale. Per le sessioni operatore di Control UI con identità dispositivo del browser, questo percorso Serve verificato salta anche il round trip di abbinamento del dispositivo; i browser senza dispositivo e le connessioni con ruolo di nodo seguono comunque i normali controlli del dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso asincrono di identità Serve, i tentativi di autenticazione non riusciti per lo stesso IP client e ambito di autenticazione vengono serializzati prima delle scritture del limite di frequenza. Retry errati simultanei dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta invece di due semplici mancati riscontri in competizione in parallelo.

    <Warning>
    L'autenticazione Serve senza token presume che l'host gateway sia attendibile. Se codice locale non attendibile può essere eseguito su quell'host, richiedi l'autenticazione con token/password.
    </Warning>

  </Tab>
  <Tab title="Associa alla tailnet + token">
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

- compatibilità HTTP non sicuro solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione operatore Control UI riuscita tramite `gateway.auth.mode: "trusted-proxy"`
- opzione di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) o apri l'interfaccia utente localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host Gateway)

<AccordionGroup>
  <Accordion title="Comportamento dell'opzione di autenticazione non sicura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` è solo un'opzione di compatibilità locale:

    - Consente alle sessioni Control UI localhost di procedere senza identità dispositivo in contesti HTTP non sicuri.
    - Non aggira i controlli di abbinamento.
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
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità dispositivo di Control UI ed è un grave declassamento della sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Nota su trusted-proxy">
    - Un'autenticazione trusted-proxy riuscita può ammettere sessioni Control UI **operatore** senza identità dispositivo.
    - Questo **non** si estende alle sessioni Control UI con ruolo di nodo.
    - I proxy inversi loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Vedi [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Criterio di sicurezza dei contenuti

Control UI viene distribuita con un criterio `img-src` restrittivo: sono consentiti solo asset della **stessa origine**, URL `data:` e URL `blob:` generati localmente. Gli URL immagine remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Avatar e immagini serviti sotto percorsi relativi (per esempio `/avatars/<id>`) vengono comunque renderizzati, incluse le route avatar autenticate che l'interfaccia utente recupera e converte in URL `blob:` locali.
- Gli URL `data:image/...` inline vengono comunque renderizzati (utile per payload nel protocollo).
- Gli URL `blob:` locali creati da Control UI vengono comunque renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar di Control UI e sostituiti con il logo/badge integrato, quindi un canale compromesso o dannoso non può forzare recuperi arbitrari di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del Gateway è configurata, l'endpoint avatar di Control UI richiede lo stesso token del Gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati dell'avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route sorella assistant-media). Questo impedisce alla route avatar di divulgare l'identità dell'agente su host altrimenti protetti.
- Control UI inoltra il token del Gateway come intestazione bearer quando recupera gli avatar e usa URL blob autenticati affinché l'immagine venga comunque renderizzata nelle dashboard.

Se disabiliti l'autenticazione del Gateway (non consigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del Gateway.

## Autenticazione della route media dell'assistente

Quando l'autenticazione del Gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione operatore di Control UI. Il browser invia il token del Gateway come intestazione bearer quando verifica la disponibilità.
- Le risposte di metadati riuscite includono un `mediaTicket` a breve durata con ambito limitato a quel percorso sorgente esatto.
- Gli URL di immagini, audio, video e documenti renderizzati dal browser usano `mediaTicket=<ticket>` invece del token o della password del Gateway attivi. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi media nativi del browser senza inserire credenziali riutilizzabili del Gateway negli URL media visibili.

## Creazione dell'interfaccia utente

Il Gateway serve file statici da `dist/control-ui`. Creali con:

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

Poi punta l'interfaccia utente all'URL WS del tuo Gateway (per esempio `ws://127.0.0.1:18789`).

## Pagina Control UI vuota

Se il browser carica una dashboard vuota e DevTools non mostra errori utili, un'estensione o uno script di contenuto precoce potrebbe aver impedito la valutazione dell'app del modulo JavaScript. La pagina statica include un pannello di ripristino in HTML semplice che appare quando `<openclaw-app>` non è registrato dopo l'avvio.

Usa l'azione **Riprova** del pannello dopo aver modificato l'ambiente del browser, oppure ricarica manualmente dopo questi controlli:

- Disabilita le estensioni che iniettano codice in tutte le pagine, in particolare estensioni con script di contenuto `<all_urls>`.
- Prova una finestra privata, un profilo browser pulito o un altro browser.
- Mantieni il Gateway in esecuzione e verifica lo stesso URL della dashboard dopo la modifica del browser.

## Debug/test: server di sviluppo + Gateway remoto

Control UI è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. Questo è comodo quando vuoi il server di sviluppo Vite in locale ma il Gateway è in esecuzione altrove.

<Steps>
  <Step title="Avvia il server di sviluppo dell'interfaccia utente">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Apri con gatewayUrl">
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
    - `gatewayUrl` viene salvato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint completo `ws://` o `wss://` tramite `gatewayUrl`, codifica in URL il valore `gatewayUrl` affinché il browser analizzi correttamente la stringa di query.
    - `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene conservata solo in memoria.
    - Quando `gatewayUrl` è impostato, l'interfaccia utente non ripiega sulle credenziali di configurazione o di ambiente. Fornisci esplicitamente `token` (o `password`). L'assenza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di primo livello (non incorporata) per impedire il clickjacking.
    - Le distribuzioni Control UI non loopback devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). Questo include le configurazioni di sviluppo remoto.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta runtime effettivi, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non "corrispondi a qualunque host io stia usando."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la modalità di fallback dell'origine dall'intestazione Host, ma è una modalità di sicurezza pericolosa.

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

- [Dashboard](/it/web/dashboard) — dashboard del gateway
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del gateway
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [WebChat](/it/web/webchat) — interfaccia di chat basata sul browser

---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi accedere a Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia utente di controllo basata su browser per il Gateway (chat, nodi, configurazione)
title: Interfaccia di controllo
x-i18n:
    generated_at: "2026-05-05T06:19:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: d249559d26ef8d257a14b104a797442e9fbb67a8ab31c7fcc9eaa4127f29c933
    source_path: web/control-ui.md
    workflow: 16
---

L’UI di controllo è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non viene caricata, avvia prima il Gateway: `openclaw gateway`.

L’autenticazione viene fornita durante l’handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- intestazioni di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- intestazioni di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione della scheda del browser corrente e l’URL del gateway selezionato; le password non vengono persistite. L’onboarding di solito genera un token del gateway per l’autenticazione a segreto condiviso alla prima connessione, ma funziona anche l’autenticazione con password quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti all’UI di controllo da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di associazione una tantum**. È una misura di sicurezza per impedire accessi non autorizzati.

**Cosa vedrai:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Elenca le richieste in sospeso">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approva per ID richiesta">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Se il browser ritenta l’associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Riesegui `openclaw devices list` prima dell’approvazione.

Se il browser è già associato e lo cambi da accesso in lettura ad accesso in scrittura/admin, viene trattato come un upgrade dell’approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione con privilegi più ampi e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI dispositivi](/it/cli/devices) per la rotazione e la revoca dei token.

<Note>
- Le connessioni browser dirette tramite local loopback (`127.0.0.1` / `localhost`) vengono approvate automaticamente.
- Tailscale Serve può saltare il round trip di associazione per le sessioni operatore dell’UI di controllo quando `gateway.auth.allowTailscale: true`, l’identità Tailscale viene verificata e il browser presenta la propria identità dispositivo.
- I bind Tailnet diretti, le connessioni browser LAN e i profili browser senza identità dispositivo richiedono comunque un’approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Identità personale (locale al browser)

L’UI di controllo supporta un’identità personale per browser (nome visualizzato e avatar) associata ai messaggi in uscita per l’attribuzione nelle sessioni condivise. Vive nell’archiviazione del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né persistita lato server oltre ai normali metadati di autorialità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuoto.

Lo stesso schema locale al browser si applica all’override dell’avatar dell’assistente. Gli avatar assistente caricati sovrappongono l’identità risolta dal gateway solo nel browser locale e non fanno mai un round trip tramite `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per client non UI che scrivono direttamente il campo (come gateway scriptati o dashboard personalizzate).

## Endpoint di configurazione runtime

L’UI di controllo recupera le proprie impostazioni runtime da `/__openclaw/control-ui-config.json`. Quell’endpoint è protetto dalla stessa autenticazione del gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo e un recupero riuscito richiede un token/password del gateway già valido, un’identità Tailscale Serve oppure un’identità trusted-proxy.

## Supporto linguistico

L’UI di controllo può localizzarsi al primo caricamento in base alla lingua del tuo browser. Per modificarla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il selettore della lingua si trova nella scheda Accesso Gateway, non sotto Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modalità lazy nel browser.
- La lingua selezionata viene salvata nell’archiviazione del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ricadono sull’inglese.

Le traduzioni della documentazione vengono generate per lo stesso insieme di lingue non inglesi, ma il selettore di lingua Mintlify integrato nel sito della documentazione è limitato ai codici lingua accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repo di pubblicazione; potrebbe non comparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi di aspetto

Il pannello Aspetto mantiene i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L’importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell’editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

I temi importati vengono archiviati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l’unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e conversazione vocale">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Parla tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser vincolato monouso su WebSocket e i plugin vocali realtime solo backend usano il trasporto relay del Gateway. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette in streaming il PCM del microfono tramite RPC `talk.realtime.relay*` e invia chiamate allo strumento `openclaw_agent_consult` tramite `chat.send` al modello OpenClaw configurato più grande.
    - Trasmetti in streaming chiamate agli strumenti + schede di output strumenti live nella chat (eventi agente).

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: stato dei canali integrati più quelli di plugin inclusi/esterni, accesso QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Istanze: elenco presenza + aggiornamento (`system-presence`).
    - Sessioni: elenco + override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sogni: stato di Dreaming, toggle abilita/disabilita e lettore Diario dei sogni (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodi, approvazioni exec">
    - Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti chiavi API (`skills.*`).
    - Nodi: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica allowlist del gateway o dei nodi + policy di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Applica + riavvia con validazione (`config.apply`) e risveglia l’ultima sessione attiva.
    - Le scritture includono una protezione con hash di base per evitare di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) verificano preliminarmente la risoluzione dei SecretRef attivi per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - Schema + rendering del modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` dei campi, suggerimenti UI corrispondenti, riepiloghi dei figli immediati, metadati della documentazione sui nodi oggetto annidato/wildcard/array/composizione, più schemi di plugin + canali quando disponibili); l’editor JSON grezzo è disponibile solo quando lo snapshot ha un round trip grezzo sicuro.
    - Se uno snapshot non può effettuare in sicurezza il round trip del testo grezzo, l’UI di controllo forza la modalità Modulo e disabilita la modalità Grezza per quello snapshot.
    - L’editor JSON grezzo "Reimposta a salvato" preserva la forma scritta in modalità grezza (formattazione, commenti, layout `$include`) invece di rirenderizzare uno snapshot appiattito, così le modifiche esterne sopravvivono a un reset quando lo snapshot può effettuare in sicurezza il round trip.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per impedire la corruzione accidentale da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot di stato/salute/modelli + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il log eventi include i tempi di refresh/RPC dell’UI di controllo più voci di reattività del browser per frame di animazione lunghi o task lunghi quando il browser espone quei tipi di voce PerformanceObserver.
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento pacchetto/git + riavvio (`update.run`) con un report di riavvio, poi interroga `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Note sul pannello job Cron">
    - Per job isolati, la consegna predefinita è annunciare il riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/destinazione compaiono quando l’annuncio è selezionato.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
    - Per job della sessione principale, sono disponibili le modalità di consegna webhook e nessuna.
    - I controlli di modifica avanzati includono delete-after-run, cancellazione override agente, opzioni cron esatte/scaglionate, override modello/thinking agente e toggle di consegna best-effort.
    - La validazione del modulo è inline con errori a livello di campo; valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un token bearer dedicato; se omesso, il webhook viene inviato senza intestazione di autenticazione.
    - Fallback deprecato: i job legacy archiviati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

  </Accordion>
</AccordionGroup>

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa in streaming tramite eventi `chat`.
    - I caricamenti in chat accettano immagini e file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come contenuti multimediali gestiti e mostrati nella cronologia come link di allegati.
    - Reinviare con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
    - Le risposte `chat.history` hanno limiti di dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare i campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire i messaggi sovradimensionati con un segnaposto (`[chat.history omitted: message too large]`).
    - Le immagini dell'assistente/generate vengono mantenute come riferimenti a contenuti multimediali gestiti e servite nuovamente tramite URL multimediali autenticati del Gateway, quindi i ricaricamenti non dipendono dal fatto che i payload immagine raw in base64 restino nella risposta della cronologia chat.
    - Durante il rendering di `chat.history`, la Control UI rimuove dal testo visibile dell'assistente i tag di direttive inline solo di visualizzazione (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamate a strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate a strumenti troncati) e i token di controllo del modello ASCII/a larghezza piena fuoriusciti, e omette le voci dell'assistente il cui intero testo visibile è solo l'esatto token silenzioso `NO_REPLY` / `no_reply` o il token di conferma Heartbeat `HEARTBEAT_OK`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi locali ottimistici di utente/assistente se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia del Gateway si allinea.
    - Gli eventi `chat` live sono lo stato di consegna, mentre `chat.history` viene ricostruito dalla trascrizione durevole della sessione. Dopo gli eventi finali degli strumenti, la Control UI ricarica la cronologia e unisce solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessuna consegna al canale).
    - L'intestazione della chat mostra il filtro agente prima del selettore di sessione, e il selettore di sessione è limitato all'agente selezionato. Cambiare agente mostra solo le sessioni legate a quell'agente e ripiega sulla sessione principale di quell'agente quando non ha ancora sessioni dashboard salvate.
    - Sulle larghezze desktop, i controlli della chat restano su una singola riga compatta e si comprimono durante lo scorrimento verso il basso nella trascrizione; scorrere verso l'alto, tornare all'inizio o raggiungere il fondo ripristina i controlli.
    - Messaggi consecutivi duplicati solo testo vengono renderizzati come un'unica bolla con un badge conteggio. I messaggi che contengono immagini, allegati, output di strumenti o anteprime canvas non vengono compressi.
    - I selettori di modello e ragionamento dell'intestazione chat applicano immediatamente la modifica alla sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide solo per un turno.
    - Digitare `/new` nella Control UI crea e passa alla stessa nuova sessione dashboard di New Chat. Digitare `/reset` mantiene il reset esplicito in-place del Gateway per la sessione corrente.
    - Il selettore del modello chat richiede la vista dei modelli configurata del Gateway. Se `agents.defaults.models` è presente, quella allowlist guida il selettore. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite l'RPC di debug `models.list` con `view: "all"`.
    - Quando i report aggiornati sull'uso della sessione del Gateway mostrano alta pressione di contesto, l'area del composer chat mostra un avviso di contesto e, ai livelli di compaction raccomandati, un pulsante compatto che esegue il normale percorso di compaction della sessione. Gli snapshot token obsoleti vengono nascosti finché il Gateway non segnala di nuovo un uso aggiornato.

  </Accordion>
  <Accordion title="Modalità conversazione (tempo reale nel browser)">
    La modalità conversazione usa un provider vocale realtime registrato. Configura OpenAI con `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure configura Google con `talk.provider: "google"` più `talk.providers.google.apiKey`; la configurazione del provider realtime Voice Call può ancora essere riutilizzata come fallback. Il browser non riceve mai una chiave API standard del provider. OpenAI riceve un segreto client Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato e monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay del Gateway, quindi le credenziali e i socket del vendor restano lato server mentre l'audio del browser passa tramite RPC autenticati del Gateway. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.realtime.session` non accetta override delle istruzioni forniti dal chiamante.

    Nel composer Chat, il controllo Talk è il pulsante con le onde accanto al pulsante di dettatura con microfono. Quando Talk si avvia, la riga di stato del composer mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata a strumento realtime consulta il modello più grande configurato tramite `chat.send`.

    Smoke live per maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica lo scambio SDP WebRTC browser di OpenAI, la configurazione WebSocket browser con token vincolato di Google Live e l'adapter browser relay del Gateway con media microfono finti. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Stop e interruzione">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i follow-up normali vengono accodati. Fai clic su **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi di interruzione autonome come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (nessun `runId`) per interrompere tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale dopo interruzione">
    - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può ancora essere mostrato nella UI.
    - Il Gateway mantiene il testo parziale interrotto dell'assistente nella cronologia della trascrizione quando esiste output nel buffer.
    - Le voci mantenute includono metadati di interruzione, così i consumer della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e Web Push

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

| Superficie                                             | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (nella directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione browser mantenuti.                      |

Sovrascrivi la coppia di chiavi VAPID tramite variabili d'ambiente sul processo Gateway quando vuoi fissare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito a `mailto:openclaw@localhost`)

La Control UI usa questi metodi del Gateway limitati per ambito per registrare e testare le sottoscrizioni del browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay iOS APNS (vedi [Configurazione](/it/gateway/configuration) per push basato su relay) e dal metodo `push.test` esistente, che punta all'abbinamento mobile nativo.
</Note>

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script negli embed ospitati.
  </Tab>
  <Tab title="scripts (predefinito)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; questo è il valore predefinito e di solito basta per giochi/widget browser autonomi.
  </Tab>
  <Tab title="trusted">
    Aggiunge `allow-same-origin` sopra `allow-scripts` per documenti dello stesso sito che hanno intenzionalmente bisogno di privilegi più forti.
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
Usa `trusted` solo quando il documento incorporato ha davvero bisogno del comportamento same-origin. Per la maggior parte dei giochi generati dall'agente e dei canvas interattivi, `scripts` è la scelta più sicura.
</Warning>

Gli URL embed assoluti esterni `http(s)` restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Larghezza dei messaggi chat

I messaggi chat raggruppati usano una larghezza massima predefinita leggibile. Le distribuzioni su monitor ampi possono sovrascriverla senza modificare il CSS incluso impostando `gateway.controlUi.chatMessageMaxWidth`:

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
    Mantieni il Gateway su loopback e lascia che Tailscale Serve lo proxy con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Control UI/WebSocket Serve possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e accetta queste richieste solo quando arrivano su loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore della Control UI con identità dispositivo del browser, questo percorso Serve verificato salta anche il round trip di abbinamento dispositivo; i browser senza dispositivo e le connessioni con ruolo nodo seguono ancora i normali controlli dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso async di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client e ambito auth vengono serializzati prima delle scritture di rate limit. Retry errati concorrenti dallo stesso browser possono quindi mostrare `retry later` alla seconda richiesta invece di due semplici mancati match in gara parallela.

    <Warning>
    L'autenticazione Serve senza token presume che l'host del gateway sia attendibile. Se codice locale non attendibile può essere eseguito su quell'host, richiedi autenticazione token/password.
    </Warning>

  </Tab>
  <Tab title="Associa a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Poi apri:

    - `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

    Incolla il segreto condiviso corrispondente nelle impostazioni della UI (inviato come `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sicuro

Se apri la dashboard su HTTP semplice (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni alla UI di controllo senza identità del dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicura solo per localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita della UI di controllo operatore tramite `gateway.auth.mode: "trusted-proxy"`
- opzione di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` è solo un interruttore di compatibilità locale:

    - Consente alle sessioni della UI di controllo localhost di procedere senza identità del dispositivo in contesti HTTP non sicuri.
    - Non aggira i controlli di abbinamento.
    - Non allenta i requisiti di identità del dispositivo remoto (non-localhost).

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
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della UI di controllo ed è un grave indebolimento della sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Un'autenticazione trusted-proxy riuscita può ammettere sessioni della UI di controllo **operatore** senza identità del dispositivo.
    - Questo **non** si estende alle sessioni della UI di controllo con ruolo nodo.
    - I proxy inversi loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; consulta [autenticazione trusted proxy](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Policy di sicurezza dei contenuti

La UI di controllo viene distribuita con una policy `img-src` rigorosa: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL di immagini remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Avatar e immagini serviti sotto percorsi relativi (ad esempio `/avatars/<id>`) vengono comunque renderizzati, incluse le route avatar autenticate che la UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` vengono comunque renderizzati (utile per payload nel protocollo).
- Gli URL `blob:` locali creati dalla UI di controllo vengono comunque renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della UI di controllo e sostituiti con il logo/badge integrato, quindi un canale compromesso o dannoso non può forzare recuperi arbitrari di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del Gateway è configurata, l'endpoint avatar della UI di controllo richiede lo stesso token del Gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati avatar secondo la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come per la route sorella assistant-media). Questo impedisce alla route avatar di rivelare l'identità dell'agente su host altrimenti protetti.
- La UI di controllo inoltra il token del Gateway come header bearer quando recupera gli avatar e usa URL blob autenticati in modo che l'immagine venga comunque renderizzata nelle dashboard.

Se disabiliti l'autenticazione del Gateway (non consigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del Gateway.

## Autenticazione della route media dell'assistente

Quando l'autenticazione del Gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione operatore della UI di controllo. Il browser invia il token del Gateway come header bearer quando controlla la disponibilità.
- Le risposte di metadati riuscite includono un `mediaTicket` di breve durata limitato a quell'esatto percorso sorgente.
- Gli URL di immagini, audio, video e documenti renderizzati dal browser usano `mediaTicket=<ticket>` invece del token o della password attivi del Gateway. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi multimediali nativi del browser senza inserire credenziali riutilizzabili del Gateway negli URL media visibili.

## Creazione della UI

Il Gateway serve file statici da `dist/control-ui`. Creali con:

```bash
pnpm ui:build
```

Base assoluta facoltativa (quando vuoi URL asset fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server di sviluppo separato):

```bash
pnpm ui:dev
```

Poi punta la UI all'URL WS del tuo Gateway (ad es. `ws://127.0.0.1:18789`).

## Debug/test: server di sviluppo + Gateway remoto

La UI di controllo è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. Questo è utile quando vuoi usare localmente il server di sviluppo Vite ma il Gateway è in esecuzione altrove.

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

    Autenticazione una tantum facoltativa (se necessaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` viene memorizzato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint `ws://` o `wss://` completo tramite `gatewayUrl`, codifica come URL il valore `gatewayUrl` in modo che il browser analizzi correttamente la stringa di query.
    - `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` resta solo in memoria.
    - Quando `gatewayUrl` è impostato, la UI non ripiega sulle credenziali di configurazione o di ambiente. Fornisci esplicitamente `token` (o `password`). Le credenziali esplicite mancanti sono un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni non loopback della UI di controllo devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). Questo include le configurazioni di sviluppo remoto.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta runtime effettivi, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non "abbina qualunque host io stia usando."
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

Dettagli di configurazione dell'accesso remoto: [Accesso remoto](/it/gateway/remote).

## Correlati

- [Dashboard](/it/web/dashboard) — dashboard del Gateway
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del Gateway
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser

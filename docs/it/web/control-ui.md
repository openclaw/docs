---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi l'accesso a Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia di controllo basata su browser per il Gateway (chat, nodi, configurazione)
title: Interfaccia di controllo
x-i18n:
    generated_at: "2026-05-02T21:02:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

L'interfaccia di controllo è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Se la pagina non riesce a caricarsi, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità di Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità del proxy attendibile quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione della scheda del browser corrente e per l'URL del gateway selezionato; le password non vengono mantenute. L'onboarding di solito genera un token del gateway per l'autenticazione con segreto condiviso alla prima connessione, ma anche l'autenticazione tramite password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti all'interfaccia di controllo da un nuovo browser o dispositivo, il Gateway di solito richiede un'**approvazione di associazione monouso**. È una misura di sicurezza per impedire accessi non autorizzati.

**Cosa vedrai:** "disconnesso (1008): associazione richiesta"

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

Se il browser è già associato e lo cambi da accesso in lettura ad accesso in scrittura/amministrazione, questo viene trattato come un upgrade di approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi [CLI dei dispositivi](/it/cli/devices) per la rotazione e la revoca dei token.

<Note>
- Le connessioni dirette dal browser tramite local loopback (`127.0.0.1` / `localhost`) vengono approvate automaticamente.
- Tailscale Serve può saltare il ciclo di associazione per le sessioni operatore dell'interfaccia di controllo quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità del dispositivo.
- I bind diretti Tailnet, le connessioni browser LAN e i profili browser senza identità del dispositivo richiedono comunque approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Identità personale (locale del browser)

L'interfaccia di controllo supporta un'identità personale per browser (nome visualizzato e avatar) allegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Risiede nello storage del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né mantenuta lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. La cancellazione dei dati del sito o il cambio di browser la reimposta a vuoto.

Lo stesso schema locale del browser si applica all'override dell'avatar dell'assistente. Gli avatar assistente caricati si sovrappongono all'identità risolta dal gateway solo nel browser locale e non transitano mai tramite `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per client non UI che scrivono direttamente il campo (come gateway scriptati o dashboard personalizzate).

## Endpoint di configurazione runtime

L'interfaccia di controllo recupera le proprie impostazioni runtime da `/__openclaw/control-ui-config.json`. Tale endpoint è protetto dalla stessa autenticazione del gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo e un recupero riuscito richiede un token/password gateway già valido, un'identità Tailscale Serve o un'identità proxy attendibile.

## Supporto linguistico

L'interfaccia di controllo può localizzarsi al primo caricamento in base alla lingua del browser. Per modificarla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il selettore della lingua si trova nella scheda Accesso Gateway, non sotto Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti usano l'inglese come fallback.

Le traduzioni della documentazione vengono generate per lo stesso insieme di lingue non inglesi, ma il selettore di lingua Mintlify integrato nel sito della documentazione è limitato ai codici lingua accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repo di pubblicazione; potrebbe non apparire in quel selettore finché Mintlify non supporta tali codici.

## Temi dell'aspetto

Il pannello Aspetto mantiene i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale del browser. Per importare un tema, apri [temi tweakcn](https://tweakcn.com/themes), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

I temi importati vengono archiviati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e conversazione vocale">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Parla tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser vincolato monouso tramite WebSocket, e i Plugin vocali realtime solo backend usano il trasporto relay del Gateway. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM del microfono tramite RPC `talk.realtime.relay*` e invia chiamate tool `openclaw_agent_consult` tramite `chat.send` al modello OpenClaw più grande configurato.
    - Esegui lo streaming delle chiamate tool + schede di output tool live nella chat (eventi agent).

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: stato dei canali integrati più quelli dei Plugin in bundle/esterni, accesso QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Istanze: elenco presenza + aggiornamento (`system-presence`).
    - Sessioni: elenco + override per sessione di modello/thinking/veloce/verboso/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sogni: stato di Dreaming, toggle abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node, approvazioni exec">
    - Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti chiave API (`skills.*`).
    - Node: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica allowlist del gateway o del Node + criterio di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Applica + riavvia con validazione (`config.apply`) e riattiva l'ultima sessione attiva.
    - Le scritture includono una protezione con hash di base per evitare di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) verificano in preflight la risoluzione dei SecretRef attivi per i riferimenti nel payload di configurazione inviato; i riferimenti inviati attivi non risolti vengono rifiutati prima della scrittura.
    - Rendering di schema + modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` del campo, hint UI corrispondenti, riepiloghi dei figli immediati, metadati della documentazione su nodi oggetto nidificato/wildcard/array/composizione, più schemi Plugin + canali quando disponibili); l'editor JSON grezzo è disponibile solo quando lo snapshot ha un round trip grezzo sicuro.
    - Se uno snapshot non può eseguire in sicurezza un round trip del testo grezzo, l'interfaccia di controllo forza la modalità Modulo e disabilita la modalità Grezza per quello snapshot.
    - L'editor JSON grezzo "Reimposta a salvato" conserva la forma creata in grezzo (formattazione, commenti, layout `$include`) invece di rieseguire il rendering di uno snapshot appiattito, così le modifiche esterne sopravvivono a un ripristino quando lo snapshot può eseguire in sicurezza un round trip.
    - I valori oggetto SecretRef strutturati vengono renderizzati come di sola lettura negli input di testo del modulo per prevenire la corruzione accidentale da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot di stato/salute/modelli + registro eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio, quindi interroga `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Note sul pannello dei job Cron">
    - Per i job isolati, la consegna predefinita annuncia un riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/target appaiono quando è selezionato l'annuncio.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL Webhook HTTP(S) valido.
    - Per i job della sessione principale, sono disponibili le modalità di consegna Webhook e nessuna.
    - I controlli di modifica avanzati includono elimina dopo l'esecuzione, cancella override agent, opzioni Cron esatte/scaglionate, override modello/thinking agent e toggle di consegna best-effort.
    - La validazione del modulo è in linea con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il Webhook viene inviato senza header di autenticazione.
    - Fallback deprecato: i job legacy archiviati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

  </Accordion>
</AccordionGroup>

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma subito con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`.
    - I caricamenti in chat accettano immagini più file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link ad allegati.
    - Re-inviare con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` mentre è in esecuzione, e `{ status: "ok" }` dopo il completamento.
    - Le risposte di `chat.history` hanno limiti di dimensione per la sicurezza dell'interfaccia utente. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire i messaggi sovradimensionati con un segnaposto (`[chat.history omitted: message too large]`).
    - Le immagini dell'assistente/generate vengono persistite come riferimenti a media gestiti e restituite tramite URL media autenticati del Gateway, quindi i ricaricamenti non dipendono dal fatto che i payload immagine raw base64 restino nella risposta della cronologia chat.
    - `chat.history` rimuove anche i tag di direttiva inline solo di visualizzazione dal testo visibile dell'assistente (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e i blocchi di chiamata strumento troncati), e i token di controllo modello ASCII/full-width trapelati, e omette le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi utente/assistente ottimistici locali se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia del Gateway si allinea.
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo dell'interfaccia utente (nessuna esecuzione dell'agente, nessuna consegna al canale).
    - I selettori del modello e del ragionamento nell'intestazione chat applicano subito una patch alla sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide per un solo turno.
    - Digitare `/new` nella Control UI crea e passa alla stessa sessione dashboard nuova di New Chat. Digitare `/reset` mantiene il reset esplicito in loco del Gateway per la sessione corrente.
    - Il selettore del modello chat richiede la vista modelli configurata del Gateway. Se `agents.defaults.models` è presente, quell'elenco consentito guida il selettore. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite la RPC di debug `models.list` con `view: "all"`.
    - Quando i report di utilizzo di sessioni Gateway fresche mostrano alta pressione sul contesto, l'area del composer chat mostra un avviso sul contesto e, ai livelli di Compaction consigliati, un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot di token obsoleti vengono nascosti finché il Gateway non segnala di nuovo un utilizzo aggiornato.

  </Accordion>
  <Accordion title="Modalità Talk (browser realtime)">
    La modalità Talk usa un provider voce realtime registrato. Configura OpenAI con `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure configura Google con `talk.provider: "google"` più `talk.providers.google.apiKey`; la configurazione del provider realtime Voice Call può comunque essere riutilizzata come fallback. Il browser non riceve mai una chiave API standard del provider. OpenAI riceve un segreto client Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato e monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay del Gateway, quindi credenziali e socket del fornitore restano lato server mentre l'audio del browser passa tramite RPC Gateway autenticate. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.realtime.session` non accetta override delle istruzioni forniti dal chiamante.

    Nel composer Chat, il controllo Talk è il pulsante a onde accanto al pulsante di dettatura microfono. Quando Talk si avvia, la riga di stato del composer mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata strumento realtime consulta il modello più grande configurato tramite `chat.send`.

    Smoke live per maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica lo scambio SDP WebRTC del browser OpenAI, la configurazione WebSocket del browser Google Live con token vincolato, e l'adattatore browser relay del Gateway con media microfono fittizi. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Stop e interruzione">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i normali follow-up vengono messi in coda. Fai clic su **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di interruzione come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale dopo interruzione">
    - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nell'interfaccia utente.
    - Il Gateway persiste il testo parziale dell'assistente interrotto nella cronologia della trascrizione quando esiste output in buffer.
    - Le voci persistite includono metadati di interruzione, così i consumatori della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e Web Push

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA standalone. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

| Superficie                                            | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche.  |
| `push/vapid-keys.json` (sotto la directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione browser persistiti.                     |

Sovrascrivi la coppia di chiavi VAPID tramite variabili d'ambiente sul processo Gateway quando vuoi fissare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito: `mailto:openclaw@localhost`)

La Control UI usa questi metodi Gateway vincolati allo scope per registrare e testare le sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay APNS iOS (vedi [Configurazione](/it/gateway/configuration) per le notifiche push basate su relay) e dal metodo `push.test` esistente, che ha come destinazione l'associazione mobile nativa.
</Note>

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script dentro gli embed ospitati.
  </Tab>
  <Tab title="scripts (default)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; questo è il valore predefinito e di solito basta per giochi/widget browser autonomi.
  </Tab>
  <Tab title="trusted">
    Aggiunge `allow-same-origin` oltre a `allow-scripts` per documenti same-site che necessitano intenzionalmente di privilegi più forti.
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
Usa `trusted` solo quando il documento incorporato ha davvero bisogno di comportamento same-origin. Per la maggior parte dei giochi generati dagli agenti e delle canvas interattive, `scripts` è la scelta più sicura.
</Warning>

Gli URL embed `http(s)` esterni assoluti restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Larghezza dei messaggi chat

I messaggi chat raggruppati usano una max-width predefinita leggibile. Le distribuzioni su monitor ampi possono sovrascriverla senza patchare il CSS incluso impostando `gateway.controlUi.chatMessageMaxWidth`:

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
    Mantieni il Gateway su loopback e lascia che Tailscale Serve lo proxii con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Control UI/WebSocket Serve possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e accetta queste richieste solo quando arrivano al loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore della Control UI con identità dispositivo del browser, questo percorso Serve verificato salta anche il round trip di associazione dispositivo; i browser senza dispositivo e le connessioni con ruolo node seguono comunque i normali controlli dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali shared-secret esplicite anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client e scope di autenticazione vengono serializzati prima delle scritture del rate limit. Ritentativi errati concorrenti dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta invece di due semplici mismatch in gara in parallelo.

    <Warning>
    L'autenticazione Serve senza token presume che l'host gateway sia attendibile. Se codice locale non attendibile può essere eseguito su quell'host, richiedi autenticazione token/password.
    </Warning>

  </Tab>
  <Tab title="Binding alla tailnet + token">
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
- escape di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri l'interfaccia utente localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host gateway)

<AccordionGroup>
  <Accordion title="Comportamento dell'opzione per auth non sicura">
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

    - Consente alle sessioni localhost della UI di controllo di procedere senza identità del dispositivo in contesti HTTP non sicuri.
    - Non aggira i controlli di abbinamento.
    - Non allenta i requisiti di identità del dispositivo remoti (non localhost).

  </Accordion>
  <Accordion title="Solo per emergenze">
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
    `dangerouslyDisableDeviceAuth` disabilita i controlli dell'identità del dispositivo della UI di controllo ed è un grave indebolimento della sicurezza. Ripristinalo rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Nota sul proxy attendibile">
    - Un'autenticazione tramite proxy attendibile riuscita può ammettere sessioni **operatore** della UI di controllo senza identità del dispositivo.
    - Questo **non** si estende alle sessioni della UI di controllo con ruolo nodo.
    - I proxy inversi loopback sullo stesso host continuano a non soddisfare l'autenticazione tramite proxy attendibile; vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Criterio di sicurezza dei contenuti

La UI di controllo viene distribuita con una policy `img-src` restrittiva: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL di immagini remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Avatar e immagini serviti sotto percorsi relativi (per esempio `/avatars/<id>`) continuano a essere renderizzati, incluse le route avatar autenticate che la UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` continuano a essere renderizzati (utili per payload nel protocollo).
- Gli URL `blob:` locali creati dalla UI di controllo continuano a essere renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della UI di controllo e sostituiti con il logo/badge integrato, quindi un canale compromesso o malevolo non può forzare recuperi arbitrari di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Auth della route avatar

Quando l'auth del Gateway è configurata, l'endpoint avatar della UI di controllo richiede lo stesso token del Gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come per la route sorella assistant-media). Questo impedisce alla route avatar di rivelare l'identità dell'agente su host che altrimenti sono protetti.
- La UI di controllo inoltra il token del Gateway come header bearer quando recupera gli avatar e usa URL blob autenticati in modo che l'immagine continui a essere renderizzata nelle dashboard.

Se disabiliti l'auth del Gateway (sconsigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del Gateway.

## Creare la UI

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

Poi punta la UI all'URL WS del tuo Gateway (ad esempio `ws://127.0.0.1:18789`).

## Debug/test: server di sviluppo + Gateway remoto

La UI di controllo è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. Questo è utile quando vuoi il server di sviluppo Vite in locale ma il Gateway è eseguito altrove.

<Steps>
  <Step title="Avvia il server di sviluppo della UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Apri con gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Auth una tantum opzionale (se necessaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Note">
    - `gatewayUrl` viene salvato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint `ws://` o `wss://` completo tramite `gatewayUrl`, codifica il valore `gatewayUrl` per URL in modo che il browser analizzi correttamente la stringa di query.
    - `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) ogni volta che è possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene mantenuto solo in memoria.
    - Quando `gatewayUrl` è impostato, la UI non ricade sulle credenziali di configurazione o di ambiente. Fornisci `token` (o `password`) esplicitamente. L'assenza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di livello superiore (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni non loopback della UI di controllo devono impostare `gateway.controlUi.allowedOrigins` esplicitamente (origini complete). Questo include le configurazioni di sviluppo remoto.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta effettivi di runtime, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine del browser, non "corrispondi a qualunque host io stia usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la modalità di fallback dell'origine dall'header Host, ma è una modalità di sicurezza pericolosa.

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

- [Dashboard](/it/web/dashboard) — dashboard del gateway
- [Health Checks](/it/gateway/health) — monitoraggio dello stato del gateway
- [TUI](/it/web/tui) — interfaccia utente terminale
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser

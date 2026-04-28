---
read_when:
    - Vuoi usare il Gateway da un browser
    - Vuoi l'accesso Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia di controllo del Gateway basata su browser (chat, node, configurazione)
title: UI di controllo
x-i18n:
    generated_at: "2026-04-26T11:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

La UI di controllo è una piccola single-page app **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad esempio `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Header di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione della scheda browser corrente e l'URL del gateway selezionato; le password non vengono mantenute. L'onboarding di solito genera un token gateway per l'autenticazione con segreto condiviso alla prima connessione, ma funziona anche l'autenticazione con password quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti alla UI di controllo da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di associazione una tantum**. Questa è una misura di sicurezza per impedire accessi non autorizzati.

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

Se il browser riprova l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo cambi da accesso in lettura ad accesso in scrittura/amministratore, questo viene trattato come un upgrade dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi [Devices CLI](/it/cli/devices) per la rotazione e la revoca dei token.

<Note>
- Le connessioni browser dirette locali loopback (`127.0.0.1` / `localhost`) vengono approvate automaticamente.
- Tailscale Serve può saltare il passaggio di associazione per le sessioni operatore della UI di controllo quando `gateway.auth.allowTailscale: true`, l'identità Tailscale è verificata e il browser presenta la propria identità dispositivo.
- I bind diretti Tailnet, le connessioni browser LAN e i profili browser senza identità dispositivo richiedono comunque un'approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Identità personale (locale al browser)

La UI di controllo supporta un'identità personale per browser (nome visualizzato e avatar) associata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Vive nello storage del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né salvata lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. La cancellazione dei dati del sito o il cambio browser la reimposta a vuota.

Lo stesso schema locale al browser si applica all'override dell'avatar dell'assistente. Gli avatar dell'assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non passano mai attraverso `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta comunque disponibile per client non UI che scrivono direttamente il campo (come gateway scriptati o dashboard personalizzate).

## Endpoint di configurazione runtime

La UI di controllo recupera le proprie impostazioni runtime da `/__openclaw/control-ui-config.json`. Questo endpoint è protetto dalla stessa autenticazione gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo e un recupero riuscito richiede un token/password gateway già validi, identità Tailscale Serve o un'identità trusted-proxy.

## Supporto lingua

La UI di controllo può localizzarsi al primo caricamento in base alla lingua del browser. Per sostituirla in seguito, apri **Overview -> Gateway Access -> Language**. Il selettore della lingua si trova nella scheda Gateway Access, non in Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Le traduzioni non inglesi vengono caricate lazy nel browser.
- La lingua selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti usano l'inglese come fallback.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e Talk">
    - Chat con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Talk con OpenAI Realtime direttamente dal browser tramite WebRTC. Il Gateway genera un secret client Realtime di breve durata con `talk.realtime.session`; il browser invia l'audio del microfono direttamente a OpenAI e inoltra le chiamate allo strumento `openclaw_agent_consult` tramite `chat.send` per il modello OpenClaw configurato più grande.
    - Streaming delle chiamate agli strumenti + schede di output live degli strumenti nella Chat (eventi agente).

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: stato dei canali integrati più quelli bundled/esterni dei Plugin, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Istanze: elenco presenza + refresh (`system-presence`).
    - Sessioni: elenco + override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sogni: stato di Dreaming, interruttore abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, approvazioni exec">
    - Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti delle chiavi API (`skills.*`).
    - Node: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica di allowlist gateway o node + ask policy per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Applica + riavvia con validazione (`config.apply`) e riattiva l'ultima sessione attiva.
    - Le scritture includono una protezione base-hash per evitare di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) eseguono una verifica preliminare della risoluzione attiva di SecretRef per i ref nel payload di configurazione inviato; i ref attivi non risolti inviati vengono rifiutati prima della scrittura.
    - Rendering di schema + modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` dei campi, hint UI corrispondenti, riepiloghi immediati dei figli, metadati docs su nodi oggetto nested/wildcard/array/composition, più schemi Plugin + canale quando disponibili); l'editor Raw JSON è disponibile solo quando lo snapshot ha un round-trip raw sicuro.
    - Se uno snapshot non può fare round-trip sicuro del testo raw, la UI di controllo forza la modalità Form e disabilita la modalità Raw per quello snapshot.
    - L'editor Raw JSON "Reset to saved" conserva la forma authored raw (formattazione, commenti, layout `$include`) invece di rieseguire il rendering di uno snapshot flatten, così le modifiche esterne sopravvivono a un reset quando lo snapshot può fare round-trip sicuro.
    - I valori oggetto Structured SecretRef vengono renderizzati in sola lettura negli input di testo del modulo per prevenire corruzioni accidentali da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot stato/salute/modelli + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con report di riavvio.

  </Accordion>
  <Accordion title="Note del pannello job Cron">
    - Per i job isolati, il recapito usa come predefinito il riepilogo annunciato. Puoi passare a none se vuoi esecuzioni solo interne.
    - I campi canale/destinazione appaiono quando è selezionato announce.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato a un URL Webhook HTTP(S) valido.
    - Per i job main-session, sono disponibili le modalità di recapito webhook e none.
    - I controlli di modifica avanzata includono delete-after-run, rimozione dell'override agente, opzioni cron exact/stagger, override modello/thinking dell'agente e toggle di recapito best-effort.
    - La validazione del modulo è inline con errori a livello campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il webhook viene inviato senza header di autenticazione.
    - Fallback deprecato: i job legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` fino alla migrazione.

  </Accordion>
</AccordionGroup>

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: restituisce subito ack con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`.
    - Rinviare con la stessa `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
    - Le risposte di `chat.history` sono limitate in dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire messaggi sovradimensionati con un placeholder (`[chat.history omitted: message too large]`).
    - Le immagini generate dall'assistente vengono mantenute come riferimenti media gestiti e servite di nuovo tramite URL media del Gateway autenticati, così i ricaricamenti non dipendono dalla permanenza di payload immagine raw base64 nella risposta di cronologia chat.
    - `chat.history` rimuove anche i tag direttiva inline solo visualizzazione dal testo visibile dell'assistente (ad esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumenti troncati), nonché i token di controllo modello trapelati ASCII/full-width, e omette le voci assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi utente/assistente ottimistici locali se `chat.history` restituisce temporaneamente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali una volta che la cronologia Gateway li raggiunge.
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessun recapito canale).
    - I selettori modello e thinking dell'intestazione chat applicano una patch immediata alla sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio per un solo turno.
    - Quando i nuovi report di utilizzo della sessione Gateway mostrano alta pressione di contesto, l'area del composer chat mostra un avviso di contesto e, ai livelli di Compaction consigliati, un pulsante di compattazione che esegue il normale percorso di compattazione della sessione. Gli snapshot token obsoleti vengono nascosti finché il Gateway non riporta di nuovo un utilizzo aggiornato.

  </Accordion>
  <Accordion title="Modalità Talk (WebRTC del browser)">
    La modalità Talk usa un provider vocale realtime registrato che supporta sessioni WebRTC del browser. Configura OpenAI con `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure riusa la configurazione del provider realtime di Voice Call. Il browser non riceve mai la chiave API OpenAI standard; riceve solo il secret client Realtime effimero. La voce realtime Google Live è supportata per Voice Call backend e bridge Google Meet, ma non ancora per questo percorso WebRTC del browser. Il prompt di sessione Realtime viene assemblato dal Gateway; `talk.realtime.session` non accetta override di istruzioni forniti dal chiamante.

    Nel composer della Chat, il controllo Talk è il pulsante con le onde accanto al pulsante del dettato con microfono. Quando Talk si avvia, la riga di stato del composer mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata realtime allo strumento consulta il modello configurato più grande tramite `chat.send`.

  </Accordion>
  <Accordion title="Arresto e interruzione">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i normali messaggi successivi vengono accodati. Fai clic su **Steer** su un messaggio in coda per iniettare quel messaggio successivo nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di interruzione come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive di quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale dopo interruzione">
    - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nella UI.
    - Il Gateway conserva nella cronologia della trascrizione il testo parziale dell'assistente interrotto quando esiste output bufferizzato.
    - Le voci conservate includono metadati di interruzione così i consumer della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e web push

La UI di controllo include `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA standalone. Web Push consente al Gateway di risvegliare la PWA installata con notifiche anche quando la scheda o la finestra del browser non sono aperte.

| Surface                                               | What it does                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce gli eventi `push` e i clic sulle notifiche. |
| `push/vapid-keys.json` (nella directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare i payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione del browser persistiti.                 |

Sostituisci la coppia di chiavi VAPID tramite variabili d'ambiente nel processo Gateway quando vuoi fissare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito: `mailto:openclaw@localhost`)

La UI di controllo usa questi metodi Gateway protetti da scope per registrare e testare le sottoscrizioni del browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay APNS di iOS (vedi [Configurazione](/it/gateway/configuration) per il push supportato da relay) e dal metodo `push.test` esistente, che punta all'associazione mobile nativa.
</Note>

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione degli script all'interno degli embed ospitati.
  </Tab>
  <Tab title="scripts (default)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; questo è il valore predefinito e di solito è sufficiente per giochi/widget browser autosufficienti.
  </Tab>
  <Tab title="trusted">
    Aggiunge `allow-same-origin` oltre a `allow-scripts` per documenti dello stesso sito che necessitano intenzionalmente di privilegi più forti.
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

Gli URL di embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Accesso Tailnet (consigliato)

<Tabs>
  <Tab title="Tailscale Serve integrato (preferito)">
    Mantieni il Gateway su loopback e lascia che Tailscale Serve lo instradi tramite proxy con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Serve di Control UI/WebSocket possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e accetta questi dati solo quando la richiesta raggiunge loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore della UI di controllo con identità del dispositivo browser, questo percorso Serve verificato salta anche il passaggio di pairing del dispositivo; i browser senza identità del dispositivo e le connessioni con ruolo node seguono comunque i normali controlli del dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Quindi usa `gateway.auth.mode: "token"` o `"password"`.

    Per questo percorso di identità Serve asincrono, i tentativi di autenticazione falliti per lo stesso IP client e lo stesso scope di autenticazione vengono serializzati prima delle scritture del rate limit. Ritenti concorrenti errati dallo stesso browser possono quindi mostrare `retry later` alla seconda richiesta invece di due semplici mismatch in parallelo.

    <Warning>
    L'autenticazione Serve senza token presuppone che l'host del gateway sia affidabile. Se su quell'host può essere eseguito codice locale non affidabile, richiedi autenticazione con token/password.
    </Warning>

  </Tab>
  <Tab title="Bind a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Poi apri:

    - `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

    Incolla il segreto condiviso corrispondente nelle impostazioni della UI (inviato come `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sicuro

Se apri la dashboard tramite HTTP semplice (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni della UI di controllo senza identità del dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicuro solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita della UI di controllo operatore tramite `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host gateway)

<AccordionGroup>
  <Accordion title="Comportamento del toggle insecure-auth">
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

    - Consente alle sessioni della UI di controllo localhost di procedere senza identità del dispositivo in contesti HTTP non sicuri.
    - Non aggira i controlli di pairing.
    - Non allenta i requisiti di identità del dispositivo remoti (non localhost).

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
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della UI di controllo ed è un grave declassamento della sicurezza. Ripristinalo rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Nota trusted-proxy">
    - Un'autenticazione trusted-proxy riuscita può ammettere sessioni **operatore** della UI di controllo senza identità del dispositivo.
    - Questo **non** si estende alle sessioni della UI di controllo con ruolo node.
    - I reverse proxy loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Vedi [Tailscale](/it/gateway/tailscale) per la guida alla configurazione HTTPS.

## Content Security Policy

La UI di controllo include una policy `img-src` restrittiva: sono consentite solo risorse **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL immagine remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Gli avatar e le immagini serviti tramite percorsi relativi (ad esempio `/avatars/<id>`) vengono comunque renderizzati, incluse le route avatar autenticate che la UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` vengono comunque renderizzati (utile per payload in-protocollo).
- Gli URL `blob:` locali creati dalla UI di controllo vengono comunque renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della UI di controllo e sostituiti con il logo/badge integrato, così un canale compromesso o dannoso non può forzare richieste arbitrarie di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non è configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del gateway è configurata, l'endpoint avatar della UI di controllo richiede lo stesso token gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (in linea con la route sibling assistant-media). Questo impedisce che la route avatar riveli l'identità dell'agente su host altrimenti protetti.
- La UI di controllo stessa inoltra il token gateway come header bearer durante il recupero degli avatar e usa URL blob autenticati così l'immagine continua a essere renderizzata nelle dashboard.

Se disabiliti l'autenticazione del gateway (sconsigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del gateway.

## Build della UI

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

```bash
pnpm ui:build
```

Base assoluta facoltativa (quando vuoi URL delle risorse fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server di sviluppo separato):

```bash
pnpm ui:dev
```

Poi punta la UI al tuo URL WS del Gateway (ad es. `ws://127.0.0.1:18789`).

## Debug/testing: server di sviluppo + Gateway remoto

La UI di controllo è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. Questo è utile quando vuoi il server di sviluppo Vite in locale ma il Gateway è in esecuzione altrove.

<Steps>
  <Step title="Avvia il server di sviluppo della UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Apri con gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    Autenticazione facoltativa una tantum (se necessaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Note">
    - `gatewayUrl` viene salvato in localStorage dopo il caricamento e rimosso dall'URL.
    - `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando così perdite nei log delle richieste e nel Referer. I parametri legacy `?token=` vengono comunque importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene mantenuta solo in memoria.
    - Quando `gatewayUrl` è impostato, la UI non usa come fallback credenziali da configurazione o ambiente. Fornisci esplicitamente `token` (o `password`). L'assenza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` viene accettato solo in una finestra di livello superiore (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni della UI di controllo non loopback devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). Questo include le configurazioni di sviluppo remoto.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta runtime effettivi, ma le origini browser remote richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` se non per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non "corrispondi a qualunque host io stia usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la modalità fallback dell'origine basata su header Host, ma è una modalità di sicurezza pericolosa.

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
- [TUI](/it/web/tui) — interfaccia utente del terminale
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser

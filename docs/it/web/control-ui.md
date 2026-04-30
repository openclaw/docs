---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi accedere alla Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia utente di controllo basata su browser per il Gateway (chat, nodi, configurazione)
title: Interfaccia di controllo
x-i18n:
    generated_at: "2026-04-30T09:19:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
    source_path: web/control-ui.md
    workflow: 16
---

L'interfaccia di controllo è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con il Gateway WebSocket** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- intestazioni di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- intestazioni di identità del proxy attendibile quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione della scheda corrente del browser e per l'URL del gateway selezionato; le password non vengono salvate. L'onboarding di solito genera un token del gateway per l'autenticazione con segreto condiviso alla prima connessione, ma anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti all'interfaccia di controllo da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di associazione una tantum**. È una misura di sicurezza per impedire accessi non autorizzati.

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

Se il browser riprova l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo passi dall'accesso in lettura all'accesso in scrittura/amministratore, questa operazione viene trattata come un aggiornamento dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione con privilegi più ampi e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi [CLI dei dispositivi](/it/cli/devices) per rotazione e revoca dei token.

<Note>
- Le connessioni browser dirette local loopback (`127.0.0.1` / `localhost`) vengono approvate automaticamente.
- Tailscale Serve può saltare il passaggio di associazione per le sessioni operatore dell'interfaccia di controllo quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità del dispositivo.
- Bind Tailnet diretti, connessioni browser LAN e profili browser senza identità del dispositivo richiedono comunque un'approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Identità personale (locale al browser)

L'interfaccia di controllo supporta un'identità personale per browser (nome visualizzato e avatar) allegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Risiede nell'archiviazione del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né salvata lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. La cancellazione dei dati del sito o il cambio di browser la reimposta a vuoto.

Lo stesso modello locale al browser si applica alla sostituzione dell'avatar dell'assistente. Gli avatar dell'assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non passano mai attraverso `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per i client non UI che scrivono direttamente il campo (come gateway scriptati o dashboard personalizzate).

## Endpoint di configurazione runtime

L'interfaccia di controllo recupera le proprie impostazioni runtime da `/__openclaw/control-ui-config.json`. Questo endpoint è protetto dalla stessa autenticazione del gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo e un recupero riuscito richiede un token/password del gateway già valido, un'identità Tailscale Serve oppure un'identità di proxy attendibile.

## Supporto linguistico

L'interfaccia di controllo può localizzarsi al primo caricamento in base alla lingua del browser. Per sovrascriverla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il selettore della lingua si trova nella scheda Accesso Gateway, non sotto Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modo differito nel browser.
- La lingua selezionata viene salvata nell'archiviazione del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ricadono sull'inglese.

Le traduzioni della documentazione vengono generate per lo stesso insieme di lingue non inglesi, ma il selettore di lingua Mintlify integrato nel sito della documentazione è limitato ai codici lingua accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repository di pubblicazione; potrebbe non apparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi di aspetto

Il pannello Aspetto conserva i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [temi tweakcn](https://tweakcn.com/themes), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di tema predefiniti come `amethyst-haze`.

I temi importati vengono archiviati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e Talk">
    - Chat con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Parla tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser vincolato monouso tramite WebSocket e i Plugin vocali realtime solo backend usano il trasporto relay del Gateway. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM dal microfono tramite RPC `talk.realtime.relay*` e invia chiamate strumento `openclaw_agent_consult` di nuovo tramite `chat.send` al modello OpenClaw configurato più grande.
    - Streaming di chiamate strumento + schede di output strumenti live in Chat (eventi agente).

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: stato dei canali integrati più Plugin in bundle/esterni, accesso QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Istanze: elenco presenza + aggiornamento (`system-presence`).
    - Sessioni: elenco + override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sogni: stato del Dreaming, interruttore abilita/disabilita e lettore del Diario dei sogni (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodi, approvazioni exec">
    - Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilitazione/disabilitazione, installazione, aggiornamenti chiavi API (`skills.*`).
    - Nodi: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica allowlist del gateway o del nodo + criterio di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Applica + riavvia con convalida (`config.apply`) e riattiva l'ultima sessione attiva.
    - Le scritture includono una protezione base-hash per evitare di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) verificano preventivamente la risoluzione SecretRef attiva per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - Rendering di schema + modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` del campo, suggerimenti UI corrispondenti, riepiloghi dei figli immediati, metadati della documentazione su nodi oggetto annidato/wildcard/array/composizione, più schemi Plugin + canale quando disponibili); l'editor JSON grezzo è disponibile solo quando lo snapshot supporta un round-trip grezzo sicuro.
    - Se uno snapshot non può effettuare in sicurezza il round-trip del testo grezzo, l'interfaccia di controllo forza la modalità Modulo e disabilita la modalità Grezzo per quello snapshot.
    - "Reimposta a salvato" dell'editor JSON grezzo preserva la forma creata in grezzo (formattazione, commenti, layout `$include`) invece di renderizzare di nuovo uno snapshot appiattito, così le modifiche esterne sopravvivono a un ripristino quando lo snapshot può effettuare in sicurezza il round-trip.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per prevenire la corruzione accidentale da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot di stato/salute/modelli + registro eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegue un aggiornamento package/git + riavvio (`update.run`) con report di riavvio, quindi interroga `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Note sul pannello dei job Cron">
    - Per i job isolati, la consegna è predefinita su annuncio del riepilogo. Puoi passare a nessuna se desideri esecuzioni solo interne.
    - I campi canale/destinazione compaiono quando annuncio è selezionato.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
    - Per i job della sessione principale, sono disponibili le modalità di consegna webhook e nessuna.
    - I controlli di modifica avanzati includono elimina-dopo-esecuzione, cancellazione dell'override agente, opzioni cron exact/stagger, override di modello/thinking dell'agente e interruttori di consegna best-effort.
    - La convalida del modulo è in linea con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un token bearer dedicato; se omesso, il webhook viene inviato senza intestazione di autenticazione.
    - Fallback deprecato: i job legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` fino alla migrazione.

  </Accordion>
</AccordionGroup>

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa in streaming tramite eventi `chat`.
    - I caricamenti chat accettano immagini più file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link di allegato.
    - Un nuovo invio con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` al completamento.
    - Le risposte di `chat.history` sono limitate in dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire messaggi sovradimensionati con un segnaposto (`[chat.history omitted: message too large]`).
    - Le immagini dell'assistente/generate vengono mantenute come riferimenti a media gestiti e restituite tramite URL media autenticati del Gateway, quindi i ricaricamenti non dipendono dal fatto che payload immagine base64 grezzi restino nella risposta della cronologia chat.
    - `chat.history` rimuove inoltre dal testo visibile dell'assistente i tag direttiva inline solo per visualizzazione (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML in testo semplice delle chiamate agli strumenti (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati) e i token di controllo modello trapelati in ASCII/a larghezza piena, e omette le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi utente/assistente ottimistici locali se `chat.history` restituisce brevemente uno snapshot precedente; la trascrizione canonica sostituisce quei messaggi locali una volta che la cronologia del Gateway si aggiorna.
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessuna consegna canale).
    - I selettori di modello e ragionamento dell'intestazione chat aggiornano immediatamente la sessione attiva tramite `sessions.patch`; sono override di sessione persistenti, non opzioni di invio valide per un solo turno.
    - Il selettore modello della chat richiede la vista modello configurata del Gateway. Se `agents.defaults.models` è presente, quella allowlist guida il selettore. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite l'RPC di debug `models.list` con `view: "all"`.
    - Quando i report freschi sull'uso della sessione del Gateway mostrano alta pressione del contesto, l'area del compositore chat mostra un avviso sul contesto e, ai livelli di Compaction consigliati, un pulsante compatta che esegue il normale percorso di Compaction della sessione. Gli snapshot dei token obsoleti sono nascosti finché il Gateway non segnala di nuovo un uso fresco.

  </Accordion>
  <Accordion title="Modalità conversazione (realtime browser)">
    La modalità conversazione usa un provider vocale realtime registrato. Configura OpenAI con `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure configura Google con `talk.provider: "google"` più `talk.providers.google.apiKey`; la configurazione del provider realtime Voice Call può comunque essere riutilizzata come fallback. Il browser non riceve mai una chiave API provider standard. OpenAI riceve un client secret Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato e monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay del Gateway, quindi credenziali e socket del fornitore restano lato server mentre l'audio del browser passa tramite RPC Gateway autenticati. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.realtime.session` non accetta override delle istruzioni forniti dal chiamante.

    Nel compositore Chat, il controllo Conversazione è il pulsante con le onde accanto al pulsante di dettatura del microfono. Quando Conversazione si avvia, la riga di stato del compositore mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata strumento realtime consulta il modello più grande configurato tramite `chat.send`.

    Smoke live per maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica lo scambio SDP WebRTC del browser OpenAI, la configurazione WebSocket browser con token vincolato Google Live e l'adattatore browser relay del Gateway con media microfono finti. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Stop e interruzione">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i follow-up normali vengono messi in coda. Fai clic su **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di interruzione come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (nessun `runId`) per interrompere tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale dopo interruzione">
    - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nella UI.
    - Il Gateway mantiene il testo parziale interrotto dell'assistente nella cronologia della trascrizione quando esiste output nel buffer.
    - Le voci mantenute includono metadati di interruzione, così i consumer della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e web push

La UI di controllo include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

| Superficie                                             | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (sotto la directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint delle sottoscrizioni browser mantenuti.                   |

Sovrascrivi la coppia di chiavi VAPID tramite variabili env sul processo Gateway quando vuoi fissare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito: `mailto:openclaw@localhost`)

La UI di controllo usa questi metodi Gateway limitati per ambito per registrare e testare le sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay iOS APNS (vedi [Configurazione](/it/gateway/configuration) per push basato su relay) e dal metodo `push.test` esistente, che hanno come target il pairing mobile nativo.
</Note>

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script dentro gli embed ospitati.
  </Tab>
  <Tab title="scripts (predefinito)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; questo è il valore predefinito e di solito è sufficiente per giochi/widget browser autonomi.
  </Tab>
  <Tab title="trusted">
    Aggiunge `allow-same-origin` sopra `allow-scripts` per documenti same-site che necessitano intenzionalmente di privilegi più forti.
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
Usa `trusted` solo quando il documento incorporato richiede davvero comportamento same-origin. Per la maggior parte dei giochi generati da agenti e delle canvas interattive, `scripts` è la scelta più sicura.
</Warning>

Gli URL embed `http(s)` esterni assoluti restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Accesso tailnet (consigliato)

<Tabs>
  <Tab title="Tailscale Serve integrato (preferito)">
    Mantieni il Gateway su loopback e lascia che Tailscale Serve lo inoltri tramite proxy con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Serve della UI di controllo/WebSocket possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e li accetta solo quando la richiesta raggiunge loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore della UI di controllo con identità dispositivo del browser, questo percorso Serve verificato salta anche il round trip di pairing del dispositivo; i browser senza dispositivo e le connessioni con ruolo node seguono comunque i normali controlli del dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali shared-secret esplicite anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client e ambito di autenticazione vengono serializzati prima delle scritture del rate limit. I nuovi tentativi errati concorrenti dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta invece di due semplici mismatch in gara parallela.

    <Warning>
    L'autenticazione Serve senza token presuppone che l'host gateway sia attendibile. Se su quell'host può essere eseguito codice locale non attendibile, richiedi autenticazione con token/password.
    </Warning>

  </Tab>
  <Tab title="Bind alla tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Poi apri:

    - `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

    Incolla il shared secret corrispondente nelle impostazioni della UI (inviato come `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sicuro

Se apri la dashboard tramite HTTP semplice (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni della UI di controllo senza identità dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicura solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione UI di controllo operatore riuscita tramite `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) o apri la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host gateway)

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

    - Consente alle sessioni della UI di controllo localhost di procedere senza identità dispositivo in contesti HTTP non sicuri.
    - Non bypassa i controlli di pairing.
    - Non allenta i requisiti di identità dispositivo remoti (non localhost).

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
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della Control UI ed è una grave riduzione della sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - L'autenticazione trusted-proxy riuscita può ammettere sessioni **operatore** della Control UI senza identità del dispositivo.
    - Questo **non** si estende alle sessioni della Control UI con ruolo node.
    - I proxy inversi loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; consulta [Autenticazione trusted-proxy](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Content security policy

La Control UI viene fornita con una policy `img-src` restrittiva: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL di immagini remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Avatar e immagini serviti tramite percorsi relativi (per esempio `/avatars/<id>`) vengono comunque renderizzati, incluse le route avatar autenticate che l'interfaccia recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` vengono comunque renderizzati (utile per payload in-protocollo).
- Gli URL `blob:` locali creati dalla Control UI vengono comunque renderizzati.
- Gli URL avatar remoti emessi dai metadati dei canali vengono rimossi dagli helper avatar della Control UI e sostituiti con il logo/badge integrato, quindi un canale compromesso o malevolo non può forzare richieste arbitrarie di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del Gateway è configurata, l'endpoint avatar della Control UI richiede lo stesso token del Gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati dell'avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (in linea con la route assistant-media parallela). Questo impedisce alla route avatar di divulgare l'identità dell'agente su host altrimenti protetti.
- La Control UI inoltra il token del Gateway come header bearer quando recupera gli avatar e usa URL blob autenticati, così l'immagine viene comunque renderizzata nelle dashboard.

Se disabiliti l'autenticazione del Gateway (sconsigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del gateway.

## Compilare la UI

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

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

Poi punta la UI all'URL WS del tuo Gateway (ad esempio `ws://127.0.0.1:18789`).

## Debug/test: server di sviluppo + Gateway remoto

La Control UI è composta da file statici; il target WebSocket è configurabile e può essere diverso dall'origine HTTP. Questo è utile quando vuoi il server di sviluppo Vite in locale ma il Gateway è in esecuzione altrove.

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
    - `gatewayUrl` viene archiviato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint completo `ws://` o `wss://` tramite `gatewayUrl`, codifica per URL il valore `gatewayUrl` così il browser analizza correttamente la stringa di query.
    - `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene mantenuta solo in memoria.
    - Quando `gatewayUrl` è impostato, la UI non ripiega su credenziali di configurazione o ambiente. Fornisci esplicitamente `token` (o `password`). La mancanza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di livello superiore (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni non loopback della Control UI devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). Questo include le configurazioni di sviluppo remote.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta runtime effettivi, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non "corrispondi a qualsiasi host io stia usando".
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

- [Dashboard](/it/web/dashboard) — dashboard del gateway
- [Health Checks](/it/gateway/health) — monitoraggio dello stato del gateway
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser

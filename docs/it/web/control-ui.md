---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi l'accesso alla Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia di controllo basata su browser per il Gateway (chat, nodi, configurazione)
title: Interfaccia utente di controllo
x-i18n:
    generated_at: "2026-05-07T13:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

La UI di controllo è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con la WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità di Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità del proxy attendibile quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard mantiene un token per la sessione della scheda corrente del browser e per l'URL del gateway selezionato; le password non vengono conservate. L'onboarding di solito genera un token gateway per l'autenticazione a segreto condiviso alla prima connessione, ma anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Abbinamento dispositivo (prima connessione)

Quando ti connetti alla UI di controllo da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di abbinamento una tantum**. È una misura di sicurezza per impedire accessi non autorizzati.

**Cosa vedrai:** "disconnesso (1008): abbinamento richiesto"

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

Se il browser ritenta l'abbinamento con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già abbinato e passi dall'accesso in lettura all'accesso in scrittura/admin, questo viene trattato come un aggiornamento dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi [CLI dispositivi](/it/cli/devices) per la rotazione e la revoca dei token.

<Note>
- Le connessioni browser dirette tramite local loopback (`127.0.0.1` / `localhost`) vengono approvate automaticamente.
- Tailscale Serve può saltare il passaggio di abbinamento per le sessioni operatore della UI di controllo quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità dispositivo.
- I bind Tailnet diretti, le connessioni browser LAN e i profili browser senza identità dispositivo richiedono comunque un'approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà un nuovo abbinamento.

</Note>

## Identità personale (locale al browser)

La UI di controllo supporta un'identità personale per browser (nome visualizzato e avatar) associata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Vive nello storage del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né conservata lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuota.

Lo stesso schema locale al browser si applica alla sostituzione dell'avatar dell'assistente. Gli avatar assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non passano mai attraverso `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per i client non UI che scrivono direttamente il campo (come gateway gestiti da script o dashboard personalizzate).

## Endpoint di configurazione runtime

La UI di controllo recupera le impostazioni runtime da `/__openclaw/control-ui-config.json`. Quell'endpoint è protetto dalla stessa autenticazione gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo, e un recupero riuscito richiede un token/password gateway già valido, un'identità Tailscale Serve o un'identità proxy attendibile.

## Supporto linguistico

La UI di controllo può localizzarsi al primo caricamento in base alla lingua del browser. Per cambiarla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il selettore della lingua si trova nella scheda Accesso Gateway, non sotto Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ricadono sull'inglese.

Le traduzioni della documentazione vengono generate per lo stesso insieme di lingue non inglesi, ma il selettore di lingua integrato nel sito della documentazione Mintlify è limitato ai codici lingua accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repo di pubblicazione; potrebbe non comparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi dell'aspetto

Il pannello Aspetto mantiene i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

I temi importati vengono archiviati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e conversazione vocale">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Gli aggiornamenti della cronologia chat richiedono una finestra recente limitata con limiti di testo per messaggio, così le sessioni grandi non costringono il browser a renderizzare un payload completo della trascrizione prima che la chat diventi utilizzabile.
    - Parla tramite sessioni realtime nel browser. OpenAI usa WebRTC diretto, Google Live usa un token browser monouso vincolato su WebSocket, e i plugin vocali realtime solo backend usano il trasporto relay del Gateway. Le sessioni provider possedute dal client iniziano con `talk.client.create`; le sessioni relay del Gateway iniziano con `talk.session.create`. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM del microfono tramite `talk.session.appendAudio` e inoltra le chiamate agli strumenti provider `openclaw_agent_consult` tramite `talk.client.toolCall` per la policy del Gateway e per il modello OpenClaw configurato più grande.
    - Mostra in streaming chiamate agli strumenti + schede di output live degli strumenti in Chat (eventi agente).

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: stato dei canali integrati più quelli dei plugin inclusi/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Gli aggiornamenti dei probe dei canali mantengono visibile lo snapshot precedente mentre terminano i controlli lenti dei provider, e gli snapshot parziali vengono etichettati quando un probe o un audit supera il budget UI.
    - Istanze: elenco presenza + aggiornamento (`system-presence`).
    - Sessioni: elenca per impostazione predefinita le sessioni degli agenti configurati, ripiega da chiavi di sessione agente non configurato obsolete e applica override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sogni: stato Dreaming, interruttore abilita/disabilita e lettore del Diario dei sogni (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node, approvazioni exec">
    - Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti chiave API (`skills.*`).
    - Node: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica allowlist del gateway o del Node + policy di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Applica + riavvia con validazione (`config.apply`) e risveglia l'ultima sessione attiva.
    - Le scritture includono una guardia con hash base per impedire la sovrascrittura di modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) eseguono un preflight della risoluzione dei SecretRef attivi per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - Rendering di schema + modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` del campo, suggerimenti UI corrispondenti, riepiloghi immediati dei figli, metadati docs su nodi oggetto annidato/wildcard/array/composizione, più schemi plugin + canale quando disponibili); l'editor JSON grezzo è disponibile solo quando lo snapshot ha un round-trip grezzo sicuro.
    - Se uno snapshot non può effettuare in sicurezza il round-trip del testo grezzo, la UI di controllo forza la modalità Modulo e disabilita la modalità Grezza per quello snapshot.
    - Nell'editor JSON grezzo, "Reimposta a salvato" conserva la forma scritta in grezzo (formattazione, commenti, layout `$include`) invece di renderizzare di nuovo uno snapshot appiattito, così le modifiche esterne sopravvivono a un reset quando lo snapshot può effettuare in sicurezza il round-trip.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per prevenire una corruzione accidentale da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot di stato/salute/modelli + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il log eventi include tempi di aggiornamento/RPC della UI di controllo, tempi lenti di rendering chat/config e voci di reattività del browser per frame di animazione lunghi o task lunghi quando il browser espone quei tipi di voci PerformanceObserver.
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio, quindi interroga `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Note sul pannello dei job Cron">
    - Per i job isolati, la consegna predefinita annuncia il riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/destinazione compaiono quando annuncia è selezionato.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
    - Per i job di sessione principale sono disponibili le modalità di consegna webhook e nessuna.
    - I controlli avanzati di modifica includono elimina-dopo-esecuzione, cancella override agente, opzioni cron esatto/scaglionato, override modello/thinking dell'agente e interruttori di consegna best-effort.
    - La validazione del modulo è inline con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il webhook viene inviato senza header di autenticazione.
    - Fallback deprecato: i job legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

  </Accordion>
</AccordionGroup>

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma subito con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`.
    - I caricamenti in chat accettano immagini più file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link ad allegati.
    - Un nuovo invio con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione, e `{ status: "ok" }` al completamento.
    - Le risposte di `chat.history` hanno limiti di dimensione per la sicurezza dell'interfaccia utente. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire messaggi sovradimensionati con un segnaposto (`[chat.history omitted: message too large]`).
    - Le immagini generate dall'assistente sono rese persistenti come riferimenti a media gestiti e servite di nuovo tramite URL media autenticati del Gateway, quindi i ricaricamenti non dipendono dal fatto che i payload immagine base64 grezzi restino nella risposta della cronologia chat.
    - Durante il rendering di `chat.history`, la Control UI rimuove dal testo visibile dell'assistente i tag di direttive inline solo di visualizzazione (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati), e i token di controllo del modello ASCII/a larghezza intera trapelati, e omette le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply` o il token di conferma Heartbeat `HEARTBEAT_OK`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi locali ottimistici di utente/assistente se `chat.history` restituisce brevemente uno snapshot precedente; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia del Gateway si riallinea.
    - Gli eventi `chat` live rappresentano lo stato di consegna, mentre `chat.history` viene ricostruita dalla trascrizione durevole della sessione. Dopo gli eventi finali degli strumenti, la Control UI ricarica la cronologia e unisce solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessuna consegna su canale).
    - L'intestazione della chat mostra il filtro agente prima del selettore sessione, e il selettore sessione è limitato all'agente selezionato. Il cambio di agente mostra solo le sessioni legate a quell'agente e ripiega sulla sessione principale di quell'agente quando non ha ancora sessioni dashboard salvate.
    - Su larghezze desktop, i controlli della chat restano su una riga compatta e si comprimono durante lo scorrimento verso il basso della trascrizione; scorrere verso l'alto, tornare in cima o raggiungere il fondo ripristina i controlli.
    - I messaggi consecutivi duplicati di solo testo vengono resi come un'unica bolla con un badge di conteggio. I messaggi che contengono immagini, allegati, output di strumenti o anteprime canvas non vengono compressi.
    - I selettori di modello e ragionamento nell'intestazione della chat aggiornano immediatamente la sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide per un solo turno.
    - Digitare `/new` nella Control UI crea e passa alla stessa nuova sessione dashboard di New Chat. Digitare `/reset` mantiene il reset esplicito in-place del Gateway per la sessione corrente.
    - Il selettore modello della chat richiede la vista modello configurata del Gateway. Se `agents.defaults.models` è presente, quell'allowlist guida il selettore. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite la RPC di debug `models.list` con `view: "all"`.
    - Quando i report freschi di utilizzo della sessione del Gateway includono i token di contesto correnti, l'area del composer chat mostra un indicatore compatto di utilizzo del contesto. Passa allo stile di avviso sotto alta pressione del contesto e, ai livelli di Compaction consigliati, mostra un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot di token obsoleti vengono nascosti finché il Gateway non segnala di nuovo un utilizzo fresco.

  </Accordion>
  <Accordion title="Modalità conversazione (realtime nel browser)">
    La modalità conversazione usa un provider vocale realtime registrato. Configura OpenAI con `talk.realtime.provider: "openai"` più `talk.realtime.providers.openai.apiKey`, oppure configura Google con `talk.realtime.provider: "google"` più `talk.realtime.providers.google.apiKey`. Il browser non riceve mai una chiave API standard del provider. OpenAI riceve un segreto client Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato e monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay del Gateway, così credenziali e socket del fornitore restano lato server mentre l'audio del browser passa tramite RPC Gateway autenticate. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.client.create` non accetta override di istruzioni forniti dal chiamante.

    Nel composer Chat, il controllo Conversazione è il pulsante a onde accanto al pulsante di dettatura microfono. Quando Conversazione si avvia, la riga di stato del composer mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata strumento realtime consulta il modello più grande configurato tramite `talk.client.toolCall`.

    Smoke live per maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica lo scambio SDP WebRTC del browser OpenAI, la configurazione WebSocket del browser con token vincolato di Google Live e l'adapter browser del relay Gateway con media microfono fittizi. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Arresto e interruzione">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i normali follow-up vengono messi in coda. Fai clic su **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di interruzione come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere out-of-band.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale dopo interruzione">
    - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nell'interfaccia utente.
    - Il Gateway rende persistente nella cronologia della trascrizione il testo parziale dell'assistente interrotto quando esiste output bufferizzato.
    - Le voci rese persistenti includono metadati di interruzione, così i consumer della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e Web Push

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

| Superficie                                             | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (nella directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione browser persistenti.                    |

Esegui l'override della coppia di chiavi VAPID tramite variabili env sul processo Gateway quando vuoi fissare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito: `mailto:openclaw@localhost`)

La Control UI usa questi metodi Gateway limitati dallo scope per registrare e testare le sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay APNS di iOS (vedi [Configurazione](/it/gateway/configuration) per il push supportato da relay) e dal metodo `push.test` esistente, che punta all'abbinamento mobile nativo.
</Note>

## Embed ospitati

I messaggi dell'assistente possono rendere contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="rigoroso">
    Disabilita l'esecuzione di script dentro gli embed ospitati.
  </Tab>
  <Tab title="script (predefinito)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; questo è il valore predefinito e di solito è sufficiente per giochi/widget browser autonomi.
  </Tab>
  <Tab title="attendibile">
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
Usa `trusted` solo quando il documento incorporato necessita davvero di comportamento same-origin. Per la maggior parte dei giochi generati dagli agenti e dei canvas interattivi, `scripts` è la scelta più sicura.
</Warning>

Gli URL embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Larghezza dei messaggi chat

I messaggi chat raggruppati usano una max-width predefinita leggibile. Le distribuzioni su monitor larghi possono sovrascriverla senza modificare il CSS incluso impostando `gateway.controlUi.chatMessageMaxWidth`:

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
  <Tab title="Tailscale Serve integrato (preferito)">
    Mantieni il Gateway su loopback e lascia che Tailscale Serve lo proxy con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Serve di Control UI/WebSocket possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e li accetta solo quando la richiesta arriva su loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore della Control UI con identità dispositivo browser, questo percorso Serve verificato salta anche il round trip di abbinamento dispositivo; i browser senza dispositivo e le connessioni con ruolo nodo seguono comunque i normali controlli dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client e scope di autenticazione vengono serializzati prima delle scritture di rate-limit. I tentativi errati concorrenti dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta invece di due semplici mismatch che competono in parallelo.

    <Warning>
    L'autenticazione Serve senza token presume che l'host del Gateway sia attendibile. Se codice locale non attendibile può essere eseguito su quell'host, richiedi autenticazione con token/password.
    </Warning>

  </Tab>
  <Tab title="Bind a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Poi apri:

    - `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

    Incolla il segreto condiviso corrispondente nelle impostazioni dell'UI (inviato come `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sicuro

Se apri la dashboard tramite HTTP semplice (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni alla Control UI senza identità del dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicura solo per localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita della Control UI dell'operatore tramite `gateway.auth.mode: "trusted-proxy"`
- opzione di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri l'UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host del Gateway)

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

    - Consente alle sessioni della Control UI localhost di procedere senza identità del dispositivo in contesti HTTP non sicuri.
    - Non bypassa i controlli di abbinamento.
    - Non allenta i requisiti di identità del dispositivo remoto (non localhost).

  </Accordion>
  <Accordion title="Solo opzione di emergenza">
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
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della Control UI ed è un grave peggioramento della sicurezza. Ripristina rapidamente la configurazione dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Nota su trusted-proxy">
    - L'autenticazione trusted-proxy riuscita può ammettere sessioni della Control UI **operatore** senza identità del dispositivo.
    - Questo **non** si estende alle sessioni della Control UI con ruolo di nodo.
    - I reverse proxy loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Vedi [Tailscale](/it/gateway/tailscale) per le indicazioni sulla configurazione HTTPS.

## Policy di sicurezza dei contenuti

La Control UI viene fornita con una policy `img-src` restrittiva: sono consentite solo risorse **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL di immagini remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Avatar e immagini serviti sotto percorsi relativi (per esempio `/avatars/<id>`) continuano a essere renderizzati, incluse le route avatar autenticate che l'UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` continuano a essere renderizzati (utili per payload nel protocollo).
- Gli URL `blob:` locali creati dalla Control UI continuano a essere renderizzati.
- Gli URL avatar remoti emessi dai metadati dei canali vengono rimossi dagli helper avatar della Control UI e sostituiti con il logo/badge integrato, quindi un canale compromesso o malevolo non può forzare recuperi arbitrari di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del Gateway è configurata, l'endpoint avatar della Control UI richiede lo stesso token del Gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati dell'avatar secondo la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come per la route sorella assistant-media). Questo impedisce alla route avatar di divulgare l'identità dell'agente su host altrimenti protetti.
- La Control UI stessa inoltra il token del Gateway come header bearer quando recupera gli avatar e usa URL blob autenticati, quindi l'immagine continua a essere renderizzata nelle dashboard.

Se disabiliti l'autenticazione del Gateway (sconsigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del Gateway.

## Autenticazione della route media dell'assistente

Quando l'autenticazione del Gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione operatore della Control UI. Il browser invia il token del Gateway come header bearer quando verifica la disponibilità.
- Le risposte di metadati riuscite includono un `mediaTicket` di breve durata limitato a quello specifico percorso sorgente.
- Gli URL di immagini, audio, video e documenti renderizzati dal browser usano `mediaTicket=<ticket>` invece del token o della password attivi del Gateway. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi media nativi del browser senza inserire credenziali riutilizzabili del Gateway negli URL media visibili.

## Creazione dell'UI

Il Gateway serve file statici da `dist/control-ui`. Creali con:

```bash
pnpm ui:build
```

Base assoluta opzionale (quando vuoi URL delle risorse fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server di sviluppo separato):

```bash
pnpm ui:dev
```

Poi punta l'UI all'URL WS del tuo Gateway (per esempio `ws://127.0.0.1:18789`).

## Debug/test: server di sviluppo + Gateway remoto

La Control UI è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. È utile quando vuoi usare localmente il server di sviluppo Vite, ma il Gateway è in esecuzione altrove.

<Steps>
  <Step title="Avvia il server di sviluppo dell'UI">
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
    - `gatewayUrl` viene archiviato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint `ws://` o `wss://` completo tramite `gatewayUrl`, codifica per URL il valore `gatewayUrl` affinché il browser analizzi correttamente la stringa di query.
    - `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando fughe nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi subito dopo il bootstrap.
    - `password` viene mantenuta solo in memoria.
    - Quando `gatewayUrl` è impostato, l'UI non fa fallback alle credenziali di configurazione o di ambiente. Fornisci esplicitamente `token` (o `password`). L'assenza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di livello superiore (non incorporata) per impedire il clickjacking.
    - Le distribuzioni della Control UI non loopback devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). Questo include le configurazioni di sviluppo remote.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta runtime effettivi, ma le origini dei browser remoti richiedono comunque voci esplicite.
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

Dettagli della configurazione dell'accesso remoto: [Accesso remoto](/it/gateway/remote).

## Correlati

- [Dashboard](/it/web/dashboard) — dashboard del gateway
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del gateway
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser

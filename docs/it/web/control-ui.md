---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi accedere alla Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia utente di controllo basata su browser per il Gateway (chat, nodi, configurazione)
title: Interfaccia di controllo
x-i18n:
    generated_at: "2026-05-04T09:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b68b5203b369de6a3354a7e7442ee38ee790875b2d7054b0c8ec997098fd9de
    source_path: web/control-ui.md
    workflow: 16
---

L'UI di controllo è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- intestazioni di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- intestazioni di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard mantiene un token per la sessione della scheda del browser corrente e l'URL del gateway selezionato; le password non vengono conservate. L'onboarding di solito genera un token gateway per l'autenticazione con segreto condiviso alla prima connessione, ma anche l'autenticazione tramite password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti all'UI di controllo da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di associazione una tantum**. Questa è una misura di sicurezza per impedire accessi non autorizzati.

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

Se il browser riprova l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo passi dall'accesso in lettura all'accesso in scrittura/admin, questo viene trattato come un aggiornamento dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione con privilegi più ampi e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI dispositivi](/it/cli/devices) per la rotazione e la revoca dei token.

<Note>
- Le connessioni dirette dal browser tramite local loopback (`127.0.0.1` / `localhost`) sono approvate automaticamente.
- Tailscale Serve può saltare il passaggio di associazione per le sessioni operatore dell'UI di controllo quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità del dispositivo.
- I bind diretti Tailnet, le connessioni browser LAN e i profili browser senza identità del dispositivo richiedono comunque approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà una nuova associazione.

</Note>

## Identità personale (locale al browser)

L'UI di controllo supporta un'identità personale per browser (nome visualizzato e avatar) allegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Risiede nell'archiviazione del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né persistita lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuoto.

Lo stesso modello locale al browser si applica all'override dell'avatar dell'assistente. Gli avatar assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non fanno mai un round-trip tramite `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per client non UI che scrivono direttamente il campo (come gateway scriptati o dashboard personalizzate).

## Endpoint di configurazione runtime

L'UI di controllo recupera le proprie impostazioni runtime da `/__openclaw/control-ui-config.json`. Questo endpoint è protetto dalla stessa autenticazione gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo, e un recupero riuscito richiede un token/password gateway già valido, un'identità Tailscale Serve oppure un'identità trusted-proxy.

## Supporto linguistico

L'UI di controllo può localizzarsi al primo caricamento in base alla lingua del browser. Per modificarla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il selettore della lingua si trova nella scheda Accesso Gateway, non sotto Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nell'archiviazione del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ripiegano sull'inglese.

Le traduzioni della documentazione sono generate per lo stesso insieme di lingue non inglesi, ma il selettore lingua integrato del sito di documentazione Mintlify è limitato ai codici lingua accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repository di pubblicazione; potrebbe non comparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi di aspetto

Il pannello Aspetto mantiene i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

I temi importati vengono memorizzati solo nel profilo browser corrente. Non vengono scritti nella configurazione gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e conversazione vocale">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Parla tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser monouso vincolato tramite WebSocket e i plugin vocali realtime solo backend usano il trasporto relay del Gateway. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM del microfono tramite RPC `talk.realtime.relay*` e invia chiamate strumento `openclaw_agent_consult` tramite `chat.send` per il modello OpenClaw configurato più grande.
    - Trasmetti in streaming chiamate strumento + schede di output strumento live nella Chat (eventi agente).

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: integrati più stato dei canali di plugin in bundle/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Istanze: elenco presenze + aggiornamento (`system-presence`).
    - Sessioni: elenco + override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sogni: stato dreaming, interruttore abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodi, approvazioni exec">
    - Processi Cron: elenco/aggiungi/modifica/esegui/abilita/disabilita + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti chiave API (`skills.*`).
    - Nodi: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica allowlist di gateway o nodi + policy di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Applica + riavvia con validazione (`config.apply`) e risveglia l'ultima sessione attiva.
    - Le scritture includono una protezione base-hash per impedire di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) eseguono un controllo preliminare della risoluzione SecretRef attiva per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati ma non risolti vengono rifiutati prima della scrittura.
    - Rendering di schema + modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` del campo, suggerimenti UI corrispondenti, riepiloghi dei figli immediati, metadati documentazione su nodi oggetto nidificato/wildcard/array/composizione, più schemi plugin + canale quando disponibili); l'editor JSON grezzo è disponibile solo quando lo snapshot ha un round-trip grezzo sicuro.
    - Se uno snapshot non può eseguire in sicurezza il round-trip del testo grezzo, l'UI di controllo forza la modalità Modulo e disabilita la modalità Grezza per quello snapshot.
    - L'editor JSON grezzo "Reimposta a salvato" preserva la forma scritta in modo grezzo (formattazione, commenti, layout `$include`) invece di renderizzare di nuovo uno snapshot appiattito, così le modifiche esterne sopravvivono a un reset quando lo snapshot può eseguire in sicurezza il round-trip.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per prevenire corruzioni accidentali da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot di stato/integrità/modelli + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il log eventi include tempi di aggiornamento/RPC dell'UI di controllo più voci di reattività del browser per frame di animazione lunghi o task lunghi quando il browser espone quei tipi di voce PerformanceObserver.
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio, poi interroga `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Note del pannello processi Cron">
    - Per processi isolati, la consegna è predefinita sull'annuncio del riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/destinazione appaiono quando è selezionato annuncio.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
    - Per i processi della sessione principale, sono disponibili le modalità di consegna webhook e nessuna.
    - I controlli di modifica avanzati includono elimina dopo l'esecuzione, cancella override agente, opzioni cron exact/stagger, override modello/thinking dell'agente e interruttori di consegna best-effort.
    - La validazione del modulo è inline con errori a livello di campo; valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un token bearer dedicato; se omesso, il webhook viene inviato senza intestazione di autenticazione.
    - Fallback deprecato: i processi legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

  </Accordion>
</AccordionGroup>

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa in streaming tramite eventi `chat`.
    - I caricamenti chat accettano immagini e file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link ad allegati.
    - Il reinvio con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
    - Le risposte di `chat.history` sono limitate in dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, Gateway può troncare i campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire messaggi sovradimensionati con un segnaposto (`[chat.history omitted: message too large]`).
    - Le immagini dell'assistente/generate vengono mantenute come riferimenti a media gestiti e restituite tramite URL media autenticati del Gateway, così i ricaricamenti non dipendono dalla permanenza dei payload immagine base64 grezzi nella risposta della cronologia chat.
    - `chat.history` rimuove anche i tag direttiva inline solo di visualizzazione dal testo visibile dell'assistente (ad esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata strumento in testo normale (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati), e i token di controllo del modello ASCII/a larghezza piena trapelati, e omette le voci dell'assistente il cui intero testo visibile è solo l'esatto token silenzioso `NO_REPLY` / `no_reply`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi locali ottimistici dell'utente/assistente se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia Gateway si aggiorna.
    - Gli eventi `chat` live sono stato di consegna, mentre `chat.history` viene ricostruita dalla trascrizione durevole della sessione. Dopo gli eventi finali degli strumenti, la Control UI ricarica la cronologia e unisce solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessuna consegna al canale).
    - L'intestazione della chat mostra il filtro agente prima del selettore di sessione, e il selettore di sessione è limitato all'agente selezionato. Cambiare agente mostra solo le sessioni legate a quell'agente e ripiega sulla sessione principale di quell'agente quando non ha ancora sessioni dashboard salvate.
    - Alle larghezze desktop, i controlli chat restano su una riga compatta e si comprimono durante lo scorrimento verso il basso della trascrizione; scorrere verso l'alto, tornare all'inizio o raggiungere il fondo ripristina i controlli.
    - Messaggi consecutivi duplicati di solo testo vengono renderizzati come una bolla con un badge di conteggio. I messaggi che contengono immagini, allegati, output di strumenti o anteprime canvas non vengono compressi.
    - I selettori di modello chat e ragionamento applicano subito patch alla sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide per un solo turno.
    - Digitare `/new` nella Control UI crea e passa alla stessa sessione dashboard fresca di Nuova chat. Digitare `/reset` mantiene il reset esplicito in loco del Gateway per la sessione corrente.
    - Il selettore modello chat richiede la vista modello configurata del Gateway. Se `agents.defaults.models` è presente, quell'allowlist guida il selettore. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i fornitori con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite la RPC di debug `models.list` con `view: "all"`.
    - Quando i report freschi sull'uso della sessione Gateway indicano alta pressione di contesto, l'area del compositore chat mostra un avviso di contesto e, ai livelli consigliati di Compaction, un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot di token obsoleti sono nascosti finché il Gateway non segnala di nuovo un uso aggiornato.

  </Accordion>
  <Accordion title="Modalità Talk (tempo reale nel browser)">
    La modalità Talk usa un fornitore vocale in tempo reale registrato. Configura OpenAI con `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure configura Google con `talk.provider: "google"` più `talk.providers.google.apiKey`; la configurazione del fornitore in tempo reale di Voice Call può ancora essere riutilizzata come alternativa di riserva. Il browser non riceve mai una chiave API standard del fornitore. OpenAI riceve un segreto client Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato e monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I fornitori che espongono solo un ponte in tempo reale di backend passano attraverso il trasporto relay del Gateway, così credenziali e socket del fornitore restano lato server mentre l'audio del browser passa attraverso RPC Gateway autenticate. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.realtime.session` non accetta override delle istruzioni forniti dal chiamante.

    Nel compositore Chat, il controllo Talk è il pulsante a onde accanto al pulsante di dettatura microfono. Quando Talk si avvia, la riga di stato del compositore mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata strumento in tempo reale consulta il modello più ampio configurato tramite `chat.send`.

    Smoke test live per manutentori: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica lo scambio SDP WebRTC del browser OpenAI, la configurazione WebSocket del browser con token vincolato Google Live e l'adattatore browser del relay Gateway con media microfono simulati. Il comando stampa solo lo stato del fornitore e non registra segreti.

  </Accordion>
  <Accordion title="Interruzione e annullamento">
    - Fai clic su **Interrompi** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i normali follow-up vengono accodati. Fai clic su **Orienta** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi di annullamento autonome come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per annullare fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per annullare tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione dei parziali all'annullamento">
    - Quando un'esecuzione viene annullata, il testo parziale dell'assistente può comunque essere mostrato nella UI.
    - Gateway mantiene il testo parziale annullato dell'assistente nella cronologia della trascrizione quando esiste output nel buffer.
    - Le voci mantenute includono metadati di annullamento, così i consumatori della trascrizione possono distinguere i parziali annullati dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e Web Push

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

| Superficie                                            | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (sotto la directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione browser mantenuti.                      |

Sovrascrivi la coppia di chiavi VAPID tramite variabili d'ambiente sul processo Gateway quando vuoi fissare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito: `mailto:openclaw@localhost`)

La Control UI usa questi metodi Gateway protetti per ambito per registrare e testare le sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay iOS APNS (vedi [Configurazione](/it/gateway/configuration) per il push supportato da relay) e dal metodo `push.test` esistente, che puntano all'abbinamento mobile nativo.
</Note>

## Incorporamenti ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. Il criterio sandbox dell'iframe è controllato da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script dentro gli incorporamenti ospitati.
  </Tab>
  <Tab title="scripts (predefinito)">
    Consente incorporamenti interattivi mantenendo l'isolamento dell'origine; è il valore predefinito e di solito basta per giochi/widget browser autonomi.
  </Tab>
  <Tab title="trusted">
    Aggiunge `allow-same-origin` oltre a `allow-scripts` per documenti dello stesso sito che richiedono intenzionalmente privilegi più forti.
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
Usa `trusted` solo quando il documento incorporato richiede davvero il comportamento di stessa origine. Per la maggior parte dei giochi generati dall'agente e dei canvas interattivi, `scripts` è la scelta più sicura.
</Warning>

Gli URL di incorporamento `http(s)` esterni assoluti restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Larghezza dei messaggi chat

I messaggi chat raggruppati usano una larghezza massima predefinita leggibile. Le distribuzioni su monitor larghi possono sovrascriverla senza modificare il CSS incluso impostando `gateway.controlUi.chatMessageMaxWidth`:

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

## Accesso alla tailnet (consigliato)

<Tabs>
  <Tab title="Tailscale Serve integrato (preferito)">
    Mantieni il Gateway su loopback e lascia che Tailscale Serve lo proxy con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Serve della Control UI/WebSocket possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e accetta questi header solo quando la richiesta arriva su loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore della Control UI con identità dispositivo del browser, questo percorso Serve verificato salta anche il passaggio di abbinamento del dispositivo; i browser senza dispositivo e le connessioni con ruolo nodo seguono comunque i normali controlli dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client e ambito di autenticazione vengono serializzati prima delle scritture del rate limit. I tentativi errati concorrenti dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta invece di due semplici mancate corrispondenze in competizione in parallelo.

    <Warning>
    L'autenticazione Serve senza token presuppone che l'host Gateway sia attendibile. Se codice locale non attendibile può essere eseguito su quell'host, richiedi autenticazione con token/password.
    </Warning>

  </Tab>
  <Tab title="Binding alla tailnet + token">
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

- compatibilità HTTP non sicuro solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione Control UI operatore riuscita tramite `gateway.auth.mode: "trusted-proxy"`
- emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri l'UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host del gateway)

<AccordionGroup>
  <Accordion title="Comportamento dell'interruttore di autenticazione non sicura">
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

    - Consente alle sessioni Control UI localhost di procedere senza identità del dispositivo in contesti HTTP non sicuri.
    - Non aggira i controlli di pairing.
    - Non allenta i requisiti di identità del dispositivo remoto (non localhost).

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
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della Control UI ed è un grave declassamento della sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Nota sul proxy attendibile">
    - L'autenticazione trusted-proxy riuscita può ammettere sessioni Control UI **operatore** senza identità del dispositivo.
    - Questo **non** si estende alle sessioni Control UI con ruolo nodo.
    - I reverse proxy local loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; consulta [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Criteri di sicurezza dei contenuti

La Control UI include una policy `img-src` rigorosa: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL di immagini remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Avatar e immagini serviti sotto percorsi relativi (per esempio `/avatars/<id>`) vengono comunque renderizzati, incluse le route avatar autenticate che l'UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` vengono comunque renderizzati (utile per payload nel protocollo).
- Gli URL `blob:` locali creati dalla Control UI vengono comunque renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della Control UI e sostituiti con il logo/badge integrato, quindi un canale compromesso o malevolo non può forzare richieste arbitrarie di immagini remote dal browser di un operatore.

Non devi cambiare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione route avatar

Quando l'autenticazione del gateway è configurata, l'endpoint avatar della Control UI richiede lo stesso token del gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati avatar secondo la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route assistant-media vicina). Questo impedisce alla route avatar di far trapelare l'identità dell'agente su host che sono altrimenti protetti.
- La Control UI inoltra direttamente il token del gateway come header bearer quando recupera gli avatar e usa URL blob autenticati, così l'immagine viene comunque renderizzata nelle dashboard.

Se disabiliti l'autenticazione del gateway (non consigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del gateway.

## Autenticazione route media assistente

Quando l'autenticazione del gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione operatore della Control UI. Il browser invia il token del gateway come header bearer quando controlla la disponibilità.
- Le risposte dei metadati riuscite includono un `mediaTicket` di breve durata limitato a quel percorso sorgente esatto.
- Gli URL di immagini, audio, video e documenti renderizzati dal browser usano `mediaTicket=<ticket>` invece del token o della password attivi del gateway. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi multimediali nativi del browser senza inserire credenziali gateway riutilizzabili negli URL media visibili.

## Compilazione dell'UI

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

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

Poi punta l'UI all'URL WS del tuo Gateway (ad es. `ws://127.0.0.1:18789`).

## Debug/test: server dev + Gateway remoto

La Control UI è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. Questo è utile quando vuoi usare localmente il server dev Vite ma il Gateway è eseguito altrove.

<Steps>
  <Step title="Avvia il server dev dell'UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Apri con gatewayUrl">
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
  <Accordion title="Note">
    - `gatewayUrl` viene archiviato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint completo `ws://` o `wss://` tramite `gatewayUrl`, codifica URL il valore `gatewayUrl` in modo che il browser analizzi correttamente la stringa di query.
    - `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi subito dopo il bootstrap.
    - `password` viene mantenuta solo in memoria.
    - Quando `gatewayUrl` è impostato, l'UI non ripiega sulle credenziali di configurazione o ambiente. Fornisci esplicitamente `token` (o `password`). La mancanza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni Control UI non loopback devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). Questo include configurazioni dev remote.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta di runtime effettivi, ma le origini browser remote richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non "abbina qualunque host io stia usando".
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

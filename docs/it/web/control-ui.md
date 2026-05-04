---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi accedere alla Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia utente di controllo basata su browser per il Gateway (chat, nodi, configurazione)
title: Interfaccia di controllo
x-i18n:
    generated_at: "2026-05-04T08:39:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 896c75116d7a396571017ac6e6db7ff6ce328617e44470c303fd41af58aa2bd7
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

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità di proxy attendibile quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione della scheda corrente del browser e per l'URL del gateway selezionato; le password non vengono mantenute. L'onboarding di solito genera un token del gateway per l'autenticazione a segreto condiviso alla prima connessione, ma anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Abbinamento del dispositivo (prima connessione)

Quando ti connetti alla UI di controllo da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di abbinamento una tantum**. È una misura di sicurezza per impedire accessi non autorizzati.

**Cosa vedrai:** "disconnesso (1008): abbinamento richiesto"

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

Se il browser riprova l'abbinamento con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già abbinato e lo modifichi da accesso in lettura ad accesso in scrittura/admin, questa operazione viene trattata come un upgrade dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione con permessi più ampi e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI dispositivi](/it/cli/devices) per rotazione e revoca dei token.

<Note>
- Le connessioni dirette del browser tramite local loopback (`127.0.0.1` / `localhost`) vengono approvate automaticamente.
- Tailscale Serve può saltare il viaggio di andata e ritorno dell'abbinamento per le sessioni operatore della UI di controllo quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità dispositivo.
- Bind diretti Tailnet, connessioni browser LAN e profili browser senza identità dispositivo richiedono comunque approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà un nuovo abbinamento.

</Note>

## Identità personale (locale al browser)

La UI di controllo supporta un'identità personale per browser (nome visualizzato e avatar) allegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Risiede nell'archiviazione del browser, è limitata al profilo browser corrente e non viene sincronizzata su altri dispositivi né mantenuta lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuota.

Lo stesso modello locale al browser si applica all'override dell'avatar dell'assistente. Gli avatar dell'assistente caricati si sovrappongono all'identità risolta dal gateway solo nel browser locale e non fanno mai un viaggio di andata e ritorno tramite `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per i client non UI che scrivono direttamente il campo (come gateway con script o dashboard personalizzate).

## Endpoint di configurazione runtime

La UI di controllo recupera le proprie impostazioni runtime da `/__openclaw/control-ui-config.json`. Quell'endpoint è protetto dalla stessa autenticazione del gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo, e un recupero riuscito richiede un token/password del gateway già valido, un'identità Tailscale Serve o un'identità di proxy attendibile.

## Supporto linguistico

La UI di controllo può localizzarsi al primo caricamento in base alla lingua del browser. Per modificarla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il selettore della lingua si trova nella scheda Accesso Gateway, non sotto Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni diverse dall'inglese vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nell'archiviazione del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ricadono sull'inglese.

Le traduzioni della documentazione vengono generate per lo stesso insieme di lingue non inglesi, ma il selettore lingua integrato del sito di documentazione Mintlify è limitato ai codici lingua accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repo di pubblicazione; potrebbe non comparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi di aspetto

Il pannello Aspetto mantiene i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Condividi** e incolla il link del tema copiato in Aspetto. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di temi predefiniti come `amethyst-haze`.

I temi importati vengono memorizzati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se il tema importato era selezionato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Parla tramite sessioni realtime nel browser. OpenAI usa WebRTC diretto, Google Live usa un token browser monouso vincolato su WebSocket, e i Plugin vocali realtime solo backend usano il trasporto relay del Gateway. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM del microfono tramite RPC `talk.realtime.relay*` e invia chiamate tool `openclaw_agent_consult` tramite `chat.send` al modello OpenClaw configurato più grande.
    - Trasmetti in streaming chiamate tool + schede di output tool live in Chat (eventi agente).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Canali: stato dei canali integrati più canali Plugin in bundle/esterni, accesso QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Istanze: elenco presenza + aggiornamento (`system-presence`).
    - Sessioni: elenco + override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Dreams: stato dreaming, toggle abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilita/disabilita, installazione, aggiornamenti chiave API (`skills.*`).
    - Node: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica allowlist gateway o Node + criterio di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Applica + riavvia con validazione (`config.apply`) e risveglia l'ultima sessione attiva.
    - Le scritture includono una protezione base-hash per impedire di sovrascrivere modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) eseguono un preflight della risoluzione SecretRef attiva per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - Rendering schema + modulo (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` del campo, suggerimenti UI corrispondenti, riepiloghi immediati dei figli, metadati documentazione su nodi oggetto/wildcard/array/composizione annidati, più schemi Plugin + canali quando disponibili); l'editor JSON grezzo è disponibile solo quando lo snapshot consente un round-trip grezzo sicuro.
    - Se uno snapshot non può eseguire in sicurezza il round-trip del testo grezzo, la UI di controllo forza la modalità Modulo e disabilita la modalità Grezza per quello snapshot.
    - "Ripristina al salvato" dell'editor JSON grezzo conserva la forma scritta in grezzo (formattazione, commenti, layout `$include`) invece di rigenerare uno snapshot appiattito, così le modifiche esterne sopravvivono a un ripristino quando lo snapshot può eseguire in sicurezza il round-trip.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del modulo per impedire la corruzione accidentale da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: snapshot di stato/salute/modelli + registro eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il registro eventi include tempi di aggiornamento/RPC della UI di controllo più voci di reattività del browser per frame di animazione lunghi o attività lunghe quando il browser espone quei tipi di entry PerformanceObserver.
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento pacchetto/git + riavvio (`update.run`) con report di riavvio, poi esegui il polling di `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Per job isolati, la consegna predefinita annuncia il riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/destinazione compaiono quando annuncio è selezionato.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
    - Per i job della sessione principale sono disponibili le modalità di consegna webhook e nessuna.
    - I controlli di modifica avanzata includono elimina dopo l'esecuzione, cancella override agente, opzioni cron esatto/scaglionato, override modello/thinking agente e toggle di consegna best-effort.
    - La validazione del modulo è inline con errori a livello di campo; valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un token bearer dedicato; se omesso, il webhook viene inviato senza header di autenticazione.
    - Fallback deprecato: i job legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

  </Accordion>
</AccordionGroup>

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` è **non bloccante**: conferma subito con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`.
    - I caricamenti della chat accettano immagini e file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link di allegato.
    - Reinviare con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` mentre è in esecuzione, e `{ status: "ok" }` dopo il completamento.
    - Le risposte di `chat.history` hanno limiti di dimensione per la sicurezza dell'interfaccia. Quando le voci della trascrizione sono troppo grandi, Gateway può troncare i campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire i messaggi troppo grandi con un segnaposto (`[chat.history omitted: message too large]`).
    - Le immagini assistente/generate vengono persistite come riferimenti a media gestiti e restituite tramite URL media autenticati di Gateway, quindi i ricaricamenti non dipendono dal fatto che i payload immagine raw base64 rimangano nella risposta della cronologia chat.
    - `chat.history` rimuove inoltre dal testo visibile dell'assistente i tag direttiva inline solo di visualizzazione (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML delle chiamate agli strumenti in testo normale (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate agli strumenti troncati), e i token di controllo del modello ASCII/a larghezza piena trapelati, e omette le voci dell'assistente il cui intero testo visibile è solo l'esatto token silenzioso `NO_REPLY` / `no_reply`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi utente/assistente locali ottimistici se `chat.history` restituisce brevemente uno snapshot precedente; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia Gateway si aggiorna.
    - Gli eventi `chat` live sono stato di consegna, mentre `chat.history` viene ricostruito dalla trascrizione durevole della sessione. Dopo gli eventi finali degli strumenti, l'interfaccia di controllo ricarica la cronologia e unisce solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo interfaccia (nessuna esecuzione dell'agente, nessuna consegna al canale).
    - I selettori del modello e del thinking nell'intestazione della chat aggiornano immediatamente la sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide per un solo turno.
    - Digitare `/new` nell'interfaccia di controllo crea e passa alla stessa nuova sessione dashboard di New Chat. Digitare `/reset` mantiene il reset esplicito in-place di Gateway per la sessione corrente.
    - Il selettore del modello chat richiede la vista modello configurata di Gateway. Se `agents.defaults.models` è presente, quella allowlist guida il selettore. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite l'RPC di debug `models.list` con `view: "all"`.
    - Quando i report di utilizzo freschi della sessione Gateway mostrano alta pressione di contesto, l'area del compositore chat mostra un avviso di contesto e, ai livelli di Compaction consigliati, un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot dei token obsoleti sono nascosti finché Gateway non segnala di nuovo un utilizzo fresco.

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    La modalità Talk usa un provider vocale realtime registrato. Configura OpenAI con `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure configura Google con `talk.provider: "google"` più `talk.providers.google.apiKey`; la configurazione del provider realtime di Voice Call può comunque essere riutilizzata come fallback. Il browser non riceve mai una chiave API provider standard. OpenAI riceve un segreto client Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token da Gateway. I provider che espongono solo un bridge realtime backend passano attraverso il trasporto relay di Gateway, quindi credenziali e socket del fornitore restano lato server mentre l'audio del browser passa tramite RPC Gateway autenticati. Il prompt della sessione Realtime è assemblato da Gateway; `talk.realtime.session` non accetta override delle istruzioni forniti dal chiamante.

    Nel compositore Chat, il controllo Talk è il pulsante con onde accanto al pulsante di dettatura tramite microfono. Quando Talk si avvia, la riga di stato del compositore mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata realtime a uno strumento consulta il modello più grande configurato tramite `chat.send`.

    Smoke live per maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica lo scambio SDP WebRTC del browser OpenAI, la configurazione WebSocket browser con token vincolato di Google Live e l'adattatore browser del relay Gateway con media microfono fittizi. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Stop and abort">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i follow-up normali vengono accodati. Fai clic su **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi di interruzione autonome come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nell'interfaccia.
    - Gateway persiste il testo parziale interrotto dell'assistente nella cronologia della trascrizione quando esiste output bufferizzato.
    - Le voci persistite includono metadati di interruzione, così i consumatori della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e web push

L'interfaccia di controllo include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente a Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

| Superficie                                             | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (nella directory di stato di OpenClaw) | Coppia di chiavi VAPID generata automaticamente, usata per firmare payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione browser persistiti.                    |

Esegui l'override della coppia di chiavi VAPID tramite variabili d'ambiente sul processo Gateway quando vuoi fissare le chiavi (per distribuzioni multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito a `mailto:openclaw@localhost`)

L'interfaccia di controllo usa questi metodi Gateway con ambito controllato per registrare e testare le sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay iOS APNS (vedi [Configurazione](/it/gateway/configuration) per il push con backend relay) e dal metodo `push.test` esistente, che hanno come destinazione l'abbinamento mobile nativo.
</Note>

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione degli script dentro gli embed ospitati.
  </Tab>
  <Tab title="scripts (default)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; è il valore predefinito ed è di solito sufficiente per giochi/widget browser autonomi.
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
Usa `trusted` solo quando il documento incorporato ha davvero bisogno di comportamento same-origin. Per la maggior parte dei giochi generati da agenti e delle canvas interattive, `scripts` è la scelta più sicura.
</Warning>

Gli URL embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Larghezza dei messaggi chat

I messaggi chat raggruppati usano una max-width predefinita leggibile. Le distribuzioni su monitor ampi possono sostituirla senza modificare il CSS incluso impostando `gateway.controlUi.chatMessageMaxWidth`:

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
  <Tab title="Integrated Tailscale Serve (preferred)">
    Mantieni Gateway su loopback e lascia che Tailscale Serve lo proxii con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Apri:

    - `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

    Per impostazione predefinita, le richieste Control UI/WebSocket Serve possono autenticarsi tramite header identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e li accetta solo quando la richiesta raggiunge local loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore dell'interfaccia di controllo con identità dispositivo browser, questo percorso Serve verificato salta anche il round trip di abbinamento del dispositivo; i browser senza dispositivo e le connessioni con ruolo nodo seguono comunque i normali controlli dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso identità Serve asincrono, i tentativi di autenticazione falliti per lo stesso IP client e ambito di autenticazione vengono serializzati prima delle scritture del rate-limit. Retry errati concorrenti dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta invece di due semplici mancati riscontri in competizione parallela.

    <Warning>
    L'autenticazione Serve senza token presume che l'host gateway sia attendibile. Se codice locale non attendibile può essere eseguito su quell'host, richiedi autenticazione token/password.
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

Se apri la dashboard tramite HTTP semplice (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni dell'interfaccia di controllo senza identità dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicuro solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita dell'interfaccia di controllo operatore tramite `gateway.auth.mode: "trusted-proxy"`
- emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri la UI localmente:

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

    - Consente alle sessioni Control UI localhost di procedere senza identità del dispositivo in contesti HTTP non sicuri.
    - Non bypassa i controlli di pairing.
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
    `dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della Control UI ed è un grave indebolimento della sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Nota sul proxy attendibile">
    - Un'autenticazione con proxy attendibile riuscita può ammettere sessioni Control UI **operatore** senza identità del dispositivo.
    - Questo **non** si estende alle sessioni Control UI con ruolo nodo.
    - I reverse proxy local loopback sullo stesso host continuano a non soddisfare l'autenticazione con proxy attendibile; consulta [Autenticazione con proxy attendibile](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Criterio di sicurezza dei contenuti

La Control UI viene distribuita con un criterio `img-src` restrittivo: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL di immagini remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

In pratica significa che:

- Avatar e immagini serviti tramite percorsi relativi (per esempio `/avatars/<id>`) vengono comunque visualizzati, incluse le route avatar autenticate che la UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` vengono comunque visualizzati (utile per payload nel protocollo).
- Gli URL `blob:` locali creati dalla Control UI vengono comunque visualizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della Control UI e sostituiti con il logo/badge integrato, quindi un canale compromesso o malevolo non può forzare recuperi arbitrari di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del Gateway è configurata, l'endpoint avatar della Control UI richiede lo stesso token del Gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route sibling assistant-media). Questo impedisce alla route avatar di esporre l'identità dell'agente su host altrimenti protetti.
- La Control UI inoltra il token del Gateway come header bearer quando recupera gli avatar e usa URL blob autenticati, così l'immagine viene comunque visualizzata nelle dashboard.

Se disabiliti l'autenticazione del Gateway (sconsigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del Gateway.

## Autenticazione della route media dell'assistente

Quando l'autenticazione del Gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione operatore della Control UI. Il browser invia il token del Gateway come header bearer quando controlla la disponibilità.
- Le risposte di metadati riuscite includono un `mediaTicket` di breve durata limitato a quello specifico percorso sorgente.
- Gli URL di immagini, audio, video e documenti renderizzati dal browser usano `mediaTicket=<ticket>` invece del token o della password attivi del Gateway. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi multimediali nativi del browser senza inserire credenziali riutilizzabili del Gateway negli URL media visibili.

## Creazione della UI

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

Poi indirizza la UI all'URL WS del tuo Gateway (ad es. `ws://127.0.0.1:18789`).

## Debug/test: server di sviluppo + Gateway remoto

La Control UI è composta da file statici; il target WebSocket è configurabile e può essere diverso dall'origine HTTP. Questo è utile quando vuoi usare il server di sviluppo Vite localmente ma il Gateway viene eseguito altrove.

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

    Autenticazione una tantum opzionale (se necessaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Note">
    - `gatewayUrl` viene salvato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint completo `ws://` o `wss://` tramite `gatewayUrl`, codifica come URL il valore di `gatewayUrl` in modo che il browser analizzi correttamente la stringa di query.
    - `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) ogni volta che è possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene mantenuta solo in memoria.
    - Quando `gatewayUrl` è impostato, la UI non ripiega su credenziali di configurazione o di ambiente. Fornisci esplicitamente `token` (o `password`). Le credenziali esplicite mancanti sono un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` viene accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni Control UI non loopback devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). Questo include le configurazioni di sviluppo remoto.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta effettivi di runtime, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non "corrispondi all'host che sto usando".
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
- [TUI](/it/web/tui) — interfaccia utente terminale
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser

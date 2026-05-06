---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi l'accesso alla Tailnet senza tunnel SSH
sidebarTitle: Control UI
summary: Interfaccia utente di controllo basata su browser per il Gateway (chat, nodi, configurazione)
title: Interfaccia di controllo
x-i18n:
    generated_at: "2026-05-06T09:13:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c16b37405d7a490b89ea90f2b006c01b9a7b1a3e5278769006b4dc94e7d83aa
    source_path: web/control-ui.md
    workflow: 16
---

La Control UI è una piccola app single-page **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione della scheda corrente del browser e l'URL del gateway selezionato; le password non vengono persistite. L'onboarding di solito genera un token gateway per l'autenticazione con segreto condiviso alla prima connessione, ma funziona anche l'autenticazione con password quando `gateway.auth.mode` è `"password"`.

## Abbinamento del dispositivo (prima connessione)

Quando ti connetti alla Control UI da un nuovo browser o dispositivo, il Gateway di solito richiede una **approvazione di abbinamento monouso**. È una misura di sicurezza per impedire accessi non autorizzati.

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

Se il browser riprova l'abbinamento con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già abbinato e lo passi dall'accesso in lettura all'accesso in scrittura/admin, questo viene trattato come un upgrade dell'approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione con privilegi più ampi e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI dei dispositivi](/it/cli/devices) per la rotazione e la revoca dei token.

<Note>
- Le connessioni browser dirette tramite local loopback (`127.0.0.1` / `localhost`) vengono approvate automaticamente.
- Tailscale Serve può saltare il round trip di abbinamento per le sessioni operatore della Control UI quando `gateway.auth.allowTailscale: true`, l'identità Tailscale viene verificata e il browser presenta la propria identità del dispositivo.
- I binding Tailnet diretti, le connessioni browser LAN e i profili browser senza identità del dispositivo richiedono comunque un'approvazione esplicita.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà un nuovo abbinamento.

</Note>

## Identità personale (locale al browser)

La Control UI supporta un'identità personale per browser (nome visualizzato e avatar) allegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Risiede nello storage del browser, è limitata al profilo browser corrente e non viene sincronizzata con altri dispositivi né persistita lato server oltre ai normali metadati di paternità della trascrizione sui messaggi che invii effettivamente. Cancellare i dati del sito o cambiare browser la reimposta a vuoto.

Lo stesso schema locale al browser si applica all'override dell'avatar dell'assistente. Gli avatar dell'assistente caricati sovrappongono l'identità risolta dal gateway solo nel browser locale e non fanno mai round trip tramite `config.patch`. Il campo di configurazione condiviso `ui.assistant.avatar` resta disponibile per i client non UI che scrivono direttamente il campo (come gateway scriptati o dashboard personalizzate).

## Endpoint della configurazione runtime

La Control UI recupera le proprie impostazioni runtime da `/__openclaw/control-ui-config.json`. Quell'endpoint è protetto dalla stessa autenticazione gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo, e un recupero riuscito richiede un token/password gateway già valido, un'identità Tailscale Serve oppure un'identità trusted-proxy.

## Supporto linguistico

La Control UI può localizzarsi al primo caricamento in base alla lingua del browser. Per modificarla in seguito, apri **Overview -> Gateway Access -> Language**. Il selettore della lingua si trova nella scheda Gateway Access, non sotto Appearance.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ricadono sull'inglese.

Le traduzioni della documentazione vengono generate per lo stesso insieme di lingue non inglesi, ma il selettore lingua integrato del sito docs Mintlify è limitato ai codici lingua accettati da Mintlify. La documentazione in thailandese (`th`) e persiano (`fa`) viene comunque generata nel repository di pubblicazione; potrebbe non apparire in quel selettore finché Mintlify non supporterà quei codici.

## Temi di aspetto

Il pannello Appearance mantiene i temi integrati Claw, Knot e Dash, più uno slot di importazione tweakcn locale al browser. Per importare un tema, apri [editor tweakcn](https://tweakcn.com/editor/theme), scegli o crea un tema, fai clic su **Share** e incolla il link del tema copiato in Appearance. L'importatore accetta anche URL di registro `https://tweakcn.com/r/themes/<id>`, URL dell'editor come `https://tweakcn.com/editor/theme?theme=amethyst-haze`, percorsi relativi `/themes/<id>`, ID tema grezzi e nomi di tema predefiniti come `amethyst-haze`.

I temi importati vengono archiviati solo nel profilo browser corrente. Non vengono scritti nella configurazione del gateway e non si sincronizzano tra dispositivi. Sostituire il tema importato aggiorna l'unico slot locale; cancellarlo riporta il tema attivo a Claw se era selezionato il tema importato.

## Cosa può fare (oggi)

<AccordionGroup>
  <Accordion title="Chat e conversazione vocale">
    - Chatta con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Gli aggiornamenti della cronologia chat richiedono una finestra recente limitata con limiti di testo per messaggio, così le sessioni grandi non costringono il browser a renderizzare un payload completo della trascrizione prima che la chat diventi utilizzabile.
    - Parla tramite sessioni realtime del browser. OpenAI usa WebRTC diretto, Google Live usa un token browser monouso vincolato su WebSocket, e i Plugin vocali realtime solo backend usano il trasporto relay del Gateway. Le sessioni provider possedute dal client iniziano con `talk.client.create`; le sessioni relay del Gateway iniziano con `talk.session.create`. Il relay mantiene le credenziali del provider sul Gateway mentre il browser trasmette PCM del microfono tramite `talk.session.appendAudio` e inoltra le chiamate agli strumenti provider `openclaw_agent_consult` tramite `talk.client.toolCall` per la policy del Gateway e il modello OpenClaw configurato più grande.
    - Trasmetti in streaming chiamate agli strumenti + schede di output strumenti live in Chat (eventi agente).

  </Accordion>
  <Accordion title="Canali, istanze, sessioni, sogni">
    - Canali: stato dei canali integrati più canali Plugin in bundle/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`).
    - Gli aggiornamenti delle sonde dei canali mantengono visibile lo snapshot precedente mentre i controlli lenti dei provider terminano, e gli snapshot parziali vengono etichettati quando una sonda o un audit supera il budget UI.
    - Istanze: elenco presenza + aggiornamento (`system-presence`).
    - Sessioni: elenco + override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sogni: stato dreaming, toggle abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodi, approvazioni exec">
    - Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`).
    - Skills: stato, abilitazione/disabilitazione, installazione, aggiornamenti delle chiavi API (`skills.*`).
    - Nodi: elenco + capacità (`node.list`).
    - Approvazioni exec: modifica allowlist del gateway o del nodo + policy di richiesta per `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configurazione">
    - Visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Applica + riavvia con validazione (`config.apply`) e risveglia l'ultima sessione attiva.
    - Le scritture includono una protezione base-hash per impedire la sovrascrittura di modifiche concorrenti.
    - Le scritture (`config.set`/`config.apply`/`config.patch`) eseguono un preflight della risoluzione dei SecretRef attivi per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura.
    - Rendering di schema + form (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` del campo, suggerimenti UI corrispondenti, riepiloghi dei figli immediati, metadati docs su nodi oggetto annidati/wildcard/array/composizione, più schemi Plugin + canale quando disponibili); l'editor Raw JSON è disponibile solo quando lo snapshot ha un round trip raw sicuro.
    - Se uno snapshot non può fare round trip sicuro del testo raw, la Control UI forza la modalità Form e disabilita la modalità Raw per quello snapshot.
    - "Reset to saved" dell'editor Raw JSON preserva la forma scritta in raw (formattazione, commenti, layout `$include`) invece di renderizzare di nuovo uno snapshot appiattito, così le modifiche esterne sopravvivono a un reset quando lo snapshot può fare round trip in sicurezza.
    - I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del form per impedire corruzioni accidentali da oggetto a stringa.

  </Accordion>
  <Accordion title="Debug, log, aggiornamento">
    - Debug: snapshot di stato/integrità/modelli + registro eventi + chiamate RPC manuali (`status`, `health`, `models.list`).
    - Il registro eventi include tempi di aggiornamento/RPC della Control UI, tempi di rendering lenti di chat/configurazione e voci di reattività del browser per frame di animazione lunghi o task lunghi quando il browser espone quei tipi di voci PerformanceObserver.
    - Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`).
    - Aggiornamento: esegui un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio, poi esegui il polling di `update.status` dopo la riconnessione per verificare la versione del gateway in esecuzione.

  </Accordion>
  <Accordion title="Note sul pannello dei job Cron">
    - Per i job isolati, la consegna predefinita annuncia il riepilogo. Puoi passare a nessuna se vuoi esecuzioni solo interne.
    - I campi canale/target appaiono quando è selezionato l'annuncio.
    - La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato a un URL webhook HTTP(S) valido.
    - Per i job della sessione principale, sono disponibili le modalità di consegna webhook e nessuna.
    - I controlli di modifica avanzati includono delete-after-run, cancellazione dell'override agente, opzioni cron exact/stagger, override di modello/thinking dell'agente e toggle di consegna best-effort.
    - La validazione del form è inline con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
    - Imposta `cron.webhookToken` per inviare un token bearer dedicato; se omesso, il webhook viene inviato senza header di autenticazione.
    - Fallback deprecato: i job legacy archiviati con `notify: true` possono ancora usare `cron.webhook` fino alla migrazione.

  </Accordion>
</AccordionGroup>

## Comportamento della chat

<AccordionGroup>
  <Accordion title="Semantica di invio e cronologia">
    - `chat.send` è **non bloccante**: conferma subito con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`.
    - I caricamenti della chat accettano immagini e file non video. Le immagini mantengono il percorso immagine nativo; gli altri file vengono archiviati come media gestiti e mostrati nella cronologia come link di allegato.
    - Reinviare con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
    - Le risposte di `chat.history` hanno limiti di dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare i campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire i messaggi sovradimensionati con un segnaposto (`[chat.history omitted: message too large]`).
    - Le immagini dell'assistente/generate vengono persistite come riferimenti a media gestiti e restituite tramite URL media autenticati del Gateway, quindi i ricaricamenti non dipendono dal fatto che payload immagine base64 grezzi restino nella risposta della cronologia chat.
    - Durante il rendering di `chat.history`, la Control UI rimuove dal testo visibile dell'assistente i tag di direttive inline solo di visualizzazione (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamate strumento in testo normale (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate strumento troncati) e i token di controllo del modello trapelati in ASCII/a larghezza piena, e omette le voci dell'assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply` o il token di conferma Heartbeat `HEARTBEAT_OK`.
    - Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi utente/assistente ottimistici locali se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali quando la cronologia del Gateway si aggiorna.
    - Gli eventi `chat` live sono stato di consegna, mentre `chat.history` viene ricostruito dalla trascrizione persistente della sessione. Dopo gli eventi finali degli strumenti, la Control UI ricarica la cronologia e unisce solo una piccola coda ottimistica; il confine della trascrizione è documentato in [WebChat](/it/web/webchat).
    - `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione dell'agente, nessuna consegna al canale).
    - L'intestazione della chat mostra il filtro agente prima del selettore di sessione, e il selettore di sessione è limitato all'agente selezionato. Cambiare agente mostra solo le sessioni legate a quell'agente e ripiega sulla sessione principale di quell'agente quando non ha ancora sessioni dashboard salvate.
    - Su larghezze desktop, i controlli chat restano su una singola riga compatta e si comprimono durante lo scorrimento verso il basso della trascrizione; scorrere verso l'alto, tornare in cima o raggiungere il fondo ripristina i controlli.
    - I messaggi consecutivi duplicati di solo testo vengono visualizzati come una singola bolla con un badge di conteggio. I messaggi che contengono immagini, allegati, output di strumenti o anteprime canvas non vengono compressi.
    - I selettori di modello e pensiero nell'intestazione della chat applicano subito la patch alla sessione attiva tramite `sessions.patch`; sono override persistenti di sessione, non opzioni di invio valide solo per un turno.
    - Digitare `/new` nella Control UI crea e seleziona la stessa nuova sessione dashboard di Nuova chat. Digitare `/reset` mantiene il reset esplicito in-place del Gateway per la sessione corrente.
    - Il selettore del modello chat richiede la vista modello configurata del Gateway. Se `agents.defaults.models` è presente, quell'elenco consentito guida il selettore. Altrimenti il selettore mostra le voci esplicite `models.providers.*.models` più i provider con autenticazione utilizzabile. Il catalogo completo resta disponibile tramite la RPC di debug `models.list` con `view: "all"`.
    - Quando i report freschi sull'utilizzo della sessione Gateway mostrano alta pressione di contesto, l'area del compositore chat mostra un avviso di contesto e, ai livelli di compaction consigliati, un pulsante compatto che esegue il normale percorso di Compaction della sessione. Gli snapshot di token obsoleti sono nascosti finché il Gateway non segnala di nuovo un utilizzo fresco.

  </Accordion>
  <Accordion title="Modalità Talk (tempo reale nel browser)">
    La modalità Talk usa un provider vocale in tempo reale registrato. Configura OpenAI con `talk.realtime.provider: "openai"` più `talk.realtime.providers.openai.apiKey`, oppure configura Google con `talk.realtime.provider: "google"` più `talk.realtime.providers.google.apiKey`. Il browser non riceve mai una chiave API standard del provider. OpenAI riceve un segreto client Realtime effimero per WebRTC. Google Live riceve un token di autenticazione Live API vincolato monouso per una sessione WebSocket del browser, con istruzioni e dichiarazioni degli strumenti bloccate nel token dal Gateway. I provider che espongono solo un bridge realtime di backend passano attraverso il trasporto relay del Gateway, quindi credenziali e socket del fornitore restano lato server mentre l'audio del browser passa tramite RPC Gateway autenticate. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.client.create` non accetta override di istruzioni forniti dal chiamante.

    Nel compositore Chat, il controllo Talk è il pulsante con le onde accanto al pulsante di dettatura con microfono. Quando Talk si avvia, la riga di stato del compositore mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata strumento realtime consulta il modello più grande configurato tramite `talk.client.toolCall`.

    Smoke live per maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica lo scambio SDP OpenAI WebRTC nel browser, la configurazione WebSocket browser di Google Live con token vincolato e l'adattatore browser relay del Gateway con media microfono fittizi. Il comando stampa solo lo stato del provider e non registra segreti.

  </Accordion>
  <Accordion title="Stop e interruzione">
    - Fai clic su **Stop** (chiama `chat.abort`).
    - Mentre un'esecuzione è attiva, i follow-up normali vengono messi in coda. Fai clic su **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
    - Digita `/stop` (o frasi autonome di interruzione come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda.
    - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione.

  </Accordion>
  <Accordion title="Conservazione parziale dopo interruzione">
    - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nella UI.
    - Il Gateway persiste il testo parziale interrotto dell'assistente nella cronologia della trascrizione quando esiste output nel buffer.
    - Le voci persistite includono metadati di interruzione così i consumatori della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale.

  </Accordion>
</AccordionGroup>

## Installazione PWA e web push

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA autonoma. Web Push consente al Gateway di risvegliare la PWA installata con notifiche anche quando la scheda o la finestra del browser non è aperta.

| Superficie                                            | Cosa fa                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (nella directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare i payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione browser persistiti.                   |

Sovrascrivi la coppia di chiavi VAPID tramite variabili env nel processo Gateway quando vuoi fissare le chiavi (per deployment multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito a `mailto:openclaw@localhost`)

La Control UI usa questi metodi Gateway con ambito limitato per registrare e testare le sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

<Note>
Web Push è indipendente dal percorso relay APNS iOS (vedi [Configurazione](/it/gateway/configuration) per il push supportato da relay) e dal metodo `push.test` esistente, che puntano al pairing mobile nativo.
</Note>

## Embed ospitati

I messaggi dell'assistente possono visualizzare contenuti web ospitati inline con lo shortcode `[embed ...]`. La policy sandbox dell'iframe è controllata da `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Disabilita l'esecuzione di script negli embed ospitati.
  </Tab>
  <Tab title="scripts (default)">
    Consente embed interattivi mantenendo l'isolamento dell'origine; questa è l'impostazione predefinita ed è di solito sufficiente per giochi/widget browser autonomi.
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
Usa `trusted` solo quando il documento incorporato ha davvero bisogno del comportamento same-origin. Per la maggior parte dei giochi generati da agenti e canvas interattivi, `scripts` è la scelta più sicura.
</Warning>

Gli URL embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Larghezza dei messaggi chat

I messaggi chat raggruppati usano una max-width predefinita leggibile. I deployment su monitor larghi possono sovrascriverla senza modificare il CSS incluso impostando `gateway.controlUi.chatMessageMaxWidth`:

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

    Per impostazione predefinita, le richieste Control UI/WebSocket Serve possono autenticarsi tramite header di identità Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con `tailscale whois` e confrontandolo con l'header, e le accetta solo quando la richiesta arriva al loopback con gli header `x-forwarded-*` di Tailscale. Per le sessioni operatore della Control UI con identità dispositivo browser, questo percorso Serve verificato salta anche il round trip di pairing del dispositivo; i browser senza dispositivo e le connessioni con ruolo node seguono comunque i normali controlli del dispositivo. Imposta `gateway.auth.allowTailscale: false` se vuoi richiedere credenziali shared-secret esplicite anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.

    Per quel percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client e ambito auth vengono serializzati prima delle scritture di rate-limit. I retry errati concorrenti dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta invece di due semplici mismatch in competizione in parallelo.

    <Warning>
    L'autenticazione Serve senza token presuppone che l'host gateway sia attendibile. Se codice locale non attendibile può essere eseguito su quell'host, richiedi autenticazione token/password.
    </Warning>

  </Tab>
  <Tab title="Binding a tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Poi apri:

    - `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

    Incolla il segreto condiviso corrispondente nelle impostazioni della UI (inviato come `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP non sicuro

Se apri la dashboard tramite HTTP in chiaro (`http://<lan-ip>` o `http://<tailscale-ip>`), il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita, OpenClaw **blocca** le connessioni della UI di controllo senza identità del dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicura solo per localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita della UI di controllo dell'operatore tramite `gateway.auth.mode: "trusted-proxy"`
- opzione di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host del Gateway)

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

    - Consente alle sessioni della UI di controllo su localhost di procedere senza identità del dispositivo in contesti HTTP non sicuri.
    - Non aggira i controlli di abbinamento.
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
    `dangerouslyDisableDeviceAuth` disabilita i controlli dell'identità del dispositivo della UI di controllo ed è un grave indebolimento della sicurezza. Ripristina rapidamente dopo l'uso di emergenza.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - L'autenticazione trusted-proxy riuscita può ammettere sessioni della UI di controllo **operatore** senza identità del dispositivo.
    - Questo **non** si estende alle sessioni della UI di controllo con ruolo node.
    - I proxy inversi loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; consulta [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Criteri di sicurezza dei contenuti

La UI di controllo include una policy `img-src` rigorosa: sono consentiti solo asset della **stessa origine**, URL `data:` e URL `blob:` generati localmente. Gli URL immagine remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non avviano richieste di rete.

Cosa significa in pratica:

- Avatar e immagini serviti da percorsi relativi (per esempio `/avatars/<id>`) vengono comunque renderizzati, incluse le route avatar autenticate che la UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` vengono comunque renderizzati (utili per payload nel protocollo).
- Gli URL `blob:` locali creati dalla UI di controllo vengono comunque renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della UI di controllo e sostituiti con il logo/badge integrato, quindi un canale compromesso o dannoso non può forzare recuperi arbitrari di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del Gateway è configurata, l'endpoint avatar della UI di controllo richiede lo stesso token del Gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati dell'avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route sorella assistant-media). Questo impedisce alla route avatar di divulgare l'identità dell'agente su host altrimenti protetti.
- La UI di controllo inoltra il token del Gateway come header bearer quando recupera gli avatar e usa URL blob autenticati, così l'immagine viene comunque renderizzata nelle dashboard.

Se disabiliti l'autenticazione del Gateway (sconsigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del Gateway.

## Autenticazione della route dei media dell'assistente

Quando l'autenticazione del Gateway è configurata, le anteprime dei media locali dell'assistente usano una route in due passaggi:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` richiede la normale autenticazione operatore della UI di controllo. Il browser invia il token del Gateway come header bearer quando verifica la disponibilità.
- Le risposte dei metadati riuscite includono un `mediaTicket` di breve durata limitato a quel percorso sorgente esatto.
- Gli URL di immagini, audio, video e documenti renderizzati dal browser usano `mediaTicket=<ticket>` invece del token o della password attivi del Gateway. Il ticket scade rapidamente e non può autorizzare una sorgente diversa.

Questo mantiene il normale rendering dei media compatibile con gli elementi multimediali nativi del browser senza inserire credenziali riutilizzabili del Gateway negli URL multimediali visibili.

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

Poi punta la UI all'URL WS del tuo Gateway (per esempio `ws://127.0.0.1:18789`).

## Debug/test: server di sviluppo + Gateway remoto

La UI di controllo è composta da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. È utile quando vuoi il server di sviluppo Vite localmente ma il Gateway viene eseguito altrove.

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

    Autenticazione monouso opzionale (se necessaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` viene memorizzato in localStorage dopo il caricamento e rimosso dall'URL.
    - Se passi un endpoint completo `ws://` o `wss://` tramite `gatewayUrl`, codifica per URL il valore `gatewayUrl` in modo che il browser analizzi correttamente la stringa di query.
    - `token` deve essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando perdite nei log delle richieste e nel Referer. I parametri di query legacy `?token=` vengono ancora importati una sola volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
    - `password` viene conservata solo in memoria.
    - Quando `gatewayUrl` è impostato, la UI non ripiega sulle credenziali di configurazione o di ambiente. Fornisci esplicitamente `token` (o `password`). L'assenza di credenziali esplicite è un errore.
    - Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
    - `gatewayUrl` è accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
    - Le distribuzioni non loopback della UI di controllo devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). Questo include le configurazioni di sviluppo remote.
    - L'avvio del Gateway può inizializzare origini locali come `http://localhost:<port>` e `http://127.0.0.1:<port>` dal bind e dalla porta runtime effettivi, ma le origini dei browser remoti richiedono comunque voci esplicite.
    - Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non "corrispondere a qualunque host io stia usando."
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

- [Dashboard](/it/web/dashboard) — dashboard del Gateway
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del Gateway
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser

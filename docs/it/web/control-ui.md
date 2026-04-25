---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi l'accesso Tailnet senza tunnel SSH
summary: UI di controllo basata su browser per il Gateway (chat, Node, configurazione)
title: UI di controllo
x-i18n:
    generated_at: "2026-04-25T18:24:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29d77ae57e32abe5ad25b2c22986d9d8e67f7ac183af06e8ffc4907ae4e6c0bc
    source_path: web/control-ui.md
    workflow: 15
---

La UI di controllo è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad esempio `/openclaw`)

Comunica **direttamente con il Gateway WebSocket** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'auth viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard mantiene un token per la sessione della scheda corrente del browser
e l'URL del gateway selezionato; le password non vengono persistite. L'onboarding in genere
genera un token gateway per l'auth a segreto condiviso alla prima connessione, ma l'auth
con password funziona comunque quando `gateway.auth.mode` è `"password"`.

## Pairing del dispositivo (prima connessione)

Quando ti connetti alla UI di controllo da un nuovo browser o dispositivo, il Gateway
richiede una **approvazione di pairing una tantum** — anche se ti trovi sulla stessa Tailnet
con `gateway.auth.allowTailscale: true`. Questa è una misura di sicurezza per evitare
accessi non autorizzati.

**Cosa vedrai:** "disconnected (1008): pairing required"

**Per approvare il dispositivo:**

```bash
# Elenca le richieste in sospeso
openclaw devices list

# Approva tramite ID richiesta
openclaw devices approve <requestId>
```

Se il browser ritenta il pairing con dettagli auth cambiati (ruolo/ambiti/chiave
pubblica), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo cambi da accesso in lettura a
accesso in scrittura/admin, questo viene trattato come un aggiornamento dell'approvazione, non come una
riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia
e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno
che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi
[Devices CLI](/it/cli/devices) per rotazione dei token e revoca.

**Note:**

- Le connessioni browser dirette su loopback locale (`127.0.0.1` / `localhost`) sono
  auto-approvate.
- Le connessioni browser Tailnet e LAN richiedono comunque approvazione esplicita, anche quando
  provengono dalla stessa macchina.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o
  cancellare i dati del browser richiederà un nuovo pairing.

## Identità personale (locale al browser)

La UI di controllo supporta un'identità personale per browser (nome visualizzato e
avatar) associata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Vive
nello storage del browser, ha ambito limitato al profilo browser corrente e non viene
sincronizzata con altri dispositivi né persistita lato server oltre ai normali metadati
di paternità nella trascrizione dei messaggi che invii effettivamente. La cancellazione dei dati del sito o
il cambio browser la reimposta a vuota.

Lo stesso schema locale al browser si applica all'override dell'avatar dell'assistente.
Gli avatar dell'assistente caricati sovrappongono l'identità risolta dal gateway solo nel
browser locale e non fanno mai round-trip tramite `config.patch`. Il campo di configurazione condiviso
`ui.assistant.avatar` resta disponibile per client non UI che scrivono direttamente il campo
(come gateway scriptati o dashboard personalizzate).

## Endpoint di configurazione runtime

La UI di controllo recupera le proprie impostazioni runtime da
`/__openclaw/control-ui-config.json`. Questo endpoint è protetto dalla stessa
auth gateway del resto della superficie HTTP: i browser non autenticati non possono
recuperarlo, e un recupero riuscito richiede un token/password gateway già valido,
un'identità Tailscale Serve oppure un'identità trusted-proxy.

## Supporto lingua

La UI di controllo può localizzarsi al primo caricamento in base alla lingua del tuo browser.
Per sovrascriverla in seguito, apri **Panoramica -> Accesso Gateway -> Lingua**. Il
selettore della lingua si trova nella scheda Accesso Gateway, non sotto Aspetto.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti usano l'inglese come fallback.

## Cosa può fare (oggi)

- Chattare con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Parlare direttamente con OpenAI Realtime dal browser tramite WebRTC. Il Gateway
  emette un segreto client Realtime a breve durata con `talk.realtime.session`; il
  browser invia l'audio del microfono direttamente a OpenAI e inoltra le chiamate
  strumento `openclaw_agent_consult` tramite `chat.send` per il modello OpenClaw
  configurato più grande.
- Trasmettere chiamate strumento + schede di output strumento live in Chat (eventi agente)
- Canali: stato di canali built-in più Plugin bundled/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`)
- Istanze: elenco presenza + aggiornamento (`system-presence`)
- Sessioni: elenco + override per sessione di modello/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: stato dreaming, toggle abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Job Cron: elencare/aggiungere/modificare/eseguire/abilitare/disabilitare + cronologia delle esecuzioni (`cron.*`)
- Skills: stato, abilita/disabilita, installazione, aggiornamenti chiave API (`skills.*`)
- Node: elenco + capacità (`node.list`)
- Approvazioni Exec: modifica allowlist gateway o node + policy ask per `exec host=gateway/node` (`exec.approvals.*`)
- Configurazione: visualizzare/modificare `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configurazione: applicare + riavviare con convalida (`config.apply`) e riattivare l'ultima sessione attiva
- Le scritture della configurazione includono una protezione base-hash per evitare di sovrascrivere modifiche concorrenti
- Le scritture della configurazione (`config.set`/`config.apply`/`config.patch`) effettuano anche un preflight della risoluzione attiva di SecretRef per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati non risolti vengono rifiutati prima della scrittura
- Schema di configurazione + rendering del form (`config.schema` / `config.schema.lookup`,
  inclusi `title` / `description` del campo, suggerimenti UI corrispondenti, riepiloghi immediati dei figli,
  metadati documentazione su nodi annidati object/wildcard/array/composition,
  più schemi Plugin + canale quando disponibili); l'editor Raw JSON è
  disponibile solo quando lo snapshot ha un round-trip raw sicuro
- Se uno snapshot non può fare round-trip sicuro del testo raw, la UI di controllo forza la modalità Form e disabilita la modalità Raw per quello snapshot
- Il comando dell'editor Raw JSON "Reset to saved" conserva la forma redatta in raw (formattazione, commenti, layout `$include`) invece di renderizzare nuovamente uno snapshot appiattito, così le modifiche esterne sopravvivono a un reset quando lo snapshot può fare round-trip sicuro
- I valori oggetto `SecretRef` strutturati vengono mostrati in sola lettura negli input testuali del form per evitare una corruzione accidentale da oggetto a stringa
- Debug: snapshot di stato/salute/modelli + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`)
- Log: tail live dei file di log del gateway con filtro/esportazione (`logs.tail`)
- Aggiornamento: eseguire un aggiornamento package/git + riavvio (`update.run`) con report di riavvio

Note sul pannello dei job Cron:

- Per i job isolati, la consegna usa come predefinita un riepilogo announce. Puoi passare a none se vuoi esecuzioni solo interne.
- I campi canale/target appaiono quando è selezionato announce.
- La modalità webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato a un URL webhook HTTP(S) valido.
- Per i job della sessione principale, sono disponibili le modalità di consegna webhook e none.
- I controlli di modifica avanzata includono eliminazione dopo esecuzione, cancellazione dell'override agente, opzioni Cron exact/stagger,
  override di modello/thinking dell'agente e toggle di consegna best effort.
- La convalida del form è inline con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
- Imposta `cron.webhookToken` per inviare un token bearer dedicato; se omesso il webhook viene inviato senza header auth.
- Fallback deprecato: i job legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

## Comportamento della chat

- `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa in streaming tramite eventi `chat`.
- Reinviare con la stessa `idempotencyKey` restituisce `{ status: "in_flight" }` mentre è in esecuzione, e `{ status: "ok" }` dopo il completamento.
- Le risposte `chat.history` hanno dimensioni limitate per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare i campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire i messaggi sovradimensionati con un placeholder (`[chat.history omitted: message too large]`).
- Le immagini dell'assistente/generate vengono persistite come riferimenti media gestiti e servite di nuovo tramite URL media autenticati del Gateway, così i ricaricamenti non dipendono dal fatto che i payload immagine raw base64 restino nella risposta della cronologia chat.
- `chat.history` rimuove anche dal testo visibile dell'assistente i tag inline di direttive solo display (ad esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumenti troncati) e i token di controllo del modello trapelati in ASCII/full-width, e omette le voci dell'assistente il cui intero testo visibile è solo l'esatto token silenzioso `NO_REPLY` / `no_reply`.
- Durante un invio attivo e l'aggiornamento finale della cronologia, la vista chat mantiene visibili i messaggi utente/assistente ottimistici locali se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali una volta che la cronologia del Gateway si aggiorna.
- `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e diffonde un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessuna consegna al canale).
- I selettori di modello e thinking nell'intestazione della chat modificano immediatamente la sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio valide per un solo turno.
- Quando i report di utilizzo freschi della sessione Gateway mostrano un'elevata pressione di contesto, l'area del composer della chat mostra un avviso di contesto e, ai livelli di Compaction consigliati, un pulsante compatta che esegue il normale percorso di Compaction della sessione. Gli snapshot dei token obsoleti vengono nascosti finché il Gateway non riporta di nuovo utilizzo aggiornato.
- La modalità Talk usa un provider vocale realtime registrato che supporta sessioni WebRTC nel browser. Configura OpenAI con `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure riusa la configurazione del provider realtime Voice Call. Il browser non riceve mai la chiave API OpenAI standard; riceve solo il segreto client Realtime effimero. La voce realtime Google Live è supportata per il backend Voice Call e i bridge Google Meet, ma non ancora per questo percorso WebRTC del browser. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.realtime.session` non accetta override di istruzioni forniti dal chiamante.
- Nel composer della Chat, il controllo Talk è il pulsante con le onde accanto al pulsante di dettatura del microfono. Quando Talk si avvia, la riga di stato del composer mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata strumento realtime consulta il modello OpenClaw configurato più grande tramite `chat.send`.
- Interruzione:
  - Fai clic su **Stop** (chiama `chat.abort`)
  - Mentre un'esecuzione è attiva, i normali messaggi successivi vanno in coda. Fai clic su **Steer** su un messaggio in coda per iniettare quel messaggio successivo nel turno in esecuzione.
  - Digita `/stop` (o frasi di interruzione standalone come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda
  - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione
- Conservazione parziale in caso di interruzione:
  - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nella UI
  - Il Gateway persiste nella cronologia della trascrizione il testo parziale dell'assistente interrotto quando esiste output bufferizzato
  - Le voci persistite includono metadati di interruzione così i consumer della trascrizione possono distinguere i parziali interrotti dall'output di completamento normale

## Installazione PWA e web push

La UI di controllo distribuisce un `manifest.webmanifest` e un service worker, quindi
i browser moderni possono installarla come PWA standalone. Web Push consente al
Gateway di riattivare la PWA installata con notifiche anche quando la scheda o la
finestra del browser non è aperta.

| Superficie                                            | Cosa fa                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Installa app" quando è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche. |
| `push/vapid-keys.json` (sotto la directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare i payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione del browser persistiti.                |

Sovrascrivi la coppia di chiavi VAPID tramite variabili env nel processo Gateway quando
vuoi fissare le chiavi (per deployment multi-host, rotazione dei segreti o
test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito: `mailto:openclaw@localhost`)

La UI di controllo usa questi metodi Gateway con ambito controllato per registrare e
testare le sottoscrizioni del browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

Web Push è indipendente dal percorso relay APNS di iOS
(vedi [Configurazione](/it/gateway/configuration) per il push supportato da relay) e
dal metodo esistente `push.test`, che prende di mira l'associazione mobile nativa.

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`.
La policy sandbox dell'iframe è controllata da
`gateway.controlUi.embedSandbox`:

- `strict`: disabilita l'esecuzione di script all'interno degli embed ospitati
- `scripts`: consente embed interattivi mantenendo l'isolamento dell'origine; questo è
  il valore predefinito ed è di solito sufficiente per giochi/widget browser autosufficienti
- `trusted`: aggiunge `allow-same-origin` oltre a `allow-scripts` per documenti dello stesso sito
  che necessitano intenzionalmente di privilegi più forti

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

Usa `trusted` solo quando il documento incorporato richiede davvero un comportamento
same-origin. Per la maggior parte dei giochi e canvas interattivi generati dall'agente, `scripts` è
la scelta più sicura.

Gli URL embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se
vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Accesso Tailnet (consigliato)

### Tailscale Serve integrato (preferito)

Mantieni il Gateway su loopback e lascia che Tailscale Serve lo instradi tramite HTTPS:

```bash
openclaw gateway --tailscale serve
```

Apri:

- `https://<magicdns>/` (oppure `gateway.controlUi.basePath` se configurato)

Per impostazione predefinita, le richieste Control UI/WebSocket tramite Serve possono autenticarsi tramite header di identità Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw
verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con
`tailscale whois` e confrontandolo con l'header, e accetta questi header solo quando la
richiesta raggiunge loopback con gli header `x-forwarded-*` di Tailscale. Imposta
`gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso
anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` oppure
`"password"`.
Per questo percorso asincrono di identità Serve, i tentativi auth falliti per lo stesso IP client
e ambito auth vengono serializzati prima delle scritture rate-limit. Retry concorrenti errati
dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta
invece di due semplici mismatch che gareggiano in parallelo.
L'auth Serve senza token presuppone che l'host gateway sia attendibile. Se su quell'host può essere eseguito
codice locale non attendibile, richiedi auth con token/password.

### Bind su tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Poi apri:

- `http://<tailscale-ip>:18789/` (oppure `gateway.controlUi.basePath` se configurato)

Incolla il segreto condiviso corrispondente nelle impostazioni della UI (inviato come
`connect.params.auth.token` oppure `connect.params.auth.password`).

## HTTP non sicuro

Se apri la dashboard su HTTP in chiaro (`http://<lan-ip>` oppure `http://<tailscale-ip>`),
il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita,
OpenClaw **blocca** le connessioni della UI di controllo senza identità del dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicuro solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita dell'operatore nella UI di controllo tramite `gateway.auth.mode: "trusted-proxy"`
- opzione di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host gateway)

**Comportamento del toggle allowInsecureAuth:**

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

- Consente alle sessioni della UI di controllo su localhost di procedere senza identità del dispositivo in
  contesti HTTP non sicuri.
- Non aggira i controlli di pairing.
- Non allenta i requisiti di identità del dispositivo per connessioni remote (non localhost).

**Solo per emergenze:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della UI di controllo ed è un
grave peggioramento della sicurezza. Ripristinalo rapidamente dopo l'uso di emergenza.

Nota trusted-proxy:

- un'autenticazione trusted-proxy riuscita può ammettere sessioni **operatore** della UI di controllo senza
  identità del dispositivo
- questo **non** si estende alle sessioni della UI di controllo con ruolo node
- i reverse proxy loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi
  [Auth proxy attendibile](/it/gateway/trusted-proxy-auth)

Vedi [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Content Security Policy

La UI di controllo distribuisce una policy `img-src` rigorosa: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL immagine remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non generano richieste di rete.

In pratica questo significa:

- Avatar e immagini serviti tramite percorsi relativi (ad esempio `/avatars/<id>`) continuano a essere visualizzati, incluse le route avatar autenticate che la UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` continuano a essere visualizzati (utile per payload in-protocol).
- Gli URL `blob:` locali creati dalla UI di controllo continuano a essere visualizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della UI di controllo e sostituiti con il logo/badge built-in, così un canale compromesso o malevolo non può forzare richieste arbitrarie di immagini remote dal browser di un operatore.

Non devi cambiare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Auth della route avatar

Quando è configurata l'auth gateway, l'endpoint avatar della UI di controllo richiede lo stesso token gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (in linea con la route sorella assistant-media). Questo impedisce che la route avatar divulghi l'identità dell'agente su host altrimenti protetti.
- La UI di controllo stessa inoltra il token gateway come header bearer durante il recupero degli avatar e usa URL blob autenticati, così l'immagine continua a essere visualizzata nelle dashboard.

Se disabiliti l'auth del gateway (non consigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del gateway.

## Compilazione della UI

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

```bash
pnpm ui:build
```

Base assoluta facoltativa (quando vuoi URL degli asset fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server di sviluppo separato):

```bash
pnpm ui:dev
```

Poi punta la UI al tuo URL Gateway WS (ad esempio `ws://127.0.0.1:18789`).

## Debug/test: server di sviluppo + Gateway remoto

La UI di controllo è costituita da file statici; il target WebSocket è configurabile e può essere
diverso dall'origine HTTP. Questo è utile quando vuoi il server di sviluppo Vite
in locale ma il Gateway è in esecuzione altrove.

1. Avvia il server di sviluppo della UI: `pnpm ui:dev`
2. Apri un URL come:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Auth facoltativa una tantum (se necessaria):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Note:

- `gatewayUrl` viene salvato in localStorage dopo il caricamento e rimosso dall'URL.
- `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando così perdite nei log delle richieste e nel Referer. I parametri query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
- `password` viene mantenuta solo in memoria.
- Quando `gatewayUrl` è impostato, la UI non usa come fallback le credenziali di configurazione o di ambiente.
  Fornisci esplicitamente `token` (o `password`). L'assenza di credenziali esplicite è un errore.
- Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
- `gatewayUrl` è accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
- I deployment della UI di controllo non loopback devono impostare `gateway.controlUi.allowedOrigins`
  esplicitamente (origini complete). Questo include le configurazioni di sviluppo remoto.
- Non usare `gateway.controlUi.allowedOrigins: ["*"]` se non per test locali strettamente controllati.
  Significa consentire qualsiasi origine browser, non “corrispondi a qualunque host io stia
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita
  la modalità di fallback dell'origine tramite Host header, ma è una modalità di sicurezza pericolosa.

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
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser
- [TUI](/it/web/tui) — interfaccia utente terminale
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del gateway

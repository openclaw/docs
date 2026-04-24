---
read_when:
    - |-
      Vuoi gestire il Gateway da un browserиааира to=final code```
      Vuoi gestire il Gateway da un browser
      ```
    - |-
      Vuoi accesso Tailnet senza tunnel SSH to=final code```
      Vuoi accesso Tailnet senza tunnel SSH
      ```
summary: Interfaccia di controllo basata su browser per il Gateway (chat, Node, configurazione)
title: |-
    Control UI to=final code```
    Control UI
    ```
x-i18n:
    generated_at: "2026-04-24T09:09:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ad0d0cef7d842eddf665ba50f37403df258b17d4c072d22a30d1bc3830dc467
    source_path: web/control-ui.md
    workflow: 15
---

La Control UI è una piccola single-page app **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (es. `/openclaw`)

Comunica **direttamente con il Gateway WebSocket** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L’autenticazione viene fornita durante l’handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- intestazioni di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- intestazioni di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello impostazioni della dashboard mantiene un token per la sessione
della scheda browser corrente e l’URL del gateway selezionato; le password non
vengono persistite. L’onboarding di solito genera un token gateway per
l’autenticazione con segreto condiviso alla prima connessione, ma anche
l’autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti alla Control UI da un nuovo browser o dispositivo, il Gateway
richiede una **approvazione di pairing una tantum** — anche se sei sulla stessa
Tailnet con `gateway.auth.allowTailscale: true`. Questa è una misura di sicurezza per prevenire
accessi non autorizzati.

**Cosa vedrai:** "disconnected (1008): pairing required"

**Per approvare il dispositivo:**

```bash
# Elenca le richieste in sospeso
openclaw devices list

# Approva tramite request ID
openclaw devices approve <requestId>
```

Se il browser ritenta il pairing con dettagli di autenticazione cambiati (ruolo/scope/chiave pubblica), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo
`requestId`. Esegui di nuovo `openclaw devices list` prima dell’approvazione.

Se il browser è già associato e lo cambi da accesso in sola lettura ad accesso
write/admin, questo viene trattato come un upgrade di approvazione, non come una
riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia
e ti chiede di approvare esplicitamente il nuovo insieme di scope.

Una volta approvato, il dispositivo viene ricordato e non richiederà nuova approvazione a meno che
tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi
[CLI Devices](/it/cli/devices) per rotazione e revoca dei token.

**Note:**

- Le connessioni dirette browser local loopback (`127.0.0.1` / `localhost`) vengono
  auto-approvate.
- Le connessioni browser Tailnet e LAN richiedono comunque approvazione esplicita, anche quando
  provengono dalla stessa macchina.
- Ogni profilo browser genera un device ID univoco, quindi cambiare browser o
  cancellare i dati del browser richiederà un nuovo pairing.

## Identità personale (locale al browser)

La Control UI supporta un’identità personale per-browser (nome visualizzato e
avatar) allegata ai messaggi in uscita per l’attribuzione nelle sessioni condivise. Vive
nello storage del browser, ha scope per il profilo browser corrente e non viene
sincronizzata su altri dispositivi né persistita lato server oltre ai normali metadati
di paternità nella trascrizione dei messaggi che invii davvero. Cancellare i dati del sito o
cambiare browser la reimposta a vuota.

## Endpoint di configurazione runtime

La Control UI recupera le sue impostazioni runtime da
`/__openclaw/control-ui-config.json`. Quell’endpoint è protetto dalla stessa
autenticazione gateway del resto della superficie HTTP: i browser non autenticati non
possono recuperarlo, e un fetch riuscito richiede un token/password gateway già validi,
identità Tailscale Serve oppure identità trusted-proxy.

## Supporto lingue

La Control UI può localizzarsi al primo caricamento in base alla locale del tuo browser.
Per sostituirla più tardi, apri **Overview -> Gateway Access -> Language**. Il
selettore della locale si trova nella scheda Gateway Access, non sotto Appearance.

- Locali supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Le traduzioni non inglesi vengono caricate lazy nel browser.
- La locale selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti usano come fallback l’inglese.

## Cosa può fare (oggi)

- Chattare con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Comunicare direttamente dal browser con OpenAI Realtime tramite WebRTC. Il Gateway
  genera un secret client Realtime a breve durata con `talk.realtime.session`; il
  browser invia l’audio del microfono direttamente a OpenAI e inoltra le
  chiamate allo strumento `openclaw_agent_consult` a `chat.send` per il modello OpenClaw
  più grande configurato.
- Streaming delle chiamate agli strumenti + card con output live degli strumenti in Chat (eventi agente)
- Canali: stato dei canali integrati più Plugin inclusi/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`)
- Istanze: elenco presenza + refresh (`system-presence`)
- Sessioni: elenco + override per-sessione di model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: stato di Dreaming, toggle abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Lavori Cron: elenca/aggiungi/modifica/esegui/abilita/disabilita + cronologia delle esecuzioni (`cron.*`)
- Skills: stato, abilita/disabilita, installa, aggiornamenti chiavi API (`skills.*`)
- Nodes: elenco + capacità (`node.list`)
- Approvazioni Exec: modifica allowlist gateway o node + policy ask per `exec host=gateway/node` (`exec.approvals.*`)
- Configurazione: visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configurazione: applica + riavvia con validazione (`config.apply`) e riattiva l’ultima sessione attiva
- Le scritture di configurazione includono una protezione base-hash per evitare di sovrascrivere modifiche concorrenti
- Le scritture di configurazione (`config.set`/`config.apply`/`config.patch`) eseguono anche un preflight di risoluzione SecretRef attivi per i riferimenti presenti nel payload di configurazione inviato; i riferimenti attivi non risolti inviati vengono rifiutati prima della scrittura
- Schema di configurazione + rendering del form (`config.schema` / `config.schema.lookup`,
  inclusi `title` / `description` del campo, hint UI corrispondenti, riepiloghi immediati dei figli,
  metadati doc su nodi annidati object/wildcard/array/composition,
  più schemi Plugin + canale quando disponibili); l’editor Raw JSON è
  disponibile solo quando lo snapshot ha un round-trip raw sicuro
- Se uno snapshot non può fare round-trip sicuro del testo raw, la Control UI forza la modalità Form e disabilita la modalità Raw per quello snapshot
- L’editor Raw JSON "Reset to saved" preserva la forma authored raw (formattazione, commenti, layout `$include`) invece di rirenderizzare uno snapshot flatten, così le modifiche esterne sopravvivono a un reset quando lo snapshot può fare round-trip in sicurezza
- I valori oggetto SecretRef strutturati vengono renderizzati in sola lettura negli input di testo del form per prevenire corruzione accidentale da oggetto a stringa
- Debug: snapshot di status/health/models + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`)
- Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`)
- Update: esegue un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio

Note sul pannello dei lavori Cron:

- Per i lavori isolati, la consegna usa come predefinito il riepilogo announce. Puoi passare a none se vuoi esecuzioni solo interne.
- I campi canale/destinazione compaiono quando announce è selezionato.
- La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato a un URL Webhook HTTP(S) valido.
- Per i lavori della sessione principale, sono disponibili le modalità di consegna webhook e none.
- I controlli di modifica avanzata includono delete-after-run, clear dell’override agente, opzioni cron exact/stagger,
  override di model/thinking dell’agente e toggle di consegna best-effort.
- La validazione del form è inline con errori a livello campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
- Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il Webhook viene inviato senza intestazione auth.
- Fallback deprecato: i lavori legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

## Comportamento della chat

- `chat.send` è **non bloccante**: conferma subito con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`.
- Reinviare con lo stesso `idempotencyKey` restituisce `{ status: "in_flight" }` mentre è in esecuzione, e `{ status: "ok" }` dopo il completamento.
- Le risposte `chat.history` hanno dimensione limitata per sicurezza UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire i messaggi troppo grandi con un placeholder (`[chat.history omitted: message too large]`).
- Le immagini dell’assistente/generate vengono persistite come riferimenti media gestiti e servite di ritorno tramite URL media autenticati del Gateway, così i reload non dipendono dal fatto che i payload immagine base64 grezzi restino nella risposta della cronologia chat.
- `chat.history` rimuove anche i tag di direttiva inline solo-display dal testo visibile dell’assistente (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata agli strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di tool-call troncati), e i token di controllo del modello ASCII/full-width trapelati, e omette le voci dell’assistente il cui intero testo visibile è solo il token silenzioso esatto `NO_REPLY` / `no_reply`.
- `chat.inject` aggiunge una nota dell’assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo-UI (nessuna esecuzione agente, nessuna consegna canale).
- I selettori model e thinking nell’header della chat aggiornano immediatamente la sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio di un solo turno.
- La modalità Talk usa il provider realtime voice registrato. Configura OpenAI con
  `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure riusa la
  configurazione del provider realtime Voice Call. Il browser non riceve mai la chiave API OpenAI standard; riceve solo il secret client Realtime effimero. Il prompt della sessione Realtime è assemblato dal Gateway; `talk.realtime.session` non accetta override di istruzioni forniti dal chiamante.
- Nel composer Chat, il controllo Talk è il pulsante onde accanto al pulsante
  di dettatura del microfono. Quando Talk parte, la riga di stato del composer mostra
  `Connecting Talk...`, poi `Talk live` mentre l’audio è connesso, oppure
  `Asking OpenClaw...` mentre una chiamata realtime a uno strumento consulta il modello più grande configurato tramite `chat.send`.
- Arresto:
  - Clicca **Stop** (chiama `chat.abort`)
  - Mentre un’esecuzione è attiva, i normali follow-up vengono accodati. Clicca **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
  - Digita `/stop` (oppure frasi di interruzione standalone come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere out-of-band
  - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione
- Conservazione dei parziali in abort:
  - Quando un’esecuzione viene interrotta, il testo parziale dell’assistente può comunque essere mostrato nella UI
  - Il Gateway persiste il testo parziale interrotto dell’assistente nella cronologia della trascrizione quando esiste output bufferizzato
  - Le voci persistite includono metadati di abort così i consumer della trascrizione possono distinguere i parziali da abort dai normali output di completamento

## Embed ospitati

I messaggi dell’assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`.
La policy sandbox dell’iframe è controllata da
`gateway.controlUi.embedSandbox`:

- `strict`: disabilita l’esecuzione di script dentro gli embed ospitati
- `scripts`: consente embed interattivi mantenendo l’isolamento di origine; questo è
  il predefinito ed è di solito sufficiente per giochi/widget browser autocontenuti
- `trusted`: aggiunge `allow-same-origin` sopra `allow-scripts` per documenti dello stesso sito che intenzionalmente hanno bisogno di privilegi più forti

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

Usa `trusted` solo quando il documento incorporato ha realmente bisogno di
comportamento same-origin. Per la maggior parte dei giochi generati dall’agente e canvas interattivi, `scripts` è
la scelta più sicura.

Gli URL embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se
vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Accesso Tailnet (consigliato)

### Tailscale Serve integrato (preferito)

Mantieni il Gateway su loopback e lascia che Tailscale Serve faccia da proxy con HTTPS:

```bash
openclaw gateway --tailscale serve
```

Apri:

- `https://<magicdns>/` (oppure il tuo `gateway.controlUi.basePath` configurato)

Per impostazione predefinita, le richieste Serve di Control UI/WebSocket possono autenticarsi tramite intestazioni di identità Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw
verifica l’identità risolvendo l’indirizzo `x-forwarded-for` con
`tailscale whois` e confrontandolo con l’intestazione, e accetta queste richieste solo quando
raggiungono il loopback con le intestazioni `x-forwarded-*` di Tailscale. Imposta
`gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso
anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` oppure
`"password"`.
Per quel percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client
e lo stesso scope di autenticazione vengono serializzati prima delle scritture di rate-limit. I retry errati concorrenti
dallo stesso browser possono quindi mostrare `retry later` nella seconda richiesta
invece di due semplici mismatch che competono in parallelo.
L’autenticazione Serve senza token presuppone che l’host del gateway sia trusted. Se su quell’host
può essere eseguito codice locale non trusted, richiedi autenticazione con token/password.

### Bind a tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Poi apri:

- `http://<tailscale-ip>:18789/` (oppure il tuo `gateway.controlUi.basePath` configurato)

Incolla il segreto condiviso corrispondente nelle impostazioni UI (inviato come
`connect.params.auth.token` oppure `connect.params.auth.password`).

## HTTP non sicuro

Se apri la dashboard su HTTP semplice (`http://<lan-ip>` oppure `http://<tailscale-ip>`),
il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita,
OpenClaw **blocca** le connessioni alla Control UI senza identità del dispositivo.

Eccezioni documentate:

- compatibilità localhost-only HTTP non sicuro con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita dell’operatore alla Control UI tramite `gateway.auth.mode: "trusted-proxy"`
- opzione di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri la UI in locale:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull’host del gateway)

**Comportamento del toggle insecure-auth:**

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

- Consente alle sessioni Control UI localhost di procedere senza identità del dispositivo in
  contesti HTTP non sicuri.
- Non bypassa i controlli di pairing.
- Non allenta i requisiti di identità del dispositivo remoti (non-localhost).

**Solo break-glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della Control UI ed è un
grave downgrade della sicurezza. Ripristinalo rapidamente dopo l’uso in emergenza.

Nota trusted-proxy:

- l’autenticazione trusted-proxy riuscita può ammettere sessioni Control UI **operator**
  senza identità del dispositivo
- questo **non** si estende alle sessioni Control UI con ruolo node
- i reverse proxy loopback sullo stesso host continuano a non soddisfare l’autenticazione trusted-proxy; vedi
  [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth)

Vedi [Tailscale](/it/gateway/tailscale) per le indicazioni sulla configurazione HTTPS.

## Content Security Policy

La Control UI viene fornita con una policy `img-src` rigorosa: sono consentite solo risorse **same-origin** e URL `data:`. Gli URL immagine remoti `http(s)` e protocol-relative vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Gli avatar e le immagini serviti con percorsi relativi (per esempio `/avatars/<id>`) continuano a essere renderizzati.
- Gli URL inline `data:image/...` continuano a essere renderizzati (utile per payload in-protocol).
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della Control UI e sostituiti con il logo/badge integrato, così un canale compromesso o malevolo non può forzare richieste remote arbitrarie di immagini dal browser di un operatore.

Non devi cambiare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando è configurata l’autenticazione del gateway, l’endpoint avatar della Control UI richiede lo stesso token gateway del resto dell’API:

- `GET /avatar/<agentId>` restituisce l’immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati dell’avatar secondo la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route sibling assistant-media). Questo impedisce che la route avatar riveli l’identità dell’agente su host altrimenti protetti.
- La Control UI stessa inoltra il token gateway come intestazione bearer quando recupera gli avatar e usa blob URL autenticati così l’immagine continua a essere renderizzata nelle dashboard.

Se disabiliti l’autenticazione del gateway (sconsigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del gateway.

## Creare la UI

Il Gateway serve file statici da `dist/control-ui`. Creali con:

```bash
pnpm ui:build
```

Base assoluta facoltativa (quando vuoi URL asset fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server dev separato):

```bash
pnpm ui:dev
```

Poi punta la UI al tuo URL Gateway WS (es. `ws://127.0.0.1:18789`).

## Debug/testing: dev server + Gateway remoto

La Control UI è composta da file statici; il target WebSocket è configurabile e può essere
diverso dall’origine HTTP. Questo è utile quando vuoi il server dev Vite
in locale ma il Gateway gira altrove.

1. Avvia il server dev UI: `pnpm ui:dev`
2. Apri un URL come:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticazione one-time facoltativa (se necessaria):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Note:

- `gatewayUrl` viene salvato in localStorage dopo il caricamento e rimosso dall’URL.
- `token` dovrebbe essere passato tramite fragment URL (`#token=...`) quando possibile. I fragment non vengono inviati al server, evitando così perdite nei log delle richieste e nel Referer. I parametri query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi subito dopo il bootstrap.
- `password` viene mantenuta solo in memoria.
- Quando `gatewayUrl` è impostato, la UI non usa come fallback credenziali di configurazione o ambiente.
  Fornisci `token` (o `password`) esplicitamente. L’assenza di credenziali esplicite è un errore.
- Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
- `gatewayUrl` è accettato solo in una finestra top-level (non incorporata) per prevenire il clickjacking.
- I deployment della Control UI non loopback devono impostare esplicitamente `gateway.controlUi.allowedOrigins`
  (origini complete). Questo include le configurazioni dev remote.
- Non usare `gateway.controlUi.allowedOrigins: ["*"]` tranne che per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non “corrisponde a qualsiasi host io stia
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita
  la modalità fallback origine basata su Host-header, ma è una modalità di sicurezza pericolosa.

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

Dettagli sulla configurazione di accesso remoto: [Accesso remoto](/it/gateway/remote).

## Correlati

- [Dashboard](/it/web/dashboard) — dashboard del gateway
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser
- [TUI](/it/web/tui) — interfaccia utente terminale
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell’integrità del gateway

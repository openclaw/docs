---
read_when:
    - Vuoi usare il Gateway da un browser
    - Vuoi accesso Tailnet senza tunnel SSH
summary: UI di controllo basata su browser per il Gateway (chat, node, configurazione)
title: UI Control
x-i18n:
    generated_at: "2026-04-23T08:38:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# UI Control (browser)

La UI Control è una piccola single-page app **Vite + Lit** servita dal Gateway:

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

Il pannello impostazioni della dashboard conserva un token per la sessione
della scheda browser corrente e per l'URL Gateway selezionato; le password non
vengono persistite. L'onboarding di solito genera un token Gateway per
l'autenticazione a segreto condiviso alla prima connessione, ma anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Pairing del dispositivo (prima connessione)

Quando ti connetti alla UI Control da un nuovo browser o dispositivo, il Gateway
richiede una **approvazione di pairing una tantum** — anche se sei sulla stessa Tailnet
con `gateway.auth.allowTailscale: true`. Questa è una misura di sicurezza per prevenire
accessi non autorizzati.

**Cosa vedrai:** "disconnected (1008): pairing required"

**Per approvare il dispositivo:**

```bash
# Elenca le richieste in sospeso
openclaw devices list

# Approva per ID richiesta
openclaw devices approve <requestId>
```

Se il browser ritenta il pairing con dettagli auth cambiati (role/scopes/public
key), la richiesta precedente in sospeso viene sostituita e viene creato un nuovo `requestId`.
Riesegui `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo cambi da accesso in sola lettura a
accesso in scrittura/admin, questo viene trattato come un upgrade di approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione con scope più ampio
e ti chiede di approvare esplicitamente il nuovo insieme di scope.

Una volta approvato, il dispositivo viene ricordato e non richiederà nuova approvazione a meno
che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi
[CLI Devices](/it/cli/devices) per rotazione dei token e revoca.

**Note:**

- Le connessioni browser loopback locali dirette (`127.0.0.1` / `localhost`) vengono
  auto-approvate.
- Le connessioni browser tailnet e LAN richiedono comunque approvazione esplicita, anche quando
  provengono dalla stessa macchina.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o
  cancellare i dati del browser richiederà un nuovo pairing.

## Identità personale (locale al browser)

La UI Control supporta un'identità personale per-browser (nome visualizzato e
avatar) allegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Vive
nello storage del browser, è limitata al profilo browser corrente e non viene
sincronizzata con altri dispositivi né persistita lato server oltre ai normali metadati
di autoria della trascrizione sui messaggi che invii davvero. Cancellare i dati del sito o
cambiare browser la reimposta a vuota.

## Endpoint di configurazione runtime

La UI Control recupera le proprie impostazioni runtime da
`/__openclaw/control-ui-config.json`. Quel endpoint è protetto dalla stessa
autenticazione Gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo e un recupero riuscito richiede un token/password Gateway già valido,
identità Tailscale Serve o identità trusted-proxy.

## Supporto lingue

La UI Control può localizzarsi al primo caricamento in base alla locale del tuo browser.
Per sovrascriverla in seguito, apri **Overview -> Gateway Access -> Language**. Il
selettore della lingua si trova nella card Gateway Access, non sotto Appearance.

- Locali supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Le traduzioni non inglesi vengono caricate lazy nel browser.
- La locale selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti usano come fallback l'inglese.

## Cosa può fare (oggi)

- Chattare con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Fare streaming delle chiamate tool + card di output live dei tool nella Chat (eventi agente)
- Canali: stato di canali built-in più canali Plugin inclusi/esterni, accesso QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`)
- Istanze: elenco di presenza + refresh (`system-presence`)
- Sessioni: elenco + override per sessione di model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: stato dreaming, toggle abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Job Cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`)
- Skills: stato, abilita/disabilita, installazione, aggiornamenti chiavi API (`skills.*`)
- Node: elenco + capacità (`node.list`)
- Approvazioni exec: modifica delle allowlist Gateway o Node + policy ask per `exec host=gateway/node` (`exec.approvals.*`)
- Configurazione: visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configurazione: apply + restart con validazione (`config.apply`) e wake dell'ultima sessione attiva
- Le scritture di configurazione includono una protezione base-hash per prevenire la sovrascrittura di modifiche concorrenti
- Le scritture di configurazione (`config.set`/`config.apply`/`config.patch`) eseguono anche un preflight della risoluzione SecretRef attiva per i ref nel payload di configurazione inviato; i ref attivi inviati ma non risolti vengono rifiutati prima della scrittura
- Schema di configurazione + rendering dei form (`config.schema` / `config.schema.lookup`,
  incluse `title` / `description` dei campi, hint UI corrispondenti, riepiloghi dei figli immediati,
  metadati docs su nodi annidati object/wildcard/array/composition,
  più schemi di Plugin + canali quando disponibili); l'editor Raw JSON è
  disponibile solo quando lo snapshot ha un raw round-trip sicuro
- Se uno snapshot non può eseguire in sicurezza il round-trip del testo raw, la UI Control forza la modalità Form e disabilita la modalità Raw per quello snapshot
- Il comando "Reset to saved" dell'editor Raw JSON preserva la forma raw-authored (formattazione, commenti, layout `$include`) invece di rirestituire uno snapshot appiattito, così le modifiche esterne sopravvivono a un reset quando lo snapshot può fare un round-trip sicuro
- I valori oggetto SecretRef strutturati vengono resi in sola lettura nei campi testo del form per evitare corruzioni accidentali da oggetto a stringa
- Debug: snapshot status/health/models + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`)
- Log: tail live dei log file del Gateway con filtro/export (`logs.tail`)
- Aggiornamento: esegui un aggiornamento package/git + restart (`update.run`) con un report di riavvio

Note sul pannello dei job Cron:

- Per i job isolati, la consegna usa come predefinito il riepilogo announce. Puoi passare a nessuna se vuoi esecuzioni solo interne.
- I campi canale/destinazione compaiono quando è selezionato announce.
- La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL Webhook HTTP(S) valido.
- Per i job della sessione principale, sono disponibili le modalità di consegna webhook e none.
- I controlli avanzati di modifica includono delete-after-run, clear agent override, opzioni cron exact/stagger,
  override agent model/thinking e toggle di consegna best-effort.
- La validazione del form è inline con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
- Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il Webhook viene inviato senza header di autenticazione.
- Fallback deprecato: i job legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

## Comportamento della chat

- `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa in streaming tramite eventi `chat`.
- Il reinvio con la stessa `idempotencyKey` restituisce `{ status: "in_flight" }` mentre è in esecuzione e `{ status: "ok" }` dopo il completamento.
- Le risposte `chat.history` hanno dimensione limitata per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire i messaggi troppo grandi con un placeholder (`[chat.history omitted: message too large]`).
- `chat.history` rimuove anche i tag di direttiva inline solo visualizzazione dal testo visibile dell'assistente (ad esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), payload XML plain-text delle chiamate tool (incluse `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata tool troncati), e token di controllo del modello trapelati ASCII/full-width, e omette le voci dell'assistente il cui intero testo visibile è solo l'esatto token silenzioso `NO_REPLY` / `no_reply`.
- `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione dell'agente, nessuna consegna sul canale).
- I selettori model e thinking nell'header della chat fanno patch della sessione attiva immediatamente tramite `sessions.patch`; sono override di sessione persistenti, non opzioni di invio per un singolo turno.
- Stop:
  - Fai clic su **Stop** (chiama `chat.abort`)
  - Digita `/stop` (oppure frasi di abort standalone come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere out-of-band
  - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive per quella sessione
- Conservazione parziale dell'abort:
  - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nella UI
  - Il Gateway mantiene il testo parziale dell'assistente interrotto nella cronologia della trascrizione quando esiste output bufferizzato
  - Le voci persistite includono metadati di abort così i consumatori della trascrizione possono distinguere gli output parziali interrotti da quelli completati normalmente

## Embed ospitati

I messaggi dell'assistente possono renderizzare contenuti web ospitati inline con lo shortcode `[embed ...]`.
La policy sandbox dell'iframe è controllata da
`gateway.controlUi.embedSandbox`:

- `strict`: disabilita l'esecuzione di script all'interno degli embed ospitati
- `scripts`: consente embed interattivi mantenendo l'isolamento dell'origine; questo è
  il predefinito e di solito è sufficiente per giochi/widget browser autonomi
- `trusted`: aggiunge `allow-same-origin` oltre a `allow-scripts` per documenti dello stesso sito
  che hanno intenzionalmente bisogno di privilegi più forti

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

Usa `trusted` solo quando il documento incorporato ha davvero bisogno di un comportamento same-origin. Per la maggior parte dei giochi generati dagli agenti e delle canvas interattive, `scripts` è
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

Per impostazione predefinita, le richieste Control UI/WebSocket Serve possono autenticarsi tramite header di identità Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw
verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con
`tailscale whois` e confrontandolo con l'header, e accetta questi header solo quando la
richiesta raggiunge loopback con gli header `x-forwarded-*` di Tailscale. Imposta
`gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite a segreto condiviso
anche per il traffico Serve. Quindi usa `gateway.auth.mode: "token"` oppure
`"password"`.
Per quel percorso asincrono di identità Serve, i tentativi auth falliti per lo stesso IP client
e stesso scope auth vengono serializzati prima delle scritture del rate-limit. Retry concorrenti errati
dallo stesso browser possono quindi mostrare `retry later` sulla seconda richiesta
invece di due semplici mismatch che corrono in parallelo.
L'autenticazione Serve senza token presume che l'host del Gateway sia fidato. Se su quell'host può essere eseguito codice locale non fidato,
richiedi autenticazione con token/password.

### Bind su tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Poi apri:

- `http://<tailscale-ip>:18789/` (oppure il tuo `gateway.controlUi.basePath` configurato)

Incolla il segreto condiviso corrispondente nelle impostazioni della UI (inviato come
`connect.params.auth.token` oppure `connect.params.auth.password`).

## HTTP non sicuro

Se apri la dashboard su HTTP in chiaro (`http://<lan-ip>` oppure `http://<tailscale-ip>`),
il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita,
OpenClaw **blocca** le connessioni della UI Control senza identità del dispositivo.

Eccezioni documentate:

- compatibilità localhost-only con HTTP non sicuro tramite `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita dell'operatore alla UI Control tramite `gateway.auth.mode: "trusted-proxy"`
- impostazione di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri la UI in locale:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host Gateway)

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

- Consente alle sessioni della UI Control su localhost di procedere senza identità del dispositivo in
  contesti HTTP non sicuri.
- Non aggira i controlli di pairing.
- Non allenta i requisiti di identità del dispositivo remoti (non localhost).

**Solo emergenza:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della UI Control ed è un
grave downgrade di sicurezza. Ripristinalo rapidamente dopo l'uso in emergenza.

Nota trusted-proxy:

- un'autenticazione trusted-proxy riuscita può ammettere sessioni **operatore** della UI Control senza
  identità del dispositivo
- questo **non** si estende alle sessioni della UI Control con ruolo node
- i reverse proxy loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi
  [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth)

Vedi [Tailscale](/it/gateway/tailscale) per la guida alla configurazione HTTPS.

## Content Security Policy

La UI Control viene distribuita con una policy `img-src` rigorosa: sono consentiti solo asset **same-origin** e URL `data:`. Gli URL immagine remoti `http(s)` e relativi al protocollo vengono rifiutati dal browser e non emettono fetch di rete.

Cosa significa in pratica:

- Avatar e immagini serviti tramite percorsi relativi (ad esempio `/avatars/<id>`) continuano a essere visualizzati.
- Gli URL inline `data:image/...` continuano a essere visualizzati (utile per payload in-protocol).
- Gli URL remoti degli avatar emessi dai metadati del canale vengono rimossi dagli helper avatar della UI Control e sostituiti con il logo/badge integrato, così un canale compromesso o malevolo non può forzare fetch di immagini remote arbitrarie dal browser di un operatore.

Non devi cambiare nulla per ottenere questo comportamento — è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del Gateway è configurata, l'endpoint avatar della UI Control richiede lo stesso token del Gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati dell'avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (in linea con la route sibling assistant-media). Questo impedisce alla route avatar di esporre l'identità dell'agente su host altrimenti protetti.
- La UI Control stessa inoltra il token del Gateway come header bearer durante il recupero degli avatar, e usa blob URL autenticati così l'immagine continua a essere visualizzata nelle dashboard.

Se disabiliti l'autenticazione del Gateway (non consigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del Gateway.

## Build della UI

Il Gateway serve file statici da `dist/control-ui`. Costruiscili con:

```bash
pnpm ui:build
```

Base assoluta facoltativa (quando vuoi URL asset fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per sviluppo locale (dev server separato):

```bash
pnpm ui:dev
```

Poi punta la UI al tuo URL WS del Gateway (ad esempio `ws://127.0.0.1:18789`).

## Debug/testing: dev server + Gateway remoto

La UI Control è composta da file statici; la destinazione WebSocket è configurabile e può essere
diversa dall'origine HTTP. Questo è utile quando vuoi il dev server Vite in locale
ma il Gateway gira altrove.

1. Avvia il dev server della UI: `pnpm ui:dev`
2. Apri un URL come:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticazione one-time facoltativa (se necessaria):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Note:

- `gatewayUrl` viene memorizzato in localStorage dopo il caricamento e rimosso dall'URL.
- `token` dovrebbe essere passato tramite il fragment dell'URL (`#token=...`) quando possibile. I fragment non vengono inviati al server, evitando così perdite nei log delle richieste e nei Referer. I query param legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
- `password` viene mantenuta solo in memoria.
- Quando `gatewayUrl` è impostato, la UI non usa come fallback credenziali da configurazione o ambiente.
  Fornisci esplicitamente `token` (o `password`). La mancanza di credenziali esplicite è un errore.
- Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
- `gatewayUrl` viene accettato solo in una finestra top-level (non incorporata) per prevenire clickjacking.
- I deployment della UI Control non loopback devono impostare esplicitamente
  `gateway.controlUi.allowedOrigins` (origini complete). Questo include configurazioni di sviluppo remoto.
- Non usare `gateway.controlUi.allowedOrigins: ["*"]` se non per test locali strettamente controllati.
  Significa consentire qualsiasi origine browser, non “corrispondere a qualunque host io stia
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita
  la modalità fallback dell'origine tramite header Host, ma è una modalità di sicurezza pericolosa.

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

- [Dashboard](/it/web/dashboard) — dashboard del Gateway
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del Gateway

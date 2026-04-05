---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi accesso Tailnet senza tunnel SSH
summary: Interfaccia di controllo basata su browser per il Gateway (chat, nodi, configurazione)
title: Interfaccia di controllo
x-i18n:
    generated_at: "2026-04-05T14:08:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1568680a07907343352dbb3a2e6a1b896826404a7d8baba62512f03eac28e3d7
    source_path: web/control-ui.md
    workflow: 15
---

# Interfaccia di controllo (browser)

L'interfaccia di controllo è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (per esempio `/openclaw`)

Comunica **direttamente con il WebSocket del Gateway** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard mantiene un token per la sessione
della scheda corrente del browser e l'URL del gateway selezionato; le password non vengono persistite. L'onboarding di solito
genera un token gateway per l'autenticazione con segreto condiviso alla prima connessione, ma
funziona anche l'autenticazione con password quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti all'interfaccia di controllo da un nuovo browser o dispositivo, il Gateway
richiede una **approvazione di associazione una tantum** — anche se sei sulla stessa Tailnet
con `gateway.auth.allowTailscale: true`. Questa è una misura di sicurezza per impedire
accessi non autorizzati.

**Cosa vedrai:** "disconnected (1008): pairing required"

**Per approvare il dispositivo:**

```bash
# List pending requests
openclaw devices list

# Approve by request ID
openclaw devices approve <requestId>
```

Se il browser riprova l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave
pubblica), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno
che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi
[CLI Devices](/cli/devices) per rotazione e revoca del token.

**Note:**

- Le connessioni dirette locali del browser tramite loopback (`127.0.0.1` / `localhost`) vengono
  approvate automaticamente.
- Le connessioni browser tramite Tailnet e LAN richiedono comunque approvazione esplicita, anche quando
  provengono dalla stessa macchina.
- Ogni profilo del browser genera un ID dispositivo univoco, quindi cambiare browser o
  cancellare i dati del browser richiederà una nuova associazione.

## Supporto delle lingue

L'interfaccia di controllo può localizzarsi al primo caricamento in base alla lingua del browser e puoi modificarla in seguito dal selettore della lingua nella scheda Access.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nella memoria del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti usano l'inglese come fallback.

## Cosa può fare (oggi)

- Chat con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Streaming di chiamate agli strumenti + schede di output live degli strumenti nella Chat (eventi agente)
- Canali: stato dei canali integrati più canali plugin inclusi/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`)
- Istanze: elenco di presenza + aggiornamento (`system-presence`)
- Sessioni: elenco + override per sessione di modello/thinking/fast/verbose/reasoning (`sessions.list`, `sessions.patch`)
- Job cron: elenco/aggiunta/modifica/esecuzione/abilitazione/disabilitazione + cronologia esecuzioni (`cron.*`)
- Skills: stato, abilitazione/disabilitazione, installazione, aggiornamenti chiave API (`skills.*`)
- Nodi: elenco + limiti (`node.list`)
- Approvazioni exec: modifica delle allowlist del gateway o del nodo + criterio ask per `exec host=gateway/node` (`exec.approvals.*`)
- Configurazione: visualizzazione/modifica di `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configurazione: applica + riavvia con validazione (`config.apply`) e risveglia l'ultima sessione attiva
- Le scritture della configurazione includono una protezione base-hash per evitare di sovrascrivere modifiche concorrenti
- Le scritture della configurazione (`config.set`/`config.apply`/`config.patch`) eseguono anche un preflight della risoluzione attiva di SecretRef per i ref nel payload di configurazione inviato; i ref attivi non risolti nel payload inviato vengono rifiutati prima della scrittura
- Schema della configurazione + rendering del modulo (`config.schema` / `config.schema.lookup`,
  inclusi `title` / `description` del campo, hint UI corrispondenti, riepiloghi immediati dei figli,
  metadati della documentazione su nodi oggetto nidificato/jolly/array/composizione,
  più schemi di plugin + canale quando disponibili); l'editor JSON grezzo è
  disponibile solo quando lo snapshot ha un round-trip grezzo sicuro
- Se uno snapshot non può fare round-trip del testo grezzo in sicurezza, l'interfaccia di controllo forza la modalità Form e disabilita la modalità Raw per quello snapshot
- I valori oggetto Structured SecretRef vengono resi in sola lettura negli input di testo del modulo per evitare corruzione accidentale da oggetto a stringa
- Debug: snapshot di stato/salute/modelli + registro eventi + chiamate RPC manuali (`status`, `health`, `models.list`)
- Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`)
- Aggiornamento: esegui aggiornamento package/git + riavvio (`update.run`) con report di riavvio

Note del pannello job cron:

- Per job isolati, la consegna predefinita è l'annuncio del riepilogo. Puoi passare a none se desideri esecuzioni solo interne.
- I campi canale/destinazione compaiono quando è selezionato announce.
- La modalità webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
- Per i job della sessione principale, sono disponibili le modalità di consegna webhook e none.
- I controlli di modifica avanzati includono delete-after-run, azzeramento dell'override agente, opzioni cron exact/stagger,
  override di modello/thinking dell'agente e toggle di consegna best-effort.
- La validazione del modulo è inline con errori a livello di campo; valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
- Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il webhook viene inviato senza header di autenticazione.
- Fallback deprecato: i job legacy memorizzati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

## Comportamento della chat

- `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`.
- Reinviare con la stessa `idempotencyKey` restituisce `{ status: "in_flight" }` mentre è in esecuzione e `{ status: "ok" }` dopo il completamento.
- Le risposte di `chat.history` hanno una dimensione limitata per la sicurezza dell'interfaccia. Quando le voci della trascrizione sono troppo grandi, Gateway può troncare campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire messaggi troppo grandi con un segnaposto (`[chat.history omitted: message too large]`).
- `chat.history` rimuove anche i tag di direttiva inline solo per la visualizzazione dal testo visibile dell'assistente (per esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML di chiamata strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumenti troncati), e i token di controllo del modello ASCII/a larghezza piena trapelati, e omette le voci dell'assistente il cui intero testo visibile è solo l'esatto token silenzioso `NO_REPLY` / `no_reply`.
- `chat.inject` aggiunge una nota dell'assistente alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione dell'agente, nessuna consegna al canale).
- I selettori modello e thinking nell'intestazione della chat aggiornano immediatamente la sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio per un solo turno.
- Interrompi:
  - Fai clic su **Stop** (chiama `chat.abort`)
  - Digita `/stop` (o frasi di interruzione standalone come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda
  - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive di quella sessione
- Conservazione parziale dopo interruzione:
  - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nell'interfaccia
  - Gateway persiste il testo parziale interrotto dell'assistente nella cronologia della trascrizione quando esiste output bufferizzato
  - Le voci persistite includono metadati di interruzione così i consumer della trascrizione possono distinguere gli output parziali interrotti dal normale output completato

## Accesso Tailnet (consigliato)

### Tailscale Serve integrato (preferito)

Mantieni il Gateway su loopback e lascia che Tailscale Serve lo faccia da proxy con HTTPS:

```bash
openclaw gateway --tailscale serve
```

Apri:

- `https://<magicdns>/` (oppure il tuo `gateway.controlUi.basePath` configurato)

Per impostazione predefinita, le richieste Serve dell'interfaccia di controllo/WebSocket possono autenticarsi tramite header di identità Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw
verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con
`tailscale whois` e confrontandolo con l'header, e accetta questi header solo quando la
richiesta colpisce loopback con gli header `x-forwarded-*` di Tailscale. Imposta
`gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso
anche per il traffico Serve. Quindi usa `gateway.auth.mode: "token"` oppure
`"password"`.
Per questo percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client
e lo stesso ambito di autenticazione vengono serializzati prima delle scritture del rate limit. Di conseguenza,
retry concorrenti errati dallo stesso browser possono mostrare `retry later` alla seconda richiesta
invece di due semplici mismatch in gara in parallelo.
L'autenticazione Serve senza token presume che l'host del gateway sia attendibile. Se su quell'host può
essere eseguito codice locale non attendibile, richiedi autenticazione con token/password.

### Bind alla tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Quindi apri:

- `http://<tailscale-ip>:18789/` (oppure il tuo `gateway.controlUi.basePath` configurato)

Incolla il segreto condiviso corrispondente nelle impostazioni dell'interfaccia (inviato come
`connect.params.auth.token` oppure `connect.params.auth.password`).

## HTTP non sicuro

Se apri la dashboard tramite HTTP semplice (`http://<lan-ip>` o `http://<tailscale-ip>`),
il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita,
OpenClaw **blocca** le connessioni all'interfaccia di controllo senza identità del dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicuro solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita dell'operatore dell'interfaccia di controllo tramite `gateway.auth.mode: "trusted-proxy"`
- modalità break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri l'interfaccia localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host del gateway)

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

- Consente alle sessioni localhost dell'interfaccia di controllo di procedere senza identità del dispositivo in
  contesti HTTP non sicuri.
- Non bypassa i controlli di associazione.
- Non allenta i requisiti remoti (non localhost) di identità del dispositivo.

**Solo per break-glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo dell'interfaccia di controllo ed è un
grave peggioramento della sicurezza. Ripristinalo rapidamente dopo l'uso di emergenza.

Nota trusted-proxy:

- l'autenticazione trusted-proxy riuscita può ammettere sessioni **operatore** dell'interfaccia di controllo senza
  identità del dispositivo
- questo **non** si estende alle sessioni dell'interfaccia di controllo con ruolo nodo
- i reverse proxy loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi
  [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth)

Vedi [Tailscale](/it/gateway/tailscale) per la guida alla configurazione HTTPS.

## Compilazione dell'interfaccia

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

```bash
pnpm ui:build # auto-installs UI deps on first run
```

Base assoluta facoltativa (quando vuoi URL delle risorse fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server di sviluppo separato):

```bash
pnpm ui:dev # auto-installs UI deps on first run
```

Quindi punta l'interfaccia al tuo URL WS del Gateway (per esempio `ws://127.0.0.1:18789`).

## Debug/testing: server di sviluppo + Gateway remoto

L'interfaccia di controllo è composta da file statici; la destinazione WebSocket è configurabile e può essere
diversa dall'origine HTTP. Questo è utile quando vuoi il server di sviluppo Vite
in locale ma il Gateway è in esecuzione altrove.

1. Avvia il server di sviluppo dell'interfaccia: `pnpm ui:dev`
2. Apri un URL come:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticazione una tantum facoltativa (se necessaria):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Note:

- `gatewayUrl` viene memorizzato in localStorage dopo il caricamento e rimosso dall'URL.
- `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) ogni volta che possibile. I frammenti non vengono inviati al server, evitando così perdite nei log delle richieste e nel Referer. I parametri query legacy `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback e vengono rimossi immediatamente dopo il bootstrap.
- `password` viene mantenuta solo in memoria.
- Quando `gatewayUrl` è impostato, l'interfaccia non torna alla configurazione o alle credenziali dell'ambiente.
  Fornisci `token` (oppure `password`) esplicitamente. L'assenza di credenziali esplicite è un errore.
- Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
- `gatewayUrl` è accettato solo in una finestra di primo livello (non incorporata) per prevenire il clickjacking.
- Le distribuzioni dell'interfaccia di controllo non-loopback devono impostare esplicitamente `gateway.controlUi.allowedOrigins`
  (origini complete). Questo include configurazioni di sviluppo remoto.
- Non usare `gateway.controlUi.allowedOrigins: ["*"]` se non per test locali strettamente controllati.
  Significa consentire qualsiasi origine browser, non “corrispondere a qualsiasi host io stia
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la
  modalità di fallback dell'origine Host-header, ma è una modalità di sicurezza pericolosa.

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

- [Dashboard](/web/dashboard) — dashboard del gateway
- [WebChat](/web/webchat) — interfaccia di chat basata su browser
- [TUI](/web/tui) — interfaccia utente da terminale
- [Controlli di integrità](/it/gateway/health) — monitoraggio dell'integrità del gateway

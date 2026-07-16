---
read_when:
    - Modifica dell'autenticazione della dashboard o delle modalità di esposizione
summary: Accesso e autenticazione alla dashboard del Gateway (interfaccia di controllo)
title: Pannello di controllo
x-i18n:
    generated_at: "2026-07-16T15:03:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

La dashboard del Gateway è l'interfaccia di controllo nel browser servita per impostazione predefinita su `/` (sostituibile con `gateway.controlUi.basePath`).

Apertura rapida (Gateway locale):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))
- Con `gateway.tls.enabled: true`, usare `https://127.0.0.1:18789/` e `wss://127.0.0.1:18789` per l'endpoint WebSocket.

Riferimenti principali:

- [Interfaccia di controllo](/it/web/control-ui) per l'utilizzo e le funzionalità dell'interfaccia.
- [Tailscale](/it/gateway/tailscale) per l'automazione di Serve/Funnel.
- [Superfici web](/it/web) per le modalità di binding e le note sulla sicurezza.

L'autenticazione viene applicata durante l'handshake WebSocket tramite il percorso di autenticazione del Gateway configurato:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header di identità di Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Header di identità del proxy attendibile quando `gateway.auth.mode: "trusted-proxy"`

Vedere `gateway.auth` in [Configurazione del Gateway](/it/gateway/configuration).

<Warning>
L'interfaccia di controllo è una **superficie di amministrazione** (chat, configurazione, approvazioni delle esecuzioni). Non esporla pubblicamente. L'interfaccia conserva i token degli URL della dashboard in sessionStorage per la scheda corrente del browser e l'URL del Gateway selezionato, rimuovendoli dall'URL dopo il caricamento. Preferire localhost, Tailscale Serve o un tunnel SSH.
</Warning>

## Percorso rapido (consigliato)

- Dopo l'onboarding, la CLI apre automaticamente la dashboard e visualizza un link pulito (senza token).
- Per riaprirla in qualsiasi momento: `openclaw dashboard` (copia il link, apre un browser se possibile e visualizza un suggerimento SSH negli ambienti headless).
- Se non è possibile usare né gli appunti né il browser, `openclaw dashboard` visualizza comunque l'URL pulito e indica di aggiungere il token (da `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.token`) come chiave del frammento URL `token`; il valore del token non viene mai visualizzato nei log.
- Se l'interfaccia richiede l'autenticazione tramite segreto condiviso, incollare il token o la password configurati nelle impostazioni dell'interfaccia di controllo.

## Nozioni di base sull'autenticazione (locale e remota)

- **Localhost**: aprire `http://127.0.0.1:18789/`.
- **TLS del Gateway**: quando `gateway.tls.enabled: true`, i link alla dashboard e allo stato usano `https://`, mentre i link WebSocket dell'interfaccia di controllo usano `wss://`.
- **Origine del token segreto condiviso**: `gateway.auth.token` (oppure `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` può passarlo tramite il frammento URL per l'avvio iniziale una tantum; l'interfaccia di controllo lo conserva in sessionStorage per la scheda corrente e l'URL del Gateway selezionato, non in localStorage.
- Se `gateway.auth.token` è gestito tramite SecretRef, `openclaw dashboard` visualizza, copia e apre intenzionalmente un URL senza token, per evitare di esporre token gestiti esternamente nei log della shell, nella cronologia degli appunti o negli argomenti di avvio del browser. Se il riferimento non viene risolto nella shell corrente, viene comunque visualizzato l'URL senza token insieme a indicazioni pratiche per configurare l'autenticazione.
- **Password del segreto condiviso**: usare il valore `gateway.auth.password` configurato (oppure `OPENCLAW_GATEWAY_PASSWORD`). La dashboard non conserva le password tra un caricamento e l'altro.
- **Modalità con identità**: Tailscale Serve soddisfa l'autenticazione dell'interfaccia di controllo/WebSocket tramite header di identità quando `gateway.auth.allowTailscale: true`; un reverse proxy con supporto dell'identità e non associato al loopback soddisfa `gateway.auth.mode: "trusted-proxy"`. Nessuna delle due modalità richiede di incollare un segreto condiviso per il WebSocket.
- **Non localhost**: usare Tailscale Serve, un binding non loopback con segreto condiviso, un reverse proxy non loopback con supporto dell'identità e `gateway.auth.mode: "trusted-proxy"`, oppure un tunnel SSH. Le API HTTP usano comunque l'autenticazione tramite segreto condiviso, a meno che non venga eseguito intenzionalmente un ingresso privato `gateway.auth.mode: "none"` o un'autenticazione HTTP tramite proxy attendibile. Vedere [Superfici web](/it/web).

## Apertura in Telegram

I bot Telegram possono aprire la dashboard come Mini App di Telegram con `/dashboard`.

Requisiti:

- `gateway.tailscale.mode: "serve"` o `"funnel"`, affinché Telegram ottenga un URL HTTPS per la Mini App.
- Il mittente Telegram deve essere il proprietario del bot: un ID utente Telegram numerico in `commands.ownerAllowFrom` oppure il valore `channels.telegram.allowFrom` effettivo dell'account selezionato.
- Eseguire `/dashboard` in un messaggio diretto con il bot. Le invocazioni nei gruppi indicano soltanto di aprire il comando in un messaggio diretto e non includono un pulsante.
- Installazioni Docker: le modalità Serve/Funnel richiedono che il Gateway sia associato al loopback accanto a `tailscaled`, condizione che la rete bridge con porte pubblicate non può soddisfare. Eseguire il container del Gateway con `network_mode: host` e montare al suo interno il socket `tailscaled` dell'host (`/var/run/tailscale`) e la CLI `tailscale`.

La Mini App esegue un passaggio di proprietà una tantum e reindirizza all'interfaccia di controllo con un token di avvio iniziale di breve durata. Non espone nell'URL un token condiviso del Gateway.

Esclusioni per la versione 1:

- L'iframe Web di Telegram non è supportato.
- Tailscale Serve/Funnel è l'unico percorso supportato per l'URL pubblicato.

<a id="if-you-see-unauthorized-1008"></a>

## Se viene visualizzato "unauthorized" / 1008

- Verificare che il Gateway sia raggiungibile: in locale, `openclaw status`; da remoto, creare il tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, quindi aprire `http://127.0.0.1:18789/`.
- Per `AUTH_TOKEN_MISMATCH`, i client possono eseguire un unico nuovo tentativo attendibile con un token del dispositivo memorizzato nella cache quando il Gateway restituisce indicazioni per riprovare; tale tentativo riutilizza gli ambiti approvati memorizzati nella cache del token (i chiamanti espliciti `deviceToken`/`scopes` mantengono l'insieme di ambiti richiesto). Se l'autenticazione continua a non riuscire dopo tale tentativo, risolvere manualmente la divergenza del token.
- Per `AUTH_SCOPE_MISMATCH`, il token del dispositivo è stato riconosciuto, ma non include gli ambiti richiesti; eseguire nuovamente l'associazione o approvare il nuovo insieme di ambiti anziché ruotare il token condiviso del Gateway.
- Al di fuori di tale percorso di nuovo tentativo, l'ordine di precedenza per l'autenticazione della connessione è: token/password condivisi espliciti, quindi `deviceToken` esplicito, quindi token del dispositivo archiviato e infine token di avvio iniziale.
- Nel percorso asincrono di Tailscale Serve, i tentativi non riusciti per lo stesso `{scope, ip}` vengono serializzati prima che il limitatore delle autenticazioni non riuscite li registri, quindi un secondo tentativo errato simultaneo può già mostrare `retry later`.
- Per la procedura di correzione della divergenza del token, vedere [Elenco di controllo per il ripristino dalla divergenza del token](/it/cli/devices#token-drift-recovery-checklist).
- Recuperare o fornire il segreto condiviso dall'host del Gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: risolvere il valore `gateway.auth.password` o `OPENCLAW_GATEWAY_PASSWORD` configurato
  - Token gestito tramite SecretRef: risolvere il provider esterno dei segreti oppure esportare `OPENCLAW_GATEWAY_TOKEN` in questa shell ed eseguire nuovamente `openclaw dashboard`
  - Nessun segreto condiviso configurato: `openclaw doctor --generate-gateway-token`
- Nelle impostazioni della dashboard, incollare il token o la password nel campo di autenticazione, quindi connettersi.
- Il selettore della lingua dell'interfaccia si trova in **Settings -> General -> Language**, non in Appearance.

## Argomenti correlati

- [Interfaccia di controllo](/it/web/control-ui)
- [WebChat](/it/web/webchat)

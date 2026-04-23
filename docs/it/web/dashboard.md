---
read_when:
    - Modifica delle modalità di autenticazione o esposizione della dashboard
summary: Accesso e autenticazione della dashboard Gateway (Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-04-23T08:38:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (Control UI)

La dashboard del Gateway è la Control UI nel browser servita su `/` per impostazione predefinita
(override con `gateway.controlUi.basePath`).

Apertura rapida (Gateway locale):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Riferimenti principali:

- [Control UI](/it/web/control-ui) per utilizzo e capability della UI.
- [Tailscale](/it/gateway/tailscale) per l’automazione Serve/Funnel.
- [Web surfaces](/it/web) per modalità di bind e note di sicurezza.

L’autenticazione viene applicata durante l’handshake WebSocket tramite il percorso di autenticazione
configurato del Gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Header di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Vedi `gateway.auth` in [Gateway configuration](/it/gateway/configuration).

Nota di sicurezza: la Control UI è una **superficie admin** (chat, config, approvazioni exec).
Non esporla pubblicamente. La UI conserva i token URL della dashboard in sessionStorage
per la sessione corrente della scheda del browser e per l’URL Gateway selezionato, e li rimuove dall’URL dopo il caricamento.
Preferisci localhost, Tailscale Serve o un tunnel SSH.

## Percorso rapido (consigliato)

- Dopo l’onboarding, la CLI apre automaticamente la dashboard e stampa un link pulito (senza token).
- Riapri in qualsiasi momento: `openclaw dashboard` (copia il link, apre il browser se possibile, mostra un suggerimento SSH se headless).
- Se la UI richiede l’autenticazione con secret condiviso, incolla il token o la
  password configurati nelle impostazioni della Control UI.

## Fondamenti dell’autenticazione (locale vs remota)

- **Localhost**: apri `http://127.0.0.1:18789/`.
- **Sorgente del token con secret condiviso**: `gateway.auth.token` (oppure
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` può passarlo tramite fragment URL
  per un bootstrap una tantum, e la Control UI lo conserva in sessionStorage per la
  sessione corrente della scheda del browser e per l’URL Gateway selezionato invece che in localStorage.
- Se `gateway.auth.token` è gestito da SecretRef, `openclaw dashboard`
  stampa/copia/apre per progettazione un URL senza token. Questo evita di esporre
  token gestiti esternamente nei log della shell, nella cronologia degli appunti o negli argomenti di avvio del browser.
- Se `gateway.auth.token` è configurato come SecretRef ed è non risolto nella
  shell corrente, `openclaw dashboard` stampa comunque un URL senza token più
  indicazioni operative per configurare l’autenticazione.
- **Password con secret condiviso**: usa la `gateway.auth.password` configurata (oppure
  `OPENCLAW_GATEWAY_PASSWORD`). La dashboard non conserva le password tra i
  ricaricamenti.
- **Modalità con identità**: Tailscale Serve può soddisfare l’autenticazione Control UI/WebSocket
  tramite header di identità quando `gateway.auth.allowTailscale: true`, e un
  reverse proxy non-loopback consapevole dell’identità può soddisfare
  `gateway.auth.mode: "trusted-proxy"`. In queste modalità la dashboard non
  richiede un secret condiviso incollato per il WebSocket.
- **Non localhost**: usa Tailscale Serve, un bind non-loopback con secret condiviso, un
  reverse proxy non-loopback consapevole dell’identità con
  `gateway.auth.mode: "trusted-proxy"` oppure un tunnel SSH. Le API HTTP continuano a usare l’autenticazione con secret condiviso a meno che tu non esegua intenzionalmente
  `gateway.auth.mode: "none"` su ingress privato o autenticazione HTTP trusted-proxy. Vedi
  [Web surfaces](/it/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se vedi "unauthorized" / 1008

- Assicurati che il Gateway sia raggiungibile (locale: `openclaw status`; remoto: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`).
- Per `AUTH_TOKEN_MISMATCH`, i client possono eseguire un retry attendibile con un device token in cache quando il Gateway restituisce hint di retry. Quel retry con token in cache riusa gli scope approvati in cache del token; i chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono l’insieme di scope richiesto. Se l’autenticazione fallisce ancora dopo quel retry, risolvi manualmente il drift del token.
- Al di fuori di quel percorso di retry, la precedenza dell’autenticazione connect è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi device token memorizzato, poi bootstrap token.
- Nel percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limiter delle autenticazioni fallite li registri, quindi il secondo retry concorrente errato può già mostrare `retry later`.
- Per i passaggi di riparazione del drift del token, segui [Token drift recovery checklist](/it/cli/devices#token-drift-recovery-checklist).
- Recupera o fornisci il secret condiviso dall’host Gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: risolvi la `gateway.auth.password` configurata oppure
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gestito da SecretRef: risolvi il provider di secret esterno oppure esporta
    `OPENCLAW_GATEWAY_TOKEN` in questa shell, poi riesegui `openclaw dashboard`
  - Nessun secret condiviso configurato: `openclaw doctor --generate-gateway-token`
- Nelle impostazioni della dashboard, incolla il token o la password nel campo di autenticazione,
  poi connettiti.
- Il selettore della lingua della UI si trova in **Overview -> Gateway Access -> Language**.
  Fa parte della card di accesso, non della sezione Aspetto.

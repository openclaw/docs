---
read_when:
    - Modifica dell'autenticazione della dashboard o delle modalità di esposizione
summary: Accesso e autenticazione della dashboard del Gateway (Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-04-05T14:08:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 316e082ae4759f710b457487351e30c53b34c7c2b4bf84ad7b091a50538af5cc
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (Control UI)

La dashboard del Gateway è la Control UI nel browser servita su `/` per impostazione predefinita
(sovrascrivibile con `gateway.controlUi.basePath`).

Apertura rapida (Gateway locale):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Riferimenti principali:

- [Control UI](/web/control-ui) per l'utilizzo e le capacità dell'interfaccia.
- [Tailscale](/it/gateway/tailscale) per l'automazione Serve/Funnel.
- [Superfici web](/web) per le modalità di bind e le note sulla sicurezza.

L'autenticazione viene applicata durante l'handshake WebSocket tramite il percorso
auth del gateway configurato:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Header di identità del trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Vedi `gateway.auth` in [Configurazione del Gateway](/it/gateway/configuration).

Nota sulla sicurezza: la Control UI è una **superficie di amministrazione** (chat, config, approvazioni exec).
Non esporla pubblicamente. L'interfaccia conserva i token URL della dashboard in sessionStorage
per la sessione della scheda corrente del browser e per l'URL gateway selezionato, e li rimuove dall'URL dopo il caricamento.
Preferisci localhost, Tailscale Serve o un tunnel SSH.

## Percorso rapido (consigliato)

- Dopo l'onboarding, la CLI apre automaticamente la dashboard e stampa un link pulito (senza token).
- Riaprila in qualsiasi momento: `openclaw dashboard` (copia il link, apre il browser se possibile, mostra un suggerimento SSH se l'ambiente è headless).
- Se l'interfaccia richiede l'autenticazione tramite segreto condiviso, incolla il token o la
  password configurati nelle impostazioni della Control UI.

## Nozioni di base sull'auth (locale vs remoto)

- **Localhost**: apri `http://127.0.0.1:18789/`.
- **Origine del token con segreto condiviso**: `gateway.auth.token` (oppure
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` può passarlo tramite fragment URL
  per il bootstrap una tantum, e la Control UI lo conserva in sessionStorage per la
  sessione della scheda corrente del browser e l'URL gateway selezionato invece che in localStorage.
- Se `gateway.auth.token` è gestito da SecretRef, `openclaw dashboard`
  stampa/copia/apre intenzionalmente un URL senza token. Questo evita di esporre
  token gestiti esternamente nei log della shell, nella cronologia degli appunti o negli argomenti
  di avvio del browser.
- Se `gateway.auth.token` è configurato come SecretRef e non viene risolto nella tua
  shell corrente, `openclaw dashboard` stampa comunque un URL senza token più
  indicazioni pratiche per configurare l'auth.
- **Password con segreto condiviso**: usa la `gateway.auth.password` configurata (oppure
  `OPENCLAW_GATEWAY_PASSWORD`). La dashboard non conserva le password tra un ricaricamento e l'altro.
- **Modalità con identità incorporata**: Tailscale Serve può soddisfare l'auth
  della Control UI/WebSocket tramite header di identità quando `gateway.auth.allowTailscale: true`, e un
  reverse proxy non loopback consapevole dell'identità può soddisfare
  `gateway.auth.mode: "trusted-proxy"`. In queste modalità la dashboard non
  richiede l'incollaggio di un segreto condiviso per il WebSocket.
- **Non localhost**: usa Tailscale Serve, un bind non loopback con segreto condiviso, un
  reverse proxy non loopback consapevole dell'identità con
  `gateway.auth.mode: "trusted-proxy"` oppure un tunnel SSH. Le API HTTP usano comunque
  l'auth con segreto condiviso, a meno che tu non esegua intenzionalmente ingress privato con
  `gateway.auth.mode: "none"` o auth HTTP tramite trusted-proxy. Vedi
  [Superfici web](/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se vedi "unauthorized" / 1008

- Assicurati che il gateway sia raggiungibile (locale: `openclaw status`; remoto: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`).
- Per `AUTH_TOKEN_MISMATCH`, i client possono effettuare un tentativo affidabile di retry con un token dispositivo memorizzato nella cache quando il gateway restituisce suggerimenti per il retry. Quel retry con token memorizzato riusa gli scope approvati memorizzati del token; i chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono il set di scope richiesto. Se l'auth continua a fallire dopo quel retry, risolvi manualmente la divergenza del token.
- Al di fuori di quel percorso di retry, la precedenza dell'auth di connessione è: token/password condivisi espliciti per primi, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token bootstrap.
- Nel percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limiter degli auth falliti li registri, quindi
  il secondo retry errato concorrente può già mostrare `retry later`.
- Per i passaggi di ripristino della divergenza del token, segui la [Checklist di ripristino della divergenza del token](/cli/devices#token-drift-recovery-checklist).
- Recupera o fornisci il segreto condiviso dall'host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: risolvi la `gateway.auth.password` configurata oppure
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gestito da SecretRef: risolvi il provider di segreti esterno oppure esporta
    `OPENCLAW_GATEWAY_TOKEN` in questa shell, poi riesegui `openclaw dashboard`
  - Nessun segreto condiviso configurato: `openclaw doctor --generate-gateway-token`
- Nelle impostazioni della dashboard, incolla il token o la password nel campo auth,
  quindi connettiti.

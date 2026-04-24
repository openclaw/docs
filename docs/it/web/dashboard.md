---
read_when:
    - Modifica dell'autenticazione o delle modalità di esposizione della dashboard
summary: Accesso e auth della dashboard Gateway (Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-04-24T09:09:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

La dashboard del Gateway è la Control UI del browser servita su `/` per impostazione predefinita
(sovrascrivi con `gateway.controlUi.basePath`).

Apertura rapida (Gateway locale):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Riferimenti principali:

- [Control UI](/it/web/control-ui) per utilizzo e capacità della UI.
- [Tailscale](/it/gateway/tailscale) per automazione Serve/Funnel.
- [Superfici web](/it/web) per modalità di bind e note di sicurezza.

L'autenticazione viene applicata all'handshake WebSocket tramite il percorso auth
del gateway configurato:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Header di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Vedi `gateway.auth` in [Configurazione del Gateway](/it/gateway/configuration).

Nota di sicurezza: la Control UI è una **superficie di amministrazione** (chat, config, approvazioni exec).
Non esporla pubblicamente. La UI mantiene i token URL della dashboard in sessionStorage
per la sessione della scheda browser corrente e per l'URL gateway selezionato, e li rimuove dall'URL dopo il caricamento.
Preferisci localhost, Tailscale Serve o un tunnel SSH.

## Percorso rapido (consigliato)

- Dopo l'onboarding, la CLI apre automaticamente la dashboard e stampa un link pulito (senza token).
- Riaprila in qualsiasi momento: `openclaw dashboard` (copia il link, apre il browser se possibile, mostra un suggerimento SSH se headless).
- Se la UI richiede auth con segreto condiviso, incolla il token o la
  password configurati nelle impostazioni della Control UI.

## Fondamenti dell'auth (locale vs remoto)

- **Localhost**: apri `http://127.0.0.1:18789/`.
- **Sorgente token con segreto condiviso**: `gateway.auth.token` (oppure
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` può passarlo tramite fragment URL
  per bootstrap una tantum, e la Control UI lo mantiene in sessionStorage per la
  sessione della scheda browser corrente e per l'URL gateway selezionato invece che in localStorage.
- Se `gateway.auth.token` è gestito tramite SecretRef, `openclaw dashboard`
  stampa/copia/apre per progettazione un URL senza token. Questo evita di esporre
  token gestiti esternamente nei log della shell, nella cronologia degli appunti o negli
  argomenti di avvio del browser.
- Se `gateway.auth.token` è configurato come SecretRef e non è risolto nella tua
  shell corrente, `openclaw dashboard` stampa comunque un URL senza token più
  indicazioni operative per la configurazione dell'auth.
- **Password con segreto condiviso**: usa `gateway.auth.password` configurata (oppure
  `OPENCLAW_GATEWAY_PASSWORD`). La dashboard non persiste le password tra i
  ricaricamenti.
- **Modalità che portano identità**: Tailscale Serve può soddisfare l'auth della Control UI/WebSocket
  tramite header di identità quando `gateway.auth.allowTailscale: true`, e un
  reverse proxy non-loopback consapevole dell'identità può soddisfare
  `gateway.auth.mode: "trusted-proxy"`. In queste modalità la dashboard non
  richiede l'incollaggio di un segreto condiviso per il WebSocket.
- **Non localhost**: usa Tailscale Serve, un bind non-loopback con segreto condiviso, un
  reverse proxy non-loopback consapevole dell'identità con
  `gateway.auth.mode: "trusted-proxy"` oppure un tunnel SSH. Le API HTTP usano comunque
  auth con segreto condiviso a meno che tu non esegua intenzionalmente ingress privato con
  `gateway.auth.mode: "none"` o auth HTTP trusted-proxy. Vedi
  [Superfici web](/it/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se vedi "unauthorized" / 1008

- Assicurati che il gateway sia raggiungibile (locale: `openclaw status`; remoto: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`).
- Per `AUTH_TOKEN_MISMATCH`, i client possono fare un retry trusted una volta con un token dispositivo in cache quando il gateway restituisce suggerimenti di retry. Quel retry con token in cache riutilizza gli scope approvati in cache del token; i chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono il set di scope richiesto. Se l'auth fallisce ancora dopo quel retry, risolvi manualmente il drift del token.
- Al di fuori di quel percorso di retry, la precedenza dell'auth di connessione è token/password condivisi espliciti per primi, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi bootstrap token.
- Nel percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limiter degli errori auth li registri, quindi
  il secondo retry errato concorrente può già mostrare `retry later`.
- Per i passaggi di riparazione del drift del token, segui [Checklist di recupero del drift del token](/it/cli/devices#token-drift-recovery-checklist).
- Recupera o fornisci il segreto condiviso dall'host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: risolvi `gateway.auth.password` configurata oppure
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gestito da SecretRef: risolvi il provider di segreti esterno oppure esporta
    `OPENCLAW_GATEWAY_TOKEN` in questa shell, poi riesegui `openclaw dashboard`
  - Nessun segreto condiviso configurato: `openclaw doctor --generate-gateway-token`
- Nelle impostazioni della dashboard, incolla il token o la password nel campo auth,
  poi connettiti.
- Il selettore della lingua della UI si trova in **Overview -> Gateway Access -> Language**.
  Fa parte della scheda accesso, non della sezione Appearance.

## Correlati

- [Control UI](/it/web/control-ui)
- [WebChat](/it/web/webchat)

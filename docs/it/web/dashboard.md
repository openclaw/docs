---
read_when:
    - Modificare l'autenticazione del pannello di controllo o le modalità di esposizione
summary: Accesso e autenticazione alla dashboard del Gateway (Control UI)
title: Pannello di controllo
x-i18n:
    generated_at: "2026-05-05T01:51:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

La dashboard Gateway è la Control UI nel browser servita su `/` per impostazione predefinita
(sovrascrivibile con `gateway.controlUi.basePath`).

Apertura rapida (Gateway locale):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))
- Con `gateway.tls.enabled: true`, usa `https://127.0.0.1:18789/` e
  `wss://127.0.0.1:18789` per l'endpoint WebSocket.

Riferimenti principali:

- [Control UI](/it/web/control-ui) per utilizzo e funzionalità dell'interfaccia utente.
- [Tailscale](/it/gateway/tailscale) per l'automazione Serve/Funnel.
- [Superfici web](/it/web) per le modalità di bind e le note di sicurezza.

L'autenticazione viene applicata durante l'handshake WebSocket tramite il percorso
auth del gateway configurato:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Vedi `gateway.auth` in [configurazione del Gateway](/it/gateway/configuration).

Nota di sicurezza: la Control UI è una **superficie di amministrazione** (chat, configurazione, approvazioni exec).
Non esporla pubblicamente. L'interfaccia utente conserva i token URL della dashboard in sessionStorage
per la sessione corrente della scheda del browser e l'URL del gateway selezionato, e li rimuove dall'URL dopo il caricamento.
Preferisci localhost, Tailscale Serve o un tunnel SSH.

## Percorso rapido (consigliato)

- Dopo l'onboarding, la CLI apre automaticamente la dashboard e stampa un link pulito (senza token).
- Riapri in qualsiasi momento: `openclaw dashboard` (copia il link, apre il browser se possibile, mostra un suggerimento SSH se headless).
- Se la consegna tramite appunti e browser non riesce, `openclaw dashboard` stampa comunque
  l'URL pulito e ti indica di usare il token da `OPENCLAW_GATEWAY_TOKEN` o
  `gateway.auth.token` come chiave `token` nel frammento URL; non stampa i valori
  dei token nei log.
- Se l'interfaccia utente richiede l'autenticazione con segreto condiviso, incolla il token o
  la password configurati nelle impostazioni della Control UI.

## Basi dell'autenticazione (locale vs remoto)

- **Localhost**: apri `http://127.0.0.1:18789/`.
- **TLS del Gateway**: quando `gateway.tls.enabled: true`, i link di dashboard/stato usano
  `https://` e i link WebSocket della Control UI usano `wss://`.
- **Origine del token segreto condiviso**: `gateway.auth.token` (oppure
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` può passarlo tramite frammento URL
  per il bootstrap una tantum, e la Control UI lo conserva in sessionStorage per la
  sessione corrente della scheda del browser e l'URL del gateway selezionato invece che in localStorage.
- Se `gateway.auth.token` è gestito da SecretRef, `openclaw dashboard`
  stampa/copia/apre intenzionalmente un URL senza token. Questo evita di esporre
  token gestiti esternamente nei log della shell, nella cronologia degli appunti o negli
  argomenti di avvio del browser.
- Se `gateway.auth.token` è configurato come SecretRef e non è risolto nella tua
  shell corrente, `openclaw dashboard` stampa comunque un URL senza token più
  indicazioni operative per configurare l'autenticazione.
- **Password segreta condivisa**: usa `gateway.auth.password` configurata (oppure
  `OPENCLAW_GATEWAY_PASSWORD`). La dashboard non conserva le password tra i
  ricaricamenti.
- **Modalità con identità**: Tailscale Serve può soddisfare l'autenticazione
  Control UI/WebSocket tramite header di identità quando `gateway.auth.allowTailscale: true`, e un
  reverse proxy non-loopback consapevole dell'identità può soddisfare
  `gateway.auth.mode: "trusted-proxy"`. In queste modalità la dashboard non
  richiede un segreto condiviso incollato per il WebSocket.
- **Non localhost**: usa Tailscale Serve, un bind non-loopback con segreto condiviso, un
  reverse proxy non-loopback consapevole dell'identità con
  `gateway.auth.mode: "trusted-proxy"`, oppure un tunnel SSH. Le API HTTP usano comunque
  l'autenticazione con segreto condiviso, a meno che tu non esegua intenzionalmente
  `gateway.auth.mode: "none"` per ingresso privato o l'autenticazione HTTP trusted-proxy. Vedi
  [Superfici web](/it/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se vedi "unauthorized" / 1008

- Assicurati che il gateway sia raggiungibile (locale: `openclaw status`; remoto: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host`, poi apri `http://127.0.0.1:18789/`).
- Per `AUTH_TOKEN_MISMATCH`, i client possono effettuare un solo tentativo affidabile con un token dispositivo memorizzato nella cache quando il gateway restituisce suggerimenti di retry. Quel retry con token in cache riusa gli ambiti approvati memorizzati nella cache del token; i chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono l'insieme di ambiti richiesto. Se l'autenticazione continua a fallire dopo quel retry, risolvi manualmente la deriva del token.
- Al di fuori di quel percorso di retry, la precedenza dell'autenticazione di connessione è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token di bootstrap.
- Nel percorso asincrono Tailscale Serve Control UI, i tentativi non riusciti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limitatore di autenticazione fallita li registri, quindi
  il secondo retry errato concorrente può già mostrare `retry later`.
- Per i passaggi di riparazione della deriva del token, segui la [checklist di recupero dalla deriva del token](/it/cli/devices#token-drift-recovery-checklist).
- Recupera o fornisci il segreto condiviso dall'host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: risolvi `gateway.auth.password` configurata oppure
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gestito da SecretRef: risolvi il provider di segreti esterno oppure esporta
    `OPENCLAW_GATEWAY_TOKEN` in questa shell, poi esegui di nuovo `openclaw dashboard`
  - Nessun segreto condiviso configurato: `openclaw doctor --generate-gateway-token`
- Nelle impostazioni della dashboard, incolla il token o la password nel campo auth,
  poi connettiti.
- Il selettore della lingua dell'interfaccia utente si trova in **Overview -> Gateway Access -> Language**.
  Fa parte della scheda di accesso, non della sezione Appearance.

## Correlati

- [Control UI](/it/web/control-ui)
- [WebChat](/it/web/webchat)

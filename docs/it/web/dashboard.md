---
read_when:
    - Modificare l'autenticazione della dashboard o le modalità di esposizione
summary: Accesso e autenticazione alla dashboard Gateway (UI di controllo)
title: Pannello di controllo
x-i18n:
    generated_at: "2026-05-11T20:41:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
---

La dashboard del Gateway è l'UI di controllo nel browser servita su `/` per impostazione predefinita
(sovrascrivibile con `gateway.controlUi.basePath`).

Apertura rapida (Gateway locale):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))
- Con `gateway.tls.enabled: true`, usa `https://127.0.0.1:18789/` e
  `wss://127.0.0.1:18789` per l'endpoint WebSocket.

Riferimenti principali:

- [UI di controllo](/it/web/control-ui) per l'utilizzo e le funzionalità dell'UI.
- [Tailscale](/it/gateway/tailscale) per l'automazione Serve/Funnel.
- [Superfici web](/it/web) per le modalità di bind e le note di sicurezza.

L'autenticazione viene applicata durante l'handshake WebSocket tramite il percorso di autenticazione
del gateway configurato:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità del proxy attendibile quando `gateway.auth.mode: "trusted-proxy"`

Vedi `gateway.auth` in [configurazione del Gateway](/it/gateway/configuration).

Nota di sicurezza: l'UI di controllo è una **superficie amministrativa** (chat, configurazione, approvazioni exec).
Non esporla pubblicamente. L'UI conserva i token URL della dashboard in sessionStorage
per la sessione della scheda del browser corrente e l'URL del gateway selezionato, e li rimuove dall'URL dopo il caricamento.
Preferisci localhost, Tailscale Serve o un tunnel SSH.

## Percorso rapido (consigliato)

- Dopo l'onboarding, la CLI apre automaticamente la dashboard e stampa un link pulito (senza token).
- Riapri in qualsiasi momento: `openclaw dashboard` (copia il link, apre il browser se possibile, mostra un suggerimento SSH se headless).
- Se la consegna tramite appunti e browser fallisce, `openclaw dashboard` stampa comunque
  l'URL pulito e ti indica di usare il token da `OPENCLAW_GATEWAY_TOKEN` o
  `gateway.auth.token` come chiave `token` del frammento URL; non stampa i valori
  dei token nei log.
- Se l'UI richiede l'autenticazione con segreto condiviso, incolla il token o
  la password configurati nelle impostazioni dell'UI di controllo.

## Nozioni di base sull'autenticazione (locale vs remoto)

- **Localhost**: apri `http://127.0.0.1:18789/`.
- **TLS del Gateway**: quando `gateway.tls.enabled: true`, i link di dashboard/stato usano
  `https://` e i link WebSocket dell'UI di controllo usano `wss://`.
- **Origine del token con segreto condiviso**: `gateway.auth.token` (oppure
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` può passarlo tramite frammento URL
  per un bootstrap una tantum, e l'UI di controllo lo conserva in sessionStorage per la
  sessione della scheda del browser corrente e l'URL del gateway selezionato invece che in localStorage.
- Se `gateway.auth.token` è gestito da SecretRef, `openclaw dashboard`
  stampa/copia/apre intenzionalmente un URL senza token. Questo evita di esporre
  token gestiti esternamente nei log della shell, nella cronologia degli appunti o negli
  argomenti di avvio del browser.
- Se `gateway.auth.token` è configurato come SecretRef e non viene risolto nella tua
  shell corrente, `openclaw dashboard` stampa comunque un URL senza token più
  indicazioni operative per configurare l'autenticazione.
- **Password con segreto condiviso**: usa il `gateway.auth.password` configurato (oppure
  `OPENCLAW_GATEWAY_PASSWORD`). La dashboard non conserva le password tra i
  ricaricamenti.
- **Modalità con identità**: Tailscale Serve può soddisfare l'autenticazione di UI di controllo/WebSocket
  tramite header di identità quando `gateway.auth.allowTailscale: true`, e un
  reverse proxy non-loopback consapevole dell'identità può soddisfare
  `gateway.auth.mode: "trusted-proxy"`. In queste modalità la dashboard non
  richiede un segreto condiviso incollato per il WebSocket.
- **Non localhost**: usa Tailscale Serve, un bind non-loopback con segreto condiviso, un
  reverse proxy non-loopback consapevole dell'identità con
  `gateway.auth.mode: "trusted-proxy"`, oppure un tunnel SSH. Le API HTTP usano comunque
  l'autenticazione con segreto condiviso, a meno che tu non esegua intenzionalmente
  `gateway.auth.mode: "none"` con ingresso privato o l'autenticazione HTTP trusted-proxy. Vedi
  [Superfici web](/it/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se vedi "unauthorized" / 1008

- Assicurati che il gateway sia raggiungibile (locale: `openclaw status`; remoto: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host`, poi apri `http://127.0.0.1:18789/`).
- Per `AUTH_TOKEN_MISMATCH`, i client possono eseguire un nuovo tentativo attendibile con un token dispositivo memorizzato nella cache quando il gateway restituisce suggerimenti di retry. Quel retry con token memorizzato nella cache riusa gli scope approvati memorizzati nella cache del token; i chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono il set di scope richiesto. Se l'autenticazione fallisce ancora dopo quel retry, risolvi manualmente la deriva del token.
- Per `AUTH_SCOPE_MISMATCH`, il token dispositivo è stato riconosciuto ma non contiene gli scope richiesti dalla dashboard; esegui di nuovo il pairing o approva il contratto di scope richiesto invece di ruotare il token condiviso del gateway.
- Al di fuori di quel percorso di retry, la precedenza dell'autenticazione di connessione è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo salvato, poi token di bootstrap.
- Nel percorso asincrono dell'UI di controllo Tailscale Serve, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limitatore di autenticazione fallita li registri, quindi
  il secondo retry errato concorrente può già mostrare `retry later`.
- Per i passaggi di riparazione della deriva del token, segui [Checklist di recupero dalla deriva del token](/it/cli/devices#token-drift-recovery-checklist).
- Recupera o fornisci il segreto condiviso dall'host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: risolvi il `gateway.auth.password` configurato oppure
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gestito da SecretRef: risolvi il provider di segreti esterno oppure esporta
    `OPENCLAW_GATEWAY_TOKEN` in questa shell, quindi riesegui `openclaw dashboard`
  - Nessun segreto condiviso configurato: `openclaw doctor --generate-gateway-token`
- Nelle impostazioni della dashboard, incolla il token o la password nel campo di autenticazione,
  quindi connettiti.
- Il selettore della lingua dell'UI si trova in **Panoramica -> Accesso al Gateway -> Lingua**.
  Fa parte della scheda di accesso, non della sezione Aspetto.

## Correlati

- [UI di controllo](/it/web/control-ui)
- [WebChat](/it/web/webchat)

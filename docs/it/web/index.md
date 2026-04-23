---
read_when:
    - Vuoi accedere al Gateway tramite Tailscale
    - Vuoi la Control UI nel browser e la modifica della configurazione
summary: 'Superfici web del Gateway: Control UI, modalità di bind e sicurezza'
title: Web
x-i18n:
    generated_at: "2026-04-23T08:39:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Il Gateway serve una piccola **Control UI nel browser** (Vite + Lit) dalla stessa porta del WebSocket del Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (es. `/openclaw`)

Le capacità si trovano in [Control UI](/it/web/control-ui).
Questa pagina si concentra su modalità di bind, sicurezza e superfici esposte al web.

## Webhook

Quando `hooks.enabled=true`, il Gateway espone anche un piccolo endpoint webhook sullo stesso server HTTP.
Vedi [Configurazione del Gateway](/it/gateway/configuration) → `hooks` per autenticazione + payload.

## Configurazione (abilitata di default)

La Control UI è **abilitata per impostazione predefinita** quando gli asset sono presenti (`dist/control-ui`).
Puoi controllarla tramite configurazione:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Accesso Tailscale

### Serve integrato (consigliato)

Mantieni il Gateway su loopback e lascia che Tailscale Serve faccia da proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Poi avvia il gateway:

```bash
openclaw gateway
```

Apri:

- `https://<magicdns>/` (oppure il tuo `gateway.controlUi.basePath` configurato)

### Bind tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Poi avvia il gateway (questo esempio non loopback usa autenticazione
token a secret condiviso):

```bash
openclaw gateway
```

Apri:

- `http://<tailscale-ip>:18789/` (oppure il tuo `gateway.controlUi.basePath` configurato)

### Internet pubblico (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Note di sicurezza

- L'autenticazione del Gateway è richiesta per impostazione predefinita (token, password, trusted-proxy o header di identità Tailscale Serve quando abilitati).
- I bind non loopback **richiedono comunque** l'autenticazione del gateway. In pratica questo significa autenticazione token/password o un reverse proxy consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`.
- La procedura guidata crea per impostazione predefinita autenticazione a secret condiviso e di solito genera un
  token gateway (anche su loopback).
- In modalità secret condiviso, la UI invia `connect.params.auth.token` oppure
  `connect.params.auth.password`.
- Nelle modalità con identità come Tailscale Serve o `trusted-proxy`, il
  controllo di autenticazione WebSocket viene soddisfatto invece dagli header della richiesta.
- Per i deployment non loopback della Control UI, imposta esplicitamente `gateway.controlUi.allowedOrigins`
  (origin complete). Senza questo, l'avvio del gateway viene rifiutato per impostazione predefinita.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita
  la modalità di fallback origin da header Host, ma è un pericoloso downgrade della sicurezza.
- Con Serve, gli header di identità Tailscale possono soddisfare l'autenticazione di Control UI/WebSocket
  quando `gateway.auth.allowTailscale` è `true` (nessun token/password richiesto).
  Gli endpoint API HTTP non usano quegli header di identità Tailscale; seguono invece
  la normale modalità di autenticazione HTTP del gateway. Imposta
  `gateway.auth.allowTailscale: false` per richiedere credenziali esplicite. Vedi
  [Tailscale](/it/gateway/tailscale) e [Sicurezza](/it/gateway/security). Questo
  flusso senza token presuppone che l'host del gateway sia attendibile.
- `gateway.tailscale.mode: "funnel"` richiede `gateway.auth.mode: "password"` (password condivisa).

## Compilare la UI

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

```bash
pnpm ui:build
```

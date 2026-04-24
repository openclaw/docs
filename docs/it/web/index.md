---
read_when:
    - Vuoi accedere al Gateway tramite Tailscale
    - Vuoi la Control UI nel browser e la modifica della configurazione
summary: 'Superfici web del Gateway: Control UI, modalità di binding e sicurezza'
title: Web
x-i18n:
    generated_at: "2026-04-24T09:09:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Il Gateway serve una piccola **Control UI** nel browser (Vite + Lit) dalla stessa porta del WebSocket del Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad esempio `/openclaw`)

Le capability sono descritte in [Control UI](/it/web/control-ui).
Questa pagina si concentra su modalità di binding, sicurezza e superfici esposte sul web.

## Webhook

Quando `hooks.enabled=true`, il Gateway espone anche un piccolo endpoint Webhook sullo stesso server HTTP.
Vedi [Gateway configuration](/it/gateway/configuration) → `hooks` per auth + payload.

## Configurazione (abilitata per impostazione predefinita)

La Control UI è **abilitata per impostazione predefinita** quando gli asset sono presenti (`dist/control-ui`).
Puoi controllarla tramite configurazione:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath facoltativo
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

- `https://<magicdns>/` (o il `gateway.controlUi.basePath` che hai configurato)

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

Poi avvia il gateway (questo esempio non-loopback usa auth
a token con segreto condiviso):

```bash
openclaw gateway
```

Apri:

- `http://<tailscale-ip>:18789/` (o il `gateway.controlUi.basePath` che hai configurato)

### Internet pubblico (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // oppure OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Note di sicurezza

- L'auth del Gateway è richiesta per impostazione predefinita (token, password, trusted-proxy o header di identità Tailscale Serve quando abilitati).
- I bind non-loopback **richiedono comunque** auth del gateway. In pratica questo significa auth con token/password oppure un reverse proxy consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`.
- Il wizard crea auth con segreto condiviso per impostazione predefinita e di solito genera un
  token gateway (anche su loopback).
- In modalità segreto condiviso, la UI invia `connect.params.auth.token` oppure
  `connect.params.auth.password`.
- Nelle modalità che trasportano identità, come Tailscale Serve o `trusted-proxy`, il
  controllo auth del WebSocket viene invece soddisfatto dagli header della richiesta.
- Per deployment della Control UI non-loopback, imposta esplicitamente `gateway.controlUi.allowedOrigins`
  (origini complete). Senza questo valore, l'avvio del gateway viene rifiutato per impostazione predefinita.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la
  modalità fallback dell'origine basata su header Host, ma è un downgrade di sicurezza pericoloso.
- Con Serve, gli header di identità Tailscale possono soddisfare l'auth di Control UI/WebSocket
  quando `gateway.auth.allowTailscale` è `true` (nessun token/password richiesto).
  Gli endpoint HTTP API non usano quegli header di identità Tailscale; seguono invece
  la normale modalità auth HTTP del gateway. Imposta
  `gateway.auth.allowTailscale: false` per richiedere credenziali esplicite. Vedi
  [Tailscale](/it/gateway/tailscale) e [Security](/it/gateway/security). Questo
  flusso senza token presuppone che l'host gateway sia trusted.
- `gateway.tailscale.mode: "funnel"` richiede `gateway.auth.mode: "password"` (password condivisa).

## Build della UI

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

```bash
pnpm ui:build
```

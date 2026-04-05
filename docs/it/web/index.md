---
read_when:
    - Vuoi accedere al Gateway tramite Tailscale
    - Vuoi la Control UI nel browser e la modifica della configurazione
summary: 'Superfici web del Gateway: Control UI, modalità di bind e sicurezza'
title: Web
x-i18n:
    generated_at: "2026-04-05T14:08:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f5643283f7d37235d3d8104897f38db27ac5a9fdef6165156fb542d0e7048c
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Il Gateway espone una piccola **Control UI** nel browser (Vite + Lit) sulla stessa porta del WebSocket del Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Le funzionalità sono descritte in [Control UI](/web/control-ui).
Questa pagina si concentra su modalità di bind, sicurezza e superfici esposte sul web.

## Webhook

Quando `hooks.enabled=true`, il Gateway espone anche un piccolo endpoint webhook sullo stesso server HTTP.
Vedi [Configurazione del Gateway](/it/gateway/configuration) → `hooks` per autenticazione e payload.

## Configurazione (attiva per impostazione predefinita)

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

- `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

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

Poi avvia il gateway (questo esempio non-loopback usa l'autenticazione
con token a segreto condiviso):

```bash
openclaw gateway
```

Apri:

- `http://<tailscale-ip>:18789/` (o il tuo `gateway.controlUi.basePath` configurato)

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

## Note sulla sicurezza

- L'autenticazione del Gateway è richiesta per impostazione predefinita (token, password, trusted-proxy o header di identità Tailscale Serve quando abilitati).
- I bind non-loopback **richiedono comunque** l'autenticazione del gateway. In pratica questo significa autenticazione con token/password oppure un reverse proxy consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`.
- La procedura guidata crea per impostazione predefinita l'autenticazione a segreto condiviso e di solito genera un
  token gateway (anche su loopback).
- In modalità segreto condiviso, l'interfaccia invia `connect.params.auth.token` o
  `connect.params.auth.password`.
- Nelle modalità con identità, come Tailscale Serve o `trusted-proxy`, il
  controllo di autenticazione WebSocket viene invece soddisfatto dagli header della richiesta.
- Per i deployment della Control UI non-loopback, imposta esplicitamente `gateway.controlUi.allowedOrigins`
  (origini complete). Senza questo valore, l'avvio del gateway viene rifiutato per impostazione predefinita.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita
  la modalità di fallback dell'origine basata sull'header Host, ma rappresenta un pericoloso downgrade della sicurezza.
- Con Serve, gli header di identità Tailscale possono soddisfare l'autenticazione della Control UI/WebSocket
  quando `gateway.auth.allowTailscale` è `true` (nessun token/password richiesto).
  Gli endpoint HTTP API non usano questi header di identità Tailscale; seguono invece
  la normale modalità di autenticazione HTTP del gateway. Imposta
  `gateway.auth.allowTailscale: false` per richiedere credenziali esplicite. Vedi
  [Tailscale](/it/gateway/tailscale) e [Sicurezza](/it/gateway/security). Questo
  flusso senza token presuppone che l'host del gateway sia affidabile.
- `gateway.tailscale.mode: "funnel"` richiede `gateway.auth.mode: "password"` (password condivisa).

## Build dell'interfaccia

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

```bash
pnpm ui:build # installa automaticamente le dipendenze UI alla prima esecuzione
```

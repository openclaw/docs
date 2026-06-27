---
read_when:
    - Vuoi accedere al Gateway tramite Tailscale
    - Vuoi la Control UI nel browser e la modifica della configurazione
summary: 'Superfici web del Gateway: Control UI, modalità di bind e sicurezza'
title: Web
x-i18n:
    generated_at: "2026-06-27T18:25:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Il Gateway serve una piccola **UI di controllo nel browser** (Vite + Lit) dalla stessa porta del WebSocket del Gateway:

- predefinito: `http://<host>:18789/`
- con `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Le funzionalità sono descritte in [UI di controllo](/it/web/control-ui). Il resto di questa pagina si concentra su modalità di binding, sicurezza e superfici esposte al web.

## Webhook

Quando `hooks.enabled=true`, il Gateway espone anche un piccolo endpoint webhook sullo stesso server HTTP.
Vedi [Configurazione del Gateway](/it/gateway/configuration) → `hooks` per autenticazione + payload.

## RPC HTTP di amministrazione

RPC HTTP di amministrazione espone metodi selezionati del piano di controllo del Gateway in `POST /api/v1/admin/rpc`.
È disattivato per impostazione predefinita e viene registrato solo quando il plugin `admin-http-rpc` è abilitato.
Vedi [RPC HTTP di amministrazione](/it/plugins/admin-http-rpc) per il modello di autenticazione, i metodi consentiti e il confronto con WebSocket.

## Configurazione (attiva per impostazione predefinita)

La UI di controllo è **abilitata per impostazione predefinita** quando gli asset sono presenti (`dist/control-ui`).
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

Mantieni il Gateway su loopback e lascia che Tailscale Serve lo proxizzi:

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

### Binding Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Poi avvia il gateway (questo esempio non-loopback usa l'autenticazione con token
a segreto condiviso):

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
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Note sulla sicurezza

- L'autenticazione del Gateway è richiesta per impostazione predefinita (token, password, trusted-proxy o intestazioni di identità di Tailscale Serve quando abilitate).
- I binding non-loopback **richiedono** comunque l'autenticazione del gateway. In pratica questo significa autenticazione tramite token/password o un reverse proxy consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`.
- La procedura guidata crea l'autenticazione a segreto condiviso per impostazione predefinita e di solito genera un
  token del gateway (anche su loopback).
- In modalità a segreto condiviso, la UI invia `connect.params.auth.token` o
  `connect.params.auth.password`.
- Quando `gateway.tls.enabled: true`, la dashboard locale e gli helper di stato mostrano
  URL della dashboard `https://` e URL WebSocket `wss://`.
- Nelle modalità con identità, come Tailscale Serve o `trusted-proxy`, il
  controllo di autenticazione WebSocket viene invece soddisfatto dalle intestazioni della richiesta.
- Per distribuzioni pubbliche non-loopback della UI di controllo, imposta `gateway.controlUi.allowedOrigins`
  esplicitamente (origini complete). I caricamenti LAN/Tailnet privati same-origin sono accettati per loopback,
  RFC1918/link-local, `.local`, `.ts.net` e host CGNAT Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita
  la modalità di fallback dell'origine basata sull'intestazione Host, ma è un pericoloso downgrade di sicurezza.
- Con Serve, le intestazioni di identità Tailscale possono soddisfare l'autenticazione della UI di controllo/WebSocket
  quando `gateway.auth.allowTailscale` è `true` (nessun token/password richiesto).
  Gli endpoint API HTTP non usano quelle intestazioni di identità Tailscale; seguono invece
  la normale modalità di autenticazione HTTP del gateway. Imposta
  `gateway.auth.allowTailscale: false` per richiedere credenziali esplicite. Vedi
  [Tailscale](/it/gateway/tailscale) e [Sicurezza](/it/gateway/security). Questo
  flusso senza token presuppone che l'host del gateway sia attendibile.
- `gateway.tailscale.mode: "funnel"` richiede `gateway.auth.mode: "password"` (password condivisa).

## Creazione della UI

Il Gateway serve file statici da `dist/control-ui`. Creali con:

```bash
pnpm ui:build
```

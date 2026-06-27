---
read_when:
    - Je wilt de Gateway via Tailscale benaderen
    - U wilt de browser-Control UI en configuratiebewerking
summary: 'Gateway-weboppervlakken: Control UI, bind-modi en beveiliging'
title: Web
x-i18n:
    generated_at: "2026-06-27T18:32:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

De Gateway serveert een kleine **browser-Control UI** (Vite + Lit) vanaf dezelfde poort als de Gateway-WebSocket:

- standaard: `http://<host>:18789/`
- met `gateway.tls.enabled: true`: `https://<host>:18789/`
- optioneel prefix: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Mogelijkheden staan in [Control UI](/nl/web/control-ui). De rest van deze pagina richt zich op bind-modi, beveiliging en webgerichte oppervlakken.

## Webhooks

Wanneer `hooks.enabled=true`, exposeert de Gateway ook een klein Webhook-eindpunt op dezelfde HTTP-server.
Zie [Gateway-configuratie](/nl/gateway/configuration) → `hooks` voor auth + payloads.

## Admin HTTP RPC

Admin HTTP RPC exposeert geselecteerde Gateway-control-plane-methoden op `POST /api/v1/admin/rpc`.
Het staat standaard uit en wordt alleen geregistreerd wanneer de `admin-http-rpc` Plugin is ingeschakeld.
Zie [Admin HTTP RPC](/nl/plugins/admin-http-rpc) voor het auth-model, toegestane methoden en de WebSocket-vergelijking.

## Configuratie (standaard aan)

De Control UI is **standaard ingeschakeld** wanneer assets aanwezig zijn (`dist/control-ui`).
Je kunt dit beheren via configuratie:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale-toegang

### Geintegreerde Serve (aanbevolen)

Houd de Gateway op local loopback en laat Tailscale Serve deze proxyen:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Start daarna de gateway:

```bash
openclaw gateway
```

Open:

- `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

### Tailnet-bind + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Start daarna de gateway (dit non-loopback-voorbeeld gebruikt shared-secret-tokenauth):

```bash
openclaw gateway
```

Open:

- `http://<tailscale-ip>:18789/` (of je geconfigureerde `gateway.controlUi.basePath`)

### Openbaar internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Beveiligingsopmerkingen

- Gateway-auth is standaard vereist (token, wachtwoord, trusted-proxy, of Tailscale Serve-identiteitsheaders wanneer ingeschakeld).
- Non-loopback-binds **vereisen** nog steeds gateway-auth. In de praktijk betekent dit token-/wachtwoordauth of een identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`.
- De wizard maakt standaard shared-secret-auth aan en genereert meestal een
  gateway-token (zelfs op loopback).
- In shared-secret-modus stuurt de UI `connect.params.auth.token` of
  `connect.params.auth.password`.
- Wanneer `gateway.tls.enabled: true`, renderen lokale dashboard- en statushelpers
  `https://`-dashboard-URL's en `wss://`-WebSocket-URL's.
- In modi met identiteit, zoals Tailscale Serve of `trusted-proxy`, wordt de
  WebSocket-authcontrole in plaats daarvan voldaan via requestheaders.
- Voor openbare non-loopback-Control UI-implementaties stel je `gateway.controlUi.allowedOrigins`
  expliciet in (volledige origins). Private same-origin LAN-/Tailnet-loads worden geaccepteerd voor loopback,
  RFC1918/link-local, `.local`, `.ts.net` en Tailscale-CGNAT-hosts.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt
  Host-header-origin-fallbackmodus in, maar is een gevaarlijke beveiligingsverlaging.
- Met Serve kunnen Tailscale-identiteitsheaders voldoen aan Control UI-/WebSocket-auth
  wanneer `gateway.auth.allowTailscale` `true` is (geen token/wachtwoord vereist).
  HTTP API-eindpunten gebruiken die Tailscale-identiteitsheaders niet; ze volgen
  in plaats daarvan de normale HTTP-authmodus van de gateway. Stel
  `gateway.auth.allowTailscale: false` in om expliciete inloggegevens te vereisen. Zie
  [Tailscale](/nl/gateway/tailscale) en [Beveiliging](/nl/gateway/security). Deze
  tokenloze flow gaat ervan uit dat de gateway-host vertrouwd is.
- `gateway.tailscale.mode: "funnel"` vereist `gateway.auth.mode: "password"` (gedeeld wachtwoord).

## De UI bouwen

De Gateway serveert statische bestanden vanuit `dist/control-ui`. Bouw ze met:

```bash
pnpm ui:build
```

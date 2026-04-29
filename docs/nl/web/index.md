---
read_when:
    - Je wilt de Gateway via Tailscale benaderen
    - Je wilt de bedienings-UI in de browser en configuratiebewerking
summary: 'Gateway-webinterfaces: bedienings-UI, bindmodi en beveiliging'
title: Web
x-i18n:
    generated_at: "2026-04-29T23:28:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

De Gateway serveert een kleine **browser-Control UI** (Vite + Lit) vanaf dezelfde poort als de Gateway WebSocket:

- standaard: `http://<host>:18789/`
- met `gateway.tls.enabled: true`: `https://<host>:18789/`
- optioneel voorvoegsel: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Mogelijkheden staan in [Control UI](/nl/web/control-ui). De rest van deze pagina richt zich op bind-modi, beveiliging en webgerichte oppervlakken.

## Webhooks

Wanneer `hooks.enabled=true`, stelt de Gateway ook een klein webhook-eindpunt beschikbaar op dezelfde HTTP-server.
Zie [Gateway-configuratie](/nl/gateway/configuration) → `hooks` voor authenticatie + payloads.

## Configuratie (standaard aan)

De Control UI is **standaard ingeschakeld** wanneer assets aanwezig zijn (`dist/control-ui`).
Je kunt dit via configuratie beheren:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale-toegang

### Geïntegreerde Serve (aanbevolen)

Houd de Gateway op loopback en laat Tailscale Serve deze proxyen:

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

Start daarna de gateway (dit niet-loopbackvoorbeeld gebruikt shared-secret-tokenauthenticatie):

```bash
openclaw gateway
```

Open:

- `http://<tailscale-ip>:18789/` (of je geconfigureerde `gateway.controlUi.basePath`)

### Publiek internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Beveiligingsnotities

- Gateway-authenticatie is standaard vereist (token, wachtwoord, trusted-proxy of Tailscale Serve-identiteitsheaders wanneer ingeschakeld).
- Niet-loopbackbinds **vereisen** nog steeds gateway-authenticatie. In de praktijk betekent dat token-/wachtwoordauthenticatie of een identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`.
- De wizard maakt standaard shared-secret-authenticatie aan en genereert meestal een gateway-token (zelfs op loopback).
- In shared-secret-modus verstuurt de UI `connect.params.auth.token` of `connect.params.auth.password`.
- Wanneer `gateway.tls.enabled: true`, renderen lokale dashboard- en statushelpers `https://`-dashboard-URL's en `wss://`-WebSocket-URL's.
- In identiteitsdragende modi zoals Tailscale Serve of `trusted-proxy` wordt de WebSocket-authenticatiecontrole in plaats daarvan voldaan via requestheaders.
- Stel voor niet-loopback Control UI-implementaties `gateway.controlUi.allowedOrigins` expliciet in (volledige origins). Zonder deze instelling wordt het starten van de gateway standaard geweigerd.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt de Host-header-originfallbackmodus in, maar is een gevaarlijke beveiligingsverlaging.
- Met Serve kunnen Tailscale-identiteitsheaders voldoen aan Control UI-/WebSocket-authenticatie wanneer `gateway.auth.allowTailscale` `true` is (geen token/wachtwoord vereist). HTTP API-eindpunten gebruiken die Tailscale-identiteitsheaders niet; ze volgen in plaats daarvan de normale HTTP-authenticatiemodus van de gateway. Stel `gateway.auth.allowTailscale: false` in om expliciete aanmeldgegevens te vereisen. Zie [Tailscale](/nl/gateway/tailscale) en [Beveiliging](/nl/gateway/security). Deze tokenloze stroom gaat ervan uit dat de gateway-host vertrouwd is.
- `gateway.tailscale.mode: "funnel"` vereist `gateway.auth.mode: "password"` (gedeeld wachtwoord).

## De UI bouwen

De Gateway serveert statische bestanden vanuit `dist/control-ui`. Bouw ze met:

```bash
pnpm ui:build
```

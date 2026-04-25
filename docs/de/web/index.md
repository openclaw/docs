---
read_when:
    - Sie möchten über Tailscale auf das Gateway zugreifen.
    - Sie möchten das browserbasierte Control UI und die Konfigurationsbearbeitung.
summary: 'Web-Oberflächen des Gateway: Control UI, Bind-Modi und Sicherheit'
title: Web
x-i18n:
    generated_at: "2026-04-25T13:59:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Das Gateway stellt ein kleines **browserbasiertes Control UI** (Vite + Lit) über denselben Port bereit wie das Gateway-WebSocket:

- Standard: `http://<host>:18789/`
- mit `gateway.tls.enabled: true`: `https://<host>:18789/`
- optionales Präfix: setzen Sie `gateway.controlUi.basePath` (z. B. `/openclaw`)

Die Funktionen sind unter [Control UI](/de/web/control-ui) beschrieben.
Diese Seite konzentriert sich auf Bind-Modi, Sicherheit und webseitige Oberflächen.

## Webhooks

Wenn `hooks.enabled=true`, stellt das Gateway außerdem einen kleinen Webhook-Endpunkt auf demselben HTTP-Server bereit.
Siehe [Gateway configuration](/de/gateway/configuration) → `hooks` für Auth + Payloads.

## Konfiguration (standardmäßig aktiviert)

Das Control UI ist **standardmäßig aktiviert**, wenn Assets vorhanden sind (`dist/control-ui`).
Sie können es über die Konfiguration steuern:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Zugriff über Tailscale

### Integriertes Serve (empfohlen)

Lassen Sie das Gateway auf local loopback und lassen Sie Tailscale Serve als Proxy fungieren:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Starten Sie dann das Gateway:

```bash
openclaw gateway
```

Öffnen Sie:

- `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

### Tailnet-Bind + Token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Starten Sie dann das Gateway (dieses Nicht-loopback-Beispiel verwendet Authentifizierung
mit gemeinsamem Secret-Token):

```bash
openclaw gateway
```

Öffnen Sie:

- `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

### Öffentliches Internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // oder OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Sicherheitshinweise

- Gateway-Auth ist standardmäßig erforderlich (Token, Passwort, Trusted-Proxy oder Tailscale-Serve-Identity-Header, wenn aktiviert).
- Nicht-loopback-Binds **erfordern weiterhin** Gateway-Auth. In der Praxis bedeutet das Token-/Passwort-Auth oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Der Assistent erstellt standardmäßig Auth mit gemeinsamem Secret und generiert normalerweise ein
  Gateway-Token (auch auf loopback).
- Im Modus mit gemeinsamem Secret sendet die UI `connect.params.auth.token` oder
  `connect.params.auth.password`.
- Wenn `gateway.tls.enabled: true`, rendern lokale Dashboard- und Status-Helfer
  Dashboard-URLs mit `https://` und WebSocket-URLs mit `wss://`.
- In Modi mit Identitätsträgern wie Tailscale Serve oder `trusted-proxy` wird die
  WebSocket-Auth-Prüfung stattdessen über Request-Header erfüllt.
- Für Nicht-loopback-Bereitstellungen des Control UI setzen Sie `gateway.controlUi.allowedOrigins`
  explizit (vollständige Origins). Ohne dies wird der Gateway-Start standardmäßig verweigert.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert
  den Host-Header-Origin-Fallback-Modus, ist jedoch eine gefährliche Sicherheitsabsenkung.
- Mit Serve können Tailscale-Identity-Header die Authentifizierung für Control UI/WebSocket erfüllen,
  wenn `gateway.auth.allowTailscale` auf `true` steht (kein Token/Passwort erforderlich).
  HTTP-API-Endpunkte verwenden diese Tailscale-Identity-Header nicht; sie folgen
  stattdessen dem normalen HTTP-Auth-Modus des Gateways. Setzen Sie
  `gateway.auth.allowTailscale: false`, um explizite Anmeldedaten zu erzwingen. Siehe
  [Tailscale](/de/gateway/tailscale) und [Security](/de/gateway/security). Dieser
  tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird.
- `gateway.tailscale.mode: "funnel"` erfordert `gateway.auth.mode: "password"` (gemeinsam genutztes Passwort).

## UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```

---
read_when:
    - Sie möchten über Tailscale auf das Gateway zugreifen
    - Sie möchten die browserbasierte Control UI und Konfigurationsbearbeitung ఉపయోగzen
summary: 'Web-Oberflächen des Gateway: Control UI, Bind-Modi und Sicherheit'
title: Web
x-i18n:
    generated_at: "2026-04-23T06:37:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Das Gateway stellt eine kleine **browserbasierte Control UI** (Vite + Lit) über denselben Port wie das Gateway-WebSocket bereit:

- Standard: `http://<host>:18789/`
- optionales Präfix: Setzen Sie `gateway.controlUi.basePath` (z. B. `/openclaw`)

Capabilities befinden sich in [Control UI](/de/web/control-ui).
Diese Seite konzentriert sich auf Bind-Modi, Sicherheit und webbasierten Oberflächen.

## Webhooks

Wenn `hooks.enabled=true`, stellt das Gateway auf demselben HTTP-Server auch einen kleinen Webhook-Endpunkt bereit.
Siehe [Gateway-Konfiguration](/de/gateway/configuration) → `hooks` für Authentifizierung + Payloads.

## Konfiguration (standardmäßig aktiviert)

Die Control UI ist **standardmäßig aktiviert**, wenn Assets vorhanden sind (`dist/control-ui`).
Sie können sie über die Konfiguration steuern:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Zugriff über Tailscale

### Integriertes Serve (empfohlen)

Behalten Sie das Gateway auf loopback und lassen Sie Tailscale Serve es per Proxy bereitstellen:

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

- `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

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

Starten Sie dann das Gateway (dieses Nicht-loopback-Beispiel verwendet Authentifizierung mit gemeinsam verwendetem Secret-Token):

```bash
openclaw gateway
```

Öffnen Sie:

- `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

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

- Gateway-Authentifizierung ist standardmäßig erforderlich (Token, Passwort, trusted-proxy oder Tailscale-Serve-Identitätsheader, wenn aktiviert).
- Nicht-loopback-Bindings **erfordern** weiterhin Gateway-Authentifizierung. In der Praxis bedeutet das Token-/Passwort-Authentifizierung oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Der Assistent erstellt standardmäßig Authentifizierung mit gemeinsam verwendetem Secret und generiert normalerweise ein Gateway-Token (auch auf loopback).
- Im Modus mit gemeinsam verwendetem Secret sendet die UI `connect.params.auth.token` oder `connect.params.auth.password`.
- In identitätstragenden Modi wie Tailscale Serve oder `trusted-proxy` wird die WebSocket-Authentifizierungsprüfung stattdessen durch Request-Header erfüllt.
- Für nicht-loopback-Control-UI-Bereitstellungen setzen Sie `gateway.controlUi.allowedOrigins` explizit (vollständige Origins). Ohne dies wird der Gateway-Start standardmäßig verweigert.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den Host-Header-Origin-Fallback-Modus, ist aber eine gefährliche Sicherheitsabschwächung.
- Mit Serve können Tailscale-Identitätsheader die Authentifizierung für Control UI/WebSocket erfüllen, wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist (kein Token/Passwort erforderlich).
  HTTP-API-Endpunkte verwenden diese Tailscale-Identitätsheader nicht; sie folgen stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateway. Setzen Sie
  `gateway.auth.allowTailscale: false`, um explizite Anmeldedaten zu verlangen. Siehe
  [Tailscale](/de/gateway/tailscale) und [Sicherheit](/de/gateway/security). Dieser
  tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird.
- `gateway.tailscale.mode: "funnel"` erfordert `gateway.auth.mode: "password"` (gemeinsam verwendetes Passwort).

## Die UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```

---
read_when:
    - Sie möchten über Tailscale auf den Gateway zugreifen
    - Sie möchten die browserbasierte Control UI und Konfigurationsbearbeitung
summary: 'Gateway-Weboberflächen: Control UI, Bind-Modi und Sicherheit'
title: Web
x-i18n:
    generated_at: "2026-06-27T18:24:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

The Gateway stellt eine kleine **browserbasierte Control UI** (Vite + Lit) über denselben Port wie der Gateway WebSocket bereit:

- Standard: `http://<host>:18789/`
- mit `gateway.tls.enabled: true`: `https://<host>:18789/`
- optionales Präfix: Legen Sie `gateway.controlUi.basePath` fest (z. B. `/openclaw`)

Die Funktionen sind unter [Control UI](/de/web/control-ui) beschrieben. Der Rest dieser Seite konzentriert sich auf Bind-Modi, Sicherheit und webseitige Oberflächen.

## Webhooks

Wenn `hooks.enabled=true` ist, stellt der Gateway außerdem einen kleinen Webhook-Endpunkt auf demselben HTTP-Server bereit.
Siehe [Gateway-Konfiguration](/de/gateway/configuration) → `hooks` für Authentifizierung und Payloads.

## Admin HTTP RPC

Admin HTTP RPC stellt ausgewählte Gateway-Control-Plane-Methoden unter `POST /api/v1/admin/rpc` bereit.
Es ist standardmäßig deaktiviert und wird nur registriert, wenn das Plugin `admin-http-rpc` aktiviert ist.
Siehe [Admin HTTP RPC](/de/plugins/admin-http-rpc) für das Authentifizierungsmodell, erlaubte Methoden und den WebSocket-Vergleich.

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

## Tailscale-Zugriff

### Integriertes Serve (empfohlen)

Belassen Sie den Gateway auf loopback und lassen Sie Tailscale Serve ihn proxien:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Starten Sie anschließend den Gateway:

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

Starten Sie anschließend den Gateway (dieses Nicht-loopback-Beispiel verwendet Authentifizierung mit gemeinsamem Geheimnis und Token):

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

- Gateway-Authentifizierung ist standardmäßig erforderlich (Token, Passwort, trusted-proxy oder Tailscale Serve-Identitätsheader, wenn aktiviert).
- Nicht-loopback-Binds **erfordern** weiterhin Gateway-Authentifizierung. In der Praxis bedeutet das Token-/Passwortauthentifizierung oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Der Assistent erstellt standardmäßig Authentifizierung mit gemeinsamem Geheimnis und generiert in der Regel einen Gateway-Token (auch auf loopback).
- Im Modus mit gemeinsamem Geheimnis sendet die UI `connect.params.auth.token` oder `connect.params.auth.password`.
- Wenn `gateway.tls.enabled: true` ist, rendern lokale Dashboard- und Status-Helfer `https://`-Dashboard-URLs und `wss://`-WebSocket-URLs.
- In Modi mit Identitätsinformationen wie Tailscale Serve oder `trusted-proxy` wird die WebSocket-Authentifizierungsprüfung stattdessen über Request-Header erfüllt.
- Für öffentliche Nicht-loopback-Control-UI-Deployments legen Sie `gateway.controlUi.allowedOrigins`
  explizit fest (vollständige Origins). Private Same-Origin-LAN-/Tailnet-Ladevorgänge werden für loopback,
  RFC1918/link-local, `.local`, `.ts.net` und Tailscale-CGNAT-Hosts akzeptiert.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert
  den Host-Header-Origin-Fallback-Modus, ist aber eine gefährliche Herabstufung der Sicherheit.
- Mit Serve können Tailscale-Identitätsheader die Control-UI-/WebSocket-Authentifizierung erfüllen,
  wenn `gateway.auth.allowTailscale` `true` ist (kein Token/Passwort erforderlich).
  HTTP-API-Endpunkte verwenden diese Tailscale-Identitätsheader nicht; sie folgen
  stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateways. Setzen Sie
  `gateway.auth.allowTailscale: false`, um explizite Anmeldedaten zu verlangen. Siehe
  [Tailscale](/de/gateway/tailscale) und [Sicherheit](/de/gateway/security). Dieser
  tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird.
- `gateway.tailscale.mode: "funnel"` erfordert `gateway.auth.mode: "password"` (gemeinsames Passwort).

## UI erstellen

Der Gateway stellt statische Dateien aus `dist/control-ui` bereit. Erstellen Sie sie mit:

```bash
pnpm ui:build
```

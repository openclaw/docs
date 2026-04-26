---
read_when:
    - Die Gateway-Control-UI außerhalb von localhost verfügbar machen
    - Tailnet- oder öffentlichen Zugriff auf das Dashboard automatisieren
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T11:31:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) automatisch für das
Gateway-Dashboard und den WebSocket-Port konfigurieren. Dadurch bleibt das Gateway an loopback gebunden, während
Tailscale HTTPS, Routing und (bei Serve) Identitäts-Header bereitstellt.

## Modi

- `serve`: nur Tailnet-Serve über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.
- `funnel`: öffentliches HTTPS über `tailscale funnel`. OpenClaw erfordert ein gemeinsames Passwort.
- `off`: Standard (keine Tailscale-Automatisierung).

Status- und Audit-Ausgaben verwenden **Tailscale-Exposition** für diesen OpenClaw-Serve-/Funnel-
Modus. `off` bedeutet, dass OpenClaw Serve oder Funnel nicht verwaltet; es bedeutet nicht, dass der
lokale Tailscale-Daemon gestoppt oder abgemeldet ist.

## Authentifizierung

Setzen Sie `gateway.auth.mode`, um den Handshake zu steuern:

- `none` (nur privater Ingress)
- `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist)
- `password` (gemeinsames Geheimnis über `OPENCLAW_GATEWAY_PASSWORD` oder Konfiguration)
- `trusted-proxy` (identitätsbewusster Reverse-Proxy; siehe [Authentifizierung über Trusted Proxy](/de/gateway/trusted-proxy-auth))

Wenn `tailscale.mode = "serve"` und `gateway.auth.allowTailscale` `true` ist,
kann die Authentifizierung für Control UI/WebSocket Tailscale-Identitäts-Header
(`tailscale-user-login`) verwenden, ohne ein Token/Passwort anzugeben. OpenClaw verifiziert
die Identität, indem die Adresse `x-forwarded-for` über den lokalen Tailscale-
Daemon (`tailscale whois`) aufgelöst und vor dem Akzeptieren mit dem Header abgeglichen wird.
OpenClaw behandelt eine Anfrage nur dann als Serve, wenn sie von loopback kommt und
Tailscales Header `x-forwarded-for`, `x-forwarded-proto` und `x-forwarded-host`
enthält.
Für Control-UI-Operatorsitzungen, die die Browser-Geräteidentität einschließen, wird bei diesem
verifizierten Serve-Pfad auch der Roundtrip der Gerätekopplung übersprungen. Er umgeht jedoch
nicht die Browser-Geräteidentität: Clients ohne Gerät werden weiterhin abgelehnt, und Verbindungen mit Node-Rolle
oder Nicht-Control-UI-WebSocket folgen weiterhin den normalen Prüfungen für Kopplung und
Authentifizierung.
HTTP-API-Endpunkte (zum Beispiel `/v1/*`, `/tools/invoke` und `/api/channels/*`)
verwenden **keine** Authentifizierung über Tailscale-Identitäts-Header. Sie folgen weiterhin dem
normalen HTTP-Authentifizierungsmodus des Gateways: standardmäßig Authentifizierung mit gemeinsamem Geheimnis oder ein absichtlich
konfiguriertes Setup mit `trusted-proxy` / privatem Ingress `none`.
Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Wenn auf demselben Host
nicht vertrauenswürdiger lokaler Code ausgeführt werden könnte, deaktivieren Sie `gateway.auth.allowTailscale` und verlangen
stattdessen Token-/Passwort-Authentifizierung.
Um explizite Zugangsdaten mit gemeinsamem Geheimnis zu verlangen, setzen Sie `gateway.auth.allowTailscale: false`
und verwenden Sie `gateway.auth.mode: "token"` oder `"password"`.

## Konfigurationsbeispiele

### Nur Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Öffnen: `https://<magicdns>/` (oder Ihr konfigurierter `gateway.controlUi.basePath`)

### Nur Tailnet (an Tailnet-IP binden)

Verwenden Sie dies, wenn das Gateway direkt auf der Tailnet-IP lauschen soll (ohne Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Verbindung von einem anderen Tailnet-Gerät:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Hinweis: loopback (`http://127.0.0.1:18789`) funktioniert in diesem Modus **nicht**.

### Öffentliches Internet (Funnel + gemeinsames Passwort)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, statt ein Passwort auf Datenträger zu committen.

## CLI-Beispiele

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Hinweise

- Tailscale Serve/Funnel erfordert, dass die `tailscale`-CLI installiert und angemeldet ist.
- `tailscale.mode: "funnel"` verweigert den Start, sofern der Authentifizierungsmodus nicht `password` ist, um öffentliche Exposition zu vermeiden.
- Setzen Sie `gateway.tailscale.resetOnExit`, wenn OpenClaw die Konfiguration von `tailscale serve`
  oder `tailscale funnel` beim Herunterfahren rückgängig machen soll.
- `gateway.bind: "tailnet"` ist eine direkte Tailnet-Bindung (kein HTTPS, kein Serve/Funnel).
- `gateway.bind: "auto"` bevorzugt loopback; verwenden Sie `tailnet`, wenn Sie nur Tailnet wünschen.
- Serve/Funnel exponiert nur die **Gateway-Control-UI + WS**. Nodes verbinden sich über
  denselben Gateway-WS-Endpunkt, daher kann Serve auch für Node-Zugriff funktionieren.

## Browser-Steuerung (Remote-Gateway + lokaler Browser)

Wenn Sie das Gateway auf einer Maschine ausführen, aber einen Browser auf einer anderen Maschine steuern möchten,
führen Sie einen **Node-Host** auf der Browser-Maschine aus und belassen Sie beide im selben Tailnet.
Das Gateway proxyt Browser-Aktionen zum Node; kein separater Kontrollserver oder Serve-URL ist erforderlich.

Vermeiden Sie Funnel für Browser-Steuerung; behandeln Sie die Node-Kopplung wie Operatorzugriff.

## Tailscale-Voraussetzungen + Einschränkungen

- Serve erfordert aktiviertes HTTPS für Ihr Tailnet; die CLI fordert dazu auf, wenn es fehlt.
- Serve injiziert Tailscale-Identitäts-Header; Funnel nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt über TLS nur die Ports `443`, `8443` und `10000`.
- Funnel auf macOS erfordert die Open-Source-Variante der Tailscale-App.

## Mehr erfahren

- Überblick zu Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Überblick zu Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Verwandt

- [Remote-Zugriff](/de/gateway/remote)
- [Discovery](/de/gateway/discovery)
- [Authentifizierung](/de/gateway/authentication)

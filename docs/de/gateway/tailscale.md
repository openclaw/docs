---
read_when:
    - Die Steuerungsoberfläche des Gateway außerhalb von localhost verfügbar machen
    - Automatisieren des Zugriffs auf Tailnet- oder öffentliche Dashboards
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T06:56:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) für das
Gateway-Dashboard und den WebSocket-Port automatisch konfigurieren. Dadurch bleibt das Gateway an loopback gebunden, während
Tailscale HTTPS, Routing und (für Serve) Identitäts-Header bereitstellt.

## Modi

- `serve`: Serve nur im Tailnet über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.
- `funnel`: Öffentliches HTTPS über `tailscale funnel`. OpenClaw erfordert ein gemeinsames Passwort.
- `off`: Standard (keine Tailscale-Automatisierung).

Status- und Audit-Ausgaben verwenden **Tailscale exposure** für diesen OpenClaw Serve/Funnel-
Modus. `off` bedeutet, dass OpenClaw Serve oder Funnel nicht verwaltet; es bedeutet nicht, dass der
lokale Tailscale-Daemon angehalten oder abgemeldet ist.

## Authentifizierung

Setzen Sie `gateway.auth.mode`, um den Handshake zu steuern:

- `none` (nur privater Ingress)
- `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist)
- `password` (gemeinsames Geheimnis über `OPENCLAW_GATEWAY_PASSWORD` oder Konfiguration)
- `trusted-proxy` (identitätsbewusster Reverse Proxy; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth))

Wenn `tailscale.mode = "serve"` ist und `gateway.auth.allowTailscale` auf `true` gesetzt ist,
kann die Control UI-/WebSocket-Authentifizierung Tailscale-Identitäts-Header
(`tailscale-user-login`) verwenden, ohne ein Token/Passwort bereitzustellen. OpenClaw prüft
die Identität, indem es die Adresse aus `x-forwarded-for` über den lokalen Tailscale-
Daemon (`tailscale whois`) auflöst und sie mit dem Header abgleicht, bevor sie akzeptiert wird.
OpenClaw behandelt eine Anfrage nur dann als Serve-Anfrage, wenn sie von loopback mit
Tailscales `x-forwarded-for`-, `x-forwarded-proto`- und `x-forwarded-host`-
Headern eintrifft.
Bei Control UI-Bedienersitzungen, die eine Browsergeräteidentität enthalten, überspringt dieser
verifizierte Serve-Pfad auch den Roundtrip der Gerätekopplung. Er umgeht die
Browsergeräteidentität nicht: Clients ohne Gerät werden weiterhin abgewiesen, und node-role-
oder Nicht-Control-UI-WebSocket-Verbindungen durchlaufen weiterhin die normalen Kopplungs- und
Authentifizierungsprüfungen.
HTTP-API-Endpunkte (zum Beispiel `/v1/*`, `/tools/invoke` und `/api/channels/*`)
verwenden **keine** Authentifizierung über Tailscale-Identitäts-Header. Sie folgen weiterhin dem
normalen HTTP-Authentifizierungsmodus des Gateways: standardmäßig Shared-Secret-Authentifizierung
oder eine bewusst konfigurierte trusted-proxy- / private-ingress-`none`-Einrichtung.
Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Wenn nicht vertrauenswürdiger lokaler Code
auf demselben Host ausgeführt werden kann, deaktivieren Sie `gateway.auth.allowTailscale` und verlangen Sie stattdessen
Token-/Passwortauthentifizierung.
Um explizite Shared-Secret-Anmeldedaten zu verlangen, setzen Sie `gateway.auth.allowTailscale: false`
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

Verwenden Sie dies, wenn das Gateway direkt auf der Tailnet-IP lauschen soll (kein Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Von einem anderen Tailnet-Gerät verbinden:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) funktioniert in diesem Modus **nicht**.
</Note>

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

Bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, statt ein Passwort auf dem Datenträger einzuchecken.

## CLI-Beispiele

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Hinweise

- Tailscale Serve/Funnel erfordert, dass die `tailscale`-CLI installiert und angemeldet ist.
- `tailscale.mode: "funnel"` verweigert den Start, wenn der Authentifizierungsmodus nicht `password` ist, um öffentliche Freigabe zu vermeiden.
- Setzen Sie `gateway.tailscale.resetOnExit`, wenn OpenClaw die Konfiguration von `tailscale serve`
  oder `tailscale funnel` beim Herunterfahren rückgängig machen soll.
- `gateway.bind: "tailnet"` ist eine direkte Tailnet-Bindung (kein HTTPS, kein Serve/Funnel).
- `gateway.bind: "auto"` bevorzugt loopback; verwenden Sie `tailnet`, wenn Sie nur Tailnet möchten.
- Serve/Funnel machen nur die **Gateway-Control-UI + WS** verfügbar. Nodes verbinden sich über
  denselben Gateway-WS-Endpunkt, sodass Serve für Node-Zugriff funktionieren kann.

## Browsersteuerung (entferntes Gateway + lokaler Browser)

Wenn Sie das Gateway auf einem Rechner ausführen, aber einen Browser auf einem anderen Rechner steuern möchten,
führen Sie einen **Node-Host** auf dem Browser-Rechner aus und halten Sie beide im selben Tailnet.
Das Gateway leitet Browseraktionen an den Node weiter; kein separater Control-Server oder keine Serve-URL erforderlich.

Vermeiden Sie Funnel für die Browsersteuerung; behandeln Sie Node-Kopplung wie Bedienerzugriff.

## Tailscale-Voraussetzungen + Limits

- Serve erfordert aktiviertes HTTPS für Ihr Tailnet; die CLI fragt nach, wenn es fehlt.
- Serve fügt Tailscale-Identitäts-Header ein; Funnel nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt über TLS nur die Ports `443`, `8443` und `10000`.
- Funnel unter macOS erfordert die Open-Source-Variante der Tailscale-App.

## Mehr erfahren

- Tailscale Serve-Überblick: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel-Überblick: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Verwandt

- [Remote-Zugriff](/de/gateway/remote)
- [Discovery](/de/gateway/discovery)
- [Authentifizierung](/de/gateway/authentication)

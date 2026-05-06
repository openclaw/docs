---
read_when:
    - Die Gateway-Steuerungs-UI außerhalb von localhost verfügbar machen
    - Automatisieren des Zugriffs auf das Tailnet oder das öffentliche Dashboard
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:56:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) automatisch für das
Gateway-Dashboard und den WebSocket-Port konfigurieren. Dadurch bleibt das Gateway an loopback gebunden, während
Tailscale HTTPS, Routing und (für Serve) Identitäts-Header bereitstellt.

## Modi

- `serve`: Nur-Tailnet-Serve über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.
- `funnel`: Öffentliches HTTPS über `tailscale funnel`. OpenClaw erfordert ein gemeinsames Passwort.
- `off`: Standard (keine Tailscale-Automatisierung).

Status- und Audit-Ausgaben verwenden **Tailscale-Exposition** für diesen OpenClaw Serve/Funnel-
Modus. `off` bedeutet, dass OpenClaw Serve oder Funnel nicht verwaltet; es bedeutet nicht, dass der
lokale Tailscale-Daemon gestoppt oder abgemeldet ist.

## Authentifizierung

Setzen Sie `gateway.auth.mode`, um den Handshake zu steuern:

- `none` (nur privater Ingress)
- `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist)
- `password` (gemeinsames Secret über `OPENCLAW_GATEWAY_PASSWORD` oder Konfiguration)
- `trusted-proxy` (identitätsbewusster Reverse Proxy; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth))

Wenn `tailscale.mode = "serve"` ist und `gateway.auth.allowTailscale` auf `true` gesetzt ist,
kann die Control UI-/WebSocket-Authentifizierung Tailscale-Identitäts-Header
(`tailscale-user-login`) verwenden, ohne ein Token/Passwort bereitzustellen. OpenClaw verifiziert
die Identität, indem es die Adresse aus `x-forwarded-for` über den lokalen Tailscale-
Daemon (`tailscale whois`) auflöst und sie mit dem Header abgleicht, bevor sie akzeptiert wird.
OpenClaw behandelt eine Anfrage nur dann als Serve, wenn sie von loopback mit
Tailscales `x-forwarded-for`-, `x-forwarded-proto`- und `x-forwarded-host`-
Headern eingeht.
Bei Control UI-Operator-Sitzungen, die eine Browser-Geräteidentität enthalten, überspringt dieser
verifizierte Serve-Pfad auch den Device-Pairing-Roundtrip. Er umgeht die
Browser-Geräteidentität nicht: Clients ohne Gerät werden weiterhin abgelehnt, und Node-Rollen-
oder Nicht-Control-UI-WebSocket-Verbindungen durchlaufen weiterhin die normalen Pairing- und
Authentifizierungsprüfungen.
HTTP-API-Endpunkte (zum Beispiel `/v1/*`, `/tools/invoke` und `/api/channels/*`)
verwenden **keine** Tailscale-Identitäts-Header-Authentifizierung. Sie folgen weiterhin dem
normalen HTTP-Authentifizierungsmodus des Gateway: standardmäßig Shared-Secret-Authentifizierung
oder eine bewusst konfigurierte `trusted-proxy`-/private-ingress-`none`-Einrichtung.
Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Wenn nicht vertrauenswürdiger lokaler Code
auf demselben Host laufen könnte, deaktivieren Sie `gateway.auth.allowTailscale` und verlangen
stattdessen Token-/Passwort-Authentifizierung.
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

Verwenden Sie dies, wenn das Gateway direkt auf der Tailnet-IP lauschen soll (ohne Serve/Funnel).

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

Verwenden Sie vorzugsweise `OPENCLAW_GATEWAY_PASSWORD`, statt ein Passwort auf die Festplatte zu committen.

## CLI-Beispiele

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Hinweise

- Tailscale Serve/Funnel erfordert, dass die `tailscale`-CLI installiert und angemeldet ist.
- `tailscale.mode: "funnel"` verweigert den Start, sofern der Authentifizierungsmodus nicht `password` ist, um öffentliche Exposition zu vermeiden.
- Setzen Sie `gateway.tailscale.resetOnExit`, wenn OpenClaw die Konfiguration von `tailscale serve`
  oder `tailscale funnel` beim Herunterfahren zurücknehmen soll.
- `gateway.bind: "tailnet"` ist eine direkte Tailnet-Bindung (kein HTTPS, kein Serve/Funnel).
- `gateway.bind: "auto"` bevorzugt loopback; verwenden Sie `tailnet`, wenn Sie nur Tailnet möchten.
- Serve/Funnel stellen nur die **Gateway-Control-UI + WS** bereit. Nodes verbinden sich über
  denselben Gateway-WS-Endpunkt, sodass Serve für Node-Zugriff funktionieren kann.

## Browser-Steuerung (Remote-Gateway + lokaler Browser)

Wenn Sie das Gateway auf einem Rechner ausführen, aber einen Browser auf einem anderen Rechner steuern möchten,
führen Sie auf dem Browser-Rechner einen **Node-Host** aus und halten Sie beide im selben Tailnet.
Das Gateway proxyt Browser-Aktionen an den Node; es ist kein separater Steuerungsserver und keine Serve-URL erforderlich.

Vermeiden Sie Funnel für die Browser-Steuerung; behandeln Sie Node-Pairing wie Operator-Zugriff.

## Tailscale-Voraussetzungen + Grenzen

- Serve erfordert, dass HTTPS für Ihr Tailnet aktiviert ist; die CLI fragt nach, falls es fehlt.
- Serve fügt Tailscale-Identitäts-Header ein; Funnel tut dies nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt über TLS nur die Ports `443`, `8443` und `10000`.
- Funnel unter macOS erfordert die Open-Source-Variante der Tailscale-App.

## Mehr erfahren

- Tailscale-Serve-Übersicht: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale-Funnel-Übersicht: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Verwandt

- [Remote-Zugriff](/de/gateway/remote)
- [Discovery](/de/gateway/discovery)
- [Authentifizierung](/de/gateway/authentication)

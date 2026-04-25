---
read_when:
    - Die Gateway-Control-UI außerhalb von localhost bereitstellen
    - Tailnet- oder öffentlichen Dashboard-Zugriff automatisieren
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-04-25T13:48:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) automatisch für das
Gateway-Dashboard und den WebSocket-Port konfigurieren. Dadurch bleibt das Gateway an loopback gebunden, während
Tailscale HTTPS, Routing und (bei Serve) Identitäts-Header bereitstellt.

## Modi

- `serve`: Nur-Tailnet-Serve über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.
- `funnel`: Öffentliches HTTPS über `tailscale funnel`. OpenClaw erfordert ein gemeinsames Passwort.
- `off`: Standard (keine Tailscale-Automatisierung).

## Auth

Setze `gateway.auth.mode`, um den Handshake zu steuern:

- `none` (nur privater Ingress)
- `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist)
- `password` (gemeinsames Secret über `OPENCLAW_GATEWAY_PASSWORD` oder Konfiguration)
- `trusted-proxy` (identitätsbewusster Reverse-Proxy; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth))

Wenn `tailscale.mode = "serve"` und `gateway.auth.allowTailscale` `true` ist,
kann die Auth für Control UI/WebSocket Tailscale-Identitäts-Header
(`tailscale-user-login`) verwenden, ohne ein Token/Passwort anzugeben. OpenClaw verifiziert
die Identität, indem es die `x-forwarded-for`-Adresse über den lokalen Tailscale-
Daemon (`tailscale whois`) auflöst und sie vor der Akzeptanz mit dem Header abgleicht.
OpenClaw behandelt eine Anfrage nur dann als Serve, wenn sie über Loopback mit
Tailscales `x-forwarded-for`-, `x-forwarded-proto`- und `x-forwarded-host`-
Headern eintrifft.
HTTP-API-Endpunkte (zum Beispiel `/v1/*`, `/tools/invoke` und `/api/channels/*`)
verwenden **keine** Tailscale-Identitäts-Header-Auth. Sie folgen weiterhin dem
normalen HTTP-Auth-Modus des Gateways: standardmäßig Shared-Secret-Auth oder ein absichtlich
konfiguriertes Setup mit trusted-proxy / privatem Ingress `none`.
Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Wenn auf demselben Host
nicht vertrauenswürdiger lokaler Code laufen kann, deaktiviere `gateway.auth.allowTailscale` und verlange
stattdessen Token-/Passwort-Auth.
Um explizite Shared-Secret-Zugangsdaten zu verlangen, setze `gateway.auth.allowTailscale: false`
und verwende `gateway.auth.mode: "token"` oder `"password"`.

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

Öffnen: `https://<magicdns>/` (oder dein konfiguriertes `gateway.controlUi.basePath`)

### Nur Tailnet (an Tailnet-IP binden)

Verwende dies, wenn du möchtest, dass das Gateway direkt auf der Tailnet-IP lauscht (ohne Serve/Funnel).

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

Bevorzuge `OPENCLAW_GATEWAY_PASSWORD`, statt ein Passwort auf die Festplatte zu committen.

## CLI-Beispiele

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Hinweise

- Tailscale Serve/Funnel setzt voraus, dass die `tailscale`-CLI installiert und angemeldet ist.
- `tailscale.mode: "funnel"` verweigert den Start, sofern der Auth-Modus nicht `password` ist, um öffentliche Exposition zu vermeiden.
- Setze `gateway.tailscale.resetOnExit`, wenn OpenClaw die Konfiguration von `tailscale serve`
  oder `tailscale funnel` beim Herunterfahren rückgängig machen soll.
- `gateway.bind: "tailnet"` ist eine direkte Tailnet-Bindung (ohne HTTPS, ohne Serve/Funnel).
- `gateway.bind: "auto"` bevorzugt loopback; verwende `tailnet`, wenn du nur Tailnet möchtest.
- Serve/Funnel stellen nur die **Gateway-Control-UI + WS** bereit. Nodes verbinden sich über
  denselben Gateway-WS-Endpunkt, daher kann Serve auch für Node-Zugriff funktionieren.

## Browser-Steuerung (Remote-Gateway + lokaler Browser)

Wenn du das Gateway auf einer Maschine ausführst, aber einen Browser auf einer anderen Maschine steuern möchtest,
führe auf der Browser-Maschine einen **Node-Host** aus und halte beide im selben Tailnet.
Das Gateway wird Browser-Aktionen an die Node weiterleiten; ein separater Control-Server oder eine Serve-URL ist nicht erforderlich.

Vermeide Funnel für die Browser-Steuerung; behandle Node-Pairing wie Operator-Zugriff.

## Voraussetzungen + Limits für Tailscale

- Serve erfordert aktiviertes HTTPS für dein Tailnet; die CLI fordert dazu auf, falls es fehlt.
- Serve injiziert Tailscale-Identitäts-Header; Funnel nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt über TLS nur die Ports `443`, `8443` und `10000`.
- Funnel unter macOS erfordert die Open-Source-Variante der Tailscale-App.

## Mehr erfahren

- Überblick zu Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Überblick zu Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Verwandt

- [Remote access](/de/gateway/remote)
- [Discovery](/de/gateway/discovery)
- [Authentication](/de/gateway/authentication)

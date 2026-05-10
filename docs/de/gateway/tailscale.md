---
read_when:
    - Gateway-Steuerungs-UI außerhalb von localhost verfügbar machen
    - Tailnet- oder öffentlichen Dashboard-Zugriff automatisieren
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:37:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) für das
Gateway-Dashboard und den WebSocket-Port automatisch konfigurieren. Dadurch bleibt das Gateway an Loopback gebunden, während
Tailscale HTTPS, Routing und (bei Serve) Identitäts-Header bereitstellt.

## Modi

- `serve`: Nur im Tailnet verfügbarer Serve über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.
- `funnel`: Öffentliches HTTPS über `tailscale funnel`. OpenClaw erfordert ein gemeinsames Passwort.
- `off`: Standard (keine Tailscale-Automatisierung).

Status- und Audit-Ausgaben verwenden **Tailscale-Bereitstellung** für diesen OpenClaw-Serve/Funnel-
Modus. `off` bedeutet, dass OpenClaw Serve oder Funnel nicht verwaltet; es bedeutet nicht, dass der
lokale Tailscale-Daemon angehalten oder abgemeldet ist.

## Authentifizierung

Legen Sie `gateway.auth.mode` fest, um den Handshake zu steuern:

- `none` (nur privater Eingang)
- `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist)
- `password` (gemeinsames Geheimnis über `OPENCLAW_GATEWAY_PASSWORD` oder Konfiguration)
- `trusted-proxy` (identitätsbewusster Reverse Proxy; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth))

Wenn `tailscale.mode = "serve"` und `gateway.auth.allowTailscale` `true` ist,
kann die Authentifizierung für Control UI/WebSocket Tailscale-Identitäts-Header
(`tailscale-user-login`) verwenden, ohne ein Token/Passwort bereitzustellen. OpenClaw überprüft
die Identität, indem es die Adresse aus `x-forwarded-for` über den lokalen Tailscale-
Daemon (`tailscale whois`) auflöst und vor der Annahme mit dem Header abgleicht.
OpenClaw behandelt eine Anfrage nur dann als Serve, wenn sie von Loopback mit
Tailscales `x-forwarded-for`-, `x-forwarded-proto`- und `x-forwarded-host`-
Headern eingeht.
Bei Control-UI-Operator-Sitzungen, die eine Browser-Geräteidentität enthalten, überspringt dieser
verifizierte Serve-Pfad außerdem den Geräte-Pairing-Roundtrip. Er umgeht die
Browser-Geräteidentität nicht: Clients ohne Geräteidentität werden weiterhin abgelehnt, und Node-Rollen-
oder Nicht-Control-UI-WebSocket-Verbindungen folgen weiterhin den normalen Pairing- und
Authentifizierungsprüfungen.
HTTP-API-Endpunkte (zum Beispiel `/v1/*`, `/tools/invoke` und `/api/channels/*`)
verwenden **keine** Authentifizierung per Tailscale-Identitäts-Header. Sie folgen weiterhin dem
normalen HTTP-Authentifizierungsmodus des Gateways: standardmäßig Shared-Secret-Authentifizierung
oder eine bewusst konfigurierte Trusted-Proxy- / Private-Ingress-`none`-Einrichtung.
Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code
auf demselben Host ausgeführt werden kann, deaktivieren Sie `gateway.auth.allowTailscale` und verlangen Sie stattdessen
Token-/Passwort-Authentifizierung.
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
- `tailscale.mode: "funnel"` verweigert den Start, sofern der Authentifizierungsmodus nicht `password` ist, um öffentliche Bereitstellung zu vermeiden.
- Setzen Sie `gateway.tailscale.resetOnExit`, wenn OpenClaw die Konfiguration von `tailscale serve`
  oder `tailscale funnel` beim Herunterfahren rückgängig machen soll.
- Setzen Sie `gateway.tailscale.preserveFunnel: true`, um eine extern konfigurierte
  `tailscale funnel`-Route über Gateway-Neustarts hinweg aktiv zu halten. Wenn dies aktiviert ist und das
  Gateway in `mode: "serve"` läuft, prüft OpenClaw `tailscale funnel status`,
  bevor Serve erneut angewendet wird, und überspringt dies, wenn bereits eine Funnel-Route den
  Gateway-Port abdeckt. Die von OpenClaw verwaltete Funnel-Richtlinie nur mit Passwort bleibt unverändert.
- `gateway.bind: "tailnet"` ist eine direkte Tailnet-Bindung (kein HTTPS, kein Serve/Funnel).
- `gateway.bind: "auto"` bevorzugt Loopback; verwenden Sie `tailnet`, wenn Sie nur Tailnet wünschen.
- Serve/Funnel stellen nur die **Gateway-Control-UI + WS** bereit. Nodes verbinden sich über
  denselben Gateway-WS-Endpunkt, daher kann Serve für Node-Zugriff funktionieren.

## Browser-Steuerung (entferntes Gateway + lokaler Browser)

Wenn Sie das Gateway auf einem Rechner ausführen, aber einen Browser auf einem anderen Rechner steuern möchten,
führen Sie einen **Node-Host** auf dem Browser-Rechner aus und halten Sie beide im selben Tailnet.
Das Gateway leitet Browser-Aktionen an den Node weiter; ein separater Control-Server oder eine Serve-URL ist nicht erforderlich.

Vermeiden Sie Funnel für die Browser-Steuerung; behandeln Sie Node-Pairing wie Operator-Zugriff.

## Tailscale-Voraussetzungen + Einschränkungen

- Serve erfordert, dass HTTPS für Ihr Tailnet aktiviert ist; die CLI fragt nach, wenn dies fehlt.
- Serve fügt Tailscale-Identitäts-Header ein; Funnel nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt über TLS nur die Ports `443`, `8443` und `10000`.
- Funnel unter macOS erfordert die Open-Source-Variante der Tailscale-App.

## Mehr erfahren

- Tailscale-Serve-Überblick: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale-Funnel-Überblick: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Verwandt

- [Remote-Zugriff](/de/gateway/remote)
- [Discovery](/de/gateway/discovery)
- [Authentifizierung](/de/gateway/authentication)

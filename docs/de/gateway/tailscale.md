---
read_when:
    - Gateway Control UI außerhalb von localhost verfügbar machen
    - Tailnet- oder öffentlichen Dashboard-Zugriff automatisieren
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:34:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) für das
Gateway-Dashboard und den WebSocket-Port automatisch konfigurieren. Dadurch bleibt das Gateway an Loopback gebunden, während
Tailscale HTTPS, Routing und (für Serve) Identitäts-Header bereitstellt.

## Modi

- `serve`: Tailnet-only Serve über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.
- `funnel`: Öffentliches HTTPS über `tailscale funnel`. OpenClaw erfordert ein gemeinsames Passwort.
- `off`: Standard (keine Tailscale-Automatisierung).

Status- und Audit-Ausgabe verwenden **Tailscale-Bereitstellung** für diesen OpenClaw-Serve/Funnel-
Modus. `off` bedeutet, dass OpenClaw Serve oder Funnel nicht verwaltet; es bedeutet nicht, dass der
lokale Tailscale-Daemon gestoppt oder abgemeldet ist.

## Authentifizierung

Legen Sie `gateway.auth.mode` fest, um den Handshake zu steuern:

- `none` (nur privater Ingress)
- `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist)
- `password` (gemeinsames Geheimnis über `OPENCLAW_GATEWAY_PASSWORD` oder Konfiguration)
- `trusted-proxy` (identitätsbewusster Reverse Proxy; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth))

Wenn `tailscale.mode = "serve"` und `gateway.auth.allowTailscale` `true` ist,
kann die Control-UI/WebSocket-Authentifizierung Tailscale-Identitäts-Header
(`tailscale-user-login`) verwenden, ohne ein Token/Passwort bereitzustellen. OpenClaw verifiziert
die Identität, indem die `x-forwarded-for`-Adresse über den lokalen Tailscale-
Daemon (`tailscale whois`) aufgelöst und mit dem Header abgeglichen wird, bevor sie akzeptiert wird.
OpenClaw behandelt eine Anfrage nur dann als Serve, wenn sie von Loopback mit
Tailscales `x-forwarded-for`-, `x-forwarded-proto`- und `x-forwarded-host`-
Headern eingeht.
Für Control-UI-Operatorsitzungen, die eine Browser-Geräteidentität enthalten, überspringt dieser
verifizierte Serve-Pfad auch den Roundtrip für die Gerätekopplung. Er umgeht die
Browser-Geräteidentität nicht: Clients ohne Gerät werden weiterhin abgelehnt, und node-role-
oder Nicht-Control-UI-WebSocket-Verbindungen folgen weiterhin den normalen Kopplungs- und
Authentifizierungsprüfungen.
HTTP-API-Endpunkte (zum Beispiel `/v1/*`, `/tools/invoke` und `/api/channels/*`)
verwenden **keine** Authentifizierung über Tailscale-Identitäts-Header. Sie folgen weiterhin dem
normalen HTTP-Authentifizierungsmodus des Gateways: standardmäßig Authentifizierung mit gemeinsamem Geheimnis
oder eine bewusst konfigurierte trusted-proxy- / private-ingress-`none`-Einrichtung.
Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Wenn nicht vertrauenswürdiger lokaler Code
auf demselben Host ausgeführt werden kann, deaktivieren Sie `gateway.auth.allowTailscale` und verlangen Sie stattdessen
Token-/Passwortauthentifizierung.
Um explizite Anmeldedaten mit gemeinsamem Geheimnis zu verlangen, setzen Sie `gateway.auth.allowTailscale: false`
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

Um die Control UI über einen benannten Tailscale Service statt über den
Geräte-Hostnamen bereitzustellen, setzen Sie `gateway.tailscale.serviceName` auf den Service-Namen:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Mit dem obigen Beispiel meldet der Start die Service-URL als
`https://openclaw.<tailnet-name>.ts.net/` statt des Geräte-Hostnamens.
Tailscale Services erfordern, dass der Host ein genehmigter getaggter Node in Ihrem
Tailnet ist. Konfigurieren Sie das Tag und genehmigen Sie den Service in Tailscale, bevor Sie
diese Option aktivieren, andernfalls schlägt `tailscale serve --service=...` beim Gateway-
Start fehl.

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

Bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, statt ein Passwort auf die Festplatte zu committen.

## CLI-Beispiele

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Hinweise

- Tailscale Serve/Funnel erfordert, dass die `tailscale`-CLI installiert und angemeldet ist.
- `tailscale.mode: "funnel"` verweigert den Start, sofern der Authentifizierungsmodus nicht `password` ist, um öffentliche Bereitstellung zu vermeiden.
- `gateway.tailscale.serviceName` gilt nur für den Serve-Modus und wird an
  `tailscale serve --service=<name>` übergeben. Der Wert muss Tailscales
  `svc:<dns-label>`-Service-Namensformat verwenden, zum Beispiel `svc:openclaw`.
  Tailscale erfordert, dass Service-Hosts getaggte Nodes sind, und der Service benötigt möglicherweise
  eine Genehmigung in der Admin-Konsole, bevor Serve ihn veröffentlichen kann.
- Setzen Sie `gateway.tailscale.resetOnExit`, wenn OpenClaw die Konfiguration von `tailscale serve`
  oder `tailscale funnel` beim Herunterfahren rückgängig machen soll.
- Setzen Sie `gateway.tailscale.preserveFunnel: true`, um eine extern konfigurierte
  `tailscale funnel`-Route über Gateway-Neustarts hinweg aktiv zu halten. Wenn diese Option aktiviert ist und das
  Gateway in `mode: "serve"` läuft, prüft OpenClaw `tailscale funnel status`,
  bevor Serve erneut angewendet wird, und überspringt dies, wenn eine Funnel-Route bereits den
  Gateway-Port abdeckt. Die von OpenClaw verwaltete Nur-Passwort-Richtlinie für Funnel bleibt unverändert.
- `gateway.bind: "tailnet"` ist eine direkte Tailnet-Bindung (kein HTTPS, kein Serve/Funnel).
- `gateway.bind: "auto"` bevorzugt Loopback; verwenden Sie `tailnet`, wenn Sie nur Tailnet wünschen.
- Serve/Funnel stellen nur die **Gateway Control UI + WS** bereit. Nodes verbinden sich über
  denselben Gateway-WS-Endpunkt, sodass Serve für Node-Zugriff funktionieren kann.

## Browser-Steuerung (entferntes Gateway + lokaler Browser)

Wenn Sie das Gateway auf einer Maschine ausführen, aber einen Browser auf einer anderen Maschine steuern möchten,
führen Sie einen **Node-Host** auf der Browser-Maschine aus und belassen Sie beide im selben Tailnet.
Das Gateway leitet Browser-Aktionen an den Node weiter; kein separater Steuerungsserver und keine Serve-URL erforderlich.

Vermeiden Sie Funnel für die Browser-Steuerung; behandeln Sie Node-Kopplung wie Operator-Zugriff.

## Tailscale-Voraussetzungen + Grenzen

- Serve erfordert, dass HTTPS für Ihr Tailnet aktiviert ist; die CLI fragt nach, wenn es fehlt.
- Serve fügt Tailscale-Identitäts-Header ein; Funnel tut dies nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt nur die Ports `443`, `8443` und `10000` über TLS.
- Funnel auf macOS erfordert die Open-Source-Variante der Tailscale-App.

## Mehr erfahren

- Tailscale Serve-Übersicht: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel-Übersicht: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Verwandt

- [Remote-Zugriff](/de/gateway/remote)
- [Discovery](/de/gateway/discovery)
- [Authentifizierung](/de/gateway/authentication)

---
read_when:
    - Bereitstellen der Gateway-Control-UI außerhalb von localhost
    - Zugriff auf das Tailnet oder das öffentliche Dashboard automatisieren
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T01:43:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) für das Gateway-Dashboard und den WebSocket-Port automatisch konfigurieren. Dadurch bleibt das Gateway an local loopback gebunden, während Tailscale HTTPS, Routing und (bei Serve) Identitäts-Header bereitstellt.

## Modi

`gateway.tailscale.mode`:

| Modus             | Verhalten                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `serve`           | Serve nur im Tailnet über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.                |
| `funnel`          | Öffentliches HTTPS über `tailscale funnel`. Erfordert ein gemeinsames Passwort.                 |
| `off` (Standard)  | Keine Tailscale-Automatisierung.                                                                |

Status- und Audit-Ausgaben verwenden **Tailscale-Bereitstellung** für diesen Serve-/Funnel-Modus von OpenClaw. `off` bedeutet, dass OpenClaw weder Serve noch Funnel verwaltet; es bedeutet nicht, dass der lokale Tailscale-Daemon angehalten oder abgemeldet ist.

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

Öffnen Sie: `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

Um die Control UI über einen benannten Tailscale Service statt über den Geräte-Hostnamen bereitzustellen, setzen Sie `gateway.tailscale.serviceName` auf den Namen des Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Beim Start wird dann die Service-URL `https://openclaw.<tailnet-name>.ts.net/` statt des Geräte-Hostnamens ausgegeben. Tailscale Services setzen voraus, dass der Host eine genehmigte Node mit Tag in Ihrem Tailnet ist. Konfigurieren Sie den Tag und genehmigen Sie den Service in Tailscale, bevor Sie diese Funktion aktivieren; andernfalls schlägt `tailscale serve --service=...` beim Start des Gateways fehl.

### Nur Tailnet (Bindung an die Tailnet-IP)

Verwenden Sie diese Konfiguration, damit das Gateway ohne Serve/Funnel direkt auf der Tailnet-IP lauscht:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Stellen Sie die Verbindung von einem anderen Tailnet-Gerät her:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Wenn eine bindbare Tailnet-IPv4-Adresse vorhanden ist, benötigt das Gateway für authentifizierte Clients auf demselben Host außerdem `http://127.0.0.1:18789`. Ist beim Start keine Tailnet-Adresse verfügbar, erfolgt ein Rückfall ausschließlich auf local loopback. Starten Sie das Gateway neu, nachdem Tailscale verfügbar ist, um direkten Tailnet-Zugriff hinzuzufügen. Keiner der beiden Pfade stellt einen LAN- oder öffentlichen Zugriff bereit.
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

Verwenden Sie vorzugsweise `OPENCLAW_GATEWAY_PASSWORD`, statt ein Passwort auf dem Datenträger zu speichern.

## CLI-Beispiele

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Authentifizierung

`gateway.auth.mode` steuert den Handshake:

| Modus                                                  | Anwendungsfall                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `none`                                                 | Nur privater eingehender Zugriff                                                                             |
| `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist) | Gemeinsames Token                                                                                     |
| `password`                                             | Gemeinsames Geheimnis über `OPENCLAW_GATEWAY_PASSWORD` oder die Konfiguration                                |
| `trusted-proxy`                                        | Identitätsbewusster Reverse-Proxy; siehe [Authentifizierung über einen vertrauenswürdigen Proxy](/de/gateway/trusted-proxy-auth) |

### Tailscale-Identitäts-Header (nur Serve)

Wenn `tailscale.mode: "serve"` festgelegt und `gateway.auth.allowTailscale` auf `true` gesetzt ist, kann die Authentifizierung der Control UI und des WebSockets anstelle eines Tokens oder Passworts Tailscale-Identitäts-Header (`tailscale-user-login`) verwenden. OpenClaw überprüft den Header, indem es die Adresse `x-forwarded-for` der Anfrage über den lokalen Tailscale-Daemon (`tailscale whois`) auflöst und sie vor der Annahme mit der Anmeldung im Header abgleicht. Eine Anfrage kommt für diesen Pfad nur infrage, wenn sie über local loopback eingeht und die Tailscale-Header `x-forwarded-for`, `x-forwarded-proto` und `x-forwarded-host` enthält.

Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf demselben Host ausgeführt werden kann, setzen Sie `gateway.auth.allowTailscale: false` und verlangen Sie stattdessen eine Token- oder Passwortauthentifizierung.

Umfang der Umgehung:

- Gilt nur für die WebSocket-Authentifizierungsoberfläche der Control UI. HTTP-API-Endpunkte (`/v1/*`, `/tools/invoke`, `/api/channels/*` usw.) verwenden niemals die Authentifizierung über Tailscale-Identitäts-Header; sie folgen stets dem normalen HTTP-Authentifizierungsmodus des Gateways.
- Bei Control-UI-Operatorsitzungen, die bereits eine Browsergeräteidentität enthalten, überspringt eine verifizierte Tailscale-Identität den Roundtrip für die Kopplung über Bootstrap-Token/QR-Code.
- Die Geräteidentität selbst wird dadurch nicht umgangen: Clients ohne Gerät werden weiterhin abgelehnt, und Verbindungen mit Node-Rolle durchlaufen weiterhin die normalen Kopplungs- und Authentifizierungsprüfungen.

## Hinweise

- Tailscale Serve/Funnel erfordert, dass die `tailscale`-CLI installiert und angemeldet ist.
- `tailscale.mode: "funnel"` verweigert den Start, sofern der Authentifizierungsmodus nicht `password` ist, um eine öffentliche Bereitstellung zu vermeiden.
- `gateway.tailscale.serviceName` gilt nur für den Serve-Modus und wird an `tailscale serve --service=<name>` übergeben. Der Wert muss das Tailscale-Format `svc:<dns-label>` verwenden, beispielsweise `svc:openclaw`. Tailscale verlangt, dass Service-Hosts Nodes mit Tags sind, und der Service muss möglicherweise in der Administrationskonsole genehmigt werden, bevor Serve ihn veröffentlichen kann.
- `gateway.tailscale.resetOnExit` macht die Konfiguration von `tailscale serve`/`tailscale funnel` beim Herunterfahren rückgängig.
- `gateway.tailscale.preserveFunnel: true` hält eine extern konfigurierte `tailscale funnel`-Route über Gateway-Neustarts hinweg aktiv. Bei `mode: "serve"` prüft OpenClaw vor der erneuten Anwendung von Serve den Status mit `tailscale funnel status` und überspringt die Anwendung, wenn bereits eine Funnel-Route den Gateway-Port abdeckt. Die von OpenClaw verwaltete Richtlinie, die für Funnel ausschließlich Passwörter zulässt, bleibt unverändert.
- `gateway.bind: "tailnet"` verwendet eine direkte Tailnet-Bindung (kein HTTPS, kein Serve/Funnel) sowie das erforderliche lokale `127.0.0.1`, wenn eine Tailnet-IPv4-Adresse verfügbar ist; andernfalls erfolgt ein Rückfall ausschließlich auf local loopback.
- `gateway.bind: "auto"` bevorzugt local loopback; verwenden Sie `tailnet`, um die Netzwerkbereitstellung auf das Tailnet zu beschränken und gleichzeitig den local-loopback-Zugriff auf demselben Host beizubehalten.
- Serve/Funnel stellt nur die **Gateway-Control-UI und WS** bereit. Nodes stellen Verbindungen über denselben Gateway-WS-Endpunkt her, daher funktioniert Serve auch für den Node-Zugriff.

### Voraussetzungen und Einschränkungen für Tailscale

- Serve erfordert, dass HTTPS für Ihr Tailnet aktiviert ist; die CLI fordert Sie dazu auf, wenn es fehlt.
- Serve fügt Tailscale-Identitäts-Header ein; Funnel nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt über TLS nur die Ports `443`, `8443` und `10000`.
- Funnel unter macOS erfordert die Open-Source-Variante der Tailscale-App.

## Browsersteuerung (entferntes Gateway + lokaler Browser)

Um das Gateway auf einem Computer auszuführen, aber einen Browser auf einem anderen zu steuern, führen Sie einen **Node-Host** auf dem Browsercomputer aus und sorgen Sie dafür, dass sich beide im selben Tailnet befinden. Das Gateway leitet Browseraktionen an die Node weiter; ein separater Steuerungsserver oder eine Serve-URL ist nicht erforderlich.

Vermeiden Sie Funnel für die Browsersteuerung; behandeln Sie die Node-Kopplung wie Operatorzugriff.

## Weitere Informationen

- Übersicht über Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Übersicht über Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Verwandte Themen

- [Remotezugriff](/de/gateway/remote)
- [Erkennung](/de/gateway/discovery)
- [Authentifizierung](/de/gateway/authentication)

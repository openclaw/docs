---
read_when:
    - Bereitstellen der Gateway Control UI außerhalb von localhost
    - Zugriff auf das Tailnet oder öffentliche Dashboard automatisieren
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T15:29:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) für das Gateway-Dashboard und den WebSocket-Port automatisch konfigurieren. Dabei bleibt das Gateway an die Loopback-Schnittstelle gebunden, während Tailscale HTTPS, Routing und (bei Serve) Identitäts-Header bereitstellt.

## Modi

`gateway.tailscale.mode`:

| Modus           | Verhalten                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `serve`         | Serve nur im Tailnet über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.                 |
| `funnel`        | Öffentliches HTTPS über `tailscale funnel`. Erfordert ein gemeinsames Passwort.                  |
| `off` (Standard) | Keine Tailscale-Automatisierung.                                                                |

Status- und Audit-Ausgaben verwenden **Tailscale-Exposition** für diesen OpenClaw-Serve-/Funnel-Modus. `off` bedeutet, dass OpenClaw Serve oder Funnel nicht verwaltet; es bedeutet nicht, dass der lokale Tailscale-Daemon angehalten oder abgemeldet ist.

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

Um die Control UI über einen benannten Tailscale-Service statt über den Gerätehostnamen bereitzustellen, setzen Sie `gateway.tailscale.serviceName` auf den Namen des Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Beim Start wird dann die Service-URL als `https://openclaw.<tailnet-name>.ts.net/` statt des Gerätehostnamens ausgegeben. Tailscale Services setzen voraus, dass der Host eine genehmigte, mit einem Tag versehene Node in Ihrem Tailnet ist. Konfigurieren Sie das Tag und genehmigen Sie den Service in Tailscale, bevor Sie diese Option aktivieren. Andernfalls schlägt `tailscale serve --service=...` beim Start des Gateway fehl.

### Nur Tailnet (Bindung an Tailnet-IP)

Verwenden Sie diese Konfiguration, damit das Gateway ohne Serve/Funnel direkt an der Tailnet-IP lauscht:

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

<Note>
Wenn eine bindungsfähige Tailnet-IPv4-Adresse vorhanden ist, benötigt das Gateway außerdem `http://127.0.0.1:18789` für authentifizierte Clients auf demselben Host. Wenn beim Start keine Tailnet-Adresse verfügbar ist, greift es ausschließlich auf Loopback zurück. Starten Sie das Gateway neu, nachdem Tailscale verfügbar geworden ist, um direkten Tailnet-Zugriff hinzuzufügen. Keiner der beiden Pfade ermöglicht einen LAN- oder öffentlichen Zugriff.
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

| Modus                                                  | Anwendungsfall                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | Nur privater eingehender Zugriff                                                    |
| `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist) | Gemeinsames Token                                                          |
| `password`                                             | Gemeinsames Geheimnis über `OPENCLAW_GATEWAY_PASSWORD` oder die Konfiguration       |
| `trusted-proxy`                                        | Identitätsbewusster Reverse-Proxy; siehe [Authentifizierung über vertrauenswürdigen Proxy](/de/gateway/trusted-proxy-auth) |

### Tailscale-Identitäts-Header (nur Serve)

Wenn `tailscale.mode: "serve"` festgelegt und `gateway.auth.allowTailscale` auf `true` gesetzt ist, kann die Authentifizierung der Control UI bzw. des WebSocket Tailscale-Identitäts-Header (`tailscale-user-login`) anstelle eines Tokens oder Passworts verwenden. OpenClaw überprüft den Header, indem es die `x-forwarded-for`-Adresse der Anfrage über den lokalen Tailscale-Daemon (`tailscale whois`) auflöst und sie vor der Annahme mit dem Anmeldenamen im Header abgleicht. Eine Anfrage ist für diesen Pfad nur geeignet, wenn sie von der Loopback-Schnittstelle eingeht und die Tailscale-Header `x-forwarded-for`, `x-forwarded-proto` und `x-forwarded-host` enthält.

Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf demselben Host ausgeführt werden kann, setzen Sie `gateway.auth.allowTailscale: false` und verlangen Sie stattdessen eine Token- oder Passwortauthentifizierung.

Geltungsbereich der Umgehung:

- Gilt nur für die WebSocket-Authentifizierungsoberfläche der Control UI. HTTP-API-Endpunkte (`/v1/*`, `/tools/invoke`, `/api/channels/*` usw.) verwenden niemals die Authentifizierung über Tailscale-Identitäts-Header; sie folgen immer dem normalen HTTP-Authentifizierungsmodus des Gateway.
- Bei Control-UI-Operatorsitzungen, die bereits eine Browsergeräteidentität enthalten, überspringt eine verifizierte Tailscale-Identität den Umlauf zur Kopplung per Bootstrap-Token/QR-Code.
- Die Geräteidentität selbst wird dadurch nicht umgangen: Clients ohne Gerät werden weiterhin abgewiesen, und Verbindungen mit Node-Rolle durchlaufen weiterhin die normalen Kopplungs- und Authentifizierungsprüfungen.

## Hinweise

- Tailscale Serve/Funnel setzt voraus, dass die `tailscale`-CLI installiert und angemeldet ist.
- `tailscale.mode: "funnel"` verweigert den Start, wenn der Authentifizierungsmodus nicht `password` ist, um eine öffentliche Exposition zu vermeiden.
- `gateway.tailscale.serviceName` gilt nur für den Serve-Modus und wird an `tailscale serve --service=<name>` übergeben. Der Wert muss das Tailscale-Format `svc:<dns-label>` verwenden, zum Beispiel `svc:openclaw`. Tailscale setzt voraus, dass Service-Hosts mit Tags versehene Nodes sind, und der Service muss möglicherweise in der Administrationskonsole genehmigt werden, bevor Serve ihn veröffentlichen kann.
- `gateway.tailscale.resetOnExit` macht die Konfiguration von `tailscale serve`/`tailscale funnel` beim Herunterfahren rückgängig.
- `gateway.tailscale.preserveFunnel: true` erhält eine extern konfigurierte `tailscale funnel`-Route über Gateway-Neustarts hinweg aufrecht. Bei `mode: "serve"` prüft OpenClaw `tailscale funnel status`, bevor Serve erneut angewendet wird, und überspringt dies, wenn bereits eine Funnel-Route den Gateway-Port abdeckt. Die ausschließlich auf Passwörtern basierende Richtlinie für von OpenClaw verwaltete Funnel bleibt unverändert.
- `gateway.bind: "tailnet"` verwendet eine direkte Tailnet-Bindung (kein HTTPS, kein Serve/Funnel) sowie das erforderliche lokale `127.0.0.1`, wenn eine Tailnet-IPv4-Adresse verfügbar ist; andernfalls greift es ausschließlich auf Loopback zurück.
- `gateway.bind: "auto"` bevorzugt Loopback. Verwenden Sie `tailnet`, um die Netzwerkexposition auf das Tailnet zu beschränken und gleichzeitig den Loopback-Zugriff auf demselben Host beizubehalten.
- Serve/Funnel stellt nur die **Gateway-Control-UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt, daher funktioniert Serve auch für den Node-Zugriff.

### Voraussetzungen und Einschränkungen von Tailscale

- Serve setzt voraus, dass HTTPS für Ihr Tailnet aktiviert ist; die CLI fordert Sie dazu auf, wenn es fehlt.
- Serve fügt Tailscale-Identitäts-Header ein; Funnel nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt über TLS nur die Ports `443`, `8443` und `10000`.
- Funnel unter macOS erfordert die Open-Source-Variante der Tailscale-App.

## Browsersteuerung (entferntes Gateway + lokaler Browser)

Um das Gateway auf einem Computer auszuführen, aber einen Browser auf einem anderen zu steuern, führen Sie einen **Node-Host** auf dem Browsercomputer aus und belassen Sie beide im selben Tailnet. Das Gateway leitet Browseraktionen an die Node weiter; ein separater Steuerungsserver oder eine Serve-URL ist nicht erforderlich.

Vermeiden Sie Funnel für die Browsersteuerung; behandeln Sie die Node-Kopplung wie einen Operatorzugriff.

## Weitere Informationen

- Übersicht zu Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Übersicht zu Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Verwandte Themen

- [Remote-Zugriff](/de/gateway/remote)
- [Erkennung](/de/gateway/discovery)
- [Authentifizierung](/de/gateway/authentication)

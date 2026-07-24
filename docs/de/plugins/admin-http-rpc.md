---
read_when:
    - Erstellen von Host-Tools, die den Gateway-WebSocket-RPC-Client nicht verwenden können
    - Gateway-Admin-Automatisierung hinter einem privaten vertrauenswürdigen Ingress bereitstellen
    - Audit des Sicherheitsmodells für den HTTP-Zugriff auf Gateway-Methoden
summary: Ausgewählte Methoden der Gateway-Steuerungsebene über das gebündelte, optional aktivierbare Plugin admin-http-rpc bereitstellen
title: Plugin für Admin-HTTP-RPC
x-i18n:
    generated_at: "2026-07-24T04:44:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Das gebündelte Plugin `admin-http-rpc` stellt eine auf einer Zulassungsliste geführte Gruppe von Gateway-Control-Plane-Methoden über HTTP bereit. Es ist für vertrauenswürdige Host-Automatisierungen vorgesehen, die keine Gateway-WebSocket-Verbindung offen halten können.

Es wird mit OpenClaw ausgeliefert, ist aber standardmäßig deaktiviert; im deaktivierten Zustand wird die Route nicht registriert. Wenn es aktiviert ist, fügt es `POST /api/v1/admin/rpc` auf demselben Listener wie das Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`) hinzu.

Aktivieren Sie es nur für private Host-Werkzeuge, Tailnet-Automatisierungen oder einen vertrauenswürdigen internen Ingress. Stellen Sie diese Route niemals direkt im öffentlichen Internet bereit.

## Vor der Aktivierung

Admin-HTTP-RPC ist eine vollständige Betreiber-Control-Plane-Oberfläche: Jeder Aufrufer, der die Gateway-HTTP-Authentifizierung besteht, kann die unten aufgeführten Methoden der Zulassungsliste aufrufen. Aktivieren Sie es nur, wenn alle folgenden Bedingungen erfüllt sind:

- Der Aufrufer ist vertrauenswürdig und darf das Gateway betreiben.
- Der Aufrufer kann den WebSocket-RPC-Client nicht verwenden.
- Die Route ist nur über Loopback, ein Tailnet oder einen privaten authentifizierten Ingress erreichbar.
- Sie haben die zulässigen Methoden geprüft und sie entsprechen der geplanten Automatisierung.

Verwenden Sie stattdessen WebSocket-RPC für OpenClaw-Clients und interaktive Werkzeuge, die eine Gateway-WebSocket-Verbindung offen halten können.

## Aktivieren

Aktivieren Sie das gebündelte Plugin:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Konfiguration">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Die Route wird beim Start des Plugins registriert. Starten Sie daher das Gateway neu, nachdem Sie die Plugin-Konfiguration geändert haben.

Deaktivieren Sie es, sobald Sie die HTTP-Oberfläche nicht mehr benötigen:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Route überprüfen

Verwenden Sie `health` als kleinste sichere Anfrage:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Eine erfolgreiche Antwort enthält `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Wenn das Plugin deaktiviert ist, gibt die Route `404` zurück, da sie nicht registriert ist.

## Authentifizierung

Die Plugin-Route verwendet die Gateway-HTTP-Authentifizierung.

Übliche Authentifizierungswege:

- Authentifizierung mit gemeinsamem Geheimnis (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`): Leiten Sie die Anfrage über den konfigurierten identitätsbewussten Proxy und lassen Sie ihn die erforderlichen Identitäts-Header einfügen
- offene Authentifizierung über privaten Ingress (`gateway.auth.mode="none"`): kein Authentifizierungs-Header erforderlich

## Sicherheitsmodell

Behandeln Sie dieses Plugin als vollständige Gateway-Betreiberoberfläche.

- Durch die Aktivierung des Plugins wird absichtlich der Zugriff auf die Admin-RPC-Methoden der Zulassungsliste unter `/api/v1/admin/rpc` ermöglicht.
- Das Plugin deklariert den reservierten Manifest-Vertrag `contracts.gatewayMethodDispatch: ["authenticated-request"]`. Dadurch kann seine Gateway-authentifizierte HTTP-Route Control-Plane-Methoden prozessintern weiterleiten. Dies ist keine Sandbox: Der Vertrag verhindert die versehentliche Verwendung reservierter SDK-Hilfsfunktionen, vertrauenswürdige Plugins werden jedoch weiterhin im Gateway-Prozess ausgeführt.
- Die Bearer-Authentifizierung mit gemeinsamem Geheimnis (Modi `token`/`password`) weist den Besitz des Gateway-Betreibergeheimnisses nach; enger gefasste `x-openclaw-scopes`-Header werden auf diesem Pfad ignoriert und die normalen vollständigen Betreiberstandards werden wiederhergestellt.
- Die vertrauenswürdige identitätstragende HTTP-Authentifizierung (Modus `trusted-proxy`) berücksichtigt `x-openclaw-scopes`, sofern vorhanden.
- `gateway.auth.mode="none"` bedeutet, dass diese Route bei aktiviertem Plugin nicht authentifiziert ist. Verwenden Sie dies nur hinter einem privaten Ingress, dem Sie vollständig vertrauen.
- Nachdem die Authentifizierung der Plugin-Route bestanden wurde, werden Anfragen über dieselben Gateway-Methodenhandler und Bereichsprüfungen wie WebSocket-RPC weitergeleitet.
- Die Route bleibt während einer vorbereiteten Aussetzungs-Lease erreichbar. Die begrenzte Anfragevalidierung und die lokale Erkennungsantwort `commands.list` bleiben verfügbar. Von den an das Gateway weitergeleiteten Methoden dürfen bei geschlossener Zulassung nur `gateway.suspend.prepare`, `gateway.suspend.status` und `gateway.suspend.resume` ausgeführt werden; andere Methoden der Zulassungsliste geben die normale wiederholbare Gateway-Antwort `UNAVAILABLE` zurück.
- Beschränken Sie diese Route auf Loopback, ein Tailnet oder einen privaten vertrauenswürdigen Ingress. Stellen Sie sie nicht direkt im öffentlichen Internet bereit. Verwenden Sie separate Gateways, wenn Aufrufer Vertrauensgrenzen überschreiten.

## Anfrage

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Felder:

- `id` (Zeichenfolge, optional): wird in die Antwort kopiert. Wenn das Feld fehlt, wird eine UUID erzeugt.
- `method` (Zeichenfolge, erforderlich): Name einer zulässigen Gateway-Methode.
- `params` (beliebiger Typ, optional): methodenspezifische Parameter.

Die standardmäßige maximale Größe des Anfragekörpers beträgt 1 MB.

## Antwort

Erfolgreiche Antworten verwenden die Gateway-RPC-Struktur:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway-Methodenfehler verwenden:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

Der HTTP-Status richtet sich nach dem Fehlercode:

| Fehlercode                 | HTTP-Status |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| jeder andere Code          | 500         |

## Zulässige Methoden

- Erkennung: `commands.list`
  Gibt die Namen der von diesem Plugin zugelassenen HTTP-RPC-Methoden zurück.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- Konfiguration: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- Kanäle: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- Web: `web.login.start`, `web.login.wait`
- Modelle: `models.list`, `models.authStatus`
- Agenten: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- Genehmigungen: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- Geräte: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Nodes: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- Aufgaben: `tasks.list`, `tasks.get`, `tasks.cancel`
- Diagnose: `doctor.memory.status`, `update.status`

Andere Gateway-Methoden sind gesperrt, bis sie bewusst hinzugefügt werden.

## WebSocket-Vergleich

Der normale Gateway-WebSocket-RPC-Pfad bleibt die bevorzugte Control-Plane-API für OpenClaw-Clients. Verwenden Sie Admin-HTTP-RPC nur für Host-Werkzeuge, die eine HTTP-Anfrage-Antwort-Oberfläche benötigen.

WebSocket-Clients mit gemeinsamem Token und ohne vertrauenswürdige Geräteidentität können beim Verbindungsaufbau keine Admin-Bereiche selbst deklarieren. Admin-HTTP-RPC folgt bewusst dem bestehenden vertrauenswürdigen HTTP-Betre芈ermodell: Wenn das Plugin aktiviert ist, wird die Bearer-Authentifizierung mit gemeinsamem Geheimnis für diese Admin-Oberfläche als vollständiger Betreiberzugriff behandelt.

## Fehlerbehebung

`404 Not Found`

: Das Plugin ist deaktiviert, das Gateway wurde seit seiner Aktivierung nicht neu gestartet oder die Anfrage wird an einen anderen Gateway-Prozess gesendet.

`401 Unauthorized`

: Die Anfrage hat die Gateway-HTTP-Authentifizierung nicht erfüllt. Prüfen Sie das Bearer-Token oder die Identitäts-Header des vertrauenswürdigen Proxys.

`405 Method Not Allowed`

: Für die Anfrage wurde etwas anderes als `POST` verwendet.

`413 Payload Too Large`

: Der Anfragekörper hat das Limit von 1 MB überschritten.

`400 INVALID_REQUEST`

: Der Anfragekörper enthält kein gültiges JSON, das Feld `method` fehlt, die Methode steht nicht auf der Zulassungsliste des Plugins oder eine Fortsetzungs-ID für die Aussetzung stimmt nicht mit der aktiven Lease überein.

`503 UNAVAILABLE`

: Die Gateway-Methode wird gestartet, ist ratenbegrenzt, ausgesetzt oder wartet auf einen konkurrierenden Aussetzungs-/Fortsetzungsvorgang. Prüfen Sie `error.details`, sofern vorhanden, und beachten Sie `error.retryAfterMs`, bevor Sie den Versuch wiederholen.

## Verwandte Themen

- [Betreiberbereiche](/de/gateway/operator-scopes)
- [Gateway-Sicherheit](/de/gateway/security)
- [Remotezugriff](/de/gateway/remote)
- [Plugin-Manifest](/de/plugins/manifest#contracts-reference)
- [SDK-Unterpfade](/de/plugins/sdk-subpaths)

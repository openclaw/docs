---
read_when:
    - Erstellen von Host-Tools, die den Gateway-WebSocket-RPC-Client nicht verwenden können
    - Gateway-Admin-Automatisierung hinter einem privaten, vertrauenswürdigen Ingress bereitstellen
    - Audit des Sicherheitsmodells für den HTTP-Zugriff auf Gateway-Methoden
summary: Ausgewählte Methoden der Gateway-Steuerungsebene über das gebündelte, optional aktivierbare Plugin admin-http-rpc bereitstellen
title: Admin-HTTP-RPC-Plugin
x-i18n:
    generated_at: "2026-07-12T15:39:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Das gebündelte Plugin `admin-http-rpc` stellt eine Zulassungsliste von Methoden der Gateway-Steuerungsebene über HTTP bereit. Es ist für vertrauenswürdige Host-Automatisierungen vorgesehen, die keine Gateway-WebSocket-Verbindung offen halten können.

Es wird mit OpenClaw ausgeliefert, ist jedoch standardmäßig deaktiviert; im deaktivierten Zustand wird die Route nicht registriert. Wenn es aktiviert ist, fügt es `POST /api/v1/admin/rpc` auf demselben Listener wie das Gateway hinzu (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Aktivieren Sie es nur für private Host-Werkzeuge, Tailnet-Automatisierungen oder einen vertrauenswürdigen internen Ingress. Stellen Sie diese Route niemals direkt im öffentlichen Internet bereit.

## Vor der Aktivierung

Admin HTTP RPC ist eine vollständige Steuerungsebene für Operatoren: Jeder Aufrufer, der die Gateway-HTTP-Authentifizierung besteht, kann die unten aufgeführten zugelassenen Methoden aufrufen. Aktivieren Sie es nur, wenn alle folgenden Bedingungen erfüllt sind:

- Der Aufrufer ist für den Betrieb des Gateways vertrauenswürdig.
- Der Aufrufer kann den WebSocket-RPC-Client nicht verwenden.
- Die Route ist nur über Loopback, ein Tailnet oder einen privaten authentifizierten Ingress erreichbar.
- Sie haben die zulässigen Methoden geprüft und diese entsprechen der geplanten Automatisierung.

Verwenden Sie für OpenClaw-Clients und interaktive Werkzeuge, die eine Gateway-WebSocket-Verbindung offen halten können, stattdessen WebSocket RPC.

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

Die Route wird beim Start des Plugins registriert. Starten Sie daher das Gateway nach einer Änderung der Plugin-Konfiguration neu.

Deaktivieren Sie es, wenn Sie die HTTP-Schnittstelle nicht mehr benötigen:

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

Gängige Authentifizierungswege:

- Authentifizierung mit gemeinsamem Geheimnis (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`): Leiten Sie die Route über den konfigurierten identitätsbewussten Proxy und lassen Sie ihn die erforderlichen Identitäts-Header einfügen
- offene Authentifizierung an einem privaten Ingress (`gateway.auth.mode="none"`): kein Authentifizierungs-Header erforderlich

## Sicherheitsmodell

Behandeln Sie dieses Plugin als vollständige Gateway-Schnittstelle für Operatoren.

- Durch die Aktivierung des Plugins wird bewusst der Zugriff auf die zugelassenen Admin-RPC-Methoden unter `/api/v1/admin/rpc` ermöglicht.
- Das Plugin deklariert den reservierten Manifestvertrag `contracts.gatewayMethodDispatch: ["authenticated-request"]`, der es seiner Gateway-authentifizierten HTTP-Route ermöglicht, Methoden der Steuerungsebene innerhalb des Prozesses weiterzuleiten. Dies ist keine Sandbox: Der Vertrag verhindert die versehentliche Verwendung reservierter SDK-Hilfsfunktionen, aber vertrauenswürdige Plugins werden weiterhin im Gateway-Prozess ausgeführt.
- Die Bearer-Authentifizierung mit gemeinsamem Geheimnis (Modi `token`/`password`) weist den Besitz des Gateway-Operator-Geheimnisses nach; enger gefasste `x-openclaw-scopes`-Header werden auf diesem Pfad ignoriert und die normalen vollständigen Operator-Standardberechtigungen werden wiederhergestellt.
- Bei vertrauenswürdiger identitätstragender HTTP-Authentifizierung (Modus `trusted-proxy`) wird `x-openclaw-scopes` berücksichtigt, sofern vorhanden.
- `gateway.auth.mode="none"` bedeutet, dass diese Route bei aktiviertem Plugin nicht authentifiziert ist. Verwenden Sie dies nur hinter einem privaten Ingress, dem Sie vollständig vertrauen.
- Nachdem die Authentifizierung der Plugin-Route bestanden wurde, werden Anfragen über dieselben Gateway-Methodenhandler und Bereichsprüfungen wie WebSocket RPC weitergeleitet.
- Die Route bleibt während einer vorbereiteten Suspendierungs-Lease erreichbar. Begrenzte Anfragevalidierung und die lokale Discovery-Antwort von `commands.list` bleiben verfügbar. Von den an das Gateway weitergeleiteten Methoden dürfen nur `gateway.suspend.prepare`, `gateway.suspend.status` und `gateway.suspend.resume` ausgeführt werden, während die Annahme geschlossen ist; andere zugelassene Methoden geben die normale wiederholbare Gateway-Antwort `UNAVAILABLE` zurück.
- Beschränken Sie diese Route auf Loopback, ein Tailnet oder einen privaten vertrauenswürdigen Ingress. Stellen Sie sie nicht direkt im öffentlichen Internet bereit. Verwenden Sie getrennte Gateways, wenn Aufrufer Vertrauensgrenzen überschreiten.

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

- `id` (Zeichenfolge, optional): wird in die Antwort kopiert. Wenn sie fehlt, wird eine UUID generiert.
- `method` (Zeichenfolge, erforderlich): Name einer zulässigen Gateway-Methode.
- `params` (beliebiger Typ, optional): methodenspezifische Parameter.

Die standardmäßige maximale Größe des Anfragekörpers beträgt 1 MB.

## Antwort

Erfolgreiche Antworten verwenden das Gateway-RPC-Format:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Fehler von Gateway-Methoden verwenden:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "ungültige Parameter"
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

- Discovery: `commands.list`
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

Andere Gateway-Methoden werden blockiert, bis sie bewusst hinzugefügt werden.

## WebSocket-Vergleich

Der normale Gateway-WebSocket-RPC-Pfad bleibt die bevorzugte API der Steuerungsebene für OpenClaw-Clients. Verwenden Sie Admin HTTP RPC nur für Host-Werkzeuge, die eine HTTP-Schnittstelle nach dem Anfrage-Antwort-Prinzip benötigen.

WebSocket-Clients mit gemeinsamem Token ohne vertrauenswürdige Geräteidentität können während der Verbindungsherstellung nicht selbst Admin-Berechtigungsbereiche deklarieren. Admin HTTP RPC folgt bewusst dem bestehenden vertrauenswürdigen HTTP-Operatormodell: Wenn das Plugin aktiviert ist, wird die Bearer-Authentifizierung mit gemeinsamem Geheimnis für diese Admin-Schnittstelle als vollständiger Operatorzugriff behandelt.

## Fehlerbehebung

`404 Not Found`

: Das Plugin ist deaktiviert, das Gateway wurde seit der Aktivierung nicht neu gestartet oder die Anfrage wird an einen anderen Gateway-Prozess gesendet.

`401 Unauthorized`

: Die Anfrage hat die Gateway-HTTP-Authentifizierung nicht erfüllt. Prüfen Sie das Bearer-Token oder die Identitäts-Header des vertrauenswürdigen Proxys.

`405 Method Not Allowed`

: Die Anfrage hat etwas anderes als `POST` verwendet.

`413 Payload Too Large`

: Der Anfragekörper hat die Grenze von 1 MB überschritten.

`400 INVALID_REQUEST`

: Der Anfragekörper ist kein gültiges JSON, das Feld `method` fehlt, die Methode befindet sich nicht auf der Zulassungsliste des Plugins oder eine ID für die Wiederaufnahme nach einer Suspendierung stimmt nicht mit der aktiven Lease überein.

`503 UNAVAILABLE`

: Die Gateway-Methode wird gestartet, ist ratenbegrenzt, suspendiert oder wartet auf einen konkurrierenden Suspendierungs-/Wiederaufnahmevorgang. Prüfen Sie `error.details`, sofern vorhanden, und berücksichtigen Sie `error.retryAfterMs`, bevor Sie es erneut versuchen.

## Verwandte Themen

- [Operator-Berechtigungsbereiche](/de/gateway/operator-scopes)
- [Gateway-Sicherheit](/de/gateway/security)
- [Remotezugriff](/de/gateway/remote)
- [Plugin-Manifest](/de/plugins/manifest#contracts-reference)
- [SDK-Unterpfade](/de/plugins/sdk-subpaths)

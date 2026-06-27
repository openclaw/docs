---
read_when:
    - Host-Tools erstellen, die den Gateway-WebSocket-RPC-Client nicht verwenden können
    - Gateway-Admin-Automatisierung hinter einem privaten, vertrauenswürdigen Ingress bereitstellen
    - Überprüfung des Sicherheitsmodells für HTTP-Zugriff auf Gateway-Methoden
summary: Ausgewählte Gateway-Control-Plane-Methoden über das gebündelte, optionale admin-http-rpc-Plugin verfügbar machen
title: Admin-HTTP-RPC-Plugin
x-i18n:
    generated_at: "2026-06-27T17:44:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Das gebündelte `admin-http-rpc`-Plugin stellt ausgewählte Gateway-Control-Plane-Methoden über HTTP für vertrauenswürdige Host-Automatisierung bereit, die den normalen Gateway-WebSocket-RPC-Client nicht verwenden kann.

Das Plugin ist in OpenClaw enthalten, aber standardmäßig deaktiviert. Wenn es deaktiviert ist, wird die Route nicht registriert. Wenn es aktiviert ist, fügt es hinzu:

- `POST /api/v1/admin/rpc`
- derselbe Listener wie das Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Aktivieren Sie es nur für private Host-Tools, Tailnet-Automatisierung oder einen vertrauenswürdigen internen Ingress. Stellen Sie diese Route nicht direkt dem öffentlichen Internet bereit.

## Bevor Sie es aktivieren

Admin-HTTP-RPC ist eine vollständige Operator-Control-Plane-Oberfläche. Jeder Aufrufer, der die Gateway-HTTP-Authentifizierung besteht, kann die auf dieser Seite zugelassenen Methoden aufrufen.

Verwenden Sie es, wenn alle folgenden Punkte zutreffen:

- Dem Aufrufer wird vertraut, das Gateway zu betreiben.
- Der Aufrufer kann den WebSocket-RPC-Client nicht verwenden.
- Die Route ist nur über Loopback, ein Tailnet oder einen privaten authentifizierten Ingress erreichbar.
- Sie haben die zulässigen Methoden geprüft, und sie passen zu der Automatisierung, die Sie ausführen möchten.

Verwenden Sie den WebSocket-RPC-Pfad für OpenClaw-Clients und interaktive Tools, die eine Gateway-WebSocket-Verbindung offen halten können.

## Aktivieren

Aktivieren Sie das gebündelte Plugin:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
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

Die Route wird während des Plugin-Starts registriert. Starten Sie das Gateway nach Änderungen an der Plugin-Konfiguration neu.

Deaktivieren Sie es, wenn Sie die HTTP-Oberfläche nicht mehr benötigen:

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

Wenn das Plugin deaktiviert ist, gibt die Route `404` zurück, weil sie nicht registriert ist.

## Authentifizierung

Die Plugin-Route verwendet die Gateway-HTTP-Authentifizierung.

Gängige Authentifizierungspfade:

- Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`): Leiten Sie über den konfigurierten identitätsbewussten Proxy weiter und lassen Sie ihn die erforderlichen Identitäts-Header einfügen
- offene Authentifizierung über privaten Ingress (`gateway.auth.mode="none"`): kein Authentifizierungs-Header erforderlich

## Sicherheitsmodell

Behandeln Sie dieses Plugin als vollständige Gateway-Operator-Oberfläche.

- Das Aktivieren des Plugins bietet absichtlich Zugriff auf die zugelassenen Admin-RPC-Methoden unter `/api/v1/admin/rpc`.
- Das Plugin deklariert den reservierten Manifest-Vertrag `contracts.gatewayMethodDispatch: ["authenticated-request"]`, damit seine über Gateway authentifizierte HTTP-Route Control-Plane-Methoden im Prozess dispatchen kann.
- Shared-Secret-Bearer-Authentifizierung weist den Besitz des Gateway-Operator-Geheimnisses nach.
- Für `token`- und `password`-Authentifizierung werden engere `x-openclaw-scopes`-Header ignoriert, und die normalen vollständigen Operator-Standards werden wiederhergestellt.
- Vertrauenswürdige identitätstragende HTTP-Modi berücksichtigen `x-openclaw-scopes`, wenn vorhanden.
- `gateway.auth.mode="none"` bedeutet, dass diese Route nicht authentifiziert ist, wenn das Plugin aktiviert ist. Verwenden Sie dies nur hinter einem privaten Ingress, dem Sie vollständig vertrauen.
- Anfragen werden nach bestandener Authentifizierung der Plugin-Route über dieselben Gateway-Methodenhandler und Scope-Prüfungen wie WebSocket-RPC dispatcht.
- Halten Sie diese Route auf Loopback, Tailnet oder einem privaten vertrauenswürdigen Ingress. Stellen Sie sie nicht direkt dem öffentlichen Internet bereit.
- Plugin-Manifest-Verträge sind keine Sandbox. Sie verhindern die versehentliche Nutzung reservierter SDK-Helfer; vertrauenswürdige Plugins laufen dennoch im Gateway-Prozess.

Verwenden Sie getrennte Gateways, wenn Aufrufer Vertrauensgrenzen überschreiten.

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

- `id` (String, optional): wird in die Antwort kopiert. Eine UUID wird generiert, wenn es weggelassen wird.
- `method` (String, erforderlich): zulässiger Gateway-Methodenname.
- `params` (beliebig, optional): methodenspezifische Parameter.

Die standardmäßige maximale Größe des Anfragekörpers beträgt 1 MB.

## Antwort

Erfolgsantworten verwenden die Gateway-RPC-Form:

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

Der HTTP-Status folgt nach Möglichkeit dem Gateway-Fehler. Zum Beispiel gibt `INVALID_REQUEST` `400` zurück, und `UNAVAILABLE` gibt `503` zurück.

## Zulässige Methoden

- Discovery: `commands.list`
  Gibt die von diesem Plugin zugelassenen HTTP-RPC-Methodennamen zurück.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- Konfiguration: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- Kanäle: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- Web: `web.login.start`, `web.login.wait`
- Modelle: `models.list`, `models.authStatus`
- Agents: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- Freigaben: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- Geräte: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Nodes: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- Aufgaben: `tasks.list`, `tasks.get`, `tasks.cancel`
- Diagnose: `doctor.memory.status`, `update.status`

Andere Gateway-Methoden werden blockiert, bis sie absichtlich hinzugefügt werden.

## WebSocket-Vergleich

Der normale Gateway-WebSocket-RPC-Pfad bleibt die bevorzugte Control-Plane-API für OpenClaw-Clients. Verwenden Sie Admin-HTTP-RPC nur für Host-Tools, die eine Anfrage/Antwort-HTTP-Oberfläche benötigen.

Shared-Token-WebSocket-Clients ohne vertrauenswürdige Geräteidentität können beim Verbindungsaufbau keine Admin-Scopes selbst deklarieren. Admin-HTTP-RPC folgt bewusst dem bestehenden vertrauenswürdigen HTTP-Operator-Modell: Wenn das Plugin aktiviert ist, wird Shared-Secret-Bearer-Authentifizierung für diese Admin-Oberfläche als vollständiger Operator-Zugriff behandelt.

## Fehlerbehebung

`404 Not Found`

: Das Plugin ist deaktiviert, das Gateway wurde seit der Aktivierung nicht neu gestartet, oder die Anfrage geht an einen anderen Gateway-Prozess.

`401 Unauthorized`

: Die Anfrage hat die Gateway-HTTP-Authentifizierung nicht erfüllt. Prüfen Sie das Bearer-Token oder die Identitäts-Header des trusted-proxy.

`400 INVALID_REQUEST`

: Der Anfragekörper ist kein gültiges JSON, das Feld `method` fehlt, oder die Methode steht nicht in der Zulassungsliste des Plugins.

`503 UNAVAILABLE`

: Der Gateway-Methodenhandler ist nicht verfügbar. Prüfen Sie die Gateway-Logs und versuchen Sie es erneut, nachdem das Gateway den Start abgeschlossen hat.

## Verwandte Themen

- [Operator-Scopes](/de/gateway/operator-scopes)
- [Gateway-Sicherheit](/de/gateway/security)
- [Remote-Zugriff](/de/gateway/remote)
- [Plugin-Manifest](/de/plugins/manifest#contracts)
- [SDK-Unterpfade](/de/plugins/sdk-subpaths)

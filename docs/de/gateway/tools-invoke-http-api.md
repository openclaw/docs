---
read_when:
    - Tools aufrufen, ohne einen vollständigen Agent-Durchlauf auszuführen
    - Automatisierungen erstellen, die die Durchsetzung von Tool-Richtlinien erfordern
summary: Ein einzelnes Tool direkt über den Gateway-HTTP-Endpunkt aufrufen
title: Tools rufen die API auf
x-i18n:
    generated_at: "2026-07-24T05:05:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaws Gateway stellt einen HTTP-Endpunkt bereit, um ein einzelnes Tool direkt aufzurufen. Er ist immer aktiviert und verwendet die Gateway-Authentifizierung sowie die Tool-Richtlinie. Wie bei der OpenAI-kompatiblen `/v1/*`-Oberfläche wird die Bearer-Authentifizierung mit einem gemeinsamen Geheimnis als vertrauenswürdiger Operatorzugriff auf das gesamte Gateway behandelt.

- `POST /tools/invoke`
- Derselbe Port wie das Gateway (WS- und HTTP-Multiplexing): `http://<gateway-host>:<port>/tools/invoke`
- Standardmäßige maximale Größe des Anfragekörpers: 2 MB

## Authentifizierung

Verwendet die Authentifizierungskonfiguration des Gateways.

Übliche HTTP-Authentifizierungswege:

- Authentifizierung mit gemeinsamem Geheimnis (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`): über den konfigurierten identitätsbewussten Proxy weiterleiten und von diesem die erforderlichen Identitäts-Header einfügen lassen
- offene Authentifizierung bei privatem Eingang (`gateway.auth.mode="none"`): kein Authentifizierungs-Header erforderlich

Hinweise:

- `mode="token"` verwendet `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- `mode="password"` verwendet `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- `mode="trusted-proxy"` setzt voraus, dass die HTTP-Anfrage von einer konfigurierten vertrauenswürdigen Proxy-Quelle stammt; Loopback-Proxys auf demselben Host erfordern ausdrücklich `gateway.auth.trustedProxy.allowLoopback = true`.
- Interne Aufrufer auf demselben Host, die den Proxy umgehen, können `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` als lokalen direkten Rückfallmechanismus verwenden. Jegliche Header-Nachweise durch `Forwarded`, `X-Forwarded-*` oder `X-Real-IP` belassen die Anfrage stattdessen auf dem Pfad des vertrauenswürdigen Proxys.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsfehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollständigem Operatorzugriff** für die Gateway-Instanz.

- Die HTTP-Bearer-Authentifizierung ist hier kein eng begrenztes Berechtigungsmodell pro Benutzer.
- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt ist wie ein Zugangsnachweis des Eigentümers/Operators zu behandeln.
- Bei Authentifizierungsmodi mit gemeinsamem Geheimnis (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operatorstandardwerte wieder her, selbst wenn der Aufrufer einen enger gefassten `x-openclaw-scopes`-Header sendet.
- Bei der Authentifizierung mit gemeinsamem Geheimnis werden direkte Tool-Aufrufe an diesem Endpunkt außerdem als Interaktionen eines Eigentümer-Absenders behandelt.
- Vertrauenswürdige identitätstragende HTTP-Modi (Authentifizierung über einen vertrauenswürdigen Proxy oder `gateway.auth.mode="none"` bei einem privaten Eingang) berücksichtigen `x-openclaw-scopes`, sofern vorhanden, und greifen andernfalls auf den normalen Satz standardmäßiger Operatorberechtigungen zurück.
- Beschränken Sie diesen Endpunkt auf Loopback/Tailnet/private Eingänge; stellen Sie ihn nicht direkt im öffentlichen Internet bereit.

Authentifizierungsmatrix:

| Authentifizierungsmodus                                                               | Verhalten                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` oder `password` + `Authorization: Bearer ...`                                     | Weist den Besitz des gemeinsamen Operatorgeheimnisses des Gateways nach. Ignoriert einen enger gefassten `x-openclaw-scopes`. Stellt den vollständigen Satz standardmäßiger Operatorberechtigungen wieder her: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Behandelt direkte Tool-Aufrufe als Interaktionen eines Eigentümer-Absenders. |
| Vertrauenswürdiges identitätstragendes HTTP (Authentifizierung über einen vertrauenswürdigen Proxy oder `mode="none"` bei einem privaten Eingang) | Authentifiziert eine äußere vertrauenswürdige Identität oder Bereitstellungsgrenze. Berücksichtigt `x-openclaw-scopes`, sofern vorhanden. Greift auf den normalen Satz standardmäßiger Operatorberechtigungen zurück, wenn der Header fehlt. Die Eigentümersemantik entfällt nur, wenn der Aufrufer die Berechtigungen ausdrücklich einschränkt und `operator.admin` auslässt.                               |

## Anfragekörper

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Felder:

- `tool` / `name` (Zeichenfolge, erforderlich): Name des aufzurufenden Tools. `name` hat Vorrang, wenn beide gesendet werden.
- `action` (Zeichenfolge, optional): wird in `args.action` eingefügt, wenn das Tool-Schema eine `action`-Eigenschaft unterstützt und `args` noch keine festgelegt hat.
- `args` (Objekt, optional): Tool-spezifische Argumente.
- `sessionKey` (Zeichenfolge, optional): Schlüssel der Zielsitzung. Falls ausgelassen oder `"main"`, verwendet das Gateway den konfigurierten Schlüssel der Hauptsitzung (berücksichtigt `session.mainKey` und den Standard-Agenten oder `global` im globalen Sitzungsbereich).
- `agentId` (Zeichenfolge, optional): löst den Sitzungsschlüssel für diesen Agenten auf. Führt zu einem Fehler mit `400`, wenn ein Konflikt mit einem expliziten `sessionKey` besteht, der bereits einem anderen Agenten zugeordnet ist.
- `idempotencyKey` (Zeichenfolge, optional): wird verwendet, um eine stabile Tool-Aufruf-ID für den Aufruf abzuleiten.
- `dryRun` (boolescher Wert, optional): für zukünftige Verwendung reserviert; wird derzeit ignoriert.

## Richtlinien- und Routingverhalten

Die Tool-Verfügbarkeit wird durch dieselbe Richtlinienkette gefiltert, die von Gateway-Agenten verwendet wird:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- Gruppenrichtlinien (wenn der Sitzungsschlüssel einer Gruppe oder einem Kanal zugeordnet ist)
- Subagentenrichtlinie (beim Aufruf mit dem Sitzungsschlüssel eines Subagenten)

Wenn ein Tool durch die Richtlinie nicht zugelassen ist, gibt der Endpunkt **404** zurück.

Wichtige Hinweise zu Grenzen:

- Ausführungsgenehmigungen sind Schutzmechanismen für Operatoren, keine separate Autorisierungsgrenze für diesen HTTP-Endpunkt. Wenn ein Tool hier über Gateway-Authentifizierung und Tool-Richtlinie erreichbar ist, fügt `/tools/invoke` keine zusätzliche Genehmigungsaufforderung pro Aufruf hinzu.
- Wenn `exec` hier erreichbar ist, behandeln Sie es als verändernde Shell-Oberfläche. Das Verweigern von `write`, `edit`, `apply_patch` oder HTTP-Tools zum Schreiben in das Dateisystem macht die Shell-Ausführung nicht schreibgeschützt.
- Geben Sie Gateway-Bearer-Zugangsdaten nicht an nicht vertrauenswürdige Aufrufer weiter. Wenn Sie eine Trennung zwischen Vertrauensgrenzen benötigen, betreiben Sie separate Gateways (idealerweise unter separaten Betriebssystembenutzern/Hosts).

Gateway-HTTP wendet außerdem standardmäßig eine feste Sperrliste an (selbst wenn die Sitzungsrichtlinie das Tool zulässt):

| Tool             | Grund                                                     |
| ---------------- | --------------------------------------------------------- |
| `exec`           | Direkte Befehlsausführung (RCE-Oberfläche)                |
| `spawn`          | Beliebige Erstellung von Kindprozessen (RCE-Oberfläche)   |
| `shell`          | Ausführung von Shell-Befehlen (RCE-Oberfläche)            |
| `fs_write`       | Beliebige Dateiänderung auf dem Host                      |
| `fs_delete`      | Beliebige Dateilöschung auf dem Host                      |
| `fs_move`        | Beliebiges Verschieben/Umbenennen von Dateien auf dem Host |
| `apply_patch`    | Das Anwenden von Patches kann beliebige Dateien umschreiben |
| `sessions_spawn` | Sitzungsorchestrierung; das entfernte Starten von Agenten ist RCE |
| `sessions_send`  | Sitzungsübergreifende Nachrichteneinschleusung            |
| `cron`           | Steuerungsebene für persistente Automatisierung           |
| `gateway`        | Gateway-Steuerungsebene; verhindert die Neukonfiguration über HTTP |
| `nodes`          | Die Node-Befehlsweiterleitung kann `system.run` auf gekoppelten Hosts erreichen |

`cron`, `gateway` und `nodes` sind ebenfalls ausschließlich Eigentümern vorbehalten: Selbst außerhalb dieser Standardsperrliste können Nicht-Eigentümer sie auf dieser Oberfläche nicht aufrufen.

Passen Sie die allgemeine Sperrliste über `gateway.tools` an:

```json5
{
  gateway: {
    tools: {
      // Zusätzliche Tools, die über HTTP /tools/invoke blockiert werden sollen
      deny: ["browser"],
      // Tools für Eigentümer-/Administratoraufrufer aus der Standardsperrliste entfernen
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` ist eine Außerkraftsetzung der Exposition, keine Erweiterung der Berechtigungen. In identitätstragenden HTTP-Modi bleiben `cron`, `gateway` und `nodes` für Aufrufer ohne Eigentümer-/Administratoridentität (`operator.admin`) nicht verfügbar, selbst wenn sie in `gateway.tools.allow` aufgeführt sind. Die Bearer-Authentifizierung mit gemeinsamem Geheimnis folgt weiterhin der oben beschriebenen Regel für vollständig vertrauenswürdige Operatoren.

Damit Gruppenrichtlinien den Kontext auflösen können, können Sie optional Folgendes festlegen:

- `x-openclaw-message-channel: <channel>` (Beispiel: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wenn mehrere Konten vorhanden sind)
- `x-openclaw-message-to: <target>` (Zustellungsziel für die Richtlinie des Nachrichten-Tools)
- `x-openclaw-thread-id: <threadId>` (Thread-Kontext für die Richtlinie des Nachrichten-Tools)

## Antworten

| Status | Bedeutung                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------- |
| `200`  | `{ ok: true, result }`                                                                         |
| `400`  | `{ ok: false, error: { type, message } }` (ungültige Anfrage oder Fehler bei der Tool-Eingabe)                |
| `401`  | Nicht autorisiert                                                                              |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }` (Tool-Aufruf durch Richtlinie blockiert)     |
| `404`  | Tool nicht verfügbar (nicht gefunden oder nicht in der Zulassungsliste)                        |
| `405`  | Methode nicht zulässig                                                                         |
| `408`  | Zeitüberschreitung beim Lesen des Anfragekörpers                                                |
| `413`  | Anfragekörper hat die maximale Nutzlastgröße überschritten                                     |
| `429`  | Authentifizierung ratenbegrenzt (`Retry-After` festgelegt)                                                          |
| `500`  | `{ ok: false, error: { type, message } }` (unerwarteter Fehler bei der Tool-Ausführung; bereinigte Meldung) |

## Beispiel

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Verwandte Themen

- [Gateway-Protokoll](/de/gateway/protocol)
- [Tools und Plugins](/de/tools)

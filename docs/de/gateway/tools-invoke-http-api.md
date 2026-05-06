---
read_when:
    - Tools aufrufen, ohne einen vollständigen Agentendurchlauf auszuführen
    - Automatisierungen erstellen, die die Durchsetzung von Tool-Richtlinien erfordern
summary: Ein einzelnes Tool direkt über den Gateway-HTTP-Endpunkt aufrufen
title: API zum Aufrufen von Werkzeugen
x-i18n:
    generated_at: "2026-05-06T06:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaws Gateway stellt einen einfachen HTTP-Endpunkt bereit, um ein einzelnes Tool direkt aufzurufen. Er ist immer aktiviert und verwendet Gateway-Authentifizierung sowie Tool-Richtlinien. Wie bei der OpenAI-kompatiblen `/v1/*`-Oberfläche wird Shared-Secret-Bearer-Authentifizierung als vertrauenswürdiger Operator-Zugriff für das gesamte Gateway behandelt.

- `POST /tools/invoke`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/tools/invoke`

Die maximale Standard-Payload-Größe beträgt 2 MB.

## Authentifizierung

Verwendet die Gateway-Authentifizierungskonfiguration.

Gängige HTTP-Authentifizierungspfade:

- Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`):
  über den konfigurierten identitätsbewussten Proxy routen und ihn die
  erforderlichen Identitäts-Header injizieren lassen
- offene Authentifizierung für privaten Ingress (`gateway.auth.mode="none"`):
  kein Authentifizierungs-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gilt, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gilt, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gilt, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen; local loopback-Proxys auf demselben Host erfordern explizit
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsfehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollem Operator-Zugriff** für die Gateway-Instanz.

- HTTP-Bearer-Authentifizierung ist hier kein enges Pro-Benutzer-Berechtigungsmodell.
- Ein gültiges Gateway-Token/Passwort für diesen Endpunkt sollte wie eine Owner-/Operator-Anmeldedaten behandelt werden.
- Für Shared-Secret-Authentifizierungsmodi (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardwerte wieder her, selbst wenn der Aufrufer einen engeren `x-openclaw-scopes`-Header sendet.
- Shared-Secret-Authentifizierung behandelt direkte Tool-Aufrufe auf diesem Endpunkt außerdem als Owner-Sender-Turns.
- Vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` auf einem privaten Ingress) beachten `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf die normale Standardmenge der Operator-Berechtigungen zurück.
- Halten Sie diesen Endpunkt ausschließlich auf local loopback/Tailnet/privatem Ingress; stellen Sie ihn nicht direkt dem öffentlichen Internet bereit.

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - belegt den Besitz des gemeinsamen Gateway-Operator-Secrets
  - ignoriert engere `x-openclaw-scopes`
  - stellt die vollständige Standardmenge der Operator-Berechtigungen wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt direkte Tool-Aufrufe auf diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` auf privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Deployment-Grenze
  - beachten `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf die normale Standardmenge der Operator-Berechtigungen zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur, wenn der Aufrufer die Berechtigungen explizit einschränkt und `operator.admin` weglässt

## Request-Body

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

- `tool` (string, erforderlich): Name des aufzurufenden Tools.
- `action` (string, optional): wird in args übernommen, wenn das Tool-Schema `action` unterstützt und die args-Payload es ausgelassen hat.
- `args` (object, optional): Tool-spezifische Argumente.
- `sessionKey` (string, optional): Ziel-Session-Key. Wenn ausgelassen oder `"main"`, verwendet das Gateway den konfigurierten Haupt-Session-Key (beachtet `session.mainKey` und den Standard-Agent oder `global` im globalen Gültigkeitsbereich).
- `dryRun` (boolean, optional): für zukünftige Verwendung reserviert; wird derzeit ignoriert.

## Richtlinien- und Routing-Verhalten

Die Tool-Verfügbarkeit wird über dieselbe Richtlinienkette gefiltert, die von Gateway-Agents verwendet wird:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- Gruppenrichtlinien (wenn der Session-Key einer Gruppe oder einem Kanal zugeordnet ist)
- Subagent-Richtlinie (beim Aufruf mit einem Subagent-Session-Key)

Wenn ein Tool durch die Richtlinie nicht erlaubt ist, gibt der Endpunkt **404** zurück.

Wichtige Hinweise zur Grenze:

- Exec-Genehmigungen sind Operator-Schutzmaßnahmen, keine separate Autorisierungsgrenze für diesen HTTP-Endpunkt. Wenn ein Tool hier über Gateway-Authentifizierung + Tool-Richtlinie erreichbar ist, fügt `/tools/invoke` keine zusätzliche Pro-Aufruf-Genehmigungsabfrage hinzu.
- Geben Sie Gateway-Bearer-Anmeldedaten nicht an nicht vertrauenswürdige Aufrufer weiter. Wenn Sie Trennung über Vertrauensgrenzen hinweg benötigen, betreiben Sie separate Gateways (und idealerweise separate OS-Benutzer/Hosts).

Gateway-HTTP wendet außerdem standardmäßig eine harte Sperrliste an (auch wenn die Session-Richtlinie das Tool erlaubt):

- `exec` - direkte Befehlsausführung (RCE-Oberfläche)
- `spawn` - beliebige Erstellung von Child-Prozessen (RCE-Oberfläche)
- `shell` - Shell-Befehlsausführung (RCE-Oberfläche)
- `fs_write` - beliebige Dateiänderung auf dem Host
- `fs_delete` - beliebiges Löschen von Dateien auf dem Host
- `fs_move` - beliebiges Verschieben/Umbenennen von Dateien auf dem Host
- `apply_patch` - Patch-Anwendung kann beliebige Dateien umschreiben
- `sessions_spawn` - Session-Orchestrierung; das Remote-Starten von Agents ist RCE
- `sessions_send` - Cross-Session-Nachrichteninjektion
- `cron` - persistente Automatisierungs-Control-Plane
- `gateway` - Gateway-Control-Plane; verhindert Rekonfiguration über HTTP
- `nodes` - Node-Befehlsweiterleitung kann `system.run` auf gekoppelten Hosts erreichen
- `whatsapp_login` - interaktive Einrichtung, die einen Terminal-QR-Scan erfordert; hängt über HTTP

Sie können diese Sperrliste über `gateway.tools` anpassen:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Damit Gruppenrichtlinien Kontext auflösen können, können Sie optional festlegen:

- `x-openclaw-message-channel: <channel>` (Beispiel: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wenn mehrere Konten vorhanden sind)

## Antworten

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (ungültige Anfrage oder Tool-Eingabefehler)
- `401` → nicht autorisiert
- `429` → Authentifizierung ratenbegrenzt (`Retry-After` gesetzt)
- `404` → Tool nicht verfügbar (nicht gefunden oder nicht auf Allowlist)
- `405` → Methode nicht erlaubt
- `500` → `{ ok: false, error: { type, message } }` (unerwarteter Tool-Ausführungsfehler; bereinigte Nachricht)

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

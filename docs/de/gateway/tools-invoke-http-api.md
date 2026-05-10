---
read_when:
    - Tools aufrufen, ohne einen vollständigen Agenten-Durchlauf auszuführen
    - Automatisierungen erstellen, die die Durchsetzung von Tool-Richtlinien erfordern
summary: Ein einzelnes Tool direkt über den Gateway-HTTP-Endpunkt aufrufen
title: API zum Aufrufen von Werkzeugen
x-i18n:
    generated_at: "2026-05-10T19:38:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 531e77673fb9c06d0cc8f8145d874e22f7e590dc3e4c5dee1574874af5666886
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway stellt einen einfachen HTTP-Endpunkt bereit, um ein einzelnes Tool direkt aufzurufen. Er ist immer aktiviert und verwendet Gateway-Authentifizierung plus Tool-Richtlinie. Wie bei der OpenAI-kompatiblen `/v1/*`-Schnittstelle wird Bearer-Authentifizierung mit gemeinsamem Secret als vertrauenswürdiger Operator-Zugriff für den gesamten Gateway behandelt.

- `POST /tools/invoke`
- Derselbe Port wie der Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/tools/invoke`

Die standardmäßige maximale Payload-Größe beträgt 2 MB.

## Authentifizierung

Verwendet die Gateway-Authentifizierungskonfiguration.

Gängige HTTP-Authentifizierungspfade:

- Authentifizierung mit gemeinsamem Secret (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`):
  über den konfigurierten identitätsbewussten Proxy routen und ihn die
  erforderlichen Identitäts-Header einfügen lassen
- offene Authentifizierung für privaten Ingress (`gateway.auth.mode="none"`):
  kein Authentifizierungs-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` ist, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` ist, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` ist, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen; Same-Host-Loopback-Proxys erfordern explizit
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Authentifizierungsfehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Schnittstelle mit **vollständigem Operator-Zugriff** für die Gateway-Instanz.

- HTTP-Bearer-Authentifizierung ist hier kein enges Pro-Benutzer-Scope-Modell.
- Ein gültiges Gateway-Token/Passwort für diesen Endpunkt sollte wie ein Owner-/Operator-Zugangsdatenwert behandelt werden.
- Bei Authentifizierungsmodi mit gemeinsamem Secret (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardeinstellungen wieder her, auch wenn der Aufrufer einen engeren `x-openclaw-scopes`-Header sendet.
- Authentifizierung mit gemeinsamem Secret behandelt direkte Tool-Aufrufe auf diesem Endpunkt außerdem als Turns mit Owner als Sender.
- Vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf den normalen Operator-Standard-Scope-Satz zurück.
- Halten Sie diesen Endpunkt nur auf Loopback/Tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt den vollständigen Standard-Operator-Scope-Satz wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt direkte Tool-Aufrufe auf diesem Endpunkt als Turns mit Owner als Sender
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` auf privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Deployment-Grenze
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf den normalen Operator-Standard-Scope-Satz zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur, wenn der Aufrufer Scopes explizit einschränkt und `operator.admin` auslässt

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

- `tool` (String, erforderlich): Name des aufzurufenden Tools.
- `action` (String, optional): wird in args abgebildet, wenn das Tool-Schema `action` unterstützt und die args-Payload es ausgelassen hat.
- `args` (Objekt, optional): Tool-spezifische Argumente.
- `sessionKey` (String, optional): Ziel-Session-Key. Wenn ausgelassen oder `"main"`, verwendet der Gateway den konfigurierten Main-Session-Key (berücksichtigt `session.mainKey` und den Standard-Agenten, oder `global` im globalen Scope).
- `dryRun` (Boolesch, optional): für zukünftige Verwendung reserviert; derzeit ignoriert.

## Richtlinien- und Routing-Verhalten

Die Tool-Verfügbarkeit wird über dieselbe Richtlinienkette gefiltert, die von Gateway-Agenten verwendet wird:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- Gruppenrichtlinien (wenn der Session-Key einer Gruppe oder einem Kanal zugeordnet ist)
- Subagent-Richtlinie (beim Aufruf mit einem Subagent-Session-Key)

Wenn ein Tool durch die Richtlinie nicht erlaubt ist, gibt der Endpunkt **404** zurück.

Wichtige Hinweise zur Grenze:

- Exec-Genehmigungen sind Operator-Leitplanken, keine separate Autorisierungsgrenze für diesen HTTP-Endpunkt. Wenn ein Tool hier über Gateway-Authentifizierung + Tool-Richtlinie erreichbar ist, fügt `/tools/invoke` keine zusätzliche Pro-Aufruf-Genehmigungsabfrage hinzu.
- Wenn `exec` hier erreichbar ist, behandeln Sie es als mutierende Shell-Schnittstelle. Das Verweigern von `write`, `edit`, `apply_patch` oder HTTP-Dateisystem-Schreibtools macht Shell-Ausführung nicht schreibgeschützt.
- Teilen Sie Gateway-Bearer-Zugangsdaten nicht mit nicht vertrauenswürdigen Aufrufern. Wenn Sie Trennung über Vertrauensgrenzen hinweg benötigen, betreiben Sie separate Gateways (und idealerweise separate OS-Benutzer/Hosts).

Gateway-HTTP wendet standardmäßig außerdem eine harte Sperrliste an (auch wenn die Session-Richtlinie das Tool erlaubt):

- `exec` - direkte Befehlsausführung (RCE-Schnittstelle)
- `spawn` - beliebige Erstellung von Kindprozessen (RCE-Schnittstelle)
- `shell` - Shell-Befehlsausführung (RCE-Schnittstelle)
- `fs_write` - beliebige Dateimutation auf dem Host
- `fs_delete` - beliebiges Löschen von Dateien auf dem Host
- `fs_move` - beliebiges Verschieben/Umbenennen von Dateien auf dem Host
- `apply_patch` - Patch-Anwendung kann beliebige Dateien überschreiben
- `sessions_spawn` - Session-Orchestrierung; Remote-Starten von Agenten ist RCE
- `sessions_send` - sitzungsübergreifende Nachrichteninjektion
- `cron` - persistente Automatisierungs-Steuerungsebene
- `gateway` - Gateway-Steuerungsebene; verhindert Rekonfiguration über HTTP
- `nodes` - Node-Befehlsweiterleitung kann `system.run` auf gekoppelten Hosts erreichen
- `whatsapp_login` - interaktive Einrichtung, die einen Terminal-QR-Scan erfordert; hängt bei HTTP

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

Um Gruppenrichtlinien beim Auflösen von Kontext zu helfen, können Sie optional setzen:

- `x-openclaw-message-channel: <channel>` (Beispiel: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wenn mehrere Konten existieren)

## Antworten

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (ungültige Anfrage oder Tool-Eingabefehler)
- `401` → nicht autorisiert
- `429` → Authentifizierung ratenbegrenzt (`Retry-After` gesetzt)
- `404` → Tool nicht verfügbar (nicht gefunden oder nicht auf der Allowlist)
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

## Verwandt

- [Gateway-Protokoll](/de/gateway/protocol)
- [Tools und Plugins](/de/tools)

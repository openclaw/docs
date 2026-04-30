---
read_when:
    - Tools aufrufen, ohne einen vollständigen Agenten-Durchlauf auszuführen
    - Automatisierungen erstellen, die eine Durchsetzung von Tool-Richtlinien erfordern
summary: Ein einzelnes Tool direkt über den Gateway-HTTP-Endpunkt aufrufen
title: Werkzeuge rufen die API auf
x-i18n:
    generated_at: "2026-04-30T06:57:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# Tools-Aufruf (HTTP)

Der Gateway von OpenClaw stellt einen einfachen HTTP-Endpunkt bereit, um ein einzelnes Tool direkt aufzurufen. Er ist immer aktiviert und verwendet Gateway-Authentifizierung sowie Tool-Richtlinien. Wie bei der OpenAI-kompatiblen `/v1/*`-Oberfläche wird Shared-Secret-Bearer-Authentifizierung als vertrauenswürdiger Operator-Zugriff für den gesamten Gateway behandelt.

- `POST /tools/invoke`
- Derselbe Port wie der Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/tools/invoke`

Die standardmäßige maximale Payload-Größe beträgt 2 MB.

## Authentifizierung

Verwendet die Gateway-Auth-Konfiguration.

Gängige HTTP-Auth-Pfade:

- Shared-Secret-Auth (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Auth (`gateway.auth.mode="trusted-proxy"`):
  über den konfigurierten identitätsbewussten Proxy routen und die erforderlichen
  Identitäts-Header von ihm einfügen lassen
- offene Authentifizierung über privaten Ingress (`gateway.auth.mode="none"`):
  kein Auth-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gilt, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gilt, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gilt, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle stammen; Loopback-Proxys auf demselben Host erfordern explizit
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Auth-Fehlschläge auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollem Operator-Zugriff** für die Gateway-Instanz.

- HTTP-Bearer-Auth ist hier kein enges Scope-Modell pro Benutzer.
- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt sollte wie ein Owner-/Operator-Zugangsdaten behandelt werden.
- Für Shared-Secret-Auth-Modi (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardwerte wieder her, selbst wenn der Aufrufer einen engeren `x-openclaw-scopes`-Header sendet.
- Shared-Secret-Auth behandelt außerdem direkte Tool-Aufrufe an diesem Endpunkt als Owner-Sender-Turns.
- Vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf den normalen Operator-Standard-Scope-Satz zurück.
- Halten Sie diesen Endpunkt nur auf Loopback/Tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Auth-Matrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt den vollständigen Standard-Operator-Scope-Satz wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt direkte Tool-Aufrufe an diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"` auf privatem Ingress)
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
- `action` (String, optional): wird in Args übernommen, wenn das Tool-Schema `action` unterstützt und die Args-Payload es ausgelassen hat.
- `args` (Objekt, optional): toolspezifische Argumente.
- `sessionKey` (String, optional): Ziel-Session-Schlüssel. Wenn ausgelassen oder `"main"`, verwendet der Gateway den konfigurierten Haupt-Session-Schlüssel (berücksichtigt `session.mainKey` und den Standard-Agent oder `global` im globalen Scope).
- `dryRun` (Boolean, optional): für zukünftige Verwendung reserviert; derzeit ignoriert.

## Richtlinien- und Routing-Verhalten

Die Tool-Verfügbarkeit wird durch dieselbe Richtlinienkette gefiltert, die von Gateway-Agenten verwendet wird:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- Gruppenrichtlinien (wenn der Session-Schlüssel einer Gruppe oder einem Kanal zugeordnet ist)
- Subagent-Richtlinie (beim Aufruf mit einem Subagent-Session-Schlüssel)

Wenn ein Tool durch Richtlinien nicht erlaubt ist, gibt der Endpunkt **404** zurück.

Wichtige Hinweise zur Grenze:

- Exec-Genehmigungen sind Operator-Leitplanken, keine separate Autorisierungsgrenze für diesen HTTP-Endpunkt. Wenn ein Tool hier über Gateway-Auth + Tool-Richtlinie erreichbar ist, fügt `/tools/invoke` keinen zusätzlichen Genehmigungs-Prompt pro Aufruf hinzu.
- Geben Sie Gateway-Bearer-Zugangsdaten nicht an nicht vertrauenswürdige Aufrufer weiter. Wenn Sie Trennung über Vertrauensgrenzen hinweg benötigen, betreiben Sie separate Gateways (und idealerweise separate OS-Benutzer/-Hosts).

Gateway-HTTP wendet außerdem standardmäßig eine harte Sperrliste an (selbst wenn die Session-Richtlinie das Tool erlaubt):

- `exec` — direkte Befehlsausführung (RCE-Oberfläche)
- `spawn` — beliebige Erstellung von Child-Prozessen (RCE-Oberfläche)
- `shell` — Shell-Befehlsausführung (RCE-Oberfläche)
- `fs_write` — beliebige Dateiänderung auf dem Host
- `fs_delete` — beliebiges Löschen von Dateien auf dem Host
- `fs_move` — beliebiges Verschieben/Umbenennen von Dateien auf dem Host
- `apply_patch` — Patch-Anwendung kann beliebige Dateien neu schreiben
- `sessions_spawn` — Session-Orchestrierung; das entfernte Starten von Agenten ist RCE
- `sessions_send` — nachrichtenübergreifende Injektion zwischen Sessions
- `cron` — persistente Automatisierungs-Steuerungsebene
- `gateway` — Gateway-Steuerungsebene; verhindert Rekonfiguration über HTTP
- `nodes` — Node-Befehlsweiterleitung kann `system.run` auf gekoppelten Hosts erreichen
- `whatsapp_login` — interaktive Einrichtung, die einen Terminal-QR-Scan erfordert; bleibt über HTTP hängen

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

Um Gruppenrichtlinien beim Auflösen des Kontexts zu unterstützen, können Sie optional setzen:

- `x-openclaw-message-channel: <channel>` (Beispiel: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wenn mehrere Konten vorhanden sind)

## Antworten

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (ungültige Anfrage oder Tool-Eingabefehler)
- `401` → nicht autorisiert
- `429` → Auth ratenbegrenzt (`Retry-After` gesetzt)
- `404` → Tool nicht verfügbar (nicht gefunden oder nicht allowlisted)
- `405` → Methode nicht erlaubt
- `500` → `{ ok: false, error: { type, message } }` (unerwarteter Tool-Ausführungsfehler; bereinigte Meldung)

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

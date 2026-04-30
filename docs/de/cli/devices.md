---
read_when:
    - Sie genehmigen Anfragen zur Gerätekopplung
    - Sie müssen Geräte-Token rotieren oder widerrufen
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-04-30T06:45:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Verwalten Sie Geräte-Kopplungsanfragen und gerätebezogene Tokens.

## Befehle

### `openclaw devices list`

Listet ausstehende Kopplungsanfragen und gekoppelte Geräte auf.

```
openclaw devices list
openclaw devices list --json
```

Die Ausgabe ausstehender Anfragen zeigt den angeforderten Zugriff neben dem aktuell
genehmigten Zugriff des Geräts, wenn das Gerät bereits gekoppelt ist. Dadurch werden Scope-/Rollen-
Upgrades explizit, statt so auszusehen, als wäre die Kopplung verloren gegangen.

### `openclaw devices remove <deviceId>`

Entfernt einen Eintrag für ein gekoppeltes Gerät.

Wenn Sie mit einem gekoppelten Geräte-Token authentifiziert sind, können Nicht-Admin-Aufrufer
nur den Eintrag für **ihr eigenes** Gerät entfernen. Das Entfernen eines anderen Geräts erfordert
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Löscht gekoppelte Geräte gesammelt.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Genehmigt eine ausstehende Geräte-Kopplungsanfrage anhand der exakten `requestId`. Wenn `requestId`
weggelassen oder `--latest` übergeben wird, gibt OpenClaw nur die ausgewählte ausstehende
Anfrage aus und beendet sich. Führen Sie die Genehmigung nach Prüfung der Details erneut mit der exakten Anfrage-ID aus.

<Note>
Wenn ein Gerät die Kopplung mit geänderten Authentifizierungsdetails erneut versucht (Rolle, Scopes oder öffentlicher Schlüssel), ersetzt OpenClaw den vorherigen ausstehenden Eintrag und stellt eine neue `requestId` aus. Führen Sie direkt vor der Genehmigung `openclaw devices list` aus, um die aktuelle ID zu verwenden.
</Note>

Wenn das Gerät bereits gekoppelt ist und breitere Scopes oder eine umfassendere Rolle anfordert,
behält OpenClaw die bestehende Genehmigung bei und erstellt eine neue ausstehende Upgrade-
Anfrage. Prüfen Sie die Spalten `Requested` und `Approved` in `openclaw devices list`
oder verwenden Sie `openclaw devices approve --latest`, um das exakte Upgrade vor
der Genehmigung anzusehen.

Wenn der Gateway ausdrücklich mit
`gateway.nodes.pairing.autoApproveCidrs` konfiguriert ist, können erstmalige `role: node`-Anfragen von
passenden Client-IPs genehmigt werden, bevor sie in dieser Liste erscheinen. Diese Richtlinie
ist standardmäßig deaktiviert und gilt nie für Operator-/Browser-Clients oder Upgrade-
Anfragen.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Lehnt eine ausstehende Geräte-Kopplungsanfrage ab.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotiert ein Geräte-Token für eine bestimmte Rolle (optional mit aktualisierten Scopes).
Die Zielrolle muss bereits im genehmigten Kopplungsvertrag dieses Geräts vorhanden sein;
die Rotation kann keine neue, nicht genehmigte Rolle erzeugen.
Wenn Sie `--scope` weglassen, verwenden spätere Neuverbindungen mit dem gespeicherten rotierten Token die
zwischengespeicherten genehmigten Scopes dieses Tokens erneut. Wenn Sie explizite `--scope`-Werte übergeben, werden diese
zum gespeicherten Scope-Satz für künftige Neuverbindungen mit zwischengespeichertem Token.
Nicht-Admin-Aufrufer mit gekoppeltem Gerät können nur das Token ihres **eigenen** Geräts rotieren.
Der Ziel-Token-Scope-Satz muss innerhalb der eigenen Operator-
Scopes der Aufrufersitzung bleiben; die Rotation kann kein breiteres Operator-Token erzeugen oder erhalten, als der
Aufrufer bereits besitzt.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Gibt Rotationsmetadaten als JSON zurück. Wenn der Aufrufer sein eigenes Token rotiert, während er
mit diesem Geräte-Token authentifiziert ist, enthält die Antwort auch das Ersatz-
Token, damit der Client es vor der Neuverbindung speichern kann. Geteilte/Admin-Rotationen
geben das Bearer-Token nicht zurück.

### `openclaw devices revoke --device <id> --role <role>`

Widerruft ein Geräte-Token für eine bestimmte Rolle.

Nicht-Admin-Aufrufer mit gekoppeltem Gerät können nur das Token ihres **eigenen** Geräts widerrufen.
Das Widerrufen des Tokens eines anderen Geräts erfordert `operator.admin`.
Der Ziel-Token-Scope-Satz muss außerdem innerhalb der eigenen
Operator-Scopes der Aufrufersitzung liegen; reine Kopplungs-Aufrufer können keine Admin-/Write-Operator-Tokens widerrufen.

```
openclaw devices revoke --device <deviceId> --role node
```

Gibt das Widerrufsergebnis als JSON zurück.

## Allgemeine Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, wenn konfiguriert).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--password <password>`: Gateway-Passwort (Passwortauthentifizierung).
- `--timeout <ms>`: RPC-Timeout.
- `--json`: JSON-Ausgabe (für Scripting empfohlen).

<Warning>
Wenn Sie `--url` setzen, fällt die CLI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Zugangsdaten sind ein Fehler.
</Warning>

## Hinweise

- Token-Rotation gibt ein neues Token zurück (vertraulich). Behandeln Sie es wie ein Geheimnis.
- Diese Befehle erfordern den Scope `operator.pairing` (oder `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` ist eine Opt-in-Gateway-Richtlinie nur für
  frische Node-Gerätekopplung; sie ändert nicht die Genehmigungsbefugnis der CLI.
- Token-Rotation und Widerruf bleiben innerhalb des genehmigten Kopplungs-Rollensatzes und
  der genehmigten Scope-Baseline für dieses Gerät. Ein verirrter zwischengespeicherter Token-Eintrag
  gewährt kein Ziel für die Token-Verwaltung.
- Für Sitzungen mit Geräte-Token gekoppelter Geräte ist geräteübergreifende Verwaltung nur Admins vorbehalten:
  `remove`, `rotate` und `revoke` sind nur für das eigene Gerät erlaubt, sofern der Aufrufer nicht
  `operator.admin` besitzt.
- Token-Mutation ist ebenfalls durch die Scopes des Aufrufers begrenzt: Eine reine Kopplungssitzung kann
  kein Token rotieren oder widerrufen, das aktuell `operator.admin` oder
  `operator.write` trägt.
- `devices clear` ist absichtlich durch `--yes` abgesichert.
- Wenn der Kopplungs-Scope auf local loopback nicht verfügbar ist (und kein explizites `--url` übergeben wird), können list/approve einen lokalen Kopplungs-Fallback verwenden.
- `devices approve` erfordert eine explizite Anfrage-ID, bevor Tokens erzeugt werden; das Weglassen von `requestId` oder das Übergeben von `--latest` zeigt nur eine Vorschau der neuesten ausstehenden Anfrage.

## Checkliste zur Wiederherstellung bei Token-Drift

Verwenden Sie dies, wenn Control UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH` oder `AUTH_DEVICE_TOKEN_MISMATCH` fehlschlagen.

1. Aktuelle Gateway-Token-Quelle bestätigen:

```bash
openclaw config get gateway.auth.token
```

2. Gekoppelte Geräte auflisten und die betroffene Geräte-ID ermitteln:

```bash
openclaw devices list
```

3. Operator-Token für das betroffene Gerät rotieren:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Wenn die Rotation nicht ausreicht, veraltete Kopplung entfernen und erneut genehmigen:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Client-Verbindung mit dem aktuellen geteilten Token/Passwort erneut versuchen.

Hinweise:

- Die normale Authentifizierungspriorität bei Neuverbindungen ist zuerst explizites geteiltes Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Vertrauenswürdige Wiederherstellung bei `AUTH_TOKEN_MISMATCH` kann vorübergehend sowohl das geteilte Token als auch das gespeicherte Geräte-Token zusammen für den einen begrenzten Wiederholungsversuch senden.

Verwandt:

- [Fehlerbehebung bei Dashboard-Authentifizierung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)

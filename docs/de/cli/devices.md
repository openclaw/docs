---
read_when:
    - Sie genehmigen Anfragen zur Gerätekopplung
    - Sie müssen Geräte-Tokens rotieren oder widerrufen
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-05-11T20:25:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Verwalten Sie Gerätekopplungsanfragen und gerätebezogene Tokens.

## Befehle

### `openclaw devices list`

Listet ausstehende Kopplungsanfragen und gekoppelte Geräte auf.

```
openclaw devices list
openclaw devices list --json
```

Die Ausgabe ausstehender Anfragen zeigt den angeforderten Zugriff neben dem aktuell
genehmigten Zugriff des Geräts, wenn das Gerät bereits gekoppelt ist. Dadurch werden
Scope-/Rollen-Upgrades explizit, statt so zu wirken, als sei die Kopplung verloren gegangen.

### `openclaw devices remove <deviceId>`

Entfernt einen Eintrag für ein gekoppeltes Gerät.

Wenn Sie mit einem Token eines gekoppelten Geräts authentifiziert sind, können Aufrufer ohne Admin-Rechte
nur den Eintrag ihres **eigenen** Geräts entfernen. Das Entfernen eines anderen Geräts erfordert
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

Genehmigt eine ausstehende Gerätekopplungsanfrage anhand der exakten `requestId`. Wenn `requestId`
ausgelassen oder `--latest` übergeben wird, gibt OpenClaw nur die ausgewählte ausstehende
Anfrage aus und beendet sich; führen Sie die Genehmigung nach Prüfung
der Details erneut mit der exakten Anfrage-ID aus.

<Note>
Wenn ein Gerät die Kopplung mit geänderten Authentifizierungsdetails (Rolle, Scopes oder öffentlicher Schlüssel) erneut versucht, ersetzt OpenClaw den vorherigen ausstehenden Eintrag und stellt eine neue `requestId` aus. Führen Sie direkt vor der Genehmigung `openclaw devices list` aus, um die aktuelle ID zu verwenden.
</Note>

Wenn das Gerät bereits gekoppelt ist und breitere Scopes oder eine breitere Rolle anfordert,
behält OpenClaw die bestehende Genehmigung bei und erstellt eine neue ausstehende Upgrade-
Anfrage. Prüfen Sie die Spalten `Requested` und `Approved` in `openclaw devices list`
oder verwenden Sie `openclaw devices approve --latest`, um das exakte Upgrade vor
der Genehmigung in der Vorschau anzuzeigen.

Wenn der Gateway explizit mit
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

Lehnt eine ausstehende Gerätekopplungsanfrage ab.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotiert ein Gerätetoken für eine bestimmte Rolle (optional mit aktualisierten Scopes).
Die Zielrolle muss im genehmigten Kopplungsvertrag dieses Geräts bereits existieren;
die Rotation kann keine neue, nicht genehmigte Rolle ausstellen.
Wenn Sie `--scope` auslassen, verwenden spätere erneute Verbindungen mit dem gespeicherten rotierten Token
die zwischengespeicherten genehmigten Scopes dieses Tokens erneut. Wenn Sie explizite `--scope`-Werte übergeben, werden diese
zur gespeicherten Scope-Menge für künftige Wiederverbindungen mit zwischengespeichertem Token.
Aufrufer ohne Admin-Rechte, die ein gekoppeltes Gerät verwenden, können nur ihr **eigenes** Gerätetoken rotieren.
Die Scope-Menge des Ziel-Tokens muss innerhalb der eigenen Operator-
Scopes der Aufrufersitzung bleiben; die Rotation kann kein breiteres Operator-Token ausstellen oder beibehalten, als der
Aufrufer bereits besitzt.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Gibt Rotationsmetadaten als JSON zurück. Wenn der Aufrufer sein eigenes Token rotiert, während er
mit diesem Gerätetoken authentifiziert ist, enthält die Antwort auch das Ersatz-
Token, damit der Client es vor der erneuten Verbindung speichern kann. Gemeinsame/Admin-Rotationen
geben das Bearer-Token nicht zurück.

### `openclaw devices revoke --device <id> --role <role>`

Widerruft ein Gerätetoken für eine bestimmte Rolle.

Aufrufer ohne Admin-Rechte, die ein gekoppeltes Gerät verwenden, können nur ihr **eigenes** Gerätetoken widerrufen.
Das Widerrufen des Tokens eines anderen Geräts erfordert `operator.admin`.
Die Scope-Menge des Ziel-Tokens muss außerdem innerhalb der eigenen
Operator-Scopes der Aufrufersitzung liegen; reine Kopplungsaufrufer können keine Admin-/Schreib-Operator-Tokens widerrufen.

```
openclaw devices revoke --device <deviceId> --role node
```

Gibt das Widerrufsergebnis als JSON zurück.

## Allgemeine Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, wenn konfiguriert).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--password <password>`: Gateway-Passwort (Passwortauthentifizierung).
- `--timeout <ms>`: RPC-Timeout.
- `--json`: JSON-Ausgabe (für Skripting empfohlen).

<Warning>
Wenn Sie `--url` setzen, fällt die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.
</Warning>

## Hinweise

- Token-Rotation gibt ein neues Token zurück (sensibel). Behandeln Sie es wie ein Geheimnis.
- Diese Befehle erfordern den Scope `operator.pairing` (oder `operator.admin`). Einige
  Genehmigungen erfordern außerdem, dass der Aufrufer die Operator-Scopes besitzt, die das Ziel-
  Gerät ausstellen oder übernehmen würde; siehe [Operator-Scopes](/de/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` ist eine Opt-in-Gateway-Richtlinie nur für
  die erstmalige Kopplung von Node-Geräten; sie ändert nicht die Genehmigungsberechtigung der CLI.
- Token-Rotation und Widerruf bleiben innerhalb der genehmigten Kopplungsrollenmenge und
  der genehmigten Scope-Basislinie für dieses Gerät. Ein verwaister zwischengespeicherter Token-Eintrag
  gewährt kein Ziel für Token-Verwaltung.
- Bei Token-Sitzungen gekoppelter Geräte ist geräteübergreifende Verwaltung nur für Admins möglich:
  `remove`, `rotate` und `revoke` sind auf das eigene Gerät beschränkt, sofern der Aufrufer nicht
  `operator.admin` besitzt.
- Token-Änderungen sind ebenfalls durch die Scopes des Aufrufers begrenzt: Eine reine Kopplungssitzung kann
  kein Token rotieren oder widerrufen, das aktuell `operator.admin` oder
  `operator.write` trägt.
- `devices clear` ist absichtlich durch `--yes` abgesichert.
- Wenn der Kopplungs-Scope auf local loopback nicht verfügbar ist (und keine explizite `--url` übergeben wird), können list/approve einen lokalen Kopplungs-Fallback verwenden.
- `devices approve` erfordert eine explizite Anfrage-ID, bevor Tokens ausgestellt werden; das Auslassen von `requestId` oder das Übergeben von `--latest` zeigt nur eine Vorschau der neuesten ausstehenden Anfrage.

## Checkliste zur Behebung von Token-Drift

Verwenden Sie dies, wenn die Control-UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` oder `AUTH_SCOPE_MISMATCH` fehlschlagen.

1. Bestätigen Sie die aktuelle Gateway-Token-Quelle:

```bash
openclaw config get gateway.auth.token
```

2. Listen Sie gekoppelte Geräte auf und identifizieren Sie die betroffene Geräte-ID:

```bash
openclaw devices list
```

3. Rotieren Sie das Operator-Token für das betroffene Gerät:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Wenn die Rotation nicht ausreicht, entfernen Sie die veraltete Kopplung und genehmigen Sie sie erneut:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Wiederholen Sie die Client-Verbindung mit dem aktuellen gemeinsamen Token/Passwort.

Hinweise:

- Die normale Authentifizierungspriorität beim erneuten Verbinden ist zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
- Vertrauenswürdige `AUTH_TOKEN_MISMATCH`-Behebung kann vorübergehend sowohl das gemeinsame Token als auch das gespeicherte Gerätetoken zusammen für den einen begrenzten Wiederholungsversuch senden.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Gerätetoken erkannt wurde, aber nicht die angeforderte Scope-Menge trägt; korrigieren Sie den Kopplungs-/Scope-Genehmigungsvertrag, bevor Sie die gemeinsame Gateway-Authentifizierung ändern.

Verwandt:

- [Fehlerbehebung bei Dashboard-Authentifizierung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)

---
read_when:
    - Sie genehmigen Anfragen zur Gerätekopplung
    - Sie müssen Geräte-Tokens rotieren oder widerrufen
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-05-03T06:36:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Verwalten Sie Gerätekopplungsanfragen und gerätebezogene Token.

## Befehle

### `openclaw devices list`

Listet ausstehende Kopplungsanfragen und gekoppelte Geräte auf.

```
openclaw devices list
openclaw devices list --json
```

Die Ausgabe ausstehender Anfragen zeigt den angeforderten Zugriff neben dem aktuell
genehmigten Zugriff des Geräts an, wenn das Gerät bereits gekoppelt ist. Dadurch werden
Scope-/Rollen-Upgrades ausdrücklich sichtbar, statt so auszusehen, als wäre die Kopplung verloren gegangen.

### `openclaw devices remove <deviceId>`

Entfernt einen Eintrag für ein gekoppeltes Gerät.

Wenn Sie mit einem gekoppelten Geräte-Token authentifiziert sind, können Nicht-Admin-Aufrufer
nur **ihren eigenen** Geräteeintrag entfernen. Das Entfernen eines anderen Geräts erfordert
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Entfernt gekoppelte Geräte gesammelt.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Genehmigt eine ausstehende Gerätekopplungsanfrage anhand der exakten `requestId`. Wenn `requestId`
ausgelassen oder `--latest` übergeben wird, gibt OpenClaw nur die ausgewählte ausstehende
Anfrage aus und beendet sich; führen Sie die Genehmigung nach Prüfung der Details erneut
mit der exakten Anfrage-ID aus.

<Note>
Wenn ein Gerät die Kopplung mit geänderten Auth-Details (Rolle, Scopes oder öffentlichem Schlüssel) erneut versucht, ersetzt OpenClaw den vorherigen ausstehenden Eintrag und stellt eine neue `requestId` aus. Führen Sie direkt vor der Genehmigung `openclaw devices list` aus, um die aktuelle ID zu verwenden.
</Note>

Wenn das Gerät bereits gekoppelt ist und breitere Scopes oder eine umfassendere Rolle anfordert,
behält OpenClaw die bestehende Genehmigung bei und erstellt eine neue ausstehende Upgrade-Anfrage.
Prüfen Sie die Spalten `Requested` und `Approved` in `openclaw devices list`
oder verwenden Sie `openclaw devices approve --latest`, um das exakte Upgrade vor der
Genehmigung anzuzeigen.

Wenn der Gateway ausdrücklich mit
`gateway.nodes.pairing.autoApproveCidrs` konfiguriert ist, können erstmalige `role: node`-Anfragen von
passenden Client-IPs genehmigt werden, bevor sie in dieser Liste erscheinen. Diese Richtlinie
ist standardmäßig deaktiviert und gilt nie für Operator-/Browser-Clients oder Upgrade-Anfragen.

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

Rotiert ein Geräte-Token für eine bestimmte Rolle (optional mit aktualisierten Scopes).
Die Zielrolle muss im genehmigten Kopplungsvertrag dieses Geräts bereits vorhanden sein;
die Rotation kann keine neue, nicht genehmigte Rolle ausstellen.
Wenn Sie `--scope` auslassen, verwenden spätere erneute Verbindungen mit dem gespeicherten rotierten Token die
zwischengespeicherten genehmigten Scopes dieses Tokens erneut. Wenn Sie explizite `--scope`-Werte übergeben, werden diese
zum gespeicherten Scope-Satz für künftige Wiederverbindungen mit zwischengespeichertem Token.
Nicht-Admin-Aufrufer mit gekoppeltem Gerät können nur ihr **eigenes** Geräte-Token rotieren.
Der Scope-Satz des Ziel-Tokens muss innerhalb der eigenen Operator-Scopes der Aufrufersitzung bleiben;
die Rotation kann kein breiteres Operator-Token ausstellen oder beibehalten, als der
Aufrufer bereits besitzt.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Gibt Rotationsmetadaten als JSON zurück. Wenn der Aufrufer sein eigenes Token rotiert, während er
mit diesem Geräte-Token authentifiziert ist, enthält die Antwort auch das Ersatz-Token,
damit der Client es vor dem erneuten Verbinden dauerhaft speichern kann. Geteilte/Admin-Rotationen
geben das Bearer-Token nicht aus.

### `openclaw devices revoke --device <id> --role <role>`

Widerruft ein Geräte-Token für eine bestimmte Rolle.

Nicht-Admin-Aufrufer mit gekoppeltem Gerät können nur ihr **eigenes** Geräte-Token widerrufen.
Das Widerrufen des Tokens eines anderen Geräts erfordert `operator.admin`.
Der Scope-Satz des Ziel-Tokens muss außerdem in die eigenen Operator-Scopes der Aufrufersitzung passen;
reine Kopplungsaufrufer können keine Admin-/Schreib-Operator-Token widerrufen.

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
Wenn Sie `--url` setzen, fällt die CLI nicht auf Konfigurations- oder Umgebungsanmeldedaten zurück. Übergeben Sie `--token` oder `--password` ausdrücklich. Fehlende explizite Anmeldedaten sind ein Fehler.
</Warning>

## Hinweise

- Die Token-Rotation gibt ein neues Token zurück (sensibel). Behandeln Sie es wie ein Geheimnis.
- Diese Befehle erfordern den Scope `operator.pairing` (oder `operator.admin`). Einige
  Genehmigungen erfordern außerdem, dass der Aufrufer die Operator-Scopes besitzt, die das Zielgerät
  ausstellen oder erben würde; siehe [Operator-Scopes](/de/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` ist eine Opt-in-Gateway-Richtlinie nur für
  neue Node-Gerätekopplungen; sie ändert nicht die Genehmigungsbefugnis der CLI.
- Token-Rotation und -Widerruf bleiben innerhalb des genehmigten Kopplungsrollensatzes und
  der genehmigten Scope-Basislinie für dieses Gerät. Ein verwaister Eintrag für ein zwischengespeichertes Token
  gewährt kein Ziel für Token-Verwaltung.
- Für Sitzungen mit gekoppeltem Geräte-Token ist geräteübergreifende Verwaltung nur Admins vorbehalten:
  `remove`, `rotate` und `revoke` sind nur für das eigene Gerät zulässig, sofern der Aufrufer nicht
  `operator.admin` besitzt.
- Token-Mutation ist außerdem auf die Aufrufer-Scopes beschränkt: Eine reine Kopplungssitzung kann
  kein Token rotieren oder widerrufen, das derzeit `operator.admin` oder
  `operator.write` trägt.
- `devices clear` ist absichtlich durch `--yes` abgesichert.
- Wenn der Kopplungs-Scope auf local loopback nicht verfügbar ist (und kein explizites `--url` übergeben wird), können list/approve einen lokalen Kopplungs-Fallback verwenden.
- `devices approve` erfordert eine explizite Anfrage-ID, bevor Token ausgestellt werden; das Auslassen von `requestId` oder das Übergeben von `--latest` zeigt nur eine Vorschau der neuesten ausstehenden Anfrage an.

## Checkliste zur Wiederherstellung bei Token-Drift

Verwenden Sie dies, wenn Control UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH` oder `AUTH_DEVICE_TOKEN_MISMATCH` fehlschlagen.

1. Bestätigen Sie die aktuelle Gateway-Token-Quelle:

```bash
openclaw config get gateway.auth.token
```

2. Listen Sie gekoppelte Geräte auf und ermitteln Sie die betroffene Geräte-ID:

```bash
openclaw devices list
```

3. Rotieren Sie das Operator-Token für das betroffene Gerät:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Wenn die Rotation nicht ausreicht, entfernen Sie die veraltete Kopplung und genehmigen Sie erneut:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Wiederholen Sie die Client-Verbindung mit dem aktuellen geteilten Token/Passwort.

Hinweise:

- Die normale Auth-Priorität bei erneuter Verbindung ist zuerst explizites geteiltes Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Vertrauenswürdige `AUTH_TOKEN_MISMATCH`-Wiederherstellung kann für den einen begrenzten Wiederholungsversuch vorübergehend sowohl das geteilte Token als auch das gespeicherte Geräte-Token zusammen senden.

Verwandt:

- [Dashboard-Auth-Fehlerbehebung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)

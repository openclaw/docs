---
read_when:
    - Sie genehmigen Gerätekopplungsanfragen.
    - Sie müssen Gerätetokens rotieren oder widerrufen.
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-04-26T11:25:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gerätekopplungsanfragen und auf Geräte begrenzte Tokens verwalten.

## Befehle

### `openclaw devices list`

Ausstehende Kopplungsanfragen und gekoppelte Geräte auflisten.

```
openclaw devices list
openclaw devices list --json
```

Die Ausgabe für ausstehende Anfragen zeigt den angeforderten Zugriff neben dem aktuell
genehmigten Zugriff des Geräts an, wenn das Gerät bereits gekoppelt ist. Dadurch werden
Bereichs-/Rollen-Upgrades explizit sichtbar, statt so auszusehen, als wäre die Kopplung verloren gegangen.

### `openclaw devices remove <deviceId>`

Einen Eintrag für ein gekoppeltes Gerät entfernen.

Wenn Sie mit einem Token eines gekoppelten Geräts authentifiziert sind, können Aufrufer ohne Admin-Rechte
nur **ihren eigenen** Geräteeintrag entfernen. Das Entfernen eines anderen Geräts erfordert
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Gekoppelte Geräte gesammelt löschen.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Eine ausstehende Gerätekopplungsanfrage anhand der exakten `requestId` genehmigen. Wenn `requestId`
weggelassen wird oder `--latest` übergeben wird, gibt OpenClaw nur die ausgewählte ausstehende
Anfrage aus und beendet sich; führen Sie die Genehmigung mit der exakten Anfragen-ID erneut aus, nachdem Sie
die Details überprüft haben.

Hinweis: Wenn ein Gerät die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Bereiche/öffentlicher
Schlüssel) erneut versucht, ersetzt OpenClaw den vorherigen ausstehenden Eintrag und stellt eine neue
`requestId` aus. Führen Sie direkt vor der Genehmigung `openclaw devices list` aus, um die aktuelle
ID zu verwenden.

Wenn das Gerät bereits gekoppelt ist und breitere Bereiche oder eine breitere Rolle anfordert,
behält OpenClaw die bestehende Genehmigung bei und erstellt eine neue ausstehende Upgrade-
Anfrage. Prüfen Sie die Spalten `Requested` und `Approved` in `openclaw devices list`
oder verwenden Sie `openclaw devices approve --latest`, um das genaue Upgrade vor der
Genehmigung in der Vorschau anzuzeigen.

Wenn das Gateway explizit mit
`gateway.nodes.pairing.autoApproveCidrs` konfiguriert ist, können erstmalige Anfragen mit `role: node` von
übereinstimmenden Client-IPs genehmigt werden, bevor sie in dieser Liste erscheinen. Diese Richtlinie
ist standardmäßig deaktiviert und gilt niemals für Operator-/Browser-Clients oder Upgrade-Anfragen.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Eine ausstehende Gerätekopplungsanfrage ablehnen.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ein Gerätetoken für eine bestimmte Rolle rotieren (optional mit Aktualisierung der Bereiche).
Die Zielrolle muss bereits im genehmigten Kopplungsvertrag dieses Geräts vorhanden sein;
durch Rotation kann keine neue, nicht genehmigte Rolle erstellt werden.
Wenn Sie `--scope` weglassen, verwenden spätere Wiederverbindungen mit dem gespeicherten rotierten Token erneut
die zwischengespeicherten genehmigten Bereiche dieses Tokens. Wenn Sie explizite `--scope`-Werte übergeben,
werden diese zum gespeicherten Bereichssatz für zukünftige Wiederverbindungen mit zwischengespeichertem Token.
Aufrufer ohne Admin-Rechte mit gepaartem Gerät können nur **ihr eigenes** Gerätetoken rotieren.
Der Bereichssatz des Zieltokens muss innerhalb der eigenen Operator-Bereiche der Aufrufersitzung bleiben;
durch Rotation kann kein breiteres Operator-Token erstellt oder beibehalten werden, als der Aufrufer
bereits besitzt.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Gibt die neue Token-Payload als JSON zurück.

### `openclaw devices revoke --device <id> --role <role>`

Ein Gerätetoken für eine bestimmte Rolle widerrufen.

Aufrufer ohne Admin-Rechte mit gepaartem Gerät können nur **ihr eigenes** Gerätetoken widerrufen.
Der Widerruf des Tokens eines anderen Geräts erfordert `operator.admin`.
Der Bereichssatz des Zieltokens muss ebenfalls innerhalb der eigenen Operator-Bereiche der
Aufrufersitzung liegen; reine Kopplungsaufrufer können keine Admin-/Schreib-Operator-Tokens widerrufen.

```
openclaw devices revoke --device <deviceId> --role node
```

Gibt das Widerrufsergebnis als JSON zurück.

## Häufige Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, wenn konfiguriert).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--password <password>`: Gateway-Passwort (Passwortauthentifizierung).
- `--timeout <ms>`: RPC-Zeitüberschreitung.
- `--json`: JSON-Ausgabe (für Skripting empfohlen).

Hinweis: Wenn Sie `--url` setzen, greift die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.

## Hinweise

- Die Token-Rotation gibt ein neues Token zurück (sensibel). Behandeln Sie es wie ein Geheimnis.
- Diese Befehle erfordern den Bereich `operator.pairing` (oder `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` ist eine optionale Gateway-Richtlinie für
  die erstmalige Kopplung frischer Node-Geräte; sie ändert nicht die Genehmigungsbefugnis der CLI.
- Token-Rotation und -Widerruf bleiben innerhalb der genehmigten Kopplungsrollenmengen und
  des genehmigten Bereichs-Baselines für dieses Gerät. Ein versehentlicher zwischengespeicherter Token-Eintrag
  gewährt kein Ziel für Token-Verwaltung.
- Für Sitzungen mit gepaartem Gerätetoken ist geräteübergreifende Verwaltung nur Admins erlaubt:
  `remove`, `rotate` und `revoke` sind nur für das eigene Gerät erlaubt, sofern der Aufrufer nicht
  `operator.admin` hat.
- Token-Mutation ist ebenfalls auf den Aufruferbereich beschränkt: Eine reine Kopplungssitzung kann
  kein Token rotieren oder widerrufen, das derzeit `operator.admin` oder
  `operator.write` trägt.
- `devices clear` ist absichtlich durch `--yes` geschützt.
- Wenn der Kopplungsbereich auf local loopback nicht verfügbar ist (und kein explizites `--url` übergeben wird), können list/approve einen lokalen Kopplungs-Fallback verwenden.
- `devices approve` erfordert eine explizite Anfragen-ID, bevor Tokens erstellt werden; beim Weglassen von `requestId` oder bei Übergabe von `--latest` wird nur die neueste ausstehende Anfrage in der Vorschau angezeigt.

## Checkliste zur Wiederherstellung bei Token-Drift

Verwenden Sie dies, wenn Control UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH` oder `AUTH_DEVICE_TOKEN_MISMATCH` fehlschlagen.

1. Aktuelle Gateway-Token-Quelle bestätigen:

```bash
openclaw config get gateway.auth.token
```

2. Gekoppelte Geräte auflisten und die betroffene Geräte-ID identifizieren:

```bash
openclaw devices list
```

3. Operator-Token für das betroffene Gerät rotieren:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Wenn Rotation nicht ausreicht, veraltete Kopplung entfernen und erneut genehmigen:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Client-Verbindung mit dem aktuellen gemeinsamen Token/Passwort erneut versuchen.

Hinweise:

- Die normale Wiederverbindungs-Authentifizierungsreihenfolge ist zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
- Vertrauenswürdige Wiederherstellung bei `AUTH_TOKEN_MISMATCH` kann vorübergehend sowohl das gemeinsame Token als auch das gespeicherte Gerätetoken zusammen für den einen begrenzten Wiederholungsversuch senden.

Verwandt:

- [Dashboard-Authentifizierungs-Fehlerbehebung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)

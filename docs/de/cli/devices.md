---
read_when:
    - Sie genehmigen Gerätekopplungsanfragen
    - Sie müssen Gerätetokens rotieren oder widerrufen
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-04-25T13:43:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gerätekopplungsanfragen und gerätebezogene Tokens verwalten.

## Befehle

### `openclaw devices list`

Ausstehende Kopplungsanfragen und gekoppelte Geräte auflisten.

```
openclaw devices list
openclaw devices list --json
```

Die Ausgabe ausstehender Anfragen zeigt den angeforderten Zugriff neben dem aktuell
genehmigten Zugriff des Geräts an, wenn das Gerät bereits gekoppelt ist. Dadurch
werden Scope-/Rollen-Upgrades explizit sichtbar, statt so auszusehen, als wäre die
Kopplung verloren gegangen.

### `openclaw devices remove <deviceId>`

Einen Eintrag für ein gekoppeltes Gerät entfernen.

Wenn Sie mit einem gekoppelten Gerätetoken authentifiziert sind, können Aufrufer
ohne Adminrechte nur **ihren eigenen** Geräteeintrag entfernen. Das Entfernen
eines anderen Geräts erfordert `operator.admin`.

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
Anfrage aus und beendet sich; führen Sie die Genehmigung erneut mit der exakten Anfragen-ID aus,
nachdem Sie die Details geprüft haben.

Hinweis: Wenn ein Gerät die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher
Schlüssel) erneut versucht, ersetzt OpenClaw den vorherigen ausstehenden Eintrag und erstellt eine neue
`requestId`. Führen Sie `openclaw devices list` direkt vor der Genehmigung aus, um die aktuelle ID
zu verwenden.

Wenn das Gerät bereits gekoppelt ist und nach umfassenderen Scopes oder einer umfassenderen Rolle fragt,
behält OpenClaw die bestehende Genehmigung bei und erstellt eine neue ausstehende Upgrade-Anfrage.
Prüfen Sie die Spalten `Requested` und `Approved` in `openclaw devices list`
oder verwenden Sie `openclaw devices approve --latest`, um das genaue Upgrade vor der
Genehmigung in der Vorschau anzuzeigen.

Wenn das Gateway explizit mit
`gateway.nodes.pairing.autoApproveCidrs` konfiguriert ist, können erstmalige Anfragen mit `role: node` von
passenden Client-IP-Adressen genehmigt werden, bevor sie in dieser Liste erscheinen. Diese Richtlinie
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

Ein Gerätetoken für eine bestimmte Rolle rotieren (optional mit Aktualisierung der Scopes).
Die Zielrolle muss bereits im genehmigten Kopplungsvertrag dieses Geräts vorhanden sein;
durch Rotation kann keine neue, nicht genehmigte Rolle erstellt werden.
Wenn Sie `--scope` weglassen, verwenden spätere Wiederverbindungen mit dem gespeicherten rotierten Token
die zwischengespeicherten genehmigten Scopes dieses Tokens erneut. Wenn Sie explizite `--scope`-Werte
übergeben, werden diese zur gespeicherten Scope-Menge für zukünftige Wiederverbindungen mit
zwischengespeichertem Token.
Aufrufer ohne Adminrechte mit gekoppelt-Gerät-Sitzung können nur **ihr eigenes**
Gerätetoken rotieren.
Außerdem müssen alle expliziten `--scope`-Werte innerhalb der eigenen
Operator-Scopes der Aufrufersitzung bleiben; durch Rotation kann kein umfassenderes
Operator-Token erstellt werden, als der Aufrufer bereits hat.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Gibt die neue Token-Payload als JSON zurück.

### `openclaw devices revoke --device <id> --role <role>`

Ein Gerätetoken für eine bestimmte Rolle widerrufen.

Aufrufer ohne Adminrechte mit gekoppelt-Gerät-Sitzung können nur **ihr eigenes**
Gerätetoken widerrufen.
Der Widerruf des Tokens eines anderen Geräts erfordert `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Gibt das Ergebnis des Widerrufs als JSON zurück.

## Häufige Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, wenn konfiguriert).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--password <password>`: Gateway-Passwort (Passwortauthentifizierung).
- `--timeout <ms>`: RPC-Timeout.
- `--json`: JSON-Ausgabe (für Skripting empfohlen).

Hinweis: Wenn Sie `--url` setzen, greift die CLI nicht auf Zugangsdaten aus Konfiguration oder Umgebung zurück.
Übergeben Sie `--token` oder `--password` explizit.
Fehlende explizite Zugangsdaten sind ein Fehler.

## Hinweise

- Die Token-Rotation gibt ein neues Token zurück (sensibel). Behandeln Sie es wie ein Geheimnis.
- Diese Befehle erfordern den Scope `operator.pairing` (oder `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` ist eine opt-in-Gateway-Richtlinie nur für
  frische Node-Gerätekopplung; sie ändert nicht die Genehmigungsbefugnis der CLI.
- Die Token-Rotation bleibt innerhalb der genehmigten Kopplungsrollenmengen und der genehmigten
  Scope-Baseline für dieses Gerät. Ein verirrter zwischengespeicherter Token-Eintrag gewährt kein neues
  Rotationsziel.
- Für Sitzungen mit gekoppelt-Gerät-Token ist geräteübergreifende Verwaltung nur für Admins:
  `remove`, `rotate` und `revoke` sind nur für das eigene Gerät erlaubt, außer der Aufrufer hat
  `operator.admin`.
- `devices clear` ist absichtlich durch `--yes` geschützt.
- Wenn der Pairing-Scope auf local loopback nicht verfügbar ist (und kein explizites `--url` übergeben wird), können `list`/`approve` ein lokales Pairing-Fallback verwenden.
- `devices approve` erfordert eine explizite Anfragen-ID, bevor Tokens erstellt werden; beim Weglassen von `requestId` oder bei Übergabe von `--latest` wird nur die neueste ausstehende Anfrage in der Vorschau angezeigt.

## Checkliste zur Wiederherstellung bei Token-Drift

Verwenden Sie diese, wenn die Control UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH` oder `AUTH_DEVICE_TOKEN_MISMATCH` fehlschlagen.

1. Aktuelle Gateway-Tokenquelle prüfen:

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

- Die normale Vorrangfolge der Wiederverbindungsauthentifizierung ist zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
- Eine vertrauenswürdige Wiederherstellung bei `AUTH_TOKEN_MISMATCH` kann für den einen begrenzten Wiederholungsversuch vorübergehend sowohl das gemeinsame Token als auch das gespeicherte Gerätetoken zusammen senden.

Verwandt:

- [Fehlerbehebung für Dashboard-Authentifizierung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Fehlerbehebung für Gateway](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)

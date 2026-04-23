---
read_when:
    - Sie genehmigen Anfragen zur Gerätepaarung.
    - Sie müssen Geräte-Token rotieren oder widerrufen.
summary: CLI-Referenz für `openclaw devices` (Gerätepaarung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-04-23T06:26:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gerätepaarungsanfragen und gerätebezogene Token verwalten.

## Befehle

### `openclaw devices list`

Ausstehende Paarungsanfragen und gekoppelte Geräte auflisten.

```
openclaw devices list
openclaw devices list --json
```

Die Ausgabe ausstehender Anfragen zeigt den angeforderten Zugriff neben dem aktuell
genehmigten Zugriff des Geräts an, wenn das Gerät bereits gekoppelt ist. Dadurch
werden Scope-/Rollen-Upgrades explizit sichtbar, statt so auszusehen, als sei
die Paarung verloren gegangen.

### `openclaw devices remove <deviceId>`

Einen Eintrag für ein gekoppeltes Gerät entfernen.

Wenn Sie mit einem Token eines gekoppelten Geräts authentifiziert sind, können
nichtadministrative Aufrufer nur **ihren eigenen** Geräteeintrag entfernen.
Das Entfernen eines anderen Geräts erfordert `operator.admin`.

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

Eine ausstehende Gerätepaarungsanfrage anhand der exakten `requestId`
genehmigen. Wenn `requestId` weggelassen wird oder `--latest` übergeben wird,
gibt OpenClaw nur die ausgewählte ausstehende Anfrage aus und beendet sich;
führen Sie die Genehmigung nach Prüfung der Details mit der exakten Request-ID
erneut aus.

Hinweis: Wenn ein Gerät die Paarung mit geänderten Authentifizierungsdetails
(Rolle/Scopes/öffentlicher Schlüssel) erneut versucht, ersetzt OpenClaw den
vorherigen ausstehenden Eintrag und vergibt eine neue `requestId`. Führen Sie
direkt vor der Genehmigung `openclaw devices list` aus, um die aktuelle ID zu
verwenden.

Wenn das Gerät bereits gekoppelt ist und breitere Scopes oder eine breitere Rolle
anfordert, lässt OpenClaw die bestehende Genehmigung bestehen und erstellt eine
neue ausstehende Upgrade-Anfrage. Prüfen Sie die Spalten `Requested` und `Approved`
in `openclaw devices list` oder verwenden Sie `openclaw devices approve --latest`,
um vor der Genehmigung eine Vorschau des exakten Upgrades anzuzeigen.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Eine ausstehende Gerätepaarungsanfrage ablehnen.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ein Geräte-Token für eine bestimmte Rolle rotieren (optional mit Aktualisierung
der Scopes).
Die Zielrolle muss bereits im genehmigten Paarungsvertrag dieses Geräts vorhanden sein;
durch Rotation kann keine neue, nicht genehmigte Rolle erzeugt werden.
Wenn Sie `--scope` weglassen, verwenden spätere Wiederverbindungen mit dem
gespeicherten rotierten Token die zwischengespeicherten genehmigten Scopes
dieses Tokens weiter. Wenn Sie explizite `--scope`-Werte übergeben, werden
diese zum gespeicherten Scope-Satz für zukünftige Wiederverbindungen mit
zwischengespeicherten Token.
Nichtadministrative Aufrufer mit gekoppelt-gerätbasierten Sitzungen können nur
ihr **eigenes** Geräte-Token rotieren.
Außerdem müssen alle expliziten `--scope`-Werte innerhalb der eigenen
Operator-Scopes der Aufrufersitzung bleiben; durch Rotation kann kein breiteres
Operator-Token erzeugt werden, als der Aufrufer bereits hat.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Gibt die neue Token-Nutzlast als JSON zurück.

### `openclaw devices revoke --device <id> --role <role>`

Ein Geräte-Token für eine bestimmte Rolle widerrufen.

Nichtadministrative Aufrufer mit gekoppelt-gerätbasierten Sitzungen können nur
ihr **eigenes** Geräte-Token widerrufen.
Das Widerrufen des Tokens eines anderen Geräts erfordert `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Gibt das Widerrufsergebnis als JSON zurück.

## Häufige Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, wenn konfiguriert).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--password <password>`: Gateway-Passwort (Passwortauthentifizierung).
- `--timeout <ms>`: RPC-Timeout.
- `--json`: JSON-Ausgabe (für Skripting empfohlen).

Hinweis: Wenn Sie `--url` setzen, greift die CLI nicht auf Anmeldedaten aus Konfiguration oder Umgebung zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.

## Hinweise

- Die Token-Rotation gibt ein neues Token zurück (sensibel). Behandeln Sie es wie ein Geheimnis.
- Diese Befehle erfordern den Scope `operator.pairing` (oder `operator.admin`).
- Die Token-Rotation bleibt innerhalb der genehmigten Paarungsrollenmengen und der genehmigten Scope-
  Basislinie für dieses Gerät. Ein verirrter Eintrag für ein zwischengespeichertes Token gewährt kein neues
  Rotationsziel.
- Für Sitzungen mit Tokens gekoppelter Geräte ist geräteübergreifende Verwaltung nur für Administratoren erlaubt:
  `remove`, `rotate` und `revoke` sind nur für das eigene Gerät möglich, es sei denn, der Aufrufer hat
  `operator.admin`.
- `devices clear` ist absichtlich durch `--yes` abgesichert.
- Wenn der Pairing-Scope auf local loopback nicht verfügbar ist (und kein explizites `--url` übergeben wird), können list/approve einen lokalen Pairing-Fallback verwenden.
- `devices approve` erfordert vor dem Erzeugen von Token eine explizite Request-ID; beim Weglassen von `requestId` oder bei Übergabe von `--latest` wird nur eine Vorschau der neuesten ausstehenden Anfrage angezeigt.

## Checkliste zur Wiederherstellung bei Token-Drift

Verwenden Sie diese Checkliste, wenn die Control UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH` oder `AUTH_DEVICE_TOKEN_MISMATCH` fehlschlagen.

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

4. Wenn die Rotation nicht ausreicht, veraltete Paarung entfernen und erneut genehmigen:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Client-Verbindung mit dem aktuellen gemeinsamen Token/Passwort erneut versuchen.

Hinweise:

- Die normale Wiederverbindungs-Auth-Priorität ist zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Die vertrauenswürdige Wiederherstellung bei `AUTH_TOKEN_MISMATCH` kann für den einen begrenzten Wiederholungsversuch vorübergehend sowohl das gemeinsame Token als auch das gespeicherte Geräte-Token zusammen senden.

Verwandt:

- [Fehlerbehebung für Dashboard-Authentifizierung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

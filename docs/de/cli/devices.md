---
read_when:
    - Sie genehmigen Geräte-Kopplungsanfragen
    - Sie müssen Geräte-Token rotieren oder widerrufen
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-06-27T17:18:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
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
genehmigten Zugriff des Geräts, wenn das Gerät bereits gekoppelt ist. Dadurch werden Scope-/Rollen-
Upgrades explizit, statt so zu wirken, als sei die Kopplung verloren gegangen.

### `openclaw devices remove <deviceId>`

Entfernt einen Eintrag eines gekoppelten Geräts.

Wenn Sie mit einem gekoppelten Geräte-Token authentifiziert sind, können Nicht-Admin-Aufrufer
nur **ihren eigenen** Geräteeintrag entfernen. Das Entfernen eines anderen Geräts erfordert
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
weggelassen oder `--latest` übergeben wird, gibt OpenClaw nur die ausgewählte ausstehende
Anfrage aus und beendet sich; führen Sie die Genehmigung nach Prüfung der Details erneut mit der exakten Anfrage-ID aus.

<Note>
Wenn ein Gerät die Kopplung mit geänderten Authentifizierungsdetails (Rolle, Scopes oder öffentlicher Schlüssel) erneut versucht, ersetzt OpenClaw den vorherigen ausstehenden Eintrag und stellt eine neue `requestId` aus. Führen Sie direkt vor der Genehmigung `openclaw devices list` aus, um die aktuelle ID zu verwenden.
</Note>

Wenn das Gerät bereits gekoppelt ist und breitere Scopes oder eine breitere Rolle anfordert,
behält OpenClaw die bestehende Genehmigung bei und erstellt eine neue ausstehende Upgrade-
Anfrage. Prüfen Sie die Spalten `Requested` und `Approved` in `openclaw devices list`
oder verwenden Sie `openclaw devices approve --latest`, um das exakte Upgrade vor der Genehmigung
in der Vorschau anzuzeigen.

Wenn der Gateway ausdrücklich mit
`gateway.nodes.pairing.autoApproveCidrs` konfiguriert ist, können erstmalige `role: node`-Anfragen von
passenden Client-IPs genehmigt werden, bevor sie in dieser Liste erscheinen. Diese Richtlinie
ist standardmäßig deaktiviert und gilt niemals für Operator-/Browser-Clients oder Upgrade-
Anfragen.

Das Genehmigen von Node- oder anderen Nicht-Operator-Geräterollen erfordert `operator.admin`.
`operator.pairing` reicht nur für Genehmigungen von Operator-Geräten aus, wenn die
angeforderten Operator-Scopes innerhalb der eigenen Scopes des Aufrufers bleiben. Siehe
[Operator-Scopes](/de/gateway/operator-scopes) für die Prüfungen zum Genehmigungszeitpunkt.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Erstlaufgenehmigung für Paperclip / `openclaw_gateway`

Wenn sich ein neuer Paperclip-Agent zum ersten Mal über den `openclaw_gateway`-Adapter verbindet, kann der Gateway eine einmalige Gerätekopplungsgenehmigung verlangen, bevor Läufe erfolgreich sein können. Wenn Paperclip `openclaw_gateway_pairing_required` meldet, genehmigen Sie das ausstehende Gerät und versuchen Sie es erneut.

Zeigen Sie bei lokalen Gateways die neueste ausstehende Anfrage in der Vorschau an:

```bash
openclaw devices approve --latest
```

Die Vorschau gibt den exakten Befehl `openclaw devices approve <requestId>` aus. Prüfen Sie die Anfragedetails und führen Sie diesen Befehl dann erneut mit der Anfrage-ID aus, um sie zu genehmigen.

Übergeben Sie bei Remote-Gateways oder expliziten Zugangsdaten beim Anzeigen der Vorschau und beim Genehmigen dieselben Optionen:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Um erneute Genehmigungen nach Neustarts zu vermeiden, speichern Sie einen persistenten Geräteschlüssel in der Paperclip-Adapterkonfiguration, statt bei jedem Lauf eine neue kurzlebige Identität zu erzeugen:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Wenn die Genehmigung weiterhin fehlschlägt, führen Sie zuerst `openclaw devices list` aus, um zu bestätigen, dass eine ausstehende Anfrage vorhanden ist.

### `openclaw devices reject <requestId>`

Lehnt eine ausstehende Gerätekopplungsanfrage ab.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotiert ein Geräte-Token für eine bestimmte Rolle (optional mit Aktualisierung der Scopes).
Die Zielrolle muss bereits im genehmigten Kopplungsvertrag dieses Geräts vorhanden sein;
durch Rotation kann keine neue, nicht genehmigte Rolle ausgestellt werden.
Wenn Sie `--scope` weglassen, verwenden spätere Neuverbindungen mit dem gespeicherten rotierten Token die
zwischengespeicherten genehmigten Scopes dieses Tokens erneut. Wenn Sie explizite `--scope`-Werte übergeben, werden diese
zur gespeicherten Scope-Menge für künftige Neuverbindungen mit zwischengespeicherten Token.
Nicht-Admin-Aufrufer mit gekoppeltem Gerät können nur ihr **eigenes** Geräte-Token rotieren.
Die Scope-Menge des Ziel-Tokens muss innerhalb der eigenen Operator-
Scopes der Aufrufersitzung bleiben; durch Rotation kann kein breiteres Operator-Token ausgestellt oder bewahrt werden, als der
Aufrufer bereits besitzt.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Gibt Rotationsmetadaten als JSON zurück. Wenn der Aufrufer sein eigenes Token rotiert, während er
mit diesem Geräte-Token authentifiziert ist, enthält die Antwort auch das Ersatz-
Token, damit der Client es vor der erneuten Verbindung speichern kann. Gemeinsame/Admin-Rotationen
geben das Bearer-Token nicht zurück.

### `openclaw devices revoke --device <id> --role <role>`

Widerruft ein Geräte-Token für eine bestimmte Rolle.

Nicht-Admin-Aufrufer mit gekoppeltem Gerät können nur ihr **eigenes** Geräte-Token widerrufen.
Das Widerrufen des Tokens eines anderen Geräts erfordert `operator.admin`.
Die Scope-Menge des Ziel-Tokens muss außerdem innerhalb der eigenen
Operator-Scopes der Aufrufersitzung liegen; reine Kopplungs-Aufrufer können keine Admin-/Schreib-Operator-Token widerrufen.

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
Wenn Sie `--url` setzen, fällt die CLI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Zugangsdaten sind ein Fehler.
</Warning>

## Hinweise

- Token-Rotation gibt ein neues Token zurück (sensibel). Behandeln Sie es wie ein Secret.
- Diese Befehle erfordern den Scope `operator.pairing` (oder `operator.admin`). Einige
  Genehmigungen erfordern außerdem, dass der Aufrufer die Operator-Scopes besitzt, die das Ziel-
  Gerät ausstellen oder erben würde. Nicht-Operator-Geräterollen erfordern
  `operator.admin`; siehe [Operator-Scopes](/de/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` ist eine optionale Gateway-Richtlinie nur für
  frische Node-Gerätekopplungen; sie ändert nicht die Genehmigungsberechtigung der CLI.
- Token-Rotation und -Widerruf bleiben innerhalb der genehmigten Kopplungsrollenmenge und
  der genehmigten Scope-Basislinie für dieses Gerät. Ein verirrter zwischengespeicherter Token-Eintrag
  gewährt kein Ziel für die Token-Verwaltung.
- Bei Sitzungen mit Token gekoppelter Geräte ist geräteübergreifende Verwaltung nur Admins vorbehalten:
  `remove`, `rotate` und `revoke` sind auf das eigene Gerät beschränkt, sofern der Aufrufer nicht
  `operator.admin` besitzt.
- Token-Mutationen sind außerdem auf die Scopes des Aufrufers begrenzt: Eine reine Kopplungssitzung kann kein
  Token rotieren oder widerrufen, das aktuell `operator.admin` oder
  `operator.write` trägt.
- `devices clear` ist absichtlich durch `--yes` geschützt.
- Wenn der Kopplungs-Scope auf local loopback nicht verfügbar ist (und kein explizites `--url` übergeben wird), können list/approve einen lokalen Kopplungs-Fallback verwenden.
- `devices approve` erfordert vor dem Ausstellen von Token eine explizite Anfrage-ID; das Weglassen von `requestId` oder das Übergeben von `--latest` zeigt nur eine Vorschau der neuesten ausstehenden Anfrage an.

## Checkliste zur Behebung von Token-Drift

Verwenden Sie dies, wenn Control UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` oder `AUTH_SCOPE_MISMATCH` fehlschlagen.

1. Bestätigen Sie die aktuelle Quelle des Gateway-Tokens:

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

4. Wenn Rotation nicht ausreicht, entfernen Sie die veraltete Kopplung und genehmigen Sie erneut:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Versuchen Sie die Client-Verbindung mit dem aktuellen gemeinsamen Token/Passwort erneut.

Hinweise:

- Die normale Authentifizierungspriorität bei Neuverbindungen lautet: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Eine vertrauenswürdige Wiederherstellung nach `AUTH_TOKEN_MISMATCH` kann vorübergehend sowohl das gemeinsame Token als auch das gespeicherte Geräte-Token gemeinsam für den einen begrenzten Wiederholungsversuch senden.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, aber die angeforderte Scope-Menge nicht trägt; korrigieren Sie den Kopplungs-/Scope-Genehmigungsvertrag, bevor Sie die gemeinsame Gateway-Authentifizierung ändern.

Verwandt:

- [Fehlerbehebung für Dashboard-Authentifizierung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)

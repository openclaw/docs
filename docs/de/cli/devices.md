---
read_when:
    - Sie genehmigen Geräte-Kopplungsanfragen
    - Sie müssen Geräte-Tokens rotieren oder widerrufen
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-07-24T04:18:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Verwalten Sie Geräte-Kopplungsanfragen und gerätebezogene Tokens.

## Allgemeine Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, wenn konfiguriert)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (Passwortauthentifizierung)
- `--timeout <ms>`: RPC-Zeitüberschreitung
- `--json`: JSON-Ausgabe (für Skripting empfohlen)

<Warning>
Wenn Sie `--url` festlegen, greift die CLI nicht auf Anmeldedaten aus der Konfiguration oder Umgebung zurück. Übergeben Sie `--token` oder `--password` ausdrücklich, andernfalls schlägt der Befehl fehl.
</Warning>

## Befehle

### `openclaw devices list`

Ausstehende Kopplungsanfragen und gekoppelte Geräte auflisten.

```bash
openclaw devices list
openclaw devices list --json
```

Bei einer ausstehenden Anfrage eines bereits gekoppelten Geräts zeigt die Ausgabe den angeforderten Zugriff neben dem aktuell genehmigten Zugriff des Geräts an. Dadurch sind Erweiterungen von Geltungsbereichen oder Rollen sichtbar, statt wie eine verlorene Kopplung auszusehen.

Anzeigenamen gekoppelter Geräte verwenden diese Rangfolge: Operator-Bezeichnung (`operatorLabel` aus `devices rename`), dann `displayName` des Clients, dann `clientId`, dann `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Eine ausstehende Kopplungsanfrage anhand der exakten `requestId` genehmigen. Wenn `requestId` ausgelassen oder `--latest` übergeben wird, wird lediglich eine Vorschau der neuesten ausstehenden Anfrage angezeigt und der Befehl beendet (Code 1). Führen Sie ihn mit der exakten Anfrage-ID erneut aus, um die Anfrage zu genehmigen.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Wenn ein Gerät die Kopplung mit geänderten Authentifizierungsdetails (Rolle, Geltungsbereiche oder öffentlicher Schlüssel) erneut versucht, ersetzt OpenClaw den vorherigen ausstehenden Eintrag durch eine neue `requestId`. Führen Sie unmittelbar vor der Genehmigung `openclaw devices list` aus, um die aktuelle ID abzurufen.
</Note>

Genehmigungsverhalten:

- Wenn das Gerät bereits gekoppelt ist und umfassendere Geltungsbereiche oder eine andere Rolle anfordert, behält OpenClaw die bestehende Genehmigung bei und erstellt eine neue ausstehende Erweiterungsanfrage. Vergleichen Sie vor der Genehmigung `Requested` mit `Approved` in `openclaw devices list`, oder zeigen Sie mit `--latest` eine Vorschau an.
- Die Genehmigung einer Rolle vom Typ `node` oder einer anderen Nicht-Operator-Rolle erfordert `operator.admin`. `operator.pairing` genügt für Genehmigungen von Operator-Geräten, jedoch nur, wenn die angeforderten Operator-Geltungsbereiche innerhalb der eigenen Geltungsbereiche des Aufrufers bleiben. Siehe [Operator-Geltungsbereiche](/de/gateway/operator-scopes).
- Wenn `gateway.nodes.pairing.autoApproveCidrs` konfiguriert ist, können erstmalige `role: node`-Anfragen von übereinstimmenden Client-IP-Adressen automatisch genehmigt werden, bevor sie in dieser Liste erscheinen. Standardmäßig deaktiviert; gilt niemals für Operator-/Browser-Clients oder Erweiterungsanfragen.
- `gateway.nodes.pairing.sshVerify` (standardmäßig aktiviert) genehmigt erstmalige `role: node`-Anfragen automatisch, wenn das Gateway den Geräteschlüssel über SSH zum Node-Host verifiziert. Anfragen können daher kurz nach ihrem Erscheinen als genehmigt abgeschlossen werden. Legen Sie `sshVerify: false` fest, um die SSH-Verifizierung zu deaktivieren. Dies ist unabhängig von `autoApproveCidrs`; entfernen Sie daher auch dessen Festlegung, wenn Kopplungen ausschließlich manuell erfolgen sollen.

### `openclaw devices reject <requestId>`

Eine ausstehende Geräte-Kopplungsanfrage ablehnen.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Einen Eintrag eines gekoppelten Geräts entfernen.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Ein mit dem Token eines gekoppelten Geräts authentifizierter Aufrufer kann nur den Eintrag seines **eigenen** Geräts entfernen. Das Entfernen eines anderen Geräts erfordert `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Einem gekoppelten Gerät eine Operator-Bezeichnung zuweisen. Bezeichnungen sind besitzerseitiger Zustand: Sie bleiben bei Reparaturen der Kopplung und erneuten Rollengenehmigungen erhalten und ändern die stabile `deviceId` nicht.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` ist erforderlich, wird von Leerraum an den Rändern bereinigt, darf nicht leer sein und ist auf 64 Zeichen begrenzt.
- Anzeigeoberflächen (CLI-Liste, Inventar der Control UI) bevorzugen die Operator-Bezeichnung gegenüber dem vom Client gemeldeten Anzeigenamen.
- Ein gekoppelter Geräteaufrufer ohne Administratorrechte kann nur sein **eigenes** Gerät umbenennen. Das Umbenennen eines anderen Geräts erfordert `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Gekoppelte Geräte gesammelt löschen. Durch `--yes` geschützt.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` lehnt außerdem alle ausstehenden Kopplungsanfragen ab.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ein Geräte-Token für eine Rolle rotieren und optional dessen Geltungsbereiche aktualisieren.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Die Zielrolle muss bereits im genehmigten Kopplungsvertrag dieses Geräts vorhanden sein; durch Rotation kann keine neue, nicht genehmigte Rolle erzeugt werden.
- Wenn `--scope` ausgelassen wird, werden bei späteren erneuten Verbindungen die zwischengespeicherten genehmigten Geltungsbereiche des gespeicherten Tokens wiederverwendet. Die Übergabe ausdrücklicher `--scope`-Werte ersetzt die gespeicherte Menge an Geltungsbereichen für zukünftige erneute Verbindungen mit zwischengespeicherten Tokens.
- Ein gekoppelter Geräteaufrufer ohne Administratorrechte kann nur das Token seines **eigenen** Geräts rotieren, und die Zielmenge an Geltungsbereichen muss innerhalb der eigenen Operator-Geltungsbereiche des Aufrufers bleiben. Durch Rotation kann kein umfassenderes Token erzeugt oder beibehalten werden, als der Aufrufer bereits besitzt.

Gibt Rotationsmetadaten als JSON zurück. Wenn der Aufrufer sein eigenes Token rotiert, während er mit diesem Geräte-Token authentifiziert ist, enthält die Antwort das Ersatztoken, damit der Client es vor der erneuten Verbindung speichern kann. Bei gemeinsamen bzw. von Administratoren ausgeführten Rotationen wird das Bearer-Token niemals zurückgegeben.

### `openclaw devices revoke --device <id> --role <role>`

Ein Geräte-Token für eine Rolle widerrufen.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Ein gekoppelter Geräteaufrufer ohne Administratorrechte kann nur das Token seines **eigenen** Geräts widerrufen. Das Widerrufen des Tokens eines anderen Geräts erfordert `operator.admin`. Die Zielmenge an Geltungsbereichen muss außerdem innerhalb der eigenen Operator-Geltungsbereiche des Aufrufers liegen; Aufrufer, die nur über Kopplungsberechtigungen verfügen, können keine Administrator-/Schreibzugriffs-Operator-Tokens widerrufen.

## Hinweise

- Diese Befehle erfordern den Geltungsbereich `operator.pairing` (oder `operator.admin`). Nicht-Operator-Geräterollen erfordern immer `operator.admin`; siehe [Operator-Geltungsbereiche](/de/gateway/operator-scopes).
- Token-Rotation und -Widerruf bleiben innerhalb der genehmigten Kopplungsrollenmenge und der Geltungsbereichsbasislinie des Geräts. Ein vereinzelter zwischengespeicherter Token-Eintrag gewährt kein Ziel für die Token-Verwaltung.
- Bei Sitzungen mit Tokens gekoppelter Geräte ist die geräteübergreifende Verwaltung (`remove`, `rename`, `rotate`, `revoke`) auf das eigene Gerät beschränkt, sofern der Aufrufer nicht über `operator.admin` verfügt.
- Die Token-Rotation gibt ein neues Token zurück (vertraulich) – behandeln Sie es wie ein Geheimnis.
- Wenn der Kopplungs-Geltungsbereich im lokalen Loopback nicht verfügbar ist und kein ausdrückliches `--url` übergeben wird, können `list`/`approve` auf den lokalen Kopplungszustand zurückgreifen.

## Checkliste zur Behebung von Token-Abweichungen

Verwenden Sie diese Checkliste, wenn die Control UI oder andere Clients weiterhin mit `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` oder `AUTH_SCOPE_MISMATCH` fehlschlagen.

1. Aktuelle Quelle des Gateway-Tokens bestätigen:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Gekoppelte Geräte auflisten und die ID des betroffenen Geräts ermitteln:

   ```bash
   openclaw devices list
   ```

3. Das Operator-Token für das betroffene Gerät rotieren:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Wenn die Rotation nicht ausreicht, die veraltete Kopplung entfernen und erneut genehmigen:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Die Clientverbindung mit dem aktuellen gemeinsamen Token/Passwort erneut versuchen.

Hinweise:

- Normale Authentifizierungsrangfolge bei erneuter Verbindung: zuerst ausdrücklich angegebenes gemeinsames Token/Passwort, dann ausdrückliches `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Eine vertrauenswürdige `AUTH_TOKEN_MISMATCH`-Wiederherstellung kann für einen begrenzten Wiederholungsversuch vorübergehend sowohl das gemeinsame Token als auch das gespeicherte Geräte-Token zusammen senden.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, aber nicht über die angeforderte Menge an Geltungsbereichen verfügt. Korrigieren Sie den Genehmigungsvertrag für Kopplung und Geltungsbereiche, bevor Sie die gemeinsame Gateway-Authentifizierung ändern.

Verwandte Themen:

- [Fehlerbehebung bei der Dashboard-Authentifizierung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Erstmalige Genehmigung für Paperclip / `openclaw_gateway`

Paperclip-Agenten, die über den `openclaw_gateway`-Adapter eine Verbindung herstellen, durchlaufen dieselbe erstmalige Genehmigung der Gerätekopplung wie jeder andere neue Client. Wenn Paperclip `openclaw_gateway_pairing_required` meldet, genehmigen Sie das ausstehende Gerät und versuchen Sie es erneut.

```bash
openclaw devices approve --latest
```

Die Vorschau gibt den exakten `openclaw devices approve <requestId>`-Befehl aus. Überprüfen Sie die Details und führen Sie diesen Befehl anschließend mit der Anfrage-ID erneut aus, um die Anfrage zu genehmigen. Übergeben Sie bei einem entfernten Gateway oder ausdrücklichen Anmeldedaten während der Vorschau und Genehmigung dieselben Optionen:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Um eine erneute Genehmigung nach jedem Neustart zu vermeiden, konfigurieren Sie in Paperclip eine persistente `adapterConfig.devicePrivateKeyPem`, statt bei jedem Lauf eine neue kurzlebige Geräteidentität erzeugen zu lassen:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Wenn die Genehmigung weiterhin fehlschlägt, führen Sie zuerst `openclaw devices list` aus, um zu bestätigen, dass eine ausstehende Anfrage vorhanden ist.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)

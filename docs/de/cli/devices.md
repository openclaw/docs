---
read_when:
    - Sie genehmigen Geräte-Kopplungsanfragen
    - Sie müssen Geräte-Tokens rotieren oder widerrufen.
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-07-12T15:05:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Verwalten Sie Geräte-Kopplungsanfragen und gerätebezogene Tokens.

## Allgemeine Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, sofern konfiguriert)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (Passwortauthentifizierung)
- `--timeout <ms>`: RPC-Zeitüberschreitung
- `--json`: JSON-Ausgabe (für Skripte empfohlen)

<Warning>
Wenn Sie `--url` festlegen, greift die CLI nicht auf Anmeldedaten aus der Konfiguration oder der Umgebung zurück. Übergeben Sie `--token` oder `--password` explizit, andernfalls schlägt der Befehl fehl.
</Warning>

## Befehle

### `openclaw devices list`

Listet ausstehende Kopplungsanfragen und gekoppelte Geräte auf.

```bash
openclaw devices list
openclaw devices list --json
```

Bei einer ausstehenden Anfrage für ein bereits gekoppeltes Gerät zeigt die Ausgabe den angeforderten Zugriff neben dem aktuell genehmigten Zugriff des Geräts an. Dadurch sind Erweiterungen von Geltungsbereich oder Rolle sichtbar, statt wie eine verlorene Kopplung zu wirken.

Die Anzeigenamen gekoppelter Geräte verwenden diese Rangfolge: Operator-Bezeichnung (`operatorLabel` aus `devices rename`), dann `displayName` des Clients, dann `clientId`, dann `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Genehmigt eine ausstehende Kopplungsanfrage anhand der exakten `requestId`. Wenn `requestId` weggelassen oder `--latest` übergeben wird, wird lediglich eine Vorschau der neuesten ausstehenden Anfrage angezeigt und der Befehl beendet (Code 1). Führen Sie den Befehl zur Genehmigung erneut mit der exakten Anfrage-ID aus.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Wenn ein Gerät die Kopplung mit geänderten Authentifizierungsdetails (Rolle, Geltungsbereiche oder öffentlicher Schlüssel) erneut versucht, ersetzt OpenClaw den vorherigen ausstehenden Eintrag durch eine neue `requestId`. Führen Sie unmittelbar vor der Genehmigung `openclaw devices list` aus, um die aktuelle ID abzurufen.
</Note>

Genehmigungsverhalten:

- Wenn das Gerät bereits gekoppelt ist und umfassendere Geltungsbereiche oder eine andere Rolle anfordert, behält OpenClaw die bestehende Genehmigung bei und erstellt eine neue ausstehende Upgrade-Anfrage. Vergleichen Sie vor der Genehmigung `Requested` mit `Approved` in `openclaw devices list` oder zeigen Sie mit `--latest` eine Vorschau an.
- Die Genehmigung einer `node`-Rolle oder einer anderen Nicht-Operator-Rolle erfordert `operator.admin`. `operator.pairing` reicht für Genehmigungen von Operator-Geräten aus, jedoch nur, wenn die angeforderten Operator-Geltungsbereiche innerhalb der eigenen Geltungsbereiche des Aufrufers bleiben. Siehe [Operator-Geltungsbereiche](/de/gateway/operator-scopes).
- Wenn `gateway.nodes.pairing.autoApproveCidrs` konfiguriert ist, können erstmalige Anfragen mit `role: node` von übereinstimmenden Client-IP-Adressen automatisch genehmigt werden, bevor sie in dieser Liste erscheinen. Standardmäßig deaktiviert; gilt niemals für Operator-/Browser-Clients oder Upgrade-Anfragen.
- `gateway.nodes.pairing.sshVerify` (standardmäßig aktiviert) genehmigt erstmalige Anfragen mit `role: node` automatisch, wenn das Gateway den Geräteschlüssel per SSH auf dem Node-Host verifiziert. Anfragen können daher kurz nach ihrem Erscheinen als genehmigt aufgelöst werden. Legen Sie `sshVerify: false` fest, um die SSH-Verifizierung zu deaktivieren. Dies ist unabhängig von `autoApproveCidrs`; deaktivieren Sie daher auch diese Option, wenn ausschließlich manuelle Kopplung gewünscht ist.

### `openclaw devices reject <requestId>`

Lehnt eine ausstehende Geräte-Kopplungsanfrage ab.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Entfernt einen Eintrag eines gekoppelten Geräts.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Ein Aufrufer, der mit dem Token eines gekoppelten Geräts authentifiziert ist, kann nur seinen **eigenen** Geräteeintrag entfernen. Das Entfernen eines anderen Geräts erfordert `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Weist einem gekoppelten Gerät eine Operator-Bezeichnung zu. Bezeichnungen sind besitzerseitiger Zustand: Sie bleiben bei Reparaturen der Kopplung und erneuten Rollengenehmigungen erhalten und ändern die stabile `deviceId` nicht.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` ist erforderlich, wird von umgebenden Leerzeichen bereinigt, darf nicht leer sein und ist auf 64 Zeichen begrenzt.
- Anzeigeflächen (CLI-Liste, Inventar der Control UI) bevorzugen die Operator-Bezeichnung gegenüber dem vom Client gemeldeten Anzeigenamen.
- Ein gekoppelter Geräteaufrufer ohne Administratorrechte kann nur sein **eigenes** Gerät umbenennen. Das Umbenennen eines anderen Geräts erfordert `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Löscht gekoppelte Geräte gesammelt. Erfordert `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` lehnt außerdem alle ausstehenden Kopplungsanfragen ab.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotiert ein Geräte-Token für eine Rolle und aktualisiert optional dessen Geltungsbereiche.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Die Zielrolle muss bereits im genehmigten Kopplungsvertrag dieses Geräts vorhanden sein; durch Rotation kann keine neue, nicht genehmigte Rolle erzeugt werden.
- Wenn `--scope` weggelassen wird, werden bei späteren Wiederverbindungen die zwischengespeicherten genehmigten Geltungsbereiche des gespeicherten Tokens wiederverwendet. Durch die Übergabe expliziter `--scope`-Werte wird der gespeicherte Geltungsbereichssatz für zukünftige Wiederverbindungen mit zwischengespeicherten Tokens ersetzt.
- Ein gekoppelter Geräteaufrufer ohne Administratorrechte kann nur sein **eigenes** Geräte-Token rotieren, und der Zielgeltungsbereichssatz muss innerhalb der eigenen Operator-Geltungsbereiche des Aufrufers bleiben. Durch Rotation kann kein umfassenderes Token erzeugt oder beibehalten werden, als der Aufrufer bereits besitzt.

Gibt Rotationsmetadaten als JSON zurück. Wenn der Aufrufer sein eigenes Token rotiert, während er mit diesem Geräte-Token authentifiziert ist, enthält die Antwort das Ersatz-Token, damit der Client es vor der erneuten Verbindung speichern kann. Gemeinsame bzw. Administratorrotationen geben das Bearer-Token niemals zurück.

### `openclaw devices revoke --device <id> --role <role>`

Widerruft ein Geräte-Token für eine Rolle.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Ein gekoppelter Geräteaufrufer ohne Administratorrechte kann nur sein **eigenes** Geräte-Token widerrufen. Das Widerrufen des Tokens eines anderen Geräts erfordert `operator.admin`. Der Zielgeltungsbereichssatz muss außerdem innerhalb der eigenen Operator-Geltungsbereiche des Aufrufers liegen; Aufrufer mit ausschließlicher Kopplungsberechtigung können keine Administrator-/Schreibzugriff-Operator-Tokens widerrufen.

## Hinweise

- Diese Befehle erfordern den Geltungsbereich `operator.pairing` (oder `operator.admin`). Nicht-Operator-Geräterollen erfordern immer `operator.admin`; siehe [Operator-Geltungsbereiche](/de/gateway/operator-scopes).
- Token-Rotation und -Widerruf bleiben innerhalb des genehmigten Kopplungsrollensatzes und der Geltungsbereichsbasis des Geräts. Ein verwaister zwischengespeicherter Token-Eintrag gewährt kein Ziel für die Token-Verwaltung.
- Bei Token-Sitzungen gekoppelter Geräte ist die geräteübergreifende Verwaltung (`remove`, `rename`, `rotate`, `revoke`) auf das eigene Gerät beschränkt, sofern der Aufrufer nicht über `operator.admin` verfügt.
- Die Token-Rotation gibt ein neues Token zurück (vertraulich) — behandeln Sie es wie ein Geheimnis.
- Wenn der Kopplungsgeltungsbereich auf dem lokalen Loopback nicht verfügbar ist und kein explizites `--url` übergeben wird, können `list`/`approve` auf den lokalen Kopplungszustand zurückgreifen.

## Checkliste zur Behebung von Token-Abweichungen

Verwenden Sie diese Checkliste, wenn die Control UI oder andere Clients wiederholt mit `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` oder `AUTH_SCOPE_MISMATCH` fehlschlagen.

1. Bestätigen Sie die aktuelle Quelle des Gateway-Tokens:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Listen Sie gekoppelte Geräte auf und ermitteln Sie die ID des betroffenen Geräts:

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

5. Versuchen Sie die Clientverbindung mit dem aktuellen gemeinsamen Token/Passwort erneut.

Hinweise:

- Normale Authentifizierungsrangfolge bei erneuter Verbindung: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Bei der vertrauenswürdigen Wiederherstellung nach `AUTH_TOKEN_MISMATCH` können für einen begrenzten Wiederholungsversuch vorübergehend sowohl das gemeinsame Token als auch das gespeicherte Geräte-Token zusammen gesendet werden.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, aber nicht über den angeforderten Geltungsbereichssatz verfügt. Korrigieren Sie den Vertrag zur Genehmigung von Kopplung und Geltungsbereichen, bevor Sie die gemeinsame Gateway-Authentifizierung ändern.

Verwandte Themen:

- [Fehlerbehebung bei der Dashboard-Authentifizierung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Fehlerbehebung für das Gateway](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip-/`openclaw_gateway`-Genehmigung beim ersten Start

Paperclip-Agenten, die über den `openclaw_gateway`-Adapter eine Verbindung herstellen, durchlaufen dieselbe Genehmigung der Geräte-Kopplung beim ersten Start wie jeder andere neue Client. Wenn Paperclip `openclaw_gateway_pairing_required` meldet, genehmigen Sie das ausstehende Gerät und versuchen Sie es erneut.

```bash
openclaw devices approve --latest
```

Die Vorschau gibt den exakten Befehl `openclaw devices approve <requestId>` aus. Prüfen Sie die Details und führen Sie diesen Befehl anschließend mit der Anfrage-ID erneut aus, um die Anfrage zu genehmigen. Übergeben Sie für ein entferntes Gateway oder explizite Anmeldedaten bei Vorschau und Genehmigung dieselben Optionen:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Um eine erneute Genehmigung nach jedem Neustart zu vermeiden, konfigurieren Sie in Paperclip einen dauerhaften Wert für `adapterConfig.devicePrivateKeyPem`, statt bei jeder Ausführung eine neue flüchtige Geräteidentität erzeugen zu lassen:

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

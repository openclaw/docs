---
read_when:
    - Sie genehmigen Geräte-Kopplungsanfragen
    - Sie müssen Geräte-Token rotieren oder widerrufen
summary: CLI-Referenz für `openclaw devices` (Gerätekopplung + Token-Rotation/-Widerruf)
title: Geräte
x-i18n:
    generated_at: "2026-07-12T01:28:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Verwalten Sie Geräte-Kopplungsanfragen und gerätebezogene Token.

## Allgemeine Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, sofern konfiguriert)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (Passwortauthentifizierung)
- `--timeout <ms>`: RPC-Zeitüberschreitung
- `--json`: JSON-Ausgabe (für Skripte empfohlen)

<Warning>
Wenn Sie `--url` festlegen, greift die CLI nicht auf Anmeldedaten aus der Konfiguration oder Umgebung zurück. Übergeben Sie `--token` oder `--password` ausdrücklich, andernfalls schlägt der Befehl fehl.
</Warning>

## Befehle

### `openclaw devices list`

Listet ausstehende Kopplungsanfragen und gekoppelte Geräte auf.

```bash
openclaw devices list
openclaw devices list --json
```

Bei einer ausstehenden Anfrage für ein bereits gekoppeltes Gerät zeigt die Ausgabe den angeforderten Zugriff neben dem derzeit genehmigten Zugriff des Geräts an. Dadurch sind Erweiterungen von Berechtigungsumfang oder Rolle erkennbar, statt wie eine verloren gegangene Kopplung zu wirken.

Anzeigenamen gekoppelter Geräte verwenden diese Prioritätsreihenfolge: Betreiberbezeichnung (`operatorLabel` aus `devices rename`), dann `displayName` des Clients, dann `clientId`, dann `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Genehmigt eine ausstehende Kopplungsanfrage anhand der exakten `requestId`. Wenn Sie `requestId` weglassen oder `--latest` übergeben, wird nur eine Vorschau der neuesten ausstehenden Anfrage angezeigt und der Befehl beendet sich (Code 1). Führen Sie ihn zur Genehmigung erneut mit der exakten Anfrage-ID aus.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Wenn ein Gerät die Kopplung mit geänderten Authentifizierungsdetails (Rolle, Berechtigungsumfänge oder öffentlicher Schlüssel) erneut versucht, ersetzt OpenClaw den vorherigen ausstehenden Eintrag durch eine neue `requestId`. Führen Sie unmittelbar vor der Genehmigung `openclaw devices list` aus, um die aktuelle ID abzurufen.
</Note>

Genehmigungsverhalten:

- Wenn das Gerät bereits gekoppelt ist und weiter gefasste Berechtigungsumfänge oder eine andere Rolle anfordert, behält OpenClaw die bestehende Genehmigung bei und erstellt eine neue ausstehende Erweiterungsanfrage. Vergleichen Sie vor der Genehmigung in `openclaw devices list` `Requested` mit `Approved` oder zeigen Sie mit `--latest` eine Vorschau an.
- Die Genehmigung einer `node`-Rolle oder einer anderen Nicht-Betreiberrolle erfordert `operator.admin`. `operator.pairing` genügt für Genehmigungen von Betreibergeräten, jedoch nur, wenn die angeforderten Betreiber-Berechtigungsumfänge innerhalb der eigenen Berechtigungsumfänge des Aufrufers bleiben. Siehe [Betreiber-Berechtigungsumfänge](/de/gateway/operator-scopes).
- Wenn `gateway.nodes.pairing.autoApproveCidrs` konfiguriert ist, können erstmalige Anfragen mit `role: node` von übereinstimmenden Client-IP-Adressen automatisch genehmigt werden, bevor sie in dieser Liste erscheinen. Standardmäßig deaktiviert; gilt niemals für Betreiber-/Browser-Clients oder Erweiterungsanfragen.
- `gateway.nodes.pairing.sshVerify` (standardmäßig aktiviert) genehmigt erstmalige Anfragen mit `role: node` automatisch, wenn das Gateway den Geräteschlüssel per SSH gegenüber dem Node-Host verifiziert. Anfragen können daher kurz nach ihrem Erscheinen bereits als genehmigt aufgelöst werden. Legen Sie `sshVerify: false` fest, um die SSH-Verifizierung zu deaktivieren. Dies ist unabhängig von `autoApproveCidrs`; deaktivieren Sie daher auch diese Option, wenn ausschließlich manuelle Kopplung gewünscht ist.

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

Ein Aufrufer, der mit dem Token eines gekoppelten Geräts authentifiziert ist, kann nur den Eintrag seines **eigenen** Geräts entfernen. Das Entfernen eines anderen Geräts erfordert `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Weist einem gekoppelten Gerät eine Betreiberbezeichnung zu. Bezeichnungen sind betreiberseitiger Zustand: Sie bleiben nach Reparaturen der Kopplung und erneuten Rollengenehmigungen erhalten und ändern die stabile `deviceId` nicht.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` ist erforderlich, wird von umgebenden Leerzeichen bereinigt, darf nicht leer sein und ist auf 64 Zeichen begrenzt.
- Anzeigeoberflächen (CLI-Liste, Inventar der Control UI) bevorzugen die Betreiberbezeichnung gegenüber dem vom Client gemeldeten Anzeigenamen.
- Ein Aufrufer eines gekoppelten Geräts ohne Administratorrechte kann nur sein **eigenes** Gerät umbenennen. Das Umbenennen eines anderen Geräts erfordert `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Löscht gekoppelte Geräte gesammelt. Erfordert `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` lehnt außerdem alle ausstehenden Kopplungsanfragen ab.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Erneuert ein Geräte-Token für eine Rolle und aktualisiert optional dessen Berechtigungsumfänge.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Die Zielrolle muss bereits im genehmigten Kopplungsvertrag dieses Geräts vorhanden sein; durch die Erneuerung kann keine neue, nicht genehmigte Rolle erzeugt werden.
- Wenn Sie `--scope` weglassen, werden bei späteren Neuverbindungen die zwischengespeicherten genehmigten Berechtigungsumfänge des gespeicherten Tokens wiederverwendet. Durch die Übergabe ausdrücklicher `--scope`-Werte wird die gespeicherte Menge der Berechtigungsumfänge für künftige Neuverbindungen mit zwischengespeicherten Token ersetzt.
- Ein Aufrufer eines gekoppelten Geräts ohne Administratorrechte kann nur das Token seines **eigenen** Geräts erneuern, und die Zielmenge der Berechtigungsumfänge muss innerhalb der eigenen Betreiber-Berechtigungsumfänge des Aufrufers bleiben. Durch die Erneuerung kann kein weiter gefasstes Token erzeugt oder beibehalten werden, als der Aufrufer bereits besitzt.

Gibt Metadaten zur Erneuerung als JSON zurück. Wenn der Aufrufer sein eigenes Token erneuert, während er mit diesem Geräte-Token authentifiziert ist, enthält die Antwort das Ersatz-Token, damit der Client es vor der Neuverbindung dauerhaft speichern kann. Gemeinsam verwendete Erneuerungen oder Erneuerungen durch Administratoren geben das Bearer-Token niemals zurück.

### `openclaw devices revoke --device <id> --role <role>`

Widerruft ein Geräte-Token für eine Rolle.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Ein Aufrufer eines gekoppelten Geräts ohne Administratorrechte kann nur das Token seines **eigenen** Geräts widerrufen. Das Widerrufen des Tokens eines anderen Geräts erfordert `operator.admin`. Die Zielmenge der Berechtigungsumfänge muss außerdem innerhalb der eigenen Betreiber-Berechtigungsumfänge des Aufrufers liegen; Aufrufer mit ausschließlicher Kopplungsberechtigung können keine Administrator-/Schreib-Token von Betreibern widerrufen.

## Hinweise

- Diese Befehle erfordern den Berechtigungsumfang `operator.pairing` (oder `operator.admin`). Geräte mit Nicht-Betreiberrollen erfordern immer `operator.admin`; siehe [Betreiber-Berechtigungsumfänge](/de/gateway/operator-scopes).
- Token-Erneuerung und -Widerruf bleiben innerhalb der genehmigten Kopplungsrollen und des grundlegenden Berechtigungsumfangs des Geräts. Ein verwaister zwischengespeicherter Token-Eintrag gewährt kein Ziel für die Token-Verwaltung.
- Bei Sitzungen mit Token gekoppelter Geräte ist die geräteübergreifende Verwaltung (`remove`, `rename`, `rotate`, `revoke`) auf das eigene Gerät beschränkt, sofern der Aufrufer nicht über `operator.admin` verfügt.
- Die Token-Erneuerung gibt ein neues Token zurück (vertraulich) — behandeln Sie es wie ein Geheimnis.
- Wenn der Kopplungs-Berechtigungsumfang auf local loopback nicht verfügbar ist und kein ausdrückliches `--url` übergeben wird, können `list`/`approve` auf den lokalen Kopplungszustand zurückgreifen.

## Checkliste zur Behebung abweichender Token

Verwenden Sie diese Checkliste, wenn die Control UI oder andere Clients wiederholt mit `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` oder `AUTH_SCOPE_MISMATCH` fehlschlagen.

1. Bestätigen Sie die aktuelle Quelle des Gateway-Tokens:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Listen Sie die gekoppelten Geräte auf und ermitteln Sie die ID des betroffenen Geräts:

   ```bash
   openclaw devices list
   ```

3. Erneuern Sie das Betreiber-Token für das betroffene Gerät:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Wenn die Erneuerung nicht ausreicht, entfernen Sie die veraltete Kopplung und genehmigen Sie sie erneut:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Versuchen Sie die Client-Verbindung erneut mit dem aktuellen gemeinsam verwendeten Token/Passwort.

Hinweise:

- Normale Authentifizierungspriorität bei Neuverbindungen: zuerst ausdrücklich angegebenes gemeinsam verwendetes Token/Passwort, dann ausdrücklich angegebenes `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Bei vertrauenswürdiger Wiederherstellung nach `AUTH_TOKEN_MISMATCH` können vorübergehend sowohl das gemeinsam verwendete Token als auch das gespeicherte Geräte-Token zusammen für einen begrenzten Wiederholungsversuch gesendet werden.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, aber nicht die angeforderte Menge an Berechtigungsumfängen enthält. Korrigieren Sie den Genehmigungsvertrag für Kopplung und Berechtigungsumfänge, bevor Sie die gemeinsam verwendete Gateway-Authentifizierung ändern.

Verwandte Themen:

- [Fehlerbehebung bei der Dashboard-Authentifizierung](/de/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Erstmalige Genehmigung für Paperclip / `openclaw_gateway`

Paperclip-Agenten, die über den Adapter `openclaw_gateway` eine Verbindung herstellen, durchlaufen dieselbe erstmalige Genehmigung der Gerätekopplung wie jeder andere neue Client. Wenn Paperclip `openclaw_gateway_pairing_required` meldet, genehmigen Sie das ausstehende Gerät und versuchen Sie es erneut.

```bash
openclaw devices approve --latest
```

Die Vorschau gibt den exakten Befehl `openclaw devices approve <requestId>` aus. Überprüfen Sie die Details und führen Sie diesen Befehl anschließend erneut mit der Anfrage-ID aus, um die Anfrage zu genehmigen. Übergeben Sie bei einem entfernten Gateway oder ausdrücklichen Anmeldedaten während der Vorschau und der Genehmigung dieselben Optionen:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Um eine erneute Genehmigung nach jedem Neustart zu vermeiden, konfigurieren Sie in Paperclip ein dauerhaftes `adapterConfig.devicePrivateKeyPem`, anstatt bei jedem Durchlauf eine neue kurzlebige Geräteidentität erzeugen zu lassen:

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

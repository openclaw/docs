---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Matrix-Unterstützungsstatus, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix ist ein gebündeltes Channel-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher benötigen normale
gepackte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Matrix ausschließt, installieren
Sie es manuell:

Von npm installieren:

```bash
openclaw plugins install @openclaw/matrix
```

Aus einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Siehe [Plugins](/de/tools/plugin) für Plugin-Verhalten und Installationsregeln.

## Einrichtung

1. Stellen Sie sicher, dass das Matrix-Plugin verfügbar ist.
   - Aktuelle gepackte OpenClaw-Versionen enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
3. Konfigurieren Sie `channels.matrix` mit entweder:
   - `homeserver` + `accessToken`, oder
   - `homeserver` + `userId` + `password`.
4. Starten Sie das Gateway neu.
5. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein.
   - Neue Matrix-Einladungen funktionieren nur, wenn `channels.matrix.autoJoin` sie zulässt.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

Der Matrix-Assistent fragt nach:

- Homeserver-URL
- Authentifizierungsmethode: Access Token oder Passwort
- Benutzer-ID (nur bei Passwort-Authentifizierung)
- optionalem Gerätenamen
- ob E2EE aktiviert werden soll
- ob Raumzugriff und automatisches Beitreten bei Einladungen konfiguriert werden sollen

Wichtige Verhaltensweisen des Assistenten:

- Wenn Matrix-Authentifizierungs-Umgebungsvariablen bereits vorhanden sind und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Umgebungsvariablen-Verknüpfung an, um die Authentifizierung in Umgebungsvariablen zu belassen.
- Kontonamen werden auf die Konto-ID normalisiert. Zum Beispiel wird `Ops Bot` zu `ops-bot`.
- Einträge in der DM-Allowlist akzeptieren direkt `@user:server`; Anzeigenamen funktionieren nur, wenn die Live-Verzeichnissuche genau einen Treffer findet.
- Einträge in der Raum-Allowlist akzeptieren direkt Raum-IDs und Aliase. Bevorzugen Sie `!room:server` oder `#alias:server`; nicht aufgelöste Namen werden zur Laufzeit bei der Allowlist-Auflösung ignoriert.
- Im Allowlist-Modus für automatisches Beitreten bei Einladungen verwenden Sie nur stabile Einladungsziele: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.
- Um Raumnamen vor dem Speichern aufzulösen, verwenden Sie `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` ist standardmäßig auf `off` gesetzt.

Wenn Sie es nicht setzen, tritt der Bot eingeladenen Räumen oder neuen DM-artigen Einladungen nicht bei. Er erscheint also nicht in neuen Gruppen oder eingeladenen DMs, wenn Sie ihn nicht zuerst manuell beitreten lassen.

Setzen Sie `autoJoin: "allowlist"` zusammen mit `autoJoinAllowlist`, um einzuschränken, welche Einladungen akzeptiert werden, oder setzen Sie `autoJoin: "always"`, wenn er jeder Einladung beitreten soll.

Im Modus `allowlist` akzeptiert `autoJoinAllowlist` nur `!roomId:server`, `#alias:server` oder `*`.
</Warning>

Allowlist-Beispiel:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Jeder Einladung beitreten:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Minimale tokenbasierte Einrichtung:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Passwortbasierte Einrichtung (das Token wird nach der Anmeldung zwischengespeichert):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix speichert zwischengespeicherte Anmeldedaten in `~/.openclaw/credentials/matrix/`.
Das Standardkonto verwendet `credentials.json`; benannte Konten verwenden `credentials-<account>.json`.
Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, behandelt OpenClaw Matrix als für Einrichtung, Doctor und Channel-Status-Erkennung konfiguriert, auch wenn die aktuelle Authentifizierung nicht direkt in der Konfiguration gesetzt ist.

Entsprechende Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Für Nicht-Standardkonten verwenden Sie kontospezifische Umgebungsvariablen:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Beispiel für das Konto `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Für die normalisierte Konto-ID `ops-bot` verwenden Sie:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix maskiert Satzzeichen in Konto-IDs, damit kontospezifische Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, sodass `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet wird.

Der interaktive Assistent bietet die Umgebungsvariablen-Verknüpfung nur an, wenn diese Authentifizierungs-Umgebungsvariablen bereits vorhanden sind und für das ausgewählte Konto noch keine Matrix-Authentifizierung in der Konfiguration gespeichert ist.

`MATRIX_HOMESERVER` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Konfigurationsbeispiel

Dies ist eine praktische Basiskonfiguration mit DM-Pairing, Raum-Allowlist und aktivierter E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen. OpenClaw kann einen
eingeladenen Raum zum Zeitpunkt der Einladung nicht zuverlässig als DM oder Gruppe klassifizieren, daher laufen alle Einladungen zuerst über `autoJoin`.
`dm.policy` gilt, nachdem der Bot beigetreten ist und der Raum als DM klassifiziert wurde.

## Streaming-Vorschauen

Matrix-Antwort-Streaming ist optional.

Setzen Sie `channels.matrix.streaming` auf `"partial"`, wenn OpenClaw eine einzelne Live-Vorschauantwort senden,
diese Vorschau während der Textgenerierung durch das Modell direkt bearbeiten und sie abschließen soll, wenn die
Antwort fertig ist:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` ist die Standardeinstellung. OpenClaw wartet auf die endgültige Antwort und sendet sie einmal.
- `streaming: "partial"` erstellt eine bearbeitbare Vorschau-Nachricht für den aktuellen Assistentenblock mit normalen Matrix-Textnachrichten. Dadurch bleibt das Legacy-Benachrichtigungsverhalten von Matrix mit erster Vorschau erhalten, sodass Standard-Clients möglicherweise bei der ersten gestreamten Vorschau statt beim fertigen Block benachrichtigen.
- `streaming: "quiet"` erstellt einen bearbeitbaren stillen Vorschauhinweis für den aktuellen Assistentenblock. Verwenden Sie dies nur, wenn Sie zusätzlich Push-Regeln für Empfänger zu abgeschlossenen Vorschau-Bearbeitungen konfigurieren.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Wenn Vorschau-Streaming aktiviert ist, behält Matrix den Live-Entwurf für den aktuellen Block bei und bewahrt abgeschlossene Blöcke als separate Nachrichten.
- Wenn Vorschau-Streaming aktiviert ist und `blockStreaming` deaktiviert ist, bearbeitet Matrix den Live-Entwurf direkt und finalisiert dasselbe Ereignis, wenn der Block oder Turn abgeschlossen ist.
- Wenn die Vorschau nicht mehr in ein einzelnes Matrix-Ereignis passt, beendet OpenClaw das Vorschau-Streaming und fällt auf normale endgültige Zustellung zurück.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie, bevor die endgültige Medienantwort gesendet wird.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lassen Sie Streaming deaktiviert, wenn Sie das konservativste Rate-Limit-Verhalten möchten.

`blockStreaming` aktiviert für sich genommen keine Entwurfs-Vorschauen.
Verwenden Sie `streaming: "partial"` oder `streaming: "quiet"` für Vorschau-Bearbeitungen; fügen Sie dann `blockStreaming: true` nur hinzu, wenn abgeschlossene Assistentenblöcke auch als separate Fortschrittsnachrichten sichtbar bleiben sollen.

Wenn Sie Matrix-Standardbenachrichtigungen ohne benutzerdefinierte Push-Regeln benötigen, verwenden Sie `streaming: "partial"` für Vorschau-zuerst-Verhalten oder lassen Sie `streaming` deaktiviert für reine Endzustellung. Mit `streaming: "off"`:

- `blockStreaming: true` sendet jeden abgeschlossenen Block als normale benachrichtigende Matrix-Nachricht.
- `blockStreaming: false` sendet nur die endgültig abgeschlossene Antwort als normale benachrichtigende Matrix-Nachricht.

### Selbstgehostete Push-Regeln für stille abgeschlossene Vorschauen

Stilles Streaming (`streaming: "quiet"`) benachrichtigt Empfänger erst, wenn ein Block oder Turn abgeschlossen ist — eine Push-Regel pro Benutzer muss auf den Marker für die abgeschlossene Vorschau passen. Siehe [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules) für die vollständige Einrichtung (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie absichtlich Matrix-Verkehr zwischen Agenten zulassen möchten:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten in erlaubten Räumen und DMs.
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur dann, wenn sie diesen Bot sichtbar erwähnen. DMs sind weiterhin erlaubt.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwort-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von Bots verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

Verschlüsselung aktivieren:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Verifizierungsbefehle (alle akzeptieren `--verbose` für Diagnosen und `--json` für maschinenlesbare Ausgabe):

```bash
openclaw matrix verify status
```

Ausführlicher Status (vollständige Diagnosen):

```bash
openclaw matrix verify status --verbose
```

Den gespeicherten Recovery-Schlüssel in die maschinenlesbare Ausgabe aufnehmen:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-Signing- und Verifizierungsstatus initialisieren:

```bash
openclaw matrix verify bootstrap
```

Ausführliche Bootstrap-Diagnosen:

```bash
openclaw matrix verify bootstrap --verbose
```

Vor dem Bootstrap ein neues Zurücksetzen der Cross-Signing-Identität erzwingen:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Dieses Gerät mit einem Recovery-Schlüssel verifizieren:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Dieser Befehl meldet drei getrennte Zustände:

- `Recovery key accepted`: Matrix hat den Recovery-Schlüssel für Secret Storage oder Gerätevertrauen akzeptiert.
- `Backup usable`: Das Room-Key-Backup kann mit vertrauenswürdigem Recovery-Material geladen werden.
- `Device verified by owner`: Das aktuelle OpenClaw-Gerät hat vollständiges Vertrauen in die Matrix-Cross-Signing-Identität.

`Signed by owner` in ausführlicher oder JSON-Ausgabe dient nur diagnostischen Zwecken. OpenClaw behandelt
dies nicht als ausreichend, sofern `Cross-signing verified` nicht ebenfalls `yes` ist.

Der Befehl beendet sich weiterhin mit einem Nicht-Null-Status, wenn das vollständige Vertrauen in die Matrix-Identität unvollständig ist,
selbst wenn der Recovery-Schlüssel Backup-Material entsperren kann. Führen Sie in diesem Fall
die Selbstverifizierung in einem anderen Matrix-Client durch:

```bash
openclaw matrix verify self
```

Akzeptieren Sie die Anfrage in einem anderen Matrix-Client, vergleichen Sie die SAS-Emoji oder Dezimalzahlen
und geben Sie `yes` nur ein, wenn sie übereinstimmen. Der Befehl wartet, bis Matrix
`Cross-signing verified: yes` meldet, bevor er erfolgreich beendet wird.

Verwenden Sie `verify bootstrap --force-reset-cross-signing` nur, wenn Sie die aktuelle
Cross-Signing-Identität absichtlich ersetzen möchten.

Ausführliche Details zur Geräteverifizierung:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Zustand des Room-Key-Backups prüfen:

```bash
openclaw matrix verify backup status
```

Ausführliche Diagnosen zum Backup-Zustand:

```bash
openclaw matrix verify backup status --verbose
```

Room-Keys aus dem Server-Backup wiederherstellen:

```bash
openclaw matrix verify backup restore
```

Wenn der Backup-Schlüssel nicht bereits auf der Festplatte geladen ist, übergeben Sie den Matrix-Recovery-Schlüssel:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

Interaktiver Selbstverifizierungsablauf:

```bash
openclaw matrix verify self
```

Für Low-Level- oder eingehende Verifizierungsanfragen verwenden Sie:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Verwenden Sie `openclaw matrix verify cancel <id>`, um eine Anfrage abzubrechen.

Ausführliche Wiederherstellungsdiagnosen:

```bash
openclaw matrix verify backup restore --verbose
```

Löschen Sie das aktuelle Server-Backup und erstellen Sie eine neue Backup-Basis. Wenn der gespeicherte
Backup-Schlüssel nicht sauber geladen werden kann, kann dieses Zurücksetzen auch den Secret Storage neu erstellen, damit
zukünftige Kaltstarts den neuen Backup-Schlüssel laden können:

```bash
openclaw matrix verify backup reset --yes
```

Alle `verify`-Befehle sind standardmäßig knapp gehalten (einschließlich stiller interner SDK-Protokollierung) und zeigen detaillierte Diagnosen nur mit `--verbose`.
Verwenden Sie `--json` für vollständige maschinenlesbare Ausgabe bei der Skripterstellung.

In Multi-Account-Setups verwenden Matrix-CLI-Befehle implizit das Matrix-Standardkonto, sofern Sie nicht `--account <id>` übergeben.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie zuerst `channels.matrix.defaultAccount`, sonst halten diese impliziten CLI-Operationen an und fordern Sie auf, ein Konto explizit auszuwählen.
Verwenden Sie `--account` immer dann, wenn Verifizierungs- oder Geräteoperationen ausdrücklich auf ein benanntes Konto zielen sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Was verified bedeutet">
    OpenClaw behandelt ein Gerät nur dann als verified, wenn Ihre eigene Cross-Signing-Identität es signiert. `verify status --verbose` zeigt drei Vertrauenssignale an:

    - `Locally trusted`: nur von diesem Client als vertrauenswürdig eingestuft
    - `Cross-signing verified`: das SDK meldet Verifizierung über Cross-Signing
    - `Signed by owner`: von Ihrem eigenen Self-Signing-Schlüssel signiert

    `Verified by owner` wird nur dann zu `yes`, wenn eine Cross-Signing-Verifizierung vorliegt.
    Lokales Vertrauen oder eine Eigentümersignatur allein reichen für OpenClaw nicht aus,
    um das Gerät als vollständig verifiziert zu behandeln.

  </Accordion>

  <Accordion title="Was bootstrap macht">
    `verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Konten. Der Reihe nach:

    - initialisiert es Secret Storage und verwendet nach Möglichkeit einen vorhandenen Recovery-Schlüssel wieder
    - initialisiert es Cross-Signing und lädt fehlende öffentliche Cross-Signing-Schlüssel hoch
    - markiert und cross-signiert es das aktuelle Gerät
    - erstellt es ein serverseitiges Room-Key-Backup, falls noch keines existiert

    Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln verlangt, versucht OpenClaw zuerst ohne Authentifizierung, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`). Verwenden Sie `--force-reset-cross-signing` nur, wenn Sie die aktuelle Identität absichtlich verwerfen möchten.

  </Accordion>

  <Accordion title="Neue Backup-Basis">
    Wenn Sie möchten, dass zukünftige verschlüsselte Nachrichten weiter funktionieren, und den Verlust nicht wiederherstellbarer alter Verläufe akzeptieren:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Fügen Sie `--account <id>` hinzu, um ein benanntes Konto als Ziel zu verwenden. Dadurch kann auch Secret Storage neu erstellt werden, wenn das aktuelle Backup-Secret nicht sicher geladen werden kann.
    Fügen Sie `--rotate-recovery-key` nur hinzu, wenn Sie ausdrücklich möchten, dass der alte Recovery-Schlüssel
    die neue Backup-Basis nicht mehr entsperren kann.

  </Accordion>

  <Accordion title="Startverhalten">
    Mit `encryption: true` ist `startupVerification` standardmäßig `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät in einem anderen Matrix-Client eine Selbstverifizierung an, überspringt Duplikate und wendet eine Abkühlzeit an. Passen Sie dies mit `startupVerificationCooldownHours` an oder deaktivieren Sie es mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Krypto-Bootstrap-Durchlauf ausgeführt, der den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Zustand beschädigt ist, versucht OpenClaw eine abgesicherte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA verlangt, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Eigentümer signierte Geräte bleiben erhalten.

    Siehe [Matrix migration](/de/install/migrating-matrix) für den vollständigen Upgrade-Ablauf.

  </Accordion>

  <Accordion title="Verifizierungshinweise">
    Matrix veröffentlicht Hinweise zum Verifizierungslebenszyklus im strikten DM-Verifizierungsraum als `m.notice`-Nachrichten: Anfrage, Bereit, Start/Abschluss und SAS-Details (Emoji/Dezimalzahlen), sofern verfügbar.

    Eingehende Anfragen aus einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Bei der Selbstverifizierung startet OpenClaw den SAS-Ablauf automatisch und bestätigt seine eigene Seite, sobald die Emoji-Verifizierung verfügbar ist — Sie müssen in Ihrem Matrix-Client trotzdem vergleichen und „They match“ bestätigen.

    Verifizierungs-Systemhinweise werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Gelöschtes oder ungültiges Matrix-Gerät">
    Wenn `verify status` meldet, dass das aktuelle Gerät nicht mehr auf dem
    Homeserver aufgeführt ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für Passwort-Login:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Für Token-Authentifizierung erstellen Sie in Ihrem Matrix-Client oder Ihrer Admin-Oberfläche
    ein neues Access Token und aktualisieren dann OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Ersetzen Sie `assistant` durch die Konto-ID aus dem fehlgeschlagenen Befehl oder lassen Sie
    `--account` für das Standardkonto weg.

  </Accordion>

  <Accordion title="Gerätehygiene">
    Alte von OpenClaw verwaltete Geräte können sich ansammeln. Auflisten und bereinigen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Krypto-Store">
    Matrix-E2EE verwendet den offiziellen `matrix-js-sdk`-Rust-Krypto-Pfad mit `fake-indexeddb` als IndexedDB-Shim. Der Krypto-Zustand wird in `crypto-idb-snapshot.json` persistiert (mit restriktiven Dateiberechtigungen).

    Verschlüsselter Laufzeitstatus liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Sync-Store, den Krypto-Store, den Recovery-Schlüssel, den IDB-Snapshot, Thread-Bindings und den Startverifizierungsstatus. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw das beste vorhandene Root erneut, sodass der vorherige Zustand sichtbar bleibt.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Fügen Sie `--account <id>` hinzu, wenn Sie ausdrücklich ein benanntes Matrix-Konto als Ziel verwenden möchten.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn Sie eine `http://`- oder `https://`-Avatar-URL übergeben, lädt OpenClaw diese zuerst zu Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder in den ausgewählten Konto-Override).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sendungen des Nachrichtentools.

- `dm.sessionScope: "per-user"` (Standard) hält das Matrix-DM-Routing absenderspezifisch, sodass mehrere DM-Räume eine Sitzung gemeinsam nutzen können, wenn sie demselben Peer zugeordnet werden.
- `dm.sessionScope: "per-room"` isoliert jeden Matrix-DM-Raum in seinen eigenen Sitzungsschlüssel, verwendet aber weiterhin normale DM-Authentifizierungs- und Allowlist-Prüfungen.
- Explizite Matrix-Konversationsbindungen haben weiterhin Vorrang vor `dm.sessionScope`, sodass gebundene Räume und Threads ihr gewähltes Ziel für die Sitzung beibehalten.
- `threadReplies: "off"` hält Antworten auf der obersten Ebene und belässt eingehende Thread-Nachrichten in der übergeordneten Sitzung.
- `threadReplies: "inbound"` antwortet innerhalb eines Threads nur dann, wenn die eingehende Nachricht bereits in diesem Thread war.
- `threadReplies: "always"` hält Raumantworten in einem Thread, der in der auslösenden Nachricht verwurzelt ist, und leitet diese Konversation ab der ersten auslösenden Nachricht durch die passende threadspezifische Sitzung.
- `dm.threadReplies` überschreibt die Einstellung der obersten Ebene nur für DMs. So können Sie z. B. Raum-Threads isoliert halten und DMs flach belassen.
- Eingehende Thread-Nachrichten enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Sendungen des Nachrichtentools übernehmen automatisch den aktuellen Matrix-Thread, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern keine explizite `threadId` angegeben wird.
- Die Wiederverwendung desselben sitzungsbezogenen DM-Benutzerziels greift nur dann, wenn die aktuellen Sitzungsmetadaten denselben DM-Peer auf demselben Matrix-Konto nachweisen; andernfalls greift OpenClaw auf normales benutzerspezifisches Routing zurück.
- Wenn OpenClaw feststellt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsamen Matrix-DM-Sitzung kollidiert, sendet es in diesem Raum einmalig ein `m.notice` mit dem `/focus`-Ausweg, wenn Thread-Bindings aktiviert sind und der Hinweis `dm.sessionScope` gesetzt ist.
- Laufzeit-Thread-Bindings werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren in Matrix-Räumen und DMs.
- `/focus` auf oberster Ebene in einem Matrix-Raum/einer Matrix-DM erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Wenn `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads ausgeführt wird, bindet dies stattdessen diesen aktuellen Thread.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Workspaces umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des bestehenden Threads aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Matrix-Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung weitergeleitet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread direkt.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Konfiguration von Thread-Bindings

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix-Thread-gebundene Spawn-Flags sind optional:

- Setzen Sie `threadBindings.spawnSubagentSessions: true`, um `/focus` auf oberster Ebene zu erlauben, neue Matrix-Threads zu erstellen und zu binden.
- Setzen Sie `threadBindings.spawnAcpSessions: true`, um `/acp spawn --thread auto|here` zu erlauben, ACP-Sitzungen an Matrix-Threads zu binden.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Bestätigungsreaktionen.

- Ausgehende Reaktions-Tooling wird durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion vom Bot-Konto.

Bestätigungsreaktionen verwenden die standardmäßige OpenClaw-Auflösungsreihenfolge:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Agent-Identity-Emoji-Fallback

Der Geltungsbereich von Bestätigungsreaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Der Modus für Reaktionsbenachrichtigungen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- Standard: `own`

Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie sich auf vom Bot verfasste Matrix-Nachrichten beziehen.
- `reactionNotifications: "off"` deaktiviert Reaktions-Systemereignisse.
- Das Entfernen von Reaktionen wird nicht in Systemereignisse umgewandelt, da Matrix diese als Redaktionen und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufs-Kontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Matrix-Raumverlauf gilt nur für Räume. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Matrix-Raumverlauf ist nur ausstehend: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle Auslöser-Nachricht ist nicht in `InboundHistory` enthalten; sie bleibt für diesen Turn im Haupttext der eingehenden Nachricht.
- Wiederholungen desselben Matrix-Ereignisses verwenden erneut den ursprünglichen Verlaufs-Snapshot, statt zu neueren Raumnachrichten weiterzudriften.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Roots und ausstehenden Verlauf.

- `contextVisibility: "all"` ist die Standardeinstellung. Ergänzender Kontext bleibt wie empfangen erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktive Raum-/Benutzer-Allowlist-Prüfung zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber trotzdem eine explizit zitierte Antwort.

Diese Einstellung betrifft die Sichtbarkeit ergänzenden Kontexts, nicht die Frage, ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Trigger-Autorisierung kommt weiterhin von den Einstellungen `groupPolicy`, `groups`, `groupAllowFrom` und der DM-Richtlinie.

## DM- und Raumrichtlinie

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Siehe [Groups](/de/channels/groups) für Verhalten von Erwähnungs-Gating und Allowlist.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiter Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und sendet nach einer kurzen Abkühlzeit möglicherweise erneut eine Erinnerungsantwort, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Direkte Raumreparatur

Wenn der Direktnachrichten-Zustand nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen haben, die auf alte Einzelräume statt auf die aktive DM zeigen. Prüfen Sie die aktuelle Zuordnung für einen Peer mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- greift andernfalls auf eine aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine funktionierende DM existiert

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die funktionierende DM aus und aktualisiert die Zuordnung, damit neue Matrix-Sendungen, Verifizierungshinweise und andere Direktnachrichtenabläufe wieder den richtigen Raum verwenden.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungs-Client für ein Matrix-Konto fungieren. Die nativen
DM-/Channel-Routing-Schalter liegen weiterhin unter der Exec-Genehmigungskonfiguration:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; greift auf `channels.matrix.dm.allowFrom` zurück)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Genehmigende Benutzer müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein genehmigender Benutzer aufgelöst werden kann. Exec-Genehmigungen verwenden zuerst `execApprovals.approvers` und können auf `channels.matrix.dm.allowFrom` zurückfallen. Plugin-Genehmigungen autorisieren über `channels.matrix.dm.allowFrom`. Setzen Sie `enabled: false`, um Matrix ausdrücklich als nativen Genehmigungs-Client zu deaktivieren. Genehmigungsanfragen fallen andernfalls auf andere konfigurierte Genehmigungsrouten oder die Fallback-Richtlinie für Genehmigungen zurück.

Matrix-Native-Routing unterstützt beide Genehmigungsarten:

- `channels.matrix.execApprovals.*` steuert den nativen DM-/Channel-Fanout-Modus für Matrix-Genehmigungsaufforderungen.
- Exec-Genehmigungen verwenden die Menge der Exec-Genehmigenden aus `execApprovals.approvers` oder `channels.matrix.dm.allowFrom`.
- Plugin-Genehmigungen verwenden die Matrix-DM-Allowlist aus `channels.matrix.dm.allowFrom`.
- Matrix-Reaktionskürzel und Nachrichtenaktualisierungen gelten sowohl für Exec- als auch für Plugin-Genehmigungen.

Zustellregeln:

- `target: "dm"` sendet Genehmigungsaufforderungen an DMs der genehmigenden Benutzer
- `target: "channel"` sendet die Aufforderung zurück in den ursprünglichen Matrix-Raum oder die ursprüngliche DM
- `target: "both"` sendet an DMs der genehmigenden Benutzer und in den ursprünglichen Matrix-Raum oder die ursprüngliche DM

Matrix-Genehmigungsaufforderungen initialisieren Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` = einmal erlauben
- `❌` = ablehnen
- `♾️` = immer erlauben, wenn diese Entscheidung durch die effektive Exec-Richtlinie zulässig ist

Genehmigende Benutzer können auf diese Nachricht reagieren oder die Fallback-Slash-Befehle verwenden: `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny`.

Nur aufgelöste genehmigende Benutzer können genehmigen oder ablehnen. Bei Exec-Genehmigungen enthält die Channel-Zustellung den Befehlstext, daher sollten Sie `channel` oder `both` nur in vertrauenswürdigen Räumen aktivieren.

Kontoabhängige Überschreibung:

- `channels.matrix.accounts.<account>.execApprovals`

Verwandte Dokumentation: [Exec approvals](/de/tools/exec-approvals)

## Slash-Befehle

Matrix-Slash-Befehle (zum Beispiel `/new`, `/reset`, `/model`) funktionieren direkt in DMs. In Räumen erkennt OpenClaw auch Slash-Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlsweg auslöst, ohne dass ein benutzerdefinierter Erwähnungs-Regex erforderlich ist. Dadurch bleibt der Bot auch bei raumtypischen Posts im Stil `@mention /command` reaktionsfähig, die Element und ähnliche Clients erzeugen, wenn ein Benutzer den Bot per Tab-Vervollständigung einfügt, bevor er den Befehl tippt.

Autorisierungsregeln gelten weiterhin: Absender von Befehlen müssen DM- oder Raum-Allowlist-/Eigentümerzurichtlinien genauso erfüllen wie bei normalen Nachrichten.

## Multi-Account

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Werte auf oberster Ebene unter `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
Sie können geerbte Raumeinträge mit `groups.<room>.account` auf ein Matrix-Konto beschränken.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf oberster Ebene unter `channels.matrix.*` konfiguriert ist.
Partielle gemeinsame Authentifizierungs-Standardwerte erzeugen für sich genommen kein separates implizites Standardkonto. OpenClaw erzeugt das Top-Level-Konto `default` nur dann, wenn dieses Standardkonto aktuelle Authentifizierung hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können dennoch über `homeserver` plus `userId` erkennbar bleiben, wenn zwischengespeicherte Anmeldedaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen benannten Kontoschlüssel zeigt, erhält die Reparatur/Einrichtungs-Promotion von Einzelkonto zu Multi-Account dieses Konto, statt einen neuen Eintrag `accounts.default` zu erstellen. Nur Matrix-Authentifizierungs-/Bootstrap-Schlüssel werden in dieses hochgestufte Konto verschoben; gemeinsame Zustellrichtlinien-Schlüssel bleiben auf oberster Ebene.
Setzen Sie `defaultAccount`, wenn OpenClaw ein bestimmtes benanntes Matrix-Konto für implizites Routing, Probing und CLI-Operationen bevorzugen soll.
Wenn mehrere Matrix-Konten konfiguriert sind und eine Konto-ID `default` ist, verwendet OpenClaw dieses Konto implizit, auch wenn `defaultAccount` nicht gesetzt ist.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie `defaultAccount` oder übergeben Sie `--account <id>` für CLI-Befehle, die auf impliziter Kontenauswahl beruhen.
Übergeben Sie `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn Sie diese implizite Auswahl für einen einzelnen Befehl überschreiben möchten.

Siehe [Configuration reference](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Multi-Account-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum Schutz vor SSRF, sofern Sie
dies nicht pro Konto ausdrücklich aktivieren.

Wenn Ihr Homeserver auf localhost, einer LAN-/Tailscale-IP oder einem internen Hostnamen läuft, aktivieren Sie
`network.dangerouslyAllowPrivateNetwork` für dieses Matrix-Konto:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI-Einrichtungsbeispiel:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Diese Aktivierung erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Verwenden Sie nach Möglichkeit `https://`.

## Matrix-Datenverkehr über einen Proxy leiten

Wenn Ihre Matrix-Bereitstellung einen expliziten ausgehenden HTTP(S)-Proxy benötigt, setzen Sie `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Benannte Konten können den Standardwert auf oberster Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung sowohl für den laufenden Matrix-Datenverkehr als auch für Konto-Status-Probes.

## Zielauflösung

Matrix akzeptiert überall dort, wo OpenClaw nach einem Raum- oder Benutzerziel fragt, diese Zielformen:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliase: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Matrix-Raum-IDs sind case-sensitive. Verwenden Sie beim Konfigurieren expliziter Zustellziele,
Cron-Jobs, Bindings oder Allowlists die exakte Groß-/Kleinschreibung der Raum-ID aus Matrix.
OpenClaw hält interne Sitzungsschlüssel für die Speicherung kanonisch, daher sind diese kleingeschriebenen
Schlüssel keine verlässliche Quelle für Matrix-Zustell-IDs.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzerabfragen durchsuchen das Matrix-Benutzerverzeichnis auf diesem Homeserver.
- Raumabfragen akzeptieren explizite Raum-IDs und Aliase direkt und greifen dann auf die Suche nach Namen beigetretener Räume für dieses Konto zurück.
- Die Namenssuche in beigetretenen Räumen erfolgt nach bestem Bemühen. Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er bei der Laufzeit-Auflösung der Allowlist ignoriert.

## Konfigurationsreferenz

- `enabled`: den Channel aktivieren oder deaktivieren.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Matrix-Konto erlauben, sich mit privaten/internen Homeservern zu verbinden. Aktivieren Sie dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Benannte Konten können den Standardwert auf oberster Ebene mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Access Token für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` bei env-/file-/exec-Providern unterstützt. Siehe [Secrets Management](/de/gateway/secrets).
- `password`: Passwort für passwortbasierte Anmeldung. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts für die Passwortanmeldung.
- `avatarUrl`: gespeicherte Selbst-Avatar-URL für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl von Ereignissen, die während der Startsynchronisierung abgerufen werden.
- `encryption`: E2EE aktivieren.
- `allowlistOnly`: wenn `true`, wird die Raumrichtlinie `open` auf `allowlist` hochgestuft und alle aktiven DM-Richtlinien außer `disabled` (einschließlich `pairing` und `open`) werden auf `allowlist` erzwungen. Hat keine Auswirkung auf `disabled`-Richtlinien.
- `allowBots`: Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten zulassen (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumverkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnistreffer werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `historyLimit`: maximale Anzahl von Raumnachrichten, die als Gruppenverlaufs-Kontext aufgenommen werden. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- `replyToMode`: `off`, `first`, `all` oder `batched`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `"partial"`, `"quiet"`, `true` oder `false`. `"partial"` und `true` aktivieren Vorschau-zuerst-Entwurfsaktualisierungen mit normalen Matrix-Textnachrichten. `"quiet"` verwendet nicht benachrichtigende Vorschauhinweise für selbstgehostete Push-Regel-Setups. `false` entspricht `"off"`.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistentenblöcke, während Entwurfs-Vorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: kanalbezogene Überschreibungen für threadgebundenes Sitzungsrouting und Lebenszyklus.
- `startupVerification`: Modus für automatische Selbstverifizierungsanfragen beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Abkühlzeit, bevor automatische Start-Verifizierungsanfragen erneut versucht werden.
- `textChunkLimit`: Chunk-Größe ausgehender Nachrichten in Zeichen (gilt, wenn `chunkMode` auf `length` gesetzt ist).
- `chunkMode`: `length` teilt Nachrichten nach Zeichenanzahl; `newline` teilt an Zeilengrenzen.
- `responsePrefix`: optionale Zeichenfolge, die allen ausgehenden Antworten für diesen Channel vorangestellt wird.
- `ackReaction`: optionale Überschreibung der Bestätigungsreaktion für diesen Channel/dieses Konto.
- `ackReactionScope`: optionale Überschreibung des Geltungsbereichs der Bestätigungsreaktion (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Größenlimit für Medien in MB für ausgehende Sendungen und eingehende Medienverarbeitung.
- `autoJoin`: Richtlinie für automatisches Beitreten bei Einladungen (`always`, `allowlist`, `off`). Standard: `off`. Gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliase, die zulässig sind, wenn `autoJoin` auf `allowlist` gesetzt ist. Alias-Einträge werden während der Einladungsverarbeitung in Raum-IDs aufgelöst; OpenClaw vertraut nicht auf den vom eingeladenen Raum behaupteten Alias-Zustand.
- `dm`: DM-Richtlinienblock (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: steuert den DM-Zugriff, nachdem OpenClaw dem Raum beigetreten ist und ihn als DM klassifiziert hat. Es ändert nicht, ob einer Einladung automatisch beigetreten wird.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Verkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnistreffer werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `dm.sessionScope`: `per-user` (Standard) oder `per-room`. Verwenden Sie `per-room`, wenn jeder Matrix-DM-Raum einen getrennten Kontext behalten soll, auch wenn es derselbe Peer ist.
- `dm.threadReplies`: nur für DMs geltende Überschreibung der Thread-Richtlinie (`off`, `inbound`, `always`). Sie überschreibt die Einstellung `threadReplies` auf oberster Ebene sowohl für die Platzierung von Antworten als auch für die Sitzungsisolierung in DMs.
- `execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die genehmigenden Benutzer bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte kontoabhängige Überschreibungen. Werte auf oberster Ebene unter `channels.matrix` dienen als Standardwerte für diese Einträge.
- `groups`: raumbezogene Richtlinienzuordnung. Bevorzugen Sie Raum-IDs oder Aliase; nicht aufgelöste Raumnamen werden zur Laufzeit ignoriert. Die Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID.
- `groups.<room>.account`: beschränkt einen geerbten Raumeintrag in Multi-Account-Setups auf ein bestimmtes Matrix-Konto.
- `groups.<room>.allowBots`: raumbezogene Überschreibung für Absender aus konfigurierten Bots (`true` oder `"mentions"`).
- `groups.<room>.users`: absenderbezogene Allowlist pro Raum.
- `groups.<room>.tools`: raumbezogene Überschreibungen für Tool-Zulassen/-Verweigern.
- `groups.<room>.autoReply`: raumbezogene Überschreibung für Erwähnungs-Gating. `true` deaktiviert Erwähnungsanforderungen für diesen Raum; `false` erzwingt sie wieder.
- `groups.<room>.skills`: optionaler Skill-Filter auf Raumebene.
- `groups.<room>.systemPrompt`: optionales System-Prompt-Snippet auf Raumebene.
- `rooms`: Legacy-Alias für `groups`.
- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung

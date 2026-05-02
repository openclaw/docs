---
read_when:
    - Matrix in OpenClaw einrichten
    - Konfiguration von Matrix-E2EE und Verifizierung
summary: Matrix-Supportstatus, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-05-02T06:26:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78461a7cc60172fead3b1b0be02fe37b43fab2c5cada3a536e0bbee2e3e2cd8e
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein gebündeltes Kanal-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Aktuelle paketierte OpenClaw-Releases liefern das Matrix-Plugin direkt mit. Sie müssen nichts installieren; die Konfiguration von `channels.matrix.*` (siehe [Einrichtung](#setup)) aktiviert es.

Für ältere Builds oder benutzerdefinierte Installationen, die Matrix ausschließen, installieren Sie ein aktuelles npm-Paket, sobald eines veröffentlicht ist:

```bash
openclaw plugins install @openclaw/matrix
```

Wenn npm meldet, dass das OpenClaw-eigene Paket veraltet ist, verwenden Sie einen aktuellen paketierten OpenClaw-Build oder einen lokalen Checkout, bis ein neueres npm-Paket veröffentlicht ist.

Aus einem lokalen Checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registriert und aktiviert das Plugin, sodass kein separater Schritt `openclaw plugins enable matrix` erforderlich ist. Das Plugin tut weiterhin nichts, bis Sie den untenstehenden Kanal konfigurieren. Allgemeines Verhalten von Plugins und Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Einrichtung

1. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
2. Konfigurieren Sie `channels.matrix` entweder mit `homeserver` + `accessToken` oder mit `homeserver` + `userId` + `password`.
3. Starten Sie den Gateway neu.
4. Starten Sie einen DM mit dem Bot oder laden Sie ihn in einen Raum ein (siehe [automatisches Beitreten](#auto-join) — neue Einladungen landen nur, wenn `autoJoin` sie erlaubt).

### Interaktive Einrichtung

```bash
openclaw channels add
openclaw configure --section channels
```

Der Assistent fragt nach: Homeserver-URL, Authentifizierungsmethode (Access Token oder Passwort), Benutzer-ID (nur Passwortauthentifizierung), optionalem Gerätenamen, ob E2EE aktiviert werden soll und ob Raumzugriff und automatisches Beitreten konfiguriert werden sollen.

Wenn passende `MATRIX_*`-Umgebungsvariablen bereits existieren und für das ausgewählte Konto keine gespeicherte Authentifizierung vorhanden ist, bietet der Assistent eine Umgebungsvariablen-Abkürzung an. Um Raumnamen vor dem Speichern einer Allowlist aufzulösen, führen Sie `openclaw channels resolve --channel matrix "Project Room"` aus. Wenn E2EE aktiviert ist, schreibt der Assistent die Konfiguration und führt denselben Bootstrap aus wie [`openclaw matrix encryption setup`](#encryption-and-verification).

### Minimale Konfiguration

Token-basiert:

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

Passwortbasiert (das Token wird nach der ersten Anmeldung zwischengespeichert):

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

### Automatisches Beitreten

`channels.matrix.autoJoin` ist standardmäßig `off`. Mit der Standardeinstellung erscheint der Bot nicht in neuen Räumen oder DMs aus neuen Einladungen, bis Sie manuell beitreten.

OpenClaw kann zum Zeitpunkt der Einladung nicht erkennen, ob ein eingeladener Raum ein DM oder eine Gruppe ist. Daher durchlaufen alle Einladungen — einschließlich DM-artiger Einladungen — zuerst `autoJoin`. `dm.policy` greift erst später, nachdem der Bot beigetreten ist und der Raum klassifiziert wurde.

<Warning>
Setzen Sie `autoJoin: "allowlist"` plus `autoJoinAllowlist`, um einzuschränken, welche Einladungen der Bot akzeptiert, oder `autoJoin: "always"`, um jede Einladung zu akzeptieren.

`autoJoinAllowlist` akzeptiert nur stabile Ziele: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt; Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den vom eingeladenen Raum beanspruchten Zustand.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Um jede Einladung zu akzeptieren, verwenden Sie `autoJoin: "always"`.

### Allowlist-Zielformate

DM- und Raum-Allowlists werden am besten mit stabilen IDs befüllt:

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden nur aufgelöst, wenn das Homeserver-Verzeichnis genau einen Treffer zurückgibt.
- Räume (`groups`, `autoJoinAllowlist`): Verwenden Sie `!room:server` oder `#alias:server`. Namen werden bestmöglich gegen beigetretene Räume aufgelöst; nicht aufgelöste Einträge werden zur Laufzeit ignoriert.

### Normalisierung der Konto-ID

Der Assistent wandelt einen freundlichen Namen in eine normalisierte Konto-ID um. Beispielsweise wird aus `Ops Bot` `ops-bot`. Satzzeichen werden in bereichsspezifischen Umgebungsvariablennamen escaped, damit zwei Konten nicht kollidieren können: `-` → `_X2D_`, daher wird `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet.

### Zwischengespeicherte Anmeldedaten

Matrix speichert zwischengespeicherte Anmeldedaten unter `~/.openclaw/credentials/matrix/`:

- Standardkonto: `credentials.json`
- benannte Konten: `credentials-<account>.json`

Wenn dort zwischengespeicherte Anmeldedaten existieren, behandelt OpenClaw Matrix als konfiguriert, auch wenn das Access Token nicht in der Konfigurationsdatei steht — das gilt für die Einrichtung, `openclaw doctor` und Kanalstatus-Prüfungen.

### Umgebungsvariablen

Werden verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; benannte Konten verwenden die vor dem Suffix eingefügte Konto-ID.

| Standardkonto         | Benanntes Konto (`<ID>` ist die normalisierte Konto-ID) |
| --------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                              |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                   |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                  |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                 |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                               |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                              |

Für das Konto `ops` werden daraus `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` und so weiter. Die Umgebungsvariablen für den Wiederherstellungsschlüssel werden von CLI-Flows mit Wiederherstellungsunterstützung (`verify backup restore`, `verify device`, `verify bootstrap`) gelesen, wenn Sie den Schlüssel per `--recovery-key-stdin` einspeisen.

`MATRIX_HOMESERVER` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Konfigurationsbeispiel

Eine praktische Basis mit DM-Pairing, Raum-Allowlist und E2EE:

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
        "!roomid:example.org": { requireMention: true },
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

## Streaming-Vorschauen

Matrix-Antwort-Streaming ist optional. `streaming` steuert, wie OpenClaw die laufende Assistentenantwort ausliefert; `blockStreaming` steuert, ob jeder abgeschlossene Block als eigene Matrix-Nachricht erhalten bleibt.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Um Live-Antwortvorschauen beizubehalten, aber zwischenzeitliche Tool-/Fortschrittszeilen auszublenden, verwenden Sie die Objektform:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | Verhalten                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (Standard) | Auf die vollständige Antwort warten und einmal senden. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                    |
| `"partial"`       | Eine normale Textnachricht wird direkt bearbeitet, während das Modell den aktuellen Block schreibt. Standard-Matrix-Clients benachrichtigen möglicherweise bei der ersten Vorschau, nicht bei der finalen Bearbeitung. |
| `"quiet"`         | Wie `"partial"`, aber die Nachricht ist ein nicht benachrichtigender Hinweis. Empfänger erhalten erst eine Benachrichtigung, wenn eine benutzerspezifische Push-Regel auf die finalisierte Bearbeitung passt (siehe unten). |

`blockStreaming` ist unabhängig von `streaming`:

| `streaming`             | `blockStreaming: true`                                               | `blockStreaming: false` (Standard)                 |
| ----------------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block, abgeschlossene Blöcke bleiben als Nachrichten erhalten | Live-Entwurf für den aktuellen Block, direkt finalisiert |
| `"off"`                 | Eine benachrichtigende Matrix-Nachricht pro abgeschlossenem Block     | Eine benachrichtigende Matrix-Nachricht für die vollständige Antwort |

Hinweise:

- Wenn eine Vorschau das Matrix-Größenlimit pro Event überschreitet, stoppt OpenClaw das Vorschau-Streaming und fällt auf reine finale Auslieferung zurück.
- Medienantworten senden Anhänge immer normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie, bevor die finale Medienantwort gesendet wird.
- Vorschauaktualisierungen für Tool-Fortschritt sind standardmäßig aktiviert, wenn Matrix-Vorschau-Streaming aktiv ist. Setzen Sie `streaming.preview.toolProgress: false`, um Vorschau-Bearbeitungen für Antworttext beizubehalten, Tool-Fortschritt aber auf dem normalen Auslieferungspfad zu lassen.
- Vorschau-Bearbeitungen kosten zusätzliche Matrix-API-Aufrufe. Belassen Sie `streaming: "off"`, wenn Sie das konservativste Ratenlimit-Profil wünschen.

## Approval-Metadaten

Native Matrix-Approval-Prompts sind normale `m.room.message`-Events mit OpenClaw-spezifischem benutzerdefiniertem Event-Inhalt unter `com.openclaw.approval`. Matrix erlaubt benutzerdefinierte Event-Inhaltsschlüssel, sodass Standardclients weiterhin den Textkörper darstellen, während OpenClaw-fähige Clients die strukturierte Approval-ID, Art, Status, verfügbaren Entscheidungen sowie Exec-/Plugin-Details lesen können.

Wenn ein Approval-Prompt zu lang für ein Matrix-Event ist, teilt OpenClaw den sichtbaren Text in Chunks auf und hängt `com.openclaw.approval` nur an den ersten Chunk an. Reaktionen für Zulassen-/Ablehnen-Entscheidungen sind an dieses erste Event gebunden, sodass lange Prompts dasselbe Approval-Ziel behalten wie Prompts mit einem einzelnen Event.

### Selbst gehostete Push-Regeln für stille finalisierte Vorschauen

`streaming: "quiet"` benachrichtigt Empfänger erst, wenn ein Block oder Turn finalisiert ist — eine benutzerspezifische Push-Regel muss auf den finalisierten Vorschau-Marker passen. Das vollständige Rezept (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver) finden Sie unter [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie Inter-Agent-Matrix-Verkehr ausdrücklich wünschen:

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
- `allowBots: "mentions"` akzeptiert diese Nachrichten nur, wenn sie diesen Bot in Räumen sichtbar erwähnen. DMs sind weiterhin erlaubt.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwort-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „bot-authored“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE) Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin das einfache `thumbnail_url`. Es ist keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Zustand automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnose), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Setups mit mehreren Konten). Die Ausgabe ist standardmäßig knapp, mit stiller interner SDK-Protokollierung. Die Beispiele unten zeigen die kanonische Form; fügen Sie die Flags nach Bedarf hinzu.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
```

Initialisiert Secret Storage und Cross-Signing, erstellt bei Bedarf ein Raumschlüssel-Backup und gibt anschließend Status und nächste Schritte aus. Nützliche Flags:

- `--recovery-key <key>` wendet vor der Initialisierung einen Wiederherstellungsschlüssel an (bevorzugen Sie die unten dokumentierte stdin-Form)
- `--force-reset-cross-signing` verwirft die aktuelle Cross-Signing-Identität und erstellt eine neue (nur bewusst verwenden)

Aktivieren Sie E2EE für ein neues Konto bei der Erstellung:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` ist ein Alias für `--enable-e2ee`.

Entsprechende manuelle Konfiguration:

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

### Status- und Vertrauenssignale

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` meldet drei unabhängige Vertrauenssignale (`--verbose` zeigt alle an):

- `Locally trusted`: nur von diesem Client vertraut
- `Cross-signing verified`: Das SDK meldet Verifizierung über Cross-Signing
- `Signed by owner`: mit Ihrem eigenen Self-Signing-Schlüssel signiert (nur Diagnose)

`Verified by owner` wird nur dann zu `yes`, wenn `Cross-signing verified` `yes` ist. Lokales Vertrauen oder eine Owner-Signatur allein reicht nicht aus.

`--allow-degraded-local-state` gibt Best-Effort-Diagnosen zurück, ohne zuerst das Matrix-Konto vorzubereiten; nützlich für Offline- oder teilweise konfigurierte Prüfungen.

### Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren

Der Wiederherstellungsschlüssel ist sensibel — leiten Sie ihn über stdin weiter, statt ihn in der Befehlszeile zu übergeben. Setzen Sie `MATRIX_RECOVERY_KEY` (oder `MATRIX_<ID>_RECOVERY_KEY` für ein benanntes Konto):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für Secret Storage oder Gerätevertrauen akzeptiert.
- `Backup usable`: Das Raumschlüssel-Backup kann mit dem vertrauenswürdigen Wiederherstellungsmaterial geladen werden.
- `Device verified by owner`: Dieses Gerät verfügt über vollständiges Matrix-Cross-Signing-Identitätsvertrauen.

Er beendet sich mit einem Nicht-Null-Code, wenn das vollständige Identitätsvertrauen unvollständig ist, selbst wenn der Wiederherstellungsschlüssel Backup-Material entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung von einem anderen Matrix-Client ab:

```bash
openclaw matrix verify self
```

`verify self` wartet auf `Cross-signing verified: yes`, bevor es erfolgreich beendet wird. Verwenden Sie `--timeout-ms <ms>`, um die Wartezeit anzupassen.

Die Literal-Schlüssel-Form `openclaw matrix verify device "<recovery-key>"` wird ebenfalls akzeptiert, aber der Schlüssel landet in Ihrer Shell-History.

### Cross-Signing initialisieren oder reparieren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Konten. Der Reihe nach:

- initialisiert er Secret Storage und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel wieder
- initialisiert er Cross-Signing und lädt fehlende öffentliche Schlüssel hoch
- markiert und Cross-signiert er das aktuelle Gerät
- erstellt er ein serverseitiges Raumschlüssel-Backup, falls noch keines vorhanden ist

Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln erfordert, versucht OpenClaw zuerst ohne Authentifizierung, dann `m.login.dummy` und anschließend `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (kombinieren mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) oder `--recovery-key <key>`
- `--force-reset-cross-signing`, um die aktuelle Cross-Signing-Identität zu verwerfen (nur bewusst verwenden)

### Raumschlüssel-Backup

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt, ob ein serverseitiges Backup existiert und ob dieses Gerät es entschlüsseln kann. `backup restore` importiert gesicherte Raumschlüssel in den lokalen Crypto Store; wenn der Wiederherstellungsschlüssel bereits auf dem Datenträger vorhanden ist, können Sie `--recovery-key-stdin` weglassen.

Um ein beschädigtes Backup durch eine frische Baseline zu ersetzen (akzeptiert den Verlust nicht wiederherstellbarer alter Historie; kann auch Secret Storage neu erstellen, wenn das aktuelle Backup-Secret nicht ladbar ist):

```bash
openclaw matrix verify backup reset --yes
```

Fügen Sie `--rotate-recovery-key` nur hinzu, wenn Sie bewusst möchten, dass der vorherige Wiederherstellungsschlüssel die frische Backup-Baseline nicht mehr entsperrt.

### Verifizierungen auflisten, anfordern und beantworten

```bash
openclaw matrix verify list
```

Listet ausstehende Verifizierungsanfragen für das ausgewählte Konto auf.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Sendet eine Verifizierungsanfrage von diesem OpenClaw-Konto. `--own-user` fordert Selbstverifizierung an (Sie akzeptieren die Aufforderung in einem anderen Matrix-Client desselben Benutzers); `--user-id`/`--device-id`/`--room-id` richten sich an eine andere Person. `--own-user` kann nicht mit den anderen Ziel-Flags kombiniert werden.

Für die tiefergehende Behandlung des Lebenszyklus — typischerweise beim Begleiten eingehender Anfragen von einem anderen Client — wirken diese Befehle auf eine bestimmte Anfrage `<id>` (ausgegeben von `verify list` und `verify request`):

| Befehl                                    | Zweck                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Eine eingehende Anfrage akzeptieren                                           |
| `openclaw matrix verify start <id>`        | Den SAS-Ablauf starten                                                  |
| `openclaw matrix verify sas <id>`          | Die SAS-Emoji oder Dezimalzahlen ausgeben                                     |
| `openclaw matrix verify confirm-sas <id>`  | Bestätigen, dass SAS mit der Anzeige des anderen Clients übereinstimmt            |
| `openclaw matrix verify mismatch-sas <id>` | SAS ablehnen, wenn Emoji oder Dezimalzahlen nicht übereinstimmen              |
| `openclaw matrix verify cancel <id>`       | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als DM-Follow-up-Hinweise, wenn die Verifizierung an einen bestimmten Direct-Message-Raum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Wenn Sie mehrere benannte Konten haben und `channels.matrix.defaultAccount` nicht gesetzt haben, raten sie nicht und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Mit `encryption: true` ist `startupVerification` standardmäßig `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abklingzeit an (standardmäßig 24 Stunden). Passen Sie dies mit `startupVerificationCooldownHours` an oder deaktivieren Sie es mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt, der den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Zustand beschädigt ist, versucht OpenClaw eine geschützte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA erfordert, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Owner signierte Geräte bleiben erhalten.

    Siehe [Matrix-Migration](/de/channels/matrix-migration) für den vollständigen Upgrade-Ablauf.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix veröffentlicht Verifizierungs-Lebenszyklushinweise im strikten DM-Verifizierungsraum als `m.notice`-Nachrichten: Anfrage, bereit (mit Anleitung „Per Emoji verifizieren“), Start/Abschluss sowie SAS-Details (Emoji/Dezimal), wenn verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Bei der Selbstverifizierung startet OpenClaw den SAS-Ablauf automatisch und bestätigt seine eigene Seite, sobald Emoji-Verifizierung verfügbar ist — Sie müssen weiterhin in Ihrem Matrix-Client vergleichen und „They match“ bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Wenn `verify status` meldet, dass das aktuelle Gerät auf dem Homeserver nicht mehr gelistet ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für Passwortanmeldung:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Für Token-Authentifizierung erstellen Sie in Ihrem Matrix-Client oder in der Admin-UI ein frisches Zugriffstoken und aktualisieren dann OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Ersetzen Sie `assistant` durch die Konto-ID aus dem fehlgeschlagenen Befehl oder lassen Sie `--account` für das Standardkonto weg.

  </Accordion>

  <Accordion title="Device hygiene">
    Alte von OpenClaw verwaltete Geräte können sich ansammeln. Auflisten und bereinigen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix-E2EE verwendet den offiziellen Rust-Crypto-Pfad des `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Der Crypto-Zustand wird in `crypto-idb-snapshot.json` persistiert (restriktive Dateiberechtigungen).

    Verschlüsselter Laufzeitzustand liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Sync Store, Crypto Store, Wiederherstellungsschlüssel, IDB-Snapshot, Thread-Bindings und den Zustand der Startverifizierung. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw das beste vorhandene Root wieder, sodass vorheriger Zustand sichtbar bleibt.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Sie können beide Optionen in einem Aufruf übergeben. Matrix akzeptiert `mxc://`-Avatar-URLs direkt; wenn Sie `http://` oder `https://` übergeben, lädt OpenClaw die Datei zuerst hoch und speichert die aufgelöste `mxc://`-URL in `channels.matrix.avatarUrl` (oder in der kontospezifischen Überschreibung).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sendungen über das Message-Tool. Zwei unabhängige Schalter steuern das Verhalten:

### Sitzungsrouting (`sessionScope`)

`dm.sessionScope` entscheidet, wie Matrix-DM-Räume OpenClaw-Sitzungen zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Gegenüber teilen sich eine Sitzung.
- `"per-room"`: Jeder Matrix-DM-Raum erhält seinen eigenen Sitzungsschlüssel, auch wenn das Gegenüber dasselbe ist.

Explizite Conversation-Bindings haben immer Vorrang vor `sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung behalten.

### Antwort-Threading (`threadReplies`)

`threadReplies` entscheidet, wo der Bot seine Antwort veröffentlicht:

- `"off"`: Antworten sind Top-Level. Eingehende Thread-Nachrichten bleiben in der übergeordneten Sitzung.
- `"inbound"`: Antwort innerhalb eines Threads nur dann, wenn die eingehende Nachricht bereits in diesem Thread war.
- `"always"`: Antwort innerhalb eines Threads, der an der auslösenden Nachricht verwurzelt ist; diese Unterhaltung wird ab dem ersten Auslöser über eine passende thread-spezifische Sitzung geroutet.

`dm.threadReplies` überschreibt dies nur für DMs — zum Beispiel, um Raum-Threads isoliert zu halten, während DMs flach bleiben.

### Thread-Vererbung und Slash-Befehle

- Eingehende Nachrichten in Threads enthalten die Thread-Stammnachricht als zusätzlichen Agentenkontext.
- Über das Message-Tool gesendete Nachrichten übernehmen automatisch den aktuellen Matrix-Thread, wenn sie auf denselben Raum (oder dasselbe DM-Benutzerziel) abzielen, sofern keine explizite `threadId` angegeben wird.
- Die Wiederverwendung von DM-Benutzerzielen greift nur, wenn die Metadaten der aktuellen Sitzung denselben DM-Partner auf demselben Matrix-Konto belegen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und thread-gebundenes `/acp spawn` funktionieren alle in Matrix-Räumen und DMs.
- `/focus` auf oberster Ebene erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSessions` aktiviert ist.
- Das Ausführen von `/focus` oder `/acp spawn --thread here` innerhalb eines vorhandenen Matrix-Threads bindet diesen Thread an Ort und Stelle.

Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben geteilten Sitzung kollidiert, sendet es einmalig ein `m.notice` in diesen Raum, das auf den Ausweg über `/focus` hinweist und eine Änderung von `dm.sessionScope` vorschlägt. Der Hinweis erscheint nur, wenn Thread-Bindungen aktiviert sind.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und vorhandene Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des vorhandenen Threads aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung weitergeleitet.
- Innerhalb eines vorhandenen Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnSessions` steuert `/acp spawn --thread auto|here`, wobei OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Konfiguration für Thread-Bindungen

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem Überschreibungen pro Kanal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-Thread-gebundene Sitzungserzeugungen sind standardmäßig aktiviert:

- Setzen Sie `threadBindings.spawnSessions: false`, um zu verhindern, dass `/focus` auf oberster Ebene und `/acp spawn --thread auto|here` Matrix-Threads erstellen oder binden.
- Setzen Sie `threadBindings.defaultSpawnContext: "isolated"`, wenn native Subagent-Thread-Erzeugungen das übergeordnete Transkript nicht forken sollen.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, eingehende Reaktionsbenachrichtigungen und Bestätigungsreaktionen.

Werkzeuge für ausgehende Reaktionen werden durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bots.

**Auflösungsreihenfolge** (der erste definierte Wert gewinnt):

| Einstellung             | Reihenfolge                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `ackReaction`           | pro Konto → Kanal → `messages.ackReaction` → Fallback auf Emoji der Agentenidentität |
| `ackReactionScope`      | pro Konto → Kanal → `messages.ackReactionScope` → Standard `"group-mentions"`     |
| `reactionNotifications` | pro Konto → Kanal → Standard `"own"`                                              |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf von Bots verfasste Matrix-Nachrichten zielen; `"off"` deaktiviert Reaktions-Systemereignisse. Das Entfernen von Reaktionen wird nicht zu Systemereignissen synthetisiert, weil Matrix diese als Redaktionen darstellt, nicht als eigenständige Entfernen-Ereignisse für `m.reaction`.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` enthalten sind, wenn eine Matrix-Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Der Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Matrix-Raumverlauf ist nur ausstehend: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle Auslösenachricht ist nicht in `InboundHistory` enthalten; sie bleibt für diesen Durchlauf im Haupteingangstext.
- Wiederholungen desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufssnapshot erneut, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Stämme und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext bleibt so erhalten, wie er empfangen wurde.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen erlaubt sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber weiterhin eine explizit zitierte Antwort.

Diese Einstellung beeinflusst die Sichtbarkeit von ergänzendem Kontext, nicht ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Auslöseautorisierung kommt weiterhin von `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Um DMs vollständig stummzuschalten und Räume weiter funktionieren zu lassen, setzen Sie `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Siehe [Gruppen](/de/channels/groups) für Erwähnungs-Gating und Allowlist-Verhalten.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und kann nach einer kurzen Abklingzeit eine Erinnerung senden, statt einen neuen Code auszustellen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Direktnachrichtenstatus nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Einzelräume statt auf die aktive DM verweisen. Prüfen Sie die aktuelle Zuordnung für einen Partner:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide Befehle akzeptieren `--account <id>` für Multi-Konto-Setups. Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt auf jede aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen frischen direkten Raum und schreibt `m.direct` neu, wenn keine intakte DM existiert

Er löscht alte Räume nicht automatisch. Er wählt die intakte DM aus und aktualisiert die Zuordnung, sodass zukünftige Matrix-Sendungen, Verifizierungshinweise und andere Direktnachrichtenabläufe auf den richtigen Raum zielen.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungsclient dienen. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder `channels.matrix.accounts.<account>.execApprovals` für eine Überschreibung pro Konto):

- `enabled`: Genehmigungen über Matrix-native Eingabeaufforderungen zustellen. Wenn nicht gesetzt oder `"auto"`, aktiviert sich Matrix automatisch, sobald mindestens ein Genehmiger aufgelöst werden kann. Setzen Sie `false`, um dies explizit zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Exec-Anfragen genehmigen dürfen. Optional — fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: wohin Eingabeaufforderungen gesendet werden. `"dm"` (Standard) sendet an Genehmiger-DMs; `"channel"` sendet an den ursprünglichen Matrix-Raum oder die ursprüngliche DM; `"both"` sendet an beide.
- `agentFilter` / `sessionFilter`: optionale Allowlists dafür, welche Agenten/Sitzungen eine Matrix-Zustellung auslösen.

Die Autorisierung unterscheidet sich leicht zwischen Genehmigungsarten:

- **Exec-Genehmigungen** verwenden `execApprovals.approvers` und fallen auf `dm.allowFrom` zurück.
- **Plugin-Genehmigungen** autorisieren ausschließlich über `dm.allowFrom`.

Beide Arten teilen sich Matrix-Reaktionskurzbefehle und Nachrichtenaktualisierungen. Genehmiger sehen Reaktionskurzbefehle auf der primären Genehmigungsnachricht:

- `✅` einmal erlauben
- `❌` ablehnen
- `♾️` immer erlauben (wenn die effektive Exec-Richtlinie dies zulässt)

Fallback-Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste Genehmiger können genehmigen oder ablehnen. Die Kanalzustellung für Exec-Genehmigungen enthält den Befehlstext — aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandt: [Exec-Genehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in DMs. In Räumen erkennt OpenClaw außerdem Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad ohne benutzerdefinierten Erwähnungs-Regex auslöst. Dadurch bleibt der Bot für raumtypische `@mention /command`-Beiträge reaktionsfähig, die Element und ähnliche Clients erzeugen, wenn ein Benutzer den Bot per Tab vervollständigt, bevor er den Befehl eingibt.

Autorisierungsregeln gelten weiterhin: Befehlssender müssen dieselben DM- oder Raum-Allowlist-/Eigentümer-Richtlinien erfüllen wie normale Nachrichten.

## Multi-Konto

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

**Vererbung:**

- Werte auf oberster Ebene von `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
- Beschränken Sie einen geerbten Raumeintrag mit `groups.<room>.account` auf ein bestimmtes Konto. Einträge ohne `account` werden kontoübergreifend geteilt; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf oberster Ebene konfiguriert ist.

**Auswahl des Standardkontos:**

- Setzen Sie `defaultAccount`, um das benannte Konto auszuwählen, das implizites Routing, Probing und CLI-Befehle bevorzugen.
- Wenn Sie mehrere Konten haben und eines wörtlich `default` heißt, verwendet OpenClaw es implizit, auch wenn `defaultAccount` nicht gesetzt ist.
- Wenn Sie mehrere benannte Konten haben und kein Standard ausgewählt ist, weigern sich CLI-Befehle zu raten — setzen Sie `defaultAccount` oder übergeben Sie `--account <id>`.
- Der Block `channels.matrix.*` auf oberster Ebene wird nur dann als implizites Konto `default` behandelt, wenn seine Authentifizierung vollständig ist (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben über `homeserver` + `userId` auffindbar, sobald zwischengespeicherte Anmeldedaten die Authentifizierung abdecken.

**Hochstufung:**

- Wenn OpenClaw eine Einzelkonto-Konfiguration während einer Reparatur oder Einrichtung auf Multi-Konto hochstuft, behält es das vorhandene benannte Konto bei, sofern eines existiert oder `defaultAccount` bereits auf eines verweist. Nur Matrix-Auth-/Bootstrap-Schlüssel werden in das hochgestufte Konto verschoben; geteilte Schlüssel für Zustellrichtlinien bleiben auf oberster Ebene.

Siehe [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Multi-Konto-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum SSRF-Schutz, sofern Sie sich nicht
explizit pro Konto dafür entscheiden.

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

Diese Opt-in-Einstellung erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie
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

Benannte Konten können die Standardvorgabe auf oberster Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Datenverkehr zur Laufzeit und Kontostatusprüfungen.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Matrix-Raum-IDs unterscheiden Groß- und Kleinschreibung. Verwenden Sie die exakte Schreibweise der Raum-ID aus Matrix,
wenn Sie explizite Zustellziele, Cron-Jobs, Bindings oder Allowlists konfigurieren.
OpenClaw hält interne Sitzungsschlüssel für die Speicherung kanonisch, daher sind diese kleingeschriebenen
Schlüssel keine zuverlässige Quelle für Matrix-Zustell-IDs.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt und greifen dann auf die Suche in Namen beigetretener Räume für dieses Konto zurück.
- Die Suche nach Namen beigetretener Räume erfolgt nach bestem Aufwand. Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er von der Laufzeitauflösung der Allowlist ignoriert.

## Konfigurationsreferenz

Allowlist-artige Felder (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs (am sichersten). Exakte Verzeichnistreffer werden beim Start und immer dann aufgelöst, wenn sich die Allowlist ändert, während der Monitor läuft; Einträge, die nicht aufgelöst werden können, werden zur Laufzeit ignoriert. Raum-Allowlists bevorzugen aus demselben Grund Raum-IDs oder Aliasse.

### Konto und Verbindung

- `enabled`: Kanal aktivieren oder deaktivieren.
- `name`: optionales Anzeigelabel für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: benannte kontospezifische Überschreibungen. Werte auf oberster Ebene in `channels.matrix` werden als Standardwerte geerbt.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Konto erlauben, eine Verbindung zu `localhost`, LAN-/Tailscale-IPs oder internen Hostnamen herzustellen.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Kontospezifische Überschreibung unterstützt.
- `userId`: vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartext- und SecretRef-Werte werden über env/file/exec-Provider hinweg unterstützt ([Secrets-Verwaltung](/de/gateway/secrets)).
- `password`: Passwort für passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Geräteanzeigename, der bei der Passwortanmeldung verwendet wird.
- `avatarUrl`: gespeicherte eigene Avatar-URL für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl von Events, die während der Start-Synchronisierung abgerufen werden.

### Verschlüsselung

- `encryption`: E2EE aktivieren. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard, wenn E2EE aktiviert ist) oder `"off"`. Fordert beim Start automatisch eine Selbstverifizierung an, wenn dieses Gerät nicht verifiziert ist.
- `startupVerificationCooldownHours`: Abklingzeit vor der nächsten automatischen Startanforderung. Standard: `24`.

### Zugriff und Richtlinie

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumdatenverkehr.
- `dm.enabled`: wenn `false`, alle DMs ignorieren. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Wird angewendet, nachdem der Bot dem Raum beigetreten ist und ihn als DM klassifiziert hat; beeinflusst die Behandlung von Einladungen nicht.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Datenverkehr.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: reine DM-Überschreibung für Antwort-Threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: Nachrichten von anderen konfigurierten Matrix-Bot-Konten akzeptieren (`true` oder `"mentions"`).
- `allowlistOnly`: wenn `true`, erzwingt alle aktiven DM-Richtlinien (außer `"disabled"`) und `"open"`-Gruppenrichtlinien auf `"allowlist"`. Ändert `"disabled"`-Richtlinien nicht.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` `"allowlist"` ist. Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den vom eingeladenen Raum beanspruchten Zustand.
- `contextVisibility`: ergänzende Kontextsichtbarkeit (`"all"` Standard, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"`, `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` oder `"always"`.
- `threadBindings`: kanalspezifische Überschreibungen für sitzungsgebundenes Routing und Lebenszyklus nach Thread.
- `streaming`: `"off"` (Standard), `"partial"`, `"quiet"` oder Objektform `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wenn `true`, werden abgeschlossene Assistentenblöcke als separate Fortschrittsnachrichten beibehalten.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: ausgehende Chunk-Größe in Zeichen, wenn `chunkMode: "length"`. Standard: `4000`.
- `chunkMode`: `"length"` (Standard, teilt nach Zeichenzahl) oder `"newline"` (teilt an Zeilengrenzen).
- `historyLimit`: Anzahl der letzten Raumnachrichten, die als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standard `0` (deaktiviert).
- `mediaMaxMb`: Größenobergrenze für Medien in MB für ausgehendes Senden und eingehende Verarbeitung.

### Reaktionseinstellungen

- `ackReaction`: Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: Bereichsüberschreibung (`"group-mentions"` Standard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (`"own"` Standard, `"off"`).

### Tooling und raumspezifische Überschreibungen

- `actions`: aktionsspezifische Tool-Freigabe (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: raumspezifische Richtlinienzuordnung. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein Legacy-Alias.)
  - `groups.<room>.account`: einen geerbten Raumeintrag auf ein bestimmtes Konto beschränken.
  - `groups.<room>.allowBots`: raumspezifische Überschreibung der Einstellung auf Kanalebene (`true` oder `"mentions"`).
  - `groups.<room>.users`: raumspezifische Sender-Allowlist.
  - `groups.<room>.tools`: raumspezifische Tool-Zulassen-/Verweigern-Überschreibungen.
  - `groups.<room>.autoReply`: raumspezifische Überschreibung der Mention-Freigabe. `true` deaktiviert Mention-Anforderungen für diesen Raum; `false` erzwingt sie wieder.
  - `groups.<room>.skills`: raumspezifischer Skill-Filter.
  - `groups.<room>.systemPrompt`: raumspezifischer System-Prompt-Ausschnitt.

### Einstellungen für Exec-Freigaben

- `execApprovals.enabled`: Exec-Freigaben über Matrix-native Prompts zustellen.
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die freigeben dürfen. Fällt auf `dm.allowFrom` zurück.
- `execApprovals.target`: `"dm"` (Standard), `"channel"` oder `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionale Agent-/Sitzungs-Allowlists für die Zustellung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchatverhalten und Mention-Freigabe
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung

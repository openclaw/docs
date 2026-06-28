---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Matrix-Supportstatus, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-06-28T20:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein herunterladbares Kanal-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Installation

Installieren Sie Matrix aus ClawHub, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/matrix
```

Einfache Plugin-Spezifikationen versuchen zuerst ClawHub und danach npm als Fallback. Um die Registry-Quelle zu erzwingen, verwenden Sie `openclaw plugins install clawhub:@openclaw/matrix` oder `openclaw plugins install npm:@openclaw/matrix`.

Aus einem lokalen Checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registriert und aktiviert das Plugin, daher ist kein separater Schritt `openclaw plugins enable matrix` erforderlich. Das Plugin tut dennoch nichts, bis Sie den Kanal unten konfigurieren. Allgemeines Plugin-Verhalten und Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Einrichtung

1. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
2. Konfigurieren Sie `channels.matrix` entweder mit `homeserver` + `accessToken` oder mit `homeserver` + `userId` + `password`.
3. Starten Sie den Gateway neu.
4. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein (siehe [automatisches Beitreten](#auto-join) - neue Einladungen landen nur, wenn `autoJoin` sie zulässt).

### Interaktive Einrichtung

```bash
openclaw channels add
openclaw configure --section channels
```

Der Assistent fragt nach: Homeserver-URL, Authentifizierungsmethode (Zugriffstoken oder Passwort), Benutzer-ID (nur Passwort-Authentifizierung), optionalem Gerätenamen, ob E2EE aktiviert werden soll und ob Raumzugriff und automatisches Beitreten konfiguriert werden sollen.

Wenn passende `MATRIX_*`-Umgebungsvariablen bereits vorhanden sind und das ausgewählte Konto keine gespeicherte Authentifizierung hat, bietet der Assistent eine Umgebungsvariablen-Abkürzung an. Um Raumnamen vor dem Speichern einer Allowlist aufzulösen, führen Sie `openclaw channels resolve --channel matrix "Project Room"` aus. Wenn E2EE aktiviert ist, schreibt der Assistent die Konfiguration und führt denselben Bootstrap wie [`openclaw matrix encryption setup`](#encryption-and-verification) aus.

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

Passwort-basiert (das Token wird nach der ersten Anmeldung zwischengespeichert):

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

`channels.matrix.autoJoin` ist standardmäßig `off`. Mit dem Standard erscheint der Bot nicht in neuen Räumen oder DMs aus neuen Einladungen, bis Sie manuell beitreten.

OpenClaw kann zum Einladungszeitpunkt nicht erkennen, ob ein eingeladener Raum eine DM oder eine Gruppe ist, daher laufen alle Einladungen - einschließlich DM-artiger Einladungen - zuerst über `autoJoin`. `dm.policy` greift erst später, nachdem der Bot beigetreten ist und der Raum klassifiziert wurde.

<Warning>
Setzen Sie `autoJoin: "allowlist"` plus `autoJoinAllowlist`, um einzuschränken, welche Einladungen der Bot annimmt, oder `autoJoin: "always"`, um jede Einladung anzunehmen.

`autoJoinAllowlist` akzeptiert nur stabile Ziele: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt; Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den vom eingeladenen Raum behaupteten Zustand.
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

Um jede Einladung anzunehmen, verwenden Sie `autoJoin: "always"`.

### Zielformate für Allowlists

DM- und Raum-Allowlists werden am besten mit stabilen IDs befüllt:

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden standardmäßig ignoriert, weil sie veränderbar sind; setzen Sie `dangerouslyAllowNameMatching: true` nur, wenn Sie ausdrücklich Kompatibilität mit Anzeigenamen-Einträgen benötigen.
- Raum-Allowlist-Schlüssel (`groups`, veraltet `rooms`): Verwenden Sie `!room:server` oder `#alias:server`. Einfache Raumnamen werden standardmäßig ignoriert; setzen Sie `dangerouslyAllowNameMatching: true` nur, wenn Sie ausdrücklich Kompatibilität mit der Namenssuche für beigetretene Räume benötigen.
- Einladungs-Allowlists (`autoJoinAllowlist`): Verwenden Sie `!room:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.

### Normalisierung der Konto-ID

Der Assistent wandelt einen freundlichen Namen in eine normalisierte Konto-ID um. Beispielsweise wird `Ops Bot` zu `ops-bot`. Satzzeichen werden in bereichsbezogenen Umgebungsvariablennamen maskiert, sodass zwei Konten nicht kollidieren können: `-` → `_X2D_`, also wird `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet.

### Zwischengespeicherte Zugangsdaten

Matrix speichert zwischengespeicherte Zugangsdaten unter `~/.openclaw/credentials/matrix/`:

- Standardkonto: `credentials.json`
- Benannte Konten: `credentials-<account>.json`

Wenn dort zwischengespeicherte Zugangsdaten vorhanden sind, behandelt OpenClaw Matrix als konfiguriert, selbst wenn das Zugriffstoken nicht in der Konfigurationsdatei steht - das deckt Einrichtung, `openclaw doctor` und Kanalstatus-Prüfungen ab.

### Umgebungsvariablen

Werden verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; benannte Konten verwenden die vor dem Suffix eingefügte Konto-ID.

| Standardkonto        | Benanntes Konto (`<ID>` ist die normalisierte Konto-ID) |
| -------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Für das Konto `ops` werden die Namen zu `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` usw. Die Recovery-Key-Umgebungsvariablen werden von recovery-fähigen CLI-Flows (`verify backup restore`, `verify device`, `verify bootstrap`) gelesen, wenn Sie den Schlüssel über `--recovery-key-stdin` per Pipe übergeben.

`MATRIX_HOMESERVER` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Konfigurationsbeispiel

Eine praxisnahe Basis mit DM-Pairing, Raum-Allowlist und E2EE:

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

Matrix-Antwort-Streaming ist opt-in. `streaming` steuert, wie OpenClaw die laufende Assistentenantwort ausliefert; `blockStreaming` steuert, ob jeder abgeschlossene Block als eigene Matrix-Nachricht erhalten bleibt.

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

| `streaming`       | Verhalten                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (Standard) | Auf die vollständige Antwort warten, einmal senden. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Eine normale Textnachricht direkt bearbeiten, während das Modell den aktuellen Block schreibt. Standard-Matrix-Clients benachrichtigen möglicherweise bei der ersten Vorschau, nicht bei der finalen Bearbeitung.              |
| `"quiet"`         | Wie `"partial"`, aber die Nachricht ist ein nicht benachrichtigender Hinweis. Empfänger erhalten erst dann eine Benachrichtigung, wenn eine benutzerspezifische Push-Regel zur finalisierten Bearbeitung passt (siehe unten). |

`blockStreaming` ist unabhängig von `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (Standard)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block, abgeschlossene Blöcke als Nachrichten behalten | Live-Entwurf für den aktuellen Block, direkt finalisiert |
| `"off"`                 | Eine benachrichtigende Matrix-Nachricht pro abgeschlossenem Block                     | Eine benachrichtigende Matrix-Nachricht für die vollständige Antwort      |

Hinweise:

- Wenn eine Vorschau die Matrix-Größenbegrenzung pro Event überschreitet, stoppt OpenClaw das Vorschau-Streaming und fällt auf reine finale Auslieferung zurück.
- Medienantworten senden Anhänge immer normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie, bevor die finale Medienantwort gesendet wird.
- Vorschauaktualisierungen zum Tool-Fortschritt sind standardmäßig aktiviert, wenn Matrix-Vorschau-Streaming aktiv ist. Setzen Sie `streaming.preview.toolProgress: false`, um Vorschau-Bearbeitungen für Antworttext beizubehalten, den Tool-Fortschritt aber auf dem normalen Auslieferungspfad zu lassen.
- Vorschau-Bearbeitungen kosten zusätzliche Matrix-API-Aufrufe. Lassen Sie `streaming: "off"`, wenn Sie das konservativste Rate-Limit-Profil wünschen.

## Sprachnachrichten

Eingehende Matrix-Sprachnotizen werden vor der Raum-Erwähnungsprüfung transkribiert. Dadurch kann eine Sprachnotiz, die den Bot-Namen sagt, den Agenten in einem Raum mit `requireMention: true` auslösen, und der Agent erhält das Transkript statt nur eines Audioanhang-Platzhalters.

Matrix verwendet den gemeinsamen Audio-Medien-Provider, der unter `tools.media.audio` konfiguriert ist, beispielsweise OpenAI `gpt-4o-mini-transcribe`. Informationen zu Provider-Einrichtung und Limits finden Sie in der [Medientools-Übersicht](/de/tools/media-overview).

Verhaltensdetails:

- `m.audio`-Events und `m.file`-Events mit einem `audio/*`-MIME-Typ sind geeignet.
- In verschlüsselten Räumen entschlüsselt OpenClaw den Anhang über den bestehenden Matrix-Medienpfad vor der Transkription.
- Das Transkript wird im Agenten-Prompt als maschinell erzeugt und nicht vertrauenswürdig markiert.
- Der Anhang wird als bereits transkribiert markiert, sodass nachgelagerte Medientools dieselbe Sprachnotiz nicht erneut transkribieren.
- Setzen Sie `tools.media.audio.enabled: false`, um Audiotranskription global zu deaktivieren.

## Genehmigungsmetadaten

Native Matrix-Genehmigungsaufforderungen sind normale `m.room.message`-Events mit OpenClaw-spezifischem benutzerdefiniertem Event-Inhalt unter `com.openclaw.approval`. Matrix erlaubt benutzerdefinierte Event-Inhaltsschlüssel, sodass Standard-Clients weiterhin den Textkörper rendern, während OpenClaw-fähige Clients die strukturierte Genehmigungs-ID, Art, Status, verfügbaren Entscheidungen und Ausführungs-/Plugin-Details lesen können.

Wenn eine Genehmigungsaufforderung zu lang für ein Matrix-Event ist, teilt OpenClaw den sichtbaren Text in Blöcke auf und hängt `com.openclaw.approval` nur an den ersten Block an. Reaktionen für Zulassen-/Ablehnen-Entscheidungen sind an dieses erste Event gebunden, sodass lange Aufforderungen dasselbe Genehmigungsziel wie Einzel-Event-Aufforderungen behalten.

### Selbst gehostete Push-Regeln für stille finalisierte Vorschauen

`streaming: "quiet"` benachrichtigt Empfänger erst, wenn ein Block oder Turn finalisiert ist - eine benutzerspezifische Push-Regel muss zum finalisierten Vorschau-Marker passen. Das vollständige Rezept (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver) finden Sie unter [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie absichtlich Matrix-Verkehr zwischen Agenten wünschen:

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
- Akzeptierte Nachrichten konfigurierter Bots verwenden den gemeinsamen [Bot-Loop-Schutz](/de/channels/bot-loop-protection). Konfigurieren Sie `channels.defaults.botLoopProtection` und überschreiben Sie dies dann mit `channels.matrix.botLoopProtection` oder `channels.matrix.groups.<room>.botLoopProtection`, wenn ein Raum ein anderes Budget benötigt.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwort-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von einem Bot verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Erlaubnislisten und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Datenverkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich - das Plugin erkennt den E2EE-Status automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnose), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Multi-Konto-Setups). Die Ausgabe ist standardmäßig knapp, mit ruhigem internem SDK-Logging. Die folgenden Beispiele zeigen die kanonische Form; fügen Sie die Flags nach Bedarf hinzu.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
```

Initialisiert geheimen Speicher und Cross-Signing, erstellt bei Bedarf ein Raum-Schlüssel-Backup und gibt anschließend Status und nächste Schritte aus. Nützliche Flags:

- `--recovery-key <key>` wendet vor der Initialisierung einen Wiederherstellungsschlüssel an (bevorzugen Sie die unten dokumentierte stdin-Form)
- `--force-reset-cross-signing` verwirft die aktuelle Cross-Signing-Identität und erstellt eine neue (nur absichtlich verwenden)

Für ein neues Konto aktivieren Sie E2EE bei der Erstellung:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` ist ein Alias für `--enable-e2ee`.

Manuelles Konfigurationsäquivalent:

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

- `Locally trusted`: nur von diesem Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: das SDK meldet Verifizierung per Cross-Signing
- `Signed by owner`: mit Ihrem eigenen Self-Signing-Schlüssel signiert (nur Diagnose)

`Verified by owner` wird nur dann zu `yes`, wenn `Cross-signing verified` `yes` ist. Lokales Vertrauen oder eine Owner-Signatur allein reicht nicht aus.

`--allow-degraded-local-state` gibt Best-Effort-Diagnosen zurück, ohne zuerst das Matrix-Konto vorzubereiten; nützlich für Offline- oder teilweise konfigurierte Prüfungen.

### Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren

Der Wiederherstellungsschlüssel ist sensibel - leiten Sie ihn per stdin weiter, statt ihn auf der Befehlszeile zu übergeben. Setzen Sie `MATRIX_RECOVERY_KEY` (oder `MATRIX_<ID>_RECOVERY_KEY` für ein benanntes Konto):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für geheimen Speicher oder Gerätevertrauen akzeptiert.
- `Backup usable`: Das Raum-Schlüssel-Backup kann mit dem vertrauenswürdigen Wiederherstellungsmaterial geladen werden.
- `Device verified by owner`: Dieses Gerät hat vollständiges Matrix-Cross-Signing-Identitätsvertrauen.

Er beendet sich mit einem Nicht-Null-Code, wenn das vollständige Identitätsvertrauen unvollständig ist, selbst wenn der Wiederherstellungsschlüssel Backup-Material entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung von einem anderen Matrix-Client aus ab:

```bash
openclaw matrix verify self
```

`verify self` wartet auf `Cross-signing verified: yes`, bevor es erfolgreich beendet wird. Verwenden Sie `--timeout-ms <ms>`, um die Wartezeit anzupassen.

Die Literal-Schlüssel-Form `openclaw matrix verify device "<recovery-key>"` wird ebenfalls akzeptiert, aber der Schlüssel landet in Ihrem Shell-Verlauf.

### Cross-Signing initialisieren oder reparieren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Konten. Der Reihe nach:

- initialisiert er geheimen Speicher und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel wieder
- initialisiert er Cross-Signing und lädt fehlende öffentliche Schlüssel hoch
- markiert und cross-signiert er das aktuelle Gerät
- erstellt er ein serverseitiges Raum-Schlüssel-Backup, falls noch keines vorhanden ist

Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln verlangt, versucht OpenClaw zuerst no-auth, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (kombinieren mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) oder `--recovery-key <key>`
- `--force-reset-cross-signing`, um die aktuelle Cross-Signing-Identität zu verwerfen (nur absichtlich; erfordert, dass der aktive Wiederherstellungsschlüssel gespeichert ist oder mit `--recovery-key-stdin` bereitgestellt wird)

### Raum-Schlüssel-Backup

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt, ob ein serverseitiges Backup existiert und ob dieses Gerät es entschlüsseln kann. `backup restore` importiert gesicherte Raum-Schlüssel in den lokalen Crypto-Store; wenn der Wiederherstellungsschlüssel bereits auf der Festplatte liegt, können Sie `--recovery-key-stdin` weglassen.

Um ein defektes Backup durch eine frische Basis zu ersetzen (akzeptiert den Verlust nicht wiederherstellbarer alter Historie; kann auch geheimen Speicher neu erstellen, wenn das aktuelle Backup-Geheimnis nicht ladbar ist):

```bash
openclaw matrix verify backup reset --yes
```

Fügen Sie `--rotate-recovery-key` nur hinzu, wenn Sie absichtlich möchten, dass der vorherige Wiederherstellungsschlüssel die frische Backup-Basis nicht mehr entsperrt.

### Verifizierungen auflisten, anfordern und beantworten

```bash
openclaw matrix verify list
```

Listet ausstehende Verifizierungsanfragen für das ausgewählte Konto auf.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Sendet eine Verifizierungsanfrage von diesem OpenClaw-Konto. `--own-user` fordert Selbstverifizierung an (Sie akzeptieren die Aufforderung in einem anderen Matrix-Client desselben Benutzers); `--user-id`/`--device-id`/`--room-id` zielen auf jemand anderen. `--own-user` kann nicht mit den anderen Ziel-Flags kombiniert werden.

Für niedrigere Lifecycle-Behandlung - typischerweise beim Begleiten eingehender Anfragen von einem anderen Client - wirken diese Befehle auf eine bestimmte Anfrage `<id>` (ausgegeben von `verify list` und `verify request`):

| Befehl                                    | Zweck                                                               |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`      | Eine eingehende Anfrage akzeptieren                                 |
| `openclaw matrix verify start <id>`       | Den SAS-Flow starten                                                |
| `openclaw matrix verify sas <id>`         | Die SAS-Emoji oder Dezimalzahlen ausgeben                           |
| `openclaw matrix verify confirm-sas <id>` | Bestätigen, dass SAS mit der Anzeige des anderen Clients übereinstimmt |
| `openclaw matrix verify mismatch-sas <id>` | SAS ablehnen, wenn Emoji oder Dezimalzahlen nicht übereinstimmen    |
| `openclaw matrix verify cancel <id>`      | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als DM-Follow-up-Hinweise, wenn die Verifizierung an einen bestimmten Direktnachrichtenraum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Wenn Sie mehrere benannte Konten haben und `channels.matrix.defaultAccount` nicht gesetzt haben, verweigern sie eine Vermutung und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Mit `encryption: true` ist der Standardwert von `startupVerification` `"if-unverified"`. Beim Start fordert ein unverifiziertes Gerät Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abklingzeit an (standardmäßig 24 Stunden). Passen Sie dies mit `startupVerificationCooldownHours` an oder deaktivieren Sie es mit `startupVerification: "off"`.

    Beim Start läuft außerdem ein konservativer Crypto-Initialisierungslauf, der den aktuellen geheimen Speicher und die Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Status defekt ist, versucht OpenClaw eine geschützte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA verlangt, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Owner signierte Geräte bleiben erhalten.

    Siehe [Matrix-Migration](/de/channels/matrix-migration) für den vollständigen Upgrade-Flow.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix postet Hinweise zum Verifizierungs-Lifecycle in den strikten DM-Verifizierungsraum als `m.notice`-Nachrichten: Anfrage, Bereit (mit Anleitung „Per Emoji verifizieren“), Start/Abschluss und SAS-Details (Emoji/Dezimal), wenn verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Bei der Selbstverifizierung startet OpenClaw den SAS-Flow automatisch und bestätigt die eigene Seite, sobald Emoji-Verifizierung verfügbar ist - Sie müssen weiterhin vergleichen und „Sie stimmen überein“ in Ihrem Matrix-Client bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Wenn `verify status` meldet, dass das aktuelle Gerät nicht mehr auf dem Homeserver gelistet ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für Passwort-Login:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Für Token-Authentifizierung erstellen Sie ein frisches Zugriffstoken in Ihrem Matrix-Client oder in der Admin-UI und aktualisieren dann OpenClaw:

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
    Matrix-E2EE verwendet den offiziellen Rust-Crypto-Pfad des `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Crypto-Status bleibt in `crypto-idb-snapshot.json` bestehen (restriktive Dateiberechtigungen).

    Verschlüsselter Runtime-Status liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst Sync-Store, Crypto-Store, Wiederherstellungsschlüssel, IDB-Snapshot, Thread-Bindungen und Startverifizierungsstatus. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw den besten vorhandenen Root wieder, sodass vorheriger Status sichtbar bleibt.

    Ein einzelner älterer Token-Hash-Root kann ein normaler Kontinuitätspfad bei Token-Rotation sein. Wenn OpenClaw `matrix: multiple populated token-hash storage roots detected` protokolliert, prüfen Sie das Kontoverzeichnis und archivieren Sie veraltete gleichgeordnete Roots erst, nachdem Sie bestätigt haben, dass der ausgewählte aktive Root gesund ist. Bevorzugen Sie es, veraltete Roots in ein `_archive/`-Verzeichnis zu verschieben, statt sie sofort zu löschen.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Sie können beide Optionen in einem Aufruf übergeben. Matrix akzeptiert `mxc://`-Avatar-URLs direkt; wenn Sie `http://` oder `https://` übergeben, lädt OpenClaw die Datei zuerst hoch und speichert die aufgelöste `mxc://`-URL in `channels.matrix.avatarUrl` (oder in der kontoabhängigen Überschreibung).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Message-Tool-Sendungen. Zwei unabhängige Regler steuern das Verhalten:

### Sitzungsrouting (`sessionScope`)

`dm.sessionScope` legt fest, wie Matrix-DM-Räume OpenClaw-Sitzungen zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Gegenüber teilen sich eine Sitzung.
- `"per-room"`: Jeder Matrix-DM-Raum erhält seinen eigenen Sitzungsschlüssel, auch wenn das Gegenüber identisch ist.

Explizite Konversationsbindungen haben immer Vorrang vor `sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung behalten.

### Antwort-Threading (`threadReplies`)

`threadReplies` legt fest, wo der Bot seine Antwort postet:

- `"off"`: Antworten sind auf oberster Ebene. Eingehende Thread-Nachrichten bleiben in der übergeordneten Sitzung.
- `"inbound"`: Nur dann innerhalb eines Threads antworten, wenn die eingehende Nachricht bereits in diesem Thread war.
- `"always"`: Innerhalb eines Threads antworten, der bei der auslösenden Nachricht verwurzelt ist; diese Konversation wird ab dem ersten Auslöser über eine passende thread-bezogene Sitzung geroutet.

`dm.threadReplies` überschreibt dies nur für DMs - zum Beispiel, um Raum-Threads isoliert zu halten, während DMs flach bleiben.

### Thread-Vererbung und Slash-Befehle

- Eingehende Thread-Nachrichten enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Message-Tool-Sendungen übernehmen automatisch den aktuellen Matrix-Thread, wenn sie denselben Raum (oder dasselbe DM-Benutzerziel) adressieren, sofern keine explizite `threadId` angegeben ist.
- Die Wiederverwendung von DM-Benutzerzielen greift nur, wenn die aktuellen Sitzungsmetadaten dasselbe DM-Gegenüber auf demselben Matrix-Konto belegen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und thread-gebundenes `/acp spawn` funktionieren alle in Matrix-Räumen und DMs.
- Ein `/focus` auf oberster Ebene erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSessions` aktiviert ist.
- Das Ausführen von `/focus` oder `/acp spawn --thread here` innerhalb eines vorhandenen Matrix-Threads bindet diesen Thread an Ort und Stelle.

Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben geteilten Sitzung kollidiert, postet es einmalig ein `m.notice` in diesem Raum, das auf den `/focus`-Ausweg verweist und eine Änderung von `dm.sessionScope` vorschlägt. Der Hinweis erscheint nur, wenn Thread-Bindungen aktiviert sind.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und vorhandene Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des vorhandenen Threads aus, die bzw. den Sie weiter verwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geroutet.
- Innerhalb eines vorhandenen Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnSessions` steuert `/acp spawn --thread auto|here`, wobei OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Thread-Bindungskonfiguration

Matrix erbt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem kanalabhängige Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-thread-gebundene Sitzungserzeugungen sind standardmäßig aktiviert:

- Setzen Sie `threadBindings.spawnSessions: false`, um zu verhindern, dass `/focus` auf oberster Ebene und `/acp spawn --thread auto|here` Matrix-Threads erstellen oder binden.
- Setzen Sie `threadBindings.defaultSpawnContext: "isolated"`, wenn native Subagent-Thread-Erzeugungen das übergeordnete Transkript nicht forken sollen.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, eingehende Reaktionsbenachrichtigungen und Bestätigungsreaktionen.

Das Tooling für ausgehende Reaktionen wird durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Event eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein Matrix-Event auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf diesem Event.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bots.

**Auflösungsreihenfolge** (der erste definierte Wert gewinnt):

| Einstellung             | Reihenfolge                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | pro Konto → Kanal → `messages.ackReaction` → Emoji-Fallback der Agent-Identität  |
| `ackReactionScope`      | pro Konto → Kanal → `messages.ackReactionScope` → Standard `"group-mentions"`    |
| `reactionNotifications` | pro Konto → Kanal → Standard `"own"`                                             |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Events weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten zielen; `"off"` deaktiviert Reaktions-Systemevents. Reaktionsentfernungen werden nicht zu Systemevents synthetisiert, weil Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen bereitstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standard `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Matrix-Raumverlauf ist nur ausstehend: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle auslösende Nachricht wird nicht in `InboundHistory` einbezogen; sie bleibt für diesen Turn im Haupttext der eingehenden Nachricht.
- Wiederholungen desselben Matrix-Events verwenden den ursprünglichen Verlaufssnapshot erneut, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Roots und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext bleibt wie empfangen erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen erlaubt sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber weiterhin eine explizit zitierte Antwort.

Diese Einstellung beeinflusst die Sichtbarkeit von ergänzendem Kontext, nicht ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Auslöseberechtigung kommt weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Um DMs vollständig stummzuschalten, während Räume weiter funktionieren, setzen Sie `dm.enabled: false`:

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

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiter Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und sendet nach einer kurzen Abklingzeit möglicherweise eine Erinnerungsantwort, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Direct-Message-Zustand nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Solo-Räume statt auf die aktive DM zeigen. Prüfen Sie die aktuelle Zuordnung für ein Gegenüber:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide Befehle akzeptieren `--account <id>` für Mehrkonto-Setups. Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt auf eine beliebige aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine fehlerfreie DM existiert

Alte Räume werden nicht automatisch gelöscht. OpenClaw wählt die fehlerfreie DM aus und aktualisiert die Zuordnung, damit zukünftige Matrix-Sendungen, Verifizierungshinweise und andere Direct-Message-Abläufe den richtigen Raum adressieren.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungsclient fungieren. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder `channels.matrix.accounts.<account>.execApprovals` für eine kontoabhängige Überschreibung):

- `enabled`: Genehmigungen über Matrix-native Prompts zustellen. Wenn nicht gesetzt oder `"auto"`, aktiviert Matrix dies automatisch, sobald mindestens ein Genehmigender aufgelöst werden kann. Setzen Sie `false`, um dies explizit zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Exec-Anfragen genehmigen dürfen. Optional - fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: Wohin Prompts gehen. `"dm"` (Standard) sendet an DMs der Genehmigenden; `"channel"` sendet an den ursprünglichen Matrix-Raum oder die ursprüngliche DM; `"both"` sendet an beide.
- `agentFilter` / `sessionFilter`: optionale Allowlists dafür, welche Agents/Sitzungen Matrix-Zustellung auslösen.

Die Autorisierung unterscheidet sich leicht zwischen Genehmigungsarten:

- **Exec-Genehmigungen** verwenden `execApprovals.approvers` und fallen auf `dm.allowFrom` zurück.
- **Plugin-Genehmigungen** autorisieren ausschließlich über `dm.allowFrom`.

Beide Arten teilen Matrix-Reaktionskürzel und Nachrichtenaktualisierungen. Genehmigende sehen Reaktionskürzel in der primären Genehmigungsnachricht:

- `✅` einmal erlauben
- `❌` ablehnen
- `♾️` immer erlauben (wenn die effektive Exec-Richtlinie dies erlaubt)

Fallback-Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Kanalzustellung für Exec-Genehmigungen enthält den Befehlstext - aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandt: [Exec-Genehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in DMs. In Räumen erkennt OpenClaw außerdem Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad ohne benutzerdefinierten Erwähnungs-Regex auslöst. Dadurch reagiert der Bot auf raumtypische `@mention /command`-Posts, die Element und ähnliche Clients ausgeben, wenn ein Benutzer den Bot vor dem Eingeben des Befehls per Tab-Vervollständigung auswählt.

Autorisierungsregeln gelten weiterhin: Befehlsabsender müssen dieselben DM- oder Raum-Allowlist-/Owner-Richtlinien erfüllen wie normale Nachrichten.

## Mehrkonto

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

- Werte auf oberster Ebene in `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
- Beschränken Sie einen geerbten Raumeintrag mit `groups.<room>.account` auf ein bestimmtes Konto. Einträge ohne `account` werden kontenübergreifend geteilt; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf oberster Ebene konfiguriert ist.

**Auswahl des Standardkontos:**

- Legen Sie `defaultAccount` fest, um das benannte Konto auszuwählen, das implizites Routing, Probing und CLI-Befehle bevorzugen.
- Wenn Sie mehrere Konten haben und eines davon buchstäblich `default` heißt, verwendet OpenClaw es implizit, auch wenn `defaultAccount` nicht gesetzt ist.
- Wenn Sie mehrere benannte Konten haben und kein Standardkonto ausgewählt ist, verweigern CLI-Befehle das Raten - legen Sie `defaultAccount` fest oder übergeben Sie `--account <id>`.
- Der Block `channels.matrix.*` auf oberster Ebene wird nur dann als implizites Konto `default` behandelt, wenn seine Authentifizierung vollständig ist (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben über `homeserver` + `userId` auffindbar, sobald zwischengespeicherte Anmeldedaten die Authentifizierung abdecken.

**Hochstufung:**

- Wenn OpenClaw eine Einzelkonto-Konfiguration während Reparatur oder Einrichtung auf mehrere Konten hochstuft, behält es das vorhandene benannte Konto bei, sofern eines vorhanden ist oder `defaultAccount` bereits darauf verweist. Nur Matrix-Authentifizierungs-/Bootstrap-Schlüssel werden in das hochgestufte Konto verschoben; gemeinsam genutzte Schlüssel für Zustellrichtlinien bleiben auf oberster Ebene.

Siehe [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Mehrkonten-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum SSRF-Schutz, sofern Sie
nicht ausdrücklich pro Konto zustimmen.

Wenn Ihr Homeserver auf localhost, einer LAN/Tailscale-IP oder einem internen Hostnamen läuft, aktivieren Sie
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

Beispiel für die CLI-Einrichtung:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Diese Zustimmung erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche Klartext-Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Bevorzugen Sie nach Möglichkeit `https://`.

## Proxying von Matrix-Traffic

Wenn Ihre Matrix-Bereitstellung einen expliziten ausgehenden HTTP(S)-Proxy benötigt, legen Sie `channels.matrix.proxy` fest:

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

Benannte Konten können den Standard auf oberster Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Traffic zur Laufzeit und Kontostatus-Probes.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Matrix-Raum-IDs unterscheiden Groß- und Kleinschreibung. Verwenden Sie die exakte Schreibweise der Raum-ID aus Matrix,
wenn Sie explizite Zustellziele, Cron-Jobs, Bindings oder Allowlists konfigurieren.
OpenClaw hält interne Sitzungsschlüssel für die Speicherung kanonisch, daher sind diese kleingeschriebenen
Schlüssel keine zuverlässige Quelle für Matrix-Zustell-IDs.

Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt. Die Namenssuche in beigetretenen Räumen ist Best-Effort und gilt nur für Laufzeit-Raum-Allowlists, wenn `dangerouslyAllowNameMatching: true` gesetzt ist.
- Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er bei der Laufzeitauflösung der Allowlist ignoriert.

## Konfigurationsreferenz

Allowlist-artige Benutzerfelder (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs (am sichersten). Benutzer-Einträge ohne ID werden standardmäßig ignoriert. Wenn Sie `dangerouslyAllowNameMatching: true` setzen, werden exakte Treffer von Matrix-Verzeichnis-Anzeigenamen beim Start und immer dann aufgelöst, wenn sich die Allowlist ändert, während der Monitor läuft; Einträge, die nicht aufgelöst werden können, werden zur Laufzeit ignoriert.

Raum-Allowlist-Schlüssel (`groups`, legacy `rooms`) sollten Raum-IDs oder Aliasse sein. Einfache Raumnamenschlüssel werden standardmäßig ignoriert; `dangerouslyAllowNameMatching: true` stellt die Best-Effort-Suche nach Namen beigetretener Räume wieder her.

### Konto und Verbindung

- `enabled`: den Kanal aktivieren oder deaktivieren.
- `name`: optionale Anzeigebezeichnung für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: benannte Überschreibungen pro Konto. Werte auf oberster Ebene in `channels.matrix` werden als Standardwerte geerbt.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Konto erlauben, sich mit `localhost`, LAN/Tailscale-IPs oder internen Hostnamen zu verbinden.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Traffic. Überschreibung pro Konto wird unterstützt.
- `userId`: vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartext- und SecretRef-Werte werden über env/file/exec-Provider hinweg unterstützt ([Secrets Management](/de/gateway/secrets)).
- `password`: Passwort für passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Geräteanzeigename, der bei der Passwortanmeldung verwendet wird.
- `avatarUrl`: gespeicherte eigene Avatar-URL für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl von Ereignissen, die während der Start-Synchronisierung abgerufen werden.

### Verschlüsselung

- `encryption`: E2EE aktivieren. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard, wenn E2EE aktiviert ist) oder `"off"`. Fordert beim Start automatisch Selbstverifizierung an, wenn dieses Gerät unverifiziert ist.
- `startupVerificationCooldownHours`: Abkühlzeit vor der nächsten automatischen Startanfrage. Standard: `24`.

### Zugriff und Richtlinie

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raum-Traffic.
- `dm.enabled`: wenn `false`, alle DMs ignorieren. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Gilt, nachdem der Bot dem Raum beigetreten ist und ihn als DM klassifiziert hat; beeinflusst die Einladungsbehandlung nicht.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Traffic.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: Nur-DM-Überschreibung für Antwort-Threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: Nachrichten von anderen konfigurierten Matrix-Bot-Konten akzeptieren (`true` oder `"mentions"`).
- `allowlistOnly`: wenn `true`, werden alle aktiven DM-Richtlinien (außer `"disabled"`) und `"open"`-Gruppenrichtlinien auf `"allowlist"` erzwungen. Ändert keine `"disabled"`-Richtlinien.
- `dangerouslyAllowNameMatching`: wenn `true`, erlaubt Matrix-Anzeigenamen-Verzeichnissuche für Benutzer-Allowlist-Einträge und Namenssuche in beigetretenen Räumen für Raum-Allowlist-Schlüssel. Bevorzugen Sie vollständige `@user:server`-IDs und Raum-IDs oder Aliasse.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` `"allowlist"` ist. Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den vom eingeladenen Raum beanspruchten Zustand.
- `contextVisibility`: ergänzende Kontextsichtbarkeit (Standard `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"`, `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` oder `"always"`.
- `threadBindings`: kanalbezogene Überschreibungen für threadgebundenes Sitzungsrouting und Lebenszyklus.
- `streaming`: `"off"` (Standard), `"partial"`, `"quiet"` oder Objektform `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wenn `true`, werden abgeschlossene Assistentenblöcke als separate Fortschrittsnachrichten beibehalten.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: ausgehende Chunk-Größe in Zeichen, wenn `chunkMode: "length"`. Standard: `4000`.
- `chunkMode`: `"length"` (Standard, teilt nach Zeichenanzahl) oder `"newline"` (teilt an Zeilengrenzen).
- `historyLimit`: Anzahl aktueller Raumnachrichten, die als `InboundHistory` eingeschlossen werden, wenn eine Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standard `0` (deaktiviert).
- `mediaMaxMb`: Mediengrößenlimit in MB für ausgehende Sendungen und eingehende Verarbeitung.

### Reaktionseinstellungen

- `ackReaction`: Überschreibung der Ack-Reaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: Scope-Überschreibung (Standard `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (Standard `"own"`, `"off"`).

### Tooling und Überschreibungen pro Raum

- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: Richtlinien-Map pro Raum. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein legacy Alias.)
  - `groups.<room>.account`: einen geerbten Raumeintrag auf ein bestimmtes Konto beschränken.
  - `groups.<room>.allowBots`: Überschreibung der Einstellung auf Kanalebene pro Raum (`true` oder `"mentions"`).
  - `groups.<room>.users`: Absender-Allowlist pro Raum.
  - `groups.<room>.tools`: Tool-Allow-/Deny-Überschreibungen pro Raum.
  - `groups.<room>.autoReply`: Überschreibung des Mention-Gatings pro Raum. `true` deaktiviert Mention-Anforderungen für diesen Raum; `false` erzwingt sie wieder.
  - `groups.<room>.skills`: Skill-Filter pro Raum.
  - `groups.<room>.systemPrompt`: System-Prompt-Snippet pro Raum.

### Einstellungen für Exec-Genehmigungen

- `execApprovals.enabled`: Exec-Genehmigungen über Matrix-native Prompts zustellen.
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die genehmigen dürfen. Fällt auf `dm.allowFrom` zurück.
- `execApprovals.target`: `"dm"` (Standard), `"channel"` oder `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionale Agent-/Sitzungs-Allowlists für die Zustellung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) - DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) - Gruppenchat-Verhalten und Mention-Gating
- [Kanalrouting](/de/channels/channel-routing) - Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung

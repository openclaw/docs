---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Supportstatus, Einrichtung und Konfigurationsbeispiele für Matrix
title: Matrix
x-i18n:
    generated_at: "2026-05-11T20:21:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein herunterladbares Kanal-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt Direktnachrichten, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Installieren

Installieren Sie Matrix aus ClawHub, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/matrix
```

Bloße Plugin-Spezifikationen versuchen zuerst ClawHub und greifen dann auf npm zurück. Um die Registry-Quelle zu erzwingen, verwenden Sie `openclaw plugins install clawhub:@openclaw/matrix` oder `openclaw plugins install npm:@openclaw/matrix`.

Aus einem lokalen Checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registriert und aktiviert das Plugin, daher ist kein separater Schritt `openclaw plugins enable matrix` erforderlich. Das Plugin tut dennoch nichts, bis Sie den unten beschriebenen Kanal konfigurieren. Allgemeines Plugin-Verhalten und Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Einrichtung

1. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
2. Konfigurieren Sie `channels.matrix` entweder mit `homeserver` + `accessToken` oder mit `homeserver` + `userId` + `password`.
3. Starten Sie den Gateway neu.
4. Starten Sie eine Direktnachricht mit dem Bot oder laden Sie ihn in einen Raum ein (siehe [automatischer Beitritt](#auto-join) - neue Einladungen landen nur, wenn `autoJoin` sie zulässt).

### Interaktive Einrichtung

```bash
openclaw channels add
openclaw configure --section channels
```

Der Assistent fragt nach: Homeserver-URL, Authentifizierungsmethode (Zugriffstoken oder Passwort), Benutzer-ID (nur Passwortauthentifizierung), optionalem Gerätenamen, ob E2EE aktiviert werden soll und ob Raumzugriff und automatischer Beitritt konfiguriert werden sollen.

Wenn passende `MATRIX_*`-Umgebungsvariablen bereits vorhanden sind und das ausgewählte Konto keine gespeicherte Authentifizierung hat, bietet der Assistent eine Umgebungsvariablen-Abkürzung an. Um Raumnamen vor dem Speichern einer Allowlist aufzulösen, führen Sie `openclaw channels resolve --channel matrix "Project Room"` aus. Wenn E2EE aktiviert ist, schreibt der Assistent die Konfiguration und führt denselben Bootstrap wie [`openclaw matrix encryption setup`](#encryption-and-verification) aus.

### Minimale Konfiguration

Tokenbasiert:

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

### Automatischer Beitritt

`channels.matrix.autoJoin` ist standardmäßig `off`. Mit der Standardeinstellung erscheint der Bot nicht in neuen Räumen oder Direktnachrichten aus neuen Einladungen, bis Sie manuell beitreten.

OpenClaw kann zum Einladungszeitpunkt nicht erkennen, ob ein eingeladener Raum eine Direktnachricht oder eine Gruppe ist. Daher durchlaufen alle Einladungen - einschließlich Direktnachricht-ähnlicher Einladungen - zuerst `autoJoin`. `dm.policy` wird erst später angewendet, nachdem der Bot beigetreten ist und der Raum klassifiziert wurde.

<Warning>
Setzen Sie `autoJoin: "allowlist"` plus `autoJoinAllowlist`, um einzuschränken, welche Einladungen der Bot annimmt, oder `autoJoin: "always"`, um jede Einladung anzunehmen.

`autoJoinAllowlist` akzeptiert nur stabile Ziele: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt; Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den Zustand, den der eingeladene Raum behauptet.
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

### Allowlist-Zielformate

Allowlists für Direktnachrichten und Räume sollten am besten mit stabilen IDs befüllt werden:

- Direktnachrichten (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden standardmäßig ignoriert, weil sie veränderbar sind; setzen Sie `dangerouslyAllowNameMatching: true` nur, wenn Sie ausdrücklich Kompatibilität mit Anzeigenamen-Einträgen benötigen.
- Raum-Allowlist-Schlüssel (`groups`, veraltetes `rooms`): Verwenden Sie `!room:server` oder `#alias:server`. Einfache Raumnamen werden standardmäßig ignoriert; setzen Sie `dangerouslyAllowNameMatching: true` nur, wenn Sie ausdrücklich Kompatibilität mit der Namenssuche in beigetretenen Räumen benötigen.
- Einladungs-Allowlists (`autoJoinAllowlist`): Verwenden Sie `!room:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.

### Normalisierung der Konto-ID

Der Assistent wandelt einen benutzerfreundlichen Namen in eine normalisierte Konto-ID um. Beispielsweise wird aus `Ops Bot` `ops-bot`. Interpunktion wird in bereichsbezogenen Umgebungsvariablennamen maskiert, sodass zwei Konten nicht kollidieren können: `-` → `_X2D_`, daher wird `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet.

### Zwischengespeicherte Anmeldedaten

Matrix speichert zwischengespeicherte Anmeldedaten unter `~/.openclaw/credentials/matrix/`:

- Standardkonto: `credentials.json`
- benannte Konten: `credentials-<account>.json`

Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, behandelt OpenClaw Matrix als konfiguriert, selbst wenn das Zugriffstoken nicht in der Konfigurationsdatei steht - das gilt für die Einrichtung, `openclaw doctor` und Kanalstatus-Prüfungen.

### Umgebungsvariablen

Werden verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; benannte Konten verwenden die Konto-ID, die vor dem Suffix eingefügt wird.

| Standardkonto         | Benanntes Konto (`<ID>` ist die normalisierte Konto-ID) |
| --------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                              |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                   |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                  |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                 |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                               |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                              |

Für das Konto `ops` werden die Namen zu `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` und so weiter. Die Umgebungsvariablen für Wiederherstellungsschlüssel werden von recovery-bewussten CLI-Flows (`verify backup restore`, `verify device`, `verify bootstrap`) gelesen, wenn Sie den Schlüssel über `--recovery-key-stdin` einspeisen.

`MATRIX_HOMESERVER` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Konfigurationsbeispiel

Eine praktische Basis mit Direktnachricht-Pairing, Raum-Allowlist und E2EE:

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

Matrix-Antwortstreaming ist optional. `streaming` steuert, wie OpenClaw die laufende Assistentenantwort ausliefert; `blockStreaming` steuert, ob jeder abgeschlossene Block als eigene Matrix-Nachricht erhalten bleibt.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Um Live-Antwortvorschauen beizubehalten, aber Zwischenzeilen zu Tools/Fortschritt auszublenden, verwenden Sie die Objektform:

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
| `"off"` (Standard) | Auf die vollständige Antwort warten, einmal senden. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                       |
| `"partial"`       | Eine normale Textnachricht an Ort und Stelle bearbeiten, während das Modell den aktuellen Block schreibt. Standard-Matrix-Clients benachrichtigen möglicherweise bei der ersten Vorschau, nicht bei der finalen Bearbeitung. |
| `"quiet"`         | Wie `"partial"`, aber die Nachricht ist ein nicht benachrichtigender Hinweis. Empfänger erhalten erst eine Benachrichtigung, wenn eine benutzerspezifische Push-Regel zur finalisierten Bearbeitung passt (siehe unten). |

`blockStreaming` ist unabhängig von `streaming`:

| `streaming`             | `blockStreaming: true`                                               | `blockStreaming: false` (Standard)                    |
| ----------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block, abgeschlossene Blöcke bleiben als Nachrichten erhalten | Live-Entwurf für den aktuellen Block, an Ort und Stelle finalisiert |
| `"off"`                 | Eine benachrichtigende Matrix-Nachricht pro abgeschlossenem Block     | Eine benachrichtigende Matrix-Nachricht für die vollständige Antwort |

Hinweise:

- Wenn eine Vorschau das Pro-Ereignis-Größenlimit von Matrix überschreitet, stoppt OpenClaw das Vorschau-Streaming und fällt auf reine Finalzustellung zurück.
- Medienantworten senden Anhänge immer normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie, bevor die finale Medienantwort gesendet wird.
- Vorschauaktualisierungen für Tool-Fortschritt sind standardmäßig aktiviert, wenn Matrix-Vorschau-Streaming aktiv ist. Setzen Sie `streaming.preview.toolProgress: false`, um Vorschau-Bearbeitungen für Antworttext beizubehalten, Tool-Fortschritt aber auf dem normalen Zustellpfad zu belassen.
- Vorschau-Bearbeitungen kosten zusätzliche Matrix-API-Aufrufe. Belassen Sie `streaming: "off"`, wenn Sie das konservativste Ratenlimit-Profil wünschen.

## Genehmigungsmetadaten

Native Matrix-Genehmigungsaufforderungen sind normale `m.room.message`-Ereignisse mit OpenClaw-spezifischem benutzerdefiniertem Ereignisinhalt unter `com.openclaw.approval`. Matrix erlaubt benutzerdefinierte Ereignisinhalts-Schlüssel, sodass Standard-Clients weiterhin den Textkörper rendern, während OpenClaw-bewusste Clients die strukturierte Genehmigungs-ID, Art, Zustand, verfügbaren Entscheidungen sowie Ausführungs-/Plugin-Details lesen können.

Wenn eine Genehmigungsaufforderung für ein Matrix-Ereignis zu lang ist, teilt OpenClaw den sichtbaren Text in Teile auf und hängt `com.openclaw.approval` nur an den ersten Teil an. Reaktionen für Zulassen-/Ablehnen-Entscheidungen werden an dieses erste Ereignis gebunden, sodass lange Aufforderungen dasselbe Genehmigungsziel wie Einzelereignis-Aufforderungen behalten.

### Selbst gehostete Push-Regeln für stille finalisierte Vorschauen

`streaming: "quiet"` benachrichtigt Empfänger erst, wenn ein Block oder Turn finalisiert ist - eine benutzerspezifische Push-Regel muss zur Markierung der finalisierten Vorschau passen. Das vollständige Rezept (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver) finden Sie unter [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie Matrix-Datenverkehr zwischen Agenten ausdrücklich wünschen:

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

- `allowBots: true` akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten in erlaubten Räumen und Direktnachrichten.
- `allowBots: "mentions"` akzeptiert diese Nachrichten nur, wenn sie diesen Bot in Räumen sichtbar erwähnen. Direktnachrichten sind weiterhin erlaubt.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwortschleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von einem Bot verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw Gateway gesendet“.

Verwenden Sie strenge Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Datenverkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, damit Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich - das Plugin erkennt den E2EE-Status automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnose), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Setups mit mehreren Konten). Die Ausgabe ist standardmäßig knapp, mit zurückhaltender interner SDK-Protokollierung. Die folgenden Beispiele zeigen die kanonische Form; fügen Sie die Flags nach Bedarf hinzu.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
```

Initialisiert geheimen Speicher und Quersignierung, erstellt bei Bedarf ein Raumschlüssel-Backup und gibt anschließend Status und nächste Schritte aus. Nützliche Flags:

- `--recovery-key <key>` wendet vor der Initialisierung einen Wiederherstellungsschlüssel an (bevorzugen Sie die unten dokumentierte stdin-Form)
- `--force-reset-cross-signing` verwirft die aktuelle Quersignierungsidentität und erstellt eine neue (nur bewusst verwenden)

Aktivieren Sie E2EE bei einem neuen Konto bei der Erstellung:

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

### Status und Vertrauenssignale

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` meldet drei unabhängige Vertrauenssignale (`--verbose` zeigt alle an):

- `Locally trusted`: nur von diesem Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: das SDK meldet die Verifizierung per Quersignierung
- `Signed by owner`: mit Ihrem eigenen Selbstsignaturschlüssel signiert (nur Diagnose)

`Verified by owner` wird nur dann zu `yes`, wenn `Cross-signing verified` `yes` ist. Lokales Vertrauen oder eine Owner-Signatur allein reicht nicht aus.

`--allow-degraded-local-state` gibt Best-Effort-Diagnosen zurück, ohne das Matrix-Konto zuerst vorzubereiten; nützlich für Offline- oder teilweise konfigurierte Prüfungen.

### Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren

Der Wiederherstellungsschlüssel ist sensibel - leiten Sie ihn per stdin weiter, statt ihn in der Befehlszeile zu übergeben. Setzen Sie `MATRIX_RECOVERY_KEY` (oder `MATRIX_<ID>_RECOVERY_KEY` für ein benanntes Konto):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für geheimen Speicher oder Gerätevertrauen akzeptiert.
- `Backup usable`: Das Raumschlüssel-Backup kann mit dem vertrauenswürdigen Wiederherstellungsmaterial geladen werden.
- `Device verified by owner`: Für dieses Gerät besteht vollständiges Vertrauen in die Matrix-Quersignierungsidentität.

Der Befehl endet mit einem Nicht-Null-Exit-Code, wenn das vollständige Identitätsvertrauen unvollständig ist, selbst wenn der Wiederherstellungsschlüssel Backup-Material entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung in einem anderen Matrix-Client ab:

```bash
openclaw matrix verify self
```

`verify self` wartet auf `Cross-signing verified: yes`, bevor es erfolgreich beendet wird. Verwenden Sie `--timeout-ms <ms>`, um die Wartezeit anzupassen.

Die Form mit wörtlichem Schlüssel `openclaw matrix verify device "<recovery-key>"` wird ebenfalls akzeptiert, aber der Schlüssel landet in Ihrer Shell-Historie.

### Quersignierung initialisieren oder reparieren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Konten. Der Reihe nach:

- initialisiert geheimen Speicher und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel erneut
- initialisiert Quersignierung und lädt fehlende öffentliche Schlüssel hoch
- markiert und signiert das aktuelle Gerät per Quersignierung
- erstellt ein serverseitiges Raumschlüssel-Backup, falls noch keines vorhanden ist

Wenn der Homeserver UIA für das Hochladen von Quersignierungsschlüsseln verlangt, versucht OpenClaw zuerst keine Authentifizierung, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (kombinieren Sie dies mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) oder `--recovery-key <key>`
- `--force-reset-cross-signing` zum Verwerfen der aktuellen Quersignierungsidentität (nur bewusst)

### Raumschlüssel-Backup

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt, ob ein serverseitiges Backup existiert und ob dieses Gerät es entschlüsseln kann. `backup restore` importiert gesicherte Raumschlüssel in den lokalen Kryptospeicher; wenn der Wiederherstellungsschlüssel bereits auf der Festplatte liegt, können Sie `--recovery-key-stdin` weglassen.

Um ein defektes Backup durch eine frische Baseline zu ersetzen (akzeptiert den Verlust nicht wiederherstellbarer alter Historie; kann außerdem geheimen Speicher neu erstellen, wenn das aktuelle Backup-Geheimnis nicht ladbar ist):

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

Sendet eine Verifizierungsanfrage von diesem OpenClaw-Konto. `--own-user` fordert eine Selbstverifizierung an (Sie akzeptieren die Aufforderung in einem anderen Matrix-Client desselben Benutzers); `--user-id`/`--device-id`/`--room-id` zielen auf eine andere Person. `--own-user` kann nicht mit den anderen Ziel-Flags kombiniert werden.

Für Lifecycle-Handling auf niedrigerer Ebene - typischerweise während eingehende Anfragen aus einem anderen Client mitverfolgt werden - wirken diese Befehle auf eine bestimmte Anfrage `<id>` (ausgegeben von `verify list` und `verify request`):

| Befehl                                    | Zweck                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Eine eingehende Anfrage akzeptieren                                           |
| `openclaw matrix verify start <id>`        | Den SAS-Flow starten                                                  |
| `openclaw matrix verify sas <id>`          | SAS-Emoji oder Dezimalzahlen ausgeben                                     |
| `openclaw matrix verify confirm-sas <id>`  | Bestätigen, dass SAS mit der Anzeige des anderen Clients übereinstimmt            |
| `openclaw matrix verify mismatch-sas <id>` | SAS ablehnen, wenn Emoji oder Dezimalzahlen nicht übereinstimmen              |
| `openclaw matrix verify cancel <id>`       | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als DM-Follow-up-Hinweise, wenn die Verifizierung an einen bestimmten Direktnachrichtenraum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Wenn Sie mehrere benannte Konten haben und `channels.matrix.defaultAccount` nicht gesetzt haben, verweigern sie eine Vermutung und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startverhalten">
    Bei `encryption: true` ist der Standardwert von `startupVerification` `"if-unverified"`. Beim Start fordert ein unverifiziertes Gerät die Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Wartefrist an (standardmäßig 24 Stunden). Passen Sie dies mit `startupVerificationCooldownHours` an oder deaktivieren Sie es mit `startupVerification: "off"`.

    Beim Start läuft außerdem ein konservativer Krypto-Initialisierungsdurchlauf, der den aktuellen geheimen Speicher und die aktuelle Quersignierungsidentität wiederverwendet. Wenn der Bootstrap-Status defekt ist, versucht OpenClaw eine abgesicherte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA erfordert, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Owner signierte Geräte bleiben erhalten.

    Siehe [Matrix-Migration](/de/channels/matrix-migration) für den vollständigen Upgrade-Ablauf.

  </Accordion>

  <Accordion title="Verifizierungsbenachrichtigungen">
    Matrix postet Hinweise zum Verifizierungs-Lifecycle als `m.notice`-Nachrichten in den strikten DM-Verifizierungsraum: Anfrage, Bereitschaft (mit Anleitung „Per Emoji verifizieren“), Start/Abschluss sowie SAS-Details (Emoji/Dezimalzahlen), sofern verfügbar.

    Eingehende Anfragen aus einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Bei der Selbstverifizierung startet OpenClaw den SAS-Flow automatisch und bestätigt seine eigene Seite, sobald die Emoji-Verifizierung verfügbar ist - Sie müssen weiterhin in Ihrem Matrix-Client vergleichen und „Sie stimmen überein“ bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Gelöschtes oder ungültiges Matrix-Gerät">
    Wenn `verify status` meldet, dass das aktuelle Gerät auf dem Homeserver nicht mehr aufgeführt ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für Passwortanmeldung:

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

  <Accordion title="Gerätehygiene">
    Alte von OpenClaw verwaltete Geräte können sich ansammeln. Auflisten und bereinigen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kryptospeicher">
    Matrix-E2EE verwendet den offiziellen Rust-Kryptopfad des `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Der Krypto-Zustand wird in `crypto-idb-snapshot.json` persistiert (restriktive Dateiberechtigungen).

    Der verschlüsselte Laufzeitzustand liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Sync Store, Kryptospeicher, Wiederherstellungsschlüssel, IDB-Snapshot, Thread-Bindings und den Startverifizierungsstatus. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw den besten vorhandenen Root wieder, damit der vorherige Zustand sichtbar bleibt.

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

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sendevorgänge des Message-Tools. Zwei unabhängige Stellschrauben steuern das Verhalten:

### Sitzungsrouting (`sessionScope`)

`dm.sessionScope` legt fest, wie Matrix-DM-Räume OpenClaw-Sitzungen zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Peer teilen sich eine Sitzung.
- `"per-room"`: Jeder Matrix-DM-Raum erhält seinen eigenen Sitzungsschlüssel, auch wenn der Peer derselbe ist.

Explizite Gesprächsbindungen haben immer Vorrang vor `sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung behalten.

### Antwort-Threading (`threadReplies`)

`threadReplies` entscheidet, wo der Bot seine Antwort postet:

- `"off"`: Antworten sind auf oberster Ebene. Eingehende Thread-Nachrichten bleiben in der übergeordneten Sitzung.
- `"inbound"`: Innerhalb eines Threads nur antworten, wenn die eingehende Nachricht bereits in diesem Thread war.
- `"always"`: In einem Thread antworten, dessen Root die auslösende Nachricht ist; diese Unterhaltung wird ab dem ersten Auslöser über eine passende Thread-spezifische Sitzung geroutet.

`dm.threadReplies` überschreibt dies nur für DMs - zum Beispiel, um Raum-Threads isoliert zu halten, während DMs flach bleiben.

### Thread-Vererbung und Slash-Befehle

- Eingehende Thread-Nachrichten enthalten die Thread-Stammnachricht als zusätzlichen Agentenkontext.
- Über das Nachrichtentool gesendete Nachrichten übernehmen automatisch den aktuellen Matrix-Thread, wenn sie auf denselben Raum (oder dasselbe DM-Benutzerziel) abzielen, sofern keine explizite `threadId` angegeben ist.
- Die Wiederverwendung von DM-Benutzerzielen greift nur, wenn die aktuellen Sitzungsmetadaten denselben DM-Peer im selben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren alle in Matrix-Räumen und DMs.
- `/focus` auf oberster Ebene erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSessions` aktiviert ist.
- Wenn `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads ausgeführt wird, wird dieser Thread an Ort und Stelle gebunden.

Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsam genutzten Sitzung kollidiert, postet es in diesem Raum einmalig eine `m.notice`, die auf den `/focus`-Ausweg verweist und eine Änderung von `dm.sessionScope` vorschlägt. Der Hinweis erscheint nur, wenn Thread-Bindungen aktiviert sind.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` in der Matrix-DM, dem Raum oder dem bestehenden Thread aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geleitet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnSessions` steuert `/acp spawn --thread auto|here`, wobei OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Thread-Bindungskonfiguration

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-Thread-gebundene Sitzungserzeugungen sind standardmäßig aktiviert:

- Setzen Sie `threadBindings.spawnSessions: false`, um zu verhindern, dass `/focus` auf oberster Ebene und `/acp spawn --thread auto|here` Matrix-Threads erstellen oder binden.
- Setzen Sie `threadBindings.defaultSpawnContext: "isolated"`, wenn native Subagent-Thread-Erzeugungen das übergeordnete Transkript nicht forken sollen.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, Benachrichtigungen über eingehende Reaktionen und Bestätigungsreaktionen.

Werkzeuge für ausgehende Reaktionen werden durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion vom Bot.

**Auflösungsreihenfolge** (der erste definierte Wert gewinnt):

| Einstellung             | Reihenfolge                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | pro Konto → Kanal → `messages.ackReaction` → Fallback auf Agentenidentitäts-Emoji |
| `ackReactionScope`      | pro Konto → Kanal → `messages.ackReactionScope` → Standard `"group-mentions"`    |
| `reactionNotifications` | pro Konto → Kanal → Standard `"own"`                                             |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf von Bots verfasste Matrix-Nachrichten zielen; `"off"` deaktiviert Reaktionssystemereignisse. Das Entfernen von Reaktionen wird nicht zu Systemereignissen synthetisiert, weil Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Der Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Matrix-Raumverlauf ist nur ausstehend: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Schnappschuss dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle Auslösernachricht ist nicht in `InboundHistory` enthalten; sie bleibt für diesen Durchlauf im Hauptteil der eingehenden Nachricht.
- Wiederholungen desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufsschnappschuss wieder, statt auf neuere Raumnachrichten vorzurücken.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Stämme und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext bleibt wie empfangen erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber weiterhin eine explizit zitierte Antwort bei.

Diese Einstellung beeinflusst die Sichtbarkeit von ergänzendem Kontext, nicht, ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Auslöserautorisierung kommt weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Um DMs vollständig stummzuschalten und Räume weiterhin funktionieren zu lassen, setzen Sie `dm.enabled: false`:

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

Kopplungsbeispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Kopplungscode wieder und kann nach einer kurzen Abkühlzeit eine Erinnerungsantwort senden, statt einen neuen Code auszustellen.

Siehe [Kopplung](/de/channels/pairing) für den gemeinsamen DM-Kopplungsablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Direktnachrichtenstatus asynchron wird, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Einzelräume statt auf die aktive DM zeigen. Prüfen Sie die aktuelle Zuordnung für einen Peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide Befehle akzeptieren `--account <id>` für Mehrkontoeinrichtungen. Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt auf eine beliebige aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen frischen direkten Raum und schreibt `m.direct` neu, wenn keine fehlerfreie DM vorhanden ist

Er löscht alte Räume nicht automatisch. Er wählt die fehlerfreie DM aus und aktualisiert die Zuordnung, damit zukünftige Matrix-Sendungen, Verifizierungshinweise und andere Direktnachrichtenabläufe auf den richtigen Raum zielen.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungsclient dienen. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder `channels.matrix.accounts.<account>.execApprovals` für eine kontobezogene Überschreibung):

- `enabled`: Genehmigungen über Matrix-native Eingabeaufforderungen zustellen. Wenn nicht gesetzt oder `"auto"`, aktiviert Matrix dies automatisch, sobald mindestens ein Genehmiger aufgelöst werden kann. Setzen Sie `false`, um dies explizit zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Exec-Anforderungen genehmigen dürfen. Optional - fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: wohin Eingabeaufforderungen gesendet werden. `"dm"` (Standard) sendet an Genehmiger-DMs; `"channel"` sendet an den auslösenden Matrix-Raum oder die auslösende DM; `"both"` sendet an beide.
- `agentFilter` / `sessionFilter`: optionale Allowlists dafür, welche Agenten/Sitzungen eine Matrix-Zustellung auslösen.

Die Autorisierung unterscheidet sich leicht je nach Genehmigungsart:

- **Exec-Genehmigungen** verwenden `execApprovals.approvers` und fallen auf `dm.allowFrom` zurück.
- **Plugin-Genehmigungen** autorisieren nur über `dm.allowFrom`.

Beide Arten teilen sich Matrix-Reaktionskürzel und Nachrichtenaktualisierungen. Genehmiger sehen Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` einmal erlauben
- `❌` ablehnen
- `♾️` immer erlauben (wenn die effektive Exec-Richtlinie dies erlaubt)

Fallback-Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste Genehmiger können genehmigen oder ablehnen. Die Kanalzustellung für Exec-Genehmigungen enthält den Befehlstext - aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandt: [Exec-Genehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in DMs. In Räumen erkennt OpenClaw auch Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad ohne einen benutzerdefinierten Erwähnungsregex auslöst. Dadurch bleibt der Bot für raumtypische `@mention /command`-Beiträge ansprechbar, die Element und ähnliche Clients ausgeben, wenn ein Benutzer den Bot per Tab vervollständigt, bevor er den Befehl eingibt.

Autorisierungsregeln gelten weiterhin: Befehlssender müssen dieselben DM- oder Raum-Allowlist-/Besitzerrichtlinien erfüllen wie normale Nachrichten.

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

- Werte der obersten Ebene `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
- Begrenzen Sie einen geerbten Raumeintrag mit `groups.<room>.account` auf ein bestimmtes Konto. Einträge ohne `account` werden kontoübergreifend geteilt; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf oberster Ebene konfiguriert ist.

**Auswahl des Standardkontos:**

- Setzen Sie `defaultAccount`, um das benannte Konto auszuwählen, das implizites Routing, Sondierung und CLI-Befehle bevorzugen.
- Wenn Sie mehrere Konten haben und eines davon wörtlich `default` heißt, verwendet OpenClaw es implizit, auch wenn `defaultAccount` nicht gesetzt ist.
- Wenn Sie mehrere benannte Konten haben und kein Standard ausgewählt ist, weigern sich CLI-Befehle zu raten - setzen Sie `defaultAccount` oder übergeben Sie `--account <id>`.
- Der Block `channels.matrix.*` auf oberster Ebene wird nur dann als implizites Konto `default` behandelt, wenn seine Authentifizierung vollständig ist (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben über `homeserver` + `userId` auffindbar, sobald zwischengespeicherte Anmeldedaten die Authentifizierung abdecken.

**Hochstufung:**

- Wenn OpenClaw eine Einzelkontokonfiguration während der Reparatur oder Einrichtung zu einer Mehrkontokonfiguration hochstuft, behält es das vorhandene benannte Konto bei, falls eines existiert oder `defaultAccount` bereits auf eines zeigt. Nur Matrix-Authentifizierungs-/Bootstrap-Schlüssel werden in das hochgestufte Konto verschoben; gemeinsame Zustellungsrichtlinienschlüssel bleiben auf oberster Ebene.

Siehe [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Mehrkontomuster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum SSRF-Schutz, sofern Sie dies nicht
explizit pro Konto erlauben.

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

Diese Opt-in-Einstellung erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche Klartext-Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Verwenden Sie nach Möglichkeit `https://`.

## Matrix-Datenverkehr per Proxy weiterleiten

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

Benannte Konten können die Standardeinstellung auf oberster Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Datenverkehr zur Laufzeit und Kontostatusprüfungen.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Matrix-Raum-IDs beachten Groß- und Kleinschreibung. Verwenden Sie die exakte Schreibweise der Raum-ID aus Matrix,
wenn Sie explizite Zustellziele, Cron-Jobs, Bindings oder Allowlists konfigurieren.
OpenClaw hält interne Sitzungsschlüssel für die Speicherung kanonisch, daher sind diese kleingeschriebenen
Schlüssel keine verlässliche Quelle für Matrix-Zustell-IDs.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt. Die Namenssuche in beigetretenen Räumen erfolgt nach bestem Aufwand und gilt nur für Raum-Allowlists zur Laufzeit, wenn `dangerouslyAllowNameMatching: true` gesetzt ist.
- Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er bei der Auflösung der Allowlist zur Laufzeit ignoriert.

## Konfigurationsreferenz

Allowlist-artige Benutzerfelder (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs (am sichersten). Benutzereinträge, die keine IDs sind, werden standardmäßig ignoriert. Wenn Sie `dangerouslyAllowNameMatching: true` setzen, werden exakte Matrix-Verzeichnis-Anzeigenamen beim Start und immer dann aufgelöst, wenn sich die Allowlist ändert, während der Monitor läuft; Einträge, die nicht aufgelöst werden können, werden zur Laufzeit ignoriert.

Raum-Allowlist-Schlüssel (`groups`, veraltet `rooms`) sollten Raum-IDs oder Aliasse sein. Einfache Raumnamen-Schlüssel werden standardmäßig ignoriert; `dangerouslyAllowNameMatching: true` stellt die Suche nach beigetretenen Raumnamen nach bestem Aufwand wieder her.

### Konto und Verbindung

- `enabled`: Aktiviert oder deaktiviert den Kanal.
- `name`: Optionale Anzeigebezeichnung für das Konto.
- `defaultAccount`: Bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: Benannte Überschreibungen pro Konto. Werte auf oberster Ebene unter `channels.matrix` werden als Standardwerte geerbt.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: Erlaubt diesem Konto, eine Verbindung zu `localhost`, LAN-/Tailscale-IPs oder internen Hostnamen herzustellen.
- `proxy`: Optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Überschreibung pro Konto wird unterstützt.
- `userId`: Vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartext- und SecretRef-Werte werden über env/file/exec-Provider hinweg unterstützt ([Secrets Management](/de/gateway/secrets)).
- `password`: Passwort für passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: Explizite Matrix-Geräte-ID.
- `deviceName`: Geräteanzeigename, der bei der Passwortanmeldung verwendet wird.
- `avatarUrl`: Gespeicherte Selbst-Avatar-URL für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: Maximale Anzahl von Ereignissen, die während der Startsynchronisierung abgerufen werden.

### Verschlüsselung

- `encryption`: E2EE aktivieren. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard, wenn E2EE aktiviert ist) oder `"off"`. Fordert beim Start automatisch Selbstverifizierung an, wenn dieses Gerät nicht verifiziert ist.
- `startupVerificationCooldownHours`: Abkühlzeit bis zur nächsten automatischen Startanforderung. Standard: `24`.

### Zugriff und Richtlinie

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumdatenverkehr.
- `dm.enabled`: Wenn `false`, alle DMs ignorieren. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Gilt, nachdem der Bot beigetreten ist und den Raum als DM klassifiziert hat; dies beeinflusst die Einladungsbehandlung nicht.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Datenverkehr.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: DM-spezifische Überschreibung für Antwort-Threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: Nachrichten von anderen konfigurierten Matrix-Bot-Konten akzeptieren (`true` oder `"mentions"`).
- `allowlistOnly`: Wenn `true`, werden alle aktiven DM-Richtlinien (außer `"disabled"`) und `"open"`-Gruppenrichtlinien auf `"allowlist"` erzwungen. `"disabled"`-Richtlinien werden nicht geändert.
- `dangerouslyAllowNameMatching`: Wenn `true`, erlaubt Matrix-Anzeigenamen-Verzeichnissuche für Benutzer-Allowlist-Einträge und Namenssuche in beigetretenen Räumen für Raum-Allowlist-Schlüssel. Bevorzugen Sie vollständige `@user:server`-IDs und Raum-IDs oder Aliasse.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` auf `"allowlist"` gesetzt ist. Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den Zustand, den der einladende Raum angibt.
- `contextVisibility`: Ergänzende Kontextsichtbarkeit (`"all"` Standard, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"`, `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` oder `"always"`.
- `threadBindings`: Kanalbezogene Überschreibungen für sitzungsgebundenes Routing und Lebenszyklus von Threads.
- `streaming`: `"off"` (Standard), `"partial"`, `"quiet"` oder Objektform `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: Wenn `true`, werden abgeschlossene Assistentenblöcke als separate Fortschrittsnachrichten beibehalten.
- `markdown`: Optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: Optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: Ausgehende Chunk-Größe in Zeichen, wenn `chunkMode: "length"`. Standard: `4000`.
- `chunkMode`: `"length"` (Standard, teilt nach Zeichenzahl) oder `"newline"` (teilt an Zeilengrenzen).
- `historyLimit`: Anzahl der letzten Raumnachrichten, die als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standard `0` (deaktiviert).
- `mediaMaxMb`: Mediengrößenobergrenze in MB für ausgehendes Senden und eingehende Verarbeitung.

### Reaktionseinstellungen

- `ackReaction`: Ack-Reaktionsüberschreibung für diesen Kanal/dieses Konto.
- `ackReactionScope`: Bereichsüberschreibung (`"group-mentions"` Standard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (`"own"` Standard, `"off"`).

### Tooling und Überschreibungen pro Raum

- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: Richtlinienzuordnung pro Raum. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein veralteter Alias.)
  - `groups.<room>.account`: Einen geerbten Raumeintrag auf ein bestimmtes Konto beschränken.
  - `groups.<room>.allowBots`: Überschreibung der kanalspezifischen Einstellung pro Raum (`true` oder `"mentions"`).
  - `groups.<room>.users`: Absender-Allowlist pro Raum.
  - `groups.<room>.tools`: Tool-Allow-/Deny-Überschreibungen pro Raum.
  - `groups.<room>.autoReply`: Überschreibung des Mention-Gatings pro Raum. `true` deaktiviert Mention-Anforderungen für diesen Raum; `false` erzwingt sie wieder.
  - `groups.<room>.skills`: Skill-Filter pro Raum.
  - `groups.<room>.systemPrompt`: System-Prompt-Ausschnitt pro Raum.

### Exec-Genehmigungseinstellungen

- `execApprovals.enabled`: Exec-Genehmigungen über Matrix-native Prompts zustellen.
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die genehmigen dürfen. Fällt auf `dm.allowFrom` zurück.
- `execApprovals.target`: `"dm"` (Standard), `"channel"` oder `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: Optionale Agent-/Sitzungs-Allowlists für die Zustellung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) - DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) - Gruppenchatverhalten und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung

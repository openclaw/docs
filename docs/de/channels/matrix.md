---
read_when:
    - OpenClaw in Matrix einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Matrix-Unterstützungsstatus, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-07-01T12:56:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein herunterladbares Channel-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Installation

Installieren Sie Matrix aus ClawHub, bevor Sie den Channel konfigurieren:

```bash
openclaw plugins install @openclaw/matrix
```

Bloße Plugin-Spezifikationen versuchen zuerst ClawHub und danach den npm-Fallback. Um die Registry-Quelle zu erzwingen, verwenden Sie `openclaw plugins install clawhub:@openclaw/matrix` oder `openclaw plugins install npm:@openclaw/matrix`.

Aus einem lokalen Checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registriert und aktiviert das Plugin, daher ist kein separater Schritt `openclaw plugins enable matrix` erforderlich. Das Plugin tut dennoch nichts, bis Sie den untenstehenden Channel konfigurieren. Allgemeines Plugin-Verhalten und Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Einrichtung

1. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
2. Konfigurieren Sie `channels.matrix` entweder mit `homeserver` + `accessToken` oder mit `homeserver` + `userId` + `password`.
3. Starten Sie den Gateway neu.
4. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein (siehe [automatischer Beitritt](#auto-join) - neue Einladungen werden nur angenommen, wenn `autoJoin` sie zulässt).

### Interaktive Einrichtung

```bash
openclaw channels add
openclaw configure --section channels
```

Der Assistent fragt nach: Homeserver-URL, Authentifizierungsmethode (Zugriffstoken oder Passwort), Benutzer-ID (nur Passwortauthentifizierung), optionalem Gerätenamen, ob E2EE aktiviert werden soll und ob Raumzugriff und automatischer Beitritt konfiguriert werden sollen.

Wenn passende `MATRIX_*`-Umgebungsvariablen bereits vorhanden sind und für das ausgewählte Konto keine gespeicherte Authentifizierung existiert, bietet der Assistent eine Umgebungsvariablen-Abkürzung an. Um Raumnamen vor dem Speichern einer Allowlist aufzulösen, führen Sie `openclaw channels resolve --channel matrix "Project Room"` aus. Wenn E2EE aktiviert ist, schreibt der Assistent die Konfiguration und führt denselben Bootstrap wie [`openclaw matrix encryption setup`](#encryption-and-verification) aus.

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

`channels.matrix.autoJoin` ist standardmäßig `off`. Mit der Standardeinstellung erscheint der Bot in neuen Räumen oder DMs aus neuen Einladungen erst, wenn Sie manuell beitreten.

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

### Allowlist-Zielformate

DM- und Raum-Allowlists sollten idealerweise mit stabilen IDs befüllt werden:

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden standardmäßig ignoriert, weil sie veränderlich sind; setzen Sie `dangerouslyAllowNameMatching: true` nur, wenn Sie ausdrücklich Kompatibilität mit Anzeigenamen-Einträgen benötigen.
- Raum-Allowlist-Schlüssel (`groups`, veraltet `rooms`): Verwenden Sie `!room:server` oder `#alias:server`. Einfache Raumnamen werden standardmäßig ignoriert; setzen Sie `dangerouslyAllowNameMatching: true` nur, wenn Sie ausdrücklich Kompatibilität mit der Namenssuche in beigetretenen Räumen benötigen.
- Einladungs-Allowlists (`autoJoinAllowlist`): Verwenden Sie `!room:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.

### Normalisierung der Konto-ID

Der Assistent wandelt einen benutzerfreundlichen Namen in eine normalisierte Konto-ID um. Beispielsweise wird aus `Ops Bot` `ops-bot`. Interpunktion wird in bereichsbezogenen Umgebungsvariablennamen maskiert, sodass zwei Konten nicht kollidieren können: `-` → `_X2D_`, also wird `ops-prod` `MATRIX_OPS_X2D_PROD_*` zugeordnet.

### Zwischengespeicherte Anmeldedaten

Matrix speichert zwischengespeicherte Anmeldedaten unter `~/.openclaw/credentials/matrix/`:

- Standardkonto: `credentials.json`
- Benannte Konten: `credentials-<account>.json`

Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, behandelt OpenClaw Matrix als konfiguriert, selbst wenn das Zugriffstoken nicht in der Konfigurationsdatei steht - das deckt Einrichtung, `openclaw doctor` und Channel-Statusprüfungen ab.

### Umgebungsvariablen

Werden verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; benannte Konten verwenden die Konto-ID vor dem Suffix.

| Standardkonto       | Benanntes Konto (`<ID>` ist die normalisierte Konto-ID) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Für das Konto `ops` werden die Namen zu `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` und so weiter. Die Umgebungsvariablen für den Wiederherstellungsschlüssel werden von wiederherstellungsfähigen CLI-Abläufen (`verify backup restore`, `verify device`, `verify bootstrap`) gelesen, wenn Sie den Schlüssel über `--recovery-key-stdin` einspeisen.

`MATRIX_HOMESERVER` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Konfigurationsbeispiel

Eine praktische Basis mit DM-Kopplung, Raum-Allowlist und E2EE:

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

Matrix-Antwort-Streaming ist Opt-in. `streaming` steuert, wie OpenClaw die laufende Assistentenantwort zustellt; `blockStreaming` steuert, ob jeder abgeschlossene Block als eigene Matrix-Nachricht erhalten bleibt.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Um Live-Antwortvorschauen beizubehalten, aber zwischenzeitliche Werkzeug-/Fortschrittszeilen auszublenden, verwenden Sie die Objektform:

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

Die vollständige Objektform akzeptiert `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: eine benutzerdefinierte Beschriftung, `"auto"` oder nicht gesetzt, um aus konfigurierten oder integrierten Beschriftungen zu wählen, oder `false`, um die Beschriftungszeile auszublenden.
- `progress.labels`: Kandidatenbeschriftungen, die nur verwendet werden, wenn `label` `"auto"` ist oder nicht gesetzt ist. Für integrierte Standardwerte nicht setzen.
- `progress.maxLines`: maximale Anzahl rollender Fortschrittszeilen, die im Entwurf behalten werden. Nach diesem Limit werden ältere Zeilen gekürzt.
- `progress.maxLineChars`: maximale Zeichenanzahl pro kompakter Fortschrittszeile vor dem Kürzen.
- `progress.toolProgress`: wenn `true` (Standard), erscheint Live-Werkzeug-/Fortschrittsaktivität im Entwurf.

| `streaming`       | Verhalten                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (Standard) | Auf die vollständige Antwort warten, einmal senden. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Eine normale Textnachricht direkt bearbeiten, während das Modell den aktuellen Block schreibt. Standard-Matrix-Clients können bei der ersten Vorschau benachrichtigen, nicht bei der finalen Bearbeitung.              |
| `"quiet"`         | Wie `"partial"`, aber die Nachricht ist ein nicht benachrichtigender Hinweis. Empfänger erhalten erst eine Benachrichtigung, wenn eine benutzerspezifische Push-Regel zur finalisierten Bearbeitung passt (siehe unten). |
| `"progress"`      | Sendet einzelne kompakte Fortschrittszeilen über einen Fortschrittsentwurf.                                                                                                     |

`blockStreaming` ist unabhängig von `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (Standard)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block, abgeschlossene Blöcke bleiben als Nachrichten erhalten | Live-Entwurf für den aktuellen Block, finalisiert an Ort und Stelle |
| `"off"`                 | Eine benachrichtigende Matrix-Nachricht pro abgeschlossenem Block                     | Eine benachrichtigende Matrix-Nachricht für die vollständige Antwort      |

Hinweise:

- Wenn eine Vorschau über Matrix' Größenlimit pro Event hinauswächst, beendet OpenClaw das Vorschau-Streaming und fällt auf reine Endzustellung zurück.
- Medienantworten senden Anhänge immer normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, schwärzt OpenClaw sie, bevor die finale Medienantwort gesendet wird.
- Vorschauaktualisierungen für Werkzeugfortschritt sind standardmäßig aktiviert, wenn Matrix-Vorschau-Streaming aktiv ist. Setzen Sie `streaming.preview.toolProgress: false`, um Vorschau-Bearbeitungen für Antworttext beizubehalten, Werkzeugfortschritt aber auf dem normalen Zustellpfad zu belassen.
- Vorschau-Bearbeitungen kosten zusätzliche Matrix-API-Aufrufe. Belassen Sie `streaming: "off"`, wenn Sie das konservativste Rate-Limit-Profil möchten.

## Sprachnachrichten

Eingehende Matrix-Sprachnotizen werden vor dem Raum-Erwähnungs-Gate transkribiert. Dadurch kann eine Sprachnotiz, die den Bot-Namen sagt, den Agenten in einem Raum mit `requireMention: true` auslösen, und der Agent erhält das Transkript statt nur eines Platzhalters für einen Audioanhang.

Matrix verwendet den gemeinsamen Audio-Media-Provider, der unter `tools.media.audio` konfiguriert ist, etwa OpenAI `gpt-4o-mini-transcribe`. Informationen zur Provider-Einrichtung und zu Limits finden Sie in der [Übersicht zu Media-Tools](/de/tools/media-overview).

Verhaltensdetails:

- `m.audio`-Events und `m.file`-Events mit einem `audio/*`-MIME-Typ sind geeignet.
- In verschlüsselten Räumen entschlüsselt OpenClaw den Anhang vor der Transkription über den bestehenden Matrix-Medienpfad.
- Das Transkript wird im Agent-Prompt als maschinell erzeugt und nicht vertrauenswürdig markiert.
- Der Anhang wird als bereits transkribiert markiert, damit nachgelagerte Medien-Tools dieselbe Sprachnotiz nicht erneut transkribieren.
- Setzen Sie `tools.media.audio.enabled: false`, um Audiotranskription global zu deaktivieren.

## Genehmigungsmetadaten

Native Matrix-Genehmigungs-Prompts sind normale `m.room.message`-Events mit OpenClaw-spezifischem benutzerdefiniertem Event-Inhalt unter `com.openclaw.approval`. Matrix erlaubt benutzerdefinierte Event-Inhaltsschlüssel, sodass Standard-Clients weiterhin den Textkörper anzeigen, während OpenClaw-fähige Clients die strukturierte Genehmigungs-ID, Art, den Status, verfügbare Entscheidungen sowie Exec-/Plugin-Details lesen können.

Wenn ein Genehmigungs-Prompt zu lang für ein Matrix-Event ist, teilt OpenClaw den sichtbaren Text in Blöcke auf und hängt `com.openclaw.approval` nur an den ersten Block an. Reaktionen für Zulassen-/Ablehnen-Entscheidungen sind an dieses erste Event gebunden, sodass lange Prompts dasselbe Genehmigungsziel behalten wie Prompts mit einem einzelnen Event.

### Selbstgehostete Push-Regeln für stille finalisierte Vorschauen

`streaming: "quiet"` benachrichtigt Empfänger nur, sobald ein Block oder Turn finalisiert ist - eine benutzerbezogene Push-Regel muss den Marker der finalisierten Vorschau abgleichen. Siehe [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules) für das vollständige Rezept (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie Matrix-Verkehr zwischen Agenten bewusst zulassen möchten:

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
- `groups.<room>.allowBots` überschreibt die kontoweite Einstellung für einen Raum.
- Akzeptierte konfigurierte Bot-Nachrichten verwenden den gemeinsamen [Bot-Loop-Schutz](/de/channels/bot-loop-protection). Konfigurieren Sie `channels.defaults.botLoopProtection` und überschreiben Sie dann mit `channels.matrix.botLoopProtection` oder `channels.matrix.groups.<room>.botLoopProtection`, wenn ein Raum ein anderes Budget benötigt.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwort-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „bot-authored“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bild-Events `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich - das Plugin erkennt den E2EE-Status automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnose), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Setups mit mehreren Konten). Die Ausgabe ist standardmäßig knapp und verwendet leises internes SDK-Logging. Die folgenden Beispiele zeigen die kanonische Form; fügen Sie die Flags nach Bedarf hinzu.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
```

Initialisiert Secret Storage und Cross-Signing, erstellt bei Bedarf ein Room-Key-Backup und gibt anschließend Status und nächste Schritte aus. Nützliche Flags:

- `--recovery-key <key>` wendet vor dem Initialisieren einen Wiederherstellungsschlüssel an (bevorzugen Sie die unten dokumentierte stdin-Form)
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

### Status und Vertrauenssignale

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` meldet drei unabhängige Vertrauenssignale (`--verbose` zeigt alle an):

- `Locally trusted`: nur von diesem Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: Das SDK meldet Verifizierung über Cross-Signing
- `Signed by owner`: von Ihrem eigenen Self-Signing-Schlüssel signiert (nur Diagnose)

`Verified by owner` wird nur dann zu `yes`, wenn `Cross-signing verified` `yes` ist. Lokales Vertrauen oder eine Owner-Signatur allein reicht nicht aus.

`--allow-degraded-local-state` gibt Best-Effort-Diagnosen zurück, ohne zuerst das Matrix-Konto vorzubereiten; nützlich für Offline- oder teilweise konfigurierte Probes.

### Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren

Der Wiederherstellungsschlüssel ist sensibel - leiten Sie ihn per stdin weiter, statt ihn auf der Befehlszeile zu übergeben. Setzen Sie `MATRIX_RECOVERY_KEY` (oder `MATRIX_<ID>_RECOVERY_KEY` für ein benanntes Konto):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für Secret Storage oder Gerätevertrauen akzeptiert.
- `Backup usable`: Das Room-Key-Backup kann mit dem vertrauenswürdigen Wiederherstellungsmaterial geladen werden.
- `Device verified by owner`: Dieses Gerät hat vollständiges Vertrauen der Matrix-Cross-Signing-Identität.

Er beendet sich mit einem Nicht-Null-Code, wenn vollständiges Identitätsvertrauen unvollständig ist, selbst wenn der Wiederherstellungsschlüssel Backup-Material entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung von einem anderen Matrix-Client ab:

```bash
openclaw matrix verify self
```

`verify self` wartet auf `Cross-signing verified: yes`, bevor es erfolgreich beendet wird. Verwenden Sie `--timeout-ms <ms>`, um die Wartezeit anzupassen.

Die Literal-Key-Form `openclaw matrix verify device "<recovery-key>"` wird ebenfalls akzeptiert, aber der Schlüssel landet in Ihrer Shell-Historie.

### Cross-Signing initialisieren oder reparieren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` ist der Reparatur- und Setup-Befehl für verschlüsselte Konten. Der Reihe nach führt er Folgendes aus:

- initialisiert Secret Storage und verwendet nach Möglichkeit einen bestehenden Wiederherstellungsschlüssel wieder
- initialisiert Cross-Signing und lädt fehlende öffentliche Schlüssel hoch
- markiert und cross-signt das aktuelle Gerät
- erstellt ein serverseitiges Room-Key-Backup, falls noch keines existiert

Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln verlangt, versucht OpenClaw zuerst No-Auth, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (kombinieren mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) oder `--recovery-key <key>`
- `--force-reset-cross-signing`, um die aktuelle Cross-Signing-Identität zu verwerfen (nur bewusst; erfordert, dass der aktive Wiederherstellungsschlüssel gespeichert ist oder mit `--recovery-key-stdin` bereitgestellt wird)

### Room-Key-Backup

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt, ob ein serverseitiges Backup existiert und ob dieses Gerät es entschlüsseln kann. `backup restore` importiert gesicherte Room-Keys in den lokalen Crypto-Store; wenn der Wiederherstellungsschlüssel bereits auf der Festplatte liegt, können Sie `--recovery-key-stdin` weglassen.

So ersetzen Sie ein defektes Backup durch eine frische Baseline (akzeptiert den Verlust nicht wiederherstellbarer alter Historie; kann auch Secret Storage neu erstellen, wenn das aktuelle Backup-Secret nicht ladbar ist):

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

Sendet eine Verifizierungsanfrage von diesem OpenClaw-Konto. `--own-user` fordert eine Selbstverifizierung an (Sie akzeptieren den Prompt in einem anderen Matrix-Client desselben Benutzers); `--user-id`/`--device-id`/`--room-id` zielen auf eine andere Person. `--own-user` kann nicht mit den anderen Ziel-Flags kombiniert werden.

Für die Verarbeitung des Low-Level-Lebenszyklus - typischerweise beim Begleiten eingehender Anfragen von einem anderen Client - wirken diese Befehle auf eine bestimmte Anfrage `<id>` (ausgegeben von `verify list` und `verify request`):

| Befehl                                    | Zweck                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Eine eingehende Anfrage akzeptieren                                           |
| `openclaw matrix verify start <id>`        | Den SAS-Flow starten                                                  |
| `openclaw matrix verify sas <id>`          | SAS-Emoji oder Dezimalzahlen ausgeben                                     |
| `openclaw matrix verify confirm-sas <id>`  | Bestätigen, dass SAS mit dem übereinstimmt, was der andere Client anzeigt            |
| `openclaw matrix verify mismatch-sas <id>` | SAS ablehnen, wenn Emoji oder Dezimalzahlen nicht übereinstimmen              |
| `openclaw matrix verify cancel <id>`       | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als DM-Follow-up-Hinweise, wenn die Verifizierung an einen bestimmten Direktnachrichtenraum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Wenn Sie mehrere benannte Konten haben und `channels.matrix.defaultAccount` nicht gesetzt haben, verweigern sie das Raten und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Mit `encryption: true` ist der Standardwert von `startupVerification` `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät die Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abklingzeit an (standardmäßig 24 Stunden). Passen Sie dies mit `startupVerificationCooldownHours` an oder deaktivieren Sie es mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt, der den aktuellen Secret Storage und die Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Status defekt ist, versucht OpenClaw eine abgesicherte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA verlangt, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Owner signierte Geräte bleiben erhalten.

    Siehe [Matrix-Migration](/de/channels/matrix-migration) für den vollständigen Upgrade-Ablauf.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix postet Hinweise zum Verifizierungslebenszyklus als `m.notice`-Nachrichten in den strikten DM-Verifizierungsraum: Anfrage, bereit (mit Anleitung „Verify by emoji“), Start/Abschluss und SAS-Details (Emoji/Dezimal), sofern verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Für die Selbstverifizierung startet OpenClaw den SAS-Flow automatisch und bestätigt die eigene Seite, sobald Emoji-Verifizierung verfügbar ist - Sie müssen weiterhin „They match“ in Ihrem Matrix-Client vergleichen und bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Wenn `verify status` sagt, dass das aktuelle Gerät nicht mehr auf dem Homeserver aufgeführt ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für Passwort-Login:

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

    Ersetzen Sie `assistant` durch die Konto-ID aus dem fehlgeschlagenen Befehl, oder lassen Sie `--account` für das Standardkonto weg.

  </Accordion>

  <Accordion title="Gerätehygiene">
    Alte von OpenClaw verwaltete Geräte können sich ansammeln. Auflisten und bereinigen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto-Store">
    Matrix E2EE verwendet den offiziellen Rust-Kryptopfad von `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Der Kryptostatus wird in `crypto-idb-snapshot.json` gespeichert (restriktive Dateiberechtigungen).

    Verschlüsselter Laufzeitstatus liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Sync-Store, Crypto-Store, Wiederherstellungsschlüssel, IDB-Snapshot, Thread-Bindings und den Status der Startverifizierung. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw die beste vorhandene Root wieder, sodass der vorherige Status sichtbar bleibt.

    Eine einzelne ältere Token-Hash-Root kann ein normaler Kontinuitätspfad bei Token-Rotation sein. Wenn OpenClaw `matrix: multiple populated token-hash storage roots detected` protokolliert, prüfen Sie das Kontoverzeichnis und archivieren Sie veraltete gleichgeordnete Roots erst, nachdem Sie bestätigt haben, dass die ausgewählte aktive Root fehlerfrei ist. Verschieben Sie veraltete Roots vorzugsweise in ein `_archive/`-Verzeichnis, statt sie sofort zu löschen.

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

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für das Senden mit Message-Tools. Zwei unabhängige Stellschrauben steuern das Verhalten:

### Sitzungsrouting (`sessionScope`)

`dm.sessionScope` legt fest, wie Matrix-DM-Räume OpenClaw-Sitzungen zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Peer teilen sich eine Sitzung.
- `"per-room"`: Jeder Matrix-DM-Raum erhält seinen eigenen Sitzungsschlüssel, auch wenn der Peer derselbe ist.

Explizite Konversations-Bindings haben immer Vorrang vor `sessionScope`, sodass gebundene Räume und Threads ihre ausgewählte Zielsitzung behalten.

### Antwort-Threading (`threadReplies`)

`threadReplies` legt fest, wo der Bot seine Antwort postet:

- `"off"`: Antworten sind auf oberster Ebene. Eingehende Thread-Nachrichten bleiben in der übergeordneten Sitzung.
- `"inbound"`: Nur dann innerhalb eines Threads antworten, wenn die eingehende Nachricht bereits in diesem Thread war.
- `"always"`: Innerhalb eines Threads antworten, der an der auslösenden Nachricht verwurzelt ist; diese Konversation wird ab dem ersten Auslöser über eine passende threadbezogene Sitzung geroutet.

`dm.threadReplies` überschreibt dies nur für DMs - zum Beispiel, um Raum-Threads isoliert zu halten, während DMs flach bleiben.

### Thread-Vererbung und Slash-Befehle

- Eingehende Thread-Nachrichten enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Message-Tool-Sends erben automatisch den aktuellen Matrix-Thread, wenn sie denselben Raum (oder dasselbe DM-Benutzerziel) adressieren, sofern kein explizites `threadId` angegeben ist.
- Die Wiederverwendung des DM-Benutzerziels greift nur, wenn die Metadaten der aktuellen Sitzung denselben DM-Peer im selben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren alle in Matrix-Räumen und DMs.
- Ein `/focus` auf oberster Ebene erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSessions` aktiviert ist.
- Wenn `/focus` oder `/acp spawn --thread here` innerhalb eines vorhandenen Matrix-Threads ausgeführt wird, wird dieser Thread an Ort und Stelle gebunden.

Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsam genutzten Sitzung kollidiert, postet es in diesem Raum einmalig ein `m.notice`, das auf den `/focus`-Ausweg verweist und eine Änderung von `dm.sessionScope` vorschlägt. Der Hinweis erscheint nur, wenn Thread-Bindings aktiviert sind.

## ACP-Konversations-Bindings

Matrix-Räume, DMs und vorhandene Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` in der Matrix-DM, im Raum oder im vorhandenen Thread aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM/der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geroutet.
- Innerhalb eines vorhandenen Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt das Binding.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnSessions` steuert `/acp spawn --thread auto|here`, wobei OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Konfiguration für Thread-Bindings

Matrix erbt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem kanalspezifische Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-threadgebundene Sitzungserzeugungen sind standardmäßig aktiviert:

- Setzen Sie `threadBindings.spawnSessions: false`, um zu verhindern, dass `/focus` auf oberster Ebene und `/acp spawn --thread auto|here` Matrix-Threads erstellen/binden.
- Setzen Sie `threadBindings.defaultSpawnContext: "isolated"`, wenn native Subagent-Thread-Erzeugungen das übergeordnete Transkript nicht forken sollen.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, eingehende Reaktionsbenachrichtigungen und Ack-Reaktionen.

Ausgehende Reaktionswerkzeuge werden durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf diesem Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bots.

**Auflösungsreihenfolge** (der erste definierte Wert gewinnt):

| Einstellung             | Reihenfolge                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | pro Konto → Kanal → `messages.ackReaction` → Emoji-Fallback der Agent-Identität  |
| `ackReactionScope`      | pro Konto → Kanal → `messages.ackReactionScope` → Standard `"group-mentions"`    |
| `reactionNotifications` | pro Konto → Kanal → Standard `"own"`                                             |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten zielen; `"off"` deaktiviert Reaktions-Systemereignisse. Reaktionsentfernungen werden nicht zu Systemereignissen synthetisiert, weil Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standard `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Matrix-Raumverlauf ist nur ausstehend: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle Auslösernachricht ist nicht in `InboundHistory` enthalten; sie bleibt für diesen Turn im Hauptteil der eingehenden Nachricht.
- Wiederholungen desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufssnapshot wieder, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame `contextVisibility`-Steuerung für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Roots und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext wird unverändert beibehalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Allowlist-Prüfungen für Raum/Benutzer zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber trotzdem eine explizit zitierte Antwort bei.

Diese Einstellung beeinflusst die Sichtbarkeit von ergänzendem Kontext, nicht ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Auslöseautorisierung stammt weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Siehe [Gruppen](/de/channels/groups) für Erwähnungsgating und Allowlist-Verhalten.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiter Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code wieder und kann nach einer kurzen Abkühlzeit eine Erinnerungsantwort senden, statt einen neuen Code auszustellen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Status von Direktnachrichten aus dem Takt gerät, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Solo-Räume statt auf die aktive DM zeigen. Prüfen Sie die aktuelle Zuordnung für einen Peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide Befehle akzeptieren `--account <id>` für Setups mit mehreren Konten. Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt auf jede aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen frischen direkten Raum und schreibt `m.direct` neu, wenn keine fehlerfreie DM existiert

Er löscht alte Räume nicht automatisch. Er wählt die fehlerfreie DM aus und aktualisiert die Zuordnung, sodass zukünftige Matrix-Sends, Verifizierungshinweise und andere Direktnachrichten-Abläufe den richtigen Raum adressieren.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungsclient fungieren. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder `channels.matrix.accounts.<account>.execApprovals` für eine kontospezifische Überschreibung):

- `enabled`: Genehmigungen über Matrix-native Prompts zustellen. Wenn nicht gesetzt oder `"auto"`, aktiviert sich Matrix automatisch, sobald mindestens ein Genehmigender aufgelöst werden kann. Setzen Sie `false`, um dies explizit zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Exec-Anfragen genehmigen dürfen. Optional - fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: wohin Prompts gehen. `"dm"` (Standard) sendet an Genehmigenden-DMs; `"channel"` sendet an den ursprünglichen Matrix-Raum oder die ursprüngliche DM; `"both"` sendet an beide.
- `agentFilter` / `sessionFilter`: optionale Allowlists dafür, welche Agents/Sitzungen Matrix-Zustellung auslösen.

Die Autorisierung unterscheidet sich leicht zwischen Genehmigungsarten:

- **Exec-Genehmigungen** verwenden `execApprovals.approvers` und fallen auf `dm.allowFrom` zurück.
- **Plugin-Genehmigungen** autorisieren ausschließlich über `dm.allowFrom`.

Beide Arten teilen Matrix-Reaktionskurzbefehle und Nachrichtenaktualisierungen. Genehmigende sehen Reaktionskurzbefehle auf der primären Genehmigungsnachricht:

- `✅` einmal erlauben
- `❌` ablehnen
- `♾️` immer erlauben (wenn die effektive Exec-Richtlinie dies erlaubt)

Fallback-Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Die Kanalzustellung für Exec-Genehmigungen enthält den Befehlstext – aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandt: [Exec-Genehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in DMs. In Räumen erkennt OpenClaw auch Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad ohne benutzerdefinierte Erwähnungs-Regex auslöst. Dadurch bleibt der Bot für raumtypische `@mention /command`-Beiträge reaktionsfähig, die Element und ähnliche Clients senden, wenn ein Benutzer den Bot per Tab-Vervollständigung ergänzt, bevor er den Befehl eingibt.

Autorisierungsregeln gelten weiterhin: Befehlsabsender müssen dieselben DM- oder Raum-Allowlist-/Owner-Richtlinien erfüllen wie normale Nachrichten.

## Mehrere Konten

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
- Beschränken Sie einen geerbten Raumeintrag mit `groups.<room>.account` auf ein bestimmtes Konto. Einträge ohne `account` werden kontoübergreifend geteilt; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf oberster Ebene konfiguriert ist.

**Auswahl des Standardkontos:**

- Setzen Sie `defaultAccount`, um das benannte Konto auszuwählen, das implizites Routing, Probing und CLI-Befehle bevorzugen.
- Wenn Sie mehrere Konten haben und eines davon wörtlich `default` heißt, verwendet OpenClaw es implizit, selbst wenn `defaultAccount` nicht gesetzt ist.
- Wenn Sie mehrere benannte Konten haben und kein Standard ausgewählt ist, weigern sich CLI-Befehle zu raten – setzen Sie `defaultAccount` oder übergeben Sie `--account <id>`.
- Der Block `channels.matrix.*` auf oberster Ebene wird nur dann als implizites `default`-Konto behandelt, wenn seine Authentifizierung vollständig ist (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben über `homeserver` + `userId` auffindbar, sobald zwischengespeicherte Anmeldedaten die Authentifizierung abdecken.

**Promotion:**

- Wenn OpenClaw eine Einzelkonto-Konfiguration während Reparatur oder Einrichtung zu mehreren Konten migriert, bleibt das vorhandene benannte Konto erhalten, sofern eines existiert oder `defaultAccount` bereits auf eines zeigt. Nur Matrix-Auth-/Bootstrap-Schlüssel werden in das migrierte Konto verschoben; gemeinsame Schlüssel für Zustellrichtlinien bleiben auf oberster Ebene.

Siehe [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Muster für mehrere Konten.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum Schutz vor SSRF, sofern Sie
dies nicht ausdrücklich pro Konto aktivieren.

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

Diese explizite Aktivierung erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche Klartext-Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Bevorzugen Sie nach Möglichkeit `https://`.

## Matrix-Verkehr über Proxy leiten

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

Benannte Konten können den Standard auf oberster Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Verkehr zur Laufzeit und Kontostatus-Probes.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Matrix-Raum-IDs berücksichtigen Groß-/Kleinschreibung. Verwenden Sie die exakte Schreibweise der Raum-ID aus Matrix,
wenn Sie explizite Zustellziele, Cron-Jobs, Bindings oder Allowlists konfigurieren.
OpenClaw hält interne Sitzungsschlüssel für die Speicherung kanonisch, sodass diese kleingeschriebenen
Schlüssel keine verlässliche Quelle für Matrix-Zustellungs-IDs sind.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt. Die Suche nach Namen beigetretener Räume erfolgt nach bestem Aufwand und gilt nur für Raum-Allowlists zur Laufzeit, wenn `dangerouslyAllowNameMatching: true` gesetzt ist.
- Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er bei der Laufzeitauflösung der Allowlist ignoriert.

## Konfigurationsreferenz

Benutzerfelder im Allowlist-Stil (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs (am sichersten). Benutzereinträge ohne ID werden standardmäßig ignoriert. Wenn Sie `dangerouslyAllowNameMatching: true` setzen, werden exakte Übereinstimmungen mit Matrix-Verzeichnis-Anzeigenamen beim Start und immer dann aufgelöst, wenn sich die Allowlist während des laufenden Monitors ändert; Einträge, die nicht aufgelöst werden können, werden zur Laufzeit ignoriert.

Raum-Allowlist-Schlüssel (`groups`, legacy `rooms`) sollten Raum-IDs oder Aliasse sein. Reine Raumnamenschlüssel werden standardmäßig ignoriert; `dangerouslyAllowNameMatching: true` stellt die Suche nach Namen beigetretener Räume nach bestem Aufwand wieder her.

### Konto und Verbindung

- `enabled`: aktiviert oder deaktiviert den Kanal.
- `name`: optionale Anzeigenbezeichnung für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: benannte Überschreibungen pro Konto. Werte auf oberster Ebene in `channels.matrix` werden als Standardwerte geerbt.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: erlaubt diesem Konto, sich mit `localhost`, LAN-/Tailscale-IPs oder internen Hostnamen zu verbinden.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Verkehr. Überschreibung pro Konto wird unterstützt.
- `userId`: vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartext- und SecretRef-Werte werden über Env-/Datei-/Exec-Provider unterstützt ([Secret-Verwaltung](/de/gateway/secrets)).
- `password`: Passwort für passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Geräteanzeigename, der bei der Passwortanmeldung verwendet wird.
- `avatarUrl`: gespeicherte URL des eigenen Avatars für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl von Ereignissen, die während der Startsynchronisierung abgerufen werden.

### Verschlüsselung

- `encryption`: aktiviert E2EE. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard, wenn E2EE aktiviert ist) oder `"off"`. Fordert beim Start automatisch eine Selbstverifizierung an, wenn dieses Gerät nicht verifiziert ist.
- `startupVerificationCooldownHours`: Abklingzeit vor der nächsten automatischen Startanfrage. Standard: `24`.

### Zugriff und Richtlinie

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumverkehr.
- `mentionPatterns`: bereichsbezogene Regex-Muster für Raumerwähnungen. Objekt mit `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Steuert, ob konfigurierte `agents.list[].groupChat.mentionPatterns` pro Raum gelten.
- `dm.enabled`: ignoriert alle DMs, wenn `false`. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Gilt, nachdem der Bot beigetreten ist und den Raum als DM klassifiziert hat; dies beeinflusst die Verarbeitung von Einladungen nicht.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Verkehr.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: reine DM-Überschreibung für Antwort-Threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: Nachrichten von anderen konfigurierten Matrix-Bot-Konten akzeptieren (`true` oder `"mentions"`).
- `allowlistOnly`: erzwingt, wenn `true`, für alle aktiven DM-Richtlinien (außer `"disabled"`) und `"open"`-Gruppenrichtlinien `"allowlist"`. Ändert keine `"disabled"`-Richtlinien.
- `dangerouslyAllowNameMatching`: erlaubt, wenn `true`, die Matrix-Verzeichnissuche nach Anzeigenamen für Benutzer-Allowlist-Einträge und die Suche nach Namen beigetretener Räume für Raum-Allowlist-Schlüssel. Bevorzugen Sie vollständige `@user:server`-IDs und Raum-IDs oder Aliasse.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` `"allowlist"` ist. Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den vom eingeladenen Raum behaupteten Zustand.
- `contextVisibility`: ergänzende Kontextsichtbarkeit (`"all"` Standard, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"`, `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` oder `"always"`.
- `threadBindings`: Überschreibungen pro Kanal für Thread-gebundenes Sitzungsrouting und Lebenszyklus.
- `streaming`: `"off"` (Standard), `"partial"`, `"quiet"`, `"progress"` oder Objektform `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wenn `true`, bleiben abgeschlossene Assistant-Blöcke als separate Fortschrittsnachrichten erhalten.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: Größe ausgehender Chunks in Zeichen, wenn `chunkMode: "length"`. Standard: `4000`.
- `chunkMode`: `"length"` (Standard, teilt nach Zeichenzahl) oder `"newline"` (teilt an Zeilengrenzen).
- `historyLimit`: Anzahl der letzten Raumnachrichten, die als `InboundHistory` eingeschlossen werden, wenn eine Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standard `0` (deaktiviert).
- `mediaMaxMb`: Mediengrößenlimit in MB für ausgehende Sends und eingehende Verarbeitung.

### Reaktionseinstellungen

- `ackReaction`: Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: Bereichsüberschreibung (`"group-mentions"` Standard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (`"own"` Standard, `"off"`).

### Werkzeuge und Überschreibungen pro Raum

- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: Richtlinienzuordnung pro Raum. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein veralteter Alias.)
  - `groups.<room>.account`: beschränkt einen geerbten Raumeintrag auf ein bestimmtes Konto.
  - `groups.<room>.enabled`: Umschalter pro Raum. Bei `false` wird der Raum ignoriert, als wäre er nicht in der Zuordnung enthalten.
  - `groups.<room>.requireMention`: raumspezifische Außerkraftsetzung der Mention-Anforderung auf Kanalebene.
  - `groups.<room>.allowBots`: raumspezifische Außerkraftsetzung der Einstellung auf Kanalebene (`true` oder `"mentions"`).
  - `groups.<room>.botLoopProtection`: raumspezifische Außerkraftsetzung des Budgets für Schutz vor Bot-zu-Bot-Schleifen.
  - `groups.<room>.users`: Sender-Allowlist pro Raum.
  - `groups.<room>.tools`: raumspezifische Allow-/Deny-Außerkraftsetzungen für Tools.
  - `groups.<room>.autoReply`: raumspezifische Außerkraftsetzung des Mention-Gatings. `true` deaktiviert Mention-Anforderungen für diesen Raum; `false` erzwingt sie wieder.
  - `groups.<room>.skills`: Skill-Filter pro Raum.
  - `groups.<room>.systemPrompt`: System-Prompt-Ausschnitt pro Raum.

### Einstellungen für Exec-Genehmigungen

- `execApprovals.enabled`: Exec-Genehmigungen über Matrix-native Eingabeaufforderungen zustellen.
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die genehmigen dürfen. Fällt auf `dm.allowFrom` zurück.
- `execApprovals.target`: `"dm"` (Standard), `"channel"` oder `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionale Agent-/Sitzungs-Allowlists für die Zustellung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Gruppenchatverhalten und Mention-Gating
- [Kanalrouting](/de/channels/channel-routing) - Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Härtung

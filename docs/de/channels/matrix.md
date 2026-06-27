---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Matrix-Unterstützungsstatus, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-06-27T17:11:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein herunterladbares Kanal-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standorte und E2EE.

## Installation

Installieren Sie Matrix aus ClawHub, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/matrix
```

Plugin-Spezifikationen ohne Präfix versuchen zuerst ClawHub und dann npm als Fallback. Um die Registry-Quelle zu erzwingen, verwenden Sie `openclaw plugins install clawhub:@openclaw/matrix` oder `openclaw plugins install npm:@openclaw/matrix`.

Aus einem lokalen Checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registriert und aktiviert das Plugin, daher ist kein separater Schritt `openclaw plugins enable matrix` erforderlich. Das Plugin tut weiterhin nichts, bis Sie den Kanal unten konfigurieren. Siehe [Plugins](/de/tools/plugin) für allgemeines Plugin-Verhalten und Installationsregeln.

## Einrichtung

1. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
2. Konfigurieren Sie `channels.matrix` entweder mit `homeserver` + `accessToken` oder mit `homeserver` + `userId` + `password`.
3. Starten Sie den Gateway neu.
4. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein (siehe [automatisch beitreten](#auto-join) - neue Einladungen werden nur angenommen, wenn `autoJoin` sie erlaubt).

### Interaktive Einrichtung

```bash
openclaw channels add
openclaw configure --section channels
```

Der Assistent fragt nach: Homeserver-URL, Authentifizierungsmethode (Access-Token oder Passwort), Benutzer-ID (nur Passwortauthentifizierung), optionalem Gerätenamen, ob E2EE aktiviert werden soll und ob Raumzugriff und automatisches Beitreten konfiguriert werden sollen.

Wenn passende `MATRIX_*`-Umgebungsvariablen bereits vorhanden sind und für das ausgewählte Konto keine gespeicherte Authentifizierung existiert, bietet der Assistent eine Umgebungsvariablen-Abkürzung an. Um Raumnamen vor dem Speichern einer Allowlist aufzulösen, führen Sie `openclaw channels resolve --channel matrix "Project Room"` aus. Wenn E2EE aktiviert ist, schreibt der Assistent die Konfiguration und führt denselben Bootstrap aus wie [`openclaw matrix encryption setup`](#encryption-and-verification).

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

### Automatisch beitreten

`channels.matrix.autoJoin` ist standardmäßig `off`. Mit der Standardeinstellung erscheint der Bot nicht in neuen Räumen oder DMs aus neuen Einladungen, bis Sie manuell beitreten.

OpenClaw kann zum Einladungszeitpunkt nicht erkennen, ob ein eingeladener Raum eine DM oder eine Gruppe ist. Daher laufen alle Einladungen - einschließlich DM-artiger Einladungen - zuerst über `autoJoin`. `dm.policy` greift erst später, nachdem der Bot beigetreten ist und der Raum klassifiziert wurde.

<Warning>
Legen Sie `autoJoin: "allowlist"` plus `autoJoinAllowlist` fest, um einzuschränken, welche Einladungen der Bot akzeptiert, oder `autoJoin: "always"`, um jede Einladung zu akzeptieren.

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

Um jede Einladung zu akzeptieren, verwenden Sie `autoJoin: "always"`.

### Allowlist-Zielformate

DM- und Raum-Allowlists werden am besten mit stabilen IDs befüllt:

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden standardmäßig ignoriert, weil sie veränderlich sind; setzen Sie `dangerouslyAllowNameMatching: true` nur, wenn Sie ausdrücklich Kompatibilität mit Einträgen über Anzeigenamen benötigen.
- Raum-Allowlist-Schlüssel (`groups`, Legacy-`rooms`): Verwenden Sie `!room:server` oder `#alias:server`. Einfache Raumnamen werden standardmäßig ignoriert; setzen Sie `dangerouslyAllowNameMatching: true` nur, wenn Sie ausdrücklich Kompatibilität mit der Namenssuche für beigetretene Räume benötigen.
- Einladungs-Allowlists (`autoJoinAllowlist`): Verwenden Sie `!room:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.

### Normalisierung der Konto-ID

Der Assistent wandelt einen freundlichen Namen in eine normalisierte Konto-ID um. Beispielsweise wird aus `Ops Bot` `ops-bot`. Satzzeichen werden in bereichsbezogenen Umgebungsvariablennamen maskiert, damit zwei Konten nicht kollidieren können: `-` → `_X2D_`, daher wird `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet.

### Zwischengespeicherte Anmeldedaten

Matrix speichert zwischengespeicherte Anmeldedaten unter `~/.openclaw/credentials/matrix/`:

- Standardkonto: `credentials.json`
- Benannte Konten: `credentials-<account>.json`

Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, behandelt OpenClaw Matrix als konfiguriert, selbst wenn das Access-Token nicht in der Konfigurationsdatei steht - das gilt für die Einrichtung, `openclaw doctor` und Kanalstatus-Prüfungen.

### Umgebungsvariablen

Wird verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; benannte Konten verwenden die vor dem Suffix eingefügte Konto-ID.

| Standardkonto       | Benanntes Konto (`<ID>` ist die normalisierte Konto-ID) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Für das Konto `ops` werden die Namen zu `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` und so weiter. Die Recovery-Key-Umgebungsvariablen werden von wiederherstellungsfähigen CLI-Flows (`verify backup restore`, `verify device`, `verify bootstrap`) gelesen, wenn Sie den Schlüssel über `--recovery-key-stdin` einspeisen.

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

Matrix-Antwort-Streaming ist Opt-in. `streaming` steuert, wie OpenClaw die laufende Assistant-Antwort ausliefert; `blockStreaming` steuert, ob jeder abgeschlossene Block als eigene Matrix-Nachricht erhalten bleibt.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Um Live-Antwortvorschauen beizubehalten, aber vorläufige Tool-/Fortschrittszeilen auszublenden, verwenden Sie die Objektform:

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
| `"partial"`       | Eine normale Textnachricht direkt bearbeiten, während das Modell den aktuellen Block schreibt. Standard-Matrix-Clients können bei der ersten Vorschau benachrichtigen, nicht bei der finalen Bearbeitung.              |
| `"quiet"`         | Wie `"partial"`, aber die Nachricht ist ein nicht benachrichtigender Hinweis. Empfänger erhalten nur dann eine Benachrichtigung, wenn eine benutzerspezifische Push-Regel auf die finalisierte Bearbeitung passt (siehe unten). |

`blockStreaming` ist unabhängig von `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (Standard)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block, abgeschlossene Blöcke bleiben als Nachrichten erhalten | Live-Entwurf für den aktuellen Block, direkt finalisiert |
| `"off"`                 | Eine benachrichtigende Matrix-Nachricht pro abgeschlossenem Block                     | Eine benachrichtigende Matrix-Nachricht für die vollständige Antwort      |

Hinweise:

- Wenn eine Vorschau über das Matrix-Größenlimit pro Ereignis hinauswächst, stoppt OpenClaw das Vorschau-Streaming und fällt auf reine finale Zustellung zurück.
- Medienantworten senden Anhänge immer normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie, bevor die finale Medienantwort gesendet wird.
- Vorschauaktualisierungen für Tool-Fortschritt sind standardmäßig aktiviert, wenn Matrix-Vorschau-Streaming aktiv ist. Setzen Sie `streaming.preview.toolProgress: false`, um Vorschau-Bearbeitungen für Antworttext beizubehalten, Tool-Fortschritt aber auf dem normalen Zustellpfad zu belassen.
- Vorschau-Bearbeitungen kosten zusätzliche Matrix-API-Aufrufe. Belassen Sie `streaming: "off"`, wenn Sie das konservativste Rate-Limit-Profil wünschen.

## Sprachnachrichten

Eingehende Matrix-Sprachnotizen werden vor der Raum-Erwähnungssperre transkribiert. Dadurch kann eine Sprachnotiz, die den Bot-Namen sagt, den Agenten in einem Raum mit `requireMention: true` auslösen, und der Agent erhält das Transkript statt nur eines Audioanhang-Platzhalters.

Matrix verwendet den gemeinsam konfigurierten Audiomedien-Provider unter `tools.media.audio`, zum Beispiel OpenAI `gpt-4o-mini-transcribe`. Siehe [Übersicht über Medientools](/de/tools/media-overview) für Provider-Einrichtung und Limits.

Verhaltensdetails:

- `m.audio`-Ereignisse und `m.file`-Ereignisse mit einem `audio/*`-MIME-Typ sind geeignet.
- In verschlüsselten Räumen entschlüsselt OpenClaw den Anhang vor der Transkription über den bestehenden Matrix-Medienpfad.
- Das Transkript wird im Agenten-Prompt als maschinell erzeugt und nicht vertrauenswürdig markiert.
- Der Anhang wird als bereits transkribiert markiert, damit nachgelagerte Medientools dieselbe Sprachnotiz nicht erneut transkribieren.
- Setzen Sie `tools.media.audio.enabled: false`, um Audiotranskription global zu deaktivieren.

## Genehmigungsmetadaten

Native Matrix-Genehmigungsaufforderungen sind normale `m.room.message`-Ereignisse mit OpenClaw-spezifischem benutzerdefiniertem Ereignisinhalt unter `com.openclaw.approval`. Matrix erlaubt benutzerdefinierte Ereignisinhalts-Schlüssel, sodass Standard-Clients den Textkörper weiterhin rendern, während OpenClaw-fähige Clients die strukturierte Genehmigungs-ID, Art, Status, verfügbaren Entscheidungen und Exec-/Plugin-Details lesen können.

Wenn eine Genehmigungsaufforderung zu lang für ein Matrix-Ereignis ist, teilt OpenClaw den sichtbaren Text in Blöcke auf und hängt `com.openclaw.approval` nur an den ersten Block an. Reaktionen für Zulassen-/Ablehnen-Entscheidungen sind an dieses erste Ereignis gebunden, sodass lange Aufforderungen dasselbe Genehmigungsziel behalten wie Aufforderungen mit einem einzelnen Ereignis.

### Selbst gehostete Push-Regeln für ruhige finalisierte Vorschauen

`streaming: "quiet"` benachrichtigt Empfänger nur, sobald ein Block oder Turn finalisiert ist - eine benutzerspezifische Push-Regel muss auf den Marker der finalisierten Vorschau passen. Siehe [Matrix-Push-Regeln für ruhige Vorschauen](/de/channels/matrix-push-rules) für das vollständige Rezept (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie Matrix-Verkehr zwischen Agenten ausdrücklich wünschen:

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

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Datenverkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich - das Plugin erkennt den E2EE-Status automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnosen), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Mehrkonten-Setups). Die Ausgabe ist standardmäßig knapp und verwendet ruhiges internes SDK-Logging. Die folgenden Beispiele zeigen die kanonische Form; fügen Sie die Flags nach Bedarf hinzu.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
```

Initialisiert Secret Storage und Cross-Signing, erstellt bei Bedarf ein Raum-Schlüssel-Backup und gibt dann Status und nächste Schritte aus. Nützliche Flags:

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
- `Cross-signing verified`: Das SDK meldet die Verifizierung per Cross-Signing
- `Signed by owner`: mit Ihrem eigenen Self-Signing-Schlüssel signiert (nur Diagnose)

`Verified by owner` wird nur dann zu `yes`, wenn `Cross-signing verified` `yes` ist. Lokales Vertrauen oder eine Ownersignatur allein reicht nicht aus.

`--allow-degraded-local-state` gibt Best-Effort-Diagnosen zurück, ohne zuerst das Matrix-Konto vorzubereiten; nützlich für Offline- oder teilweise konfigurierte Prüfungen.

### Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren

Der Wiederherstellungsschlüssel ist sensibel - leiten Sie ihn per stdin weiter, statt ihn auf der Befehlszeile zu übergeben. Setzen Sie `MATRIX_RECOVERY_KEY` (oder `MATRIX_<ID>_RECOVERY_KEY` für ein benanntes Konto):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für Secret Storage oder Gerätevertrauen akzeptiert.
- `Backup usable`: Das Raum-Schlüssel-Backup kann mit dem vertrauenswürdigen Wiederherstellungsmaterial geladen werden.
- `Device verified by owner`: Dieses Gerät hat volles Vertrauen der Matrix-Cross-Signing-Identität.

Er beendet sich mit einem von null verschiedenen Code, wenn das volle Identitätsvertrauen unvollständig ist, selbst wenn der Wiederherstellungsschlüssel Backup-Material entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung über einen anderen Matrix-Client ab:

```bash
openclaw matrix verify self
```

`verify self` wartet auf `Cross-signing verified: yes`, bevor es erfolgreich beendet wird. Verwenden Sie `--timeout-ms <ms>`, um die Wartezeit anzupassen.

Die Literal-Schlüssel-Form `openclaw matrix verify device "<recovery-key>"` wird ebenfalls akzeptiert, aber der Schlüssel landet in Ihrer Shell-History.

### Cross-Signing initialisieren oder reparieren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Konten. In dieser Reihenfolge:

- initialisiert Secret Storage und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel erneut
- initialisiert Cross-Signing und lädt fehlende öffentliche Schlüssel hoch
- markiert und cross-signiert das aktuelle Gerät
- erstellt ein serverseitiges Raum-Schlüssel-Backup, falls noch keines vorhanden ist

Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln erfordert, versucht OpenClaw zuerst ohne Authentifizierung, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` kombinieren) oder `--recovery-key <key>`
- `--force-reset-cross-signing`, um die aktuelle Cross-Signing-Identität zu verwerfen (nur bewusst; erfordert, dass der aktive Wiederherstellungsschlüssel gespeichert ist oder mit `--recovery-key-stdin` bereitgestellt wird)

### Raum-Schlüssel-Backup

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt, ob ein serverseitiges Backup vorhanden ist und ob dieses Gerät es entschlüsseln kann. `backup restore` importiert gesicherte Raum-Schlüssel in den lokalen Crypto Store; wenn der Wiederherstellungsschlüssel bereits auf der Festplatte liegt, können Sie `--recovery-key-stdin` weglassen.

So ersetzen Sie ein beschädigtes Backup durch eine frische Baseline (akzeptiert den Verlust nicht wiederherstellbarer alter Historie; kann auch Secret Storage neu erstellen, wenn das aktuelle Backup-Secret nicht ladbar ist):

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

Sendet eine Verifizierungsanfrage von diesem OpenClaw-Konto. `--own-user` fordert Selbstverifizierung an (Sie akzeptieren die Eingabeaufforderung in einem anderen Matrix-Client desselben Benutzers); `--user-id`/`--device-id`/`--room-id` zielen auf eine andere Person. `--own-user` kann nicht mit den anderen Ziel-Flags kombiniert werden.

Für Lifecycle-Handling auf niedrigerer Ebene - typischerweise beim Begleiten eingehender Anfragen von einem anderen Client - wirken diese Befehle auf eine bestimmte Anfrage `<id>` (ausgegeben von `verify list` und `verify request`):

| Befehl                                    | Zweck                                                               |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`      | Eine eingehende Anfrage akzeptieren                                 |
| `openclaw matrix verify start <id>`       | Den SAS-Flow starten                                                |
| `openclaw matrix verify sas <id>`         | Die SAS-Emoji oder Dezimalzahlen ausgeben                           |
| `openclaw matrix verify confirm-sas <id>` | Bestätigen, dass die SAS mit der Anzeige des anderen Clients übereinstimmt |
| `openclaw matrix verify mismatch-sas <id>` | Die SAS ablehnen, wenn Emoji oder Dezimalzahlen nicht übereinstimmen |
| `openclaw matrix verify cancel <id>`      | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als DM-Follow-up-Hinweise, wenn die Verifizierung an einen bestimmten Direktnachrichtenraum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Wenn Sie mehrere benannte Konten haben und `channels.matrix.defaultAccount` nicht gesetzt haben, raten sie nicht und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Mit `encryption: true` ist der Standardwert für `startupVerification` `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abklingzeit an (standardmäßig 24 Stunden). Passen Sie dies mit `startupVerificationCooldownHours` an oder deaktivieren Sie es mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt, der den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität erneut verwendet. Wenn der Bootstrap-Zustand beschädigt ist, versucht OpenClaw eine abgesicherte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA erfordert, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits owner-signierte Geräte bleiben erhalten.

    Siehe [Matrix-Migration](/de/channels/matrix-migration) für den vollständigen Upgrade-Flow.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix postet Verifizierungs-Lifecycle-Hinweise in den strikten DM-Verifizierungsraum als `m.notice`-Nachrichten: Anfrage, bereit (mit Anleitung „Verify by emoji“), Start/Abschluss sowie SAS-Details (Emoji/Dezimalzahlen), wenn verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Für Selbstverifizierung startet OpenClaw den SAS-Flow automatisch und bestätigt die eigene Seite, sobald Emoji-Verifizierung verfügbar ist - Sie müssen weiterhin in Ihrem Matrix-Client vergleichen und „They match“ bestätigen.

    Hinweise des Verifizierungssystems werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Wenn `verify status` meldet, dass das aktuelle Gerät auf dem Homeserver nicht mehr aufgeführt ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für Passwort-Login:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Für Token-Authentifizierung erstellen Sie ein frisches Zugriffstoken in Ihrem Matrix-Client oder Ihrer Admin-UI und aktualisieren dann OpenClaw:

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
    Matrix-E2EE verwendet den offiziellen `matrix-js-sdk`-Rust-Crypto-Pfad mit `fake-indexeddb` als IndexedDB-Shim. Der Crypto-Zustand bleibt in `crypto-idb-snapshot.json` bestehen (restriktive Dateiberechtigungen).

    Verschlüsselter Laufzeitzustand liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Sync Store, Crypto Store, Wiederherstellungsschlüssel, IDB-Snapshot, Thread-Bindungen und Startverifizierungszustand. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw die beste vorhandene Wurzel erneut, sodass vorheriger Zustand sichtbar bleibt.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Sie können beide Optionen in einem Aufruf übergeben. Matrix akzeptiert `mxc://`-Avatar-URLs direkt; wenn Sie `http://` oder `https://` übergeben, lädt OpenClaw die Datei zuerst hoch und speichert die aufgelöste `mxc://`-URL in `channels.matrix.avatarUrl` (oder in der kontospezifischen Überschreibung).

## Thread-Unterhaltungen

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sendevorgänge über das Nachrichtentool. Zwei unabhängige Regler steuern das Verhalten:

### Sitzungsrouting (`sessionScope`)

`dm.sessionScope` legt fest, wie Matrix-DM-Räume OpenClaw-Sitzungen zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Peer teilen sich eine Sitzung.
- `"per-room"`: Jeder Matrix-DM-Raum erhält seinen eigenen Sitzungsschlüssel, auch wenn der Peer derselbe ist.

Explizite Unterhaltungsbindungen haben immer Vorrang vor `sessionScope`, sodass gebundene Räume und Threads ihre ausgewählte Zielsitzung behalten.

### Antwort-Threading (`threadReplies`)

`threadReplies` legt fest, wo der Bot seine Antwort postet:

- `"off"`: Antworten befinden sich auf oberster Ebene. Eingehende Nachrichten in Threads bleiben in der übergeordneten Sitzung.
- `"inbound"`: Innerhalb eines Threads nur dann antworten, wenn die eingehende Nachricht bereits in diesem Thread war.
- `"always"`: Innerhalb eines Threads antworten, der bei der auslösenden Nachricht verwurzelt ist; diese Unterhaltung wird ab dem ersten Auslöser über eine passende threadbezogene Sitzung geroutet.

`dm.threadReplies` überschreibt dies nur für DMs - zum Beispiel, um Raum-Threads isoliert zu halten, während DMs flach bleiben.

### Thread-Vererbung und Slash-Befehle

- Eingehende Nachrichten in Threads enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Sendevorgänge über das Nachrichtentool erben automatisch den aktuellen Matrix-Thread, wenn sie denselben Raum (oder dasselbe DM-Benutzerziel) adressieren, sofern keine explizite `threadId` angegeben ist.
- Die Wiederverwendung von DM-Benutzerzielen greift nur, wenn die aktuellen Sitzungsmetadaten denselben DM-Peer auf demselben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf das normale benutzerbezogene Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren alle in Matrix-Räumen und DMs.
- `/focus` auf oberster Ebene erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSessions` aktiviert ist.
- Wenn Sie `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads ausführen, wird dieser Thread an Ort und Stelle gebunden.

Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsamen Sitzung kollidiert, postet es in diesem Raum einmalig eine `m.notice`, die auf den `/focus`-Ausweg verweist und eine Änderung von `dm.sessionScope` vorschlägt. Der Hinweis erscheint nur, wenn Thread-Bindungen aktiviert sind.

## ACP-Unterhaltungsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Ablauf für Betreiber:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des bestehenden Threads aus, den Sie weiter verwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geroutet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnSessions` steuert `/acp spawn --thread auto|here`, wobei OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Thread-Bindungskonfiguration

Matrix erbt globale Standards aus `session.threadBindings` und unterstützt außerdem kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-threadgebundene Sitzungserzeugungen sind standardmäßig aktiviert:

- Setzen Sie `threadBindings.spawnSessions: false`, um zu verhindern, dass `/focus` auf oberster Ebene und `/acp spawn --thread auto|here` Matrix-Threads erstellen oder binden.
- Setzen Sie `threadBindings.defaultSpawnContext: "isolated"`, wenn native Subagent-Thread-Erzeugungen das übergeordnete Transkript nicht forken sollen.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, eingehende Reaktionsbenachrichtigungen und Bestätigungsreaktionen.

Ausgehende Reaktionswerkzeuge werden durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion vom Bot.

**Auflösungsreihenfolge** (der erste definierte Wert gewinnt):

| Einstellung             | Reihenfolge                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | pro Konto → Kanal → `messages.ackReaction` → Fallback auf Agent-Identitäts-Emoji |
| `ackReactionScope`      | pro Konto → Kanal → `messages.ackReactionScope` → Standard `"group-mentions"`    |
| `reactionNotifications` | pro Konto → Kanal → Standard `"own"`                                             |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten zielen; `"off"` deaktiviert Reaktionssystemereignisse. Entfernte Reaktionen werden nicht zu Systemereignissen synthetisiert, da Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen bereitstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standard `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Matrix-Raumverlauf ist nur ausstehend: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle auslösende Nachricht wird nicht in `InboundHistory` aufgenommen; sie bleibt für diesen Turn im Haupteingangstext.
- Wiederholungen desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufs-Snapshot erneut, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für zusätzlichen Raumkontext wie abgerufenen Antworttext, Thread-Roots und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Zusätzlicher Kontext wird so beibehalten, wie er empfangen wurde.
- `contextVisibility: "allowlist"` filtert zusätzlichen Kontext auf Absender, die durch die aktiven Allowlist-Prüfungen für Raum oder Benutzer zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber trotzdem eine ausdrücklich zitierte Antwort bei.

Diese Einstellung wirkt sich auf die Sichtbarkeit von zusätzlichem Kontext aus, nicht darauf, ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Auslöseautorisierung stammt weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und DM-Richtlinieneinstellungen.

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

Siehe [Gruppen](/de/channels/groups) für Mention-Gating und Allowlist-Verhalten.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiter Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und kann nach einer kurzen Abklingzeit eine Erinnerungsantwort senden, statt einen neuen Code auszustellen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Direktnachrichtenstatus nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Einzelräume statt auf die aktive DM zeigen. Prüfen Sie die aktuelle Zuordnung für einen Peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide Befehle akzeptieren `--account <id>` für Setups mit mehreren Konten. Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt auf eine aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine fehlerfreie DM vorhanden ist

Er löscht alte Räume nicht automatisch. Er wählt die fehlerfreie DM aus und aktualisiert die Zuordnung, sodass zukünftige Matrix-Sendevorgänge, Verifizierungshinweise und andere Direktnachrichtenabläufe den richtigen Raum adressieren.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungsclient fungieren. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder `channels.matrix.accounts.<account>.execApprovals` für eine kontospezifische Überschreibung):

- `enabled`: Genehmigungen über Matrix-native Eingabeaufforderungen zustellen. Wenn nicht gesetzt oder `"auto"`, aktiviert sich Matrix automatisch, sobald mindestens ein Genehmigender aufgelöst werden kann. Setzen Sie `false`, um dies ausdrücklich zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Exec-Anforderungen genehmigen dürfen. Optional - fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: wohin Aufforderungen gehen. `"dm"` (Standard) sendet an DMs von Genehmigenden; `"channel"` sendet an den ausgehenden Matrix-Raum oder die DM; `"both"` sendet an beide.
- `agentFilter` / `sessionFilter`: optionale Allowlists dafür, welche Agents/Sitzungen eine Matrix-Zustellung auslösen.

Die Autorisierung unterscheidet sich leicht zwischen Genehmigungsarten:

- **Exec-Genehmigungen** verwenden `execApprovals.approvers` und fallen auf `dm.allowFrom` zurück.
- **Plugin-Genehmigungen** autorisieren nur über `dm.allowFrom`.

Beide Arten teilen sich Matrix-Reaktionskürzel und Nachrichtenaktualisierungen. Genehmigende sehen Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` einmal erlauben
- `❌` ablehnen
- `♾️` immer erlauben (wenn die effektive Exec-Richtlinie dies zulässt)

Fallback-Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Kanalzustellung für Exec-Genehmigungen enthält den Befehlstext - aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandt: [Exec-Genehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in DMs. In Räumen erkennt OpenClaw auch Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad ohne benutzerdefinierten Erwähnungs-Regex auslöst. Dadurch bleibt der Bot für raumtypische `@mention /command`-Posts reaktionsfähig, die Element und ähnliche Clients ausgeben, wenn ein Benutzer den Bot per Tabvervollständigung auswählt, bevor er den Befehl eingibt.

Autorisierungsregeln gelten weiterhin: Befehlssender müssen dieselben DM- oder Raum-Allowlist-/Eigentümerrichtlinien erfüllen wie normale Nachrichten.

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

- Werte auf oberster Ebene in `channels.matrix` dienen als Standards für benannte Konten, sofern ein Konto sie nicht überschreibt.
- Begrenzen Sie einen geerbten Raumeintrag mit `groups.<room>.account` auf ein bestimmtes Konto. Einträge ohne `account` werden kontoübergreifend geteilt; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf oberster Ebene konfiguriert ist.

**Auswahl des Standardkontos:**

- Setzen Sie `defaultAccount`, um das benannte Konto auszuwählen, das implizites Routing, Probing und CLI-Befehle bevorzugen.
- Wenn Sie mehrere Konten haben und eines davon wörtlich `default` heißt, verwendet OpenClaw es implizit, auch wenn `defaultAccount` nicht gesetzt ist.
- Wenn Sie mehrere benannte Konten haben und kein Standardkonto ausgewählt ist, weigern sich CLI-Befehle zu raten - setzen Sie `defaultAccount` oder übergeben Sie `--account <id>`.
- Der Top-Level-Block `channels.matrix.*` wird nur dann als implizites Konto `default` behandelt, wenn dessen Auth vollständig ist (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben über `homeserver` + `userId` auffindbar, sobald zwischengespeicherte Anmeldedaten die Auth abdecken.

**Promotion:**

- Wenn OpenClaw bei Reparatur oder Einrichtung eine Einzelkonto-Konfiguration zu einer Mehrkonto-Konfiguration hochstuft, behält es das vorhandene benannte Konto bei, falls eines existiert oder `defaultAccount` bereits auf eines verweist. Nur Matrix-Auth-/Bootstrap-Schlüssel werden in das hochgestufte Konto verschoben; gemeinsame Schlüssel für Zustellungsrichtlinien bleiben auf der obersten Ebene.

Siehe [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Mehrkonto-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum Schutz vor SSRF, sofern Sie dies nicht
pro Konto ausdrücklich erlauben.

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

Diese ausdrückliche Zustimmung erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche Klartext-Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Bevorzugen Sie nach Möglichkeit `https://`.

## Matrix-Traffic über Proxy leiten

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
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Traffic zur Laufzeit und Kontostatus-Probes.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Bei Matrix-Raum-IDs wird zwischen Groß- und Kleinschreibung unterschieden. Verwenden Sie die exakte Schreibweise der Raum-ID aus Matrix,
wenn Sie explizite Zustellungsziele, Cron-Jobs, Bindings oder Allowlists konfigurieren.
OpenClaw hält interne Sitzungsschlüssel für die Speicherung kanonisch, daher sind diese kleingeschriebenen
Schlüssel keine zuverlässige Quelle für Matrix-Zustellungs-IDs.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt. Die Namenssuche in beigetretenen Räumen erfolgt nach bestem Aufwand und gilt nur für Raum-Allowlists zur Laufzeit, wenn `dangerouslyAllowNameMatching: true` gesetzt ist.
- Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er von der Allowlist-Auflösung zur Laufzeit ignoriert.

## Konfigurationsreferenz

Benutzerfelder im Allowlist-Stil (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs (am sichersten). Nicht-ID-Benutzereinträge werden standardmäßig ignoriert. Wenn Sie `dangerouslyAllowNameMatching: true` setzen, werden exakte Matrix-Verzeichnis-Treffer für Anzeigenamen beim Start und immer dann aufgelöst, wenn sich die Allowlist ändert, während der Monitor läuft; Einträge, die nicht aufgelöst werden können, werden zur Laufzeit ignoriert.

Raum-Allowlist-Schlüssel (`groups`, Legacy-`rooms`) sollten Raum-IDs oder Aliasse sein. Einfache Raumnamensschlüssel werden standardmäßig ignoriert; `dangerouslyAllowNameMatching: true` stellt die Best-Effort-Suche anhand der Namen beigetretener Räume wieder her.

### Konto und Verbindung

- `enabled`: aktiviert oder deaktiviert den Kanal.
- `name`: optionale Anzeigebezeichnung für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: benannte Überschreibungen pro Konto. Werte auf oberster Ebene von `channels.matrix` werden als Standardwerte geerbt.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: erlaubt diesem Konto, eine Verbindung zu `localhost`, LAN-/Tailscale-IPs oder internen Hostnamen herzustellen.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Traffic. Überschreibung pro Konto unterstützt.
- `userId`: vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Auth. Klartext- und SecretRef-Werte werden über env/file/exec-Provider unterstützt ([Geheimnisverwaltung](/de/gateway/secrets)).
- `password`: Passwort für passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Geräteanzeigename, der bei der Passwortanmeldung verwendet wird.
- `avatarUrl`: gespeicherte Self-Avatar-URL für Profilsynchronisierung und Aktualisierungen mit `profile set`.
- `initialSyncLimit`: maximale Anzahl von Events, die während der Startsynchronisierung abgerufen werden.

### Verschlüsselung

- `encryption`: aktiviert E2EE. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard, wenn E2EE aktiviert ist) oder `"off"`. Fordert beim Start automatisch eine Selbstverifizierung an, wenn dieses Gerät nicht verifiziert ist.
- `startupVerificationCooldownHours`: Abklingzeit bis zur nächsten automatischen Startanforderung. Standard: `24`.

### Zugriff und Richtlinie

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raum-Traffic.
- `dm.enabled`: wenn `false`, alle DMs ignorieren. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Gilt, nachdem der Bot beigetreten ist und den Raum als DM klassifiziert hat; sie wirkt sich nicht auf die Behandlung von Einladungen aus.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Traffic.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: reine DM-Überschreibung für Antwort-Threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: Nachrichten von anderen konfigurierten Matrix-Bot-Konten akzeptieren (`true` oder `"mentions"`).
- `allowlistOnly`: wenn `true`, erzwingt alle aktiven DM-Richtlinien (außer `"disabled"`) und `"open"`-Gruppenrichtlinien auf `"allowlist"`. Ändert keine `"disabled"`-Richtlinien.
- `dangerouslyAllowNameMatching`: wenn `true`, erlaubt die Matrix-Anzeigenamen-Verzeichnissuche für Benutzer-Allowlist-Einträge und die Namenssuche in beigetretenen Räumen für Raum-Allowlist-Schlüssel. Bevorzugen Sie vollständige `@user:server`-IDs und Raum-IDs oder Aliasse.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich DM-ähnlicher Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` `"allowlist"` ist. Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den vom eingeladenen Raum behaupteten Status.
- `contextVisibility`: ergänzende Kontextsichtbarkeit (`"all"` Standard, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"`, `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` oder `"always"`.
- `threadBindings`: Überschreibungen pro Kanal für threadgebundenes Sitzungsrouting und den Lebenszyklus.
- `streaming`: `"off"` (Standard), `"partial"`, `"quiet"` oder Objektform `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wenn `true`, werden abgeschlossene Assistentenblöcke als separate Fortschrittsnachrichten beibehalten.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: ausgehende Chunk-Größe in Zeichen, wenn `chunkMode: "length"`. Standard: `4000`.
- `chunkMode`: `"length"` (Standard, teilt nach Zeichenzahl) oder `"newline"` (teilt an Zeilengrenzen).
- `historyLimit`: Anzahl der letzten Raumnachrichten, die als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standard `0` (deaktiviert).
- `mediaMaxMb`: Größenobergrenze für Medien in MB für ausgehende Sendungen und eingehende Verarbeitung.

### Reaktionseinstellungen

- `ackReaction`: Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: Scope-Überschreibung (`"group-mentions"` Standard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (`"own"` Standard, `"off"`).

### Tooling und Überschreibungen pro Raum

- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: Richtlinienzuordnung pro Raum. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein Legacy-Alias.)
  - `groups.<room>.account`: einen geerbten Raumeintrag auf ein bestimmtes Konto beschränken.
  - `groups.<room>.allowBots`: Überschreibung der Einstellung auf Kanalebene pro Raum (`true` oder `"mentions"`).
  - `groups.<room>.users`: Absender-Allowlist pro Raum.
  - `groups.<room>.tools`: Überschreibungen für Tool-Erlaubnis/-Verweigerung pro Raum.
  - `groups.<room>.autoReply`: Überschreibung des Mention-Gatings pro Raum. `true` deaktiviert Mention-Anforderungen für diesen Raum; `false` erzwingt sie wieder.
  - `groups.<room>.skills`: Skill-Filter pro Raum.
  - `groups.<room>.systemPrompt`: System-Prompt-Ausschnitt pro Raum.

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

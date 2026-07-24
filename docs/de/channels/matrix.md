---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Status der Matrix-Unterstützung, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-07-24T04:21:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa84c7d9d9019040a3fec3cfaabb78590006a4a2dd4bb95836f2cf37072777c5
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein herunterladbares Kanal-Plugin (`@openclaw/matrix`), das auf dem offiziellen `matrix-js-sdk` basiert. Es unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standorte und E2EE.

## Installation

```bash
openclaw plugins install @openclaw/matrix
```

Reine Plugin-Spezifikationen versuchen zuerst ClawHub und greifen dann auf npm zurück. Erzwingen Sie eine Quelle mit `openclaw plugins install clawhub:@openclaw/matrix` oder `npm:@openclaw/matrix`. Aus einem lokalen Checkout: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registriert und aktiviert das Plugin; ein separater Schritt mit `enable` ist nicht erforderlich. Der Kanal bleibt dennoch inaktiv, bis er wie unten beschrieben konfiguriert wurde. Allgemeine Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Einrichtung

1. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
2. Konfigurieren Sie `channels.matrix` mit `homeserver` + `accessToken` oder `homeserver` + `userId` + `password`.
3. Starten Sie den Gateway neu.
4. Beginnen Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein. Neue Einladungen werden nur angenommen, wenn [`autoJoin`](#auto-join) dies zulässt.

### Interaktive Einrichtung

```bash
openclaw channels add
openclaw configure --section channels
```

Der Assistent fragt nach der Homeserver-URL, der Authentifizierungsmethode (Token oder Passwort), der Benutzer-ID (nur bei Passwortauthentifizierung), einem optionalen Gerätenamen, der Aktivierung von E2EE sowie dem Raumzugriff und automatischen Beitritt. Wenn bereits passende `MATRIX_*`-Umgebungsvariablen vorhanden sind und für das Konto keine Authentifizierungsdaten gespeichert wurden, bietet der Assistent eine Abkürzung über Umgebungsvariablen an. Lösen Sie Raumnamen vor dem Speichern einer Zulassungsliste mit `openclaw channels resolve --channel matrix "Project Room"` auf. Die Aktivierung von E2EE im Assistenten führt denselben Bootstrap wie [`openclaw matrix encryption setup`](#encryption-and-verification) aus.

### Minimalkonfiguration

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

`channels.matrix.autoJoin` verwendet standardmäßig `"off"`: Der Bot erscheint bei neuen Einladungen nicht in neuen Räumen oder DMs, bis Sie manuell beitreten. OpenClaw kann zum Zeitpunkt der Einladung nicht erkennen, ob es sich um eine DM oder eine Gruppe handelt. Daher durchläuft jede Einladung zuerst `autoJoin`; `dm.policy` greift erst später, nachdem der Bot beigetreten ist und der Raum klassifiziert wurde.

<Warning>
Legen Sie `autoJoin: "allowlist"` zusammen mit `autoJoinAllowlist` fest, um angenommene Einladungen einzuschränken, oder `autoJoin: "always"`, um jede Einladung anzunehmen.

`autoJoinAllowlist` akzeptiert ausschließlich `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt; Aliasse werden anhand des Homeservers aufgelöst, nicht anhand des vom eingeladenen Raum angegebenen Zustands.
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

### Formate für Ziele in Zulassungslisten

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden standardmäßig ignoriert (veränderlich); legen Sie `dangerouslyAllowNameMatching: true` nur für die ausdrückliche Kompatibilität mit Anzeigenamen fest.
- Schlüssel der Raumzulassungsliste (`groups`, veralteter Alias `rooms`): Verwenden Sie `!room:server` oder `#alias:server`. Einfache Namen werden ignoriert, sofern nicht `dangerouslyAllowNameMatching: true`.
- Einladungszulassungslisten (`autoJoinAllowlist`): Verwenden Sie `!room:server`, `#alias:server` oder `*`. Einfache Namen werden immer abgelehnt.

### Normalisierung der Konto-ID

Der Assistent wandelt einen benutzerfreundlichen Namen in eine normalisierte Konto-ID um (`Ops Bot` -> `ops-bot`). Satzzeichen werden in bereichsspezifischen Namen von Umgebungsvariablen hexadezimal maskiert, damit Konten nicht kollidieren können: `-` (0x2D) wird zu `_X2D_`, sodass `ops-prod` dem Umgebungsvariablenpräfix `MATRIX_OPS_X2D_PROD_` zugeordnet wird.

### Zwischengespeicherte Anmeldedaten

Matrix speichert Kontoanmeldedaten im gemeinsamen Plugin-Zustand `state/openclaw.sqlite` zwischen. Wenn zwischengespeicherte Anmeldedaten vorhanden sind, betrachtet OpenClaw Matrix auch ohne `accessToken` in der Konfigurationsdatei als konfiguriert. Dies gilt für die Einrichtung, `openclaw doctor` und Kanalstatusprüfungen. Bei Upgrades werden die nicht mehr verwendeten `~/.openclaw/credentials/matrix/credentials*.json`-Dateien über `openclaw doctor --fix` importiert, die SQLite-Zeilen überprüft und anschließend die Dateien archiviert.

### Umgebungsvariablen

Durch Konfigurationsschlüssel gestützte Umgebungsvariablen werden verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; bei benannten Konten wird das Konto-Token vor dem Suffix eingefügt (siehe [Normalisierung](#account-id-normalization)).

| Standardkonto       | Benanntes Konto (`<ID>` = Konto-Token) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Für das Konto `ops` lauten die Namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` und so weiter. `MATRIX_HOMESERVER` (sowie jede bereichsspezifische Variante von `*_HOMESERVER`) kann nicht aus einer `.env` im Workspace gesetzt werden; siehe [Workspace-Dateien `.env`](/de/gateway/security).

<Note>
Der Wiederherstellungsschlüssel ist keine durch die Konfiguration gestützte Umgebungsvariable: OpenClaw liest ihn niemals selbst aus der Umgebung. Der Anleitungstext der CLI empfiehlt, ihn für das Standardkonto über eine Shell-Variable namens `MATRIX_RECOVERY_KEY` oder für ein benanntes Konto über `MATRIX_RECOVERY_KEY_<ID>` (einfache großgeschriebene Konto-ID ohne hexadezimale Maskierung) weiterzuleiten – siehe [Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren](#verify-this-device-with-a-recovery-key).
</Note>

## Konfigurationsbeispiel

Eine praktische Basiskonfiguration mit DM-Kopplung, Raumzulassungsliste und E2EE:

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
      streaming: { mode: "partial" },
    },
  },
}
```

## Streaming-Vorschauen

Das Streaming von Matrix-Antworten muss ausdrücklich aktiviert werden. `streaming.mode` steuert, wie OpenClaw die noch laufende Assistentenantwort übermittelt; `streaming.block.enabled` steuert, ob jeder abgeschlossene Block als eigene Matrix-Nachricht erhalten bleibt.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

So behalten Sie Live-Antwortvorschauen bei, blenden aber vorläufige Werkzeug-/Fortschrittszeilen aus:

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

Die vollständige Konfiguration akzeptiert `{ mode, chunkMode, block, preview, progress }`:

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

- `progress.label`: benutzerdefinierte Bezeichnung, `"auto"`/nicht gesetzt, um eine konfigurierte oder integrierte Bezeichnung auszuwählen, oder `false`, um sie auszublenden.
- `progress.labels`: Kandidaten, die nur verwendet werden, wenn `label` auf `"auto"` gesetzt oder nicht gesetzt ist.
- `progress.maxLines`: maximale Anzahl fortlaufender Fortschrittszeilen, die im Entwurf erhalten bleiben; ältere Zeilen werden bei Überschreitung entfernt.
- `progress.maxLineChars`: maximale Zeichenanzahl pro kompakter Fortschrittszeile vor der Kürzung.
- `progress.toolProgress`: Wenn `true` (Standard), werden laufende Werkzeug-/Fortschrittsaktivitäten im Entwurf angezeigt.

| `streaming.mode`  | Verhalten                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (Standard) | Auf die vollständige Antwort warten und sie einmal senden.                                                                                                                      |
| `"partial"`       | Eine normale Textnachricht direkt bearbeiten, während das Modell den aktuellen Block schreibt. Standardclients benachrichtigen möglicherweise bei der ersten Vorschau statt bei der endgültigen Bearbeitung.          |
| `"quiet"`         | Wie `"partial"`, aber die Nachricht ist ein Hinweis ohne Benachrichtigung. Empfänger werden benachrichtigt, sobald eine benutzerspezifische Push-Regel mit der abgeschlossenen Bearbeitung übereinstimmt (siehe unten). |
| `"progress"`      | Sendet mithilfe eines Fortschrittsentwurfs einzelne kompakte Fortschrittszeilen.                                                                                          |

`streaming.block.enabled` (Standard `false`) ist unabhängig von `streaming.mode`:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (Standard)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block; abgeschlossene Blöcke bleiben als Nachrichten erhalten | Live-Entwurf für den aktuellen Block, der direkt fertiggestellt wird |
| `"off"`                 | Eine Matrix-Nachricht mit Benachrichtigung pro abgeschlossenem Block                     | Eine Matrix-Nachricht mit Benachrichtigung für die vollständige Antwort      |

Hinweise:

- Wenn eine Vorschau die Matrix-Größenbeschränkung pro Ereignis überschreitet, beendet OpenClaw das Vorschau-Streaming und greift auf die ausschließliche Übermittlung der endgültigen Antwort zurück.
- Bei Medienantworten werden Anhänge immer normal gesendet. Wenn eine veraltete Vorschau nicht sicher wiederverwendet werden kann, schwärzt OpenClaw sie vor dem Senden der endgültigen Medienantwort.
- Aktualisierungen der Werkzeugfortschrittsvorschau sind standardmäßig aktiviert, wenn Vorschau-Streaming aktiv ist. Legen Sie `streaming.preview.toolProgress: false` fest, um Vorschauänderungen für den Antworttext beizubehalten, den Werkzeugfortschritt jedoch über den normalen Übermittlungsweg zu senden.
- Vorschauänderungen verursachen zusätzliche Matrix-API-Aufrufe. Behalten Sie `streaming.mode: "off"` für das konservativste Ratenbegrenzungsprofil bei.
- Veraltete skalare/boolesche `streaming`-Werte und die flachen Schlüssel `blockStreaming` / `chunkMode` werden durch `openclaw doctor --fix` in diese verschachtelte Struktur umgeschrieben.

## Sprachnachrichten

Eingehende Matrix-Sprachnachrichten werden vor der Raum-Erwähnungsschranke transkribiert. Daher kann eine Sprachnachricht, in der der Name des Bots genannt wird, den Agenten in einem `requireMention: true`-Raum auslösen, und der Agent erhält das Transkript anstelle eines bloßen Platzhalters für einen Audioanhang.

Matrix verwendet den gemeinsamen Provider für Audiomedien unter `tools.media.audio`, beispielsweise OpenAI `gpt-4o-mini-transcribe`. Informationen zur Einrichtung und zu den Beschränkungen des Providers finden Sie in der [Übersicht der Medienwerkzeuge](/de/tools/media-overview).

- `m.audio`-Ereignisse und `m.file`-Ereignisse mit einem MIME-Typ `audio/*` sind geeignet.
- In verschlüsselten Räumen entschlüsselt OpenClaw den Anhang vor der Transkription über den bestehenden Matrix-Medienpfad.
- Das Transkript wird im Agenten-Prompt als maschinell erzeugt und nicht vertrauenswürdig gekennzeichnet.
- Der Anhang wird als bereits transkribiert gekennzeichnet, damit nachgelagerte Medienwerkzeuge ihn nicht erneut transkribieren.
- Setzen Sie `tools.media.audio.enabled: false`, um die Audiotranskription global zu deaktivieren.

## Genehmigungsmetadaten

Native Matrix-Genehmigungsaufforderungen sind normale `m.room.message`-Ereignisse mit OpenClaw-spezifischen Inhalten unter dem Schlüssel `com.openclaw.approval`. Standardclients zeigen weiterhin den Textinhalt an; OpenClaw-kompatible Clients können die strukturierte Genehmigungs-ID, Art, den Status, die Entscheidungen und die Ausführungs-/Plugin-Details auslesen.

Wenn eine Aufforderung für ein einzelnes Matrix-Ereignis zu lang ist, teilt OpenClaw den sichtbaren Text auf und hängt `com.openclaw.approval` nur an den ersten Teil an. Zulassen-/Ablehnen-Reaktionen sind an dieses erste Ereignis gebunden, sodass lange Aufforderungen dasselbe Genehmigungsziel wie Aufforderungen mit nur einem Ereignis behalten.

### Selbst gehostete Push-Regeln für stille, finalisierte Vorschauen

`streaming.mode: "quiet"` benachrichtigt Empfänger erst, wenn ein Block oder Durchlauf finalisiert ist – eine benutzerspezifische Push-Regel muss dem Marker für die finalisierte Vorschau entsprechen. Das vollständige Rezept finden Sie unter [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert. Verwenden Sie `allowBots`, um den Datenverkehr zwischen Agenten gezielt zuzulassen:

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

- `allowBots: true` akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten in zugelassenen Räumen und DMs.
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur, wenn sie diesen Bot sichtbar erwähnen; DMs sind unabhängig davon weiterhin zulässig.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen einzelnen Raum.
- Akzeptierte Nachrichten konfigurierter Bots verwenden den gemeinsamen [Bot-Schleifenschutz](/de/channels/bot-loop-protection). Konfigurieren Sie `channels.defaults.botLoopProtection` und überschreiben Sie die Einstellung anschließend pro Konto mit `channels.matrix.botLoopProtection` oder pro Raum mit `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwortschleifen zu vermeiden.
- Matrix verfügt über keine native Bot-Kennzeichnung; OpenClaw interpretiert „von einem Bot verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Zulassungslisten und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Datenverkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten Räumen (E2EE) verwenden ausgehende Bildereignisse `thumbnail_file`, damit Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden; unverschlüsselte Räume verwenden das unverschlüsselte `thumbnail_url`. Es ist keine Konfiguration erforderlich – das Plugin erkennt den E2EE-Status automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnose), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Einrichtungen mit mehreren Konten). Die Ausgabe ist standardmäßig kompakt.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Initialisiert den geheimen Speicher und die Cross-Signierung, erstellt bei Bedarf eine Sicherung der Raumschlüssel und gibt anschließend den Status und die nächsten Schritte aus. Nützliche Flags:

- `--recovery-key-stdin` liest einen Wiederherstellungsschlüssel aus stdin, ohne ihn in Prozessargumenten offenzulegen; `--recovery-key <key>` bleibt aus Kompatibilitätsgründen verfügbar
- `--force-reset-cross-signing` verwirft die aktuelle Cross-Signierungsidentität und erstellt eine neue (nur zur gezielten Verwendung)

Aktivieren Sie E2EE für ein neues Konto bereits bei dessen Erstellung:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` ist ein Alias für `--enable-e2ee`. Entsprechende manuelle Konfiguration:

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

`verify status` meldet drei unabhängige Vertrauenssignale (`--verbose` zeigt sie alle an):

- `Locally trusted`: nur von diesem Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: Das SDK meldet die Verifizierung per Cross-Signierung
- `Signed by owner`: mit Ihrem eigenen Selbstsignierungsschlüssel signiert (nur zu Diagnosezwecken)

`Verified by owner` ist nur dann `yes`, wenn `Cross-signing verified` den Wert `yes` hat; lokales Vertrauen oder allein eine Eigentümersignatur reicht nicht aus.

`--allow-degraded-local-state` liefert Best-Effort-Diagnosen, ohne das Matrix-Konto zuvor vorzubereiten; dies ist für Offline-Prüfungen oder Prüfungen teilweise konfigurierter Systeme nützlich.

### Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren

Leiten Sie den Wiederherstellungsschlüssel über stdin weiter, statt ihn in der Befehlszeile zu übergeben:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für den geheimen Speicher oder das Gerätevertrauen akzeptiert.
- `Backup usable`: Die Raumschlüsselsicherung kann mit dem vertrauenswürdigen Wiederherstellungsmaterial geladen werden.
- `Device verified by owner`: Dieses Gerät verfügt über vollständiges Vertrauen in die Matrix-Cross-Signierungsidentität.

Der Befehl wird mit einem von null verschiedenen Status beendet, wenn das vollständige Identitätsvertrauen unvollständig ist, selbst wenn der Wiederherstellungsschlüssel Sicherungsmaterial entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung über einen anderen Matrix-Client ab:

```bash
openclaw matrix verify self
```

`verify self` wartet auf `Cross-signing verified: yes`, bevor der Befehl erfolgreich beendet wird. Verwenden Sie `--timeout-ms <ms>`, um die Wartezeit anzupassen.

Die Form mit einem literalen Schlüssel `openclaw matrix verify device "<recovery-key>"` funktioniert ebenfalls, der Schlüssel landet dabei jedoch im Shell-Verlauf.

### Cross-Signierung initialisieren oder reparieren

```bash
openclaw matrix verify bootstrap
```

Der Reparatur-/Einrichtungsbefehl für verschlüsselte Konten. Der Reihe nach führt er Folgendes aus:

- initialisiert den geheimen Speicher und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel erneut
- initialisiert die Cross-Signierung und lädt fehlende öffentliche Schlüssel hoch
- markiert und cross-signiert das aktuelle Gerät
- erstellt eine serverseitige Raumschlüsselsicherung, sofern noch keine vorhanden ist

Wenn der Homeserver UIA zum Hochladen von Cross-Signierungsschlüsseln erfordert, versucht OpenClaw es zunächst ohne Authentifizierung, dann mit `m.login.dummy` und anschließend mit `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (zusammen mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` verwenden) oder `--recovery-key <key>`
- `--force-reset-cross-signing`, um die aktuelle Cross-Signierungsidentität zu verwerfen (nur gezielt verwenden; erfordert, dass der aktive Wiederherstellungsschlüssel gespeichert ist oder mit `--recovery-key-stdin` bereitgestellt wird)

### Raumschlüsselsicherung

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt an, ob eine serverseitige Sicherung vorhanden ist und ob dieses Gerät sie entschlüsseln kann. `backup restore` importiert gesicherte Raumschlüssel in den lokalen Kryptospeicher; lassen Sie `--recovery-key-stdin` weg, wenn der Wiederherstellungsschlüssel bereits auf dem Datenträger gespeichert ist.

So ersetzen Sie eine fehlerhafte Sicherung durch einen neuen Ausgangsstand (dabei wird der Verlust nicht wiederherstellbarer alter Verläufe akzeptiert; außerdem kann der geheime Speicher neu erstellt werden, wenn das aktuelle Sicherungsgeheimnis nicht geladen werden kann):

```bash
openclaw matrix verify backup reset --yes
```

Fügen Sie `--rotate-recovery-key` nur hinzu, wenn der vorherige Wiederherstellungsschlüssel den neuen Sicherungsausgangsstand absichtlich nicht mehr entsperren können soll.

### Verifizierungen auflisten, anfordern und beantworten

```bash
openclaw matrix verify list
```

Listet ausstehende Verifizierungsanfragen für das ausgewählte Konto auf.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Sendet eine Verifizierungsanfrage von diesem Konto. `--own-user` fordert eine Selbstverifizierung an (akzeptieren Sie die Aufforderung in einem anderen Matrix-Client desselben Benutzers); `--user-id`/`--device-id`/`--room-id` richten die Anfrage an eine andere Person. `--own-user` kann nicht mit den anderen Ziel-Flags kombiniert werden.

Für die Verarbeitung des Lebenszyklus auf niedrigerer Ebene – typischerweise beim Spiegeln eingehender Anfragen eines anderen Clients – wirken diese Befehle auf eine bestimmte Anfrage `<id>` (ausgegeben von `verify list` und `verify request`):

| Befehl                                     | Zweck                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Eine eingehende Anfrage akzeptieren                                 |
| `openclaw matrix verify start <id>`        | Den SAS-Ablauf starten                                               |
| `openclaw matrix verify sas <id>`          | Die SAS-Emojis oder Dezimalzahlen ausgeben                          |
| `openclaw matrix verify confirm-sas <id>`  | Bestätigen, dass SAS mit der Anzeige des anderen Clients übereinstimmt |
| `openclaw matrix verify mismatch-sas <id>` | SAS ablehnen, wenn die Emojis oder Dezimalzahlen nicht übereinstimmen |
| `openclaw matrix verify cancel <id>`       | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als Hinweise für eine DM-Folgenachricht, wenn die Verifizierung an einen bestimmten Direktnachrichtenraum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Bei mehreren benannten Konten und ohne `channels.matrix.defaultAccount` verweigern die Befehle eine Schätzung und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehlermeldungen auf den Konfigurationsschlüssel dieses Kontos, beispielsweise `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startverhalten">
    Mit `encryption: true` verwendet `startupVerification` standardmäßig `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät die Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abklingzeit an (standardmäßig 24 Stunden). Passen Sie diese mit `startupVerificationCooldownHours` an oder deaktivieren Sie sie mit `startupVerification: "off"`.

    Beim Start wird außerdem eine konservative Krypto-Initialisierung ausgeführt, die den aktuellen geheimen Speicher und die aktuelle Cross-Signierungsidentität wiederverwendet. Wenn der Initialisierungsstatus fehlerhaft ist, versucht OpenClaw auch ohne `channels.matrix.password` eine abgesicherte Reparatur; wenn der Homeserver eine Passwort-UIA erfordert, protokolliert der Startvorgang eine Warnung und bleibt nicht fatal. Bereits vom Eigentümer signierte Geräte bleiben erhalten.

    Den vollständigen Upgrade-Ablauf finden Sie unter [Matrix-Migration](/de/channels/matrix-migration).

  </Accordion>

  <Accordion title="Verifizierungshinweise">
    Matrix veröffentlicht Hinweise zum Verifizierungslebenszyklus als `m.notice`-Nachrichten im strikt festgelegten DM-Verifizierungsraum: Anfrage, Bereitschaft (mit dem Hinweis „Verify by emoji“), Start/Abschluss sowie SAS-Details (Emoji/Dezimalzahlen), sofern verfügbar.

    Eingehende Anfragen eines anderen Matrix-Clients werden nachverfolgt und automatisch akzeptiert. Bei einer Selbstverifizierung startet OpenClaw den SAS-Ablauf automatisch und bestätigt die eigene Seite, sobald die Emoji-Verifizierung verfügbar ist – Sie müssen die Werte weiterhin vergleichen und in Ihrem Matrix-Client „They match“ bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agenten-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Gelöschtes oder ungültiges Matrix-Gerät">
    Wenn `verify status` angibt, dass das aktuelle Gerät nicht mehr auf dem Homeserver aufgeführt ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für die Anmeldung mit Passwort:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Erstellen Sie für die Token-Authentifizierung ein neues Zugriffstoken in Ihrem Matrix-Client oder der Admin-Benutzeroberfläche und aktualisieren Sie anschließend OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Ersetzen Sie `assistant` durch die Konto-ID aus dem fehlgeschlagenen Befehl, oder lassen Sie `--account` für das Standardkonto weg.

  </Accordion>

  <Accordion title="Gerätebereinigung">
    Alte von OpenClaw verwaltete Geräte können sich ansammeln. Auflisten und bereinigen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kryptospeicher">
    Matrix E2EE verwendet den offiziellen `matrix-js-sdk`-Rust-Kryptografiepfad mit `fake-indexeddb` als IndexedDB-Shim. Der Kryptografiestatus wird unter `crypto-idb-snapshot.json` dauerhaft gespeichert (restriktive Dateiberechtigungen).

    Der verschlüsselte Laufzeitstatus befindet sich unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Synchronisierungsspeicher, Kryptospeicher, Wiederherstellungsschlüssel, IDB-Snapshot, Thread-Bindungen und den Status der Startüberprüfung. Wenn sich das Token ändert, die Kontoidentität jedoch gleich bleibt, verwendet OpenClaw den besten vorhandenen Stamm erneut, sodass der vorherige Status sichtbar bleibt.

    Ein einzelner älterer Token-Hash-Stamm kann ein normaler Kontinuitätspfad für eine Token-Rotation sein. Wenn OpenClaw `matrix: multiple populated token-hash storage roots detected` protokolliert, prüfen Sie das Kontoverzeichnis und archivieren Sie veraltete gleichgeordnete Stammverzeichnisse erst, nachdem Sie bestätigt haben, dass der ausgewählte aktive Stamm fehlerfrei ist. Verschieben Sie veraltete Stammverzeichnisse vorzugsweise in ein Verzeichnis `_archive/`, statt sie sofort zu löschen.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Übergeben Sie beide Optionen in einem Aufruf. Matrix akzeptiert `mxc://`-Avatar-URLs direkt; bei Übergabe von `http://`/`https://` wird die Datei zuerst hochgeladen und die aufgelöste `mxc://`-URL in `channels.matrix.avatarUrl` (oder der kontospezifischen Überschreibung) gespeichert.

## Threads

Matrix unterstützt native Threads sowohl für automatische Antworten als auch für Sendevorgänge des Nachrichten-Tools. Zwei unabhängige Einstellungen steuern das Verhalten:

### Sitzungsrouting (`sessionScope`)

`dm.sessionScope` bestimmt, wie Matrix-DM-Räume OpenClaw-Sitzungen zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Kommunikationspartner teilen sich eine Sitzung.
- `"per-room"`: Jeder Matrix-DM-Raum erhält einen eigenen Sitzungsschlüssel, selbst für denselben Kommunikationspartner.

Explizite Konversationsbindungen haben stets Vorrang vor `sessionScope`; gebundene Räume und Threads behalten ihre gewählte Zielsitzung.

### Antwort-Threads (`threadReplies`)

`threadReplies` bestimmt, wo der Bot seine Antwort veröffentlicht:

- `"off"`: Antworten werden auf der obersten Ebene veröffentlicht. Eingehende Nachrichten in Threads verbleiben in der übergeordneten Sitzung.
- `"inbound"`: Es wird nur dann innerhalb eines Threads geantwortet, wenn sich die eingehende Nachricht bereits in diesem Thread befand.
- `"always"`: Es wird innerhalb eines Threads geantwortet, dessen Wurzel die auslösende Nachricht ist; diese Konversation wird ab dem ersten Auslöser über eine passende Thread-bezogene Sitzung geroutet.

`dm.threadReplies` überschreibt dies ausschließlich für DMs – beispielsweise können Raum-Threads isoliert bleiben, während DMs ohne Threads geführt werden.

### Thread-Vererbung und Slash-Befehle

- Eingehende Nachrichten in Threads enthalten die Thread-Wurzelnachricht als zusätzlichen Agent-Kontext.
- Sendevorgänge des Nachrichten-Tools übernehmen automatisch den aktuellen Matrix-Thread, wenn sie denselben Raum (oder dasselbe DM-Benutzerziel) adressieren, sofern kein expliziter `threadId` angegeben ist.
- Die Wiederverwendung eines DM-Benutzerziels greift nur, wenn die Metadaten der aktuellen Sitzung denselben DM-Kommunikationspartner im selben Matrix-Konto nachweisen; andernfalls greift OpenClaw auf das normale benutzerbezogene Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und das Thread-gebundene `/acp spawn` funktionieren alle in Matrix-Räumen und DMs.
- `/focus` auf oberster Ebene erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSessions` aktiviert ist.
- Das Ausführen von `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads bindet diesen Thread an Ort und Stelle.

Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsam genutzten Sitzung kollidiert, veröffentlicht es einmalig `m.notice` mit einem Verweis auf den Ausweg `/focus` und dem Vorschlag, `dm.sessionScope` zu ändern. Der Hinweis erscheint nur, wenn Thread-Bindungen aktiviert sind.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können zu dauerhaften ACP-Arbeitsbereichen werden, ohne die Chatoberfläche zu ändern.

Schneller Ablauf für Betreiber:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des bestehenden Threads aus, den Sie weiterverwenden möchten.
- In einer DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chatoberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geroutet.
- Innerhalb eines bestehenden Threads bindet `--bind here` den aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

`--bind here` erstellt keinen untergeordneten Matrix-Thread. `threadBindings.spawnSessions` steuert `/acp spawn --thread auto|here`, wobei OpenClaw einen untergeordneten Thread erstellen oder binden muss.

### Konfiguration der Thread-Bindung

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt kanalspezifische Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: steuert sowohl die Erzeugung von Subagent- als auch ACP-Threads.
- Veraltete Schlüssel `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions` werden durch `openclaw doctor --fix` zu `spawnSessions` migriert.
- `threadBindings.defaultSpawnContext`

Das Erzeugen Matrix-Thread-gebundener Sitzungen ist standardmäßig aktiviert. Setzen Sie `threadBindings.spawnSessions: false`, um zu verhindern, dass `/focus` und `/acp spawn --thread auto|here` auf oberster Ebene Matrix-Threads erstellen bzw. binden. Setzen Sie `threadBindings.defaultSpawnContext: "isolated"`, wenn beim nativen Erzeugen von Subagent-Threads das übergeordnete Transkript nicht verzweigt werden soll.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, Benachrichtigungen über eingehende Reaktionen und Bestätigungsreaktionen.

Das Werkzeug für ausgehende Reaktionen wird durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bots.

**Auflösungsreihenfolge** (der erste definierte Wert hat Vorrang):

| Einstellung                 | Reihenfolge                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | kontospezifisch -> Kanal -> `messages.ackReaction` -> Emoji-Fallback der Agent-Identität   |
| `ackReactionScope`      | kontospezifisch -> Kanal -> `messages.ackReactionScope` -> Standard `"group-mentions"` |
| `reactionNotifications` | kontospezifisch -> Kanal -> Standard `"own"`                                           |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten abzielen; `"off"` deaktiviert Reaktions-Systemereignisse. Das Entfernen von Reaktionen wird nicht als Systemereignis synthetisiert – Matrix stellt dies als Schwärzungen dar, nicht als eigenständiges Entfernen von `m.reaction`.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standardwert `0`, wenn beide nicht gesetzt sind (deaktiviert).
- Der Matrix-Raumverlauf gilt nur für Räume; DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Raumverlauf umfasst nur ausstehende Nachrichten: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle auslösende Nachricht ist nicht in `InboundHistory` enthalten; sie verbleibt für diesen Durchlauf im eingehenden Haupttext.
- Wiederholungsversuche desselben Matrix-Ereignisses verwenden erneut den ursprünglichen Verlaufssnapshot, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Wurzeln und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standardwert. Ergänzender Kontext bleibt wie empfangen erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die von den aktiven Raum-/Benutzer-Zulassungslistenprüfungen zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält jedoch weiterhin eine explizit zitierte Antwort bei.

Dies betrifft nur die Sichtbarkeit des ergänzenden Kontexts, nicht die Frage, ob die eingehende Nachricht selbst eine Antwort auslösen kann. Die Auslöseberechtigung ergibt sich weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Unter [Gruppen](/de/channels/groups) finden Sie Informationen zum Erwähnungs-Gating und zum Verhalten von Zulassungslisten.

Kopplungsbeispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Kopplungscode erneut und sendet nach einer kurzen Abklingzeit möglicherweise eine Erinnerungsantwort, statt einen neuen Code zu erzeugen.

Unter [Kopplung](/de/channels/pairing) finden Sie Informationen zum gemeinsamen DM-Kopplungsablauf und zur Speicherstruktur.

## Reparatur direkter Räume

Wenn der Direktnachrichtenstatus abweicht, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Einzelräume statt auf die aktive DM verweisen. Prüfen Sie die aktuelle Zuordnung für einen Kommunikationspartner:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide Befehle akzeptieren `--account <id>` für Konfigurationen mit mehreren Konten. Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt auf eine beliebige aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine fehlerfreie DM vorhanden ist

Alte Räume werden nicht automatisch gelöscht. Der Ablauf wählt die fehlerfreie DM aus und aktualisiert die Zuordnung, damit zukünftige Matrix-Sendevorgänge, Verifizierungshinweise und andere Direktnachrichtenabläufe den richtigen Raum adressieren.

## Ausführungsgenehmigungen

Matrix kann als nativer Genehmigungsclient fungieren. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder `channels.matrix.accounts.<account>.execApprovals` für eine kontospezifische Überschreibung):

- `enabled`: stellt Genehmigungen über Matrix-native Eingabeaufforderungen zu. Nicht gesetzt oder `"auto"` aktiviert dies automatisch, sobald mindestens ein Genehmigender aufgelöst werden kann; setzen Sie `false`, um es explizit zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Ausführungsanfragen genehmigen dürfen. Fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: wohin Eingabeaufforderungen gesendet werden. `"dm"` (Standard) sendet sie an die DMs der Genehmigenden; `"channel"` sendet sie an den ursprünglichen Raum oder die ursprüngliche DM; `"both"` sendet sie an beide.
- `agentFilter` / `sessionFilter`: optionale Zulassungslisten dafür, welche Agents/Sitzungen eine Zustellung über Matrix auslösen.

Die Autorisierung unterscheidet sich geringfügig zwischen den Genehmigungsarten:

- **Exec-Genehmigungen** verwenden `execApprovals.approvers`, mit Rückgriff auf `dm.allowFrom`.
- **Plugin-Genehmigungen** autorisieren ausschließlich über `dm.allowFrom`.

Beide Arten nutzen dieselben Matrix-Reaktionskürzel und Nachrichtenaktualisierungen. Genehmigende sehen Reaktionskürzel in der primären Genehmigungsnachricht:

- ✅ einmal zulassen
- ❌ ablehnen
- ♾️ immer zulassen (wenn die effektive Exec-Richtlinie dies erlaubt)

Ausweichende Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Die Kanalzustellung für Exec-Genehmigungen enthält den Befehlstext – aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandt: [Exec-Genehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in Direktnachrichten. In Räumen erkennt OpenClaw außerdem Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist. Daher löst `@bot:server /new` den Befehlspfad ohne einen benutzerdefinierten regulären Ausdruck für Erwähnungen aus. Dadurch reagiert der Bot weiterhin auf raumtypische `@mention /command`-Beiträge, die Element und ähnliche Clients erzeugen, wenn ein Benutzer den Bot per Tab-Vervollständigung auswählt, bevor er den Befehl eingibt.

Die Autorisierungsregeln gelten weiterhin: Absender von Befehlen müssen dieselben Zulassungslisten- oder Eigentümerrichtlinien für Direktnachrichten beziehungsweise Räume erfüllen wie bei normalen Nachrichten.

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

- Übergeordnete `channels.matrix`-Werte dienen als Standardwerte für benannte Konten, sofern sie nicht vom jeweiligen Konto überschrieben werden.
- Beschränken Sie einen geerbten Raumeintrag mit `groups.<room>.account` auf ein bestimmtes Konto. Einträge ohne `account` werden kontenübergreifend gemeinsam genutzt; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf der obersten Ebene konfiguriert ist.

**Auswahl des Standardkontos:**

- Legen Sie `defaultAccount` fest, um das benannte Konto auszuwählen, das bei implizitem Routing, Prüfungen und CLI-Befehlen bevorzugt wird.
- Wenn Sie mehrere Konten haben und eines davon tatsächlich `default` heißt, verwendet OpenClaw es implizit, selbst wenn `defaultAccount` nicht festgelegt ist.
- Bei mehreren benannten Konten ohne ausgewähltes Standardkonto verweigern CLI-Befehle eine Vermutung – legen Sie `defaultAccount` fest oder übergeben Sie `--account <id>`.
- Der übergeordnete `channels.matrix.*`-Block wird nur dann als implizites `default`-Konto behandelt, wenn seine Authentifizierung vollständig ist (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben über `homeserver` + `userId` auffindbar, sobald zwischengespeicherte Anmeldedaten die Authentifizierung abdecken.

**Überführung:**

- Wenn OpenClaw während einer Reparatur oder Einrichtung eine Einzelkontokonfiguration in eine Mehrkontenkonfiguration überführt, behält es das vorhandene benannte Konto bei, sofern eines vorhanden ist oder `defaultAccount` bereits auf eines verweist. Nur Matrix-Schlüssel für Authentifizierung und Bootstrap werden in das überführte Konto verschoben; gemeinsam verwendete Schlüssel für Zustellungsrichtlinien verbleiben auf der obersten Ebene.

Das gemeinsame Mehrkontenmuster finden Sie in der [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels).

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw zum Schutz vor SSRF private/interne Matrix-Homeserver, sofern Sie dies nicht für jedes Konto ausdrücklich zulassen.

Wenn Ihr Homeserver auf localhost, einer LAN-/Tailscale-IP oder einem internen Hostnamen ausgeführt wird, aktivieren Sie `network.dangerouslyAllowPrivateNetwork` für dieses Konto:

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

Diese ausdrückliche Zulassung erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie `http://matrix.example.org:8008` bleiben blockiert. Verwenden Sie nach Möglichkeit `https://`.

## Matrix-Datenverkehr über einen Proxy leiten

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

Benannte Konten können den übergeordneten Standardwert mit `channels.matrix.accounts.<id>.proxy` überschreiben. OpenClaw verwendet dieselbe Proxy-Einstellung für den Matrix-Datenverkehr zur Laufzeit und für Kontostatusprüfungen.

## Zielauflösung

Matrix akzeptiert die folgenden Zielformate überall dort, wo OpenClaw ein Raum- oder Benutzerziel anfordert:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Bei Matrix-Raum-IDs wird zwischen Groß- und Kleinschreibung unterschieden. Verwenden Sie beim Konfigurieren expliziter Zustellungsziele, Cron-Aufgaben, Bindungen oder Zulassungslisten exakt die Groß- und Kleinschreibung der Raum-ID aus Matrix. OpenClaw speichert interne Sitzungsschlüssel in kanonischer Form, daher sind diese kleingeschriebenen Schlüssel keine zuverlässige Quelle für Matrix-Zustellungs-IDs.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt. Die Namenssuche in beigetretenen Räumen erfolgt nach bestem Bemühen und gilt nur für Raum-Zulassungslisten zur Laufzeit, wenn `dangerouslyAllowNameMatching: true` festgelegt ist.
- Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er bei der Auflösung der Laufzeit-Zulassungsliste ignoriert.

## Konfigurationsreferenz

Benutzerfelder im Stil von Zulassungslisten (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs; dies ist die sicherste Variante. Einträge, die keine IDs sind, werden standardmäßig ignoriert. Wenn `dangerouslyAllowNameMatching: true` festgelegt ist, werden exakte Übereinstimmungen mit Matrix-Anzeigenamen im Verzeichnis beim Start sowie bei jeder Änderung der Zulassungsliste während der Ausführung des Monitors aufgelöst; nicht auflösbare Einträge werden zur Laufzeit ignoriert.

Schlüssel für Raum-Zulassungslisten (`groups`, veraltet: `rooms`) sollten Raum-IDs oder Aliasse sein. Einfache Raumnamen als Schlüssel werden standardmäßig ignoriert; `dangerouslyAllowNameMatching: true` stellt die bestmögliche Suche in den Namen beigetretener Räume wieder her.

### Konto und Verbindung

- `enabled`: Kanal aktivieren oder deaktivieren.
- `name`: optionale Anzeigebezeichnung für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: benannte kontospezifische Überschreibungen. Übergeordnete `channels.matrix`-Werte werden als Standardwerte vererbt.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Konto Verbindungen mit `localhost`, LAN-/Tailscale-IPs oder internen Hostnamen erlauben.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Kontospezifische Überschreibungen werden unterstützt.
- `userId`: vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartext- und SecretRef-Werte werden bei Umgebungs-, Datei- und Exec-Providern unterstützt ([Secret-Verwaltung](/de/gateway/secrets)).
- `password`: Passwort für die passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: bei der Passwortanmeldung verwendeter Geräteanzeigename.
- `avatarUrl`: gespeicherte URL des eigenen Avatars für die Profilsynchronisierung und Aktualisierungen von `profile set`.
- `initialSyncLimit`: maximale Anzahl der während der Startsynchronisierung abgerufenen Ereignisse.

### Verschlüsselung

- `encryption`: E2EE aktivieren. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard bei aktiviertem E2EE) oder `"off"`. Fordert beim Start automatisch eine Selbstverifizierung an, wenn dieses Gerät nicht verifiziert ist.
- `startupVerificationCooldownHours`: Abklingzeit bis zur nächsten automatischen Startanforderung. Standard: `24`.

### Zugriff und Richtlinien

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Zulassungsliste von Benutzer-IDs für Raumdatenverkehr.
- `mentionPatterns`: bereichsbezogene reguläre Ausdrucksmuster für Raumerwähnungen. Objekt mit `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Steuert, ob konfigurierte `agents.entries.*.groupChat.mentionPatterns` raumspezifisch gelten.
- `dm.enabled`: wenn `false`, alle Direktnachrichten ignorieren. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Gilt, nachdem der Bot dem Raum beigetreten ist und ihn als Direktnachricht klassifiziert hat; die Verarbeitung von Einladungen ist davon nicht betroffen.
- `dm.allowFrom`: Zulassungsliste von Benutzer-IDs für Direktnachrichtenverkehr.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: ausschließlich für Direktnachrichten geltende Überschreibung der Antwortverkettung (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: Nachrichten von anderen konfigurierten Matrix-Bot-Konten akzeptieren (`true` oder `"mentions"`).
- `allowlistOnly`: wenn `true`, werden alle aktiven Richtlinien für Direktnachrichten (außer `"disabled"`) und `"open"`-Gruppenrichtlinien auf `"allowlist"` gesetzt. `"disabled"`-Richtlinien werden nicht geändert.
- `dangerouslyAllowNameMatching`: wenn `true`, werden die Verzeichnissuche nach Matrix-Anzeigenamen für Einträge in Benutzer-Zulassungslisten und die Namenssuche in beigetretenen Räumen für Schlüssel in Raum-Zulassungslisten ermöglicht. Bevorzugen Sie vollständige `@user:server`-IDs sowie Raum-IDs oder Aliasse.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich Einladungen im Stil von Direktnachrichten.
- `autoJoinAllowlist`: zulässige Räume/Aliasse, wenn `autoJoin` den Wert `"allowlist"` hat. Alias-Einträge werden anhand des Homeservers aufgelöst, nicht anhand des vom eingeladenen Raum beanspruchten Zustands.
- `contextVisibility`: ergänzende Kontextsichtbarkeit (`"all"` als Standard, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"` (Standard), `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"` (der Standardwert auf oberster Ebene wird in `"inbound"` aufgelöst, sofern er nicht ausdrücklich festgelegt ist), `"inbound"` oder `"always"`.
- `threadBindings`: kanalspezifische Überschreibungen für das Routing und den Lebenszyklus threadgebundener Sitzungen.
- `streaming`: verschachteltes Objekt `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode` ist `"off"` (Standard), `"partial"`, `"quiet"` oder `"progress"`. Veraltete skalare bzw. boolesche Schreibweisen werden über `openclaw doctor --fix` migriert.
- `streaming.block.enabled`: Wenn `true` festgelegt ist, werden abgeschlossene Assistentenblöcke als separate Fortschrittsmeldungen beibehalten. Standard: `false`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: ausgehende Blockgröße in Zeichen, wenn `streaming.chunkMode: "length"`. Standard: `4000`.
- `streaming.chunkMode`: `"length"` (Standard, teilt nach Zeichenanzahl) oder `"newline"` (teilt an Zeilengrenzen).
- `historyLimit`: Anzahl der neuesten Raumnachrichten, die als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standardwert: `0` (deaktiviert).
- `mediaMaxMb`: Obergrenze der Mediengröße in MB für ausgehendes Senden und eingehende Verarbeitung. Standard: `20`.

### Reaktionseinstellungen

- `ackReaction`: Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: Bereichsüberschreibung (`"group-mentions"` standardmäßig, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (`"own"` standardmäßig, `"off"`).

### Werkzeuge und raumspezifische Überschreibungen

- `actions`: aktionsbezogene Tool-Zugriffssteuerung (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: raumbezogene Richtlinienzuordnung. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein veralteter Alias.)
  - `groups.<room>.account`: beschränkt einen geerbten Raumeintrag auf ein bestimmtes Konto.
  - `groups.<room>.enabled`: raumbezogener Schalter. Wenn `false`, wird der Raum ignoriert, als wäre er nicht in der Zuordnung enthalten.
  - `groups.<room>.requireMention`: raumbezogene Überschreibung der Erwähnungsanforderung auf Kanalebene.
  - `groups.<room>.allowBots`: raumbezogene Überschreibung der Einstellung auf Kanalebene (`true` oder `"mentions"`).
  - `groups.<room>.botLoopProtection`: raumbezogene Überschreibung des Budgets für den Schutz vor Bot-zu-Bot-Schleifen.
  - `groups.<room>.users`: raumbezogene Positivliste der Absender.
  - `groups.<room>.tools`: raumbezogene Überschreibungen zum Zulassen oder Verweigern von Tools.
  - `groups.<room>.autoReply`: raumbezogene Überschreibung der Erwähnungszugriffssteuerung. `true` deaktiviert die Erwähnungsanforderungen für diesen Raum; `false` aktiviert sie wieder zwingend.
  - `groups.<room>.skills`: raumbezogener Skills-Filter.
  - `groups.<room>.systemPrompt`: raumbezogener Ausschnitt des System-Prompts.

### Einstellungen für Ausführungsgenehmigungen

- `execApprovals.enabled`: Ausführungsgenehmigungen über Matrix-native Eingabeaufforderungen zustellen.
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Genehmigungen erteilen dürfen. Fällt auf `dm.allowFrom` zurück.
- `execApprovals.target`: `"dm"` (Standard), `"channel"` oder `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionale Positivlisten für Agenten/Sitzungen zur Zustellung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Erwähnungszugriffssteuerung
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Absicherung

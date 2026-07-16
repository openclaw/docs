---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Status der Matrix-Unterstützung, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-07-16T12:26:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca704ff911dbe97242d42727561fbce59f27e190343d2343dfad46289c1e0b94
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein herunterladbares Kanal-Plugin (`@openclaw/matrix`), das auf dem offiziellen `matrix-js-sdk` basiert. Es unterstützt Direktnachrichten, Räume, Threads, Medien, Reaktionen, Umfragen, Standorte und E2EE.

## Installation

```bash
openclaw plugins install @openclaw/matrix
```

Reine Plugin-Spezifikationen versuchen zuerst ClawHub und greifen dann auf npm zurück. Erzwingen Sie eine Quelle mit `openclaw plugins install clawhub:@openclaw/matrix` oder `npm:@openclaw/matrix`. Aus einem lokalen Checkout: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registriert und aktiviert das Plugin; ein separater Schritt `enable` ist nicht erforderlich. Der Kanal bleibt dennoch inaktiv, bis er wie unten beschrieben konfiguriert wird. Allgemeine Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Einrichtung

1. Erstellen Sie auf Ihrem Homeserver ein Matrix-Konto.
2. Konfigurieren Sie `channels.matrix` mit `homeserver` + `accessToken` oder `homeserver` + `userId` + `password`.
3. Starten Sie das Gateway neu.
4. Beginnen Sie eine Direktnachrichten-Unterhaltung mit dem Bot oder laden Sie ihn in einen Raum ein. Neue Einladungen werden nur angenommen, wenn [`autoJoin`](#auto-join) sie zulässt.

### Interaktive Einrichtung

```bash
openclaw channels add
openclaw configure --section channels
```

Der Assistent fragt nach der Homeserver-URL, der Authentifizierungsmethode (Token oder Passwort), der Benutzer-ID (nur bei Passwortauthentifizierung), einem optionalen Gerätenamen, der Aktivierung von E2EE sowie dem Raumzugriff und automatischen Beitritt. Wenn passende `MATRIX_*`-Umgebungsvariablen bereits vorhanden sind und für das Konto keine Authentifizierungsdaten gespeichert wurden, bietet der Assistent eine Abkürzung über Umgebungsvariablen an. Lösen Sie Raumnamen mit `openclaw channels resolve --channel matrix "Project Room"` auf, bevor Sie eine Zulassungsliste speichern. Die Aktivierung von E2EE im Assistenten führt denselben Bootstrap-Vorgang wie [`openclaw matrix encryption setup`](#encryption-and-verification) aus.

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

`channels.matrix.autoJoin` verwendet standardmäßig `"off"`: Der Bot erscheint nach neuen Einladungen erst in neuen Räumen oder Direktnachrichten, wenn Sie manuell beitreten. OpenClaw kann zum Zeitpunkt der Einladung nicht feststellen, ob es sich um eine Direktnachricht oder eine Gruppe handelt. Daher wird jede Einladung zunächst anhand von `autoJoin` geprüft; `dm.policy` wird erst später angewendet, nachdem der Bot beigetreten und der Raum klassifiziert wurde.

<Warning>
Legen Sie `autoJoin: "allowlist"` zusammen mit `autoJoinAllowlist` fest, um angenommene Einladungen einzuschränken, oder `autoJoin: "always"`, um jede Einladung anzunehmen.

`autoJoinAllowlist` akzeptiert nur `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt; Aliasse werden über den Homeserver aufgelöst, nicht anhand des Zustands, den der einladende Raum angibt.
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

- Direktnachrichten (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden standardmäßig ignoriert, da sie veränderlich sind; legen Sie `dangerouslyAllowNameMatching: true` nur für eine ausdrücklich gewünschte Kompatibilität mit Anzeigenamen fest.
- Schlüssel für Raum-Zulassungslisten (`groups`, veralteter Alias `rooms`): Verwenden Sie `!room:server` oder `#alias:server`. Einfache Namen werden ignoriert, sofern nicht `dangerouslyAllowNameMatching: true` festgelegt ist.
- Einladungs-Zulassungslisten (`autoJoinAllowlist`): Verwenden Sie `!room:server`, `#alias:server` oder `*`. Einfache Namen werden immer abgelehnt.

### Normalisierung der Konto-ID

Der Assistent wandelt einen benutzerfreundlichen Namen in eine normalisierte Konto-ID um (`Ops Bot` -> `ops-bot`). Satzzeichen werden in bereichsspezifischen Umgebungsvariablennamen hexadezimal maskiert, damit keine Kontenkollisionen auftreten können: `-` (0x2D) wird zu `_X2D_`, sodass `ops-prod` dem Umgebungsvariablenpräfix `MATRIX_OPS_X2D_PROD_` zugeordnet wird.

### Zwischengespeicherte Anmeldedaten

Matrix speichert Anmeldedaten unter `~/.openclaw/credentials/matrix/` zwischen: `credentials.json` für das Standardkonto und `credentials-<account>.json` für benannte Konten. Wenn zwischengespeicherte Anmeldedaten vorhanden sind, betrachtet OpenClaw Matrix auch ohne `accessToken` in der Konfigurationsdatei als konfiguriert. Dies gilt für die Einrichtung, `openclaw doctor` und Prüfungen des Kanalstatus.

### Umgebungsvariablen

Von Konfigurationsschlüsseln abgeleitete Umgebungsvariablen werden verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; bei benannten Konten wird das Konto-Token vor dem Suffix eingefügt (siehe [Normalisierung](#account-id-normalization)).

| Standardkonto       | Benanntes Konto (`<ID>` = Konto-Token) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Für das Konto `ops` werden die Namen zu `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` und so weiter. `MATRIX_HOMESERVER` (sowie jede bereichsspezifische Variante von `*_HOMESERVER`) kann nicht über eine `.env` des Arbeitsbereichs festgelegt werden; siehe [`.env`-Dateien des Arbeitsbereichs](/de/gateway/security).

<Note>
Der Wiederherstellungsschlüssel ist keine durch die Konfiguration gestützte Umgebungsvariable: OpenClaw liest ihn niemals selbst aus der Umgebung. Der Anleitungstext der CLI empfiehlt, ihn für das Standardkonto über eine Shell-Variable namens `MATRIX_RECOVERY_KEY` oder für ein benanntes Konto über `MATRIX_RECOVERY_KEY_<ID>` (einfache, in Großbuchstaben umgewandelte Konto-ID ohne hexadezimale Maskierung) weiterzuleiten; siehe [Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren](#verify-this-device-with-a-recovery-key).
</Note>

## Konfigurationsbeispiel

Eine praktische Ausgangskonfiguration mit Direktnachrichten-Kopplung, Raum-Zulassungsliste und E2EE:

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

Das Streaming von Matrix-Antworten muss ausdrücklich aktiviert werden. `streaming.mode` steuert, wie OpenClaw die noch entstehende Assistentenantwort übermittelt; `streaming.block.enabled` steuert, ob jeder abgeschlossene Block als eigene Matrix-Nachricht erhalten bleibt.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

So behalten Sie Live-Antwortvorschauen bei, blenden aber vorläufige Werkzeug- und Fortschrittszeilen aus:

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

- `progress.label`: benutzerdefinierte Bezeichnung, `"auto"`/nicht festgelegt zur Auswahl einer konfigurierten oder integrierten Bezeichnung oder `false`, um sie auszublenden.
- `progress.labels`: Kandidaten, die nur verwendet werden, wenn `label` den Wert `"auto"` hat oder nicht festgelegt ist.
- `progress.maxLines`: maximale Anzahl fortlaufender Fortschrittszeilen, die im Entwurf beibehalten werden; ältere Zeilen werden bei Überschreitung entfernt.
- `progress.maxLineChars`: maximale Zeichenanzahl pro kompakter Fortschrittszeile vor dem Abschneiden.
- `progress.toolProgress`: Wenn `true` festgelegt ist (Standard), werden aktuelle Werkzeug- und Fortschrittsaktivitäten im Entwurf angezeigt.

| `streaming.mode`  | Verhalten                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (Standard) | Auf die vollständige Antwort warten und sie einmal senden.                                                                                                                      |
| `"partial"`       | Eine normale Textnachricht direkt bearbeiten, während das Modell den aktuellen Block schreibt. Standard-Clients benachrichtigen möglicherweise bei der ersten Vorschau statt bei der abschließenden Bearbeitung.          |
| `"quiet"`         | Wie `"partial"`, aber die Nachricht ist ein Hinweis ohne Benachrichtigung. Empfänger werden benachrichtigt, sobald eine benutzerspezifische Push-Regel auf die abgeschlossene Bearbeitung zutrifft (siehe unten). |
| `"progress"`      | Sendet einzelne kompakte Fortschrittszeilen mithilfe eines Fortschrittsentwurfs.                                                                                          |

`streaming.block.enabled` (Standard `false`) ist unabhängig von `streaming.mode`:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (Standard)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block; abgeschlossene Blöcke bleiben als Nachrichten erhalten | Live-Entwurf für den aktuellen Block, der direkt abgeschlossen wird |
| `"off"`                 | Eine Matrix-Nachricht mit Benachrichtigung pro abgeschlossenem Block                     | Eine Matrix-Nachricht mit Benachrichtigung für die vollständige Antwort      |

Hinweise:

- Wenn eine Vorschau die Größenbeschränkung von Matrix pro Ereignis überschreitet, beendet OpenClaw das Vorschau-Streaming und greift auf die ausschließliche Übermittlung der endgültigen Antwort zurück.
- Medienantworten senden Anhänge immer auf normale Weise; wenn eine veraltete Vorschau nicht sicher wiederverwendet werden kann, schwärzt OpenClaw sie vor dem Senden der endgültigen Medienantwort.
- Aktualisierungen der Werkzeugfortschrittsvorschau sind standardmäßig aktiviert, wenn Vorschau-Streaming aktiv ist. Legen Sie `streaming.preview.toolProgress: false` fest, um Vorschauänderungen für den Antworttext beizubehalten, den Werkzeugfortschritt jedoch über den normalen Übermittlungsweg zu senden.
- Vorschauänderungen verursachen zusätzliche Matrix-API-Aufrufe. Belassen Sie `streaming.mode: "off"`, um das konservativste Profil für Ratenbegrenzungen zu verwenden.
- Veraltete skalare oder boolesche `streaming`-Werte sowie die flachen Schlüssel `blockStreaming` / `chunkMode` werden durch `openclaw doctor --fix` in diese verschachtelte Struktur umgeschrieben.

## Sprachnachrichten

Eingehende Matrix-Sprachnachrichten werden vor der Erwähnungsprüfung des Raums transkribiert. Daher kann eine Sprachnachricht, in der der Name des Bots genannt wird, den Agenten in einem `requireMention: true`-Raum auslösen, und der Agent erhält das Transkript statt nur eines Platzhalters für einen Audioanhang.

Matrix verwendet den gemeinsamen Provider für Audiomedien unter `tools.media.audio`, beispielsweise OpenAI `gpt-4o-mini-transcribe`. Informationen zur Einrichtung des Providers und zu den Beschränkungen finden Sie in der [Übersicht der Medienwerkzeuge](/de/tools/media-overview).

- `m.audio`-Ereignisse und `m.file`-Ereignisse mit einem `audio/*`-MIME-Typ kommen infrage.
- In verschlüsselten Räumen entschlüsselt OpenClaw den Anhang vor der Transkription über den bestehenden Matrix-Medienpfad.
- Das Transkript wird im Agent-Prompt als maschinell erstellt und nicht vertrauenswürdig gekennzeichnet.
- Der Anhang wird als bereits transkribiert gekennzeichnet, damit nachgelagerte Medienwerkzeuge ihn nicht erneut transkribieren.
- Setzen Sie `tools.media.audio.enabled: false`, um die Audiotranskription global zu deaktivieren.

## Genehmigungsmetadaten

Native Matrix-Genehmigungsaufforderungen sind normale `m.room.message`-Ereignisse mit OpenClaw-spezifischen Inhalten unter dem Schlüssel `com.openclaw.approval`. Standardclients stellen weiterhin den Textkörper dar; OpenClaw-kompatible Clients können die strukturierte Genehmigungs-ID, Art, den Status, die Entscheidungen sowie Ausführungs-/Plugin-Details lesen.

Wenn eine Aufforderung für ein einzelnes Matrix-Ereignis zu lang ist, unterteilt OpenClaw den sichtbaren Text und fügt `com.openclaw.approval` nur dem ersten Teil hinzu. Zulassen-/Ablehnen-Reaktionen werden diesem ersten Ereignis zugeordnet, sodass lange Aufforderungen dasselbe Genehmigungsziel wie Aufforderungen mit nur einem Ereignis behalten.

### Selbst gehostete Push-Regeln für stille finalisierte Vorschauen

`streaming.mode: "quiet"` benachrichtigt Empfänger erst, wenn ein Block oder Durchlauf finalisiert ist – eine benutzerspezifische Push-Regel muss dem Marker für die finalisierte Vorschau entsprechen. Das vollständige Rezept finden Sie unter [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert. Verwenden Sie `allowBots`, um den Datenverkehr zwischen Agents gezielt zuzulassen:

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

- `allowBots: true` akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten in zugelassenen Räumen und Direktnachrichten.
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur, wenn sie diesen Bot sichtbar erwähnen; Direktnachrichten sind unabhängig davon weiterhin zulässig.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen einzelnen Raum.
- Akzeptierte Nachrichten konfigurierter Bots verwenden den gemeinsamen [Bot-Schleifenschutz](/de/channels/bot-loop-protection). Konfigurieren Sie `channels.defaults.botLoopProtection` und überschreiben Sie die Einstellung anschließend pro Konto mit `channels.matrix.botLoopProtection` oder pro Raum mit `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw ignoriert weiterhin Nachrichten mit derselben Matrix-Benutzer-ID, um Selbstantwortschleifen zu vermeiden.
- Matrix besitzt keine native Bot-Kennzeichnung; OpenClaw interpretiert „von einem Bot verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Zulassungslisten und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Datenverkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten Räumen (E2EE) verwenden ausgehende Bildereignisse `thumbnail_file`, damit Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden; unverschlüsselte Räume verwenden das einfache `thumbnail_url`. Es ist keine Konfiguration erforderlich – das Plugin erkennt den E2EE-Status automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnose), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Einrichtungen mit mehreren Konten). Die Ausgabe ist standardmäßig kompakt.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Initialisiert den geheimen Speicher und das Cross-Signing, erstellt bei Bedarf eine Sicherung der Raumschlüssel und gibt anschließend den Status und die nächsten Schritte aus. Nützliche Flags:

- `--recovery-key-stdin` liest einen Wiederherstellungsschlüssel aus der Standardeingabe, ohne ihn in den Prozessargumenten offenzulegen; `--recovery-key <key>` bleibt aus Kompatibilitätsgründen verfügbar
- `--force-reset-cross-signing` verwirft die aktuelle Cross-Signing-Identität und erstellt eine neue (nur zur gezielten Verwendung)

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

### Status- und Vertrauenssignale

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` meldet drei unabhängige Vertrauenssignale (`--verbose` zeigt sie alle an):

- `Locally trusted`: nur von diesem Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: Das SDK meldet eine Verifizierung über Cross-Signing
- `Signed by owner`: mit Ihrem eigenen Self-Signing-Schlüssel signiert (nur zur Diagnose)

`Verified by owner` ist nur dann `yes`, wenn `Cross-signing verified` den Wert `yes` hat; lokales Vertrauen oder allein eine Eigentümersignatur reicht nicht aus.

`--allow-degraded-local-state` gibt bestmögliche Diagnosedaten zurück, ohne zuvor das Matrix-Konto vorzubereiten; dies ist für Offline- oder teilweise konfigurierte Prüfungen nützlich.

### Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren

Leiten Sie den Wiederherstellungsschlüssel über die Standardeingabe weiter, statt ihn in der Befehlszeile zu übergeben:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für den geheimen Speicher oder das Gerätevertrauen akzeptiert.
- `Backup usable`: Die Raumschlüsselsicherung kann mit dem vertrauenswürdigen Wiederherstellungsmaterial geladen werden.
- `Device verified by owner`: Dieses Gerät besitzt vollständiges Vertrauen in die Matrix-Cross-Signing-Identität.

Der Befehl wird mit einem von null verschiedenen Status beendet, wenn das vollständige Identitätsvertrauen unvollständig ist, selbst wenn der Wiederherstellungsschlüssel Sicherungsmaterial entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung über einen anderen Matrix-Client ab:

```bash
openclaw matrix verify self
```

`verify self` wartet vor dem erfolgreichen Beenden auf `Cross-signing verified: yes`. Verwenden Sie `--timeout-ms <ms>`, um die Wartezeit anzupassen.

Die Form mit einem literalen Schlüssel `openclaw matrix verify device "<recovery-key>"` funktioniert ebenfalls, der Schlüssel wird jedoch im Shell-Verlauf gespeichert.

### Cross-Signing initialisieren oder reparieren

```bash
openclaw matrix verify bootstrap
```

Der Reparatur-/Einrichtungsbefehl für verschlüsselte Konten. Er führt in dieser Reihenfolge Folgendes aus:

- initialisiert den geheimen Speicher und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel erneut
- initialisiert Cross-Signing und lädt fehlende öffentliche Schlüssel hoch
- kennzeichnet und signiert das aktuelle Gerät per Cross-Signing
- erstellt eine serverseitige Raumschlüsselsicherung, falls noch keine vorhanden ist

Wenn der Homeserver für das Hochladen von Cross-Signing-Schlüsseln UIA erfordert, versucht OpenClaw zunächst die Ausführung ohne Authentifizierung, danach `m.login.dummy` und anschließend `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (zusammen mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` verwenden) oder `--recovery-key <key>`
- `--force-reset-cross-signing`, um die aktuelle Cross-Signing-Identität zu verwerfen (nur gezielt; erfordert den aktiven Wiederherstellungsschlüssel, der gespeichert oder mit `--recovery-key-stdin` bereitgestellt wurde)

### Raumschlüsselsicherung

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt an, ob eine serverseitige Sicherung vorhanden ist und ob dieses Gerät sie entschlüsseln kann. `backup restore` importiert gesicherte Raumschlüssel in den lokalen Kryptospeicher; lassen Sie `--recovery-key-stdin` weg, wenn der Wiederherstellungsschlüssel bereits auf dem Datenträger gespeichert ist.

So ersetzen Sie eine beschädigte Sicherung durch einen neuen Ausgangsstand (dabei wird der Verlust nicht wiederherstellbarer alter Verläufe akzeptiert; außerdem kann der geheime Speicher neu erstellt werden, wenn das aktuelle Sicherungsgeheimnis nicht geladen werden kann):

```bash
openclaw matrix verify backup reset --yes
```

Fügen Sie `--rotate-recovery-key` nur hinzu, wenn der vorherige Wiederherstellungsschlüssel den neuen Sicherungsausgangsstand gezielt nicht mehr entsperren soll.

### Verifizierungen auflisten, anfordern und beantworten

```bash
openclaw matrix verify list
```

Listet ausstehende Verifizierungsanfragen für das ausgewählte Konto auf.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Sendet eine Verifizierungsanfrage von diesem Konto. `--own-user` fordert eine Selbstverifizierung an (akzeptieren Sie die Aufforderung in einem anderen Matrix-Client desselben Benutzers); `--user-id`/`--device-id`/`--room-id` richten sich an eine andere Person. `--own-user` kann nicht mit den anderen Zielfestlegungs-Flags kombiniert werden.

Für die Verarbeitung des Lebenszyklus auf niedrigerer Ebene – typischerweise bei der parallelen Beobachtung eingehender Anfragen von einem anderen Client – wirken diese Befehle auf eine bestimmte Anfrage `<id>` (ausgegeben von `verify list` und `verify request`):

| Befehl                                    | Zweck                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Eine eingehende Anfrage akzeptieren                                           |
| `openclaw matrix verify start <id>`        | Den SAS-Ablauf starten                                                  |
| `openclaw matrix verify sas <id>`          | Die SAS-Emojis oder Dezimalzahlen ausgeben                                     |
| `openclaw matrix verify confirm-sas <id>`  | Bestätigen, dass der SAS mit der Anzeige des anderen Clients übereinstimmt            |
| `openclaw matrix verify mismatch-sas <id>` | Den SAS ablehnen, wenn die Emojis oder Dezimalzahlen nicht übereinstimmen              |
| `openclaw matrix verify cancel <id>`       | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als Hinweise für die Nachverfolgung per Direktnachricht, wenn die Verifizierung an einen bestimmten Direktnachrichtenraum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Bei mehreren benannten Konten und ohne `channels.matrix.defaultAccount` verweigern die Befehle eine Vermutung und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehlermeldungen auf den Konfigurationsschlüssel dieses Kontos, beispielsweise `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startverhalten">
    Mit `encryption: true` verwendet `startupVerification` standardmäßig `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät die Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abklingzeit an (standardmäßig 24 Stunden). Passen Sie diese mit `startupVerificationCooldownHours` an oder deaktivieren Sie sie mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Initialisierungsdurchlauf für die Kryptografie ausgeführt, der den aktuellen geheimen Speicher und die bestehende Cross-Signing-Identität wiederverwendet. Wenn der Initialisierungsstatus beschädigt ist, versucht OpenClaw auch ohne `channels.matrix.password` eine abgesicherte Reparatur; wenn der Homeserver eine Passwort-UIA erfordert, protokolliert der Startvorgang eine Warnung und wird nicht schwerwiegend beendet. Bereits vom Eigentümer signierte Geräte bleiben erhalten.

    Den vollständigen Upgrade-Ablauf finden Sie unter [Matrix-Migration](/de/channels/matrix-migration).

  </Accordion>

  <Accordion title="Verifizierungshinweise">
    Matrix veröffentlicht Hinweise zum Verifizierungslebenszyklus als `m.notice`-Nachrichten im strikt festgelegten Direktnachrichtenraum für Verifizierungen: Anfrage, Bereitschaft (mit dem Hinweis „Per Emoji verifizieren“), Start/Abschluss und, sofern verfügbar, SAS-Details (Emoji/Dezimalzahlen).

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Bei der Selbstverifizierung startet OpenClaw den SAS-Ablauf automatisch und bestätigt die eigene Seite, sobald die Emoji-Verifizierung verfügbar ist – Sie müssen die Werte weiterhin vergleichen und in Ihrem Matrix-Client „They match“ bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Gelöschtes oder ungültiges Matrix-Gerät">
    Wenn `verify status` meldet, dass das aktuelle Gerät nicht mehr auf dem Homeserver aufgeführt ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für die Anmeldung per Passwort:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Erstellen Sie für die Token-Authentifizierung ein neues Zugriffstoken in Ihrem Matrix-Client oder der Administratoroberfläche und aktualisieren Sie anschließend OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Ersetzen Sie `assistant` durch die Konto-ID aus dem fehlgeschlagenen Befehl oder lassen Sie `--account` für das Standardkonto weg.

  </Accordion>

  <Accordion title="Geräteverwaltung">
    Alte von OpenClaw verwaltete Geräte können sich ansammeln. Listen Sie sie auf und bereinigen Sie sie:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kryptospeicher">
    Matrix E2EE verwendet den offiziellen `matrix-js-sdk`-Rust-Kryptografiepfad mit `fake-indexeddb` als IndexedDB-Shim. Der Kryptografiestatus wird unter `crypto-idb-snapshot.json` dauerhaft gespeichert (restriktive Dateiberechtigungen).

    Der verschlüsselte Laufzeitstatus befindet sich unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Synchronisierungsspeicher, den Kryptospeicher, den Wiederherstellungsschlüssel, den IDB-Snapshot, Thread-Bindungen und den Status der Startüberprüfung. Wenn sich das Token ändert, die Kontoidentität jedoch gleich bleibt, verwendet OpenClaw den am besten geeigneten vorhandenen Stamm wieder, sodass der vorherige Status sichtbar bleibt.

    Ein einzelner älterer Stamm mit Token-Hash kann ein normaler Kontinuitätspfad bei einer Token-Rotation sein. Wenn OpenClaw `matrix: multiple populated token-hash storage roots detected` protokolliert, prüfen Sie das Kontoverzeichnis und archivieren Sie veraltete parallele Stammverzeichnisse erst, nachdem Sie bestätigt haben, dass der ausgewählte aktive Stamm fehlerfrei ist. Verschieben Sie veraltete Stammverzeichnisse vorzugsweise in ein `_archive/`-Verzeichnis, anstatt sie sofort zu löschen.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Übergeben Sie beide Optionen in einem Aufruf. Matrix akzeptiert `mxc://`-Avatar-URLs direkt; bei der Übergabe von `http://`/`https://` wird die Datei zuerst hochgeladen und die aufgelöste `mxc://`-URL in `channels.matrix.avatarUrl` (oder der kontospezifischen Überschreibung) gespeichert.

## Threads

Matrix unterstützt native Threads sowohl für automatische Antworten als auch für über das Nachrichtentool gesendete Nachrichten. Zwei unabhängige Einstellungen steuern das Verhalten:

### Sitzungsrouting (`sessionScope`)

`dm.sessionScope` bestimmt, wie Matrix-DM-Räume OpenClaw-Sitzungen zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Kommunikationspartner teilen sich eine Sitzung.
- `"per-room"`: Jeder Matrix-DM-Raum erhält einen eigenen Sitzungsschlüssel, selbst für denselben Kommunikationspartner.

Explizite Konversationsbindungen haben stets Vorrang vor `sessionScope`; gebundene Räume und Threads behalten ihre gewählte Zielsitzung.

### Antwort-Threading (`threadReplies`)

`threadReplies` bestimmt, wo der Bot seine Antwort veröffentlicht:

- `"off"`: Antworten werden auf oberster Ebene veröffentlicht. Eingehende Thread-Nachrichten verbleiben in der übergeordneten Sitzung.
- `"inbound"`: Nur innerhalb eines Threads antworten, wenn die eingehende Nachricht bereits zu diesem Thread gehörte.
- `"always"`: Innerhalb eines Threads antworten, dessen Stamm die auslösende Nachricht ist; diese Konversation wird ab dem ersten Auslöser über eine passende Thread-spezifische Sitzung geroutet.

`dm.threadReplies` überschreibt dies ausschließlich für DMs – beispielsweise können Raum-Threads isoliert bleiben, während DMs ohne Threads verwendet werden.

### Thread-Vererbung und Slash-Befehle

- Eingehende Thread-Nachrichten enthalten die Stammnachricht des Threads als zusätzlichen Agentenkontext.
- Über das Nachrichtentool gesendete Nachrichten übernehmen automatisch den aktuellen Matrix-Thread, wenn derselbe Raum (oder dasselbe DM-Benutzerziel) adressiert wird, sofern kein expliziter `threadId` angegeben ist.
- Die Wiederverwendung eines DM-Benutzerziels erfolgt nur, wenn die Metadaten der aktuellen Sitzung denselben DM-Kommunikationspartner für dasselbe Matrix-Konto belegen; andernfalls greift OpenClaw auf das normale benutzerspezifische Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und das Thread-gebundene `/acp spawn` funktionieren sämtlich in Matrix-Räumen und DMs.
- Das auf oberster Ebene ausgeführte `/focus` erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSessions` aktiviert ist.
- Wenn `/focus` oder `/acp spawn --thread here` innerhalb eines vorhandenen Matrix-Threads ausgeführt wird, wird dieser Thread direkt gebunden.

Wenn OpenClaw feststellt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsam genutzten Sitzung kollidiert, veröffentlicht es einmalig `m.notice` mit einem Verweis auf den Ausweg `/focus` und schlägt eine Änderung von `dm.sessionScope` vor. Der Hinweis erscheint nur, wenn Thread-Bindungen aktiviert sind.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und vorhandene Matrix-Threads können zu dauerhaften ACP-Arbeitsbereichen werden, ohne die Chat-Oberfläche zu ändern.

Schneller Ablauf für Operatoren:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des vorhandenen Threads aus, um diese weiterzuverwenden.
- In einer DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM beziehungsweise der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geroutet.
- Innerhalb eines vorhandenen Threads bindet `--bind here` diesen aktuellen Thread direkt.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

`--bind here` erstellt keinen untergeordneten Matrix-Thread. `threadBindings.spawnSessions` steuert `/acp spawn --thread auto|here`, wobei OpenClaw einen untergeordneten Thread erstellen oder binden muss.

### Konfiguration der Thread-Bindung

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt kanalspezifische Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: Steuert sowohl das Erzeugen von Subagent- als auch von ACP-Threads.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: Enger gefasste Überschreibungen ausschließlich für das Erzeugen von Subagent- beziehungsweise ACP-Threads.
- `threadBindings.defaultSpawnContext`

Das Erzeugen von an Matrix-Threads gebundenen Sitzungen ist standardmäßig aktiviert. Setzen Sie `threadBindings.spawnSessions: false`, um zu verhindern, dass `/focus` und `/acp spawn --thread auto|here` auf oberster Ebene Matrix-Threads erstellen oder binden. Setzen Sie `threadBindings.defaultSpawnContext: "isolated"`, wenn beim nativen Erzeugen von Subagent-Threads das übergeordnete Transkript nicht geforkt werden soll.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, Benachrichtigungen über eingehende Reaktionen und Bestätigungsreaktionen.

Die Werkzeuge für ausgehende Reaktionen werden durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionsübersicht für ein Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bots.

**Auflösungsreihenfolge** (der erste definierte Wert gilt):

| Einstellung                 | Reihenfolge                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | pro Konto -> Kanal -> `messages.ackReaction` -> Rückgriff auf das Emoji der Agentenidentität   |
| `ackReactionScope`      | pro Konto -> Kanal -> `messages.ackReactionScope` -> Standardwert `"group-mentions"` |
| `reactionNotifications` | pro Konto -> Kanal -> Standardwert `"own"`                                           |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie sich auf vom Bot verfasste Matrix-Nachrichten beziehen; `"off"` deaktiviert Systemereignisse für Reaktionen. Das Entfernen von Reaktionen wird nicht in Systemereignisse umgewandelt – Matrix stellt dies als Schwärzungen und nicht als eigenständige Entfernungen vom Typ `m.reaction` dar.

## Verlaufskontext

- `channels.matrix.historyLimit` legt fest, wie viele der letzten Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standardwert ist `0`, wenn beide nicht festgelegt sind (deaktiviert).
- Der Matrix-Raumverlauf gilt nur für Räume; Direktnachrichten verwenden weiterhin den normalen Sitzungsverlauf.
- Der Raumverlauf enthält nur ausstehende Nachrichten: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt eine Momentaufnahme dieses Zeitfensters, sobald eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle auslösende Nachricht ist nicht in `InboundHistory` enthalten; sie verbleibt für diesen Durchlauf im eingehenden Haupttext.
- Bei Wiederholungsversuchen für dasselbe Matrix-Ereignis wird die ursprüngliche Verlaufsmomentaufnahme wiederverwendet, anstatt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext, beispielsweise abgerufenen Antworttext, Thread-Wurzeln und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standardwert. Ergänzender Kontext wird unverändert beibehalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die gemäß den aktiven Zulassungslistenprüfungen für Raum und Benutzer zulässig sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält jedoch weiterhin eine ausdrücklich zitierte Antwort bei.

Dies betrifft nur die Sichtbarkeit des ergänzenden Kontexts, nicht die Frage, ob die eingehende Nachricht selbst eine Antwort auslösen kann. Die Auslöseberechtigung ergibt sich weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und den Richtlinieneinstellungen für Direktnachrichten.

## Richtlinie für Direktnachrichten und Räume

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

Um Direktnachrichten vollständig stummzuschalten und Räume weiterhin zu verwenden, legen Sie `dm.enabled: false` fest:

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

Informationen zur Steuerung durch Erwähnungen und zum Verhalten von Zulassungslisten finden Sie unter [Gruppen](/de/channels/groups).

Beispiel für das Pairing von Matrix-Direktnachrichten:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und kann nach einer kurzen Abklingzeit eine Erinnerungsantwort senden, anstatt einen neuen Code zu erzeugen.

Informationen zum gemeinsamen Pairing-Ablauf für Direktnachrichten und zur Speicherstruktur finden Sie unter [Pairing](/de/channels/pairing).

## Reparatur direkter Räume

Wenn der Zustand von Direktnachrichten abweicht, kann OpenClaw veraltete `m.direct`-Zuordnungen enthalten, die auf alte Einzelräume statt auf die aktive Direktnachricht verweisen. Prüfen Sie die aktuelle Zuordnung für einen Kommunikationspartner:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide Befehle akzeptieren `--account <id>` für Konfigurationen mit mehreren Konten. Der Reparaturablauf:

- bevorzugt eine strikte 1:1-Direktnachricht, die bereits in `m.direct` zugeordnet ist
- fällt auf eine beliebige derzeit beigetretene strikte 1:1-Direktnachricht mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine funktionsfähige Direktnachricht vorhanden ist

Alte Räume werden nicht automatisch gelöscht. Der Ablauf wählt die funktionsfähige Direktnachricht aus und aktualisiert die Zuordnung, sodass zukünftige Matrix-Sendungen, Verifizierungsbenachrichtigungen und andere Direktnachrichtenabläufe an den richtigen Raum gerichtet werden.

## Ausführungsgenehmigungen

Matrix kann als nativer Genehmigungsclient fungieren. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder unter `channels.matrix.accounts.<account>.execApprovals` für eine kontospezifische Überschreibung):

- `enabled`: stellt Genehmigungen über Matrix-native Eingabeaufforderungen zu. Nicht festgelegt oder `"auto"` aktiviert die Funktion automatisch, sobald mindestens ein Genehmiger aufgelöst werden kann; legen Sie `false` fest, um sie ausdrücklich zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Ausführungsanfragen genehmigen dürfen. Fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: legt fest, wohin Eingabeaufforderungen gesendet werden. `"dm"` (Standardwert) sendet sie an die Direktnachrichten der Genehmiger; `"channel"` sendet sie an den Ursprungsraum oder die Ursprungsdirektnachricht; `"both"` sendet sie an beide.
- `agentFilter` / `sessionFilter`: optionale Zulassungslisten, die festlegen, welche Agenten/Sitzungen die Zustellung über Matrix auslösen.

Die Autorisierung unterscheidet sich geringfügig zwischen den Genehmigungsarten:

- **Ausführungsgenehmigungen** verwenden `execApprovals.approvers` und fallen auf `dm.allowFrom` zurück.
- **Plugin-Genehmigungen** autorisieren ausschließlich über `dm.allowFrom`.

Beide Arten verwenden dieselben Matrix-Kurzbefehle per Reaktion und Nachrichtenaktualisierungen. Genehmigende sehen auf der primären Genehmigungsnachricht folgende Reaktions-Kurzbefehle:

- ✅ einmal erlauben
- ❌ ablehnen
- ♾️ immer erlauben (wenn die wirksame Ausführungsrichtlinie dies zulässt)

Alternativ verfügbare Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Die Kanalzustellung für Ausführungsgenehmigungen enthält den Befehlstext – aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandtes Thema: [Ausführungsgenehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in DMs. In Räumen erkennt OpenClaw außerdem Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist. Daher löst `@bot:server /new` den Befehlspfad ohne benutzerdefinierten regulären Ausdruck für Erwähnungen aus – dadurch reagiert der Bot auf raumtypische `@mention /command`-Beiträge, die Element und ähnliche Clients senden, wenn ein Benutzer den Bot per Tab-Vervollständigung auswählt, bevor er den Befehl eingibt.

Die Autorisierungsregeln gelten weiterhin: Absender von Befehlen müssen dieselben DM- oder Raum-Zulassungslisten-/Eigentümerrichtlinien erfüllen wie einfache Nachrichten.

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

- Werte von `channels.matrix` auf oberster Ebene dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
- Beschränken Sie einen geerbten Raumeintrag mit `groups.<room>.account` auf ein bestimmtes Konto. Einträge ohne `account` werden von allen Konten gemeinsam verwendet; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf oberster Ebene konfiguriert ist.

**Auswahl des Standardkontos:**

- Legen Sie mit `defaultAccount` das benannte Konto fest, das für implizites Routing, Prüfungen und CLI-Befehle bevorzugt wird.
- Wenn Sie mehrere Konten haben und eines davon buchstäblich `default` heißt, verwendet OpenClaw es implizit, selbst wenn `defaultAccount` nicht festgelegt ist.
- Bei mehreren benannten Konten ohne ausgewähltes Standardkonto verweigern CLI-Befehle eine automatische Auswahl – legen Sie `defaultAccount` fest oder übergeben Sie `--account <id>`.
- Der Block `channels.matrix.*` auf oberster Ebene wird nur dann als implizites Konto `default` behandelt, wenn dessen Authentifizierung vollständig ist (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben über `homeserver` + `userId` auffindbar, sobald zwischengespeicherte Anmeldedaten die Authentifizierung abdecken.

**Hochstufung:**

- Wenn OpenClaw während einer Reparatur oder Einrichtung eine Einzelkontokonfiguration zu einer Mehrkontenkonfiguration hochstuft, behält es das vorhandene benannte Konto bei, sofern eines vorhanden ist oder `defaultAccount` bereits auf eines verweist. Nur Matrix-Authentifizierungs-/Bootstrap-Schlüssel werden in das hochgestufte Konto verschoben; gemeinsam verwendete Schlüssel für Zustellungsrichtlinien verbleiben auf oberster Ebene.

Das gemeinsame Mehrkontenmuster finden Sie in der [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels).

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw zum Schutz vor SSRF private/interne Matrix-Homeserver, sofern Sie dies nicht für das jeweilige Konto ausdrücklich zulassen.

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

Beispiel für die Einrichtung per CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Diese ausdrückliche Freigabe erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie `http://matrix.example.org:8008` bleiben blockiert. Bevorzugen Sie nach Möglichkeit stets `https://`.

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

Benannte Konten können den Standardwert der obersten Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben. OpenClaw verwendet dieselbe Proxy-Einstellung für den Matrix-Datenverkehr zur Laufzeit und für Kontostatusprüfungen.

## Zielauflösung

Matrix akzeptiert überall, wo OpenClaw ein Raum- oder Benutzerziel anfordert, die folgenden Zielformate:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Bei Matrix-Raum-IDs wird zwischen Groß- und Kleinschreibung unterschieden. Verwenden Sie bei der Konfiguration expliziter Zustellungsziele, Cron-Aufgaben, Bindungen oder Zulassungslisten exakt die Groß-/Kleinschreibung der Raum-ID aus Matrix. OpenClaw hält interne Sitzungsschlüssel für die Speicherung in kanonischer Form. Diese kleingeschriebenen Schlüssel sind daher keine zuverlässige Quelle für Matrix-Zustellungs-IDs.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt. Die Suche nach Namen beigetretener Räume erfolgt nach bestem Bemühen und gilt nur für Raum-Zulassungslisten zur Laufzeit, wenn `dangerouslyAllowNameMatching: true` festgelegt ist.
- Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er bei der Auflösung der Zulassungsliste zur Laufzeit ignoriert.

## Konfigurationsreferenz

Benutzerfelder im Stil einer Zulassungsliste (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs (am sichersten). Einträge, die keine IDs sind, werden standardmäßig ignoriert. Wenn `dangerouslyAllowNameMatching: true` festgelegt ist, werden exakte Übereinstimmungen mit Matrix-Anzeigenamen im Verzeichnis beim Start sowie bei jeder Änderung der Zulassungsliste während der Ausführung des Monitors aufgelöst; nicht auflösbare Einträge werden zur Laufzeit ignoriert.

Schlüssel für Raum-Zulassungslisten (`groups`, veraltet: `rooms`) sollten Raum-IDs oder Aliasse sein. Einfache Raumnamen als Schlüssel werden standardmäßig ignoriert; `dangerouslyAllowNameMatching: true` reaktiviert die Suche nach Namen beigetretener Räume nach bestem Bemühen.

### Konto und Verbindung

- `enabled`: Kanal aktivieren oder deaktivieren.
- `name`: optionale Anzeigebezeichnung für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: benannte Überschreibungen pro Konto. Werte von `channels.matrix` auf oberster Ebene werden als Standardwerte geerbt.
- `homeserver`: Homeserver-URL, beispielsweise `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Konto Verbindungen zu `localhost`, LAN-/Tailscale-IPs oder internen Hostnamen erlauben.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Überschreibung pro Konto wird unterstützt.
- `userId`: vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartext- und SecretRef-Werte werden über Umgebungs-, Datei- und Ausführungs-Provider hinweg unterstützt ([Verwaltung von Geheimnissen](/de/gateway/secrets)).
- `password`: Passwort für die passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts, der bei der Passwortanmeldung verwendet wird.
- `avatarUrl`: gespeicherte URL des eigenen Avatars für die Profilsynchronisierung und Aktualisierungen von `profile set`.
- `initialSyncLimit`: maximale Anzahl der während der Startsynchronisierung abgerufenen Ereignisse.

### Verschlüsselung

- `encryption`: E2EE aktivieren. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard, wenn E2EE aktiviert ist) oder `"off"`. Fordert beim Start automatisch eine Selbstverifizierung an, wenn dieses Gerät nicht verifiziert ist.
- `startupVerificationCooldownHours`: Wartezeit bis zur nächsten automatischen Startanforderung. Standard: `24`.

### Zugriff und Richtlinien

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Zulassungsliste von Benutzer-IDs für Raumdatenverkehr.
- `mentionPatterns`: bereichsbezogene reguläre Ausdrucksmuster für Raumerwähnungen. Objekt mit `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Steuert, ob konfigurierte `agents.list[].groupChat.mentionPatterns` pro Raum gelten.
- `dm.enabled`: Wenn `false`, werden alle DMs ignoriert. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Gilt, nachdem der Bot beigetreten ist und den Raum als DM klassifiziert hat; die Verarbeitung von Einladungen ist davon nicht betroffen.
- `dm.allowFrom`: Zulassungsliste von Benutzer-IDs für DM-Datenverkehr.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: ausschließlich für DMs geltende Überschreibung für Antwort-Threads (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: Nachrichten von anderen konfigurierten Matrix-Botkonten akzeptieren (`true` oder `"mentions"`).
- `allowlistOnly`: Wenn `true`, werden alle aktiven DM-Richtlinien (außer `"disabled"`) und `"open"`-Gruppenrichtlinien auf `"allowlist"` erzwungen. `"disabled"`-Richtlinien werden nicht geändert.
- `dangerouslyAllowNameMatching`: Wenn `true`, wird die Matrix-Verzeichnissuche nach Anzeigenamen für Einträge in Benutzer-Zulassungslisten sowie die Suche nach Namen beigetretener Räume für Schlüssel in Raum-Zulassungslisten erlaubt. Bevorzugen Sie vollständige `@user:server`-IDs sowie Raum-IDs oder Aliasse.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich DM-ähnlicher Einladungen.
- `autoJoinAllowlist`: erlaubte Räume/Aliasse, wenn `autoJoin` den Wert `"allowlist"` hat. Aliaseinträge werden über den Homeserver aufgelöst, nicht anhand des vom eingeladenen Raum angegebenen Zustands.
- `contextVisibility`: ergänzende Kontextsichtbarkeit (`"all"` als Standard, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"` (Standard), `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"` (der Standardwert auf oberster Ebene wird in `"inbound"` aufgelöst, sofern er nicht explizit festgelegt ist), `"inbound"` oder `"always"`.
- `threadBindings`: kanalspezifische Überschreibungen für das Routing und den Lebenszyklus threadgebundener Sitzungen.
- `streaming`: verschachteltes Objekt `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode` ist `"off"` (Standard), `"partial"`, `"quiet"` oder `"progress"`. Veraltete skalare bzw. boolesche Schreibweisen werden über `openclaw doctor --fix` migriert.
- `streaming.block.enabled`: wenn `true`, werden abgeschlossene Assistentenblöcke als separate Fortschrittsmeldungen beibehalten. Standard: `false`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: Größe ausgehender Blöcke in Zeichen, wenn `streaming.chunkMode: "length"`. Standard: `4000`.
- `streaming.chunkMode`: `"length"` (Standard, Aufteilung nach Zeichenanzahl) oder `"newline"` (Aufteilung an Zeilengrenzen).
- `historyLimit`: Anzahl der letzten Raumnachrichten, die als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standardwert: `0` (deaktiviert).
- `mediaMaxMb`: Obergrenze für die Mediengröße in MB beim ausgehenden Versand und bei der eingehenden Verarbeitung. Standard: `20`.

### Reaktionseinstellungen

- `ackReaction`: Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: Überschreibung des Geltungsbereichs (`"group-mentions"` als Standard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (`"own"` als Standard, `"off"`).

### Werkzeuge und raumspezifische Überschreibungen

- `actions`: aktionsspezifische Werkzeugfreigabe (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: raumspezifische Richtlinienzuordnung. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein veralteter Alias.)
  - `groups.<room>.account`: beschränkt einen geerbten Raumeintrag auf ein bestimmtes Konto.
  - `groups.<room>.enabled`: raumspezifischer Schalter. Wenn `false`, wird der Raum ignoriert, als wäre er nicht in der Zuordnung enthalten.
  - `groups.<room>.requireMention`: raumspezifische Überschreibung der kanalweiten Erwähnungsanforderung.
  - `groups.<room>.allowBots`: raumspezifische Überschreibung der kanalweiten Einstellung (`true` oder `"mentions"`).
  - `groups.<room>.botLoopProtection`: raumspezifische Überschreibung des Budgets für den Schutz vor Bot-zu-Bot-Schleifen.
  - `groups.<room>.users`: raumspezifische Zulassungsliste für Absender.
  - `groups.<room>.tools`: raumspezifische Überschreibungen zum Zulassen/Ablehnen von Werkzeugen.
  - `groups.<room>.autoReply`: raumspezifische Überschreibung der Erwähnungsbeschränkung. `true` deaktiviert die Erwähnungsanforderungen für diesen Raum; `false` erzwingt sie erneut.
  - `groups.<room>.skills`: raumspezifischer Skills-Filter.
  - `groups.<room>.systemPrompt`: raumspezifischer Ausschnitt der Systemanweisung.

### Einstellungen für Ausführungsgenehmigungen

- `execApprovals.enabled`: Ausführungsgenehmigungen über Matrix-native Eingabeaufforderungen zustellen.
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Genehmigungen erteilen dürfen. Fällt auf `dm.allowFrom` zurück.
- `execApprovals.target`: `"dm"` (Standard), `"channel"` oder `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionale Agenten-/Sitzungszulassungslisten für die Zustellung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Erwähnungsbeschränkung
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Absicherung

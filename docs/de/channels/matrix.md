---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Status der Matrix-Unterstützung, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-07-12T15:00:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein herunterladbares Kanal-Plugin (`@openclaw/matrix`), das auf dem offiziellen `matrix-js-sdk` basiert. Es unterstützt Direktnachrichten, Räume, Threads, Medien, Reaktionen, Umfragen, Standorte und E2EE.

## Installation

```bash
openclaw plugins install @openclaw/matrix
```

Reine Plugin-Spezifikationen versuchen zuerst ClawHub und greifen anschließend auf npm zurück. Erzwingen Sie eine Quelle mit `openclaw plugins install clawhub:@openclaw/matrix` oder `npm:@openclaw/matrix`. Aus einem lokalen Checkout: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registriert und aktiviert das Plugin; ein separater `enable`-Schritt ist nicht erforderlich. Der Kanal bleibt dennoch inaktiv, bis er wie unten beschrieben konfiguriert wird. Allgemeine Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Einrichtung

1. Erstellen Sie auf Ihrem Homeserver ein Matrix-Konto.
2. Konfigurieren Sie `channels.matrix` entweder mit `homeserver` + `accessToken` oder mit `homeserver` + `userId` + `password`.
3. Starten Sie den Gateway neu.
4. Beginnen Sie eine Direktnachricht mit dem Bot oder laden Sie ihn in einen Raum ein. Neue Einladungen werden nur angenommen, wenn [`autoJoin`](#auto-join) sie zulässt.

### Interaktive Einrichtung

```bash
openclaw channels add
openclaw configure --section channels
```

Der Assistent fragt nach der Homeserver-URL, der Authentifizierungsmethode (Token oder Passwort), der Benutzer-ID (nur bei Passwortauthentifizierung), einem optionalen Gerätenamen, danach, ob E2EE aktiviert werden soll, sowie nach Raumzugriff und automatischem Beitritt. Wenn passende `MATRIX_*`-Umgebungsvariablen bereits vorhanden sind und für das Konto keine Authentifizierungsdaten gespeichert wurden, bietet der Assistent eine Abkürzung über Umgebungsvariablen an. Lösen Sie Raumnamen vor dem Speichern einer Zulassungsliste mit `openclaw channels resolve --channel matrix "Project Room"` auf. Das Aktivieren von E2EE im Assistenten führt denselben Bootstrap wie [`openclaw matrix encryption setup`](#encryption-and-verification) aus.

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

`channels.matrix.autoJoin` ist standardmäßig auf `"off"` gesetzt: Der Bot erscheint nach neuen Einladungen erst dann in neuen Räumen oder Direktnachrichten, wenn Sie manuell beitreten. OpenClaw kann zum Zeitpunkt der Einladung nicht erkennen, ob es sich um eine Direktnachricht oder eine Gruppe handelt. Daher durchläuft jede Einladung zuerst `autoJoin`; `dm.policy` wird erst später angewendet, nachdem der Bot beigetreten und der Raum klassifiziert wurde.

<Warning>
Legen Sie `autoJoin: "allowlist"` zusammen mit `autoJoinAllowlist` fest, um angenommene Einladungen einzuschränken, oder verwenden Sie `autoJoin: "always"`, um jede Einladung anzunehmen.

`autoJoinAllowlist` akzeptiert ausschließlich `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt; Aliasse werden über den Homeserver aufgelöst, nicht anhand des Zustands, den der einladende Raum angibt.
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

### Zielformate für Zulassungslisten

- Direktnachrichten (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden standardmäßig ignoriert, da sie veränderlich sind; legen Sie `dangerouslyAllowNameMatching: true` nur fest, wenn ausdrücklich Kompatibilität mit Anzeigenamen erforderlich ist.
- Schlüssel der Raum-Zulassungsliste (`groups`, veralteter Alias `rooms`): Verwenden Sie `!room:server` oder `#alias:server`. Einfache Namen werden ignoriert, sofern `dangerouslyAllowNameMatching: true` nicht gesetzt ist.
- Einladungs-Zulassungslisten (`autoJoinAllowlist`): Verwenden Sie `!room:server`, `#alias:server` oder `*`. Einfache Namen werden immer abgelehnt.

### Normalisierung der Konto-ID

Der Assistent wandelt einen benutzerfreundlichen Namen in eine normalisierte Konto-ID um (`Ops Bot` -> `ops-bot`). Satzzeichen werden in kontospezifischen Namen von Umgebungsvariablen hexadezimal maskiert, damit Konten nicht kollidieren können: `-` (0x2D) wird zu `_X2D_`, sodass `ops-prod` dem Umgebungsvariablenpräfix `MATRIX_OPS_X2D_PROD_` zugeordnet wird.

### Zwischengespeicherte Anmeldedaten

Matrix speichert Anmeldedaten unter `~/.openclaw/credentials/matrix/` zwischen: `credentials.json` für das Standardkonto und `credentials-<account>.json` für benannte Konten. Wenn zwischengespeicherte Anmeldedaten vorhanden sind, betrachtet OpenClaw Matrix auch ohne `accessToken` in der Konfigurationsdatei als konfiguriert. Dies gilt für die Einrichtung, `openclaw doctor` und Abfragen des Kanalstatus.

### Umgebungsvariablen

Durch Konfigurationsschlüssel gestützte Umgebungsvariablen werden verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; bei benannten Konten wird das Konto-Token vor dem Suffix eingefügt (siehe [Normalisierung](#account-id-normalization)).

| Standardkonto          | Benanntes Konto (`<ID>` = Konto-Token) |
| ---------------------- | --------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Für das Konto `ops` lauten die Namen `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` und so weiter. `MATRIX_HOMESERVER` sowie alle kontospezifischen `*_HOMESERVER`-Varianten können nicht über eine `.env`-Datei des Arbeitsbereichs festgelegt werden; siehe [`.env`-Dateien des Arbeitsbereichs](/de/gateway/security).

<Note>
Der Wiederherstellungsschlüssel ist keine konfigurationsgestützte Umgebungsvariable: OpenClaw liest ihn niemals selbst aus der Umgebung. Der Anleitungstext der CLI empfiehlt, ihn für das Standardkonto über eine Shell-Variable namens `MATRIX_RECOVERY_KEY` oder für ein benanntes Konto über `MATRIX_RECOVERY_KEY_<ID>` (einfache großgeschriebene Konto-ID ohne hexadezimale Maskierung) weiterzuleiten – siehe [Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren](#verify-this-device-with-a-recovery-key).
</Note>

## Konfigurationsbeispiel

Eine praxistaugliche Ausgangskonfiguration mit Kopplung für Direktnachrichten, Raum-Zulassungsliste und E2EE:

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

Das Antwort-Streaming für Matrix muss ausdrücklich aktiviert werden. `streaming` steuert, wie OpenClaw die noch entstehende Assistentenantwort ausliefert; `blockStreaming` steuert, ob jeder abgeschlossene Block als eigene Matrix-Nachricht erhalten bleibt.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Um Live-Antwortvorschauen beizubehalten, aber vorläufige Werkzeug- und Fortschrittszeilen auszublenden, verwenden Sie die Objektform:

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
          label: "auto", // aus konfigurierten oder integrierten Bezeichnungen auswählen (false zum Ausblenden)
          labels: ["Thinking", "Writing", "Searching"], // Kandidaten für label: "auto"
          maxLines: 8, // maximale Anzahl fortlaufender Fortschrittszeilen (Standard: 8)
          maxLineChars: 120, // maximale Zeichenanzahl pro Zeile vor dem Abschneiden (Standard: 120)
          toolProgress: true, // Werkzeug-/Fortschrittsaktivität anzeigen (Standard: true)
        },
      },
    },
  },
}
```

- `progress.label`: benutzerdefinierte Bezeichnung, `"auto"`/nicht gesetzt zur Auswahl einer konfigurierten oder integrierten Bezeichnung oder `false`, um sie auszublenden.
- `progress.labels`: Kandidaten, die nur verwendet werden, wenn `label` auf `"auto"` gesetzt oder nicht gesetzt ist.
- `progress.maxLines`: maximale Anzahl fortlaufender Fortschrittszeilen, die im Entwurf beibehalten werden; ältere Zeilen werden darüber hinaus entfernt.
- `progress.maxLineChars`: maximale Zeichenanzahl pro kompakter Fortschrittszeile vor dem Abschneiden.
- `progress.toolProgress`: Wenn `true` (Standard), wird die Live-Werkzeug-/Fortschrittsaktivität im Entwurf angezeigt.

| `streaming`       | Verhalten                                                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (Standard) | Auf die vollständige Antwort warten und sie einmal senden. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                                  |
| `"partial"`       | Eine normale Textnachricht fortlaufend bearbeiten, während das Modell den aktuellen Block schreibt. Standardclients benachrichtigen möglicherweise bei der ersten Vorschau, nicht bei der endgültigen Bearbeitung. |
| `"quiet"`         | Wie `"partial"`, aber die Nachricht ist ein Hinweis ohne Benachrichtigung. Empfänger werden einmal benachrichtigt, wenn eine benutzerspezifische Push-Regel auf die endgültige Bearbeitung zutrifft (siehe unten). |
| `"progress"`      | Sendet einzelne kompakte Fortschrittszeilen mithilfe eines Fortschrittsentwurfs.                                                                                                         |

`blockStreaming` (Standard `false`) ist unabhängig von `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (Standard)                              |
| ----------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block; abgeschlossene Blöcke bleiben als Nachrichten erhalten | Live-Entwurf für den aktuellen Block, der direkt finalisiert wird |
| `"off"`                 | Eine Matrix-Nachricht mit Benachrichtigung pro abgeschlossenem Block      | Eine Matrix-Nachricht mit Benachrichtigung für die gesamte Antwort |

Hinweise:

- Wenn eine Vorschau die Größenbeschränkung von Matrix pro Ereignis überschreitet, beendet OpenClaw das Vorschau-Streaming und greift auf eine ausschließlich abschließende Auslieferung zurück.
- Medienantworten senden Anhänge immer regulär; wenn eine veraltete Vorschau nicht sicher wiederverwendet werden kann, schwärzt OpenClaw sie vor dem Senden der abschließenden Medienantwort.
- Aktualisierungen der Werkzeugfortschrittsvorschau sind standardmäßig aktiviert, wenn Vorschau-Streaming aktiv ist. Legen Sie `streaming.preview.toolProgress: false` fest, um Vorschauänderungen für Antworttext beizubehalten, den Werkzeugfortschritt jedoch über den normalen Auslieferungspfad zu senden.
- Vorschauänderungen verursachen zusätzliche Matrix-API-Aufrufe. Belassen Sie `streaming: "off"` für das konservativste Profil hinsichtlich der Ratenbegrenzung.

## Sprachnachrichten

Eingehende Matrix-Sprachnachrichten werden vor der Prüfung auf Raumerwähnungen transkribiert. Daher kann eine Sprachnachricht, in der der Botname genannt wird, den Agenten in einem Raum mit `requireMention: true` auslösen, und der Agent erhält das Transkript statt nur eines Platzhalters für einen Audioanhang.

Matrix verwendet den gemeinsamen Audiomedien-Provider unter `tools.media.audio`, beispielsweise OpenAI `gpt-4o-mini-transcribe`. Informationen zur Einrichtung des Providers und zu Beschränkungen finden Sie in der [Übersicht der Medienwerkzeuge](/de/tools/media-overview).

- `m.audio`-Ereignisse und `m.file`-Ereignisse mit einem `audio/*`-MIME-Typ kommen infrage.
- In verschlüsselten Räumen entschlüsselt OpenClaw den Anhang vor der Transkription über den bestehenden Matrix-Medienpfad.
- Das Transkript wird im Agenten-Prompt als maschinell erstellt und nicht vertrauenswürdig gekennzeichnet.
- Der Anhang wird als bereits transkribiert markiert, damit nachgelagerte Medienwerkzeuge ihn nicht erneut transkribieren.
- Legen Sie `tools.media.audio.enabled: false` fest, um die Audiotranskription global zu deaktivieren.

## Genehmigungsmetadaten

Native Matrix-Genehmigungsaufforderungen sind normale `m.room.message`-Ereignisse mit OpenClaw-spezifischen Inhalten unter dem Schlüssel `com.openclaw.approval`. Standardclients stellen den Textkörper weiterhin dar; OpenClaw-kompatible Clients können die strukturierte Genehmigungs-ID, Art, den Status, die Entscheidungen sowie Ausführungs-/Plugin-Details auslesen.

Wenn eine Aufforderung für ein einzelnes Matrix-Ereignis zu lang ist, teilt OpenClaw den sichtbaren Text in Abschnitte und fügt `com.openclaw.approval` nur dem ersten Abschnitt hinzu. Zulassen-/Ablehnen-Reaktionen werden diesem ersten Ereignis zugeordnet, sodass lange Aufforderungen dasselbe Genehmigungsziel wie Aufforderungen mit nur einem Ereignis behalten.

### Selbst gehostete Push-Regeln für zurückhaltende, fertiggestellte Vorschauen

`streaming: "quiet"` benachrichtigt Empfänger erst, wenn ein Block oder Durchlauf fertiggestellt wurde – eine benutzerspezifische Push-Regel muss mit der Markierung der fertiggestellten Vorschau übereinstimmen. Das vollständige Rezept finden Sie unter [Matrix-Push-Regeln für zurückhaltende Vorschauen](/de/channels/matrix-push-rules).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert. Verwenden Sie `allowBots`, um Datenverkehr zwischen Agenten gezielt zuzulassen:

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
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur, wenn sie diesen Bot sichtbar erwähnen; Direktnachrichten sind weiterhin unabhängig davon zulässig.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen einzelnen Raum.
- Akzeptierte Nachrichten von konfigurierten Bots verwenden den gemeinsamen [Bot-Schleifenschutz](/de/channels/bot-loop-protection). Konfigurieren Sie `channels.defaults.botLoopProtection` und überschreiben Sie die Einstellung anschließend pro Konto mit `channels.matrix.botLoopProtection` oder pro Raum mit `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwortschleifen zu vermeiden.
- Matrix besitzt kein natives Bot-Kennzeichen; OpenClaw behandelt eine Nachricht als „von einem Bot verfasst“, wenn sie von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet wurde.

Verwenden Sie strenge Raum-Zulassungslisten und Anforderungen für Erwähnungen, wenn Sie Bot-zu-Bot-Datenverkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten Räumen (E2EE) verwenden ausgehende Bildereignisse `thumbnail_file`, damit Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden; unverschlüsselte Räume verwenden das einfache `thumbnail_url`. Es ist keine Konfiguration erforderlich – das Plugin erkennt den E2EE-Status automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnoseinformationen), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Einrichtungen mit mehreren Konten). Standardmäßig ist die Ausgabe knapp gehalten.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
```

Initialisiert die geheime Speicherung und das Cross-Signing, erstellt bei Bedarf eine Sicherung der Raumschlüssel und gibt anschließend den Status und die nächsten Schritte aus. Nützliche Optionen:

- `--recovery-key <key>` wendet vor der Initialisierung einen Wiederherstellungsschlüssel an (bevorzugen Sie die unten beschriebene stdin-Form)
- `--force-reset-cross-signing` verwirft die aktuelle Cross-Signing-Identität und erstellt eine neue (nur bei beabsichtigter Verwendung)

Aktivieren Sie E2EE für ein neues Konto bereits bei der Erstellung:

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

`verify status` meldet drei unabhängige Vertrauenssignale (`--verbose` zeigt alle an):

- `Locally trusted`: wird nur von diesem Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: Das SDK meldet die Verifizierung über Cross-Signing
- `Signed by owner`: mit Ihrem eigenen Selbstsignierungsschlüssel signiert (nur zu Diagnosezwecken)

`Verified by owner` ist nur dann `yes`, wenn `Cross-signing verified` ebenfalls `yes` ist; lokales Vertrauen oder allein die Signatur eines Eigentümers reichen nicht aus.

`--allow-degraded-local-state` gibt Diagnoseinformationen nach bestem Bemühen zurück, ohne das Matrix-Konto zuvor vorzubereiten; dies ist für Offline- oder teilweise konfigurierte Prüfungen nützlich.

### Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren

Leiten Sie den Wiederherstellungsschlüssel über stdin weiter, anstatt ihn in der Befehlszeile zu übergeben:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für die geheime Speicherung oder das Gerätevertrauen akzeptiert.
- `Backup usable`: Die Raumschlüsselsicherung kann mit dem vertrauenswürdigen Wiederherstellungsmaterial geladen werden.
- `Device verified by owner`: Dieses Gerät genießt vollständiges Identitätsvertrauen durch Matrix-Cross-Signing.

Der Befehl wird mit einem Exit-Code ungleich null beendet, wenn das vollständige Identitätsvertrauen unvollständig ist, selbst wenn der Wiederherstellungsschlüssel Sicherungsmaterial entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung über einen anderen Matrix-Client ab:

```bash
openclaw matrix verify self
```

`verify self` wartet auf `Cross-signing verified: yes`, bevor der Befehl erfolgreich beendet wird. Verwenden Sie `--timeout-ms <ms>`, um die Wartezeit anzupassen.

Die Form mit literalem Schlüssel `openclaw matrix verify device "<recovery-key>"` funktioniert ebenfalls, der Schlüssel landet jedoch im Shell-Verlauf.

### Cross-Signing initialisieren oder reparieren

```bash
openclaw matrix verify bootstrap
```

Der Reparatur-/Einrichtungsbefehl für verschlüsselte Konten. Er führt der Reihe nach Folgendes aus:

- initialisiert die geheime Speicherung und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel erneut
- initialisiert Cross-Signing und lädt fehlende öffentliche Schlüssel hoch
- markiert und signiert das aktuelle Gerät per Cross-Signing
- erstellt eine serverseitige Sicherung der Raumschlüssel, falls noch keine vorhanden ist

Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln erfordert, versucht OpenClaw zuerst die Authentifizierung ohne Anmeldedaten, dann `m.login.dummy` und anschließend `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` verwenden) oder `--recovery-key <key>`
- `--force-reset-cross-signing`, um die aktuelle Cross-Signing-Identität zu verwerfen (nur absichtlich verwenden; erfordert, dass der aktive Wiederherstellungsschlüssel gespeichert ist oder mit `--recovery-key-stdin` bereitgestellt wird)

### Raum-Schlüsselsicherung

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt an, ob eine serverseitige Sicherung vorhanden ist und ob dieses Gerät sie entschlüsseln kann. `backup restore` importiert gesicherte Raumschlüssel in den lokalen Kryptospeicher; lassen Sie `--recovery-key-stdin` weg, wenn der Wiederherstellungsschlüssel bereits auf dem Datenträger gespeichert ist.

So ersetzen Sie eine beschädigte Sicherung durch einen neuen Ausgangsstand (nimmt den Verlust nicht wiederherstellbarer alter Verlaufsdaten in Kauf; kann auch den Geheimnisspeicher neu erstellen, wenn das aktuelle Sicherungsgeheimnis nicht geladen werden kann):

```bash
openclaw matrix verify backup reset --yes
```

Fügen Sie `--rotate-recovery-key` nur hinzu, wenn der vorherige Wiederherstellungsschlüssel den neuen Sicherungsausgangsstand absichtlich nicht mehr entsperren soll.

### Verifizierungen auflisten, anfordern und beantworten

```bash
openclaw matrix verify list
```

Listet ausstehende Verifizierungsanfragen für das ausgewählte Konto auf.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Sendet eine Verifizierungsanfrage von diesem Konto. `--own-user` fordert eine Selbstverifizierung an (nehmen Sie die Aufforderung in einem anderen Matrix-Client desselben Benutzers an); `--user-id`/`--device-id`/`--room-id` richten die Anfrage an eine andere Person. `--own-user` kann nicht mit den anderen Ziel-Flags kombiniert werden.

Für die Behandlung des Lebenszyklus auf niedrigerer Ebene – typischerweise während eingehende Anfragen eines anderen Clients parallel verfolgt werden – führen diese Befehle Aktionen für eine bestimmte Anfrage `<id>` aus (wird von `verify list` und `verify request` ausgegeben):

| Befehl                                     | Zweck                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Eine eingehende Anfrage annehmen                                    |
| `openclaw matrix verify start <id>`        | Den SAS-Ablauf starten                                               |
| `openclaw matrix verify sas <id>`          | Die SAS-Emojis oder Dezimalzahlen ausgeben                          |
| `openclaw matrix verify confirm-sas <id>`  | Bestätigen, dass der SAS mit der Anzeige des anderen Clients übereinstimmt |
| `openclaw matrix verify mismatch-sas <id>` | Den SAS ablehnen, wenn die Emojis oder Dezimalzahlen nicht übereinstimmen |
| `openclaw matrix verify cancel <id>`       | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als Hinweise für DM-Folgeaktionen, wenn die Verifizierung an einen bestimmten Direktnachrichtenraum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Bei mehreren benannten Konten und ohne `channels.matrix.defaultAccount` verweigern die Befehle eine Vermutung und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehler auf den Konfigurationsschlüssel dieses Kontos, beispielsweise `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startverhalten">
    Bei `encryption: true` ist der Standardwert von `startupVerification` `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät eine Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abklingzeit an (standardmäßig 24 Stunden). Passen Sie diese mit `startupVerificationCooldownHours` an oder deaktivieren Sie sie mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Kryptografie-Bootstrap-Durchlauf ausgeführt, der den aktuellen Geheimnisspeicher und die Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Zustand beschädigt ist, versucht OpenClaw selbst ohne `channels.matrix.password` eine abgesicherte Reparatur; wenn der Homeserver Passwort-UIA erfordert, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Eigentümer signierte Geräte bleiben erhalten.

    Den vollständigen Upgrade-Ablauf finden Sie unter [Matrix-Migration](/de/channels/matrix-migration).

  </Accordion>

  <Accordion title="Verifizierungshinweise">
    Matrix veröffentlicht Hinweise zum Verifizierungslebenszyklus als `m.notice`-Nachrichten im strikt festgelegten DM-Verifizierungsraum: Anfrage, Bereitschaft (mit dem Hinweis „Per Emoji verifizieren“), Start/Abschluss sowie SAS-Details (Emoji/Dezimalzahlen), sofern verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch angenommen. Bei der Selbstverifizierung startet OpenClaw den SAS-Ablauf automatisch und bestätigt die eigene Seite, sobald die Emoji-Verifizierung verfügbar ist – Sie müssen die Angaben weiterhin vergleichen und in Ihrem Matrix-Client „They match“ bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Gelöschtes oder ungültiges Matrix-Gerät">
    Wenn `verify status` meldet, dass das aktuelle Gerät nicht mehr auf dem Homeserver aufgeführt ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für die Anmeldung mit Passwort:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Erstellen Sie für die Token-Authentifizierung in Ihrem Matrix-Client oder der Admin-Oberfläche ein neues Zugriffstoken und aktualisieren Sie anschließend OpenClaw:

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
    Matrix E2EE verwendet den offiziellen Rust-Kryptografiepfad des `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Der Kryptografiezustand wird in `crypto-idb-snapshot.json` gespeichert (restriktive Dateiberechtigungen).

    Der verschlüsselte Laufzeitzustand befindet sich unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Synchronisierungsspeicher, Kryptospeicher, Wiederherstellungsschlüssel, IDB-Snapshot, Thread-Bindungen und den Zustand der Startverifizierung. Wenn sich das Token ändert, die Kontoidentität jedoch gleich bleibt, verwendet OpenClaw das am besten geeignete vorhandene Stammverzeichnis wieder, sodass der vorherige Zustand sichtbar bleibt.

    Ein einzelner älterer Token-Hash-Stamm kann ein normaler Kontinuitätspfad für die Token-Rotation sein. Wenn OpenClaw `matrix: multiple populated token-hash storage roots detected` protokolliert, prüfen Sie das Kontoverzeichnis und archivieren Sie veraltete benachbarte Stämme erst, nachdem Sie bestätigt haben, dass der ausgewählte aktive Stamm fehlerfrei ist. Verschieben Sie veraltete Stämme vorzugsweise in ein Verzeichnis `_archive/`, statt sie sofort zu löschen.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Übergeben Sie beide Optionen in einem Aufruf. Matrix akzeptiert `mxc://`-Avatar-URLs direkt; bei Übergabe von `http://`/`https://` wird die Datei zuerst hochgeladen und die aufgelöste `mxc://`-URL in `channels.matrix.avatarUrl` (oder der kontospezifischen Überschreibung) gespeichert.

## Threads

Matrix unterstützt native Threads sowohl für automatische Antworten als auch für Sendungen über das Nachrichten-Tool. Zwei unabhängige Einstellungen steuern das Verhalten:

### Sitzungsrouting (`sessionScope`)

`dm.sessionScope` bestimmt, wie Matrix-DM-Räume OpenClaw-Sitzungen zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Kommunikationspartner teilen sich eine Sitzung.
- `"per-room"`: Jeder Matrix-DM-Raum erhält einen eigenen Sitzungsschlüssel, selbst für denselben Kommunikationspartner.

Explizite Konversationsbindungen haben immer Vorrang vor `sessionScope`; gebundene Räume und Threads behalten ihre ausgewählte Zielsitzung.

### Antwort-Threading (`threadReplies`)

`threadReplies` bestimmt, wo der Bot seine Antwort veröffentlicht:

- `"off"`: Antworten erscheinen auf oberster Ebene. Eingehende Nachrichten in Threads verbleiben in der übergeordneten Sitzung.
- `"inbound"`: Es wird nur innerhalb eines Threads geantwortet, wenn sich die eingehende Nachricht bereits in diesem Thread befand.
- `"always"`: Es wird innerhalb eines Threads geantwortet, dessen Stamm die auslösende Nachricht ist; diese Konversation wird ab dem ersten Auslöser über eine entsprechende Thread-spezifische Sitzung geroutet.

`dm.threadReplies` überschreibt dies nur für DMs – beispielsweise können Raum-Threads isoliert bleiben, während DMs ohne Threads geführt werden.

### Thread-Vererbung und Slash-Befehle

- Eingehende Nachrichten in Threads enthalten die Thread-Stammnachricht als zusätzlichen Agentenkontext.
- Sendungen über das Nachrichten-Tool übernehmen automatisch den aktuellen Matrix-Thread, wenn sie an denselben Raum (oder dasselbe DM-Benutzerziel) gerichtet sind, sofern keine explizite `threadId` angegeben ist.
- Die Wiederverwendung eines DM-Benutzerziels greift nur, wenn die aktuellen Sitzungsmetadaten denselben DM-Kommunikationspartner im selben Matrix-Konto belegen; andernfalls fällt OpenClaw auf das normale benutzerspezifische Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und Thread-gebundenes `/acp spawn` funktionieren sämtlich in Matrix-Räumen und DMs.
- `/focus` auf oberster Ebene erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSessions` aktiviert ist.
- Wird `/focus` oder `/acp spawn --thread here` innerhalb eines vorhandenen Matrix-Threads ausgeführt, wird dieser Thread direkt gebunden.

Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsam genutzten Sitzung kollidiert, veröffentlicht es einmalig eine `m.notice`, die auf den Ausweg über `/focus` hinweist und eine Änderung von `dm.sessionScope` empfiehlt. Der Hinweis erscheint nur, wenn Thread-Bindungen aktiviert sind.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und vorhandene Matrix-Threads können zu dauerhaften ACP-Arbeitsbereichen werden, ohne die Chat-Oberfläche zu ändern.

Schneller Ablauf für Betreiber:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des vorhandenen Threads aus, den Sie weiterverwenden möchten.
- In einer DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geroutet.
- Innerhalb eines vorhandenen Threads bindet `--bind here` den aktuellen Thread direkt.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

`--bind here` erstellt keinen untergeordneten Matrix-Thread. `threadBindings.spawnSessions` steuert `/acp spawn --thread auto|here`, wobei OpenClaw einen untergeordneten Thread erstellen oder binden muss.

### Konfiguration der Thread-Bindung

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt kanalspezifische Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: steuert sowohl das Erzeugen von Subagenten- als auch ACP-Threads.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: engere Überschreibungen für ausschließlich Subagenten- bzw. ausschließlich ACP-Erzeugungen.
- `threadBindings.defaultSpawnContext`

Das Erzeugen Matrix-Thread-gebundener Sitzungen ist standardmäßig aktiviert. Setzen Sie `threadBindings.spawnSessions: false`, um zu verhindern, dass `/focus` und `/acp spawn --thread auto|here` auf oberster Ebene Matrix-Threads erstellen oder binden. Setzen Sie `threadBindings.defaultSpawnContext: "isolated"`, wenn native Subagenten-Thread-Erzeugungen das übergeordnete Transkript nicht abspalten sollen.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, Benachrichtigungen über eingehende Reaktionen und Bestätigungsreaktionen.

Die Funktion für ausgehende Reaktionen wird durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionsübersicht für ein Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bots.

**Auflösungsreihenfolge** (der erste definierte Wert gewinnt):

| Einstellung             | Reihenfolge                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | kontospezifisch -> Kanal -> `messages.ackReaction` -> Emoji-Fallback der Agentenidentität |
| `ackReactionScope`      | kontospezifisch -> Kanal -> `messages.ackReactionScope` -> Standard `"group-mentions"` |
| `reactionNotifications` | kontospezifisch -> Kanal -> Standard `"own"`                                        |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten abzielen; `"off"` deaktiviert Reaktions-Systemereignisse. Das Entfernen von Reaktionen wird nicht als Systemereignis synthetisiert – Matrix stellt dies als Schwärzungen dar, nicht als eigenständige Entfernungen von `m.reaction`.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standardwert ist `0`, wenn beide nicht gesetzt sind (deaktiviert).
- Der Matrix-Raumverlauf gilt nur für Räume; DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Raumverlauf enthält nur ausstehende Nachrichten: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann eine Momentaufnahme dieses Fensters, sobald eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle auslösende Nachricht ist nicht in `InboundHistory` enthalten; sie verbleibt für diesen Durchlauf im eingehenden Hauptinhalt.
- Wiederholungsversuche desselben Matrix-Ereignisses verwenden erneut die ursprüngliche Verlaufsmomentaufnahme, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Stämme und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standardwert. Ergänzender Kontext wird wie empfangen beibehalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Zulassungslistenprüfungen für Raum und Benutzer erlaubt sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält jedoch weiterhin eine explizit zitierte Antwort bei.

Dies betrifft nur die Sichtbarkeit des ergänzenden Kontexts, nicht die Frage, ob die eingehende Nachricht selbst eine Antwort auslösen kann. Die Berechtigung zum Auslösen stammt weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Um DMs vollständig stummzuschalten und Räume weiterhin funktionsfähig zu halten, setzen Sie `dm.enabled: false`:

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

Informationen zum Erwähnungs-Gating und Verhalten von Zulassungslisten finden Sie unter [Gruppen](/de/channels/groups).

Kopplungsbeispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer vor der Genehmigung weitere Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Kopplungscode erneut und sendet nach einer kurzen Abklingzeit möglicherweise eine Erinnerungsantwort, statt einen neuen Code zu erzeugen.

Informationen zum gemeinsamen DM-Kopplungsablauf und Speicherlayout finden Sie unter [Kopplung](/de/channels/pairing).

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

Alte Räume werden nicht automatisch gelöscht. Der Ablauf wählt die fehlerfreie DM aus und aktualisiert die Zuordnung, damit zukünftige Matrix-Sendungen, Verifizierungshinweise und andere Direktnachrichtenabläufe an den richtigen Raum gerichtet werden.

## Ausführungsgenehmigungen

Matrix kann als nativer Genehmigungsclient fungieren. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder `channels.matrix.accounts.<account>.execApprovals` für eine kontospezifische Überschreibung):

- `enabled`: stellt Genehmigungen über Matrix-native Eingabeaufforderungen zu. Nicht gesetzt oder `"auto"` aktiviert die Funktion automatisch, sobald mindestens eine genehmigungsberechtigte Person aufgelöst werden kann; setzen Sie `false`, um sie explizit zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Ausführungsanfragen genehmigen dürfen. Fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: Ziel der Eingabeaufforderungen. `"dm"` (Standard) sendet an die DMs der genehmigungsberechtigten Personen; `"channel"` sendet an den ursprünglichen Raum oder die ursprüngliche DM; `"both"` sendet an beide.
- `agentFilter` / `sessionFilter`: optionale Zulassungslisten dafür, welche Agenten bzw. Sitzungen die Matrix-Zustellung auslösen.

Die Autorisierung unterscheidet sich geringfügig zwischen den Genehmigungsarten:

- **Ausführungsgenehmigungen** verwenden `execApprovals.approvers` und fallen auf `dm.allowFrom` zurück.
- **Plugin-Genehmigungen** autorisieren ausschließlich über `dm.allowFrom`.

Beide Arten verwenden dieselben Matrix-Reaktionskürzel und Nachrichtenaktualisierungen. Genehmigungsberechtigte Personen sehen Reaktionskürzel an der primären Genehmigungsnachricht:

- ✅ einmal zulassen
- ❌ ablehnen
- ♾️ immer zulassen (wenn die wirksame Ausführungsrichtlinie dies erlaubt)

Ersatzweise verfügbare Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste genehmigungsberechtigte Personen können genehmigen oder ablehnen. Die Kanalzustellung für Ausführungsgenehmigungen enthält den Befehlstext – aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandt: [Ausführungsgenehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in DMs. In Räumen erkennt OpenClaw außerdem Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist. Dadurch löst `@bot:server /new` den Befehlspfad ohne einen benutzerdefinierten regulären Ausdruck für Erwähnungen aus – so reagiert der Bot weiterhin auf raumtypische Beiträge im Format `@mention /command`, die Element und ähnliche Clients ausgeben, wenn ein Benutzer den Bot per Tabulatorvervollständigung auswählt, bevor er den Befehl eingibt.

Die Autorisierungsregeln gelten weiterhin: Absender von Befehlen müssen dieselben DM- oder Raum-Zulassungslisten- bzw. Eigentümerrichtlinien erfüllen wie gewöhnliche Nachrichten.

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

- Werte auf der obersten Ebene unter `channels.matrix` dienen als Standardwerte für benannte Konten, sofern sie nicht vom jeweiligen Konto überschrieben werden.
- Ordnen Sie einen geerbten Raumeintrag mit `groups.<room>.account` einem bestimmten Konto zu. Einträge ohne `account` werden von allen Konten gemeinsam verwendet; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf der obersten Ebene konfiguriert ist.

**Auswahl des Standardkontos:**

- Legen Sie `defaultAccount` fest, um das benannte Konto auszuwählen, das bei implizitem Routing, Statusabfragen und CLI-Befehlen bevorzugt wird.
- Wenn Sie mehrere Konten haben und eines davon wörtlich `default` heißt, verwendet OpenClaw es implizit, auch wenn `defaultAccount` nicht festgelegt ist.
- Bei mehreren benannten Konten ohne ausgewähltes Standardkonto verweigern CLI-Befehle eine automatische Auswahl – legen Sie `defaultAccount` fest oder übergeben Sie `--account <id>`.
- Der Block `channels.matrix.*` auf der obersten Ebene wird nur dann als implizites Konto `default` behandelt, wenn seine Authentifizierungsdaten vollständig sind (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben anhand von `homeserver` + `userId` erkennbar, sobald zwischengespeicherte Anmeldedaten die Authentifizierung abdecken.

**Überführung:**

- Wenn OpenClaw bei einer Reparatur oder Einrichtung eine Einzelkontokonfiguration in eine Mehrkontenkonfiguration überführt, behält es das vorhandene benannte Konto bei, sofern eines existiert oder `defaultAccount` bereits auf eines verweist. Nur Matrix-Schlüssel für Authentifizierung und Bootstrap werden in das überführte Konto verschoben; gemeinsam verwendete Schlüssel für Zustellrichtlinien verbleiben auf der obersten Ebene.

Das gemeinsame Mehrkontenmuster finden Sie in der [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels).

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw zum Schutz vor SSRF private/interne Matrix-Homeserver, sofern Sie diese nicht für das jeweilige Konto ausdrücklich zulassen.

Wenn Ihr Homeserver auf localhost, einer LAN-/Tailscale-IP-Adresse oder unter einem internen Hostnamen ausgeführt wird, aktivieren Sie für dieses Konto `network.dangerouslyAllowPrivateNetwork`:

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

Beispiel für die Einrichtung über die CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Diese ausdrückliche Freigabe erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie `http://matrix.example.org:8008` bleiben blockiert. Verwenden Sie nach Möglichkeit `https://`.

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

Benannte Konten können den Standardwert der obersten Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben. OpenClaw verwendet dieselbe Proxy-Einstellung für den Matrix-Datenverkehr zur Laufzeit und für Kontostatusabfragen.

## Zielauflösung

Matrix akzeptiert überall, wo OpenClaw ein Raum- oder Benutzerziel verlangt, die folgenden Zielformate:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Bei Matrix-Raum-IDs wird zwischen Groß- und Kleinschreibung unterschieden. Verwenden Sie beim Konfigurieren expliziter Zustellungsziele, Cron-Jobs, Bindungen oder Positivlisten exakt die Groß- und Kleinschreibung der Raum-ID aus Matrix. OpenClaw hält interne Sitzungsschlüssel für die Speicherung in kanonischer Form; diese kleingeschriebenen Schlüssel sind daher keine zuverlässige Quelle für Matrix-Zustellungs-IDs.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliase direkt. Die Suche nach Namen beigetretener Räume erfolgt nach bestem Bemühen und gilt nur für Laufzeit-Raumpositivlisten, wenn `dangerouslyAllowNameMatching: true` gesetzt ist.
- Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er bei der Laufzeitauflösung der Positivliste ignoriert.

## Konfigurationsreferenz

Benutzerfelder im Stil einer Positivliste (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs (am sichersten). Einträge, die keine IDs sind, werden standardmäßig ignoriert. Wenn `dangerouslyAllowNameMatching: true` gesetzt ist, werden exakte Übereinstimmungen mit Matrix-Anzeigenamen im Verzeichnis beim Start sowie bei jeder Änderung der Positivliste während der Ausführung des Monitors aufgelöst; nicht auflösbare Einträge werden zur Laufzeit ignoriert.

Schlüssel der Raumpositivliste (`groups`, veraltet `rooms`) sollten Raum-IDs oder Aliase sein. Einfache Raumnamen als Schlüssel werden standardmäßig ignoriert; `dangerouslyAllowNameMatching: true` stellt die Suche nach Namen beigetretener Räume nach bestem Bemühen wieder her.

### Konto und Verbindung

- `enabled`: aktiviert oder deaktiviert den Kanal.
- `name`: optionale Anzeigenbezeichnung für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: benannte kontospezifische Überschreibungen. Werte auf der obersten Ebene von `channels.matrix` werden als Standardwerte übernommen.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: erlaubt diesem Konto, eine Verbindung zu `localhost`, LAN-/Tailscale-IPs oder internen Hostnamen herzustellen.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Kontospezifische Überschreibung wird unterstützt.
- `userId`: vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartext- und SecretRef-Werte werden über Umgebungs-, Datei- und Exec-Provider hinweg unterstützt ([Secret-Verwaltung](/de/gateway/secrets)).
- `password`: Passwort für die passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts, der bei der passwortbasierten Anmeldung verwendet wird.
- `avatarUrl`: gespeicherte URL des eigenen Avatars für die Profilsynchronisierung und Aktualisierungen mit `profile set`.
- `initialSyncLimit`: maximale Anzahl der während der Startsynchronisierung abgerufenen Ereignisse.

### Verschlüsselung

- `encryption`: aktiviert E2EE. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard bei aktiviertem E2EE) oder `"off"`. Fordert beim Start automatisch eine Selbstverifizierung an, wenn dieses Gerät nicht verifiziert ist.
- `startupVerificationCooldownHours`: Wartezeit bis zur nächsten automatischen Startanforderung. Standard: `24`.

### Zugriff und Richtlinien

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Positivliste der Benutzer-IDs für Raumdatenverkehr.
- `mentionPatterns`: bereichsbezogene reguläre Ausdrücke für Erwähnungen in Räumen. Objekt mit `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Steuert pro Raum, ob die konfigurierten `agents.list[].groupChat.mentionPatterns` gelten.
- `dm.enabled`: ignoriert alle Direktnachrichten, wenn `false`. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Gilt, nachdem der Bot beigetreten ist und den Raum als Direktnachricht klassifiziert hat; die Behandlung von Einladungen wird dadurch nicht beeinflusst.
- `dm.allowFrom`: Positivliste der Benutzer-IDs für Direktnachrichtenverkehr.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: nur für Direktnachrichten geltende Überschreibung für Antwort-Threads (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten (`true` oder `"mentions"`).
- `allowlistOnly`: erzwingt bei `true` für alle aktiven Direktnachrichtenrichtlinien (außer `"disabled"`) und für `"open"`-Gruppenrichtlinien den Wert `"allowlist"`. Richtlinien mit `"disabled"` werden nicht geändert.
- `dangerouslyAllowNameMatching`: erlaubt bei `true` die Matrix-Verzeichnissuche nach Anzeigenamen für Einträge in Benutzerpositivlisten sowie die Suche nach Namen beigetretener Räume für Schlüssel in Raumpositivlisten. Bevorzugen Sie vollständige IDs im Format `@user:server` sowie Raum-IDs oder Aliase.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich Einladungen im Stil von Direktnachrichten.
- `autoJoinAllowlist`: Räume/Aliase, die zulässig sind, wenn `autoJoin` auf `"allowlist"` gesetzt ist. Alias-Einträge werden anhand des Homeservers aufgelöst, nicht anhand des vom eingeladenen Raum beanspruchten Zustands.
- `contextVisibility`: ergänzende Sichtbarkeit des Kontexts (`"all"` als Standard, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"` (Standard), `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"` (der Standardwert auf oberster Ebene wird zu `"inbound"` aufgelöst, sofern nicht explizit festgelegt), `"inbound"` oder `"always"`.
- `threadBindings`: kanalspezifische Überschreibungen für das Routing und den Lebenszyklus threadgebundener Sitzungen.
- `streaming`: `"off"` (Standard), `"partial"`, `"quiet"`, `"progress"` oder die Objektform `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: wenn `true`, werden abgeschlossene Assistentenblöcke als separate Fortschrittsmeldungen beibehalten. Standard: `false`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: Größe ausgehender Abschnitte in Zeichen, wenn `chunkMode: "length"`. Standard: `4000`.
- `chunkMode`: `"length"` (Standard, teilt nach Zeichenanzahl) oder `"newline"` (teilt an Zeilengrenzen).
- `historyLimit`: Anzahl der letzten Raumnachrichten, die als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standardwert `0` (deaktiviert).
- `mediaMaxMb`: Obergrenze der Mediengröße in MB für ausgehende Sendungen und die Verarbeitung eingehender Medien. Standard: `20`.

### Reaktionseinstellungen

- `ackReaction`: Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: Bereichsüberschreibung (`"group-mentions"` als Standard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (`"own"` als Standard, `"off"`).

### Werkzeuge und raumspezifische Überschreibungen

- `actions`: aktionsspezifische Werkzeugfreigabe (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: raumspezifische Richtlinienzuordnung. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein veralteter Alias.)
  - `groups.<room>.account`: beschränkt einen übernommenen Raumeintrag auf ein bestimmtes Konto.
  - `groups.<room>.enabled`: raumspezifischer Schalter. Bei `false` wird der Raum ignoriert, als wäre er nicht in der Zuordnung enthalten.
  - `groups.<room>.requireMention`: raumspezifische Überschreibung der Erwähnungsanforderung auf Kanalebene.
  - `groups.<room>.allowBots`: raumspezifische Überschreibung der Einstellung auf Kanalebene (`true` oder `"mentions"`).
  - `groups.<room>.botLoopProtection`: raumspezifische Überschreibung des Budgets für den Schutz vor Bot-zu-Bot-Schleifen.
  - `groups.<room>.users`: raumspezifische Absenderpositivliste.
  - `groups.<room>.tools`: raumspezifische Überschreibungen zum Zulassen oder Verweigern von Werkzeugen.
  - `groups.<room>.autoReply`: raumspezifische Überschreibung der Erwähnungsbeschränkung. `true` deaktiviert Erwähnungsanforderungen für diesen Raum; `false` aktiviert sie wieder.
  - `groups.<room>.skills`: raumspezifischer Skills-Filter.
  - `groups.<room>.systemPrompt`: raumspezifischer Ausschnitt des System-Prompts.

### Einstellungen für Exec-Genehmigungen

- `execApprovals.enabled`: übermittelt Exec-Genehmigungen über Matrix-native Eingabeaufforderungen.
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Genehmigungen erteilen dürfen. Fällt auf `dm.allowFrom` zurück.
- `execApprovals.target`: `"dm"` (Standard), `"channel"` oder `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionale Agenten-/Sitzungspositivlisten für die Zustellung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) - Direktnachrichten-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) - Verhalten von Gruppenchats und Erwähnungsbeschränkung
- [Kanal-Routing](/de/channels/channel-routing) - Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) - Zugriffsmodell und Absicherung

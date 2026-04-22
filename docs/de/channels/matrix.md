---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Status des Matrix-Supports, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-04-22T04:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e78d85096ea84361951935a0daf34966c575d822f8581277eb384276c7c706a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix ist ein gebündeltes Channel-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn du eine ältere Build-Version oder eine benutzerdefinierte Installation verwendest, die Matrix ausschließt, installiere
es manuell:

Von npm installieren:

```bash
openclaw plugins install @openclaw/matrix
```

Aus einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Siehe [Plugins](/de/tools/plugin) für das Verhalten von Plugins und Installationsregeln.

## Einrichtung

1. Stelle sicher, dass das Matrix-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstelle ein Matrix-Konto auf deinem Homeserver.
3. Konfiguriere `channels.matrix` mit entweder:
   - `homeserver` + `accessToken`, oder
   - `homeserver` + `userId` + `password`.
4. Starte das Gateway neu.
5. Starte eine DM mit dem Bot oder lade ihn in einen Raum ein.
   - Neue Matrix-Einladungen funktionieren nur, wenn `channels.matrix.autoJoin` sie erlaubt.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

Der Matrix-Assistent fragt nach:

- Homeserver-URL
- Authentifizierungsmethode: Access Token oder Passwort
- Benutzer-ID (nur bei Passwort-Authentifizierung)
- optionaler Gerätename
- ob E2EE aktiviert werden soll
- ob Raumzugriff und automatisches Beitreten bei Einladungen konfiguriert werden sollen

Wichtige Verhaltensweisen des Assistenten:

- Wenn Matrix-Auth-Umgebungsvariablen bereits vorhanden sind und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Umgebungsvariablen-Verknüpfung an, damit die Authentifizierung in Umgebungsvariablen bleibt.
- Kontonamen werden zur Konto-ID normalisiert. Zum Beispiel wird `Ops Bot` zu `ops-bot`.
- DM-Allowlist-Einträge akzeptieren `@user:server` direkt; Anzeigenamen funktionieren nur, wenn die Live-Verzeichnissuche genau einen Treffer findet.
- Raum-Allowlist-Einträge akzeptieren Raum-IDs und Aliase direkt. Bevorzuge `!room:server` oder `#alias:server`; nicht aufgelöste Namen werden bei der Laufzeit durch die Allowlist-Auflösung ignoriert.
- Im Allowlist-Modus für automatisches Beitreten bei Einladungen nur stabile Einladungsziele verwenden: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.
- Um Raumnamen vor dem Speichern aufzulösen, verwende `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` hat standardmäßig den Wert `off`.

Wenn du es nicht setzt, tritt der Bot eingeladenen Räumen oder neuen DM-ähnlichen Einladungen nicht bei. Er erscheint also nicht in neuen Gruppen oder eingeladenen DMs, sofern du nicht zuerst manuell beitrittst.

Setze `autoJoin: "allowlist"` zusammen mit `autoJoinAllowlist`, um einzuschränken, welche Einladungen akzeptiert werden, oder setze `autoJoin: "always"`, wenn er jeder Einladung beitreten soll.

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

Matrix speichert zwischengespeicherte Zugangsdaten in `~/.openclaw/credentials/matrix/`.
Das Standardkonto verwendet `credentials.json`; benannte Konten verwenden `credentials-<account>.json`.
Wenn dort zwischengespeicherte Zugangsdaten vorhanden sind, betrachtet OpenClaw Matrix für Einrichtung, Doctor und Channel-Status-Erkennung als konfiguriert, auch wenn die aktuelle Authentifizierung nicht direkt in der Konfiguration gesetzt ist.

Entsprechende Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Für Nicht-Standardkonten verwende kontobezogene Umgebungsvariablen:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Beispiel für das Konto `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Für die normalisierte Konto-ID `ops-bot` verwende:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix maskiert Satzzeichen in Konto-IDs, damit kontobezogene Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, sodass `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet wird.

Der interaktive Assistent bietet die Verknüpfung mit Umgebungsvariablen nur an, wenn diese Auth-Umgebungsvariablen bereits vorhanden sind und für das ausgewählte Konto noch keine Matrix-Authentifizierung in der Konfiguration gespeichert ist.

## Konfigurationsbeispiel

Dies ist eine praktische Basiskonfiguration mit DM-Pairing, Raum-Allowlist und aktiviertem E2EE:

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

`autoJoin` gilt für alle Matrix-Einladungen, einschließlich DM-ähnlicher Einladungen. OpenClaw kann einen eingeladenen Raum
zum Zeitpunkt der Einladung nicht zuverlässig als DM oder Gruppe klassifizieren, daher laufen alle Einladungen zuerst über `autoJoin`.
`dm.policy` gilt, nachdem der Bot beigetreten ist und der Raum als DM klassifiziert wurde.

## Streaming-Vorschauen

Matrix-Antwort-Streaming ist optional.

Setze `channels.matrix.streaming` auf `"partial"`, wenn OpenClaw eine einzelne Live-Vorschauantwort senden,
diese Vorschau während der Textgenerierung des Modells direkt bearbeiten und sie nach Abschluss der
Antwort finalisieren soll:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` ist der Standard. OpenClaw wartet auf die endgültige Antwort und sendet sie einmal.
- `streaming: "partial"` erstellt eine bearbeitbare Vorschau-Nachricht für den aktuellen Assistant-Block mit normalen Matrix-Textnachrichten. Dadurch bleibt das Legacy-Benachrichtigungsverhalten von Matrix mit Vorschau-zuerst erhalten, sodass Standard-Clients möglicherweise auf den ersten gestreamten Vorschautext statt auf den fertigen Block benachrichtigen.
- `streaming: "quiet"` erstellt eine bearbeitbare stille Vorschau-Mitteilung für den aktuellen Assistant-Block. Verwende dies nur, wenn du zusätzlich Push-Regeln für Empfänger für finalisierte Vorschau-Bearbeitungen konfigurierst.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Wenn Vorschau-Streaming aktiviert ist, behält Matrix den Live-Entwurf für den aktuellen Block bei und erhält abgeschlossene Blöcke als separate Nachrichten.
- Wenn Vorschau-Streaming aktiviert und `blockStreaming` deaktiviert ist, bearbeitet Matrix den Live-Entwurf direkt und finalisiert dasselbe Event, wenn der Block oder Turn abgeschlossen ist.
- Wenn die Vorschau nicht mehr in ein einzelnes Matrix-Event passt, stoppt OpenClaw das Vorschau-Streaming und greift auf die normale abschließende Zustellung zurück.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie, bevor die endgültige Medienantwort gesendet wird.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lasse Streaming deaktiviert, wenn du das konservativste Rate-Limit-Verhalten möchtest.

`blockStreaming` aktiviert Entwurfsvorschauen nicht von selbst.
Verwende `streaming: "partial"` oder `streaming: "quiet"` für Vorschau-Bearbeitungen; füge dann `blockStreaming: true` nur hinzu, wenn abgeschlossene Assistant-Blöcke zusätzlich als separate Fortschrittsnachrichten sichtbar bleiben sollen.

Wenn du Standard-Matrix-Benachrichtigungen ohne benutzerdefinierte Push-Regeln benötigst, verwende `streaming: "partial"` für Verhalten mit Vorschau-zuerst oder lasse `streaming` für reine Endzustellung deaktiviert. Mit `streaming: "off"` gilt:

- `blockStreaming: true` sendet jeden abgeschlossenen Block als normale benachrichtigende Matrix-Nachricht.
- `blockStreaming: false` sendet nur die endgültige abgeschlossene Antwort als normale benachrichtigende Matrix-Nachricht.

### Selbstgehostete Push-Regeln für stille finalisierte Vorschauen

Wenn du deine eigene Matrix-Infrastruktur betreibst und stille Vorschauen nur dann benachrichtigen sollen, wenn ein Block oder
eine endgültige Antwort abgeschlossen ist, setze `streaming: "quiet"` und füge eine benutzerspezifische Push-Regel für finalisierte Vorschau-Bearbeitungen hinzu.

Dies ist normalerweise eine Empfänger-Benutzereinrichtung, keine globale Konfigurationsänderung des Homeservers:

Kurzübersicht, bevor du beginnst:

- Empfängerbenutzer = die Person, die die Benachrichtigung erhalten soll
- Bot-Benutzer = das OpenClaw-Matrix-Konto, das die Antwort sendet
- verwende für die untenstehenden API-Aufrufe das Access Token des Empfängerbenutzers
- gleiche `sender` in der Push-Regel mit der vollständigen MXID des Bot-Benutzers ab

1. Konfiguriere OpenClaw für die Verwendung stiller Vorschauen:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Stelle sicher, dass das Empfängerkonto bereits normale Matrix-Push-Benachrichtigungen erhält. Regeln für stille Vorschauen
   funktionieren nur, wenn dieser Benutzer bereits funktionierende Pushers/Geräte hat.

3. Hole das Access Token des Empfängerbenutzers.
   - Verwende das Token des empfangenden Benutzers, nicht das Token des Bots.
   - Die Wiederverwendung eines vorhandenen Client-Sitzungstokens ist in der Regel am einfachsten.
   - Wenn du ein neues Token erzeugen musst, kannst du dich über die standardmäßige Matrix Client-Server API anmelden:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Überprüfe, ob das Empfängerkonto bereits Pushers hat:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Wenn dies keine aktiven Pushers/Geräte zurückgibt, behebe zuerst normale Matrix-Benachrichtigungen, bevor du die
untenstehende OpenClaw-Regel hinzufügst.

OpenClaw markiert finalisierte reine Text-Vorschau-Bearbeitungen mit:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Erstelle für jedes Empfängerkonto, das diese Benachrichtigungen erhalten soll, eine Override-Push-Regel:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Ersetze diese Werte, bevor du den Befehl ausführst:

- `https://matrix.example.org`: die Basis-URL deines Homeservers
- `$USER_ACCESS_TOKEN`: das Access Token des empfangenden Benutzers
- `openclaw-finalized-preview-botname`: eine Regel-ID, die für diesen Bot bei diesem empfangenden Benutzer eindeutig ist
- `@bot:example.org`: die MXID deines OpenClaw-Matrix-Bots, nicht die MXID des empfangenden Benutzers

Wichtig für Setups mit mehreren Bots:

- Push-Regeln sind über `ruleId` gekennzeichnet. Ein erneutes `PUT` mit derselben Regel-ID aktualisiert diese eine Regel.
- Wenn ein empfangender Benutzer für mehrere OpenClaw-Matrix-Bot-Konten Benachrichtigungen erhalten soll, erstelle eine Regel pro Bot mit einer eindeutigen Regel-ID für jede `sender`-Übereinstimmung.
- Ein einfaches Muster ist `openclaw-finalized-preview-<botname>`, zum Beispiel `openclaw-finalized-preview-ops` oder `openclaw-finalized-preview-support`.

Die Regel wird gegen den Event-Absender ausgewertet:

- authentifiziere dich mit dem Token des empfangenden Benutzers
- gleiche `sender` mit der MXID des OpenClaw-Bots ab

6. Überprüfe, ob die Regel vorhanden ist:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Teste eine gestreamte Antwort. Im stillen Modus sollte der Raum eine stille Entwurfsvorschau anzeigen, und die abschließende
   Bearbeitung direkt an Ort und Stelle sollte benachrichtigen, sobald der Block oder Turn abgeschlossen ist.

Wenn du die Regel später entfernen musst, lösche dieselbe Regel-ID mit dem Token des empfangenden Benutzers:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Hinweise:

- Erstelle die Regel mit dem Access Token des empfangenden Benutzers, nicht mit dem des Bots.
- Neue benutzerdefinierte `override`-Regeln werden vor den standardmäßigen Unterdrückungsregeln eingefügt, daher ist kein zusätzlicher Ordnungsparameter erforderlich.
- Dies betrifft nur reine Text-Vorschau-Bearbeitungen, die OpenClaw sicher direkt an Ort und Stelle finalisieren kann. Medien-Fallbacks und veraltete Vorschau-Fallbacks verwenden weiterhin die normale Matrix-Zustellung.
- Wenn `GET /_matrix/client/v3/pushers` keine Pushers anzeigt, hat der Benutzer für dieses Konto/Gerät noch keine funktionierende Matrix-Push-Zustellung.

#### Synapse

Für Synapse reicht die obige Einrichtung normalerweise bereits aus:

- Keine spezielle Änderung in `homeserver.yaml` ist für finalisierte OpenClaw-Vorschau-Benachrichtigungen erforderlich.
- Wenn deine Synapse-Bereitstellung bereits normale Matrix-Push-Benachrichtigungen sendet, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn du Synapse hinter einem Reverse Proxy oder mit Workern betreibst, stelle sicher, dass `/_matrix/client/.../pushrules/` Synapse korrekt erreicht.
- Wenn du Synapse-Worker verwendest, stelle sicher, dass Pushers ordnungsgemäß funktionieren. Die Push-Zustellung wird vom Hauptprozess oder von `synapse.app.pusher` / konfigurierten Pusher-Workern verarbeitet.

#### Tuwunel

Für Tuwunel verwende denselben Einrichtungsablauf und denselben `push-rule`-API-Aufruf wie oben gezeigt:

- Für den Marker für finalisierte Vorschauen selbst ist keine Tuwunel-spezifische Konfiguration erforderlich.
- Wenn normale Matrix-Benachrichtigungen für diesen Benutzer bereits funktionieren, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn Benachrichtigungen zu verschwinden scheinen, während der Benutzer auf einem anderen Gerät aktiv ist, prüfe, ob `suppress_push_when_active` aktiviert ist. Tuwunel hat diese Option in Tuwunel 1.4.2 am 12. September 2025 hinzugefügt, und sie kann Pushes an andere Geräte absichtlich unterdrücken, während ein Gerät aktiv ist.

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwende `allowBots`, wenn du absichtlich Matrix-Verkehr zwischen Agenten zulassen möchtest:

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
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von einem Bot verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwende strikte Raum-Allowlists und Erwähnungsanforderungen, wenn du Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivierst.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bild-Events `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

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

Verifizierungsstatus prüfen:

```bash
openclaw matrix verify status
```

Ausführlicher Status (vollständige Diagnosen):

```bash
openclaw matrix verify status --verbose
```

Den gespeicherten Wiederherstellungsschlüssel in maschinenlesbarer Ausgabe einschließen:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-Signing- und Verifizierungsstatus bootstrappen:

```bash
openclaw matrix verify bootstrap
```

Ausführliche Bootstrap-Diagnosen:

```bash
openclaw matrix verify bootstrap --verbose
```

Vor dem Bootstrap eine neue Cross-Signing-Identität erzwingen:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Ausführliche Details zur Geräteverifizierung:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Status des Raumschlüssel-Backups prüfen:

```bash
openclaw matrix verify backup status
```

Ausführliche Diagnosen zum Backup-Status:

```bash
openclaw matrix verify backup status --verbose
```

Raumschlüssel aus dem Server-Backup wiederherstellen:

```bash
openclaw matrix verify backup restore
```

Ausführliche Diagnosen zur Wiederherstellung:

```bash
openclaw matrix verify backup restore --verbose
```

Das aktuelle Server-Backup löschen und eine neue Backup-Basis erstellen. Wenn der gespeicherte
Backup-Schlüssel nicht sauber geladen werden kann, kann dieser Reset auch den Secret Storage neu erstellen, sodass
zukünftige Kaltstarts den neuen Backup-Schlüssel laden können:

```bash
openclaw matrix verify backup reset --yes
```

Alle `verify`-Befehle sind standardmäßig kompakt (einschließlich stiller interner SDK-Protokollierung) und zeigen detaillierte Diagnosen nur mit `--verbose`.
Verwende `--json` für vollständige maschinenlesbare Ausgabe beim Scripting.

In Multi-Account-Setups verwenden Matrix-CLI-Befehle das implizite Matrix-Standardkonto, sofern du nicht `--account <id>` übergibst.
Wenn du mehrere benannte Konten konfigurierst, setze zuerst `channels.matrix.defaultAccount`, andernfalls stoppen diese impliziten CLI-Operationen und fordern dich auf, ein Konto explizit auszuwählen.
Verwende `--account` immer dann, wenn Verifizierungs- oder Geräteoperationen explizit auf ein benanntes Konto zielen sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn die Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

### Was „verifiziert“ bedeutet

OpenClaw behandelt dieses Matrix-Gerät nur dann als verifiziert, wenn es durch deine eigene Cross-Signing-Identität verifiziert ist.
In der Praxis zeigt `openclaw matrix verify status --verbose` drei Vertrauenssignale an:

- `Locally trusted`: Dieses Gerät wird nur vom aktuellen Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: Das SDK meldet das Gerät als per Cross-Signing verifiziert
- `Signed by owner`: Das Gerät ist mit deinem eigenen Self-Signing-Schlüssel signiert

`Verified by owner` wird nur dann zu `yes`, wenn eine Cross-Signing-Verifizierung oder eine Signatur durch den Eigentümer vorhanden ist.
Lokales Vertrauen allein reicht nicht aus, damit OpenClaw das Gerät als vollständig verifiziert behandelt.

### Was Bootstrap tut

`openclaw matrix verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Matrix-Konten.
Er führt in dieser Reihenfolge Folgendes aus:

- Secret Storage bootstrappen, wobei nach Möglichkeit ein vorhandener Wiederherstellungsschlüssel wiederverwendet wird
- Cross-Signing bootstrappen und fehlende öffentliche Cross-Signing-Schlüssel hochladen
- versuchen, das aktuelle Gerät zu markieren und per Cross-Signing zu signieren
- ein neues serverseitiges Raumschlüssel-Backup erstellen, falls noch keines existiert

Wenn der Homeserver interaktive Authentifizierung zum Hochladen von Cross-Signing-Schlüsseln verlangt, versucht OpenClaw den Upload zuerst ohne Authentifizierung, dann mit `m.login.dummy` und danach mit `m.login.password`, wenn `channels.matrix.password` konfiguriert ist.

Verwende `--force-reset-cross-signing` nur dann, wenn du die aktuelle Cross-Signing-Identität absichtlich verwerfen und eine neue erstellen möchtest.

Wenn du das aktuelle Raumschlüssel-Backup absichtlich verwerfen und eine neue
Backup-Basis für zukünftige Nachrichten starten möchtest, verwende `openclaw matrix verify backup reset --yes`.
Tue dies nur, wenn du akzeptierst, dass nicht wiederherstellbarer alter verschlüsselter Verlauf
weiterhin nicht verfügbar bleibt und OpenClaw den Secret Storage möglicherweise neu erstellt, wenn das aktuelle Backup-
Geheimnis nicht sicher geladen werden kann.

### Neue Backup-Basis

Wenn du sicherstellen möchtest, dass zukünftige verschlüsselte Nachrichten funktionieren, und den Verlust von nicht wiederherstellbarem altem Verlauf akzeptierst, führe diese Befehle in dieser Reihenfolge aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Füge jedem Befehl `--account <id>` hinzu, wenn du explizit auf ein benanntes Matrix-Konto zielen möchtest.

### Startverhalten

Wenn `encryption: true` gesetzt ist, verwendet Matrix standardmäßig `startupVerification` mit dem Wert `"if-unverified"`.
Beim Start fordert Matrix eine Selbstverifizierung in einem anderen Matrix-Client an, wenn dieses Gerät noch nicht verifiziert ist,
überspringt doppelte Anfragen, solange bereits eine aussteht, und verwendet vor erneuten Versuchen nach Neustarts eine lokale Abkühlzeit.
Fehlgeschlagene Anfrageversuche werden standardmäßig früher erneut versucht als erfolgreich erstellte Anfragen.
Setze `startupVerification: "off"`, um automatische Anfragen beim Start zu deaktivieren, oder passe `startupVerificationCooldownHours`
an, wenn du ein kürzeres oder längeres Wiederholungsfenster möchtest.

Beim Start wird außerdem automatisch ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt.
Dieser Durchlauf versucht zuerst, den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederzuverwenden, und vermeidet das Zurücksetzen von Cross-Signing, sofern du nicht einen expliziten Bootstrap-Reparaturablauf ausführst.

Wenn beim Start weiterhin ein fehlerhafter Bootstrap-Status erkannt wird, kann OpenClaw auch dann einen abgesicherten Reparaturpfad versuchen, wenn `channels.matrix.password` nicht konfiguriert ist.
Wenn der Homeserver dafür eine passwortbasierte UIA verlangt, protokolliert OpenClaw eine Warnung und hält den Start nicht-fatal, statt den Bot abzubrechen.
Wenn das aktuelle Gerät bereits vom Eigentümer signiert ist, bewahrt OpenClaw diese Identität, statt sie automatisch zurückzusetzen.

Siehe [Matrix-Migration](/de/install/migrating-matrix) für den vollständigen Upgrade-Ablauf, Einschränkungen, Wiederherstellungsbefehle und häufige Migrationsmeldungen.

### Verifizierungshinweise

Matrix veröffentlicht Hinweise zum Verifizierungslebenszyklus direkt im strikten DM-Verifizierungsraum als `m.notice`-Nachrichten.
Dazu gehören:

- Hinweise zu Verifizierungsanfragen
- Hinweise, dass die Verifizierung bereit ist (mit expliziter Anleitung „Verify by emoji“)
- Hinweise auf Beginn und Abschluss der Verifizierung
- SAS-Details (Emoji und Dezimalwerte), wenn verfügbar

Eingehende Verifizierungsanfragen von einem anderen Matrix-Client werden von OpenClaw verfolgt und automatisch akzeptiert.
Bei Selbstverifizierungsabläufen startet OpenClaw außerdem automatisch den SAS-Ablauf, sobald die Emoji-Verifizierung verfügbar wird, und bestätigt seine eigene Seite.
Bei Verifizierungsanfragen von einem anderen Matrix-Benutzer/Gerät akzeptiert OpenClaw die Anfrage automatisch und wartet dann, bis der SAS-Ablauf normal fortgesetzt wird.
Du musst die Emoji- oder dezimalen SAS-Werte dennoch in deinem Matrix-Client vergleichen und dort „They match“ bestätigen, um die Verifizierung abzuschließen.

OpenClaw akzeptiert selbst initiierte doppelte Abläufe nicht blind automatisch. Beim Start wird keine neue Anfrage erstellt, wenn bereits eine Selbstverifizierungsanfrage aussteht.

Hinweise des Verifizierungsprotokolls/-systems werden nicht an die Agent-Chat-Pipeline weitergeleitet und erzeugen daher kein `NO_REPLY`.

### Gerätehygiene

Alte von OpenClaw verwaltete Matrix-Geräte können sich im Konto ansammeln und das Vertrauen in verschlüsselten Räumen schwerer nachvollziehbar machen.
Liste sie auf mit:

```bash
openclaw matrix devices list
```

Entferne veraltete von OpenClaw verwaltete Geräte mit:

```bash
openclaw matrix devices prune-stale
```

### Crypto-Store

Matrix-E2EE verwendet den offiziellen Rust-Crypto-Pfad von `matrix-js-sdk` in Node, mit `fake-indexeddb` als IndexedDB-Shim. Der Crypto-Status wird in einer Snapshot-Datei (`crypto-idb-snapshot.json`) gespeichert und beim Start wiederhergestellt. Die Snapshot-Datei ist sensibler Laufzeitstatus und wird mit restriktiven Dateiberechtigungen gespeichert.

Verschlüsselter Laufzeitstatus liegt unter Roots pro Konto und pro Benutzer-Token-Hash in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Dieses Verzeichnis enthält den Sync-Store (`bot-storage.json`), den Crypto-Store (`crypto/`),
die Wiederherstellungsschlüsseldatei (`recovery-key.json`), den IndexedDB-Snapshot (`crypto-idb-snapshot.json`),
Thread-Bindungen (`thread-bindings.json`) und den Status der Startverifizierung (`startup-verification.json`).
Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw den bestmöglichen vorhandenen
Root für dieses Tupel aus Konto/Homeserver/Benutzer wieder, sodass vorheriger Sync-Status, Crypto-Status, Thread-Bindungen
und Startverifizierungsstatus sichtbar bleiben.

## Profilverwaltung

Aktualisiere das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Füge `--account <id>` hinzu, wenn du explizit auf ein benanntes Matrix-Konto zielen möchtest.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn du eine `http://`- oder `https://`-Avatar-URL übergibst, lädt OpenClaw sie zuerst zu Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder in den ausgewählten Konto-Override).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sendevorgänge mit Message-Tools.

- `dm.sessionScope: "per-user"` (Standard) hält das Matrix-DM-Routing absenderbezogen, sodass mehrere DM-Räume eine Sitzung gemeinsam nutzen können, wenn sie zum selben Peer aufgelöst werden.
- `dm.sessionScope: "per-room"` isoliert jeden Matrix-DM-Raum in seinen eigenen Sitzungsschlüssel und verwendet dabei weiterhin normale DM-Authentifizierung und Allowlist-Prüfungen.
- Explizite Matrix-Konversationsbindungen haben weiterhin Vorrang vor `dm.sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung beibehalten.
- `threadReplies: "off"` hält Antworten auf oberster Ebene und behält eingehende Thread-Nachrichten in der übergeordneten Sitzung.
- `threadReplies: "inbound"` antwortet innerhalb eines Threads nur dann, wenn die eingehende Nachricht bereits in diesem Thread war.
- `threadReplies: "always"` hält Raumantworten in einem Thread, der an der auslösenden Nachricht verankert ist, und leitet diese Konversation ab der ersten auslösenden Nachricht durch die passende threadbezogene Sitzung.
- `dm.threadReplies` überschreibt die Einstellung auf oberster Ebene nur für DMs. So kannst du zum Beispiel Raum-Threads isoliert halten und DMs flach halten.
- Eingehende Thread-Nachrichten enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Sendevorgänge mit Message-Tools übernehmen automatisch den aktuellen Matrix-Thread, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern kein explizites `threadId` angegeben wird.
- Die Wiederverwendung desselben sitzungsbezogenen DM-Benutzerziels greift nur dann, wenn die aktuellen Sitzungsmetadaten denselben DM-Peer auf demselben Matrix-Konto belegen; andernfalls greift OpenClaw auf normales benutzerbezogenes Routing zurück.
- Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsam genutzten Matrix-DM-Sitzung kollidiert, sendet es einmalig ein `m.notice` in diesen Raum mit dem Ausweg `/focus`, wenn Thread-Bindungen aktiviert sind und dem Hinweis `dm.sessionScope`.
- Laufzeit-Thread-Bindungen werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren in Matrix-Räumen und DMs.
- Ein `/focus` auf oberster Ebene in einem Matrix-Raum/DM erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Das Ausführen von `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads bindet stattdessen diesen aktuellen Thread.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führe `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des bestehenden Threads aus, den du weiterverwenden möchtest.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung weitergeleitet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread direkt.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Thread-Bindungs-Konfiguration

Matrix übernimmt globale Standardwerte von `session.threadBindings` und unterstützt außerdem kanalbezogene Overrides:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Thread-gebundene Spawn-Flags für Matrix sind Opt-in:

- Setze `threadBindings.spawnSubagentSessions: true`, um zuzulassen, dass `/focus` auf oberster Ebene neue Matrix-Threads erstellt und bindet.
- Setze `threadBindings.spawnAcpSessions: true`, um zuzulassen, dass `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads bindet.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Ack-Reaktionen.

- Ausgehende Reaktions-Tooling wird durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Event eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Event auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf dieses Event.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion vom Bot-Konto.

Der Geltungsbereich von Ack-Reaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Fallback auf Agent-Identitäts-Emoji

Der Scope von Ack-Reaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Der Modus für Reaktionsbenachrichtigungen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- Standard: `own`

Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Events weiter, wenn sie auf von Bots verfasste Matrix-Nachrichten zielen.
- `reactionNotifications: "off"` deaktiviert Reaktions-Systemevents.
- Das Entfernen von Reaktionen wird nicht in Systemevents synthetisiert, weil Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raum-Nachrichten als `InboundHistory` eingeschlossen werden, wenn eine Matrix-Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setze `0`, um dies zu deaktivieren.
- Der Verlauf von Matrix-Räumen ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Verlauf von Matrix-Räumen ist nur für ausstehende Nachrichten: OpenClaw puffert Raum-Nachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle auslösende Nachricht wird nicht in `InboundHistory` aufgenommen; sie bleibt im Haupttext der eingehenden Nachricht für diesen Turn.
- Wiederholungen desselben Matrix-Events verwenden den ursprünglichen Verlaufssnapshot erneut, statt sich auf neuere Raum-Nachrichten weiterzuverschieben.

## Kontextsichtigkeit

Matrix unterstützt die gemeinsame Einstellung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Roots und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext bleibt wie empfangen erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Allowlist-Prüfungen für Raum/Benutzer erlaubt sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber trotzdem ein explizites zitiertes Reply bei.

Diese Einstellung betrifft die Sichtbarkeit des ergänzenden Kontexts, nicht die Frage, ob die eingehende Nachricht selbst eine Antwort auslösen darf.
Die Trigger-Autorisierung kommt weiterhin von `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Siehe [Groups](/de/channels/groups) für Verhalten bei Mention-Gating und Allowlist.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer dir vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und sendet nach einer kurzen Abkühlzeit möglicherweise erneut eine Erinnerungsantwort, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur von Direkt-Räumen

Wenn der Status von Direktnachrichten nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Einzelräume statt auf die aktive DM zeigen. Untersuche die aktuelle Zuordnung für einen Peer mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repariere sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- greift auf jede aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine funktionierende DM existiert

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die funktionierende DM aus und aktualisiert die Zuordnung, sodass neue Matrix-Sendevorgänge, Verifizierungshinweise und andere Direktnachrichtenabläufe wieder den richtigen Raum ansprechen.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungsclient für ein Matrix-Konto fungieren. Die nativen
DM-/Kanal-Routing-Schalter befinden sich weiterhin unter der Exec-Genehmigungskonfiguration:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; fällt auf `channels.matrix.dm.allowFrom` zurück)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Genehmigende müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und sich mindestens ein Genehmigender auflösen lässt. Exec-Genehmigungen verwenden zuerst `execApprovals.approvers` und können auf `channels.matrix.dm.allowFrom` zurückfallen. Plugin-Genehmigungen autorisieren über `channels.matrix.dm.allowFrom`. Setze `enabled: false`, um Matrix explizit als nativen Genehmigungsclient zu deaktivieren. Genehmigungsanfragen fallen andernfalls auf andere konfigurierte Genehmigungswege oder die Fallback-Richtlinie für Genehmigungen zurück.

Matrix-Native-Routing unterstützt beide Genehmigungsarten:

- `channels.matrix.execApprovals.*` steuert den nativen DM-/Kanal-Fanout-Modus für Matrix-Genehmigungsaufforderungen.
- Exec-Genehmigungen verwenden die Menge der Exec-Genehmigenden aus `execApprovals.approvers` oder `channels.matrix.dm.allowFrom`.
- Plugin-Genehmigungen verwenden die Matrix-DM-Allowlist aus `channels.matrix.dm.allowFrom`.
- Matrix-Reaktionskürzel und Nachrichtenaktualisierungen gelten sowohl für Exec- als auch für Plugin-Genehmigungen.

Zustellungsregeln:

- `target: "dm"` sendet Genehmigungsaufforderungen an DMs der Genehmigenden
- `target: "channel"` sendet die Aufforderung zurück an den auslösenden Matrix-Raum oder die auslösende DM
- `target: "both"` sendet an DMs der Genehmigenden und an den auslösenden Matrix-Raum oder die auslösende DM

Matrix-Genehmigungsaufforderungen setzen Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` = einmal erlauben
- `❌` = ablehnen
- `♾️` = immer erlauben, wenn diese Entscheidung durch die effektive Exec-Richtlinie zulässig ist

Genehmigende können auf diese Nachricht reagieren oder die Fallback-Slash-Befehle verwenden: `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny`.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Bei Exec-Genehmigungen enthält die Kanalzustellung den Befehlstext; aktiviere `channel` oder `both` daher nur in vertrauenswürdigen Räumen.

Konto-spezifischer Override:

- `channels.matrix.accounts.<account>.execApprovals`

Verwandte Dokumentation: [Exec approvals](/de/tools/exec-approvals)

## Slash-Befehle

Matrix-Slash-Befehle (zum Beispiel `/new`, `/reset`, `/model`) funktionieren direkt in DMs. In Räumen erkennt OpenClaw außerdem Slash-Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad auslöst, ohne dass ein benutzerdefinierter Mention-Regex nötig ist. Dadurch bleibt der Bot reaktionsfähig für raumtypische Posts wie `@mention /command`, die Element und ähnliche Clients senden, wenn ein Benutzer den Bot per Tab-Vervollständigung auswählt, bevor er den Befehl eingibt.

Autorisierungsregeln gelten weiterhin: Absender von Befehlen müssen dieselben DM- oder Raum-Allowlist-/Owner-Richtlinien erfüllen wie bei normalen Nachrichten.

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
Du kannst geerbte Raumeinträge mit `groups.<room>.account` auf ein Matrix-Konto beschränken.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam genutzt, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf oberster Ebene unter `channels.matrix.*` konfiguriert ist.
Teilweise gemeinsame Auth-Standardwerte erzeugen für sich allein kein separates implizites Standardkonto. OpenClaw synthetisiert das `default`-Konto auf oberster Ebene nur dann, wenn dieses Standardkonto eine frische Authentifizierung hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können weiterhin über `homeserver` plus `userId` erkennbar bleiben, wenn zwischengespeicherte Zugangsdaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen Schlüssel eines benannten Kontos zeigt, bleibt bei der Reparatur/Einrichtung von Single-Account zu Multi-Account dieses Konto erhalten, statt einen neuen `accounts.default`-Eintrag zu erstellen. Nur Matrix-Auth-/Bootstrap-Schlüssel werden in dieses hochgestufte Konto verschoben; gemeinsame Zustellungsrichtlinien-Schlüssel bleiben auf oberster Ebene.
Setze `defaultAccount`, wenn OpenClaw ein benanntes Matrix-Konto für implizites Routing, Probing und CLI-Operationen bevorzugen soll.
Wenn mehrere Matrix-Konten konfiguriert sind und eine Konto-ID `default` ist, verwendet OpenClaw dieses Konto implizit auch dann, wenn `defaultAccount` nicht gesetzt ist.
Wenn du mehrere benannte Konten konfigurierst, setze `defaultAccount` oder übergib `--account <id>` für CLI-Befehle, die auf impliziter Kontoauswahl basieren.
Übergib `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn du diese implizite Auswahl für einen einzelnen Befehl überschreiben möchtest.

Siehe [Configuration reference](/de/gateway/configuration-reference#multi-account-all-channels) für das gemeinsame Multi-Account-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum SSRF-Schutz, sofern du
nicht explizit pro Konto zustimmst.

Wenn dein Homeserver auf localhost, einer LAN-/Tailscale-IP oder einem internen Hostnamen läuft, aktiviere
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

Dieses Opt-in erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Bevorzuge nach Möglichkeit `https://`.

## Matrix-Traffic über einen Proxy leiten

Wenn deine Matrix-Bereitstellung einen expliziten ausgehenden HTTP(S)-Proxy benötigt, setze `channels.matrix.proxy`:

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
OpenClaw verwendet dieselbe Proxy-Einstellung für laufenden Matrix-Traffic und Prüfungen des Kontostatus.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliase: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Die Live-Verzeichnisauflösung verwendet das angemeldete Matrix-Konto:

- Benutzerauflösungen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumauflösungen akzeptieren explizite Raum-IDs und Aliase direkt und greifen dann ersatzweise auf die Suche nach beigetretenen Raumnamen für dieses Konto zurück.
- Die Auflösung beigetretener Raumnamen erfolgt nach bestem Bemühen. Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er bei der Laufzeit-Resolution der Allowlist ignoriert.

## Konfigurationsreferenz

- `enabled`: den Channel aktivieren oder deaktivieren.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Matrix-Konto erlauben, sich mit privaten/internen Homeservern zu verbinden. Aktiviere dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Traffic. Benannte Konten können den Standardwert auf oberster Ebene mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Access Token für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` über Env-/Datei-/Exec-Provider unterstützt. Siehe [Secrets Management](/de/gateway/secrets).
- `password`: Passwort für passwortbasierten Login. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts für Passwort-Login.
- `avatarUrl`: gespeicherte Self-Avatar-URL für Profilsynchronisierung und `profile set`-Updates.
- `initialSyncLimit`: maximale Anzahl von Events, die während des Start-Syncs abgerufen werden.
- `encryption`: E2EE aktivieren.
- `allowlistOnly`: wenn `true`, wird die Raumrichtlinie `open` auf `allowlist` hochgestuft und alle aktiven DM-Richtlinien außer `disabled` (einschließlich `pairing` und `open`) zu `allowlist` gezwungen. Hat keine Auswirkung auf `disabled`-Richtlinien.
- `allowBots`: Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten zulassen (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raum-Traffic. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnis-Treffer werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `historyLimit`: maximale Anzahl an Raum-Nachrichten, die als Gruppenverlaufs-Kontext eingeschlossen werden. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setze `0`, um dies zu deaktivieren.
- `replyToMode`: `off`, `first`, `all` oder `batched`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `"partial"`, `"quiet"`, `true` oder `false`. `"partial"` und `true` aktivieren Vorschau-zuerst-Entwurfsaktualisierungen mit normalen Matrix-Textnachrichten. `"quiet"` verwendet nicht-benachrichtigende Vorschau-Hinweise für selbstgehostete Push-Regel-Setups. `false` entspricht `"off"`.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistant-Blöcke, während Entwurfsvorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: kanalbezogene Overrides für threadgebundenes Sitzungsrouting und Lebenszyklus.
- `startupVerification`: Modus für automatische Selbstverifizierungsanfragen beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Abkühlzeit, bevor automatische Selbstverifizierungsanfragen beim Start erneut versucht werden.
- `textChunkLimit`: Größe ausgehender Nachrichten-Chunks in Zeichen (gilt, wenn `chunkMode` den Wert `length` hat).
- `chunkMode`: `length` teilt Nachrichten nach Zeichenanzahl; `newline` teilt an Zeilengrenzen.
- `responsePrefix`: optionale Zeichenfolge, die allen ausgehenden Antworten für diesen Channel vorangestellt wird.
- `ackReaction`: optionaler Override für Ack-Reaktionen für diesen Channel/dieses Konto.
- `ackReactionScope`: optionaler Override für den Ack-Reaktions-Scope (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Größenobergrenze für Medien in MB für ausgehende Sends und eingehende Medienverarbeitung.
- `autoJoin`: Richtlinie für automatisches Beitreten bei Einladungen (`always`, `allowlist`, `off`). Standard: `off`. Gilt für alle Matrix-Einladungen, einschließlich DM-ähnlicher Einladungen.
- `autoJoinAllowlist`: Räume/Aliase, die erlaubt sind, wenn `autoJoin` auf `allowlist` gesetzt ist. Alias-Einträge werden bei der Behandlung von Einladungen zu Raum-IDs aufgelöst; OpenClaw vertraut nicht auf Alias-Status, den der eingeladene Raum behauptet.
- `dm`: DM-Richtlinienblock (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: steuert den DM-Zugriff, nachdem OpenClaw dem Raum beigetreten ist und ihn als DM klassifiziert hat. Es ändert nicht, ob einer Einladung automatisch beigetreten wird.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Traffic. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnis-Treffer werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `dm.sessionScope`: `per-user` (Standard) oder `per-room`. Verwende `per-room`, wenn jeder Matrix-DM-Raum einen separaten Kontext behalten soll, auch wenn der Peer derselbe ist.
- `dm.threadReplies`: DM-spezifischer Override für die Thread-Richtlinie (`off`, `inbound`, `always`). Er überschreibt die Einstellung `threadReplies` auf oberster Ebene sowohl für die Platzierung von Antworten als auch für die Sitzungsisolierung in DMs.
- `execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die Genehmigenden bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte konto-spezifische Overrides. Werte auf oberster Ebene unter `channels.matrix` dienen als Standardwerte für diese Einträge.
- `groups`: Richtlinienzuordnung pro Raum. Bevorzuge Raum-IDs oder Aliase; nicht aufgelöste Raumnamen werden bei der Laufzeit ignoriert. Die Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID.
- `groups.<room>.account`: einen geerbten Raumeintrag in Multi-Account-Setups auf ein bestimmtes Matrix-Konto beschränken.
- `groups.<room>.allowBots`: Override auf Raumebene für Absender aus konfigurierten Bot-Konten (`true` oder `"mentions"`).
- `groups.<room>.users`: senderbezogene Allowlist pro Raum.
- `groups.<room>.tools`: raumbezogene Tool-Allow-/Deny-Overrides.
- `groups.<room>.autoReply`: raumbezogener Override für Mention-Gating. `true` deaktiviert Erwähnungsanforderungen für diesen Raum; `false` erzwingt sie wieder.
- `groups.<room>.skills`: optionaler Skill-Filter auf Raumebene.
- `groups.<room>.systemPrompt`: optionales System-Prompt-Snippet auf Raumebene.
- `rooms`: Legacy-Alias für `groups`.
- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Channel-Übersicht](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung

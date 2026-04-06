---
read_when:
    - Einrichten von Matrix in OpenClaw
    - Konfigurieren von Matrix E2EE und Verifizierung
summary: Status des Matrix-Supports, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-04-06T03:08:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e2d84c08d7d5b96db14b914e54f08d25334401cdd92eb890bc8dfb37b0ca2dc
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix ist das gebündelte Matrix-Kanal-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher
benötigen normale paketierte Builds keine separate Installation.

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
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
3. Konfigurieren Sie `channels.matrix` mit entweder:
   - `homeserver` + `accessToken`, oder
   - `homeserver` + `userId` + `password`.
4. Starten Sie das Gateway neu.
5. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

Was der Matrix-Assistent tatsächlich abfragt:

- Homeserver-URL
- Authentifizierungsmethode: Zugriffstoken oder Passwort
- Benutzer-ID nur, wenn Sie Passwort-Authentifizierung wählen
- optionaler Gerätename
- ob E2EE aktiviert werden soll
- ob der Matrix-Raumzugriff jetzt konfiguriert werden soll

Wichtiges Verhalten des Assistenten:

- Wenn für das ausgewählte Konto bereits Matrix-Auth-Umgebungsvariablen vorhanden sind und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Umgebungsvariablen-Abkürzung an und schreibt für dieses Konto nur `enabled: true`.
- Wenn Sie interaktiv ein weiteres Matrix-Konto hinzufügen, wird der eingegebene Kontoname in die Konto-ID normalisiert, die in der Konfiguration und in Umgebungsvariablen verwendet wird. Zum Beispiel wird aus `Ops Bot` `ops-bot`.
- DM-Allowlist-Eingabeaufforderungen akzeptieren sofort vollständige `@user:server`-Werte. Anzeigenamen funktionieren nur, wenn die Live-Verzeichnissuche genau einen Treffer findet; andernfalls fordert der Assistent Sie auf, es mit einer vollständigen Matrix-ID erneut zu versuchen.
- Raum-Allowlist-Eingabeaufforderungen akzeptieren Raum-IDs und Aliasse direkt. Sie können auch live beigetretene Raumnamen auflösen, aber nicht aufgelöste Namen werden während der Einrichtung nur wie eingegeben gespeichert und später bei der Laufzeit-Allowlist-Auflösung ignoriert. Bevorzugen Sie `!room:server` oder `#alias:server`.
- Die Laufzeit-Raum-/Sitzungsidentität verwendet die stabile Matrix-Raum-ID. Im Raum deklarierte Aliasse werden nur als Lookup-Eingaben verwendet, nicht als langfristiger Sitzungsschlüssel oder stabile Gruppenidentität.
- Um Raumnamen vor dem Speichern aufzulösen, verwenden Sie `openclaw channels resolve --channel matrix "Project Room"`.

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

Passwortbasierte Einrichtung (Token wird nach der Anmeldung zwischengespeichert):

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
Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, behandelt OpenClaw Matrix bei Einrichtung, Doctor und Kanalstatus-Erkennung als konfiguriert, selbst wenn die aktuelle Authentifizierung nicht direkt in der Konfiguration gesetzt ist.

Entsprechende Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Für Nicht-Standardkonten verwenden Sie konto-spezifische Umgebungsvariablen:

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

Matrix escaped Satzzeichen in Konto-IDs, damit konto-spezifische Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, sodass `ops-prod` zu `MATRIX_OPS_X2D_PROD_*` wird.

Der interaktive Assistent bietet die Umgebungsvariablen-Abkürzung nur an, wenn diese Auth-Umgebungsvariablen bereits vorhanden sind und das ausgewählte Konto noch keine Matrix-Authentifizierung in der Konfiguration gespeichert hat.

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

## Streaming-Vorschauen

Matrix-Antwort-Streaming ist opt-in.

Setzen Sie `channels.matrix.streaming` auf `"partial"`, wenn OpenClaw eine einzelne Live-Vorschau
als Antwort senden, diese Vorschau während der Textgenerierung durch das Modell an Ort und Stelle bearbeiten
und sie abschließen soll, wenn die
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
- `streaming: "partial"` erstellt eine bearbeitbare Vorschau-Nachricht für den aktuellen Assistant-Block unter Verwendung normaler Matrix-Textnachrichten. Dadurch bleibt das ältere preview-first-Benachrichtigungsverhalten von Matrix erhalten, sodass Standard-Clients möglicherweise über den ersten gestreamten Vorschautext benachrichtigen statt über den fertigen Block.
- `streaming: "quiet"` erstellt einen bearbeitbaren stillen Vorschau-Hinweis für den aktuellen Assistant-Block. Verwenden Sie dies nur, wenn Sie zusätzlich Push-Regeln für Empfänger für abgeschlossene Vorschau-Bearbeitungen konfigurieren.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Wenn Vorschau-Streaming aktiviert ist, behält Matrix den Live-Entwurf für den aktuellen Block bei und erhält abgeschlossene Blöcke als separate Nachrichten.
- Wenn Vorschau-Streaming aktiviert und `blockStreaming` deaktiviert ist, bearbeitet Matrix den Live-Entwurf an Ort und Stelle und finalisiert dasselbe Ereignis, wenn der Block oder Turn endet.
- Wenn die Vorschau nicht mehr in ein einzelnes Matrix-Ereignis passt, stoppt OpenClaw das Vorschau-Streaming und fällt auf normale endgültige Zustellung zurück.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie vor dem Senden der endgültigen Medienantwort.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lassen Sie Streaming deaktiviert, wenn Sie das konservativste Rate-Limit-Verhalten möchten.

`blockStreaming` aktiviert für sich allein keine Entwurfs-Vorschauen.
Verwenden Sie `streaming: "partial"` oder `streaming: "quiet"` für Vorschau-Bearbeitungen; fügen Sie dann `blockStreaming: true` nur hinzu, wenn abgeschlossene Assistant-Blöcke auch als separate Fortschrittsnachrichten sichtbar bleiben sollen.

Wenn Sie Matrix-Standardbenachrichtigungen ohne benutzerdefinierte Push-Regeln benötigen, verwenden Sie `streaming: "partial"` für preview-first-Verhalten oder lassen Sie `streaming` für reine Endzustellung deaktiviert. Mit `streaming: "off"`:

- `blockStreaming: true` sendet jeden abgeschlossenen Block als normale benachrichtigende Matrix-Nachricht.
- `blockStreaming: false` sendet nur die endgültige abgeschlossene Antwort als normale benachrichtigende Matrix-Nachricht.

### Selbst gehostete Push-Regeln für stille finalisierte Vorschauen

Wenn Sie Ihre eigene Matrix-Infrastruktur betreiben und möchten, dass stille Vorschauen nur benachrichtigen, wenn ein Block oder eine
endgültige Antwort abgeschlossen ist, setzen Sie `streaming: "quiet"` und fügen Sie eine benutzerspezifische Push-Regel für finalisierte Vorschau-Bearbeitungen hinzu.

Dies ist normalerweise eine Einrichtung pro Empfängerbenutzer, keine globale Homeserver-Konfigurationsänderung:

Kurzübersicht, bevor Sie beginnen:

- Empfängerbenutzer = die Person, die die Benachrichtigung erhalten soll
- Bot-Benutzer = das OpenClaw-Matrix-Konto, das die Antwort sendet
- verwenden Sie für die folgenden API-Aufrufe das Zugriffstoken des Empfängerbenutzers
- gleichen Sie `sender` in der Push-Regel mit der vollständigen MXID des Bot-Benutzers ab

1. Konfigurieren Sie OpenClaw für stille Vorschauen:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Stellen Sie sicher, dass das Empfängerkonto bereits normale Matrix-Push-Benachrichtigungen erhält. Regeln für stille Vorschauen
   funktionieren nur, wenn dieser Benutzer bereits funktionierende Pushers/Geräte hat.

3. Besorgen Sie sich das Zugriffstoken des Empfängerbenutzers.
   - Verwenden Sie das Token des empfangenden Benutzers, nicht das Token des Bots.
   - Die Wiederverwendung eines vorhandenen Client-Sitzungstokens ist normalerweise am einfachsten.
   - Wenn Sie ein neues Token erzeugen müssen, können Sie sich über die standardmäßige Matrix Client-Server-API anmelden:

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

4. Verifizieren Sie, dass das Empfängerkonto bereits Pushers hat:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Wenn dies keine aktiven Pushers/Geräte zurückgibt, beheben Sie zuerst normale Matrix-Benachrichtigungen, bevor Sie die
untenstehende OpenClaw-Regel hinzufügen.

OpenClaw markiert finalisierte reine Text-Vorschau-Bearbeitungen mit:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Erstellen Sie für jedes Empfängerkonto, das diese Benachrichtigungen erhalten soll, eine Override-Push-Regel:

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

Ersetzen Sie diese Werte, bevor Sie den Befehl ausführen:

- `https://matrix.example.org`: Ihre Homeserver-Basis-URL
- `$USER_ACCESS_TOKEN`: das Zugriffstoken des empfangenden Benutzers
- `openclaw-finalized-preview-botname`: eine Regel-ID, die für diesen Bot für diesen empfangenden Benutzer eindeutig ist
- `@bot:example.org`: die MXID Ihres OpenClaw-Matrix-Bots, nicht die MXID des empfangenden Benutzers

Wichtig für Setups mit mehreren Bots:

- Push-Regeln sind nach `ruleId` geschlüsselt. Erneutes Ausführen von `PUT` für dieselbe Regel-ID aktualisiert diese eine Regel.
- Wenn ein empfangender Benutzer für mehrere OpenClaw-Matrix-Botkonten benachrichtigt werden soll, erstellen Sie pro Bot eine Regel mit einer eindeutigen Regel-ID für jede Sender-Übereinstimmung.
- Ein einfaches Muster ist `openclaw-finalized-preview-<botname>`, zum Beispiel `openclaw-finalized-preview-ops` oder `openclaw-finalized-preview-support`.

Die Regel wird gegen den Ereignis-Sender ausgewertet:

- authentifizieren Sie sich mit dem Token des empfangenden Benutzers
- gleichen Sie `sender` mit der OpenClaw-Bot-MXID ab

6. Verifizieren Sie, dass die Regel existiert:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Testen Sie eine gestreamte Antwort. Im stillen Modus sollte der Raum eine stille Entwurfs-Vorschau anzeigen und die abschließende
   Bearbeitung an Ort und Stelle sollte benachrichtigen, sobald der Block oder Turn endet.

Wenn Sie die Regel später entfernen müssen, löschen Sie dieselbe Regel-ID mit dem Token des empfangenden Benutzers:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Hinweise:

- Erstellen Sie die Regel mit dem Zugriffstoken des empfangenden Benutzers, nicht mit dem des Bots.
- Neue benutzerdefinierte `override`-Regeln werden vor den standardmäßigen Unterdrückungsregeln eingefügt, daher ist kein zusätzlicher Ordnungsparameter erforderlich.
- Dies betrifft nur reine Text-Vorschau-Bearbeitungen, die OpenClaw sicher an Ort und Stelle finalisieren kann. Medien-Fallbacks und Fallbacks für veraltete Vorschauen verwenden weiterhin die normale Matrix-Zustellung.
- Wenn `GET /_matrix/client/v3/pushers` keine Pushers anzeigt, hat der Benutzer für dieses Konto/Gerät noch keine funktionierende Matrix-Push-Zustellung.

#### Synapse

Für Synapse reicht die obige Einrichtung normalerweise bereits aus:

- Keine spezielle Änderung an `homeserver.yaml` ist für finalisierte OpenClaw-Vorschau-Benachrichtigungen erforderlich.
- Wenn Ihre Synapse-Bereitstellung bereits normale Matrix-Push-Benachrichtigungen sendet, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn Sie Synapse hinter einem Reverse-Proxy oder mit Workern betreiben, stellen Sie sicher, dass `/_matrix/client/.../pushrules/` Synapse korrekt erreicht.
- Wenn Sie Synapse-Worker verwenden, stellen Sie sicher, dass Pushers fehlerfrei funktionieren. Die Push-Zustellung wird vom Hauptprozess oder von `synapse.app.pusher` / konfigurierten Pusher-Workern verarbeitet.

#### Tuwunel

Für Tuwunel verwenden Sie denselben Einrichtungsablauf und denselben oben gezeigten `pushrules`-API-Aufruf:

- Keine Tuwunel-spezifische Konfiguration ist für den Marker für finalisierte Vorschauen selbst erforderlich.
- Wenn normale Matrix-Benachrichtigungen für diesen Benutzer bereits funktionieren, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn Benachrichtigungen scheinbar verschwinden, während der Benutzer auf einem anderen Gerät aktiv ist, prüfen Sie, ob `suppress_push_when_active` aktiviert ist. Tuwunel hat diese Option in Tuwunel 1.4.2 am 12. September 2025 hinzugefügt, und sie kann Pushes an andere Geräte absichtlich unterdrücken, während ein Gerät aktiv ist.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Keine Konfiguration ist erforderlich — das Plugin erkennt den E2EE-Status automatisch.

### Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie absichtlich Matrix-Verkehr zwischen Agents zulassen möchten:

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

- `allowBots: true` akzeptiert Nachrichten von anderen konfigurierten Matrix-Botkonten in erlaubten Räumen und DMs.
- `allowBots: "mentions"` akzeptiert diese Nachrichten nur, wenn sie diesen Bot in Räumen sichtbar erwähnen. DMs sind weiterhin erlaubt.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Schleifen durch Selbstantworten zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt "vom Bot verfasst" als "von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet".

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivieren.

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

Ausführlicher Status (vollständige Diagnose):

```bash
openclaw matrix verify status --verbose
```

Den gespeicherten Recovery Key in maschinenlesbarer Ausgabe einschließen:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-Signing- und Verifizierungsstatus bootstrapen:

```bash
openclaw matrix verify bootstrap
```

Unterstützung für mehrere Konten: Verwenden Sie `channels.matrix.accounts` mit konto-spezifischen Anmeldedaten und optionalem `name`. Siehe [Configuration reference](/de/gateway/configuration-reference#multi-account-all-channels) für das gemeinsame Muster.

Ausführliche Bootstrap-Diagnose:

```bash
openclaw matrix verify bootstrap --verbose
```

Vor dem Bootstrap einen frischen Reset der Cross-Signing-Identität erzwingen:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Dieses Gerät mit einem Recovery Key verifizieren:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Ausführliche Details zur Geräteverifizierung:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Integrität des Room-Key-Backups prüfen:

```bash
openclaw matrix verify backup status
```

Ausführliche Diagnose zur Backup-Integrität:

```bash
openclaw matrix verify backup status --verbose
```

Room Keys aus dem Server-Backup wiederherstellen:

```bash
openclaw matrix verify backup restore
```

Ausführliche Diagnose zur Wiederherstellung:

```bash
openclaw matrix verify backup restore --verbose
```

Das aktuelle Server-Backup löschen und eine frische Backup-Basis erstellen. Wenn der gespeicherte
Backup-Schlüssel nicht sauber geladen werden kann, kann dieser Reset auch Secret Storage neu erstellen, sodass
zukünftige Kaltstarts den neuen Backup-Schlüssel laden können:

```bash
openclaw matrix verify backup reset --yes
```

Alle `verify`-Befehle sind standardmäßig knapp (einschließlich stiller interner SDK-Protokollierung) und zeigen detaillierte Diagnosen nur mit `--verbose`.
Verwenden Sie `--json` für vollständige maschinenlesbare Ausgabe in Skripten.

In Setups mit mehreren Konten verwenden Matrix-CLI-Befehle implizit das Standard-Matrix-Konto, sofern Sie nicht `--account <id>` übergeben.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie zuerst `channels.matrix.defaultAccount`, sonst werden diese impliziten CLI-Operationen angehalten und Sie aufgefordert, ein Konto explizit auszuwählen.
Verwenden Sie `--account` immer dann, wenn Verifizierungs- oder Geräteoperationen explizit auf ein benanntes Konto zielen sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn die Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, zeigen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

### Was "verified" bedeutet

OpenClaw behandelt dieses Matrix-Gerät nur dann als verifiziert, wenn es durch Ihre eigene Cross-Signing-Identität verifiziert ist.
In der Praxis stellt `openclaw matrix verify status --verbose` drei Vertrauenssignale bereit:

- `Locally trusted`: dieses Gerät ist nur durch den aktuellen Client vertrauenswürdig
- `Cross-signing verified`: das SDK meldet das Gerät als per Cross-Signing verifiziert
- `Signed by owner`: das Gerät ist durch Ihren eigenen Self-Signing-Schlüssel signiert

`Verified by owner` wird nur dann zu `yes`, wenn Cross-Signing-Verifizierung oder Owner-Signing vorliegt.
Lokales Vertrauen allein reicht nicht aus, damit OpenClaw das Gerät als vollständig verifiziert behandelt.

### Was Bootstrap tut

`openclaw matrix verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Matrix-Konten.
Er führt der Reihe nach Folgendes aus:

- bootstrapt Secret Storage und verwendet nach Möglichkeit einen vorhandenen Recovery Key erneut
- bootstrapt Cross-Signing und lädt fehlende öffentliche Cross-Signing-Schlüssel hoch
- versucht, das aktuelle Gerät zu markieren und per Cross-Signing zu signieren
- erstellt ein neues serverseitiges Room-Key-Backup, falls noch keines existiert

Wenn der Homeserver interaktive Authentifizierung zum Hochladen von Cross-Signing-Schlüsseln erfordert, versucht OpenClaw den Upload zuerst ohne Authentifizierung, dann mit `m.login.dummy` und anschließend mit `m.login.password`, wenn `channels.matrix.password` konfiguriert ist.

Verwenden Sie `--force-reset-cross-signing` nur, wenn Sie die aktuelle Cross-Signing-Identität absichtlich verwerfen und eine neue erstellen möchten.

Wenn Sie das aktuelle Room-Key-Backup absichtlich verwerfen und eine neue
Backup-Basis für zukünftige Nachrichten starten möchten, verwenden Sie `openclaw matrix verify backup reset --yes`.
Tun Sie dies nur, wenn Sie akzeptieren, dass nicht wiederherstellbarer alter verschlüsselter Verlauf
nicht verfügbar bleibt und dass OpenClaw Secret Storage möglicherweise neu erstellt, wenn das aktuelle Backup-
Geheimnis nicht sicher geladen werden kann.

### Frische Backup-Basis

Wenn Sie sicherstellen möchten, dass zukünftige verschlüsselte Nachrichten funktionieren, und akzeptieren, dass nicht wiederherstellbarer alter Verlauf verloren geht, führen Sie diese Befehle in dieser Reihenfolge aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Fügen Sie `--account <id>` zu jedem Befehl hinzu, wenn Sie ausdrücklich auf ein benanntes Matrix-Konto zielen möchten.

### Startverhalten

Wenn `encryption: true`, setzt Matrix `startupVerification` standardmäßig auf `"if-unverified"`.
Wenn dieses Gerät beim Start noch nicht verifiziert ist, fordert Matrix beim Start eine Selbstverifizierung in einem anderen Matrix-Client an,
überspringt doppelte Anforderungen, solange bereits eine aussteht, und wendet vor erneuten Versuchen nach Neustarts eine lokale Abkühlzeit an.
Fehlgeschlagene Anforderungsversuche werden standardmäßig früher erneut versucht als erfolgreiche Erstellung von Anforderungen.
Setzen Sie `startupVerification: "off"`, um automatische Startanforderungen zu deaktivieren, oder passen Sie `startupVerificationCooldownHours`
an, wenn Sie ein kürzeres oder längeres Wiederholungsfenster wünschen.

Beim Start wird außerdem automatisch ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt.
Dieser Durchlauf versucht zuerst, den aktuellen Secret Storage und die bestehende Cross-Signing-Identität wiederzuverwenden, und vermeidet das Zurücksetzen von Cross-Signing, sofern Sie nicht ausdrücklich einen Bootstrap-Reparaturablauf ausführen.

Wenn der Start einen fehlerhaften Bootstrap-Zustand findet und `channels.matrix.password` konfiguriert ist, kann OpenClaw einen strengeren Reparaturpfad versuchen.
Wenn das aktuelle Gerät bereits vom Besitzer signiert ist, erhält OpenClaw diese Identität, anstatt sie automatisch zurückzusetzen.

Upgrade vom vorherigen öffentlichen Matrix-Plugin:

- OpenClaw verwendet nach Möglichkeit automatisch dasselbe Matrix-Konto, Zugriffstoken und dieselbe Geräteidentität erneut.
- Bevor umsetzbare Matrix-Migrationsänderungen ausgeführt werden, erstellt oder verwendet OpenClaw einen Recovery-Snapshot unter `~/Backups/openclaw-migrations/`.
- Wenn Sie mehrere Matrix-Konten verwenden, setzen Sie `channels.matrix.defaultAccount`, bevor Sie vom alten Flat-Store-Layout upgraden, damit OpenClaw weiß, welches Konto diesen gemeinsam genutzten Legacy-Status erhalten soll.
- Wenn das vorherige Plugin einen Matrix-Room-Key-Backup-Entschlüsselungsschlüssel lokal gespeichert hat, importiert der Start oder `openclaw doctor --fix` ihn automatisch in den neuen Recovery-Key-Ablauf.
- Wenn sich das Matrix-Zugriffstoken geändert hat, nachdem die Migration vorbereitet wurde, durchsucht der Start jetzt benachbarte Token-Hash-Speicherwurzeln nach ausstehendem Legacy-Wiederherstellungsstatus, bevor die automatische Backup-Wiederherstellung aufgegeben wird.
- Wenn sich das Matrix-Zugriffstoken später für dasselbe Konto, denselben Homeserver und denselben Benutzer ändert, bevorzugt OpenClaw jetzt die Wiederverwendung der vollständigsten vorhandenen Token-Hash-Speicherwurzel, anstatt mit einem leeren Matrix-Statusverzeichnis zu beginnen.
- Beim nächsten Gateway-Start werden gesicherte Room Keys automatisch in den neuen Crypto-Store wiederhergestellt.
- Wenn das alte Plugin nur lokal vorhandene Room Keys hatte, die nie gesichert wurden, warnt OpenClaw deutlich. Diese Schlüssel können nicht automatisch aus dem vorherigen Rust-Crypto-Store exportiert werden, daher bleibt ein Teil des alten verschlüsselten Verlaufs möglicherweise unzugänglich, bis er manuell wiederhergestellt wird.
- Siehe [Matrix migration](/de/install/migrating-matrix) für den vollständigen Upgrade-Ablauf, Einschränkungen, Wiederherstellungsbefehle und häufige Migrationsmeldungen.

Verschlüsselter Laufzeitstatus ist unter token-hash-basierten Wurzeln pro Konto und Benutzer in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` organisiert.
Dieses Verzeichnis enthält den Sync-Store (`bot-storage.json`), den Crypto-Store (`crypto/`),
die Recovery-Key-Datei (`recovery-key.json`), den IndexedDB-Snapshot (`crypto-idb-snapshot.json`),
Thread-Bindings (`thread-bindings.json`) und den Status der Startverifizierung (`startup-verification.json`),
wenn diese Funktionen verwendet werden.
Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw die beste vorhandene
Wurzel für dieses Tupel aus Konto/Homeserver/Benutzer erneut, sodass vorheriger Sync-Status, Crypto-Status, Thread-Bindings
und der Status der Startverifizierung sichtbar bleiben.

### Node-Crypto-Store-Modell

Matrix-E2EE in diesem Plugin verwendet den offiziellen `matrix-js-sdk`-Rust-Crypto-Pfad in Node.
Dieser Pfad erwartet IndexedDB-basierte Persistenz, wenn der Crypto-Status Neustarts überdauern soll.

OpenClaw stellt dies in Node derzeit bereit durch:

- Verwendung von `fake-indexeddb` als IndexedDB-API-Shim, den das SDK erwartet
- Wiederherstellung der Rust-Crypto-IndexedDB-Inhalte aus `crypto-idb-snapshot.json` vor `initRustCrypto`
- Persistieren der aktualisierten IndexedDB-Inhalte zurück nach `crypto-idb-snapshot.json` nach der Initialisierung und während der Laufzeit
- Serialisierung von Snapshot-Wiederherstellung und -Persistierung gegen `crypto-idb-snapshot.json` mit einer beratenden Dateisperre, damit Laufzeitpersistenz des Gateways und CLI-Wartung nicht um dieselbe Snapshot-Datei konkurrieren

Dies ist Kompatibilitäts-/Speicher-Logik, keine benutzerdefinierte Crypto-Implementierung.
Die Snapshot-Datei ist sensibler Laufzeitstatus und wird mit restriktiven Dateiberechtigungen gespeichert.
Unter dem Sicherheitsmodell von OpenClaw befinden sich der Gateway-Host und das lokale OpenClaw-Statusverzeichnis bereits innerhalb der vertrauenswürdigen Betreibergrenze, daher ist dies in erster Linie ein operatives Haltbarkeitsthema und keine separate Remote-Vertrauensgrenze.

Geplante Verbesserung:

- SecretRef-Unterstützung für persistentes Matrix-Schlüsselmaterial hinzufügen, damit Recovery Keys und verwandte Store-Verschlüsselungsgeheimnisse aus OpenClaw-Secrets-Providern statt nur aus lokalen Dateien bezogen werden können

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Fügen Sie `--account <id>` hinzu, wenn Sie explizit auf ein benanntes Matrix-Konto zielen möchten.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn Sie eine `http://`- oder `https://`-Avatar-URL übergeben, lädt OpenClaw sie zuerst zu Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder in die ausgewählte Kontoüberschreibung).

## Automatische Verifizierungshinweise

Matrix veröffentlicht jetzt Hinweise zum Verifizierungslebenszyklus direkt im strikten DM-Verifizierungsraum als `m.notice`-Nachrichten.
Dazu gehören:

- Hinweise zu Verifizierungsanfragen
- Hinweise, dass die Verifizierung bereit ist (mit explizitem Hinweis "Per Emoji verifizieren")
- Hinweise zum Start und Abschluss der Verifizierung
- SAS-Details (Emoji und Dezimalzahl), wenn verfügbar

Eingehende Verifizierungsanfragen von einem anderen Matrix-Client werden von OpenClaw verfolgt und automatisch akzeptiert.
Bei Selbstverifizierungsabläufen startet OpenClaw außerdem automatisch den SAS-Ablauf, sobald Emoji-Verifizierung verfügbar wird, und bestätigt die eigene Seite.
Bei Verifizierungsanfragen von einem anderen Matrix-Benutzer/Gerät akzeptiert OpenClaw die Anfrage automatisch und wartet dann, bis der SAS-Ablauf normal fortgesetzt wird.
Sie müssen die Emoji- oder Dezimal-SAS weiterhin in Ihrem Matrix-Client vergleichen und dort "They match" bestätigen, um die Verifizierung abzuschließen.

OpenClaw akzeptiert von sich selbst initiierte doppelte Abläufe nicht blind automatisch. Beim Start wird keine neue Anfrage erstellt, wenn bereits eine Selbstverifizierungsanfrage aussteht.

Hinweise zum Verifizierungsprotokoll/System werden nicht an die Agent-Chat-Pipeline weitergeleitet und erzeugen daher kein `NO_REPLY`.

### Gerätehygiene

Alte von OpenClaw verwaltete Matrix-Geräte können sich auf dem Konto ansammeln und das Vertrauen in verschlüsselten Räumen schwerer nachvollziehbar machen.
Listen Sie sie auf mit:

```bash
openclaw matrix devices list
```

Entfernen Sie veraltete, von OpenClaw verwaltete Geräte mit:

```bash
openclaw matrix devices prune-stale
```

### Reparatur direkter Räume

Wenn der Direct-Message-Status nicht mehr synchron ist, kann OpenClaw mit veralteten `m.direct`-Zuordnungen enden, die auf alte Einzelräume statt auf die aktive DM zeigen. Prüfen Sie die aktuelle Zuordnung für einen Peer mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Die Reparatur hält die Matrix-spezifische Logik innerhalb des Plugins:

- sie bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- andernfalls greift sie auf eine beliebige derzeit beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- wenn keine gesunde DM existiert, erstellt sie einen neuen direkten Raum und schreibt `m.direct` um, sodass er auf diesen zeigt

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die gesunde DM aus und aktualisiert die Zuordnung, damit neue Matrix-Sendungen, Verifizierungshinweise und andere Direct-Message-Abläufe wieder auf den richtigen Raum zielen.

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sends mit Message-Tools.

- `dm.sessionScope: "per-user"` (Standard) hält das Matrix-DM-Routing absenderbezogen, sodass mehrere DM-Räume eine Sitzung gemeinsam nutzen können, wenn sie zu demselben Peer aufgelöst werden.
- `dm.sessionScope: "per-room"` isoliert jeden Matrix-DM-Raum in seinen eigenen Sitzungsschlüssel, verwendet aber weiterhin normale DM-Authentifizierungs- und Allowlist-Prüfungen.
- Explizite Matrix-Konversations-Bindings haben weiterhin Vorrang vor `dm.sessionScope`, sodass gebundene Räume und Threads ihr gewähltes Zielsitzungsziel beibehalten.
- `threadReplies: "off"` hält Antworten auf Top-Level-Ebene und belässt eingehende Thread-Nachrichten in der übergeordneten Sitzung.
- `threadReplies: "inbound"` antwortet in einem Thread nur dann innerhalb eines Threads, wenn die eingehende Nachricht bereits in diesem Thread war.
- `threadReplies: "always"` hält Raumantworten in einem Thread, der an der auslösenden Nachricht verankert ist, und leitet diese Konversation über die passende thread-spezifische Sitzung ab der ersten auslösenden Nachricht.
- `dm.threadReplies` überschreibt die Top-Level-Einstellung nur für DMs. So können Sie zum Beispiel Raum-Threads isoliert halten und DMs flach halten.
- Eingehende Thread-Nachrichten enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Sends mit Message-Tools übernehmen jetzt automatisch den aktuellen Matrix-Thread, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern kein explizites `threadId` angegeben ist.
- Die Wiederverwendung desselben DM-Benutzerziels in derselben Sitzung greift nur, wenn die Metadaten der aktuellen Sitzung denselben DM-Peer auf demselben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum auf derselben gemeinsam genutzten Matrix-DM-Sitzung kollidiert, veröffentlicht es einmalig ein `m.notice` in diesem Raum mit der `/focus`-Escape-Hatch, wenn Thread-Bindings aktiviert sind, sowie dem Hinweis `dm.sessionScope`.
- Laufzeit-Thread-Bindings werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und thread-gebundenes `/acp spawn` funktionieren jetzt in Matrix-Räumen und DMs.
- Top-Level-`/focus` in Matrix-Raum/DM erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Das Ausführen von `/focus` oder `/acp spawn --thread here` innerhalb eines vorhandenen Matrix-Threads bindet stattdessen diesen aktuellen Thread.

## ACP-Konversations-Bindings

Matrix-Räume, DMs und vorhandene Matrix-Threads können in dauerhafte ACP-Workspaces umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des vorhandenen Threads aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Raum auf Top-Level-Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geleitet.
- Innerhalb eines vorhandenen Matrix-Threads bindet `--bind here` den aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Konfiguration der Thread-Bindings

Matrix erbt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Thread-gebundene Spawn-Flags für Matrix sind opt-in:

- Setzen Sie `threadBindings.spawnSubagentSessions: true`, um zu erlauben, dass Top-Level-`/focus` neue Matrix-Threads erstellt und bindet.
- Setzen Sie `threadBindings.spawnAcpSessions: true`, um zu erlauben, dass `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads bindet.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Bestätigungsreaktionen.

- Tooling für ausgehende Reaktionen wird durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion vom Bot-Konto.

Der Geltungsbereich von Bestätigungsreaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Emoji-Fallback der Agent-Identität

Der Geltungsbereich von Bestätigungsreaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Der Benachrichtigungsmodus für Reaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- Standard: `own`

Aktuelles Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten zielen.
- `reactionNotifications: "off"` deaktiviert Reaktions-Systemereignisse.
- Das Entfernen von Reaktionen wird weiterhin nicht in Systemereignisse synthetisiert, da Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst.
- Es fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um dies zu deaktivieren.
- Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin normalen Sitzungsverlauf.
- Matrix-Raumverlauf ist nur pending-basiert: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Trigger eintrifft.
- Die aktuelle Trigger-Nachricht ist nicht in `InboundHistory` enthalten; sie verbleibt im Hauptteil des eingehenden Inhalts für diesen Turn.
- Wiederholungen desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufs-Snapshot erneut, anstatt zu neueren Raumnachrichten weiterzudriften.

## Kontextsichtigkeit

Matrix unterstützt das gemeinsame Steuerelement `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Wurzeln und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext wird wie empfangen beibehalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen erlaubt sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber weiterhin ein explizites zitiertes Reply bei.

Diese Einstellung beeinflusst die Sichtbarkeit ergänzenden Kontexts, nicht, ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Trigger-Autorisierung kommt weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

## Beispiel für DM- und Raumrichtlinien

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

Siehe [Groups](/de/channels/groups) für Verhalten bei Erwähnungs-Gating und Allowlist.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Sie vor der Genehmigung weiterhin anschreibt, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und sendet nach einer kurzen Abkühlzeit möglicherweise erneut eine Erinnerungsantwort, anstatt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Exec-Genehmigungen

Matrix kann als Exec-Genehmigungs-Client für ein Matrix-Konto fungieren.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; fällt auf `channels.matrix.dm.allowFrom` zurück)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Genehmiger müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmiger aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `channels.matrix.dm.allowFrom`. Setzen Sie `enabled: false`, um Matrix explizit als nativen Genehmigungs-Client zu deaktivieren. Genehmigungsanfragen fallen ansonsten auf andere konfigurierte Genehmigungsrouten oder die Fallback-Richtlinie für Exec-Genehmigungen zurück.

Natives Matrix-Routing ist heute nur für Exec:

- `channels.matrix.execApprovals.*` steuert natives DM-/Kanal-Routing nur für Exec-Genehmigungen.
- Plugin-Genehmigungen verwenden weiterhin das gemeinsame gleiches-Chat-`/approve` plus etwaige konfigurierte `approvals.plugin`-Weiterleitung.
- Matrix kann `channels.matrix.dm.allowFrom` weiterhin für die Autorisierung von Plugin-Genehmigungen wiederverwenden, wenn Genehmiger sicher abgeleitet werden können, stellt aber keinen separaten nativen DM-/Kanal-Fanout-Pfad für Plugin-Genehmigungen bereit.

Zustellungsregeln:

- `target: "dm"` sendet Genehmigungsaufforderungen an Genehmiger-DMs
- `target: "channel"` sendet die Aufforderung zurück an den auslösenden Matrix-Raum oder die DM
- `target: "both"` sendet an Genehmiger-DMs und an den auslösenden Matrix-Raum oder die DM

Matrix-Genehmigungsaufforderungen initialisieren Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` = einmal zulassen
- `❌` = ablehnen
- `♾️` = immer zulassen, wenn diese Entscheidung durch die effektive Exec-Richtlinie erlaubt ist

Genehmiger können auf diese Nachricht reagieren oder die Fallback-Slash-Befehle verwenden: `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny`.

Nur aufgelöste Genehmiger können genehmigen oder ablehnen. Die Kanalauslieferung enthält den Befehlstext, daher sollten `channel` oder `both` nur in vertrauenswürdigen Räumen aktiviert werden.

Matrix-Genehmigungsaufforderungen verwenden den gemeinsamen Core-Approval-Planer erneut. Die Matrix-spezifische native Oberfläche ist nur der Transport für Exec-Genehmigungen: Raum-/DM-Routing und Verhalten beim Senden/Aktualisieren/Löschen von Nachrichten.

Überschreibung pro Konto:

- `channels.matrix.accounts.<account>.execApprovals`

Verwandte Dokumentation: [Exec approvals](/de/tools/exec-approvals)

## Beispiel für mehrere Konten

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

Werte auf Top-Level in `channels.matrix` fungieren als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
Sie können geerbte Raumeinträge mit `groups.<room>.account` (oder dem Legacy-`rooms.<room>.account`) auf ein Matrix-Konto beschränken.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam genutzt, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf Top-Level unter `channels.matrix.*` konfiguriert ist.
Teilweise gemeinsame Auth-Standards erzeugen für sich genommen kein separates implizites Standardkonto. OpenClaw synthetisiert das Top-Level-Konto `default` nur dann, wenn dieses Standardkonto frische Authentifizierung hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können weiterhin über `homeserver` plus `userId` auffindbar bleiben, wenn zwischengespeicherte Anmeldedaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen benannten Kontoschlüssel zeigt, erhält die Reparatur-/Einrichtungs-Promotion von Einzelkonto zu Mehrfachkonto dieses Konto, statt einen neuen `accounts.default`-Eintrag zu erstellen. Nur Matrix-Auth-/Bootstrap-Schlüssel werden in dieses hochgestufte Konto verschoben; gemeinsam genutzte Zustellungsrichtlinien-Schlüssel bleiben auf Top-Level.
Setzen Sie `defaultAccount`, wenn OpenClaw ein benanntes Matrix-Konto für implizites Routing, Probing und CLI-Operationen bevorzugen soll.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie `defaultAccount` oder übergeben `--account <id>` für CLI-Befehle, die auf impliziter Kontoauswahl beruhen.
Übergeben Sie `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn Sie diese implizite Auswahl für einen einzelnen Befehl überschreiben möchten.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver aus SSRF-Schutzgründen, sofern Sie nicht
dies pro Konto explizit aktivieren.

Wenn Ihr Homeserver auf localhost, einer LAN-/Tailscale-IP oder einem internen Hostnamen läuft, aktivieren Sie
`allowPrivateNetwork` für dieses Matrix-Konto:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
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
`http://matrix.example.org:8008` bleiben blockiert. Bevorzugen Sie nach Möglichkeit `https://`.

## Matrix-Datenverkehr über Proxy leiten

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

Benannte Konten können den Top-Level-Standard mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Datenverkehr zur Laufzeit und für Kontostatus-Probes.

## Zielauflösung

Matrix akzeptiert überall dort diese Zielformen, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzer-Lookups fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raum-Lookups akzeptieren explizite Raum-IDs und Aliasse direkt und greifen dann auf die Suche in Namen beigetretener Räume für dieses Konto zurück.
- Die Namenssuche in beigetretenen Räumen ist Best-Effort. Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er bei der Laufzeit-Allowlist-Auflösung ignoriert.

## Konfigurationsreferenz

- `enabled`: den Kanal aktivieren oder deaktivieren.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `allowPrivateNetwork`: diesem Matrix-Konto erlauben, sich mit privaten/internen Homeservern zu verbinden. Aktivieren Sie dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Benannte Konten können den Top-Level-Standard mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` über env-/file-/exec-Provider unterstützt. Siehe [Secrets Management](/de/gateway/secrets).
- `password`: Passwort für passwortbasierte Anmeldung. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Geräteanzeigename für die Passwort-Anmeldung.
- `avatarUrl`: gespeicherte Self-Avatar-URL für Profilsynchronisierung und `set-profile`-Updates.
- `initialSyncLimit`: Ereignislimit für den Start-Sync.
- `encryption`: E2EE aktivieren.
- `allowlistOnly`: nur-Allowlist-Verhalten für DMs und Räume erzwingen.
- `allowBots`: Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten zulassen (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumverkehr.
- `groupAllowFrom`-Einträge sollten vollständige Matrix-Benutzer-IDs sein. Nicht aufgelöste Namen werden zur Laufzeit ignoriert.
- `historyLimit`: maximale Anzahl von Raumnachrichten, die als Gruppenverlaufs-Kontext einbezogen werden. Fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um dies zu deaktivieren.
- `replyToMode`: `off`, `first` oder `all`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `partial`, `quiet`, `true` oder `false`. `partial` und `true` aktivieren preview-first-Entwurfsaktualisierungen mit normalen Matrix-Textnachrichten. `quiet` verwendet nicht benachrichtigende Vorschau-Hinweise für selbst gehostete Push-Regel-Setups.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistant-Blöcke, während Entwurfs-Vorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: kanalbezogene Überschreibungen für thread-gebundenes Sitzungsrouting und Lebenszyklus.
- `startupVerification`: Modus für automatische Selbstverifizierungsanfragen beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Abkühlzeit vor einem erneuten Versuch automatischer Verifizierungsanfragen beim Start.
- `textChunkLimit`: Chunk-Größe für ausgehende Nachrichten.
- `chunkMode`: `length` oder `newline`.
- `responsePrefix`: optionales Nachrichtenpräfix für ausgehende Antworten.
- `ackReaction`: optionale Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: optionale Überschreibung des Geltungsbereichs der Bestätigungsreaktion (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Größenlimit für Medien in MB für Matrix-Medienverarbeitung. Gilt für ausgehende Sends und eingehende Medienverarbeitung.
- `autoJoin`: Richtlinie für automatisches Beitreten zu Einladungen (`always`, `allowlist`, `off`). Standard: `off`.
- `autoJoinAllowlist`: erlaubte Räume/Aliasse, wenn `autoJoin` auf `allowlist` gesetzt ist. Alias-Einträge werden während der Einladungshandhabung in Raum-IDs aufgelöst; OpenClaw vertraut nicht auf den Alias-Status, den der eingeladene Raum angibt.
- `dm`: DM-Richtlinienblock (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.allowFrom`-Einträge sollten vollständige Matrix-Benutzer-IDs sein, sofern Sie sie nicht bereits per Live-Verzeichnissuche aufgelöst haben.
- `dm.sessionScope`: `per-user` (Standard) oder `per-room`. Verwenden Sie `per-room`, wenn jeder Matrix-DM-Raum einen separaten Kontext behalten soll, selbst wenn der Peer derselbe ist.
- `dm.threadReplies`: nur für DMs geltende Überschreibung der Thread-Richtlinie (`off`, `inbound`, `always`). Sie überschreibt die Top-Level-Einstellung `threadReplies` sowohl für die Platzierung von Antworten als auch für die Sitzungsisolierung in DMs.
- `execApprovals`: Matrix-native Exec-Genehmigungszustellung (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die Genehmiger bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte Überschreibungen pro Konto. Werte auf Top-Level in `channels.matrix` fungieren als Standardwerte für diese Einträge.
- `groups`: Richtlinienzuordnung pro Raum. Bevorzugen Sie Raum-IDs oder Aliasse; nicht aufgelöste Raumnamen werden zur Laufzeit ignoriert. Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID, während menschenlesbare Labels weiterhin aus Raumnamen stammen.
- `groups.<room>.account`: einen geerbten Raumeintrag in Setups mit mehreren Konten auf ein bestimmtes Matrix-Konto beschränken.
- `groups.<room>.allowBots`: Überschreibung auf Raumebene für Sender aus konfigurierten Botkonten (`true` oder `"mentions"`).
- `groups.<room>.users`: Allowlist der Absender pro Raum.
- `groups.<room>.tools`: Überschreibungen zum Erlauben/Verweigern von Tools pro Raum.
- `groups.<room>.autoReply`: Überschreibung des Erwähnungs-Gatings auf Raumebene. `true` deaktiviert Erwähnungsanforderungen für diesen Raum; `false` erzwingt sie wieder.
- `groups.<room>.skills`: optionaler Skill-Filter auf Raumebene.
- `groups.<room>.systemPrompt`: optionaler System-Prompt-Schnipsel auf Raumebene.
- `rooms`: Legacy-Alias für `groups`.
- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung

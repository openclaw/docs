---
read_when:
    - Einrichten von Matrix in OpenClaw
    - Konfigurieren von Matrix-E2EE und Verifizierung
summary: Unterstützungsstatus, Einrichtung und Konfigurationsbeispiele für Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix ist ein gebündeltes Channel-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation ohne Matrix verwenden, installieren
Sie es manuell:

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

1. Stellen Sie sicher, dass das Matrix-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den oben genannten Befehlen hinzufügen.
2. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
3. Konfigurieren Sie `channels.matrix` mit entweder:
   - `homeserver` + `accessToken`, oder
   - `homeserver` + `userId` + `password`.
4. Starten Sie das Gateway neu.
5. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein.
   - Neue Matrix-Einladungen funktionieren nur, wenn `channels.matrix.autoJoin` sie zulässt.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

Der Matrix-Assistent fragt nach:

- Homeserver-URL
- Authentifizierungsmethode: Zugriffstoken oder Passwort
- Benutzer-ID (nur bei Passwortauthentifizierung)
- optionaler Gerätename
- ob E2EE aktiviert werden soll
- ob Raumzugriff und automatischer Beitritt zu Einladungen konfiguriert werden sollen

Wichtige Verhaltensweisen des Assistenten:

- Wenn Matrix-Authentifizierungs-Umgebungsvariablen bereits vorhanden sind und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Umgebungsvariablen-Verknüpfung an, damit die Authentifizierung in Umgebungsvariablen verbleibt.
- Kontonamen werden auf die Konto-ID normalisiert. Zum Beispiel wird `Ops Bot` zu `ops-bot`.
- Einträge in der DM-Allowlist akzeptieren direkt `@user:server`; Anzeigenamen funktionieren nur, wenn die Live-Verzeichnissuche genau eine Übereinstimmung findet.
- Einträge in der Raum-Allowlist akzeptieren Raum-IDs und Aliasse direkt. Bevorzugen Sie `!room:server` oder `#alias:server`; nicht aufgelöste Namen werden zur Laufzeit bei der Allowlist-Auflösung ignoriert.
- Im Allowlist-Modus für automatischen Einladungsbeitritt dürfen nur stabile Einladungsziele verwendet werden: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.
- Um Raumnamen vor dem Speichern aufzulösen, verwenden Sie `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` ist standardmäßig auf `off` gesetzt.

Wenn Sie es nicht festlegen, tritt der Bot eingeladenen Räumen oder neuen DM-artigen Einladungen nicht bei. Er erscheint also nicht in neuen Gruppen oder eingeladenen DMs, sofern Sie nicht zuerst manuell beitreten.

Setzen Sie `autoJoin: "allowlist"` zusammen mit `autoJoinAllowlist`, um zu beschränken, welche Einladungen akzeptiert werden, oder setzen Sie `autoJoin: "always"`, wenn er jeder Einladung beitreten soll.

Im Modus `allowlist` akzeptiert `autoJoinAllowlist` nur `!roomId:server`, `#alias:server` oder `*`.
</Warning>

Beispiel für eine Allowlist:

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
Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, betrachtet OpenClaw Matrix für Einrichtung, Doctor und Erkennung des Channel-Status als konfiguriert, auch wenn die aktuelle Authentifizierung nicht direkt in der Konfiguration gesetzt ist.

Entsprechende Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Für Nicht-Standardkonten verwenden Sie kontobezogene Umgebungsvariablen:

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

Matrix maskiert Satzzeichen in Konto-IDs, damit kontobezogene Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, sodass `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet wird.

Der interaktive Assistent bietet die Umgebungsvariablen-Verknüpfung nur an, wenn diese Authentifizierungs-Umgebungsvariablen bereits vorhanden sind und das ausgewählte Konto noch keine Matrix-Authentifizierung in der Konfiguration gespeichert hat.

`MATRIX_HOMESERVER` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

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

`autoJoin` gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen. OpenClaw kann einen eingeladenen
Raum zum Zeitpunkt der Einladung nicht zuverlässig als DM oder Gruppe klassifizieren, daher laufen alle Einladungen zunächst über `autoJoin`.
`dm.policy` gilt, nachdem der Bot beigetreten ist und der Raum als DM klassifiziert wurde.

## Streaming-Vorschauen

Reply-Streaming für Matrix ist Opt-in.

Setzen Sie `channels.matrix.streaming` auf `"partial"`, wenn OpenClaw eine einzelne Live-Vorschauantwort senden,
diese Vorschau während der Textgenerierung des Modells an Ort und Stelle bearbeiten und sie anschließend abschließen soll,
wenn die Antwort fertig ist:

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
- `streaming: "partial"` erstellt eine bearbeitbare Vorschau-Nachricht für den aktuellen Assistant-Block unter Verwendung normaler Matrix-Textnachrichten. Dadurch bleibt das ältere Matrix-Benachrichtigungsverhalten „Vorschau zuerst“ erhalten, sodass Standard-Clients möglicherweise beim ersten gestreamten Vorschautext benachrichtigen statt beim fertigen Block.
- `streaming: "quiet"` erstellt einen bearbeitbaren stillen Vorschauhinweis für den aktuellen Assistant-Block. Verwenden Sie dies nur, wenn Sie zusätzlich Empfänger-Push-Regeln für abgeschlossene Vorschau-Bearbeitungen konfigurieren.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Wenn Vorschau-Streaming aktiviert ist, behält Matrix den Live-Entwurf für den aktuellen Block bei und bewahrt abgeschlossene Blöcke als separate Nachrichten auf.
- Wenn Vorschau-Streaming aktiviert ist und `blockStreaming` deaktiviert ist, bearbeitet Matrix den Live-Entwurf an Ort und Stelle und finalisiert dasselbe Ereignis, wenn der Block oder der Turn abgeschlossen ist.
- Wenn die Vorschau nicht mehr in ein Matrix-Ereignis passt, beendet OpenClaw das Vorschau-Streaming und fällt auf die normale endgültige Zustellung zurück.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie vor dem Senden der endgültigen Medienantwort.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lassen Sie Streaming deaktiviert, wenn Sie das konservativste Verhalten bei Ratenbegrenzungen wünschen.

`blockStreaming` aktiviert für sich genommen keine Entwurfsvorschauen.
Verwenden Sie `streaming: "partial"` oder `streaming: "quiet"` für Vorschau-Bearbeitungen; fügen Sie dann `blockStreaming: true` nur hinzu, wenn abgeschlossene Assistant-Blöcke zusätzlich als separate Fortschrittsnachrichten sichtbar bleiben sollen.

Wenn Sie Standard-Matrix-Benachrichtigungen ohne benutzerdefinierte Push-Regeln benötigen, verwenden Sie `streaming: "partial"` für das Verhalten „Vorschau zuerst“ oder lassen Sie `streaming` für reine Endzustellung deaktiviert. Mit `streaming: "off"`:

- `blockStreaming: true` sendet jeden abgeschlossenen Block als normale benachrichtigende Matrix-Nachricht.
- `blockStreaming: false` sendet nur die endgültig abgeschlossene Antwort als normale benachrichtigende Matrix-Nachricht.

### Selbst gehostete Push-Regeln für stille finalisierte Vorschauen

Stilles Streaming (`streaming: "quiet"`) benachrichtigt Empfänger nur, wenn ein Block oder Turn finalisiert ist — eine Push-Regel pro Benutzer muss auf die Markierung für die finalisierte Vorschau passen. Siehe [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules) für die vollständige Einrichtung (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver).

## Bot-zu-Bot-Räume

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

- `allowBots: true` akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten in erlaubten Räumen und DMs.
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur dann, wenn dieser Bot darin sichtbar erwähnt wird. DMs sind weiterhin erlaubt.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen einzelnen Raum.
- OpenClaw ignoriert weiterhin Nachrichten derselben Matrix-Benutzer-ID, um Selbstantwort-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von Bots verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, damit Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin schlichtes `thumbnail_url`. Es ist keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

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

Verifizierungsbefehle (alle akzeptieren `--verbose` für Diagnosen und `--json` für maschinenlesbare Ausgabe):

```bash
openclaw matrix verify status
```

Ausführlicher Status (vollständige Diagnosen):

```bash
openclaw matrix verify status --verbose
```

Den gespeicherten Wiederherstellungsschlüssel in die maschinenlesbare Ausgabe aufnehmen:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-Signing- und Verifizierungsstatus initialisieren:

```bash
openclaw matrix verify bootstrap
```

Ausführliche Bootstrap-Diagnosen:

```bash
openclaw matrix verify bootstrap --verbose
```

Vor dem Bootstrap ein neues Zurücksetzen der Cross-Signing-Identität erzwingen:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Dieser Befehl meldet drei separate Zustände:

- `Recovery key accepted`: Matrix hat den Wiederherstellungsschlüssel für Secret Storage oder Gerätevertrauen akzeptiert.
- `Backup usable`: Die Sicherung des Raum-Schlüssels kann mit vertrauenswürdigem Wiederherstellungsmaterial geladen werden.
- `Device verified by owner`: Das aktuelle OpenClaw-Gerät besitzt volles Vertrauensniveau der Matrix-Cross-Signing-Identität.

`Signed by owner` in ausführlicher oder JSON-Ausgabe dient nur der Diagnose. OpenClaw behandelt
dies nicht als ausreichend, sofern `Cross-signing verified` nicht ebenfalls `yes` ist.

Der Befehl beendet sich weiterhin mit einem Fehlercode ungleich null, wenn das vollständige Matrix-Identitätsvertrauen unvollständig ist,
selbst wenn der Wiederherstellungsschlüssel Sicherungsmaterial entsperren kann. Schließen Sie in diesem Fall
die Selbstverifizierung in einem anderen Matrix-Client ab:

```bash
openclaw matrix verify self
```

Akzeptieren Sie die Anfrage in einem anderen Matrix-Client, vergleichen Sie die SAS-Emoji oder Dezimalzahlen
und geben Sie nur dann `yes` ein, wenn sie übereinstimmen. Der Befehl wartet darauf, dass Matrix
`Cross-signing verified: yes` meldet, bevor er erfolgreich beendet wird.

Verwenden Sie `verify bootstrap --force-reset-cross-signing` nur dann, wenn Sie
die aktuelle Cross-Signing-Identität absichtlich ersetzen möchten.

Ausführliche Details zur Geräteverifizierung:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Integrität der Raumschlüssel-Sicherung prüfen:

```bash
openclaw matrix verify backup status
```

Ausführliche Diagnosen zur Sicherungsintegrität:

```bash
openclaw matrix verify backup status --verbose
```

Raumschlüssel aus der Serversicherung wiederherstellen:

```bash
openclaw matrix verify backup restore
```

Interaktiver Ablauf der Selbstverifizierung:

```bash
openclaw matrix verify self
```

Für Verifizierungsanfragen auf niedrigerer Ebene oder eingehende Anfragen verwenden Sie:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Verwenden Sie `openclaw matrix verify cancel <id>`, um eine Anfrage abzubrechen.

Ausführliche Wiederherstellungsdiagnosen:

```bash
openclaw matrix verify backup restore --verbose
```

Löschen Sie die aktuelle Serversicherung und erstellen Sie eine neue Sicherungsbasis. Wenn der gespeicherte
Sicherungsschlüssel nicht sauber geladen werden kann, kann dieses Zurücksetzen auch Secret Storage neu erstellen, damit
künftige Kaltstarts den neuen Sicherungsschlüssel laden können:

```bash
openclaw matrix verify backup reset --yes
```

Alle `verify`-Befehle sind standardmäßig knapp gehalten (einschließlich stiller interner SDK-Protokollierung) und zeigen detaillierte Diagnosen nur mit `--verbose`.
Verwenden Sie `--json` für vollständige maschinenlesbare Ausgabe beim Skripten.

In Multi-Account-Setups verwenden Matrix-CLI-Befehle implizit das Matrix-Standardkonto, sofern Sie nicht `--account <id>` übergeben.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie zuerst `channels.matrix.defaultAccount`, andernfalls werden diese impliziten CLI-Operationen angehalten und Sie aufgefordert, ein Konto explizit auszuwählen.
Verwenden Sie `--account`, wenn Verifizierungs- oder Geräteoperationen gezielt ein benanntes Konto ansprechen sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Was verifiziert bedeutet">
    OpenClaw behandelt ein Gerät nur dann als verifiziert, wenn Ihre eigene Cross-Signing-Identität es signiert. `verify status --verbose` zeigt drei Vertrauenssignale:

    - `Locally trusted`: nur von diesem Client vertraut
    - `Cross-signing verified`: Das SDK meldet Verifizierung per Cross-Signing
    - `Signed by owner`: von Ihrem eigenen Self-Signing-Schlüssel signiert

    `Verified by owner` wird nur dann zu `yes`, wenn Cross-Signing-Verifizierung vorliegt.
    Lokales Vertrauen oder eine Eigentümersignatur allein reichen nicht aus, damit OpenClaw
    das Gerät als vollständig verifiziert behandelt.

  </Accordion>

  <Accordion title="Was bootstrap macht">
    `verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Konten. Der Reihe nach:

    - initialisiert Secret Storage und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel erneut
    - initialisiert Cross-Signing und lädt fehlende öffentliche Cross-Signing-Schlüssel hoch
    - markiert und cross-signiert das aktuelle Gerät
    - erstellt eine serverseitige Raumschlüssel-Sicherung, falls noch keine existiert

    Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln verlangt, versucht OpenClaw zuerst ohne Authentifizierung, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`). Verwenden Sie `--force-reset-cross-signing` nur, wenn Sie die aktuelle Identität absichtlich verwerfen.

  </Accordion>

  <Accordion title="Neue Sicherungsbasis">
    Wenn Sie möchten, dass künftige verschlüsselte Nachrichten weiterhin funktionieren, und akzeptieren, dass nicht wiederherstellbarer alter Verlauf verloren geht:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Fügen Sie `--account <id>` hinzu, um ein benanntes Konto anzusprechen. Dadurch kann auch Secret Storage neu erstellt werden, wenn das aktuelle Sicherungsgeheimnis nicht sicher geladen werden kann.

  </Accordion>

  <Accordion title="Startverhalten">
    Mit `encryption: true` ist `startupVerification` standardmäßig `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät in einem anderen Matrix-Client zur Selbstverifizierung auf, überspringt Duplikate und verwendet eine Abklingzeit. Passen Sie dies mit `startupVerificationCooldownHours` an oder deaktivieren Sie es mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt, der den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Status beschädigt ist, versucht OpenClaw eine geschützte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA verlangt, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Eigentümer signierte Geräte bleiben erhalten.

    Siehe [Matrix-Migration](/de/install/migrating-matrix) für den vollständigen Upgrade-Ablauf.

  </Accordion>

  <Accordion title="Verifizierungshinweise">
    Matrix veröffentlicht Hinweise zum Verifizierungslebenszyklus im strikten DM-Verifizierungsraum als `m.notice`-Nachrichten: Anfrage, bereit (mit Hinweis „Mit Emoji verifizieren“), Start/Abschluss und SAS-Details (Emoji/Dezimalzahlen), wenn verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden nachverfolgt und automatisch akzeptiert. Bei der Selbstverifizierung startet OpenClaw den SAS-Ablauf automatisch und bestätigt die eigene Seite, sobald die Emoji-Verifizierung verfügbar ist — Sie müssen dennoch in Ihrem Matrix-Client vergleichen und „Sie stimmen überein“ bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Gerätehygiene">
    Alte von OpenClaw verwaltete Geräte können sich ansammeln. Auflisten und bereinigen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto-Store">
    Matrix-E2EE verwendet den offiziellen Rust-Crypto-Pfad von `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Der Crypto-Status wird in `crypto-idb-snapshot.json` gespeichert (restriktive Dateiberechtigungen).

    Der verschlüsselte Laufzeitstatus befindet sich unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Sync-Store, den Crypto-Store, den Wiederherstellungsschlüssel, den IDB-Snapshot, Thread-Bindungen und den Startup-Verifizierungsstatus. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw das beste vorhandene Root erneut, damit der vorherige Status sichtbar bleibt.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Fügen Sie `--account <id>` hinzu, wenn Sie ein benanntes Matrix-Konto gezielt ansprechen möchten.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn Sie eine `http://`- oder `https://`-Avatar-URL übergeben, lädt OpenClaw sie zuerst in Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder in die Überschreibung des ausgewählten Kontos).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sends per Message-Tool.

- `dm.sessionScope: "per-user"` (Standard) hält Matrix-DM-Routing auf den Absender bezogen, sodass mehrere DM-Räume eine Sitzung teilen können, wenn sie sich auf denselben Peer auflösen.
- `dm.sessionScope: "per-room"` isoliert jeden Matrix-DM-Raum in seinem eigenen Sitzungsschlüssel und verwendet weiterhin normale DM-Authentifizierungs- und Allowlist-Prüfungen.
- Explizite Matrix-Konversationsbindungen haben weiterhin Vorrang vor `dm.sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung beibehalten.
- `threadReplies: "off"` hält Antworten auf oberster Ebene und belässt eingehende Thread-Nachrichten auf der übergeordneten Sitzung.
- `threadReplies: "inbound"` antwortet innerhalb eines Threads nur dann, wenn die eingehende Nachricht bereits in diesem Thread war.
- `threadReplies: "always"` hält Raumantworten in einem Thread, der in der auslösenden Nachricht verwurzelt ist, und leitet diese Konversation ab der ersten auslösenden Nachricht über die passende threadbezogene Sitzung.
- `dm.threadReplies` überschreibt die Einstellung auf oberster Ebene nur für DMs. So können Sie zum Beispiel Raum-Threads isoliert halten und DMs flach halten.
- Eingehende Thread-Nachrichten enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Sends per Message-Tool übernehmen automatisch den aktuellen Matrix-Thread, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern nicht explizit ein `threadId` angegeben wird.
- Die Wiederverwendung desselben DM-Benutzerziels in derselben Sitzung greift nur, wenn die aktuellen Sitzungsmetadaten denselben DM-Peer auf demselben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsamen Matrix-DM-Sitzung kollidiert, veröffentlicht es einmalig ein `m.notice` in diesem Raum mit dem Escape-Hatch `/focus`, wenn Thread-Bindungen aktiviert sind, sowie dem Hinweis `dm.sessionScope`.
- Laufzeit-Thread-Bindungen werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren in Matrix-Räumen und DMs.
- Oberstes Matrix-Raum-/DM-`/focus` erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Wenn `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads ausgeführt wird, bindet es stattdessen diesen aktuellen Thread.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des bestehenden Threads aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche und künftige Nachrichten werden an die erzeugte ACP-Sitzung geleitet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Konfiguration der Thread-Bindung

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Threadgebundene Spawn-Flags für Matrix sind Opt-in:

- Setzen Sie `threadBindings.spawnSubagentSessions: true`, um zuzulassen, dass `/focus` auf oberster Ebene neue Matrix-Threads erstellt und bindet.
- Setzen Sie `threadBindings.spawnAcpSessions: true`, um zuzulassen, dass `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads bindet.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Bestätigungsreaktionen.

- Outbound-Reaktions-Tooling wird durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion vom Bot-Konto.

Der Geltungsbereich von Bestätigungsreaktionen wird in der standardmäßigen OpenClaw-Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Emoji-Fallback der Agent-Identität

Der Geltungsbereich von Bestätigungsreaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Der Modus für Reaktionsbenachrichtigungen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- Standard: `own`

Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten zielen.
- `reactionNotifications: "off"` deaktiviert Reaktionssystemereignisse.
- Das Entfernen von Reaktionen wird nicht in Systemereignisse umgewandelt, weil Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufs-Kontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Der Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Matrix-Raumverlauf ist nur für ausstehende Nachrichten: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle Auslösernachricht ist nicht in `InboundHistory` enthalten; sie bleibt für diesen Turn im Hauptteil der eingehenden Nachricht.
- Wiederholungen desselben Matrix-Ereignisses verwenden denselben ursprünglichen Verlaufs-Snapshot erneut, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Einstellung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Wurzeln und ausstehenden Verlauf.

- `contextVisibility: "all"` ist die Standardeinstellung. Ergänzender Kontext bleibt wie empfangen erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Allowlist-Prüfungen für Raum/Benutzer zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber dennoch eine explizit zitierte Antwort bei.

Diese Einstellung beeinflusst die Sichtbarkeit ergänzenden Kontexts, nicht ob die eingehende Nachricht selbst eine Antwort auslösen darf.
Die Autorisierung für Auslöser kommt weiterhin von `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Siehe [Gruppen](/de/channels/groups) für Verhalten bei Erwähnungs-Gating und Allowlist.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und kann nach einer kurzen Abklingzeit erneut eine Erinnerung senden, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Direkte Raumreparatur

Wenn der Direct-Message-Status nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen haben, die auf alte Einzelräume statt auf die aktuelle DM zeigen. Prüfen Sie die aktuelle Zuordnung für einen Peer mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- greift andernfalls auf eine aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` um, wenn keine intakte DM existiert

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die intakte DM aus und aktualisiert die Zuordnung, sodass neue Matrix-Sends, Verifizierungshinweise und andere Direct-Message-Abläufe wieder den richtigen Raum ansprechen.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungs-Client für ein Matrix-Konto dienen. Die nativen
DM-/Kanal-Routing-Schalter liegen weiterhin unter der Konfiguration für Exec-Genehmigungen:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; fällt auf `channels.matrix.dm.allowFrom` zurück)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Genehmigende müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder auf `"auto"` gesetzt ist und mindestens eine genehmigende Person aufgelöst werden kann. Exec-Genehmigungen verwenden zuerst `execApprovals.approvers` und können auf `channels.matrix.dm.allowFrom` zurückfallen. Plugin-Genehmigungen autorisieren über `channels.matrix.dm.allowFrom`. Setzen Sie `enabled: false`, um Matrix explizit als nativen Genehmigungs-Client zu deaktivieren. Genehmigungsanfragen fallen andernfalls auf andere konfigurierte Genehmigungswege oder die Fallback-Richtlinie für Genehmigungen zurück.

Das native Matrix-Routing unterstützt beide Genehmigungsarten:

- `channels.matrix.execApprovals.*` steuert den nativen DM-/Kanal-Fanout-Modus für Matrix-Genehmigungsaufforderungen.
- Exec-Genehmigungen verwenden die Menge der Genehmigenden aus `execApprovals.approvers` oder `channels.matrix.dm.allowFrom`.
- Plugin-Genehmigungen verwenden die Matrix-DM-Allowlist aus `channels.matrix.dm.allowFrom`.
- Matrix-Reaktionskürzel und Nachrichtenaktualisierungen gelten sowohl für Exec- als auch für Plugin-Genehmigungen.

Zustellungsregeln:

- `target: "dm"` sendet Genehmigungsaufforderungen an DMs der genehmigenden Personen
- `target: "channel"` sendet die Aufforderung zurück in den auslösenden Matrix-Raum oder die DM
- `target: "both"` sendet an DMs der genehmigenden Personen und an den auslösenden Matrix-Raum oder die DM

Matrix-Genehmigungsaufforderungen setzen Reaktionskürzel auf die primäre Genehmigungsnachricht:

- `✅` = einmal zulassen
- `❌` = ablehnen
- `♾️` = immer zulassen, wenn diese Entscheidung durch die effektive Exec-Richtlinie erlaubt ist

Genehmigende können auf diese Nachricht reagieren oder die Fallback-Slash-Befehle verwenden: `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny`.

Nur aufgelöste genehmigende Personen können zulassen oder ablehnen. Bei Exec-Genehmigungen enthält die Kanalzustellung den Befehlstext; aktivieren Sie `channel` oder `both` daher nur in vertrauenswürdigen Räumen.

Überschreibung pro Konto:

- `channels.matrix.accounts.<account>.execApprovals`

Verwandte Dokumentation: [Exec-Genehmigungen](/de/tools/exec-approvals)

## Slash-Befehle

Matrix-Slash-Befehle (zum Beispiel `/new`, `/reset`, `/model`) funktionieren direkt in DMs. In Räumen erkennt OpenClaw außerdem Slash-Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad auslöst, ohne dass ein benutzerdefinierter Erwähnungs-Regex nötig ist. So bleibt der Bot bei raumtypischen `@mention /command`-Beiträgen reaktionsfähig, die Element und ähnliche Clients senden, wenn ein Benutzer den Bot per Tab-Vervollständigung auswählt, bevor er den Befehl tippt.

Autorisierungsregeln gelten weiterhin: Absender von Befehlen müssen die DM- oder Raum-Allowlist-/Owner-Richtlinien genauso erfüllen wie bei normalen Nachrichten.

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

Werte auf oberster Ebene in `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
Sie können geerbte Raumeinträge mit `groups.<room>.account` auf ein Matrix-Konto beschränken.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf oberster Ebene unter `channels.matrix.*` konfiguriert ist.
Partielle gemeinsame Authentifizierungs-Standardwerte erzeugen für sich genommen kein separates implizites Standardkonto. OpenClaw erzeugt das oberste `default`-Konto nur dann synthetisch, wenn dieses Standardkonto aktuelle Authentifizierung hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können dennoch mit `homeserver` plus `userId` erkennbar bleiben, wenn zwischengespeicherte Anmeldedaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen Schlüssel eines benannten Kontos zeigt, bewahrt die Reparatur-/Einrichtungs-Promotion von Einzelkonto zu Multi-Account dieses Konto, statt einen neuen `accounts.default`-Eintrag zu erstellen. Nur Authentifizierungs-/Bootstrap-Schlüssel von Matrix werden in dieses hochgestufte Konto verschoben; gemeinsame Zustellungsrichtlinien bleiben auf oberster Ebene.
Setzen Sie `defaultAccount`, wenn OpenClaw ein benanntes Matrix-Konto für implizites Routing, Probing und CLI-Operationen bevorzugen soll.
Wenn mehrere Matrix-Konten konfiguriert sind und eine Konto-ID `default` ist, verwendet OpenClaw dieses Konto implizit, auch wenn `defaultAccount` nicht gesetzt ist.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie `defaultAccount` oder übergeben Sie `--account <id>` für CLI-Befehle, die auf impliziter Kontoauswahl beruhen.
Übergeben Sie `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn Sie diese implizite Auswahl für einen einzelnen Befehl überschreiben möchten.

Siehe [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Multi-Account-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum Schutz vor SSRF, sofern Sie
dies nicht explizit pro Konto erlauben.

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

Beispiel für die CLI-Einrichtung:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Dieses Opt-in erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Bevorzugen Sie nach Möglichkeit `https://`.

## Matrix-Datenverkehr über Proxy

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

Benannte Konten können den Standardwert auf oberster Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für laufenden Matrix-Datenverkehr und Abfragen des Kontostatus.

## Zielauflösung

Matrix akzeptiert überall dort, wo OpenClaw nach einem Raum- oder Benutzerziel fragt, diese Zielformen:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt und greifen dann auf die Suche in beigetretenen Raumnamen für dieses Konto zurück.
- Die Suche in Namen beigetretener Räume erfolgt nach bestem Bemühen. Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er bei der Laufzeit-Auflösung der Allowlist ignoriert.

## Konfigurationsreferenz

- `enabled`: aktiviert oder deaktiviert den Kanal.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: erlaubt diesem Matrix-Konto die Verbindung zu privaten/internen Homeservern. Aktivieren Sie dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Benannte Konten können den Standardwert auf oberster Ebene mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` über env-/file-/exec-Provider unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).
- `password`: Passwort für passwortbasierte Anmeldung. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts für die Passwortanmeldung.
- `avatarUrl`: gespeicherte Selbst-Avatar-URL für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl an Ereignissen, die beim Startup-Sync abgerufen werden.
- `encryption`: aktiviert E2EE.
- `allowlistOnly`: wenn `true`, wird die offene Raumrichtlinie `open` auf `allowlist` hochgestuft und alle aktiven DM-Richtlinien außer `disabled` (einschließlich `pairing` und `open`) auf `allowlist` erzwungen. Hat keine Auswirkungen auf `disabled`-Richtlinien.
- `allowBots`: erlaubt Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumverkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnisübereinstimmungen werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `historyLimit`: maximale Anzahl an Raumnachrichten, die als Gruppenverlaufs-Kontext einbezogen werden. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- `replyToMode`: `off`, `first`, `all` oder `batched`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `"partial"`, `"quiet"`, `true` oder `false`. `"partial"` und `true` aktivieren Entwurfsaktualisierungen nach dem Prinzip „Vorschau zuerst“ mit normalen Matrix-Textnachrichten. `"quiet"` verwendet nicht benachrichtigende Vorschauhinweise für selbst gehostete Push-Regel-Setups. `false` entspricht `"off"`.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistant-Blöcke, während Entwurfs-Vorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: kanalbezogene Überschreibungen für sitzungsgebundenes Routing und den Lebenszyklus von Threads.
- `startupVerification`: Modus für automatische Selbstverifizierungsanfragen beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Abklingzeit, bevor automatische Selbstverifizierungsanfragen beim Start erneut versucht werden.
- `textChunkLimit`: Chunk-Größe für ausgehende Nachrichten in Zeichen (gilt, wenn `chunkMode` auf `length` gesetzt ist).
- `chunkMode`: `length` teilt Nachrichten nach Zeichenanzahl; `newline` teilt an Zeilengrenzen.
- `responsePrefix`: optionale Zeichenfolge, die allen ausgehenden Antworten für diesen Kanal vorangestellt wird.
- `ackReaction`: optionale Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: optionale Überschreibung des Geltungsbereichs der Bestätigungsreaktion (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Mediengrößenlimit in MB für ausgehende Sends und eingehende Medienverarbeitung.
- `autoJoin`: Richtlinie für automatischen Beitritt zu Einladungen (`always`, `allowlist`, `off`). Standard: `off`. Gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` auf `allowlist` steht. Alias-Einträge werden während der Einladungsverarbeitung zu Raum-IDs aufgelöst; OpenClaw vertraut nicht auf vom eingeladenen Raum behaupteten Alias-Status.
- `dm`: DM-Richtlinienblock (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: steuert den DM-Zugriff, nachdem OpenClaw dem Raum beigetreten ist und ihn als DM klassifiziert hat. Es ändert nicht, ob einer Einladung automatisch beigetreten wird.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Verkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnisübereinstimmungen werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `dm.sessionScope`: `per-user` (Standard) oder `per-room`. Verwenden Sie `per-room`, wenn jeder Matrix-DM-Raum getrennten Kontext behalten soll, auch wenn der Peer derselbe ist.
- `dm.threadReplies`: DM-spezifische Überschreibung der Thread-Richtlinie (`off`, `inbound`, `always`). Sie überschreibt die Einstellung `threadReplies` auf oberster Ebene sowohl für die Platzierung von Antworten als auch für die Sitzungsisolation in DMs.
- `execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die Genehmigenden bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte Überschreibungen pro Konto. Werte auf oberster Ebene in `channels.matrix` dienen als Standardwerte für diese Einträge.
- `groups`: Richtlinienzuordnung pro Raum. Bevorzugen Sie Raum-IDs oder Aliasse; nicht aufgelöste Raumnamen werden zur Laufzeit ignoriert. Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID.
- `groups.<room>.account`: beschränkt einen geerbten Raumeintrag in Multi-Account-Setups auf ein bestimmtes Matrix-Konto.
- `groups.<room>.allowBots`: Überschreibung auf Raumebene für Absender aus konfigurierten Bot-Konten (`true` oder `"mentions"`).
- `groups.<room>.users`: Allowlist für Absender pro Raum.
- `groups.<room>.tools`: Überschreibungen pro Raum für Erlauben/Ablehnen von Tools.
- `groups.<room>.autoReply`: Überschreibung auf Raumebene für Erwähnungs-Gating. `true` deaktiviert die Erwähnungsanforderungen für diesen Raum; `false` erzwingt sie wieder.
- `groups.<room>.skills`: optionaler Skill-Filter auf Raumebene.
- `groups.<room>.systemPrompt`: optionales System-Prompt-Snippet auf Raumebene.
- `rooms`: veralteter Alias für `groups`.
- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Erwähnungs-Gating
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung

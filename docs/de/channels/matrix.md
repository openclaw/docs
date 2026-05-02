---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Supportstatus, Einrichtung und Konfigurationsbeispiele für Matrix
title: Matrix
x-i18n:
    generated_at: "2026-05-02T20:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein herunterladbares Kanal-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Installieren

Installieren Sie Matrix, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/matrix
```

Aus einem lokalen Checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registriert und aktiviert das Plugin, daher ist kein separater Schritt `openclaw plugins enable matrix` erforderlich. Das Plugin tut weiterhin nichts, bis Sie den untenstehenden Kanal konfigurieren. Allgemeines Plugin-Verhalten und Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Einrichtung

1. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
2. Konfigurieren Sie `channels.matrix` entweder mit `homeserver` + `accessToken` oder mit `homeserver` + `userId` + `password`.
3. Starten Sie das Gateway neu.
4. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein (siehe [automatischer Beitritt](#auto-join) — neue Einladungen landen nur, wenn `autoJoin` sie zulässt).

### Interaktive Einrichtung

```bash
openclaw channels add
openclaw configure --section channels
```

Der Assistent fragt nach: Homeserver-URL, Authentifizierungsmethode (Zugriffstoken oder Passwort), Benutzer-ID (nur Passwortauthentifizierung), optionalem Gerätenamen, ob E2EE aktiviert werden soll und ob Raumzugriff und automatischer Beitritt konfiguriert werden sollen.

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

### Automatischer Beitritt

`channels.matrix.autoJoin` ist standardmäßig `off`. Mit der Standardeinstellung erscheint der Bot nicht in neuen Räumen oder DMs aus neuen Einladungen, bis Sie manuell beitreten.

OpenClaw kann zum Einladungszeitpunkt nicht erkennen, ob ein eingeladener Raum eine DM oder eine Gruppe ist, daher durchlaufen alle Einladungen — einschließlich DM-artiger Einladungen — zuerst `autoJoin`. `dm.policy` greift erst später, nachdem der Bot beigetreten ist und der Raum klassifiziert wurde.

<Warning>
Setzen Sie `autoJoin: "allowlist"` plus `autoJoinAllowlist`, um einzuschränken, welche Einladungen der Bot annimmt, oder `autoJoin: "always"`, um jede Einladung anzunehmen.

`autoJoinAllowlist` akzeptiert nur stabile Ziele: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt; Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den vom eingeladenen Raum behaupteten Status.
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

### Formate für Allowlist-Ziele

DM- und Raum-Allowlists werden am besten mit stabilen IDs befüllt:

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden nur aufgelöst, wenn das Homeserver-Verzeichnis genau eine Übereinstimmung zurückgibt.
- Räume (`groups`, `autoJoinAllowlist`): Verwenden Sie `!room:server` oder `#alias:server`. Namen werden bestmöglich gegen beigetretene Räume aufgelöst; nicht aufgelöste Einträge werden zur Laufzeit ignoriert.

### Normalisierung der Konto-ID

Der Assistent wandelt einen Anzeigenamen in eine normalisierte Konto-ID um. Beispielsweise wird `Ops Bot` zu `ops-bot`. Satzzeichen werden in bereichsbezogenen Umgebungsvariablennamen maskiert, damit zwei Konten nicht kollidieren können: `-` → `_X2D_`, also wird `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet.

### Zwischengespeicherte Zugangsdaten

Matrix speichert zwischengespeicherte Zugangsdaten unter `~/.openclaw/credentials/matrix/`:

- Standardkonto: `credentials.json`
- Benannte Konten: `credentials-<account>.json`

Wenn dort zwischengespeicherte Zugangsdaten vorhanden sind, behandelt OpenClaw Matrix als konfiguriert, selbst wenn das Zugriffstoken nicht in der Konfigurationsdatei steht — das deckt die Einrichtung, `openclaw doctor` und Kanalstatus-Prüfungen ab.

### Umgebungsvariablen

Werden verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; benannte Konten verwenden die vor dem Suffix eingefügte Konto-ID.

| Standardkonto         | Benanntes Konto (`<ID>` ist die normalisierte Konto-ID) |
| --------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                              |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                   |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                  |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                 |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                               |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                              |

Für das Konto `ops` werden die Namen zu `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` und so weiter. Die Umgebungsvariablen für den Wiederherstellungsschlüssel werden von wiederherstellungsbewussten CLI-Abläufen (`verify backup restore`, `verify device`, `verify bootstrap`) gelesen, wenn Sie den Schlüssel über `--recovery-key-stdin` per Pipe übergeben.

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

Um Live-Antwortvorschauen beizubehalten, aber temporäre Tool-/Fortschrittszeilen auszublenden, verwenden Sie die Objektform:

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

| `streaming`                 | Verhalten                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (Standardeinstellung) | Auf die vollständige Antwort warten, einmal senden. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                     |
| `"partial"`                 | Eine normale Textnachricht direkt bearbeiten, während das Modell den aktuellen Block schreibt. Standard-Matrix-Clients benachrichtigen möglicherweise bei der ersten Vorschau, nicht bei der finalen Bearbeitung. |
| `"quiet"`                   | Wie `"partial"`, aber die Nachricht ist ein nicht benachrichtigender Hinweis. Empfänger erhalten erst eine Benachrichtigung, wenn eine benutzerspezifische Push-Regel zur finalisierten Bearbeitung passt (siehe unten). |

`blockStreaming` ist unabhängig von `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (Standardeinstellung)          |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block, abgeschlossene Blöcke bleiben als Nachrichten erhalten | Live-Entwurf für den aktuellen Block, direkt finalisiert |
| `"off"`                 | Eine benachrichtigende Matrix-Nachricht pro abgeschlossenem Block   | Eine benachrichtigende Matrix-Nachricht für die vollständige Antwort |

Hinweise:

- Wenn eine Vorschau das Pro-Ereignis-Größenlimit von Matrix überschreitet, beendet OpenClaw das Vorschau-Streaming und fällt auf reine finale Auslieferung zurück.
- Medienantworten senden Anhänge immer normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie, bevor die finale Medienantwort gesendet wird.
- Tool-Fortschrittsvorschau-Aktualisierungen sind standardmäßig aktiviert, wenn Matrix-Vorschau-Streaming aktiv ist. Setzen Sie `streaming.preview.toolProgress: false`, um Vorschau-Bearbeitungen für Antworttext beizubehalten, aber Tool-Fortschritt auf dem normalen Auslieferungspfad zu lassen.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lassen Sie `streaming: "off"`, wenn Sie das konservativste Ratenlimit-Profil wünschen.

## Genehmigungsmetadaten

Native Matrix-Genehmigungsaufforderungen sind normale `m.room.message`-Ereignisse mit OpenClaw-spezifischem benutzerdefiniertem Ereignisinhalt unter `com.openclaw.approval`. Matrix erlaubt benutzerdefinierte Ereignisinhaltsschlüssel, sodass Standard-Clients weiterhin den Textkörper anzeigen, während OpenClaw-fähige Clients die strukturierte Genehmigungs-ID, Art, Status, verfügbaren Entscheidungen sowie Ausführungs-/Plugin-Details lesen können.

Wenn eine Genehmigungsaufforderung zu lang für ein Matrix-Ereignis ist, teilt OpenClaw den sichtbaren Text in Abschnitte auf und hängt `com.openclaw.approval` nur an den ersten Abschnitt an. Reaktionen für Zulassen-/Ablehnen-Entscheidungen sind an dieses erste Ereignis gebunden, sodass lange Aufforderungen dasselbe Genehmigungsziel wie Einzelereignis-Aufforderungen behalten.

### Selbst gehostete Push-Regeln für stille finalisierte Vorschauen

`streaming: "quiet"` benachrichtigt Empfänger erst, wenn ein Block oder Turn finalisiert ist — eine benutzerspezifische Push-Regel muss auf die finalisierte Vorschau-Markierung passen. Das vollständige Rezept (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver) finden Sie unter [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie absichtlich Matrix-Verkehr zwischen Agenten möchten:

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
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwort-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „bot-verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strenge Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsamen Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnose), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Mehrkonten-Einrichtungen). Die Ausgabe ist standardmäßig knapp und verwendet stille interne SDK-Protokollierung. Die Beispiele unten zeigen die kanonische Form; fügen Sie die Flags nach Bedarf hinzu.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
```

Initialisiert Secret Storage und Cross-Signing, erstellt bei Bedarf ein Raumschlüssel-Backup und gibt dann Status und nächste Schritte aus. Nützliche Flags:

- `--recovery-key <key>` wendet vor der Initialisierung einen Recovery Key an (bevorzugen Sie die unten dokumentierte stdin-Form)
- `--force-reset-cross-signing` verwirft die aktuelle Cross-Signing-Identität und erstellt eine neue (nur bewusst verwenden)

Aktivieren Sie für ein neues Konto E2EE bei der Erstellung:

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

### Status- und Vertrauenssignale

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` meldet drei unabhängige Vertrauenssignale (`--verbose` zeigt alle an):

- `Locally trusted`: nur von diesem Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: das SDK meldet eine Verifizierung per Cross-Signing
- `Signed by owner`: mit Ihrem eigenen Self-Signing-Key signiert (nur Diagnose)

`Verified by owner` wird nur dann zu `yes`, wenn `Cross-signing verified` `yes` ist. Lokales Vertrauen oder eine Owner-Signatur allein reicht nicht aus.

`--allow-degraded-local-state` gibt Best-Effort-Diagnosen zurück, ohne das Matrix-Konto zuerst vorzubereiten; nützlich für Offline- oder teilweise konfigurierte Prüfungen.

### Dieses Gerät mit einem Recovery Key verifizieren

Der Recovery Key ist sensibel — leiten Sie ihn per stdin weiter, statt ihn auf der Befehlszeile zu übergeben. Setzen Sie `MATRIX_RECOVERY_KEY` (oder `MATRIX_<ID>_RECOVERY_KEY` für ein benanntes Konto):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für Secret Storage oder Gerätevertrauen akzeptiert.
- `Backup usable`: Das Raumschlüssel-Backup kann mit dem vertrauenswürdigen Recovery-Material geladen werden.
- `Device verified by owner`: Dieses Gerät hat volles Vertrauen der Matrix-Cross-Signing-Identität.

Der Befehl wird mit einem Nicht-Null-Code beendet, wenn das volle Identitätsvertrauen unvollständig ist, selbst wenn der Recovery Key Backup-Material entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung von einem anderen Matrix-Client ab:

```bash
openclaw matrix verify self
```

`verify self` wartet auf `Cross-signing verified: yes`, bevor es erfolgreich beendet wird. Verwenden Sie `--timeout-ms <ms>`, um die Wartezeit anzupassen.

Die Literal-Key-Form `openclaw matrix verify device "<recovery-key>"` wird ebenfalls akzeptiert, aber der Schlüssel landet in Ihrer Shell-Historie.

### Cross-Signing initialisieren oder reparieren

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Konten. Der Reihe nach führt er Folgendes aus:

- Secret Storage initialisieren und nach Möglichkeit einen vorhandenen Recovery Key wiederverwenden
- Cross-Signing initialisieren und fehlende öffentliche Schlüssel hochladen
- das aktuelle Gerät markieren und per Cross-Signing signieren
- ein serverseitiges Raumschlüssel-Backup erstellen, falls noch keines vorhanden ist

Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln erfordert, versucht OpenClaw zuerst ohne Authentifizierung, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (kombinieren mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) oder `--recovery-key <key>`
- `--force-reset-cross-signing`, um die aktuelle Cross-Signing-Identität zu verwerfen (nur bewusst)

### Raumschlüssel-Backup

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt, ob ein serverseitiges Backup existiert und ob dieses Gerät es entschlüsseln kann. `backup restore` importiert gesicherte Raumschlüssel in den lokalen Crypto Store; wenn der Recovery Key bereits auf dem Datenträger liegt, können Sie `--recovery-key-stdin` weglassen.

So ersetzen Sie ein defektes Backup durch eine frische Baseline (akzeptiert den Verlust nicht wiederherstellbarer alter Historie; kann Secret Storage auch neu erstellen, wenn das aktuelle Backup-Secret nicht ladbar ist):

```bash
openclaw matrix verify backup reset --yes
```

Fügen Sie `--rotate-recovery-key` nur hinzu, wenn Sie bewusst möchten, dass der vorherige Recovery Key die frische Backup-Baseline nicht mehr entsperrt.

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

Für Low-Level-Lebenszyklusbehandlung — typischerweise während Sie eingehende Anfragen von einem anderen Client begleiten — wirken diese Befehle auf eine bestimmte Anfrage `<id>` (ausgegeben von `verify list` und `verify request`):

| Befehl                                    | Zweck                                                               |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Eine eingehende Anfrage akzeptieren                                 |
| `openclaw matrix verify start <id>`        | Den SAS-Ablauf starten                                              |
| `openclaw matrix verify sas <id>`          | Die SAS-Emoji oder Dezimalzahlen ausgeben                           |
| `openclaw matrix verify confirm-sas <id>`  | Bestätigen, dass die SAS mit der Anzeige des anderen Clients übereinstimmt |
| `openclaw matrix verify mismatch-sas <id>` | Die SAS ablehnen, wenn Emoji oder Dezimalzahlen nicht übereinstimmen |
| `openclaw matrix verify cancel <id>`       | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als DM-Follow-up-Hinweise, wenn die Verifizierung an einen bestimmten Direktnachrichtenraum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Wenn Sie mehrere benannte Konten haben und `channels.matrix.defaultAccount` nicht gesetzt ist, raten sie nicht und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startverhalten">
    Mit `encryption: true` ist der Standardwert von `startupVerification` `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät die Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abklingzeit an (standardmäßig 24 Stunden). Passen Sie dies mit `startupVerificationCooldownHours` an oder deaktivieren Sie es mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt, der den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Zustand defekt ist, versucht OpenClaw eine abgesicherte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA erfordert, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Owner signierte Geräte bleiben erhalten.

    Siehe [Matrix-Migration](/de/channels/matrix-migration) für den vollständigen Upgrade-Ablauf.

  </Accordion>

  <Accordion title="Verifizierungshinweise">
    Matrix sendet Hinweise zum Verifizierungslebenszyklus als `m.notice`-Nachrichten in den strikten DM-Verifizierungsraum: Anfrage, Bereit (mit Anleitung „Per Emoji verifizieren“), Start/Abschluss und SAS-Details (Emoji/Dezimalzahlen), sofern verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Für die Selbstverifizierung startet OpenClaw den SAS-Ablauf automatisch und bestätigt die eigene Seite, sobald Emoji-Verifizierung verfügbar ist — Sie müssen trotzdem in Ihrem Matrix-Client vergleichen und „They match“ bestätigen.

    Verifizierungssystemhinweise werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Gelöschtes oder ungültiges Matrix-Gerät">
    Wenn `verify status` meldet, dass das aktuelle Gerät nicht mehr auf dem Homeserver aufgeführt ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für Passwortanmeldung:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Für Token-Authentifizierung erstellen Sie in Ihrem Matrix-Client oder der Admin-UI ein frisches Zugriffstoken und aktualisieren dann OpenClaw:

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

  <Accordion title="Crypto Store">
    Matrix E2EE verwendet den offiziellen Rust-Crypto-Pfad von `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Crypto-Zustand bleibt in `crypto-idb-snapshot.json` erhalten (restriktive Dateiberechtigungen).

    Verschlüsselter Laufzeitzustand liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und enthält den Sync Store, Crypto Store, Recovery Key, IDB-Snapshot, Thread-Bindings und den Startverifizierungszustand. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw den besten vorhandenen Root wieder, sodass vorheriger Zustand sichtbar bleibt.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Sie können beide Optionen in einem Aufruf übergeben. Matrix akzeptiert `mxc://`-Avatar-URLs direkt; wenn Sie `http://` oder `https://` übergeben, lädt OpenClaw die Datei zuerst hoch und speichert die aufgelöste `mxc://`-URL in `channels.matrix.avatarUrl` (oder im kontoabhängigen Override).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sendevorgänge des Message-Tools. Zwei unabhängige Regler steuern das Verhalten:

### Sitzungsrouting (`sessionScope`)

`dm.sessionScope` entscheidet, wie Matrix-DM-Räume OpenClaw-Sitzungen zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Peer teilen sich eine Sitzung.
- `"per-room"`: Jeder Matrix-DM-Raum erhält seinen eigenen Sitzungsschlüssel, auch wenn der Peer derselbe ist.

Explizite Konversations-Bindings haben immer Vorrang vor `sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung behalten.

### Antwort-Threading (`threadReplies`)

`threadReplies` entscheidet, wo der Bot seine Antwort postet:

- `"off"`: Antworten sind Top-Level. Eingehende Thread-Nachrichten bleiben auf der übergeordneten Sitzung.
- `"inbound"`: Nur dann innerhalb eines Threads antworten, wenn die eingehende Nachricht bereits in diesem Thread war.
- `"always"`: Innerhalb eines Threads antworten, der bei der auslösenden Nachricht verwurzelt ist; diese Konversation wird ab dem ersten Auslöser über eine passende threadbezogene Sitzung geroutet.

`dm.threadReplies` überschreibt dies nur für DMs — zum Beispiel, um Raum-Threads isoliert zu halten, während DMs flach bleiben.

### Thread-Vererbung und Slash-Befehle

- Eingehende Thread-Nachrichten enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Sends über das Message-Tool übernehmen automatisch den aktuellen Matrix-Thread, wenn sie denselben Raum (oder dasselbe DM-Benutzerziel) adressieren, sofern keine explizite `threadId` angegeben ist.
- Die Wiederverwendung von DM-Benutzerzielen greift nur, wenn die aktuellen Sitzungsmetadaten denselben DM-Peer auf demselben Matrix-Konto belegen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und Thread-gebundenes `/acp spawn` funktionieren alle in Matrix-Räumen und DMs.
- Top-Level-`/focus` erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSessions` aktiviert ist.
- Das Ausführen von `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads bindet diesen Thread an Ort und Stelle.

Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum auf derselben gemeinsamen Sitzung kollidiert, postet es einmalig ein `m.notice` in diesem Raum, das auf den `/focus`-Ausweg verweist und eine Änderung von `dm.sessionScope` vorschlägt. Der Hinweis erscheint nur, wenn Thread-Bindungen aktiviert sind.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` in der Matrix-DM, dem Raum oder dem bestehenden Thread aus, den Sie weiter verwenden möchten.
- In einer Top-Level-Matrix-DM oder einem Top-Level-Matrix-Raum bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geroutet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnSessions` steuert `/acp spawn --thread auto|here`, wobei OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Konfiguration der Thread-Bindung

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix-Thread-gebundene Sitzungsspawns sind standardmäßig aktiviert:

- Setzen Sie `threadBindings.spawnSessions: false`, um zu verhindern, dass Top-Level-`/focus` und `/acp spawn --thread auto|here` Matrix-Threads erstellen oder binden.
- Setzen Sie `threadBindings.defaultSpawnContext: "isolated"`, wenn native Subagent-Thread-Spawns das übergeordnete Transkript nicht forken sollen.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, eingehende Reaktionsbenachrichtigungen und Bestätigungsreaktionen.

Ausgehendes Reaktions-Tooling wird durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bots.

**Auflösungsreihenfolge** (der erste definierte Wert gewinnt):

| Einstellung             | Reihenfolge                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | pro Konto → Kanal → `messages.ackReaction` → Fallback auf Emoji der Agent-Identität |
| `ackReactionScope`      | pro Konto → Kanal → `messages.ackReactionScope` → Standard `"group-mentions"`    |
| `reactionNotifications` | pro Konto → Kanal → Standard `"own"`                                             |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf von Bots verfasste Matrix-Nachrichten zielen; `"off"` deaktiviert Reaktions-Systemereignisse. Reaktionsentfernungen werden nicht zu Systemereignissen synthetisiert, weil Matrix sie als Redactions bereitstellt, nicht als eigenständige `m.reaction`-Entfernungen.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele kürzliche Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin normalen Sitzungsverlauf.
- Matrix-Raumverlauf ist nur pending: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle auslösende Nachricht wird nicht in `InboundHistory` einbezogen; sie bleibt für diesen Turn im Hauptteil der eingehenden Nachricht.
- Wiederholungen desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufssnapshot erneut, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame `contextVisibility`-Steuerung für zusätzlichen Raumkontext wie abgerufenen Antworttext, Thread-Roots und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Zusätzlicher Kontext wird unverändert beibehalten.
- `contextVisibility: "allowlist"` filtert zusätzlichen Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber weiterhin eine explizit zitierte Antwort bei.

Diese Einstellung wirkt sich auf die Sichtbarkeit von zusätzlichem Kontext aus, nicht darauf, ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Trigger-Autorisierung kommt weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und DM-Richtlinieneinstellungen.

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

Siehe [Gruppen](/de/channels/groups) für Mention-Gating und Allowlist-Verhalten.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn Ihnen ein nicht genehmigter Matrix-Benutzer vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code wieder und kann nach einem kurzen Cooldown eine Erinnerungsantwort senden, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Direct-Message-Zustand nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen haben, die auf alte Solo-Räume statt auf die aktuelle DM zeigen. Prüfen Sie die aktuelle Zuordnung für einen Peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Beide Befehle akzeptieren `--account <id>` für Setups mit mehreren Konten. Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt auf jede derzeit beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine intakte DM existiert

Alte Räume werden nicht automatisch gelöscht. Der intakte DM-Raum wird ausgewählt und die Zuordnung aktualisiert, sodass zukünftige Matrix-Sends, Verifizierungshinweise und andere Direct-Message-Abläufe den richtigen Raum adressieren.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungsclient agieren. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder `channels.matrix.accounts.<account>.execApprovals` für eine kontoabhängige Überschreibung):

- `enabled`: liefert Genehmigungen über Matrix-native Prompts. Wenn nicht gesetzt oder `"auto"`, aktiviert sich Matrix automatisch, sobald mindestens ein Genehmigender aufgelöst werden kann. Setzen Sie `false`, um dies explizit zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Exec-Anfragen genehmigen dürfen. Optional — fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: wohin Prompts gehen. `"dm"` (Standard) sendet an DMs der Genehmigenden; `"channel"` sendet an den ursprünglichen Matrix-Raum oder die ursprüngliche DM; `"both"` sendet an beide.
- `agentFilter` / `sessionFilter`: optionale Allowlists dafür, welche Agents/Sitzungen die Matrix-Zustellung auslösen.

Die Autorisierung unterscheidet sich leicht je nach Genehmigungstyp:

- **Exec-Genehmigungen** verwenden `execApprovals.approvers` und fallen auf `dm.allowFrom` zurück.
- **Plugin-Genehmigungen** autorisieren nur über `dm.allowFrom`.

Beide Typen teilen Matrix-Reaktionskürzel und Nachrichtenaktualisierungen. Genehmigende sehen Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` einmal erlauben
- `❌` ablehnen
- `♾️` immer erlauben (wenn die effektive Exec-Richtlinie dies zulässt)

Fallback-Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Kanalzustellung für Exec-Genehmigungen enthält den Befehlstext — aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandt: [Exec-Genehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in DMs. In Räumen erkennt OpenClaw auch Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad ohne benutzerdefinierte Erwähnungsregex auslöst. So bleibt der Bot für raumartige `@mention /command`-Beiträge reaktionsfähig, die Element und ähnliche Clients erzeugen, wenn ein Benutzer den Bot per Tab-Vervollständigung einfügt, bevor er den Befehl eintippt.

Autorisierungsregeln gelten weiterhin: Befehlsabsender müssen dieselben DM- oder Raum-Allowlist-/Owner-Richtlinien erfüllen wie normale Nachrichten.

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

**Vererbung:**

- Top-Level-Werte von `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
- Beschränken Sie einen geerbten Raumeintrag mit `groups.<room>.account` auf ein bestimmtes Konto. Einträge ohne `account` werden über Konten hinweg geteilt; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf Top-Level konfiguriert ist.

**Auswahl des Standardkontos:**

- Setzen Sie `defaultAccount`, um das benannte Konto auszuwählen, das implizites Routing, Probing und CLI-Befehle bevorzugen.
- Wenn Sie mehrere Konten haben und eines buchstäblich `default` heißt, verwendet OpenClaw es implizit, auch wenn `defaultAccount` nicht gesetzt ist.
- Wenn Sie mehrere benannte Konten haben und kein Standardkonto ausgewählt ist, verweigern CLI-Befehle das Raten — setzen Sie `defaultAccount` oder übergeben Sie `--account <id>`.
- Der Top-Level-Block `channels.matrix.*` wird nur als implizites `default`-Konto behandelt, wenn seine Authentifizierung vollständig ist (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben ab `homeserver` + `userId` auffindbar, sobald zwischengespeicherte Anmeldedaten die Authentifizierung abdecken.

**Promotion:**

- Wenn OpenClaw eine Single-Account-Konfiguration während einer Reparatur oder Einrichtung zu Multi-Account hochstuft, bleibt das vorhandene benannte Konto erhalten, falls eines existiert oder `defaultAccount` bereits auf eines zeigt. Nur Matrix-Authentifizierungs-/Bootstrap-Schlüssel werden in das hochgestufte Konto verschoben; gemeinsame Zustellungsrichtlinien-Schlüssel bleiben auf Top-Level.

Siehe [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Multi-Account-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum SSRF-Schutz, sofern Sie
dies nicht explizit pro Konto aktivieren.

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

Benannte Konten können die übergeordnete Standardeinstellung mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Datenverkehr zur Laufzeit und Kontostatusprüfungen.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliase: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Bei Matrix-Raum-IDs wird die Groß-/Kleinschreibung beachtet. Verwenden Sie die exakte Schreibweise der Raum-ID aus Matrix,
wenn Sie explizite Zustellungsziele, Cron-Aufträge, Bindings oder Allowlists konfigurieren.
OpenClaw hält interne Sitzungsschlüssel für die Speicherung kanonisch, daher sind diese kleingeschriebenen
Schlüssel keine zuverlässige Quelle für Matrix-Zustellungs-IDs.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliase direkt und fallen dann auf die Suche in den Namen beigetretener Räume für dieses Konto zurück.
- Die Namenssuche in beigetretenen Räumen erfolgt nach bestem Aufwand. Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er bei der Allowlist-Auflösung zur Laufzeit ignoriert.

## Konfigurationsreferenz

Allowlist-artige Felder (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs (am sichersten). Exakte Verzeichnisübereinstimmungen werden beim Start und immer dann aufgelöst, wenn sich die Allowlist ändert, während der Monitor läuft; Einträge, die nicht aufgelöst werden können, werden zur Laufzeit ignoriert. Raum-Allowlists bevorzugen aus demselben Grund Raum-IDs oder Aliase.

### Konto und Verbindung

- `enabled`: den Kanal aktivieren oder deaktivieren.
- `name`: optionale Anzeigebezeichnung für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: benannte Überschreibungen pro Konto. Übergeordnete Werte von `channels.matrix` werden als Standardwerte vererbt.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Konto erlauben, sich mit `localhost`, LAN-/Tailscale-IPs oder internen Hostnamen zu verbinden.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Überschreibung pro Konto wird unterstützt.
- `userId`: vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartext- und SecretRef-Werte werden über env/file/exec-Provider hinweg unterstützt ([Geheimnisverwaltung](/de/gateway/secrets)).
- `password`: Passwort für passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Gerätename, der bei der Passwortanmeldung angezeigt wird.
- `avatarUrl`: gespeicherte URL des eigenen Avatars für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl von Ereignissen, die während der Startsynchronisierung abgerufen werden.

### Verschlüsselung

- `encryption`: E2EE aktivieren. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard, wenn E2EE aktiviert ist) oder `"off"`. Fordert beim Start automatisch eine Selbstverifizierung an, wenn dieses Gerät nicht verifiziert ist.
- `startupVerificationCooldownHours`: Wartezeit vor der nächsten automatischen Startanforderung. Standard: `24`.

### Zugriff und Richtlinie

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumdatenverkehr.
- `dm.enabled`: wenn `false`, alle DMs ignorieren. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Wird angewendet, nachdem der Bot beigetreten ist und den Raum als DM klassifiziert hat; dies wirkt sich nicht auf die Behandlung von Einladungen aus.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Datenverkehr.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: Nur-DM-Überschreibung für Antwort-Threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: Nachrichten von anderen konfigurierten Matrix-Bot-Konten akzeptieren (`true` oder `"mentions"`).
- `allowlistOnly`: wenn `true`, erzwingt für alle aktiven DM-Richtlinien (außer `"disabled"`) und `"open"`-Gruppenrichtlinien `"allowlist"`. Ändert keine `"disabled"`-Richtlinien.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliase, die erlaubt sind, wenn `autoJoin` `"allowlist"` ist. Alias-Einträge werden gegen den Homeserver aufgelöst, nicht gegen den vom eingeladenen Raum beanspruchten Status.
- `contextVisibility`: ergänzende Kontextsichtbarkeit (`"all"` als Standard, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"`, `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` oder `"always"`.
- `threadBindings`: kanalbezogene Überschreibungen für sitzungsgebundenes Routing und Lebenszyklus bei Threads.
- `streaming`: `"off"` (Standard), `"partial"`, `"quiet"` oder Objektform `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wenn `true`, werden abgeschlossene Assistentenblöcke als separate Fortschrittsnachrichten beibehalten.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: ausgehende Chunk-Größe in Zeichen, wenn `chunkMode: "length"`. Standard: `4000`.
- `chunkMode`: `"length"` (Standard, teilt nach Zeichenzahl) oder `"newline"` (teilt an Zeilengrenzen).
- `historyLimit`: Anzahl aktueller Raumnachrichten, die als `InboundHistory` eingeschlossen werden, wenn eine Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standard `0` (deaktiviert).
- `mediaMaxMb`: Mediengrößenlimit in MB für ausgehende Sendungen und eingehende Verarbeitung.

### Reaktionseinstellungen

- `ackReaction`: Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: Bereichsüberschreibung (`"group-mentions"` als Standard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (`"own"` als Standard, `"off"`).

### Tooling und Überschreibungen pro Raum

- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: Richtlinienzuordnung pro Raum. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein Legacy-Alias.)
  - `groups.<room>.account`: einen vererbten Raumeintrag auf ein bestimmtes Konto beschränken.
  - `groups.<room>.allowBots`: Überschreibung der kanalweiten Einstellung pro Raum (`true` oder `"mentions"`).
  - `groups.<room>.users`: Sender-Allowlist pro Raum.
  - `groups.<room>.tools`: Überschreibungen für Tool-Zulassen/-Verweigern pro Raum.
  - `groups.<room>.autoReply`: Überschreibung des Mention-Gatings pro Raum. `true` deaktiviert Mention-Anforderungen für diesen Raum; `false` erzwingt sie wieder.
  - `groups.<room>.skills`: Skill-Filter pro Raum.
  - `groups.<room>.systemPrompt`: System-Prompt-Ausschnitt pro Raum.

### Einstellungen für Exec-Genehmigungen

- `execApprovals.enabled`: Exec-Genehmigungen über Matrix-native Prompts zustellen.
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die genehmigen dürfen. Fällt auf `dm.allowFrom` zurück.
- `execApprovals.target`: `"dm"` (Standard), `"channel"` oder `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionale Agent-/Sitzungs-Allowlists für die Zustellung.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung

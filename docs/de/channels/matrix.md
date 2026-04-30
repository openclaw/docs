---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Supportstatus, Einrichtung und Konfigurationsbeispiele für Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-30T06:40:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix ist ein mitgeliefertes Kanal-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Mitgeliefertes Plugin

Aktuelle paketierte OpenClaw-Releases liefern das Matrix-Plugin standardmäßig mit. Sie müssen nichts installieren; das Konfigurieren von `channels.matrix.*` (siehe [Einrichtung](#setup)) aktiviert es.

Installieren Sie für ältere Builds oder benutzerdefinierte Installationen, die Matrix ausschließen, ein aktuelles npm-Paket, sobald eines veröffentlicht ist:

```bash
openclaw plugins install @openclaw/matrix
```

Wenn npm das OpenClaw-eigene Paket als veraltet meldet, verwenden Sie einen aktuellen paketierten OpenClaw-Build oder einen lokalen Checkout, bis ein neueres npm-Paket veröffentlicht ist.

Aus einem lokalen Checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registriert und aktiviert das Plugin, daher ist kein separater Schritt `openclaw plugins enable matrix` erforderlich. Das Plugin tut weiterhin nichts, bis Sie den Kanal unten konfigurieren. Allgemeines Plugin-Verhalten und Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

## Einrichtung

1. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
2. Konfigurieren Sie `channels.matrix` entweder mit `homeserver` + `accessToken` oder mit `homeserver` + `userId` + `password`.
3. Starten Sie den Gateway neu.
4. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein (siehe [automatischer Beitritt](#auto-join) — neue Einladungen landen nur, wenn `autoJoin` sie erlaubt).

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

`channels.matrix.autoJoin` ist standardmäßig `off`. Mit der Standardeinstellung erscheint der Bot nicht in neuen Räumen oder DMs aus neuen Einladungen, bis Sie manuell beitreten.

OpenClaw kann zum Einladungszeitpunkt nicht erkennen, ob ein eingeladener Raum eine DM oder eine Gruppe ist; daher laufen alle Einladungen — einschließlich DM-artiger Einladungen — zuerst durch `autoJoin`. `dm.policy` greift erst später, nachdem der Bot beigetreten ist und der Raum klassifiziert wurde.

<Warning>
Setzen Sie `autoJoin: "allowlist"` plus `autoJoinAllowlist`, um einzuschränken, welche Einladungen der Bot akzeptiert, oder `autoJoin: "always"`, um jede Einladung zu akzeptieren.

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

Um jede Einladung zu akzeptieren, verwenden Sie `autoJoin: "always"`.

### Allowlist-Zielformate

DM- und Raum-Allowlists werden am besten mit stabilen IDs befüllt:

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): Verwenden Sie `@user:server`. Anzeigenamen werden nur aufgelöst, wenn das Homeserver-Verzeichnis genau einen Treffer zurückgibt.
- Räume (`groups`, `autoJoinAllowlist`): Verwenden Sie `!room:server` oder `#alias:server`. Namen werden nach bestem Bemühen gegen beigetretene Räume aufgelöst; nicht aufgelöste Einträge werden zur Laufzeit ignoriert.

### Konten-ID-Normalisierung

Der Assistent wandelt einen freundlichen Namen in eine normalisierte Konten-ID um. Zum Beispiel wird aus `Ops Bot` `ops-bot`. Satzzeichen werden in bereichsbezogenen Umgebungsvariablennamen maskiert, sodass zwei Konten nicht kollidieren können: `-` → `_X2D_`, daher wird `ops-prod` zu `MATRIX_OPS_X2D_PROD_*`.

### Zwischengespeicherte Zugangsdaten

Matrix speichert zwischengespeicherte Zugangsdaten unter `~/.openclaw/credentials/matrix/`:

- Standardkonto: `credentials.json`
- Benannte Konten: `credentials-<account>.json`

Wenn dort zwischengespeicherte Zugangsdaten vorhanden sind, behandelt OpenClaw Matrix als konfiguriert, selbst wenn das Zugriffstoken nicht in der Konfigurationsdatei steht — das umfasst Einrichtung, `openclaw doctor` und Kanalstatus-Probes.

### Umgebungsvariablen

Werden verwendet, wenn der entsprechende Konfigurationsschlüssel nicht gesetzt ist. Das Standardkonto verwendet Namen ohne Präfix; benannte Konten verwenden die vor dem Suffix eingefügte Konten-ID.

| Standardkonto        | Benanntes Konto (`<ID>` ist die normalisierte Konten-ID) |
| -------------------- | -------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Für das Konto `ops` werden die Namen zu `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` und so weiter. Die Recovery-Key-Umgebungsvariablen werden von recovery-fähigen CLI-Flows (`verify backup restore`, `verify device`, `verify bootstrap`) gelesen, wenn Sie den Schlüssel per `--recovery-key-stdin` übergeben.

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

Matrix-Antwort-Streaming ist Opt-in. `streaming` steuert, wie OpenClaw die laufende Assistentenantwort ausliefert; `blockStreaming` steuert, ob jeder abgeschlossene Block als eigene Matrix-Nachricht erhalten bleibt.

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

| `streaming`        | Verhalten                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (Standard) | Auf die vollständige Antwort warten, einmal senden. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                       |
| `"partial"`        | Eine normale Textnachricht direkt bearbeiten, während das Modell den aktuellen Block schreibt. Standard-Matrix-Clients benachrichtigen möglicherweise bei der ersten Vorschau, nicht bei der finalen Bearbeitung. |
| `"quiet"`          | Wie `"partial"`, aber die Nachricht ist ein nicht benachrichtigender Hinweis. Empfänger erhalten erst eine Benachrichtigung, wenn eine benutzerspezifische Push-Regel zur finalisierten Bearbeitung passt (siehe unten). |

`blockStreaming` ist unabhängig von `streaming`:

| `streaming`             | `blockStreaming: true`                                           | `blockStreaming: false` (Standard)                         |
| ----------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `"partial"` / `"quiet"` | Live-Entwurf für den aktuellen Block, abgeschlossene Blöcke bleiben als Nachrichten erhalten | Live-Entwurf für den aktuellen Block, direkt finalisiert |
| `"off"`                 | Eine benachrichtigende Matrix-Nachricht pro abgeschlossenem Block | Eine benachrichtigende Matrix-Nachricht für die vollständige Antwort |

Hinweise:

- Wenn eine Vorschau über das Matrix-Größenlimit pro Ereignis hinauswächst, stoppt OpenClaw das Vorschau-Streaming und fällt auf reine Finalauslieferung zurück.
- Medienantworten senden Anhänge immer normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie, bevor die finale Medienantwort gesendet wird.
- Vorschauaktualisierungen für Tool-Fortschritt sind standardmäßig aktiviert, wenn Matrix-Vorschau-Streaming aktiv ist. Setzen Sie `streaming.preview.toolProgress: false`, um Vorschau-Bearbeitungen für Antworttext beizubehalten, Tool-Fortschritt aber auf dem normalen Auslieferungspfad zu belassen.
- Vorschau-Bearbeitungen kosten zusätzliche Matrix-API-Aufrufe. Belassen Sie `streaming: "off"`, wenn Sie das konservativste Rate-Limit-Profil möchten.

## Genehmigungsmetadaten

Native Matrix-Genehmigungsaufforderungen sind normale `m.room.message`-Ereignisse mit OpenClaw-spezifischem benutzerdefiniertem Ereignisinhalt unter `com.openclaw.approval`. Matrix erlaubt benutzerdefinierte Ereignisinhalts-Schlüssel, daher rendern Standard-Clients weiterhin den Textkörper, während OpenClaw-fähige Clients die strukturierte Genehmigungs-ID, Art, Status, verfügbaren Entscheidungen sowie Exec-/Plugin-Details lesen können.

Wenn eine Genehmigungsaufforderung zu lang für ein einzelnes Matrix-Ereignis ist, teilt OpenClaw den sichtbaren Text in Chunks auf und hängt `com.openclaw.approval` nur an den ersten Chunk an. Reaktionen für Zulassen-/Ablehnen-Entscheidungen sind an dieses erste Ereignis gebunden, sodass lange Aufforderungen dasselbe Genehmigungsziel wie Einzelereignis-Aufforderungen behalten.

### Selbst gehostete Push-Regeln für stille finalisierte Vorschauen

`streaming: "quiet"` benachrichtigt Empfänger erst, wenn ein Block oder Turn finalisiert ist — eine benutzerspezifische Push-Regel muss zur finalisierten Vorschau-Markierung passen. Das vollständige Rezept (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver) finden Sie unter [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie Inter-Agent-Matrix-Verkehr bewusst zulassen möchten:

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
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von einem Bot verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE) Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, damit Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

Alle `openclaw matrix`-Befehle akzeptieren `--verbose` (vollständige Diagnose), `--json` (maschinenlesbare Ausgabe) und `--account <id>` (Setups mit mehreren Konten). Die Ausgabe ist standardmäßig knapp, mit leisem internem SDK-Logging. Die folgenden Beispiele zeigen die kanonische Form; fügen Sie die Flags nach Bedarf hinzu.

### Verschlüsselung aktivieren

```bash
openclaw matrix encryption setup
```

Initialisiert Secret Storage und Cross-Signing, erstellt bei Bedarf ein Room-Key-Backup und gibt anschließend Status und nächste Schritte aus. Nützliche Flags:

- `--recovery-key <key>` Recovery Key vor der Initialisierung anwenden (bevorzugen Sie die unten dokumentierte stdin-Form)
- `--force-reset-cross-signing` aktuelle Cross-Signing-Identität verwerfen und eine neue erstellen (nur bewusst verwenden)

Für ein neues Konto aktivieren Sie E2EE bei der Erstellung:

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

- `Locally trusted`: nur von diesem Client vertraut
- `Cross-signing verified`: das SDK meldet Verifizierung per Cross-Signing
- `Signed by owner`: mit Ihrem eigenen Self-Signing-Schlüssel signiert (nur Diagnose)

`Verified by owner` wird nur dann `yes`, wenn `Cross-signing verified` `yes` ist. Lokales Vertrauen oder eine Owner-Signatur allein reicht nicht aus.

`--allow-degraded-local-state` gibt Best-Effort-Diagnosen zurück, ohne das Matrix-Konto zuerst vorzubereiten; nützlich für Offline- oder teilweise konfigurierte Prüfungen.

### Dieses Gerät mit einem Recovery Key verifizieren

Der Recovery Key ist sensibel — leiten Sie ihn über stdin weiter, statt ihn in der Befehlszeile zu übergeben. Setzen Sie `MATRIX_RECOVERY_KEY` (oder `MATRIX_<ID>_RECOVERY_KEY` für ein benanntes Konto):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Der Befehl meldet drei Zustände:

- `Recovery key accepted`: Matrix hat den Schlüssel für Secret Storage oder Gerätevertrauen akzeptiert.
- `Backup usable`: Room-Key-Backup kann mit dem vertrauenswürdigen Recovery-Material geladen werden.
- `Device verified by owner`: dieses Gerät hat vollständiges Vertrauen in die Matrix-Cross-Signing-Identität.

Er beendet sich mit einem Nicht-Null-Code, wenn das vollständige Identitätsvertrauen unvollständig ist, selbst wenn der Recovery Key Backup-Material entsperrt hat. Schließen Sie in diesem Fall die Selbstverifizierung in einem anderen Matrix-Client ab:

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

- initialisiert Secret Storage und verwendet nach Möglichkeit einen vorhandenen Recovery Key wieder
- initialisiert Cross-Signing und lädt fehlende öffentliche Schlüssel hoch
- markiert und signiert das aktuelle Gerät per Cross-Signing
- erstellt ein serverseitiges Room-Key-Backup, falls noch keines existiert

Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln verlangt, versucht OpenClaw zuerst ohne Authentifizierung, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`).

Nützliche Flags:

- `--recovery-key-stdin` (kombinieren mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) oder `--recovery-key <key>`
- `--force-reset-cross-signing`, um die aktuelle Cross-Signing-Identität zu verwerfen (nur bewusst)

### Room-Key-Backup

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` zeigt, ob ein serverseitiges Backup existiert und ob dieses Gerät es entschlüsseln kann. `backup restore` importiert gesicherte Room Keys in den lokalen Crypto Store; wenn der Recovery Key bereits auf der Festplatte liegt, können Sie `--recovery-key-stdin` weglassen.

Um ein defektes Backup durch eine frische Basis zu ersetzen (akzeptiert den Verlust nicht wiederherstellbarer alter Historie; kann auch Secret Storage neu erstellen, wenn das aktuelle Backup-Secret nicht ladbar ist):

```bash
openclaw matrix verify backup reset --yes
```

Fügen Sie `--rotate-recovery-key` nur hinzu, wenn Sie bewusst möchten, dass der vorherige Recovery Key die frische Backup-Basis nicht mehr entsperrt.

### Verifizierungen auflisten, anfordern und beantworten

```bash
openclaw matrix verify list
```

Listet ausstehende Verifizierungsanfragen für das ausgewählte Konto auf.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Sendet eine Verifizierungsanfrage von diesem OpenClaw-Konto. `--own-user` fordert Selbstverifizierung an (Sie akzeptieren die Aufforderung in einem anderen Matrix-Client desselben Benutzers); `--user-id`/`--device-id`/`--room-id` richten sich an eine andere Person. `--own-user` kann nicht mit den anderen Ziel-Flags kombiniert werden.

Für die Lifecycle-Behandlung auf niedrigerer Ebene — typischerweise beim Begleiten eingehender Anfragen von einem anderen Client — wirken diese Befehle auf eine bestimmte Anfrage `<id>` (ausgegeben von `verify list` und `verify request`):

| Befehl                                    | Zweck                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Eine eingehende Anfrage akzeptieren                                           |
| `openclaw matrix verify start <id>`        | Den SAS-Flow starten                                                  |
| `openclaw matrix verify sas <id>`          | Die SAS-Emojis oder Dezimalzahlen ausgeben                                     |
| `openclaw matrix verify confirm-sas <id>`  | Bestätigen, dass der SAS mit dem übereinstimmt, was der andere Client anzeigt            |
| `openclaw matrix verify mismatch-sas <id>` | Den SAS ablehnen, wenn die Emojis oder Dezimalzahlen nicht übereinstimmen              |
| `openclaw matrix verify cancel <id>`       | Abbrechen; akzeptiert optional `--reason <text>` und `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` und `cancel` akzeptieren alle `--user-id` und `--room-id` als DM-Follow-up-Hinweise, wenn die Verifizierung an einen bestimmten Direct-Message-Raum gebunden ist.

### Hinweise zu mehreren Konten

Ohne `--account <id>` verwenden Matrix-CLI-Befehle das implizite Standardkonto. Wenn Sie mehrere benannte Konten haben und `channels.matrix.defaultAccount` nicht gesetzt haben, verweigern sie eine Schätzung und fordern Sie zur Auswahl auf. Wenn E2EE für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Fehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startverhalten">
    Mit `encryption: true` ist der Standardwert für `startupVerification` `"if-unverified"`. Beim Start fordert ein unverifiziertes Gerät Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abklingzeit an (standardmäßig 24 Stunden). Passen Sie dies mit `startupVerificationCooldownHours` an oder deaktivieren Sie es mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt, der den aktuellen Secret Storage und die Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Status defekt ist, versucht OpenClaw eine abgesicherte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA verlangt, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Owner signierte Geräte bleiben erhalten.

    Siehe [Matrix-Migration](/de/channels/matrix-migration) für den vollständigen Upgrade-Ablauf.

  </Accordion>

  <Accordion title="Verifizierungshinweise">
    Matrix postet Hinweise zum Verifizierungs-Lifecycle in den strikten DM-Verifizierungsraum als `m.notice`-Nachrichten: Anfrage, Bereitschaft (mit Anleitung „Verify by emoji“), Start/Abschluss sowie SAS-Details (Emoji/Dezimal), wenn verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Für die Selbstverifizierung startet OpenClaw den SAS-Flow automatisch und bestätigt die eigene Seite, sobald Emoji-Verifizierung verfügbar ist — Sie müssen weiterhin in Ihrem Matrix-Client vergleichen und „They match“ bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Gelöschtes oder ungültiges Matrix-Gerät">
    Wenn `verify status` meldet, dass das aktuelle Gerät nicht mehr auf dem Homeserver aufgeführt ist, erstellen Sie ein neues OpenClaw-Matrix-Gerät. Für Passwort-Login:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Für Token-Authentifizierung erstellen Sie ein frisches Access Token in Ihrem Matrix-Client oder Ihrer Admin-UI und aktualisieren dann OpenClaw:

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
    Matrix E2EE verwendet den offiziellen Rust-Crypto-Pfad des `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Der Crypto-Status wird in `crypto-idb-snapshot.json` persistiert (restriktive Dateiberechtigungen).

    Der verschlüsselte Laufzeitstatus liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst Sync Store, Crypto Store, Recovery Key, IDB-Snapshot, Thread-Bindungen und Startverifizierungsstatus. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw die beste vorhandene Root wieder, sodass vorheriger Status sichtbar bleibt.

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

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sends über Message-Tools. Zwei unabhängige Regler steuern das Verhalten:

### Session-Routing (`sessionScope`)

`dm.sessionScope` entscheidet, wie Matrix-DM-Räume OpenClaw-Sessions zugeordnet werden:

- `"per-user"` (Standard): Alle DM-Räume mit demselben gerouteten Peer teilen sich eine Session.
- `"per-room"`: Jeder Matrix-DM-Raum erhält seinen eigenen Session Key, selbst wenn der Peer derselbe ist.

Explizite Konversationsbindungen haben immer Vorrang vor `sessionScope`, sodass gebundene Räume und Threads ihre gewählte Ziel-Session behalten.

### Antwort-Threading (`threadReplies`)

`threadReplies` entscheidet, wo der Bot seine Antwort postet:

- `"off"`: Antworten sind Top-Level. Eingehende Thread-Nachrichten bleiben in der Parent-Session.
- `"inbound"`: Nur dann innerhalb eines Threads antworten, wenn die eingehende Nachricht bereits in diesem Thread war.
- `"always"`: Innerhalb eines Threads antworten, dessen Root die auslösende Nachricht ist; diese Konversation wird ab dem ersten Auslöser über eine passende threadbezogene Session geroutet.

`dm.threadReplies` überschreibt dies nur für DMs — zum Beispiel, um Raum-Threads isoliert zu halten, während DMs flach bleiben.

### Thread-Vererbung und Slash-Befehle

- Eingehende Thread-Nachrichten enthalten die Root-Nachricht des Threads als zusätzlichen Agent-Kontext.
- Sendungen per Message-Tool erben automatisch den aktuellen Matrix-Thread, wenn sie denselben Raum (oder dasselbe DM-Benutzerziel) adressieren, sofern keine explizite `threadId` angegeben ist.
- Die Wiederverwendung von DM-Benutzerzielen greift nur, wenn die aktuellen Sitzungsmetadaten denselben DM-Peer auf demselben Matrix-Konto belegen; andernfalls fällt OpenClaw auf das normale benutzerbezogene Routing zurück.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren alle in Matrix-Räumen und DMs.
- `/focus` auf oberster Ebene erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions: true` gesetzt ist.
- Wenn `/focus` oder `/acp spawn --thread here` innerhalb eines vorhandenen Matrix-Threads ausgeführt wird, wird dieser Thread direkt gebunden.

Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsamen Sitzung kollidiert, veröffentlicht es einmalig ein `m.notice` in diesem Raum, das auf den Ausweg über `/focus` hinweist und eine Änderung von `dm.sessionScope` vorschlägt. Der Hinweis erscheint nur, wenn Thread-Bindungen aktiviert sind.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und vorhandene Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Ablauf für Operatoren:

- Führen Sie `/acp spawn codex --bind here` in der Matrix-DM, dem Raum oder dem vorhandenen Thread aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Matrix-Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geroutet.
- Innerhalb eines vorhandenen Matrix-Threads bindet `--bind here` den aktuellen Thread direkt.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
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

Matrix-Spawn-Flags für threadgebundene Sitzungen sind opt-in:

- Setzen Sie `threadBindings.spawnSubagentSessions: true`, damit `/focus` auf oberster Ebene neue Matrix-Threads erstellen und binden darf.
- Setzen Sie `threadBindings.spawnAcpSessions: true`, damit `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads binden darf.

## Reaktionen

Matrix unterstützt ausgehende Reaktionen, eingehende Reaktionsbenachrichtigungen und Bestätigungsreaktionen.

Ausgehende Reaktions-Tools werden durch `channels.matrix.actions.reactions` gesteuert:

- `react` fügt einem Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bots auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bots.

**Auflösungsreihenfolge** (der erste definierte Wert gewinnt):

| Einstellung             | Reihenfolge                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | pro Konto → Kanal → `messages.ackReaction` → Fallback auf Emoji der Agent-Identität |
| `ackReactionScope`      | pro Konto → Kanal → `messages.ackReactionScope` → Standardwert `"group-mentions"` |
| `reactionNotifications` | pro Konto → Kanal → Standardwert `"own"`                                         |

`reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf von Bots verfasste Matrix-Nachrichten zielen; `"off"` deaktiviert Reaktions-Systemereignisse. Entfernungen von Reaktionen werden nicht zu Systemereignissen synthetisiert, weil Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen bereitstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` eingeschlossen werden, wenn eine Matrix-Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Der Matrix-Raumverlauf ist ausschließlich raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Matrix-Raumverlauf ist nur ausstehend: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Trigger eintrifft.
- Die aktuelle Trigger-Nachricht ist nicht in `InboundHistory` enthalten; sie bleibt für diesen Turn im primären eingehenden Body.
- Wiederholungen desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufssnapshot erneut, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Roots und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standardwert. Ergänzender Kontext bleibt wie empfangen erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber weiterhin eine explizit zitierte Antwort.

Diese Einstellung wirkt sich auf die Sichtbarkeit ergänzenden Kontexts aus, nicht darauf, ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Trigger-Autorisierung erfolgt weiterhin über `groupPolicy`, `groups`, `groupAllowFrom` und DM-Richtlinieneinstellungen.

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

Siehe [Gruppen](/de/channels/groups) für Mention-Gating und Allowlist-Verhalten.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und kann nach einer kurzen Abklingzeit eine Erinnerungsantwort senden, statt einen neuen Code zu erstellen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Direct-Message-Status nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Einzelräume statt auf die aktive DM zeigen. Prüfen Sie die aktuelle Zuordnung für einen Peer:

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
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine fehlerfreie DM vorhanden ist

Er löscht alte Räume nicht automatisch. Er wählt die fehlerfreie DM aus und aktualisiert die Zuordnung, sodass zukünftige Matrix-Sendungen, Verifizierungshinweise und andere Direct-Message-Abläufe den richtigen Raum adressieren.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungsclient dienen. Konfigurieren Sie dies unter `channels.matrix.execApprovals` (oder `channels.matrix.accounts.<account>.execApprovals` für eine kontobezogene Überschreibung):

- `enabled`: stellt Genehmigungen über native Matrix-Prompts zu. Wenn nicht gesetzt oder `"auto"`, aktiviert Matrix dies automatisch, sobald mindestens ein Genehmigender aufgelöst werden kann. Setzen Sie `false`, um dies explizit zu deaktivieren.
- `approvers`: Matrix-Benutzer-IDs (`@owner:example.org`), die Exec-Anfragen genehmigen dürfen. Optional — fällt auf `channels.matrix.dm.allowFrom` zurück.
- `target`: wohin Prompts gesendet werden. `"dm"` (Standard) sendet an DMs der Genehmigenden; `"channel"` sendet an den ursprünglichen Matrix-Raum oder die ursprüngliche DM; `"both"` sendet an beide.
- `agentFilter` / `sessionFilter`: optionale Allowlists dafür, welche Agents/Sitzungen die Matrix-Zustellung auslösen.

Die Autorisierung unterscheidet sich leicht je nach Genehmigungsart:

- **Exec-Genehmigungen** verwenden `execApprovals.approvers` mit Fallback auf `dm.allowFrom`.
- **Plugin-Genehmigungen** autorisieren ausschließlich über `dm.allowFrom`.

Beide Arten teilen Matrix-Reaktionskürzel und Nachrichtenaktualisierungen. Genehmigende sehen Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` einmal erlauben
- `❌` ablehnen
- `♾️` immer erlauben (wenn die effektive Exec-Richtlinie dies zulässt)

Fallback-Slash-Befehle: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Die Kanalzustellung für Exec-Genehmigungen enthält den Befehlstext — aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Räumen.

Verwandt: [Exec-Genehmigungen](/de/tools/exec-approvals).

## Slash-Befehle

Slash-Befehle (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` usw.) funktionieren direkt in DMs. In Räumen erkennt OpenClaw auch Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad ohne benutzerdefinierte Erwähnungs-Regex auslöst. Dadurch reagiert der Bot weiterhin auf raumtypische `@mention /command`-Beiträge, die Element und ähnliche Clients ausgeben, wenn ein Benutzer den Bot per Tab-Vervollständigung auswählt, bevor er den Befehl eingibt.

Autorisierungsregeln gelten weiterhin: Befehlssender müssen dieselben DM- oder Raum-Allowlist-/Owner-Richtlinien erfüllen wie normale Nachrichten.

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

- Werte auf oberster Ebene unter `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
- Beschränken Sie einen geerbten Raumeintrag mit `groups.<room>.account` auf ein bestimmtes Konto. Einträge ohne `account` werden kontoübergreifend geteilt; `account: "default"` funktioniert weiterhin, wenn das Standardkonto auf oberster Ebene konfiguriert ist.

**Auswahl des Standardkontos:**

- Setzen Sie `defaultAccount`, um das benannte Konto auszuwählen, das implizites Routing, Prüfungen und CLI-Befehle bevorzugen.
- Wenn Sie mehrere Konten haben und eines wörtlich `default` heißt, verwendet OpenClaw es implizit, auch wenn `defaultAccount` nicht gesetzt ist.
- Wenn Sie mehrere benannte Konten haben und kein Standardkonto ausgewählt ist, verweigern CLI-Befehle das Raten — setzen Sie `defaultAccount` oder übergeben Sie `--account <id>`.
- Der Block `channels.matrix.*` auf oberster Ebene wird nur dann als implizites `default`-Konto behandelt, wenn seine Authentifizierung vollständig ist (`homeserver` + `accessToken` oder `homeserver` + `userId` + `password`). Benannte Konten bleiben über `homeserver` + `userId` auffindbar, sobald zwischengespeicherte Anmeldedaten die Authentifizierung abdecken.

**Hochstufung:**

- Wenn OpenClaw eine Einzelkonto-Konfiguration während Reparatur oder Einrichtung zu einer Mehrkonto-Konfiguration hochstuft, behält es das vorhandene benannte Konto bei, falls eines existiert oder `defaultAccount` bereits auf eines zeigt. Nur Matrix-Auth-/Bootstrap-Schlüssel werden in das hochgestufte Konto verschoben; gemeinsame Zustellrichtlinien-Schlüssel bleiben auf oberster Ebene.

Siehe [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Mehrkonto-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum Schutz vor SSRF, sofern Sie dies nicht
explizit pro Konto aktivieren.

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

Diese explizite Aktivierung erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Verwenden Sie nach Möglichkeit `https://`.

## Matrix-Datenverkehr über einen Proxy leiten

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
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Datenverkehr zur Laufzeit und für Kontostatusprüfungen.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Matrix-Raum-IDs unterscheiden Groß- und Kleinschreibung. Verwenden Sie die exakte Schreibweise der Raum-ID aus Matrix,
wenn Sie explizite Zustellziele, Cron-Jobs, Bindungen oder Zulassungslisten konfigurieren.
OpenClaw hält interne Sitzungsschlüssel für die Speicherung kanonisch, daher sind diese kleingeschriebenen
Schlüssel keine verlässliche Quelle für Matrix-Zustell-IDs.

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt und greifen dann auf die Suche in den Namen der beigetretenen Räume für dieses Konto zurück.
- Die Namenssuche in beigetretenen Räumen erfolgt nach bestem Aufwand. Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er von der Laufzeitauflösung der Zulassungsliste ignoriert.

## Konfigurationsreferenz

Zulassungslistenartige Felder (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) akzeptieren vollständige Matrix-Benutzer-IDs (am sichersten). Exakte Verzeichnistreffer werden beim Start und immer dann aufgelöst, wenn sich die Zulassungsliste ändert, während der Monitor läuft; Einträge, die nicht aufgelöst werden können, werden zur Laufzeit ignoriert. Raum-Zulassungslisten bevorzugen aus demselben Grund Raum-IDs oder Aliasse.

### Konto und Verbindung

- `enabled`: aktiviert oder deaktiviert den Kanal.
- `name`: optionales Anzeigelabel für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `accounts`: benannte Überschreibungen pro Konto. Werte auf oberster Ebene unter `channels.matrix` werden als Standardwerte vererbt.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: erlaubt diesem Konto, sich mit `localhost`, LAN-/Tailscale-IPs oder internen Hostnamen zu verbinden.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Überschreibung pro Konto wird unterstützt.
- `userId`: vollständige Matrix-Benutzer-ID (`@bot:example.org`).
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartext- und SecretRef-Werte werden über Env-/Datei-/Exec-Provider hinweg unterstützt ([Secret-Verwaltung](/de/gateway/secrets)).
- `password`: Passwort für passwortbasierte Anmeldung. Klartext- und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Geräteanzeigename, der bei der Passwortanmeldung verwendet wird.
- `avatarUrl`: gespeicherte URL des eigenen Avatars für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl von Ereignissen, die während der Startsynchronisierung abgerufen werden.

### Verschlüsselung

- `encryption`: aktiviert E2EE. Standard: `false`.
- `startupVerification`: `"if-unverified"` (Standard, wenn E2EE aktiv ist) oder `"off"`. Fordert beim Start automatisch eine Selbstverifizierung an, wenn dieses Gerät nicht verifiziert ist.
- `startupVerificationCooldownHours`: Abkühlzeit vor der nächsten automatischen Startanfrage. Standard: `24`.

### Zugriff und Richtlinie

- `groupPolicy`: `"open"`, `"allowlist"` oder `"disabled"`. Standard: `"allowlist"`.
- `groupAllowFrom`: Zulassungsliste von Benutzer-IDs für Raumdatenverkehr.
- `dm.enabled`: wenn `false`, werden alle DMs ignoriert. Standard: `true`.
- `dm.policy`: `"pairing"` (Standard), `"allowlist"`, `"open"` oder `"disabled"`. Wird angewendet, nachdem der Bot beigetreten ist und den Raum als DM klassifiziert hat; dies wirkt sich nicht auf die Einladungshandhabung aus.
- `dm.allowFrom`: Zulassungsliste von Benutzer-IDs für DM-Datenverkehr.
- `dm.sessionScope`: `"per-user"` (Standard) oder `"per-room"`.
- `dm.threadReplies`: reine DM-Überschreibung für Antwort-Threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten (`true` oder `"mentions"`).
- `allowlistOnly`: wenn `true`, erzwingt dies für alle aktiven DM-Richtlinien (außer `"disabled"`) und `"open"`-Gruppenrichtlinien `"allowlist"`. `"disabled"`-Richtlinien werden nicht geändert.
- `autoJoin`: `"always"`, `"allowlist"` oder `"off"`. Standard: `"off"`. Gilt für jede Matrix-Einladung, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` auf `"allowlist"` steht. Aliaseinträge werden gegen den Homeserver aufgelöst, nicht gegen den vom eingeladenen Raum beanspruchten Status.
- `contextVisibility`: zusätzliche Kontextsichtbarkeit (`"all"` als Standard, `"allowlist"`, `"allowlist_quote"`).

### Antwortverhalten

- `replyToMode`: `"off"`, `"first"`, `"all"` oder `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` oder `"always"`.
- `threadBindings`: kanalspezifische Überschreibungen für sitzungsgebundenes Thread-Routing und den Lebenszyklus.
- `streaming`: `"off"` (Standard), `"partial"`, `"quiet"` oder Objektform `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: wenn `true`, werden abgeschlossene Assistant-Blöcke als separate Fortschrittsnachrichten beibehalten.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Text.
- `responsePrefix`: optionale Zeichenfolge, die ausgehenden Antworten vorangestellt wird.
- `textChunkLimit`: ausgehende Chunk-Größe in Zeichen, wenn `chunkMode: "length"`. Standard: `4000`.
- `chunkMode`: `"length"` (Standard, teilt nach Zeichenanzahl) oder `"newline"` (teilt an Zeilengrenzen).
- `historyLimit`: Anzahl der aktuellen Raumnachrichten, die als `InboundHistory` einbezogen werden, wenn eine Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; effektiver Standard `0` (deaktiviert).
- `mediaMaxMb`: Mediengrößenobergrenze in MB für ausgehende Sendungen und eingehende Verarbeitung.

### Reaktionseinstellungen

- `ackReaction`: Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: Bereichsüberschreibung (`"group-mentions"` als Standard, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: Benachrichtigungsmodus für eingehende Reaktionen (`"own"` als Standard, `"off"`).

### Tooling und Überschreibungen pro Raum

- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: Richtlinienzuordnung pro Raum. Die Sitzungsidentität verwendet nach der Auflösung die stabile Raum-ID. (`rooms` ist ein Legacy-Alias.)
  - `groups.<room>.account`: beschränkt einen vererbten Raumeintrag auf ein bestimmtes Konto.
  - `groups.<room>.allowBots`: raumspezifische Überschreibung der Einstellung auf Kanalebene (`true` oder `"mentions"`).
  - `groups.<room>.users`: raumspezifische Sender-Zulassungsliste.
  - `groups.<room>.tools`: raumspezifische Überschreibungen zum Erlauben/Verweigern von Tools.
  - `groups.<room>.autoReply`: raumspezifische Überschreibung des Erwähnungs-Gatings. `true` deaktiviert Erwähnungsanforderungen für diesen Raum; `false` erzwingt sie wieder.
  - `groups.<room>.skills`: raumspezifischer Skills-Filter.
  - `groups.<room>.systemPrompt`: raumspezifischer System-Prompt-Ausschnitt.

### Exec-Genehmigungseinstellungen

- `execApprovals.enabled`: liefert Exec-Genehmigungen über Matrix-native Prompts aus.
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die genehmigen dürfen. Fällt auf `dm.allowFrom` zurück.
- `execApprovals.target`: `"dm"` (Standard), `"channel"` oder `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: optionale Agent-/Sitzungs-Zulassungslisten für die Zustellung.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung

---
read_when:
    - Upgrade einer bestehenden Matrix-Installation
    - Verschlüsselte Matrix-Chronik und Gerätestatus migrieren
summary: Wie OpenClaw das vorherige Matrix-Plugin direkt aktualisiert, einschließlich der Grenzen bei der Wiederherstellung des verschlüsselten Zustands und manueller Wiederherstellungsschritte.
title: Matrix-Migration
x-i18n:
    generated_at: "2026-07-24T03:38:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 475c96914900a5597f37001264bd3d8f69a69dbd0600f2704c2a1be46924fac4
    source_path: channels/matrix-migration.md
    workflow: 16
---

Aktualisieren Sie vom vorherigen öffentlichen `matrix`-Plugin auf die aktuelle Implementierung.

Für die meisten Benutzer erfolgt das Upgrade ohne Änderungen:

- das Plugin bleibt `@openclaw/matrix`
- der Kanal bleibt `matrix`
- Ihre Konfiguration bleibt unter `channels.matrix`
- zwischengespeicherte Anmeldedaten werden in den gemeinsamen Plugin-Status von `state/openclaw.sqlite` verschoben
- der Laufzeitstatus bleibt unter `~/.openclaw/matrix/`

Sie müssen weder Konfigurationsschlüssel umbenennen noch das Plugin unter einem neuen Namen neu installieren.
Das Root-Paket `openclaw` enthält keinen Matrix-Laufzeitcode und keine Abhängigkeiten
vom Matrix SDK mehr. Wenn `openclaw channels status` anzeigt, dass Matrix konfiguriert, das
Plugin jedoch nicht installiert ist, führen Sie `openclaw doctor --fix` oder
`openclaw plugins install @openclaw/matrix` aus; installieren Sie keine Matrix-SDK-Pakete
im OpenClaw-Root-Paket.

## Was bei der Migration automatisch geschieht

Die Matrix-Migration wird ausgeführt, wenn Sie [`openclaw doctor --fix`](/de/gateway/doctor) ausführen. Dateibasierte Sidecars neben dem dedizierten Matrix-Speicher behalten ihren Fallback beim Clientstart bei, der Import von Anmeldedatendateien erfolgt jedoch ausschließlich über Doctor; die Laufzeit liest nur den kanonischen SQLite-Anmeldedatenstatus.

Die Doctor-Migration umfasst:

- Importieren und Überprüfen veralteter `~/.openclaw/credentials/matrix/credentials*.json`-Dateien vor deren Archivierung
- Beibehalten derselben Kontoauswahl und `channels.matrix`-Konfiguration
- Importieren des dateibasierten Sidecar-Status (`bot-storage.json`-Synchronisierungscache, `recovery-key.json`, `legacy-crypto-migration.json`, IndexedDB-Snapshots) in den Matrix-SQLite-Status; migrierte Dateien werden mit dem Suffix `.migrated` archiviert
- Wiederverwenden des vollständigsten vorhandenen Speicherstamms für Token-Hashes für dasselbe Matrix-Konto, denselben Homeserver, Benutzer und dasselbe Gerät, wenn sich das Zugriffstoken später ändert

## Upgrade von OpenClaw-Versionen vor 2026.4

Versionen bis einschließlich der 2026.6-Reihe migrierten außerdem das ursprüngliche flache
Matrix-Layout mit einem einzigen Speicher (`~/.openclaw/matrix/bot-storage.json` plus
`~/.openclaw/matrix/crypto/`) und bereiteten die Wiederherstellung des verschlüsselten Status aus dem
alten Rust-Kryptospeicher vor. Aktuelle Versionen enthalten diese Migration nicht mehr.

Wenn Sie eine Installation aktualisieren, die noch das flache Layout verwendet, führen Sie zunächst
ein Upgrade auf eine 2026.6-Version durch, führen Sie `openclaw doctor --fix` aus und starten Sie das Gateway
einmal, damit der flache Speicher und alle wiederherstellbaren Raumschlüssel migriert werden. Aktualisieren Sie
anschließend auf die neueste Version.

Das vorherige öffentliche Matrix-Plugin erstellte **nicht** automatisch Sicherungen der Matrix-Raumschlüssel. Wenn Ihre alte Installation ausschließlich lokal gespeicherten verschlüsselten Verlauf enthielt, der nie gesichert wurde, können einige ältere verschlüsselte Nachrichten nach dem Upgrade unabhängig vom Migrationspfad unlesbar bleiben.

## Empfohlener Upgrade-Ablauf

1. Aktualisieren Sie OpenClaw und das Matrix-Plugin wie gewohnt.
2. Führen Sie Folgendes aus:

   ```bash
   openclaw doctor --fix
   ```

3. Starten Sie das Gateway oder starten Sie es neu.
4. Prüfen Sie den aktuellen Verifizierungs- und Sicherungsstatus:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Speichern Sie den Wiederherstellungsschlüssel für das zu reparierende Matrix-Konto in einer kontospezifischen Umgebungsvariablen. Für ein einzelnes Standardkonto ist `MATRIX_RECOVERY_KEY` ausreichend. Verwenden Sie bei mehreren Konten eine Variable pro Konto, beispielsweise `MATRIX_RECOVERY_KEY_ASSISTANT`, und fügen Sie dem Befehl `--account assistant` hinzu.

6. Wenn OpenClaw Ihnen mitteilt, dass ein Wiederherstellungsschlüssel erforderlich ist, führen Sie den Befehl für das entsprechende Konto aus:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Wenn dieses Gerät weiterhin nicht verifiziert ist, führen Sie den Befehl für das entsprechende Konto aus:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Wenn der Wiederherstellungsschlüssel akzeptiert wurde und die Sicherung verwendbar ist, `Cross-signing verified`
   jedoch weiterhin `no` lautet, schließen Sie die Selbstverifizierung über einen anderen Matrix-Client ab:

   ```bash
   openclaw matrix verify self
   ```

   Akzeptieren Sie die Anfrage in einem anderen Matrix-Client, vergleichen Sie die Emojis oder Dezimalzahlen
   und geben Sie `yes` nur ein, wenn sie übereinstimmen. Der Befehl wartet auf das vollständige Vertrauen in die Matrix-
   Identität, bevor er einen Erfolg meldet.

8. Wenn Sie nicht wiederherstellbaren alten Verlauf bewusst aufgeben und eine neue Sicherungsbasis für zukünftige Nachrichten erstellen möchten, führen Sie Folgendes aus:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Fügen Sie `--rotate-recovery-key` nur hinzu, wenn der alte Wiederherstellungsschlüssel die neue Sicherung nicht mehr entsperren soll.

9. Wenn noch keine serverseitige Schlüsselsicherung vorhanden ist, erstellen Sie eine für zukünftige Wiederherstellungen:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Häufige Meldungen und ihre Bedeutung

`Failed migrating legacy Matrix client storage: ...`

- Bedeutung: Der clientseitige Matrix-Fallback hat einen dateibasierten Sidecar-Status gefunden, der Import in SQLite ist jedoch fehlgeschlagen. OpenClaw macht abgeschlossene Verschiebungen rückgängig und bricht diesen Fallback ab, anstatt unbemerkt mit einem neuen Speicher zu starten.
- Vorgehen: Prüfen Sie Dateisystemberechtigungen oder Konflikte, lassen Sie den alten Status unverändert und versuchen Sie es nach Behebung des Fehlers erneut.

`Matrix is installed from a custom path: ...`

- Bedeutung: Matrix ist an eine Pfadinstallation gebunden, daher ersetzen Aktualisierungen des Hauptzweigs es nicht automatisch durch das standardmäßige Matrix-Paket.
- Vorgehen: Installieren Sie es mit `openclaw plugins install @openclaw/matrix` neu, wenn Sie zum standardmäßigen Matrix-Plugin zurückkehren möchten.

`Matrix is installed from a custom path that no longer exists: ...`

- Bedeutung: Der Installationsdatensatz Ihres Plugins verweist auf einen nicht mehr vorhandenen lokalen Pfad.
- Vorgehen: Installieren Sie es mit `openclaw plugins install @openclaw/matrix` neu oder verwenden Sie `openclaw plugins install ./path/to/local/matrix-plugin`, wenn Sie aus einem Repository-Checkout arbeiten. `openclaw doctor --fix` kann die veralteten Matrix-Plugin-Verweise ebenfalls für Sie entfernen.

### Meldungen zur manuellen Wiederherstellung

`openclaw matrix verify status` und `openclaw matrix verify backup status` geben eine `Backup issue:`-Zeile sowie Hinweise zu `Next steps:` aus, wenn die Raumschlüsselsicherung auf diesem Gerät nicht fehlerfrei ist:

| Sicherungsproblem                                                      | Bedeutung                                          | Behebung                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | keine Quelle für eine Wiederherstellung vorhanden  | `openclaw matrix verify bootstrap`, um eine Raumschlüsselsicherung zu erstellen                                                                           |
| `backup decryption key is not loaded on this device`                  | Schlüssel ist vorhanden, hier aber nicht aktiv     | `openclaw matrix verify backup restore`; wenn der Schlüssel weiterhin nicht geladen werden kann, leiten Sie den Wiederherstellungsschlüssel über `--recovery-key-stdin` weiter |
| `backup decryption key could not be loaded from secret storage (...)` | Laden des geheimen Speichers fehlgeschlagen oder nicht unterstützt | Leiten Sie den Wiederherstellungsschlüssel weiter: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`                                                      |
| `backup key mismatch (...)`                                           | gespeicherter Schlüssel stimmt nicht mit der aktiven Serversicherung überein | Führen Sie `verify backup restore --recovery-key-stdin` mit dem Schlüssel der aktiven Serversicherung erneut aus oder `verify backup reset --yes` für eine neue Basis |
| `backup signature chain is not trusted by this device`                | Gerät vertraut der Cross-Signing-Kette noch nicht  | `verify device --recovery-key-stdin`, anschließend `verify self` von einem anderen verifizierten Client, falls das Vertrauen weiterhin unvollständig ist |
| `backup exists but is not active on this device`                      | Serversicherung vorhanden, lokale Sitzung inaktiv  | Verifizieren Sie zuerst das Gerät und prüfen Sie dann erneut mit `openclaw matrix verify backup status`                                                        |
| `backup trust state could not be fully determined`                    | Diagnose war nicht eindeutig                       | `openclaw matrix verify status --verbose`                                                                                                                        |

Weitere Wiederherstellungsfehler:

`Matrix recovery key is required`

- Bedeutung: Sie haben einen Wiederherstellungsschritt versucht, ohne einen erforderlichen Wiederherstellungsschlüssel anzugeben.
- Vorgehen: Führen Sie den Befehl erneut mit `--recovery-key-stdin` aus, beispielsweise `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Bedeutung: Der angegebene Schlüssel konnte nicht analysiert werden oder entsprach nicht dem erwarteten Format.
- Vorgehen: Versuchen Sie es erneut mit dem exakten Wiederherstellungsschlüssel aus Ihrem Matrix-Client oder dem Export des Wiederherstellungsschlüssels.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Bedeutung: Der Wiederherstellungsschlüssel hat verwendbares Sicherungsmaterial entsperrt, Matrix hat jedoch noch kein vollständiges Vertrauen in die Cross-Signing-Identität dieses Geräts hergestellt. Prüfen Sie die Befehlsausgabe auf `Recovery key accepted`, `Backup usable`, `Cross-signing verified` und `Device verified by owner`.
- Vorgehen: Führen Sie `openclaw matrix verify self` aus, akzeptieren Sie die Anfrage in einem anderen Matrix-Client, vergleichen Sie die SAS und geben Sie `yes` nur ein, wenn sie übereinstimmen. Verwenden Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` nur, wenn Sie die aktuelle Cross-Signing-Identität bewusst ersetzen möchten.

Wenn Sie den Verlust nicht wiederherstellbaren alten verschlüsselten Verlaufs akzeptieren, können Sie stattdessen die
aktuelle Sicherungsbasis mit `openclaw matrix verify backup reset --yes` zurücksetzen. Wenn das
gespeicherte Sicherungsgeheimnis beschädigt ist, repariert dieses Zurücksetzen auch den geheimen Speicher, sodass der
neue Sicherungsschlüssel nach einem Neustart ordnungsgemäß geladen werden kann.

## Wenn der verschlüsselte Verlauf weiterhin nicht zurückkehrt

Führen Sie diese Prüfungen der Reihe nach aus:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Wenn die Sicherung erfolgreich wiederhergestellt wird, in einigen alten Räumen jedoch weiterhin Verlauf fehlt, wurden diese fehlenden Schlüssel wahrscheinlich nie vom vorherigen Plugin gesichert.

## Wenn Sie für zukünftige Nachrichten neu beginnen möchten

Wenn Sie den Verlust nicht wiederherstellbaren alten verschlüsselten Verlaufs akzeptieren und künftig nur eine saubere Sicherungsbasis wünschen, führen Sie diese Befehle der Reihe nach aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Wenn das Gerät danach weiterhin nicht verifiziert ist, schließen Sie die Verifizierung über Ihren Matrix-Client ab, indem Sie die SAS-Emojis oder Dezimalcodes vergleichen und bestätigen, dass sie übereinstimmen.

## Verwandte Themen

- [Matrix](/de/channels/matrix): Kanaleinrichtung und Konfiguration.
- [Matrix-Push-Regeln](/de/channels/matrix-push-rules): Benachrichtigungsweiterleitung.
- [Doctor](/de/gateway/doctor): Zustandsprüfung und automatischer Migrationsauslöser.
- [Migrationsleitfaden](/de/install/migrating): alle Migrationspfade (Umzüge zwischen Rechnern, systemübergreifende Importe).
- [Plugins](/de/tools/plugin): Installation und Registrierung von Plugins.

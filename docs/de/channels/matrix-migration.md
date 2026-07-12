---
read_when:
    - Upgrade einer bestehenden Matrix-Installation
    - Verschlüsselten Matrix-Verlauf und Gerätestatus migrieren
summary: Wie OpenClaw das bisherige Matrix-Plugin direkt aktualisiert, einschließlich der Einschränkungen bei der Wiederherstellung des verschlüsselten Zustands und der manuellen Wiederherstellungsschritte.
title: Matrix-Migration
x-i18n:
    generated_at: "2026-07-12T15:00:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Aktualisieren Sie vom vorherigen öffentlichen `matrix`-Plugin auf die aktuelle Implementierung.

Für die meisten Benutzer ist das Upgrade bereits vorbereitet:

- das Plugin bleibt `@openclaw/matrix`
- der Kanal bleibt `matrix`
- Ihre Konfiguration bleibt unter `channels.matrix`
- zwischengespeicherte Anmeldedaten bleiben unter `~/.openclaw/credentials/matrix/`
- der Laufzeitstatus bleibt unter `~/.openclaw/matrix/`

Sie müssen weder Konfigurationsschlüssel umbenennen noch das Plugin unter einem neuen Namen neu installieren.
Das Root-Paket `openclaw` bündelt keinen Matrix-Laufzeitcode und keine Matrix-SDK-Abhängigkeiten mehr.
Wenn `openclaw channels status` anzeigt, dass Matrix konfiguriert, das Plugin jedoch nicht installiert ist, führen Sie `openclaw doctor --fix` oder
`openclaw plugins install @openclaw/matrix` aus; installieren Sie keine Matrix-SDK-Pakete
im Root-Paket von OpenClaw.

## Was die Migration automatisch erledigt

Die Matrix-Migration wird ausgeführt, wenn Sie [`openclaw doctor --fix`](/de/gateway/doctor) ausführen, und ersatzweise, wenn der Matrix-Client startet und neben seinem SQLite-Speicher noch dateibasierte Sidecar-Statusdaten findet.

Die automatische Migration umfasst:

- die Wiederverwendung Ihrer zwischengespeicherten Matrix-Anmeldedaten
- die Beibehaltung derselben Kontoauswahl und `channels.matrix`-Konfiguration
- den Import dateibasierter Sidecar-Statusdaten (`bot-storage.json`-Synchronisierungscache, `recovery-key.json`, `legacy-crypto-migration.json`, IndexedDB-Snapshots) in den Matrix-SQLite-Status; migrierte Dateien werden mit dem Suffix `.migrated` archiviert
- die Wiederverwendung des vollständigsten vorhandenen Speicherstamms für Token-Hashes für dasselbe Matrix-Konto, denselben Homeserver, Benutzer und dasselbe Gerät, wenn sich das Zugriffstoken später ändert

## Upgrade von OpenClaw-Versionen vor 2026.4

Versionen bis einschließlich der 2026.6-Reihe migrierten außerdem das ursprüngliche
flache Matrix-Layout mit nur einem Speicher (`~/.openclaw/matrix/bot-storage.json` plus
`~/.openclaw/matrix/crypto/`) und bereiteten die Wiederherstellung verschlüsselter Statusdaten aus dem
alten Rust-Kryptospeicher vor. Aktuelle Versionen enthalten diese Migration nicht mehr.

Wenn Sie eine Installation aktualisieren, die noch das flache Layout verwendet, aktualisieren Sie zunächst
auf eine 2026.6-Version, führen Sie `openclaw doctor --fix` aus und starten Sie das Gateway
einmal, damit der flache Speicher und alle wiederherstellbaren Raumschlüssel migriert werden. Aktualisieren Sie anschließend
auf die neueste Version.

Das vorherige öffentliche Matrix-Plugin erstellte **nicht** automatisch Sicherungen von Matrix-Raumschlüsseln. Wenn Ihre alte Installation ausschließlich lokal gespeicherten verschlüsselten Verlauf enthielt, der nie gesichert wurde, können einige ältere verschlüsselte Nachrichten nach dem Upgrade unabhängig vom Migrationspfad weiterhin unlesbar sein.

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

5. Legen Sie den Wiederherstellungsschlüssel für das zu reparierende Matrix-Konto in einer kontospezifischen Umgebungsvariablen ab. Für ein einzelnes Standardkonto ist `MATRIX_RECOVERY_KEY` ausreichend. Verwenden Sie für mehrere Konten je Konto eine eigene Variable, beispielsweise `MATRIX_RECOVERY_KEY_ASSISTANT`, und fügen Sie dem Befehl `--account assistant` hinzu.

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

   Wenn der Wiederherstellungsschlüssel akzeptiert wurde und die Sicherung nutzbar ist, aber `Cross-signing verified`
   weiterhin `no` lautet, schließen Sie die Selbstverifizierung über einen anderen Matrix-Client ab:

   ```bash
   openclaw matrix verify self
   ```

   Akzeptieren Sie die Anfrage in einem anderen Matrix-Client, vergleichen Sie die Emojis oder Dezimalzahlen
   und geben Sie `yes` nur ein, wenn sie übereinstimmen. Der Befehl wartet auf vollständiges Vertrauen in die Matrix-
   Identität, bevor er einen Erfolg meldet.

8. Wenn Sie nicht wiederherstellbaren alten Verlauf bewusst aufgeben und eine neue Sicherungsbasis für zukünftige Nachrichten wünschen, führen Sie Folgendes aus:

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

- Bedeutung: Der clientseitige Matrix-Ersatzpfad hat dateibasierte Sidecar-Statusdaten gefunden, der Import in SQLite ist jedoch fehlgeschlagen. OpenClaw macht abgeschlossene Verschiebungen rückgängig und bricht diesen Ersatzpfad ab, statt unbemerkt mit einem neuen Speicher zu starten.
- Vorgehensweise: Prüfen Sie Dateisystemberechtigungen oder Konflikte, lassen Sie den alten Status unverändert und versuchen Sie es nach Behebung des Fehlers erneut.

`Matrix is installed from a custom path: ...`

- Bedeutung: Matrix ist an eine Pfadinstallation gebunden, sodass reguläre Updates es nicht automatisch durch das standardmäßige Matrix-Paket ersetzen.
- Vorgehensweise: Installieren Sie es mit `openclaw plugins install @openclaw/matrix` neu, wenn Sie zum standardmäßigen Matrix-Plugin zurückkehren möchten.

`Matrix is installed from a custom path that no longer exists: ...`

- Bedeutung: Der Installationseintrag Ihres Plugins verweist auf einen nicht mehr vorhandenen lokalen Pfad.
- Vorgehensweise: Installieren Sie es mit `openclaw plugins install @openclaw/matrix` neu oder, wenn Sie aus einem Repository-Checkout arbeiten, mit `openclaw plugins install ./path/to/local/matrix-plugin`. `openclaw doctor --fix` kann die veralteten Verweise auf das Matrix-Plugin ebenfalls für Sie entfernen.

### Meldungen zur manuellen Wiederherstellung

`openclaw matrix verify status` und `openclaw matrix verify backup status` geben eine Zeile `Backup issue:` sowie Hinweise unter `Next steps:` aus, wenn die Raumschlüsselsicherung auf diesem Gerät nicht fehlerfrei ist:

| Sicherungsproblem                                                     | Bedeutung                                          | Behebung                                                                                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | Es gibt nichts, das wiederhergestellt werden kann. | Mit `openclaw matrix verify bootstrap` eine Raumschlüsselsicherung erstellen                                                              |
| `backup decryption key is not loaded on this device`                  | Der Schlüssel ist vorhanden, hier aber nicht aktiv.| `openclaw matrix verify backup restore`; wenn der Schlüssel weiterhin nicht geladen werden kann, den Wiederherstellungsschlüssel über `--recovery-key-stdin` weiterleiten |
| `backup decryption key could not be loaded from secret storage (...)` | Das Laden aus dem Geheimnisspeicher ist fehlgeschlagen oder wird nicht unterstützt. | Den Wiederherstellungsschlüssel weiterleiten: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin` |
| `backup key mismatch (...)`                                           | Der gespeicherte Schlüssel stimmt nicht mit der aktiven Serversicherung überein. | `verify backup restore --recovery-key-stdin` mit dem Schlüssel der aktiven Serversicherung erneut ausführen oder `verify backup reset --yes` für eine neue Basis verwenden |
| `backup signature chain is not trusted by this device`                | Das Gerät vertraut der Cross-Signing-Kette noch nicht. | `verify device --recovery-key-stdin`, anschließend `verify self` über einen anderen verifizierten Client, wenn das Vertrauen weiterhin unvollständig ist |
| `backup exists but is not active on this device`                      | Die Serversicherung ist vorhanden, die lokale Sitzung jedoch inaktiv. | Zuerst das Gerät verifizieren und anschließend erneut mit `openclaw matrix verify backup status` prüfen |
| `backup trust state could not be fully determined`                    | Die Diagnose war nicht eindeutig.                 | `openclaw matrix verify status --verbose`                                                                                                 |

Weitere Wiederherstellungsfehler:

`Matrix recovery key is required`

- Bedeutung: Sie haben einen Wiederherstellungsschritt ausgeführt, ohne einen erforderlichen Wiederherstellungsschlüssel anzugeben.
- Vorgehensweise: Führen Sie den Befehl erneut mit `--recovery-key-stdin` aus, beispielsweise `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Bedeutung: Der angegebene Schlüssel konnte nicht analysiert werden oder entsprach nicht dem erwarteten Format.
- Vorgehensweise: Versuchen Sie es erneut mit dem exakten Wiederherstellungsschlüssel aus Ihrem Matrix-Client oder dem exportierten Wiederherstellungsschlüssel.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Bedeutung: Der Wiederherstellungsschlüssel hat verwendbares Sicherungsmaterial entsperrt, Matrix hat jedoch noch kein vollständiges Cross-Signing-Identitätsvertrauen für dieses Gerät hergestellt. Prüfen Sie die Befehlsausgabe auf `Recovery key accepted`, `Backup usable`, `Cross-signing verified` und `Device verified by owner`.
- Vorgehensweise: Führen Sie `openclaw matrix verify self` aus, akzeptieren Sie die Anfrage in einem anderen Matrix-Client, vergleichen Sie die SAS und geben Sie `yes` nur ein, wenn sie übereinstimmen. Verwenden Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` nur, wenn Sie die aktuelle Cross-Signing-Identität bewusst ersetzen möchten.

Wenn Sie den Verlust nicht wiederherstellbaren alten verschlüsselten Verlaufs akzeptieren, können Sie stattdessen die
aktuelle Sicherungsbasis mit `openclaw matrix verify backup reset --yes` zurücksetzen. Wenn das
gespeicherte Sicherungsgeheimnis beschädigt ist, repariert dieses Zurücksetzen außerdem den Geheimnisspeicher, sodass der
neue Sicherungsschlüssel nach einem Neustart korrekt geladen werden kann.

## Wenn der verschlüsselte Verlauf weiterhin nicht wiederhergestellt wird

Führen Sie diese Prüfungen der Reihe nach aus:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Wenn die Sicherung erfolgreich wiederhergestellt wird, aber in einigen alten Räumen weiterhin Verlauf fehlt, wurden diese fehlenden Schlüssel wahrscheinlich nie durch das vorherige Plugin gesichert.

## Wenn Sie für zukünftige Nachrichten neu beginnen möchten

Wenn Sie den Verlust nicht wiederherstellbaren alten verschlüsselten Verlaufs akzeptieren und künftig nur eine saubere Sicherungsbasis wünschen, führen Sie diese Befehle der Reihe nach aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Wenn das Gerät danach weiterhin nicht verifiziert ist, schließen Sie die Verifizierung in Ihrem Matrix-Client ab, indem Sie die SAS-Emojis oder Dezimalcodes vergleichen und bestätigen, dass sie übereinstimmen.

## Verwandte Themen

- [Matrix](/de/channels/matrix): Einrichtung und Konfiguration des Kanals.
- [Matrix-Push-Regeln](/de/channels/matrix-push-rules): Weiterleitung von Benachrichtigungen.
- [Doctor](/de/gateway/doctor): Zustandsprüfung und automatischer Migrationsauslöser.
- [Migrationsleitfaden](/de/install/migrating): alle Migrationspfade (Umzüge zwischen Computern, systemübergreifende Importe).
- [Plugins](/de/tools/plugin): Installation und Registrierung von Plugins.

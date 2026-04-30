---
read_when:
    - Aktualisieren einer bestehenden Matrix-Installation
    - Migration des verschlüsselten Matrix-Verlaufs und Gerätezustands
summary: Wie OpenClaw das bisherige Matrix-Plugin direkt aktualisiert, einschließlich der Grenzen bei der Wiederherstellung verschlüsselter Zustände und manueller Wiederherstellungsschritte.
title: Matrix-Migration
x-i18n:
    generated_at: "2026-04-30T06:40:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

Aktualisieren Sie vom vorherigen öffentlichen `matrix`-Plugin auf die aktuelle Implementierung.

Für die meisten Benutzer erfolgt das Upgrade direkt:

- das Plugin bleibt `@openclaw/matrix`
- der Kanal bleibt `matrix`
- Ihre Konfiguration bleibt unter `channels.matrix`
- zwischengespeicherte Anmeldedaten bleiben unter `~/.openclaw/credentials/matrix/`
- Laufzeitstatus bleibt unter `~/.openclaw/matrix/`

Sie müssen keine Konfigurationsschlüssel umbenennen oder das Plugin unter einem neuen Namen neu installieren.

## Was die Migration automatisch erledigt

Wenn der Gateway startet und wenn Sie [`openclaw doctor --fix`](/de/gateway/doctor) ausführen, versucht OpenClaw, alten Matrix-Status automatisch zu reparieren.
Bevor ein umsetzbarer Matrix-Migrationsschritt Status auf dem Datenträger verändert, erstellt OpenClaw einen gezielten Wiederherstellungs-Snapshot oder verwendet ihn wieder.

Wenn Sie `openclaw update` verwenden, hängt der genaue Auslöser davon ab, wie OpenClaw installiert ist:

- Quellinstallationen führen während des Update-Ablaufs `openclaw doctor --fix` aus und starten den Gateway danach standardmäßig neu
- Paketmanager-Installationen aktualisieren das Paket, führen einen nicht interaktiven Doctor-Durchlauf aus und verlassen sich dann auf den standardmäßigen Gateway-Neustart, damit der Start die Matrix-Migration abschließen kann
- wenn Sie `openclaw update --no-restart` verwenden, wird die startgestützte Matrix-Migration aufgeschoben, bis Sie später `openclaw doctor --fix` ausführen und den Gateway neu starten

Die automatische Migration umfasst:

- Erstellen oder Wiederverwenden eines Vor-Migrations-Snapshots unter `~/Backups/openclaw-migrations/`
- Wiederverwenden Ihrer zwischengespeicherten Matrix-Anmeldedaten
- Beibehalten derselben Kontoauswahl und `channels.matrix`-Konfiguration
- Verschieben des ältesten flachen Matrix-Sync-Stores an den aktuellen kontobezogenen Speicherort
- Verschieben des ältesten flachen Matrix-Crypto-Stores an den aktuellen kontobezogenen Speicherort, wenn das Zielkonto sicher aufgelöst werden kann
- Extrahieren eines zuvor gespeicherten Entschlüsselungsschlüssels für Matrix-Raumschlüssel-Backups aus dem alten Rust-Crypto-Store, wenn dieser Schlüssel lokal vorhanden ist
- Wiederverwenden der vollständigsten vorhandenen Token-Hash-Speicherwurzel für dasselbe Matrix-Konto, denselben Homeserver und denselben Benutzer, wenn sich das Zugriffstoken später ändert
- Durchsuchen benachbarter Token-Hash-Speicherwurzeln nach ausstehenden Wiederherstellungsmetadaten für verschlüsselten Status, wenn sich das Matrix-Zugriffstoken geändert hat, die Konto-/Geräteidentität aber gleich geblieben ist
- Wiederherstellen gesicherter Raumschlüssel in den neuen Crypto-Store beim nächsten Matrix-Start

Snapshot-Details:

- OpenClaw schreibt nach einem erfolgreichen Snapshot eine Marker-Datei nach `~/.openclaw/matrix/migration-snapshot.json`, damit spätere Start- und Reparaturdurchläufe dasselbe Archiv wiederverwenden können.
- Diese automatischen Matrix-Migrations-Snapshots sichern nur Konfiguration und Status (`includeWorkspace: false`).
- Wenn Matrix nur warnungsrelevanten Migrationsstatus hat, zum Beispiel weil `userId` oder `accessToken` noch fehlt, erstellt OpenClaw den Snapshot noch nicht, da keine Matrix-Änderung umsetzbar ist.
- Wenn der Snapshot-Schritt fehlschlägt, überspringt OpenClaw die Matrix-Migration für diesen Durchlauf, statt Status ohne Wiederherstellungspunkt zu verändern.

Zu Upgrades mit mehreren Konten:

- der älteste flache Matrix-Store (`~/.openclaw/matrix/bot-storage.json` und `~/.openclaw/matrix/crypto/`) stammt aus einem Einzel-Store-Layout, daher kann OpenClaw ihn nur in ein aufgelöstes Matrix-Zielkonto migrieren
- bereits kontobezogene alte Matrix-Stores werden pro konfiguriertem Matrix-Konto erkannt und vorbereitet

## Was die Migration nicht automatisch erledigen kann

Das vorherige öffentliche Matrix-Plugin hat Matrix-Raumschlüssel-Backups **nicht** automatisch erstellt. Es speicherte lokalen Crypto-Status dauerhaft und forderte Geräteverifizierung an, garantierte aber nicht, dass Ihre Raumschlüssel auf dem Homeserver gesichert wurden.

Das bedeutet, dass einige verschlüsselte Installationen nur teilweise migriert werden können.

OpenClaw kann Folgendes nicht automatisch wiederherstellen:

- ausschließlich lokale Raumschlüssel, die nie gesichert wurden
- verschlüsselten Status, wenn das Ziel-Matrix-Konto noch nicht aufgelöst werden kann, weil `homeserver`, `userId` oder `accessToken` noch nicht verfügbar sind
- automatische Migration eines gemeinsam genutzten flachen Matrix-Stores, wenn mehrere Matrix-Konten konfiguriert sind, aber `channels.matrix.defaultAccount` nicht gesetzt ist
- benutzerdefinierte Plugin-Pfadinstallationen, die auf einen Repo-Pfad statt auf das Standard-Matrix-Paket festgelegt sind
- einen fehlenden Wiederherstellungsschlüssel, wenn der alte Store gesicherte Schlüssel hatte, den Entschlüsselungsschlüssel aber nicht lokal aufbewahrt hat

Aktueller Warnungsumfang:

- benutzerdefinierte Matrix-Plugin-Pfadinstallationen werden sowohl beim Gateway-Start als auch von `openclaw doctor` gemeldet

Wenn Ihre alte Installation ausschließlich lokale verschlüsselte Historie hatte, die nie gesichert wurde, können einige ältere verschlüsselte Nachrichten nach dem Upgrade unlesbar bleiben.

## Empfohlener Upgrade-Ablauf

1. Aktualisieren Sie OpenClaw und das Matrix-Plugin normal.
   Bevorzugen Sie einfaches `openclaw update` ohne `--no-restart`, damit der Start die Matrix-Migration sofort abschließen kann.
2. Führen Sie aus:

   ```bash
   openclaw doctor --fix
   ```

   Wenn Matrix umsetzbare Migrationsarbeit hat, erstellt Doctor zuerst den Vor-Migrations-Snapshot oder verwendet ihn wieder und gibt den Archivpfad aus.

3. Starten oder starten Sie den Gateway neu.
4. Prüfen Sie den aktuellen Verifizierungs- und Backup-Status:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Legen Sie den Wiederherstellungsschlüssel für das Matrix-Konto, das Sie reparieren, in einer kontospezifischen Umgebungsvariable ab. Für ein einzelnes Standardkonto ist `MATRIX_RECOVERY_KEY` in Ordnung. Verwenden Sie bei mehreren Konten eine Variable pro Konto, zum Beispiel `MATRIX_RECOVERY_KEY_ASSISTANT`, und fügen Sie dem Befehl `--account assistant` hinzu.

6. Wenn OpenClaw Ihnen mitteilt, dass ein Wiederherstellungsschlüssel benötigt wird, führen Sie den Befehl für das passende Konto aus:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Wenn dieses Gerät noch nicht verifiziert ist, führen Sie den Befehl für das passende Konto aus:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Wenn der Wiederherstellungsschlüssel akzeptiert wird und das Backup verwendbar ist, `Cross-signing verified`
   aber weiterhin `no` ist, schließen Sie die Selbstverifizierung von einem anderen Matrix-Client aus ab:

   ```bash
   openclaw matrix verify self
   ```

   Akzeptieren Sie die Anfrage in einem anderen Matrix-Client, vergleichen Sie die Emojis oder Dezimalzahlen,
   und geben Sie `yes` nur ein, wenn sie übereinstimmen. Der Befehl wird nur dann erfolgreich beendet,
   wenn `Cross-signing verified` zu `yes` wird.

8. Wenn Sie nicht wiederherstellbare alte Historie bewusst aufgeben und eine frische Backup-Basis für künftige Nachrichten möchten, führen Sie aus:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Wenn noch kein serverseitiges Schlüssel-Backup existiert, erstellen Sie eines für künftige Wiederherstellungen:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Wie verschlüsselte Migration funktioniert

Verschlüsselte Migration ist ein zweistufiger Prozess:

1. Der Start oder `openclaw doctor --fix` erstellt den Vor-Migrations-Snapshot oder verwendet ihn wieder, wenn verschlüsselte Migration umsetzbar ist.
2. Der Start oder `openclaw doctor --fix` untersucht den alten Matrix-Crypto-Store über die aktive Matrix-Plugin-Installation.
3. Wenn ein Backup-Entschlüsselungsschlüssel gefunden wird, schreibt OpenClaw ihn in den neuen Wiederherstellungsschlüssel-Ablauf und markiert die Raumschlüssel-Wiederherstellung als ausstehend.
4. Beim nächsten Matrix-Start stellt OpenClaw gesicherte Raumschlüssel automatisch in den neuen Crypto-Store wieder her.

Wenn der alte Store Raumschlüssel meldet, die nie gesichert wurden, warnt OpenClaw, statt vorzugeben, dass die Wiederherstellung erfolgreich war.

## Häufige Meldungen und ihre Bedeutung

### Upgrade- und Erkennungsmeldungen

`Matrix plugin upgraded in place.`

- Bedeutung: Der alte Matrix-Status auf dem Datenträger wurde erkannt und in das aktuelle Layout migriert.
- Vorgehen: nichts, sofern dieselbe Ausgabe nicht auch Warnungen enthält.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat ein Wiederherstellungsarchiv erstellt, bevor Matrix-Status verändert wurde.
- Vorgehen: Bewahren Sie den ausgegebenen Archivpfad auf, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat einen vorhandenen Matrix-Migrations-Snapshot-Marker gefunden und dieses Archiv wiederverwendet, statt ein doppeltes Backup zu erstellen.
- Vorgehen: Bewahren Sie den ausgegebenen Archivpfad auf, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: Alter Matrix-Status ist vorhanden, aber OpenClaw kann ihn keinem aktuellen Matrix-Konto zuordnen, weil Matrix nicht konfiguriert ist.
- Vorgehen: Konfigurieren Sie `channels.matrix`, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie den Gateway neu.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: OpenClaw hat alten Status gefunden, kann die genaue aktuelle Konto-/Gerätewurzel aber noch nicht bestimmen.
- Vorgehen: Starten Sie den Gateway einmal mit einer funktionierenden Matrix-Anmeldung, oder führen Sie `openclaw doctor --fix` erneut aus, nachdem zwischengespeicherte Anmeldedaten vorhanden sind.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen Matrix-Store gefunden, weigert sich aber zu raten, welches benannte Matrix-Konto ihn erhalten soll.
- Vorgehen: Setzen Sie `channels.matrix.defaultAccount` auf das vorgesehene Konto, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie den Gateway neu.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Bedeutung: Der neue kontobezogene Speicherort hat bereits einen Sync- oder Crypto-Store, daher hat OpenClaw ihn nicht automatisch überschrieben.
- Vorgehen: Prüfen Sie, ob das aktuelle Konto das richtige ist, bevor Sie das widersprüchliche Ziel manuell entfernen oder verschieben.

`Failed migrating Matrix legacy sync store (...)` oder `Failed migrating Matrix legacy crypto store (...)`

- Bedeutung: OpenClaw hat versucht, alten Matrix-Status zu verschieben, aber der Dateisystemvorgang ist fehlgeschlagen.
- Vorgehen: Prüfen Sie Dateisystemberechtigungen und Datenträgerstatus, und führen Sie dann `openclaw doctor --fix` erneut aus.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: OpenClaw hat einen alten verschlüsselten Matrix-Store gefunden, aber es gibt keine aktuelle Matrix-Konfiguration, an die er angehängt werden kann.
- Vorgehen: Konfigurieren Sie `channels.matrix`, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie den Gateway neu.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: Der verschlüsselte Store existiert, aber OpenClaw kann nicht sicher entscheiden, zu welchem aktuellen Konto/Gerät er gehört.
- Vorgehen: Starten Sie den Gateway einmal mit einer funktionierenden Matrix-Anmeldung, oder führen Sie `openclaw doctor --fix` erneut aus, nachdem zwischengespeicherte Anmeldedaten verfügbar sind.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen alten Crypto-Store gefunden, weigert sich aber zu raten, welches benannte Matrix-Konto ihn erhalten soll.
- Vorgehen: Setzen Sie `channels.matrix.defaultAccount` auf das vorgesehene Konto, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie den Gateway neu.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Bedeutung: OpenClaw hat alten Matrix-Status erkannt, aber die Migration ist weiterhin durch fehlende Identitäts- oder Anmeldedaten blockiert.
- Vorgehen: Schließen Sie die Matrix-Anmeldung oder Konfigurationseinrichtung ab, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie den Gateway neu.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Bedeutung: OpenClaw hat alten verschlüsselten Matrix-Zustand gefunden, konnte aber den Helper-Einstiegspunkt aus dem Matrix-Plugin, der diesen Speicher normalerweise prüft, nicht laden.
- Vorgehen: Installieren oder reparieren Sie das Matrix-Plugin neu (`openclaw plugins install @openclaw/matrix` oder `openclaw plugins install ./path/to/local/matrix-plugin` für einen Repo-Checkout), und führen Sie anschließend `openclaw doctor --fix` erneut aus oder starten Sie den Gateway neu.
- Wenn npm das OpenClaw-eigene Matrix-Paket als veraltet meldet, verwenden Sie das gebündelte
  Plugin aus einem aktuellen paketierten OpenClaw-Build oder den lokalen Checkout-Pfad, bis
  ein neueres npm-Paket veröffentlicht ist.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Bedeutung: OpenClaw hat einen Helper-Dateipfad gefunden, der aus dem Plugin-Stammverzeichnis ausbricht oder Plugin-Grenzprüfungen nicht besteht, und hat daher den Import verweigert.
- Vorgehen: Installieren Sie das Matrix-Plugin aus einem vertrauenswürdigen Pfad neu, und führen Sie anschließend `openclaw doctor --fix` erneut aus oder starten Sie den Gateway neu.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Bedeutung: OpenClaw hat die Änderung des Matrix-Zustands verweigert, weil zuvor kein Wiederherstellungs-Snapshot erstellt werden konnte.
- Vorgehen: Beheben Sie den Backup-Fehler, und führen Sie anschließend `openclaw doctor --fix` erneut aus oder starten Sie den Gateway neu.

`Failed migrating legacy Matrix client storage: ...`

- Bedeutung: Der clientseitige Matrix-Fallback hat alten flachen Speicher gefunden, aber das Verschieben ist fehlgeschlagen. OpenClaw bricht diesen Fallback nun ab, statt stillschweigend mit einem frischen Speicher zu starten.
- Vorgehen: Prüfen Sie Dateisystemberechtigungen oder Konflikte, lassen Sie den alten Zustand intakt, und versuchen Sie es nach Behebung des Fehlers erneut.

`Matrix is installed from a custom path: ...`

- Bedeutung: Matrix ist auf eine Pfadinstallation fixiert, sodass reguläre Updates es nicht automatisch durch das Standard-Matrix-Paket des Repos ersetzen.
- Vorgehen: Installieren Sie mit `openclaw plugins install @openclaw/matrix` neu, wenn Sie zum Standard-Matrix-Plugin zurückkehren möchten.
- Wenn npm das OpenClaw-eigene Matrix-Paket als veraltet meldet, verwenden Sie das gebündelte
  Plugin aus einem aktuellen paketierten OpenClaw-Build, bis ein neueres npm-Paket
  veröffentlicht ist.

### Wiederherstellungsmeldungen für verschlüsselten Zustand

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Bedeutung: Gesicherte Raumschlüssel wurden erfolgreich in den neuen Kryptospeicher wiederhergestellt.
- Vorgehen: In der Regel ist nichts zu tun.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Bedeutung: Einige alte Raumschlüssel existierten nur im alten lokalen Speicher und wurden nie in das Matrix-Backup hochgeladen.
- Vorgehen: Rechnen Sie damit, dass ein Teil des alten verschlüsselten Verlaufs nicht verfügbar bleibt, sofern Sie diese Schlüssel nicht manuell von einem anderen verifizierten Client wiederherstellen können.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Bedeutung: Ein Backup ist vorhanden, aber OpenClaw konnte den Wiederherstellungsschlüssel nicht automatisch wiederherstellen.
- Vorgehen: Führen Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` aus.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Bedeutung: OpenClaw hat den alten verschlüsselten Speicher gefunden, konnte ihn aber nicht sicher genug prüfen, um die Wiederherstellung vorzubereiten.
- Vorgehen: Führen Sie `openclaw doctor --fix` erneut aus. Wenn dies wiederholt auftritt, lassen Sie das alte Zustandsverzeichnis intakt und stellen Sie es mit einem anderen verifizierten Matrix-Client sowie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` wieder her.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Bedeutung: OpenClaw hat einen Backup-Schlüsselkonflikt erkannt und sich geweigert, die aktuelle Recovery-Key-Datei automatisch zu überschreiben.
- Vorgehen: Prüfen Sie, welcher Wiederherstellungsschlüssel korrekt ist, bevor Sie einen Wiederherstellungsbefehl erneut ausführen.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Bedeutung: Dies ist die harte Grenze des alten Speicherformats.
- Vorgehen: Gesicherte Schlüssel können weiterhin wiederhergestellt werden, aber lokal vorhandener verschlüsselter Verlauf kann unverfügbar bleiben.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Bedeutung: Das neue Plugin hat die Wiederherstellung versucht, aber Matrix hat einen Fehler zurückgegeben.
- Vorgehen: Führen Sie `openclaw matrix verify backup status` aus, und versuchen Sie es bei Bedarf erneut mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Meldungen zur manuellen Wiederherstellung

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Bedeutung: OpenClaw weiß, dass ein Backup-Schlüssel vorhanden sein sollte, aber er ist auf diesem Gerät nicht aktiv.
- Vorgehen: Führen Sie `openclaw matrix verify backup restore` aus, oder setzen Sie `MATRIX_RECOVERY_KEY` und führen Sie bei Bedarf `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` aus.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Bedeutung: Auf diesem Gerät ist derzeit kein Wiederherstellungsschlüssel gespeichert.
- Vorgehen: Setzen Sie `MATRIX_RECOVERY_KEY`, führen Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` aus, und stellen Sie anschließend das Backup wieder her.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Bedeutung: Der gespeicherte Schlüssel stimmt nicht mit dem aktiven Matrix-Backup überein.
- Vorgehen: Setzen Sie `MATRIX_RECOVERY_KEY` auf den korrekten Schlüssel, und führen Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` aus.

Wenn Sie akzeptieren, nicht wiederherstellbaren alten verschlüsselten Verlauf zu verlieren, können Sie stattdessen die
aktuelle Backup-Basislinie mit `openclaw matrix verify backup reset --yes` zurücksetzen. Wenn das
gespeicherte Backup-Geheimnis defekt ist, kann dieses Zurücksetzen auch den geheimen Speicher neu erstellen, damit der
neue Backup-Schlüssel nach dem Neustart korrekt geladen werden kann.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Bedeutung: Das Backup existiert, aber dieses Gerät vertraut der Cross-Signing-Kette noch nicht ausreichend.
- Vorgehen: Setzen Sie `MATRIX_RECOVERY_KEY` und führen Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` aus.

`Matrix recovery key is required`

- Bedeutung: Sie haben einen Wiederherstellungsschritt versucht, ohne einen erforderlichen Wiederherstellungsschlüssel bereitzustellen.
- Vorgehen: Führen Sie den Befehl erneut mit `--recovery-key-stdin` aus, zum Beispiel `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Bedeutung: Der bereitgestellte Schlüssel konnte nicht geparst werden oder entsprach nicht dem erwarteten Format.
- Vorgehen: Versuchen Sie es erneut mit dem exakten Wiederherstellungsschlüssel aus Ihrem Matrix-Client oder Ihrer Recovery-Key-Datei.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Bedeutung: OpenClaw konnte den Wiederherstellungsschlüssel anwenden, aber Matrix hat für dieses Gerät
  noch kein vollständiges Cross-Signing-Identitätsvertrauen hergestellt. Prüfen Sie die
  Befehlsausgabe auf `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` und `Device verified by owner`.
- Vorgehen: Führen Sie `openclaw matrix verify self` aus, nehmen Sie die Anfrage in einem anderen
  Matrix-Client an, vergleichen Sie den SAS, und geben Sie `yes` nur ein, wenn er übereinstimmt. Der
  Befehl wartet auf vollständiges Matrix-Identitätsvertrauen, bevor er Erfolg meldet. Verwenden Sie
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  nur, wenn Sie die aktuelle Cross-Signing-Identität bewusst ersetzen möchten.

`Matrix key backup is not active on this device after loading from secret storage.`

- Bedeutung: Der geheime Speicher hat auf diesem Gerät keine aktive Backup-Sitzung erzeugt.
- Vorgehen: Verifizieren Sie zuerst das Gerät, und prüfen Sie anschließend erneut mit `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Bedeutung: Dieses Gerät kann erst aus dem geheimen Speicher wiederherstellen, nachdem die Geräteverifizierung abgeschlossen ist.
- Vorgehen: Führen Sie zuerst `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` aus.

### Meldungen zur benutzerdefinierten Plugin-Installation

`Matrix is installed from a custom path that no longer exists: ...`

- Bedeutung: Ihr Plugin-Installationsdatensatz verweist auf einen lokalen Pfad, der nicht mehr existiert.
- Vorgehen: Installieren Sie mit `openclaw plugins install @openclaw/matrix` neu, oder, wenn Sie aus einem Repo-Checkout heraus arbeiten, mit `openclaw plugins install ./path/to/local/matrix-plugin`.
- Wenn npm das OpenClaw-eigene Matrix-Paket als veraltet meldet, verwenden Sie das gebündelte
  Plugin aus einem aktuellen paketierten OpenClaw-Build oder den lokalen Checkout-Pfad, bis
  ein neueres npm-Paket veröffentlicht ist.

## Wenn der verschlüsselte Verlauf weiterhin nicht zurückkehrt

Führen Sie diese Prüfungen der Reihe nach aus:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Wenn das Backup erfolgreich wiederhergestellt wird, aber in einigen alten Räumen weiterhin Verlauf fehlt, wurden diese fehlenden Schlüssel wahrscheinlich nie vom vorherigen Plugin gesichert.

## Wenn Sie für künftige Nachrichten neu beginnen möchten

Wenn Sie akzeptieren, nicht wiederherstellbaren alten verschlüsselten Verlauf zu verlieren und nur künftig eine saubere Backup-Basislinie möchten, führen Sie diese Befehle der Reihe nach aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Wenn das Gerät danach weiterhin nicht verifiziert ist, schließen Sie die Verifizierung über Ihren Matrix-Client ab, indem Sie die SAS-Emoji oder Dezimalcodes vergleichen und bestätigen, dass sie übereinstimmen.

## Verwandte Themen

- [Matrix](/de/channels/matrix): Kanaleinrichtung und Konfiguration.
- [Matrix-Push-Regeln](/de/channels/matrix-push-rules): Benachrichtigungsrouting.
- [Doctor](/de/gateway/doctor): Integritätsprüfung und automatischer Migrationstrigger.
- [Migrationsleitfaden](/de/install/migrating): alle Migrationspfade (Maschinenumzüge, systemübergreifende Importe).
- [Plugins](/de/tools/plugin): Plugin-Installation und Registrierung.

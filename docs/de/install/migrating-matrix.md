---
read_when:
    - Eine bestehende Matrix-Installation aktualisieren
    - Verschlüsselten Matrix-Verlauf und Gerätezustand migrieren
summary: Wie OpenClaw das vorherige Matrix-Plugin direkt aktualisiert, einschließlich der Grenzen bei der Wiederherstellung verschlüsselter Zustände und manueller Wiederherstellungsschritte.
title: Matrix-Migration
x-i18n:
    generated_at: "2026-04-26T11:33:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

Diese Seite behandelt Upgrades vom vorherigen öffentlichen Plugin `matrix` auf die aktuelle Implementierung.

Für die meisten Benutzer erfolgt das Upgrade direkt:

- das Plugin bleibt `@openclaw/matrix`
- der Kanal bleibt `matrix`
- Ihre Konfiguration bleibt unter `channels.matrix`
- zwischengespeicherte Anmeldedaten bleiben unter `~/.openclaw/credentials/matrix/`
- Laufzeitzustand bleibt unter `~/.openclaw/matrix/`

Sie müssen weder Konfigurationsschlüssel umbenennen noch das Plugin unter einem neuen Namen neu installieren.

## Was die Migration automatisch erledigt

Wenn das Gateway startet und wenn Sie [`openclaw doctor --fix`](/de/gateway/doctor) ausführen, versucht OpenClaw, alten Matrix-Zustand automatisch zu reparieren.
Bevor ein relevanter Matrix-Migrationsschritt Zustand auf der Festplatte verändert, erstellt oder verwendet OpenClaw erneut einen gezielten Wiederherstellungs-Snapshot.

Wenn Sie `openclaw update` verwenden, hängt der genaue Auslöser davon ab, wie OpenClaw installiert ist:

- Quellinstallationen führen während des Update-Ablaufs `openclaw doctor --fix` aus und starten das Gateway standardmäßig anschließend neu
- Installationen über Paketmanager aktualisieren das Paket, führen einen nicht interaktiven Doctor-Durchlauf aus und verlassen sich dann auf den standardmäßigen Gateway-Neustart, damit der Start die Matrix-Migration abschließen kann
- wenn Sie `openclaw update --no-restart` verwenden, wird die startgestützte Matrix-Migration verschoben, bis Sie später `openclaw doctor --fix` ausführen und das Gateway neu starten

Die automatische Migration umfasst:

- Erstellen oder Wiederverwenden eines Snapshots vor der Migration unter `~/Backups/openclaw-migrations/`
- Wiederverwenden Ihrer zwischengespeicherten Matrix-Anmeldedaten
- Beibehalten derselben Kontoauswahl und derselben `channels.matrix`-Konfiguration
- Verschieben des ältesten flachen Matrix-Sync-Stores in den aktuellen kontobezogenen Speicherort
- Verschieben des ältesten flachen Matrix-Krypto-Stores in den aktuellen kontobezogenen Speicherort, wenn das Zielkonto sicher aufgelöst werden kann
- Extrahieren eines zuvor gespeicherten Entschlüsselungsschlüssels für Matrix-Raumschlüssel-Backups aus dem alten Rust-Krypto-Store, wenn dieser Schlüssel lokal vorhanden ist
- Wiederverwenden des vollständigsten vorhandenen Token-Hash-Speicher-Roots für dasselbe Matrix-Konto, denselben Homeserver und denselben Benutzer, wenn sich das Access Token später ändert
- Scannen benachbarter Token-Hash-Speicher-Roots nach ausstehenden Metadaten zur Wiederherstellung verschlüsselter Zustände, wenn sich das Matrix-Access-Token geändert hat, die Konto-/Geräteidentität aber gleich geblieben ist
- Wiederherstellen gesicherter Raumschlüssel in den neuen Krypto-Store beim nächsten Matrix-Start

Details zum Snapshot:

- OpenClaw schreibt nach einem erfolgreichen Snapshot eine Marker-Datei nach `~/.openclaw/matrix/migration-snapshot.json`, damit spätere Start- und Reparaturdurchläufe dasselbe Archiv wiederverwenden können.
- Diese automatischen Matrix-Migrations-Snapshots sichern nur Konfiguration + Zustand (`includeWorkspace: false`).
- Wenn Matrix nur einen reinen Warnzustand bei der Migration hat, zum Beispiel weil `userId` oder `accessToken` noch fehlen, erstellt OpenClaw den Snapshot noch nicht, weil noch keine Matrix-Mutation ausführbar ist.
- Wenn der Snapshot-Schritt fehlschlägt, überspringt OpenClaw die Matrix-Migration für diesen Lauf, statt Zustand ohne Wiederherstellungspunkt zu verändern.

Zu Upgrades mit mehreren Konten:

- der älteste flache Matrix-Store (`~/.openclaw/matrix/bot-storage.json` und `~/.openclaw/matrix/crypto/`) stammt aus einem Layout mit nur einem Store, daher kann OpenClaw ihn nur in ein aufgelöstes Zielkonto von Matrix migrieren
- bereits kontobezogene ältere Matrix-Stores werden pro konfiguriertem Matrix-Konto erkannt und vorbereitet

## Was die Migration nicht automatisch erledigen kann

Das vorherige öffentliche Matrix-Plugin hat **nicht** automatisch Matrix-Raumschlüssel-Backups erstellt. Es hat lokalen Krypto-Zustand gespeichert und Geräteverifizierung angefordert, aber es hat nicht garantiert, dass Ihre Raumschlüssel auf dem Homeserver gesichert wurden.

Das bedeutet, dass manche verschlüsselten Installationen nur teilweise migriert werden können.

OpenClaw kann nicht automatisch wiederherstellen:

- nur lokal vorhandene Raumschlüssel, die nie gesichert wurden
- verschlüsselten Zustand, wenn das Zielkonto noch nicht aufgelöst werden kann, weil `homeserver`, `userId` oder `accessToken` noch nicht verfügbar sind
- automatische Migration eines gemeinsam genutzten flachen Matrix-Stores, wenn mehrere Matrix-Konten konfiguriert sind, aber `channels.matrix.defaultAccount` nicht gesetzt ist
- Installationen über benutzerdefinierte Plugin-Pfade, die an einen Repo-Pfad statt an das Standard-Matrix-Paket gebunden sind
- einen fehlenden Wiederherstellungsschlüssel, wenn der alte Store gesicherte Schlüssel hatte, den Entschlüsselungsschlüssel aber nicht lokal gespeichert hat

Aktueller Warnungsumfang:

- benutzerdefinierte Matrix-Plugin-Pfadinstallationen werden sowohl beim Gateway-Start als auch von `openclaw doctor` angezeigt

Wenn Ihre alte Installation nur lokalen verschlüsselten Verlauf hatte, der nie gesichert wurde, können einige ältere verschlüsselte Nachrichten nach dem Upgrade weiterhin unlesbar bleiben.

## Empfohlener Upgrade-Ablauf

1. Aktualisieren Sie OpenClaw und das Matrix-Plugin wie gewohnt.
   Bevorzugen Sie einfaches `openclaw update` ohne `--no-restart`, damit der Start die Matrix-Migration sofort abschließen kann.
2. Führen Sie aus:

   ```bash
   openclaw doctor --fix
   ```

   Wenn Matrix ausführbare Migrationsarbeit hat, erstellt oder verwendet doctor zuerst den Snapshot vor der Migration erneut und gibt den Archivpfad aus.

3. Starten oder starten Sie das Gateway neu.
4. Prüfen Sie den aktuellen Verifizierungs- und Backup-Status:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Legen Sie den Wiederherstellungsschlüssel für das Matrix-Konto, das Sie reparieren, in einer kontospezifischen Umgebungsvariable ab. Für ein einzelnes Standardkonto ist `MATRIX_RECOVERY_KEY` ausreichend. Für mehrere Konten verwenden Sie eine Variable pro Konto, zum Beispiel `MATRIX_RECOVERY_KEY_ASSISTANT`, und fügen `--account assistant` zum Befehl hinzu.

6. Wenn OpenClaw angibt, dass ein Wiederherstellungsschlüssel benötigt wird, führen Sie den Befehl für das passende Konto aus:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Wenn dieses Gerät noch nicht verifiziert ist, führen Sie den Befehl für das passende Konto aus:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Wenn der Wiederherstellungsschlüssel akzeptiert wird und das Backup nutzbar ist, aber `Cross-signing verified`
   weiterhin `no` ist, schließen Sie die Selbstverifizierung von einem anderen Matrix-Client aus ab:

   ```bash
   openclaw matrix verify self
   ```

   Akzeptieren Sie die Anfrage in einem anderen Matrix-Client, vergleichen Sie die Emoji oder Dezimalzahlen
   und geben Sie `yes` nur ein, wenn sie übereinstimmen. Der Befehl endet nur dann erfolgreich,
   wenn `Cross-signing verified` zu `yes` wird.

8. Wenn Sie absichtlich nicht wiederherstellbaren alten Verlauf aufgeben und eine neue Backup-Basis für zukünftige Nachrichten möchten, führen Sie aus:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Wenn noch kein serverseitiges Schlüssel-Backup existiert, erstellen Sie eines für zukünftige Wiederherstellungen:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Wie die verschlüsselte Migration funktioniert

Die verschlüsselte Migration ist ein zweistufiger Prozess:

1. Beim Start oder bei `openclaw doctor --fix` wird der Snapshot vor der Migration erstellt oder wiederverwendet, wenn eine verschlüsselte Migration ausführbar ist.
2. Beim Start oder bei `openclaw doctor --fix` wird der alte Matrix-Krypto-Store über die aktive Matrix-Plugin-Installation geprüft.
3. Wenn ein Backup-Entschlüsselungsschlüssel gefunden wird, schreibt OpenClaw ihn in den neuen Ablauf für Wiederherstellungsschlüssel und markiert die Wiederherstellung von Raumschlüsseln als ausstehend.
4. Beim nächsten Matrix-Start stellt OpenClaw gesicherte Raumschlüssel automatisch im neuen Krypto-Store wieder her.

Wenn der alte Store Raumschlüssel meldet, die nie gesichert wurden, warnt OpenClaw, statt so zu tun, als sei die Wiederherstellung erfolgreich gewesen.

## Häufige Meldungen und ihre Bedeutung

### Upgrade- und Erkennungsmeldungen

`Matrix plugin upgraded in place.`

- Bedeutung: Der alte Matrix-Zustand auf der Festplatte wurde erkannt und in das aktuelle Layout migriert.
- Was zu tun ist: nichts, sofern dieselbe Ausgabe nicht auch Warnungen enthält.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat ein Wiederherstellungsarchiv erstellt, bevor Matrix-Zustand verändert wurde.
- Was zu tun ist: Behalten Sie den ausgegebenen Archivpfad, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat einen vorhandenen Marker für einen Matrix-Migrations-Snapshot gefunden und dieses Archiv wiederverwendet, statt ein doppeltes Backup zu erstellen.
- Was zu tun ist: Behalten Sie den ausgegebenen Archivpfad, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: Es existiert alter Matrix-Zustand, aber OpenClaw kann ihn keinem aktuellen Matrix-Konto zuordnen, weil Matrix noch nicht konfiguriert ist.
- Was zu tun ist: Konfigurieren Sie `channels.matrix` und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: OpenClaw hat alten Zustand gefunden, kann aber die genaue aktuelle Konto-/Gerätewurzel noch nicht bestimmen.
- Was zu tun ist: Starten Sie das Gateway einmal mit einem funktionierenden Matrix-Login oder führen Sie `openclaw doctor --fix` erneut aus, nachdem zwischengespeicherte Anmeldedaten vorhanden sind.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen Matrix-Store gefunden, weigert sich aber zu raten, welches benannte Matrix-Konto ihn erhalten soll.
- Was zu tun ist: Setzen Sie `channels.matrix.defaultAccount` auf das vorgesehene Konto und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Bedeutung: Der neue kontobezogene Speicherort enthält bereits einen Sync- oder Krypto-Store, daher hat OpenClaw ihn nicht automatisch überschrieben.
- Was zu tun ist: Verifizieren Sie, dass das aktuelle Konto das richtige ist, bevor Sie das kollidierende Ziel manuell entfernen oder verschieben.

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- Bedeutung: OpenClaw hat versucht, alten Matrix-Zustand zu verschieben, aber die Dateisystemoperation ist fehlgeschlagen.
- Was zu tun ist: Prüfen Sie Dateisystemberechtigungen und den Festplattenzustand und führen Sie dann `openclaw doctor --fix` erneut aus.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: OpenClaw hat einen alten verschlüsselten Matrix-Store gefunden, aber es gibt keine aktuelle Matrix-Konfiguration, an die er angehängt werden kann.
- Was zu tun ist: Konfigurieren Sie `channels.matrix` und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: Der verschlüsselte Store existiert, aber OpenClaw kann nicht sicher entscheiden, zu welchem aktuellen Konto/Gerät er gehört.
- Was zu tun ist: Starten Sie das Gateway einmal mit einem funktionierenden Matrix-Login oder führen Sie `openclaw doctor --fix` erneut aus, nachdem zwischengespeicherte Anmeldedaten verfügbar sind.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen älteren Krypto-Store gefunden, weigert sich aber zu raten, welches benannte Matrix-Konto ihn erhalten soll.
- Was zu tun ist: Setzen Sie `channels.matrix.defaultAccount` auf das vorgesehene Konto und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Bedeutung: OpenClaw hat alten Matrix-Zustand erkannt, aber die Migration ist noch durch fehlende Identitäts- oder Anmeldedaten blockiert.
- Was zu tun ist: Schließen Sie Matrix-Login oder Konfiguration ab und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Bedeutung: OpenClaw hat alten verschlüsselten Matrix-Zustand gefunden, konnte aber den Helper-Entrypoint aus dem Matrix-Plugin nicht laden, der diesen Store normalerweise prüft.
- Was zu tun ist: Installieren Sie das Matrix-Plugin neu oder reparieren Sie es (`openclaw plugins install @openclaw/matrix`, oder `openclaw plugins install ./path/to/local/matrix-plugin` für einen Repo-Checkout), und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Bedeutung: OpenClaw hat einen Helper-Dateipfad gefunden, der aus dem Plugin-Root herausführt oder Plugin-Grenzprüfungen nicht besteht, und hat deshalb den Import verweigert.
- Was zu tun ist: Installieren Sie das Matrix-Plugin aus einem vertrauenswürdigen Pfad neu und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Bedeutung: OpenClaw hat sich geweigert, Matrix-Zustand zu verändern, weil es den Wiederherstellungs-Snapshot nicht zuerst erstellen konnte.
- Was zu tun ist: Beheben Sie den Backup-Fehler und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Failed migrating legacy Matrix client storage: ...`

- Bedeutung: Der clientseitige Matrix-Fallback hat alten flachen Speicher gefunden, aber das Verschieben ist fehlgeschlagen. OpenClaw bricht diesen Fallback jetzt ab, statt stillschweigend mit einem neuen Store zu starten.
- Was zu tun ist: Prüfen Sie Dateisystemberechtigungen oder Konflikte, lassen Sie den alten Zustand intakt und versuchen Sie es nach Behebung des Fehlers erneut.

`Matrix is installed from a custom path: ...`

- Bedeutung: Matrix ist an eine Pfadinstallation gebunden, daher ersetzen Mainline-Updates es nicht automatisch durch das Standard-Matrix-Paket des Repos.
- Was zu tun ist: Installieren Sie es mit `openclaw plugins install @openclaw/matrix` neu, wenn Sie zum Standard-Matrix-Plugin zurückkehren möchten.

### Meldungen zur Wiederherstellung verschlüsselter Zustände

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Bedeutung: Gesicherte Raumschlüssel wurden erfolgreich im neuen Krypto-Store wiederhergestellt.
- Was zu tun ist: normalerweise nichts.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Bedeutung: Einige alte Raumschlüssel existierten nur im alten lokalen Store und wurden nie in das Matrix-Backup hochgeladen.
- Was zu tun ist: Rechnen Sie damit, dass ein Teil des alten verschlüsselten Verlaufs nicht verfügbar bleibt, sofern Sie diese Schlüssel nicht manuell von einem anderen verifizierten Client wiederherstellen können.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Bedeutung: Ein Backup existiert, aber OpenClaw konnte den Wiederherstellungsschlüssel nicht automatisch wiederherstellen.
- Was zu tun ist: Führen Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` aus.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Bedeutung: OpenClaw hat den alten verschlüsselten Store gefunden, konnte ihn aber nicht sicher genug prüfen, um die Wiederherstellung vorzubereiten.
- Was zu tun ist: Führen Sie `openclaw doctor --fix` erneut aus. Wenn es wiederholt auftritt, lassen Sie das alte Zustandsverzeichnis intakt und stellen Sie mithilfe eines anderen verifizierten Matrix-Clients plus `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` wieder her.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Bedeutung: OpenClaw hat einen Konflikt bei Backup-Schlüsseln erkannt und sich geweigert, die aktuelle Datei mit dem Wiederherstellungsschlüssel automatisch zu überschreiben.
- Was zu tun ist: Verifizieren Sie, welcher Wiederherstellungsschlüssel korrekt ist, bevor Sie einen Wiederherstellungsbefehl erneut ausführen.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Bedeutung: Das ist die harte Grenze des alten Speicherformats.
- Was zu tun ist: Gesicherte Schlüssel können weiterhin wiederhergestellt werden, aber nur lokal vorhandener verschlüsselter Verlauf kann unverfügbar bleiben.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Bedeutung: Das neue Plugin hat eine Wiederherstellung versucht, aber Matrix hat einen Fehler zurückgegeben.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup status` aus und versuchen Sie es dann bei Bedarf erneut mit `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Meldungen zur manuellen Wiederherstellung

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Bedeutung: OpenClaw weiß, dass Sie einen Backup-Schlüssel haben sollten, aber er ist auf diesem Gerät nicht aktiv.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup restore` aus, oder setzen Sie `MATRIX_RECOVERY_KEY` und führen Sie bei Bedarf `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` aus.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Bedeutung: Dieses Gerät hat den Wiederherstellungsschlüssel derzeit nicht gespeichert.
- Was zu tun ist: Setzen Sie `MATRIX_RECOVERY_KEY`, führen Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` aus und stellen Sie dann das Backup wieder her.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Bedeutung: Der gespeicherte Schlüssel stimmt nicht mit dem aktiven Matrix-Backup überein.
- Was zu tun ist: Setzen Sie `MATRIX_RECOVERY_KEY` auf den richtigen Schlüssel und führen Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` aus.

Wenn Sie akzeptieren, dass nicht wiederherstellbarer alter verschlüsselter Verlauf verloren geht, können Sie stattdessen die
aktuelle Backup-Basis mit `openclaw matrix verify backup reset --yes` zurücksetzen. Wenn das
gespeicherte Backup-Secret defekt ist, kann dieses Zurücksetzen auch den Secret-Speicher neu erstellen, damit der
neue Backup-Schlüssel nach dem Neustart korrekt geladen werden kann.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Bedeutung: Das Backup existiert, aber dieses Gerät vertraut der Cross-Signing-Kette noch nicht stark genug.
- Was zu tun ist: Setzen Sie `MATRIX_RECOVERY_KEY` und führen Sie `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` aus.

`Matrix recovery key is required`

- Bedeutung: Sie haben einen Wiederherstellungsschritt versucht, ohne einen Wiederherstellungsschlüssel anzugeben, obwohl einer erforderlich war.
- Was zu tun ist: Führen Sie den Befehl erneut mit `--recovery-key-stdin` aus, zum Beispiel `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Bedeutung: Der angegebene Schlüssel konnte nicht geparst werden oder entsprach nicht dem erwarteten Format.
- Was zu tun ist: Versuchen Sie es erneut mit dem exakten Wiederherstellungsschlüssel aus Ihrem Matrix-Client oder Ihrer Datei mit dem Wiederherstellungsschlüssel.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Bedeutung: OpenClaw konnte den Wiederherstellungsschlüssel anwenden, aber Matrix hat für dieses Gerät weiterhin
  kein vollständiges Cross-Signing-Vertrauen hergestellt. Prüfen Sie die Befehlsausgabe auf
  `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` und `Device verified by owner`.
- Was zu tun ist: Führen Sie `openclaw matrix verify self` aus, akzeptieren Sie die Anfrage in einem anderen
  Matrix-Client, vergleichen Sie die SAS und geben Sie `yes` nur ein, wenn sie übereinstimmt. Der
  Befehl wartet auf vollständiges Matrix-Identitätsvertrauen, bevor er Erfolg meldet. Verwenden Sie
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  nur dann, wenn Sie die aktuelle Cross-Signing-Identität absichtlich ersetzen möchten.

`Matrix key backup is not active on this device after loading from secret storage.`

- Bedeutung: Der Secret-Speicher hat auf diesem Gerät keine aktive Backup-Sitzung erzeugt.
- Was zu tun ist: Verifizieren Sie zuerst das Gerät und prüfen Sie dann erneut mit `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Bedeutung: Dieses Gerät kann nicht aus dem Secret-Speicher wiederherstellen, bis die Geräteverifizierung abgeschlossen ist.
- Was zu tun ist: Führen Sie zuerst `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` aus.

### Meldungen zu benutzerdefinierten Plugin-Installationen

`Matrix is installed from a custom path that no longer exists: ...`

- Bedeutung: Ihr Plugin-Installationsdatensatz verweist auf einen lokalen Pfad, der nicht mehr existiert.
- Was zu tun ist: Installieren Sie mit `openclaw plugins install @openclaw/matrix` neu, oder falls Sie aus einem Repo-Checkout arbeiten, mit `openclaw plugins install ./path/to/local/matrix-plugin`.

## Wenn verschlüsselter Verlauf immer noch nicht zurückkommt

Führen Sie diese Prüfungen in der angegebenen Reihenfolge aus:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Wenn das Backup erfolgreich wiederhergestellt wird, aber in einigen alten Räumen weiterhin Verlauf fehlt, wurden diese fehlenden Schlüssel vom vorherigen Plugin wahrscheinlich nie gesichert.

## Wenn Sie für zukünftige Nachrichten neu beginnen möchten

Wenn Sie akzeptieren, dass nicht wiederherstellbarer alter verschlüsselter Verlauf verloren geht, und künftig nur eine saubere Backup-Basis möchten, führen Sie diese Befehle in der angegebenen Reihenfolge aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Wenn das Gerät danach noch nicht verifiziert ist, schließen Sie die Verifizierung von Ihrem Matrix-Client aus ab, indem Sie die SAS-Emoji oder Dezimalcodes vergleichen und bestätigen, dass sie übereinstimmen.

## Verwandte Seiten

- [Matrix](/de/channels/matrix)
- [Doctor](/de/gateway/doctor)
- [Migrieren](/de/install/migrating)
- [Plugins](/de/tools/plugin)

---
read_when:
    - Eine bestehende Matrix-Installation aktualisieren
    - Verschlüsselten Matrix-Verlauf und Gerätestatus migrieren
summary: Wie OpenClaw das vorherige Matrix-Plugin direkt aktualisiert, einschließlich Grenzen bei der Wiederherstellung verschlüsselter Zustände und manueller Wiederherstellungsschritte.
title: Matrix-Migration
x-i18n:
    generated_at: "2026-04-25T13:49:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

Diese Seite behandelt Upgrades vom vorherigen öffentlichen Plugin `matrix` zur aktuellen Implementierung.

Für die meisten Benutzer erfolgt das Upgrade direkt vor Ort:

- das Plugin bleibt `@openclaw/matrix`
- der Kanal bleibt `matrix`
- Ihre Konfiguration bleibt unter `channels.matrix`
- zwischengespeicherte Anmeldedaten bleiben unter `~/.openclaw/credentials/matrix/`
- Laufzeitstatus bleibt unter `~/.openclaw/matrix/`

Sie müssen keine Konfigurationsschlüssel umbenennen oder das Plugin unter einem neuen Namen neu installieren.

## Was die Migration automatisch erledigt

Wenn das Gateway startet und wenn Sie [`openclaw doctor --fix`](/de/gateway/doctor) ausführen, versucht OpenClaw, alten Matrix-Status automatisch zu reparieren.
Bevor ein umsetzbarer Matrix-Migrationsschritt den Status auf dem Datenträger verändert, erstellt oder verwendet OpenClaw einen gezielten Wiederherstellungs-Snapshot erneut.

Wenn Sie `openclaw update` verwenden, hängt der genaue Auslöser davon ab, wie OpenClaw installiert ist:

- Source-Installationen führen während des Update-Ablaufs `openclaw doctor --fix` aus und starten das Gateway standardmäßig anschließend neu
- Paketmanager-Installationen aktualisieren das Paket, führen einen nicht interaktiven Doctor-Durchlauf aus und verlassen sich dann auf den standardmäßigen Gateway-Neustart, damit der Start die Matrix-Migration abschließen kann
- wenn Sie `openclaw update --no-restart` verwenden, wird die startgestützte Matrix-Migration aufgeschoben, bis Sie später `openclaw doctor --fix` ausführen und das Gateway neu starten

Die automatische Migration umfasst:

- Erstellen oder Wiederverwenden eines Snapshots vor der Migration unter `~/Backups/openclaw-migrations/`
- Wiederverwenden Ihrer zwischengespeicherten Matrix-Anmeldedaten
- Beibehalten derselben Kontoauswahl und derselben Konfiguration `channels.matrix`
- Verschieben des ältesten flachen Matrix-Sync-Stores an den aktuellen kontobezogenen Speicherort
- Verschieben des ältesten flachen Matrix-Crypto-Stores an den aktuellen kontobezogenen Speicherort, wenn das Zielkonto sicher aufgelöst werden kann
- Extrahieren eines zuvor gespeicherten Entschlüsselungsschlüssels für Matrix-Raumschlüssel-Backups aus dem alten Rust-Crypto-Store, wenn dieser Schlüssel lokal vorhanden ist
- Wiederverwenden des vollständigsten vorhandenen Token-Hash-Speicher-Roots für dasselbe Matrix-Konto, denselben Homeserver und denselben Benutzer, wenn sich das Zugriffstoken später ändert
- Durchsuchen benachbarter Token-Hash-Speicher-Roots nach ausstehenden Metadaten zur Wiederherstellung verschlüsselter Zustände, wenn sich das Matrix-Zugriffstoken geändert hat, die Konto-/Geräteidentität aber gleich geblieben ist
- Wiederherstellen gesicherter Raumschlüssel in den neuen Crypto-Store beim nächsten Matrix-Start

Details zum Snapshot:

- OpenClaw schreibt nach einem erfolgreichen Snapshot eine Markierungsdatei unter `~/.openclaw/matrix/migration-snapshot.json`, sodass spätere Start- und Reparaturdurchläufe dasselbe Archiv wiederverwenden können.
- Diese automatischen Matrix-Migrations-Snapshots sichern nur Konfiguration + Status (`includeWorkspace: false`).
- Wenn Matrix nur einen reinen Warnzustand für die Migration hat, zum Beispiel weil `userId` oder `accessToken` noch fehlen, erstellt OpenClaw den Snapshot noch nicht, weil keine Matrix-Mutation umsetzbar ist.
- Wenn der Snapshot-Schritt fehlschlägt, überspringt OpenClaw die Matrix-Migration für diesen Lauf, statt den Status ohne Wiederherstellungspunkt zu verändern.

Zu Upgrades mit mehreren Konten:

- der älteste flache Matrix-Store (`~/.openclaw/matrix/bot-storage.json` und `~/.openclaw/matrix/crypto/`) stammt aus einem Layout mit einem einzigen Store, daher kann OpenClaw ihn nur in ein aufgelöstes Matrix-Konto migrieren
- bereits kontobezogene ältere Matrix-Stores werden pro konfiguriertem Matrix-Konto erkannt und vorbereitet

## Was die Migration nicht automatisch erledigen kann

Das vorherige öffentliche Matrix-Plugin hat **nicht** automatisch Backups von Matrix-Raumschlüsseln erstellt. Es hat lokalen Crypto-Status gespeichert und Geräteverifizierung angefordert, aber nicht garantiert, dass Ihre Raumschlüssel auf dem Homeserver gesichert wurden.

Das bedeutet, dass manche verschlüsselten Installationen nur teilweise migriert werden können.

OpenClaw kann Folgendes nicht automatisch wiederherstellen:

- rein lokale Raumschlüssel, die nie gesichert wurden
- verschlüsselten Zustand, wenn das Ziel-Matrix-Konto noch nicht aufgelöst werden kann, weil `homeserver`, `userId` oder `accessToken` noch nicht verfügbar sind
- automatische Migration eines gemeinsam genutzten flachen Matrix-Stores, wenn mehrere Matrix-Konten konfiguriert sind, aber `channels.matrix.defaultAccount` nicht gesetzt ist
- benutzerdefinierte Plugin-Pfad-Installationen, die auf einen Repo-Pfad statt auf das Standard-Matrix-Paket festgelegt sind
- einen fehlenden Wiederherstellungsschlüssel, wenn der alte Store gesicherte Schlüssel hatte, den Entschlüsselungsschlüssel aber nicht lokal behalten hat

Aktueller Warnbereich:

- benutzerdefinierte Matrix-Plugin-Pfad-Installationen werden sowohl beim Gateway-Start als auch von `openclaw doctor` angezeigt

Wenn Ihre alte Installation rein lokalen verschlüsselten Verlauf hatte, der nie gesichert wurde, können einige ältere verschlüsselte Nachrichten nach dem Upgrade unlesbar bleiben.

## Empfohlener Upgrade-Ablauf

1. Aktualisieren Sie OpenClaw und das Matrix-Plugin normal.
   Bevorzugen Sie einfaches `openclaw update` ohne `--no-restart`, damit der Start die Matrix-Migration sofort abschließen kann.
2. Führen Sie aus:

   ```bash
   openclaw doctor --fix
   ```

   Wenn Matrix umsetzbare Migrationsarbeit hat, erstellt oder verwendet Doctor zuerst den Snapshot vor der Migration erneut und gibt den Archivpfad aus.

3. Starten oder starten Sie das Gateway neu.
4. Prüfen Sie den aktuellen Verifizierungs- und Backup-Status:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Wenn OpenClaw Ihnen mitteilt, dass ein Wiederherstellungsschlüssel benötigt wird, führen Sie aus:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Wenn dieses Gerät noch nicht verifiziert ist, führen Sie aus:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   Wenn der Wiederherstellungsschlüssel akzeptiert wird und das Backup nutzbar ist, aber `Cross-signing verified`
   weiterhin `no` ist, schließen Sie die Selbstverifizierung in einem anderen Matrix-Client ab:

   ```bash
   openclaw matrix verify self
   ```

   Akzeptieren Sie die Anfrage in einem anderen Matrix-Client, vergleichen Sie die Emojis oder Dezimalzahlen
   und geben Sie `yes` nur ein, wenn sie übereinstimmen. Der Befehl endet nur dann erfolgreich,
   wenn `Cross-signing verified` zu `yes` wird.

7. Wenn Sie bewusst nicht wiederherstellbaren alten Verlauf aufgeben und für künftige Nachrichten eine neue Backup-Basis erstellen möchten, führen Sie aus:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Wenn noch kein serverseitiges Schlüssel-Backup vorhanden ist, erstellen Sie eines für künftige Wiederherstellungen:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Wie die verschlüsselte Migration funktioniert

Die verschlüsselte Migration ist ein zweistufiger Prozess:

1. Beim Start oder mit `openclaw doctor --fix` wird der Snapshot vor der Migration erstellt oder erneut verwendet, wenn die verschlüsselte Migration umsetzbar ist.
2. Beim Start oder mit `openclaw doctor --fix` wird der alte Matrix-Crypto-Store über die aktive Matrix-Plugin-Installation geprüft.
3. Wenn ein Backup-Entschlüsselungsschlüssel gefunden wird, schreibt OpenClaw ihn in den neuen Ablauf für Wiederherstellungsschlüssel und markiert die Wiederherstellung von Raumschlüsseln als ausstehend.
4. Beim nächsten Matrix-Start stellt OpenClaw gesicherte Raumschlüssel automatisch im neuen Crypto-Store wieder her.

Wenn der alte Store Raumschlüssel meldet, die nie gesichert wurden, warnt OpenClaw, statt vorzutäuschen, dass die Wiederherstellung erfolgreich war.

## Häufige Meldungen und ihre Bedeutung

### Upgrade- und Erkennungsmeldungen

`Matrix plugin upgraded in place.`

- Bedeutung: Der alte Matrix-Status auf dem Datenträger wurde erkannt und in das aktuelle Layout migriert.
- Was zu tun ist: nichts, außer wenn dieselbe Ausgabe auch Warnungen enthält.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat ein Wiederherstellungsarchiv erstellt, bevor Matrix-Status verändert wurde.
- Was zu tun ist: Bewahren Sie den ausgegebenen Archivpfad auf, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat eine vorhandene Markierung für einen Matrix-Migrations-Snapshot gefunden und dieses Archiv wiederverwendet, statt ein doppeltes Backup zu erstellen.
- Was zu tun ist: Bewahren Sie den ausgegebenen Archivpfad auf, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: Alter Matrix-Status ist vorhanden, aber OpenClaw kann ihn keinem aktuellen Matrix-Konto zuordnen, weil Matrix nicht konfiguriert ist.
- Was zu tun ist: Konfigurieren Sie `channels.matrix`, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: OpenClaw hat alten Status gefunden, kann aber die genaue aktuelle Konto-/Gerätewurzel noch nicht bestimmen.
- Was zu tun ist: Starten Sie das Gateway einmal mit einem funktionierenden Matrix-Login oder führen Sie `openclaw doctor --fix` erneut aus, nachdem zwischengespeicherte Anmeldedaten vorhanden sind.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen Matrix-Store gefunden, weigert sich aber zu raten, welches benannte Matrix-Konto ihn erhalten soll.
- Was zu tun ist: Setzen Sie `channels.matrix.defaultAccount` auf das gewünschte Konto, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Bedeutung: Der neue kontobezogene Speicherort hat bereits einen Sync- oder Crypto-Store, daher hat OpenClaw ihn nicht automatisch überschrieben.
- Was zu tun ist: Verifizieren Sie, dass das aktuelle Konto das richtige ist, bevor Sie das kollidierende Ziel manuell entfernen oder verschieben.

`Failed migrating Matrix legacy sync store (...)` oder `Failed migrating Matrix legacy crypto store (...)`

- Bedeutung: OpenClaw hat versucht, alten Matrix-Status zu verschieben, aber der Dateisystemvorgang ist fehlgeschlagen.
- Was zu tun ist: Prüfen Sie Dateisystemberechtigungen und Datenträgerstatus und führen Sie dann `openclaw doctor --fix` erneut aus.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: OpenClaw hat einen alten verschlüsselten Matrix-Store gefunden, aber es gibt keine aktuelle Matrix-Konfiguration, an die er angehängt werden kann.
- Was zu tun ist: Konfigurieren Sie `channels.matrix`, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: Der verschlüsselte Store ist vorhanden, aber OpenClaw kann nicht sicher entscheiden, zu welchem aktuellen Konto/Gerät er gehört.
- Was zu tun ist: Starten Sie das Gateway einmal mit einem funktionierenden Matrix-Login oder führen Sie `openclaw doctor --fix` erneut aus, nachdem zwischengespeicherte Anmeldedaten verfügbar sind.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen älteren Crypto-Store gefunden, weigert sich aber zu raten, welches benannte Matrix-Konto ihn erhalten soll.
- Was zu tun ist: Setzen Sie `channels.matrix.defaultAccount` auf das gewünschte Konto, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Bedeutung: OpenClaw hat alten Matrix-Status erkannt, aber die Migration ist noch durch fehlende Identitäts- oder Anmeldedatendaten blockiert.
- Was zu tun ist: Schließen Sie Matrix-Login oder Konfiguration ab und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Bedeutung: OpenClaw hat alten verschlüsselten Matrix-Status gefunden, konnte aber den Helper-Entrypoint aus dem Matrix-Plugin nicht laden, der diesen Store normalerweise prüft.
- Was zu tun ist: Installieren Sie das Matrix-Plugin neu oder reparieren Sie es (`openclaw plugins install @openclaw/matrix` oder `openclaw plugins install ./path/to/local/matrix-plugin` für einen Repo-Checkout), und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Bedeutung: OpenClaw hat einen Helper-Dateipfad gefunden, der die Plugin-Wurzel verlässt oder Plugin-Grenzprüfungen nicht besteht, und hat ihn deshalb nicht importiert.
- Was zu tun ist: Installieren Sie das Matrix-Plugin aus einem vertrauenswürdigen Pfad neu und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Bedeutung: OpenClaw hat sich geweigert, Matrix-Status zu verändern, weil der Wiederherstellungs-Snapshot zuvor nicht erstellt werden konnte.
- Was zu tun ist: Beheben Sie den Backup-Fehler und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Failed migrating legacy Matrix client storage: ...`

- Bedeutung: Der clientseitige Matrix-Fallback hat alten flachen Speicher gefunden, aber das Verschieben ist fehlgeschlagen. OpenClaw bricht diesen Fallback jetzt ab, statt stillschweigend mit einem frischen Store zu starten.
- Was zu tun ist: Prüfen Sie Dateisystemberechtigungen oder Konflikte, lassen Sie den alten Status intakt und versuchen Sie es nach Behebung des Fehlers erneut.

`Matrix is installed from a custom path: ...`

- Bedeutung: Matrix ist auf eine Pfadinstallation festgelegt, daher ersetzen Mainline-Updates es nicht automatisch durch das Standard-Matrix-Paket des Repos.
- Was zu tun ist: Installieren Sie mit `openclaw plugins install @openclaw/matrix` neu, wenn Sie zum Standard-Matrix-Plugin zurückkehren möchten.

### Meldungen zur Wiederherstellung verschlüsselter Zustände

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Bedeutung: Gesicherte Raumschlüssel wurden erfolgreich in den neuen Crypto-Store wiederhergestellt.
- Was zu tun ist: normalerweise nichts.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Bedeutung: Einige alte Raumschlüssel existierten nur im alten lokalen Store und wurden nie in das Matrix-Backup hochgeladen.
- Was zu tun ist: Rechnen Sie damit, dass ein Teil des alten verschlüsselten Verlaufs nicht verfügbar bleibt, sofern Sie diese Schlüssel nicht manuell von einem anderen verifizierten Client wiederherstellen können.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Bedeutung: Ein Backup existiert, aber OpenClaw konnte den Wiederherstellungsschlüssel nicht automatisch wiederherstellen.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` aus.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Bedeutung: OpenClaw hat den alten verschlüsselten Store gefunden, konnte ihn aber nicht sicher genug prüfen, um die Wiederherstellung vorzubereiten.
- Was zu tun ist: Führen Sie `openclaw doctor --fix` erneut aus. Wenn dies erneut auftritt, lassen Sie das alte Statusverzeichnis intakt und stellen Sie mit einem anderen verifizierten Matrix-Client plus `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` wieder her.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Bedeutung: OpenClaw hat einen Konflikt bei Backup-Schlüsseln erkannt und sich geweigert, die aktuelle Datei mit dem Wiederherstellungsschlüssel automatisch zu überschreiben.
- Was zu tun ist: Prüfen Sie, welcher Wiederherstellungsschlüssel korrekt ist, bevor Sie einen Wiederherstellungsbefehl erneut ausführen.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Bedeutung: Das ist die harte Grenze des alten Speicherformats.
- Was zu tun ist: Gesicherte Schlüssel können weiterhin wiederhergestellt werden, aber rein lokaler verschlüsselter Verlauf kann nicht verfügbar bleiben.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Bedeutung: Das neue Plugin hat eine Wiederherstellung versucht, aber Matrix hat einen Fehler zurückgegeben.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup status` aus und wiederholen Sie den Vorgang dann bei Bedarf mit `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Meldungen zur manuellen Wiederherstellung

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Bedeutung: OpenClaw weiß, dass Sie einen Backup-Schlüssel haben sollten, aber er ist auf diesem Gerät nicht aktiv.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup restore` aus oder übergeben Sie bei Bedarf `--recovery-key`.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Bedeutung: Auf diesem Gerät ist der Wiederherstellungsschlüssel derzeit nicht gespeichert.
- Was zu tun ist: Verifizieren Sie das Gerät zuerst mit Ihrem Wiederherstellungsschlüssel und stellen Sie dann das Backup wieder her.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Bedeutung: Der gespeicherte Schlüssel stimmt nicht mit dem aktiven Matrix-Backup überein.
- Was zu tun ist: Führen Sie `openclaw matrix verify device "<your-recovery-key>"` mit dem richtigen Schlüssel erneut aus.

Wenn Sie akzeptieren, nicht wiederherstellbaren alten verschlüsselten Verlauf zu verlieren, können Sie stattdessen die
aktuelle Backup-Basis mit `openclaw matrix verify backup reset --yes` zurücksetzen. Wenn das
gespeicherte Backup-Secret defekt ist, kann dieses Zurücksetzen auch den Secret-Speicher neu erstellen, sodass der
neue Backup-Schlüssel nach dem Neustart korrekt geladen werden kann.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Bedeutung: Das Backup existiert, aber dieses Gerät vertraut der Cross-Signing-Kette noch nicht stark genug.
- Was zu tun ist: Führen Sie `openclaw matrix verify device "<your-recovery-key>"` erneut aus.

`Matrix recovery key is required`

- Bedeutung: Sie haben einen Wiederherstellungsschritt versucht, ohne einen Wiederherstellungsschlüssel anzugeben, obwohl einer erforderlich war.
- Was zu tun ist: Führen Sie den Befehl mit Ihrem Wiederherstellungsschlüssel erneut aus.

`Invalid Matrix recovery key: ...`

- Bedeutung: Der angegebene Schlüssel konnte nicht geparst werden oder entsprach nicht dem erwarteten Format.
- Was zu tun ist: Versuchen Sie es erneut mit dem exakten Wiederherstellungsschlüssel aus Ihrem Matrix-Client oder Ihrer Datei mit dem Wiederherstellungsschlüssel.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Bedeutung: OpenClaw konnte den Wiederherstellungsschlüssel anwenden, aber Matrix hat
  für dieses Gerät noch immer kein vollständiges Cross-Signing-Identitätsvertrauen
  hergestellt. Prüfen Sie die Befehlsausgabe für `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` und `Device verified by owner`.
- Was zu tun ist: Führen Sie `openclaw matrix verify self` aus, akzeptieren Sie die Anfrage in einem anderen
  Matrix-Client, vergleichen Sie die SAS und geben Sie `yes` nur ein, wenn sie übereinstimmt. Der
  Befehl wartet auf vollständiges Matrix-Identitätsvertrauen, bevor er Erfolg meldet. Verwenden Sie
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  nur, wenn Sie die aktuelle Cross-Signing-Identität absichtlich ersetzen möchten.

`Matrix key backup is not active on this device after loading from secret storage.`

- Bedeutung: Der Secret-Speicher hat auf diesem Gerät keine aktive Backup-Sitzung erzeugt.
- Was zu tun ist: Verifizieren Sie das Gerät zuerst und prüfen Sie dann erneut mit `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Bedeutung: Dieses Gerät kann nicht aus dem Secret-Speicher wiederherstellen, bevor die Geräteverifizierung abgeschlossen ist.
- Was zu tun ist: Führen Sie zuerst `openclaw matrix verify device "<your-recovery-key>"` aus.

### Meldungen zu benutzerdefinierten Plugin-Installationen

`Matrix is installed from a custom path that no longer exists: ...`

- Bedeutung: Ihr Plugin-Installationsdatensatz verweist auf einen lokalen Pfad, der nicht mehr existiert.
- Was zu tun ist: Installieren Sie mit `openclaw plugins install @openclaw/matrix` neu oder, wenn Sie aus einem Repo-Checkout ausführen, mit `openclaw plugins install ./path/to/local/matrix-plugin`.

## Wenn verschlüsselter Verlauf weiterhin nicht zurückkommt

Führen Sie diese Prüfungen der Reihe nach aus:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Wenn das Backup erfolgreich wiederhergestellt wird, in einigen alten Räumen aber weiterhin Verlauf fehlt, wurden diese fehlenden Schlüssel wahrscheinlich nie vom vorherigen Plugin gesichert.

## Wenn Sie für zukünftige Nachrichten neu beginnen möchten

Wenn Sie akzeptieren, nicht wiederherstellbaren alten verschlüsselten Verlauf zu verlieren, und künftig nur eine saubere Backup-Basis möchten, führen Sie diese Befehle der Reihe nach aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Wenn das Gerät danach noch nicht verifiziert ist, schließen Sie die Verifizierung in Ihrem Matrix-Client ab, indem Sie die SAS-Emojis oder Dezimalcodes vergleichen und bestätigen, dass sie übereinstimmen.

## Verwandte Seiten

- [Matrix](/de/channels/matrix)
- [Doctor](/de/gateway/doctor)
- [Migrationen](/de/install/migrating)
- [Plugins](/de/tools/plugin)

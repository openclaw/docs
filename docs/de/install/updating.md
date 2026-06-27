---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht
summary: OpenClaw sicher aktualisieren (globale Installation oder Quellcode), plus Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-06-27T17:39:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw aktuell.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Erkennt Ihren Installationstyp (npm oder git), lädt die neueste Version, führt `openclaw doctor` aus und startet den Gateway neu.

```bash
openclaw update
```

Um Kanäle zu wechseln oder eine bestimmte Version auszuwählen:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` akzeptiert kein `--verbose`. Verwenden Sie für Update-Diagnosen `--dry-run`, um die geplanten Aktionen vorab anzuzeigen, `--json` für strukturierte Ergebnisse oder `openclaw update status --json`, um den Kanal- und Verfügbarkeitsstatus zu prüfen. Der Installer hat ein eigenes `--verbose`-Flag, aber dieses Flag ist nicht Teil von `openclaw update`.

`--channel beta` bevorzugt Beta, aber die Runtime fällt auf Stable/Latest zurück, wenn das Beta-Tag fehlt oder älter als das neueste Stable-Release ist. Verwenden Sie `--tag beta`, wenn Sie das rohe npm-Beta-Dist-Tag für ein einmaliges Paket-Update möchten.

Verwenden Sie `--channel dev` für einen dauerhaft mitlaufenden GitHub-`main`-Checkout. Für Paket-Updates wird `--tag main` für einen Lauf auf `github:openclaw/openclaw#main` abgebildet, und GitHub-/Git-Quellspezifikationen werden vor der gestaffelten npm-Installation in einen temporären Tarball gepackt.

Bei verwalteten Plugins ist der Beta-Kanal-Fallback eine Warnung: Das Core-Update kann trotzdem erfolgreich sein, während ein Plugin sein aufgezeichnetes Standard-/Latest-Release verwendet, weil kein Plugin-Beta verfügbar ist.

Siehe [Entwicklungskanäle](/de/install/development-channels) für Kanal-Semantik.

## Zwischen npm- und git-Installationen wechseln

Verwenden Sie Kanäle, wenn Sie den Installationstyp ändern möchten. Der Updater behält Ihren Zustand, Ihre Konfiguration, Anmeldedaten und den Workspace in `~/.openclaw` bei; er ändert nur, welche OpenClaw-Codeinstallation die CLI und der Gateway verwenden.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Führen Sie zuerst mit `--dry-run` aus, um den genauen Wechsel des Installationsmodus vorab anzuzeigen:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Der `dev`-Kanal stellt einen git-Checkout sicher, baut ihn und installiert die globale CLI aus diesem Checkout. Die Kanäle `stable` und `beta` verwenden Paketinstallationen. Wenn der Gateway bereits installiert ist, aktualisiert `openclaw update` die Dienstmetadaten und startet ihn neu, es sei denn, Sie übergeben `--no-restart`.

Bei Paketinstallationen mit einem verwalteten Gateway-Dienst zielt `openclaw update` auf das Paket-Root, das von diesem Dienst verwendet wird. Wenn der Shell-Befehl `openclaw` aus einer anderen Installation stammt, gibt der Updater beide Roots und den Node-Pfad des verwalteten Dienstes aus. Das Paket-Update verwendet den Paketmanager, dem das Dienst-Root gehört, und prüft den verwalteten Dienst-Node gegen die Engine des Ziel-Release, bevor das Paket ersetzt wird.

## Alternative: Installer erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um einen bestimmten Installationstyp über den Installer zu erzwingen, übergeben Sie `--install-method git --no-onboard` oder `--install-method npm --no-onboard`.

Wenn `openclaw update` nach der npm-Paketinstallationsphase fehlschlägt, führen Sie den Installer erneut aus. Der Installer ruft nicht den alten Updater auf; er führt die globale Paketinstallation direkt aus und kann eine teilweise aktualisierte npm-Installation wiederherstellen.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Um die Wiederherstellung auf eine bestimmte Version oder ein Dist-Tag festzulegen, fügen Sie `--version` hinzu:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative: manuell mit npm, pnpm oder bun

```bash
npm i -g openclaw@latest
```

Bevorzugen Sie `openclaw update` für überwachte Installationen, weil es den Paketaustausch mit dem laufenden Gateway-Dienst koordinieren kann. Wenn Sie eine überwachte Installation manuell aktualisieren, stoppen Sie den verwalteten Gateway, bevor der Paketmanager startet. Paketmanager ersetzen Dateien direkt vor Ort, und ein laufender Gateway kann sonst versuchen, Core- oder Plugin-Dateien zu laden, während der Paketbaum vorübergehend nur halb ausgetauscht ist. Starten Sie den Gateway neu, nachdem der Paketmanager fertig ist, damit der Dienst die neue Installation übernimmt.

Bei einer root-eigenen, systemglobalen Linux-Installation: Wenn `openclaw update` mit `EACCES` fehlschlägt und Sie mit dem System-npm wiederherstellen, lassen Sie den Gateway während des manuellen Paketaustauschs gestoppt. Verwenden Sie dieselben `openclaw`-Profil-Flags oder dieselbe Umgebung, die Sie normalerweise für diesen Gateway verwenden. Ersetzen Sie `/usr/bin/npm` durch das System-npm, dem das root-eigene globale Präfix auf Ihrem Host gehört:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Prüfen Sie anschließend den Dienst:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert es das Ziel zuerst in ein temporäres npm-Präfix, prüft das paketierte `dist`-Inventar und tauscht dann den sauberen Paketbaum in das echte globale Präfix ein. Dadurch wird vermieden, dass npm ein neues Paket über veraltete Dateien des alten Pakets legt. Wenn der Installationsbefehl fehlschlägt, versucht OpenClaw es einmal erneut mit `--omit=optional`. Dieser erneute Versuch hilft Hosts, auf denen native optionale Abhängigkeiten nicht kompiliert werden können, während der ursprüngliche Fehler sichtbar bleibt, falls auch der Fallback fehlschlägt.

Von OpenClaw verwaltete npm-Update- und Plugin-Update-Befehle heben außerdem die npm-`min-release-age`-Quarantäne für den untergeordneten npm-Prozess auf. npm kann diese Richtlinie als abgeleiteten `before`-Grenzwert melden; beide sind für allgemeine Supply-Chain-Quarantänerichtlinien nützlich, aber ein explizites OpenClaw-Update bedeutet „das ausgewählte OpenClaw-Release jetzt installieren“.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Erweiterte npm-Installationsthemen

<AccordionGroup>
  <Accordion title="Schreibgeschützter Paketbaum">
    OpenClaw behandelt paketierte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Plugin-Paketinstallationen befinden sich in OpenClaw-eigenen npm-/git-Roots unter dem Benutzerkonfigurationsverzeichnis, und der Gateway-Start verändert den OpenClaw-Paketbaum nicht.

    Einige Linux-npm-Setups installieren globale Pakete unter root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout, weil Plugin-Installations-/Update-Befehle außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Geben Sie OpenClaw Schreibzugriff auf seine Konfigurations-/Status-Roots, damit explizite Plugin-Installationen, Plugin-Updates und Doctor-Bereinigungen ihre Änderungen dauerhaft speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Speicherplatz-Preflight">
    Vor Paket-Updates und expliziten Plugin-Installationen versucht OpenClaw eine bestmögliche Speicherplatzprüfung für das Zielvolume. Wenig Speicherplatz erzeugt eine Warnung mit dem geprüften Pfad, blockiert das Update aber nicht, weil Dateisystemquotas, Snapshots und Netzwerkvolumes sich nach der Prüfung ändern können. Die tatsächliche Installation durch den Paketmanager und die Post-Installationsprüfung bleiben maßgeblich.
  </Accordion>
</AccordionGroup>

## Auto-Updater

Der Auto-Updater ist standardmäßig deaktiviert. Aktivieren Sie ihn in `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanal    | Verhalten                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (gestaffelter Rollout).        |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                                                    |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                                            |

Der Gateway protokolliert beim Start außerdem einen Update-Hinweis (deaktivieren mit `update.checkOnStart: false`).
Für Downgrade oder Incident-Wiederherstellung setzen Sie `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung, um automatische Anwendungen zu blockieren, selbst wenn `update.auto.enabled` konfiguriert ist. Update-Hinweise beim Start können weiterhin ausgeführt werden, sofern `update.checkOnStart` nicht ebenfalls deaktiviert ist.

Paketmanager-Updates, die über den Live-Gateway-Control-Plane-Handler angefordert werden, ersetzen den Paketbaum nicht innerhalb des laufenden Gateway-Prozesses. Bei verwalteten Dienstinstallationen startet der Gateway eine abgekoppelte Übergabe, beendet sich und lässt den normalen CLI-Pfad `openclaw update --yes --json` den Dienst stoppen, das Paket ersetzen, Dienstmetadaten aktualisieren, neu starten, die Gateway-Version und Erreichbarkeit prüfen und, wenn möglich, einen installierten, aber nicht geladenen macOS-LaunchAgent wiederherstellen. Wenn der Gateway diese Übergabe nicht sicher durchführen kann, meldet `update.run` stattdessen einen sicheren Shell-Befehl, statt den Paketmanager im Prozess auszuführen.

## Nach dem Aktualisieren

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert Konfiguration, prüft DM-Richtlinien und kontrolliert die Gateway-Gesundheit. Details: [Doctor](/de/gateway/doctor)

### Gateway neu starten

```bash
openclaw gateway restart
```

### Prüfen

```bash
openclaw health
```

</Steps>

## Rollback

### Version festlegen (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` zeigt die aktuell veröffentlichte Version.
</Tip>

### Commit festlegen (Quelle)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Zurück zur neuesten Version: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` auf Quell-Checkouts bootstrapt der Updater `pnpm` bei Bedarf automatisch. Wenn Sie einen pnpm-/corepack-Bootstrap-Fehler sehen, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` wieder) und führen Sie das Update erneut aus.
- Prüfen: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Gesundheitsprüfungen nach Updates.
- [Migration](/de/install/migrating): Migrationsleitfäden für Hauptversionen.

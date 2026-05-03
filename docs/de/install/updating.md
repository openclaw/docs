---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder Quellcode), plus Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-03T21:35:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw aktuell.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Der Befehl erkennt Ihren Installationstyp (npm oder git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet den Gateway neu.

```bash
openclaw update
```

So wechseln Sie Kanäle oder zielen auf eine bestimmte Version ab:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` akzeptiert kein `--verbose`. Für Aktualisierungsdiagnosen verwenden Sie
`--dry-run`, um die geplanten Aktionen vorab anzuzeigen, `--json` für strukturierte Ergebnisse oder
`openclaw update status --json`, um den Kanal- und Verfügbarkeitsstatus zu prüfen. Der
Installer hat ein eigenes `--verbose`-Flag, aber dieses Flag ist nicht Teil von
`openclaw update`.

`--channel beta` bevorzugt Beta, aber die Laufzeitumgebung fällt auf Stable/Latest zurück, wenn
das Beta-Tag fehlt oder älter als das neueste stabile Release ist. Verwenden Sie `--tag beta`,
wenn Sie das rohe npm-Beta-dist-tag für eine einmalige Paketaktualisierung möchten.

Siehe [Entwicklungskanäle](/de/install/development-channels) für Kanal-Semantik.

## Zwischen npm- und git-Installationen wechseln

Verwenden Sie Kanäle, wenn Sie den Installationstyp ändern möchten. Der Updater behält Ihren
Status, Ihre Konfiguration, Zugangsdaten und den Workspace in `~/.openclaw` bei; er ändert nur,
welche OpenClaw-Codeinstallation die CLI und der Gateway verwenden.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Führen Sie den Befehl zuerst mit `--dry-run` aus, um den genauen Wechsel des Installationsmodus vorab anzuzeigen:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Der Kanal `dev` stellt einen git-Checkout sicher, baut ihn und installiert die globale CLI
aus diesem Checkout. Die Kanäle `stable` und `beta` verwenden Paketinstallationen. Wenn der
Gateway bereits installiert ist, aktualisiert `openclaw update` die Service-Metadaten
und startet ihn neu, sofern Sie nicht `--no-restart` übergeben.

## Alternative: Installer erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um über den
Installer einen bestimmten Installationstyp zu erzwingen, übergeben Sie `--install-method git --no-onboard` oder
`--install-method npm --no-onboard`.

Wenn `openclaw update` nach der Phase der npm-Paketinstallation fehlschlägt, führen Sie den
Installer erneut aus. Der Installer ruft nicht den alten Updater auf; er führt die globale
Paketinstallation direkt aus und kann eine teilweise aktualisierte npm-Installation wiederherstellen.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Um die Wiederherstellung auf eine bestimmte Version oder ein dist-tag festzulegen, fügen Sie `--version` hinzu:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative: manuell mit npm, pnpm oder bun

```bash
npm i -g openclaw@latest
```

Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert es das Ziel zuerst in
ein temporäres npm-Präfix, prüft das paketierte `dist`-Inventar und tauscht dann
den sauberen Paketbaum in das echte globale Präfix ein. Dadurch wird vermieden, dass npm ein
neues Paket über veraltete Dateien aus dem alten Paket legt. Wenn der Installationsbefehl fehlschlägt,
versucht OpenClaw es einmal erneut mit `--omit=optional`. Dieser erneute Versuch hilft Hosts, auf denen native
optionale Abhängigkeiten nicht kompiliert werden können, während der ursprüngliche Fehler sichtbar bleibt,
falls auch der Fallback fehlschlägt.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Fortgeschrittene npm-Installationsthemen

<AccordionGroup>
  <Accordion title="Schreibgeschützter Paketbaum">
    OpenClaw behandelt paketierte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Plugin-Paketinstallationen liegen in OpenClaw-eigenen npm/git-Wurzeln unter dem Benutzerkonfigurationsverzeichnis, und der Gateway-Start verändert den OpenClaw-Paketbaum nicht.

    Einige Linux-npm-Setups installieren globale Pakete unter root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout, weil Befehle zum Installieren/Aktualisieren von Plugins außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Gewähren Sie OpenClaw Schreibzugriff auf seine Konfigurations-/Status-Wurzeln, damit explizite Plugin-Installationen, Plugin-Aktualisierungen und Doctor-Bereinigungen ihre Änderungen dauerhaft speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Speicherplatz-Vorprüfung">
    Vor Paketaktualisierungen und expliziten Plugin-Installationen versucht OpenClaw eine bestmögliche Speicherplatzprüfung für das Zielvolume. Wenig Speicherplatz erzeugt eine Warnung mit dem geprüften Pfad, blockiert die Aktualisierung aber nicht, weil Dateisystemkontingente, Snapshots und Netzwerkvolumes sich nach der Prüfung ändern können. Die tatsächliche Paketmanager-Installation und die Nachinstallationsprüfung bleiben maßgeblich.
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

| Kanal    | Verhalten                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (gestaffelter Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                                     |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                             |

Der Gateway protokolliert beim Start außerdem einen Aktualisierungshinweis (deaktivieren mit `update.checkOnStart: false`).
Für Downgrade oder Wiederherstellung nach einem Vorfall setzen Sie `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung, um automatische Anwendungen auch dann zu blockieren, wenn `update.auto.enabled` konfiguriert ist. Aktualisierungshinweise beim Start können weiterhin ausgeführt werden, sofern `update.checkOnStart` nicht ebenfalls deaktiviert ist.

Paketmanager-Aktualisierungen, die über den Live-Gateway-Control-Plane-Handler angefordert werden,
erzwingen nach dem Pakettausch einen nicht aufgeschobenen Aktualisierungsneustart ohne Cooldown. Dadurch
bleibt kein alter In-Memory-Prozess lange genug bestehen, um Chunks verzögert aus einem
Paketbaum zu laden, der bereits ersetzt wurde. Shell-`openclaw update`
bleibt der bevorzugte Pfad für überwachte Installationen, weil es den Service rund um die Aktualisierung stoppen und
neu starten kann.

## Nach dem Aktualisieren

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert die Konfiguration, prüft DM-Richtlinien und prüft den Zustand des Gateway. Details: [Doctor](/de/gateway/doctor)

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

## Wenn Sie feststecken

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` auf Quellcode-Checkouts bootstrapt der Updater `pnpm` bei Bedarf automatisch. Wenn Sie einen pnpm/corepack-Bootstrap-Fehler sehen, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` erneut) und führen Sie die Aktualisierung erneut aus.
- Prüfen: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Zustandsprüfungen nach Aktualisierungen.
- [Migration](/de/install/migrating): Migrationsleitfäden für Hauptversionen.

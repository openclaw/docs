---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder Quellcode), plus Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-07T13:20:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw aktuell.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Es erkennt Ihren Installationstyp (npm oder git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet das Gateway neu.

```bash
openclaw update
```

Um Kanäle zu wechseln oder eine bestimmte Version anzusteuern:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` akzeptiert `--verbose` nicht. Für Aktualisierungsdiagnosen verwenden Sie
`--dry-run`, um die geplanten Aktionen in der Vorschau anzuzeigen, `--json` für strukturierte Ergebnisse oder
`openclaw update status --json`, um den Kanal- und Verfügbarkeitsstatus zu prüfen. Der
Installer hat sein eigenes Flag `--verbose`, aber dieses Flag ist nicht Teil von
`openclaw update`.

`--channel beta` bevorzugt Beta, aber die Runtime fällt auf Stable/Latest zurück, wenn
das Beta-Tag fehlt oder älter als die neueste stabile Version ist. Verwenden Sie `--tag beta`,
wenn Sie das unverarbeitete npm-Beta-dist-tag für eine einmalige Paketaktualisierung möchten.

Siehe [Entwicklungskanäle](/de/install/development-channels) für die Kanalsemantik.

## Zwischen npm- und git-Installationen wechseln

Verwenden Sie Kanäle, wenn Sie den Installationstyp ändern möchten. Der Updater behält Ihren
Status, Ihre Konfiguration, Ihre Zugangsdaten und Ihren Workspace in `~/.openclaw` bei; er ändert nur,
welche OpenClaw-Codeinstallation die CLI und das Gateway verwenden.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Führen Sie den Befehl zuerst mit `--dry-run` aus, um den genauen Wechsel des Installationsmodus in der Vorschau anzuzeigen:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Der Kanal `dev` stellt einen git-Checkout sicher, erstellt ihn und installiert die globale CLI
aus diesem Checkout. Die Kanäle `stable` und `beta` verwenden Paketinstallationen. Wenn das
Gateway bereits installiert ist, aktualisiert `openclaw update` die Service-Metadaten
und startet es neu, sofern Sie nicht `--no-restart` übergeben.

  ## Alternative: Installationsprogramm erneut ausführen

  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash
  ```

  Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um eine bestimmte Installationsart über
  das Installationsprogramm zu erzwingen, übergeben Sie `--install-method git --no-onboard` oder
  `--install-method npm --no-onboard`.

  Wenn `openclaw update` nach der Installationsphase des npm-Pakets fehlschlägt, führen Sie das
  Installationsprogramm erneut aus. Das Installationsprogramm ruft den alten Updater nicht auf; es führt die globale
  Paketinstallation direkt aus und kann eine teilweise aktualisierte npm-Installation wiederherstellen.

  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
  ```

  Um die Wiederherstellung auf eine bestimmte Version oder ein bestimmtes dist-tag festzulegen, fügen Sie `--version` hinzu:

  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
  ```

  ## Alternative: manuell mit npm, pnpm oder bun

  ```bash
  npm i -g openclaw@latest
  ```

  Bevorzugen Sie `openclaw update` für überwachte Installationen, da es den
  Paketaustausch mit dem laufenden Gateway-Dienst koordinieren kann. Wenn Sie manuell aktualisieren, während ein
  verwalteter Gateway läuft, starten Sie den Gateway unmittelbar nach Abschluss des
  Paketmanagers neu, damit der alte Prozess nicht weiter aus ersetzten Paketdateien
  ausliefert.

  Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert es das Ziel zuerst in
  ein temporäres npm-Präfix, überprüft dann das gepackte `dist`-Inventar und tauscht anschließend
  den sauberen Paketbaum in das echte globale Präfix aus. Dadurch wird verhindert, dass npm ein
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

  ### Erweiterte Themen zur npm-Installation

  <AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw behandelt gepackte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Plugin-Paketinstallationen liegen in OpenClaw-eigenen npm/git-Roots unter dem Benutzerkonfigurationsverzeichnis, und der Gateway-Start verändert den OpenClaw-Paketbaum nicht.

    Einige Linux-npm-Setups installieren globale Pakete unter root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout, weil Befehle zum Installieren/Aktualisieren von Plugins außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Geben Sie OpenClaw Schreibzugriff auf seine Konfigurations-/Status-Wurzeln, damit explizite Plugin-Installationen, Plugin-Updates und Doctor-Bereinigungen ihre Änderungen dauerhaft speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Vorprüfung des Speicherplatzes">
    Vor Paket-Updates und expliziten Plugin-Installationen versucht OpenClaw nach bestem Wissen eine Speicherplatzprüfung für das Zielvolume. Wenig Speicherplatz erzeugt eine Warnung mit dem geprüften Pfad, blockiert das Update aber nicht, weil sich Dateisystemkontingente, Snapshots und Netzwerkvolumes nach der Prüfung ändern können. Die tatsächliche Installation durch den Paketmanager und die Verifizierung nach der Installation bleiben maßgeblich.
  </Accordion>
</AccordionGroup>

## Automatischer Updater

Der automatische Updater ist standardmäßig deaktiviert. Aktivieren Sie ihn in `~/.openclaw/openclaw.json`:

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

| Kanal    | Verhalten                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (verteiltes Rollout).       |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                                                 |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                                          |

Das Gateway protokolliert beim Start außerdem einen Update-Hinweis (deaktivieren mit `update.checkOnStart: false`).
Für Downgrades oder die Wiederherstellung nach Vorfällen setzen Sie `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung, um automatische Anwendungen zu blockieren, auch wenn `update.auto.enabled` konfiguriert ist. Update-Hinweise beim Start können weiterhin ausgeführt werden, sofern `update.checkOnStart` nicht ebenfalls deaktiviert ist.

Über den Live-Gateway-Control-Plane-Handler angeforderte Paketmanager-Updates
erzwingen nach dem Pakettausch einen nicht aufgeschobenen Update-Neustart ohne Cooldown. Dadurch
wird vermieden, dass ein alter speicherresidenter Prozess lange genug bestehen bleibt, um Chunks per Lazy Loading
aus einem Paketbaum zu laden, der bereits ersetzt wurde. Shell-`openclaw update`
bleibt der bevorzugte Weg für überwachte Installationen, weil der Dienst dabei rund um das Update angehalten und
neu gestartet werden kann.

## Nach dem Update

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert Konfiguration, prüft DM-Richtlinien und kontrolliert den Gateway-Zustand. Details: [Doctor](/de/gateway/doctor)

### Gateway neu starten

```bash
openclaw gateway restart
```

### Verifizieren

```bash
openclaw health
```

</Steps>

## Rollback

### Version anheften (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` zeigt die aktuell veröffentlichte Version.
</Tip>

### Commit anheften (Quellcode)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Zur Rückkehr zur neuesten Version: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Für `openclaw update --channel dev` in Quellcode-Checkouts bootstrapt der Updater `pnpm` bei Bedarf automatisch. Wenn Sie einen pnpm-/corepack-Bootstrap-Fehler sehen, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` wieder) und führen Sie das Update erneut aus.
- Prüfen Sie: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Zustandsprüfungen nach Updates.
- [Migration](/de/install/migrating): Migrationsleitfäden für Hauptversionen.

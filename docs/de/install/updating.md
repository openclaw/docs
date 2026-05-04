---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder Quellcode) sowie Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-04T06:42:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw auf dem neuesten Stand.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Es erkennt Ihren Installationstyp (npm oder git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet den Gateway neu.

```bash
openclaw update
```

So wechseln Sie Kanäle oder wählen eine bestimmte Version aus:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` akzeptiert `--verbose` nicht. Verwenden Sie für Aktualisierungsdiagnosen
`--dry-run`, um die geplanten Aktionen vorab anzuzeigen, `--json` für strukturierte Ergebnisse oder
`openclaw update status --json`, um den Kanal- und Verfügbarkeitsstatus zu prüfen. Der
Installer hat ein eigenes `--verbose`-Flag, aber dieses Flag ist nicht Teil von
`openclaw update`.

`--channel beta` bevorzugt Beta, aber die Runtime fällt auf Stable/Latest zurück, wenn
der Beta-Tag fehlt oder älter als das neueste stabile Release ist. Verwenden Sie `--tag beta`,
wenn Sie den rohen npm-Beta-`dist-tag` für eine einmalige Paketaktualisierung möchten.

Siehe [Entwicklungskanäle](/de/install/development-channels) für die Kanalsemantik.

## Zwischen npm- und git-Installationen wechseln

Verwenden Sie Kanäle, wenn Sie den Installationstyp ändern möchten. Der Updater behält Ihren
Status, Ihre Konfiguration, Anmeldedaten und Ihren Arbeitsbereich in `~/.openclaw`; er ändert nur,
welche OpenClaw-Codeinstallation die CLI und der Gateway verwenden.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Führen Sie zuerst `--dry-run` aus, um den exakten Wechsel des Installationsmodus vorab anzuzeigen:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Der `dev`-Kanal stellt ein git-Checkout sicher, baut es und installiert die globale CLI
aus diesem Checkout. Die Kanäle `stable` und `beta` verwenden Paketinstallationen. Wenn der
Gateway bereits installiert ist, aktualisiert `openclaw update` die Servicemetadaten
und startet ihn neu, sofern Sie nicht `--no-restart` übergeben.

## Alternative: Installer erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um einen bestimmten Installationstyp über
den Installer zu erzwingen, übergeben Sie `--install-method git --no-onboard` oder
`--install-method npm --no-onboard`.

Wenn `openclaw update` nach der npm-Paketinstallationsphase fehlschlägt, führen Sie den
Installer erneut aus. Der Installer ruft den alten Updater nicht auf; er führt die globale
Paketinstallation direkt aus und kann eine teilweise aktualisierte npm-Installation wiederherstellen.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Um die Wiederherstellung auf eine bestimmte Version oder einen bestimmten dist-tag festzulegen, fügen Sie `--version` hinzu:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative: manuell mit npm, pnpm oder bun

```bash
npm i -g openclaw@latest
```

Bevorzugen Sie `openclaw update` für beaufsichtigte Installationen, da es den
Paketwechsel mit dem laufenden Gateway-Service koordinieren kann. Wenn Sie manuell aktualisieren, während ein
verwalteter Gateway läuft, starten Sie den Gateway direkt nach Abschluss des Paketmanagers neu,
damit der alte Prozess nicht weiter aus ersetzten Paketdateien bereitstellt.

Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert es das Ziel zunächst in
ein temporäres npm-Präfix, prüft das gepackte `dist`-Inventar und tauscht dann
den sauberen Paketbaum in das echte globale Präfix. Dadurch wird vermieden, dass npm ein
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
  <Accordion title="Schreibgeschützter Paketbaum">
    OpenClaw behandelt gepackte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Plugin-Paketinstallationen liegen in OpenClaw-eigenen npm/git-Wurzeln unter dem Benutzerkonfigurationsverzeichnis, und der Gateway-Start verändert den OpenClaw-Paketbaum nicht.

    Einige Linux-npm-Setups installieren globale Pakete unter root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout, da Befehle zum Installieren/Aktualisieren von Plugins außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Geben Sie OpenClaw Schreibzugriff auf seine Konfigurations-/Status-Wurzeln, damit explizite Plugin-Installationen, Plugin-Aktualisierungen und Doctor-Bereinigungen ihre Änderungen speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Vorabprüfung des Speicherplatzes">
    Vor Paketaktualisierungen und expliziten Plugin-Installationen versucht OpenClaw eine bestmögliche Speicherplatzprüfung für das Zielvolume. Wenig Speicherplatz erzeugt eine Warnung mit dem geprüften Pfad, blockiert die Aktualisierung aber nicht, da sich Dateisystemquotas, Snapshots und Netzwerkvolumes nach der Prüfung ändern können. Die tatsächliche Paketmanager-Installation und die Nachinstallationsprüfung bleiben maßgeblich.
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

| Kanal    | Verhalten                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (gestaffelter Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                                           |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                                   |

Der Gateway protokolliert beim Start außerdem einen Aktualisierungshinweis (deaktivieren mit `update.checkOnStart: false`).
Für Downgrades oder Wiederherstellung nach Vorfällen setzen Sie `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung, um automatische Anwendungen auch dann zu blockieren, wenn `update.auto.enabled` konfiguriert ist. Aktualisierungshinweise beim Start können weiterhin ausgeführt werden, sofern `update.checkOnStart` nicht ebenfalls deaktiviert ist.

Paketmanager-Aktualisierungen, die über den Live-Gateway-Control-Plane-Handler angefordert werden,
erzwingen nach dem Paketwechsel einen nicht aufgeschobenen Aktualisierungsneustart ohne Cooldown. Dadurch
wird vermieden, dass ein alter In-Memory-Prozess lange genug bestehen bleibt, um Chunks verzögert
aus einem Paketbaum zu laden, der bereits ersetzt wurde. Shell-`openclaw update`
bleibt der bevorzugte Pfad für beaufsichtigte Installationen, da es den Service rund um die Aktualisierung stoppen und
neu starten kann.

## Nach der Aktualisierung

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

### Commit festlegen (Quellcode)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Zurück zur neuesten Version: `git checkout main && git pull`.

## Wenn Sie feststecken

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` auf Quellcode-Checkouts bootstrapt der Updater `pnpm` bei Bedarf automatisch. Wenn Sie einen pnpm/corepack-Bootstrap-Fehler sehen, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` wieder) und führen Sie die Aktualisierung erneut aus.
- Prüfen: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Zustandsprüfungen nach Aktualisierungen.
- [Migration](/de/install/migrating): Migrationsleitfäden für Hauptversionen.

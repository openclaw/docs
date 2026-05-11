---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder aus dem Quellcode) sowie Rollback-Strategie
title: Wird aktualisiert
x-i18n:
    generated_at: "2026-05-11T20:32:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb1506ed87b1cf2e4928987c9dbfaff17d47b87f6c18239d694e0f55deb609f7
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw aktuell.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Der Befehl erkennt Ihren Installationstyp (npm oder git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet den Gateway neu.

```bash
openclaw update
```

So wechseln Sie Kanäle oder wählen eine bestimmte Version aus:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # Vorschau ohne Anwendung
```

`openclaw update` akzeptiert kein `--verbose`. Verwenden Sie für die Update-Diagnose
`--dry-run`, um die geplanten Aktionen vorab anzuzeigen, `--json` für strukturierte Ergebnisse oder
`openclaw update status --json`, um Kanal- und Verfügbarkeitsstatus zu prüfen. Das
Installationsprogramm hat ein eigenes `--verbose`-Flag, dieses Flag ist jedoch nicht Teil von
`openclaw update`.

`--channel beta` bevorzugt Beta, aber die Laufzeit fällt auf Stable/Latest zurück, wenn
das Beta-Tag fehlt oder älter als die neueste stabile Version ist. Verwenden Sie `--tag beta`,
wenn Sie das rohe npm-Beta-dist-tag für ein einmaliges Paket-Update möchten.

Bei verwalteten Plugins ist der Fallback des Beta-Kanals eine Warnung: Das Core-Update kann
weiterhin erfolgreich sein, während ein Plugin seine aufgezeichnete Standard-/Latest-Version verwendet, weil keine
Plugin-Beta verfügbar ist.

Siehe [Entwicklungskanäle](/de/install/development-channels) für die Kanal-Semantik.

## Zwischen npm- und git-Installationen wechseln

Verwenden Sie Kanäle, wenn Sie den Installationstyp ändern möchten. Der Updater behält Ihren
Status, Ihre Konfiguration, Anmeldedaten und den Workspace in `~/.openclaw`; er ändert nur,
welche OpenClaw-Codeinstallation die CLI und der Gateway verwenden.

```bash
# npm-Paketinstallation -> editierbarer git-Checkout
openclaw update --channel dev

# git-Checkout -> npm-Paketinstallation
openclaw update --channel stable
```

Führen Sie zuerst `--dry-run` aus, um den exakten Wechsel des Installationsmodus vorab anzuzeigen:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Der Kanal `dev` stellt einen git-Checkout sicher, baut ihn und installiert die globale CLI
aus diesem Checkout. Die Kanäle `stable` und `beta` verwenden Paketinstallationen. Wenn der
Gateway bereits installiert ist, aktualisiert `openclaw update` die Dienstmetadaten
und startet ihn neu, sofern Sie nicht `--no-restart` übergeben.

## Alternative: Installationsprogramm erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um einen bestimmten Installationstyp über
das Installationsprogramm zu erzwingen, übergeben Sie `--install-method git --no-onboard` oder
`--install-method npm --no-onboard`.

Wenn `openclaw update` nach der npm-Paketinstallationsphase fehlschlägt, führen Sie das
Installationsprogramm erneut aus. Das Installationsprogramm ruft den alten Updater nicht auf; es führt die globale
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

Bevorzugen Sie `openclaw update` für überwachte Installationen, da es den
Paketaustausch mit dem laufenden Gateway-Dienst koordinieren kann. Wenn Sie manuell aktualisieren, während ein
verwalteter Gateway läuft, starten Sie den Gateway unmittelbar nach Abschluss des Paketmanagers
neu, damit der alte Prozess nicht weiter aus ersetzten Paketdateien bedient.

Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert es das Ziel zuerst in
ein temporäres npm-Präfix, verifiziert das gepackte `dist`-Inventar und tauscht dann
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
    OpenClaw behandelt gepackte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Plugin-Paketinstallationen liegen in OpenClaw-eigenen npm-/git-Wurzeln unter dem Benutzerkonfigurationsverzeichnis, und der Gateway-Start verändert den OpenClaw-Paketbaum nicht.

    Einige Linux-npm-Setups installieren globale Pakete unter root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout, da Plugin-Installations-/Update-Befehle außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Geben Sie OpenClaw Schreibzugriff auf seine Konfigurations-/Status-Wurzeln, damit explizite Plugin-Installationen, Plugin-Updates und Doctor-Bereinigungen ihre Änderungen dauerhaft speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Speicherplatz-Vorprüfung">
    Vor Paket-Updates und expliziten Plugin-Installationen versucht OpenClaw nach bestem Bemühen eine Speicherplatzprüfung für das Zielvolume. Wenig Speicherplatz erzeugt eine Warnung mit dem geprüften Pfad, blockiert das Update jedoch nicht, da Dateisystem-Quotas, Snapshots und Netzwerkvolumes sich nach der Prüfung ändern können. Die tatsächliche Paketmanager-Installation und die Post-Install-Verifizierung bleiben maßgeblich.
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

| Kanal    | Verhalten                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` hinweg an (verteilter Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                               |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                        |

Der Gateway protokolliert beim Start außerdem einen Update-Hinweis (deaktivieren mit `update.checkOnStart: false`).
Für Downgrade oder Incident-Wiederherstellung setzen Sie `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung, um automatische Anwendungen auch dann zu blockieren, wenn `update.auto.enabled` konfiguriert ist. Update-Hinweise beim Start können weiterhin ausgeführt werden, sofern `update.checkOnStart` nicht ebenfalls deaktiviert ist.

Paketmanager-Updates, die über den Live-Gateway-Control-Plane-Handler angefordert werden,
erzwingen nach dem Paketaustausch einen nicht aufgeschobenen Update-Neustart ohne Cooldown. Dadurch wird
vermieden, dass ein alter In-Memory-Prozess lange genug bestehen bleibt, um Chunks lazy-loaden zu können
aus einem Paketbaum, der bereits ersetzt wurde. Shell-`openclaw update`
bleibt der bevorzugte Pfad für überwachte Installationen, da er den Dienst rund um das Update stoppen und
neu starten kann.

## Nach dem Update

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert Konfiguration, prüft DM-Richtlinien und überprüft die Gateway-Gesundheit. Details: [Doctor](/de/gateway/doctor)

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
- Bei `openclaw update --channel dev` auf Quellcode-Checkouts bootstrapt der Updater `pnpm` bei Bedarf automatisch. Wenn Sie einen pnpm-/corepack-Bootstrap-Fehler sehen, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` erneut) und führen Sie das Update erneut aus.
- Prüfen Sie: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Gesundheitsprüfungen nach Updates.
- [Migration](/de/install/migrating): Migrationsleitfäden für Hauptversionen.

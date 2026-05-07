---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder aus dem Quellcode) sowie Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-05-07T01:52:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw aktuell.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Es erkennt Ihren Installationstyp (npm oder git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet den Gateway neu.

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

`openclaw update` akzeptiert kein `--verbose`. Verwenden Sie für Update-Diagnosen
`--dry-run`, um die geplanten Aktionen vorab anzuzeigen, `--json` für strukturierte Ergebnisse oder
`openclaw update status --json`, um Kanal- und Verfügbarkeitsstatus zu prüfen. Der
Installer hat ein eigenes `--verbose`-Flag, aber dieses Flag ist nicht Teil von
`openclaw update`.

`--channel beta` bevorzugt Beta, aber die Runtime fällt auf Stable/Latest zurück, wenn
das Beta-Tag fehlt oder älter als das neueste Stable-Release ist. Verwenden Sie `--tag beta`,
wenn Sie das rohe npm-Beta-dist-tag für ein einmaliges Paket-Update möchten.

OpenClaw stellt noch keinen LTS- oder monatlichen Support-Update-Kanal bereit. Wir arbeiten
auf SemVer-kompatible monatliche Support-Linien hin, aber heute sind die unterstützten
Kanäle weiterhin `stable`, `beta` und `dev`.

Siehe [Entwicklungskanäle](/de/install/development-channels) für die Kanal-Semantik.

## Zwischen npm- und git-Installationen wechseln

Verwenden Sie Kanäle, wenn Sie den Installationstyp ändern möchten. Der Updater behält Ihren
Status, Ihre Konfiguration, Anmeldedaten und Ihren Workspace in `~/.openclaw`; er ändert nur,
welche OpenClaw-Code-Installation die CLI und der Gateway verwenden.

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

Der `dev`-Kanal stellt ein git-Checkout sicher, baut es und installiert die globale CLI
aus diesem Checkout. Die Kanäle `stable` und `beta` verwenden Paketinstallationen. Wenn der
Gateway bereits installiert ist, aktualisiert `openclaw update` die Service-Metadaten
und startet ihn neu, sofern Sie nicht `--no-restart` übergeben.

## Alternative: Installer erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um über den
Installer einen bestimmten Installationstyp zu erzwingen, übergeben Sie
`--install-method git --no-onboard` oder
`--install-method npm --no-onboard`.

Wenn `openclaw update` nach der npm-Paketinstallationsphase fehlschlägt, führen Sie den
Installer erneut aus. Der Installer ruft den alten Updater nicht auf; er führt die globale
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

Bevorzugen Sie `openclaw update` für überwachte Installationen, weil es den
Pakettausch mit dem laufenden Gateway-Service koordinieren kann. Wenn Sie manuell aktualisieren, während ein
verwalteter Gateway läuft, starten Sie den Gateway sofort neu, nachdem der Paketmanager
fertig ist, damit der alte Prozess nicht weiter aus ersetzten Paketdateien bedient.

Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert es das Ziel zuerst in
ein temporäres npm-Präfix, verifiziert das gepackte `dist`-Inventar und tauscht dann
den sauberen Paketbaum in das echte globale Präfix. Dadurch wird vermieden, dass npm ein
neues Paket über veraltete Dateien aus dem alten Paket legt. Wenn der Installationsbefehl fehlschlägt,
versucht OpenClaw es einmal erneut mit `--omit=optional`. Dieser erneute Versuch hilft Hosts, auf denen native
optionale Abhängigkeiten nicht kompilieren können, während der ursprüngliche Fehler sichtbar bleibt,
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
    OpenClaw behandelt gepackte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Plugin-Paketinstallationen liegen in OpenClaw-eigenen npm/git-Roots unter dem Benutzerkonfigurationsverzeichnis, und der Gateway-Start verändert den OpenClaw-Paketbaum nicht.

    Einige Linux-npm-Setups installieren globale Pakete in root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout, weil Plugin-Installations-/Update-Befehle außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Geben Sie OpenClaw Schreibzugriff auf seine Konfigurations-/Status-Roots, damit explizite Plugin-Installationen, Plugin-Updates und doctor-Bereinigungen ihre Änderungen dauerhaft speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Speicherplatz-Preflight">
    Vor Paket-Updates und expliziten Plugin-Installationen versucht OpenClaw nach bestem Aufwand eine Speicherplatzprüfung für das Zielvolume. Wenig Speicherplatz erzeugt eine Warnung mit dem geprüften Pfad, blockiert das Update aber nicht, weil Dateisystemkontingente, Snapshots und Netzwerkvolumes sich nach der Prüfung ändern können. Die eigentliche Paketmanager-Installation und die Post-Install-Verifizierung bleiben maßgeblich.
  </Accordion>
</AccordionGroup>

## Auto-Updater

Der Auto-Updater ist standardmäßig ausgeschaltet. Aktivieren Sie ihn in `~/.openclaw/openclaw.json`:

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

| Kanal    | Verhalten                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` hinweg an (gestaffelter Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                              |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                                           |

Der Gateway protokolliert beim Start außerdem einen Update-Hinweis (deaktivieren mit `update.checkOnStart: false`).
Für Downgrade oder Incident-Wiederherstellung setzen Sie `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung, um automatische Anwendungen auch dann zu blockieren, wenn `update.auto.enabled` konfiguriert ist. Update-Hinweise beim Start können weiterhin ausgeführt werden, sofern `update.checkOnStart` nicht ebenfalls deaktiviert ist.

Paketmanager-Updates, die über den Live-Gateway-Control-Plane-Handler angefordert werden,
erzwingen nach dem Pakettausch einen nicht verzögerten Update-Neustart ohne Cooldown. Dadurch
bleibt kein alter In-Memory-Prozess lange genug bestehen, um verzögert Chunks
aus einem Paketbaum zu laden, der bereits ersetzt wurde. Shell-`openclaw update`
bleibt der bevorzugte Pfad für überwachte Installationen, weil es den Service rund um
das Update stoppen und neu starten kann.

## Nach dem Aktualisieren

<Steps>

### doctor ausführen

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

### Commit festlegen (Quellcode)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Um zur neuesten Version zurückzukehren: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Für `openclaw update --channel dev` auf Quellcode-Checkouts bootstrapt der Updater bei Bedarf automatisch `pnpm`. Wenn ein pnpm/corepack-Bootstrap-Fehler angezeigt wird, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` erneut) und führen Sie das Update erneut aus.
- Prüfen Sie: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Gesundheitsprüfungen nach Updates.
- [Migration](/de/install/migrating): Migrationsleitfäden für Hauptversionen.

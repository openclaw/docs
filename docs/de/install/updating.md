---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder aus dem Quellcode) sowie Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-30T07:01:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw aktuell.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Der Befehl erkennt Ihren Installationstyp (npm oder git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet den Gateway neu.

```bash
openclaw update
```

So wechseln Sie Channels oder zielen auf eine bestimmte Version ab:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # Vorschau ohne Anwenden
```

`--channel beta` bevorzugt beta, aber die Laufzeit fällt auf stable/latest zurück, wenn
der beta-Tag fehlt oder älter als das neueste stabile Release ist. Verwenden Sie `--tag beta`,
wenn Sie für eine einmalige Paketaktualisierung den rohen npm-beta-dist-tag nutzen möchten.

Siehe [Entwicklungs-Channels](/de/install/development-channels) für die Channel-Semantik.

## Zwischen npm- und git-Installationen wechseln

Verwenden Sie Channels, wenn Sie den Installationstyp ändern möchten. Der Updater behält Ihren
Zustand, Ihre Konfiguration, Anmeldedaten und Ihren Workspace in `~/.openclaw`; er ändert nur,
welche OpenClaw-Codeinstallation die CLI und der Gateway verwenden.

```bash
# npm-Paketinstallation -> bearbeitbarer git-Checkout
openclaw update --channel dev

# git-Checkout -> npm-Paketinstallation
openclaw update --channel stable
```

Führen Sie zuerst mit `--dry-run` aus, um den genauen Wechsel des Installationsmodus in der Vorschau zu sehen:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Der `dev`-Channel stellt einen git-Checkout sicher, baut ihn und installiert die globale CLI
aus diesem Checkout. Die Channels `stable` und `beta` verwenden Paketinstallationen. Wenn der
Gateway bereits installiert ist, aktualisiert `openclaw update` die Dienstmetadaten
und startet ihn neu, außer Sie übergeben `--no-restart`.

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

Um die Wiederherstellung auf eine bestimmte Version oder einen dist-tag festzulegen, fügen Sie `--version` hinzu:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative: manuell mit npm, pnpm oder bun

```bash
npm i -g openclaw@latest
```

Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert es das Ziel zuerst in
ein temporäres npm-Präfix, überprüft das paketierte `dist`-Inventar und tauscht dann
den sauberen Paketbaum in das echte globale Präfix ein. Dadurch wird vermieden, dass npm ein
neues Paket über veraltete Dateien aus dem alten Paket legt. Wenn der Installationsbefehl fehlschlägt,
versucht OpenClaw es einmal mit `--omit=optional` erneut. Dieser erneute Versuch hilft Hosts, auf denen native
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
    OpenClaw behandelt paketierte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Gebündelte Plugin-Laufzeitabhängigkeiten werden stattdessen in einem beschreibbaren Laufzeitverzeichnis bereitgestellt, ohne den Paketbaum zu verändern. Dadurch verhindert `openclaw update` Konflikte mit einem laufenden Gateway oder lokalen Agent, der während derselben Installation Plugin-Abhängigkeiten repariert.

    Einige Linux-npm-Setups installieren globale Pakete unter Verzeichnissen im Besitz von root, etwa `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout über denselben externen Bereitstellungspfad.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Legen Sie ein beschreibbares Bereitstellungsverzeichnis fest, das in `ReadWritePaths` enthalten ist:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` akzeptiert auch eine Pfadliste. OpenClaw löst gebündelte Plugin-Laufzeitabhängigkeiten von links nach rechts über die aufgelisteten Roots auf, behandelt frühere Roots als schreibgeschützte vorinstallierte Schichten und installiert oder repariert nur im letzten beschreibbaren Root:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Wenn `OPENCLAW_PLUGIN_STAGE_DIR` nicht gesetzt ist, verwendet OpenClaw `$STATE_DIRECTORY`, wenn systemd es bereitstellt, und fällt dann auf `~/.openclaw/plugin-runtime-deps` zurück. Der Reparaturschritt behandelt diese Bereitstellung als OpenClaw-eigenen lokalen Paket-Root und ignoriert Benutzer-npm-Präfixe und globale Einstellungen, sodass die npm-Konfiguration der globalen Installation gebündelte Plugin-Abhängigkeiten nicht nach `~/node_modules` oder in den globalen Paketbaum umleitet.

  </Accordion>
  <Accordion title="Speicherplatz-Vorabprüfung">
    Vor Paketaktualisierungen und Reparaturen gebündelter Laufzeitabhängigkeiten versucht OpenClaw eine bestmögliche Speicherplatzprüfung für das Zielvolume. Wenig Speicherplatz erzeugt eine Warnung mit dem geprüften Pfad, blockiert die Aktualisierung aber nicht, weil sich Dateisystemkontingente, Snapshots und Netzwerkvolumes nach der Prüfung ändern können. Die tatsächliche npm-Installation, das Kopieren und die Prüfung nach der Installation bleiben maßgeblich.
  </Accordion>
  <Accordion title="Gebündelte Plugin-Laufzeitabhängigkeiten">
    Paketierte Installationen halten gebündelte Plugin-Laufzeitabhängigkeiten aus dem schreibgeschützten Paketbaum heraus. Beim Start und während `openclaw doctor --fix` repariert OpenClaw Laufzeitabhängigkeiten nur für gebündelte Plugins, die in der Konfiguration aktiv sind, über eine Legacy-Channel-Konfiguration aktiv sind oder durch ihren gebündelten Manifest-Standard aktiviert sind. Allein gespeicherter Channel-Auth-Zustand löst keine Reparatur von Laufzeitabhängigkeiten beim Gateway-Start aus.

    Explizite Deaktivierung hat Vorrang. Ein deaktiviertes Plugin oder ein deaktivierter Channel erhält seine Laufzeitabhängigkeiten nicht repariert, nur weil es im Paket vorhanden ist. Externe Plugins und benutzerdefinierte Ladepfade verwenden weiterhin `openclaw plugins install` oder `openclaw plugins update`.

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

| Channel  | Verhalten                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (gestaffelter Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                                            |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                                    |

Der Gateway protokolliert beim Start außerdem einen Aktualisierungshinweis (deaktivierbar mit `update.checkOnStart: false`).
Für Downgrade oder Wiederherstellung nach einem Vorfall setzen Sie `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung, um automatische Anwendungen zu blockieren, selbst wenn `update.auto.enabled` konfiguriert ist. Aktualisierungshinweise beim Start können weiterhin ausgeführt werden, außer `update.checkOnStart` ist ebenfalls deaktiviert.

## Nach dem Aktualisieren

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert Konfiguration, prüft DM-Richtlinien und überprüft die Gateway-Integrität. Details: [Doctor](/de/gateway/doctor)

### Gateway neu starten

```bash
openclaw gateway restart
```

### Überprüfen

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
- Bei `openclaw update --channel dev` auf Quell-Checkouts bootstrapt der Updater `pnpm` bei Bedarf automatisch. Wenn Sie einen pnpm/corepack-Bootstrap-Fehler sehen, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` wieder) und führen Sie die Aktualisierung erneut aus.
- Prüfen Sie: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Integritätsprüfungen nach Aktualisierungen.
- [Migration](/de/install/migrating): Migrationsleitfäden für Hauptversionen.

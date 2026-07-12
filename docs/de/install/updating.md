---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder Quellcode) sowie Rollback-Strategie
title: Aktualisierung
x-i18n:
    generated_at: "2026-07-12T15:34:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw auf dem neuesten Stand.

Informationen zum Ersetzen von Images für Docker, Podman und Kubernetes finden Sie unter
[Container-Images aktualisieren](/de/install/docker#upgrading-container-images). Das
Gateway führt vor der Betriebsbereitschaft upgradesichere Startarbeiten aus und wird beendet, wenn der eingebundene
Zustand manuell repariert werden muss.

## Empfohlen: `openclaw update`

Erkennt Ihren Installationstyp (npm oder git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet das Gateway neu.

```bash
openclaw update
```

Wechseln Sie den Kanal oder wählen Sie eine bestimmte Version:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # Vorschau ohne Anwendung
```

`openclaw update` verfügt über kein `--verbose`-Flag (das Installationsprogramm hingegen schon). Verwenden Sie zur Diagnose
`--dry-run`, um eine Vorschau der geplanten Aktionen anzuzeigen, `--json` für strukturierte Ergebnisse oder
`openclaw update status --json`, um den Kanal- und Verfügbarkeitsstatus zu prüfen.

`--channel beta` bevorzugt das npm-dist-tag „beta“, fällt jedoch auf „stable/latest“
zurück, wenn das Beta-Tag fehlt oder seine Version älter als die neueste stabile
Version ist. Verwenden Sie stattdessen `--tag beta` für eine einmalige Paketaktualisierung,
die an das unverarbeitete npm-beta-dist-tag gebunden ist.

`--channel extended-stable` gilt nur für Pakete, und die Installation erfolgt
weiterhin ausschließlich im Vordergrund. OpenClaw liest den öffentlichen npm-Selektor
`extended-stable`, überprüft das ausgewählte exakte Paket und installiert genau diese
Version. Fehlende oder inkonsistente Registry-Daten führen zu einem sicheren Abbruch;
es wird niemals auf `latest` zurückgegriffen. Wenn die ausgewählte Version älter als
die installierte Version ist, ist weiterhin die normale Bestätigung des Downgrades
erforderlich. Die CLI speichert den Kanal nach einer erfolgreichen Aktualisierung des
Kerns; ein direktes `npm install -g openclaw@extended-stable` aktualisiert
`update.channel` nicht.
Nach dem Austausch des Kerns werden geeignete offizielle npm-Plugins mit nicht
angegebener/standardmäßiger oder `latest`-Zielsetzung auf genau diese Kernversion
abgeglichen. Exakte Versionsbindungen und explizite Tags ungleich `latest`,
Drittanbieter-Plugins sowie Quellen außerhalb von npm bleiben unverändert.
Kataloginstallationen, die von aktuellen OpenClaw-Versionen erstellt werden, behalten
diese Standardzielsetzung bei. Ältere Datensätze, die nur eine exakte Version enthalten,
bleiben gebunden, da OpenClaw eine alte automatische Versionsbindung nicht zuverlässig
von einer benutzerdefinierten Versionsbindung unterscheiden kann; führen Sie im Kanal
„extended-stable“ einmal `openclaw plugins update @openclaw/name` aus, um für dieses
Plugin wieder die Nachverfolgung der exakten Kernversion zu aktivieren.

`--channel dev` stellt einen persistenten, fortlaufend aktualisierten Checkout des GitHub-Branches `main` bereit. Für eine einmalige
Paketaktualisierung wird `--tag main` der Paketspezifikation `github:openclaw/openclaw#main`
zugeordnet und direkt über den Ziel-Paketmanager (npm/pnpm/bun) installiert.

Bei verwalteten Plugins ist eine fehlende Beta-Version eine Warnung und kein Fehler: Die
Kernaktualisierung kann dennoch erfolgreich abgeschlossen werden, während ein Plugin auf seine gespeicherte
Standardversion/neueste Version zurückfällt.

Unter [Release-Kanäle](/de/install/development-channels) finden Sie die Semantik der Kanäle.

## Zwischen npm- und Git-Installationen wechseln

Verwenden Sie Kanäle, um den Installationstyp zu ändern. Der Updater behält Ihren Zustand, Ihre Konfiguration,
Ihre Anmeldedaten und Ihren Arbeitsbereich in `~/.openclaw` bei; er ändert nur, welche OpenClaw-
Codeinstallation die CLI und das Gateway verwenden.

```bash
# npm-Paketinstallation -> bearbeitbarer Git-Checkout
openclaw update --channel dev

# Git-Checkout -> npm-Paketinstallation
openclaw update --channel stable
```

Zeigen Sie zunächst eine Vorschau des Wechsels des Installationsmodus an:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` stellt sicher, dass ein Git-Checkout vorhanden ist, baut ihn und installiert die globale CLI aus diesem
Checkout. Die Kanäle `stable`, `extended-stable` und `beta` verwenden Paketinstallationen.
Extended-Stable wird bei einem Git-Checkout abgelehnt, ohne ihn zu verändern oder
zu konvertieren. Wenn der Gateway bereits installiert ist, aktualisiert `openclaw update`
die Dienstmetadaten und startet ihn neu, sofern Sie nicht `--no-restart` übergeben.

Bei Paketinstallationen mit einem verwalteten Gateway-Dienst verwendet `openclaw update`
das von diesem Dienst verwendete Paketstammverzeichnis als Ziel. Wenn der Shell-Befehl `openclaw`
aus einer anderen Installation stammt, gibt der Updater beide Stammverzeichnisse und den
Node-Pfad des verwalteten Dienstes aus und prüft diese Node-Version anhand der
`engines.node`-Anforderung des Ziel-Releases, bevor das Paket ersetzt wird.

## Alternative: Installationsprogramm erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um einen bestimmten Installationstyp zu erzwingen, übergeben Sie
`--install-method git --no-onboard` oder `--install-method npm --no-onboard`.

Wenn `openclaw update` nach der Installationsphase des npm-Pakets fehlschlägt, führen Sie stattdessen das
Installationsprogramm erneut aus. Es ruft den Updater nicht auf, sondern führt die globale Paketinstallation
direkt aus und kann eine teilweise aktualisierte npm-Installation wiederherstellen.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Fixieren Sie die Wiederherstellung mit `--version` auf eine bestimmte Version oder ein bestimmtes Dist-Tag:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative: npm, pnpm oder bun manuell verwenden

```bash
npm i -g openclaw@latest
```

Bevorzugen Sie `openclaw update` für überwachte Installationen: Der Befehl kann den Paketaustausch
mit dem laufenden Gateway-Dienst koordinieren. Wenn Sie eine überwachte Installation manuell
aktualisieren, stoppen Sie zuerst den verwalteten Gateway. Paketmanager ersetzen Dateien
an Ort und Stelle, andernfalls könnte ein laufender Gateway versuchen, während des Austauschs
Core- oder Plugin-Dateien zu laden. Starten Sie den Gateway neu, nachdem der Paketmanager
fertig ist, damit er die neue Installation übernimmt.

Wenn `openclaw update` bei einer root-eigenen systemweiten Linux-Installation mit
`EACCES` fehlschlägt, stellen Sie sie mit dem systemweiten npm wieder her und lassen Sie den Gateway
während des manuellen Austauschs gestoppt. Verwenden Sie dieselben Profil-Flags bzw. dieselbe Umgebung, die Sie
normalerweise für diesen Gateway verwenden. Ersetzen Sie `/usr/bin/npm` durch das systemweite npm, dem das
root-eigene globale Präfix auf Ihrem Host gehört:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Überprüfen Sie anschließend:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert der Befehl das Ziel
zunächst in einem temporären npm-Präfix, überprüft den Inhalt des paketierten `dist`-Verzeichnisses und
tauscht anschließend den bereinigten Paketbaum in das tatsächliche globale Präfix ein — dadurch wird vermieden, dass npm
ein neues Paket über veraltete Dateien des alten Pakets legt. Wenn der Installationsbefehl
fehlschlägt, versucht OpenClaw es einmal erneut mit `--omit=optional`, was bei Hosts hilfreich ist,
auf denen native optionale Abhängigkeiten nicht kompiliert werden können.

Von OpenClaw verwaltete npm-Aktualisierungs- und Plugin-Aktualisierungsbefehle heben außerdem die Supply-Chain-Quarantäne `min-release-age` von npm (oder den älteren Konfigurationsschlüssel `before`) für den untergeordneten npm-Prozess auf. Diese Richtlinie dient dem allgemeinen Schutz, doch eine explizite OpenClaw-Aktualisierung bedeutet: „Die ausgewählte Version jetzt installieren.“

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Erweiterte Themen zur npm-Installation

<AccordionGroup>
  <Accordion title="Schreibgeschützter Paketbaum">
    OpenClaw behandelt paketierte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Plugin-Paketinstallationen befinden sich in OpenClaw-eigenen npm-/Git-Stammverzeichnissen unterhalb des Benutzerkonfigurationsverzeichnisses, und der Start des Gateways verändert den OpenClaw-Paketbaum nicht.

    Einige npm-Konfigurationen unter Linux installieren globale Pakete in Root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt diese Verzeichnisstruktur, da Befehle zur Installation und Aktualisierung von Plugins außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Gewähren Sie OpenClaw Schreibzugriff auf seine Konfigurations- und Zustandsstammverzeichnisse, damit explizite Plugin-Installationen, Plugin-Aktualisierungen und Bereinigungen durch Doctor ihre Änderungen dauerhaft speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Vorabprüfung des Speicherplatzes">
    Vor Paketaktualisierungen und expliziten Plugin-Installationen versucht OpenClaw nach bestem Bemühen, den verfügbaren Speicherplatz auf dem Zielvolume zu prüfen. Bei geringem Speicherplatz wird eine Warnung mit dem geprüften Pfad ausgegeben, die Aktualisierung jedoch nicht blockiert, da sich Dateisystemkontingente, Snapshots und Netzwerkvolumes nach der Prüfung ändern können. Maßgeblich bleiben die tatsächliche Installation durch den Paketmanager und die Überprüfung nach der Installation.
  </Accordion>
</AccordionGroup>

## Automatische Aktualisierung

Standardmäßig deaktiviert. Aktivieren Sie sie in `~/.openclaw/openclaw.json`:

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

| Kanal             | Verhalten                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Wartet `stableDelayHours` (Standard: 6) und führt die Aktualisierung dann mit deterministischem Jitter über `stableJitterHours` (Standard: 12) für eine gestaffelte Einführung durch. |
| `extended-stable` | Prüft beim Start und bei aktiviertem `checkOnStart` alle 24 Stunden auf einen schreibgeschützten Aktualisierungshinweis. Führt Aktualisierungen niemals automatisch durch.    |
| `beta`            | Prüft alle `betaCheckIntervalHours` (Standard: 1) und führt die Aktualisierung sofort durch.                                                                                 |
| `dev`             | Keine automatische Aktualisierung. Verwenden Sie `openclaw update` manuell.                                                                                                 |

Der Gateway protokolliert beim Start außerdem einen Aktualisierungshinweis (deaktivierbar mit
`update.checkOnStart: false`). Gespeicherte Extended-Stable-Auswahlen verwenden diesen
schreibgeschützten Hinweispfad und das bestehende 24-Stunden-Hinweisintervall, lösen jedoch niemals
eine automatische Installation, Übergabe, einen Neustart, eine Stable-Verzögerung bzw. -Streuung oder Beta-Abfragen aus.
Legen Sie für ein Downgrade oder die Wiederherstellung nach einem Vorfall `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung fest, um automatische Anwendungen zu blockieren, selbst wenn `update.auto.enabled` konfiguriert ist. Aktualisierungshinweise beim Start können weiterhin ausgeführt werden, sofern nicht auch `update.checkOnStart` deaktiviert ist.

Über die Control Plane des laufenden Gateways angeforderte Paketmanager-Aktualisierungen
(`update.run`) ersetzen nicht den Paketbaum innerhalb des laufenden Gateway-
Prozesses. Bei Installationen als verwalteter Dienst startet der Gateway eine entkoppelte Übergabe,
wird beendet und überlässt es dem regulären CLI-Pfad `openclaw update --yes --json`, den
Dienst zu stoppen, das Paket zu ersetzen, die Dienstmetadaten zu aktualisieren, neu zu starten, die
Gateway-Version und -Erreichbarkeit zu überprüfen und nach Möglichkeit einen installierten, aber nicht geladenen macOS-
LaunchAgent wiederherzustellen. Wenn der Gateway diese Übergabe nicht sicher durchführen kann,
meldet `update.run` stattdessen einen sicheren Shell-Befehl, anstatt den Paketmanager
im Prozess auszuführen.

Die Aktualisierungskarte in der Seitenleiste der Control UI startet denselben `update.run`-Ablauf. In der
signierten macOS-App aktualisiert die Karte zunächst die App über Sparkle; nach dem erneuten Start
bringt die App ihren verwalteten lokalen Gateway auf die entsprechende Version.

## Nach der Aktualisierung

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert die Konfiguration, überprüft DM-Richtlinien und prüft den Zustand des Gateways. Details: [Doctor](/de/gateway/doctor)

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
`npm view openclaw version` zeigt die aktuell veröffentlichte Version an.
</Tip>

### Commit festlegen (Quellcode)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

So kehren Sie zur neuesten Version zurück: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` in Quellcode-Checkouts richtet der Updater `pnpm` bei Bedarf automatisch ein. Wenn ein pnpm/corepack-Bootstrap-Fehler angezeigt wird, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` erneut) und führen Sie das Update erneut aus.
- Siehe: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie auf Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandte Themen

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Zustandsprüfungen nach Aktualisierungen.
- [Migration](/de/install/migrating): Migrationsanleitungen für Hauptversionen.

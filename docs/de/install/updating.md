---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder Quellcode) sowie Rollback-Strategie
title: Aktualisierung
x-i18n:
    generated_at: "2026-07-12T01:47:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw auf dem neuesten Stand.

Informationen zum Ersetzen von Images für Docker, Podman und Kubernetes finden Sie unter
[Container-Images aktualisieren](/de/install/docker#upgrading-container-images). Das
Gateway führt vor der Bereitschaft sicher ausführbare Aktualisierungsarbeiten aus und
wird beendet, wenn der eingebundene Zustand manuell repariert werden muss.

## Empfohlen: `openclaw update`

Erkennt Ihren Installationstyp (npm oder Git), lädt die neueste Version, führt `openclaw doctor` aus und startet das Gateway neu.

```bash
openclaw update
```

Wechseln Sie den Kanal oder geben Sie eine bestimmte Version an:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # Vorschau ohne Anwendung
```

`openclaw update` hat kein Flag `--verbose` (das Installationsprogramm hingegen schon). Verwenden Sie zur Diagnose
`--dry-run`, um die geplanten Aktionen in einer Vorschau anzuzeigen, `--json` für strukturierte Ergebnisse oder
`openclaw update status --json`, um den Kanal- und Verfügbarkeitsstatus zu prüfen.

`--channel beta` bevorzugt das npm-Dist-Tag „beta“, greift jedoch auf „stable/latest“
zurück, wenn das Beta-Tag fehlt oder seine Version älter als die neueste stabile
Version ist. Verwenden Sie stattdessen `--tag beta` für eine einmalige Paketaktualisierung,
die fest an das unverarbeitete npm-Beta-Dist-Tag gebunden ist.

`--channel extended-stable` ist nur für Pakete verfügbar, und die Installation erfolgt
weiterhin ausschließlich im Vordergrund. OpenClaw liest den öffentlichen npm-Selektor
`extended-stable`, verifiziert das exakt ausgewählte Paket und installiert genau diese
Version. Fehlende oder inkonsistente Registry-Daten führen zu einem sicheren Abbruch;
es wird niemals auf `latest` zurückgegriffen. Wenn die ausgewählte Version älter als die
installierte Version ist, gilt weiterhin die normale Bestätigung für ein Downgrade. Die
CLI speichert den Kanal nach einer erfolgreichen Aktualisierung des Kerns; ein direktes
`npm install -g openclaw@extended-stable` aktualisiert `update.channel` nicht.
Nach dem Austausch des Kerns werden geeignete offizielle npm-Plugins mit unveränderter/
standardmäßiger oder auf `latest` gerichteter Vorgabe exakt auf diese Kernversion
abgeglichen. Exakte Versionsbindungen und explizite Tags außer `latest`, Plugins von
Drittanbietern sowie Quellen außerhalb von npm bleiben unverändert. Kataloginstallationen,
die mit aktuellen OpenClaw-Versionen erstellt wurden, behalten diese Standardvorgabe bei.
Ältere Einträge, die nur eine exakte Version enthalten, bleiben fest an diese gebunden,
da OpenClaw eine alte automatische Bindung nicht sicher von einer benutzerdefinierten
Bindung unterscheiden kann. Führen Sie im Kanal „extended-stable“ einmal
`openclaw plugins update @openclaw/name` aus, damit dieses Plugin wieder die exakte
Kernversion nachverfolgt.

`--channel dev` stellt einen dauerhaften, fortlaufend aktualisierten GitHub-Checkout von
`main` bereit. Für eine einmalige Paketaktualisierung wird `--tag main` auf die
Paketspezifikation `github:openclaw/openclaw#main` abgebildet und direkt über den
vorgesehenen Paketmanager (npm/pnpm/bun) installiert.

Bei verwalteten Plugins ist eine fehlende Beta-Version eine Warnung und kein Fehler:
Die Aktualisierung des Kerns kann trotzdem erfolgreich sein, während ein Plugin auf
seine gespeicherte Standardversion bzw. neueste Version zurückgreift.

Informationen zur Bedeutung der Kanäle finden Sie unter
[Veröffentlichungskanäle](/de/install/development-channels).

## Zwischen npm- und Git-Installationen wechseln

Verwenden Sie Kanäle, um den Installationstyp zu ändern. Das Aktualisierungsprogramm
behält Ihren Zustand, Ihre Konfiguration, Ihre Zugangsdaten und Ihren Arbeitsbereich
unter `~/.openclaw` bei. Es ändert lediglich, welche OpenClaw-Codeinstallation von der
CLI und dem Gateway verwendet wird.

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

`dev` stellt einen Git-Checkout sicher, erstellt ihn und installiert die globale CLI aus
diesem Checkout. Die Kanäle `stable`, `extended-stable` und `beta` verwenden
Paketinstallationen. „extended-stable“ wird bei einem Git-Checkout abgelehnt, ohne ihn
zu verändern oder umzuwandeln. Wenn das Gateway bereits installiert ist, aktualisiert
`openclaw update` die Dienstmetadaten und startet es neu, sofern Sie nicht
`--no-restart` angeben.

Bei Paketinstallationen mit einem verwalteten Gateway-Dienst verwendet
`openclaw update` als Ziel den von diesem Dienst verwendeten Paketstamm. Wenn der
Shell-Befehl `openclaw` aus einer anderen Installation stammt, gibt das
Aktualisierungsprogramm beide Stammverzeichnisse sowie den Node-Pfad des verwalteten
Dienstes aus und prüft diese Node-Version anhand der Anforderung `engines.node` der
Zielversion, bevor das Paket ersetzt wird.

## Alternative: Installationsprogramm erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um die Ersteinrichtung zu überspringen. Um einen
bestimmten Installationstyp zu erzwingen, übergeben Sie
`--install-method git --no-onboard` oder `--install-method npm --no-onboard`.

Wenn `openclaw update` nach der Phase der npm-Paketinstallation fehlschlägt, führen Sie
stattdessen das Installationsprogramm erneut aus. Es ruft das Aktualisierungsprogramm
nicht auf, sondern führt die globale Paketinstallation direkt aus und kann eine
teilweise aktualisierte npm-Installation wiederherstellen.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Binden Sie die Wiederherstellung mit `--version` an eine bestimmte Version oder ein
Dist-Tag:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative: npm, pnpm oder bun manuell verwenden

```bash
npm i -g openclaw@latest
```

Bevorzugen Sie bei überwachten Installationen `openclaw update`: Der Befehl kann den
Paketaustausch mit dem laufenden Gateway-Dienst koordinieren. Wenn Sie eine überwachte
Installation manuell aktualisieren, halten Sie zuerst das verwaltete Gateway an.
Paketmanager ersetzen Dateien direkt, und ein laufendes Gateway könnte andernfalls
versuchen, während des Austauschs Kern- oder Plugin-Dateien zu laden. Starten Sie das
Gateway neu, nachdem der Paketmanager fertig ist, damit es die neue Installation
übernimmt.

Wenn `openclaw update` bei einer systemweiten Linux-Installation im Besitz von root mit
`EACCES` fehlschlägt, führen Sie die Wiederherstellung mit dem systemweiten npm durch und
lassen Sie das Gateway während des manuellen Austauschs angehalten. Verwenden Sie
dieselben Profil-Flags bzw. dieselbe Umgebung, die Sie normalerweise für dieses Gateway
verwenden. Ersetzen Sie `/usr/bin/npm` durch das systemweite npm, dem das globale
root-eigene Präfix auf Ihrem Host gehört:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Führen Sie anschließend die Überprüfung durch:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert es das Ziel
zunächst in ein temporäres npm-Präfix, verifiziert den Bestand des paketierten
`dist`-Verzeichnisses und tauscht anschließend den bereinigten Paketbaum in das
tatsächliche globale Präfix ein. Dadurch wird verhindert, dass npm ein neues Paket über
veraltete Dateien des alten Pakets legt. Wenn der Installationsbefehl fehlschlägt,
wiederholt OpenClaw ihn einmal mit `--omit=optional`. Dies hilft auf Hosts, auf denen
native optionale Abhängigkeiten nicht kompiliert werden können.

Von OpenClaw verwaltete npm-Aktualisierungs- und Plugin-Aktualisierungsbefehle setzen
außerdem die Lieferketten-Quarantäne `min-release-age` von npm (oder den älteren
Konfigurationsschlüssel `before`) für den untergeordneten npm-Prozess außer Kraft. Diese
Richtlinie dient dem allgemeinen Schutz, doch eine explizite OpenClaw-Aktualisierung
bedeutet: „Die ausgewählte Version jetzt installieren.“

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Fortgeschrittene Themen zur npm-Installation

<AccordionGroup>
  <Accordion title="Schreibgeschützter Paketbaum">
    OpenClaw behandelt paketierte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Plugin-Paketinstallationen befinden sich in OpenClaw-eigenen npm-/Git-Stammverzeichnissen unter dem Benutzerkonfigurationsverzeichnis, und der Start des Gateways verändert den OpenClaw-Paketbaum nicht.

    Einige Linux-npm-Konfigurationen installieren globale Pakete in root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt diese Anordnung, da Befehle zur Installation und Aktualisierung von Plugins außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Gewähren Sie OpenClaw Schreibzugriff auf seine Konfigurations- und Zustandsstammverzeichnisse, damit explizite Plugin-Installationen, Plugin-Aktualisierungen und Bereinigungen durch Doctor ihre Änderungen dauerhaft speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Vorabprüfung des Speicherplatzes">
    Vor Paketaktualisierungen und expliziten Plugin-Installationen versucht OpenClaw, den verfügbaren Speicherplatz auf dem Zielvolume nach bestem Bemühen zu prüfen. Bei wenig Speicherplatz wird eine Warnung mit dem geprüften Pfad ausgegeben, die Aktualisierung wird jedoch nicht blockiert, da sich Dateisystemkontingente, Snapshots und Netzwerkvolumes nach der Prüfung ändern können. Maßgeblich bleiben die tatsächliche Installation durch den Paketmanager und die Überprüfung nach der Installation.
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

| Kanal             | Verhalten                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Wartet `stableDelayHours` (Standard: 6) und wendet die Aktualisierung anschließend mit deterministischer Streuung über `stableJitterHours` (Standard: 12) für eine gestaffelte Einführung an. |
| `extended-stable` | Prüft beim Start und bei aktiviertem `checkOnStart` alle 24 Stunden auf einen schreibgeschützten Aktualisierungshinweis. Wendet Aktualisierungen niemals automatisch an.                   |
| `beta`            | Prüft alle `betaCheckIntervalHours` (Standard: 1) und wendet die Aktualisierung sofort an.                                                                                                |
| `dev`             | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                                                                                                   |

Das Gateway protokolliert beim Start außerdem einen Aktualisierungshinweis (deaktivierbar
mit `update.checkOnStart: false`). Gespeicherte „extended-stable“-Auswahlen verwenden
diesen schreibgeschützten Hinweispfad und das bestehende 24-Stunden-Intervall, lösen
jedoch niemals eine automatische Installation, Übergabe, einen Neustart, eine stabile
Verzögerung/Streuung oder Beta-Abfragen aus. Setzen Sie für ein Downgrade oder die
Wiederherstellung nach einem Vorfall `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung,
um automatische Anwendungen auch dann zu blockieren, wenn `update.auto.enabled`
konfiguriert ist. Aktualisierungshinweise beim Start können weiterhin ausgeführt werden,
sofern `update.checkOnStart` nicht ebenfalls deaktiviert ist.

Über die Steuerungsebene des laufenden Gateways (`update.run`) angeforderte
Paketmanager-Aktualisierungen ersetzen den Paketbaum nicht innerhalb des laufenden
Gateway-Prozesses. Bei Installationen mit verwaltetem Dienst startet das Gateway eine
abgekoppelte Übergabe, wird beendet und überlässt dem regulären CLI-Pfad
`openclaw update --yes --json` das Anhalten des Dienstes, das Ersetzen des Pakets, das
Aktualisieren der Dienstmetadaten, den Neustart, die Überprüfung der Gateway-Version und
Erreichbarkeit sowie nach Möglichkeit die Wiederherstellung eines installierten, aber
nicht geladenen macOS-LaunchAgents. Wenn das Gateway diese Übergabe nicht sicher
durchführen kann, gibt `update.run` stattdessen einen sicheren Shell-Befehl aus, anstatt
den Paketmanager innerhalb des Prozesses auszuführen.

Die Aktualisierungskarte in der Seitenleiste der Control UI startet denselben
`update.run`-Ablauf. In der signierten macOS-App aktualisiert die Karte zunächst die App
über Sparkle. Nach dem erneuten Start bringt die App das von ihr verwaltete lokale
Gateway auf die entsprechende Version.

## Nach der Aktualisierung

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert die Konfiguration, prüft Richtlinien für Direktnachrichten und kontrolliert den Zustand des Gateways. Details: [Doctor](/de/gateway/doctor)

### Gateway neu starten

```bash
openclaw gateway restart
```

### Überprüfen

```bash
openclaw health
```

</Steps>

## Zurücksetzen

### Eine Version festlegen (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` zeigt die aktuell veröffentlichte Version an.
</Tip>

### Einen Commit festlegen (Quellcode)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

So kehren Sie zur neuesten Version zurück: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` in Quellcode-Checkouts richtet das Aktualisierungsprogramm `pnpm` bei Bedarf automatisch ein. Wenn ein Bootstrap-Fehler von pnpm/corepack angezeigt wird, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` erneut) und führen Sie die Aktualisierung nochmals aus.
- Lesen Sie: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandte Themen

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Integritätsprüfungen nach Aktualisierungen.
- [Migration](/de/install/migrating): Migrationsanleitungen für Hauptversionen.

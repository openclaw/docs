---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder Quellcode), einschließlich Rollback-Strategie
title: Wird aktualisiert
x-i18n:
    generated_at: "2026-07-24T03:52:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 83444d56e0aa34f47830610538b0c3012903abb812bfe0fffb8163a5db9ac2db
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw auf dem neuesten Stand.

Informationen zum Ersetzen von Images für Docker, Podman und Kubernetes finden Sie unter
[Container-Images aktualisieren](/de/install/docker#upgrading-container-images). Das
Gateway führt vor der Bereitschaft startsichere Aktualisierungsarbeiten aus und wird beendet, wenn der eingebundene
Zustand manuell repariert werden muss.

## Empfohlen: `openclaw update`

Erkennt Ihren Installationstyp (npm, pnpm, Bun oder git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet das Gateway neu.

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

`openclaw update` verfügt über kein Flag `--verbose` (das Installationsprogramm hingegen schon). Verwenden Sie zur Diagnose
`--dry-run` für eine Vorschau der geplanten Aktionen, `--json` für strukturierte Ergebnisse oder
`openclaw update status --json`, um den Kanal- und Verfügbarkeitsstatus zu prüfen.

`--channel beta` bevorzugt das npm-dist-tag für Beta-Versionen, greift jedoch auf stable/latest zurück,
wenn das Beta-Tag fehlt oder seine Version älter als die neueste stabile
Version ist. Verwenden Sie stattdessen `--tag beta` für eine einmalige Paketaktualisierung, die an das unverarbeitete npm-
dist-tag der Beta-Version gebunden ist.

`--channel extended-stable` gilt ausschließlich für Pakete, und die Installation wird weiterhin
nur im Vordergrund ausgeführt. OpenClaw liest den öffentlichen npm-Selektor `extended-stable`,
überprüft das exakt ausgewählte Paket und installiert genau diese Version. Fehlende
oder inkonsistente Registry-Daten führen zu einem Abbruch; es wird niemals auf `latest` zurückgegriffen.
Wenn die ausgewählte Version älter als die installierte Version ist, gilt weiterhin
die normale Bestätigung für ein Downgrade. Die CLI speichert den Kanal nach einer
erfolgreichen Aktualisierung des Kerns; ein direkter Aufruf von `npm install -g openclaw@extended-stable`
aktualisiert `update.channel` nicht.
Nach dem Austausch des Kerns werden geeignete offizielle npm-Plugins mit unveränderter/standardmäßiger oder
`latest`-Vorgabe auf genau diese Kernversion angeglichen. Exakte Fixierungen und explizite
Tags, die nicht `latest` entsprechen, Drittanbieter-Plugins und Quellen außerhalb von npm bleiben unverändert.
Durch aktuelle OpenClaw-Versionen erstellte Kataloginstallationen behalten diese Standardvorgabe
bei. Ältere Datensätze, die nur eine exakte Version enthalten, bleiben fixiert, da
OpenClaw eine alte automatische Fixierung nicht zuverlässig von einer benutzerdefinierten Fixierung unterscheiden kann. Führen Sie
`openclaw plugins update @openclaw/name` einmal im extended-stable-Kanal aus,
damit dieses Plugin wieder exakt der Kernversion folgt.

`--channel dev` stellt einen dauerhaften, fortlaufend aktualisierten GitHub-Checkout von `main` bereit. Für eine einmalige
Paketaktualisierung wird `--tag main` der Paketspezifikation `github:openclaw/openclaw#main`
zugeordnet und direkt über den gewünschten Paketmanager (npm/pnpm/bun) installiert.

Bei verwalteten Plugins ist eine fehlende Beta-Version eine Warnung und kein Fehler: Die
Kernaktualisierung kann dennoch erfolgreich abgeschlossen werden, während ein Plugin auf seine gespeicherte
Standard-/aktuelle Version zurückgreift.

Informationen zur Bedeutung der Kanäle finden Sie unter [Release-Kanäle](/de/install/development-channels).

## Zwischen npm- und git-Installationen wechseln

Verwenden Sie Kanäle, um den Installationstyp zu ändern. Das Aktualisierungsprogramm behält Ihren Zustand, Ihre Konfiguration,
Ihre Anmeldedaten und Ihren Arbeitsbereich in `~/.openclaw` bei; es ändert lediglich, welche OpenClaw-
Codeinstallation von CLI und Gateway verwendet wird.

```bash
# npm-Paketinstallation -> bearbeitbarer git-Checkout
openclaw update --channel dev

# git-Checkout -> npm-Paketinstallation
openclaw update --channel stable
```

Zeigen Sie zunächst eine Vorschau des Wechsels des Installationsmodus an:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` stellt einen git-Checkout sicher, erstellt ihn und installiert daraus die globale CLI.
Die Kanäle `stable`, `extended-stable` und `beta` verwenden Paketinstallationen.
Extended-stable wird bei einem git-Checkout abgelehnt, ohne ihn zu verändern oder
zu konvertieren. Wenn das Gateway bereits installiert ist, aktualisiert `openclaw update`
die Dienstmetadaten und startet es neu, sofern Sie nicht `--no-restart` übergeben.

Bei Paketinstallationen mit einem verwalteten Gateway-Dienst zielt `openclaw update`
auf das von diesem Dienst verwendete Paketstammverzeichnis. Wenn der Shell-Befehl `openclaw`
aus einer anderen Installation stammt, gibt das Aktualisierungsprogramm beide Stammverzeichnisse und den Node-Pfad
des verwalteten Dienstes aus und prüft diese Node-Version anhand der Anforderung
`engines.node` der Zielversion, bevor das Paket ersetzt wird.

## Server mit Quellcode-Checkout (Referenzskript)

Teams, die ein Gateway direkt aus einem git-Checkout auf einem Server ausführen, können es
innerhalb dieses Checkouts mit `scripts/update-gateway.sh` aktualisieren. Es dient als Referenz
für eine effiziente Aktualisierung eines Quellcode-Servers: Es stellt versionierte Build-Ausgaben wieder her, die
`pnpm build` neu schreibt, bricht bei allen anderen lokalen Änderungen ab, führt einen Fast-Forward für
`main` aus (oder basiert einen lokalen Server-Branch auf `origin/main` neu), installiert
Abhängigkeiten, führt einen sauberen Build aus und startet das Gateway neu.

```bash
ssh you@server 'cd /path/to/openclaw && scripts/update-gateway.sh'
```

Überschreiben Sie den Neustart für benutzerdefinierte Diensteinheiten oder überspringen Sie ihn vollständig:

```bash
OPENCLAW_UPDATE_RESTART_CMD='systemctl --user restart openclaw-gateway.service' scripts/update-gateway.sh
OPENCLAW_UPDATE_RESTART_CMD='' scripts/update-gateway.sh
```

Für eine einfache Quellcodeinstallation eines einzelnen Benutzers sollten Sie stattdessen `openclaw update --channel dev`
bevorzugen – damit werden Checkout, Build und Gateway-Neustart für Sie verwaltet.

## Alternative: Installationsprogramm erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um einen bestimmten Installationstyp zu erzwingen, übergeben Sie
`--install-method git --no-onboard` oder `--install-method npm --no-onboard`.

Wenn `openclaw update` nach der Phase der npm-Paketinstallation fehlschlägt, führen Sie stattdessen das
Installationsprogramm erneut aus. Es ruft das Aktualisierungsprogramm nicht auf, sondern führt die globale Paketinstallation
direkt aus und kann eine teilweise aktualisierte npm-Installation wiederherstellen.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Fixieren Sie die Wiederherstellung mit `--version` auf eine bestimmte Version oder ein dist-tag:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative: manuell mit npm, pnpm oder bun

```bash
npm i -g openclaw@latest
```

Bevorzugen Sie `openclaw update` für überwachte Installationen: Damit kann der Austausch des Pakets
mit dem laufenden Gateway-Dienst koordiniert werden. Wenn Sie eine überwachte
Installation manuell aktualisieren, beenden Sie zunächst das verwaltete Gateway. Paketmanager ersetzen Dateien
direkt, und ein laufendes Gateway könnte andernfalls versuchen, während des Austauschs Kern- oder Plugin-Dateien
zu laden. Starten Sie das Gateway nach Abschluss des Paketmanagers neu, damit es
die neue Installation übernimmt.

Wenn bei einer root-eigenen systemweiten Linux-Installation `openclaw update` mit
`EACCES` fehlschlägt, führen Sie die Wiederherstellung mit dem systemeigenen npm durch und lassen Sie das Gateway während des
manuellen Austauschs angehalten. Verwenden Sie dieselben Profil-Flags bzw. dieselbe Umgebung, die Sie normalerweise für
dieses Gateway verwenden. Ersetzen Sie `/usr/bin/npm` durch das systemeigene npm, dem das
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

Wenn `openclaw update` eine globale npm-Installation verwaltet, installiert es das Ziel
zunächst in einem temporären npm-Präfix. Das Kandidatenpaket validiert während `preinstall` die Node-Version
des Hosts; erst danach überprüft OpenClaw den Bestand des gepackten
`dist` und verschiebt den sauberen Paketbaum in das tatsächliche globale Präfix. Eine
gepackte Abschlussprüfung wird aus dem erwarteten Bestand ausgelassen und erst entfernt,
nachdem `preinstall` erfolgreich abgeschlossen wurde, sodass übersprungene Lebenszyklusskripte ebenfalls vor dem
Austausch zu einem Fehler führen. Ab npm 12 genehmigt das Aktualisierungsprogramm nur den OpenClaw-
Lebenszyklus des Kandidaten; Skripte transitiver Abhängigkeiten bleiben blockiert. Dadurch wird verhindert, dass npm
ein neues Paket über veraltete Dateien des alten Pakets legt. Wenn der Installationsbefehl
fehlschlägt, versucht OpenClaw es einmal mit `--omit=optional` erneut, was auf Hosts hilfreich ist,
auf denen native optionale Abhängigkeiten nicht kompiliert werden können.

Von OpenClaw verwaltete npm-Aktualisierungs- und Plugin-Aktualisierungsbefehle deaktivieren außerdem die
Supply-Chain-Quarantäne `min-release-age` von npm (oder den älteren Konfigurationsschlüssel `before`)
für den untergeordneten npm-Prozess. Diese Richtlinie dient dem allgemeinen Schutz, doch eine
explizite OpenClaw-Aktualisierung bedeutet „die ausgewählte Version jetzt installieren“.

```bash
pnpm add -g openclaw@latest
```

Wenn OpenClaw 2026.7.1 mit pnpm 11 installiert wurde, führen Sie diesen manuellen Befehl einmal aus. Diese
Version stammt aus der Zeit vor dem isolierten Layout globaler Pakete von pnpm 11, sodass das Aktualisierungsprogramm
eine andere npm-Installation mit der laufenden CLI verwechseln kann. Spätere Versionen behalten
die pnpm-Zuordnung bei und folgen bei Aktualisierungen dem Stammverzeichnis des Ersatzpakets. Sie
verwenden außerdem das vom zuständigen Manager gemeldete globale bin-Verzeichnis und brechen vor
Änderungen ab, wenn der verfügbare pnpm-Befehl ein anderes globales Stammverzeichnis oder eine andere Hauptversion meldet
oder wenn das aufrufende Paket verwaist oder dort nicht die einzige aktive OpenClaw-
Installation ist.

Wenn OpenClaw eine globale pnpm-11-Installationsgruppe mit einem anderen Paket teilt, hält das
automatische Aktualisierungsprogramm an, bevor die Gruppe geändert wird. Aktualisieren Sie die ursprüngliche,
durch Kommas getrennte Gruppe manuell, damit die zugehörigen Pakete und die Build-Richtlinie
intakt bleiben.

```bash
bun add -g openclaw@latest
```

### Erweiterte Themen zur npm-Installation

<AccordionGroup>
  <Accordion title="Schreibgeschützter Paketbaum">
    OpenClaw behandelt gepackte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Installationen von Plugin-Paketen befinden sich in OpenClaw-eigenen npm-/git-Stammverzeichnissen unter dem Benutzerkonfigurationsverzeichnis, und der Start des Gateways verändert den OpenClaw-Paketbaum nicht.

    Einige Linux-npm-Konfigurationen installieren globale Pakete in root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout, da Befehle zur Installation und Aktualisierung von Plugins außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Einheiten">
    Gewähren Sie OpenClaw Schreibzugriff auf seine Konfigurations-/Zustandsstammverzeichnisse, damit explizite Plugin-Installationen, Plugin-Aktualisierungen und Doctor-Bereinigungen ihre Änderungen dauerhaft speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Vorabprüfung des Speicherplatzes">
    Vor Paketaktualisierungen und expliziten Plugin-Installationen versucht OpenClaw nach bestem Bemühen, den verfügbaren Speicherplatz des Zielvolumes zu prüfen. Wenig Speicherplatz erzeugt eine Warnung mit dem geprüften Pfad, blockiert die Aktualisierung jedoch nicht, da sich Dateisystemkontingente, Snapshots und Netzwerkvolumes nach der Prüfung ändern können. Die eigentliche Installation durch den Paketmanager und die Überprüfung nach der Installation bleiben maßgeblich.
  </Accordion>
</AccordionGroup>

## Automatisches Aktualisierungsprogramm

Standardmäßig deaktiviert. Aktivieren Sie es in `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
    },
  },
}
```

| Kanal             | Verhalten                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Wird nach einer integrierten Verzögerung mit deterministischem Jitter für eine gestaffelte Einführung angewendet.                   |
| `extended-stable` | Prüft beim Start und alle 24 Stunden auf einen schreibgeschützten Aktualisierungshinweis, wenn `checkOnStart` aktiviert ist. Wird niemals automatisch angewendet. |
| `beta`            | Prüft in einem integrierten Intervall und wendet die Aktualisierung sofort an.                                                      |
| `dev`             | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                                             |

Das Gateway protokolliert beim Start außerdem einen Aktualisierungshinweis (deaktivierbar mit
`update.checkOnStart: false`). Gespeicherte Extended-Stable-Auswahlen verwenden diesen
schreibgeschützten Hinweispfad und das bestehende Hinweisintervall von 24 Stunden, lösen jedoch niemals
eine automatische Installation, Übergabe, einen Neustart, eine Stable-Verzögerung bzw. -Zufallsstreuung oder Beta-Abfragen aus.
Legen Sie für ein Downgrade oder die Wiederherstellung nach einem Vorfall `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung fest, um automatische Anwendungen auch dann zu blockieren, wenn `update.auto.enabled` konfiguriert ist. Aktualisierungshinweise beim Start können weiterhin ausgeführt werden, sofern nicht auch `update.checkOnStart` deaktiviert ist.

Über die Live-Steuerungsebene des Gateways angeforderte Paketmanager-Aktualisierungen
(`update.run`) ersetzen nicht den Paketbaum innerhalb des laufenden Gateway-
Prozesses. Bei Installationen als verwalteter Dienst startet das Gateway eine entkoppelte Übergabe,
beendet sich und überlässt es dem normalen CLI-Pfad `openclaw update --yes --json`, den
Dienst zu stoppen, das Paket zu ersetzen, die Dienstmetadaten zu aktualisieren, neu zu starten, die
Gateway-Version und Erreichbarkeit zu überprüfen und nach Möglichkeit einen installierten, aber nicht geladenen macOS-
LaunchAgent wiederherzustellen. Wenn das Gateway diese Übergabe nicht sicher durchführen kann,
meldet `update.run` stattdessen einen sicheren Shell-Befehl, anstatt den Paketmanager
innerhalb des Prozesses auszuführen.

Die Aktualisierungskarte in der Seitenleiste der Control UI zeigt **Gateway aktualisieren**, wenn sie
diesen Ablauf `update.run` direkt startet. Dies gilt für die im Browser gehostete Control UI, entfernte
Gateways und manuell verwaltete lokale Gateways.

In der signierten macOS-App ändert sich diese Karte bei einem lokalen, von der App verwalteten Gateway zu
**Mac-App + Gateway aktualisieren**. Sparkle aktualisiert zuerst die App; nach dem erneuten Start führt die
App `openclaw update --tag <app-version> --json` aus, startet ihr Gateway neu
und überprüft den Zustand in einem Fortschrittsfenster im Einrichtungsstil. Das Fenster wird nur angezeigt,
wenn dieses verwaltete Gateway aktualisiert, repariert oder installiert werden muss; reine App-Aktualisierungen starten
direkt wieder in die App. Fehlerdetails bleiben zusammen mit den Aktionen Erneut versuchen, [Aktualisierungsanleitung](/de/install/updating) und
[Discord](https://discord.gg/clawd) sichtbar. Die App verwendet diesen koordinierten
Pfad niemals für ein entferntes oder extern verwaltetes Gateway, führt niemals ein Downgrade eines neueren
Gateways durch und überschreibt niemals eine mit `extended-stable` festgelegte Kanalversion.

Wenn die Aktualisierung erfolgreich ist, stellt die App ein einmaliges Begrüßungsereignis für die
zuletzt verwendete direkte Sitzung der obersten Ebene mit einer echten Benutzer-/Kanalinteraktion in die Warteschlange. Cron-Ausführungen,
Heartbeats und ausschließlich im Hintergrund erfolgende Sitzungsaktualisierungen ändern diese Auswahl nicht. Im
Remote-Modus aktualisiert die App nur die Laufzeit ihres lokalen Mac-Nodes und sendet das Ereignis
nur, wenn das verbundene entfernte Gateway mindestens so neu wie die App ist.

## Nach der Aktualisierung

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert die Konfiguration, prüft DM-Richtlinien und kontrolliert den Zustand des Gateways. Details: [Doctor](/de/gateway/doctor)

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

Ein Rollback besteht aus zwei Ebenen:

1. Älteren OpenClaw-Code erneut installieren und dabei den aktuellen Zustand beibehalten.
2. Den Zustand vor der Aktualisierung nur wiederherstellen, wenn der ältere Code eine migrierte
   Konfiguration oder Datenbank nicht verwenden kann.

Beginnen Sie mit einem reinen Code-Rollback. Beim Wiederherstellen des Zustands gehen Änderungen verloren, die nach
der Sicherung vorgenommen wurden.

### Vor der Aktualisierung: überprüfte Sicherung erstellen

`openclaw update` bewahrt automatisch eine Konfigurationskopie vor der Aktualisierung auf, erstellt jedoch keinen
vollständigen Wiederherstellungspunkt für den Zustand. Erstellen Sie vor einer bedeutenden Aktualisierung ausdrücklich
einen solchen:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Das Archivmanifest enthält die OpenClaw-Version und die in der Sicherung enthaltenen
Quellpfade. Das Archiv kann Anmeldedaten, Authentifizierungsprofile und Kanalzustände
enthalten. Speichern Sie es daher mit ausschließlich dem Eigentümer gewährten Berechtigungen und demselben Schutz wie das
Verzeichnis des Live-Zustands. Unter [Sicherung](/de/cli/backup) finden Sie die enthaltenen und bewusst
ausgelassenen Dateien.

Für einen bytegenauen Wiederherstellungspunkt, der auch flüchtige Artefakte enthält, die im
portablen Archiv ausgelassen werden, stoppen Sie das Gateway und verwenden Sie einen von Ihrer Plattform
bereitgestellten Dateisystem-, Volume- oder VM-Snapshot.

### Paketinstallation zurücksetzen

Listen Sie die veröffentlichten Versionen auf, zeigen Sie dann eine Vorschau an und installieren Sie die als funktionsfähig bekannte Version:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

`openclaw update --tag` wird gegenüber einer direkten Installation über den Paketmanager bevorzugt. Der Befehl
erkennt das Downgrade, fordert eine Bestätigung an, führt die Konvergenz verwalteter Plugins
und Kompatibilitätsprüfungen für das installierte Ziel durch, aktualisiert die Dienstmetadaten,
startet das Gateway neu und überprüft die laufende Version. Wenn der gespeicherte
Kanal `extended-stable` ist, verwenden Sie
`--channel stable --tag <known-good-version>`, da exakte einmalige Tags nicht
mit dem Selektor `extended-stable` kombiniert werden können.

Paketaktualisierungen stellen den Kandidaten bereit und überprüfen ihn vor der Aktivierung. Wenn der
Austausch im Dateisystem oder das Ersetzen des Befehls-Shims fehlschlägt, stellt OpenClaw automatisch das alte
Paket wieder her. Wenn nach einem erfolgreichen Austausch später eine Zustandsprüfung des Gateways fehlschlägt,
werden die vorherige Version und Anweisungen für einen manuellen Rollback gemeldet, anstatt
das Paket erneut automatisch zu ersetzen.

Wenn der CLI-Aktualisierungspfad nicht verfügbar ist, verwenden Sie denselben Paketmanager und
Installationsumfang, denen das aktuelle Gateway gehört:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Ersetzen Sie `npm` durch `pnpm` oder `bun`, wenn dieser Manager die Installation verwaltet. Verhindern Sie während
der Wiederherstellung nach einem Vorfall, dass ein aktivierter automatischer Updater sofort ein
neueres Release anwendet, indem Sie `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung festlegen.

### Quellcode-Checkout zurücksetzen

Verwenden Sie einen sauberen Checkout und wählen Sie ein als funktionsfähig bekanntes Tag oder einen entsprechenden Commit aus:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

So kehren Sie zur neuesten Version zurück: `git checkout main && git pull`.

Der Updater setzt einen Git-Checkout automatisch auf seinen vorherigen Branch und
SHA zurück, wenn die Installation von Abhängigkeiten, der Build, der UI-Build oder Doctor nach Beginn einer Git-
Aktualisierung fehlschlägt. Ein manueller Checkout ist weiterhin erforderlich, wenn Sie bewusst
einen älteren Commit auswählen.

### Downgrade über die SQLite-Migration der Sitzungen hinweg

Bevor Sie ein älteres dateibasiertes OpenClaw-Release starten, verwenden Sie die aktuelle CLI, um
archivierte ältere Transkriptartefakte wiederherzustellen:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Dadurch werden keine SQLite-Daten gelöscht. Sitzungen, die nach der SQLite-Migration erstellt wurden,
existieren nur in SQLite und werden in der älteren Laufzeit nicht angezeigt. Siehe
[Downgrade nach der SQLite-Migration der Sitzungen](/de/cli/doctor#downgrading-after-session-sqlite-migration).

### Zustand nur bei Bedarf wiederherstellen

Wenn der ältere Code eine neuere Konfiguration oder ein neueres Datenbankschema nicht lesen kann, stoppen Sie das
Gateway und stellen Sie den überprüften Dateisystem-, Volume- oder VM-Snapshot von vor der Aktualisierung wieder her.
Bewahren Sie den aktuellen Zustand vor der Wiederherstellung separat auf, da dadurch
nach dem Snapshot vorgenommene Änderungen entfernt werden.

Umfassende `openclaw backup create`-Archive unterstützen die Erstellung und Überprüfung, jedoch
keine direkte Aktivierung des gesamten Archivs. Extrahieren Sie ein umfassendes Archiv in ein Staging-
Verzeichnis und verwenden Sie dessen Zuordnung `manifest.json` von der Quelle zum Archiv für eine Offline-
Wiederherstellung. `openclaw backup sqlite restore` schreibt ebenfalls eine überprüfte Datenbank
in ein neues Ziel; die Aktivierung dieses Ziels bleibt ein ausdrücklicher Offline-Schritt des Betreibers.

### Rollback überprüfen

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` in Quellcode-Checkouts richtet der Updater `pnpm` bei Bedarf automatisch ein. Wenn ein Fehler beim Einrichten von pnpm/corepack angezeigt wird, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` erneut) und führen Sie die Aktualisierung erneut aus.
- Lesen Sie: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie auf Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandte Themen

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Zustandsprüfungen nach Aktualisierungen.
- [Migration](/de/install/migrating): Anleitungen für Migrationen zwischen Hauptversionen.

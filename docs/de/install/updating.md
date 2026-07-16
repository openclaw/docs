---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder Quellcode) sowie Rollback-Strategie
title: Aktualisierung
x-i18n:
    generated_at: "2026-07-16T12:59:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

Halten Sie OpenClaw auf dem neuesten Stand.

Informationen zum Ersetzen von Images für Docker, Podman und Kubernetes finden Sie unter
[Container-Images aktualisieren](/de/install/docker#upgrading-container-images). Das
Gateway führt vor der Bereitschaft startsichere Aktualisierungsarbeiten aus und wird beendet, wenn
der eingebundene Zustand manuell repariert werden muss.

## Empfohlen: `openclaw update`

Erkennt Ihren Installationstyp (npm, pnpm, Bun oder Git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet das Gateway neu.

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

`--channel beta` bevorzugt das npm-Dist-Tag „beta“, greift jedoch auf „stable/latest“ zurück,
wenn das Beta-Tag fehlt oder seine Version älter als das neueste stabile
Release ist. Verwenden Sie stattdessen `--tag beta` für eine einmalige Paketaktualisierung, die fest an das unverarbeitete npm-
Beta-Dist-Tag gebunden ist.

`--channel extended-stable` gilt nur für Pakete, und die Installation erfolgt weiterhin
ausschließlich im Vordergrund. OpenClaw liest den öffentlichen npm-Selektor `extended-stable`,
überprüft das exakt ausgewählte Paket und installiert genau diese Version. Fehlende
oder inkonsistente Registry-Daten führen zu einem sicheren Abbruch; es wird niemals auf `latest` zurückgegriffen.
Wenn die ausgewählte Version älter als die installierte Version ist, gilt weiterhin
die normale Bestätigung für ein Downgrade. Die CLI speichert den Kanal nach einer
erfolgreichen Aktualisierung des Kerns; ein direkter Aufruf von `npm install -g openclaw@extended-stable`
aktualisiert `update.channel` nicht.
Nach dem Austausch des Kerns werden geeignete offizielle npm-Plugins mit unveränderter/standardmäßiger oder
`latest`-Absicht auf genau diese Kernversion angeglichen. Exakte Fixierungen und explizite
Nicht-`latest`-Tags, Drittanbieter-Plugins und Nicht-npm-Quellen bleiben unverändert.
Kataloginstallationen, die mit aktuellen OpenClaw-Versionen erstellt wurden, behalten diese Standardabsicht bei.
Ältere Datensätze, die nur eine exakte Version enthalten, bleiben fixiert, da
OpenClaw eine alte automatische Fixierung nicht sicher von einer Benutzerfixierung unterscheiden kann; führen Sie
`openclaw plugins update @openclaw/name` einmal im extended-stable-Kanal aus,
um dieses Plugin wieder für die exakte Nachverfolgung der Kernversion zu aktivieren.

`--channel dev` stellt einen persistenten, fortlaufend aktualisierten GitHub-Checkout von `main` bereit. Für eine einmalige
Paketaktualisierung wird `--tag main` der Paketspezifikation `github:openclaw/openclaw#main`
zugeordnet und direkt über den Ziel-Paketmanager (npm/pnpm/bun) installiert.

Bei verwalteten Plugins ist ein fehlendes Beta-Release eine Warnung und kein Fehler: Die
Kernaktualisierung kann trotzdem erfolgreich sein, während ein Plugin auf sein gespeichertes
Standard-/Latest-Release zurückgreift.

Informationen zur Bedeutung der Kanäle finden Sie unter [Release-Kanäle](/de/install/development-channels).

## Zwischen npm- und Git-Installationen wechseln

Verwenden Sie Kanäle, um den Installationstyp zu ändern. Das Aktualisierungsprogramm behält Ihren Zustand, Ihre Konfiguration,
Anmeldedaten und Ihren Arbeitsbereich in `~/.openclaw` bei; es ändert lediglich, welche OpenClaw-
Codeinstallation die CLI und das Gateway verwenden.

```bash
# npm-Paketinstallation -> bearbeitbarer Git-Checkout
openclaw update --channel dev

# Git-Checkout -> npm-Paketinstallation
openclaw update --channel stable
```

Zeigen Sie zunächst eine Vorschau des Installationsmoduswechsels an:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` stellt einen Git-Checkout sicher, erstellt ihn und installiert die globale CLI aus diesem
Checkout. Die Kanäle `stable`, `extended-stable` und `beta` verwenden Paketinstallationen.
Extended-stable wird bei einem Git-Checkout abgelehnt, ohne ihn zu verändern oder
zu konvertieren. Wenn das Gateway bereits installiert ist, aktualisiert `openclaw update`
die Dienstmetadaten und startet es neu, sofern Sie nicht `--no-restart` übergeben.

Bei Paketinstallationen mit einem verwalteten Gateway-Dienst zielt `openclaw update`
auf das von diesem Dienst verwendete Paketstammverzeichnis. Wenn der Shell-Befehl `openclaw`
aus einer anderen Installation stammt, gibt das Aktualisierungsprogramm beide Stammverzeichnisse und den Node-Pfad
des verwalteten Dienstes aus und prüft diese Node-Version anhand der Anforderung `engines.node`
des Ziel-Releases, bevor das Paket ersetzt wird.

## Alternative: Installationsprogramm erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um einen bestimmten Installationstyp zu erzwingen, übergeben Sie
`--install-method git --no-onboard` oder `--install-method npm --no-onboard`.

Wenn `openclaw update` nach der Installationsphase des npm-Pakets fehlschlägt, führen Sie stattdessen das
Installationsprogramm erneut aus. Es ruft das Aktualisierungsprogramm nicht auf, sondern führt die globale Paketinstallation
direkt aus und kann eine teilweise aktualisierte npm-Installation wiederherstellen.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Fixieren Sie die Wiederherstellung mit `--version` auf eine bestimmte Version oder ein Dist-Tag:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative: manuell mit npm, pnpm oder bun

```bash
npm i -g openclaw@latest
```

Bevorzugen Sie `openclaw update` für überwachte Installationen: Damit lässt sich der Paketaustausch
mit dem laufenden Gateway-Dienst koordinieren. Wenn Sie eine überwachte Installation manuell
aktualisieren, beenden Sie zuerst das verwaltete Gateway. Paketmanager ersetzen Dateien
direkt, und ein laufendes Gateway könnte andernfalls versuchen, Kern- oder Plugin-Dateien
während des Austauschs zu laden. Starten Sie das Gateway nach Abschluss des Paketmanagers neu, damit es
die neue Installation übernimmt.

Wenn bei einer root-eigenen systemweiten Linux-Installation `openclaw update` mit
`EACCES` fehlschlägt, führen Sie die Wiederherstellung mit dem systemweiten npm durch und lassen Sie das Gateway während des
manuellen Austauschs angehalten. Verwenden Sie dieselben Profil-Flags bzw. dieselbe Umgebung, die Sie normalerweise für
dieses Gateway verwenden. Ersetzen Sie `/usr/bin/npm` durch das systemweite npm, dem das
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
zunächst in einem temporären npm-Präfix. Das Kandidatenpaket validiert die Node-Version
des Hosts während `preinstall`; erst dann überprüft OpenClaw den Paketbestand
`dist` und tauscht den bereinigten Paketbaum in das tatsächliche globale Präfix ein. Eine
gepackte Abschlussprüfung wird aus dem erwarteten Bestand ausgelassen und erst entfernt,
nachdem `preinstall` erfolgreich abgeschlossen wurde, sodass übersprungene Lebenszyklusskripte ebenfalls vor dem
Austausch zum Abbruch führen. Ab npm 12 genehmigt das Aktualisierungsprogramm ausschließlich den Lebenszyklus des OpenClaw-
Kandidaten; Skripte transitiver Abhängigkeiten bleiben blockiert. Dadurch wird verhindert, dass npm
ein neues Paket über veraltete Dateien des alten Pakets legt. Wenn der Installationsbefehl
fehlschlägt, versucht OpenClaw es einmal mit `--omit=optional` erneut, was auf Hosts hilfreich ist,
auf denen native optionale Abhängigkeiten nicht kompiliert werden können.

Von OpenClaw verwaltete npm-Aktualisierungs- und Plugin-Aktualisierungsbefehle deaktivieren außerdem die
Lieferkettenquarantäne `min-release-age` von npm (oder den älteren Konfigurationsschlüssel `before`)
für den untergeordneten npm-Prozess. Diese Richtlinie dient dem allgemeinen Schutz, aber eine
explizite OpenClaw-Aktualisierung bedeutet: „Das ausgewählte Release jetzt installieren.“

```bash
pnpm add -g openclaw@latest
```

Wenn pnpm 11 OpenClaw 2026.7.1 installiert hat, führen Sie diesen manuellen Befehl einmal aus. Dieses
Release liegt vor dem isolierten Layout für globale Pakete von pnpm 11, sodass sein Aktualisierungsprogramm
eine andere npm-Installation mit der laufenden CLI verwechseln kann. Spätere Releases behalten
die pnpm-Zuordnung bei und folgen bei Aktualisierungen dem Paketstammverzeichnis des Ersatzpakets. Sie
verwenden außerdem das vom zuständigen Manager gemeldete globale Binärverzeichnis und brechen vor
Änderungen ab, wenn der verfügbare pnpm-Befehl ein anderes globales Stammverzeichnis oder eine andere Hauptversion meldet
oder wenn das aufrufende Paket verwaist oder dort nicht die einzige aktive OpenClaw-
Installation ist.

Wenn OpenClaw eine globale pnpm-11-Installationsgruppe mit einem anderen Paket teilt, beendet sich das
automatische Aktualisierungsprogramm, bevor es die Gruppe verändert. Aktualisieren Sie die ursprüngliche
durch Kommas getrennte Gruppe manuell, damit deren benachbarte Pakete und Build-Richtlinie
erhalten bleiben.

```bash
bun add -g openclaw@latest
```

### Fortgeschrittene Themen zur npm-Installation

<AccordionGroup>
  <Accordion title="Schreibgeschützter Paketbaum">
    OpenClaw behandelt paketierte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Plugin-Paketinstallationen befinden sich in OpenClaw-eigenen npm-/Git-Stammverzeichnissen unter dem Benutzerkonfigurationsverzeichnis, und der Start des Gateways verändert den OpenClaw-Paketbaum nicht.

    Einige Linux-npm-Konfigurationen installieren globale Pakete in root-eigenen Verzeichnissen wie `/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout, da Befehle zum Installieren und Aktualisieren von Plugins außerhalb dieses globalen Paketverzeichnisses schreiben.

  </Accordion>
  <Accordion title="Gehärtete systemd-Units">
    Gewähren Sie OpenClaw Schreibzugriff auf seine Konfigurations-/Zustandsstammverzeichnisse, damit explizite Plugin-Installationen, Plugin-Aktualisierungen und Doctor-Bereinigungen ihre Änderungen speichern können:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Vorabprüfung des Speicherplatzes">
    Vor Paketaktualisierungen und expliziten Plugin-Installationen versucht OpenClaw, den verfügbaren Speicherplatz auf dem Zielvolume nach bestem Bemühen zu prüfen. Wenig Speicherplatz erzeugt eine Warnung mit dem geprüften Pfad, blockiert die Aktualisierung jedoch nicht, da sich Dateisystemkontingente, Snapshots und Netzwerkvolumes nach der Prüfung ändern können. Maßgeblich bleiben die tatsächliche Installation durch den Paketmanager und die Überprüfung nach der Installation.
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
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanal             | Verhalten                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Wartet `stableDelayHours` (Standard: 6) und wendet die Aktualisierung anschließend mit deterministischem Jitter über `stableJitterHours` (Standard: 12) für eine gestaffelte Einführung an. |
| `extended-stable` | Prüft beim Start und bei aktiviertem `checkOnStart` alle 24 Stunden auf einen schreibgeschützten Aktualisierungshinweis. Wendet Aktualisierungen niemals automatisch an.                |
| `beta`            | Prüft alle `betaCheckIntervalHours` (Standard: 1) und wendet die Aktualisierung sofort an.                                                                  |
| `dev`             | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                                                                          |

Das Gateway protokolliert beim Start außerdem einen Aktualisierungshinweis (deaktivierbar mit
`update.checkOnStart: false`). Gespeicherte extended-stable-Auswahlen verwenden diesen
schreibgeschützten Hinweispfad und das bestehende 24-Stunden-Hinweisintervall, führen jedoch niemals
eine automatische Installation, Übergabe, einen Neustart, eine stabile Verzögerung/einen Jitter oder Beta-Abfragen aus.
Legen Sie für ein Downgrade oder die Wiederherstellung nach einem Vorfall `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung fest, um automatische Anwendungen zu blockieren, selbst wenn `update.auto.enabled` konfiguriert ist. Aktualisierungshinweise beim Start können weiterhin ausgeführt werden, sofern `update.checkOnStart` nicht ebenfalls deaktiviert ist.

Über die Steuerungsebene des laufenden Gateways angeforderte Paketmanager-Aktualisierungen
(`update.run`) ersetzen den Paketbaum nicht innerhalb des laufenden Gateway-
Prozesses. Bei Installationen mit verwaltetem Dienst startet das Gateway eine abgekoppelte Übergabe,
beendet sich und überlässt es dem normalen CLI-Pfad `openclaw update --yes --json`, den
Dienst zu beenden, das Paket zu ersetzen, die Dienstmetadaten zu aktualisieren, neu zu starten, die
Gateway-Version und Erreichbarkeit zu überprüfen und nach Möglichkeit einen installierten, aber nicht geladenen macOS-
LaunchAgent wiederherzustellen. Wenn das Gateway diese Übergabe nicht sicher durchführen kann,
meldet `update.run` stattdessen einen sicheren Shell-Befehl, anstatt den Paketmanager
prozessintern auszuführen.

Die Aktualisierungskarte in der Seitenleiste der Control UI zeigt **Gateway aktualisieren**, wenn sie
diesen `update.run`-Ablauf direkt startet. Dies gilt für die im Browser gehostete Control UI, entfernte
Gateways und manuell verwaltete lokale Gateways.

In der signierten macOS-App ändert ein lokales, von der App verwaltetes Gateway diese Karte in
**Mac-App + Gateway aktualisieren**. Sparkle aktualisiert zuerst die App; nach dem Neustart führt die
App `openclaw update --tag <app-version> --json` aus, startet ihr Gateway neu
und überprüft dessen Zustand in einem Fortschrittsfenster im Einrichtungsstil. Das Fenster erscheint nur,
wenn dieses verwaltete Gateway aktualisiert, repariert oder installiert werden muss; reine App-Aktualisierungen führen nach dem Neustart
direkt in die App. Fehlerdetails bleiben mit den Aktionen Retry, [Aktualisierungsanleitung](/de/install/updating) und
[Discord](https://discord.gg/clawd) sichtbar. Die App verwendet diesen koordinierten
Pfad niemals für ein entferntes oder extern verwaltetes Gateway, stuft ein neueres
Gateway niemals zurück und überschreibt niemals eine `extended-stable`-Kanalfixierung.

Wenn die Aktualisierung erfolgreich ist, stellt die App ein einmaliges Willkommensereignis für die
zuletzt verwendete direkte Sitzung der obersten Ebene mit einer echten Benutzer-/Kanalinteraktion in die Warteschlange. Cron-Ausführungen,
Heartbeats und ausschließlich im Hintergrund erfolgende Sitzungsaktualisierungen ändern diese Auswahl nicht. Im
Remote-Modus aktualisiert die App nur die Laufzeitumgebung ihres lokalen Mac-Nodes und sendet das Ereignis
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

Ein Rollback umfasst zwei Ebenen:

1. Älteren OpenClaw-Code neu installieren und dabei den aktuellen Zustand beibehalten.
2. Den Zustand vor der Aktualisierung nur wiederherstellen, wenn der ältere Code eine migrierte
   Konfiguration oder Datenbank nicht verwenden kann.

Beginnen Sie mit einem reinen Code-Rollback. Bei der Wiederherstellung des Zustands gehen Änderungen verloren, die nach
der Sicherung vorgenommen wurden.

### Vor der Aktualisierung: eine verifizierte Sicherung erstellen

`openclaw update` bewahrt eine automatische Konfigurationskopie von vor der Aktualisierung auf, erstellt jedoch
keinen vollständigen Wiederherstellungspunkt für den Zustand. Erstellen Sie vor einer bedeutenden Aktualisierung
explizit einen solchen:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Das Archivmanifest zeichnet die OpenClaw-Version und die in der Sicherung enthaltenen
Quellpfade auf. Das Archiv kann Anmeldedaten, Authentifizierungsprofile und den Kanalzustand
enthalten. Speichern Sie es daher mit ausschließlich dem Eigentümer gewährten Berechtigungen und demselben Schutz wie das
Verzeichnis des Live-Zustands. Unter [Sicherung](/de/cli/backup) finden Sie die enthaltenen und absichtlich
ausgelassenen Dateien.

Für einen bytegenauen Wiederherstellungspunkt, der auch flüchtige Artefakte enthält, die im
portablen Archiv ausgelassen werden, stoppen Sie das Gateway und verwenden Sie einen von Ihrer Plattform
bereitgestellten Dateisystem-, Volume- oder VM-Snapshot.

### Eine Paketinstallation zurücksetzen

Listen Sie die veröffentlichten Versionen auf, zeigen Sie dann eine Vorschau an und installieren Sie die als funktionierend bekannte Version:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

`openclaw update --tag` wird gegenüber einer direkten Installation mit dem Paketmanager bevorzugt. Es
erkennt die Herabstufung, fordert zur Bestätigung auf, führt die verwaltete Plugin-Angleichung
und Kompatibilitätsprüfungen mit dem installierten Ziel durch, aktualisiert die Dienstmetadaten,
startet das Gateway neu und überprüft die ausgeführte Version. Wenn der gespeicherte
Kanal `extended-stable` ist, verwenden Sie
`--channel stable --tag <known-good-version>`, da exakte einmalige Tags nicht
mit dem Selektor `extended-stable` kombiniert werden können.

Bei Paketaktualisierungen wird der Kandidat vor der Aktivierung bereitgestellt und überprüft. Wenn der
Dateisystemaustausch oder das Ersetzen des Befehls-Shims fehlschlägt, stellt OpenClaw automatisch das alte
Paket wieder her. Wenn nach einem erfolgreichen Austausch später die Zustandsprüfung des Gateways fehlschlägt,
werden die vorherige Version und Anweisungen für einen manuellen Rollback gemeldet, anstatt
das Paket erneut automatisch zu ersetzen.

Wenn der CLI-Aktualisierungspfad nicht verfügbar ist, verwenden Sie denselben Paketmanager und
Installationsbereich, die das aktuelle Gateway verwalten:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Ersetzen Sie `npm` durch `pnpm` oder `bun`, wenn dieser Manager die Installation verwaltet. Verhindern Sie während
der Störungsbehebung, dass ein aktivierter automatischer Updater sofort eine
neuere Version installiert, indem Sie `OPENCLAW_NO_AUTO_UPDATE=1` in der Gateway-Umgebung festlegen.

### Einen Quellcode-Checkout zurücksetzen

Verwenden Sie einen sauberen Checkout und wählen Sie ein als funktionierend bekanntes Tag oder einen entsprechenden Commit aus:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

So kehren Sie zur neuesten Version zurück: `git checkout main && git pull`.

Der Updater setzt einen Git-Checkout automatisch auf seinen vorherigen Branch und
SHA zurück, wenn nach dem Start einer Git-Aktualisierung die Installation von Abhängigkeiten, der Build, der UI-Build oder Doctor
fehlschlägt. Ein manueller Checkout ist weiterhin erforderlich, wenn Sie bewusst
einen älteren Commit auswählen.

### Herabstufung über die SQLite-Migration der Sitzungen hinweg

Bevor Sie eine ältere dateibasierte OpenClaw-Version starten, verwenden Sie die aktuelle CLI, um
archivierte ältere Transkriptartefakte wiederherzustellen:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Dadurch werden keine SQLite-Daten gelöscht. Nach der SQLite-Migration erstellte Sitzungen
sind nur in SQLite vorhanden und werden in der älteren Laufzeitumgebung nicht angezeigt. Siehe
[Herabstufung nach der SQLite-Migration der Sitzungen](/de/cli/doctor#downgrading-after-session-sqlite-migration).

### Zustand nur bei Bedarf wiederherstellen

Wenn der ältere Code eine neuere Konfiguration oder ein neueres Datenbankschema nicht lesen kann, stoppen Sie das
Gateway und stellen Sie den verifizierten Dateisystem-, Volume- oder VM-Snapshot von vor der Aktualisierung wieder her.
Bewahren Sie den aktuellen Zustand vor der Wiederherstellung separat auf, da dabei
Änderungen entfernt werden, die nach dem Snapshot vorgenommen wurden.

Umfassende `openclaw backup create`-Archive unterstützen die Erstellung und Verifizierung, jedoch
keine direkte Aktivierung des gesamten Archivs. Extrahieren Sie ein umfassendes Archiv in ein Staging-
Verzeichnis und verwenden Sie dessen `manifest.json`-Zuordnung von Quelle zu Archiv für eine Offline-
Wiederherstellung. `openclaw backup sqlite restore` schreibt ebenfalls eine verifizierte Datenbank
in ein neues Ziel; die Aktivierung dieses Ziels bleibt ein expliziter Offline-Schritt durch den Betreiber.

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
- Bei `openclaw update --channel dev` in Quellcode-Checkouts richtet der Updater `pnpm` bei Bedarf automatisch ein. Wenn ein pnpm-/corepack-Bootstrap-Fehler angezeigt wird, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` erneut) und führen Sie die Aktualisierung erneut aus.
- Prüfen Sie: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie auf Discord nach: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandte Themen

- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Zustandsprüfungen nach Aktualisierungen.
- [Migration](/de/install/migrating): Anleitungen für Migrationen zwischen Hauptversionen.

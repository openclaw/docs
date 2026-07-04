---
read_when:
    - Sie debuggen Plugin-Paketinstallationen
    - Sie ändern das Startverhalten von Plugins, doctor oder Installationen über den Paketmanager.
    - Sie warten paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Plugin-Abhängigkeitsauflösung
x-i18n:
    generated_at: "2026-07-04T15:14:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw hält Arbeiten an Plugin-Abhängigkeiten auf Installations-/Aktualisierungszeit beschränkt. Das Laden zur Laufzeit
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und verändert nicht das OpenClaw-
Paketverzeichnis.

## Verantwortungsaufteilung

Plugin-Pakete besitzen ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten liegen in `dependencies` oder
  `optionalDependencies` des Plugin-Pakets
- SDK-/Core-Importe sind Peer-Abhängigkeiten oder von OpenClaw bereitgestellte Importe
- lokale Entwicklungs-Plugins bringen ihre eigenen bereits installierten Abhängigkeiten mit
- npm- und git-Plugins werden in OpenClaw-eigene Paket-Roots installiert

OpenClaw besitzt nur den Plugin-Lebenszyklus:

- die Plugin-Quelle ermitteln
- das Paket installieren oder aktualisieren, wenn dies ausdrücklich angefordert wird
- die Installationsmetadaten aufzeichnen
- den Plugin-Einstiegspunkt laden
- mit einem handlungsorientierten Fehler fehlschlagen, wenn Abhängigkeiten fehlen

## Installations-Roots

OpenClaw verwendet stabile Roots pro Quelle:

- npm-Pakete werden in projektspezifische Projekte pro Plugin unter
  `~/.openclaw/npm/projects/<encoded-package>` installiert
- git-Pakete werden unter `~/.openclaw/git` geklont
- lokale/Pfad-/Archivinstallationen werden ohne Abhängigkeitsreparatur kopiert oder referenziert

npm-Installationen laufen in diesem projektspezifischen Root pro Plugin mit:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` verwendet denselben projektspezifischen npm-
Projekt-Root pro Plugin für einen lokalen npm-pack-Tarball. OpenClaw liest die npm-
Metadaten des Tarballs, fügt ihn dem verwalteten Projekt als kopierte `file:`-Abhängigkeit hinzu, führt
die normale npm-Installation aus und prüft anschließend die installierten Lockfile-Metadaten, bevor
dem Plugin vertraut wird.
Dies ist für Paketakzeptanz- und Release-Candidate-Nachweise gedacht, bei denen ein
lokales Pack-Artefakt sich wie das Registry-Artefakt verhalten soll, das es simuliert.

Verwenden Sie `npm-pack:`, wenn Sie offizielle oder externe Plugin-Pakete vor der
Veröffentlichung testen. Eine rohe Archiv- oder Pfadinstallation ist für lokales Debugging nützlich, aber sie
beweist nicht denselben Abhängigkeitspfad wie ein installiertes npm- oder ClawHub-Paket.
`npm-pack:` belegt die verwaltete Paketinstallationsform; allein ist es kein
Nachweis dafür, dass das Plugin katalogverknüpfter offizieller Inhalt ist.

Wenn Verhalten vom Status als gebündeltes Plugin oder vertrauenswürdiges offizielles Plugin abhängt, kombinieren Sie
den lokalen Paketnachweis mit einer kataloggestützten offiziellen Installation oder einem veröffentlichten
Paketpfad, der offizielles Vertrauen aufzeichnet. Privilegierter Hilfszugriff und
vertrauenswürdige-offizielle Scope-Behandlung sollten auf diesem vertrauenswürdigen Installationspfad validiert werden,
nicht aus einer lokalen Tarball-Installation abgeleitet werden.

Wenn ein Plugin zur Laufzeit wegen eines fehlenden Imports fehlschlägt, beheben Sie das Paketmanifest,
statt das verwaltete Projekt von Hand zu reparieren. Laufzeitimporte gehören in
`dependencies` oder `optionalDependencies` des Plugin-Pakets; `devDependencies` werden
für verwaltete Laufzeitprojekte nicht installiert. Ein lokales `npm install` innerhalb von
`~/.openclaw/npm/projects/<encoded-package>` kann eine temporäre Diagnose entsperren,
ist aber kein Paketakzeptanznachweis, weil die nächste Installation oder Aktualisierung
das Projekt aus Paketmetadaten neu erstellt.

npm kann transitive Abhängigkeiten in das `node_modules` des projektspezifischen Projekts pro Plugin
neben dem Plugin-Paket hoisten. OpenClaw scannt den verwalteten Projekt-
Root, bevor der Installation vertraut wird, und entfernt dieses Projekt während der Deinstallation, sodass
gehoistete Laufzeitabhängigkeiten innerhalb der Bereinigungsgrenze dieses Plugins bleiben.

Veröffentlichte npm-Plugin-Pakete können `npm-shrinkwrap.json` ausliefern. npm verwendet dieses
veröffentlichbare Lockfile während der Installation, und der von OpenClaw verwaltete npm-Projekt-Root
unterstützt es über den normalen npm-Installationspfad. OpenClaw-eigene veröffentlichbare
Plugin-Pakete müssen ein paketlokales Shrinkwrap enthalten, das aus dem veröffentlichten
Abhängigkeitsgraphen dieses Plugin-Pakets erzeugt wurde:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Der Generator entfernt Plugin-`devDependencies`, wendet die Workspace-Override-
Richtlinie an und schreibt `extensions/<id>/npm-shrinkwrap.json` für jedes
`publishToNpm`-Plugin. Drittanbieter-Plugin-Pakete können ebenfalls Shrinkwrap ausliefern;
OpenClaw verlangt es für Community-Pakete nicht, aber npm berücksichtigt es,
wenn es vorhanden ist.

Bevor Sie ein lokales Paket als Release-Candidate-Nachweis behandeln, prüfen Sie den Tarball,
der installiert wird:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Prüfen Sie bei Abhängigkeitsänderungen außerdem, dass eine Produktionsinstallation die
Laufzeitpakete ohne Entwicklungsabhängigkeiten auflösen kann:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw-eigene npm-Plugin-Pakete können auch mit expliziten
`bundledDependencies` veröffentlichen. Der npm-Veröffentlichungspfad überlagert die Namensliste der
Laufzeitabhängigkeiten, entfernt rein entwicklungsbezogene Workspace-Metadaten aus dem veröffentlichten Paket-
manifest, führt eine skriptfreie npm-Installation für paketlokale Laufzeit-
abhängigkeiten aus und packt oder veröffentlicht dann den Plugin-Tarball mit diesen enthaltenen
Abhängigkeitsdateien. Native-lastige Pakete, einschließlich Codex- und ACP-Laufzeiten, steigen
mit `openclaw.release.bundleRuntimeDependencies: false` aus; diese Pakete liefern weiterhin
ihr Shrinkwrap aus, aber npm löst Laufzeitabhängigkeiten während der Installation auf,
statt jede Plattform-Binärdatei in den Plugin-Tarball einzubetten. Das Root-
`openclaw`-Paket bündelt nicht seinen vollständigen Abhängigkeitsbaum.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-
Abhängigkeit. OpenClaw lässt npm keine separate Registry-Kopie des
Host-Pakets in ein verwaltetes Projekt installieren, weil veraltete Host-Pakete die npm-
Peer-Auflösung innerhalb dieses Plugins beeinflussen können. Verwaltete npm-Installationen überspringen die npm-Peer-
Auflösung/-Materialisierung, und OpenClaw stellt nach Installation oder Aktualisierung Plugin-lokale
`node_modules/openclaw`-Links für installierte Pakete wieder her, die den Host-Peer deklarieren.

git-Installationen klonen oder aktualisieren das Repository und führen dann aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird dann aus diesem Paketverzeichnis geladen, sodass paketlokale
und übergeordnete `node_modules`-Auflösung genauso funktioniert wie bei einem normalen
Node-Paket.

## Lokale Plugins

Lokale Plugins werden als entwicklerkontrollierte Verzeichnisse behandelt. OpenClaw führt für sie kein
`npm install`, `pnpm install` oder keine Abhängigkeitsreparatur aus. Wenn ein lokales
Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Lokale TypeScript-Plugins von Drittanbietern können den Notfallpfad über Jiti verwenden. Paketierte
JavaScript-Plugins und gebündelte interne Plugins werden über natives
import/require statt über Jiti geladen.

## Start und erneutes Laden

Gateway-Start und Konfigurations-Reload installieren niemals Plugin-Abhängigkeiten. Sie lesen
die Plugin-Installationsdatensätze, berechnen den Einstiegspunkt und laden ihn.

Wenn zur Laufzeit eine Abhängigkeit fehlt, wird das Plugin nicht geladen, und der Fehler
sollte den Operator auf eine explizite Behebung hinweisen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kann von OpenClaw erzeugten Legacy-Abhängigkeitszustand bereinigen und
herunterladbare Plugins wiederherstellen, die in den lokalen Installationsdatensätzen fehlen, wenn die Konfiguration
auf sie verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes
lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und für den Core kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert.
Sie sollten entweder keinen schweren Laufzeit-Abhängigkeitsbaum haben oder in ein
herunterladbares Paket auf ClawHub/npm verschoben werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert werden,
extern installiert werden oder nur als Quellcode verbleiben, finden Sie unter [Plugin-Inventar](/de/plugins/plugin-inventory).

Manifeste gebündelter Plugins dürfen kein Abhängigkeits-Staging anfordern. Große oder optionale
Plugin-Funktionalität sollte als normales Plugin paketiert und über
denselben npm/git/ClawHub-Pfad wie Drittanbieter-Plugins installiert werden.

In Source-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach
`pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale
Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Source-
Checkout-Entwicklung ist ausschließlich pnpm-basiert; ein einfaches `npm install` im Repository-Root ist
kein unterstützter Weg, um Abhängigkeiten gebündelter Plugins vorzubereiten.

| Installationsform                 | Speicherort gebündelter Plugins       | Verantwortlicher für Abhängigkeiten                                  |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`         | Gebauter Laufzeitbaum im Paket        | OpenClaw-Paket und explizite Plugin-Installations-/Aktualisierungs-/Doctor-Flows |
| Git-Checkout plus `pnpm install`  | `extensions/<id>`-Workspace-Pakete    | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`    | Verwalteter npm-Projekt-/git-/ClawHub-Root | Der Plugin-Installations-/Aktualisierungs-Flow                       |

## Legacy-Bereinigung

Ältere OpenClaw-Versionen erzeugten Roots für Abhängigkeiten gebündelter Plugins beim Start oder
während der Doctor-Reparatur. Die aktuelle Doctor-Bereinigung entfernt diese veralteten Verzeichnisse und
Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Roots, globaler
Node-Präfix-Paket-Symlinks, die auf bereinigte `plugin-runtime-deps`-Ziele zeigen,
`.openclaw-runtime-deps*`-Manifeste, erzeugte Plugin-`node_modules`, Installations-
Stage-Verzeichnisse und paketlokale pnpm-Stores. Das paketierte Postinstall entfernt außerdem
diese globalen Symlinks, bevor die Legacy-Ziel-Roots bereinigt werden, damit Upgrades
keine hängenden ESM-Paketimporte zurücklassen.

Ältere npm-Installationen verwendeten außerdem einen gemeinsamen `~/.openclaw/npm/node_modules`-Root.
Aktuelle Installations-, Aktualisierungs-, Deinstallations- und Doctor-Flows erkennen diesen Legacy-
Flat-Root weiterhin nur für Wiederherstellung und Bereinigung. Neue npm-Installationen sollten stattdessen
projektspezifische Roots pro Plugin erstellen.

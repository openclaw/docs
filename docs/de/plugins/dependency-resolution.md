---
read_when:
    - Sie debuggen die Installation von Plugin-Paketen
    - Sie ändern das Start-, Doctor- oder Paketmanager-Installationsverhalten von Plugins
    - Sie warten paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste.
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-07-24T03:57:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw verarbeitet Plugin-Abhängigkeiten ausschließlich während der Installation/Aktualisierung. Beim Laden zur Laufzeit wird niemals ein Paketmanager ausgeführt, ein Abhängigkeitsbaum repariert oder das OpenClaw-Paketverzeichnis verändert.

## Aufteilung der Zuständigkeiten

Plugin-Pakete verwalten ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten befinden sich in `dependencies` oder
  `optionalDependencies` des Plugin-Pakets.
- SDK-/Core-Importe sind Peer- oder bereitgestellte OpenClaw-Importe.
- Plugins für die lokale Entwicklung bringen ihre eigenen bereits installierten Abhängigkeiten mit.
- npm- und git-Plugins werden in OpenClaw-eigenen Paketstammverzeichnissen installiert.

OpenClaw verwaltet nur den Plugin-Lebenszyklus:

- Die Plugin-Quelle ermitteln.
- Das Paket auf ausdrückliche Anforderung installieren oder aktualisieren.
- Installationsmetadaten erfassen.
- Den Plugin-Einstiegspunkt laden.
- Bei fehlenden Abhängigkeiten mit einer Fehlerbeschreibung samt konkreter Abhilfemaßnahme abbrechen.

## Installationsstammverzeichnisse

OpenClaw verwendet stabile Stammverzeichnisse pro Quelle:

- npm-Pakete werden in projektspezifischen Verzeichnissen pro Plugin unter
  `~/.openclaw/npm/projects/<encoded-package>` installiert.
- git-Pakete werden unter `~/.openclaw/git` geklont.
- Lokale/Pfad-/Archivinstallationen werden ohne Reparatur der Abhängigkeiten
  kopiert oder referenziert.

npm-Installationen werden in diesem Projektstammverzeichnis des jeweiligen Plugins wie folgt ausgeführt:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` verwendet dasselbe npm-Projektstammverzeichnis pro Plugin
für einen lokalen npm-Pack-Tarball: OpenClaw liest die npm-Metadaten des Tarballs,
fügt ihn dem verwalteten Projekt als kopierte `file:`-Abhängigkeit hinzu, führt
die oben beschriebene normale npm-Installation aus und überprüft anschließend die Metadaten
der installierten Sperrdatei, bevor dem Plugin vertraut wird. Dieser Pfad dient dem
Paketabnahme- und Release-Candidate-Nachweis, bei dem sich ein lokales Pack-Artefakt wie das
simulierte Registry-Artefakt verhalten soll.

Verwenden Sie `npm-pack:`, wenn Sie offizielle oder externe Plugin-Pakete vor der
Veröffentlichung testen. Eine direkte Archiv- oder Pfadinstallation ist für das lokale Debugging nützlich,
weist jedoch nicht denselben Abhängigkeitspfad wie ein installiertes npm- oder ClawHub-
Paket nach. `npm-pack:` weist die Form der verwalteten Paketinstallation nach; dies ist für sich
allein kein Nachweis dafür, dass das Plugin mit einem Katalog verknüpfter offizieller Inhalt ist.

Wenn das Verhalten vom Status als gebündeltes Plugin oder vertrauenswürdiges offizielles Plugin abhängt,
kombinieren Sie den lokalen Paketnachweis mit einer kataloggestützten offiziellen Installation oder einem
veröffentlichten Paketpfad, der das offizielle Vertrauen erfasst. Der Zugriff auf privilegierte Hilfsfunktionen
und die Behandlung des vertrauenswürdigen offiziellen Geltungsbereichs sollten über diesen vertrauenswürdigen
Installationspfad validiert und nicht aus einer lokalen Tarball-Installation abgeleitet werden.

Wenn ein Plugin zur Laufzeit aufgrund eines fehlenden Imports fehlschlägt, korrigieren Sie das Paketmanifest,
anstatt das verwaltete Projekt manuell zu reparieren. Laufzeitimporte gehören in
`dependencies` oder `optionalDependencies` des Plugin-Pakets; `devDependencies`
werden für verwaltete Laufzeitprojekte nicht installiert. Ein lokales `npm install` innerhalb von
`~/.openclaw/npm/projects/<encoded-package>` kann eine vorübergehende
Diagnose ermöglichen, ist jedoch kein Paketabnahmenachweis, da die nächste Installation oder
Aktualisierung das Projekt anhand der Paketmetadaten neu erstellt.

npm kann transitive Abhängigkeiten in das
`node_modules` des Plugin-Projekts neben dem Plugin-Paket hoisten. OpenClaw überprüft das verwaltete
Projektstammverzeichnis, bevor es der Installation vertraut, und entfernt dieses Projekt bei der Deinstallation,
sodass gehoistete Laufzeitabhängigkeiten innerhalb der Bereinigungsgrenze dieses Plugins verbleiben.

Veröffentlichte npm-Plugin-Pakete können `npm-shrinkwrap.json` enthalten; npm verwendet diese
veröffentlichbare Sperrdatei während der Installation, und das von OpenClaw verwaltete npm-Projektstammverzeichnis
unterstützt sie über den normalen Installationspfad. Veröffentlichbare OpenClaw-eigene
Plugin-Pakete müssen eine paketlokale Shrinkwrap-Datei enthalten, die aus dem veröffentlichten
Abhängigkeitsgraphen dieses Pakets generiert wurde:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Der Generator entfernt Plugin-`devDependencies`, wendet die Workspace-Override-
Richtlinie an und schreibt `extensions/<id>/npm-shrinkwrap.json` für jedes Plugin mit
`openclaw.release.publishToNpm: true`. Plugin-Pakete von Drittanbietern können ebenfalls
eine Shrinkwrap-Datei enthalten; OpenClaw verlangt keine für Community-Pakete, aber
npm berücksichtigt sie, wenn sie vorhanden ist.

Bevor Sie ein lokales Paket als Release-Candidate-Nachweis betrachten, prüfen Sie den
zu installierenden Tarball:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Überprüfen Sie bei Änderungen an Abhängigkeiten außerdem, ob eine Produktionsinstallation die
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

OpenClaw-eigene npm-Plugin-Pakete können außerdem mit explizitem
`bundledDependencies` veröffentlicht werden. Der npm-Veröffentlichungspfad überlagert die Liste
der Namen von Laufzeitabhängigkeiten, entfernt ausschließlich für die Entwicklung bestimmte Workspace-Metadaten aus dem veröffentlichten Manifest,
führt eine skriptfreie npm-Installation für die paketlokalen Laufzeitabhängigkeiten aus
und packt oder veröffentlicht anschließend den Plugin-Tarball einschließlich dieser Abhängigkeitsdateien.
Pakete mit umfangreichen nativen Komponenten (Codex, ACPX, Copilot, llama.cpp,
memory-lancedb, Tlon) verzichten darauf mit
`openclaw.release.bundleRuntimeDependencies: false`; sie enthalten weiterhin eine
Shrinkwrap-Datei, npm löst die Laufzeitabhängigkeiten jedoch während der Installation auf, anstatt
jede Plattformbinärdatei in den Plugin-Tarball einzubetten. Das `openclaw`-
Stammpaket bündelt nicht seinen vollständigen Abhängigkeitsbaum.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-
Abhängigkeit. OpenClaw lässt nicht zu, dass npm eine separate Registry-Kopie des
Host-Pakets in einem verwalteten Projekt installiert, da ein veraltetes Host-Paket
die Peer-Auflösung von npm innerhalb dieses Plugins beeinflussen kann. Verwaltete npm-Installationen
überspringen die Auflösung/Materialisierung von npm-Peers, und OpenClaw stellt nach der Installation
oder Aktualisierung die pluginlokalen `node_modules/openclaw`-Verknüpfungen für installierte Pakete,
die den Host-Peer deklarieren, erneut sicher.

git-Installationen klonen oder aktualisieren das Repository und führen anschließend Folgendes aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird anschließend aus diesem Paketverzeichnis geladen, sodass die Auflösung
des paketlokalen und übergeordneten `node_modules` genauso funktioniert wie
bei einem normalen Node-Paket.

## Lokale Plugins

Lokale Plugins sind von Entwicklern kontrollierte Verzeichnisse. OpenClaw führt für sie niemals
`npm install`, `pnpm install` oder eine Reparatur der Abhängigkeiten aus; wenn ein lokales
Plugin Abhängigkeiten besitzt, installieren Sie diese vor dem Laden in diesem Plugin.

Lokale TypeScript-Plugins von Drittanbietern werden als Notfallpfad über Jiti geladen.
Paketierte JavaScript-Plugins und gebündelte interne Plugins werden stattdessen über nativen
Import/Require geladen.

## Start und erneutes Laden

Beim Start des Gateway und beim erneuten Laden der Konfiguration werden niemals Plugin-Abhängigkeiten installiert. Dabei
werden die Installationsdatensätze des Plugins gelesen, der Einstiegspunkt berechnet und das Plugin geladen.

Eine zur Laufzeit fehlende Abhängigkeit führt dazu, dass das Laden des Plugins mit einer Fehlermeldung abbricht,
die den Betreiber auf eine ausdrückliche Abhilfemaßnahme verweist:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` bereinigt veralteten, von OpenClaw generierten Abhängigkeitszustand und kann
herunterladbare Plugins wiederherstellen, die in lokalen Installationsdatensätzen fehlen, wenn
die Konfiguration weiterhin auf sie verweist. Doctor repariert keine Abhängigkeiten eines
bereits installierten lokalen Plugins.

## Gebündelte Plugins

Leichtgewichtige und für den Core kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert. Sie
sollten entweder keinen umfangreichen Laufzeitabhängigkeitsbaum besitzen oder in ein
herunterladbares Paket auf ClawHub/npm ausgelagert werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket enthalten sind,
extern installiert werden oder ausschließlich im Quellcode verbleiben, finden Sie unter
[Plugin-Inventar](/de/plugins/plugin-inventory).

Manifeste gebündelter Plugins dürfen kein Staging von Abhängigkeiten anfordern. Umfangreiche oder
optionale Plugin-Funktionalität sollte als normales Plugin paketiert und
über denselben npm-/git-/ClawHub-Pfad wie Plugins von Drittanbietern installiert werden.

In Quellcode-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo.
Nach `pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass
paketlokale Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden.
Die Entwicklung in Quellcode-Checkouts unterstützt ausschließlich pnpm; ein einfaches `npm install` im
Repository-Stammverzeichnis bereitet die Abhängigkeiten gebündelter Plugins nicht vor.

| Installationsform                    | Speicherort des gebündelten Plugins               | Zuständigkeit für Abhängigkeiten                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Erstellter Laufzeitbaum innerhalb des Pakets | OpenClaw-Paket und explizite Abläufe für Plugin-Installation/-Aktualisierung/Doctor     |
| Git-Checkout plus `pnpm install` | `extensions/<id>`-Workspace-Pakete  | Der pnpm-Workspace einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`   | Verwaltetes npm-Projekt-/git-/ClawHub-Stammverzeichnis  | Der Ablauf für Plugin-Installation/-Aktualisierung                                       |

## Bereinigung veralteter Daten

Ältere OpenClaw-Versionen erzeugten beim Start oder während der Doctor-Reparatur
Abhängigkeitsstammverzeichnisse für gebündelte Plugins. Die aktuelle Doctor-Bereinigung entfernt diese veralteten
Verzeichnisse und symbolischen Verknüpfungen mit `--fix`, einschließlich alter `plugin-runtime-deps`-
Stammverzeichnisse, globaler Paketsymlinks im Node-Präfix, die auf bereinigte
`plugin-runtime-deps`-Ziele verweisen, `.openclaw-runtime-deps*`-Manifeste, generierte
Plugin-`node_modules`, Installations-Staging-Verzeichnisse und paketlokale pnpm-
Speicher. Auch der Postinstallationsschritt paketierter Versionen entfernt diese globalen Symlinks, bevor
die veralteten Zielstammverzeichnisse bereinigt werden, sodass Aktualisierungen keine verwaisten ESM-
Paketimporte hinterlassen.

Ältere npm-Installationen verwendeten außerdem ein gemeinsames `~/.openclaw/npm/node_modules`-Stammverzeichnis.
Aktuelle Installations-, Aktualisierungs-, Deinstallations- und Doctor-Abläufe erkennen dieses
veraltete flache Stammverzeichnis weiterhin ausschließlich zur Wiederherstellung und Bereinigung. Neue npm-Installationen erstellen
stattdessen Projektstammverzeichnisse pro Plugin.

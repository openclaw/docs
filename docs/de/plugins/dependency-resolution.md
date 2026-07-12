---
read_when:
    - Sie debuggen die Installation von Plugin-Paketen
    - Sie ändern das Startverhalten von Plugins, Doctor oder die Installation über den Paketmanager
    - Sie verwalten paketierte OpenClaw-Installationen oder Manifeste gebündelter Plugins
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-07-12T01:53:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw verarbeitet Plugin-Abhängigkeiten ausschließlich zum Installations- bzw. Aktualisierungszeitpunkt. Beim Laden zur Laufzeit wird niemals ein Paketmanager ausgeführt, ein Abhängigkeitsbaum repariert oder das OpenClaw-Paketverzeichnis verändert.

## Aufteilung der Verantwortlichkeiten

Plugin-Pakete sind für ihren Abhängigkeitsgraphen verantwortlich:

- Laufzeitabhängigkeiten befinden sich in `dependencies` oder `optionalDependencies` des Plugin-Pakets.
- SDK-/Core-Importe sind Peer-Abhängigkeiten oder von OpenClaw bereitgestellte Importe.
- Plugins für die lokale Entwicklung bringen ihre eigenen, bereits installierten Abhängigkeiten mit.
- npm- und Git-Plugins werden in OpenClaw-eigenen Paketstammverzeichnissen installiert.

OpenClaw ist nur für den Plugin-Lebenszyklus verantwortlich:

- Die Plugin-Quelle ermitteln.
- Das Paket auf ausdrückliche Anforderung installieren oder aktualisieren.
- Installationsmetadaten erfassen.
- Den Plugin-Einstiegspunkt laden.
- Bei fehlenden Abhängigkeiten mit einem Fehler abbrechen, der konkrete Abhilfemaßnahmen nennt.

## Installationsstammverzeichnisse

OpenClaw verwendet stabile Stammverzeichnisse pro Quelle:

- npm-Pakete werden in projektspezifischen Plugin-Verzeichnissen unter `~/.openclaw/npm/projects/<encoded-package>` installiert.
- Git-Pakete werden unter `~/.openclaw/git` geklont.
- Lokale, pfadbasierte oder archivbasierte Installationen werden ohne Reparatur der Abhängigkeiten kopiert oder referenziert.

npm-Installationen werden in diesem projektspezifischen Plugin-Stammverzeichnis ausgeführt:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` verwendet dasselbe projektspezifische npm-Stammverzeichnis für einen lokalen npm-pack-Tarball: OpenClaw liest die npm-Metadaten des Tarballs, fügt ihn dem verwalteten Projekt als kopierte `file:`-Abhängigkeit hinzu, führt die oben beschriebene normale npm-Installation aus und überprüft anschließend die Metadaten der installierten Sperrdatei, bevor es dem Plugin vertraut. Dieser Pfad dient dem Nachweis der Paketabnahme und von Release-Kandidaten, bei dem sich ein lokales Paketartefakt wie das simulierte Registry-Artefakt verhalten soll.

Verwenden Sie `npm-pack:`, wenn Sie offizielle oder externe Plugin-Pakete vor der Veröffentlichung testen. Eine direkte Archiv- oder Pfadinstallation ist für die lokale Fehlerdiagnose nützlich, weist jedoch nicht denselben Abhängigkeitspfad wie ein installiertes npm- oder ClawHub-Paket nach. `npm-pack:` weist die Struktur einer verwalteten Paketinstallation nach; allein belegt dies jedoch nicht, dass das Plugin ein mit dem Katalog verknüpfter offizieller Inhalt ist.

Wenn das Verhalten vom Status als gebündeltes Plugin oder vertrauenswürdiges offizielles Plugin abhängt, kombinieren Sie den lokalen Paketnachweis mit einer kataloggestützten offiziellen Installation oder einem veröffentlichten Paketpfad, der das offizielle Vertrauen erfasst. Der Zugriff auf privilegierte Hilfsfunktionen und die Verarbeitung des vertrauenswürdigen offiziellen Geltungsbereichs sollten über diesen vertrauenswürdigen Installationspfad validiert und nicht aus einer lokalen Tarball-Installation abgeleitet werden.

Wenn ein Plugin zur Laufzeit aufgrund eines fehlenden Imports fehlschlägt, korrigieren Sie das Paketmanifest, statt das verwaltete Projekt manuell zu reparieren. Laufzeitimporte gehören in `dependencies` oder `optionalDependencies` des Plugin-Pakets; `devDependencies` werden für verwaltete Laufzeitprojekte nicht installiert. Ein lokales `npm install` innerhalb von `~/.openclaw/npm/projects/<encoded-package>` kann eine vorübergehende Diagnose ermöglichen, gilt jedoch nicht als Nachweis der Paketabnahme, da das Projekt bei der nächsten Installation oder Aktualisierung anhand der Paketmetadaten neu erstellt wird.

npm kann transitive Abhängigkeiten in das `node_modules`-Verzeichnis des projektspezifischen Plugin-Projekts neben dem Plugin-Paket verschieben. OpenClaw überprüft das verwaltete Projektstammverzeichnis, bevor es der Installation vertraut, und entfernt dieses Projekt bei der Deinstallation. Dadurch verbleiben verschobene Laufzeitabhängigkeiten innerhalb der Bereinigungsgrenze dieses Plugins.

Veröffentlichte npm-Plugin-Pakete können eine `npm-shrinkwrap.json` enthalten. npm verwendet diese veröffentlichbare Sperrdatei während der Installation, und das von OpenClaw verwaltete npm-Projektstammverzeichnis unterstützt sie über den normalen Installationspfad. Veröffentlichbare, OpenClaw-eigene Plugin-Pakete müssen eine paketlokale Shrinkwrap-Datei enthalten, die aus dem veröffentlichten Abhängigkeitsgraphen dieses Pakets generiert wurde:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Der Generator entfernt die `devDependencies` des Plugins, wendet die Workspace-Override-Richtlinie an und schreibt für jedes Plugin mit `openclaw.release.publishToNpm: true` die Datei `extensions/<id>/npm-shrinkwrap.json`. Plugin-Pakete von Drittanbietern können ebenfalls eine Shrinkwrap-Datei enthalten. OpenClaw verlangt für Community-Pakete keine solche Datei, npm berücksichtigt sie jedoch, wenn sie vorhanden ist.

Bevor Sie ein lokales Paket als Nachweis für einen Release-Kandidaten betrachten, überprüfen Sie den zu installierenden Tarball:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Überprüfen Sie bei Änderungen an Abhängigkeiten außerdem, ob eine Produktionsinstallation die Laufzeitpakete ohne Entwicklungsabhängigkeiten auflösen kann:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw-eigene npm-Plugin-Pakete können außerdem mit expliziten `bundledDependencies` veröffentlicht werden. Der npm-Veröffentlichungspfad überlagert die Liste der Namen von Laufzeitabhängigkeiten, entfernt Workspace-Metadaten, die ausschließlich der Entwicklung dienen, aus dem veröffentlichten Manifest, führt für die paketlokalen Laufzeitabhängigkeiten eine npm-Installation ohne Skriptausführung durch und packt oder veröffentlicht anschließend den Plugin-Tarball einschließlich der Dateien dieser Abhängigkeiten. Pakete mit vielen nativen Komponenten (Codex, ACPX, Copilot, llama.cpp, memory-lancedb, Tlon) verzichten mittels `openclaw.release.bundleRuntimeDependencies: false` darauf. Sie enthalten weiterhin eine Shrinkwrap-Datei, aber npm löst die Laufzeitabhängigkeiten während der Installation auf, statt sämtliche plattformspezifischen Binärdateien in den Plugin-Tarball einzubetten. Das Stammpaket `openclaw` bündelt nicht seinen vollständigen Abhängigkeitsbaum.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-Abhängigkeit. OpenClaw verhindert, dass npm eine separate Registry-Kopie des Hostpakets in einem verwalteten Projekt installiert, da ein veraltetes Hostpaket die Peer-Auflösung von npm innerhalb dieses Plugins beeinflussen kann. Verwaltete npm-Installationen überspringen die Peer-Auflösung bzw. -Materialisierung durch npm, und OpenClaw stellt nach der Installation oder Aktualisierung für installierte Pakete, die die Host-Peer-Abhängigkeit deklarieren, die pluginlokalen Verknüpfungen unter `node_modules/openclaw` erneut her.

Git-Installationen klonen oder aktualisieren das Repository und führen anschließend Folgendes aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird anschließend aus diesem Paketverzeichnis geladen, sodass die Auflösung über paketlokale und übergeordnete `node_modules` genauso funktioniert wie bei einem normalen Node-Paket.

## Lokale Plugins

Lokale Plugins sind von Entwicklern kontrollierte Verzeichnisse. OpenClaw führt für sie niemals `npm install`, `pnpm install` oder eine Reparatur der Abhängigkeiten aus. Wenn ein lokales Plugin Abhängigkeiten besitzt, installieren Sie diese vor dem Laden im jeweiligen Plugin.

Lokale TypeScript-Plugins von Drittanbietern werden als Notfallpfad über Jiti geladen. Paketierte JavaScript-Plugins und gebündelte interne Plugins werden stattdessen über den nativen Import-/Require-Mechanismus geladen.

## Start und Neuladen

Beim Start des Gateway und beim Neuladen der Konfiguration werden niemals Plugin-Abhängigkeiten installiert. Dabei werden die Plugin-Installationsdatensätze gelesen, der Einstiegspunkt bestimmt und das Plugin geladen.

Eine zur Laufzeit fehlende Abhängigkeit führt dazu, dass das Laden des Plugins mit einem Fehler fehlschlägt, der den Betreiber auf eine ausdrückliche Abhilfemaßnahme verweist:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` bereinigt veraltete, von OpenClaw erzeugte Abhängigkeitszustände und kann herunterladbare Plugins wiederherstellen, die in den lokalen Installationsdatensätzen fehlen, wenn die Konfiguration weiterhin auf sie verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und für den Core unverzichtbare gebündelte Plugins werden als Teil von OpenClaw ausgeliefert. Sie sollten entweder keinen umfangreichen Laufzeitabhängigkeitsbaum besitzen oder in ein herunterladbares Paket auf ClawHub/npm ausgelagert werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert, extern installiert oder ausschließlich im Quellcode vorgehalten werden, finden Sie im [Plugin-Inventar](/de/plugins/plugin-inventory).

Manifeste gebündelter Plugins dürfen keine Bereitstellung von Abhängigkeiten anfordern. Umfangreiche oder optionale Plugin-Funktionalität sollte als normales Plugin paketiert und über denselben npm-/Git-/ClawHub-Pfad wie Plugins von Drittanbietern installiert werden.

In Quellcode-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach `pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Die Entwicklung in einem Quellcode-Checkout erfolgt ausschließlich mit pnpm; ein einfaches `npm install` im Repository-Stammverzeichnis richtet die Abhängigkeiten gebündelter Plugins nicht ein.

| Installationsform                   | Speicherort des gebündelten Plugins   | Verantwortlicher für Abhängigkeiten                                     |
| ----------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| `npm install -g openclaw`           | Erstellter Laufzeitbaum im Paket      | OpenClaw-Paket und explizite Plugin-Installations-, Aktualisierungs- und Doctor-Abläufe |
| Git-Checkout plus `pnpm install`    | Workspace-Pakete unter `extensions/<id>` | Der pnpm-Workspace einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`      | Verwaltetes npm-Projekt-/Git-/ClawHub-Stammverzeichnis | Der Plugin-Installations-/Aktualisierungsablauf                          |

## Bereinigung veralteter Daten

Ältere OpenClaw-Versionen erzeugten beim Start oder während einer Reparatur durch Doctor Stammverzeichnisse für die Abhängigkeiten gebündelter Plugins. Die aktuelle Doctor-Bereinigung entfernt diese veralteten Verzeichnisse und symbolischen Verknüpfungen mit `--fix`, darunter alte `plugin-runtime-deps`-Stammverzeichnisse, globale Paketsymlinks im Node-Präfix, die auf bereinigte `plugin-runtime-deps`-Ziele verweisen, `.openclaw-runtime-deps*`-Manifeste, generierte Plugin-`node_modules`, Verzeichnisse für Installationsphasen und paketlokale pnpm-Speicher. Der paketierte Postinstallationsvorgang entfernt außerdem diese globalen symbolischen Verknüpfungen, bevor die veralteten Zielstammverzeichnisse bereinigt werden, sodass Aktualisierungen keine ins Leere weisenden ESM-Paketimporte hinterlassen.

Ältere npm-Installationen verwendeten außerdem ein gemeinsames Stammverzeichnis unter `~/.openclaw/npm/node_modules`. Die aktuellen Installations-, Aktualisierungs-, Deinstallations- und Doctor-Abläufe erkennen dieses veraltete flache Stammverzeichnis weiterhin, jedoch ausschließlich zur Wiederherstellung und Bereinigung. Neue npm-Installationen erstellen stattdessen projektspezifische Plugin-Stammverzeichnisse.

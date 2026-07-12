---
read_when:
    - Sie debuggen die Installation von Plugin-Paketen
    - Sie ändern das Start-, Doctor- oder Paketmanager-Installationsverhalten von Plugins
    - Sie verwalten paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-07-12T15:43:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw verarbeitet Plugin-Abhängigkeiten ausschließlich zum Installations-/Aktualisierungszeitpunkt. Beim Laden zur Laufzeit wird niemals ein Paketmanager ausgeführt, ein Abhängigkeitsbaum repariert oder das OpenClaw-Paketverzeichnis verändert.

## Aufteilung der Zuständigkeiten

Plugin-Pakete sind für ihren Abhängigkeitsgraphen verantwortlich:

- Laufzeitabhängigkeiten befinden sich in `dependencies` oder
  `optionalDependencies` des Plugin-Pakets.
- SDK-/Core-Importe sind Peer-Abhängigkeiten oder von OpenClaw bereitgestellte Importe.
- Plugins für die lokale Entwicklung bringen ihre eigenen bereits installierten Abhängigkeiten mit.
- npm- und git-Plugins werden in OpenClaw-eigenen Paketstammverzeichnissen installiert.

OpenClaw ist ausschließlich für den Plugin-Lebenszyklus verantwortlich:

- Die Plugin-Quelle ermitteln.
- Das Paket auf ausdrückliche Anforderung installieren oder aktualisieren.
- Installationsmetadaten erfassen.
- Den Plugin-Einstiegspunkt laden.
- Bei fehlenden Abhängigkeiten mit einem Fehler abbrechen, der konkrete Abhilfemaßnahmen nennt.

## Installationsstammverzeichnisse

OpenClaw verwendet stabile Stammverzeichnisse pro Quelle:

- npm-Pakete werden in projektspezifischen Verzeichnissen pro Plugin unter
  `~/.openclaw/npm/projects/<encoded-package>` installiert.
- git-Pakete werden unter `~/.openclaw/git` geklont.
- Lokale/Pfad-/Archivinstallationen werden ohne Reparatur der Abhängigkeiten kopiert oder referenziert.

npm-Installationen werden im jeweiligen Projektstammverzeichnis des Plugins ausgeführt:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` verwendet für einen lokalen npm-pack-Tarball dasselbe npm-Projektstammverzeichnis pro Plugin: OpenClaw liest die npm-Metadaten des Tarballs, fügt ihn dem verwalteten Projekt als kopierte `file:`-Abhängigkeit hinzu, führt die oben beschriebene normale npm-Installation aus und überprüft anschließend die Metadaten der installierten Sperrdatei, bevor es dem Plugin vertraut. Dieser Pfad dient als Nachweis für die Paketabnahme und Release-Kandidaten, bei denen sich ein lokales Pack-Artefakt wie das von ihm simulierte Registry-Artefakt verhalten soll.

Verwenden Sie `npm-pack:`, wenn Sie offizielle oder externe Plugin-Pakete vor
der Veröffentlichung testen. Eine einfache Archiv- oder Pfadinstallation ist für lokales Debugging nützlich, weist jedoch nicht denselben Abhängigkeitspfad wie ein installiertes npm- oder ClawHub-Paket nach. `npm-pack:` weist die verwaltete Paketinstallationsstruktur nach; für sich allein ist dies kein Nachweis dafür, dass das Plugin mit einem Katalog verknüpfter offizieller Inhalt ist.

Wenn das Verhalten vom Status als gebündeltes Plugin oder vertrauenswürdiges offizielles Plugin abhängt, kombinieren Sie den lokalen Paketnachweis mit einer kataloggestützten offiziellen Installation oder einem veröffentlichten Paketpfad, der das offizielle Vertrauen erfasst. Der Zugriff auf privilegierte Hilfsfunktionen und die Behandlung des Geltungsbereichs für vertrauenswürdige offizielle Plugins sollten über diesen vertrauenswürdigen Installationspfad validiert und nicht aus einer lokalen Tarball-Installation abgeleitet werden.

Wenn ein Plugin zur Laufzeit aufgrund eines fehlenden Imports fehlschlägt, korrigieren Sie das Paketmanifest, statt das verwaltete Projekt manuell zu reparieren. Laufzeitimporte gehören in `dependencies` oder `optionalDependencies` des Plugin-Pakets; `devDependencies` werden für verwaltete Laufzeitprojekte nicht installiert. Ein lokales `npm install` innerhalb von
`~/.openclaw/npm/projects/<encoded-package>` kann eine vorübergehende Diagnose ermöglichen, stellt aber keinen Nachweis für die Paketabnahme dar, da die nächste Installation oder Aktualisierung das Projekt anhand der Paketmetadaten neu erstellt.

npm kann transitive Abhängigkeiten in `node_modules` des Plugin-Projekts neben dem Plugin-Paket hochstufen. OpenClaw prüft das verwaltete Projektstammverzeichnis, bevor es der Installation vertraut, und entfernt dieses Projekt bei der Deinstallation. Daher bleiben hochgestufte Laufzeitabhängigkeiten innerhalb der Bereinigungsgrenze dieses Plugins.

Veröffentlichte npm-Plugin-Pakete können `npm-shrinkwrap.json` enthalten; npm verwendet diese veröffentlichbare Sperrdatei während der Installation, und das von OpenClaw verwaltete npm-Projektstammverzeichnis unterstützt sie über den normalen Installationspfad. Veröffentlichbare Plugin-Pakete im Besitz von OpenClaw müssen einen paketlokalen Shrinkwrap enthalten, der aus dem veröffentlichten Abhängigkeitsgraphen dieses Pakets generiert wurde:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Der Generator entfernt die `devDependencies` des Plugins, wendet die Workspace-Überschreibungsrichtlinie an und schreibt für jedes Plugin mit
`openclaw.release.publishToNpm: true` die Datei `extensions/<id>/npm-shrinkwrap.json`. Plugin-Pakete von Drittanbietern können ebenfalls einen Shrinkwrap enthalten; OpenClaw verlangt dies nicht für Community-Pakete, aber npm berücksichtigt ihn, wenn er vorhanden ist.

Bevor Sie ein lokales Paket als Nachweis für einen Release-Kandidaten betrachten, prüfen Sie den zu installierenden Tarball:

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

OpenClaw-eigene npm-Plugin-Pakete können auch mit expliziten
`bundledDependencies` veröffentlicht werden. Der npm-Veröffentlichungspfad überlagert die Liste der Namen von Laufzeitabhängigkeiten, entfernt reine Entwicklungs-Workspace-Metadaten aus dem veröffentlichten Manifest, führt eine skriptfreie npm-Installation für die paketlokalen Laufzeitabhängigkeiten aus und packt oder veröffentlicht anschließend den Plugin-Tarball einschließlich dieser Abhängigkeitsdateien. Pakete mit umfangreichen nativen Komponenten (Codex, ACPX, Copilot, llama.cpp,
memory-lancedb, Tlon) deaktivieren dies mit
`openclaw.release.bundleRuntimeDependencies: false`; sie liefern weiterhin einen Shrinkwrap aus, aber npm löst die Laufzeitabhängigkeiten während der Installation auf, statt jede Plattformbinärdatei in den Plugin-Tarball einzubetten. Das Stammpaket `openclaw` bündelt nicht seinen vollständigen Abhängigkeitsbaum.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-Abhängigkeit. OpenClaw lässt nicht zu, dass npm eine separate Registry-Kopie des Hostpakets in einem verwalteten Projekt installiert, da ein veraltetes Hostpaket die Peer-Auflösung von npm innerhalb dieses Plugins beeinflussen kann. Verwaltete npm-Installationen überspringen die Auflösung/Materialisierung von npm-Peer-Abhängigkeiten, und OpenClaw stellt nach einer Installation oder Aktualisierung für installierte Pakete, die die Host-Peer-Abhängigkeit deklarieren, erneut pluginlokale Verknüpfungen unter
`node_modules/openclaw` her.

git-Installationen klonen oder aktualisieren das Repository und führen anschließend Folgendes aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird dann aus diesem Paketverzeichnis geladen, sodass die Auflösung über paketlokale und übergeordnete `node_modules` auf dieselbe Weise funktioniert wie bei einem normalen Node-Paket.

## Lokale Plugins

Lokale Plugins sind von Entwicklern kontrollierte Verzeichnisse. OpenClaw führt für sie niemals `npm install`, `pnpm install` oder eine Reparatur von Abhängigkeiten aus. Wenn ein lokales Plugin Abhängigkeiten hat, installieren Sie diese vor dem Laden im jeweiligen Plugin.

Lokale TypeScript-Plugins von Drittanbietern werden als Notfallpfad über Jiti geladen.
Paketierte JavaScript-Plugins und gebündelte interne Plugins werden stattdessen über natives import/require geladen.

## Start und Neuladen

Beim Start des Gateway und beim Neuladen der Konfiguration werden niemals Plugin-Abhängigkeiten installiert. Dabei werden die Plugin-Installationsdatensätze gelesen, der Einstiegspunkt ermittelt und das Plugin geladen.

Eine zur Laufzeit fehlende Abhängigkeit führt dazu, dass das Laden des Plugins mit einem Fehler fehlschlägt, der den Betreiber auf eine ausdrückliche Abhilfemaßnahme verweist:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` bereinigt veralteten, von OpenClaw generierten Abhängigkeitsstatus und kann herunterladbare Plugins wiederherstellen, die in lokalen Installationsdatensätzen fehlen, wenn die Konfiguration weiterhin auf sie verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und für den Core kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert. Sie sollten entweder keinen umfangreichen Laufzeitabhängigkeitsbaum besitzen oder in ein herunterladbares Paket auf ClawHub/npm ausgelagert werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert, extern installiert oder ausschließlich als Quellcode vorgehalten werden, finden Sie unter
[Plugin-Bestand](/de/plugins/plugin-inventory).

Manifeste gebündelter Plugins dürfen kein Staging von Abhängigkeiten anfordern. Umfangreiche oder optionale Plugin-Funktionalität sollte als normales Plugin paketiert und über denselben npm-/git-/ClawHub-Pfad wie Plugins von Drittanbietern installiert werden.

In Quellcode-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo.
Nach `pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Die Entwicklung in Quellcode-Checkouts unterstützt ausschließlich pnpm; ein einfaches `npm install` im Repository-Stammverzeichnis richtet die Abhängigkeiten gebündelter Plugins nicht ein.

| Installationsstruktur            | Speicherort des gebündelten Plugins   | Zuständigkeit für Abhängigkeiten                                      |
| -------------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| `npm install -g openclaw`        | Erstellter Laufzeitbaum im Paket      | OpenClaw-Paket und explizite Abläufe für Plugin-Installation/-Aktualisierung/Doctor |
| Git-Checkout plus `pnpm install` | Workspace-Pakete unter `extensions/<id>` | Der pnpm-Workspace einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`   | Verwaltetes npm-Projekt-/git-/ClawHub-Stammverzeichnis | Der Ablauf zur Installation/Aktualisierung des Plugins                |

## Bereinigung veralteter Daten

Ältere OpenClaw-Versionen generierten beim Start oder während einer Reparatur durch Doctor Abhängigkeitsstammverzeichnisse für gebündelte Plugins. Die aktuelle Bereinigung durch Doctor entfernt mit `--fix` diese veralteten Verzeichnisse und symbolischen Verknüpfungen, darunter alte `plugin-runtime-deps`-Stammverzeichnisse, globale Paketsymlinks des Node-Präfixes, die auf entfernte
`plugin-runtime-deps`-Ziele verweisen, `.openclaw-runtime-deps*`-Manifeste, generierte Plugin-`node_modules`, Installations-Staging-Verzeichnisse und paketlokale pnpm-Speicher. Die paketierte Nachinstallation entfernt außerdem diese globalen symbolischen Verknüpfungen, bevor sie die veralteten Zielstammverzeichnisse bereinigt, sodass Aktualisierungen keine ins Leere verweisenden ESM-Paketimporte hinterlassen.

Ältere npm-Installationen verwendeten außerdem ein gemeinsames Stammverzeichnis unter `~/.openclaw/npm/node_modules`. Aktuelle Abläufe für Installation, Aktualisierung, Deinstallation und Doctor erkennen dieses veraltete flache Stammverzeichnis weiterhin, jedoch ausschließlich zur Wiederherstellung und Bereinigung. Neue npm-Installationen erstellen stattdessen separate Projektstammverzeichnisse pro Plugin.

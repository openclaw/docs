---
read_when:
    - Sie debuggen Plugin-Paketinstallationen
    - Sie ändern das Verhalten beim Plugin-Start, bei doctor oder bei der Paketmanager-Installation
    - Sie verwalten paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-05-10T19:43:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw hält Plugin-Abhängigkeitsarbeiten auf den Installations-/Aktualisierungszeitpunkt beschränkt. Das Laufzeit-Laden
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und mutiert nicht das OpenClaw-
Paketverzeichnis.

## Verantwortungsaufteilung

Plugin-Pakete besitzen ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten befinden sich in `dependencies` oder
  `optionalDependencies` des Plugin-Pakets
- SDK-/Core-Importe sind Peer- oder von OpenClaw bereitgestellte Importe
- lokale Entwicklungs-Plugins bringen ihre eigenen, bereits installierten Abhängigkeiten mit
- npm- und git-Plugins werden in von OpenClaw verwaltete Paket-Roots installiert

OpenClaw besitzt nur den Plugin-Lebenszyklus:

- die Plugin-Quelle erkennen
- das Paket installieren oder aktualisieren, wenn dies ausdrücklich angefordert wird
- die Installationsmetadaten aufzeichnen
- den Plugin-Entrypoint laden
- mit einem handlungsfähigen Fehler fehlschlagen, wenn Abhängigkeiten fehlen

## Installations-Roots

OpenClaw verwendet stabile Roots pro Quelle:

- npm-Pakete werden unter `~/.openclaw/npm` installiert
- git-Pakete werden unter `~/.openclaw/git` geklont
- lokale/Pfad-/Archiv-Installationen werden ohne Abhängigkeitsreparatur kopiert oder referenziert

npm-Installationen laufen im npm-Root mit:

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` verwendet denselben verwalteten npm-Root
für ein lokales npm-pack-Tarball. OpenClaw liest die npm-Metadaten des Tarballs, fügt es
dem verwalteten Root als kopierte `file:`-Abhängigkeit hinzu, führt die normale npm-Installation aus
und verifiziert anschließend die installierten Lockfile-Metadaten, bevor dem Plugin vertraut wird.
Dies ist für Paketabnahme- und Release-Candidate-Nachweise gedacht, bei denen ein
lokales Pack-Artefakt sich wie das Registry-Artefakt verhalten soll, das es simuliert.

npm kann transitive Abhängigkeiten nach `~/.openclaw/npm/node_modules` neben
dem Plugin-Paket hoisten. OpenClaw scannt den verwalteten npm-Root, bevor der
Installation vertraut wird, und verwendet npm, um npm-verwaltete Pakete während der Deinstallation zu entfernen, sodass gehoistete
Laufzeitabhängigkeiten innerhalb der verwalteten Bereinigungsgrenze bleiben.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-
Abhängigkeit. OpenClaw lässt npm keine separate Registry-Kopie des
Host-Pakets in den verwalteten Root installieren, weil veraltete Host-Pakete die npm-
Peer-Auflösung bei späteren Plugin-Installationen beeinflussen können. Verwaltete npm-Installationen überspringen die npm-Peer-
Auflösung/-Materialisierung für den gemeinsamen Root, und OpenClaw stellt nach Installation, Aktualisierung oder Deinstallation
Plugin-lokale `node_modules/openclaw`-Links für installierte Pakete wieder her, die
den Host-Peer deklarieren.

git-Installationen klonen oder aktualisieren das Repository und führen dann aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird dann aus diesem Paketverzeichnis geladen, sodass paketlokale
und übergeordnete `node_modules`-Auflösung genauso funktioniert wie bei einem normalen
Node-Paket.

## Lokale Plugins

Lokale Plugins werden als entwicklerkontrollierte Verzeichnisse behandelt. OpenClaw führt für sie weder
`npm install`, `pnpm install` noch Abhängigkeitsreparaturen aus. Wenn ein lokales
Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Lokale TypeScript-Plugins von Drittanbietern können den Jiti-Notfallpfad verwenden. Paketierte
JavaScript-Plugins und gebündelte interne Plugins werden über native
import/require statt über Jiti geladen.

## Start und Neuladen

Gateway-Start und Konfigurationsneuladen installieren niemals Plugin-Abhängigkeiten. Sie lesen
die Plugin-Installationsdatensätze, berechnen den Entrypoint und laden ihn.

Wenn zur Laufzeit eine Abhängigkeit fehlt, kann das Plugin nicht geladen werden, und der Fehler
sollte den Operator auf eine ausdrückliche Korrektur hinweisen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kann alten von OpenClaw generierten Abhängigkeitszustand bereinigen und
herunterladbare Plugins wiederherstellen, die in den lokalen Installationsdatensätzen fehlen, wenn die Konfiguration
darauf verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes
lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und core-kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert.
Sie sollten entweder keinen schweren Laufzeit-Abhängigkeitsbaum haben oder in ein
herunterladbares Paket auf ClawHub/npm ausgelagert werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert, extern
installiert oder nur als Quellcode behalten werden, finden Sie unter [Plugin-Bestandsliste](/de/plugins/plugin-inventory).

Gebündelte Plugin-Manifeste dürfen kein Dependency Staging anfordern. Große oder optionale
Plugin-Funktionalität sollte als normales Plugin paketiert und über
denselben npm-/git-/ClawHub-Pfad installiert werden wie Drittanbieter-Plugins.

In Source-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach
`pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale
Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Die Entwicklung in Source-
Checkouts ist pnpm-only; ein einfaches `npm install` im Repository-Root ist
kein unterstützter Weg, um Abhängigkeiten gebündelter Plugins vorzubereiten.

| Installationsform                 | Speicherort des gebündelten Plugins  | Verantwortlicher für Abhängigkeiten                                      |
| --------------------------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| `npm install -g openclaw`         | Gebauter Laufzeitbaum im Paket       | OpenClaw-Paket und ausdrückliche Plugin-Install-/Update-/Doctor-Flows    |
| Git-Checkout plus `pnpm install`  | `extensions/<id>`-Workspace-Pakete   | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`    | Verwalteter npm-/git-/ClawHub-Plugin-Root | Der Plugin-Install-/Update-Flow                                      |

## Legacy-Bereinigung

Ältere OpenClaw-Versionen erzeugten Roots für Abhängigkeiten gebündelter Plugins beim Start oder
während der Doctor-Reparatur. Die aktuelle Doctor-Bereinigung entfernt diese veralteten Verzeichnisse und
Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Roots, globaler
Node-Präfix-Paket-Symlinks, die auf bereinigte `plugin-runtime-deps`-Ziele zeigen,
`.openclaw-runtime-deps*`-Manifeste, generierter Plugin-`node_modules`, Installations-
Staging-Verzeichnisse und paketlokaler pnpm-Stores. Paketiertes postinstall entfernt außerdem
diese globalen Symlinks, bevor die Legacy-Ziel-Roots bereinigt werden, damit Upgrades
keine hängenden ESM-Paketimporte zurücklassen.

Diese Pfade sind nur Legacy-Überreste. Neue Installationen sollten sie nicht erstellen.

---
read_when:
    - Sie debuggen Installationen von Plugin-Paketen
    - Sie ändern das Startverhalten von Plugins, doctor oder das Installationsverhalten des Package-Managers
    - Sie verwalten paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Plugin-Abhängigkeitsauflösung
x-i18n:
    generated_at: "2026-05-03T21:36:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Auflösung von Plugin-Abhängigkeiten

OpenClaw hält Arbeiten an Plugin-Abhängigkeiten auf den Zeitpunkt der Installation/Aktualisierung beschränkt. Das Laden zur Laufzeit
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und verändert nicht das OpenClaw-
Paketverzeichnis.

## Aufteilung der Verantwortlichkeiten

Plugin-Pakete besitzen ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten befinden sich in `dependencies` oder
  `optionalDependencies` des Plugin-Pakets
- SDK-/Core-Importe sind Peer- oder von OpenClaw bereitgestellte Importe
- lokale Entwicklungs-Plugins bringen ihre eigenen bereits installierten Abhängigkeiten mit
- npm- und git-Plugins werden in OpenClaw-eigene Paket-Roots installiert

OpenClaw besitzt nur den Plugin-Lebenszyklus:

- die Plugin-Quelle erkennen
- das Paket installieren oder aktualisieren, wenn dies ausdrücklich angefordert wird
- die Installationsmetadaten aufzeichnen
- den Plugin-Einstiegspunkt laden
- mit einem umsetzbaren Fehler fehlschlagen, wenn Abhängigkeiten fehlen

## Installations-Roots

OpenClaw verwendet stabile Roots pro Quelle:

- npm-Pakete werden unter `~/.openclaw/npm` installiert
- git-Pakete werden unter `~/.openclaw/git` geklont
- lokale/Pfad-/Archivinstallationen werden ohne Abhängigkeitsreparatur kopiert oder referenziert

npm-Installationen laufen im npm-Root mit:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm kann transitive Abhängigkeiten nach `~/.openclaw/npm/node_modules` neben
das Plugin-Paket hoisten. OpenClaw scannt den verwalteten npm-Root, bevor es der
Installation vertraut, und verwendet npm, um npm-verwaltete Pakete bei der Deinstallation zu entfernen, sodass gehoistete
Laufzeitabhängigkeiten innerhalb der verwalteten Bereinigungsgrenze bleiben.

git-Installationen klonen oder aktualisieren das Repository und führen dann aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird anschließend aus diesem Paketverzeichnis geladen, sodass die Auflösung von paketlokalen
und übergeordneten `node_modules` genauso funktioniert wie bei einem normalen
Node-Paket.

## Lokale Plugins

Lokale Plugins werden als entwicklerkontrollierte Verzeichnisse behandelt. OpenClaw führt dafür kein
`npm install`, `pnpm install` und keine Abhängigkeitsreparatur aus. Wenn ein lokales
Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Drittanbieter-TypeScript-Plugins können lokal den Jiti-Notfallpfad verwenden. Paketierte
JavaScript-Plugins und gebündelte interne Plugins werden über natives
import/require statt über Jiti geladen.

## Start und Neuladen

Gateway-Start und Konfigurations-Neuladen installieren niemals Plugin-Abhängigkeiten. Sie lesen
die Plugin-Installationsdatensätze, berechnen den Einstiegspunkt und laden ihn.

Wenn zur Laufzeit eine Abhängigkeit fehlt, kann das Plugin nicht geladen werden, und der Fehler
sollte den Betreiber auf eine explizite Behebung verweisen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kann alten, von OpenClaw generierten Abhängigkeitszustand bereinigen und
konfigurierte herunterladbare Plugins installieren, die in den lokalen Installationsdatensätzen fehlen.
Es repariert keine Abhängigkeiten für ein bereits installiertes lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und Core-kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert.
Sie sollten entweder keinen schweren Laufzeit-Abhängigkeitsbaum haben oder in ein
herunterladbares Paket auf ClawHub/npm ausgelagert werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert, extern
installiert oder nur als Quellcode behalten werden, finden Sie im [Plugin-Inventar](/de/plugins/plugin-inventory).

Manifeste gebündelter Plugins dürfen kein Dependency Staging anfordern. Große oder optionale
Plugin-Funktionalität sollte als normales Plugin paketiert und über
denselben npm-/git-/ClawHub-Pfad wie Drittanbieter-Plugins installiert werden.

In Source-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach
`pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale
Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Die Entwicklung in Source-
Checkouts ist ausschließlich pnpm-basiert; ein einfaches `npm install` im Repository-Root ist
kein unterstützter Weg, um Abhängigkeiten gebündelter Plugins vorzubereiten.

| Installationsform                | Speicherort des gebündelten Plugins   | Verantwortlicher für Abhängigkeiten                                |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `npm install -g openclaw`        | Gebauter Laufzeitbaum innerhalb des Pakets | OpenClaw-Paket und explizite Plugin-Installations-/Aktualisierungs-/doctor-Abläufe |
| Git-Checkout plus `pnpm install` | Workspace-Pakete in `extensions/<id>` | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`   | Verwalteter npm-/git-/ClawHub-Plugin-Root | Der Plugin-Installations-/Aktualisierungsablauf                    |

## Legacy-Bereinigung

Ältere OpenClaw-Versionen erzeugten Roots für Abhängigkeiten gebündelter Plugins beim Start oder
während der doctor-Reparatur. Die aktuelle doctor-Bereinigung entfernt diese veralteten Verzeichnisse und
Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Roots, globaler
Node-Präfix-Paket-Symlinks, die auf bereinigte `plugin-runtime-deps`-Ziele verweisen,
`.openclaw-runtime-deps*`-Manifeste, generierte Plugin-`node_modules`, Installations-
Stage-Verzeichnisse und paketlokale pnpm-Stores. Das paketierte postinstall entfernt außerdem
diese globalen Symlinks, bevor die alten Ziel-Roots bereinigt werden, damit Upgrades
keine hängenden ESM-Paketimporte zurücklassen.

Diese Pfade sind nur Legacy-Überreste. Neue Installationen sollten sie nicht erstellen.

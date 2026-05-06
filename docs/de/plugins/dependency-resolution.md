---
read_when:
    - Sie debuggen Installationen von Plugin-Paketen
    - Sie ändern das Startverhalten von Plugins, Doctor oder das Installationsverhalten des Paketmanagers
    - Sie verwalten paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-05-06T06:57:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ef307fb034d397a5e2e991254fb881046c73a4e6d860073b90f2b4e0667edc2
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin-Abhängigkeitsauflösung

OpenClaw hält die Arbeit an Plugin-Abhängigkeiten auf die Installations-/Update-Zeit beschränkt. Das Laden zur Laufzeit
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und verändert nicht das OpenClaw-
Paketverzeichnis.

## Aufteilung der Verantwortlichkeiten

Plugin-Pakete besitzen ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten befinden sich in den Plugin-Paket-`dependencies` oder
  `optionalDependencies`
- SDK-/Core-Importe sind Peer- oder von OpenClaw bereitgestellte Importe
- lokale Entwicklungs-Plugins bringen ihre eigenen, bereits installierten Abhängigkeiten mit
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
- lokale/Pfad-/Archiv-Installationen werden ohne Abhängigkeitsreparatur kopiert oder referenziert

npm-Installationen laufen im npm-Root mit:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm kann transitive Abhängigkeiten neben dem Plugin-Paket nach `~/.openclaw/npm/node_modules` hoisten. OpenClaw scannt den verwalteten npm-Root, bevor es der Installation vertraut, und verwendet npm, um npm-verwaltete Pakete während der Deinstallation zu entfernen, sodass gehoistete Laufzeitabhängigkeiten innerhalb der verwalteten Bereinigungsgrenze bleiben.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-Abhängigkeit. OpenClaw lässt npm keine separate Registry-Kopie des Host-Pakets in den verwalteten Root installieren, weil veraltete Host-Pakete die npm-Peer-Auflösung bei späteren Plugin-Installationen beeinflussen können. Stattdessen setzt OpenClaw, nachdem npm den gemeinsam genutzten Root während Installation, Update oder Deinstallation verändert hat, Plugin-lokale `node_modules/openclaw`-Links für installierte Pakete erneut durch, die den Host-Peer deklarieren.

git-Installationen klonen oder aktualisieren das Repository und führen dann aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird dann aus diesem Paketverzeichnis geladen, sodass paketlokale und übergeordnete `node_modules`-Auflösung genauso funktioniert wie bei einem normalen Node-Paket.

## Lokale Plugins

Lokale Plugins werden als von Entwicklern kontrollierte Verzeichnisse behandelt. OpenClaw führt für sie weder `npm install`, `pnpm install` noch Abhängigkeitsreparaturen aus. Wenn ein lokales Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Lokale TypeScript-Plugins von Drittanbietern können den Notfallpfad über Jiti verwenden. Paketierte JavaScript-Plugins und gebündelte interne Plugins werden über natives import/require statt über Jiti geladen.

## Start und Neuladen

Gateway-Start und Konfigurations-Neuladen installieren niemals Plugin-Abhängigkeiten. Sie lesen die Plugin-Installationsdatensätze, berechnen den Einstiegspunkt und laden ihn.

Wenn zur Laufzeit eine Abhängigkeit fehlt, schlägt das Laden des Plugins fehl, und der Fehler sollte den Betreiber auf eine explizite Behebung hinweisen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kann von OpenClaw erzeugten Legacy-Abhängigkeitszustand bereinigen und herunterladbare Plugins wiederherstellen, die in den lokalen Installationsdatensätzen fehlen, wenn die Konfiguration auf sie verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und für den Core kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert. Sie sollten entweder keinen schweren Laufzeit-Abhängigkeitsbaum haben oder in ein herunterladbares Paket auf ClawHub/npm verschoben werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert, extern installiert oder nur als Quellcode behalten werden, finden Sie unter [Plugin-Bestand](/de/plugins/plugin-inventory).

Manifestdateien gebündelter Plugins dürfen kein Dependency-Staging anfordern. Große oder optionale Plugin-Funktionalität sollte als normales Plugin paketiert und über denselben npm-/git-/ClawHub-Pfad wie Drittanbieter-Plugins installiert werden.

In Quell-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach `pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Entwicklung in Quell-Checkouts ist ausschließlich pnpm-basiert; ein einfaches `npm install` im Repository-Root ist kein unterstützter Weg, um Abhängigkeiten gebündelter Plugins vorzubereiten.

| Installationsform                | Speicherort des gebündelten Plugins   | Eigentümer der Abhängigkeiten                                       |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebauter Laufzeitbaum innerhalb des Pakets | OpenClaw-Paket und explizite Plugin-Installations-/Update-/Doctor-Flows |
| Git-Checkout plus `pnpm install` | `extensions/<id>`-Workspace-Pakete    | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`   | Verwalteter npm-/git-/ClawHub-Plugin-Root | Der Plugin-Installations-/Update-Flow                               |

## Legacy-Bereinigung

Ältere OpenClaw-Versionen erzeugten Roots für Abhängigkeiten gebündelter Plugins beim Start oder während der Doctor-Reparatur. Die aktuelle Doctor-Bereinigung entfernt diese veralteten Verzeichnisse und Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Roots, globaler Node-Präfix-Paket-Symlinks, die auf entfernte `plugin-runtime-deps`-Ziele zeigen, `.openclaw-runtime-deps*`-Manifeste, erzeugter Plugin-`node_modules`, Installations-Staging-Verzeichnisse und paketlokaler pnpm-Stores. Paketierte Postinstall-Schritte entfernen außerdem diese globalen Symlinks, bevor die Legacy-Ziel-Roots entfernt werden, damit Upgrades keine hängenden ESM-Paketimporte zurücklassen.

Diese Pfade sind nur Legacy-Reste. Neue Installationen sollten sie nicht erstellen.

---
read_when:
    - Sie debuggen Installationen von Plugin-Paketen
    - Sie ändern das Startverhalten von Plugins, das Doctor-Verhalten oder das Installationsverhalten des Paketmanagers
    - Sie verwalten paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-05-06T17:58:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw hält die Arbeit an Plugin-Abhängigkeiten auf Installations-/Update-Zeit beschränkt. Das Laden zur Laufzeit
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und verändert nicht das OpenClaw-
Paketverzeichnis.

## Aufteilung der Zuständigkeiten

Plugin-Pakete besitzen ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten stehen in den `dependencies` oder
  `optionalDependencies` des Plugin-Pakets
- SDK-/Core-Importe sind Peer-Importe oder von OpenClaw bereitgestellte Importe
- lokale Entwicklungs-Plugins bringen ihre eigenen, bereits installierten Abhängigkeiten mit
- npm- und git-Plugins werden in OpenClaw-eigene Paket-Roots installiert

OpenClaw besitzt nur den Plugin-Lebenszyklus:

- die Plugin-Quelle erkennen
- das Paket installieren oder aktualisieren, wenn dies ausdrücklich angefordert wird
- die Installationsmetadaten aufzeichnen
- den Plugin-Entrypoint laden
- mit einem umsetzbaren Fehler fehlschlagen, wenn Abhängigkeiten fehlen

## Installations-Roots

OpenClaw verwendet stabile Roots pro Quelle:

- npm-Pakete werden unter `~/.openclaw/npm` installiert
- git-Pakete werden unter `~/.openclaw/git` geklont
- lokale/Pfad-/Archiv-Installationen werden ohne Reparatur von Abhängigkeiten kopiert oder referenziert

npm-Installationen laufen im npm-Root mit:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` verwendet denselben verwalteten npm-Root
für ein lokales npm-pack-Tarball. OpenClaw liest die npm-Metadaten des Tarballs, fügt es
dem verwalteten Root als kopierte `file:`-Abhängigkeit hinzu, führt die normale npm-Installation aus
und überprüft anschließend die installierten Lockfile-Metadaten, bevor dem Plugin vertraut wird.
Dies ist für Paketabnahme- und Release-Candidate-Nachweise gedacht, bei denen sich ein
lokales Pack-Artefakt wie das Registry-Artefakt verhalten soll, das es simuliert.

npm kann transitive Abhängigkeiten nach `~/.openclaw/npm/node_modules` neben
das Plugin-Paket hoisten. OpenClaw scannt den verwalteten npm-Root, bevor der
Installation vertraut wird, und verwendet npm, um npm-verwaltete Pakete bei der Deinstallation zu entfernen, sodass gehoistete
Laufzeitabhängigkeiten innerhalb der verwalteten Bereinigungsgrenze bleiben.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-
Abhängigkeit. OpenClaw lässt npm keine separate Registry-Kopie des
Host-Pakets in den verwalteten Root installieren, weil veraltete Host-Pakete die npm-
Peer-Auflösung bei späteren Plugin-Installationen beeinflussen können. Stattdessen setzt OpenClaw, nachdem npm
den gemeinsamen Root während Installation, Update oder Deinstallation verändert hat, die Plugin-lokalen
`node_modules/openclaw`-Links für installierte Pakete erneut durch, die den Host-Peer deklarieren.

git-Installationen klonen oder aktualisieren das Repository und führen dann aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird dann aus diesem Paketverzeichnis geladen, sodass die Auflösung von Paket-lokalen
und übergeordneten `node_modules` genauso funktioniert wie bei einem normalen
Node-Paket.

## Lokale Plugins

Lokale Plugins werden als entwicklerkontrollierte Verzeichnisse behandelt. OpenClaw führt für sie weder
`npm install`, `pnpm install` noch eine Reparatur von Abhängigkeiten aus. Wenn ein lokales
Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Lokale TypeScript-Plugins von Drittanbietern können den Notfallpfad über Jiti verwenden. Paketierte
JavaScript-Plugins und gebündelte interne Plugins werden über natives
import/require statt über Jiti geladen.

## Start und Neuladen

Gateway-Start und Konfigurations-Neuladen installieren niemals Plugin-Abhängigkeiten. Sie lesen
die Plugin-Installationsdatensätze, berechnen den Entrypoint und laden ihn.

Wenn zur Laufzeit eine Abhängigkeit fehlt, schlägt das Laden des Plugins fehl, und der Fehler
sollte die betreibende Person auf eine explizite Lösung hinweisen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kann veralteten, von OpenClaw erzeugten Abhängigkeitsstatus bereinigen und
herunterladbare Plugins wiederherstellen, die in den lokalen Installationsdatensätzen fehlen, wenn die Konfiguration
auf sie verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes
lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und Core-kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert.
Sie sollten entweder keinen schweren Laufzeit-Abhängigkeitsbaum haben oder in ein
herunterladbares Paket auf ClawHub/npm verschoben werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert werden, extern
installiert werden oder nur im Quellcode verbleiben, finden Sie unter [Plugin-Inventar](/de/plugins/plugin-inventory).

Manifeste gebündelter Plugins dürfen kein Dependency-Staging anfordern. Große oder optionale
Plugin-Funktionalität sollte als normales Plugin paketiert und über
denselben npm/git/ClawHub-Pfad installiert werden wie Drittanbieter-Plugins.

In Quellcode-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach
`pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass Paket-lokale
Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Entwicklung mit
Quellcode-Checkout ist ausschließlich pnpm-basiert; ein einfaches `npm install` im Repository-Root ist
keine unterstützte Methode, um Abhängigkeiten gebündelter Plugins vorzubereiten.

| Installationsform                 | Speicherort des gebündelten Plugins   | Besitzer der Abhängigkeiten                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebauter Laufzeitbaum im Paket        | OpenClaw-Paket und explizite Plugin-Install-/Update-/Doctor-Flows    |
| Git-Checkout plus `pnpm install` | `extensions/<id>`-Workspace-Pakete    | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`   | Verwalteter npm/git/ClawHub-Plugin-Root | Der Plugin-Install-/Update-Flow                                      |

## Bereinigung von Altlasten

Ältere OpenClaw-Versionen erzeugten Roots für Abhängigkeiten gebündelter Plugins beim Start oder
während der Doctor-Reparatur. Die aktuelle Doctor-Bereinigung entfernt diese veralteten Verzeichnisse und
Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Roots, globaler
Node-Präfix-Paketsymlinks, die auf bereinigte `plugin-runtime-deps`-Ziele zeigen,
`.openclaw-runtime-deps*`-Manifeste, erzeugte Plugin-`node_modules`, Installations-
Stage-Verzeichnisse und Paket-lokale pnpm-Stores. Paketiertes Postinstall entfernt außerdem
diese globalen Symlinks, bevor die veralteten Ziel-Roots bereinigt werden, damit Upgrades
keine hängenden ESM-Paketimporte hinterlassen.

Diese Pfade sind nur veraltete Rückstände. Neue Installationen sollten sie nicht erstellen.

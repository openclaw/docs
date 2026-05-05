---
read_when:
    - Sie debuggen Installationen von Plugin-Paketen
    - Sie ändern das Verhalten beim Plugin-Start, bei doctor oder bei Installationen über den Paketmanager
    - Sie pflegen paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-05-05T01:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin-Abhängigkeitsauflösung

OpenClaw erledigt Plugin-Abhängigkeitsarbeit zur Installations-/Aktualisierungszeit. Das Laden zur Laufzeit
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und verändert nicht das OpenClaw-
Paketverzeichnis.

## Verantwortungsaufteilung

Plugin-Pakete besitzen ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten befinden sich in den `dependencies` oder
  `optionalDependencies` des Plugin-Pakets
- SDK-/Core-Importe sind Peer-Imports oder von OpenClaw bereitgestellte Importe
- lokale Entwicklungs-Plugins bringen ihre bereits installierten Abhängigkeiten selbst mit
- npm- und git-Plugins werden in OpenClaw-eigene Paket-Wurzeln installiert

OpenClaw besitzt nur den Plugin-Lebenszyklus:

- die Plugin-Quelle ermitteln
- das Paket installieren oder aktualisieren, wenn dies ausdrücklich angefordert wird
- die Installationsmetadaten aufzeichnen
- den Plugin-Einstiegspunkt laden
- mit einem umsetzbaren Fehler fehlschlagen, wenn Abhängigkeiten fehlen

## Installations-Wurzeln

OpenClaw verwendet stabile Wurzeln pro Quelle:

- npm-Pakete werden unter `~/.openclaw/npm` installiert
- git-Pakete werden unter `~/.openclaw/git` geklont
- lokale/Pfad-/Archiv-Installationen werden ohne Abhängigkeitsreparatur kopiert oder referenziert

npm-Installationen laufen in der npm-Wurzel mit:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm kann transitive Abhängigkeiten nach `~/.openclaw/npm/node_modules` neben
das Plugin-Paket hoisten. OpenClaw scannt die verwaltete npm-Wurzel, bevor der
Installation vertraut wird, und verwendet npm, um npm-verwaltete Pakete bei der Deinstallation zu entfernen, sodass gehoistete
Laufzeitabhängigkeiten innerhalb der verwalteten Bereinigungsgrenze bleiben.

git-Installationen klonen oder aktualisieren das Repository und führen dann aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird anschließend aus diesem Paketverzeichnis geladen, sodass die paketlokale
und übergeordnete `node_modules`-Auflösung genauso funktioniert wie bei einem normalen
Node-Paket.

## Lokale Plugins

Lokale Plugins werden als entwicklerkontrollierte Verzeichnisse behandelt. OpenClaw führt für sie kein
`npm install`, `pnpm install` oder keine Abhängigkeitsreparatur aus. Wenn ein lokales
Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Lokale TypeScript-Plugins von Drittanbietern können den Jiti-Notfallpfad verwenden. Paketierte
JavaScript-Plugins und gebündelte interne Plugins werden über natives
import/require statt über Jiti geladen.

## Start und Neuladen

Gateway-Start und Konfigurationsneuladen installieren niemals Plugin-Abhängigkeiten. Sie lesen
die Plugin-Installationsdatensätze, berechnen den Einstiegspunkt und laden ihn.

Wenn zur Laufzeit eine Abhängigkeit fehlt, schlägt das Laden des Plugins fehl und der Fehler
sollte den Betreiber auf eine ausdrückliche Behebung hinweisen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kann veralteten, von OpenClaw erzeugten Abhängigkeitszustand bereinigen und
herunterladbare Plugins wiederherstellen, die in den lokalen Installationsdatensätzen fehlen, wenn die Konfiguration
auf sie verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes
lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und core-kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert.
Sie sollten entweder keinen schweren Laufzeit-Abhängigkeitsbaum haben oder in ein
herunterladbares Paket auf ClawHub/npm verschoben werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert, extern
installiert oder nur als Quellcode beibehalten werden, finden Sie im [Plugin-Inventar](/de/plugins/plugin-inventory).

Manifeste gebündelter Plugins dürfen kein Dependency Staging anfordern. Große oder optionale
Plugin-Funktionalität sollte als normales Plugin paketiert und über
denselben npm/git/ClawHub-Pfad wie Drittanbieter-Plugins installiert werden.

In Source-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach
`pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale
Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Die Entwicklung in Source-
Checkouts ist ausschließlich pnpm-basiert; ein einfaches `npm install` in der Repository-Wurzel ist
kein unterstützter Weg, um Abhängigkeiten gebündelter Plugins vorzubereiten.

| Installationsform                | Speicherort gebündelter Plugins       | Eigentümer der Abhängigkeiten                                      |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `npm install -g openclaw`        | Gebauter Laufzeitbaum im Paket        | OpenClaw-Paket und explizite Plugin-Installations-/Aktualisierungs-/Doctor-Flows |
| Git-Checkout plus `pnpm install` | `extensions/<id>`-Workspace-Pakete    | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`   | Verwaltete npm/git/ClawHub-Plugin-Wurzel | Der Plugin-Installations-/Aktualisierungs-Flow                     |

## Bereinigung veralteter Reste

Ältere OpenClaw-Versionen erzeugten Wurzeln für Abhängigkeiten gebündelter Plugins beim Start oder
während der Doctor-Reparatur. Die aktuelle Doctor-Bereinigung entfernt diese veralteten Verzeichnisse und
Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Wurzeln, globaler
Node-Präfix-Paket-Symlinks, die auf entfernte `plugin-runtime-deps`-Ziele zeigen,
`.openclaw-runtime-deps*`-Manifeste, generierte Plugin-`node_modules`, Installations-
Stage-Verzeichnisse und paketlokale pnpm-Stores. Das paketierte Postinstall entfernt außerdem
diese globalen Symlinks, bevor die veralteten Zielwurzeln bereinigt werden, damit Upgrades
keine hängenden ESM-Paketimporte hinterlassen.

Diese Pfade sind nur veraltete Überreste. Neue Installationen sollten sie nicht erstellen.

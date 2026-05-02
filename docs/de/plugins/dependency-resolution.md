---
read_when:
    - Sie debuggen Plugin-Paketinstallationen
    - Sie ändern das Plugin-Startverhalten, das Doctor-Verhalten oder das Installationsverhalten des Paketmanagers
    - Sie verwalten paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-05-02T20:50:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin-Abhängigkeitsauflösung

OpenClaw führt Arbeiten an Plugin-Abhängigkeiten beim Installieren/Aktualisieren aus. Das Laden zur Laufzeit
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und verändert nicht das OpenClaw-
Paketverzeichnis.

## Aufteilung der Zuständigkeiten

Plugin-Pakete verwalten ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten befinden sich in den Plugin-Paket-`dependencies` oder
  `optionalDependencies`
- SDK-/Core-Importe sind Peer- oder von OpenClaw bereitgestellte Importe
- lokale Entwicklungs-Plugins bringen ihre eigenen bereits installierten Abhängigkeiten mit
- npm- und git-Plugins werden in von OpenClaw verwaltete Paket-Roots installiert

OpenClaw verwaltet nur den Plugin-Lebenszyklus:

- die Plugin-Quelle ermitteln
- das Paket installieren oder aktualisieren, wenn dies ausdrücklich angefordert wird
- die Installationsmetadaten aufzeichnen
- den Plugin-Einstiegspunkt laden
- mit einem handlungsorientierten Fehler fehlschlagen, wenn Abhängigkeiten fehlen

## Installations-Roots

OpenClaw verwendet stabile Roots pro Quelle:

- npm-Pakete werden unter `~/.openclaw/npm` installiert
- git-Pakete werden unter `~/.openclaw/git` geklont
- lokale/Pfad-/Archiv-Installationen werden kopiert oder referenziert, ohne Abhängigkeiten zu reparieren

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

Das installierte Plugin wird dann aus diesem Paketverzeichnis geladen, sodass die Auflösung paketlokaler
und übergeordneter `node_modules` genauso funktioniert wie bei einem normalen
Node-Paket.

## Lokale Plugins

Lokale Plugins werden als entwicklerkontrollierte Verzeichnisse behandelt. OpenClaw führt für sie kein
`npm install`, `pnpm install` und keine Reparatur von Abhängigkeiten aus. Wenn ein lokales
Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Lokale TypeScript-Plugins von Drittanbietern können den Notfallpfad über Jiti verwenden. Paketierte
JavaScript-Plugins und gebündelte interne Plugins werden über natives
import/require statt über Jiti geladen.

## Start und Neuladen

Gateway-Start und Konfigurationsneuladen installieren niemals Plugin-Abhängigkeiten. Sie lesen
die Plugin-Installationsdatensätze, berechnen den Einstiegspunkt und laden ihn.

Wenn zur Laufzeit eine Abhängigkeit fehlt, kann das Plugin nicht geladen werden, und der Fehler
sollte den Betreiber auf eine explizite Behebung hinweisen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kann veralteten, von OpenClaw erzeugten Abhängigkeitszustand bereinigen und
konfigurierte herunterladbare Plugins installieren, die in den lokalen Installationsdatensätzen fehlen.
Es repariert keine Abhängigkeiten für ein bereits installiertes lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und für den Core kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert.
Sie sollten entweder keinen umfangreichen Laufzeitabhängigkeitsbaum haben oder in ein
herunterladbares Paket auf ClawHub/npm ausgelagert werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert werden, extern
installiert werden oder nur als Quellcode verbleiben, finden Sie im [Plugin-Bestand](/de/plugins/plugin-inventory).

Gebündelte Plugin-Manifeste dürfen kein Dependency Staging anfordern. Umfangreiche oder optionale
Plugin-Funktionalität sollte als normales Plugin paketiert und über
denselben npm-/git-/ClawHub-Pfad wie Drittanbieter-Plugins installiert werden.

In Source-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach
`pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale
Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Die Entwicklung mit
Source-Checkouts ist nur mit pnpm unterstützt; ein einfaches `npm install` im Repository-Root ist
keine unterstützte Methode, um Abhängigkeiten gebündelter Plugins vorzubereiten.

| Installationsform                 | Speicherort des gebündelten Plugins          | Verantwortlicher für Abhängigkeiten                                      |
| --------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `npm install -g openclaw`         | Gebauter Laufzeitbaum innerhalb des Pakets   | OpenClaw-Paket und explizite Plugin-Installations-/Aktualisierungs-/doctor-Abläufe |
| Git-Checkout plus `pnpm install`  | `extensions/<id>`-Workspace-Pakete           | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`    | Verwalteter npm-/git-/ClawHub-Plugin-Root    | Der Plugin-Installations-/Aktualisierungsablauf                          |

## Bereinigung von Altlasten

Ältere OpenClaw-Versionen erzeugten Roots für Abhängigkeiten gebündelter Plugins beim Start oder
während einer doctor-Reparatur. Die aktuelle doctor-Bereinigung entfernt diese veralteten Verzeichnisse und
Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Roots,
`.openclaw-runtime-deps*`-Manifeste, generierter Plugin-`node_modules`, Installations-
Stage-Verzeichnisse und paketlokaler pnpm-Stores.

Diese Pfade sind nur Altlasten. Neue Installationen sollten sie nicht erstellen.

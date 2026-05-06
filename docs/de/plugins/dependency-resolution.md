---
read_when:
    - Sie debuggen Plugin-Paketinstallationen
    - Sie ändern das Plugin-Startverhalten, Doctor-Verhalten oder Installationsverhalten des Paketmanagers
    - Sie pflegen paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-05-06T09:03:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin-Abhängigkeitsauflösung

OpenClaw erledigt die Arbeit an Plugin-Abhängigkeiten zur Installations-/Aktualisierungszeit. Das Laden zur Laufzeit
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und verändert nicht das OpenClaw-
Paketverzeichnis.

## Verantwortungsaufteilung

Plugin-Pakete besitzen ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten befinden sich in den `dependencies` oder
  `optionalDependencies` des Plugin-Pakets
- SDK-/Core-Imports sind Peer- oder von OpenClaw bereitgestellte Imports
- lokale Entwicklungs-Plugins bringen ihre eigenen bereits installierten Abhängigkeiten mit
- npm- und Git-Plugins werden in OpenClaw-eigene Paket-Roots installiert

OpenClaw besitzt nur den Plugin-Lebenszyklus:

- Plugin-Quelle ermitteln
- Paket installieren oder aktualisieren, wenn dies explizit angefordert wird
- Installationsmetadaten aufzeichnen
- Plugin-Einstiegspunkt laden
- mit einem handlungsorientierten Fehler fehlschlagen, wenn Abhängigkeiten fehlen

## Installations-Roots

OpenClaw verwendet stabile Roots pro Quelle:

- npm-Pakete werden unter `~/.openclaw/npm` installiert
- Git-Pakete werden unter `~/.openclaw/git` geklont
- lokale/Pfad-/Archiv-Installationen werden ohne Abhängigkeitsreparatur kopiert oder referenziert

npm-Installationen laufen im npm-Root mit:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` verwendet denselben verwalteten npm-Root
für einen lokalen npm-pack-Tarball. OpenClaw liest die npm-Metadaten des Tarballs, fügt ihn
dem verwalteten Root als kopierte `file:`-Abhängigkeit hinzu, führt die normale npm-Installation aus
und prüft anschließend die installierten Lockfile-Metadaten, bevor dem Plugin vertraut wird.
Dies ist für Paketakzeptanz- und Release-Candidate-Nachweise gedacht, bei denen ein
lokales Pack-Artefakt sich wie das Registry-Artefakt verhalten soll, das es simuliert.

npm kann transitive Abhängigkeiten nach `~/.openclaw/npm/node_modules` neben
das Plugin-Paket hoisten. OpenClaw scannt den verwalteten npm-Root, bevor der
Installation vertraut wird, und verwendet npm, um npm-verwaltete Pakete während der Deinstallation zu entfernen, sodass gehoistete
Laufzeitabhängigkeiten innerhalb der verwalteten Bereinigungsgrenze bleiben.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-
Abhängigkeit. OpenClaw lässt npm keine separate Registry-Kopie des
Host-Pakets in den verwalteten Root installieren, weil veraltete Host-Pakete die npm-
Peer-Auflösung bei späteren Plugin-Installationen beeinflussen können. Stattdessen stellt OpenClaw, nachdem npm
den gemeinsamen Root während Installation, Aktualisierung oder Deinstallation verändert hat, erneut
Plugin-lokale `node_modules/openclaw`-Links für installierte Pakete her, die
den Host-Peer deklarieren.

Git-Installationen klonen oder aktualisieren das Repository und führen dann aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird dann aus diesem Paketverzeichnis geladen, sodass die paketlokale
und übergeordnete `node_modules`-Auflösung genauso funktioniert wie bei einem normalen
Node-Paket.

## Lokale Plugins

Lokale Plugins werden als entwicklerkontrollierte Verzeichnisse behandelt. OpenClaw führt für sie kein
`npm install`, `pnpm install` und keine Abhängigkeitsreparatur aus. Wenn ein lokales
Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Lokale TypeScript-Plugins von Drittanbietern können den Notfall-Jiti-Pfad verwenden. Paketierte
JavaScript-Plugins und gebündelte interne Plugins werden über natives
import/require statt über Jiti geladen.

## Start und Neuladen

Gateway-Start und Konfigurations-Reload installieren niemals Plugin-Abhängigkeiten. Sie lesen
die Plugin-Installationsdatensätze, berechnen den Einstiegspunkt und laden ihn.

Wenn zur Laufzeit eine Abhängigkeit fehlt, kann das Plugin nicht geladen werden, und der Fehler
sollte den Betreiber auf eine explizite Korrektur hinweisen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kann alten von OpenClaw generierten Abhängigkeitszustand bereinigen und
herunterladbare Plugins wiederherstellen, die in den lokalen Installationsdatensätzen fehlen, wenn die Konfiguration
auf sie verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes
lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und core-kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert.
Sie sollten entweder keinen schweren Laufzeit-Abhängigkeitsbaum haben oder in ein
herunterladbares Paket auf ClawHub/npm ausgelagert werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert,
extern installiert oder nur als Quellcode behalten werden, finden Sie im [Plugin-Bestand](/de/plugins/plugin-inventory).

Gebündelte Plugin-Manifeste dürfen kein Abhängigkeits-Staging anfordern. Große oder optionale
Plugin-Funktionalität sollte als normales Plugin paketiert und über
denselben npm-/Git-/ClawHub-Pfad wie Drittanbieter-Plugins installiert werden.

In Quell-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach
`pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale
Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Die Entwicklung in Quell-
Checkouts ist ausschließlich pnpm-basiert; ein einfaches `npm install` im Repository-Root ist
keine unterstützte Methode, um gebündelte Plugin-Abhängigkeiten vorzubereiten.

| Installationsform                 | Speicherort des gebündelten Plugins   | Eigentümer der Abhängigkeiten                                        |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`         | Gebauter Laufzeitbaum im Paket        | OpenClaw-Paket und explizite Plugin-Installations-/Aktualisierungs-/Doctor-Abläufe |
| Git-Checkout plus `pnpm install`  | `extensions/<id>`-Workspace-Pakete    | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`    | Verwalteter npm-/Git-/ClawHub-Plugin-Root | Der Plugin-Installations-/Aktualisierungsablauf                      |

## Bereinigung von Altlasten

Ältere OpenClaw-Versionen erzeugten Roots für Abhängigkeiten gebündelter Plugins beim Start oder
während der Doctor-Reparatur. Die aktuelle Doctor-Bereinigung entfernt diese veralteten Verzeichnisse und
Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Roots, globaler
Node-Präfix-Paketsymlinks, die auf bereinigte `plugin-runtime-deps`-Ziele zeigen,
`.openclaw-runtime-deps*`-Manifeste, generierte Plugin-`node_modules`, Installations-
Staging-Verzeichnisse und paketlokale pnpm-Stores. Paketiertes Postinstall entfernt außerdem
diese globalen Symlinks, bevor die alten Ziel-Roots bereinigt werden, damit Upgrades
keine verwaisten ESM-Paketimporte hinterlassen.

Diese Pfade sind ausschließlich alte Überreste. Neue Installationen sollten sie nicht erzeugen.

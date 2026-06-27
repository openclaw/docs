---
read_when:
    - Sie debuggen Installationen von Plugin-Paketen
    - Sie ändern das Plugin-Startverhalten, das doctor-Verhalten oder das Installationsverhalten des Paketmanagers
    - Sie pflegen paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-06-27T17:48:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw erledigt Arbeiten an Plugin-Abhängigkeiten während Installation/Aktualisierung. Das Laden zur Laufzeit
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und verändert nicht das OpenClaw-
Paketverzeichnis.

## Aufteilung der Verantwortlichkeiten

Plugin-Pakete besitzen ihren Abhängigkeitsgraphen:

- Laufzeitabhängigkeiten liegen in `dependencies` oder
  `optionalDependencies` des Plugin-Pakets
- SDK-/Core-Importe sind Peer-Importe oder von OpenClaw bereitgestellte Importe
- lokale Entwicklungs-Plugins bringen ihre eigenen bereits installierten Abhängigkeiten mit
- npm- und git-Plugins werden in Paket-Roots installiert, die OpenClaw besitzt

OpenClaw besitzt nur den Plugin-Lebenszyklus:

- die Plugin-Quelle ermitteln
- das Paket installieren oder aktualisieren, wenn dies explizit angefordert wird
- die Installationsmetadaten aufzeichnen
- den Plugin-Einstiegspunkt laden
- mit einem handlungsorientierten Fehler fehlschlagen, wenn Abhängigkeiten fehlen

## Installations-Roots

OpenClaw verwendet stabile Roots pro Quelle:

- npm-Pakete werden in projektspezifische Projekte unter
  `~/.openclaw/npm/projects/<encoded-package>` installiert
- git-Pakete werden unter `~/.openclaw/git` geklont
- lokale/Pfad-/Archiv-Installationen werden ohne Abhängigkeitsreparatur kopiert oder referenziert

npm-Installationen laufen in diesem projektspezifischen Root mit:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` verwendet denselben projektspezifischen npm-
Projekt-Root für einen lokalen npm-pack-Tarball. OpenClaw liest die npm-
Metadaten des Tarballs, fügt ihn dem verwalteten Projekt als kopierte `file:`-Abhängigkeit hinzu, führt
die normale npm-Installation aus und prüft anschließend die installierten Lockfile-Metadaten, bevor
dem Plugin vertraut wird.
Dies ist für Paketakzeptanz- und Release-Candidate-Nachweise gedacht, bei denen ein
lokales Pack-Artefakt sich wie das Registry-Artefakt verhalten soll, das es simuliert.

npm kann transitive Abhängigkeiten in das `node_modules` des projektspezifischen Projekts
neben dem Plugin-Paket hoisten. OpenClaw scannt den verwalteten Projekt-
Root, bevor der Installation vertraut wird, und entfernt dieses Projekt bei der Deinstallation, sodass
gehoistete Laufzeitabhängigkeiten innerhalb der Bereinigungsgrenze dieses Plugins bleiben.

Veröffentlichte npm-Plugin-Pakete können `npm-shrinkwrap.json` ausliefern. npm verwendet dieses
veröffentlichbare Lockfile während der Installation, und der von OpenClaw verwaltete npm-Projekt-Root
unterstützt es über den normalen npm-Installationspfad. Veröffentlichbare
Plugin-Pakete im Besitz von OpenClaw müssen ein paketlokales Shrinkwrap enthalten, das aus dem
veröffentlichten Abhängigkeitsgraphen dieses Plugin-Pakets erzeugt wurde:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Der Generator entfernt Plugin-`devDependencies`, wendet die Workspace-Override-
Richtlinie an und schreibt `extensions/<id>/npm-shrinkwrap.json` für jedes
`publishToNpm`-Plugin. Drittanbieter-Plugin-Pakete können ebenfalls Shrinkwrap ausliefern;
OpenClaw verlangt dies nicht für Community-Pakete, aber npm berücksichtigt es,
wenn es vorhanden ist.

npm-Plugin-Pakete im Besitz von OpenClaw können auch mit expliziten
`bundledDependencies` veröffentlicht werden. Der npm-Veröffentlichungspfad überlagert die Liste der Laufzeitabhängigkeitsnamen, entfernt reine Entwicklungs-Workspace-Metadaten aus dem veröffentlichten Paket-
Manifest, führt eine skriptfreie npm-Installation für paketlokale Laufzeit-
Abhängigkeiten aus und packt oder veröffentlicht anschließend den Plugin-Tarball mit diesen Abhängigkeits-
Dateien. Pakete mit vielen nativen Komponenten, einschließlich Codex- und ACP-Laufzeiten, optieren mit
`openclaw.release.bundleRuntimeDependencies: false` aus; diese Pakete liefern weiterhin
ihr Shrinkwrap aus, aber npm löst Laufzeitabhängigkeiten während der Installation auf,
statt jede Plattform-Binärdatei in den Plugin-Tarball einzubetten. Das Root-
Paket `openclaw` bündelt nicht seinen vollständigen Abhängigkeitsbaum.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-
Abhängigkeit. OpenClaw lässt npm keine separate Registry-Kopie des
Host-Pakets in ein verwaltetes Projekt installieren, weil veraltete Host-Pakete die npm-
Peer-Auflösung innerhalb dieses Plugins beeinflussen können. Verwaltete npm-Installationen überspringen die npm-Peer-
Auflösung/Materialisierung, und OpenClaw setzt nach Installation oder Aktualisierung erneut Plugin-lokale
`node_modules/openclaw`-Links für installierte Pakete durch, die den Host-Peer deklarieren.

git-Installationen klonen oder aktualisieren das Repository und führen dann aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird dann aus diesem Paketverzeichnis geladen, sodass paketlokale
und übergeordnete `node_modules`-Auflösung genauso funktioniert wie bei einem normalen
Node-Paket.

## Lokale Plugins

Lokale Plugins werden als vom Entwickler kontrollierte Verzeichnisse behandelt. OpenClaw führt für sie kein
`npm install`, `pnpm install` und keine Abhängigkeitsreparatur aus. Wenn ein lokales
Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Lokale TypeScript-Plugins von Drittanbietern können den Notfallpfad über Jiti verwenden. Paketierte
JavaScript-Plugins und gebündelte interne Plugins werden über natives
import/require statt über Jiti geladen.

## Start und Neuladen

Gateway-Start und Konfigurations-Neuladen installieren niemals Plugin-Abhängigkeiten. Sie lesen
die Plugin-Installationsdatensätze, berechnen den Einstiegspunkt und laden ihn.

Wenn zur Laufzeit eine Abhängigkeit fehlt, schlägt das Laden des Plugins fehl, und der Fehler
sollte den Betreiber auf eine explizite Behebung hinweisen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kann alte von OpenClaw erzeugte Abhängigkeitszustände bereinigen und
herunterladbare Plugins wiederherstellen, die in den lokalen Installationsdatensätzen fehlen, obwohl die Konfiguration
auf sie verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes
lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und für den Core kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert.
Sie sollten entweder keinen schweren Laufzeit-Abhängigkeitsbaum haben oder in ein
herunterladbares Paket auf ClawHub/npm ausgelagert werden.

Die aktuell generierte Liste der Plugins, die im Core-Paket ausgeliefert, extern
installiert oder nur im Quellcode verbleiben, finden Sie unter [Plugin-Inventar](/de/plugins/plugin-inventory).

Gebündelte Plugin-Manifeste dürfen kein Abhängigkeits-Staging anfordern. Große oder optionale
Plugin-Funktionalität sollte als normales Plugin paketiert und über
denselben npm/git/ClawHub-Pfad wie Drittanbieter-Plugins installiert werden.

In Quellcode-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach
`pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale
Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Entwicklung in einem Quellcode-
Checkout ist ausschließlich pnpm-basiert; ein einfaches `npm install` im Repository-Root ist
kein unterstützter Weg, um Abhängigkeiten gebündelter Plugins vorzubereiten.

| Installationsform                 | Speicherort gebündelter Plugins       | Eigentümer der Abhängigkeiten                                        |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`         | Gebauter Laufzeitbaum im Paket        | OpenClaw-Paket und explizite Plugin-Installations-/Aktualisierungs-/Doctor-Flows |
| Git-Checkout plus `pnpm install`  | `extensions/<id>`-Workspace-Pakete    | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`    | Verwaltetes npm-Projekt/git/ClawHub-Root | Der Plugin-Installations-/Aktualisierungs-Flow                      |

## Bereinigung von Altlasten

Ältere OpenClaw-Versionen erzeugten Abhängigkeits-Roots für gebündelte Plugins beim Start oder
während einer Doctor-Reparatur. Die aktuelle Doctor-Bereinigung entfernt diese veralteten Verzeichnisse und
Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Roots, globaler
Node-Präfix-Paket-Symlinks, die auf bereinigte `plugin-runtime-deps`-Ziele zeigen,
`.openclaw-runtime-deps*`-Manifeste, erzeugte Plugin-`node_modules`, Installations-
Staging-Verzeichnisse und paketlokale pnpm-Stores. Das paketierte Postinstall entfernt außerdem
diese globalen Symlinks, bevor die alten Ziel-Roots bereinigt werden, damit Upgrades
keine dangling ESM-Paketimporte zurücklassen.

Ältere npm-Installationen verwendeten außerdem einen gemeinsamen `~/.openclaw/npm/node_modules`-Root.
Aktuelle Installations-, Aktualisierungs-, Deinstallations- und Doctor-Flows erkennen diesen alten
flachen Root weiterhin nur für Wiederherstellung und Bereinigung. Neue npm-Installationen sollten stattdessen
pro Plugin eigene Projekt-Roots erstellen.

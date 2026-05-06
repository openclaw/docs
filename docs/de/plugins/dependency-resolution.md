---
read_when:
    - Sie beheben Fehler bei Plugin-Paketinstallationen
    - Sie ändern das Verhalten beim Plugin-Start, bei doctor oder bei der Installation über den Paketmanager
    - Sie pflegen paketierte OpenClaw-Installationen oder gebündelte Plugin-Manifeste
sidebarTitle: Dependencies
summary: Wie OpenClaw Plugin-Pakete installiert und Plugin-Abhängigkeiten auflöst
title: Auflösung von Plugin-Abhängigkeiten
x-i18n:
    generated_at: "2026-05-06T19:35:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw erledigt Arbeiten an Plugin-Abhängigkeiten zur Installations-/Aktualisierungszeit. Das Laden zur Laufzeit
führt keine Paketmanager aus, repariert keine Abhängigkeitsbäume und verändert nicht das OpenClaw-
Paketverzeichnis.

## Aufteilung der Verantwortlichkeiten

Plugin-Pakete sind für ihren Abhängigkeitsgraphen verantwortlich:

- Laufzeitabhängigkeiten befinden sich in `dependencies` oder
  `optionalDependencies` des Plugin-Pakets
- SDK-/Core-Importe sind Peer- oder von OpenClaw bereitgestellte Importe
- lokale Entwicklungs-Plugins bringen ihre bereits installierten Abhängigkeiten selbst mit
- npm- und git-Plugins werden in OpenClaw-eigene Paket-Roots installiert

OpenClaw ist nur für den Plugin-Lebenszyklus verantwortlich:

- die Plugin-Quelle ermitteln
- das Paket installieren oder aktualisieren, wenn dies ausdrücklich angefordert wird
- die Installationsmetadaten aufzeichnen
- den Plugin-Einstiegspunkt laden
- mit einem handlungsorientierten Fehler fehlschlagen, wenn Abhängigkeiten fehlen

## Installations-Roots

OpenClaw verwendet stabile Roots pro Quelle:

- npm-Pakete werden unter `~/.openclaw/npm` installiert
- git-Pakete werden unter `~/.openclaw/git` geklont
- lokale/Pfad-/Archivinstallationen werden ohne Abhängigkeitsreparatur kopiert oder referenziert

npm-Installationen laufen im npm-Root mit:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` verwendet denselben verwalteten npm-Root
für einen lokalen npm-pack-Tarball. OpenClaw liest die npm-Metadaten des Tarballs, fügt ihn
dem verwalteten Root als kopierte `file:`-Abhängigkeit hinzu, führt die normale npm-Installation aus
und verifiziert anschließend die Metadaten der installierten Lockfile, bevor dem Plugin vertraut wird.
Dies ist für Paketakzeptanz- und Release-Candidate-Nachweise vorgesehen, bei denen ein
lokales Pack-Artefakt sich wie das simulierte Registry-Artefakt verhalten soll.

npm kann transitive Abhängigkeiten nach `~/.openclaw/npm/node_modules` neben
das Plugin-Paket hoisten. OpenClaw scannt den verwalteten npm-Root, bevor der
Installation vertraut wird, und verwendet npm, um npm-verwaltete Pakete bei der Deinstallation zu entfernen, sodass gehoistete
Laufzeitabhängigkeiten innerhalb der verwalteten Bereinigungsgrenze bleiben.

Plugins, die `openclaw/plugin-sdk/*` importieren, deklarieren `openclaw` als Peer-
Abhängigkeit. OpenClaw lässt npm keine separate Registry-Kopie des
Host-Pakets in den verwalteten Root installieren, da veraltete Host-Pakete die npm-
Peer-Auflösung bei späteren Plugin-Installationen beeinflussen können. Verwaltete npm-Installationen überspringen die npm-Peer-
Auflösung/-Materialisierung für den gemeinsam genutzten Root, und OpenClaw stellt nach Installationen, Aktualisierungen oder Deinstallationen erneut
Plugin-lokale `node_modules/openclaw`-Links für installierte Pakete her, die
den Host-Peer deklarieren.

git-Installationen klonen oder aktualisieren das Repository und führen dann aus:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Das installierte Plugin wird dann aus diesem Paketverzeichnis geladen, sodass paketlokale
und übergeordnete `node_modules`-Auflösung genauso funktioniert wie bei einem normalen
Node-Paket.

## Lokale Plugins

Lokale Plugins werden als entwicklerkontrollierte Verzeichnisse behandelt. OpenClaw führt für sie kein
`npm install`, `pnpm install` und keine Abhängigkeitsreparatur aus. Wenn ein lokales
Plugin Abhängigkeiten hat, installieren Sie diese in diesem Plugin, bevor Sie es laden.

Lokale Drittanbieter-Plugins in TypeScript können den Notfallpfad über Jiti verwenden. Paketierte
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

`doctor --fix` kann veralteten von OpenClaw erzeugten Abhängigkeitsstatus bereinigen und
downloadbare Plugins wiederherstellen, die in den lokalen Installationsdatensätzen fehlen, wenn die Konfiguration
auf sie verweist. Doctor repariert keine Abhängigkeiten für ein bereits installiertes
lokales Plugin.

## Gebündelte Plugins

Leichtgewichtige und core-kritische gebündelte Plugins werden als Teil von OpenClaw ausgeliefert.
Sie sollten entweder keinen umfangreichen Laufzeit-Abhängigkeitsbaum haben oder in ein
downloadbares Paket auf ClawHub/npm ausgelagert werden.

Die aktuelle generierte Liste der Plugins, die im Core-Paket ausgeliefert, extern
installiert oder nur als Quellcode geführt werden, finden Sie unter [Plugin-Inventar](/de/plugins/plugin-inventory).

Manifeste gebündelter Plugins dürfen kein Dependency Staging anfordern. Große oder optionale
Plugin-Funktionalität sollte als normales Plugin paketiert und über
denselben npm-/git-/ClawHub-Pfad wie Drittanbieter-Plugins installiert werden.

In Source-Checkouts behandelt OpenClaw das Repository als pnpm-Monorepo. Nach
`pnpm install` werden gebündelte Plugins aus `extensions/<id>` geladen, sodass paketlokale
Workspace-Abhängigkeiten verfügbar sind und Änderungen direkt übernommen werden. Entwicklung in Source-
Checkouts ist nur mit pnpm unterstützt; ein einfaches `npm install` im Repository-Root ist
keine unterstützte Methode, um Abhängigkeiten gebündelter Plugins vorzubereiten.

| Installationsform                | Speicherort gebündelter Plugins       | Verantwortlicher für Abhängigkeiten                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebauter Laufzeitbaum im Paket        | OpenClaw-Paket und explizite Plugin-Installations-/Aktualisierungs-/Doctor-Abläufe |
| Git-Checkout plus `pnpm install` | `extensions/<id>`-Workspace-Pakete    | Der pnpm-Workspace, einschließlich der eigenen Abhängigkeiten jedes Plugin-Pakets |
| `openclaw plugins install ...`   | Verwalteter npm-/git-/ClawHub-Plugin-Root | Der Plugin-Installations-/Aktualisierungsablauf                     |

## Bereinigung von Altlasten

Ältere OpenClaw-Versionen erzeugten Abhängigkeits-Roots für gebündelte Plugins beim Start oder
während der Doctor-Reparatur. Die aktuelle Doctor-Bereinigung entfernt diese veralteten Verzeichnisse und
Symlinks, wenn `--fix` verwendet wird, einschließlich alter `plugin-runtime-deps`-Roots, globaler
Node-Präfix-Paket-Symlinks, die auf bereinigte `plugin-runtime-deps`-Ziele zeigen,
`.openclaw-runtime-deps*`-Manifeste, erzeugter Plugin-`node_modules`, Installations-
Stage-Verzeichnisse und paketlokaler pnpm-Stores. Das paketierte Postinstall entfernt außerdem
diese globalen Symlinks, bevor die Legacy-Ziel-Roots bereinigt werden, damit Upgrades
keine verwaisten ESM-Paketimporte hinterlassen.

Diese Pfade sind ausschließlich Legacy-Überreste. Neue Installationen sollten sie nicht erstellen.

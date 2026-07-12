---
read_when:
    - Sie validieren die Bereinigung der Leistung und Paketgröße vom Mai 2026
    - Sie benötigen die Zahlen hinter dem Blogbeitrag zur Performance und zu den Abhängigkeiten von OpenClaw
    - Sie ändern Release-Gates, Paket-Shrinkwrap oder Abhängigkeitsgrenzen von Plugins
summary: Visuelle Zusammenfassung und technische Nachweise für die Bereinigung von Performance, Paketgröße, Abhängigkeiten und Shrinkwrap im Mai 2026
title: Performanceprüfung für die Veröffentlichung
x-i18n:
    generated_at: "2026-07-12T02:08:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Diese Seite dokumentiert die Nachweise für die im Mai 2026 durchgeführte Bereinigung von OpenClaw hinsichtlich Leistung, Paketgröße, Abhängigkeiten und Shrinkwrap. Sie ist die technische Ergänzung zum öffentlichen Blogbeitrag.

Hier werden zwei Audits zusammengeführt:

- **Leistungsprüfung der Releases:** GitHub Releases von `v2026.5.28` zurück bis zum stabilen Release `v2026.4.23`, unter Verwendung des Workflows `OpenClaw Performance`, `profile=smoke` und des Mock-Provider-Testpfads. Die meisten Tag-Zeilen basieren auf einer einzelnen Messung; die Zeilen für `v2026.5.27` und `v2026.5.28` verwenden die neuesten, dreimal wiederholten Artefakte des Release-Branches.
- **Früherer April-Kontext:** veröffentlichte Mock-Provider-Baselines aus `clawgrit-reports` von `v2026.4.1` bis `v2026.5.2`, die ausschließlich verhindern sollen, dass die fehlerhaften Releases von Ende April als öffentliche Leistungsbaseline behandelt werden.
- **Prüfung des Installationsumfangs:** frische Installationen mit `npm install --ignore-scripts` in temporären Paketen, wobei `du -sk node_modules` die Größe ermittelt und eine Durchsuchung von `node_modules` die Anzahl der Paketinstanzen bestimmt.
- **Prüfung der npm-Paketgröße:** `npm pack openclaw@<version> --dry-run --json` für veröffentlichte Releases; erfasst wurden die Größe des komprimierten Tarballs, die entpackte Größe und die Dateianzahl.

<Warning>
Die zentrale Leistungsprüfung verwendet pro Tag eine Smoke-Messung. Ausgenommen sind die Zeilen für `v2026.5.27` und `v2026.5.28`, die die neuesten, dreimal wiederholten Artefakte des Release-Branches verwenden. Der frühere April-Kontext verwendet veröffentlichte Mediane aus drei Wiederholungen von `clawgrit-reports`. Betrachten Sie die Zahlen als Nachweise für Trends und als Hinweise für die Suche nach Regressionen, nicht als Statistiken für Release-Prüfkriterien.
</Warning>

## Übersicht

Leistungsabdeckung: **77 angeforderte Releases**, **74 durch Artefakte belegte Messpunkte** und **3 nicht verfügbare CI-Läufe**. Neuester gemessener stabiler Stand: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stable agent turn" icon="gauge">
    **5,1-mal schnellerer kalter Agent-Durchlauf**

    - `v2026.4.14`: 9,8 s
    - `v2026.5.28`: 1,9 s

  </Card>
  <Card title="Published package" icon="package">
    **17,9-MB-Tarball**

    Neuestes stabiles Paket, reduziert gegenüber dem Höchststand der Paketgröße von 43,3 MB im März.

  </Card>
  <Card title="Latest stable install" icon="hard-drive">
    **361,7 MiB für eine frische Installation**

    Reduziert den verschachtelten OpenClaw-Abhängigkeitsbaum deutlich gegenüber dem Höchststand bei der Einführung von Shrinkwrap in `2026.5.22`; im lokalen Installationsaudit verbleibt jedoch weiterhin ein kleinerer verschachtelter Baum mit 259,7 MiB.

  </Card>
  <Card title="Dependency graph" icon="boxes">
    **300 installierte Pakete**

    Gemessen als eindeutige Wurzeln aus Paketname und Version in einer frischen Installation mit deaktivierten Skripten; 71 Wurzeln weniger als beim vorherigen stabilen Release.

  </Card>
</CardGroup>

## Änderungen in 5.28

Die Bereinigung zwischen `v2026.5.27` und `v2026.5.28` verkleinerte den Abhängigkeitsgraphen der Standardinstallation, anstatt die Funktionen selbst zu entfernen.

<CardGroup cols={2}>
  <Card title="Root default graph" icon="git-branch">
    Die Anzahl eindeutiger Wurzeln aus Paketname und Version sank von **371** auf **300**. Die Anzahl der Paketinstanzen sank von **372** auf **301**.
  </Card>
  <Card title="Nested tree" icon="unplug">
    Das verschachtelte `openclaw/node_modules` sank im selben lokalen Installationsaudit von **656,1 MiB** auf **259,7 MiB**.
  </Card>
  <Card title="Native optional cones" icon="cpu">
    Der plattformübergreifende native Paket-Abhängigkeitskegel von `@napi-rs/canvas` wurde nicht mehr in der Standardinstallation installiert.
  </Card>
  <Card title="Supply-chain surface" icon="shield">
    Weniger Standardpakete bedeuten weniger Tarballs, Maintainer, native Binärdateien, Installationsverhalten und transitive Aktualisierungspfade, denen standardmäßig vertraut werden muss.
  </Card>
</CardGroup>

<Tip>
Shrinkwrap war nicht an sich das Problem. Die ungünstige Paketstruktur war es. `v2026.5.28` enthält weiterhin Shrinkwrap, aber der verschachtelte Abhängigkeitsbaum ist wesentlich kleiner und die plattformübergreifende Canvas-Auffächerung ist im lokalen Audit verschwunden.
</Tip>

## Wichtigste Zahlen

Verwenden Sie die fehlerhaften Zeilen von Ende April nicht als öffentliche Leistungsbaselines. `v2026.4.23` und `v2026.4.29` liefern nützliche Nachweise für Regressionen, aber die großen Abweichungen im Stil von `14x` beschreiben hauptsächlich die Erholung von einer fehlerhaften Release-Reihe.

Verwenden Sie für die Darstellung im Blog die veröffentlichte Baseline von Anfang April als Größenordnung. Die Baseline ist `v2026.4.14` aus dem veröffentlichten Mock-Provider-Lauf von `clawgrit-reports` mit drei Wiederholungen. Dieser Lauf schlug nur fehl, weil die Diagnose-Zeitleiste nicht ausgegeben wurde; die Mediane für kalte und warme Durchläufe sowie RSS sind daher weiterhin als grobe Größenordnung nützlich. Betrachten Sie dies als erzählerischen Kontext und nicht als Statistik für ein Release-Prüfkriterium.

| Metrik                    | Baseline von Anfang April | `v2026.5.28` |                          Abweichung |
| ------------------------- | ------------------------: | -----------: | ---------------------------------: |
| Kalter Agent-Durchlauf    |                   9,819ms |      1,908ms | 80,6 % niedriger, 5,1-mal schneller |
| Warmer Agent-Durchlauf    |                   7,458ms |      1,870ms | 74,9 % niedriger, 4,0-mal schneller |
| Maximaler Agent-RSS       |                   686.2MB |      581.0MB |                    15,3 % niedriger |

Innerhalb der Mai-Prüfung verbesserte sich die neueste Zeile des Release-Branches gegenüber `v2026.5.2` deutlich:

| Metrik                 | `v2026.5.2` | `v2026.5.28` |       Abweichung |
| ---------------------- | ----------: | -----------: | ----------------: |
| Kalter Agent-Durchlauf |     3,897ms |      1,908ms | 51,0 % niedriger |
| Warmer Agent-Durchlauf |     3,610ms |      1,870ms | 48,2 % niedriger |
| Maximaler Agent-RSS    |     613.7MB |      581.0MB |  5,3 % niedriger |

Im Vergleich zum vorherigen stabilen Release:

| Metrik                 | `v2026.5.27` | `v2026.5.28` |       Abweichung |
| ---------------------- | -----------: | -----------: | ----------------: |
| Kalter Agent-Durchlauf |      2,231ms |      1,908ms | 14,5 % niedriger |
| Warmer Agent-Durchlauf |      2,226ms |      1,870ms | 16,0 % niedriger |
| Maximaler Agent-RSS    |      649.0MB |      581.0MB | 10,5 % niedriger |

### Installationsumfang

| Metrik                                                  |  Baseline | `v2026.5.28` |       Abweichung |
| ------------------------------------------------------- | --------: | -----------: | ----------------: |
| Installationsgröße gegenüber dem Höchststand `2026.5.22` | 1,020.6MB |     361.7MiB | 64,6 % niedriger |
| Installationsgröße gegenüber dem letzten Release `2026.5.27` |  767.1MiB |     361.7MiB | 52,8 % niedriger |
| Abhängigkeiten gegenüber dem Monatshöchststand `2026.2.26` |       645 |          300 | 53,5 % niedriger |
| Abhängigkeiten gegenüber dem letzten Release `2026.5.27` |       371 |          300 | 19,1 % niedriger |
| Verschachteltes `openclaw/node_modules` gegenüber `2026.5.22` |   911.8MB |     259.7MiB | 71,5 % niedriger |
| Verschachteltes `openclaw/node_modules` gegenüber `2026.5.27` |  656.1MiB |     259.7MiB | 60,4 % niedriger |

### npm-Paketgröße

| Version     | Komprimierter Tarball | Entpacktes Paket | Dateien | Hinweise                                      |
| ----------- | --------------------: | ---------------: | ------: | --------------------------------------------- |
| `2026.1.30` |                12.8MB |           33.5MB |   4,607 | frühes Paket nach der Umbenennung             |
| `2026.2.26` |                23.6MB |           82.9MB |  10,125 | Funktionszuwachs                              |
| `2026.3.31` |                43.3MB |          182.6MB |  21,037 | Höchststand der Paketgröße                    |
| `2026.4.29` |                22.9MB |           74.6MB |   9,309 | Paketbereinigung sichtbar                     |
| `2026.5.12` |                23.4MB |           80.1MB |  12,035 | umfangreiche Auslagerung externer Plugins     |
| `2026.5.22` |                17.2MB |           76.9MB |  12,386 | Dokumentation und Assets vom Paket ausgeschlossen |
| `2026.5.27` |                17.8MB |           79.0MB |  12,509 | vorheriges stabiles Paket                     |
| `2026.5.28` |                17.9MB |           81.0MB |   9,082 | neuestes stabiles Paket                       |

`2026.5.12` ist der im Changelog sichtbare Meilenstein der Plugin-Auslagerung: Amazon Bedrock, Bedrock Mantle, Slack, OpenShell Sandbox, Anthropic Vertex, Matrix und WhatsApp wurden aus dem Abhängigkeitspfad des Kerns entfernt, sodass ihre Abhängigkeitskegel zusammen mit diesen Plugins installiert werden und nicht mehr bei jeder Kerninstallation.

## Zusammenfassung der Kova-Agent-Durchläufe

Die stabile Release-Reihe vom April enthält zwei unterschiedliche Entwicklungen. Anfang April war sie langsam, aber noch nachvollziehbar. Ende April kam es zu einem massiven Regressionseinbruch. Bei `v2026.5.2` fällt der Mock-Provider-Testpfad erstmals in den Bereich von 3 bis 5 Sekunden und besteht in der bereitgestellten Prüfung anschließend durchgehend.

Früherer veröffentlichter Kontext:

| Release      | Kova          | Kalter Durchlauf | Warmer Durchlauf | Maximaler Agent-RSS |
| ------------ | ------------- | ---------------: | ---------------: | ------------------: |
| `v2026.4.10` | FEHLGESCHLAGEN |         11,031ms |          7,962ms |             679.0MB |
| `v2026.4.12` | FEHLGESCHLAGEN |         11,965ms |          8,289ms |             713.5MB |
| `v2026.4.14` | FEHLGESCHLAGEN |          9,819ms |          7,458ms |             686.2MB |
| `v2026.4.20` | FEHLGESCHLAGEN |         22,314ms |         18,811ms |             810.8MB |
| `v2026.4.22` | FEHLGESCHLAGEN |          9,630ms |          7,459ms |             743.0MB |

Bereitgestellte Prüfung:

| Release             | Kova          | Kalter Durchlauf | Warmer Durchlauf | Maximaler Agent-RSS |
| ------------------- | ------------- | ---------------: | ---------------: | ------------------: |
| `v2026.4.23`        | FEHLGESCHLAGEN |         47,847ms |          8,010ms |           1,082.7MB |
| `v2026.4.24`        | FEHLGESCHLAGEN |         48,264ms |         25,483ms |             996.0MB |
| `v2026.4.25`        | FEHLGESCHLAGEN |         81,080ms |         59,172ms |           1,113.9MB |
| `v2026.4.26`        | FEHLGESCHLAGEN |         76,771ms |         54,941ms |           1,140.8MB |
| `v2026.4.27`        | FEHLGESCHLAGEN |         60,902ms |         33,699ms |           1,156.0MB |
| `v2026.4.29`        | FEHLGESCHLAGEN |         94,031ms |         57,334ms |           3,613.7MB |
| `v2026.5.2`         | BESTANDEN      |          3,897ms |          3,610ms |             613.7MB |
| `v2026.5.7`         | BESTANDEN      |          3,923ms |          3,693ms |             654.1MB |
| `v2026.5.12`        | BESTANDEN      |          7,248ms |          6,629ms |             834.8MB |
| `v2026.5.18`        | BESTANDEN      |          3,301ms |          2,913ms |             630.3MB |
| `v2026.5.20`        | BESTANDEN      |          3,413ms |          2,952ms |             643.2MB |
| `v2026.5.22`        | BESTANDEN      |          4,494ms |          4,093ms |             654.3MB |
| `v2026.5.26`        | BESTANDEN      |          2,626ms |          2,282ms |             660.4MB |
| `v2026.5.27-beta.1` | BESTANDEN      |          2,575ms |          2,217ms |             635.3MB |
| `v2026.5.27`        | BESTANDEN      |          2,231ms |          2,226ms |             649.0MB |
| `v2026.5.28`        | BESTANDEN      |          1,908ms |          1,870ms |             581.0MB |

## Quellcode-Messungen

Quellcode-Messungen wurden für 17 erfolgreiche ältere Referenzen übersprungen, da diese Quellbäume noch nicht über die erforderlichen Mess-Einstiegspunkte verfügten. Für diese Referenzen sind weiterhin Metriken zu Agent-Durchläufen vorhanden.

Repräsentative Quellcode-Messpunkte:

| Release             | Standard-`readyz` p50 | 50 Plugins, `readyz` p50 | CLI-Zustand p50 | Maximaler Plugin-RSS |
| ------------------- | ---------------------: | -----------------------: | ---------------: | -------------------: |
| `v2026.4.29`        |                2,819ms |                  2,618ms |          1,679ms |              389.0MB |
| `v2026.5.2`         |                2,324ms |                  2,013ms |          1,384ms |              377.2MB |
| `v2026.5.7`         |                1,649ms |                  1,540ms |          1,175ms |              387.6MB |
| `v2026.5.18`        |                1,942ms |                  1,927ms |            607ms |              426.5MB |
| `v2026.5.20`        |                1,966ms |                  1,987ms |            621ms |              455.0MB |
| `v2026.5.22`        |                2,081ms |                  1,884ms |          5,095ms |              444.2MB |
| `v2026.5.26`        |                1,546ms |                  1,634ms |            656ms |              400.4MB |
| `v2026.5.27-beta.1` |                1,462ms |                  1,548ms |            548ms |              394.0MB |
| `v2026.5.27`        |                1,491ms |                  1,571ms |            553ms |              401.5MB |
| `v2026.5.28`        |                1,457ms |                  1,474ms |            623ms |              386.1MB |

Der Ausschlag beim CLI-Zustand in `v2026.5.22` ist in dieser Tabelle sichtbar, obwohl der Testpfad für Agent-Durchläufe weiterhin bestanden wurde. Behalten Sie die Quellcode-Messungen bei, wenn Sie gezielte CLI- oder Gateway-Regressionen untersuchen.

## Audit des Installationsumfangs

Die Abhängigkeitsstichproben verwenden ein stabiles Release pro Monat sowie das Ereignis der Shrinkwrap-Einführung in `2026.5.22` und das neueste Release `2026.5.28`.

| Zeitpunkt              | Installierte Abhängigkeiten | Neuinstallation | OpenClaw-Paket | Verschachteltes `openclaw/node_modules` | Root-Shrinkwrap | Canvas-Installationsverhalten                          |
| ---------------------- | --------------------------: | --------------: | -------------: | --------------------------------------: | --------------- | ------------------------------------------------------ |
| Jan. `2026.1.30`       |                         605 |         438.4MB |         45.8MB |                                   2.4MB | nein            | Wrapper auf oberster Ebene + `darwin-arm64`            |
| Feb. `2026.2.26`       |                         645 |         575.7MB |        110.1MB |                                   3.5MB | nein            | Wrapper auf oberster Ebene + `darwin-arm64`            |
| März `2026.3.31`       |                         438 |         584.1MB |        234.8MB |                                     0MB | nein            | Wrapper auf oberster Ebene + `darwin-arm64`            |
| Apr. `2026.4.29`       |                         392 |         335.0MB |         97.4MB |                                     0MB | nein            | nichts installiert                                     |
| `2026.5.22`            |                         401 |       1,020.6MB |      1,020.4MB |                                 911.8MB | ja              | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete        |
| Mai `2026.5.26`        |                         371 |         767.5MB |        767.4MB |                                 656.4MB | ja              | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete        |
| `2026.5.27`            |                         371 |        767.1MiB |       766.9MiB |                                656.1MiB | ja              | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete        |
| Aktuell `2026.5.28`    |                         300 |        361.7MiB |       361.6MiB |                                259.7MiB | ja              | nichts installiert                                     |

### Shrinkwrap-Grenze

`2026.5.20` wurde ohne Root-Shrinkwrap und ohne großen verschachtelten
OpenClaw-Abhängigkeitsbaum ausgeliefert. Mit `2026.5.22` wurde Root-Shrinkwrap
eingeführt und 911.8MB wurden unter dem verschachtelten
`openclaw/node_modules` installiert. `2026.5.28` behält Shrinkwrap bei und
installiert weiterhin 259.7MiB unter dem verschachtelten
`openclaw/node_modules`, installiert bei der lokalen Prüfung einer
Neuinstallation jedoch keine `@napi-rs/canvas`-Pakete mehr.

Die Untersuchung der veröffentlichten Tarballs bestätigt die Grenze:

| Version     | Stabil veröffentlicht? | Root-`npm-shrinkwrap.json` | Hinweise                                        |
| ----------- | ----------------------- | -------------------------- | ----------------------------------------------- |
| `2026.5.20` | ja                      | nein                       | letzte stabile Version vor Shrinkwrap           |
| `2026.5.21` | nein                    | nicht zutreffend           | keine stabile npm-Version                       |
| `2026.5.22` | ja                      | ja                         | Shrinkwrap eingeführt                           |
| `2026.5.23` | nein                    | nicht zutreffend           | keine stabile npm-Version                       |
| `2026.5.24` | nein                    | nicht zutreffend           | keine stabile npm-Version                       |
| `2026.5.25` | nein                    | nicht zutreffend           | keine stabile npm-Version                       |
| `2026.5.26` | ja                      | ja                         | verschachtelter Abhängigkeitsbaum weiterhin vorhanden |
| `2026.5.27` | ja                      | ja                         | verschachtelter Abhängigkeitsbaum weiterhin vorhanden |
| `2026.5.28` | ja                      | ja                         | verschachtelter Abhängigkeitsbaum deutlich kleiner |

Der wichtige Unterschied: **Shrinkwrap selbst ist nicht das Problem**.
`v2026.5.28` wird weiterhin mit Root-Shrinkwrap ausgeliefert. Das Problem war
die Paketstruktur, aufgrund derer npm einen großen verschachtelten
OpenClaw-Abhängigkeitsbaum und alle 12 plattformspezifischen
`@napi-rs/canvas`-Pakete materialisierte. Der verschachtelte Baum ist in
`v2026.5.28` kleiner, und die Auffächerung der Canvas-Plattformpakete tritt bei
der lokalen Prüfung nicht mehr auf.

Eine allgemein verständliche Erklärung von Shrinkwrap und den Paketprüfungen
für Maintainer finden Sie unter [npm-Shrinkwrap](/de/gateway/security/shrinkwrap).

## Einordnung der Lieferkette

Die Anzahl der Abhängigkeiten ist eine Kennzahl für die operative Sicherheit,
nicht nur eine Kennzahl für die Installationsgröße. Jedes Paket erweitert die
Menge der Maintainer, Tarballs, transitiven Aktualisierungen, optionalen nativen
Binärdateien und Verhaltensweisen während der Installation, denen Betreiber
vertrauen müssen.

Die Bereinigung verfolgt folgende Ziele:

- umfangreiche und optionale Funktionen außerhalb der standardmäßigen Kerninstallation halten
- die Plugin-Pakete für ihren eigenen Laufzeit-Abhängigkeitsgraphen verantwortlich machen
- Reparaturen durch den Paketmanager zur Laufzeit während des Gateway-Starts vermeiden
- deterministische Installationen beibehalten, ohne native Pakete für alle Plattformen zu materialisieren
- Installationsskripte bei der Paketabnahme und in Messverfahren deaktiviert lassen
- verschachtelte Abhängigkeitsbäume und explosionsartige Zunahmen nativer optionaler Abhängigkeiten vor der Veröffentlichung erkennen

Zugehörige Dokumentation:

- [Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution)
- [Plugin-Inventar](/de/plugins/plugin-inventory)
- [Vollständige Release-Validierung](/de/reference/full-release-validation)

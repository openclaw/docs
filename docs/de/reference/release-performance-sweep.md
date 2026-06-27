---
read_when:
    - Sie validieren die Bereinigung von Performance und Paketgröße im Mai 2026
    - Sie benötigen die Zahlen hinter dem OpenClaw-Blogbeitrag zu Performance und Abhängigkeiten
    - Sie ändern Release-Gates, Package-Shrinkwrap oder Plugin-Abhängigkeitsgrenzen
summary: Visuelle Zusammenfassung und technische Nachweise für die Bereinigung von Performance, Paketgröße, Abhängigkeiten und Shrinkwrap im Mai 2026
title: Performance-Überprüfung für Releases
x-i18n:
    generated_at: "2026-06-27T18:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Diese Seite erfasst die Belege hinter der OpenClaw-Bereinigung von Performance, Paketgröße, Abhängigkeiten und Shrinkwrap im Mai 2026. Sie ist die technische Begleitung
zum öffentlichen Blogbeitrag.

Hier werden zwei Audits kombiniert:

- **Release-Performance-Durchlauf:** GitHub Releases von `v2026.5.28` zurück bis
  zum stabilen `v2026.4.23`, mit dem Workflow `OpenClaw Performance`,
  `profile=smoke`, Mock-Provider-Lane. Die meisten Tag-Zeilen sind eine Stichprobe; die
  Zeilen `v2026.5.27` und `v2026.5.28` verwenden die neuesten Repeat-3-Release-Branch-
  Artefakte.
- **Früherer April-Kontext:** veröffentlichte `clawgrit-reports`-Mock-Provider-
  Baselines von `v2026.4.1` bis `v2026.5.2`, nur verwendet, um zu vermeiden, dass
  die fehlerhaften Releases von Ende April als öffentliche Performance-Baseline behandelt werden.
- **Installationsumfang-Durchlauf:** frische `npm install --ignore-scripts`-Installationen
  in temporäre Pakete, mit `du -sk node_modules` für die Größe und einem
  `node_modules`-Durchlauf für die Anzahl der Paketinstanzen.
- **npm-Paketgrößen-Durchlauf:** `npm pack openclaw@<version> --dry-run --json`
  für veröffentlichte Releases, mit Erfassung der komprimierten Tarball-Größe, der entpackten Größe und
  der Dateianzahl.

<Warning>
Der Haupt-Performance-Durchlauf verwendet eine Smoke-Stichprobe pro Tag, mit Ausnahme der
Zeilen `v2026.5.27` und `v2026.5.28`, die die neuesten Repeat-3-
Release-Branch-Artefakte verwenden. Der frühere April-Kontext verwendet veröffentlichte Repeat-3-
Mediane aus `clawgrit-reports`. Betrachten Sie die Zahlen als Trendbelege und
Signal für die Regressionssuche, nicht als Release-Gate-Statistiken.
</Warning>

## Momentaufnahme

Performance-Abdeckung: **77 angeforderte Releases**, **74 artefaktgestützte Punkte**
und **3 nicht verfügbare CI-Läufe**. Neuester gemessener stabiler Punkt: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stabiler Agent-Turn" icon="gauge">
    **5,1x schnellerer Kalt-Turn**

    - `v2026.4.14`: 9,8 s
    - `v2026.5.28`: 1,9 s

  </Card>
  <Card title="Veröffentlichtes Paket" icon="package">
    **17,9 MB Tarball**

    Neuestes stabiles Paket, gesunken vom Paketgrößen-Höchstwert im März von 43,3 MB.

  </Card>
  <Card title="Neueste stabile Installation" icon="hard-drive">
    **361,7 MiB frische Installation**

    `v2026.5.28` reduziert den verschachtelten OpenClaw-Abhängigkeitsbaum deutlich, aber ein
    kleinerer verschachtelter Baum von 259,7 MiB bleibt im lokalen Installationsaudit weiterhin bestehen.

  </Card>
  <Card title="Abhängigkeitsgraph" icon="boxes">
    **300 installierte Pakete**

    Neuester stabiler Release, gemessen als eindeutige Paketname-/Versions-Wurzeln in einer
    frischen Installation mit deaktivierten Skripten.

  </Card>
</CardGroup>

## Zeitachse des Installationsumfangs

<CardGroup cols={2}>
  <Card title="Monatlicher Höchstwert" icon="triangle-alert">
    **645 Abhängigkeiten**

    `2026.2.26` war in dieser Stichprobe der monatliche Höchstwert der Abhängigkeitsanzahl.

  </Card>
  <Card title="Shrinkwrap eingeführt" icon="lock">
    **1.020,6 MB Installation**

    `2026.5.22` fügte Root-Shrinkwrap hinzu und machte ein Problem mit der Paketstruktur sichtbar:
    911,8 MB landeten unter verschachteltem `openclaw/node_modules`.

  </Card>
  <Card title="Neuester stabiler Release" icon="tag">
    **361,7 MiB Installation**

    `2026.5.28` reduziert die frische Installationsgröße gegenüber `2026.5.27` um 52,8 %, installiert aber weiterhin
    einen verschachtelten OpenClaw-Baum von 259,7 MiB.

  </Card>
  <Card title="Abhängigkeitsgraph" icon="scissors">
    **300 Paket-Wurzeln**

    `2026.5.28` installiert 71 eindeutige Paketname-/Versions-Wurzeln weniger als
    `2026.5.27`.

  </Card>
</CardGroup>

<Tip>
Shrinkwrap war nicht an sich das Problem. Die schlechte Paketstruktur war es.
`v2026.5.28` liefert weiterhin Shrinkwrap aus, aber der verschachtelte Abhängigkeitsbaum ist deutlich
kleiner und der Canvas-Fanout für alle Plattformen ist im lokalen Audit verschwunden.
</Tip>

## Was Sich In 5.28 Geändert Hat

Die Bereinigung zwischen `v2026.5.27` und `v2026.5.28` hat den Graphen der
Standardinstallation reduziert, statt die Fähigkeiten selbst zu entfernen.

<CardGroup cols={2}>
  <Card title="Standard-Root-Graph" icon="git-branch">
    Eindeutige Paketname-/Versions-Roots sanken von **371** auf **300**.
    Paketinstanzen sanken von **372** auf **301**.
  </Card>
  <Card title="Verschachtelter Baum" icon="unplug">
    Das verschachtelte `openclaw/node_modules` sank im selben lokalen
    Installationsaudit von **656.1MiB** auf **259.7MiB**.
  </Card>
  <Card title="Native optionale Cones" icon="cpu">
    Der plattformübergreifende native Paket-Cone `@napi-rs/canvas` landete
    nicht mehr in der Standardinstallation.
  </Card>
  <Card title="Supply-Chain-Oberfläche" icon="shield">
    Weniger Standardpakete bedeuten weniger Tarballs, Maintainer, native
    Binärdateien, Installationszeit-Verhalten und transitive Update-Pfade,
    denen standardmäßig vertraut werden muss.
  </Card>
</CardGroup>

## Wichtigste Zahlen

Verwenden Sie die fehlerhaften Zeilen von Ende April nicht als öffentliche
Performance-Baselines. `v2026.4.23` und `v2026.4.29` sind nützliche
Regressionsnachweise, aber die großen Deltas im Stil von `14x` beschreiben
hauptsächlich die Erholung von einer schlechten Release-Linie.

Für die Blog-Erzählung verwenden Sie die frühere veröffentlichte April-Baseline
als Größenordnung:

| Metrik           | Frühere April-Baseline | `v2026.5.28` |                         Differenz |
| ---------------- | ---------------------: | -----------: | --------------------------------: |
| Kalter Agent-Turn |                9,819ms |      1,908ms | 80.6% niedriger, 5.1x schneller |
| Warmer Agent-Turn |                7,458ms |      1,870ms | 74.9% niedriger, 4.0x schneller |
| Agent-Spitzen-RSS |                686.2MB |      581.0MB |                   15.3% niedriger |

Die frühere April-Baseline ist `v2026.4.14` aus dem veröffentlichten
`clawgrit-reports`-Mock-Provider-Lauf. Dieser Lauf verwendete Wiederholung 3
und scheiterte nur, weil die Diagnose-Timeline nicht ausgegeben wurde; die
Medianwerte für kalt, warm und RSS sind als grobe Größenordnung weiterhin
nützlich. Behandeln Sie dies als erzählerischen Kontext, nicht als
Release-Gate-Statistik.

Innerhalb des Mai-Sweeps bewegte sich die neueste Release-Branch-Zeile deutlich
gegenüber `v2026.5.2`:

| Metrik            | `v2026.5.2` | `v2026.5.28` |       Differenz |
| ----------------- | ----------: | -----------: | --------------: |
| Kalter Agent-Turn |     3,897ms |      1,908ms | 51.0% niedriger |
| Warmer Agent-Turn |     3,610ms |      1,870ms | 48.2% niedriger |
| Agent-Spitzen-RSS |     613.7MB |      581.0MB |  5.3% niedriger |

Verglichen mit dem vorherigen stabilen Release:

| Metrik            | `v2026.5.27` | `v2026.5.28` |       Differenz |
| ----------------- | -----------: | -----------: | --------------: |
| Kalter Agent-Turn |      2,231ms |      1,908ms | 14.5% niedriger |
| Warmer Agent-Turn |      2,226ms |      1,870ms | 16.0% niedriger |
| Agent-Spitzen-RSS |      649.0MB |      581.0MB | 10.5% niedriger |

### Installations-Footprint

| Metrik                                               |  Baseline | `v2026.5.28` |       Differenz |
| ---------------------------------------------------- | --------: | -----------: | --------------: |
| Installationsgröße vom Peak `2026.5.22`              | 1,020.6MB |     361.7MiB | 64.6% niedriger |
| Installationsgröße vom neuesten Release `2026.5.27`  |  767.1MiB |     361.7MiB | 52.8% niedriger |
| Abhängigkeiten vom Monatshoch `2026.2.26`            |       645 |          300 | 53.5% niedriger |
| Abhängigkeiten vom neuesten Release `2026.5.27`      |       371 |          300 | 19.1% niedriger |
| Verschachteltes `openclaw/node_modules` von `2026.5.22` |   911.8MB |     259.7MiB | 71.5% niedriger |
| Verschachteltes `openclaw/node_modules` von `2026.5.27` |  656.1MiB |     259.7MiB | 60.4% niedriger |

### npm-Paketgröße

| Version     | Komprimierter Tarball | Entpacktes Paket | Dateien | Hinweise                              |
| ----------- | --------------------: | ----------------: | ------: | ------------------------------------- |
| `2026.1.30` |                12.8MB |            33.5MB |   4,607 | frühes umbenanntes Paket              |
| `2026.2.26` |                23.6MB |            82.9MB |  10,125 | Funktionswachstum                     |
| `2026.3.31` |                43.3MB |           182.6MB |  21,037 | Höchststand der Paketgröße            |
| `2026.4.29` |                22.9MB |            74.6MB |   9,309 | Paketbereinigung sichtbar             |
| `2026.5.12` |                23.4MB |            80.1MB |  12,035 | großer Split externer Plugins         |
| `2026.5.22` |                17.2MB |            76.9MB |  12,386 | docs/assets aus dem Paket ausgeschlossen |
| `2026.5.27` |                17.8MB |            79.0MB |  12,509 | vorheriges stabiles Paket             |
| `2026.5.28` |                17.9MB |            81.0MB |   9,082 | neuestes stabiles Paket               |

`2026.5.12` ist der sichtbare Plugin-Extraktionsmeilenstein im Changelog:
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex,
Matrix und WhatsApp wurden aus dem Kern-Abhängigkeitspfad verschoben, sodass
ihre Abhängigkeits-Cones mit diesen Plugins installiert werden statt bei jeder
Kerninstallation.

## Kova-Agent-Turn-Zusammenfassung

Die stabile April-Linie enthält zwei verschiedene Geschichten. Anfang April war
langsam, aber erkennbar. Ende April wurde zu einer Regressionsklippe.
`v2026.5.2` ist der Punkt, an dem die Mock-Provider-Lane erstmals in den
Bereich von 3-5s fällt und im bereitgestellten Sweep konsistent besteht.

Früherer veröffentlichter Kontext:

| Release      | Kova            | Kalter Turn | Warmer Turn | Agent-Spitzen-RSS |
| ------------ | --------------- | ----------: | ----------: | ----------------: |
| `v2026.4.10` | FEHLGESCHLAGEN  |  11,031ms |   7,962ms |        679.0MB |
| `v2026.4.12` | FEHLGESCHLAGEN  |  11,965ms |   8,289ms |        713.5MB |
| `v2026.4.14` | FEHLGESCHLAGEN  |   9,819ms |   7,458ms |        686.2MB |
| `v2026.4.20` | FEHLGESCHLAGEN  |  22,314ms |  18,811ms |        810.8MB |
| `v2026.4.22` | FEHLGESCHLAGEN  |   9,630ms |   7,459ms |        743.0MB |

Bereitgestellter Sweep:

| Release             | Kova            | Kalter Turn | Warmer Turn | Agent-Spitzen-RSS |
| ------------------- | --------------- | ----------: | ----------: | ----------------: |
| `v2026.4.23`        | FEHLGESCHLAGEN  |  47,847ms |   8,010ms |      1,082.7MB |
| `v2026.4.24`        | FEHLGESCHLAGEN  |  48,264ms |  25,483ms |        996.0MB |
| `v2026.4.25`        | FEHLGESCHLAGEN  |  81,080ms |  59,172ms |      1,113.9MB |
| `v2026.4.26`        | FEHLGESCHLAGEN  |  76,771ms |  54,941ms |      1,140.8MB |
| `v2026.4.27`        | FEHLGESCHLAGEN  |  60,902ms |  33,699ms |      1,156.0MB |
| `v2026.4.29`        | FEHLGESCHLAGEN  |  94,031ms |  57,334ms |      3,613.7MB |
| `v2026.5.2`         | BESTANDEN       |   3,897ms |   3,610ms |        613.7MB |
| `v2026.5.7`         | BESTANDEN       |   3,923ms |   3,693ms |        654.1MB |
| `v2026.5.12`        | BESTANDEN       |   7,248ms |   6,629ms |        834.8MB |
| `v2026.5.18`        | BESTANDEN       |   3,301ms |   2,913ms |        630.3MB |
| `v2026.5.20`        | BESTANDEN       |   3,413ms |   2,952ms |        643.2MB |
| `v2026.5.22`        | BESTANDEN       |   4,494ms |   4,093ms |        654.3MB |
| `v2026.5.26`        | BESTANDEN       |   2,626ms |   2,282ms |        660.4MB |
| `v2026.5.27-beta.1` | BESTANDEN       |   2,575ms |   2,217ms |        635.3MB |
| `v2026.5.27`        | BESTANDEN       |   2,231ms |   2,226ms |        649.0MB |
| `v2026.5.28`        | BESTANDEN       |   1,908ms |   1,870ms |        581.0MB |

## Quell-Probes

Quell-Probes wurden für 17 erfolgreiche ältere Refs übersprungen, weil diese
Quellbäume die erforderlichen Probe-Einstiegspunkte noch nicht hatten.
Agent-Turn-Metriken existieren für diese Refs weiterhin.

Repräsentative Quell-Probe-Punkte:

| Release             | Standard-`readyz` p50 | 50 Plugins `readyz` p50 | CLI-Health p50 | Plugin-Max-RSS |
| ------------------- | --------------------: | ----------------------: | -------------: | -------------: |
| `v2026.4.29`        |              2,819ms |                 2,618ms |        1,679ms |        389.0MB |
| `v2026.5.2`         |              2,324ms |                 2,013ms |        1,384ms |        377.2MB |
| `v2026.5.7`         |              1,649ms |                 1,540ms |        1,175ms |        387.6MB |
| `v2026.5.18`        |              1,942ms |                 1,927ms |          607ms |        426.5MB |
| `v2026.5.20`        |              1,966ms |                 1,987ms |          621ms |        455.0MB |
| `v2026.5.22`        |              2,081ms |                 1,884ms |        5,095ms |        444.2MB |
| `v2026.5.26`        |              1,546ms |                 1,634ms |          656ms |        400.4MB |
| `v2026.5.27-beta.1` |              1,462ms |                 1,548ms |          548ms |        394.0MB |
| `v2026.5.27`        |              1,491ms |                 1,571ms |          553ms |        401.5MB |
| `v2026.5.28`        |              1,457ms |                 1,474ms |          623ms |        386.1MB |

Der CLI-Gesundheitsausschlag in `v2026.5.22` ist in dieser Tabelle sichtbar, obwohl die
agent-turn-Lane weiterhin bestanden hat. Behalten Sie die Quell-Probes bei, wenn Sie
gezielte CLI- oder Gateway-Regressionen untersuchen.

## Audit des Installationsumfangs

Abhängigkeitsstichproben verwenden eine stabile Veröffentlichung pro Monat sowie das
`2026.5.22`-Ereignis zur Einführung von shrinkwrap und die neueste Veröffentlichung
`2026.5.28`.

| Zeitpunkt          | Installierte Abhängigkeiten | Neuinstallation | OpenClaw-Paket | Verschachteltes `openclaw/node_modules` | Root-shrinkwrap | Canvas-Installationsverhalten             |
| ------------------ | --------------------------: | --------------: | -------------: | --------------------------------------: | --------------- | ----------------------------------------- |
| Jan `2026.1.30`    |                         605 |         438.4MB |         45.8MB |                                   2.4MB | nein            | Wrapper auf oberster Ebene + `darwin-arm64` |
| Feb `2026.2.26`    |                         645 |         575.7MB |        110.1MB |                                   3.5MB | nein            | Wrapper auf oberster Ebene + `darwin-arm64` |
| Mär `2026.3.31`    |                         438 |         584.1MB |        234.8MB |                                     0MB | nein            | Wrapper auf oberster Ebene + `darwin-arm64` |
| Apr `2026.4.29`    |                         392 |         335.0MB |         97.4MB |                                     0MB | nein            | nichts installiert                         |
| `2026.5.22`        |                         401 |       1,020.6MB |      1,020.4MB |                                 911.8MB | ja              | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete |
| Mai `2026.5.26`    |                         371 |         767.5MB |        767.4MB |                                 656.4MB | ja              | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete |
| `2026.5.27`        |                         371 |        767.1MiB |       766.9MiB |                                656.1MiB | ja              | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete |
| Neueste `2026.5.28` |                        300 |        361.7MiB |       361.6MiB |                                259.7MiB | ja              | nichts installiert                         |

### Shrinkwrap-Grenze

<CardGroup cols={2}>
  <Card title="Vor shrinkwrap" icon="unlock">
    `2026.5.20` hat kein Root-shrinkwrap und keinen großen verschachtelten
    OpenClaw-Abhängigkeitsbaum.
  </Card>
  <Card title="Eingeführt" icon="lock">
    `2026.5.22` fügt Root-shrinkwrap hinzu und installiert 911.8MB unter dem
    verschachtelten `openclaw/node_modules`.
  </Card>
  <Card title="Neueste stabile Version" icon="tag">
    `2026.5.28` behält shrinkwrap bei und installiert weiterhin 259.7MiB unter
    dem verschachtelten `openclaw/node_modules`.
  </Card>
  <Card title="Canvas-Fanout behoben" icon="check">
    `2026.5.28` installiert im lokalen Audit einer frischen Installation keine
    `@napi-rs/canvas`-Pakete mehr.
  </Card>
</CardGroup>

Die Prüfung veröffentlichter Tarballs bestätigt die Grenze:

| Version     | Stabil veröffentlicht? | Root-`npm-shrinkwrap.json` | Hinweise                              |
| ----------- | ---------------------- | -------------------------- | ------------------------------------- |
| `2026.5.20` | ja                     | nein                       | letzte stabile Veröffentlichung vor shrinkwrap |
| `2026.5.21` | nein                   | n/a                        | keine stabile npm-Veröffentlichung    |
| `2026.5.22` | ja                     | ja                         | shrinkwrap eingeführt                 |
| `2026.5.23` | nein                   | n/a                        | keine stabile npm-Veröffentlichung    |
| `2026.5.24` | nein                   | n/a                        | keine stabile npm-Veröffentlichung    |
| `2026.5.25` | nein                   | n/a                        | keine stabile npm-Veröffentlichung    |
| `2026.5.26` | ja                     | ja                         | verschachtelter Abhängigkeitsbaum weiterhin vorhanden |
| `2026.5.27` | ja                     | ja                         | verschachtelter Abhängigkeitsbaum weiterhin vorhanden |
| `2026.5.28` | ja                     | ja                         | verschachtelter Abhängigkeitsbaum deutlich kleiner |

Die wichtige Unterscheidung: **shrinkwrap selbst ist nicht das Problem**.
`v2026.5.28` liefert weiterhin Root-shrinkwrap aus. Das Problem war die Paketform,
durch die npm einen großen verschachtelten OpenClaw-Abhängigkeitsbaum und alle 12
`@napi-rs/canvas`-Plattformpakete materialisierte. Der verschachtelte Baum ist in
`v2026.5.28` kleiner, und der Canvas-Plattform-Fanout landet im lokalen Audit nicht
mehr.

Eine allgemein verständliche Erklärung zu shrinkwrap und den Paketprüfungen auf
Maintainer-Ebene finden Sie unter [npm shrinkwrap](/de/gateway/security/shrinkwrap).

## Supply-Chain-Interpretation

Die Anzahl der Abhängigkeiten ist eine operative Sicherheitsmetrik, nicht nur eine
Metrik für die Installationsgröße. Jedes Paket erweitert die Menge der Maintainer,
Tarballs, transitiven Updates, optionalen nativen Binärdateien und
Installationszeit-Verhalten, denen Betreiber vertrauen müssen.

Die Bereinigungsrichtung lautet:

- umfangreiche und optionale Fähigkeiten außerhalb der standardmäßigen Core-Installation halten
- Plugin-Pakete ihren eigenen Laufzeit-Abhängigkeitsgraphen verwalten lassen
- Laufzeit-Reparaturen durch den Paketmanager beim Gateway-Start vermeiden
- deterministische Installationen bewahren, ohne die Materialisierung nativer Pakete für alle Plattformen auszulösen
- Installationsskripte in Package-Acceptance- und Messpfaden deaktiviert halten
- verschachtelte Abhängigkeitsbäume und Explosionen nativer optionaler Abhängigkeiten vor der Veröffentlichung erkennen

Verwandte Dokumentation:

- [Plugin-Abhängigkeitsauflösung](/de/plugins/dependency-resolution)
- [Plugin-Inventar](/de/plugins/plugin-inventory)
- [Vollständige Release-Validierung](/de/reference/full-release-validation)

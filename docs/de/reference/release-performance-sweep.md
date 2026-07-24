---
read_when:
    - Sie validieren die Leistungs- und Paketgrößenbereinigung vom Mai 2026
    - Sie benötigen die Zahlen hinter dem Blogbeitrag zur Leistung und zu den Abhängigkeiten von OpenClaw
    - Sie ändern Release-Gates, die Paket-Shrinkwrap-Datei oder Plugin-Abhängigkeitsgrenzen
summary: Visuelle Zusammenfassung und technische Nachweise für die Bereinigung von Performance, Paketgröße, Abhängigkeiten und Shrinkwrap im Mai 2026
title: Sweep zur Release-Performance
x-i18n:
    generated_at: "2026-07-24T04:05:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Diese Seite dokumentiert die Nachweise für die OpenClaw-Bereinigung im Mai 2026
hinsichtlich Performance, Paketgröße, Abhängigkeiten und Shrinkwrap. Sie ist die technische Ergänzung
zum öffentlichen Blogbeitrag.

Hier werden zwei Audits zusammengeführt:

- **Release-Performance-Analyse:** GitHub Releases von `v2026.5.28` zurück bis zum
  stabilen `v2026.4.23`, unter Verwendung des Workflows `OpenClaw Performance`,
  `profile=smoke`, im Mock-Provider-Lauf. Die meisten Tag-Zeilen basieren auf einer Stichprobe; die
  Zeilen `v2026.5.27` und `v2026.5.28` verwenden die neuesten Repeat-3-Artefakte des
  Release-Branches.
- **Früherer April-Kontext:** veröffentlichte `clawgrit-reports`-Mock-Provider-
  Baselines von `v2026.4.1` bis `v2026.5.2`, die nur verwendet werden, damit
  die fehlerhaften Releases Ende April nicht als öffentliche Performance-Baseline gelten.
- **Analyse des Installationsumfangs:** frische `npm install --ignore-scripts`-Installationen
  in temporären Paketen, mit `du -sk node_modules` für die Größe und einem
  `node_modules`-Durchlauf für die Anzahl der Paketinstanzen.
- **Analyse der npm-Paketgröße:** `npm pack openclaw@<version> --dry-run --json`
  für veröffentlichte Releases, wobei die komprimierte Tarball-Größe, die entpackte Größe und
  die Dateianzahl erfasst wurden.

<Warning>
Die Hauptanalyse der Performance verwendet eine Smoke-Stichprobe pro Tag, mit Ausnahme der
Zeilen `v2026.5.27` und `v2026.5.28`, die die neuesten Repeat-3-
Artefakte des Release-Branches verwenden. Der frühere April-Kontext verwendet veröffentlichte Repeat-3-
Mediane aus `clawgrit-reports`. Betrachten Sie die Zahlen als Nachweise für Trends und
als Signal für die Regressionssuche, nicht als Release-Gate-Statistiken.
</Warning>

## Momentaufnahme

Performance-Abdeckung: **77 angeforderte Releases**, **74 artefaktgestützte Datenpunkte**
und **3 nicht verfügbare CI-Läufe**. Neuester gemessener stabiler Datenpunkt: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stabiler Agent-Durchlauf" icon="gauge">
    **5,1-mal schnellerer Kaltlauf**

    - `v2026.4.14`: 9,8s
    - `v2026.5.28`: 1,9s

  </Card>
  <Card title="Veröffentlichtes Paket" icon="package">
    **17,9MB großer Tarball**

    Neuestes stabiles Paket, reduziert gegenüber dem Höchststand der Paketgröße im März von 43,3MB.

  </Card>
  <Card title="Neueste stabile Installation" icon="hard-drive">
    **361,7MiB bei frischer Installation**

    Reduziert den verschachtelten OpenClaw-Abhängigkeitsbaum gegenüber dem Höchststand bei der
    Shrinkwrap-Einführung in `2026.5.22` erheblich, obwohl im lokalen Installationsaudit
    weiterhin ein kleinerer verschachtelter Baum von 259,7MiB verbleibt.

  </Card>
  <Card title="Abhängigkeitsgraph" icon="boxes">
    **300 installierte Pakete**

    Gemessen als eindeutige Paketname-/Versionswurzeln in einer frischen Installation mit
    deaktivierten Skripten; 71 Wurzeln weniger als beim vorherigen stabilen Release.

  </Card>
</CardGroup>

## Änderungen in 5.28

Die Bereinigung zwischen `v2026.5.27` und `v2026.5.28` reduzierte den Graphen der
Standardinstallation, statt die Funktionen selbst zu entfernen.

<CardGroup cols={2}>
  <Card title="Standardgraph der Wurzelabhängigkeiten" icon="git-branch">
    Die Zahl eindeutiger Paketname-/Versionswurzeln sank von **371** auf **300**. Die Zahl der
    Paketinstanzen sank von **372** auf **301**.
  </Card>
  <Card title="Verschachtelter Baum" icon="unplug">
    Verschachteltes `openclaw/node_modules` sank im selben lokalen Installationsaudit von
    **656,1MiB** auf **259,7MiB**.
  </Card>
  <Card title="Native optionale Abhängigkeitskegel" icon="cpu">
    Der plattformübergreifende native Paketkegel `@napi-rs/canvas` wurde nicht mehr
    in der Standardinstallation installiert.
  </Card>
  <Card title="Angriffsfläche der Lieferkette" icon="shield">
    Weniger Standardpakete bedeuten weniger Tarballs, Maintainer, native Binärdateien,
    Verhaltensweisen während der Installation und transitive Aktualisierungspfade, denen standardmäßig vertraut werden muss.
  </Card>
</CardGroup>

<Tip>
Shrinkwrap war nicht an sich das Problem. Die ungünstige Paketstruktur war es.
`v2026.5.28` liefert weiterhin Shrinkwrap aus, aber der verschachtelte Abhängigkeitsbaum ist
deutlich kleiner, und die plattformübergreifende Canvas-Auffächerung ist im lokalen Audit verschwunden.
</Tip>

## Wichtigste Zahlen

Verwenden Sie die fehlerhaften Zeilen von Ende April nicht als öffentliche Performance-Baselines.
`v2026.4.23` und `v2026.4.29` sind nützliche Regressionsnachweise, aber die großen
Deltas im Stil von `14x` beschreiben hauptsächlich die Erholung von einer problematischen Release-Linie.

Verwenden Sie für die Darstellung im Blog die frühere veröffentlichte April-Baseline als Größenordnung.
Die Baseline ist `v2026.4.14` aus dem veröffentlichten `clawgrit-reports`-
Mock-Provider-Lauf (Wiederholung 3; dieser Lauf schlug nur fehl, weil die Diagnose-
Zeitleiste nicht ausgegeben wurde, daher sind die Mediane für Kaltlauf, Warmlauf und RSS weiterhin
als grobe Größenordnung nützlich). Betrachten Sie dies als narrativen Kontext, nicht als
Release-Gate-Statistik.

| Metrik          | Frühere April-Baseline | `v2026.5.28` |                    Delta |
| --------------- | ---------------------: | -----------: | -----------------------: |
| Kalter Agent-Durchlauf |                9,819ms |      1,908ms | 80,6% niedriger, 5,1-mal schneller |
| Warmer Agent-Durchlauf |                7,458ms |      1,870ms | 74,9% niedriger, 4,0-mal schneller |
| Spitzen-RSS des Agenten  |                686,2MB |      581,0MB |              15,3% niedriger |

Innerhalb der Mai-Analyse verbesserte sich die neueste Zeile des Release-Branches gegenüber
`v2026.5.2` deutlich:

| Metrik          | `v2026.5.2` | `v2026.5.28` |       Delta |
| --------------- | ----------: | -----------: | ----------: |
| Kalter Agent-Durchlauf |     3,897ms |      1,908ms | 51,0% niedriger |
| Warmer Agent-Durchlauf |     3,610ms |      1,870ms | 48,2% niedriger |
| Spitzen-RSS des Agenten  |     613,7MB |      581,0MB |  5,3% niedriger |

Im Vergleich zum vorherigen stabilen Release:

| Metrik          | `v2026.5.27` | `v2026.5.28` |       Delta |
| --------------- | -----------: | -----------: | ----------: |
| Kalter Agent-Durchlauf |      2,231ms |      1,908ms | 14,5% niedriger |
| Warmer Agent-Durchlauf |      2,226ms |      1,870ms | 16,0% niedriger |
| Spitzen-RSS des Agenten  |      649,0MB |      581,0MB | 10,5% niedriger |

### Installationsumfang

| Metrik                                          |  Baseline | `v2026.5.28` |       Delta |
| ----------------------------------------------- | --------: | -----------: | ----------: |
| Installationsgröße ab dem Höchststand `2026.5.22`              | 1,020.6MB |     361.7MiB | 64,6% niedriger |
| Installationsgröße ab dem neuesten Release `2026.5.27`    |  767.1MiB |     361.7MiB | 52,8% niedriger |
| Abhängigkeiten ab dem Monatshöchststand `2026.2.26`      |       645 |          300 | 53,5% niedriger |
| Abhängigkeiten ab dem neuesten Release `2026.5.27`    |       371 |          300 | 19,1% niedriger |
| Verschachteltes `openclaw/node_modules` ab `2026.5.22` |   911.8MB |     259.7MiB | 71,5% niedriger |
| Verschachteltes `openclaw/node_modules` ab `2026.5.27` |  656.1MiB |     259.7MiB | 60,4% niedriger |

### npm-Paketgröße

| Version     | Komprimierter Tarball | Entpacktes Paket |  Dateien | Hinweise                             |
| ----------- | -----------------: | ---------------: | -----: | --------------------------------- |
| `2026.1.30` |             12.8MB |           33.5MB |  4,607 | frühes umbenanntes Paket           |
| `2026.2.26` |             23.6MB |           82.9MB | 10,125 | Funktionswachstum                    |
| `2026.3.31` |             43.3MB |          182.6MB | 21,037 | Höchststand der Paketgröße           |
| `2026.4.29` |             22.9MB |           74.6MB |  9,309 | Paketbereinigung sichtbar           |
| `2026.5.12` |             23.4MB |           80.1MB | 12,035 | große Ausgliederung externer Plugins       |
| `2026.5.22` |             17.2MB |           76.9MB | 12,386 | Dokumentation/Assets aus Paket ausgeschlossen |
| `2026.5.27` |             17.8MB |           79.0MB | 12,509 | vorheriges stabiles Paket           |
| `2026.5.28` |             17.9MB |           81.0MB |  9,082 | neuestes stabiles Paket             |

`2026.5.12` ist der im Changelog sichtbare Meilenstein der Plugin-Ausgliederung:
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell-Sandbox, Anthropic Vertex,
Matrix und WhatsApp wurden aus dem Kernabhängigkeitspfad entfernt, sodass ihre Abhängigkeitskegel
mit diesen Plugins statt mit jeder Kerninstallation installiert werden.

## Zusammenfassung der Kova-Agent-Durchläufe

Die stabile April-Linie enthält zwei unterschiedliche Entwicklungen. Anfang April war sie langsam,
aber nachvollziehbar. Ende April kam es zu einem drastischen Regressionseinbruch. Bei `v2026.5.2`
fällt der Mock-Provider-Lauf erstmals in den Bereich von 3–5s und beginnt in der
bereitgestellten Analyse durchgängig erfolgreich zu sein.

Früherer veröffentlichter Kontext:

| Release      | Kova | Kaltlauf | Warmlauf | Spitzen-RSS des Agenten |
| ------------ | ---- | --------: | --------: | -------------: |
| `v2026.4.10` | FAIL |  11,031ms |   7,962ms |        679.0MB |
| `v2026.4.12` | FAIL |  11,965ms |   8,289ms |        713.5MB |
| `v2026.4.14` | FAIL |   9,819ms |   7,458ms |        686.2MB |
| `v2026.4.20` | FAIL |  22,314ms |  18,811ms |        810.8MB |
| `v2026.4.22` | FAIL |   9,630ms |   7,459ms |        743.0MB |

Bereitgestellte Analyse:

| Release             | Kova | Kaltlauf | Warmlauf | Spitzen-RSS des Agenten |
| ------------------- | ---- | --------: | --------: | -------------: |
| `v2026.4.23`        | FAIL |  47,847ms |   8,010ms |      1,082.7MB |
| `v2026.4.24`        | FAIL |  48,264ms |  25,483ms |        996.0MB |
| `v2026.4.25`        | FAIL |  81,080ms |  59,172ms |      1,113.9MB |
| `v2026.4.26`        | FAIL |  76,771ms |  54,941ms |      1,140.8MB |
| `v2026.4.27`        | FAIL |  60,902ms |  33,699ms |      1,156.0MB |
| `v2026.4.29`        | FAIL |  94,031ms |  57,334ms |      3,613.7MB |
| `v2026.5.2`         | PASS |   3,897ms |   3,610ms |        613.7MB |
| `v2026.5.7`         | PASS |   3,923ms |   3,693ms |        654.1MB |
| `v2026.5.12`        | PASS |   7,248ms |   6,629ms |        834.8MB |
| `v2026.5.18`        | PASS |   3,301ms |   2,913ms |        630.3MB |
| `v2026.5.20`        | PASS |   3,413ms |   2,952ms |        643.2MB |
| `v2026.5.22`        | PASS |   4,494ms |   4,093ms |        654.3MB |
| `v2026.5.26`        | PASS |   2,626ms |   2,282ms |        660.4MB |
| `v2026.5.27-beta.1` | PASS |   2,575ms |   2,217ms |        635.3MB |
| `v2026.5.27`        | PASS |   2,231ms |   2,226ms |        649.0MB |
| `v2026.5.28`        | PASS |   1,908ms |   1,870ms |        581.0MB |

## Quellcode-Probes

Quellcode-Probes wurden für 17 erfolgreiche ältere Referenzen übersprungen, weil diese Quellcode-
Bäume die erforderlichen Probe-Einstiegspunkte noch nicht enthielten. Metriken zu Agent-Durchläufen sind
für diese Referenzen weiterhin vorhanden.

Repräsentative Quellcode-Probe-Datenpunkte:

| Release             | Standard-`readyz` p50 | 50 Plugins `readyz` p50 | CLI-Zustand p50 | Maximales Plugin-RSS |
| ------------------- | -------------------: | ----------------------: | -------------: | -------------: |
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

Der Ausschlag des CLI-Zustands bei `v2026.5.22` ist in dieser Tabelle sichtbar, obwohl der
Agent-Durchlauf weiterhin erfolgreich war. Behalten Sie die Quellcode-Probes bei der Untersuchung
gezielter CLI- oder Gateway-Regressionen bei.

## Audit des Installationsumfangs

Abhängigkeitsbeispiele verwenden eine stabile Version pro Monat sowie das
`2026.5.22`-Ereignis zur Einführung von Shrinkwrap und die neueste `2026.5.28`-Version.

| Zeitpunkt              | Installierte Abhängigkeiten | Neuinstallation | OpenClaw-Paket | Verschachtelte `openclaw/node_modules` | Root-Shrinkwrap | Canvas-Installationsverhalten                   |
| ------------------ | -------------: | ------------: | ---------------: | -----------------------------: | --------------- | ----------------------------------------- |
| Jan. `2026.1.30`    |            605 |       438.4MB |           45.8MB |                          2.4MB | nein              | Wrapper auf oberster Ebene + `darwin-arm64`        |
| Feb. `2026.2.26`    |            645 |       575.7MB |          110.1MB |                          3.5MB | nein              | Wrapper auf oberster Ebene + `darwin-arm64`        |
| März `2026.3.31`    |            438 |       584.1MB |          234.8MB |                            0MB | nein              | Wrapper auf oberster Ebene + `darwin-arm64`        |
| Apr. `2026.4.29`    |            392 |       335.0MB |           97.4MB |                            0MB | nein              | nichts installiert                            |
| `2026.5.22`        |            401 |     1,020.6MB |        1,020.4MB |                        911.8MB | ja             | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete |
| Mai `2026.5.26`    |            371 |       767.5MB |          767.4MB |                        656.4MB | ja             | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete |
| `2026.5.27`        |            371 |      767.1MiB |         766.9MiB |                       656.1MiB | ja             | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete |
| Neueste `2026.5.28` |            300 |      361.7MiB |         361.6MiB |                       259.7MiB | ja             | nichts installiert                            |

### Shrinkwrap-Grenze

`2026.5.20` wurde ohne Root-Shrinkwrap und ohne großen verschachtelten OpenClaw-
Abhängigkeitsbaum veröffentlicht. `2026.5.22` führte Root-Shrinkwrap ein und installierte 911.8MB
unter der verschachtelten `openclaw/node_modules`. `2026.5.28` behält Shrinkwrap bei und
installiert weiterhin 259.7MiB unter der verschachtelten `openclaw/node_modules`, installiert jedoch
bei der lokalen Prüfung der Neuinstallation keine `@napi-rs/canvas`-Pakete mehr.

Die Prüfung der veröffentlichten Tarballs bestätigt diese Grenze:

| Version     | Als stabile Version veröffentlicht? | Root-`npm-shrinkwrap.json` | Hinweise                                 |
| ----------- | ----------------- | -------------------------- | ------------------------------------- |
| `2026.5.20` | ja               | nein                         | letzte stabile Version vor Shrinkwrap |
| `2026.5.21` | nein                | n. z.                        | keine stabile npm-Version                 |
| `2026.5.22` | ja               | ja                        | Shrinkwrap eingeführt                 |
| `2026.5.23` | nein                | n. z.                        | keine stabile npm-Version                 |
| `2026.5.24` | nein                | n. z.                        | keine stabile npm-Version                 |
| `2026.5.25` | nein                | n. z.                        | keine stabile npm-Version                 |
| `2026.5.26` | ja               | ja                        | verschachtelter Abhängigkeitsbaum weiterhin vorhanden  |
| `2026.5.27` | ja               | ja                        | verschachtelter Abhängigkeitsbaum weiterhin vorhanden  |
| `2026.5.28` | ja               | ja                        | verschachtelter Abhängigkeitsbaum wesentlich kleiner   |

Der wichtige Unterschied: **Shrinkwrap selbst ist nicht das Problem**.
`v2026.5.28` wird weiterhin mit Root-Shrinkwrap ausgeliefert. Das Problem war die Paketstruktur,
die npm dazu veranlasste, einen großen verschachtelten OpenClaw-Abhängigkeitsbaum und alle 12
`@napi-rs/canvas`-Plattformpakete zu materialisieren. Der verschachtelte Baum ist in `v2026.5.28`
kleiner, und die Canvas-Plattformauffächerung tritt in der lokalen Prüfung nicht mehr auf.

Eine allgemein verständliche Erklärung von Shrinkwrap und den Paketprüfungen
für Maintainer finden Sie unter [npm-Shrinkwrap](/de/gateway/security/shrinkwrap).

## Interpretation der Lieferkette

Die Anzahl der Abhängigkeiten ist eine Kennzahl für die operative Sicherheit und nicht nur
für die Installationsgröße. Jedes Paket vergrößert die Menge der Maintainer, Tarballs, transitiven
Aktualisierungen, optionalen nativen Binärdateien und Verhaltensweisen während der Installation,
denen Betreiber vertrauen müssen.

Die Bereinigung verfolgt folgende Ziele:

- aufwendige und optionale Funktionen außerhalb der standardmäßigen Kerninstallation halten
- Plugin-Pakete für ihren eigenen Laufzeit-Abhängigkeitsgraphen verantwortlich machen
- Reparaturen durch den Paketmanager zur Laufzeit während des Gateway-Starts vermeiden
- deterministische Installationen beibehalten, ohne die Materialisierung nativer Pakete
  für alle Plattformen zu verursachen
- Installationsskripte in den Pfaden für Paketabnahme und Messung deaktiviert lassen
- verschachtelte Abhängigkeitsbäume und explosionsartig wachsende native optionale Abhängigkeiten
  vor der Veröffentlichung erkennen

Zugehörige Dokumentation:

- [Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution)
- [Plugin-Inventar](/de/plugins/plugin-inventory)
- [Vollständige Release-Validierung](/de/reference/full-release-validation)

---
read_when:
    - Sie validieren die Bereinigung der Performance und Paketgröße vom Mai 2026
    - Sie benötigen die Zahlen hinter dem Blogbeitrag zur Performance und zu den Abhängigkeiten von OpenClaw.
    - Sie ändern Release-Gates, den Package-Shrinkwrap oder die Abhängigkeitsgrenzen von Plugins.
summary: Visuelle Zusammenfassung und technische Nachweise für die Bereinigung von Performance, Paketgröße, Abhängigkeiten und Shrinkwrap im Mai 2026
title: Performanceprüfung für das Release
x-i18n:
    generated_at: "2026-07-12T15:51:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Diese Seite dokumentiert die Nachweise hinter der OpenClaw-Bereinigung vom Mai 2026 in den Bereichen Performance,
Paketgröße, Abhängigkeiten und Shrinkwrap. Sie ist die technische Ergänzung
zum öffentlichen Blogbeitrag.

Hier werden zwei Audits zusammengeführt:

- **Release-Performance-Analyse:** GitHub Releases von `v2026.5.28` zurück bis zur
  stabilen Version `v2026.4.23` unter Verwendung des Workflows `OpenClaw Performance`,
  `profile=smoke` und der Mock-Provider-Teststrecke. Die meisten Tag-Zeilen basieren auf einer Stichprobe; die
  Zeilen `v2026.5.27` und `v2026.5.28` verwenden die neuesten Release-Branch-Artefakte
  mit drei Wiederholungen.
- **Früherer April-Kontext:** veröffentlichte Mock-Provider-Basiswerte aus
  `clawgrit-reports` von `v2026.4.1` bis `v2026.5.2`, die nur dazu dienen,
  die fehlerhaften Releases von Ende April nicht als öffentliche Performance-Basiswerte zu behandeln.
- **Analyse des Installationsumfangs:** neue Installationen mit `npm install --ignore-scripts`
  in temporäre Pakete, wobei `du -sk node_modules` für die Größe und eine
  Durchquerung von `node_modules` für die Anzahl der Paketinstanzen verwendet wurden.
- **Analyse der npm-Paketgröße:** `npm pack openclaw@<version> --dry-run --json`
  für veröffentlichte Releases, wobei die Größe des komprimierten Tarballs, die entpackte Größe und
  die Dateianzahl erfasst wurden.

<Warning>
Die zentrale Performance-Analyse verwendet eine Smoke-Stichprobe pro Tag, mit Ausnahme der
Zeilen `v2026.5.27` und `v2026.5.28`, die die neuesten Release-Branch-Artefakte
mit drei Wiederholungen verwenden. Der frühere April-Kontext verwendet veröffentlichte Mediane aus drei Wiederholungen
aus `clawgrit-reports`. Betrachten Sie die Zahlen als Nachweise für Trends und
als Signal für die Suche nach Regressionen, nicht als Statistiken für Release-Gates.
</Warning>

## Momentaufnahme

Performance-Abdeckung: **77 angeforderte Releases**, **74 durch Artefakte belegte Messpunkte**
und **3 nicht verfügbare CI-Läufe**. Neuester gemessener stabiler Messpunkt: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stabiler Agent-Durchlauf" icon="gauge">
    **5.1x schnellerer Kaltstart-Durchlauf**

    - `v2026.4.14`: 9.8s
    - `v2026.5.28`: 1.9s

  </Card>
  <Card title="Veröffentlichtes Paket" icon="package">
    **17.9MB großer Tarball**

    Das neueste stabile Paket, gegenüber dem Höchstwert der Paketgröße von 43.3MB im März reduziert.

  </Card>
  <Card title="Neueste stabile Installation" icon="hard-drive">
    **361.7MiB große Neuinstallation**

    Reduziert den verschachtelten OpenClaw-Abhängigkeitsbaum gegenüber dem
    Höchstwert bei der Shrinkwrap-Einführung in `2026.5.22` erheblich, obwohl im lokalen
    Installationsaudit weiterhin ein kleinerer verschachtelter Baum von 259.7MiB verbleibt.

  </Card>
  <Card title="Abhängigkeitsgraph" icon="boxes">
    **300 installierte Pakete**

    Gemessen als eindeutige Paketname/-versions-Wurzeln in einer Neuinstallation mit
    deaktivierten Skripten; 71 Wurzeln weniger als beim vorherigen stabilen Release.

  </Card>
</CardGroup>

## Änderungen in 5.28

Die Bereinigung zwischen `v2026.5.27` und `v2026.5.28` reduzierte den Graphen
der Standardinstallation, anstatt die Funktionen selbst zu entfernen.

<CardGroup cols={2}>
  <Card title="Standardmäßiger Stammgraph" icon="git-branch">
    Die Anzahl eindeutiger Paketname/-versions-Wurzeln sank von **371** auf **300**. Die Anzahl der Paketinstanzen
    sank von **372** auf **301**.
  </Card>
  <Card title="Verschachtelter Baum" icon="unplug">
    Das verschachtelte `openclaw/node_modules` sank im selben lokalen Installationsaudit von
    **656.1MiB** auf **259.7MiB**.
  </Card>
  <Card title="Native optionale Abhängigkeitskegel" icon="cpu">
    Der plattformübergreifende native Paketkegel von `@napi-rs/canvas` wird nicht mehr
    in der Standardinstallation installiert.
  </Card>
  <Card title="Lieferkettenoberfläche" icon="shield">
    Weniger Standardpakete bedeuten weniger Tarballs, Maintainer, native Binärdateien,
    Installationsverhalten und transitive Aktualisierungspfade, denen standardmäßig vertraut werden muss.
  </Card>
</CardGroup>

<Tip>
Shrinkwrap war nicht an sich das Problem. Die ungünstige Paketstruktur war es.
`v2026.5.28` liefert weiterhin Shrinkwrap aus, aber der verschachtelte Abhängigkeitsbaum ist
deutlich kleiner, und die plattformübergreifende Canvas-Auffächerung ist im lokalen Audit verschwunden.
</Tip>

## Wichtigste Zahlen

Verwenden Sie die fehlerhaften Zeilen von Ende April nicht als öffentliche Performance-Basiswerte.
`v2026.4.23` und `v2026.4.29` sind nützliche Nachweise für Regressionen, aber die großen
Deltas im Stil von `14x` beschreiben überwiegend die Erholung von einer fehlerhaften Release-Linie.

Verwenden Sie für die Darstellung im Blog den veröffentlichten Basiswert von Anfang April als Größenordnung.
Der Basiswert ist `v2026.4.14` aus dem veröffentlichten Mock-Provider-Lauf von
`clawgrit-reports` (Wiederholung 3; dieser Lauf schlug nur fehl, weil die diagnostische
Zeitleiste nicht ausgegeben wurde, sodass die Mediane für Kaltstart, Warmstart und RSS weiterhin
als grobe Größenordnung nützlich sind). Betrachten Sie dies als erzählerischen Kontext, nicht als
Statistik für ein Release-Gate.

| Metrik          | Basiswert von Anfang April | `v2026.5.28` |                    Delta |
| --------------- | -------------------------: | -----------: | -----------------------: |
| Kalter Agent-Durchlauf |                9,819ms |      1,908ms | 80.6% niedriger, 5.1x schneller |
| Warmer Agent-Durchlauf |                7,458ms |      1,870ms | 74.9% niedriger, 4.0x schneller |
| Maximaler Agent-RSS  |                686.2MB |      581.0MB |              15.3% niedriger |

Innerhalb der Mai-Analyse verbesserte sich die neueste Release-Branch-Zeile gegenüber
`v2026.5.2` deutlich:

| Metrik          | `v2026.5.2` | `v2026.5.28` |       Delta |
| --------------- | ----------: | -----------: | ----------: |
| Kalter Agent-Durchlauf |     3,897ms |      1,908ms | 51.0% niedriger |
| Warmer Agent-Durchlauf |     3,610ms |      1,870ms | 48.2% niedriger |
| Maximaler Agent-RSS  |     613.7MB |      581.0MB |  5.3% niedriger |

Im Vergleich zum vorherigen stabilen Release:

| Metrik          | `v2026.5.27` | `v2026.5.28` |       Delta |
| --------------- | -----------: | -----------: | ----------: |
| Kalter Agent-Durchlauf |      2,231ms |      1,908ms | 14.5% niedriger |
| Warmer Agent-Durchlauf |      2,226ms |      1,870ms | 16.0% niedriger |
| Maximaler Agent-RSS  |      649.0MB |      581.0MB | 10.5% niedriger |

### Installationsumfang

| Metrik                                          |  Basiswert | `v2026.5.28` |       Delta |
| ----------------------------------------------- | ---------: | -----------: | ----------: |
| Installationsgröße gegenüber dem Höchstwert `2026.5.22`              | 1,020.6MB |     361.7MiB | 64.6% niedriger |
| Installationsgröße gegenüber dem neuesten Release `2026.5.27`    |  767.1MiB |     361.7MiB | 52.8% niedriger |
| Abhängigkeiten gegenüber dem Monatshöchstwert `2026.2.26`      |       645 |          300 | 53.5% niedriger |
| Abhängigkeiten gegenüber dem neuesten Release `2026.5.27`    |       371 |          300 | 19.1% niedriger |
| Verschachteltes `openclaw/node_modules` gegenüber `2026.5.22` |   911.8MB |     259.7MiB | 71.5% niedriger |
| Verschachteltes `openclaw/node_modules` gegenüber `2026.5.27` |  656.1MiB |     259.7MiB | 60.4% niedriger |

### npm-Paketgröße

| Version     | Komprimierter Tarball | Entpacktes Paket |  Dateien | Hinweise                             |
| ----------- | ---------------------: | ---------------: | -------: | ------------------------------------ |
| `2026.1.30` |             12.8MB |           33.5MB |  4,607 | frühes umbenanntes Paket           |
| `2026.2.26` |             23.6MB |           82.9MB | 10,125 | Funktionswachstum                    |
| `2026.3.31` |             43.3MB |          182.6MB | 21,037 | Höchststand der Paketgröße           |
| `2026.4.29` |             22.9MB |           74.6MB |  9,309 | Paketbereinigung sichtbar           |
| `2026.5.12` |             23.4MB |           80.1MB | 12,035 | umfangreiche Auslagerung externer Plugins       |
| `2026.5.22` |             17.2MB |           76.9MB | 12,386 | Dokumentation/Assets aus dem Paket ausgeschlossen |
| `2026.5.27` |             17.8MB |           79.0MB | 12,509 | vorheriges stabiles Paket           |
| `2026.5.28` |             17.9MB |           81.0MB |  9,082 | neuestes stabiles Paket             |

`2026.5.12` ist der im Changelog sichtbare Meilenstein der Plugin-Auslagerung:
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell Sandbox, Anthropic Vertex,
Matrix und WhatsApp wurden aus dem zentralen Abhängigkeitspfad entfernt, sodass ihre
Abhängigkeitskegel mit diesen Plugins installiert werden, statt mit jeder Kerninstallation.

## Zusammenfassung der Kova-Agent-Durchläufe

Die stabile Release-Linie im April enthält zwei unterschiedliche Entwicklungen. Anfang April war sie langsam,
aber nachvollziehbar. Ende April wurde daraus ein steiler Regressionseinbruch. Bei `v2026.5.2`
fällt die Mock-Provider-Teststrecke erstmals in den Bereich von 3-5s und besteht
in der bereitgestellten Analyse anschließend konsistent.

Früherer veröffentlichter Kontext:

| Release      | Kova | Kalter Durchlauf | Warmer Durchlauf | Maximaler Agent-RSS |
| ------------ | ---- | ---------------: | ---------------: | ------------------: |
| `v2026.4.10` | FEHLER |  11,031ms |   7,962ms |        679.0MB |
| `v2026.4.12` | FEHLER |  11,965ms |   8,289ms |        713.5MB |
| `v2026.4.14` | FEHLER |   9,819ms |   7,458ms |        686.2MB |
| `v2026.4.20` | FEHLER |  22,314ms |  18,811ms |        810.8MB |
| `v2026.4.22` | FEHLER |   9,630ms |   7,459ms |        743.0MB |

Bereitgestellte Analyse:

| Release             | Kova | Kalter Durchlauf | Warmer Durchlauf | Maximaler Agent-RSS |
| ------------------- | ---- | ---------------: | ---------------: | ------------------: |
| `v2026.4.23`        | FEHLER |  47,847ms |   8,010ms |      1,082.7MB |
| `v2026.4.24`        | FEHLER |  48,264ms |  25,483ms |        996.0MB |
| `v2026.4.25`        | FEHLER |  81,080ms |  59,172ms |      1,113.9MB |
| `v2026.4.26`        | FEHLER |  76,771ms |  54,941ms |      1,140.8MB |
| `v2026.4.27`        | FEHLER |  60,902ms |  33,699ms |      1,156.0MB |
| `v2026.4.29`        | FEHLER |  94,031ms |  57,334ms |      3,613.7MB |
| `v2026.5.2`         | BESTANDEN |   3,897ms |   3,610ms |        613.7MB |
| `v2026.5.7`         | BESTANDEN |   3,923ms |   3,693ms |        654.1MB |
| `v2026.5.12`        | BESTANDEN |   7,248ms |   6,629ms |        834.8MB |
| `v2026.5.18`        | BESTANDEN |   3,301ms |   2,913ms |        630.3MB |
| `v2026.5.20`        | BESTANDEN |   3,413ms |   2,952ms |        643.2MB |
| `v2026.5.22`        | BESTANDEN |   4,494ms |   4,093ms |        654.3MB |
| `v2026.5.26`        | BESTANDEN |   2,626ms |   2,282ms |        660.4MB |
| `v2026.5.27-beta.1` | BESTANDEN |   2,575ms |   2,217ms |        635.3MB |
| `v2026.5.27`        | BESTANDEN |   2,231ms |   2,226ms |        649.0MB |
| `v2026.5.28`        | BESTANDEN |   1,908ms |   1,870ms |        581.0MB |

## Quellcode-Messungen

Quellcode-Messungen wurden für 17 erfolgreiche ältere Referenzen übersprungen, weil diese Quellbäume
die erforderlichen Einstiegspunkte für die Messungen noch nicht enthielten. Metriken zu Agent-Durchläufen sind für
diese Referenzen dennoch vorhanden.

Repräsentative Messpunkte aus dem Quellcode:

| Release             | Standard-`readyz` p50 | 50 Plugins `readyz` p50 | CLI-Zustand p50 | Maximaler Plugin-RSS |
| ------------------- | --------------------: | ----------------------: | --------------: | -------------------: |
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

Der Ausschlag beim CLI-Zustand in `v2026.5.22` ist in dieser Tabelle sichtbar, obwohl die
Agent-Durchlauf-Teststrecke weiterhin erfolgreich war. Behalten Sie die Quellcode-Messungen bei, wenn Sie
gezielte CLI- oder Gateway-Regressionen untersuchen.

## Audit des Installationsumfangs

Die Abhängigkeitsstichproben verwenden ein stabiles Release pro Monat sowie das
Ereignis der Shrinkwrap-Einführung in `2026.5.22` und das neueste Release `2026.5.28`.

| Zeitpunkt          | Installierte Abhängigkeiten | Neuinstallation | OpenClaw-Paket | Verschachteltes `openclaw/node_modules` | Root-Shrinkwrap | Installationsverhalten von Canvas                  |
| ------------------ | ---------------------------: | ---------------: | -------------: | ---------------------------------------: | --------------- | -------------------------------------------------- |
| Jan. `2026.1.30`   |                          605 |          438.4MB |         45.8MB |                                    2.4MB | nein            | Wrapper auf oberster Ebene + `darwin-arm64`        |
| Feb. `2026.2.26`   |                          645 |          575.7MB |        110.1MB |                                    3.5MB | nein            | Wrapper auf oberster Ebene + `darwin-arm64`        |
| März `2026.3.31`   |                          438 |          584.1MB |        234.8MB |                                      0MB | nein            | Wrapper auf oberster Ebene + `darwin-arm64`        |
| Apr. `2026.4.29`   |                          392 |          335.0MB |         97.4MB |                                      0MB | nein            | nichts installiert                                 |
| `2026.5.22`        |                          401 |        1,020.6MB |      1,020.4MB |                                  911.8MB | ja              | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete    |
| Mai `2026.5.26`    |                          371 |          767.5MB |        767.4MB |                                  656.4MB | ja              | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete    |
| `2026.5.27`        |                          371 |         767.1MiB |       766.9MiB |                                 656.1MiB | ja              | verschachtelt: alle 12 `@napi-rs/canvas`-Pakete    |
| Neueste `2026.5.28` |                         300 |         361.7MiB |       361.6MiB |                                 259.7MiB | ja              | nichts installiert                                 |

### Shrinkwrap-Grenze

`2026.5.20` wurde ohne Root-Shrinkwrap und ohne großen verschachtelten
OpenClaw-Abhängigkeitsbaum ausgeliefert. `2026.5.22` führte Root-Shrinkwrap ein
und installierte 911.8MB unter dem verschachtelten `openclaw/node_modules`.
`2026.5.28` behält Shrinkwrap bei und installiert weiterhin 259.7MiB unter dem
verschachtelten `openclaw/node_modules`, installiert bei der lokalen Prüfung
einer Neuinstallation jedoch keine `@napi-rs/canvas`-Pakete mehr.

Die Untersuchung der veröffentlichten Tarballs bestätigt diese Grenze:

| Version     | Als stabile Version veröffentlicht? | Root-`npm-shrinkwrap.json` | Hinweise                                             |
| ----------- | ----------------------------------- | -------------------------- | ---------------------------------------------------- |
| `2026.5.20` | ja                                  | nein                       | letzte stabile Version vor Shrinkwrap                |
| `2026.5.21` | nein                                | nicht zutreffend           | keine stabile npm-Veröffentlichung                   |
| `2026.5.22` | ja                                  | ja                         | Shrinkwrap eingeführt                                |
| `2026.5.23` | nein                                | nicht zutreffend           | keine stabile npm-Veröffentlichung                   |
| `2026.5.24` | nein                                | nicht zutreffend           | keine stabile npm-Veröffentlichung                   |
| `2026.5.25` | nein                                | nicht zutreffend           | keine stabile npm-Veröffentlichung                   |
| `2026.5.26` | ja                                  | ja                         | verschachtelter Abhängigkeitsbaum weiterhin vorhanden |
| `2026.5.27` | ja                                  | ja                         | verschachtelter Abhängigkeitsbaum weiterhin vorhanden |
| `2026.5.28` | ja                                  | ja                         | verschachtelter Abhängigkeitsbaum deutlich kleiner  |

Der wichtige Unterschied: **Shrinkwrap selbst ist nicht das Problem**.
`v2026.5.28` wird weiterhin mit Root-Shrinkwrap ausgeliefert. Das Problem war
die Paketstruktur, durch die npm einen großen verschachtelten
OpenClaw-Abhängigkeitsbaum und alle 12 plattformspezifischen
`@napi-rs/canvas`-Pakete materialisierte. Der verschachtelte Baum ist in
`v2026.5.28` kleiner, und die Verteilung der Canvas-Plattformpakete erscheint
nicht mehr in der lokalen Prüfung.

Eine allgemein verständliche Erklärung zu Shrinkwrap und den Paketprüfungen
für Maintainer finden Sie unter [npm-Shrinkwrap](/de/gateway/security/shrinkwrap).

## Interpretation der Lieferkette

Die Anzahl der Abhängigkeiten ist eine Kennzahl für die operative Sicherheit,
nicht nur eine Kennzahl für die Installationsgröße. Jedes Paket erweitert die
Menge der Maintainer, Tarballs, transitiven Aktualisierungen, optionalen nativen
Binärdateien und Verhaltensweisen während der Installation, denen Betreiber
vertrauen müssen.

Die Bereinigung verfolgt folgende Ziele:

- umfangreiche und optionale Funktionen außerhalb der standardmäßigen Kerninstallation halten
- die Plugin-Pakete für ihren eigenen Laufzeit-Abhängigkeitsgraphen verantwortlich machen
- Reparaturen durch den Paketmanager zur Laufzeit während des Gateway-Starts vermeiden
- deterministische Installationen bewahren, ohne die Materialisierung nativer
  Pakete für alle Plattformen zu verursachen
- Installationsskripte in den Pfaden für Paketabnahme und Messung deaktiviert lassen
- verschachtelte Abhängigkeitsbäume und explosionsartig zunehmende optionale
  native Abhängigkeiten vor der Veröffentlichung erkennen

Zugehörige Dokumentation:

- [Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution)
- [Plugin-Inventar](/de/plugins/plugin-inventory)
- [Vollständige Versionsvalidierung](/de/reference/full-release-validation)

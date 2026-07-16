---
read_when:
    - Sie möchten QMD als Ihr Speicher-Backend einrichten
    - Sie möchten erweiterte Speicherfunktionen wie Reranking oder zusätzliche indizierte Pfade.
summary: Local-First-Such-Sidecar mit BM25, Vektoren, Reranking und Abfrageerweiterung
title: QMD-Speicher-Engine
x-i18n:
    generated_at: "2026-07-16T12:55:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) ist ein Local-First-Such-Sidecar, der parallel zu
OpenClaw ausgeführt wird. Er kombiniert BM25, Vektorsuche und Reranking in einer einzigen
Binärdatei und kann Inhalte außerhalb der Arbeitsbereich-Speicherdateien indizieren.

## Vorteile gegenüber der integrierten Engine

- **Reranking und Abfrageerweiterung** für eine bessere Trefferquote.
- **Zusätzliche Verzeichnisse indizieren** – Projektdokumentation, Teamnotizen und beliebige Inhalte auf dem Datenträger.
- **Sitzungstranskripte indizieren** – frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** – wird mit dem offiziellen llama.cpp-Provider-Plugin ausgeführt und
  lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** – wenn QMD nicht verfügbar ist, wechselt OpenClaw nahtlos zur
  integrierten Engine.

## Erste Schritte

### Voraussetzungen

- QMD installieren: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- SQLite-Build, der Erweiterungen zulässt (`brew install sqlite` unter macOS).
- QMD muss sich im `PATH` des Gateways befinden.
- macOS und Linux funktionieren ohne weitere Konfiguration. Windows wird am besten über WSL2 unterstützt.

### Aktivieren

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw erstellt unter
`~/.openclaw/agents/<agentId>/qmd/` ein eigenständiges QMD-Basisverzeichnis und verwaltet den Lebenszyklus des Sidecars
automatisch – Sammlungen, Aktualisierungen und Einbettungsläufe werden für Sie abgewickelt.
Es bevorzugt aktuelle QMD-Sammlungs- und MCP-Abfrageformate, greift bei Bedarf jedoch auf
alternative Flags für Sammlungsmuster und ältere MCP-Werkzeugnamen zurück.
Beim Start werden außerdem veraltete verwaltete Sammlungen mit ihren
kanonischen Mustern neu erstellt, wenn noch eine ältere QMD-Sammlung mit demselben Namen
vorhanden ist.

## Funktionsweise des Sidecars

- OpenClaw erstellt Sammlungen aus den Speicherdateien Ihres Arbeitsbereichs und allen
  konfigurierten `memory.qmd.paths`, führt beim Öffnen des QMD-Managers `qmd update`
  und anschließend regelmäßig aus (`memory.qmd.update.interval`, Standard:
  `5m`). Aktualisierungen werden über QMD-Unterprozesse ausgeführt, nicht durch eine
  prozessinterne Dateisystemdurchsuchung. Semantische Suchmodi führen außerdem `qmd embed`
  aus (`memory.qmd.update.embedInterval`, Standard: `60m`).
- Die standardmäßige Arbeitsbereichssammlung verfolgt `MEMORY.md` sowie den `memory/`-Verzeichnisbaum.
  Das kleingeschriebene `memory.md` wird nicht als Stamm-Speicherdatei indiziert.
- Der QMD-eigene Scanner ignoriert verborgene Pfade sowie gängige Abhängigkeits- und Build-
  Verzeichnisse wie `.git`, `.cache`, `node_modules`, `vendor`, `dist` und
  `build`. Beim Start des Gateways wird QMD standardmäßig nicht initialisiert
  (`memory.qmd.update.startup` ist standardmäßig `off`), sodass bei einem Kaltstart weder
  die Speicher-Laufzeitumgebung importiert noch der langlebige Watcher erstellt wird, bevor
  der Speicher erstmals verwendet wird.
- Setzen Sie `memory.qmd.update.startup` auf `idle` oder `immediate`, um QMD
  dennoch beim Start des Gateways zu initialisieren. `memory.qmd.update.onBoot` ist standardmäßig `true` und
  führt die erste Aktualisierung beim Start aus; setzen Sie es auf `false`, um diese
  sofortige Aktualisierung zu überspringen. Der langlebige Manager wird weiterhin geöffnet, wenn Aktualisierungs- oder Einbettungsintervalle
  konfiguriert sind, sodass QMD weiterhin seinen regulären Watcher und seine Timer verwaltet.
- Suchvorgänge verwenden den konfigurierten `searchMode` (Standard: `search`; unterstützt außerdem
  `vsearch` und `query`). `search` verwendet ausschließlich BM25, daher überspringt OpenClaw in diesem Modus
  Bereitschaftsprüfungen für semantische Vektoren und die Pflege von Einbettungen. Wenn ein Modus
  fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn `searchMode` auf `query` gesetzt ist, setzen Sie `memory.qmd.rerank` auf `false`, um
  den hybriden Abfragepfad von QMD ohne Reranker zu verwenden (erfordert QMD 2.1 oder neuer).
  OpenClaw übergibt `--no-rerank` an den direkten QMD-CLI-Pfad und
  `rerank: false` an das MCP-Abfragewerkzeug von QMD.
- Bei QMD-Versionen, die Filter für mehrere Sammlungen ausweisen, fasst OpenClaw
  Sammlungen aus derselben Quelle in einem QMD-Suchaufruf zusammen. Ältere QMD-Versionen
  verwenden weiterhin den kompatiblen Fallback mit einzelnen Sammlungen.
- Wenn QMD vollständig ausfällt, wechselt OpenClaw zur integrierten SQLite-Engine.
  Wiederholte Versuche während Chat-Durchläufen werden nach einem Fehler beim Öffnen kurz verzögert, damit
  eine fehlende Binärdatei oder defekte Sidecar-Abhängigkeit keinen Wiederholungssturm verursacht;
  `openclaw memory status` und einmalige CLI-Prüfungen überprüfen QMD dennoch
  direkt erneut.

<Info>
Die erste Suche kann langsam sein – QMD lädt beim ersten
`qmd query`-Lauf automatisch GGUF-Modelle (~2 GB) für
Reranking und Abfrageerweiterung herunter.
</Info>

## Suchleistung und Kompatibilität

OpenClaw hält den QMD-Suchpfad sowohl mit aktuellen als auch mit älteren QMD-
Installationen kompatibel.

Beim Start prüft OpenClaw den Hilfetext der installierten QMD-Version einmal pro Manager. Wenn
die Binärdatei Unterstützung für mehrere Sammlungsfilter ausweist, durchsucht OpenClaw
alle Sammlungen derselben Quelle mit einem einzigen Befehl:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dadurch muss nicht für jede dauerhafte Speichersammlung ein eigener QMD-Unterprozess gestartet werden.
Sammlungen mit Sitzungstranskripten verbleiben in ihrer eigenen Quellgruppe, sodass gemischte
Suchvorgänge mit `memory` und `sessions` dem Ergebnis-Diversifikator weiterhin Eingaben aus
beiden Quellen liefern.

Ältere QMD-Builds akzeptieren nur einen Sammlungsfilter. Wenn OpenClaw einen
solchen Build erkennt, verwendet es weiterhin den Kompatibilitätspfad und durchsucht jede Sammlung
separat, bevor die Ergebnisse zusammengeführt und dedupliziert werden.

Um den installierten Vertrag manuell zu prüfen, führen Sie Folgendes aus:

```bash
qmd --help | grep -i collection
```

Die Hilfe aktueller QMD-Versionen erwähnt die Ausrichtung auf eine oder mehrere Sammlungen. Die Hilfe älterer Versionen
beschreibt üblicherweise eine einzelne Sammlung.

## Modellüberschreibungen

QMD-Modellumgebungsvariablen werden unverändert vom Gateway-
Prozess weitergegeben, sodass Sie QMD global anpassen können, ohne eine neue OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Führen Sie nach einer Änderung des Einbettungsmodells die Einbettungen erneut aus, damit der Index mit dem
neuen Vektorraum übereinstimmt.

## Zusätzliche Pfade indizieren

Verweisen Sie QMD auf zusätzliche Verzeichnisse, um sie durchsuchbar zu machen:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Ausschnitte aus zusätzlichen Pfaden erscheinen in Suchergebnissen als `qmd/<collection>/<relative-path>`.
`memory_get` versteht dieses Präfix und liest aus dem
korrekten Sammlungsstamm.

## Sitzungstranskripte indizieren

Aktivieren Sie die Sitzungsindizierung, um frühere Unterhaltungen wiederzufinden. QMD benötigt sowohl die
allgemeine Sitzungsquelle `memorySearch` als auch den QMD-Transkriptexporter:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkripte werden als bereinigte Benutzer-/Assistenten-Dialogwechsel in eine dedizierte QMD-
Sammlung unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert. Wenn nur
`memorySearch.experimental.sessionMemory` gesetzt wird, werden keine Transkripte nach
QMD exportiert.

Sitzungstreffer werden weiterhin nach
[`tools.sessions.visibility`](/de/gateway/config-tools#toolssessions) gefiltert. Die
standardmäßige Sichtbarkeit `tree` legt keine unabhängigen Sitzungen desselben Agenten offen. Wenn eine
vom Gateway gestartete Sitzung aus einer separaten Direktnachrichtensitzung wiederauffindbar sein soll,
setzen Sie `tools.sessions.visibility: "agent"` bewusst.

## Suchbereich

Standardmäßig werden QMD-Suchergebnisse nur in direkten Sitzungen angezeigt, nicht
in Gruppen- oder Kanalchats. Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Der obige Ausschnitt entspricht der tatsächlichen Standardregel. Wenn der Bereich eine Suche ablehnt,
protokolliert OpenClaw eine Warnung mit dem abgeleiteten Kanal und Chattyp, damit sich leere
Ergebnisse leichter diagnostizieren lassen.

## Quellenangaben

Wenn `memory.citations` auf `auto` oder `on` gesetzt ist, erhalten Suchausschnitte eine angehängte
Fußzeile `Source: <path>#L<line>` (oder `#L<start>-L<end>`). Im Modus `auto`
wird die Fußzeile nur bei Direktchat-Sitzungen hinzugefügt. Setzen Sie
`memory.citations = "off"`, um die Fußzeile wegzulassen und den Pfad dennoch intern an den
Agenten zu übergeben.

## Einsatzbereiche

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für hochwertigere Ergebnisse.
- Durchsuchen von Projektdokumentation oder Notizen außerhalb des Arbeitsbereichs.
- Wiederfinden früherer Sitzungsunterhaltungen.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Konfigurationen eignet sich die [integrierte Engine](/de/concepts/memory-builtin)
ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass sich die Binärdatei im `PATH` des Gateways befindet. Wenn OpenClaw
als Dienst ausgeführt wird, erstellen Sie einen symbolischen Link:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Wenn `qmd --version` in Ihrer Shell funktioniert, OpenClaw aber weiterhin
`spawn qmd ENOENT` meldet, verwendet der Gateway-Prozess wahrscheinlich einen anderen `PATH` als
Ihre interaktive Shell. Legen Sie die Binärdatei explizit fest:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Verwenden Sie `command -v qmd` in der Umgebung, in der QMD installiert ist, und prüfen Sie anschließend erneut
mit `openclaw memory status --deep`.

**Erste Suche sehr langsam?** QMD lädt bei der ersten Verwendung GGUF-Modelle herunter. Wärmen Sie die Umgebung
mit `qmd query "test"` unter Verwendung derselben XDG-Verzeichnisse vor, die OpenClaw verwendet.

**Viele QMD-Unterprozesse während der Suche?** Aktualisieren Sie QMD nach Möglichkeit. OpenClaw
verwendet bei Suchvorgängen über mehrere Sammlungen derselben Quelle nur dann einen einzigen Prozess, wenn die
installierte QMD-Version Unterstützung für mehrere `-c`-Filter ausweist; andernfalls
wird aus Gründen der Korrektheit weiterhin der ältere Fallback mit einzelnen Sammlungen verwendet.

**Versucht QMD im reinen BM25-Modus weiterhin, llama.cpp zu bauen?** Setzen Sie
`memory.qmd.searchMode = "search"`. OpenClaw behandelt diesen Modus als
rein lexikalisch, überspringt QMD-Vektorstatusprüfungen sowie die Einbettungspflege und
überlässt semantische Bereitschaftsprüfungen Konfigurationen mit `vsearch` oder `query`.

**Zeitüberschreitung bei der Suche?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standard: 4000ms).
Legen Sie für langsamere Hardware einen höheren Wert fest, beispielsweise `120000`. Dieses Limit gilt für
QMD-eigene Suchbefehle während der `memory_search`-Aufrufe des Agenten; Einrichtung, Synchronisierung,
integrierter Fallback und Arbeiten am ergänzenden Korpus behalten ihre eigenen kürzeren Fristen bei.

**Leere Ergebnisse in Gruppen- oder Kanalchats?** Dies entspricht dem erwarteten Verhalten beim
standardmäßigen `memory.qmd.scope`, das nur direkte Sitzungen zulässt. Fügen Sie eine
`allow`-Regel für die Chattypen `group` oder `channel` hinzu, wenn dort QMD-Ergebnisse
angezeigt werden sollen.

**Ist die Suche im Stammspeicher plötzlich zu weit gefasst?** Starten Sie das Gateway neu oder warten Sie
bis zur nächsten Abstimmung beim Start. OpenClaw erstellt veraltete verwaltete
Sammlungen mit den kanonischen Mustern `MEMORY.md` und `memory/` neu, wenn ein
Konflikt mit demselben Namen erkannt wird.

**Verursachen im Arbeitsbereich sichtbare temporäre Repositorys `ENAMETOOLONG` oder eine fehlerhafte Indizierung?**
Die QMD-Durchsuchung folgt dem zugrunde liegenden QMD-Scanner und nicht den
integrierten Symlink-Regeln von OpenClaw. Bewahren Sie temporäre Monorepository-Checkouts in verborgenen
Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Stammverzeichnisse auf, bis QMD
zyklussichere Durchsuchung oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Aktualisierungsintervalle,
Bereichsregeln und alle weiteren Optionen finden Sie in der
[Referenz zur Speicherkonfiguration](/de/reference/memory-config).

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Integrierte Speicher-Engine](/de/concepts/memory-builtin)
- [Honcho-Speicher](/de/concepts/memory-honcho)

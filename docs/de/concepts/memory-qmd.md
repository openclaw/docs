---
read_when:
    - Sie möchten QMD als Ihr Speicher-Backend einrichten
    - Sie möchten erweiterte Speicherfunktionen wie Reranking oder zusätzliche indizierte Pfade.
summary: Local-First-Such-Sidecar mit BM25, Vektoren, Reranking und Abfrageerweiterung
title: QMD-Speicher-Engine
x-i18n:
    generated_at: "2026-07-12T01:36:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) ist ein lokal ausgeführter Such-Sidecar, der
zusammen mit OpenClaw läuft. Er kombiniert BM25, Vektorsuche und Reranking in
einer einzigen Binärdatei und kann Inhalte über die Speicherdateien Ihres
Arbeitsbereichs hinaus indizieren.

## Vorteile gegenüber der integrierten Lösung

- **Reranking und Abfrageerweiterung** für eine bessere Trefferquote.
- **Zusätzliche Verzeichnisse indizieren** – Projektdokumentation, Teamnotizen
  und beliebige andere Inhalte auf dem Datenträger.
- **Sitzungstranskripte indizieren** – frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** – läuft mit dem offiziellen llama.cpp-Provider-Plugin
  und lädt GGUF-Modelle automatisch herunter.
- **Automatischer Rückgriff** – wenn QMD nicht verfügbar ist, greift OpenClaw
  nahtlos auf die integrierte Engine zurück.

## Erste Schritte

### Voraussetzungen

- Installieren Sie QMD: `npm install -g @tobilu/qmd` oder
  `bun install -g @tobilu/qmd`
- Eine SQLite-Version, die Erweiterungen zulässt (`brew install sqlite` unter
  macOS).
- QMD muss im `PATH` des Gateways verfügbar sein.
- macOS und Linux funktionieren ohne weitere Anpassungen. Windows wird am
  besten über WSL2 unterstützt.

### Aktivieren

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw erstellt unter `~/.openclaw/agents/<agentId>/qmd/` ein
eigenständiges QMD-Ausgangsverzeichnis und verwaltet den Lebenszyklus des
Sidecars automatisch – Sammlungen, Aktualisierungen und
Embedding-Durchläufe werden für Sie ausgeführt. Es bevorzugt die aktuellen
Formate für QMD-Sammlungen und MCP-Abfragen, greift bei Bedarf jedoch auf
alternative Flags für Sammlungsmuster und ältere Namen von MCP-Werkzeugen
zurück. Die Abstimmung beim Start stellt außerdem veraltete verwaltete
Sammlungen mit ihren kanonischen Mustern neu her, wenn noch eine ältere
QMD-Sammlung mit demselben Namen vorhanden ist.

## Funktionsweise des Sidecars

- OpenClaw erstellt Sammlungen aus den Speicherdateien Ihres Arbeitsbereichs
  und allen konfigurierten `memory.qmd.paths`. Anschließend führt es beim
  Öffnen des QMD-Managers und danach regelmäßig `qmd update` aus
  (`memory.qmd.update.interval`, Standardwert `5m`). Aktualisierungen erfolgen
  über QMD-Unterprozesse und nicht durch eine prozessinterne Durchsuchung des
  Dateisystems. Semantische Suchmodi führen außerdem `qmd embed` aus
  (`memory.qmd.update.embedInterval`, Standardwert `60m`).
- Die standardmäßige Arbeitsbereichssammlung erfasst `MEMORY.md` sowie den
  Verzeichnisbaum `memory/`. Die kleingeschriebene Datei `memory.md` wird
  nicht als Stammspeicherdatei indiziert.
- Der QMD-eigene Scanner ignoriert verborgene Pfade und gängige Abhängigkeits-
  und Build-Verzeichnisse wie `.git`, `.cache`, `node_modules`, `vendor`,
  `dist` und `build`. Beim Start des Gateways wird QMD standardmäßig nicht
  initialisiert (`memory.qmd.update.startup` ist standardmäßig `off`). Dadurch
  werden beim Kaltstart weder die Speicherlaufzeit importiert noch der
  langlebige Beobachter erstellt, bevor der Speicher erstmals verwendet wird.
- Setzen Sie `memory.qmd.update.startup` auf `idle` oder `immediate`, um QMD
  dennoch beim Start des Gateways zu initialisieren.
  `memory.qmd.update.onBoot` ist standardmäßig `true` und führt die erste
  Aktualisierung beim Start aus. Setzen Sie den Wert auf `false`, um diese
  sofortige Aktualisierung zu überspringen. Der langlebige Manager wird
  weiterhin geöffnet, wenn Aktualisierungs- oder Embedding-Intervalle
  konfiguriert sind, sodass QMD seine regulären Beobachter und Zeitgeber
  weiterhin selbst verwaltet.
- Suchvorgänge verwenden den konfigurierten `searchMode` (Standardwert:
  `search`; unterstützt werden außerdem `vsearch` und `query`). `search`
  verwendet ausschließlich BM25. Daher überspringt OpenClaw in diesem Modus
  Prüfungen der semantischen Vektorbereitschaft und die Pflege der Embeddings.
  Wenn ein Modus fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn `searchMode` auf `query` gesetzt ist, setzen Sie `memory.qmd.rerank`
  auf `false`, um den hybriden Abfragepfad von QMD ohne den Reranker zu
  verwenden. Dies erfordert QMD 2.1 oder neuer. OpenClaw übergibt
  `--no-rerank` an den direkten QMD-CLI-Pfad und `rerank: false` an das
  MCP-Abfragewerkzeug von QMD.
- Bei QMD-Versionen, die Filter für mehrere Sammlungen ausweisen, fasst
  OpenClaw Sammlungen derselben Quelle in einem einzigen QMD-Suchaufruf
  zusammen. Ältere QMD-Versionen verwenden weiterhin den kompatiblen
  Rückgriff mit einem Aufruf je Sammlung.
- Wenn QMD vollständig ausfällt, greift OpenClaw auf die integrierte
  SQLite-Engine zurück. Wiederholte Versuche während Chat-Durchläufen werden
  nach einem Öffnungsfehler kurz verzögert, damit eine fehlende Binärdatei
  oder eine defekte Sidecar-Abhängigkeit keinen Sturm von Wiederholungsversuchen
  auslöst. `openclaw memory status` und einmalige CLI-Prüfungen überprüfen QMD
  weiterhin direkt erneut.

<Info>
Die erste Suche kann langsam sein – QMD lädt beim ersten Durchlauf von
`qmd query` automatisch GGUF-Modelle (ca. 2 GB) für Reranking und
Abfrageerweiterung herunter.
</Info>

## Suchleistung und Kompatibilität

OpenClaw hält den QMD-Suchpfad sowohl mit aktuellen als auch mit älteren
QMD-Installationen kompatibel.

Beim Start prüft OpenClaw den Hilfetext der installierten QMD-Version einmal
pro Manager. Wenn die Binärdatei Unterstützung für mehrere Sammlungsfilter
ausweist, durchsucht OpenClaw alle Sammlungen derselben Quelle mit einem
einzigen Befehl:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dadurch muss nicht für jede Sammlung des dauerhaften Speichers ein eigener
QMD-Unterprozess gestartet werden. Sammlungen von Sitzungstranskripten bleiben
in einer eigenen Quellgruppe. Dadurch liefern gemischte Suchvorgänge über
`memory` und `sessions` dem Ergebnis-Diversifikator weiterhin Eingaben aus
beiden Quellen.

Ältere QMD-Versionen akzeptieren nur einen Sammlungsfilter. Wenn OpenClaw eine
solche Version erkennt, behält es den Kompatibilitätspfad bei und durchsucht
jede Sammlung einzeln, bevor die Ergebnisse zusammengeführt und von Duplikaten
bereinigt werden.

Führen Sie den folgenden Befehl aus, um den installierten Vertrag manuell zu
prüfen:

```bash
qmd --help | grep -i collection
```

Die Hilfe aktueller QMD-Versionen erwähnt die Auswahl einer oder mehrerer
Sammlungen. Die Hilfe älterer Versionen beschreibt üblicherweise eine einzelne
Sammlung.

## Modellüberschreibungen

QMD-Modellumgebungsvariablen werden vom Gateway-Prozess unverändert
weitergegeben. Dadurch können Sie QMD global anpassen, ohne eine neue
OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Führen Sie nach einer Änderung des Embedding-Modells die Embeddings erneut
aus, damit der Index dem neuen Vektorraum entspricht.

## Zusätzliche Pfade indizieren

Verweisen Sie QMD auf zusätzliche Verzeichnisse, damit deren Inhalte
durchsuchbar werden:

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

Ausschnitte aus zusätzlichen Pfaden erscheinen in den Suchergebnissen als
`qmd/<collection>/<relative-path>`. `memory_get` versteht dieses Präfix und
liest aus dem richtigen Stammverzeichnis der Sammlung.

## Sitzungstranskripte indizieren

Aktivieren Sie die Sitzungsindizierung, um frühere Unterhaltungen
wiederzufinden. QMD benötigt sowohl die allgemeine Sitzungsquelle
`memorySearch` als auch den QMD-Transkriptexport:

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

Transkripte werden als bereinigte Benutzer-/Assistentenbeiträge in eine
dedizierte QMD-Sammlung unter `~/.openclaw/agents/<id>/qmd/sessions/`
exportiert. Wenn nur `memorySearch.experimental.sessionMemory` gesetzt wird,
werden keine Transkripte in QMD exportiert.

Sitzungstreffer werden weiterhin anhand von
[`tools.sessions.visibility`](/de/gateway/config-tools#toolssessions) gefiltert.
Die standardmäßige Sichtbarkeit `tree` gibt keine nicht zugehörigen Sitzungen
desselben Agenten frei. Wenn eine vom Gateway vermittelte Sitzung aus einer
separaten Direktnachrichtensitzung abrufbar sein soll, setzen Sie
`tools.sessions.visibility: "agent"` bewusst.

## Suchbereich

Standardmäßig werden QMD-Suchergebnisse nur in direkten Sitzungen angezeigt,
nicht in Gruppen- oder Kanalchats. Konfigurieren Sie `memory.qmd.scope`, um
dies zu ändern:

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

Der vorstehende Ausschnitt entspricht der tatsächlichen Standardregel. Wenn
der Suchbereich eine Suche verweigert, protokolliert OpenClaw eine Warnung mit
dem abgeleiteten Kanal- und Chattyp, damit sich leere Ergebnisse leichter
diagnostizieren lassen.

## Quellenangaben

Wenn `memory.citations` auf `auto` oder `on` gesetzt ist, wird an
Suchausschnitte eine Fußzeile im Format `Source: <path>#L<line>` oder
`#L<start>-L<end>` angehängt. Im Modus `auto` wird die Fußzeile nur bei
direkten Chatsitzungen hinzugefügt. Setzen Sie `memory.citations = "off"`, um
die Fußzeile wegzulassen, während der Pfad intern weiterhin an den Agenten
übergeben wird.

## Einsatzbereiche

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für hochwertigere Ergebnisse.
- Durchsuchbare Projektdokumentation oder Notizen außerhalb des
  Arbeitsbereichs.
- Zugriff auf Unterhaltungen aus früheren Sitzungen.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Konfigurationen eignet sich die
[integrierte Engine](/de/concepts/memory-builtin) gut und benötigt keine
zusätzlichen Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass die Binärdatei im `PATH` des
Gateways verfügbar ist. Wenn OpenClaw als Dienst ausgeführt wird, erstellen Sie
einen symbolischen Link:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Wenn `qmd --version` in Ihrer Shell funktioniert, OpenClaw aber weiterhin
`spawn qmd ENOENT` meldet, verwendet der Gateway-Prozess wahrscheinlich einen
anderen `PATH` als Ihre interaktive Shell. Geben Sie den Pfad zur Binärdatei
explizit an:

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

Verwenden Sie `command -v qmd` in der Umgebung, in der QMD installiert ist,
und prüfen Sie anschließend erneut mit `openclaw memory status --deep`.

**Erste Suche sehr langsam?** QMD lädt bei der ersten Verwendung GGUF-Modelle
herunter. Wärmen Sie QMD mit `qmd query "test"` vor und verwenden Sie dabei
dieselben XDG-Verzeichnisse wie OpenClaw.

**Viele QMD-Unterprozesse während der Suche?** Aktualisieren Sie QMD, sofern
möglich. OpenClaw verwendet bei Suchvorgängen über mehrere Sammlungen derselben
Quelle nur dann einen einzigen Prozess, wenn die installierte QMD-Version
Unterstützung für mehrere `-c`-Filter ausweist. Andernfalls behält es aus
Gründen der Korrektheit den älteren Rückgriff mit einem Prozess je Sammlung
bei.

**Versucht QMD trotz reinem BM25-Modus weiterhin, llama.cpp zu erstellen?**
Setzen Sie `memory.qmd.searchMode = "search"`. OpenClaw behandelt diesen Modus
als rein lexikalisch, überspringt QMD-Prüfungen des Vektorstatus sowie die
Pflege der Embeddings und überlässt Prüfungen der semantischen Bereitschaft
den Konfigurationen `vsearch` oder `query`.

**Zeitüberschreitung bei der Suche?** Erhöhen Sie
`memory.qmd.limits.timeoutMs` (Standardwert: `4000ms`). Setzen Sie den Wert für
langsamere Hardware beispielsweise auf `120000`.

**Leere Ergebnisse in Gruppen- oder Kanalchats?** Dies entspricht dem
erwarteten Verhalten mit dem standardmäßigen `memory.qmd.scope`, der nur
direkte Sitzungen zulässt. Fügen Sie eine `allow`-Regel für die Chattypen
`group` oder `channel` hinzu, wenn dort QMD-Ergebnisse angezeigt werden
sollen.

**Die Suche im Stammspeicher ist plötzlich zu umfassend?** Starten Sie das
Gateway neu oder warten Sie auf die nächste Abstimmung beim Start. OpenClaw
stellt veraltete verwaltete Sammlungen mit den kanonischen Mustern `MEMORY.md`
und `memory/` neu her, wenn es einen Namenskonflikt erkennt.

**Verursachen im Arbeitsbereich sichtbare temporäre Repositorys
`ENAMETOOLONG` oder eine fehlerhafte Indizierung?** Die QMD-Durchquerung folgt
dem zugrunde liegenden QMD-Scanner und nicht den integrierten
Symlink-Regeln von OpenClaw. Bewahren Sie temporäre Monorepository-Checkouts in
verborgenen Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Wurzeln
auf, bis QMD eine zyklussichere Durchquerung oder explizite
Ausschlussmöglichkeiten bereitstellt.

## Konfiguration

Die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi,
Aktualisierungsintervalle, Bereichsregeln und alle weiteren Optionen finden Sie
in der [Referenz zur Speicherkonfiguration](/de/reference/memory-config).

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Integrierte Speicher-Engine](/de/concepts/memory-builtin)
- [Honcho-Speicher](/de/concepts/memory-honcho)

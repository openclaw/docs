---
read_when:
    - Sie möchten QMD als Ihr Speicher-Backend einrichten
    - Sie möchten erweiterte Speicherfunktionen wie Reranking oder zusätzliche indizierte Pfade.
summary: Local-First-Such-Sidecar mit BM25, Vektoren, Reranking und Abfrageerweiterung
title: QMD-Speicher-Engine
x-i18n:
    generated_at: "2026-07-12T15:14:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) ist ein Local-First-Such-Sidecar, der
zusammen mit OpenClaw ausgeführt wird. Er kombiniert BM25, Vektorsuche und Reranking in einer einzigen
Binärdatei und kann Inhalte außerhalb der Memory-Dateien Ihres Workspace indizieren.

## Vorteile gegenüber der integrierten Lösung

- **Reranking und Abfrageerweiterung** für eine bessere Trefferquote.
- **Zusätzliche Verzeichnisse indizieren** – Projektdokumentation, Teamnotizen und beliebige Inhalte auf dem Datenträger.
- **Sitzungstranskripte indizieren** – frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** – wird mit dem offiziellen llama.cpp-Provider-Plugin ausgeführt und
  lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** – wenn QMD nicht verfügbar ist, wechselt OpenClaw
  nahtlos zur integrierten Engine.

## Erste Schritte

### Voraussetzungen

- Installieren Sie QMD: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- Eine SQLite-Version, die Erweiterungen zulässt (`brew install sqlite` unter macOS).
- QMD muss im `PATH` des Gateways verfügbar sein.
- macOS und Linux funktionieren ohne weitere Konfiguration. Unter Windows wird WSL2 am besten unterstützt.

### Aktivieren

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw erstellt eine eigenständige QMD-Umgebung unter
`~/.openclaw/agents/<agentId>/qmd/` und verwaltet den Lebenszyklus des Sidecars
automatisch – Sammlungen, Aktualisierungen und Embedding-Läufe werden für Sie verwaltet.
Dabei werden aktuelle QMD-Sammlungs- und MCP-Abfrageformate bevorzugt; bei Bedarf wird jedoch auf
alternative Flags für Sammlungsmuster und ältere MCP-Werkzeugnamen zurückgegriffen.
Die Abstimmung beim Start setzt außerdem veraltete verwaltete Sammlungen wieder auf ihre
kanonischen Muster zurück, wenn noch eine ältere QMD-Sammlung mit demselben Namen
vorhanden ist.

## Funktionsweise des Sidecars

- OpenClaw erstellt Sammlungen aus den Memory-Dateien Ihres Workspace und allen
  konfigurierten `memory.qmd.paths`. Anschließend wird `qmd update` ausgeführt, wenn der QMD-Manager
  geöffnet wird, sowie danach in regelmäßigen Abständen (`memory.qmd.update.interval`, Standardwert
  `5m`). Aktualisierungen erfolgen über QMD-Unterprozesse und nicht durch eine
  dateisystemweite Suche innerhalb des Prozesses. Semantische Suchmodi führen außerdem `qmd embed`
  aus (`memory.qmd.update.embedInterval`, Standardwert `60m`).
- Die standardmäßige Workspace-Sammlung erfasst `MEMORY.md` sowie den Verzeichnisbaum
  `memory/`. Die kleingeschriebene Datei `memory.md` wird nicht als Memory-Stammdatei indiziert.
- Der QMD-eigene Scanner ignoriert versteckte Pfade und übliche Abhängigkeits- und Build-
  Verzeichnisse wie `.git`, `.cache`, `node_modules`, `vendor`, `dist` und
  `build`. Beim Start des Gateways wird QMD standardmäßig nicht initialisiert
  (`memory.qmd.update.startup` hat standardmäßig den Wert `off`), sodass bei einem Kaltstart
  weder die Memory-Laufzeitumgebung importiert noch der langlebige Watcher erstellt wird, bevor
  Memory erstmals verwendet wird.
- Setzen Sie `memory.qmd.update.startup` auf `idle` oder `immediate`, um QMD
  dennoch beim Start des Gateways zu initialisieren. `memory.qmd.update.onBoot` ist standardmäßig `true` und
  führt die erste Aktualisierung beim Start aus. Setzen Sie den Wert auf `false`, um diese
  sofortige Aktualisierung zu überspringen (der langlebige Manager wird weiterhin geöffnet, wenn Aktualisierungs- oder Embedding-
  Intervalle konfiguriert sind, sodass QMD weiterhin seinen regulären Watcher und seine Timer verwaltet).
- Suchvorgänge verwenden den konfigurierten `searchMode` (Standardwert: `search`; unterstützt werden außerdem
  `vsearch` und `query`). `search` verwendet ausschließlich BM25, daher überspringt OpenClaw in diesem Modus
  Bereitschaftsprüfungen für semantische Vektoren und die Embedding-Verwaltung. Wenn ein Modus
  fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn `searchMode` auf `query` gesetzt ist, setzen Sie `memory.qmd.rerank` auf `false`, um
  den hybriden Abfragepfad von QMD ohne Reranker zu verwenden (erfordert QMD 2.1 oder neuer).
  OpenClaw übergibt `--no-rerank` an den direkten QMD-CLI-Pfad und
  `rerank: false` an das MCP-Abfragewerkzeug von QMD.
- Bei QMD-Versionen, die Filter für mehrere Sammlungen unterstützen, gruppiert OpenClaw
  Sammlungen derselben Quelle in einem einzigen QMD-Suchaufruf. Ältere QMD-Versionen
  verwenden weiterhin den kompatiblen Fallback mit einem Aufruf pro Sammlung.
- Wenn QMD vollständig ausfällt, wechselt OpenClaw zur integrierten SQLite-Engine.
  Wiederholte Versuche bei Chat-Durchläufen werden nach einem Öffnungsfehler kurz verzögert, damit eine
  fehlende Binärdatei oder eine defekte Sidecar-Abhängigkeit keinen Sturm von Wiederholungsversuchen verursacht.
  `openclaw memory status` und einmalige CLI-Prüfungen überprüfen QMD jedoch weiterhin
  direkt.

<Info>
Die erste Suche kann langsam sein – QMD lädt beim ersten Lauf von `qmd query`
automatisch GGUF-Modelle (~2 GB) für Reranking und Abfrageerweiterung herunter.
</Info>

## Suchleistung und Kompatibilität

OpenClaw hält den QMD-Suchpfad sowohl mit aktuellen als auch mit älteren QMD-
Installationen kompatibel.

Beim Start prüft OpenClaw den Hilfetext der installierten QMD-Version einmal pro Manager. Wenn
die Binärdatei Unterstützung für mehrere Sammlungsfilter angibt, durchsucht OpenClaw
alle Sammlungen derselben Quelle mit einem einzigen Befehl:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Dadurch muss nicht für jede Sammlung des dauerhaften Memory ein eigener QMD-Unterprozess gestartet werden.
Sammlungen von Sitzungstranskripten verbleiben in ihrer eigenen Quellengruppe, sodass gemischte
Suchvorgänge über `memory` und `sessions` dem Ergebnis-Diversifikator weiterhin Eingaben aus
beiden Quellen liefern.

Ältere QMD-Builds akzeptieren nur einen Sammlungsfilter. Wenn OpenClaw einen
solchen Build erkennt, behält es den Kompatibilitätspfad bei und durchsucht jede Sammlung
separat, bevor die Ergebnisse zusammengeführt und dedupliziert werden.

Um den installierten Vertrag manuell zu prüfen, führen Sie Folgendes aus:

```bash
qmd --help | grep -i collection
```

Die Hilfe aktueller QMD-Versionen erwähnt die Auswahl einer oder mehrerer Sammlungen. Ältere Hilfetexte
beschreiben üblicherweise eine einzelne Sammlung.

## Modellüberschreibungen

Umgebungsvariablen für QMD-Modelle werden unverändert vom Gateway-
Prozess weitergegeben. Dadurch können Sie QMD global anpassen, ohne eine neue OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Führen Sie nach einer Änderung des Embedding-Modells die Embeddings erneut aus, damit der Index zum
neuen Vektorraum passt.

## Zusätzliche Pfade indizieren

Verweisen Sie QMD auf zusätzliche Verzeichnisse, um deren Inhalte durchsuchbar zu machen:

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

Ausschnitte aus zusätzlichen Pfaden werden in Suchergebnissen als
`qmd/<collection>/<relative-path>` angezeigt. `memory_get` versteht dieses Präfix und liest aus dem
richtigen Sammlungsstamm.

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

Transkripte werden als bereinigte Benutzer-/Assistenten-Dialogbeiträge in eine eigene QMD-
Sammlung unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert. Wenn nur
`memorySearch.experimental.sessionMemory` gesetzt wird, werden keine Transkripte nach
QMD exportiert.

Sitzungstreffer werden weiterhin anhand von
[`tools.sessions.visibility`](/de/gateway/config-tools#toolssessions) gefiltert. Die
standardmäßige Sichtbarkeit `tree` legt keine unabhängigen Sitzungen desselben Agenten offen. Wenn eine
vom Gateway gestartete Sitzung aus einer separaten DM-Sitzung auffindbar sein soll,
setzen Sie `tools.sessions.visibility: "agent"` bewusst.

## Suchbereich

Standardmäßig werden QMD-Suchergebnisse nur in direkten Sitzungen angezeigt (nicht
in Gruppen- oder Kanalchats). Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

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

Der obige Ausschnitt entspricht der tatsächlichen Standardregel. Wenn der Suchbereich eine Suche verweigert,
protokolliert OpenClaw eine Warnung mit dem abgeleiteten Kanal und Chattyp, damit sich
leere Ergebnisse leichter diagnostizieren lassen.

## Quellenangaben

Wenn `memory.citations` auf `auto` oder `on` gesetzt ist, wird Suchausschnitten eine
Fußzeile `Source: <path>#L<line>` (oder `#L<start>-L<end>`) angehängt. Im Modus `auto`
wird die Fußzeile nur für direkte Chatsitzungen hinzugefügt. Setzen Sie
`memory.citations = "off"`, um die Fußzeile wegzulassen, während der Pfad intern weiterhin an
den Agenten übergeben wird.

## Verwendungsszenarien

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für hochwertigere Ergebnisse.
- Die Suche in Projektdokumentation oder Notizen außerhalb des Workspace.
- Das Wiederfinden früherer Sitzungsunterhaltungen.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Einrichtungen eignet sich die [integrierte Engine](/de/concepts/memory-builtin)
gut und benötigt keine zusätzlichen Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass die Binärdatei im `PATH` des Gateways verfügbar ist. Wenn OpenClaw
als Dienst ausgeführt wird, erstellen Sie einen symbolischen Link:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Wenn `qmd --version` in Ihrer Shell funktioniert, OpenClaw jedoch weiterhin
`spawn qmd ENOENT` meldet, verwendet der Gateway-Prozess wahrscheinlich einen anderen `PATH` als
Ihre interaktive Shell. Geben Sie die Binärdatei explizit an:

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

Verwenden Sie `command -v qmd` in der Umgebung, in der QMD installiert ist, und prüfen Sie anschließend
erneut mit `openclaw memory status --deep`.

**Erste Suche sehr langsam?** QMD lädt bei der ersten Verwendung GGUF-Modelle herunter. Wärmen Sie
das System mit `qmd query "test"` vor und verwenden Sie dabei dieselben XDG-Verzeichnisse wie OpenClaw.

**Viele QMD-Unterprozesse während der Suche?** Aktualisieren Sie QMD nach Möglichkeit. OpenClaw
verwendet für Suchen über mehrere Sammlungen derselben Quelle nur dann einen einzigen Prozess, wenn die
installierte QMD-Version Unterstützung für mehrere `-c`-Filter angibt. Andernfalls
wird aus Gründen der Korrektheit der ältere Fallback mit einem Prozess pro Sammlung beibehalten.

**Versucht ausschließlich BM25 verwendendes QMD weiterhin, llama.cpp zu bauen?** Setzen Sie
`memory.qmd.searchMode = "search"`. OpenClaw behandelt diesen Modus als
rein lexikalisch, überspringt QMD-Vektorstatusprüfungen und die Embedding-Verwaltung und
überlässt semantische Bereitschaftsprüfungen den Konfigurationen `vsearch` oder `query`.

**Zeitüberschreitung bei der Suche?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standardwert:
4000ms). Setzen Sie den Wert für langsamere Hardware beispielsweise auf `120000`.

**Leere Ergebnisse in Gruppen- oder Kanalchats?** Dies ist beim
standardmäßigen `memory.qmd.scope` zu erwarten, der nur direkte Sitzungen zulässt. Fügen Sie eine
`allow`-Regel für die Chattypen `group` oder `channel` hinzu, wenn Sie dort QMD-Ergebnisse
verwenden möchten.

**Die Suche im Stamm-Memory ist plötzlich zu weit gefasst?** Starten Sie das Gateway neu oder warten Sie
auf die nächste Abstimmung beim Start. OpenClaw setzt veraltete verwaltete
Sammlungen wieder auf die kanonischen Muster `MEMORY.md` und `memory/` zurück, wenn es
einen Namenskonflikt erkennt.

**Verursachen im Workspace sichtbare temporäre Repositorys `ENAMETOOLONG` oder eine fehlerhafte Indizierung?**
Die QMD-Traversierung folgt dem zugrunde liegenden QMD-Scanner und nicht den
integrierten Symlink-Regeln von OpenClaw. Bewahren Sie temporäre Monorepo-Checkouts unter versteckten
Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Stammverzeichnisse auf, bis QMD
eine zyklussichere Traversierung oder explizite Ausschlussoptionen bereitstellt.

## Konfiguration

Die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Aktualisierungsintervalle,
Bereichsregeln und alle weiteren Optionen finden Sie in der
[Memory-Konfigurationsreferenz](/de/reference/memory-config).

## Verwandte Themen

- [Memory-Übersicht](/de/concepts/memory)
- [Integrierte Memory-Engine](/de/concepts/memory-builtin)
- [Honcho Memory](/de/concepts/memory-honcho)

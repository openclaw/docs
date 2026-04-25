---
read_when:
    - Sie möchten QMD als Ihr Memory-Backend einrichten
    - Sie möchten erweiterte Memory-Funktionen wie Reranking oder zusätzliche indizierte Pfade
summary: Lokaler Search-Sidecar mit BM25, Vektoren, Reranking und Query-Expansion zuerst
title: QMD-Memory-Engine
x-i18n:
    generated_at: "2026-04-25T13:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) ist ein lokaler Search-Sidecar, der
neben OpenClaw läuft. Er kombiniert BM25, Vektorsuche und Reranking in einer
einzigen Binärdatei und kann Inhalte über die Memory-Dateien Ihres Workspace hinaus indizieren.

## Was es gegenüber builtin ergänzt

- **Reranking und Query-Expansion** für besseren Recall.
- **Zusätzliche Verzeichnisse indizieren** -- Projektdokumentation, Teamnotizen, alles auf der Festplatte.
- **Sitzungstranskripte indizieren** -- frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** -- läuft mit dem optionalen Runtime-Paket `node-llama-cpp` und
  lädt GGUF-Modelle automatisch herunter.
- **Automatische Ausweichoption** -- wenn QMD nicht verfügbar ist, fällt OpenClaw nahtlos auf die
  builtin-Engine zurück.

## Erste Schritte

### Voraussetzungen

- QMD installieren: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- SQLite-Build, das Extensions erlaubt (`brew install sqlite` unter macOS).
- QMD muss sich im `PATH` des Gateway befinden.
- macOS und Linux funktionieren sofort. Windows wird am besten über WSL2 unterstützt.

### Aktivieren

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw erstellt ein eigenständiges QMD-Home unter
`~/.openclaw/agents/<agentId>/qmd/` und verwaltet den Lebenszyklus des Sidecar
automatisch -- Collections, Updates und Embedding-Läufe werden für Sie verwaltet.
Es bevorzugt aktuelle Shapes für QMD-Collection und MCP-Abfragen, fällt aber bei Bedarf weiterhin auf
veraltete Collection-Flags `--mask` und ältere MCP-Tool-Namen zurück.
Die Abgleichslogik beim Start erstellt außerdem veraltete verwaltete Collections wieder gemäß ihren
kanonischen Mustern neu, wenn noch eine ältere QMD-Collection mit demselben Namen vorhanden ist.

## Wie der Sidecar funktioniert

- OpenClaw erstellt Collections aus den Memory-Dateien Ihres Workspace und allen
  konfigurierten `memory.qmd.paths`, führt dann beim Start
  und periodisch (standardmäßig alle 5 Minuten) `qmd update` + `qmd embed` aus.
- Die standardmäßige Workspace-Collection verfolgt `MEMORY.md` sowie den Baum `memory/`.
  Kleingeschriebenes `memory.md` wird nicht als Root-Memory-Datei indiziert.
- Die Aktualisierung beim Start läuft im Hintergrund, damit der Chat-Start nicht blockiert wird.
- Suchen verwenden den konfigurierten `searchMode` (Standard: `search`; unterstützt auch
  `vsearch` und `query`). Wenn ein Modus fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn QMD vollständig fehlschlägt, fällt OpenClaw auf die builtin-SQLite-Engine zurück.

<Info>
Die erste Suche kann langsam sein -- QMD lädt beim ersten `qmd query`-Lauf
GGUF-Modelle (~2 GB) für Reranking und Query-Expansion automatisch herunter.
</Info>

## Modell-Überschreibungen

QMD-Modell-Umgebungsvariablen werden unverändert vom Gateway-
Prozess durchgereicht, sodass Sie QMD global abstimmen können, ohne neue OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Nachdem Sie das Embedding-Modell geändert haben, führen Sie die Embeddings erneut aus, damit der Index
zum neuen Vektorraum passt.

## Zusätzliche Pfade indizieren

Richten Sie QMD auf zusätzliche Verzeichnisse, um sie durchsuchbar zu machen:

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

Ausschnitte aus zusätzlichen Pfaden erscheinen als `qmd/<collection>/<relative-path>` in
Suchergebnissen. `memory_get` versteht dieses Präfix und liest aus dem richtigen
Collection-Root.

## Sitzungstranskripte indizieren

Aktivieren Sie Sitzungsindizierung, um frühere Unterhaltungen wiederzufinden:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkripte werden als bereinigte User-/Assistant-Turns in eine dedizierte QMD-
Collection unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert.

## Suchbereich

Standardmäßig werden QMD-Suchergebnisse in direkten Sitzungen und Kanalsitzungen
(nicht in Gruppen) bereitgestellt. Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

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

Wenn der Bereich eine Suche verweigert, protokolliert OpenClaw eine Warnung mit dem abgeleiteten Kanal und
Chat-Typ, damit leere Ergebnisse leichter zu debuggen sind.

## Quellenangaben

Wenn `memory.citations` auf `auto` oder `on` gesetzt ist, enthalten Suchausschnitte eine
Fußzeile `Source: <path#line>`. Setzen Sie `memory.citations = "off"`, um die Fußzeile
wegzulassen, während der Pfad intern weiterhin an den Agenten übergeben wird.

## Wann verwenden

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für höherwertige Ergebnisse.
- Suche in Projektdokumentation oder Notizen außerhalb des Workspace.
- Wiederfinden vergangener Sitzungsunterhaltungen.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Setups funktioniert die [builtin-Engine](/de/concepts/memory-builtin) gut
ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass sich die Binärdatei im `PATH` des Gateway befindet. Wenn OpenClaw
als Service läuft, erstellen Sie einen Symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Erste Suche sehr langsam?** QMD lädt GGUF-Modelle bei der ersten Verwendung herunter. Wärmen Sie vor
mit `qmd query "test"` unter Verwendung derselben XDG-Verzeichnisse, die OpenClaw nutzt.

**Suche läuft in Timeout?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standard: 4000ms).
Setzen Sie es bei langsamerer Hardware auf `120000`.

**Leere Ergebnisse in Gruppenchats?** Prüfen Sie `memory.qmd.scope` -- standardmäßig werden nur
direkte Sitzungen und Kanalsitzungen zugelassen.

**Die Root-Memory-Suche wurde plötzlich zu breit?** Starten Sie das Gateway neu oder warten Sie auf den
nächsten Startabgleich. OpenClaw erstellt veraltete verwaltete Collections wieder mit den
kanonischen Mustern `MEMORY.md` und `memory/`, wenn ein Konflikt mit demselben Namen erkannt wird.

**Temporäre Repos, die im Workspace sichtbar sind, verursachen `ENAMETOOLONG` oder fehlerhafte Indizierung?**
Die Traversierung von QMD folgt derzeit dem zugrunde liegenden Scanner-Verhalten von QMD statt
den builtin-Symlink-Regeln von OpenClaw. Halten Sie temporäre Monorepo-Checkouts unter
versteckten Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Roots, bis QMD
zyklussichere Traversierung oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Für die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Update-Intervalle,
Bereichsregeln und alle anderen Einstellungen siehe die
[Memory configuration reference](/de/reference/memory-config).

## Verwandt

- [Memory overview](/de/concepts/memory)
- [Builtin memory engine](/de/concepts/memory-builtin)
- [Honcho memory](/de/concepts/memory-honcho)

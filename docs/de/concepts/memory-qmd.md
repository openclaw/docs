---
read_when:
    - Sie möchten QMD als Ihr Speicher-Backend einrichten
    - Sie möchten erweiterte Speicherfunktionen wie Reranking oder zusätzliche indizierte Pfade nutzen
summary: Lokaler Search-Sidecar mit BM25, Vektoren, Reranking und Abfrageerweiterung
title: QMD-Speicher-Engine
x-i18n:
    generated_at: "2026-04-06T03:06:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36642c7df94b88f562745dd2270334379f2aeeef4b363a8c13ef6be42dadbe5c
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# QMD-Speicher-Engine

[QMD](https://github.com/tobi/qmd) ist ein lokaler Search-Sidecar, der
neben OpenClaw ausgeführt wird. Er kombiniert BM25, Vektorsuche und Reranking in
einer einzigen Binärdatei und kann Inhalte über die Speicherdateien Ihres Workspaces hinaus
indizieren.

## Was es zusätzlich zur builtin-Engine bietet

- **Reranking und Abfrageerweiterung** für besseren Recall.
- **Zusätzliche Verzeichnisse indizieren** -- Projektdokumentation, Teamnotizen, alles auf der Festplatte.
- **Sitzungstranskripte indizieren** -- frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** -- läuft über Bun + node-llama-cpp, lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** -- wenn QMD nicht verfügbar ist, fällt OpenClaw nahtlos auf die
  builtin-Engine zurück.

## Erste Schritte

### Voraussetzungen

- QMD installieren: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- SQLite-Build, das Erweiterungen zulässt (`brew install sqlite` unter macOS).
- QMD muss im `PATH` des Gateways liegen.
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
`~/.openclaw/agents/<agentId>/qmd/` und verwaltet den Lebenszyklus des Sidecars
automatisch -- Sammlungen, Updates und Embedding-Läufe werden für Sie verarbeitet.
Es bevorzugt die aktuellen QMD-Sammlungs- und MCP-Abfrageformen, fällt aber bei Bedarf weiterhin auf
veraltete Sammlungs-Flags vom Typ `--mask` und ältere MCP-Tool-Namen zurück.

## So funktioniert der Sidecar

- OpenClaw erstellt Sammlungen aus den Speicherdateien Ihres Workspaces und allen
  konfigurierten `memory.qmd.paths`, und führt dann `qmd update` + `qmd embed` beim Start
  und regelmäßig aus (standardmäßig alle 5 Minuten).
- Die Aktualisierung beim Start läuft im Hintergrund, damit der Chat-Start nicht blockiert wird.
- Suchen verwenden den konfigurierten `searchMode` (Standard: `search`; unterstützt auch
  `vsearch` und `query`). Wenn ein Modus fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn QMD vollständig fehlschlägt, fällt OpenClaw auf die builtin-SQLite-Engine zurück.

<Info>
Die erste Suche kann langsam sein -- QMD lädt GGUF-Modelle (~2 GB) für
Reranking und Abfrageerweiterung beim ersten Lauf von `qmd query` automatisch herunter.
</Info>

## Modell-Überschreibungen

QMD-Modell-Umgebungsvariablen werden unverändert aus dem Gateway-Prozess
durchgereicht, sodass Sie QMD global abstimmen können, ohne neue OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Nachdem Sie das Embedding-Modell geändert haben, führen Sie die Embeddings erneut aus, damit der Index mit dem
neuen Vektorraum übereinstimmt.

## Zusätzliche Pfade indizieren

Zeigen Sie QMD auf zusätzliche Verzeichnisse, damit diese durchsuchbar werden:

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

Snippets aus zusätzlichen Pfaden erscheinen als `qmd/<collection>/<relative-path>` in
Suchergebnissen. `memory_get` versteht dieses Präfix und liest aus dem richtigen
Sammlungsstamm.

## Sitzungstranskripte indizieren

Aktivieren Sie die Sitzungsindizierung, um frühere Unterhaltungen wiederzufinden:

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
Sammlung unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert.

## Suchbereich

Standardmäßig werden QMD-Suchergebnisse nur in DM-Sitzungen angezeigt (nicht in Gruppen oder
Kanälen). Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

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

## Zitate

Wenn `memory.citations` auf `auto` oder `on` gesetzt ist, enthalten Such-Snippets einen
Footer vom Typ `Source: <path#line>`. Setzen Sie `memory.citations = "off"`, um den Footer wegzulassen,
während der Pfad intern weiterhin an den Agenten übergeben wird.

## Wann Sie es verwenden sollten

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für qualitativ hochwertigere Ergebnisse.
- Suche in Projektdokumentation oder Notizen außerhalb des Workspaces.
- Wiederfinden vergangener Sitzungsunterhaltungen.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Setups funktioniert die [builtin-Engine](/de/concepts/memory-builtin) gut
ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass sich die Binärdatei im `PATH` des Gateways befindet. Wenn OpenClaw
als Dienst ausgeführt wird, erstellen Sie einen Symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Erste Suche sehr langsam?** QMD lädt GGUF-Modelle bei der ersten Verwendung herunter. Wärmen Sie dies vor
mit `qmd query "test"` unter Verwendung derselben XDG-Verzeichnisse, die OpenClaw nutzt.

**Zeitüberschreitung bei der Suche?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standard: 4000ms).
Setzen Sie den Wert bei langsamerer Hardware auf `120000`.

**Leere Ergebnisse in Gruppenchats?** Prüfen Sie `memory.qmd.scope` -- standardmäßig sind nur
DM-Sitzungen erlaubt.

**Temporäre Repositories, die im Workspace sichtbar sind, verursachen `ENAMETOOLONG` oder fehlerhafte Indizierung?**
Die QMD-Durchquerung folgt derzeit dem zugrunde liegenden Verhalten des QMD-Scanners statt
den builtin-Symlink-Regeln von OpenClaw. Bewahren Sie temporäre Monorepo-Checkouts unter
versteckten Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Wurzeln auf, bis QMD
zyklussichere Durchquerung oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Für die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Aktualisierungsintervalle,
Bereichsregeln und alle anderen Optionen siehe die
[Referenz zur Speicherkonfiguration](/de/reference/memory-config).

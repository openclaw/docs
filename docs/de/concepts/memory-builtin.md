---
read_when:
    - Sie möchten das standardmäßige Speicher-Backend verstehen
    - Sie möchten Embedding-Provider oder die hybride Suche konfigurieren
summary: Das standardmäßige SQLite-basierte Speicher-Backend mit Schlüsselwort-, Vektor- und Hybridsuche
title: Integrierte Speicher-Engine
x-i18n:
    generated_at: "2026-04-30T06:48:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Die integrierte Engine ist das standardmäßige Speicher-Backend. Sie speichert Ihren Speicherindex in
einer SQLite-Datenbank pro Agent und benötigt für den Einstieg keine zusätzlichen Abhängigkeiten.

## Was sie bietet

- **Schlüsselwortsuche** über FTS5-Volltextindizierung (BM25-Scoring).
- **Vektorsuche** über Embeddings von jedem unterstützten Provider.
- **Hybridsuche**, die beides für die besten Ergebnisse kombiniert.
- **CJK-Unterstützung** über Trigramm-Tokenisierung für Chinesisch, Japanisch und Koreanisch.
- **sqlite-vec-Beschleunigung** für Vektorabfragen innerhalb der Datenbank (optional).

## Erste Schritte

Wenn Sie einen API-Schlüssel für OpenAI, Gemini, Voyage, Mistral oder DeepInfra haben, erkennt die integrierte
Engine ihn automatisch und aktiviert die Vektorsuche. Keine Konfiguration erforderlich.

So legen Sie einen Provider explizit fest:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Ohne Embedding-Provider ist nur die Schlüsselwortsuche verfügbar.

Um den integrierten lokalen Embedding-Provider zu erzwingen, installieren Sie das optionale
Runtime-Paket `node-llama-cpp` neben OpenClaw und verweisen Sie dann `local.modelPath`
auf eine GGUF-Datei:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Unterstützte Embedding-Provider

| Provider  | ID          | Automatisch erkannt | Hinweise                             |
| --------- | ----------- | ------------------- | ------------------------------------ |
| OpenAI    | `openai`    | Ja                  | Standard: `text-embedding-3-small`   |
| Gemini    | `gemini`    | Ja                  | Unterstützt multimodal (Bild + Audio) |
| Voyage    | `voyage`    | Ja                  |                                      |
| Mistral   | `mistral`   | Ja                  |                                      |
| DeepInfra | `deepinfra` | Ja                  | Standard: `BAAI/bge-m3`              |
| Ollama    | `ollama`    | Nein                | Lokal, explizit festlegen            |
| Lokal     | `local`     | Ja (zuerst)         | Optionale `node-llama-cpp`-Runtime   |

Die automatische Erkennung wählt den ersten Provider aus, dessen API-Schlüssel aufgelöst werden kann, in der
angezeigten Reihenfolge. Legen Sie `memorySearch.provider` fest, um dies zu überschreiben.

## Funktionsweise der Indizierung

OpenClaw indiziert `MEMORY.md` und `memory/*.md` in Chunks (~400 Tokens mit
80-Token-Überlappung) und speichert sie in einer SQLite-Datenbank pro Agent.

- **Indexspeicherort:** `~/.openclaw/memory/<agentId>.sqlite`
- **Speicherwartung:** SQLite-WAL-Sidecars werden durch regelmäßige und
  Shutdown-Checkpoints begrenzt.
- **Dateiüberwachung:** Änderungen an Speicherdateien lösen eine entprellte Neuindizierung aus (1,5 s).
- **Automatische Neuindizierung:** Wenn sich der Embedding-Provider, das Modell oder die Chunking-Konfiguration
  ändert, wird der gesamte Index automatisch neu aufgebaut.
- **Neuindizierung bei Bedarf:** `openclaw memory index --force`

<Info>
Sie können auch Markdown-Dateien außerhalb des Workspace mit
`memorySearch.extraPaths` indizieren. Siehe die
[Konfigurationsreferenz](/de/reference/memory-config#additional-memory-paths).
</Info>

## Wann verwenden

Die integrierte Engine ist für die meisten Benutzer die richtige Wahl:

- Funktioniert ohne zusätzliche Abhängigkeiten sofort.
- Beherrscht Schlüsselwort- und Vektorsuche gut.
- Unterstützt alle Embedding-Provider.
- Hybridsuche kombiniert das Beste aus beiden Retrieval-Ansätzen.

Ziehen Sie einen Wechsel zu [QMD](/de/concepts/memory-qmd) in Betracht, wenn Sie Reranking oder Query
Expansion benötigen oder Verzeichnisse außerhalb des Workspace indizieren möchten.

Ziehen Sie [Honcho](/de/concepts/memory-honcho) in Betracht, wenn Sie sitzungsübergreifenden Speicher mit
automatischer Benutzermodellierung wünschen.

## Fehlerbehebung

**Speichersuche deaktiviert?** Prüfen Sie `openclaw memory status`. Wenn kein Provider
erkannt wird, legen Sie einen explizit fest oder fügen Sie einen API-Schlüssel hinzu.

**Lokaler Provider nicht erkannt?** Bestätigen Sie, dass der lokale Pfad existiert, und führen Sie aus:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sowohl eigenständige CLI-Befehle als auch der Gateway verwenden dieselbe `local`-Provider-ID.
Wenn der Provider auf `auto` gesetzt ist, werden lokale Embeddings nur zuerst berücksichtigt,
wenn `memorySearch.local.modelPath` auf eine vorhandene lokale Datei verweist.

**Veraltete Ergebnisse?** Führen Sie `openclaw memory index --force` aus, um neu aufzubauen. Der Watcher
kann Änderungen in seltenen Randfällen übersehen.

**sqlite-vec wird nicht geladen?** OpenClaw fällt automatisch auf prozessinterne Kosinusähnlichkeit zurück.
Prüfen Sie die Protokolle auf den konkreten Ladefehler.

## Konfiguration

Informationen zur Einrichtung von Embedding-Providern, Abstimmung der Hybridsuche (Gewichtungen, MMR, zeitlicher
Zerfall), Batch-Indizierung, multimodalem Speicher, sqlite-vec, zusätzlichen Pfaden und allen
weiteren Konfigurationsoptionen finden Sie in der
[Speicherkonfigurationsreferenz](/de/reference/memory-config).

## Verwandt

- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Active memory](/de/concepts/active-memory)

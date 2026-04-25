---
read_when:
    - Sie möchten das standardmäßige Memory-Backend verstehen.
    - Sie möchten Embedding-Anbieter oder die Hybridsuche konfigurieren.
summary: Das standardmäßige SQLite-basierte Memory-Backend mit Schlüsselwort-, Vektor- und Hybridsuche
title: Integrierte Memory-Engine
x-i18n:
    generated_at: "2026-04-25T13:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Die integrierte Engine ist das standardmäßige Memory-Backend. Sie speichert Ihren Memory-Index in
einer agent-spezifischen SQLite-Datenbank und benötigt keine zusätzlichen Abhängigkeiten für den Einstieg.

## Was sie bietet

- **Schlüsselwortsuche** über FTS5-Volltextindizierung (BM25-Bewertung).
- **Vektorsuche** über Embeddings von jedem unterstützten Anbieter.
- **Hybridsuche**, die beides für die besten Ergebnisse kombiniert.
- **CJK-Unterstützung** über Trigramm-Tokenisierung für Chinesisch, Japanisch und Koreanisch.
- **sqlite-vec-Beschleunigung** für Vektorabfragen in der Datenbank (optional).

## Erste Schritte

Wenn Sie einen API-Schlüssel für OpenAI, Gemini, Voyage oder Mistral haben, erkennt die integrierte
Engine ihn automatisch und aktiviert die Vektorsuche. Keine Konfiguration erforderlich.

Um einen Anbieter explizit festzulegen:

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

Ohne einen Embedding-Anbieter ist nur die Schlüsselwortsuche verfügbar.

Um den integrierten lokalen Embedding-Anbieter zu erzwingen, installieren Sie das optionale
`node-llama-cpp`-Laufzeitpaket neben OpenClaw und verweisen Sie dann `local.modelPath`
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

## Unterstützte Embedding-Anbieter

| Anbieter | ID        | Automatisch erkannt | Hinweise                            |
| -------- | --------- | ------------------- | ----------------------------------- |
| OpenAI   | `openai`  | Ja                  | Standard: `text-embedding-3-small`  |
| Gemini   | `gemini`  | Ja                  | Unterstützt Multimodalität (Bild + Audio) |
| Voyage   | `voyage`  | Ja                  |                                     |
| Mistral  | `mistral` | Ja                  |                                     |
| Ollama   | `ollama`  | Nein                | Lokal, explizit festlegen           |
| Local    | `local`   | Ja (zuerst)         | Optionale `node-llama-cpp`-Laufzeit |

Die automatische Erkennung wählt den ersten Anbieter, dessen API-Schlüssel aufgelöst werden kann, in der
angegebenen Reihenfolge. Setzen Sie `memorySearch.provider`, um dies zu überschreiben.

## So funktioniert die Indizierung

OpenClaw indiziert `MEMORY.md` und `memory/*.md` in Blöcke (~400 Token mit
80-Token-Überlappung) und speichert sie in einer agent-spezifischen SQLite-Datenbank.

- **Index-Speicherort:** `~/.openclaw/memory/<agentId>.sqlite`
- **Dateiüberwachung:** Änderungen an Memory-Dateien lösen eine entprellte Neuindizierung aus (1,5 s).
- **Automatische Neuindizierung:** Wenn sich der Embedding-Anbieter, das Modell oder die Chunking-Konfiguration
  ändert, wird der gesamte Index automatisch neu erstellt.
- **Neuindizierung bei Bedarf:** `openclaw memory index --force`

<Info>
Sie können auch Markdown-Dateien außerhalb des Workspace mit
`memorySearch.extraPaths` indizieren. Siehe die
[Konfigurationsreferenz](/de/reference/memory-config#additional-memory-paths).
</Info>

## Wann sie verwendet werden sollte

Die integrierte Engine ist für die meisten Benutzer die richtige Wahl:

- Funktioniert sofort ohne zusätzliche Abhängigkeiten.
- Beherrscht Schlüsselwort- und Vektorsuche gut.
- Unterstützt alle Embedding-Anbieter.
- Die Hybridsuche kombiniert das Beste beider Retrieval-Ansätze.

Erwägen Sie einen Wechsel zu [QMD](/de/concepts/memory-qmd), wenn Sie Reranking, Query
Expansion benötigen oder Verzeichnisse außerhalb des Workspace indizieren möchten.

Erwägen Sie [Honcho](/de/concepts/memory-honcho), wenn Sie sessionübergreifendes Memory mit
automatischer Benutzermodellierung möchten.

## Fehlerbehebung

**Memory-Suche deaktiviert?** Prüfen Sie `openclaw memory status`. Wenn kein Anbieter
erkannt wird, legen Sie einen explizit fest oder fügen Sie einen API-Schlüssel hinzu.

**Lokaler Anbieter nicht erkannt?** Bestätigen Sie, dass der lokale Pfad existiert, und führen Sie aus:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sowohl eigenständige CLI-Befehle als auch das Gateway verwenden dieselbe `local`-Anbieter-ID.
Wenn der Anbieter auf `auto` gesetzt ist, werden lokale Embeddings nur dann zuerst berücksichtigt,
wenn `memorySearch.local.modelPath` auf eine vorhandene lokale Datei verweist.

**Veraltete Ergebnisse?** Führen Sie `openclaw memory index --force` aus, um den Index neu zu erstellen. Die Überwachung
kann Änderungen in seltenen Randfällen verpassen.

**sqlite-vec wird nicht geladen?** OpenClaw greift automatisch auf Cosinus-Ähnlichkeit im Prozess zurück. Prüfen Sie die Logs auf den konkreten Ladefehler.

## Konfiguration

Für die Einrichtung von Embedding-Anbietern, die Feinabstimmung der Hybridsuche (Gewichte, MMR, zeitlicher
Decay), Batch-Indizierung, multimodales Memory, sqlite-vec, zusätzliche Pfade und alle
anderen Konfigurationsoptionen siehe die
[Memory-Konfigurationsreferenz](/de/reference/memory-config).

## Verwandt

- [Memory-Überblick](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Active Memory](/de/concepts/active-memory)

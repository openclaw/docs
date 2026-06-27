---
read_when:
    - Sie möchten das standardmäßige Speicher-Backend verstehen
    - Sie möchten Embedding-Provider oder hybride Suche konfigurieren
summary: Das standardmäßige SQLite-basierte Memory-Backend mit Keyword-, Vektor- und Hybridsuche
title: Integrierte Memory-Engine
x-i18n:
    generated_at: "2026-06-27T17:23:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Die integrierte Engine ist das standardmäßige Speicher-Backend. Sie speichert Ihren Speicherindex in
einer agentbezogenen SQLite-Datenbank und benötigt für den Einstieg keine zusätzlichen Abhängigkeiten.

## Was sie bietet

- **Schlüsselwortsuche** über FTS5-Volltextindizierung (BM25-Bewertung).
- **Vektorsuche** über Embeddings von jedem unterstützten Provider.
- **Hybridsuche**, die beides für die besten Ergebnisse kombiniert.
- **CJK-Unterstützung** über Trigramm-Tokenisierung für Chinesisch, Japanisch und Koreanisch.
- **sqlite-vec-Beschleunigung** für Vektorabfragen in der Datenbank (optional).

## Erste Schritte

Standardmäßig verwendet die integrierte Engine OpenAI-Embeddings. Wenn Sie bereits
`OPENAI_API_KEY` oder `models.providers.openai.apiKey` konfiguriert haben, funktioniert die Vektorsuche
ohne zusätzliche Speicherkonfiguration.

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

Um lokale GGUF-Embeddings zu erzwingen, installieren Sie das offizielle llama.cpp-Provider-Plugin
und verweisen Sie dann mit `local.modelPath` auf eine GGUF-Datei:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

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

| Provider          | ID                  | Hinweise                            |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | Verwendet die AWS-Anmeldeinformationskette |
| DeepInfra         | `deepinfra`         | Standard: `BAAI/bge-m3`             |
| Gemini            | `gemini`            | Unterstützt multimodal (Bild + Audio) |
| GitHub Copilot    | `github-copilot`    | Verwendet ein Copilot-Abonnement    |
| Lokal             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | Lokal/selbst gehostet               |
| OpenAI            | `openai`            | Standard: `text-embedding-3-small`  |
| OpenAI-kompatibel | `openai-compatible` | Generischer `/v1/embeddings`-Endpunkt |
| Voyage            | `voyage`            |                                     |

Setzen Sie `memorySearch.provider`, um von OpenAI wegzuwechseln.

## So funktioniert die Indizierung

OpenClaw indiziert `MEMORY.md` und `memory/*.md` in Chunks (~400 Token mit
80-Token-Überlappung) und speichert sie in einer agentbezogenen SQLite-Datenbank.

- **Indexspeicherort:** die Datenbank des zuständigen Agenten unter
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Speicherwartung:** SQLite-WAL-Sidecars werden durch periodische Checkpoints und
  Checkpoints beim Herunterfahren begrenzt.
- **Dateiüberwachung:** Änderungen an Speicherdateien lösen eine entprellte Neuindizierung aus (1,5 s).
- **Automatische Neuindizierung:** Wenn sich der Embedding-Provider, das Modell oder die Chunking-Konfiguration
  ändert, wird der gesamte Index automatisch neu aufgebaut.
- **Neuindizierung bei Bedarf:** `openclaw memory index --force`

<Info>
Sie können mit `memorySearch.extraPaths` auch Markdown-Dateien außerhalb des Arbeitsbereichs indizieren. Siehe die
[Konfigurationsreferenz](/de/reference/memory-config#additional-memory-paths).
</Info>

## Wann verwenden

Die integrierte Engine ist für die meisten Benutzer die richtige Wahl:

- Funktioniert sofort ohne zusätzliche Abhängigkeiten.
- Beherrscht Schlüsselwort- und Vektorsuche zuverlässig.
- Unterstützt alle Embedding-Provider.
- Die Hybridsuche kombiniert das Beste aus beiden Retrieval-Ansätzen.

Erwägen Sie den Wechsel zu [QMD](/de/concepts/memory-qmd), wenn Sie Reranking, Abfrageerweiterung
benötigen oder Verzeichnisse außerhalb des Arbeitsbereichs indizieren möchten.

Erwägen Sie [Honcho](/de/concepts/memory-honcho), wenn Sie sitzungsübergreifenden Speicher mit
automatischer Benutzermodellierung wünschen.

## Fehlerbehebung

**Speichersuche deaktiviert?** Prüfen Sie `openclaw memory status`. Wenn kein Provider
erkannt wird, legen Sie einen explizit fest oder fügen Sie einen API-Schlüssel hinzu.

**Lokaler Provider nicht erkannt?** Bestätigen Sie, dass der lokale Pfad vorhanden ist, und führen Sie aus:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sowohl eigenständige CLI-Befehle als auch der Gateway verwenden dieselbe `local`-Provider-ID.
Setzen Sie `memorySearch.provider: "local"`, wenn Sie lokale Embeddings verwenden möchten.

**Veraltete Ergebnisse?** Führen Sie `openclaw memory index --force` aus, um den Index neu aufzubauen. Der Watcher
kann Änderungen in seltenen Randfällen übersehen.

**sqlite-vec wird nicht geladen?** OpenClaw weicht automatisch auf prozessinterne Kosinusähnlichkeit aus.
`openclaw memory status --deep` meldet den lokalen Vektorspeicher getrennt vom Embedding-Provider, sodass `Vector store: unavailable` auf das Laden von sqlite-vec hinweist, während `Embeddings: unavailable` auf Provider-/Auth-Probleme
oder die Modellbereitschaft hinweist. Prüfen Sie die Logs auf den konkreten Ladefehler.

## Konfiguration

Informationen zur Einrichtung von Embedding-Providern, Feinabstimmung der Hybridsuche (Gewichte, MMR, zeitlicher
Verfall), Batch-Indizierung, multimodalem Speicher, sqlite-vec, zusätzlichen Pfaden und allen
anderen Konfigurationsoptionen finden Sie in der
[Memory-Konfigurationsreferenz](/de/reference/memory-config).

## Verwandt

- [Memory-Übersicht](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Active Memory](/de/concepts/active-memory)

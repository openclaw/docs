---
read_when:
    - Sie möchten das standardmäßige Speicher-Backend verstehen
    - Sie möchten Embedding-Provider oder die hybride Suche konfigurieren
summary: Das standardmäßige SQLite-basierte Memory-Backend mit Schlüsselwort-, Vektor- und Hybridsuche
title: Integrierte Memory-Engine
x-i18n:
    generated_at: "2026-07-12T15:17:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Die integrierte Engine ist das standardmäßige Memory-Backend. Sie speichert Ihren Memory-Index
in einer SQLite-Datenbank pro Agent und benötigt für den
Einstieg keine zusätzlichen Abhängigkeiten.

## Funktionsumfang

- **Schlüsselwortsuche** über FTS5-Volltextindizierung (BM25-Bewertung).
- **Vektorsuche** über Embeddings eines beliebigen unterstützten Providers.
- **Hybridsuche**, die beide Ansätze kombiniert, um optimale Ergebnisse zu erzielen.
- **CJK-Unterstützung** über Trigramm-Tokenisierung für Chinesisch, Japanisch und Koreanisch.
- **sqlite-vec-Beschleunigung** für Vektorabfragen innerhalb der Datenbank (optional).

## Erste Schritte

Standardmäßig verwendet die integrierte Engine OpenAI-Embeddings. Wenn `OPENAI_API_KEY` oder
`models.providers.openai.apiKey` bereits konfiguriert ist, funktioniert die Vektorsuche
ohne zusätzliche Memory-Konfiguration.

So legen Sie explizit einen Provider fest:

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

Ohne einen Embedding-Provider ist nur die Schlüsselwortsuche verfügbar.

Um lokale GGUF-Embeddings zu erzwingen, installieren Sie das offizielle llama.cpp-Provider-
Plugin und verweisen Sie anschließend mit `local.modelPath` auf eine GGUF-Datei:

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

| Provider          | ID                  | Hinweise                                  |
| ----------------- | ------------------- | ----------------------------------------- |
| Bedrock           | `bedrock`           | Verwendet die AWS-Anmeldedatenkette       |
| DeepInfra         | `deepinfra`         | Standard: `BAAI/bge-m3`                   |
| Gemini            | `gemini`            | Unterstützt Multimodalität (Bild + Audio) |
| GitHub Copilot    | `github-copilot`    | Verwendet Ihr Copilot-Abonnement          |
| LM Studio         | `lmstudio`          | Lokal/selbst gehostet                      |
| Lokal             | `local`             | `@openclaw/llama-cpp-provider`            |
| Mistral           | `mistral`           |                                           |
| Ollama            | `ollama`            | Lokal/selbst gehostet                      |
| OpenAI            | `openai`            | Standard: `text-embedding-3-small`         |
| OpenAI-kompatibel | `openai-compatible` | Generischer `/v1/embeddings`-Endpunkt     |
| Voyage            | `voyage`            |                                           |

Legen Sie `memorySearch.provider` fest, um von OpenAI zu einem anderen Provider zu wechseln.

## Funktionsweise der Indizierung

OpenClaw indiziert `MEMORY.md` und `memory/*.md` in Abschnitten (standardmäßig 400 Token mit
einer Überlappung von 80 Token) und speichert sie in einer SQLite-Datenbank pro Agent.

- **Indexspeicherort:** die Datenbank des zuständigen Agenten unter
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Speicherverwaltung:** SQLite-WAL-Begleitdateien werden durch regelmäßige
  Checkpoints und Checkpoints beim Herunterfahren begrenzt.
- **Dateiüberwachung:** Änderungen an Memory-Dateien lösen eine verzögerte Neuindizierung
  aus (standardmäßig 1,5 Sekunden).
- **Automatische Neuindizierung:** Der Index wird automatisch neu aufgebaut, wenn sich
  Embedding-Provider, Modell, Abschnittskonfiguration, konfigurierte Quellen oder Geltungsbereich ändern.
- **Neuindizierung bei Bedarf:** `openclaw memory index --force`

<Info>
Sie können mit `memorySearch.extraPaths` auch Markdown-Dateien außerhalb des Arbeitsbereichs
indizieren. Weitere Informationen finden Sie in der
[Konfigurationsreferenz](/de/reference/memory-config#additional-memory-paths).
</Info>

## Verwendungsszenarien

Die integrierte Engine ist für die meisten Benutzer die richtige Wahl:

- Funktioniert sofort und ohne zusätzliche Abhängigkeiten.
- Bietet eine leistungsfähige Schlüsselwort- und Vektorsuche.
- Unterstützt alle Embedding-Provider.
- Die Hybridsuche vereint die Vorteile beider Suchansätze.

Erwägen Sie einen Wechsel zu [QMD](/de/concepts/memory-qmd), wenn Sie eine Neusortierung, eine
Abfrageerweiterung oder die Indizierung von Verzeichnissen außerhalb des Arbeitsbereichs benötigen.

Erwägen Sie [Honcho](/de/concepts/memory-honcho), wenn Sie sitzungsübergreifendes Memory
mit automatischer Benutzermodellierung wünschen.

## Fehlerbehebung

**Memory-Suche deaktiviert?** Überprüfen Sie `openclaw memory status`. Wenn kein Provider
erkannt wird, legen Sie explizit einen fest oder fügen Sie einen API-Schlüssel hinzu.

**Lokaler Provider nicht erkannt?** Vergewissern Sie sich, dass der lokale Pfad vorhanden ist, und führen Sie Folgendes aus:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sowohl eigenständige CLI-Befehle als auch das Gateway verwenden dieselbe `local`-Provider-ID.
Legen Sie `memorySearch.provider: "local"` fest, wenn Sie lokale Embeddings verwenden möchten.

**Veraltete Ergebnisse?** Führen Sie `openclaw memory index --force` aus, um den Index neu aufzubauen. Die Überwachung
kann in seltenen Grenzfällen Änderungen übersehen.

**sqlite-vec wird nicht geladen?** OpenClaw greift automatisch auf die prozessinterne Kosinus-
Ähnlichkeit zurück. `openclaw memory status --deep` meldet den lokalen
Vektorspeicher getrennt vom Embedding-Provider. Daher verweist `Vector store:
unavailable` auf das Laden von sqlite-vec, während `Embeddings: unavailable`
auf die Bereitschaft des Providers, der Authentifizierung oder des Modells verweist. Prüfen Sie die Protokolle auf den konkreten Ladefehler.

## Konfiguration

Informationen zur Einrichtung von Embedding-Providern, zur Optimierung der Hybridsuche (Gewichtungen, MMR, zeitlicher
Abfall), zur Batch-Indizierung, zu multimodalem Memory, sqlite-vec, zusätzlichen Pfaden und allen
anderen Konfigurationsoptionen finden Sie in der
[Memory-Konfigurationsreferenz](/de/reference/memory-config).

## Verwandte Themen

- [Memory-Übersicht](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Active Memory](/de/concepts/active-memory)

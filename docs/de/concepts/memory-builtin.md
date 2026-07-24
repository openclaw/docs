---
read_when:
    - Sie möchten das standardmäßige Speicher-Backend verstehen
    - Sie möchten Embedding-Provider oder die hybride Suche konfigurieren
summary: Das standardmäßige SQLite-basierte Speicher-Backend mit Schlüsselwort-, Vektor- und Hybridsuche
title: Integrierte Memory-Engine
x-i18n:
    generated_at: "2026-07-24T03:45:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3efb6f1449d9b55717b3c117444ba7d4519d0111b842b48790ad85551511433
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Die integrierte Engine ist das standardmäßige Memory-Backend. Sie speichert Ihren Memory-Index
in einer SQLite-Datenbank pro Agent und benötigt keine zusätzlichen Abhängigkeiten für den
Einstieg.

## Funktionsumfang

- **Schlüsselwortsuche** über FTS5-Volltextindizierung (BM25-Bewertung).
- **Vektorsuche** über Embeddings von jedem unterstützten Provider.
- **Hybridsuche**, die beide Ansätze für optimale Ergebnisse kombiniert.
- **CJK-Unterstützung** über Trigramm-Tokenisierung für Chinesisch, Japanisch und Koreanisch.
- **sqlite-vec-Beschleunigung** für Vektorabfragen innerhalb der Datenbank (optional).

## Erste Schritte

Standardmäßig verwendet die integrierte Engine OpenAI-Embeddings. Wenn `OPENAI_API_KEY` oder
`models.providers.openai.apiKey` bereits konfiguriert ist, funktioniert die Vektorsuche
ohne zusätzliche Memory-Konfiguration.

So legen Sie einen Provider ausdrücklich fest:

```json5
{
  memory: {
    search: {
      provider: "openai",
    },
  },
}
```

Ohne Embedding-Provider ist nur die Schlüsselwortsuche verfügbar.

Um lokale GGUF-Embeddings zu erzwingen, installieren Sie das offizielle llama.cpp-Provider-
Plugin und verweisen Sie anschließend mit `local.modelPath` auf eine GGUF-Datei:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  memory: {
    search: {
      provider: "local",
      fallback: "none",
      local: {
        modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
      },
    },
  },
}
```

## Unterstützte Embedding-Provider

| Provider          | ID                  | Hinweise                                    |
| ----------------- | ------------------- | ------------------------------------------- |
| Bedrock           | `bedrock`           | Verwendet die AWS-Anmeldedatenkette         |
| DeepInfra         | `deepinfra`         | Standard: `BAAI/bge-m3`                     |
| Gemini            | `gemini`            | Unterstützt multimodale Daten (Bild + Audio) |
| GitHub Copilot    | `github-copilot`    | Verwendet Ihr Copilot-Abonnement            |
| LM Studio         | `lmstudio`          | Lokal/selbst gehostet                        |
| Local             | `local`             | `@openclaw/llama-cpp-provider`             |
| Mistral           | `mistral`           |                                             |
| Ollama            | `ollama`            | Lokal/selbst gehostet                        |
| OpenAI            | `openai`            | Standard: `text-embedding-3-small`          |
| OpenAI-kompatibel | `openai-compatible` | Generischer `/v1/embeddings`-Endpunkt          |
| Voyage            | `voyage`            |                                             |

Legen Sie `memory.search.provider` fest, um von OpenAI zu einem anderen Provider zu wechseln.

## Funktionsweise der Indizierung

OpenClaw unterteilt `MEMORY.md` und `memory/*.md` in Abschnitte (standardmäßig 400 Token mit
einer Überlappung von 80 Token) und speichert sie in einer SQLite-Datenbank pro Agent.

- **Indexspeicherort:** die Datenbank des zuständigen Agenten unter
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Speicherwartung:** SQLite-WAL-Begleitdateien werden durch regelmäßige Checkpoints und
  Checkpoints beim Herunterfahren begrenzt.
- **Dateiüberwachung:** Änderungen an Memory-Dateien lösen eine entprellte Neuindizierung aus
  (Standard: 1,5 s).
- **Automatische Neuindizierung:** Der Index wird automatisch neu aufgebaut, wenn sich der Embedding-
  Provider, das Modell, die Abschnittskonfiguration, die konfigurierten Quellen oder der Geltungsbereich ändern.
- **Neuindizierung bei Bedarf:** `openclaw memory index --force`

<Info>
Sie können mit `memory.search.extraPaths` auch Markdown-Dateien außerhalb des Arbeitsbereichs
indizieren. Weitere Informationen finden Sie in der
[Konfigurationsreferenz](/de/reference/memory-config#additional-memory-paths).
</Info>

## Einsatzempfehlung

Die integrierte Engine ist für die meisten Benutzer die richtige Wahl:

- Funktioniert sofort und ohne zusätzliche Abhängigkeiten.
- Bewältigt Schlüsselwort- und Vektorsuchen zuverlässig.
- Unterstützt alle Embedding-Provider.
- Die Hybridsuche vereint die Vorteile beider Abrufansätze.

Erwägen Sie einen Wechsel zu [QMD](/de/concepts/memory-qmd), wenn Sie eine Neusortierung, Abfrageerweiterung
oder die Indizierung von Verzeichnissen außerhalb des Arbeitsbereichs benötigen.

Erwägen Sie [Honcho](/de/concepts/memory-honcho), wenn Sie sitzungsübergreifendes Memory
mit automatischer Benutzermodellierung wünschen.

## Fehlerbehebung

**Memory-Suche deaktiviert?** Prüfen Sie `openclaw memory status`. Wenn kein Provider
erkannt wird, legen Sie ausdrücklich einen fest oder fügen Sie einen API-Schlüssel hinzu.

**Lokaler Provider nicht erkannt?** Vergewissern Sie sich, dass der lokale Pfad existiert, und führen Sie Folgendes aus:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sowohl eigenständige CLI-Befehle als auch das Gateway verwenden dieselbe Provider-ID `local`.
Legen Sie `memory.search.provider: "local"` fest, wenn Sie lokale Embeddings verwenden möchten.

**Veraltete Ergebnisse?** Führen Sie `openclaw memory index --force` aus, um den Index neu aufzubauen. Die Dateiüberwachung
kann in seltenen Grenzfällen Änderungen übersehen.

**sqlite-vec wird nicht geladen?** OpenClaw greift automatisch auf die prozessinterne Kosinus-
Ähnlichkeit zurück. `openclaw memory status --deep` meldet den lokalen
Vektorspeicher getrennt vom Embedding-Provider, sodass `Vector store:
unavailable` auf das Laden von sqlite-vec verweist, während `Embeddings: unavailable`
auf die Bereitschaft des Providers, der Authentifizierung oder des Modells verweist. Suchen Sie in den Protokollen nach dem konkreten Ladefehler.

## Konfiguration

Informationen zur Einrichtung von Embedding-Providern, zur Feinabstimmung der Hybridsuche (Gewichtungen, MMR, zeitlicher
Abfall), zur Batch-Indizierung, zu multimodalem Memory, sqlite-vec, zusätzlichen Pfaden und allen
weiteren Konfigurationsoptionen finden Sie in der
[Referenz zur Memory-Konfiguration](/de/reference/memory-config).

## Verwandte Themen

- [Memory-Übersicht](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Active Memory](/de/concepts/active-memory)

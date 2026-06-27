---
read_when:
    - Sie möchten Memory-Such-Embeddings aus einem lokalen GGUF-Modell
    - Sie konfigurieren memorySearch.provider = "local"
    - Sie benötigen das OpenClaw-Plugin, dem die `node-llama-cpp`-Runtime gehört
sidebarTitle: llama.cpp Provider
summary: Installieren Sie den offiziellen llama.cpp-Provider für lokale GGUF-Speicher-Embeddings
title: llama.cpp-Provider
x-i18n:
    generated_at: "2026-06-27T17:49:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` ist das offizielle externe Provider-Plugin für lokale GGUF-Embeddings.
Es besitzt die von `memorySearch.provider: "local"` verwendete
`node-llama-cpp`-Runtime-Abhängigkeit.

Installieren Sie es, bevor Sie lokale Memory-Embeddings verwenden:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Das Haupt-npm-Paket `openclaw` enthält `node-llama-cpp` nicht. Die native
Abhängigkeit in diesem Plugin zu halten, verhindert, dass normale OpenClaw-npm-Updates
eine manuell installierte Runtime im OpenClaw-Paketverzeichnis löschen.

## Konfiguration

Setzen Sie den Provider für die Memory-Suche auf `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

Das Standardmodell ist `embeddinggemma-300m-qat-Q8_0.gguf`. Sie können
`local.modelPath` auch auf eine lokale `.gguf`-Datei verweisen lassen.

## Native Runtime

Verwenden Sie Node 24 für den reibungslosesten nativen Installationspfad. Source-Checkouts mit pnpm
müssen die native Abhängigkeit möglicherweise genehmigen und neu bauen:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Für lokale Embeddings mit weniger Aufwand verwenden Sie stattdessen einen lokalen Service-Provider wie
Ollama oder LM Studio.

---
read_when:
    - Vuoi embedding di ricerca della memoria da un modello GGUF locale
    - Stai configurando memorySearch.provider = "local"
    - È necessario il Plugin OpenClaw che possiede il runtime node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Installa il provider ufficiale llama.cpp per gli embedding di memoria GGUF locali
title: Fornitore llama.cpp
x-i18n:
    generated_at: "2026-06-27T17:50:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` è il Plugin provider esterno ufficiale per gli embedding GGUF locali.
Possiede la dipendenza runtime `node-llama-cpp` usata da
`memorySearch.provider: "local"`.

Installalo prima di usare gli embedding di memoria locali:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Il pacchetto npm principale `openclaw` non include `node-llama-cpp`. Mantenere la
dipendenza nativa in questo Plugin impedisce ai normali aggiornamenti npm di
OpenClaw di eliminare un runtime installato manualmente all'interno della
directory del pacchetto OpenClaw.

## Configurazione

Imposta il provider di ricerca in memoria su `local`:

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

Il modello predefinito è `embeddinggemma-300m-qat-Q8_0.gguf`. Puoi anche puntare
`local.modelPath` a un file `.gguf` locale.

## Runtime nativo

Usa Node 24 per il percorso di installazione nativa più fluido. Le copie di
lavoro del sorgente che usano pnpm potrebbero dover approvare e ricostruire la
dipendenza nativa:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Per embedding locali con meno attrito, usa invece un provider di servizi locale
come Ollama o LM Studio.

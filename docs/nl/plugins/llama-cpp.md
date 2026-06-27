---
read_when:
    - Je wilt embeddings voor geheugenzoekopdrachten uit een lokaal GGUF-model
    - Je configureert memorySearch.provider = "local"
    - Je hebt de OpenClaw-plugin nodig die eigenaar is van de node-llama-cpp-runtime
sidebarTitle: llama.cpp Provider
summary: Installeer de officiële llama.cpp-provider voor lokale GGUF-geheugenembeddings
title: llama.cpp-provider
x-i18n:
    generated_at: "2026-06-27T17:54:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` is de officiële externe provider-Plugin voor lokale GGUF-embeddings.
Deze is eigenaar van de runtime-afhankelijkheid `node-llama-cpp` die wordt gebruikt door
`memorySearch.provider: "local"`.

Installeer deze voordat je lokale geheugenembeddings gebruikt:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Het hoofd-npm-pakket `openclaw` bevat `node-llama-cpp` niet. Door de
native afhankelijkheid in deze Plugin te houden, wordt voorkomen dat normale OpenClaw npm-updates
een handmatig geïnstalleerde runtime in de OpenClaw-pakketmap verwijderen.

## Configuratie

Stel de provider voor geheugenzoekopdrachten in op `local`:

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

Het standaardmodel is `embeddinggemma-300m-qat-Q8_0.gguf`. Je kunt
`local.modelPath` ook laten verwijzen naar een lokaal `.gguf`-bestand.

## Native runtime

Gebruik Node 24 voor het soepelste native installatiepad. Source-checkouts die pnpm
gebruiken, moeten mogelijk de native afhankelijkheid goedkeuren en opnieuw bouwen:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Voor lokale embeddings met minder frictie kun je in plaats daarvan een lokale serviceprovider gebruiken, zoals
Ollama of LM Studio.

---
read_when:
    - Vous voulez des embeddings de recherche en mémoire provenant d’un modèle GGUF local
    - Vous configurez memorySearch.provider = "local"
    - Vous avez besoin du Plugin OpenClaw qui possède l’environnement d’exécution node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Installez le provider officiel llama.cpp pour les embeddings de mémoire GGUF locaux
title: Fournisseur llama.cpp
x-i18n:
    generated_at: "2026-06-27T17:49:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` est le Plugin de fournisseur externe officiel pour les embeddings GGUF locaux.
Il possède la dépendance d’exécution `node-llama-cpp` utilisée par
`memorySearch.provider: "local"`.

Installez-le avant d’utiliser les embeddings de mémoire locaux :

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Le paquet npm principal `openclaw` n’inclut pas `node-llama-cpp`. Conserver la
dépendance native dans ce Plugin empêche les mises à jour npm normales d’OpenClaw de
supprimer une exécution installée manuellement dans le répertoire du paquet OpenClaw.

## Configuration

Définissez le fournisseur de recherche en mémoire sur `local` :

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

Le modèle par défaut est `embeddinggemma-300m-qat-Q8_0.gguf`. Vous pouvez également faire pointer
`local.modelPath` vers un fichier `.gguf` local.

## Exécution native

Utilisez Node 24 pour le parcours d’installation native le plus fluide. Les checkouts source utilisant pnpm
peuvent devoir approuver et reconstruire la dépendance native :

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Pour des embeddings locaux avec moins de friction, utilisez plutôt un fournisseur de service local comme
Ollama ou LM Studio.

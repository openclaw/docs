---
read_when:
    - Vous souhaitez générer les plongements de recherche en mémoire à partir d’un modèle GGUF local
    - Vous configurez memorySearch.provider = "local"
    - Vous avez besoin du Plugin OpenClaw qui gère l’environnement d’exécution node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Installez le fournisseur officiel llama.cpp pour les embeddings de mémoire GGUF locaux
title: Fournisseur llama.cpp
x-i18n:
    generated_at: "2026-07-12T02:53:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` est le plugin de fournisseur externe officiel pour les embeddings GGUF
locaux. Il enregistre l’identifiant de fournisseur d’embeddings `local` et gère la
dépendance d’exécution `node-llama-cpp` utilisée par `memorySearch.provider: "local"`.

Installez-le avant d’utiliser les embeddings de mémoire locaux :

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Le paquet npm principal `openclaw` n’inclut pas `node-llama-cpp`. Le maintien de la
dépendance native dans ce plugin empêche les mises à jour npm ordinaires d’OpenClaw de
supprimer un environnement d’exécution installé manuellement dans le répertoire du paquet OpenClaw.

## Configuration

Définissez `memorySearch.provider` sur `local` :

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

La valeur par défaut de `local.modelPath` est l’URI `hf:` indiquée ci-dessus (`embeddinggemma-300m-qat-Q8_0.gguf`).
Faites-la pointer vers une autre URI `hf:` ou vers un fichier `.gguf` local pour utiliser un autre
modèle. `local.modelCacheDir` remplace l’emplacement de mise en cache des modèles téléchargés
(valeur par défaut : `~/.node-llama-cpp/models`), et `local.contextSize` accepte un
entier ou `"auto"`.

Lorsque `local.contextSize` est numérique, le fournisseur transmet également cette exigence
au placement automatique des couches sur le GPU de node-llama-cpp. Cela permet à node-llama-cpp d’adapter
simultanément le modèle et le contexte d’embedding tout en conservant ses contrôles de sécurité
de la mémoire. Avec `"auto"`, node-llama-cpp conserve son placement automatique habituel.

## Environnement d’exécution natif

Utilisez Node 24 pour bénéficier du processus d’installation native le plus fluide. Les copies de travail des sources utilisant
pnpm peuvent nécessiter l’approbation et la recompilation de la dépendance native :

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnostics d’exécution

Exécutez `openclaw memory status --deep` après le chargement du fournisseur pour examiner
le moteur et la version sélectionnés, les noms des appareils, les couches déchargées sur le GPU, la taille
de contexte demandée ainsi que le dernier instantané observé de la VRAM ou de la mémoire unifiée. Les valeurs de VRAM
comprennent un horodatage d’observation, car les lectures d’état passives ne
rechargent pas le modèle et n’interrogent pas l’appareil.

Les mêmes informations connues les plus récentes peuvent apparaître dans `openclaw doctor` lorsque le
Gateway en cours d’exécution a déjà utilisé le fournisseur local. Une commande d’état ou de diagnostic
ordinaire ne charge pas de modèle uniquement pour recueillir des diagnostics.

## Résolution des problèmes

Si `node-llama-cpp` est absent ou ne parvient pas à se charger, OpenClaw signale l’échec
avec les instructions suivantes :

1. Installez le plugin : `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Utilisez Node 24 pour les installations et mises à jour natives.
3. Depuis une copie de travail des sources utilisant pnpm : `pnpm approve-builds`, puis `pnpm rebuild node-llama-cpp`.

Pour utiliser plus facilement des embeddings locaux sans l’étape de compilation native, définissez plutôt
`memorySearch.provider` sur un fournisseur d’embeddings distant tel que `lmstudio`,
`ollama`, `openai` ou `voyage`.

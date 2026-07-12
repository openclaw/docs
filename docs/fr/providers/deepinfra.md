---
read_when:
    - Vous souhaitez une seule clé API pour les meilleurs grands modèles de langage open source.
    - Vous souhaitez exécuter des modèles via l’API de DeepInfra dans OpenClaw
summary: Utilisez l’API unifiée de DeepInfra pour accéder aux modèles open source et de pointe les plus populaires dans OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T03:01:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra achemine les requêtes vers des modèles open source populaires et des modèles de pointe derrière un
point de terminaison unique compatible avec OpenAI et une seule clé API. La plupart des SDK OpenAI fonctionnent avec
ce service en modifiant l’URL de base.

## Installer le Plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Obtenir une clé API

1. Connectez-vous sur [deepinfra.com](https://deepinfra.com/)
2. Accédez à Dashboard / Keys et générez une clé, ou utilisez celle créée automatiquement

## Configuration via la CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Vous pouvez également définir la variable d’environnement :

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Extrait de configuration

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Surfaces prises en charge

Le chat, la génération d’images et la génération de vidéos actualisent leurs catalogues de modèles
en direct depuis `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
une fois `DEEPINFRA_API_KEY` configurée. Les autres surfaces utilisent les valeurs
par défaut statiques ci-dessous jusqu’à leur migration vers le même catalogue en direct.

| Surface                           | Modèle par défaut                                                                                                      | Configuration/outil OpenClaw                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Chat / fournisseur de modèles     | première entrée étiquetée pour le chat dans le catalogue en direct (repli statique : `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                   |
| Génération/édition d’images       | première entrée étiquetée `image-gen` dans le catalogue en direct (repli statique : `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Compréhension des médias          | `moonshotai/Kimi-K2.5` pour les images                                                                                 | compréhension des images entrantes                        |
| Transcription de la parole        | `openai/whisper-large-v3-turbo`                                                                                        | transcription des fichiers audio entrants                 |
| Synthèse vocale                   | `hexgrad/Kokoro-82M`                                                                                                   | `messages.tts.provider: "deepinfra"`                      |
| Génération de vidéos              | repli statique : `Pixverse/Pixverse-T2V` (aucune entrée vidéo `video-gen` en direct de DeepInfra à ce jour)           | `video_generate`, `agents.defaults.videoGenerationModel` |
| Plongements de mémoire            | `BAAI/bge-m3`                                                                                                          | `agents.defaults.memorySearch.provider: "deepinfra"`      |

DeepInfra expose également le reclassement, la classification, la détection d’objets et d’autres
types de modèles natifs. OpenClaw ne dispose pas encore de contrat de fournisseur pour ces catégories ;
ce Plugin ne les enregistre donc pas.

## Modèles disponibles

OpenClaw découvre dynamiquement les modèles DeepInfra une fois qu’une clé est configurée. Utilisez
`/models deepinfra` ou `openclaw models list --provider deepinfra` pour afficher la
liste actuelle.

Tout modèle disponible sur [deepinfra.com](https://deepinfra.com/) fonctionne avec le
préfixe `deepinfra/` :

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...et bien d’autres
```

## Remarques

- Les références de modèles suivent le format `deepinfra/<provider>/<model>` (par exemple `deepinfra/Qwen/Qwen3-Max`).
- Modèle de chat par défaut : `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL de base : `https://api.deepinfra.com/v1/openai`
- La génération native de vidéos utilise `https://api.deepinfra.com/v1/inference/<model>`.

## Voir aussi

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tous les fournisseurs](/fr/providers/index)

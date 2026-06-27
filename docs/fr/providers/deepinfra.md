---
read_when:
    - Vous voulez une seule clé API pour les meilleurs LLM open source
    - Vous voulez exécuter des modèles via l’API de DeepInfra dans OpenClaw
summary: Utilisez l’API unifiée de DeepInfra pour accéder aux modèles open source et frontier les plus populaires dans OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:03:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra fournit une **API unifiée** qui achemine les requêtes vers les modèles à code source ouvert et de pointe les plus populaires derrière un seul
point de terminaison et une seule clé d’API. Elle est compatible avec OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Obtenir une clé d’API

1. Accédez à [https://deepinfra.com/](https://deepinfra.com/)
2. Connectez-vous ou créez un compte
3. Accédez à Dashboard / Keys et générez une nouvelle clé d’API, ou utilisez celle créée automatiquement

## Configuration avec la CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Ou définissez la variable d’environnement :

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

## Surfaces OpenClaw prises en charge

Le Plugin enregistre toutes les surfaces DeepInfra qui correspondent aux contrats de fournisseur
OpenClaw actuels. La conversation, la génération d’images et la génération de vidéos
actualisent leurs catalogues de modèles en direct depuis `/v1/openai/models?sort_by=openclaw&filter=with_meta`
lorsque `DEEPINFRA_API_KEY` est configurée ; les autres surfaces utilisent les valeurs par défaut
statiques sélectionnées ci-dessous.

| Surface                  | Modèle par défaut                                                                                         | Configuration/outil OpenClaw                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Conversation / fournisseur de modèles    | première entrée marquée `chat` du catalogue en direct (repli du manifeste `deepseek-ai/DeepSeek-V4-Flash`)         | `agents.defaults.model`                                  |
| Génération/édition d’images | première entrée marquée `image-gen` du catalogue en direct (repli statique `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Compréhension des médias      | `moonshotai/Kimi-K2.5` pour les images                                                                     | compréhension des images entrantes                              |
| Parole vers texte           | `openai/whisper-large-v3-turbo`                                                                       | transcription audio entrante                              |
| Texte vers parole           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Génération de vidéos         | première entrée marquée `video-gen` du catalogue en direct (repli statique `Pixverse/Pixverse-T2V`)            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embeddings de mémoire        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra expose également le reclassement, la classification, la détection d’objets et d’autres
types de modèles natifs. OpenClaw ne dispose pas encore de contrats de fournisseur de premier ordre
pour ces catégories, donc ce Plugin ne les enregistre pas encore.

## Modèles disponibles

OpenClaw découvre dynamiquement les modèles DeepInfra disponibles au démarrage. Utilisez
`/models deepinfra` pour voir la liste complète des modèles disponibles.

Tout modèle disponible sur [DeepInfra.com](https://deepinfra.com/) peut être utilisé avec le préfixe `deepinfra/` :

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## Notes

- Les références de modèle sont `deepinfra/<provider>/<model>` (par exemple, `deepinfra/Qwen/Qwen3-Max`).
- Modèle par défaut : `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL de base : `https://api.deepinfra.com/v1/openai`
- La génération de vidéos native utilise `https://api.deepinfra.com/v1/inference/<model>`.

## Connexe

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tous les fournisseurs](/fr/providers/index)

---
read_when:
    - Vous voulez utiliser Qwen avec OpenClaw
    - Vous utilisiez auparavant Qwen OAuth
summary: Utiliser Qwen Cloud via le provider qwen intégré d'OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-09T01:29:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4786df2cb6ec1ab29d191d012c61dcb0e5468bf0f8561fbbb50eed741efad325
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth a été supprimé.** L'intégration OAuth du niveau gratuit
(`qwen-portal`) qui utilisait les points de terminaison `portal.qwen.ai` n'est plus disponible.
Voir [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) pour plus de
contexte.

</Warning>

## Recommandé : Qwen Cloud

OpenClaw traite désormais Qwen comme un provider intégré de première classe avec l'ID canonique
`qwen`. Le provider intégré cible les points de terminaison Qwen Cloud / Alibaba DashScope et
Coding Plan, tout en conservant les ID hérités `modelstudio` comme alias de
compatibilité.

- Provider : `qwen`
- Variable d'environnement préférée : `QWEN_API_KEY`
- Également acceptées pour compatibilité : `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Style d'API : compatible OpenAI

Si vous voulez `qwen3.6-plus`, privilégiez le point de terminaison **Standard (paiement à l'usage)**.
La prise en charge de Coding Plan peut être en retard par rapport au catalogue public.

```bash
# Point de terminaison global Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Point de terminaison chinois Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Point de terminaison global Standard (paiement à l'usage)
openclaw onboard --auth-choice qwen-standard-api-key

# Point de terminaison chinois Standard (paiement à l'usage)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Les ID d'`auth-choice` hérités `modelstudio-*` et les références de modèle `modelstudio/...` fonctionnent toujours
comme alias de compatibilité, mais les nouveaux flux de configuration doivent privilégier les ID d'`auth-choice`
canoniques `qwen-*` et les références de modèle `qwen/...`.

Après l'onboarding, définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Types de plan et points de terminaison

| Plan | Région | Auth choice | Point de terminaison |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (paiement à l'usage) | Chine | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1` |
| Standard (paiement à l'usage) | Global | `qwen-standard-api-key` | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonnement) | Chine | `qwen-api-key-cn` | `coding.dashscope.aliyuncs.com/v1` |
| Coding Plan (abonnement) | Global | `qwen-api-key` | `coding-intl.dashscope.aliyuncs.com/v1` |

Le provider sélectionne automatiquement le point de terminaison en fonction de votre auth choice. Les choix
canoniques utilisent la famille `qwen-*` ; `modelstudio-*` reste réservé à la compatibilité.
Vous pouvez remplacer cela par un `baseUrl` personnalisé dans la configuration.

Les points de terminaison natifs Model Studio annoncent une compatibilité d'usage du streaming sur le
transport partagé `openai-completions`. OpenClaw s'appuie maintenant sur les capacités du point de terminaison,
de sorte que les ID de provider personnalisés compatibles DashScope ciblant les
mêmes hôtes natifs héritent du même comportement d'usage du streaming au lieu
d'exiger spécifiquement l'ID de provider intégré `qwen`.

## Obtenir votre clé API

- **Gérer les clés** : [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Documentation** : [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Catalogue intégré

OpenClaw fournit actuellement ce catalogue Qwen intégré. Le catalogue configuré est
sensible au point de terminaison : les configurations Coding Plan omettent les modèles dont on sait qu'ils ne fonctionnent
que sur le point de terminaison Standard.

| Réf. de modèle | Entrée | Contexte | Remarques |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus` | text, image | 1,000,000 | Modèle par défaut |
| `qwen/qwen3.6-plus` | text, image | 1,000,000 | Préférez les points de terminaison Standard lorsque vous avez besoin de ce modèle |
| `qwen/qwen3-max-2026-01-23` | text | 262,144 | Ligne Qwen Max |
| `qwen/qwen3-coder-next` | text | 262,144 | Codage |
| `qwen/qwen3-coder-plus` | text | 1,000,000 | Codage |
| `qwen/MiniMax-M2.5` | text | 1,000,000 | Raisonnement activé |
| `qwen/glm-5` | text | 202,752 | GLM |
| `qwen/glm-4.7` | text | 202,752 | GLM |
| `qwen/kimi-k2.5` | text, image | 262,144 | Moonshot AI via Alibaba |

La disponibilité peut encore varier selon le point de terminaison et le plan de facturation, même lorsqu'un modèle est
présent dans le catalogue intégré.

La compatibilité d'usage du streaming natif s'applique à la fois aux hôtes Coding Plan et
aux hôtes Standard compatibles DashScope :

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Disponibilité de Qwen 3.6 Plus

`qwen3.6-plus` est disponible sur les points de terminaison Model Studio Standard (paiement à l'usage) :

- Chine : `dashscope.aliyuncs.com/compatible-mode/v1`
- Global : `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Si les points de terminaison Coding Plan renvoient une erreur « unsupported model » pour
`qwen3.6-plus`, basculez vers Standard (paiement à l'usage) au lieu du couple
point de terminaison/clé Coding Plan.

## Plan de capacités

L'extension `qwen` est en train d'être positionnée comme la base fournisseur de toute la surface Qwen
Cloud, et pas seulement des modèles de codage/texte.

- Modèles texte/chat : intégrés maintenant
- Appels d'outils, sortie structurée, réflexion : hérités du transport compatible OpenAI
- Génération d'images : prévue au niveau du plugin provider
- Compréhension image/vidéo : intégrée maintenant sur le point de terminaison Standard
- Parole/audio : prévue au niveau du plugin provider
- Embeddings/reranking mémoire : prévus via la surface d'adaptateur d'embedding
- Génération vidéo : intégrée maintenant via la capacité partagée de génération vidéo

## Extensions multimodales

L'extension `qwen` expose maintenant aussi :

- La compréhension vidéo via `qwen-vl-max-latest`
- La génération vidéo Wan via :
  - `wan2.6-t2v` (par défaut)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Ces surfaces multimodales utilisent les points de terminaison DashScope **Standard**, et non
les points de terminaison Coding Plan.

- URL de base Standard globale/intl : `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- URL de base Standard Chine : `https://dashscope.aliyuncs.com/compatible-mode/v1`

Pour la génération vidéo, OpenClaw mappe la région Qwen configurée vers l'hôte
DashScope AIGC régional correspondant avant d'envoyer la tâche :

- Global/Intl : `https://dashscope-intl.aliyuncs.com`
- Chine : `https://dashscope.aliyuncs.com`

Cela signifie qu'un `models.providers.qwen.baseUrl` normal pointant vers l'un ou l'autre des
hôtes Qwen Coding Plan ou Standard continue de maintenir la génération vidéo sur le bon
point de terminaison vidéo DashScope régional.

Pour la génération vidéo, définissez explicitement un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limites actuelles intégrées de génération vidéo Qwen :

- Jusqu'à **1** vidéo de sortie par requête
- Jusqu'à **1** image d'entrée
- Jusqu'à **4** vidéos d'entrée
- Jusqu'à **10 secondes** de durée
- Prend en charge `size`, `aspectRatio`, `resolution`, `audio` et `watermark`
- Le mode image/vidéo de référence exige actuellement des **URL http(s) distantes**. Les
  chemins de fichiers locaux sont rejetés d'emblée car le point de terminaison vidéo DashScope n'
  accepte pas les buffers locaux téléversés pour ces références.

Voir [Video Generation](/fr/tools/video-generation) pour les paramètres d'outil
partagés, la sélection du provider et le comportement de basculement.

## Remarque sur l'environnement

Si la Gateway s'exécute comme démon (launchd/systemd), assurez-vous que `QWEN_API_KEY` est
disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
`env.shellEnv`).

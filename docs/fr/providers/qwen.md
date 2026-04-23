---
read_when:
    - Vous souhaitez utiliser Qwen avec OpenClaw
    - Vous utilisiez auparavant Qwen OAuth
summary: Utiliser Qwen Cloud via le fournisseur qwen intégré d’OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T07:09:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth a été supprimé.** L’intégration OAuth gratuite
(`qwen-portal`) qui utilisait les points de terminaison `portal.qwen.ai` n’est plus disponible.
Voir [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) pour
le contexte.

</Warning>

OpenClaw traite désormais Qwen comme un fournisseur intégré de première classe avec l’ID canonique
`qwen`. Le fournisseur intégré cible les points de terminaison Qwen Cloud / Alibaba DashScope et
Coding Plan, tout en conservant les anciens identifiants `modelstudio` comme
alias de compatibilité.

- Fournisseur : `qwen`
- Variable d’environnement préférée : `QWEN_API_KEY`
- Également acceptées pour compatibilité : `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Style d’API : compatible OpenAI

<Tip>
Si vous voulez `qwen3.6-plus`, préférez le point de terminaison **Standard (pay-as-you-go)**.
La prise en charge du Coding Plan peut accuser un retard par rapport au catalogue public.
</Tip>

## Premiers pas

Choisissez votre type d’abonnement et suivez les étapes de configuration.

<Tabs>
  <Tab title="Coding Plan (abonnement)">
    **Le mieux pour :** un accès par abonnement via le Qwen Coding Plan.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Exécuter l’onboarding">
        Pour le point de terminaison **Global** :

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Pour le point de terminaison **China** :

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Les anciens identifiants `modelstudio-*` pour `auth-choice` et les références de modèle `modelstudio/...` continuent
    de fonctionner comme alias de compatibilité, mais les nouveaux flux de configuration devraient préférer les identifiants canoniques
    `qwen-*` pour `auth-choice` et les références de modèle `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Le mieux pour :** un accès à l’usage via le point de terminaison Standard Model Studio, y compris des modèles comme `qwen3.6-plus` qui peuvent ne pas être disponibles sur le Coding Plan.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Exécuter l’onboarding">
        Pour le point de terminaison **Global** :

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Pour le point de terminaison **China** :

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Les anciens identifiants `modelstudio-*` pour `auth-choice` et les références de modèle `modelstudio/...` continuent
    de fonctionner comme alias de compatibilité, mais les nouveaux flux de configuration devraient préférer les identifiants canoniques
    `qwen-*` pour `auth-choice` et les références de modèle `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Types d’abonnement et points de terminaison

| Abonnement                  | Région | Choix d’authentification    | Point de terminaison                             |
| --------------------------- | ------ | --------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)    | China  | `qwen-standard-api-key-cn`  | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)    | Global | `qwen-standard-api-key`     | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonnement)    | China  | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonnement)    | Global | `qwen-api-key`              | `coding-intl.dashscope.aliyuncs.com/v1`          |

Le fournisseur sélectionne automatiquement le point de terminaison en fonction de votre choix d’authentification. Les choix canoniques
utilisent la famille `qwen-*` ; `modelstudio-*` reste réservé à la compatibilité.
Vous pouvez surcharger cela avec un `baseUrl` personnalisé dans la configuration.

<Tip>
**Gérer les clés :** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentation :** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogue intégré

OpenClaw fournit actuellement ce catalogue Qwen intégré. Le catalogue configuré dépend
du point de terminaison : les configurations Coding Plan omettent les modèles dont on sait qu’ils ne fonctionnent
que sur le point de terminaison Standard.

| Référence de modèle         | Entrée      | Contexte  | Remarques                                         |
| --------------------------- | ----------- | --------- | ------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Modèle par défaut                                 |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Préférez les points de terminaison Standard si vous avez besoin de ce modèle |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Ligne Qwen Max                                    |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                            |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                            |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Raisonnement activé                               |
| `qwen/glm-5`                | text        | 202,752   | GLM                                               |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                               |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI via Alibaba                           |

<Note>
La disponibilité peut toujours varier selon le point de terminaison et l’abonnement de facturation même lorsqu’un modèle est
présent dans le catalogue intégré.
</Note>

## Extensions multimodales

Le Plugin `qwen` expose aussi des capacités multimodales sur les points de terminaison
DashScope **Standard** (pas sur les points de terminaison Coding Plan) :

- **Compréhension vidéo** via `qwen-vl-max-latest`
- **Génération vidéo Wan** via `wan2.6-t2v` (par défaut), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Pour utiliser Qwen comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Voir [Génération de vidéo](/fr/tools/video-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de repli.
</Note>

## Avancé

<AccordionGroup>
  <Accordion title="Compréhension d’image et de vidéo">
    Le Plugin Qwen intégré enregistre la compréhension média pour les images et la vidéo
    sur les points de terminaison DashScope **Standard** (pas sur les points de terminaison Coding Plan).

    | Propriété        | Valeur               |
    | ---------------- | -------------------- |
    | Modèle           | `qwen-vl-max-latest` |
    | Entrée prise en charge | Images, vidéo  |

    La compréhension média est résolue automatiquement à partir de l’authentification Qwen configurée — aucune
    configuration supplémentaire n’est nécessaire. Assurez-vous d’utiliser un point de terminaison Standard (pay-as-you-go)
    pour la prise en charge de la compréhension média.

  </Accordion>

  <Accordion title="Disponibilité de Qwen 3.6 Plus">
    `qwen3.6-plus` est disponible sur les points de terminaison Model Studio
    Standard (pay-as-you-go) :

    - China : `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global : `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Si les points de terminaison Coding Plan renvoient une erreur « unsupported model » pour
    `qwen3.6-plus`, basculez vers Standard (pay-as-you-go) au lieu du couple
    point de terminaison/clé Coding Plan.

  </Accordion>

  <Accordion title="Plan de capacités">
    Le Plugin `qwen` est en train d’être positionné comme la maison du fournisseur pour toute la
    surface Qwen Cloud, et pas seulement les modèles coding/texte.

    - **Modèles texte/chat :** déjà intégrés
    - **Appel d’outils, sortie structurée, thinking :** hérités du transport compatible OpenAI
    - **Génération d’images :** prévue au niveau du Plugin fournisseur
    - **Compréhension d’image/vidéo :** déjà intégrée sur le point de terminaison Standard
    - **Speech/audio :** prévu au niveau du Plugin fournisseur
    - **Embeddings/reranking mémoire :** prévus via la surface d’adaptateur d’embeddings
    - **Génération vidéo :** déjà intégrée via la capacité partagée de génération vidéo

  </Accordion>

  <Accordion title="Détails de la génération vidéo">
    Pour la génération vidéo, OpenClaw mappe la région Qwen configurée vers l’hôte
    DashScope AIGC correspondant avant d’envoyer la tâche :

    - Global/Intl : `https://dashscope-intl.aliyuncs.com`
    - China : `https://dashscope.aliyuncs.com`

    Cela signifie qu’un `models.providers.qwen.baseUrl` normal pointant soit vers les
    hôtes Coding Plan soit Standard Qwen conserve quand même la génération vidéo sur le bon
    point de terminaison vidéo DashScope régional.

    Limites actuelles de génération vidéo Qwen intégrées :

    - Jusqu’à **1** vidéo de sortie par requête
    - Jusqu’à **1** image d’entrée
    - Jusqu’à **4** vidéos d’entrée
    - Jusqu’à **10 secondes** de durée
    - Prend en charge `size`, `aspectRatio`, `resolution`, `audio` et `watermark`
    - Le mode image/vidéo de référence exige actuellement des **URL http(s) distantes**. Les
      chemins de fichiers locaux sont rejetés d’emblée car le point de terminaison vidéo DashScope n’accepte pas
      les buffers locaux téléversés pour ces références.

  </Accordion>

  <Accordion title="Compatibilité d’usage du streaming">
    Les points de terminaison Model Studio natifs annoncent une compatibilité d’usage du streaming sur le
    transport partagé `openai-completions`. OpenClaw s’appuie désormais sur les capacités du point de terminaison, de sorte que les identifiants de fournisseurs personnalisés compatibles DashScope pointant vers les
    mêmes hôtes natifs héritent du même comportement d’usage du streaming au lieu
    d’exiger spécifiquement l’ID de fournisseur intégré `qwen`.

    La compatibilité d’usage du streaming natif s’applique à la fois aux hôtes Coding Plan et
    aux hôtes Standard compatibles DashScope :

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Régions des points de terminaison multimodaux">
    Les surfaces multimodales (compréhension vidéo et génération vidéo Wan) utilisent les
    points de terminaison DashScope **Standard**, et non les points de terminaison Coding Plan :

    - URL de base Standard Global/Intl : `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL de base Standard China : `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configuration de l’environnement et du daemon">
    Si la Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `QWEN_API_KEY` est
    disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèle et comportement de repli.
  </Card>
  <Card title="Génération de vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil vidéo partagé et sélection du fournisseur.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/fr/providers/alibaba" icon="cloud">
    Fournisseur ModelStudio hérité et notes de migration.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>

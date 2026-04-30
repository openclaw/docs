---
read_when:
    - Vous souhaitez utiliser Qwen avec OpenClaw
    - Vous avez déjà utilisé Qwen OAuth
summary: Utiliser Qwen Cloud via le fournisseur qwen intégré à OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-30T07:45:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**Qwen OAuth a été supprimé.** L’intégration OAuth gratuite
(`qwen-portal`) qui utilisait les points de terminaison `portal.qwen.ai` n’est plus disponible.
Consultez [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) pour
le contexte.

</Warning>

OpenClaw traite désormais Qwen comme un fournisseur intégré de premier plan avec l’identifiant canonique
`qwen`. Le fournisseur intégré cible les points de terminaison Qwen Cloud / Alibaba DashScope et
Coding Plan, et maintient les anciens identifiants `modelstudio` comme
alias de compatibilité.

- Fournisseur : `qwen`
- Variable d’environnement préférée : `QWEN_API_KEY`
- Également acceptées pour compatibilité : `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Style d’API : compatible OpenAI

<Tip>
Si vous voulez `qwen3.6-plus`, préférez le point de terminaison **Standard (paiement à l’usage)**.
La prise en charge de Coding Plan peut être en retard par rapport au catalogue public.
</Tip>

## Premiers pas

Choisissez votre type de plan et suivez les étapes de configuration.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Idéal pour :** l’accès par abonnement via le Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Créez ou copiez une clé API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Pour le point de terminaison **Global** :

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Pour le point de terminaison **Chine** :

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Les anciens identifiants de choix d’authentification `modelstudio-*` et les références de modèles `modelstudio/...`
    fonctionnent encore comme alias de compatibilité, mais les nouveaux flux de configuration devraient préférer les identifiants de choix d’authentification canoniques
    `qwen-*` et les références de modèles `qwen/...`. Si vous définissez une entrée
    `models.providers.modelstudio` personnalisée exacte avec une autre valeur `api`, ce
    fournisseur personnalisé possède les références `modelstudio/...` au lieu de l’alias de compatibilité
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Idéal pour :** l’accès au paiement à l’usage via le point de terminaison Standard Model Studio, y compris les modèles comme `qwen3.6-plus` qui peuvent ne pas être disponibles sur le Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Créez ou copiez une clé API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Pour le point de terminaison **Global** :

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Pour le point de terminaison **Chine** :

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Les anciens identifiants de choix d’authentification `modelstudio-*` et les références de modèles `modelstudio/...`
    fonctionnent encore comme alias de compatibilité, mais les nouveaux flux de configuration devraient préférer les identifiants de choix d’authentification canoniques
    `qwen-*` et les références de modèles `qwen/...`. Si vous définissez une entrée
    `models.providers.modelstudio` personnalisée exacte avec une autre valeur `api`, ce
    fournisseur personnalisé possède les références `modelstudio/...` au lieu de l’alias de compatibilité
    Qwen.
    </Note>

  </Tab>
</Tabs>

## Types de plans et points de terminaison

| Plan                       | Région | Choix d’authentification   | Point de terminaison                              |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (paiement à l’usage) | Chine  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (paiement à l’usage) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonnement)   | Chine  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonnement)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Le fournisseur sélectionne automatiquement le point de terminaison en fonction de votre choix d’authentification. Les choix canoniques
utilisent la famille `qwen-*` ; `modelstudio-*` reste réservé à la compatibilité.
Vous pouvez remplacer ce comportement avec un `baseUrl` personnalisé dans la configuration.

<Tip>
**Gérer les clés :** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Docs :** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogue intégré

OpenClaw fournit actuellement ce catalogue Qwen intégré. Le catalogue configuré est
adapté au point de terminaison : les configurations Coding Plan omettent les modèles connus pour fonctionner uniquement sur
le point de terminaison Standard.

| Référence de modèle         | Entrée      | Contexte  | Remarques                                          |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | texte, image | 1,000,000 | Modèle par défaut                                  |
| `qwen/qwen3.6-plus`         | texte, image | 1,000,000 | Préférez les points de terminaison Standard lorsque vous avez besoin de ce modèle |
| `qwen/qwen3-max-2026-01-23` | texte       | 262,144   | Gamme Qwen Max                                     |
| `qwen/qwen3-coder-next`     | texte       | 262,144   | Codage                                             |
| `qwen/qwen3-coder-plus`     | texte       | 1,000,000 | Codage                                             |
| `qwen/MiniMax-M2.5`         | texte       | 1,000,000 | Raisonnement activé                                |
| `qwen/glm-5`                | texte       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | texte       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | texte, image | 262,144   | Moonshot AI via Alibaba                            |

<Note>
La disponibilité peut encore varier selon le point de terminaison et le plan de facturation, même lorsqu’un modèle est
présent dans le catalogue intégré.
</Note>

## Contrôles de réflexion

Pour les modèles Qwen Cloud avec raisonnement activé, le fournisseur intégré mappe les niveaux de réflexion
OpenClaw au drapeau de requête de premier niveau `enable_thinking` de DashScope. Une réflexion désactivée
envoie `enable_thinking: false` ; les autres niveaux de réflexion envoient
`enable_thinking: true`.

## Modules complémentaires multimodaux

Le Plugin `qwen` expose également des capacités multimodales sur les points de terminaison DashScope
**Standard** (pas les points de terminaison Coding Plan) :

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
Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Le Plugin Qwen intégré enregistre la compréhension des médias pour les images et la vidéo
    sur les points de terminaison DashScope **Standard** (pas les points de terminaison Coding Plan).

    | Propriété      | Valeur                |
    | ------------- | --------------------- |
    | Modèle        | `qwen-vl-max-latest`  |
    | Entrée prise en charge | Images, vidéo       |

    La compréhension des médias est résolue automatiquement à partir de l’authentification Qwen configurée — aucune
    configuration supplémentaire n’est nécessaire. Assurez-vous d’utiliser un point de terminaison Standard (paiement à l’usage)
    pour la prise en charge de la compréhension des médias.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` est disponible sur les points de terminaison Standard (paiement à l’usage) Model Studio :

    - Chine : `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global : `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Si les points de terminaison Coding Plan renvoient une erreur « modèle non pris en charge » pour
    `qwen3.6-plus`, passez à Standard (paiement à l’usage) au lieu de la paire
    point de terminaison/clé Coding Plan.

    Le catalogue Qwen intégré d’OpenClaw n’annonce pas `qwen3.6-plus` sur les points de terminaison Coding
    Plan, mais les entrées `qwen/qwen3.6-plus` explicitement configurées sous
    `models.providers.qwen.models` sont respectées sur les baseUrls Coding Plan, afin que vous
    puissiez activer ce modèle si Aliyun l’active sur votre abonnement. L’
    API en amont décide toujours si l’appel réussit.

  </Accordion>

  <Accordion title="Capability plan">
    Le Plugin `qwen` est positionné comme l’emplacement fournisseur pour toute la surface
    Qwen Cloud, pas seulement pour les modèles de codage/texte.

    - **Modèles texte/chat :** intégrés maintenant
    - **Appel d’outils, sortie structurée, réflexion :** hérités du transport compatible OpenAI
    - **Génération d’images :** prévue au niveau du Plugin de fournisseur
    - **Compréhension d’images/vidéos :** intégrée maintenant sur le point de terminaison Standard
    - **Parole/audio :** prévu au niveau du Plugin de fournisseur
    - **Embeddings/réordonnancement de mémoire :** prévus via la surface d’adaptateur d’embeddings
    - **Génération vidéo :** intégrée maintenant via la capacité partagée de génération vidéo

  </Accordion>

  <Accordion title="Video generation details">
    Pour la génération vidéo, OpenClaw mappe la région Qwen configurée à l’hôte AIGC DashScope correspondant
    avant de soumettre la tâche :

    - Global/Intl : `https://dashscope-intl.aliyuncs.com`
    - Chine : `https://dashscope.aliyuncs.com`

    Cela signifie qu’un `models.providers.qwen.baseUrl` normal pointant vers les hôtes
    Coding Plan ou Standard Qwen maintient quand même la génération vidéo sur le bon
    point de terminaison vidéo DashScope régional.

    Limites actuelles de génération vidéo Qwen intégrées :

    - Jusqu’à **1** vidéo de sortie par requête
    - Jusqu’à **1** image d’entrée
    - Jusqu’à **4** vidéos d’entrée
    - Jusqu’à **10 secondes** de durée
    - Prend en charge `size`, `aspectRatio`, `resolution`, `audio` et `watermark`
    - Le mode image/vidéo de référence nécessite actuellement des **URL http(s) distantes**. Les chemins de
      fichiers locaux sont rejetés dès le départ, car le point de terminaison vidéo DashScope n’accepte pas
      les tampons locaux téléversés pour ces références.

  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Les points de terminaison Model Studio natifs annoncent la compatibilité d’utilisation en streaming sur le
    transport partagé `openai-completions`. OpenClaw l’indexe désormais sur les
    capacités des points de terminaison, de sorte que les identifiants de fournisseurs personnalisés compatibles DashScope ciblant les
    mêmes hôtes natifs héritent du même comportement d’utilisation en streaming au lieu
    d’exiger spécifiquement l’identifiant de fournisseur intégré `qwen`.

    La compatibilité d’utilisation en streaming natif s’applique à la fois aux hôtes Coding Plan et
    aux hôtes Standard compatibles DashScope :

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Multimodal endpoint regions">
    Les surfaces multimodales (compréhension vidéo et génération vidéo Wan) utilisent les
    points de terminaison DashScope **Standard**, pas les points de terminaison Coding Plan :

    - URL de base Standard Global/Intl : `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL de base Standard Chine : `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configuration de l’environnement et du démon">
    Si le Gateway s’exécute comme un démon (launchd/systemd), assurez-vous que `QWEN_API_KEY` est
    disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Articles associés

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/fr/providers/alibaba" icon="cloud">
    Ancien fournisseur ModelStudio et notes de migration.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>

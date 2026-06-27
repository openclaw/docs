---
read_when:
    - Vous voulez utiliser Qwen avec OpenClaw
    - Vous utilisiez auparavant Qwen OAuth
summary: Utiliser Qwen Cloud via son plugin OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:07:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw traite désormais Qwen comme un Plugin fournisseur de premier rang avec l’id canonique
`qwen`. Le Plugin fournisseur cible les points de terminaison Qwen Cloud / Alibaba DashScope et
Coding Plan, maintient le fonctionnement des anciens identifiants `modelstudio` comme alias de compatibilité,
et expose aussi le flux de jeton Qwen Portal comme fournisseur `qwen-oauth`.

- Fournisseur : `qwen`
- Fournisseur Portal : [`qwen-oauth`](/fr/providers/qwen-oauth)
- Variable d’environnement préférée : `QWEN_API_KEY`
- Également acceptées pour compatibilité : `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Style d’API : compatible OpenAI

<Tip>
Si vous voulez `qwen3.6-plus`, préférez le point de terminaison **Standard (paiement à l’utilisation)**.
La prise en charge de Coding Plan peut être en retard par rapport au catalogue public.
</Tip>

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Premiers pas

Choisissez votre type de forfait et suivez les étapes de configuration.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Idéal pour :** un accès par abonnement via Qwen Coding Plan.

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
    Les anciens identifiants auth-choice `modelstudio-*` et les références de modèle `modelstudio/...` fonctionnent toujours
    comme alias de compatibilité, mais les nouveaux flux de configuration devraient préférer les identifiants auth-choice canoniques
    `qwen-*` et les références de modèle `qwen/...`. Si vous définissez une entrée personnalisée exacte
    `models.providers.modelstudio` avec une autre valeur `api`, ce fournisseur
    personnalisé possède les références `modelstudio/...` au lieu de l’alias de compatibilité Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Idéal pour :** un accès avec paiement à l’utilisation via le point de terminaison Standard Model Studio, notamment pour les modèles comme `qwen3.6-plus` qui peuvent ne pas être disponibles sur Coding Plan.

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
    Les anciens identifiants auth-choice `modelstudio-*` et les références de modèle `modelstudio/...` fonctionnent toujours
    comme alias de compatibilité, mais les nouveaux flux de configuration devraient préférer les identifiants auth-choice canoniques
    `qwen-*` et les références de modèle `qwen/...`. Si vous définissez une entrée personnalisée exacte
    `models.providers.modelstudio` avec une autre valeur `api`, ce fournisseur
    personnalisé possède les références `modelstudio/...` au lieu de l’alias de compatibilité Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Idéal pour :** un jeton Qwen Portal pour `https://portal.qwen.ai/v1`.

    Consultez [Qwen OAuth / Portal](/fr/providers/qwen-oauth) pour la page dédiée du fournisseur
    et les notes de migration.

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` utilise le même nom de variable d’environnement `QWEN_API_KEY` que le fournisseur DashScope,
    mais stocke l’authentification sous l’id de fournisseur `qwen-oauth` lorsqu’il est configuré
    via l’onboarding OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Types de forfaits et points de terminaison

| Forfait                    | Région | Choix d’authentification   | Point de terminaison                            |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (paiement à l’utilisation) | Chine  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (paiement à l’utilisation) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonnement) | Chine  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonnement) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

Le fournisseur sélectionne automatiquement le point de terminaison selon votre choix d’authentification. Les choix canoniques
utilisent la famille `qwen-*` ; `modelstudio-*` reste réservé à la compatibilité.
Vous pouvez remplacer cela avec un `baseUrl` personnalisé dans la configuration.

<Tip>
**Gérer les clés :** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Docs :** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogue intégré

OpenClaw fournit actuellement ce catalogue statique Qwen. Le catalogue configuré est
adapté au point de terminaison : les configurations Coding Plan omettent les modèles uniquement connus comme fonctionnant sur
le point de terminaison Standard.

| Référence de modèle         | Entrée      | Contexte  | Notes                                              |
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
| `qwen-oauth/qwen3.5-plus`   | texte, image | 1,000,000 | Valeur par défaut de Qwen Portal                   |

<Note>
La disponibilité peut encore varier selon le point de terminaison et le forfait de facturation, même lorsqu’un modèle est
présent dans le catalogue statique.
</Note>

## Contrôles de raisonnement

Pour les modèles Qwen Cloud avec raisonnement activé, le fournisseur mappe les
niveaux de raisonnement OpenClaw vers l’indicateur de requête de premier niveau `enable_thinking` de DashScope. Le
raisonnement désactivé envoie `enable_thinking: false` ; les autres niveaux de raisonnement envoient
`enable_thinking: true`.

## Modules multimodaux complémentaires

Le Plugin `qwen` expose aussi des capacités multimodales sur les points de terminaison DashScope **Standard**
(et non sur les points de terminaison Coding Plan) :

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
Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Le Plugin Qwen enregistre la compréhension des médias pour les images et la vidéo
    sur les points de terminaison DashScope **Standard** (et non sur les points de terminaison Coding Plan).

    | Propriété     | Valeur                |
    | ------------- | --------------------- |
    | Modèle        | `qwen-vl-max-latest`  |
    | Entrée prise en charge | Images, vidéo       |

    La compréhension des médias est résolue automatiquement à partir de l’authentification Qwen configurée : aucune
    configuration supplémentaire n’est nécessaire. Assurez-vous d’utiliser un point de terminaison Standard (paiement à l’utilisation)
    pour la prise en charge de la compréhension des médias.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` est disponible sur les points de terminaison Standard (paiement à l’utilisation) Model Studio :

    - Chine : `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global : `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Si les points de terminaison Coding Plan renvoient une erreur « modèle non pris en charge » pour
    `qwen3.6-plus`, passez à Standard (paiement à l’utilisation) au lieu de la paire point de terminaison/clé
    Coding Plan.

    Le catalogue statique Qwen d’OpenClaw n’annonce pas `qwen3.6-plus` sur les points de terminaison Coding
    Plan, mais les entrées `qwen/qwen3.6-plus` explicitement configurées sous
    `models.providers.qwen.models` sont respectées sur les baseUrls Coding Plan afin que vous
    puissiez activer ce modèle si Aliyun l’active sur votre abonnement. L’API
    amont décide toujours si l’appel réussit.

  </Accordion>

  <Accordion title="Capability plan">
    Le Plugin `qwen` est positionné comme l’emplacement fournisseur pour toute la surface Qwen
    Cloud, et pas seulement pour les modèles de codage/texte.

    - **Modèles texte/chat :** disponibles via le Plugin
    - **Appel d’outils, sortie structurée, raisonnement :** hérités du transport compatible OpenAI
    - **Génération d’images :** prévue au niveau du Plugin fournisseur
    - **Compréhension image/vidéo :** disponible via le Plugin sur le point de terminaison Standard
    - **Parole/audio :** prévue au niveau du Plugin fournisseur
    - **Embeddings/réordonnancement mémoire :** prévus via la surface d’adaptateur d’embeddings
    - **Génération vidéo :** disponible via le Plugin par la capacité partagée de génération vidéo

  </Accordion>

  <Accordion title="Video generation details">
    Pour la génération vidéo, OpenClaw mappe la région Qwen configurée vers l’hôte
    DashScope AIGC correspondant avant de soumettre la tâche :

    - Global/Intl : `https://dashscope-intl.aliyuncs.com`
    - Chine : `https://dashscope.aliyuncs.com`

    Cela signifie qu’un `models.providers.qwen.baseUrl` normal pointant vers les hôtes Qwen
    Coding Plan ou Standard conserve tout de même la génération vidéo sur le bon
    point de terminaison vidéo DashScope régional.

    Limites actuelles de génération vidéo Qwen :

    - Jusqu’à **1** vidéo de sortie par requête
    - Jusqu’à **1** image d’entrée
    - Jusqu’à **4** vidéos d’entrée
    - Jusqu’à **10 secondes** de durée
    - Prend en charge `size`, `aspectRatio`, `resolution`, `audio` et `watermark`
    - Le mode image/vidéo de référence exige actuellement des **URL http(s) distantes**. Les chemins de
      fichiers locaux sont rejetés dès le départ, car le point de terminaison vidéo DashScope n’accepte pas
      les tampons locaux téléversés pour ces références.

  </Accordion>

  <Accordion title="Compatibilité de l’utilisation en streaming">
    Les endpoints natifs Model Studio annoncent la compatibilité de l’utilisation en streaming sur le
    transport partagé `openai-completions`. OpenClaw s’appuie désormais sur les
    capacités des endpoints ; ainsi, les identifiants de fournisseurs personnalisés compatibles avec DashScope qui ciblent les
    mêmes hôtes natifs héritent du même comportement d’utilisation en streaming au lieu de
    nécessiter spécifiquement l’identifiant du fournisseur intégré `qwen`.

    La compatibilité de l’utilisation en streaming native s’applique à la fois aux hôtes Coding Plan et
    aux hôtes Standard compatibles avec DashScope :

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Régions des endpoints multimodaux">
    Les surfaces multimodales (compréhension vidéo et génération vidéo Wan) utilisent les
    endpoints DashScope **Standard**, et non les endpoints Coding Plan :

    - URL de base Standard mondiale/internationale : `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL de base Standard Chine : `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configuration de l’environnement et du daemon">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `QWEN_API_KEY` est
    disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/fr/providers/alibaba" icon="cloud">
    Ancien fournisseur ModelStudio et notes de migration.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>

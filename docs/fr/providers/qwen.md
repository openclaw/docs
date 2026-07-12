---
read_when:
    - Vous souhaitez utiliser Qwen avec OpenClaw
    - Vous disposez d’un abonnement Alibaba Cloud Token Plan
    - Vous utilisiez auparavant Qwen OAuth
summary: Utilisez Qwen Cloud via son Plugin OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-12T03:16:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud est un Plugin fournisseur externe officiel d’OpenClaw, dont l’identifiant canonique est `qwen`. Il cible les points de terminaison Standard et Coding Plan de Qwen Cloud / Alibaba DashScope, expose Token Plan sous `qwen-token-plan`, conserve `modelstudio` comme alias de compatibilité, gère indépendamment l’identifiant de fournisseur personnalisé `bailian-token-plan` documenté par Alibaba et expose le flux de jeton Qwen Portal sous [`qwen-oauth`](/fr/providers/qwen-oauth).

| Propriété                         | Valeur                                     |
| --------------------------------- | ------------------------------------------ |
| Fournisseur                       | `qwen`                                     |
| Fournisseur Token Plan            | `qwen-token-plan`                          |
| Fournisseur du portail            | [`qwen-oauth`](/fr/providers/qwen-oauth)      |
| Variable d’environnement préférée | `QWEN_API_KEY`                             |
| Variable d’environnement Token Plan | `QWEN_TOKEN_PLAN_API_KEY`                |
| Également acceptées (compatibilité) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Style d’API                       | Compatible avec OpenAI                     |

<Tip>
`qwen3.7-plus` et `qwen3.6-plus` fonctionnent avec les points de terminaison Coding Plan et Standard.
Pour `qwen3.7-max` ou `qwen3.6-flash`, utilisez un point de terminaison **Standard (paiement à l’utilisation)**.
</Tip>

## Installer le Plugin

`qwen` est distribué comme Plugin externe officiel et n’est pas intégré au cœur. Installez-le, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Prise en main

Choisissez votre type d’offre et suivez les étapes de configuration.

<Tabs>
  <Tab title="Coding Plan (abonnement)">
    **Idéal pour :** l’accès par abonnement via le Qwen Coding Plan.

    <Steps>
      <Step title="Obtenir votre clé d’API">
        Créez ou copiez une clé d’API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Lancer la configuration initiale">
        Pour le point de terminaison **mondial** :

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Pour le point de terminaison **chinois** :

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
    Les anciens identifiants de choix d’authentification `modelstudio-*` et les références de modèles `modelstudio/...`
    fonctionnent toujours comme alias de compatibilité, mais les nouveaux flux de configuration doivent privilégier les identifiants
    canoniques de choix d’authentification `qwen-*` et les références de modèles `qwen/...`. Si vous définissez une entrée
    personnalisée exacte `models.providers.modelstudio` avec une autre valeur `api`, ce
    fournisseur personnalisé prend en charge les références `modelstudio/...` à la place de l’alias de compatibilité
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (paiement à l’utilisation)">
    **Idéal pour :** l’accès avec paiement à l’utilisation via le point de terminaison Standard de Model Studio, notamment à `qwen3.7-max` et `qwen3.6-flash`, qui ne sont pas disponibles dans le Coding Plan.

    <Steps>
      <Step title="Obtenir votre clé d’API">
        Créez ou copiez une clé d’API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Lancer la configuration initiale">
        Pour le point de terminaison **mondial** :

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Pour le point de terminaison **chinois** :

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
    Les anciens identifiants de choix d’authentification `modelstudio-*` et les références de modèles `modelstudio/...`
    fonctionnent toujours comme alias de compatibilité, mais les nouveaux flux de configuration doivent privilégier les identifiants
    canoniques de choix d’authentification `qwen-*` et les références de modèles `qwen/...`. Si vous définissez une entrée
    personnalisée exacte `models.providers.modelstudio` avec une autre valeur `api`, ce
    fournisseur personnalisé prend en charge les références `modelstudio/...` à la place de l’alias de compatibilité
    Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (édition équipe)">
    **Idéal pour :** l’accès par abonnement d’équipe fondé sur des crédits aux modèles Qwen et aux modèles tiers pris en charge via Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Obtenir votre clé dédiée">
        Attribuez une place Token Plan et créez sa clé dédiée `sk-sp-...`. Les clés Token Plan, Coding Plan et de paiement à l’utilisation ne sont pas interchangeables. Consultez la [présentation mondiale de Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) ou la [présentation chinoise de Token Plan](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Lancer la configuration initiale">
        Pour le point de terminaison **mondial / international** à Singapour :

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Pour le point de terminaison **chinois** à Pékin :

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Vérifier le fournisseur">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    Le guide OpenClaw d’Alibaba utilise `bailian-token-plan` pour un fournisseur
    personnalisé manuel. Le Plugin enregistre cet identifiant comme propriétaire de compatibilité, mais les nouvelles
    configurations doivent utiliser `qwen-token-plan`. Une entrée personnalisée exacte
    `models.providers.bailian-token-plan` conserve la maîtrise du transport et du catalogue
    configurés ; elle n’est jamais fusionnée dans le catalogue canonique OpenAI.
    </Note>

    <Warning>
    Utilisez Token Plan uniquement pour les sessions OpenClaw interactives. Ne le sélectionnez pas pour
    des tâches Cron, des scripts sans surveillance ou des services applicatifs. Alibaba indique qu’une
    utilisation non interactive peut suspendre l’abonnement ou révoquer sa clé d’API.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Idéal pour :** un jeton Qwen Portal utilisé avec `https://portal.qwen.ai/v1`.

    Consultez [Qwen OAuth / Portal](/fr/providers/qwen-oauth) pour accéder à la page dédiée au fournisseur
    et aux notes de migration.

    <Steps>
      <Step title="Fournir votre jeton de portail">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
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
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` utilise le même nom de variable d’environnement `QWEN_API_KEY` que le fournisseur
    Qwen Cloud, mais stocke l’authentification sous l’identifiant de fournisseur `qwen-oauth` lorsqu’elle est configurée
    via la configuration initiale d’OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Types d’offres et points de terminaison

| Offre                      | Région   | Choix d’authentification   | Point de terminaison                                               |
| -------------------------- | -------- | -------------------------- | ------------------------------------------------------------------ |
| Coding Plan (abonnement)   | Chine    | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                                 |
| Coding Plan (abonnement)   | Mondiale | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                            |
| Qwen Portal                | Mondiale | `qwen-oauth`               | `portal.qwen.ai/v1`                                                |
| Standard (paiement à l’utilisation) | Chine | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                  |
| Standard (paiement à l’utilisation) | Mondiale | `qwen-standard-api-key` | `dashscope-intl.aliyuncs.com/compatible-mode/v1`               |
| Token Plan (édition équipe) | Chine   | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`       |
| Token Plan (édition équipe) | Mondiale | `qwen-token-plan`         | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`   |

Le fournisseur sélectionne automatiquement le point de terminaison selon votre choix d’authentification. Les choix
canoniques utilisent la famille `qwen-*` ; `modelstudio-*` est réservé à la compatibilité.
Remplacez ce comportement avec un `baseUrl` personnalisé dans la configuration.

<Tip>
**Gérer les clés :** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentation :** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogue intégré

OpenClaw fournit ce catalogue statique Qwen. Le catalogue tient compte du point de terminaison : les configurations Coding
Plan omettent les modèles qui fonctionnent uniquement avec le point de terminaison Standard.

| Référence du modèle         | Entrée      | Contexte  | Remarques                              |
| --------------------------- | ----------- | --------- | -------------------------------------- |
| `qwen/qwen3.5-plus`         | texte, image | 1,000,000 | Modèle par défaut                      |
| `qwen/qwen3.6-flash`        | texte, image | 1,000,000 | Points de terminaison Standard uniquement |
| `qwen/qwen3.6-plus`         | texte, image | 1,000,000 | Coding Plan + Standard                 |
| `qwen/qwen3.7-max`          | texte        | 1,000,000 | Points de terminaison Standard uniquement |
| `qwen/qwen3.7-plus`         | texte, image | 1,000,000 | Coding Plan + Standard                 |
| `qwen/qwen3-max-2026-01-23` | texte        | 262,144   | Gamme Qwen Max                         |
| `qwen/qwen3-coder-next`     | texte        | 262,144   | Programmation                          |
| `qwen/qwen3-coder-plus`     | texte        | 1,000,000 | Programmation                          |
| `qwen/MiniMax-M2.5`         | texte        | 1,000,000 | Raisonnement activé                    |
| `qwen/glm-5`                | texte        | 202,752   | GLM                                    |
| `qwen/glm-4.7`              | texte        | 202,752   | GLM                                    |
| `qwen/kimi-k2.5`            | texte, image | 262,144   | Moonshot AI via Alibaba                |
| `qwen-oauth/qwen3.5-plus`   | texte, image | 1,000,000 | Valeur par défaut de Qwen Portal       |

<Note>
La disponibilité peut néanmoins varier selon le point de terminaison et l’offre de facturation, même lorsqu’un modèle
figure dans le catalogue statique.
</Note>

### Catalogue Token Plan

Token Plan utilise une liste d’autorisation distincte fondée sur une correspondance exacte des chaînes. Les modèles de l’offre
réservés à la génération d’images ne sont pas inclus ici, car ils utilisent des API différentes.

| Référence du modèle                 | Entrée      | Contexte  |
| ----------------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | texte        | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | texte, image | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | texte, image | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | texte, image | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | texte        | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | texte        | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | texte        | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | texte, image | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | texte, image | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | texte, image | 262,144   |
| `qwen-token-plan/glm-5.2`           | texte        | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | texte        | 202,752   |
| `qwen-token-plan/glm-5`             | texte        | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | texte        | 196,608   |

## Contrôles du raisonnement

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` et `qwen3.6-plus` sont
compatibles avec le raisonnement dans le catalogue intégré. Pour les modèles de
raisonnement de la famille `qwen`, le fournisseur associe les niveaux de réflexion
d'OpenClaw à l'indicateur de requête de premier niveau `enable_thinking` de
DashScope : la réflexion désactivée envoie `enable_thinking: false`, tandis que
tout autre niveau envoie `enable_thinking: true`. Les modèles personnalisés
peuvent adopter une autre charge utile de réflexion fondée sur un modèle de
discussion en définissant `compat.thinkingFormat: "qwen-chat-template"` dans
l'entrée du modèle.

Les modèles Token Plan sont également indiqués comme compatibles avec le
raisonnement. `kimi-k2.7-code` et `MiniMax-M2.5` fonctionnent uniquement avec la
réflexion ; OpenClaw la maintient donc activée même lorsque la session demande
`/think off`. DeepSeek V4 associe les niveaux de `minimal` à `high` à l'effort
`high` du service, et `xhigh` ou `max` à `max`. GLM 5.2 accepte toute la plage
de `minimal` à `max` ; GLM 5.1 et GLM 5 acceptent les niveaux jusqu'à `xhigh`,
et les trois utilisent `high` par défaut. Les autres modèles hybrides suivent
l'état d'activation ou de désactivation demandé.

## Extensions multimodales

Le Plugin `qwen` expose des fonctionnalités multimodales uniquement sur les
points de terminaison **Standard** de DashScope, et non sur ceux de Coding Plan :

- **Compréhension des images et des vidéos** via `qwen-vl-max-latest`
- **Génération de vidéos Wan** via `wan2.6-t2v` (par défaut), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

La compréhension des médias est configurée automatiquement à partir de
l'authentification Qwen définie ; aucune configuration supplémentaire n'est
nécessaire. Veillez à utiliser un point de terminaison Standard (paiement à
l'utilisation) pour que la compréhension des médias fonctionne.

Pour faire de Qwen le fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limites de génération vidéo : 1 vidéo de sortie par requête, jusqu'à 1 image
d'entrée (conversion d'image en vidéo), jusqu'à 4 vidéos d'entrée (conversion
de vidéo en vidéo) et une durée maximale de 10 secondes. Prend en charge
`size`, `aspectRatio`, `resolution`, `audio` et `watermark`. Les images ou
vidéos de référence doivent être fournies sous forme d'URL http(s) distantes ;
les chemins de fichiers locaux sont rejetés immédiatement, car le point de
terminaison vidéo de DashScope n'accepte pas les tampons locaux téléversés pour
ces références.

<Note>
Consultez [Génération de vidéos](/fr/tools/video-generation) pour connaître les paramètres communs de l'outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Disponibilité de Qwen 3.6 et 3.7">
    `qwen3.7-plus` et `qwen3.6-plus` sont disponibles sur les points de terminaison Coding Plan et Standard. `qwen3.7-max` et `qwen3.6-flash` sont réservés à Standard. Les points de terminaison Standard (paiement à l'utilisation) sont :

    - Chine : `dashscope.aliyuncs.com/compatible-mode/v1`
    - Monde : `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw omet `qwen3.7-max` et `qwen3.6-flash` des catalogues Coding Plan.
    Si un point de terminaison Coding Plan renvoie une erreur « modèle non pris en charge » pour l'un d'eux,
    utilisez le point de terminaison Standard correspondant et sa clé.

  </Accordion>

  <Accordion title="Routage régional de la génération vidéo">
    OpenClaw associe la région Qwen configurée à l'hôte AIGC DashScope
    correspondant avant d'envoyer une tâche de génération vidéo :

    - Monde/International : `https://dashscope-intl.aliyuncs.com`
    - Chine : `https://dashscope.aliyuncs.com`

    Un `models.providers.qwen.baseUrl` normal pointant vers les hôtes Qwen
    Coding Plan ou Standard achemine tout de même la génération vidéo vers le
    point de terminaison vidéo DashScope régional correspondant.

  </Accordion>

  <Accordion title="Compatibilité de l'utilisation en diffusion continue">
    Les points de terminaison Qwen natifs annoncent une compatibilité des
    données d'utilisation en diffusion continue sur le transport partagé
    `openai-completions`. Les identifiants de fournisseurs personnalisés
    compatibles avec DashScope qui ciblent les mêmes hôtes natifs héritent donc
    du même comportement sans devoir utiliser spécifiquement l'identifiant du
    fournisseur intégré `qwen`. Cela s'applique aux points de terminaison
    Coding Plan, Standard et Token Plan :

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Plan des fonctionnalités">
    Le Plugin `qwen` est destiné à devenir le point de référence du fournisseur
    pour l'ensemble des fonctionnalités de Qwen Cloud, et pas seulement pour
    les modèles de programmation et de texte.

    - **Modèles de texte/discussion :** disponibles via le Plugin
    - **Appel d'outils, sortie structurée, réflexion :** hérités du transport compatible avec OpenAI
    - **Génération d'images :** prévue au niveau du Plugin du fournisseur
    - **Compréhension des images et des vidéos :** disponible via le Plugin sur le point de terminaison Standard
    - **Parole/audio :** prévus au niveau du Plugin du fournisseur
    - **Plongements/réordonnancement pour la mémoire :** prévus via l'interface de l'adaptateur de plongements
    - **Génération de vidéos :** disponible via le Plugin au moyen de la fonctionnalité partagée de génération vidéo

  </Accordion>

  <Accordion title="Configuration de l'environnement et du démon">
    Si le Gateway s'exécute en tant que démon (launchd/systemd), vérifiez que
    `QWEN_API_KEY` ou `QWEN_TOKEN_PLAN_API_KEY` est accessible à ce processus
    (par exemple, dans `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres communs de l'outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Alibaba Model Studio" href="/fr/providers/alibaba" icon="cloud">
    Fournisseur intégré de génération de vidéos Wan sur la même plateforme DashScope.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>

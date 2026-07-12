---
read_when:
    - Vous souhaitez utiliser Qwen avec OpenClaw
    - Vous disposez d’un abonnement au forfait de jetons Alibaba Cloud
    - Vous utilisiez auparavant Qwen OAuth
summary: Utiliser Qwen Cloud via son plugin OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-12T15:54:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud est un plugin de fournisseur externe officiel pour OpenClaw, dont l’identifiant canonique est `qwen`. Il cible les endpoints Qwen Cloud / Alibaba DashScope Standard et Coding Plan, expose le forfait de jetons sous `qwen-token-plan`, conserve `modelstudio` comme alias de compatibilité, gère indépendamment l’identifiant de fournisseur personnalisé `bailian-token-plan` documenté par Alibaba et expose le flux de jeton du portail Qwen sous [`qwen-oauth`](/fr/providers/qwen-oauth).

| Propriété                         | Valeur                                     |
| --------------------------------- | ------------------------------------------ |
| Fournisseur                       | `qwen`                                     |
| Fournisseur du forfait de jetons  | `qwen-token-plan`                          |
| Fournisseur du portail            | [`qwen-oauth`](/fr/providers/qwen-oauth)      |
| Variable d’environnement préférée | `QWEN_API_KEY`                             |
| Variable d’environnement du forfait de jetons | `QWEN_TOKEN_PLAN_API_KEY`       |
| Également acceptées (compatibilité) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Style d’API                       | Compatible avec OpenAI                     |

<Tip>
`qwen3.7-plus` et `qwen3.6-plus` fonctionnent avec les endpoints Coding Plan et Standard.
Pour `qwen3.7-max` ou `qwen3.6-flash`, utilisez un endpoint **Standard (paiement à l’utilisation)**.
</Tip>

## Installer le plugin

`qwen` est distribué comme plugin externe officiel et n’est pas intégré au cœur. Installez-le, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Prise en main

Choisissez votre type de forfait et suivez les étapes de configuration.

<Tabs>
  <Tab title="Coding Plan (abonnement)">
    **Idéal pour :** l’accès par abonnement via le Qwen Coding Plan.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Exécuter l’intégration initiale">
        Pour l’endpoint **mondial** :

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Pour l’endpoint **Chine** :

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
    Les anciens identifiants de choix d’authentification `modelstudio-*` et les
    références de modèle `modelstudio/...` fonctionnent toujours comme alias de
    compatibilité, mais les nouveaux flux de configuration doivent privilégier les
    identifiants canoniques de choix d’authentification `qwen-*` et les références
    de modèle `qwen/...`. Si vous définissez une entrée personnalisée exacte
    `models.providers.modelstudio` avec une autre valeur `api`, ce fournisseur
    personnalisé gère les références `modelstudio/...` à la place de l’alias de
    compatibilité Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (paiement à l’utilisation)">
    **Idéal pour :** l’accès avec paiement à l’utilisation via l’endpoint Standard de Model Studio, notamment à `qwen3.7-max` et `qwen3.6-flash`, qui ne sont pas disponibles avec le Coding Plan.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Exécuter l’intégration initiale">
        Pour l’endpoint **mondial** :

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Pour l’endpoint **Chine** :

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
    Les anciens identifiants de choix d’authentification `modelstudio-*` et les
    références de modèle `modelstudio/...` fonctionnent toujours comme alias de
    compatibilité, mais les nouveaux flux de configuration doivent privilégier les
    identifiants canoniques de choix d’authentification `qwen-*` et les références
    de modèle `qwen/...`. Si vous définissez une entrée personnalisée exacte
    `models.providers.modelstudio` avec une autre valeur `api`, ce fournisseur
    personnalisé gère les références `modelstudio/...` à la place de l’alias de
    compatibilité Qwen.
    </Note>

  </Tab>

  <Tab title="Forfait de jetons (édition Équipe)">
    **Idéal pour :** l’accès par abonnement d’équipe fondé sur des crédits aux modèles Qwen et aux modèles tiers pris en charge via Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Obtenir votre clé dédiée">
        Attribuez un poste du forfait de jetons et créez sa clé dédiée `sk-sp-...`. Les clés du forfait de jetons, du Coding Plan et du paiement à l’utilisation ne sont pas interchangeables. Consultez la [présentation mondiale du forfait de jetons](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) ou la [présentation chinoise du forfait de jetons](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Exécuter l’intégration initiale">
        Pour l’endpoint **mondial / international** à Singapour :

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Pour l’endpoint **Chine** à Pékin :

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
    personnalisé manuel. Le plugin enregistre cet identifiant comme gestionnaire
    de compatibilité, mais les nouvelles configurations doivent utiliser
    `qwen-token-plan`. Une entrée personnalisée exacte
    `models.providers.bailian-token-plan` conserve la gestion du transport et du
    catalogue configurés ; elle n’est jamais fusionnée dans le catalogue OpenAI
    canonique.
    </Note>

    <Warning>
    Utilisez le forfait de jetons uniquement pour les sessions OpenClaw
    interactives. Ne le sélectionnez pas pour les tâches Cron, les scripts sans
    surveillance ou les backends d’applications. Alibaba indique qu’une utilisation
    non interactive peut suspendre l’abonnement ou révoquer sa clé API.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portail">
    **Idéal pour :** utiliser un jeton du portail Qwen avec `https://portal.qwen.ai/v1`.

    Consultez [Qwen OAuth / Portail](/fr/providers/qwen-oauth) pour accéder à la page
    dédiée au fournisseur et aux notes de migration.

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
    `qwen-oauth` utilise le même nom de variable d’environnement `QWEN_API_KEY`
    que le fournisseur Qwen Cloud, mais stocke l’authentification sous
    l’identifiant de fournisseur `qwen-oauth` lorsqu’elle est configurée via
    l’intégration initiale d’OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Types de forfaits et endpoints

| Forfait                            | Région  | Choix d’authentification     | Endpoint                                                         |
| ---------------------------------- | ------- | ---------------------------- | ---------------------------------------------------------------- |
| Coding Plan (abonnement)           | Chine   | `qwen-api-key-cn`            | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (abonnement)           | Mondial | `qwen-api-key`               | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Portail Qwen                       | Mondial | `qwen-oauth`                 | `portal.qwen.ai/v1`                                              |
| Standard (paiement à l’utilisation) | Chine  | `qwen-standard-api-key-cn`   | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (paiement à l’utilisation) | Mondial | `qwen-standard-api-key`     | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Forfait de jetons (édition Équipe) | Chine   | `qwen-token-plan-cn`         | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Forfait de jetons (édition Équipe) | Mondial | `qwen-token-plan`            | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Le fournisseur sélectionne automatiquement l’endpoint en fonction de votre choix
d’authentification. Les choix canoniques utilisent la famille `qwen-*` ;
`modelstudio-*` reste réservé à la compatibilité. Remplacez ce comportement avec
une valeur `baseUrl` personnalisée dans la configuration.

<Tip>
**Gérer les clés :** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentation :** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogue intégré

OpenClaw distribue ce catalogue statique Qwen. Le catalogue tient compte de
l’endpoint : les configurations du Coding Plan omettent les modèles qui
fonctionnent uniquement sur l’endpoint Standard.

| Référence du modèle         | Entrée      | Contexte  | Remarques                              |
| --------------------------- | ----------- | --------- | -------------------------------------- |
| `qwen/qwen3.5-plus`         | texte, image | 1,000,000 | Modèle par défaut                      |
| `qwen/qwen3.6-flash`        | texte, image | 1,000,000 | Endpoints Standard uniquement          |
| `qwen/qwen3.6-plus`         | texte, image | 1,000,000 | Coding Plan + Standard                 |
| `qwen/qwen3.7-max`          | texte       | 1,000,000 | Endpoints Standard uniquement          |
| `qwen/qwen3.7-plus`         | texte, image | 1,000,000 | Coding Plan + Standard                 |
| `qwen/qwen3-max-2026-01-23` | texte       | 262,144   | Gamme Qwen Max                         |
| `qwen/qwen3-coder-next`     | texte       | 262,144   | Programmation                          |
| `qwen/qwen3-coder-plus`     | texte       | 1,000,000 | Programmation                          |
| `qwen/MiniMax-M2.5`         | texte       | 1,000,000 | Raisonnement activé                    |
| `qwen/glm-5`                | texte       | 202,752   | GLM                                    |
| `qwen/glm-4.7`              | texte       | 202,752   | GLM                                    |
| `qwen/kimi-k2.5`            | texte, image | 262,144   | Moonshot AI via Alibaba                |
| `qwen-oauth/qwen3.5-plus`   | texte, image | 1,000,000 | Modèle Qwen Portal par défaut          |

<Note>
La disponibilité peut tout de même varier selon l’endpoint et le forfait de
facturation, même lorsqu’un modèle figure dans le catalogue statique.
</Note>

### Catalogue du forfait de jetons

Le forfait de jetons utilise une liste d’autorisation distincte fondée sur des
chaînes exactes. Les modèles du forfait réservés à la génération d’images ne sont
pas inclus ici, car ils utilisent des API différentes.

| Référence du modèle                 | Entrée      | Contexte  |
| ----------------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | texte       | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | texte, image | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | texte, image | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | texte, image | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | texte       | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | texte       | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | texte       | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | texte, image | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | texte, image | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | texte, image | 262,144   |
| `qwen-token-plan/glm-5.2`           | texte       | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | texte       | 202,752   |
| `qwen-token-plan/glm-5`             | texte       | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | texte       | 196,608   |

## Contrôles du raisonnement

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` et `qwen3.6-plus` prennent
en charge le raisonnement dans le catalogue intégré. Pour les modèles de raisonnement de la famille `qwen`,
le fournisseur associe les niveaux de réflexion d’OpenClaw au paramètre de requête de premier niveau
`enable_thinking` de DashScope : lorsque la réflexion est désactivée, `enable_thinking: false` est envoyé ;
pour tout autre niveau, `enable_thinking: true` est envoyé. Les modèles personnalisés peuvent adopter une
autre charge utile de réflexion fondée sur le modèle de conversation en définissant
`compat.thinkingFormat: "qwen-chat-template"` dans l’entrée du modèle.

Les modèles Token Plan sont également indiqués comme capables de raisonner. `kimi-k2.7-code` et
`MiniMax-M2.5` fonctionnent uniquement avec la réflexion ; OpenClaw la maintient donc activée même lorsque
la session demande `/think off`. DeepSeek V4 associe les niveaux de `minimal` à `high` à
l’effort `high` du service, et `xhigh` ou `max` à `max`. GLM 5.2 accepte
toute la plage de `minimal` à `max` ; GLM 5.1 et GLM 5 acceptent les niveaux jusqu’à
`xhigh`, et les trois utilisent `high` par défaut. Les autres modèles hybrides suivent
l’état d’activation ou de désactivation demandé.

## Extensions multimodales

Le plugin `qwen` fournit des capacités multimodales uniquement sur les points de terminaison
DashScope **Standard**, et non sur ceux de Coding Plan :

- **Compréhension des images et des vidéos** via `qwen-vl-max-latest`
- **Génération de vidéos Wan** via `wan2.6-t2v` (par défaut), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

L’authentification Qwen configurée est automatiquement utilisée pour la compréhension des médias ;
aucune configuration supplémentaire n’est nécessaire. Veillez à utiliser un point de terminaison Standard
(paiement à l’utilisation) pour que la compréhension des médias fonctionne.

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

Limites de génération vidéo : 1 vidéo de sortie par requête, jusqu’à 1 image d’entrée
(image vers vidéo), jusqu’à 4 vidéos d’entrée (vidéo vers vidéo), durée maximale de 10 secondes.
Prend en charge `size`, `aspectRatio`, `resolution`, `audio` et
`watermark`. Les images et vidéos de référence doivent être fournies sous forme d’URL http(s) distantes ;
les chemins de fichiers locaux sont refusés immédiatement, car le point de terminaison vidéo DashScope
n’accepte pas l’envoi de tampons locaux pour ces références.

<Note>
Consultez [Génération de vidéos](/fr/tools/video-generation) pour connaître les paramètres communs de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Disponibilité de Qwen 3.6 et 3.7">
    `qwen3.7-plus` et `qwen3.6-plus` sont disponibles sur les points de terminaison Coding Plan et Standard. `qwen3.7-max` et `qwen3.6-flash` sont disponibles uniquement sur Standard. Les points de terminaison Standard (paiement à l’utilisation) sont :

    - Chine : `dashscope.aliyuncs.com/compatible-mode/v1`
    - Monde : `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw omet `qwen3.7-max` et `qwen3.6-flash` des catalogues Coding Plan.
    Si un point de terminaison Coding Plan renvoie une erreur « modèle non pris en charge » pour l’un d’eux,
    utilisez le point de terminaison Standard correspondant ainsi que sa clé.

  </Accordion>

  <Accordion title="Routage régional de la génération vidéo">
    OpenClaw associe la région Qwen configurée à l’hôte AIGC DashScope correspondant
    avant de soumettre une tâche vidéo :

    - Monde/International : `https://dashscope-intl.aliyuncs.com`
    - Chine : `https://dashscope.aliyuncs.com`

    Une valeur `models.providers.qwen.baseUrl` normale pointant vers les hôtes Qwen
    Coding Plan ou Standard achemine tout de même la génération vidéo vers le point de terminaison vidéo
    régional DashScope correspondant.

  </Accordion>

  <Accordion title="Compatibilité de l’utilisation en streaming">
    Les points de terminaison Qwen natifs annoncent la compatibilité des données d’utilisation en streaming sur le transport
    `openai-completions` partagé. Les identifiants de fournisseurs personnalisés compatibles avec DashScope
    qui ciblent les mêmes hôtes natifs héritent donc du même comportement sans devoir
    utiliser spécifiquement l’identifiant de fournisseur `qwen` intégré. Cela s’applique aux points de terminaison Coding Plan,
    Standard et Token Plan :

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Plan des capacités">
    Le plugin `qwen` est destiné à devenir le point d’intégration du fournisseur pour l’ensemble
    des fonctionnalités de Qwen Cloud, et pas seulement pour les modèles de programmation et de texte.

    - **Modèles de texte/conversation :** disponibles via le plugin
    - **Appel d’outils, sortie structurée, réflexion :** hérités du transport compatible avec OpenAI
    - **Génération d’images :** prévue au niveau du plugin du fournisseur
    - **Compréhension des images et des vidéos :** disponible via le plugin sur le point de terminaison Standard
    - **Parole/audio :** prévus au niveau du plugin du fournisseur
    - **Plongements de mémoire/reclassement :** prévus via l’interface de l’adaptateur de plongements
    - **Génération de vidéos :** disponible via le plugin grâce à la capacité partagée de génération vidéo

  </Accordion>

  <Accordion title="Configuration de l’environnement et du démon">
    Si le Gateway s’exécute comme un démon (launchd/systemd), vérifiez que `QWEN_API_KEY`
    ou `QWEN_TOKEN_PLAN_API_KEY` est accessible à ce processus (par exemple dans
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Ressources connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres communs de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Alibaba Model Studio" href="/fr/providers/alibaba" icon="cloud">
    Fournisseur intégré de génération de vidéos Wan sur la même plateforme DashScope.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>

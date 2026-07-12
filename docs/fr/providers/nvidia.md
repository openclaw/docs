---
read_when:
    - Vous souhaitez utiliser gratuitement des modèles ouverts dans OpenClaw
    - Vous devez configurer `NVIDIA_API_KEY`
    - Vous souhaitez utiliser Nemotron 3 Ultra via NVIDIA
summary: Utiliser l’API compatible avec OpenAI de NVIDIA dans OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T03:00:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA fournit gratuitement des modèles ouverts via une API compatible avec OpenAI à l’adresse
`https://integrate.api.nvidia.com/v1`, authentifiée avec une clé API obtenue sur
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
utilise par défaut Nemotron 3 Ultra pour le fournisseur NVIDIA, le modèle de raisonnement
de NVIDIA comptant 550 milliards de paramètres au total, dont 55 milliards actifs,
destiné aux tâches agentiques à contexte long.

## Prise en main

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporter la clé et lancer l’intégration">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Définir un modèle NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Pour une configuration non interactive, transmettez directement la clé :

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` inscrit la clé dans l’historique du shell et dans la sortie de `ps`. Privilégiez
la variable d’environnement `NVIDIA_API_KEY` lorsque cela est possible.
</Warning>

## Exemple de configuration

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Catalogue à la une

Lorsqu’une clé API NVIDIA est configurée, les parcours de configuration et de sélection
de modèle récupèrent le catalogue public des modèles à la une de NVIDIA depuis
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` et
mettent le résultat en cache pendant 24 heures (les 32 premières entrées, importées
comme lignes de saisie de texte libre). Les nouveaux modèles à la une de build.nvidia.com
apparaissent ainsi dans les interfaces de configuration et de sélection de modèle sans
attendre une nouvelle version d’OpenClaw. Lorsque le flux en direct est disponible,
le premier modèle renvoyé est l’option présélectionnée pendant la configuration de NVIDIA.

La récupération applique une politique d’hôte HTTPS fixe pour `assets.ngc.nvidia.com`. Si
aucune clé API NVIDIA n’est configurée, ou si le flux est indisponible ou mal formé,
OpenClaw utilise le catalogue intégré et le modèle par défaut intégré ci-dessous.

## Nemotron 3 Ultra

Nemotron 3 Ultra est le modèle NVIDIA par défaut dans OpenClaw. La page de NVIDIA consacrée à
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
le présente comme un point de terminaison gratuit disponible, avec une fenêtre de contexte d’un million de jetons.

La ligne Ultra intégrée envoie
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
par défaut, afin que la sortie normale de la conversation reste dans la réponse visible au lieu
d’exposer le texte de raisonnement.

Utilisez Ultra comme modèle NVIDIA par défaut offrant les meilleures capacités. Conservez
Super lorsque vous souhaitez utiliser la variante Nemotron 3 plus petite, ou choisissez l’un
des modèles tiers hébergés dans le catalogue de NVIDIA si leur contexte, leur latence ou leur
comportement conviennent mieux.

## Catalogue de secours intégré

Les lignes intégrées sélectionnables constituent un instantané du catalogue des modèles à la une
de NVIDIA. Les lignes de compatibilité obsolètes restent accessibles par leur référence exacte,
mais n’apparaissent pas dans les sélecteurs de modèles.

| Référence du modèle                        | Nom                   | Contexte  | Sortie maximale |
| ------------------------------------------ | --------------------- | --------- | --------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192           |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192           |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192           |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192           |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384          |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384          |

Le catalogue de compatibilité complet conserve également les références déjà publiées suivantes
pour les configurations existantes : `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` et
`nvidia/minimaxai/minimax-m2.7`. Elles restent disponibles par leur référence exacte, mais
n’apparaissent jamais dans l’intégration ni dans les sélecteurs de modèles.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Activation automatique">
    Le fournisseur s’active automatiquement lorsque la variable d’environnement `NVIDIA_API_KEY`
    est définie ou qu’une clé a été enregistrée pendant l’intégration. Aucune configuration explicite
    du fournisseur n’est requise au-delà de la clé.
  </Accordion>

  <Accordion title="Catalogue et tarification">
    OpenClaw privilégie le catalogue public des modèles à la une de NVIDIA lorsque l’authentification
    NVIDIA est configurée et le met en cache pendant 24 heures. Le catalogue de secours intégré et
    sélectionnable est un instantané statique du catalogue des modèles à la une de NVIDIA ; les lignes
    de compatibilité obsolètes accessibles par référence exacte sont masquées dans les sélecteurs de
    modèles. Les coûts valent `0` par défaut dans le code source, car NVIDIA propose actuellement un
    accès gratuit à l’API pour les modèles répertoriés.
  </Accordion>

  <Accordion title="Point de terminaison compatible avec OpenAI">
    OpenClaw communique avec NVIDIA au moyen de l’adaptateur `openai-completions` via la route
    standard `/v1` de complétion de conversation. Tout outil compatible avec OpenAI devrait fonctionner
    immédiatement avec l’URL de base de NVIDIA.
  </Accordion>

  <Accordion title="Paramètres de raisonnement de Nemotron 3 Ultra">
    L’exemple de requête Ultra de NVIDIA utilise `chat_template_kwargs.enable_thinking`
    et `reasoning_budget` pour produire le raisonnement. La ligne Ultra intégrée d’OpenClaw
    désactive par défaut le raisonnement du modèle de conversation pour une utilisation normale.
    Si vous devez activer la sortie de raisonnement de NVIDIA ou imposer d’autres champs de requête
    propres à NVIDIA, définissez des paramètres par modèle et limitez les substitutions propres au
    fournisseur au modèle NVIDIA :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.chat_template_kwargs` est fusionné avec tout `chat_template_kwargs`
    déjà présent dans la requête au lieu de remplacer l’objet entier.
    `params.extra_body` constitue la substitution finale du corps de requête compatible avec
    OpenAI et remplace les clés de charge utile en conflit ; utilisez-le donc uniquement pour les
    champs documentés par NVIDIA pour le point de terminaison sélectionné.

  </Accordion>

  <Accordion title="Réponses lentes d’un fournisseur personnalisé">
    Certains modèles personnalisés hébergés par NVIDIA peuvent mettre plus de temps que les quelque
    120 secondes par défaut du mécanisme de surveillance d’inactivité du modèle avant d’émettre un
    premier fragment de réponse. Pour les entrées de fournisseur NVIDIA personnalisées, augmentez
    le délai d’expiration du fournisseur plutôt que celui de l’ensemble de l’environnement d’exécution
    de l’agent ; `timeoutSeconds` couvre les requêtes HTTP du fournisseur et relève le plafond du
    mécanisme de surveillance d’inactivité ou de diffusion pour ce fournisseur :

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
L’utilisation des modèles NVIDIA est actuellement gratuite. Consultez
[build.nvidia.com](https://build.nvidia.com/) pour connaître leur disponibilité actuelle et
les détails relatifs aux limites de débit.
</Tip>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration des agents, des modèles et des fournisseurs.
  </Card>
</CardGroup>

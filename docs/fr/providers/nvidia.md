---
read_when:
    - Vous souhaitez utiliser gratuitement des modèles ouverts dans OpenClaw
    - Vous devez configurer NVIDIA_API_KEY
    - Vous souhaitez utiliser Nemotron 3 Ultra via NVIDIA
summary: Utiliser l’API compatible avec OpenAI de NVIDIA dans OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T15:43:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA fournit gratuitement des modèles ouverts par l’intermédiaire d’une API compatible avec OpenAI à l’adresse
`https://integrate.api.nvidia.com/v1`, authentifiée à l’aide d’une clé API obtenue sur
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
utilise par défaut Nemotron 3 Ultra pour le fournisseur NVIDIA, le modèle de raisonnement de NVIDIA
comptant 550 milliards de paramètres au total, dont 55 milliards actifs, conçu pour les tâches agentiques
à contexte long.

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
`--nvidia-api-key` enregistre la clé dans l’historique du shell et la sortie de `ps`. Préférez la
variable d’environnement `NVIDIA_API_KEY` lorsque cela est possible.
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

## Catalogue mis en avant

Lorsqu’une clé API NVIDIA est configurée, les parcours de configuration et de sélection de modèle récupèrent
le catalogue public des modèles mis en avant de NVIDIA depuis
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` et
mettent le résultat en cache pendant 24 heures (les 32 premières entrées, importées en tant que lignes
d’entrée de texte libre). Les nouveaux modèles mis en avant sur build.nvidia.com apparaissent donc dans les interfaces
de configuration et de sélection de modèle sans qu’il soit nécessaire d’attendre une version d’OpenClaw. Lorsque
le flux en direct est disponible, le premier modèle renvoyé est l’option présélectionnée
pendant la configuration de NVIDIA.

La récupération utilise une politique d’hôte HTTPS fixe pour `assets.ngc.nvidia.com`. Si aucune
clé API NVIDIA n’est configurée, ou si le flux est indisponible ou mal formé,
OpenClaw utilise à la place le catalogue intégré et la valeur par défaut intégrée ci-dessous.

## Nemotron 3 Ultra

Nemotron 3 Ultra est le modèle NVIDIA par défaut dans OpenClaw. La page de NVIDIA consacrée à
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
le présente comme un point de terminaison gratuit disponible, avec une spécification de contexte de 1 million de jetons.

La ligne Ultra intégrée envoie
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
par défaut afin que la sortie de conversation normale reste dans la réponse visible au lieu
d’exposer le texte de raisonnement.

Utilisez Ultra comme option NVIDIA par défaut offrant les meilleures capacités. Conservez Super sélectionné lorsque
vous souhaitez utiliser la variante Nemotron 3 plus petite, ou choisissez l’un des modèles tiers
hébergés dans le catalogue de NVIDIA si son contexte, sa latence ou son comportement convient mieux.

## Catalogue de secours intégré

Les lignes intégrées sélectionnables constituent un instantané du catalogue de modèles mis en avant de NVIDIA. Les lignes
de compatibilité obsolètes restent accessibles par leur référence exacte, mais sont absentes des
sélecteurs de modèles.

| Référence du modèle                        | Nom                   | Contexte  | Sortie maximale |
| ------------------------------------------ | --------------------- | --------- | --------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192           |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192           |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192           |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192           |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384          |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384          |

Le catalogue de compatibilité complet conserve également ces références déjà publiées pour les
configurations existantes : `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` et
`nvidia/minimaxai/minimax-m2.7`. Elles restent disponibles par leur référence exacte, mais
n’apparaissent jamais pendant l’intégration ni dans les sélecteurs de modèles.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement d’activation automatique">
    Le fournisseur s’active automatiquement lorsque la variable d’environnement `NVIDIA_API_KEY` est
    définie ou qu’une clé a été enregistrée pendant l’intégration. Aucune configuration explicite du fournisseur
    n’est requise en dehors de la clé.
  </Accordion>

  <Accordion title="Catalogue et tarification">
    OpenClaw privilégie le catalogue public des modèles mis en avant de NVIDIA lorsque l’authentification NVIDIA est
    configurée et le met en cache pendant 24 heures. Le catalogue de secours intégré sélectionnable est un
    instantané statique du catalogue des modèles mis en avant de NVIDIA ; les lignes de compatibilité obsolètes
    accessibles par référence exacte sont masquées dans les sélecteurs de modèles. Les coûts sont définis par défaut sur `0` dans
    le code source, car NVIDIA propose actuellement un accès gratuit à l’API pour les modèles répertoriés.
  </Accordion>

  <Accordion title="Point de terminaison compatible avec OpenAI">
    OpenClaw communique avec NVIDIA à l’aide de l’adaptateur `openai-completions` sur la
    route standard de complétion de conversation `/v1`. Tout outil compatible avec OpenAI devrait
    fonctionner immédiatement avec l’URL de base NVIDIA.
  </Accordion>

  <Accordion title="Paramètres de raisonnement de Nemotron 3 Ultra">
    L’exemple de requête Ultra de NVIDIA utilise `chat_template_kwargs.enable_thinking`
    et `reasoning_budget` pour la sortie du raisonnement. La ligne Ultra intégrée d’OpenClaw
    désactive par défaut le raisonnement du modèle de conversation pour une utilisation normale. Si vous devez
    activer la sortie de raisonnement de NVIDIA ou imposer d’autres champs de requête
    propres à NVIDIA, définissez des paramètres par modèle et limitez les remplacements propres au fournisseur
    au modèle NVIDIA :

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
    `params.extra_body` constitue le remplacement final du corps de requête compatible avec OpenAI
    et écrase les clés de charge utile en conflit ; utilisez-le donc uniquement pour les champs que NVIDIA
    documente pour le point de terminaison sélectionné.

  </Accordion>

  <Accordion title="Réponses lentes d’un fournisseur personnalisé">
    Certains modèles personnalisés hébergés par NVIDIA peuvent prendre plus de temps que les quelque 120 s par défaut
    du mécanisme de surveillance de l’inactivité du modèle avant d’émettre un premier fragment de réponse. Pour les entrées
    de fournisseur NVIDIA personnalisées, augmentez le délai d’expiration du fournisseur plutôt que celui de l’ensemble
    de l’environnement d’exécution de l’agent ; `timeoutSeconds` couvre les requêtes HTTP du fournisseur et
    relève la limite du mécanisme de surveillance de l’inactivité et du flux pour ce fournisseur :

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
[build.nvidia.com](https://build.nvidia.com/) pour connaître les dernières informations sur leur disponibilité et
les limites de débit.
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

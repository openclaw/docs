---
read_when:
    - Vous voulez utiliser gratuitement des modèles ouverts dans OpenClaw
    - Vous devez configurer NVIDIA_API_KEY
    - Vous souhaitez utiliser Nemotron 3 Ultra via NVIDIA
summary: Utiliser l’API compatible OpenAI de NVIDIA dans OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:20:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA fournit une API compatible avec OpenAI à l’adresse `https://integrate.api.nvidia.com/v1` pour
les modèles ouverts gratuitement. Authentifiez-vous avec une clé d’API depuis
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
définit par défaut le fournisseur NVIDIA sur Nemotron 3 Ultra, le modèle de
raisonnement actif de NVIDIA totalisant 550B / 55B, conçu pour le travail
agentique à contexte long.

## Premiers pas

<Steps>
  <Step title="Obtenir votre clé d’API">
    Créez une clé d’API sur [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporter la clé et exécuter l’intégration">
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

<Warning>
Si vous passez `--nvidia-api-key` au lieu de la variable d’environnement, la valeur se retrouve dans
l’historique du shell et la sortie de `ps`. Préférez la variable d’environnement `NVIDIA_API_KEY` lorsque
c’est possible.
</Warning>

Pour une configuration non interactive, vous pouvez également passer la clé directement :

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

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

Lorsqu’une clé d’API NVIDIA est configurée, la configuration d’OpenClaw et les parcours de sélection de modèles
essaient le catalogue public de modèles mis en avant par NVIDIA depuis
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` et
mettent en cache le résultat classé pendant 24 heures. Les nouveaux modèles mis en avant depuis build.nvidia.com
apparaissent donc dans les surfaces de configuration et de sélection de modèles sans attendre une
version d’OpenClaw. Lorsque le flux en direct est disponible, le premier modèle renvoyé est
l’option par défaut affichée lors de la configuration NVIDIA.

La récupération utilise une politique d’hôte HTTPS fixe pour `assets.ngc.nvidia.com`. Si aucune
clé d’API NVIDIA n’est configurée, ou si ce catalogue public est indisponible ou
mal formé, OpenClaw se rabat sur le catalogue groupé et la valeur par défaut groupée ci-dessous.

## Nemotron 3 Ultra

Nemotron 3 Ultra est le modèle NVIDIA par défaut dans OpenClaw. La page de build de NVIDIA pour
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
le liste comme endpoint gratuit disponible avec une spécification de contexte de 1M de jetons.
Le catalogue groupé enregistre une sortie maximale de 16 384 jetons pour correspondre à la requête d’exemple
compatible OpenAI actuelle de NVIDIA pour l’endpoint hébergé.

Utilisez Ultra pour le modèle NVIDIA par défaut aux capacités les plus élevées. Gardez Super sélectionné lorsque
vous voulez l’option Nemotron 3 plus petite, ou choisissez l’un des modèles tiers
hébergés dans le catalogue NVIDIA lorsque leur contexte, leur latence ou leur comportement convient mieux.
La ligne Ultra groupée envoie `chat_template_kwargs.enable_thinking: false` et
`force_nonempty_content: true` par défaut afin que la sortie de chat normale reste dans la
réponse visible au lieu d’exposer le texte de raisonnement.

## Catalogue de secours groupé

| Référence de modèle                         | Nom                          | Contexte  | Sortie max. | Notes                                      |
| ------------------------------------------ | ---------------------------- | --------- | ----------- | ------------------------------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384      | Par défaut                                 |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192       | Secours mis en avant                       |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192       | Secours mis en avant                       |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192       | Secours mis en avant                       |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192       | Secours mis en avant                       |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192       | Obsolète, compatibilité de mise à niveau   |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192       | Obsolète, compatibilité de mise à niveau   |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement d’activation automatique">
    Le fournisseur s’active automatiquement lorsque la variable d’environnement `NVIDIA_API_KEY` est définie.
    Aucune configuration explicite du fournisseur n’est requise au-delà de la clé.
  </Accordion>

  <Accordion title="Catalogue et tarification">
    OpenClaw privilégie le catalogue public de modèles mis en avant par NVIDIA lorsque l’authentification NVIDIA est
    configurée et le met en cache pendant 24 heures. Le catalogue de secours groupé est statique
    et conserve les références livrées obsolètes pour la compatibilité de mise à niveau. Les coûts valent par défaut
    `0` dans la source, car NVIDIA propose actuellement un accès gratuit à l’API pour les
    modèles listés.
  </Accordion>

  <Accordion title="Endpoint compatible OpenAI">
    NVIDIA utilise l’endpoint standard de complétions `/v1`. Tout outil compatible OpenAI
    devrait fonctionner immédiatement avec l’URL de base NVIDIA.
  </Accordion>

  <Accordion title="Paramètres de raisonnement de Nemotron 3 Ultra">
    La requête d’exemple Ultra de NVIDIA utilise `chat_template_kwargs.enable_thinking`
    et `reasoning_budget` pour la sortie de raisonnement. La ligne Ultra groupée d’OpenClaw
    désactive la pensée de modèle par défaut pour l’utilisation normale du chat. Si vous devez
    activer la sortie de raisonnement NVIDIA ou forcer d’autres champs de requête spécifiques à NVIDIA,
    définissez des paramètres par modèle et gardez les surcharges propres au fournisseur limitées au
    modèle NVIDIA :

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

    `params.extra_body` est la surcharge finale du corps de requête compatible OpenAI ; utilisez-la donc
    uniquement pour les champs que NVIDIA documente pour l’endpoint sélectionné.

  </Accordion>

  <Accordion title="Réponses lentes de fournisseur personnalisé">
    Certains modèles personnalisés hébergés par NVIDIA peuvent prendre plus de temps que le chien de garde d’inactivité
    du modèle par défaut avant d’émettre un premier fragment de réponse. Pour les entrées de fournisseur NVIDIA
    personnalisées, augmentez le délai d’expiration du fournisseur plutôt que celui de toute la durée d’exécution de
    l’agent :

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
Les modèles NVIDIA sont actuellement gratuits. Consultez
[build.nvidia.com](https://build.nvidia.com/) pour connaître les dernières disponibilités et
les détails des limites de débit.
</Tip>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>

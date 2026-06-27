---
read_when:
    - Vous souhaitez utiliser gratuitement des modèles ouverts dans OpenClaw
    - Vous devez configurer NVIDIA_API_KEY
    - Vous souhaitez utiliser Nemotron 3 Ultra via NVIDIA
summary: Utiliser l’API compatible OpenAI de NVIDIA dans OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:06:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA fournit une API compatible avec OpenAI à `https://integrate.api.nvidia.com/v1` pour
les modèles ouverts gratuitement. Authentifiez-vous avec une clé API depuis
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
définit par défaut le fournisseur NVIDIA sur Nemotron 3 Ultra, le modèle de raisonnement
de NVIDIA à 550B au total / 55B actifs pour le travail agentique à long contexte.

## Premiers pas

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

<Warning>
Si vous passez `--nvidia-api-key` au lieu de la variable d’environnement, la valeur se retrouve dans
l’historique du shell et dans la sortie de `ps`. Préférez la variable d’environnement `NVIDIA_API_KEY` lorsque
c’est possible.
</Warning>

Pour une configuration non interactive, vous pouvez aussi passer la clé directement :

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

Lorsqu’une clé API NVIDIA est configurée, les chemins de configuration et de sélection de modèle d’OpenClaw
essaient le catalogue public des modèles mis en avant de NVIDIA depuis
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` et
mettent en cache le résultat classé pendant 24 heures. Les nouveaux modèles mis en avant de build.nvidia.com
apparaissent donc dans les surfaces de configuration et de sélection de modèle sans attendre une
version d’OpenClaw. Lorsque le flux en direct est disponible, le premier modèle retourné est
l’option par défaut affichée pendant la configuration de NVIDIA.

La récupération utilise une politique d’hôte HTTPS fixe pour `assets.ngc.nvidia.com`. Si aucune
clé API NVIDIA n’est configurée, ou si ce catalogue public est indisponible ou
mal formé, OpenClaw revient au catalogue intégré et à la valeur par défaut intégrée ci-dessous.

## Nemotron 3 Ultra

Nemotron 3 Ultra est le modèle NVIDIA par défaut dans OpenClaw. La page build de NVIDIA pour
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
le répertorie comme un point de terminaison gratuit disponible avec une spécification de contexte d’un million de tokens.
Le catalogue intégré enregistre une sortie maximale de 16 384 tokens pour correspondre à la requête d’exemple actuelle de NVIDIA
compatible avec OpenAI pour le point de terminaison hébergé.

Utilisez Ultra pour la valeur par défaut NVIDIA la plus performante. Gardez Super sélectionné lorsque
vous voulez l’option Nemotron 3 plus petite, ou choisissez l’un des modèles tiers
hébergés dans le catalogue NVIDIA lorsque leur contexte, leur latence ou leur comportement convient mieux.
La ligne Ultra intégrée envoie `chat_template_kwargs.enable_thinking: false` et
`force_nonempty_content: true` par défaut afin que la sortie de discussion normale reste dans la
réponse visible au lieu d’exposer le texte de raisonnement.

## Catalogue de repli intégré

| Réf. du modèle                            | Nom                          | Contexte  | Sortie max. | Notes                                      |
| ------------------------------------------ | ---------------------------- | --------- | ----------- | ------------------------------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384      | Par défaut                                 |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192       | Solution de repli mise en avant            |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192       | Solution de repli mise en avant            |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192       | Solution de repli mise en avant            |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192       | Solution de repli mise en avant            |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192       | Obsolète, compatibilité de mise à niveau   |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192       | Obsolète, compatibilité de mise à niveau   |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement d’activation automatique">
    Le fournisseur s’active automatiquement lorsque la variable d’environnement `NVIDIA_API_KEY` est définie.
    Aucune configuration explicite du fournisseur n’est requise au-delà de la clé.
  </Accordion>

  <Accordion title="Catalogue et tarification">
    OpenClaw préfère le catalogue public des modèles mis en avant de NVIDIA lorsque l’authentification NVIDIA est
    configurée et le met en cache pendant 24 heures. Le catalogue de repli intégré est statique
    et conserve les références livrées obsolètes pour la compatibilité de mise à niveau. Les coûts valent par défaut
    `0` dans la source, car NVIDIA propose actuellement un accès API gratuit pour les
    modèles listés.
  </Accordion>

  <Accordion title="Point de terminaison compatible avec OpenAI">
    NVIDIA utilise le point de terminaison de complétions standard `/v1`. Tout outillage compatible avec OpenAI
    devrait fonctionner directement avec l’URL de base NVIDIA.
  </Accordion>

  <Accordion title="Paramètres de raisonnement de Nemotron 3 Ultra">
    La requête d’exemple Ultra de NVIDIA utilise `chat_template_kwargs.enable_thinking`
    et `reasoning_budget` pour la sortie de raisonnement. La ligne Ultra intégrée d’OpenClaw
    désactive par défaut la pensée du modèle pour une utilisation de discussion normale. Si vous devez
    opter pour la sortie de raisonnement NVIDIA ou forcer d’autres champs de requête propres à NVIDIA,
    définissez des paramètres par modèle et limitez les remplacements propres au fournisseur
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

    `params.extra_body` est le remplacement final du corps de requête compatible avec OpenAI ; utilisez-le donc
    uniquement pour les champs que NVIDIA documente pour le point de terminaison sélectionné.

  </Accordion>

  <Accordion title="Réponses lentes d’un fournisseur personnalisé">
    Certains modèles personnalisés hébergés par NVIDIA peuvent prendre plus de temps que le chien de garde d’inactivité
    par défaut du modèle avant d’émettre un premier fragment de réponse. Pour les entrées de fournisseur NVIDIA
    personnalisées, augmentez le délai d’expiration du fournisseur au lieu d’augmenter le délai d’expiration de tout
    le runtime de l’agent :

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
[build.nvidia.com](https://build.nvidia.com/) pour connaître les dernières informations de disponibilité et
de limites de débit.
</Tip>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>

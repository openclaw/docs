---
read_when:
    - Vous voulez utiliser les modèles Z.AI / GLM dans OpenClaw
    - Vous avez besoin d’une configuration ZAI_API_KEY simple
summary: Utiliser Z.AI (modèles GLM) avec OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:08:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI est la plateforme d’API pour les modèles **GLM**. Elle fournit des API REST pour GLM et
utilise des clés d’API pour l’authentification. Créez votre clé d’API dans la console Z.AI.
OpenClaw utilise le provider `zai` avec une clé d’API Z.AI.

| Propriété | Valeur                                      |
| --------- | ------------------------------------------- |
| Provider  | `zai`                                       |
| Package   | `@openclaw/zai-provider`                    |
| Auth      | `ZAI_API_KEY` (alias hérité : `Z_AI_API_KEY`) |
| API       | Chat Completions Z.AI (authentification Bearer) |

## Modèles GLM

GLM est une famille de modèles, pas un provider distinct. Dans OpenClaw, les modèles GLM utilisent
des références comme `zai/glm-5.2` : provider `zai`, identifiant de modèle `glm-5.2`.

## Premiers pas

Installez d’abord le Plugin provider :

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Détection automatique du point de terminaison">
    **Idéal pour :** la plupart des utilisateurs. OpenClaw sonde les points de terminaison Z.AI pris en charge avec votre clé d’API et applique automatiquement l’URL de base correcte.

    <Steps>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Vérifier que le modèle est listé">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Point de terminaison régional explicite">
    **Idéal pour :** les utilisateurs qui veulent forcer un Coding Plan spécifique ou une surface d’API générale.

    <Steps>
      <Step title="Choisir la bonne option d’onboarding">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Vérifier que le modèle est listé">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Exemple de configuration

<Tip>
`zai-api-key` permet à OpenClaw de détecter le point de terminaison Z.AI correspondant à partir de la clé et
d’appliquer automatiquement l’URL de base correcte. Utilisez les options régionales explicites lorsque
vous voulez forcer un Coding Plan spécifique ou une surface d’API générale.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Catalogue intégré

Le Plugin provider `zai` livre son catalogue dans le manifeste du Plugin, ce qui permet à une liste en lecture seule
d’afficher les lignes GLM connues sans charger le runtime du provider :

```bash
openclaw models list --all --provider zai
```

Le catalogue adossé au manifeste inclut actuellement :

| Référence du modèle | Notes                           |
| ------------------- | ------------------------------- |
| `zai/glm-5.2`       | Valeur par défaut du Coding Plan ; contexte 1M |
| `zai/glm-5.1`       | Valeur par défaut de l’API générale |
| `zai/glm-5`         |                                 |
| `zai/glm-5-turbo`   |                                 |
| `zai/glm-5v-turbo`  |                                 |
| `zai/glm-4.7`       |                                 |
| `zai/glm-4.7-flash` |                                 |
| `zai/glm-4.7-flashx` |                                |
| `zai/glm-4.6`       |                                 |
| `zai/glm-4.6v`      |                                 |
| `zai/glm-4.5`       |                                 |
| `zai/glm-4.5-air`   |                                 |
| `zai/glm-4.5-flash` |                                 |
| `zai/glm-4.5v`      |                                 |

<Tip>
Les modèles GLM sont disponibles sous la forme `zai/<model>` (exemple : `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 prend en charge les niveaux de réflexion `off`, `low`, `high` et `max`. OpenClaw mappe
`low` et `high` vers l’effort de raisonnement élevé de Z.AI, et `max` vers l’effort maximal.
</Tip>

<Note>
La configuration du Coding Plan utilise `zai/glm-5.2` par défaut ; la configuration de l’API générale conserve
`zai/glm-5.1`. La détection automatique du point de terminaison revient à `glm-5.1` ou `glm-4.7`
lorsque le plan sélectionné n’expose pas GLM-5.2. Les versions et la disponibilité de GLM
peuvent changer ; exécutez `openclaw models list --all --provider zai` pour voir le catalogue
connu de votre version installée.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Résolution prospective des modèles GLM-5 inconnus">
    Les identifiants `glm-5*` inconnus se résolvent tout de même de manière prospective sur le chemin du provider en
    synthétisant des métadonnées détenues par le provider à partir du modèle `glm-4.7` lorsque l’identifiant
    correspond à la forme actuelle de la famille GLM-5.
  </Accordion>

  <Accordion title="Diffusion en continu des appels d’outils">
    `tool_stream` est activé par défaut pour la diffusion en continu des appels d’outils Z.AI. Pour le désactiver :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Réflexion et réflexion préservée">
    La réflexion Z.AI suit les contrôles `/think` d’OpenClaw. Lorsque la réflexion est désactivée,
    OpenClaw envoie `thinking: { type: "disabled" }` afin d’éviter les réponses qui
    consomment le budget de sortie avec `reasoning_content` avant le texte visible.

    La réflexion préservée est optionnelle, car Z.AI exige que l’intégralité de l’historique
    `reasoning_content` soit relue, ce qui augmente les tokens de prompt. Activez-la
    par modèle :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Lorsqu’elle est activée et que la réflexion est active, OpenClaw envoie
    `thinking: { type: "enabled", clear_thinking: false }` et relit le précédent
    `reasoning_content` pour le même transcript compatible OpenAI.

    Les utilisateurs avancés peuvent toujours remplacer exactement la charge utile du provider avec
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Compréhension des images">
    Le Plugin Z.AI enregistre la compréhension des images.

    | Propriété | Valeur      |
    | --------- | ----------- |
    | Modèle    | `glm-4.6v`  |

    La compréhension des images est résolue automatiquement à partir de l’authentification Z.AI configurée ; aucune
    configuration supplémentaire n’est nécessaire.

  </Accordion>

  <Accordion title="Détails d’authentification">
    - Z.AI utilise l’authentification Bearer avec votre clé d’API.
    - L’option d’onboarding `zai-api-key` détecte automatiquement le point de terminaison Z.AI correspondant en sondant les points de terminaison pris en charge avec votre clé.
    - Utilisez les options régionales explicites (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) lorsque vous voulez forcer une surface d’API spécifique.
    - La variable d’environnement héritée `Z_AI_API_KEY` est toujours acceptée ; OpenClaw la copie vers `ZAI_API_KEY` au démarrage si `ZAI_API_KEY` n’est pas défini.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les providers, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma complet de configuration OpenClaw, y compris les paramètres de provider et de modèle.
  </Card>
</CardGroup>

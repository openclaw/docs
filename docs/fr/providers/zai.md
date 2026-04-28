---
read_when:
    - Vous souhaitez utiliser des modèles Z.AI / GLM dans OpenClaw
    - Vous avez besoin d’une configuration simple avec `ZAI_API_KEY`
summary: Utiliser Z.AI (modèles GLM) avec OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T11:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI est la plateforme API des modèles **GLM**. Elle fournit des API REST pour GLM et utilise des clés API
pour l’authentification. Créez votre clé API dans la console Z.AI. OpenClaw utilise le fournisseur `zai`
avec une clé API Z.AI.

- Fournisseur : `zai`
- Authentification : `ZAI_API_KEY`
- API : Z.AI Chat Completions (authentification Bearer)

## Premiers pas

<Tabs>
  <Tab title="Détection automatique du point de terminaison">
    **Idéal pour :** la plupart des utilisateurs. OpenClaw détecte le point de terminaison Z.AI correspondant à partir de la clé et applique automatiquement la bonne URL de base.

    <Steps>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Point de terminaison régional explicite">
    **Idéal pour :** les utilisateurs qui veulent forcer une surface API générale spécifique ou un Coding Plan spécifique.

    <Steps>
      <Step title="Choisir la bonne option d’onboarding">
        ```bash
        # Coding Plan Global (recommandé pour les utilisateurs de Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (région Chine)
        openclaw onboard --auth-choice zai-coding-cn

        # API générale
        openclaw onboard --auth-choice zai-global

        # API générale CN (région Chine)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catalogue intégré

OpenClaw initialise actuellement le fournisseur `zai` inclus avec :

| Référence de modèle | Notes            |
| ------------------- | ---------------- |
| `zai/glm-5.1`       | Modèle par défaut |
| `zai/glm-5`         |                  |
| `zai/glm-5-turbo`   |                  |
| `zai/glm-5v-turbo`  |                  |
| `zai/glm-4.7`       |                  |
| `zai/glm-4.7-flash` |                  |
| `zai/glm-4.7-flashx`|                  |
| `zai/glm-4.6`       |                  |
| `zai/glm-4.6v`      |                  |
| `zai/glm-4.5`       |                  |
| `zai/glm-4.5-air`   |                  |
| `zai/glm-4.5-flash` |                  |
| `zai/glm-4.5v`      |                  |

<Tip>
Les modèles GLM sont disponibles sous la forme `zai/<model>` (exemple : `zai/glm-5`). La référence de modèle intégrée par défaut est `zai/glm-5.1`.
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Résolution anticipée des modèles GLM-5 inconnus">
    Les identifiants `glm-5*` inconnus continuent d’être résolus de manière anticipée sur le chemin du fournisseur inclus en
    synthétisant des métadonnées détenues par le fournisseur à partir du modèle `glm-4.7` lorsque l’identifiant
    correspond à la forme actuelle de la famille GLM-5.
  </Accordion>

  <Accordion title="Streaming des appels d’outils">
    `tool_stream` est activé par défaut pour le streaming des appels d’outils Z.AI. Pour le désactiver :

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
    OpenClaw envoie `thinking: { type: "disabled" }` pour éviter des réponses qui
    consomment le budget de sortie dans `reasoning_content` avant le texte visible.

    La réflexion préservée est facultative, car Z.AI exige que tout le
    `reasoning_content` historique soit rejoué, ce qui augmente le nombre de jetons du prompt. Activez-la
    par modèle :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Lorsqu’elle est activée et que la réflexion est active, OpenClaw envoie
    `thinking: { type: "enabled", clear_thinking: false }` et rejoue le
    `reasoning_content` antérieur pour la même transcription compatible OpenAI.

    Les utilisateurs avancés peuvent toujours surcharger la charge utile exacte du fournisseur avec
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Compréhension des images">
    Le Plugin Z.AI inclus enregistre la compréhension des images.

    | Propriété     | Valeur      |
    | ------------- | ----------- |
    | Modèle        | `glm-4.6v`  |

    La compréhension des images est résolue automatiquement à partir de l’authentification Z.AI configurée — aucune
    configuration supplémentaire n’est nécessaire.

  </Accordion>

  <Accordion title="Détails de l’authentification">
    - Z.AI utilise l’authentification Bearer avec votre clé API.
    - L’option d’onboarding `zai-api-key` détecte automatiquement le point de terminaison Z.AI correspondant à partir du préfixe de la clé.
    - Utilisez les options régionales explicites (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) lorsque vous souhaitez forcer une surface API spécifique.

  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Famille de modèles GLM" href="/fr/providers/glm" icon="microchip">
    Vue d’ensemble de la famille de modèles GLM.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de bascule.
  </Card>
</CardGroup>

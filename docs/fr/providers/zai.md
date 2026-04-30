---
read_when:
    - Vous voulez utiliser les modèles Z.AI / GLM dans OpenClaw
    - Il vous faut une configuration simple de ZAI_API_KEY
summary: Utiliser Z.AI (modèles GLM) avec OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T07:46:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI est la plateforme d’API pour les modèles **GLM**. Elle fournit des API REST pour GLM et utilise des clés d’API
pour l’authentification. Créez votre clé d’API dans la console Z.AI. OpenClaw utilise le fournisseur `zai`
avec une clé d’API Z.AI.

- Fournisseur : `zai`
- Authentification : `ZAI_API_KEY`
- API : Z.AI Chat Completions (authentification Bearer)

## Bien démarrer

<Tabs>
  <Tab title="Détection automatique du point de terminaison">
    **Idéal pour :** la plupart des utilisateurs. OpenClaw détecte le point de terminaison Z.AI correspondant à partir de la clé et applique automatiquement l’URL de base correcte.

    <Steps>
      <Step title="Exécuter l’intégration">
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
    **Idéal pour :** les utilisateurs qui veulent forcer un Coding Plan spécifique ou une surface d’API générale.

    <Steps>
      <Step title="Choisir la bonne option d’intégration">
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

OpenClaw initialise actuellement le fournisseur `zai` groupé avec :

| Réf. de modèle       | Notes             |
| -------------------- | ----------------- |
| `zai/glm-5.1`        | Modèle par défaut |
| `zai/glm-5`          |                   |
| `zai/glm-5-turbo`    |                   |
| `zai/glm-5v-turbo`   |                   |
| `zai/glm-4.7`        |                   |
| `zai/glm-4.7-flash`  |                   |
| `zai/glm-4.7-flashx` |                   |
| `zai/glm-4.6`        |                   |
| `zai/glm-4.6v`       |                   |
| `zai/glm-4.5`        |                   |
| `zai/glm-4.5-air`    |                   |
| `zai/glm-4.5-flash`  |                   |
| `zai/glm-4.5v`       |                   |

<Tip>
Les modèles GLM sont disponibles sous la forme `zai/<model>` (exemple : `zai/glm-5`). La réf. de modèle intégrée par défaut est `zai/glm-5.1`.
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Résolution vers l’avant des modèles GLM-5 inconnus">
    Les identifiants `glm-5*` inconnus sont toujours résolus vers l’avant sur le chemin du fournisseur groupé en
    synthétisant les métadonnées détenues par le fournisseur à partir du modèle `glm-4.7` lorsque l’identifiant
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

  <Accordion title="Raisonnement et raisonnement préservé">
    Le raisonnement Z.AI suit les contrôles `/think` d’OpenClaw. Lorsque le raisonnement est désactivé,
    OpenClaw envoie `thinking: { type: "disabled" }` pour éviter les réponses qui
    dépensent le budget de sortie en `reasoning_content` avant le texte visible.

    Le raisonnement préservé est optionnel, car Z.AI exige que l’intégralité de l’historique
    `reasoning_content` soit rejouée, ce qui augmente les jetons d’invite. Activez-le
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

    Lorsqu’il est activé et que le raisonnement est actif, OpenClaw envoie
    `thinking: { type: "enabled", clear_thinking: false }` et rejoue les précédents
    `reasoning_content` pour la même transcription compatible OpenAI.

    Les utilisateurs avancés peuvent toujours remplacer exactement la charge utile du fournisseur avec
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Compréhension des images">
    Le Plugin Z.AI groupé enregistre la compréhension des images.

    | Propriété     | Valeur      |
    | ------------- | ----------- |
    | Modèle        | `glm-4.6v`  |

    La compréhension des images est résolue automatiquement à partir de l’authentification Z.AI configurée — aucune
    configuration supplémentaire n’est nécessaire.

  </Accordion>

  <Accordion title="Détails d’authentification">
    - Z.AI utilise l’authentification Bearer avec votre clé d’API.
    - L’option d’intégration `zai-api-key` détecte automatiquement le point de terminaison Z.AI correspondant à partir du préfixe de la clé.
    - Utilisez les choix régionaux explicites (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) lorsque vous voulez forcer une surface d’API spécifique.

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Famille de modèles GLM" href="/fr/providers/glm" icon="microchip">
    Vue d’ensemble de la famille de modèles GLM.
  </Card>
  <Card title="Sélection de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les réfs. de modèle et le comportement de basculement.
  </Card>
</CardGroup>

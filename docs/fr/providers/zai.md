---
read_when:
    - Vous souhaitez utiliser les modèles Z.AI / GLM dans OpenClaw
    - Vous devez simplement configurer ZAI_API_KEY
summary: Utiliser Z.AI (modèles GLM) avec OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T15:55:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

  Z.AI est la plateforme d’API pour les modèles **GLM**. Elle fournit des API REST pour GLM et
  utilise des clés API pour l’authentification. Créez votre clé API dans la console Z.AI.
  OpenClaw utilise le fournisseur `zai` avec une clé API Z.AI.

  | Propriété    | Valeur                                       |
  | ------------ | -------------------------------------------- |
  | Fournisseur  | `zai`                                        |
  | Paquet       | `@openclaw/zai-provider`                     |
  | Authentification | `ZAI_API_KEY` (ancien alias : `Z_AI_API_KEY`) |
  | API          | Complétions de chat Z.AI (authentification Bearer) |

  ## Modèles GLM

  GLM est une famille de modèles, et non un fournisseur distinct. Dans OpenClaw, les modèles GLM utilisent
  des références telles que `zai/glm-5.2` : fournisseur `zai`, identifiant de modèle `glm-5.2`.

  ## Prise en main

  Installez d’abord le Plugin du fournisseur :

  ```bash
  openclaw plugins install @openclaw/zai-provider
  ```

  <Tabs>
  <Tab title="Détection automatique du point de terminaison">
    **Idéal pour :** la plupart des utilisateurs. OpenClaw sonde les points de terminaison Z.AI pris en charge avec votre clé API et applique automatiquement l’URL de base appropriée.

    <Steps>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Vérifier que le modèle figure dans la liste">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Point de terminaison régional explicite">
    **Idéal pour :** les utilisateurs qui souhaitent imposer un Coding Plan spécifique ou une surface d’API générale.

    <Steps>
      <Step title="Choisissez l’option d’intégration appropriée">
        ```bash
        # Coding Plan global (recommandé pour les utilisateurs de Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (région Chine)
        openclaw onboard --auth-choice zai-coding-cn

        # API générale
        openclaw onboard --auth-choice zai-global

        # API générale CN (région Chine)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Vérifiez que le modèle figure dans la liste">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Points de terminaison

| Choix d’intégration  | URL de base                                   | Modèle par défaut |
| ------------------- | --------------------------------------------- | ----------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`         |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`         |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`         |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`         |

`zai-api-key` détecte automatiquement l’un de ces quatre choix en testant votre clé auprès de l’API de complétion de chat de chaque
point de terminaison, en vérifiant les points de terminaison généraux (`zai-global`,
puis `zai-cn`) avant ceux du Coding Plan (`zai-coding-global`, puis
`zai-coding-cn`), et en s’arrêtant au premier point de terminaison qui accepte une requête.
Utilisez explicitement `--auth-choice` pour imposer un point de terminaison du Coding Plan si votre clé
fonctionne avec les deux.

## Exemple de configuration

<Tip>
`zai-api-key` permet à OpenClaw de détecter le point de terminaison Z.AI correspondant à partir de la clé et
d’appliquer automatiquement l’URL de base correcte. Utilisez les choix régionaux explicites lorsque
vous souhaitez imposer un Coding Plan spécifique ou une surface d’API générale.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 utilise le point de terminaison Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Catalogue intégré

Le Plugin de fournisseur `zai` fournit son catalogue dans le manifeste du Plugin, de sorte que le
listage en lecture seule peut afficher les entrées GLM connues sans charger l’environnement d’exécution du fournisseur :

```bash
openclaw models list --all --provider zai
```

Le catalogue issu du manifeste comprend actuellement :

| Référence du modèle | Remarques                               |
| -------------------- | --------------------------------------- |
| `zai/glm-5.2`        | Valeur par défaut du Coding Plan ; contexte de 1M |
| `zai/glm-5.1`        | Valeur par défaut de l’API générale     |
| `zai/glm-5`          |                                         |
| `zai/glm-5-turbo`    |                                         |
| `zai/glm-5v-turbo`   |                                         |
| `zai/glm-4.7`        |                                         |
| `zai/glm-4.7-flash`  |                                         |
| `zai/glm-4.7-flashx` |                                         |
| `zai/glm-4.6`        |                                         |
| `zai/glm-4.6v`       |                                         |
| `zai/glm-4.5`        |                                         |
| `zai/glm-4.5-air`    |                                         |
| `zai/glm-4.5-flash`  |                                         |
| `zai/glm-4.5v`       |                                         |

<Tip>
Les modèles GLM sont disponibles sous la forme `zai/<model>` (exemple : `zai/glm-5`).
</Tip>

<Note>
La configuration du Coding Plan utilise par défaut `zai/glm-5.2` ; celle de
l’API générale conserve `zai/glm-5.1`. Sur les points de terminaison du Coding Plan,
la détection automatique se rabat sur `glm-5.1`, puis sur `glm-4.7`, lorsque la
clé ou le forfait ne donne pas accès à GLM-5.2. Les versions et la disponibilité
de GLM peuvent changer ; exécutez `openclaw models list --all --provider zai`
pour afficher le catalogue connu de votre version installée.
</Note>

## Niveaux de réflexion

<Tabs>
  <Tab title="GLM-5.2">
    Plage complète : `off`, `low`, `high`, `max` (`off` par défaut). OpenClaw
    associe `low` et `high` à l’effort de raisonnement `high` de Z.AI, et `max`
    à l’effort `max` de Z.AI, au moyen de `reasoning_effort` dans la charge utile
    de la requête.
  </Tab>
  <Tab title="Autres modèles GLM">
    Bascule binaire uniquement : `off` et `low` (affiché comme `on` dans les
    sélecteurs), avec `off` par défaut. Définir la réflexion sur `off` envoie
    `thinking: { type: "disabled" }` ; tout autre niveau laisse la charge utile
    de la requête inchangée (le comportement de raisonnement par défaut propre
    à Z.AI s’applique).
  </Tab>
</Tabs>

Définir la réflexion sur `off` évite les réponses qui consomment le budget de
sortie avec `reasoning_content` avant le texte visible.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Résolution anticipée des modèles GLM-5 inconnus">
    Les identifiants `glm-5*` inconnus continuent d’être résolus de manière
    anticipée dans le chemin du fournisseur en synthétisant des métadonnées
    appartenant au fournisseur à partir du modèle `glm-4.7`, lorsque
    l’identifiant correspond à la forme actuelle de la famille GLM-5.
  </Accordion>

  <Accordion title="Diffusion des appels d’outils">
    `tool_stream` est activé par défaut pour la diffusion des appels d’outils
    de Z.AI. Pour le désactiver :

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

  <Accordion title="Réflexion conservée">
    La réflexion conservée est facultative, car Z.AI exige la réinjection de
    l’intégralité de l’historique de `reasoning_content`, ce qui augmente le
    nombre de jetons de l’invite. Activez-la pour chaque modèle :

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
    `thinking: { type: "enabled", clear_thinking: false }` et réinjecte le
    `reasoning_content` antérieur pour la même transcription compatible avec
    OpenAI. La clé de paramètre en snake_case `preserve_thinking` fonctionne
    comme alias.

    Les utilisateurs avancés peuvent toujours remplacer précisément la charge
    utile du fournisseur avec `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Compréhension des images">
    Le Plugin Z.AI enregistre la compréhension des images.

    | Propriété     | Valeur      |
    | ------------- | ----------- |
    | Modèle        | `glm-4.6v`  |

    La compréhension des images est automatiquement résolue à partir de
    l’authentification Z.AI configurée ; aucune configuration supplémentaire
    n’est nécessaire.

  </Accordion>

  <Accordion title="Détails de l’authentification">
    - Z.AI utilise l’authentification Bearer avec votre clé d’API.
    - Le choix d’intégration `zai-api-key` détecte automatiquement le point de terminaison Z.AI correspondant en testant les points de terminaison pris en charge avec votre clé.
    - Utilisez les choix régionaux explicites (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) lorsque vous souhaitez imposer une surface d’API spécifique.
    - L’ancienne variable d’environnement `Z_AI_API_KEY` est toujours acceptée ; OpenClaw la copie dans `ZAI_API_KEY` au démarrage si `ZAI_API_KEY` n’est pas définie.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de
    basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration OpenClaw complet, notamment les paramètres des
    fournisseurs et des modèles.
  </Card>
</CardGroup>

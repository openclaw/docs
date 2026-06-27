---
read_when:
    - Vous voulez des modèles StepFun dans OpenClaw
    - Vous avez besoin de conseils de configuration pour StepFun
summary: Utiliser les modèles StepFun avec OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:07:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

Le Plugin de fournisseur StepFun prend en charge deux ids de fournisseur :

- `stepfun` pour l’endpoint standard
- `stepfun-plan` pour l’endpoint Step Plan

<Warning>
Standard et Step Plan sont des **fournisseurs distincts** avec des endpoints et des préfixes de référence de modèle différents (`stepfun/...` contre `stepfun-plan/...`). Utilisez une clé Chine avec les endpoints `.com` et une clé globale avec les endpoints `.ai`.
</Warning>

## Installer le plugin

Installez le plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Vue d’ensemble des régions et endpoints

| Endpoint  | Chine (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variable d’environnement d’authentification : `STEPFUN_API_KEY`

## Catalogue intégré

Standard (`stepfun`) :

| Réf. de modèle          | Contexte | Sortie max. | Notes                     |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Modèle standard par défaut |

Step Plan (`stepfun-plan`) :

| Réf. de modèle                    | Contexte | Sortie max. | Notes                         |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Modèle Step Plan par défaut   |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Modèle Step Plan supplémentaire |

## Premiers pas

Choisissez votre surface de fournisseur et suivez les étapes de configuration.

<Tabs>
  <Tab title="Standard">
    **Idéal pour :** usage général via l’endpoint StepFun standard.

    <Steps>
      <Step title="Choisir la région de votre endpoint">
        | Choix d’authentification       | Endpoint                         | Région        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | International |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | Chine         |
      </Step>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Ou pour l’endpoint Chine :

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Alternative non interactive">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Références de modèle

    - Modèle par défaut : `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Idéal pour :** endpoint de raisonnement Step Plan.

    <Steps>
      <Step title="Choisir la région de votre endpoint">
        | Choix d’authentification   | Endpoint                                | Région        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | International |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | Chine         |
      </Step>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Ou pour l’endpoint Chine :

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Alternative non interactive">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Références de modèle

    - Modèle par défaut : `stepfun-plan/step-3.5-flash`
    - Modèle alternatif : `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Configuration complète : fournisseur Standard">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configuration complète : fournisseur Step Plan">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Notes">
    - Le fournisseur est un package externe officiel ; installez-le avant la configuration.
    - `step-3.5-flash-2603` est actuellement exposé uniquement sur `stepfun-plan`.
    - Un flux d’authentification unique écrit des profils correspondant à la région pour `stepfun` et `stepfun-plan`, afin que les deux surfaces puissent être découvertes ensemble.
    - Utilisez `openclaw models list` et `openclaw models set <provider/model>` pour inspecter ou changer de modèle.

  </Accordion>
</AccordionGroup>

<Note>
Pour une vue d’ensemble plus large des fournisseurs, consultez [Fournisseurs de modèles](/fr/concepts/model-providers).
</Note>

## Associés

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, références de modèle et comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet pour les fournisseurs, les modèles et les plugins.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
  <Card title="Plateforme StepFun" href="https://platform.stepfun.com" icon="globe">
    Gestion des clés d’API StepFun et documentation.
  </Card>
</CardGroup>

---
read_when:
    - Vous voulez les modèles StepFun dans OpenClaw
    - Vous avez besoin d’un guide de configuration StepFun
summary: Utiliser les modèles StepFun avec OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-24T07:28:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw inclut un plugin fournisseur StepFun intégré avec deux ids de fournisseur :

- `stepfun` pour le point de terminaison standard
- `stepfun-plan` pour le point de terminaison Step Plan

<Warning>
Standard et Step Plan sont des **fournisseurs distincts** avec des points de terminaison différents et des préfixes de référence de modèle différents (`stepfun/...` vs `stepfun-plan/...`). Utilisez une clé Chine avec les points de terminaison `.com` et une clé globale avec les points de terminaison `.ai`.
</Warning>

## Vue d’ensemble des régions et points de terminaison

| Point de terminaison | Chine (`.com`)                         | Global (`.ai`)                        |
| -------------------- | -------------------------------------- | ------------------------------------- |
| Standard             | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan            | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variable d’environnement d’authentification : `STEPFUN_API_KEY`

## Catalogue intégré

Standard (`stepfun`) :

| Référence de modèle      | Contexte | Sortie max | Remarques                  |
| ------------------------ | -------- | ---------- | -------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536     | Modèle standard par défaut |

Step Plan (`stepfun-plan`) :

| Référence de modèle                | Contexte | Sortie max | Remarques                    |
| ---------------------------------- | -------- | ---------- | ---------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536     | Modèle Step Plan par défaut  |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536     | Modèle Step Plan supplémentaire |

## Premiers pas

Choisissez votre surface de fournisseur et suivez les étapes de configuration.

<Tabs>
  <Tab title="Standard">
    **Idéal pour :** un usage général via le point de terminaison standard StepFun.

    <Steps>
      <Step title="Choisir la région de votre point de terminaison">
        | Choix d’authentification          | Point de terminaison              | Région         |
        | --------------------------------- | --------------------------------- | -------------- |
        | `stepfun-standard-api-key-intl`   | `https://api.stepfun.ai/v1`       | Internationale |
        | `stepfun-standard-api-key-cn`     | `https://api.stepfun.com/v1`      | Chine          |
      </Step>
      <Step title="Lancer l’intégration">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Ou pour le point de terminaison Chine :

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
    **Idéal pour :** le point de terminaison de raisonnement Step Plan.

    <Steps>
      <Step title="Choisir la région de votre point de terminaison">
        | Choix d’authentification         | Point de terminaison                    | Région         |
        | -------------------------------- | --------------------------------------- | -------------- |
        | `stepfun-plan-api-key-intl`      | `https://api.stepfun.ai/step_plan/v1`   | Internationale |
        | `stepfun-plan-api-key-cn`        | `https://api.stepfun.com/step_plan/v1`  | Chine          |
      </Step>
      <Step title="Lancer l’intégration">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Ou pour le point de terminaison Chine :

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

  <Accordion title="Remarques">
    - Le fournisseur est intégré à OpenClaw, il n’y a donc pas d’étape d’installation de plugin séparée.
    - `step-3.5-flash-2603` n’est actuellement exposé que sur `stepfun-plan`.
    - Un seul flux d’authentification écrit des profils correspondant à la région pour `stepfun` et `stepfun-plan`, de sorte que les deux surfaces peuvent être découvertes ensemble.
    - Utilisez `openclaw models list` et `openclaw models set <provider/model>` pour inspecter ou changer de modèle.

  </Accordion>
</AccordionGroup>

<Note>
Pour une vue d’ensemble plus large des fournisseurs, voir [Fournisseurs de modèles](/fr/concepts/model-providers).
</Note>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, références de modèle et comportement de repli.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma complet de configuration pour les fournisseurs, modèles et plugins.
  </Card>
  <Card title="Sélection de modèle" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
  <Card title="Plateforme StepFun" href="https://platform.stepfun.com" icon="globe">
    Gestion des clés API StepFun et documentation.
  </Card>
</CardGroup>

---
read_when:
    - Vous souhaitez utiliser les modèles StepFun dans OpenClaw
    - Vous avez besoin d’aide pour configurer StepFun
summary: Utiliser les modèles StepFun avec OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T03:02:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun est fourni sous la forme d’un plugin officiel externe (`@openclaw/stepfun-provider`) avec deux identifiants de fournisseur :

- `stepfun` pour le point de terminaison standard
- `stepfun-plan` pour le point de terminaison Step Plan

<Warning>
Standard et Step Plan sont des **fournisseurs distincts**, avec des points de terminaison et des préfixes de référence de modèle différents (`stepfun/...` et `stepfun-plan/...`). Utilisez une clé chinoise avec les points de terminaison en `.com` et une clé globale avec les points de terminaison en `.ai`.
</Warning>

## Installer le plugin

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Vue d’ensemble des régions et des points de terminaison

| Point de terminaison | Chine (`.com`)                         | Global (`.ai`)                        |
| -------------------- | -------------------------------------- | ------------------------------------- |
| Standard             | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan            | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variable d’environnement d’authentification : `STEPFUN_API_KEY`

## Catalogue intégré

Standard (`stepfun`) :

| Référence du modèle       | Contexte | Sortie maximale | Remarques                              |
| ------------------------- | -------- | --------------- | -------------------------------------- |
| `stepfun/step-3.5-flash`  | 262,144  | 65,536          | Modèle standard par défaut             |
| `stepfun/step-3.7-flash`  | 262,144  | 262,144         | Prise en charge des images en entrée   |

Step Plan (`stepfun-plan`) :

| Référence du modèle                  | Contexte | Sortie maximale | Remarques                                |
| ------------------------------------ | -------- | --------------- | ---------------------------------------- |
| `stepfun-plan/step-3.5-flash`        | 262,144  | 65,536          | Modèle Step Plan par défaut              |
| `stepfun-plan/step-3.7-flash`        | 262,144  | 262,144         | Prise en charge des images en entrée     |
| `stepfun-plan/step-3.5-flash-2603`   | 262,144  | 65,536          | Modèle Step Plan supplémentaire          |

## Prise en main

<Tabs>
  <Tab title="Standard">
    Idéal pour un usage général via le point de terminaison standard de StepFun.

    <Steps>
      <Step title="Choose your endpoint region">
        | Choix d’authentification          | Point de terminaison            | Région        |
        | --------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`   | `https://api.stepfun.ai/v1`      | Internationale |
        | `stepfun-standard-api-key-cn`     | `https://api.stepfun.com/v1`     | Chine          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Point de terminaison chinois :

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    Modèle par défaut : `stepfun/step-3.5-flash`
    Autre modèle : `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Idéal pour le point de terminaison de raisonnement Step Plan.

    <Steps>
      <Step title="Choose your endpoint region">
        | Choix d’authentification       | Point de terminaison                     | Région         |
        | ------------------------------ | ---------------------------------------- | -------------- |
        | `stepfun-plan-api-key-intl`    | `https://api.stepfun.ai/step_plan/v1`    | Internationale |
        | `stepfun-plan-api-key-cn`      | `https://api.stepfun.com/step_plan/v1`   | Chine          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Point de terminaison chinois :

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    Modèle par défaut : `stepfun-plan/step-3.5-flash`
    Autres modèles : `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Un seul flux d’authentification crée des profils correspondant à la région pour `stepfun` et `stepfun-plan`. Les deux interfaces sont donc détectées ensemble après une seule exécution de l’intégration initiale.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Full config: Standard provider">
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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

  <Accordion title="Full config: Step Plan provider">
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
    - `step-3.7-flash` accepte du texte et des images en entrée par l’intermédiaire d’OpenClaw. L’API de StepFun prend également en charge la vidéo, qui n’est pas encore une modalité d’entrée de modèle dans OpenClaw.
    - Step 3.7 prend en charge les niveaux d’effort de raisonnement `low`, `medium` et `high`. Comme le modèle ne dispose pas de mode sans raisonnement, `/think off` correspond à `low`.
    - `step-3.5-flash-2603` est actuellement disponible uniquement sur `stepfun-plan`.
    - Utilisez `openclaw models list` et `openclaw models set <provider/model>` pour examiner les modèles ou en changer.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Model providers" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet pour les fournisseurs, les modèles et les plugins.
  </Card>
  <Card title="Models CLI" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Gestion des clés d’API et documentation de StepFun.
  </Card>
</CardGroup>

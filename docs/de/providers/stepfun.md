---
read_when:
    - Sie möchten StepFun-Modelle in OpenClaw verwenden
    - Sie benötigen eine Anleitung zur Einrichtung von StepFun
summary: StepFun-Modelle mit OpenClaw verwenden
title: StepFun
x-i18n:
    generated_at: "2026-07-24T04:04:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 462a2588f15e8d6188914e238a3e472052d0da1da151751adecdb63cf009fc64
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun wird als externes offizielles Plugin (`@openclaw/stepfun-provider`) mit zwei Provider-IDs ausgeliefert:

- `stepfun` für den Standardendpunkt
- `stepfun-plan` für den Step-Plan-Endpunkt

<Warning>
Standard und Step Plan sind **separate Provider** mit unterschiedlichen Endpunkten und Präfixen für Modellreferenzen (`stepfun/...` gegenüber `stepfun-plan/...`). Verwenden Sie einen Schlüssel für China mit den `.com`-Endpunkten und einen globalen Schlüssel mit den `.ai`-Endpunkten.
</Warning>

## Plugin installieren

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Übersicht über Regionen und Endpunkte

| Endpunkt  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Umgebungsvariable für die Authentifizierung: `STEPFUN_API_KEY`

## Integrierter Katalog

Standard (`stepfun`):

| Modellreferenz           | Kontext | Max. Ausgabe | Hinweise                       |
| ------------------------ | ------- | ------------ | ------------------------------ |
| `stepfun/step-3.5-flash` | 262,144 | 65,536       | Standardmodell                  |
| `stepfun/step-3.7-flash` | 262,144 | 262,144      | Unterstützt multimodale Bildeingaben |

Step Plan (`stepfun-plan`):

| Modellreferenz                     | Kontext | Max. Ausgabe | Hinweise                       |
| ---------------------------------- | ------- | ------------ | ------------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536       | Standardmodell für Step Plan   |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144      | Unterstützt multimodale Bildeingaben |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536       | Zusätzliches Step-Plan-Modell  |

## Erste Schritte

<Tabs>
  <Tab title="Standard">
    Am besten für allgemeine Anwendungsfälle über den Standardendpunkt von StepFun geeignet.

    <Steps>
      <Step title="Region Ihres Endpunkts auswählen">
        | Authentifizierungsoption          | Endpunkt                      | Region        |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | International |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | China          |
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Endpunkt für China:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Nicht interaktive Alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verfügbarkeit der Modelle überprüfen">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    Standardmodell: `stepfun/step-3.5-flash`
    Alternatives Modell: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Am besten für den Reasoning-Endpunkt von Step Plan geeignet.

    <Steps>
      <Step title="Region Ihres Endpunkts auswählen">
        | Authentifizierungsoption       | Endpunkt                                   | Region        |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | International |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | China          |
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Endpunkt für China:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Nicht interaktive Alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verfügbarkeit der Modelle überprüfen">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    Standardmodell: `stepfun-plan/step-3.5-flash`
    Alternative Modelle: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Ein einziger Authentifizierungsablauf schreibt der Region entsprechende Profile sowohl für `stepfun` als auch für `stepfun-plan`, sodass beide Oberflächen nach einem einzigen Onboarding-Lauf gemeinsam erkannt werden.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Vollständige Konfiguration: Standard-Provider">
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

  <Accordion title="Vollständige Konfiguration: Step-Plan-Provider">
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

  <Accordion title="Hinweise">
    - `step-3.7-flash` akzeptiert über OpenClaw Text- und Bildeingaben. Die API von StepFun unterstützt außerdem Video, das in OpenClaw noch keine Modelleingabemodalität ist.
    - Step 3.7 unterstützt den Reasoning-Aufwand `low`, `medium` und `high`. Da das Modell keinen Modus ohne Reasoning besitzt, wird `/think off` auf `low` abgebildet.
    - `step-3.5-flash-2603` wird derzeit nur auf `stepfun-plan` bereitgestellt.
    - Verwenden Sie `openclaw models list` und `openclaw models set <provider/model>`, um Modelle zu prüfen oder zu wechseln.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Übersicht über alle Provider, Modellreferenzen und das Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Provider, Modelle und Plugins.
  </Card>
  <Card title="Modell-CLI" href="/de/concepts/models" icon="brain">
    So wählen und konfigurieren Sie Modelle.
  </Card>
  <Card title="StepFun-Plattform" href="https://platform.stepfun.com" icon="globe">
    Verwaltung und Dokumentation von StepFun-API-Schlüsseln.
  </Card>
</CardGroup>

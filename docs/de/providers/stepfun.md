---
read_when:
    - Sie möchten StepFun-Modelle in OpenClaw verwenden
    - Sie benötigen eine Einrichtungsanleitung für StepFun
summary: StepFun-Modelle mit OpenClaw verwenden
title: StepFun
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:55:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw enthält ein gebündeltes StepFun-Provider-Plugin mit zwei Provider-IDs:

- `stepfun` für den Standard-Endpunkt
- `stepfun-plan` für den Step-Plan-Endpunkt

<Warning>
Standard und Step Plan sind **separate Provider** mit unterschiedlichen Endpunkten und Modell-Ref-Präfixen (`stepfun/...` vs `stepfun-plan/...`). Verwenden Sie einen China-Schlüssel mit den `.com`-Endpunkten und einen globalen Schlüssel mit den `.ai`-Endpunkten.
</Warning>

## Überblick über Regionen und Endpunkte

| Endpunkt  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Auth-Env-Variable: `STEPFUN_API_KEY`

## Integrierter Katalog

Standard (`stepfun`):

| Modell-Ref               | Kontext | Max. Ausgabe | Hinweise               |
| ------------------------ | ------- | ------------ | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536       | Standard-Defaultmodell |

Step Plan (`stepfun-plan`):

| Modell-Ref                         | Kontext | Max. Ausgabe | Hinweise                    |
| ---------------------------------- | ------- | ------------ | --------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536       | Standardmodell für Step Plan |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536       | Zusätzliches Step-Plan-Modell |

## Erste Schritte

Wählen Sie Ihre Provider-Oberfläche und folgen Sie den Setup-Schritten.

<Tabs>
  <Tab title="Standard">
    **Am besten geeignet für:** allgemeine Verwendung über den Standard-Endpunkt von StepFun.

    <Steps>
      <Step title="Ihre Endpunkt-Region wählen">
        | Auth-Auswahl                     | Endpunkt                         | Region        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | International |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Oder für den China-Endpunkt:

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
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Modell-Refs

    - Standardmodell: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Am besten geeignet für:** Step-Plan-Reasoning-Endpunkt.

    <Steps>
      <Step title="Ihre Endpunkt-Region wählen">
        | Auth-Auswahl                 | Endpunkt                                | Region        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | International |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Oder für den China-Endpunkt:

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
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Modell-Refs

    - Standardmodell: `stepfun-plan/step-3.5-flash`
    - Alternatives Modell: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

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
    - Der Provider ist in OpenClaw gebündelt, daher ist kein separater Plugin-Installationsschritt erforderlich.
    - `step-3.5-flash-2603` wird derzeit nur auf `stepfun-plan` bereitgestellt.
    - Ein einzelner Auth-Flow schreibt zur Region passende Profile für `stepfun` und `stepfun-plan`, sodass beide Oberflächen gemeinsam entdeckt werden können.
    - Verwenden Sie `openclaw models list` und `openclaw models set <provider/model>`, um Modelle zu prüfen oder zu wechseln.
  </Accordion>
</AccordionGroup>

<Note>
Für den umfassenderen Provider-Überblick siehe [Modell-Provider](/de/concepts/model-providers).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Provider, Modelle und Plugins.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    Wie man Modelle auswählt und konfiguriert.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Verwaltung von StepFun-API-Schlüsseln und Dokumentation.
  </Card>
</CardGroup>

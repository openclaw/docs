---
read_when:
    - Sie möchten StepFun-Modelle in OpenClaw verwenden
    - Sie benötigen eine Anleitung zur Einrichtung von StepFun
summary: StepFun-Modelle mit OpenClaw verwenden
title: StepFun
x-i18n:
    generated_at: "2026-04-30T07:11:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw enthält ein gebündeltes StepFun-Provider-Plugin mit zwei Provider-IDs:

- `stepfun` für den Standard-Endpunkt
- `stepfun-plan` für den Step-Plan-Endpunkt

<Warning>
Standard und Step Plan sind **separate Provider** mit unterschiedlichen Endpunkten und Präfixen für Modellreferenzen (`stepfun/...` vs. `stepfun-plan/...`). Verwenden Sie einen China-Schlüssel mit den `.com`-Endpunkten und einen globalen Schlüssel mit den `.ai`-Endpunkten.
</Warning>

## Überblick über Region und Endpunkt

| Endpunkt  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Auth-Env-Var: `STEPFUN_API_KEY`

## Integrierter Katalog

Standard (`stepfun`):

| Modellreferenz          | Kontext | Max. Ausgabe | Hinweise                       |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Standardmodell für Standard |

Step Plan (`stepfun-plan`):

| Modellreferenz                    | Kontext | Max. Ausgabe | Hinweise                         |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Standardmodell für Step Plan    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Zusätzliches Step-Plan-Modell |

## Erste Schritte

Wählen Sie Ihre Provider-Oberfläche und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Standard">
    **Am besten geeignet für:** allgemeine Nutzung über den Standard-Endpunkt von StepFun.

    <Steps>
      <Step title="Wählen Sie Ihre Endpunktregion">
        | Authentifizierungsoption        | Endpunkt                         | Region        |
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
      <Step title="Nicht-interaktive Alternative">
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

    ### Modellreferenzen

    - Standardmodell: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Am besten geeignet für:** Step-Plan-Reasoning-Endpunkt.

    <Steps>
      <Step title="Wählen Sie Ihre Endpunktregion">
        | Authentifizierungsoption    | Endpunkt                                | Region        |
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
      <Step title="Nicht-interaktive Alternative">
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

    ### Modellreferenzen

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
    - Der Provider ist mit OpenClaw gebündelt, daher gibt es keinen separaten Installationsschritt für das Plugin.
    - `step-3.5-flash-2603` wird derzeit nur auf `stepfun-plan` bereitgestellt.
    - Ein einzelner Authentifizierungsablauf schreibt regionspassende Profile für `stepfun` und `stepfun-plan`, sodass beide Oberflächen gemeinsam erkannt werden können.
    - Verwenden Sie `openclaw models list` und `openclaw models set <provider/model>`, um Modelle zu prüfen oder zu wechseln.

  </Accordion>
</AccordionGroup>

<Note>
Eine breitere Provider-Übersicht finden Sie unter [Modell-Provider](/de/concepts/model-providers).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Provider, Modelle und Plugins.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    So wählen und konfigurieren Sie Modelle.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Verwaltung und Dokumentation von StepFun-API-Schlüsseln.
  </Card>
</CardGroup>

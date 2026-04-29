---
read_when:
    - Je wilt StepFun-modellen in OpenClaw
    - Je hebt hulp nodig bij het instellen van StepFun
summary: StepFun-modellen gebruiken met OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-29T23:13:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw bevat een gebundelde StepFun-provider-Plugin met twee provider-id's:

- `stepfun` voor het standaardendpoint
- `stepfun-plan` voor het Step Plan-endpoint

<Warning>
Standard en Step Plan zijn **afzonderlijke providers** met verschillende endpoints en modelverwijzingsvoorvoegsels (`stepfun/...` versus `stepfun-plan/...`). Gebruik een China-sleutel met de `.com`-endpoints en een globale sleutel met de `.ai`-endpoints.
</Warning>

## Overzicht van regio's en endpoints

| Endpoint  | China (`.com`)                         | Globaal (`.ai`)                       |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Auth-omgevingsvariabele: `STEPFUN_API_KEY`

## Ingebouwde catalogus

Standard (`stepfun`):

| Modelverwijzing         | Context | Maximale uitvoer | Opmerkingen            |
| ------------------------ | ------- | ---------------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536           | Standaardmodel voor Standard |

Step Plan (`stepfun-plan`):

| Modelverwijzing                   | Context | Maximale uitvoer | Opmerkingen                    |
| ---------------------------------- | ------- | ---------------- | ------------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536           | Standaardmodel voor Step Plan  |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536           | Extra model voor Step Plan     |

## Aan de slag

Kies je provideroppervlak en volg de installatiestappen.

<Tabs>
  <Tab title="Standard">
    **Meest geschikt voor:** algemeen gebruik via het standaardendpoint van StepFun.

    <Steps>
      <Step title="Kies je endpointregio">
        | Auth-keuze                      | Endpoint                         | Regio         |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Internationaal |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Voer onboarding uit">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Of voor het China-endpoint:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Niet-interactief alternatief">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Controleer of modellen beschikbaar zijn">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Modelverwijzingen

    - Standaardmodel: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Meest geschikt voor:** reasoning-endpoint van Step Plan.

    <Steps>
      <Step title="Kies je endpointregio">
        | Auth-keuze                  | Endpoint                                | Regio         |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Internationaal |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Voer onboarding uit">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Of voor het China-endpoint:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Niet-interactief alternatief">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Controleer of modellen beschikbaar zijn">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Modelverwijzingen

    - Standaardmodel: `stepfun-plan/step-3.5-flash`
    - Alternatief model: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Volledige configuratie: Standard-provider">
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

  <Accordion title="Volledige configuratie: Step Plan-provider">
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

  <Accordion title="Opmerkingen">
    - De provider is gebundeld met OpenClaw, dus er is geen afzonderlijke installatiestap voor de Plugin.
    - `step-3.5-flash-2603` wordt momenteel alleen beschikbaar gemaakt op `stepfun-plan`.
    - Eén auth-flow schrijft regiogekoppelde profielen voor zowel `stepfun` als `stepfun-plan`, zodat beide oppervlakken samen kunnen worden ontdekt.
    - Gebruik `openclaw models list` en `openclaw models set <provider/model>` om modellen te inspecteren of te wisselen.

  </Accordion>
</AccordionGroup>

<Note>
Zie [Modelproviders](/nl/concepts/model-providers) voor het bredere provideroverzicht.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelverwijzingen en failovergedrag.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema voor providers, modellen en plugins.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/models" icon="brain">
    Modellen kiezen en configureren.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Beheer en documentatie voor StepFun API-sleutels.
  </Card>
</CardGroup>

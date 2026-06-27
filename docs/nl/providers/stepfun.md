---
read_when:
    - Je wilt StepFun-modellen in OpenClaw
    - Je hebt hulp nodig bij de configuratie van StepFun
summary: Gebruik StepFun-modellen met OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:14:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

De StepFun-provider-Plugin ondersteunt twee provider-id's:

- `stepfun` voor het standaardeindpunt
- `stepfun-plan` voor het Step Plan-eindpunt

<Warning>
Standaard en Step Plan zijn **afzonderlijke providers** met verschillende eindpunten en modelref-voorvoegsels (`stepfun/...` tegenover `stepfun-plan/...`). Gebruik een China-sleutel met de `.com`-eindpunten en een globale sleutel met de `.ai`-eindpunten.
</Warning>

## Plugin installeren

Installeer de officiële Plugin en start daarna Gateway opnieuw:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Overzicht van regio's en eindpunten

| Eindpunt  | China (`.com`)                         | Globaal (`.ai`)                      |
| --------- | -------------------------------------- | ------------------------------------ |
| Standaard | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`          |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Auth-env-var: `STEPFUN_API_KEY`

## Ingebouwde catalogus

Standaard (`stepfun`):

| Modelref                 | Context | Max. uitvoer | Opmerkingen       |
| ------------------------ | ------- | ------------ | ----------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536       | Standaardmodel    |

Step Plan (`stepfun-plan`):

| Modelref                           | Context | Max. uitvoer | Opmerkingen                 |
| ---------------------------------- | ------- | ------------ | --------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536       | Standaard Step Plan-model   |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536       | Aanvullend Step Plan-model  |

## Aan de slag

Kies je provider-oppervlak en volg de installatiestappen.

<Tabs>
  <Tab title="Standaard">
    **Het beste voor:** algemeen gebruik via het standaard StepFun-eindpunt.

    <Steps>
      <Step title="Kies je eindpuntregio">
        | Auth-keuze                      | Eindpunt                         | Regio         |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Internationaal |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Of voor het China-eindpunt:

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
      <Step title="Controleren of modellen beschikbaar zijn">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Modelrefs

    - Standaardmodel: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Het beste voor:** Step Plan-redeneereindpunt.

    <Steps>
      <Step title="Kies je eindpuntregio">
        | Auth-keuze                  | Eindpunt                                | Regio         |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Internationaal |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Of voor het China-eindpunt:

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
      <Step title="Controleren of modellen beschikbaar zijn">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Modelrefs

    - Standaardmodel: `stepfun-plan/step-3.5-flash`
    - Alternatief model: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Volledige configuratie: standaardprovider">
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
    - De provider is een officieel extern pakket; installeer het vóór de installatie.
    - `step-3.5-flash-2603` wordt momenteel alleen beschikbaar gemaakt op `stepfun-plan`.
    - Eén auth-flow schrijft regio-gematchte profielen voor zowel `stepfun` als `stepfun-plan`, zodat beide oppervlakken samen kunnen worden ontdekt.
    - Gebruik `openclaw models list` en `openclaw models set <provider/model>` om modellen te inspecteren of te wisselen.

  </Accordion>
</AccordionGroup>

<Note>
Zie [Modelproviders](/nl/concepts/model-providers) voor het bredere provideroverzicht.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelrefs en failover-gedrag.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema voor providers, modellen en plugins.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/models" icon="brain">
    Modellen kiezen en configureren.
  </Card>
  <Card title="StepFun-platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API-sleutelbeheer en documentatie.
  </Card>
</CardGroup>

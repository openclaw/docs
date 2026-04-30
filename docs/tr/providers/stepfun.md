---
read_when:
    - OpenClaw'da StepFun modelleri istiyorsunuz
    - StepFun kurulumu için rehberliğe ihtiyacınız var
summary: StepFun modellerini OpenClaw ile kullanın
title: StepFun
x-i18n:
    generated_at: "2026-04-30T09:42:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw, iki sağlayıcı kimliğine sahip paketlenmiş bir StepFun sağlayıcı Plugin'i içerir:

- Standart uç nokta için `stepfun`
- Step Plan uç noktası için `stepfun-plan`

<Warning>
Standard ve Step Plan, farklı uç noktaları ve model ref önekleri (`stepfun/...` ile `stepfun-plan/...`) olan **ayrı sağlayıcılardır**. `.com` uç noktalarıyla China anahtarı, `.ai` uç noktalarıyla global anahtar kullanın.
</Warning>

## Bölge ve uç nokta özeti

| Uç nokta  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Kimlik doğrulama env var: `STEPFUN_API_KEY`

## Yerleşik katalog

Standard (`stepfun`):

| Model ref                | Bağlam  | Maks. çıktı | Notlar                  |
| ------------------------ | ------- | ----------- | ----------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536      | Varsayılan standart model |

Step Plan (`stepfun-plan`):

| Model ref                          | Bağlam  | Maks. çıktı | Notlar                      |
| ---------------------------------- | ------- | ----------- | --------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536      | Varsayılan Step Plan modeli |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536      | Ek Step Plan modeli         |

## Başlarken

Sağlayıcı yüzeyinizi seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Standard">
    **En uygun olduğu kullanım:** standart StepFun uç noktası üzerinden genel amaçlı kullanım.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi         | Uç nokta                        | Bölge         |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | International |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Veya China uç noktası için:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Etkileşimsiz alternatif">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Model ref'leri

    - Varsayılan model: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **En uygun olduğu kullanım:** Step Plan akıl yürütme uç noktası.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi     | Uç nokta                               | Bölge         |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | International |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Veya China uç noktası için:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Etkileşimsiz alternatif">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Model ref'leri

    - Varsayılan model: `stepfun-plan/step-3.5-flash`
    - Alternatif model: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Tam yapılandırma: Standard sağlayıcı">
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

  <Accordion title="Tam yapılandırma: Step Plan sağlayıcı">
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

  <Accordion title="Notlar">
    - Sağlayıcı OpenClaw ile paketlenmiş olarak gelir, bu nedenle ayrı bir Plugin yükleme adımı yoktur.
    - `step-3.5-flash-2603` şu anda yalnızca `stepfun-plan` üzerinde sunulur.
    - Tek bir kimlik doğrulama akışı hem `stepfun` hem de `stepfun-plan` için bölgeyle eşleşen profiller yazar; böylece iki yüzey birlikte keşfedilebilir.
    - Modelleri incelemek veya değiştirmek için `openclaw models list` ve `openclaw models set <provider/model>` kullanın.

  </Accordion>
</AccordionGroup>

<Note>
Daha geniş sağlayıcı özeti için [Model sağlayıcıları](/tr/concepts/model-providers) bölümüne bakın.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model ref'lerine ve failover davranışına genel bakış.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve Plugin'ler için tam yapılandırma şeması.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modelleri seçme ve yapılandırma yöntemi.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API anahtarı yönetimi ve dokümantasyonu.
  </Card>
</CardGroup>

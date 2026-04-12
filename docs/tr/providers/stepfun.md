---
read_when:
    - OpenClaw içinde StepFun modellerini istiyorsunuz
    - StepFun kurulum rehberine ihtiyacınız var
summary: OpenClaw ile StepFun modellerini kullanın
title: StepFun
x-i18n:
    generated_at: "2026-04-12T23:33:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: a463bed0951d33802dcdb3a7784406272ee206b731e9864ea020323e67b4d159
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw, iki sağlayıcı kimliğine sahip paketlenmiş bir StepFun sağlayıcı Plugin'i içerir:

- standart uç nokta için `stepfun`
- Step Plan uç noktası için `stepfun-plan`

<Warning>
Standard ve Step Plan, farklı uç noktalara ve farklı model ref öneklerine sahip **ayrı sağlayıcılardır** (`stepfun/...` ve `stepfun-plan/...`). `.com` uç noktalarıyla bir China anahtarı, `.ai` uç noktalarıyla ise global bir anahtar kullanın.
</Warning>

## Bölge ve uç nokta genel görünümü

| Uç nokta  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Kimlik doğrulama ortam değişkeni: `STEPFUN_API_KEY`

## Yerleşik kataloglar

Standard (`stepfun`):

| Model ref                | Bağlam  | Maks çıktı | Notlar                 |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Varsayılan standart model |

Step Plan (`stepfun-plan`):

| Model ref                          | Bağlam  | Maks çıktı | Notlar                     |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Varsayılan Step Plan modeli |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Ek Step Plan modeli        |

## Başlangıç

Sağlayıcı yüzeyinizi seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Standard">
    **En iyisi:** standart StepFun uç noktası üzerinden genel amaçlı kullanım.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi         | Uç nokta                        | Bölge         |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Uluslararası  |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | Çin           |
      </Step>
      <Step title="Başlangıç kurulumunu çalıştırın">
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

    ### Model referansları

    - Varsayılan model: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **En iyisi:** Step Plan akıl yürütme uç noktası.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi      | Uç nokta                               | Bölge         |
        | ---------------------------- | -------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Uluslararası  |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | Çin           |
      </Step>
      <Step title="Başlangıç kurulumunu çalıştırın">
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

    ### Model referansları

    - Varsayılan model: `stepfun-plan/step-3.5-flash`
    - Alternatif model: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Gelişmiş

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

  <Accordion title="Tam yapılandırma: Step Plan sağlayıcısı">
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
    - Sağlayıcı OpenClaw ile birlikte paketlenmiştir, bu nedenle ayrı bir Plugin kurulum adımı yoktur.
    - `step-3.5-flash-2603` şu anda yalnızca `stepfun-plan` üzerinde sunulmaktadır.
    - Tek bir kimlik doğrulama akışı, hem `stepfun` hem de `stepfun-plan` için bölgeyle eşleşen profiller yazar; böylece her iki yüzey birlikte keşfedilebilir.
    - Modelleri incelemek veya değiştirmek için `openclaw models list` ve `openclaw models set <provider/model>` kullanın.
  </Accordion>
</AccordionGroup>

<Note>
Daha geniş sağlayıcı genel görünümü için [Model providers](/tr/concepts/model-providers) bölümüne bakın.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcıların, model referanslarının ve yük devretme davranışının genel görünümü.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve Plugin'ler için tam yapılandırma şeması.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API anahtarı yönetimi ve belgeleri.
  </Card>
</CardGroup>

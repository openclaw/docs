---
read_when:
    - OpenClaw'da StepFun modellerini istiyorsunuz
    - You need StepFun setup guidance
summary: OpenClaw ile StepFun modellerini kullanın
title: StepFun
x-i18n:
    generated_at: "2026-04-24T09:28:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw, iki sağlayıcı kimliğine sahip paketli bir StepFun sağlayıcı plugin'i içerir:

- standart uç nokta için `stepfun`
- Step Plan uç noktası için `stepfun-plan`

<Warning>
Standard ve Step Plan, farklı uç noktalara ve farklı model ref öneklerine (`stepfun/...` ile `stepfun-plan/...`) sahip **ayrı sağlayıcılardır**. Çin anahtarını `.com` uç noktalarıyla, global anahtarı ise `.ai` uç noktalarıyla kullanın.
</Warning>

## Bölge ve uç nokta genel bakışı

| Uç nokta  | Çin (`.com`)                             | Global (`.ai`)                           |
| --------- | ---------------------------------------- | ---------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`             | `https://api.stepfun.ai/v1`              |
| Step Plan | `https://api.stepfun.com/step_plan/v1`   | `https://api.stepfun.ai/step_plan/v1`    |

Auth env değişkeni: `STEPFUN_API_KEY`

## Yerleşik katalog

Standard (`stepfun`):

| Model ref                | Bağlam  | Maks çıktı | Notlar                     |
| ------------------------ | ------- | ---------- | -------------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Varsayılan standart model  |

Step Plan (`stepfun-plan`):

| Model ref                          | Bağlam  | Maks çıktı | Notlar                        |
| ---------------------------------- | ------- | ---------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Varsayılan Step Plan modeli   |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Ek Step Plan modeli           |

## Başlarken

Sağlayıcı yüzeyinizi seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Standard">
    **Şunlar için en iyisi:** standart StepFun uç noktası üzerinden genel amaçlı kullanım.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Auth seçeneği                    | Uç nokta                         | Bölge         |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`      | Uluslararası  |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`     | Çin           |
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Veya Çin uç noktası için:

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
    **Şunlar için en iyisi:** Step Plan reasoning uç noktası.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Auth seçeneği                 | Uç nokta                                  | Bölge         |
        | ----------------------------- | ----------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`   | `https://api.stepfun.ai/step_plan/v1`     | Uluslararası  |
        | `stepfun-plan-api-key-cn`     | `https://api.stepfun.com/step_plan/v1`    | Çin           |
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Veya Çin uç noktası için:

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
    - Sağlayıcı OpenClaw ile paketlidir; bu yüzden ayrı plugin kurulum adımı yoktur.
    - `step-3.5-flash-2603` şu anda yalnızca `stepfun-plan` üzerinde açığa çıkar.
    - Tek bir auth akışı, hem `stepfun` hem de `stepfun-plan` için bölgeyle eşleşen profiller yazar; böylece iki yüzey birlikte keşfedilebilir.
    - Modelleri incelemek veya değiştirmek için `openclaw models list` ve `openclaw models set <provider/model>` kullanın.
  </Accordion>
</AccordionGroup>

<Note>
Daha geniş sağlayıcı genel bakışı için bkz. [Model providers](/tr/concepts/model-providers).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılar, model ref'leri ve failover davranışı için genel bakış.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve plugin'ler için tam yapılandırma şeması.
  </Card>
  <Card title="Model selection" href="/tr/concepts/models" icon="brain">
    Modelleri nasıl seçeceğiniz ve yapılandıracağınız.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API anahtarı yönetimi ve belgeleri.
  </Card>
</CardGroup>

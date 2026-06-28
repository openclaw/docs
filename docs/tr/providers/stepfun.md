---
read_when:
    - OpenClaw’da StepFun modelleri istiyorsunuz
    - StepFun kurulum rehberliğine ihtiyacınız var
summary: StepFun modellerini OpenClaw ile kullanın
title: StepFun
x-i18n:
    generated_at: "2026-06-28T01:12:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun sağlayıcı Plugin'i iki sağlayıcı kimliğini destekler:

- Standart uç nokta için `stepfun`
- Step Plan uç noktası için `stepfun-plan`

<Warning>
Standard ve Step Plan, farklı uç noktalara ve model ref öneklerine (`stepfun/...` ve `stepfun-plan/...`) sahip **ayrı sağlayıcılardır**. `.com` uç noktalarıyla Çin anahtarı, `.ai` uç noktalarıyla küresel anahtar kullanın.
</Warning>

## Plugin'i yükleme

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Bölge ve uç nokta özeti

| Uç nokta  | Çin (`.com`)                           | Küresel (`.ai`)                      |
| --------- | -------------------------------------- | ------------------------------------ |
| Standart  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`          |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Kimlik doğrulama env var: `STEPFUN_API_KEY`

## Yerleşik katalog

Standart (`stepfun`):

| Model ref                | Bağlam  | Maks. çıktı | Notlar                  |
| ------------------------ | ------- | ----------- | ----------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536      | Varsayılan standart model |

Step Plan (`stepfun-plan`):

| Model ref                          | Bağlam  | Maks. çıktı | Notlar                       |
| ---------------------------------- | ------- | ----------- | ---------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536      | Varsayılan Step Plan modeli  |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536      | Ek Step Plan modeli          |

## Başlarken

Sağlayıcı yüzeyinizi seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Standart">
    **En uygun olduğu kullanım:** standart StepFun uç noktası üzerinden genel amaçlı kullanım.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi      | Uç nokta                        | Bölge         |
        | ----------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Uluslararası |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | Çin          |
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Ya da Çin uç noktası için:

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
        | Kimlik doğrulama seçimi  | Uç nokta                                | Bölge         |
        | ------------------------ | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Uluslararası |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | Çin          |
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Ya da Çin uç noktası için:

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
  <Accordion title="Tam yapılandırma: Standart sağlayıcı">
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
    - Sağlayıcı resmi bir harici pakettir; kurulumdan önce yükleyin.
    - `step-3.5-flash-2603` şu anda yalnızca `stepfun-plan` üzerinde sunulur.
    - Tek bir kimlik doğrulama akışı, hem `stepfun` hem de `stepfun-plan` için bölgeyle eşleşen profiller yazar; böylece iki yüzey birlikte keşfedilebilir.
    - Modelleri incelemek veya değiştirmek için `openclaw models list` ve `openclaw models set <provider/model>` kullanın.

  </Accordion>
</AccordionGroup>

<Note>
Daha geniş sağlayıcı özeti için bkz. [Model sağlayıcıları](/tr/concepts/model-providers).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcıların, model ref'lerinin ve yük devretme davranışının özeti.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve plugin'ler için tam yapılandırma şeması.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modelleri nasıl seçeceğiniz ve yapılandıracağınız.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API anahtarı yönetimi ve dokümantasyonu.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw'da StepFun modellerini kullanmak istiyorsunuz
    - StepFun kurulum rehberine ihtiyacınız var
summary: StepFun modellerini OpenClaw ile kullanın
title: StepFun
x-i18n:
    generated_at: "2026-07-12T12:10:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun, iki sağlayıcı kimliğiyle harici bir resmi Plugin (`@openclaw/stepfun-provider`) olarak sunulur:

- Standart uç nokta için `stepfun`
- Step Plan uç noktası için `stepfun-plan`

<Warning>
Standart ve Step Plan, farklı uç noktalara ve model referansı ön eklerine (`stepfun/...` ile `stepfun-plan/...`) sahip **ayrı sağlayıcılardır**. `.com` uç noktalarıyla Çin anahtarı, `.ai` uç noktalarıyla küresel anahtar kullanın.
</Warning>

## Plugin'i yükleme

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Bölge ve uç nokta genel görünümü

| Uç nokta  | Çin (`.com`)                           | Küresel (`.ai`)                       |
| ---------- | -------------------------------------- | ------------------------------------- |
| Standart   | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan  | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Kimlik doğrulama ortam değişkeni: `STEPFUN_API_KEY`

## Yerleşik katalog

Standart (`stepfun`):

| Model referansı           | Bağlam  | En fazla çıktı | Notlar                          |
| ------------------------ | ------- | -------------- | ------------------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536         | Varsayılan standart model       |
| `stepfun/step-3.7-flash` | 262,144 | 262,144        | Çok modlu görüntü girdisi desteği |

Step Plan (`stepfun-plan`):

| Model referansı                     | Bağlam  | En fazla çıktı | Notlar                          |
| ---------------------------------- | ------- | -------------- | ------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536         | Varsayılan Step Plan modeli     |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144        | Çok modlu görüntü girdisi desteği |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536         | Ek Step Plan modeli             |

## Başlarken

<Tabs>
  <Tab title="Standart">
    Standart StepFun uç noktası üzerinden genel amaçlı kullanım için idealdir.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi       | Uç nokta                      | Bölge        |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | Uluslararası |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | Çin          |
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Çin uç noktası:

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

    Varsayılan model: `stepfun/step-3.5-flash`
    Alternatif model: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Step Plan akıl yürütme uç noktası için idealdir.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi    | Uç nokta                                | Bölge        |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | Uluslararası |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | Çin          |
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Çin uç noktası:

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

    Varsayılan model: `stepfun-plan/step-3.5-flash`
    Alternatif modeller: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Tek bir kimlik doğrulama akışı hem `stepfun` hem de `stepfun-plan` için bölgeyle eşleşen profiller yazar; böylece her iki yüzey de tek bir ilk kurulum çalıştırmasından sonra birlikte keşfedilir.

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

  <Accordion title="Notlar">
    - `step-3.7-flash`, OpenClaw üzerinden metin ve görüntü girdisini kabul eder. StepFun API'si videoyu da destekler ancak video henüz OpenClaw'da bir model girdi yöntemi değildir.
    - Step 3.7; `low`, `medium` ve `high` akıl yürütme düzeylerini destekler. Modelin akıl yürütmesiz bir modu olmadığından `/think off`, `low` olarak eşlenir.
    - `step-3.5-flash-2603` şu anda yalnızca `stepfun-plan` üzerinde sunulur.
    - Modelleri incelemek veya değiştirmek için `openclaw models list` ve `openclaw models set <provider/model>` komutlarını kullanın.

  </Accordion>
</AccordionGroup>

## İlgili konular

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model referanslarına ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve Plugin'ler için tam yapılandırma şeması.
  </Card>
  <Card title="Modeller CLI'si" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
  <Card title="StepFun Platformu" href="https://platform.stepfun.com" icon="globe">
    StepFun API anahtarı yönetimi ve belgeleri.
  </Card>
</CardGroup>

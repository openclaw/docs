---
read_when:
    - OpenClaw içinde StepFun modellerini kullanmak istediğinizde
    - StepFun kurulum rehberine ihtiyaç duyduğunuzda
summary: OpenClaw ile StepFun modellerini kullanın
title: StepFun
x-i18n:
    generated_at: "2026-04-05T14:04:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw, iki sağlayıcı kimliğine sahip paketlenmiş bir StepFun sağlayıcı plugin'i içerir:

- standart uç nokta için `stepfun`
- Step Plan uç noktası için `stepfun-plan`

Yerleşik kataloglar şu anda yüzeye göre farklılık gösterir:

- Standard: `step-3.5-flash`
- Step Plan: `step-3.5-flash`, `step-3.5-flash-2603`

## Bölge ve uç nokta genel bakışı

- Çin standart uç noktası: `https://api.stepfun.com/v1`
- Global standart uç nokta: `https://api.stepfun.ai/v1`
- Çin Step Plan uç noktası: `https://api.stepfun.com/step_plan/v1`
- Global Step Plan uç noktası: `https://api.stepfun.ai/step_plan/v1`
- Kimlik doğrulama ortam değişkeni: `STEPFUN_API_KEY`

`.com` uç noktalarıyla Çin anahtarını, `.ai`
uç noktalarıyla global anahtarı kullanın.

## CLI kurulumu

Etkileşimli kurulum:

```bash
openclaw onboard
```

Bu kimlik doğrulama seçeneklerinden birini seçin:

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

Etkileşimsiz örnekler:

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## Model başvuruları

- Standart varsayılan model: `stepfun/step-3.5-flash`
- Step Plan varsayılan model: `stepfun-plan/step-3.5-flash`
- Step Plan alternatif modeli: `stepfun-plan/step-3.5-flash-2603`

## Yerleşik kataloglar

Standart (`stepfun`):

| Model başvurusu         | Bağlam  | Maks çıktı | Notlar                    |
| ----------------------- | ------- | ---------- | ------------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Varsayılan standart model |

Step Plan (`stepfun-plan`):

| Model başvurusu                    | Bağlam  | Maks çıktı | Notlar                        |
| ---------------------------------- | ------- | ---------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Varsayılan Step Plan modeli   |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Ek Step Plan modeli           |

## Yapılandırma parçacıkları

Standart sağlayıcı:

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

Step Plan sağlayıcısı:

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

## Notlar

- Sağlayıcı OpenClaw ile paketlenmiştir, bu nedenle ayrı bir plugin kurulum adımı yoktur.
- `step-3.5-flash-2603` şu anda yalnızca `stepfun-plan` üzerinde sunulmaktadır.
- Tek bir kimlik doğrulama akışı, hem `stepfun` hem de `stepfun-plan` için bölgeyle eşleşen profiller yazar; böylece her iki yüzey birlikte keşfedilebilir.
- Modelleri incelemek veya değiştirmek için `openclaw models list` ve `openclaw models set <provider/model>` kullanın.
- Daha geniş sağlayıcı genel bakışı için [Model providers](/tr/concepts/model-providers) sayfasına bakın.

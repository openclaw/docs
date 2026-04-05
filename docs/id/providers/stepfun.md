---
read_when:
    - Anda menginginkan model StepFun di OpenClaw
    - Anda memerlukan panduan setup StepFun
summary: Gunakan model StepFun dengan OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-05T14:04:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw menyertakan plugin provider StepFun bawaan dengan dua id provider:

- `stepfun` untuk endpoint standar
- `stepfun-plan` untuk endpoint Step Plan

Katalog bawaan saat ini berbeda menurut permukaan:

- Standar: `step-3.5-flash`
- Step Plan: `step-3.5-flash`, `step-3.5-flash-2603`

## Ikhtisar region dan endpoint

- Endpoint standar China: `https://api.stepfun.com/v1`
- Endpoint standar global: `https://api.stepfun.ai/v1`
- Endpoint Step Plan China: `https://api.stepfun.com/step_plan/v1`
- Endpoint Step Plan global: `https://api.stepfun.ai/step_plan/v1`
- Env var auth: `STEPFUN_API_KEY`

Gunakan key China dengan endpoint `.com` dan key global dengan endpoint `.ai`.

## Setup CLI

Setup interaktif:

```bash
openclaw onboard
```

Pilih salah satu dari auth choice berikut:

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

Contoh non-interaktif:

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## Ref model

- Model default standar: `stepfun/step-3.5-flash`
- Model default Step Plan: `stepfun-plan/step-3.5-flash`
- Model alternatif Step Plan: `stepfun-plan/step-3.5-flash-2603`

## Katalog bawaan

Standar (`stepfun`):

| Ref model                | Konteks | Output maks | Catatan                |
| ------------------------ | ------- | ----------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536      | Model standar default  |

Step Plan (`stepfun-plan`):

| Ref model                          | Konteks | Output maks | Catatan                    |
| ---------------------------------- | ------- | ----------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536      | Model Step Plan default    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536      | Model Step Plan tambahan   |

## Cuplikan konfigurasi

Provider standar:

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

Provider Step Plan:

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

## Catatan

- Provider ini disertakan bersama OpenClaw, jadi tidak ada langkah instalasi plugin terpisah.
- `step-3.5-flash-2603` saat ini hanya diekspos pada `stepfun-plan`.
- Satu alur auth menulis profil yang sesuai region untuk `stepfun` dan `stepfun-plan`, sehingga kedua permukaan dapat ditemukan bersama.
- Gunakan `openclaw models list` dan `openclaw models set <provider/model>` untuk memeriksa atau mengganti model.
- Untuk ikhtisar provider yang lebih luas, lihat [Model providers](/id/concepts/model-providers).

---
read_when:
    - Anda ingin model StepFun di OpenClaw
    - Anda memerlukan panduan penyiapan StepFun
summary: Gunakan model StepFun dengan OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T14:34:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun didistribusikan sebagai plugin resmi eksternal (`@openclaw/stepfun-provider`) dengan dua ID penyedia:

- `stepfun` untuk endpoint standar
- `stepfun-plan` untuk endpoint Step Plan

<Warning>
Standar dan Step Plan adalah **penyedia terpisah** dengan endpoint dan prefiks referensi model yang berbeda (`stepfun/...` dibandingkan dengan `stepfun-plan/...`). Gunakan kunci Tiongkok dengan endpoint `.com` dan kunci global dengan endpoint `.ai`.
</Warning>

## Instal plugin

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Ikhtisar wilayah dan endpoint

| Endpoint  | Tiongkok (`.com`)                       | Global (`.ai`)                         |
| --------- | -------------------------------------- | ------------------------------------- |
| Standar   | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variabel lingkungan autentikasi: `STEPFUN_API_KEY`

## Katalog bawaan

Standar (`stepfun`):

| Referensi model          | Konteks | Output maks. | Catatan                         |
| ------------------------ | ------- | ------------ | ------------------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536       | Model standar default           |
| `stepfun/step-3.7-flash` | 262,144 | 262,144      | Mendukung input gambar multimodal |

Step Plan (`stepfun-plan`):

| Referensi model                    | Konteks | Output maks. | Catatan                         |
| ---------------------------------- | ------- | ------------ | ------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536       | Model Step Plan default         |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144      | Mendukung input gambar multimodal |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536       | Model Step Plan tambahan        |

## Memulai

<Tabs>
  <Tab title="Standar">
    Paling sesuai untuk penggunaan umum melalui endpoint standar StepFun.

    <Steps>
      <Step title="Pilih wilayah endpoint Anda">
        | Pilihan autentikasi             | Endpoint                     | Wilayah        |
        | -------------------------------- | ---------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | Internasional  |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | Tiongkok       |
      </Step>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Endpoint Tiongkok:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Alternatif noninteraktif">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    Model default: `stepfun/step-3.5-flash`
    Model alternatif: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Paling sesuai untuk endpoint penalaran Step Plan.

    <Steps>
      <Step title="Pilih wilayah endpoint Anda">
        | Pilihan autentikasi          | Endpoint                                | Wilayah       |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | Internasional |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | Tiongkok      |
      </Step>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Endpoint Tiongkok:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Alternatif noninteraktif">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    Model default: `stepfun-plan/step-3.5-flash`
    Model alternatif: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Satu alur autentikasi menulis profil yang sesuai dengan wilayah untuk `stepfun` dan `stepfun-plan`, sehingga kedua permukaan ditemukan bersama setelah satu kali menjalankan orientasi awal.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Konfigurasi lengkap: Penyedia standar">
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

  <Accordion title="Konfigurasi lengkap: Penyedia Step Plan">
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

  <Accordion title="Catatan">
    - `step-3.7-flash` menerima input teks dan gambar melalui OpenClaw. API StepFun juga mendukung video, yang belum menjadi modalitas input model di OpenClaw.
    - Step 3.7 mendukung tingkat upaya penalaran `low`, `medium`, dan `high`. Karena model tidak memiliki mode tanpa penalaran, `/think off` dipetakan ke `low`.
    - `step-3.5-flash-2603` saat ini hanya tersedia di `stepfun-plan`.
    - Gunakan `openclaw models list` dan `openclaw models set <provider/model>` untuk memeriksa atau mengganti model.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap untuk penyedia, model, dan plugin.
  </Card>
  <Card title="CLI model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
  <Card title="Platform StepFun" href="https://platform.stepfun.com" icon="globe">
    Pengelolaan kunci API dan dokumentasi StepFun.
  </Card>
</CardGroup>

---
read_when:
    - Anda menginginkan model StepFun di OpenClaw
    - Anda memerlukan panduan penyiapan StepFun
summary: Gunakan model StepFun dengan OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-30T10:08:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw menyertakan Plugin penyedia StepFun bawaan dengan dua id penyedia:

- `stepfun` untuk endpoint standar
- `stepfun-plan` untuk endpoint Step Plan

<Warning>
Standar dan Step Plan adalah **penyedia terpisah** dengan endpoint dan prefiks ref model yang berbeda (`stepfun/...` vs `stepfun-plan/...`). Gunakan kunci China dengan endpoint `.com` dan kunci global dengan endpoint `.ai`.
</Warning>

## Ringkasan region dan endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standar   | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variabel env autentikasi: `STEPFUN_API_KEY`

## Katalog bawaan

Standar (`stepfun`):

| Ref model                | Konteks | Output maks | Catatan              |
| ------------------------ | ------- | ----------- | -------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536      | Model standar default |

Step Plan (`stepfun-plan`):

| Ref model                          | Konteks | Output maks | Catatan                    |
| ---------------------------------- | ------- | ----------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536      | Model Step Plan default    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536      | Model Step Plan tambahan   |

## Mulai menggunakan

Pilih permukaan penyedia Anda dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Standar">
    **Paling cocok untuk:** penggunaan umum melalui endpoint StepFun standar.

    <Steps>
      <Step title="Pilih region endpoint Anda">
        | Pilihan autentikasi           | Endpoint                         | Region        |
        | ----------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Internasional |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Atau untuk endpoint China:

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
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Ref model

    - Model default: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Paling cocok untuk:** endpoint penalaran Step Plan.

    <Steps>
      <Step title="Pilih region endpoint Anda">
        | Pilihan autentikasi       | Endpoint                                | Region        |
        | ------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Internasional |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Atau untuk endpoint China:

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
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Ref model

    - Model default: `stepfun-plan/step-3.5-flash`
    - Model alternatif: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

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
    - Penyedia ini dibundel dengan OpenClaw, jadi tidak ada langkah instalasi Plugin terpisah.
    - `step-3.5-flash-2603` saat ini hanya diekspos di `stepfun-plan`.
    - Satu alur autentikasi menulis profil yang cocok dengan region untuk `stepfun` dan `stepfun-plan`, sehingga kedua permukaan dapat ditemukan bersama-sama.
    - Gunakan `openclaw models list` dan `openclaw models set <provider/model>` untuk memeriksa atau mengganti model.

  </Accordion>
</AccordionGroup>

<Note>
Untuk ringkasan penyedia yang lebih luas, lihat [Penyedia model](/id/concepts/model-providers).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Ringkasan semua penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap untuk penyedia, model, dan plugins.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
  <Card title="Platform StepFun" href="https://platform.stepfun.com" icon="globe">
    Pengelolaan kunci API dan dokumentasi StepFun.
  </Card>
</CardGroup>

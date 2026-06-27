---
read_when:
    - Anda menginginkan model StepFun di OpenClaw
    - Anda memerlukan panduan penyiapan StepFun
summary: Gunakan model StepFun dengan OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:07:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

Plugin penyedia StepFun mendukung dua id penyedia:

- `stepfun` untuk titik akhir standar
- `stepfun-plan` untuk titik akhir Step Plan

<Warning>
Standard dan Step Plan adalah **penyedia terpisah** dengan titik akhir dan prefiks ref model yang berbeda (`stepfun/...` vs `stepfun-plan/...`). Gunakan kunci China dengan titik akhir `.com` dan kunci global dengan titik akhir `.ai`.
</Warning>

## Instal plugin

Instal plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Ringkasan region dan titik akhir

| Titik akhir | China (`.com`)                         | Global (`.ai`)                        |
| ----------- | -------------------------------------- | ------------------------------------- |
| Standar     | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan   | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variabel env auth: `STEPFUN_API_KEY`

## Katalog bawaan

Standar (`stepfun`):

| Ref model                | Konteks | Output maks | Catatan                |
| ------------------------ | ------- | ----------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536      | Model standar default  |

Step Plan (`stepfun-plan`):

| Ref model                          | Konteks | Output maks | Catatan                     |
| ---------------------------------- | ------- | ----------- | --------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536      | Model Step Plan default     |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536      | Model Step Plan tambahan    |

## Memulai

Pilih permukaan penyedia Anda dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Standar">
    **Terbaik untuk:** penggunaan serbaguna melalui titik akhir StepFun standar.

    <Steps>
      <Step title="Pilih region titik akhir Anda">
        | Pilihan auth                    | Titik akhir                     | Region        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Internasional |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Atau untuk titik akhir China:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Alternatif non-interaktif">
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
    **Terbaik untuk:** titik akhir penalaran Step Plan.

    <Steps>
      <Step title="Pilih region titik akhir Anda">
        | Pilihan auth                | Titik akhir                            | Region        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Internasional |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Atau untuk titik akhir China:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Alternatif non-interaktif">
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
  <Accordion title="Konfigurasi lengkap: penyedia standar">
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

  <Accordion title="Konfigurasi lengkap: penyedia Step Plan">
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
    - Penyedia ini adalah paket eksternal resmi; instal sebelum penyiapan.
    - `step-3.5-flash-2603` saat ini hanya diekspos pada `stepfun-plan`.
    - Satu alur auth menulis profil yang sesuai region untuk `stepfun` dan `stepfun-plan`, sehingga kedua permukaan dapat ditemukan bersama.
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
    Skema konfigurasi lengkap untuk penyedia, model, dan plugin.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
  <Card title="Platform StepFun" href="https://platform.stepfun.com" icon="globe">
    Manajemen kunci API dan dokumentasi StepFun.
  </Card>
</CardGroup>

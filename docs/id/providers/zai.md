---
read_when:
    - Anda menginginkan model Z.AI / GLM di OpenClaw
    - Anda memerlukan penyiapan ZAI_API_KEY sederhana
summary: Gunakan Z.AI (model GLM) dengan OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T10:09:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI adalah platform API untuk model **GLM**. Platform ini menyediakan REST API untuk GLM dan menggunakan API key
untuk autentikasi. Buat API key Anda di konsol Z.AI. OpenClaw menggunakan provider `zai`
dengan API key Z.AI.

- Provider: `zai`
- Autentikasi: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autentikasi Bearer)

## Memulai

<Tabs>
  <Tab title="Deteksi otomatis endpoint">
    **Paling cocok untuk:** sebagian besar pengguna. OpenClaw mendeteksi endpoint Z.AI yang sesuai dari key dan menerapkan base URL yang benar secara otomatis.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional eksplisit">
    **Paling cocok untuk:** pengguna yang ingin memaksa Coding Plan atau permukaan API umum tertentu.

    <Steps>
      <Step title="Pilih opsi onboarding yang tepat">
        ```bash
        # Coding Plan Global (disarankan untuk pengguna Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (wilayah China)
        openclaw onboard --auth-choice zai-coding-cn

        # API Umum
        openclaw onboard --auth-choice zai-global

        # API Umum CN (wilayah China)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Katalog bawaan

OpenClaw saat ini mengisi provider `zai` bawaan dengan:

| Ref model            | Catatan       |
| -------------------- | ------------- |
| `zai/glm-5.1`        | Model default |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
Model GLM tersedia sebagai `zai/<model>` (contoh: `zai/glm-5`). Ref model bawaan default adalah `zai/glm-5.1`.
</Tip>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Forward-resolving model GLM-5 yang tidak dikenal">
    Id `glm-5*` yang tidak dikenal tetap di-resolve maju pada jalur provider bawaan dengan
    menyintesis metadata milik provider dari templat `glm-4.7` ketika id tersebut
    cocok dengan bentuk keluarga GLM-5 saat ini.
  </Accordion>

  <Accordion title="Streaming tool-call">
    `tool_stream` diaktifkan secara default untuk streaming tool-call Z.AI. Untuk menonaktifkannya:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Thinking dan thinking yang dipertahankan">
    Thinking Z.AI mengikuti kontrol `/think` OpenClaw. Saat thinking nonaktif,
    OpenClaw mengirim `thinking: { type: "disabled" }` untuk menghindari respons yang
    menghabiskan anggaran keluaran pada `reasoning_content` sebelum teks yang terlihat.

    Thinking yang dipertahankan bersifat opt-in karena Z.AI mengharuskan seluruh riwayat
    `reasoning_content` diputar ulang, yang meningkatkan token prompt. Aktifkan
    per model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Saat diaktifkan dan thinking menyala, OpenClaw mengirim
    `thinking: { type: "enabled", clear_thinking: false }` dan memutar ulang
    `reasoning_content` sebelumnya untuk transkrip kompatibel OpenAI yang sama.

    Pengguna tingkat lanjut masih dapat mengganti payload provider yang tepat dengan
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Pemahaman gambar">
    Plugin Z.AI bawaan mendaftarkan pemahaman gambar.

    | Properti      | Nilai       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Pemahaman gambar di-resolve otomatis dari auth Z.AI yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan.

  </Accordion>

  <Accordion title="Detail auth">
    - Z.AI menggunakan autentikasi Bearer dengan API key Anda.
    - Opsi onboarding `zai-api-key` mendeteksi otomatis endpoint Z.AI yang sesuai dari prefiks key.
    - Gunakan opsi regional eksplisit (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) saat Anda ingin memaksa permukaan API tertentu.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Keluarga model GLM" href="/id/providers/glm" icon="microchip">
    Ikhtisar keluarga model untuk GLM.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
</CardGroup>

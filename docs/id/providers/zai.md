---
read_when:
    - Anda ingin menggunakan model Z.AI / GLM di OpenClaw
    - Anda memerlukan penyiapan ZAI_API_KEY sederhana
summary: Gunakan Z.AI (model GLM) dengan OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T09:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI adalah platform API untuk model **GLM**. Platform ini menyediakan API REST untuk GLM dan menggunakan kunci API
untuk autentikasi. Buat kunci API Anda di konsol Z.AI. OpenClaw menggunakan provider `zai`
dengan kunci API Z.AI.

- Provider: `zai`
- Autentikasi: `ZAI_API_KEY`
- API: Chat Completions Z.AI (autentikasi Bearer)

## Memulai

<Tabs>
  <Tab title="Auto-detect endpoint">
    **Paling cocok untuk:** sebagian besar pengguna. OpenClaw mendeteksi endpoint Z.AI yang sesuai dari kunci dan menerapkan URL dasar yang benar secara otomatis.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **Paling cocok untuk:** pengguna yang ingin memaksa Coding Plan atau permukaan API umum tertentu.

    <Steps>
      <Step title="Pick the right onboarding choice">
        ```bash
        # Coding Plan Global (disarankan untuk pengguna Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (wilayah China)
        openclaw onboard --auth-choice zai-coding-cn

        # API umum
        openclaw onboard --auth-choice zai-global

        # API umum CN (wilayah China)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Katalog bawaan

OpenClaw menyertakan katalog provider `zai` terpaket di manifest Plugin, sehingga pencantuman
hanya-baca dapat menampilkan baris GLM yang dikenal tanpa memuat runtime provider:

```bash
openclaw models list --all --provider zai
```

Katalog berbasis manifest saat ini mencakup:

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
  <Accordion title="Forward-resolving unknown GLM-5 models">
    Id `glm-5*` yang tidak dikenal tetap di-resolve ke depan pada jalur provider terpaket dengan
    menyintesis metadata milik provider dari templat `glm-4.7` saat id tersebut
    cocok dengan bentuk keluarga GLM-5 saat ini.
  </Accordion>

  <Accordion title="Tool-call streaming">
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

  <Accordion title="Thinking and preserved thinking">
    Thinking Z.AI mengikuti kontrol `/think` OpenClaw. Dengan thinking nonaktif,
    OpenClaw mengirim `thinking: { type: "disabled" }` untuk menghindari respons yang
    menghabiskan anggaran keluaran pada `reasoning_content` sebelum teks yang terlihat.

    Thinking yang dipertahankan bersifat opt-in karena Z.AI mewajibkan seluruh riwayat
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

    Saat diaktifkan dan thinking aktif, OpenClaw mengirim
    `thinking: { type: "enabled", clear_thinking: false }` dan memutar ulang
    `reasoning_content` sebelumnya untuk transkrip kompatibel OpenAI yang sama.

    Pengguna tingkat lanjut tetap dapat mengganti payload provider persisnya dengan
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Image understanding">
    Plugin Z.AI terpaket mendaftarkan pemahaman gambar.

    | Properti      | Nilai       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Pemahaman gambar di-resolve otomatis dari autentikasi Z.AI yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan.

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI menggunakan autentikasi Bearer dengan kunci API Anda.
    - Pilihan onboarding `zai-api-key` otomatis mendeteksi endpoint Z.AI yang sesuai dari prefiks kunci.
    - Gunakan pilihan regional eksplisit (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) saat Anda ingin memaksa permukaan API tertentu.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="GLM model family" href="/id/providers/glm" icon="microchip">
    Ikhtisar keluarga model untuk GLM.
  </Card>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
</CardGroup>

---
read_when:
    - Anda ingin model Z.AI / GLM di OpenClaw
    - Anda memerlukan penyiapan `ZAI_API_KEY` yang sederhana
summary: Gunakan Z.AI (model GLM) dengan OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T11:38:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI adalah platform API untuk model **GLM**. Platform ini menyediakan REST API untuk GLM dan menggunakan API key
untuk autentikasi. Buat API key Anda di konsol Z.AI. OpenClaw menggunakan provider `zai`
dengan API key Z.AI.

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autentikasi Bearer)

## Memulai

<Tabs>
  <Tab title="Deteksi endpoint otomatis">
    **Terbaik untuk:** sebagian besar pengguna. OpenClaw mendeteksi endpoint Z.AI yang cocok dari key dan menerapkan base URL yang benar secara otomatis.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Setel model default">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional eksplisit">
    **Terbaik untuk:** pengguna yang ingin memaksa Coding Plan tertentu atau surface API umum tertentu.

    <Steps>
      <Step title="Pilih opsi onboarding yang tepat">
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
      <Step title="Setel model default">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Katalog bawaan

OpenClaw saat ini melakukan seed pada provider bawaan `zai` dengan:

| Model ref            | Catatan       |
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
    Id `glm-5*` yang tidak dikenal tetap di-forward-resolve pada jalur provider bawaan dengan
    mensintesis metadata milik provider dari template `glm-4.7` ketika id tersebut
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

  <Accordion title="Thinking dan preserved thinking">
    Thinking Z.AI mengikuti kontrol `/think` OpenClaw. Saat thinking nonaktif,
    OpenClaw mengirim `thinking: { type: "disabled" }` untuk menghindari respons yang
    menghabiskan anggaran output pada `reasoning_content` sebelum teks terlihat.

    Preserved thinking bersifat opt-in karena Z.AI mengharuskan
    `reasoning_content` historis penuh diputar ulang, yang meningkatkan token prompt. Aktifkan
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
    `reasoning_content` sebelumnya untuk transkrip OpenAI-compatible yang sama.

    Pengguna lanjutan tetap dapat menimpa payload provider yang tepat dengan
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Pemahaman gambar">
    Plugin Z.AI bawaan mendaftarkan pemahaman gambar.

    | Property      | Nilai       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Pemahaman gambar di-resolve otomatis dari auth Z.AI yang dikonfigurasi — tidak
    diperlukan config tambahan.

  </Accordion>

  <Accordion title="Detail auth">
    - Z.AI menggunakan autentikasi Bearer dengan API key Anda.
    - Opsi onboarding `zai-api-key` mendeteksi endpoint Z.AI yang cocok dari prefiks key secara otomatis.
    - Gunakan opsi regional eksplisit (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) saat Anda ingin memaksa surface API tertentu.

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

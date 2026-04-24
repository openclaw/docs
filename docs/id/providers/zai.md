---
read_when:
    - Anda menginginkan model Z.AI / GLM di OpenClaw
    - Anda memerlukan penyiapan `ZAI_API_KEY` yang sederhana
summary: Gunakan Z.AI (model GLM) dengan OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T09:25:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI adalah platform API untuk model **GLM**. Platform ini menyediakan REST API untuk GLM dan menggunakan API key
untuk autentikasi. Buat API key Anda di konsol Z.AI. OpenClaw menggunakan provider `zai`
dengan API key Z.AI.

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (auth Bearer)

## Memulai

<Tabs>
  <Tab title="Endpoint deteksi otomatis">
    **Terbaik untuk:** sebagian besar pengguna. OpenClaw mendeteksi endpoint Z.AI yang cocok dari key dan menerapkan base URL yang benar secara otomatis.

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
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional eksplisit">
    **Terbaik untuk:** pengguna yang ingin memaksa surface Coding Plan atau API umum tertentu.

    <Steps>
      <Step title="Pilih onboarding choice yang tepat">
        ```bash
        # Coding Plan Global (direkomendasikan untuk pengguna Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (wilayah China)
        openclaw onboard --auth-choice zai-coding-cn

        # API umum
        openclaw onboard --auth-choice zai-global

        # API umum CN (wilayah China)
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
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Katalog bawaan

OpenClaw saat ini menginisialisasi provider `zai` bawaan dengan:

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
    Id `glm-5*` yang tidak dikenal tetap di-forward-resolve pada jalur provider bawaan dengan
    menyintesis metadata milik provider dari template `glm-4.7` ketika id tersebut
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

  <Accordion title="Pemahaman gambar">
    Plugin Z.AI bawaan mendaftarkan pemahaman gambar.

    | Properti      | Nilai       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Pemahaman gambar di-resolve otomatis dari auth Z.AI yang dikonfigurasi — tidak
    diperlukan config tambahan.

  </Accordion>

  <Accordion title="Detail auth">
    - Z.AI menggunakan auth Bearer dengan API key Anda.
    - Onboarding choice `zai-api-key` mendeteksi endpoint Z.AI yang cocok secara otomatis dari prefiks key.
    - Gunakan choice regional eksplisit (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) saat Anda ingin memaksa surface API tertentu.
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

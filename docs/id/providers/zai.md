---
read_when:
    - Anda menginginkan model Z.AI / GLM di OpenClaw
    - Anda memerlukan penyiapan ZAI_API_KEY sederhana
summary: Gunakan Z.AI (model GLM) dengan OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:08:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI adalah platform API untuk model **GLM**. Platform ini menyediakan REST API untuk GLM dan
menggunakan kunci API untuk autentikasi. Buat kunci API Anda di konsol Z.AI.
OpenClaw menggunakan penyedia `zai` dengan kunci API Z.AI.

| Properti | Nilai                                        |
| -------- | -------------------------------------------- |
| Penyedia | `zai`                                        |
| Paket    | `@openclaw/zai-provider`                     |
| Autentikasi | `ZAI_API_KEY` (alias lama: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (autentikasi Bearer)   |

## Model GLM

GLM adalah keluarga model, bukan penyedia terpisah. Di OpenClaw, model GLM menggunakan
ref seperti `zai/glm-5.2`: penyedia `zai`, id model `glm-5.2`.

## Memulai

Instal Plugin penyedia terlebih dahulu:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Deteksi otomatis endpoint">
    **Paling cocok untuk:** sebagian besar pengguna. OpenClaw memeriksa endpoint Z.AI yang didukung dengan kunci API Anda dan menerapkan URL dasar yang benar secara otomatis.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verifikasi model tercantum">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional eksplisit">
    **Paling cocok untuk:** pengguna yang ingin memaksa Coding Plan tertentu atau permukaan API umum.

    <Steps>
      <Step title="Pilih opsi onboarding yang tepat">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Verifikasi model tercantum">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Contoh konfigurasi

<Tip>
`zai-api-key` memungkinkan OpenClaw mendeteksi endpoint Z.AI yang sesuai dari kunci dan
menerapkan URL dasar yang benar secara otomatis. Gunakan opsi regional eksplisit saat
Anda ingin memaksa Coding Plan tertentu atau permukaan API umum.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Katalog bawaan

Plugin penyedia `zai` menyertakan katalognya dalam manifes Plugin, sehingga daftar
hanya-baca dapat menampilkan baris GLM yang diketahui tanpa memuat runtime penyedia:

```bash
openclaw models list --all --provider zai
```

Katalog berbasis manifes saat ini mencakup:

| Ref model            | Catatan                         |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Default Coding Plan; konteks 1M |
| `zai/glm-5.1`        | Default API umum                |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
Model GLM tersedia sebagai `zai/<model>` (contoh: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 mendukung tingkat berpikir `off`, `low`, `high`, dan `max`. OpenClaw memetakan
`low` dan `high` ke upaya penalaran tinggi Z.AI, dan `max` ke upaya maksimum.
</Tip>

<Note>
Penyiapan Coding Plan menggunakan default `zai/glm-5.2`; penyiapan API umum tetap menggunakan
`zai/glm-5.1`. Deteksi otomatis endpoint kembali ke `glm-5.1` atau `glm-4.7`
saat paket yang dipilih tidak mengekspos GLM-5.2. Versi dan ketersediaan GLM
dapat berubah; jalankan `openclaw models list --all --provider zai` untuk melihat katalog
yang diketahui oleh versi terinstal Anda.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Menyelesaikan maju model GLM-5 yang tidak dikenal">
    Id `glm-5*` yang tidak dikenal tetap diselesaikan maju pada jalur penyedia dengan
    mensintesis metadata milik penyedia dari templat `glm-4.7` saat id
    cocok dengan bentuk keluarga GLM-5 saat ini.
  </Accordion>

  <Accordion title="Streaming panggilan alat">
    `tool_stream` diaktifkan secara default untuk streaming panggilan alat Z.AI. Untuk menonaktifkannya:

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
    Thinking Z.AI mengikuti kontrol `/think` OpenClaw. Dengan thinking nonaktif,
    OpenClaw mengirim `thinking: { type: "disabled" }` untuk menghindari respons yang
    menghabiskan anggaran output pada `reasoning_content` sebelum teks terlihat.

    Thinking yang dipertahankan bersifat opt-in karena Z.AI mensyaratkan seluruh
    riwayat `reasoning_content` diputar ulang, yang meningkatkan token prompt. Aktifkan
    per model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Saat diaktifkan dan thinking menyala, OpenClaw mengirim
    `thinking: { type: "enabled", clear_thinking: false }` dan memutar ulang
    `reasoning_content` sebelumnya untuk transkrip yang kompatibel dengan OpenAI yang sama.

    Pengguna tingkat lanjut masih dapat menimpa payload penyedia yang persis dengan
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Pemahaman gambar">
    Plugin Z.AI mendaftarkan pemahaman gambar.

    | Properti      | Nilai       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Pemahaman gambar diselesaikan otomatis dari autentikasi Z.AI yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan.

  </Accordion>

  <Accordion title="Detail autentikasi">
    - Z.AI menggunakan autentikasi Bearer dengan kunci API Anda.
    - Opsi onboarding `zai-api-key` mendeteksi otomatis endpoint Z.AI yang sesuai dengan memeriksa endpoint yang didukung menggunakan kunci Anda.
    - Gunakan opsi regional eksplisit (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) saat Anda ingin memaksa permukaan API tertentu.
    - Env var lama `Z_AI_API_KEY` masih diterima; OpenClaw menyalinnya ke `ZAI_API_KEY` saat startup jika `ZAI_API_KEY` belum disetel.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap OpenClaw, termasuk pengaturan penyedia dan model.
  </Card>
</CardGroup>

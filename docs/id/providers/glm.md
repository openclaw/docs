---
read_when:
    - Anda menginginkan model GLM di OpenClaw
    - Anda memerlukan konvensi penamaan model dan penyiapannya
summary: Ikhtisar keluarga model GLM + cara menggunakannya di OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-24T09:23:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# Model GLM

GLM adalah **keluarga model** (bukan perusahaan) yang tersedia melalui platform Z.AI. Di OpenClaw, model GLM
diakses melalui provider `zai` dan ID model seperti `zai/glm-5`.

## Memulai

<Steps>
  <Step title="Pilih rute autentikasi dan jalankan onboarding">
    Pilih opsi onboarding yang sesuai dengan paket dan wilayah Z.AI Anda:

    | Opsi autentikasi | Paling cocok untuk |
    | ----------- | -------- |
    | `zai-api-key` | Penyiapan API key umum dengan deteksi endpoint otomatis |
    | `zai-coding-global` | Pengguna Coding Plan (global) |
    | `zai-coding-cn` | Pengguna Coding Plan (wilayah Tiongkok) |
    | `zai-global` | API umum (global) |
    | `zai-cn` | API umum (wilayah Tiongkok) |

    ```bash
    # Contoh: deteksi otomatis umum
    openclaw onboard --auth-choice zai-api-key

    # Contoh: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Tetapkan GLM sebagai model default">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Contoh konfigurasi

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` memungkinkan OpenClaw mendeteksi endpoint Z.AI yang sesuai dari key tersebut dan
menerapkan base URL yang benar secara otomatis. Gunakan opsi regional eksplisit saat
Anda ingin memaksa Coding Plan tertentu atau permukaan API umum tertentu.
</Tip>

## Katalog bawaan

OpenClaw saat ini menginisialisasi provider `zai` bawaan dengan referensi GLM berikut:

| Model           | Model            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
Referensi model bawaan default adalah `zai/glm-5.1`. Versi dan ketersediaan GLM
dapat berubah; periksa dokumentasi Z.AI untuk informasi terbaru.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Deteksi endpoint otomatis">
    Saat Anda menggunakan opsi autentikasi `zai-api-key`, OpenClaw memeriksa format key
    untuk menentukan base URL Z.AI yang benar. Opsi regional eksplisit
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) menggantikan
    deteksi otomatis dan menyematkan endpoint secara langsung.
  </Accordion>

  <Accordion title="Detail provider">
    Model GLM disajikan oleh provider runtime `zai`. Untuk konfigurasi provider lengkap,
    endpoint regional, dan kapabilitas tambahan, lihat
    [dokumentasi provider Z.AI](/id/providers/zai).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Provider Z.AI" href="/id/providers/zai" icon="server">
    Konfigurasi provider Z.AI lengkap dan endpoint regional.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
</CardGroup>

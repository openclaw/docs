---
read_when:
    - Anda menginginkan model GLM di OpenClaw
    - Anda memerlukan konvensi penamaan model dan penyiapannya
summary: Ikhtisar keluarga model GLM + cara menggunakannya di OpenClaw
title: Model GLM
x-i18n:
    generated_at: "2026-04-05T14:03:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# Model GLM

GLM adalah **keluarga model** (bukan perusahaan) yang tersedia melalui platform Z.AI. Di OpenClaw, model
GLM diakses melalui provider `zai` dan ID model seperti `zai/glm-5`.

## Penyiapan CLI

```bash
# Penyiapan API key generik dengan deteksi endpoint otomatis
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, direkomendasikan untuk pengguna Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (wilayah China), direkomendasikan untuk pengguna Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# API umum
openclaw onboard --auth-choice zai-global

# API umum CN (wilayah China)
openclaw onboard --auth-choice zai-cn
```

## Cuplikan konfigurasi

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` memungkinkan OpenClaw mendeteksi endpoint Z.AI yang cocok dari key tersebut dan
menerapkan base URL yang benar secara otomatis. Gunakan pilihan regional eksplisit saat
Anda ingin memaksa permukaan Coding Plan atau API umum tertentu.

## Model GLM bawaan saat ini

OpenClaw saat ini mengisi provider `zai` bawaan dengan referensi GLM berikut:

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## Catatan

- Versi dan ketersediaan GLM dapat berubah; periksa dokumentasi Z.AI untuk yang terbaru.
- Referensi model bawaan default adalah `zai/glm-5`.
- Untuk detail provider, lihat [/providers/zai](/providers/zai).

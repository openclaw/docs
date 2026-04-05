---
read_when:
    - Anda ingin menggunakan model Z.AI / GLM di OpenClaw
    - Anda memerlukan penyiapan sederhana ZAI_API_KEY
summary: Gunakan Z.AI (model GLM) dengan OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-05T14:04:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48006cdd580484f0c62e2877b27a6a68d7bc44795b3e97a28213d95182d9acf9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI adalah platform API untuk model **GLM**. Platform ini menyediakan REST API untuk GLM dan menggunakan API key
untuk autentikasi. Buat API key Anda di konsol Z.AI. OpenClaw menggunakan provider `zai`
dengan API key Z.AI.

## Penyiapan CLI

```bash
# Penyiapan API key umum dengan deteksi endpoint otomatis
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, direkomendasikan untuk pengguna Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (region China), direkomendasikan untuk pengguna Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# API umum
openclaw onboard --auth-choice zai-global

# API umum CN (region China)
openclaw onboard --auth-choice zai-cn
```

## Cuplikan config

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` memungkinkan OpenClaw mendeteksi endpoint Z.AI yang cocok dari key tersebut dan
menerapkan base URL yang benar secara otomatis. Gunakan pilihan regional eksplisit ketika
Anda ingin memaksa permukaan Coding Plan atau API umum tertentu.

## Katalog GLM bawaan

Saat ini OpenClaw mengisi provider `zai` bawaan dengan:

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

- Model GLM tersedia sebagai `zai/<model>` (contoh: `zai/glm-5`).
- Referensi model bawaan default: `zai/glm-5`
- ID `glm-5*` yang tidak dikenal tetap di-resolve ke depan pada jalur provider bawaan dengan
  mensintesis metadata milik provider dari template `glm-4.7` ketika ID tersebut
  cocok dengan bentuk keluarga GLM-5 saat ini.
- `tool_stream` diaktifkan secara default untuk streaming tool-call Z.AI. Setel
  `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
- Lihat [/providers/glm](/providers/glm) untuk gambaran umum keluarga model.
- Z.AI menggunakan auth Bearer dengan API key Anda.

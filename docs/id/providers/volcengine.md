---
read_when:
    - Anda ingin menggunakan model Volcano Engine atau Doubao dengan OpenClaw
    - Anda memerlukan setup API key Volcengine
summary: Setup Volcano Engine (model Doubao, endpoint umum + coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-05T14:04:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85d9e737e906cd705fb31479d6b78d92b68c9218795ea9667516c1571dcaaf3a
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Provider Volcengine memberikan akses ke model Doubao dan model pihak ketiga
yang di-host di Volcano Engine, dengan endpoint terpisah untuk beban kerja umum dan coding.

- Provider: `volcengine` (umum) + `volcengine-plan` (coding)
- Auth: `VOLCANO_ENGINE_API_KEY`
- API: kompatibel dengan OpenAI

## Quick start

1. Setel API key:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Setel model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Provider dan endpoint

| Provider          | Endpoint                                  | Kasus penggunaan |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Model umum       |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Model coding     |

Kedua provider dikonfigurasi dari satu API key. Setup mendaftarkan keduanya
secara otomatis.

## Model yang tersedia

Provider umum (`volcengine`):

| Ref model                                    | Nama                            | Input       | Konteks |
| -------------------------------------------- | ------------------------------- | ----------- | ------- |
| `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
| `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
| `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
| `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
| `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |

Provider coding (`volcengine-plan`):

| Ref model                                         | Nama                     | Input | Konteks |
| ------------------------------------------------- | ------------------------ | ----- | ------- |
| `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
| `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
| `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
| `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
| `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
| `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |

`openclaw onboard --auth-choice volcengine-api-key` saat ini menetapkan
`volcengine-plan/ark-code-latest` sebagai model default sambil juga mendaftarkan
katalog umum `volcengine`.

Selama pemilihan model onboarding/configure, auth choice Volcengine memprioritaskan
baris `volcengine/*` dan `volcengine-plan/*`. Jika model tersebut belum
dimuat, OpenClaw akan fallback ke katalog yang tidak difilter alih-alih menampilkan picker
yang kosong dan dicakup provider.

## Catatan environment

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan
`VOLCANO_ENGINE_API_KEY` tersedia untuk proses tersebut (misalnya, di
`~/.openclaw/.env` atau melalui `env.shellEnv`).

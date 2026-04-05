---
read_when:
    - Anda ingin menggunakan Together AI dengan OpenClaw
    - Anda memerlukan env var kunci API atau pilihan auth CLI
summary: Penyiapan Together AI (auth + pemilihan model)
title: Together AI
x-i18n:
    generated_at: "2026-04-05T14:04:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22aacbaadf860ce8245bba921dcc5ede9da8fd6fa1bc3cc912551aecc1ba0d71
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) menyediakan akses ke model open-source terkemuka termasuk Llama, DeepSeek, Kimi, dan lainnya melalui API terpadu.

- Provider: `together`
- Auth: `TOGETHER_API_KEY`
- API: kompatibel dengan OpenAI
- Base URL: `https://api.together.xyz/v1`

## Mulai cepat

1. Setel kunci API (disarankan: simpan untuk Gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Tetapkan model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Ini akan menetapkan `together/moonshotai/Kimi-K2.5` sebagai model default.

## Catatan lingkungan

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `TOGETHER_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

## Katalog bawaan

OpenClaw saat ini mengirimkan katalog Together bawaan berikut:

| Model ref                                                    | Nama                                   | Input       | Konteks    | Catatan                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | ------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | teks, gambar | 262,144    | Model default; reasoning diaktifkan |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | teks        | 202,752    | Model teks tujuan umum          |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | teks        | 131,072    | Model instruksi cepat           |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | teks, gambar | 10,000,000 | Multimodal                      |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | teks, gambar | 20,000,000 | Multimodal                      |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | teks        | 131,072    | Model teks umum                 |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | teks        | 131,072    | Model reasoning                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | teks        | 262,144    | Model teks Kimi sekunder        |

Preset onboarding menetapkan `together/moonshotai/Kimi-K2.5` sebagai model default.

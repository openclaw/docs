---
read_when:
    - Anda ingin menggunakan model terbuka di OpenClaw secara gratis
    - Anda memerlukan penyiapan NVIDIA_API_KEY
summary: Gunakan API NVIDIA yang kompatibel dengan OpenAI di OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-08T02:17:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b00f8cedaf223a33ba9f6a6dd8cf066d88cebeea52d391b871e435026182228a
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA menyediakan API yang kompatibel dengan OpenAI di `https://integrate.api.nvidia.com/v1` untuk model terbuka secara gratis. Lakukan autentikasi dengan API key dari [build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Penyiapan CLI

Ekspor key sekali, lalu jalankan onboarding dan setel model NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
```

Jika Anda masih meneruskan `--token`, ingat bahwa nilainya akan masuk ke riwayat shell dan output `ps`; gunakan env var jika memungkinkan.

## Cuplikan config

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## ID model

| Referensi model                            | Nama                         | Konteks | Output maks |
| ------------------------------------------ | ---------------------------- | ------- | ----------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192       |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192       |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192       |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192       |

## Catatan

- Endpoint `/v1` yang kompatibel dengan OpenAI; gunakan API key dari [build.nvidia.com](https://build.nvidia.com/).
- Provider aktif otomatis saat `NVIDIA_API_KEY` disetel.
- Katalog bundel bersifat statis; biaya default-nya `0` di source.

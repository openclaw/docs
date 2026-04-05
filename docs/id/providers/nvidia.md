---
read_when:
    - Anda ingin menggunakan model NVIDIA di OpenClaw
    - Anda memerlukan penyiapan NVIDIA_API_KEY
summary: Gunakan API NVIDIA yang kompatibel dengan OpenAI di OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-05T14:03:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a24c5e46c0cf0fbc63bf09c772b486dd7f8f4b52e687d3b835bb54a1176b28da
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA menyediakan API yang kompatibel dengan OpenAI di `https://integrate.api.nvidia.com/v1` untuk model Nemotron dan NeMo. Lakukan autentikasi dengan API key dari [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## Penyiapan CLI

Ekspor key sekali, lalu jalankan onboarding dan tetapkan model NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Jika Anda masih memberikan `--token`, ingat bahwa itu akan masuk ke riwayat shell dan output `ps`; sebisa mungkin gunakan variabel environment.

## Cuplikan konfigurasi

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
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## ID model

| Model ref                                            | Name                                     | Context | Max output |
| ---------------------------------------------------- | ---------------------------------------- | ------- | ---------- |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`      | NVIDIA Llama 3.1 Nemotron 70B Instruct   | 131,072 | 4,096      |
| `nvidia/meta/llama-3.3-70b-instruct`                 | Meta Llama 3.3 70B Instruct              | 131,072 | 4,096      |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct` | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192   | 2,048      |

## Catatan

- Endpoint `/v1` yang kompatibel dengan OpenAI; gunakan API key dari NVIDIA NGC.
- Provider aktif otomatis saat `NVIDIA_API_KEY` ditetapkan.
- Katalog bawaan bersifat statis; biaya secara default bernilai `0` dalam source.

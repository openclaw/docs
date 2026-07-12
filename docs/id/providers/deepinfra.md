---
read_when:
    - Anda menginginkan satu kunci API untuk LLM sumber terbuka terbaik
    - Anda ingin menjalankan model melalui API DeepInfra di OpenClaw
summary: Gunakan API terpadu DeepInfra untuk mengakses model sumber terbuka dan model frontier terpopuler di OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T14:36:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra merutekan permintaan ke model sumber terbuka populer dan model terdepan melalui satu endpoint yang kompatibel dengan OpenAI dan satu kunci API. Sebagian besar SDK OpenAI dapat digunakan dengannya hanya dengan mengganti URL dasar.

## Instal Plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Dapatkan kunci API

1. Masuk di [deepinfra.com](https://deepinfra.com/)
2. Buka Dashboard / Keys dan buat kunci, atau gunakan kunci yang dibuat secara otomatis

## Penyiapan CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Atau tetapkan variabel lingkungan:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Cuplikan konfigurasi

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Permukaan yang didukung

Obrolan, pembuatan gambar, dan pembuatan video memperbarui katalog modelnya secara langsung dari `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` setelah `DEEPINFRA_API_KEY` dikonfigurasi. Permukaan lain menggunakan nilai default statis di bawah ini hingga beralih ke katalog langsung yang sama.

| Permukaan                  | Model default                                                                                         | Konfigurasi/alat OpenClaw                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Obrolan / penyedia model    | entri pertama bertanda obrolan dari katalog langsung (fallback statis `deepseek-ai/DeepSeek-V4-Flash`)           | `agents.defaults.model`                                  |
| Pembuatan/penyuntingan gambar | entri pertama bertanda `image-gen` dari katalog langsung (fallback statis `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Pemahaman media      | `moonshotai/Kimi-K2.5` untuk gambar                                                                     | pemahaman gambar masuk                              |
| Ucapan ke teks           | `openai/whisper-large-v3-turbo`                                                                       | transkripsi audio masuk                              |
| Teks ke ucapan           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Pembuatan video         | fallback statis `Pixverse/Pixverse-T2V` (saat ini tidak ada baris video-gen langsung dari DeepInfra)                 | `video_generate`, `agents.defaults.videoGenerationModel` |
| Sematan memori        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra juga menyediakan pemeringkatan ulang, klasifikasi, deteksi objek, dan jenis model native lainnya. OpenClaw belum memiliki kontrak penyedia untuk kategori tersebut, sehingga Plugin ini tidak mendaftarkannya.

## Model yang tersedia

OpenClaw menemukan model DeepInfra secara dinamis setelah kunci dikonfigurasi. Gunakan `/models deepinfra` atau `openclaw models list --provider deepinfra` untuk melihat daftar saat ini.

Model apa pun di [deepinfra.com](https://deepinfra.com/) dapat digunakan dengan prefiks `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...dan banyak lagi
```

## Catatan

- Referensi model menggunakan format `deepinfra/<provider>/<model>` (misalnya `deepinfra/Qwen/Qwen3-Max`).
- Model obrolan default: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL dasar: `https://api.deepinfra.com/v1/openai`
- Pembuatan video native menggunakan `https://api.deepinfra.com/v1/inference/<model>`.

## Terkait

- [Penyedia model](/id/concepts/model-providers)
- [Semua penyedia](/id/providers/index)

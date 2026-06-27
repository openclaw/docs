---
read_when:
    - Anda menginginkan satu kunci API untuk LLM sumber terbuka terbaik
    - Anda ingin menjalankan model melalui API DeepInfra di OpenClaw
summary: Gunakan API terpadu DeepInfra untuk mengakses model open source dan frontier paling populer di OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:03:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra menyediakan **API terpadu** yang merutekan permintaan ke model open source dan frontier paling populer di balik satu
endpoint dan kunci API. DeepInfra kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI dapat bekerja dengan mengganti URL dasar.

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Mendapatkan kunci API

1. Buka [https://deepinfra.com/](https://deepinfra.com/)
2. Masuk atau buat akun
3. Buka Dashboard / Keys dan buat kunci API baru atau gunakan kunci yang dibuat otomatis

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

## Permukaan OpenClaw yang didukung

Plugin mendaftarkan semua permukaan DeepInfra yang cocok dengan kontrak penyedia
OpenClaw saat ini. Chat, pembuatan gambar, dan pembuatan video
memperbarui katalog modelnya secara langsung dari `/v1/openai/models?sort_by=openclaw&filter=with_meta`
saat `DEEPINFRA_API_KEY` dikonfigurasi; permukaan lainnya menggunakan default statis
terkurasi di bawah ini.

| Permukaan                | Model default                                                                                         | Konfigurasi/alat OpenClaw                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / penyedia model    | entri pertama bertag chat dari katalog langsung (fallback manifes `deepseek-ai/DeepSeek-V4-Flash`)    | `agents.defaults.model`                                  |
| Pembuatan/penyuntingan gambar | entri pertama bertag `image-gen` dari katalog langsung (fallback statis `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Pemahaman media          | `moonshotai/Kimi-K2.5` untuk gambar                                                                   | pemahaman gambar masuk                                   |
| Ucapan-ke-teks           | `openai/whisper-large-v3-turbo`                                                                       | transkripsi audio masuk                                  |
| Teks-ke-ucapan           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Pembuatan video          | entri pertama bertag `video-gen` dari katalog langsung (fallback statis `Pixverse/Pixverse-T2V`)      | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embedding memori         | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra juga menyediakan pemeringkatan ulang, klasifikasi, deteksi objek, dan jenis
model native lainnya. OpenClaw saat ini belum memiliki kontrak penyedia kelas utama
untuk kategori tersebut, sehingga Plugin ini belum mendaftarkannya.

## Model yang tersedia

OpenClaw menemukan model DeepInfra yang tersedia secara dinamis saat startup. Gunakan
`/models deepinfra` untuk melihat daftar lengkap model yang tersedia.

Model apa pun yang tersedia di [DeepInfra.com](https://deepinfra.com/) dapat digunakan dengan prefiks `deepinfra/`:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## Catatan

- Referensi model adalah `deepinfra/<provider>/<model>` (misalnya, `deepinfra/Qwen/Qwen3-Max`).
- Model default: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL dasar: `https://api.deepinfra.com/v1/openai`
- Pembuatan video native menggunakan `https://api.deepinfra.com/v1/inference/<model>`.

## Terkait

- [Penyedia model](/id/concepts/model-providers)
- [Semua penyedia](/id/providers/index)

---
read_when:
    - Anda menginginkan satu kunci API untuk LLM sumber terbuka terkemuka
    - Anda ingin menjalankan model melalui API DeepInfra di OpenClaw
summary: Gunakan API terpadu DeepInfra untuk mengakses model sumber terbuka dan model terdepan paling populer di OpenClaw
x-i18n:
    generated_at: "2026-04-30T10:06:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra menyediakan **API terpadu** yang merutekan permintaan ke model sumber terbuka dan frontier paling populer di balik satu
endpoint dan kunci API. Ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI berfungsi dengan mengganti URL dasar.

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Antarmuka OpenClaw yang didukung

Plugin bawaan mendaftarkan semua antarmuka DeepInfra yang cocok dengan kontrak
penyedia OpenClaw saat ini:

| Antarmuka                | Model default                     | Konfigurasi/alat OpenClaw                              |
| ------------------------ | --------------------------------- | ------------------------------------------------------ |
| Chat / penyedia model    | `deepseek-ai/DeepSeek-V3.2`       | `agents.defaults.model`                                |
| Pembuatan/penyuntingan gambar | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Pemahaman media          | `moonshotai/Kimi-K2.5` untuk gambar | pemahaman gambar masuk                                 |
| Ucapan-ke-teks           | `openai/whisper-large-v3-turbo`   | transkripsi audio masuk                                |
| Teks-ke-ucapan           | `hexgrad/Kokoro-82M`              | `messages.tts.provider: "deepinfra"`                   |
| Pembuatan video          | `Pixverse/Pixverse-T2V`           | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embedding memori         | `BAAI/bge-m3`                     | `agents.defaults.memorySearch.provider: "deepinfra"`   |

DeepInfra juga menyediakan pemeringkatan ulang, klasifikasi, deteksi objek, dan jenis
model native lainnya. OpenClaw saat ini belum memiliki kontrak penyedia kelas utama
untuk kategori tersebut, sehingga Plugin ini belum mendaftarkannya.

## Model yang tersedia

OpenClaw menemukan model DeepInfra yang tersedia secara dinamis saat startup. Gunakan
`/models deepinfra` untuk melihat daftar lengkap model yang tersedia.

Model apa pun yang tersedia di [DeepInfra.com](https://deepinfra.com/) dapat digunakan dengan prefiks `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## Catatan

- Referensi model adalah `deepinfra/<provider>/<model>` (misalnya, `deepinfra/Qwen/Qwen3-Max`).
- Model default: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- URL dasar: `https://api.deepinfra.com/v1/openai`
- Pembuatan video native menggunakan `https://api.deepinfra.com/v1/inference/<model>`.

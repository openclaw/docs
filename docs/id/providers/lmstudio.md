---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model open source melalui LM Studio
    - Anda ingin menyiapkan dan mengonfigurasi LM Studio
summary: Jalankan OpenClaw dengan LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T09:23:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio adalah aplikasi yang ramah namun canggih untuk menjalankan model berbobot terbuka di perangkat keras Anda sendiri. Aplikasi ini memungkinkan Anda menjalankan model llama.cpp (GGUF) atau MLX (Apple Silicon). Tersedia dalam paket GUI atau daemon headless (`llmster`). Untuk dokumentasi produk dan penyiapan, lihat [lmstudio.ai](https://lmstudio.ai/).

## Memulai dengan cepat

1. Instal LM Studio (desktop) atau `llmster` (headless), lalu mulai server lokal:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Mulai server

Pastikan Anda memulai aplikasi desktop atau menjalankan daemon menggunakan perintah berikut:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Jika Anda menggunakan aplikasi, pastikan JIT diaktifkan untuk pengalaman yang lebih lancar. Pelajari lebih lanjut di [panduan JIT dan TTL LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw memerlukan nilai token LM Studio. Tetapkan `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jika autentikasi LM Studio dinonaktifkan, gunakan nilai token apa pun yang tidak kosong:

```bash
export LM_API_TOKEN="placeholder-key"
```

Untuk detail penyiapan autentikasi LM Studio, lihat [Autentikasi LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Jalankan onboarding dan pilih `LM Studio`:

```bash
openclaw onboard
```

5. Dalam onboarding, gunakan prompt `Default model` untuk memilih model LM Studio Anda.

Anda juga dapat menetapkan atau mengubahnya nanti:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Kunci model LM Studio mengikuti format `author/model-name` (misalnya `qwen/qwen3.5-9b`). Referensi model OpenClaw
menambahkan awalan nama provider: `lmstudio/qwen/qwen3.5-9b`. Anda dapat menemukan kunci yang tepat untuk
sebuah model dengan menjalankan `curl http://localhost:1234/api/v1/models` dan melihat field `key`.

## Onboarding non-interaktif

Gunakan onboarding non-interaktif saat Anda ingin membuat skrip penyiapan (CI, provisioning, bootstrap jarak jauh):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Atau tentukan URL dasar atau model dengan kunci API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` menggunakan kunci model sebagaimana dikembalikan oleh LM Studio (misalnya `qwen/qwen3.5-9b`), tanpa
awalan provider `lmstudio/`.

Onboarding non-interaktif memerlukan `--lmstudio-api-key` (atau `LM_API_TOKEN` di env).
Untuk server LM Studio tanpa autentikasi, nilai token apa pun yang tidak kosong akan berfungsi.

`--custom-api-key` tetap didukung untuk kompatibilitas, tetapi `--lmstudio-api-key` lebih disarankan untuk LM Studio.

Ini menulis `models.providers.lmstudio`, menetapkan model default ke
`lmstudio/<custom-model-id>`, dan menulis profil autentikasi `lmstudio:default`.

Penyiapan interaktif dapat meminta panjang konteks muat pilihan yang opsional dan menerapkannya ke seluruh model LM Studio yang ditemukan lalu disimpan ke konfigurasi.

## Konfigurasi

### Kompatibilitas penggunaan streaming

LM Studio kompatibel dengan penggunaan streaming. Saat tidak mengeluarkan objek `usage`
berbentuk OpenAI, OpenClaw memulihkan jumlah token dari metadata gaya llama.cpp
`timings.prompt_n` / `timings.predicted_n`.

Perilaku yang sama berlaku untuk backend lokal yang kompatibel dengan OpenAI berikut:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Konfigurasi eksplisit

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Pemecahan masalah

### LM Studio tidak terdeteksi

Pastikan LM Studio sedang berjalan dan Anda telah menetapkan `LM_API_TOKEN` (untuk server tanpa autentikasi, nilai token apa pun yang tidak kosong akan berfungsi):

```bash
# Mulai melalui aplikasi desktop, atau headless:
lms server start --port 1234
```

Verifikasi bahwa API dapat diakses:

```bash
curl http://localhost:1234/api/v1/models
```

### Kesalahan autentikasi (HTTP 401)

Jika penyiapan melaporkan HTTP 401, verifikasi kunci API Anda:

- Periksa bahwa `LM_API_TOKEN` cocok dengan kunci yang dikonfigurasi di LM Studio.
- Untuk detail penyiapan autentikasi LM Studio, lihat [Autentikasi LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jika server Anda tidak memerlukan autentikasi, gunakan nilai token apa pun yang tidak kosong untuk `LM_API_TOKEN`.

### Pemuatan model just-in-time

LM Studio mendukung pemuatan model just-in-time (JIT), yaitu model dimuat pada permintaan pertama. Pastikan ini diaktifkan untuk menghindari kesalahan 'Model not loaded'.

## Terkait

- [Pemilihan model](/id/concepts/model-providers)
- [Ollama](/id/providers/ollama)
- [Model lokal](/id/gateway/local-models)

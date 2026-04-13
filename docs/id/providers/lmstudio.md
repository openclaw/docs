---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model open source melalui LM Studio
    - Anda ingin menyiapkan dan mengonfigurasi LM Studio
summary: Jalankan OpenClaw dengan LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-13T08:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11264584e8277260d4215feb7c751329ce04f59e9228da1c58e147c21cd9ac2c
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio adalah aplikasi yang ramah namun andal untuk menjalankan model open-weight di perangkat keras Anda sendiri. Aplikasi ini memungkinkan Anda menjalankan model llama.cpp (GGUF) atau MLX (Apple Silicon). Tersedia dalam paket GUI atau daemon headless (`llmster`). Untuk dokumentasi produk dan penyiapan, lihat [lmstudio.ai](https://lmstudio.ai/).

## Mulai cepat

1. Instal LM Studio (desktop) atau `llmster` (headless), lalu jalankan server lokal:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Mulai server

Pastikan Anda menjalankan aplikasi desktop atau menjalankan daemon dengan perintah berikut:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Jika Anda menggunakan aplikasi, pastikan JIT diaktifkan agar pengalaman tetap lancar. Pelajari lebih lanjut di [panduan LM Studio JIT dan TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw memerlukan nilai token LM Studio. Atur `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jika autentikasi LM Studio dinonaktifkan, gunakan nilai token tidak kosong apa pun:

```bash
export LM_API_TOKEN="placeholder-key"
```

Untuk detail penyiapan autentikasi LM Studio, lihat [Autentikasi LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Jalankan onboarding dan pilih `LM Studio`:

```bash
openclaw onboard
```

5. Dalam onboarding, gunakan prompt `Default model` untuk memilih model LM Studio Anda.

Anda juga dapat mengatur atau mengubahnya nanti:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Kunci model LM Studio mengikuti format `author/model-name` (misalnya `qwen/qwen3.5-9b`). Ref model OpenClaw menambahkan nama penyedia di depan: `lmstudio/qwen/qwen3.5-9b`. Anda dapat menemukan kunci yang tepat untuk suatu model dengan menjalankan `curl http://localhost:1234/api/v1/models` dan melihat field `key`.

## Onboarding non-interaktif

Gunakan onboarding non-interaktif saat Anda ingin membuat penyiapan dalam bentuk skrip (CI, provisioning, bootstrap jarak jauh):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Atau tentukan base URL atau model dengan API key:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` menerima kunci model seperti yang dikembalikan oleh LM Studio (misalnya `qwen/qwen3.5-9b`), tanpa prefiks penyedia `lmstudio/`.

Onboarding non-interaktif memerlukan `--lmstudio-api-key` (atau `LM_API_TOKEN` di env).
Untuk server LM Studio tanpa autentikasi, nilai token tidak kosong apa pun akan berfungsi.

`--custom-api-key` tetap didukung demi kompatibilitas, tetapi `--lmstudio-api-key` lebih disarankan untuk LM Studio.

Ini akan menulis `models.providers.lmstudio`, mengatur model default ke
`lmstudio/<custom-model-id>`, dan menulis profil auth `lmstudio:default`.

Penyiapan interaktif dapat meminta panjang konteks pemuatan pilihan yang opsional dan menerapkannya ke seluruh model LM Studio yang ditemukan lalu disimpan ke config.

## Konfigurasi

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

Pastikan LM Studio sedang berjalan dan Anda telah menetapkan `LM_API_TOKEN` (untuk server tanpa autentikasi, nilai token tidak kosong apa pun akan berfungsi):

```bash
# Mulai melalui aplikasi desktop, atau headless:
lms server start --port 1234
```

Verifikasi bahwa API dapat diakses:

```bash
curl http://localhost:1234/api/v1/models
```

### Kesalahan autentikasi (HTTP 401)

Jika penyiapan melaporkan HTTP 401, verifikasi API key Anda:

- Periksa bahwa `LM_API_TOKEN` cocok dengan key yang dikonfigurasi di LM Studio.
- Untuk detail penyiapan auth LM Studio, lihat [Autentikasi LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jika server Anda tidak memerlukan autentikasi, gunakan nilai token tidak kosong apa pun untuk `LM_API_TOKEN`.

### Pemuatan model just-in-time

LM Studio mendukung pemuatan model just-in-time (JIT), yaitu model dimuat pada permintaan pertama. Pastikan fitur ini diaktifkan untuk menghindari kesalahan 'Model not loaded'.

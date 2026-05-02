---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model sumber terbuka melalui LM Studio
    - Anda ingin menyiapkan dan mengonfigurasi LM Studio
summary: Menjalankan OpenClaw dengan LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T09:29:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio adalah aplikasi yang ramah pengguna sekaligus andal untuk menjalankan model open-weight di perangkat keras Anda sendiri. Aplikasi ini memungkinkan Anda menjalankan model llama.cpp (GGUF) atau MLX (Apple Silicon). Tersedia dalam paket GUI atau daemon headless (`llmster`). Untuk dokumentasi produk dan penyiapan, lihat [lmstudio.ai](https://lmstudio.ai/).

## Mulai cepat

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

Jika Anda menggunakan aplikasi, pastikan JIT diaktifkan untuk pengalaman yang lancar. Pelajari selengkapnya di [panduan JIT dan TTL LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Jika autentikasi LM Studio diaktifkan, atur `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jika autentikasi LM Studio dinonaktifkan, Anda dapat membiarkan kunci API kosong selama penyiapan interaktif OpenClaw.

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

Kunci model LM Studio mengikuti format `author/model-name` (misalnya `qwen/qwen3.5-9b`). Ref model OpenClaw
menambahkan nama penyedia di depan: `lmstudio/qwen/qwen3.5-9b`. Anda dapat menemukan kunci persis untuk
sebuah model dengan menjalankan `curl http://localhost:1234/api/v1/models` dan melihat field `key`.

## Onboarding non-interaktif

Gunakan onboarding non-interaktif saat Anda ingin membuat skrip penyiapan (CI, provisioning, bootstrap jarak jauh):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Atau tentukan URL dasar, model, dan kunci API opsional:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` menerima kunci model seperti yang dikembalikan oleh LM Studio (misalnya `qwen/qwen3.5-9b`), tanpa
prefiks penyedia `lmstudio/`.

Untuk server LM Studio yang diautentikasi, teruskan `--lmstudio-api-key` atau atur `LM_API_TOKEN`.
Untuk server LM Studio tanpa autentikasi, hilangkan kunci; OpenClaw menyimpan penanda lokal non-rahasia.

`--custom-api-key` tetap didukung untuk kompatibilitas, tetapi `--lmstudio-api-key` lebih disarankan untuk LM Studio.

Ini menulis `models.providers.lmstudio` dan mengatur model default ke
`lmstudio/<custom-model-id>`. Saat Anda memberikan kunci API, penyiapan juga menulis profil autentikasi
`lmstudio:default`.

Penyiapan interaktif dapat meminta panjang konteks muat pilihan opsional dan menerapkannya ke semua model LM Studio yang ditemukan yang disimpan ke konfigurasi.
Konfigurasi Plugin LM Studio mempercayai endpoint LM Studio yang dikonfigurasi untuk permintaan model, termasuk host loopback, LAN, dan tailnet. Anda dapat menonaktifkannya dengan mengatur `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Konfigurasi

### Kompatibilitas penggunaan streaming

LM Studio kompatibel dengan penggunaan streaming. Saat tidak memancarkan objek
`usage` berbentuk OpenAI, OpenClaw memulihkan hitungan token dari metadata bergaya llama.cpp
`timings.prompt_n` / `timings.predicted_n` sebagai gantinya.

Perilaku penggunaan streaming yang sama berlaku untuk backend lokal kompatibel OpenAI berikut:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Kompatibilitas thinking

Saat penemuan `/api/v1/models` LM Studio melaporkan opsi reasoning khusus model,
OpenClaw mempertahankan nilai native tersebut dalam metadata kompatibilitas model. Untuk
model thinking biner yang mengiklankan `allowed_options: ["off", "on"]`,
OpenClaw memetakan thinking yang dinonaktifkan ke `off` dan level `/think` yang diaktifkan ke `on`
alih-alih mengirim nilai khusus OpenAI seperti `low` atau `medium`.

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

Pastikan LM Studio berjalan. Jika autentikasi diaktifkan, atur juga `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
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
- Jika server Anda tidak memerlukan autentikasi, biarkan kunci kosong selama penyiapan.

### Pemuatan model just-in-time

LM Studio mendukung pemuatan model just-in-time (JIT), yaitu model dimuat pada permintaan pertama. OpenClaw melakukan pramuat model melalui endpoint muat native LM Studio secara default, yang membantu saat JIT dinonaktifkan. Agar JIT, TTL idle, dan perilaku auto-evict LM Studio mengelola siklus hidup model, nonaktifkan langkah pramuat OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### Host LAN atau tailnet LM Studio

Gunakan alamat host LM Studio yang dapat dijangkau, pertahankan `/v1`, dan pastikan LM Studio diikat di luar loopback pada mesin tersebut:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

Tidak seperti penyedia kompatibel OpenAI generik, `lmstudio` otomatis mempercayai endpoint lokal/pribadi yang dikonfigurasi untuk permintaan model yang dijaga. ID penyedia loopback kustom seperti `localhost` atau `127.0.0.1` juga otomatis dipercaya; untuk ID penyedia kustom LAN, tailnet, atau DNS pribadi, atur `models.providers.<id>.request.allowPrivateNetwork: true` secara eksplisit.

## Terkait

- [Pemilihan model](/id/concepts/model-providers)
- [Ollama](/id/providers/ollama)
- [Model lokal](/id/gateway/local-models)

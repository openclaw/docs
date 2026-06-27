---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model sumber terbuka melalui LM Studio
    - Anda ingin menyiapkan dan mengonfigurasi LM Studio
summary: Jalankan OpenClaw dengan LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-06-27T18:05:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio adalah aplikasi yang ramah pengguna sekaligus kuat untuk menjalankan model open-weight di perangkat keras Anda sendiri. Aplikasi ini memungkinkan Anda menjalankan model llama.cpp (GGUF) atau MLX (Apple Silicon). Tersedia dalam paket GUI atau daemon headless (`llmster`). Untuk dokumentasi produk dan penyiapan, lihat [lmstudio.ai](https://lmstudio.ai/).

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
sebuah model dengan menjalankan `curl http://localhost:1234/api/v1/models` dan melihat bidang `key`.

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
Untuk server LM Studio yang tidak diautentikasi, hilangkan kunci; OpenClaw menyimpan penanda lokal non-rahasia.

`--custom-api-key` tetap didukung untuk kompatibilitas, tetapi `--lmstudio-api-key` lebih disarankan untuk LM Studio.

Ini menulis `models.providers.lmstudio` dan mengatur model default ke
`lmstudio/<custom-model-id>`. Saat Anda memberikan kunci API, penyiapan juga menulis profil auth
`lmstudio:default`.

Penyiapan interaktif dapat meminta panjang konteks muat pilihan opsional dan menerapkannya ke seluruh model LM Studio yang ditemukan dan disimpan ke konfigurasi.
Konfigurasi Plugin LM Studio memercayai endpoint LM Studio yang dikonfigurasi untuk permintaan model, termasuk host loopback, LAN, dan tailnet. Origin metadata/link-local masih memerlukan opt-in eksplisit. Anda dapat opt out dengan mengatur `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Konfigurasi

### Kompatibilitas penggunaan streaming

LM Studio kompatibel dengan penggunaan streaming. Saat tidak memancarkan objek
`usage` berbentuk OpenAI, OpenClaw memulihkan hitungan token dari metadata bergaya llama.cpp
`timings.prompt_n` / `timings.predicted_n` sebagai gantinya.

Perilaku penggunaan streaming yang sama berlaku untuk backend lokal yang kompatibel dengan OpenAI berikut:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Kompatibilitas penalaran

Saat penemuan `/api/v1/models` LM Studio melaporkan opsi penalaran khusus model,
OpenClaw mengekspos nilai `reasoning_effort` kompatibel OpenAI yang cocok
dalam metadata kompat model. Build LM Studio saat ini dapat mengiklankan opsi UI
biner seperti `allowed_options: ["off", "on"]` sambil menolak nilai tersebut
pada `/v1/chat/completions`; OpenClaw menormalkan bentuk penemuan biner itu menjadi
`none`, `minimal`, `low`, `medium`, `high`, dan `xhigh` sebelum mengirim permintaan.
Konfigurasi LM Studio lama yang tersimpan dan berisi peta penalaran `off`/`on`
dinormalkan dengan cara yang sama saat katalog dimuat.

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
- Untuk detail penyiapan auth LM Studio, lihat [Autentikasi LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jika server Anda tidak memerlukan autentikasi, biarkan kunci kosong selama penyiapan.

### Pemuatan model tepat waktu

LM Studio mendukung pemuatan model tepat waktu (JIT), yaitu model dimuat pada permintaan pertama. OpenClaw secara default melakukan pramuat model melalui endpoint muat native LM Studio, yang membantu saat JIT dinonaktifkan. Agar JIT, TTL saat menganggur, dan perilaku pengeluaran otomatis LM Studio mengelola siklus hidup model, nonaktifkan langkah pramuat OpenClaw:

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

### Host LM Studio LAN atau tailnet

Gunakan alamat host LM Studio yang dapat dijangkau, pertahankan `/v1`, dan pastikan LM Studio diikat lebih dari loopback pada mesin tersebut:

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

`lmstudio` secara otomatis memercayai endpoint lokal/pribadi yang dikonfigurasi untuk permintaan model yang dilindungi. Entri penyedia khusus/lokal yang kompatibel dengan OpenAI juga memercayai origin `baseUrl` persis yang dikonfigurasi, kecuali origin metadata/link-local; permintaan ke port atau tujuan pribadi yang berbeda tetap memerlukan `models.providers.<id>.request.allowPrivateNetwork: true`. Atur `models.providers.<id>.request.allowPrivateNetwork: false` untuk opt out dari kepercayaan origin persis.

## Terkait

- [Pemilihan model](/id/concepts/model-providers)
- [Ollama](/id/providers/ollama)
- [Model lokal](/id/gateway/local-models)

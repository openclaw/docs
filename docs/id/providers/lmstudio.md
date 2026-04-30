---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model sumber terbuka melalui LM Studio
    - Anda ingin menyiapkan dan mengonfigurasi LM Studio
summary: Jalankan OpenClaw dengan LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T10:07:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio adalah aplikasi yang ramah pengguna sekaligus kuat untuk menjalankan model open-weight di perangkat keras Anda sendiri. Aplikasi ini memungkinkan Anda menjalankan model llama.cpp (GGUF) atau MLX (Apple Silicon). Tersedia sebagai paket GUI atau daemon headless (`llmster`). Untuk dokumentasi produk dan penyiapan, lihat [lmstudio.ai](https://lmstudio.ai/).

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

Jika Anda menggunakan aplikasi, pastikan JIT diaktifkan untuk pengalaman yang mulus. Pelajari selengkapnya di [panduan LM Studio JIT dan TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Jika autentikasi LM Studio diaktifkan, tetapkan `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jika autentikasi LM Studio dinonaktifkan, Anda dapat membiarkan kunci API kosong selama penyiapan OpenClaw interaktif.

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

Kunci model LM Studio mengikuti format `author/model-name` (mis. `qwen/qwen3.5-9b`). Ref model OpenClaw menambahkan nama penyedia di depan: `lmstudio/qwen/qwen3.5-9b`. Anda dapat menemukan kunci persis untuk sebuah model dengan menjalankan `curl http://localhost:1234/api/v1/models` dan melihat bidang `key`.

## Onboarding non-interaktif

Gunakan onboarding non-interaktif ketika Anda ingin membuat skrip penyiapan (CI, provisioning, bootstrap jarak jauh):

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

`--custom-model-id` menerima kunci model seperti yang dikembalikan oleh LM Studio (mis. `qwen/qwen3.5-9b`), tanpa prefiks penyedia `lmstudio/`.

Untuk server LM Studio yang diautentikasi, berikan `--lmstudio-api-key` atau tetapkan `LM_API_TOKEN`.
Untuk server LM Studio tanpa autentikasi, hilangkan kuncinya; OpenClaw menyimpan penanda lokal non-rahasia.

`--custom-api-key` tetap didukung untuk kompatibilitas, tetapi `--lmstudio-api-key` lebih disarankan untuk LM Studio.

Ini menulis `models.providers.lmstudio` dan menetapkan model default ke `lmstudio/<custom-model-id>`. Ketika Anda memberikan kunci API, penyiapan juga menulis profil auth `lmstudio:default`.

Penyiapan interaktif dapat meminta panjang konteks pemuatan pilihan yang opsional dan menerapkannya ke semua model LM Studio yang ditemukan yang disimpannya ke konfigurasi.
Konfigurasi Plugin LM Studio memercayai endpoint LM Studio yang dikonfigurasi untuk permintaan model, termasuk loopback, LAN, dan host tailnet. Anda dapat memilih keluar dengan menetapkan `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Konfigurasi

### Kompatibilitas penggunaan streaming

LM Studio kompatibel dengan penggunaan streaming. Ketika tidak memancarkan objek `usage` berbentuk OpenAI, OpenClaw memulihkan jumlah token dari metadata bergaya llama.cpp `timings.prompt_n` / `timings.predicted_n` sebagai gantinya.

Perilaku penggunaan streaming yang sama berlaku untuk backend lokal kompatibel OpenAI berikut:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Kompatibilitas thinking

Ketika penemuan `/api/v1/models` LM Studio melaporkan opsi reasoning khusus model, OpenClaw mempertahankan nilai native tersebut dalam metadata compat model. Untuk model thinking biner yang mengiklankan `allowed_options: ["off", "on"]`, OpenClaw memetakan thinking yang dinonaktifkan ke `off` dan level `/think` yang diaktifkan ke `on`, alih-alih mengirim nilai khusus OpenAI seperti `low` atau `medium`.

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

Pastikan LM Studio sedang berjalan. Jika autentikasi diaktifkan, tetapkan juga `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Verifikasi API dapat diakses:

```bash
curl http://localhost:1234/api/v1/models
```

### Kesalahan autentikasi (HTTP 401)

Jika penyiapan melaporkan HTTP 401, verifikasi kunci API Anda:

- Periksa bahwa `LM_API_TOKEN` cocok dengan kunci yang dikonfigurasi di LM Studio.
- Untuk detail penyiapan autentikasi LM Studio, lihat [Autentikasi LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jika server Anda tidak memerlukan autentikasi, biarkan kunci kosong selama penyiapan.

### Pemuatan model just-in-time

LM Studio mendukung pemuatan model just-in-time (JIT), ketika model dimuat pada permintaan pertama. Pastikan ini diaktifkan untuk menghindari kesalahan 'Model not loaded'.

### Host LM Studio LAN atau tailnet

Gunakan alamat host LM Studio yang dapat dijangkau, pertahankan `/v1`, dan pastikan LM Studio diikat melampaui loopback pada mesin tersebut:

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

Tidak seperti penyedia generik kompatibel OpenAI, `lmstudio` secara otomatis memercayai endpoint lokal/privat yang dikonfigurasi untuk permintaan model yang dilindungi. ID penyedia loopback kustom seperti `localhost` atau `127.0.0.1` juga dipercaya secara otomatis; untuk ID penyedia kustom LAN, tailnet, atau DNS privat, tetapkan `models.providers.<id>.request.allowPrivateNetwork: true` secara eksplisit.

## Terkait

- [Pemilihan model](/id/concepts/model-providers)
- [Ollama](/id/providers/ollama)
- [Model lokal](/id/gateway/local-models)

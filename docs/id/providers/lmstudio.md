---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model sumber terbuka melalui LM Studio
    - Anda ingin menyiapkan dan mengonfigurasi LM Studio
summary: Jalankan OpenClaw dengan LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-21T12:36:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f43b4d04aad6e5edfdf224747083834ebd441aa7f91ccbf2d61de990443fc414
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio menjalankan model llama.cpp (GGUF) atau MLX secara lokal, sebagai aplikasi GUI atau daemon `llmster`
tanpa antarmuka. Untuk dokumentasi instalasi dan produk, lihat [lmstudio.ai](https://lmstudio.ai/).

## Mulai cepat

<Steps>
  <Step title="Instal dan mulai server">
    Instal LM Studio (desktop) atau `llmster` (tanpa antarmuka), lalu mulai server:

    ```bash
    lms server start --port 1234
    ```

    Atau jalankan daemon tanpa antarmuka:

    ```bash
    lms daemon up
    ```

    Jika menggunakan aplikasi desktop, aktifkan JIT agar pemuatan model berjalan lancar; lihat
    [panduan JIT dan TTL LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Tetapkan kunci API jika autentikasi diaktifkan">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Jika autentikasi LM Studio dinonaktifkan, biarkan kunci API kosong selama penyiapan. Lihat
    [Autentikasi LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Jalankan orientasi awal">
    ```bash
    openclaw onboard
    ```

    Pilih `LM Studio`, lalu pilih model pada prompt `Default model`.

    Pada penyiapan terpandu baru, OpenClaw terlebih dahulu melakukan kueri ke `/api/v1/models` pada
    host LM Studio bawaan atau yang dikonfigurasi. LLM yang sudah ada ditawarkan secara otomatis
    hanya ketika LM Studio melaporkan pelatihan penggunaan alat dan setidaknya 16K konteks
    efektif. Untuk model yang dimuat, konteks instans yang dimuat lebih diutamakan daripada
    nilai maksimum lebih besar yang diumumkan. Urutan penyiapan CLI/macOS yang sama memverifikasi
    rute dengan penyelesaian nyata sebelum menyimpannya. Pemeriksaan otomatis tidak pernah
    mengunduh model dan mengabaikan entri katalog khusus embedding.

  </Step>
</Steps>

Ubah model bawaan nanti:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Kunci model LM Studio menggunakan format `author/model-name` (misalnya `qwen/qwen3.5-9b`); referensi model OpenClaw
menambahkan penyedia di awal: `lmstudio/qwen/qwen3.5-9b`. Temukan kunci yang tepat untuk suatu model dengan menjalankan
perintah berikut dan melihat bidang `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Orientasi awal noninteraktif

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Atau tentukan URL dasar, model, dan kunci API secara eksplisit:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` menerima kunci model sebagaimana dikembalikan oleh LM Studio (misalnya `qwen/qwen3.5-9b`), tanpa
prefiks penyedia `lmstudio/`. Teruskan `--lmstudio-api-key` (atau tetapkan `LM_API_TOKEN`) untuk server yang
diautentikasi; hilangkan untuk server tanpa autentikasi, dan OpenClaw akan menyimpan penanda lokal nonrahasia sebagai gantinya.
`--custom-api-key` masih diterima untuk kompatibilitas, tetapi `--lmstudio-api-key` lebih disarankan.

Tindakan ini menulis `models.providers.lmstudio` dan menetapkan model bawaan ke `lmstudio/<custom-model-id>`.
Memberikan kunci API juga menulis profil autentikasi `lmstudio:default`.

Penyiapan interaktif juga dapat meminta panjang konteks pemuatan yang diinginkan dan menerapkannya ke seluruh
model yang ditemukan serta disimpan ke konfigurasi.

## Konfigurasi

### Kompatibilitas penggunaan streaming

LM Studio tidak selalu memancarkan objek `usage` berbentuk OpenAI pada respons streaming. OpenClaw
memulihkan jumlah token dari metadata bergaya llama.cpp `timings.prompt_n` / `timings.predicted_n`
sebagai gantinya. Setiap endpoint yang kompatibel dengan OpenAI dan diidentifikasi sebagai endpoint lokal (host loopback) mendapatkan
fallback yang sama, yang mencakup backend lokal lain seperti vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI,
dan text-generation-webui.

### Kompatibilitas pemikiran

Ketika penemuan `/api/v1/models` LM Studio melaporkan opsi penalaran khusus model, OpenClaw
menampilkan nilai `reasoning_effort` yang sesuai (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) dalam
metadata kompatibilitas model. Beberapa build LM Studio mengumumkan opsi UI biner (`allowed_options: ["off",
"on"]`) tetapi menolak nilai literal tersebut pada `/v1/chat/completions`; OpenClaw menormalkan
bentuk biner itu menjadi skala enam tingkat sebelum mengirim permintaan, termasuk untuk konfigurasi tersimpan lama yang
masih memiliki peta penalaran `off`/`on`.

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

### Menonaktifkan pramuat

LM Studio mendukung pemuatan model just-in-time (JIT), yaitu memuat model pada permintaan pertama. Secara bawaan, OpenClaw
melakukan pramuat model melalui endpoint pemuatan native LM Studio, yang membantu ketika JIT
dinonaktifkan. Agar JIT, TTL saat tidak aktif, dan perilaku pengeluaran otomatis LM Studio mengelola siklus hidup model,
nonaktifkan langkah pramuat OpenClaw:

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

### Host LAN atau tailnet

Gunakan alamat host LM Studio yang dapat dijangkau, pertahankan `/v1`, dan pastikan LM Studio terikat di luar
loopback pada mesin tersebut:

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

`lmstudio` secara otomatis memercayai endpoint yang dikonfigurasi untuk permintaan model, termasuk host loopback,
LAN, dan tailnet (kecuali asal metadata/link-local). Setiap entri penyedia kustom/lokal yang kompatibel dengan OpenAI
mendapatkan kepercayaan asal-persis yang sama. Permintaan ke host atau port privat lain tetap
memerlukan `models.providers.<id>.request.allowPrivateNetwork: true`; tetapkan ke `false` untuk menonaktifkan
kepercayaan bawaan.

## Pemecahan masalah

### LM Studio tidak terdeteksi

Pastikan LM Studio sedang berjalan:

```bash
lms server start --port 1234
```

Jika autentikasi diaktifkan, tetapkan juga `LM_API_TOKEN`. Verifikasi bahwa API dapat dijangkau:

```bash
curl http://localhost:1234/api/v1/models
```

### Kesalahan autentikasi (HTTP 401)

- Pastikan `LM_API_TOKEN` cocok dengan kunci yang dikonfigurasi di LM Studio.
- Lihat [Autentikasi LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jika server tidak memerlukan autentikasi, biarkan kunci kosong selama penyiapan.

## Terkait

- [Pemilihan model](/id/concepts/model-providers)
- [Ollama](/id/providers/ollama)
- [Model lokal](/id/gateway/local-models)

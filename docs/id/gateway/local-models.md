---
read_when:
    - Anda ingin menyajikan model dari box GPU Anda sendiri
    - Anda sedang menghubungkan LM Studio atau proxy yang kompatibel dengan OpenAI
    - Anda memerlukan panduan model lokal yang paling aman
summary: Jalankan OpenClaw pada LLM lokal (LM Studio, vLLM, LiteLLM, endpoint OpenAI kustom)
title: Model Lokal
x-i18n:
    generated_at: "2026-04-08T02:14:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d619d72b0e06914ebacb7e9f38b746caf1b9ce8908c9c6638c3acdddbaa025e8
    source_path: gateway/local-models.md
    workflow: 15
---

# Model lokal

Lokal itu memungkinkan, tetapi OpenClaw mengharapkan konteks besar + pertahanan kuat terhadap injeksi prompt. Kartu kecil memotong konteks dan membocorkan safety. Targetkan tinggi: **≥2 Mac Studio yang dimaksimalkan atau rig GPU setara (~$30k+)**. Satu GPU **24 GB** hanya cocok untuk prompt yang lebih ringan dengan latensi lebih tinggi. Gunakan **varian model terbesar / ukuran penuh yang dapat Anda jalankan**; checkpoint yang dikuantisasi secara agresif atau “small” meningkatkan risiko injeksi prompt (lihat [Security](/id/gateway/security)).

Jika Anda menginginkan penyiapan lokal dengan friksi paling rendah, mulai dengan [Ollama](/id/providers/ollama) dan `openclaw onboard`. Halaman ini adalah panduan yang bersifat opinatif untuk stack lokal kelas atas dan server lokal kustom yang kompatibel dengan OpenAI.

## Direkomendasikan: LM Studio + model lokal besar (Responses API)

Stack lokal terbaik saat ini. Muat model besar di LM Studio (misalnya build Qwen, DeepSeek, atau Llama ukuran penuh), aktifkan server lokal (default `http://127.0.0.1:1234`), dan gunakan Responses API agar reasoning tetap terpisah dari teks akhir.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Checklist penyiapan**

- Instal LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Di LM Studio, unduh **build model terbesar yang tersedia** (hindari varian “small”/yang sangat dikuantisasi), mulai server, pastikan `http://127.0.0.1:1234/v1/models` mencantumkannya.
- Ganti `my-local-model` dengan ID model sebenarnya yang ditampilkan di LM Studio.
- Biarkan model tetap dimuat; cold-load menambah latensi startup.
- Sesuaikan `contextWindow`/`maxTokens` jika build LM Studio Anda berbeda.
- Untuk WhatsApp, tetap gunakan Responses API agar hanya teks akhir yang dikirim.

Tetap konfigurasikan model yang dihosting bahkan saat menjalankan model lokal; gunakan `models.mode: "merge"` agar fallback tetap tersedia.

### Config hibrida: primary yang dihosting, fallback lokal

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Lokal lebih dulu dengan jaring pengaman hosting

Tukar urutan primary dan fallback; pertahankan blok provider yang sama dan `models.mode: "merge"` agar Anda dapat fallback ke Sonnet atau Opus saat box lokal sedang tidak aktif.

### Hosting regional / perutean data

- Varian MiniMax/Kimi/GLM yang dihosting juga tersedia di OpenRouter dengan endpoint yang dipatok ke wilayah tertentu (misalnya dihosting di AS). Pilih varian regional di sana agar lalu lintas tetap berada di yurisdiksi pilihan Anda sambil tetap menggunakan `models.mode: "merge"` untuk fallback Anthropic/OpenAI.
- Hanya lokal tetap menjadi jalur privasi terkuat; perutean regional yang dihosting adalah jalan tengah saat Anda membutuhkan fitur penyedia tetapi tetap ingin mengendalikan aliran data.

## Proxy lokal lain yang kompatibel dengan OpenAI

vLLM, LiteLLM, OAI-proxy, atau gateway kustom dapat digunakan jika mereka mengekspos endpoint `/v1` bergaya OpenAI. Ganti blok provider di atas dengan endpoint dan ID model Anda:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Pertahankan `models.mode: "merge"` agar model yang dihosting tetap tersedia sebagai fallback.

Catatan perilaku untuk backend `/v1` lokal/berbasis proxy:

- OpenClaw memperlakukan ini sebagai rute kompatibel OpenAI bergaya proxy, bukan
  endpoint OpenAI native
- pembentukan permintaan khusus OpenAI native tidak berlaku di sini: tidak ada
  `service_tier`, tidak ada Responses `store`, tidak ada pembentukan payload kompatibilitas reasoning OpenAI,
  dan tidak ada petunjuk cache prompt
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
  tidak disuntikkan pada URL proxy kustom ini

Catatan kompatibilitas untuk backend kompatibel OpenAI yang lebih ketat:

- Beberapa server hanya menerima `messages[].content` berbentuk string pada Chat Completions, bukan
  array part konten terstruktur. Atur
  `models.providers.<provider>.models[].compat.requiresStringContent: true` untuk
  endpoint tersebut.
- Beberapa backend lokal yang lebih kecil atau lebih ketat tidak stabil dengan bentuk prompt runtime agen
  penuh dari OpenClaw, terutama saat skema alat disertakan. Jika
  backend berfungsi untuk panggilan langsung `/v1/chat/completions` kecil tetapi gagal pada giliran agen OpenClaw
  normal, coba
  `models.providers.<provider>.models[].compat.supportsTools: false` terlebih dahulu.
- Jika backend masih gagal hanya pada eksekusi OpenClaw yang lebih besar, masalah yang tersisa
  biasanya adalah kapasitas model/server upstream atau bug backend, bukan lapisan
  transport OpenClaw.

## Pemecahan masalah

- Gateway dapat menjangkau proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio ter-unload? Muat ulang; cold start adalah penyebab umum “menggantung”.
- Error konteks? Turunkan `contextWindow` atau naikkan batas server Anda.
- Server yang kompatibel dengan OpenAI mengembalikan `messages[].content ... expected a string`?
  Tambahkan `compat.requiresStringContent: true` pada entri model tersebut.
- Panggilan langsung `/v1/chat/completions` kecil berhasil, tetapi `openclaw infer model run`
  gagal pada Gemma atau model lokal lain? Nonaktifkan skema alat terlebih dahulu dengan
  `compat.supportsTools: false`, lalu uji lagi. Jika server masih crash hanya
  pada prompt OpenClaw yang lebih besar, anggap ini sebagai keterbatasan server/model upstream.
- Safety: model lokal melewati filter sisi penyedia; batasi agen secara sempit dan biarkan compaction aktif untuk membatasi blast radius injeksi prompt.

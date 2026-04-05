---
read_when:
    - Anda ingin menyajikan model dari mesin GPU Anda sendiri
    - Anda sedang menghubungkan LM Studio atau proxy yang kompatibel dengan OpenAI
    - Anda memerlukan panduan model lokal yang paling aman
summary: Menjalankan OpenClaw pada LLM lokal (LM Studio, vLLM, LiteLLM, endpoint OpenAI kustom)
title: Model Lokal
x-i18n:
    generated_at: "2026-04-05T13:53:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# Model Lokal

Lokal bisa dilakukan, tetapi OpenClaw mengharapkan konteks besar + pertahanan yang kuat terhadap prompt injection. Kartu kecil memotong konteks dan melemahkan keamanan. Targetkan spesifikasi tinggi: **≥2 Mac Studio maksimum atau rig GPU setara (~$30k+)**. Satu GPU **24 GB** hanya cocok untuk prompt yang lebih ringan dengan latensi lebih tinggi. Gunakan **varian model terbesar / ukuran penuh yang dapat Anda jalankan**; checkpoint yang sangat dikuantisasi atau “kecil” meningkatkan risiko prompt injection (lihat [Security](/gateway/security)).

Jika Anda menginginkan penyiapan lokal dengan friksi paling rendah, mulai dengan [Ollama](/providers/ollama) dan `openclaw onboard`. Halaman ini adalah panduan bernuansa opini untuk stack lokal kelas atas dan server lokal kustom yang kompatibel dengan OpenAI.

## Direkomendasikan: LM Studio + model lokal besar (Responses API)

Stack lokal terbaik saat ini. Muat model besar di LM Studio (misalnya, build Qwen, DeepSeek, atau Llama ukuran penuh), aktifkan server lokal (default `http://127.0.0.1:1234`), dan gunakan Responses API agar reasoning tetap terpisah dari teks akhir.

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

**Daftar periksa penyiapan**

- Instal LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Di LM Studio, unduh **build model terbesar yang tersedia** (hindari varian “small”/yang sangat dikuantisasi), mulai server, lalu pastikan `http://127.0.0.1:1234/v1/models` menampilkannya.
- Ganti `my-local-model` dengan ID model sebenarnya yang ditampilkan di LM Studio.
- Biarkan model tetap dimuat; cold-load menambah latensi startup.
- Sesuaikan `contextWindow`/`maxTokens` jika build LM Studio Anda berbeda.
- Untuk WhatsApp, tetap gunakan Responses API agar hanya teks akhir yang dikirim.

Tetap konfigurasikan model yang di-host bahkan saat berjalan secara lokal; gunakan `models.mode: "merge"` agar fallback tetap tersedia.

### Config hibrida: hosted utama, fallback lokal

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

### Lokal-utama dengan jaring pengaman hosted

Tukar urutan utama dan fallback; pertahankan blok provider yang sama dan `models.mode: "merge"` agar Anda dapat fallback ke Sonnet atau Opus saat mesin lokal sedang tidak tersedia.

### Hosting regional / perutean data

- Varian MiniMax/Kimi/GLM yang di-host juga tersedia di OpenRouter dengan endpoint yang dipatok ke wilayah tertentu (misalnya, di-host di AS). Pilih varian regional di sana agar lalu lintas tetap berada di yurisdiksi pilihan Anda sambil tetap menggunakan `models.mode: "merge"` untuk fallback Anthropic/OpenAI.
- Khusus lokal tetap menjadi jalur privasi terkuat; perutean regional yang di-host adalah jalan tengah saat Anda memerlukan fitur provider tetapi tetap ingin mengendalikan aliran data.

## Proxy lokal lain yang kompatibel dengan OpenAI

vLLM, LiteLLM, OAI-proxy, atau gateway kustom dapat digunakan jika mengekspos endpoint `/v1` bergaya OpenAI. Ganti blok provider di atas dengan endpoint dan ID model Anda:

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

Pertahankan `models.mode: "merge"` agar model yang di-host tetap tersedia sebagai fallback.

Catatan perilaku untuk backend `/v1` lokal/proxy:

- OpenClaw memperlakukan rute ini sebagai rute bergaya proxy yang kompatibel dengan OpenAI, bukan endpoint OpenAI asli
- pembentukan permintaan yang khusus untuk OpenAI asli tidak berlaku di sini: tidak ada
  `service_tier`, tidak ada `store` Responses, tidak ada pembentukan payload kompatibilitas reasoning OpenAI,
  dan tidak ada petunjuk prompt-cache
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
  tidak disuntikkan pada URL proxy kustom ini

## Pemecahan masalah

- Gateway dapat menjangkau proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio tidak dimuat? Muat ulang; cold start adalah penyebab umum “menggantung”.
- Error konteks? Turunkan `contextWindow` atau naikkan batas server Anda.
- Keamanan: model lokal melewati filter sisi provider; batasi agen agar tetap sempit dan biarkan compaction aktif untuk membatasi radius dampak prompt injection.

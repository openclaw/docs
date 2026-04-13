---
read_when:
    - Anda ingin menyajikan model dari mesin GPU Anda sendiri
    - Anda sedang menyiapkan LM Studio atau proxy yang kompatibel dengan OpenAI
    - Anda memerlukan panduan model lokal yang paling aman
summary: Jalankan OpenClaw pada LLM lokal (LM Studio, vLLM, LiteLLM, endpoint OpenAI kustom)
title: Model Lokal
x-i18n:
    generated_at: "2026-04-13T08:50:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecb61b3e6e34d3666f9b688cd694d92c5fb211cf8c420fa876f7ccf5789154a
    source_path: gateway/local-models.md
    workflow: 15
---

# Model lokal

Lokal bisa dilakukan, tetapi OpenClaw mengharapkan konteks besar + pertahanan yang kuat terhadap injeksi prompt. Kartu kecil memotong konteks dan membocorkan mekanisme keamanan. Targetkan tinggi: **≥2 Mac Studio dengan spesifikasi maksimum atau rig GPU setara (~$30k+)**. Satu GPU **24 GB** hanya cocok untuk prompt yang lebih ringan dengan latensi lebih tinggi. Gunakan **varian model terbesar / ukuran penuh yang bisa Anda jalankan**; checkpoint yang sangat dikuantisasi atau “small” meningkatkan risiko injeksi prompt (lihat [Security](/id/gateway/security)).

Jika Anda menginginkan setup lokal dengan hambatan paling rendah, mulai dengan [LM Studio](/id/providers/lmstudio) atau [Ollama](/id/providers/ollama) dan `openclaw onboard`. Halaman ini adalah panduan yang opiniatif untuk stack lokal kelas atas dan server lokal kustom yang kompatibel dengan OpenAI.

## Rekomendasi: LM Studio + model lokal besar (Responses API)

Stack lokal terbaik saat ini. Muat model besar di LM Studio (misalnya, build Qwen, DeepSeek, atau Llama ukuran penuh), aktifkan server lokal (default `http://127.0.0.1:1234`), dan gunakan Responses API untuk menjaga reasoning tetap terpisah dari teks akhir.

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

**Daftar periksa setup**

- Instal LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Di LM Studio, unduh **build model terbesar yang tersedia** (hindari varian “small”/yang sangat dikuantisasi), mulai server, pastikan `http://127.0.0.1:1234/v1/models` menampilkannya.
- Ganti `my-local-model` dengan ID model sebenarnya yang ditampilkan di LM Studio.
- Biarkan model tetap dimuat; cold-load menambah latensi saat startup.
- Sesuaikan `contextWindow`/`maxTokens` jika build LM Studio Anda berbeda.
- Untuk WhatsApp, tetap gunakan Responses API agar hanya teks akhir yang dikirim.

Tetap konfigurasikan model yang di-host bahkan saat menjalankan lokal; gunakan `models.mode: "merge"` agar fallback tetap tersedia.

### Konfigurasi hybrid: hosted primary, fallback lokal

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

### Mengutamakan lokal dengan jaring pengaman hosted

Tukar urutan primary dan fallback; pertahankan blok provider yang sama dan `models.mode: "merge"` agar Anda bisa fallback ke Sonnet atau Opus saat mesin lokal tidak tersedia.

### Hosting regional / perutean data

- Varian MiniMax/Kimi/GLM yang di-host juga tersedia di OpenRouter dengan endpoint yang dikunci ke wilayah tertentu (misalnya, di-host di AS). Pilih varian regional di sana untuk menjaga lalu lintas tetap berada dalam yurisdiksi pilihan Anda sambil tetap menggunakan `models.mode: "merge"` untuk fallback Anthropic/OpenAI.
- Hanya-lokal tetap menjadi jalur privasi terkuat; perutean regional yang di-host adalah jalan tengah saat Anda membutuhkan fitur provider tetapi ingin mengontrol aliran data.

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

Pertahankan `models.mode: "merge"` agar model hosted tetap tersedia sebagai fallback.

Catatan perilaku untuk backend lokal/proksi `/v1`:

- OpenClaw memperlakukan ini sebagai rute gaya proksi yang kompatibel dengan OpenAI, bukan endpoint OpenAI native
- pembentukan permintaan khusus OpenAI native tidak berlaku di sini: tidak ada
  `service_tier`, tidak ada `store` pada Responses, tidak ada pembentukan payload kompatibilitas reasoning OpenAI, dan tidak ada petunjuk prompt-cache
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
  tidak disisipkan pada URL proksi kustom ini

Catatan kompatibilitas untuk backend yang kompatibel dengan OpenAI tetapi lebih ketat:

- Beberapa server hanya menerima `messages[].content` berupa string pada Chat Completions, bukan array content-part terstruktur. Atur
  `models.providers.<provider>.models[].compat.requiresStringContent: true` untuk
  endpoint tersebut.
- Beberapa backend lokal yang lebih kecil atau lebih ketat tidak stabil dengan bentuk prompt runtime agen penuh milik OpenClaw, terutama saat schema tool disertakan. Jika backend
  bekerja untuk panggilan `/v1/chat/completions` langsung yang kecil tetapi gagal pada giliran agen OpenClaw normal, coba
  `models.providers.<provider>.models[].compat.supportsTools: false` terlebih dahulu.
- Jika backend masih gagal hanya pada eksekusi OpenClaw yang lebih besar, masalah yang tersisa biasanya adalah kapasitas model/server upstream atau bug backend, bukan lapisan transport OpenClaw.

## Pemecahan masalah

- Gateway bisa menjangkau proksi? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio tidak dimuat? Muat ulang; cold start adalah penyebab umum “macet”.
- Error konteks? Turunkan `contextWindow` atau naikkan batas server Anda.
- Server yang kompatibel dengan OpenAI mengembalikan `messages[].content ... expected a string`?
  Tambahkan `compat.requiresStringContent: true` pada entri model tersebut.
- Panggilan `/v1/chat/completions` langsung yang kecil berhasil, tetapi `openclaw infer model run`
  gagal pada Gemma atau model lokal lain? Nonaktifkan schema tool terlebih dahulu dengan
  `compat.supportsTools: false`, lalu uji lagi. Jika server masih crash hanya
  pada prompt OpenClaw yang lebih besar, anggap itu sebagai keterbatasan server/model upstream.
- Keamanan: model lokal melewati filter sisi provider; jaga agar agen tetap sempit dan Compaction tetap aktif untuk membatasi dampak injeksi prompt.

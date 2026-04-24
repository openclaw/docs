---
read_when:
    - Anda ingin menyajikan model dari mesin GPU Anda sendiri
    - Anda sedang menghubungkan LM Studio atau proxy yang kompatibel dengan OpenAI
    - Anda memerlukan panduan model lokal yang paling aman
summary: Jalankan OpenClaw pada LLM lokal (LM Studio, vLLM, LiteLLM, endpoint OpenAI kustom)
title: Model lokal
x-i18n:
    generated_at: "2026-04-24T09:08:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

Lokal itu memungkinkan, tetapi OpenClaw mengharapkan konteks besar + pertahanan kuat terhadap prompt injection. GPU kecil akan memangkas konteks dan melemahkan keamanan. Targetkan tinggi: **≥2 Mac Studio spek maksimum atau rig GPU setara (~$30k+)**. Satu GPU **24 GB** hanya cocok untuk prompt yang lebih ringan dengan latensi lebih tinggi. Gunakan **varian model terbesar / ukuran penuh yang bisa Anda jalankan**; checkpoint yang sangat dikuantisasi atau “small” meningkatkan risiko prompt injection (lihat [Keamanan](/id/gateway/security)).

Jika Anda menginginkan penyiapan lokal dengan hambatan paling rendah, mulai dengan [LM Studio](/id/providers/lmstudio) atau [Ollama](/id/providers/ollama) dan `openclaw onboard`. Halaman ini adalah panduan yang lebih tegas untuk stack lokal kelas atas dan server lokal kustom yang kompatibel dengan OpenAI.

## Rekomendasi: LM Studio + model lokal besar (Responses API)

Stack lokal terbaik saat ini. Muat model besar di LM Studio (misalnya build Qwen, DeepSeek, atau Llama ukuran penuh), aktifkan server lokal (default `http://127.0.0.1:1234`), dan gunakan Responses API agar reasoning tetap terpisah dari teks final.

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
- Di LM Studio, unduh **build model terbesar yang tersedia** (hindari varian “small”/yang sangat dikuantisasi), jalankan server, pastikan `http://127.0.0.1:1234/v1/models` menampilkannya.
- Ganti `my-local-model` dengan ID model sebenarnya yang ditampilkan di LM Studio.
- Biarkan model tetap dimuat; cold-load menambah latensi startup.
- Sesuaikan `contextWindow`/`maxTokens` jika build LM Studio Anda berbeda.
- Untuk WhatsApp, gunakan Responses API agar hanya teks final yang dikirim.

Tetap konfigurasikan model hosted meskipun menjalankan model lokal; gunakan `models.mode: "merge"` agar fallback tetap tersedia.

### Konfigurasi hybrid: hosted sebagai primary, lokal sebagai fallback

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

### Utamakan lokal dengan jaring pengaman hosted

Tukar urutan primary dan fallback; pertahankan blok provider yang sama dan `models.mode: "merge"` agar Anda bisa fallback ke Sonnet atau Opus saat mesin lokal mati.

### Hosting regional / perutean data

- Varian MiniMax/Kimi/GLM hosted juga tersedia di OpenRouter dengan endpoint yang dikunci per wilayah (misalnya di-host di AS). Pilih varian regional di sana untuk menjaga lalu lintas tetap berada di yurisdiksi pilihan Anda sambil tetap menggunakan `models.mode: "merge"` untuk fallback Anthropic/OpenAI.
- Mode hanya lokal tetap menjadi jalur privasi terkuat; perutean hosted regional adalah jalan tengah saat Anda memerlukan fitur provider tetapi tetap ingin mengontrol aliran data.

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

Pertahankan `models.mode: "merge"` agar model hosted tetap tersedia sebagai fallback.

Catatan perilaku untuk backend `/v1` lokal/proxy:

- OpenClaw memperlakukan ini sebagai rute bergaya proxy yang kompatibel dengan OpenAI, bukan endpoint OpenAI bawaan
- pembentukan permintaan khusus OpenAI bawaan tidak berlaku di sini: tidak ada
  `service_tier`, tidak ada Responses `store`, tidak ada pembentukan payload
  kompatibilitas reasoning OpenAI, dan tidak ada petunjuk prompt-cache
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
  tidak disuntikkan pada URL proxy kustom ini

Catatan kompatibilitas untuk backend kompatibel OpenAI yang lebih ketat:

- Beberapa server hanya menerima `messages[].content` berbentuk string pada Chat Completions, bukan
  array content-part terstruktur. Setel
  `models.providers.<provider>.models[].compat.requiresStringContent: true` untuk
  endpoint tersebut.
- Beberapa backend lokal yang lebih kecil atau lebih ketat tidak stabil dengan bentuk prompt runtime agen
  penuh OpenClaw, terutama saat skema alat disertakan. Jika backend
  berfungsi untuk pemanggilan `/v1/chat/completions` langsung yang kecil tetapi gagal pada giliran agen
  OpenClaw normal, pertama coba
  `agents.defaults.experimental.localModelLean: true` untuk menghapus alat default
  berat seperti `browser`, `cron`, dan `message`; ini adalah flag eksperimental, bukan pengaturan mode default yang stabil. Lihat
  [Fitur Eksperimental](/id/concepts/experimental-features). Jika masih gagal, coba
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Jika backend masih gagal hanya pada eksekusi OpenClaw yang lebih besar, masalah yang tersisa
  biasanya adalah kapasitas model/server upstream atau bug backend, bukan lapisan
  transport OpenClaw.

## Pemecahan masalah

- Gateway dapat menjangkau proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio tidak dimuat? Muat ulang; cold start adalah penyebab umum “macet”.
- OpenClaw memperingatkan saat jendela konteks yang terdeteksi di bawah **32k** dan memblokir di bawah **16k**. Jika Anda terkena preflight itu, tingkatkan batas konteks server/model atau pilih model yang lebih besar.
- Error konteks? Turunkan `contextWindow` atau tingkatkan batas server Anda.
- Server yang kompatibel dengan OpenAI mengembalikan `messages[].content ... expected a string`?
  Tambahkan `compat.requiresStringContent: true` pada entri model itu.
- Pemanggilan `/v1/chat/completions` langsung yang kecil berfungsi, tetapi `openclaw infer model run`
  gagal pada Gemma atau model lokal lain? Nonaktifkan skema alat terlebih dahulu dengan
  `compat.supportsTools: false`, lalu uji ulang. Jika server masih crash hanya
  pada prompt OpenClaw yang lebih besar, anggap itu sebagai keterbatasan model/server upstream.
- Keamanan: model lokal melewati filter sisi provider; pertahankan agen tetap sempit dan Compaction tetap aktif untuk membatasi radius ledakan prompt injection.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Model failover](/id/concepts/model-failover)

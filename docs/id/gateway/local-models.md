---
read_when:
    - Anda ingin menyajikan model dari mesin GPU Anda sendiri
    - Anda sedang menghubungkan LM Studio atau proxy yang kompatibel dengan OpenAI
    - Anda memerlukan panduan model lokal yang paling aman
summary: Jalankan OpenClaw pada LLM lokal (LM Studio, vLLM, LiteLLM, endpoint OpenAI kustom)
title: Model lokal
x-i18n:
    generated_at: "2026-06-27T17:31:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

Model lokal dapat digunakan. Model lokal juga menaikkan tuntutan pada perangkat keras, ukuran konteks, dan pertahanan prompt-injection — kartu kecil atau yang dikuantisasi secara agresif memangkas konteks dan membocorkan keamanan. Halaman ini adalah panduan beropini untuk stack lokal kelas atas dan server lokal kustom yang kompatibel dengan OpenAI. Untuk onboarding dengan hambatan paling rendah, mulai dengan [LM Studio](/id/providers/lmstudio) atau [Ollama](/id/providers/ollama) dan `openclaw onboard`.

Untuk server lokal yang hanya boleh dimulai saat model terpilih membutuhkannya, lihat
[Layanan model lokal](/id/gateway/local-model-services).

## Batas minimum perangkat keras

Targetkan tinggi: **≥2 Mac Studio spek maksimal atau rig GPU setara (~$30k+)** untuk loop agen yang nyaman. Satu GPU **24 GB** hanya cocok untuk prompt yang lebih ringan dengan latensi lebih tinggi. Selalu jalankan **varian terbesar / ukuran penuh yang dapat Anda host**; checkpoint kecil atau yang dikuantisasi berat meningkatkan risiko prompt-injection (lihat [Keamanan](/id/gateway/security)).

## Pilih backend

| Backend                                              | Gunakan saat                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/id/providers/ds4)                                | DeepSeek V4 Flash lokal di macOS Metal dengan pemanggilan tool yang kompatibel dengan OpenAI |
| [LM Studio](/id/providers/lmstudio)                     | Penyiapan lokal pertama kali, pemuat GUI, Responses API native              |
| LiteLLM / OAI-proxy / proxy kustom kompatibel OpenAI | Anda meneruskan API model lain dan perlu membuat OpenClaw memperlakukannya sebagai OpenAI |
| MLX / vLLM / SGLang                                  | Serving self-hosted throughput tinggi dengan endpoint HTTP yang kompatibel dengan OpenAI |
| [Ollama](/id/providers/ollama)                          | Alur kerja CLI, pustaka model, layanan systemd tanpa banyak pengelolaan     |

Gunakan Responses API (`api: "openai-responses"`) saat backend mendukungnya (LM Studio mendukungnya). Jika tidak, tetap gunakan Chat Completions (`api: "openai-completions"`).

<Warning>
**Pengguna WSL2 + Ollama + NVIDIA/CUDA:** Installer Linux resmi Ollama mengaktifkan layanan systemd dengan `Restart=always`. Pada penyiapan GPU WSL2, autostart dapat memuat ulang model terakhir saat boot dan mengunci memori host. Jika VM WSL2 Anda berulang kali restart setelah mengaktifkan Ollama, lihat [loop crash WSL2](/id/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Direkomendasikan: LM Studio + model lokal besar (Responses API)

Stack lokal terbaik saat ini. Muat model besar di LM Studio (misalnya build Qwen, DeepSeek, atau Llama ukuran penuh), aktifkan server lokal (default `http://127.0.0.1:1234`), dan gunakan Responses API untuk menjaga penalaran tetap terpisah dari teks final.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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

**Checklist penyiapan**

- Instal LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Di LM Studio, unduh **build model terbesar yang tersedia** (hindari varian "small"/yang dikuantisasi berat), mulai server, pastikan `http://127.0.0.1:1234/v1/models` mencantumkannya.
- Ganti `my-local-model` dengan ID model aktual yang ditampilkan di LM Studio.
- Biarkan model tetap dimuat; cold-load menambah latensi startup.
- Sesuaikan `contextWindow`/`maxTokens` jika build LM Studio Anda berbeda.
- Untuk WhatsApp, tetap gunakan Responses API agar hanya teks final yang dikirim.

Biarkan model hosted tetap dikonfigurasi meskipun menjalankan lokal; gunakan `models.mode: "merge"` agar fallback tetap tersedia.

### Konfigurasi hibrida: primary hosted, fallback lokal

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

### Local-first dengan jaring pengaman hosted

Tukar urutan primary dan fallback; pertahankan blok providers yang sama dan `models.mode: "merge"` agar Anda dapat fallback ke Sonnet atau Opus saat mesin lokal tidak aktif.

### Hosting regional / routing data

- Varian hosted MiniMax/Kimi/GLM juga tersedia di OpenRouter dengan endpoint yang dipatok ke region (misalnya, di-host di AS). Pilih varian regional di sana untuk menjaga trafik tetap dalam yurisdiksi pilihan Anda sambil tetap menggunakan `models.mode: "merge"` untuk fallback Anthropic/OpenAI.
- Lokal saja tetap menjadi jalur privasi terkuat; routing regional hosted adalah jalan tengah saat Anda membutuhkan fitur provider tetapi ingin mengontrol aliran data.

## Proxy lokal lain yang kompatibel dengan OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy, atau gateway
kustom berfungsi jika mengekspos endpoint bergaya OpenAI
`/v1/chat/completions`. Gunakan adapter Chat Completions kecuali backend secara eksplisit
mendokumentasikan dukungan `/v1/responses`. Ganti blok provider di atas dengan
endpoint dan ID model Anda:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
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

Jika `api` dihilangkan pada provider kustom dengan `baseUrl`, OpenClaw default ke
`openai-completions`. Entri provider kustom/lokal memercayai origin
`baseUrl` tepat yang dikonfigurasi untuk permintaan model yang dijaga, termasuk loopback, LAN, tailnet,
dan host DNS privat. Permintaan ke origin privat lain tetap memerlukan
`request.allowPrivateNetwork: true`; origin metadata/link-local tetap diblokir
tanpa opt-in eksplisit. Atur ke `false` untuk opt out dari kepercayaan exact-origin.

Nilai `models.providers.<id>.models[].id` bersifat lokal untuk provider. Jangan
sertakan prefiks provider di sana. Misalnya, server MLX yang dimulai dengan
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` harus menggunakan
ID katalog dan ref model ini:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Atur `input: ["text", "image"]` pada model visi lokal atau yang diproxy agar lampiran
gambar disisipkan ke turn agen. Onboarding provider kustom interaktif
menyimpulkan ID model visi umum dan hanya bertanya untuk nama yang tidak dikenal.
Onboarding non-interaktif menggunakan inferensi yang sama; gunakan `--custom-image-input`
untuk ID visi yang tidak dikenal atau `--custom-text-input` saat model yang tampak dikenal
sebenarnya text-only di balik endpoint Anda.

Pertahankan `models.mode: "merge"` agar model hosted tetap tersedia sebagai fallback.
Gunakan `models.providers.<id>.timeoutSeconds` untuk server model lokal atau remote yang lambat
sebelum menaikkan `agents.defaults.timeoutSeconds`. Timeout provider
hanya berlaku untuk permintaan HTTP model, termasuk connect, headers, streaming body,
dan total abort guarded-fetch. Jika timeout agen atau run lebih rendah, naikkan
batas itu juga karena timeout provider tidak dapat memperpanjang keseluruhan run agen.

<Note>
Untuk provider kustom yang kompatibel dengan OpenAI, menyimpan penanda lokal non-rahasia seperti `apiKey: "ollama-local"` diterima saat `baseUrl` mengarah ke loopback, LAN privat, `.local`, atau hostname tanpa domain. OpenClaw memperlakukannya sebagai kredensial lokal valid alih-alih melaporkan kunci yang hilang. Gunakan nilai nyata untuk provider apa pun yang menerima hostname publik.
</Note>

Catatan perilaku untuk backend `/v1` lokal/yang diproxy:

- OpenClaw memperlakukan ini sebagai route kompatibel OpenAI bergaya proxy, bukan endpoint
  OpenAI native
- shaping permintaan khusus OpenAI native tidak berlaku di sini: tidak ada
  `service_tier`, tidak ada Responses `store`, tidak ada shaping payload kompatibilitas penalaran OpenAI,
  dan tidak ada hint prompt-cache
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
  tidak disisipkan pada URL proxy kustom ini

Catatan kompatibilitas untuk backend kompatibel OpenAI yang lebih ketat:

- Sebagian server hanya menerima `messages[].content` string pada Chat Completions, bukan
  array content-part terstruktur. Atur
  `models.providers.<provider>.models[].compat.requiresStringContent: true` untuk
  endpoint tersebut.
- Sebagian model lokal mengeluarkan permintaan tool berkurung yang berdiri sendiri sebagai teks, seperti
  `[tool_name]` diikuti JSON dan `[END_TOOL_REQUEST]`. OpenClaw mempromosikan
  itu menjadi pemanggilan tool nyata hanya saat namanya persis cocok dengan tool terdaftar
  untuk turn tersebut; jika tidak, blok diperlakukan sebagai teks yang tidak didukung dan
  disembunyikan dari balasan yang terlihat oleh pengguna.
- Jika model mengeluarkan teks JSON, XML, atau bergaya ReAct yang tampak seperti pemanggilan tool
  tetapi provider tidak mengeluarkan invokasi terstruktur, OpenClaw membiarkannya sebagai
  teks dan mencatat warning dengan run id, provider/model, pola yang terdeteksi, dan
  nama tool saat tersedia. Perlakukan itu sebagai inkompatibilitas tool-call
  provider/model, bukan run tool yang selesai.
- Jika tool muncul sebagai teks assistant alih-alih berjalan, misalnya JSON mentah,
  XML, sintaks ReAct, atau array `tool_calls` kosong dalam respons provider,
  pertama pastikan server menggunakan template/parser chat yang mendukung tool-call. Untuk
  backend Chat Completions kompatibel OpenAI yang parser-nya hanya berfungsi saat penggunaan tool
  dipaksa, atur override permintaan per model alih-alih mengandalkan parsing teks:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Gunakan ini hanya untuk model/sesi tempat setiap turn normal harus memanggil tool.
  Ini menggantikan nilai proxy default OpenClaw yaitu `tool_choice: "auto"`.
  Ganti `local/my-local-model` dengan ref provider/model persis yang ditampilkan oleh
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Jika model kustom kompatibel OpenAI menerima upaya penalaran OpenAI di luar
  profil bawaan, deklarasikan pada blok kompatibilitas model. Menambahkan `"xhigh"`
  di sini membuat `/think xhigh`, picker sesi, validasi Gateway, dan validasi `llm-task`
  mengekspos level tersebut untuk ref provider/model yang dikonfigurasi itu:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

## Backend yang lebih kecil atau lebih ketat

Jika model dimuat dengan bersih tetapi giliran agen penuh bermasalah, kerjakan dari atas ke bawah — konfirmasi transport terlebih dahulu, lalu persempit permukaannya.

1. **Konfirmasi model lokal itu sendiri merespons.** Tanpa alat, tanpa konteks agen:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Konfirmasi perutean Gateway.** Hanya mengirim prompt yang diberikan — melewati transkrip, bootstrap AGENTS, perakitan mesin konteks, alat, dan server MCP bawaan, tetapi tetap menguji perutean Gateway, autentikasi, dan pemilihan penyedia:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Coba mode ramping.** Jika kedua probe lolos tetapi giliran agen nyata gagal dengan panggilan alat yang salah format atau prompt yang terlalu besar, aktifkan `agents.defaults.experimental.localModelLean: true`. Ini menghapus tiga alat default terberat (`browser`, `cron`, `message`) dan menempatkan katalog alat yang lebih besar di balik kontrol Tool Search terstruktur secara default, kecuali untuk proses yang harus mempertahankan semantik pengiriman `message` langsung. Lihat [Fitur Eksperimental → Mode ramping model lokal](/id/concepts/experimental-features#local-model-lean-mode) untuk penjelasan lengkap, kapan menggunakannya, dan cara mengonfirmasi bahwa mode tersebut aktif.

4. **Nonaktifkan alat sepenuhnya sebagai upaya terakhir.** Jika mode ramping belum cukup, atur `models.providers.<provider>.models[].compat.supportsTools: false` untuk entri model tersebut. Agen kemudian akan beroperasi tanpa panggilan alat pada model tersebut.

5. **Setelah itu, hambatannya ada di upstream.** Jika backend masih gagal hanya pada proses OpenClaw yang lebih besar setelah mode ramping dan `supportsTools: false`, masalah yang tersisa biasanya adalah kapasitas model atau server upstream — jendela konteks, memori GPU, pengusiran kv-cache, atau bug backend. Pada titik itu, masalahnya bukan lapisan transport OpenClaw.

## Pemecahan masalah

- Gateway dapat menjangkau proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio tidak dimuat? Muat ulang; cold start adalah penyebab umum "menggantung".
- Server lokal mengatakan `terminated`, `ECONNRESET`, atau menutup stream di tengah giliran?
  OpenClaw mencatat `model.call.error.failureKind` berkardinalitas rendah beserta
  snapshot RSS/heap proses OpenClaw dalam diagnostik. Untuk tekanan memori
  LM Studio/Ollama, cocokkan timestamp tersebut dengan log server atau log crash /
  jetsam macOS untuk mengonfirmasi apakah server model dihentikan.
- OpenClaw menurunkan ambang preflight jendela konteks dari jendela model yang terdeteksi, atau dari jendela model tanpa batas ketika `agents.defaults.contextTokens` menurunkan jendela efektif. Ini memperingatkan di bawah 20% dengan batas bawah **8k**. Blok keras menggunakan ambang 10% dengan batas bawah **4k**, dibatasi ke jendela konteks efektif sehingga metadata model yang terlalu besar tidak dapat menolak batas pengguna yang sebenarnya valid. Jika Anda terkena preflight tersebut, naikkan batas konteks server/model atau pilih model yang lebih besar.
- Kesalahan konteks? Turunkan `contextWindow` atau naikkan batas server Anda.
- Server yang kompatibel dengan OpenAI mengembalikan `messages[].content ... expected a string`?
  Tambahkan `compat.requiresStringContent: true` pada entri model tersebut.
- Server yang kompatibel dengan OpenAI mengembalikan `validation.keys` atau mengatakan entri pesan hanya mengizinkan `role` dan `content`?
  Tambahkan `compat.strictMessageKeys: true` pada entri model tersebut.
- Panggilan kecil langsung `/v1/chat/completions` berfungsi, tetapi `openclaw infer model run --local`
  gagal pada Gemma atau model lokal lain? Periksa URL penyedia, referensi model, penanda autentikasi,
  dan log server terlebih dahulu; `model run` lokal tidak menyertakan alat agen.
  Jika `model run` lokal berhasil tetapi giliran agen yang lebih besar gagal, kurangi permukaan alat agen
  dengan `localModelLean` atau `compat.supportsTools: false`.
- Panggilan alat muncul sebagai teks JSON/XML/ReAct mentah, atau penyedia mengembalikan
  array `tool_calls` kosong? Jangan tambahkan proxy yang secara membabi buta mengonversi
  teks asisten menjadi eksekusi alat. Perbaiki template/parser chat server terlebih dahulu. Jika
  model hanya berfungsi ketika penggunaan alat dipaksa, tambahkan override per model
  `params.extra_body.tool_choice: "required"` di atas dan gunakan entri model tersebut
  hanya untuk sesi ketika panggilan alat diharapkan pada setiap giliran.
- Keamanan: model lokal melewati filter sisi penyedia; jaga agen tetap sempit dan Compaction aktif untuk membatasi radius dampak injeksi prompt.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Failover model](/id/concepts/model-failover)

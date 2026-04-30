---
read_when:
    - Anda ingin menyajikan model dari mesin GPU Anda sendiri
    - Anda sedang menghubungkan LM Studio atau proksi yang kompatibel dengan OpenAI
    - Anda memerlukan panduan model lokal yang paling aman
summary: Jalankan OpenClaw pada LLM lokal (LM Studio, vLLM, LiteLLM, endpoint OpenAI kustom)
title: Model lokal
x-i18n:
    generated_at: "2026-04-30T09:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Lokal memang memungkinkan, tetapi OpenClaw mengharapkan konteks besar + pertahanan kuat terhadap injeksi prompt. Kartu kecil memotong konteks dan melemahkan keamanan. Targetkan tinggi: **≥2 Mac Studio spesifikasi maksimal atau rig GPU setara (~$30k+)**. Satu GPU **24 GB** hanya cocok untuk prompt yang lebih ringan dengan latensi lebih tinggi. Gunakan **varian model terbesar / ukuran penuh yang bisa Anda jalankan**; checkpoint yang dikuantisasi agresif atau “kecil” meningkatkan risiko injeksi prompt (lihat [Keamanan](/id/gateway/security)).

Jika Anda menginginkan penyiapan lokal dengan gesekan paling rendah, mulai dengan [LM Studio](/id/providers/lmstudio) atau [Ollama](/id/providers/ollama) dan `openclaw onboard`. Halaman ini adalah panduan beropini untuk stack lokal kelas atas dan server lokal kustom yang kompatibel dengan OpenAI.

<Warning>
**Pengguna WSL2 + Ollama + NVIDIA/CUDA:** Installer Linux resmi Ollama mengaktifkan layanan systemd dengan `Restart=always`. Pada penyiapan GPU WSL2, autostart dapat memuat ulang model terakhir saat boot dan menahan memori host. Jika VM WSL2 Anda berulang kali restart setelah mengaktifkan Ollama, lihat [loop crash WSL2](/id/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Direkomendasikan: LM Studio + model lokal besar (Responses API)

Stack lokal terbaik saat ini. Muat model besar di LM Studio (misalnya build Qwen, DeepSeek, atau Llama ukuran penuh), aktifkan server lokal (default `http://127.0.0.1:1234`), dan gunakan Responses API untuk menjaga penalaran terpisah dari teks final.

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

**Daftar periksa penyiapan**

- Instal LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Di LM Studio, unduh **build model terbesar yang tersedia** (hindari varian “kecil”/sangat terkuantisasi), mulai server, pastikan `http://127.0.0.1:1234/v1/models` mencantumkannya.
- Ganti `my-local-model` dengan ID model aktual yang ditampilkan di LM Studio.
- Biarkan model tetap dimuat; pemuatan dingin menambah latensi startup.
- Sesuaikan `contextWindow`/`maxTokens` jika build LM Studio Anda berbeda.
- Untuk WhatsApp, tetap gunakan Responses API agar hanya teks final yang dikirim.

Tetap konfigurasikan model hosted bahkan saat menjalankan lokal; gunakan `models.mode: "merge"` agar fallback tetap tersedia.

### Konfigurasi hibrida: hosted sebagai utama, lokal sebagai fallback

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

### Lokal sebagai utama dengan jaring pengaman hosted

Tukar urutan utama dan fallback; pertahankan blok providers yang sama dan `models.mode: "merge"` agar Anda dapat beralih kembali ke Sonnet atau Opus saat mesin lokal tidak tersedia.

### Hosting regional / perutean data

- Varian MiniMax/Kimi/GLM hosted juga tersedia di OpenRouter dengan endpoint yang dikunci wilayah (misalnya, hosted di AS). Pilih varian regional di sana untuk menjaga traffic tetap dalam yurisdiksi pilihan Anda sambil tetap menggunakan `models.mode: "merge"` untuk fallback Anthropic/OpenAI.
- Hanya lokal tetap menjadi jalur privasi terkuat; perutean regional hosted adalah jalan tengah saat Anda membutuhkan fitur provider tetapi ingin mengendalikan aliran data.

## Proxy lokal lain yang kompatibel dengan OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy, atau Gateway kustom berfungsi jika mereka mengekspos endpoint bergaya OpenAI `/v1/chat/completions`. Gunakan adapter Chat Completions kecuali backend secara eksplisit mendokumentasikan dukungan `/v1/responses`. Ganti blok provider di atas dengan endpoint dan ID model Anda:

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

Jika `api` dihilangkan pada provider kustom dengan `baseUrl`, OpenClaw menggunakan default `openai-completions`. Endpoint loopback seperti `127.0.0.1` dipercaya secara otomatis; endpoint LAN, tailnet, dan DNS privat tetap membutuhkan `request.allowPrivateNetwork: true`.

Nilai `models.providers.<id>.models[].id` bersifat lokal untuk provider. Jangan sertakan prefiks provider di sana. Misalnya, server MLX yang dimulai dengan `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` harus menggunakan ID katalog dan referensi model ini:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Setel `input: ["text", "image"]` pada model vision lokal atau yang diproksi agar lampiran gambar disisipkan ke giliran agen. Onboarding provider kustom interaktif menyimpulkan ID model vision umum dan hanya menanyakan nama yang tidak dikenal. Onboarding noninteraktif menggunakan inferensi yang sama; gunakan `--custom-image-input` untuk ID vision yang tidak dikenal atau `--custom-text-input` saat model yang tampak dikenal ternyata hanya teks di balik endpoint Anda.

Pertahankan `models.mode: "merge"` agar model hosted tetap tersedia sebagai fallback. Gunakan `models.providers.<id>.timeoutSeconds` untuk server model lokal atau remote yang lambat sebelum menaikkan `agents.defaults.timeoutSeconds`. Timeout provider hanya berlaku untuk permintaan HTTP model, termasuk koneksi, header, streaming body, dan abort guarded-fetch total.

<Note>
Untuk provider kustom yang kompatibel dengan OpenAI, menyimpan penanda lokal non-rahasia seperti `apiKey: "ollama-local"` diterima saat `baseUrl` mengarah ke loopback, LAN privat, `.local`, atau hostname polos. OpenClaw memperlakukannya sebagai kredensial lokal valid alih-alih melaporkan key yang hilang. Gunakan nilai sungguhan untuk provider apa pun yang menerima hostname publik.
</Note>

Catatan perilaku untuk backend `/v1` lokal/terproksi:

- OpenClaw memperlakukan ini sebagai rute proxy bergaya kompatibel dengan OpenAI, bukan endpoint OpenAI native
- pembentukan permintaan khusus OpenAI native tidak berlaku di sini: tidak ada `service_tier`, tidak ada Responses `store`, tidak ada pembentukan payload kompatibilitas penalaran OpenAI, dan tidak ada petunjuk prompt-cache
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) tidak disisipkan pada URL proxy kustom ini

Catatan kompatibilitas untuk backend kompatibel dengan OpenAI yang lebih ketat:

- Sebagian server hanya menerima `messages[].content` berupa string pada Chat Completions, bukan array bagian konten terstruktur. Setel `models.providers.<provider>.models[].compat.requiresStringContent: true` untuk endpoint tersebut.
- Sebagian model lokal mengeluarkan permintaan tool mandiri dalam tanda kurung sebagai teks, seperti `[tool_name]` diikuti JSON dan `[END_TOOL_REQUEST]`. OpenClaw mempromosikannya menjadi panggilan tool sungguhan hanya saat nama persis cocok dengan tool terdaftar untuk giliran tersebut; jika tidak, blok diperlakukan sebagai teks yang tidak didukung dan disembunyikan dari balasan yang terlihat pengguna.
- Jika model mengeluarkan JSON, XML, atau teks bergaya ReAct yang tampak seperti panggilan tool tetapi provider tidak mengeluarkan invocation terstruktur, OpenClaw membiarkannya sebagai teks dan mencatat peringatan dengan ID run, provider/model, pola yang terdeteksi, dan nama tool saat tersedia. Perlakukan itu sebagai inkompatibilitas panggilan tool provider/model, bukan run tool yang selesai.
- Jika tool muncul sebagai teks assistant alih-alih berjalan, misalnya JSON mentah, XML, sintaks ReAct, atau array `tool_calls` kosong dalam respons provider, pertama pastikan server menggunakan template/parser chat yang mampu melakukan panggilan tool. Untuk backend Chat Completions kompatibel dengan OpenAI yang parser-nya hanya bekerja saat penggunaan tool dipaksa, setel override permintaan per model alih-alih mengandalkan parsing teks:

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

  Gunakan ini hanya untuk model/sesi yang setiap giliran normalnya harus memanggil tool. Ini menggantikan nilai proxy default OpenClaw `tool_choice: "auto"`. Ganti `local/my-local-model` dengan referensi provider/model persis yang ditampilkan oleh `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Jika model kustom yang kompatibel dengan OpenAI menerima effort penalaran OpenAI di luar profil bawaan, deklarasikan pada blok compat model. Menambahkan `"xhigh"` di sini membuat `/think xhigh`, pemilih sesi, validasi Gateway, dan validasi `llm-task` mengekspos level tersebut untuk referensi provider/model yang dikonfigurasi:

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

- Sebagian backend lokal yang lebih kecil atau lebih ketat tidak stabil dengan bentuk prompt runtime agen penuh OpenClaw, terutama saat skema tool disertakan. Pertama verifikasi jalur provider dengan probe lokal ringan:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Untuk memverifikasi rute Gateway tanpa bentuk prompt agen penuh, gunakan probe model Gateway sebagai gantinya:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Probe model lokal dan Gateway sama-sama hanya mengirim prompt yang diberikan. Probe Gateway tetap memvalidasi perutean Gateway, auth, dan pemilihan provider, tetapi dengan sengaja melewati transkrip sesi sebelumnya, konteks AGENTS/bootstrap, perakitan context-engine, tool, dan server MCP bundled.

  Jika itu berhasil tetapi giliran agen OpenClaw normal gagal, coba terlebih dahulu
  `agents.defaults.experimental.localModelLean: true` untuk menghapus alat bawaan
  yang berat seperti `browser`, `cron`, dan `message`; ini adalah flag eksperimental,
  bukan pengaturan mode bawaan yang stabil. Lihat
  [Fitur Eksperimental](/id/concepts/experimental-features). Jika itu masih gagal, coba
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Jika backend masih gagal hanya pada eksekusi OpenClaw yang lebih besar, masalah yang tersisa
  biasanya adalah kapasitas model/server upstream atau bug backend, bukan lapisan
  transport OpenClaw.

## Pemecahan masalah

- Gateway dapat menjangkau proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio belum dimuat? Muat ulang; cold start adalah penyebab umum “menggantung”.
- Server lokal mengatakan `terminated`, `ECONNRESET`, atau menutup stream di tengah giliran?
  OpenClaw mencatat `model.call.error.failureKind` berkardinalitas rendah plus snapshot
  RSS/heap proses OpenClaw dalam diagnostik. Untuk tekanan memori LM Studio/Ollama,
  cocokkan timestamp itu dengan log server atau log crash / jetsam macOS untuk memastikan
  apakah server model dihentikan.
- OpenClaw menurunkan ambang preflight jendela konteks dari jendela model yang terdeteksi, atau dari jendela model tanpa batas saat `agents.defaults.contextTokens` menurunkan jendela efektif. OpenClaw memperingatkan di bawah 20% dengan batas bawah **8k**. Blok keras menggunakan ambang 10% dengan batas bawah **4k**, dibatasi ke jendela konteks efektif sehingga metadata model yang terlalu besar tidak dapat menolak batas pengguna yang sebenarnya valid. Jika Anda terkena preflight itu, naikkan batas konteks server/model atau pilih model yang lebih besar.
- Error konteks? Turunkan `contextWindow` atau naikkan batas server Anda.
- Server yang kompatibel dengan OpenAI mengembalikan `messages[].content ... expected a string`?
  Tambahkan `compat.requiresStringContent: true` pada entri model tersebut.
- Panggilan kecil langsung ke `/v1/chat/completions` berfungsi, tetapi `openclaw infer model run --local`
  gagal pada Gemma atau model lokal lain? Periksa URL penyedia, referensi model, penanda auth,
  dan log server terlebih dahulu; `model run` lokal tidak menyertakan alat agen.
  Jika `model run` lokal berhasil tetapi giliran agen yang lebih besar gagal, kurangi permukaan
  alat agen dengan `localModelLean` atau `compat.supportsTools: false`.
- Panggilan alat muncul sebagai teks JSON/XML/ReAct mentah, atau penyedia mengembalikan array
  `tool_calls` kosong? Jangan tambahkan proxy yang secara membabi buta mengubah teks asisten
  menjadi eksekusi alat. Perbaiki template/parser chat server terlebih dahulu. Jika
  model hanya berfungsi saat penggunaan alat dipaksa, tambahkan override per model
  `params.extra_body.tool_choice: "required"` di atas dan gunakan entri model tersebut
  hanya untuk sesi ketika panggilan alat diharapkan pada setiap giliran.
- Keamanan: model lokal melewati filter sisi penyedia; jaga agen tetap sempit dan compaction aktif untuk membatasi radius dampak prompt injection.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Failover model](/id/concepts/model-failover)

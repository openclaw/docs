---
read_when:
    - Anda ingin menyajikan model dari mesin GPU Anda sendiri
    - Anda sedang menghubungkan LM Studio atau proksi yang kompatibel dengan OpenAI
    - Anda memerlukan panduan model lokal yang paling aman
summary: Jalankan OpenClaw pada LLM lokal (LM Studio, vLLM, LiteLLM, endpoint OpenAI khusus)
title: Model lokal
x-i18n:
    generated_at: "2026-07-12T14:11:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Model lokal dapat digunakan, tetapi menuntut lebih banyak dari perangkat keras, ukuran konteks, dan pertahanan terhadap injeksi prompt: model kecil atau yang dikuantisasi secara agresif akan memangkas konteks dan melewati filter keamanan sisi penyedia. Halaman ini membahas tumpukan lokal kelas atas dan server khusus yang kompatibel dengan OpenAI. Untuk jalur dengan hambatan paling rendah, mulailah dengan [LM Studio](/id/providers/lmstudio) atau [Ollama](/id/providers/ollama) dan `openclaw onboard`.

Untuk server lokal yang hanya boleh dimulai ketika model terpilih membutuhkannya, lihat [Layanan model lokal](/id/gateway/local-model-services).

## Batas minimum perangkat keras

Targetkan **2 atau lebih Mac Studio dengan spesifikasi maksimal atau perangkat GPU yang setara (~$30 ribu+)** untuk siklus agen yang nyaman. Satu GPU **24 GB** hanya mampu menangani prompt yang lebih ringan dengan latensi lebih tinggi. Selalu jalankan **varian terbesar / berukuran penuh yang dapat Anda jalankan**—checkpoint kecil atau yang dikuantisasi secara berat meningkatkan risiko injeksi prompt (lihat [Keamanan](/id/gateway/security)).

## Pilih backend

| Backend                                              | Gunakan ketika                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [ds4](/id/providers/ds4)                                | DeepSeek V4 Flash lokal di macOS Metal dengan pemanggilan alat yang kompatibel dengan OpenAI    |
| [LM Studio](/id/providers/lmstudio)                     | Penyiapan lokal pertama kali, pemuat GUI, Responses API native                                  |
| LiteLLM / OAI-proxy / proksi khusus kompatibel OpenAI | Anda menjadi perantara API model lain dan perlu agar OpenClaw memperlakukannya sebagai OpenAI   |
| MLX / vLLM / SGLang                                  | Penyajian mandiri berthroughput tinggi dengan endpoint HTTP yang kompatibel dengan OpenAI        |
| [Ollama](/id/providers/ollama)                          | Alur kerja CLI, pustaka model, layanan systemd yang berjalan otomatis                           |

Gunakan `api: "openai-responses"` ketika backend mendukungnya (LM Studio mendukungnya). Jika tidak, gunakan `api: "openai-completions"`. Jika `api` dihilangkan pada penyedia khusus dengan `baseUrl`, OpenClaw menggunakan `openai-completions` secara default.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** penginstal resmi Ollama untuk Linux mengaktifkan layanan systemd dengan `Restart=always`. Pada penyiapan GPU WSL2, mulai otomatis dapat memuat ulang model terakhir saat boot dan menahan memori host, sehingga menyebabkan VM dimulai ulang berulang kali. Lihat [perulangan crash WSL2](/id/providers/ollama#troubleshooting).
</Warning>

## LM Studio + model lokal besar (Responses API)

Ini adalah tumpukan lokal terbaik saat ini. Muat model besar di LM Studio (build Qwen, DeepSeek, atau Llama berukuran penuh), aktifkan server lokal (default `http://127.0.0.1:1234`), dan gunakan Responses API agar penalaran tetap terpisah dari teks akhir.

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

Daftar periksa penyiapan:

- Instal LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Unduh **build model terbesar yang tersedia** (hindari varian "kecil"/yang dikuantisasi secara berat), mulai server, lalu pastikan `http://127.0.0.1:1234/v1/models` mencantumkannya.
- Ganti `my-local-model` dengan ID model sebenarnya yang ditampilkan di LM Studio.
- Biarkan model tetap termuat; pemuatan dingin menambah latensi saat memulai.
- Sesuaikan `contextWindow`/`maxTokens` jika build LM Studio Anda berbeda.
- Untuk WhatsApp, tetap gunakan Responses API agar hanya teks akhir yang dikirim.
- Pertahankan `models.mode: "merge"` agar model yang dihosting tetap tersedia sebagai cadangan.

### Konfigurasi hibrida: model utama yang dihosting, cadangan lokal

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

Untuk memprioritaskan model lokal dengan model yang dihosting sebagai pengaman, tukar urutan `primary`/`fallbacks` dan pertahankan blok `providers` serta `models.mode: "merge"` yang sama.

### Hosting regional / perutean data

Varian MiniMax/Kimi/GLM yang dihosting juga tersedia di OpenRouter dengan endpoint yang ditetapkan ke wilayah tertentu (misalnya, dihosting di AS). Pilih varian regional agar lalu lintas tetap berada dalam yurisdiksi pilihan Anda, sambil mempertahankan `models.mode: "merge"` untuk cadangan Anthropic/OpenAI. Penggunaan lokal saja tetap merupakan jalur privasi terkuat; perutean regional yang dihosting menjadi pilihan tengah ketika Anda memerlukan fitur penyedia tetapi tetap ingin mengendalikan aliran data.

## Proksi lokal lain yang kompatibel dengan OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy, atau Gateway khusus apa pun dapat digunakan jika menyediakan endpoint bergaya OpenAI `/v1/chat/completions`. Gunakan `openai-completions` kecuali backend secara eksplisit mendokumentasikan dukungan `/v1/responses`.

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

Entri penyedia khusus/lokal memercayai origin `baseUrl` yang dikonfigurasi secara persis untuk permintaan model yang dilindungi, termasuk loopback, LAN, tailnet, dan host DNS privat. Origin metadata/link-local selalu diblokir tanpa pengecualian. Permintaan ke origin privat lainnya tetap memerlukan `models.providers.<id>.request.allowPrivateNetwork: true`; atur bendera kepercayaan ke `false` untuk menonaktifkan kepercayaan terhadap origin persis tersebut.

`models.providers.<id>.models[].id` bersifat lokal bagi penyedia—jangan sertakan prefiks penyedia. Untuk server MLX yang dimulai dengan `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Atur `input: ["text", "image"]` pada model visi lokal atau yang diproksikan agar lampiran gambar disisipkan ke dalam giliran agen. Orientasi penyedia khusus interaktif mengenali ID model visi umum dan hanya menanyakan nama yang tidak dikenal; orientasi noninteraktif menggunakan pengenalan yang sama, dengan `--custom-image-input` / `--custom-text-input` untuk menimpanya.

Gunakan `models.providers.<id>.timeoutSeconds` untuk server model lokal/jarak jauh yang lambat sebelum menaikkan `agents.defaults.timeoutSeconds`. Batas waktu penyedia mencakup koneksi, header, streaming isi, dan pembatalan pengambilan terlindungi secara keseluruhan khusus untuk permintaan HTTP model—jika batas waktu agen/proses lebih rendah, naikkan juga, karena batas waktu penyedia tidak dapat memperpanjang keseluruhan proses.

<Note>
Untuk penyedia khusus yang kompatibel dengan OpenAI, penanda lokal nonrahasia seperti `apiKey: "ollama-local"` diterima ketika `baseUrl` mengarah ke loopback, LAN privat, `.local`, atau nama host tanpa domain—OpenClaw memperlakukannya sebagai kredensial lokal yang valid, bukan melaporkan kunci yang tidak tersedia. Gunakan nilai sebenarnya untuk setiap penyedia yang menerima nama host publik.
</Note>

Catatan perilaku untuk backend `/v1` lokal/yang diproksikan:

- OpenClaw memperlakukannya sebagai rute kompatibel OpenAI bergaya proksi, bukan endpoint OpenAI native.
- Pembentukan permintaan yang khusus untuk OpenAI native tidak diterapkan: tanpa `service_tier`, tanpa `store` Responses, tanpa pembentukan payload kompatibilitas penalaran OpenAI, dan tanpa petunjuk cache prompt.
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) tidak disisipkan pada URL proksi khusus.

Penimpaan kompatibilitas untuk backend kompatibel OpenAI yang lebih ketat:

- **Konten hanya berupa string**: beberapa server hanya menerima `messages[].content` berupa string, bukan larik bagian konten terstruktur. Atur `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Kunci pesan ketat**: jika server menolak entri pesan dengan lebih dari `role`/`content`, atur `compat.strictMessageKeys: true`.
- **Teks alat dalam tanda kurung siku**: beberapa model lokal menghasilkan permintaan alat mandiri dalam tanda kurung siku sebagai teks, seperti `[tool_name]` yang diikuti JSON dan `[END_TOOL_REQUEST]`. OpenClaw mengubahnya menjadi pemanggilan alat nyata hanya jika namanya sama persis dengan alat yang terdaftar untuk giliran tersebut; jika tidak, teks itu tetap menjadi teks tersembunyi yang tidak didukung.
- **Teks tidak terstruktur yang menyerupai pemanggilan alat**: jika model menghasilkan teks bergaya JSON/XML/ReAct yang tampak seperti pemanggilan alat tetapi bukan pemanggilan terstruktur, OpenClaw membiarkannya sebagai teks dan mencatat peringatan dengan ID proses, penyedia/model, pola yang terdeteksi, serta nama alat jika tersedia. Itu merupakan ketidakcocokan penyedia/model, bukan proses alat yang selesai.
- **Memaksa penggunaan alat**: jika alat muncul sebagai teks asisten (JSON/XML/ReAct mentah, atau larik `tool_calls` kosong), pertama-tama pastikan templat/pengurai percakapan server mendukung pemanggilan alat. Jika pengurai hanya berfungsi ketika penggunaan alat dipaksakan, timpa nilai proksi default `tool_choice: "auto"` untuk setiap model:

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

  Gunakan ini hanya jika setiap giliran normal harus memanggil alat. Ganti `local/my-local-model` dengan referensi persis dari `openclaw models list`, atau atur melalui CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Tingkat upaya penalaran tambahan**: jika model khusus yang kompatibel dengan OpenAI menerima tingkat upaya penalaran OpenAI di luar profil bawaan, deklarasikan dalam blok kompatibilitas model. Menambahkan `"xhigh"` membuatnya tersedia untuk referensi model tersebut di `/think xhigh`, pemilih sesi, validasi Gateway, dan validasi `llm-task`:

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

Jika model dimuat tanpa masalah tetapi giliran agen penuh berperilaku keliru, tangani dari atas ke bawah: pastikan transportasi terlebih dahulu, lalu persempit cakupannya.

1. **Pastikan model lokal merespons**—tanpa alat, tanpa konteks agen:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Balas persis dengan: pong" --json
   ```

2. **Konfirmasikan perutean Gateway** - hanya mengirim prompt, melewati transkrip, bootstrap AGENTS, perakitan mesin konteks, alat, dan server MCP bawaan, tetapi tetap menguji perutean Gateway, autentikasi, dan pemilihan penyedia:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Balas persis dengan: pong" --json
   ```

3. **Coba mode ringan** jika kedua pemeriksaan berhasil tetapi giliran agen nyata gagal karena pemanggilan alat yang salah format atau prompt yang terlalu besar: atur `agents.defaults.experimental.localModelLean: true`. Opsi ini menghapus alat berat untuk peramban, cron, pesan, pembuatan media, suara, dan PDF kecuali diwajibkan secara eksplisit, serta secara default menempatkan katalog alat yang lebih besar di balik kontrol Pencarian Alat terstruktur sambil mempertahankan `exec` agar terlihat langsung. Lihat [Fitur Eksperimental -> Mode ringan model lokal](/id/concepts/experimental-features#local-model-lean-mode) untuk detail dan cara mengonfirmasi bahwa mode tersebut aktif.

4. **Nonaktifkan alat sepenuhnya sebagai upaya terakhir** dengan mengatur `models.providers.<provider>.models[].compat.supportsTools: false` untuk model tersebut - agen kemudian berjalan tanpa pemanggilan alat.

5. **Jika masih gagal, hambatannya berada di hulu.** Jika backend masih gagal hanya pada proses OpenClaw yang lebih besar setelah mode ringan dan `supportsTools: false`, masalah yang tersisa biasanya ada pada model atau server itu sendiri - jendela konteks, memori GPU, penggusuran kv-cache, atau bug backend - bukan lapisan transportasi OpenClaw.

## Pemecahan masalah

- **Gateway tidak dapat menjangkau proksi?** `curl http://127.0.0.1:1234/v1/models`.
- **Model LM Studio terlepas dari memori?** Muat ulang; mulai dingin merupakan penyebab umum kondisi "macet".
- **Server lokal menampilkan `terminated`, `ECONNRESET`, atau menutup aliran di tengah giliran?** OpenClaw mencatat `model.call.error.failureKind` berkardinalitas rendah beserta snapshot RSS/heap proses OpenClaw dalam diagnostik. Untuk tekanan memori LM Studio/Ollama, cocokkan stempel waktu tersebut dengan log server atau log crash/jetsam macOS untuk mengonfirmasi apakah server model dihentikan.
- **Kesalahan konteks?** OpenClaw memperoleh ambang pemeriksaan awal jendela konteks dari jendela model yang terdeteksi (atau jendela yang dibatasi ketika `agents.defaults.contextTokens` menurunkannya), memberikan peringatan di bawah 20% dengan batas minimum **8k** dan melakukan pemblokiran penuh di bawah 10% dengan batas minimum **4k** (dibatasi ke jendela konteks efektif agar metadata model yang terlalu besar tidak menolak batas pengguna yang valid). Turunkan `contextWindow` atau naikkan batas konteks server/model.
- **`messages[].content ... expected a string`?** Tambahkan `compat.requiresStringContent: true` pada entri model tersebut.
- **`validation.keys`, atau "entri pesan hanya mengizinkan `role` dan `content`"?** Tambahkan `compat.strictMessageKeys: true` pada entri model tersebut.
- **Pemanggilan langsung `/v1/chat/completions` berfungsi, tetapi `openclaw infer model run --local` gagal pada Gemma atau model lokal lainnya?** Periksa terlebih dahulu URL penyedia, referensi model, penanda autentikasi, dan log server - `model run` sepenuhnya melewati alat agen. Jika `model run` berhasil tetapi giliran agen yang lebih besar gagal, kurangi cakupan alat dengan `localModelLean` atau `compat.supportsTools: false`.
- **Pemanggilan alat muncul sebagai teks JSON/XML/ReAct mentah, atau penyedia mengembalikan array `tool_calls` kosong?** Jangan tambahkan proksi yang secara membabi buta mengubah teks asisten menjadi eksekusi alat - perbaiki templat/parser obrolan server terlebih dahulu. Jika model hanya berfungsi saat penggunaan alat diwajibkan, tambahkan penggantian `params.extra_body.tool_choice: "required"` di atas dan gunakan entri model tersebut hanya untuk sesi yang mengharapkan pemanggilan alat pada setiap giliran.
- **Keamanan**: model lokal melewati filter sisi penyedia. Pertahankan cakupan agen tetap sempit dan aktifkan Compaction untuk membatasi radius dampak injeksi prompt.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Failover model](/id/concepts/model-failover)

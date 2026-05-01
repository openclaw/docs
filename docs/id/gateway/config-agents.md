---
read_when:
    - Menyesuaikan pengaturan bawaan agen (model, penalaran, ruang kerja, Heartbeat, media, Skills)
    - Mengonfigurasi perutean dan pengikatan multi-agen
    - Menyesuaikan sesi, pengiriman pesan, dan perilaku mode bicara
summary: Default agen, perutean multi-agen, sesi, pesan, dan konfigurasi percakapan
title: Konfigurasi — agen
x-i18n:
    generated_at: "2026-05-01T09:24:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 12a3c0c4a79d6753c7cebdb366e3a0272571841f3eaa0e08ded21fe54f485ca8
    source_path: gateway/config-agents.md
    workflow: 16
---

Kunci konfigurasi bercakupan agen di bawah `agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, dan `talk.*`. Untuk channel, alat, runtime Gateway, dan kunci
tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Default agen

### `agents.defaults.workspace`

Default: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan di baris Runtime prompt sistem. Jika tidak diatur, OpenClaw mendeteksi otomatis dengan berjalan ke atas dari workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist Skills default opsional untuk agen yang tidak mengatur
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Hilangkan `agents.defaults.skills` agar Skills tidak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi default.
- Atur `agents.list[].skills: []` agar tanpa Skills.
- Daftar `agents.list[].skills` yang tidak kosong adalah kumpulan akhir untuk agen tersebut; daftar itu
  tidak digabung dengan default.

### `agents.defaults.skipBootstrap`

Menonaktifkan pembuatan otomatis file bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Melewati pembuatan file workspace opsional yang dipilih sambil tetap menulis file bootstrap wajib. Nilai valid: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, dan `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Mengontrol kapan file bootstrap workspace disuntikkan ke prompt sistem. Default: `"always"`.

- `"continuation-skip"`: giliran kelanjutan yang aman (setelah respons asisten selesai) melewati penyuntikan ulang bootstrap workspace, sehingga mengurangi ukuran prompt. Jalankan Heartbeat dan percobaan ulang pasca-Compaction tetap membangun ulang konteks.
- `"never"`: menonaktifkan bootstrap workspace dan penyuntikan file konteks pada setiap giliran. Gunakan ini hanya untuk agen yang sepenuhnya memiliki siklus hidup prompt mereka sendiri (mesin konteks kustom, runtime native yang membangun konteksnya sendiri, atau workflow khusus tanpa bootstrap). Giliran Heartbeat dan pemulihan Compaction juga melewati penyuntikan.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Jumlah karakter maksimum per file bootstrap workspace sebelum pemotongan. Default: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Jumlah total karakter maksimum yang disuntikkan di seluruh file bootstrap workspace. Default: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Mengontrol teks peringatan yang terlihat oleh agen saat konteks bootstrap dipotong.
Default: `"once"`.

- `"off"`: jangan pernah menyuntikkan teks peringatan ke prompt sistem.
- `"once"`: suntikkan peringatan sekali per tanda tangan pemotongan unik (direkomendasikan).
- `"always"`: suntikkan peringatan pada setiap run saat ada pemotongan.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Peta kepemilikan anggaran konteks

OpenClaw memiliki beberapa anggaran prompt/konteks bervolume tinggi, dan anggaran tersebut
sengaja dipisah berdasarkan subsistem, bukan semuanya mengalir melalui satu
knob generik.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  penyuntikan bootstrap workspace normal.
- `agents.defaults.startupContext.*`:
  prelude run model satu kali saat reset/startup, termasuk file `memory/*.md`
  harian terbaru. Perintah chat polos `/new` dan `/reset`
  diakui tanpa memanggil model.
- `skills.limits.*`:
  daftar Skills ringkas yang disuntikkan ke prompt sistem.
- `agents.defaults.contextLimits.*`:
  kutipan runtime berbatas dan blok milik runtime yang disuntikkan.
- `memory.qmd.limits.*`:
  ukuran cuplikan pencarian memori terindeks dan penyuntikan.

Gunakan override per agen yang sesuai hanya saat satu agen memerlukan anggaran
berbeda:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Mengontrol prelude startup giliran pertama yang disuntikkan pada run model reset/startup.
Perintah chat polos `/new` dan `/reset` mengakui reset tanpa memanggil
model, sehingga perintah itu tidak memuat prelude ini.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Default bersama untuk permukaan konteks runtime berbatas.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: batas kutipan `memory_get` default sebelum metadata
  pemotongan dan pemberitahuan kelanjutan ditambahkan.
- `memoryGetDefaultLines`: jendela baris `memory_get` default saat `lines`
  dihilangkan.
- `toolResultMaxChars`: batas hasil alat live yang digunakan untuk hasil tersimpan dan
  pemulihan overflow.
- `postCompactionMaxChars`: batas kutipan AGENTS.md yang digunakan selama penyuntikan
  refresh pasca-Compaction.

#### `agents.list[].contextLimits`

Override per agen untuk knob `contextLimits` bersama. Field yang dihilangkan mewarisi
dari `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Batas global untuk daftar Skills ringkas yang disuntikkan ke prompt sistem. Ini
tidak memengaruhi pembacaan file `SKILL.md` sesuai permintaan.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Override per agen untuk anggaran prompt Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Ukuran piksel maksimum untuk sisi gambar terpanjang dalam blok gambar transkrip/alat sebelum panggilan provider.
Default: `1200`.

Nilai yang lebih rendah biasanya mengurangi penggunaan token vision dan ukuran payload permintaan untuk run yang banyak berisi screenshot.
Nilai yang lebih tinggi mempertahankan lebih banyak detail visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zona waktu untuk konteks prompt sistem (bukan timestamp pesan). Fallback ke zona waktu host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format waktu di prompt sistem. Default: `auto` (preferensi OS).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Bentuk string hanya mengatur model utama.
  - Bentuk objek mengatur model utama plus model failover berurutan.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh jalur alat `image` sebagai konfigurasi model vision-nya.
  - Juga digunakan sebagai perutean fallback saat model yang dipilih/default tidak dapat menerima input gambar.
  - Utamakan referensi `provider/model` eksplisit. ID polos diterima untuk kompatibilitas; jika ID polos cocok secara unik dengan entri berkemampuan gambar yang dikonfigurasi di `models.providers.*.models`, OpenClaw melengkapinya ke penyedia tersebut. Kecocokan terkonfigurasi yang ambigu memerlukan prefiks penyedia eksplisit.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan gambar bersama dan setiap permukaan alat/Plugin mendatang yang menghasilkan gambar.
  - Nilai umum: `google/gemini-3.1-flash-image-preview` untuk pembuatan gambar Gemini native, `fal/fal-ai/flux/dev` untuk fal, `openai/gpt-image-2` untuk OpenAI Images, atau `openai/gpt-image-1.5` untuk output PNG/WebP OpenAI dengan latar belakang transparan.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi penyedia yang sesuai (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` atau OpenAI Codex OAuth untuk `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` masih dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan gambar terdaftar yang tersisa dalam urutan id penyedia.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan musik bersama dan alat bawaan `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.6`.
  - Jika dihilangkan, `music_generate` masih dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan musik terdaftar yang tersisa dalam urutan id penyedia.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi/kunci API penyedia yang sesuai.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan video bersama dan alat bawaan `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` masih dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan video terdaftar yang tersisa dalam urutan id penyedia.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi/kunci API penyedia yang sesuai.
  - Penyedia pembuatan video Qwen bawaan mendukung hingga 1 video output, 1 gambar input, 4 video input, durasi 10 detik, serta opsi tingkat penyedia `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh alat `pdf` untuk perutean model.
  - Jika dihilangkan, alat PDF fallback ke `imageModel`, lalu ke model sesi/default yang terselesaikan.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk alat `pdf` ketika `maxBytesMb` tidak diteruskan saat pemanggilan.
- `pdfMaxPages`: jumlah halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi di alat `pdf`.
- `verboseDefault`: tingkat verbose default untuk agen. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `reasoningDefault`: visibilitas penalaran default untuk agen. Nilai: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` per agen menimpa default ini. Default penalaran yang dikonfigurasi hanya diterapkan untuk pemilik, pengirim yang diotorisasi, atau konteks Gateway operator-admin ketika tidak ada override penalaran per pesan atau sesi yang diatur.
- `elevatedDefault`: tingkat output terelevasi default untuk agen. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (mis. `openai/gpt-5.5` untuk akses kunci API atau `openai-codex/gpt-5.5` untuk Codex OAuth). Jika Anda menghilangkan penyedia, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan penyedia terkonfigurasi yang unik untuk id model persis tersebut, dan baru setelah itu fallback ke penyedia default yang dikonfigurasi (perilaku kompatibilitas yang sudah usang, jadi utamakan `provider/model` eksplisit). Jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw fallback ke penyedia/model terkonfigurasi pertama alih-alih menampilkan default penyedia yang sudah dihapus dan kedaluwarsa.
- `models`: katalog model terkonfigurasi dan allowlist untuk `/model`. Setiap entri dapat menyertakan `alias` (pintasan) dan `params` (spesifik penyedia, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Pengeditan aman: gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri. `config set` menolak penggantian yang akan menghapus entri allowlist yang ada kecuali Anda meneruskan `--replace`.
  - Alur konfigurasi/onboarding berscope penyedia menggabungkan model penyedia yang dipilih ke dalam map ini dan mempertahankan penyedia lain yang sudah dikonfigurasi.
  - Untuk model OpenAI Responses langsung, Compaction sisi server diaktifkan secara otomatis. Gunakan `params.responsesServerCompaction: false` untuk berhenti menyuntikkan `context_management`, atau `params.responsesCompactThreshold` untuk menimpa ambangnya. Lihat [Compaction sisi server OpenAI](/id/providers/openai#server-side-compaction-responses-api).
- `params`: parameter penyedia default global yang diterapkan ke semua model. Diatur di `agents.defaults.params` (mis. `{ cacheRetention: "long" }`).
- Presedensi penggabungan `params` (konfigurasi): `agents.defaults.params` (basis global) ditimpa oleh `agents.defaults.models["provider/model"].params` (per model), lalu `agents.list[].params` (id agen yang cocok) menimpa berdasarkan kunci. Lihat [Prompt Caching](/id/reference/prompt-caching) untuk detail.
- `params.extra_body`/`params.extraBody`: JSON pass-through lanjutan yang digabungkan ke body permintaan `api: "openai-completions"` untuk proxy yang kompatibel dengan OpenAI. Jika bertabrakan dengan kunci permintaan yang dihasilkan, body tambahan menang; rute completions non-native tetap menghapus `store` khusus OpenAI sesudahnya.
- `params.chat_template_kwargs`: argumen chat-template yang kompatibel dengan vLLM/OpenAI yang digabungkan ke body permintaan tingkat atas `api: "openai-completions"`. Untuk `vllm/nemotron-3-*` dengan thinking nonaktif, Plugin vLLM bawaan secara otomatis mengirim `enable_thinking: false` dan `force_nonempty_content: true`; `chat_template_kwargs` eksplisit menimpa default yang dihasilkan, dan `extra_body.chat_template_kwargs` tetap memiliki presedensi akhir. Untuk kontrol thinking Qwen vLLM, atur `params.qwenThinkingFormat` ke `"chat-template"` atau `"top-level"` pada entri model tersebut.
- `compat.supportedReasoningEfforts`: daftar upaya penalaran per model yang kompatibel dengan OpenAI. Sertakan `"xhigh"` untuk endpoint kustom yang benar-benar menerimanya; OpenClaw kemudian mengekspos `/think xhigh` di menu perintah, baris sesi Gateway, validasi patch sesi, validasi CLI agen, dan validasi `llm-task` untuk penyedia/model terkonfigurasi tersebut. Gunakan `compat.reasoningEffortMap` ketika backend menginginkan nilai spesifik penyedia untuk tingkat kanonis.
- `params.preserveThinking`: opt-in khusus Z.AI untuk thinking yang dipertahankan. Saat diaktifkan dan thinking aktif, OpenClaw mengirim `thinking.clear_thinking: false` dan memutar ulang `reasoning_content` sebelumnya; lihat [thinking Z.AI dan thinking yang dipertahankan](/id/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: kebijakan runtime agen tingkat rendah default. Id yang dihilangkan default ke OpenClaw Pi. Gunakan `id: "pi"` untuk memaksa harness PI bawaan, `id: "auto"` untuk membiarkan harness Plugin terdaftar mengklaim model yang didukung, id harness terdaftar seperti `id: "codex"`, atau alias backend CLI yang didukung seperti `id: "claude-cli"`. Atur `fallback: "none"` untuk menonaktifkan fallback PI otomatis. Runtime Plugin eksplisit seperti `codex` gagal tertutup secara default kecuali Anda mengatur `fallback: "pi"` dalam scope override yang sama. Pertahankan referensi model kanonis sebagai `provider/model`; pilih Codex, Claude CLI, Gemini CLI, dan backend eksekusi lainnya melalui konfigurasi runtime, bukan prefiks penyedia runtime lama. Lihat [Runtime agen](/id/concepts/agent-runtimes) untuk perbedaannya dari pemilihan penyedia/model.
- Penulis konfigurasi yang memutasi field ini (misalnya `/models set`, `/models set-image`, dan perintah tambah/hapus fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang ada bila memungkinkan.
- `maxConcurrent`: jumlah maksimum run agen paralel di seluruh sesi (setiap sesi tetap diserialkan). Default: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` mengontrol eksekutor tingkat rendah mana yang menjalankan giliran agen. Sebagian besar
deployment sebaiknya mempertahankan runtime OpenClaw Pi default. Gunakan ini ketika Plugin tepercaya
menyediakan harness native, seperti harness app-server Codex bawaan,
atau ketika Anda menginginkan backend CLI yang didukung seperti Claude CLI. Untuk model
mental, lihat [Runtime agen](/id/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, id harness Plugin terdaftar, atau alias backend CLI yang didukung. Plugin Codex bawaan mendaftarkan `codex`; Plugin Anthropic bawaan menyediakan backend CLI `claude-cli`.
- `fallback`: `"pi"` atau `"none"`. Dalam `id: "auto"`, fallback yang dihilangkan default ke `"pi"` sehingga konfigurasi lama dapat tetap menggunakan PI ketika tidak ada harness Plugin yang mengklaim sebuah run. Dalam mode runtime Plugin eksplisit, seperti `id: "codex"`, fallback yang dihilangkan default ke `"none"` sehingga harness yang hilang gagal alih-alih diam-diam menggunakan PI. Override runtime tidak mewarisi fallback dari scope yang lebih luas; atur `fallback: "pi"` bersama runtime eksplisit ketika Anda sengaja menginginkan fallback kompatibilitas tersebut. Kegagalan harness Plugin yang dipilih selalu ditampilkan secara langsung.
- Override lingkungan: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` menimpa `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` menimpa fallback untuk proses tersebut.
- Untuk deployment khusus Codex, atur `model: "openai/gpt-5.5"` dan `agentRuntime.id: "codex"`. Anda juga dapat mengatur `agentRuntime.fallback: "none"` secara eksplisit untuk keterbacaan; itu adalah default untuk runtime Plugin eksplisit.
- Untuk deployment Claude CLI, utamakan `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Referensi model lama `claude-cli/claude-opus-4-7` masih berfungsi untuk kompatibilitas, tetapi konfigurasi baru harus mempertahankan pemilihan penyedia/model tetap kanonis dan menempatkan backend eksekusi di `agentRuntime.id`.
- Kunci kebijakan runtime lama ditulis ulang ke `agentRuntime` oleh `openclaw doctor --fix`.
- Pilihan harness dipin per id sesi setelah run tertanam pertama. Perubahan konfigurasi/env memengaruhi sesi baru atau yang direset, bukan transkrip yang sudah ada. Sesi lama dengan riwayat transkrip tetapi tanpa pin tercatat diperlakukan sebagai dipin ke PI. `/status` melaporkan runtime efektif, misalnya `Runtime: OpenClaw Pi Default` atau `Runtime: OpenAI Codex`.
- Ini hanya mengontrol eksekusi giliran agen teks. Pembuatan media, vision, PDF, musik, video, dan TTS tetap menggunakan pengaturan penyedia/model masing-masing.

**Pintasan alias bawaan** (hanya berlaku ketika model ada di `agents.defaults.models`):

| Alias               | Model                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Alias yang Anda konfigurasikan selalu diutamakan daripada default.

Model Z.AI GLM-4.x secara otomatis mengaktifkan mode berpikir kecuali Anda mengatur `--thinking off` atau mendefinisikan sendiri `agents.defaults.models["zai/<model>"].params.thinking`.
Model Z.AI mengaktifkan `tool_stream` secara default untuk streaming panggilan alat. Atur `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Model Anthropic Claude 4.6 menggunakan berpikir `adaptive` secara default saat tidak ada level berpikir eksplisit yang ditetapkan.

### `agents.defaults.cliBackends`

Backend CLI opsional untuk proses fallback khusus teks (tanpa panggilan alat). Berguna sebagai cadangan ketika penyedia API gagal.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backend CLI mengutamakan teks; alat selalu dinonaktifkan.
- Sesi didukung ketika `sessionArg` ditetapkan.
- Penerusan gambar didukung ketika `imageArg` menerima jalur file.

### `agents.defaults.systemPromptOverride`

Ganti seluruh prompt sistem yang dirakit OpenClaw dengan string tetap. Atur pada level default (`agents.defaults.systemPromptOverride`) atau per agen (`agents.list[].systemPromptOverride`). Nilai per agen diprioritaskan; nilai kosong atau hanya spasi putih diabaikan. Berguna untuk eksperimen prompt yang terkontrol.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Overlay prompt independen penyedia yang diterapkan menurut keluarga model. ID model keluarga GPT-5 menerima kontrak perilaku bersama lintas penyedia; `personality` hanya mengontrol lapisan gaya interaksi yang ramah.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (default) dan `"on"` mengaktifkan lapisan gaya interaksi yang ramah.
- `"off"` hanya menonaktifkan lapisan ramah; kontrak perilaku GPT-5 bertag tetap aktif.
- `plugins.entries.openai.config.personality` lama masih dibaca ketika pengaturan bersama ini belum ditetapkan.

### `agents.defaults.heartbeat`

Proses Heartbeat berkala.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: string durasi (ms/s/m/h). Default: `30m` (autentikasi kunci API) atau `1h` (autentikasi OAuth). Atur ke `0m` untuk menonaktifkan.
- `includeSystemPromptSection`: ketika false, menghilangkan bagian Heartbeat dari prompt sistem dan melewati injeksi `HEARTBEAT.md` ke konteks bootstrap. Default: `true`.
- `suppressToolErrorWarnings`: ketika true, menekan payload peringatan kesalahan alat selama proses Heartbeat.
- `timeoutSeconds`: waktu maksimum dalam detik yang diizinkan untuk giliran agen Heartbeat sebelum dibatalkan. Biarkan tidak ditetapkan untuk menggunakan `agents.defaults.timeoutSeconds`.
- `directPolicy`: kebijakan pengiriman langsung/DM. `allow` (default) mengizinkan pengiriman target langsung. `block` menekan pengiriman target langsung dan memancarkan `reason=dm-blocked`.
- `lightContext`: ketika true, proses Heartbeat menggunakan konteks bootstrap ringan dan hanya menyimpan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: ketika true, setiap Heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasi yang sama seperti cron `sessionTarget: "isolated"`. Mengurangi biaya token per Heartbeat dari ~100K menjadi ~2-5K token.
- `skipWhenBusy`: ketika true, proses Heartbeat ditunda pada lane sibuk tambahan: pekerjaan subagen atau perintah bertingkat. Lane Cron selalu menunda Heartbeat, bahkan tanpa flag ini.
- Per agen: atur `agents.list[].heartbeat`. Ketika agen mana pun mendefinisikan `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat.
- Heartbeat menjalankan giliran agen penuh — interval yang lebih pendek menghabiskan lebih banyak token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` atau `safeguard` (peringkasan bertahap untuk riwayat panjang). Lihat [Compaction](/id/concepts/compaction).
- `provider`: ID Plugin penyedia Compaction yang terdaftar. Ketika ditetapkan, `summarize()` milik penyedia dipanggil, bukan peringkasan LLM bawaan. Kembali ke bawaan jika gagal. Menetapkan penyedia memaksa `mode: "safeguard"`. Lihat [Compaction](/id/concepts/compaction).
- `timeoutSeconds`: detik maksimum yang diizinkan untuk satu operasi Compaction sebelum OpenClaw membatalkannya. Default: `900`.
- `keepRecentTokens`: anggaran titik potong Pi untuk menyimpan ekor transkrip terbaru secara verbatim. `/compact` manual menghormati ini ketika ditetapkan secara eksplisit; jika tidak, Compaction manual adalah checkpoint keras.
- `identifierPolicy`: `strict` (default), `off`, atau `custom`. `strict` menambahkan panduan retensi pengenal buram bawaan di awal selama peringkasan Compaction.
- `identifierInstructions`: teks kustom opsional untuk pelestarian pengenal yang digunakan ketika `identifierPolicy=custom`.
- `qualityGuard`: pemeriksaan coba-ulang-saat-output-salah-format untuk ringkasan safeguard. Diaktifkan secara default dalam mode safeguard; atur `enabled: false` untuk melewati audit.
- `midTurnPrecheck`: pemeriksaan tekanan tool-loop Pi opsional. Ketika `enabled: true`, OpenClaw memeriksa tekanan konteks setelah hasil alat ditambahkan dan sebelum panggilan model berikutnya. Jika konteks tidak lagi muat, OpenClaw membatalkan percobaan saat ini sebelum mengirimkan prompt dan menggunakan kembali jalur pemulihan precheck yang ada untuk memangkas hasil alat atau melakukan compact lalu mencoba lagi. Bekerja dengan mode Compaction `default` maupun `safeguard`. Default: dinonaktifkan.
- `postCompactionSections`: nama bagian H2/H3 AGENTS.md opsional untuk disuntikkan ulang setelah Compaction. Default ke `["Session Startup", "Red Lines"]`; atur `[]` untuk menonaktifkan penyuntikan ulang. Ketika tidak ditetapkan atau secara eksplisit ditetapkan ke pasangan default tersebut, heading `Every Session`/`Safety` lama juga diterima sebagai fallback legacy.
- `model`: override `provider/model-id` opsional hanya untuk peringkasan Compaction. Gunakan ini ketika sesi utama harus mempertahankan satu model tetapi ringkasan Compaction harus berjalan pada model lain; ketika tidak ditetapkan, Compaction menggunakan model utama sesi.
- `maxActiveTranscriptBytes`: ambang byte opsional (`number` atau string seperti `"20mb"`) yang memicu Compaction lokal normal sebelum proses ketika JSONL aktif tumbuh melewati ambang. Memerlukan `truncateAfterCompaction` agar Compaction yang berhasil dapat merotasi ke transkrip penerus yang lebih kecil. Dinonaktifkan ketika tidak ditetapkan atau `0`.
- `notifyUser`: ketika `true`, mengirim pemberitahuan singkat kepada pengguna saat Compaction dimulai dan saat selesai (misalnya, "Compacting context..." dan "Compaction complete"). Dinonaktifkan secara default agar Compaction tetap senyap.
- `memoryFlush`: giliran agentic senyap sebelum Compaction otomatis untuk menyimpan memori tahan lama. Atur `model` ke penyedia/model persis seperti `ollama/qwen3:8b` ketika giliran pemeliharaan ini harus tetap pada model lokal; override tidak mewarisi rantai fallback sesi aktif. Dilewati ketika workspace bersifat baca-saja.

### `agents.defaults.contextPruning`

Memangkas **hasil alat lama** dari konteks dalam memori sebelum mengirim ke LLM. **Tidak** mengubah riwayat sesi di disk.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Perilaku mode cache-ttl">

- `mode: "cache-ttl"` mengaktifkan proses pemangkasan.
- `ttl` mengontrol seberapa sering pemangkasan dapat berjalan lagi (setelah sentuhan cache terakhir).
- Pemangkasan pertama-tama melakukan soft-trim pada hasil alat yang terlalu besar, lalu hard-clear pada hasil alat yang lebih lama jika diperlukan.

**Soft-trim** mempertahankan awal + akhir dan menyisipkan `...` di tengah.

**Hard-clear** mengganti seluruh hasil alat dengan placeholder.

Catatan:

- Blok gambar tidak pernah dipangkas/dibersihkan.
- Rasio berbasis karakter (perkiraan), bukan jumlah token persis.
- Jika ada kurang dari `keepLastAssistants` pesan asisten, pemangkasan dilewati.

</Accordion>

Lihat [Pemangkasan Sesi](/id/concepts/session-pruning) untuk detail perilaku.

### Streaming blok

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Channel non-Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
- Penggantian channel: `channels.<channel>.blockStreamingCoalesce` (dan varian per akun). Signal/Slack/Discord/Google Chat default `minChars: 1500`.
- `humanDelay`: jeda acak di antara balasan blok. `natural` = 800–2500md. Penggantian per agen: `agents.list[].humanDelay`.

Lihat [Pengaliran](/id/concepts/streaming) untuk detail perilaku + pemotongan chunk.

### Indikator pengetikan

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Default: `instant` untuk chat langsung/mention, `message` untuk chat grup yang tidak di-mention.
- Penggantian per sesi: `session.typingMode`, `session.typingIntervalSeconds`.

Lihat [Indikator Pengetikan](/id/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opsional untuk agen tertanam. Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detail sandbox">

**Backend:**

- `docker`: runtime Docker lokal (default)
- `ssh`: runtime jarak jauh generik berbasis SSH
- `openshell`: runtime OpenShell

Saat `backend: "openshell"` dipilih, pengaturan khusus runtime pindah ke
`plugins.entries.openshell.config`.

**Konfigurasi backend SSH:**

- `target`: target SSH dalam bentuk `user@host[:port]`
- `command`: perintah klien SSH (default: `ssh`)
- `workspaceRoot`: root jarak jauh absolut yang digunakan untuk workspace per cakupan
- `identityFile` / `certificateFile` / `knownHostsFile`: file lokal yang ada dan diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: konten sebaris atau SecretRefs yang diwujudkan OpenClaw menjadi file sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: kenop kebijakan kunci host OpenSSH

**Presedensi autentikasi SSH:**

- `identityData` mengalahkan `identityFile`
- `certificateData` mengalahkan `certificateFile`
- `knownHostsData` mengalahkan `knownHostsFile`
- Nilai `*Data` berbasis SecretRef diselesaikan dari snapshot runtime rahasia aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- menanamkan workspace jarak jauh sekali setelah dibuat atau dibuat ulang
- lalu mempertahankan workspace SSH jarak jauh sebagai kanonis
- merutekan `exec`, alat file, dan jalur media melalui SSH
- tidak menyinkronkan perubahan jarak jauh kembali ke host secara otomatis
- tidak mendukung kontainer browser sandbox

**Akses workspace:**

- `none`: workspace sandbox per cakupan di bawah `~/.openclaw/sandboxes`
- `ro`: workspace sandbox di `/workspace`, workspace agen dipasang hanya-baca di `/agent`
- `rw`: workspace agen dipasang baca/tulis di `/workspace`

**Cakupan:**

- `session`: kontainer + workspace per sesi
- `agent`: satu kontainer + workspace per agen (default)
- `shared`: kontainer dan workspace bersama (tanpa isolasi lintas sesi)

**Konfigurasi Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Mode OpenShell:**

- `mirror`: tanamkan jarak jauh dari lokal sebelum exec, sinkronkan kembali setelah exec; workspace lokal tetap kanonis
- `remote`: tanamkan jarak jauh sekali saat sandbox dibuat, lalu pertahankan workspace jarak jauh sebagai kanonis

Dalam mode `remote`, edit lokal host yang dibuat di luar OpenClaw tidak disinkronkan ke sandbox secara otomatis setelah langkah penanaman.
Transportnya adalah SSH ke sandbox OpenShell, tetapi Plugin memiliki siklus hidup sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** berjalan sekali setelah pembuatan kontainer (melalui `sh -lc`). Membutuhkan egress jaringan, root yang dapat ditulis, pengguna root.

**Kontainer default ke `network: "none"`** — atur ke `"bridge"` (atau jaringan bridge kustom) jika agen membutuhkan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda secara eksplisit mengatur
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Lampiran masuk** ditempatkan ke `media/inbound/*` di workspace aktif.

**`docker.binds`** memasang direktori host tambahan; bind global dan per agen digabungkan.

**Browser sandbox** (`sandbox.browser.enabled`): Chromium + CDP dalam kontainer. URL noVNC disisipkan ke prompt sistem. Tidak memerlukan `browser.enabled` di `openclaw.json`.
Akses pengamat noVNC menggunakan autentikasi VNC secara default dan OpenClaw memancarkan URL token berumur pendek (alih-alih mengekspos kata sandi di URL bersama).

- `allowHostControl: false` (default) memblokir sesi sandbox agar tidak menargetkan browser host.
- `network` default ke `openclaw-sandbox-browser` (jaringan bridge khusus). Atur ke `bridge` hanya saat Anda secara eksplisit menginginkan konektivitas bridge global.
- `cdpSourceRange` secara opsional membatasi ingress CDP di tepi kontainer ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` memasang direktori host tambahan hanya ke kontainer browser sandbox. Saat diatur (termasuk `[]`), ini menggantikan `docker.binds` untuk kontainer browser.
- Default peluncuran didefinisikan di `scripts/sandbox-browser-entrypoint.sh` dan disetel untuk host kontainer:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (diaktifkan secara default)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, dan `--disable-gpu`
    diaktifkan secara default dan dapat dinonaktifkan dengan
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika penggunaan WebGL/3D memerlukannya.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` mengaktifkan kembali ekstensi jika alur kerja Anda
    bergantung padanya.
  - `--renderer-process-limit=2` dapat diubah dengan
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; atur `0` untuk menggunakan batas proses
    default Chromium.
  - ditambah `--no-sandbox` saat `noSandbox` diaktifkan.
  - Default adalah baseline citra kontainer; gunakan citra browser kustom dengan
    entrypoint kustom untuk mengubah default kontainer.

</Accordion>

Sandboxing browser dan `sandbox.docker.binds` hanya untuk Docker.

Bangun citra:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (penggantian per agen)

Gunakan `agents.list[].tts` untuk memberi agen penyedia TTS, suara, model,
gaya, atau mode TTS otomatisnya sendiri. Blok agen melakukan deep-merge di atas
`messages.tts` global, sehingga kredensial bersama dapat tetap di satu tempat sementara masing-masing
agen hanya mengganti bidang suara atau penyedia yang mereka butuhkan. Penggantian agen aktif
berlaku untuk balasan lisan otomatis, `/tts audio`, `/tts status`, dan
alat agen `tts`. Lihat [Teks-ke-ucapan](/id/tools/tts#per-agent-voice-overrides)
untuk contoh penyedia dan presedensi.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id agen stabil (wajib).
- `default`: ketika beberapa ditetapkan, yang pertama menang (peringatan dicatat). Jika tidak ada yang ditetapkan, entri daftar pertama menjadi default.
- `model`: bentuk string menetapkan primary ketat per agen tanpa fallback model; bentuk objek `{ primary }` juga ketat kecuali Anda menambahkan `fallbacks`. Gunakan `{ primary, fallbacks: [...] }` untuk mengaktifkan fallback pada agen tersebut, atau `{ primary, fallbacks: [] }` untuk membuat perilaku ketat menjadi eksplisit. Tugas Cron yang hanya mengganti `primary` tetap mewarisi fallback default kecuali Anda menetapkan `fallbacks: []`.
- `params`: parameter stream per agen yang digabungkan di atas entri model terpilih dalam `agents.defaults.models`. Gunakan ini untuk override khusus agen seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `tts`: override text-to-speech opsional per agen. Blok ini digabungkan secara mendalam di atas `messages.tts`, jadi simpan kredensial penyedia bersama dan kebijakan fallback di `messages.tts`, lalu tetapkan hanya nilai khusus persona seperti penyedia, suara, model, gaya, atau mode otomatis di sini.
- `skills`: allowlist Skills opsional per agen. Jika dihilangkan, agen mewarisi `agents.defaults.skills` ketika ditetapkan; daftar eksplisit menggantikan default alih-alih menggabungkannya, dan `[]` berarti tanpa Skills.
- `thinkingDefault`: level berpikir default opsional per agen (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mengganti `agents.defaults.thinkingDefault` untuk agen ini ketika tidak ada override per pesan atau sesi yang ditetapkan. Profil penyedia/model yang dipilih mengontrol nilai mana yang valid; untuk Google Gemini, `adaptive` mempertahankan dynamic thinking milik penyedia (`thinkingLevel` dihilangkan pada Gemini 3/3.1, `thinkingBudget: -1` pada Gemini 2.5).
- `reasoningDefault`: visibilitas penalaran default opsional per agen (`on | off | stream`). Mengganti `agents.defaults.reasoningDefault` untuk agen ini ketika tidak ada override penalaran per pesan atau sesi yang ditetapkan.
- `fastModeDefault`: default opsional per agen untuk mode cepat (`true | false`). Berlaku ketika tidak ada override mode cepat per pesan atau sesi yang ditetapkan.
- `agentRuntime`: override kebijakan runtime tingkat rendah opsional per agen. Gunakan `{ id: "codex" }` untuk membuat satu agen hanya Codex sementara agen lain tetap menggunakan fallback PI default dalam mode `auto`.
- `runtime`: deskriptor runtime opsional per agen. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) ketika agen harus default ke sesi harness ACP.
- `identity.avatar`: path relatif workspace, URL `http(s)`, atau URI `data:`.
- `identity` menurunkan default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: allowlist id agen untuk target eksplisit `sessions_spawn.agentId` (`["*"]` = apa pun; default: hanya agen yang sama). Sertakan id peminta ketika panggilan `agentId` yang menargetkan diri sendiri harus diizinkan.
- Pelindung pewarisan sandbox: jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: ketika true, blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).

---

## Perutean multi-agen

Jalankan beberapa agen terisolasi di dalam satu Gateway. Lihat [Multi-Agent](/id/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Kolom kecocokan binding

- `type` (opsional): `route` untuk perutean normal (type yang hilang default ke route), `acp` untuk binding percakapan ACP persisten.
- `match.channel` (wajib)
- `match.accountId` (opsional; `*` = akun apa pun; dihilangkan = akun default)
- `match.peer` (opsional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opsional; khusus channel)
- `acp` (opsional; hanya untuk `type: "acp"`): `{ mode, label, cwd, backend }`

**Urutan kecocokan deterministik:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tepat, tanpa peer/guild/team)
5. `match.accountId: "*"` (seluruh channel)
6. Agen default

Dalam setiap tingkat, entri `bindings` pertama yang cocok menang.

Untuk entri `type: "acp"`, OpenClaw menyelesaikan berdasarkan identitas percakapan yang tepat (`match.channel` + akun + `match.peer.id`) dan tidak menggunakan urutan tingkat binding route di atas.

### Profil akses per agen

<Accordion title="Akses penuh (tanpa sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Alat baca-saja + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Tanpa akses sistem file (hanya perpesanan)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Lihat [Sandbox & Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) untuk detail presedensi.

---

## Sesi

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detail kolom sesi">

- **`scope`**: strategi pengelompokan sesi dasar untuk konteks obrolan grup.
  - `per-sender` (default): setiap pengirim mendapatkan sesi terisolasi dalam konteks channel.
  - `global`: semua peserta dalam konteks channel berbagi satu sesi (gunakan hanya ketika konteks bersama memang dimaksudkan).
- **`dmScope`**: cara DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: isolasi berdasarkan id pengirim di seluruh channel.
  - `per-channel-peer`: isolasi per channel + pengirim (direkomendasikan untuk kotak masuk multi-pengguna).
  - `per-account-channel-peer`: isolasi per akun + channel + pengirim (direkomendasikan untuk multi-akun).
- **`identityLinks`**: petakan id kanonis ke peer berprefiks penyedia untuk berbagi sesi lintas channel. Perintah dock seperti `/dock_discord` menggunakan peta yang sama untuk mengalihkan rute balasan sesi aktif ke peer channel tertaut lain; lihat [Docking channel](/id/concepts/channel-docking).
- **`reset`**: kebijakan reset utama. `daily` mereset pada waktu lokal `atHour`; `idle` mereset setelah `idleMinutes`. Jika keduanya dikonfigurasi, yang kedaluwarsa lebih dulu akan berlaku. Kesegaran reset harian menggunakan `sessionStartedAt` milik baris sesi; kesegaran reset idle menggunakan `lastInteractionAt`. Penulisan latar belakang/peristiwa sistem seperti Heartbeat, pemicuan Cron, notifikasi exec, dan pembukuan Gateway dapat memperbarui `updatedAt`, tetapi itu tidak membuat sesi harian/idle tetap segar.
- **`resetByType`**: override per jenis (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`parentForkMaxTokens`**: `totalTokens` sesi induk maksimum yang diizinkan saat membuat sesi thread fork (default `100000`).
  - Jika `totalTokens` induk berada di atas nilai ini, OpenClaw memulai sesi thread baru alih-alih mewarisi riwayat transkrip induk.
  - Atur `0` untuk menonaktifkan pengaman ini dan selalu mengizinkan forking induk.
- **`mainKey`**: bidang lama. Runtime selalu menggunakan `"main"` untuk bucket obrolan langsung utama.
- **`agentToAgent.maxPingPongTurns`**: jumlah maksimum giliran balas-balik antar agent selama pertukaran agent-ke-agent (bilangan bulat, rentang: `0`–`5`). `0` menonaktifkan perangkaian ping-pong.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Penolakan pertama berlaku.
- **`maintenance`**: pembersihan session-store + kontrol retensi.
  - `mode`: `warn` hanya memunculkan peringatan; `enforce` menerapkan pembersihan.
  - `pruneAfter`: batas usia untuk entri basi (default `30d`).
  - `maxEntries`: jumlah maksimum entri dalam `sessions.json` (default `500`). Runtime menulis pembersihan batch dengan buffer high-water kecil untuk batas berukuran produksi; `openclaw sessions cleanup --enforce` menerapkan batas tersebut segera.
  - `rotateBytes`: tidak digunakan lagi dan diabaikan; `openclaw doctor --fix` menghapusnya dari konfigurasi lama.
  - `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>`. Default ke `pruneAfter`; atur `false` untuk menonaktifkan.
  - `maxDiskBytes`: anggaran disk direktori sesi opsional. Dalam mode `warn`, ini mencatat peringatan; dalam mode `enforce`, ini menghapus artefak/sesi tertua terlebih dahulu.
  - `highWaterBytes`: target opsional setelah pembersihan anggaran. Default ke `80%` dari `maxDiskBytes`.
- **`threadBindings`**: default global untuk fitur sesi yang terikat thread.
  - `enabled`: sakelar default utama (penyedia dapat meng-override; Discord menggunakan `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus inaktivitas default dalam jam (`0` menonaktifkan; penyedia dapat meng-override)
  - `maxAgeHours`: batas usia maksimum keras default dalam jam (`0` menonaktifkan; penyedia dapat meng-override)

</Accordion>

---

## Pesan

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks respons

Override per channel/akun: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik berlaku): akun → channel → global. `""` menonaktifkan dan menghentikan kaskade. `"auto"` menghasilkan `[{identity.name}]`.

**Variabel template:**

| Variabel          | Deskripsi            | Contoh                      |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | Nama model pendek    | `claude-opus-4-6`           |
| `{modelFull}`     | Pengidentifikasi model lengkap | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama penyedia        | `anthropic`                 |
| `{thinkingLevel}` | Level berpikir saat ini | `high`, `low`, `off`        |
| `{identity.name}` | Nama identitas agent | (sama seperti `"auto"`)     |

Variabel tidak peka huruf besar-kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi ack

- Default ke `identity.emoji` agent aktif, jika tidak ada `"👀"`. Atur `""` untuk menonaktifkan.
- Override per channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: akun → channel → `messages.ackReaction` → fallback identitas.
- Cakupan: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: menghapus ack setelah balasan pada channel yang mendukung reaksi seperti Slack, Discord, Telegram, WhatsApp, dan BlueBubbles.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status siklus hidup pada Slack, Discord, dan Telegram.
  Pada Slack dan Discord, nilai yang tidak diatur membuat reaksi status tetap aktif saat reaksi ack aktif.
  Pada Telegram, atur secara eksplisit ke `true` untuk mengaktifkan reaksi status siklus hidup.

### Debounce masuk

Menggabungkan pesan teks saja yang cepat dari pengirim yang sama menjadi satu giliran agent. Media/lampiran langsung mem-flush. Perintah kontrol melewati debouncing.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` mengontrol mode auto-TTS default: `off`, `always`, `inbound`, atau `tagged`. `/tts on|off` dapat meng-override pref lokal, dan `/tts status` menampilkan status efektif.
- `summaryModel` meng-override `agents.defaults.model.primary` untuk auto-summary.
- `modelOverrides` diaktifkan secara default; `modelOverrides.allowProvider` default ke `false` (opt-in).
- Kunci API fallback ke `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY`.
- Penyedia speech bawaan dimiliki Plugin. Jika `plugins.allow` diatur, sertakan setiap Plugin penyedia TTS yang ingin Anda gunakan, misalnya `microsoft` untuk Edge TTS. Id penyedia lama `edge` diterima sebagai alias untuk `microsoft`.
- `providers.openai.baseUrl` meng-override endpoint OpenAI TTS. Urutan resolusi adalah konfigurasi, lalu `OPENAI_TTS_BASE_URL`, lalu `https://api.openai.com/v1`.
- Saat `providers.openai.baseUrl` mengarah ke endpoint non-OpenAI, OpenClaw memperlakukannya sebagai server TTS yang kompatibel dengan OpenAI dan melonggarkan validasi model/voice.

---

## Talk

Default untuk mode Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` harus cocok dengan kunci dalam `talk.providers` saat beberapa penyedia Talk dikonfigurasi.
- Kunci Talk datar lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas dan otomatis dimigrasikan ke `talk.providers.<provider>`.
- Voice ID fallback ke `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID`.
- `providers.*.apiKey` menerima string plaintext atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku saat tidak ada kunci API Talk yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan directive Talk menggunakan nama ramah.
- `providers.mlx.modelId` memilih repo Hugging Face yang digunakan oleh helper MLX lokal macOS. Jika dihilangkan, macOS menggunakan `mlx-community/Soprano-80M-bf16`.
- Playback MLX macOS berjalan melalui helper `openclaw-mlx-tts` bawaan saat ada, atau executable pada `PATH`; `OPENCLAW_MLX_TTS_BIN` meng-override jalur helper untuk pengembangan.
- `speechLocale` mengatur id lokal BCP 47 yang digunakan oleh pengenalan ucapan Talk iOS/macOS. Biarkan tidak diatur untuk menggunakan default perangkat.
- `silenceTimeoutMs` mengontrol berapa lama mode Talk menunggu setelah pengguna diam sebelum mengirim transkrip. Tidak diatur mempertahankan jendela jeda default platform (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — semua kunci konfigurasi lain
- [Konfigurasi](/id/gateway/configuration) — tugas umum dan penyiapan cepat
- [Contoh konfigurasi](/id/gateway/configuration-examples)

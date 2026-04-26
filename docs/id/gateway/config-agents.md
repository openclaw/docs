---
read_when:
    - Menyetel default agent (model, thinking, workspace, Heartbeat, media, Skills)
    - Mengonfigurasi perutean dan binding multi-agent
    - Menyesuaikan perilaku sesi, pengiriman pesan, dan mode talk
summary: Default agent, perutean multi-agent, sesi, pesan, dan konfigurasi talk
title: Konfigurasi — agent
x-i18n:
    generated_at: "2026-04-26T11:28:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

Kunci konfigurasi bercakupan agent di bawah `agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, dan `talk.*`. Untuk saluran, alat, runtime Gateway, dan kunci level atas lainnya,
lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Default agent

### `agents.defaults.workspace`

Default: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan pada baris Runtime di prompt sistem. Jika tidak disetel, OpenClaw mendeteksi secara otomatis dengan menelusuri ke atas dari workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist Skills default opsional untuk agent yang tidak menyetel
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // mewarisi github, weather
      { id: "docs", skills: ["docs-search"] }, // menggantikan default
      { id: "locked-down", skills: [] }, // tanpa Skills
    ],
  },
}
```

- Hilangkan `agents.defaults.skills` untuk Skills tak terbatas secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi default.
- Setel `agents.list[].skills: []` untuk tanpa Skills.
- Daftar `agents.list[].skills` yang tidak kosong adalah set final untuk agent tersebut; daftar ini
  tidak digabungkan dengan default.

### `agents.defaults.skipBootstrap`

Menonaktifkan pembuatan otomatis file bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Mengontrol kapan file bootstrap workspace disuntikkan ke prompt sistem. Default: `"always"`.

- `"continuation-skip"`: giliran lanjutan yang aman (setelah respons assistant selesai) melewati penyuntikan ulang bootstrap workspace, sehingga mengurangi ukuran prompt. Run Heartbeat dan percobaan ulang pasca-Compaction tetap membangun ulang konteks.
- `"never"`: menonaktifkan penyuntikan bootstrap workspace dan file konteks pada setiap giliran. Gunakan ini hanya untuk agent yang sepenuhnya memiliki siklus hidup prompt mereka sendiri (mesin konteks kustom, runtime bawaan yang membangun konteksnya sendiri, atau alur kerja khusus tanpa bootstrap). Giliran Heartbeat dan pemulihan Compaction juga melewati penyuntikan.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Jumlah karakter maksimum per file bootstrap workspace sebelum dipotong. Default: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Jumlah karakter total maksimum yang disuntikkan di semua file bootstrap workspace. Default: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Mengontrol teks peringatan yang terlihat oleh agent ketika konteks bootstrap dipotong.
Default: `"once"`.

- `"off"`: jangan pernah menyuntikkan teks peringatan ke prompt sistem.
- `"once"`: suntikkan peringatan sekali per signature pemotongan unik (disarankan).
- `"always"`: suntikkan peringatan pada setiap run ketika ada pemotongan.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Peta kepemilikan anggaran konteks

OpenClaw memiliki beberapa anggaran prompt/konteks bervolume tinggi, dan semuanya
sengaja dibagi menurut subsistem alih-alih dialirkan melalui satu
knob generik.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  penyuntikan bootstrap workspace normal.
- `agents.defaults.startupContext.*`:
  prelude startup sekali pakai untuk `/new` dan `/reset`, termasuk file
  `memory/*.md` harian terbaru.
- `skills.limits.*`:
  daftar Skills ringkas yang disuntikkan ke prompt sistem.
- `agents.defaults.contextLimits.*`:
  kutipan runtime yang dibatasi dan blok milik runtime yang disuntikkan.
- `memory.qmd.limits.*`:
  ukuran cuplikan pencarian memori terindeks dan penyuntikannya.

Gunakan override per-agent yang sesuai hanya ketika satu agent memerlukan
anggaran yang berbeda:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Mengontrol prelude startup giliran pertama yang disuntikkan pada run `/new` dan `/reset`
tanpa argumen.

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

Default bersama untuk surface konteks runtime yang dibatasi.

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

- `memoryGetMaxChars`: batas kutipan default `memory_get` sebelum metadata pemotongan
  dan pemberitahuan kelanjutan ditambahkan.
- `memoryGetDefaultLines`: jendela baris default `memory_get` saat `lines`
  dihilangkan.
- `toolResultMaxChars`: batas hasil tool live yang digunakan untuk hasil yang dipersistenkan dan
  pemulihan overflow.
- `postCompactionMaxChars`: batas kutipan AGENTS.md yang digunakan selama penyuntikan refresh pasca-Compaction.

#### `agents.list[].contextLimits`

Override per-agent untuk knob `contextLimits` bersama. Field yang dihilangkan mewarisi
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

Override per-agent untuk anggaran prompt Skills.

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

Ukuran piksel maksimum untuk sisi gambar terpanjang dalam blok gambar transkrip/tool sebelum panggilan provider.
Default: `1200`.

Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload permintaan untuk run yang banyak tangkapan layar.
Nilai yang lebih tinggi mempertahankan lebih banyak detail visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zona waktu untuk konteks prompt sistem (bukan stempel waktu pesan). Fallback ke zona waktu host.

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
      params: { cacheRetention: "long" }, // parameter provider default global
      agentRuntime: {
        id: "pi", // pi | auto | id harness terdaftar, misalnya codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - Bentuk string hanya menetapkan model primary.
  - Bentuk objek menetapkan model primary plus model failover berurutan.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh jalur tool `image` sebagai konfigurasi model vision.
  - Juga digunakan sebagai perutean fallback ketika model yang dipilih/default tidak dapat menerima input gambar.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan gambar bersama dan surface tool/Plugin mendatang yang menghasilkan gambar.
  - Nilai umum: `google/gemini-3.1-flash-image-preview` untuk pembuatan gambar Gemini bawaan, `fal/fal-ai/flux/dev` untuk fal, `openai/gpt-image-2` untuk OpenAI Images, atau `openai/gpt-image-1.5` untuk output PNG/WebP OpenAI dengan latar belakang transparan.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga autentikasi provider yang cocok (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` atau OAuth OpenAI Codex untuk `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` masih dapat menyimpulkan default provider yang didukung autentikasi. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan gambar terdaftar lainnya dalam urutan id provider.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan musik bersama dan tool bawaan `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.6`.
  - Jika dihilangkan, `music_generate` masih dapat menyimpulkan default provider yang didukung autentikasi. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan musik terdaftar lainnya dalam urutan id provider.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga autentikasi/API key provider yang cocok.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan video bersama dan tool bawaan `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` masih dapat menyimpulkan default provider yang didukung autentikasi. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan video terdaftar lainnya dalam urutan id provider.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga autentikasi/API key provider yang cocok.
  - Provider pembuatan video Qwen bawaan mendukung hingga 1 video output, 1 gambar input, 4 video input, durasi 10 detik, dan opsi tingkat provider `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh tool `pdf` untuk perutean model.
  - Jika dihilangkan, tool PDF melakukan fallback ke `imageModel`, lalu ke model sesi/default yang telah di-resolve.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk tool `pdf` ketika `maxBytesMb` tidak diberikan saat pemanggilan.
- `pdfMaxPages`: jumlah halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi dalam tool `pdf`.
- `verboseDefault`: level verbose default untuk agent. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `elevatedDefault`: level output elevated default untuk agent. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (misalnya `openai/gpt-5.5` untuk akses API key atau `openai-codex/gpt-5.5` untuk OAuth Codex). Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan provider yang dikonfigurasi dan unik untuk ID model persis tersebut, dan baru kemudian fallback ke provider default yang dikonfigurasi (perilaku kompatibilitas yang sudah deprecated, jadi lebih baik gunakan `provider/model` eksplisit). Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw fallback ke provider/model pertama yang dikonfigurasi alih-alih menampilkan default provider yang dihapus dan basi.
- `models`: katalog model yang dikonfigurasi dan allowlist untuk `/model`. Setiap entri dapat menyertakan `alias` (shortcut) dan `params` (khusus provider, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Pengeditan aman: gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri. `config set` menolak penggantian yang akan menghapus entri allowlist yang ada kecuali Anda memberikan `--replace`.
  - Alur configure/onboarding bercakupan provider menggabungkan model provider yang dipilih ke dalam map ini dan mempertahankan provider tak terkait yang sudah dikonfigurasi.
  - Untuk model OpenAI Responses langsung, Compaction sisi server diaktifkan secara otomatis. Gunakan `params.responsesServerCompaction: false` untuk berhenti menyuntikkan `context_management`, atau `params.responsesCompactThreshold` untuk menimpa ambangnya. Lihat [Compaction sisi server OpenAI](/id/providers/openai#server-side-compaction-responses-api).
- `params`: parameter provider default global yang diterapkan ke semua model. Setel di `agents.defaults.params` (misalnya `{ cacheRetention: "long" }`).
- Prioritas penggabungan `params` (config): `agents.defaults.params` (basis global) ditimpa oleh `agents.defaults.models["provider/model"].params` (per-model), lalu `agents.list[].params` (id agent yang cocok) menimpa per kunci. Lihat [Caching Prompt](/id/reference/prompt-caching) untuk detail.
- `params.extra_body`/`params.extraBody`: JSON pass-through lanjutan yang digabungkan ke body request `api: "openai-completions"` untuk proxy yang kompatibel dengan OpenAI. Jika bertabrakan dengan kunci request yang dihasilkan, extra body akan menang; rute completions non-native tetap menghapus `store` khusus OpenAI setelahnya.
- `params.chat_template_kwargs`: argumen chat-template vLLM/OpenAI-compatible yang digabungkan ke body request tingkat atas `api: "openai-completions"`. Untuk `vllm/nemotron-3-*` dengan thinking nonaktif, OpenClaw secara otomatis mengirim `enable_thinking: false` dan `force_nonempty_content: true`; `chat_template_kwargs` eksplisit menimpa default tersebut, dan `extra_body.chat_template_kwargs` tetap memiliki prioritas akhir.
- `params.preserveThinking`: opt-in khusus Z.AI untuk preserved thinking. Saat diaktifkan dan thinking aktif, OpenClaw mengirim `thinking.clear_thinking: false` dan memutar ulang `reasoning_content` sebelumnya; lihat [thinking dan preserved thinking Z.AI](/id/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: kebijakan runtime agent tingkat rendah default. `id` yang dihilangkan default ke harness OpenClaw Pi. Gunakan `id: "pi"` untuk memaksa harness PI bawaan, `id: "auto"` agar harness Plugin terdaftar dapat mengklaim model yang didukung, id harness terdaftar seperti `id: "codex"`, atau alias backend CLI yang didukung seperti `id: "claude-cli"`. Setel `fallback: "none"` untuk menonaktifkan fallback PI otomatis. Runtime Plugin eksplisit seperti `codex` gagal tertutup secara default kecuali Anda menyetel `fallback: "pi"` dalam scope override yang sama. Gunakan referensi model kanonis sebagai `provider/model`; pilih Codex, Claude CLI, Gemini CLI, dan backend eksekusi lainnya melalui config runtime alih-alih prefiks provider runtime lama. Lihat [Runtime agent](/id/concepts/agent-runtimes) untuk perbedaannya dari pemilihan provider/model.
- Penulis config yang memutasi field ini (misalnya `/models set`, `/models set-image`, dan perintah tambah/hapus fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang ada bila memungkinkan.
- `maxConcurrent`: jumlah maksimum run agent paralel lintas sesi (setiap sesi tetap diserialkan). Default: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` mengontrol executor tingkat rendah mana yang menjalankan giliran agent. Sebagian besar
deployment sebaiknya mempertahankan runtime OpenClaw Pi default. Gunakan ini saat Plugin tepercaya
menyediakan harness bawaan, seperti harness app-server Codex bawaan,
atau saat Anda menginginkan backend CLI yang didukung seperti Claude CLI. Untuk model mentalnya,
lihat [Runtime agent](/id/concepts/agent-runtimes).

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
- `fallback`: `"pi"` atau `"none"`. Dalam `id: "auto"`, fallback yang dihilangkan default ke `"pi"` sehingga config lama dapat tetap menggunakan PI saat tidak ada harness Plugin yang mengklaim sebuah run. Dalam mode runtime Plugin eksplisit, seperti `id: "codex"`, fallback yang dihilangkan default ke `"none"` sehingga harness yang hilang akan gagal alih-alih diam-diam menggunakan PI. Override runtime tidak mewarisi fallback dari scope yang lebih luas; setel `fallback: "pi"` bersama runtime eksplisit saat Anda memang menginginkan fallback kompatibilitas tersebut. Kegagalan harness Plugin yang dipilih selalu ditampilkan secara langsung.
- Override lingkungan: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` menimpa `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` menimpa fallback untuk proses tersebut.
- Untuk deployment khusus Codex, setel `model: "openai/gpt-5.5"` dan `agentRuntime.id: "codex"`. Anda juga dapat menyetel `agentRuntime.fallback: "none"` secara eksplisit demi keterbacaan; ini adalah default untuk runtime Plugin eksplisit.
- Untuk deployment Claude CLI, gunakan `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Referensi model lama `claude-cli/claude-opus-4-7` masih berfungsi untuk kompatibilitas, tetapi config baru sebaiknya menjaga pemilihan provider/model tetap kanonis dan menempatkan backend eksekusi di `agentRuntime.id`.
- Kunci kebijakan runtime lama ditulis ulang ke `agentRuntime` oleh `openclaw doctor --fix`.
- Pilihan harness dipatok per id sesi setelah run tertanam pertama. Perubahan config/env memengaruhi sesi baru atau yang di-reset, bukan transkrip yang sudah ada. Sesi lama dengan riwayat transkrip tetapi tanpa pin yang tercatat diperlakukan sebagai dipatok ke PI. `/status` melaporkan runtime efektif, misalnya `Runtime: OpenClaw Pi Default` atau `Runtime: OpenAI Codex`.
- Ini hanya mengontrol eksekusi giliran agent teks. Pembuatan media, vision, PDF, musik, video, dan TTS tetap menggunakan pengaturan provider/model masing-masing.

**Singkatan alias bawaan** (hanya berlaku saat model ada di `agents.defaults.models`):

| Alias               | Model                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` atau `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Alias yang Anda konfigurasi selalu menang atas default.

Model GLM-4.x Z.AI secara otomatis mengaktifkan mode thinking kecuali Anda menyetel `--thinking off` atau mendefinisikan sendiri `agents.defaults.models["zai/<model>"].params.thinking`.
Model Z.AI mengaktifkan `tool_stream` secara default untuk streaming pemanggilan tool. Setel `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Model Anthropic Claude 4.6 secara default menggunakan thinking `adaptive` saat tidak ada level thinking eksplisit yang disetel.

### `agents.defaults.cliBackends`

Backend CLI opsional untuk run fallback teks-saja (tanpa pemanggilan tool). Berguna sebagai cadangan saat provider API gagal.

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
          // Atau gunakan systemPromptFileArg saat CLI menerima flag file prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backend CLI bersifat text-first; tool selalu dinonaktifkan.
- Sesi didukung saat `sessionArg` disetel.
- Pass-through gambar didukung saat `imageArg` menerima path file.

### `agents.defaults.systemPromptOverride`

Ganti seluruh prompt sistem yang dirakit OpenClaw dengan string tetap. Setel di level default (`agents.defaults.systemPromptOverride`) atau per agent (`agents.list[].systemPromptOverride`). Nilai per-agent memiliki prioritas lebih tinggi; nilai kosong atau yang hanya berisi whitespace diabaikan. Berguna untuk eksperimen prompt yang terkontrol.

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

Overlay prompt yang independen dari provider dan diterapkan menurut keluarga model. Id model keluarga GPT-5 menerima kontrak perilaku bersama lintas provider; `personality` hanya mengontrol lapisan gaya interaksi yang ramah.

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
- `"off"` hanya menonaktifkan lapisan ramah; kontrak perilaku GPT-5 yang diberi tag tetap aktif.
- `plugins.entries.openai.config.personality` lama masih dibaca saat pengaturan bersama ini tidak disetel.

### `agents.defaults.heartbeat`

Run Heartbeat berkala.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m menonaktifkan
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false menghilangkan bagian Heartbeat dari prompt sistem
        lightContext: false, // default: false; true hanya mempertahankan HEARTBEAT.md dari file bootstrap workspace
        isolatedSession: false, // default: false; true menjalankan setiap heartbeat di sesi baru (tanpa riwayat percakapan)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | opsi: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: string durasi (ms/s/m/h). Default: `30m` (autentikasi API key) atau `1h` (autentikasi OAuth). Setel ke `0m` untuk menonaktifkan.
- `includeSystemPromptSection`: saat false, menghilangkan bagian Heartbeat dari prompt sistem dan melewati penyuntikan `HEARTBEAT.md` ke konteks bootstrap. Default: `true`.
- `suppressToolErrorWarnings`: saat true, menekan payload peringatan error tool selama run Heartbeat.
- `timeoutSeconds`: waktu maksimum dalam detik yang diizinkan untuk satu giliran agent Heartbeat sebelum dibatalkan. Biarkan tidak disetel untuk menggunakan `agents.defaults.timeoutSeconds`.
- `directPolicy`: kebijakan pengiriman langsung/DM. `allow` (default) mengizinkan pengiriman target langsung. `block` menekan pengiriman target langsung dan mengeluarkan `reason=dm-blocked`.
- `lightContext`: saat true, run Heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: saat true, setiap Heartbeat berjalan di sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasi yang sama seperti Cron `sessionTarget: "isolated"`. Mengurangi biaya token per Heartbeat dari ~100K menjadi ~2-5K token.
- Per-agent: setel `agents.list[].heartbeat`. Saat ada agent yang mendefinisikan `heartbeat`, **hanya agent tersebut** yang menjalankan Heartbeat.
- Heartbeat menjalankan giliran agent penuh — interval yang lebih pendek membakar lebih banyak token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id dari Plugin provider Compaction terdaftar (opsional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // digunakan saat identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] menonaktifkan penyuntikan ulang
        model: "openrouter/anthropic/claude-sonnet-4-6", // override model khusus Compaction opsional
        notifyUser: true, // kirim pemberitahuan singkat saat Compaction dimulai dan selesai (default: false)
        memoryFlush: {
          enabled: true,
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
- `provider`: id dari Plugin provider Compaction terdaftar. Saat disetel, `summarize()` milik provider dipanggil alih-alih peringkasan LLM bawaan. Fallback ke bawaan jika gagal. Menyetel provider memaksa `mode: "safeguard"`. Lihat [Compaction](/id/concepts/compaction).
- `timeoutSeconds`: jumlah detik maksimum yang diizinkan untuk satu operasi Compaction sebelum OpenClaw membatalkannya. Default: `900`.
- `keepRecentTokens`: anggaran titik potong Pi untuk mempertahankan bagian akhir transkrip terbaru secara verbatim. `/compact` manual menghormati ini saat disetel secara eksplisit; jika tidak, Compaction manual adalah checkpoint keras.
- `identifierPolicy`: `strict` (default), `off`, atau `custom`. `strict` menambahkan panduan bawaan untuk mempertahankan identifier opak di awal selama peringkasan Compaction.
- `identifierInstructions`: teks pelestarian identifier kustom opsional yang digunakan saat `identifierPolicy=custom`.
- `qualityGuard`: pemeriksaan coba-ulang saat output malformed untuk ringkasan safeguard. Diaktifkan secara default dalam mode safeguard; setel `enabled: false` untuk melewati audit.
- `postCompactionSections`: nama bagian H2/H3 AGENTS.md opsional yang akan disuntikkan ulang setelah Compaction. Default ke `["Session Startup", "Red Lines"]`; setel `[]` untuk menonaktifkan penyuntikan ulang. Saat tidak disetel atau disetel eksplisit ke pasangan default itu, heading lama `Every Session`/`Safety` juga diterima sebagai fallback lawas.
- `model`: override opsional `provider/model-id` hanya untuk peringkasan Compaction. Gunakan ini saat sesi utama harus tetap memakai satu model tetapi ringkasan Compaction harus berjalan pada model lain; saat tidak disetel, Compaction menggunakan model primary sesi.
- `notifyUser`: saat `true`, mengirim pemberitahuan singkat kepada pengguna ketika Compaction dimulai dan ketika selesai (misalnya, "Compacting context..." dan "Compaction complete"). Dinonaktifkan secara default agar Compaction tetap senyap.
- `memoryFlush`: giliran agent senyap sebelum auto-Compaction untuk menyimpan memori yang tahan lama. Dilewati saat workspace bersifat read-only.

### `agents.defaults.contextPruning`

Memangkas **hasil tool lama** dari konteks dalam memori sebelum dikirim ke LLM. **Tidak** mengubah riwayat sesi di disk.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // durasi (ms/s/m/h), unit default: menit
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

- `mode: "cache-ttl"` mengaktifkan pass pruning.
- `ttl` mengontrol seberapa sering pruning dapat berjalan lagi (setelah sentuhan cache terakhir).
- Pruning pertama-tama melakukan soft-trim pada hasil tool yang terlalu besar, lalu hard-clear hasil tool yang lebih lama bila diperlukan.

**Soft-trim** mempertahankan bagian awal + akhir dan menyisipkan `...` di tengah.

**Hard-clear** mengganti seluruh hasil tool dengan placeholder.

Catatan:

- Blok gambar tidak pernah dipotong/dihapus.
- Rasio berbasis karakter (perkiraan), bukan jumlah token yang presisi.
- Jika jumlah pesan assistant kurang dari `keepLastAssistants`, pruning dilewati.

</Accordion>

Lihat [Session Pruning](/id/concepts/session-pruning) untuk detail perilaku.

### Streaming blok

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (gunakan minMs/maxMs)
    },
  },
}
```

- Saluran non-Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
- Override saluran: `channels.<channel>.blockStreamingCoalesce` (dan varian per akun). Signal/Slack/Discord/Google Chat default `minChars: 1500`.
- `humanDelay`: jeda acak di antara balasan blok. `natural` = 800–2500ms. Override per-agent: `agents.list[].humanDelay`.

Lihat [Streaming](/id/concepts/streaming) untuk detail perilaku + chunking.

### Indikator mengetik

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

- Default: `instant` untuk obrolan langsung/mention, `message` untuk obrolan grup tanpa mention.
- Override per sesi: `session.typingMode`, `session.typingIntervalSeconds`.

Lihat [Indikator Mengetik](/id/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opsional untuk agent tertanam. Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap.

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
          // SecretRef / isi inline juga didukung:
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

Saat `backend: "openshell"` dipilih, pengaturan khusus runtime dipindahkan ke
`plugins.entries.openshell.config`.

**Konfigurasi backend SSH:**

- `target`: target SSH dalam bentuk `user@host[:port]`
- `command`: perintah klien SSH (default: `ssh`)
- `workspaceRoot`: root jarak jauh absolut yang digunakan untuk workspace per-scope
- `identityFile` / `certificateFile` / `knownHostsFile`: file lokal yang sudah ada dan diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: isi inline atau SecretRef yang diwujudkan OpenClaw menjadi file sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: knob kebijakan host-key OpenSSH

**Prioritas autentikasi SSH:**

- `identityData` mengalahkan `identityFile`
- `certificateData` mengalahkan `certificateFile`
- `knownHostsData` mengalahkan `knownHostsFile`
- Nilai `*Data` berbasis SecretRef di-resolve dari snapshot runtime secret aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- melakukan seed workspace jarak jauh sekali setelah create atau recreate
- lalu mempertahankan workspace SSH jarak jauh sebagai yang kanonis
- merutekan `exec`, file tool, dan path media melalui SSH
- tidak menyinkronkan perubahan jarak jauh kembali ke host secara otomatis
- tidak mendukung kontainer browser sandbox

**Akses workspace:**

- `none`: workspace sandbox per-scope di bawah `~/.openclaw/sandboxes`
- `ro`: workspace sandbox di `/workspace`, workspace agent dimount read-only di `/agent`
- `rw`: workspace agent dimount read/write di `/workspace`

**Scope:**

- `session`: kontainer + workspace per sesi
- `agent`: satu kontainer + workspace per agent (default)
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
          gateway: "lab", // opsional
          gatewayEndpoint: "https://lab.example", // opsional
          policy: "strict", // id kebijakan OpenShell opsional
          providers: ["openai"], // opsional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Mode OpenShell:**

- `mirror`: seed jarak jauh dari lokal sebelum exec, sinkronkan kembali setelah exec; workspace lokal tetap kanonis
- `remote`: seed jarak jauh sekali saat sandbox dibuat, lalu pertahankan workspace jarak jauh sebagai yang kanonis

Dalam mode `remote`, edit lokal host yang dibuat di luar OpenClaw tidak disinkronkan ke sandbox secara otomatis setelah langkah seed.
Transport menggunakan SSH ke sandbox OpenShell, tetapi Plugin memiliki siklus hidup sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** dijalankan sekali setelah pembuatan kontainer (melalui `sh -lc`). Memerlukan egress jaringan, root yang dapat ditulis, dan pengguna root.

**Kontainer default ke `network: "none"`** — setel ke `"bridge"` (atau jaringan bridge kustom) jika agent memerlukan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda secara eksplisit menyetel
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Lampiran masuk** disiapkan ke `media/inbound/*` di workspace aktif.

**`docker.binds`** memount direktori host tambahan; bind global dan per-agent digabungkan.

**Browser tersandbox** (`sandbox.browser.enabled`): Chromium + CDP di dalam kontainer. URL noVNC disuntikkan ke prompt sistem. Tidak memerlukan `browser.enabled` di `openclaw.json`.
Akses pengamat noVNC menggunakan autentikasi VNC secara default dan OpenClaw mengeluarkan URL token jangka pendek (alih-alih mengekspos kata sandi di URL bersama).

- `allowHostControl: false` (default) memblokir sesi tersandbox agar tidak menargetkan browser host.
- `network` default ke `openclaw-sandbox-browser` (jaringan bridge khusus). Setel ke `bridge` hanya jika Anda memang menginginkan konektivitas bridge global.
- `cdpSourceRange` secara opsional membatasi ingress CDP di tepi kontainer ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` memount direktori host tambahan hanya ke kontainer browser sandbox. Saat disetel (termasuk `[]`), nilai ini menggantikan `docker.binds` untuk kontainer browser.
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
  - `--disable-extensions` (default aktif)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, dan `--disable-gpu`
    aktif secara default dan dapat dinonaktifkan dengan
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika penggunaan WebGL/3D memerlukannya.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` mengaktifkan kembali ekstensi jika alur kerja Anda
    bergantung padanya.
  - `--renderer-process-limit=2` dapat diubah dengan
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; setel `0` untuk menggunakan
    batas proses default Chromium.
  - plus `--no-sandbox` saat `noSandbox` diaktifkan.
  - Default adalah baseline image kontainer; gunakan image browser kustom dengan entrypoint kustom untuk mengubah default kontainer.

</Accordion>

Sandboxing browser dan `sandbox.docker.binds` hanya untuk Docker.

Bangun image:

```bash
scripts/sandbox-setup.sh           # image sandbox utama
scripts/sandbox-browser-setup.sh   # image browser opsional
```

### `agents.list` (override per-agent)

Gunakan `agents.list[].tts` untuk memberi agent provider TTS, voice, model,
style, atau mode TTS otomatis sendiri. Blok agent melakukan deep-merge di atas
`messages.tts` global, sehingga kredensial bersama bisa tetap berada di satu tempat sementara
agent individual hanya menimpa field voice atau provider yang mereka perlukan. Override
agent aktif berlaku untuk balasan lisan otomatis, `/tts audio`, `/tts status`, dan
tool agent `tts`. Lihat [Text-to-speech](/id/tools/tts#per-agent-voice-overrides)
untuk contoh provider dan prioritas.

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
        model: "anthropic/claude-opus-4-6", // atau { primary, fallbacks }
        thinkingDefault: "high", // override level thinking per-agent
        reasoningDefault: "on", // override visibilitas reasoning per-agent
        fastModeDefault: false, // override mode cepat per-agent
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // menimpa params defaults.models yang cocok per kunci
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // menggantikan agents.defaults.skills saat disetel
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

- `id`: id agent yang stabil (wajib).
- `default`: saat beberapa disetel, yang pertama menang (peringatan dicatat di log). Jika tidak ada yang disetel, entri daftar pertama menjadi default.
- `model`: bentuk string hanya menimpa `primary`; bentuk objek `{ primary, fallbacks }` menimpa keduanya (`[]` menonaktifkan fallback global). Pekerjaan Cron yang hanya menimpa `primary` tetap mewarisi fallback default kecuali Anda menyetel `fallbacks: []`.
- `params`: parameter stream per-agent yang digabungkan di atas entri model yang dipilih dalam `agents.defaults.models`. Gunakan ini untuk override khusus agent seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `tts`: override text-to-speech per-agent opsional. Blok ini melakukan deep-merge di atas `messages.tts`, jadi simpan kredensial provider bersama dan kebijakan fallback di `messages.tts`, lalu setel hanya nilai khusus persona seperti provider, voice, model, style, atau mode otomatis di sini.
- `skills`: allowlist Skills per-agent opsional. Jika dihilangkan, agent mewarisi `agents.defaults.skills` saat disetel; daftar eksplisit menggantikan default alih-alih digabungkan, dan `[]` berarti tanpa Skills.
- `thinkingDefault`: default tingkat thinking per-agent opsional (`off | minimal | low | medium | high | xhigh | adaptive | max`). Menimpa `agents.defaults.thinkingDefault` untuk agent ini saat tidak ada override per-pesan atau sesi yang disetel. Profil provider/model yang dipilih mengontrol nilai mana yang valid; untuk Google Gemini, `adaptive` mempertahankan thinking dinamis milik provider (`thinkingLevel` dihilangkan pada Gemini 3/3.1, `thinkingBudget: -1` pada Gemini 2.5).
- `reasoningDefault`: default visibilitas reasoning per-agent opsional (`on | off | stream`). Berlaku saat tidak ada override reasoning per-pesan atau sesi yang disetel.
- `fastModeDefault`: default opsional per-agent untuk mode cepat (`true | false`). Berlaku saat tidak ada override mode cepat per-pesan atau sesi yang disetel.
- `agentRuntime`: override kebijakan runtime tingkat rendah per-agent opsional. Gunakan `{ id: "codex" }` untuk membuat satu agent khusus Codex sementara agent lain tetap memakai fallback PI default dalam mode `auto`.
- `runtime`: deskriptor runtime per-agent opsional. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) saat agent harus default ke sesi harness ACP.
- `identity.avatar`: path relatif workspace, URL `http(s)`, atau URI `data:`.
- `identity` menurunkan default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: allowlist id agent untuk `sessions_spawn` (`["*"]` = apa saja; default: hanya agent yang sama).
- Guard pewarisan sandbox: jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: saat true, blok panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).

---

## Perutean multi-agent

Jalankan beberapa agent terisolasi di dalam satu Gateway. Lihat [Multi-Agent](/id/concepts/multi-agent).

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

### Field pencocokan binding

- `type` (opsional): `route` untuk perutean normal (type yang hilang default ke route), `acp` untuk binding percakapan ACP persisten.
- `match.channel` (wajib)
- `match.accountId` (opsional; `*` = akun apa saja; dihilangkan = akun default)
- `match.peer` (opsional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opsional; khusus saluran)
- `acp` (opsional; hanya untuk entri `type: "acp"`): `{ mode, label, cwd, backend }`

**Urutan pencocokan deterministik:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (persis, tanpa peer/guild/team)
5. `match.accountId: "*"` (cakupan seluruh saluran)
6. Agent default

Dalam setiap tingkat, entri `bindings` pertama yang cocok akan menang.

Untuk entri `type: "acp"`, OpenClaw melakukan resolve berdasarkan identitas percakapan persis (`match.channel` + akun + `match.peer.id`) dan tidak menggunakan urutan tingkat binding route di atas.

### Profil akses per-agent

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

<Accordion title="Tool + workspace read-only">

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

<Accordion title="Tanpa akses filesystem (hanya perpesanan)">

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

Lihat [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) untuk detail prioritas.

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
    parentForkMaxTokens: 100000, // lewati fork thread parent di atas jumlah token ini (0 menonaktifkan)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durasi atau false
      maxDiskBytes: "500mb", // anggaran keras opsional
      highWaterBytes: "400mb", // target pembersihan opsional
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // auto-unfocus default karena tidak aktif dalam jam (`0` menonaktifkan)
      maxAgeHours: 0, // usia maksimum keras default dalam jam (`0` menonaktifkan)
    },
    mainKey: "main", // lama (runtime selalu menggunakan "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detail field sesi">

- **`scope`**: strategi pengelompokan sesi dasar untuk konteks obrolan grup.
  - `per-sender` (default): setiap pengirim mendapatkan sesi terisolasi dalam konteks saluran.
  - `global`: semua peserta dalam konteks saluran berbagi satu sesi (gunakan hanya ketika konteks bersama memang diinginkan).
- **`dmScope`**: bagaimana DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: isolasi berdasarkan id pengirim lintas saluran.
  - `per-channel-peer`: isolasi per saluran + pengirim (disarankan untuk inbox multi-pengguna).
  - `per-account-channel-peer`: isolasi per akun + saluran + pengirim (disarankan untuk multi-akun).
- **`identityLinks`**: map id kanonis ke peer berprefiks provider untuk berbagi sesi lintas saluran.
- **`reset`**: kebijakan reset utama. `daily` me-reset pada `atHour` waktu lokal; `idle` me-reset setelah `idleMinutes`. Ketika keduanya dikonfigurasi, yang lebih dulu kedaluwarsa akan menang. Kesegaran reset harian menggunakan `sessionStartedAt` pada baris sesi; kesegaran reset idle menggunakan `lastInteractionAt`. Penulisan latar belakang/event sistem seperti Heartbeat, wakeup Cron, notifikasi exec, dan pencatatan Gateway dapat memperbarui `updatedAt`, tetapi tidak menjaga sesi harian/idle tetap segar.
- **`resetByType`**: override per tipe (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`parentForkMaxTokens`**: jumlah maksimum `totalTokens` sesi parent yang diizinkan saat membuat sesi thread hasil fork (default `100000`).
  - Jika `totalTokens` parent di atas nilai ini, OpenClaw memulai sesi thread baru alih-alih mewarisi riwayat transkrip parent.
  - Setel `0` untuk menonaktifkan guard ini dan selalu mengizinkan parent forking.
- **`mainKey`**: field lama. Runtime selalu menggunakan `"main"` untuk bucket obrolan langsung utama.
- **`agentToAgent.maxPingPongTurns`**: jumlah maksimum giliran balas-kembali antar agent selama pertukaran agent-ke-agent (integer, rentang: `0`–`5`). `0` menonaktifkan rantai ping-pong.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Deny pertama yang cocok akan menang.
- **`maintenance`**: kontrol pembersihan + retensi store sesi.
  - `mode`: `warn` hanya mengeluarkan peringatan; `enforce` menerapkan pembersihan.
  - `pruneAfter`: batas usia untuk entri basi (default `30d`).
  - `maxEntries`: jumlah maksimum entri di `sessions.json` (default `500`).
  - `rotateBytes`: rotasi `sessions.json` saat melampaui ukuran ini (default `10mb`).
  - `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>`. Default ke `pruneAfter`; setel `false` untuk menonaktifkan.
  - `maxDiskBytes`: anggaran disk direktori sesi opsional. Dalam mode `warn`, ia mencatat peringatan; dalam mode `enforce`, ia menghapus artefak/sesi tertua terlebih dahulu.
  - `highWaterBytes`: target opsional setelah pembersihan anggaran. Default ke `80%` dari `maxDiskBytes`.
- **`threadBindings`**: default global untuk fitur sesi terikat thread.
  - `enabled`: sakelar default utama (provider dapat menimpa; Discord menggunakan `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus default karena tidak aktif dalam jam (`0` menonaktifkan; provider dapat menimpa)
  - `maxAgeHours`: usia maksimum keras default dalam jam (`0` menonaktifkan; provider dapat menimpa)

</Accordion>

---

## Pesan

```json5
{
  messages: {
    responsePrefix: "🦞", // atau "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 menonaktifkan
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks respons

Override per saluran/akun: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik menang): akun → saluran → global. `""` menonaktifkan dan menghentikan cascade. `"auto"` menurunkan `[{identity.name}]`.

**Variabel template:**

| Variable          | Deskripsi              | Contoh                      |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nama model pendek      | `claude-opus-4-6`           |
| `{modelFull}`     | Pengidentifikasi model lengkap | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama provider          | `anthropic`                 |
| `{thinkingLevel}` | Level thinking saat ini | `high`, `low`, `off`       |
| `{identity.name}` | Nama identitas agent   | (sama seperti `"auto"`)     |

Variabel tidak peka huruf besar/kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi ack

- Default ke `identity.emoji` milik agent aktif, jika tidak `"👀"`. Setel `""` untuk menonaktifkan.
- Override per saluran: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: akun → saluran → `messages.ackReaction` → fallback identitas.
- Scope: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: menghapus ack setelah balasan pada saluran yang mendukung reaksi seperti Slack, Discord, Telegram, WhatsApp, dan BlueBubbles.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status siklus hidup di Slack, Discord, dan Telegram.
  Pada Slack dan Discord, jika tidak disetel maka reaksi status tetap aktif saat reaksi ack aktif.
  Pada Telegram, setel secara eksplisit ke `true` untuk mengaktifkan reaksi status siklus hidup.

### Debounce masuk

Mengelompokkan pesan teks-saja yang cepat dari pengirim yang sama menjadi satu giliran agent. Media/lampiran langsung mem-flush. Perintah kontrol melewati debouncing.

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

- `auto` mengontrol mode auto-TTS default: `off`, `always`, `inbound`, atau `tagged`. `/tts on|off` dapat menimpa preferensi lokal, dan `/tts status` menampilkan state efektif.
- `summaryModel` menimpa `agents.defaults.model.primary` untuk ringkasan otomatis.
- `modelOverrides` aktif secara default; `modelOverrides.allowProvider` default ke `false` (opt-in).
- API key fallback ke `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY`.
- Provider ucapan bawaan dimiliki oleh Plugin. Jika `plugins.allow` disetel, sertakan setiap Plugin provider TTS yang ingin Anda gunakan, misalnya `microsoft` untuk Edge TTS. Id provider lama `edge` diterima sebagai alias untuk `microsoft`.
- `providers.openai.baseUrl` menimpa endpoint OpenAI TTS. Urutan resolusi adalah config, lalu `OPENAI_TTS_BASE_URL`, lalu `https://api.openai.com/v1`.
- Saat `providers.openai.baseUrl` menunjuk ke endpoint non-OpenAI, OpenClaw memperlakukannya sebagai server TTS yang kompatibel dengan OpenAI dan melonggarkan validasi model/voice.

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

- `talk.provider` harus cocok dengan sebuah kunci di `talk.providers` ketika beberapa provider Talk dikonfigurasi.
- Kunci Talk datar lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas dan dimigrasikan otomatis ke `talk.providers.<provider>`.
- Voice ID fallback ke `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID`.
- `providers.*.apiKey` menerima string plaintext atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku ketika tidak ada API key Talk yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan direktif Talk menggunakan nama yang ramah.
- `providers.mlx.modelId` memilih repo Hugging Face yang digunakan oleh helper MLX lokal macOS. Jika dihilangkan, macOS menggunakan `mlx-community/Soprano-80M-bf16`.
- Pemutaran MLX macOS berjalan melalui helper `openclaw-mlx-tts` bawaan saat tersedia, atau executable di `PATH`; `OPENCLAW_MLX_TTS_BIN` menimpa path helper untuk pengembangan.
- `speechLocale` menetapkan id locale BCP 47 yang digunakan oleh pengenalan ucapan Talk iOS/macOS. Biarkan tidak disetel untuk menggunakan default perangkat.
- `silenceTimeoutMs` mengontrol berapa lama mode Talk menunggu setelah pengguna diam sebelum mengirim transkrip. Jika tidak disetel, jendela jeda default platform tetap digunakan (`700 ms` di macOS dan Android, `900 ms` di iOS).

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — semua kunci config lainnya
- [Konfigurasi](/id/gateway/configuration) — tugas umum dan penyiapan cepat
- [Contoh konfigurasi](/id/gateway/configuration-examples)

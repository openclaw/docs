---
read_when:
    - Menyetel default agen (model, thinking, workspace, Heartbeat, media, Skills)
    - Mengonfigurasi routing dan binding multi-agen
    - Menyesuaikan perilaku sesi, pengiriman pesan, dan mode talk
summary: Default agen, routing multi-agen, sesi, pesan, dan konfigurasi talk
title: Konfigurasi — agen
x-i18n:
    generated_at: "2026-04-24T09:06:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

Key konfigurasi dengan cakupan agen di bawah `agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, dan `talk.*`. Untuk channel, tool, runtime Gateway, dan key tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Default agen

### `agents.defaults.workspace`

Default: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan pada baris Runtime di system prompt. Jika tidak disetel, OpenClaw mendeteksi otomatis dengan menelusuri ke atas dari workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist Skills default opsional untuk agen yang tidak menyetel
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

- Hilangkan `agents.defaults.skills` untuk Skills tak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi default.
- Setel `agents.list[].skills: []` untuk tanpa Skills.
- Daftar `agents.list[].skills` yang tidak kosong adalah kumpulan final untuk agen tersebut; daftar ini
  tidak digabungkan dengan default.

### `agents.defaults.skipBootstrap`

Menonaktifkan pembuatan otomatis file bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Mengontrol kapan file bootstrap workspace disuntikkan ke system prompt. Default: `"always"`.

- `"continuation-skip"`: giliran lanjutan yang aman (setelah respons asisten selesai) melewati penyuntikan ulang bootstrap workspace, sehingga mengurangi ukuran prompt. Proses Heartbeat dan retry pasca-Compaction tetap membangun ulang konteks.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Karakter maksimum per file bootstrap workspace sebelum dipotong. Default: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Total karakter maksimum yang disuntikkan di semua file bootstrap workspace. Default: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Mengontrol teks peringatan yang terlihat oleh agen saat konteks bootstrap dipotong.
Default: `"once"`.

- `"off"`: jangan pernah menyuntikkan teks peringatan ke system prompt.
- `"once"`: suntikkan peringatan sekali per signature pemotongan unik (disarankan).
- `"always"`: suntikkan peringatan pada setiap proses ketika ada pemotongan.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Peta kepemilikan anggaran konteks

OpenClaw memiliki beberapa anggaran prompt/konteks bervolume tinggi, dan anggaran ini
sengaja dipisahkan berdasarkan subsistem alih-alih semuanya mengalir melalui satu
pengaturan generik.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  penyuntikan bootstrap workspace normal.
- `agents.defaults.startupContext.*`:
  prelude startup sekali pakai untuk `/new` dan `/reset`, termasuk file
  `memory/*.md` harian terbaru.
- `skills.limits.*`:
  daftar Skills ringkas yang disuntikkan ke system prompt.
- `agents.defaults.contextLimits.*`:
  kutipan runtime terbatas dan blok milik runtime yang disuntikkan.
- `memory.qmd.limits.*`:
  ukuran cuplikan dan injeksi memory-search yang diindeks.

Gunakan override per agen yang sesuai hanya saat satu agen memerlukan
anggaran yang berbeda:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Mengontrol prelude startup giliran pertama yang disuntikkan pada proses `/new` dan `/reset`
polos.

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

Default bersama untuk surface konteks runtime terbatas.

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

- `memoryGetMaxChars`: batas kutipan `memory_get` default sebelum metadata pemotongan
  dan pemberitahuan lanjutan ditambahkan.
- `memoryGetDefaultLines`: jendela baris `memory_get` default saat `lines`
  dihilangkan.
- `toolResultMaxChars`: batas hasil tool langsung yang digunakan untuk hasil yang disimpan dan
  pemulihan overflow.
- `postCompactionMaxChars`: batas kutipan `AGENTS.md` yang digunakan selama penyuntikan refresh
  pasca-Compaction.

#### `agents.list[].contextLimits`

Override per agen untuk pengaturan `contextLimits` bersama. Field yang dihilangkan mewarisi
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

Batas global untuk daftar Skills ringkas yang disuntikkan ke system prompt. Ini
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

Ukuran piksel maksimum untuk sisi gambar terpanjang dalam blok gambar transkrip/tool sebelum pemanggilan provider.
Default: `1200`.

Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload permintaan untuk proses yang banyak menggunakan screenshot.
Nilai yang lebih tinggi mempertahankan lebih banyak detail visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zona waktu untuk konteks system prompt (bukan timestamp pesan). Fallback ke zona waktu host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format waktu dalam system prompt. Default: `auto` (preferensi OS).

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
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, mis. codex
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
  - Bentuk objek menetapkan primary plus model failover berurutan.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh jalur tool `image` sebagai konfigurasi vision model.
  - Juga digunakan sebagai routing fallback saat model yang dipilih/default tidak dapat menerima input gambar.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan gambar bersama dan semua surface tool/plugin masa depan yang membuat gambar.
  - Nilai umum: `google/gemini-3.1-flash-image-preview` untuk pembuatan gambar Gemini native, `fal/fal-ai/flux/dev` untuk fal, atau `openai/gpt-image-2` untuk OpenAI Images.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga auth provider yang sesuai (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` atau OpenAI Codex OAuth untuk `openai/gpt-image-2`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default provider berbasis auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan gambar terdaftar lainnya dalam urutan provider-id.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan musik bersama dan tool bawaan `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.5+`.
  - Jika dihilangkan, `music_generate` tetap dapat menyimpulkan default provider berbasis auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan musik terdaftar lainnya dalam urutan provider-id.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga auth/API key provider yang sesuai.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan video bersama dan tool bawaan `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` tetap dapat menyimpulkan default provider berbasis auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan video terdaftar lainnya dalam urutan provider-id.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga auth/API key provider yang sesuai.
  - Provider pembuatan video Qwen bawaan mendukung hingga 1 video output, 1 gambar input, 4 video input, durasi 10 detik, serta opsi tingkat provider `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh tool `pdf` untuk routing model.
  - Jika dihilangkan, tool PDF akan fallback ke `imageModel`, lalu ke model sesi/default yang telah diselesaikan.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk tool `pdf` saat `maxBytesMb` tidak diberikan pada waktu pemanggilan.
- `pdfMaxPages`: jumlah halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi di tool `pdf`.
- `verboseDefault`: level verbose default untuk agen. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `elevatedDefault`: level elevated-output default untuk agen. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (mis. `openai/gpt-5.4` untuk akses API key atau `openai-codex/gpt-5.5` untuk Codex OAuth). Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan unik configured-provider untuk model id persis itu, dan baru kemudian fallback ke provider default yang dikonfigurasi (perilaku kompatibilitas lama yang sudah deprecated, jadi lebih baik gunakan `provider/model` eksplisit). Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw akan fallback ke provider/model pertama yang dikonfigurasi alih-alih menampilkan default provider lama yang sudah dihapus.
- `models`: katalog model yang dikonfigurasi dan allowlist untuk `/model`. Setiap entri dapat menyertakan `alias` (shortcut) dan `params` (spesifik provider, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`).
  - Pengeditan aman: gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri. `config set` menolak penggantian yang akan menghapus entri allowlist yang ada kecuali Anda memberikan `--replace`.
  - Alur configure/onboarding dengan cakupan provider akan menggabungkan model provider yang dipilih ke peta ini dan mempertahankan provider lain yang tidak terkait yang sudah dikonfigurasi.
  - Untuk model OpenAI Responses langsung, Compaction sisi server diaktifkan secara otomatis. Gunakan `params.responsesServerCompaction: false` untuk berhenti menyuntikkan `context_management`, atau `params.responsesCompactThreshold` untuk menimpa ambang batas. Lihat [OpenAI server-side compaction](/id/providers/openai#server-side-compaction-responses-api).
- `params`: parameter provider default global yang diterapkan ke semua model. Disetel di `agents.defaults.params` (mis. `{ cacheRetention: "long" }`).
- Prioritas penggabungan `params` (konfigurasi): `agents.defaults.params` (dasar global) ditimpa oleh `agents.defaults.models["provider/model"].params` (per model), lalu `agents.list[].params` (id agen yang cocok) menimpa per key. Lihat [Prompt Caching](/id/reference/prompt-caching) untuk detailnya.
- `embeddedHarness`: kebijakan runtime agen tersemat tingkat rendah default. Gunakan `runtime: "auto"` agar harness plugin yang terdaftar dapat mengklaim model yang didukung, `runtime: "pi"` untuk memaksa harness PI bawaan, atau id harness terdaftar seperti `runtime: "codex"`. Setel `fallback: "none"` untuk menonaktifkan fallback PI otomatis.
- Penulis konfigurasi yang memutasi field-field ini (misalnya `/models set`, `/models set-image`, dan perintah tambah/hapus fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang ada bila memungkinkan.
- `maxConcurrent`: jumlah maksimum proses agen paralel di seluruh sesi (setiap sesi tetap diserialkan). Default: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` mengontrol eksekutor tingkat rendah mana yang menjalankan giliran agen tersemat.
Sebagian besar deployment sebaiknya mempertahankan default `{ runtime: "auto", fallback: "pi" }`.
Gunakan ini saat plugin tepercaya menyediakan harness native, seperti harness
app-server Codex bawaan.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"`, atau id harness plugin yang terdaftar. Plugin Codex bawaan mendaftarkan `codex`.
- `fallback`: `"pi"` atau `"none"`. `"pi"` mempertahankan harness PI bawaan sebagai fallback kompatibilitas saat tidak ada harness plugin yang dipilih. `"none"` membuat pemilihan harness plugin yang hilang atau tidak didukung gagal alih-alih diam-diam menggunakan PI. Kegagalan harness plugin yang dipilih selalu ditampilkan secara langsung.
- Override environment: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` menimpa `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` menonaktifkan fallback PI untuk proses tersebut.
- Untuk deployment khusus Codex, setel `model: "openai/gpt-5.5"`, `embeddedHarness.runtime: "codex"`, dan `embeddedHarness.fallback: "none"`.
- Pilihan harness dipasang per id sesi setelah proses tersemat pertama. Perubahan konfigurasi/env memengaruhi sesi baru atau yang di-reset, bukan transkrip yang sudah ada. Sesi lama dengan riwayat transkrip tetapi tanpa pin yang terekam diperlakukan sebagai dipin ke PI. `/status` menampilkan id harness non-PI seperti `codex` di samping `Fast`.
- Ini hanya mengontrol harness chat tersemat. Pembuatan media, vision, PDF, musik, video, dan TTS tetap menggunakan pengaturan provider/model masing-masing.

**Alias shorthand bawaan** (hanya berlaku saat model ada di `agents.defaults.models`):

| Alias               | Model                                              |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` atau GPT-5.5 Codex OAuth yang dikonfigurasi |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

Alias yang Anda konfigurasi sendiri selalu lebih diutamakan daripada default.

Model Z.AI GLM-4.x otomatis mengaktifkan mode thinking kecuali Anda menetapkan `--thinking off` atau mendefinisikan sendiri `agents.defaults.models["zai/<model>"].params.thinking`.
Model Z.AI mengaktifkan `tool_stream` secara default untuk streaming pemanggilan tool. Setel `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Model Anthropic Claude 4.6 default ke thinking `adaptive` saat tidak ada level thinking eksplisit yang disetel.

### `agents.defaults.cliBackends`

CLI backend opsional untuk proses fallback teks saja (tanpa pemanggilan tool). Berguna sebagai cadangan saat provider API gagal.

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
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backend bersifat text-first; tool selalu dinonaktifkan.
- Sesi didukung saat `sessionArg` disetel.
- Pass-through gambar didukung saat `imageArg` menerima path file.

### `agents.defaults.systemPromptOverride`

Ganti seluruh system prompt yang dirakit OpenClaw dengan string tetap. Setel di level default (`agents.defaults.systemPromptOverride`) atau per agen (`agents.list[].systemPromptOverride`). Nilai per agen lebih diutamakan; nilai kosong atau hanya spasi diabaikan. Berguna untuk eksperimen prompt yang terkendali.

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

Overlay prompt yang independen dari provider dan diterapkan berdasarkan keluarga model. Model id keluarga GPT-5 menerima kontrak perilaku bersama lintas provider; `personality` hanya mengontrol lapisan gaya interaksi yang ramah.

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

Proses Heartbeat berkala.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m menonaktifkan
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false menghilangkan bagian Heartbeat dari system prompt
        lightContext: false, // default: false; true hanya mempertahankan HEARTBEAT.md dari file bootstrap workspace
        isolatedSession: false, // default: false; true menjalankan setiap Heartbeat di sesi baru (tanpa riwayat percakapan)
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

- `every`: string durasi (ms/s/m/h). Default: `30m` (auth API key) atau `1h` (auth OAuth). Setel ke `0m` untuk menonaktifkan.
- `includeSystemPromptSection`: saat false, menghilangkan bagian Heartbeat dari system prompt dan melewati penyuntikan `HEARTBEAT.md` ke konteks bootstrap. Default: `true`.
- `suppressToolErrorWarnings`: saat true, menekan payload peringatan error tool selama proses Heartbeat.
- `timeoutSeconds`: waktu maksimum dalam detik yang diizinkan untuk satu giliran agen Heartbeat sebelum dibatalkan. Biarkan tidak disetel untuk menggunakan `agents.defaults.timeoutSeconds`.
- `directPolicy`: kebijakan pengiriman langsung/DM. `allow` (default) mengizinkan pengiriman target langsung. `block` menekan pengiriman target langsung dan mengeluarkan `reason=dm-blocked`.
- `lightContext`: saat true, proses Heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: saat true, setiap Heartbeat berjalan di sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasi yang sama seperti Cron `sessionTarget: "isolated"`. Mengurangi biaya token per Heartbeat dari ~100K menjadi ~2-5K token.
- Per agen: setel `agents.list[].heartbeat`. Saat agen mana pun mendefinisikan `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat.
- Heartbeat menjalankan giliran agen penuh — interval yang lebih pendek membakar lebih banyak token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id dari plugin provider Compaction yang terdaftar (opsional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // digunakan saat identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] menonaktifkan penyuntikan ulang
        model: "openrouter/anthropic/claude-sonnet-4-6", // override model khusus Compaction opsional
        notifyUser: true, // kirim notifikasi singkat saat Compaction dimulai dan selesai (default: false)
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
- `provider`: id dari plugin provider Compaction yang terdaftar. Saat disetel, `summarize()` milik provider dipanggil alih-alih peringkasan LLM bawaan. Fallback ke bawaan saat gagal. Menyetel provider memaksa `mode: "safeguard"`. Lihat [Compaction](/id/concepts/compaction).
- `timeoutSeconds`: jumlah detik maksimum yang diizinkan untuk satu operasi Compaction sebelum OpenClaw membatalkannya. Default: `900`.
- `identifierPolicy`: `strict` (default), `off`, atau `custom`. `strict` menambahkan panduan retensi identifier opak bawaan selama peringkasan Compaction.
- `identifierInstructions`: teks pelestarian identifier kustom opsional yang digunakan saat `identifierPolicy=custom`.
- `postCompactionSections`: nama bagian H2/H3 `AGENTS.md` opsional untuk disuntikkan ulang setelah Compaction. Default ke `["Session Startup", "Red Lines"]`; setel `[]` untuk menonaktifkan penyuntikan ulang. Saat tidak disetel atau secara eksplisit disetel ke pasangan default tersebut, heading lama `Every Session`/`Safety` juga diterima sebagai fallback lama.
- `model`: override `provider/model-id` opsional hanya untuk peringkasan Compaction. Gunakan ini saat sesi utama harus tetap memakai satu model tetapi ringkasan Compaction harus dijalankan pada model lain; saat tidak disetel, Compaction menggunakan model utama sesi.
- `notifyUser`: saat `true`, mengirim notifikasi singkat ke pengguna saat Compaction dimulai dan saat selesai (misalnya, "Memadatkan konteks..." dan "Compaction selesai"). Dinonaktifkan secara default agar Compaction tetap senyap.
- `memoryFlush`: giliran agentic senyap sebelum Compaction otomatis untuk menyimpan memori tahan lama. Dilewati saat workspace bersifat read-only.

### `agents.defaults.contextPruning`

Memangkas **hasil tool lama** dari konteks dalam memori sebelum dikirim ke LLM. **Tidak** memodifikasi riwayat sesi di disk.

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

- `mode: "cache-ttl"` mengaktifkan proses pruning.
- `ttl` mengontrol seberapa sering pruning dapat dijalankan lagi (setelah sentuhan cache terakhir).
- Pruning melakukan soft-trim pada hasil tool yang terlalu besar terlebih dahulu, lalu hard-clear pada hasil tool yang lebih lama bila diperlukan.

**Soft-trim** mempertahankan bagian awal + akhir dan menyisipkan `...` di tengah.

**Hard-clear** mengganti seluruh hasil tool dengan placeholder.

Catatan:

- Blok gambar tidak pernah dipangkas/dibersihkan.
- Rasio berbasis karakter (perkiraan), bukan jumlah token yang presisi.
- Jika pesan asisten kurang dari `keepLastAssistants`, pruning dilewati.

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

- Channel non-Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
- Override channel: `channels.<channel>.blockStreamingCoalesce` (dan varian per akun). Signal/Slack/Discord/Google Chat default ke `minChars: 1500`.
- `humanDelay`: jeda acak di antara balasan blok. `natural` = 800–2500ms. Override per agen: `agents.list[].humanDelay`.

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

- Default: `instant` untuk chat langsung/mention, `message` untuk chat grup tanpa mention.
- Override per sesi: `session.typingMode`, `session.typingIntervalSeconds`.

Lihat [Indikator Mengetik](/id/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opsional untuk agen tersemat. Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap.

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
          // SecretRef / konten inline juga didukung:
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
- `ssh`: runtime remote umum berbasis SSH
- `openshell`: runtime OpenShell

Saat `backend: "openshell"` dipilih, pengaturan spesifik runtime dipindahkan ke
`plugins.entries.openshell.config`.

**Konfigurasi backend SSH:**

- `target`: target SSH dalam bentuk `user@host[:port]`
- `command`: perintah klien SSH (default: `ssh`)
- `workspaceRoot`: root remote absolut yang digunakan untuk workspace per scope
- `identityFile` / `certificateFile` / `knownHostsFile`: file lokal yang ada dan diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: konten inline atau SecretRef yang diwujudkan OpenClaw menjadi file sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: pengaturan kebijakan host-key OpenSSH

**Prioritas auth SSH:**

- `identityData` lebih diutamakan daripada `identityFile`
- `certificateData` lebih diutamakan daripada `certificateFile`
- `knownHostsData` lebih diutamakan daripada `knownHostsFile`
- Nilai `*Data` berbasis SecretRef diselesaikan dari snapshot runtime secret aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- melakukan seed workspace remote sekali setelah create atau recreate
- lalu mempertahankan workspace SSH remote sebagai kanonis
- merutekan `exec`, file tools, dan path media melalui SSH
- tidak menyinkronkan perubahan remote kembali ke host secara otomatis
- tidak mendukung container browser sandbox

**Akses workspace:**

- `none`: workspace sandbox per scope di bawah `~/.openclaw/sandboxes`
- `ro`: workspace sandbox di `/workspace`, workspace agen di-mount read-only di `/agent`
- `rw`: workspace agen di-mount read/write di `/workspace`

**Scope:**

- `session`: container + workspace per sesi
- `agent`: satu container + workspace per agen (default)
- `shared`: container dan workspace bersama (tanpa isolasi antar sesi)

**Konfigurasi plugin OpenShell:**

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

- `mirror`: seed remote dari lokal sebelum exec, sinkronkan kembali setelah exec; workspace lokal tetap kanonis
- `remote`: seed remote sekali saat sandbox dibuat, lalu pertahankan workspace remote sebagai kanonis

Dalam mode `remote`, edit lokal host yang dibuat di luar OpenClaw tidak disinkronkan ke sandbox secara otomatis setelah langkah seed.
Transport menggunakan SSH ke sandbox OpenShell, tetapi plugin memiliki siklus hidup sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** berjalan sekali setelah pembuatan container (melalui `sh -lc`). Memerlukan egress jaringan, root yang dapat ditulis, dan pengguna root.

**Container default ke `network: "none"`** — setel ke `"bridge"` (atau jaringan bridge kustom) jika agen memerlukan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda secara eksplisit menyetel
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (opsi darurat).

**Lampiran masuk** dipentaskan ke `media/inbound/*` di workspace aktif.

**`docker.binds`** me-mount direktori host tambahan; bind global dan per agen digabungkan.

**Browser tersandbox** (`sandbox.browser.enabled`): Chromium + CDP di dalam container. URL noVNC disuntikkan ke system prompt. Tidak memerlukan `browser.enabled` di `openclaw.json`.
Akses pengamat noVNC menggunakan auth VNC secara default dan OpenClaw mengeluarkan URL token berumur pendek (bukan mengekspos kata sandi di URL bersama).

- `allowHostControl: false` (default) memblokir sesi tersandbox untuk menargetkan browser host.
- `network` default ke `openclaw-sandbox-browser` (jaringan bridge khusus). Setel ke `bridge` hanya jika Anda secara eksplisit menginginkan konektivitas bridge global.
- `cdpSourceRange` secara opsional membatasi ingress CDP di tepi container ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` me-mount direktori host tambahan hanya ke container browser sandbox. Saat disetel (termasuk `[]`), pengaturan ini menggantikan `docker.binds` untuk container browser.
- Default peluncuran didefinisikan di `scripts/sandbox-browser-entrypoint.sh` dan disetel untuk host container:
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
  - `--disable-extensions` (aktif secara default)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, dan `--disable-gpu`
    aktif secara default dan dapat dinonaktifkan dengan
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika penggunaan WebGL/3D memerlukannya.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` mengaktifkan kembali ekstensi jika alur kerja Anda
    bergantung padanya.
  - `--renderer-process-limit=2` dapat diubah dengan
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; setel `0` untuk menggunakan
    batas proses default Chromium.
  - ditambah `--no-sandbox` dan `--disable-setuid-sandbox` saat `noSandbox` diaktifkan.
  - Default adalah baseline image container; gunakan image browser kustom dengan entrypoint kustom untuk mengubah default container.

</Accordion>

Sandboxing browser dan `sandbox.docker.binds` hanya untuk Docker.

Bangun image:

```bash
scripts/sandbox-setup.sh           # image sandbox utama
scripts/sandbox-browser-setup.sh   # image browser opsional
```

### `agents.list` (override per agen)

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
        thinkingDefault: "high", // override level thinking per agen
        reasoningDefault: "on", // override visibilitas reasoning per agen
        fastModeDefault: false, // override fast mode per agen
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // menimpa params defaults.models yang cocok per key
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

- `id`: id agen stabil (wajib).
- `default`: saat beberapa disetel, yang pertama menang (peringatan dicatat). Jika tidak ada yang disetel, entri daftar pertama menjadi default.
- `model`: bentuk string hanya menimpa `primary`; bentuk objek `{ primary, fallbacks }` menimpa keduanya (`[]` menonaktifkan fallback global). Tugas Cron yang hanya menimpa `primary` tetap mewarisi fallback default kecuali Anda menyetel `fallbacks: []`.
- `params`: params stream per agen yang digabungkan di atas entri model yang dipilih di `agents.defaults.models`. Gunakan ini untuk override khusus agen seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `skills`: allowlist Skills per agen opsional. Jika dihilangkan, agen mewarisi `agents.defaults.skills` saat disetel; daftar eksplisit menggantikan default alih-alih digabungkan, dan `[]` berarti tanpa Skills.
- `thinkingDefault`: level thinking default per agen opsional (`off | minimal | low | medium | high | xhigh | adaptive | max`). Menimpa `agents.defaults.thinkingDefault` untuk agen ini saat tidak ada override per pesan atau sesi.
- `reasoningDefault`: visibilitas reasoning default per agen opsional (`on | off | stream`). Berlaku saat tidak ada override reasoning per pesan atau sesi.
- `fastModeDefault`: default per agen opsional untuk fast mode (`true | false`). Berlaku saat tidak ada override fast-mode per pesan atau sesi.
- `embeddedHarness`: override kebijakan harness tingkat rendah per agen opsional. Gunakan `{ runtime: "codex", fallback: "none" }` agar satu agen hanya Codex sementara agen lain tetap menggunakan fallback PI default.
- `runtime`: deskriptor runtime per agen opsional. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) saat agen seharusnya default ke sesi harness ACP.
- `identity.avatar`: path relatif workspace, URL `http(s)`, atau URI `data:`.
- `identity` menurunkan default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: allowlist id agen untuk `sessions_spawn` (`["*"]` = apa saja; default: hanya agen yang sama).
- Guard pewarisan sandbox: jika sesi peminta disandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: saat true, blokir pemanggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).

---

## Routing multi-agen

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

### Field pencocokan binding

- `type` (opsional): `route` untuk routing normal (type yang hilang default ke route), `acp` untuk binding percakapan ACP persisten.
- `match.channel` (wajib)
- `match.accountId` (opsional; `*` = akun apa saja; dihilangkan = akun default)
- `match.peer` (opsional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opsional; khusus channel)
- `acp` (opsional; hanya untuk entri `type: "acp"`): `{ mode, label, cwd, backend }`

**Urutan pencocokan deterministik:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (persis, tanpa peer/guild/team)
5. `match.accountId: "*"` (seluruh channel)
6. Agen default

Dalam setiap tingkat, entri `bindings` pertama yang cocok menang.

Untuk entri `type: "acp"`, OpenClaw menyelesaikan berdasarkan identitas percakapan persis (`match.channel` + akun + `match.peer.id`) dan tidak menggunakan urutan tingkat binding route di atas.

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

<Accordion title="Tanpa akses filesystem (hanya messaging)">

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

Lihat [Sandbox & Tools Multi-Agent](/id/tools/multi-agent-sandbox-tools) untuk detail prioritas.

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
    parentForkMaxTokens: 100000, // lewati fork thread induk di atas jumlah token ini (0 menonaktifkan)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durasi atau false
      maxDiskBytes: "500mb", // hard budget opsional
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

- **`scope`**: strategi pengelompokan sesi dasar untuk konteks chat grup.
  - `per-sender` (default): setiap pengirim mendapatkan sesi terisolasi dalam konteks channel.
  - `global`: semua peserta dalam konteks channel berbagi satu sesi (gunakan hanya bila konteks bersama memang diinginkan).
- **`dmScope`**: bagaimana DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: isolasi berdasarkan id pengirim lintas channel.
  - `per-channel-peer`: isolasi per channel + pengirim (disarankan untuk inbox multi-pengguna).
  - `per-account-channel-peer`: isolasi per akun + channel + pengirim (disarankan untuk multi-akun).
- **`identityLinks`**: peta id kanonis ke peer berprefiks provider untuk berbagi sesi lintas channel.
- **`reset`**: kebijakan reset utama. `daily` mereset pada `atHour` waktu lokal; `idle` mereset setelah `idleMinutes`. Jika keduanya dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.
- **`resetByType`**: override per jenis (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`parentForkMaxTokens`**: `totalTokens` sesi induk maksimum yang diizinkan saat membuat sesi thread hasil fork (default `100000`).
  - Jika `totalTokens` induk di atas nilai ini, OpenClaw memulai sesi thread baru alih-alih mewarisi riwayat transkrip induk.
  - Setel `0` untuk menonaktifkan guard ini dan selalu mengizinkan fork dari induk.
- **`mainKey`**: field lama. Runtime selalu menggunakan `"main"` untuk bucket chat langsung utama.
- **`agentToAgent.maxPingPongTurns`**: jumlah maksimum giliran balas-balik antar agen selama pertukaran agent-to-agent (integer, rentang: `0`–`5`). `0` menonaktifkan rantai ping-pong.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Deny pertama yang cocok menang.
- **`maintenance`**: pembersihan + kontrol retensi penyimpanan sesi.
  - `mode`: `warn` hanya mengeluarkan peringatan; `enforce` menerapkan pembersihan.
  - `pruneAfter`: batas usia untuk entri usang (default `30d`).
  - `maxEntries`: jumlah maksimum entri dalam `sessions.json` (default `500`).
  - `rotateBytes`: rotasi `sessions.json` saat melebihi ukuran ini (default `10mb`).
  - `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>`. Default ke `pruneAfter`; setel `false` untuk menonaktifkan.
  - `maxDiskBytes`: anggaran disk direktori sesi opsional. Dalam mode `warn` ini mencatat peringatan; dalam mode `enforce` ini menghapus artefak/sesi tertua terlebih dahulu.
  - `highWaterBytes`: target opsional setelah pembersihan anggaran. Default ke `80%` dari `maxDiskBytes`.
- **`threadBindings`**: default global untuk fitur sesi yang terikat ke thread.
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

Override per channel/akun: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik menang): akun → channel → global. `""` menonaktifkan dan menghentikan kaskade. `"auto"` menurunkan `[{identity.name}]`.

**Variabel template:**

| Variable          | Description            | Example                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nama model singkat     | `claude-opus-4-6`           |
| `{modelFull}`     | Identifier model penuh | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama provider          | `anthropic`                 |
| `{thinkingLevel}` | Level thinking saat ini | `high`, `low`, `off`       |
| `{identity.name}` | Nama identitas agen    | (sama seperti `"auto"`)     |

Variabel tidak peka huruf besar/kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi ack

- Default ke `identity.emoji` agen aktif, jika tidak ada maka `"👀"`. Setel `""` untuk menonaktifkan.
- Override per channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: akun → channel → `messages.ackReaction` → fallback identitas.
- Cakupan: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: menghapus ack setelah balasan di Slack, Discord, dan Telegram.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status siklus hidup di Slack, Discord, dan Telegram.
  Di Slack dan Discord, jika tidak disetel maka reaksi status tetap aktif saat reaksi ack aktif.
  Di Telegram, setel secara eksplisit ke `true` untuk mengaktifkan reaksi status siklus hidup.

### Debounce masuk

Mengelompokkan pesan teks cepat dari pengirim yang sama menjadi satu giliran agen. Media/lampiran langsung di-flush. Perintah kontrol melewati debounce.

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
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` mengontrol mode auto-TTS default: `off`, `always`, `inbound`, atau `tagged`. `/tts on|off` dapat menimpa preferensi lokal, dan `/tts status` menampilkan status efektif.
- `summaryModel` menimpa `agents.defaults.model.primary` untuk ringkasan otomatis.
- `modelOverrides` aktif secara default; `modelOverrides.allowProvider` default ke `false` (perlu opt-in).
- API key fallback ke `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY`.
- `openai.baseUrl` menimpa endpoint OpenAI TTS. Urutan resolusi adalah config, lalu `OPENAI_TTS_BASE_URL`, lalu `https://api.openai.com/v1`.
- Saat `openai.baseUrl` mengarah ke endpoint non-OpenAI, OpenClaw memperlakukannya sebagai server TTS yang kompatibel dengan OpenAI dan melonggarkan validasi model/voice.

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
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` harus cocok dengan key di `talk.providers` saat beberapa provider Talk dikonfigurasi.
- Key Talk datar lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas dan dimigrasikan otomatis ke `talk.providers.<provider>`.
- Voice ID fallback ke `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID`.
- `providers.*.apiKey` menerima string plaintext atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku saat tidak ada API key Talk yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan direktif Talk menggunakan nama yang ramah.
- `silenceTimeoutMs` mengontrol berapa lama mode Talk menunggu setelah pengguna diam sebelum mengirim transkrip. Jika tidak disetel, jendela jeda default platform tetap digunakan (`700 ms di macOS dan Android, 900 ms di iOS`).

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — semua key konfigurasi lainnya
- [Konfigurasi](/id/gateway/configuration) — tugas umum dan penyiapan cepat
- [Contoh konfigurasi](/id/gateway/configuration-examples)

---
read_when:
    - Menyesuaikan pengaturan bawaan agen (model, pemikiran, ruang kerja, Heartbeat, media, Skills)
    - Mengonfigurasi perutean dan pengikatan multi-agen
    - Menyesuaikan perilaku sesi, pengiriman pesan, dan mode bicara
summary: Default agen, perutean multi-agen, sesi, pesan, dan konfigurasi percakapan
title: Konfigurasi — agen
x-i18n:
    generated_at: "2026-05-07T13:16:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

Kunci konfigurasi bercakupan agen di bawah `agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, dan `talk.*`. Untuk channel, alat, runtime gateway, dan kunci
tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Default agen

### `agents.defaults.workspace`

Nilai bawaan: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan di baris Runtime prompt sistem. Jika tidak diatur, OpenClaw mendeteksi otomatis dengan menelusuri ke atas dari workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist skill bawaan opsional untuk agen yang tidak mengatur
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

- Hilangkan `agents.defaults.skills` agar skill tidak dibatasi secara bawaan.
- Hilangkan `agents.list[].skills` untuk mewarisi nilai bawaan.
- Atur `agents.list[].skills: []` agar tidak ada skill.
- Daftar `agents.list[].skills` yang tidak kosong adalah set final untuk agen tersebut; daftar ini
  tidak digabungkan dengan nilai bawaan.

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

Mengontrol kapan file bootstrap workspace disisipkan ke prompt sistem. Nilai bawaan: `"always"`.

- `"continuation-skip"`: giliran kelanjutan yang aman (setelah respons asisten selesai) melewati penyisipan ulang bootstrap workspace, sehingga mengurangi ukuran prompt. Proses Heartbeat dan percobaan ulang pasca-Compaction tetap membangun ulang konteks.
- `"never"`: menonaktifkan bootstrap workspace dan penyisipan file konteks pada setiap giliran. Gunakan ini hanya untuk agen yang sepenuhnya mengelola siklus hidup prompt mereka sendiri (mesin konteks kustom, runtime native yang membangun konteksnya sendiri, atau workflow khusus tanpa bootstrap). Giliran Heartbeat dan pemulihan Compaction juga melewati penyisipan.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Karakter maksimum per file bootstrap workspace sebelum pemotongan. Nilai bawaan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Total karakter maksimum yang disisipkan di seluruh file bootstrap workspace. Nilai bawaan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Mengontrol pemberitahuan prompt sistem yang terlihat oleh agen saat konteks bootstrap dipotong.
Nilai bawaan: `"once"`.

- `"off"`: jangan pernah menyisipkan teks pemberitahuan pemotongan ke prompt sistem.
- `"once"`: sisipkan pemberitahuan ringkas sekali per tanda tangan pemotongan unik (direkomendasikan).
- `"always"`: sisipkan pemberitahuan ringkas pada setiap proses saat ada pemotongan.

Jumlah mentah/tersisip yang terperinci dan kolom penyesuaian konfigurasi tetap berada dalam diagnostik seperti
laporan dan log konteks/status; konteks pengguna/runtime WebChat rutin hanya
mendapatkan pemberitahuan pemulihan ringkas.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Peta kepemilikan anggaran konteks

OpenClaw memiliki beberapa anggaran prompt/konteks bervolume tinggi, dan semuanya
secara sengaja dipisahkan menurut subsistem alih-alih semuanya mengalir melalui satu
kenop generik.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  penyisipan bootstrap workspace normal.
- `agents.defaults.startupContext.*`:
  prelude proses model satu kali saat reset/startup, termasuk file `memory/*.md`
  harian terbaru. Perintah chat polos `/new` dan `/reset`
  diakui tanpa menjalankan model.
- `skills.limits.*`:
  daftar skills ringkas yang disisipkan ke prompt sistem.
- `agents.defaults.contextLimits.*`:
  cuplikan runtime terbatas dan blok milik runtime yang disisipkan.
- `memory.qmd.limits.*`:
  cuplikan pencarian memori terindeks dan ukuran penyisipan.

Gunakan pengesampingan per agen yang sesuai hanya saat satu agen memerlukan
anggaran berbeda:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Mengontrol prelude startup giliran pertama yang disisipkan pada proses model reset/startup.
Perintah chat polos `/new` dan `/reset` mengakui reset tanpa menjalankan
model, sehingga perintah tersebut tidak memuat prelude ini.

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

Default bersama untuk permukaan konteks runtime terbatas.

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

- `memoryGetMaxChars`: batas cuplikan `memory_get` bawaan sebelum metadata
  pemotongan dan pemberitahuan kelanjutan ditambahkan.
- `memoryGetDefaultLines`: jendela baris `memory_get` bawaan saat `lines`
  dihilangkan.
- `toolResultMaxChars`: batas hasil alat live yang digunakan untuk hasil tersimpan dan
  pemulihan overflow.
- `postCompactionMaxChars`: batas cuplikan AGENTS.md yang digunakan selama penyegaran
  penyisipan pasca-Compaction.

#### `agents.list[].contextLimits`

Pengesampingan per agen untuk kenop `contextLimits` bersama. Kolom yang dihilangkan mewarisi
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

Batas global untuk daftar skills ringkas yang disisipkan ke prompt sistem. Ini
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

Pengesampingan per agen untuk anggaran prompt skills.

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

Ukuran piksel maksimum untuk sisi gambar terpanjang dalam blok gambar transcript/alat sebelum panggilan provider.
Nilai bawaan: `1200`.

Nilai lebih rendah biasanya mengurangi penggunaan token vision dan ukuran payload permintaan untuk proses yang berat dengan screenshot.
Nilai lebih tinggi mempertahankan lebih banyak detail visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zona waktu untuk konteks prompt sistem (bukan stempel waktu pesan). Kembali ke zona waktu host jika tidak tersedia.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format waktu dalam prompt sistem. Nilai bawaan: `auto` (preferensi OS).

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
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
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
  - Bentuk string hanya menetapkan model utama.
  - Bentuk objek menetapkan model utama beserta model failover berurutan.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh jalur alat `image` sebagai konfigurasi model visinya.
  - Juga digunakan sebagai perutean fallback ketika model yang dipilih/default tidak dapat menerima input gambar.
  - Utamakan ref `provider/model` eksplisit. ID polos diterima untuk kompatibilitas; jika ID polos cocok secara unik dengan entri berkemampuan gambar yang dikonfigurasi di `models.providers.*.models`, OpenClaw mengaitkannya dengan penyedia tersebut. Kecocokan konfigurasi yang ambigu membutuhkan prefiks penyedia eksplisit.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan gambar bersama dan setiap permukaan alat/Plugin mendatang yang menghasilkan gambar.
  - Nilai umum: `google/gemini-3.1-flash-image-preview` untuk pembuatan gambar Gemini native, `fal/fal-ai/flux/dev` untuk fal, `openai/gpt-image-2` untuk OpenAI Images, atau `openai/gpt-image-1.5` untuk output PNG/WebP OpenAI dengan latar belakang transparan.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi penyedia yang cocok (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` atau OpenAI Codex OAuth untuk `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan gambar terdaftar lainnya dalam urutan ID penyedia.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan musik bersama dan alat bawaan `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.6`.
  - Jika dihilangkan, `music_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan musik terdaftar lainnya dalam urutan ID penyedia.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi/kunci API penyedia yang cocok.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan video bersama dan alat bawaan `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan video terdaftar lainnya dalam urutan ID penyedia.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi/kunci API penyedia yang cocok.
  - Penyedia pembuatan video Qwen yang dibundel mendukung hingga 1 video output, 1 gambar input, 4 video input, durasi 10 detik, serta opsi tingkat penyedia `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh alat `pdf` untuk perutean model.
  - Jika dihilangkan, alat PDF fallback ke `imageModel`, lalu ke model sesi/default yang di-resolve.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk alat `pdf` ketika `maxBytesMb` tidak diteruskan saat pemanggilan.
- `pdfMaxPages`: jumlah halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi di alat `pdf`.
- `verboseDefault`: tingkat verbose default untuk agen. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `toolProgressDetail`: mode detail untuk ringkasan alat `/verbose` dan baris alat draf progres. Nilai: `"explain"` (default, label manusia yang ringkas) atau `"raw"` (menambahkan perintah/detail mentah jika tersedia). `agents.list[].toolProgressDetail` per agen menimpa default ini.
- `reasoningDefault`: visibilitas penalaran default untuk agen. Nilai: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` per agen menimpa default ini. Default penalaran yang dikonfigurasi hanya diterapkan untuk pemilik, pengirim resmi, atau konteks Gateway admin-operator ketika tidak ada penimpaan penalaran per pesan atau sesi yang ditetapkan.
- `elevatedDefault`: tingkat output elevated default untuk agen. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (misalnya `openai/gpt-5.5` untuk kunci API OpenAI atau akses Codex OAuth). Jika Anda menghilangkan penyedia, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan penyedia-terkonfigurasi unik untuk ID model persis tersebut, dan baru kemudian fallback ke penyedia default yang dikonfigurasi (perilaku kompatibilitas usang, jadi utamakan `provider/model` eksplisit). Jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw fallback ke penyedia/model terkonfigurasi pertama alih-alih menampilkan default penyedia lama yang sudah dihapus.
- `models`: katalog model yang dikonfigurasi dan allowlist untuk `/model`. Setiap entri dapat menyertakan `alias` (pintasan) dan `params` (khusus penyedia, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Pengeditan aman: gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri. `config set` menolak penggantian yang akan menghapus entri allowlist yang sudah ada kecuali Anda meneruskan `--replace`.
  - Alur konfigurasi/onboarding dengan cakupan penyedia menggabungkan model penyedia yang dipilih ke dalam peta ini dan mempertahankan penyedia tidak terkait yang sudah dikonfigurasi.
  - Untuk model OpenAI Responses langsung, Compaction sisi server diaktifkan otomatis. Gunakan `params.responsesServerCompaction: false` untuk menghentikan penyuntikan `context_management`, atau `params.responsesCompactThreshold` untuk menimpa ambang batas. Lihat [Compaction sisi server OpenAI](/id/providers/openai#server-side-compaction-responses-api).
- `params`: parameter penyedia default global yang diterapkan ke semua model. Ditetapkan di `agents.defaults.params` (misalnya `{ cacheRetention: "long" }`).
- Presedensi penggabungan `params` (konfigurasi): `agents.defaults.params` (basis global) ditimpa oleh `agents.defaults.models["provider/model"].params` (per model), lalu `agents.list[].params` (ID agen yang cocok) menimpa berdasarkan kunci. Lihat [Caching Prompt](/id/reference/prompt-caching) untuk detail.
- `params.extra_body`/`params.extraBody`: JSON pass-through lanjutan yang digabungkan ke body permintaan `api: "openai-completions"` untuk proxy yang kompatibel dengan OpenAI. Jika bertabrakan dengan kunci permintaan yang dihasilkan, body tambahan menang; rute completions non-native tetap menghapus `store` khusus OpenAI setelahnya.
- `params.chat_template_kwargs`: argumen templat chat yang kompatibel dengan vLLM/OpenAI yang digabungkan ke body permintaan tingkat atas `api: "openai-completions"`. Untuk `vllm/nemotron-3-*` dengan thinking nonaktif, Plugin vLLM yang dibundel otomatis mengirim `enable_thinking: false` dan `force_nonempty_content: true`; `chat_template_kwargs` eksplisit menimpa default yang dihasilkan, dan `extra_body.chat_template_kwargs` tetap memiliki presedensi akhir. Untuk kontrol thinking Qwen vLLM, tetapkan `params.qwenThinkingFormat` ke `"chat-template"` atau `"top-level"` pada entri model tersebut.
- `compat.supportedReasoningEfforts`: daftar upaya penalaran per model yang kompatibel dengan OpenAI. Sertakan `"xhigh"` untuk endpoint kustom yang benar-benar menerimanya; OpenClaw kemudian mengekspos `/think xhigh` di menu perintah, baris sesi Gateway, validasi patch sesi, validasi CLI agen, dan validasi `llm-task` untuk penyedia/model terkonfigurasi tersebut. Gunakan `compat.reasoningEffortMap` ketika backend menginginkan nilai khusus penyedia untuk tingkat kanonis.
- `params.preserveThinking`: opt-in khusus Z.AI untuk thinking yang dipertahankan. Saat diaktifkan dan thinking menyala, OpenClaw mengirim `thinking.clear_thinking: false` dan memutar ulang `reasoning_content` sebelumnya; lihat [thinking Z.AI dan thinking yang dipertahankan](/id/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: kebijakan runtime agen tingkat rendah default. ID yang dihilangkan default ke OpenClaw Pi. Gunakan `id: "pi"` untuk memaksa harness PI bawaan, `id: "auto"` untuk membiarkan harness Plugin terdaftar mengklaim model yang didukung dan menggunakan PI ketika tidak ada yang cocok, ID harness terdaftar seperti `id: "codex"` untuk mewajibkan harness tersebut, atau alias backend CLI yang didukung seperti `id: "claude-cli"`. Runtime Plugin eksplisit gagal tertutup ketika harness tidak tersedia atau gagal. Pertahankan ref model kanonis sebagai `provider/model`; pilih Codex, Claude CLI, Gemini CLI, dan backend eksekusi lain melalui konfigurasi runtime alih-alih prefiks penyedia runtime lama. Lihat [Runtime agen](/id/concepts/agent-runtimes) untuk mengetahui perbedaannya dengan pemilihan penyedia/model.
- Penulis konfigurasi yang mengubah field ini (misalnya `/models set`, `/models set-image`, dan perintah tambah/hapus fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang sudah ada jika memungkinkan.
- `maxConcurrent`: jumlah maksimum run agen paralel lintas sesi (setiap sesi tetap diserialkan). Default: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` mengontrol eksekutor tingkat rendah mana yang menjalankan giliran agen. Sebagian besar
deployment sebaiknya mempertahankan runtime OpenClaw Pi default. Gunakan ketika Plugin tepercaya
menyediakan harness native, seperti harness app-server Codex yang dibundel,
atau ketika Anda menginginkan backend CLI yang didukung seperti Claude CLI. Untuk model mentalnya,
lihat [Runtime agen](/id/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, ID harness Plugin terdaftar, atau alias backend CLI yang didukung. Plugin Codex yang dibundel mendaftarkan `codex`; Plugin Anthropic yang dibundel menyediakan backend CLI `claude-cli`.
- `id: "auto"` membiarkan harness Plugin terdaftar mengklaim giliran yang didukung dan menggunakan PI ketika tidak ada harness yang cocok. Runtime Plugin eksplisit seperti `id: "codex"` mewajibkan harness tersebut dan gagal tertutup jika tidak tersedia atau gagal.
- Penimpaan lingkungan: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` menimpa `id` untuk proses tersebut.
- Model agen OpenAI menggunakan harness Codex secara default; `agentRuntime.id: "codex"` tetap valid ketika Anda ingin membuatnya eksplisit.
- Untuk deployment Claude CLI, utamakan `model: "anthropic/claude-opus-4-7"` ditambah `agentRuntime.id: "claude-cli"`. Ref model lama `claude-cli/claude-opus-4-7` tetap berfungsi untuk kompatibilitas, tetapi konfigurasi baru sebaiknya mempertahankan pemilihan penyedia/model secara kanonis dan menaruh backend eksekusi di `agentRuntime.id`.
- Kunci kebijakan runtime lama ditulis ulang ke `agentRuntime` oleh `openclaw doctor --fix`.
- Pilihan harness dipasangkan per ID sesi setelah run tertanam pertama. Perubahan konfigurasi/env memengaruhi sesi baru atau sesi yang direset, bukan transkrip yang sudah ada. Sesi OpenAI lama dengan riwayat transkrip tetapi tanpa pin yang tercatat menggunakan Codex; pin PI OpenAI usang dapat diperbaiki dengan `openclaw doctor --fix`. `/status` melaporkan runtime efektif, misalnya `Runtime: OpenClaw Pi Default` atau `Runtime: OpenAI Codex`.
- Ini hanya mengontrol eksekusi giliran agen teks. Pembuatan media, visi, PDF, musik, video, dan TTS tetap menggunakan pengaturan penyedia/model masing-masing.

**Singkatan alias bawaan** (hanya berlaku ketika model berada di `agents.defaults.models`):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Alias yang Anda konfigurasi selalu menang atas default.

Model Z.AI GLM-4.x otomatis mengaktifkan mode berpikir kecuali Anda menetapkan `--thinking off` atau mendefinisikan `agents.defaults.models["zai/<model>"].params.thinking` sendiri.
Model Z.AI mengaktifkan `tool_stream` secara default untuk streaming pemanggilan alat. Tetapkan `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Model Anthropic Claude 4.6 secara default menggunakan berpikir `adaptive` ketika tidak ada tingkat berpikir eksplisit yang ditetapkan.

### `agents.defaults.cliBackends`

Backend CLI opsional untuk eksekusi fallback hanya teks (tanpa pemanggilan alat). Berguna sebagai cadangan saat penyedia API gagal.

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
- Sesi didukung saat `sessionArg` ditetapkan.
- Penerusan gambar didukung saat `imageArg` menerima path file.

### `agents.defaults.systemPromptOverride`

Ganti seluruh prompt sistem yang dirakit OpenClaw dengan string tetap. Tetapkan di level default (`agents.defaults.systemPromptOverride`) atau per agen (`agents.list[].systemPromptOverride`). Nilai per agen diprioritaskan; nilai kosong atau hanya spasi diabaikan. Berguna untuk eksperimen prompt yang terkontrol.

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

Overlay prompt yang independen dari penyedia, diterapkan berdasarkan keluarga model. ID model keluarga GPT-5 menerima kontrak perilaku bersama lintas penyedia; `personality` hanya mengontrol lapisan gaya interaksi yang ramah.

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
- `plugins.entries.openai.config.personality` lama masih dibaca saat pengaturan bersama ini belum ditetapkan.

### `agents.defaults.heartbeat`

Eksekusi Heartbeat berkala.

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

- `every`: string durasi (ms/s/m/h). Default: `30m` (autentikasi kunci API) atau `1h` (autentikasi OAuth). Tetapkan ke `0m` untuk menonaktifkan.
- `includeSystemPromptSection`: saat false, menghilangkan bagian Heartbeat dari prompt sistem dan melewati injeksi `HEARTBEAT.md` ke konteks bootstrap. Default: `true`.
- `suppressToolErrorWarnings`: saat true, menekan payload peringatan kesalahan alat selama eksekusi heartbeat.
- `timeoutSeconds`: waktu maksimum dalam detik yang diizinkan untuk satu giliran agen heartbeat sebelum dibatalkan. Biarkan tidak ditetapkan untuk menggunakan `agents.defaults.timeoutSeconds`.
- `directPolicy`: kebijakan pengiriman langsung/DM. `allow` (default) mengizinkan pengiriman target langsung. `block` menekan pengiriman target langsung dan memancarkan `reason=dm-blocked`.
- `lightContext`: saat true, eksekusi heartbeat menggunakan konteks bootstrap ringan dan hanya menyimpan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: saat true, setiap heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasi yang sama seperti cron `sessionTarget: "isolated"`. Mengurangi biaya token per heartbeat dari ~100K menjadi ~2-5K token.
- `skipWhenBusy`: saat true, eksekusi heartbeat ditunda pada jalur sibuk tambahan: pekerjaan subagen atau perintah bersarang. Jalur Cron selalu menunda heartbeat, bahkan tanpa flag ini.
- Per agen: tetapkan `agents.list[].heartbeat`. Saat ada agen yang mendefinisikan `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat.
- Heartbeat menjalankan giliran agen penuh — interval lebih pendek menghabiskan lebih banyak token.

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

- `mode`: `default` atau `safeguard` (perangkuman berpotongan untuk riwayat panjang). Lihat [Compaction](/id/concepts/compaction).
- `provider`: ID Plugin penyedia Compaction terdaftar. Saat ditetapkan, `summarize()` milik penyedia dipanggil alih-alih perangkuman LLM bawaan. Kembali ke bawaan saat gagal. Menetapkan penyedia memaksa `mode: "safeguard"`. Lihat [Compaction](/id/concepts/compaction).
- `timeoutSeconds`: detik maksimum yang diizinkan untuk satu operasi Compaction sebelum OpenClaw membatalkannya. Default: `900`.
- `keepRecentTokens`: anggaran titik potong Pi untuk mempertahankan ekor transkrip terbaru secara verbatim. `/compact` manual menghormati ini saat ditetapkan secara eksplisit; jika tidak, Compaction manual menjadi checkpoint keras.
- `identifierPolicy`: `strict` (default), `off`, atau `custom`. `strict` menambahkan panduan retensi pengidentifikasi buram bawaan di awal selama perangkuman Compaction.
- `identifierInstructions`: teks kustom opsional untuk preservasi pengidentifikasi yang digunakan saat `identifierPolicy=custom`.
- `qualityGuard`: pemeriksaan coba lagi saat output cacat untuk ringkasan safeguard. Diaktifkan secara default dalam mode safeguard; tetapkan `enabled: false` untuk melewati audit.
- `midTurnPrecheck`: pemeriksaan tekanan loop alat Pi opsional. Saat `enabled: true`, OpenClaw memeriksa tekanan konteks setelah hasil alat ditambahkan dan sebelum pemanggilan model berikutnya. Jika konteks tidak lagi muat, OpenClaw membatalkan upaya saat ini sebelum mengirim prompt dan menggunakan kembali jalur pemulihan precheck yang ada untuk memangkas hasil alat atau melakukan Compaction dan mencoba lagi. Berfungsi dengan mode Compaction `default` dan `safeguard`. Default: dinonaktifkan.
- `postCompactionSections`: nama bagian H2/H3 AGENTS.md opsional untuk diinjeksi ulang setelah Compaction. Default ke `["Session Startup", "Red Lines"]`; tetapkan `[]` untuk menonaktifkan reinjeksi. Saat tidak ditetapkan atau ditetapkan secara eksplisit ke pasangan default tersebut, heading lama `Every Session`/`Safety` juga diterima sebagai fallback warisan.
- `model`: override `provider/model-id` opsional hanya untuk perangkuman Compaction. Gunakan ini saat sesi utama harus tetap memakai satu model tetapi ringkasan Compaction harus berjalan pada model lain; saat tidak ditetapkan, Compaction menggunakan model utama sesi.
- `maxActiveTranscriptBytes`: ambang byte opsional (`number` atau string seperti `"20mb"`) yang memicu Compaction lokal normal sebelum eksekusi saat JSONL aktif melewati ambang. Memerlukan `truncateAfterCompaction` agar Compaction yang berhasil dapat merotasi ke transkrip penerus yang lebih kecil. Dinonaktifkan saat tidak ditetapkan atau `0`.
- `notifyUser`: saat `true`, mengirim pemberitahuan singkat kepada pengguna saat Compaction dimulai dan saat selesai (misalnya, "Memadatkan konteks..." dan "Compaction selesai"). Dinonaktifkan secara default agar Compaction tetap senyap.
- `memoryFlush`: giliran agen senyap sebelum Compaction otomatis untuk menyimpan memori tahan lama. Tetapkan `model` ke penyedia/model persis seperti `ollama/qwen3:8b` saat giliran housekeeping ini harus tetap pada model lokal; override tidak mewarisi rantai fallback sesi aktif. Dilewati saat workspace hanya baca.

### `agents.defaults.contextPruning`

Memangkas **hasil alat lama** dari konteks dalam memori sebelum dikirim ke LLM. **Tidak** mengubah riwayat sesi di disk.

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

<Accordion title="perilaku mode cache-ttl">

- `mode: "cache-ttl"` mengaktifkan lintasan pemangkasan.
- `ttl` mengontrol seberapa sering pemangkasan dapat berjalan lagi (setelah sentuhan cache terakhir).
- Pemangkasan terlebih dahulu melakukan soft-trim pada hasil alat yang terlalu besar, lalu hard-clear hasil alat yang lebih lama jika diperlukan.

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

- Kanal selain Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
- Override kanal: `channels.<channel>.blockStreamingCoalesce` (dan varian per akun). Signal/Slack/Discord/Google Chat secara default menggunakan `minChars: 1500`.
- `humanDelay`: jeda acak di antara balasan blok. `natural` = 800-2500ms. Override per agen: `agents.list[].humanDelay`.

Lihat [Streaming](/id/concepts/streaming) untuk detail perilaku + pemotongan chunk.

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

<Accordion title="Sandbox details">

**Backend:**

- `docker`: runtime Docker lokal (default)
- `ssh`: runtime jarak jauh generik berbasis SSH
- `openshell`: runtime OpenShell

Saat `backend: "openshell"` dipilih, pengaturan khusus runtime berpindah ke
`plugins.entries.openshell.config`.

**Konfigurasi backend SSH:**

- `target`: target SSH dalam bentuk `user@host[:port]`
- `command`: perintah klien SSH (default: `ssh`)
- `workspaceRoot`: root jarak jauh absolut yang digunakan untuk workspace per cakupan
- `identityFile` / `certificateFile` / `knownHostsFile`: file lokal yang ada dan diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: konten inline atau SecretRefs yang diwujudkan OpenClaw menjadi file sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: kenop kebijakan host-key OpenSSH

**Presedensi auth SSH:**

- `identityData` mengalahkan `identityFile`
- `certificateData` mengalahkan `certificateFile`
- `knownHostsData` mengalahkan `knownHostsFile`
- Nilai `*Data` berbasis SecretRef diselesaikan dari snapshot runtime rahasia aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- mengisi workspace jarak jauh sekali setelah pembuatan atau pembuatan ulang
- lalu menjaga workspace SSH jarak jauh sebagai kanonis
- merutekan `exec`, alat file, dan jalur media melalui SSH
- tidak menyinkronkan perubahan jarak jauh kembali ke host secara otomatis
- tidak mendukung kontainer browser sandbox

**Akses workspace:**

- `none`: workspace sandbox per cakupan di bawah `~/.openclaw/sandboxes`
- `ro`: workspace sandbox di `/workspace`, workspace agen di-mount hanya-baca di `/agent`
- `rw`: workspace agen di-mount baca/tulis di `/workspace`

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

- `mirror`: isi remote dari lokal sebelum exec, sinkronkan kembali setelah exec; workspace lokal tetap kanonis
- `remote`: isi remote sekali saat sandbox dibuat, lalu pertahankan workspace jarak jauh sebagai kanonis

Dalam mode `remote`, edit host-lokal yang dibuat di luar OpenClaw tidak disinkronkan ke sandbox secara otomatis setelah langkah seed.
Transport adalah SSH ke sandbox OpenShell, tetapi Plugin memiliki lifecycle sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** berjalan sekali setelah pembuatan kontainer (melalui `sh -lc`). Membutuhkan egress jaringan, root yang dapat ditulis, pengguna root.

**Kontainer default ke `network: "none"`** — atur ke `"bridge"` (atau jaringan bridge khusus) jika agen membutuhkan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda menetapkan secara eksplisit
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Lampiran masuk** disiapkan ke `media/inbound/*` di workspace aktif.

**`docker.binds`** me-mount direktori host tambahan; bind global dan per agen digabungkan.

**Browser sandbox** (`sandbox.browser.enabled`): Chromium + CDP dalam kontainer. URL noVNC disisipkan ke prompt sistem. Tidak membutuhkan `browser.enabled` di `openclaw.json`.
Akses pengamat noVNC menggunakan auth VNC secara default dan OpenClaw memancarkan URL token berumur pendek (alih-alih mengekspos kata sandi di URL bersama).

- `allowHostControl: false` (default) memblokir sesi sandbox agar tidak menargetkan browser host.
- `network` default ke `openclaw-sandbox-browser` (jaringan bridge khusus). Atur ke `bridge` hanya saat Anda secara eksplisit menginginkan konektivitas bridge global.
- `cdpSourceRange` secara opsional membatasi ingress CDP di tepi kontainer ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` me-mount direktori host tambahan hanya ke kontainer browser sandbox. Saat diatur (termasuk `[]`), ini menggantikan `docker.binds` untuk kontainer browser.
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
  - Default adalah baseline image kontainer; gunakan image browser khusus dengan
    entrypoint khusus untuk mengubah default kontainer.

</Accordion>

Sandboxing browser dan `sandbox.docker.binds` hanya untuk Docker.

Bangun image (dari checkout sumber):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Untuk instalasi npm tanpa checkout sumber, lihat [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup) untuk perintah `docker build` inline.

### `agents.list` (override per agen)

Gunakan `agents.list[].tts` untuk memberi agen penyedia, suara, model,
gaya, atau mode TTS otomatisnya sendiri. Blok agen melakukan deep-merge di atas
`messages.tts` global, sehingga kredensial bersama dapat tetap di satu tempat sementara
agen individual hanya meng-override bidang suara atau penyedia yang mereka butuhkan. Override agen aktif
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
        agentRuntime: { id: "auto" },
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
- `default`: ketika beberapa disetel, yang pertama menang (peringatan dicatat di log). Jika tidak ada yang disetel, entri daftar pertama menjadi default.
- `model`: bentuk string menetapkan model utama per agen yang ketat tanpa cadangan model; bentuk objek `{ primary }` juga ketat kecuali Anda menambahkan `fallbacks`. Gunakan `{ primary, fallbacks: [...] }` untuk mengikutsertakan agen tersebut ke cadangan, atau `{ primary, fallbacks: [] }` untuk membuat perilaku ketat menjadi eksplisit. Pekerjaan Cron yang hanya mengganti `primary` tetap mewarisi cadangan default kecuali Anda menyetel `fallbacks: []`.
- `params`: parameter streaming per agen yang digabungkan di atas entri model yang dipilih di `agents.defaults.models`. Gunakan ini untuk penggantian khusus agen seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `tts`: penggantian teks-ke-ucapan opsional per agen. Blok ini digabungkan secara mendalam di atas `messages.tts`, jadi simpan kredensial penyedia bersama dan kebijakan cadangan di `messages.tts` lalu setel hanya nilai khusus persona seperti penyedia, suara, model, gaya, atau mode otomatis di sini.
- `skills`: daftar izin skill opsional per agen. Jika dihilangkan, agen mewarisi `agents.defaults.skills` ketika disetel; daftar eksplisit menggantikan default alih-alih menggabungkannya, dan `[]` berarti tanpa skill.
- `thinkingDefault`: tingkat berpikir default opsional per agen (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mengganti `agents.defaults.thinkingDefault` untuk agen ini ketika tidak ada penggantian per pesan atau sesi yang disetel. Profil penyedia/model yang dipilih mengontrol nilai mana yang valid; untuk Google Gemini, `adaptive` mempertahankan pemikiran dinamis milik penyedia (`thinkingLevel` dihilangkan pada Gemini 3/3.1, `thinkingBudget: -1` pada Gemini 2.5).
- `reasoningDefault`: visibilitas penalaran default opsional per agen (`on | off | stream`). Mengganti `agents.defaults.reasoningDefault` untuk agen ini ketika tidak ada penggantian penalaran per pesan atau sesi yang disetel.
- `fastModeDefault`: default opsional per agen untuk mode cepat (`true | false`). Berlaku ketika tidak ada penggantian mode cepat per pesan atau sesi yang disetel.
- `agentRuntime`: penggantian kebijakan runtime tingkat rendah opsional per agen. Gunakan `{ id: "codex" }` untuk membuat satu agen hanya Codex sementara agen lain mempertahankan cadangan PI default dalam mode `auto`.
- `runtime`: deskriptor runtime opsional per agen. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) ketika agen seharusnya menggunakan sesi harness ACP secara default.
- `identity.avatar`: path relatif workspace, URL `http(s)`, atau URI `data:`.
- `identity` menurunkan default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: daftar izin id agen untuk target `sessions_spawn.agentId` eksplisit (`["*"]` = apa saja; default: hanya agen yang sama). Sertakan id peminta ketika panggilan `agentId` yang menargetkan diri sendiri harus diizinkan.
- Pelindung pewarisan sandbox: jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: ketika true, blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).

---

## Perutean multi-agen

Jalankan beberapa agen terisolasi di dalam satu Gateway. Lihat [Multi-Agen](/id/concepts/multi-agent).

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

### Bidang kecocokan binding

- `type` (opsional): `route` untuk perutean normal (tipe yang hilang menggunakan route sebagai default), `acp` untuk binding percakapan ACP persisten.
- `match.channel` (wajib)
- `match.accountId` (opsional; `*` = akun apa pun; dihilangkan = akun default)
- `match.peer` (opsional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opsional; khusus channel)
- `acp` (opsional; hanya untuk `type: "acp"`): `{ mode, label, cwd, backend }`

**Urutan kecocokan deterministik:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (persis, tanpa peer/guild/team)
5. `match.accountId: "*"` (seluruh channel)
6. Agen default

Di dalam setiap tingkat, entri `bindings` pertama yang cocok menang.

Untuk entri `type: "acp"`, OpenClaw menyelesaikan berdasarkan identitas percakapan persis (`match.channel` + akun + `match.peer.id`) dan tidak menggunakan urutan tingkat binding rute di atas.

### Profil akses per agen

<Accordion title="Full access (no sandbox)">

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

<Accordion title="Read-only tools + workspace">

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

<Accordion title="No filesystem access (messaging only)">

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

<Accordion title="Session field details">

- **`scope`**: strategi pengelompokan sesi dasar untuk konteks chat grup.
  - `per-sender` (default): setiap pengirim mendapat sesi terisolasi dalam konteks channel.
  - `global`: semua peserta dalam konteks channel berbagi satu sesi (gunakan hanya saat konteks bersama memang dimaksudkan).
- **`dmScope`**: cara DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: isolasi berdasarkan id pengirim lintas channel.
  - `per-channel-peer`: isolasi per channel + pengirim (direkomendasikan untuk inbox multi-pengguna).
  - `per-account-channel-peer`: isolasi per akun + channel + pengirim (direkomendasikan untuk multi-akun).
- **`identityLinks`**: memetakan id kanonis ke peer berprefiks provider untuk berbagi sesi lintas channel. Perintah Dock seperti `/dock_discord` menggunakan peta yang sama untuk mengalihkan rute balasan sesi aktif ke peer channel tertaut lainnya; lihat [Docking channel](/id/concepts/channel-docking).
- **`reset`**: kebijakan reset utama. `daily` mereset pada waktu lokal `atHour`; `idle` mereset setelah `idleMinutes`. Saat keduanya dikonfigurasi, yang kedaluwarsa lebih dulu menang. Kesegaran reset harian menggunakan `sessionStartedAt` pada baris sesi; kesegaran reset idle menggunakan `lastInteractionAt`. Penulisan latar belakang/peristiwa sistem seperti Heartbeat, panggilan bangun Cron, notifikasi exec, dan pembukuan Gateway dapat memperbarui `updatedAt`, tetapi tidak menjaga sesi harian/idle tetap segar.
- **`resetByType`**: override per tipe (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`mainKey`**: field lama. Runtime selalu menggunakan `"main"` untuk bucket direct-chat utama.
- **`agentToAgent.maxPingPongTurns`**: jumlah giliran balas-balik maksimum antar agen selama pertukaran agen-ke-agen (integer, rentang: `0`-`5`). `0` menonaktifkan perangkaian ping-pong.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Deny pertama menang.
- **`maintenance`**: kontrol pembersihan + retensi penyimpanan sesi.
  - `mode`: `warn` hanya memancarkan peringatan; `enforce` menerapkan pembersihan.
  - `pruneAfter`: batas usia untuk entri usang (default `30d`).
  - `maxEntries`: jumlah maksimum entri dalam `sessions.json` (default `500`). Runtime menulis pembersihan batch dengan buffer high-water kecil untuk batas berukuran produksi; `openclaw sessions cleanup --enforce` menerapkan batas segera.
  - `rotateBytes`: tidak digunakan lagi dan diabaikan; `openclaw doctor --fix` menghapusnya dari konfigurasi lama.
  - `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>`. Default ke `pruneAfter`; atur `false` untuk menonaktifkan.
  - `maxDiskBytes`: anggaran disk direktori sesi opsional. Dalam mode `warn`, ini mencatat peringatan; dalam mode `enforce`, ini menghapus artefak/sesi tertua terlebih dahulu.
  - `highWaterBytes`: target opsional setelah pembersihan anggaran. Default ke `80%` dari `maxDiskBytes`.
- **`threadBindings`**: default global untuk fitur sesi terikat thread.
  - `enabled`: sakelar default utama (provider dapat meng-override; Discord menggunakan `channels.discord.threadBindings.enabled`)
  - `idleHours`: default auto-unfocus karena tidak aktif dalam jam (`0` menonaktifkan; provider dapat meng-override)
  - `maxAgeHours`: default usia maksimum keras dalam jam (`0` menonaktifkan; provider dapat meng-override)
  - `spawnSessions`: gate default untuk membuat sesi kerja terikat thread dari `sessions_spawn` dan spawn thread ACP. Default ke `true` saat binding thread diaktifkan; provider/akun dapat meng-override.
  - `defaultSpawnContext`: konteks subagen native default untuk spawn terikat thread (`"fork"` atau `"isolated"`). Default ke `"fork"`.

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

Penimpaan per kanal/akun: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik menang): akun → kanal → global. `""` menonaktifkan dan menghentikan kaskade. `"auto"` menghasilkan `[{identity.name}]`.

**Variabel template:**

| Variabel          | Deskripsi                  | Contoh                      |
| ----------------- | -------------------------- | --------------------------- |
| `{model}`         | Nama model singkat         | `claude-opus-4-6`           |
| `{modelFull}`     | Pengidentifikasi model penuh | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama penyedia              | `anthropic`                 |
| `{thinkingLevel}` | Tingkat berpikir saat ini  | `high`, `low`, `off`        |
| `{identity.name}` | Nama identitas agen        | (sama seperti `"auto"`)     |

Variabel tidak peka huruf besar/kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi ack

- Default ke `identity.emoji` milik agen aktif, jika tidak ada `"👀"`. Atur `""` untuk menonaktifkan.
- Penimpaan per kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: akun → kanal → `messages.ackReaction` → fallback identitas.
- Cakupan: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: menghapus ack setelah balasan pada kanal yang mendukung reaksi seperti Slack, Discord, Telegram, WhatsApp, dan BlueBubbles.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status siklus hidup di Slack, Discord, dan Telegram.
  Di Slack dan Discord, nilai yang tidak disetel mempertahankan reaksi status tetap aktif saat reaksi ack aktif.
  Di Telegram, setel secara eksplisit ke `true` untuk mengaktifkan reaksi status siklus hidup.

### Debounce masuk

Menggabungkan pesan teks saja yang datang cepat dari pengirim yang sama menjadi satu giliran agen. Media/lampiran langsung memicu flush. Perintah kontrol melewati debouncing.

### TTS (teks-ke-ucapan)

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

- `auto` mengontrol mode auto-TTS default: `off`, `always`, `inbound`, atau `tagged`. `/tts on|off` dapat menimpa preferensi lokal, dan `/tts status` menampilkan status efektif.
- `summaryModel` menimpa `agents.defaults.model.primary` untuk ringkasan otomatis.
- `modelOverrides` aktif secara default; `modelOverrides.allowProvider` default ke `false` (opt-in).
- Kunci API fallback ke `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY`.
- Penyedia speech bawaan dimiliki oleh plugin. Jika `plugins.allow` disetel, sertakan setiap Plugin penyedia TTS yang ingin Anda gunakan, misalnya `microsoft` untuk Edge TTS. Id penyedia lama `edge` diterima sebagai alias untuk `microsoft`.
- `providers.openai.baseUrl` menimpa endpoint OpenAI TTS. Urutan resolusinya adalah konfigurasi, lalu `OPENAI_TTS_BASE_URL`, lalu `https://api.openai.com/v1`.
- Saat `providers.openai.baseUrl` mengarah ke endpoint non-OpenAI, OpenClaw memperlakukannya sebagai server TTS yang kompatibel dengan OpenAI dan melonggarkan validasi model/suara.

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` harus cocok dengan sebuah kunci di `talk.providers` saat beberapa penyedia Talk dikonfigurasi.
- Kunci Talk datar lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan ke `talk.providers.<provider>`.
- ID suara fallback ke `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID`.
- `providers.*.apiKey` menerima string teks polos atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku saat tidak ada kunci API Talk yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan direktif Talk menggunakan nama ramah.
- `providers.mlx.modelId` memilih repo Hugging Face yang digunakan oleh helper MLX lokal macOS. Jika dihilangkan, macOS menggunakan `mlx-community/Soprano-80M-bf16`.
- Pemutaran MLX macOS berjalan melalui helper `openclaw-mlx-tts` bawaan saat tersedia, atau executable di `PATH`; `OPENCLAW_MLX_TTS_BIN` menimpa jalur helper untuk pengembangan.
- `speechLocale` menetapkan id locale BCP 47 yang digunakan oleh pengenalan ucapan Talk iOS/macOS. Biarkan tidak disetel untuk menggunakan default perangkat.
- `silenceTimeoutMs` mengontrol berapa lama mode Talk menunggu setelah keheningan pengguna sebelum mengirim transkrip. Tidak disetel mempertahankan jendela jeda default platform (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — semua kunci konfigurasi lainnya
- [Konfigurasi](/id/gateway/configuration) — tugas umum dan penyiapan cepat
- [Contoh konfigurasi](/id/gateway/configuration-examples)

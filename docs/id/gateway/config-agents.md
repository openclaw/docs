---
read_when:
    - Menyetel default agen (model, penalaran, ruang kerja, Heartbeat, media, Skills)
    - Mengonfigurasi perutean dan pengikatan multi-agen
    - Menyesuaikan perilaku sesi, pengiriman pesan, dan mode bicara
summary: Default agen, perutean multi-agen, sesi, pesan, dan konfigurasi percakapan
title: Konfigurasi — agen
x-i18n:
    generated_at: "2026-05-12T23:30:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08ddc1b36f4b9408ebaa5f071693b1c1333cedc9b00f75df93f12e73081e1033
    source_path: gateway/config-agents.md
    workflow: 16
---

Kunci konfigurasi dengan cakupan agen di bawah `agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, dan `talk.*`. Untuk channel, tools, runtime Gateway, dan kunci tingkat
atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Default agen

### `agents.defaults.workspace`

Default: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan di baris Runtime pada prompt sistem. Jika tidak disetel, OpenClaw mendeteksi otomatis dengan berjalan ke atas dari workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Daftar izin skill default opsional untuk agen yang tidak menyetel
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

- Hilangkan `agents.defaults.skills` untuk skills yang tidak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi default.
- Setel `agents.list[].skills: []` untuk tanpa skills.
- Daftar `agents.list[].skills` yang tidak kosong adalah set final untuk agen tersebut; daftar itu
  tidak digabung dengan default.

### `agents.defaults.skipBootstrap`

Menonaktifkan pembuatan otomatis file bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Melewati pembuatan file workspace opsional tertentu sambil tetap menulis file bootstrap yang wajib. Nilai valid: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, dan `IDENTITY.md`.

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

Mengontrol kapan file bootstrap workspace disisipkan ke dalam prompt sistem. Default: `"always"`.

- `"continuation-skip"`: giliran lanjutan yang aman (setelah respons asisten selesai) melewati penyisipan ulang bootstrap workspace, sehingga mengurangi ukuran prompt. Jalankan Heartbeat dan percobaan ulang pasca-Compaction masih membangun ulang konteks.
- `"never"`: nonaktifkan bootstrap workspace dan penyisipan file konteks pada setiap giliran. Gunakan ini hanya untuk agen yang sepenuhnya memiliki siklus hidup promptnya sendiri (mesin konteks khusus, runtime native yang membangun konteks sendiri, atau alur kerja khusus tanpa bootstrap). Giliran Heartbeat dan pemulihan Compaction juga melewati penyisipan.

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

Jumlah total karakter maksimum yang disisipkan di semua file bootstrap workspace. Default: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Mengontrol pemberitahuan prompt sistem yang terlihat oleh agen saat konteks bootstrap dipotong.
Default: `"once"`.

- `"off"`: jangan pernah sisipkan teks pemberitahuan pemotongan ke dalam prompt sistem.
- `"once"`: sisipkan pemberitahuan ringkas satu kali per tanda tangan pemotongan unik (direkomendasikan).
- `"always"`: sisipkan pemberitahuan ringkas pada setiap eksekusi saat ada pemotongan.

Hitungan raw/disisipkan yang terperinci dan field penyesuaian konfigurasi tetap berada di diagnostik seperti
laporan konteks/status dan log; konteks pengguna/runtime WebChat rutin hanya
mendapat pemberitahuan pemulihan ringkas.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Peta kepemilikan anggaran konteks

OpenClaw memiliki beberapa anggaran prompt/konteks bervolume tinggi, dan semuanya
sengaja dipisah berdasarkan subsistem alih-alih semuanya mengalir melalui satu
knob generik.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  penyisipan bootstrap workspace normal.
- `agents.defaults.startupContext.*`:
  prelude eksekusi model satu kali saat reset/startup, termasuk file `memory/*.md`
  harian terbaru. Perintah chat polos `/new` dan `/reset`
  diakui tanpa memanggil model.
- `skills.limits.*`:
  daftar skills ringkas yang disisipkan ke dalam prompt sistem.
- `agents.defaults.contextLimits.*`:
  kutipan runtime terbatas dan blok milik runtime yang disisipkan.
- `memory.qmd.limits.*`:
  cuplikan pencarian memori terindeks dan ukuran penyisipan.

Gunakan override per agen yang sesuai hanya ketika satu agen memerlukan anggaran
yang berbeda:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Mengontrol prelude startup giliran pertama yang disisipkan pada eksekusi model reset/startup.
Perintah chat polos `/new` dan `/reset` mengakui reset tanpa memanggil
model, sehingga tidak memuat prelude ini.

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

- `memoryGetMaxChars`: batas kutipan default `memory_get` sebelum metadata pemotongan
  dan pemberitahuan kelanjutan ditambahkan.
- `memoryGetDefaultLines`: jendela baris default `memory_get` saat `lines` dihilangkan.
- `toolResultMaxChars`: batas hasil tool live yang digunakan untuk hasil persisten dan
  pemulihan overflow.
- `postCompactionMaxChars`: batas kutipan AGENTS.md yang digunakan selama penyisipan
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

Batas global untuk daftar skills ringkas yang disisipkan ke dalam prompt sistem. Ini
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

Override per agen untuk anggaran prompt skills.

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

Ukuran piksel maksimum untuk sisi gambar terpanjang di blok gambar transkrip/tool sebelum panggilan provider.
Default: `1200`.

Nilai yang lebih rendah biasanya mengurangi penggunaan token vision dan ukuran payload permintaan untuk eksekusi yang banyak memakai tangkapan layar.
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

Format waktu dalam prompt sistem. Default: `auto` (preferensi OS).

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
  - Bentuk objek menetapkan model utama plus model failover berurutan.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh jalur tool `image` sebagai konfigurasi model vision-nya.
  - Juga digunakan sebagai routing fallback ketika model yang dipilih/default tidak dapat menerima input gambar.
  - Utamakan ref `provider/model` eksplisit. ID polos diterima untuk kompatibilitas; jika ID polos secara unik cocok dengan entri berkemampuan gambar yang dikonfigurasi di `models.providers.*.models`, OpenClaw mengaitkannya ke provider tersebut. Kecocokan terkonfigurasi yang ambigu memerlukan prefiks provider eksplisit.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan gambar bersama dan surface tool/plugin masa depan apa pun yang menghasilkan gambar.
  - Nilai umum: `google/gemini-3.1-flash-image-preview` untuk pembuatan gambar Gemini native, `fal/fal-ai/flux/dev` untuk fal, `openai/gpt-image-2` untuk OpenAI Images, atau `openai/gpt-image-1.5` untuk output PNG/WebP OpenAI berlatar belakang transparan.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga autentikasi provider yang cocok (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` atau OpenAI Codex OAuth untuk `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` masih dapat menyimpulkan default provider yang didukung autentikasi. Ia mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan gambar terdaftar yang tersisa dalam urutan ID provider.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan musik bersama dan tool bawaan `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.6`.
  - Jika dihilangkan, `music_generate` masih dapat menyimpulkan default provider yang didukung autentikasi. Ia mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan musik terdaftar yang tersisa dalam urutan ID provider.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga autentikasi/kunci API provider yang cocok.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan video bersama dan tool bawaan `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` masih dapat menyimpulkan default provider yang didukung autentikasi. Ia mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan video terdaftar yang tersisa dalam urutan ID provider.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan juga autentikasi/kunci API provider yang cocok.
  - Provider pembuatan video Qwen yang dibundel mendukung hingga 1 video output, 1 gambar input, 4 video input, durasi 10 detik, serta opsi tingkat provider `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh tool `pdf` untuk routing model.
  - Jika dihilangkan, tool PDF fallback ke `imageModel`, lalu ke model sesi/default yang di-resolve.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk tool `pdf` ketika `maxBytesMb` tidak diteruskan saat pemanggilan.
- `pdfMaxPages`: halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi di tool `pdf`.
- `verboseDefault`: level verbose default untuk agen. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `toolProgressDetail`: mode detail untuk ringkasan tool `/verbose` dan baris tool draf progres. Nilai: `"explain"` (default, label manusia yang ringkas) atau `"raw"` (tambahkan command/detail mentah saat tersedia). `agents.list[].toolProgressDetail` per agen menimpa default ini.
- `reasoningDefault`: visibilitas reasoning default untuk agen. Nilai: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` per agen menimpa default ini. Default reasoning yang dikonfigurasi hanya diterapkan untuk owner, pengirim resmi, atau konteks Gateway admin operator ketika tidak ada override reasoning per pesan atau sesi yang ditetapkan.
- `elevatedDefault`: level output elevated default untuk agen. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (mis. `openai/gpt-5.5` untuk akses kunci API OpenAI atau Codex OAuth). Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan provider terkonfigurasi unik untuk ID model persis itu, dan baru setelah itu fallback ke provider default yang dikonfigurasi (perilaku kompatibilitas yang sudah deprecated, jadi utamakan `provider/model` eksplisit). Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw fallback ke provider/model terkonfigurasi pertama alih-alih menampilkan default provider lama yang sudah dihapus.
- `models`: katalog model terkonfigurasi dan allowlist untuk `/model`. Setiap entri dapat menyertakan `alias` (pintasan) dan `params` (khusus provider, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Gunakan entri `provider/*` seperti `"openai-codex/*": {}` atau `"vllm/*": {}` untuk menampilkan semua model yang ditemukan untuk provider terpilih tanpa mencantumkan setiap ID model secara manual.
  - Edit aman: gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri. `config set` menolak penggantian yang akan menghapus entri allowlist yang sudah ada kecuali Anda meneruskan `--replace`.
  - Alur konfigurasi/onboarding yang di-scope ke provider menggabungkan model provider terpilih ke map ini dan mempertahankan provider tak terkait yang sudah dikonfigurasi.
  - Untuk model OpenAI Responses langsung, Compaction sisi server diaktifkan otomatis. Gunakan `params.responsesServerCompaction: false` untuk berhenti menyisipkan `context_management`, atau `params.responsesCompactThreshold` untuk menimpa ambang batas. Lihat [Compaction sisi server OpenAI](/id/providers/openai#server-side-compaction-responses-api).
- `params`: parameter provider default global yang diterapkan ke semua model. Ditetapkan di `agents.defaults.params` (mis. `{ cacheRetention: "long" }`).
- Precedensi merge `params` (config): `agents.defaults.params` (basis global) ditimpa oleh `agents.defaults.models["provider/model"].params` (per model), lalu `agents.list[].params` (ID agen yang cocok) menimpa berdasarkan key. Lihat [Prompt Caching](/id/reference/prompt-caching) untuk detail.
- `params.extra_body`/`params.extraBody`: JSON pass-through lanjutan yang digabungkan ke body request `api: "openai-completions"` untuk proxy kompatibel OpenAI. Jika bertabrakan dengan key request yang dihasilkan, body ekstra yang menang; route completions non-native tetap menghapus `store` khusus OpenAI setelahnya.
- `params.chat_template_kwargs`: argumen chat-template kompatibel vLLM/OpenAI yang digabungkan ke body request `api: "openai-completions"` tingkat atas. Untuk `vllm/nemotron-3-*` dengan thinking nonaktif, plugin vLLM yang dibundel otomatis mengirim `enable_thinking: false` dan `force_nonempty_content: true`; `chat_template_kwargs` eksplisit menimpa default yang dihasilkan, dan `extra_body.chat_template_kwargs` tetap memiliki precedensi akhir. Untuk kontrol thinking Qwen vLLM, tetapkan `params.qwenThinkingFormat` ke `"chat-template"` atau `"top-level"` pada entri model tersebut.
- `compat.thinkingFormat`: gaya payload thinking kompatibel OpenAI. Gunakan `"qwen"` untuk `enable_thinking` tingkat atas bergaya Qwen, atau `"qwen-chat-template"` untuk `chat_template_kwargs.enable_thinking` pada backend keluarga Qwen yang mendukung kwargs chat-template tingkat request, seperti vLLM. OpenClaw memetakan thinking yang dinonaktifkan ke `false` dan thinking yang diaktifkan ke `true`.
- `compat.supportedReasoningEfforts`: daftar upaya reasoning kompatibel OpenAI per model. Sertakan `"xhigh"` untuk endpoint kustom yang benar-benar menerimanya; OpenClaw kemudian mengekspos `/think xhigh` di menu command, baris sesi Gateway, validasi patch sesi, validasi CLI agen, dan validasi `llm-task` untuk provider/model terkonfigurasi tersebut. Gunakan `compat.reasoningEffortMap` ketika backend menginginkan nilai khusus provider untuk level kanonis.
- `params.preserveThinking`: opt-in khusus Z.AI untuk thinking yang dipertahankan. Saat diaktifkan dan thinking aktif, OpenClaw mengirim `thinking.clear_thinking: false` dan memutar ulang `reasoning_content` sebelumnya; lihat [thinking Z.AI dan thinking yang dipertahankan](/id/providers/zai#thinking-and-preserved-thinking).
- `localService`: manajer proses opsional tingkat provider untuk server model lokal/self-hosted. Ketika model yang dipilih milik provider tersebut, OpenClaw mem-probe `healthUrl` (atau `baseUrl + "/models"`), menjalankan `command` dengan `args` jika endpoint down, menunggu hingga `readyTimeoutMs`, lalu mengirim request model. `command` harus berupa path absolut. `idleStopMs: 0` menjaga proses tetap hidup hingga OpenClaw keluar; nilai positif menghentikan proses yang di-spawn OpenClaw setelah sekian milidetik idle. Lihat [Layanan model lokal](/id/gateway/local-model-services).
- Kebijakan runtime berada pada provider atau model, bukan pada `agents.defaults`. Gunakan `models.providers.<provider>.agentRuntime` untuk aturan seluruh provider atau `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` untuk aturan khusus model. Model agen OpenAI pada provider OpenAI resmi memilih Codex secara default.
- Penulis config yang memutasi field ini (misalnya `/models set`, `/models set-image`, dan command tambah/hapus fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang sudah ada bila memungkinkan.
- `maxConcurrent`: maksimum run agen paralel lintas sesi (setiap sesi tetap diserialkan). Default: 4.

### Kebijakan runtime

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, ID harness plugin terdaftar, atau alias backend CLI yang didukung. Plugin Codex yang dibundel mendaftarkan `codex`; plugin Anthropic yang dibundel menyediakan backend CLI `claude-cli`.
- `id: "auto"` memungkinkan harness plugin terdaftar mengklaim giliran yang didukung dan menggunakan PI ketika tidak ada harness yang cocok. Runtime plugin eksplisit seperti `id: "codex"` memerlukan harness tersebut dan gagal tertutup jika tidak tersedia atau gagal.
- Key runtime seluruh agen bersifat legacy. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, pin runtime sesi, dan `OPENCLAW_AGENT_RUNTIME` diabaikan oleh pemilihan runtime. Jalankan `openclaw doctor --fix` untuk menghapus nilai lama.
- Model agen OpenAI menggunakan harness Codex secara default; `agentRuntime.id: "codex"` provider/model tetap valid ketika Anda ingin membuatnya eksplisit.
- Untuk deployment Claude CLI, utamakan `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"` yang di-scope ke model. Ref model legacy `claude-cli/claude-opus-4-7` masih berfungsi untuk kompatibilitas, tetapi config baru harus menjaga pemilihan provider/model tetap kanonis dan menaruh backend eksekusi dalam kebijakan runtime provider/model.
- Ini hanya mengontrol eksekusi giliran agen teks. Pembuatan media, vision, PDF, musik, video, dan TTS tetap menggunakan pengaturan provider/model masing-masing.

**Singkatan alias bawaan** (hanya berlaku ketika model ada di `agents.defaults.models`):

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

Alias yang Anda konfigurasikan selalu mengalahkan nilai bawaan.

Model Z.AI GLM-4.x otomatis mengaktifkan mode berpikir kecuali Anda menetapkan `--thinking off` atau mendefinisikan sendiri `agents.defaults.models["zai/<model>"].params.thinking`.
Model Z.AI mengaktifkan `tool_stream` secara bawaan untuk streaming panggilan alat. Tetapkan `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Model Anthropic Claude 4.6 secara bawaan menggunakan pemikiran `adaptive` ketika tidak ada tingkat pemikiran eksplisit yang ditetapkan.

### `agents.defaults.cliBackends`

Backend CLI opsional untuk menjalankan fallback khusus teks (tanpa panggilan alat). Berguna sebagai cadangan saat penyedia API gagal.

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
- `reseedFromRawTranscriptWhenUncompacted: true` memungkinkan backend memulihkan sesi tidak valid yang aman
  dari ekor transkrip mentah OpenClaw yang dibatasi sebelum ringkasan Compaction
  pertama tersedia. Perubahan profil auth atau epoch kredensial
  tetap tidak pernah melakukan raw-reseed.

### `agents.defaults.systemPromptOverride`

Ganti seluruh prompt sistem yang disusun OpenClaw dengan string tetap. Tetapkan di tingkat bawaan (`agents.defaults.systemPromptOverride`) atau per agen (`agents.list[].systemPromptOverride`). Nilai per agen diprioritaskan; nilai kosong atau hanya spasi diabaikan. Berguna untuk eksperimen prompt terkontrol.

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

Overlay prompt yang tidak bergantung pada penyedia, diterapkan berdasarkan keluarga model. ID model keluarga GPT-5 menerima kontrak perilaku bersama di seluruh penyedia; `personality` hanya mengontrol lapisan gaya interaksi yang ramah.

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

- `"friendly"` (bawaan) dan `"on"` mengaktifkan lapisan gaya interaksi yang ramah.
- `"off"` hanya menonaktifkan lapisan ramah; kontrak perilaku GPT-5 bertag tetap aktif.
- `plugins.entries.openai.config.personality` lama masih dibaca ketika pengaturan bersama ini belum ditetapkan.

### `agents.defaults.heartbeat`

Jalankan Heartbeat berkala.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

- `every`: string durasi (ms/s/m/h). Bawaan: `30m` (auth kunci API) atau `1h` (auth OAuth). Tetapkan ke `0m` untuk menonaktifkan.
- `includeSystemPromptSection`: ketika false, menghilangkan bagian Heartbeat dari prompt sistem dan melewati injeksi `HEARTBEAT.md` ke dalam konteks bootstrap. Bawaan: `true`.
- `suppressToolErrorWarnings`: ketika true, menekan payload peringatan kesalahan alat selama eksekusi Heartbeat.
- `timeoutSeconds`: waktu maksimum dalam detik yang diizinkan untuk giliran agen Heartbeat sebelum dibatalkan. Biarkan tidak ditetapkan untuk menggunakan `agents.defaults.timeoutSeconds`.
- `directPolicy`: kebijakan pengiriman langsung/DM. `allow` (bawaan) mengizinkan pengiriman ke target langsung. `block` menekan pengiriman ke target langsung dan memunculkan `reason=dm-blocked`.
- `lightContext`: ketika true, eksekusi Heartbeat menggunakan konteks bootstrap ringan dan hanya menyimpan `HEARTBEAT.md` dari file bootstrap ruang kerja.
- `isolatedSession`: ketika true, setiap Heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasi yang sama seperti cron `sessionTarget: "isolated"`. Mengurangi biaya token per Heartbeat dari sekitar 100K menjadi sekitar 2-5K token.
- `skipWhenBusy`: ketika true, eksekusi Heartbeat ditunda pada lane sibuk tambahan agen tersebut: pekerjaan subagen berkunci sesi miliknya sendiri atau perintah bersarang. Lane Cron selalu menunda Heartbeat, bahkan tanpa flag ini.
- Per agen: tetapkan `agents.list[].heartbeat`. Ketika ada agen yang mendefinisikan `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat.
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

- `mode`: `default` atau `safeguard` (peringkasan bertahap untuk riwayat panjang). Lihat [Compaction](/id/concepts/compaction).
- `provider`: ID Plugin penyedia Compaction terdaftar. Ketika ditetapkan, `summarize()` milik penyedia dipanggil alih-alih peringkasan LLM bawaan. Kembali ke bawaan saat gagal. Menetapkan penyedia memaksa `mode: "safeguard"`. Lihat [Compaction](/id/concepts/compaction).
- `timeoutSeconds`: jumlah detik maksimum yang diizinkan untuk satu operasi Compaction sebelum OpenClaw membatalkannya. Bawaan: `900`.
- `keepRecentTokens`: anggaran titik potong Pi untuk mempertahankan ekor transkrip terbaru secara verbatim. `/compact` manual menghormati ini ketika ditetapkan secara eksplisit; jika tidak, Compaction manual adalah checkpoint keras.
- `identifierPolicy`: `strict` (bawaan), `off`, atau `custom`. `strict` menambahkan panduan retensi pengenal buram bawaan di awal selama peringkasan Compaction.
- `identifierInstructions`: teks pelestarian pengenal khusus opsional yang digunakan ketika `identifierPolicy=custom`.
- `qualityGuard`: pemeriksaan retry-on-malformed-output untuk ringkasan safeguard. Diaktifkan secara bawaan dalam mode safeguard; tetapkan `enabled: false` untuk melewati audit.
- `midTurnPrecheck`: pemeriksaan tekanan tool-loop Pi opsional. Ketika `enabled: true`, OpenClaw memeriksa tekanan konteks setelah hasil alat ditambahkan dan sebelum panggilan model berikutnya. Jika konteks tidak lagi muat, OpenClaw membatalkan upaya saat ini sebelum mengirim prompt dan menggunakan kembali jalur pemulihan precheck yang ada untuk memotong hasil alat atau melakukan Compaction dan mencoba lagi. Berfungsi dengan mode Compaction `default` maupun `safeguard`. Bawaan: dinonaktifkan.
- `postCompactionSections`: nama bagian H2/H3 AGENTS.md opsional untuk disuntikkan kembali setelah Compaction. Bawaan ke `["Session Startup", "Red Lines"]`; tetapkan `[]` untuk menonaktifkan reinjeksi. Ketika tidak ditetapkan atau secara eksplisit ditetapkan ke pasangan bawaan tersebut, heading lama `Every Session`/`Safety` juga diterima sebagai fallback warisan.
- `model`: override `provider/model-id` opsional hanya untuk peringkasan Compaction. Gunakan ini ketika sesi utama harus tetap menggunakan satu model tetapi ringkasan Compaction harus berjalan pada model lain; ketika tidak ditetapkan, Compaction menggunakan model utama sesi.
- `maxActiveTranscriptBytes`: ambang byte opsional (`number` atau string seperti `"20mb"`) yang memicu Compaction lokal normal sebelum eksekusi ketika JSONL aktif melewati ambang. Memerlukan `truncateAfterCompaction` agar Compaction yang berhasil dapat memutar ke transkrip penerus yang lebih kecil. Dinonaktifkan ketika tidak ditetapkan atau `0`.
- `notifyUser`: ketika `true`, mengirim pemberitahuan singkat kepada pengguna saat Compaction dimulai dan saat selesai (misalnya, "Memadatkan konteks..." dan "Compaction selesai"). Dinonaktifkan secara bawaan agar Compaction tetap senyap.
- `memoryFlush`: giliran agentic senyap sebelum auto-Compaction untuk menyimpan memori tahan lama. Tetapkan `model` ke penyedia/model persis seperti `ollama/qwen3:8b` ketika giliran housekeeping ini harus tetap pada model lokal; override tidak mewarisi rantai fallback sesi aktif. Dilewati ketika ruang kerja bersifat hanya-baca.

### `agents.defaults.runRetries`

Batas iterasi percobaan ulang loop eksekusi luar untuk runner Pi tertanam guna mencegah loop eksekusi tak terbatas selama pemulihan kegagalan. Perhatikan bahwa pengaturan ini saat ini hanya berlaku untuk runtime agen tertanam, bukan runtime ACP atau CLI.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: jumlah dasar iterasi percobaan ulang eksekusi untuk loop eksekusi luar. Bawaan: `24`.
- `perProfile`: iterasi percobaan ulang eksekusi tambahan yang diberikan per kandidat profil fallback. Bawaan: `8`.
- `min`: batas absolut minimum untuk iterasi percobaan ulang eksekusi. Bawaan: `32`.
- `max`: batas absolut maksimum untuk iterasi percobaan ulang eksekusi guna mencegah eksekusi tak terkendali. Bawaan: `160`.

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

- `mode: "cache-ttl"` mengaktifkan proses pruning.
- `ttl` mengontrol seberapa sering pruning dapat berjalan lagi (setelah cache terakhir disentuh).
- Pruning terlebih dahulu melakukan soft-trim pada hasil alat yang terlalu besar, lalu hard-clear pada hasil alat yang lebih lama jika diperlukan.

**Soft-trim** mempertahankan bagian awal + akhir dan menyisipkan `...` di tengah.

**Hard-clear** mengganti seluruh hasil alat dengan placeholder.

Catatan:

- Blok gambar tidak pernah dipangkas/dibersihkan.
- Rasio berbasis karakter (perkiraan), bukan jumlah token yang persis.
- Jika pesan asisten lebih sedikit dari `keepLastAssistants`, pruning dilewati.

</Accordion>

Lihat [Pruning Sesi](/id/concepts/session-pruning) untuk detail perilaku.

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

- Kanal non-Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
- Override kanal: `channels.<channel>.blockStreamingCoalesce` (dan varian per akun). Signal/Slack/Discord/Google Chat default `minChars: 1500`.
- `humanDelay`: jeda acak di antara balasan blok. `natural` = 800–2500ms. Override per agen: `agents.list[].humanDelay`.

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

Lihat [Indikator Mengetik](/id/concepts/typing-indicators).

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

Saat `backend: "openshell"` dipilih, pengaturan khusus runtime berpindah ke
`plugins.entries.openshell.config`.

**Konfigurasi backend SSH:**

- `target`: target SSH dalam bentuk `user@host[:port]`
- `command`: perintah klien SSH (default: `ssh`)
- `workspaceRoot`: root jarak jauh absolut yang digunakan untuk workspace per cakupan
- `identityFile` / `certificateFile` / `knownHostsFile`: file lokal yang sudah ada dan diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: konten inline atau SecretRefs yang diwujudkan OpenClaw menjadi file sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: kenop kebijakan host-key OpenSSH

**Prioritas autentikasi SSH:**

- `identityData` mengungguli `identityFile`
- `certificateData` mengungguli `certificateFile`
- `knownHostsData` mengungguli `knownHostsFile`
- Nilai `*Data` berbasis SecretRef di-resolve dari snapshot runtime rahasia aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- mengisi workspace jarak jauh satu kali setelah dibuat atau dibuat ulang
- kemudian menjaga workspace SSH jarak jauh sebagai kanonis
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

- `mirror`: isi remote dari lokal sebelum exec, sinkronkan kembali setelah exec; workspace lokal tetap kanonis
- `remote`: isi remote satu kali saat sandbox dibuat, lalu pertahankan workspace jarak jauh sebagai kanonis

Dalam mode `remote`, edit lokal host yang dibuat di luar OpenClaw tidak disinkronkan ke sandbox secara otomatis setelah langkah seed.
Transport adalah SSH ke sandbox OpenShell, tetapi plugin memiliki siklus hidup sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** berjalan sekali setelah pembuatan kontainer (melalui `sh -lc`). Memerlukan egress jaringan, root yang dapat ditulis, pengguna root.

**Kontainer default ke `network: "none"`** — atur ke `"bridge"` (atau jaringan bridge kustom) jika agen memerlukan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda menetapkan
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` secara eksplisit (break-glass).

**Lampiran masuk** ditempatkan di `media/inbound/*` dalam workspace aktif.

**`docker.binds`** memasang direktori host tambahan; bind global dan per agen digabungkan.

**Browser sandbox** (`sandbox.browser.enabled`): Chromium + CDP dalam kontainer. URL noVNC disisipkan ke prompt sistem. Tidak memerlukan `browser.enabled` di `openclaw.json`.
Akses pengamat noVNC menggunakan autentikasi VNC secara default dan OpenClaw menerbitkan URL token berumur pendek (alih-alih mengekspos kata sandi di URL bersama).

- `allowHostControl: false` (default) memblokir sesi sandbox agar tidak menargetkan browser host.
- `network` default ke `openclaw-sandbox-browser` (jaringan bridge khusus). Atur ke `bridge` hanya saat Anda secara eksplisit menginginkan konektivitas bridge global.
- `cdpSourceRange` secara opsional membatasi ingress CDP di tepi kontainer ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` memasang direktori host tambahan hanya ke kontainer browser sandbox. Saat ditetapkan (termasuk `[]`), ini menggantikan `docker.binds` untuk kontainer browser.
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
  - `--disable-extensions` (default diaktifkan)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, dan `--disable-gpu`
    diaktifkan secara default dan dapat dinonaktifkan dengan
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika penggunaan WebGL/3D memerlukannya.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` mengaktifkan kembali ekstensi jika workflow Anda
    bergantung padanya.
  - `--renderer-process-limit=2` dapat diubah dengan
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; atur `0` untuk menggunakan batas proses
    default Chromium.
  - ditambah `--no-sandbox` saat `noSandbox` diaktifkan.
  - Default adalah baseline image kontainer; gunakan image browser kustom dengan entrypoint
    kustom untuk mengubah default kontainer.

</Accordion>

Sandboxing browser dan `sandbox.docker.binds` hanya untuk Docker.

Bangun image (dari checkout sumber):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Untuk instalasi npm tanpa checkout sumber, lihat [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup) untuk perintah `docker build` inline.

### `agents.list` (override per agen)

Gunakan `agents.list[].tts` untuk memberi agen penyedia TTS, suara, model,
gaya, atau mode TTS otomatisnya sendiri. Blok agen digabungkan secara mendalam di atas
`messages.tts` global, sehingga kredensial bersama dapat tetap berada di satu tempat sementara agen
individual hanya menimpa kolom suara atau penyedia yang mereka butuhkan. Penggantian agen aktif
berlaku untuk balasan lisan otomatis, `/tts audio`, `/tts status`, dan
tool agen `tts`. Lihat [Text-to-speech](/id/tools/tts#per-agent-voice-overrides)
untuk contoh penyedia dan prioritas.

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
- `default`: jika beberapa ditetapkan, yang pertama menang (peringatan dicatat). Jika tidak ada yang ditetapkan, entri daftar pertama menjadi default.
- `model`: bentuk string menetapkan primer khusus per agen yang ketat tanpa fallback model; bentuk objek `{ primary }` juga ketat kecuali Anda menambahkan `fallbacks`. Gunakan `{ primary, fallbacks: [...] }` untuk mengikutsertakan agen tersebut ke fallback, atau `{ primary, fallbacks: [] }` untuk membuat perilaku ketat eksplisit. Pekerjaan Cron yang hanya menimpa `primary` tetap mewarisi fallback default kecuali Anda menetapkan `fallbacks: []`.
- `params`: parameter stream per agen yang digabungkan di atas entri model terpilih di `agents.defaults.models`. Gunakan ini untuk penggantian khusus agen seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `tts`: penggantian text-to-speech per agen opsional. Blok ini digabungkan secara mendalam di atas `messages.tts`, jadi simpan kredensial penyedia bersama dan kebijakan fallback di `messages.tts`, lalu tetapkan hanya nilai khusus persona seperti penyedia, suara, model, gaya, atau mode otomatis di sini.
- `skills`: allowlist skill per agen opsional. Jika dihilangkan, agen mewarisi `agents.defaults.skills` saat ditetapkan; daftar eksplisit menggantikan default alih-alih menggabungkannya, dan `[]` berarti tidak ada skills.
- `thinkingDefault`: level thinking default per agen opsional (`off | minimal | low | medium | high | xhigh | adaptive | max`). Menimpa `agents.defaults.thinkingDefault` untuk agen ini ketika tidak ada penggantian per pesan atau sesi yang ditetapkan. Profil penyedia/model yang dipilih mengontrol nilai mana yang valid; untuk Google Gemini, `adaptive` mempertahankan thinking dinamis milik penyedia (`thinkingLevel` dihilangkan pada Gemini 3/3.1, `thinkingBudget: -1` pada Gemini 2.5).
- `reasoningDefault`: visibilitas reasoning default per agen opsional (`on | off | stream`). Menimpa `agents.defaults.reasoningDefault` untuk agen ini ketika tidak ada penggantian reasoning per pesan atau sesi yang ditetapkan.
- `fastModeDefault`: default per agen opsional untuk mode cepat (`true | false`). Berlaku ketika tidak ada penggantian mode cepat per pesan atau sesi yang ditetapkan.
- `models`: penggantian katalog/runtime model per agen opsional yang dikunci berdasarkan id lengkap `provider/model`. Gunakan `models["provider/model"].agentRuntime` untuk pengecualian runtime per agen.
- `runtime`: deskriptor runtime per agen opsional. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) ketika agen harus menggunakan sesi harness ACP secara default.
- `identity.avatar`: path relatif workspace, URL `http(s)`, atau URI `data:`.
- `identity` menurunkan default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: allowlist id agen untuk target eksplisit `sessions_spawn.agentId` (`["*"]` = apa pun; default: hanya agen yang sama). Sertakan id peminta ketika panggilan `agentId` yang menargetkan diri sendiri harus diizinkan.
- Pelindung pewarisan sandbox: jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: saat true, blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).

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

### Kolom pencocokan binding

- `type` (opsional): `route` untuk routing normal (type yang hilang default ke route), `acp` untuk binding percakapan ACP persisten.
- `match.channel` (wajib)
- `match.accountId` (opsional; `*` = akun apa pun; dihilangkan = akun default)
- `match.peer` (opsional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opsional; khusus channel)
- `acp` (opsional; hanya untuk `type: "acp"`): `{ mode, label, cwd, backend }`

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

<Accordion title="Tool hanya-baca + workspace">

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

<Accordion title="Tidak ada akses sistem berkas (hanya perpesanan)">

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

<Accordion title="Detail kolom sesi">

- **`scope`**: strategi pengelompokan sesi dasar untuk konteks obrolan grup.
  - `per-sender` (default): setiap pengirim mendapatkan sesi terisolasi dalam konteks channel.
  - `global`: semua peserta dalam konteks channel berbagi satu sesi (gunakan hanya saat konteks bersama memang dimaksudkan).
- **`dmScope`**: cara DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: isolasi berdasarkan id pengirim lintas channel.
  - `per-channel-peer`: isolasi per channel + pengirim (direkomendasikan untuk kotak masuk multi-pengguna).
  - `per-account-channel-peer`: isolasi per akun + channel + pengirim (direkomendasikan untuk multi-akun).
- **`identityLinks`**: petakan id kanonis ke peer berprefiks penyedia untuk berbagi sesi lintas channel. Perintah dock seperti `/dock_discord` menggunakan peta yang sama untuk mengalihkan rute balasan sesi aktif ke peer channel tertaut lain; lihat [Docking channel](/id/concepts/channel-docking).
- **`reset`**: kebijakan reset utama. `daily` mereset pada waktu lokal `atHour`; `idle` mereset setelah `idleMinutes`. Saat keduanya dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku. Kesegaran reset harian menggunakan `sessionStartedAt` pada baris sesi; kesegaran reset idle menggunakan `lastInteractionAt`. Penulisan latar belakang/peristiwa sistem seperti heartbeat, bangun cron, notifikasi exec, dan pembukuan gateway dapat memperbarui `updatedAt`, tetapi tidak menjaga sesi harian/idle tetap segar.
- **`resetByType`**: override per jenis (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`mainKey`**: bidang lama. Runtime selalu menggunakan `"main"` untuk bucket obrolan langsung utama.
- **`agentToAgent.maxPingPongTurns`**: jumlah maksimum giliran balas-balik antar agen selama pertukaran agen-ke-agen (integer, rentang: `0`-`20`, default: `5`). `0` menonaktifkan chaining ping-pong.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Penolakan pertama menang.
- **`maintenance`**: kontrol pembersihan + retensi penyimpanan sesi.
  - `mode`: `warn` hanya memancarkan peringatan; `enforce` menerapkan pembersihan.
  - `pruneAfter`: batas usia untuk entri usang (default `30d`).
  - `maxEntries`: jumlah maksimum entri dalam `sessions.json` (default `500`). Runtime menulis pembersihan batch dengan buffer high-water kecil untuk batas berukuran produksi; `openclaw sessions cleanup --enforce` menerapkan batas segera.
  - `rotateBytes`: usang dan diabaikan; `openclaw doctor --fix` menghapusnya dari konfigurasi lama.
  - `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>`. Default ke `pruneAfter`; setel `false` untuk menonaktifkan.
  - `maxDiskBytes`: anggaran disk direktori sesi opsional. Dalam mode `warn`, ini mencatat peringatan; dalam mode `enforce`, ini menghapus artefak/sesi tertua terlebih dahulu.
  - `highWaterBytes`: target opsional setelah pembersihan anggaran. Default ke `80%` dari `maxDiskBytes`.
- **`threadBindings`**: default global untuk fitur sesi terikat thread.
  - `enabled`: sakelar default utama (penyedia dapat meng-override; Discord menggunakan `channels.discord.threadBindings.enabled`)
  - `idleHours`: default auto-unfocus karena tidak aktif dalam jam (`0` menonaktifkan; penyedia dapat meng-override)
  - `maxAgeHours`: default usia maksimum keras dalam jam (`0` menonaktifkan; penyedia dapat meng-override)
  - `spawnSessions`: gerbang default untuk membuat sesi kerja terikat thread dari `sessions_spawn` dan spawn thread ACP. Default ke `true` saat binding thread diaktifkan; penyedia/akun dapat meng-override.
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

Override per-channel/akun: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik menang): akun → channel → global. `""` menonaktifkan dan menghentikan cascade. `"auto"` menghasilkan `[{identity.name}]`.

**Variabel templat:**

| Variabel          | Deskripsi                 | Contoh                      |
| ----------------- | ------------------------- | --------------------------- |
| `{model}`         | Nama model pendek         | `claude-opus-4-6`           |
| `{modelFull}`     | Pengidentifikasi model lengkap | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama penyedia             | `anthropic`                 |
| `{thinkingLevel}` | Level berpikir saat ini   | `high`, `low`, `off`        |
| `{identity.name}` | Nama identitas agen       | (sama seperti `"auto"`)     |

Variabel tidak peka huruf besar-kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi ack

- Default ke `identity.emoji` agen aktif, jika tidak `"👀"`. Setel `""` untuk menonaktifkan.
- Override per-channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: akun → channel → `messages.ackReaction` → fallback identitas.
- Cakupan: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: menghapus ack setelah balasan pada channel yang mendukung reaksi seperti Slack, Discord, Telegram, WhatsApp, dan iMessage.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status siklus hidup pada Slack, Discord, dan Telegram.
  Pada Slack dan Discord, tidak disetel mempertahankan reaksi status aktif saat reaksi ack aktif.
  Pada Telegram, setel secara eksplisit ke `true` untuk mengaktifkan reaksi status siklus hidup.

### Debounce inbound

Menggabungkan pesan teks-saja yang cepat dari pengirim yang sama menjadi satu giliran agen. Media/lampiran langsung flush. Perintah kontrol melewati debouncing.

### TTS (teks-ke-suara)

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

- `auto` mengontrol mode auto-TTS default: `off`, `always`, `inbound`, atau `tagged`. `/tts on|off` dapat meng-override preferensi lokal, dan `/tts status` menampilkan status efektif.
- `summaryModel` meng-override `agents.defaults.model.primary` untuk ringkasan otomatis.
- `modelOverrides` diaktifkan secara default; `modelOverrides.allowProvider` default ke `false` (ikut serta).
- Kunci API fallback ke `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY`.
- Penyedia ucapan bawaan dimiliki Plugin. Jika `plugins.allow` disetel, sertakan setiap Plugin penyedia TTS yang ingin Anda gunakan, misalnya `microsoft` untuk Edge TTS. Id penyedia lama `edge` diterima sebagai alias untuk `microsoft`.
- `providers.openai.baseUrl` meng-override endpoint TTS OpenAI. Urutan resolusi adalah konfigurasi, lalu `OPENAI_TTS_BASE_URL`, lalu `https://api.openai.com/v1`.
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
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` harus cocok dengan kunci dalam `talk.providers` saat beberapa penyedia Talk dikonfigurasi.
- Kunci Talk datar lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan ke `talk.providers.<provider>`.
- ID suara fallback ke `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID`.
- `providers.*.apiKey` menerima string plaintext atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku saat tidak ada kunci API Talk yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan direktif Talk menggunakan nama ramah.
- `providers.mlx.modelId` memilih repo Hugging Face yang digunakan oleh helper MLX lokal macOS. Jika dihilangkan, macOS menggunakan `mlx-community/Soprano-80M-bf16`.
- Pemutaran MLX macOS berjalan melalui helper `openclaw-mlx-tts` bawaan saat tersedia, atau executable pada `PATH`; `OPENCLAW_MLX_TTS_BIN` meng-override path helper untuk pengembangan.
- `consultThinkingLevel` mengontrol level berpikir untuk jalankan agen OpenClaw penuh di balik panggilan `openclaw_agent_consult` realtime Talk Control UI. Biarkan tidak disetel untuk mempertahankan perilaku sesi/model normal.
- `consultFastMode` menyetel override fast-mode sekali pakai untuk konsultasi realtime Talk Control UI tanpa mengubah pengaturan fast-mode normal sesi.
- `speechLocale` menyetel id lokal BCP 47 yang digunakan oleh pengenalan ucapan Talk iOS/macOS. Biarkan tidak disetel untuk menggunakan default perangkat.
- `silenceTimeoutMs` mengontrol berapa lama mode Talk menunggu setelah pengguna diam sebelum mengirim transkrip. Tidak disetel mempertahankan jendela jeda default platform (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` menambahkan instruksi sistem yang menghadap penyedia ke prompt realtime bawaan OpenClaw, sehingga gaya suara dapat dikonfigurasi tanpa kehilangan panduan default `openclaw_agent_consult`.

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — semua kunci konfigurasi lain
- [Konfigurasi](/id/gateway/configuration) — tugas umum dan penyiapan cepat
- [Contoh konfigurasi](/id/gateway/configuration-examples)

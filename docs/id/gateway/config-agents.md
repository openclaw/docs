---
read_when:
    - Menyetel nilai default agen (model, penalaran, ruang kerja, Heartbeat, media, Skills)
    - Mengonfigurasi perutean dan binding multi-agent
    - Menyesuaikan sesi, pengiriman pesan, dan perilaku mode bicara
summary: Default agen, perutean multi-agen, sesi, pesan, dan konfigurasi percakapan
title: Konfigurasi — agen
x-i18n:
    generated_at: "2026-07-01T13:22:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

Kunci konfigurasi tercakup agen di bawah `agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, dan `talk.*`. Untuk saluran, alat, runtime Gateway, dan kunci
tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Bawaan agen

### `agents.defaults.workspace`

Bawaan: `OPENCLAW_WORKSPACE_DIR` saat disetel, jika tidak `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Nilai eksplisit `agents.defaults.workspace` lebih diprioritaskan daripada
`OPENCLAW_WORKSPACE_DIR`. Gunakan variabel lingkungan untuk mengarahkan agen
bawaan ke ruang kerja terpasang saat Anda tidak ingin menulis jalur tersebut ke
konfigurasi.

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan di baris Runtime prompt sistem. Jika tidak disetel, OpenClaw mendeteksi otomatis dengan menelusuri ke atas dari ruang kerja.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist skill bawaan opsional untuk agen yang tidak menyetel
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

- Hilangkan `agents.defaults.skills` untuk skill tidak terbatas secara bawaan.
- Hilangkan `agents.list[].skills` untuk mewarisi bawaan.
- Setel `agents.list[].skills: []` agar tidak ada skill.
- Daftar `agents.list[].skills` yang tidak kosong adalah set final untuk agen tersebut; daftar ini
  tidak digabungkan dengan bawaan.

### `agents.defaults.skipBootstrap`

Menonaktifkan pembuatan otomatis file bootstrap ruang kerja (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Melewati pembuatan file ruang kerja opsional yang dipilih sambil tetap menulis file bootstrap wajib. Nilai yang valid: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, dan `IDENTITY.md`.

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

Mengontrol kapan file bootstrap ruang kerja disuntikkan ke prompt sistem. Bawaan: `"always"`.

- `"continuation-skip"`: giliran kelanjutan yang aman (setelah respons asisten selesai) melewati penyuntikan ulang bootstrap ruang kerja, sehingga mengurangi ukuran prompt. Proses Heartbeat dan percobaan ulang pasca-Compaction tetap membangun ulang konteks.
- `"never"`: nonaktifkan penyuntikan bootstrap ruang kerja dan file konteks di setiap giliran. Gunakan ini hanya untuk agen yang sepenuhnya memiliki siklus hidup prompt-nya sendiri (mesin konteks kustom, runtime native yang membangun konteksnya sendiri, atau alur kerja khusus tanpa bootstrap). Giliran Heartbeat dan pemulihan Compaction juga melewati penyuntikan.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Override per agen: `agents.list[].contextInjection`. Nilai yang dihilangkan mewarisi
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Karakter maksimum per file bootstrap ruang kerja sebelum pemotongan. Bawaan: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Override per agen: `agents.list[].bootstrapMaxChars`. Nilai yang dihilangkan mewarisi
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Total karakter maksimum yang disuntikkan di seluruh file bootstrap ruang kerja. Bawaan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Override per agen: `agents.list[].bootstrapTotalMaxChars`. Nilai yang dihilangkan
mewarisi `agents.defaults.bootstrapTotalMaxChars`.

### Override profil bootstrap per agen

Gunakan override profil bootstrap per agen saat satu agen membutuhkan perilaku
penyuntikan prompt yang berbeda dari bawaan bersama. Kolom yang dihilangkan mewarisi dari
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Mengontrol pemberitahuan prompt sistem yang terlihat agen saat konteks bootstrap dipotong.
Bawaan: `"always"`.

- `"off"`: jangan pernah menyuntikkan teks pemberitahuan pemotongan ke prompt sistem.
- `"once"`: suntikkan pemberitahuan ringkas satu kali per tanda tangan pemotongan unik.
- `"always"`: suntikkan pemberitahuan ringkas pada setiap proses saat ada pemotongan (direkomendasikan).

Hitungan mentah/tersuntik yang mendetail dan kolom penyetelan konfigurasi tetap berada dalam diagnostik seperti
laporan dan log konteks/status; konteks pengguna/runtime WebChat rutin hanya
mendapat pemberitahuan pemulihan ringkas.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Peta kepemilikan anggaran konteks

OpenClaw memiliki beberapa anggaran prompt/konteks bervolume tinggi, dan semuanya
sengaja dipisahkan berdasarkan subsistem, bukan semuanya mengalir melalui satu
kenop generik.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  penyuntikan bootstrap ruang kerja normal.
- `agents.defaults.startupContext.*`:
  prelude proses model sekali jalan untuk reset/startup, termasuk file
  `memory/*.md` harian terbaru. Perintah chat polos `/new` dan `/reset`
  diakui tanpa memanggil model.
- `skills.limits.*`:
  daftar skill ringkas yang disuntikkan ke prompt sistem.
- `agents.defaults.contextLimits.*`:
  kutipan runtime berbatas dan blok milik runtime yang disuntikkan.
- `memory.qmd.limits.*`:
  ukuran snippet pencarian memori terindeks dan penyuntikan.

Gunakan override per agen yang sesuai hanya saat satu agen membutuhkan
anggaran berbeda:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Mengontrol prelude startup giliran pertama yang disuntikkan pada proses model reset/startup.
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

Bawaan bersama untuk permukaan konteks runtime berbatas.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: batas kutipan `memory_get` bawaan sebelum metadata
  pemotongan dan pemberitahuan kelanjutan ditambahkan.
- `memoryGetDefaultLines`: jendela baris `memory_get` bawaan saat `lines`
  dihilangkan.
- `toolResultMaxChars`: batas atas hasil alat live lanjutan yang digunakan untuk hasil
  tersimpan dan pemulihan overflow. Biarkan tidak disetel untuk batas otomatis konteks model:
  `16000` karakter di bawah 100K token, `32000` karakter pada 100K+ token, dan `64000`
  karakter pada 200K+ token. Nilai eksplisit hingga `1000000` diterima untuk
  model konteks panjang, tetapi batas efektif tetap dibatasi sekitar 30% dari
  jendela konteks model. `openclaw doctor --deep` mencetak batas efektif,
  dan doctor hanya memperingatkan saat override eksplisit sudah usang atau tidak berpengaruh.
- `postCompactionMaxChars`: batas kutipan AGENTS.md yang digunakan selama penyuntikan
  penyegaran pasca-Compaction.

#### `agents.list[].contextLimits`

Override per agen untuk kenop `contextLimits` bersama. Kolom yang dihilangkan mewarisi
dari `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Batas global untuk daftar skill ringkas yang disuntikkan ke prompt sistem. Ini
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

Override per agen untuk anggaran prompt skill.

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

Ukuran piksel maksimum untuk sisi gambar terpanjang dalam blok gambar transkrip/alat sebelum panggilan penyedia.
Bawaan: `1200`.

Nilai yang lebih rendah biasanya mengurangi penggunaan token visi dan ukuran payload permintaan untuk proses yang banyak screenshot.
Nilai yang lebih tinggi mempertahankan lebih banyak detail visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferensi kompresi/detail alat gambar untuk gambar yang dimuat dari jalur file, URL, dan referensi media.
Bawaan: `auto`.

OpenClaw menyesuaikan tangga pengubahan ukuran dengan model gambar yang dipilih. Misalnya, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL, dan model visi Llama 4 ter-hosting dapat menggunakan gambar yang lebih besar daripada jalur visi detail tinggi lama/bawaan, sementara giliran multi-gambar dikompresi lebih agresif dalam mode `auto` untuk mengontrol biaya token dan latensi.

Nilai:

- `auto`: sesuaikan dengan batas model dan jumlah gambar.
- `efficient`: utamakan gambar yang lebih kecil untuk penggunaan token dan byte yang lebih rendah.
- `balanced`: gunakan tangga standar jalan tengah.
- `high`: pertahankan lebih banyak detail untuk screenshot, diagram, dan gambar dokumen.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Zona waktu untuk konteks prompt sistem (bukan stempel waktu pesan). Mundur ke zona waktu host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format waktu dalam prompt sistem. Bawaan: `auto` (preferensi OS).

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
  - Bentuk objek menetapkan model utama ditambah model failover berurutan.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh jalur alat `image` sebagai konfigurasi model visinya.
  - Juga digunakan sebagai perutean cadangan saat model yang dipilih/default tidak dapat menerima input gambar.
  - Utamakan referensi `provider/model` eksplisit. ID polos diterima untuk kompatibilitas; jika ID polos secara unik cocok dengan entri berkemampuan gambar yang dikonfigurasi di `models.providers.*.models`, OpenClaw melengkapinya ke penyedia tersebut. Kecocokan terkonfigurasi yang ambigu memerlukan prefiks penyedia eksplisit.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan gambar bersama dan setiap permukaan alat/Plugin mendatang yang menghasilkan gambar.
  - Nilai umum: `google/gemini-3.1-flash-image-preview` untuk pembuatan gambar Gemini native, `fal/fal-ai/flux/dev` untuk fal, `openai/gpt-image-2` untuk OpenAI Images, atau `openai/gpt-image-1.5` untuk output PNG/WebP OpenAI berlatar transparan.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi penyedia yang cocok (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` atau OpenAI Codex OAuth untuk `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` masih dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan gambar terdaftar yang tersisa dalam urutan ID penyedia.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan musik bersama dan alat bawaan `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.6`.
  - Jika dihilangkan, `music_generate` masih dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan musik terdaftar yang tersisa dalam urutan ID penyedia.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi/kunci API penyedia yang cocok.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan video bersama dan alat bawaan `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` masih dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan video terdaftar yang tersisa dalam urutan ID penyedia.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi/kunci API penyedia yang cocok.
  - Plugin pembuatan video Qwen resmi mendukung hingga 1 video output, 1 gambar input, 4 video input, durasi 10 detik, dan opsi tingkat penyedia `size`, `aspectRatio`, `resolution`, `audio`, serta `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh alat `pdf` untuk perutean model.
  - Jika dihilangkan, alat PDF kembali ke `imageModel`, lalu ke model sesi/default yang diselesaikan.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk alat `pdf` ketika `maxBytesMb` tidak diteruskan pada waktu pemanggilan.
- `pdfMaxPages`: jumlah halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi di alat `pdf`.
- `verboseDefault`: tingkat verbose default untuk agen. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `toolProgressDetail`: mode detail untuk ringkasan alat `/verbose` dan baris alat draf progres. Nilai: `"explain"` (default, label manusia ringkas) atau `"raw"` (tambahkan perintah/detail mentah saat tersedia). `agents.list[].toolProgressDetail` per agen menimpa default ini.
- `reasoningDefault`: visibilitas reasoning default untuk agen. Nilai: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` per agen menimpa default ini. Default reasoning yang dikonfigurasi hanya diterapkan untuk pemilik, pengirim terotorisasi, atau konteks Gateway operator-admin ketika tidak ada penimpaan reasoning per pesan atau sesi yang ditetapkan.
- `elevatedDefault`: tingkat output elevated default untuk agen. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (mis. `openai/gpt-5.5` untuk akses kunci API OpenAI atau Codex OAuth). Jika Anda menghilangkan penyedia, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan penyedia terkonfigurasi yang unik untuk ID model persis tersebut, dan baru kemudian kembali ke penyedia default yang dikonfigurasi (perilaku kompatibilitas yang sudah usang, jadi utamakan `provider/model` eksplisit). Jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw kembali ke penyedia/model terkonfigurasi pertama alih-alih menampilkan default penyedia yang telah dihapus dan usang.
- `models`: katalog model terkonfigurasi dan allowlist untuk `/model`. Setiap entri dapat menyertakan `alias` (pintasan) dan `params` (spesifik penyedia, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, perutean `provider` OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Gunakan entri `provider/*` seperti `"openai/*": {}` atau `"vllm/*": {}` untuk menampilkan semua model yang ditemukan bagi penyedia terpilih tanpa mencantumkan setiap ID model secara manual.
  - Tambahkan `agentRuntime` ke entri `provider/*` ketika setiap model yang ditemukan secara dinamis untuk penyedia tersebut harus menggunakan runtime yang sama. Kebijakan runtime `provider/model` persis tetap mengalahkan wildcard.
  - Edit aman: gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri. `config set` menolak penggantian yang akan menghapus entri allowlist yang ada kecuali Anda meneruskan `--replace`.
  - Alur configure/onboarding dengan cakupan penyedia menggabungkan model penyedia terpilih ke dalam map ini dan mempertahankan penyedia tidak terkait yang sudah dikonfigurasi.
  - Untuk model OpenAI Responses langsung, Compaction sisi server diaktifkan otomatis. Gunakan `params.responsesServerCompaction: false` untuk berhenti menyuntikkan `context_management`, atau `params.responsesCompactThreshold` untuk menimpa ambang batas. Lihat [Compaction sisi server OpenAI](/id/providers/openai#server-side-compaction-responses-api).
- `params`: parameter penyedia default global yang diterapkan ke semua model. Ditetapkan di `agents.defaults.params` (mis. `{ cacheRetention: "long" }`).
- Presedensi penggabungan `params` (konfigurasi): `agents.defaults.params` (basis global) ditimpa oleh `agents.defaults.models["provider/model"].params` (per model), lalu `agents.list[].params` (ID agen yang cocok) menimpa berdasarkan kunci. Lihat [Prompt Caching](/id/reference/prompt-caching) untuk detail.
- `models.providers.openrouter.params.provider`: kebijakan perutean penyedia default seluruh OpenRouter. OpenClaw meneruskan ini ke objek `provider` permintaan OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` per model dan params agen menimpa berdasarkan kunci. Lihat [perutean penyedia OpenRouter](/id/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON pass-through lanjutan yang digabungkan ke body permintaan `api: "openai-completions"` untuk proxy yang kompatibel dengan OpenAI. Jika bertabrakan dengan kunci permintaan yang dihasilkan, body ekstra menang; rute completions non-native tetap menghapus `store` khusus OpenAI setelahnya.
- `params.chat_template_kwargs`: argumen chat-template yang kompatibel dengan vLLM/OpenAI yang digabungkan ke body permintaan tingkat atas `api: "openai-completions"`. Untuk `vllm/nemotron-3-*` dengan thinking nonaktif, Plugin vLLM bawaan otomatis mengirim `enable_thinking: false` dan `force_nonempty_content: true`; `chat_template_kwargs` eksplisit menimpa default yang dihasilkan, dan `extra_body.chat_template_kwargs` tetap memiliki presedensi akhir. Model thinking Qwen dan Nemotron vLLM yang dikonfigurasi mengekspos pilihan biner `/think` (`off`, `on`) alih-alih tangga effort bertingkat.
- `compat.thinkingFormat`: gaya payload thinking yang kompatibel dengan OpenAI. Gunakan `"together"` untuk `reasoning.enabled` bergaya Together, `"qwen"` untuk `enable_thinking` tingkat atas bergaya Qwen, atau `"qwen-chat-template"` untuk `chat_template_kwargs.enable_thinking` pada backend keluarga Qwen yang mendukung kwargs chat-template tingkat permintaan, seperti vLLM. OpenClaw memetakan thinking yang dinonaktifkan ke `false` dan thinking yang diaktifkan ke `true`, dan model Qwen vLLM yang dikonfigurasi mengekspos pilihan biner `/think` untuk format ini.
- `compat.supportedReasoningEfforts`: daftar effort reasoning yang kompatibel dengan OpenAI per model. Sertakan `"xhigh"` untuk endpoint khusus yang benar-benar menerimanya; OpenClaw kemudian mengekspos `/think xhigh` di menu perintah, baris sesi Gateway, validasi patch sesi, validasi CLI agen, dan validasi `llm-task` untuk penyedia/model terkonfigurasi tersebut. Gunakan `compat.reasoningEffortMap` ketika backend menginginkan nilai spesifik penyedia untuk level kanonis.
- `params.preserveThinking`: opt-in khusus Z.AI untuk thinking yang dipertahankan. Saat diaktifkan dan thinking menyala, OpenClaw mengirim `thinking.clear_thinking: false` dan memutar ulang `reasoning_content` sebelumnya; lihat [thinking Z.AI dan thinking yang dipertahankan](/id/providers/zai#thinking-and-preserved-thinking).
- `localService`: manajer proses tingkat penyedia opsional untuk server model lokal/self-hosted. Ketika model yang dipilih milik penyedia tersebut, OpenClaw memeriksa `healthUrl` (atau `baseUrl + "/models"`), menjalankan `command` dengan `args` jika endpoint mati, menunggu hingga `readyTimeoutMs`, lalu mengirim permintaan model. `command` harus berupa path absolut. `idleStopMs: 0` menjaga proses tetap hidup hingga OpenClaw keluar; nilai positif menghentikan proses yang dijalankan OpenClaw setelah idle selama jumlah milidetik tersebut. Lihat [Layanan model lokal](/id/gateway/local-model-services).
- Kebijakan runtime berada pada penyedia atau model, bukan pada `agents.defaults`. Gunakan `models.providers.<provider>.agentRuntime` untuk aturan seluruh penyedia atau `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` untuk aturan spesifik model. Model agen OpenAI pada penyedia OpenAI resmi memilih Codex secara default.
- Penulis konfigurasi yang memutasi bidang ini (misalnya `/models set`, `/models set-image`, dan perintah tambah/hapus fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang ada saat memungkinkan.
- `maxConcurrent`: jumlah maksimum run agen paralel di seluruh sesi (setiap sesi tetap diserialkan). Default: 4.

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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, id harness Plugin terdaftar, atau alias backend CLI yang didukung. Plugin Codex bawaan mendaftarkan `codex`; Plugin Anthropic bawaan menyediakan backend CLI `claude-cli`.
- `id: "auto"` memungkinkan harness Plugin terdaftar mengklaim giliran yang didukung dan menggunakan OpenClaw saat tidak ada harness yang cocok. Runtime Plugin eksplisit seperti `id: "codex"` memerlukan harness tersebut dan gagal tertutup jika tidak tersedia atau gagal.
- `id: "pi"` hanya diterima sebagai alias usang untuk `openclaw` demi mempertahankan konfigurasi yang sudah dirilis dari v2026.5.22 dan sebelumnya. Konfigurasi baru harus menggunakan `openclaw`.
- Prioritas runtime dimulai dari kebijakan model eksak (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]`, atau `models.providers.<provider>.models[]`), lalu `agents.list[]` / `agents.defaults.models["provider/*"]`, lalu kebijakan tingkat penyedia di `models.providers.<provider>.agentRuntime`.
- Kunci runtime seluruh agen adalah warisan lama. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, pin runtime sesi, dan `OPENCLAW_AGENT_RUNTIME` diabaikan oleh pemilihan runtime. Jalankan `openclaw doctor --fix` untuk menghapus nilai usang.
- Model agen OpenAI menggunakan harness Codex secara bawaan; `agentRuntime.id: "codex"` penyedia/model tetap valid saat Anda ingin membuatnya eksplisit.
- Untuk deployment Claude CLI, lebih baik gunakan `model: "anthropic/claude-opus-4-8"` ditambah `agentRuntime.id: "claude-cli"` bercakupan model. Ref model warisan lama `claude-cli/claude-opus-4-7` tetap berfungsi untuk kompatibilitas, tetapi konfigurasi baru harus mempertahankan pemilihan penyedia/model yang kanonis dan menempatkan backend eksekusi dalam kebijakan runtime penyedia/model.
- Ini hanya mengontrol eksekusi giliran agen teks. Pembuatan media, vision, PDF, musik, video, dan TTS tetap menggunakan pengaturan penyedia/model masing-masing.

**Singkatan alias bawaan** (hanya berlaku saat model berada di `agents.defaults.models`):

| Alias               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Alias yang Anda konfigurasi selalu mengungguli nilai bawaan.

Model Z.AI GLM-4.x otomatis mengaktifkan mode berpikir kecuali Anda mengatur `--thinking off` atau mendefinisikan `agents.defaults.models["zai/<model>"].params.thinking` sendiri.
Model Z.AI mengaktifkan `tool_stream` secara bawaan untuk streaming panggilan alat. Atur `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Anthropic Claude Opus 4.8 menjaga berpikir tetap nonaktif secara bawaan di OpenClaw; saat berpikir adaptif diaktifkan secara eksplisit, nilai bawaan upaya milik penyedia Anthropic adalah `high`. Model Claude 4.6 secara bawaan menggunakan `adaptive` saat tidak ada level berpikir eksplisit yang diatur.

### `agents.defaults.cliBackends`

Backend CLI opsional untuk eksekusi fallback khusus teks (tanpa panggilan alat). Berguna sebagai cadangan saat penyedia API gagal.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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
- Sesi didukung saat `sessionArg` diatur.
- Penerusan gambar didukung saat `imageArg` menerima path file.
- `reseedFromRawTranscriptWhenUncompacted: true` memungkinkan backend memulihkan sesi aman
  yang dibatalkan dari ekor transkrip mentah OpenClaw yang dibatasi sebelum
  ringkasan Compaction pertama ada. Perubahan profil autentikasi atau epoch kredensial
  tetap tidak pernah melakukan reseed mentah.

### `agents.defaults.promptOverlays`

Overlay prompt yang independen dari penyedia, diterapkan berdasarkan keluarga model pada permukaan prompt yang dirakit OpenClaw. Id model keluarga GPT-5 menerima kontrak perilaku bersama di seluruh rute OpenClaw/penyedia; `personality` hanya mengontrol lapisan gaya interaksi ramah. Rute app-server native Codex mempertahankan instruksi dasar/model milik Codex, bukan overlay GPT-5 OpenClaw ini, dan OpenClaw menonaktifkan personality bawaan Codex untuk thread native.

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

- `"friendly"` (bawaan) dan `"on"` mengaktifkan lapisan gaya interaksi ramah.
- `"off"` hanya menonaktifkan lapisan ramah; kontrak perilaku GPT-5 bertag tetap aktif.
- `plugins.entries.openai.config.personality` warisan lama tetap dibaca saat pengaturan bersama ini belum diatur.

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

- `every`: string durasi (ms/s/m/h). Bawaan: `30m` (autentikasi kunci API) atau `1h` (autentikasi OAuth). Atur ke `0m` untuk menonaktifkan.
- `includeSystemPromptSection`: saat false, menghilangkan bagian Heartbeat dari prompt sistem dan melewati injeksi `HEARTBEAT.md` ke konteks bootstrap. Bawaan: `true`.
- `suppressToolErrorWarnings`: saat true, menekan payload peringatan kesalahan alat selama eksekusi Heartbeat.
- `timeoutSeconds`: waktu maksimum dalam detik yang diizinkan untuk giliran agen Heartbeat sebelum dibatalkan. Biarkan tidak diatur untuk menggunakan `agents.defaults.timeoutSeconds` saat diatur, jika tidak cadence Heartbeat dibatasi pada 600 detik.
- `directPolicy`: kebijakan pengiriman langsung/DM. `allow` (bawaan) mengizinkan pengiriman ke target langsung. `block` menekan pengiriman ke target langsung dan memancarkan `reason=dm-blocked`.
- `lightContext`: saat true, eksekusi Heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: saat true, setiap Heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasi yang sama seperti Cron `sessionTarget: "isolated"`. Mengurangi biaya token per Heartbeat dari ~100K menjadi ~2-5K token.
- `skipWhenBusy`: saat true, eksekusi Heartbeat ditunda pada lane sibuk tambahan agen tersebut: pekerjaan subagen berkunci sesi miliknya sendiri atau perintah bertingkat. Lane Cron selalu menunda Heartbeat, bahkan tanpa flag ini.
- Per agen: atur `agents.list[].heartbeat`. Saat agen mana pun mendefinisikan `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat.
- Heartbeat menjalankan giliran agen penuh — interval yang lebih pendek membakar lebih banyak token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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

- `mode`: `default` atau `safeguard` (peringkasan berpotongan untuk riwayat panjang). Lihat [Compaction](/id/concepts/compaction).
- `provider`: id dari plugin penyedia Compaction yang terdaftar. Jika diatur, `summarize()` milik penyedia dipanggil alih-alih peringkasan LLM bawaan. Kembali ke bawaan jika gagal. Mengatur penyedia memaksa `mode: "safeguard"`. Lihat [Compaction](/id/concepts/compaction).
- `timeoutSeconds`: jumlah detik maksimum yang diizinkan untuk satu operasi Compaction sebelum OpenClaw membatalkannya. Default: `180`.
- `keepRecentTokens`: anggaran titik potong agen untuk menyimpan ekor transkrip terbaru secara verbatim. `/compact` manual menghormati ini saat diatur secara eksplisit; jika tidak, Compaction manual adalah checkpoint keras.
- `identifierPolicy`: `strict` (default), `off`, atau `custom`. `strict` menambahkan panduan retensi pengidentifikasi buram bawaan di awal selama peringkasan Compaction.
- `identifierInstructions`: teks pelestarian pengidentifikasi kustom opsional yang digunakan saat `identifierPolicy=custom`.
- `qualityGuard`: pemeriksaan coba ulang saat keluaran salah bentuk untuk ringkasan safeguard. Diaktifkan secara default dalam mode safeguard; atur `enabled: false` untuk melewati audit.
- `midTurnPrecheck`: pemeriksaan tekanan tool-loop opsional. Saat `enabled: true`, OpenClaw memeriksa tekanan konteks setelah hasil alat ditambahkan dan sebelum panggilan model berikutnya. Jika konteks tidak lagi muat, OpenClaw membatalkan upaya saat ini sebelum mengirim prompt dan menggunakan ulang jalur pemulihan precheck yang ada untuk memangkas hasil alat atau melakukan Compaction dan mencoba lagi. Berfungsi dengan mode Compaction `default` maupun `safeguard`. Default: dinonaktifkan.
- `postCompactionSections`: nama bagian H2/H3 AGENTS.md opsional untuk disisipkan kembali setelah Compaction. Penyisipan kembali dinonaktifkan saat tidak diatur atau diatur ke `[]`. Mengatur `["Session Startup", "Red Lines"]` secara eksplisit mengaktifkan pasangan tersebut dan mempertahankan fallback lama `Every Session`/`Safety`. Aktifkan ini hanya jika konteks tambahan sepadan dengan risiko menduplikasi panduan proyek yang sudah tertangkap dalam ringkasan Compaction.
- `model`: `provider/model-id` opsional atau alias polos dari `agents.defaults.models` hanya untuk peringkasan Compaction. Alias polos diselesaikan sebelum dispatch; ID model literal yang dikonfigurasi tetap memiliki prioritas saat ada tabrakan. Gunakan ini saat sesi utama harus mempertahankan satu model, tetapi ringkasan Compaction harus berjalan pada model lain; jika tidak diatur, Compaction menggunakan model utama sesi.
- `maxActiveTranscriptBytes`: ambang byte opsional (`number` atau string seperti `"20mb"`) yang memicu Compaction lokal normal sebelum run saat JSONL aktif tumbuh melewati ambang. Memerlukan `truncateAfterCompaction` agar Compaction yang berhasil dapat merotasi ke transkrip penerus yang lebih kecil. Dinonaktifkan saat tidak diatur atau `0`.
- `notifyUser`: saat `true`, mengirim pemberitahuan singkat kepada pengguna saat Compaction dimulai dan saat selesai (misalnya, "Compacting context..." dan "Compaction complete"). Dinonaktifkan secara default agar Compaction tetap senyap.
- `memoryFlush`: giliran agentic senyap sebelum auto-compaction untuk menyimpan memori tahan lama. Atur `model` ke penyedia/model persis seperti `ollama/qwen3:8b` saat giliran housekeeping ini harus tetap pada model lokal; override tidak mewarisi rantai fallback sesi aktif. Dilewati saat workspace bersifat hanya-baca.

### `agents.defaults.runRetries`

Batas iterasi percobaan ulang loop run luar untuk runtime agen tertanam guna mencegah loop eksekusi tanpa akhir selama pemulihan kegagalan. Perhatikan bahwa pengaturan ini saat ini hanya berlaku untuk runtime agen tertanam, bukan runtime ACP atau CLI.

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

- `base`: jumlah dasar iterasi percobaan ulang run untuk loop run luar. Default: `24`.
- `perProfile`: iterasi percobaan ulang run tambahan yang diberikan per kandidat profil fallback. Default: `8`.
- `min`: batas absolut minimum untuk iterasi percobaan ulang run. Default: `32`.
- `max`: batas absolut maksimum untuk iterasi percobaan ulang run guna mencegah eksekusi tak terkendali. Default: `160`.

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` mengaktifkan lintasan pemangkasan.
- `ttl` mengontrol seberapa sering pemangkasan dapat berjalan lagi (setelah sentuhan cache terakhir).
- Pemangkasan terlebih dahulu melakukan soft-trim pada hasil alat yang terlalu besar, lalu hard-clear pada hasil alat yang lebih lama jika diperlukan.
- `softTrimRatio` dan `hardClearRatio` menerima nilai dari `0.0` sampai `1.0`; validasi konfigurasi menolak nilai di luar rentang tersebut.

**Soft-trim** mempertahankan awal + akhir dan menyisipkan `...` di tengah.

**Hard-clear** mengganti seluruh hasil alat dengan placeholder.

Catatan:

- Blok gambar tidak pernah dipangkas/dibersihkan.
- Rasio berbasis karakter (perkiraan), bukan jumlah token persis.
- Jika pesan asisten lebih sedikit dari `keepLastAssistants`, pemangkasan dilewati.

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
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Kanal non-Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
- Override kanal: `channels.<channel>.blockStreamingCoalesce` (dan varian per akun). Signal/Slack/Discord/Google Chat default `minChars: 1500`.
- `humanDelay`: jeda acak antar balasan blok. `natural` = 800–2500ms. Override per agen: `agents.list[].humanDelay`.

Lihat [Streaming](/id/concepts/streaming) untuk detail perilaku + pemotongan.

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

Lihat [Typing Indicators](/id/concepts/typing-indicators).

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
- `workspaceRoot`: root jarak jauh absolut yang digunakan untuk workspace per scope
- `identityFile` / `certificateFile` / `knownHostsFile`: file lokal yang ada yang diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: konten inline atau SecretRefs yang dimaterialisasi OpenClaw menjadi file sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: knob kebijakan host-key OpenSSH

**Prioritas auth SSH:**

- `identityData` menang atas `identityFile`
- `certificateData` menang atas `certificateFile`
- `knownHostsData` menang atas `knownHostsFile`
- Nilai `*Data` berbasis SecretRef diselesaikan dari snapshot runtime rahasia aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- mengisi workspace jarak jauh sekali setelah create atau recreate
- lalu menjaga workspace SSH jarak jauh sebagai kanonis
- merutekan `exec`, alat file, dan jalur media melalui SSH
- tidak menyinkronkan perubahan jarak jauh kembali ke host secara otomatis
- tidak mendukung kontainer browser sandbox

**Akses workspace:**

- `none`: workspace sandbox per scope di bawah `~/.openclaw/sandboxes`
- `ro`: workspace sandbox di `/workspace`, workspace agen dipasang hanya-baca di `/agent`
- `rw`: workspace agen dipasang baca/tulis di `/workspace`

**Scope:**

- `session`: kontainer + workspace per sesi
- `agent`: satu kontainer + workspace per agen (default)
- `shared`: kontainer dan workspace bersama (tanpa isolasi lintas sesi)

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
- `remote`: seed remote satu kali saat sandbox dibuat, lalu pertahankan workspace remote sebagai kanonis

Dalam mode `remote`, edit lokal host yang dibuat di luar OpenClaw tidak otomatis disinkronkan ke sandbox setelah langkah seed.
Transport adalah SSH ke sandbox OpenShell, tetapi plugin memiliki daur hidup sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** berjalan satu kali setelah pembuatan kontainer (melalui `sh -lc`). Membutuhkan egress jaringan, root yang dapat ditulis, pengguna root.

**Kontainer default ke `network: "none"`** — atur ke `"bridge"` (atau jaringan bridge kustom) jika agent membutuhkan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda secara eksplisit mengatur
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).
Giliran app-server Codex dalam sandbox OpenClaw aktif menggunakan pengaturan egress yang sama ini untuk akses jaringan mode kode native mereka.

**Lampiran masuk** ditempatkan ke `media/inbound/*` di workspace aktif.

**`docker.binds`** me-mount direktori host tambahan; bind global dan per-agent digabungkan.

**Browser tersandbox** (`sandbox.browser.enabled`): Chromium + CDP dalam kontainer. URL noVNC disisipkan ke prompt sistem. Tidak memerlukan `browser.enabled` di `openclaw.json`.
Akses pengamat noVNC menggunakan autentikasi VNC secara default dan OpenClaw menerbitkan URL token berumur pendek (alih-alih mengekspos kata sandi di URL bersama).

- `allowHostControl: false` (default) memblokir sesi tersandbox dari menargetkan browser host.
- `network` default ke `openclaw-sandbox-browser` (jaringan bridge khusus). Atur ke `bridge` hanya ketika Anda secara eksplisit menginginkan konektivitas bridge global.
- `cdpSourceRange` secara opsional membatasi ingress CDP di tepi kontainer ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` me-mount direktori host tambahan hanya ke kontainer browser sandbox. Ketika diatur (termasuk `[]`), ini menggantikan `docker.binds` untuk kontainer browser.
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
  - ditambah `--no-sandbox` ketika `noSandbox` diaktifkan.
  - Default adalah baseline image kontainer; gunakan image browser kustom dengan
    entrypoint kustom untuk mengubah default kontainer.

</Accordion>

Sandboxing browser dan `sandbox.docker.binds` hanya untuk Docker.

Build image (dari checkout sumber):

```bash
scripts/sandbox-setup.sh           # image sandbox utama
scripts/sandbox-browser-setup.sh   # image browser opsional
```

Untuk instalasi npm tanpa checkout sumber, lihat [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup) untuk perintah `docker build` inline.

### `agents.list` (override per-agent)

Gunakan `agents.list[].tts` untuk memberi agent penyedia TTS, voice, model,
style, atau mode auto-TTS sendiri. Blok agent deep-merge di atas
`messages.tts` global, sehingga kredensial bersama dapat tetap di satu tempat sementara masing-masing
agent hanya meng-override bidang voice atau penyedia yang mereka butuhkan. Override agent aktif
berlaku untuk balasan lisan otomatis, `/tts audio`, `/tts status`, dan
tool agent `tts`. Lihat [Text-to-speech](/id/tools/tts#per-agent-voice-overrides)
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
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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

- `id`: id agent stabil (wajib).
- `default`: ketika beberapa diatur, yang pertama menang (peringatan dicatat). Jika tidak ada yang diatur, entri daftar pertama menjadi default.
- `model`: bentuk string menetapkan primary per-agent yang ketat tanpa fallback model; bentuk objek `{ primary }` juga ketat kecuali Anda menambahkan `fallbacks`. Gunakan `{ primary, fallbacks: [...] }` untuk mengikutsertakan agent tersebut ke fallback, atau `{ primary, fallbacks: [] }` untuk membuat perilaku ketat eksplisit. Job Cron yang hanya meng-override `primary` tetap mewarisi fallback default kecuali Anda mengatur `fallbacks: []`.
- `params`: parameter stream per-agent yang digabungkan di atas entri model terpilih di `agents.defaults.models`. Gunakan ini untuk override khusus agent seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `tts`: override text-to-speech per-agent opsional. Blok ini deep-merge di atas `messages.tts`, jadi simpan kredensial penyedia bersama dan kebijakan fallback di `messages.tts` dan atur hanya nilai khusus persona seperti penyedia, voice, model, style, atau mode otomatis di sini.
- `skills`: allowlist skill per-agent opsional. Jika dihilangkan, agent mewarisi `agents.defaults.skills` ketika diatur; daftar eksplisit menggantikan default alih-alih menggabungkan, dan `[]` berarti tanpa skills.
- `thinkingDefault`: level thinking default per-agent opsional (`off | minimal | low | medium | high | xhigh | adaptive | max`). Meng-override `agents.defaults.thinkingDefault` untuk agent ini ketika tidak ada override per-pesan atau sesi yang diatur. Profil penyedia/model yang dipilih mengontrol nilai mana yang valid; untuk Google Gemini, `adaptive` mempertahankan thinking dinamis milik penyedia (`thinkingLevel` dihilangkan pada Gemini 3/3.1, `thinkingBudget: -1` pada Gemini 2.5).
- `reasoningDefault`: visibilitas reasoning default per-agent opsional (`on | off | stream`). Meng-override `agents.defaults.reasoningDefault` untuk agent ini ketika tidak ada override reasoning per-pesan atau sesi yang diatur.
- `fastModeDefault`: default per-agent opsional untuk mode cepat (`"auto" | true | false`). Berlaku ketika tidak ada override mode cepat per-pesan atau sesi yang diatur.
- `models`: katalog model per-agent/override runtime opsional yang diindeks oleh id `provider/model` lengkap. Gunakan `models["provider/model"].agentRuntime` untuk pengecualian runtime per-agent.
- `runtime`: deskriptor runtime per-agent opsional. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) ketika agent harus default ke sesi harness ACP.
- `identity.avatar`: path relatif workspace, URL `http(s)`, atau URI `data:`.
- File gambar `identity.avatar` lokal relatif workspace dibatasi hingga 2 MB. URL `http(s)` dan URI `data:` tidak diperiksa dengan batas ukuran file lokal.
- `identity` menurunkan default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: allowlist id agent terkonfigurasi untuk target `sessions_spawn.agentId` eksplisit (`["*"]` = target terkonfigurasi mana pun; default: agent yang sama saja). Sertakan id peminta ketika panggilan `agentId` yang menargetkan diri sendiri harus diizinkan. Entri basi yang konfigurasi agent-nya telah dihapus ditolak oleh `sessions_spawn` dan dihilangkan dari `agents_list`; jalankan `openclaw doctor --fix` untuk membersihkannya, atau tambahkan entri minimal `agents.list[]` jika target tersebut harus tetap dapat di-spawn sambil mewarisi default.
- Guard pewarisan sandbox: jika sesi peminta tersandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: ketika true, blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).

---

## Routing multi-agent

Jalankan beberapa agent terisolasi dalam satu Gateway. Lihat [Multi-Agent](/id/concepts/multi-agent).

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

- `type` (opsional): `route` untuk routing normal (type yang tidak ada default ke route), `acp` untuk binding percakapan ACP persisten.
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
6. Agent default

Dalam tiap tingkat, entri `bindings` pertama yang cocok menang.

Untuk entri `type: "acp"`, OpenClaw menyelesaikan berdasarkan identitas percakapan persis (`match.channel` + akun + `match.peer.id`) dan tidak menggunakan urutan tingkat binding route di atas.

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

<Accordion title="Tanpa akses sistem berkas (hanya perpesanan)">

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

Lihat [Sandbox & Alat Multi-Agent](/id/tools/multi-agent-sandbox-tools) untuk detail prioritas.

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
      mode: "enforce", // enforce (default) | warn
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
  - `per-sender` (bawaan): setiap pengirim mendapatkan sesi terisolasi dalam konteks kanal.
  - `global`: semua peserta dalam konteks kanal berbagi satu sesi (gunakan hanya saat konteks bersama memang dimaksudkan).
- **`dmScope`**: cara DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: isolasi berdasarkan id pengirim lintas kanal.
  - `per-channel-peer`: isolasi per kanal + pengirim (direkomendasikan untuk kotak masuk multi-pengguna).
  - `per-account-channel-peer`: isolasi per akun + kanal + pengirim (direkomendasikan untuk multi-akun).
- **`identityLinks`**: memetakan id kanonis ke peer berprefiks penyedia untuk berbagi sesi lintas kanal. Perintah Dock seperti `/dock_discord` menggunakan peta yang sama untuk mengalihkan rute balasan sesi aktif ke peer kanal tertaut lainnya; lihat [Docking kanal](/id/concepts/channel-docking).
- **`reset`**: kebijakan reset utama. `daily` mereset pada waktu lokal `atHour`; `idle` mereset setelah `idleMinutes`. Jika keduanya dikonfigurasi, yang kedaluwarsa lebih dulu menang. Kesegaran reset harian menggunakan `sessionStartedAt` pada baris sesi; kesegaran reset idle menggunakan `lastInteractionAt`. Penulisan latar belakang/peristiwa sistem seperti Heartbeat, bangun Cron, notifikasi exec, dan pembukuan Gateway dapat memperbarui `updatedAt`, tetapi tidak membuat sesi harian/idle tetap segar.
- **`resetByType`**: override per jenis (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`mainKey`**: kolom lama. Runtime selalu menggunakan `"main"` untuk bucket obrolan langsung utama.
- **`agentToAgent.maxPingPongTurns`**: jumlah maksimum giliran balas-balik antar agen selama pertukaran agen-ke-agen (bilangan bulat, rentang: `0`-`20`, bawaan: `5`). `0` menonaktifkan rantai ping-pong.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Penolakan pertama menang.
- **`maintenance`**: kontrol pembersihan + retensi penyimpanan sesi.
  - `mode`: `enforce` menerapkan pembersihan dan menjadi bawaan; `warn` hanya mengeluarkan peringatan.
  - `pruneAfter`: batas umur untuk entri basi (bawaan `30d`).
  - `maxEntries`: jumlah maksimum entri di `sessions.json` (bawaan `500`). Runtime menulis pembersihan batch dengan buffer high-water kecil untuk batas berukuran produksi; `openclaw sessions cleanup --enforce` menerapkan batas tersebut segera.
  - Sesi probe model-run Gateway yang berumur pendek menggunakan retensi tetap `24h`, tetapi pembersihannya dibatasi oleh tekanan: pembersihan hanya menghapus baris probe model-run ketat yang basi saat tekanan pemeliharaan/batas entri sesi tercapai. Hanya kunci probe eksplisit ketat yang cocok dengan `agent:*:explicit:model-run-<uuid>` yang memenuhi syarat; sesi langsung, grup, thread, Cron, hook, Heartbeat, ACP, dan sub-agen normal tidak mewarisi retensi 24 jam ini. Saat pembersihan model-run berjalan, pembersihan itu berjalan sebelum pembersihan entri basi `pruneAfter` yang lebih luas dan batas `maxEntries`.
  - `rotateBytes`: tidak digunakan lagi dan diabaikan; `openclaw doctor --fix` menghapusnya dari konfigurasi lama.
  - `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>`. Bawaan ke `pruneAfter`; tetapkan `false` untuk menonaktifkan.
  - `maxDiskBytes`: anggaran disk direktori sesi opsional. Dalam mode `warn`, ini mencatat peringatan; dalam mode `enforce`, ini menghapus artefak/sesi tertua terlebih dahulu.
  - `highWaterBytes`: target opsional setelah pembersihan anggaran. Bawaan ke `80%` dari `maxDiskBytes`.
- **`threadBindings`**: bawaan global untuk fitur sesi terikat thread.
  - `enabled`: sakelar bawaan utama (penyedia dapat meng-override; Discord menggunakan `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus bawaan karena tidak aktif dalam jam (`0` menonaktifkan; penyedia dapat meng-override)
  - `maxAgeHours`: umur maksimum keras bawaan dalam jam (`0` menonaktifkan; penyedia dapat meng-override)
  - `spawnSessions`: gate bawaan untuk membuat sesi kerja terikat thread dari `sessions_spawn` dan spawn thread ACP. Bawaan ke `true` saat binding thread diaktifkan; penyedia/akun dapat meng-override.
  - `defaultSpawnContext`: konteks subagen native bawaan untuk spawn terikat thread (`"fork"` atau `"isolated"`). Bawaan ke `"fork"`.

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

Override per kanal/akun: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik menang): akun → kanal → global. `""` menonaktifkan dan menghentikan kaskade. `"auto"` menurunkan `[{identity.name}]`.

**Variabel templat:**

| Variabel          | Deskripsi             | Contoh                      |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | Nama model pendek     | `claude-opus-4-6`           |
| `{modelFull}`     | Pengidentifikasi model lengkap | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama penyedia         | `anthropic`                 |
| `{thinkingLevel}` | Tingkat berpikir saat ini | `high`, `low`, `off`        |
| `{identity.name}` | Nama identitas agen   | (sama seperti `"auto"`)     |

Variabel tidak peka huruf besar/kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi ack

- Bawaan ke `identity.emoji` agen aktif, jika tidak ada `"👀"`. Tetapkan `""` untuk menonaktifkan.
- Override per kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: akun → kanal → `messages.ackReaction` → fallback identitas.
- Cakupan: `group-mentions` (bawaan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: menghapus ack setelah balasan pada kanal yang mendukung reaksi seperti Slack, Discord, Telegram, WhatsApp, dan iMessage.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status siklus hidup di Slack, Discord, Telegram, dan WhatsApp.
  Di Slack dan Discord, nilai yang tidak diatur mempertahankan reaksi status tetap aktif saat reaksi ack aktif.
  Di Telegram dan WhatsApp, tetapkan secara eksplisit ke `true` untuk mengaktifkan reaksi status siklus hidup.
- `messages.statusReactions.emojis`: meng-override kunci emoji siklus hidup:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft`, dan `stallHard`.
  Telegram hanya mengizinkan set reaksi tetap, jadi emoji terkonfigurasi yang tidak didukung akan fallback
  ke varian status terdekat yang didukung untuk obrolan tersebut.

### Debounce inbound

Mengelompokkan pesan cepat yang hanya berisi teks dari pengirim yang sama menjadi satu giliran agen. Media/lampiran langsung memicu flush. Perintah kontrol melewati debouncing.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` mengontrol mode auto-TTS default: `off`, `always`, `inbound`, atau `tagged`. `/tts on|off` dapat mengganti preferensi lokal, dan `/tts status` menampilkan status efektif.
- `summaryModel` mengganti `agents.defaults.model.primary` untuk ringkasan otomatis.
- `modelOverrides` diaktifkan secara default; `modelOverrides.allowProvider` default-nya `false` (ikut serta secara eksplisit).
- Kunci API menggunakan fallback ke `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY`.
- Penyedia ucapan bawaan dimiliki oleh plugin. Jika `plugins.allow` diatur, sertakan setiap plugin penyedia TTS yang ingin Anda gunakan, misalnya `microsoft` untuk Edge TTS. ID penyedia lama `edge` diterima sebagai alias untuk `microsoft`.
- `providers.openai.baseUrl` mengganti endpoint TTS OpenAI. Urutan resolusinya adalah konfigurasi, lalu `OPENAI_TTS_BASE_URL`, lalu `https://api.openai.com/v1`.
- Ketika `providers.openai.baseUrl` menunjuk ke endpoint non-OpenAI, OpenClaw memperlakukannya sebagai server TTS yang kompatibel dengan OpenAI dan melonggarkan validasi model/suara.

---

## Bicara

Default untuk mode Bicara (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
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
          speakerVoice: "cedar",
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

- `talk.provider` harus cocok dengan salah satu kunci di `talk.providers` ketika beberapa penyedia Talk dikonfigurasi.
- Kunci Talk datar lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan ke `talk.providers.<provider>`.
- ID suara menggunakan fallback ke `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID`.
- `providers.*.apiKey` menerima string plaintext atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku ketika tidak ada kunci API Talk yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan direktif Talk menggunakan nama ramah.
- `providers.mlx.modelId` memilih repo Hugging Face yang digunakan oleh pembantu MLX lokal macOS. Jika dihilangkan, macOS menggunakan `mlx-community/Soprano-80M-bf16`.
- Pemutaran MLX macOS berjalan melalui pembantu `openclaw-mlx-tts` bawaan ketika tersedia, atau executable pada `PATH`; `OPENCLAW_MLX_TTS_BIN` mengganti jalur pembantu untuk pengembangan.
- `consultThinkingLevel` mengontrol tingkat berpikir untuk proses agen OpenClaw penuh di balik panggilan Control UI Talk realtime `openclaw_agent_consult`. Biarkan tidak diatur untuk mempertahankan perilaku sesi/model normal.
- `consultFastMode` menetapkan penggantian fast-mode sekali pakai untuk konsultasi Control UI Talk realtime tanpa mengubah pengaturan fast-mode normal sesi.
- `speechLocale` menetapkan ID lokal BCP 47 yang digunakan oleh pengenalan ucapan Talk iOS/macOS. Biarkan tidak diatur untuk menggunakan default perangkat.
- `silenceTimeoutMs` mengontrol berapa lama mode Talk menunggu setelah pengguna diam sebelum mengirim transkrip. Tidak diatur akan mempertahankan jendela jeda default platform (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` menambahkan instruksi sistem yang menghadap penyedia ke prompt realtime bawaan OpenClaw, sehingga gaya suara dapat dikonfigurasi tanpa kehilangan panduan default `openclaw_agent_consult`.
- `realtime.consultRouting` mengontrol fallback relay Gateway ketika penyedia realtime menghasilkan transkrip pengguna final tanpa `openclaw_agent_consult`: `provider-direct` mempertahankan balasan penyedia langsung, sementara `force-agent-consult` merutekan permintaan yang sudah difinalisasi melalui OpenClaw.

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — semua kunci konfigurasi lainnya
- [Konfigurasi](/id/gateway/configuration) — tugas umum dan penyiapan cepat
- [Contoh konfigurasi](/id/gateway/configuration-examples)

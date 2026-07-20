---
read_when:
    - Menyesuaikan default agen (model, pemikiran, ruang kerja, heartbeat, media, skills)
    - Mengonfigurasi perutean dan pengikatan multiagen
    - Menyesuaikan perilaku sesi, pengiriman pesan, dan mode bicara
summary: Default agen, perutean multiagen, sesi, pesan, dan konfigurasi percakapan
title: Konfigurasi — agen
x-i18n:
    generated_at: "2026-07-20T14:05:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b42bd47b953d5e970a125df8250f76ae70891fc5bd12fee3120f03365b5af597
    source_path: gateway/config-agents.md
    workflow: 16
---

Kunci konfigurasi dengan cakupan agen di bawah `agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, dan `talk.*`. Untuk saluran, alat, runtime gateway, dan kunci
tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Default agen

### `agents.defaults.workspace`

Default: `OPENCLAW_WORKSPACE_DIR` jika ditetapkan, jika tidak `~/.openclaw/workspace` (atau `~/.openclaw/workspace-<profile>` jika `OPENCLAW_PROFILE` ditetapkan ke profil non-default).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Nilai `agents.defaults.workspace` yang eksplisit lebih diprioritaskan daripada
`OPENCLAW_WORKSPACE_DIR`. Gunakan variabel lingkungan untuk mengarahkan agen default
ke ruang kerja yang dipasang jika Anda tidak ingin menuliskan jalur tersebut ke dalam konfigurasi.

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan pada baris Runtime di prompt sistem. Jika tidak ditetapkan, OpenClaw mendeteksinya secara otomatis dengan menelusuri direktori ke atas dari ruang kerja.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Daftar izin skill default opsional untuk agen yang tidak menetapkan
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // mewarisi github, weather
      { id: "docs", skills: ["docs-search"] }, // menggantikan default
      { id: "locked-down", skills: [] }, // tanpa skill
    ],
  },
}
```

- Hilangkan `agents.defaults.skills` agar skill tidak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi default.
- Tetapkan `agents.list[].skills: []` agar tidak ada skill.
- Daftar `agents.list[].skills` yang tidak kosong merupakan kumpulan akhir untuk agen tersebut; daftar itu
  tidak digabungkan dengan default.

### `agents.defaults.skipBootstrap`

Menonaktifkan pembuatan otomatis file bootstrap ruang kerja (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Melewati pembuatan file ruang kerja opsional yang dipilih sambil tetap menulis file bootstrap wajib (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Nilai yang valid: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, dan `IDENTITY.md`.

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

Mengontrol kapan file bootstrap ruang kerja disuntikkan ke dalam prompt sistem. Default: `"always"`.

- `"continuation-skip"`: giliran kelanjutan yang aman (setelah respons asisten selesai) melewati penyuntikan ulang bootstrap ruang kerja sehingga mengurangi ukuran prompt. Proses Heartbeat dan percobaan ulang pasca-Compaction tetap membangun ulang konteks.
- `"never"`: menonaktifkan penyuntikan bootstrap ruang kerja dan file konteks pada setiap giliran. Gunakan ini hanya untuk agen yang sepenuhnya mengelola siklus hidup prompt-nya sendiri (mesin konteks khusus, runtime native yang membangun konteksnya sendiri, atau alur kerja khusus tanpa bootstrap). Giliran Heartbeat dan pemulihan Compaction juga melewati penyuntikan.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Penimpaan per agen: `agents.list[].contextInjection`. Nilai yang dihilangkan mewarisi
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Jumlah maksimum karakter per file bootstrap ruang kerja sebelum dipotong. Default: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Penimpaan per agen: `agents.list[].bootstrapMaxChars`. Nilai yang dihilangkan mewarisi
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Jumlah maksimum keseluruhan karakter yang disuntikkan dari semua file bootstrap ruang kerja. Default: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Penimpaan per agen: `agents.list[].bootstrapTotalMaxChars`. Nilai yang dihilangkan
mewarisi `agents.defaults.bootstrapTotalMaxChars`.

### Penimpaan profil bootstrap per agen

Gunakan penimpaan profil bootstrap per agen ketika satu agen memerlukan perilaku
penyuntikan prompt yang berbeda dari default bersama. Kolom yang dihilangkan mewarisi dari
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

Mengontrol pemberitahuan pada prompt sistem yang terlihat oleh agen saat konteks bootstrap dipotong.
Default: `"always"`.

- `"off"`: jangan pernah menyuntikkan teks pemberitahuan pemotongan ke dalam prompt sistem.
- `"once"`: suntikkan pemberitahuan ringkas satu kali untuk setiap tanda tangan pemotongan yang unik.
- `"always"`: suntikkan pemberitahuan ringkas pada setiap proses ketika terjadi pemotongan (direkomendasikan).

Jumlah mentah/disuntikkan yang terperinci dan kolom penyesuaian konfigurasi tetap berada dalam diagnostik seperti
laporan konteks/status dan log; konteks pengguna/runtime WebChat rutin hanya
menerima pemberitahuan pemulihan yang ringkas.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Peta kepemilikan anggaran konteks

OpenClaw memiliki beberapa anggaran prompt/konteks bervolume tinggi, dan anggaran tersebut
sengaja dipisahkan berdasarkan subsistem alih-alih semuanya dialirkan melalui satu
kontrol generik.

| Anggaran                                                         | Cakupan                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Penyuntikan bootstrap ruang kerja normal                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Pendahuluan sekali pakai untuk proses model saat reset/startup, termasuk file `memory/*.md` harian terbaru. Perintah chat sederhana `/new` dan `/reset` dikonfirmasi tanpa memanggil model |
| `skills.limits.*`                                              | Daftar skill ringkas yang disuntikkan ke dalam prompt sistem                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Kutipan runtime terbatas dan blok milik runtime yang disuntikkan                                                                                                      |
| `memory.qmd.limits.*`                                          | Cuplikan pencarian memori terindeks dan ukuran penyuntikan                                                                                                              |

Penimpaan per agen yang sesuai:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Mengontrol pendahuluan startup pada giliran pertama yang disuntikkan dalam proses model saat reset/startup.
Perintah chat sederhana `/new` dan `/reset` mengonfirmasi reset tanpa memanggil
model sehingga tidak memuat pendahuluan ini.

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: batas kutipan default `memory_get` sebelum metadata
  pemotongan dan pemberitahuan kelanjutan ditambahkan.
- `memoryGetDefaultLines`: jendela baris default `memory_get` ketika `lines`
  dihilangkan.
- `toolResultMaxChars`: batas atas hasil alat langsung tingkat lanjut yang digunakan untuk hasil
  tersimpan dan pemulihan luapan. Biarkan tidak ditetapkan untuk batas otomatis konteks model:
  `16000` karakter di bawah 100K token, `32000` karakter pada 100K+ token, dan `64000`
  karakter pada 200K+ token. Nilai eksplisit hingga `1000000` diterima untuk
  model berkonteks panjang, tetapi batas efektif tetap dibatasi hingga sekitar 30% dari
  jendela konteks model. `openclaw doctor --deep` mencetak batas efektif,
  dan doctor hanya memperingatkan ketika penimpaan eksplisit sudah tidak relevan atau tidak berpengaruh.
- `postCompactionMaxChars`: batas kutipan AGENTS.md yang digunakan selama penyuntikan
  penyegaran pasca-Compaction.

#### `agents.list[].contextLimits`

Penimpaan per agen untuk kontrol `contextLimits` bersama. Kolom yang dihilangkan mewarisi
dari `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // batas atas tingkat lanjut untuk agen ini
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Batas global untuk daftar skill ringkas yang disuntikkan ke dalam prompt sistem. Ini
tidak memengaruhi pembacaan file `SKILL.md` sesuai permintaan.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Penimpaan per agen untuk anggaran prompt skill.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Ukuran piksel maksimum untuk sisi gambar terpanjang dalam blok gambar transkrip/alat sebelum pemanggilan penyedia.
Default: `1200`.

Nilai yang lebih rendah biasanya mengurangi penggunaan token visi dan ukuran muatan permintaan untuk proses yang banyak menggunakan tangkapan layar.
Nilai yang lebih tinggi mempertahankan lebih banyak detail visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferensi kompresi/detail alat gambar untuk gambar yang dimuat dari jalur file, URL, dan referensi media.
Default: `auto`.

OpenClaw menyesuaikan tingkatan pengubahan ukuran dengan model gambar yang dipilih. Misalnya, Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL, dan model visi Llama 4 yang di-host dapat menggunakan gambar yang lebih besar daripada jalur visi berdetail tinggi versi lama/default, sedangkan giliran dengan banyak gambar dikompresi lebih agresif dalam mode `auto` untuk mengendalikan biaya token dan latensi.

Nilai:

- `auto`: sesuaikan dengan batas model dan jumlah gambar.
- `efficient`: prioritaskan gambar yang lebih kecil untuk penggunaan token dan byte yang lebih rendah.
- `balanced`: gunakan tingkatan standar yang seimbang.
- `high`: pertahankan lebih banyak detail untuk tangkapan layar, diagram, dan gambar dokumen.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Zona waktu untuk konteks prompt sistem (bukan stempel waktu pesan). Kembali ke zona waktu host jika tidak ditetapkan.

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
      utilityModel: "openai/gpt-5.4-mini",
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // parameter penyedia default global
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Bentuk string hanya menetapkan model utama.
  - Bentuk objek menetapkan model utama beserta model failover yang berurutan.
- `utilityModel`: ref atau alias `provider/model` opsional untuk tugas internal singkat. Saat ini, ini digunakan untuk judul sesi Control UI yang dihasilkan, judul topik DM Telegram, judul utas otomatis Discord, dan [narasi draf progres](/id/concepts/progress-drafts#narrated-status). Jika tidak ditetapkan, OpenClaw memperoleh default model kecil yang dideklarasikan oleh penyedia utama jika tersedia (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); jika tidak, tugas judul menggunakan model utama agen, sedangkan narasi tetap nonaktif. Jika model utilitas terpisah tidak dapat menyiapkan atau menyelesaikan judul yang dihasilkan, OpenClaw mencoba ulang judul tersebut satu kali dengan model utama. Untuk judul dasbor, derivasi utilitas otomatis dan fallback reguler menggunakan penyedia sesi serta profil autentikasi yang efektif; model utilitas eksplisit mempertahankan penyedia/autentikasi yang dikonfigurasi. Tetapkan `utilityModel: ""` untuk melewati rute utilitas alternatif; pembuatan judul dasbor tetap dilanjutkan langsung ke model sesi reguler. `agents.list[].utilityModel` menggantikan default, dan penggantian model khusus operasi mengalahkan keduanya. Tugas utilitas melakukan panggilan model terpisah dan mengirimkan konten khusus tugas kepada penyedia model yang dipilih. Pembuatan judul dasbor mengirimkan paling banyak 1.000 karakter pertama dari pesan nonperintah pertama; narasi mengirimkan permintaan masuk beserta ringkasan alat ringkas yang telah disunting. Pilih penyedia yang sesuai dengan persyaratan biaya dan penanganan data Anda.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh jalur alat `image` sebagai konfigurasi model visinya saat model aktif tidak dapat menerima gambar. Sebagai gantinya, model dengan visi native menerima byte gambar yang dimuat secara langsung.
  - Juga digunakan sebagai perutean fallback saat model yang dipilih/default tidak dapat menerima input gambar.
  - Utamakan ref `provider/model` eksplisit. ID tanpa kualifikasi diterima untuk kompatibilitas; jika ID tanpa kualifikasi secara unik cocok dengan entri berkemampuan gambar yang dikonfigurasi dalam `models.providers.*.models`, OpenClaw mengkualifikasikannya ke penyedia tersebut. Kecocokan konfigurasi yang ambigu memerlukan prefiks penyedia eksplisit.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan gambar bersama dan setiap permukaan alat/plugin mendatang yang menghasilkan gambar.
  - Nilai umum: `google/gemini-3.1-flash-image` untuk pembuatan gambar Gemini native, `fal/fal-ai/flux/dev` untuk fal, `openai/gpt-image-2` untuk OpenAI Images, atau `openai/gpt-image-1.5` untuk keluaran PNG/WebP OpenAI dengan latar belakang transparan.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi penyedia yang sesuai (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` atau OAuth OpenAI Codex untuk `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan gambar terdaftar lainnya menurut urutan ID penyedia.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan musik bersama dan alat bawaan `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.6`.
  - Jika dihilangkan, `music_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan musik terdaftar lainnya menurut urutan ID penyedia.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi/kunci API penyedia yang sesuai.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas pembuatan video bersama dan alat bawaan `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` tetap dapat menyimpulkan default penyedia yang didukung autentikasi. Ini mencoba penyedia default saat ini terlebih dahulu, lalu penyedia pembuatan video terdaftar lainnya menurut urutan ID penyedia.
  - Jika Anda memilih penyedia/model secara langsung, konfigurasikan juga autentikasi/kunci API penyedia yang sesuai.
  - Plugin pembuatan video Qwen resmi mendukung hingga 1 video keluaran, 1 gambar masukan, 4 video masukan, durasi 10 detik, serta opsi tingkat penyedia `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh alat `pdf` untuk perutean model.
  - Jika dihilangkan, alat PDF menggunakan fallback ke `imageModel`, lalu ke model sesi/default yang telah diresolusi.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk alat `pdf` ketika `maxBytesMb` tidak diteruskan pada waktu pemanggilan.
- `pdfMaxPages`: jumlah halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi dalam alat `pdf`.
- `verboseDefault`: tingkat verbositas default untuk agen. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `toolProgressDetail`: mode detail untuk ringkasan alat `/verbose` dan baris alat draf progres. Nilai: `"explain"` (default, label manusia yang ringkas) atau `"raw"` (tambahkan perintah/detail mentah jika tersedia). `agents.list[].toolProgressDetail` per agen menggantikan default ini.
- `reasoningDefault`: visibilitas penalaran default untuk agen. Nilai: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` per agen menggantikan default ini. Default penalaran yang dikonfigurasi hanya diterapkan bagi pemilik, pengirim yang diotorisasi, atau konteks Gateway admin-operator ketika tidak ada penggantian penalaran per pesan atau sesi yang ditetapkan.
- `elevatedDefault`: tingkat keluaran dengan hak istimewa default untuk agen. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (misalnya `openai/gpt-5.6-sol` untuk akses OAuth Codex). Jika penyedia dihilangkan, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan penyedia terkonfigurasi yang unik untuk ID model yang persis sama, dan baru kemudian menggunakan fallback ke penyedia default yang dikonfigurasi (perilaku kompatibilitas yang sudah tidak disarankan, jadi utamakan `provider/model` eksplisit). Jika penyedia tersebut tidak lagi menyediakan model default yang dikonfigurasi, OpenClaw menggunakan fallback ke penyedia/model pertama yang dikonfigurasi alih-alih menampilkan default penyedia terhapus yang kedaluwarsa.
- `models`: alias yang dikonfigurasi dan pengaturan per model. Setiap entri dapat menyertakan `alias` (pintasan) dan `params` (khusus penyedia, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, perutean `provider` OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`). Menambahkan entri tidak membatasi penggantian model.
  - Gunakan entri `provider/*` seperti `"openai/*": {}` atau `"vllm/*": {}` untuk menampilkan semua model yang ditemukan bagi penyedia terpilih tanpa mencantumkan setiap ID model secara manual.
  - Tambahkan `agentRuntime` ke entri `provider/*` ketika setiap model yang ditemukan secara dinamis untuk penyedia tersebut harus menggunakan runtime yang sama. Kebijakan runtime `provider/model` yang persis sama tetap mengalahkan wildcard.
  - Pengeditan metadata yang aman: gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri. `config set` menolak penggantian yang akan menghapus entri yang sudah ada kecuali Anda meneruskan `--replace`.
- `modelPolicy.allow`: daftar izin penggantian eksplisit. Menerima alias, ref `provider/model` yang persis sama, dan wildcard prefiks di akhir seperti `openai/*` atau `clawrouter/anthropic/*`. Hilangkan atau gunakan `[]` untuk mengizinkan model apa pun. `agents.list[].modelPolicy.allow` menggantikan kebijakan default untuk agen tersebut; daftar kosong eksplisit mengikutsertakan agen tersebut ke dalam kebijakan izinkan-semua.
  - Alur konfigurasi/orientasi yang tercakup dalam penyedia menggabungkan model penyedia terpilih ke dalam pemetaan ini dan mempertahankan penyedia lain yang sudah dikonfigurasi.
  - Untuk model OpenAI Responses langsung, Compaction sisi server diaktifkan secara otomatis. Gunakan `params.responsesServerCompaction: false` untuk menghentikan penyisipan `context_management`, atau `params.responsesCompactThreshold` untuk mengganti ambang batas. Lihat [Compaction sisi server OpenAI](/id/providers/openai#advanced-configuration).
- `params`: parameter penyedia default global yang diterapkan ke semua model. Tetapkan di `agents.defaults.params` (misalnya `{ cacheRetention: "long" }`).
- `params` urutan prioritas penggabungan (konfigurasi): `agents.defaults.params` (basis global) digantikan oleh `agents.defaults.models["provider/model"].params` (per model), kemudian `agents.list[].params` (ID agen yang cocok) menggantikan berdasarkan kunci. Lihat [Caching Prompt](/id/reference/prompt-caching) untuk detail.
- `models.providers.openrouter.params.provider`: kebijakan perutean penyedia default untuk seluruh OpenRouter. OpenClaw meneruskan ini ke objek `provider` permintaan OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` per model dan parameter agen menggantikan berdasarkan kunci. Lihat [perutean penyedia OpenRouter](/id/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON pass-through lanjutan yang digabungkan ke badan permintaan `api: "openai-completions"` untuk proksi yang kompatibel dengan OpenAI. Jika bertabrakan dengan kunci permintaan yang dihasilkan, badan tambahan akan menang; rute completions non-native tetap menghapus `store` khusus OpenAI setelahnya.
- `params.chat_template_kwargs`: argumen templat obrolan yang kompatibel dengan vLLM/OpenAI dan digabungkan ke badan permintaan `api: "openai-completions"` tingkat atas. Untuk `vllm/nemotron-3-*` dengan thinking nonaktif, Plugin vLLM bawaan secara otomatis mengirimkan `enable_thinking: false` dan `force_nonempty_content: true`; `chat_template_kwargs` eksplisit menggantikan default yang dihasilkan, dan `extra_body.chat_template_kwargs` tetap memiliki prioritas akhir. Model thinking Qwen dan Nemotron vLLM yang dikonfigurasi menampilkan pilihan `/think` biner (`off`, `on`) alih-alih tangga upaya multitingkat.
- `compat.thinkingFormat`: gaya payload thinking yang kompatibel dengan OpenAI. Gunakan `"together"` untuk `reasoning.enabled` bergaya Together, `"qwen"` untuk `enable_thinking` tingkat atas bergaya Qwen, atau `"qwen-chat-template"` untuk `chat_template_kwargs.enable_thinking` pada backend keluarga Qwen yang mendukung argumen kata kunci templat obrolan tingkat permintaan, seperti vLLM. OpenClaw memetakan thinking yang dinonaktifkan ke `false` dan thinking yang diaktifkan ke `true`, sedangkan model Qwen vLLM yang dikonfigurasi menampilkan pilihan `/think` biner untuk format tersebut.
- `compat.supportedReasoningEfforts`: daftar upaya penalaran yang kompatibel dengan OpenAI per model. Sertakan `"xhigh"` untuk endpoint khusus yang benar-benar menerimanya; OpenClaw kemudian menampilkan `/think xhigh` dalam menu perintah, baris sesi Gateway, validasi patch sesi, validasi CLI agen, dan validasi `llm-task` untuk penyedia/model yang dikonfigurasi tersebut. Gunakan `compat.reasoningEffortMap` ketika backend menginginkan nilai khusus penyedia untuk tingkat kanonis.
- `params.preserveThinking`: pilihan ikut serta khusus Z.AI untuk thinking yang dipertahankan. Ketika diaktifkan dan thinking aktif, OpenClaw mengirimkan `thinking.clear_thinking: false` dan memutar ulang `reasoning_content` sebelumnya; lihat [thinking dan thinking yang dipertahankan pada Z.AI](/id/providers/zai#advanced-configuration).
- `localService`: pengelola proses opsional tingkat penyedia untuk server model lokal/yang dihosting sendiri. Ketika model yang dipilih termasuk dalam penyedia tersebut, OpenClaw memeriksa `healthUrl` (atau `baseUrl + "/models"`), menjalankan `command` dengan `args` jika endpoint tidak aktif, menunggu hingga `readyTimeoutMs`, lalu mengirim permintaan model. `command` harus berupa jalur absolut. `idleStopMs: 0` menjaga proses tetap berjalan hingga OpenClaw berhenti; nilai positif menghentikan proses yang dijalankan OpenClaw setelah tidak aktif selama jumlah milidetik tersebut. Lihat [Layanan model lokal](/id/gateway/local-model-services).
- Kebijakan runtime berada pada penyedia atau model, bukan pada `agents.defaults`. Gunakan `models.providers.<provider>.agentRuntime` untuk aturan yang berlaku di seluruh penyedia atau `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` untuk aturan khusus model. Prefiks penyedia/model saja tidak pernah memilih harness. Jika runtime tidak ditetapkan atau bernilai `auto`, OpenAI dapat memilih Codex secara implisit hanya untuk rute resmi HTTPS Platform Responses atau ChatGPT Responses yang cocok persis tanpa penggantian permintaan yang dibuat pengguna. Lihat [Runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).
- Penulis konfigurasi yang mengubah bidang-bidang ini (misalnya `/models set`, `/models set-image`, dan perintah penambahan/penghapusan fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang ada jika memungkinkan.
- `maxConcurrent`: jumlah maksimum proses agen paralel di seluruh sesi (setiap sesi tetap dijalankan secara serial). Default: `4`.

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, id harness plugin yang terdaftar, atau alias backend CLI yang didukung. Plugin Codex bawaan mendaftarkan `codex`; plugin Anthropic bawaan menyediakan backend CLI `claude-cli`.
- `id: "auto"` memungkinkan harness plugin terdaftar mengambil alih rute efektif yang mendeklarasikan atau memenuhi kontrak dukungannya dengan cara lain, dan menggunakan OpenClaw ketika tidak ada harness yang cocok. Runtime plugin eksplisit seperti `id: "codex"` memerlukan harness tersebut dan rute efektif yang kompatibel; runtime gagal secara tertutup jika salah satunya tidak tersedia atau jika eksekusi gagal.
- `id: "pi"` hanya diterima sebagai alias yang tidak digunakan lagi untuk `openclaw` guna mempertahankan konfigurasi yang telah dirilis dari v2026.5.22 dan versi sebelumnya. Konfigurasi baru harus menggunakan `openclaw`.
- Urutan prioritas runtime adalah kebijakan model persis terlebih dahulu (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]`, atau `models.providers.<provider>.models[]`), lalu `agents.list[]` / `agents.defaults.models["provider/*"]`, kemudian kebijakan seluruh penyedia di `models.providers.<provider>.agentRuntime`.
- Kunci runtime untuk seluruh agen bersifat lama. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, pin runtime sesi, dan `OPENCLAW_AGENT_RUNTIME` diabaikan oleh pemilihan runtime. Jalankan `openclaw doctor --fix` untuk menghapus nilai usang.
- Rute resmi HTTPS OpenAI Responses/ChatGPT yang persis dan memenuhi syarat tanpa penggantian permintaan buatan pengguna dapat menggunakan harness Codex secara implisit. `agentRuntime.id: "codex"` penyedia/model menjadikan Codex persyaratan yang gagal secara tertutup, tetapi tidak membuat rute yang tidak kompatibel menjadi kompatibel.
- Untuk penerapan Claude CLI, utamakan `model: "anthropic/claude-opus-4-8"` beserta `agentRuntime.id: "claude-cli"` yang dicakup per model. Referensi lama `claude-cli/<model>` masih berfungsi untuk kompatibilitas, tetapi konfigurasi baru harus mempertahankan pemilihan penyedia/model dalam bentuk kanonis dan menempatkan backend eksekusi dalam kebijakan runtime penyedia/model.
- Ini hanya mengontrol eksekusi giliran agen teks. Pembuatan media, visi, PDF, musik, video, dan TTS tetap menggunakan pengaturan penyedia/model masing-masing.

**Singkatan alias bawaan** (hanya berlaku ketika model berada di `agents.defaults.models`):

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

Alias yang Anda konfigurasi selalu lebih diutamakan daripada nilai default.

Model Z.AI GLM-4.x secara otomatis mengaktifkan mode berpikir kecuali Anda menetapkan `--thinking off` atau mendefinisikan sendiri `agents.defaults.models["zai/<model>"].params.thinking`.
Model Z.AI mengaktifkan `tool_stream` secara default untuk streaming panggilan alat. Tetapkan `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Anthropic Claude Opus 4.8 mempertahankan mode berpikir nonaktif secara default di OpenClaw; ketika pemikiran adaptif diaktifkan secara eksplisit, nilai default upaya milik penyedia Anthropic adalah `high`. Model Claude 4.6 menggunakan `adaptive` secara default ketika tidak ada tingkat pemikiran eksplisit yang ditetapkan.

### `agents.defaults.cliBackends`

Backend CLI opsional untuk eksekusi fallback khusus teks (tanpa panggilan alat). Berguna sebagai cadangan ketika penyedia API gagal.

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
          // Atau gunakan systemPromptFileArg ketika CLI menerima flag berkas perintah.
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
- Penerusan gambar didukung ketika `imageArg` menerima jalur berkas.
- `reseedFromRawTranscriptWhenUncompacted: true` memungkinkan backend memulihkan sesi aman
  yang tidak berlaku dari bagian akhir transkrip mentah OpenClaw yang dibatasi sebelum
  ringkasan Compaction pertama tersedia. Perubahan profil autentikasi atau epoch kredensial
  tetap tidak pernah melakukan penyemaian ulang mentah.

### `agents.defaults.promptOverlays`

Lapisan prompt yang tidak bergantung pada penyedia dan diterapkan berdasarkan keluarga model pada permukaan prompt yang dirakit OpenClaw. Id model keluarga GPT-5 menerima kontrak perilaku bersama di seluruh rute OpenClaw/penyedia; `personality` hanya mengontrol lapisan gaya interaksi yang ramah. Rute app-server Codex native mempertahankan instruksi dasar/model milik Codex sebagai pengganti lapisan GPT-5 OpenClaw ini, dan OpenClaw menonaktifkan kepribadian bawaan Codex untuk utas native.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // ramah | aktif | nonaktif
        },
      },
    },
  },
}
```

- `"friendly"` (default) dan `"on"` mengaktifkan lapisan gaya interaksi yang ramah.
- `"off"` hanya menonaktifkan lapisan ramah; kontrak perilaku GPT-5 yang diberi tag tetap aktif.
- `plugins.entries.openai.config.personality` lama tetap dibaca ketika pengaturan bersama ini belum ditetapkan.

### `agents.defaults.heartbeat`

Eksekusi Heartbeat berkala.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m menonaktifkan
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false menghilangkan bagian Heartbeat dari prompt sistem
        lightContext: false, // default: false; true hanya mempertahankan HEARTBEAT.md dari berkas bootstrap ruang kerja
        isolatedSession: false, // default: false; true menjalankan setiap Heartbeat dalam sesi baru (tanpa riwayat percakapan)
        skipWhenBusy: false, // default: false; true juga menunggu jalur subagen/bersarang agen ini
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Baca HEARTBEAT.md jika ada...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: string durasi (ms/s/m/h). Default: `30m` (autentikasi kunci API) atau `1h` (autentikasi OAuth). Tetapkan ke `0m` untuk menonaktifkan.
- `includeSystemPromptSection`: ketika false, menghilangkan bagian Heartbeat dari prompt sistem dan melewati injeksi `HEARTBEAT.md` ke dalam konteks bootstrap. Default: `true`.
- `suppressToolErrorWarnings`: ketika true, menyembunyikan payload peringatan kesalahan alat selama eksekusi Heartbeat.
- `timeoutSeconds`: waktu maksimum dalam detik yang diizinkan untuk satu giliran agen Heartbeat sebelum dibatalkan. Biarkan tidak ditetapkan untuk menggunakan `agents.defaults.timeoutSeconds` jika ditetapkan; jika tidak, gunakan irama Heartbeat yang dibatasi maksimal 600 detik.
- `directPolicy`: kebijakan pengiriman langsung/DM. `allow` (default) mengizinkan pengiriman ke target langsung. `block` menyembunyikan pengiriman ke target langsung dan memancarkan `reason=dm-blocked`.
- `lightContext`: ketika true, eksekusi Heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari berkas bootstrap ruang kerja.
- `isolatedSession`: ketika true, setiap Heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasinya sama dengan Cron `sessionTarget: "isolated"`. Mengurangi biaya token per Heartbeat dari ~100K menjadi ~2-5K token.
- `skipWhenBusy`: ketika true, eksekusi Heartbeat ditunda pada jalur sibuk tambahan agen tersebut: pekerjaan subagen dengan kunci sesi miliknya sendiri atau perintah bersarang. Jalur Cron selalu menunda Heartbeat, bahkan tanpa flag ini.
- Per agen: tetapkan `agents.list[].heartbeat`. Ketika agen mana pun mendefinisikan `heartbeat`, **hanya agen tersebut** yang menjalankan Heartbeat.
- Heartbeat menjalankan giliran agen lengkap — interval yang lebih singkat menghabiskan lebih banyak token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id plugin penyedia Compaction yang terdaftar (opsional)
        thinkingLevel: "low", // penggantian pemikiran khusus Compaction yang opsional
        timeoutSeconds: 180,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Pertahankan ID penerapan, ID tiket, dan pasangan host:port secara persis.", // digunakan ketika identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // pemeriksaan tekanan perulangan alat opsional
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // ikut serta dalam injeksi ulang bagian AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // penggantian model khusus Compaction yang opsional
        truncateAfterCompaction: true, // rotasi ke JSONL penerus yang lebih kecil setelah Compaction
        maxActiveTranscriptBytes: "20mb", // pemicu Compaction lokal pra-pemeriksaan yang opsional
        notifyUser: true, // pemberitahuan saat Compaction dimulai/selesai dan ketika penurunan kualitas pengosongan memori terjadi (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // penggantian model khusus pengosongan memori yang opsional
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Sesi mendekati Compaction. Simpan memori yang persisten sekarang.",
          prompt: "Tulis catatan yang bertahan lama ke memory/YYYY-MM-DD.md; balas dengan token senyap persis NO_REPLY jika tidak ada yang perlu disimpan.",
        },
      },
    },
  },
}
```

- `mode`: `default` atau `safeguard` (peringkasan bertahap untuk riwayat panjang). Lihat [Compaction](/id/concepts/compaction).
- `provider`: id Plugin penyedia compaction yang terdaftar. Jika ditetapkan, `summarize()` milik penyedia akan dipanggil sebagai pengganti peringkasan LLM bawaan. Kembali menggunakan bawaan jika terjadi kegagalan. Menetapkan penyedia akan memaksa `mode: "safeguard"`. Lihat [Compaction](/id/concepts/compaction).
- `thinkingLevel`: tingkat pemikiran opsional yang hanya digunakan untuk ringkasan compaction OpenClaw tersemat (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max`, atau `ultra`). Nilai ini menggantikan tingkat pemikiran sesi saat ini dan dibatasi sesuai model/runtime compaction yang dipilih. Biarkan tidak ditetapkan untuk mewarisi tingkat sesi. Compaction app-server Codex native mengabaikan pengaturan ini karena permintaan compact native tidak memiliki penggantian tingkat pemikiran per operasi; OpenClaw mencatat peringatan saat pengaturan ini dikonfigurasi.
- `timeoutSeconds`: jumlah detik maksimum yang diizinkan untuk satu operasi compaction sebelum OpenClaw membatalkannya. Default: `180`.
- `keepRecentTokens`: anggaran titik potong agen untuk mempertahankan bagian akhir transkrip terbaru secara verbatim. `/compact` manual mematuhi nilai ini jika ditetapkan secara eksplisit; jika tidak, compaction manual merupakan titik pemeriksaan penuh.
- `recentTurnsPreserve`: jumlah giliran pengguna/asisten terbaru yang dipertahankan secara verbatim di luar peringkasan pengamanan. Default: `3`.
- `identifierPolicy`: `strict` (default), `off`, atau `custom`. `strict` menambahkan panduan bawaan untuk mempertahankan pengidentifikasi opak di awal selama peringkasan compaction.
- `identifierInstructions`: teks khusus opsional untuk mempertahankan pengidentifikasi yang digunakan saat `identifierPolicy=custom`.
- `qualityGuard`: pemeriksaan percobaan ulang saat keluaran ringkasan pengamanan berformat salah. Diaktifkan secara default dalam mode pengamanan; tetapkan `enabled: false` untuk melewati audit.
- `midTurnPrecheck`: pemeriksaan tekanan perulangan alat opsional. Saat `enabled: true`, OpenClaw memeriksa tekanan konteks setelah hasil alat ditambahkan dan sebelum panggilan model berikutnya. Jika konteks tidak lagi muat, OpenClaw membatalkan percobaan saat ini sebelum mengirimkan prompt dan menggunakan kembali jalur pemulihan prapemeriksaan yang ada untuk memangkas hasil alat atau melakukan compaction dan mencoba lagi. Berfungsi dengan mode compaction `default` maupun `safeguard`. Default: dinonaktifkan.
- `postIndexSync`: mode pengindeksan ulang memori sesi setelah compaction. Default: `"async"`. Gunakan `"await"` untuk kesegaran tertinggi, `"async"` untuk latensi compaction yang lebih rendah, atau `"off"` hanya jika sinkronisasi memori sesi ditangani di tempat lain.
- `postCompactionSections`: nama bagian H2/H3 AGENTS.md opsional untuk disisipkan kembali setelah compaction. Penyisipan ulang dinonaktifkan jika tidak ditetapkan atau ditetapkan ke `[]`. Menetapkan `["Session Startup", "Red Lines"]` secara eksplisit akan mengaktifkan pasangan tersebut dan mempertahankan fallback lama `Every Session`/`Safety`. Aktifkan ini hanya jika konteks tambahan tersebut sepadan dengan risiko menduplikasi panduan proyek yang sudah tercakup dalam ringkasan compaction.
- `model`: `provider/model-id` opsional atau alias tanpa awalan dari `agents.defaults.models` yang hanya digunakan untuk peringkasan compaction. Alias tanpa awalan diresolusikan sebelum pengiriman; ID model literal yang dikonfigurasi tetap diutamakan jika terjadi konflik. Gunakan ini jika sesi utama harus tetap menggunakan satu model, tetapi ringkasan compaction harus dijalankan pada model lain; jika tidak ditetapkan, compaction menggunakan model utama sesi.
- `truncateAfterCompaction`: merotasi transkrip sesi aktif setelah compaction agar giliran berikutnya hanya memuat ringkasan dan bagian akhir yang belum diringkas, sementara transkrip lengkap sebelumnya tetap diarsipkan. Mencegah pertumbuhan transkrip aktif tanpa batas dalam sesi yang berjalan lama. Default: `false`.
- `maxActiveTranscriptBytes`: ambang byte opsional (`number` atau string seperti `"20mb"`) yang memicu compaction lokal normal sebelum proses dijalankan ketika riwayat transkrip melampaui ambang tersebut. Memerlukan `truncateAfterCompaction` agar compaction yang berhasil dapat merotasi ke transkrip penerus yang lebih kecil. Dinonaktifkan jika tidak ditetapkan atau `0`.
- `notifyUser`: saat `true`, mengirimkan pemberitahuan singkat pemeliharaan konteks kepada pengguna: ketika compaction dimulai dan selesai (misalnya, "Memadatkan konteks..." dan "Compaction selesai"), serta ketika pengosongan memori pra-compaction telah kehabisan upaya sehingga balasan dilanjutkan dalam kondisi terdegradasi (misalnya, "Pemeliharaan memori gagal sementara; melanjutkan balasan Anda."). Dinonaktifkan secara default agar pemberitahuan ini tidak ditampilkan.
- `memoryFlush`: giliran agen senyap sebelum compaction otomatis untuk menyimpan memori persisten. Tetapkan `model` ke penyedia/model yang tepat seperti `ollama/qwen3:8b` jika giliran pemeliharaan ini harus tetap menggunakan model lokal; penggantian tersebut tidak mewarisi rantai fallback sesi aktif. `forceFlushTranscriptBytes` memaksa pengosongan ketika ukuran transkrip mencapai ambang, meskipun penghitung token sudah tidak mutakhir. Dilewati jika ruang kerja hanya-baca.

### `agents.defaults.contextPruning`

Memangkas **hasil alat lama** dari konteks dalam memori sebelum dikirim ke LLM. **Tidak** mengubah riwayat sesi pada disk. Dinonaktifkan secara default; tetapkan `mode: "cache-ttl"` untuk mengaktifkannya.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // nonaktif (default) | cache-ttl
      },
    },
  },
}
```

<Accordion title="Perilaku mode cache-ttl">

- `mode: "cache-ttl"` mengaktifkan proses pemangkasan.
- Pemangkasan terlebih dahulu memangkas secara ringan hasil alat yang terlalu besar, lalu menghapus sepenuhnya hasil alat yang lebih lama jika diperlukan.

**Pemangkasan ringan** mempertahankan bagian awal + akhir dan menyisipkan `...` di tengah.

**Penghapusan penuh** mengganti seluruh hasil alat dengan placeholder.

Catatan:

- Blok gambar tidak pernah dipangkas/dihapus.
- Rasio didasarkan pada karakter (perkiraan), bukan jumlah token yang tepat.
- Pesan asisten terbaru dipertahankan.

</Accordion>

Lihat [Pemangkasan Sesi](/id/concepts/session-pruning) untuk detail perilaku.

### Streaming blok

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (default) | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Saluran selain Telegram memerlukan `*.streaming.block.enabled: true` eksplisit untuk mengaktifkan balasan blok. QQ Bot merupakan pengecualian: QQ Bot tidak memiliki kunci `streaming.block` dan melakukan streaming balasan blok kecuali `channels.qqbot.streaming.mode` adalah `"off"`.
- Penggantian saluran: `channels.<channel>.streaming.block.coalesce` (serta varian per akun). Discord, Google Chat, Mattermost, MS Teams, Signal, dan Slack menggunakan default `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: batas potongan yang diutamakan (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: jeda acak di antara balasan blok. Default: `off`. `natural` = 800-2500ms. `custom` menggunakan `minMs`/`maxMs` (kembali menggunakan rentang alami untuk batas yang tidak ditetapkan). Penggantian per agen: `agents.list[].humanDelay`.

Lihat [Streaming](/id/concepts/streaming) untuk detail perilaku + pemotongan.

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

- Default: `instant` untuk percakapan langsung/sebutan, `message` untuk percakapan grup tanpa sebutan.
- Default `typingIntervalSeconds`: `6`.
- Penggantian per sesi: `session.typingMode`.

Lihat [Indikator Pengetikan](/id/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opsional untuk agen tersemat. Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
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
          gpus: "all",
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

Default yang ditampilkan di atas (gambar `off`/`docker`/`agent`/`none`/`bookworm-slim`/jaringan `none`/dan sebagainya) adalah default OpenClaw yang sebenarnya, bukan sekadar nilai ilustratif.

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
- `workspaceRoot`: root jarak jauh absolut yang digunakan untuk ruang kerja per cakupan (default: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: berkas lokal yang sudah ada dan diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: konten sebaris atau SecretRef yang diwujudkan OpenClaw menjadi berkas sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: pengaturan kebijakan kunci host OpenSSH (keduanya memiliki default `true`)

**Urutan prioritas autentikasi SSH:**

- `identityData` mengungguli `identityFile`
- `certificateData` mengungguli `certificateFile`
- `knownHostsData` mengungguli `knownHostsFile`
- Nilai `*Data` yang didukung SecretRef diselesaikan dari snapshot runtime rahasia aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- menginisialisasi ruang kerja jarak jauh satu kali setelah dibuat atau dibuat ulang
- kemudian mempertahankan ruang kerja SSH jarak jauh sebagai sumber kanonis
- merutekan `exec`, alat berkas, dan jalur media melalui SSH
- tidak menyinkronkan perubahan jarak jauh kembali ke host secara otomatis
- tidak mendukung kontainer peramban sandbox

**Akses ruang kerja:**

- `none`: ruang kerja sandbox per cakupan di bawah `~/.openclaw/sandboxes` (default)
- `ro`: ruang kerja sandbox di `/workspace`, ruang kerja agen dipasang hanya-baca di `/agent`
- `rw`: ruang kerja agen dipasang baca/tulis di `/workspace`

**Cakupan:**

- `session`: kontainer + ruang kerja per sesi
- `agent`: satu kontainer + ruang kerja per agen (default)
- `shared`: kontainer dan ruang kerja bersama (tanpa isolasi lintas sesi)

**Konfigurasi plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (default) | remote
          command: "openshell",
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

- `mirror`: inisialisasi jarak jauh dari lokal sebelum eksekusi, sinkronkan kembali setelah eksekusi; ruang kerja lokal tetap menjadi sumber kanonis
- `remote`: inisialisasi jarak jauh satu kali saat sandbox dibuat, lalu pertahankan ruang kerja jarak jauh sebagai sumber kanonis

Dalam mode `remote`, perubahan lokal host yang dibuat di luar OpenClaw tidak disinkronkan ke sandbox secara otomatis setelah langkah inisialisasi.
Transport menggunakan SSH ke sandbox OpenShell, tetapi plugin mengelola siklus hidup sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** dijalankan satu kali setelah kontainer dibuat (melalui `sh -lc`). Memerlukan akses keluar jaringan, root yang dapat ditulisi, dan pengguna root.

**Kontainer secara default menggunakan `network: "none"`** — atur ke `"bridge"` (atau jaringan bridge khusus) jika agen memerlukan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda secara eksplisit menetapkan
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (akses darurat).
Giliran app-server Codex dalam sandbox OpenClaw aktif menggunakan pengaturan akses keluar yang sama untuk akses jaringan mode kode native.

**Lampiran masuk** ditempatkan di `media/inbound/*` dalam ruang kerja aktif.

**`docker.binds`** memasang direktori host tambahan; bind global dan per agen digabungkan.

**Peramban sandbox** (`sandbox.browser.enabled`, default `false`): Chromium + CDP dalam kontainer. URL noVNC disisipkan ke prompt sistem. Tidak memerlukan `browser.enabled` dalam `openclaw.json`.
Akses pengamat noVNC menggunakan autentikasi VNC secara default dan OpenClaw menghasilkan URL token berumur pendek (alih-alih mengekspos kata sandi dalam URL bersama).

- `allowHostControl: false` (default) mencegah sesi sandbox menargetkan peramban host.
- `network` memiliki default `openclaw-sandbox-browser` (jaringan bridge khusus). Atur ke `bridge` hanya jika Anda secara eksplisit menginginkan konektivitas bridge global. `"host"` juga diblokir di sini.
- `cdpSourceRange` secara opsional membatasi akses masuk CDP di batas kontainer ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` memasang direktori host tambahan hanya ke kontainer peramban sandbox. Jika ditetapkan (termasuk `[]`), pengaturan ini menggantikan `docker.binds` untuk kontainer peramban.
- Chromium dalam kontainer peramban sandbox selalu diluncurkan dengan `--no-sandbox --disable-setuid-sandbox` (kontainer tidak memiliki primitif kernel yang diperlukan oleh sandbox bawaan Chrome); tidak ada opsi konfigurasi untuk ini.
- Default peluncuran ditentukan dalam `scripts/sandbox-browser-entrypoint.sh` dan disesuaikan untuk host kontainer:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu`, dan `--disable-software-rasterizer`
    diaktifkan secara default dan dapat dinonaktifkan dengan
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika penggunaan WebGL/3D memerlukannya.
  - `--disable-extensions` (diaktifkan secara default); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    mengaktifkan kembali ekstensi jika alur kerja Anda bergantung padanya.
  - `--renderer-process-limit=2` secara default; ubah dengan
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, atur `0` untuk menggunakan
    batas proses default Chromium.
  - `--headless=new` hanya ketika `headless` diaktifkan.
  - Default tersebut merupakan baseline citra kontainer; gunakan citra peramban khusus dengan
    entrypoint khusus untuk mengubah default kontainer.

</Accordion>

Sandbox peramban dan `sandbox.docker.binds` hanya tersedia di Docker.

Bangun citra (dari checkout sumber):

```bash
scripts/sandbox-setup.sh           # citra sandbox utama
scripts/sandbox-browser-setup.sh   # citra peramban opsional
```

Untuk instalasi npm tanpa checkout sumber, lihat [Sandboxing § Citra dan penyiapan](/id/gateway/sandboxing#images-and-setup) untuk perintah `docker build` sebaris.

### `agents.list` (penggantian per agen)

Gunakan `agents.list[].tts` untuk memberi agen penyedia TTS, suara, model,
gaya, atau mode TTS otomatisnya sendiri. Blok agen digabungkan secara mendalam di atas
`messages.tts` global, sehingga kredensial bersama dapat tetap berada di satu tempat sementara masing-masing
agen hanya mengganti bidang suara atau penyedia yang diperlukan. Penggantian agen aktif
berlaku untuk balasan lisan otomatis, `/tts audio`, `/tts status`, dan
alat agen `tts`. Lihat [Teks ke ucapan](/id/tools/tts#per-agent-voice-overrides)
untuk contoh penyedia dan urutan prioritas.

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
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // penggantian tingkat pemikiran per agen
        reasoningDefault: "on", // penggantian visibilitas penalaran per agen
        fastModeDefault: false, // penggantian mode cepat per agen
        params: { cacheRetention: "none" }, // mengganti params defaults.models yang cocok berdasarkan kunci
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // menggantikan agents.defaults.skills jika ditetapkan
        identity: {
          name: "Samantha",
          theme: "kungkang yang suka membantu",
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
            mode: "persistent", // persistent | oneshot
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
- `default`: jika beberapa ditetapkan, yang pertama berlaku (peringatan dicatat). Jika tidak ada yang ditetapkan, entri pertama dalam daftar menjadi default.
- `model`: bentuk string menetapkan model utama per agen secara ketat tanpa fallback model; bentuk objek `{ primary }` juga ketat kecuali Anda menambahkan `fallbacks`. Gunakan `{ primary, fallbacks: [...] }` untuk mengikutsertakan agen tersebut dalam fallback, atau `{ primary, fallbacks: [] }` untuk menyatakan perilaku ketat secara eksplisit. Tugas Cron yang hanya mengganti `primary` tetap mewarisi fallback default kecuali Anda menetapkan `fallbacks: []`.
- `utilityModel`: penggantian opsional per agen untuk tugas internal singkat seperti judul sesi dan utas yang dihasilkan. Melakukan fallback ke `agents.defaults.utilityModel`, lalu ke default model kecil yang dideklarasikan oleh penyedia sesi efektif. Judul dasbor mencoba ulang sekali dengan model sesi reguler efektif. String kosong melewati rute utilitas alternatif untuk agen ini tanpa menonaktifkan pembuatan judul dasbor.
- `params`: parameter aliran per agen yang digabungkan di atas entri model terpilih dalam `agents.defaults.models`. Gunakan ini untuk penggantian khusus agen seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `tts`: penggantian teks-ke-ucapan opsional per agen. Blok ini digabungkan secara mendalam di atas `messages.tts`, jadi simpan kredensial penyedia bersama dan kebijakan fallback di `messages.tts`, lalu tetapkan hanya nilai khusus persona seperti penyedia, suara, model, gaya, atau mode otomatis di sini.
- `skills`: daftar izin skill opsional per agen. Jika dihilangkan, agen mewarisi `agents.defaults.skills` jika ditetapkan; daftar eksplisit menggantikan default alih-alih menggabungkannya, dan `[]` berarti tanpa skill.
- `thinkingDefault`: tingkat pemikiran default opsional per agen (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mengganti `agents.defaults.thinkingDefault` untuk agen ini ketika tidak ada penggantian per pesan atau sesi yang ditetapkan. Profil penyedia/model terpilih mengontrol nilai yang valid; untuk Google Gemini, `adaptive` mempertahankan pemikiran dinamis yang dikelola penyedia (`thinkingLevel` dihilangkan pada Gemini 3/3.1, `thinkingBudget: -1` pada Gemini 2.5).
- `reasoningDefault`: visibilitas penalaran default opsional per agen (`on | off | stream`). Mengganti `agents.defaults.reasoningDefault` untuk agen ini ketika tidak ada penggantian penalaran per pesan atau sesi yang ditetapkan.
- `fastModeDefault`: default opsional per agen untuk mode cepat (`"auto" | true | false`). Berlaku ketika tidak ada penggantian mode cepat per pesan atau sesi yang ditetapkan.
- `models`: penggantian katalog model/runtime opsional per agen yang dikunci berdasarkan id `provider/model` lengkap. Gunakan `models["provider/model"].agentRuntime` untuk pengecualian runtime per agen.
- `runtime`: deskriptor runtime opsional per agen. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) ketika agen harus secara default menggunakan sesi harness ACP.
- `identity.avatar`: jalur relatif terhadap ruang kerja, URL `http(s)`, atau URI `data:`.
- File gambar `identity.avatar` lokal yang relatif terhadap ruang kerja dibatasi hingga 2 MB. URL `http(s)` dan URI `data:` tidak diperiksa terhadap batas ukuran file lokal.
- `identity` memperoleh default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: daftar izin id agen yang dikonfigurasi untuk target `sessions_spawn.agentId` eksplisit (`["*"]` = target mana pun yang dikonfigurasi; default: hanya agen yang sama). Sertakan id peminta ketika panggilan `agentId` yang menargetkan diri sendiri harus diizinkan. Entri usang yang konfigurasi agennya telah dihapus ditolak oleh `sessions_spawn` dan dihilangkan dari `agents_list`; jalankan `openclaw doctor --fix` untuk membersihkannya, atau tambahkan entri `agents.list[]` minimal jika target tersebut harus tetap dapat dibuat sambil mewarisi default.
- Pelindung pewarisan sandbox: jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: jika true, blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).
- `subagents.maxConcurrent`: jumlah maksimum eksekusi agen anak serentak di seluruh eksekusi subagen. Default: `8`.
- `subagents.maxChildrenPerAgent`: jumlah maksimum anak aktif yang dapat dibuat oleh satu sesi agen. Default: `5`.
- `subagents.maxSpawnDepth`: kedalaman maksimum bersarang untuk pembuatan subagen (`1`-`5`). Default: `1` (tanpa bersarang).
- `subagents.archiveAfterMinutes`: usia sebelum status subagen yang selesai diarsipkan. Default: `60`.

---

## Perutean multiagen

Jalankan beberapa agen terisolasi di dalam satu Gateway. Lihat [Multiagen](/id/concepts/multi-agent).

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

### Bidang pencocokan pengikatan

- `type` (opsional): `route` untuk perutean normal (jenis yang tidak ada secara default menjadi route), `acp` untuk pengikatan percakapan ACP persisten.
- `match.channel` (wajib)
- `match.accountId` (opsional; `*` = akun mana pun; dihilangkan = akun default)
- `match.peer` (opsional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opsional; khusus kanal)
- `acp` (opsional; hanya untuk `type: "acp"`): `{ mode, label, cwd, backend }`

**Urutan pencocokan deterministik:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tepat, tanpa rekan/guild/tim)
5. `match.accountId: "*"` (seluruh kanal)
6. Agen default

Dalam setiap tingkat, entri `bindings` pertama yang cocok akan berlaku.

Untuk entri `type: "acp"`, OpenClaw menyelesaikan berdasarkan identitas percakapan yang tepat (`match.channel` + akun + `match.peer.id`) dan tidak menggunakan urutan tingkat pengikatan rute di atas.

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

<Accordion title="Alat hanya-baca + ruang kerja">

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

Lihat [Sandbox & Alat Multiagen](/id/tools/multi-agent-sandbox-tools) untuk detail presedensi.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
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
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detail bidang sesi">

- **`scope`**: strategi pengelompokan sesi dasar untuk konteks obrolan grup.
  - `per-sender` (default): setiap pengirim mendapatkan sesi terisolasi dalam konteks saluran.
  - `global`: semua peserta dalam konteks saluran berbagi satu sesi (gunakan hanya jika konteks bersama memang dimaksudkan).
- **`dmScope`**: cara DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: isolasi berdasarkan id pengirim di seluruh saluran.
  - `per-channel-peer`: isolasi per saluran + pengirim (direkomendasikan untuk kotak masuk multi-pengguna).
  - `per-account-channel-peer`: isolasi per akun + saluran + pengirim (direkomendasikan untuk multi-akun).
- **`identityLinks`**: petakan id kanonis ke peer berprefiks penyedia untuk berbagi sesi lintas saluran. Perintah docking seperti `/dock_discord` menggunakan peta yang sama untuk mengalihkan rute balasan sesi aktif ke peer saluran tertaut lainnya; lihat [Docking saluran](/id/concepts/channel-docking).
- **`reset`**: kebijakan reset utama. `none` menonaktifkan reset otomatis dan merupakan default; sebagai gantinya, Compaction membatasi konteks aktif. `daily` mereset pada waktu lokal `atHour`; `idle` mereset setelah `idleMinutes`. Jika keduanya dikonfigurasi, yang kedaluwarsa lebih dahulu akan berlaku. `/new` dan `/reset` tetap tersedia dalam setiap mode. Kesegaran reset harian menggunakan `sessionStartedAt` baris sesi; kesegaran reset karena tidak aktif menggunakan `lastInteractionAt`. Penulisan peristiwa latar belakang/sistem seperti Heartbeat, pengaktifan Cron, notifikasi exec, dan pembukuan Gateway dapat memperbarui `updatedAt`, tetapi tidak menjaga sesi harian/tidak aktif tetap segar.
- **`resetByType`**: penggantian per jenis (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`resetByChannel`**: penggantian reset per saluran yang dikunci berdasarkan id penyedia/saluran. Jika saluran sesi memiliki entri yang cocok, entri tersebut sepenuhnya mengesampingkan `resetByType`/`reset` untuk sesi tersebut. Gunakan hanya jika satu saluran memerlukan perilaku reset yang berbeda dari kebijakan tingkat jenis.
- **`mainKey`**: bidang lama. Runtime selalu menggunakan `"main"` untuk kelompok obrolan langsung utama.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Penolakan pertama berlaku.
- **`maintenance`**: kontrol pembersihan + retensi penyimpanan sesi.
  - `mode`: `enforce` menerapkan pembersihan dan merupakan default; `warn` hanya mengeluarkan peringatan.
  - `pruneAfter`: batas usia untuk entri usang (default `30d`).
  - `maxEntries`: jumlah maksimum entri sesi SQLite (default `500`). Penulisan runtime melakukan pembersihan batch dengan buffer batas atas kecil untuk batas berukuran produksi; `openclaw sessions cleanup --enforce` langsung menerapkan batas tersebut.
  - Sesi pemeriksaan singkat proses model Gateway menggunakan retensi tetap `24h`, tetapi pembersihan dibatasi oleh tekanan: baris pemeriksaan proses model ketat yang usang hanya dihapus ketika tekanan pemeliharaan/batas entri sesi tercapai. Hanya kunci pemeriksaan eksplisit ketat yang cocok dengan `agent:*:explicit:model-run-<uuid>` yang memenuhi syarat; sesi langsung, grup, utas, Cron, hook, Heartbeat, ACP, dan subagen normal tidak mewarisi retensi 24h ini. Saat pembersihan proses model berjalan, pembersihan tersebut dijalankan sebelum pembersihan entri usang `pruneAfter` yang lebih luas dan batas `maxEntries`.
  - `rotateBytes` lama ditolak oleh skema saat ini; `openclaw doctor --fix` menghapusnya dari konfigurasi lama.
  - `resetArchiveRetention`: retensi berbasis usia untuk arsip transkrip yang direset/dihapus. Secara default, arsip tetap ada hingga penghapusan berdasarkan anggaran disk; tetapkan durasi untuk mengaktifkan penghapusan berdasarkan waktu nyata, atau `false` untuk menonaktifkannya secara eksplisit.
  - `maxDiskBytes`: anggaran disk direktori sesi opsional. Dalam mode `warn`, sistem mencatat peringatan; dalam mode `enforce`, sistem menghapus artefak/sesi terlama terlebih dahulu.
  - `highWaterBytes`: target opsional setelah pembersihan anggaran. Default-nya adalah `80%` dari `maxDiskBytes`.
- **`threadBindings`**: default global untuk fitur sesi yang terikat utas.
  - `enabled`: sakelar default utama (penyedia dapat menggantinya; Discord menggunakan `channels.discord.threadBindings.enabled`)
  - `idleHours`: penghentian fokus otomatis default setelah tidak aktif dalam jam (`0` menonaktifkan; penyedia dapat menggantinya)
  - `maxAgeHours`: usia maksimum mutlak default dalam jam (`0` menonaktifkan; penyedia dapat menggantinya)
  - `spawnSessions`: gerbang default untuk membuat sesi kerja yang terikat utas dari `sessions_spawn` dan pemunculan utas ACP. Default-nya adalah `true` ketika pengikatan utas diaktifkan; penyedia/akun dapat menggantinya.
  - `defaultSpawnContext`: konteks subagen native default untuk pemunculan yang terikat utas (`"fork"` atau `"isolated"`). Default-nya adalah `"fork"`.

</Accordion>

---

## Pesan

```json5
{
  messages: {
    responsePrefix: "🦞", // atau "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (default) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (default)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

Penggantian per saluran/akun: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik berlaku): akun → saluran → global. `""` menonaktifkan dan menghentikan kaskade. `"auto"` menghasilkan `[{identity.name}]`.

**Variabel templat:**

| Variabel          | Deskripsi              | Contoh                      |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nama model singkat     | `claude-opus-4-6`           |
| `{modelFull}`     | Pengidentifikasi model lengkap | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama penyedia          | `anthropic`                 |
| `{thinkingLevel}` | Tingkat pemikiran saat ini | `high`, `low`, `off`        |
| `{identity.name}` | Nama identitas agen    | (sama dengan `"auto"`)          |

Variabel tidak peka huruf besar-kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi pengakuan

- Default-nya adalah `identity.emoji` agen aktif, atau `"👀"` jika tidak tersedia. Tetapkan `""` untuk menonaktifkan.
- Penggantian per saluran: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: akun → saluran → `messages.ackReaction` → fallback identitas.
- Cakupan: `group-mentions` (default), `group-all`, `direct`, `all`, atau `off`/`none` (menonaktifkan reaksi pengakuan sepenuhnya).
- `removeAckAfterReply`: menghapus reaksi pengakuan setelah balasan pada saluran yang mendukung reaksi seperti Slack, Discord, Signal, Telegram, WhatsApp, dan iMessage.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status siklus hidup pada Slack, Discord, Signal, Telegram, dan WhatsApp.
  Pada Discord, jika tidak ditetapkan, reaksi status tetap aktif saat reaksi pengakuan aktif.
  Pada Slack, Signal, Telegram, dan WhatsApp, tetapkan secara eksplisit ke `true` untuk mengaktifkan reaksi status siklus hidup.
  Secara default, Slack menggunakan status utas asisten native dan pesan pemuatan bergilir untuk progres, sementara reaksi pengakuan yang dikonfigurasi tetap statis.
- `messages.statusReactions.emojis`: mengganti kunci emoji siklus hidup:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft`, dan `stallHard`.
  Telegram hanya mengizinkan kumpulan reaksi tetap, sehingga emoji terkonfigurasi yang tidak didukung menggunakan fallback
  ke varian status terdekat yang didukung untuk obrolan tersebut.

### Antrean

- `mode`: strategi antrean untuk pesan masuk yang tiba saat proses sesi aktif. Default: `"steer"`.
  - `steer`: menyisipkan prompt baru ke dalam proses aktif.
  - `followup`: menjalankan prompt baru setelah proses aktif selesai.
  - `collect`: mengelompokkan pesan yang kompatibel dan menjalankannya bersama nanti.
  - `interrupt`: membatalkan proses aktif sebelum memulai prompt terbaru.
- `debounceMs`: penundaan sebelum mengirim pesan yang diantrekan/diarahkan. Default: `500`.
- `cap`: jumlah maksimum pesan yang diantrekan sebelum kebijakan penghapusan berlaku. Default: `20`.
- `drop`: strategi ketika batas terlampaui. `"summarize"` (default) menghapus entri terlama tetapi mempertahankan ringkasan ringkas; `"old"` menghapus yang terlama tanpa ringkasan; `"new"` menolak item terbaru.
- `byChannel`: penggantian `mode` per saluran yang dikunci berdasarkan id penyedia.
- `debounceMsByChannel`: penggantian `debounceMs` per saluran yang dikunci berdasarkan id penyedia.

### Debounce masuk

Mengelompokkan pesan teks saja yang dikirim beruntun dari pengirim yang sama menjadi satu giliran agen. Media/lampiran langsung memicu pengiriman. Perintah kontrol melewati debounce. Default `debounceMs`: `2000`.

### Kunci pesan lainnya

- `channels.whatsapp.messagePrefix`: prefiks khusus WhatsApp yang ditambahkan di depan pesan pengguna masuk sebelum mencapai runtime agen.
- `messages.visibleReplies`: mengontrol balasan sumber yang terlihat di percakapan langsung, grup, dan saluran (`"message_tool"` memerlukan `message(action=send)` untuk keluaran yang terlihat; `"automatic"` memposting balasan normal seperti sebelumnya).
- `messages.usageTemplate` / `messages.responseUsage`: templat footer `/usage` khusus dan mode penggunaan default per balasan (`off | tokens | full`, beserta alias lama `on` untuk `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: pemicu penyebutan pesan grup dan pengaturan ukuran jendela riwayat.
- `messages.suppressToolErrors`: ketika `true`, menyembunyikan peringatan kesalahan alat `⚠️` yang ditampilkan kepada pengguna (agen tetap melihat kesalahan dalam konteks dan dapat mencoba lagi). Default: `false`.

### TTS (teks ke ucapan)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (default) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` mengontrol mode TTS otomatis default: `off`, `always`, `inbound`, atau `tagged`. `/tts on|off` dapat mengganti preferensi lokal, dan `/tts status` menampilkan status yang berlaku.
- `summaryModel` menggantikan `agents.defaults.model.primary` untuk ringkasan otomatis.
- `modelOverrides` diaktifkan secara default (`enabled !== false`); `modelOverrides.allowProvider` harus diaktifkan secara eksplisit.
- Kunci API menggunakan `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY` sebagai fallback.
- Penyedia ucapan bawaan dimiliki oleh plugin. Jika `plugins.allow` ditetapkan, sertakan setiap plugin penyedia TTS yang ingin digunakan, misalnya `microsoft` untuk Edge TTS. ID penyedia lama `edge` diterima sebagai alias untuk `microsoft`.
- `providers.openai.baseUrl` menggantikan endpoint TTS OpenAI. Urutan resolusinya adalah konfigurasi, lalu `OPENAI_TTS_BASE_URL`, kemudian `https://api.openai.com/v1`.
- Ketika `providers.openai.baseUrl` mengarah ke endpoint non-OpenAI, OpenClaw memperlakukannya sebagai server TTS yang kompatibel dengan OpenAI dan melonggarkan validasi model/suara.

---

## Percakapan

Default untuk mode Percakapan (macOS/iOS/Android dan Control UI browser).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Berbicaralah dengan hangat dan berikan jawaban singkat.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` harus cocok dengan sebuah kunci dalam `talk.providers` ketika beberapa penyedia Percakapan dikonfigurasi.
- Kunci datar Percakapan lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan ke dalam `talk.providers.<provider>`.
- ID suara menggunakan `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID` sebagai fallback (perilaku klien Percakapan macOS).
- `providers.*.apiKey` menerima string teks biasa atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku ketika tidak ada kunci API Percakapan yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan direktif Percakapan menggunakan nama yang mudah dipahami.
- `providers.mlx.modelId` memilih repositori Hugging Face yang digunakan oleh pembantu MLX lokal macOS. Jika dihilangkan, macOS menggunakan `mlx-community/Soprano-80M-bf16`.
- Pemutaran MLX macOS dijalankan melalui pembantu bawaan `openclaw-mlx-tts` jika tersedia, atau executable pada `PATH`; `OPENCLAW_MLX_TTS_BIN` menggantikan jalur pembantu untuk pengembangan.
- `consultThinkingLevel` mengontrol tingkat pemikiran untuk proses lengkap agen OpenClaw di balik panggilan `openclaw_agent_consult` waktu nyata Percakapan Control UI. Biarkan tidak ditetapkan untuk mempertahankan perilaku sesi/model normal.
- `consultFastMode` menetapkan penggantian mode cepat satu kali untuk konsultasi waktu nyata Percakapan Control UI tanpa mengubah pengaturan mode cepat normal sesi.
- `speechLocale` menetapkan ID lokal BCP 47 yang digunakan oleh pengenalan ucapan Percakapan Android, iOS, dan macOS. Android juga menggunakan komponen bahasanya untuk memandu transkripsi input waktu nyata. Biarkan tidak ditetapkan untuk menggunakan default perangkat.
- `silenceTimeoutMs` mengontrol berapa lama mode Percakapan menunggu setelah pengguna diam sebelum mengirim transkrip. Jika tidak ditetapkan, jendela jeda default platform tetap digunakan (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` menambahkan instruksi sistem yang ditujukan kepada penyedia ke prompt waktu nyata bawaan OpenClaw, sehingga gaya suara dapat dikonfigurasi tanpa kehilangan panduan default `openclaw_agent_consult`.
- `realtime.vadThreshold` menetapkan ambang aktivitas suara penyedia dari `0` (paling sensitif) hingga `1` (paling tidak sensitif). Jika tidak ditetapkan, default penyedia tetap digunakan.
- `realtime.silenceDurationMs` menetapkan jendela keheningan berupa bilangan bulat positif sebelum penyedia menetapkan giliran pengguna waktu nyata. Jika tidak ditetapkan, default penyedia tetap digunakan.
- `realtime.prefixPaddingMs` menetapkan jumlah audio berupa bilangan bulat nonnegatif yang dipertahankan sebelum ucapan terdeteksi dimulai. Jika tidak ditetapkan, default penyedia tetap digunakan.
- `realtime.reasoningEffort` menetapkan tingkat penalaran khusus penyedia untuk sesi waktu nyata. Jika tidak ditetapkan, default penyedia tetap digunakan.
- `realtime.consultRouting`: `"provider-direct"` (default) mempertahankan balasan langsung penyedia ketika penyedia waktu nyata menghasilkan transkrip akhir pengguna tanpa `openclaw_agent_consult`. `"force-agent-consult"` mengarahkan permintaan yang telah difinalisasi melalui OpenClaw.

---

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference) — semua kunci konfigurasi lainnya
- [Konfigurasi](/id/gateway/configuration) — tugas umum dan penyiapan cepat
- [Contoh konfigurasi](/id/gateway/configuration-examples)

---
read_when:
    - Menjelaskan penggunaan token, biaya, atau jendela konteks
    - Men-debug pertumbuhan konteks atau perilaku Compaction
summary: Cara OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan token dan biaya
x-i18n:
    generated_at: "2026-07-01T20:37:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik untuk model, tetapi sebagian besar
model bergaya OpenAI rata-rata sekitar ~4 karakter per token untuk teks bahasa Inggris.

## Cara prompt sistem dibuat

OpenClaw merakit prompt sistemnya sendiri pada setiap run. Prompt ini mencakup:

- Daftar tool + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai kebutuhan dengan `read`).
  Giliran Codex native menerima blok skills ringkas sebagai instruksi developer
  kolaborasi yang dicakup per giliran; harness lain menerimanya di permukaan prompt
  normal. Ini dibatasi oleh `skills.limits.maxSkillsPromptChars`, dengan
  override opsional per agen di `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruksi pembaruan mandiri
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, plus `MEMORY.md` jika ada). Giliran Codex native tidak menempelkan `MEMORY.md` mentah dari workspace agen yang dikonfigurasi saat tool memori tersedia untuk workspace tersebut; giliran itu menyertakan pointer memori kecil dalam instruksi developer kolaborasi yang dicakup per giliran dan menggunakan tool memori sesuai kebutuhan. Jika tool dinonaktifkan, pencarian memori tidak tersedia, atau workspace aktif berbeda dari workspace memori agen, `MEMORY.md` menggunakan jalur konteks giliran berbatas normal. Root `memory.md` huruf kecil tidak disuntikkan; itu adalah input perbaikan lama untuk `openclaw doctor --fix` saat dipasangkan dengan `MEMORY.md`. File besar yang disuntikkan dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 20000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 60000). File harian `memory/*.md` bukan bagian dari prompt bootstrap normal; file tersebut tetap tersedia sesuai kebutuhan melalui tool memori pada giliran biasa, tetapi run model reset/startup dapat menambahkan blok konteks startup sekali pakai dengan memori harian terbaru untuk giliran pertama itu. Perintah chat polos `/new` dan `/reset` diakui tanpa memanggil model. Prelude startup dikendalikan oleh `agents.defaults.startupContext`. Kutipan AGENTS.md pasca-Compaction terpisah dan memerlukan opt-in eksplisit `agents.defaults.compaction.postCompactionSections`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku Heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat uraian lengkap di [Prompt Sistem](/id/concepts/system-prompt).

Saat mendokumentasikan kredensial atau cuplikan autentikasi, gunakan
[Konvensi Placeholder Rahasia](/id/reference/secret-placeholder-conventions) untuk
menghindari false positive secret-scanner pada perubahan khusus dokumentasi.

## Apa saja yang dihitung dalam jendela konteks

Semua yang diterima model dihitung terhadap batas konteks:

- Prompt sistem (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Panggilan tool dan hasil tool
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan Compaction dan artefak pruning
- Wrapper penyedia atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Beberapa permukaan yang berat runtime memiliki batas eksplisitnya sendiri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Override per agen berada di bawah `agents.list[].contextLimits`. Knob ini adalah
untuk kutipan runtime berbatas dan blok yang disuntikkan milik runtime. Knob ini
terpisah dari batas bootstrap, batas konteks startup, dan batas prompt skills.

`toolResultMaxChars` adalah plafon lanjutan (hingga `1000000` karakter). Saat tidak disetel, OpenClaw memilih
batas hasil tool live dari jendela konteks model efektif: `16000` karakter
di bawah 100K token, `32000` karakter pada 100K+ token, dan `64000` karakter pada 200K+
token, tetap dibatasi oleh guard porsi konteks runtime.

Untuk gambar, OpenClaw menurunkan skala payload gambar transkrip/tool sebelum panggilan penyedia.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikannya:

- Nilai lebih rendah biasanya mengurangi penggunaan token visi dan ukuran payload.
- Nilai lebih tinggi mempertahankan lebih banyak detail visual untuk screenshot yang berat OCR/UI.

Untuk uraian praktis (per file yang disuntikkan, tool, skills, dan ukuran prompt sistem), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini di chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **estimasi biaya** saat harga lokal
  dikonfigurasi untuk model aktif.
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Bertahan per sesi (disimpan sebagai `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) — menghapus override sesi
    sehingga sesi kembali mewarisi default yang dikonfigurasi.
  - `/usage tokens` menampilkan detail token/cache giliran.
  - `/usage full` menampilkan detail model/konteks/biaya yang ringkas; estimasi biaya muncul
    hanya saat OpenClaw memiliki metadata penggunaan dan harga lokal untuk model aktif.
    Layout `messages.usageTemplate` kustom dapat menyertakan field token/cache.
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lain:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota penyedia yang dinormalisasi (`X% left`, bukan biaya per respons).
  Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Permukaan penggunaan menormalisasi alias field native penyedia yang umum sebelum ditampilkan.
Untuk traffic Responses keluarga OpenAI, ini mencakup `input_tokens` /
`output_tokens` dan `prompt_tokens` / `completion_tokens`, sehingga nama field
khusus transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan Gemini CLI juga dinormalisasi: parser default `stream-json` membaca
event `message` asisten, dan `stats.cached` dipetakan ke `cacheRead` dengan
`stats.input_tokens - stats.cached` digunakan saat CLI menghilangkan field
`stats.input` eksplisit. Override JSON lama tetap membaca teks balasan dari
`response`.
Untuk traffic Responses native keluarga OpenAI, alias penggunaan WebSocket/SSE
dinormalisasi dengan cara yang sama, dan total fallback ke input + output yang dinormalisasi saat
`total_tokens` hilang atau `0`.
Saat snapshot sesi saat ini jarang, `/status` dan `session_status` juga dapat
memulihkan penghitung token/cache dan label model runtime aktif dari log penggunaan
transkrip terbaru. Nilai live bukan nol yang ada tetap
diprioritaskan atas nilai fallback transkrip, dan total transkrip yang lebih besar
berorientasi prompt dapat menang saat total tersimpan hilang atau lebih kecil.
Autentikasi penggunaan untuk jendela kuota penyedia berasal dari hook khusus penyedia saat
tersedia; jika tidak, OpenClaw fallback ke kredensial OAuth/API-key yang cocok
dari profil auth, env, atau config.
Entri transkrip asisten mempertahankan bentuk penggunaan ternormalisasi yang sama, termasuk
`usage.cost` saat model aktif memiliki harga yang dikonfigurasi dan penyedia
mengembalikan metadata penggunaan. Ini memberi `/usage cost` dan status sesi
berbasis transkrip sumber yang stabil bahkan setelah status runtime live hilang.

OpenClaw menjaga akuntansi penggunaan penyedia terpisah dari snapshot konteks
saat ini. `usage.total` penyedia dapat mencakup input yang di-cache, output, dan beberapa
panggilan model tool-loop, sehingga berguna untuk biaya dan telemetri tetapi dapat melebih-lebihkan
jendela konteks live. Tampilan konteks dan diagnostik menggunakan snapshot prompt terbaru
(`promptTokens`, atau panggilan model terakhir saat tidak ada snapshot prompt
tersedia) untuk `context.used`.

## Estimasi biaya (saat ditampilkan)

Biaya diestimasi dari config harga model Anda:

```
models.providers.<provider>.models[].cost
```

Ini adalah **USD per 1M token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga hilang, `/usage full` menghilangkan biaya; gunakan `/usage tokens`
atau `messages.usageTemplate` kustom saat Anda membutuhkan detail token/cache di setiap
balasan. Tampilan biaya tidak terbatas pada auth API-key: penyedia non-API-key seperti
`aws-sdk` dapat menampilkan estimasi biaya saat entri model yang dikonfigurasi mencakup
harga lokal dan penyedia mengembalikan metadata penggunaan.

Setelah sidecar dan channel mencapai jalur siap Gateway, OpenClaw memulai
bootstrap harga latar belakang opsional untuk ref model yang dikonfigurasi yang belum
memiliki harga lokal. Bootstrap itu mengambil katalog harga OpenRouter dan LiteLLM
jarak jauh. Setel `models.pricing.enabled: false` untuk melewati pengambilan katalog itu
pada jaringan offline atau terbatas; entri eksplisit
`models.providers.*.models[].cost` tetap menggerakkan estimasi biaya lokal.

## Cache TTL dan dampak pruning

Caching prompt penyedia hanya berlaku dalam jendela cache TTL. OpenClaw dapat
secara opsional menjalankan **pruning cache-ttl**: ia memangkas sesi setelah cache TTL
kedaluwarsa, lalu mereset jendela cache sehingga permintaan berikutnya dapat menggunakan ulang
konteks yang baru di-cache alih-alih melakukan cache ulang untuk seluruh riwayat. Ini menjaga biaya
penulisan cache lebih rendah saat sesi idle melewati TTL.

Konfigurasikan di [konfigurasi Gateway](/id/gateway/configuration) dan lihat
detail perilakunya di [Pruning sesi](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** melewati jeda idle. Jika cache TTL model Anda
adalah `1h`, menyetel interval heartbeat sedikit di bawah itu (misalnya, `55m`) dapat menghindari
cache ulang prompt penuh, sehingga mengurangi biaya penulisan cache.

Dalam setup multi-agen, Anda dapat mempertahankan satu config model bersama dan menyesuaikan perilaku cache
per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap knob per knob, lihat [Caching Prompt](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token input,
sementara penulisan cache ditagih dengan pengali lebih tinggi. Lihat harga
caching prompt Anthropic untuk tarif terbaru dan pengali TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: menjaga cache 1j tetap hangat dengan heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Contoh: traffic campuran dengan strategi cache per agen

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` digabungkan di atas `params` model yang dipilih, sehingga Anda dapat
hanya meng-override `cacheRetention` dan mewarisi default model lain tanpa perubahan.

### Konteks 1M Anthropic

OpenClaw mengukur model Claude 4.x yang mampu GA seperti Opus 4.8, Opus 4.7, Opus 4.6, dan
Sonnet 4.6 dengan jendela konteks 1M Anthropic. Anda tidak memerlukan
`params.context1m: true` untuk model tersebut.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Config lama dapat mempertahankan `context1m: true`, tetapi OpenClaw tidak lagi mengirim
header beta Anthropic `context-1m-2025-08-07` yang telah pensiun untuk setelan ini dan
tidak memperluas model Claude lama yang tidak didukung menjadi 1M.

Persyaratan: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic merespons dengan error batas laju dari sisi penyedia untuk permintaan tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/langganan (`sk-ant-oat-*`),
OpenClaw mempertahankan header beta Anthropic yang diwajibkan OAuth sekaligus menghapus
beta `context-1m-*` yang telah pensiun jika masih ada di config lama.

## Tips untuk mengurangi tekanan token

- Gunakan `/compact` untuk meringkas sesi panjang.
- Pangkas keluaran tool yang besar dalam alur kerja Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang banyak menggunakan screenshot.
- Jaga deskripsi skill tetap singkat (daftar skill disisipkan ke dalam prompt).
- Utamakan model yang lebih kecil untuk pekerjaan eksploratif yang panjang.

Lihat [Skills](/id/tools/skills) untuk rumus overhead daftar skill yang tepat.

## Terkait

- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
- [Caching prompt](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)

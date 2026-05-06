---
read_when:
    - Menjelaskan penggunaan token, biaya, atau jendela konteks
    - Men-debug pertumbuhan konteks atau perilaku Compaction
summary: Cara OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan token dan biaya
x-i18n:
    generated_at: "2026-05-06T09:27:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik per model, tetapi sebagian besar model bergaya OpenAI rata-rata memiliki ~4 karakter per token untuk teks bahasa Inggris.

## Cara prompt sistem dibuat

OpenClaw merakit prompt sistemnya sendiri pada setiap run. Prompt ini mencakup:

- Daftar alat + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai kebutuhan dengan `read`).
  Blok Skills ringkas dibatasi oleh `skills.limits.maxSkillsPromptChars`,
  dengan override opsional per agen di
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruksi pembaruan mandiri
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, plus `MEMORY.md` saat ada). Root `memory.md` huruf kecil tidak diinjeksi; itu adalah input perbaikan legacy untuk `openclaw doctor --fix` saat dipasangkan dengan `MEMORY.md`. File besar dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 12000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 60000). File harian `memory/*.md` bukan bagian dari prompt bootstrap normal; file tersebut tetap tersedia sesuai kebutuhan melalui alat memori pada giliran biasa, tetapi run model reset/startup dapat menambahkan blok konteks-startup sekali pakai dengan memori harian terbaru untuk giliran pertama tersebut. Perintah chat polos `/new` dan `/reset` diakui tanpa memanggil model. Prelude startup dikontrol oleh `agents.defaults.startupContext`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku Heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat rincian lengkapnya di [Prompt Sistem](/id/concepts/system-prompt).

## Apa yang dihitung dalam jendela konteks

Semua yang diterima model dihitung terhadap batas konteks:

- Prompt sistem (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Panggilan alat dan hasil alat
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan Compaction dan artefak pemangkasan
- Wrapper penyedia atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Beberapa permukaan yang berat saat runtime memiliki batas eksplisitnya sendiri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Override per agen berada di bawah `agents.list[].contextLimits`. Knob ini ditujukan untuk kutipan runtime yang dibatasi dan blok injeksi yang dimiliki runtime. Knob ini terpisah dari batas bootstrap, batas konteks-startup, dan batas prompt Skills.

Untuk gambar, OpenClaw menurunkan skala payload gambar transkrip/alat sebelum panggilan penyedia.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikannya:

- Nilai yang lebih rendah biasanya mengurangi penggunaan token visi dan ukuran payload.
- Nilai yang lebih tinggi mempertahankan lebih banyak detail visual untuk screenshot yang berat OCR/UI.

Untuk rincian praktis (per file yang diinjeksi, alat, Skills, dan ukuran prompt sistem), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini di chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **estimasi biaya** (hanya API key).
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Bertahan per sesi (disimpan sebagai `responseUsage`).
  - Auth OAuth **menyembunyikan biaya** (hanya token).
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lain:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota penyedia yang dinormalisasi (`X% left`, bukan biaya per respons).
  Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Permukaan penggunaan menormalisasi alias field native penyedia yang umum sebelum ditampilkan.
Untuk trafik Responses keluarga OpenAI, ini mencakup `input_tokens` /
`output_tokens` dan `prompt_tokens` / `completion_tokens`, sehingga nama field yang spesifik transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan JSON Gemini CLI juga dinormalisasi: teks balasan berasal dari `response`, dan
`stats.cached` dipetakan ke `cacheRead` dengan `stats.input_tokens - stats.cached`
digunakan saat CLI tidak menyertakan field `stats.input` eksplisit.
Untuk trafik Responses native keluarga OpenAI, alias penggunaan WebSocket/SSE dinormalisasi dengan cara yang sama, dan total melakukan fallback ke input + output yang dinormalisasi saat
`total_tokens` hilang atau `0`.
Saat snapshot sesi saat ini jarang, `/status` dan `session_status` juga dapat memulihkan counter token/cache dan label model runtime aktif dari log penggunaan transkrip terbaru. Nilai live nonzero yang ada tetap lebih diutamakan daripada nilai fallback transkrip, dan total transkrip yang lebih besar dan berorientasi prompt dapat menang saat total tersimpan hilang atau lebih kecil.
Auth penggunaan untuk jendela kuota penyedia berasal dari hook spesifik penyedia saat tersedia; jika tidak, OpenClaw melakukan fallback ke kredensial OAuth/API-key yang cocok dari profil auth, env, atau config.
Entri transkrip asisten menyimpan bentuk penggunaan ternormalisasi yang sama, termasuk
`usage.cost` saat model aktif memiliki harga yang dikonfigurasi dan penyedia mengembalikan metadata penggunaan. Ini memberi `/usage cost` dan status sesi berbasis transkrip sumber yang stabil bahkan setelah state runtime live hilang.

OpenClaw menjaga akuntansi penggunaan penyedia tetap terpisah dari snapshot konteks saat ini. `usage.total` penyedia dapat mencakup input cache, output, dan beberapa panggilan model tool-loop, sehingga berguna untuk biaya dan telemetri tetapi dapat melebih-lebihkan jendela konteks live. Tampilan konteks dan diagnostik menggunakan snapshot prompt terbaru (`promptTokens`, atau panggilan model terakhir saat tidak ada snapshot prompt yang tersedia) untuk `context.used`.

## Estimasi biaya (saat ditampilkan)

Biaya diestimasi dari config harga model Anda:

```
models.providers.<provider>.models[].cost
```

Ini adalah **USD per 1 juta token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga hilang, OpenClaw hanya menampilkan token. Token OAuth tidak pernah menampilkan biaya dolar.

Setelah sidecar dan kanal mencapai jalur siap Gateway, OpenClaw memulai bootstrap harga latar belakang opsional untuk referensi model yang dikonfigurasi tetapi belum memiliki harga lokal. Bootstrap tersebut mengambil katalog harga remote OpenRouter dan LiteLLM. Setel `models.pricing.enabled: false` untuk melewati pengambilan katalog tersebut pada jaringan offline atau terbatas; entri eksplisit
`models.providers.*.models[].cost` tetap menggerakkan estimasi biaya lokal.

## Dampak TTL cache dan pemangkasan

Caching prompt penyedia hanya berlaku dalam jendela TTL cache. OpenClaw dapat secara opsional menjalankan **pemangkasan cache-ttl**: OpenClaw memangkas sesi setelah TTL cache kedaluwarsa, lalu mereset jendela cache sehingga permintaan berikutnya dapat menggunakan ulang konteks yang baru di-cache alih-alih melakukan caching ulang seluruh riwayat. Ini menjaga biaya penulisan cache lebih rendah saat sesi idle melewati TTL.

Konfigurasikan di [konfigurasi Gateway](/id/gateway/configuration) dan lihat detail perilakunya di [Pemangkasan sesi](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** di antara jeda idle. Jika TTL cache model Anda adalah `1h`, menyetel interval Heartbeat sedikit di bawah itu (misalnya, `55m`) dapat menghindari caching ulang prompt penuh, sehingga mengurangi biaya penulisan cache.

Dalam setup multi-agen, Anda dapat mempertahankan satu config model bersama dan menyesuaikan perilaku cache per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap knob demi knob, lihat [Caching Prompt](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token input, sementara penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga caching prompt Anthropic untuk tarif dan pengali TTL terbaru:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: menjaga cache 1 jam tetap hangat dengan Heartbeat

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

### Contoh: trafik campuran dengan strategi cache per agen

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

`agents.list[].params` digabungkan di atas `params` milik model yang dipilih, sehingga Anda dapat meng-override hanya `cacheRetention` dan mewarisi default model lain tanpa perubahan.

### Contoh: mengaktifkan header beta konteks 1 juta Anthropic

Jendela konteks 1 juta Anthropic saat ini dibatasi beta. OpenClaw dapat menginjeksi nilai
`anthropic-beta` yang diperlukan saat Anda mengaktifkan `context1m` pada model Opus
atau Sonnet yang didukung.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Ini dipetakan ke header beta `context-1m-2025-08-07` milik Anthropic.

Ini hanya berlaku saat `context1m: true` disetel pada entri model tersebut.

Persyaratan: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic merespons dengan error batas laju sisi penyedia untuk permintaan tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/subscription (`sk-ant-oat-*`),
OpenClaw melewati header beta `context-1m-*` karena Anthropic saat ini menolak kombinasi tersebut dengan HTTP 401.

## Tips untuk mengurangi tekanan token

- Gunakan `/compact` untuk meringkas sesi panjang.
- Pangkas output alat yang besar dalam workflow Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang berat screenshot.
- Jaga deskripsi Skills tetap singkat (daftar Skills diinjeksi ke prompt).
- Pilih model yang lebih kecil untuk pekerjaan eksploratif yang verbose.

Lihat [Skills](/id/tools/skills) untuk rumus overhead daftar Skills yang tepat.

## Terkait

- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
- [Caching prompt](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)

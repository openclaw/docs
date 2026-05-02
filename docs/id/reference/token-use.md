---
read_when:
    - Menjelaskan penggunaan token, biaya, atau jendela konteks
    - Men-debug pertumbuhan konteks atau perilaku Compaction
summary: Cara OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan token dan biaya
x-i18n:
    generated_at: "2026-05-02T21:00:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Penggunaan token & biaya

OpenClaw melacak **token**, bukan karakter. Token bersifat khusus untuk tiap model, tetapi sebagian besar model bergaya OpenAI rata-rata menggunakan ~4 karakter per token untuk teks bahasa Inggris.

## Cara prompt sistem dibuat

OpenClaw merangkai prompt sistemnya sendiri pada setiap eksekusi. Prompt ini mencakup:

- Daftar alat + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai kebutuhan dengan `read`).
  Blok skills ringkas dibatasi oleh `skills.limits.maxSkillsPromptChars`,
  dengan override opsional per agen di
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruksi pembaruan mandiri
- Ruang kerja + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, plus `MEMORY.md` saat ada). Root `memory.md` huruf kecil tidak disuntikkan; itu adalah input perbaikan legacy untuk `openclaw doctor --fix` saat dipasangkan dengan `MEMORY.md`. File besar dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 12000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 60000). File harian `memory/*.md` bukan bagian dari prompt bootstrap normal; file tersebut tetap tersedia sesuai kebutuhan melalui alat memori pada giliran biasa, tetapi eksekusi model reset/startup dapat menambahkan lebih dulu blok konteks startup satu kali dengan memori harian terbaru untuk giliran pertama itu. Perintah chat polos `/new` dan `/reset` diakui tanpa memanggil model. Pendahuluan startup dikendalikan oleh `agents.defaults.startupContext`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku Heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat rincian lengkap di [Prompt Sistem](/id/concepts/system-prompt).

## Yang dihitung dalam jendela konteks

Semua yang diterima model dihitung terhadap batas konteks:

- Prompt sistem (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Panggilan alat dan hasil alat
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan Compaction dan artefak pemangkasan
- Pembungkus penyedia atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Beberapa permukaan yang berat secara runtime memiliki batas eksplisit sendiri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Override per agen berada di bawah `agents.list[].contextLimits`. Kenop ini digunakan
untuk kutipan runtime terbatas dan blok yang disuntikkan serta dimiliki runtime. Kenop ini
terpisah dari batas bootstrap, batas konteks startup, dan batas prompt skills.

Untuk gambar, OpenClaw mengecilkan payload gambar transkrip/alat sebelum panggilan penyedia.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikan ini:

- Nilai lebih rendah biasanya mengurangi penggunaan token visi dan ukuran payload.
- Nilai lebih tinggi mempertahankan lebih banyak detail visual untuk tangkapan layar yang berat OCR/UI.

Untuk rincian praktis (per file yang disuntikkan, alat, skills, dan ukuran prompt sistem), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini di chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **estimasi biaya** (hanya kunci API).
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Persisten per sesi (disimpan sebagai `responseUsage`).
  - Auth OAuth **menyembunyikan biaya** (hanya token).
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lain:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota penyedia yang dinormalisasi (`X% left`, bukan biaya per respons).
  Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Permukaan penggunaan menormalisasi alias kolom native penyedia yang umum sebelum ditampilkan.
Untuk traffic Responses keluarga OpenAI, itu mencakup `input_tokens` /
`output_tokens` dan `prompt_tokens` / `completion_tokens`, sehingga nama kolom
khusus transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan JSON Gemini CLI juga dinormalisasi: teks balasan berasal dari `response`, dan
`stats.cached` dipetakan ke `cacheRead` dengan `stats.input_tokens - stats.cached`
digunakan saat CLI menghilangkan kolom eksplisit `stats.input`.
Untuk traffic Responses native keluarga OpenAI, alias penggunaan WebSocket/SSE
dinormalisasi dengan cara yang sama, dan total fallback ke input + output yang dinormalisasi saat
`total_tokens` hilang atau `0`.
Saat snapshot sesi saat ini minim, `/status` dan `session_status` juga dapat
memulihkan penghitung token/cache serta label model runtime aktif dari log penggunaan transkrip
terbaru. Nilai live bukan nol yang sudah ada tetap diprioritaskan
dibandingkan nilai fallback transkrip, dan total transkrip yang lebih besar serta berorientasi prompt
dapat menang saat total tersimpan hilang atau lebih kecil.
Auth penggunaan untuk jendela kuota penyedia berasal dari hook khusus penyedia saat
tersedia; jika tidak, OpenClaw fallback ke pencocokan kredensial OAuth/kunci API
dari profil auth, env, atau config.
Entri transkrip asisten mempertahankan bentuk penggunaan ternormalisasi yang sama, termasuk
`usage.cost` saat model aktif memiliki harga yang dikonfigurasi dan penyedia
mengembalikan metadata penggunaan. Ini memberi `/usage cost` dan status sesi berbasis transkrip
sumber yang stabil bahkan setelah status runtime live hilang.

OpenClaw menjaga akuntansi penggunaan penyedia terpisah dari snapshot konteks saat ini.
`usage.total` penyedia dapat mencakup input yang di-cache, output, dan beberapa
panggilan model loop alat, sehingga berguna untuk biaya dan telemetri tetapi dapat melebih-lebihkan
jendela konteks live. Tampilan konteks dan diagnostik menggunakan snapshot prompt terbaru
(`promptTokens`, atau panggilan model terakhir saat tidak ada snapshot prompt
tersedia) untuk `context.used`.

## Estimasi biaya (saat ditampilkan)

Biaya diestimasi dari konfigurasi harga model Anda:

```
models.providers.<provider>.models[].cost
```

Ini adalah **USD per 1 juta token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga tidak ada, OpenClaw hanya menampilkan token. Token OAuth
tidak pernah menampilkan biaya dolar.

Setelah sidecar dan channel mencapai jalur siap Gateway, OpenClaw memulai
bootstrap harga latar belakang opsional untuk ref model terkonfigurasi yang belum
memiliki harga lokal. Bootstrap itu mengambil katalog harga OpenRouter dan LiteLLM
jarak jauh. Setel `models.pricing.enabled: false` untuk melewati pengambilan katalog tersebut
pada jaringan offline atau terbatas; entri eksplisit
`models.providers.*.models[].cost` tetap menjadi dasar estimasi biaya lokal.

## TTL cache dan dampak pemangkasan

Caching prompt penyedia hanya berlaku dalam jendela TTL cache. OpenClaw dapat
secara opsional menjalankan **pemangkasan cache-ttl**: ini memangkas sesi setelah TTL cache
kedaluwarsa, lalu mereset jendela cache sehingga permintaan berikutnya dapat menggunakan ulang
konteks yang baru di-cache alih-alih meng-cache ulang seluruh riwayat. Ini menjaga biaya
penulisan cache lebih rendah saat sesi idle melewati TTL.

Konfigurasikan di [konfigurasi Gateway](/id/gateway/configuration) dan lihat detail
perilakunya di [Pemangkasan sesi](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** selama jeda idle. Jika TTL cache model Anda
adalah `1h`, mengatur interval heartbeat sedikit di bawah itu (misalnya, `55m`) dapat menghindari
peng-cache-an ulang seluruh prompt, sehingga mengurangi biaya penulisan cache.

Dalam pengaturan multi-agen, Anda dapat menyimpan satu konfigurasi model bersama dan menyesuaikan perilaku cache
per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap kenop demi kenop, lihat [Caching Prompt](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token input,
sementara penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga
caching prompt Anthropic untuk tarif dan pengali TTL terbaru:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: jaga cache 1j tetap hangat dengan heartbeat

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

`agents.list[].params` digabungkan di atas `params` milik model yang dipilih, sehingga Anda dapat
hanya meng-override `cacheRetention` dan mewarisi default model lainnya tanpa perubahan.

### Contoh: aktifkan header beta konteks 1 juta Anthropic

Jendela konteks 1 juta Anthropic saat ini dibatasi beta. OpenClaw dapat menyuntikkan
nilai `anthropic-beta` yang diperlukan saat Anda mengaktifkan `context1m` pada model Opus
atau Sonnet yang didukung.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Ini dipetakan ke header beta `context-1m-2025-08-07` Anthropic.

Ini hanya berlaku saat `context1m: true` diatur pada entri model tersebut.

Persyaratan: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic merespons dengan error batas laju sisi penyedia untuk permintaan tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/langganan (`sk-ant-oat-*`),
OpenClaw melewati header beta `context-1m-*` karena Anthropic saat ini
menolak kombinasi tersebut dengan HTTP 401.

## Tips untuk mengurangi tekanan token

- Gunakan `/compact` untuk meringkas sesi panjang.
- Pangkas output alat besar dalam alur kerja Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang berat tangkapan layar.
- Jaga deskripsi skill tetap singkat (daftar skill disuntikkan ke prompt).
- Pilih model yang lebih kecil untuk pekerjaan eksploratif yang verbose.

Lihat [Skills](/id/tools/skills) untuk rumus overhead daftar skill yang tepat.

## Terkait

- [Penggunaan API dan biaya](/id/reference/api-usage-costs)
- [Caching prompt](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)

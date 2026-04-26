---
read_when:
    - Menjelaskan penggunaan token, biaya, atau context window
    - Men-debug pertumbuhan konteks atau perilaku compaction
summary: Bagaimana OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan token dan biaya
x-i18n:
    generated_at: "2026-04-26T11:38:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# Penggunaan token & biaya

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik model, tetapi kebanyakan
model bergaya OpenAI rata-rata sekitar ~4 karakter per token untuk teks bahasa Inggris.

## Bagaimana system prompt dibangun

OpenClaw menyusun system prompt-nya sendiri pada setiap run. Ini mencakup:

- Daftar tool + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai kebutuhan dengan `read`).
  Blok Skills ringkas dibatasi oleh `skills.limits.maxSkillsPromptChars`,
  dengan override opsional per agen di
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruksi self-update
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, ditambah `MEMORY.md` jika ada). Root `memory.md` huruf kecil tidak disuntikkan; itu adalah input perbaikan lama untuk `openclaw doctor --fix` saat dipasangkan dengan `MEMORY.md`. File besar dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 12000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 60000). File harian `memory/*.md` bukan bagian dari prompt bootstrap normal; file ini tetap sesuai permintaan melalui tool memori pada giliran biasa, tetapi `/new` dan `/reset` polos dapat menambahkan blok konteks startup sekali pakai dengan memori harian terbaru untuk giliran pertama itu. Prelude startup tersebut dikendalikan oleh `agents.defaults.startupContext`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku Heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat rincian lengkapnya di [System Prompt](/id/concepts/system-prompt).

## Apa yang dihitung dalam context window

Segala sesuatu yang diterima model dihitung terhadap batas konteks:

- System prompt (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Pemanggilan tool dan hasil tool
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan Compaction dan artefak pruning
- Wrapper provider atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Beberapa surface runtime yang berat memiliki batas eksplisitnya sendiri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Override per agen berada di bawah `agents.list[].contextLimits`. Knob ini
ditujukan untuk cuplikan runtime yang dibatasi dan blok milik runtime yang disuntikkan. Ini
terpisah dari batas bootstrap, batas konteks startup, dan batas prompt Skills.

Untuk gambar, OpenClaw menurunkan skala payload gambar transkrip/tool sebelum pemanggilan provider.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikannya:

- Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload.
- Nilai yang lebih tinggi mempertahankan lebih banyak detail visual untuk tangkapan layar OCR/UI yang berat.

Untuk rincian praktis (per file yang disuntikkan, tools, Skills, dan ukuran system prompt), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini di chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **perkiraan biaya** (hanya API key).
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Persisten per sesi (disimpan sebagai `responseUsage`).
  - Auth OAuth **menyembunyikan biaya** (hanya token).
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Surface lain:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota provider yang dinormalisasi (`X% left`, bukan biaya per respons).
  Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Surface penggunaan menormalkan alias field native provider umum sebelum ditampilkan.
Untuk trafik Responses keluarga OpenAI, itu mencakup `input_tokens` /
`output_tokens` dan `prompt_tokens` / `completion_tokens`, sehingga nama field
khusus transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan JSON Gemini CLI juga dinormalisasi: teks balasan berasal dari `response`, dan
`stats.cached` dipetakan ke `cacheRead` dengan `stats.input_tokens - stats.cached`
digunakan ketika CLI tidak menyertakan field `stats.input` yang eksplisit.
Untuk trafik Responses native keluarga OpenAI, alias penggunaan WebSocket/SSE
dinormalisasi dengan cara yang sama, dan total fallback ke input + output yang
sudah dinormalisasi ketika `total_tokens` hilang atau bernilai `0`.
Ketika snapshot sesi saat ini jarang, `/status` dan `session_status` juga dapat
memulihkan penghitung token/cache dan label model runtime aktif dari log penggunaan transkrip terbaru. Nilai live nonzero yang sudah ada tetap didahulukan atas nilai fallback transkrip, dan total transkrip berorientasi prompt yang lebih besar dapat menang ketika total yang disimpan hilang atau lebih kecil.
Auth penggunaan untuk jendela kuota provider berasal dari hook khusus provider saat
tersedia; jika tidak, OpenClaw fallback ke kredensial OAuth/API key yang cocok
dari auth profile, env, atau config.
Entri transkrip asisten mempertahankan bentuk penggunaan ternormalisasi yang sama, termasuk
`usage.cost` ketika model aktif memiliki harga yang dikonfigurasi dan provider
mengembalikan metadata penggunaan. Ini memberi `/usage cost` dan status sesi berbasis
transkrip sumber yang stabil bahkan setelah status runtime live hilang.

OpenClaw memisahkan akuntansi penggunaan provider dari snapshot konteks saat ini.
`usage.total` provider dapat mencakup input yang di-cache, output, dan beberapa
pemanggilan model dalam loop tool, jadi ini berguna untuk biaya dan telemetri tetapi dapat
melebih-lebihkan context window live. Tampilan konteks dan diagnostik menggunakan snapshot
prompt terbaru (`promptTokens`, atau pemanggilan model terakhir saat tidak ada snapshot
prompt) untuk `context.used`.

## Perkiraan biaya (saat ditampilkan)

Biaya diperkirakan dari config harga model Anda:

```
models.providers.<provider>.models[].cost
```

Nilai ini adalah **USD per 1 juta token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga tidak ada, OpenClaw hanya menampilkan token. Token OAuth
tidak pernah menampilkan biaya dolar.

## Dampak TTL cache dan pruning

Caching prompt provider hanya berlaku dalam jendela TTL cache. OpenClaw dapat
secara opsional menjalankan **cache-ttl pruning**: ini memangkas sesi setelah TTL cache
kedaluwarsa, lalu mereset jendela cache sehingga permintaan berikutnya dapat menggunakan ulang
konteks yang baru saja di-cache alih-alih meng-cache ulang seluruh riwayat. Ini menjaga
biaya penulisan cache tetap lebih rendah ketika sesi menganggur melewati TTL.

Konfigurasikan ini di [Gateway configuration](/id/gateway/configuration) dan lihat
detail perilakunya di [Session pruning](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** di antara jeda idle. Jika TTL cache model Anda
adalah `1h`, mengatur interval heartbeat sedikit di bawah itu (misalnya `55m`) dapat menghindari
peng-cache-an ulang seluruh prompt, sehingga mengurangi biaya penulisan cache.

Dalam penyiapan multi-agen, Anda dapat mempertahankan satu config model bersama dan menyesuaikan perilaku cache
per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap per knob, lihat [Prompt Caching](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token
input, sementara penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga
prompt caching Anthropic untuk tarif dan pengali TTL terbaru:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: pertahankan cache 1 jam tetap hangat dengan heartbeat

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

### Contoh: lalu lintas campuran dengan strategi cache per agen

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # baseline default untuk sebagian besar agen
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # jaga cache panjang tetap hangat untuk sesi mendalam
    - id: "alerts"
      params:
        cacheRetention: "none" # hindari penulisan cache untuk notifikasi yang sporadis
```

`agents.list[].params` di-merge di atas `params` model yang dipilih, sehingga Anda dapat
mengoverride hanya `cacheRetention` dan mewarisi default model lainnya tanpa perubahan.

### Contoh: aktifkan header beta Anthropic 1 juta konteks

Context window 1 juta milik Anthropic saat ini dibatasi beta. OpenClaw dapat menyuntikkan
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

Ini dipetakan ke header beta Anthropic `context-1m-2025-08-07`.

Ini hanya berlaku ketika `context1m: true` diatur pada entri model tersebut.

Syarat: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic merespons dengan error rate limit dari sisi provider untuk permintaan itu.

Jika Anda mengautentikasi Anthropic dengan token OAuth/langganan (`sk-ant-oat-*`),
OpenClaw melewati header beta `context-1m-*` karena Anthropic saat ini
menolak kombinasi itu dengan HTTP 401.

## Tips untuk mengurangi tekanan token

- Gunakan `/compact` untuk merangkum sesi yang panjang.
- Pangkas output tool yang besar dalam workflow Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang banyak tangkapan layar.
- Jaga deskripsi skill tetap singkat (daftar skill disuntikkan ke prompt).
- Pilih model yang lebih kecil untuk pekerjaan eksploratif yang verbose.

Lihat [Skills](/id/tools/skills) untuk rumus overhead daftar skill yang tepat.

## Terkait

- [API usage and costs](/id/reference/api-usage-costs)
- [Prompt caching](/id/reference/prompt-caching)
- [Usage tracking](/id/concepts/usage-tracking)

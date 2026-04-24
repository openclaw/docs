---
read_when:
    - Menjelaskan penggunaan token, biaya, atau context window
    - Men-debug pertumbuhan konteks atau perilaku Compaction
summary: Bagaimana OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan token dan biaya
x-i18n:
    generated_at: "2026-04-24T09:27:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Penggunaan token & biaya

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik per model, tetapi sebagian besar
model bergaya OpenAI rata-rata sekitar ~4 karakter per token untuk teks bahasa Inggris.

## Bagaimana prompt sistem dibangun

OpenClaw menyusun prompt sistemnya sendiri pada setiap eksekusi. Ini mencakup:

- Daftar alat + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai permintaan dengan `read`).
  Blok Skills ringkas dibatasi oleh `skills.limits.maxSkillsPromptChars`,
  dengan override opsional per agen di
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruksi pembaruan mandiri
- File workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, plus `MEMORY.md` jika ada). `memory.md` huruf kecil di root tidak disisipkan; file itu adalah input perbaikan lama untuk `openclaw doctor --fix` saat dipasangkan dengan `MEMORY.md`. File besar dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 12000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 60000). File harian `memory/*.md` bukan bagian dari prompt bootstrap normal; file tersebut tetap sesuai permintaan melalui alat memori pada giliran biasa, tetapi `/new` dan `/reset` polos dapat menambahkan blok konteks startup sekali pakai dengan memori harian terbaru untuk giliran pertama itu. Prelude startup tersebut dikendalikan oleh `agents.defaults.startupContext`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku Heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat rincian lengkapnya di [Prompt Sistem](/id/concepts/system-prompt).

## Apa yang dihitung dalam context window

Segala sesuatu yang diterima model dihitung terhadap batas konteks:

- Prompt sistem (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Pemanggilan alat dan hasil alat
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan Compaction dan artifact pruning
- Wrapper penyedia atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Beberapa permukaan yang berat pada runtime memiliki batas eksplisitnya sendiri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Override per agen ada di bawah `agents.list[].contextLimits`. Pengaturan ini
ditujukan untuk kutipan runtime yang dibatasi dan blok yang dimiliki runtime yang disisipkan. Pengaturan ini
terpisah dari batas bootstrap, batas konteks startup, dan batas prompt Skills.

Untuk gambar, OpenClaw mengecilkan payload gambar transkrip/alat sebelum pemanggilan penyedia.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikannya:

- Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload.
- Nilai yang lebih tinggi mempertahankan lebih banyak detail visual untuk tangkapan layar OCR/UI yang berat.

Untuk rincian praktis (per file yang disisipkan, alat, Skills, dan ukuran prompt sistem), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini di chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **perkiraan biaya** (hanya kunci API).
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Persisten per sesi (disimpan sebagai `responseUsage`).
  - Autentikasi OAuth **menyembunyikan biaya** (hanya token).
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lainnya:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota penyedia yang dinormalisasi (`X% tersisa`, bukan biaya per respons).
  Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Permukaan penggunaan menormalkan alias field native penyedia yang umum sebelum ditampilkan.
Untuk trafik Responses keluarga OpenAI, itu mencakup `input_tokens` /
`output_tokens` dan `prompt_tokens` / `completion_tokens`, sehingga nama field
spesifik transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan JSON Gemini CLI juga dinormalisasi: teks balasan berasal dari `response`, dan
`stats.cached` dipetakan ke `cacheRead` dengan `stats.input_tokens - stats.cached`
digunakan saat CLI menghilangkan field `stats.input` eksplisit.
Untuk trafik Responses keluarga OpenAI native, alias penggunaan WebSocket/SSE
dinormalisasi dengan cara yang sama, dan total kembali ke input + output yang dinormalisasi saat
`total_tokens` hilang atau `0`.
Saat snapshot sesi saat ini jarang terisi, `/status` dan `session_status` juga dapat
memulihkan penghitung token/cache dan label model runtime aktif dari log penggunaan transkrip terbaru.
Nilai live nonzero yang ada tetap didahulukan dibanding nilai fallback transkrip, dan total
transkrip yang lebih besar dan berorientasi prompt dapat menang saat total yang disimpan hilang atau lebih kecil.
Autentikasi penggunaan untuk jendela kuota penyedia berasal dari hook khusus penyedia bila
tersedia; jika tidak, OpenClaw kembali mencocokkan kredensial OAuth/kunci API
dari profil autentikasi, env, atau config.
Entri transkrip asisten menyimpan bentuk penggunaan ternormalisasi yang sama, termasuk
`usage.cost` saat model aktif memiliki harga yang dikonfigurasi dan penyedia mengembalikan metadata penggunaan.
Ini memberi `/usage cost` dan status sesi berbasis transkrip sumber yang stabil bahkan setelah status runtime live hilang.

## Perkiraan biaya (saat ditampilkan)

Biaya diperkirakan dari config harga model Anda:

```
models.providers.<provider>.models[].cost
```

Ini adalah **USD per 1 juta token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga tidak ada, OpenClaw hanya menampilkan token. Token OAuth
tidak pernah menampilkan biaya dolar.

## Dampak TTL cache dan pruning

Caching prompt penyedia hanya berlaku dalam jendela TTL cache. OpenClaw dapat
secara opsional menjalankan **cache-ttl pruning**: sesi dipangkas setelah TTL cache
kedaluwarsa, lalu jendela cache direset sehingga permintaan berikutnya dapat menggunakan ulang konteks
yang baru di-cache alih-alih meng-cache ulang seluruh riwayat. Ini menjaga biaya
penulisan cache tetap lebih rendah saat sesi idle melewati TTL.

Konfigurasikan di [Konfigurasi Gateway](/id/gateway/configuration) dan lihat
rincian perilakunya di [Pruning sesi](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** sepanjang jeda idle. Jika TTL cache model Anda
adalah `1h`, menetapkan interval Heartbeat sedikit di bawah itu (misalnya, `55m`) dapat menghindari
peng-cache-an ulang seluruh prompt, sehingga mengurangi biaya penulisan cache.

Dalam penyiapan multi-agen, Anda dapat mempertahankan satu config model bersama dan menyesuaikan perilaku cache
per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap per pengaturan, lihat [Prompt Caching](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token
input, sedangkan penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga prompt caching Anthropic untuk tarif terbaru dan pengali TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: jaga cache 1h tetap hangat dengan Heartbeat

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
          cacheRetention: "long" # baseline default untuk sebagian besar agen
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # jaga cache panjang tetap hangat untuk sesi mendalam
    - id: "alerts"
      params:
        cacheRetention: "none" # hindari penulisan cache untuk notifikasi bursty
```

`agents.list[].params` digabungkan di atas `params` model yang dipilih, sehingga Anda dapat
menimpa hanya `cacheRetention` dan mewarisi default model lain tanpa perubahan.

### Contoh: aktifkan header beta konteks Anthropic 1 juta

Context window 1 juta Anthropic saat ini dikendalikan beta. OpenClaw dapat menyisipkan
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

Ini dipetakan ke header beta `context-1m-2025-08-07` milik Anthropic.

Ini hanya berlaku saat `context1m: true` ditetapkan pada entri model tersebut.

Persyaratan: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic merespons dengan error rate limit sisi penyedia untuk permintaan tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/langganan (`sk-ant-oat-*`),
OpenClaw melewati header beta `context-1m-*` karena Anthropic saat ini
menolak kombinasi tersebut dengan HTTP 401.

## Tips untuk mengurangi tekanan token

- Gunakan `/compact` untuk merangkum sesi yang panjang.
- Pangkas output alat yang besar dalam alur kerja Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang berat pada tangkapan layar.
- Jaga deskripsi skill tetap singkat (daftar skill disisipkan ke prompt).
- Gunakan model yang lebih kecil untuk pekerjaan yang verbose dan eksploratif.

Lihat [Skills](/id/tools/skills) untuk rumus pasti overhead daftar skill.

## Terkait

- [Penggunaan API dan biaya](/id/reference/api-usage-costs)
- [Prompt caching](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)

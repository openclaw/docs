---
read_when:
    - Menjelaskan penggunaan token, biaya, atau jendela konteks
    - Men-debug pertumbuhan konteks atau perilaku Compaction
summary: Bagaimana OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan Token dan Biaya
x-i18n:
    generated_at: "2026-04-15T19:41:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a706d3df8b2ea1136b3535d216c6b358e43aee2a31a4759824385e1345e6fe5
    source_path: reference/token-use.md
    workflow: 15
---

# Penggunaan token & biaya

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik per model, tetapi sebagian besar
model bergaya OpenAI rata-rata menggunakan ~4 karakter per token untuk teks bahasa Inggris.

## Cara system prompt dibangun

OpenClaw menyusun system prompt-nya sendiri pada setiap proses berjalan. Isinya mencakup:

- Daftar tool + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai permintaan dengan `read`).
  Blok Skills yang ringkas dibatasi oleh `skills.limits.maxSkillsPromptChars`,
  dengan override opsional per agen di
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruksi pembaruan mandiri
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, serta `MEMORY.md` jika ada atau `memory.md` sebagai fallback huruf kecil). File besar dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 12000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 60000). File harian `memory/*.md` bukan bagian dari prompt bootstrap normal; file tersebut tetap sesuai permintaan melalui tool memori pada giliran biasa, tetapi `/new` dan `/reset` tanpa argumen dapat menambahkan blok konteks startup sekali pakai dengan memori harian terbaru untuk giliran pertama tersebut. Awalan startup itu dikendalikan oleh `agents.defaults.startupContext`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku Heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat rincian lengkapnya di [System Prompt](/id/concepts/system-prompt).

## Apa saja yang dihitung dalam jendela konteks

Semua yang diterima model dihitung terhadap batas konteks:

- System prompt (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Pemanggilan tool dan hasil tool
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan Compaction dan artefak pemangkasan
- Wrapper provider atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Beberapa permukaan runtime yang berat memiliki batas eksplisitnya sendiri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Override per agen berada di bawah `agents.list[].contextLimits`. Pengaturan ini
ditujukan untuk cuplikan runtime yang dibatasi dan blok milik runtime yang disisipkan. Pengaturan ini
terpisah dari batas bootstrap, batas konteks startup, dan batas prompt Skills.

Untuk gambar, OpenClaw mengecilkan payload gambar transkrip/tool sebelum pemanggilan provider.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikannya:

- Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload.
- Nilai yang lebih tinggi mempertahankan lebih banyak detail visual untuk tangkapan layar OCR/UI yang berat.

Untuk rincian praktis (per file yang disisipkan, tool, Skills, dan ukuran system prompt), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini di chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **perkiraan biaya** (hanya API key).
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Tersimpan per sesi (disimpan sebagai `responseUsage`).
  - Autentikasi OAuth **menyembunyikan biaya** (hanya token).
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lain:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota provider yang dinormalisasi (`X% tersisa`, bukan biaya per respons).
  Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Permukaan penggunaan menormalkan alias field native provider yang umum sebelum ditampilkan.
Untuk lalu lintas Responses keluarga OpenAI, ini mencakup `input_tokens` /
`output_tokens` maupun `prompt_tokens` / `completion_tokens`, sehingga nama field
yang spesifik transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan JSON Gemini CLI juga dinormalisasi: teks balasan berasal dari `response`, dan
`stats.cached` dipetakan ke `cacheRead` dengan `stats.input_tokens - stats.cached`
digunakan saat CLI tidak menyertakan field `stats.input` yang eksplisit.
Untuk lalu lintas Responses native keluarga OpenAI, alias penggunaan WebSocket/SSE
dinormalisasi dengan cara yang sama, dan total akan fallback ke input + output yang telah dinormalisasi saat
`total_tokens` tidak ada atau bernilai `0`.
Saat snapshot sesi saat ini minim data, `/status` dan `session_status` juga dapat
memulihkan penghitung token/cache dan label model runtime aktif dari log penggunaan transkrip terbaru. Nilai live yang tidak nol tetap lebih diutamakan daripada nilai fallback transkrip, dan total transkrip yang lebih besar dan berorientasi prompt dapat diprioritaskan saat total tersimpan tidak ada atau lebih kecil.
Autentikasi penggunaan untuk jendela kuota provider berasal dari hook khusus provider bila tersedia;
jika tidak, OpenClaw akan fallback ke pencocokan kredensial OAuth/API key dari profil auth, env, atau config.

## Perkiraan biaya (saat ditampilkan)

Biaya diperkirakan dari konfigurasi harga model Anda:

```
models.providers.<provider>.models[].cost
```

Nilai ini adalah **USD per 1 juta token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga tidak ada, OpenClaw hanya menampilkan token. Token OAuth
tidak pernah menampilkan biaya dalam dolar.

## Dampak TTL cache dan pemangkasan

Caching prompt provider hanya berlaku dalam jendela TTL cache. OpenClaw secara opsional dapat
menjalankan **cache-ttl pruning**: sesi dipangkas setelah TTL cache
kedaluwarsa, lalu jendela cache direset agar permintaan berikutnya dapat menggunakan kembali
konteks yang baru di-cache alih-alih melakukan cache ulang seluruh riwayat. Ini menjaga biaya
penulisan cache tetap lebih rendah saat sesi diam melewati TTL.

Konfigurasikan di [Konfigurasi Gateway](/id/gateway/configuration) dan lihat
rincian perilakunya di [Session pruning](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** selama jeda idle. Jika TTL cache model Anda
adalah `1h`, menetapkan interval Heartbeat sedikit di bawah itu (misalnya, `55m`) dapat menghindari
cache ulang seluruh prompt, sehingga mengurangi biaya penulisan cache.

Dalam pengaturan multi-agent, Anda dapat mempertahankan satu konfigurasi model bersama dan menyesuaikan perilaku cache
per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap per pengaturan, lihat [Prompt Caching](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token
input, sedangkan penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga
prompt caching Anthropic untuk tarif dan pengali TTL terbaru:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: menjaga cache 1h tetap hangat dengan Heartbeat

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
        every: "55m" # menjaga cache panjang tetap hangat untuk sesi mendalam
    - id: "alerts"
      params:
        cacheRetention: "none" # hindari penulisan cache untuk notifikasi yang sporadis
```

`agents.list[].params` digabungkan di atas `params` model yang dipilih, sehingga Anda dapat
mengoverride hanya `cacheRetention` dan tetap mewarisi default model lainnya tanpa perubahan.

### Contoh: mengaktifkan header beta konteks Anthropic 1M

Jendela konteks 1M Anthropic saat ini masih dibatasi beta. OpenClaw dapat menyisipkan nilai
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

Ini dipetakan ke header beta Anthropic `context-1m-2025-08-07`.

Ini hanya berlaku saat `context1m: true` ditetapkan pada entri model tersebut.

Persyaratan: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic akan merespons dengan galat batas laju dari sisi provider untuk permintaan tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/subscription (`sk-ant-oat-*`),
OpenClaw melewati header beta `context-1m-*` karena Anthropic saat ini
menolak kombinasi tersebut dengan HTTP 401.

## Tips untuk mengurangi tekanan token

- Gunakan `/compact` untuk merangkum sesi yang panjang.
- Pangkas output tool yang besar dalam alur kerja Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang banyak menggunakan tangkapan layar.
- Jaga deskripsi Skills tetap singkat (daftar Skills disisipkan ke dalam prompt).
- Pilih model yang lebih kecil untuk pekerjaan yang verbose dan eksploratif.

Lihat [Skills](/id/tools/skills) untuk rumus overhead daftar skill yang tepat.

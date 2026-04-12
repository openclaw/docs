---
read_when:
    - Menjelaskan penggunaan token, biaya, atau jendela konteks
    - Men-debug pertumbuhan konteks atau perilaku pemadatan
summary: Bagaimana OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan Token dan Biaya
x-i18n:
    generated_at: "2026-04-12T09:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8c856549cd28b8364a640e6fa9ec26aa736895c7a993e96cbe85838e7df2dfb
    source_path: reference/token-use.md
    workflow: 15
---

# Penggunaan token & biaya

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik per model, tetapi sebagian besar
model bergaya OpenAI rata-rata ~4 karakter per token untuk teks bahasa Inggris.

## Bagaimana prompt sistem dibangun

OpenClaw menyusun prompt sistemnya sendiri pada setiap eksekusi. Isinya mencakup:

- Daftar tool + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai permintaan dengan `read`)
- Instruksi pembaruan mandiri
- File workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, serta `MEMORY.md` saat ada atau `memory.md` sebagai fallback huruf kecil). File besar dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 20000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 150000). File harian `memory/*.md` bukan bagian dari prompt bootstrap normal; file tersebut tetap sesuai permintaan melalui tool memori pada giliran biasa, tetapi `/new` dan `/reset` tanpa argumen dapat menambahkan blok konteks startup sekali pakai dengan memori harian terbaru untuk giliran pertama tersebut. Prelude startup itu dikendalikan oleh `agents.defaults.startupContext`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat rincian lengkapnya di [System Prompt](/id/concepts/system-prompt).

## Apa yang dihitung dalam jendela konteks

Semua yang diterima model dihitung terhadap batas konteks:

- Prompt sistem (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Pemanggilan tool dan hasil tool
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan pemadatan dan artefak pemangkasan
- Wrapper provider atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Untuk gambar, OpenClaw menurunkan skala payload gambar transkrip/tool sebelum pemanggilan provider.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikannya:

- Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload.
- Nilai yang lebih tinggi mempertahankan lebih banyak detail visual untuk screenshot berat OCR/UI.

Untuk rincian praktis (per file yang disuntikkan, tool, Skills, dan ukuran prompt sistem), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini dalam chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **perkiraan biaya** (hanya API key).
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Disimpan per sesi (disimpan sebagai `responseUsage`).
  - Autentikasi OAuth **menyembunyikan biaya** (hanya token).
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lain:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota provider yang dinormalisasi (`X% left`, bukan biaya per respons).
  Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Permukaan penggunaan menormalkan alias field native provider umum sebelum ditampilkan.
Untuk traffic Responses keluarga OpenAI, itu mencakup `input_tokens` /
`output_tokens` dan `prompt_tokens` / `completion_tokens`, sehingga nama field
yang spesifik transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan JSON Gemini CLI juga dinormalisasi: teks balasan berasal dari `response`, dan
`stats.cached` dipetakan ke `cacheRead` dengan `stats.input_tokens - stats.cached`
digunakan saat CLI menghilangkan field `stats.input` yang eksplisit.
Untuk traffic Responses keluarga OpenAI native, alias penggunaan WebSocket/SSE
dinormalisasi dengan cara yang sama, dan total akan fallback ke input + output yang dinormalisasi saat
`total_tokens` tidak ada atau bernilai `0`.
Saat snapshot sesi saat ini jarang terisi, `/status` dan `session_status` juga dapat
memulihkan penghitung token/cache dan label model runtime aktif dari log penggunaan transkrip terbaru. Nilai live bukan nol yang ada tetap lebih diutamakan daripada nilai fallback transkrip, dan total transkrip berorientasi prompt yang lebih besar dapat menang saat total tersimpan tidak ada atau lebih kecil.
Autentikasi penggunaan untuk jendela kuota provider berasal dari hook spesifik provider saat tersedia;
jika tidak, OpenClaw akan fallback dengan mencocokkan kredensial OAuth/API-key
dari profil autentikasi, env, atau konfigurasi.

## Estimasi biaya (saat ditampilkan)

Biaya diperkirakan dari konfigurasi harga model Anda:

```
models.providers.<provider>.models[].cost
```

Ini adalah **USD per 1 juta token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga tidak ada, OpenClaw hanya menampilkan token. Token OAuth
tidak pernah menampilkan biaya dalam dolar.

## Dampak TTL cache dan pemangkasan

Caching prompt provider hanya berlaku dalam jendela TTL cache. OpenClaw dapat
secara opsional menjalankan **cache-ttl pruning**: OpenClaw memangkas sesi setelah TTL cache
berakhir, lalu mereset jendela cache sehingga permintaan berikutnya dapat menggunakan kembali
konteks yang baru di-cache alih-alih melakukan cache ulang atas seluruh riwayat. Ini menjaga
biaya penulisan cache tetap lebih rendah saat sesi menganggur melewati TTL.

Konfigurasikan di [Gateway configuration](/id/gateway/configuration) dan lihat
detail perilakunya di [Session pruning](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** di sela waktu idle. Jika TTL cache model Anda
adalah `1h`, menetapkan interval heartbeat sedikit di bawah itu (misalnya `55m`) dapat menghindari
cache ulang atas seluruh prompt, sehingga mengurangi biaya penulisan cache.

Dalam setup multi-agent, Anda dapat mempertahankan satu konfigurasi model bersama dan menyesuaikan perilaku cache
per agent dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap per opsi, lihat [Prompt Caching](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token
input, sedangkan penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga prompt caching Anthropic untuk tarif terbaru dan pengali TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: jaga cache `1h` tetap hangat dengan heartbeat

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

### Contoh: traffic campuran dengan strategi cache per agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # baseline default untuk sebagian besar agent
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # jaga cache panjang tetap hangat untuk sesi mendalam
    - id: "alerts"
      params:
        cacheRetention: "none" # hindari penulisan cache untuk notifikasi yang bursty
```

`agents.list[].params` digabungkan di atas `params` model yang dipilih, sehingga Anda dapat
mengganti hanya `cacheRetention` dan mewarisi default model lainnya tanpa perubahan.

### Contoh: aktifkan header beta konteks `1M` Anthropic

Jendela konteks `1M` Anthropic saat ini dibatasi oleh beta. OpenClaw dapat menyuntikkan
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
Anthropic akan merespons dengan error rate limit sisi provider untuk permintaan tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/subscription (`sk-ant-oat-*`),
OpenClaw melewati header beta `context-1m-*` karena Anthropic saat ini
menolak kombinasi tersebut dengan HTTP 401.

## Tips untuk mengurangi tekanan token

- Gunakan `/compact` untuk merangkum sesi yang panjang.
- Pangkas output tool yang besar dalam workflow Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang banyak menggunakan screenshot.
- Jaga deskripsi skill tetap singkat (daftar skill disuntikkan ke prompt).
- Pilih model yang lebih kecil untuk pekerjaan yang verbose dan eksploratif.

Lihat [Skills](/id/tools/skills) untuk rumus overhead daftar skill yang tepat.

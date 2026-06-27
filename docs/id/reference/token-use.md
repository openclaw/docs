---
read_when:
    - Menjelaskan penggunaan token, biaya, atau jendela konteks
    - Men-debug pertumbuhan konteks atau perilaku compaction
summary: Cara OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan token dan biaya
x-i18n:
    generated_at: "2026-06-27T18:12:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik per model, tetapi sebagian besar
model bergaya OpenAI rata-rata ~4 karakter per token untuk teks bahasa Inggris.

## Cara system prompt dibangun

OpenClaw menyusun system prompt-nya sendiri pada setiap run. Isinya meliputi:

- Daftar tool + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai kebutuhan dengan `read`).
  Turn Codex native menerima blok skills ringkas sebagai instruksi developer
  kolaborasi yang dibatasi cakupan turn; harness lain menerimanya di permukaan
  prompt normal. Ini dibatasi oleh `skills.limits.maxSkillsPromptChars`, dengan
  override opsional per agen di `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruksi pembaruan mandiri
- File workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, plus `MEMORY.md` saat ada). Turn Codex native tidak menempelkan `MEMORY.md` mentah dari workspace agen yang dikonfigurasi saat tool memori tersedia untuk workspace tersebut; turn tersebut menyertakan pointer memori kecil dalam instruksi developer kolaborasi yang dibatasi cakupan turn dan menggunakan tool memori sesuai kebutuhan. Jika tool dinonaktifkan, pencarian memori tidak tersedia, atau workspace aktif berbeda dari workspace memori agen, `MEMORY.md` menggunakan jalur konteks turn terbatas yang normal. Root huruf kecil `memory.md` tidak disuntikkan; itu adalah input perbaikan lama untuk `openclaw doctor --fix` saat dipasangkan dengan `MEMORY.md`. File besar yang disuntikkan dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 20000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 60000). File harian `memory/*.md` bukan bagian dari prompt bootstrap normal; file tersebut tetap tersedia sesuai permintaan melalui tool memori pada turn biasa, tetapi run model reset/startup dapat menambahkan blok konteks startup sekali pakai dengan memori harian terbaru untuk turn pertama tersebut. Perintah chat polos `/new` dan `/reset` diakui tanpa memanggil model. Prelude startup dikontrol oleh `agents.defaults.startupContext`. Kutipan AGENTS.md pasca-Compaction terpisah dan memerlukan opt-in eksplisit `agents.defaults.compaction.postCompactionSections`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku Heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat rincian lengkapnya di [System Prompt](/id/concepts/system-prompt).

Saat mendokumentasikan kredensial atau cuplikan auth, gunakan
[Konvensi Placeholder Rahasia](/id/reference/secret-placeholder-conventions) untuk
menghindari false positive pemindai rahasia pada perubahan khusus docs.

## Apa yang dihitung dalam context window

Semua yang diterima model dihitung terhadap batas konteks:

- System prompt (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Pemanggilan tool dan hasil tool
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan Compaction dan artefak pruning
- Wrapper provider atau header keselamatan (tidak terlihat, tetapi tetap dihitung)

Beberapa permukaan yang berat runtime memiliki batas eksplisit sendiri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Override per agen berada di bawah `agents.list[].contextLimits`. Knob ini
untuk kutipan runtime terbatas dan blok milik runtime yang disuntikkan. Knob ini
terpisah dari batas bootstrap, batas konteks startup, dan batas prompt skills.

`toolResultMaxChars` adalah ceiling tingkat lanjut (hingga `1000000` karakter). Saat tidak disetel, OpenClaw memilih
batas hasil tool langsung dari context window model efektif: `16000` karakter
di bawah 100K token, `32000` karakter pada 100K+ token, dan `64000` karakter pada 200K+
token, tetap dibatasi oleh guard pembagian konteks runtime.

Untuk gambar, OpenClaw mengecilkan payload gambar transkrip/tool sebelum pemanggilan provider.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikannya:

- Nilai yang lebih rendah biasanya mengurangi penggunaan token vision dan ukuran payload.
- Nilai yang lebih tinggi mempertahankan lebih banyak detail visual untuk screenshot yang berat OCR/UI.

Untuk rincian praktis (per file yang disuntikkan, tool, skills, dan ukuran system prompt), gunakan `/context list` atau `/context detail`. Lihat [Konteks](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini di chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **estimasi biaya** saat harga lokal
  dikonfigurasi untuk model aktif.
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Bertahan per sesi (disimpan sebagai `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) — menghapus override sesi
    agar sesi kembali mewarisi default yang dikonfigurasi.
  - `/usage full` menampilkan estimasi biaya hanya saat OpenClaw memiliki metadata penggunaan dan
    harga lokal untuk model aktif. Jika tidak, hanya token yang ditampilkan.
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lain:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota provider yang dinormalisasi (`X% left`, bukan biaya per respons).
  Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Permukaan penggunaan menormalisasi alias field native provider yang umum sebelum ditampilkan.
Untuk traffic Responses keluarga OpenAI, itu mencakup `input_tokens` /
`output_tokens` dan `prompt_tokens` / `completion_tokens`, sehingga nama field
spesifik transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan Gemini CLI juga dinormalisasi: parser default `stream-json` membaca
event `message` asisten, dan `stats.cached` dipetakan ke `cacheRead` dengan
`stats.input_tokens - stats.cached` digunakan saat CLI menghilangkan field eksplisit
`stats.input`. Override JSON lama masih membaca teks balasan dari
`response`.
Untuk traffic Responses keluarga OpenAI native, alias penggunaan WebSocket/SSE
dinormalisasi dengan cara yang sama, dan total fallback ke input + output yang dinormalisasi saat
`total_tokens` hilang atau `0`.
Saat snapshot sesi saat ini jarang, `/status` dan `session_status` juga dapat
memulihkan counter token/cache dan label model runtime aktif dari log penggunaan
transkrip terbaru. Nilai live nonzero yang ada tetap memiliki prioritas
atas nilai fallback transkrip, dan total transkrip berorientasi prompt yang lebih besar
dapat menang saat total tersimpan hilang atau lebih kecil.
Auth penggunaan untuk jendela kuota provider berasal dari hook khusus provider saat
tersedia; jika tidak, OpenClaw fallback ke pencocokan kredensial OAuth/API-key
dari profil auth, env, atau config.
Entri transkrip asisten mempertahankan shape penggunaan ternormalisasi yang sama, termasuk
`usage.cost` saat model aktif memiliki harga yang dikonfigurasi dan provider
mengembalikan metadata penggunaan. Ini memberi `/usage cost` dan status sesi berbasis transkrip
sumber yang stabil bahkan setelah state runtime live hilang.

OpenClaw menjaga akuntansi penggunaan provider tetap terpisah dari snapshot konteks
saat ini. `usage.total` provider dapat mencakup input cache, output, dan beberapa
pemanggilan model tool-loop, sehingga berguna untuk biaya dan telemetri tetapi dapat melebih-lebihkan
context window live. Tampilan konteks dan diagnostik menggunakan snapshot prompt terbaru
(`promptTokens`, atau pemanggilan model terakhir saat tidak ada snapshot prompt yang
tersedia) untuk `context.used`.

## Estimasi biaya (saat ditampilkan)

Biaya diestimasi dari config harga model Anda:

```
models.providers.<provider>.models[].cost
```

Ini adalah **USD per 1M token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga tidak ada, OpenClaw hanya menampilkan token. Tampilan biaya
tidak terbatas pada auth API-key: provider non-API-key seperti `aws-sdk` dapat menampilkan
estimasi biaya saat entri model yang dikonfigurasi menyertakan harga lokal dan
provider mengembalikan metadata penggunaan.

Setelah sidecar dan channel mencapai jalur siap Gateway, OpenClaw memulai
bootstrap harga latar belakang opsional untuk ref model terkonfigurasi yang belum
memiliki harga lokal. Bootstrap tersebut mengambil katalog harga OpenRouter dan LiteLLM
jarak jauh. Setel `models.pricing.enabled: false` untuk melewati pengambilan katalog tersebut
pada jaringan offline atau terbatas; entri eksplisit
`models.providers.*.models[].cost` tetap menggerakkan estimasi biaya lokal.

## Cache TTL dan dampak pruning

Caching prompt provider hanya berlaku dalam jendela cache TTL. OpenClaw dapat
secara opsional menjalankan **cache-ttl pruning**: ini memangkas sesi setelah cache TTL
kedaluwarsa, lalu mereset jendela cache agar request berikutnya dapat menggunakan ulang
konteks yang baru di-cache alih-alih meng-cache ulang seluruh riwayat. Ini menjaga biaya
tulis cache tetap lebih rendah saat sesi idle melewati TTL.

Konfigurasikan di [Konfigurasi Gateway](/id/gateway/configuration) dan lihat
detail perilaku di [Pruning sesi](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **warm** di antara jeda idle. Jika cache TTL model Anda
adalah `1h`, menyetel interval heartbeat tepat di bawah itu (misalnya, `55m`) dapat menghindari
peng-cache-an ulang prompt penuh, sehingga mengurangi biaya tulis cache.

Dalam setup multi-agen, Anda dapat mempertahankan satu config model bersama dan menyesuaikan perilaku cache
per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap knob demi knob, lihat [Prompt Caching](/id/reference/prompt-caching).

Untuk harga Anthropic API, pembacaan cache jauh lebih murah daripada token input,
sementara penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga
prompt caching Anthropic untuk tarif terbaru dan pengali TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: menjaga cache 1h tetap warm dengan heartbeat

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
meng-override hanya `cacheRetention` dan mewarisi default model lain tanpa perubahan.

### Konteks Anthropic 1M

OpenClaw mengukur model Claude 4.x yang mampu GA seperti Opus 4.8, Opus 4.7, Opus 4.6, dan
Sonnet 4.6 dengan context window 1M milik Anthropic. Anda tidak perlu
`params.context1m: true` untuk model tersebut.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Config lama dapat mempertahankan `context1m: true`, tetapi OpenClaw tidak lagi mengirim
header beta Anthropic `context-1m-2025-08-07` yang telah dihentikan untuk setelan ini dan
tidak memperluas model Claude lama yang tidak didukung menjadi 1M.

Persyaratan: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic merespons dengan error batas laju sisi provider untuk request tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/langganan (`sk-ant-oat-*`),
OpenClaw mempertahankan header beta Anthropic yang diperlukan OAuth sambil menghapus
beta `context-1m-*` yang telah dihentikan jika masih ada di config lama.

## Tips untuk mengurangi tekanan token

- Gunakan `/compact` untuk meringkas sesi panjang.
- Pangkas output tool besar dalam workflow Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang berat screenshot.
- Jaga deskripsi skill tetap pendek (daftar skill disuntikkan ke prompt).
- Pilih model yang lebih kecil untuk pekerjaan eksploratif yang verbose.

Lihat [Skills](/id/tools/skills) untuk rumus overhead daftar skill yang tepat.

## Terkait

- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
- [Caching prompt](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)

---
read_when:
    - Menjelaskan penggunaan token, biaya, atau jendela konteks
    - Men-debug pertumbuhan konteks atau perilaku Compaction
summary: Cara OpenClaw menyusun konteks prompt dan melaporkan penggunaan token serta biaya
title: Penggunaan token dan biaya
x-i18n:
    generated_at: "2026-07-12T14:41:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik untuk setiap model, tetapi sebagian besar
model bergaya OpenAI memiliki rata-rata ~4 karakter per token untuk teks bahasa Inggris.

## Cara prompt sistem dibuat

OpenClaw menyusun prompt sistemnya sendiri pada setiap proses. Prompt ini mencakup:

- Daftar alat + deskripsi singkat
- Daftar Skills (hanya metadata; petunjuk dimuat sesuai kebutuhan dengan `read`). Giliran
  Codex native menerima blok Skills ringkas sebagai petunjuk pengembang kolaborasi
  dengan cakupan giliran; harness lain menerimanya di permukaan prompt normal.
  Dibatasi oleh `skills.limits.maxSkillsPromptChars`, dengan penggantian opsional per agen
  di `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Petunjuk pembaruan mandiri
- Ruang kerja + berkas bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, serta
  `MEMORY.md` jika ada). Berkas besar yang disisipkan dipotong berdasarkan
  `agents.defaults.bootstrapMaxChars` (bawaan: `20000`); total penyisipan
  bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (bawaan:
  `60000`).
  - Giliran Codex native tidak menempelkan `MEMORY.md` mentah saat alat memori
    tersedia untuk ruang kerja tersebut; sebagai gantinya, giliran tersebut menerima penunjuk memori kecil dalam
    petunjuk pengembang kolaborasi dengan cakupan giliran dan menggunakan alat memori
    sesuai kebutuhan. Jika alat dinonaktifkan, pencarian memori tidak tersedia, atau
    ruang kerja aktif berbeda dari ruang kerja memori agen, `MEMORY.md`
    kembali menggunakan jalur konteks giliran normal yang dibatasi.
  - `memory.md` akar dengan huruf kecil tidak pernah disisipkan. Berkas tersebut merupakan masukan perbaikan lama
    untuk `openclaw doctor --fix`, yang memigrasikannya ke `MEMORY.md`.
  - Berkas harian `memory/*.md` bukan bagian dari prompt bootstrap normal;
    berkas tersebut tetap tersedia sesuai kebutuhan melalui alat memori pada giliran biasa. Proses model
    saat pengaturan ulang/mulai dapat menambahkan blok konteks awal sekali pakai yang berisi
    memori harian terbaru untuk giliran pertama tersebut, yang dikendalikan oleh
    `agents.defaults.startupContext`. Percakapan biasa `/new` dan `/reset`
    dikonfirmasi tanpa memanggil model.
  - Cuplikan `AGENTS.md` setelah Compaction bersifat terpisah dan memerlukan
    pengaktifan eksplisit `agents.defaults.compaction.postCompactionSections`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku heartbeat
- Metadata runtime (host/OS/model/penalaran)

Lihat uraian lengkapnya di [Prompt Sistem](/id/concepts/system-prompt).

Saat mendokumentasikan kredensial atau cuplikan autentikasi, gunakan
[Konvensi Placeholder Rahasia](/id/reference/secret-placeholder-conventions) untuk
menghindari positif palsu pemindai rahasia dalam perubahan yang hanya menyentuh dokumentasi.

## Yang dihitung dalam jendela konteks

Semua yang diterima model dihitung terhadap batas konteks:

- Prompt sistem (semua bagian di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Pemanggilan alat dan hasil alat
- Lampiran/transkrip (gambar, audio, berkas)
- Ringkasan Compaction dan artefak pemangkasan
- Pembungkus penyedia atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Permukaan dengan beban runtime tinggi memiliki batas eksplisit tersendiri di bawah
`agents.defaults.contextLimits` (penggantian per agen di bawah
`agents.list[].contextLimits`):

| Kunci                    | Tujuan                                                                    |
| ------------------------ | ------------------------------------------------------------------------- |
| `memoryGetMaxChars`      | Jumlah karakter maksimum yang dikembalikan `memory_get` sebelum dipotong. |
| `memoryGetDefaultLines`  | Jendela baris bawaan `memory_get` saat permintaan tidak menyertakan `lines`. |
| `toolResultMaxChars`     | Batas atas lanjutan untuk satu hasil alat langsung (hingga `1000000` karakter). |
| `postCompactionMaxChars` | Jumlah karakter maksimum dari `AGENTS.md` yang dipertahankan selama penyegaran setelah Compaction. |

Ini adalah cuplikan runtime yang dibatasi dan blok yang disisipkan serta dimiliki runtime,
terpisah dari batas bootstrap, batas konteks awal, dan batas prompt
Skills.

`toolResultMaxChars` tidak ditetapkan secara bawaan, sehingga OpenClaw memperoleh batas
hasil alat langsung dari jendela konteks model yang efektif: `16000` karakter di bawah
100 ribu token, `32000` karakter pada 100 ribu+ token, `64000` karakter pada 200 ribu+ token.
Pengaman porsi konteks runtime tetap membatasi satu hasil alat hingga 30% dari
jendela konteks bahkan saat batas atas eksplisit yang lebih besar dikonfigurasi.

Untuk gambar, OpenClaw menurunkan skala muatan gambar transkrip/alat sebelum
pemanggilan penyedia. Sesuaikan dengan `agents.defaults.imageMaxDimensionPx` (bawaan:
`1200`):

- Nilai yang lebih rendah mengurangi penggunaan token visi dan ukuran muatan.
- Nilai yang lebih tinggi mempertahankan lebih banyak detail visual untuk tangkapan layar yang banyak memuat OCR/UI.

Untuk uraian praktis (per berkas yang disisipkan, alat, Skills, dan ukuran
prompt sistem), gunakan `/context list` atau `/context detail`. Lihat
[Konteks](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Dalam percakapan:

- `/status` -> kartu status kaya emoji dengan model sesi, penggunaan konteks,
  token masukan/keluaran respons terakhir, dan perkiraan biaya saat harga lokal
  dikonfigurasi untuk model aktif.
- `/usage off|tokens|full` -> menambahkan footer penggunaan per respons ke setiap
  balasan. Dipertahankan per sesi (disimpan sebagai `responseUsage`).
  - `/usage reset` (alias: `inherit`, `clear`, `default`) menghapus
    penggantian sesi sehingga kembali mewarisi nilai bawaan yang dikonfigurasi.
  - `/usage tokens` menampilkan detail token/cache giliran.
  - `/usage full` menampilkan detail ringkas model/konteks/biaya; perkiraan biaya
    hanya muncul saat OpenClaw memiliki metadata penggunaan dan harga lokal untuk
    model aktif. Tata letak khusus `messages.usageTemplate` dapat menyertakan
    kolom token/cache.
- `/usage cost` -> ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lain:

- **TUI/Web TUI:** `/status` dan `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota penyedia yang dinormalisasi (`X% left`, bukan biaya per respons).
  Penyedia jendela penggunaan saat ini: Claude (Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan, dan z.ai.

Permukaan penggunaan menormalisasi alias kolom native umum milik penyedia sebelum
ditampilkan. Untuk lalu lintas Responses keluarga OpenAI, ini mencakup
`input_tokens`/`output_tokens` dan `prompt_tokens`/`completion_tokens`, sehingga
nama kolom khusus transportasi tidak mengubah `/status`, `/usage`, atau ringkasan
sesi. Penggunaan Gemini CLI juga dinormalisasi: parser `stream-json`
bawaan membaca peristiwa `message` asisten, dan `stats.cached` dipetakan ke
`cacheRead`, dengan `stats.input_tokens - stats.cached` digunakan saat CLI tidak
menyertakan kolom `stats.input` eksplisit. Penggantian JSON lama tetap membaca teks balasan
dari `response`.

Untuk lalu lintas Responses native keluarga OpenAI, alias penggunaan
WebSocket/SSE dinormalisasi dengan cara yang sama, dan total kembali menggunakan masukan + keluaran
yang dinormalisasi saat `total_tokens` tidak ada atau bernilai `0`.

Saat snapshot sesi saat ini tidak lengkap, `/status` dan `session_status`
dapat memulihkan penghitung token/cache dan label model runtime aktif dari
log penggunaan transkrip terbaru. Nilai langsung bukan nol yang ada tetap
diprioritaskan daripada nilai cadangan transkrip, dan total transkrip berorientasi prompt
yang lebih besar dapat dipilih saat total yang tersimpan tidak ada atau lebih kecil.

Autentikasi penggunaan untuk jendela kuota penyedia berasal dari hook khusus penyedia
terlebih dahulu; jika penyedia tidak memiliki hook (atau hook tidak menghasilkan token),
OpenClaw kembali menggunakan kredensial OAuth/kunci API yang cocok dari profil
autentikasi, env, atau konfigurasi.

Entri transkrip asisten mempertahankan bentuk penggunaan ternormalisasi yang sama,
termasuk `usage.cost` saat harga untuk model aktif telah dikonfigurasi dan
penyedia mengembalikan metadata penggunaan. Ini memberi `/usage cost` dan
status sesi berbasis transkrip sumber yang stabil bahkan setelah status
runtime langsung tidak lagi tersedia.

OpenClaw memisahkan penghitungan penggunaan penyedia dari snapshot konteks
saat ini. `usage.total` penyedia dapat mencakup masukan yang di-cache, keluaran, dan
beberapa pemanggilan model dalam perulangan alat, sehingga berguna untuk biaya dan telemetri tetapi
dapat melebihkan jendela konteks langsung. Tampilan dan diagnostik konteks menggunakan
snapshot prompt terbaru (`promptTokens`, atau pemanggilan model terakhir saat tidak ada
snapshot prompt) untuk `context.used`.

## Perkiraan biaya (saat ditampilkan)

Biaya diperkirakan dari konfigurasi harga model Anda:

```text
models.providers.<provider>.models[].cost
```

Nilai ini adalah **USD per 1 juta token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga tidak tersedia, `/usage full` tidak menampilkan biaya; gunakan
`/usage tokens` atau `messages.usageTemplate` khusus saat Anda memerlukan
detail token/cache dalam setiap balasan. Tampilan biaya tidak terbatas pada
autentikasi kunci API: penyedia tanpa kunci API seperti `aws-sdk` dapat menampilkan
perkiraan biaya saat entri model yang dikonfigurasi menyertakan harga lokal dan penyedia
mengembalikan metadata penggunaan.

Setelah sidecar dan saluran mencapai jalur siap Gateway, OpenClaw memulai
bootstrap harga latar belakang opsional untuk referensi model terkonfigurasi yang belum
memiliki harga lokal. Bootstrap tersebut mengambil katalog harga OpenRouter dan
LiteLLM jarak jauh. Tetapkan `models.pricing.enabled: false` untuk melewati pengambilan
katalog tersebut pada jaringan luring atau terbatas; entri eksplisit
`models.providers.*.models[].cost` tetap menentukan perkiraan biaya lokal.

## Dampak TTL cache dan pemangkasan

Cache prompt penyedia hanya berlaku dalam jendela TTL cache. OpenClaw
secara opsional dapat menjalankan **pemangkasan TTL cache**: sesi dipangkas setelah
TTL cache berakhir, lalu jendela cache diatur ulang sehingga permintaan berikutnya
menggunakan kembali konteks yang baru di-cache alih-alih melakukan cache ulang terhadap seluruh riwayat.
Hal ini menjaga biaya penulisan cache tetap lebih rendah saat sesi tidak aktif melewati TTL.

Konfigurasikan di [konfigurasi Gateway](/id/gateway/configuration) dan lihat detail
perilakunya di [Pemangkasan sesi](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** selama jeda tidak aktif. Jika TTL cache
model Anda adalah `1h`, mengatur interval heartbeat sedikit di bawahnya (misalnya, `55m`) dapat
menghindari cache ulang seluruh prompt, sehingga mengurangi biaya penulisan cache.

Dalam penyiapan multiagen, Anda dapat mempertahankan satu konfigurasi model bersama dan menyesuaikan perilaku
cache per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap setiap pengaturan, lihat [Cache Prompt](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token
masukan, sedangkan penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga
cache prompt Anthropic untuk tarif dan pengali TTL terbaru:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: menjaga cache 1 jam tetap hangat dengan heartbeat

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
          cacheRetention: "long" # dasar bawaan untuk sebagian besar agen
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # menjaga cache panjang tetap hangat untuk sesi mendalam
    - id: "alerts"
      params:
        cacheRetention: "none" # menghindari penulisan cache untuk notifikasi beruntun
```

`agents.list[].params` digabungkan di atas `params` model yang dipilih, sehingga Anda
dapat mengganti hanya `cacheRetention` dan mewarisi nilai bawaan model lainnya
tanpa perubahan.

### Konteks 1 juta Anthropic

OpenClaw menetapkan ukuran model Claude 4.x berkemampuan GA seperti Opus 4.8, Opus 4.7, Opus
4.6, dan Sonnet 4.6 dengan jendela konteks 1 juta milik Anthropic. Anda tidak memerlukan
`params.context1m: true` untuk model-model tersebut.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Konfigurasi lama dapat mempertahankan `context1m: true`, tetapi OpenClaw tidak lagi mengirim
header beta `context-1m-2025-08-07` milik Anthropic yang telah dihentikan untuk pengaturan ini dan
tidak memperluas model Claude lama yang tidak didukung hingga 1 juta.

Persyaratan: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic merespons dengan galat batas laju di sisi penyedia untuk permintaan tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/langganan
(`sk-ant-oat-*`), OpenClaw mempertahankan header beta Anthropic yang diwajibkan OAuth
sembari menghapus beta `context-1m-*` yang telah dihentikan jika masih ada dalam
konfigurasi lama.

## Kiat untuk mengurangi tekanan token

- Gunakan `/compact` untuk meringkas sesi panjang.
- Pangkas keluaran alat yang besar dalam alur kerja Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang banyak menggunakan tangkapan layar.
- Buat deskripsi Skills tetap singkat (daftar Skills disisipkan ke dalam prompt).
- Utamakan model yang lebih kecil untuk pekerjaan eksploratif yang menghasilkan keluaran panjang.

Lihat [Skills](/id/tools/skills) untuk rumus pasti overhead daftar Skills.

## Terkait

- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
- [Penyimpanan cache prompt](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)

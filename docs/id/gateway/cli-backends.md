---
read_when:
    - Anda menginginkan fallback yang andal ketika penyedia API gagal
    - Anda menjalankan CLI AI lokal dan ingin menggunakannya kembali
    - Anda ingin memahami bridge local loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-07-01T08:31:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback khusus teks** ketika penyedia API sedang down,
terkena pembatasan laju, atau sementara bermasalah. Ini sengaja dibuat konservatif:

- **Tool OpenClaw tidak diinjeksi secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima tool gateway melalui bridge MCP loopback.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (sehingga giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman**, bukan jalur utama. Gunakan saat Anda
menginginkan respons teks yang "selalu berfungsi" tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
pengikatan thread/percakapan, dan sesi coding eksternal persisten, gunakan
[Agen ACP](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

<Tip>
  Membuat plugin backend baru? Gunakan
  [Plugin backend CLI](/id/plugins/cli-backend-plugins). Halaman ini untuk pengguna
  yang mengonfigurasi dan mengoperasikan backend yang sudah terdaftar.
</Tip>

## Mulai cepat yang ramah pemula

Anda dapat menggunakan Claude Code CLI **tanpa konfigurasi apa pun** (plugin Anthropic bawaan
mendaftarkan backend default):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` adalah id agen default saat tidak ada daftar agen eksplisit yang dikonfigurasi. Jika
Anda menggunakan beberapa agen, ganti dengan id agen yang ingin Anda jalankan.

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, tambahkan hanya
path perintah:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Selesai. Tidak perlu kunci, tidak perlu konfigurasi auth tambahan selain CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada
host gateway, OpenClaw sekarang otomatis memuat plugin bawaan pemiliknya saat konfigurasi Anda
secara eksplisit mereferensikan backend tersebut dalam ref model atau di bawah
`agents.defaults.cliBackends`.

## Menggunakannya sebagai fallback

Tambahkan backend CLI ke daftar fallback Anda sehingga hanya berjalan saat model utama gagal:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Catatan:

- Jika Anda menggunakan `agents.defaults.models` (allowlist), Anda juga harus menyertakan model backend CLI Anda di sana.
- Jika penyedia utama gagal (auth, batas laju, timeout), OpenClaw akan
  mencoba backend CLI berikutnya.

## Ringkasan konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri diberi kunci berupa **id penyedia** (mis. `claude-cli`, `my-cli`).
Id penyedia menjadi sisi kiri ref model Anda:

```
<provider>/<model>
```

### Contoh konfigurasi

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Cara kerjanya

1. **Memilih backend** berdasarkan prefiks penyedia (`claude-cli/...`).
2. **Membangun prompt sistem** menggunakan prompt OpenClaw + konteks workspace yang sama.
3. **Mengeksekusi CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend `claude-cli` bawaan menjaga proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks final.
5. **Menyimpan id sesi secara persisten** per backend, sehingga giliran lanjutan menggunakan ulang sesi CLI yang sama.

<Note>
Backend Anthropic `claude-cli` bawaan kembali didukung. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw kembali diizinkan, jadi OpenClaw memperlakukan
penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend Anthropic `claude-cli` bawaan lebih memilih resolver skill native Claude Code
untuk skill OpenClaw. Saat snapshot skill saat ini menyertakan setidaknya
satu skill terpilih dengan path yang dimaterialisasi, OpenClaw meneruskan plugin Claude
Code sementara dengan `--plugin-dir` dan menghilangkan katalog skill OpenClaw duplikat
dari prompt sistem yang ditambahkan. Jika snapshot tidak memiliki skill plugin yang dimaterialisasi,
OpenClaw mempertahankan katalog prompt sebagai fallback. Override env/kunci API skill
tetap diterapkan oleh OpenClaw ke lingkungan proses anak untuk
run tersebut.

Claude CLI juga memiliki mode izin noninteraktifnya sendiri. OpenClaw memetakannya
ke kebijakan exec yang ada alih-alih menambahkan konfigurasi kebijakan khusus Claude.
Untuk sesi live Claude yang dikelola OpenClaw, kebijakan exec OpenClaw efektif bersifat
otoritatif: YOLO (`tools.exec.security: "full"` dan
`tools.exec.ask: "off"`) meluncurkan Claude dengan
`--permission-mode bypassPermissions`, sementara kebijakan exec efektif yang restriktif
meluncurkan Claude dengan `--permission-mode default`. Pengaturan per agen
`agents.list[].tools.exec` menimpa `tools.exec` global untuk agen tersebut.
Argumen backend Claude mentah masih dapat menyertakan `--permission-mode`, tetapi peluncuran live
Claude menormalkan flag tersebut agar cocok dengan kebijakan exec OpenClaw efektif.

Backend Anthropic `claude-cli` bawaan juga memetakan level `/think` OpenClaw
ke flag native `--effort` Claude Code untuk level selain off. `minimal` dan
`low` dipetakan ke `low`, `adaptive` dan `medium` dipetakan ke `medium`, serta `high`,
`xhigh`, dan `max` dipetakan langsung. Backend CLI lain memerlukan plugin pemiliknya untuk
mendeklarasikan pemeta argv yang setara sebelum `/think` dapat memengaruhi CLI yang di-spawn.

Sebelum OpenClaw dapat menggunakan backend `claude-cli` bawaan, Claude Code sendiri
harus sudah login di host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalasi Docker memerlukan Claude Code terinstal dan sudah login di dalam home
kontainer yang dipersistenkan, bukan hanya di host. Lihat
[Backend Claude CLI di Docker](/id/install/docker#claude-cli-backend-in-docker).

Gunakan `agents.defaults.cliBackends.claude-cli.command` hanya ketika binary `claude`
belum ada di `PATH`.

## Sesi

- Jika CLI mendukung sesi, atur `sessionArg` (mis. `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) saat ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag berbeda, atur
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan secara opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran lanjutan menggunakan ulang proses live Claude saat
  aktif. Stdio hangat sekarang menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan field transport. Jika Gateway dimulai ulang atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi yang
  tersimpan diverifikasi terhadap transkrip proyek yang sudah ada dan dapat dibaca sebelum
  resume, sehingga binding phantom dibersihkan dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi live Claude mempertahankan penjaga output JSONL berbatas. Default mengizinkan hingga
  8 MiB dan 20.000 baris JSONL mentah per giliran. Giliran Claude yang berat tool dapat menaikkannya
  per backend dengan
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  dan `maxTurnLines`; OpenClaw membatasi pengaturan tersebut ke 64 MiB dan 100.000
  baris.
- Sesi CLI tersimpan adalah kontinuitas milik penyedia. Reset sesi harian implisit
  tidak memutusnya; `/reset` dan kebijakan `session.reset` eksplisit tetap
  memutusnya.
- Sesi CLI baru biasanya menanam ulang hanya dari ringkasan compaction OpenClaw
  plus ekor pasca-compaction. Untuk memulihkan sesi pendek yang dibatalkan
  sebelum compaction, backend dapat ikut serta dengan
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw tetap menjaga reseed
  transkrip mentah berbatas dan membatasinya pada invalidasi aman seperti transkrip
  CLI yang hilang, perubahan prompt sistem/MCP, atau percobaan ulang session-expired; perubahan
  profil auth atau epoch kredensial tidak pernah menanam ulang riwayat transkrip mentah.

Catatan serialisasi:

- `serialize: true` menjaga run pada lane yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lane penyedia.
- OpenClaw menghentikan penggunaan ulang sesi CLI tersimpan saat identitas auth yang dipilih berubah,
  termasuk id profil auth yang berubah, kunci API statis, token statis, atau identitas
  akun OAuth saat CLI mengeksposnya. Rotasi token akses dan refresh OAuth tidak
  memutus sesi CLI tersimpan. Jika CLI tidak mengekspos id akun OAuth
  yang stabil, OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Prelude fallback dari sesi claude-cli

Saat upaya `claude-cli` gagal dan beralih ke kandidat non-CLI di
[`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw menanam
upaya berikutnya dengan prelude konteks yang dipanen dari transkrip JSONL lokal
Claude Code di `~/.claude/projects/`. Tanpa seed ini, penyedia fallback
akan mulai dingin karena transkrip sesi OpenClaw sendiri kosong
untuk run `claude-cli`.

- Prelude lebih memilih ringkasan `/compact` terbaru atau marker `compact_boundary`,
  lalu menambahkan giliran pasca-boundary terbaru hingga batas anggaran karakter.
  Giliran pra-boundary dibuang karena ringkasan sudah merepresentasikannya.
- Blok tool digabungkan menjadi petunjuk ringkas `(tool call: name)` dan
  `(tool result: …)` agar anggaran prompt tetap jujur. Ringkasan diberi label
  `(truncated)` jika meluap.
- Fallback dari `claude-cli` ke `claude-cli` dengan penyedia yang sama mengandalkan
  `--resume` milik Claude sendiri dan melewati prelude.
- Seed menggunakan ulang validasi path file sesi Claude yang sudah ada, sehingga
  path sembarang tidak dapat dibaca.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, atur `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file temp. Jika `imageArg` diatur, path tersebut
diteruskan sebagai argumen CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (injeksi path), yang cukup untuk CLI yang otomatis
memuat file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan penggunaan
  dari `stats` saat `usage` hilang atau kosong. Default Gemini CLI bawaan
  menggunakan `stream-json`, tetapi override lama `--output-format json` masih menggunakan
  parser JSON.
- `output: "jsonl"` mengurai stream JSONL dan mengekstrak pesan agen final plus pengenal
  sesi saat ada.
- `output: "text"` memperlakukan stdout sebagai respons final.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai arg CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` ditetapkan, stdin digunakan.

## Default (dimiliki Plugin)

Default backend CLI bawaan berada bersama Plugin pemiliknya. Misalnya,
Anthropic memiliki `claude-cli` dan Google memiliki `google-gemini-cli`. Jalankan agen OpenAI Codex menggunakan harness app-server Codex melalui `openai/*`; OpenClaw tidak
lagi mendaftarkan backend `codex-cli` bawaan.

Plugin Anthropic bawaan mendaftarkan default untuk `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Plugin Google bawaan juga mendaftarkan default untuk `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prasyarat: CLI Gemini lokal harus terpasang dan tersedia sebagai
`gemini` pada `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan output CLI Gemini:

- Parser default `stream-json` membaca event `message` asisten, event tool,
  penggunaan `result` final, dan event error fatal Gemini.
- Jika Anda mengganti arg Gemini menjadi `--output-format json`, OpenClaw menormalkan
  backend tersebut kembali ke `output: "json"` dan membaca teks balasan dari field JSON `response`.
- Penggunaan fallback ke `stats` saat `usage` tidak ada atau kosong.
- `stats.cached` dinormalkan menjadi `cacheRead` OpenClaw.
- Jika `stats.input` hilang, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Timpa hanya jika diperlukan (umum: path `command` absolut).

## Default yang dimiliki Plugin

Default backend CLI sekarang menjadi bagian dari permukaan Plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks provider dalam ref model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default Plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki Plugin melalui hook opsional
  `normalizeConfig`.

Plugin yang membutuhkan shim kompatibilitas prompt/pesan kecil dapat mendeklarasikan
transformasi teks dua arah tanpa mengganti provider atau backend CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` menulis ulang prompt sistem dan prompt pengguna yang diteruskan ke CLI. `output`
menulis ulang teks asisten yang di-stream dan teks final yang diurai sebelum OpenClaw menangani
marker kontrolnya sendiri dan pengiriman channel. Untuk panggilan model berbasis provider,
`output` juga memulihkan nilai string di dalam argumen tool-call terstruktur setelah
perbaikan stream dan sebelum eksekusi tool. Fragmen JSON provider mentah tetap
tidak berubah; konsumen harus menggunakan payload parsial, akhir, atau hasil yang terstruktur.

Untuk CLI yang memancarkan event JSONL khusus provider, tetapkan `jsonlDialect` pada konfigurasi
backend tersebut. Dialek yang didukung adalah `claude-stream-json` untuk stream yang kompatibel dengan Claude
Code dan `gemini-stream-json` untuk event `stream-json` CLI Gemini.

## Kepemilikan Compaction native

Beberapa backend CLI menjalankan agen yang memadatkan transkripnya **sendiri**, sehingga OpenClaw tidak boleh
menjalankan peringkas pengamannya terhadap backend tersebut - melakukannya akan melawan
Compaction milik backend sendiri dan dapat membuat giliran gagal keras.

`claude-cli` tidak memiliki endpoint harness - Claude Code melakukan Compaction secara internal - sehingga ia mendeklarasikan
`ownsNativeCompaction: true`, dan OpenClaw mengembalikan no-op dari jalur Compaction.
Sesi native-harness seperti Codex tetap dirutekan ke endpoint Compaction harness-nya
sebagai gantinya.

Karena backend memiliki Compaction, solusi sementara lama berupa menetapkan
`contextTokens: 1_000_000` semata untuk mencegah pengaman OpenClaw aktif pada sesi
claude-cli **tidak lagi diperlukan** - opt-out menggantikannya.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Deklarasikan `ownsNativeCompaction` hanya untuk backend yang benar-benar memiliki Compaction-nya: ia
harus dapat membatasi transkripnya sendiri secara andal saat mendekati jendela konteksnya dan mempertahankan
sesi yang dapat dilanjutkan (mis. `--resume` / `--session-id`); jika tidak, sesi yang ditunda dapat
tetap melebihi anggaran. Sesi `agentHarnessId` yang cocok tetap dirutekan ke endpoint harness.

## Overlay MCP bundle

Backend CLI **tidak** menerima panggilan tool OpenClaw secara langsung, tetapi sebuah backend dapat
ikut serta dalam overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bawaan saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat MCP bundle diaktifkan, OpenClaw:

- men-spawn server MCP HTTP loopback yang mengekspos tool gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses tool ke konteks sesi, akun, dan channel saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari ekstensi pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat saat
backend ikut serta dalam MCP bundle agar proses latar belakang tetap terisolasi.

Runtime MCP bawaan dengan cakupan sesi di-cache untuk digunakan kembali dalam satu sesi, lalu
dibersihkan setelah `mcp.sessionIdleTtlMs` milidetik waktu idle (default 10
menit; tetapkan `0` untuk menonaktifkan). Jalankan tertanam sekali pakai seperti probe auth,
pembuatan slug, dan recall active-memory meminta pembersihan di akhir run agar turunan stdio
dan stream Streamable HTTP/SSE tidak hidup lebih lama dari run.

## Batas riwayat reseed

Saat sesi CLI baru di-seed dari transkrip OpenClaw sebelumnya (misalnya
setelah retry `session_expired`), blok
`<conversation_history>` yang dirender dibatasi agar prompt reseed tidak
membengkak. Defaultnya adalah `12288` karakter (sekitar 3000 token).

Backend CLI Claude secara otomatis menggunakan batas yang lebih besar yang diturunkan dari tier konteks
Claude yang di-resolve. Jalankan Claude standar 200K-token mempertahankan irisan transkrip
yang lebih besar, dan jalankan Claude 1M-token mempertahankan irisan yang lebih besar lagi, sementara backend CLI
lain mempertahankan default konservatif.

- Batas ini hanya mengatur blok riwayat sebelumnya pada prompt reseed. Batas output sesi live
  disetel terpisah di bawah `reliability.outputLimits`
  (lihat [Sesi](#sessions)).

## Batasan

- **Tidak ada panggilan tool OpenClaw langsung.** OpenClaw tidak menyuntikkan panggilan tool ke
  protokol backend CLI. Backend hanya melihat tool gateway saat mereka ikut serta dalam
  `bundleMcp: true`.
- **Streaming bersifat khusus backend.** Beberapa backend men-stream JSONL; yang lain melakukan buffer
  hingga keluar.
- **Output terstruktur** bergantung pada format JSON CLI.

## Pemecahan masalah

- **CLI tidak ditemukan**: tetapkan `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` ditetapkan dan `sessionMode` bukan
  `none`.
- **Gambar diabaikan**: tetapkan `imageArg` (dan verifikasi CLI mendukung path file).

## Terkait

- [Runbook Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)

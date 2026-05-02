---
read_when:
    - Anda menginginkan fallback yang andal saat penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-05-02T09:19:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback hanya teks** saat penyedia API sedang down,
dibatasi laju, atau sementara bermasalah. Ini sengaja dibuat konservatif:

- **Tool OpenClaw tidak diinjeksi secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima tool Gateway melalui jembatan MCP loopback.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (jadi giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman**, bukan jalur utama. Gunakan saat Anda
menginginkan respons teks yang “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
pengikatan thread/percakapan, dan sesi pengodean eksternal persisten, gunakan
[Agen ACP](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

## Mulai cepat ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (Plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jika Gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, cukup tambahkan
path perintah:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Selesai. Tidak perlu kunci, tidak perlu konfigurasi auth tambahan selain CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada host
Gateway, OpenClaw kini otomatis memuat Plugin bawaan pemiliknya saat konfigurasi Anda
secara eksplisit mereferensikan backend tersebut dalam ref model atau di bawah
`agents.defaults.cliBackends`.

## Menggunakannya sebagai fallback

Tambahkan backend CLI ke daftar fallback Anda agar hanya berjalan saat model utama gagal:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Catatan:

- Jika Anda menggunakan `agents.defaults.models` (allowlist), Anda juga harus menyertakan model backend CLI Anda di sana.
- Jika penyedia utama gagal (auth, batas laju, timeout), OpenClaw akan
  mencoba backend CLI berikutnya.

## Ikhtisar konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri diberi kunci berupa **id penyedia** (misalnya `codex-cli`, `my-cli`).
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
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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
          serialize: true,
        },
      },
    },
  },
}
```

## Cara kerjanya

1. **Memilih backend** berdasarkan prefiks penyedia (`codex-cli/...`).
2. **Menyusun prompt sistem** menggunakan prompt OpenClaw dan konteks workspace yang sama.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend `claude-cli` bawaan menjaga proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks akhir.
5. **Menyimpan id sesi** per backend, sehingga giliran lanjutan menggunakan kembali sesi CLI yang sama.

<Note>
Backend Anthropic `claude-cli` bawaan didukung lagi. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, jadi OpenClaw memperlakukan
penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend OpenAI `codex-cli` bawaan meneruskan prompt sistem OpenClaw melalui
override konfigurasi `model_instructions_file` milik Codex (`-c
model_instructions_file="..."`). Codex tidak menyediakan flag bergaya Claude
`--append-system-prompt`, jadi OpenClaw menulis prompt yang telah dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

Backend Anthropic `claude-cli` bawaan menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw ringkas dalam prompt sistem yang ditambahkan, dan
Plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agen/sesi tersebut, sehingga resolver skill native Claude Code
melihat set terfilter yang sama seperti yang sebaliknya akan diiklankan OpenClaw dalam
prompt. Override env/kunci API skill tetap diterapkan oleh OpenClaw ke
lingkungan proses child untuk run tersebut.

Claude CLI juga memiliki mode izin noninteraktifnya sendiri. OpenClaw memetakannya
ke kebijakan exec yang sudah ada alih-alih menambahkan konfigurasi khusus Claude: saat
kebijakan exec efektif yang diminta adalah YOLO (`tools.exec.security: "full"` dan
`tools.exec.ask: "off"`), OpenClaw menambahkan `--permission-mode bypassPermissions`.
Pengaturan per agen `agents.list[].tools.exec` menimpa `tools.exec` global untuk
agen tersebut. Untuk memaksa mode Claude yang berbeda, tetapkan arg backend mentah eksplisit
seperti `--permission-mode default` atau `--permission-mode acceptEdits` di bawah
`agents.defaults.cliBackends.claude-cli.args` dan `resumeArgs` yang cocok.

Sebelum OpenClaw dapat menggunakan backend `claude-cli` bawaan, Claude Code sendiri
harus sudah login pada host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Gunakan `agents.defaults.cliBackends.claude-cli.command` hanya saat binary `claude`
belum tersedia di `PATH`.

## Sesi

- Jika CLI mendukung sesi, tetapkan `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) saat ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag berbeda, tetapkan
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah mengirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran lanjutan menggunakan kembali proses Claude live saat
  proses itu aktif. Stdio hangat kini menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan field transport. Jika Gateway dimulai ulang atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi
  tersimpan diverifikasi terhadap transkrip proyek yang ada dan dapat dibaca sebelum
  resume, sehingga pengikatan semu dibersihkan dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi live Claude mempertahankan guard output JSONL berbatas. Default mengizinkan hingga
  8 MiB dan 20.000 baris JSONL mentah per giliran. Giliran Claude yang berat tool dapat menaikkan
  ini per backend dengan
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  dan `maxTurnLines`; OpenClaw membatasi pengaturan tersebut ke 64 MiB dan 100.000
  baris.
- Sesi CLI tersimpan adalah kontinuitas milik penyedia. Reset sesi harian implisit
  tidak memotongnya; `/reset` dan kebijakan `session.reset` eksplisit tetap
  melakukannya.

Catatan serialisasi:

- `serialize: true` menjaga run pada lane yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lane penyedia.
- OpenClaw membatalkan penggunaan ulang sesi CLI tersimpan saat identitas auth yang dipilih berubah,
  termasuk perubahan id profil auth, kunci API statis, token statis, atau identitas
  akun OAuth saat CLI mengekspose salah satunya. Rotasi token akses dan refresh OAuth
  tidak memotong sesi CLI tersimpan. Jika sebuah CLI tidak mengekspose id akun OAuth
  yang stabil, OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Prelude fallback dari sesi claude-cli

Saat percobaan `claude-cli` gagal beralih ke kandidat non-CLI dalam
[`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw menyemai
percobaan berikutnya dengan prelude konteks yang dipanen dari transkrip JSONL lokal
Claude Code di `~/.claude/projects/`. Tanpa seed ini, penyedia fallback
akan mulai dari kosong karena transkrip sesi milik OpenClaw sendiri kosong
untuk run `claude-cli`.

- Prelude lebih memilih ringkasan `/compact` terbaru atau penanda `compact_boundary`,
  lalu menambahkan giliran pascabatas terbaru hingga anggaran karakter.
  Giliran prabatas dibuang karena ringkasan sudah merepresentasikannya.
- Blok tool digabung menjadi petunjuk ringkas `(tool call: name)` dan
  `(tool result: …)` agar anggaran prompt tetap jujur. Ringkasan diberi label
  `(truncated)` jika meluap.
- Fallback penyedia yang sama dari `claude-cli` ke `claude-cli` mengandalkan
  `--resume` milik Claude sendiri dan melewati prelude.
- Seed menggunakan kembali validasi path file sesi Claude yang ada, sehingga
  path arbitrer tidak dapat dibaca.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, tetapkan `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` ditetapkan, path
tersebut diteruskan sebagai arg CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (injeksi path), yang cukup untuk CLI yang otomatis
memuat file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen akhir plus
  pengenal sesi jika ada.
- `output: "text"` memperlakukan stdout sebagai respons akhir.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai arg CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` ditetapkan, stdin digunakan.

## Default (milik Plugin)

Plugin OpenAI bawaan juga mendaftarkan default untuk `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google bawaan juga mendaftarkan default untuk `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prasyarat: Gemini CLI lokal harus terinstal dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari field JSON `response`.
- Penggunaan fallback ke `stats` saat `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Override hanya jika diperlukan (umum: path `command` absolut).

## Default milik Plugin

Default backend CLI kini menjadi bagian dari surface Plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- Backend `id` menjadi prefiks penyedia dalam referensi model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki plugin melalui hook opsional
  `normalizeConfig`.

Plugin yang membutuhkan shim kompatibilitas prompt/pesan kecil dapat mendeklarasikan
transformasi teks dua arah tanpa mengganti penyedia atau backend CLI:

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
menulis ulang delta asisten yang dialirkan dan teks akhir yang diurai sebelum OpenClaw menangani
penanda kontrolnya sendiri dan pengiriman saluran.

Untuk CLI yang memancarkan JSONL kompatibel stream-json Claude Code, tetapkan
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Overlay MCP bundel

Backend CLI **tidak** menerima panggilan alat OpenClaw secara langsung, tetapi backend dapat
memilih ikut menggunakan overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bundel saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: penimpaan konfigurasi inline untuk `mcp_servers`; server loopback
  OpenClaw yang dihasilkan ditandai dengan mode persetujuan alat per-server milik Codex
  sehingga panggilan MCP tidak dapat tertahan oleh prompt persetujuan lokal
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat MCP bundel diaktifkan, OpenClaw:

- menjalankan server MCP HTTP loopback yang mengekspos alat Gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke konteks sesi, akun, dan saluran saat ini
- memuat server bundle-MCP yang diaktifkan untuk ruang kerja saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari ekstensi pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat ketika
backend memilih ikut menggunakan MCP bundel agar eksekusi latar belakang tetap terisolasi.

Runtime MCP bundel bercakupan sesi disimpan dalam cache untuk digunakan kembali dalam satu sesi, lalu
dibersihkan setelah `mcp.sessionIdleTtlMs` milidetik waktu menganggur (default 10
menit; tetapkan `0` untuk menonaktifkan). Eksekusi tertanam sekali jalan seperti probe auth,
pembuatan slug, dan permintaan recall active-memory dibersihkan pada akhir eksekusi agar anak
stdio dan aliran HTTP/SSE Streamable tidak hidup lebih lama dari eksekusi.

## Batasan

- **Tidak ada panggilan alat OpenClaw langsung.** OpenClaw tidak menyuntikkan panggilan alat ke
  protokol backend CLI. Backend hanya melihat alat Gateway ketika mereka memilih ikut menggunakan
  `bundleMcp: true`.
- **Streaming bersifat khusus backend.** Beberapa backend melakukan streaming JSONL; yang lain menyangga
  hingga keluar.
- **Keluaran terstruktur** bergantung pada format JSON CLI.
- **Sesi CLI Codex** dilanjutkan melalui keluaran teks (tanpa JSONL), yang kurang
  terstruktur dibanding eksekusi awal `--json`. Sesi OpenClaw tetap berfungsi
  normal.

## Pemecahan Masalah

- **CLI tidak ditemukan**: tetapkan `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` ditetapkan dan `sessionMode` bukan
  `none` (CLI Codex saat ini tidak dapat melanjutkan dengan keluaran JSON).
- **Gambar diabaikan**: tetapkan `imageArg` (dan verifikasi CLI mendukung path file).

## Terkait

- [Runbook Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)

---
read_when:
    - Anda ingin fallback yang andal saat provider API gagal
    - Anda menjalankan Claude CLI atau CLI AI lokal lain dan ingin memakainya kembali
    - Anda ingin memahami bridge loopback MCP untuk akses tool backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan bridge tool MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-05T13:53:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 823f3aeea6be50e5aa15b587e0944e79e862cecb7045f9dd44c93c544024bce1
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime fallback)

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback teks saja** ketika provider API sedang down,
terkena rate limit, atau sementara berperilaku tidak semestinya. Ini sengaja dibuat konservatif:

- **Tool OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  (default Claude CLI) dapat menerima tool gateway melalui bridge MCP loopback.
- **Streaming JSONL** (Claude CLI menggunakan `--output-format stream-json` dengan
  `--include-partial-messages`; prompt dikirim melalui stdin).
- **Sesi didukung** (sehingga giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman** alih-alih jalur utama. Gunakan saat Anda
menginginkan respons teks yang “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
binding thread/percakapan, dan sesi coding eksternal persisten, gunakan
[ACP Agents](/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

## Memulai cepat yang ramah pemula

Anda dapat menggunakan Claude CLI **tanpa konfigurasi apa pun** (plugin Anthropic bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

Codex CLI juga langsung bisa dipakai (melalui plugin OpenAI bawaan):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, tambahkan saja
path perintahnya:

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

Itu saja. Tidak perlu key, tidak perlu config auth tambahan selain yang dibutuhkan CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **provider pesan utama** pada
host gateway, OpenClaw kini otomatis memuat plugin bawaan pemiliknya ketika config Anda
secara eksplisit mereferensikan backend tersebut dalam model ref atau di bawah
`agents.defaults.cliBackends`.

## Menggunakannya sebagai fallback

Tambahkan backend CLI ke daftar fallback Anda agar hanya berjalan ketika model utama gagal:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6", "claude-cli/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
        "claude-cli/claude-opus-4-6": {},
      },
    },
  },
}
```

Catatan:

- Jika Anda menggunakan `agents.defaults.models` (allowlist), Anda harus menyertakan `claude-cli/...`.
- Jika provider utama gagal (auth, rate limit, timeout), OpenClaw akan
  mencoba backend CLI berikutnya.
- Backend Claude CLI bawaan tetap menerima alias yang lebih pendek seperti
  `claude-cli/opus`, `claude-cli/opus-4.6`, atau `claude-cli/sonnet`, tetapi dokumentasi
  dan contoh config menggunakan ref kanonis `claude-cli/claude-*`.

## Ikhtisar konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri dikunci oleh **ID provider** (misalnya `claude-cli`, `my-cli`).
ID provider menjadi sisi kiri model ref Anda:

```
<provider>/<model>
```

### Contoh konfigurasi

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

1. **Memilih backend** berdasarkan prefiks provider (`claude-cli/...`).
2. **Membangun system prompt** menggunakan prompt + konteks workspace OpenClaw yang sama.
3. **Menjalankan CLI** dengan ID sesi (jika didukung) agar riwayat tetap konsisten.
4. **Mem-parsing output** (JSON atau teks biasa) dan mengembalikan teks final.
5. **Menyimpan ID sesi** per backend, sehingga giliran lanjutan memakai kembali sesi CLI yang sama.

## Sesi

- Jika CLI mendukung sesi, atur `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) ketika ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subcommand resume** dengan flag yang berbeda, atur
  `resumeArgs` (menggantikan `args` saat resume) dan opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim ID sesi (UUID baru jika tidak ada yang tersimpan).
  - `existing`: hanya kirim ID sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah kirim ID sesi.

Catatan serialisasi:

- `serialize: true` menjaga run pada lajur yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lajur provider.
- `claude-cli` lebih sempit: run yang di-resume diserialisasi per ID sesi Claude, dan run baru diserialisasi per path workspace. Workspace yang independen dapat berjalan paralel.
- OpenClaw membuang reuse sesi CLI yang tersimpan ketika state auth backend berubah, termasuk relogin, rotasi token, atau kredensial profil auth yang berubah.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, atur `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` diatur, path tersebut
dilewatkan sebagai argumen CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (penyuntikan path), yang cukup untuk CLI yang otomatis
memuat file lokal dari path biasa (perilaku Claude CLI).

## Input / output

- `output: "json"` (default) mencoba mem-parse JSON dan mengekstrak teks + ID sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  usage dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mem-parse stream JSONL (misalnya Claude CLI `stream-json`
  dan Codex CLI `--json`) dan mengekstrak pesan agent final plus pengenal sesi
  jika ada.
- `output: "text"` memperlakukan stdout sebagai respons final.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai argumen CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` diatur, stdin digunakan.

## Default (dimiliki plugin)

Plugin Anthropic bawaan mendaftarkan default untuk `claude-cli`:

- `command: "claude"`
- `args: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

Plugin OpenAI bawaan juga mendaftarkan default untuk `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google bawaan juga mendaftarkan default untuk `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prasyarat: Gemini CLI lokal harus terpasang dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari field JSON `response`.
- Usage fallback ke `stats` ketika `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Lakukan override hanya jika diperlukan (umumnya: path `command` absolut).

## Default milik plugin

Default backend CLI kini menjadi bagian dari surface plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks provider dalam model ref.
- Config pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default plugin.
- Pembersihan config khusus backend tetap dimiliki plugin melalui hook
  `normalizeConfig` opsional.

## Overlay bundle MCP

Backend CLI **tidak** menerima pemanggilan tool OpenClaw secara langsung, tetapi backend dapat
ikut serta ke overlay config MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bawaan saat ini:

- `claude-cli`: `bundleMcp: true` (default)
- `codex-cli`: tanpa overlay bundle MCP
- `google-gemini-cli`: tanpa overlay bundle MCP

Saat bundle MCP diaktifkan, OpenClaw:

- menjalankan server HTTP MCP loopback yang mengekspos tool gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses tool ke sesi, akun, dan konteks channel saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan `--mcp-config` backend yang sudah ada
- menulis ulang argumen CLI untuk meneruskan `--strict-mcp-config --mcp-config <generated-file>`

Flag `--strict-mcp-config` mencegah Claude CLI mewarisi server MCP ambient
tingkat pengguna atau global. Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap
menyuntikkan config kosong yang strict agar run latar belakang tetap terisolasi.

## Batasan

- **Tidak ada pemanggilan tool OpenClaw langsung.** OpenClaw tidak menyuntikkan pemanggilan tool ke
  protokol backend CLI. Namun, backend dengan `bundleMcp: true` (default
  Claude CLI) menerima tool gateway melalui bridge MCP loopback,
  sehingga Claude CLI dapat memanggil tool OpenClaw melalui dukungan MCP native-nya.
- **Streaming bersifat spesifik backend.** Claude CLI menggunakan streaming JSONL
  (`stream-json` dengan `--include-partial-messages`); backend CLI lain mungkin
  masih dibuffer sampai proses selesai.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (bukan JSONL), yang kurang
  terstruktur dibanding run awal `--json`. Sesi OpenClaw tetap bekerja
  secara normal.

## Pemecahan masalah

- **CLI tidak ditemukan**: atur `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kesinambungan sesi**: pastikan `sessionArg` diatur dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat resume dengan output JSON).
- **Gambar diabaikan**: atur `imageArg` (dan verifikasi CLI mendukung path file).

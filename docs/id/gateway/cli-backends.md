---
read_when:
    - Anda menginginkan fallback yang andal ketika penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-11T02:44:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d108dbea043c260a80d15497639298f71a6b4d800f68d7b39bc129f7667ca608
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime fallback)

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback khusus teks** ketika penyedia API sedang tidak tersedia,
terkena pembatasan laju, atau sementara bermasalah. Ini sengaja dibuat konservatif:

- **Alat OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat gateway melalui jembatan MCP loopback.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (agar giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman** alih-alih jalur utama. Gunakan ini ketika Anda
menginginkan respons teks yang “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
binding thread/percakapan, dan sesi coding eksternal persisten, gunakan
[Agen ACP](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

## Mulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, tambahkan hanya
path perintahnya:

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

Itu saja. Tidak diperlukan key, tidak ada konfigurasi auth tambahan selain yang dimiliki CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada
host gateway, OpenClaw sekarang memuat otomatis plugin bawaan pemiliknya ketika konfigurasi Anda
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
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Catatan:

- Jika Anda menggunakan `agents.defaults.models` (allowlist), Anda juga harus menyertakan model backend CLI di sana.
- Jika penyedia utama gagal (auth, pembatasan laju, timeout), OpenClaw akan
  mencoba backend CLI berikutnya.

## Ikhtisar konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri diberi key dengan **id penyedia** (misalnya `codex-cli`, `my-cli`).
Id penyedia menjadi sisi kiri dari ref model Anda:

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
          // CLI bergaya Codex dapat menunjuk ke file prompt sebagai gantinya:
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
2. **Membangun prompt sistem** menggunakan prompt OpenClaw yang sama + konteks workspace.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks akhir.
5. **Menyimpan id sesi** per backend, agar tindak lanjut menggunakan kembali sesi CLI yang sama.

<Note>
Backend `claude-cli` Anthropic bawaan kini didukung lagi. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, jadi OpenClaw memperlakukan
penggunaan `claude -p` sebagai sesuatu yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend `codex-cli` OpenAI bawaan meneruskan prompt sistem OpenClaw melalui
override config `model_instructions_file` milik Codex (`-c
model_instructions_file="..."`). Codex tidak mengekspos flag
`--append-system-prompt` seperti Claude, jadi OpenClaw menulis prompt yang dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

Backend `claude-cli` Anthropic bawaan menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw ringkas di prompt sistem tambahan, dan
plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agen/sesi itu, sehingga resolver skill native Claude Code
melihat set terfilter yang sama seperti yang seharusnya diiklankan OpenClaw dalam
prompt. Override env/API key Skill tetap diterapkan oleh OpenClaw ke lingkungan proses anak untuk eksekusi.

## Sesi

- Jika CLI mendukung sesi, setel `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) ketika ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag yang berbeda, setel
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sudah pernah disimpan sebelumnya.
  - `none`: jangan pernah kirim id sesi.

Catatan serialisasi:

- `serialize: true` menjaga eksekusi pada lane yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lane penyedia.
- OpenClaw membuang reuse sesi CLI yang tersimpan ketika status auth backend berubah, termasuk login ulang, rotasi token, atau perubahan kredensial profil auth.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, setel `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` disetel, path tersebut
diteruskan sebagai arg CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (injeksi path), yang cukup untuk CLI yang secara otomatis
memuat file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` ketika `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen akhir serta pengidentifikasi sesi
  jika ada.
- `output: "text"` memperlakukan stdout sebagai respons akhir.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai arg CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` disetel, stdin digunakan.

## Default (dimiliki plugin)

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
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prasyarat: Gemini CLI lokal harus terpasang dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari field JSON `response`.
- Penggunaan akan fallback ke `stats` ketika `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Override hanya jika diperlukan (umum: path `command` absolut).

## Default yang dimiliki plugin

Default backend CLI sekarang menjadi bagian dari surface plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks penyedia dalam ref model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki plugin melalui hook
  `normalizeConfig` opsional.

Plugin yang memerlukan shim kompatibilitas prompt/pesan kecil dapat mendeklarasikan
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
menulis ulang delta asisten yang di-stream dan teks akhir yang diurai sebelum OpenClaw menangani
penanda kontrolnya sendiri dan pengiriman kanal.

Untuk CLI yang mengeluarkan JSONL kompatibel Claude Code stream-json, setel
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Overlay Bundle MCP

Backend CLI **tidak** menerima pemanggilan alat OpenClaw secara langsung, tetapi backend dapat
ikut serta dalam overlay config MCP yang dibuat secara otomatis dengan `bundleMcp: true`.

Perilaku bawaan saat ini:

- `claude-cli`: file config MCP ketat yang dibuat otomatis
- `codex-cli`: override config inline untuk `mcp_servers`
- `google-gemini-cli`: file pengaturan sistem Gemini yang dibuat otomatis

Saat bundle MCP diaktifkan, OpenClaw:

- menjalankan server MCP HTTP loopback yang mengekspos alat gateway ke proses CLI
- mengautentikasi jembatan dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke sesi, akun, dan konteks kanal saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk config/pengaturan MCP backend yang sudah ada
- menulis ulang config peluncuran menggunakan mode integrasi yang dimiliki backend dari extension pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan config ketat ketika
backend ikut serta dalam bundle MCP agar eksekusi latar belakang tetap terisolasi.

## Keterbatasan

- **Tidak ada pemanggilan alat OpenClaw langsung.** OpenClaw tidak menyuntikkan pemanggilan alat ke
  protokol backend CLI. Backend hanya melihat alat gateway saat mereka ikut serta
  dalam `bundleMcp: true`.
- **Streaming bersifat khusus backend.** Beberapa backend melakukan stream JSONL; yang lain menahan output
  hingga proses selesai.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibandingkan eksekusi awal `--json`. Sesi OpenClaw tetap bekerja
  secara normal.

## Pemecahan masalah

- **CLI tidak ditemukan**: setel `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kelanjutan sesi**: pastikan `sessionArg` disetel dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat melanjutkan dengan output JSON).
- **Gambar diabaikan**: setel `imageArg` (dan verifikasi CLI mendukung path file).

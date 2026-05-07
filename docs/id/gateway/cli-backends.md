---
read_when:
    - Anda menginginkan fallback yang andal saat penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-05-07T13:16:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback hanya teks** saat penyedia API tidak aktif,
dibatasi laju, atau sementara bermasalah. Ini sengaja dibuat konservatif:

- **Alat OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat Gateway melalui jembatan MCP loopback.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (sehingga giliran tindak lanjut tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman**, bukan jalur utama. Gunakan saat Anda
menginginkan respons teks yang "selalu berfungsi" tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
pengikatan thread/percakapan, dan sesi coding eksternal persisten, gunakan
[Agen ACP](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

<Tip>
  Membuat Plugin backend baru? Gunakan
  [Plugin backend CLI](/id/plugins/cli-backend-plugins). Halaman ini ditujukan untuk pengguna
  yang mengonfigurasi dan mengoperasikan backend yang sudah terdaftar.
</Tip>

## Mulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (Plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jika Gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, tambahkan hanya
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

Selesai. Tidak perlu kunci, tidak perlu konfigurasi autentikasi tambahan selain CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada
host Gateway, OpenClaw kini memuat otomatis Plugin bawaan pemiliknya saat konfigurasi Anda
secara eksplisit mereferensikan backend tersebut dalam referensi model atau di bawah
`agents.defaults.cliBackends`.

## Menggunakannya sebagai fallback

Tambahkan backend CLI ke daftar fallback Anda sehingga hanya berjalan saat model utama gagal:

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

- Jika Anda menggunakan `agents.defaults.models` (daftar izin), Anda juga harus menyertakan model backend CLI Anda di sana.
- Jika penyedia utama gagal (autentikasi, batas laju, timeout), OpenClaw akan
  mencoba backend CLI berikutnya.

## Ikhtisar konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri diberi kunci dengan **id penyedia** (mis. `codex-cli`, `my-cli`).
Id penyedia menjadi sisi kiri referensi model Anda:

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
2. **Membangun prompt sistem** menggunakan prompt OpenClaw yang sama + konteks workspace.
3. **Menjalankan CLI** dengan id sesi (jika didukung) sehingga riwayat tetap konsisten.
   Backend `claude-cli` bawaan menjaga proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran tindak lanjut melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks final.
5. **Mempertahankan id sesi** per backend, sehingga tindak lanjut menggunakan kembali sesi CLI yang sama.

<Note>
Backend Anthropic `claude-cli` bawaan didukung kembali. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan kembali, jadi OpenClaw memperlakukan
penggunaan `claude -p` sebagai penggunaan yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend OpenAI `codex-cli` bawaan meneruskan prompt sistem OpenClaw melalui
override konfigurasi `model_instructions_file` milik Codex (`-c
model_instructions_file="..."`). Codex tidak mengekspos flag bergaya Claude
`--append-system-prompt`, sehingga OpenClaw menulis prompt yang telah dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

Backend Anthropic `claude-cli` bawaan menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw ringkas dalam prompt sistem yang ditambahkan, dan
Plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agen/sesi tersebut, sehingga resolver skill native Claude Code
melihat set terfilter yang sama seperti yang seharusnya diiklankan OpenClaw dalam
prompt. Override env/kunci API Skill tetap diterapkan oleh OpenClaw ke
lingkungan proses anak untuk run tersebut.

Claude CLI juga memiliki mode izin noninteraktifnya sendiri. OpenClaw memetakannya
ke kebijakan eksekusi yang ada alih-alih menambahkan konfigurasi khusus Claude: saat
kebijakan eksekusi efektif yang diminta adalah YOLO (`tools.exec.security: "full"` dan
`tools.exec.ask: "off"`), OpenClaw menambahkan `--permission-mode bypassPermissions`.
Pengaturan per agen `agents.list[].tools.exec` menimpa `tools.exec` global untuk
agen tersebut. Untuk memaksa mode Claude yang berbeda, tetapkan argumen backend mentah eksplisit
seperti `--permission-mode default` atau `--permission-mode acceptEdits` di bawah
`agents.defaults.cliBackends.claude-cli.args` dan `resumeArgs` yang cocok.

Backend Anthropic `claude-cli` bawaan juga memetakan level OpenClaw `/think`
ke flag native Claude Code `--effort` untuk level selain off. `minimal` dan
`low` dipetakan ke `low`, `adaptive` dan `medium` dipetakan ke `medium`, dan `high`,
`xhigh`, serta `max` dipetakan langsung. Backend CLI lain memerlukan Plugin pemiliknya untuk
mendeklarasikan pemeta argv yang setara sebelum `/think` dapat memengaruhi CLI yang dijalankan.

Sebelum OpenClaw dapat menggunakan backend `claude-cli` bawaan, Claude Code itu sendiri
harus sudah login pada host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Gunakan `agents.defaults.cliBackends.claude-cli.command` hanya saat biner `claude`
belum tersedia di `PATH`.

## Sesi

- Jika CLI mendukung sesi, tetapkan `sessionArg` (mis. `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) saat ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag berbeda, tetapkan
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan secara opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sudah pernah tersimpan sebelumnya.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran tindak lanjut menggunakan kembali proses Claude live saat
  masih aktif. Stdio hangat kini menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan field transport. Jika Gateway dimulai ulang atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi yang
  tersimpan diverifikasi terhadap transkrip proyek yang sudah ada dan dapat dibaca sebelum
  resume, sehingga pengikatan semu dibersihkan dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi live Claude menjaga pembatas output JSONL. Default mengizinkan hingga
  8 MiB dan 20.000 baris JSONL mentah per giliran. Giliran Claude yang banyak memakai alat dapat menaikkannya
  per backend dengan
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  dan `maxTurnLines`; OpenClaw membatasi pengaturan tersebut ke 64 MiB dan 100.000
  baris.
- Sesi CLI tersimpan adalah kontinuitas milik penyedia. Reset sesi harian implisit
  tidak memutuskannya; kebijakan `/reset` dan `session.reset` eksplisit tetap
  berlaku.

Catatan serialisasi:

- `serialize: true` menjaga run pada lane yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lane penyedia.
- OpenClaw menghentikan penggunaan ulang sesi CLI tersimpan saat identitas autentikasi yang dipilih berubah,
  termasuk perubahan id profil autentikasi, kunci API statis, token statis, atau identitas
  akun OAuth saat CLI mengeksposnya. Rotasi token akses dan refresh OAuth
  tidak memutus sesi CLI tersimpan. Jika CLI tidak mengekspos
  id akun OAuth yang stabil, OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Prelude fallback dari sesi claude-cli

Saat upaya `claude-cli` gagal beralih ke kandidat non-CLI di
[`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw menanam
upaya berikutnya dengan prelude konteks yang dipanen dari transkrip JSONL lokal
Claude Code di `~/.claude/projects/`. Tanpa seed ini, penyedia fallback
akan mulai dari kosong karena transkrip sesi OpenClaw sendiri kosong
untuk run `claude-cli`.

- Prelude mengutamakan ringkasan `/compact` terbaru atau marker `compact_boundary`,
  lalu menambahkan giliran pasca-boundary terbaru hingga batas anggaran karakter.
  Giliran pra-boundary dibuang karena ringkasan sudah mewakilinya.
- Blok alat digabung menjadi petunjuk ringkas `(tool call: name)` dan
  `(tool result: …)` agar anggaran prompt tetap jujur. Ringkasan diberi label
  `(truncated)` jika meluap.
- Fallback `claude-cli` ke `claude-cli` dengan penyedia yang sama mengandalkan
  `--resume` milik Claude sendiri dan melewati prelude.
- Seed menggunakan kembali validasi path file sesi Claude yang sudah ada, sehingga
  path arbitrer tidak dapat dibaca.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, tetapkan `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` ditetapkan, path tersebut
diteruskan sebagai argumen CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (injeksi path), yang cukup untuk CLI yang otomatis
memuat file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen final plus pengenal sesi
  jika ada.
- `output: "text"` memperlakukan stdout sebagai respons final.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai argumen CLI terakhir.
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

Prasyarat: Gemini CLI lokal harus sudah diinstal dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari bidang JSON `response`.
- Penggunaan fallback ke `stats` ketika `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Timpa hanya jika diperlukan (umum: path `command` absolut).

## Default milik Plugin

Default backend CLI sekarang menjadi bagian dari permukaan Plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks provider dalam referensi model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default Plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki Plugin melalui hook opsional
  `normalizeConfig`.

Plugin yang memerlukan shim kompatibilitas prompt/pesan kecil dapat mendeklarasikan
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
menulis ulang delta asisten yang di-stream dan teks akhir yang diurai sebelum OpenClaw menangani
penanda kontrolnya sendiri dan pengiriman channel.

Untuk CLI yang menghasilkan JSONL kompatibel stream-json Claude Code, tetapkan
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Overlay MCP bundel

Backend CLI **tidak** menerima panggilan tool OpenClaw secara langsung, tetapi backend dapat
memilih menggunakan overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bundel saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: penimpaan konfigurasi inline untuk `mcp_servers`; server loopback
  OpenClaw yang dihasilkan ditandai dengan mode persetujuan tool per server milik Codex
  sehingga panggilan MCP tidak dapat tertahan pada prompt persetujuan lokal
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Ketika MCP bundel diaktifkan, OpenClaw:

- menjalankan server HTTP MCP loopback yang mengekspos tool gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses tool ke konteks sesi, akun, dan channel saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari ekstensi pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat ketika
backend memilih MCP bundel agar run latar belakang tetap terisolasi.

Runtime MCP bundel yang tercakup sesi di-cache untuk digunakan kembali dalam sebuah sesi, lalu
dibersihkan setelah `mcp.sessionIdleTtlMs` milidetik waktu idle (default 10
menit; tetapkan `0` untuk menonaktifkan). Run tertanam sekali pakai seperti probe autentikasi,
pembuatan slug, dan recall Active Memory meminta pembersihan pada akhir run agar anak stdio
dan stream Streamable HTTP/SSE tidak hidup lebih lama dari run.

## Batasan

- **Tidak ada panggilan tool OpenClaw langsung.** OpenClaw tidak menyuntikkan panggilan tool ke dalam
  protokol backend CLI. Backend hanya melihat tool gateway ketika memilih menggunakan
  `bundleMcp: true`.
- **Streaming bersifat khusus backend.** Beberapa backend melakukan stream JSONL; yang lain melakukan buffer
  hingga keluar.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibandingkan run `--json` awal. Sesi OpenClaw tetap berfungsi
  normal.

## Pemecahan masalah

- **CLI tidak ditemukan**: tetapkan `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` ditetapkan dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat melanjutkan dengan output JSON).
- **Gambar diabaikan**: tetapkan `imageArg` (dan verifikasi CLI mendukung path file).

## Terkait

- [Runbook Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)

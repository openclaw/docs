---
read_when:
    - Anda menginginkan mekanisme cadangan yang andal saat penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat sisi belakang CLI
summary: 'Backend CLI: cadangan CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-30T09:47:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback khusus teks** saat penyedia API sedang tidak aktif,
terkena pembatasan laju, atau sementara berperilaku tidak semestinya. Ini sengaja dibuat konservatif:

- **alat OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat Gateway melalui jembatan MCP loopback.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (sehingga giliran tindak lanjut tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman**, bukan jalur utama. Gunakan saat Anda
menginginkan respons teks yang “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness lengkap dengan kontrol sesi ACP, tugas latar belakang,
pengikatan thread/percakapan, dan sesi pengodean eksternal persisten, gunakan
[ACP Agents](/id/tools/acp-agents). Backend CLI bukan ACP.

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

Selesai. Tidak perlu key, tidak perlu konfigurasi auth tambahan selain CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada host
Gateway, OpenClaw sekarang otomatis memuat Plugin bawaan pemiliknya saat konfigurasi Anda
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

Setiap entri diberi key oleh **id penyedia** (mis. `codex-cli`, `my-cli`).
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
2. **Membangun system prompt** menggunakan prompt OpenClaw yang sama + konteks workspace.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend `claude-cli` bawaan menjaga proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran tindak lanjut melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks final.
5. **Menyimpan id sesi secara persisten** per backend, sehingga tindak lanjut memakai ulang sesi CLI yang sama.

<Note>
Backend Anthropic `claude-cli` bawaan didukung kembali. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan kembali, sehingga OpenClaw memperlakukan
penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend OpenAI `codex-cli` bawaan meneruskan system prompt OpenClaw melalui
override konfigurasi `model_instructions_file` Codex (`-c
model_instructions_file="..."`). Codex tidak mengekspos flag bergaya Claude
`--append-system-prompt`, sehingga OpenClaw menulis prompt yang sudah dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

Backend Anthropic `claude-cli` bawaan menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw ringkas dalam system prompt yang ditambahkan, dan
Plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agent/sesi itu, sehingga resolver skill native Claude Code
melihat set terfilter yang sama dengan yang seharusnya diiklankan OpenClaw dalam
prompt. Override env/API key Skill tetap diterapkan oleh OpenClaw ke
lingkungan proses anak untuk run tersebut.

Claude CLI juga memiliki mode izin noninteraktifnya sendiri. OpenClaw memetakannya
ke kebijakan exec yang ada alih-alih menambahkan konfigurasi khusus Claude: saat
kebijakan exec efektif yang diminta adalah YOLO (`tools.exec.security: "full"` dan
`tools.exec.ask: "off"`), OpenClaw menambahkan `--permission-mode bypassPermissions`.
Pengaturan per-agent `agents.list[].tools.exec` menimpa `tools.exec` global untuk
agent tersebut. Untuk memaksa mode Claude yang berbeda, tetapkan arg backend mentah eksplisit
seperti `--permission-mode default` atau `--permission-mode acceptEdits` di bawah
`agents.defaults.cliBackends.claude-cli.args` dan `resumeArgs` yang sesuai.

Sebelum OpenClaw dapat menggunakan backend `claude-cli` bawaan, Claude Code sendiri
harus sudah login pada host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Gunakan `agents.defaults.cliBackends.claude-cli.command` hanya saat binary `claude`
belum ada di `PATH`.

## Sesi

- Jika CLI mendukung sesi, tetapkan `sessionArg` (mis. `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) saat ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag berbeda, tetapkan
  `resumeArgs` (mengganti `args` saat melanjutkan) dan opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah mengirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran tindak lanjut memakai ulang proses Claude live saat
  aktif. Stdio hangat sekarang menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan field transport. Jika Gateway dimulai ulang atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi yang
  tersimpan diverifikasi terhadap transkrip proyek yang ada dan dapat dibaca sebelum
  resume, sehingga binding semu dihapus dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi CLI tersimpan adalah kontinuitas milik penyedia. Reset sesi harian implisit
  tidak memutusnya; kebijakan `/reset` dan `session.reset` eksplisit tetap
  berlaku.

Catatan serialisasi:

- `serialize: true` menjaga run pada lane yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lane penyedia.
- OpenClaw membuang pemakaian ulang sesi CLI tersimpan saat identitas auth yang dipilih berubah,
  termasuk id profil auth yang berubah, API key statis, token statis, atau identitas
  akun OAuth saat CLI mengeksposnya. Rotasi akses OAuth dan token refresh
  tidak memutus sesi CLI tersimpan. Jika CLI tidak mengekspos id akun OAuth
  yang stabil, OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Prelude fallback dari sesi claude-cli

Saat percobaan `claude-cli` gagal beralih ke kandidat non-CLI di
[`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw mengisi
percobaan berikutnya dengan prelude konteks yang dipanen dari transkrip JSONL lokal
Claude Code di `~/.claude/projects/`. Tanpa seed ini, penyedia fallback
akan mulai dingin karena transkrip sesi OpenClaw sendiri kosong
untuk run `claude-cli`.

- Prelude mengutamakan ringkasan `/compact` terbaru atau marker `compact_boundary`,
  lalu menambahkan giliran pasca-boundary terbaru hingga batas karakter.
  Giliran pra-boundary dibuang karena ringkasan sudah merepresentasikannya.
- Blok alat digabungkan menjadi petunjuk ringkas `(tool call: name)` dan
  `(tool result: …)` agar budget prompt tetap jujur. Ringkasan diberi label
  `(truncated)` jika melampaui batas.
- Fallback `claude-cli` ke `claude-cli` dengan penyedia yang sama mengandalkan
  `--resume` milik Claude sendiri dan melewati prelude.
- Seed memakai ulang validasi path file sesi Claude yang ada, sehingga
  path arbitrer tidak dapat dibaca.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, tetapkan `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` ditetapkan, path tersebut
diteruskan sebagai arg CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (injeksi path), yang cukup untuk CLI yang otomatis
memuat file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agent final plus
  pengenal sesi jika ada.
- `output: "text"` memperlakukan stdout sebagai respons final.

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

Default backend CLI kini menjadi bagian dari permukaan Plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks penyedia dalam ref model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default Plugin.
- Pembersihan konfigurasi khusus backend tetap menjadi milik Plugin melalui hook opsional
  `normalizeConfig`.

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
penanda kontrol dan pengiriman kanalnya sendiri.

Untuk CLI yang memancarkan JSONL kompatibel stream-json Claude Code, tetapkan
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Gabungkan overlay MCP

Backend CLI **tidak** menerima panggilan alat OpenClaw secara langsung, tetapi backend dapat
memilih menggunakan overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku gabungan saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: penggantian konfigurasi inline untuk `mcp_servers`; server
  loopback OpenClaw yang dihasilkan ditandai dengan mode persetujuan alat per-server milik Codex
  sehingga panggilan MCP tidak dapat terhenti pada prompt persetujuan lokal
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat bundle MCP diaktifkan, OpenClaw:

- menjalankan server MCP HTTP loopback yang mengekspos alat gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke konteks sesi, akun, dan kanal saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari ekstensi pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat saat
backend memilih bundle MCP agar proses latar belakang tetap terisolasi.

Runtime MCP gabungan berbasis sesi di-cache untuk digunakan kembali dalam sesi, lalu
dibersihkan setelah `mcp.sessionIdleTtlMs` milidetik waktu idle (default 10
menit; tetapkan `0` untuk menonaktifkan). Proses tertanam sekali jalan seperti probe auth,
pembuatan slug, dan permintaan recall active-memory dibersihkan saat proses berakhir agar child stdio
dan stream Streamable HTTP/SSE tidak hidup lebih lama dari proses tersebut.

## Batasan

- **Tidak ada panggilan alat OpenClaw langsung.** OpenClaw tidak menyuntikkan panggilan alat ke
  protokol backend CLI. Backend hanya melihat alat gateway saat mereka memilih
  `bundleMcp: true`.
- **Streaming bersifat spesifik backend.** Beberapa backend melakukan streaming JSONL; yang lain melakukan buffer
  hingga keluar.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibandingkan proses awal `--json`. Sesi OpenClaw tetap berfungsi
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

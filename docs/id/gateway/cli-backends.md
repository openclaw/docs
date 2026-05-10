---
read_when:
    - Anda menginginkan fallback yang andal saat penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat bagian belakang CLI
summary: 'Backend CLI: cadangan CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-05-10T19:33:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback hanya teks** saat penyedia API sedang tidak aktif,
dibatasi laju, atau sementara berperilaku tidak semestinya. Ini sengaja dibuat konservatif:

- **Tool OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima tool gateway melalui jembatan MCP loopback.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (sehingga giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman**, bukan jalur utama. Gunakan saat Anda
menginginkan respons teks yang "selalu berfungsi" tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness lengkap dengan kontrol sesi ACP, tugas latar belakang,
pengikatan thread/percakapan, dan sesi pengodean eksternal persisten, gunakan
[Agen ACP](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

<Tip>
  Membuat plugin backend baru? Gunakan
  [Plugin backend CLI](/id/plugins/cli-backend-plugins). Halaman ini untuk pengguna
  yang mengonfigurasi dan mengoperasikan backend yang sudah terdaftar.
</Tip>

## Mulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, tambahkan hanya
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

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada
host gateway, OpenClaw sekarang otomatis memuat plugin bawaan pemiliknya saat konfigurasi Anda
secara eksplisit merujuk backend tersebut dalam ref model atau di bawah
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

## Ringkasan konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri diberi kunci berdasarkan **id penyedia** (mis. `codex-cli`, `my-cli`).
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

1. **Memilih backend** berdasarkan prefiks penyedia (`codex-cli/...`).
2. **Membangun prompt sistem** menggunakan prompt OpenClaw + konteks workspace yang sama.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend `claude-cli` bawaan mempertahankan proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks akhir.
5. **Menyimpan id sesi secara persisten** per backend, sehingga lanjutan memakai ulang sesi CLI yang sama.

<Note>
Backend Anthropic `claude-cli` bawaan didukung lagi. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan
penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend OpenAI `codex-cli` bawaan meneruskan prompt sistem OpenClaw melalui
override konfigurasi `model_instructions_file` milik Codex (`-c
model_instructions_file="..."`). Codex tidak mengekspos flag bergaya Claude
`--append-system-prompt`, sehingga OpenClaw menulis prompt yang sudah dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

Backend Anthropic `claude-cli` bawaan menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw ringkas dalam prompt sistem yang ditambahkan, dan
plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agen/sesi itu, sehingga resolver skill native Claude Code
melihat set terfilter yang sama seperti yang sebaliknya akan diiklankan OpenClaw dalam
prompt. Override env/API key Skill tetap diterapkan oleh OpenClaw ke
lingkungan proses anak untuk eksekusi tersebut.

Claude CLI juga memiliki mode izin noninteraktifnya sendiri. OpenClaw memetakannya
ke kebijakan exec yang ada alih-alih menambahkan konfigurasi khusus Claude: saat
kebijakan exec efektif yang diminta adalah YOLO (`tools.exec.security: "full"` dan
`tools.exec.ask: "off"`), OpenClaw menambahkan `--permission-mode bypassPermissions`.
Pengaturan `agents.list[].tools.exec` per agen menimpa `tools.exec` global untuk
agen tersebut. Untuk memaksa mode Claude yang berbeda, tetapkan arg backend mentah eksplisit
seperti `--permission-mode default` atau `--permission-mode acceptEdits` di bawah
`agents.defaults.cliBackends.claude-cli.args` dan `resumeArgs` yang cocok.

Backend Anthropic `claude-cli` bawaan juga memetakan level `/think` OpenClaw
ke flag native `--effort` Claude Code untuk level selain off. `minimal` dan
`low` dipetakan ke `low`, `adaptive` dan `medium` dipetakan ke `medium`, dan `high`,
`xhigh`, serta `max` dipetakan secara langsung. Backend CLI lain memerlukan plugin pemiliknya untuk
mendeklarasikan pemetaan argv yang setara sebelum `/think` dapat memengaruhi CLI yang dijalankan.

Sebelum OpenClaw dapat menggunakan backend `claude-cli` bawaan, Claude Code sendiri
harus sudah login di host yang sama:

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
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang disimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah ada yang disimpan.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran lanjutan memakai ulang proses Claude langsung saat
  proses itu aktif. Stdio hangat sekarang menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan field transport. Jika Gateway dimulai ulang atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang disimpan. Id sesi yang disimpan
  diverifikasi terhadap transcript proyek yang ada dan dapat dibaca sebelum
  resume, sehingga binding semu dibersihkan dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi live Claude mempertahankan guard output JSONL terbatas. Default mengizinkan hingga
  8 MiB dan 20.000 baris JSONL mentah per giliran. Giliran Claude yang banyak menggunakan tool dapat menaikkannya
  per backend dengan
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  dan `maxTurnLines`; OpenClaw membatasi pengaturan tersebut ke 64 MiB dan 100.000
  baris.
- Sesi CLI tersimpan adalah kontinuitas milik penyedia. Reset sesi harian implisit
  tidak memutuskannya; `/reset` dan kebijakan `session.reset` eksplisit tetap
  melakukannya.
- Sesi CLI baru biasanya hanya disemai ulang dari ringkasan Compaction OpenClaw
  ditambah ekor pasca-Compaction. Untuk memulihkan sesi singkat yang dibuat tidak valid
  sebelum Compaction, backend dapat ikut serta dengan
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw tetap menjaga reseed transcript mentah
  tetap terbatas dan membatasinya pada invalidasi aman seperti transcript CLI yang hilang,
  perubahan system-prompt/MCP, atau percobaan ulang session-expired; perubahan profil auth
  atau credential-epoch tidak pernah menyemai ulang riwayat transcript mentah.

Catatan serialisasi:

- `serialize: true` menjaga eksekusi pada lane yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lane penyedia.
- OpenClaw membatalkan penggunaan ulang sesi CLI tersimpan saat identitas auth yang dipilih berubah,
  termasuk id profil auth, API key statis, token statis, atau identitas akun OAuth
  yang berubah saat CLI mengeksposnya. Rotasi token akses dan refresh OAuth
  tidak memutus sesi CLI tersimpan. Jika CLI tidak mengekspos id akun OAuth
  yang stabil, OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Prelude fallback dari sesi claude-cli

Saat upaya `claude-cli` gagal lalu berpindah ke kandidat non-CLI dalam
[`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw menyemai
upaya berikutnya dengan prelude konteks yang dipanen dari transcript JSONL lokal Claude Code
di `~/.claude/projects/`. Tanpa seed ini, penyedia fallback
akan mulai dingin karena transcript sesi milik OpenClaw sendiri kosong
untuk eksekusi `claude-cli`.

- Prelude mengutamakan ringkasan `/compact` atau marker `compact_boundary`
  terbaru, lalu menambahkan giliran pasca-boundary terbaru hingga batas
  karakter. Giliran pra-boundary dibuang karena ringkasan sudah mewakilinya.
- Blok tool digabung menjadi petunjuk ringkas `(tool call: name)` dan
  `(tool result: …)` untuk menjaga anggaran prompt tetap jujur. Ringkasan
  diberi label `(truncated)` jika melampaui batas.
- Fallback `claude-cli` ke `claude-cli` pada penyedia yang sama mengandalkan
  `--resume` milik Claude sendiri dan melewati prelude.
- Seed memakai ulang validasi path file sesi Claude yang ada, sehingga
  path sembarang tidak dapat dibaca.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, tetapkan `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` ditetapkan, path tersebut
diteruskan sebagai arg CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (injeksi path), yang cukup untuk CLI yang secara otomatis
memuat file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` saat `usage` hilang atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen akhir beserta pengenal sesi
  jika ada.
- `output: "text"` memperlakukan stdout sebagai respons akhir.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai arg CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` ditetapkan, stdin digunakan.

## Default (milik plugin)

Plugin OpenAI bawaan juga mendaftarkan default untuk `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google yang dibundel juga mendaftarkan default untuk `google-gemini-cli`:

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

- Teks balasan dibaca dari kolom JSON `response`.
- Penggunaan fallback ke `stats` saat `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Timpa hanya jika diperlukan (umumnya: path `command` absolut).

## Default milik Plugin

Default backend CLI kini menjadi bagian dari permukaan Plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks penyedia dalam ref model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default Plugin.
- Pembersihan konfigurasi spesifik backend tetap dimiliki Plugin melalui hook
  `normalizeConfig` opsional.

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
penanda kontrolnya sendiri dan pengiriman kanal.

Untuk CLI yang memancarkan JSONL yang kompatibel dengan Claude Code stream-json, tetapkan
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Overlay MCP bundel

Backend CLI **tidak** menerima pemanggilan alat OpenClaw secara langsung, tetapi sebuah backend dapat
memilih ikut serta dalam overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bundel saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: penimpaan konfigurasi inline untuk `mcp_servers`; server
  loopback OpenClaw yang dihasilkan ditandai dengan mode persetujuan alat per-server Codex
  sehingga panggilan MCP tidak dapat tertahan pada prompt persetujuan lokal
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat MCP bundel diaktifkan, OpenClaw:

- memunculkan server MCP HTTP loopback yang mengekspos alat Gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke konteks sesi, akun, dan kanal saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari ekstensi pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat saat sebuah
backend memilih ikut serta dalam MCP bundel agar proses latar belakang tetap terisolasi.

Runtime MCP bundel yang dibatasi sesi disimpan dalam cache untuk digunakan kembali dalam satu sesi, lalu
dipanen setelah `mcp.sessionIdleTtlMs` milidetik waktu idle (default 10
menit; tetapkan `0` untuk menonaktifkan). Proses sekali jalan yang disematkan seperti probe auth,
pembuatan slug, dan permintaan recall active-memory membersihkan saat run berakhir sehingga
anak stdio dan stream Streamable HTTP/SSE tidak tetap hidup setelah run.

## Batasan

- **Tidak ada pemanggilan alat OpenClaw langsung.** OpenClaw tidak menyuntikkan pemanggilan alat ke dalam
  protokol backend CLI. Backend hanya melihat alat Gateway saat mereka memilih ikut serta dalam
  `bundleMcp: true`.
- **Streaming bersifat spesifik backend.** Beberapa backend mengalirkan JSONL; yang lain melakukan buffer
  hingga keluar.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibandingkan run awal `--json`. Sesi OpenClaw tetap bekerja
  secara normal.

## Pemecahan Masalah

- **CLI tidak ditemukan**: tetapkan `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kesinambungan sesi**: pastikan `sessionArg` ditetapkan dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat dilanjutkan dengan output JSON).
- **Gambar diabaikan**: tetapkan `imageArg` (dan verifikasi bahwa CLI mendukung path file).

## Terkait

- [Runbook Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)

---
read_when:
    - Anda menginginkan fallback yang andal saat penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-05-06T09:10:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **jalur cadangan hanya teks** saat penyedia API sedang tidak aktif,
terkena pembatasan laju, atau sementara berperilaku tidak semestinya. Ini sengaja dibuat konservatif:

- **Alat OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat gateway melalui jembatan MCP loopback.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (sehingga giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman**, bukan jalur utama. Gunakan saat Anda
menginginkan respons teks yang "selalu berfungsi" tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness lengkap dengan kontrol sesi ACP, tugas latar belakang,
pengikatan thread/percakapan, dan sesi coding eksternal yang persisten, gunakan
[ACP Agents](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

## Mulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (Plugin OpenAI bawaan
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

Itu saja. Tidak perlu kunci, tidak perlu konfigurasi auth tambahan selain CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada
host gateway, OpenClaw sekarang memuat otomatis Plugin bawaan pemiliknya saat konfigurasi Anda
secara eksplisit merujuk backend tersebut dalam referensi model atau di bawah
`agents.defaults.cliBackends`.

## Menggunakannya sebagai cadangan

Tambahkan backend CLI ke daftar cadangan Anda agar hanya berjalan saat model utama gagal:

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

## Gambaran umum konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri diberi kunci oleh **id penyedia** (mis. `codex-cli`, `my-cli`).
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
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend `claude-cli` bawaan mempertahankan proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks akhir.
5. **Menyimpan id sesi** per backend, sehingga giliran lanjutan menggunakan kembali sesi CLI yang sama.

<Note>
Backend Anthropic `claude-cli` bawaan kembali didukung. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw kembali diizinkan, jadi OpenClaw memperlakukan
penggunaan `claude -p` sebagai penggunaan yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend OpenAI `codex-cli` bawaan meneruskan prompt sistem OpenClaw melalui
override konfigurasi `model_instructions_file` Codex (`-c
model_instructions_file="..."`). Codex tidak mengekspos flag bergaya Claude
`--append-system-prompt`, jadi OpenClaw menulis prompt yang dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

Backend Anthropic `claude-cli` bawaan menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw yang ringkas di prompt sistem yang ditambahkan, dan
Plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agent/sesi itu, sehingga resolver skill native Claude Code
melihat set terfilter yang sama seperti yang sebaliknya akan diiklankan OpenClaw di
prompt. Override env/kunci API skill tetap diterapkan oleh OpenClaw ke
environment proses anak untuk run tersebut.

Claude CLI juga memiliki mode izin noninteraktifnya sendiri. OpenClaw memetakan itu
ke kebijakan exec yang ada alih-alih menambahkan konfigurasi khusus Claude: saat
kebijakan exec efektif yang diminta adalah YOLO (`tools.exec.security: "full"` dan
`tools.exec.ask: "off"`), OpenClaw menambahkan `--permission-mode bypassPermissions`.
Pengaturan per-agent `agents.list[].tools.exec` mengesampingkan `tools.exec` global untuk
agent tersebut. Untuk memaksa mode Claude yang berbeda, tetapkan arg backend mentah eksplisit
seperti `--permission-mode default` atau `--permission-mode acceptEdits` di bawah
`agents.defaults.cliBackends.claude-cli.args` dan `resumeArgs` yang sesuai.

Backend Anthropic `claude-cli` bawaan juga memetakan level `/think` OpenClaw
ke flag native Claude Code `--effort` untuk level yang bukan off. `minimal` dan
`low` dipetakan ke `low`, `adaptive` dan `medium` dipetakan ke `medium`, dan `high`,
`xhigh`, serta `max` dipetakan langsung. Backend CLI lain memerlukan Plugin pemiliknya untuk
mendeklarasikan mapper argv yang setara sebelum `/think` dapat memengaruhi CLI yang dijalankan.

Sebelum OpenClaw dapat menggunakan backend `claude-cli` bawaan, Claude Code itu sendiri
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
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya ada yang tersimpan.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran lanjutan menggunakan kembali proses Claude live saat
  aktif. Stdio hangat sekarang menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan kolom transport. Jika Gateway restart atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi
  tersimpan diverifikasi terhadap transkrip proyek yang ada dan dapat dibaca sebelum
  resume, sehingga binding semu dibersihkan dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi live Claude mempertahankan guard output JSONL terbatas. Default mengizinkan hingga
  8 MiB dan 20.000 baris JSONL mentah per giliran. Giliran Claude yang berat alat dapat menaikkannya
  per backend dengan
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
  termasuk id profil auth yang berubah, kunci API statis, token statis, atau identitas
  akun OAuth saat CLI mengeksposnya. Rotasi token akses dan refresh OAuth
  tidak memotong sesi CLI tersimpan. Jika CLI tidak mengekspos id akun OAuth yang
  stabil, OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Prelude cadangan dari sesi claude-cli

Saat percobaan `claude-cli` beralih gagal ke kandidat non-CLI di
[`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw menyemai
percobaan berikutnya dengan prelude konteks yang dipanen dari transkrip JSONL lokal
Claude Code di `~/.claude/projects/`. Tanpa seed ini, penyedia cadangan
akan mulai dingin karena transkrip sesi OpenClaw sendiri kosong
untuk run `claude-cli`.

- Prelude memilih ringkasan `/compact` terbaru atau penanda `compact_boundary`,
  lalu menambahkan giliran pasca-boundary terbaru hingga batas anggaran karakter.
  Giliran pra-boundary dibuang karena ringkasan sudah merepresentasikannya.
- Blok alat digabungkan menjadi petunjuk ringkas `(tool call: name)` dan
  `(tool result: …)` agar anggaran prompt tetap jujur. Ringkasan diberi label
  `(truncated)` jika meluap.
- Cadangan `claude-cli` ke `claude-cli` dengan penyedia yang sama mengandalkan
  `--resume` milik Claude dan melewati prelude.
- Seed menggunakan kembali validasi path file sesi Claude yang ada, sehingga
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
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agent akhir plus pengenal sesi
  saat tersedia.
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

Prasyarat: Gemini CLI lokal harus terpasang dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari kolom JSON `response`.
- Penggunaan kembali ke `stats` saat `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Override hanya jika diperlukan (umum: path absolut `command`).

## Default milik Plugin

Default backend CLI kini menjadi bagian dari permukaan plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks provider dalam referensi model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap mengesampingkan default plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki plugin melalui hook opsional
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
menulis ulang delta asisten yang dialirkan dan teks akhir yang diurai sebelum OpenClaw menangani
penanda kontrolnya sendiri dan pengiriman channel.

Untuk CLI yang menghasilkan JSONL yang kompatibel dengan Claude Code stream-json, tetapkan
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Overlay MCP bundle

Backend CLI **tidak** menerima panggilan tool OpenClaw secara langsung, tetapi backend dapat
memilih masuk ke overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bundle saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: override konfigurasi inline untuk `mcp_servers`; server loopback
  OpenClaw yang dihasilkan ditandai dengan mode persetujuan tool per-server milik Codex
  sehingga panggilan MCP tidak dapat terhenti pada prompt persetujuan lokal
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat MCP bundle diaktifkan, OpenClaw:

- menelurkan server MCP HTTP loopback yang mengekspos tool Gateway ke proses CLI
- mengautentikasi bridge dengan token per-sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses tool ke konteks sesi, akun, dan channel saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari ekstensi pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat saat
backend memilih masuk ke MCP bundle agar proses latar belakang tetap terisolasi.

Runtime MCP bundle yang dibatasi sesi disimpan dalam cache untuk digunakan ulang dalam satu sesi, lalu
dibersihkan setelah `mcp.sessionIdleTtlMs` milidetik waktu idle (default 10
menit; tetapkan `0` untuk menonaktifkan). Proses embedded sekali jalan seperti probe auth,
pembuatan slug, dan permintaan recall active-memory dibersihkan saat proses selesai sehingga turunan stdio
dan stream Streamable HTTP/SSE tidak hidup lebih lama dari proses tersebut.

## Batasan

- **Tidak ada panggilan tool OpenClaw langsung.** OpenClaw tidak menyuntikkan panggilan tool ke dalam
  protokol backend CLI. Backend hanya melihat tool Gateway saat memilih masuk ke
  `bundleMcp: true`.
- **Streaming khusus untuk tiap backend.** Beberapa backend mengalirkan JSONL; yang lain melakukan buffer
  hingga keluar.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibandingkan proses `--json` awal. Sesi OpenClaw tetap berfungsi
  secara normal.

## Pemecahan masalah

- **CLI tidak ditemukan**: tetapkan `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` ditetapkan dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat melanjutkan dengan output JSON).
- **Gambar diabaikan**: tetapkan `imageArg` (dan verifikasi CLI mendukung path file).

## Terkait

- [Runbook Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)

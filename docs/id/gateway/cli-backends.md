---
read_when:
    - Anda menginginkan mekanisme cadangan yang andal saat penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: cadangan CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-05-04T18:23:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback hanya teks** saat penyedia API sedang tidak aktif,
terkena batas laju, atau sementara tidak berperilaku semestinya. Ini sengaja dibuat konservatif:

- **Alat OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat Gateway melalui jembatan MCP loopback.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (jadi giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima jalur gambar.

Ini dirancang sebagai **jaring pengaman**, bukan jalur utama. Gunakan saat Anda
menginginkan respons teks yang “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness lengkap dengan kontrol sesi ACP, tugas latar belakang,
pengikatan utas/percakapan, dan sesi coding eksternal yang persisten, gunakan
[ACP Agents](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

## Mulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (Plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jika Gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, cukup tambahkan
jalur perintah:

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
host Gateway, OpenClaw sekarang memuat otomatis Plugin bawaan pemiliknya saat konfigurasi Anda
secara eksplisit mereferensikan backend tersebut dalam referensi model atau di bawah
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

Setiap entri diberi kunci oleh **id penyedia** (misalnya `codex-cli`, `my-cli`).
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
2. **Membangun prompt sistem** menggunakan prompt OpenClaw + konteks workspace yang sama.
3. **Mengeksekusi CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend `claude-cli` bawaan mempertahankan proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks akhir.
5. **Menyimpan id sesi** per backend, sehingga giliran lanjutan menggunakan ulang sesi CLI yang sama.

<Note>
Backend Anthropic `claude-cli` bawaan didukung lagi. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI ala OpenClaw diizinkan lagi, jadi OpenClaw memperlakukan
penggunaan `claude -p` sebagai penggunaan yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend OpenAI `codex-cli` bawaan meneruskan prompt sistem OpenClaw melalui
override konfigurasi `model_instructions_file` milik Codex (`-c
model_instructions_file="..."`). Codex tidak mengekspos flag ala Claude
`--append-system-prompt`, jadi OpenClaw menulis prompt yang sudah dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

Backend Anthropic `claude-cli` bawaan menerima snapshot Skills OpenClaw
melalui dua cara: katalog Skills OpenClaw ringkas dalam prompt sistem yang ditambahkan, dan
Plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agen/sesi tersebut, sehingga resolver skill native Claude Code
melihat kumpulan terfilter yang sama seperti yang sebaliknya akan diiklankan OpenClaw dalam
prompt. Override env/kunci API skill tetap diterapkan oleh OpenClaw ke
lingkungan proses anak untuk proses berjalan tersebut.

Claude CLI juga memiliki mode izin noninteraktifnya sendiri. OpenClaw memetakannya
ke kebijakan exec yang ada alih-alih menambahkan konfigurasi khusus Claude: saat
kebijakan exec efektif yang diminta adalah YOLO (`tools.exec.security: "full"` dan
`tools.exec.ask: "off"`), OpenClaw menambahkan `--permission-mode bypassPermissions`.
Pengaturan per agen `agents.list[].tools.exec` menimpa `tools.exec` global untuk
agen tersebut. Untuk memaksa mode Claude yang berbeda, tetapkan arg backend mentah eksplisit
seperti `--permission-mode default` atau `--permission-mode acceptEdits` di bawah
`agents.defaults.cliBackends.claude-cli.args` dan `resumeArgs` yang cocok.

Backend Anthropic `claude-cli` bawaan juga memetakan level OpenClaw `/think`
ke flag native Claude Code `--effort` untuk level yang bukan off. `minimal` dan
`low` dipetakan ke `low`, `adaptive` dan `medium` dipetakan ke `medium`, dan `high`,
`xhigh`, serta `max` dipetakan langsung. Backend CLI lain memerlukan Plugin pemiliknya untuk
mendeklarasikan pemeta argv yang setara sebelum `/think` dapat memengaruhi CLI yang dibuat.

Sebelum OpenClaw dapat menggunakan backend `claude-cli` bawaan, Claude Code itu sendiri
harus sudah login di host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Gunakan `agents.defaults.cliBackends.claude-cli.command` hanya saat biner `claude`
belum ada di `PATH`.

## Sesi

- Jika CLI mendukung sesi, tetapkan `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) saat ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag berbeda, tetapkan
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan secara opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah ada yang tersimpan.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran lanjutan menggunakan ulang proses Claude aktif saat
  masih aktif. Stdio hangat kini menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan kolom transport. Jika Gateway dimulai ulang atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi
  tersimpan diverifikasi terhadap transkrip proyek yang ada dan dapat dibaca sebelum
  resume, sehingga pengikatan bayangan dibersihkan dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi langsung Claude mempertahankan penjaga output JSONL berbatas. Default mengizinkan hingga
  8 MiB dan 20.000 baris JSONL mentah per giliran. Giliran Claude yang berat alat dapat menaikkannya
  per backend dengan
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  dan `maxTurnLines`; OpenClaw membatasi pengaturan tersebut ke 64 MiB dan 100.000
  baris.
- Sesi CLI tersimpan adalah kontinuitas milik penyedia. Reset sesi harian implisit
  tidak memotongnya; `/reset` dan kebijakan `session.reset` eksplisit tetap
  melakukannya.

Catatan serialisasi:

- `serialize: true` menjaga proses berjalan pada lane yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lane penyedia.
- OpenClaw membatalkan penggunaan ulang sesi CLI tersimpan saat identitas auth yang dipilih berubah,
  termasuk id profil auth yang berubah, kunci API statis, token statis, atau identitas
  akun OAuth saat CLI mengeksposnya. Rotasi token akses dan refresh OAuth
  tidak memotong sesi CLI tersimpan. Jika CLI tidak mengekspos
  id akun OAuth yang stabil, OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Prelude fallback dari sesi claude-cli

Saat upaya `claude-cli` beralih gagal ke kandidat non-CLI dalam
[`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw menyemai
upaya berikutnya dengan prelude konteks yang dipanen dari transkrip JSONL lokal
Claude Code di `~/.claude/projects/`. Tanpa seed ini, penyedia fallback
akan mulai dari nol karena transkrip sesi OpenClaw sendiri kosong
untuk proses berjalan `claude-cli`.

- Prelude memilih ringkasan `/compact` terbaru atau penanda `compact_boundary`
  terlebih dahulu, lalu menambahkan giliran pascabatas terbaru hingga anggaran
  karakter. Giliran prabatas dibuang karena ringkasan sudah merepresentasikannya.
- Blok alat digabung menjadi petunjuk ringkas `(tool call: name)` dan
  `(tool result: …)` untuk menjaga anggaran prompt tetap jujur. Ringkasan diberi label
  `(truncated)` jika meluap.
- Fallback sesama penyedia `claude-cli` ke `claude-cli` mengandalkan `--resume`
  milik Claude sendiri dan melewati prelude.
- Seed menggunakan ulang validasi jalur file sesi Claude yang ada, sehingga
  jalur arbitrer tidak dapat dibaca.

## Gambar (pass-through)

Jika CLI Anda menerima jalur gambar, tetapkan `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file temp. Jika `imageArg` disetel, jalur tersebut
diteruskan sebagai arg CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
jalur file ke prompt (injeksi jalur), yang cukup untuk CLI yang otomatis
memuat file lokal dari jalur biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen akhir plus pengenal sesi
  saat ada.
- `output: "text"` memperlakukan stdout sebagai respons akhir.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai arg CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` disetel, stdin digunakan.

## Default (dimiliki Plugin)

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

Prasyarat: Gemini CLI lokal harus sudah terpasang dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari bidang JSON `response`.
- Penggunaan menggunakan fallback ke `stats` ketika `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Timpa hanya jika diperlukan (umum: path `command` absolut).

## Default milik Plugin

Default backend CLI kini menjadi bagian dari permukaan plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks penyedia dalam referensi model.
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
menulis ulang delta asisten yang dialirkan dan teks akhir yang diurai sebelum OpenClaw menangani
penanda kontrolnya sendiri dan pengiriman channel.

Untuk CLI yang mengeluarkan JSONL yang kompatibel dengan Claude Code stream-json, tetapkan
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Overlay MCP Bundel

Backend CLI **tidak** menerima panggilan alat OpenClaw secara langsung, tetapi backend dapat
ikut menggunakan overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bundel saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: penimpaan konfigurasi inline untuk `mcp_servers`; server loopback
  OpenClaw yang dihasilkan ditandai dengan mode persetujuan alat per server milik Codex
  sehingga panggilan MCP tidak dapat terhenti pada prompt persetujuan lokal
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Ketika MCP bundel diaktifkan, OpenClaw:

- memunculkan server MCP HTTP loopback yang mengekspos alat gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke konteks sesi, akun, dan channel saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari ekstensi pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat ketika
backend ikut menggunakan MCP bundel agar eksekusi latar belakang tetap terisolasi.

Runtime MCP bundel yang dibatasi per sesi di-cache untuk digunakan ulang dalam satu sesi, lalu
dibersihkan setelah `mcp.sessionIdleTtlMs` milidetik waktu idle (default 10
menit; tetapkan `0` untuk menonaktifkan). Eksekusi tertanam sekali pakai seperti probe auth,
pembuatan slug, dan recall active-memory meminta pembersihan pada akhir eksekusi agar turunan stdio
dan aliran Streamable HTTP/SSE tidak hidup lebih lama dari eksekusi.

## Batasan

- **Tidak ada panggilan alat OpenClaw langsung.** OpenClaw tidak menyuntikkan panggilan alat ke dalam
  protokol backend CLI. Backend hanya melihat alat gateway ketika ikut menggunakan
  `bundleMcp: true`.
- **Streaming khusus untuk setiap backend.** Sebagian backend mengalirkan JSONL; yang lain melakukan buffer
  hingga keluar.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibandingkan eksekusi awal `--json`. Sesi OpenClaw tetap berfungsi
  normal.

## Pemecahan Masalah

- **CLI tidak ditemukan**: tetapkan `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` ditetapkan dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat melanjutkan dengan output JSON).
- **Gambar diabaikan**: tetapkan `imageArg` (dan verifikasi CLI mendukung path file).

## Terkait

- [Runbook Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)

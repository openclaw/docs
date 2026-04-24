---
read_when:
    - Anda menginginkan fallback yang andal saat provider API gagal
    - Anda sedang menjalankan Codex CLI atau AI CLI lokal lain dan ingin menggunakannya kembali
    - Anda ingin memahami bridge loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback AI CLI lokal dengan bridge alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-24T09:06:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime fallback)

OpenClaw dapat menjalankan **AI CLI lokal** sebagai **fallback hanya-teks** ketika provider API sedang down,
terkena rate limit, atau sementara bermasalah. Ini sengaja dibuat konservatif:

- **Alat OpenClaw tidak disisipkan langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat gateway melalui bridge loopback MCP.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (agar giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman** alih-alih jalur utama. Gunakan saat Anda
menginginkan respons teks yang “selalu berhasil” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
binding thread/percakapan, dan sesi coding eksternal persisten, gunakan
[Agen ACP](/id/tools/acp-agents). Backend CLI bukan ACP.

## Mulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (Plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, cukup tambahkan
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

Selesai. Tidak perlu key, tidak perlu konfigurasi auth tambahan di luar CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **provider pesan utama** di
host gateway, OpenClaw sekarang otomatis memuat Plugin bawaan pemilik ketika konfigurasi Anda
secara eksplisit merujuk backend tersebut dalam referensi model atau di bawah
`agents.defaults.cliBackends`.

## Menggunakannya sebagai fallback

Tambahkan backend CLI ke daftar fallback agar hanya berjalan saat model utama gagal:

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

- Jika Anda menggunakan `agents.defaults.models` (allowlist), Anda juga harus menyertakan model backend CLI di sana.
- Jika provider utama gagal (auth, rate limit, timeout), OpenClaw akan
  mencoba backend CLI berikutnya.

## Ikhtisar konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri diberi kunci oleh **id provider** (misalnya `codex-cli`, `my-cli`).
Id provider menjadi sisi kiri referensi model Anda:

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
          // CLI bergaya Codex bisa menunjuk ke file prompt sebagai gantinya:
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

1. **Memilih backend** berdasarkan prefix provider (`codex-cli/...`).
2. **Membangun system prompt** menggunakan prompt + konteks workspace OpenClaw yang sama.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend `claude-cli` bawaan mempertahankan proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks final.
5. **Menyimpan id sesi** per backend, sehingga giliran lanjutan menggunakan kembali sesi CLI yang sama.

<Note>
Backend `claude-cli` Anthropic bawaan kini didukung lagi. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan
penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend `codex-cli` OpenAI bawaan meneruskan system prompt OpenClaw melalui
override konfigurasi `model_instructions_file` Codex (`-c
model_instructions_file="..."`). Codex tidak menyediakan flag gaya Claude
`--append-system-prompt`, jadi OpenClaw menulis prompt yang telah dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

Backend `claude-cli` Anthropic bawaan menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw ringkas dalam system prompt yang ditambahkan, dan
Plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agen/sesi itu, sehingga resolver skill native Claude Code
melihat set terfilter yang sama yang seharusnya diiklankan OpenClaw dalam prompt.
Override env/API key Skill tetap diterapkan oleh OpenClaw ke environment proses anak untuk eksekusi tersebut.

Claude CLI juga memiliki mode izin noninteraktif sendiri. OpenClaw memetakannya
ke kebijakan exec yang ada alih-alih menambahkan konfigurasi khusus Claude: ketika
kebijakan exec efektif yang diminta adalah YOLO (`tools.exec.security: "full"` dan
`tools.exec.ask: "off"`), OpenClaw menambahkan `--permission-mode bypassPermissions`.
Pengaturan `agents.list[].tools.exec` per agen mengesampingkan `tools.exec` global untuk
agen tersebut. Untuk memaksa mode Claude berbeda, atur arg backend mentah eksplisit
seperti `--permission-mode default` atau `--permission-mode acceptEdits` di bawah
`agents.defaults.cliBackends.claude-cli.args` dan `resumeArgs` yang sesuai.

Sebelum OpenClaw dapat menggunakan backend `claude-cli` bawaan, Claude Code sendiri
harus sudah login di host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Gunakan `agents.defaults.cliBackends.claude-cli.command` hanya ketika biner `claude`
belum ada di `PATH`.

## Sesi

- Jika CLI mendukung sesi, atur `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) ketika ID perlu dimasukkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag berbeda, atur
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya pernah disimpan.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran lanjutan menggunakan kembali proses Claude live saat
  masih aktif. stdio hangat sekarang menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan field transport. Jika Gateway restart atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi yang tersimpan diverifikasi terhadap transkrip proyek yang ada dan dapat dibaca sebelum
  resume, sehingga binding bayangan dibersihkan dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi CLI tersimpan adalah kontinuitas yang dimiliki provider. Reset sesi harian implisit
  tidak memutuskannya; `/reset` dan kebijakan `session.reset` eksplisit tetap
  memutuskannya.

Catatan serialisasi:

- `serialize: true` menjaga urutan eksekusi pada lane yang sama.
- Sebagian besar CLI diserialkan pada satu lane provider.
- OpenClaw membuang penggunaan ulang sesi CLI yang tersimpan ketika identitas auth yang dipilih berubah,
  termasuk perubahan id profil auth, API key statis, token statis, atau identitas akun OAuth
  ketika CLI mengeksposnya. Rotasi access token dan refresh token OAuth
  tidak memutus sesi CLI yang tersimpan. Jika suatu CLI tidak mengekspos id akun OAuth
  yang stabil, OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, atur `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` diatur, path tersebut
diteruskan sebagai arg CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (path injection), yang cukup untuk CLI yang memuat otomatis
file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` ketika `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen final plus pengenal sesi ketika ada.
- `output: "text"` memperlakukan stdout sebagai respons final.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai arg CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` diatur, stdin digunakan.

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

Prasyarat: Gemini CLI lokal harus sudah terpasang dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari field JSON `response`.
- Penggunaan fallback ke `stats` ketika `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Override hanya jika diperlukan (umumnya: path `command` absolut).

## Default milik Plugin

Default backend CLI sekarang menjadi bagian dari permukaan Plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefix provider dalam referensi model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap mengesampingkan default Plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki Plugin melalui hook
  opsional `normalizeConfig`.

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

`input` menulis ulang system prompt dan user prompt yang diteruskan ke CLI. `output`
menulis ulang delta asisten yang di-stream dan teks final yang telah diurai sebelum OpenClaw menangani
marker kontrolnya sendiri dan pengiriman kanal.

Untuk CLI yang memancarkan JSONL yang kompatibel dengan stream-json Claude Code, atur
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Overlay MCP bundle

Backend CLI **tidak** menerima pemanggilan alat OpenClaw secara langsung, tetapi backend dapat
memilih masuk ke overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bawaan saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: override konfigurasi inline untuk `mcp_servers`; server loopback
  OpenClaw yang dihasilkan ditandai dengan mode persetujuan alat per-server milik Codex
  sehingga panggilan MCP tidak macet karena prompt persetujuan lokal
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat bundle MCP diaktifkan, OpenClaw:

- memunculkan server MCP HTTP loopback yang mengekspos alat gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke sesi, akun, dan konteks kanal saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari ekstensi pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyisipkan konfigurasi ketat ketika sebuah
backend memilih bundle MCP agar eksekusi latar belakang tetap terisolasi.

## Batasan

- **Tidak ada pemanggilan alat OpenClaw langsung.** OpenClaw tidak menyisipkan pemanggilan alat ke
  protokol backend CLI. Backend hanya melihat alat gateway ketika mereka memilih
  `bundleMcp: true`.
- **Streaming bersifat khusus backend.** Beberapa backend men-stream JSONL; yang lain menahan
  sampai proses keluar.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang
  kurang terstruktur dibandingkan eksekusi awal `--json`. Sesi OpenClaw tetap berfungsi
  normal.

## Pemecahan masalah

- **CLI tidak ditemukan**: atur `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` diatur dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat melanjutkan dengan output JSON).
- **Gambar diabaikan**: atur `imageArg` (dan verifikasi CLI mendukung path file).

## Terkait

- [Runbook Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)

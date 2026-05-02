---
read_when:
    - Anda menginginkan otomatisasi berbasis peristiwa untuk /new, /reset, /stop, dan peristiwa siklus hidup agen
    - Anda ingin membangun, menginstal, atau men-debug hook
summary: 'Kait: otomatisasi berbasis peristiwa untuk perintah dan peristiwa siklus hidup'
title: Kait
x-i18n:
    generated_at: "2026-05-02T20:41:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hook adalah skrip kecil yang berjalan ketika sesuatu terjadi di dalam Gateway. Hook dapat ditemukan dari direktori dan diperiksa dengan `openclaw hooks`. Gateway memuat hook internal hanya setelah Anda mengaktifkan hook atau mengonfigurasi setidaknya satu entri hook, paket hook, handler legacy, atau direktori hook tambahan.

Ada dua jenis hook di OpenClaw:

- **Hook internal** (halaman ini): berjalan di dalam Gateway ketika event agen dipicu, seperti `/new`, `/reset`, `/stop`, atau event siklus hidup.
- **Webhook**: endpoint HTTP eksternal yang memungkinkan sistem lain memicu pekerjaan di OpenClaw. Lihat [Webhook](/id/automation/cron-jobs#webhooks).

Hook juga dapat dibundel di dalam plugin. `openclaw hooks list` menampilkan hook mandiri dan hook yang dikelola plugin.

## Mulai cepat

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Jenis event

| Event                    | Kapan dipicu                                             |
| ------------------------ | -------------------------------------------------------- |
| `command:new`            | Perintah `/new` dikeluarkan                              |
| `command:reset`          | Perintah `/reset` dikeluarkan                            |
| `command:stop`           | Perintah `/stop` dikeluarkan                             |
| `command`                | Event perintah apa pun (listener umum)                   |
| `session:compact:before` | Sebelum compaction merangkum riwayat                     |
| `session:compact:after`  | Setelah compaction selesai                               |
| `session:patch`          | Ketika properti sesi diubah                              |
| `agent:bootstrap`        | Sebelum file bootstrap workspace disisipkan              |
| `gateway:startup`        | Setelah kanal dimulai dan hook dimuat                    |
| `gateway:shutdown`       | Ketika shutdown gateway dimulai                          |
| `gateway:pre-restart`    | Sebelum restart gateway yang diharapkan                  |
| `message:received`       | Pesan masuk dari kanal mana pun                          |
| `message:transcribed`    | Setelah transkripsi audio selesai                        |
| `message:preprocessed`   | Setelah prapemrosesan media dan tautan selesai atau dilewati |
| `message:sent`           | Pesan keluar terkirim                                    |

## Menulis hook

### Struktur hook

Setiap hook adalah direktori yang berisi dua file:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Format HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Kolom metadata** (`metadata.openclaw`):

| Kolom      | Deskripsi                                            |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji tampilan untuk CLI                             |
| `events`   | Array event yang akan didengarkan                    |
| `export`   | Named export yang digunakan (default ke `"default"`) |
| `os`       | Platform yang diperlukan (misalnya, `["darwin", "linux"]`) |
| `requires` | Path `bins`, `anyBins`, `env`, atau `config` yang diperlukan |
| `always`   | Lewati pemeriksaan kelayakan (boolean)               |
| `install`  | Metode instalasi                                     |

### Implementasi handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Setiap event mencakup: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push untuk mengirim ke pengguna), dan `context` (data khusus event). Konteks hook plugin agen dan alat juga dapat menyertakan `trace`, konteks trace diagnostik kompatibel W3C yang hanya-baca yang dapat diteruskan plugin ke log terstruktur untuk korelasi OTEL.

### Sorotan konteks event

**Event perintah** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Event pesan** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (data khusus penyedia termasuk `senderId`, `senderName`, `guildId`). `context.content` memprioritaskan body perintah yang tidak kosong untuk pesan mirip perintah, lalu fallback ke body masuk mentah dan body generik; ini tidak menyertakan pengayaan khusus agen seperti riwayat thread atau ringkasan tautan.

**Event pesan** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Event pesan** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Event pesan** (`message:preprocessed`): `context.bodyForAgent` (body akhir yang diperkaya), `context.from`, `context.channelId`.

**Event bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutable), `context.agentId`.

**Event patch sesi** (`session:patch`): `context.sessionEntry`, `context.patch` (hanya kolom yang berubah), `context.cfg`. Hanya klien dengan hak istimewa yang dapat memicu event patch.

**Event Compaction**: `session:compact:before` menyertakan `messageCount`, `tokenCount`. `session:compact:after` menambahkan `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` mengamati pengguna yang mengeluarkan `/stop`; ini adalah siklus hidup pembatalan/perintah, bukan gerbang finalisasi agen. Plugin yang perlu memeriksa jawaban akhir alami dan meminta agen melakukan satu pass lagi sebaiknya menggunakan hook plugin bertipe `before_agent_finalize`. Lihat [Hook plugin](/id/plugins/hooks).

**Event siklus hidup Gateway**: `gateway:shutdown` menyertakan `reason` dan `restartExpectedMs` serta dipicu ketika shutdown gateway dimulai. `gateway:pre-restart` menyertakan konteks yang sama tetapi hanya dipicu ketika shutdown merupakan bagian dari restart yang diharapkan dan nilai `restartExpectedMs` terbatas diberikan. Selama shutdown, setiap penantian hook siklus hidup bersifat best-effort dan dibatasi sehingga shutdown tetap berlanjut jika handler macet.

## Penemuan hook

Hook ditemukan dari direktori berikut, dalam urutan presedensi override yang meningkat:

1. **Hook bawaan**: dikirim bersama OpenClaw
2. **Hook plugin**: hook yang dibundel di dalam plugin yang terinstal
3. **Hook terkelola**: `~/.openclaw/hooks/` (diinstal pengguna, dibagikan lintas workspace). Direktori tambahan dari `hooks.internal.load.extraDirs` menggunakan presedensi ini.
4. **Hook workspace**: `<workspace>/hooks/` (per agen, dinonaktifkan secara default hingga diaktifkan secara eksplisit)

Hook workspace dapat menambahkan nama hook baru tetapi tidak dapat menimpa hook bawaan, terkelola, atau yang disediakan plugin dengan nama yang sama.

Gateway melewati penemuan hook internal saat startup hingga hook internal dikonfigurasi. Aktifkan hook bawaan atau terkelola dengan `openclaw hooks enable <name>`, instal paket hook, atau tetapkan `hooks.internal.enabled=true` untuk ikut serta. Ketika Anda mengaktifkan satu hook bernama, Gateway hanya memuat handler hook tersebut; `hooks.internal.enabled=true`, direktori hook tambahan, dan handler legacy ikut serta dalam penemuan luas.

### Paket hook

Paket hook adalah paket npm yang mengekspor hook melalui `openclaw.hooks` di `package.json`. Instal dengan:

```bash
openclaw plugins install <path-or-spec>
```

Spesifikasi Npm hanya registri (nama paket + versi persis opsional atau dist-tag). Spesifikasi Git/URL/file dan rentang semver ditolak.

## Hook bawaan

| Hook                  | Peristiwa                      | Fungsinya                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Menyimpan konteks sesi ke `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`              | Menyuntikkan file bootstrap tambahan dari pola glob   |
| command-logger        | `command`                      | Mencatat semua perintah ke `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Menjalankan `BOOT.md` saat Gateway dimulai            |

Aktifkan hook bawaan apa pun:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detail session-memory

Mengekstrak 15 pesan pengguna/asisten terakhir, menghasilkan slug nama file deskriptif melalui LLM, dan menyimpan ke `<workspace>/memory/YYYY-MM-DD-slug.md` menggunakan tanggal lokal host. Memerlukan `workspace.dir` untuk dikonfigurasi.

<a id="bootstrap-extra-files"></a>

### Konfigurasi bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Path diselesaikan relatif terhadap workspace. Hanya nama dasar bootstrap yang dikenali yang dimuat (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detail command-logger

Mencatat setiap perintah slash ke `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detail boot-md

Menjalankan `BOOT.md` dari workspace aktif saat Gateway dimulai.

## Hook Plugin

Plugin dapat mendaftarkan hook bertipe melalui Plugin SDK untuk integrasi yang lebih mendalam:
mencegat panggilan alat, memodifikasi prompt, mengontrol alur pesan, dan lainnya.
Gunakan hook Plugin saat Anda memerlukan `before_tool_call`, `before_agent_reply`,
`before_install`, atau hook siklus hidup dalam proses lainnya.

Untuk referensi lengkap hook Plugin, lihat [Hook Plugin](/id/plugins/hooks).

## Konfigurasi

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Variabel lingkungan per hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Direktori hook tambahan:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Format konfigurasi array lama `hooks.internal.handlers` masih didukung untuk kompatibilitas mundur, tetapi hook baru sebaiknya menggunakan sistem berbasis penemuan.
</Note>

## Referensi CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Praktik terbaik

- **Jaga handler tetap cepat.** Hook berjalan selama pemrosesan perintah. Jalankan pekerjaan berat secara fire-and-forget dengan `void processInBackground(event)`.
- **Tangani error dengan baik.** Bungkus operasi berisiko dalam try/catch; jangan throw agar handler lain dapat berjalan.
- **Filter peristiwa sejak awal.** Segera return jika tipe/tindakan peristiwa tidak relevan.
- **Gunakan kunci peristiwa spesifik.** Lebih suka `"events": ["command:new"]` daripada `"events": ["command"]` untuk mengurangi overhead.

## Pemecahan masalah

### Hook tidak ditemukan

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook tidak memenuhi syarat

```bash
openclaw hooks info my-hook
```

Periksa biner yang hilang (PATH), variabel lingkungan, nilai konfigurasi, atau kompatibilitas OS.

### Hook tidak dijalankan

1. Pastikan hook diaktifkan: `openclaw hooks list`
2. Mulai ulang proses Gateway Anda agar hook dimuat ulang.
3. Periksa log Gateway: `./scripts/clawlog.sh | grep hook`

## Terkait

- [Referensi CLI: hooks](/id/cli/hooks)
- [Webhook](/id/automation/cron-jobs#webhooks)
- [Hook Plugin](/id/plugins/hooks) — hook siklus hidup Plugin di dalam proses
- [Konfigurasi](/id/gateway/configuration-reference#hooks)

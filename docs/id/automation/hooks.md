---
read_when:
    - Anda menginginkan otomatisasi berbasis peristiwa untuk /new, /reset, /stop, dan peristiwa siklus hidup agen
    - Anda ingin membangun, menginstal, atau men-debug hook
summary: 'Hook: otomatisasi berbasis peristiwa untuk perintah dan peristiwa siklus hidup'
title: Kait
x-i18n:
    generated_at: "2026-05-05T08:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Hooks adalah skrip kecil yang berjalan ketika sesuatu terjadi di dalam Gateway. Hooks dapat ditemukan dari direktori dan diperiksa dengan `openclaw hooks`. Gateway memuat hook internal hanya setelah Anda mengaktifkan hook atau mengonfigurasi setidaknya satu entri hook, paket hook, handler lama, atau direktori hook tambahan.

Ada dua jenis hook di OpenClaw:

- **Hook internal** (halaman ini): berjalan di dalam Gateway saat peristiwa agen terjadi, seperti `/new`, `/reset`, `/stop`, atau peristiwa siklus hidup.
- **Webhook**: endpoint HTTP eksternal yang memungkinkan sistem lain memicu pekerjaan di OpenClaw. Lihat [Webhook](/id/automation/cron-jobs#webhooks).

Hook juga dapat dibundel di dalam Plugin. `openclaw hooks list` menampilkan hook mandiri dan hook yang dikelola Plugin.

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

## Jenis peristiwa

| Peristiwa                | Kapan dipicu                                              |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Perintah `/new` dikeluarkan                               |
| `command:reset`          | Perintah `/reset` dikeluarkan                             |
| `command:stop`           | Perintah `/stop` dikeluarkan                              |
| `command`                | Peristiwa perintah apa pun (listener umum)                |
| `session:compact:before` | Sebelum Compaction meringkas riwayat                      |
| `session:compact:after`  | Setelah Compaction selesai                                |
| `session:patch`          | Ketika properti sesi dimodifikasi                         |
| `agent:bootstrap`        | Sebelum file bootstrap ruang kerja disuntikkan            |
| `gateway:startup`        | Setelah channel dimulai dan hook dimuat                   |
| `gateway:shutdown`       | Ketika penghentian gateway dimulai                        |
| `gateway:pre-restart`    | Sebelum gateway dimulai ulang sesuai ekspektasi           |
| `message:received`       | Pesan masuk dari channel apa pun                          |
| `message:transcribed`    | Setelah transkripsi audio selesai                         |
| `message:preprocessed`   | Setelah prapemrosesan media dan tautan selesai atau dilewati |
| `message:sent`           | Pesan keluar terkirim                                     |

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

| Kolom      | Deskripsi                                             |
| ---------- | ----------------------------------------------------- |
| `emoji`    | Emoji tampilan untuk CLI                              |
| `events`   | Array peristiwa yang akan didengarkan                 |
| `export`   | Ekspor bernama yang digunakan (default ke `"default"`) |
| `os`       | Platform yang diperlukan (mis., `["darwin", "linux"]`) |
| `requires` | Path `bins`, `anyBins`, `env`, atau `config` yang diperlukan |
| `always`   | Lewati pemeriksaan kelayakan (boolean)                |
| `install`  | Metode instalasi                                      |

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

Setiap peristiwa mencakup: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push untuk mengirim ke pengguna), dan `context` (data khusus peristiwa). Konteks hook Plugin agen dan alat juga dapat menyertakan `trace`, konteks trace diagnostik hanya-baca yang kompatibel dengan W3C yang dapat diteruskan Plugin ke log terstruktur untuk korelasi OTEL.

### Sorotan konteks peristiwa

**Peristiwa perintah** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Peristiwa pesan** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (data khusus penyedia termasuk `senderId`, `senderName`, `guildId`). `context.content` mengutamakan isi perintah yang tidak kosong untuk pesan seperti perintah, lalu beralih ke isi mentah masuk dan isi generik; ini tidak mencakup pengayaan khusus agen seperti riwayat thread atau ringkasan tautan.

**Peristiwa pesan** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Peristiwa pesan** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Peristiwa pesan** (`message:preprocessed`): `context.bodyForAgent` (isi akhir yang diperkaya), `context.from`, `context.channelId`.

**Peristiwa bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array yang dapat diubah), `context.agentId`.

**Peristiwa patch sesi** (`session:patch`): `context.sessionEntry`, `context.patch` (hanya kolom yang berubah), `context.cfg`. Hanya klien dengan hak istimewa yang dapat memicu peristiwa patch.

**Peristiwa Compaction**: `session:compact:before` mencakup `messageCount`, `tokenCount`. `session:compact:after` menambahkan `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` mengamati pengguna mengeluarkan `/stop`; ini adalah siklus hidup pembatalan/perintah, bukan gerbang finalisasi agen. Plugin yang perlu memeriksa jawaban akhir alami dan meminta agen melakukan satu lintasan lagi harus menggunakan hook Plugin bertipe `before_agent_finalize`. Lihat [Hook Plugin](/id/plugins/hooks).

**Peristiwa siklus hidup Gateway**: `gateway:shutdown` mencakup `reason` dan `restartExpectedMs` serta dipicu ketika penghentian gateway dimulai. `gateway:pre-restart` mencakup konteks yang sama tetapi hanya dipicu ketika penghentian merupakan bagian dari restart yang diharapkan dan nilai `restartExpectedMs` terbatas diberikan. Selama penghentian, setiap penantian hook siklus hidup bersifat upaya-terbaik dan dibatasi sehingga penghentian tetap berlanjut jika handler macet.

## Penemuan hook

Hook ditemukan dari direktori berikut, dalam urutan presedensi override yang meningkat:

1. **Hook bawaan**: dikirim bersama OpenClaw
2. **Hook Plugin**: hook yang dibundel di dalam Plugin terinstal
3. **Hook terkelola**: `~/.openclaw/hooks/` (diinstal pengguna, dibagikan lintas ruang kerja). Direktori tambahan dari `hooks.internal.load.extraDirs` berbagi presedensi ini.
4. **Hook ruang kerja**: `<workspace>/hooks/` (per-agen, dinonaktifkan secara default hingga diaktifkan secara eksplisit)

Hook ruang kerja dapat menambahkan nama hook baru tetapi tidak dapat menimpa hook bawaan, terkelola, atau yang disediakan Plugin dengan nama yang sama.

Gateway melewati penemuan hook internal saat startup hingga hook internal dikonfigurasi. Aktifkan hook bawaan atau terkelola dengan `openclaw hooks enable <name>`, instal paket hook, atau tetapkan `hooks.internal.enabled=true` untuk ikut serta. Ketika Anda mengaktifkan satu hook bernama, Gateway hanya memuat handler hook tersebut; `hooks.internal.enabled=true`, direktori hook tambahan, dan handler lama ikut serta dalam penemuan luas.

### Paket hook

Paket hook adalah paket npm yang mengekspor hook melalui `openclaw.hooks` di `package.json`. Instal dengan:

```bash
openclaw plugins install <path-or-spec>
```

Spesifikasi npm hanya registry (nama paket + versi eksak opsional atau dist-tag). Spesifikasi Git/URL/file dan rentang semver ditolak.

## Hook bawaan

| Hook                  | Peristiwa                                        | Yang dilakukannya                                             |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                   | Menyimpan konteks sesi ke `<workspace>/memory/`               |
| bootstrap-extra-files | `agent:bootstrap`                                | Menyisipkan file bootstrap tambahan dari pola glob            |
| command-logger        | `command`                                        | Mencatat semua perintah ke `~/.openclaw/logs/commands.log`    |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Mengirim pemberitahuan chat yang terlihat saat Compaction sesi dimulai/berakhir |
| boot-md               | `gateway:startup`                                | Menjalankan `BOOT.md` saat Gateway dimulai                    |

Aktifkan hook bawaan apa pun:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detail session-memory

Mengekstrak 15 pesan pengguna/asisten terakhir dan menyimpannya ke `<workspace>/memory/YYYY-MM-DD-HHMM.md` menggunakan tanggal lokal host. Penangkapan memori berjalan di latar belakang sehingga pengakuan `/new` dan `/reset` tidak tertunda oleh pembacaan transkrip atau pembuatan slug opsional. Tetapkan `hooks.internal.entries.session-memory.llmSlug: true` untuk menghasilkan slug nama file deskriptif dengan model yang dikonfigurasi. Memerlukan `workspace.dir` untuk dikonfigurasi.

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

Path diselesaikan relatif terhadap workspace. Hanya basename bootstrap yang dikenali yang dimuat (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detail command-logger

Mencatat setiap perintah slash ke `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detail compaction-notifier

Mengirim pesan status singkat ke percakapan saat ini ketika OpenClaw mulai dan selesai memadatkan transkrip sesi. Ini membuat giliran yang panjang tidak terlalu membingungkan pada permukaan chat karena pengguna dapat melihat bahwa asisten sedang merangkum konteks dan akan melanjutkan setelah Compaction.

<a id="boot-md"></a>

### Detail boot-md

Menjalankan `BOOT.md` dari workspace aktif saat Gateway dimulai.

## Hook Plugin

Plugin dapat mendaftarkan hook bertipe melalui Plugin SDK untuk integrasi yang lebih dalam:
mencegat panggilan tool, memodifikasi prompt, mengontrol alur pesan, dan lainnya.
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

- **Jaga handler tetap cepat.** Hook berjalan selama pemrosesan perintah. Jalankan pekerjaan berat tanpa menunggu hasilnya dengan `void processInBackground(event)`.
- **Tangani kesalahan dengan baik.** Bungkus operasi berisiko dalam try/catch; jangan lemparkan error agar handler lain dapat berjalan.
- **Filter peristiwa lebih awal.** Segera kembalikan jika jenis/tindakan peristiwa tidak relevan.
- **Gunakan kunci peristiwa yang spesifik.** Lebih baik gunakan `"events": ["command:new"]` daripada `"events": ["command"]` untuk mengurangi overhead.

## Pemecahan Masalah

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

1. Verifikasi bahwa hook diaktifkan: `openclaw hooks list`
2. Mulai ulang proses Gateway Anda agar hook dimuat ulang.
3. Periksa log Gateway: `./scripts/clawlog.sh | grep hook`

## Terkait

- [Referensi CLI: hook](/id/cli/hooks)
- [Webhook](/id/automation/cron-jobs#webhooks)
- [Hook Plugin](/id/plugins/hooks) — hook siklus hidup Plugin dalam proses
- [Konfigurasi](/id/gateway/configuration-reference#hooks)

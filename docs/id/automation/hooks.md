---
read_when:
    - Anda menginginkan otomatisasi berbasis peristiwa untuk /new, /reset, /stop, dan peristiwa siklus hidup agen
    - Anda ingin membuat, menginstal, atau menelusuri kesalahan kait
summary: 'Pengait: otomatisasi berbasis peristiwa untuk perintah dan peristiwa siklus hidup'
title: Kait
x-i18n:
    generated_at: "2026-05-11T20:20:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Hook adalah skrip kecil yang berjalan ketika sesuatu terjadi di dalam Gateway. Hook dapat ditemukan dari direktori dan diperiksa dengan `openclaw hooks`. Gateway memuat hook internal hanya setelah Anda mengaktifkan hook atau mengonfigurasi setidaknya satu entri hook, paket hook, handler lama, atau direktori hook tambahan.

Ada dua jenis hook di OpenClaw:

- **Hook internal** (halaman ini): berjalan di dalam Gateway saat peristiwa agen dipicu, seperti `/new`, `/reset`, `/stop`, atau peristiwa siklus hidup.
- **Webhook**: endpoint HTTP eksternal yang memungkinkan sistem lain memicu pekerjaan di OpenClaw. Lihat [Webhook](/id/automation/cron-jobs#webhooks).

Hook juga dapat dibundel di dalam plugin. `openclaw hooks list` menampilkan hook mandiri dan hook yang dikelola Plugin.

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
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Perintah `/new` diterbitkan                                |
| `command:reset`          | Perintah `/reset` diterbitkan                              |
| `command:stop`           | Perintah `/stop` diterbitkan                               |
| `command`                | Peristiwa perintah apa pun (listener umum)                 |
| `session:compact:before` | Sebelum Compaction meringkas riwayat                       |
| `session:compact:after`  | Setelah Compaction selesai                                 |
| `session:patch`          | Saat properti sesi dimodifikasi                            |
| `agent:bootstrap`        | Sebelum file bootstrap ruang kerja disisipkan              |
| `gateway:startup`        | Setelah channel dimulai dan hook dimuat                    |
| `gateway:shutdown`       | Saat pematian gateway dimulai                              |
| `gateway:pre-restart`    | Sebelum restart gateway yang diharapkan                    |
| `message:received`       | Pesan masuk dari channel mana pun                          |
| `message:transcribed`    | Setelah transkripsi audio selesai                          |
| `message:preprocessed`   | Setelah prapemrosesan media dan tautan selesai atau dilewati |
| `message:sent`           | Pesan keluar terkirim                                      |

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
| `events`   | Array peristiwa yang akan didengarkan                |
| `export`   | Ekspor bernama yang digunakan (default ke `"default"`) |
| `os`       | Platform yang diperlukan (misalnya, `["darwin", "linux"]`) |
| `requires` | Jalur `bins`, `anyBins`, `env`, atau `config` yang diperlukan |
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

Setiap peristiwa mencakup: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push untuk mengirim ke pengguna), dan `context` (data khusus peristiwa). Konteks hook Plugin agen dan alat juga dapat mencakup `trace`, konteks jejak diagnostik baca-saja yang kompatibel dengan W3C yang dapat diteruskan plugin ke log terstruktur untuk korelasi OTEL.

### Sorotan konteks peristiwa

**Peristiwa perintah** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Peristiwa pesan** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (data khusus penyedia termasuk `senderId`, `senderName`, `guildId`). `context.content` mengutamakan isi perintah yang tidak kosong untuk pesan seperti perintah, lalu kembali ke isi masuk mentah dan isi umum; ini tidak mencakup pengayaan khusus agen seperti riwayat thread atau ringkasan tautan.

**Peristiwa pesan** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Peristiwa pesan** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Peristiwa pesan** (`message:preprocessed`): `context.bodyForAgent` (isi akhir yang diperkaya), `context.from`, `context.channelId`.

**Peristiwa bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array yang dapat diubah), `context.agentId`.

**Peristiwa patch sesi** (`session:patch`): `context.sessionEntry`, `context.patch` (hanya kolom yang berubah), `context.cfg`. Hanya klien berhak istimewa yang dapat memicu peristiwa patch.

**Peristiwa Compaction**: `session:compact:before` mencakup `messageCount`, `tokenCount`. `session:compact:after` menambahkan `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` mengamati pengguna menerbitkan `/stop`; ini adalah siklus hidup pembatalan/perintah, bukan gerbang finalisasi agen. Plugin yang perlu memeriksa jawaban akhir alami dan meminta agen melakukan satu lintasan lagi harus menggunakan hook Plugin bertipe `before_agent_finalize`. Lihat [Hook Plugin](/id/plugins/hooks).

**Peristiwa siklus hidup Gateway**: `gateway:shutdown` mencakup `reason` dan `restartExpectedMs` serta dipicu saat pematian gateway dimulai. `gateway:pre-restart` mencakup konteks yang sama tetapi hanya dipicu saat pematian merupakan bagian dari restart yang diharapkan dan nilai `restartExpectedMs` terbatas disediakan. Selama pematian, setiap penantian hook siklus hidup bersifat upaya terbaik dan dibatasi agar pematian tetap berlanjut jika handler macet.

Di antara peristiwa `gateway:shutdown` (atau `gateway:pre-restart`) dan sisa rangkaian pematian, gateway juga memicu hook Plugin bertipe `session_end` untuk setiap sesi yang masih aktif saat proses berhenti. `reason` peristiwa adalah `shutdown` untuk penghentian SIGTERM/SIGINT biasa dan `restart` saat penutupan dijadwalkan sebagai bagian dari restart yang diharapkan. Pengurasan ini dibatasi agar handler `session_end` yang lambat tidak dapat memblokir keluarnya proses, dan sesi yang sudah difinalisasi melalui replace / reset / delete / compaction dilewati untuk menghindari pemicuan ganda.

## Penemuan hook

Hook ditemukan dari direktori berikut, dalam urutan prioritas override yang meningkat:

1. **Hook bawaan**: dikirim bersama OpenClaw
2. **Hook Plugin**: hook yang dibundel di dalam plugin terinstal
3. **Hook terkelola**: `~/.openclaw/hooks/` (diinstal pengguna, dibagikan di seluruh ruang kerja). Direktori tambahan dari `hooks.internal.load.extraDirs` berbagi prioritas ini.
4. **Hook ruang kerja**: `<workspace>/hooks/` (per agen, dinonaktifkan secara default hingga diaktifkan secara eksplisit)

Hook ruang kerja dapat menambahkan nama hook baru tetapi tidak dapat menimpa hook bawaan, terkelola, atau yang disediakan plugin dengan nama yang sama.

Gateway melewati penemuan hook internal saat startup hingga hook internal dikonfigurasi. Aktifkan hook bawaan atau terkelola dengan `openclaw hooks enable <name>`, instal paket hook, atau atur `hooks.internal.enabled=true` untuk ikut serta. Saat Anda mengaktifkan satu hook bernama, Gateway hanya memuat handler hook tersebut; `hooks.internal.enabled=true`, direktori hook tambahan, dan handler lama ikut serta dalam penemuan luas.

### Paket hook

Paket hook adalah paket npm yang mengekspor hook melalui `openclaw.hooks` di `package.json`. Instal dengan:

```bash
openclaw plugins install <path-or-spec>
```

Spesifikasi npm hanya registry (nama paket + versi persis opsional atau dist-tag). Spesifikasi Git/URL/file dan rentang semver ditolak.

## Hook bawaan

| Hook                  | Peristiwa                                         | Yang dilakukan                                                |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Menyimpan konteks sesi ke `<workspace>/memory/`                |
| bootstrap-extra-files | `agent:bootstrap`                                 | Menyisipkan file bootstrap tambahan dari pola glob             |
| command-logger        | `command`                                         | Mencatat semua perintah ke `~/.openclaw/logs/commands.log`     |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Mengirim pemberitahuan chat yang terlihat saat Compaction sesi dimulai/berakhir |
| boot-md               | `gateway:startup`                                 | Menjalankan `BOOT.md` saat gateway dimulai                     |

Aktifkan hook bawaan apa pun:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detail session-memory

Mengekstrak 15 pesan pengguna/asisten terakhir dan menyimpannya ke `<workspace>/memory/YYYY-MM-DD-HHMM.md` menggunakan tanggal lokal host. Penangkapan memori berjalan di latar belakang sehingga pengakuan `/new` dan `/reset` tidak tertunda oleh pembacaan transkrip atau pembuatan slug opsional. Atur `hooks.internal.entries.session-memory.llmSlug: true` untuk menghasilkan slug nama file deskriptif dengan model yang dikonfigurasi. Memerlukan `workspace.dir` dikonfigurasi.

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

Jalur diselesaikan relatif terhadap ruang kerja. Hanya basename bootstrap yang dikenali yang dimuat (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detail command-logger

Mencatat setiap perintah slash ke `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detail compaction-notifier

Mengirim pesan status singkat ke percakapan saat ini ketika OpenClaw mulai dan selesai memadatkan transkrip sesi. Ini membuat giliran panjang tidak terlalu membingungkan di permukaan chat karena pengguna dapat melihat bahwa asisten sedang meringkas konteks dan akan melanjutkan setelah Compaction.

<a id="boot-md"></a>

### Detail boot-md

Menjalankan `BOOT.md` dari ruang kerja aktif saat gateway dimulai.

## Hook Plugin

Plugin dapat mendaftarkan hook bertipe melalui Plugin SDK untuk integrasi yang lebih dalam:
mencegat panggilan alat, memodifikasi prompt, mengontrol alur pesan, dan lainnya.
Gunakan hook Plugin saat Anda membutuhkan `before_tool_call`, `before_agent_reply`,
`before_install`, atau hook siklus hidup dalam proses lainnya.

Untuk referensi hook Plugin lengkap, lihat [Hook Plugin](/id/plugins/hooks).

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
Format konfigurasi array lama `hooks.internal.handlers` masih didukung untuk kompatibilitas mundur, tetapi hook baru sebaiknya menggunakan sistem berbasis discovery.
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

- **Jaga agar handler tetap cepat.** Hook berjalan selama pemrosesan perintah. Jalankan pekerjaan berat secara fire-and-forget dengan `void processInBackground(event)`.
- **Tangani kesalahan dengan baik.** Bungkus operasi berisiko dalam try/catch; jangan melempar error agar handler lain dapat berjalan.
- **Filter event sejak awal.** Segera kembali jika tipe/tindakan event tidak relevan.
- **Gunakan kunci event yang spesifik.** Pilih `"events": ["command:new"]` daripada `"events": ["command"]` untuk mengurangi overhead.

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

Periksa binary yang hilang (PATH), variabel lingkungan, nilai konfigurasi, atau kompatibilitas OS.

### Hook tidak dijalankan

1. Pastikan hook diaktifkan: `openclaw hooks list`
2. Mulai ulang proses gateway Anda agar hook dimuat ulang.
3. Periksa log gateway: `./scripts/clawlog.sh | grep hook`

## Terkait

- [Referensi CLI: hooks](/id/cli/hooks)
- [Webhook](/id/automation/cron-jobs#webhooks)
- [Hook Plugin](/id/plugins/hooks) — hook siklus hidup plugin dalam proses
- [Konfigurasi](/id/gateway/configuration-reference#hooks)

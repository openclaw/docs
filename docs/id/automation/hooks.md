---
read_when:
    - Anda menginginkan otomatisasi berbasis peristiwa untuk /new, /reset, /stop, dan peristiwa siklus hidup agen
    - Anda ingin membuat, menginstal, atau men-debug hook
summary: 'Hooks: otomasi berbasis peristiwa untuk perintah dan peristiwa siklus hidup'
title: Kait
x-i18n:
    generated_at: "2026-06-27T17:08:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hook adalah skrip kecil yang berjalan ketika sesuatu terjadi di dalam Gateway. Hook dapat ditemukan dari direktori dan diperiksa dengan `openclaw hooks`. Gateway memuat hook internal hanya setelah Anda mengaktifkan hook atau mengonfigurasi setidaknya satu entri hook, paket hook, handler lama, atau direktori hook tambahan.

Ada dua jenis hook di OpenClaw:

- **Hook internal** (halaman ini): berjalan di dalam Gateway ketika peristiwa agen dipicu, seperti `/new`, `/reset`, `/stop`, atau peristiwa siklus hidup.
- **Webhook**: endpoint HTTP eksternal yang memungkinkan sistem lain memicu pekerjaan di OpenClaw. Lihat [Webhook](/id/automation/cron-jobs#webhooks).

Hook juga dapat dibundel di dalam plugin. `openclaw hooks list` menampilkan hook mandiri dan hook yang dikelola plugin.

## Pilih permukaan yang tepat

OpenClaw memiliki beberapa permukaan ekstensi yang terlihat serupa tetapi menyelesaikan masalah yang berbeda:

| Jika Anda ingin...                                                                                                         | Gunakan...                                  | Mengapa                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Menyimpan snapshot saat `/new`, mencatat `/reset`, memanggil API eksternal setelah `message:sent`, atau menambahkan automasi operator kasar | Hook internal (`HOOK.md`, halaman ini)      | Hook berbasis file ditujukan untuk efek samping yang dikelola operator dan automasi perintah/siklus hidup |
| Menulis ulang prompt, memblokir tool, membatalkan pesan keluar, atau menambahkan middleware/kebijakan berurutan             | Hook plugin bertipe melalui `api.on(...)`   | Hook bertipe memiliki kontrak eksplisit, prioritas, aturan penggabungan, dan semantik blok/batal         |
| Menambahkan ekspor khusus telemetri atau observabilitas                                                                     | Peristiwa diagnostik                        | Observabilitas adalah bus peristiwa terpisah, bukan permukaan hook kebijakan                            |

Gunakan hook internal ketika Anda menginginkan automasi yang berperilaku seperti integrasi kecil yang terpasang. Gunakan hook plugin bertipe ketika Anda memerlukan kontrol siklus hidup runtime.

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
| `command:new`            | Perintah `/new` diterbitkan                               |
| `command:reset`          | Perintah `/reset` diterbitkan                             |
| `command:stop`           | Perintah `/stop` diterbitkan                              |
| `command`                | Peristiwa perintah apa pun (listener umum)                |
| `session:compact:before` | Sebelum Compaction merangkum riwayat                      |
| `session:compact:after`  | Setelah Compaction selesai                                |
| `session:patch`          | Ketika properti sesi dimodifikasi                         |
| `agent:bootstrap`        | Sebelum file bootstrap ruang kerja disuntikkan            |
| `gateway:startup`        | Setelah channel dimulai dan hook dimuat                   |
| `gateway:shutdown`       | Ketika penghentian gateway dimulai                        |
| `gateway:pre-restart`    | Sebelum restart gateway yang diharapkan                   |
| `message:received`       | Pesan masuk dari channel apa pun                          |
| `message:transcribed`    | Setelah transkripsi audio selesai                         |
| `message:preprocessed`   | Setelah prapemrosesan media dan tautan selesai atau dilewati |
| `message:sent`           | Pesan keluar dikirim                                      |

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

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Setiap peristiwa mencakup: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dorong balasan di sini hanya pada permukaan yang dapat dibalas), dan `context` (data khusus peristiwa). Konteks hook plugin agen dan tool juga dapat mencakup `trace`, konteks jejak diagnostik kompatibel W3C hanya-baca yang dapat diteruskan plugin ke log terstruktur untuk korelasi OTEL.

`event.messages` hanya dikirim secara otomatis pada permukaan yang dapat dibalas seperti
`command:*` dan `message:received`. Peristiwa khusus siklus hidup seperti
`agent:bootstrap`, `session:*`, `gateway:*`, atau `message:sent` tidak memiliki
channel balasan dan mengabaikan pesan yang didorong.

### Sorotan konteks peristiwa

**Peristiwa perintah** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Peristiwa pesan** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (data khusus penyedia termasuk `senderId`, `senderName`, `guildId`). `context.content` lebih memilih isi perintah yang tidak kosong untuk pesan mirip perintah, lalu fallback ke isi masuk mentah dan isi generik; ini tidak mencakup pengayaan khusus agen seperti riwayat thread atau ringkasan tautan.

**Peristiwa pesan** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Peristiwa pesan** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Peristiwa pesan** (`message:preprocessed`): `context.bodyForAgent` (isi akhir yang diperkaya), `context.from`, `context.channelId`.

**Peristiwa bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array yang dapat diubah), `context.agentId`.

**Peristiwa patch sesi** (`session:patch`): `context.sessionEntry`, `context.patch` (hanya kolom yang berubah), `context.cfg`. Hanya klien berhak istimewa yang dapat memicu peristiwa patch.

**Peristiwa Compaction**: `session:compact:before` mencakup `messageCount`, `tokenCount`. `session:compact:after` menambahkan `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` mengamati pengguna menerbitkan `/stop`; ini adalah siklus hidup pembatalan/perintah, bukan gerbang finalisasi agen. Plugin yang perlu memeriksa jawaban akhir alami dan meminta agen melakukan satu lintasan lagi harus menggunakan hook plugin bertipe `before_agent_finalize` sebagai gantinya. Lihat [Hook plugin](/id/plugins/hooks).

**Peristiwa siklus hidup Gateway**: `gateway:shutdown` mencakup `reason` dan `restartExpectedMs` serta dipicu ketika penghentian gateway dimulai. `gateway:pre-restart` mencakup konteks yang sama tetapi hanya dipicu ketika penghentian adalah bagian dari restart yang diharapkan dan nilai `restartExpectedMs` terbatas diberikan. Selama penghentian, setiap penantian hook siklus hidup bersifat upaya terbaik dan dibatasi sehingga penghentian berlanjut jika handler macet. Anggaran tunggu default adalah 5 detik untuk `gateway:shutdown` dan 10 detik untuk `gateway:pre-restart`.

Gunakan `gateway:pre-restart` untuk pemberitahuan restart singkat saat channel masih tersedia:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Di antara peristiwa `gateway:shutdown` (atau `gateway:pre-restart`) dan sisa urutan penghentian, gateway juga memicu hook plugin bertipe `session_end` untuk setiap sesi yang masih aktif saat proses berhenti. `reason` peristiwa adalah `shutdown` untuk penghentian SIGTERM/SIGINT biasa dan `restart` ketika penutupan dijadwalkan sebagai bagian dari restart yang diharapkan. Pengurasan ini dibatasi sehingga handler `session_end` yang lambat tidak dapat memblokir keluarnya proses, dan sesi yang sudah difinalisasi melalui replace / reset / delete / compaction dilewati untuk menghindari pemicuan ganda.

## Penemuan hook

Hook ditemukan dari direktori berikut, dalam urutan prioritas override yang meningkat:

1. **Hook bawaan**: dikirim bersama OpenClaw
2. **Hook plugin**: hook yang dibundel di dalam plugin yang terinstal
3. **Hook terkelola**: `~/.openclaw/hooks/` (diinstal pengguna, dibagikan di seluruh ruang kerja). Direktori tambahan dari `hooks.internal.load.extraDirs` berbagi prioritas ini.
4. **Hook ruang kerja**: `<workspace>/hooks/` (per agen, dinonaktifkan secara default sampai diaktifkan secara eksplisit)

Hook ruang kerja dapat menambahkan nama hook baru tetapi tidak dapat meng-override hook bawaan, terkelola, atau yang disediakan plugin dengan nama yang sama.

Gateway melewati penemuan hook internal saat startup hingga hook internal dikonfigurasi. Aktifkan hook bawaan atau terkelola dengan `openclaw hooks enable <name>`, instal paket hook, atau setel `hooks.internal.enabled=true` untuk ikut serta. Ketika Anda mengaktifkan satu hook bernama, Gateway hanya memuat handler hook tersebut; `hooks.internal.enabled=true`, direktori hook tambahan, dan handler lama ikut serta dalam penemuan luas.

### Paket hook

Paket hook adalah paket npm yang mengekspor hook melalui `openclaw.hooks` di `package.json`. Instal dengan:

```bash
openclaw plugins install <path-or-spec>
```

Spesifikasi npm hanya dari registry (nama paket + versi persis opsional atau dist-tag). Spesifikasi Git/URL/file dan rentang semver ditolak.

## Hook bawaan

| Hook                  | Peristiwa                                         | Fungsinya                                                      |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Menyimpan konteks sesi ke `<workspace>/memory/`                |
| bootstrap-extra-files | `agent:bootstrap`                                 | Menyuntikkan file bootstrap tambahan dari pola glob            |
| command-logger        | `command`                                         | Mencatat semua perintah ke `~/.openclaw/logs/commands.log`     |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Mengirim pemberitahuan chat yang terlihat saat Compaction sesi dimulai/berakhir |
| boot-md               | `gateway:startup`                                 | Menjalankan `BOOT.md` saat Gateway dimulai                     |

Aktifkan hook bawaan apa pun:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### detail session-memory

Mengekstrak 15 pesan pengguna/asisten terakhir dan menyimpannya ke `<workspace>/memory/YYYY-MM-DD-HHMM.md` menggunakan tanggal lokal host. Pengambilan memori berjalan di latar belakang sehingga konfirmasi `/new` dan `/reset` tidak tertunda oleh pembacaan transkrip atau pembuatan slug opsional. Atur `hooks.internal.entries.session-memory.llmSlug: true` untuk membuat slug nama file deskriptif dengan model yang dikonfigurasi. Memerlukan `workspace.dir` untuk dikonfigurasi.

<a id="bootstrap-extra-files"></a>

### konfigurasi bootstrap-extra-files

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

### detail command-logger

Mencatat setiap perintah slash ke `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### detail compaction-notifier

Mengirim pesan status singkat ke percakapan saat ini ketika OpenClaw mulai dan selesai memadatkan transkrip sesi. Ini membuat giliran panjang tidak terlalu membingungkan di permukaan chat karena pengguna dapat melihat bahwa asisten sedang meringkas konteks dan akan melanjutkan setelah Compaction.

<a id="boot-md"></a>

### detail boot-md

Menjalankan `BOOT.md` dari workspace aktif saat Gateway dimulai.

## Hook Plugin

Plugin dapat mendaftarkan hook bertipe melalui Plugin SDK untuk integrasi yang lebih mendalam:
mencegat panggilan alat, memodifikasi prompt, mengontrol alur pesan, dan lainnya.
Gunakan hook Plugin saat Anda memerlukan `before_tool_call`, `before_agent_reply`,
`before_install`, atau hook siklus hidup dalam proses lainnya.

Hook internal yang dikelola Plugin berbeda: hook tersebut berpartisipasi dalam sistem
peristiwa perintah/siklus hidup kasar di halaman ini dan muncul di `openclaw hooks list` sebagai
`plugin:<id>`. Gunakan itu untuk efek samping dan kompatibilitas dengan paket hook, bukan
untuk middleware berurutan atau gerbang kebijakan.

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
Format konfigurasi array `hooks.internal.handlers` legacy masih didukung untuk kompatibilitas mundur, tetapi hook baru sebaiknya menggunakan sistem berbasis penemuan.
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
- **Tangani kesalahan dengan baik.** Bungkus operasi berisiko dalam try/catch; jangan throw agar handler lain dapat berjalan.
- **Filter peristiwa sejak awal.** Return segera jika jenis/tindakan peristiwa tidak relevan.
- **Gunakan kunci peristiwa spesifik.** Lebih pilih `"events": ["command:new"]` daripada `"events": ["command"]` untuk mengurangi overhead.

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

### Hook tidak dieksekusi

1. Verifikasi hook diaktifkan: `openclaw hooks list`
2. Mulai ulang proses Gateway Anda agar hook dimuat ulang.
3. Periksa log Gateway: `./scripts/clawlog.sh | grep hook`

## Terkait

- [Referensi CLI: hooks](/id/cli/hooks)
- [Webhook](/id/automation/cron-jobs#webhooks)
- [Hook Plugin](/id/plugins/hooks) — hook siklus hidup Plugin dalam proses
- [Konfigurasi](/id/gateway/configuration-reference#hooks)

---
read_when:
    - Anda menginginkan otomatisasi berbasis peristiwa untuk /new, /reset, /stop, dan peristiwa siklus hidup agen
    - Anda ingin membuat, memasang, atau men-debug hook
summary: 'Hook: otomatisasi berbasis peristiwa untuk perintah dan peristiwa siklus hidup'
title: Hook
x-i18n:
    generated_at: "2026-07-12T13:57:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hook adalah skrip kecil yang berjalan di dalam Gateway ketika peristiwa agen dipicu: perintah seperti `/new`, `/reset`, `/stop`, Compaction sesi, siklus hidup Gateway, dan alur pesan. Hook ditemukan dari direktori dan dikelola dengan `openclaw hooks`. Gateway memuat hook internal hanya setelah Anda mengaktifkan hook atau mengonfigurasi setidaknya satu entri hook, paket hook, penangan lama, atau direktori hook tambahan.

Ada dua jenis hook di OpenClaw:

- **Hook internal** (halaman ini): berjalan di dalam Gateway ketika peristiwa agen dipicu.
- **Webhook**: titik akhir HTTP eksternal yang memungkinkan sistem lain memicu pekerjaan di OpenClaw. Lihat [Webhook](/id/automation/cron-jobs#webhooks).

Hook juga dapat dibundel di dalam Plugin. `openclaw hooks list` menampilkan hook mandiri maupun hook yang dikelola Plugin (ditampilkan sebagai `plugin:<id>`).

## Pilih permukaan yang tepat

OpenClaw memiliki beberapa permukaan ekstensi yang terlihat serupa tetapi menyelesaikan masalah yang berbeda:

| Jika Anda ingin...                                                                                                                     | Gunakan...                                      | Alasan                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Menyimpan snapshot saat `/new`, mencatat `/reset`, memanggil API eksternal setelah `message:sent`, atau menambahkan automasi operator umum | Hook internal (`HOOK.md`, halaman ini)          | Hook berbasis berkas ditujukan untuk efek samping yang dikelola operator serta automasi perintah/siklus hidup   |
| Menulis ulang prompt, memblokir alat, membatalkan pesan keluar, atau menambahkan middleware/kebijakan berurutan                         | Hook Plugin bertipe melalui `api.on(...)`       | Hook bertipe memiliki kontrak, prioritas, aturan penggabungan, serta semantik pemblokiran/pembatalan yang eksplisit |
| Menambahkan ekspor khusus telemetri atau observabilitas                                                                                | Peristiwa diagnostik                            | Observabilitas adalah bus peristiwa terpisah, bukan permukaan hook kebijakan                                    |

Gunakan hook internal jika Anda menginginkan automasi yang berperilaku seperti integrasi kecil yang terpasang. Gunakan hook Plugin bertipe jika Anda memerlukan kendali siklus hidup waktu proses.

## Mulai cepat

```bash
# Daftar hook yang tersedia
openclaw hooks list

# Aktifkan hook
openclaw hooks enable session-memory

# Periksa status hook
openclaw hooks check

# Dapatkan informasi terperinci
openclaw hooks info session-memory
```

## Jenis peristiwa

Hook berlangganan ke kunci tertentu dari tabel ini, atau ke nama keluarga saja
(`command`, `session`, `agent`, `gateway`, `message`) untuk menerima setiap tindakan
dalam keluarga tersebut. Inti OpenClaw tidak memancarkan peristiwa lain, sehingga nama lainnya hampir
selalu merupakan salah ketik yang membuat hook diam-diam tidak aktif (hanya Plugin yang memancarkan
peristiwa khusus yang dapat memicunya). Pemuat hook mencatat peringatan untuk nama tersebut
(misalnya `command:nwe`), dan `openclaw hooks info <name>` menandainya, sehingga
hook yang tidak pernah berjalan dapat didiagnosis.

| Peristiwa                | Waktu dipicu                                                |
| ------------------------ | ----------------------------------------------------------- |
| `command:new`            | Perintah `/new` diberikan                                   |
| `command:reset`          | Perintah `/reset` diberikan                                 |
| `command:stop`           | Perintah `/stop` diberikan                                  |
| `command`                | Peristiwa perintah apa pun (pendengar umum)                 |
| `session:compact:before` | Sebelum Compaction merangkum riwayat                         |
| `session:compact:after`  | Setelah Compaction selesai                                  |
| `session:patch`          | Ketika properti sesi diubah                                  |
| `agent:bootstrap`        | Sebelum berkas bootstrap ruang kerja disuntikkan            |
| `gateway:startup`        | Setelah kanal dimulai dan hook dimuat                        |
| `gateway:shutdown`       | Ketika penonaktifan Gateway dimulai                          |
| `gateway:pre-restart`    | Sebelum Gateway dimulai ulang sesuai rencana                 |
| `message:received`       | Pesan masuk dari kanal mana pun                              |
| `message:transcribed`    | Setelah transkripsi audio selesai                            |
| `message:preprocessed`   | Setelah prapemrosesan media dan tautan selesai atau dilewati |
| `message:sent`           | Upaya pengiriman keluar dilakukan (`context.success` berisi hasilnya) |

## Menulis hook

### Struktur hook

Setiap hook adalah direktori yang berisi dua berkas:

```text
my-hook/
├── HOOK.md          # Metadata + dokumentasi
└── handler.ts       # Implementasi penangan
```

Berkas penangan dapat berupa `handler.ts`, `handler.js`, `index.ts`, atau `index.js`.

### Format HOOK.md

```markdown
---
name: my-hook
description: "Deskripsi singkat tentang fungsi hook ini"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Hook Saya

Dokumentasi terperinci ditempatkan di sini.
```

**Bidang metadata** (`metadata.openclaw`):

| Bidang     | Deskripsi                                                    |
| ---------- | ------------------------------------------------------------ |
| `emoji`    | Emoji tampilan untuk CLI                                     |
| `events`   | Larik peristiwa yang akan didengarkan                        |
| `export`   | Ekspor bernama yang digunakan (nilai bawaan `"default"`)     |
| `os`       | Platform yang diperlukan (misalnya, `["darwin", "linux"]`)   |
| `requires` | Jalur `bins`, `anyBins`, `env`, atau `config` yang diperlukan |
| `always`   | Melewati pemeriksaan kelayakan (boolean)                     |
| `hookKey`  | Penggantian kunci konfigurasi (nilai bawaan nama hook)       |
| `homepage` | URL dokumentasi yang ditampilkan oleh `openclaw hooks info`  |
| `install`  | Metode instalasi                                             |

### Implementasi penangan

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

Setiap peristiwa mencakup: `type`, `action`, `sessionKey`, `timestamp`, `messages`, dan `context` (data khusus peristiwa). Konteks hook Plugin bertipe untuk hook agen dan alat juga dapat mencakup `trace`, yaitu konteks jejak diagnostik hanya-baca yang kompatibel dengan W3C dan dapat diteruskan oleh Plugin ke log terstruktur untuk korelasi OTEL.

String yang ditambahkan ke `event.messages` dikirim kembali ke percakapan hanya untuk
`command:new` dan `command:reset` (dirutekan sebagai balasan ke percakapan
asal) serta untuk `session:compact:before` / `session:compact:after`
(dikirim sebagai pemberitahuan status Compaction). Semua peristiwa lainnya, termasuk
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch`, dan
`gateway:*`, mengabaikan pesan yang ditambahkan.

### Sorotan konteks peristiwa

**Peristiwa perintah** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Peristiwa perintah** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Peristiwa pesan** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (data khusus penyedia termasuk `senderId`, `senderName`, `guildId`). `context.content` mengutamakan isi perintah yang tidak kosong untuk pesan menyerupai perintah, lalu beralih ke isi pesan masuk mentah dan isi generik; nilai ini tidak menyertakan pengayaan khusus agen seperti riwayat utas atau ringkasan tautan.

**Peristiwa pesan** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`, serta `context.error` ketika pengiriman gagal.

**Peristiwa pesan** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Peristiwa pesan** (`message:preprocessed`): `context.bodyForAgent` (isi akhir yang telah diperkaya), `context.from`, `context.channelId`.

**Peristiwa bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (larik yang dapat diubah), `context.agentId`.

**Peristiwa tambalan sesi** (`session:patch`): `context.sessionEntry`, `context.patch` (hanya bidang yang berubah), `context.cfg`. Hanya klien berhak istimewa yang dapat memicu peristiwa tambalan; konteksnya berupa klona, sehingga penangan tidak dapat mengubah entri sesi aktif.

**Peristiwa Compaction**: `session:compact:before` mencakup `messageCount`, `tokenCount`. `session:compact:after` menambahkan `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` mengamati saat pengguna memberikan `/stop`; ini merupakan siklus hidup
pembatalan/perintah, bukan gerbang finalisasi agen. Plugin yang perlu memeriksa
jawaban akhir alami dan meminta agen melakukan satu lintasan lagi harus menggunakan hook
Plugin bertipe `before_agent_finalize`. Lihat [Hook Plugin](/id/plugins/hooks).

**Peristiwa siklus hidup Gateway**: `gateway:shutdown` mencakup `reason` dan `restartExpectedMs`, serta dipicu ketika penonaktifan Gateway dimulai. `gateway:pre-restart` mencakup konteks yang sama, tetapi hanya dipicu ketika penonaktifan merupakan bagian dari mulai ulang yang direncanakan dan nilai `restartExpectedMs` terbatas diberikan. Selama penonaktifan, setiap penantian hook siklus hidup dilakukan dengan upaya terbaik dan dibatasi agar penonaktifan tetap berlanjut jika penangan terhenti. Anggaran waktu tunggu bawaan adalah 5 detik untuk `gateway:shutdown` dan 10 detik untuk `gateway:pre-restart`.

Gunakan `gateway:pre-restart` untuk pemberitahuan singkat mulai ulang saat kanal masih tersedia:

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

Di antara peristiwa `gateway:shutdown` (atau `gateway:pre-restart`) dan rangkaian penonaktifan lainnya, Gateway juga memicu hook Plugin bertipe `session_end` untuk setiap sesi yang masih aktif ketika proses berhenti. `reason` peristiwa tersebut adalah `shutdown` untuk penghentian SIGTERM/SIGINT biasa dan `restart` ketika penutupan dijadwalkan sebagai bagian dari mulai ulang yang direncanakan. Pengurasan ini dibatasi agar penangan `session_end` yang lambat tidak dapat menghalangi keluarnya proses, dan sesi yang telah difinalisasi melalui penggantian / pengaturan ulang / penghapusan / Compaction dilewati untuk menghindari pemicuan ganda.

## Penemuan hook

Hook ditemukan dari empat sumber:

1. **Hook bawaan**: dikirim bersama OpenClaw
2. **Hook Plugin**: dibundel di dalam Plugin yang terpasang; dapat menggantikan hook bawaan dengan nama yang sama
3. **Hook terkelola**: `~/.openclaw/hooks/` (dipasang pengguna, digunakan bersama di seluruh ruang kerja); dapat menggantikan hook bawaan dan hook Plugin. Direktori tambahan dari `hooks.internal.load.extraDirs` memiliki prioritas yang sama.
4. **Hook ruang kerja**: `<workspace>/hooks/` (per agen, dinonaktifkan secara bawaan hingga diaktifkan secara eksplisit)

Hook ruang kerja dapat menambahkan nama hook baru, tetapi tidak dapat menggantikan hook bawaan, terkelola, atau yang disediakan Plugin dengan nama yang sama.

Gateway melewati penemuan hook internal saat dimulai hingga hook internal dikonfigurasi. Aktifkan hook bawaan atau terkelola dengan `openclaw hooks enable <name>`, pasang paket hook, atau tetapkan `hooks.internal.enabled=true` untuk memilih ikut serta. Ketika Anda mengaktifkan satu hook bernama, Gateway hanya memuat penangan hook tersebut; `hooks.internal.enabled=true`, direktori hook tambahan, dan penangan lama memilih ikut serta dalam penemuan luas.

### Paket hook

Paket hook adalah paket npm yang mengekspor hook melalui `openclaw.hooks` di `package.json`. Pasang dengan:

```bash
openclaw plugins install <path-or-spec>
```

Spesifikasi npm hanya boleh berasal dari registri (nama paket + versi persis atau dist-tag opsional). Spesifikasi Git/URL/file dan rentang semver ditolak. Perintah lama `openclaw hooks install` dan `openclaw hooks update` merupakan alias usang untuk `openclaw plugins install` / `openclaw plugins update`.

## Hook bawaan

| Hook                  | Peristiwa                                         | Fungsinya                                                       |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Menyimpan konteks sesi ke `<workspace>/memory/`                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | Menyisipkan file bootstrap tambahan dari pola glob               |
| command-logger        | `command`                                         | Mencatat semua perintah ke `~/.openclaw/logs/commands.log`       |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Mengirim pemberitahuan obrolan yang terlihat saat Compaction sesi dimulai/berakhir |
| boot-md               | `gateway:startup`                                 | Menjalankan `BOOT.md` saat Gateway dimulai                       |

Aktifkan hook bawaan apa pun:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detail session-memory

Mengekstrak pesan terakhir pengguna/asisten (bawaan 15, dapat dikonfigurasi dengan `hooks.internal.entries.session-memory.messages`) dan menyimpannya ke `<workspace>/memory/YYYY-MM-DD-HHMM.md` menggunakan tanggal lokal host. Pengambilan memori berjalan di latar belakang sehingga konfirmasi `/new` dan `/reset` tidak tertunda oleh pembacaan transkrip atau pembuatan slug opsional. Atur `hooks.internal.entries.session-memory.llmSlug: true` untuk menghasilkan slug nama file yang deskriptif, dan secara opsional atur `hooks.internal.entries.session-memory.model` ke alias yang telah dikonfigurasi seperti `sonnet`, ID model polos pada penyedia bawaan agen, atau referensi `provider/model`. Pembuatan slug menggunakan model bawaan agen saat `model` tidak ditentukan dan beralih ke slug stempel waktu jika tidak tersedia. Mengharuskan `workspace.dir` dikonfigurasi.

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

`patterns` dan `files` diterima sebagai alias untuk `paths`. Jalur diuraikan relatif terhadap ruang kerja dan harus tetap berada di dalamnya. Hanya nama dasar bootstrap yang dikenali yang dimuat (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detail command-logger

Mencatat setiap perintah garis miring sebagai satu baris JSON (stempel waktu, tindakan, kunci sesi, ID pengirim, sumber) ke `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detail compaction-notifier

Mengirim pesan status singkat ke percakapan saat ini ketika OpenClaw memulai dan menyelesaikan Compaction transkrip sesi. Ini membuat giliran panjang tidak terlalu membingungkan pada antarmuka obrolan karena pengguna dapat melihat bahwa asisten sedang merangkum konteks dan akan melanjutkan setelah Compaction.

<a id="boot-md"></a>

### Detail boot-md

Menjalankan `BOOT.md` saat Gateway dimulai untuk setiap cakupan agen yang dikonfigurasi, jika file tersebut ada di ruang kerja agen yang telah diuraikan.

## Hook Plugin

Plugin dapat mendaftarkan hook bertipe melalui Plugin SDK untuk integrasi yang lebih mendalam:
mencegat pemanggilan alat, memodifikasi prompt, mengendalikan alur pesan, dan lainnya.
Gunakan hook Plugin saat Anda memerlukan `before_tool_call`, `before_agent_reply`,
`before_install`, atau hook siklus hidup dalam proses lainnya.

Hook internal yang dikelola Plugin berbeda: hook tersebut berpartisipasi dalam sistem
peristiwa perintah/siklus hidup tingkat kasar di halaman ini dan muncul dalam `openclaw hooks list` sebagai
`plugin:<id>`. Gunakan hook tersebut untuk efek samping dan kompatibilitas dengan paket hook, bukan
untuk middleware berurutan atau gerbang kebijakan.

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

Nilai lingkungan per hook memenuhi pemeriksaan kelayakan `requires.env` milik hook (bersama lingkungan proses), dan penangan dapat membacanya dari entri konfigurasi hook:

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

- **Jaga agar penangan tetap cepat.** Hook berjalan selama pemrosesan perintah. Jalankan pekerjaan berat tanpa menunggu hasilnya dengan `void processInBackground(event)`.
- **Tangani kesalahan dengan baik.** Bungkus operasi berisiko dalam try/catch; jangan melempar kesalahan agar penangan lain dapat berjalan.
- **Filter peristiwa sejak awal.** Segera kembali jika jenis/tindakan peristiwa tidak relevan.
- **Gunakan kunci peristiwa yang spesifik.** Utamakan `"events": ["command:new"]` daripada `"events": ["command"]` untuk mengurangi beban tambahan.

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

Periksa biner yang hilang (PATH), variabel lingkungan, nilai konfigurasi, atau kompatibilitas sistem operasi.

### Hook tidak dijalankan

1. Pastikan hook diaktifkan: `openclaw hooks list`
2. Mulai ulang proses Gateway Anda agar hook dimuat ulang.
3. Periksa log Gateway: `openclaw logs --follow | grep -i hook`

## Terkait

- [Referensi CLI: hook](/id/cli/hooks)
- [Webhook](/id/automation/cron-jobs#webhooks)
- [Hook Plugin](/id/plugins/hooks) — hook siklus hidup Plugin dalam proses
- [Konfigurasi](/id/gateway/configuration-reference#hooks)

---
read_when:
    - Anda menginginkan otomasi berbasis peristiwa untuk /new, /reset, /stop, dan peristiwa siklus hidup agen
    - Anda ingin membuat, memasang, atau men-debug hook
summary: 'Hooks: otomasi berbasis peristiwa untuk perintah dan peristiwa siklus hidup'
title: Hooks
x-i18n:
    generated_at: "2026-04-24T08:57:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6246f25272208d9a9ff2f186bcd3a463c78ea24b833f0259174d0f7f0cbea6
    source_path: automation/hooks.md
    workflow: 15
---

Hook adalah skrip kecil yang berjalan saat sesuatu terjadi di dalam Gateway. Hook dapat ditemukan dari direktori dan diperiksa dengan `openclaw hooks`. Gateway memuat hook internal hanya setelah Anda mengaktifkan hook atau mengonfigurasi setidaknya satu entri hook, hook pack, handler lama, atau direktori hook tambahan.

Ada dua jenis hook di OpenClaw:

- **Hook internal** (halaman ini): berjalan di dalam Gateway saat peristiwa agen dipicu, seperti `/new`, `/reset`, `/stop`, atau peristiwa siklus hidup.
- **Webhook**: endpoint HTTP eksternal yang memungkinkan sistem lain memicu pekerjaan di OpenClaw. Lihat [Webhook](/id/automation/cron-jobs#webhooks).

Hook juga dapat dibundel di dalam plugin. `openclaw hooks list` menampilkan hook mandiri maupun hook yang dikelola plugin.

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

| Peristiwa                | Kapan dipicu                                      |
| ------------------------ | ------------------------------------------------- |
| `command:new`            | Perintah `/new` dijalankan                        |
| `command:reset`          | Perintah `/reset` dijalankan                      |
| `command:stop`           | Perintah `/stop` dijalankan                       |
| `command`                | Peristiwa perintah apa pun (pendengar umum)       |
| `session:compact:before` | Sebelum Compaction merangkum riwayat              |
| `session:compact:after`  | Setelah Compaction selesai                        |
| `session:patch`          | Saat properti sesi diubah                         |
| `agent:bootstrap`        | Sebelum file bootstrap workspace disuntikkan      |
| `gateway:startup`        | Setelah channel dimulai dan hook dimuat           |
| `message:received`       | Pesan masuk dari channel mana pun                 |
| `message:transcribed`    | Setelah transkripsi audio selesai                 |
| `message:preprocessed`   | Setelah semua pemahaman media dan tautan selesai  |
| `message:sent`           | Pesan keluar berhasil dikirim                     |

## Menulis hook

### Struktur hook

Setiap hook adalah direktori yang berisi dua file:

```
my-hook/
├── HOOK.md          # Metadata + dokumentasi
└── handler.ts       # Implementasi handler
```

### Format HOOK.md

```markdown
---
name: my-hook
description: "Deskripsi singkat tentang apa yang dilakukan hook ini"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Dokumentasi terperinci ada di sini.
```

**Bidang metadata** (`metadata.openclaw`):

| Bidang    | Deskripsi                                            |
| --------- | ---------------------------------------------------- |
| `emoji`   | Emoji tampilan untuk CLI                             |
| `events`  | Array peristiwa yang akan didengarkan                |
| `export`  | Named export yang akan digunakan (default `"default"`) |
| `os`      | Platform yang diperlukan (mis. `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env`, atau path `config` yang diperlukan |
| `always`  | Lewati pemeriksaan kelayakan (boolean)               |
| `install` | Metode pemasangan                                    |

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

Setiap peristiwa mencakup: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push untuk mengirim ke pengguna), dan `context` (data khusus peristiwa). Konteks hook plugin agen dan alat juga dapat menyertakan `trace`, konteks pelacakan diagnostik kompatibel W3C yang hanya-baca dan dapat diteruskan plugin ke log terstruktur untuk korelasi OTEL.

### Sorotan konteks peristiwa

**Peristiwa perintah** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Peristiwa pesan** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (data khusus provider termasuk `senderId`, `senderName`, `guildId`).

**Peristiwa pesan** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Peristiwa pesan** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Peristiwa pesan** (`message:preprocessed`): `context.bodyForAgent` (isi akhir yang diperkaya), `context.from`, `context.channelId`.

**Peristiwa bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array yang dapat diubah), `context.agentId`.

**Peristiwa patch sesi** (`session:patch`): `context.sessionEntry`, `context.patch` (hanya bidang yang berubah), `context.cfg`. Hanya klien dengan hak istimewa yang dapat memicu peristiwa patch.

**Peristiwa Compaction**: `session:compact:before` mencakup `messageCount`, `tokenCount`. `session:compact:after` menambahkan `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Penemuan hook

Hook ditemukan dari direktori berikut, dalam urutan prioritas penimpaan yang meningkat:

1. **Hook bawaan**: disertakan bersama OpenClaw
2. **Hook plugin**: hook yang dibundel di dalam plugin yang terpasang
3. **Hook terkelola**: `~/.openclaw/hooks/` (dipasang pengguna, dibagikan lintas workspace). Direktori tambahan dari `hooks.internal.load.extraDirs` memiliki prioritas yang sama.
4. **Hook workspace**: `<workspace>/hooks/` (per agen, dinonaktifkan secara default sampai diaktifkan secara eksplisit)

Hook workspace dapat menambahkan nama hook baru tetapi tidak dapat menimpa hook bawaan, terkelola, atau yang disediakan plugin dengan nama yang sama.

Gateway melewati penemuan hook internal saat startup sampai hook internal dikonfigurasi. Aktifkan hook bawaan atau terkelola dengan `openclaw hooks enable <name>`, pasang hook pack, atau setel `hooks.internal.enabled=true` untuk ikut serta. Saat Anda mengaktifkan satu hook bernama, Gateway hanya memuat handler hook tersebut; `hooks.internal.enabled=true`, direktori hook tambahan, dan handler lama mengikutsertakan penemuan luas.

### Hook pack

Hook pack adalah paket npm yang mengekspor hook melalui `openclaw.hooks` di `package.json`. Pasang dengan:

```bash
openclaw plugins install <path-or-spec>
```

Spesifikasi npm hanya untuk registry (nama paket + versi tepat opsional atau dist-tag). Spesifikasi Git/URL/file dan rentang semver ditolak.

## Hook bawaan

| Hook                  | Peristiwa                     | Fungsinya                                             |
| --------------------- | ----------------------------- | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Menyimpan konteks sesi ke `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`             | Menyuntikkan file bootstrap tambahan dari pola glob   |
| command-logger        | `command`                     | Mencatat semua perintah ke `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`             | Menjalankan `BOOT.md` saat gateway dimulai            |

Aktifkan hook bawaan apa pun:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detail session-memory

Mengekstrak 15 pesan pengguna/asisten terakhir, membuat slug nama file deskriptif melalui LLM, dan menyimpannya ke `<workspace>/memory/YYYY-MM-DD-slug.md`. Memerlukan `workspace.dir` dikonfigurasi.

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

Path di-resolve relatif terhadap workspace. Hanya basename bootstrap yang dikenali yang dimuat (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detail command-logger

Mencatat setiap slash command ke `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detail boot-md

Menjalankan `BOOT.md` dari workspace aktif saat gateway dimulai.

## Hook plugin

Plugin dapat mendaftarkan hook melalui Plugin SDK untuk integrasi yang lebih dalam: mencegat pemanggilan alat, memodifikasi prompt, mengendalikan alur pesan, dan lainnya. Plugin SDK mengekspos 28 hook yang mencakup resolusi model, siklus hidup agen, alur pesan, eksekusi alat, koordinasi subagen, dan siklus hidup gateway.

Untuk referensi hook plugin lengkap termasuk `before_tool_call`, `before_agent_reply`, `before_install`, dan semua hook plugin lainnya, lihat [Arsitektur Plugin](/id/plugins/architecture-internals#provider-runtime-hooks).

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
Format konfigurasi array `hooks.internal.handlers` lama masih didukung untuk kompatibilitas mundur, tetapi hook baru sebaiknya menggunakan sistem berbasis penemuan.
</Note>

## Referensi CLI

```bash
# Daftar semua hook (tambahkan --eligible, --verbose, atau --json)
openclaw hooks list

# Tampilkan info terperinci tentang hook
openclaw hooks info <hook-name>

# Tampilkan ringkasan kelayakan
openclaw hooks check

# Aktifkan/nonaktifkan
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Praktik terbaik

- **Jaga handler tetap cepat.** Hook berjalan selama pemrosesan perintah. Jalankan pekerjaan berat secara fire-and-forget dengan `void processInBackground(event)`.
- **Tangani error dengan baik.** Bungkus operasi berisiko dalam try/catch; jangan melempar agar handler lain tetap bisa berjalan.
- **Filter peristiwa lebih awal.** Segera return jika jenis/tindakan peristiwa tidak relevan.
- **Gunakan kunci peristiwa yang spesifik.** Utamakan `"events": ["command:new"]` dibanding `"events": ["command"]` untuk mengurangi overhead.

## Pemecahan masalah

### Hook tidak ditemukan

```bash
# Verifikasi struktur direktori
ls -la ~/.openclaw/hooks/my-hook/
# Seharusnya menampilkan: HOOK.md, handler.ts

# Daftar semua hook yang ditemukan
openclaw hooks list
```

### Hook tidak memenuhi syarat

```bash
openclaw hooks info my-hook
```

Periksa biner yang hilang (PATH), variabel lingkungan, nilai konfigurasi, atau kompatibilitas OS.

### Hook tidak berjalan

1. Verifikasi bahwa hook diaktifkan: `openclaw hooks list`
2. Mulai ulang proses gateway Anda agar hook dimuat ulang.
3. Periksa log gateway: `./scripts/clawlog.sh | grep hook`

## Terkait

- [Referensi CLI: hooks](/id/cli/hooks)
- [Webhook](/id/automation/cron-jobs#webhooks)
- [Arsitektur Plugin](/id/plugins/architecture-internals#provider-runtime-hooks) — referensi hook plugin lengkap
- [Konfigurasi](/id/gateway/configuration-reference#hooks)

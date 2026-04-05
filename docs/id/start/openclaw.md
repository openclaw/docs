---
read_when:
    - Melakukan onboarding instance asisten baru
    - Meninjau implikasi keamanan/izin
summary: Panduan end-to-end untuk menjalankan OpenClaw sebagai asisten pribadi dengan peringatan keamanan
title: Penyiapan Asisten Pribadi
x-i18n:
    generated_at: "2026-04-05T14:06:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02f10a9f7ec08f71143cbae996d91cbdaa19897a40f725d8ef524def41cf2759
    source_path: start/openclaw.md
    workflow: 15
---

# Membangun asisten pribadi dengan OpenClaw

OpenClaw adalah gateway self-hosted yang menghubungkan Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, dan lainnya ke agen AI. Panduan ini membahas pengaturan "asisten pribadi": nomor WhatsApp khusus yang berperilaku seperti asisten AI Anda yang selalu aktif.

## ⚠️ Utamakan keamanan

Anda menempatkan agen pada posisi untuk:

- menjalankan perintah di mesin Anda (tergantung pada kebijakan tool Anda)
- membaca/menulis file di workspace Anda
- mengirim pesan keluar kembali melalui WhatsApp/Telegram/Discord/Mattermost dan channel bawaan lainnya

Mulailah secara konservatif:

- Selalu setel `channels.whatsapp.allowFrom` (jangan pernah menjalankan secara terbuka untuk semua orang di Mac pribadi Anda).
- Gunakan nomor WhatsApp khusus untuk asisten.
- Heartbeat sekarang default setiap 30 menit. Nonaktifkan sampai Anda mempercayai pengaturan ini dengan menetapkan `agents.defaults.heartbeat.every: "0m"`.

## Prasyarat

- OpenClaw sudah diinstal dan onboarding sudah selesai — lihat [Memulai](/start/getting-started) jika Anda belum melakukannya
- Nomor telepon kedua (SIM/eSIM/prabayar) untuk asisten

## Pengaturan dua ponsel (direkomendasikan)

Yang Anda inginkan adalah ini:

```mermaid
flowchart TB
    A["<b>Ponsel Anda (pribadi)<br></b><br>WhatsApp Anda<br>+1-555-YOU"] -- message --> B["<b>Ponsel Kedua (asisten)<br></b><br>WA Asisten<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Mac Anda (openclaw)<br></b><br>Agen AI"]
```

Jika Anda menautkan WhatsApp pribadi Anda ke OpenClaw, setiap pesan kepada Anda akan menjadi “input agen”. Itu jarang yang Anda inginkan.

## Mulai cepat 5 menit

1. Pair WhatsApp Web (menampilkan QR; pindai dengan ponsel asisten):

```bash
openclaw channels login
```

2. Jalankan Gateway (biarkan tetap berjalan):

```bash
openclaw gateway --port 18789
```

3. Masukkan config minimal ke `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Sekarang kirim pesan ke nomor asisten dari ponsel Anda yang ada dalam allowlist.

Saat onboarding selesai, kami otomatis membuka dashboard dan mencetak tautan yang bersih (tanpa token). Jika diminta auth, tempelkan shared secret yang telah dikonfigurasi ke pengaturan UI Kontrol. Onboarding menggunakan token secara default (`gateway.auth.token`), tetapi auth berbasis kata sandi juga berfungsi jika Anda mengganti `gateway.auth.mode` ke `password`. Untuk membukanya lagi nanti: `openclaw dashboard`.

## Beri agen sebuah workspace (AGENTS)

OpenClaw membaca instruksi operasional dan “memori” dari direktori workspace-nya.

Secara default, OpenClaw menggunakan `~/.openclaw/workspace` sebagai workspace agen, dan akan membuatnya (beserta `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` awal) secara otomatis saat setup/eksekusi agen pertama. `BOOTSTRAP.md` hanya dibuat saat workspace benar-benar baru (tidak akan muncul lagi setelah Anda menghapusnya). `MEMORY.md` bersifat opsional (tidak dibuat otomatis); jika ada, file ini dimuat untuk sesi normal. Sesi subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md`.

Tip: perlakukan folder ini seperti “memori” OpenClaw dan jadikan sebagai repo git (idealnya privat) agar file `AGENTS.md` + memori Anda dicadangkan. Jika git terinstal, workspace yang benar-benar baru akan diinisialisasi otomatis.

```bash
openclaw setup
```

Tata letak workspace lengkap + panduan cadangan: [Workspace agen](/id/concepts/agent-workspace)
Alur kerja memori: [Memory](/id/concepts/memory)

Opsional: pilih workspace lain dengan `agents.defaults.workspace` (mendukung `~`).

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

Jika Anda sudah menyediakan file workspace sendiri dari sebuah repo, Anda dapat menonaktifkan pembuatan file bootstrap sepenuhnya:

```json5
{
  agent: {
    skipBootstrap: true,
  },
}
```

## Config yang mengubahnya menjadi "seorang asisten"

OpenClaw default ke pengaturan asisten yang baik, tetapi biasanya Anda ingin menyesuaikan:

- persona/instruksi di [`SOUL.md`](/id/concepts/soul)
- default thinking (jika diinginkan)
- heartbeat (setelah Anda mempercayainya)

Contoh:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Mulai dari 0; aktifkan nanti.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sesi dan memori

- File sesi: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Metadata sesi (penggunaan token, rute terakhir, dll.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (lama: `~/.openclaw/sessions/sessions.json`)
- `/new` atau `/reset` memulai sesi baru untuk chat tersebut (dapat dikonfigurasi melalui `resetTriggers`). Jika dikirim sendirian, agen akan membalas dengan sapaan singkat untuk mengonfirmasi reset.
- `/compact [instructions]` memadatkan konteks sesi dan melaporkan sisa anggaran konteks.

## Heartbeat (mode proaktif)

Secara default, OpenClaw menjalankan heartbeat setiap 30 menit dengan prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Setel `agents.defaults.heartbeat.every: "0m"` untuk menonaktifkan.

- Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan heading markdown seperti `# Heading`), OpenClaw melewati eksekusi heartbeat untuk menghemat panggilan API.
- Jika file tidak ada, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.
- Jika agen membalas dengan `HEARTBEAT_OK` (opsional dengan padding singkat; lihat `agents.defaults.heartbeat.ackMaxChars`), OpenClaw menekan pengiriman keluar untuk heartbeat tersebut.
- Secara default, pengiriman heartbeat ke target gaya DM `user:<id>` diizinkan. Setel `agents.defaults.heartbeat.directPolicy: "block"` untuk menekan pengiriman target langsung sambil tetap membiarkan heartbeat aktif.
- Heartbeat menjalankan turn agen penuh — interval yang lebih pendek akan menghabiskan lebih banyak token.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Media masuk dan keluar

Lampiran masuk (gambar/audio/dokumen) dapat diteruskan ke perintah Anda melalui templat:

- `{{MediaPath}}` (path file temp lokal)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (jika transkripsi audio diaktifkan)

Lampiran keluar dari agen: sertakan `MEDIA:<path-or-url>` pada barisnya sendiri (tanpa spasi). Contoh:

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw mengekstraknya dan mengirimkannya sebagai media bersama teks.

Perilaku path lokal mengikuti model kepercayaan baca-file yang sama seperti agen:

- Jika `tools.fs.workspaceOnly` adalah `true`, path lokal `MEDIA:` keluar tetap dibatasi ke root temp OpenClaw, cache media, path workspace agen, dan file yang dihasilkan sandbox.
- Jika `tools.fs.workspaceOnly` adalah `false`, `MEDIA:` keluar dapat menggunakan file lokal host yang sudah diizinkan dibaca oleh agen.
- Pengiriman lokal host tetap hanya mengizinkan media dan tipe dokumen aman (gambar, audio, video, PDF, dan dokumen Office). Teks biasa dan file mirip rahasia tidak diperlakukan sebagai media yang dapat dikirim.

Artinya gambar/file yang dihasilkan di luar workspace sekarang dapat dikirim saat kebijakan fs Anda sudah mengizinkan pembacaan tersebut, tanpa membuka kembali eksfiltrasi lampiran teks host arbitrer.

## Checklist operasional

```bash
openclaw status          # status lokal (kredensial, sesi, event yang diantrikan)
openclaw status --all    # diagnosis penuh (read-only, siap ditempel)
openclaw status --deep   # meminta gateway untuk health probe live dengan probe channel saat didukung
openclaw health --json   # snapshot kesehatan gateway (WS; default dapat mengembalikan snapshot cache baru)
```

Log berada di `/tmp/openclaw/` (default: `openclaw-YYYY-MM-DD.log`).

## Langkah selanjutnya

- WebChat: [WebChat](/web/webchat)
- Operasi Gateway: [Runbook Gateway](/id/gateway)
- Cron + wakeup: [Cron jobs](/id/automation/cron-jobs)
- Pendamping menu bar macOS: [Aplikasi macOS OpenClaw](/id/platforms/macos)
- Aplikasi node iOS: [Aplikasi iOS](/id/platforms/ios)
- Aplikasi node Android: [Aplikasi Android](/id/platforms/android)
- Status Windows: [Windows (WSL2)](/id/platforms/windows)
- Status Linux: [Aplikasi Linux](/id/platforms/linux)
- Keamanan: [Security](/id/gateway/security)

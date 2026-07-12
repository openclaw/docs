---
read_when:
    - Anda ingin memilih saluran obrolan untuk OpenClaw
    - Anda memerlukan ikhtisar singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan dengan OpenClaw
title: Kanal obrolan
x-i18n:
    generated_at: "2026-07-12T13:59:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw dapat berkomunikasi dengan Anda melalui aplikasi obrolan apa pun yang sudah Anda gunakan. Setiap saluran terhubung melalui Gateway.
Teks didukung di semua saluran; dukungan media dan reaksi berbeda-beda menurut saluran.

iMessage, Telegram, dan UI WebChat disertakan dalam instalasi inti. Saluran yang ditandai
"plugin resmi" dapat diinstal dengan satu perintah (`openclaw plugins install @openclaw/<id>`)
atau sesuai kebutuhan selama `openclaw onboard` / `openclaw channels add`, lalu memerlukan
mulai ulang Gateway. Saluran "plugin eksternal" dikelola di luar repositori OpenClaw.

## Saluran yang didukung

- [Discord](/id/channels/discord) - Discord Bot API + Gateway; mendukung server, saluran, dan pesan langsung (plugin resmi).
- [Feishu](/id/channels/feishu) - Bot Feishu/Lark melalui WebSocket (plugin resmi).
- [Google Chat](/id/channels/googlechat) - Aplikasi Google Chat API melalui webhook HTTP (plugin resmi).
- [iMessage](/id/channels/imessage) - Disertakan dalam inti. Integrasi macOS asli melalui penghubung `imsg` pada Mac yang telah masuk (atau pembungkus SSH saat Gateway berjalan di tempat lain), termasuk tindakan API privat untuk balasan, tapback, efek, lampiran, dan pengelolaan grup.
- [IRC](/id/channels/irc) - Server IRC klasik; saluran + pesan langsung dengan kontrol pemasangan/daftar izin (plugin resmi).
- [LINE](/id/channels/line) - Bot LINE Messaging API (plugin resmi).
- [Matrix](/id/channels/matrix) - Protokol Matrix (plugin resmi).
- [Mattermost](/id/channels/mattermost) - Bot API + WebSocket; saluran, grup, pesan langsung (plugin resmi).
- [Microsoft Teams](/id/channels/msteams) - Bot Framework; dukungan perusahaan (plugin resmi).
- [Nextcloud Talk](/id/channels/nextcloud-talk) - Obrolan yang dihosting sendiri melalui Nextcloud Talk (plugin resmi).
- [Nostr](/id/channels/nostr) - Pesan langsung terdesentralisasi melalui NIP-04 (plugin resmi).
- [QQ Bot](/id/channels/qqbot) - QQ Bot API; obrolan privat, obrolan grup, dan media kaya (plugin resmi).
- [Raft](/id/channels/raft) - Penghubung pembangkit CLI Raft untuk kolaborasi manusia dan agen (plugin resmi).
- [Signal](/id/channels/signal) - signal-cli; berfokus pada privasi (plugin resmi).
- [Slack](/id/channels/slack) - Bolt SDK; aplikasi ruang kerja (plugin resmi).
- [SMS](/id/channels/sms) - SMS yang didukung Twilio melalui webhook Gateway (plugin resmi).
- [Synology Chat](/id/channels/synology-chat) - Synology NAS Chat melalui webhook keluar+masuk (plugin resmi).
- [Telegram](/id/channels/telegram) - Disertakan dalam inti. Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) - Perpesanan berbasis Urbit (plugin resmi).
- [Twitch](/id/channels/twitch) - Obrolan Twitch melalui koneksi IRC (plugin resmi).
- [Panggilan Suara](/id/plugins/voice-call) - Telepon melalui Plivo, Telnyx, atau Twilio (plugin resmi).
- [WebChat](/id/web/webchat) - Disertakan dalam inti. UI WebChat Gateway melalui WebSocket.
- [WeChat](/id/channels/wechat) - Bot Tencent iLink melalui proses masuk QR; hanya obrolan privat (plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) - Paling populer; menggunakan Baileys dan memerlukan pemasangan QR (plugin resmi).
- [Yuanbao](/id/channels/yuanbao) - Bot Tencent Yuanbao (plugin eksternal).
- [Zalo](/id/channels/zalo) - Zalo Bot API; perpesanan populer di Vietnam (plugin resmi).
- [Zalo ClawBot](/id/channels/zaloclawbot) - Asisten Zalo pribadi melalui proses masuk QR; terikat pada pemilik (plugin eksternal).
- [Zalo Personal](/id/channels/zalouser) - Akun pribadi Zalo melalui proses masuk QR (plugin resmi).

## Catatan pengiriman

- Balasan Telegram yang berisi sintaks gambar markdown, seperti `![alt](url)`,
  dikonversi menjadi balasan media pada jalur keluar akhir jika memungkinkan.
- Pesan langsung multipengguna Slack dirutekan sebagai obrolan grup, sehingga kebijakan grup, perilaku
  penyebutan, dan aturan sesi grup berlaku pada percakapan MPIM.
- Penyiapan WhatsApp menggunakan instalasi sesuai kebutuhan: orientasi dapat menampilkan alur penyiapan sebelum
  paket plugin diinstal, dan Gateway hanya memuat plugin eksternal
  ClawHub/npm saat saluran benar-benar aktif.
- Saluran yang menerima pesan masuk buatan bot dapat menggunakan
  [perlindungan perulangan bot](/id/channels/bot-loop-protection) bersama untuk mencegah pasangan bot
  saling membalas tanpa henti.
- Ruang selalu aktif yang didukung dapat menggunakan [peristiwa ruang ambien](/id/channels/ambient-room-events)
  agar percakapan ruang yang tidak menyebut agen menjadi konteks pasif, kecuali agen mengirim pesan dengan
  alat `message`.

## Catatan

- Saluran dapat berjalan secara bersamaan; konfigurasikan beberapa saluran dan OpenClaw akan merutekannya per obrolan.
- Penyiapan tercepat biasanya adalah **Telegram** (token bot sederhana, tanpa instalasi plugin). WhatsApp
  memerlukan pemasangan QR dan menyimpan lebih banyak status pada disk.
- Perilaku grup berbeda-beda menurut saluran; lihat [Grup](/id/channels/groups).
- Pemasangan pesan langsung dan daftar izin diberlakukan demi keamanan; lihat [Keamanan](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah saluran](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Penyedia Model](/id/providers/models).

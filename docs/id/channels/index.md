---
read_when:
    - Anda ingin memilih saluran obrolan untuk OpenClaw
    - Anda memerlukan ikhtisar singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan dengan OpenClaw
title: Kanal chat
x-i18n:
    generated_at: "2026-07-16T17:47:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw dapat berkomunikasi dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap saluran terhubung melalui Gateway.
Teks didukung di semua saluran; dukungan media dan reaksi berbeda-beda menurut saluran.

iMessage, Telegram, dan UI WebChat disertakan dalam instalasi inti. Saluran yang ditandai
"plugin resmi" dapat diinstal dengan satu perintah (`openclaw plugins install @openclaw/<id>`)
atau sesuai kebutuhan selama `openclaw onboard` / `openclaw channels add`, lalu memerlukan mulai ulang Gateway.
Saluran "plugin eksternal" dikelola di luar repositori OpenClaw.

## Saluran yang didukung

- [Discord](/id/channels/discord) - Discord Bot API + Gateway; mendukung server, saluran, dan DM (plugin resmi).
- [Feishu](/id/channels/feishu) - Bot Feishu/Lark melalui WebSocket (plugin resmi).
- [Google Chat](/id/channels/googlechat) - Aplikasi Google Chat API melalui Webhook HTTP (plugin resmi).
- [iMessage](/id/channels/imessage) - Disertakan dalam inti. Integrasi macOS native melalui jembatan `imsg` pada Mac yang telah masuk (atau pembungkus SSH saat Gateway berjalan di tempat lain), termasuk tindakan API privat untuk balasan, tapback, efek, lampiran, dan pengelolaan grup.
- [IRC](/id/channels/irc) - Server IRC klasik; saluran + DM dengan kontrol pemasangan/daftar izin (plugin resmi).
- [LINE](/id/channels/line) - Bot LINE Messaging API (plugin resmi).
- [Matrix](/id/channels/matrix) - Protokol Matrix (plugin resmi).
- [Mattermost](/id/channels/mattermost) - Bot API + WebSocket; saluran, grup, DM (plugin resmi).
- [Microsoft Teams](/id/channels/msteams) - Bot Framework; dukungan perusahaan (plugin resmi).
- [Nextcloud Talk](/id/channels/nextcloud-talk) - Chat yang dihosting sendiri melalui Nextcloud Talk (plugin resmi).
- [Nostr](/id/channels/nostr) - DM terdesentralisasi melalui NIP-04 (plugin resmi).
- [QQ Bot](/id/channels/qqbot) - QQ Bot API; chat privat, chat grup, dan multimedia (plugin resmi).
- [Reef](/id/channels/reef) - Perpesanan antarkuku yang terlindungi dan terenkripsi ujung ke ujung antara agen OpenClaw milik orang berbeda (plugin bawaan).
- [Raft](/id/channels/raft) - Jembatan pemicu Raft CLI untuk kolaborasi manusia dan agen (plugin resmi).
- [Signal](/id/channels/signal) - signal-cli; berfokus pada privasi (plugin resmi).
- [Slack](/id/channels/slack) - Bolt SDK; aplikasi ruang kerja (plugin resmi).
- [SMS](/id/channels/sms) - SMS berbasis Twilio melalui Webhook Gateway (plugin resmi).
- [Synology Chat](/id/channels/synology-chat) - Synology NAS Chat melalui Webhook keluar+masuk (plugin resmi).
- [Telegram](/id/channels/telegram) - Disertakan dalam inti. Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) - Aplikasi perpesanan berbasis Urbit (plugin resmi).
- [Twitch](/id/channels/twitch) - Chat Twitch melalui koneksi IRC (plugin resmi).
- [Panggilan Suara](/id/plugins/voice-call) - Telepon melalui Plivo, Telnyx, atau Twilio (plugin resmi).
- [WebChat](/id/web/webchat) - Disertakan dalam inti. UI WebChat Gateway melalui WebSocket.
- [WeChat](/id/channels/wechat) - Bot Tencent iLink melalui proses masuk dengan QR; hanya chat privat (plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) - Paling populer; menggunakan Baileys dan memerlukan pemasangan QR (plugin resmi).
- [Yuanbao](/id/channels/yuanbao) - Bot Tencent Yuanbao (plugin eksternal).
- [Zalo](/id/channels/zalo) - Zalo Bot API; aplikasi perpesanan populer di Vietnam (plugin resmi).
- [Zalo ClawBot](/id/channels/zaloclawbot) - Asisten Zalo pribadi melalui proses masuk dengan QR; terikat pada pemilik (plugin eksternal).
- [Zalo Personal](/id/channels/zalouser) - Akun pribadi Zalo melalui proses masuk dengan QR (plugin resmi).

## Catatan pengiriman

- Balasan Telegram yang memuat sintaks gambar markdown, seperti `![alt](url)`,
  dikonversi menjadi balasan media pada jalur keluar akhir jika memungkinkan.
- DM multipengguna Slack dirutekan sebagai chat grup, sehingga kebijakan grup, perilaku
  penyebutan, dan aturan sesi grup berlaku untuk percakapan MPIM.
- Penyiapan WhatsApp menggunakan instalasi sesuai kebutuhan: orientasi awal dapat menampilkan alur penyiapan sebelum
  paket plugin diinstal, dan Gateway hanya memuat plugin eksternal
  ClawHub/npm saat saluran benar-benar aktif.
- Saluran yang menerima pesan masuk buatan bot dapat menggunakan
  [perlindungan perulangan bot](/id/channels/bot-loop-protection) bersama untuk mencegah pasangan bot
  saling membalas tanpa henti.
- Ruang selalu aktif yang didukung dapat menggunakan [peristiwa ruang ambien](/id/channels/ambient-room-events)
  agar percakapan ruang yang tidak menyebut agen menjadi konteks senyap, kecuali agen mengirim dengan
  alat `message`.

## Catatan

- Saluran dapat berjalan secara bersamaan; konfigurasikan beberapa saluran dan OpenClaw akan merutekan berdasarkan chat.
- Penyiapan tercepat biasanya adalah **Telegram** (token bot sederhana, tanpa instalasi plugin). WhatsApp
  memerlukan pemasangan QR dan menyimpan lebih banyak status pada disk.
- Perilaku grup berbeda-beda menurut saluran; lihat [Grup](/id/channels/groups).
- Pemasangan DM dan daftar izin diberlakukan demi keamanan; lihat [Keamanan](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah saluran](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Penyedia Model](/id/providers/models).

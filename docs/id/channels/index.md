---
read_when:
    - Anda ingin memilih saluran chat untuk OpenClaw
    - Anda memerlukan ringkasan singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan dengan OpenClaw
title: Saluran chat
x-i18n:
    generated_at: "2026-06-27T17:10:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw dapat berbicara dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap saluran terhubung melalui Gateway.
Teks didukung di semua tempat; media dan reaksi berbeda-beda menurut saluran.

## Catatan pengiriman

- Balasan Telegram yang berisi sintaks gambar markdown, seperti `![alt](url)`,
  dikonversi menjadi balasan media pada jalur keluar akhir jika memungkinkan.
- DM multiperson Slack dirutekan sebagai chat grup, sehingga kebijakan grup, perilaku
  mention, dan aturan sesi grup berlaku untuk percakapan MPIM.
- Penyiapan WhatsApp bersifat instal sesuai kebutuhan: onboarding dapat menampilkan alur penyiapan sebelum
  paket plugin diinstal, dan Gateway memuat Plugin ClawHub/npm eksternal hanya ketika saluran benar-benar aktif.
- Saluran yang menerima pesan masuk yang dibuat bot dapat menggunakan
  [perlindungan loop bot](/id/channels/bot-loop-protection) bersama untuk mencegah pasangan bot
  saling membalas tanpa batas.
- Ruang selalu aktif yang didukung dapat menggunakan [peristiwa ruang ambient](/id/channels/ambient-room-events)
  sehingga obrolan ruang yang tidak menyebut agen menjadi konteks senyap kecuali agen mengirim dengan
  alat `message`.

## Saluran yang didukung

- [Discord](/id/channels/discord) - Discord Bot API + Gateway; mendukung server, saluran, dan DM.
- [Feishu](/id/channels/feishu) - Bot Feishu/Lark melalui WebSocket (Plugin bawaan).
- [Google Chat](/id/channels/googlechat) - Aplikasi Google Chat API melalui HTTP webhook (Plugin yang dapat diunduh).
- [iMessage](/id/channels/imessage) - Integrasi macOS native melalui bridge `imsg` di Mac yang sudah masuk (atau wrapper SSH ketika Gateway berjalan di tempat lain), termasuk tindakan API privat untuk balasan, tapback, efek, lampiran, dan manajemen grup. Direkomendasikan untuk penyiapan iMessage OpenClaw baru ketika izin host dan akses Messages sesuai.
- [IRC](/id/channels/irc) - Server IRC klasik; saluran + DM dengan kontrol pemasangan/allowlist.
- [LINE](/id/channels/line) - Bot LINE Messaging API (Plugin yang dapat diunduh).
- [Matrix](/id/channels/matrix) - Protokol Matrix (Plugin yang dapat diunduh).
- [Mattermost](/id/channels/mattermost) - Bot API + WebSocket; saluran, grup, DM (Plugin yang dapat diunduh).
- [Microsoft Teams](/id/channels/msteams) - Bot Framework; dukungan enterprise (Plugin bawaan).
- [Nextcloud Talk](/id/channels/nextcloud-talk) - Chat yang dihosting sendiri melalui Nextcloud Talk (Plugin bawaan).
- [Nostr](/id/channels/nostr) - DM terdesentralisasi melalui NIP-04 (Plugin bawaan).
- [QQ Bot](/id/channels/qqbot) - QQ Bot API; chat privat, chat grup, dan media kaya (Plugin bawaan).
- [Raft](/id/channels/raft) - Bridge bangun Raft CLI untuk kolaborasi manusia dan agen (Plugin eksternal).
- [Signal](/id/channels/signal) - signal-cli; berfokus pada privasi.
- [Slack](/id/channels/slack) - Bolt SDK; aplikasi workspace.
- [SMS](/id/channels/sms) - SMS berbasis Twilio melalui Webhook Gateway (Plugin resmi).
- [Synology Chat](/id/channels/synology-chat) - Synology NAS Chat melalui webhook keluar+masuk (Plugin bawaan).
- [Telegram](/id/channels/telegram) - Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) - Messenger berbasis Urbit (Plugin bawaan).
- [Twitch](/id/channels/twitch) - Chat Twitch melalui koneksi IRC (Plugin bawaan).
- [Voice Call](/id/plugins/voice-call) - Telepon melalui Plivo atau Twilio (Plugin, diinstal terpisah).
- [WebChat](/id/web/webchat) - UI WebChat Gateway melalui WebSocket.
- [WeChat](/id/channels/wechat) - Plugin Tencent iLink Bot melalui login QR; hanya chat privat (Plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) - Paling populer; menggunakan Baileys dan memerlukan pemasangan QR.
- [Yuanbao](/id/channels/yuanbao) - Bot Tencent Yuanbao (Plugin eksternal).
- [Zalo](/id/channels/zalo) - Zalo Bot API; messenger populer Vietnam (Plugin bawaan).
- [Zalo ClawBot](/id/channels/zaloclawbot) - Asisten Zalo pribadi melalui login QR; terikat pemilik (Plugin eksternal).
- [Zalo Personal](/id/channels/zalouser) - Akun pribadi Zalo melalui login QR (Plugin bawaan).

## Catatan

- Saluran dapat berjalan secara bersamaan; konfigurasikan beberapa dan OpenClaw akan merutekan per chat.
- Penyiapan tercepat biasanya **Telegram** (token bot sederhana). WhatsApp memerlukan pemasangan QR dan
  menyimpan lebih banyak state di disk.
- Perilaku grup berbeda-beda menurut saluran; lihat [Grup](/id/channels/groups).
- Pemasangan DM dan allowlist diberlakukan demi keamanan; lihat [Keamanan](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah saluran](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Penyedia Model](/id/providers/models).

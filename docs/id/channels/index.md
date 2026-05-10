---
read_when:
    - Anda ingin memilih saluran percakapan untuk OpenClaw
    - Anda memerlukan gambaran singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan dengan OpenClaw
title: Saluran chat
x-i18n:
    generated_at: "2026-05-10T19:22:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw dapat berbicara dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap channel terhubung melalui Gateway.
Teks didukung di semua tempat; media dan reaksi berbeda-beda menurut channel.

## Catatan pengiriman

- Balasan Telegram yang berisi sintaks gambar markdown, seperti `![alt](url)`,
  dikonversi menjadi balasan media di jalur keluar akhir bila memungkinkan.
- DM multipengguna Slack dirutekan sebagai chat grup, sehingga kebijakan grup, perilaku
  mention, dan aturan sesi grup berlaku untuk percakapan MPIM.
- Penyiapan WhatsApp bersifat instal sesuai permintaan: onboarding dapat menampilkan alur penyiapan sebelum
  paket plugin diinstal, dan Gateway memuat runtime WhatsApp
  hanya ketika channel benar-benar aktif.

## Channel yang didukung

- [Discord](/id/channels/discord) - Discord Bot API + Gateway; mendukung server, channel, dan DM.
- [Feishu](/id/channels/feishu) - Bot Feishu/Lark melalui WebSocket (plugin bawaan).
- [Google Chat](/id/channels/googlechat) - Aplikasi Google Chat API melalui webhook HTTP (plugin yang dapat diunduh).
- [iMessage](/id/channels/imessage) - Integrasi macOS native melalui bridge `imsg` pada Mac yang sudah masuk (atau wrapper SSH ketika Gateway berjalan di tempat lain), termasuk tindakan API privat untuk balasan, tapback, efek, lampiran, dan manajemen grup. Direkomendasikan untuk penyiapan iMessage OpenClaw baru ketika izin host dan akses Messages sesuai.
- [IRC](/id/channels/irc) - Server IRC klasik; channel + DM dengan kontrol pairing/allowlist.
- [LINE](/id/channels/line) - Bot LINE Messaging API (plugin yang dapat diunduh).
- [Matrix](/id/channels/matrix) - Protokol Matrix (plugin yang dapat diunduh).
- [Mattermost](/id/channels/mattermost) - Bot API + WebSocket; channel, grup, DM (plugin yang dapat diunduh).
- [Microsoft Teams](/id/channels/msteams) - Bot Framework; dukungan perusahaan (plugin bawaan).
- [Nextcloud Talk](/id/channels/nextcloud-talk) - Chat self-hosted melalui Nextcloud Talk (plugin bawaan).
- [Nostr](/id/channels/nostr) - DM terdesentralisasi melalui NIP-04 (plugin bawaan).
- [QQ Bot](/id/channels/qqbot) - QQ Bot API; chat privat, chat grup, dan rich media (plugin bawaan).
- [Signal](/id/channels/signal) - signal-cli; berfokus pada privasi.
- [Slack](/id/channels/slack) - Bolt SDK; aplikasi workspace.
- [Synology Chat](/id/channels/synology-chat) - Synology NAS Chat melalui webhook keluar+masuk (plugin bawaan).
- [Telegram](/id/channels/telegram) - Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) - Messenger berbasis Urbit (plugin bawaan).
- [Twitch](/id/channels/twitch) - Chat Twitch melalui koneksi IRC (plugin bawaan).
- [Voice Call](/id/plugins/voice-call) - Telepon melalui Plivo atau Twilio (plugin, diinstal terpisah).
- [WebChat](/id/web/webchat) - UI WebChat Gateway melalui WebSocket.
- [WeChat](/id/channels/wechat) - Plugin Tencent iLink Bot melalui login QR; hanya chat privat (plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) - Paling populer; menggunakan Baileys dan memerlukan pairing QR.
- [Yuanbao](/id/channels/yuanbao) - Bot Tencent Yuanbao (plugin eksternal).
- [Zalo](/id/channels/zalo) - Zalo Bot API; messenger populer di Vietnam (plugin bawaan).
- [Zalo Personal](/id/channels/zalouser) - Akun personal Zalo melalui login QR (plugin bawaan).

## Catatan

- Channel dapat berjalan bersamaan; konfigurasikan beberapa channel dan OpenClaw akan merutekan per chat.
- Penyiapan tercepat biasanya **Telegram** (token bot sederhana). WhatsApp memerlukan pairing QR dan
  menyimpan lebih banyak state di disk.
- Perilaku grup berbeda-beda menurut channel; lihat [Grup](/id/channels/groups).
- Pairing DM dan allowlist diberlakukan demi keamanan; lihat [Keamanan](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah channel](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Penyedia Model](/id/providers/models).

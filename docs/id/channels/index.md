---
read_when:
    - Anda ingin memilih saluran obrolan untuk OpenClaw
    - Anda membutuhkan gambaran singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan oleh OpenClaw
title: Saluran obrolan
x-i18n:
    generated_at: "2026-05-06T09:02:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw dapat berbicara dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap saluran terhubung melalui Gateway.
Teks didukung di semua saluran; media dan reaksi berbeda-beda menurut saluran.

## Catatan pengiriman

- Balasan Telegram yang berisi sintaks gambar markdown, seperti `![alt](url)`,
  dikonversi menjadi balasan media pada jalur keluar akhir jika memungkinkan.
- DM multipengguna Slack dirutekan sebagai chat grup, sehingga kebijakan grup, perilaku
  mention, dan aturan sesi grup berlaku untuk percakapan MPIM.
- Penyiapan WhatsApp bersifat instal sesuai kebutuhan: onboarding dapat menampilkan alur penyiapan sebelum
  paket Plugin diinstal, dan Gateway memuat runtime WhatsApp
  hanya saat saluran benar-benar aktif.

## Saluran yang didukung

- [BlueBubbles](/id/channels/bluebubbles) - **Direkomendasikan untuk iMessage**; menggunakan REST API server macOS BlueBubbles dengan dukungan fitur lengkap (Plugin bawaan; edit, batalkan kirim, efek, reaksi, manajemen grup - edit saat ini rusak di macOS 26 Tahoe).
- [Discord](/id/channels/discord) - Discord Bot API + Gateway; mendukung server, saluran, dan DM.
- [Feishu](/id/channels/feishu) - Bot Feishu/Lark melalui WebSocket (Plugin bawaan).
- [Google Chat](/id/channels/googlechat) - Aplikasi Google Chat API melalui Webhook HTTP (Plugin yang dapat diunduh).
- [iMessage (legacy)](/id/channels/imessage) - Integrasi macOS lama melalui CLI imsg (tidak digunakan lagi, gunakan BlueBubbles untuk penyiapan baru).
- [IRC](/id/channels/irc) - Server IRC klasik; saluran + DM dengan kontrol pairing/allowlist.
- [LINE](/id/channels/line) - Bot LINE Messaging API (Plugin yang dapat diunduh).
- [Matrix](/id/channels/matrix) - Protokol Matrix (Plugin yang dapat diunduh).
- [Mattermost](/id/channels/mattermost) - Bot API + WebSocket; saluran, grup, DM (Plugin yang dapat diunduh).
- [Microsoft Teams](/id/channels/msteams) - Bot Framework; dukungan perusahaan (Plugin bawaan).
- [Nextcloud Talk](/id/channels/nextcloud-talk) - Chat yang di-host sendiri melalui Nextcloud Talk (Plugin bawaan).
- [Nostr](/id/channels/nostr) - DM terdesentralisasi melalui NIP-04 (Plugin bawaan).
- [QQ Bot](/id/channels/qqbot) - QQ Bot API; chat pribadi, chat grup, dan media kaya (Plugin bawaan).
- [Signal](/id/channels/signal) - signal-cli; berfokus pada privasi.
- [Slack](/id/channels/slack) - Bolt SDK; aplikasi workspace.
- [Synology Chat](/id/channels/synology-chat) - Synology NAS Chat melalui Webhook keluar+masuk (Plugin bawaan).
- [Telegram](/id/channels/telegram) - Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) - Messenger berbasis Urbit (Plugin bawaan).
- [Twitch](/id/channels/twitch) - Chat Twitch melalui koneksi IRC (Plugin bawaan).
- [Voice Call](/id/plugins/voice-call) - Telepon melalui Plivo atau Twilio (Plugin, diinstal terpisah).
- [WebChat](/id/web/webchat) - UI WebChat Gateway melalui WebSocket.
- [WeChat](/id/channels/wechat) - Plugin Tencent iLink Bot melalui login QR; hanya chat pribadi (Plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) - Paling populer; menggunakan Baileys dan memerlukan pairing QR.
- [Yuanbao](/id/channels/yuanbao) - Bot Tencent Yuanbao (Plugin eksternal).
- [Zalo](/id/channels/zalo) - Zalo Bot API; messenger populer Vietnam (Plugin bawaan).
- [Zalo Personal](/id/channels/zalouser) - Akun pribadi Zalo melalui login QR (Plugin bawaan).

## Catatan

- Saluran dapat berjalan bersamaan; konfigurasikan beberapa saluran dan OpenClaw akan merutekan per chat.
- Penyiapan tercepat biasanya **Telegram** (token bot sederhana). WhatsApp memerlukan pairing QR dan
  menyimpan lebih banyak status di disk.
- Perilaku grup berbeda-beda menurut saluran; lihat [Grup](/id/channels/groups).
- Pairing DM dan allowlist diberlakukan demi keamanan; lihat [Keamanan](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah saluran](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Penyedia Model](/id/providers/models).

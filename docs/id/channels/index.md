---
read_when:
    - Anda ingin memilih saluran obrolan untuk OpenClaw
    - Anda membutuhkan ikhtisar singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan oleh OpenClaw
title: Saluran obrolan
x-i18n:
    generated_at: "2026-05-07T01:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw dapat berbicara dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap channel terhubung melalui Gateway.
Teks didukung di semua tempat; media dan reaksi bervariasi menurut channel.

## Catatan pengiriman

- Balasan Telegram yang berisi sintaks gambar markdown, seperti `![alt](url)`,
  dikonversi menjadi balasan media pada jalur keluar akhir jika memungkinkan.
- DM multipengguna Slack dirutekan sebagai chat grup, sehingga kebijakan grup, perilaku mention,
  dan aturan sesi grup berlaku untuk percakapan MPIM.
- Penyiapan WhatsApp bersifat install-on-demand: onboarding dapat menampilkan alur penyiapan sebelum
  paket Plugin diinstal, dan Gateway memuat runtime WhatsApp
  hanya ketika channel benar-benar aktif.

## Channel yang didukung

- [BlueBubbles](/id/channels/bluebubbles) - Bridge iMessage lama melalui REST API server macOS BlueBubbles; tidak disarankan untuk penyiapan OpenClaw baru tetapi masih didukung untuk config yang sudah ada dan tindakan private-API yang lebih kaya.
- [Discord](/id/channels/discord) - Discord Bot API + Gateway; mendukung server, channel, dan DM.
- [Feishu](/id/channels/feishu) - Bot Feishu/Lark melalui WebSocket (Plugin bawaan).
- [Google Chat](/id/channels/googlechat) - Aplikasi Google Chat API melalui HTTP webhook (Plugin yang dapat diunduh).
- [iMessage](/id/channels/imessage) - Integrasi macOS native melalui CLI imsg; disarankan untuk penyiapan iMessage OpenClaw baru ketika izin host dan akses Messages sesuai.
- [IRC](/id/channels/irc) - Server IRC klasik; channel + DM dengan kontrol pairing/allowlist.
- [LINE](/id/channels/line) - Bot LINE Messaging API (Plugin yang dapat diunduh).
- [Matrix](/id/channels/matrix) - Protokol Matrix (Plugin yang dapat diunduh).
- [Mattermost](/id/channels/mattermost) - Bot API + WebSocket; channel, grup, DM (Plugin yang dapat diunduh).
- [Microsoft Teams](/id/channels/msteams) - Bot Framework; dukungan enterprise (Plugin bawaan).
- [Nextcloud Talk](/id/channels/nextcloud-talk) - Chat yang di-host sendiri melalui Nextcloud Talk (Plugin bawaan).
- [Nostr](/id/channels/nostr) - DM terdesentralisasi melalui NIP-04 (Plugin bawaan).
- [QQ Bot](/id/channels/qqbot) - QQ Bot API; chat privat, chat grup, dan media kaya (Plugin bawaan).
- [Signal](/id/channels/signal) - signal-cli; berfokus pada privasi.
- [Slack](/id/channels/slack) - Bolt SDK; aplikasi workspace.
- [Synology Chat](/id/channels/synology-chat) - Synology NAS Chat melalui webhook keluar+masuk (Plugin bawaan).
- [Telegram](/id/channels/telegram) - Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) - Messenger berbasis Urbit (Plugin bawaan).
- [Twitch](/id/channels/twitch) - Chat Twitch melalui koneksi IRC (Plugin bawaan).
- [Panggilan Suara](/id/plugins/voice-call) - Telepon melalui Plivo atau Twilio (Plugin, diinstal terpisah).
- [WebChat](/id/web/webchat) - UI Gateway WebChat melalui WebSocket.
- [WeChat](/id/channels/wechat) - Plugin Tencent iLink Bot melalui login QR; hanya chat privat (Plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) - Paling populer; menggunakan Baileys dan memerlukan pairing QR.
- [Yuanbao](/id/channels/yuanbao) - Bot Tencent Yuanbao (Plugin eksternal).
- [Zalo](/id/channels/zalo) - Zalo Bot API; messenger populer Vietnam (Plugin bawaan).
- [Zalo Personal](/id/channels/zalouser) - Akun personal Zalo melalui login QR (Plugin bawaan).

## Catatan

- Channel dapat berjalan secara bersamaan; konfigurasikan beberapa dan OpenClaw akan merutekan per chat.
- Penyiapan tercepat biasanya **Telegram** (token bot sederhana). WhatsApp memerlukan pairing QR dan
  menyimpan lebih banyak state di disk.
- Perilaku grup bervariasi menurut channel; lihat [Grup](/id/channels/groups).
- Pairing DM dan allowlist diberlakukan demi keamanan; lihat [Keamanan](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah channel](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Penyedia Model](/id/providers/models).

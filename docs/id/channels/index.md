---
read_when:
    - Anda ingin memilih chat channel untuk OpenClaw
    - Anda memerlukan ikhtisar singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan dengan OpenClaw
title: Chat Channels
x-i18n:
    generated_at: "2026-04-05T13:43:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# Chat Channels

OpenClaw dapat berbicara dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap channel terhubung melalui Gateway.
Teks didukung di semua tempat; media dan reaksi berbeda-beda menurut channel.

## Channel yang didukung

- [BlueBubbles](/channels/bluebubbles) — **Direkomendasikan untuk iMessage**; menggunakan REST API server macOS BlueBubbles dengan dukungan fitur penuh (plugin bawaan; edit, unsend, efek, reaksi, manajemen grup — edit saat ini rusak di macOS 26 Tahoe).
- [Discord](/channels/discord) — Discord Bot API + Gateway; mendukung server, channel, dan DM.
- [Feishu](/channels/feishu) — Bot Feishu/Lark melalui WebSocket (plugin bawaan).
- [Google Chat](/channels/googlechat) — Aplikasi Google Chat API melalui webhook HTTP.
- [iMessage (lama)](/channels/imessage) — Integrasi macOS lama melalui CLI imsg (tidak digunakan lagi, gunakan BlueBubbles untuk penyiapan baru).
- [IRC](/channels/irc) — Server IRC klasik; channel + DM dengan kontrol pairing/allowlist.
- [LINE](/channels/line) — Bot LINE Messaging API (plugin bawaan).
- [Matrix](/channels/matrix) — Protokol Matrix (plugin bawaan).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; channel, grup, DM (plugin bawaan).
- [Microsoft Teams](/channels/msteams) — Bot Framework; dukungan enterprise (plugin bawaan).
- [Nextcloud Talk](/channels/nextcloud-talk) — Chat self-hosted melalui Nextcloud Talk (plugin bawaan).
- [Nostr](/channels/nostr) — DM terdesentralisasi melalui NIP-04 (plugin bawaan).
- [QQ Bot](/channels/qqbot) — QQ Bot API; chat privat, chat grup, dan media kaya (plugin bawaan).
- [Signal](/channels/signal) — signal-cli; berfokus pada privasi.
- [Slack](/channels/slack) — Bolt SDK; aplikasi workspace.
- [Synology Chat](/channels/synology-chat) — Chat Synology NAS melalui webhook keluar+masuk (plugin bawaan).
- [Telegram](/channels/telegram) — Bot API melalui grammY; mendukung grup.
- [Tlon](/channels/tlon) — Messenger berbasis Urbit (plugin bawaan).
- [Twitch](/channels/twitch) — Chat Twitch melalui koneksi IRC (plugin bawaan).
- [Voice Call](/plugins/voice-call) — Telepon melalui Plivo atau Twilio (plugin, dipasang secara terpisah).
- [WebChat](/web/webchat) — UI Gateway WebChat melalui WebSocket.
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — Plugin Tencent iLink Bot melalui login QR; hanya chat privat.
- [WhatsApp](/channels/whatsapp) — Paling populer; menggunakan Baileys dan memerlukan pairing QR.
- [Zalo](/channels/zalo) — Zalo Bot API; messenger populer di Vietnam (plugin bawaan).
- [Zalo Personal](/channels/zalouser) — Akun pribadi Zalo melalui login QR (plugin bawaan).

## Catatan

- Channel dapat berjalan secara bersamaan; konfigurasikan beberapa channel dan OpenClaw akan melakukan routing per chat.
- Penyiapan tercepat biasanya **Telegram** (token bot sederhana). WhatsApp memerlukan pairing QR dan
  menyimpan lebih banyak status di disk.
- Perilaku grup berbeda-beda menurut channel; lihat [Groups](/channels/groups).
- Pairing DM dan allowlist diterapkan demi keamanan; lihat [Security](/gateway/security).
- Pemecahan masalah: [Pemecahan masalah channel](/channels/troubleshooting).
- Provider model didokumentasikan secara terpisah; lihat [Model Providers](/providers/models).

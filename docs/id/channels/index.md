---
read_when:
    - Anda ingin memilih saluran obrolan untuk OpenClaw
    - Anda memerlukan ikhtisar singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan dengan OpenClaw
title: Saluran obrolan
x-i18n:
    generated_at: "2026-05-02T09:12:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw dapat berbicara dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap saluran terhubung melalui Gateway.
Teks didukung di mana saja; media dan reaksi berbeda-beda menurut saluran.

## Catatan pengiriman

- Balasan Telegram yang berisi sintaks gambar markdown, seperti `![alt](url)`,
  dikonversi menjadi balasan media pada jalur keluar final jika memungkinkan.
- DM multi-orang Slack dirutekan sebagai chat grup, sehingga kebijakan grup, perilaku
  mention, dan aturan sesi grup berlaku untuk percakapan MPIM.
- Penyiapan WhatsApp bersifat instal-saat-diperlukan: onboarding dapat menampilkan alur penyiapan sebelum
  paket Plugin diinstal, dan Gateway memuat runtime WhatsApp
  hanya ketika saluran tersebut benar-benar aktif.

## Saluran yang didukung

- [BlueBubbles](/id/channels/bluebubbles) — **Direkomendasikan untuk iMessage**; menggunakan REST API server macOS BlueBubbles dengan dukungan fitur penuh (Plugin bawaan; edit, batalkan kirim, efek, reaksi, manajemen grup — edit saat ini rusak di macOS 26 Tahoe).
- [Discord](/id/channels/discord) — Discord Bot API + Gateway; mendukung server, saluran, dan DM.
- [Feishu](/id/channels/feishu) — bot Feishu/Lark melalui WebSocket (Plugin bawaan).
- [Google Chat](/id/channels/googlechat) — aplikasi Google Chat API melalui Webhook HTTP (Plugin yang dapat diunduh).
- [iMessage (legacy)](/id/channels/imessage) — Integrasi macOS lama melalui CLI imsg (tidak digunakan lagi, gunakan BlueBubbles untuk penyiapan baru).
- [IRC](/id/channels/irc) — Server IRC klasik; saluran + DM dengan kontrol pairing/allowlist.
- [LINE](/id/channels/line) — bot LINE Messaging API (Plugin yang dapat diunduh).
- [Matrix](/id/channels/matrix) — protokol Matrix (Plugin yang dapat diunduh).
- [Mattermost](/id/channels/mattermost) — Bot API + WebSocket; saluran, grup, DM (Plugin yang dapat diunduh).
- [Microsoft Teams](/id/channels/msteams) — Bot Framework; dukungan enterprise (Plugin bawaan).
- [Nextcloud Talk](/id/channels/nextcloud-talk) — Chat self-hosted melalui Nextcloud Talk (Plugin bawaan).
- [Nostr](/id/channels/nostr) — DM terdesentralisasi melalui NIP-04 (Plugin bawaan).
- [QQ Bot](/id/channels/qqbot) — QQ Bot API; chat pribadi, chat grup, dan rich media (Plugin bawaan).
- [Signal](/id/channels/signal) — signal-cli; berfokus pada privasi.
- [Slack](/id/channels/slack) — Bolt SDK; aplikasi workspace.
- [Synology Chat](/id/channels/synology-chat) — Synology NAS Chat melalui Webhook keluar+masuk (Plugin bawaan).
- [Telegram](/id/channels/telegram) — Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) — Messenger berbasis Urbit (Plugin bawaan).
- [Twitch](/id/channels/twitch) — Chat Twitch melalui koneksi IRC (Plugin bawaan).
- [Voice Call](/id/plugins/voice-call) — Telepon melalui Plivo atau Twilio (Plugin, diinstal terpisah).
- [WebChat](/id/web/webchat) — UI WebChat Gateway melalui WebSocket.
- [WeChat](/id/channels/wechat) — Plugin Tencent iLink Bot melalui login QR; hanya chat pribadi (Plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) — Paling populer; menggunakan Baileys dan memerlukan pairing QR.
- [Yuanbao](/id/channels/yuanbao) — bot Tencent Yuanbao (Plugin eksternal).
- [Zalo](/id/channels/zalo) — Zalo Bot API; messenger populer di Vietnam (Plugin bawaan).
- [Zalo Personal](/id/channels/zalouser) — akun pribadi Zalo melalui login QR (Plugin bawaan).

## Catatan

- Saluran dapat berjalan secara bersamaan; konfigurasikan beberapa dan OpenClaw akan merutekan per chat.
- Penyiapan tercepat biasanya **Telegram** (token bot sederhana). WhatsApp memerlukan pairing QR dan
  menyimpan lebih banyak state di disk.
- Perilaku grup berbeda-beda menurut saluran; lihat [Grup](/id/channels/groups).
- Pairing DM dan allowlist ditegakkan demi keamanan; lihat [Keamanan](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah saluran](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Penyedia Model](/id/providers/models).

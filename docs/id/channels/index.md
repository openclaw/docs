---
read_when:
    - Anda ingin memilih saluran obrolan untuk OpenClaw
    - Anda membutuhkan gambaran singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan oleh OpenClaw
title: Saluran chat
x-i18n:
    generated_at: "2026-04-30T09:33:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw dapat berbicara dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap saluran terhubung melalui Gateway.
Teks didukung di semua saluran; media dan reaksi berbeda-beda menurut saluran.

## Catatan pengiriman

- Balasan Telegram yang berisi sintaks gambar markdown, seperti `![alt](url)`,
  dikonversi menjadi balasan media pada jalur keluar akhir jika memungkinkan.
- DM multipengguna Slack dirutekan sebagai obrolan grup, sehingga kebijakan grup, perilaku
  penyebutan, dan aturan sesi grup berlaku untuk percakapan MPIM.
- Penyiapan WhatsApp bersifat instal sesuai permintaan: onboarding dapat menampilkan alur penyiapan sebelum
  dependensi runtime Baileys dipersiapkan, dan Gateway memuat runtime WhatsApp
  hanya ketika saluran benar-benar aktif.

## Saluran yang didukung

- [BlueBubbles](/id/channels/bluebubbles) — **Direkomendasikan untuk iMessage**; menggunakan REST API server macOS BlueBubbles dengan dukungan fitur lengkap (plugin bawaan; edit, batal kirim, efek, reaksi, manajemen grup — edit saat ini rusak di macOS 26 Tahoe).
- [Discord](/id/channels/discord) — Discord Bot API + Gateway; mendukung server, saluran, dan DM.
- [Feishu](/id/channels/feishu) — bot Feishu/Lark melalui WebSocket (plugin bawaan).
- [Google Chat](/id/channels/googlechat) — aplikasi Google Chat API melalui webhook HTTP.
- [iMessage (legacy)](/id/channels/imessage) — Integrasi macOS lama melalui imsg CLI (tidak digunakan lagi, gunakan BlueBubbles untuk penyiapan baru).
- [IRC](/id/channels/irc) — Server IRC klasik; saluran + DM dengan kontrol pemasangan/allowlist.
- [LINE](/id/channels/line) — bot LINE Messaging API (plugin bawaan).
- [Matrix](/id/channels/matrix) — protokol Matrix (plugin bawaan).
- [Mattermost](/id/channels/mattermost) — Bot API + WebSocket; saluran, grup, DM (plugin bawaan).
- [Microsoft Teams](/id/channels/msteams) — Bot Framework; dukungan enterprise (plugin bawaan).
- [Nextcloud Talk](/id/channels/nextcloud-talk) — Chat yang dihosting sendiri melalui Nextcloud Talk (plugin bawaan).
- [Nostr](/id/channels/nostr) — DM terdesentralisasi melalui NIP-04 (plugin bawaan).
- [QQ Bot](/id/channels/qqbot) — QQ Bot API; chat pribadi, chat grup, dan media kaya (plugin bawaan).
- [Signal](/id/channels/signal) — signal-cli; berfokus pada privasi.
- [Slack](/id/channels/slack) — Bolt SDK; aplikasi workspace.
- [Synology Chat](/id/channels/synology-chat) — Synology NAS Chat melalui webhook keluar+masuk (plugin bawaan).
- [Telegram](/id/channels/telegram) — Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) — messenger berbasis Urbit (plugin bawaan).
- [Twitch](/id/channels/twitch) — chat Twitch melalui koneksi IRC (plugin bawaan).
- [Voice Call](/id/plugins/voice-call) — Telefoni melalui Plivo atau Twilio (plugin, diinstal terpisah).
- [WebChat](/id/web/webchat) — UI WebChat Gateway melalui WebSocket.
- [WeChat](/id/channels/wechat) — plugin Tencent iLink Bot melalui login QR; hanya chat pribadi (plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) — Paling populer; menggunakan Baileys dan memerlukan pemasangan QR.
- [Yuanbao](/id/channels/yuanbao) — bot Tencent Yuanbao (plugin eksternal).
- [Zalo](/id/channels/zalo) — Zalo Bot API; messenger populer Vietnam (plugin bawaan).
- [Zalo Personal](/id/channels/zalouser) — akun pribadi Zalo melalui login QR (plugin bawaan).

## Catatan

- Saluran dapat berjalan secara bersamaan; konfigurasikan beberapa saluran dan OpenClaw akan merutekan per chat.
- Penyiapan tercepat biasanya **Telegram** (token bot sederhana). WhatsApp memerlukan pemasangan QR dan
  menyimpan lebih banyak status di disk.
- Perilaku grup berbeda-beda menurut saluran; lihat [Grup](/id/channels/groups).
- Pemasangan DM dan allowlist diberlakukan demi keamanan; lihat [Keamanan](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah saluran](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Penyedia Model](/id/providers/models).

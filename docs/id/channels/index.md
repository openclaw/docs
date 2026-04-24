---
read_when:
    - Anda ingin memilih kanal obrolan untuk OpenClaw
    - Anda memerlukan ikhtisar singkat tentang platform pesan yang didukung
summary: Platform pesan yang dapat dihubungkan dengan OpenClaw
title: Kanal obrolan
x-i18n:
    generated_at: "2026-04-24T08:58:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw dapat berbicara dengan Anda di aplikasi obrolan apa pun yang sudah Anda gunakan. Setiap kanal terhubung melalui Gateway.
Teks didukung di semua tempat; media dan reaksi bervariasi menurut kanal.

## Kanal yang didukung

- [BlueBubbles](/id/channels/bluebubbles) — **Direkomendasikan untuk iMessage**; menggunakan REST API server macOS BlueBubbles dengan dukungan fitur penuh (Plugin bawaan; edit, batalkan kirim, efek, reaksi, manajemen grup — edit saat ini rusak di macOS 26 Tahoe).
- [Discord](/id/channels/discord) — Discord Bot API + Gateway; mendukung server, kanal, dan DM.
- [Feishu](/id/channels/feishu) — bot Feishu/Lark melalui WebSocket (Plugin bawaan).
- [Google Chat](/id/channels/googlechat) — aplikasi Google Chat API melalui webhook HTTP.
- [iMessage (legacy)](/id/channels/imessage) — integrasi macOS lama melalui CLI imsg (deprecated, gunakan BlueBubbles untuk pengaturan baru).
- [IRC](/id/channels/irc) — server IRC klasik; kanal + DM dengan kontrol pairing/allowlist.
- [LINE](/id/channels/line) — bot LINE Messaging API (Plugin bawaan).
- [Matrix](/id/channels/matrix) — protokol Matrix (Plugin bawaan).
- [Mattermost](/id/channels/mattermost) — Bot API + WebSocket; kanal, grup, DM (Plugin bawaan).
- [Microsoft Teams](/id/channels/msteams) — Bot Framework; dukungan enterprise (Plugin bawaan).
- [Nextcloud Talk](/id/channels/nextcloud-talk) — obrolan self-hosted melalui Nextcloud Talk (Plugin bawaan).
- [Nostr](/id/channels/nostr) — DM terdesentralisasi melalui NIP-04 (Plugin bawaan).
- [QQ Bot](/id/channels/qqbot) — QQ Bot API; obrolan pribadi, obrolan grup, dan media kaya (Plugin bawaan).
- [Signal](/id/channels/signal) — signal-cli; berfokus pada privasi.
- [Slack](/id/channels/slack) — SDK Bolt; aplikasi workspace.
- [Synology Chat](/id/channels/synology-chat) — Synology NAS Chat melalui webhook keluar+masuk (Plugin bawaan).
- [Telegram](/id/channels/telegram) — Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) — messenger berbasis Urbit (Plugin bawaan).
- [Twitch](/id/channels/twitch) — obrolan Twitch melalui koneksi IRC (Plugin bawaan).
- [Voice Call](/id/plugins/voice-call) — telefoni melalui Plivo atau Twilio (Plugin, diinstal secara terpisah).
- [WebChat](/id/web/webchat) — UI Gateway WebChat melalui WebSocket.
- [WeChat](/id/channels/wechat) — Plugin Bot iLink Tencent melalui login QR; hanya obrolan pribadi (Plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) — Paling populer; menggunakan Baileys dan memerlukan pairing QR.
- [Zalo](/id/channels/zalo) — Zalo Bot API; messenger populer di Vietnam (Plugin bawaan).
- [Zalo Personal](/id/channels/zalouser) — akun pribadi Zalo melalui login QR (Plugin bawaan).

## Catatan

- Kanal dapat berjalan secara bersamaan; konfigurasikan beberapa kanal dan OpenClaw akan melakukan routing per obrolan.
- Pengaturan tercepat biasanya adalah **Telegram** (token bot sederhana). WhatsApp memerlukan pairing QR dan
  menyimpan lebih banyak state di disk.
- Perilaku grup bervariasi menurut kanal; lihat [Grup](/id/channels/groups).
- Pairing DM dan allowlist diberlakukan demi keamanan; lihat [Keamanan](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah kanal](/id/channels/troubleshooting).
- Provider model didokumentasikan secara terpisah; lihat [Provider Model](/id/providers/models).

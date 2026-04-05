---
read_when:
    - Anda menginginkan daftar lengkap tentang apa saja yang didukung OpenClaw
summary: Kemampuan OpenClaw di berbagai channel, perutean, media, dan UX.
title: Fitur
x-i18n:
    generated_at: "2026-04-05T13:50:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43eae89d9af44ea786dd0221d8d602ebcea15da9d5064396ac9920c0345e2ad3
    source_path: concepts/features.md
    workflow: 15
---

# Fitur

## Sorotan

<Columns>
  <Card title="Channel" icon="message-square">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, dan lainnya dengan satu Gateway.
  </Card>
  <Card title="Plugins" icon="plug">
    Plugin bawaan menambahkan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, dan lainnya tanpa instalasi terpisah pada rilis normal saat ini.
  </Card>
  <Card title="Perutean" icon="route">
    Perutean multi-agen dengan sesi yang terisolasi.
  </Card>
  <Card title="Media" icon="image">
    Gambar, audio, video, dokumen, serta pembuatan gambar/video.
  </Card>
  <Card title="Aplikasi dan UI" icon="monitor">
    UI Kontrol Web dan aplikasi pendamping macOS.
  </Card>
  <Card title="Node seluler" icon="smartphone">
    Node iOS dan Android dengan pairing, suara/chat, dan perintah perangkat yang kaya.
  </Card>
</Columns>

## Daftar lengkap

**Channel:**

- Channel bawaan mencakup Discord, Google Chat, iMessage (lama), IRC, Signal, Slack, Telegram, WebChat, dan WhatsApp
- Channel plugin bawaan mencakup BlueBubbles untuk iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, dan Zalo Personal
- Channel plugin opsional yang diinstal terpisah mencakup Voice Call dan paket pihak ketiga seperti WeChat
- Channel plugin pihak ketiga dapat memperluas Gateway lebih lanjut, seperti WeChat
- Dukungan chat grup dengan aktivasi berbasis mention
- Keamanan DM dengan allowlist dan pairing

**Agen:**

- Runtime agen tersemat dengan streaming alat
- Perutean multi-agen dengan sesi terisolasi per ruang kerja atau pengirim
- Sesi: chat langsung digabungkan ke `main`; grup diisolasi
- Streaming dan chunking untuk respons yang panjang

**Autentikasi dan provider:**

- 35+ provider model (Anthropic, OpenAI, Google, dan lainnya)
- Autentikasi langganan melalui OAuth (misalnya OpenAI Codex)
- Dukungan provider kustom dan self-hosted (vLLM, SGLang, Ollama, dan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic)

**Media:**

- Gambar, audio, video, dan dokumen masuk dan keluar
- Permukaan kemampuan bersama untuk pembuatan gambar dan video
- Transkripsi catatan suara
- Text-to-speech dengan beberapa provider

**Aplikasi dan antarmuka:**

- WebChat dan UI Kontrol browser
- Aplikasi pendamping bilah menu macOS
- Node iOS dengan pairing, Canvas, kamera, perekaman layar, lokasi, dan suara
- Node Android dengan pairing, chat, suara, Canvas, kamera, dan perintah perangkat

**Alat dan otomatisasi:**

- Otomatisasi browser, exec, sandboxing
- Pencarian web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Pekerjaan cron dan penjadwalan heartbeat
- Skills, plugin, dan pipeline alur kerja (Lobster)

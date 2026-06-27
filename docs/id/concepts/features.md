---
read_when:
    - Anda menginginkan daftar lengkap tentang apa yang didukung OpenClaw
summary: Kemampuan OpenClaw di seluruh channel, perutean, media, dan UX.
title: Fitur
x-i18n:
    generated_at: "2026-06-27T17:23:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## Sorotan

<Columns>
  <Card title="Kanal" icon="message-square" href="/id/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, dan lainnya dengan satu Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/id/tools/plugin">
    Plugin bawaan menambahkan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, dan lainnya tanpa instalasi terpisah pada rilis normal saat ini.
  </Card>
  <Card title="Perutean" icon="route" href="/id/concepts/multi-agent">
    Perutean multi-agen dengan sesi terisolasi.
  </Card>
  <Card title="Media" icon="image" href="/id/nodes/images">
    Gambar, audio, video, dokumen, serta pembuatan gambar/video.
  </Card>
  <Card title="Aplikasi dan UI" icon="monitor" href="/id/platforms">
    Windows Hub, Web Control UI, aplikasi macOS, dan node seluler.
  </Card>
  <Card title="Node seluler" icon="smartphone" href="/id/nodes">
    Node iOS dan Android dengan pairing, suara/chat, dan perintah perangkat kaya.
  </Card>
</Columns>

## Daftar lengkap

**Kanal:**

- Kanal bawaan mencakup Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat, dan WhatsApp
- Kanal Plugin bawaan mencakup Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, dan Zalo Personal
- Plugin kanal opsional yang diinstal terpisah mencakup Voice Call dan paket pihak ketiga seperti WeChat
- Plugin kanal pihak ketiga dapat memperluas Gateway lebih jauh, seperti WeChat
- Dukungan chat grup dengan aktivasi berbasis mention
- Keamanan DM dengan allowlist dan pairing

**Agen:**

- Runtime agen tertanam dengan streaming tool
- Perutean multi-agen dengan sesi terisolasi per workspace atau pengirim
- Sesi: chat langsung digabungkan ke `main` bersama; grup diisolasi
- Streaming dan pemecahan potongan untuk respons panjang

**Autentikasi dan penyedia:**

- 35+ penyedia model (Anthropic, OpenAI, Google, dan lainnya)
- Autentikasi langganan melalui OAuth (mis. OpenAI Codex)
- Dukungan penyedia kustom dan self-hosted (vLLM, SGLang, Ollama, dan endpoint apa pun yang kompatibel dengan OpenAI atau kompatibel dengan Anthropic)

**Media:**

- Gambar, audio, video, dan dokumen masuk dan keluar
- Permukaan kapabilitas pembuatan gambar dan pembuatan video bersama
- Transkripsi voice note
- Text-to-speech dengan beberapa penyedia

**Aplikasi dan antarmuka:**

- WebChat dan Control UI browser
- Aplikasi pendamping bilah menu macOS
- Node iOS dengan pairing, Canvas, kamera, perekaman layar, lokasi, dan suara
- Node Android dengan pairing, chat, suara, Canvas, kamera, dan perintah perangkat

**Tool dan otomatisasi:**

- Otomatisasi browser, exec, sandboxing
- Pencarian web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Job Cron dan penjadwalan Heartbeat
- Skills, Plugin, dan pipeline workflow (Lobster)

## Terkait

<CardGroup cols={2}>
  <Card title="Fitur eksperimental" href="/id/concepts/experimental-features" icon="flask">
    Fitur opt-in yang belum dikirimkan ke permukaan default.
  </Card>
  <Card title="Runtime agen" href="/id/concepts/agent" icon="robot">
    Model runtime agen dan bagaimana run dikirimkan.
  </Card>
  <Card title="Kanal" href="/id/channels" icon="message-square">
    Hubungkan Telegram, WhatsApp, Discord, Slack, dan lainnya dari satu Gateway.
  </Card>
  <Card title="Plugin" href="/id/tools/plugin" icon="plug">
    Plugin bawaan dan pihak ketiga yang memperluas OpenClaw.
  </Card>
</CardGroup>

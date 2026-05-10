---
read_when:
    - Anda menginginkan daftar lengkap tentang apa saja yang didukung OpenClaw
summary: Kemampuan OpenClaw di seluruh kanal, perutean, media, dan UX.
title: Fitur
x-i18n:
    generated_at: "2026-05-10T19:30:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## Sorotan

<Columns>
  <Card title="Saluran" icon="message-square" href="/id/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, dan lainnya dengan satu Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/id/tools/plugin">
    Plugin bawaan menambahkan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, dan lainnya tanpa instalasi terpisah pada rilis terkini normal.
  </Card>
  <Card title="Perutean" icon="route" href="/id/concepts/multi-agent">
    Perutean multi-agen dengan sesi terisolasi.
  </Card>
  <Card title="Media" icon="image" href="/id/nodes/images">
    Gambar, audio, video, dokumen, serta pembuatan gambar/video.
  </Card>
  <Card title="Aplikasi dan UI" icon="monitor" href="/id/web/control-ui">
    UI Kontrol Web dan aplikasi pendamping macOS.
  </Card>
  <Card title="Node seluler" icon="smartphone" href="/id/nodes">
    Node iOS dan Android dengan pairing, suara/chat, dan perintah perangkat yang kaya.
  </Card>
</Columns>

## Daftar lengkap

**Saluran:**

- Saluran bawaan mencakup Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat, dan WhatsApp
- Saluran Plugin bawaan mencakup Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, dan Zalo Personal
- Plugin saluran opsional yang diinstal terpisah mencakup Voice Call dan paket pihak ketiga seperti WeChat
- Plugin saluran pihak ketiga dapat memperluas Gateway lebih jauh, seperti WeChat
- Dukungan chat grup dengan aktivasi berbasis mention
- Keamanan DM dengan allowlist dan pairing

**Agen:**

- Runtime agen tertanam dengan streaming alat
- Perutean multi-agen dengan sesi terisolasi per workspace atau pengirim
- Sesi: chat langsung digabungkan ke `main` bersama; grup diisolasi
- Streaming dan pemotongan untuk respons panjang

**Auth dan penyedia:**

- 35+ penyedia model (Anthropic, OpenAI, Google, dan lainnya)
- Auth langganan melalui OAuth (misalnya OpenAI Codex)
- Dukungan penyedia kustom dan self-hosted (vLLM, SGLang, Ollama, dan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic)

**Media:**

- Gambar, audio, video, dan dokumen masuk dan keluar
- Permukaan kemampuan bersama untuk pembuatan gambar dan pembuatan video
- Transkripsi voice note
- Text-to-speech dengan beberapa penyedia

**Aplikasi dan antarmuka:**

- WebChat dan UI Kontrol browser
- Aplikasi pendamping bilah menu macOS
- Node iOS dengan pairing, Canvas, kamera, perekaman layar, lokasi, dan suara
- Node Android dengan pairing, chat, suara, Canvas, kamera, dan perintah perangkat

**Alat dan otomatisasi:**

- Otomatisasi browser, exec, sandboxing
- Pencarian web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron job dan penjadwalan heartbeat
- Skills, Plugin, dan pipeline alur kerja (Lobster)

## Terkait

<CardGroup cols={2}>
  <Card title="Fitur eksperimental" href="/id/concepts/experimental-features" icon="flask">
    Fitur opt-in yang belum dikirimkan ke permukaan default.
  </Card>
  <Card title="Runtime agen" href="/id/concepts/agent" icon="robot">
    Model runtime agen dan bagaimana run didispatch.
  </Card>
  <Card title="Saluran" href="/id/channels" icon="message-square">
    Hubungkan Telegram, WhatsApp, Discord, Slack, dan lainnya dari satu Gateway.
  </Card>
  <Card title="Plugin" href="/id/tools/plugin" icon="plug">
    Plugin bawaan dan pihak ketiga yang memperluas OpenClaw.
  </Card>
</CardGroup>

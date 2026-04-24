---
read_when:
    - Anda menginginkan daftar lengkap tentang apa yang didukung OpenClaw
summary: Kapabilitas OpenClaw di berbagai saluran, perutean, media, dan UX.
title: Fitur
x-i18n:
    generated_at: "2026-04-24T09:04:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## Sorotan

<Columns>
  <Card title="Channels" icon="message-square" href="/id/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, dan lainnya dengan satu Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/id/tools/plugin">
    Plugin bawaan menambahkan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, dan lainnya tanpa instalasi terpisah pada rilis normal saat ini.
  </Card>
  <Card title="Routing" icon="route" href="/id/concepts/multi-agent">
    Perutean multi-agen dengan sesi terisolasi.
  </Card>
  <Card title="Media" icon="image" href="/id/nodes/images">
    Gambar, audio, video, dokumen, serta pembuatan gambar/video.
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/id/web/control-ui">
    UI Control web dan aplikasi pendamping macOS.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/id/nodes">
    Node iOS dan Android dengan pairing, suara/chat, dan perintah perangkat kaya.
  </Card>
</Columns>

## Daftar lengkap

**Saluran:**

- Saluran bawaan mencakup Discord, Google Chat, iMessage (lama), IRC, Signal, Slack, Telegram, WebChat, dan WhatsApp
- Saluran plugin bawaan mencakup BlueBubbles untuk iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, dan Zalo Personal
- Plugin saluran opsional yang diinstal terpisah mencakup Voice Call dan paket pihak ketiga seperti WeChat
- Plugin saluran pihak ketiga dapat memperluas Gateway lebih jauh, seperti WeChat
- Dukungan chat grup dengan aktivasi berbasis mention
- Keamanan DM dengan allowlist dan pairing

**Agen:**

- Runtime agen tertanam dengan streaming alat
- Perutean multi-agen dengan sesi terisolasi per workspace atau pengirim
- Sesi: chat langsung digabungkan ke `main` bersama; grup diisolasi
- Streaming dan chunking untuk respons panjang

**Autentikasi dan provider:**

- 35+ provider model (Anthropic, OpenAI, Google, dan lainnya)
- Autentikasi langganan melalui OAuth (misalnya OpenAI Codex)
- Dukungan provider kustom dan self-hosted (vLLM, SGLang, Ollama, dan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic)

**Media:**

- Gambar, audio, video, dan dokumen masuk dan keluar
- Permukaan kapabilitas bersama untuk pembuatan gambar dan pembuatan video
- Transkripsi voice note
- Text-to-speech dengan banyak provider

**Aplikasi dan antarmuka:**

- WebChat dan UI Control browser
- Aplikasi pendamping menu bar macOS
- Node iOS dengan pairing, Canvas, kamera, perekaman layar, lokasi, dan suara
- Node Android dengan pairing, chat, suara, Canvas, kamera, dan perintah perangkat

**Alat dan otomasi:**

- Otomatisasi browser, exec, sandboxing
- Pencarian web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Job Cron dan penjadwalan Heartbeat
- Skills, plugin, dan pipeline alur kerja (Lobster)

## Terkait

- [Fitur eksperimental](/id/concepts/experimental-features)
- [Runtime agen](/id/concepts/agent)

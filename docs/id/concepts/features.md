---
read_when:
    - Anda menginginkan daftar lengkap tentang apa saja yang didukung OpenClaw
summary: Kemampuan OpenClaw di berbagai kanal, perutean, media, dan pengalaman pengguna.
title: Fitur
x-i18n:
    generated_at: "2026-07-12T14:04:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Sorotan

<Columns>
  <Card title="Saluran" icon="message-square" href="/id/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, dan lainnya dengan satu Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/id/tools/plugin">
    Plugin resmi menambahkan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, dan puluhan lainnya dengan satu perintah instalasi.
  </Card>
  <Card title="Perutean" icon="route" href="/id/concepts/multi-agent">
    Perutean multiagen dengan sesi yang terisolasi.
  </Card>
  <Card title="Media" icon="image" href="/id/nodes/images">
    Gambar, audio, video, dokumen, serta pembuatan gambar/video.
  </Card>
  <Card title="Aplikasi dan UI" icon="monitor" href="/id/platforms">
    Windows Hub, Control UI berbasis peramban, aplikasi bilah menu macOS, dan node seluler.
  </Card>
  <Card title="Node seluler" icon="smartphone" href="/id/nodes">
    Node iOS dan Android dengan pemasangan, suara/obrolan, serta perintah perangkat yang lengkap.
  </Card>
</Columns>

## Daftar lengkap

**Saluran:**

- iMessage, Telegram, dan WebChat disertakan dalam instalasi inti; setiap saluran lainnya merupakan
  Plugin resmi yang diinstal dengan `openclaw plugins install @openclaw/<id>` (atau sesuai kebutuhan
  selama `openclaw onboard` / `openclaw channels add`)
- Saluran Plugin resmi: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo, dan Zalo Personal
- Saluran Plugin eksternal yang dipelihara di luar repo OpenClaw: WeChat, Yuanbao, dan Zalo ClawBot
- Dukungan obrolan grup dengan aktivasi berbasis penyebutan
- Keamanan pesan langsung dengan daftar izin dan pemasangan

**Agen:**

- Runtime agen tertanam dengan streaming alat
- Perutean multiagen dengan sesi yang terisolasi untuk setiap ruang kerja atau pengirim
- Sesi: obrolan langsung digabungkan ke dalam `main` bersama; grup diisolasi
- Streaming dan pemenggalan untuk respons panjang

**Autentikasi dan penyedia:**

- Lebih dari 35 penyedia model (Anthropic, OpenAI, Google, dan lainnya)
- Autentikasi langganan melalui OAuth (misalnya OpenAI Codex)
- Dukungan penyedia khusus dan yang dihosting sendiri (vLLM, SGLang, Ollama, llama.cpp, LM Studio, serta
  endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic)

**Media:**

- Masukan dan keluaran gambar, audio, video, dan dokumen
- Antarmuka kemampuan bersama untuk pembuatan gambar dan video
- Transkripsi catatan suara
- Teks ke ucapan dengan beberapa penyedia

**Aplikasi dan antarmuka:**

- WebChat dan Control UI berbasis peramban
- Aplikasi pendamping bilah menu macOS
- Node iOS dengan pemasangan, Canvas, kamera, perekaman layar, lokasi, dan suara
- Node Android dengan pemasangan, obrolan, suara, Canvas, kamera, dan perintah perangkat

**Alat dan otomatisasi:**

- Otomatisasi peramban, eksekusi, dan sandboxing
- Pencarian web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tugas Cron dan penjadwalan Heartbeat
- Skills, Plugin, dan pipeline alur kerja (Lobster)

## Terkait

<CardGroup cols={2}>
  <Card title="Fitur eksperimental" href="/id/concepts/experimental-features" icon="flask">
    Fitur opsional yang belum disertakan pada antarmuka bawaan.
  </Card>
  <Card title="Runtime agen" href="/id/concepts/agent" icon="robot">
    Model runtime agen dan cara proses dijalankan.
  </Card>
  <Card title="Saluran" href="/id/channels" icon="message-square">
    Hubungkan Telegram, WhatsApp, Discord, Slack, dan lainnya dari satu Gateway.
  </Card>
  <Card title="Plugin" href="/id/tools/plugin" icon="plug">
    Plugin resmi dan eksternal yang memperluas OpenClaw.
  </Card>
</CardGroup>

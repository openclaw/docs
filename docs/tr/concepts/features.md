---
read_when:
    - OpenClaw'ın desteklediği her şeyin tam listesini istiyorsunuz
summary: Kanallar, yönlendirme, medya ve kullanıcı deneyimi genelinde OpenClaw yetenekleri.
title: Özellikler
x-i18n:
    generated_at: "2026-07-12T11:38:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Öne Çıkanlar

<Columns>
  <Card title="Kanallar" icon="message-square" href="/tr/channels">
    Tek bir Gateway ile Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat ve daha fazlası.
  </Card>
  <Card title="Plugin'ler" icon="plug" href="/tr/tools/plugin">
    Resmî Plugin'ler tek bir kurulum komutuyla Matrix, Nextcloud Talk, Nostr, Twitch, Zalo ve onlarca başka hizmeti ekler.
  </Card>
  <Card title="Yönlendirme" icon="route" href="/tr/concepts/multi-agent">
    Yalıtılmış oturumlarla çok ajanlı yönlendirme.
  </Card>
  <Card title="Medya" icon="image" href="/tr/nodes/images">
    Görüntüler, sesler, videolar, belgeler ve görüntü/video üretimi.
  </Card>
  <Card title="Uygulamalar ve Kullanıcı Arayüzü" icon="monitor" href="/tr/platforms">
    Windows Hub, tarayıcı Control UI'si, macOS menü çubuğu uygulaması ve mobil Node'lar.
  </Card>
  <Card title="Mobil Node'lar" icon="smartphone" href="/tr/nodes">
    Eşleştirme, sesli iletişim/sohbet ve gelişmiş cihaz komutları sunan iOS ve Android Node'ları.
  </Card>
</Columns>

## Tam Liste

**Kanallar:**

- iMessage, Telegram ve WebChat temel kurulumla birlikte gelir; diğer tüm kanallar `openclaw plugins install @openclaw/<id>` ile (veya `openclaw onboard` / `openclaw channels add` sırasında isteğe bağlı olarak) kurulan
  resmî Plugin'lerdir
- Resmî Plugin kanalları: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo ve Zalo Personal
- OpenClaw deposu dışında sürdürülen haricî Plugin kanalları: WeChat, Yuanbao ve Zalo ClawBot
- Bahsetmeye dayalı etkinleştirme ile grup sohbeti desteği
- İzin listeleri ve eşleştirme ile doğrudan mesaj güvenliği

**Ajan:**

- Araç akışı özellikli gömülü ajan çalışma zamanı
- Çalışma alanı veya gönderici başına yalıtılmış oturumlarla çok ajanlı yönlendirme
- Oturumlar: doğrudan sohbetler paylaşılan `main` altında birleştirilir; gruplar yalıtılır
- Uzun yanıtlar için akış ve parçalara ayırma

**Kimlik doğrulama ve sağlayıcılar:**

- 35'ten fazla model sağlayıcısı (Anthropic, OpenAI, Google ve daha fazlası)
- OAuth aracılığıyla abonelik kimlik doğrulaması (ör. OpenAI Codex)
- Özel ve kendi sunucunuzda barındırılan sağlayıcı desteği (vLLM, SGLang, Ollama, llama.cpp, LM Studio ve
  OpenAI veya Anthropic uyumlu herhangi bir uç nokta)

**Medya:**

- Gelen ve giden görüntüler, sesler, videolar ve belgeler
- Paylaşılan görüntü ve video üretimi yetenek yüzeyleri
- Sesli notları metne dönüştürme
- Birden fazla sağlayıcıyla metinden konuşmaya dönüştürme

**Uygulamalar ve arayüzler:**

- WebChat ve tarayıcı Control UI'si
- macOS menü çubuğu yardımcı uygulaması
- Eşleştirme, Canvas, kamera, ekran kaydı, konum ve ses özelliklerine sahip iOS Node'u
- Eşleştirme, sohbet, ses, Canvas, kamera ve cihaz komutlarına sahip Android Node'u

**Araçlar ve otomasyon:**

- Tarayıcı otomasyonu, komut yürütme ve korumalı alan
- Web araması (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron işleri ve Heartbeat zamanlaması
- Skills, Plugin'ler ve iş akışı işlem hatları (Lobster)

## İlgili İçerikler

<CardGroup cols={2}>
  <Card title="Deneysel Özellikler" href="/tr/concepts/experimental-features" icon="flask">
    Henüz varsayılan yüzeyde kullanıma sunulmamış, isteğe bağlı özellikler.
  </Card>
  <Card title="Ajan Çalışma Zamanı" href="/tr/concepts/agent" icon="robot">
    Ajan çalışma zamanı modeli ve çalıştırmaların nasıl yönlendirildiği.
  </Card>
  <Card title="Kanallar" href="/tr/channels" icon="message-square">
    Telegram, WhatsApp, Discord, Slack ve daha fazlasını tek bir Gateway üzerinden bağlayın.
  </Card>
  <Card title="Plugin'ler" href="/tr/tools/plugin" icon="plug">
    OpenClaw'u genişleten resmî ve haricî Plugin'ler.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw’un neleri desteklediğinin tam listesini istiyorsunuz
summary: Kanallar, yönlendirme, medya ve UX genelinde OpenClaw yetenekleri.
title: Özellikler
x-i18n:
    generated_at: "2026-06-28T00:27:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## Öne çıkanlar

<Columns>
  <Card title="Kanallar" icon="message-square" href="/tr/channels">
    Tek bir Gateway ile Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat ve daha fazlası.
  </Card>
  <Card title="Pluginler" icon="plug" href="/tr/tools/plugin">
    Paketlenmiş pluginler, normal güncel sürümlerde ayrı kurulumlar olmadan Matrix, Nextcloud Talk, Nostr, Twitch, Zalo ve daha fazlasını ekler.
  </Card>
  <Card title="Yönlendirme" icon="route" href="/tr/concepts/multi-agent">
    Yalıtılmış oturumlarla çok ajanlı yönlendirme.
  </Card>
  <Card title="Medya" icon="image" href="/tr/nodes/images">
    Görseller, ses, video, belgeler ve görsel/video üretimi.
  </Card>
  <Card title="Uygulamalar ve UI" icon="monitor" href="/tr/platforms">
    Windows Hub, Web Control UI, macOS uygulaması ve mobil düğümler.
  </Card>
  <Card title="Mobil düğümler" icon="smartphone" href="/tr/nodes">
    Eşleştirme, ses/sohbet ve zengin cihaz komutlarıyla iOS ve Android düğümleri.
  </Card>
</Columns>

## Tam liste

**Kanallar:**

- Yerleşik kanallar Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat ve WhatsApp içerir
- Paketlenmiş plugin kanalları Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal içerir
- İsteğe bağlı olarak ayrıca kurulan kanal pluginleri Voice Call ve WeChat gibi üçüncü taraf paketleri içerir
- Üçüncü taraf kanal pluginleri Gateway'i WeChat gibi seçeneklerle daha da genişletebilir
- Bahsetmeye dayalı etkinleştirmeyle grup sohbeti desteği
- İzin listeleri ve eşleştirme ile DM güvenliği

**Ajan:**

- Araç akışıyla gömülü ajan çalışma zamanı
- Çalışma alanı veya gönderici başına yalıtılmış oturumlarla çok ajanlı yönlendirme
- Oturumlar: doğrudan sohbetler paylaşılan `main` içine birleşir; gruplar yalıtılır
- Uzun yanıtlar için akış ve parçalara ayırma

**Kimlik doğrulama ve sağlayıcılar:**

- 35+ model sağlayıcısı (Anthropic, OpenAI, Google ve daha fazlası)
- OAuth üzerinden abonelik kimlik doğrulaması (örn. OpenAI Codex)
- Özel ve kendi barındırdığınız sağlayıcı desteği (vLLM, SGLang, Ollama ve OpenAI uyumlu veya Anthropic uyumlu herhangi bir uç nokta)

**Medya:**

- İçeri ve dışarı görseller, ses, video ve belgeler
- Paylaşılan görsel üretimi ve video üretimi yetenek yüzeyleri
- Sesli not transkripsiyonu
- Birden çok sağlayıcıyla metinden sese dönüştürme

**Uygulamalar ve arayüzler:**

- WebChat ve tarayıcı Control UI
- macOS menü çubuğu eşlikçi uygulaması
- Eşleştirme, Canvas, kamera, ekran kaydı, konum ve ses özellikli iOS düğümü
- Eşleştirme, sohbet, ses, Canvas, kamera ve cihaz komutları özellikli Android düğümü

**Araçlar ve otomasyon:**

- Tarayıcı otomasyonu, exec, sandboxing
- Web araması (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron işleri ve Heartbeat zamanlaması
- Skills, pluginler ve iş akışı işlem hatları (Lobster)

## İlgili

<CardGroup cols={2}>
  <Card title="Deneysel özellikler" href="/tr/concepts/experimental-features" icon="flask">
    Varsayılan yüzeye henüz gönderilmemiş, isteğe bağlı etkinleştirilen özellikler.
  </Card>
  <Card title="Ajan çalışma zamanı" href="/tr/concepts/agent" icon="robot">
    Ajan çalışma zamanı modeli ve çalışmaların nasıl dağıtıldığı.
  </Card>
  <Card title="Kanallar" href="/tr/channels" icon="message-square">
    Telegram, WhatsApp, Discord, Slack ve daha fazlasını tek bir Gateway'den bağlayın.
  </Card>
  <Card title="Pluginler" href="/tr/tools/plugin" icon="plug">
    OpenClaw'ı genişleten paketlenmiş ve üçüncü taraf pluginler.
  </Card>
</CardGroup>

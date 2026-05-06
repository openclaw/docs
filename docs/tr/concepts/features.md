---
read_when:
    - OpenClaw’ın desteklediklerinin tam listesini istiyorsunuz
summary: Kanallar, yönlendirme, medya ve kullanıcı deneyimi genelinde OpenClaw yetenekleri.
title: Özellikler
x-i18n:
    generated_at: "2026-05-06T09:07:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## Öne çıkanlar

<Columns>
  <Card title="Kanallar" icon="message-square" href="/tr/channels">
    Tek bir Gateway ile Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat ve daha fazlası.
  </Card>
  <Card title="Pluginler" icon="plug" href="/tr/tools/plugin">
    Paketli pluginler, normal güncel sürümlerde ayrı kurulum gerektirmeden Matrix, Nextcloud Talk, Nostr, Twitch, Zalo ve daha fazlasını ekler.
  </Card>
  <Card title="Yönlendirme" icon="route" href="/tr/concepts/multi-agent">
    Yalıtılmış oturumlarla çoklu aracı yönlendirmesi.
  </Card>
  <Card title="Medya" icon="image" href="/tr/nodes/images">
    Görseller, ses, video, belgeler ve görsel/video üretimi.
  </Card>
  <Card title="Uygulamalar ve UI" icon="monitor" href="/tr/web/control-ui">
    Web Control UI ve macOS eşlikçi uygulaması.
  </Card>
  <Card title="Mobil düğümler" icon="smartphone" href="/tr/nodes">
    Eşleştirme, ses/sohbet ve zengin cihaz komutlarıyla iOS ve Android düğümleri.
  </Card>
</Columns>

## Tam liste

**Kanallar:**

- Yerleşik kanallar Discord, Google Chat, iMessage (eski), IRC, Signal, Slack, Telegram, WebChat ve WhatsApp içerir
- Paketli plugin kanalları iMessage için BlueBubbles, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal içerir
- İsteğe bağlı olarak ayrı kurulan kanal pluginleri Voice Call ve WeChat gibi üçüncü taraf paketleri içerir
- Üçüncü taraf kanal pluginleri Gateway'i WeChat gibi seçeneklerle daha da genişletebilir
- Bahsetme tabanlı etkinleştirmeyle grup sohbeti desteği
- İzin listeleri ve eşleştirme ile DM güvenliği

**Aracı:**

- Araç akışıyla gömülü aracı çalışma zamanı
- Çalışma alanı veya gönderici başına yalıtılmış oturumlarla çoklu aracı yönlendirmesi
- Oturumlar: doğrudan sohbetler paylaşılan `main` içinde birleştirilir; gruplar yalıtılır
- Uzun yanıtlar için akış ve parçalara ayırma

**Kimlik doğrulama ve sağlayıcılar:**

- 35+ model sağlayıcısı (Anthropic, OpenAI, Google ve daha fazlası)
- OAuth üzerinden abonelik kimlik doğrulaması (örn. OpenAI Codex)
- Özel ve kendi barındırdığınız sağlayıcı desteği (vLLM, SGLang, Ollama ve OpenAI uyumlu veya Anthropic uyumlu herhangi bir uç nokta)

**Medya:**

- İçeri ve dışarı görseller, ses, video ve belgeler
- Paylaşılan görsel üretimi ve video üretimi yetenek yüzeyleri
- Sesli not deşifresi
- Birden fazla sağlayıcıyla metinden konuşmaya dönüştürme

**Uygulamalar ve arayüzler:**

- WebChat ve tarayıcı Control UI
- macOS menü çubuğu eşlikçi uygulaması
- Eşleştirme, Canvas, kamera, ekran kaydı, konum ve ses özellikli iOS düğümü
- Eşleştirme, sohbet, ses, Canvas, kamera ve cihaz komutları özellikli Android düğümü

**Araçlar ve otomasyon:**

- Tarayıcı otomasyonu, exec, sandboxing
- Web araması (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron işleri ve Heartbeat zamanlaması
- Skills, pluginler ve iş akışı hatları (Lobster)

## İlgili

<CardGroup cols={2}>
  <Card title="Deneysel özellikler" href="/tr/concepts/experimental-features" icon="flask">
    Henüz varsayılan yüzeye sunulmamış, isteğe bağlı etkinleştirilen özellikler.
  </Card>
  <Card title="Aracı çalışma zamanı" href="/tr/concepts/agent" icon="robot">
    Aracı çalışma zamanı modeli ve çalıştırmaların nasıl dağıtıldığı.
  </Card>
  <Card title="Kanallar" href="/tr/channels" icon="message-square">
    Telegram, WhatsApp, Discord, Slack ve daha fazlasını tek bir Gateway üzerinden bağlayın.
  </Card>
  <Card title="Pluginler" href="/tr/tools/plugin" icon="plug">
    OpenClaw'ı genişleten paketli ve üçüncü taraf pluginler.
  </Card>
</CardGroup>

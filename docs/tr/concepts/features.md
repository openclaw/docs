---
read_when:
    - OpenClaw'ın neleri desteklediğinin tam bir listesini istiyorsunuz
summary: OpenClaw’ın kanallar, yönlendirme, medya ve kullanıcı deneyimi genelindeki yetenekleri.
title: Özellikler
x-i18n:
    generated_at: "2026-05-07T01:51:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f95185073e52f4b5b34042ea27927984bf0b040d20eb61b135514816fddc214
    source_path: concepts/features.md
    workflow: 16
---

## Öne Çıkanlar

<Columns>
  <Card title="Kanallar" icon="message-square" href="/tr/channels">
    Tek bir Gateway ile Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat ve daha fazlası.
  </Card>
  <Card title="Plugin'ler" icon="plug" href="/tr/tools/plugin">
    Paketle gelen plugin'ler, normal güncel sürümlerde ayrı kurulum gerektirmeden Matrix, Nextcloud Talk, Nostr, Twitch, Zalo ve daha fazlasını ekler.
  </Card>
  <Card title="Yönlendirme" icon="route" href="/tr/concepts/multi-agent">
    Yalıtılmış oturumlarla çok aracılı yönlendirme.
  </Card>
  <Card title="Medya" icon="image" href="/tr/nodes/images">
    Görseller, ses, video, belgeler ve görsel/video üretimi.
  </Card>
  <Card title="Uygulamalar ve UI" icon="monitor" href="/tr/web/control-ui">
    Web Control UI ve macOS yardımcı uygulaması.
  </Card>
  <Card title="Mobil düğümler" icon="smartphone" href="/tr/nodes">
    Eşleştirme, ses/sohbet ve zengin cihaz komutlarıyla iOS ve Android düğümleri.
  </Card>
</Columns>

## Tam liste

**Kanallar:**

- Yerleşik kanallar arasında Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat ve WhatsApp bulunur
- Paketle gelen plugin kanalları arasında eski iMessage köprüsü olarak BlueBubbles, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal bulunur
- İsteğe bağlı olarak ayrı kurulan kanal plugin'leri arasında Voice Call ve WeChat gibi üçüncü taraf paketler bulunur
- Üçüncü taraf kanal plugin'leri, WeChat gibi seçeneklerle Gateway'i daha da genişletebilir
- Bahsetme tabanlı etkinleştirme ile grup sohbeti desteği
- İzin listeleri ve eşleştirme ile DM güvenliği

**Aracı:**

- Araç akışıyla gömülü aracı çalışma zamanı
- Çalışma alanı veya gönderici başına yalıtılmış oturumlarla çok aracılı yönlendirme
- Oturumlar: doğrudan sohbetler paylaşılan `main` içinde birleşir; gruplar yalıtılmıştır
- Uzun yanıtlar için akış ve parçalara ayırma

**Kimlik doğrulama ve sağlayıcılar:**

- 35+ model sağlayıcısı (Anthropic, OpenAI, Google ve daha fazlası)
- OAuth üzerinden abonelik kimlik doğrulaması (örn. OpenAI Codex)
- Özel ve kendi barındırdığınız sağlayıcı desteği (vLLM, SGLang, Ollama ve OpenAI uyumlu veya Anthropic uyumlu herhangi bir uç nokta)

**Medya:**

- Görseller, ses, video ve belgeler içeri ve dışarı
- Paylaşılan görsel üretimi ve video üretimi yetenek yüzeyleri
- Sesli not transkripsiyonu
- Birden çok sağlayıcıyla metinden sese

**Uygulamalar ve arayüzler:**

- WebChat ve tarayıcı Control UI
- macOS menü çubuğu yardımcı uygulaması
- Eşleştirme, Canvas, kamera, ekran kaydı, konum ve ses özelliklerine sahip iOS düğümü
- Eşleştirme, sohbet, ses, Canvas, kamera ve cihaz komutlarına sahip Android düğümü

**Araçlar ve otomasyon:**

- Tarayıcı otomasyonu, exec, sandboxing
- Web araması (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron işleri ve heartbeat zamanlaması
- Skills, plugin'ler ve iş akışı işlem hatları (Lobster)

## İlgili

<CardGroup cols={2}>
  <Card title="Deneysel özellikler" href="/tr/concepts/experimental-features" icon="flask">
    Henüz varsayılan yüzeye gönderilmemiş, isteğe bağlı özellikler.
  </Card>
  <Card title="Aracı çalışma zamanı" href="/tr/concepts/agent" icon="robot">
    Aracı çalışma zamanı modeli ve çalıştırmaların nasıl gönderildiği.
  </Card>
  <Card title="Kanallar" href="/tr/channels" icon="message-square">
    Telegram, WhatsApp, Discord, Slack ve daha fazlasını tek bir Gateway'den bağlayın.
  </Card>
  <Card title="Plugin'ler" href="/tr/tools/plugin" icon="plug">
    OpenClaw'ı genişleten paketle gelen ve üçüncü taraf plugin'ler.
  </Card>
</CardGroup>

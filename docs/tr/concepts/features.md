---
read_when:
    - OpenClaw’un neleri desteklediğinin tam listesini istiyorsunuz
summary: Kanallar, yönlendirme, medya ve UX genelinde OpenClaw yetenekleri.
title: Özellikler
x-i18n:
    generated_at: "2026-04-22T04:21:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# Özellikler

## Öne çıkanlar

<Columns>
  <Card title="Kanallar" icon="message-square" href="/tr/channels">
    Tek bir Gateway ile Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat ve daha fazlası.
  </Card>
  <Card title="Plugins" icon="plug" href="/tr/tools/plugin">
    Paketlenmiş plugin’ler, normal güncel sürümlerde ayrı kurulum gerektirmeden Matrix, Nextcloud Talk, Nostr, Twitch, Zalo ve daha fazlasını ekler.
  </Card>
  <Card title="Yönlendirme" icon="route" href="/tr/concepts/multi-agent">
    Yalıtılmış oturumlarla çoklu aracı yönlendirmesi.
  </Card>
  <Card title="Medya" icon="image" href="/tr/nodes/images">
    Görseller, ses, video, belgeler ve görsel/video üretimi.
  </Card>
  <Card title="Uygulamalar ve UI" icon="monitor" href="/web/control-ui">
    Web Control UI ve macOS yardımcı uygulaması.
  </Card>
  <Card title="Mobil düğümler" icon="smartphone" href="/tr/nodes">
    Eşleştirme, sesli/sohbet ve zengin cihaz komutlarıyla iOS ve Android düğümleri.
  </Card>
</Columns>

## Tam liste

**Kanallar:**

- Yerleşik kanallar arasında Discord, Google Chat, iMessage (eski), IRC, Signal, Slack, Telegram, WebChat ve WhatsApp bulunur
- Paketlenmiş plugin kanal türleri arasında iMessage için BlueBubbles, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal bulunur
- İsteğe bağlı ayrı kurulan kanal plugin’leri arasında Voice Call ve WeChat gibi üçüncü taraf paketler bulunur
- WeChat gibi üçüncü taraf kanal plugin’leri Gateway’i daha da genişletebilir
- Bahsetme tabanlı etkinleştirmeyle grup sohbeti desteği
- İzin listeleri ve eşleştirme ile DM güvenliği

**Aracı:**

- Araç akışı desteğine sahip gömülü aracı çalışma zamanı
- Çalışma alanı veya gönderici başına yalıtılmış oturumlarla çoklu aracı yönlendirmesi
- Oturumlar: doğrudan sohbetler paylaşılan `main` içinde birleştirilir; gruplar yalıtılır
- Uzun yanıtlar için akış ve parçalara bölme

**Kimlik doğrulama ve sağlayıcılar:**

- 35’ten fazla model sağlayıcısı (Anthropic, OpenAI, Google ve daha fazlası)
- OAuth üzerinden abonelik kimlik doğrulaması (ör. OpenAI Codex)
- Özel ve self-hosted sağlayıcı desteği (vLLM, SGLang, Ollama ve OpenAI uyumlu veya Anthropic uyumlu tüm uç noktalar)

**Medya:**

- İçeri ve dışarı görseller, ses, video ve belgeler
- Paylaşılan görsel üretimi ve video üretimi yetenek yüzeyleri
- Sesli not transkripsiyonu
- Birden çok sağlayıcıyla metinden sese

**Uygulamalar ve arayüzler:**

- WebChat ve tarayıcı Control UI
- macOS menü çubuğu yardımcı uygulaması
- Eşleştirme, Canvas, kamera, ekran kaydı, konum ve ses ile iOS düğümü
- Eşleştirme, sohbet, ses, Canvas, kamera ve cihaz komutları ile Android düğümü

**Araçlar ve otomasyon:**

- Tarayıcı otomasyonu, exec, sandboxing
- Web araması (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron işleri ve Heartbeat zamanlaması
- Skills, plugin’ler ve iş akışı işlem hatları (Lobster)

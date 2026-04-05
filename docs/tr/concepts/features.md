---
read_when:
    - OpenClaw'ın neleri desteklediğinin tam listesini istiyorsunuz
summary: 'OpenClaw yetenekleri: kanallar, yönlendirme, medya ve UX genelinde.'
title: Özellikler
x-i18n:
    generated_at: "2026-04-05T13:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43eae89d9af44ea786dd0221d8d602ebcea15da9d5064396ac9920c0345e2ad3
    source_path: concepts/features.md
    workflow: 15
---

# Özellikler

## Öne çıkanlar

<Columns>
  <Card title="Kanallar" icon="message-square">
    Tek bir Gateway ile Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat ve daha fazlası.
  </Card>
  <Card title="Eklentiler" icon="plug">
    Paketlenmiş eklentiler, normal güncel sürümlerde ayrı kurulum gerektirmeden Matrix, Nextcloud Talk, Nostr, Twitch, Zalo ve daha fazlasını ekler.
  </Card>
  <Card title="Yönlendirme" icon="route">
    Yalıtılmış oturumlarla çok agent'lı yönlendirme.
  </Card>
  <Card title="Medya" icon="image">
    Görseller, ses, video, belgeler ve görsel/video üretimi.
  </Card>
  <Card title="Uygulamalar ve UI" icon="monitor">
    Web Control UI ve macOS yardımcı uygulaması.
  </Card>
  <Card title="Mobil düğümler" icon="smartphone">
    Eşleştirme, ses/sohbet ve zengin cihaz komutlarıyla iOS ve Android düğümleri.
  </Card>
</Columns>

## Tam liste

**Kanallar:**

- Yerleşik kanallar arasında Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat ve WhatsApp bulunur
- Paketlenmiş eklenti kanalları arasında iMessage için BlueBubbles, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal bulunur
- İsteğe bağlı ayrı kurulan kanal eklentileri arasında Voice Call ve WeChat gibi üçüncü taraf paketler bulunur
- WeChat gibi üçüncü taraf kanal eklentileri Gateway'i daha da genişletebilir
- Etiketleme temelli etkinleştirme ile grup sohbeti desteği
- İzin listeleri ve eşleştirme ile DM güvenliği

**Agent:**

- Araç akışı ile gömülü agent çalışma zamanı
- Çalışma alanı veya gönderici başına yalıtılmış oturumlarla çok agent'lı yönlendirme
- Oturumlar: doğrudan sohbetler paylaşılan `main` içinde toplanır; gruplar yalıtılır
- Uzun yanıtlar için akış ve parçalama

**Kimlik doğrulama ve sağlayıcılar:**

- 35+'ten fazla model sağlayıcısı (Anthropic, OpenAI, Google ve daha fazlası)
- OAuth üzerinden abonelik kimlik doğrulaması (örn. OpenAI Codex)
- Özel ve self-hosted sağlayıcı desteği (vLLM, SGLang, Ollama ve herhangi bir OpenAI uyumlu veya Anthropic uyumlu uç nokta)

**Medya:**

- Girdi ve çıktı olarak görseller, ses, video ve belgeler
- Paylaşılan görsel üretimi ve video üretimi yetenek yüzeyleri
- Sesli not transkripsiyonu
- Birden çok sağlayıcıyla metinden sese dönüştürme

**Uygulamalar ve arayüzler:**

- WebChat ve tarayıcı Control UI
- macOS menü çubuğu yardımcı uygulaması
- Eşleştirme, Canvas, kamera, ekran kaydı, konum ve ses ile iOS düğümü
- Eşleştirme, sohbet, ses, Canvas, kamera ve cihaz komutları ile Android düğümü

**Araçlar ve otomasyon:**

- Tarayıcı otomasyonu, exec, sandboxing
- Web araması (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron işleri ve heartbeat zamanlaması
- Skills, eklentiler ve iş akışı hatları (Lobster)

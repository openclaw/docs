---
read_when:
    - OpenClaw'ın neleri desteklediğinin tam listesini istiyorsunuz
summary: Kanallar, yönlendirme, medya ve kullanıcı deneyimi genelindeki OpenClaw yetenekleri.
title: Özellikler
x-i18n:
    generated_at: "2026-05-10T19:31:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## Öne Çıkanlar

<Columns>
  <Card title="Kanallar" icon="message-square" href="/tr/channels">
    Tek bir Gateway ile Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat ve daha fazlası.
  </Card>
  <Card title="Plugin'ler" icon="plug" href="/tr/tools/plugin">
    Paketlenmiş plugin'ler, normal güncel sürümlerde ayrı kurulum gerektirmeden Matrix, Nextcloud Talk, Nostr, Twitch, Zalo ve daha fazlasını ekler.
  </Card>
  <Card title="Yönlendirme" icon="route" href="/tr/concepts/multi-agent">
    İzole oturumlarla çok ajanlı yönlendirme.
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
- Paketlenmiş plugin kanalları arasında Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal bulunur
- İsteğe bağlı olarak ayrı kurulan kanal plugin'leri arasında Voice Call ve WeChat gibi üçüncü taraf paketler bulunur
- Üçüncü taraf kanal plugin'leri, WeChat gibi örneklerle Gateway'i daha da genişletebilir
- Bahsetmeye dayalı etkinleştirmeyle grup sohbeti desteği
- İzin listeleri ve eşleştirmeyle DM güvenliği

**Ajan:**

- Araç akışıyla gömülü ajan çalışma zamanı
- Çalışma alanı veya gönderici başına izole oturumlarla çok ajanlı yönlendirme
- Oturumlar: doğrudan sohbetler paylaşılan `main` altında birleşir; gruplar izoledir
- Uzun yanıtlar için akış ve parçalara ayırma

**Kimlik doğrulama ve sağlayıcılar:**

- 35+ model sağlayıcısı (Anthropic, OpenAI, Google ve daha fazlası)
- OAuth üzerinden abonelik kimlik doğrulaması (örn. OpenAI Codex)
- Özel ve kendi barındırdığınız sağlayıcı desteği (vLLM, SGLang, Ollama ve OpenAI uyumlu veya Anthropic uyumlu herhangi bir uç nokta)

**Medya:**

- Gelen ve giden görseller, ses, video ve belgeler
- Paylaşılan görsel üretimi ve video üretimi yetenek yüzeyleri
- Sesli not transkripsiyonu
- Birden çok sağlayıcıyla metinden sese dönüştürme

**Uygulamalar ve arayüzler:**

- WebChat ve tarayıcı Control UI
- macOS menü çubuğu yardımcı uygulaması
- Eşleştirme, Canvas, kamera, ekran kaydı, konum ve ses özellikli iOS düğümü
- Eşleştirme, sohbet, ses, Canvas, kamera ve cihaz komutları özellikli Android düğümü

**Araçlar ve otomasyon:**

- Tarayıcı otomasyonu, exec, sandboxing
- Web araması (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron işleri ve Heartbeat zamanlaması
- Skills, plugin'ler ve iş akışı işlem hatları (Lobster)

## İlgili

<CardGroup cols={2}>
  <Card title="Deneysel özellikler" href="/tr/concepts/experimental-features" icon="flask">
    Varsayılan yüzeye henüz sunulmamış, isteğe bağlı özellikler.
  </Card>
  <Card title="Ajan çalışma zamanı" href="/tr/concepts/agent" icon="robot">
    Ajan çalışma zamanı modeli ve çalışmaların nasıl dağıtıldığı.
  </Card>
  <Card title="Kanallar" href="/tr/channels" icon="message-square">
    Telegram, WhatsApp, Discord, Slack ve daha fazlasını tek bir Gateway'den bağlayın.
  </Card>
  <Card title="Plugin'ler" href="/tr/tools/plugin" icon="plug">
    OpenClaw'u genişleten paketlenmiş ve üçüncü taraf plugin'ler.
  </Card>
</CardGroup>

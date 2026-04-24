---
read_when:
    - OpenClaw'ın neleri desteklediğinin tam bir listesini istiyorsunuz
summary: Kanallar, yönlendirme, medya ve UX genelinde OpenClaw yetenekleri.
title: Özellikler
x-i18n:
    generated_at: "2026-04-24T09:05:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## Öne Çıkanlar

<Columns>
  <Card title="Kanallar" icon="message-square" href="/tr/channels">
    Tek bir Gateway ile Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat ve daha fazlası.
  </Card>
  <Card title="Plugins" icon="plug" href="/tr/tools/plugin">
    Paketlenmiş Plugins, normal güncel sürümlerde ayrı kurulum gerektirmeden Matrix, Nextcloud Talk, Nostr, Twitch, Zalo ve daha fazlasını ekler.
  </Card>
  <Card title="Yönlendirme" icon="route" href="/tr/concepts/multi-agent">
    Yalıtılmış oturumlarla çoklu ajan yönlendirmesi.
  </Card>
  <Card title="Medya" icon="image" href="/tr/nodes/images">
    Görseller, ses, video, belgeler ve görsel/video üretimi.
  </Card>
  <Card title="Uygulamalar ve UI" icon="monitor" href="/tr/web/control-ui">
    Web Control UI ve macOS yardımcı uygulaması.
  </Card>
  <Card title="Mobil Node'lar" icon="smartphone" href="/tr/nodes">
    Eşleştirme, sesli/sohbet ve zengin cihaz komutları ile iOS ve Android Node'ları.
  </Card>
</Columns>

## Tam liste

**Kanallar:**

- Yerleşik kanallar arasında Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat ve WhatsApp bulunur
- Paketlenmiş Plugin kanalları arasında iMessage için BlueBubbles, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal bulunur
- İsteğe bağlı ayrı kurulan kanal Plugins arasında Voice Call ve WeChat gibi üçüncü taraf paketler bulunur
- WeChat gibi üçüncü taraf kanal Plugins, Gateway'i daha da genişletebilir
- Mention tabanlı etkinleştirme ile grup sohbeti desteği
- İzin listeleri ve eşleştirme ile DM güvenliği

**Ajan:**

- Araç akışı ile gömülü ajan çalışma zamanı
- Çalışma alanı veya gönderen başına yalıtılmış oturumlarla çoklu ajan yönlendirmesi
- Oturumlar: doğrudan sohbetler paylaşılan `main` içine çöker; gruplar yalıtılır
- Uzun yanıtlar için akış ve parçalama

**Kimlik doğrulama ve sağlayıcılar:**

- 35'ten fazla model sağlayıcısı (Anthropic, OpenAI, Google ve daha fazlası)
- OAuth üzerinden abonelik kimlik doğrulaması (ör. OpenAI Codex)
- Özel ve self-hosted sağlayıcı desteği (vLLM, SGLang, Ollama ve OpenAI uyumlu veya Anthropic uyumlu herhangi bir uç nokta)

**Medya:**

- Görseller, ses, video ve belgeler girişte ve çıkışta
- Paylaşılan görsel üretimi ve video üretimi yetenek yüzeyleri
- Sesli not transkripsiyonu
- Birden çok sağlayıcıyla metinden sese

**Uygulamalar ve arayüzler:**

- WebChat ve tarayıcı Control UI
- macOS menü çubuğu yardımcı uygulaması
- Eşleştirme, Canvas, kamera, ekran kaydı, konum ve ses ile iOS Node'u
- Eşleştirme, sohbet, ses, Canvas, kamera ve cihaz komutları ile Android Node'u

**Araçlar ve otomasyon:**

- Tarayıcı otomasyonu, exec, sandboxing
- Web araması (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron işleri ve Heartbeat zamanlaması
- Skills, Plugins ve iş akışı işlem hatları (Lobster)

## İlgili

- [Deneysel özellikler](/tr/concepts/experimental-features)
- [Ajan çalışma zamanı](/tr/concepts/agent)

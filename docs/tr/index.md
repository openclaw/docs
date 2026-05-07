---
read_when:
    - Yeni başlayanlara OpenClaw tanıtımı
summary: OpenClaw, yapay zeka ajanları için herhangi bir işletim sisteminde çalışan çok kanallı bir Gateway'dir.
title: OpenClaw
x-i18n:
    generated_at: "2026-05-07T13:20:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bf82c8551703257e55289d2b82f6436c9900a8afae7ab9b6a655332716ff37b
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"EXFOLIATE! EXFOLIATE!"_ — Bir uzay ıstakozu, muhtemelen

<p align="center">
  <strong>Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo ve daha fazlasında yapay zeka aracıları için her işletim sisteminde çalışan Gateway.</strong><br />
  Bir mesaj gönderin, cebinizden bir aracı yanıtı alın. Yerleşik kanallar, paketli kanal Plugin'leri, WebChat ve mobil düğümler genelinde tek bir Gateway çalıştırın.
</p>

<Columns>
  <Card title="Başlayın" href="/tr/start/getting-started" icon="rocket">
    OpenClaw'ı kurun ve Gateway'i dakikalar içinde çalıştırın.
  </Card>
  <Card title="İlk Kurulumu Çalıştırın" href="/tr/start/wizard" icon="sparkles">
    `openclaw onboard` ve eşleştirme akışlarıyla rehberli kurulum.
  </Card>
  <Card title="Control UI'ı Açın" href="/tr/web/control-ui" icon="layout-dashboard">
    Sohbet, yapılandırma ve oturumlar için tarayıcı panosunu başlatın.
  </Card>
</Columns>

## OpenClaw nedir?

OpenClaw, favori sohbet uygulamalarınızı ve kanal yüzeylerinizi — Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo ve daha fazlası gibi yerleşik kanallar ile paketli veya harici kanal Plugin'leri — Pi gibi yapay zeka kodlama aracılarına bağlayan **kendi barındırdığınız bir Gateway**'dir. Kendi makinenizde (veya bir sunucuda) tek bir Gateway süreci çalıştırırsınız ve bu süreç mesajlaşma uygulamalarınız ile her zaman erişilebilir bir yapay zeka asistanı arasında köprü olur.

**Kimler için?** Verilerinin kontrolünden vazgeçmeden veya barındırılan bir hizmete bağlı kalmadan, her yerden mesaj gönderebilecekleri kişisel bir yapay zeka asistanı isteyen geliştiriciler ve ileri düzey kullanıcılar için.

**Onu farklı kılan nedir?**

- **Kendi barındırdığınız**: donanımınızda, sizin kurallarınızla çalışır
- **Çok kanallı**: tek bir Gateway, yerleşik kanalları ve paketli ya da harici kanal Plugin'lerini aynı anda sunar
- **Aracı odaklı**: araç kullanımı, oturumlar, bellek ve çok aracılı yönlendirme özellikleriyle kodlama aracıları için geliştirilmiştir
- **Açık kaynak**: MIT lisanslı, topluluk odaklı

**Neye ihtiyacınız var?** Node 24 (önerilir) veya uyumluluk için Node 22 LTS (`22.16+`), seçtiğiniz sağlayıcıdan bir API anahtarı ve 5 dakika. En iyi kalite ve güvenlik için mevcut en güçlü son nesil modeli kullanın.

## Nasıl çalışır?

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["Pi agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

Gateway; oturumlar, yönlendirme ve kanal bağlantıları için tek doğruluk kaynağıdır.

## Temel yetenekler

<Columns>
  <Card title="Çok kanallı Gateway" icon="network" href="/tr/channels">
    Tek bir Gateway süreciyle Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat ve daha fazlası.
  </Card>
  <Card title="Plugin kanalları" icon="plug" href="/tr/tools/plugin">
    Paketli Plugin'ler, normal güncel sürümlerde Matrix, Nostr, Twitch, Zalo ve daha fazlasını ekler.
  </Card>
  <Card title="Çok aracılı yönlendirme" icon="route" href="/tr/concepts/multi-agent">
    Aracı, çalışma alanı veya gönderici başına yalıtılmış oturumlar.
  </Card>
  <Card title="Medya desteği" icon="image" href="/tr/nodes/images">
    Görsel, ses ve belge gönderip alın.
  </Card>
  <Card title="Web Control UI" icon="monitor" href="/tr/web/control-ui">
    Sohbet, yapılandırma, oturumlar ve düğümler için tarayıcı panosu.
  </Card>
  <Card title="Mobil düğümler" icon="smartphone" href="/tr/nodes">
    Canvas, kamera ve ses özellikli iş akışları için iOS ve Android düğümlerini eşleştirin.
  </Card>
</Columns>

## Hızlı başlangıç

<Steps>
  <Step title="OpenClaw'ı kurun">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="İlk kurulumu yapın ve hizmeti kurun">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Sohbet edin">
    Tarayıcınızda Control UI'ı açın ve bir mesaj gönderin:

    ```bash
    openclaw dashboard
    ```

    Ya da bir kanal bağlayın ([Telegram](/tr/channels/telegram) en hızlısıdır) ve telefonunuzdan sohbet edin.

  </Step>
</Steps>

Tam kurulum ve geliştirme ortamı kurulumu mu gerekiyor? [Başlangıç](/tr/start/getting-started) bölümüne bakın.

## Pano

Gateway başladıktan sonra tarayıcı Control UI'ını açın.

- Yerel varsayılan: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Uzaktan erişim: [Web yüzeyleri](/tr/web) ve [Tailscale](/tr/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Yapılandırma (isteğe bağlı)

Yapılandırma `~/.openclaw/openclaw.json` konumunda bulunur.

- **Hiçbir şey yapmazsanız**, OpenClaw paketli Pi ikilisini gönderici başına oturumlarla RPC modunda kullanır.
- Bunu daha sıkı sınırlamak istiyorsanız, `channels.whatsapp.allowFrom` ve (gruplar için) bahsetme kurallarıyla başlayın.

Örnek:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## Buradan başlayın

<Columns>
  <Card title="Dokümantasyon merkezleri" href="/tr/start/hubs" icon="book-open">
    Kullanım durumuna göre düzenlenmiş tüm dokümanlar ve kılavuzlar.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="settings">
    Temel Gateway ayarları, belirteçler ve sağlayıcı yapılandırması.
  </Card>
  <Card title="Uzaktan erişim" href="/tr/gateway/remote" icon="globe">
    SSH ve tailnet erişim desenleri.
  </Card>
  <Card title="Kanallar" href="/tr/channels/telegram" icon="message-square">
    Feishu, Microsoft Teams, WhatsApp, Telegram, Discord ve daha fazlası için kanala özel kurulum.
  </Card>
  <Card title="Düğümler" href="/tr/nodes" icon="smartphone">
    Eşleştirme, Canvas, kamera ve cihaz eylemleriyle iOS ve Android düğümleri.
  </Card>
  <Card title="Yardım" href="/tr/help" icon="life-buoy">
    Yaygın düzeltmeler ve sorun giderme başlangıç noktası.
  </Card>
</Columns>

## Daha fazla bilgi edinin

<Columns>
  <Card title="Tam özellik listesi" href="/tr/concepts/features" icon="list">
    Eksiksiz kanal, yönlendirme ve medya yetenekleri.
  </Card>
  <Card title="Çok aracılı yönlendirme" href="/tr/concepts/multi-agent" icon="route">
    Çalışma alanı yalıtımı ve aracı başına oturumlar.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security" icon="shield">
    Belirteçler, izin listeleri ve güvenlik denetimleri.
  </Card>
  <Card title="Sorun giderme" href="/tr/gateway/troubleshooting" icon="wrench">
    Gateway tanılama ve yaygın hatalar.
  </Card>
  <Card title="Hakkında ve katkılar" href="/tr/reference/credits" icon="info">
    Projenin kökenleri, katkıda bulunanlar ve lisans.
  </Card>
</Columns>

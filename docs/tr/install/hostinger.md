---
read_when:
    - Hostinger'da OpenClaw Kurulumu
    - OpenClaw için yönetilen bir VPS arıyorsunuz
    - Hostinger 1-Tık OpenClaw'ı Kullanma
summary: OpenClaw'ı Hostinger'da barındırın
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T12:22:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Kalıcı bir OpenClaw Gateway'i [Hostinger](https://www.hostinger.com/openclaw) üzerinde, **1-Click** yönetilen dağıtım olarak veya kendiniz yöneteceğiniz bir **VPS** kurulumu olarak çalıştırın.

## Ön koşullar

- Hostinger hesabı ([kaydolun](https://www.hostinger.com/openclaw))
- Yaklaşık 5-10 dakika

## Seçenek A: 1-Click OpenClaw

Hostinger altyapıyı, Docker'ı ve otomatik güncellemeleri yönetir. Çalışan bir örneğe ulaşmanın en hızlı yoludur.

<Steps>
  <Step title="Satın alın ve başlatın">
    1. [Hostinger OpenClaw sayfasından](https://www.hostinger.com/openclaw) bir Yönetilen OpenClaw planı seçin ve satın alma işlemini tamamlayın.

    <Note>
    Satın alma sırasında, önceden satın alınmış ve OpenClaw'a anında entegre edilen **Ready-to-Use AI** kredilerini seçebilirsiniz; başka sağlayıcılarda harici hesaplara veya API anahtarlarına gerek yoktur. Hemen sohbet etmeye başlayabilirsiniz. Alternatif olarak kurulum sırasında Anthropic, OpenAI, Google Gemini veya xAI anahtarınızı sağlayabilirsiniz.
    </Note>

  </Step>

  <Step title="Bir mesajlaşma kanalı seçin">
    Bağlanmak için bir veya daha fazla kanal seçin:

    - **WhatsApp** -- kurulum sihirbazında gösterilen QR kodunu tarayın.
    - **Telegram** -- [BotFather](https://t.me/BotFather) tarafından verilen bot belirtecini yapıştırın.

  </Step>

  <Step title="Kurulumu tamamlayın">
    Örneği dağıtmak için **Finish** düğmesine tıklayın. Hazır olduğunda OpenClaw panosuna hPanel'deki **OpenClaw Overview** bölümünden erişin.
  </Step>

</Steps>

## Seçenek B: VPS üzerinde OpenClaw

Sunucu üzerinde daha fazla denetim sağlar. Hostinger, OpenClaw'ı VPS'nizde Docker aracılığıyla dağıtır; hPanel'deki **Docker Manager** üzerinden yönetirsiniz.

<Steps>
  <Step title="Bir VPS satın alın">
    1. [Hostinger OpenClaw sayfasından](https://www.hostinger.com/openclaw) bir VPS üzerinde OpenClaw planı seçin ve satın alma işlemini tamamlayın.

    <Note>
    Satın alma sırasında **Ready-to-Use AI** kredilerini seçebilirsiniz; bunlar önceden satın alınmış ve OpenClaw'a anında entegre edilmiştir. Böylece başka sağlayıcılarda harici hesaplara veya API anahtarlarına gerek kalmadan sohbet etmeye başlayabilirsiniz.
    </Note>

  </Step>

  <Step title="OpenClaw'ı yapılandırın">
    VPS hazırlandıktan sonra yapılandırma alanlarını doldurun:

    - **Gateway belirteci** -- otomatik olarak oluşturulur; daha sonra kullanmak üzere kaydedin.
    - **WhatsApp numarası** -- ülke koduyla birlikte numaranız (isteğe bağlı).
    - **Telegram bot belirteci** -- [BotFather](https://t.me/BotFather) tarafından sağlanır (isteğe bağlı).
    - **API anahtarları** -- yalnızca satın alma sırasında Ready-to-Use AI kredilerini seçmediyseniz gereklidir.

  </Step>

  <Step title="OpenClaw'ı başlatın">
    **Deploy** düğmesine tıklayın. Çalışmaya başladığında **Open** seçeneğine tıklayarak hPanel üzerinden OpenClaw panosunu açın.
  </Step>

</Steps>

Günlükler, yeniden başlatmalar ve güncellemeler hPanel'deki Docker Manager arayüzünden yürütülür. Güncellemek ve en son imajı çekmek için Docker Manager'da **Update** düğmesine basın.

## Kurulumunuzu doğrulayın

Bağladığınız kanaldan asistanınıza "Merhaba" gönderin. OpenClaw yanıt verir ve ilk tercihlerinizi ayarlama sürecinde size rehberlik eder.

## Sorun giderme

**Pano yüklenmiyor** -- Kapsayıcının hazırlanmasını tamamlaması için birkaç dakika bekleyin, ardından hPanel'deki Docker Manager günlüklerini kontrol edin.

**Docker kapsayıcısı sürekli yeniden başlatılıyor** -- Docker Manager günlüklerini açın ve yapılandırma hatalarını (eksik belirteçler, geçersiz API anahtarları) kontrol edin.

**Telegram botu yanıt vermiyor** -- DM eşleştirmesi gerekiyorsa bilinmeyen bir göndericiye yanıt yerine kısa bir eşleştirme kodu gönderilir. Bunu OpenClaw panosundaki sohbetten veya kapsayıcıya kabuk erişiminiz varsa `openclaw pairing approve telegram <CODE>` komutuyla onaylayın. Bkz. [Eşleştirme](/tr/channels/pairing).

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri

## İlgili içerikler

- [Kuruluma genel bakış](/tr/install)
- [VPS barındırma](/tr/vps)
- [DigitalOcean](/tr/install/digitalocean)

---
read_when:
    - OpenClaw'ı Hostinger üzerinde kurma
    - OpenClaw için yönetilen bir VPS arıyorsunuz
    - Hostinger 1-Click OpenClaw kullanma
summary: OpenClaw'ı Hostinger üzerinde barındırma
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T09:16:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
---

[Hostinger](https://www.hostinger.com/openclaw) üzerinde **1-Click** yönetilen dağıtım veya **VPS** kurulumu ile kalıcı bir OpenClaw Gateway çalıştırın.

## Önkoşullar

- Hostinger hesabı ([kayıt ol](https://www.hostinger.com/openclaw))
- Yaklaşık 5-10 dakika

## Seçenek A: 1-Click OpenClaw

Başlamanın en hızlı yolu. Hostinger altyapıyı, Docker'ı ve otomatik güncellemeleri yönetir.

<Steps>
  <Step title="Satın alın ve başlatın">
    1. [Hostinger OpenClaw sayfasından](https://www.hostinger.com/openclaw) bir Managed OpenClaw planı seçin ve satın alma işlemini tamamlayın.

    <Note>
    Satın alma sırasında önceden satın alınmış ve OpenClaw içinde anında entegre edilmiş **Ready-to-Use AI** kredilerini seçebilirsiniz -- başka sağlayıcılardan harici hesaplara veya API anahtarlarına gerek yoktur. Hemen sohbet etmeye başlayabilirsiniz. Alternatif olarak kurulum sırasında Anthropic, OpenAI, Google Gemini veya xAI'den kendi anahtarınızı sağlayabilirsiniz.
    </Note>

  </Step>

  <Step title="Bir mesajlaşma kanalı seçin">
    Bağlamak için bir veya daha fazla kanal seçin:

    - **WhatsApp** -- kurulum sihirbazında gösterilen QR kodunu tarayın.
    - **Telegram** -- [BotFather](https://t.me/BotFather) üzerinden aldığınız bot belirtecini yapıştırın.

  </Step>

  <Step title="Kurulumu tamamlayın">
    Örneği dağıtmak için **Finish** düğmesine tıklayın. Hazır olduğunda hPanel içindeki **OpenClaw Overview** üzerinden OpenClaw panosuna erişin.
  </Step>

</Steps>

## Seçenek B: VPS üzerinde OpenClaw

Sunucunuz üzerinde daha fazla denetim sağlar. Hostinger, VPS'inize Docker üzerinden OpenClaw dağıtır ve siz bunu hPanel içindeki **Docker Manager** üzerinden yönetirsiniz.

<Steps>
  <Step title="Bir VPS satın alın">
    1. [Hostinger OpenClaw sayfasından](https://www.hostinger.com/openclaw) bir OpenClaw on VPS planı seçin ve satın alma işlemini tamamlayın.

    <Note>
    Satın alma sırasında **Ready-to-Use AI** kredilerini seçebilirsiniz -- bunlar önceden satın alınır ve OpenClaw içine anında entegre edilir, böylece başka sağlayıcılardan harici hesaplar veya API anahtarları olmadan sohbet etmeye başlayabilirsiniz.
    </Note>

  </Step>

  <Step title="OpenClaw'ı yapılandırın">
    VPS hazırlandığında yapılandırma alanlarını doldurun:

    - **Gateway token** -- otomatik oluşturulur; daha sonra kullanmak için kaydedin.
    - **WhatsApp number** -- ülke koduyla birlikte numaranız (isteğe bağlı).
    - **Telegram bot token** -- [BotFather](https://t.me/BotFather) üzerinden (isteğe bağlı).
    - **API keys** -- yalnızca satın alma sırasında Ready-to-Use AI kredilerini seçmediyseniz gerekir.

  </Step>

  <Step title="OpenClaw'ı başlatın">
    **Deploy** düğmesine tıklayın. Çalışmaya başladıktan sonra hPanel içinden **Open** düğmesine tıklayarak OpenClaw panosunu açın.
  </Step>

</Steps>

Günlükler, yeniden başlatmalar ve güncellemeler doğrudan hPanel içindeki Docker Manager arayüzünden yönetilir. Güncellemek için Docker Manager içindeki **Update** düğmesine basın; bu en son imajı çekecektir.

## Kurulumunuzu doğrulayın

Bağladığınız kanalda asistanınıza "Hi" gönderin. OpenClaw yanıt verir ve sizi ilk tercihlerin ayarlanması konusunda yönlendirir.

## Sorun giderme

**Pano yüklenmiyor** -- Kapsayıcının hazırlanmasını tamamlaması için birkaç dakika bekleyin. hPanel içindeki Docker Manager günlüklerini kontrol edin.

**Docker kapsayıcısı sürekli yeniden başlıyor** -- Docker Manager günlüklerini açın ve yapılandırma hatalarını arayın (eksik belirteçler, geçersiz API anahtarları).

**Telegram botu yanıt vermiyor** -- Bağlantıyı tamamlamak için eşleştirme kodu mesajınızı Telegram'dan doğrudan OpenClaw sohbetinizin içine mesaj olarak gönderin.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [VPS barındırma](/tr/vps)
- [DigitalOcean](/tr/install/digitalocean)

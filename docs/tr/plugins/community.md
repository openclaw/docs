---
read_when:
    - Üçüncü taraf OpenClaw Pluginlerini bulmak istiyorsunuz
    - Kendi Plugin'inizi yayımlamak veya listelemek istiyorsunuz
summary: 'Topluluk tarafından sürdürülen OpenClaw Plugin’leri: göz atın, yükleyin ve kendinizinkini gönderin'
title: Topluluk Plugin'leri
x-i18n:
    generated_at: "2026-04-30T09:34:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Topluluk Plugin'leri, OpenClaw'a yeni kanallar, araçlar, sağlayıcılar veya başka yetenekler ekleyen üçüncü taraf paketlerdir. Topluluk tarafından geliştirilip sürdürülürler, genellikle [ClawHub](/tr/tools/clawhub) üzerinde yayımlanırlar ve tek bir komutla kurulabilirler. Henüz ClawHub'a taşınmamış paketler için npm desteklenen bir yedek olarak kalır.

ClawHub, topluluk Plugin'leri için standart keşif yüzeyidir. Plugin'inizi keşfedilebilir kılmak amacıyla buraya eklemek için yalnızca dokümantasyon PR'ları açmayın; bunun yerine ClawHub'da yayımlayın.

```bash
openclaw plugins install <package-name>
```

OpenClaw önce ClawHub'ı kontrol eder ve otomatik olarak npm'e geri döner.

## Listelenen Plugin'ler

### Apify

20.000'den fazla hazır kazıyıcıyla herhangi bir web sitesinden veri kazıyın. Aracınızın Instagram, Facebook, TikTok, YouTube, Google Maps, Google Search, e-ticaret siteleri ve daha fazlasından veri çıkarmasını yalnızca sorarak sağlayın.

- **npm:** `@apify/apify-openclaw-plugin`
- **depo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server konuşmaları için bağımsız OpenClaw köprüsü. Bir sohbeti Codex iş parçacığına bağlayın, onunla düz metinle konuşun ve sürdürme, planlama, inceleme, model seçimi, Compaction ve daha fazlası için sohbete özgü komutlarla kontrol edin.

- **npm:** `openclaw-codex-app-server`
- **depo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream modunu kullanan kurumsal robot entegrasyonu. Herhangi bir DingTalk istemcisi üzerinden metin, görsel ve dosya mesajlarını destekler.

- **npm:** `@largezhou/ddingtalk`
- **depo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw için kayıpsız bağlam yönetimi Plugin'i. Artımlı Compaction ile DAG tabanlı konuşma özetleme; token kullanımını azaltırken tam bağlam doğruluğunu korur.

- **npm:** `@martian-engineering/lossless-claw`
- **depo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Aracı izlerini Opik'e aktaran resmi Plugin. Aracı davranışını, maliyeti, token'ları, hataları ve daha fazlasını izleyin.

- **npm:** `@opik/opik-openclaw`
- **depo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw aracınıza gerçek zamanlı dudak senkronizasyonu, duygu ifadeleri ve metinden sese özellikleriyle bir Live2D avatarı verin. Yapay zeka varlık üretimi ve Prometheus Marketplace'e tek tıkla dağıtım için oluşturucu araçları içerir. Şu anda alfa aşamasındadır.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **depo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

OpenClaw'ı QQ Bot API üzerinden QQ'ya bağlayın. Özel sohbetleri, grup bahsetmelerini, kanal mesajlarını ve ses, görsel, video ve dosyalar dahil zengin medyayı destekler.

Güncel OpenClaw sürümleri QQ Bot'u paket halinde sunar. Normal kurulumlar için [QQ Bot](/tr/channels/qqbot) içindeki paketli kurulumu kullanın; bu harici Plugin'i yalnızca Tencent tarafından sürdürülen bağımsız paketi özellikle istediğinizde kurun.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **depo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom ekibi tarafından OpenClaw için WeCom kanal Plugin'i. WeCom Bot WebSocket kalıcı bağlantılarıyla çalışır; doğrudan mesajları ve grup sohbetlerini, akış yanıtlarını, proaktif mesajlaşmayı, görsel/dosya işlemeyi, Markdown biçimlendirmesini, yerleşik erişim denetimini ve belge/toplantı/mesajlaşma Skills'lerini destekler.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **depo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Tencent Yuanbao ekibi tarafından OpenClaw için Yuanbao kanal Plugin'i. WebSocket kalıcı bağlantılarıyla çalışır; doğrudan mesajları ve grup sohbetlerini, akış yanıtlarını, proaktif mesajlaşmayı, görsel/dosya/ses/video işlemeyi, Markdown biçimlendirmesini, yerleşik erişim denetimini ve eğik çizgi komut menülerini destekler.

- **npm:** `openclaw-plugin-yuanbao`
- **depo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Plugin'inizi gönderin

Yararlı, belgelenmiş ve güvenli şekilde çalıştırılabilen topluluk Plugin'lerini memnuniyetle karşılarız.

<Steps>
  <Step title="ClawHub veya npm'de yayımlayın">
    Plugin'iniz `openclaw plugins install \<package-name\>` ile kurulabilir olmalıdır.
    Özellikle yalnızca npm dağıtımına ihtiyaç duymadığınız sürece [ClawHub](/tr/tools/clawhub) üzerinde yayımlayın.
    Tam kılavuz için [Plugin Oluşturma](/tr/plugins/building-plugins) bölümüne bakın.

  </Step>

  <Step title="GitHub'da barındırın">
    Kaynak kodu, kurulum dokümantasyonu ve sorun izleyicisi olan herkese açık bir depoda bulunmalıdır.

  </Step>

  <Step title="Dokümantasyon PR'larını yalnızca kaynak dokümantasyon değişiklikleri için kullanın">
    Plugin'inizi keşfedilebilir kılmak için bir dokümantasyon PR'ına ihtiyacınız yoktur. Bunun yerine ClawHub'da yayımlayın.

    Yalnızca OpenClaw'ın kaynak dokümantasyonunda kurulum yönergelerini düzeltmek veya ana dokümantasyon setine ait çapraz depo dokümantasyonu eklemek gibi gerçek bir içerik değişikliği gerektiğinde bir dokümantasyon PR'ı açın.

  </Step>
</Steps>

## Kalite çıtası

| Gereksinim                 | Neden                                           |
| --------------------------- | --------------------------------------------- |
| ClawHub veya npm'de yayımlanmış | Kullanıcıların `openclaw plugins install` komutunun çalışmasına ihtiyacı vardır |
| Herkese açık GitHub deposu          | Kaynak incelemesi, sorun takibi, şeffaflık   |
| Kurulum ve kullanım dokümantasyonu        | Kullanıcıların bunu nasıl yapılandıracağını bilmesi gerekir        |
| Aktif bakım          | Yakın tarihli güncellemeler veya duyarlı sorun yönetimi   |

Düşük emekli sarmalayıcılar, belirsiz sahiplik veya bakımı yapılmayan paketler reddedilebilir.

## İlgili

- [Plugin'leri Kurma ve Yapılandırma](/tr/tools/plugin) — herhangi bir Plugin'i nasıl kuracağınız
- [Plugin Oluşturma](/tr/plugins/building-plugins) — kendi Plugin'inizi oluşturun
- [Plugin Manifest](/tr/plugins/manifest) — manifest şeması

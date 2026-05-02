---
read_when:
    - Üçüncü taraf OpenClaw Plugin'lerini bulmak istiyorsunuz
    - Kendi Plugin'inizi yayımlamak veya listelemek istiyorsunuz
summary: 'Topluluk tarafından sürdürülen OpenClaw Plugin''leri: göz atın, yükleyin ve kendi Plugin''inizi gönderin'
title: Topluluk Plugin'leri
x-i18n:
    generated_at: "2026-05-02T20:47:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

Topluluk Pluginleri, OpenClaw’ı yeni kanallar, araçlar, sağlayıcılar veya başka yeteneklerle genişleten üçüncü taraf paketlerdir. Bunlar topluluk tarafından geliştirilir ve bakımı yapılır, genellikle [ClawHub](/tr/tools/clawhub) üzerinde yayımlanır ve tek komutla kurulabilir. ClawHub paket kurulumları kullanıma sunulurken, yalın paket belirtimleri için npm başlatma varsayılanı olmaya devam eder.

ClawHub, topluluk Pluginleri için standart keşif yüzeyidir. Plugin’inizi burada keşfedilebilir kılmak için yalnızca dokümantasyon PR’ları açmayın; bunun yerine ClawHub üzerinde yayımlayın.

```bash
openclaw plugins install clawhub:<package-name>
```

npm’de barındırılan paketler için `openclaw plugins install <package-name>` kullanın.

## Listelenen Pluginler

### Apify

20.000’den fazla hazır kazıyıcıyla herhangi bir web sitesinden veri kazıyın. Aracınızın Instagram, Facebook, TikTok, YouTube, Google Maps, Google Search, e-ticaret siteleri ve daha fazlasından yalnızca isteyerek veri çıkarmasını sağlayın.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server konuşmaları için bağımsız OpenClaw köprüsü. Bir sohbeti Codex iş parçacığına bağlayın, onunla düz metinle konuşun ve sürdürme, planlama, inceleme, model seçimi, Compaction ve daha fazlası için sohbet yerel komutlarıyla kontrol edin.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream modunu kullanan kurumsal robot entegrasyonu. Herhangi bir DingTalk istemcisi üzerinden metin, görüntü ve dosya iletilerini destekler.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw için kayıpsız bağlam yönetimi Plugini. Artımlı Compaction ile DAG tabanlı konuşma özetleme; belirteç kullanımını azaltırken tam bağlam doğruluğunu korur.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Aracı izlerini Opik’e dışa aktaran resmi Plugin. Aracı davranışını, maliyeti, belirteçleri, hataları ve daha fazlasını izleyin.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw aracınıza gerçek zamanlı dudak senkronizasyonu, duygu ifadeleri ve metinden sese özellikleriyle bir Live2D avatar verin. Yapay zeka varlık üretimi için oluşturucu araçları ve Prometheus Marketplace’e tek tıkla dağıtımı içerir. Şu anda alfa aşamasındadır.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API aracılığıyla OpenClaw’ı QQ’ya bağlayın. Özel sohbetleri, grup bahsetmelerini, kanal iletilerini ve ses, görüntü, video ve dosyalar dahil zengin medyayı destekler.

Geçerli OpenClaw sürümleri QQ Bot’u paket halinde içerir. Normal kurulumlar için [QQ Bot](/tr/channels/qqbot) içindeki paketli kurulumu kullanın; bu harici Plugini yalnızca Tencent tarafından sürdürülen bağımsız paketi özellikle istediğinizde kurun.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom ekibi tarafından OpenClaw için WeCom kanal Plugini. WeCom Bot WebSocket kalıcı bağlantılarıyla çalışır; doğrudan iletileri ve grup sohbetlerini, akış yanıtlarını, proaktif mesajlaşmayı, görüntü/dosya işlemeyi, Markdown biçimlendirmesini, yerleşik erişim denetimini ve belge/toplantı/mesajlaşma Skills’i destekler.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Tencent Yuanbao ekibi tarafından OpenClaw için Yuanbao kanal Plugini. WebSocket kalıcı bağlantılarıyla çalışır; doğrudan iletileri ve grup sohbetlerini, akış yanıtlarını, proaktif mesajlaşmayı, görüntü/dosya/ses/video işlemeyi, Markdown biçimlendirmesini, yerleşik erişim denetimini ve eğik çizgi komut menülerini destekler.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Plugininizi Gönderin

Kullanışlı, belgelenmiş ve işletmesi güvenli topluluk Pluginlerini memnuniyetle karşılarız.

<Steps>
  <Step title="ClawHub veya npm’de yayımlayın">
    Plugininiz `openclaw plugins install \<package-name\>` ile kurulabilir olmalıdır.
    Özellikle yalnızca npm dağıtımına ihtiyacınız yoksa [ClawHub](/tr/tools/clawhub) üzerinde yayımlayın.
    Tam kılavuz için [Pluginler Geliştirme](/tr/plugins/building-plugins) bölümüne bakın.

  </Step>

  <Step title="GitHub’da barındırın">
    Kaynak kodu, kurulum dokümanları ve sorun izleyicisi bulunan herkese açık bir depoda olmalıdır.

  </Step>

  <Step title="Dokümantasyon PR’larını yalnızca kaynak doküman değişiklikleri için kullanın">
    Plugininizi keşfedilebilir kılmak için dokümantasyon PR’ına ihtiyacınız yoktur. Bunun yerine ClawHub üzerinde yayımlayın.

    Yalnızca OpenClaw’ın kaynak dokümanlarında, kurulum rehberliğini düzeltmek veya ana dokümantasyon kümesine ait depolar arası dokümantasyon eklemek gibi gerçek bir içerik değişikliği gerektiğinde dokümantasyon PR’ı açın.

  </Step>
</Steps>

## Kalite çıtası

| Gereksinim                 | Neden                                           |
| --------------------------- | --------------------------------------------- |
| ClawHub veya npm’de yayımlanmış | Kullanıcıların `openclaw plugins install` komutunun çalışmasına ihtiyacı var |
| Herkese açık GitHub deposu          | Kaynak incelemesi, sorun takibi, şeffaflık   |
| Kurulum ve kullanım dokümanları        | Kullanıcıların nasıl yapılandırılacağını bilmesi gerekir        |
| Aktif bakım          | Yakın tarihli güncellemeler veya duyarlı sorun yönetimi   |

Düşük emekli sarmalayıcılar, belirsiz sahiplik veya bakımı yapılmayan paketler reddedilebilir.

## İlgili

- [Pluginleri Kurma ve Yapılandırma](/tr/tools/plugin) — herhangi bir Plugini nasıl kurarsınız
- [Pluginler Geliştirme](/tr/plugins/building-plugins) — kendi Plugininizi oluşturun
- [Plugin Manifest](/tr/plugins/manifest) — manifest şeması

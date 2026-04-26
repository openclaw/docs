---
read_when:
    - Üçüncü taraf OpenClaw Plugin'lerini bulmak istiyorsunuz
    - Kendi Plugin'inizi yayımlamak veya listelemek istiyorsunuz
summary: 'Topluluk tarafından sürdürülen OpenClaw Plugin''leri: göz atın, kurun ve kendinizinkini gönderin'
title: Topluluk Plugin'leri
x-i18n:
    generated_at: "2026-04-26T11:35:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

Topluluk Plugin'leri, OpenClaw'ı yeni kanallar, araçlar, sağlayıcılar veya diğer yeteneklerle genişleten üçüncü taraf paketlerdir. Topluluk tarafından geliştirilir ve sürdürülür, [ClawHub](/tr/tools/clawhub) veya npm üzerinde yayımlanır ve tek bir komutla kurulabilir.

ClawHub, topluluk Plugin'leri için kanonik keşif yüzeyidir. Görünürlük için Plugin'inizi buraya eklemek amacıyla yalnızca dokümantasyon PR'leri açmayın; bunun yerine ClawHub üzerinde yayımlayın.

```bash
openclaw plugins install <package-name>
```

OpenClaw önce ClawHub'ı kontrol eder ve ardından otomatik olarak npm'e geri döner.

## Listelenen Plugin'ler

### Apify

20.000'den fazla hazır scraper ile herhangi bir web sitesinden veri kazıyın. Ajanınızın Instagram, Facebook, TikTok, YouTube, Google Maps, Google Search, e-ticaret siteleri ve daha fazlasından yalnızca isteyerek veri çıkarmasını sağlayın.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server konuşmaları için bağımsız OpenClaw köprüsü. Bir sohbeti bir Codex dizisine bağlayın, düz metinle konuşun ve sürdürme, planlama, inceleme, model seçimi, Compaction ve daha fazlası için sohbete özgü komutlarla kontrol edin.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Akış modu kullanan kurumsal robot entegrasyonu. Herhangi bir DingTalk istemcisi üzerinden metin, görsel ve dosya mesajlarını destekler.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw için Lossless Context Management Plugin'i. Artımlı Compaction ile DAG tabanlı konuşma özetleme — token kullanımını azaltırken bağlamın tam doğruluğunu korur.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Ajan izlerini Opik'e aktaran resmi Plugin. Ajan davranışını, maliyeti, token'ları, hataları ve daha fazlasını izleyin.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw ajanınıza gerçek zamanlı dudak senkronizasyonu, duygu ifadeleri ve metinden konuşmaya dönüştürme ile bir Live2D avatar verin. AI varlık üretimi için oluşturucu araçları ve Prometheus Marketplace'e tek tıklamayla dağıtım içerir. Şu anda alpha aşamasındadır.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

OpenClaw'ı QQ Bot API aracılığıyla QQ'ya bağlayın. Özel sohbetleri, grup bahsetmelerini, kanal mesajlarını ve ses, görsel, video ve dosya dahil zengin medyayı destekler.

Geçerli OpenClaw sürümleri QQ Bot'u paket halinde içerir. Normal kurulumlar için [QQ Bot](/tr/channels/qqbot) içindeki paketlenmiş kurulumu kullanın; bu harici Plugin'i yalnızca Tencent tarafından sürdürülen bağımsız paketi özellikle istediğinizde kurun.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom ekibi tarafından geliştirilen OpenClaw için WeCom kanal Plugin'i. WeCom Bot WebSocket kalıcı bağlantılarıyla çalışır; doğrudan mesajları ve grup sohbetlerini, akış yanıtlarını, proaktif mesajlaşmayı, görsel/dosya işlemeyi, Markdown biçimlendirmeyi, yerleşik erişim denetimini ve belge/toplantı/mesajlaşma becerilerini destekler.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Plugin'inizi gönderin

Kullanışlı, belgelenmiş ve güvenli şekilde işletilebilen topluluk Plugin'lerini memnuniyetle karşılıyoruz.

<Steps>
  <Step title="ClawHub veya npm üzerinde yayımlayın">
    Plugin'iniz `openclaw plugins install \<package-name\>` ile kurulabilir olmalıdır.
    [ClawHub](/tr/tools/clawhub) üzerinde (tercih edilir) veya npm'de yayımlayın.
    Tam kılavuz için [Plugin Oluşturma](/tr/plugins/building-plugins) sayfasına bakın.

  </Step>

  <Step title="GitHub üzerinde barındırın">
    Kaynak kodu, kurulum belgeleri ve bir issue
    izleyicisi bulunan herkese açık bir depoda olmalıdır.

  </Step>

  <Step title="Dokümantasyon PR'lerini yalnızca kaynak dokümantasyon değişiklikleri için kullanın">
    Plugin'inizin bulunabilir olması için dokümantasyon PR'si açmanız gerekmez. Onu
    bunun yerine ClawHub üzerinde yayımlayın.

    Yalnızca OpenClaw'ın kaynak dokümantasyonunda gerçek bir içerik
    değişikliği gerektiğinde, örneğin kurulum yönergelerini düzeltmek veya ana dokümantasyon kümesine ait
    depolar arası belgeler eklemek gibi durumlarda bir dokümantasyon PR'si açın.

  </Step>
</Steps>

## Kalite çıtası

| Gereksinim                 | Neden                                         |
| -------------------------- | --------------------------------------------- |
| ClawHub veya npm'de yayımlanmış | Kullanıcıların `openclaw plugins install` komutunun çalışmasına ihtiyacı vardır |
| Herkese açık GitHub deposu | Kaynak incelemesi, issue takibi, şeffaflık    |
| Kurulum ve kullanım belgeleri | Kullanıcıların bunu nasıl yapılandıracağını bilmesi gerekir |
| Aktif bakım                | Yakın tarihli güncellemeler veya duyarlı issue yönetimi |

Düşük çabalı sarmalayıcılar, belirsiz sahiplik veya bakımsız paketler reddedilebilir.

## İlgili

- [Plugin Kurma ve Yapılandırma](/tr/tools/plugin) — herhangi bir Plugin'in nasıl kurulacağı
- [Plugin Oluşturma](/tr/plugins/building-plugins) — kendinizinkini oluşturun
- [Plugin Manifesti](/tr/plugins/manifest) — manifest şeması

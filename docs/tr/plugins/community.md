---
read_when:
    - Üçüncü taraf OpenClaw Plugin'lerini bulmak istiyorsunuz
    - Kendi Plugin'inizi yayımlamak veya listelemek istiyorsunuz
summary: 'Topluluk tarafından sürdürülen OpenClaw Plugin''leri: göz atın, yükleyin ve kendinizinkini gönderin'
title: Topluluk Pluginleri
x-i18n:
    generated_at: "2026-05-10T19:45:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Topluluk Plugin'leri, OpenClaw'ı yeni kanallar, araçlar, sağlayıcılar veya diğer
yeteneklerle genişleten üçüncü taraf paketlerdir. Topluluk tarafından oluşturulur
ve bakımı yapılır; genellikle [ClawHub](/tr/clawhub) üzerinde yayımlanır ve tek bir
komutla kurulabilir. ClawHub paket kurulumları yayına alınırken çıplak paket
belirtimleri için Npm başlatma varsayılanı olmaya devam eder.

ClawHub, topluluk Plugin'leri için kanonik keşif yüzeyidir. Plugin'inizi
keşfedilebilir kılmak için yalnızca buraya eklemek amacıyla dokümantasyon PR'ları
açmayın; bunun yerine ClawHub'da yayımlayın.

```bash
openclaw plugins install clawhub:<package-name>
```

npm'de barındırılan paketler için `openclaw plugins install <package-name>` kullanın.

## Listelenen Plugin'ler

### Apify

20.000'den fazla hazır kazıyıcıyla herhangi bir web sitesinden veri kazıyın.
Temsilcinizin yalnızca isteyerek Instagram, Facebook, TikTok, YouTube, Google
Maps, Google Search, e-ticaret siteleri ve daha fazlasından veri çıkarmasını
sağlayın.

- **npm:** `@apify/apify-openclaw-plugin`
- **depo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server konuşmaları için bağımsız OpenClaw köprüsü. Bir sohbeti bir
Codex iş parçacığına bağlayın, onunla düz metin kullanarak konuşun ve sürdürme,
planlama, inceleme, model seçimi, sıkıştırma ve daha fazlası için sohbete özgü
komutlarla kontrol edin.

- **npm:** `openclaw-codex-app-server`
- **depo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream modunu kullanan kurumsal robot entegrasyonu. Herhangi bir DingTalk
istemcisi üzerinden metin, resim ve dosya mesajlarını destekler.

- **npm:** `@largezhou/ddingtalk`
- **depo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw için kayıpsız bağlam yönetimi Plugin'i. Artımlı sıkıştırma ile DAG
tabanlı konuşma özetleme; token kullanımını azaltırken tam bağlam doğruluğunu
korur.

- **npm:** `@martian-engineering/lossless-claw`
- **depo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Temsilci izlerini Opik'e dışa aktaran resmi Plugin. Temsilci davranışını,
maliyeti, token'ları, hataları ve daha fazlasını izleyin.

- **npm:** `@opik/opik-openclaw`
- **depo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw temsilcinize gerçek zamanlı dudak senkronizasyonu, duygu ifadeleri ve
metinden konuşmaya özellikleriyle bir Live2D avatarı verin. Yapay zeka varlık
üretimi için oluşturucu araçları ve Prometheus Marketplace'e tek tıkla dağıtımı
içerir. Şu anda alfa aşamasındadır.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **depo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

OpenClaw'ı QQ Bot API üzerinden QQ'ya bağlayın. Özel sohbetleri, grup
bahsetmelerini, kanal mesajlarını ve ses, resim, video ve dosyalar dahil zengin
medyayı destekler.

Mevcut OpenClaw sürümleri QQ Bot'u birlikte paketler. Normal kurulumlar için
[QQ Bot](/tr/channels/qqbot) içindeki paketli kurulumu kullanın; bu harici Plugin'i
yalnızca Tencent tarafından bakımı yapılan bağımsız paketi özellikle istediğinizde
kurun.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **depo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom ekibi tarafından OpenClaw için WeCom kanal Plugin'i. WeCom Bot
WebSocket kalıcı bağlantılarıyla çalışır; doğrudan mesajları ve grup
sohbetlerini, akış yanıtlarını, proaktif mesajlaşmayı, resim/dosya işlemeyi,
Markdown biçimlendirmeyi, yerleşik erişim denetimini ve doküman/toplantı/mesajlaşma
Skills'lerini destekler.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **depo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Tencent Yuanbao ekibi tarafından OpenClaw için Yuanbao kanal Plugin'i. WebSocket
kalıcı bağlantılarıyla çalışır; doğrudan mesajları ve grup sohbetlerini, akış
yanıtlarını, proaktif mesajlaşmayı, resim/dosya/ses/video işlemeyi, Markdown
biçimlendirmeyi, yerleşik erişim denetimini ve eğik çizgi komut menülerini
destekler.

- **npm:** `openclaw-plugin-yuanbao`
- **depo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Plugin'inizi gönderin

Yararlı, belgelenmiş ve işletmesi güvenli topluluk Plugin'lerini memnuniyetle
karşılıyoruz.

<Steps>
  <Step title="ClawHub veya npm üzerinde yayımlayın">
    Plugin'iniz `openclaw plugins install \<package-name\>` ile kurulabilir olmalıdır.
    Özellikle yalnızca npm dağıtımına ihtiyacınız yoksa [ClawHub](/tr/clawhub)
    üzerinde yayımlayın.
    Tam kılavuz için [Plugin Oluşturma](/tr/plugins/building-plugins) bölümüne bakın.

  </Step>

  <Step title="GitHub üzerinde barındırın">
    Kaynak kod, kurulum dokümantasyonu ve issue izleyicisi bulunan herkese açık
    bir depoda olmalıdır.

  </Step>

  <Step title="Dokümantasyon PR'larını yalnızca kaynak dokümantasyon değişiklikleri için kullanın">
    Plugin'inizi keşfedilebilir kılmak için dokümantasyon PR'ına ihtiyacınız yoktur.
    Bunun yerine ClawHub'da yayımlayın.

    Yalnızca OpenClaw'ın kaynak dokümantasyonunda gerçekten içerik değişikliği
    gerektiğinde, örneğin kurulum yönergelerini düzeltmek veya ana dokümantasyon
    setine ait çapraz depo dokümantasyonu eklemek için dokümantasyon PR'ı açın.

  </Step>
</Steps>

## Kalite çıtası

| Gereksinim                  | Nedeni                                             |
| --------------------------- | -------------------------------------------------- |
| ClawHub veya npm üzerinde yayımlanmış | Kullanıcıların `openclaw plugins install` komutunun çalışmasına ihtiyacı vardır |
| Herkese açık GitHub deposu  | Kaynak incelemesi, issue takibi, şeffaflık         |
| Kurulum ve kullanım dokümantasyonu | Kullanıcıların nasıl yapılandıracağını bilmesi gerekir |
| Aktif bakım                 | Güncel güncellemeler veya duyarlı issue yönetimi   |

Düşük çabalı sarmalayıcılar, belirsiz sahiplik veya bakımı yapılmayan paketler reddedilebilir.

## İlgili

- [Plugin'leri Kurma ve Yapılandırma](/tr/tools/plugin) — herhangi bir Plugin nasıl kurulur
- [Plugin Oluşturma](/tr/plugins/building-plugins) — kendinizinkini oluşturun
- [Plugin Manifesti](/tr/plugins/manifest) — manifest şeması

---
read_when:
    - Üçüncü taraf OpenClaw Plugin'leri bulmak istiyorsunuz
    - Kendi Plugin'inizi yayımlamak veya listelemek istiyorsunuz
summary: 'Topluluk tarafından sürdürülen OpenClaw Plugin''leri: göz atın, kurun ve kendinizinkini gönderin'
title: Topluluk Plugin'leri
x-i18n:
    generated_at: "2026-04-24T09:21:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Topluluk Plugin'leri, OpenClaw'ı yeni
kanallar, araçlar, sağlayıcılar veya diğer yeteneklerle genişleten üçüncü taraf paketlerdir. Topluluk tarafından geliştirilir ve sürdürülür,
[ClawHub](/tr/tools/clawhub) veya npm üzerinde yayımlanır ve
tek bir komutla kurulabilir.

ClawHub, topluluk Plugin'leri için standart keşif yüzeyidir. Sadece keşfedilebilirlik için Plugin'inizi buraya eklemek amacıyla
yalnızca belgelere yönelik PR'ler açmayın; bunun yerine onu
ClawHub'da yayımlayın.

```bash
openclaw plugins install <package-name>
```

OpenClaw önce ClawHub'ı denetler ve otomatik olarak npm'e geri döner.

## Listelenen Plugin'ler

### Apify

20.000+ hazır scraper ile herhangi bir web sitesinden veri kazıyın. Aracınızın
Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, e-ticaret siteleri ve daha fazlasından veri çıkarmasını sadece sorarak sağlayın.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server konuşmaları için bağımsız OpenClaw köprüsü. Bir sohbeti
bir Codex iş parçacığına bağlayın, onunla düz metinle konuşun ve sürdürme,
planlama, inceleme, model seçimi, Compaction ve daha fazlası için sohbete yerel
komutlarla onu denetleyin.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream modu kullanan kurumsal robot entegrasyonu. Metin, görseller ve
dosya mesajlarını herhangi bir DingTalk istemcisi üzerinden destekler.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw için Lossless Context Management Plugin'i. DAG tabanlı konuşma
özetleme ve artımlı Compaction — token kullanımını azaltırken
tam bağlam doğruluğunu korur.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Aracı izlerini Opik'e aktaran resmi Plugin. Aracı davranışını,
maliyeti, token'ları, hataları ve daha fazlasını izleyin.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw aracınıza gerçek zamanlı dudak senkronizasyonu, duygu
ifadeleri ve metinden konuşmaya özellikleri olan bir Live2D avatar verin. AI varlık oluşturma
ve Prometheus Marketplace'e tek tıkla dağıtım için oluşturucu araçları içerir. Şu anda alfa aşamasındadır.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

OpenClaw'ı QQ Bot API üzerinden QQ'ya bağlayın. Özel sohbetleri, grup
bahsetmelerini, kanal mesajlarını ve ses, görsel, video
ve dosyalar dahil zengin medyayı destekler.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom ekibi tarafından geliştirilen OpenClaw için WeCom kanal Plugin'i. WeCom Bot WebSocket kalıcı bağlantılarıyla
çalışır; doğrudan mesajları ve grup
sohbetlerini, akış yanıtlarını, proaktif mesajlaşmayı, görsel/dosya işlemeyi, Markdown
biçimlendirmesini, yerleşik erişim denetimini ve belge/toplantı/mesajlaşma Skills'ini destekler.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Plugin'inizi gönderin

Yararlı, belgelenmiş ve işletilmesi güvenli topluluk Plugin'lerini memnuniyetle karşılıyoruz.

<Steps>
  <Step title="ClawHub veya npm üzerinde yayımlayın">
    Plugin'iniz `openclaw plugins install \<package-name\>` ile kurulabilir olmalıdır.
    [ClawHub](/tr/tools/clawhub) üzerinde yayımlayın (tercih edilir) veya npm kullanın.
    Tam kılavuz için bkz. [Plugin oluşturma](/tr/plugins/building-plugins).

  </Step>

  <Step title="GitHub üzerinde barındırın">
    Kaynak kod, kurulum belgeleri ve sorun
    izleyicisi olan herkese açık bir depoda olmalıdır.

  </Step>

  <Step title="Docs PR'lerini yalnızca kaynak belge değişiklikleri için kullanın">
    Plugin'inizi keşfedilebilir yapmak için bir docs PR'sine ihtiyacınız yok. Bunun yerine onu
    ClawHub üzerinde yayımlayın.

    Bir docs PR'si yalnızca OpenClaw'ın kaynak belgelerinde gerçek bir içerik
    değişikliği gerekiyorsa açın; örneğin kurulum rehberini düzeltmek veya ana belge setine ait olan depolar arası
    belgeleri eklemek gibi.

  </Step>
</Steps>

## Kalite çıtası

| Gereksinim                 | Neden                                          |
| -------------------------- | ---------------------------------------------- |
| ClawHub veya npm üzerinde yayımlanmış | Kullanıcıların `openclaw plugins install` komutunun çalışmasına ihtiyacı var |
| Herkese açık GitHub deposu | Kaynak incelemesi, sorun takibi, şeffaflık     |
| Kurulum ve kullanım belgeleri | Kullanıcıların bunu nasıl yapılandıracağını bilmesi gerekir |
| Aktif bakım                | Son güncellemeler veya duyarlı sorun işleme    |

Düşük çabalı sarmalayıcılar, belirsiz sahiplik veya bakımsız paketler reddedilebilir.

## İlgili

- [Plugin kurma ve yapılandırma](/tr/tools/plugin) — herhangi bir Plugin nasıl kurulur
- [Plugin oluşturma](/tr/plugins/building-plugins) — kendinizinkini oluşturun
- [Plugin Manifest](/tr/plugins/manifest) — manifest şeması

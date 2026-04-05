---
read_when:
    - Üçüncü taraf OpenClaw eklentileri bulmak istiyorsunuz
    - Kendi eklentinizi yayımlamak veya listelemek istiyorsunuz
summary: 'Topluluk tarafından sürdürülen OpenClaw eklentileri: göz atın, yükleyin ve kendinizinkini gönderin'
title: Topluluk Eklentileri
x-i18n:
    generated_at: "2026-04-05T14:01:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01804563a63399fe564b0cd9b9aadef32e5211b63d8467fdbbd1f988200728de
    source_path: plugins/community.md
    workflow: 15
---

# Topluluk Eklentileri

Topluluk eklentileri, OpenClaw'ı yeni
kanallar, araçlar, sağlayıcılar veya diğer yeteneklerle genişleten üçüncü taraf paketlerdir. Bunlar topluluk tarafından geliştirilir ve sürdürülür,
[ClawHub](/tools/clawhub) veya npm üzerinde yayımlanır ve
tek bir komutla yüklenebilir.

ClawHub, topluluk eklentileri için kanonik keşif yüzeyidir. Eklentinizi burada keşfedilebilir kılmak için yalnızca belge odaklı PR'ler açmayın;
bunun yerine ClawHub üzerinde yayımlayın.

```bash
openclaw plugins install <package-name>
```

OpenClaw önce ClawHub'ı kontrol eder ve ardından otomatik olarak npm'e geri döner.

## Listelenen eklentiler

### Codex App Server Bridge

Codex App Server konuşmaları için bağımsız OpenClaw köprüsü. Bir sohbeti
bir Codex ileti dizisine bağlayın, onunla düz metinle konuşun ve sürdürme, planlama, inceleme, model seçimi, sıkıştırma ve daha fazlası için yerel sohbet komutlarıyla kontrol edin.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream modunu kullanan kurumsal robot entegrasyonu. Herhangi bir DingTalk istemcisi üzerinden metin, görsel ve
dosya mesajlarını destekler.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw için Lossless Context Management eklentisi. DAG tabanlı konuşma
özetleme ve artımlı sıkıştırma — token kullanımını azaltırken
tam bağlam doğruluğunu korur.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Ajan izlerini Opik'e aktaran resmi eklenti. Ajan davranışını,
maliyeti, tokenları, hataları ve daha fazlasını izleyin.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

OpenClaw'ı QQ Bot API üzerinden QQ'ya bağlayın. Özel sohbetleri, grup
bahsetmelerini, kanal mesajlarını ve ses, görseller, videolar
ve dosyalar dahil zengin medyayı destekler.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom ekibi tarafından geliştirilen OpenClaw için WeCom kanal eklentisi. WeCom Bot WebSocket kalıcı bağlantılarıyla desteklenir;
doğrudan mesajları ve grup sohbetlerini, akış yanıtlarını, proaktif mesajlaşmayı, görsel/dosya işlemeyi, Markdown
biçimlendirmeyi, yerleşik erişim denetimini ve belge/toplantı/mesajlaşma Skills'lerini destekler.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Eklentinizi gönderin

Yararlı, belgelenmiş ve güvenli şekilde işletilebilen topluluk eklentilerini memnuniyetle karşılıyoruz.

<Steps>
  <Step title="ClawHub veya npm üzerinde yayımlayın">
    Eklentiniz `openclaw plugins install \<package-name\>` ile yüklenebilir olmalıdır.
    [ClawHub](/tools/clawhub) üzerinde (tercih edilir) veya npm'de yayımlayın.
    Tam kılavuz için [Eklenti Geliştirme](/plugins/building-plugins) sayfasına bakın.

  </Step>

  <Step title="GitHub üzerinde barındırın">
    Kaynak kodu, kurulum belgeleri ve issue
    takipçisi bulunan herkese açık bir depoda olmalıdır.

  </Step>

  <Step title="Belge PR'lerini yalnızca kaynak belge değişiklikleri için kullanın">
    Eklentinizi keşfedilebilir kılmak için bir belge PR'sine ihtiyacınız yok. Bunun yerine
    ClawHub üzerinde yayımlayın.

    Yalnızca OpenClaw'ın kaynak belgelerinde gerçek bir içerik
    değişikliği gerekiyorsa belge PR'si açın; örneğin kurulum yönergelerini düzeltmek veya ana belge kümesine ait depolar arası
    belgeler eklemek gibi.

  </Step>
</Steps>

## Kalite ölçütü

| Gereksinim                  | Neden                                         |
| --------------------------- | --------------------------------------------- |
| ClawHub veya npm üzerinde yayımlanmış | Kullanıcıların `openclaw plugins install` komutunun çalışmasına ihtiyacı var |
| Herkese açık GitHub deposu  | Kaynak incelemesi, issue takibi, şeffaflık    |
| Kurulum ve kullanım belgeleri | Kullanıcıların bunu nasıl yapılandıracağını bilmesi gerekir |
| Aktif bakım                 | Yakın tarihli güncellemeler veya duyarlı issue yönetimi |

Düşük çabalı sarmalayıcılar, belirsiz sahiplik veya bakımı yapılmayan paketler reddedilebilir.

## İlgili

- [Eklenti Yükleme ve Yapılandırma](/tools/plugin) — herhangi bir eklenti nasıl yüklenir
- [Eklenti Geliştirme](/plugins/building-plugins) — kendinizinkini oluşturun
- [Eklenti Manifestosu](/plugins/manifest) — manifesto şeması

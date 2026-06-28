---
read_when:
    - Bot tarafından yazılan kanal mesajlarını yapılandırma
    - Botlar arası döngü korumasını ayarlama
sidebarTitle: Bot loop protection
summary: Bot'tan bot'a döngü koruması varsayılanları ve kanal geçersiz kılmaları
title: Bot döngüsü koruması
x-i18n:
    generated_at: "2026-06-28T00:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Bot döngüsü koruması

OpenClaw, `allowBots` desteği olan kanallarda diğer botlar tarafından yazılan mesajları kabul edebilir.
Bu yol etkinleştirildiğinde, çift döngüsü koruması iki bot kimliğinin
süresiz olarak birbirine yanıt vermesini önler.

Koruma, çekirdek gelen yanıt çalıştırıcısı tarafından uygulanır. Destekleyen her kanal
kendi gelen olayını genel olgulara eşler: hesap veya kapsam, konuşma kimliği,
gönderen bot kimliği ve alıcı bot kimliği. Ardından çekirdek katılımcı çiftini her iki
yönde izler, kayan pencere bütçesi uygular ve bütçe aşıldıktan sonra çifti bir
bekleme süresi boyunca bastırır.

## Varsayılanlar

Çift döngüsü koruması, bir kanal bot tarafından yazılmış mesajların
dispatch'e ulaşmasına izin verdiğinde aktiftir. Yerleşik varsayılanlar şunlardır:

- `maxEventsPerWindow: 20` - bir bot çifti pencere içinde 20 olay alışverişi yapabilir
- `windowSeconds: 60` - kayan pencere uzunluğu
- `cooldownSeconds: 60` - çift bütçeyi aştıktan sonraki bastırma süresi

Koruma normal insan tarafından yazılmış mesajları, tek botlu dağıtımları,
kendi mesajını filtrelemeyi veya bütçenin altında kalan tek seferlik bot yanıtlarını etkilemez.

## Paylaşılan varsayılanları yapılandırma

Destekleyen her kanala aynı tabanı vermek için `channels.defaults.botLoopProtection` değerini bir kez ayarlayın.
Kanal ve hesap geçersiz kılmaları tek tek yüzeyleri yine de ayarlayabilir.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

`enabled: false` değerini yalnızca kanal politikanız otomatik bastırma olmadan
botlar arası konuşmalara bilerek izin verdiğinde ayarlayın.

## Kanal veya hesap başına geçersiz kılma

Destekleyen kanallar kendi yapılandırmalarını paylaşılan varsayılanın üzerine katmanlar. Öncelik sırası şöyledir:

- `channels.<channel>.<room-or-space>.botLoopProtection`, kanal konuşma başına geçersiz kılmaları desteklediğinde
- `channels.<channel>.accounts.<account>.botLoopProtection`, kanal hesapları desteklediğinde
- `channels.<channel>.botLoopProtection`, kanal üst düzey varsayılanları desteklediğinde
- `channels.defaults.botLoopProtection`
- yerleşik varsayılanlar

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
  },
}
```

## Kanal desteği

- Discord: yerel `author.bot` olguları; Discord hesabı, kanal ve bot çiftine göre anahtarlanır.
- Slack: kabul edilen bot tarafından yazılmış mesajlar için yerel `bot_id` olguları; Slack hesabı, kanal ve bot çiftine göre anahtarlanır.
- Matrix: yapılandırılmış Matrix bot hesapları; Matrix hesabı, oda ve yapılandırılmış bot çiftine göre anahtarlanır.
- Google Chat: kabul edilen bot tarafından yazılmış mesajlar için yerel `sender.type=BOT` olguları; hesap, alan ve bot çiftine göre anahtarlanır.

Güvenilir bir gelen bot kimliği sunmayan kanallar normal kendi mesajı ve erişim politikası
filtrelerini kullanmaya devam eder. Bot çiftindeki her iki katılımcıyı da tanımlayabilene
kadar bu korumaya dahil olmamalıdırlar.

Plugin uygulama ayrıntıları için [SDK çalışma zamanı](/tr/plugins/sdk-runtime#reusable-runtime-utilities) bölümüne bakın.

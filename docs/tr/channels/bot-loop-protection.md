---
read_when:
    - Bot tarafından oluşturulan kanal mesajlarını yapılandırma
    - Botlar arası döngü korumasını ayarlama
sidebarTitle: Bot loop protection
summary: Botlar arası döngü koruması varsayılanları ve kanal geçersiz kılmaları
title: Bot döngüsü koruması
x-i18n:
    generated_at: "2026-07-12T11:28:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw, `allowBots` desteği bulunan kanallarda diğer botlar tarafından yazılan mesajları kabul edebilir. Bu yol etkinleştirildiğinde, bot çifti döngü koruması iki bot kimliğinin birbirine süresiz olarak yanıt vermesini önler.

Koruma, çekirdek gelen yanıt yürütücüsü tarafından uygulanır. Destekleyen her kanal, gelen olayını genel olgulara eşler: hesap veya kapsam, konuşma kimliği, gönderen bot kimliği ve alıcı bot kimliği. Çekirdek, katılımcı çiftini her iki yönde de izler (A'dan B'ye ve B'den A'ya aynı çift olarak sayılır), kayan pencere bütçesi uygular ve bütçe aşıldıktan sonra bekleme süresi boyunca çifti engeller.

## Varsayılanlar

Bir kanal, botlar tarafından yazılan mesajların dağıtıma ulaşmasına izin verdiğinde bot çifti döngü koruması etkindir. Yerleşik varsayılanlar:

| Anahtar              | Varsayılan | Anlamı                                                     |
| -------------------- | ---------- | ---------------------------------------------------------- |
| `enabled`            | `true`     | Destekleyen kanallar için koruma etkindir.                  |
| `maxEventsPerWindow` | `20`       | Bir bot çiftinin pencere içinde paylaşabileceği olay sayısı. |
| `windowSeconds`      | `60`       | Kayan pencerenin uzunluğu.                                 |
| `cooldownSeconds`    | `60`       | Çift bütçeyi aştıktan sonraki engelleme süresi.             |

Koruma; insanlar tarafından yazılan mesajları, tek botlu dağıtımları, kendi mesajlarını filtrelemeyi veya bütçenin altında kalan bot yanıtlarını etkilemez.

## Paylaşılan varsayılanları yapılandırma

Destekleyen her kanala aynı temel ayarları vermek için `channels.defaults.botLoopProtection` değerini bir kez ayarlayın. Kanal, hesap ve oda geçersiz kılmalarıyla ayrı yüzeylerin ayarları yine değiştirilebilir.

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

Yalnızca kanal politikanız botlar arası konuşmalara otomatik engelleme olmadan kasıtlı olarak izin veriyorsa `enabled: false` ayarını kullanın.

## Kanal, hesap veya oda bazında geçersiz kılma

Destekleyen kanallar, kendi yapılandırmalarını anahtar bazında paylaşılan varsayılanın üzerine uygular. Öncelik sırası, en dar kapsamdan başlayarak şöyledir:

1. Kanal konuşma bazında geçersiz kılmaları desteklediğinde `channels.<channel>.<room-or-space>.botLoopProtection`
2. Kanal hesapları desteklediğinde `channels.<channel>.accounts.<account>.botLoopProtection`
3. Kanal üst düzey varsayılanları desteklediğinde `channels.<channel>.botLoopProtection`
4. `channels.defaults.botLoopProtection`
5. yerleşik varsayılanlar

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
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Kanal desteği

- Discord: Discord hesabı, kanal ve bot çiftine göre anahtarlanan yerel `author.bot` olguları.
- Google Chat: kabul edilen ve botlar tarafından yazılan mesajlar için hesap, alan ve bot çiftine göre anahtarlanan yerel `sender.type=BOT` olguları.
- Matrix: Matrix hesabı, oda ve yapılandırılmış bot çiftine göre anahtarlanan yapılandırılmış Matrix bot hesapları.
- Slack: kabul edilen ve botlar tarafından yazılan mesajlar için Slack hesabı, kanal ve bot çiftine göre anahtarlanan yerel `bot_id` olguları.

Güvenilir bir gelen bot kimliği sunmayan kanallar, normal kendi mesajını ve erişim politikası filtrelerini kullanmaya devam eder. Bot çiftindeki her iki katılımcıyı da tanımlayabilene kadar bu korumayı etkinleştirmemelidirler.

Plugin uygulama ayrıntıları için [SDK çalışma zamanı](/tr/plugins/sdk-runtime#reusable-runtime-utilities) bölümüne bakın.

---
read_when:
    - Her zaman açık grup veya kanal odalarını yapılandırma
    - Agentin, nihai metni otomatik olarak göndermeden odadaki sohbeti izlemesini istiyorsunuz.
    - Görünür bir oda mesajı olmadan yazma durumunda ve token kullanımında hata ayıklama
sidebarTitle: Ambient room events
summary: Desteklenen grup odaları, ajan mesaj aracıyla gönderim yapmadığı sürece sessiz bağlam sağlasın
title: Ortam oda etkinlikleri
x-i18n:
    generated_at: "2026-07-12T12:03:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Ortam oda etkinlikleri, OpenClaw'un bahsedilmediği grup veya kanal sohbetlerini sessiz bağlam olarak işlemesini sağlar. Ajan belleği ve oturum durumunu güncelleyebilir, ancak ajan açıkça `message` aracını çağırmadıkça oda sessiz kalır.

Sürekli etkin grup sohbetleri için `messages.groupChat.unmentionedInbound: "room_event"` ile `messages.groupChat.visibleReplies: "message_tool"` ayarlarını birlikte kullanın. Ajan dinler, yanıtın ne zaman yararlı olacağına karar verir ve artık eski `NO_REPLY` yanıt istemi kalıbına ihtiyaç duymaz.

Şu anda desteklenenler: Discord sunucu kanalları, Slack kanalları ve özel kanalları, Slack çok kişili doğrudan mesajları ve Telegram grupları veya süper grupları. Diğer grup kanalları, kanal sayfalarında ortam oda etkinliklerini destekledikleri belirtilmediği sürece mevcut grup davranışlarını korur.

## Önerilen kurulum

Genel grup sohbeti davranışını ayarlayın:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Ardından o oda için bahsetme zorunluluğunu devre dışı bırakarak odayı sürekli etkin hâle getirin. Odanın yine de normal `groupPolicy`, oda izin listesi ve gönderen izin listesi denetimlerinden geçmesi gerekir.

Yapılandırmayı kaydettikten sonra Gateway, `messages` ayarlarını çalışırken uygular. Yalnızca dosya izleme veya yapılandırmayı yeniden yükleme devre dışıysa (`gateway.reload.mode: "off"`) yeniden başlatın.

## Neler değişir?

`messages.groupChat.unmentionedInbound: "room_event"` ile:

- izin verilen, bahsetme içermeyen grup veya kanal mesajları sessiz oda etkinliklerine dönüşür
- bahsetme içeren mesajlar kullanıcı istekleri olarak kalır
- metin denetim komutları ve yerel komutlar kullanıcı istekleri olarak kalır
- iptal veya durdurma istekleri kullanıcı istekleri olarak kalır
- doğrudan mesajlar kullanıcı istekleri olarak kalır

Oda etkinlikleri katı görünür teslim kullanır. Son asistan metni özeldir. Ajanın odada gönderi paylaşmak için `message(action=send)` çağrısı yapması gerekir.

Yazıyor göstergeleri ve yaşam döngüsü durum tepkileri oda etkinliklerinde gösterilmez. Tek açık alındı istisnası, yapılandırılan alındı tepkisini gönderen `messages.ackReactionScope: "all"` ayarıdır; odanın tamamen sessiz kalması gerektiğinde daha dar bir kapsam veya `"off"` kullanın.

## Discord örneği

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Yalnızca bir kanalın ortam bağlamı olarak kullanılması gerekiyorsa kanal başına Discord yapılandırmasını kullanın. `groupPolicy: "allowlist"` altında kanalı listelemek ona izin verilmesini sağlar (`enabled: false` bir girdiyi devre dışı bırakır):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Slack örneği

Slack kanal izin listelerinde öncelik kimliklerdedir. `#kanal-adı` değil, `C12345678` gibi kanal kimliklerini kullanın. Kanalı `channels.slack.channels` altında listelemek ona izin verilmesini sağlar (`enabled: false` bir girdiyi devre dışı bırakır):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram örneği

Telegram gruplarında botun normal grup mesajlarını görebilmesi gerekir. `requireMention: false` ise BotFather gizlilik modunu devre dışı bırakın veya tüm grup trafiğini bota ileten başka bir Telegram kurulumu kullanın.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Telegram grup kimlikleri genellikle `-1001234567890` gibi negatif sayılardır. `openclaw logs --follow` çıktısından `chat.id` değerini okuyun, bir grup mesajını kimlik yardımcı botuna iletin veya Bot API `getUpdates` çıktısını inceleyin.

## Ajana özgü politika

Birden fazla ajan aynı odayı paylaşıyor ancak yalnızca birinin bahsetme içermeyen sohbetleri ortam bağlamı olarak ele alması gerekiyorsa ajan geçersiz kılmasını kullanın:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

Ajana özgü `agents.list[].groupChat.unmentionedInbound` değeri, söz konusu ajan için `messages.groupChat.unmentionedInbound` değerini geçersiz kılar.

## Görünür yanıt modları

`messages.groupChat.visibleReplies`, normal grup/kanal kullanıcı istekleri için varsayılan olarak `"automatic"` değerini kullanır. Son asistan metninin açık bir mesaj aracı çağrısı olmadan görünür biçimde gönderilmesi gerekiyorsa bu varsayılanı koruyun.

Sürekli etkin ortam odaları için, özellikle GPT-5.6 Sol gibi en yeni nesil, araç kullanımında güvenilir modellerle `messages.groupChat.visibleReplies: "message_tool"` hâlâ önerilir. Bu ayar, ajanın mesaj aracını çağırarak ne zaman konuşacağına karar vermesini sağlar. Model aracı çağırmadan son metni döndürürse OpenClaw bu son metni özel tutar ve engellenen teslim meta verilerini günlüğe kaydeder.

Diğer grup istekleri otomatik yanıtları kullansa bile oda etkinlikleri katı davranışını korur. Bahsetme içermeyen ortam oda etkinliklerinde görünür çıktı için her zaman `message(action=send)` gerekir.

## Geçmiş

`messages.groupChat.historyLimit`, genel grup geçmişi varsayılanını belirler (ayarlanmadığında 50; pozitif bir tam sayı olmalıdır). Kanallar bunu `channels.<channel>.historyLimit` ile geçersiz kılabilir ve bazı kanallar hesap başına geçmiş sınırlarını da destekler. Söz konusu kanal için grup geçmişi bağlamını devre dışı bırakmak üzere kanal düzeyindeki `historyLimit` değerini `0` olarak ayarlayın.

Oda etkinliğini destekleyen kanallar, yakın tarihli ortam oda mesajlarını bağlam olarak tutar. Telegram, `historyLimit` ile sınırlandırılan ve grup başına sürekli etkin olan kayan bir pencere tutar; kullanıcı isteği dönüşleri botun kaydedilen son yanıtından sonraki girdileri seçerken oda etkinliği dönüşleri, modelin kendi yakın tarihli gönderilerini görebilmesi için yakın tarihli pencerenin tamamını alır. Kullanımdan kaldırılan Telegram `includeGroupHistoryContext` mod anahtarı, `openclaw doctor --fix` tarafından kaldırılır.

## Sorun giderme

Odada yazıyor göstergesi veya token kullanımı görünüyor ancak görünür bir mesaj görünmüyorsa:

1. Odaya kanal izin listesi ve gönderen izin listesi tarafından izin verildiğini doğrulayın.
2. Beklediğiniz oda düzeyinde `requireMention: false` ayarlandığını doğrulayın.
3. `messages.groupChat.unmentionedInbound` veya ajan geçersiz kılmasının `"room_event"` olup olmadığını kontrol edin.
4. Engellenen son yük meta verileri veya `didSendViaMessagingTool: false` için günlükleri inceleyin.
5. Normal grup isteklerinde son yanıtların otomatik olarak gönderilmesini istiyorsanız `messages.groupChat.visibleReplies: "automatic"` ayarını koruyun veya geri yükleyin. `message_tool` kullanan ortam odalarında araçları güvenilir biçimde çağıran bir model/çalışma zamanı kullanın.

Telegram ortam odaları hiç tetiklenmiyorsa BotFather gizlilik modunu kontrol edin ve Gateway'in normal grup mesajlarını aldığını doğrulayın.

Slack ortam odaları tetiklenmiyorsa kanal anahtarının Slack kanal kimliği olduğunu ve uygulamanın söz konusu oda türü için geçmiş kapsamına sahip olduğunu doğrulayın: `channels:history` (herkese açık), `groups:history` (özel) veya `mpim:history` (çok kişili doğrudan mesajlar).

## İlgili

- [Gruplar](/tr/channels/groups)
- [Discord](/tr/channels/discord)
- [Slack](/tr/channels/slack)
- [Telegram](/tr/channels/telegram)
- [Kanal sorunlarını giderme](/tr/channels/troubleshooting)
- [Kanal yapılandırması başvurusu](/tr/gateway/config-channels)

---
read_when:
    - Her zaman açık grup veya kanal odalarını yapılandırma
    - Ajanın son metni otomatik olarak göndermeden oda sohbetini izlemesini istiyorsunuz
    - Görünür oda mesajı olmadan yazma ve token kullanımında hata ayıklama
sidebarTitle: Ambient room events
summary: Desteklenen grup odalarının, ajan ileti aracıyla göndermedikçe sessiz bağlam sağlamasına izin ver
title: Ortam odası olayları
x-i18n:
    generated_at: "2026-06-28T00:11:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Ortam oda olayları, OpenClaw'ın bahsedilmeyen grup veya kanal sohbetlerini sessiz bağlam olarak işlemesini sağlar. Agent belleği ve oturum durumunu güncelleyebilir, ancak agent açıkça `message` aracını çağırmadıkça oda sessiz kalır.

Sürekli açık grup sohbetleri için önerilen mod budur: `messages.groupChat.unmentionedInbound: "room_event"` ile `messages.groupChat.visibleReplies: "message_tool"` ayarlarını birlikte kullanın. Agent dinlemeli, ne zaman yanıtın yararlı olduğuna karar vermeli ve eski `NO_REPLY` yanıtlama prompt deseninden kaçınmalıysa bunu kullanın.

Bugün desteklenenler: Discord sunucu kanalları, Slack kanalları ve özel kanallar, Slack çok kişili DM'leri ve Telegram grupları veya süper grupları. Diğer grup kanalları, kanal sayfaları ortam oda olaylarını desteklediklerini söylemediği sürece mevcut grup davranışlarını korur.

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

Ardından oda için bahsetme koşulunu devre dışı bırakarak odanın kendisini sürekli açık olarak yapılandırın. Kanalın yine de normal `groupPolicy`, oda izin listesi ve gönderen izin listesi tarafından izinli olması gerekir.

Yapılandırmayı kaydettikten sonra Gateway `messages` ayarlarını sıcak yeniden yükler. Yalnızca dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

## Ne değişir

`messages.groupChat.unmentionedInbound: "room_event"` ile:

- bahsedilmeyen izinli grup veya kanal mesajları sessiz oda olaylarına dönüşür
- bahsedilen mesajlar kullanıcı istekleri olarak kalır
- metin komutları ve yerel komutlar kullanıcı istekleri olarak kalır
- iptal etme veya durdurma istekleri kullanıcı istekleri olarak kalır
- doğrudan mesajlar kullanıcı istekleri olarak kalır

Oda olayları katı görünür teslimat kullanır. Son asistan metni özeldir. Agent odada gönderi paylaşmak için `message(action=send)` çağırmalıdır.

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

Yalnızca bir kanal ortam olmalıysa kanal başına Discord yapılandırmasını kullanın:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
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

Slack kanal izin listeleri önce ID kullanır. `#channel-name` yerine `C12345678` gibi kanal ID'leri kullanın.

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
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram örneği

Telegram grupları için botun normal grup mesajlarını görebilmesi gerekir. `requireMention: false` ise BotFather gizlilik modunu devre dışı bırakın veya tam grup trafiğini bota ileten başka bir Telegram kurulumu kullanın.

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

Telegram grup ID'leri genellikle `-1001234567890` gibi negatif sayılardır. `chat.id` değerini `openclaw logs --follow` üzerinden okuyun, bir grup mesajını ID yardımcı botuna iletin veya Bot API `getUpdates` çıktısını inceleyin.

## Agent'a özgü politika

Birkaç agent aynı odayı paylaşıyor ancak yalnızca biri bahsedilmeyen sohbeti ortam bağlamı olarak ele almalıysa bir agent geçersiz kılması kullanın:

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

Agent'a özgü `agents.list[].groupChat.unmentionedInbound` değeri, o agent için `messages.groupChat.unmentionedInbound` değerini geçersiz kılar.

## Görünür yanıt modları

`messages.groupChat.visibleReplies`, normal grup/kanal kullanıcı istekleri için varsayılan olarak `"automatic"` değerine ayarlanır. Son asistan metninin açık bir mesaj aracı çağrısı gerektirmeden görünür şekilde gönderilmesini istiyorsanız bu varsayılanı koruyun.

Ortam sürekli açık odaları için, özellikle GPT 5.5 gibi en yeni nesil, araç konusunda güvenilir modellerle `messages.groupChat.visibleReplies: "message_tool"` hâlâ önerilir. Bu, agent'ın mesaj aracını çağırarak ne zaman konuşacağına karar vermesini sağlar. Model aracı çağırmadan son metin döndürürse OpenClaw bu son metni özel tutar ve bastırılmış teslimat meta verilerini günlüğe kaydeder.

Diğer grup istekleri otomatik yanıtlar kullansa bile oda olayları katı kalır. Bahsedilmeyen ortam oda olayları görünür çıktı için yine de `message(action=send)` gerektirir.

## Geçmiş

`messages.groupChat.historyLimit` genel grup geçmişi varsayılanını kontrol eder. Kanallar bunu `channels.<channel>.historyLimit` ile geçersiz kılabilir ve bazı kanallar hesap başına geçmiş sınırlarını da destekler.

Grup geçmişi bağlamını devre dışı bırakmak için `historyLimit: 0` ayarlayın.

Desteklenen oda olayı kanalları, son ortam oda mesajlarını bağlam olarak tutar. Discord, görünür bir Discord gönderimi başarılı olana kadar oda olayı geçmişini tutar; böylece sessiz bağlam mesaj aracı teslimatından önce kaybolmaz.

## Sorun giderme

Oda yazıyor veya token kullanımı gösteriyor ancak görünür mesaj göstermiyorsa:

1. Odanın kanal izin listesi ve gönderen izin listesi tarafından izinli olduğunu doğrulayın.
2. Beklediğiniz oda düzeyinde `requireMention: false` ayarının yapıldığını doğrulayın.
3. `messages.groupChat.unmentionedInbound` veya agent geçersiz kılmasının `"room_event"` olup olmadığını kontrol edin.
4. Bastırılmış son yük meta verileri veya `didSendViaMessagingTool: false` için günlükleri inceleyin.
5. Normal grup istekleri için, son yanıtların otomatik olarak gönderilmesini istiyorsanız `messages.groupChat.visibleReplies: "automatic"` ayarını koruyun veya geri yükleyin. `message_tool` kullanan ortam odaları için araçları güvenilir şekilde çağıran bir model/runtime kullanın.

Telegram ortam odaları hiç tetiklenmiyorsa BotFather gizlilik modunu kontrol edin ve Gateway'in normal grup mesajlarını aldığını doğrulayın.

Slack ortam odaları tetiklenmiyorsa kanal anahtarının Slack kanal ID'si olduğunu ve uygulamanın o oda türü için gerekli `channels:history` veya `groups:history` kapsamına sahip olduğunu doğrulayın.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Discord](/tr/channels/discord)
- [Slack](/tr/channels/slack)
- [Telegram](/tr/channels/telegram)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Kanal yapılandırma başvurusu](/tr/gateway/config-channels)

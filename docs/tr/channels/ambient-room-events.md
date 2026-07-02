---
read_when:
    - Her zaman açık grup veya kanal odalarını yapılandırma
    - Ajanın nihai metni otomatik olarak göndermeden oda sohbetini izlemesini istiyorsunuz
    - Görünür oda mesajı olmadan yazma ve token kullanımında hata ayıklama
sidebarTitle: Ambient room events
summary: Desteklenen grup odalarının, ajan mesaj aracıyla göndermedikçe sessiz bağlam sağlamasına izin ver
title: Ortam odası olayları
x-i18n:
    generated_at: "2026-07-02T17:44:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Ortam oda olayları, OpenClaw’ın bahsedilmemiş grup veya kanal sohbetlerini sessiz bağlam olarak işlemesini sağlar. Aracı belleği ve oturum durumunu güncelleyebilir, ancak aracı açıkça `message` aracını çağırmadıkça oda sessiz kalır.

Her zaman açık grup sohbetleri için önerilen mod budur: `messages.groupChat.unmentionedInbound: "room_event"` ile `messages.groupChat.visibleReplies: "message_tool"` değerlerini birlikte kullanın. Aracının dinlemesi, yanıtın ne zaman yararlı olacağına karar vermesi ve eski `NO_REPLY` yanıtlama istemi kalıbından kaçınması gerektiğinde bunu kullanın.

Bugün desteklenenler: Discord sunucu kanalları, Slack kanalları ve özel kanallar, Slack çok kişili DM’leri ve Telegram grupları veya süper grupları. Diğer grup kanalları, kanal sayfalarında ortam oda olaylarını destekledikleri belirtilmedikçe mevcut grup davranışlarını korur.

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

Ardından o oda için bahsetme kapısını devre dışı bırakarak odanın kendisini her zaman açık olacak şekilde yapılandırın. Kanalın yine de normal `groupPolicy`, oda izin listesi ve gönderen izin listesi tarafından izin verilmiş olması gerekir.

Yapılandırmayı kaydettikten sonra Gateway, `messages` ayarlarını sıcak yeniden yükler. Yalnızca dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

## Neler değişir

`messages.groupChat.unmentionedInbound: "room_event"` ile:

- bahsedilmemiş, izin verilen grup veya kanal mesajları sessiz oda olaylarına dönüşür
- bahsedilen mesajlar kullanıcı isteği olarak kalır
- metin komutları ve yerel komutlar kullanıcı isteği olarak kalır
- iptal veya durdurma istekleri kullanıcı isteği olarak kalır
- doğrudan mesajlar kullanıcı isteği olarak kalır

Oda olayları katı görünür teslim kullanır. Son asistan metni özeldir. Aracının odaya gönderi yapmak için `message(action=send)` çağırması gerekir.

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

Yalnızca bir kanal ortam modunda olmalıysa kanal başına Discord yapılandırmasını kullanın:

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

Slack kanal izin listeleri önce ID kullanır. `#channel-name` yerine `C12345678` gibi kanal ID’leri kullanın.

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

Telegram grup ID’leri genellikle `-1001234567890` gibi negatif sayılardır. `chat.id` değerini `openclaw logs --follow` çıktısından okuyun, bir grup mesajını ID yardımcı botuna yönlendirin veya Bot API `getUpdates` değerini inceleyin.

## Aracıya özel ilke

Birden fazla aracı aynı odayı paylaşıyor ancak yalnızca birinin bahsedilmemiş sohbeti ortam bağlamı olarak ele alması gerekiyorsa aracı geçersiz kılması kullanın:

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

Aracıya özel `agents.list[].groupChat.unmentionedInbound` değeri, o aracı için `messages.groupChat.unmentionedInbound` değerini geçersiz kılar.

## Görünür yanıt modları

`messages.groupChat.visibleReplies`, normal grup/kanal kullanıcı istekleri için varsayılan olarak `"automatic"` değerindedir. Son asistan metninin açık bir mesaj aracı çağrısı gerektirmeden görünür şekilde gönderilmesini istediğinizde bu varsayılanı koruyun.

Ortamda her zaman açık odalar için, özellikle GPT 5.5 gibi en yeni nesil, araç açısından güvenilir modellerle `messages.groupChat.visibleReplies: "message_tool"` hâlâ önerilir. Bu, aracının mesaj aracını çağırarak ne zaman konuşacağına karar vermesini sağlar. Model aracı çağırmadan son metin döndürürse OpenClaw bu son metni özel tutar ve bastırılmış teslim meta verilerini günlüğe kaydeder.

Diğer grup istekleri otomatik yanıtlar kullansa bile oda olayları katı kalır. Bahsedilmemiş ortam oda olayları, görünür çıktı için yine de `message(action=send)` gerektirir.

## Geçmiş

`messages.groupChat.historyLimit`, genel grup geçmişi varsayılanını denetler. Kanallar bunu `channels.<channel>.historyLimit` ile geçersiz kılabilir ve bazı kanallar hesap başına geçmiş sınırlarını da destekler.

Grup geçmişi bağlamını devre dışı bırakmak için `historyLimit: 0` ayarlayın.

Desteklenen oda olayı kanalları, yakın tarihli ortam oda mesajlarını bağlam olarak tutar. Telegram, `historyLimit` ile sınırlanmış, her zaman açık dönen bir grup başına pencere tutar; kullanıcı isteği turları botun son kaydedilmiş yanıtından sonraki girdileri seçerken, oda olayı turları modelin kendi yakın tarihli gönderilerini görebilmesi için tam yakın geçmiş penceresini alır. Kullanımdan kaldırılmış Telegram `includeGroupHistoryContext` mod anahtarı `openclaw doctor --fix` tarafından kaldırılır.

## Sorun giderme

Oda yazıyor göstergesi veya token kullanımı gösteriyor ancak görünür mesaj göstermiyorsa:

1. Odanın kanal izin listesi ve gönderen izin listesi tarafından izinli olduğunu doğrulayın.
2. `requireMention: false` değerinin beklediğiniz oda düzeyinde ayarlandığını doğrulayın.
3. `messages.groupChat.unmentionedInbound` veya aracı geçersiz kılmasının `"room_event"` olup olmadığını kontrol edin.
4. Bastırılmış son yük meta verileri veya `didSendViaMessagingTool: false` için günlükleri inceleyin.
5. Normal grup istekleri için son yanıtların otomatik gönderilmesini istiyorsanız `messages.groupChat.visibleReplies: "automatic"` değerini koruyun veya geri yükleyin. `message_tool` kullanan ortam odaları için araçları güvenilir şekilde çağıran bir model/çalışma zamanı kullanın.

Telegram ortam odaları hiç tetiklenmiyorsa BotFather gizlilik modunu kontrol edin ve Gateway’in normal grup mesajlarını aldığını doğrulayın.

Slack ortam odaları tetiklenmiyorsa kanal anahtarının Slack kanal ID’si olduğunu ve uygulamanın o oda türü için gerekli `channels:history` veya `groups:history` kapsamına sahip olduğunu doğrulayın.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Discord](/tr/channels/discord)
- [Slack](/tr/channels/slack)
- [Telegram](/tr/channels/telegram)
- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Kanal yapılandırma başvurusu](/tr/gateway/config-channels)

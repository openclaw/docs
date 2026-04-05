---
read_when:
    - OpenClaw'ı QQ'ya bağlamak istiyorsanız
    - QQ Bot kimlik bilgisi kurulumu gerekiyorsa
    - QQ Bot grup veya özel sohbet desteği istiyorsanız
summary: QQ Bot kurulumu, yapılandırması ve kullanımı
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T13:44:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot, resmi QQ Bot API'si (WebSocket gateway) üzerinden OpenClaw'a bağlanır. Eklenti; C2C özel sohbeti, grup @messages ve guild kanal mesajlarını zengin medya (görseller, ses, video, dosyalar) ile destekler.

Durum: paketle gelen eklenti. Doğrudan mesajlar, grup sohbetleri, guild kanalları ve medya desteklenir. Reaksiyonlar ve iş parçacıkları desteklenmez.

## Paketle gelen eklenti

Geçerli OpenClaw sürümleri QQ Bot'u paketlenmiş olarak içerir, bu nedenle normal paketlenmiş derlemelerde ayrı bir `openclaw plugins install` adımı gerekmez.

## Kurulum

1. [QQ Open Platform](https://q.qq.com/) adresine gidin ve kaydolmak / oturum açmak için telefonunuzdaki QQ ile QR kodunu tarayın.
2. Yeni bir QQ botu oluşturmak için **Create Bot** seçeneğine tıklayın.
3. Bot ayarları sayfasında **AppID** ve **AppSecret** değerlerini bulun ve kopyalayın.

> AppSecret düz metin olarak saklanmaz — sayfadan kaydetmeden ayrılırsanız yenisini yeniden oluşturmanız gerekir.

4. Kanalı ekleyin:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway'i yeniden başlatın.

Etkileşimli kurulum yolları:

```bash
openclaw channels add
openclaw configure --section channels
```

## Yapılandırma

En az yapılandırma:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Varsayılan hesap ortam değişkenleri:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

Dosya tabanlı AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Notlar:

- Ortam değişkeni yedeği yalnızca varsayılan QQ Bot hesabı için geçerlidir.
- `openclaw channels add --channel qqbot --token-file ...` yalnızca AppSecret sağlar; AppID zaten yapılandırmada veya `QQBOT_APP_ID` içinde ayarlanmış olmalıdır.
- `clientSecret`, yalnızca düz metin bir dizgiyi değil, SecretRef girdisini de kabul eder.

### Çoklu hesap kurulumu

Tek bir OpenClaw örneği altında birden fazla QQ botu çalıştırın:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Her hesap kendi WebSocket bağlantısını başlatır ve bağımsız bir token önbelleğini sürdürür (`appId` ile yalıtılır).

CLI ile ikinci bir bot ekleyin:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Ses (STT / TTS)

STT ve TTS desteği, öncelikli yedekleme kullanan iki seviyeli yapılandırmayı destekler:

| Setting | Eklentiye özel       | Çerçeve yedeği                |
| ------- | -------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Devre dışı bırakmak için herhangi birinde `enabled: false` ayarlayın.

Giden ses yükleme/dönüştürme davranışı `channels.qqbot.audioFormatPolicy` ile de ayarlanabilir:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Hedef biçimler

| Format                     | Açıklama            |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Özel sohbet (C2C)   |
| `qqbot:group:GROUP_OPENID` | Grup sohbeti        |
| `qqbot:channel:CHANNEL_ID` | Guild kanalı        |

> Her botun kendine ait bir kullanıcı OpenID kümesi vardır. Bot A tarafından alınan bir OpenID, Bot B üzerinden mesaj göndermek için **kullanılamaz**.

## Slash komutları

AI kuyruğundan önce yakalanan yerleşik komutlar:

| Command        | Açıklama                              |
| -------------- | ------------------------------------- |
| `/bot-ping`    | Gecikme testi                         |
| `/bot-version` | OpenClaw framework sürümünü gösterir  |
| `/bot-help`    | Tüm komutları listeler                |
| `/bot-upgrade` | QQBot yükseltme kılavuzu bağlantısını gösterir |
| `/bot-logs`    | Son Gateway günlüklerini dosya olarak dışa aktarır |

Kullanım yardımı için herhangi bir komutun sonuna `?` ekleyin (örneğin `/bot-upgrade ?`).

## Sorun giderme

- **Bot "gone to Mars" yanıtı veriyor:** kimlik bilgileri yapılandırılmamış veya Gateway başlatılmamış.
- **Gelen mesaj yok:** `appId` ve `clientSecret` değerlerinin doğru olduğunu ve botun QQ Open Platform üzerinde etkin olduğunu doğrulayın.
- **`--token-file` ile kurulumdan sonra hâlâ yapılandırılmamış görünüyor:** `--token-file` yalnızca AppSecret ayarlar. Yine de yapılandırmada veya `QQBOT_APP_ID` içinde `appId` gerekir.
- **Proaktif mesajlar ulaşmıyor:** kullanıcı yakın zamanda etkileşimde bulunmadıysa QQ, bot tarafından başlatılan mesajları engelleyebilir.
- **Ses çözümlenmiyor:** STT'nin yapılandırıldığından ve sağlayıcının erişilebilir olduğundan emin olun.
